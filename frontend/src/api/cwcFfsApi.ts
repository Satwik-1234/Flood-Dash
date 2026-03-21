/**
 * CWC FFS (Flood Forecasting System) API
 * Real-time government flood data — zero authentication
 * Source: ffs.india-water.gov.in (discovered via DevTools inspection)
 */

const FFS_BASE   = 'https://ffs.india-water.gov.in/ffm/api';
const WIMS_BASE  = 'https://ffs.india-water.gov.in/wims-messaging/api';

async function ffsFetch(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      'Referer': 'https://ffs.india-water.gov.in/',
      'Accept':  'application/json, text/plain, */*',
    },
  });
  if (!res.ok) throw new Error(`FFS API ${res.status}: ${url}`);
  return res.json();
}

export async function fetchStationsAboveWarning() {
  return ffsFetch(`${FFS_BASE}/station-water-level-above-warning/`);
}

export async function fetchStationsAboveDanger() {
  return ffsFetch(`${FFS_BASE}/station-water-level-above-danger/`);
}

export async function fetchFloodSituationSummary() {
  return ffsFetch(`${FFS_BASE}/flood-situation-summary/`);
}

export async function fetchInflowForecastStations() {
  return ffsFetch(`${WIMS_BASE}/inflow-forecast-station/`);
}

export async function fetchLevelForecastStations() {
  return ffsFetch(`${WIMS_BASE}/level-forecast-station/`);
}

export async function fetchReservoirStorage() {
  return ffsFetch(`${WIMS_BASE}/reservoir-storage/`);
}
