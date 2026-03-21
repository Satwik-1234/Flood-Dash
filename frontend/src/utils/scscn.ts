/**
 * SCS Curve Number Runoff Model
 * From Satwik's Agricultural Engineering curriculum — this is core hydrology.
 * Reference: USDA-NRCS TR-55, adopted for Indian conditions per IS:11223.
 *
 * Converts raw rainfall P (mm) into effective runoff Q (mm) using:
 *   Q = (P - 0.2S)² / (P + 0.8S)   where S = (25400/CN) - 254
 *
 * AMC class is determined from 5-day Antecedent Precipitation Index (API).
 * During monsoon season (Jun–Oct), use the growing-season thresholds.
 */

export type AMCClass = 'I' | 'II' | 'III';

export interface SCSCNResult {
  cn_ii:           number;  // Base CN (AMC-II)
  cn_adjusted:     number;  // CN after AMC correction
  amc_class:       AMCClass;
  S_mm:            number;  // Max potential retention (mm)
  rainfall_P_mm:   number;  // Input rainfall (mm)
  runoff_Q_mm:     number;  // Effective runoff (mm)
  runoff_ratio:    number;  // Q/P — fraction of rain that becomes runoff
  plain_language:  string;  // Human-readable explanation
}

/** AMC class from 5-day antecedent rain (monsoon season thresholds) */
export function computeAMCClass(api5day_mm: number): AMCClass {
  if (api5day_mm < 36)  return 'I';    // Dry — low antecedent moisture
  if (api5day_mm < 53)  return 'II';   // Average
  return 'III';                         // Wet — saturated soil
}

/** AMC-I and AMC-III adjustments to base CN (AMC-II) */
export function adjustCNForAMC(cn_ii: number, amc: AMCClass): number {
  if (amc === 'I')   return (4.2 * cn_ii) / (10 - 0.058 * cn_ii);
  if (amc === 'III') return (23 * cn_ii)  / (10 + 0.13 * cn_ii);
  return cn_ii;  // AMC-II unchanged
}

/** Core SCS-CN runoff calculation */
export function computeEffectiveRunoff(
  rainfall_mm: number,
  cn_ii:        number,
  amc_class:    AMCClass = 'II',
): SCSCNResult {
  const cn  = Math.max(1, Math.min(99, adjustCNForAMC(cn_ii, amc_class)));
  const S   = (25400 / cn) - 254;  // Max potential retention (mm)
  const Ia  = 0.2 * S;              // Initial abstraction (mm)

  const Q = rainfall_mm <= Ia
    ? 0
    : Math.pow(rainfall_mm - Ia, 2) / (rainfall_mm + 0.8 * S);

  const ratio = rainfall_mm > 0 ? Q / rainfall_mm : 0;

  const amcLabels = {
    'I':   'Dry soil (early monsoon)',
    'II':  'Average moisture',
    'III': 'Saturated soil (active monsoon)',
  };

  return {
    cn_ii,
    cn_adjusted:    Math.round(cn * 10) / 10,
    amc_class,
    S_mm:           Math.round(S * 10) / 10,
    rainfall_P_mm:  Math.round(rainfall_mm * 10) / 10,
    runoff_Q_mm:    Math.round(Q * 10) / 10,
    runoff_ratio:   Math.round(ratio * 1000) / 1000,
    plain_language: `${Math.round(ratio * 100)}% of rainfall became direct runoff. `
                  + `Soil condition: ${amcLabels[amc_class]}.`,
  };
}

/**
 * Approximate CN-II for Maharashtra river basins.
 * Based on NRSC LULC + NBSS soil data (pre-computed reference values).
 * Production system loads this from data/static/catchment_cn.json
 */
export const BASIN_CN_LOOKUP: Record<string, number> = {
  'Bhima':      78,  // Mixed agriculture + scrub, soil group C
  'Panchganga': 82,  // Dense agriculture, soil group C/D
  'Krishna':    75,  // Mixed forest/agriculture, soil group B/C
  'Godavari':   72,  // Forest + agriculture, soil group B
  'Mula-Mutha': 88,  // Urban + agriculture, soil group C/D (Pune)
  'DEFAULT':    76,
};
