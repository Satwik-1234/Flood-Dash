import React from 'react';
import { useCWCStations } from '../hooks/useTelemetry';
import { Drop, MapPin, Warning, ArrowUpRight, ArrowDownRight, Minus, SpinnerGap } from 'phosphor-react';

export const RiverForecast: React.FC = () => {
  const { data: stations, isLoading, isError, error } = useCWCStations();

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-bg-cream text-text-muted">
        <SpinnerGap className="w-8 h-8 animate-spin text-suk-forest mb-4" />
        <p className="font-ui text-sm">Fetching telemetry from CWC network...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-bg-cream text-suk-fire p-8">
        <Warning className="w-12 h-12 mb-4" />
        <h3 className="font-display font-bold text-lg text-text-dark">Telemetry Sync Failure</h3>
        <p className="font-ui text-sm mt-2 max-w-md text-center">{(error as Error).message}. Could not establish connection to CWC mock endpoints.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-8 overflow-y-auto space-y-6 bg-bg-cream">
      
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-display text-text-dark text-3xl font-bold flex items-center">
            <Drop className="w-8 h-8 mr-3 text-suk-forest" weight="duotone" />
            River & Basin Analytics
          </h2>
          <p className="font-ui text-text-muted mt-1">Live data ingested and strictly validated via Zod + TanStack Query.</p>
        </div>
        <div className="bg-bg-white border border-border-default px-4 py-2 rounded-lg shadow-sm text-sm font-ui flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-suk-forest animate-pulse"></div>
          <span className="font-bold text-text-dark">Connection API: Stable</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stations?.map(station => {
          
          let riskColor = 'risk-1';
          if (station.current_water_level_m >= station.danger_level_m) riskColor = 'risk-5';
          else if (station.current_water_level_m >= station.warning_level_m) riskColor = 'risk-3';

          return (
            <div key={station.station_code} className={`bg-bg-white border ${riskColor === 'risk-5' ? 'border-suk-fire shadow-md' : 'border-border-default shadow-sm'} rounded-xl p-6 flex flex-col relative`}>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-ui font-bold text-text-dark">{station.river}</h3>
                  <p className="font-ui text-xs text-text-muted mt-0.5 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" /> {station.basin} Basin • {station.station_code}
                  </p>
                </div>
                {station.is_stale && (
                  <span className="bg-bg-surface border border-border-default text-text-muted text-[10px] font-data font-bold py-0.5 px-2 rounded flex items-center">
                    <Warning className="w-3 h-3 mr-1" /> GAP-FILLED
                  </span>
                )}
              </div>

              <div className="flex items-end justify-between mt-auto pt-6">
                <div>
                  <div className="font-display text-4xl font-bold text-text-dark">
                    {station.current_water_level_m.toFixed(2)}
                    <span className="text-xl text-text-muted ml-1">m</span>
                  </div>
                  <div className="font-data text-xs mt-1 text-text-muted flex items-center space-x-2">
                    <span className={`${riskColor === 'risk-5' ? 'text-suk-fire' : 'text-text-muted'}`}>Danger: {station.danger_level_m}m</span>
                    <span>•</span>
                    <span>Warn: {station.warning_level_m}m</span>
                  </div>
                </div>

                <div className={`p-2 rounded-full ${
                  station.trend === 'RISING' ? 'bg-risk-5 text-risk-5-text' : 
                  station.trend === 'FALLING' ? 'bg-risk-1 text-suk-forest' : 'bg-bg-surface text-text-muted'
                }`}>
                  {station.trend === 'RISING' && <ArrowUpRight className="w-5 h-5" weight="bold" />}
                  {station.trend === 'FALLING' && <ArrowDownRight className="w-5 h-5" weight="bold" />}
                  {station.trend === 'STEADY'  && <Minus className="w-5 h-5" weight="bold" />}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
