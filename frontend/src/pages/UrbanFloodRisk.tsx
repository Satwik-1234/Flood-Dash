import React, { useState } from 'react';
import { Buildings, WarningOctagon, CloudRain, ChartLineUp } from 'phosphor-react';
import { useIMDWarnings } from '../hooks/useTelemetry';

export const UrbanFloodRisk: React.FC = () => {
  const { data: warnings, isLoading } = useIMDWarnings();
  
  // Hardcoded urban centers for simulation
  const urbanCenters = [
    { city: 'Mumbai', drainageCapacity: '45mm/hr', currentRainfall: '62mm/hr', impact: 'Severe', waterloggingActive: true },
    { city: 'Pune', drainageCapacity: '35mm/hr', currentRainfall: '20mm/hr', impact: 'Low', waterloggingActive: false },
    { city: 'Nagpur', drainageCapacity: '40mm/hr', currentRainfall: '38mm/hr', impact: 'Moderate', waterloggingActive: false }
  ];

  return (
    <div className="w-full h-full p-8 overflow-y-auto bg-bg-cream">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h2 className="font-display text-text-dark text-3xl font-bold flex items-center">
            <Buildings className="w-8 h-8 mr-3 text-suk-forest" weight="duotone" />
            Urban Flood Simulation
          </h2>
          <p className="font-ui text-text-muted mt-1">Real-time localized waterlogging risk based on municipal drainage capacity thresholds.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Radar Panel */}
        <div className="lg:col-span-1 bg-bg-white border border-border-default rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <CloudRain className="w-16 h-16 text-suk-river opacity-80 mb-4" weight="fill" />
          <h3 className="font-display font-bold text-xl text-text-dark mb-2">Short-range Radar</h3>
          <p className="font-ui text-sm text-text-muted mb-6">Doppler radar indicates intense localized cumulonimbus cells over the Western Ghats.</p>
          <div className="w-full bg-risk-4 border border-risk-4-border p-4 rounded-lg text-risk-4-text font-ui text-sm font-bold flex items-center justify-center">
            <WarningOctagon className="w-5 h-5 mr-2" />
            Storm Surge Active
          </div>
        </div>

        {/* City Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-display font-bold text-lg text-text-dark border-b border-border-light pb-2">Metropolitan Catchments</h3>
          
          <div className="grid gap-4">
            {urbanCenters.map((center, i) => (
              <div key={i} className={`bg-bg-white border ${center.waterloggingActive ? 'border-suk-fire' : 'border-border-default'} rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between`}>
                <div>
                  <h4 className="font-ui font-bold text-text-dark text-lg flex items-center">
                    {center.city}
                    {center.waterloggingActive && <span className="ml-3 bg-risk-5 text-risk-5-text text-[10px] uppercase font-bold px-2 py-0.5 rounded">Waterlogging Warning</span>}
                  </h4>
                  <div className="flex space-x-6 mt-2 font-data text-sm">
                    <span className="text-text-muted">Drainage: <span className="text-text-dark font-bold">{center.drainageCapacity}</span></span>
                    <span className="text-text-muted">Precipitation: <span className={`${parseFloat(center.currentRainfall) > parseFloat(center.drainageCapacity) ? 'text-suk-fire font-bold' : 'text-text-dark'}`}>{center.currentRainfall}</span></span>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${
                    center.impact === 'Severe' ? 'bg-risk-5 border-risk-5-border text-risk-5-text' : 
                    center.impact === 'Moderate' ? 'bg-risk-3 border-risk-3 text-suk-amber' : 'bg-risk-1 border-risk-1 text-suk-forest'
                  }`}>
                    <ChartLineUp className="w-4 h-4" />
                    <span className="font-ui text-xs font-bold uppercase">{center.impact} Risk</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
