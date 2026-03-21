import React, { useState, useEffect, useRef } from 'react';
import { CloudRain, Clock, Info, MapTrifold, Table } from 'phosphor-react';
import { computeEffectiveRunoff, computeAMCClass, BASIN_CN_LOOKUP } from '../utils/scscn';
import maplibregl from 'maplibre-gl';
import { INDIA_CENTER, WMS_ENDPOINTS } from '../constants/gisConfig';
import { useIMDWarnings } from '../hooks/useTelemetry';

type DepartureStatus = 'Large Excess' | 'Excess' | 'Normal' | 'Deficient' | 'Large Deficit';

function getDepartureStatus(departurePct: number): { label: DepartureStatus; color: string } {
  if (departurePct >  60) return { label: 'Large Excess',    color: 'text-risk-5-text bg-risk-5'  };
  if (departurePct >  19) return { label: 'Excess',          color: 'text-risk-3-text bg-risk-3' };
  if (departurePct > -19) return { label: 'Normal',          color: 'text-risk-1-text bg-risk-1'};
  if (departurePct > -59) return { label: 'Deficient',       color: 'text-text-muted bg-bg-surface'};
  return                          { label: 'Large Deficit',  color: 'text-text-muted bg-bg-surface-2'};
}

export const RainfallRadar: React.FC = () => {
  const [view, setView]         = useState<'map' | 'table'>('map');
  const [sortBy, setSortBy]     = useState<'departure' | 'observed' | 'district'>('departure');
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const { data: warnings = [], isLoading } = useIMDWarnings();

  const enriched = warnings.map(d => {
    // Map live IMD warning rainfall into the standard structure
    const observed_24h = Number(d.rainfall_24h_mm) || 0;
    const normal_24h = 8.5; // baseline seasonal delta
    
    // Simulate seasonal aggregations for SCS-CN (as IMD district API is 24h limited)
    const season_total = observed_24h * 12;
    const season_normal = 2100;

    const departurePct = Math.round(((observed_24h - normal_24h) / normal_24h) * 100);
    const amc          = computeAMCClass(Math.min(season_total * 0.04, 80));
    const cn           = BASIN_CN_LOOKUP['DEFAULT'] ?? 76;
    const scscn        = computeEffectiveRunoff(observed_24h, cn, amc);

    return { 
      district: d.district ?? 'Unknown',
      state: 'India',
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
            attribution: '© CARTO © OpenStreetMap'
          }
        },
        layers: [{ id: 'carto-tiles', type: 'raster', source: 'carto' }]
      },
      center: INDIA_CENTER as [number, number],
      zoom: 4.5
    });

    map.current.on('load', () => {
      if (!map.current) return;
      
      // Bhuvan GPM Rainfall Raster (Time-interpolated)
      map.current.addSource('bhuvan-gpm', {
        type: 'raster',
        tiles: [
          `https://bhuvan-ras2.nrsc.gov.in/cgi-bin/gpm_raster.exe?SERVICE=WMS&VERSION=1.1.1` +
          `&REQUEST=GetMap&LAYERS=GPM_3H&STYLES=&SRS=EPSG:3857` +
          `&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=TRUE` +
          `&BBOX={bbox-epsg-3857}`
        ],
        tileSize: 256,
        attribution: 'GPM Precipitation © NRSC/ISRO'
      });

      map.current.addLayer({
        id: 'gpm-layer',
        type: 'raster',
        source: 'bhuvan-gpm',
        paint: { 'raster-opacity': 0.7 }
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [view]);

  return (
    <div className="w-full h-full flex flex-col bg-bg-cream overflow-hidden">
      {/* Header section (fixed) */}
      <div className="p-8 pb-4 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-display text-text-dark text-3xl font-bold flex items-center">
              <CloudRain className="w-8 h-8 mr-3 text-suk-river" weight="duotone" />
              Rainfall & Runoff Radar
            </h2>
            <p className="font-ui text-text-muted mt-1 text-sm">
              SCS-CN Effective Runoff Transformation via IMD Telemetry
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-bg-white border border-border-default p-1 rounded-lg">
            <button 
              onClick={() => setView('map')}
              className={`flex items-center px-4 py-2 font-ui text-sm font-bold rounded-md transition-all ${view === 'map' ? 'bg-suk-forest text-white' : 'text-text-muted hover:bg-bg-surface'}`}
            >
              <MapTrifold className="w-4 h-4 mr-2" /> Map View
            </button>
            <button 
              onClick={() => setView('table')}
              className={`flex items-center px-4 py-2 font-ui text-sm font-bold rounded-md transition-all ${view === 'table' ? 'bg-suk-forest text-white' : 'text-text-muted hover:bg-bg-surface'}`}
            >
              <Table className="w-4 h-4 mr-2" /> Data Table
            </button>
          </div>
        </div>

        <div className="bg-bg-white border border-border-default rounded-xl p-3 flex items-start space-x-3">
          <Info className="w-4 h-4 text-suk-river shrink-0 mt-0.5" />
          <p className="font-ui text-xs text-text-body leading-relaxed">
            <strong>Live Context:</strong> Using live IMD warnings to run Soil Conservation Service Curve Number calculations mapping extreme 24h precipitation events into localized runoff projections.
          </p>
        </div>
      </div>

      {/* Main content (flexible) */}
      <div className="flex-1 min-h-0 px-8 pb-8">
        {view === 'map' ? (
          <div className="w-full h-full rounded-2xl border border-border-default shadow-premium overflow-hidden relative">
            <div ref={mapContainer} className="w-full h-full bg-slate-900" />
            <div className="absolute bottom-4 right-4 bg-bg-white/90 backdrop-blur-sm border border-border-default rounded-lg p-3 shadow-popup max-w-xs transition-opacity hover:opacity-100">
               <h4 className="font-display text-xs font-bold text-text-dark mb-1">Radar Legend (GPM 3H)</h4>
               <div className="h-2 w-full bg-gradient-to-r from-blue-100 via-blue-500 to-indigo-900 rounded-full mb-1" />
               <div className="flex justify-between text-[8px] font-data text-text-muted uppercase">
                 <span>0.1 mm</span>
                 <span>Moderate</span>
                 <span>Heavy Rain</span>
               </div>
            </div>
          </div>
        ) : (
          <div className="bg-bg-white border border-border-default rounded-2xl shadow-premium overflow-hidden h-full flex flex-col">
            <div className="overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-bg-surface border-b border-border-default z-10 font-ui text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  <tr>
                    <th className="p-4 cursor-pointer" onClick={() => setSortBy('district')}>District Context</th>
                    <th className="p-4 text-right cursor-pointer" onClick={() => setSortBy('observed')}>24h IMD Record</th>
                    <th className="p-4 text-right">Computed Q (mm)</th>
                    <th className="p-4 text-right">Terrain AMC</th>
                    <th className="p-4 cursor-pointer" onClick={() => setSortBy('departure')}>Departure Vector</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light font-ui text-sm text-text-body">
                  {enriched.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-text-muted">
                        {isLoading ? 'Syncing IMD Matrix...' : 'No districts registering massive anomalies.'}
                      </td>
                    </tr>
                  ) : enriched.map((d, idx) => (
                    <tr key={`${d.district}-${idx}`} className="hover:bg-bg-cream transition-colors">
                      <td className="p-4 font-bold text-text-dark">
                        {d.district} <span className="font-normal text-xs text-text-muted ml-1">{d.state}</span>
                      </td>
                      <td className="p-4 text-right font-data font-bold">{d.observed_24h} mm</td>
                      <td className="p-4 text-right font-data font-bold text-suk-fire">{d.scscn.runoff_Q_mm} mm</td>
                      <td className="p-4 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${d.scscn.amc_class === 'III' ? 'bg-risk-5 text-risk-5-text' : 'bg-risk-1 text-risk-1-text'}`}>
                          AMC-{d.scscn.amc_class}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${d.status.color}`}>
                          {d.status.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RainfallRadar;
