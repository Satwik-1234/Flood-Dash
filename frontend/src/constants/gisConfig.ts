// frontend/src/constants/gisConfig.ts
// Complete GIS configuration for Pravhatattva — All India

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
  INDIA_RIVERS:     `${BASE}geo/india_hydrorivers.geojson`,
  INDIA_BASINS:     `${BASE}geo/india_hydrobasins_lev5.geojson`,
} as const;

export const WMS_ENDPOINTS = {
  BHUVAN_BASE:      'https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms',
  BHUVAN_RASTER:    'https://bhuvan-ras2.nrsc.gov.in/cgi-bin/',
  WRIS_BASIN:       'http://india-wris.nrsc.gov.in/arcgis/services/SubInfoSysLCC/Basin/MapServer/WMSServer',
  WRIS_WATER:       'http://india-wris.nrsc.gov.in/arcgis/services/SubInfoSysLCC/SurfaceWaterBodyInfoSysWetLands/MapServer/WMSServer',
  WRIS_DAMS:        'http://india-wris.nrsc.gov.in/arcgis/services/SubInfoSysLCC/Dam/MapServer/WMSServer',
  WRIS_STATIONS:    'http://india-wris.nrsc.gov.in/arcgis/services/SubInfoSysLCC/FloodForecasting/MapServer/WMSServer',
} as const;

export const BHUVAN_LAYERS = {
  LULC_2425:        'LULC250K_2425',
  FLOOD_HAZARD:     'flood_hazard',
  FLOOD_ANNUAL:     (year: number) => `flood_annual_${year}`,
  GLACIAL_LAKES:    'glacial_lake',
  WATER_BODIES:     'india_waterbody',
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
  BASIN_QPF:          'https://mausam.imd.gov.in/api/basin_qpf_api.php',
  AWS_DATA:           'https://city.imd.gov.in/api/aws_data_api.php',
  FIVE_DAY_FORECAST:  'https://mausam.imd.gov.in/api/api_5d_statewisedistricts_rf_forecast.php',
} as const;

export const MAPPLS = {
  TOKEN_URL:    'https://outpost.mapmyindia.com/api/security/oauth/token',
  TILES:        'https://apis.mappls.com/advancedmaps/v1/{token}/{z}/{x}/{y}.png',
  GEOCODE:      'https://atlas.mappls.com/api/places/geocode',
  SEARCH:       'https://atlas.mappls.com/api/places/search/json',
  DEVELOPER:    'https://developer.mappls.com/',
} as const;

export const GDACS = {
  INDIA_FLOODS: 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventtype=FL&country=IND',
} as const;
