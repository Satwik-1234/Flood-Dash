import React from 'react';
import { ClockCounterClockwise, Archive, Funnel, MagnifyingGlass, FilePdf, DownloadSimple, Buildings } from 'phosphor-react';
import { useCWCStations } from '../hooks/useTelemetry';

export const HistoricalEvents: React.FC = () => {
  const { data: stations, isLoading, isError } = useCWCStations();

  return (
    <div className="w-full h-full p-12 bg-[#F8FAFC] font-auth overflow-y-auto">

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h2 className="font-display text-text-dark text-3xl font-bold flex items-center">
            <Archive className="w-8 h-8 mr-3 text-suk-forest" weight="duotone" />
            Historical Flood Explorer
          </h2>
          <p className="font-ui text-text-muted mt-1">Review hydrological disaster events, HFL breaches, and PDF post-incident reports.</p>
        </div>

        <div className="flex space-x-3">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Search river basin..."
              className="pl-9 pr-4 py-2 bg-bg-white border border-border-default rounded-lg font-ui text-sm focus:outline-none focus:border-suk-forest w-64"
            />
          </div>
          <button className="bg-bg-white border border-border-default rounded-lg px-4 py-2 font-ui text-sm text-text-dark flex items-center hover:bg-bg-surface-2 transition-colors">
            <Funnel className="w-4 h-4 mr-2" /> Filter Years
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-bg-white border border-border-default rounded-xl p-5 shadow-sm">
          <h4 className="font-ui text-xs font-bold text-text-muted uppercase">Highest Flood Level (HFL) Breaches</h4>
          <div className="font-display text-4xl text-text-dark font-bold mt-2">14</div>
          <p className="font-data text-xs text-suk-fire mt-1">+2 since 2019 monsoon</p>
        </div>
        <div className="bg-bg-white border border-border-default rounded-xl p-5 shadow-sm">
          <h4 className="font-ui text-xs font-bold text-text-muted uppercase">Recorded Inundation Zones</h4>
          <div className="font-display text-4xl text-text-dark font-bold mt-2">1,240</div>
          <p className="font-data text-xs text-text-muted mt-1">Sq Kilometers across Maharashtra</p>
        </div>
        <div className="bg-bg-white border border-border-default rounded-xl p-5 shadow-sm">
          <h4 className="font-ui text-xs font-bold text-text-muted uppercase">PDF Reports Digitized</h4>
          <div className="font-display text-4xl text-text-dark font-bold mt-2">84</div>
          <p className="font-data text-xs text-text-muted mt-1">Sourced from CWC Archives</p>
        </div>
      </div>

      <div className="bg-bg-white border border-border-default rounded-xl shadow-sm overflow-hidden p-6">
        <h3 className="font-display font-bold text-lg text-text-dark mb-4 border-b border-border-light pb-2">Recent Catastrophic Events</h3>
        {isLoading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-bg-surface-2 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-bg-surface-2 rounded"></div>
                <div className="h-4 bg-bg-surface-2 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ) : isError ? (
          <p className="text-suk-fire font-ui">Failed to load historical archives.</p>
        ) : (
          <div className="space-y-4">
            {['Panchganga 2019', 'Krishna Basin 2021', 'Godavari Flash Flood 2005'].map((event, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-border-light rounded-lg hover:bg-bg-surface transition-colors cursor-pointer group">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-bg-surface-2 border border-border-default rounded-full flex items-center justify-center mr-4">
                    <ClockCounterClockwise className="w-6 h-6 text-text-muted" />
                  </div>
                  <div>
                    <h4 className="font-ui font-bold text-text-dark">{event}</h4>
                    <p className="font-ui text-xs text-text-muted mt-0.5">Affected Districts: Kolhapur, Sangli. Severe infrastructural damage.</p>
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-2 text-suk-forest hover:bg-risk-1 rounded transition-all">
                  <DownloadSimple className="w-5 h-5" weight="bold" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

