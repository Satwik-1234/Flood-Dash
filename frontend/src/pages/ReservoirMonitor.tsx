import React from 'react';
import { Waves, ArrowUp, ArrowDown, Database } from 'phosphor-react';
import { useReservoirs } from '../hooks/useTelemetry';

function timeSince(iso: string) {
  if (!iso) return '—';
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export const ReservoirMonitor: React.FC = () => {
  const { data: reservoirs = [], isLoading } = useReservoirs();

  return (
    <div className="h-full flex flex-col bg-bg-base overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 shrink-0">
        <h2 className="font-display text-base font-bold text-t1">Reservoir Monitor</h2>
        <p className="text-[10px] font-mono text-t3">CWC Inflow Stations · Live Fill Levels & Inflow/Outflow Balance</p>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-5">
        {isLoading ? (
          <p className="text-[11px] font-mono text-t3 animate-pulse">Loading reservoir data…</p>
        ) : reservoirs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <Database size={40} className="text-t3" />
            <div>
              <p className="text-sm font-semibold text-t2">No reservoir data available</p>
              <p className="text-[10px] font-mono text-t3 mt-1">The CWC inflow scraper may not have retrieved data yet.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reservoirs.map(r => {
              const fillPct = Math.min(100, Math.max(0, r.fill_pct));
              const fillColor = fillPct > 90 ? '#EF4444' : fillPct > 75 ? '#F59E0B' : '#10B981';
              const netFlow = r.inflow_cumecs - r.outflow_cumecs;

              return (
                <div key={r.station_code} className="card p-5 hover:border-accent-blue/30 transition-all">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-display text-base font-bold text-t1">{r.station_name}</p>
                      <p className="text-[10px] font-mono text-t3 mt-0.5">{r.river} · {r.state}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-bg-s2 flex items-center justify-center shrink-0">
                      <Waves size={16} className="text-accent-cyan" />
                    </div>
                  </div>

                  {/* Fill gauge */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-1.5">
                      <span className="section-label">Fill Level</span>
                      <span className="font-mono text-sm font-bold" style={{ color: fillColor }}>{fillPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-bg-s2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${fillPct}%`, background: fillColor }}
                      />
                    </div>
                  </div>

                  {/* Current Level */}
                  <div className="mb-4">
                    <p className="section-label mb-1">Current Level</p>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-2xl font-bold text-t1">{r.current_level_m.toFixed(1)}</span>
                      <span className="text-sm text-t3">m</span>
                    </div>
                  </div>

                  {/* Inflow / Outflow */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-bg-s2 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <ArrowDown size={10} className="text-accent-cyan" />
                        <span className="section-label">Inflow</span>
                      </div>
                      <p className="font-mono text-sm font-bold text-accent-cyan">
                        {r.inflow_cumecs.toLocaleString()}
                      </p>
                      <p className="text-[9px] font-mono text-t3">m³/s</p>
                    </div>
                    <div className="bg-bg-s2 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <ArrowUp size={10} className="text-c-warn" />
                        <span className="section-label">Outflow</span>
                      </div>
                      <p className="font-mono text-sm font-bold text-c-warn">
                        {r.outflow_cumecs.toLocaleString()}
                      </p>
                      <p className="text-[9px] font-mono text-t3">m³/s</p>
                    </div>
                  </div>

                  {/* Net balance */}
                  <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                    netFlow > 0 ? 'bg-red-950/20 border-red-800/30' : 'bg-emerald-950/20 border-emerald-800/30'
                  }`}>
                    <span className="text-[10px] font-mono text-t3">Net Flow</span>
                    <div className="flex items-center gap-1">
                      {netFlow > 0 ? <ArrowUp size={10} className="text-c-danger" /> : <ArrowDown size={10} className="text-c-ok" />}
                      <span className={`font-mono text-[11px] font-bold ${netFlow > 0 ? 'text-c-danger' : 'text-c-ok'}`}>
                        {netFlow > 0 ? '+' : ''}{netFlow.toLocaleString()} m³/s
                      </span>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <p className="text-[9px] font-mono text-t3 mt-3">
                    Observed: {timeSince(r.observed_at)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservoirMonitor;
