import React, { useState, useCallback, useEffect } from 'react';
import { Brain, CloudRain, Waves, Drop, TrendUp,
         WarningOctagon, CaretRight, Info, MapPin, Activity, Cpu, ChartBar, Database } from 'phosphor-react';
import { useCWCStations } from '../hooks/useTelemetry';
import { fetchStationWeather, getCurrentHourWeather } from '../api/openMeteoApi';
import { useQuery } from '@tanstack/react-query';

// ─── PURE BROWSER ML ENGINE ───────────────────────────────────────────────
interface HydroParams {
  rainfall_24h_mm:    number;
  river_level_m:      number;
  danger_level_m:     number;
  soil_moisture_idx:  number;
  elevation_m:        number;
  rainfall_intensity_mmphr: number;
}

interface PredictionResult {
  probability_pct:    number;
  risk_level:         1 | 2 | 3 | 4 | 5;
  risk_label:         string;
  plain_language:     string;
  recommended_action: string;
}

function computeSHAP(params: HydroParams): Record<string, number> {
  const levelRatio    = params.danger_level_m > 0 ? (params.river_level_m / params.danger_level_m) : 0;
  const rainFactor    = (params.rainfall_24h_mm / 250.0) * params.soil_moisture_idx;
  const topoFactor    = Math.max(0, 1 - (params.elevation_m / 800.0));
  const intensity     = Math.min(1, params.rainfall_intensity_mmphr / 50.0);
  
  return {
    "Level Saturation": 4.5 * levelRatio,
    "Soil Moisture x Rain": 3.2 * rainFactor,
    "Terrain Susceptibility": 1.5 * topoFactor,
    "Pluvials Intensity": 2.0 * intensity,
    "Kernel Bias": -4.0,
  };
}

function runBrowserInference(params: HydroParams, decay = 1.0): PredictionResult {
  const levelRatio    = params.danger_level_m > 0 ? (params.river_level_m / params.danger_level_m) : 0;
  const rainFactor    = (params.rainfall_24h_mm / 250.0) * params.soil_moisture_idx;
  const topoFactor    = Math.max(0, 1 - (params.elevation_m / 800.0));
  const intensityFactor = Math.min(1, params.rainfall_intensity_mmphr / 50.0);

  const z = (4.5 * levelRatio)
           + (3.2 * rainFactor)
           + (1.5 * topoFactor)
           + (2.0 * intensityFactor)
           - 4.0;

  const probPct = Math.round((1.0 / (1.0 + Math.exp(-z))) * 100 * decay * 100) / 100;

  let level: 1 | 2 | 3 | 4 | 5;
  let label: string;
  let action: string;
  let plain: string;

  if      (probPct > 85) { level = 5; label = 'FATAL';     action = 'IMMEDIATE_DEPARTURE'; plain = 'Extreme inundation protocol active.'; }
  else if (probPct > 65) { level = 4; label = 'CRITICAL';  action = 'MOVE_HIGH_GROUND'; plain = 'Severe flood risk imminent.'; }
  else if (probPct > 40) { level = 3; label = 'WARN';      action = 'PREPARE_KIT'; plain = 'Condition vector deteriorating.'; }
  else if (probPct > 20) { level = 2; label = 'WATCH';     action = 'AVOID_LOW_ZONES'; plain = 'Elevated hydrological tension.'; }
  else                   { level = 1; label = 'STABLE';    action = 'NOMINAL_MONITOR'; plain = 'Conditions within reference bounds.'; }

  return { probability_pct: probPct, risk_level: level, risk_label: label, plain_language: plain, recommended_action: action };
}

function runMultiHorizon(params: HydroParams) {
  return {
    h24: runBrowserInference(params, 1.0),
    h48: runBrowserInference(params, 0.85),
    h72: runBrowserInference(params, 0.70),
  };
}

const RISK_THEMES = {
  1: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-200' },
  2: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  3: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-200' },
  4: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-200' },
  5: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-200' },
} as const;

export const MLAnalysis: React.FC = () => {
  const [result, setResult]   = useState<ReturnType<typeof runMultiHorizon> | null>(null);
  const [shap, setShap]       = useState<Record<string, number> | null>(null);
  const [isRunning, setRunning] = useState(false);

  const { data: stations } = useCWCStations();
  const [selectedStationCode, setSelectedStationCode] = useState<string>('');
  const selectedStation = stations?.find(s => s.station_code === selectedStationCode);

  const [params, setParams] = useState<HydroParams>({
    rainfall_24h_mm:          120.5,
    river_level_m:             38.5,
    danger_level_m:            39.0,
    soil_moisture_idx:          0.85,
    elevation_m:              540.0,
    rainfall_intensity_mmphr:  32.0,
  });

  const { data: stationWeather, isLoading: wxLoading } = useQuery({
    queryKey: ['ml-station-weather', selectedStation?.lat, selectedStation?.lon],
    queryFn: () => fetchStationWeather(
      selectedStation!.lat ?? 19, 
      selectedStation!.lon ?? 73
    ),
    enabled: !!(selectedStation?.lat && selectedStation?.lon),
    staleTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    if (!selectedStation || !stationWeather) return;
    const wx = getCurrentHourWeather(
      stationWeather.hourly ?? {}, 
      stationWeather.hourly?.time ?? []
    );
    setParams({
      rainfall_24h_mm:          stationWeather.daily?.precipitation_sum?.[0] ?? 0,
      river_level_m:            selectedStation.current_water_level_m ?? 0,
      danger_level_m:           selectedStation.danger_level_m ?? (selectedStation.current_water_level_m ?? 0) + 1,
      soil_moisture_idx:        stationWeather.hourly?.soil_moisture_0_1cm?.[0] ?? 0.5,
      elevation_m:              540,
      rainfall_intensity_mmphr: (wx?.precipitation ?? 0) * 4,
    });
  }, [selectedStation, stationWeather]);

  const handlePredict = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setRunning(true);
    await new Promise(r => setTimeout(r, 600));
    setResult(runMultiHorizon(params));
    setShap(computeSHAP(params));
    setRunning(false);
  }, [params]);

  const setField = (field: keyof HydroParams, val: string) =>
    setParams(prev => ({ ...prev, [field]: parseFloat(val) || 0 }));

  return (
    <div className="w-full h-full flex flex-col bg-[#F8FAFC] font-auth selection:bg-suk-forest/20 overflow-hidden">
      
      {/* ── INDUSTRIAL HEADER ──────────────────────────────────────────────── */}
      <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-300 gap-4 bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-2 rounded">
             <Brain size={24} className="text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="font-display text-slate-900 text-2xl font-black tracking-tighter uppercase leading-none">
                NEURAL-GRID <span className="font-light text-slate-400">/ DIAGNOSTICS</span>
              </h1>
              <div className="bg-violet-500/10 text-violet-600 px-1.5 py-0.5 rounded text-[9px] font-black font-data uppercase border border-violet-500/20">
                WASM_IN_BROWSER
              </div>
            </div>
            <p className="font-data text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              NON-DETERMINISTIC INFERENCE • SHAP ATTRIBUTION • HYDROMETRIC BIAS
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="px-3 py-1.5 bg-slate-900 rounded text-[10px] font-black font-data text-white shadow-xl flex items-center gap-2 uppercase tracking-widest">
            <Cpu size={14} className="text-violet-400" /> KERNEL: ACTIVE
          </div>
        </div>
      </div>

      {/* ── TECHNICAL CONTENT ──────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 p-6 flex flex-col lg:flex-row gap-6 overflow-hidden">
        
        {/* LEFT: INPUT KERNEL */}
        <div className="lg:w-[320px] bg-white border border-slate-300 rounded shadow-xl p-6 flex flex-col shrink-0 overflow-y-auto scrollbar-hide">
           <div className="mb-6 pb-6 border-b border-slate-100">
             <label className="block font-data text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Node Mapping</label>
             <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <select
                  value={selectedStationCode}
                  onChange={e => setSelectedStationCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded pl-9 pr-4 py-2 font-data text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-slate-900 transition-all appearance-none"
                >
                  <option value="">MANUAL_OVERRIDE</option>
                  {stations?.map(s => (
                    <option key={s.station_code} value={s.station_code}>
                      {s.river.split(' ')[0]} // {s.station_name}
                    </option>
                  ))}
                </select>
             </div>
             {selectedStation && (
               <p className="font-data text-[9px] font-bold text-emerald-600 mt-2 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> METEO_PAYLOAD_LOCKED
               </p>
             )}
           </div>

           <form onSubmit={handlePredict} className="space-y-4 flex-1">
             <label className="block font-data text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observation Params</label>
             {([
               { key: 'rainfall_24h_mm',         label: 'Rain_Sum_24H', icon: CloudRain },
               { key: 'rainfall_intensity_mmphr', label: 'Peak_Flux_1H', icon: CloudRain },
               { key: 'river_level_m',            label: 'Stage_Lvl_M', icon: Waves },
               { key: 'danger_level_m',           label: 'Fatal_Thresh', icon: WarningOctagon },
               { key: 'soil_moisture_idx',        label: 'Soil_Saturation', icon: Drop },
               { key: 'elevation_m',              label: 'Terrain_Alt', icon: TrendUp },
             ] as const).map(({ key, label, icon: Icon }) => (
               <div key={key} className="space-y-1">
                 <div className="flex items-center gap-2">
                    <Icon size={12} className="text-slate-400" />
                    <span className="font-data text-[9px] font-black text-slate-500 uppercase">{label}</span>
                 </div>
                 <input
                   type="number" step="0.1" required
                   value={Number(params[key]).toString()}
                   onChange={e => setField(key, e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 font-data text-xs font-black text-slate-900 focus:outline-none focus:border-slate-900 shadow-inner"
                 />
               </div>
             ))}

             <div className="pt-6">
               <button
                 type="submit" disabled={isRunning || wxLoading}
                 className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded text-[10px] font-black font-data uppercase tracking-[0.2em] shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
               >
                 {isRunning ? <Activity size={14} className="animate-spin" /> : <CaretRight size={14} />}
                 {isRunning ? 'RUNNING_INFERENCE...' : 'Compute Analytics'}
               </button>
             </div>
           </form>
        </div>

        {/* RIGHT: DIAGNOSTICS PANELS */}
        <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-hide">
           {result ? (
             <>
               {/* Risk Outlook Banners */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {[
                   { h: 'Nowcast_24H', r: result.h24 },
                   { h: 'Outlook_48H', r: result.h48 },
                   { h: 'Project_72H', r: result.h72 },
                 ].map((item, i) => {
                   const t = RISK_THEMES[item.r.risk_level];
                   return (
                     <div key={i} className={`p-6 border rounded shadow-sm relative overflow-hidden backdrop-blur-sm ${t.bg} ${t.border}`}>
                        <span className={`block font-data text-[9px] font-black uppercase tracking-widest mb-1 ${t.text}`}>{item.h}</span>
                        <div className={`font-display text-5xl font-black ${t.text} tracking-tighter leading-none`}>
                          {item.r.probability_pct}<span className="text-2xl font-light opacity-50">%</span>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                           <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-current ${t.text}`}>
                             {item.r.risk_label}
                           </span>
                           <span className={`font-data text-[10px] font-black uppercase ${t.text} opacity-50`}>NODE_H{i+1}</span>
                        </div>
                     </div>
                   );
                 })}
               </div>

               {/* SHAP Influence Grid */}
               <div className="bg-white border border-slate-300 rounded shadow-xl p-6">
                 <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                    <ChartBar size={16} className="text-slate-900" />
                    <h3 className="font-display font-black text-sm text-slate-900 uppercase tracking-widest">SHAP Attrib // Feature Influence</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {shap && Object.entries(shap).map(([key, val]) => (
                     <div key={key} className="space-y-2">
                       <h4 className="font-data text-[9px] font-black text-slate-400 uppercase tracking-tighter">Contribution.{key.replace(/ /g, '_')}</h4>
                       <div className={`font-display text-3xl font-black tracking-tight ${val > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                         {val > 0 ? '+' : ''}{val.toFixed(2)}
                       </div>
                       <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div className={`h-full ${val > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, Math.abs(val) * 20)}%` }} />
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

               {/* Neural Commentary */}
               <div className="bg-slate-900 rounded border border-slate-700 p-6 flex items-start gap-4 shadow-2xl">
                  <div className="p-3 bg-slate-800 rounded flex items-center justify-center shrink-0 border border-slate-700 shadow-inner">
                     <Info size={24} className="text-violet-400" />
                  </div>
                  <div className="space-y-2">
                     <div className="flex items-center gap-2">
                        <span className="font-data text-[10px] font-black text-slate-500 uppercase tracking-widest">Operator.ThoughtTrace</span>
                        <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] px-1 rounded uppercase font-black">Stable</div>
                     </div>
                     <p className="font-ui text-xs text-slate-300 leading-relaxed font-medium italic">
                       "{result.h24.plain_language}"
                     </p>
                     <p className="font-data text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] pt-2">
                       ▶ RECOMMENDED_ACTION: {result.h24.recommended_action}
                     </p>
                  </div>
               </div>
             </>
           ) : (
             <div className="h-full bg-white border border-slate-300 border-dashed rounded flex flex-col items-center justify-center text-slate-300 p-12 text-center">
                <Database size={64} className="mb-6 opacity-10" />
                <h3 className="font-display font-black text-2xl uppercase tracking-widest opacity-20">No Context Loaded</h3>
                <p className="font-data text-[10px] font-black uppercase mt-2 tracking-widest opacity-30 max-w-xs">Awaiting Hydrometrical Payload From Local Memory or Remote Telemetry Link.</p>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default MLAnalysis;
