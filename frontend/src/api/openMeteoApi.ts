/**
 * Open-Meteo API — completely free, no key, no auth
 * ECMWF IFS 0.4° model — best available for India
 * Called per station lat/lon for the popup Weather tab
 */

const WEATHER_BASE = 'https://api.open-meteo.com/v1/forecast';
const FLOOD_BASE   = 'https://flood-api.open-meteo.com/v1/flood';

export async function fetchStationWeather(lat: number, lon: number) {
  const url = new URL(WEATHER_BASE);
  url.searchParams.set('latitude',  lat.toString());
  url.searchParams.set('longitude', lon.toString());
  url.searchParams.set('hourly', [
    'temperature_2m', 'relativehumidity_2m', 'dewpoint_2m',
    'precipitation', 'cloudcover',
    'windspeed_10m', 'winddirection_10m', 'windgusts_10m',
    'visibility', 'surface_pressure',
    'soil_moisture_0_1cm', 'soil_moisture_1_3cm', 'soil_moisture_3_9cm',
  ].join(','));
  url.searchParams.set('daily', 'precipitation_sum,et0_fao_evapotranspiration');
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('models', 'ecmwf_ifs04');
  url.searchParams.set('timezone', 'Asia/Kolkata');

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Open-Meteo weather: ${res.status}`);
  return res.json();
}

export async function fetchStationFloodForecast(lat: number, lon: number) {
  const url = `${FLOOD_BASE}?latitude=${lat}&longitude=${lon}&daily=river_discharge&forecast_days=7`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Open-Meteo GloFAS: ${res.status}`);
  return res.json();
}

/** Get current hour's weather values from hourly array */
export function getCurrentHourWeather(hourlyData: Record<string, (number | null)[]>, times: string[]) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const currentHourISO = istNow.toISOString().slice(0, 13);

  const idx = times.findIndex(t => t.startsWith(currentHourISO));
  const safeIdx = idx >= 0 ? idx : 0;

  return {
    temperature:    hourlyData['temperature_2m']?.[safeIdx]       ?? null,
    humidity:       hourlyData['relativehumidity_2m']?.[safeIdx]   ?? null,
    dewpoint:       hourlyData['dewpoint_2m']?.[safeIdx]           ?? null,
    precipitation:  hourlyData['precipitation']?.[safeIdx]         ?? null,
    cloudcover:     hourlyData['cloudcover']?.[safeIdx]            ?? null,
    windspeed:      hourlyData['windspeed_10m']?.[safeIdx]         ?? null,
    winddirection:  hourlyData['winddirection_10m']?.[safeIdx]     ?? null,
    windgusts:      hourlyData['windgusts_10m']?.[safeIdx]         ?? null,
    visibility:     hourlyData['visibility']?.[safeIdx]            ?? null,  // m → km
    pressure:       hourlyData['surface_pressure']?.[safeIdx]      ?? null,
    soil_moisture:  hourlyData['soil_moisture_0_1cm']?.[safeIdx]   ?? null,
  };
}

/** Compass direction from degrees */
export function degToCompass(deg: number | null): string {
  if (deg === null) return '–';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE',
                 'S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16] ?? 'N';
}
