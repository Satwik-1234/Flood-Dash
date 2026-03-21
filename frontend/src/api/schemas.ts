import { z } from 'zod';

export const CWCStationSchema = z.object({
  station_code:          z.string(),
  basin:                 z.string(),
  river:                 z.string(),
  timestamp:             z.string(),
  current_water_level_m: z.number(),
  warning_level_m:       z.number(),
  danger_level_m:        z.number(),
  trend:                 z.enum(['RISING', 'FALLING', 'STEADY']),
  is_stale:              z.boolean().default(false),
  lat:                   z.number().optional(),
  lon:                   z.number().optional(),
  station_name:          z.string().optional(),
  state:                 z.string().optional(),
});

export type CWCStationData = z.infer<typeof CWCStationSchema>;

export const IMDWarningSchema = z.object({
  id: z.string(),
  district: z.string(),
  severity: z.enum(['EXTREME', 'SEVERE', 'MODERATE', 'WATCH']),
  rainfall_24h_mm: z.number(),
  issued_at: z.string(),
  is_stale: z.boolean().default(false)
});

export type IMDWarningData = z.infer<typeof IMDWarningSchema>;
