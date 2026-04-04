import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCWCNationalLevels, useRadarMetadata, useCWCAboveWarning } from '../hooks/useTelemetry';

function getDataAge(iso: string): 'fresh' | 'aging' | 'stale' {
  if (!iso) return 'stale';
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (h < 6) return 'fresh';
  if (h < 48) return 'aging';
  return 'stale';
}

const AGE_COLORS = { fresh: '#10B981', aging: '#F59E0B', stale: '#EF4444' } as const;

// Stable lookup: station code => approximate lat/lon from known zone prefixes
// Real coords would come from the CWC catalog API (which requires auth)
// We generate deterministic pseudocoords from the zone embedded in station code
function approxLatLon(code: string): [number, number] | null {
  const zones: Record<string, [number, number]> = {
    'UBDDIB':  [21.5, 83.9],   // Mahanadi / Odisha
    'MAHGAND': [21.0, 80.5],   // Godavari / Vidarbha
    'CDJAPR':  [21.5, 80.5],
    'ERDBWN':  [25.4, 84.0],   // Ganga / Bihar
    'LBDJPG':  [26.8, 80.9],   // Gomti / UP
    'LGDHYD':  [17.4, 78.4],   // Krishna / Hyderabad
    'UGDHYD':  [17.5, 78.5],
    'HYDCHENNAI': [13.0, 80.2],
    'MBDGHY':  [26.2, 91.7],   // Brahmaputra / Guwahati
    'HGDDDN':  [30.3, 78.0],   // Ganga / Dehradun
    'WGDNGP':  [21.1, 79.1],   // Wardha / Nagpur
    'NDBHP':   [23.2, 77.4],   // Narmada / Bhopal
    'MGD1LKN': [26.8, 80.9],
    'MGD2LKN': [26.7, 81.0],
    'MGD3VNS': [25.3, 83.0],
    'MGD4PTN': [25.6, 85.1],   // Bihar / Patna
    'MGD5PTN': [25.5, 85.2],
    'MDSIL':   [27.9, 94.7],   // Silapathar
    'MDBURLA': [21.5, 83.9],
    'LYDAGRA': [27.2, 78.0],
    'UYDDEL':  [28.7, 77.1],   // Yamuna / Delhi
    'SWRDKOCHI': [9.9, 76.3],  // Kerala
    'SRDCBE':  [11.0, 77.0],
    'TDSURAT': [21.2, 72.8],   // Tapi / Surat
    'DWRIS':   [28.6, 77.2],
    '9NEID3':  [22.0, 88.0],
  };

  // Try matching the zone code part
  for (const [zone, coord] of Object.entries(zones)) {
    if (code.toUpperCase().includes(zone.toUpperCase())) {
      // Add small jitter so overlapping stations spread out
      const seed = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const jitter = (n: number) => (n % 10) / 100;
      return [coord[0] + jitter(seed), coord[1] + jitter(seed * 7)];
    }
  }
  return null;
}

export const LiveMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);
  const [ready,  setReady]  = useState(false);
  const [frame,  setFrame]  = useState(0);
  const [playing, setPlaying] = useState(false);
  const frameTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: levels = [] } = useCWCNationalLevels();
  const { data: radar }       = useRadarMetadata() as any;
  const { data: warnings = [] } = useCWCAboveWarning();

  const warningSet = new Set(warnings.map((w: any) => w.stationCode));

  // Build GeoJSON from CWC national levels
  const geojson = React.useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: levels
      .map(l => ({ l, pos: approxLatLon(l.stationCode) }))
      .filter(({ pos }) => pos != null)
      .map(({ l, pos }) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: pos! as [number, number] },
        properties: {
          code:    l.stationCode,
          value:   l.latestDataValue,
          time:    l.latestDataTime,
          age:     getDataAge(l.latestDataTime),
          warning: warningSet.has(l.stationCode),
          color:   warningSet.has(l.stationCode) ? '#F59E0B' : AGE_COLORS[getDataAge(l.latestDataTime)],
        },
      })),
  }), [levels, warningSet]);

  // Radar frames
  const frames: string[] = React.useMemo(() => {
    const host = radar?.host ?? 'https://tilecache.rainviewer.com';
    return (radar?.radar?.past ?? []).map((p: any) => `${host}${p.path}/256/{z}/{x}/{y}/2/1_1.png`);
  }, [radar]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;
    const map = new maplibregl.Map({
      container:  mapContainer.current,
      style: {
        version: 8,
        glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [82, 22],
      zoom: 4.5,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      setReady(true);
      mapRef.current = map;
    });

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Add station layer
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || geojson.features.length === 0) return;

    const SRC = 'cwc-stations';
    const updateOrAdd = () => {
      if (map.getSource(SRC)) {
        (map.getSource(SRC) as maplibregl.GeoJSONSource).setData(geojson as any);
      } else {
        map.addSource(SRC, { type: 'geojson', data: geojson as any });
        map.addLayer({
          id: 'cwc-heat',
          type: 'heatmap',
          source: SRC,
          maxzoom: 8,
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'value'], 0, 0, 500, 1],
            'heatmap-intensity': 0.6,
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(33,102,172,0)', 0.2, '#22D3EE', 0.6, '#F59E0B', 1, '#EF4444',
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 12, 8, 20],
            'heatmap-opacity': 0.7,
          },
        });
        map.addLayer({
          id: 'cwc-dots',
          type: 'circle',
          source: SRC,
          minzoom: 7,
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 4, 12, 8],
            'circle-stroke-width': 1,
            'circle-stroke-color': '#000',
            'circle-opacity': 0.9,
          },
        });

        // Popup on click
        map.on('click', 'cwc-dots', (e) => {
          if (!e.features?.length) return;
          const feat = e.features[0];
          if (!feat) return;
          const p = feat.properties ?? {};
          const coords = (feat.geometry as any).coordinates as [number, number];
          const age = getDataAge(p.time);
          const ageLabel = { fresh: '✓ Fresh', aging: '⚠ Aging', stale: '✗ Stale' }[age];

          new maplibregl.Popup({ offset: 12, closeButton: true })
            .setLngLat(coords)
            .setHTML(`
              <div style="font-family:'JetBrains Mono',monospace;padding:14px;min-width:220px;background:#152236;border-radius:8px;">
                <div style="font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#475569;margin-bottom:8px;">CWC Gauging Station</div>
                <div style="font-size:14px;font-weight:700;color:#22D3EE;margin-bottom:12px;">${p.code}</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                  <div>
                    <div style="font-size:9px;color:#475569;margin-bottom:2px;">Level</div>
                    <div style="font-size:18px;font-weight:700;color:#F1F5F9;">${Number(p.value).toFixed(2)} m</div>
                  </div>
                  <div>
                    <div style="font-size:9px;color:#475569;margin-bottom:2px;">Data</div>
                    <div style="font-size:12px;font-weight:600;color:${AGE_COLORS[age]};">${ageLabel}</div>
                  </div>
                </div>
                <div style="margin-top:10px;font-size:9px;color:#475569;">
                  Last: ${p.time ? new Date(p.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Unknown'}
                </div>
                ${p.warning ? '<div style="margin-top:8px;padding:4px 8px;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);border-radius:4px;font-size:10px;color:#F59E0B;font-weight:700;">⚠ ABOVE WARNING LEVEL</div>' : ''}
              </div>`)
            .addTo(map);
        });

        map.on('mouseenter', 'cwc-dots', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'cwc-dots', () => { map.getCanvas().style.cursor = ''; });
      }
    };

    if (map.isStyleLoaded()) updateOrAdd();
    else map.on('load', updateOrAdd);
  }, [ready, geojson]);

  // Add/update radar layer
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !frames.length) return;
    const currentUrl = frames[frame] ?? '';
    if (!currentUrl) return;

    const updateRadar = () => {
      if (map.getLayer('radar-layer')) {
        (map.getSource('radar-src') as any).tiles = [currentUrl];
        map.removeLayer('radar-layer');
        map.removeSource('radar-src');
      }
      map.addSource('radar-src', { type: 'raster', tiles: [currentUrl], tileSize: 256 });
      map.addLayer({
        id: 'radar-layer',
        type: 'raster',
        source: 'radar-src',
        paint: { 'raster-opacity': 0.65 },
      }, 'cwc-heat');
    };

    if (map.isStyleLoaded()) updateRadar();
  }, [ready, frames, frame]);

  // Play/pause radar animation
  const togglePlay = useCallback(() => {
    if (playing) {
      if (frameTimer.current) clearInterval(frameTimer.current);
      setPlaying(false);
    } else {
      frameTimer.current = setInterval(() => {
        setFrame(f => (f + 1) % Math.max(frames.length, 1));
      }, 800);
      setPlaying(true);
    }
  }, [playing, frames.length]);

  useEffect(() => () => { if (frameTimer.current) clearInterval(frameTimer.current); }, []);

  return (
    <div className="h-full flex flex-col bg-bg-base">

      {/* Header */}
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-display text-base font-bold text-t1">GIS Theatre</h2>
          <p className="text-[10px] font-mono text-t3">CWC Stations · RainViewer Radar</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Radar controls */}
          {frames.length > 0 && (
            <div className="flex items-center gap-2 bg-bg-s1 border border-white/10 rounded-lg px-3 py-2">
              <button
                onClick={togglePlay}
                className="text-[10px] font-mono text-accent-blue hover:text-accent-cyan transition-colors font-bold"
              >
                {playing ? '⏸ PAUSE' : '▶ PLAY'}
              </button>
              <div className="w-px h-4 bg-white/10" />
              <button onClick={() => setFrame(f => Math.max(f - 1, 0))} className="text-t3 hover:text-t1 transition-colors text-xs">◀</button>
              <span className="text-[10px] font-mono text-t3 min-w-[3rem] text-center">
                {frame + 1}/{frames.length}
              </span>
              <button onClick={() => setFrame(f => Math.min(f + 1, frames.length - 1))} className="text-t3 hover:text-t1 transition-colors text-xs">▶</button>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-3 bg-bg-s1 border border-white/10 rounded-lg px-3 py-2">
            {([['fresh', '#10B981', '< 6h'], ['aging', '#F59E0B', '< 48h'], ['stale', '#EF4444', '> 48h']] as const).map(([, c, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                <span className="text-[9px] font-mono text-t3">{l}</span>
              </div>
            ))}
          </div>

          <div className="text-[10px] font-mono text-t3">
            {geojson.features.length} stations plotted
          </div>
        </div>
      </div>

      {/* Map */}
      <div ref={mapContainer} className="flex-1" />
    </div>
  );
};

export default LiveMap;
