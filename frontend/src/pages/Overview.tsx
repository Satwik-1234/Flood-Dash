import React from 'react';
import { 
  Globe, Activity, ChartBar, Database, TrendUp, WarningCircle, ShieldCheck, 
  Skull, Warning, Broadcast, Timer
} from 'phosphor-react';
import { Link } from 'react-router-dom';
import { DatasetIntelligence } from '../components/intelligence/DatasetIntelligence';
import { useCWCStations, useIMDWarnings, useCWCInflowStations } from '../hooks/useTelemetry';

function timeAgo(isoStr?: string): string {
  if (!isoStr) return '–';
  const mins = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
  if (mins < 60)  return `${mins}M AGO`;
  if (mins < 1440) return `${Math.floor(mins / 60)}H AGO`;
  return `${Math.floor(mins / 1440)}D AGO`;
}

export const Overview: React.FC = () => {
  const { data: stations = [] } = useCWCStations();
  const { data: imdWarnings = [] } = useIMDWarnings();
  const { data: cwcInflow  = [] } = useCWCInflowStations();

  const stationsAboveWarning = stations.filter(s => (s as any).warning_m > 0 && s.current_water_level_m >= (s as any).warning_m);
  const stationsAboveDanger = stations.filter(s => (s as any).danger_m > 0 && s.current_water_level_m >= (s as any).danger_m);

  const totalAlerts         = stationsAboveDanger.length + stationsAboveWarning.length;
  const activeStations      = stations.length;
  const criticalReservoirs  = cwcInflow.filter(s => (s.fill_pct ?? 0) > 85).length;

  const liveFeed = [
    ...stationsAboveDanger.map((s: any) => ({
      id: s.code, district: s.district || s.state, basin: s.river, level: 5, msg: `HYD_CRITICAL: ${s.name} VIOLATION`,
      val: `${s.current_water_level_m}m`, time: timeAgo(s.last_poll)
    })),
    ...stationsAboveWarning.slice(0, 10).map((s: any) => ({
      id: s.code, district: s.district || s.state, basin: s.river, level: 3, msg: `HYD_WARNING: ${s.name} OBSERVED`,
      val: `${s.current_water_level_m}m`, time: timeAgo(s.last_poll)
    })),
  ].slice(0, 8);

  return (
    <div className="w-full h-full bg-[#F8FAFC] text-slate-800 overflow-y-auto font-sans selection:bg-sky-500/30">
      <div className="p-10 max-w-[1600px] mx-auto">
        
        {/* ── AUTHORITARIAN HEADER ────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 border-b-4 border-sky-500 pb-10 gap-8">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-sky-500 flex items-center justify-center p-4 shadow-2xl">
               <ShieldCheck size={48} weight="fill" className="text-white" />
            </div>
            <div>
              <h1 className="text-6xl font-black tracking-tighter text-slate-900 uppercase leading-none">
                NATIONAL <span className="text-sky-500 underline decoration-8 decoration-sky-500/20">FLOOD MONITOR</span>
              </h1>
              <p className="text-[12px] font-black text-slate-500 tracking-[0.5em] uppercase mt-4 opacity-70 flex items-center gap-3">
                 <Broadcast size={16} className="text-sky-500" /> Authorized Intelligence Node // Station Registry Active
              </p>
            </div>
          </div>

          <div className="flex gap-4 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none border-2 border-slate-900 bg-white px-6 py-4 flex flex-col justify-center">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sector Latency</span>
               <div className="flex items-center gap-3">
                  <span className="text-xl font-black text-slate-900 tabular-nums">1.2ms</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               </div>
            </div>
            <Link to="/map" className="flex items-center justify-center bg-slate-900 text-white px-8 py-4 hover:bg-sky-600 transition-all font-black text-xs uppercase tracking-widest shadow-xl">
               Live Theatre // ➲
            </Link>
          </div>
        </div>

        {/* ── KPI MATRIX ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-4 border-slate-900 mb-16 bg-white">
          {[
            { label: 'System Violations', val: totalAlerts, icon: Warning, color: 'text-amber-500', bg: 'bg-white' },
            { label: 'Gauge Parity', val: activeStations, icon: Broadcast, color: 'text-sky-500', bg: 'bg-white' },
            { label: 'Volumetric Spikes', val: criticalReservoirs, icon: ChartBar, color: 'text-slate-900', bg: 'bg-white' },
            { label: 'State Advisories', val: imdWarnings.length, icon: Database, color: 'text-sky-600', bg: 'bg-white' },
          ].map((kpi, idx) => (
            <div key={idx} className={`p-8 border-r-2 last:border-r-0 border-slate-100 flex flex-col group hover:bg-slate-50 transition-colors`}>
              <div className="flex justify-between items-center mb-10">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{kpi.label}</span>
                <kpi.icon size={20} className={kpi.color} weight="fill" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-6xl font-black tracking-tighter tabular-nums ${kpi.color}`}>
                  {String(kpi.val).padStart(2, '0')}
                </span>
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Global P_ID</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── COMMAND PANELS ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* LEFT: TELEMETRY TRACE */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-4 border-l-8 border-sky-500 pl-6">
              <Activity size={24} className="text-sky-500" />
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Unified Telemetry Feed</h2>
            </div>

            <div className="grid grid-cols-1 gap-1">
              {liveFeed.length === 0 ? (
                <div className="p-20 bg-white border-2 border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Zero anomalous detections within current observational window</p>
                </div>
              ) : (
                liveFeed.map((f, i) => (
                  <div key={i} className="flex items-center gap-6 p-6 bg-white border-b-2 border-slate-100 hover:bg-sky-50 transition-colors cursor-pointer group">
                    <div className={`w-3 h-3 rounded-full ${f.level >= 5 ? 'bg-amber-500' : 'bg-sky-500'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{f.district}</span>
                        <Timer size={12} className="text-slate-300" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{f.time}</span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter group-hover:text-sky-600 transition-colors">{f.msg}</h4>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-2xl font-black text-slate-900 tracking-tighter">{f.val}</span>
                      <span className="text-[9px] font-black text-sky-500 uppercase tracking-widest">{f.basin} SYSTEM</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: KERNEL INTEGRITY */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 border-l-8 border-amber-500 pl-6">
               <Skull size={24} className="text-amber-500" />
               <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">System Kernel</h2>
            </div>

            <div className="bg-slate-900 text-slate-400 p-8 shadow-2xl relative overflow-hidden group">
               <div className="font-mono text-[11px] space-y-3 relative z-10">
                  <div className="text-emerald-400 flex justify-between">
                     <span>BOOT // PRAVHATATTVA_V5.7</span>
                     <span>[OK]</span>
                  </div>
                  <div className="flex justify-between">
                     <span>STATION_HOOKS_SYNC:</span>
                     <span className="text-white font-black">{stations.length}</span>
                  </div>
                  <div className="flex justify-between">
                     <span>METEO_VULNERABILITY:</span>
                     <span className="text-amber-500 font-black">{imdWarnings.length} DISTRICTS</span>
                  </div>
                  <div className="pt-6 border-t border-white/10 opacity-40">
                     {`> HEURISTIC_WATCH_ACTIVE\n> GDI_PIPELINE: NOMINAL\n> CLUSTER_RAD: 40px`}
                  </div>
               </div>
               {/* Scan Line Animation */}
               <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 to-transparent h-20 animate-pulse pointer-events-none" />
               
               <div className="mt-10 flex flex-col gap-4">
                  <div className="flex justify-between text-[10px] uppercase font-black tracking-widest">
                     <span>Registry Integrity</span>
                     <span className="text-sky-500">99.8%</span>
                  </div>
                  <div className="h-1 w-full bg-white/10 overflow-hidden">
                     <div className="h-full bg-sky-500 w-[99%]" />
                  </div>
               </div>
            </div>

            <div className="p-8 bg-sky-50 border-2 border-sky-100 flex flex-col gap-4">
               <WarningCircle size={24} className="text-sky-500" weight="fill" />
               <p className="text-[12px] font-bold text-sky-900 leading-relaxed uppercase tracking-tight">
                  This command subsystem is authorized for national hydrological surveillance only. 
                  Tampering with sensor parity will trigger a GDI decoupling event.
               </p>
            </div>
          </div>

        </div>
      </div>

      <DatasetIntelligence />
    </div>
  );
};

export default Overview;
