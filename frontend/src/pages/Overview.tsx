import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Warning, Waves, CheckCircle, Database, Broadcast } from 'phosphor-react';
import { useCWCNationalLevels, useCWCAboveWarning, useCWCAboveDanger, useDataMeta } from '../hooks/useTelemetry';

function timeAgo(iso: string): string {
  if (!iso) return '—';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getDataAge(iso: string): 'fresh' | 'aging' | 'stale' {
  if (!iso) return 'stale';
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (h < 6)  return 'fresh';
  if (h < 48) return 'aging';
  return 'stale';
}

const ageColor = { fresh: '#10B981', aging: '#F59E0B', stale: '#EF4444' };

export const Overview: React.FC = () => {
  const { data: levels = [], isLoading } = useCWCNationalLevels();
  const { data: warnings = [] } = useCWCAboveWarning();
  const { data: danger = [] } = useCWCAboveDanger();
  const { data: meta } = useDataMeta() as any;

  const stats = useMemo(() => {
    const total = levels.length;
    const fresh  = levels.filter(l => getDataAge(l.latestDataTime) === 'fresh').length;
    const aging  = levels.filter(l => getDataAge(l.latestDataTime) === 'aging').length;
    const stale  = levels.filter(l => getDataAge(l.latestDataTime) === 'stale').length;
    return { total, fresh, aging, stale };
  }, [levels]);

  // Recent 50 stations sorted by most recent data time
  const recent = useMemo(() =>
    [...levels]
      .filter(l => l.latestDataTime)
      .sort((a, b) => new Date(b.latestDataTime).getTime() - new Date(a.latestDataTime).getTime())
      .slice(0, 50),
    [levels]
  );

  const warningCodes = useMemo(() => new Set(warnings.map(w => w.stationCode)), [warnings]);
  const dangerCodes  = useMemo(() => new Set(danger.map(w => w.stationCode)),  [danger]);

  const kpis = [
    { label: 'Active Stations',  value: isLoading ? '—' : stats.total.toLocaleString(), color: '#22D3EE', sub: 'HHS telemetry nodes' },
    { label: 'Reporting Live',   value: isLoading ? '—' : stats.fresh.toLocaleString(), color: '#10B981', sub: '< 6h data age' },
    { label: 'Above Warning',    value: warnings.length.toString(),                      color: '#F59E0B', sub: `+ ${danger.length} above danger` },
    { label: 'Stale / Offline',  value: isLoading ? '—' : stats.stale.toLocaleString(), color: '#EF4444', sub: '> 48h data age' },
  ];

  return (
    <div className="h-full flex flex-col bg-bg-base overflow-hidden">

      {/* ── Top Bar */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-display text-xl font-bold text-t1 tracking-tight">
            National Flood Command
          </h1>
          <p className="text-[11px] font-mono text-t3 mt-0.5">
            CWC · IMD · RainViewer · GloFAS
            {meta ? ` · Synced ${timeAgo(meta.generated_at)}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-c-ok pulse-ok" />
          <span className="text-[10px] font-mono text-t3">PIPELINE ACTIVE</span>
        </div>
      </div>

      {/* ── KPI Row */}
      <div className="grid grid-cols-4 gap-px bg-white/5 border-b border-white/5 shrink-0">
        {kpis.map((k) => (
          <div key={k.label} className="bg-bg-base px-6 py-5">
            <p className="section-label mb-3">{k.label}</p>
            <p className="font-display text-4xl font-bold tabular-nums" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px] font-mono text-t3 mt-2">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main Content */}
      <div className="flex-1 min-h-0 grid grid-cols-3 gap-px bg-white/5 overflow-hidden">

        {/* Left: Live Telemetry Feed */}
        <div className="col-span-2 bg-bg-base flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Waves size={14} className="text-accent-cyan" />
              <span className="text-xs font-semibold text-t1">Live Telemetry Feed</span>
              <span className="text-[10px] font-mono text-t3">— {recent.length} most recent readings</span>
            </div>
            <Link to="/flood" className="flex items-center gap-1 text-[10px] font-mono text-accent-blue hover:text-accent-cyan transition-colors">
              View all <ArrowRight size={10} />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-3">
                  <div className="flex gap-1 justify-center">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <p className="text-[10px] font-mono text-t3">Loading CWC telemetry…</p>
                </div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Station Code</th>
                    <th>Level (m)</th>
                    <th>Last Reading</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((s) => {
                    const age = getDataAge(s.latestDataTime);
                    const isDanger  = dangerCodes.has(s.stationCode);
                    const isWarning = warningCodes.has(s.stationCode);
                    return (
                      <tr key={s.stationCode} className={isDanger ? 'bg-red-950/30' : isWarning ? 'bg-amber-950/20' : ''}>
                        <td>
                          <span className="font-mono text-[11px] text-accent-cyan">{s.stationCode}</span>
                        </td>
                        <td>
                          <span className="font-mono text-[12px] font-bold text-t1">
                            {s.latestDataValue.toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-[10px] text-t3">{timeAgo(s.latestDataTime)}</span>
                        </td>
                        <td>
                          {isDanger ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold status-danger">DANGER</span>
                          ) : isWarning ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold status-warn">WARNING</span>
                          ) : (
                            <span
                              className="px-2 py-0.5 rounded text-[9px] font-bold"
                              style={{ color: ageColor[age] }}
                            >
                              {age.toUpperCase()}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Summary Panels */}
        <div className="bg-bg-base flex flex-col overflow-hidden">

          {/* Active Warnings */}
          <div className="px-5 py-3 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Warning size={14} className="text-c-warn" />
              <span className="text-xs font-semibold text-t1">Active CWC Alerts</span>
            </div>
            {warnings.length === 0 && danger.length === 0 ? (
              <div className="flex items-center gap-2 text-[10px] font-mono text-c-ok">
                <CheckCircle size={12} />
                No active alerts
              </div>
            ) : (
              <div className="space-y-1.5">
                {[...danger.map(d => ({ ...d, level: 'DANGER' })), ...warnings.map(w => ({ ...w, level: 'WARNING' }))].map(a => (
                  <div key={a.stationCode} className="flex items-center justify-between py-1.5 border-b border-white/5">
                    <span className="font-mono text-[10px] text-t2">{a.stationCode}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-t1">{a.value.toFixed(2)}m</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${a.level === 'DANGER' ? 'status-danger' : 'status-warn'}`}>
                        {a.level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="flex-1 px-5 py-4 flex flex-col gap-2">
            <p className="section-label mb-2">Quick Access</p>
            {[
              { to: '/map',        icon: Broadcast, label: 'GIS Theatre', sub: 'Live map + radar' },
              { to: '/flood',      icon: Waves,     label: 'River Watch',  sub: 'All CWC stations' },
              { to: '/reservoirs', icon: Database,  label: 'Reservoirs',   sub: 'Fill levels + inflow' },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 p-3 rounded-lg bg-bg-s1 border border-white/5 hover:border-accent-blue/30 hover:bg-bg-s2 transition-all group"
              >
                <div className="w-8 h-8 rounded bg-bg-s2 flex items-center justify-center shrink-0">
                  <link.icon size={14} className="text-accent-blue group-hover:text-accent-cyan transition-colors" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-t1">{link.label}</p>
                  <p className="text-[10px] font-mono text-t3">{link.sub}</p>
                </div>
                <ArrowRight size={12} className="ml-auto text-t3 group-hover:text-accent-blue transition-colors" />
              </Link>
            ))}
          </div>

          {/* Pipeline info */}
          {meta && (
            <div className="px-5 py-4 border-t border-white/5 shrink-0">
              <p className="section-label mb-2">Pipeline</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[10px] font-mono text-t3">Version</span>
                  <span className="text-[10px] font-mono text-accent-cyan">v{meta.v}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-mono text-t3">Duration</span>
                  <span className="text-[10px] font-mono text-t2">{meta.duration_sec?.toFixed(1)}s</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;
