import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, ArrowClockwise, Terminal as TerminalIcon } from 'phosphor-react';
import { useDataMeta } from '../hooks/useTelemetry';

const BASE = import.meta.env.BASE_URL || '/';

const DATASET_FILES = [
  { key: 'cwc_national_levels.json',  label: 'CWC National Levels',      source: 'CWC IAM API' },
  { key: 'cwc_above_warning.json',    label: 'CWC Above Warning',         source: 'CWC FFS API' },
  { key: 'cwc_above_danger.json',     label: 'CWC Above Danger',          source: 'CWC FFS API' },
  { key: 'cwc_inflow_stations.json',  label: 'CWC Inflow / Reservoirs',   source: 'CWC Manual' },
  { key: 'cwc_district_alerts.json',  label: 'CWC District Catalog',      source: 'CWC IAM API' },
  { key: 'cwc_basins_highres.json',   label: 'CWC Basin Catalog',         source: 'CWC IAM API' },
  { key: 'imd_district_warnings.json',label: 'IMD District Warnings',     source: 'IMD Mausam' },
  { key: 'imd_district_rainfall.json',label: 'IMD District Rainfall',     source: 'IMD Mausam' },
  { key: 'imd_state_rainfall.json',   label: 'IMD State Rainfall',        source: 'IMD Mausam' },
  { key: 'radar_metadata.json',       label: 'RainViewer Radar',          source: 'RainViewer API' },
  { key: 'glofas_sample_discharge.json', label: 'GloFAS Discharge',       source: 'Open-Meteo GloFAS' },
  { key: 'soil_moisture_basins.json', label: 'Soil Moisture',             source: 'NASA SPoRT' },
  { key: '_meta.json',                label: 'Pipeline Metadata',         source: 'Internal' },
];

interface FileHealth {
  key:    string;
  size:   number;
  status: 'ok' | 'empty' | 'error';
}

interface CIRun {
  id: number;
  name: string;
  conclusion: 'success' | 'failure' | 'cancelled' | null;
  status: string;
  run_number: number;
  created_at: string;
  html_url: string;
  head_commit: { message: string };
}

export const SystemMonitor: React.FC = () => {
  const { data: meta, refetch } = useDataMeta() as any;
  const [filesHealth, setFilesHealth] = useState<FileHealth[]>([]);
  const [ciRuns, setCiRuns]           = useState<CIRun[]>([]);
  const [ciLoading, setCiLoading]     = useState(true);
  const [lastFetch, setLastFetch]     = useState<Date | null>(null);
  const [logs, setLogs]               = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(l => [`[${new Date().toISOString().slice(11, 19)}] ${msg}`, ...l.slice(0, 49)]);

  // Check each JSON file
  useEffect(() => {
    const check = async () => {
      addLog('Checking dataset health…');
      const results: FileHealth[] = [];
      for (const f of DATASET_FILES) {
        try {
          const r = await fetch(`${BASE}mock/${f.key}`);
          if (!r.ok) { results.push({ key: f.key, size: 0, status: 'error' }); continue; }
          const text = await r.text();
          const size = text.length;
          const parsed = JSON.parse(text);
          const empty = (Array.isArray(parsed) && parsed.length === 0) || parsed === null;
          results.push({ key: f.key, size, status: empty ? 'empty' : 'ok' });
        } catch {
          results.push({ key: f.key, size: 0, status: 'error' });
        }
      }
      setFilesHealth(results);
      const ok = results.filter(r => r.status === 'ok').length;
      addLog(`Dataset scan complete: ${ok}/${results.length} healthy`);
    };
    check();
  }, []);

  // Fetch GitHub Actions runs
  useEffect(() => {
    const fetchCI = async () => {
      setCiLoading(true);
      try {
        addLog('Fetching GitHub Actions status…');
        const r = await fetch('https://api.github.com/repos/Satwik-1234/Flood-Dash/actions/runs?per_page=8');
        if (r.ok) {
          const d = await r.json();
          setCiRuns(d.workflow_runs ?? []);
          setLastFetch(new Date());
          addLog(`GitHub Actions: ${d.workflow_runs?.length ?? 0} recent runs fetched`);
        } else {
          addLog(`GitHub API returned ${r.status} — rate limited or no auth`);
        }
      } catch {
        addLog('GitHub API fetch failed — network error');
      }
      setCiLoading(false);
    };
    fetchCI();
  }, []);

  const recheck = async () => {
    addLog('Manual refresh triggered…');
    refetch();
  };

  const ok    = filesHealth.filter(f => f.status === 'ok').length;
  const empty = filesHealth.filter(f => f.status === 'empty').length;
  const err   = filesHealth.filter(f => f.status === 'error').length;

  return (
    <div className="h-full flex flex-col bg-bg-base overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-display text-base font-bold text-t1">System Monitor</h2>
          <p className="text-[10px] font-mono text-t3">
            Pipeline health · Dataset status · GitHub Actions CI
            {lastFetch ? ` · Last checked ${lastFetch.toLocaleTimeString('en-IN')}` : ''}
          </p>
        </div>
        <button
          onClick={recheck}
          className="flex items-center gap-2 px-3 py-1.5 bg-bg-s1 border border-white/10 hover:border-accent-blue/40 rounded text-[10px] font-mono text-t2 hover:text-t1 transition-all"
        >
          <ArrowClockwise size={12} />
          Refresh
        </button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-2 gap-px bg-white/5 overflow-hidden">

        {/* Left: Dataset health + CI */}
        <div className="bg-bg-base flex flex-col overflow-hidden">

          {/* Pipeline Meta */}
          {meta && (
            <div className="px-5 py-3 border-b border-white/5 shrink-0">
              <p className="section-label mb-2">Last Pipeline Run</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Timestamp', value: new Date(meta.generated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) },
                  { label: 'Duration',  value: `${meta.duration_sec?.toFixed(2)}s` },
                  { label: 'Version',   value: `v${meta.v}` },
                ].map(m => (
                  <div key={m.label}>
                    <p className="section-label mb-1">{m.label}</p>
                    <p className="font-mono text-[11px] text-accent-cyan font-bold">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dataset Status Summary */}
          <div className="px-5 py-3 border-b border-white/5 grid grid-cols-3 gap-4 shrink-0">
            {[
              { label: 'Healthy', count: ok,    color: '#10B981' },
              { label: 'Empty',   count: empty, color: '#F59E0B' },
              { label: 'Error',   count: err,   color: '#EF4444' },
            ].map(s => (
              <div key={s.label}>
                <p className="section-label mb-1">{s.label}</p>
                <p className="font-mono text-lg font-bold" style={{ color: s.color }}>{s.count}</p>
              </div>
            ))}
          </div>

          {/* Files Table */}
          <div className="flex-1 overflow-y-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Dataset</th>
                  <th>Source</th>
                  <th className="text-right">Size</th>
                </tr>
              </thead>
              <tbody>
                {DATASET_FILES.map(f => {
                  const health = filesHealth.find(h => h.key === f.key);
                  const status = health?.status ?? 'checking';
                  return (
                    <tr key={f.key}>
                      <td>
                        {status === 'ok'      && <CheckCircle size={13} weight="fill" className="text-c-ok" />}
                        {status === 'empty'   && <Clock        size={13} weight="fill" className="text-c-warn" />}
                        {status === 'error'   && <XCircle      size={13} weight="fill" className="text-c-danger" />}
                        {status === 'checking'&& <span className="text-[9px] font-mono text-t3">…</span>}
                      </td>
                      <td>
                        <span className="font-mono text-[10px] text-t2">{f.label}</span>
                        <span className="font-mono text-[9px] text-t3 block">{f.key}</span>
                      </td>
                      <td><span className="font-mono text-[9px] text-t3">{f.source}</span></td>
                      <td className="text-right">
                        <span className="font-mono text-[10px] text-t2">
                          {health?.size ? `${(health.size / 1024).toFixed(1)}KB` : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: CI Runs + Terminal */}
        <div className="bg-bg-base flex flex-col overflow-hidden">

          {/* GitHub Actions */}
          <div className="px-5 py-3 border-b border-white/5 shrink-0">
            <p className="section-label mb-3">GitHub Actions (Recent Runs)</p>
            {ciLoading ? (
              <p className="text-[10px] font-mono text-t3 animate-pulse">Fetching CI status…</p>
            ) : ciRuns.length === 0 ? (
              <p className="text-[10px] font-mono text-t3">No CI data — API may be rate-limited</p>
            ) : (
              <div className="space-y-2">
                {ciRuns.slice(0, 5).map(run => (
                  <a
                    key={run.id}
                    href={run.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-bg-s1 border border-white/5 hover:border-accent-blue/30 transition-all group"
                  >
                    <div className="shrink-0">
                      {run.conclusion === 'success'   && <CheckCircle size={14} weight="fill" className="text-c-ok" />}
                      {run.conclusion === 'failure'   && <XCircle      size={14} weight="fill" className="text-c-danger" />}
                      {run.conclusion === 'cancelled' && <Clock        size={14} weight="fill" className="text-t3" />}
                      {!run.conclusion                && <span className="w-3.5 h-3.5 rounded-full bg-accent-blue animate-pulse inline-block" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-t2 truncate">{run.name}</span>
                        <span className="text-[9px] font-mono text-t3">#{run.run_number}</span>
                      </div>
                      <p className="font-mono text-[9px] text-t3 truncate">{run.head_commit?.message?.slice(0, 50) ?? ''}</p>
                    </div>
                    <span className="font-mono text-[9px] text-t3 shrink-0">
                      {new Date(run.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Terminal Log */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="terminal flex-1 flex flex-col overflow-hidden m-3 mt-2 rounded-lg">
              <div className="terminal-header">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <span className="text-[9px] text-t3 font-mono ml-2">PRAVHATATTVA — System Log</span>
              </div>
              <div className="terminal-body flex-1 overflow-y-auto">
                {logs.length === 0 ? (
                  <span className="opacity-50">Initializing…</span>
                ) : (
                  logs.map((line, i) => (
                    <div key={i} className="leading-6">
                      <span className="opacity-50 mr-2">$</span>
                      <span>{line}</span>
                    </div>
                  ))
                )}
                <div className="flex items-center gap-1 mt-2">
                  <span className="opacity-50">$</span>
                  <span className="w-2 h-4 bg-green-400 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;
