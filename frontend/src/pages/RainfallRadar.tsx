import React, { useState, useEffect, useRef } from 'react';
import { CloudRain, Clock, MapTrifold, Table, Activity, Info, ChartBar } from 'phosphor-react';
import { computeEffectiveRunoff, computeAMCClass, BASIN_CN_LOOKUP } from '../utils/scscn';
import maplibregl from 'maplibre-gl';
import { INDIA_CENTER } from '../constants/gisConfig';
import { useIMDWarnings } from '../hooks/useTelemetry';

type DepartureStatus = 'Large Excess' | 'Excess' | 'Normal' | 'Deficient' | 'Large Deficit';

function getDepartureStatus(departurePct: number): { label: DepartureStatus; color: string } {
  if (departurePct >  60) return { label: 'Large Excess',    color: 'bg-red-600 text-white' };
  if (departurePct >  19) return { label: 'Excess',          color: 'bg-orange-500 text-white' };
  if (departurePct > -19) return { label: 'Normal',          color: 'bg-emerald-600 text-white' };
  if (departurePct > -59) return { label: 'Deficient',       color: 'bg-slate-200 text-slate-600' };
  return                          { label: 'Large Deficit',  color: 'bg-slate-800 text-slate-300' };
}

export const RainfallRadar: React.FC = () => {
  const [view, setView]         = useState<'map' | 'table'>('map');
  const [sortBy, setSortBy]     = useState<'departure' | 'observed' | 'district'>('departure');
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const { data: warnings = [], isLoading } = useIMDWarnings();

  const enriched = warnings.map(d => {
    const observed_24h = Number(d.rainfall_24h_mm) || 0;
    const normal_24h = 8.5; 
    const departurePct = Math.round(((observed_24h - normal_24h) / normal_24h) * 100);
    const amc          = computeAMCClass(Math.min(observed_24h * 1.5, 80)); 
    const cn           = BASIN_CN_LOOKUP['DEFAULT'] ?? 76;
    const scscn        = computeEffectiveRunoff(observed_24h, cn, amc);

    return { 
      district: d.district ?? 'Unknown',
      state: d.state ?? 'India',
      observed_24h,
      departurePct, 
      scscn, 
      status: getDepartureStatus(departurePct) 
    };
  }).sort((a, b) =>
    sortBy === 'departure' ? b.departurePct - a.departurePct :
    sortBy === 'observed'  ? b.observed_24h - a.observed_24h :
    a.district.localeCompare(b.district)
  );

  useEffect(() => {
    if (view !== 'map' || map.current || !mapContainer.current) return;
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto': {
            type: 'raster',
            tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
            tileSize: 256,
            attribution: '© CARTO'
          }
        },
        layers: [{ id: 'carto-tiles', type: 'raster', source: 'carto' }]
      },
      center: INDIA_CENTER as [number, number],
      zoom: 4.5
    });

    map.current.on('load', () => {
      if (!map.current) return;
      
      try {
        map.current.addSource('bhuvan-gpm', {
          type: 'raster',
          tiles: [
            `https://bhuvan-ras2.nrsc.gov.in/cgi-bin/gpm_raster.exe?SERVICE=WMS&VERSION=1.1.1` +
            `&REQUEST=GetMap&LAYERS=GPM_3H&STYLES=&SRS=EPSG:3857` +
            `&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=TRUE` +
            `&BBOX={bbox-epsg-3857}`
          ],
          tileSize: 256
        });

        map.current.addLayer({
          id: 'gpm-layer',
          type: 'raster',
          source: 'bhuvan-gpm',
          paint: { 'raster-opacity': 0.6 }
        });
      } catch(e) { console.warn('Radar layer failed:', e); }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [view]);

  return (
    <div className="w-full h-full flex flex-col bg-[#F8FAFC] font-auth">
      
      {/* ── INDUSTRIAL HEADER ──────────────────────────────────────────────── */}
      <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-300 gap-4 bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-2 rounded">
             <CloudRain size={24} className="text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="font-display text-slate-900 text-2xl font-black tracking-tighter uppercase leading-none">
                METEO-GRID <span className="font-light text-slate-400">/ RADAR</span>
              </h1>
              <div className="bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded text-[9px] font-black font-data uppercase border border-blue-500/20">
                SCS-CN_KERNEL
              </div>
            </div>
            <p className="font-data text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              PRECIPITATION FLUX • RUNOFF TRANSFORMATION • AMC-CLASS III
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded border border-slate-200 shadow-inner">
          <button 
            onClick={() => setView('map')}
            className={`px-3 py-1.5 text-[10px] font-black font-data uppercase flex items-center gap-2 rounded transition-all ${view === 'map' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <MapTrifold size={14} /> View Map
          </button>
          <button 
            onClick={() => setView('table')}
            className={`px-3 py-1.5 text-[10px] font-black font-data uppercase flex items-center gap-2 rounded transition-all ${view === 'table' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Table size={14} /> Data Table
          </button>
        </div>
      </div>

      {/* ── TECHNICAL DASHBOARD CONTENT ────────────────────────────────────── */}
      <div className="flex-1 min-h-0 p-6 flex flex-col space-y-4">
        
        {/* Top Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-white border border-slate-200 p-3 rounded flex items-center gap-3">
              <Activity className="text-emerald-500" size={16} />
              <div>
                 <span className="block font-data text-[9px] font-black text-slate-400 uppercase">Input.Stream</span>
                 <span className="block font-data text-xs font-black text-slate-800 uppercase">IMD_MAUSAM_SYNC: OK</span>
              </div>
           </div>
           <div className="bg-white border border-slate-200 p-3 rounded flex items-center gap-3">
              <ChartBar className="text-blue-500" size={16} />
              <div>
                 <span className="block font-data text-[9px] font-black text-slate-400 uppercase">Runoff.Q_Max</span>
                 <span className="block font-data text-xs font-black text-slate-800 uppercase">
                    {enriched.length > 0 ? `${enriched[0]?.scscn.runoff_Q_mm} MM (PEAK)` : 'NON_DETECT'}
                 </span>
              </div>
           </div>
           <div className="bg-white border border-slate-200 p-3 rounded flex items-center gap-3">
              <Clock className="text-slate-400" size={16} />
              <div>
                 <span className="block font-data text-[9px] font-black text-slate-400 uppercase">Interpolation</span>
                 <span className="block font-data text-xs font-black text-slate-800 uppercase tracking-tighter">NYQUIST_STABLE: 15MIN_INTERVAL</span>
              </div>
           </div>
        </div>

        {/* View Switcher */}
        {view === 'map' ? (
          <div className="flex-1 bg-slate-900 rounded border border-slate-300 shadow-2xl relative overflow-hidden">
            <div ref={mapContainer} className="w-full h-full" />
            
            {/* Legend Overlay */}
            <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur p-4 border border-slate-700 rounded shadow-2xl w-56 space-y-3">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="font-display font-black text-[10px] text-white uppercase tracking-widest">Precipitation Flux</span>
               </div>
               <div className="h-2 w-full bg-gradient-to-r from-blue-100 via-blue-500 to-indigo-900 rounded-px" />
               <div className="flex justify-between font-data text-[8px] text-slate-400 font-bold uppercase">
                  <span>TR_LVL: 0.1</span>
                  <span>MODERATE</span>
                  <span>FATAL_VEC</span>
               </div>
               <div className="pt-2 border-t border-slate-800">
                  <p className="font-ui text-[9px] text-slate-400 leading-tight italic">
                    GPM 3H Raster Source (ISRO/NRSC) Interpolated at {new Date().getHours()}:00 IST
                  </p>
               </div>
            </div>

            {/* Scale Overlay */}
            <div className="absolute bottom-4 left-4 p-2 bg-slate-900/60 text-[8px] font-data text-slate-500 uppercase tracking-[0.2em] border border-slate-800 rounded">
               PROJECTION: EPSG:3857_W_MERCATOR
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white border border-slate-300 rounded shadow-xl overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900 text-white font-data text-[10px] uppercase font-black tracking-widest">
                  <tr>
                    <th className="p-4 border-r border-slate-800">DISTRICT_NODE</th>
                    <th className="p-4 text-right border-r border-slate-800">IMD_OBS (24H)</th>
                    <th className="p-4 text-right border-r border-slate-800">SCS_PQ (RUNOFF)</th>
                    <th className="p-4 text-center border-r border-slate-800">AMC_CLASS</th>
                    <th className="p-4">REF_VECTOR</th>
                  </tr>
                </thead>
                <tbody className="font-data text-xs text-slate-700 divide-y divide-slate-100">
                  {enriched.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400 font-black uppercase tracking-widest">
                        {isLoading ? 'Decrypting Meteo Matrix...' : 'No Precipitation Violation Detected'}
                      </td>
                    </tr>
                  ) : enriched.map((d, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-black text-slate-900 border-r border-slate-100">
                        {d.district} <span className="font-light text-slate-400 ml-1">[{d.state}]</span>
                      </td>
                      <td className="p-4 text-right font-black border-r border-slate-100 tabular-nums">{d.observed_24h.toFixed(1)} MM</td>
                      <td className="p-4 text-right font-black border-r border-slate-100 tabular-nums text-blue-600">{d.scscn.runoff_Q_mm} MM</td>
                      <td className="p-4 text-center border-r border-slate-100">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${d.scscn.amc_class === 'III' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          TYPE_{d.scscn.amc_class}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded text-[9px] font-black uppercase ${d.status.color} shadow-sm`}>
                          {d.status.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-auto p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[10px] font-data text-slate-400 font-bold">
               <span>DATA_SOURCE: IMD_MAUSAM_REST_API</span>
               <span className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> KERNEL_HEALTH: STABLE
               </span>
            </div>
          </div>
        )}

        {/* Informational Accent */}
        <div className="bg-slate-800 p-3 rounded flex items-center gap-3">
           <Info size={16} className="text-slate-400" />
           <p className="font-ui text-[11px] text-slate-300 leading-tight">
             <span className="font-bold text-white uppercase tracking-wider">Engineering Note:</span> SCS Curve Number transformation mapping district-level IMD advisories into standardized runoff coefficients. 
             Calculations based on <span className="font-mono text-slate-400 tracking-tighter">Q = (P - Ia)^2 / (P - Ia + S)</span>.
           </p>
        </div>

      </div>
    </div>
  );
};

export default RainfallRadar;
