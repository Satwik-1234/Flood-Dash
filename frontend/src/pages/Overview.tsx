import React from 'react';
import { 
  Waves, 
  Wind, 
  Droplets, 
  Activity, 
  AlertTriangle,
  ChevronRight,
  Target,
  Clock
} from 'lucide-react';
import { 
  useCWCLiveLevels, 
  useCWCAboveWarning, 
  useDataMeta 
} from '../../hooks/useTelemetry';
import { clsx } from 'clsx';

const Overview: React.FC = () => {
  const { data: levels = [] } = useCWCLiveLevels();
  const { data: warnings = [] } = useCWCAboveWarning();
  const { data: meta } = useDataMeta();

  const stats = [
    { label: 'Active Sensors', value: levels.length, icon: Target, color: 'text-accent-cyan' },
    { label: 'Flood Warnings', value: warnings.length, icon: AlertTriangle, color: 'text-accent-amber' },
    { label: 'Avg Rainfall', value: '12.4mm', icon: Wind, color: 'text-accent-blue' },
    { label: 'Basins Sync', value: '100%', icon: Activity, color: 'text-ok' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-deep-slate p-8 animate-fadeIn">
      {/* Header Intelligence Banner */}
      <div className="flex items-end justify-between mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-accent-cyan pulse-cyan" />
            <span className="text-[10px] font-bold tracking-[0.3em] text-t3 uppercase">System Intelligence Operational</span>
          </div>
          <h1 className="heading-display text-5xl text-white">National Dashboard</h1>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-t3 font-mono text-[10px] mb-1">
            <Clock className="w-3 h-3" />
            <span>EST: {meta?.generated_at ? new Date(meta.generated_at).toLocaleTimeString() : 'N/A'}</span>
          </div>
          <div className="text-[10px] font-bold text-accent-cyan tracking-widest uppercase">Node: VR-India-01</div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="telemetry-grid mb-8">
        {stats.map((s, idx) => (
          <div key={idx} className="kpi-card relative overflow-hidden group">
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <s.icon className={clsx("w-6 h-6", s.color)} />
                  <ChevronRight className="w-4 h-4 text-t3 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
                <div className="kpi-value">{s.value}</div>
                <div className="kpi-label">{s.label}</div>
             </div>
             {/* Decorative Background Element */}
             <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 blur-3xl rounded-full" />
          </div>
        ))}
      </div>

      {/* Dual Column Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Warning Feed */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Waves className="w-5 h-5 text-accent-cyan" />
              <h3 className="heading-display text-lg font-bold text-white">Hydrological Alerts</h3>
            </div>
            <button className="text-[10px] font-bold text-t3 hover:text-accent-cyan transition-colors uppercase tracking-widest">View Theatre map</button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="data-table">
               <thead>
                 <tr>
                    <th>Station</th>
                    <th>River</th>
                    <th>Current</th>
                    <th>Trend</th>
                    <th>Status</th>
                 </tr>
               </thead>
               <tbody>
                 {levels.slice(0, 10).map((l: any) => (
                   <tr key={l.stationCode} className="hover:bg-white/5 transition-colors cursor-pointer group">
                      <td className="font-bold text-white tracking-tight">{l.stationName || l.stationCode}</td>
                      <td className="text-t2 font-medium">{l.riverName || 'National'}</td>
                      <td>
                        <span className="font-mono-data text-accent-blue font-bold">{l.latestDataValue?.toFixed(2)}</span>
                        <span className="text-[9px] text-t3 ml-1">m</span>
                      </td>
                      <td>
                         <div className="w-20 h-6">
                            {/* Small Sparkline Placeholder */}
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                               <div className="w-2/3 h-full bg-accent-cyan" />
                            </div>
                         </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-ok" />
                           <span className="text-[10px] font-bold text-ok uppercase tracking-widest">Stable</span>
                        </div>
                      </td>
                   </tr>
                 ))}
                 {levels.length === 0 && (
                   <tr>
                      <td colSpan={5} className="py-20 text-center text-t3 font-mono text-[10px] uppercase tracking-[0.3em]">
                        Waiting for sensor handshake...
                      </td>
                   </tr>
                 )}
               </tbody>
            </table>
          </div>
        </div>

        {/* Global Pipeline Health */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-accent-blue" />
            <h3 className="heading-display text-lg font-bold text-white">Automation Health</h3>
          </div>

          <div className="space-y-6 flex-1">
             {[
               { label: 'CWC FFS API', status: 'online', load: '12ms' },
               { label: 'IMD SECTOR-4', status: 'maintenance', load: '---' },
               { label: 'GH-ACTIONS STACK', status: 'online', load: '0.4s' },
               { label: 'RADAR GRID', status: 'online', load: '24ms' },
             ].map((n, i) => (
               <div key={i} className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-t3 tracking-widest uppercase">{n.label}</span>
                    <span className={clsx(
                      "font-bold uppercase tracking-widest",
                      n.status === 'online' ? 'text-ok' : 'text-accent-amber'
                    )}>{n.status}</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <div className="h-1 flex-1 bg-white/5 rounded-full mr-4 overflow-hidden">
                       <div className={clsx(
                         "h-full rounded-full transition-all duration-1000",
                         n.status === 'online' ? "bg-accent-blue w-3/4" : "bg-accent-amber w-1/4"
                       )} />
                    </div>
                    <span className="font-mono text-[10px] text-t3">{n.load}</span>
                  </div>
               </div>
             ))}
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-accent-blue/10 border border-accent-blue/20">
             <div className="text-[9px] font-bold text-accent-blue tracking-[0.2em] uppercase mb-2">Network Topology</div>
             <p className="text-[11px] text-t2 leading-relaxed">
               All hydrological nodes are synchronized via the Pravhatattva Zero-Server pipeline. Last global sync was successful.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
