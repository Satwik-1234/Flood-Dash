# backend/tasks.py
"""
Celery Task Queue — Pravhatattva v4.0
Connects Selenium scrapers to the scheduler and the database.
Tasks publish updates to Redis pub/sub for WebSocket push.
"""
from celery import Celery
from celery.schedules import crontab
import os, json, datetime
from sqlalchemy import create_engine, text
from scrapers.cwc_selenium import scrape_above_warning
from scrapers.imd_selenium import scrape_imd_warnings
from scrapers.rainviewer import fetch_radar_metadata
import redis as redis_lib

REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379/0')
DB_URL    = os.getenv('DATABASE_URL')

app = Celery('pravhatattva', broker=REDIS_URL, backend=REDIS_URL)
engine = create_engine(DB_URL) if DB_URL else None
r = redis_lib.from_url(REDIS_URL)

# ── Schedule: runs automatically ─────────────────────────────────
app.conf.beat_schedule = {
    'scrape-cwc':   {'task': 'tasks.scrape_cwc',   'schedule': crontab(minute='*/5')},
    'scrape-imd':   {'task': 'tasks.scrape_imd',   'schedule': crontab(minute='*/15')},
    'scrape-radar': {'task': 'tasks.scrape_radar',  'schedule': crontab(minute='*/10')},
}
app.conf.timezone = 'Asia/Kolkata'


@app.task
def scrape_cwc():
    """Scrape CWC FFS, store in DB, push via Redis pub/sub."""
    stations = scrape_above_warning()
    if not stations:
        print('CWC: no data returned')
        return

    if engine:
        with engine.connect() as conn:
            for s in stations:
                code = s.get('station_code', s['station_name'][:12].replace(' ', '_'))
                conn.execute(text('''
                  INSERT INTO stations (station_code, station_name, river, state,
                                        warning_level_m, danger_level_m)
                  VALUES (:code, :name, :river, :state, :warn, :danger)
                  ON CONFLICT (station_code) DO UPDATE
                  SET station_name=EXCLUDED.station_name, updated_at=NOW()
                '''), {'code': code,
                       'name': s['station_name'], 'river': s.get('river'),
                       'state': s.get('state'), 'warn': s.get('warning_level_m'),
                       'danger': s.get('danger_level_m')})
                conn.execute(text('''
                  INSERT INTO water_levels (time, station_code, level_m)
                  VALUES (NOW(), :code, :level)
                '''), {'code': code, 'level': s.get('current_level_m')})
            conn.commit()

    # Push update to all connected WebSocket clients via Redis pub/sub
    r.publish('cwc_update', json.dumps({'type': 'cwc_update', 'data': stations}))
    print(f'CWC: saved {len(stations)} stations')


@app.task
def scrape_imd():
    """Scrape IMD warnings, store in DB, push via Redis pub/sub."""
    warnings = scrape_imd_warnings()
    if not warnings:
        print('IMD: no data returned')
        return

    if engine:
        with engine.connect() as conn:
            for w in warnings:
                conn.execute(text('''
                  INSERT INTO imd_warnings
                    (id, district, state, severity, rainfall_24h_mm, issued_at)
                  VALUES (:id, :district, :state, :severity, :rainfall_24h_mm, :issued_at)
                  ON CONFLICT (id) DO UPDATE SET is_stale=FALSE, scraped_at=NOW()
                '''), w)
            conn.commit()

    r.publish('imd_update', json.dumps({'type': 'imd_update', 'data': warnings}))
    print(f'IMD: saved {len(warnings)} warnings')


@app.task
def scrape_radar():
    """Fetch RainViewer radar metadata, cache in Redis."""
    data = fetch_radar_metadata()
    if data:
        r.set('radar_metadata', json.dumps(data), ex=3600)  # 1 hour TTL
        print('Radar metadata cached')
    else:
        print('Radar: no data returned')
