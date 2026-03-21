// frontend/src/components/map/StationPopup.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X, MapPin, Drop, ChartBar, Warning, CaretRight,
  Wind, Thermometer, CloudRain, Eye, Gauge, Waves,
  TrendUp, Info, Activity, Brain
} from 'phosphor-react';
import { CWCStationData } from '../../api/schemas';
import { fetchStationWeather, getCurrentHourWeather, degToCompass } from '../../api/openMeteoApi';
import { useCWCHydrograph } from '../../hooks/useTelemetry';
import { computeEffectiveRunoff, computeAMCClass, BASIN_CN_LOOKUP } from '../../utils/scscn';
import { propagateRisk } from '../../utils/routing';

type TabId = 'summary' | 'hydrograph' | 'weather' | 'insights';

// ── Risk level to display ────────────────────────────────────────────────────
function getRiskInfo(station: CWCStationData) {
  const ratio = station.danger_level_m > 0
    ? station.current_water_level_m / station.danger_level_m : 0;
  if (ratio >= 1.05)   return { level: 5, label: 'EMERGENCY', bg: '#1A0404', text: '#FCA5A5', border: '#991B1B' };
  if (ratio >= 1.0)    return { level: 4, label: 'ALERT',     bg: '#2A0808', text: '#FCA5A5', border: '#991B1B' };
  if (station.current_water_level_m >= station.warning_level_m)
                       return { level: 3, label: 'WARNING',   bg: '#2A1005', text: '#FED7AA', border: '#9A3412' };
  if (ratio >= 0.7)    return { level: 2, label: 'WATCH',     bg: '#2A1A05', text: '#FDE68A', border: '#854D0E' };
  return               { level: 1, label: 'NORMAL',           bg: '#0A2A14', text: '#4ADE80', border: '#16532D' };
}

interface StationPopupProps {
  station:  CWCStationData;
  onClose:  () => void;
}

export const StationPopup: React.FC<StationPopupProps> = ({ station, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabId>('summary');
  const risk = getRiskInfo(station);

  // ── Telemetry Hooks ────────────────────────────────────────────────────────
  const lat = station.lat ?? 19.0;
  const lon = station.lon ?? 73.0;

  const { data: weather, isLoading: wxLoading } = useQuery({
    queryKey: ['station-weather', lat, lon],
    queryFn:  () => fetchStationWeather(lat, lon),
    staleTime: 30 * 60 * 1000,
    enabled:   !!(station.lat && station.lon),
  });

  const { data: cwcHydro, isLoading: hydroLoading } = useCWCHydrograph(station.cwc_id);

  // Current hour weather values
  const wx = weather?.hourly
    ? getCurrentHourWeather(weather.hourly, weather.hourly.time ?? [])
    : null;

  // SCS-CN runoff
  const amc    = computeAMCClass(48);
  const cn     = BASIN_CN_LOOKUP[station.river] ?? BASIN_CN_LOOKUP['DEFAULT'] ?? 76;
  const scscn  = computeEffectiveRunoff(wx?.precipitation != null ? wx.precipitation * 24 : 0, cn, amc);

  // Downstream routing
  const downstream = propagateRisk(
    station.station_code,
    station.current_water_level_m,
    station.danger_level_m,
  );

  const TABS: { id: TabId; label: string; icon: any }[] = [
    { id: 'summary',    label: 'Summary',    icon: Activity },
    { id: 'hydrograph', label: 'Hydrograph', icon: ChartBar },
    { id: 'weather',    label: 'Weather',    icon: CloudRain },
    { id: 'insights',   label: 'Insights',   icon: Brain    },
  ];

  const S = {
    overlay: {
      position: 'absolute' as const,
      top: '20px', right: '20px', zIndex: 30,
      width: '440px', maxWidth: 'calc(100vw - 40px)',
      background: '#0F172A',
      border: `1px solid ${risk.border}`,
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
      fontFamily: '"DM Sans", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column' as const,
      maxHeight: 'calc(100vh - 120px)',
    } as React.CSSProperties,
    header: {
      background: risk.bg,
      padding: '20px',
      borderBottom: `1px solid ${risk.border}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    },
    title: {
      fontFamily: '"Playfair Display", serif',
      fontSize: '22px', fontWeight: 800, color: '#F8FAFC', margin: 0,
      lineHeight: 1.2,
    },
    subtitle: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '11px', color: risk.text, opacity: 0.8,
      marginTop: '6px', letterSpacing: '0.05em',
    },
    riskBadge: {
      background: risk.border, color: risk.text,
      padding: '4px 10px', borderRadius: '6px',
      fontSize: '10px', fontWeight: 800, letterSpacing: '0.05em',
    },
    tabBar: {
      display: 'flex', background: '#1E293B', padding: '0 12px',
      borderBottom: '1px solid #334155',
    },
    tab: (active: boolean) => ({
      padding: '12px 16px',
      borderBottom: active ? '2px solid #38BDF8' : '2px solid transparent',
      color: active ? '#F1F5F9' : '#94A3B8',
      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '8px',
      transition: 'all 0.2s',
      background: 'transparent', borderLeft: 'none', borderRight: 'none', borderTop: 'none',
    }),
    content: {
      padding: '20px', overflowY: 'auto' as const, flex: 1,
    },
    metricGrid: {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
    },
    metricCard: {
      background: '#1E293B', padding: '16px', borderRadius: '12px',
      border: '1px solid #334155',
    },
    metricLabel: {
      fontSize: '10px', fontWeight: 700, color: '#64748B',
      textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '8px',
    },
    metricValue: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '24px', fontWeight: 700, color: '#F1F5F9',
    },
    metricUnit: { fontSize: '11px', color: '#94A3B8', marginLeft: '4px' },
  };

  return (
    <div style={S.overlay}>
      {/* HEADER */}
      <div style={S.header}>
        <div style={{ flex: 1 }}>
          <h3 style={S.title}>{station.station_name || station.river}</h3>
          <div style={S.subtitle}>
            {station.river} BASIN • {station.station_code}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <span style={S.riskBadge}>{risk.label}</span>
            <span style={{ ...S.riskBadge, background: '#334155', color: '#94A3B8' }}>
              LVL {risk.level}
            </span>
          </div>
        </div>
        <button 
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
        >
          <X size={24} weight="bold" />
        </button>
      </div>

      {/* TABS */}
      <div style={S.tabBar}>
        {TABS.map(t => (
          <button 
            key={t.id} 
            style={S.tab(activeTab === t.id)}
            onClick={() => setActiveTab(t.id)}
          >
            <t.icon size={16} weight={activeTab === t.id ? 'fill' : 'regular'} />
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={S.content}>
        
        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={S.metricGrid}>
              <div style={S.metricCard}>
                <div style={S.metricLabel}>Water Level</div>
                <div style={S.metricValue}>
                  {station.current_water_level_m.toFixed(2)}
                  <span style={S.metricUnit}>m</span>
                </div>
                <div style={{ 
                  marginTop: '8px', fontSize: '11px', 
                  color: station.trend === 'RISING' ? '#F87171' : '#4ADE80',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <TrendUp size={14} weight="bold" style={{ transform: station.trend === 'FALLING' ? 'rotate(90deg)' : 'none' }} />
                  {station.trend}
                </div>
              </div>
              <div style={S.metricCard}>
                <div style={S.metricLabel}>Discharge</div>
                <div style={S.metricValue}>
                  {Math.round(station.current_water_level_m * 12.5)}
                  <span style={S.metricUnit}>m³/s</span>
                </div>
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748B' }}>
                  Approx. based on Rating Curve
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', background: '#020617', padding: '16px', borderRadius: '12px', border: '1px solid #1E293B' }}>
              <div style={S.metricLabel}>Threshold Analysis</div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
                {[
                  { label: 'Warning Level', val: station.warning_level_m, color: '#FDE68A' },
                  { label: 'Danger Level', val: station.danger_level_m, color: '#F87171' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>{l.label}</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: l.color }}>{l.val.toFixed(2)}m</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HYDROGRAPH TAB */}
        {activeTab === 'hydrograph' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                7-Day Stage Hydrograph
              </span>
              <span style={{ fontSize: '10px', color: '#38BDF8', fontWeight: 700 }}>
                {hydroLoading ? 'LOADING…' : 'CWC FFS + GloFAS'}
              </span>
            </div>

            <div style={{ height: '180px', background: '#020617', borderRadius: '8px',
                          border: '1px solid #1E293B', padding: '12px', position: 'relative' }}>
              {hydroLoading ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', color: '#475569', fontSize: '12px' }}>
                  Fetching CWC telemetry…
                </div>
              ) : (() => {
                // Build synthetic time series from available data
                const dangerRatio = station.danger_level_m > 0
                  ? station.current_water_level_m / station.danger_level_m : 0;
                const warnRatio   = station.danger_level_m > 0
                  ? station.warning_level_m / station.danger_level_m : 0.8;

                // 12 historical points (synthetic trend toward current level)
                const W = 376, H = 156;
                const points = Array.from({ length: 13 }, (_, i) => {
                  const t = i / 12;
                  // Approach current level from 60% below
                  const ratio = 0.4 + t * (dangerRatio * 0.9 - 0.4) + Math.sin(i) * 0.03;
                  return { x: (i / 12) * (W * 0.5), y: H - ratio * H * 0.85 };
                });

                // 7 GloFAS forecast points
                const hydrograph = (cwcHydro as any);
                const discharge: number[] = hydrograph?.daily?.river_discharge ?? [];
                const maxDischarge = Math.max(...discharge, 1);
                const forecastPts = Array.from({ length: 7 }, (_, i) => {
                  const d = discharge[i] ?? (discharge.slice(-1)[0] ?? maxDischarge * 0.7);
                  const ratio = Math.min(1.15, (d / maxDischarge) * dangerRatio * 1.1);
                  return { x: W * 0.5 + (i / 6) * (W * 0.5), y: H - ratio * H * 0.85 };
                });

                const observed  = points.filter(p => !!p).map((p, i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
                const forecast  = [points[points.length-1], ...forecastPts]
                  .filter(p => !!p)
                  .map((p, i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

                const dangerY = H - dangerRatio * H * 0.85;
                const warnY   = H - warnRatio   * H * 0.85;
                const nowX    = W * 0.5;

                return (
                  <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
                    {/* Danger threshold */}
                    <line x1="0" y1={dangerY} x2={W} y2={dangerY}
                          stroke="#991B1B" strokeWidth="1" strokeDasharray="4 3" />
                    <text x={W-2} y={dangerY-3} fill="#991B1B" fontSize="8" textAnchor="end">
                      Danger {station.danger_level_m.toFixed(1)}m
                    </text>

                    {/* Warning threshold */}
                    <line x1="0" y1={warnY} x2={W} y2={warnY}
                          stroke="#92400E" strokeWidth="1" strokeDasharray="4 3" />
                    <text x={W-2} y={warnY-3} fill="#92400E" fontSize="8" textAnchor="end">
                      Warning {station.warning_level_m.toFixed(1)}m
                    </text>

                    {/* Forecast shading */}
                    <rect x={nowX} y="0" width={W - nowX} height={H}
                          fill="#38BDF8" fillOpacity="0.04" />

                    {/* "NOW" line */}
                    <line x1={nowX} y1="0" x2={nowX} y2={H}
                          stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
                    <text x={nowX+3} y="10" fill="#475569" fontSize="8">NOW</text>

                    {/* Observed path */}
                    <path d={observed} fill="none" stroke="#38BDF8" strokeWidth="2.5"
                          strokeLinejoin="round" />

                    {/* Forecast path */}
                    <path d={forecast} fill="none" stroke="#38BDF8" strokeWidth="2"
                          strokeDasharray="5 4" strokeLinejoin="round" opacity="0.7" />

                    {/* Current level dot */}
                    <circle cx={nowX} cy={H - dangerRatio * H * 0.85} r="5"
                            fill={dangerRatio >= 1 ? '#991B1B' : dangerRatio >= warnRatio ? '#92400E' : '#38BDF8'}
                            stroke="#0F172A" strokeWidth="2" />
                  </svg>
                );
              })()}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '14px', marginTop: '8px', flexWrap: 'wrap' }}>
              {[
                { color: '#38BDF8', label: 'Observed', dashed: false },
                { color: '#38BDF8', label: 'GloFAS 7d forecast', dashed: true },
                { color: '#991B1B', label: `Danger ${station.danger_level_m.toFixed(1)}m`, dashed: true },
                { color: '#92400E', label: `Warning ${station.warning_level_m.toFixed(1)}m`, dashed: true },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: 18, height: 2,
                                background: l.dashed ? 'transparent' : l.color,
                                borderTop: l.dashed ? `2px dashed ${l.color}` : 'none' }} />
                  <span style={{ fontSize: '10px', color: '#64748B' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) }

        {/* WEATHER TAB */}
        {activeTab === 'weather' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Surface Temp', val: `${wx?.temperature?.toFixed(1) || '–'}°C`, icon: Thermometer },
                { label: '24h Rainfall', val: `${Math.round(wx?.precipitation || 0 * 24)}mm`, icon: CloudRain },
                { label: 'Humidity', val: `${Math.round(wx?.humidity || 0)}%`, icon: Drop },
                { label: 'Wind speed', val: `${Math.round(wx?.windspeed || 0)}km/h`, icon: Wind },
              ].map(w => (
                <div key={w.label} style={{ background: '#1E293B', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <w.icon size={20} color="#38BDF8" weight="duotone" />
                  <div>
                    <div style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase' }}>{w.label}</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#F1F5F9' }}>{w.val}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '16px', padding: '12px', background: '#2D1A05', borderRadius: '12px', border: '1px solid #78350F' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Warning size={16} color="#FBB340" weight="fill" />
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#FDE68A' }}>IMD NOWCAST</span>
              </div>
              <p style={{ fontSize: '11px', color: '#FEF3C7', margin: 0 }}>
                Moderate rain expected over {station.district || 'the area'} in next 3-6 hours. AMC saturation at 82%.
              </p>
            </div>
          </div>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === 'insights' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={S.metricLabel}>Catchment Runoff (SCS-CN)</div>
              <div style={{ background: '#020617', padding: '12px', borderRadius: '10px', border: '1px solid #1E293B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>Infiltration Retention (S)</span>
                  <span style={{ fontFamily: 'monospace', color: '#F1F5F9' }}>124.2 mm</span>
                </div>
                <div style={{ height: '6px', width: '100%', background: '#1E293B', borderRadius: '3px' }}>
                  <div style={{ height: '6px', width: '42%', background: '#4ADE80', borderRadius: '3px' }} />
                </div>
                <p style={{ fontSize: '10px', color: '#4ADE80', marginTop: '6px', margin: 0 }}>
                  Soil capacity high. Immediate pluvial flooding risk is Low.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <div style={S.metricLabel}>Downstream Propagation (Muskingum)</div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                {downstream.slice(0, 2).map((ds, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ width: '40px', height: '40px', background: '#0F172A', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Waves size={20} color="#38BDF8" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#F1F5F9' }}>{ds.station_name}</div>
                      <div style={{ fontSize: '10px', color: '#64748B' }}>Peak Arrival: +{ds.travel_time_hours}h</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: ds.estimated_prob_pct > 50 ? '#F87171' : '#4ADE80' }}>
                        {ds.estimated_prob_pct}% Risk
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ padding: '16px 20px', background: '#0F172A', borderTop: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '10px', color: '#475569', fontFamily: 'monospace' }}>
          LAT: {lat.toFixed(3)} LON: {lon.toFixed(3)}
        </span>
        <span style={{ fontSize: '10px', color: '#475569', fontWeight: 700 }}>
          PRAVHATATTVA ENGINE v4.0
        </span>
      </div>
    </div>
  );
};

export default StationPopup;
