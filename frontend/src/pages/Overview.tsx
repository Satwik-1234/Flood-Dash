import React from 'react';
import { 
  WarningCircle, MapPin, CloudRain, Buildings,
  ArrowUpRight, ArrowDownRight, Clock, WarningOctagon
} from 'phosphor-react';
import { Link } from 'react-router-dom';

import { useCWCAboveWarning, useCWCAboveDanger, useCWCInflowStations, useIMDWarnings } from '../hooks/useTelemetry';

// ── CWC flood situation → Pravhatattva risk level ──────────────────────────
function cwcToRisk(situation?: string): number {
  switch ((situation ?? '').toUpperCase()) {
    case 'EXTREME':      return 5;
    case 'SEVERE':       return 4;
    case 'ABOVE_NORMAL': return 3;
    case 'NORMAL':       return 1;
    default:             return 2;
  }
}

// ── Format time ago ────────────────────────────────────────────────────────
function timeAgo(isoStr?: string): string {
  if (!isoStr) return '–';
  const mins = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
  if (mins < 60)  return `${mins} min ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export const Overview: React.FC = () => {
  const { data: cwcWarning = [], isLoading: warnLoading } = useCWCAboveWarning();
  const { data: cwcDanger  = [] }                         = useCWCAboveDanger();
  const { data: cwcInflow  = [] }                         = useCWCInflowStations();
  const { data: imdWarnings = [] }                        = useIMDWarnings();

  // ── Real computed KPI values ─────────────────────────────────────────────
  const totalAlerts         = cwcDanger.length + cwcWarning.length;
  const activeStations      = cwcInflow.length + cwcWarning.length + cwcDanger.length;
  const criticalReservoirs  = cwcInflow.filter(s => (s.fill_pct ?? 0) > 85).length;
  const stationsAtDanger    = cwcDanger.length;

  // ── Build live alert feed from real CWC FFS data ─────────────────────────
  const liveFeed = [
    ...cwcDanger.map((s: any) => ({
      id: s.station_code ?? s.station_name,
      basin: s.river ?? '–',
      district: s.district ?? s.state ?? '–',
      level: 4,
      message: `Water level at ${(Number(s.current_water_level_m) || 0).toFixed(2)}m — above danger threshold of ${(Number(s.danger_level_m) || 0).toFixed(2)}m.`,
      time: timeAgo(s.timestamp as string | undefined),
    })),
    ...cwcWarning.slice(0, 5).map((s: any) => ({
      id: s.station_code ?? s.station_name,
      basin: s.river ?? '–',
      district: s.district ?? s.state ?? '–',
      level: 3,
      message: `Warning Level: ${(Number(s.current_water_level_m) || 0).toFixed(2)}m.`,
      time: timeAgo(s.timestamp as string | undefined),
    })),
  ].slice(0, 5);

  // Fallback to IMD warnings when CWC FFS returns empty
  const alertFeed = liveFeed.length > 0
    ? liveFeed
    : imdWarnings.slice(0, 3).map(w => ({
        id: w.id,
        basin: w.district,
        district: w.district,
        level: w.severity === 'EXTREME' ? 5
             : w.severity === 'SEVERE'  ? 4
             : w.severity === 'MODERATE'? 3 : 2,
        message: `${w.severity} — ${w.rainfall_24h_mm}mm in 24h.`,
        time: w.issued_at,
      }));

  return (
    <div className="w-full h-full p-8 overflow-y-auto space-y-8 bg-bg-cream">

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          {/* h1 is visually hidden — used by screen readers and E2E tests */}
          <h1 className="sr-only">Pravhatattva</h1>
          <h2 className="font-display text-text-dark text-3xl font-bold">
            प्रवहतत्त्व — National Overview
          </h2>
          <p className="font-ui text-text-muted mt-1">
            Real-time flood intelligence · Powered by CWC FFS + IMD + GloFAS
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm font-ui bg-bg-white border border-border-default px-4 py-2 rounded-lg shadow-sm">
          <Clock className="w-4 h-4 text-suk-forest" />
          <span className="text-text-body font-medium">
            {warnLoading ? 'Syncing…' : `${totalAlerts} active alerts`}
          </span>
        </div>
      </div>

      {/* KPI Grid — all values from live APIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Card 1 — Critical Alerts (CWC FFS danger + warning) */}
        <Link to="/alerts" className="block group">
          <div className="bg-bg-white border border-border-default rounded-xl p-6 shadow-sm hover:shadow-md hover:border-border-strong transition-all h-full flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 rounded-lg bg-risk-5">
                <WarningCircle className="w-6 h-6 text-suk-fire" weight="duotone" />
              </div>
              <div className="flex items-center text-xs font-bold font-data px-2 py-1 rounded bg-bg-surface text-suk-fire">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                {stationsAtDanger} at danger
              </div>
            </div>
            <div className="mt-auto relative z-10">
              <div className="flex items-baseline space-x-1">
                <span className="font-display text-4xl font-bold text-text-dark">
                  {String(totalAlerts).padStart(2, '0')}
                </span>
              </div>
              <h3 className="font-ui font-bold text-text-body mt-2">Critical Alerts</h3>
              <p className="font-ui text-sm text-text-muted mt-0.5">
                {cwcDanger.length} above danger · {cwcWarning.length} above warning
              </p>
            </div>
            <WarningCircle className="absolute -bottom-4 -right-4 w-32 h-32 text-bg-surface-2 opacity-50 z-0 pointer-events-none" weight="fill" />
          </div>
        </Link>

        {/* Card 2 — Monitored Stations (CWC FFS live) */}
        <Link to="/rivers" className="block group">
          <div className="bg-bg-white border border-border-default rounded-xl p-6 shadow-sm hover:shadow-md hover:border-border-strong transition-all h-full flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 rounded-lg bg-risk-1">
                <MapPin className="w-6 h-6 text-suk-forest" weight="duotone" />
              </div>
              <div className="flex items-center text-xs font-bold font-data px-2 py-1 rounded bg-bg-surface text-suk-forest">
                {activeStations > 0 ? 'CWC FFS Live' : 'Loading…'}
              </div>
            </div>
            <div className="mt-auto relative z-10">
              <div className="flex items-baseline space-x-1">
                <span className="font-display text-4xl font-bold text-text-dark">
                  {activeStations || '–'}
                </span>
              </div>
              <h3 className="font-ui font-bold text-text-body mt-2">Stations in Flood</h3>
              <p className="font-ui text-sm text-text-muted mt-0.5">Reporting above-normal levels</p>
            </div>
            <MapPin className="absolute -bottom-4 -right-4 w-32 h-32 text-bg-surface-2 opacity-50 z-0 pointer-events-none" weight="fill" />
          </div>
        </Link>

        {/* Card 3 — Reservoir Risk */}
        <Link to="/rivers" className="block group">
          <div className="bg-bg-white border border-border-default rounded-xl p-6 shadow-sm hover:shadow-md hover:border-border-strong transition-all h-full flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 rounded-lg bg-bg-surface-2">
                <CloudRain className="w-6 h-6 text-suk-river" weight="duotone" />
              </div>
              <div className="flex items-center text-xs font-bold font-data px-2 py-1 rounded bg-bg-surface text-suk-amber">
                {cwcInflow.length} stations
              </div>
            </div>
            <div className="mt-auto relative z-10">
              <div className="flex items-baseline space-x-1">
                <span className="font-display text-4xl font-bold text-text-dark">
                  {criticalReservoirs || '–'}
                </span>
              </div>
              <h3 className="font-ui font-bold text-text-body mt-2">Critical Reservoirs</h3>
              <p className="font-ui text-sm text-text-muted mt-0.5">Inflow stations above 85% fill</p>
            </div>
            <CloudRain className="absolute -bottom-4 -right-4 w-32 h-32 text-bg-surface-2 opacity-50 z-0 pointer-events-none" weight="fill" />
          </div>
        </Link>

        {/* Card 4 — Districts Affected */}
        <Link to="/alerts" className="block group">
          <div className="bg-bg-white border border-border-default rounded-xl p-6 shadow-sm hover:shadow-md hover:border-border-strong transition-all h-full flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 rounded-lg bg-risk-3">
                <Buildings className="w-6 h-6 text-suk-amber" weight="duotone" />
              </div>
              <div className="flex items-center text-xs font-bold font-data px-2 py-1 rounded bg-bg-surface text-suk-amber">
                {imdWarnings.length} warnings
              </div>
            </div>
            <div className="mt-auto relative z-10">
              <div className="flex items-baseline space-x-1">
                <span className="font-display text-4xl font-bold text-text-dark">
                  {imdWarnings.length || '–'}
                </span>
              </div>
              <h3 className="font-ui font-bold text-text-body mt-2">IMD Active Warnings</h3>
              <p className="font-ui text-sm text-text-muted mt-0.5">Districts with active advisories</p>
            </div>
            <Buildings className="absolute -bottom-4 -right-4 w-32 h-32 text-bg-surface-2 opacity-50 z-0 pointer-events-none" weight="fill" />
          </div>
        </Link>
      </div>

      {/* Two Column Layout: Alerts & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Live Alert Feed — from CWC FFS + IMD */}
        <div className="lg:col-span-2 bg-bg-white border border-border-default rounded-xl shadow-sm flex flex-col">
          <div className="p-6 border-b border-border-light flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <WarningOctagon className="w-5 h-5 text-suk-fire" weight="fill" />
              <h3 className="font-display font-bold text-lg text-text-dark">
                Live Flood Alerts
              </h3>
              {warnLoading && (
                <span className="text-xs font-ui text-text-muted animate-pulse">syncing…</span>
              )}
            </div>
            <Link to="/alerts" className="text-sm font-ui font-bold text-suk-forest hover:text-suk-forest-mid">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-border-light flex-1">
            {alertFeed.length === 0 ? (
              <div className="p-6 text-center text-text-muted font-ui text-sm">
                <span className="text-suk-forest font-bold">No active flood alerts.</span>
                <br />All monitored rivers are within normal levels.
              </div>
            ) : alertFeed.map(alert => (
              <div key={alert.id} className="p-6 hover:bg-bg-cream transition-colors flex items-start space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-lg bg-risk-${alert.level} text-risk-${alert.level}-text border border-risk-${alert.level}-border`}>
                  L{alert.level}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-ui font-bold text-text-dark">{alert.basin}</h4>
                      <p className="font-ui text-xs font-bold text-text-muted uppercase tracking-wider mt-0.5">
                        {alert.district} · {String(alert.id).slice(0, 12)}
                      </p>
                    </div>
                    <span className="font-data text-xs text-text-muted whitespace-nowrap">{alert.time}</span>
                  </div>
                  <p className="font-ui text-sm text-text-body mt-2 leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health / API Connections */}
        <div className="bg-bg-white border border-border-default rounded-xl shadow-sm p-6 flex flex-col">
          <h3 className="font-display font-bold text-lg text-text-dark mb-6">API Telemetry Status</h3>
          
          <div className="space-y-5 flex-1">
            {/* IMD */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-suk-forest animate-pulse"></div>
                <div>
                  <h4 className="font-ui font-bold text-sm text-text-dark">IMD AWS Network</h4>
                  <p className="font-ui text-xs text-text-muted">Updated 2 mins ago</p>
                </div>
              </div>
              <span className="font-data text-xs font-bold text-suk-forest bg-risk-1 px-2 py-1 rounded">100%</span>
            </div>

            {/* CWC */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-suk-forest animate-pulse"></div>
                <div>
                  <h4 className="font-ui font-bold text-sm text-text-dark">CWC River Gauges</h4>
                  <p className="font-ui text-xs text-text-muted">Updated 15 mins ago</p>
                </div>
              </div>
              <span className="font-data text-xs font-bold text-suk-forest bg-risk-1 px-2 py-1 rounded">98%</span>
            </div>

            {/* GloFAS */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-suk-amber"></div>
                <div>
                  <h4 className="font-ui font-bold text-sm text-text-dark">GloFAS Forecasts</h4>
                  <p className="font-ui text-xs text-text-muted">Latency detected (&gt;1hr)</p>
                </div>
              </div>
              <span className="font-data text-xs font-bold text-suk-amber bg-risk-3 px-2 py-1 rounded">Delayed</span>
            </div>

            {/* ISRO Bhuvan */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-suk-forest animate-pulse"></div>
                <div>
                  <h4 className="font-ui font-bold text-sm text-text-dark">ISRO Bhuvan WMS</h4>
                  <p className="font-ui text-xs text-text-muted">Tile server connected</p>
                </div>
              </div>
              <span className="font-data text-xs font-bold text-suk-forest bg-risk-1 px-2 py-1 rounded">Stable</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border-light">
            <Link to="/status" className="w-full block text-center py-2 bg-bg-surface hover:bg-bg-surface-2 border border-border-default rounded-lg font-ui font-bold text-sm text-text-body transition-colors">
              Detailed Diagnostics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
