/**
 * PRAVHATATTVA — Data Hooks
 *
 * Architecture: Browser reads /mock/*.json files that the Python scraper writes.
 * The browser NEVER calls CWC FFS or IMD APIs directly — CORS blocks it.
 * The scraper (Python, GitHub Actions) calls real APIs every 15 min.
 */
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { CWCStationSchema, IMDWarningSchema, CWCFfsStationSchema, CWCInflowSchema } from '../api/schemas';

async function fetchMockJson(path: string): Promise<unknown> {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const res = await fetch(`${baseUrl}${cleanPath}`);
  if (!res.ok) return [];
  return res.json();
}

// ── CWC gauge stations ─────────────────────────────────────────────────────
export const useCWCStations = () =>
  useQuery({
    queryKey: ['cwc-stations'],
    queryFn: async () => {
      const raw = await fetchMockJson('/mock/cwc_stations.json');
      if (!Array.isArray(raw) || raw.length === 0) return [];
      try { return z.array(CWCStationSchema).parse(raw); } catch { return raw as any[]; }
    },
  });

// ── CWC FFS — above WARNING ────────────────────────────────────────────────
export const useCWCAboveWarning = () =>
  useQuery({
    queryKey: ['cwc-ffs-warning'],
    queryFn: async () => {
      const raw = await fetchMockJson('/mock/cwc_above_warning.json');
      if (!Array.isArray(raw) || raw.length === 0) return [];
      try { return z.array(CWCFfsStationSchema).parse(raw); } catch { return raw as any[]; }
    },
    refetchInterval: 15 * 60 * 1000,
    staleTime: 12 * 60 * 1000,
  });

// ── CWC FFS — above DANGER ─────────────────────────────────────────────────
export const useCWCAboveDanger = () =>
  useQuery({
    queryKey: ['cwc-ffs-danger'],
    queryFn: async () => {
      const raw = await fetchMockJson('/mock/cwc_above_danger.json');
      if (!Array.isArray(raw) || raw.length === 0) return [];
      try { return z.array(CWCFfsStationSchema).parse(raw); } catch { return raw as any[]; }
    },
    refetchInterval: 15 * 60 * 1000,
  });

// ── CWC FFS — inflow/reservoir stations ────────────────────────────────────
export const useCWCInflowStations = () =>
  useQuery({
    queryKey: ['cwc-ffs-inflow'],
    queryFn: async () => {
      const raw = await fetchMockJson('/mock/cwc_inflow_stations.json');
      if (!Array.isArray(raw) || raw.length === 0) return [];
      try { return z.array(CWCInflowSchema).parse(raw); } catch { return raw as any[]; }
    },
    refetchInterval: 3 * 60 * 60 * 1000,
  });

// ── IMD district warnings ───────────────────────────────────────────────────
export const useIMDWarnings = () =>
  useQuery({
    queryKey: ['imd-warnings'],
    queryFn: async () => {
      const raw = await fetchMockJson('/mock/imd_district_warnings.json');
      if (!Array.isArray(raw) || raw.length === 0) return [];
      try { return z.array(IMDWarningSchema).parse(raw); } catch { return raw as any[]; }
    },
    refetchInterval: 3 * 60 * 60 * 1000,
  });

export const useIMDRainfall = () => useQuery({ queryKey: ['imd-rainfall'], queryFn: () => fetchMockJson('/mock/imd_district_warnings.json') });
export const useIMDStatewiseRainfall = () => useQuery({ queryKey: ['imd-statewise'], queryFn: () => fetchMockJson('/mock/imd_district_warnings.json') });
export const useBasinQPF = () => useQuery({ queryKey: ['imd-basin-qpf'], queryFn: () => fetchMockJson('/mock/soil_moisture_basins.json'), staleTime: 6 * 60 * 60 * 1000 });
export const useStateDistrictForecast = () => useQuery({ queryKey: ['imd-5d-forecast'], queryFn: () => fetchMockJson('/mock/imd_district_warnings.json') });

// ── Data meta (freshness) ───────────────────────────────────────────────────
export const useDataMeta = () =>
  useQuery({
    queryKey: ['data-meta'],
    queryFn: () => fetchMockJson('/mock/_meta.json'),
    refetchInterval: 5 * 60 * 1000,
  });

// ── Radar metadata (RainViewer) ─────────────────────────────────────────────
export const useRadarMetadata = () =>
  useQuery({
    queryKey: ['radar-metadata'],
    queryFn: async () => {
      try {
        const r = await fetch('/mock/radar_metadata.json');
        if (r.ok) { const d = await r.json(); if (d?.radar?.past?.length) return d; }
      } catch { /* fall through */ }
      const r = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const d = await r.json();
      return { radar: { past: d.radar?.past ?? [], nowcast: d.radar?.nowcast ?? [] } };
    },
    refetchInterval: 10 * 60 * 1000,
    staleTime: 8 * 60 * 1000,
  });

// ── GloFAS rivers ───────────────────────────────────────────────────────────
export const useGloFASSample = () =>
  useQuery({
    queryKey: ['glofas-sample'],
    queryFn: () => fetchMockJson('/mock/glofas_rivers.json'),
    staleTime: 6 * 60 * 60 * 1000,
  });

// ── CWC hydrograph (individual station) ────────────────────────────────────
export const useCWCHydrograph = (_stationId?: number) =>
  useQuery({
    queryKey: ['cwc-hydrograph', _stationId],
    queryFn: () => fetchMockJson('/mock/glofas_rivers.json'),
    enabled: !!_stationId,
    staleTime: 15 * 60 * 1000,
  });
