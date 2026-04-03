// frontend/src/constants/gisConfig.ts
// Authoritative India-WRIS / NWIC GIS Configuration

export const INDIA_BOUNDS: [number, number, number, number] = [68, 6, 98, 38];
export const INDIA_CENTER: [number, number] = [82, 22];
export const INDIA_ZOOM_MIN = 4;
export const INDIA_ZOOM_DEFAULT = 5;

export const BASEMAPS = {
  CARTO_LIGHT:  'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
  CARTO_DARK:   'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
  STADIA_DARK:  'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png',
  OSM_STANDARD: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
} as const;

const BASE = import.meta.env.BASE_URL || '/';

export const GEO_LAYERS = {
  INDIA_DISTRICTS:  `${BASE}geo/india_districts.geojson`,
  INDIA_STATES:     `${BASE}geo/india_states.geojson`,
  // Official CWC Basin GeoJSON fallback (local)
  INDIA_BASINS:     `${BASE}geo/basin_cwc.geojson`,
} as const;

// ─── AUTHORITATIVE WRIS REST ENDPOINTS (HTTPS) ─────────────────────────
export const WRIS_REST = {
  SERVICES:   'https://arc.indiawris.gov.in/server/rest/services',
  BASIN:      'https://arc.indiawris.gov.in/server/rest/services/Common/Basin_WRP/MapServer',
  RIVER:      'https://arc.indiawris.gov.in/server/rest/services/Common/River_WRP/MapServer',
  WATER_PROJECTS: 'https://arc.indiawris.gov.in/server/rest/services/DataDownload/Water_Resource_Project_Data/MapServer',
  TELEMETRY:  'https://arc.indiawris.gov.in/server/rest/services/DataDownload/Telemetry_Stations_Data/MapServer',
} as const;

export const WRIS_LAYERS = {
  BASIN:    0,
  RIVERS:   0,
  DAMS:     3,
  BARRAGES: 1,
  TELEMETRY: 0,
} as const;

export const OPEN_METEO = {
  WEATHER:  'https://api.open-meteo.com/v1/forecast',
  FLOOD:    'https://flood-api.open-meteo.com/v1/flood',
  PARAMS: {
    HOURLY: 'precipitation,soil_moisture_0_1cm,soil_moisture_1_3cm,soil_moisture_3_9cm',
    DAILY:  'precipitation_sum,et0_fao_evapotranspiration,rain_sum',
    MODEL:  'ecmwf_ifs04',
  },
} as const;

export const IMD_APIS = {
  DISTRICT_WARNINGS:  'https://mausam.imd.gov.in/api/warnings_district_api.php',
  DISTRICT_RAINFALL:  'https://mausam.imd.gov.in/api/districtwise_rainfall_api.php',
  DISTRICT_NOWCAST:   'https://mausam.imd.gov.in/api/nowcast_district_api.php',
  STATEWISE_RAINFALL: 'https://mausam.imd.gov.in/api/statewise_rainfall_api.php',
} as const;
