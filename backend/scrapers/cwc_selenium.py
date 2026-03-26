# backend/scrapers/cwc_selenium.py
"""
CWC FFS Scraper — Selenium + BeautifulSoup
Scrapes the Central Water Commission Flood Forecasting System for
real-time station water level data above warning/danger thresholds.

Selectors verified 2026-03-26 against CWC FFS v2.x
"""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import json, os, time

CWC_BASE = 'https://ffs.india-water.gov.in'


def get_driver():
    """Create a headless Chrome WebDriver for Docker or local use."""
    opts = Options()
    opts.add_argument('--headless')              # No visible window
    opts.add_argument('--no-sandbox')             # Required inside Docker
    opts.add_argument('--disable-dev-shm-usage')  # Required inside Docker
    opts.add_argument('--disable-gpu')
    opts.add_argument('--window-size=1920,1080')
    opts.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
    return webdriver.Chrome(options=opts)


def scrape_above_warning() -> list:
    """Scrape CWC FFS flood situation table for stations above warning level."""
    driver = get_driver()
    results = []
    try:
        driver.get(f'{CWC_BASE}/ffm/flood-situation')
        # Wait up to 15 seconds for the table to load
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'table.station-table'))
        )
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        for row in soup.select('table.station-table tbody tr'):
            cols = [td.get_text(strip=True) for td in row.find_all('td')]
            if len(cols) >= 6:
                results.append({
                    'station_name':     cols[0],
                    'river':            cols[1],
                    'state':            cols[2],
                    'current_level_m':  float(cols[3]) if cols[3] else None,
                    'warning_level_m':  float(cols[4]) if cols[4] else None,
                    'danger_level_m':   float(cols[5]) if cols[5] else None,
                    'flood_situation':  cols[6] if len(cols) > 6 else 'UNKNOWN'
                })
    except Exception as e:
        print(f'CWC scrape error: {e}')
    finally:
        driver.quit()
    return results


def scrape_above_danger() -> list:
    """Scrape CWC FFS for stations specifically above danger level."""
    driver = get_driver()
    results = []
    try:
        driver.get(f'{CWC_BASE}/ffm/flood-situation')
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'table.station-table'))
        )
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        for row in soup.select('table.station-table tbody tr'):
            cols = [td.get_text(strip=True) for td in row.find_all('td')]
            if len(cols) >= 6:
                try:
                    current = float(cols[3]) if cols[3] else 0
                    danger = float(cols[5]) if cols[5] else 0
                    if current >= danger and danger > 0:
                        results.append({
                            'station_name':     cols[0],
                            'river':            cols[1],
                            'state':            cols[2],
                            'current_level_m':  current,
                            'warning_level_m':  float(cols[4]) if cols[4] else None,
                            'danger_level_m':   danger,
                            'flood_situation':  'SEVERE'
                        })
                except ValueError:
                    continue
    except Exception as e:
        print(f'CWC danger scrape error: {e}')
    finally:
        driver.quit()
    return results
