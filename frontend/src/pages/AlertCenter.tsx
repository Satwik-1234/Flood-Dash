import React, { useState } from 'react';
import { useIMDWarnings } from '../hooks/useTelemetry';
import { WarningOctagon, MagnifyingGlass, Funnel, CloudRain, Warning, Circle, Target, Activity, Clock } from 'phosphor-react';
import { IMDWarningData } from '../api/schemas';

const getSeverityTheme = (severity: string) => {
  switch(severity) {
    case 'EXTREME': return { bg: 'bg-red-950', text: 'text-red-500', border: 'border-red-900', level: 'LVL_5', accent: 'bg-red-500' };
    case 'SEVERE': return { bg: 'bg-red-900/20', text: 'text-red-600', border: 'border-red-200', level: 'LVL_4', accent: 'bg-red-600' };
    case 'MODERATE': return { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-200', level: 'LVL_3', accent: 'bg-amber-500' };
    case 'WATCH': return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', level: 'LVL_2', accent: 'bg-slate-400' };
    default: return { bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-200', level: 'LVL_1', accent: 'bg-slate-300' };
  }
};

export const AlertCenter: React.FC = () => {
  const { data: warnings, isLoading, isError } = useIMDWarnings();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center bg-slate-900 border border-slate-800">
        <Activity className="w-12 h-12 animate-spin text-emerald-500 mb-6" />
        <p className="font-data text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Mausam_Sync: Decrypting</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center bg-slate-900 text-red-500 border border-slate-800 p-8 text-center">
        <Warning className="w-16 h-16 mb-6 animate-pulse" />
        <h3 className="font-display font-black text-2xl uppercase tracking-tighter">Meteo_Sync_Offline</h3>
        <p className="font-data text-xs mt-4 max-w-md text-slate-400 uppercase leading-relaxed">Network boundary error. Unable to ingest IMD warnings at this time.</p>
      </div>
    );
  }

  const filteredWarnings = warnings?.filter(w => {
    const matchesSearch = w.district.toLowerCase().includes(searchTerm.toLowerCase()) || w.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'ALL' || w.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  }) || [];

  return (
    <div className="w-full h-full flex flex-col bg-[#F8F9FA] overflow-hidden">
      
      {/* ── INDUSTRIAL HEADER ──────────────────────────────────────────────── */}
      <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-300 gap-4 bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-2 rounded">
             <WarningOctagon size={24} className="text-red-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="font-display text-slate-900 text-2xl font-black tracking-tighter uppercase leading-none">
                METEO-SYNC <span className="font-light text-slate-400">/ ALERTS</span>
              </h1>
              <div className="bg-red-500/10 text-red-600 px-1.5 py-0.5 rounded text-[9px] font-black font-data uppercase border border-red-500/20">
                CRITICAL_MONITOR
              </div>
            </div>
            <p className="font-data text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              REGIONAL METEOROLOGICAL ADVISORIES • FLASH_FLOOD_PROJECTIONS
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input 
              type="text" 
              placeholder="FILTER_BY_NODE..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded font-data text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-slate-900 w-56 transition-all"
            />
          </div>
          <div className="relative">
             <Funnel className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
             <select 
               value={filterSeverity}
               onChange={(e) => setFilterSeverity(e.target.value)}
               className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded font-data text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-slate-900 appearance-none transition-all"
             >
               <option value="ALL">ALL_RISKS</option>
               <option value="EXTREME">LVL_5_FATAL</option>
               <option value="SEVERE">LVL_4_CRITICAL</option>
               <option value="MODERATE">LVL_3_WARN</option>
               <option value="WATCH">LVL_2_WATCH</option>
             </select>
          </div>
        </div>
      </div>

      {/* ── TECHNICAL CONTENT ──────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 p-6 flex flex-col space-y-6 overflow-y-auto">
        
        {/* Risk Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['EXTREME', 'SEVERE', 'MODERATE', 'WATCH'].map(sev => {
            const count = warnings?.filter(w => w.severity === sev).length || 0;
            const theme = getSeverityTheme(sev);
            return (
              <div key={sev} className="bg-white border border-slate-200 p-4 rounded shadow-sm flex items-center justify-between group hover:border-slate-800 transition-colors">
                <div>
                  <p className="font-data text-[9px] font-black text-slate-400 uppercase tracking-tighter">{sev}_VEC</p>
                  <p className={`font-display text-4xl font-black mt-1 ${count > 0 ? theme.text : 'text-slate-200'}`}>
                    {String(count).padStart(2, '0')}
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-sm ${theme.bg} border ${theme.border} flex items-center justify-center`}>
                   <div className={`w-2 h-2 rounded-full ${theme.accent} ${count > 0 ? 'animate-pulse' : 'opacity-20'}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Alert Log */}
        <div className="flex-1 bg-white border border-slate-300 rounded shadow-xl overflow-hidden flex flex-col min-h-[400px]">
          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center shrink-0">
             <div className="flex items-center gap-2">
                <Target size={14} className="text-white" />
                <span className="font-data text-[10px] font-black text-white uppercase tracking-[0.2em]">Risk_Exclusion_Registry</span>
             </div>
             <span className="font-data text-[9px] font-black text-slate-500 uppercase">Buffer: {filteredWarnings.length} Entries</span>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 border-b border-slate-200 font-data text-[9px] font-black text-slate-500 uppercase tracking-widest tabular-nums">
                <tr>
                  <th className="p-4 w-24 border-r border-slate-200">LVL_ID</th>
                  <th className="p-4 w-40 border-r border-slate-200">SEVERITY_CLASS</th>
                  <th className="p-4 w-48 border-r border-slate-200">TARGET_NODE</th>
                  <th className="p-4">MET_CONTEXT // OBSERVATION</th>
                  <th className="p-4 w-32 border-r border-slate-200">ISSUED_AT</th>
                  <th className="p-4 w-24">TELEMETRY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-data text-xs text-slate-700">
                {filteredWarnings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-slate-300 font-black uppercase tracking-[0.4em]">
                       NO_ACTIVE_VIOLATION_REGISTERED
                    </td>
                  </tr>
                ) : (
                  filteredWarnings.map((warning: IMDWarningData) => {
                    const theme = getSeverityTheme(warning.severity);
                    return (
                      <tr key={warning.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 border-r border-slate-100">
                          <div className={`px-2 py-1 rounded-sm text-[10px] font-black whitespace-nowrap text-center border ${theme.bg} ${theme.text} ${theme.border}`}>
                            {theme.level}
                          </div>
                        </td>
                        <td className="p-4 font-black border-r border-slate-100 tracking-tighter">
                          <span className={`${theme.text}`}>{warning.severity}</span>
                        </td>
                        <td className="p-4 font-black text-slate-900 border-r border-slate-100 uppercase tracking-tight">{warning.district}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <CloudRain className="w-4 h-4 text-slate-400" />
                            <span className="font-ui text-[11px] font-medium leading-tight">
                               Recorded <span className="font-black text-slate-900 underline decoration-slate-200 underline-offset-2">{warning.rainfall_24h_mm}MM</span> / 24H PRECIPITATION. IMPACT RISK: HIGH.
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-black text-[10px] text-slate-400 border-r border-slate-100 tabular-nums">
                          {warning.issued_at}
                        </td>
                        <td className="p-4">
                          {warning.is_stale ? (
                            <div className="flex items-center gap-1.5 opacity-40">
                               <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                               <span className="text-[9px] font-black uppercase">BUFFER</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                               <span className="text-[9px] font-black uppercase text-emerald-600">LIVE_LINK</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shadow-inner">
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-red-600" />
                   <span className="font-data text-[9px] font-black text-slate-400 uppercase">Level_5_Extreme</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-orange-500" />
                   <span className="font-data text-[9px] font-black text-slate-400 uppercase">Level_3_Warn</span>
                </div>
             </div>
             <p className="font-data text-[9px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
               <Clock size={12} /> Sync_Interval: 15_Minutes // CWC-IMD-Mausam-Grid
             </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AlertCenter;
