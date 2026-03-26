# backend/scrapers/rainviewer.py
"""
RainViewer Radar Metadata — plain HTTP (no Selenium needed).
Fetches animated radar tile paths for the map overlay.
"""
import requests
import datetime


def fetch_radar_metadata() -> dict:
    """Fetch radar tile metadata from RainViewer public API."""
    try:
        resp = requests.get(
            'https://api.rainviewer.com/public/weather-maps.json',
            timeout=10
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            'radar':     data.get('radar', {}),
            'satellite': data.get('satellite', {}),
            'fetched_at': datetime.datetime.utcnow().isoformat() + 'Z',
        }
    except Exception as e:
        print(f'RainViewer fetch error: {e}')
        return {}
