# backend/scrapers/imd_selenium.py
"""
IMD Warning Scraper — Selenium + BeautifulSoup
Scrapes the India Meteorological Department public warnings page
for district-level rainfall warnings.

Selectors verified 2026-03-26 against IMD mausam.imd.gov.in
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
from .cwc_selenium import get_driver
import datetime

IMD_WARNINGS_URL = 'https://mausam.imd.gov.in/responsive/warning.php'

SEVERITY_MAP = {
    'Red Alert':    'EXTREME',
    'Orange Alert': 'SEVERE',
    'Yellow Alert': 'MODERATE',
    'Green':        'WATCH',
}


def scrape_imd_warnings() -> list:
    """Scrape IMD warnings page for district-level rainfall alerts."""
    driver = get_driver()
    results = []
    try:
        driver.get(IMD_WARNINGS_URL)
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.TAG_NAME, 'table'))
        )
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        now = datetime.datetime.utcnow().isoformat() + 'Z'
        for i, row in enumerate(soup.select('table tr')[1:]):
            cols = [td.get_text(strip=True) for td in row.find_all('td')]
            if len(cols) < 3:
                continue
            raw_severity = cols[2] if len(cols) > 2 else 'Green'
            severity = SEVERITY_MAP.get(raw_severity, 'WATCH')
            results.append({
                'id':              f'IMD-{now[:10]}-{str(i).zfill(4)}',
                'district':        cols[0],
                'state':           cols[1] if len(cols) > 1 else '',
                'severity':        severity,
                'rainfall_24h_mm': float(cols[3]) if len(cols) > 3 and cols[3] else 0.0,
                'issued_at':       now,
                'is_stale':        False,
            })
    except Exception as e:
        print(f'IMD scrape error: {e}')
    finally:
        driver.quit()
    return results
