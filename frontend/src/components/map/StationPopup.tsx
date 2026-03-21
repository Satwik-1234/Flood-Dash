import React, { useState } from 'react';
import { X, MapPin, Drop, ChartBar, Warning, CaretRight, Info } from 'phosphor-react';
import { CWCStationData } from '../../api/schemas';

interface StationPopupProps {
  station: CWCStationData;
  onClose: () => void;
}

export const StationPopup: React.FC<StationPopupProps> = ({ station, onClose }) => {
  const [activeTab, setActiveTab] = useState<'live' | 'chart' | 'catchment' | 'alerts'>('live');

  // Danger logic colors
  let dangerClass = 'text-suk-forest';
  let dangerBg = 'bg-risk-1';
  let dangerLabel = 'Normal';
  
  if (station.current_water_level_m >= station.danger_level_m) {
    dangerClass = 'text-risk-5-text';
    dangerBg = 'bg-risk-5';
    dangerLabel = 'Critical Danger';
  } else if (station.current_water_level_m >= station.warning_level_m) {
    dangerClass = 'text-suk-amber';
    dangerBg = 'bg-risk-3';
    dangerLabel = 'Warning Level breached';
  }

  return (
    <div className="w-96 bg-bg-surface-2 border border-border-strong rounded-xl shadow-popup overflow-hidden flex flex-col pointer-events-auto">
      
      {/* Header */}
      <div className={`${dangerBg} border-b border-border-default p-4 flex justify-between items-start`}>
        <div>
          <h3 className={`font-display font-bold text-lg ${dangerClass} uppercase tracking-wide`}>{station.river} River</h3>
          <p className={`font-ui text-xs font-bold opacity-80 ${dangerClass} flex items-center mt-0.5`}>
            <MapPin className="w-3 h-3 mr-1" /> {station.basin} • {station.station_code}
          </p>
        </div>
        <button onClick={onClose} className={`p-1 hover:bg-black/10 rounded transition-colors ${dangerClass}`}>
          <X className="w-5 h-5" weight="bold" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-light bg-bg-white font-ui text-xs font-bold text-text-muted">
        {[
          { id: 'live', icon: Drop, label: 'Live' },
          { id: 'chart', icon: ChartBar, label: 'Trend' },
          { id: 'catchment', icon: Info, label: 'Basin' },
          { id: 'alerts', icon: Warning, label: 'Alerts' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 flex justify-center items-center transition-colors border-b-2 ${
              activeTab === tab.id ? 'border-suk-forest text-suk-forest bg-bg-cream' : 'border-transparent hover:text-text-dark hover:bg-bg-surface'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-1.5" weight={activeTab === tab.id ? 'fill' : 'regular'} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-5 bg-bg-white min-h-[220px]">
        {activeTab === 'live' && (
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <span className="font-ui text-xs text-text-muted uppercase font-bold tracking-wider">Current Level</span>
                <div className={`font-display text-4xl font-bold mt-1 ${dangerClass}`}>{station.current_water_level_m.toFixed(2)}<span className="text-xl opacity-70 ml-0.5">m</span></div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-bold font-ui ${station.trend === 'RISING' ? 'bg-risk-5 text-risk-5-text' : 'bg-risk-1 text-suk-forest'}`}>
                Trending {station.trend}
              </div>
            </div>
            
            <div className="pt-4 border-t border-border-light space-y-2">
              <div className="flex justify-between font-data text-sm">
                <span className="text-text-muted">Danger Threshold:</span>
                <span className="text-suk-fire font-bold">{station.danger_level_m}m</span>
              </div>
              <div className="flex justify-between font-data text-sm">
                <span className="text-text-muted">Warning Threshold:</span>
                <span className="text-suk-amber font-bold">{station.warning_level_m}m</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chart' && (
          <div className="h-full flex flex-col justify-end space-y-2">
            <p className="font-ui text-xs text-text-muted text-center mb-4">48h Diagnostic Hydrograph (Simulated CSS)</p>
            <div className="flex justify-between items-end h-24 gap-1">
              {[40, 42, 45, 52, 60, 75, 80, 85, 95, 100].map((h, i) => (
                <div key={i} className="w-full bg-suk-river/30 rounded-t relative overflow-hidden flex-1 border-b-2 border-suk-river" style={{ height: `${h}%` }}>
                  <div className="absolute bottom-0 w-full bg-suk-river opacity-50" style={{ height: h > 80 ? '100%' : '0%' }}></div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-data text-text-muted mt-1 px-1">
              <span>-48h</span>
              <span>NOW</span>
            </div>
          </div>
        )}

        {activeTab === 'catchment' && (
          <div className="space-y-4">
            <div className="bg-bg-surface p-3 rounded border border-border-default">
              <span className="font-ui text-xs font-bold text-text-muted uppercase">Soil Saturation Index</span>
              <div className="w-full bg-border-default rounded-full h-2.5 mt-2 overflow-hidden">
                <div className="bg-suk-forest h-2.5 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <p className="font-data text-xs mt-1 text-right text-text-dark font-bold">0.85 (High)</p>
            </div>
            <div className="bg-bg-surface p-3 rounded border border-border-default flex justify-between items-center">
               <span className="font-ui text-xs font-bold text-text-muted uppercase">Catchment Rainfall</span>
               <span className="font-data text-sm font-bold text-suk-fire">420mm (7 Days)</span>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="bg-risk-5 border border-risk-5-border rounded p-3 text-risk-5-text">
            <h4 className="font-display font-bold text-sm flex items-center mb-2">
              <Warning className="w-4 h-4 mr-1" weight="fill" />
              Flash Flood Warning
            </h4>
            <p className="font-ui text-xs leading-relaxed opacity-90">
              CWC has issued an extreme inundation advisory for downstream regions. Evacuations ordered by District Administration. Level is 0.5m above danger mark.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
