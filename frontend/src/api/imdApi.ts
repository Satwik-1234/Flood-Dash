/**
 * IMD API (India Meteorological Department)
 * All endpoints require IP whitelisting via Cloudflare Worker.
 * Falls back to mock data when unavailable.
 * Production IP to whitelist: Your Cloudflare Worker static IP
 * Whitelist contact: nhac@imd.gov.in
 */

// Use Cloudflare Worker proxy URL in production
// In development: falls back to mock data
const CF_WORKER = (import.meta as any).env.VITE_CF_WORKER_URL || '';
const IMD_BASE  = 'https://mausam.imd.gov.in/api';
const CITY_BASE = 'https://city.imd.gov.in/api';

const imdUrl = (path: string) =>
  CF_WORKER ? `${CF_WORKER}/proxy/imd/${path}` : `${IMD_BASE}/${path}`;
const cityUrl = (path: string) =>
  CF_WORKER ? `${CF_WORKER}/proxy/city/${path}` : `${CITY_BASE}/${path}`;

async function imdFetch(url: string, mockFallback: string): Promise<unknown> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`IMD ${res.status}`);
    return res.json();
  } catch {
    // Fall back to mock data when IMD is unavailable (IP not whitelisted)
    const mock = await fetch(mockFallback);
    if (!mock.ok) throw new Error(`Mock fallback also failed: ${mockFallback}`);
    return mock.json();
  }
}

/** 7-day city weather forecast by lat/lon */
export async function fetchCityWeatherByLocation(lat: number, lon: number) {
  return imdFetch(
    cityUrl(`cityweather_loc.php?lat=${lat}&lon=${lon}`),
    '/mock/imd_district_warnings.json'
  );
}

/** Current weather for a specific station */
export async function fetchCurrentWeather(stationId?: string) {
  const path = stationId
    ? `current_wx_api.php?id=${stationId}`
    : 'current_wx_api.php';
  return imdFetch(imdUrl(path), '/mock/imd_district_warnings.json');
}

/** District nowcast — 1-3h forecast */
export async function fetchDistrictNowcast(districtId?: number) {
  const path = districtId
    ? `nowcast_district_api.php?id=${districtId}`
    : 'nowcast_district_api.php';
  return imdFetch(imdUrl(path), '/mock/imd_district_warnings.json');
}

/** District rainfall observed */
export async function fetchDistrictRainfall() {
  return imdFetch(imdUrl('districtwise_rainfall_api.php'), '/mock/imd_district_warnings.json');
}

/** District 5-day warnings (warning_code 1=Green 2=Yellow 3=Orange 4=Red) */
export async function fetchDistrictWarnings(districtId?: number) {
  const path = districtId
    ? `warnings_district_api.php?id=${districtId}`
    : 'warnings_district_api.php';
  return imdFetch(imdUrl(path), '/mock/imd_district_warnings.json');
}

/** State rainfall summary */
export async function fetchStatewiseRainfall() {
  return imdFetch(imdUrl('statewise_rainfall_api.php'), '/mock/state_weather.json');
}

/** AWS/ARG real-time station data */
export async function fetchAWSData() {
  return imdFetch(cityUrl('aws_data_api.php'), '/mock/cwc_stations.json');
}

/** River basin QPF (Quantitative Precipitation Forecast) */
export async function fetchBasinQPF() {
  return imdFetch(imdUrl('basin_qpf_api.php'), '/mock/glofas_rivers.json');
}

/** 5-day state+district RF forecast */
export async function fetchStateDistrictForecast() {
  return imdFetch(
    imdUrl('api_5d_statewisedistricts_rf_forecast.php'),
    '/mock/state_weather.json'
  );
}

/** Sub-division wise 5-day rainfall */
export async function fetchSubdivisionRainfall() {
  return imdFetch(imdUrl('subdivisionwise_rainfall_api.php'), '/mock/state_weather.json');
}
