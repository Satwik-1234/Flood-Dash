// frontend/src/constants/apis.ts
export const CWC_FFS = {
  ABOVE_WARNING: 'https://ffs.india-water.gov.in/ffm/api/station-water-level-above-warning/',
  ABOVE_DANGER:  'https://ffs.india-water.gov.in/ffm/api/station-water-level-above-danger/',
  FLOOD_SUMMARY: 'https://ffs.india-water.gov.in/ffm/api/flood-situation-summary/',
  INFLOW:        'https://ffs.india-water.gov.in/wims-messaging/api/inflow-forecast-station/',
  LEVEL_FCST:    'https://ffs.india-water.gov.in/wims-messaging/api/level-forecast-station/',
  RESERVOIR:     'https://ffs.india-water.gov.in/wims-messaging/api/reservoir-storage/',
} as const;

export const IMD_APIS = {
  CITY_WEATHER:        'https://city.imd.gov.in/api/cityweather.php',
  CITY_WEATHER_LOC:    'https://city.imd.gov.in/api/cityweather_loc.php',
  CURRENT_WX:          'https://mausam.imd.gov.in/api/current_wx_api.php',
  NOWCAST_DISTRICT:    'https://mausam.imd.gov.in/api/nowcast_district_api.php',
  DISTRICT_RAINFALL:   'https://mausam.imd.gov.in/api/districtwise_rainfall_api.php',
  DISTRICT_WARNINGS:   'https://mausam.imd.gov.in/api/warnings_district_api.php',
  STATION_NOWCAST:     'https://mausam.imd.gov.in/api/nowcastapi.php',
  STATEWISE_RAINFALL:  'https://mausam.imd.gov.in/api/statewise_rainfall_api.php',
  AWS_DATA:            'https://city.imd.gov.in/api/aws_data_api.php',
  BASIN_QPF:           'https://mausam.imd.gov.in/api/basin_qpf_api.php',
  FIVE_DAY_FORECAST:   'https://mausam.imd.gov.in/api/api_5d_statewisedistricts_rf_forecast.php',
  SUBDIVISION_WARN:    'https://mausam.imd.gov.in/api/api_subDivisionWiseWarning.php',
  SUBDIVISION_RF:      'https://mausam.imd.gov.in/api/subdivisionwise_rainfall_api.php',
  RSS_NOWCAST:         'https://mausam.imd.gov.in/imd_latest/contents/dist_nowcast_rss.php',
  // IGNORED (not flood-relevant):
  // PORT_WARNING, SEA_AREA_BULLETIN, COASTAL_BULLETIN
} as const;

export const OPEN_METEO = {
  WEATHER: 'https://api.open-meteo.com/v1/forecast',
  FLOOD:   'https://flood-api.open-meteo.com/v1/flood',
} as const;

export const API_ENDPOINTS = {
  IMD: IMD_APIS,
  OPEN_METEO: OPEN_METEO,
  GDACS: {
    EVENTS: 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventtype=FL&country=IND',
  },
  CWC: {
    AFF: 'https://aff.india-water.gov.in',
  },
  GIS: {
    BHUVAN_WMS: 'https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms',
    OSM_TILES:  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
} as const;

export const API_TTL_MS = {
  CWC_FFS:        15 * 60 * 1000,   // 15 min — real CWC update cycle
  IMD_WARNINGS:   3  * 60 * 60 * 1000,
  IMD_RAINFALL:   3  * 60 * 60 * 1000,
  BASIN_QPF:      6  * 60 * 60 * 1000,
  GLOFAS:         6  * 60 * 60 * 1000,
  OPEN_METEO_WX:  6  * 60 * 60 * 1000,
  STATION_POPUP:  30 * 60 * 1000,   // weather per station — 30 min
} as const;
