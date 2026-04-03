import React from 'react';
import { 
  Globe, Activity, ChartBar, Database, TrendUp, Info, WarningCircle
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

  // Logic: Filter stations above warning/danger from the full catalog for the live feed
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
  ].slice(0, 12);

  return (
    <div className="w-full h-full bg-[#0F172A] text-slate-300 overflow-y-auto font-sans selection:bg-sky-500/30">
      <div className="p-8">
        {/* ── INDUSTRIAL HEADER ────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/5 pb-8 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center p-3 shadow-2xl shadow-sky-500/20">
               <Globe size={32} weight="fill" className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-black tracking-tighter text-white uppercase leading-none">
                  PRAVHATATTVA <span className="text-sky-500 font-light underline decoration-indigo-500/30">INTELLIGENCE</span>
                </h1>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </div>
              <p className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase opacity-80">
                National Hydrometric Command Subsystem // Core Version 5.7.0 (Senior-Industrial)
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
              <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">System Entropy</span>
              <div className="flex items-center gap-4">
                <span className="text-white font-mono text-sm uppercase">STABLE // 1.2MS</span>
                <Activity size={12} className="text-emerald-400" />
              </div>
            </div>
            <Link to="/map" className="bg-sky-500 p-4 rounded-xl shadow-xl shadow-sky-500/20 group cursor-pointer hover:scale-105 transition-transform">
               <TrendUp size={24} weight="bold" className="text-white group-hover:rotate-45 transition-transform" />
            </Link>
          </div>
        </div>

        {/* ── KPI MATRIX ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Hydrological Violations', val: totalAlerts, sub: 'CRITICAL THRESHOLD', color: 'text-red-500', bg: 'bg-red-500/10' },
            { label: 'Active Gauge Nodes', val: activeStations, sub: 'PROVISIONED SENSORS', color: 'text-sky-400', bg: 'bg-sky-400/10' },
            { label: 'Delta Storage (High)', val: criticalReservoirs, sub: 'VOLUMETRIC SPIKE', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Meteo Warnings', val: imdWarnings.length, sub: 'DISTRICT ADVISORIES', color: 'text-amber-400', bg: 'bg-amber-400/10' },
          ].map((kpi, idx) => (
            <div key={idx} className={`relative overflow-hidden group p-6 rounded-2xl border border-white/5 transition-all hover:bg-white/[0.03] ${kpi.bg}`}>
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">{kpi.label}</span>
                <Activity size={16} className={kpi.color} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-black tracking-tighter ${kpi.color}`}>{String(kpi.val).padStart(2, '0')}</span>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{kpi.sub}</span>
              </div>
              <div className="absolute -bottom-4 -right-4 text-white/5 rotate-12 transition-transform group-hover:scale-110">
                 <ChartBar size={120} weight="fill" />
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN ANALYTICS GRID ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-20">
          
          {/* LEFT: LIVE COMMAND FEED */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity size={20} className="text-sky-500" />
                <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Real-Time Telemetry Feed</h2>
              </div>
              <div className="h-[1px] flex-1 bg-white/5 mx-6" />
              <Link to="/alerts" className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase">Full Log Archive //</Link>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {liveFeed.length === 0 ? (
                <div className="p-20 border border-dashed border-white/10 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">Zero Hydrological Violations Detected in Current Sector</p>
                </div>
              ) : (
                liveFeed.map((f, i) => (
                  <div key={i} className="group flex items-center gap-6 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-sky-500/30 hover:bg-white/[0.08] transition-all cursor-pointer">
                    <div className={`w-2 h-10 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${f.level >= 5 ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">{f.district}</span>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[9px] font-black text-sky-500/70 uppercase tracking-widest leading-none">{f.basin}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white tracking-tight uppercase">{f.msg}</h4>
                    </div>
                    <div className="text-right">
                      <span className="block text-xl font-black text-white leading-none mb-1">{f.val}</span>
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{f.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: SYSTEM KERNEL DENSITY */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
               <Database size={20} className="text-indigo-400" />
               <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Kernel Pulse</h2>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col h-[500px]">
               <div className="flex-1 overflow-y-auto space-y-4 font-mono scrollbar-hide pb-6">
                  <div className="text-[10px] text-slate-600 flex gap-4">
                    <span>[00:00:01]</span>
                    <span className="text-sky-500">INIT // PRAVHATATTVA_KERNEL_BOOT</span>
                  </div>
                  <div className="text-[10px] text-slate-600 flex gap-4">
                    <span>[{new Date().toLocaleTimeString('en-GB')}]</span>
                    <span className="text-emerald-500">PARITY // CWC_FFS: OK ({stations.length} NODES)</span>
                  </div>
                  <div className="text-[10px] text-slate-600 flex gap-4">
                    <span>[{new Date().toLocaleTimeString('en-GB')}]</span>
                    <span className="text-amber-500">SYNC // IMD_MAUSAM: {imdWarnings.length} DISTRICTS ALERT</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-4 leading-relaxed opacity-60">
                     {`> CLUSTER_ENGINE: MapLibreGL_PRO_v4\n> MEMORY_ADDR: 0xFD42_SYNC\n> BUFFER_LOAD: 12%\n> SECTOR_WATCH: ALL_INDIA`}
                  </div>
                  <div className="h-10 border-l border-white/5 ml-4 flex items-center">
                     <div className="w-2 h-2 rounded-full bg-sky-500 animate-ping ml-[-4px]" />
                  </div>
               </div>

               <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">Pipeline Performance</span>
                    <span className="text-emerald-500">Optimal (98%)</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                     <div className="bg-sky-500 h-full w-[98%] shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                  </div>
                  <button className="w-full py-4 text-[10px] font-black text-white uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-xl shadow-indigo-500/20 active:scale-95">
                    Decouple Subsystems //
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>

      <DatasetIntelligence />
    </div>
  );
};

export default Overview;
