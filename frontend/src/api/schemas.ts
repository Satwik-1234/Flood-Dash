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
  district:              z.string().optional(),
  cwc_id:                z.number().optional(),
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

// ── CWC FFS Station (above warning) ──────────────────────────────────────────
export const CWCFfsStationSchema = z.object({
  id:                   z.number().optional(),
  station_name:         z.string(),
  station_code:         z.string().optional(),
  river:                z.string().optional(),
  state:                z.string().optional(),
  district:             z.string().optional(),
  basin:                z.string().optional(),
  lat:                  z.coerce.number().optional(),
  lon:                  z.coerce.number().optional(),
  current_level_m:      z.coerce.number().optional(),
  warning_level_m:      z.coerce.number().optional(),
  danger_level_m:       z.coerce.number().optional(),
  hfl_m:                z.coerce.number().optional(),
  flood_situation:      z.string().optional(),
  situation_color:      z.string().optional(),
  observed_at:          z.string().optional(),
  forecast_level_m:     z.coerce.number().optional(),
}).passthrough();   // passthrough until exact field names confirmed

export type CWCFfsStation = z.infer<typeof CWCFfsStationSchema>;

// ── CWC FFS Inflow/Reservoir station ─────────────────────────────────────────
export const CWCInflowSchema = z.object({
  id:                     z.number().optional(),
  station_name:           z.string(),
  river:                  z.string().optional(),
  state:                  z.string().optional(),
  lat:                    z.coerce.number().optional(),
  lon:                    z.coerce.number().optional(),
  fill_pct:               z.coerce.number().optional(),
  current_level_m:        z.coerce.number().optional(),
  inflow_cumecs:          z.coerce.number().optional(),
  outflow_cumecs:         z.coerce.number().optional(),
  forecast_inflow_cumecs: z.coerce.number().optional(),
  observed_at:            z.string().optional(),
}).passthrough();

export type CWCInflow = z.infer<typeof CWCInflowSchema>;

// ── IMD Current Weather ───────────────────────────────────────────────────────
export const IMDCurrentWeatherSchema = z.object({
  Station_Code:            z.string().optional(),
  Station_Name:            z.string().optional(),
  Date:                    z.string().optional(),
  CURR_TEMP:               z.coerce.number().optional(),    // °C
  DEW_POINT_TEMP:          z.coerce.number().optional(),    // °C
  RH:                      z.coerce.number().optional(),    // %
  WIND_DIRECTION:          z.coerce.number().optional(),    // degrees
  WIND_SPEED:              z.coerce.number().optional(),    // km/h
  MSLP:                    z.coerce.number().optional(),    // hPa
  Past_24_hrs_Rainfall:    z.coerce.number().optional(),    // mm
  Latitude:                z.coerce.number().optional(),
  Longitude:               z.coerce.number().optional(),
}).passthrough();

export type IMDCurrentWeather = z.infer<typeof IMDCurrentWeatherSchema>;

// ── IMD District Warning ──────────────────────────────────────────────────────
export const IMDDistrictWarningSchema = z.object({
  id:                   z.string().optional(),
  district:             z.string().optional(),
  state:                z.string().optional(),
  severity:             z.enum(['EXTREME','SEVERE','MODERATE','WATCH']).optional(),
  // Warning code: 1=Green, 2=Yellow, 3=Orange, 4=Red
  warning_code_day1:    z.coerce.number().optional(),
  warning_code_day2:    z.coerce.number().optional(),
  warning_code_day3:    z.coerce.number().optional(),
  warning_code_day4:    z.coerce.number().optional(),
  warning_code_day5:    z.coerce.number().optional(),
  rainfall_24h_mm:      z.coerce.number().optional(),
  issued_at:            z.string().optional(),
  is_stale:             z.boolean().default(false),
}).passthrough();

export type IMDDistrictWarning = z.infer<typeof IMDDistrictWarningSchema>;

// ── IMD City Weather (7-day forecast) ────────────────────────────────────────
export const IMDCityForecastSchema = z.object({
  Station_Name:            z.string().optional(),
  Station_Code:            z.string().optional(),
  Date:                    z.string().optional(),
  Today_Max_Temp:          z.coerce.number().optional(),
  Today_Min_Temp:          z.coerce.number().optional(),
  Todays_Forecast:         z.string().optional(),
  Day_2_Max_Temp:          z.coerce.number().optional(),
  Day_2_Min_Temp:          z.coerce.number().optional(),
  Day_2_Forecast:          z.string().optional(),
  Day_3_Max_Temp:          z.coerce.number().optional(),
  Day_3_Min_Temp:          z.coerce.number().optional(),
  Day_3_Forecast:          z.string().optional(),
  Day_4_Max_Temp:          z.coerce.number().optional(),
  Day_4_Min_Temp:          z.coerce.number().optional(),
  Day_5_Max_Temp:          z.coerce.number().optional(),
  Day_5_Min_Temp:          z.coerce.number().optional(),
  Past_24_hrs_Rainfall:    z.coerce.number().optional(),
  Relative_Humidity_0830:  z.coerce.number().optional(),
  Relative_Humidity_1730:  z.coerce.number().optional(),
}).passthrough();

// ── IMD AWS Station ───────────────────────────────────────────────────────────
export const IMDAWSSchema = z.object({
  Station_Code:    z.string().optional(),
  Station_Name:    z.string().optional(),
  Latitude:        z.coerce.number().optional(),
  Longitude:       z.coerce.number().optional(),
  CURR_TEMP:       z.coerce.number().optional(),
  DEW_POINT_TEMP:  z.coerce.number().optional(),
  RH:              z.coerce.number().optional(),
  WIND_DIRECTION:  z.coerce.number().optional(),
  WIND_SPEED:      z.coerce.number().optional(),
  MSLP:            z.coerce.number().optional(),
  Past_24hrs_Rain: z.coerce.number().optional(),
}).passthrough();

// ── Open-Meteo combined weather (for popup Weather tab) ──────────────────────
export const OpenMeteoWeatherSchema = z.object({
  latitude:           z.number(),
  longitude:          z.number(),
  hourly: z.object({
    time:                 z.array(z.string()),
    temperature_2m:       z.array(z.number().nullable()),
    relativehumidity_2m:  z.array(z.number().nullable()),
    dewpoint_2m:          z.array(z.number().nullable()),
    precipitation:        z.array(z.number().nullable()),
    cloudcover:           z.array(z.number().nullable()),
    windspeed_10m:        z.array(z.number().nullable()),
    winddirection_10m:    z.array(z.number().nullable()),
    windgusts_10m:        z.array(z.number().nullable()),
    visibility:           z.array(z.number().nullable()),
    surface_pressure:     z.array(z.number().nullable()),
    soil_moisture_0_1cm:  z.array(z.number().nullable()),
  }).partial(),
  daily: z.object({
    time:                         z.array(z.string()),
    precipitation_sum:            z.array(z.number().nullable()),
    et0_fao_evapotranspiration:   z.array(z.number().nullable()),
  }).partial(),
}).partial();
