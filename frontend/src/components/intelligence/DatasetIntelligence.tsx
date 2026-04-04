import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Database, Info, Warning, Clock, Globe, ShieldCheck, Waves, CloudRain } from 'phosphor-react';

interface DatasetMeta {
  generated_at: string;
  v: string;
  datasets: Record<string, {
    source: string;
    latency: string;
    description: string;
  }>;
}

export const DatasetIntelligence: React.FC = () => {
  const { data: meta } = useQuery<DatasetMeta>({
    queryKey: ['data-meta'],
    queryFn: async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL || '/'}mock/_meta.json`);
        if (!res.ok) return null;
        return await res.json();
      } catch (err) {
        console.error('Data Meta Error:', err);
        return null;
      }
    }
  });

  if (!meta) return null;

  return (
    <div className="w-full bg-[#0F172A] border-t border-white/5 p-12 overflow-hidden relative group">
       {/* Background Decoration */}
       <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
       
       <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
             <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
                      <Database size={20} className="text-sky-400" weight="fill" />
                   </div>
                   <h2 className="text-2xl font-black text-white tracking-tight uppercase">Intelligence Architecture</h2>
                </div>
                <p className="text-slate-500 text-sm max-w-xl leading-relaxed font-medium">
                   Pravhatattva operates as a zero-server hydrological command center, integrating official REST endpoints from CWC, NRSC, and IMD. All data is verified through a 24/7 automated GitHub Action pipeline.
                </p>
             </div>
             
             <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   Pipeline V{meta.v}
                </div>
                <div className="flex items-center gap-2">
                   <Clock size={16} />
                   Updated {new Date(meta.generated_at).toLocaleTimeString()} IST
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {Object.entries(meta.datasets).map(([id, ds]) => (
                <div key={id} className="p-8 rounded-[32px] bg-white/2 border border-white/5 hover:border-sky-500/30 transition-all group/card relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                   
                   <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-2xl bg-white/5 group-hover/card:bg-sky-500/10 transition-colors">
                         {id.includes('cwc') ? <Waves size={24} className="text-sky-400" /> : <CloudRain size={24} className="text-amber-400" />}
                      </div>
                      <div>
                         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{id.replace('_', ' ')}</h4>
                         <div className="text-xs font-black text-slate-200 mt-1 uppercase tracking-tight">{ds.source}</div>
                      </div>
                   </div>

                   <p className="text-[11px] text-slate-400 leading-relaxed font-medium mb-8 min-h-[48px]">
                      {ds.description}
                   </p>

                   <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2">
                         <ShieldCheck size={14} className="text-emerald-500" weight="fill" />
                         <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Verified Source</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5">
                         <Clock size={12} className="text-slate-500" />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{ds.latency}</span>
                      </div>
                   </div>
                </div>
             ))}
          </div>

          <div className="mt-12 p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex flex-col md:flex-row items-center gap-6 justify-between">
             <div className="flex items-center gap-4">
                <Warning size={24} className="text-amber-500" weight="fill" />
                <p className="text-[10px] font-bold text-amber-200/70 uppercase tracking-widest leading-relaxed">
                   Notice: Real-time telemetry is subject to sensor maintenance and satellite transmission windows. <br/> Always refer to official CWC/IMD advisories for emergency action.
                </p>
             </div>
             <a 
               href="https://ffs.india-water.gov.in/" 
               target="_blank" 
               rel="noreferrer"
               className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3 whitespace-nowrap"
             >
                CWC Official Portal
                <Globe size={16} />
             </a>
          </div>
       </div>
    </div>
  );
};
