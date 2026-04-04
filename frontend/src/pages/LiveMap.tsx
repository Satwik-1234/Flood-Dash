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
  Target,
  Search
} from 'lucide-react';
import { 
  useCWCStationCatalog, 
  useCWCLiveLevels, 
  useHydrograph,
  useIMDDistrictWarnings
} from '../hooks/useTelemetry';
import { clsx } from 'clsx';
import Hydrograph from '../components/charts/Hydrograph';

const LiveMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  
  const { data: stations = [] } = useCWCStationCatalog();
  const { data: levels = [] } = useCWCLiveLevels();
  const { data: imdWarnings = [] } = useIMDDistrictWarnings();
  
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [showLayers, setShowLayers] = useState(false);
  
  const [layers, setLayers] = useState({
    stations: true,
    basins: true,
    districts: true,
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
      // Add Sources
      map.current?.addSource('basins', { type: 'geojson', data: '/geo/basin_cwc.geojson' });
      map.current?.addSource('districts', { type: 'geojson', data: '/geo/india_districts.geojson' });
      
      // District Warning Layer (IMD)
      map.current?.addLayer({
        id: 'districts-fill',
        type: 'fill',
        source: 'districts',
        layout: { visibility: layers.districts ? 'visible' : 'none' },
        paint: {
          'fill-color': '#ffffff',
          'fill-opacity': 0
        }
      });

      // Basins Layer
      map.current?.addLayer({
        id: 'basins-fill',
        type: 'fill',
        source: 'basins',
        layout: { visibility: layers.basins ? 'visible' : 'none' },
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.05
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
          'line-opacity': 0.2
        }
      });
    });

    return () => map.current?.remove();
  }, []);

  // 2. Sync Layer Visibility & IMD Data Coloring
  useEffect(() => {
    if (!map.current?.isStyleLoaded()) return;
    map.current.setLayoutProperty('basins-fill', 'visibility', layers.basins ? 'visible' : 'none');
    map.current.setLayoutProperty('basins-outline', 'visibility', layers.basins ? 'visible' : 'none');
    map.current.setLayoutProperty('districts-fill', 'visibility', layers.districts ? 'visible' : 'none');

    if (layers.districts) {
      // Apply IMD colors to districts
      const warningMap: Record<string, string> = {};
      imdWarnings.forEach((w: any) => {
        const color = w.severity === 'EXTREME' ? '#ef4444' : w.severity === 'SEVERE' ? '#f59e0b' : '#facc15';
        warningMap[w.district.toUpperCase()] = color;
      });

      map.current.setPaintProperty('districts-fill', 'fill-color', [
        'match',
        ['upcase', ['get', 'DISTRICT']],
        ...Object.entries(warningMap).flat(),
        'transparent'
      ]);
      map.current.setPaintProperty('districts-fill', 'fill-opacity', [
        'match',
        ['upcase', ['get', 'DISTRICT']],
        ...Object.entries(warningMap).map(([k]) => [k, 0.2]).flat(),
        0
      ]);
    }
  }, [layers, imdWarnings]);

  // 3. Render Custom Markers for CWC Stations
  const markers = useMemo(() => {
    if (!layers.stations) return [];
    const levelMap = new Map(levels.map(l => [l.stationCode, l]));
    return stations.map(s => {
      const live = levelMap.get(s.code);
      const isExtreme = live && live.latestDataValue >= s.danger_m;
      const isWarning = live && live.latestDataValue >= s.warning_m;
      return { ...s, live, status: isExtreme ? 'danger' : isWarning ? 'warning' : 'ok' };
    });
  }, [stations, levels, layers.stations]);

  const [activeMarkers, setActiveMarkers] = useState<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!map.current) return;
    activeMarkers.forEach(m => m.remove());
    const newMarkers = markers
      .filter((_, i) => i % 5 === 0)
      .map(s => {
        const el = document.createElement('div');
        el.className = `station-marker w-2 h-2 rounded-full border border-white/20 shadow-lg ${
          s.status === 'danger' ? 'bg-accent-red animate-pulse' : 
          s.status === 'warning' ? 'bg-accent-amber' : 'bg-accent-cyan'
        }`;
        const marker = new maplibregl.Marker(el).setLngLat([s.lon, s.lat]).addTo(map.current!);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedStation(s);
          map.current?.flyTo({ center: [s.lon, s.lat], zoom: 8, essential: true });
        });
        return marker;
      });
    setActiveMarkers(newMarkers);
  }, [markers]);

  return (
    <div className="relative w-full h-full bg-[#020617]">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Analytical UI Overlays */}
      <div className="absolute top-8 left-8 flex flex-col gap-4 z-50">
         <div className="glass-panel px-4 py-3 rounded-2xl flex items-center gap-3 border-white/10">
            <Search className="w-4 h-4 text-t3" />
            <input 
              type="text" 
              placeholder="Analysis Search..."
              className="bg-transparent text-xs font-semibold text-white focus:outline-none w-48"
            />
         </div>
      </div>

      {/* Layer Analytics Control */}
      <div className={clsx(
        "absolute top-8 right-8 z-50 transition-all duration-500 transform",
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
                <span className="text-[10px] font-bold tracking-[0.2em] text-t3 uppercase">Analytical Layers</span>
                <Layers className="w-4 h-4 text-accent-cyan/60" />
              </div>
              <div className="space-y-1">
                {[
                  { id: 'stations', icon: Target, label: 'Hydro Telemetry' },
                  { id: 'districts', icon: CloudRain, label: 'Meteo Warnings' },
                  { id: 'basins', icon: MapIcon, label: 'Basin Context' },
                  { id: 'radar', icon: CloudRain, label: 'Radar Integration' },
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

      {/* Station Profile Inspector */}
      {selectedStation && (
        <StationProfile 
          station={selectedStation} 
          onClose={() => setSelectedStation(null)} 
        />
      )}

      {/* Legend */}
      <div className="absolute bottom-10 left-8 z-50 glass-panel p-5 rounded-2xl flex flex-col gap-3 min-w-[200px] border-white/5">
        <div className="text-[10px] font-bold tracking-[0.2em] text-t3 uppercase mb-1">Status Classification</div>
        {[
          { color: 'bg-accent-red', label: 'Anomalous Entry' },
          { color: 'bg-accent-amber', label: 'Observation Alert' },
          { color: 'bg-accent-cyan', label: 'Baseline Flow' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-3 text-[11px] font-medium text-t2">
            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* --- SUBCOMPONENTS --- */

const StationProfile: React.FC<{ station: any; onClose: () => void }> = ({ station, onClose }) => {
  const { data: trend } = useHydrograph(station.code);

  return (
    <div className="absolute right-8 top-8 bottom-8 w-96 z-[100] animate-slideInRight">
      <div className="h-full glass-panel rounded-3xl p-6 flex flex-col overflow-hidden border-white/10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              station.status === 'danger' ? 'bg-accent-red' : 
              station.status === 'warning' ? 'bg-accent-amber' : 'bg-accent-cyan'
            }`} />
            <span className="text-[10px] font-bold tracking-widest text-t3 uppercase">Analysis Sector</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-t2">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <h2 className="heading-display text-2xl text-white mb-1">{station.name}</h2>
        <div className="flex items-center gap-2 text-xs text-t2 mb-10">
          <Info className="w-3.5 h-3.5 opacity-40" />
          <span>{station.river} River · {station.basin}</span>
        </div>

        {/* Level Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-10">
           <MetricCard label="OBSERVED LEVEL" value={station.live?.latestDataValue?.toFixed(2) || '0.00'} unit="m" />
           <MetricCard label="HHS INDEX" value={station.danger_m} unit="m" color="text-accent-red" />
        </div>

        {/* Trend Analysis */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-[10px] font-bold text-t3 uppercase tracking-widest">24h Variance History</span>
            <span className="text-[9px] font-mono text-accent-cyan opacity-60">REF: {station.code}</span>
          </div>
          <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
            <Hydrograph 
              data={trend || []} 
              warningLevel={station.warning_m} 
              dangerLevel={station.danger_m}
              height={180}
            />
          </div>
        </div>

        <div className="mt-8 flex gap-3">
            <button className="flex-1 py-4 bg-accent-blue/10 text-accent-blue border border-accent-blue/20 rounded-2xl text-[10px] font-bold tracking-widest hover:bg-accent-blue hover:text-white transition-all">
                EXPORT DATA
            </button>
            <button className="px-4 bg-white/5 text-white border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                <Satellite className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: any; unit: string; color?: string }> = ({ label, value, unit, color }) => (
  <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
    <span className="text-[8px] font-bold text-t3 uppercase tracking-[0.2em] block mb-2">{label}</span>
    <div className="flex items-baseline gap-1">
      <span className={clsx("text-2xl font-bold font-display", color || "text-white")}>{value}</span>
      <span className="text-[10px] font-mono text-t3">{unit}</span>
    </div>
  </div>
);

export default LiveMap;
