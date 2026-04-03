# backend/scraper_v4.py
"""
PRAVHATATTVA v4.0 - MASTER INTELLIGENCE PIPELINE
Strategy: Direct HTTP Parallelism (httpx)
Architecture:
  - Phase 1: National Catalog (Geography)
  - Phase 2: Live Telemetry (Levels, Alerts)
  - Phase 3: Regional Meteo (IMD District)
  - Phase 4: Radar Metadata (RainViewer)
"""

import asyncio
import httpx
import json
import datetime
import os
from pathlib import Path

# --- Configuration ---
MOCK_DIR = Path("frontend/public/mock")
MOCK_DIR.mkdir(parents=True, exist_ok=True)

CWC_FFS_BASE = "https://ffs.india-water.gov.in/ffm/api"
CWC_IAM_BASE = "https://ffs.india-water.gov.in/iam/api"
IMD_API_BASE = "https://mausam.imd.gov.in/api"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
    "Referer": "https://ffs.india-water.gov.in/",
    "Accept": "application/json, text/plain, */*",
}

TIMEOUT = httpx.Timeout(45.0, connect=15.0)

async def fetch_json(client: httpx.AsyncClient, url: str, label: str, headers: dict = None) -> any:
    try:
        req_headers = {**HEADERS, **(headers or {})}
        resp = await client.get(url, headers=req_headers)
        if resp.status_code == 200:
            data = resp.json()
            count = len(data) if isinstance(data, list) else "1 (Object)"
            print(f"  [+] {label}: {count} records recovered.")
            return data
        else:
            print(f"  [!] {label}: HTTP {resp.status_code}")
            return None
    except Exception as e:
        print(f"  [!] {label}: {str(e)}")
        return None

def write_json(data, filename):
    if data is None: return
    path = MOCK_DIR / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  -> {filename}: Saved {os.path.getsize(path)//1024} KB")

async def main():
    start_time = datetime.datetime.now(datetime.timezone.utc)
    print(f"\nPRAVHATATTVA Intelligence Node v4.0 -- {start_time.isoformat()}")
    print("=" * 65)

    async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
        # --- PHASE 1 & 2: CWC NATIONAL HYDROLOGY ---
        print("\n[SECTION 1: NATIONAL HYDROLOGY (CWC)]")
        
        # 1.1 All Stations Catalog (Heavy)
        catalog_task = fetch_json(client, f"{CWC_IAM_BASE}/layer-station-geo/", "CWC-Catalog", {"class-name": "LayerStationDto"})
        
        # 1.2 Live Levels (HHS)
        spec = '{"where":{"expression":{"valueIsRelationField":false,"fieldName":"id.datatypeCode","operator":"eq","value":"HHS"}},"and":{"expression":{"valueIsRelationField":false,"fieldName":"stationCode.floodForecastStaticStationCode.type","operator":"eq","value":"Level"}}}'
        levels_task = fetch_json(client, f"{CWC_IAM_BASE}/new-entry-data-aggregate/specification/?specification={spec}", "CWC-Levels", {"class-name": "NewEntryDataAggregateDto"})
        
        # 1.3 Active Warning Stations
        warning_task = fetch_json(client, f"{CWC_FFS_BASE}/station-water-level-above-warning/", "CWC-Active-Warning")
        
        # 1.4 Active Danger Stations
        danger_task = fetch_json(client, f"{CWC_FFS_BASE}/station-water-level-above-danger/", "CWC-Active-Danger")

        # --- PHASE 3: IMD REGIONAL METEOROLOGY ---
        print("\n[SECTION 2: REGIONAL METEOROLOGY (IMD)]")
        imd_endpoints = {
            "imd_district_warnings": f"{IMD_API_BASE}/warnings_district_api.php",
            "imd_district_nowcast": f"{IMD_API_BASE}/nowcast_district_api.php",
            "imd_district_rainfall": f"{IMD_API_BASE}/districtwise_rainfall_api.php",
            "imd_state_rainfall": f"{IMD_API_BASE}/statewise_rainfall_api.php"
        }
        imd_tasks = {name: fetch_json(client, url, f"IMD-{name}") for name, url in imd_endpoints.items()}

        # Wait for all core tasks
        results = await asyncio.gather(catalog_task, levels_task, warning_task, danger_task, *imd_tasks.values())
        
        cwc_catalog_raw = results[0]
        cwc_levels_raw  = results[1]
        cwc_warning     = results[2]
        cwc_danger      = results[3]
        imd_data        = {name: results[i+4] for i, name in enumerate(imd_tasks.keys())}

        # --- DATA SYNC & FORMATTING ---
        print("\n[SECTION 3: SYNCHRONIZATION & REFINEMENT]")
        
        # Map levels to catalog
        levels_map = {}
        if cwc_levels_raw:
            for entry in cwc_levels_raw:
                ffs_code = entry.get("stationCode", {}).get("floodForecastStaticStationCode", {})
                code = ffs_code.get("stationCode")
                if code:
                    levels_map[code] = {
                        "level": entry.get("value"),
                        "trend": entry.get("trend"),
                        "time": entry.get("dataTime")
                    }

        # Format National Stations
        formatted_stations = []
        if cwc_catalog_raw:
            for s in cwc_catalog_raw:
                meta = s.get("stationCode", {}).get("floodForecastStaticStationCode", {})
                if not meta: continue
                code = meta.get("stationCode")
                live = levels_map.get(code, {})
                
                formatted_stations.append({
                    "id": meta.get("id"),
                    "name": meta.get("name", "Unknown Node"),
                    "code": code,
                    "river": meta.get("riverName", "N/A"),
                    "basin": meta.get("basinName", "N/A"),
                    "state": meta.get("stateName", "N/A"),
                    "district": meta.get("districtName", "N/A"),
                    "lat": s.get("latitude"),
                    "lon": s.get("longitude"),
                    "warning_m": s.get("warningLevel", 0),
                    "danger_m": s.get("dangerLevel", 0),
                    "type": meta.get("type", "Level"),
                    "current_water_level_m": live.get("level", 0),
                    "trend": live.get("trend", "STABLE"),
                    "last_poll": live.get("time")
                })
        
        write_json(formatted_stations, "cwc_stations.json")
        write_json(cwc_warning or [], "cwc_above_warning.json")
        write_json(cwc_danger or [], "cwc_above_danger.json")
        for name, data in imd_data.items():
            write_json(data or [], f"{name}.json")

        # --- Phase 4: Radar ---
        print("\n[SECTION 4: RADAR METADATA (RAINVIEWER)]")
        radar_raw = await fetch_json(client, "https://api.rainviewer.com/public/weather-maps.json", "RainViewer-Radar")
        if radar_raw:
            write_json({
                "generated": int(datetime.datetime.now().timestamp()),
                "host": "https://tilecache.rainviewer.com",
                "radar": radar_raw.get("radar", {}),
                "satellite": radar_raw.get("satellite", {})
            }, "radar_metadata.json")

    # Final Meta
    end_time = datetime.datetime.now(datetime.timezone.utc)
    meta = {
        "generated_at": end_time.isoformat(),
        "duration_sec": (end_time - start_time).total_seconds(),
        "v": "4.0.0",
        "datasets": {
            "cwc_stations": { "source": "CWC IAM LayerStationGeo", "latency": "REALTIME", "description": "National catalog of 2,500+ flood gauging stations with live HHS telemetry mapping." },
            "imd_warnings": { "source": "IMD Mausam Official", "latency": "3-hourly", "description": "Color-coded district meteorological risks and precipitation forecasts." },
            "radar": { "source": "RainViewer", "latency": "10-minute", "description": "Global radar mosaic tile metadata for precipitation animation." }
        }
    }
    write_json(meta, "_meta.json")
    print(f"\n[+] PIPELINE COMPLETE -- Total duration: {meta['duration_sec']:.1f}s")

if __name__ == "__main__":
    asyncio.run(main())
