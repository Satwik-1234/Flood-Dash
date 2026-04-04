/**
 * PRAVHATATTVA v5.0 — Telemetry Hooks
 * All data read from /mock/*.json (written by GitHub Actions scraper)
 * Browser NEVER calls CWC/IMD APIs directly — CORS would block it.
 */
import { useQuery } from '@tanstack/react-query';

const BASE = import.meta.env.BASE_URL || '/';

async function mjson(path: string): Promise<unknown> {
  try {
    const res = await fetch(`${BASE}${path.replace(/^\//, '')}`);
    if (!res.ok) return [];
    const text = await res.text();
    if (!text || text.trim() === '' || text.trim() === 'null') return [];
    return JSON.parse(text);
  } catch {
    return [];
  }
}

// ── CWC National Gauge Levels (12K+ records) ────────────────────────────────
export interface CWCLevel {
  stationCode: string;
  latestDataTime: string;
  latestDataValue: number;
}

export const useCWCNationalLevels = () =>
  useQuery<CWCLevel[]>({
    queryKey: ['cwc-national-levels'],
    queryFn: async () => {
      const raw = await mjson('mock/cwc_national_levels.json') as any[];
      if (!Array.isArray(raw)) return [];
      return raw.map((r: any) => ({
        stationCode: r?.id?.stationCode ?? r?.stationCode ?? '',
        latestDataTime: r?.latestDataTime ?? '',
        latestDataValue: Number(r?.latestDataValue ?? 0),
      })).filter(r => r.stationCode);
    },
    staleTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });

// ── CWC Above Warning (active alerts) ───────────────────────────────────────
export interface CWCWarning {
  stationCode: string;
  status: string;
  value: number;
  trend: string | null;
}

export const useCWCAboveWarning = () =>
  useQuery<CWCWarning[]>({
    queryKey: ['cwc-above-warning'],
    queryFn: async () => {
      const raw = await mjson('mock/cwc_above_warning.json') as any[];
      if (!Array.isArray(raw)) return [];
      return raw.map((r: any) => ({
        stationCode: r.stationCode ?? '',
        status: r.status ?? 'WARNING',
        value: Number(r.value ?? 0),
        trend: r.trend ?? null,
      }));
    },
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

export const useCWCAboveDanger = () =>
  useQuery<CWCWarning[]>({
    queryKey: ['cwc-above-danger'],
    queryFn: async () => {
      const raw = await mjson('mock/cwc_above_danger.json') as any[];
      if (!Array.isArray(raw)) return [];
      return raw.map((r: any) => ({
        stationCode: r.stationCode ?? '',
        status: r.status ?? 'DANGER',
        value: Number(r.value ?? 0),
        trend: r.trend ?? null,
      }));
    },
    staleTime: 10 * 60 * 1000,
  });

// ── CWC Inflow / Reservoir Stations ─────────────────────────────────────────
export interface Reservoir {
  station_code: string;
  station_name: string;
  river: string;
  state: string;
  lat: number;
  lon: number;
  fill_pct: number;
  current_level_m: number;
  inflow_cumecs: number;
  outflow_cumecs: number;
  observed_at: string;
}

export const useReservoirs = () =>
  useQuery<Reservoir[]>({
    queryKey: ['reservoirs'],
    queryFn: async () => {
      const raw = await mjson('mock/cwc_inflow_stations.json') as any[];
      if (!Array.isArray(raw)) return [];
      return raw as Reservoir[];
    },
    staleTime: 3 * 60 * 60 * 1000,
  });

// ── IMD District Warnings ────────────────────────────────────────────────────
export const useIMDWarnings = () =>
  useQuery<any[]>({
    queryKey: ['imd-warnings'],
    queryFn: async () => {
      const raw = await mjson('mock/imd_district_warnings.json');
      return Array.isArray(raw) ? raw : [];
    },
    staleTime: 30 * 60 * 1000,
  });

export const useIMDStateRainfall = () =>
  useQuery<any[]>({
    queryKey: ['imd-state-rainfall'],
    queryFn: async () => {
      const raw = await mjson('mock/imd_state_rainfall.json');
      return Array.isArray(raw) ? raw : [];
    },
    staleTime: 30 * 60 * 1000,
  });

// ── GloFAS River Discharge ───────────────────────────────────────────────────
export const useGloFAS = () =>
  useQuery<any>({
    queryKey: ['glofas'],
    queryFn: async () => {
      const raw = await mjson('mock/glofas_sample_discharge.json');
      return raw ?? null;
    },
    staleTime: 6 * 60 * 60 * 1000,
  });

// ── Radar Metadata (RainViewer) ──────────────────────────────────────────────
export const useRadarMetadata = () =>
  useQuery<any>({
    queryKey: ['radar-metadata'],
    queryFn: async () => {
      try {
        const local = await mjson('mock/radar_metadata.json') as any;
        if (local?.radar?.past?.length) return local;
      } catch {}
      try {
        const r = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const d = await r.json();
        return {
          generated: Math.floor(Date.now() / 1000),
          host: 'https://tilecache.rainviewer.com',
          radar: { past: d.radar?.past ?? [], nowcast: d.radar?.nowcast ?? [] },
        };
      } catch { return null; }
    },
    refetchInterval: 10 * 60 * 1000,
  });

// ── Pipeline Metadata ────────────────────────────────────────────────────────
export const useDataMeta = () =>
  useQuery<any>({
    queryKey: ['data-meta'],
    queryFn: async () => {
      const raw = await mjson('mock/_meta.json');
      return raw ?? null;
    },
    refetchInterval: 5 * 60 * 1000,
  });
