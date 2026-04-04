import React, { useState, useMemo } from 'react';
import { MagnifyingGlass, Warning, ArrowUp, ArrowDown, Minus } from 'phosphor-react';
import { useCWCNationalLevels, useCWCAboveWarning, useCWCAboveDanger, useGloFAS } from '../hooks/useTelemetry';

function timeAgo(iso: string) {
  if (!iso) return '—';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function getAge(iso: string): 'fresh' | 'aging' | 'stale' {
  if (!iso) return 'stale';
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (h < 6) return 'fresh';
  if (h < 48) return 'aging';
  return 'stale';
}

export const FloodWatch: React.FC = () => {
  const { data: levels = [], isLoading } = useCWCNationalLevels();
  const { data: warnings = [] }          = useCWCAboveWarning();
  const { data: danger = [] }            = useCWCAboveDanger();
  const { data: glofas }                 = useGloFAS() as any;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'warning' | 'danger' | 'fresh' | 'stale'>('all');
  const [selected, setSelected] = useState<string | null>(null);

  const warningSet = useMemo(() => new Set(warnings.map(w => w.stationCode)), [warnings]);
  const dangerSet  = useMemo(() => new Set(danger.map(w => w.stationCode)),  [danger]);

  const filtered = useMemo(() => {
    let data = levels;
    if (search) data = data.filter(l => l.stationCode.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'warning') data = data.filter(l => warningSet.has(l.stationCode));
    if (filter === 'danger')  data = data.filter(l => dangerSet.has(l.stationCode));
    if (filter === 'fresh')   data = data.filter(l => getAge(l.latestDataTime) === 'fresh');
    if (filter === 'stale')   data = data.filter(l => getAge(l.latestDataTime) === 'stale');
    return [...data].sort((a, b) => {
      // Sort: danger > warning > rest
      const aD = dangerSet.has(a.stationCode) ? 0 : warningSet.has(a.stationCode) ? 1 : 2;
      const bD = dangerSet.has(b.stationCode) ? 0 : warningSet.has(b.stationCode) ? 1 : 2;
      if (aD !== bD) return aD - bD;
      return new Date(b.latestDataTime).getTime() - new Date(a.latestDataTime).getTime();
    });
  }, [levels, search, filter, warningSet, dangerSet]);

  const selectedStation = selected ? levels.find(l => l.stationCode === selected) : null;
  const glofasDays: string[] = glofas?.daily?.time ?? [];
  const glofasQ: number[]    = glofas?.daily?.river_discharge ?? [];

  return (
    <div className="h-full flex flex-col bg-bg-base overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-t1">River & Flood Watch</h2>
            <p className="text-[10px] font-mono text-t3">
              {isLoading ? 'Loading…' : `${levels.length.toLocaleString()} CWC stations · ${warnings.length} above warning · ${danger.length} above danger`}
            </p>
          </div>
          {(warnings.length > 0 || danger.length > 0) && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-950/40 border border-red-800/50 rounded-lg">
              <Warning size={14} className="text-c-danger animate-pulse" />
              <span className="text-[11px] font-bold text-c-danger">{danger.length} DANGER · {warnings.length} WARNING</span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-3">
          <div className="relative">
            <MagnifyingGlass size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t3" />
            <input
              type="text"
              placeholder="Search station code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-bg-s1 border border-white/10 rounded text-[11px] font-mono text-t1 placeholder-t3 focus:outline-none focus:border-accent-blue/50 w-48 transition-colors"
            />
          </div>
          {([ ['all', 'All'], ['warning', `⚠ Warning (${warnings.length})`], ['danger', `🔴 Danger (${danger.length})`], ['fresh', 'Fresh'], ['stale', 'Stale'] ] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded text-[10px] font-mono transition-all border ${
                filter === v
                  ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/40'
                  : 'text-t3 border-white/10 hover:border-white/20 hover:text-t2'
              }`}
            >
              {l}
            </button>
          ))}
          <span className="ml-auto text-[10px] font-mono text-t3">{filtered.length} results</span>
        </div>
      </div>

      {/* Main: Table + Detail Panel */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* Station Table */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[11px] font-mono text-t3 animate-pulse">Loading {0} CWC records…</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Station Code</th>
                  <th className="text-right">Level (m)</th>
                  <th>Last Reading</th>
                  <th>Data Age</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => {
                  const isDanger  = dangerSet.has(l.stationCode);
                  const isWarning = warningSet.has(l.stationCode);
                  const age       = getAge(l.latestDataTime);
                  const isSelected = selected === l.stationCode;

                  return (
                    <tr
                      key={l.stationCode}
                      onClick={() => setSelected(isSelected ? null : l.stationCode)}
                      className={`cursor-pointer transition-colors ${
                        isSelected  ? 'bg-accent-blue/20 border-l-2 border-accent-blue' :
                        isDanger    ? 'bg-red-950/30 hover:bg-red-950/40' :
                        isWarning   ? 'bg-amber-950/20 hover:bg-amber-950/30' :
                        'hover:bg-bg-s2'
                      }`}
                    >
                      <td>
                        {isDanger ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold status-danger">DANGER</span>
                        ) : isWarning ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold status-warn">WARN</span>
                        ) : (
                          <span className="w-2 h-2 rounded-full inline-block" style={{ background: age === 'fresh' ? '#10B981' : age === 'aging' ? '#F59E0B' : '#EF4444' }} />
                        )}
                      </td>
                      <td>
                        <span className="font-mono text-[11px] text-accent-cyan">{l.stationCode}</span>
                      </td>
                      <td className="text-right">
                        <span className={`font-mono text-[13px] font-bold ${isDanger ? 'text-c-danger' : isWarning ? 'text-c-warn' : 'text-t1'}`}>
                          {l.latestDataValue.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-[10px] text-t3">{timeAgo(l.latestDataTime)}</span>
                      </td>
                      <td>
                        <span className={`text-[10px] font-mono capitalize ${age === 'fresh' ? 'text-c-ok' : age === 'aging' ? 'text-c-warn' : 'text-c-danger'}`}>
                          {age}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selectedStation && (
          <div className="w-72 border-l border-white/5 bg-bg-s1 flex flex-col overflow-y-auto shrink-0 animate-fadeIn">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="section-label mb-1">Station Detail</p>
              <p className="font-mono text-sm font-bold text-accent-cyan">{selectedStation.stationCode}</p>
            </div>

            <div className="px-4 py-4 space-y-4">
              <div>
                <p className="section-label mb-2">Current Level</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold text-t1">{selectedStation.latestDataValue.toFixed(2)}</span>
                  <span className="text-lg text-t3">m</span>
                </div>
              </div>

              <div>
                <p className="section-label mb-2">Alert Status</p>
                {dangerSet.has(selectedStation.stationCode) ? (
                  <span className="px-3 py-1 rounded text-xs font-bold status-danger">ABOVE DANGER LEVEL</span>
                ) : warningSet.has(selectedStation.stationCode) ? (
                  <span className="px-3 py-1 rounded text-xs font-bold status-warn">ABOVE WARNING LEVEL</span>
                ) : (
                  <span className="px-3 py-1 rounded text-xs font-bold status-ok">NORMAL</span>
                )}
              </div>

              <div>
                <p className="section-label mb-2">Last Reading</p>
                <p className="font-mono text-[11px] text-t2">
                  {selectedStation.latestDataTime
                    ? new Date(selectedStation.latestDataTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                    : 'Unknown'}
                </p>
              </div>

              {/* GloFAS mini-chart */}
              {glofasDays.length > 0 && (
                <div>
                  <p className="section-label mb-2">GloFAS 7-Day Forecast</p>
                  <div className="space-y-1">
                    {glofasDays.map((day: string, i: number) => {
                      const q = glofasQ[i] ?? 0;
                      const max = Math.max(...glofasQ, 1);
                      return (
                        <div key={day} className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-t3 w-16">{day.slice(5)}</span>
                          <div className="flex-1 h-3 bg-bg-s2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent-blue/50 rounded-full transition-all"
                              style={{ width: `${(q / max) * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-t2 w-14 text-right">{q.toFixed(1)} m³/s</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloodWatch;
