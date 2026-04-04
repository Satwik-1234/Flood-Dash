import React from 'react';
import { 
  Droplets, 
  Activity, 
  ArrowUp, 
  ArrowDown, 
  Target,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { useCWCInflowStations } from '../hooks/useTelemetry';
import { clsx } from 'clsx';

const ReservoirMonitor: React.FC = () => {
  const { data: stations = [], isLoading } = useCWCInflowStations();

  return (
    <div className="flex-1 flex flex-col bg-bg-deep overflow-hidden">
      {/* Tactical Header */}
      <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-surface-base">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Droplets className="w-4 h-4 text-accent-cyan" />
             <span className="text-[10px] font-bold tracking-[0.2em] text-t3 uppercase">Reservoir Telemetry: SYNCED</span>
          </div>
          <h1 className="heading-display text-3xl text-white">National Reservoirs</h1>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-4 py-2 glass-panel border border-white/10 rounded-xl text-[10px] font-bold tracking-widest text-t3 uppercase">
             {stations.length} Monitored Dams
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stations.length > 0 ? stations.map((s: any, idx) => (
            <div 
              key={idx} 
              className="glass-card p-6 flex flex-col gap-4 border-l-4 border-l-accent-cyan group cursor-pointer transition-all hover:scale-[1.02] hover:bg-white/5"
            >
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Target className="w-4 h-4 text-t3" />
                     <span className="text-[10px] font-bold text-accent-cyan tracking-[0.2em] uppercase">{s.stationCode}</span>
                  </div>
                  <Monitor className="w-3.5 h-3.5 text-t3 opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>

               <h4 className="heading-display text-xl text-white tracking-tight">{s.stationName}</h4>
               
               <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-[8px] font-bold text-t3 uppercase tracking-[0.2em] mb-2">BASIN FLOW</div>
                  <div className="flex items-center justify-between">
                     <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-white font-mono-data">92.4</span>
                        <span className="text-[9px] text-t3 font-mono">%</span>
                     </div>
                     <div className="flex items-center gap-1 text-ok">
                        <ArrowUp className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">+1.2%</span>
                     </div>
                  </div>
               </div>

               <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <span className="text-[9px] font-bold text-t3 uppercase tracking-widest">Inflow Forecast</span>
                  <div className="flex gap-0.5">
                     {[1,2,3,4,5].map(i => (
                        <div key={i} className="w-3 h-1 bg-accent-blue/30 rounded-full" />
                     ))}
                  </div>
               </div>
            </div>
          )) : (
            <div className="col-span-full py-32 text-center">
               <Activity className="w-12 h-12 text-t3 mx-auto mb-4 animate-pulse" />
               <h3 className="heading-display text-xl text-t1">Gathering Station Metadata</h3>
               <p className="text-sm text-t3 font-mono uppercase tracking-widest mt-2">Connecting to CWC Information Node</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservoirMonitor;
