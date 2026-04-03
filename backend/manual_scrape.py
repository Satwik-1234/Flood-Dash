# backend/manual_scrape.py
"""
Pravhatattva — Zero-Server All-India Hydrometeorological Intelligence
Pure HTTP requests only (GitHub Actions compatible).
"""
import json, datetime, requests
from pathlib import Path

MOCK_DIR = Path("frontend/public/mock")
MOCK_DIR.mkdir(parents=True, exist_ok=True)

# ─── Data Sources ────────────────────────────────────────────────────────────
CWC_FFS_BASE = "https://ffs.india-water.gov.in/ffm/api"
CWC_IAM_BASE = "https://ffs.india-water.gov.in/iam/api"
IMD_API_BASE = "https://mausam.imd.gov.in/api"

HEADERS = {
    "Referer": "https://ffs.india-water.gov.in/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
}

def save_json(data, filename):
    if not data: return
    with open(MOCK_DIR / filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  [OK] Saved {filename}")

def scrape_cwc():
    """Fetch national station catalog and flood situation."""
    print("Scraping CWC FFS...")
    # 1. Warning Stations
    try:
        r = requests.get(f"{CWC_FFS_BASE}/station-water-level-above-warning/", headers=HEADERS, timeout=20)
        save_json(r.json() if r.ok else [], "cwc_above_warning.json")
    except Exception as e: print(f"  [ERR] CWC Warning: {e}")

    # 2. National Stations (GEO) - Using simplified endpoint for speed
    try:
        url = f"{CWC_IAM_BASE}/layer-station-geo/"
        print(f"  Fetching all stations from {url}...")
        r = requests.get(url, headers={**HEADERS, "class-name": "LayerStationDto"}, timeout=30)
        if r.ok:
            raw = r.json()
            print(f"  Received {len(raw)} stations.")
            formatted = []
            for s in raw:
                meta = s.get("stationCode", {}).get("floodForecastStaticStationCode", {})
                if not meta: continue
                formatted.append({
                    "id": meta.get("id"),
                    "name": meta.get("name"),
                    "code": meta.get("stationCode"),
                    "river": meta.get("riverName"),
                    "basin": meta.get("basinName"),
                    "state": meta.get("stateName"),
                    "lat": s.get("latitude"),
                    "lon": s.get("longitude"),
                    "warning_m": s.get("warningLevel"),
                    "danger_m": s.get("dangerLevel"),
                    "type": meta.get("type")
                })
            save_json(formatted, "cwc_stations.json")
        else:
            print(f"  [ERR] CWC All Stations HTTP {r.status_code}")
    except Exception as e: print(f"  [ERR] CWC All Stations: {e}")

    # 3. National Levels (HHS)
    try:
        spec = '{"where":{"expression":{"valueIsRelationField":false,"fieldName":"id.datatypeCode","operator":"eq","value":"HHS"}},"and":{"expression":{"valueIsRelationField":false,"fieldName":"stationCode.floodForecastStaticStationCode.type","operator":"eq","value":"Level"}}}'
        r = requests.get(f"{CWC_IAM_BASE}/new-entry-data-aggregate/specification/?specification={spec}",
                         headers={**HEADERS, "class-name": "NewEntryDataAggregateDto"}, timeout=30)
        save_json(r.json() if r.ok else [], "cwc_national_levels.json")
    except Exception as e: print(f"  [ERR] CWC Levels: {e}")

def scrape_imd():
    """Fetch official IMD district alerts, nowcasts, and rainfall."""
    print("Scraping IMD Official APIs...")
    endpoints = {
        "imd_district_warnings.json": f"{IMD_API_BASE}/warnings_district_api.php",
        "imd_district_nowcast.json": f"{IMD_API_BASE}/nowcast_district_api.php",
        "imd_district_rainfall.json": f"{IMD_API_BASE}/districtwise_rainfall_api.php",
        "imd_state_rainfall.json": f"{IMD_API_BASE}/statewise_rainfall_api.php",
        "imd_basin_qpf.json": f"{IMD_API_BASE}/basin_qpf_api.php"
    }
    for filename, url in endpoints.items():
        try:
            r = requests.get(url, headers=HEADERS, timeout=20)
            save_json(r.json() if r.ok else [], filename)
        except Exception as e: print(f"  [ERR] IMD {filename}: {e}")

def scrape_open_meteo():
    """Fetch bulk weather for 50 major cities."""
    # (Kept for broad summary view)
    print("Scraping Open-Meteo...")
    # Simplified list for brevity in code - can be expanded as needed
    cities = [{"lat": 19.076, "lon": 72.877, "name": "Mumbai"}, {"lat": 28.614, "lon": 77.209, "name": "Delhi"}]
    lats = ",".join(str(c["lat"]) for c in cities)
    lons = ",".join(str(c["lon"]) for c in cities)
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lats}&longitude={lons}&current=temperature_2m,weathercode&timezone=Asia/Kolkata"
    try:
        r = requests.get(url, timeout=20)
        save_json(r.json() if r.ok else [], "all_india_weather.json")
    except Exception as e: print(f"  [ERR] Open-Meteo: {e}")

if __name__ == "__main__":
    print(f"PRAVHATATTVA Intelligence Pipeline -- {datetime.datetime.now().isoformat()}")
    scrape_cwc()
    scrape_imd()
    scrape_open_meteo()
    # Save metadata
    save_json({"updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat()}, "_meta.json")
    print("Pipeline complete.")
