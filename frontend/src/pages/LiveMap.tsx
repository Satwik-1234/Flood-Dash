import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { StationPopup } from '../components/map/StationPopup';
import { useCWCStations, useIMDWarnings } from '../hooks/useTelemetry';
import { useIntel } from '../context/IntelContext';
import { 
  Plus, Minus, Target as TargetIcon, Stack as Layers, Info, List, 
  Warning, Waves, Globe, MapPin, Drop
} from 'phosphor-react';
import {
  INDIA_CENTER, INDIA_BOUNDS, WMS_ENDPOINTS, WRIS_LAYERS
} from '../constants/gisConfig';

const riskColor = (ratio: number) => {
  if (ratio >= 1.0) return '#EF4444'; // Danger (Red)
  if (ratio >= 0.8) return '#F59E0B'; // Warning (Amber)
  if (ratio > 0)    return '#10B981'; // Normal (Green)
  return '#94A3B8'; // Inactive/No data (Slate)
};

export const LiveMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  
  // Intelligence State (Sync)
  const { 
    selectedStation, setSelectedStation, 
    selectedDistrict, setSelectedDistrict,
    setActiveWarnings 
  } = useIntel();

  const { data: stations = [], isLoading: stationsLoading } = useCWCStations();
  const { data: imdWarnings = [] } = useIMDWarnings();

  const [mapLoaded, setMapLoaded] = useState(false);
  const [layers, setLayers] = useState({
    basins: false,
    rivers: false,
    districts: false,
    stations: true
  });

  // Effect: Sync shared warnings
  useEffect(() => {
    setActiveWarnings(imdWarnings);
  }, [imdWarnings, setActiveWarnings]);

  // Initial Map Load
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap'
          }
        },
        layers: [
          { id: 'osm-tiles', type: 'raster', source: 'osm' }
        ]
      },
      center: INDIA_CENTER as [number, number],
      zoom: 5,
      maxBounds: INDIA_BOUNDS as [number, number, number, number],
      attributionControl: false
    });

    const m = map.current;

    m.on('load', () => {
      // --- 1. National Gauge Source (GeoJSON with Clustering) ---
      m.addSource('stations', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 40
      });

      // --- 2. Official WMS Sources (NRSC/WRIS) ---
      m.addSource('wris-basins', {
        type: 'raster',
        tiles: [`${WMS_ENDPOINTS.WRIS_BASIN}?service=WMS&request=GetMap&layers=${WRIS_LAYERS.BASINS}&styles=&format=image/png&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG:3857&bbox={bbox-epsg-3857}`],
        tileSize: 256
      });

      m.addSource('wris-rivers', {
        type: 'raster',
        tiles: [`${WMS_ENDPOINTS.WRIS_BASIN}?service=WMS&request=GetMap&layers=${WRIS_LAYERS.RIVERS}&styles=&format=image/png&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG:3857&bbox={bbox-epsg-3857}`],
        tileSize: 256
      });

      // --- 3. Map Layers ---
      m.addLayer({ id: 'wris-basins-layer', type: 'raster', source: 'wris-basins', layout: { visibility: 'none' }, paint: { 'raster-opacity': 0.6 } });
      m.addLayer({ id: 'wris-rivers-layer', type: 'raster', source: 'wris-rivers', layout: { visibility: 'none' }, paint: { 'raster-opacity': 0.8 } });

      // Cluster Styling (Amber glow for clusters)
      m.addLayer({
        id: 'clusters', type: 'circle', source: 'stations', filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#0EA5E9', 100, '#38BDF8', 750, '#7DD3FC'],
          'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
          'circle-stroke-width': 2, 'circle-stroke-color': 'rgba(255,255,255,0.2)'
        }
      });

      m.addLayer({
        id: 'cluster-count', type: 'symbol', source: 'stations', filter: ['has', 'point_count'],
        layout: { 'text-field': '{point_count}', 'text-font': ['Open Sans Bold'], 'text-size': 12 },
        paint: { 'text-color': '#fff' }
      });

      // Unclustered Points (Synced with danger_level_m)
      m.addLayer({
        id: 'unclustered-point', type: 'circle', source: 'stations', filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'marker-color'],
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 4, 12, 10],
          'circle-stroke-width': 2, 'circle-stroke-color': '#0F172A'
        }
      });

      // --- 4. Interactivity ---
      m.on('click', 'unclustered-point', (e) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties;
        setSelectedStation(props as any);
      });

      m.on('click', 'clusters', (e) => {
        const features = m.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        if (!features.length || !features[0].properties) return;
        
        const clusterId = features[0].properties.cluster_id;
        const source = m.getSource('stations') as maplibregl.GeoJSONSource;
        if (source) {
          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err || zoom === undefined) return;
            const geometry = features[0].geometry as any;
            if (geometry && geometry.coordinates) {
              m.easeTo({ center: geometry.coordinates, zoom });
            }
          });
        }
      });

      m.on('mouseenter', 'unclustered-point', () => m.getCanvas().style.cursor = 'pointer');
      m.on('mouseleave', 'unclustered-point', () => m.getCanvas().style.cursor = '');

      setMapLoaded(true);
    });
  }, [setSelectedStation]);

  // Effect: Sync Station Data to Map
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;
    
    const source = m.getSource('stations') as maplibregl.GeoJSONSource;
    if (source) {
      const features = stations.map(s => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [s.lon || 0, s.lat || 0] },
        properties: {
          ...s,
          'marker-color': riskColor(s.danger_m > 0 ? (s.current_water_level_m / s.danger_m) : 0)
        }
      }));
      source.setData({ type: 'FeatureCollection', features });
    }
  }, [stations, mapLoaded]);

  // Effect: Sync Layer Visibility
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;
    m.setLayoutProperty('wris-basins-layer', 'visibility', layers.basins ? 'visible' : 'none');
    m.setLayoutProperty('wris-rivers-layer', 'visibility', layers.rivers ? 'visible' : 'none');
  }, [layers, mapLoaded]);

  return (
    <div className="relative w-full h-full group bg-[#020617] overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0 grayscale-[0.2] brightness-[0.8] contrast-[1.2]" />
      
      {/* HUD: Intelligence Layer Panel */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
        <div className="bg-[#0F172A]/80 backdrop-blur-xl p-2 rounded-2xl border border-slate-700/50 shadow-2xl flex flex-col pointer-events-auto">
          {[
            { id: 'stations', icon: MapPin, label: 'Gauges', active: layers.stations },
            { id: 'rivers',  icon: Waves,  label: 'Rivers', active: layers.rivers },
            { id: 'basins',  icon: TargetIcon, label: 'Basins', active: layers.basins },
          ].map(l => (
            <button
              key={l.id}
              onClick={() => setLayers(prev => ({ ...prev, [l.id]: !(prev as any)[l.id] }))}
              className={`p-3 rounded-xl transition-all flex items-center gap-3 group/btn ${
                l.active ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <l.icon size={20} weight={l.active ? 'fill' : 'regular'} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden group-hover:block whitespace-nowrap">
                {l.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* HUD: Map Controls */}
      <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2">
         <div className="flex flex-col bg-[#0F172A]/80 backdrop-blur p-1 rounded-xl border border-slate-700/50">
            <button onClick={() => map.current?.zoomIn()} className="p-2 text-slate-400 hover:text-white"><Plus size={18} /></button>
            <div className="h-[1px] bg-slate-700/50 mx-2" />
            <button onClick={() => map.current?.zoomOut()} className="p-2 text-slate-400 hover:text-white"><Minus size={18} /></button>
         </div>
         <button 
           onClick={() => map.current?.easeTo({ center: INDIA_CENTER as [number, number], zoom: 5 })}
           className="p-3 bg-[#0F172A]/80 backdrop-blur rounded-xl border border-slate-700/50 text-slate-400 hover:text-white"
         >
           <Globe size={18} />
         </button>
      </div>

      {/* HUD: Legend */}
      <div className="absolute bottom-6 right-6 z-10">
        <div className="bg-[#0F172A]/90 backdrop-blur-xl p-5 rounded-3xl border border-slate-700/50 shadow-2xl w-64 ring-1 ring-white/5">
          <div className="text-[10px] font-black text-sky-400 uppercase tracking-[0.3em] mb-4">Gaude Thresholds</div>
          <div className="space-y-3">
             {[
               { label: 'Extreme Risk', color: '#EF4444', desc: 'Above Danger' },
               { label: 'Active Warning', color: '#F59E0B', desc: 'Above Warning' },
               { label: 'Normal Flow', color: '#10B981', desc: 'Steady Telemetry' },
               { label: 'Station Idle', color: '#94A3B8', desc: 'Maintenance/Dry' }
             ].map(l => (
               <div key={l.label} className="group/item cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full ring-4 ring-offset-2 ring-offset-slate-900" style={{ background: l.color }} />
                    <div>
                      <div className="text-[10px] font-black text-slate-200 uppercase tracking-tight leading-none">{l.label}</div>
                      <div className="text-[8px] font-bold text-slate-500 uppercase mt-1 opacity-0 group-hover/item:opacity-100 transition-opacity">{l.desc}</div>
                    </div>
                  </div>
               </div>
             ))}
          </div>
          <div className="h-[1px] bg-slate-800 my-4" />
          <div className="flex items-center justify-between opacity-50">
             <span className="text-[8px] font-black text-slate-400 uppercase italic">Source: CWC/WRIS Engine</span>
             <Info size={12} className="text-slate-500" />
          </div>
        </div>
      </div>

      {/* HUD: Station Count / Meta */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
         <div className="bg-[#0F172A]/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/50 flex items-center gap-3 shadow-2xl ring-1 ring-white/5">
            <div className={`w-2 h-2 rounded-full ${stationsLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">
              {stationsLoading ? 'Polling Database...' : `${stations.length.toLocaleString()} Active Nodes`}
            </span>
         </div>
      </div>

      {selectedStation && (
        <StationPopup 
          station={selectedStation} 
          onClose={() => setSelectedStation(null)} 
        />
      )}
    </div>
  );
};
