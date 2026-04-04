import React, { useState, useEffect } from 'react';
import { 
  Terminal as TerminalIcon, 
  Cpu, 
  Database, 
  Globe, 
  Activity,
  Zap,
  Server,
  CloudZap
} from 'lucide-react';
import { useDataMeta } from '../hooks/useTelemetry';
import { clsx } from 'clsx';

const SystemMonitor: React.FC = () => {
  const { data: meta } = useDataMeta();
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const baseLogs = [
      '[SYSTEM] pravhatattva_node_vr05 initialization...',
      '[NETWORK] connecting to relay ffs.india-water.gov.in...',
      '[STREAM] cwc_national_levels.json: 200 OK (310 KB)',
      '[STREAM] imd_district_warnings.json: 401 UNAUTHORIZED (FALLBACK_MODE)',
      '[COMPUTE] generating mock_hydrograph_v2: 1,371 records processed',
      '[GIS] loading basin_cwc.geojson: 17.4 MB buffered',
      '[SYSTEM] command_center_v5.0 operational.',
    ];
    
    let i = 0;
    const itv = setInterval(() => {
      if (i < baseLogs.length) {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${baseLogs[i]}`]);
        i++;
      } else {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] HEARTBEAT: NODE_INTERNAL_SYNC_OK`]);
        if (prev.length > 20) prev.shift();
      }
    }, 2000);
    return () => clearInterval(itv);
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-bg-deep overflow-hidden">
      {/* Tactical Header */}
      <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-surface-base">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Server className="w-4 h-4 text-accent-blue" />
             <span className="text-[10px] font-bold tracking-[0.2em] text-t3 uppercase">Infrastructure Intelligence: STABLE</span>
          </div>
          <h1 className="heading-display text-3xl text-white">System Monitor</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Terminal Block */}
        <div className="lg:col-span-2 flex flex-col h-[600px]">
           <div className="flex items-center gap-2 mb-4 px-2">
              <TerminalIcon className="w-4 h-4 text-accent-cyan" />
              <span className="text-[10px] font-bold text-t2 tracking-widest uppercase">Process Console (v5.0)</span>
           </div>
           <div className="flex-1 bg-black/60 rounded-3xl p-6 font-mono text-[11px] text-accent-blue border border-white/5 overflow-y-auto shadow-2xl">
              {logs.map((log, idx) => (
                <div key={idx} className="mb-1 leading-relaxed opacity-80 animate-fadeIn">
                   <span className="text-t3 mr-2">{'>'}</span>
                   {log}
                </div>
              ))}
              <div className="w-2 h-4 bg-accent-cyan inline-block ml-1 animate-pulse" />
           </div>
        </div>

        {/* System Stats Side-Panel */}
        <div className="flex flex-col gap-6">
           <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-accent-blue">
              <div className="flex items-center gap-3 mb-6">
                 <Cpu className="w-5 h-5 text-accent-blue" />
                 <span className="text-[10px] font-bold text-t3 tracking-widest uppercase">Resource Allocation</span>
              </div>
              <div className="space-y-6">
                 {[
                   { label: 'Compute Load', val: '14%', color: 'bg-accent-blue' },
                   { label: 'Memory Cache', val: '42%', color: 'bg-accent-cyan' },
                   { label: 'Map Buffer', val: '88%', color: 'bg-accent-amber' },
                 ].map((s, i) => (
                   <div key={i} className="flex flex-col gap-2">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-t1">
                         <span>{s.label}</span>
                         <span>{s.val}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                         <div className={clsx("h-full rounded-full transition-all duration-1000", s.color)} style={{ width: s.val }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-accent-cyan">
              <div className="flex items-center gap-3 mb-6">
                 <Globe className="w-5 h-5 text-accent-cyan" />
                 <span className="text-[10px] font-bold text-t3 tracking-widest uppercase">Network Topology</span>
              </div>
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-t2">Uptime</span>
                    <span className="text-xs font-bold text-white font-mono-data">99.98%</span>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-t2">Sync Node</span>
                    <span className="text-xs font-bold text-accent-cyan font-mono-data">IN-MH-01</span>
                 </div>
              </div>
           </div>

           <div className="mt-auto glass-card p-6 bg-accent-blue/10 border-accent-blue/20">
              <div className="flex items-center gap-2 mb-2">
                 <CloudZap className="w-4 h-4 text-accent-blue" />
                 <span className="text-[10px] font-bold text-accent-blue tracking-widest uppercase">Automation Active</span>
              </div>
              <p className="text-[11px] text-t2 leading-relaxed italic">
                 Pipeline runs every 15 minutes via GitHub Actions. Current state is synchronized with remote repository.
              </p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default SystemMonitor;
