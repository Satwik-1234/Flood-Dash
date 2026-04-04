import React from 'react';
import { CloudRain, WarningOctagon, CheckCircle, Info } from 'phosphor-react';
import { useIMDWarnings, useIMDStateRainfall, useGloFAS, useDataMeta } from '../hooks/useTelemetry';

export const IMDWarnings: React.FC = () => {
  const { data: warnings  = [], isLoading: wLoading } = useIMDWarnings();
  const { data: stateRain = [], isLoading: rLoading  } = useIMDStateRainfall();
  const { data: glofas }                               = useGloFAS() as any;
  const { data: meta }                                 = useDataMeta() as any;

  const noData = warnings.length === 0 && stateRain.length === 0;

  return (
    <div className="h-full flex flex-col bg-bg-base overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 shrink-0">
        <h2 className="font-display text-base font-bold text-t1">IMD Weather Intelligence</h2>
        <p className="text-[10px] font-mono text-t3">
          District Warnings · State-wise Rainfall · GloFAS River Discharge
          {meta ? ` · Pipeline: v${meta.v}` : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* No-data state — shown when IMD APIs returned empty */}
        {noData && !wLoading && !rLoading && (
          <div className="card p-6 flex items-start gap-4">
            <Info size={20} className="text-accent-blue shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-t1">IMD Data Unavailable</p>
              <p className="text-[11px] font-mono text-t3 mt-1 leading-relaxed">
                The IMD Mausam API returned empty datasets. This typically happens outside the active monsoon season (June–October),
                or when the API requires authentication. The scraper writes empty <code className="text-accent-cyan">[]</code> to
                the JSON files when this occurs.
              </p>
              {meta?.generated_at && (
                <p className="text-[10px] font-mono text-t3 mt-3">
                  Last pipeline run: {new Date(meta.generated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                  &nbsp;(duration: {meta.duration_sec?.toFixed(1)}s)
                </p>
              )}
            </div>
          </div>
        )}

        {/* IMD District Warnings */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <WarningOctagon size={14} className="text-c-warn" />
            <h3 className="text-sm font-semibold text-t1">District Warnings</h3>
            <span className="text-[10px] font-mono text-t3">({warnings.length} advisories)</span>
          </div>

          {wLoading ? (
            <p className="text-[11px] font-mono text-t3 animate-pulse">Loading IMD advisories…</p>
          ) : warnings.length > 0 ? (
            <div className="card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>District</th>
                    <th>State</th>
                    <th>Warning</th>
                    <th>Valid Till</th>
                  </tr>
                </thead>
                <tbody>
                  {warnings.map((w: any, i: number) => (
                    <tr key={i}>
                      <td><span className="font-mono text-[11px] text-t1">{w.district ?? w.name ?? '—'}</span></td>
                      <td><span className="font-mono text-[10px] text-t3">{w.state ?? '—'}</span></td>
                      <td>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          (w.warning ?? '').includes('Red') ? 'status-danger' :
                          (w.warning ?? '').includes('Orange') ? 'status-warn' : 'status-ok'
                        }`}>{w.warning ?? w.level ?? 'Advisory'}</span>
                      </td>
                      <td><span className="font-mono text-[10px] text-t3">{w.valid_till ?? '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card p-4 flex items-center gap-2">
              <CheckCircle size={14} className="text-c-ok" />
              <span className="text-[11px] font-mono text-t3">No active district warnings</span>
            </div>
          )}
        </div>

        {/* State Rainfall */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CloudRain size={14} className="text-accent-cyan" />
            <h3 className="text-sm font-semibold text-t1">State-wise Rainfall</h3>
          </div>

          {rLoading ? (
            <p className="text-[11px] font-mono text-t3 animate-pulse">Loading rainfall data…</p>
          ) : stateRain.length > 0 ? (
            <div className="card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>State</th>
                    <th className="text-right">Actual (mm)</th>
                    <th className="text-right">Normal (mm)</th>
                    <th className="text-right">Departure</th>
                  </tr>
                </thead>
                <tbody>
                  {stateRain.map((s: any, i: number) => {
                    const dep = s.departure ?? ((s.actual - s.normal) / s.normal * 100);
                    return (
                      <tr key={i}>
                        <td><span className="font-mono text-[11px] text-t1">{s.state ?? s.name ?? '—'}</span></td>
                        <td className="text-right"><span className="font-mono text-[12px] font-bold text-t1">{(s.actual ?? 0).toFixed(1)}</span></td>
                        <td className="text-right"><span className="font-mono text-[11px] text-t3">{(s.normal ?? 0).toFixed(1)}</span></td>
                        <td className="text-right">
                          <span className={`font-mono text-[11px] font-bold ${dep > 0 ? 'text-c-ok' : 'text-c-danger'}`}>
                            {dep > 0 ? '+' : ''}{dep.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card p-4 flex items-center gap-2">
              <CheckCircle size={14} className="text-c-ok" />
              <span className="text-[11px] font-mono text-t3">No state rainfall data available</span>
            </div>
          )}
        </div>

        {/* GloFAS Discharge Chart */}
        {glofas?.daily?.time?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-t1">GloFAS River Discharge Forecast</span>
              <span className="text-[10px] font-mono text-t3">
                ({glofas.latitude?.toFixed(2)}, {glofas.longitude?.toFixed(2)}) · {glofas.elevation}m
              </span>
            </div>
            <div className="card p-4">
              <div className="flex items-end gap-2 h-24">
                {glofas.daily.time.map((day: string, i: number) => {
                  const q   = glofas.daily.river_discharge[i] ?? 0;
                  const max = Math.max(...glofas.daily.river_discharge, 1);
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-accent-blue/40 rounded-t transition-all"
                        style={{ height: `${(q / max) * 80}px`, minHeight: '2px' }}
                      />
                      <span className="font-mono text-[8px] text-t3">{day.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] font-mono text-t3 mt-2">River discharge (m³/s) · Source: GloFAS</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IMDWarnings;
