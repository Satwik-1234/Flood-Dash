import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { StationPopup } from '../components/map/StationPopup';
import { CWCStationData } from '../api/schemas';
import { useCWCStations } from '../hooks/useTelemetry';
import { SpinnerGap } from 'phosphor-react';

export const LiveMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [lng] = useState(76.0); // Focus on Maharashtra
  const [lat] = useState(19.0);
  const [zoom] = useState(6.0);
  
  const { data: stations, isLoading } = useCWCStations();
  const [selectedStation, setSelectedStation] = useState<CWCStationData | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return; // initialize map only once
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [lng, lat],
      zoom: zoom,
      attributionControl: false 
    });

    map.current.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.current.on('load', () => {
      if (!map.current) return;
      
      map.current.addSource('mock-river', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [
                  [74.0, 19.0],
                  [74.5, 18.5],
                  [75.0, 18.3],
                  [76.0, 18.0]
                ]
              },
              properties: { risk: 'warning' }
            }
          ]
        }
      });

      map.current.addLayer({
        id: 'mock-river-line',
        type: 'line',
        source: 'mock-river',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': 'var(--suk-river)',
          'line-width': 6,
          'line-opacity': 0.8,
          'line-dasharray': [0, 4, 3]
        }
      });

      // Simple Click interaction for mockup popup
      map.current.on('click', 'mock-river-line', (e) => {
        // Find a critical station to demo popup if mock line clicked
        const mockStat = stations?.find(s => s.danger_level_m <= s.current_water_level_m);
        if(mockStat) setSelectedStation(mockStat);
      });
      map.current.on('mouseenter', 'mock-river-line', () => {
         if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'mock-river-line', () => {
         if (map.current) map.current.getCanvas().style.cursor = '';
      });

      let dashArraySequence = [
        [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 0, 3, 4]
      ];
      let step = 0;
      function animateDashArray() {
        if (!map.current || !map.current.getLayer('mock-river-line')) return;
        step = (step + 1) % dashArraySequence.length;
        map.current.setPaintProperty('mock-river-line', 'line-dasharray', dashArraySequence[step]);
        setTimeout(() => requestAnimationFrame(animateDashArray), 120);
      }
      animateDashArray();
    });

  }, [lng, lat, zoom, stations]);

  return (
    <div className="w-full h-full relative border-l border-border-default">
      <div 
        ref={mapContainer} 
        className="absolute inset-0 w-full h-full bg-[#f4f1eb]" 
      />
      
      {/* Search & Layers Overlay */}
      <div className="absolute top-4 left-4 z-10 w-80 bg-bg-white border border-border-default shadow-popup rounded-xl p-4 pointer-events-auto">
        <h2 className="font-display text-text-dark font-semibold text-lg border-b border-border-light pb-2 mb-2">Live Basin Monitors</h2>
        {isLoading ? (
          <div className="flex items-center text-text-muted font-ui text-sm">
            <SpinnerGap className="w-4 h-4 animate-spin mr-2"/> Syncing stations...
          </div>
        ) : (
          <div className="font-ui text-sm text-text-muted">
            Active Stations: <strong>{stations?.length || 0}</strong> <br/>
            Network Sync: <span className="text-suk-forest font-bold">Stable</span>
            <p className="text-xs mt-2 italic">Click the animated river line to view the Mock 4-Tab Station Popup.</p>
          </div>
        )}
      </div>

      {/* Floating React Dashboard over MapLibre */}
      {selectedStation && (
        <div className="absolute top-24 left-8 z-20 pointer-events-none">
          <StationPopup station={selectedStation} onClose={() => setSelectedStation(null)} />
        </div>
      )}

    </div>
  );
};

export default LiveMap;
