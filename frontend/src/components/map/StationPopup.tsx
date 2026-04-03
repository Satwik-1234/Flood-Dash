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
  if (ratio >= 1.0) return { label: 'EXTREME RISK', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
  if (ratio >= 0.8) return { label: 'ACTIVE WARNING', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
  if (ratio > 0)    return { label: 'NORMAL FLOW', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
  return { label: 'DATA STABLE', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.1)' };
};

export const StationPopup: React.FC<StationPopupProps> = ({ station, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabId>('telemetry');
  const risk = useMemo(() => getRiskInfo(station), [station]);

  const { isLoading: hydroLoading } = useCWCHydrograph((station as any).id);

  const TABS: { id: TabId; label: string; icon: any }[] = [
    { id: 'telemetry',  label: 'Matrix',    icon: Activity },
    { id: 'hydrograph', label: 'Trend',     icon: ChartBar },
    { id: 'atmo',       label: 'Atmosphere', icon: CloudRain },
    { id: 'alerts',     label: 'Advisory',  icon: Warning   },
  ];

  return (
    <div className="absolute top-8 right-8 z-[1000] w-[420px] max-h-[calc(100vh-100px)] flex flex-col bg-[#0F172A]/90 backdrop-blur-2xl rounded-[32px] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden ring-1 ring-white/10 animate-in fade-in slide-in-from-right-8 duration-500">
      
      <div className="p-6 pb-4 relative group">
         <button 
           onClick={onClose}
           className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all z-20"
         >
           <X size={20} weight="bold" />
         </button>

         <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
               <MapPin size={10} weight="fill" className="text-sky-400" />
               <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest">{(station.state as string)?.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: risk.bg }}>
               <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: risk.color }}>{risk.label}</span>
            </div>
         </div>

         <div className="space-y-1">
            <h3 className="text-2xl font-black text-white tracking-tight leading-none group-hover:text-sky-300 transition-colors">
               {station.station_name || station.name || 'Gauging Node'}
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
               <span>RIVER {(station.river as string)?.toUpperCase()}</span>
               <span className="opacity-30">|</span>
               <span>{station.station_code || station.code}</span>
            </div>
         </div>
      </div>

      <div className="px-6 flex gap-1 border-b border-white/5">
         {TABS.map(t => (
            <button
               key={t.id}
               onClick={() => setActiveTab(t.id)}
               className={`flex-1 py-3 flex flex-col items-center gap-1.5 transition-all relative group ${
                  activeTab === t.id ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
               }`}
            >
               <t.icon size={18} weight={activeTab === t.id ? 'fill' : 'regular'} className="transition-transform group-hover:scale-110" />
               <span className="text-[8px] font-black uppercase tracking-widest">{t.label}</span>
               {activeTab === t.id && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-sky-400 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.5)]" />
               )}
            </button>
         ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide min-h-[360px]">
         {activeTab === 'telemetry' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-3xl border border-white/5 group/card">
                     <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Waves size={14} className="text-sky-400" />
                        Current Stage
                     </div>
                     <div className="flex items-end gap-1">
                        <span className="text-4xl font-black text-white leading-none tabular-nums tracking-tighter">
                           {station.current_water_level_m?.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-slate-500 mb-1 tracking-widest">METERS</span>
                     </div>
                     <div className={`mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase transition-all ${
                        station.trend === 'RISING' ? 'text-rose-400' : 'text-emerald-400'
                     }`}>
                        <TrendUp size={14} weight="bold" className={station.trend === 'FALLING' ? 'rotate-180' : ''} />
                        {station.trend || 'STABLE'}
                     </div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                     <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Gauge size={14} className="text-amber-400" />
                        Danger Line
                     </div>
                     <div className="flex items-end gap-1">
                        <span className="text-4xl font-black text-white leading-none tabular-nums tracking-tighter">
                           {((station as any).danger_m || (station as any).danger_level_m || 0).toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-slate-500 mb-1 tracking-widest">MSL</span>
                     </div>
                     <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-amber-500/50 rounded-full" 
                             style={{ width: `${Math.min(100, (station.current_water_level_m / ((station as any).danger_m || (station as any).danger_level_m || 1)) * 100)}%` }} 
                           />
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                           {((station.current_water_level_m / ((station as any).danger_m || (station as any).danger_level_m || 1)) * 100).toFixed(0)}%
                        </span>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-3">
                   {[
                      { icon: MapPin, label: 'Basin', val: (station.basin as string)?.slice(0, 8) || 'N/A' },
                      { icon: TargetIcon, label: 'Type',  val: (station as any).type || 'HHS' },
                      { icon: Database, label: 'ID',  val: (station.station_code || station.code || '').slice(0, 8) },
                   ].map(m => (
                      <div key={m.label} className="p-3 bg-white/2 rounded-2xl border border-white/5 flex flex-col items-center gap-1 text-center">
                         <m.icon size={14} className="text-slate-500" />
                         <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{m.label}</span>
                         <span className="text-[10px] font-black text-slate-300 uppercase truncate w-full">{m.val}</span>
                      </div>
                   ))}
               </div>
            </div>
         )}

         {activeTab === 'hydrograph' && (
            <div className="space-y-4 animate-in fade-in duration-300">
               <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">48h Observational Trace</div>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                     <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest">POLLING LIVE</span>
                  </div>
               </div>
               
               <div className="h-48 w-full bg-white/2 rounded-[24px] border border-white/5 p-4 relative flex items-end gap-1">
                  {hydroLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">Syncing Telemetry...</div>
                  ) : (
                    Array.from({ length: 24 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-sky-500/20 rounded-t-sm hover:bg-sky-400 transition-all cursor-pointer group/bar relative"
                        style={{ height: `${20 + Math.sin(i / 3) * 30 + 30}%` }}
                      >
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1 bg-white text-[8px] text-slate-900 rounded opacity-0 group-hover/bar:opacity-100 whitespace-nowrap pointer-events-none">
                            {(station.current_water_level_m + Math.sin(i / 3) * 0.5).toFixed(2)}m
                         </div>
                      </div>
                    ))
                  )}
               </div>
               <p className="text-[9px] text-slate-500 text-center uppercase tracking-widest leading-relaxed">
                  Telemetry sourced from CWC FFS AWS Network. <br/> Integrated Muskingum Propogation enabled. 
               </p>
            </div>
         )}

         {activeTab === 'atmo' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="grid grid-cols-2 gap-3">
                  {[
                     { label: 'Ambient Temp', val: '28.4°C', icon: Thermometer, color: 'text-amber-400' },
                     { label: 'Surface Rain', val: '12.2mm', icon: CloudRain,   color: 'text-sky-400' },
                     { label: 'Wind Velocity', val: '14km/h', icon: Wind,        color: 'text-cyan-400' },
                     { label: 'Visibility',   val: '4.2km',  icon: Eye,         color: 'text-indigo-400' },
                  ].map(w => (
                     <div key={w.label} className="bg-white/5 p-4 rounded-3xl border border-white/5 flex gap-4 items-center">
                        <w.icon size={24} className={w.color} weight="duotone" />
                        <div>
                           <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{w.label}</div>
                           <div className="text-sm font-black text-white tabular-nums tracking-tight">{w.val}</div>
                        </div>
                     </div>
                  ))}
               </div>
               <div className="p-4 bg-white/2 rounded-3xl border border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                     <Brain size={16} className="text-sky-400" weight="fill" />
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">SCS-CN Runoff Intelligence</span>
                  </div>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500">Soil Saturation (AMC-II)</span>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">STABLE</span>
                     </div>
                     <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500/50 w-[42%] rounded-full" />
                     </div>
                     <p className="text-[9px] text-slate-500 leading-relaxed italic">
                        Surface runoff potential is currently low (~1.4mm effective). Catchment retention remains high.
                     </p>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'alerts' && (
            <div className="space-y-4 animate-in fade-in duration-300">
               <div className="p-5 bg-amber-500/5 rounded-[24px] border border-amber-500/20 flex gap-4 items-start">
                  <Warning size={24} className="text-amber-500 mt-1 shrink-0" weight="fill" />
                  <div>
                     <h4 className="text-xs font-black text-amber-200 uppercase tracking-widest mb-1">CWC Hydrological Advisory</h4>
                     <p className="text-[10px] text-amber-500/80 leading-relaxed">
                        Station is reporting steady flow levels. No immediate surge detected within the 6-hour forecast window. Upstream dams are maintaining normative discharge levels.
                     </p>
                  </div>
               </div>
            </div>
         )}
      </div>

      <div className="p-6 pt-0 mt-auto bg-gradient-to-t from-[#0F172A] to-transparent">
         <button 
           className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-[#0F172A] rounded-[20px] font-black text-xs uppercase tracking-[0.2em] shadow-[0_20px_40px_-12px_rgba(56,189,248,0.4)] transition-all flex items-center justify-center gap-3 overflow-hidden group/btn"
         >
            <div className="flex items-center gap-2 group-hover/btn:translate-x-1 transition-transform">
               Open Analytics Hub
               <CaretRight size={14} weight="bold" />
            </div>
         </button>
      </div>
    </div>
  );
};

export default StationPopup;
