import React from 'react';
import { useQueries } from '@tanstack/react-query';
import { Buildings, WarningOctagon, CloudRain, Drop } from 'phosphor-react';
import { fetchStationWeather } from '../api/openMeteoApi';

const URBAN_CITIES = [
  { city: 'Mumbai',     state: 'Maharashtra', lat: 19.07, lon: 72.87, capacity_mmphr: 25 },
  { city: 'Chennai',    state: 'Tamil Nadu',   lat: 13.08, lon: 80.27, capacity_mmphr: 30 },
  { city: 'Pune',       state: 'Maharashtra', lat: 18.52, lon: 73.86, capacity_mmphr: 20 },
  { city: 'Hyderabad',  state: 'Telangana',   lat: 17.38, lon: 78.48, capacity_mmphr: 25 },
  { city: 'Bengaluru',  state: 'Karnataka',   lat: 12.97, lon: 77.59, capacity_mmphr: 20 },
  { city: 'Kolkata',    state: 'West Bengal', lat: 22.57, lon: 88.36, capacity_mmphr: 18 },
  { city: 'Delhi',      state: 'Delhi',       lat: 28.70, lon: 77.10, capacity_mmphr: 12 },
  { city: 'Ahmedabad',  state: 'Gujarat',     lat: 23.03, lon: 72.59, capacity_mmphr: 22 },
];

function getRiskFromExceedance(ratio: number) {
  if (ratio >= 2.5) return { level: 5, label: 'EMERGENCY', color: 'text-risk-5-text bg-risk-5 border-risk-5-border' };
  if (ratio >= 1.5) return { level: 4, label: 'SEVERE',    color: 'text-risk-4-text bg-risk-4 border-risk-4-border' };
  if (ratio >= 1.0) return { level: 3, label: 'DRAINAGE OVERWHELMED', color: 'text-risk-3-text bg-risk-3 border-risk-3-border' };
  if (ratio >= 0.7) return { level: 2, label: 'WATCH',     color: 'text-risk-2-text bg-risk-2 border-risk-2-border' };
  return               { level: 1, label: 'NORMAL',        color: 'text-risk-1-text bg-risk-1 border-risk-1-border' };
}

export const UrbanFloodRisk: React.FC = () => {
  // Fetch Open-Meteo for all 8 cities in parallel
  const weatherQueries = useQueries({
    queries: URBAN_CITIES.map(city => ({
      queryKey: ['urban-weather', city.city],
      queryFn: () => fetchStationWeather(city.lat, city.lon),
      staleTime: 30 * 60 * 1000,
    }))
  });

  const cityData = URBAN_CITIES.map((city, i) => {
    const wx = weatherQueries[i];
    const hourlyPrecip: (number | null)[] = wx.data?.hourly?.precipitation ?? [];
    // Get max 1-hour intensity in next 6 hours
    const now = new Date();
    const nowHour = now.getHours();
    const next6h = hourlyPrecip.slice(nowHour, nowHour + 6).filter(v => v !== null) as number[];
    const maxIntensity = next6h.length > 0 ? Math.max(...next6h) : 0;
    const ratio = city.capacity_mmphr > 0 ? maxIntensity / city.capacity_mmphr : 0;
    const risk = getRiskFromExceedance(ratio);

    return {
      ...city,
      maxIntensity,
      ratio,
      risk,
      loading: wx.isLoading,
      dailyRain: wx.data?.daily?.precipitation_sum?.[0] ?? null,
    };
  });

  const sortedCities = [...cityData].sort((a, b) => b.ratio - a.ratio);
  const criticalCount = cityData.filter(c => c.ratio >= 1.0).length;

  return (
    <div className="w-full h-full p-8 overflow-y-auto bg-bg-cream">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h2 className="font-display text-text-dark text-3xl font-bold flex items-center">
            <Buildings className="w-8 h-8 mr-3 text-suk-forest" weight="duotone" />
            Urban Pluvial Flood Risk
          </h2>
          <p className="font-ui text-text-muted mt-1">
            Real-time drainage exceedance · Open-Meteo ECMWF IFS04 · 8 Tier-1 cities
          </p>
        </div>
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border font-ui text-sm font-bold ${criticalCount > 0 ? 'bg-risk-4 text-risk-4-text border-risk-4-border' : 'bg-bg-white border-border-default text-suk-forest'}`}>
          <WarningOctagon className="w-4 h-4" weight={criticalCount > 0 ? 'fill' : 'regular'} />
          <span>{criticalCount > 0 ? `${criticalCount} cities at/above drainage capacity` : 'All cities within drainage capacity'}</span>
        </div>
      </div>

      <div className="bg-bg-white border border-border-default rounded-xl shadow-sm p-4 mb-6 text-sm font-ui text-text-muted">
        <strong className="text-text-dark">How this works:</strong> Urban flooding occurs when 1-hour rainfall intensity exceeds the city's storm drain design capacity. This page shows the exceedance ratio = current intensity ÷ capacity. When ratio ≥ 1.0, waterlogging is likely.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sortedCities.map(city => (
          <div key={city.city} className={`bg-bg-white border rounded-xl p-5 shadow-sm ${city.risk.level >= 3 ? 'border-suk-fire' : 'border-border-default'}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-display font-bold text-lg text-text-dark">{city.city}</h3>
                <p className="font-ui text-xs text-text-muted mt-0.5">{city.state}</p>
              </div>
              <span className={`text-xs font-bold font-data px-2 py-1 rounded border ${city.risk.color}`}>
                {city.risk.label}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4 text-center">
              <div className="bg-bg-surface rounded-lg py-2">
                <div className="font-data text-lg font-bold text-text-dark">
                  {city.loading ? '–' : city.maxIntensity.toFixed(1)}
                </div>
                <div className="font-ui text-[10px] text-text-muted mt-0.5">mm/hr (peak)</div>
              </div>
              <div className="bg-bg-surface rounded-lg py-2">
                <div className="font-data text-lg font-bold text-text-dark">{city.capacity_mmphr}</div>
                <div className="font-ui text-[10px] text-text-muted mt-0.5">mm/hr capacity</div>
              </div>
              <div className="bg-bg-surface rounded-lg py-2">
                <div className={`font-data text-lg font-bold ${city.ratio >= 1 ? 'text-suk-fire' : 'text-suk-forest'}`}>
                  {city.loading ? '–' : city.ratio.toFixed(2)}×
                </div>
                <div className="font-ui text-[10px] text-text-muted mt-0.5">exceedance</div>
              </div>
            </div>

            {/* Exceedance bar */}
            <div className="w-full h-2 bg-bg-surface-2 rounded-full overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-700 ${city.ratio >= 1 ? 'bg-suk-fire' : city.ratio >= 0.7 ? 'bg-suk-amber' : 'bg-suk-forest'}`}
                style={{ width: `${Math.min(100, city.ratio * 50)}%` }}
              />
            </div>
            <div className="flex justify-between font-ui text-[10px] text-text-muted mt-1">
              <span>0</span>
              <span className="text-suk-amber">capacity limit (1.0×)</span>
              <span>2×</span>
            </div>

            {city.dailyRain !== null && (
              <div className="mt-3 flex items-center gap-1 text-xs font-ui text-text-muted">
                <CloudRain className="w-3 h-3" />
                <span>24h forecast total: <strong className="text-text-dark">{city.dailyRain.toFixed(1)} mm</strong></span>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="font-ui text-xs text-text-muted text-right mt-6">
        Source: Open-Meteo ECMWF IFS04 · Drainage capacities: BMC, GCC, PMC, GHMC, BBMP, KMC, NDMC, AMC design standards
      </p>
    </div>
  );
};
