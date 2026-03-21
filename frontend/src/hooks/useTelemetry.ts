/**
 * DATA SOURCE RESPONSIBILITIES — DO NOT CROSS-USE
 * 
 * useCWCAboveWarning()      → Overview KPIs, Map markers, Alert feed
 * useCWCInflowStations()    → Reservoir fill % in Overview + Map
 * useIMDWarnings()          → AlertCenter, RainfallRadar warnings
 * useIMDRainfall()          → RainfallRadar district table
 * useRadarMetadata()        → LiveMap animated radar layer ONLY
 * useDataMeta()             → DataSources /status page ONLY
 *
 * Open-Meteo weather/GloFAS are called PER-STATION in StationPopup
 * and RiverForecast — NOT in the global scraper.
 */
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { CWCStationSchema, IMDWarningSchema,
         CWCFfsStationSchema, CWCInflowSchema } from '../api/schemas';
import { fetchStationsAboveWarning, fetchInflowForecastStations,
         fetchStationsAboveDanger, fetchFloodSituationSummary } from '../api/cwcFfsApi';
import { fetchDistrictWarnings, fetchDistrictRainfall,
         fetchStatewiseRainfall, fetchBasinQPF,
         fetchStateDistrictForecast, fetchAWSData } from '../api/imdApi';

// ── CWC mock stations (local file) ──────────────────────────────────────────
export const useCWCStations = () =>
  useQuery({
    queryKey: ['cwc-stations'],
    queryFn: async () => {
      const res = await fetch('/mock/cwc_stations.json');
      if (!res.ok) throw new Error('CWC fetch failed');
      return z.array(CWCStationSchema).parse(await res.json());
    }
  });

// ── CWC FFS — real-time above warning (live flood alerts) ───────────────────
export const useCWCAboveWarning = () =>
  useQuery({
    queryKey: ['cwc-ffs-warning'],
    queryFn: async () => {
      const data = await fetchStationsAboveWarning();
      return z.array(CWCFfsStationSchema).parse(data);
    },
    refetchInterval: 15 * 60 * 1000,
    staleTime:       12 * 60 * 1000,
    retry: 2,
  });

// ── CWC FFS — above danger ──────────────────────────────────────────────────
export const useCWCAboveDanger = () =>
  useQuery({
    queryKey: ['cwc-ffs-danger'],
    queryFn: async () => {
      try {
        const data = await fetchStationsAboveDanger();
        return z.array(CWCFfsStationSchema).parse(data);
      } catch { return []; }
    },
    refetchInterval: 15 * 60 * 1000,
  });

// ── CWC FFS — inflow/reservoir stations ────────────────────────────────────
export const useCWCInflowStations = () =>
  useQuery({
    queryKey: ['cwc-ffs-inflow'],
    queryFn: async () => {
      const data = await fetchInflowForecastStations();
      return z.array(CWCInflowSchema).parse(data);
    },
    refetchInterval: 3 * 60 * 60 * 1000,
    staleTime:       2 * 60 * 60 * 1000,
  });

// ── IMD district warnings ───────────────────────────────────────────────────
export const useIMDWarnings = () =>
  useQuery({
    queryKey: ['imd-warnings'],
    queryFn: async () => {
      try {
        const data = await fetchDistrictWarnings();
        return z.array(IMDWarningSchema).parse(
          Array.isArray(data) ? data : []
        );
      } catch {
        const res = await fetch('/mock/imd_district_warnings.json');
        return z.array(IMDWarningSchema).parse(await res.json());
      }
    },
    refetchInterval: 3 * 60 * 60 * 1000,
  });

// ── IMD district rainfall ───────────────────────────────────────────────────
export const useIMDRainfall = () =>
  useQuery({
    queryKey: ['imd-rainfall'],
    queryFn:  fetchDistrictRainfall,
    refetchInterval: 3 * 60 * 60 * 1000,
  });

// ── IMD state rainfall ──────────────────────────────────────────────────────
export const useIMDStatewiseRainfall = () =>
  useQuery({
    queryKey: ['imd-statewise'],
    queryFn:  fetchStatewiseRainfall,
    refetchInterval: 3 * 60 * 60 * 1000,
  });

// ── IMD basin QPF ───────────────────────────────────────────────────────────
export const useBasinQPF = () =>
  useQuery({
    queryKey: ['imd-basin-qpf'],
    queryFn:  fetchBasinQPF,
    refetchInterval: 6 * 60 * 60 * 1000,
  });

// ── IMD 5-day state forecast ────────────────────────────────────────────────
export const useStateDistrictForecast = () =>
  useQuery({
    queryKey: ['imd-5d-forecast'],
    queryFn:  fetchStateDistrictForecast,
    refetchInterval: 6 * 60 * 60 * 1000,
  });

// ── Data meta (freshness) ───────────────────────────────────────────────────
export const useDataMeta = () =>
  useQuery({
    queryKey: ['data-meta'],
    queryFn: async () => {
      const res = await fetch('/mock/_meta.json');
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

// ── Radar Metadata (RainViewer) ─────────────────────────────────────────────
export const useRadarMetadata = () =>
  useQuery({
    queryKey: ['radar-metadata'],
    queryFn: async () => {
      // Try local scraper output first
      try {
        const r = await fetch('/mock/radar_metadata.json');
        if (r.ok) return r.json();
      } catch {}
      // Fallback: fetch directly from RainViewer (free, no key)
      const r = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const data = await r.json();
      return {
        radar: data.radar,
        satellite: { infrared: data.satellite?.infrared?.slice(-6) },
        tile_url_template: 'https://tilecache.rainviewer.com/v2/radar/{path}/256/{z}/{x}/{y}/4/1_1.png',
      };
    },
    refetchInterval: 10 * 60 * 1000, // 10 min — matches RainViewer update cycle
    staleTime:        8 * 60 * 1000,
  });
