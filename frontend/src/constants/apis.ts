export const API_ENDPOINTS = {
  IMD: {
    DISTRICT_WARNINGS:  'https://mausam.imd.gov.in/api/warnings_district_api.php',
    DISTRICT_RAINFALL:  'https://mausam.imd.gov.in/api/districtwise_rainfall_api.php',
    STATEWISE_RAINFALL: 'https://mausam.imd.gov.in/api/statewise_rainfall_api.php',
    NOWCAST_DISTRICT:   'https://mausam.imd.gov.in/api/nowcast_district_api.php',
    BASIN_QPF:          'https://mausam.imd.gov.in/api/basin_qpf_api.php',
    AWS_DATA:           'https://city.imd.gov.in/api/aws_data_api.php',
  },
  OPEN_METEO: {
    FLOOD:    'https://flood-api.open-meteo.com/v1/flood',
    WEATHER:  'https://api.open-meteo.com/v1/forecast',
  },
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
  IMD_WARNINGS:    3 * 60 * 60 * 1000,  // 3 hours
  IMD_RAINFALL:    3 * 60 * 60 * 1000,  // 3 hours
  GLOFAS:          6 * 60 * 60 * 1000,  // 6 hours
  GDACS:           1 * 60 * 60 * 1000,  // 1 hour
  GPM_IMERG:       30 * 60 * 1000,      // 30 minutes
} as const;
