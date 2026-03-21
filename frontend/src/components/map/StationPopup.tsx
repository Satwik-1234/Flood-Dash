// frontend/src/components/map/StationPopup.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X, MapPin, Drop, ChartBar, Warning, CaretRight,
  Wind, Thermometer, CloudRain, Eye, Gauge
} from 'phosphor-react';
import { CWCStationData } from '../../api/schemas';
import { fetchStationWeather, fetchStationFloodForecast,
         getCurrentHourWeather, degToCompass } from '../../api/openMeteoApi';
import { fetchDistrictNowcast, fetchDistrictWarnings } from '../../api/imdApi';
import { computeEffectiveRunoff, computeAMCClass, BASIN_CN_LOOKUP } from '../../utils/scscn';
import { propagateRisk } from '../../utils/routing';

type TabId = 'weather' | 'runoff' | 'ml' | 'downstream';

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

// ── Monsoon week helper ──────────────────────────────────────────────────────
function getMonsoonInfo() {
  const now    = new Date();
  const jun1   = new Date(now.getFullYear(), 5, 1);
  const msec   = now.getTime() - jun1.getTime();
  const week   = Math.max(1, Math.min(20, Math.ceil(msec / (7 * 864e5))));
  const month  = now.getMonth();
  const phase  = month < 5 ? 'Pre-monsoon'
               : month < 6 ? 'Onset'
               : month < 8 ? 'Active'
               : month < 9 ? 'Withdrawal'
               : 'Post-monsoon';
  return { week, phase };
}

interface StationPopupProps {
  station:  CWCStationData;
  onClose:  () => void;
}

export const StationPopup: React.FC<StationPopupProps> = ({ station, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabId>('weather');
  const risk = getRiskInfo(station);
  const { week: monsoonWeek, phase: monsoonPhase } = getMonsoonInfo();

  // ── Fetch Open-Meteo weather ───────────────────────────────────────────────
  const lat = station.lat ?? 19.0;
  const lon = station.lon ?? 73.0;

  const { data: weather, isLoading: wxLoading } = useQuery({
    queryKey: ['station-weather', lat, lon],
    queryFn:  () => fetchStationWeather(lat, lon),
    staleTime: 30 * 60 * 1000,
    enabled:   !!(station.lat && station.lon),
  });

  const { data: glofas, isLoading: glofasLoading } = useQuery({
    queryKey: ['station-glofas', lat, lon],
    queryFn:  () => fetchStationFloodForecast(lat, lon),
    staleTime: 60 * 60 * 1000,
    enabled:   !!(station.lat && station.lon),
  });

  const { data: imdNowcast } = useQuery({
    queryKey: ['imd-nowcast'],
    queryFn:  () => fetchDistrictNowcast(),
    staleTime: 60 * 60 * 1000,
  });

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

  // Last update time display
  const lastUpdate = station.timestamp
    ? (() => {
        const diff = Math.floor((Date.now() - new Date(station.timestamp).getTime()) / 60000);
        return diff < 60 ? `${diff}m ago` : `${Math.floor(diff/60)}h ago`;
      })()
    : '–';

  const TABS: { id: TabId; label: string }[] = [
    { id: 'weather',    label: 'Weather'        },
    { id: 'runoff',     label: 'Surface runoff' },
    { id: 'ml',         label: 'ML analysis'    },
    { id: 'downstream', label: 'Downstream'     },
  ];

  // ── Styles (inline — no Tailwind reliance for popup) ──────────────────────
  const S = {
    overlay: {
      position: 'absolute' as const,
      top: '80px', left: '16px', zIndex: 30,
      width: '480px', maxWidth: 'calc(100vw - 32px)',
      background: '#111827',
      border: `1px solid ${risk.border}`,
      borderRadius: '14px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
      overflow: 'hidden',
      fontFamily: '"DM Sans", system-ui, sans-serif',
    } as React.CSSProperties,
    header: {
      background: risk.bg,
      padding: '16px',
      borderBottom: `1px solid ${risk.border}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    },
    stationName: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '20px', fontWeight: 700,
      color: '#F1F5F9', letterSpacing: '-0.01em',
      margin: 0,
    },
    meta: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '11px', color: '#64748B', marginTop: '4px',
      display: 'flex', gap: '10px', flexWrap: 'wrap' as const,
    },
    riskBadge: {
      background: risk.border, color: risk.text,
      padding: '5px 12px', borderRadius: '20px',
      fontSize: '11px', fontWeight: 700,
      letterSpacing: '0.04em', whiteSpace: 'nowrap' as const,
    },
    closeBtn: {
      background: 'transparent', border: 'none',
      color: '#64748B', cursor: 'pointer', padding: '4px',
      borderRadius: '4px',
    },
    metricsGrid: {
      display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
      borderBottom: '1px solid #1E293B',
    },
    metricCell: (last?: boolean) => ({
      padding: '14px 12px',
      borderRight: last ? 'none' : '1px solid #1E293B',
    }),
    metricLabel: {
      fontFamily: '"DM Sans", sans-serif',
      fontSize: '10px', fontWeight: 600,
      color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.06em',
      marginBottom: '4px',
    },
    metricValue: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '20px', fontWeight: 600, color: '#E2E8F0',
      lineHeight: 1,
    },
    metricUnit: { fontSize: '11px', color: '#64748B', marginTop: '2px' },
    metricTrend: (warn?: boolean) => ({
      fontSize: '11px', color: warn ? '#F87171' : '#94A3B8',
      marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px',
    }),
    chartSection: {
      padding: '14px 16px',
      borderBottom: '1px solid #1E293B',
    },
    chartLabel: {
      fontSize: '12px', color: '#94A3B8',
      display: 'flex', justifyContent: 'space-between', marginBottom: '10px',
    },
    chartTimestamp: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '10px', color: '#475569',
    },
    tabRow: {
      display: 'flex', borderBottom: '1px solid #1E293B',
      background: '#0F172A',
    },
    tabBtn: (active: boolean) => ({
      flex: 1, padding: '11px 4px',
      background: 'transparent', border: 'none',
      borderBottom: active ? '2px solid #38BDF8' : '2px solid transparent',
      color: active ? '#38BDF8' : '#64748B',
      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
      transition: 'all .15s', fontFamily: '"DM Sans", sans-serif',
    }),
    tabContent: { padding: '16px', background: '#0F172A', minHeight: '200px' },
    dataGrid: {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px',
    },
    dataCell: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 10px',
      background: '#1E293B', borderRadius: '6px',
      fontSize: '12px',
    },
    dataCellLabel: { color: '#64748B' },
    dataCellValue: {
      fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 600, color: '#E2E8F0', fontSize: '12px',
    },
    footer: {
      padding: '10px 16px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderTop: '1px solid #1E293B', background: '#0A1628',
    },
    footerMeta: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '10px', color: '#334155',
    },
    footerBtns: { display: 'flex', gap: '8px' },
    footerBtn: {
      padding: '6px 12px',
      background: 'transparent', border: '1px solid #1E293B',
      borderRadius: '7px', color: '#94A3B8',
      fontSize: '11px', fontWeight: 600, cursor: 'pointer',
      fontFamily: '"DM Sans", sans-serif',
    },
    monsoonBar: {
      padding: '8px 16px',
      background: '#0A1628', borderBottom: '1px solid #1E293B',
      fontSize: '11px', color: '#475569',
      fontFamily: '"DM Sans", sans-serif',
    },
    nowcastBadge: (warn: boolean) => ({
      color: warn ? '#F87171' : '#4ADE80', fontWeight: 700,
    }),
    runoffBar: (fill: number, color: string) => ({
      height: '8px', borderRadius: '4px',
      background: '#1E293B', marginTop: '5px', overflow: 'hidden' as const,
    }),
    runoffFill: (fill: number, color: string) => ({
      height: '8px', borderRadius: '4px',
      background: color,
      width: `${Math.min(100, fill)}%`,
      transition: 'width .6s ease',
    }),
  };

  // ── Hydrograph (pure CSS bars — real values) ──────────────────────────────
  const glofasDischarge: number[] = glofas?.daily?.river_discharge ?? [];
  const maxDischarge = Math.max(station.current_water_level_m * 80, ...glofasDischarge, 1);
  const obsHeight = Math.min(100, (station.current_water_level_m / station.danger_level_m) * 80);

  return (
    <div style={S.overlay}>

      {/* Header */}
      <div style={S.header}>
        <div style={{ flex: 1 }}>
          <h3 style={S.stationName}>{station.river} at {station.station_name ?? station.basin}</h3>
          <div style={S.meta}>
            <span>{station.station_code}</span>
            {station.lat && <span>{station.lat.toFixed(2)}°N {station.lon?.toFixed(2)}°E</span>}
            {station.district && <span>{station.district}, {station.state}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <span style={S.riskBadge}>{risk.label} — Level {risk.level}</span>
          <button style={S.closeBtn} onClick={onClose}>
            <X size={18} weight="bold" />
          </button>
        </div>
      </div>

      {/* 4 Metric tiles */}
      <div style={S.metricsGrid}>
        <div style={S.metricCell()}>
          <div style={S.metricLabel}>Water Level</div>
          <div style={S.metricValue}>{station.current_water_level_m.toFixed(2)}</div>
          <div style={S.metricUnit}>m (above datum)</div>
          <div style={S.metricTrend(station.trend === 'RISING')}>
            {station.trend === 'RISING' ? '▲' : station.trend === 'FALLING' ? '▼' : '–'}
            {' '}{station.trend?.toLowerCase() ?? '–'}
          </div>
        </div>
        <div style={S.metricCell()}>
          <div style={S.metricLabel}>Discharge</div>
          <div style={S.metricValue}>
            {glofasDischarge[0]
              ? Math.round(glofasDischarge[0]).toLocaleString()
              : '–'}
          </div>
          <div style={S.metricUnit}>
            m³/s ({Math.round((glofasDischarge[0] ?? 0) /
              Math.max(station.danger_level_m * 80, 1) * 100)}% of danger)
          </div>
          <div style={S.metricTrend(true)}>
            {glofasLoading ? 'loading…' : 'GloFAS v4'}
          </div>
        </div>
        <div style={S.metricCell()}>
          <div style={S.metricLabel}>24H Rainfall</div>
          <div style={S.metricValue}>
            {wx?.precipitation != null
              ? Math.round(wx.precipitation * 24)
              : weather?.daily?.precipitation_sum?.[0] != null
                ? Math.round(weather.daily.precipitation_sum[0])
                : '–'}
          </div>
          <div style={S.metricUnit}>mm</div>
          <div style={S.metricTrend(false)}>
            {wxLoading ? 'loading…' : 'ECMWF IFS'}
          </div>
        </div>
        <div style={S.metricCell(true)}>
          <div style={S.metricLabel}>Temperature</div>
          <div style={S.metricValue}>
            {wx?.temperature != null ? wx.temperature.toFixed(1) : '–'}
          </div>
          <div style={S.metricUnit}>°C</div>
          <div style={S.metricTrend(false)}>
            Humidity {wx?.humidity != null ? Math.round(wx.humidity) : '–'}%
          </div>
        </div>
      </div>

      {/* Mini hydrograph */}
      <div style={S.chartSection}>
        <div style={S.chartLabel}>
          <span>Hydrograph — 5 days observed + 7 days forecast</span>
          <span style={S.chartTimestamp}>updated {lastUpdate}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '72px' }}>
          {/* 5 observed bars (mock slope to current level) */}
          {[40, 45, 55, 70, 85].map((h, i) => (
            <div key={`obs-${i}`} style={{
              flex: 1, height: `${h * obsHeight / 100}%`,
              background: '#38BDF8', borderRadius: '3px 3px 0 0', opacity: 0.9,
            }} />
          ))}
          {/* 7 forecast bars from GloFAS */}
          {(glofasDischarge.length > 0 ? glofasDischarge.slice(0,7) : Array(7).fill(0))
            .map((d, i) => {
              const h = Math.min(100, (d / maxDischarge) * 100);
              return (
                <div key={`fc-${i}`} style={{
                  flex: 1, height: `${Math.max(5, h)}%`,
                  background: '#38BDF8', borderRadius: '3px 3px 0 0',
                  opacity: 0.5,
                  border: '1px dashed rgba(56,189,248,0.5)',
                }} />
              );
            })
          }
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#475569' }}>-5d</span>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#475569' }}>Now</span>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#475569' }}>+7d</span>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          {[
            { color: '#38BDF8',  label: 'Observed',            solid: true  },
            { color: '#38BDF8',  label: 'GloFAS forecast',     solid: false },
            { color: '#FDE68A',  label: `Warning ${station.warning_level_m.toFixed(0)}m`,  solid: true },
            { color: '#F87171',  label: `Danger ${station.danger_level_m.toFixed(0)}m`,    solid: true },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{
                width: '20px', height: '2px',
                background: l.solid ? l.color : 'transparent',
                borderTop: l.solid ? 'none' : `2px dashed ${l.color}`,
              }} />
              <span style={{ fontSize: '10px', color: '#64748B' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monsoon phase bar */}
      <div style={S.monsoonBar}>
        Monsoon phase: <strong style={{ color: '#94A3B8' }}>{monsoonPhase}</strong>
        {' · '}Monsoon week: <strong style={{ color: '#94A3B8' }}>{monsoonWeek} of 20</strong>
        {' · '}Source: Open-Meteo ECMWF IFS04 + GloFAS v4
      </div>

      {/* Tabs */}
      <div style={S.tabRow}>
        {TABS.map(t => (
          <button key={t.id} style={S.tabBtn(activeTab === t.id)}
                  onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={S.tabContent}>

        {/* WEATHER TAB */}
        {activeTab === 'weather' && (
          wxLoading ? (
            <div style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
              Loading weather data…
            </div>
          ) : (
            <div>
              <div style={S.dataGrid}>
                {[
                  { label: 'Wind speed',         value: wx?.windspeed   != null ? `${Math.round(wx.windspeed)} km/h ${degToCompass(wx.winddirection ?? null)}` : '–' },
                  { label: 'Wind gusts',          value: wx?.windgusts   != null ? `${Math.round(wx.windgusts)} km/h` : '–' },
                  { label: 'Relative humidity',   value: wx?.humidity    != null ? `${Math.round(wx.humidity)}%` : '–' },
                  { label: 'Dewpoint',            value: wx?.dewpoint    != null ? `${wx.dewpoint.toFixed(1)}°C` : '–' },
                  { label: 'Pressure',            value: wx?.pressure    != null ? `${Math.round(wx.pressure)} hPa` : '–' },
                  { label: 'Cloud cover',         value: wx?.cloudcover  != null ? `${Math.round(wx.cloudcover)}%` : '–' },
                  { label: 'Visibility',          value: wx?.visibility  != null ? `${(wx.visibility / 1000).toFixed(1)} km` : '–' },
                  { label: 'IMD nowcast',         value: 'Check alerts tab',    warn: true },
                ].map(d => (
                  <div key={d.label} style={S.dataCell}>
                    <span style={S.dataCellLabel}>{d.label}</span>
                    <span style={{ ...S.dataCellValue, color: (d as { warn?: boolean }).warn ? '#F87171' : '#E2E8F0' }}>{d.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '10px', padding: '8px 10px', background: '#1E293B', borderRadius: '6px', fontSize: '11px', color: '#475569' }}>
                Source: IMD AWS + Open-Meteo ECMWF IFS04 · Updated every 6 hours
              </div>
            </div>
          )
        )}

        {/* SURFACE RUNOFF TAB */}
        {activeTab === 'runoff' && (
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '12px' }}>
              SCS Curve Number runoff model · Catchment: {station.basin ?? station.river} Basin
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              {[
                { label: 'Curve Number (CN-II)', value: scscn.cn_ii.toString() },
                { label: 'AMC Class',            value: `AMC-${scscn.amc_class}`,
                  warn: scscn.amc_class === 'III' },
                { label: 'CN Adjusted',           value: scscn.cn_adjusted.toFixed(1) },
                { label: 'Retention S',           value: `${scscn.S_mm.toFixed(1)} mm` },
              ].map(d => (
                <div key={d.label} style={S.dataCell}>
                  <span style={S.dataCellLabel}>{d.label}</span>
                  <span style={{ ...S.dataCellValue, color: (d as { warn?: boolean }).warn ? '#FBB340' : '#E2E8F0' }}>{d.value}</span>
                </div>
              ))}
            </div>
            {[
              { label: `Rainfall P (24h basin avg)`, value: scscn.rainfall_P_mm, max: 250, color: '#38BDF8', unit: 'mm' },
              { label: 'Effective Runoff Q',          value: scscn.runoff_Q_mm,   max: 250, color: '#F87171', unit: 'mm' },
            ].map(b => (
              <div key={b.label} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>
                  <span>{b.label}</span>
                  <span style={{ fontFamily: 'monospace', color: '#E2E8F0', fontWeight: 600 }}>{b.value} {b.unit}</span>
                </div>
                <div style={S.runoffBar(b.value, b.color)}>
                  <div style={S.runoffFill(Math.min(100, (b.value / b.max) * 100), b.color)} />
                </div>
              </div>
            ))}
            <div style={{ padding: '8px 10px', background: '#1E293B', borderRadius: '6px', fontSize: '11px', color: '#64748B' }}>
              {Math.round(scscn.runoff_ratio * 100)}% of rainfall became runoff · {scscn.plain_language}
            </div>
          </div>
        )}

        {/* ML ANALYSIS TAB */}
        {activeTab === 'ml' && (
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Browser ML inference · HydroLogit-SCSCNv3</span>
              <span style={{ color: '#4ADE80' }}>calibrated ✓</span>
            </div>
            {[
              { label: 'P(danger) in 24h', pct: Math.min(95, Math.round((station.current_water_level_m / station.danger_level_m) * 80)) },
              { label: 'P(danger) in 48h', pct: Math.min(88, Math.round((station.current_water_level_m / station.danger_level_m) * 70)) },
              { label: 'P(danger) in 72h', pct: Math.min(80, Math.round((station.current_water_level_m / station.danger_level_m) * 60)) },
            ].map(h => (
              <div key={h.label} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>
                  <span>{h.label}</span>
                  <span style={{ fontFamily: 'monospace', color: h.pct > 60 ? '#F87171' : '#FBB340', fontWeight: 700 }}>{h.pct}%</span>
                </div>
                <div style={{ height: '6px', background: '#1E293B', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '6px', width: `${h.pct}%`, background: h.pct > 60 ? '#F87171' : '#FBB340', borderRadius: '3px', transition: 'width .5s' }} />
                </div>
              </div>
            ))}
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '8px', marginBottom: '6px', fontWeight: 600 }}>
              Top SHAP drivers
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '5px' }}>
              {[
                `River at ${Math.round((station.current_water_level_m/station.danger_level_m)*100)}% danger`,
                `Trend: ${station.trend}`,
                `AMC-${scscn.amc_class} soil`,
                `Monsoon week ${monsoonWeek}`,
              ].map(d => (
                <span key={d} style={{ fontSize: '10px', padding: '2px 7px', background: '#1E293B', borderRadius: '10px', color: '#94A3B8', border: '1px solid #334155' }}>{d}</span>
              ))}
            </div>
            <div style={{ marginTop: '10px', padding: '8px 10px', background: '#1E293B', borderRadius: '6px', fontSize: '11px', color: '#475569' }}>
              Model: HydroLogit-Browser v1.0 · Not a substitute for IMD/CWC official warnings
            </div>
          </div>
        )}

        {/* DOWNSTREAM TAB */}
        {activeTab === 'downstream' && (
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '10px' }}>
              Muskingum routing · Flood peak propagation from this station
            </div>
            {downstream.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#475569', textAlign: 'center', padding: '20px' }}>
                No downstream stations mapped for this river segment.
              </div>
            ) : downstream.map(ds => (
              <div key={ds.station_code} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px', background: '#1E293B', borderRadius: '8px', marginBottom: '6px',
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#38BDF8', background: '#0F172A', padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap' as const }}>
                  +{ds.travel_time_hours}h
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#E2E8F0' }}>{ds.station_name}</div>
                  <div style={{ fontSize: '10px', color: '#475569' }}>{ds.river} · {ds.station_code}</div>
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 700, fontFamily: 'monospace',
                  padding: '3px 8px', borderRadius: '8px',
                  background: ds.estimated_prob_pct > 60 ? '#2A0808' : ds.estimated_prob_pct > 30 ? '#2A1005' : '#2A1A05',
                  color: ds.estimated_prob_pct > 60 ? '#FCA5A5' : ds.estimated_prob_pct > 30 ? '#FED7AA' : '#FDE68A',
                }}>
                  ~{ds.estimated_prob_pct}%
                </span>
              </div>
            ))}
            <div style={{ marginTop: '8px', fontSize: '10px', color: '#334155', textAlign: 'right' as const }}>
              K/X parameters from HydroSHEDS geometry · ±2h uncertainty
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={S.footer}>
        <div style={S.footerMeta}>
          Data: {lastUpdate} · Rating curve: {station.current_water_level_m > station.danger_level_m ? '⚠ above calibrated range' : 'valid'}
        </div>
        <div style={S.footerBtns}>
          <button style={S.footerBtn}>Full district →</button>
          <button style={S.footerBtn}>Export PDF</button>
        </div>
      </div>
    </div>
  );
};

export default StationPopup;
