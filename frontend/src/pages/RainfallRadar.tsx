import React, { useState, useEffect, useRef } from 'react';
import { CloudRain, Clock, Info, MapTrifold, Table } from 'phosphor-react';
import { computeEffectiveRunoff, computeAMCClass, BASIN_CN_LOOKUP } from '../utils/scscn';
import maplibregl from 'maplibre-gl';
import { INDIA_CENTER, WMS_ENDPOINTS } from '../constants/gisConfig';

const DISTRICT_RAINFALL = [
  { district: 'Kolhapur',   state: 'Maharashtra', observed_24h: 210.5, normal_24h: 18.2, season_total: 1840, season_normal: 2948 },
  { district: 'Sangli',     state: 'Maharashtra', observed_24h: 148.2, normal_24h: 12.4, season_total: 1420, season_normal: 2350 },
  { district: 'Nashik',     state: 'Maharashtra', observed_24h: 87.0,  normal_24h: 11.0, season_total: 1050, season_normal: 1950 },
  { district: 'Pune',       state: 'Maharashtra', observed_24h: 64.0,  normal_24h: 9.8,  season_total: 890,  season_normal: 1750 },
  { district: 'Ratnagiri',  state: 'Maharashtra', observed_24h: 285.0, normal_24h: 32.0, season_total: 3200, season_normal: 3800 },
  { district: 'Guwahati',   state: 'Assam',       observed_24h: 310.0, normal_24h: 25.0, season_total: 2100, season_normal: 2400 },
];

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
  const [showRunoff, setRunoff] = useState(true);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const enriched = DISTRICT_RAINFALL.map(d => {
    const departurePct = Math.round(((d.observed_24h - d.normal_24h) / d.normal_24h) * 100);
    const seasonDep    = Math.round(((d.season_total - d.season_normal) / d.season_normal) * 100);
    const amc          = computeAMCClass(Math.min(d.season_total * 0.04, 80));
    const cn           = BASIN_CN_LOOKUP['DEFAULT'] ?? 76;
    const scscn        = computeEffectiveRunoff(d.observed_24h, cn, amc);
    return { ...d, departurePct, seasonDep, scscn, status: getDepartureStatus(departurePct) };
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
              SCS-CN Effective Runoff Transformation using ISRO GPM Sat-Imagery
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
            <strong>SCS-CN Protocol:</strong> This calculates <em>Effective Runoff (Q)</em> from Sat-observed <em>Rainfall (P)</em>. 
            The map displays the ISRO Bhuvan GPM (Global Precipitation Measurement) raster overlay.
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
                    <th className="p-4">District</th>
                    <th className="p-4 text-right">24h Observed</th>
                    <th className="p-4 text-right">Runoff Q (mm)</th>
                    <th className="p-4 text-right">AMC Class</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light font-ui text-sm text-text-body">
                  {enriched.map(d => (
                    <tr key={d.district} className="hover:bg-bg-cream transition-colors">
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
