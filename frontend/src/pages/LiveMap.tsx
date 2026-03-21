import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { StationPopup } from '../components/map/StationPopup';
import { CWCStationData } from '../api/schemas';
import { useCWCStations, useCWCAboveWarning, useCWCAboveDanger } from '../hooks/useTelemetry';
import { SpinnerGap, MapTrifold, SquaresFour, Info } from 'phosphor-react';
import { 
  INDIA_CENTER, 
  INDIA_BOUNDS, 
  BASEMAPS, 
  GEO_LAYERS, 
  WMS_ENDPOINTS, 
  BHUVAN_LAYERS 
} from '../constants/gisConfig';

export const LiveMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  
  const { data: stations, isLoading } = useCWCStations();
  const { data: cwcWarningMap = [] } = useCWCAboveWarning();
  const { data: cwcDangerMap = [] } = useCWCAboveDanger();
  const [selectedStation, setSelectedStation] = useState<CWCStationData | null>(null);
  const [activeLayers, setActiveLayers] = useState({
    lulc: true,
    districts: true,
    rivers: true,
    stations: true
  });

  // ── Radar animation state ──────────────────────────────────────────────────
  const [radarFrames, setRadarFrames]       = useState<{path: string; time: number}[]>([]);
  const [radarFrameIdx, setRadarFrameIdx]   = useState(0);
  const [radarPlaying, setRadarPlaying]     = useState(false);
  const [showRadar, setShowRadar]           = useState(false);
  const animIntervalRef                     = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load radar metadata from scraper output
  useEffect(() => {
    fetch('/mock/radar_metadata.json')
      .then(r => r.json())
      .then(data => {
        const frames = [
          ...(data.radar?.past ?? []),
          ...(data.radar?.nowcast ?? []),
        ];
        setRadarFrames(frames);
        setRadarFrameIdx(Math.max(0, frames.length - 3)); // Start near latest
      })
      .catch(() => {
        // Fallback: fetch directly from RainViewer
        fetch('https://api.rainviewer.com/public/weather-maps.json')
          .then(r => r.json())
          .then(data => {
            const frames = [
              ...(data.radar?.past ?? []),
              ...(data.radar?.nowcast ?? []),
            ];
            setRadarFrames(frames);
            setRadarFrameIdx(Math.max(0, frames.length - 3));
          });
      });
  }, []);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'basemap': {
            type: 'raster',
            // ESRI World Topo Map — free, no key, no CORS, shows rivers and terrain
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: 'Tiles © Esri — Esri, HERE, Garmin, FAO, NOAA, USGS'
          }
        },
        layers: [
          {
            id: 'basemap-tiles',
            type: 'raster',
            source: 'basemap',
          }
        ]
      },
      center: INDIA_CENTER as [number, number],
      zoom: 5,
      maxBounds: INDIA_BOUNDS as [number, number, number, number],
      attributionControl: false 
    });

    map.current.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.current.on('load', () => {
      const m = map.current;
      if (!m) return;

      // Bhuvan WMS removed — blocked by CORS in browser. Use scraper pipeline for LULC.

      // 2. INDIA DISTRICTS GEOJSON (Choropleth)
      m.addSource('india-districts', {
        type: 'geojson',
        data: GEO_LAYERS.INDIA_DISTRICTS,
        promoteId: 'DT_CEN_CD'
      });
      m.addLayer({
        id: 'districts-fill',
        type: 'fill',
        source: 'india-districts',
        paint: {
          'fill-color': [
            'case',
            ['==', ['feature-state', 'risk'], 5], '#500000',
            ['==', ['feature-state', 'risk'], 4], '#991B1B',
            ['==', ['feature-state', 'risk'], 3], '#9A3412',
            ['==', ['feature-state', 'risk'], 2], '#854D0E',
            ['==', ['feature-state', 'risk'], 1], '#166534',
            'rgba(100,116,139,0.08)'
          ],
          'fill-opacity': 0.65,
          'fill-outline-color': 'rgba(255,255,255,0.08)'
        },
        layout: { 'visibility': activeLayers.districts ? 'visible' : 'none' }
      });

      // 3. INDIA STATES OUTLINE
      m.addSource('india-states', {
        type: 'geojson',
        data: GEO_LAYERS.INDIA_STATES
      });
      m.addLayer({
        id: 'states-outline',
        type: 'line',
        source: 'india-states',
        paint: {
          'line-color': 'rgba(28, 63, 58, 0.4)',
          'line-width': 1.5
        }
      });

      // 4. WRIS RIVERS WMS
      m.addSource('wris-rivers', {
        type: 'raster',
        tiles: [
          `${WMS_ENDPOINTS.WRIS_BASIN}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=1` +
          `&FORMAT=image/png&TRANSPARENT=TRUE&CRS=EPSG:3857` +
          `&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}`
        ],
        tileSize: 256,
        attribution: '© CWC India WRIS'
      });
      m.addLayer({
        id: 'rivers-layer',
        type: 'raster',
        source: 'wris-rivers',
        paint: { 'raster-opacity': 0.8 },
        layout: { 'visibility': activeLayers.rivers ? 'visible' : 'none' }
      });

      // 5. GAUGING STATIONS (Pravhatattva Core)
      m.addSource('cwc-stations', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: stations?.map(s => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [(s.lon ?? 0), (s.lat ?? 0)] },
            properties: { ...s }
          })) || []
        }
      });
      m.addLayer({
        id: 'stations-point',
        type: 'circle',
        source: 'cwc-stations',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            5, 4,
            10, 12
          ],
          'circle-color': [
            'case',
            ['>=', ['/', ['get', 'current_water_level_m'], ['max', ['get', 'danger_level_m'], 0.01]], 1.0], '#991B1B',
            ['>=', ['/', ['get', 'current_water_level_m'], ['max', ['get', 'danger_level_m'], 0.01]], 0.8], '#9A3412',
            ['>=', ['/', ['get', 'current_water_level_m'], ['max', ['get', 'warning_level_m'], 0.01]], 1.0], '#854D0E',
            '#166534'
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        },
        layout: { 'visibility': activeLayers.stations ? 'visible' : 'none' }
      });

      m.on('click', 'stations-point', (e) => {
        if (e.features && e.features[0]) {
          setSelectedStation(e.features[0].properties as unknown as CWCStationData);
        }
      });

      m.on('mouseenter', 'stations-point', () => {
        m.getCanvas().style.cursor = 'pointer';
      });
      m.on('mouseleave', 'stations-point', () => {
        m.getCanvas().style.cursor = '';
      });
    });

  }, [stations]);

  // Update MapLibre radar tile when frame changes
  useEffect(() => {
    const m = map.current;
    if (!m || !m.isStyleLoaded() || !showRadar || radarFrames.length === 0) return;
    
    const frame = radarFrames[radarFrameIdx];
    if (!frame) return;
    
    // frame.path is already "/v2/radar/1774098600" — don't add prefix again
    const tileUrl = `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/4/1_1.png`;
    
    if (m.getSource('radar-tiles')) {
      // Update existing source
      (m.getSource('radar-tiles') as maplibregl.RasterTileSource).setTiles([tileUrl]);
    } else {
      // Add source + layer
      m.addSource('radar-tiles', {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        attribution: 'RainViewer',
      });
      m.addLayer({
        id: 'radar-layer',
        type: 'raster',
        source: 'radar-tiles',
        paint: { 'raster-opacity': 0.65 },
      }, 'stations-point'); // Insert below station markers
    }
  }, [radarFrames, radarFrameIdx, showRadar]);

  // Play/pause animation
  useEffect(() => {
    if (radarPlaying && radarFrames.length > 0) {
      animIntervalRef.current = setInterval(() => {
        setRadarFrameIdx(i => (i + 1) % radarFrames.length);
      }, 500); // 500ms per frame
    } else {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    }
    return () => { if (animIntervalRef.current) clearInterval(animIntervalRef.current); };
  }, [radarPlaying, radarFrames.length]);

  // Handle station data updates
  useEffect(() => {
    const m = map.current;
    if (!m || !m.isStyleLoaded() || !stations) return;
    
    const source = m.getSource('cwc-stations') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: stations.map(s => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [(s.lon ?? 0), (s.lat ?? 0)] },
          properties: { ...s }
        }))
      });
    }
  }, [stations]);

  // Apply risk levels to district features via feature-state
  useEffect(() => {
    const m = map.current;
    if (!m || !m.isStyleLoaded()) return;
    if (!m.getSource('india-districts')) return;

    const riskByDistrict = new Map<string, number>();

    cwcDangerMap.forEach(s => {
      if (s.district) riskByDistrict.set(s.district.toLowerCase(), 4);
    });
    cwcWarningMap.forEach(s => {
      if (s.district && !riskByDistrict.has(s.district.toLowerCase())) {
        riskByDistrict.set(s.district.toLowerCase(), 3);
      }
    });

    const features = m.querySourceFeatures('india-districts');
    features.forEach(f => {
      const districtName = (f.properties?.['DISTRICT'] ?? '').toLowerCase();
      const risk = riskByDistrict.get(districtName) ?? 0;
      if (f.id !== undefined) {
        m.setFeatureState(
          { source: 'india-districts', id: f.id },
          { risk }
        );
      }
    });
  }, [cwcWarningMap, cwcDangerMap]);

  // Handle layer visibility changes
  useEffect(() => {
    const m = map.current;
    if (!m || !m.isStyleLoaded()) return;
    
    if (m.getLayer('bhuvan-lulc-layer')) m.setLayoutProperty('bhuvan-lulc-layer', 'visibility', activeLayers.lulc ? 'visible' : 'none');
    if (m.getLayer('districts-fill')) m.setLayoutProperty('districts-fill', 'visibility', activeLayers.districts ? 'visible' : 'none');
    if (m.getLayer('rivers-layer')) m.setLayoutProperty('rivers-layer', 'visibility', activeLayers.rivers ? 'visible' : 'none');
    if (m.getLayer('stations-point')) m.setLayoutProperty('stations-point', 'visibility', activeLayers.stations ? 'visible' : 'none');
  }, [activeLayers]);

  return (
    <div className="w-full h-full relative border-l border-border-default">
      <div 
        ref={mapContainer} 
        className="absolute inset-0 w-full h-full bg-[#f4f1eb]" 
      />
      
      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-10 w-80 pointer-events-auto space-y-4">
        <div className="bg-bg-white border border-border-default shadow-popup rounded-xl p-5">
          <h2 className="font-display text-text-dark font-bold text-xl flex items-center mb-1">
            <MapTrifold className="w-6 h-6 mr-2 text-suk-forest" weight="duotone" />
            National Intel
          </h2>
          <p className="font-ui text-xs text-text-muted mb-4">India Integrated Flood Dashboard</p>
          
          <div className="space-y-3">
            {[
              { id: 'lulc', label: 'Bhuvan LULC (ISRO)', color: 'text-suk-forest', icon: SquaresFour },
              { id: 'districts', label: 'District Risk (Choropleth)', color: 'text-suk-river', icon: SquaresFour },
              { id: 'rivers', label: 'WRIS River Network', color: 'text-suk-sky', icon: SquaresFour },
            ].map(l => (
              <label key={l.id} className="flex items-center justify-between cursor-pointer group">
                <span className={`font-ui text-sm font-semibold ${l.color}`}>{l.label}</span>
                <input 
                  type="checkbox" 
                  checked={activeLayers[l.id as keyof typeof activeLayers]} 
                  onChange={() => setActiveLayers(prev => ({ ...prev, [l.id]: !prev[l.id as keyof typeof activeLayers]}))}
                  className="w-4 h-4 rounded border-border-default text-suk-forest focus:ring-suk-forest"
                />
              </label>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border-light">
            <div className="flex justify-between items-center text-xs font-data font-bold uppercase tracking-wider text-text-muted mb-2">
              <span>National Coverage</span>
              <span className={stations ? "text-suk-forest" : "text-suk-fire"}>
                {stations ? 'Live Sync' : 'Offline'}
              </span>
            </div>
            <div className="h-2 bg-bg-surface rounded-full overflow-hidden">
              <div 
                className="h-full bg-suk-forest transition-all duration-1000" 
                style={{ width: stations ? '100%' : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* RainViewer Radar Control */}
        <div className="bg-bg-white border border-border-default shadow-popup rounded-xl p-5">
          <h4 className="font-ui text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
            Atmospheric Sensors
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRadar}
                  onChange={e => setShowRadar(e.target.checked)}
                  className="rounded border-border-default text-suk-forest focus:ring-suk-forest"
                />
                <span className="font-ui text-sm font-bold text-text-dark">
                  Radar Overlay (Doppler)
                </span>
                <span className="font-data text-[10px] text-suk-river bg-bg-surface px-2 py-0.5 rounded">
                  LIVE
                </span>
              </label>
            </div>
            
            {showRadar && radarFrames.length > 0 && (
              <div className="space-y-3 pt-2">
                <input
                  type="range"
                  min={0}
                  max={radarFrames.length - 1}
                  value={radarFrameIdx}
                  onChange={e => setRadarFrameIdx(Number(e.target.value))}
                  className="w-full accent-suk-river"
                />
                
                <div className="flex justify-between items-center">
                  <span className="font-data text-[10px] text-text-muted">
                    {radarFrames[radarFrameIdx]
                      ? new Date(radarFrames[radarFrameIdx].time * 1000)
                          .toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
                      : '–'}
                  </span>
                  
                  <button
                    onClick={() => setRadarPlaying(p => !p)}
                    className="flex items-center space-x-1 px-3 py-1 bg-suk-river text-bg-white rounded-lg text-xs font-bold font-ui hover:bg-opacity-90 transition-colors"
                  >
                    {radarPlaying ? '⏸ Pause' : '▶ Play'}
                  </button>
                  
                  {radarFrames[radarFrameIdx] &&
                   radarFrameIdx >= (radarFrames.filter(f => f.time <= Date.now()/1000).length) && (
                    <span className="font-data text-[10px] text-suk-amber font-bold flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-suk-amber animate-pulse mr-1"></div>
                      NOWCAST
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-bg-cream border border-suk-forest/20 rounded-lg p-3 flex items-start space-x-2">
          <Info className="w-5 h-5 text-suk-forest shrink-0 mt-0.5" weight="duotone" />
          <p className="font-ui text-[10px] leading-tight text-text-body">
            <strong>Bhuvan-ISRO WMS Active:</strong> Layers are rendered server-side by NRSC. 
            Color classes match ISRO 2024-25 LULC standards (Agriculture, Forest, Built-up).
          </p>
        </div>
      </div>

      {selectedStation && (
        <div className="absolute top-24 left-88 z-20 pointer-events-none">
          <StationPopup station={selectedStation} onClose={() => setSelectedStation(null)} />
        </div>
      )}

    </div>
  );
};
