import React, { useState } from 'react';
import { X, MapPin, Drop, ChartBar, Warning, CaretRight, Info } from 'phosphor-react';
import { CWCStationData } from '../../api/schemas';
import { computeEffectiveRunoff, computeAMCClass, BASIN_CN_LOOKUP } from '../../utils/scscn';
import { propagateRisk } from '../../utils/routing';

interface StationPopupProps {
  station: CWCStationData;
  onClose: () => void;
}

export const StationPopup: React.FC<StationPopupProps> = ({ station, onClose }) => {
  const [activeTab, setActiveTab] = useState<'live' | 'chart' | 'catchment' | 'routing' | 'alerts'>('live');

  const catchmentRainfall = 127; // Will come from mock data / API later
  const api5day = 48;            // 5-day antecedent precip — from mock data
  const amc     = computeAMCClass(api5day);
  const cnII    = BASIN_CN_LOOKUP[station.river] ?? BASIN_CN_LOOKUP['DEFAULT'] ?? 76;
  const scscn   = computeEffectiveRunoff(catchmentRainfall, cnII, amc);

  const downstreamAlerts = propagateRisk(
    station.station_code,
    station.current_water_level_m,
    station.danger_level_m,
  );

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
          { id: 'routing', icon: CaretRight, label: 'Downstream' },
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
            <p className="font-ui text-xs text-text-muted">
              SCS Curve Number runoff model · Catchment: {station.basin} Basin
            </p>

            {/* CN and AMC */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-surface p-3 rounded border border-border-default">
                <p className="font-ui text-[10px] font-bold text-text-muted uppercase">Curve Number (CN-II)</p>
                <p className="font-data text-xl font-bold text-text-dark mt-1">{scscn.cn_ii}</p>
              </div>
              <div className="bg-bg-surface p-3 rounded border border-border-default">
                <p className="font-ui text-[10px] font-bold text-text-muted uppercase">AMC Class</p>
                <p className={`font-data text-xl font-bold mt-1 ${
                  scscn.amc_class === 'III' ? 'text-suk-fire' :
                  scscn.amc_class === 'II'  ? 'text-suk-amber' : 'text-suk-forest'
                }`}>
                  AMC-{scscn.amc_class}
                </p>
              </div>
            </div>

            {/* Runoff bars */}
            {[
              { label: 'Rainfall P (basin avg)', value: scscn.rainfall_P_mm, max: 250, unit: 'mm', color: 'bg-suk-river' },
              { label: 'Effective Runoff Q',     value: scscn.runoff_Q_mm,   max: 250, unit: 'mm', color: 'bg-suk-fire'  },
            ].map(b => (
              <div key={b.label}>
                <div className="flex justify-between font-ui text-xs font-bold text-text-muted mb-1">
                  <span>{b.label}</span>
                  <span className="font-data text-text-dark">{b.value} {b.unit}</span>
                </div>
                <div className="h-2.5 bg-bg-surface rounded-full overflow-hidden">
                  <div className={`${b.color} h-2.5 rounded-full transition-all duration-700`}
                       style={{ width: `${Math.min(100, (b.value / b.max) * 100)}%` }} />
                </div>
              </div>
            ))}

            {/* Runoff ratio */}
            <div className="bg-bg-surface-2 border border-border-default rounded p-3 mt-2">
              <p className="font-ui text-xs font-bold text-text-muted uppercase mb-1">Runoff Ratio</p>
              <p className="font-data text-lg font-bold text-text-dark">
                {Math.round(scscn.runoff_ratio * 100)}% of rainfall → direct runoff
              </p>
              <p className="font-ui text-xs text-text-muted mt-1 leading-relaxed">
                {scscn.plain_language}
              </p>
            </div>

            <p className="font-ui text-[10px] text-text-muted text-right mt-2">
              Method: SCS-CN (USDA TR-55 · IS:11223) · Soil: NRSC/NBSS reference
            </p>
          </div>
        )}

        {activeTab === 'routing' && (
          <div className="space-y-3">
            <p className="font-ui text-xs text-text-muted mb-2">
              Muskingum routing · Flood peak propagation from this station
            </p>
            {downstreamAlerts.length === 0 ? (
              <p className="font-ui text-sm text-text-muted italic text-center py-4">
                No downstream stations mapped for this river segment.
              </p>
            ) : downstreamAlerts.map(ds => (
              <div key={ds.station_code}
                   className="bg-bg-surface border border-border-default rounded-lg p-3
                              flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <div className="font-data text-xs font-bold text-suk-river
                                  bg-bg-surface-2 rounded px-2 py-1 whitespace-nowrap mt-0.5">
                    +{ds.travel_time_hours}h
                  </div>
                  <div>
                    <p className="font-ui font-bold text-sm text-text-dark">{ds.station_name}</p>
                    <p className="font-ui text-xs text-text-muted">{ds.river} · {ds.station_code}</p>
                  </div>
                </div>
                <div className={`text-xs font-bold font-data px-2 py-1 rounded
                  ${ds.estimated_prob_pct > 60 ? 'bg-risk-4 text-risk-4-text' :
                    ds.estimated_prob_pct > 30 ? 'bg-risk-3 text-risk-3-text' :
                                                  'bg-risk-2 text-risk-2-text'}`}>
                  ~{ds.estimated_prob_pct}%
                </div>
              </div>
            ))}
            <p className="font-ui text-[10px] text-text-muted text-right mt-2">
              Attenuation: Muskingum-Cunge · K/X from HydroSHEDS geometry
            </p>
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
