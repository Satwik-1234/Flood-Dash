/**
 * Muskingum Flood Routing — Travel Time Lookup
 * Propagates flood peak from upstream CWC station to downstream stations.
 * K = travel time in hours, X = attenuation factor (0 = full attenuation, 0.5 = none)
 * Parameters estimated from HydroSHEDS channel geometry + historical event pairs.
 *
 * This gives FREE advance warning from upstream observations —
 * no ML needed, just physics.
 */

export interface DownstreamStation {
  station_code:      string;
  station_name:      string;
  river:             string;
  travel_time_hours: number;
  attenuation_X:     number;
  estimated_prob_pct: number;  // Attenuated from upstream probability
}

/** Routing graph: upstream station → list of downstream stations */
export const ROUTING_GRAPH: Record<string, DownstreamStation[]> = {
  'CWC_BHM_UJN_001': [
    { station_code: 'CWC_BHM_PND_005', station_name: 'Pandharpur Bhima', river: 'Bhima',
      travel_time_hours: 10, attenuation_X: 0.20, estimated_prob_pct: 0 },
  ],
  'CWC_PCG_SHN_001': [
    { station_code: 'CWC_PCG_KLH_006', station_name: 'Kolhapur Rajaram', river: 'Panchganga',
      travel_time_hours: 6, attenuation_X: 0.22, estimated_prob_pct: 0 },
  ],
  'CWC_KRS_SNG_002': [
    { station_code: 'CWC_KRS_KRD_007', station_name: 'Karad Krishna', river: 'Krishna',
      travel_time_hours: 8, attenuation_X: 0.18, estimated_prob_pct: 0 },
    { station_code: 'CWC_KRS_NNG_008', station_name: 'Narayangaon Krishna', river: 'Krishna',
      travel_time_hours: 18, attenuation_X: 0.16, estimated_prob_pct: 0 },
  ],
  'CWC_MLA_PNE_004': [
    { station_code: 'CWC_MLA_MBR_009', station_name: 'Mundhwa Mula-Mutha', river: 'Mula-Mutha',
      travel_time_hours: 3, attenuation_X: 0.25, estimated_prob_pct: 0 },
  ],
};

/** Compute attenuated downstream probability from upstream risk level */
export function propagateRisk(
  upstream_station_code: string,
  current_level_m:       number,
  danger_level_m:        number,
): DownstreamStation[] {
  const downstream = ROUTING_GRAPH[upstream_station_code] ?? [];
  const levelRatio = danger_level_m > 0 ? current_level_m / danger_level_m : 0;
  const baseProbPct = Math.min(100, Math.round(levelRatio * 110));  // rough probability from level

  return downstream.map(ds => ({
    ...ds,
    estimated_prob_pct: Math.round(
      baseProbPct * (1 - ds.attenuation_X * 0.4) * Math.max(0, 1 - ds.travel_time_hours / 72)
    ),
  }));
}
