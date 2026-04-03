import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { StationPopup } from '../components/map/StationPopup';
import { useCWCStations, useIMDWarnings } from '../hooks/useTelemetry';
import { useIntel } from '../context/IntelContext';
import { 
  Plus, Minus, Target as TargetIcon, Stack as Layers, Info, List, 
  Warning, Waves, Globe, MapPin, Drop, Selection as SelectionIcon
} from 'phosphor-react';
import {
  INDIA_CENTER, INDIA_BOUNDS, WRIS_REST, WRIS_LAYERS
} from '../constants/gisConfig';

const riskColor = (ratio: number) => {
  if (ratio >= 1.0) return '#EF4444'; // Danger (Red)
  if (ratio >= 0.8) return '#EAB308'; // Warning (Gold)
  if (ratio > 0)    return '#0EA5E9'; // Normal (Sky Blue)
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
  const [activeLayers, setActiveLayers] = useState({
    basins: true,
    rivers: true,
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
      // --- 1. National Gauge Source (Local Registry) ---
      m.addSource('stations', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 40
      });

      // --- 2. Authoritative India-WRIS REST MapServers (HTTPS) ---
      m.addSource('wris-basins', {
        type: 'raster',
        tiles: [`${WRIS_REST.BASIN}/export?dpi=96&transparent=true&format=png32&layers=show:${WRIS_LAYERS.BASIN}&bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&f=image`],
        tileSize: 256
      });

      m.addSource('wris-rivers', {
        type: 'raster',
        tiles: [`${WRIS_REST.RIVER}/export?dpi=96&transparent=true&format=png32&layers=show:${WRIS_LAYERS.RIVERS}&bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&f=image`],
        tileSize: 256
      });

      // --- 3. GIS Command Layers ---
      m.addLayer({ id: 'wris-basins-layer', type: 'raster', source: 'wris-basins', paint: { 'raster-opacity': 0.6 } });
      m.addLayer({ id: 'wris-rivers-layer', type: 'raster', source: 'wris-rivers', paint: { 'raster-opacity': 0.8 } });

      // Cluster Styling (Command Palette)
      m.addLayer({
        id: 'clusters', type: 'circle', source: 'stations', filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#0EA5E9', 100, '#0284C7', 750, '#0369A1'],
          'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
          'circle-stroke-width': 3, 'circle-stroke-color': '#fff'
        }
      });

      m.addLayer({
        id: 'cluster-count', type: 'symbol', source: 'stations', filter: ['has', 'point_count'],
        layout: { 'text-field': '{point_count}', 'text-font': ['Open Sans Bold'], 'text-size': 12 },
        paint: { 'text-color': '#fff' }
      });

      m.addLayer({
        id: 'unclustered-point', type: 'circle', source: 'stations', filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'marker-color'],
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 4, 12, 10],
          'circle-stroke-width': 2, 'circle-stroke-color': '#fff'
        }
      });

      // --- 4. Interactivity ---
      m.on('click', 'unclustered-point', (e) => {
        if (!e.features || !e.features.length) return;
        const props = e.features[0].properties;
        if (!props) return;
        setSelectedStation(props as any);
      });

      const mLocal = map.current;
      if (mLocal) {
        mLocal.on('click', 'clusters', (e?: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
          if (!e || !e.point || !mLocal) return;
          const features = mLocal.queryRenderedFeatures(e.point, { layers: ['clusters'] });
          const clusterFeature = features && features[0];
          if (!clusterFeature || !clusterFeature.properties) return;
          
          const clusterId = clusterFeature.properties.cluster_id;
          const source = mLocal.getSource('stations') as maplibregl.GeoJSONSource;
          
          if (source && typeof source.getClusterExpansionZoom === 'function') {
            // Explicitly cast to any to resolve argument count mismatch in MapLibre TS definitions
            (source as any).getClusterExpansionZoom(clusterId, (err: any, zoom?: number) => {
              if (err || zoom === undefined) return;
              
              if (clusterFeature.geometry.type === 'Point') {
                const coords = clusterFeature.geometry.coordinates as [number, number];
                mLocal.easeTo({ center: coords, zoom });
              }
            });
          }
        });
      }

      m.on('mouseenter', 'unclustered-point', () => m.getCanvas().style.cursor = 'crosshair');
      m.on('mouseleave', 'unclustered-point', () => m.getCanvas().style.cursor = '');

      setMapLoaded(true);
    });
  }, [setSelectedStation]);

  // Effect: Sync Data
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;
    const source = m.getSource('stations') as maplibregl.GeoJSONSource;
    if (source) {
      const features = stations.map(s => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [s.lon || 0, s.lat || 0] },
        properties: { ...s, 'marker-color': riskColor(s.danger_m > 0 ? (s.current_water_level_m / s.danger_m) : 0) }
      }));
      source.setData({ type: 'FeatureCollection', features });
    }
  }, [stations, mapLoaded]);

  // Effect: Synchronize HUD Controls
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;
    m.setLayoutProperty('wris-basins-layer', 'visibility', activeLayers.basins ? 'visible' : 'none');
    m.setLayoutProperty('wris-rivers-layer', 'visibility', activeLayers.rivers ? 'visible' : 'none');
    m.setLayoutProperty('unclustered-point', 'visibility', activeLayers.stations ? 'visible' : 'none');
    m.setLayoutProperty('clusters', 'visibility', activeLayers.stations ? 'visible' : 'none');
    m.setLayoutProperty('cluster-count', 'visibility', activeLayers.stations ? 'visible' : 'none');
  }, [activeLayers, mapLoaded]);

  return (
    <div className="relative w-full h-full group bg-slate-900 overflow-hidden font-auth cursor-default">
      <div ref={mapContainer} className="absolute inset-0 grayscale-[0.2]" />
      
      {/* HUD: Intelligence Layer Panel */}
      <div className="absolute top-10 left-10 z-10 flex flex-col gap-1 shadow-[12px_12px_0_rgba(15,23,42,0.1)] border-4 border-slate-900">
        {[
          { id: 'stations', icon: MapPin, label: 'Sector Gauges', active: activeLayers.stations },
          { id: 'rivers',  icon: Waves,  label: 'WRIS Rivers', active: activeLayers.rivers },
          { id: 'basins',  icon: SelectionIcon, label: 'CWC Basins', active: activeLayers.basins },
        ].map(l => (
          <button
            key={l.id}
            onClick={() => setActiveLayers(prev => ({ ...prev, [l.id]: !(prev as any)[l.id] }))}
            className={`px-6 py-4 transition-all flex items-center gap-4 bg-white border-b-2 border-slate-100 last:border-b-0 ${
              l.active ? 'text-sky-600 bg-sky-50' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <l.icon size={20} weight={l.active ? 'fill' : 'bold'} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{l.label}</span>
          </button>
        ))}
      </div>

      {/* HUD: Map Controls */}
      <div className="absolute bottom-10 left-10 z-10 flex flex-col gap-4">
         <div className="flex flex-col bg-white border-4 border-slate-900 shadow-[8px_8px_0_rgba(15,23,42,0.1)]">
            <button onClick={() => map.current?.zoomIn()} className="p-4 text-slate-900 hover:bg-sky-50 transition-colors border-b-2 border-slate-100"><Plus size={20} weight="bold" /></button>
            <button onClick={() => map.current?.zoomOut()} className="p-4 text-slate-900 hover:bg-sky-50 transition-colors"><Minus size={20} weight="bold" /></button>
         </div>
         <button 
           onClick={() => map.current?.easeTo({ center: INDIA_CENTER as [number, number], zoom: 5 })}
           className="p-5 bg-white border-4 border-slate-900 text-slate-900 hover:bg-sky-500 hover:text-white transition-all shadow-[8px_8px_0_rgba(15,23,42,0.1)]"
         >
           <Globe size={24} weight="bold" />
         </button>
      </div>

      {/* HUD: Legend */}
      <div className="absolute bottom-10 right-10 z-10">
        <div className="bg-white border-4 border-slate-900 p-8 shadow-[12px_12px_0_rgba(15,23,42,0.1)] w-80">
          <div className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em] mb-8 border-b-4 border-sky-500 pb-2">Sector Thresholds</div>
          <div className="space-y-4">
             {[
               { label: 'Critical Violation', color: '#EF4444', desc: 'Sector Breach' },
               { label: 'Warning Active', color: '#EAB308', desc: 'Surge Detected' },
               { label: 'Nominal Flow', color: '#0EA5E9', desc: 'Secure Telemetry' },
               { label: 'Idle Node', color: '#94A3B8', desc: 'No Registry' }
             ].map(l => (
               <div key={l.label} className="group/item">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 border-2 border-slate-900" style={{ background: l.color }} />
                    <div className="flex-1">
                      <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">{l.label}</div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase mt-1 italic">{l.desc}</div>
                    </div>
                  </div>
               </div>
             ))}
          </div>
          <div className="h-0.5 bg-slate-100 my-8" />
          <div className="flex items-center justify-between">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authority // WRIS_REST</span>
             <Info size={16} weight="bold" />
          </div>
        </div>
      </div>

      {/* HUD: Registry Count */}
      <div className="absolute top-10 right-10 z-10">
         <div className="bg-white border-4 border-slate-900 px-6 py-4 flex items-center gap-4 shadow-[8px_8px_0_rgba(15,23,42,0.1)]">
            <div className={`w-3 h-3 ${stationsLoading ? 'bg-amber-500 animate-pulse' : 'bg-sky-500'}`} />
            <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">
              {stationsLoading ? 'Polling Database...' : `${stations.length.toLocaleString()} Authoritative Nodes`}
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

export default LiveMap;
