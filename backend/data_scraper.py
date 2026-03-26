"""
Pravhatattva Scraper v3.0
Regional-first data strategy:
  - CWC FFS: real-time flood station alerts (no substitute)
  - IMD district APIs: real rainfall, warnings, nowcast
  - Open-Meteo: ONLY for soil moisture (no regional substitute)
  - RainViewer: animated radar tiles metadata
  - Removed: GloFAS global proxy (replaced by real CWC)
  - Removed: Open-Meteo rainfall (replaced by IMD)
"""

import requests, json, os, datetime
from pathlib import Path

MOCK_DIR = Path(os.getenv("MOCK_OUTPUT_DIR", "frontend/public/mock"))
MOCK_DIR.mkdir(parents=True, exist_ok=True)
NOW_ISO = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

CWC_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://ffs.india-water.gov.in/",
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://ffs.india-water.gov.in",
}


def fetch_json(url: str, headers: dict = {}, label: str = "") -> list | dict | None:
    try:
        r = requests.get(url, headers=headers, timeout=12)
        r.raise_for_status()
        data = r.json()
        count = len(data) if isinstance(data, list) else "dict"
        print(f"  ✓ {label or url[:60]}: {count} records")
        return data
    except Exception as e:
        print(f"  ✗ {label or url[:60]}: {e}")
        return None


def write(filename: str, data: object) -> None:
    """Write data. NEVER overwrite non-empty file with empty list."""
    path = MOCK_DIR / filename
    if isinstance(data, list) and len(data) == 0:
        if path.exists():
            try:
                existing = json.loads(path.read_text())
                if isinstance(existing, list) and len(existing) > 0:
                    print(f"  ⚠ GUARD: {filename} — API=0, keeping {len(existing)} existing records")
                    return
            except Exception:
                pass
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    size = path.stat().st_size
    count = len(data) if isinstance(data, list) else "dict"
    print(f"  → {filename}: {size//1024}KB ({count} records)")


def main():
    print(f"\nPravhatattva Scraper v3.0 — {NOW_ISO}")
    print("Regional-first strategy: CWC FFS + IMD + soil moisture only")
    print("=" * 60)
    status = {}

    # ── 1. CWC FFS REAL-TIME (Primary source) ─────────────────────────────
    print("\n[1/6] CWC FFS: Stations above warning (live flood situation)...")
    above_warning = fetch_json(
        "https://ffs.india-water.gov.in/ffm/api/station-water-level-above-warning/",
        CWC_HEADERS, "above-warning"
    ) or []
    write("cwc_above_warning.json", above_warning)
    status["cwc_above_warning"] = {
        "status": "ok" if above_warning else "empty",
        "records": len(above_warning),
        "last_fetch": NOW_ISO,
        "note": "Real CWC FFS — replaces GloFAS proxy"
    }

    print("\n[2/6] CWC FFS: Inflow forecast stations (128 dams/reservoirs)...")
    inflow = fetch_json(
        "https://ffs.india-water.gov.in/wims-messaging/api/inflow-forecast-station/",
        CWC_HEADERS, "inflow-stations"
    ) or []
    write("cwc_inflow_stations.json", inflow)
    status["cwc_inflow_stations"] = {
        "status": "ok" if inflow else "empty",
        "records": len(inflow),
        "last_fetch": NOW_ISO,
    }

    # Try above-danger endpoint
    print("\n[3/6] CWC FFS: Stations above danger level...")
    above_danger = fetch_json(
        "https://ffs.india-water.gov.in/ffm/api/station-water-level-above-danger/",
        CWC_HEADERS, "above-danger"
    ) or []
    write("cwc_above_danger.json", above_danger)

    # ── 2. IMD REGIONAL WARNINGS (replaces Open-Meteo rainfall) ───────────
    print("\n[4/6] IMD: District warnings (5-day color-coded)...")
    imd_warnings = fetch_json(
        "https://mausam.imd.gov.in/api/warnings_district_api.php",
        {}, "imd-district-warnings"
    )
    if imd_warnings is None:
        # IMD not whitelisted yet — use structured mock
        print("  ⚠ IMD not accessible (IP whitelisting pending). Using mock.")
        imd_warnings = [
            {"id": f"IMD-{NOW_ISO[:10]}-001", "district": "Kolhapur",
             "state": "Maharashtra", "severity": "EXTREME",
             "rainfall_24h_mm": 210.5, "issued_at": NOW_ISO, "is_stale": True},
            {"id": f"IMD-{NOW_ISO[:10]}-002", "district": "Sangli",
             "state": "Maharashtra", "severity": "SEVERE",
             "rainfall_24h_mm": 148.2, "issued_at": NOW_ISO, "is_stale": True},
        ]
    write("imd_district_warnings.json", imd_warnings)
    status["imd_warnings"] = {
        "status": "ok" if not (isinstance(imd_warnings, list) and
                               any(w.get('is_stale') for w in imd_warnings)) else "mock",
        "records": len(imd_warnings) if isinstance(imd_warnings, list) else 0,
        "last_fetch": NOW_ISO,
        "whitelist_pending": True,
    }

    # ── 3. SOIL MOISTURE ONLY from Open-Meteo (no regional substitute) ────
    print("\n[5/6] Open-Meteo: Soil moisture for key basins...")
    BASIN_POINTS = [
        ("Brahmaputra", 26.18, 91.74),
        ("Ganga-Patna", 25.61, 85.14),
        ("Godavari", 17.00, 81.78),
        ("Krishna", 16.51, 80.61),
        ("Mahanadi", 20.46, 85.89),
        ("Bhima", 18.06, 75.12),
        ("Cauvery", 10.80, 78.68),
    ]
    soil_data = []
    for name, lat, lon in BASIN_POINTS:
        url = (f"https://api.open-meteo.com/v1/forecast"
               f"?latitude={lat}&longitude={lon}"
               f"&hourly=soil_moisture_0_1cm,soil_moisture_1_3cm,soil_moisture_3_9cm"
               f"&forecast_days=3&timezone=Asia/Kolkata")
        d = fetch_json(url, {}, f"soil-moisture-{name}")
        if d:
            soil_data.append({"basin": name, "lat": lat, "lon": lon, **d})
    write("soil_moisture_basins.json", soil_data)
    status["soil_moisture"] = {
        "status": "ok",
        "records": len(soil_data),
        "last_fetch": NOW_ISO,
        "note": "Only Open-Meteo data kept — no IMD substitute for soil moisture"
    }

    # ── 4. RAINVIEWER RADAR METADATA ──────────────────────────────────────
    print("\n[6/6] RainViewer: Animated radar tile metadata...")
    radar = fetch_json("https://api.rainviewer.com/public/weather-maps.json",
                       {}, "rainviewer-metadata")
    if radar:
        # Extract just what we need — tile paths for past + nowcast
        simplified_radar = {
            "generated_at": NOW_ISO,
            "radar": {
                "past":    radar.get("radar", {}).get("past", []),
                "nowcast": radar.get("radar", {}).get("nowcast", []),
            },
            "satellite": {
                "infrared": radar.get("satellite", {}).get("infrared", [])[-6:],
            },
            "tile_url_template": "https://tilecache.rainviewer.com/v2/radar/{path}/256/{z}/{x}/{y}/2/1_1.png",
            "sat_url_template":  "https://tilecache.rainviewer.com/v2/satellite/infrared/{path}/256/{z}/{x}/{y}/0/0_0.png",
        }
        write("radar_metadata.json", simplified_radar)
        status["radar"] = {
            "status": "ok",
            "past_frames": len(simplified_radar["radar"]["past"]),
            "nowcast_frames": len(simplified_radar["radar"]["nowcast"]),
            "last_fetch": NOW_ISO,
        }
    else:
        status["radar"] = {"status": "error", "last_fetch": NOW_ISO}

    # ── Meta ───────────────────────────────────────────────────────────────
    meta = {
        "generated_at": NOW_ISO,
        "scraper_version": "3.0.0",
        "strategy": "regional-first: CWC FFS + IMD + soil moisture only",
        "sources": status,
        "removed": ["GloFAS global discharge proxy", "Open-Meteo rainfall (replaced by IMD)"],
    }
    write("_meta.json", meta)
    print(f"\n✓ Scraper complete: {len(above_warning)} flood alerts, {len(inflow)} reservoirs")


if __name__ == "__main__":
    main()
