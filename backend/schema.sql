CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Master station registry
CREATE TABLE IF NOT EXISTS stations (
  station_code  TEXT PRIMARY KEY,
  station_name  TEXT NOT NULL,
  river         TEXT,
  basin         TEXT,
  state         TEXT,
  district      TEXT,
  lat           DOUBLE PRECISION,
  lon           DOUBLE PRECISION,
  warning_level_m   DOUBLE PRECISION,
  danger_level_m    DOUBLE PRECISION,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Time-series water level readings (partitioned by time)
CREATE TABLE IF NOT EXISTS water_levels (
  time            TIMESTAMPTZ NOT NULL,
  station_code    TEXT REFERENCES stations(station_code),
  level_m         DOUBLE PRECISION,
  trend           TEXT CHECK (trend IN ('RISING', 'FALLING', 'STEADY')),
  discharge_cumecs DOUBLE PRECISION
);
SELECT create_hypertable('water_levels', 'time', if_not_exists => TRUE);

-- IMD warnings
CREATE TABLE IF NOT EXISTS imd_warnings (
  id              TEXT PRIMARY KEY,
  district        TEXT NOT NULL,
  state           TEXT,
  severity        TEXT CHECK (severity IN ('EXTREME','SEVERE','MODERATE','WATCH')),
  rainfall_24h_mm DOUBLE PRECISION,
  issued_at       TIMESTAMPTZ,
  scraped_at      TIMESTAMPTZ DEFAULT NOW(),
  is_stale        BOOLEAN DEFAULT FALSE
);

-- Indexes for fast dashboard queries
CREATE INDEX IF NOT EXISTS idx_water_levels_station_time ON water_levels (station_code, time DESC);
CREATE INDEX IF NOT EXISTS idx_imd_warnings_issued ON imd_warnings (issued_at DESC);
