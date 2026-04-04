import React, { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Layers, 
  Map as MapIcon, 
  Satellite, 
  Waves, 
  CloudRain, 
  Info,
  ChevronRight,
  Target
} from 'lucide-react';
import { 
  useCWCStationCatalog, 
  useCWCLiveLevels, 
  useHydrograph 
} from '../../hooks/useTelemetry';
import { clsx } from 'clsx';
import Hydrograph from '../charts/Hydrograph';

const LiveMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  
  const { data: stations = [] } = useCWCStationCatalog();
  const { data: levels = [] } = useCWCLiveLevels();
  
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [showLayers, setShowLayers] = useState(false);
  
  const [layers, setLayers] = useState({
    stations: true,
    basins: true,
    rivers: false,
    radar: false
  });

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [78.9629, 22.5937],
      zoom: 4.5,
      antialias: true
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.current.on('load', () => {
      // Add Basins Layer
      map.current?.addSource('basins', {
        type: 'geojson',
        data: '/geo/basin_cwc.geojson'
      });
      
      map.current?.addLayer({
        id: 'basins-fill',
        type: 'fill',
        source: 'basins',
        layout: { visibility: layers.basins ? 'visible' : 'none' },
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.2,
            0.05
          ]
        }
      });

      map.current?.addLayer({
        id: 'basins-outline',
        type: 'line',
        source: 'basins',
        layout: { visibility: layers.basins ? 'visible' : 'none' },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 1,
          'line-opacity': 0.3
        }
      });
    });

    return () => map.current?.remove();
  }, []);

  // 2. Sync Layers
  useEffect(() => {
    if (!map.current?.isStyleLoaded()) return;
    map.current.setLayoutProperty('basins-fill', 'visibility', layers.basins ? 'visible' : 'none');
    map.current.setLayoutProperty('basins-outline', 'visibility', layers.basins ? 'visible' : 'none');
  }, [layers.basins]);

  // 3. Render Custom Markers (React-based to allow for complex UI)
  const markers = useMemo(() => {
    if (!layers.stations) return [];
    
    const levelMap = new Map(levels.map(l => [l.stationCode, l]));
    
    return stations.map(s => {
      const live = levelMap.get(s.code);
      const isExtreme = live && live.latestDataValue >= s.danger_m;
      const isWarning = live && live.latestDataValue >= s.warning_m;
      
      return {
        ...s,
        live,
        status: isExtreme ? 'danger' : isWarning ? 'warning' : 'ok'
      };
    });
  }, [stations, levels, layers.stations]);

  const [activeMarkers, setActiveMarkers] = useState<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!map.current) return;
    
    // Clear old markers
    activeMarkers.forEach(m => m.remove());
    
    // Create new ones (limit for performance in this high-level view)
    const newMarkers = markers
      .filter((_, i) => i % 5 === 0) // Only subset for demo performance
      .map(s => {
        const el = document.createElement('div');
        el.className = `station-marker w-2 h-2 rounded-full border border-white/20 shadow-lg ${
          s.status === 'danger' ? 'bg-accent-red animate-pulse' : 
          s.status === 'warning' ? 'bg-accent-amber' : 
          'bg-accent-cyan'
        }`;
        
        const marker = new maplibregl.Marker(el)
          .setLngLat([s.lon, s.lat])
          .addTo(map.current!);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedStation(s);
          map.current?.flyTo({
            center: [s.lon, s.lat],
            zoom: 8,
            essential: true
          });
        });

        return marker;
      });

    setActiveMarkers(newMarkers);
  }, [markers]);

  return (
    <div className="relative w-full h-full bg-[#020617]">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Layer Controller */}
      <div className={clsx(
        "absolute top-6 right-6 z-50 transition-all duration-500 transform",
        showLayers ? "w-64" : "w-12 h-12"
      )}>
        <button 
          onClick={() => setShowLayers(!showLayers)}
          className={clsx(
            "glass-panel rounded-xl flex items-center justify-center transition-all",
            showLayers ? "p-4 w-full h-auto" : "w-12 h-12"
          )}
        >
          {showLayers ? (
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold tracking-[0.2em] text-t3 uppercase">GIS Control</span>
                <Layers className="w-4 h-4 text-accent-cyan" />
              </div>
              <div className="space-y-1">
                {[
                  { id: 'stations', icon: Target, label: 'Telemetry' },
                  { id: 'basins', icon: MapIcon, label: 'CWC Basins' },
                  { id: 'radar', icon: CloudRain, label: 'Radar Mix' },
                ].map(l => (
                  <label key={l.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <l.icon className="w-4 h-4 text-t2" />
                      <span className="text-xs font-semibold text-t1">{l.label}</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="accent-accent-cyan"
                      checked={(layers as any)[l.id]}
                      onChange={() => setLayers(prev => ({ ...prev, [l.id]: !(prev as any)[l.id] }))}
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <Layers className="w-5 h-5 text-t2" />
          )}
        </button>
      </div>

      {/* Detail Overlay Panel */}
      {selectedStation && (
        <StationInspector 
          station={selectedStation} 
          onClose={() => setSelectedStation(null)} 
        />
      )}

      {/* Legend */}
      <div className="absolute bottom-10 left-6 z-50 glass-panel p-4 rounded-2xl flex flex-col gap-3 min-w-[180px]">
        <div className="text-[10px] font-bold tracking-widest text-t3 uppercase mb-1">Risk Indices</div>
        {[
          { color: 'bg-accent-red', label: 'Extreme Warning' },
          { color: 'bg-accent-amber', label: 'Warning Status' },
          { color: 'bg-accent-cyan', label: 'Normal Flow' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-3 text-[11px] font-medium">
            <div className={`w-3 h-3 rounded-full ${item.color}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* --- SUBCOMPONENTS --- */

const StationInspector: React.FC<{ station: any; onClose: () => void }> = ({ station, onClose }) => {
  const { data: trend } = useHydrograph(station.code);

  return (
    <div className="absolute right-6 top-6 bottom-6 w-96 z-[100] animate-slideInRight">
      <div className="h-full glass-panel rounded-3xl p-6 flex flex-col overflow-hidden border-accent-blue/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              station.status === 'danger' ? 'bg-accent-red pulse-cyan' : 
              station.status === 'warning' ? 'bg-accent-amber' : 'bg-accent-cyan'
            }`} />
            <span className="text-[10px] font-bold tracking-widest text-t3 uppercase">Telemetry Active</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-t2">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <h2 className="heading-display text-2xl text-white mb-1">{station.name}</h2>
        <div className="flex items-center gap-2 text-xs text-t2 mb-8">
          <Info className="w-3 h-3" />
          <span>{station.river} River · {station.basin}</span>
        </div>

        {/* Level KPI */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-[9px] font-bold text-t3 uppercase tracking-[0.2em] block mb-1">Current Level</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white font-display">
                {station.live?.latestDataValue?.toFixed(2) || '0.00'}
              </span>
              <span className="text-[10px] font-mono text-t2">m</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-[9px] font-bold text-t3 uppercase tracking-[0.2em] block mb-1">Danger Mark</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-accent-red font-display">{station.danger_m}</span>
              <span className="text-[10px] font-mono text-t2">m</span>
            </div>
          </div>
        </div>

        {/* 24h Hydrograph */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-t3 uppercase tracking-widest">24H Hydrograph Trend</span>
            <span className="text-[9px] font-mono text-accent-cyan">STATION: {station.code}</span>
          </div>
          <div className="bg-slate-900/40 rounded-2xl p-4 border border-white/5">
            <Hydrograph 
              data={trend || []} 
              warningLevel={station.warning_m} 
              dangerLevel={station.danger_m}
              height={180}
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/5 flex gap-2">
            <button className="flex-1 py-3 bg-accent-blue/10 text-accent-blue border border-accent-blue/20 rounded-xl text-xs font-bold tracking-widest hover:bg-accent-blue hover:text-white transition-all">
                REQUEST FORECAST
            </button>
            <button className="px-4 bg-white/5 text-white border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                <Satellite className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
