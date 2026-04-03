import requests

headers_imd = {
    "Referer": "https://mausam.imd.gov.in/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"
}

headers_cwc = {
    "Referer": "https://ffs.india-water.gov.in/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
    "Accept": "application/json, text/plain, */*",
}

urls = {
    "IMD_WARNINGS": "https://mausam.imd.gov.in/api/warnings_district_api.php",
    "CWC_CATALOG": "https://ffs.india-water.gov.in/iam/api/layer-station-geo/",
}

for name, url in urls.items():
    print(f"Probing {name}...")
    try:
        h = headers_imd if "IMD" in name else headers_cwc
        # For CWC IAM catalog, we also need class-name
        if name == "CWC_CATALOG": h["class-name"] = "LayerStationDto"
        
        r = requests.get(url, headers=h, timeout=10)
        print(f"  Status: {r.status_code}")
        if r.status_code == 200:
            print(f"  Length: {len(r.text)}")
            # print(f"  Snippet: {r.text[:100]}")
        else:
            print(f"  Response: {r.text[:200]}")
    except Exception as e:
        print(f"  Error: {e}")
