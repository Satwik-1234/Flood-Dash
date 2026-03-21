import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export const LiveMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [lng] = useState(76.0); // Focus on Maharashtra
  const [lat] = useState(19.0);
  const [zoom] = useState(6.0);

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
      attributionControl: false // Using custom footer attribution
    });

    map.current.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.current.on('load', () => {
      // Mock active river flow logic for Phase 2 placeholder
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
          'line-width': 4,
          'line-opacity': 0.8,
          'line-dasharray': [0, 4, 3]
        }
      });

      // Animate the flow line
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

  }, [lng, lat, zoom]);

  return (
    <div className="w-full h-full relative border-l border-border-default">
      <div 
        ref={mapContainer} 
        className="absolute inset-0 w-full h-full bg-[#f4f1eb]" 
      />
      
      {/* Search & Layers Overlay Placeholder */}
      <div className="absolute top-4 left-4 z-10 w-80 bg-bg-white border border-border-default shadow-popup rounded-xl p-4">
        <h2 className="font-display text-text-dark font-semibold text-lg border-b border-border-light pb-2 mb-2">Live Basin Monitors</h2>
        <div className="font-ui text-sm text-text-muted">
          Active Stations: 247 <br/>
          Critical Alerts: 2
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
