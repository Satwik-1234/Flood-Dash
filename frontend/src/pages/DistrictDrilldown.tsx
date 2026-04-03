import React, { useMemo } from 'react';
import { useIMDWarnings, useCWCStations } from '../hooks/useTelemetry';
import { useIntel } from '../context/IntelContext';
import { 
  Plus, Target, Warning, Drop, Activity, Gauge, 
  CloudRain, Stack as Layers, CaretDown, MapPin, Database, TrendUp, Waves
} from 'phosphor-react';

export const DistrictDrilldown: React.FC = () => {
  const { data: warnings = [] } = useIMDWarnings();
  const { data: stations = [] } = useCWCStations();
  
  // Intelligence State (Sync)
  const { selectedDistrict, setSelectedDistrict } = useIntel();

  // Dynamic District Discovery
  const allDistricts = useMemo(() => {
    const dSet = new Set<string>();
    stations.forEach(s => { if (s.district) dSet.add(s.district); });
    warnings.forEach(w => { if (w.district) dSet.add(w.district); });
    return Array.from(dSet).sort();
  }, [stations, warnings]);

  // Initial selection if none
  const currentDistrict = selectedDistrict || allDistricts[0] || 'Unknown';

  const districtWarnings = useMemo(() => 
    warnings.filter(w => w.district?.toLowerCase() === currentDistrict.toLowerCase()),
    [warnings, currentDistrict]
  );
  
  const districtStations = useMemo(() => 
    stations.filter(s => s.district?.toLowerCase() === currentDistrict.toLowerCase()),
    [stations, currentDistrict]
  );

  // Risk Scoring: Weighted average of station levels relative to danger
  const districtRisk = useMemo(() => {
    if (districtStations.length === 0) return 0;
    const totalRatio = districtStations.reduce((acc, s) => {
      const danger = (s as any).danger_m || (s as any).danger_level_m || 1;
      return acc + (s.current_water_level_m / danger);
    }, 0);
    return Math.min(100, (totalRatio / districtStations.length) * 100);
  }, [districtStations]);

  return (
    <div className="w-full h-full bg-[#020617] text-slate-300 overflow-y-auto font-sans selection:bg-sky-500/30">
      <div className="p-12 max-w-7xl mx-auto space-y-12">
        
        {/* ── HEADER & SECTOR SELECTION ───────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-white/5 pb-10 gap-8">
           <div className="space-y-4">
              <div className="flex items-center gap-4">
                 <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                    <Layers size={28} className="text-sky-400" weight="fill" />
                 </div>
                 <h2 className="text-4xl font-black text-white tracking-tighter uppercase">
                   District <span className="text-sky-500 font-light italic">Intelligence</span>
                 </h2>
              </div>
              <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase opacity-70 flex items-center gap-3">
                 Sector Node Analysis // <span className="text-emerald-500 animate-pulse">RT-Telemetry Active</span>
              </p>
           </div>

           <div className="relative w-full lg:w-80 group">
             <select 
               value={currentDistrict}
               onChange={(e) => setSelectedDistrict(e.target.value)}
               className="w-full appearance-none bg-[#0F172A] border border-white/10 rounded-2xl pl-6 pr-12 py-5 text-xs font-black text-white hover:border-sky-500/30 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all cursor-pointer shadow-2xl uppercase tracking-widest"
             >
               {allDistricts.map(d => <option key={d} value={d}>{d}</option>)}
             </select>
             <CaretDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-white transition-colors" weight="bold" />
           </div>
        </div>

        {/* ── KPI GRID ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-8 rounded-[32px] bg-white/2 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 group-hover:scale-110 transition-transform"><Waves size={120} weight="fill" /></div>
              <div className="flex items-center gap-3 mb-6">
                 <Drop size={20} className="text-sky-400" weight="fill" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aggregate Hydrologic Risk</span>
              </div>
              <div className="flex items-baseline gap-2">
                 <span className="text-5xl font-black text-white tracking-tighter tabular-nums">{districtRisk.toFixed(0)}%</span>
                 <span className={`text-[10px] font-black uppercase ${districtRisk > 80 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {districtRisk > 80 ? 'CRITICAL' : 'NOMINAL'}
                 </span>
              </div>
              <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]" style={{ width: `${districtRisk}%` }} />
              </div>
           </div>

           <div className="p-8 rounded-[32px] bg-white/2 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 group-hover:scale-110 transition-transform"><CloudRain size={120} weight="fill" /></div>
              <div className="flex items-center gap-3 mb-6">
                 <CloudRain size={20} className="text-amber-400" weight="fill" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Atmospheric Pressure</span>
              </div>
              <div className="flex items-baseline gap-2">
                 <span className="text-5xl font-black text-white tracking-tighter tabular-nums">{districtWarnings.length}</span>
                 <span className="text-[10px] font-black text-slate-600 uppercase">ACTIVE ADVISORIES</span>
              </div>
           </div>

           <div className="p-8 rounded-[32px] bg-white/2 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 group-hover:scale-110 transition-transform"><Activity size={120} weight="fill" /></div>
              <div className="flex items-center gap-3 mb-6">
                 <Activity size={20} className="text-emerald-400" weight="fill" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operational Nodes</span>
              </div>
              <div className="flex items-baseline gap-2">
                 <span className="text-5xl font-black text-white tracking-tighter tabular-nums">{districtStations.length}</span>
                 <span className="text-[10px] font-black text-emerald-500 uppercase">ONLINE</span>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
           
           {/* SECTION: METEO WARNINGS */}
           <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                 <Warning size={20} className="text-amber-500" />
                 <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Regional Meteorological Alerts</h3>
              </div>
              
              {districtWarnings.length === 0 ? (
                 <div className="p-10 rounded-3xl border border-dashed border-white/10 text-center flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-white/5 text-slate-600"><CloudRain size={32} /></div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">No precipitation warnings in active sector</p>
                 </div>
              ) : (
                <div className="space-y-4">
                   {districtWarnings.map((w, i) => (
                      <div key={i} className="p-6 rounded-[28px] bg-white/2 border border-white/5 hover:border-amber-500/30 transition-all flex items-start gap-6 group/item">
                         <div className={`w-3 h-3 rounded-full mt-1.5 animate-pulse ${w.severity === 'EXTREME' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                         <div className="flex-1">
                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{w.severity} SEVERITY</div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight leading-tight">{w.district} PRECIPITATION THREAD</h4>
                            <p className="text-[10px] text-slate-400 mt-2 font-medium leading-relaxed italic">Issued by IMD at {w.issued_at || 'Sync Window'}</p>
                         </div>
                         <div className="text-right">
                             <div className="text-2xl font-black text-white tabular-nums tracking-tighter">{w.rainfall_24h_mm?.toFixed(1)}</div>
                             <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">mm / 24h</div>
                         </div>
                      </div>
                   ))}
                </div>
              )}
           </div>

           {/* SECTION: STATION TELEMETRY MATRIX */}
           <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                 <Gauge size={20} className="text-sky-400" />
                 <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Hydrological Telemetry Grid</h3>
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                 {districtStations.length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl">
                       <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Scanning local catchment sensors...</p>
                    </div>
                 ) : (
                    districtStations.map(s => {
                       const danger = (s as any).danger_m || (s as any).danger_level_m || 100;
                       const ratio = s.current_water_level_m / danger;
                       const critical = ratio >= 1.0;
                       return (
                          <div key={s.id || s.code} className={`group p-5 rounded-[28px] bg-white/2 border border-white/5 hover:bg-white/5 transition-all flex items-center gap-6 ${critical ? 'ring-1 ring-rose-500/30 bg-rose-500/5' : ''}`}>
                             <div className={`w-1 h-10 rounded-full transition-all ${critical ? 'bg-rose-500 animate-pulse' : 'bg-sky-500 group-hover:h-12'}`} />
                             <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">{s.river} SYSTEM</span>
                                   <div className="w-1 h-1 rounded-full bg-white/10" />
                                   <span className="text-[8px] font-black text-slate-600 uppercase tracking-tight">{s.code}</span>
                                </div>
                                <h4 className={`text-xs font-black uppercase tracking-tight leading-none ${critical ? 'text-rose-400' : 'text-slate-100'}`}>
                                   {s.name || (s as any).station_name}
                                </h4>
                             </div>
                             <div className="text-right">
                                <div className={`text-xl font-black tabular-nums tracking-tighter ${critical ? 'text-rose-500' : 'text-white'}`}>
                                   {s.current_water_level_m?.toFixed(2)}m
                                </div>
                                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                   <TrendUp size={12} className={s.trend === 'FALLING' ? 'rotate-180 text-emerald-500' : 'text-rose-500'} weight="bold" />
                                   <span className={`text-[8px] font-black uppercase tracking-widest ${s.trend === 'FALLING' ? 'text-emerald-500' : 'text-rose-500'}`}>{s.trend || 'STABLE'}</span>
                                </div>
                             </div>
                          </div>
                       );
                    })
                 )}
              </div>
              
              <div className="p-6 rounded-3xl bg-white/2 border border-white/5 flex items-center gap-4 group hover:border-sky-500/20 transition-all">
                 <div className="p-2 rounded-lg bg-sky-500/5 text-slate-500 group-hover:text-sky-400 transition-colors">
                    <Database size={16} />
                 </div>
                 <p className="text-[9px] text-slate-500 leading-relaxed font-medium uppercase tracking-tight">
                    Telemetry for this sector is derived from 24/7 automated scraping of CWC and IMD public REST endpoints. Sub-minute latency achieved via parallel processing.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DistrictDrilldown;
