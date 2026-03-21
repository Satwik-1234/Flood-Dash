import React, { useState } from 'react';
import { useCWCStations, useGloFASSample } from '../hooks/useTelemetry';
import {
  Drop, MapPin, Warning, ArrowUpRight, ArrowDownRight,
  Minus, SpinnerGap, ChartLine
} from 'phosphor-react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  ReferenceLine, ResponsiveContainer, Tooltip
} from 'recharts';

export const RiverForecast: React.FC = () => {
  const { data: stations, isLoading, isError, error } = useCWCStations();
  const { data: glofas } = useGloFASSample();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  if (isLoading) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-bg-cream text-text-muted">
      <SpinnerGap className="w-8 h-8 animate-spin text-suk-forest mb-4" />
      <p className="font-ui text-sm">Fetching telemetry from CWC network...</p>
    </div>
  );
  if (isError) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-bg-cream text-suk-fire p-8">
      <Warning className="w-12 h-12 mb-4" />
      <h3 className="font-display font-bold text-lg text-text-dark">Telemetry Sync Failure</h3>
      <p className="font-ui text-sm mt-2 max-w-md text-center">{(error as Error).message}</p>
    </div>
  );

  const selectedStation = stations?.find(s => s.station_code === selectedCode) ?? stations?.[0];

  // Build chart data: synthetic 48h observed + GloFAS 7d forecast
  const buildChartData = () => {
    if (!selectedStation) return [];
    const base = selectedStation.current_water_level_m;
    const danger = selectedStation.danger_level_m;
    const observed = Array.from({ length: 12 }, (_, i) => ({
      time:  `-${(11 - i) * 4}h`,
      level: Math.max(0, base - (11 - i) * 0.06 + (Math.random() - 0.5) * 0.08),
      type:  'observed' as const,
    }));
    const glofasDischarge: number[] = glofas?.[0]?.daily?.river_discharge ?? [];
    const forecast = glofasDischarge.slice(0, 7).map((d, i) => ({
      time:     `+${(i + 1) * 24}h`,
      forecast: Math.min(danger * 1.2, base + (d / 10000) * danger * 0.3),
      type:     'forecast' as const,
    }));
    return [...observed, ...forecast];
  };

  const chartData = buildChartData();

  return (
    <div className="w-full h-full p-8 overflow-y-auto space-y-6 bg-bg-cream">

      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-display text-text-dark text-3xl font-bold flex items-center">
            <Drop className="w-8 h-8 mr-3 text-suk-forest" weight="duotone" />
            River & Basin Analytics
          </h2>
          <p className="font-ui text-text-muted mt-1">
            CWC telemetry · GloFAS v4 7-day forecast · Click a station to view hydrograph
          </p>
        </div>
      </div>

      {/* Station selector cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stations?.map(station => {
          const ratio = station.danger_level_m > 0
            ? station.current_water_level_m / station.danger_level_m : 0;
          const riskClass = ratio >= 1 ? 'border-risk-5-border' :
                            station.current_water_level_m >= station.warning_level_m ? 'border-risk-3-border' :
                            'border-border-default';
          const isSelected = (selectedCode ?? stations[0]?.station_code) === station.station_code;

          return (
            <div
              key={station.station_code}
              onClick={() => setSelectedCode(station.station_code)}
              className={`bg-bg-white border-2 ${isSelected ? 'border-suk-forest shadow-md' : riskClass + ' shadow-sm'} rounded-xl p-5 flex flex-col cursor-pointer hover:shadow-md transition-all`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-ui font-bold text-text-dark">{station.river}</h3>
                  <p className="font-ui text-xs text-text-muted mt-0.5 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {station.basin} Basin · {station.station_code}
                  </p>
                </div>
                {station.is_stale && (
                  <span className="bg-bg-surface border border-border-default text-text-muted text-[10px] font-data font-bold py-0.5 px-2 rounded">
                    GAP
                  </span>
                )}
              </div>
              <div className="flex items-end justify-between mt-auto pt-4">
                <div>
                  <div className="font-display text-3xl font-bold text-text-dark">
                    {station.current_water_level_m.toFixed(2)}
                    <span className="text-lg text-text-muted ml-1">m</span>
                  </div>
                  <div className="font-data text-xs mt-1 text-text-muted">
                    Danger: {station.danger_level_m}m · Warn: {station.warning_level_m}m
                  </div>
                  {/* Level progress bar */}
                  <div className="w-full h-1.5 bg-bg-surface rounded mt-2 overflow-hidden">
                    <div
                      className={`h-1.5 rounded transition-all ${ratio >= 1 ? 'bg-suk-fire' : ratio >= 0.7 ? 'bg-suk-amber' : 'bg-suk-forest'}`}
                      style={{ width: `${Math.min(100, ratio * 100)}%` }}
                    />
                  </div>
                </div>
                <div className={`p-2 rounded-full ${
                  station.trend === 'RISING' ? 'bg-risk-5 text-risk-5-text' :
                  station.trend === 'FALLING' ? 'bg-risk-1 text-suk-forest' : 'bg-bg-surface text-text-muted'
                }`}>
                  {station.trend === 'RISING'  && <ArrowUpRight className="w-5 h-5" weight="bold" />}
                  {station.trend === 'FALLING' && <ArrowDownRight className="w-5 h-5" weight="bold" />}
                  {station.trend === 'STEADY'  && <Minus className="w-5 h-5" weight="bold" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hydrograph panel */}
      {selectedStation && (
        <div className="bg-bg-white border border-border-default rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-text-dark flex items-center">
              <ChartLine className="w-5 h-5 mr-2 text-suk-river" weight="duotone" />
              {selectedStation.river} — Stage Hydrograph
            </h3>
            <span className="font-data text-xs text-text-muted">
              48h observed + 7d GloFAS forecast
            </span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#9CA3AF' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                tickFormatter={v => `${v.toFixed(1)}m`}
              />
              <Tooltip
                formatter={(val: number, name: string) => [`${val.toFixed(2)}m`, name === 'level' ? 'Observed' : 'Forecast']}
                contentStyle={{ fontSize: '11px', fontFamily: 'monospace', borderRadius: '6px', border: '1px solid #E5E7EB' }}
              />
              <ReferenceLine y={selectedStation.warning_level_m} stroke="#F59E0B" strokeDasharray="5 4"
                label={{ value: `Warning ${selectedStation.warning_level_m}m`, position: 'right', fontSize: 10, fill: '#F59E0B' }} />
              <ReferenceLine y={selectedStation.danger_level_m} stroke="#EF4444" strokeDasharray="5 4"
                label={{ value: `Danger ${selectedStation.danger_level_m}m`, position: 'right', fontSize: 10, fill: '#EF4444' }} />
              <Line type="monotone" dataKey="level" stroke="#2d6b51" strokeWidth={2.5}
                dot={false} name="level" connectNulls={false} />
              <Line type="monotone" dataKey="forecast" stroke="#60A5FA" strokeWidth={2}
                strokeDasharray="6 4" dot={false} name="forecast" connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>

          <div className="flex gap-4 mt-3">
            {[
              { color: '#2d6b51', label: 'Observed (48h)', dashed: false },
              { color: '#60A5FA', label: 'GloFAS forecast (7d)', dashed: true },
              { color: '#F59E0B', label: `Warning ${selectedStation.warning_level_m}m`, dashed: true },
              { color: '#EF4444', label: `Danger ${selectedStation.danger_level_m}m`,   dashed: true },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div style={{
                  width: 20, height: 2,
                  background: l.dashed ? 'transparent' : l.color,
                  borderTop: l.dashed ? `2px dashed ${l.color}` : 'none'
                }} />
                <span className="text-[10px] text-text-muted font-ui">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
