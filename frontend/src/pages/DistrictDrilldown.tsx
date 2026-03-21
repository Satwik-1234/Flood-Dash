import React, { useState } from 'react';
import { useIMDWarnings, useCWCStations } from '../hooks/useTelemetry';
import { MapTrifold, CaretDown, WarningOctagon, Drop, Thermometer } from 'phosphor-react';

export const DistrictDrilldown: React.FC = () => {
  const { data: warnings } = useIMDWarnings();
  const { data: stations } = useCWCStations();
  const [selectedDistrict, setSelectedDistrict] = useState('Kolhapur');

  const districtWarnings = warnings?.filter(w => w.district === selectedDistrict) || [];
  const districtStations = stations?.filter(s => s.basin.includes('Krishna')) || []; 

  return (
    <div className="w-full h-full p-8 overflow-y-auto bg-bg-cream">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h2 className="font-display text-text-dark text-3xl font-bold flex items-center">
            <MapTrifold className="w-8 h-8 mr-3 text-suk-forest" weight="duotone" />
            District Command Center
          </h2>
          <p className="font-ui text-text-muted mt-1">Granular analysis of taluka-level telemetry and critical infrastructure.</p>
        </div>

        <div className="relative">
          <select 
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="appearance-none bg-bg-white border border-border-default rounded-lg pl-4 pr-10 py-2.5 font-display text-lg font-bold text-text-dark focus:outline-none focus:border-suk-forest shadow-sm cursor-pointer"
          >
            <option value="Kolhapur">Kolhapur District</option>
            <option value="Sangli">Sangli District</option>
            <option value="Satara">Satara District</option>
            <option value="Pune">Pune District</option>
            <option value="Mumbai">Mumbai Suburban</option>
          </select>
          <CaretDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" weight="bold" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* District Stats */}
        <div className="space-y-6">
          <div className="bg-bg-white border border-border-default rounded-xl p-6 shadow-sm">
            <h3 className="font-display font-bold text-lg text-text-dark mb-4 pb-2 border-b border-border-light">Active Meteorological Warnings</h3>
            
            {districtWarnings.length === 0 ? (
              <p className="font-ui text-sm text-text-muted italic">No active IMD warnings for {selectedDistrict}. Weather is clear.</p>
            ) : (
              <div className="space-y-3">
                {districtWarnings.map(w => (
                  <div key={w.id} className={`p-4 rounded-lg border flex items-start ${w.severity === 'EXTREME' ? 'bg-risk-5 border-risk-5-border text-risk-5-text' : 'bg-risk-4 border-risk-4-border text-risk-4-text'}`}>
                    <WarningOctagon className="w-6 h-6 mr-3 flex-shrink-0" weight="fill" />
                    <div>
                      <h4 className="font-ui font-bold text-sm tracking-wide">{w.severity} SEVERITY</h4>
                      <p className="font-data text-xs mt-1 opacity-90">{w.rainfall_24h_mm}mm precipitation expected in the next 24 hours.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg-white border border-border-default rounded-xl p-5 shadow-sm">
               <Drop className="w-8 h-8 text-suk-river mb-2 opacity-50" />
               <h4 className="font-ui text-xs font-bold text-text-muted uppercase">Catchment Saturation</h4>
               <div className="font-data text-2xl text-text-dark font-bold mt-1">82%</div>
            </div>
            <div className="bg-bg-white border border-border-default rounded-xl p-5 shadow-sm">
               <Thermometer className="w-8 h-8 text-suk-amber mb-2 opacity-50" />
               <h4 className="font-ui text-xs font-bold text-text-muted uppercase">Avg Temperature</h4>
               <div className="font-data text-2xl text-text-dark font-bold mt-1">28.4°C</div>
            </div>
          </div>
        </div>

        {/* Local Stations */}
        <div className="bg-bg-white border border-border-default rounded-xl shadow-sm p-6">
          <h3 className="font-display font-bold text-lg text-text-dark mb-4 pb-2 border-b border-border-light">District River Gauges</h3>
          
          <div className="space-y-3">
            {districtStations.slice(0, 4).map(s => {
              const critical = s.current_water_level_m >= s.danger_level_m;
              return (
                <div key={s.station_code} className={`flex items-center justify-between p-3 rounded border ${critical ? 'border-suk-fire bg-risk-5' : 'border-border-light hover:bg-bg-surface'} transition-colors`}>
                  <div>
                    <h4 className={`font-ui font-bold ${critical ? 'text-risk-5-text' : 'text-text-dark'}`}>{s.river} River ({s.basin})</h4>
                    <p className={`font-data text-xs ${critical ? 'text-risk-5-text opacity-90' : 'text-text-muted'}`}>Station Code: {s.station_code}</p>
                  </div>
                  <div className="text-right">
                    <div className={`font-display text-xl font-bold ${critical ? 'text-risk-5-text' : 'text-text-dark'}`}>{s.current_water_level_m}m</div>
                    <div className={`font-ui text-[10px] uppercase font-bold ${critical ? 'text-risk-5-text' : 'text-text-muted'}`}>Trend: {s.trend}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
