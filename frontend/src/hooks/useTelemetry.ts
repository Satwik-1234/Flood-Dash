import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { CWCStationSchema, IMDWarningSchema } from '../api/schemas';

const CWCArraySchema = z.array(CWCStationSchema);
const IMDArraySchema = z.array(IMDWarningSchema);

/**
 * Custom hooks to fetch Mock telemetry arrays via standard HTTP methods.
 * Note: Zod parses the array to ensure strict runtime type safety.
 */

export const useCWCStations = () => {
  return useQuery({
    queryKey: ['cwc-stations'],
    queryFn: async () => {
      // In production, this would be `https://api.floodsentinel.gov.in/v1/cwc/stations`
      const res = await fetch('/mock/cwc_stations.json');
      if (!res.ok) throw new Error('CWC Network Unavailable');
      const raw = await res.json();
      return CWCArraySchema.parse(raw);
    }
  });
};

export const useIMDWarnings = () => {
  return useQuery({
    queryKey: ['imd-warnings'],
    queryFn: async () => {
      const res = await fetch('/mock/imd_district_warnings.json');
      if (!res.ok) throw new Error('IMD API Failure');
      const raw = await res.json();
      return IMDArraySchema.parse(raw);
    }
  });
};

export const useGloFASSample = () => {
  return useQuery({
    queryKey: ['glofas-sample'],
    queryFn: async () => {
      const res = await fetch('/mock/glofas_sample_discharge.json');
      if (!res.ok) throw new Error('GloFAS fetch failed');
      return res.json();  // Raw GloFAS response — no strict schema for now
    },
    staleTime: 6 * 60 * 60 * 1000,  // 6h TTL matches GloFAS update cycle
  });
};

export const useDataMeta = () => {
  return useQuery({
    queryKey: ['data-meta'],
    queryFn: async () => {
      const res = await fetch('/mock/_meta.json');
      if (!res.ok) throw new Error('Meta fetch failed');
      return res.json() as Promise<{
        generated_at: string;
        sources: Record<string, { status: string; records: number; last_fetch: string }>;
      }>;
    },
    refetchInterval: 5 * 60 * 1000,  // Check freshness every 5 min
  });
};
