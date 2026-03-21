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
