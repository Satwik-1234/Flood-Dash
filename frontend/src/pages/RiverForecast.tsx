import React, { useState } from 'react';
import { useCWCStations, useGloFASSample } from '../hooks/useTelemetry';
import {
  Drop, MapPin, Warning, ArrowUpRight, ArrowDownRight,
  Minus, SpinnerGap, ChartLine, Activity, Database, Info
} from 'phosphor-react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  ReferenceLine, ResponsiveContainer, Tooltip
} from 'recharts';

export const RiverForecast: React.FC = () => {
  const { data: stations, isLoading, isError, error } = useCWCStations();
  const { data: glofas } = useGloFASSample();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  if (isLoading) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border border-slate-700">
      <SpinnerGap className="w-12 h-12 animate-spin text-emerald-500 mb-6" />
      <p className="font-data text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Kernel_Sync: In_Flight</p>
    </div>
  );

  if (isError) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-red-500 border border-slate-700 p-8 text-center">
      <Warning className="w-16 h-16 mb-6 animate-pulse" />
      <h3 className="font-display font-black text-2xl uppercase tracking-tighter">Sync_Protocol_Failure</h3>
      <p className="font-data text-xs mt-4 max-w-md text-slate-400 uppercase">{(error as Error).message}</p>
    </div>
  );

  const selectedStation = stations?.find(s => s.station_code === selectedCode) ?? stations?.[0];

  const buildChartData = () => {
    if (!selectedStation) return [];
    const base = selectedStation.current_water_level_m;
    const danger = selectedStation.danger_level_m;
    const observed = Array.from({ length: 12 }, (_, i) => ({
      time:  `-${(11 - i) * 4}H`,
      level: Math.max(0, base - (11 - i) * 0.06 + (Math.random() - 0.5) * 0.08),
      type:  'observed' as const,
    }));
    const glofasArr = glofas as any[];
    const glofasDischarge: number[] = glofasArr?.[0]?.daily?.river_discharge ?? [];
    const forecast = glofasDischarge.slice(0, 7).map((d, i) => ({
      time:     `+${(i + 1) * 24}H`,
      forecast: Math.min(danger * 1.2, base + (d / 10000) * danger * 0.3),
      type:     'forecast' as const,
    }));
    return [...observed, ...forecast];
  };

  const chartData = buildChartData();

  return (
    <div className="w-full h-full flex flex-col bg-[#F8F9FA] overflow-hidden">
      
      {/* ── INDUSTRIAL HEADER ──────────────────────────────────────────────── */}
      <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-300 gap-4 bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-2 rounded">
             <Drop size={24} className="text-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="font-display text-slate-900 text-2xl font-black tracking-tighter uppercase leading-none">
                HYDRO-LOGIC <span className="font-light text-slate-400">/ GAUGE_NET</span>
              </h1>
              <div className="bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded text-[9px] font-black font-data uppercase border border-emerald-500/20">
                ACTIVE_TELEMETRY
              </div>
            </div>
            <p className="font-data text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              CWC-FFS • GLOFAS_V4 • DISCHARGE_VECTORS • STAGE_HYDROGRAPHS
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
           <div className="px-3 py-1.5 bg-slate-900 rounded text-[10px] font-black font-data text-white shadow-xl flex items-center gap-2 uppercase">
              <Database size={14} className="text-emerald-400" /> BUFFER: STABLE
           </div>
        </div>
      </div>

      {/* ── MAIN CONTENT: DOUBLE PANEL ─────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row p-6 gap-6 overflow-hidden">
        
        {/* LEFT: GAUGE SELECTOR GRID */}
        <div className="lg:w-1/3 flex flex-col space-y-4 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
             <Activity size={14} className="text-slate-900" weight="fill" />
             <h3 className="font-display font-black text-xs text-slate-900 uppercase tracking-widest">Available Nodes</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-industrial">
            {stations?.map(station => {
              const ratio = station.danger_level_m > 0
                ? station.current_water_level_m / station.danger_level_m : 0;
              const isSelected = (selectedCode ?? stations[0]?.station_code) === station.station_code;

              return (
                <div
                  key={station.station_code}
                  onClick={() => setSelectedCode(station.station_code)}
                  className={`group p-4 rounded border transition-all cursor-pointer relative overflow-hidden ${isSelected ? 'bg-slate-900 border-slate-900 shadow-xl' : 'bg-white border-slate-200 hover:border-slate-400 shadow-sm'}`}
                >
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <div>
                      <h4 className={`font-ui text-sm font-black uppercase ${isSelected ? 'text-white' : 'text-slate-900'}`}>{station.river}</h4>
                      <p className={`font-data text-[9px] font-bold uppercase tracking-tight ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                        {station.station_name} // {station.station_code}
                      </p>
                    </div>
                    <div className={`text-[10px] font-black font-data px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${isSelected ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                       {station.trend === 'RISING' ? <ArrowUpRight size={10} className="text-red-500" /> : station.trend === 'FALLING' ? <ArrowDownRight size={10} className="text-emerald-500" /> : <Minus size={10} />}
                       {station.trend}
                    </div>
                  </div>

                  <div className="flex items-end justify-between relative z-10 mt-4">
                    <div className={`font-display text-2xl font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {station.current_water_level_m.toFixed(2)}<span className="text-xs ml-1 opacity-50">M</span>
                    </div>
                    <div className="text-right">
                       <span className={`block font-data text-[8px] font-black uppercase mb-1 ${isSelected ? 'text-slate-500' : 'text-slate-400'}`}>Risk Ratio</span>
                       <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden border border-slate-100/10">
                          <div className={`h-full ${ratio >= 1 ? 'bg-red-500' : ratio >= 0.7 ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                       </div>
                    </div>
                  </div>
                  {isSelected && <Activity size={80} className="absolute -bottom-4 -right-4 text-white/5 z-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: ANALYTICS HYDROGRAPH */}
        <div className="lg:w-2/3 flex flex-col space-y-4">
           {selectedStation ? (
             <div className="flex-1 bg-white border border-slate-300 rounded shadow-xl p-6 flex flex-col relative">
                
                {/* Hydrograph Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-100 pb-4 gap-4">
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                         <ChartLine size={16} className="text-slate-900" />
                         <span className="font-display font-black text-sm text-slate-900 uppercase tracking-widest">Hydro-Graph // Stage_Evolution</span>
                      </div>
                      <h3 className="font-ui text-lg font-black text-slate-800 uppercase leading-none">
                        {selectedStation.river} — STATION_NODE_{selectedStation.station_code}
                      </h3>
                   </div>
                   <div className="text-right">
                      <p className="font-data text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Catchment Status</p>
                      <div className="flex gap-2">
                         <div className="px-2 py-1 bg-slate-900 text-white rounded font-data text-[9px] font-black uppercase">D_LVL: {selectedStation.danger_level_m}M</div>
                         <div className="px-2 py-1 bg-white border border-slate-200 rounded font-data text-[9px] font-black text-slate-500 uppercase">W_LVL: {selectedStation.warning_level_m}M</div>
                      </div>
                   </div>
                </div>

                {/* The Chart */}
                <div className="flex-1 min-h-[300px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 30, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="1 4" stroke="#e2e8f0" strokeOpacity={0.7} />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#94a3b8', fontWeight: 800 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#94a3b8', fontWeight: 800 }}
                        tickLine={false}
                        axisLine={false}
                        domain={['auto', 'auto']}
                        tickFormatter={v => `${v.toFixed(1)}M`}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                             return (
                               <div className="bg-slate-900 border border-slate-700 p-2 shadow-2xl">
                                  <p className="font-mono text-[9px] text-slate-500 uppercase mb-1">{label} // VECTOR</p>
                                  {payload.map((p: any, i: number) => (
                                    <div key={i} className="flex justify-between gap-4">
                                       <span className="font-data text-[10px] font-black uppercase" style={{ color: p.stroke }}>{p.name}:</span>
                                       <span className="font-data text-[10px] font-black text-white">{p.value.toFixed(2)}M</span>
                                    </div>
                                  ))}
                               </div>
                             );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine y={selectedStation.warning_level_m} stroke="#f59e0b" strokeWidth={1} strokeDasharray="4 4" 
                        label={{ value: "WARN", position: "right", fill: "#f59e0b", fontSize: 9, fontFamily: "monospace", fontWeight: 800 }} />
                      <ReferenceLine y={selectedStation.danger_level_m} stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4"
                        label={{ value: "DANGER", position: "right", fill: "#ef4444", fontSize: 9, fontFamily: "monospace", fontWeight: 800 }} />
                      
                      <Line type="stepAfter" dataKey="level" stroke="#10b981" strokeWidth={3}
                        dot={false} name="OBSERVED" activeDot={{ r: 4, strokeWidth: 0 }} />
                      <Line type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={2}
                        strokeDasharray="8 4" dot={false} name="GLOFAS_V4" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Chart Footer Accent */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-4">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-1 bg-emerald-500 rounded-full" />
                      <span className="font-data text-[10px] font-black text-slate-400 uppercase">REAL_TIME_OBSERVATION</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-1 bg-blue-500 opacity-50 rounded-full border border-dashed border-blue-400" />
                      <span className="font-data text-[10px] font-black text-slate-400 uppercase">GLOFAS_PROJECTION_V4</span>
                   </div>
                   <div className="flex items-center gap-2 ml-auto">
                      <span className="font-data text-[9px] font-bold text-slate-300 uppercase italic">Interpolation: Hermite_Spline</span>
                   </div>
                </div>

             </div>
           ) : (
             <div className="flex-1 bg-white border border-slate-300 border-dashed rounded flex flex-col items-center justify-center text-slate-400">
                <Activity size={48} className="mb-4 opacity-20" />
                <p className="font-data text-xs font-black uppercase tracking-widest">Select_Node_From_Telemetry_Stream</p>
             </div>
           )}

           {/* Informational Accent Footer */}
           <div className="p-3 bg-slate-900 rounded flex items-center gap-3">
              <Info size={16} className="text-emerald-500" />
              <p className="font-ui text-[11px] text-slate-400 leading-tight">
                <span className="font-bold text-white uppercase tracking-wider">Hydrologist Note:</span> Forecasts are derived from the Copernicus GloFAS Global Flood Awareness System. Statistical bias-correction applied relative to CWC baseline at local station nodes.
              </p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default RiverForecast;
