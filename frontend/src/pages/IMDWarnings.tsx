import React, { useState } from 'react';
import { 
  CloudRain, 
  MapPin, 
  Wind, 
  Droplets, 
  ChevronRight,
  Info,
  AlertOctagon
} from 'lucide-react';
import { useIMDDistrictWarnings } from '../hooks/useTelemetry';
import { clsx } from 'clsx';

const IMDWarnings: React.FC = () => {
  const { data: warnings = [], isLoading } = useIMDDistrictWarnings();
  const [selected, setSelected] = useState<string | null>(null);

  const getSeverityColor = (sev: string) => {
    switch (sev.toUpperCase()) {
      case 'EXTREME': return 'bg-accent-red text-white';
      case 'SEVERE': return 'bg-accent-amber text-black';
      case 'MODERATE': return 'bg-yellow-400 text-black';
      default: return 'bg-ok text-white';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-deep overflow-hidden">
      {/* Tactical Header */}
      <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-surface-base">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <CloudRain className="w-4 h-4 text-accent-cyan" />
             <span className="text-[10px] font-bold tracking-[0.2em] text-t3 uppercase">Regional Meteo Feed: ACTIVE</span>
          </div>
          <h1 className="heading-display text-3xl text-white">IMD Intelligence</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 glass-panel border border-white/10 rounded-xl text-[10px] font-bold tracking-widest text-t3 uppercase">
            5-Day Forecast Stream
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warnings.length > 0 ? warnings.map((w: any) => (
            <div 
              key={w.id} 
              className={clsx(
                "glass-card p-6 flex flex-col gap-4 border-l-4 group cursor-pointer transition-all hover:scale-[1.02]",
                w.severity === 'EXTREME' ? "border-l-accent-red" : "border-l-accent-amber"
              )}
            >
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <MapPin className="w-4 h-4 text-t3" />
                     <span className="text-xs font-bold text-white uppercase tracking-wider">{w.district}</span>
                  </div>
                  <span className={clsx("px-2 py-0.5 rounded text-[9px] font-bold uppercase", getSeverityColor(w.severity))}>
                    {w.severity}
                  </span>
               </div>

               <h4 className="heading-display text-xl text-white tracking-tight">{w.state}</h4>
               
               <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                     <div className="text-[8px] font-bold text-t3 uppercase tracking-[0.2em] mb-1">RAIN (24H)</div>
                     <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-accent-cyan">{w.rainfall_24h_mm?.toFixed(1) || '0.0'}</span>
                        <span className="text-[9px] text-t3 font-mono">mm</span>
                     </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                     <div className="text-[8px] font-bold text-t3 uppercase tracking-[0.2em] mb-1">NOWCAST</div>
                     <div className="text-[10px] font-bold text-white truncate">Thunderstorms Potential</div>
                  </div>
               </div>

               <div className="mt-2 text-[11px] text-t2 leading-relaxed opacity-60 italic">
                 Official metadata provided via the regional IMD intelligence node. Sector-4 observation active.
               </div>
            </div>
          )) : (
            <div className="col-span-full py-32 text-center">
               <AlertOctagon className="w-12 h-12 text-t3 mx-auto mb-4 animate-pulse" />
               <h3 className="heading-display text-xl text-t1 mb-2">No Active Warnings</h3>
               <p className="text-sm text-t3 font-mono uppercase tracking-widest">Regional Atmospheric Stability Confirmed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IMDWarnings;
