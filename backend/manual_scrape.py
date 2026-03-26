# backend/manual_scrape.py
"""
Zero-Server All-India Scraper — GitHub Actions Edition
Pure HTTP requests only (NO Selenium, NO Chrome).
Runs every 15 minutes on GitHub's cloud for free.

Data Sources:
  1. CWC FFS REST API  → flood stations above warning/danger
  2. Open-Meteo API    → weather for 50 Indian cities (all states)
  3. RainViewer API    → radar tile metadata
"""
import json, os, datetime
from pathlib import Path

try:
    import requests
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'requests'])
    import requests

MOCK_DIR = Path("frontend/public/mock")
MOCK_DIR.mkdir(parents=True, exist_ok=True)

# ─── 50 Major Indian Cities (All States Covered) ────────────────────────────
INDIA_CITIES = [
    # North India
    {"name": "New Delhi",       "state": "Delhi",             "lat": 28.6139, "lon": 77.2090},
    {"name": "Lucknow",         "state": "Uttar Pradesh",     "lat": 26.8467, "lon": 80.9462},
    {"name": "Varanasi",        "state": "Uttar Pradesh",     "lat": 25.3176, "lon": 82.9739},
    {"name": "Jaipur",          "state": "Rajasthan",         "lat": 26.9124, "lon": 75.7873},
    {"name": "Chandigarh",      "state": "Chandigarh",        "lat": 30.7333, "lon": 76.7794},
    {"name": "Dehradun",        "state": "Uttarakhand",       "lat": 30.3165, "lon": 78.0322},
    {"name": "Shimla",          "state": "Himachal Pradesh",  "lat": 31.1048, "lon": 77.1734},
    {"name": "Srinagar",        "state": "J&K",               "lat": 34.0836, "lon": 74.7973},
    # East India
    {"name": "Kolkata",         "state": "West Bengal",       "lat": 22.5726, "lon": 88.3639},
    {"name": "Patna",           "state": "Bihar",             "lat": 25.6093, "lon": 85.1376},
    {"name": "Guwahati",        "state": "Assam",             "lat": 26.1445, "lon": 91.7362},
    {"name": "Bhubaneswar",     "state": "Odisha",            "lat": 20.2961, "lon": 85.8245},
    {"name": "Ranchi",          "state": "Jharkhand",         "lat": 23.3441, "lon": 85.3096},
    {"name": "Imphal",          "state": "Manipur",           "lat": 24.8170, "lon": 93.9368},
    {"name": "Shillong",        "state": "Meghalaya",         "lat": 25.5788, "lon": 91.8933},
    {"name": "Agartala",        "state": "Tripura",           "lat": 23.8315, "lon": 91.2868},
    {"name": "Aizawl",          "state": "Mizoram",           "lat": 23.7271, "lon": 92.7176},
    {"name": "Kohima",          "state": "Nagaland",          "lat": 25.6751, "lon": 94.1086},
    {"name": "Itanagar",        "state": "Arunachal Pradesh", "lat": 27.0844, "lon": 93.6053},
    {"name": "Gangtok",         "state": "Sikkim",            "lat": 27.3389, "lon": 88.6065},
    # West India
    {"name": "Mumbai",          "state": "Maharashtra",       "lat": 19.0760, "lon": 72.8777},
    {"name": "Pune",            "state": "Maharashtra",       "lat": 18.5204, "lon": 73.8567},
    {"name": "Nagpur",          "state": "Maharashtra",       "lat": 21.1458, "lon": 79.0882},
    {"name": "Ahmedabad",       "state": "Gujarat",           "lat": 23.0225, "lon": 72.5714},
    {"name": "Surat",           "state": "Gujarat",           "lat": 21.1702, "lon": 72.8311},
    {"name": "Panaji",          "state": "Goa",               "lat": 15.4909, "lon": 73.8278},
    # South India
    {"name": "Bengaluru",       "state": "Karnataka",         "lat": 12.9716, "lon": 77.5946},
    {"name": "Chennai",         "state": "Tamil Nadu",        "lat": 13.0827, "lon": 80.2707},
    {"name": "Hyderabad",       "state": "Telangana",         "lat": 17.3850, "lon": 78.4867},
    {"name": "Kochi",           "state": "Kerala",            "lat": 9.9312,  "lon": 76.2673},
    {"name": "Thiruvananthapuram","state": "Kerala",           "lat": 8.5241,  "lon": 76.9366},
    {"name": "Visakhapatnam",   "state": "Andhra Pradesh",    "lat": 17.6868, "lon": 83.2185},
    {"name": "Coimbatore",      "state": "Tamil Nadu",        "lat": 11.0168, "lon": 76.9558},
    {"name": "Madurai",         "state": "Tamil Nadu",        "lat": 9.9252,  "lon": 78.1198},
    {"name": "Mangaluru",       "state": "Karnataka",         "lat": 12.9141, "lon": 74.8560},
    # Central India
    {"name": "Bhopal",          "state": "Madhya Pradesh",    "lat": 23.2599, "lon": 77.4126},
    {"name": "Indore",          "state": "Madhya Pradesh",    "lat": 22.7196, "lon": 75.8577},
    {"name": "Raipur",          "state": "Chhattisgarh",      "lat": 21.2514, "lon": 81.6296},
    # Flood-Prone Rivers
    {"name": "Dibrugarh",       "state": "Assam",             "lat": 27.4728, "lon": 94.9120},
    {"name": "Silchar",         "state": "Assam",             "lat": 24.8333, "lon": 92.7789},
    {"name": "Muzaffarpur",     "state": "Bihar",             "lat": 26.1209, "lon": 85.3647},
    {"name": "Darbhanga",       "state": "Bihar",             "lat": 26.1542, "lon": 85.8918},
    {"name": "Gorakhpur",       "state": "Uttar Pradesh",     "lat": 26.7606, "lon": 83.3732},
    {"name": "Prayagraj",       "state": "Uttar Pradesh",     "lat": 25.4358, "lon": 81.8463},
    {"name": "Haridwar",        "state": "Uttarakhand",       "lat": 29.9457, "lon": 78.1642},
    # Island Territories
    {"name": "Port Blair",      "state": "Andaman & Nicobar", "lat": 11.6234, "lon": 92.7265},
    # Punjab/Haryana
    {"name": "Amritsar",        "state": "Punjab",            "lat": 31.6340, "lon": 74.8723},
    {"name": "Ludhiana",        "state": "Punjab",            "lat": 30.9010, "lon": 75.8573},
    # Additional coverage
    {"name": "Jammu",           "state": "J&K",               "lat": 32.7266, "lon": 74.8570},
    {"name": "Leh",             "state": "Ladakh",            "lat": 34.1526, "lon": 77.5771},
]


def save_json(data, filename):
    """Save data to a JSON file only if data is non-empty."""
    if not data:
        print(f"  [SKIP] {filename}: no data returned")
        return
    path = MOCK_DIR / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  [OK] Saved {len(data) if isinstance(data, list) else 'object'} -> {filename}")


def scrape_cwc_api():
    """Fetch CWC flood data directly from their REST API (same as frontend)."""
    FFS_BASE = "https://ffs.india-water.gov.in/ffm/api"
    WIMS_BASE = "https://ffs.india-water.gov.in/wims-messaging/api"
    headers = {
        "Referer": "https://ffs.india-water.gov.in/",
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    }

    endpoints = {
        "cwc_above_warning.json":  f"{FFS_BASE}/station-water-level-above-warning/",
        "cwc_above_danger.json":   f"{FFS_BASE}/flood-situation-summary/",
        "cwc_inflow_stations.json": f"{WIMS_BASE}/inflow-forecast-station/",
    }

    for filename, url in endpoints.items():
        try:
            resp = requests.get(url, headers=headers, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            save_json(data, filename)
        except Exception as e:
            print(f"  [ERR] CWC {filename}: {e}")


def scrape_open_meteo_bulk():
    """
    Fetch current weather for all 50 Indian cities in ONE API call.
    Open-Meteo supports comma-separated lat/lon for bulk requests.
    Free, no API key, no rate limit.
    """
    lats = ",".join(str(c["lat"]) for c in INDIA_CITIES)
    lons = ",".join(str(c["lon"]) for c in INDIA_CITIES)

    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lats}&longitude={lons}"
        f"&current=temperature_2m,relativehumidity_2m,precipitation,"
        f"windspeed_10m,winddirection_10m,weathercode,cloudcover,surface_pressure"
        f"&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,weathercode"
        f"&timezone=Asia/Kolkata&forecast_days=3"
    )

    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        raw = resp.json()

        # Open-Meteo returns an array when multiple locations are queried
        results = []
        entries = raw if isinstance(raw, list) else [raw]
        for i, entry in enumerate(entries):
            city = INDIA_CITIES[i] if i < len(INDIA_CITIES) else {"name": f"City {i}"}
            current = entry.get("current", {})
            daily = entry.get("daily", {})
            results.append({
                "name":         city["name"],
                "state":        city.get("state", ""),
                "lat":          city["lat"],
                "lon":          city["lon"],
                "temperature":  current.get("temperature_2m"),
                "humidity":     current.get("relativehumidity_2m"),
                "precipitation": current.get("precipitation"),
                "windspeed":    current.get("windspeed_10m"),
                "winddirection": current.get("winddirection_10m"),
                "weathercode":  current.get("weathercode"),
                "cloudcover":   current.get("cloudcover"),
                "pressure":     current.get("surface_pressure"),
                "daily": {
                    "precip_sum":   daily.get("precipitation_sum", []),
                    "temp_max":     daily.get("temperature_2m_max", []),
                    "temp_min":     daily.get("temperature_2m_min", []),
                    "weathercode":  daily.get("weathercode", []),
                    "dates":        daily.get("time", []),
                },
                "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            })

        save_json(results, "all_india_weather.json")
    except Exception as e:
        print(f"  [ERR] Open-Meteo: {e}")


def scrape_rainviewer():
    """Fetch radar metadata (plain HTTP)."""
    try:
        resp = requests.get("https://api.rainviewer.com/public/weather-maps.json", timeout=10)
        resp.raise_for_status()
        data = resp.json()
        save_json(data, "radar_metadata.json")
    except Exception as e:
        print(f"  [ERR] RainViewer: {e}")


if __name__ == "__main__":
    ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
    print(f"All-India Scrape -- {ts}")
    print()

    print("[1/3] CWC Flood Data...")
    scrape_cwc_api()
    print()

    print("[2/3] Open-Meteo: 50 Indian Cities...")
    scrape_open_meteo_bulk()
    print()

    print("[3/3] RainViewer Radar...")
    scrape_rainviewer()
    print()

    print("All-India scrape complete.")
