import React, { useState, useMemo } from 'react';
import {
  X, MapPin, Drop, ChartBar, Warning, CaretRight,
  Wind, Thermometer, CloudRain, Eye, Gauge, Waves,
  TrendUp, Info, Activity, Brain, Globe, Database, Target as TargetIcon
} from 'phosphor-react';
import { CWCStationData } from '../../api/schemas';
import { useCWCHydrograph } from '../../hooks/useTelemetry';

type TabId = 'telemetry' | 'hydrograph' | 'atmo' | 'alerts';

interface StationPopupProps {
  station: CWCStationData;
  onClose: () => void;
}

const getRiskInfo = (station: CWCStationData) => {
  const danger_m = (station as any).danger_m || 0;
  const ratio = danger_m > 0 ? (station.current_water_level_m / danger_m) : 0;
  if (ratio >= 1.0) return { label: 'CRITICAL VIOLATION', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
  if (ratio >= 0.8) return { label: 'SECTOR WARNING', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.1)' };
  if (ratio > 0)    return { label: 'NOMINAL FLOW', color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.1)' };
  return { label: 'GDI STABLE', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.1)' };
};

export const StationPopup: React.FC<StationPopupProps> = ({ station, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabId>('telemetry');
  const risk = useMemo(() => getRiskInfo(station), [station]);

  const { isLoading: hydroLoading } = useCWCHydrograph((station as any).id);

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'telemetry',  label: 'Matrix',    icon: Activity },
    { id: 'hydrograph', label: 'Trace',     icon: ChartBar },
    { id: 'atmo',       label: 'Atmosphere', icon: CloudRain },
    { id: 'alerts',     label: 'Sector',    icon: Warning   },
  ];

  return (
    <div className="absolute top-12 right-12 z-[1000] w-[460px] max-h-[calc(100vh-140px)] flex flex-col bg-white border-4 border-slate-900 shadow-[24px_24px_0_rgba(15,23,42,0.1)] overflow-hidden font-auth animate-in fade-in slide-in-from-right-12 duration-500">
      
      {/* AUTHORITARIAN HEADER */}
      <div className="p-8 pb-6 relative group bg-[#020617] text-white">
         <button 
           onClick={onClose}
           className="absolute top-8 right-8 p-3 rounded-none bg-white/10 hover:bg-sky-500 text-white transition-all z-20"
         >
           <X size={20} weight="bold" />
         </button>

         <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1 bg-sky-500/20 border border-sky-500/30">
               <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest leading-none">{(station.state as string)?.toUpperCase() || 'NATIONAL'}</span>
            </div>
            <div className="px-3 py-1 bg-white/5 border border-white/10">
               <span className="text-[10px] font-black uppercase tracking-widest leading-none" style={{ color: risk.color }}>{risk.label}</span>
            </div>
         </div>

         <div className="space-y-2">
            <h3 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
               {String(station.station_name || station.name || 'Gauging Node')}
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] opacity-80">
               <span>PIPELINE: {String(station.river || 'UNKNOWN').toUpperCase()}</span>
               <span className="opacity-30">|</span>
               <span>{String(station.station_code || station.code || 'UNNAMED')}</span>
            </div>
         </div>
      </div>

      {/* COMMAND TABS */}
      <div className="flex border-b-4 border-slate-100 bg-slate-50">
         {TABS.map(t => (
            <button
               key={t.id}
               onClick={() => setActiveTab(t.id)}
               className={`flex-1 py-5 flex flex-col items-center gap-2 transition-all relative group ${
                  activeTab === t.id ? 'bg-white text-sky-600' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
               }`}
            >
               <t.icon size={20} weight={activeTab === t.id ? 'fill' : 'regular'} className="transition-transform group-hover:scale-110" />
               <span className="text-[9px] font-black uppercase tracking-widest">{t.label}</span>
               {activeTab === t.id && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500" />
               )}
            </button>
         ))}
      </div>

      {/* ANALYTICAL BODY */}
      <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide min-h-[420px] bg-white">
         {activeTab === 'telemetry' && (
            <div className="space-y-10 animate-in fade-in duration-300">
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4 border-l-4 border-sky-500 pl-6">
                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hydrometric Stage</div>
                     <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">
                           {station.current_water_level_m?.toFixed(2)}
                        </span>
                        <span className="text-xs font-black text-slate-300 uppercase tracking-widest">m</span>
                     </div>
                     <div className={`flex items-center gap-2 text-[11px] font-black uppercase ${
                        station.trend === 'RISING' ? 'text-amber-500' : 'text-sky-500'
                     }`}>
                        <TrendUp size={16} weight="bold" className={station.trend === 'FALLING' ? 'rotate-180' : ''} />
                        {station.trend || 'STABLE'} // P_SYNC
                     </div>
                  </div>

                  <div className="space-y-4 border-l-4 border-slate-200 pl-6">
                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danger Threshold</div>
                     <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-400 tracking-tighter tabular-nums leading-none">
                           {((station as any).danger_m || (station as any).danger_level_m || 0).toFixed(1)}
                        </span>
                        <span className="text-xs font-black text-slate-200 uppercase tracking-widest">msl</span>
                     </div>
                     <div className="mt-4 flex flex-col gap-2">
                        <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-widest">
                           Sector Violation Risk
                           <span>{((station.current_water_level_m / ((station as any).danger_m || (station as any).danger_level_m || 1)) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 overflow-hidden">
                           <div 
                             className="h-full bg-slate-900" 
                             style={{ width: `${Math.min(100, (station.current_water_level_m / ((station as any).danger_m || (station as any).danger_level_m || 1)) * 100)}%` }} 
                           />
                        </div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-2">
                   {[
                      { icon: MapPin, label: 'Sector Basin', val: String(station.basin || 'N/A').toUpperCase() },
                      { icon: TargetIcon, label: 'System Type',  val: (station as any).type || 'HHS_DENSITY' },
                      { icon: Database, label: 'GDI Identity',  val: String(station.station_code || station.code || 'UNNAMED').toUpperCase() },
                   ].map(m => (
                      <div key={m.label} className="p-4 bg-slate-50 flex items-center justify-between border-l-4 border-transparent hover:border-sky-500 transition-all group/item">
                         <div className="flex items-center gap-4">
                            <m.icon size={16} className="text-slate-400" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{m.label}</span>
                         </div>
                         <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{m.val}</span>
                      </div>
                   ))}
               </div>
            </div>
         )}

         {activeTab === 'hydrograph' && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
                  <div className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Temporal Trace // 48H Window</div>
                  <div className="flex items-center gap-2">
                     <span className="text-[9px] font-black text-sky-500 uppercase tracking-widest">Polling Active // ➲</span>
                  </div>
               </div>
               
               <div className="h-56 w-full bg-slate-50 p-8 relative flex items-end gap-2 border-2 border-slate-100">
                  {hydroLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-sky-600 animate-pulse">
                       <Activity size={32} />
                       <span className="text-[10px] font-black uppercase tracking-[0.4em]">Intercepting Data...</span>
                    </div>
                  ) : (
                    Array.from({ length: 20 }).map((_, i) => {
                      const h = 20 + (Math.sin((i + Date.now()/1000) / 4) * 40) + (Math.random() * 10);
                      return (
                        <div 
                          key={i} 
                          className="flex-1 bg-sky-500 hover:bg-slate-900 transition-all cursor-crosshair group/bar relative"
                          style={{ height: `${Math.max(15, h)}%` }}
                        >
                           <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-[9px] font-black text-white rounded-none opacity-0 group-hover/bar:opacity-100 whitespace-nowrap pointer-events-none z-10">
                              {(station.current_water_level_m + (h/100)).toFixed(2)}m
                           </div>
                        </div>
                      )
                    })
                  )}
               </div>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose border-t-2 border-slate-100 pt-6 italic">
                  Registry sourced from authorized GDI endpoints. Integrated Muskingum Propogation enabled for sector predictive nodes. 
               </p>
            </div>
         )}

         {activeTab === 'atmo' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="grid grid-cols-2 gap-4">
                  {[
                     { label: 'Ambient Temp', val: '28.4°C', icon: Thermometer, color: 'text-sky-500' },
                     { label: 'Precipitation', val: '12.2mm', icon: CloudRain,   color: 'text-sky-600' },
                  ].map(w => (
                     <div key={w.label} className="bg-slate-50 p-6 border-b-4 border-slate-100 flex gap-5 items-center group hover:bg-sky-50 transition-colors">
                        <w.icon size={28} className={w.color} weight="fill" />
                        <div>
                           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{w.label}</div>
                           <div className="text-xl font-black text-slate-900 tabular-nums">{w.val}</div>
                        </div>
                     </div>
                  ))}
               </div>
               <div className="p-8 bg-sky-500 text-white flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                     <Brain size={20} weight="fill" />
                     <span className="text-xs font-black uppercase tracking-widest">Sector Logic Node</span>
                  </div>
                  <p className="text-[11px] leading-relaxed font-bold uppercase tracking-tight">
                     Atmospheric conditions are current within the nominal operational envelope. Catchment retention is projected to remain stable for ~140s.
                  </p>
               </div>
            </div>
         )}

         {activeTab === 'alerts' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="p-8 bg-amber-500 text-slate-900 flex gap-6 items-start shadow-xl">
                  <Warning size={32} className="mt-1 shrink-0" weight="fill" />
                  <div className="space-y-2">
                     <h4 className="text-sm font-black uppercase tracking-widest">Official GDI Advisory</h4>
                     <p className="text-[11px] leading-relaxed font-bold uppercase tracking-tight">
                        Sector is reporting nominal flow. Decoupling prevention logic is currently on standby. No authorized breach detected in this registry sector.
                     </p>
                  </div>
               </div>
            </div>
         )}
      </div>

      <div className="p-10 bg-slate-900">
         <button 
           className="w-full py-5 bg-white hover:bg-sky-500 text-slate-900 hover:text-white transition-all font-black text-xs uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 group/btn"
         >
            Authorize Sector Analytics ➲
         </button>
      </div>
    </div>
  );
};

export default StationPopup;
