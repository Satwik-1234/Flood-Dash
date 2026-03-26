import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { StationPopup } from '../components/map/StationPopup';
import { CWCStationData } from '../api/schemas';
import {
  useCWCStations, useCWCAboveWarning, useCWCAboveDanger,
  useCWCInflowStations, useIMDWarnings
} from '../hooks/useTelemetry';
import { MapTrifold, Drop, CloudRain, Warning, X } from 'phosphor-react';
import {
  INDIA_CENTER, INDIA_BOUNDS, GEO_LAYERS, WMS_ENDPOINTS, BHUVAN_LAYERS
} from '../constants/gisConfig';

const riskColor = (ratio: number) => {
  if (ratio >= 1.0) return '#991B1B';
  if (ratio >= 0.85) return '#9A3412';
  return '#166534';
};

export const LiveMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const { data: stations    = [] } = useCWCStations();
  const { data: cwcWarning  = [] } = useCWCAboveWarning();
  const { data: cwcDanger   = [] } = useCWCAboveDanger();
  const { data: cwcInflow   = [] } = useCWCInflowStations();
  const { data: imdWarnings = [] } = useIMDWarnings();

  const [selectedStation,  setSelectedStation]  = useState<CWCStationData | null>(null);
  const [selectedState,    setSelectedState]    = useState<string | null>(null);
  const [showDistricts,    setShowDistricts]    = useState(true);
  const [showRivers,       setShowRivers]       = useState(true);
  const [showStations,     setShowStations]     = useState(true);
  const [radarFrames,      setRadarFrames]      = useState<{path: string; time: number}[]>([]);
  const [radarIdx,         setRadarIdx]         = useState(0);
  const [radarPlaying,     setRadarPlaying]     = useState(false);
  const [showRadar,        setShowRadar]        = useState(false);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        setRadarIdx(Math.max(0, frames.length - 3));
      })
      .catch(() => {
        fetch('https://api.rainviewer.com/public/weather-maps.json')
          .then(r => r.json())
          .then(data => {
            const frames = [
              ...(data.radar?.past ?? []),
              ...(data.radar?.nowcast ?? []),
            ];
            setRadarFrames(frames);
            setRadarIdx(Math.max(0, frames.length - 3));
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
      const m = map.current!;

      // ── River basin polygons (bottom layer) ───────────────────────────────
      m.addSource('india-basins', { type: 'geojson', data: GEO_LAYERS.INDIA_BASINS });
      m.addLayer({
        id: 'basins-fill',
        type: 'fill',
        source: 'india-basins',
        paint: { 'fill-color': ['get', 'fill_color'], 'fill-opacity': 0.07 },
      });
      m.addLayer({
        id: 'basins-outline',
        type: 'line',
        source: 'india-basins',
        paint: {
          'line-color': ['get', 'fill_color'],
          'line-width': 1.2,
          'line-opacity': 0.4,
          'line-dasharray': [4, 3],
        },
      });
      m.addLayer({
        id: 'basins-label',
        type: 'symbol',
        source: 'india-basins',
        minzoom: 5,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-font': ['Open Sans Regular'],
          'text-letter-spacing': 0.1,
          'text-transform': 'uppercase',
        },
        paint: {
          'text-color': ['get', 'fill_color'],
          'text-opacity': 0.65,
          'text-halo-color': 'rgba(255,255,255,0.9)',
          'text-halo-width': 1.5,
        },
      });

      // ── Districts choropleth ──────────────────────────────────────────────
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
        layout: { 'visibility': showDistricts ? 'visible' : 'none' }
      });

      // Districts outline
      m.addLayer({
        id: 'districts-outline',
        type: 'line',
        source: 'india-districts',
        paint: {
          'line-color': 'rgba(255,255,255,0.15)',
          'line-width': 0.5,
        },
        layout: { 'visibility': showDistricts ? 'visible' : 'none' }
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
        id: 'wris-rivers',
        type: 'raster',
        source: 'wris-rivers',
        paint: { 'raster-opacity': 0.8 },
        layout: { 'visibility': showRivers ? 'visible' : 'none' }
      });

      // ── CWC gauging stations (professional hydrological marker style) ──────
      m.addSource('cwc-stations', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      // Outer halo — glows for stations near/above warning
      m.addLayer({
        id: 'stations-halo',
        type: 'circle',
        source: 'cwc-stations',
        filter: ['>=', ['get', 'risk_ratio'], 0.85],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 10, 8, 17, 12, 24],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.18,
          'circle-stroke-width': 0,
        },
      });
      // Main circle
      m.addLayer({
        id: 'stations-point',
        type: 'circle',
        source: 'cwc-stations',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 5, 8, 8, 12, 12],
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#fff',
          'circle-opacity': 1,
        },
      });
      // Inner white dot — classic gauging point symbol
      m.addLayer({
        id: 'stations-inner',
        type: 'circle',
        source: 'cwc-stations',
        minzoom: 6,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 2, 10, 3, 14, 4],
          'circle-color': '#fff',
          'circle-opacity': 0.95,
        },
      });
      // Station labels
      m.addLayer({
        id: 'stations-label',
        type: 'symbol',
        source: 'cwc-stations',
        minzoom: 8,
        layout: {
          'text-field': ['get', 'station_name'],
          'text-size': 10,
          'text-font': ['Open Sans Regular'],
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#334155',
          'text-halo-color': '#fff',
          'text-halo-width': 1,
        },
      });

      m.on('click', 'stations-point', (e) => {
        if (e.features && e.features[0]) {
          setSelectedStation(e.features[0].properties as unknown as CWCStationData);
        }
      });

      m.on('click', 'districts-fill', (e) => {
        const f = e.features?.[0];
        if (f) {
          const stateName = (f.properties?.ST_NM ?? '') as string;
          setSelectedState(prev => prev === stateName ? null : stateName);
        }
      });
      m.on('mouseenter', 'districts-fill', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'districts-fill', () => { m.getCanvas().style.cursor = ''; });

      m.on('mouseenter', 'stations-point', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'stations-point', () => { m.getCanvas().style.cursor = ''; });
    });

  }, [stations]);

  // Update MapLibre radar tile when frame changes
  useEffect(() => {
    const m = map.current;
    if (!m || !m.isStyleLoaded() || !showRadar || radarFrames.length === 0) return;

    const frame = radarFrames[radarIdx];
    if (!frame) return;

    const tileUrl = `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/4/1_1.png`;

    if (m.getSource('radar-tiles')) {
      (m.getSource('radar-tiles') as maplibregl.RasterTileSource).setTiles([tileUrl]);
    } else {
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
      }, 'stations-point');
    }
  }, [radarFrames, radarIdx, showRadar]);

  // Play/pause animation
  useEffect(() => {
    if (radarPlaying && radarFrames.length > 0) {
      animRef.current = setInterval(() => {
        setRadarIdx(i => (i + 1) % radarFrames.length);
      }, 500);
    } else {
      if (animRef.current) clearInterval(animRef.current);
    }
    return () => { if (animRef.current) clearInterval(animRef.current); };
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
          properties: {
            ...s,
            color: riskColor(s.danger_level_m > 0 ? s.current_water_level_m / s.danger_level_m : 0),
            risk_ratio: s.danger_level_m > 0 ? s.current_water_level_m / s.danger_level_m : 0,
          }
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

    cwcDanger.forEach((s: any) => {
      if (s.district) riskByDistrict.set(s.district.toLowerCase(), 4);
    });
    cwcWarning.forEach((s: any) => {
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
  }, [cwcWarning, cwcDanger]);

  // Layer visibility
  useEffect(() => {
    const m = map.current;
    if (!m?.isStyleLoaded()) return;
    ['districts-fill', 'districts-outline'].forEach(id => {
      if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', showDistricts ? 'visible' : 'none');
    });
  }, [showDistricts]);

  useEffect(() => {
    const m = map.current;
    if (!m?.isStyleLoaded()) return;
    if (m.getLayer('rivers-line'))   m.setLayoutProperty('rivers-line',   'visibility', showRivers   ? 'visible' : 'none');
    if (m.getLayer('wris-rivers'))   m.setLayoutProperty('wris-rivers',   'visibility', showRivers   ? 'visible' : 'none');
  }, [showRivers]);

  useEffect(() => {
    const m = map.current;
    if (!m?.isStyleLoaded()) return;
    ['stations-halo','stations-point','stations-inner','stations-label'].forEach(id => {
      if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', showStations ? 'visible' : 'none');
    });
  }, [showStations]);

  // State panel: all data filtered to selected state
  const statePanelData = selectedState ? {
    cwcStations: (stations as any[]).filter(s => s.state === selectedState),
    cwcAtWarn:   (cwcWarning as any[]).filter(s => s.state === selectedState),
    cwcAtDanger: (cwcDanger  as any[]).filter(s => s.state === selectedState),
    reservoirs:  (cwcInflow  as any[]).filter(r => r.state === selectedState),
    imd:         (imdWarnings as any[]).filter(w => w.state === selectedState),
  } : null;

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* ── LEFT PANEL: LIVE OPERATIONS BOARD ─────────────────────────── */}
      <div className="absolute top-4 left-4 z-10 w-72 space-y-3 pointer-events-auto">

        {/* Header + live alert counts */}
        <div className="bg-bg-white border border-border-default shadow-lg rounded-xl overflow-hidden">
          <div className="bg-suk-forest px-4 py-3">
            <h2 className="font-display text-white font-bold text-base leading-tight">
              प्रवहतत्त्व
            </h2>
            <p className="font-ui text-white/60 text-[10px] mt-0.5">
              India Flood Intelligence · {stations.length} stations
            </p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border-light">
            {[
              { val: (cwcDanger  as any[]).length, label: 'Danger',     color: 'text-suk-fire',  bg: 'bg-risk-5' },
              { val: (cwcWarning as any[]).length, label: 'Warning',    color: 'text-suk-amber', bg: 'bg-risk-3' },
              { val: (cwcInflow  as any[]).filter((r:any) => (r.fill_pct ?? 0) > 80).length,
                label: 'Reservoirs', color: 'text-suk-river', bg: 'bg-bg-surface' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} p-3 text-center`}>
                <div className={`font-display text-2xl font-bold ${s.color}`}>{s.val}</div>
                <div className="font-ui text-[10px] text-text-muted mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Layer toggles */}
        <div className="bg-bg-white border border-border-default shadow-lg rounded-xl p-3">
          <p className="font-ui text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Layers</p>
          {[
            { state: showDistricts, set: setShowDistricts, label: 'District Risk' },
            { state: showRivers,    set: setShowRivers,    label: 'Rivers & Basins' },
            { state: showStations,  set: setShowStations,  label: 'CWC Stations' },
          ].map(l => (
            <label key={l.label} className="flex items-center justify-between cursor-pointer px-1 py-1.5 rounded hover:bg-bg-surface">
              <span className="font-ui text-xs font-medium text-text-body">{l.label}</span>
              <input type="checkbox" checked={l.state}
                     onChange={() => l.set(p => !p)}
                     className="rounded accent-suk-forest" />
            </label>
          ))}
        </div>

        {/* Radar */}
        <div className="bg-bg-white border border-border-default shadow-lg rounded-xl p-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={showRadar}
                     onChange={e => setShowRadar(e.target.checked)}
                     className="rounded accent-suk-river" />
              <span className="font-ui text-xs font-bold text-text-dark">Doppler Radar</span>
              <span className="font-data text-[9px] bg-suk-river text-white px-1.5 py-0.5 rounded-full">LIVE</span>
            </div>
            {showRadar && radarFrames.length > 0 && (
              <span className="font-data text-[10px] text-text-muted">
                {new Date((radarFrames[radarIdx]?.time ?? 0) * 1000)
                  .toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
              </span>
            )}
          </label>
          {showRadar && radarFrames.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <input type="range" min={0} max={radarFrames.length - 1} value={radarIdx}
                     onChange={e => setRadarIdx(Number(e.target.value))}
                     className="w-full h-1 accent-suk-river" />
              <button onClick={() => setRadarPlaying(p => !p)}
                      className="w-full text-[11px] font-bold py-1 bg-suk-river text-white rounded">
                {radarPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
            </div>
          )}
        </div>

        {/* At-danger feed */}
        {(cwcDanger as any[]).length > 0 && (
          <div className="bg-bg-white border-2 border-suk-fire shadow-lg rounded-xl overflow-hidden">
            <div className="bg-risk-5 px-3 py-2 flex justify-between items-center">
              <span className="font-ui text-xs font-bold text-suk-fire">At Danger Level</span>
              <span className="font-data text-[10px] text-suk-fire font-bold">{(cwcDanger as any[]).length}</span>
            </div>
            <div className="max-h-44 overflow-y-auto divide-y divide-border-light">
              {(cwcDanger as any[]).slice(0, 6).map((s: any) => (
                <button key={s.station_code ?? s.id}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-bg-surface text-left"
                        onClick={() => {
                          if (s.lat && s.lon && map.current)
                            map.current.flyTo({ center: [s.lon, s.lat], zoom: 10, duration: 1200 });
                          setSelectedStation(s as CWCStationData);
                        }}>
                  <div>
                    <p className="font-ui text-xs font-bold text-text-dark">{s.river ?? s.station_name}</p>
                    <p className="font-data text-[10px] text-text-muted">{s.district}, {s.state}</p>
                  </div>
                  <span className="font-data text-xs font-bold text-suk-fire ml-2 whitespace-nowrap">
                    {(s.current_level_m ?? s.current_water_level_m ?? 0).toFixed(1)}m
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* IMD summary */}
        {(imdWarnings as any[]).length > 0 && (
          <div className="bg-bg-white border border-border-default shadow-lg rounded-xl overflow-hidden">
            <div className="bg-risk-3 px-3 py-2">
              <span className="font-ui text-xs font-bold text-risk-3-text">IMD Active Warnings</span>
            </div>
            <div className="max-h-32 overflow-y-auto divide-y divide-border-light">
              {(imdWarnings as any[]).slice(0, 4).map((w: any) => (
                <div key={w.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <p className="font-ui text-xs font-bold text-text-dark">{w.district}</p>
                    <p className="font-data text-[10px] text-text-muted">{w.rainfall_24h_mm}mm / 24h</p>
                  </div>
                  <span className={`font-data text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    w.severity === 'EXTREME' ? 'bg-risk-5 text-risk-5-text' :
                    w.severity === 'SEVERE'  ? 'bg-risk-4 text-risk-4-text' :
                    'bg-risk-3 text-risk-3-text'}`}>
                    {w.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hint when no alerts */}
        {(cwcDanger as any[]).length === 0 && (cwcWarning as any[]).length === 0 && (
          <div className="bg-bg-white border border-border-default rounded-xl px-3 py-3">
            <p className="font-ui text-[11px] text-text-muted">
              Click any district on the map to see state-level flood intelligence.
            </p>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL: STATE DRILLDOWN (appears when district clicked) ── */}
      {selectedState && statePanelData && (
        <div className="absolute top-4 right-4 z-10 w-80 bg-bg-white border border-border-default
                        shadow-xl rounded-xl overflow-hidden pointer-events-auto">

          {/* Header */}
          <div className="bg-suk-forest px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-display text-white font-bold text-lg leading-tight">{selectedState}</h3>
              <p className="font-ui text-white/60 text-[10px] mt-0.5">State Flood Intelligence</p>
            </div>
            <button onClick={() => setSelectedState(null)}
                    className="text-white/60 hover:text-white transition-colors">
              <X size={20} weight="bold" />
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: statePanelData.cwcAtDanger.length, label: 'Danger',  color: 'text-suk-fire',  bg: 'bg-risk-5' },
                { val: statePanelData.cwcAtWarn.length,   label: 'Warning', color: 'text-suk-amber', bg: 'bg-risk-3' },
                { val: statePanelData.imd.length,          label: 'IMD',     color: 'text-suk-river', bg: 'bg-bg-surface' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-lg p-2 text-center`}>
                  <div className={`font-display text-xl font-bold ${s.color}`}>{s.val}</div>
                  <div className="font-ui text-[10px] text-text-muted">{s.label}</div>
                </div>
              ))}
            </div>

            {/* CWC stations */}
            <div>
              <p className="font-ui text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                <Drop size={10} /> CWC Stations ({statePanelData.cwcStations.length})
              </p>
              {statePanelData.cwcStations.length === 0
                ? <p className="font-ui text-xs text-text-muted italic">No stations mapped for this state</p>
                : <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {statePanelData.cwcStations.map((s: any) => {
                      const ratio = s.danger_level_m > 0
                        ? s.current_water_level_m / s.danger_level_m : 0;
                      const atRisk = ratio >= 0.85;
                      return (
                        <button key={s.station_code}
                                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors ${atRisk ? 'bg-risk-4 border border-risk-4-border' : 'bg-bg-surface hover:bg-bg-surface-2'}`}
                                onClick={() => {
                                  if (s.lat && s.lon && map.current)
                                    map.current.flyTo({ center: [s.lon, s.lat], zoom: 10, duration: 1000 });
                                  setSelectedStation(s as CWCStationData);
                                }}>
                          <div>
                            <p className="font-ui text-xs font-bold text-text-dark">{s.river}</p>
                            <p className="font-data text-[10px] text-text-muted">{s.station_name} · {s.station_code}</p>
                          </div>
                          <div className="text-right ml-2 flex-shrink-0">
                            <p className={`font-data text-sm font-bold ${atRisk ? 'text-suk-fire' : 'text-text-dark'}`}>
                              {s.current_water_level_m.toFixed(2)}m
                            </p>
                            <div className="w-20 h-1 bg-bg-cream rounded overflow-hidden mt-1">
                              <div className={`h-1 rounded ${atRisk ? 'bg-suk-fire' : 'bg-suk-forest'}`}
                                   style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
              }
            </div>

            {/* IMD warnings */}
            {statePanelData.imd.length > 0 && (
              <div>
                <p className="font-ui text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                  <CloudRain size={10} /> IMD Warnings ({statePanelData.imd.length})
                </p>
                <div className="space-y-1.5">
                  {statePanelData.imd.map((w: any) => (
                    <div key={w.id}
                         className={`flex items-center justify-between p-2.5 rounded-lg border ${
                           w.severity === 'EXTREME' ? 'bg-risk-5 border-risk-5-border text-risk-5-text' :
                           w.severity === 'SEVERE'  ? 'bg-risk-4 border-risk-4-border text-risk-4-text' :
                           w.severity === 'MODERATE'? 'bg-risk-3 border-risk-3-border text-risk-3-text' :
                           'bg-risk-2 border-risk-2-border text-risk-2-text'}`}>
                      <div>
                        <p className="font-ui text-xs font-bold">{w.district}</p>
                        <p className="font-data text-[10px] opacity-80">{w.rainfall_24h_mm}mm / 24h</p>
                      </div>
                      <span className="font-data text-[10px] font-bold ml-2">{w.severity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reservoirs */}
            {statePanelData.reservoirs.length > 0 && (
              <div>
                <p className="font-ui text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Warning size={10} /> Reservoirs ({statePanelData.reservoirs.length})
                </p>
                <div className="space-y-1.5">
                  {statePanelData.reservoirs.map((r: any) => (
                    <div key={r.station_code} className="flex items-center justify-between p-2.5 bg-bg-surface rounded-lg">
                      <div>
                        <p className="font-ui text-xs font-bold text-text-dark">{r.station_name}</p>
                        <p className="font-data text-[10px] text-text-muted">{r.river}</p>
                      </div>
                      <div className="text-right ml-2">
                        <p className={`font-data text-sm font-bold ${(r.fill_pct ?? 0) > 85 ? 'text-suk-fire' : 'text-text-dark'}`}>
                          {r.fill_pct ?? '–'}%
                        </p>
                        <div className="w-16 h-1 bg-bg-cream rounded overflow-hidden mt-1">
                          <div className={`h-1 rounded ${(r.fill_pct ?? 0) > 85 ? 'bg-suk-fire' : 'bg-suk-forest'}`}
                               style={{ width: `${r.fill_pct ?? 0}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── STATION POPUP ─────────────────────────────────────────────────── */}
      {selectedStation && (
        <StationPopup station={selectedStation} onClose={() => setSelectedStation(null)} />
      )}
    </div>
  );
};
