# backend/manual_scrape.py
"""
Standalone execution script for GitHub Actions.
Runs v4.0 Selenium scrapers and saves to mock JSON files.
"""
import os, json, sys
from pathlib import Path

# Add backend to path so we can import scrapers
sys.path.append(os.path.dirname(__file__))

from scrapers.cwc_selenium import scrape_above_warning, scrape_above_danger
from scrapers.imd_selenium import scrape_imd_warnings

def save_json(data, filename):
    path = Path("frontend/public/mock") / filename
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Saved {len(data)} items to {filename}")

if __name__ == "__main__":
    print("🚀 Starting 24/7 Cloud Scrape...")
    
    # 1. CWC Warning Stations
    warning_data = scrape_above_warning()
    if warning_data:
        save_json(warning_data, "cwc_above_warning.json")
    
    # 2. CWC Danger Stations
    danger_data = scrape_above_danger()
    if danger_data:
        save_json(danger_data, "cwc_above_danger.json")
    
    # 3. IMD District Warnings
    imd_data = scrape_imd_warnings()
    if imd_data:
        # Convert list to expected format if needed
        save_json(imd_data, "imd_district_warnings.json")
        
    print("✅ Scrape complete.")
