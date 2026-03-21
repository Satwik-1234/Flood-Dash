"""
Pravhatattva — Telemetry Sync Scraper
Runs on GitHub Actions every 15 minutes.
Fetches from Open-Meteo GloFAS (free, no key) and updates mock data files.

Real IMD/CWC require IP whitelisting — those stubs are documented.
GloFAS works immediately with zero credentials.
"""

import requests
import json
import os
import datetime
from pathlib import Path

# ─── PATHS ──────────────────────────────────────────────────────────────────
MOCK_DIR = Path("frontend/public/mock")
MOCK_DIR.mkdir(parents=True, exist_ok=True)

NOW_ISO = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

# ─── STATION DEFINITIONS (Maharashtra focus) ────────────────────────────────
STATIONS = [
    {"station_code": "CWC_BHM_UJN_001", "basin": "Bhima",     "river": "Bhima",
     "station_name": "Ujani Dam", "state": "Maharashtra",
     "lat": 18.06, "lon": 75.12,
     "warning_level_m": 496.0, "danger_level_m": 498.0},
    {"station_code": "CWC_PCG_SHN_001", "basin": "Panchganga","river": "Panchganga",
     "station_name": "Shinnur Bridge", "state": "Maharashtra",
     "lat": 16.70, "lon": 74.24,
     "warning_level_m": 540.0, "danger_level_m": 543.0},
    {"station_code": "CWC_KRS_SNG_002", "basin": "Krishna",   "river": "Krishna",
     "station_name": "Irwin Bridge Sangli", "state": "Maharashtra",
     "lat": 16.85, "lon": 74.56,
     "warning_level_m": 555.0, "danger_level_m": 560.0},
    {"station_code": "CWC_GDV_NSK_003", "basin": "Godavari",  "river": "Godavari",
     "station_name": "Gangapur Dam Nashik", "state": "Maharashtra",
     "lat": 19.99, "lon": 73.79,
     "warning_level_m": 594.0, "danger_level_m": 597.0},
    {"station_code": "CWC_MLA_PNE_004", "basin": "Mutha",     "river": "Mula-Mutha",
     "station_name": "Khadakwasla Dam Pune", "state": "Maharashtra",
     "lat": 18.52, "lon": 73.86,
     "warning_level_m": 558.0, "danger_level_m": 562.0},
]


def fetch_glofas_discharge(lat: float, lon: float) -> dict | None:
    """
    Fetch GloFAS river discharge forecast from Open-Meteo.
    Completely free, no API key, covers all of India.
    Returns 7-day daily forecast with ensemble median.
    """
    url = "https://flood-api.open-meteo.com/v1/flood"
    params = {
        "latitude":  lat,
        "longitude": lon,
        "daily":     "river_discharge,river_discharge_mean,river_discharge_max",
        "forecast_days": 7,
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"  GloFAS fetch failed ({lat},{lon}): {e}")
        return None


def build_cwc_station_entry(station: dict, glofas: dict | None) -> dict:
    """
    Build a CWCStation entry that matches CWCStationSchema exactly.
    Uses GloFAS discharge as a proxy for water level estimation.
    Marks as stale if GloFAS fetch failed.
    """
    is_stale = glofas is None
    discharge_mean = 0.0
    if glofas and "daily" in glofas:
        daily = glofas["daily"]
        values = daily.get("river_discharge_mean") or daily.get("river_discharge") or []
        discharge_mean = float(values[0]) if values else 0.0

    # Estimate water level from discharge using simplified rating relationship
    # Q ~ a*(h-b)^c — simplified linear proxy for display
    base_level = station["warning_level_m"] - 2.0
    estimated_level = round(base_level + (discharge_mean / 800.0) * 3.0, 2)
    estimated_level = max(base_level, min(station["danger_level_m"] + 1.5, estimated_level))

    # Determine trend from first two days of GloFAS
    trend = "STEADY"
    if glofas and "daily" in glofas:
        d = glofas["daily"].get("river_discharge_mean") or []
        if len(d) >= 2:
            if float(d[1]) > float(d[0]) * 1.05:    trend = "RISING"
            elif float(d[1]) < float(d[0]) * 0.95:  trend = "FALLING"

    return {
        **{k: station[k] for k in
           ["station_code","basin","river","station_name","state","lat","lon",
            "warning_level_m","danger_level_m"]},
        "timestamp":             NOW_ISO,
        "current_water_level_m": estimated_level,
        "trend":                 trend,
        "is_stale":              is_stale,
        "glofas_discharge_m3s":  round(discharge_mean, 1),
    }


def fetch_imd_warnings_mock() -> list:
    """
    IMD district warnings API requires government IP whitelisting.
    Until clearance is obtained, we return realistic mock warnings
    structured exactly to IMDWarningSchema.
    In production: swap this for the real fetch via Cloudflare Worker.
    """
    return [
        {
            "id": f"IMD-{NOW_ISO[:10].replace('-','')}-001",
            "district": "Kolhapur",
            "state": "Maharashtra",
            "severity": "EXTREME",
            "rainfall_24h_mm": 210.5,
            "issued_at": NOW_ISO,
            "valid_until": "",
            "population_risk": 45000,
            "is_stale": False,
        },
        {
            "id": f"IMD-{NOW_ISO[:10].replace('-','')}-002",
            "district": "Sangli",
            "state": "Maharashtra",
            "severity": "SEVERE",
            "rainfall_24h_mm": 148.2,
            "issued_at": NOW_ISO,
            "valid_until": "",
            "population_risk": 32000,
            "is_stale": False,
        },
        {
            "id": f"IMD-{NOW_ISO[:10].replace('-','')}-003",
            "district": "Nashik",
            "state": "Maharashtra",
            "severity": "MODERATE",
            "rainfall_24h_mm": 87.0,
            "issued_at": NOW_ISO,
            "valid_until": "",
            "population_risk": 15000,
            "is_stale": False,
        },
    ]


def write_json(path: Path, data: object) -> None:
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"  Written: {path} ({len(json.dumps(data))} bytes)")


def main():
    print(f"Pravhatattva Telemetry Sync — {NOW_ISO}")
    print("=" * 50)

    # 1. Build CWC stations with live GloFAS discharge
    print("\n[1/4] Fetching GloFAS discharge for CWC stations...")
    cwc_output = []
    for station in STATIONS:
        print(f"  Fetching {station['station_code']} @ ({station['lat']},{station['lon']})")
        glofas = fetch_glofas_discharge(station["lat"], station["lon"])
        entry  = build_cwc_station_entry(station, glofas)
        cwc_output.append(entry)
        print(f"  → level={entry['current_water_level_m']}m, trend={entry['trend']}, stale={entry['is_stale']}")

    write_json(MOCK_DIR / "cwc_stations.json", cwc_output)

    # 2. IMD warnings (mock with correct schema shape)
    print("\n[2/4] Generating IMD district warnings...")
    warnings = fetch_imd_warnings_mock()
    write_json(MOCK_DIR / "imd_district_warnings.json", warnings)

    # 3. GloFAS sample discharge (7-day forecast for first station)
    print("\n[3/4] Fetching GloFAS 7-day for sample station...")
    sample = fetch_glofas_discharge(STATIONS[0]["lat"], STATIONS[0]["lon"])
    if sample:
        write_json(MOCK_DIR / "glofas_sample_discharge.json", sample)

    # 4. Write meta file
    print("\n[4/4] Writing _meta.json...")
    meta = {
        "generated_at": NOW_ISO,
        "scraper_version": "1.2.0",
        "sources": {
            "cwc_stations":         {"status": "ok", "records": len(cwc_output),  "last_fetch": NOW_ISO},
            "imd_warnings":         {"status": "mock", "records": len(warnings),  "last_fetch": NOW_ISO},
            "glofas_discharge":     {"status": "ok" if sample else "error",       "last_fetch": NOW_ISO},
        }
    }
    write_json(MOCK_DIR / "_meta.json", meta)

    print(f"\nSync complete. {len(cwc_output)} stations updated.")


if __name__ == "__main__":
    main()
