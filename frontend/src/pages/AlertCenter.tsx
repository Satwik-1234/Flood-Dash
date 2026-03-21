import React, { useState } from 'react';
import { useIMDWarnings } from '../hooks/useTelemetry';
import { WarningOctagon, MagnifyingGlass, Funnel, CloudRain, Warning, Circle, Table, Target } from 'phosphor-react';
import { IMDWarningData } from '../api/schemas';

const getSeverityTheme = (severity: string) => {
  switch(severity) {
    case 'EXTREME': return { bg: 'risk-5', text: 'risk-5-text', border: 'risk-5-border', level: 'L5' };
    case 'SEVERE': return { bg: 'risk-4', text: 'risk-4-text', border: 'risk-4-border', level: 'L4' };
    case 'MODERATE': return { bg: 'risk-3', text: 'suk-amber', border: 'risk-3', level: 'L3' };
    case 'WATCH': return { bg: 'risk-2', text: 'text-dark', border: 'risk-2', level: 'L2' };
    default: return { bg: 'risk-1', text: 'suk-forest', border: 'risk-1', level: 'L1' };
  }
};

export const AlertCenter: React.FC = () => {
  const { data: warnings, isLoading, isError } = useIMDWarnings();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center bg-bg-cream text-text-muted">
        <WarningOctagon className="w-10 h-10 animate-pulse text-suk-fire mb-4" />
        <p className="font-ui font-medium">Synchronizing with Regional Met Centers...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center bg-bg-cream text-suk-fire">
        <Warning className="w-12 h-12 mb-4" />
        <h3 className="font-display text-xl font-bold text-text-dark">Meteorological Sync Offline</h3>
        <p className="font-ui mt-2 max-w-md text-center">Unable to ingest IMD warnings at this time. Network boundary error.</p>
      </div>
    );
  }

  // Filter Logic
  const filteredWarnings = warnings?.filter(w => {
    const matchesSearch = w.district.toLowerCase().includes(searchTerm.toLowerCase()) || w.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'ALL' || w.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  }) || [];

  return (
    <div className="w-full h-full p-8 overflow-y-auto bg-bg-cream">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h2 className="font-display text-text-dark text-3xl font-bold flex items-center">
            <WarningOctagon className="w-8 h-8 mr-3 text-suk-fire" weight="duotone" />
            Live Alert Center
          </h2>
          <p className="font-ui text-text-muted mt-1">Real-time severe weather and catchment warnings ingested via IMD & CWC APIs.</p>
        </div>

        <div className="flex space-x-3">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search district or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-bg-white border border-border-default rounded-lg font-ui text-sm focus:outline-none focus:border-suk-forest w-64"
            />
          </div>
          <select 
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-bg-white border border-border-default rounded-lg px-4 py-2 font-ui text-sm text-text-dark focus:outline-none focus:border-suk-forest"
          >
            <option value="ALL">All Severities</option>
            <option value="EXTREME">Level 5 (Extreme)</option>
            <option value="SEVERE">Level 4 (Severe)</option>
            <option value="MODERATE">Level 3 (Moderate)</option>
            <option value="WATCH">Level 2 (Watch)</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {['EXTREME', 'SEVERE', 'MODERATE', 'WATCH'].map(sev => {
          const count = warnings?.filter(w => w.severity === sev).length || 0;
          const theme = getSeverityTheme(sev);
          return (
            <div key={sev} className={`bg-bg-white border-l-4 border-l-${theme.border} border-t border-r border-b border-border-default rounded-r-xl p-4 shadow-sm flex items-center justify-between`}>
              <div>
                <p className="font-ui text-xs font-bold text-text-muted uppercase tracking-wider">{sev} RISK</p>
                <p className="font-display text-2xl font-bold text-text-dark mt-1">{count}</p>
              </div>
              <Circle className={`w-8 h-8 text-${theme.text} opacity-20`} weight="fill" />
            </div>
          );
        })}
      </div>

      {/* Alert Table */}
      <div className="bg-bg-white border border-border-default rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-surface border-b border-border-default font-ui text-xs font-bold text-text-muted uppercase tracking-wider">
                <th className="p-4 w-24">Risk Lvl</th>
                <th className="p-4 w-40">Severity Token</th>
                <th className="p-4 w-48">Target District</th>
                <th className="p-4">Meteorological Context (24h Rain)</th>
                <th className="p-4 w-32">Timestamp</th>
                <th className="p-4 w-24">Telemetry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light font-ui text-sm text-text-body">
              {filteredWarnings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-muted bg-bg-cream/50">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No active warnings match your strict filters.
                  </td>
                </tr>
              ) : (
                filteredWarnings.map((warning: IMDWarningData) => {
                  const theme = getSeverityTheme(warning.severity);
                  return (
                    <tr key={warning.id} className="hover:bg-bg-cream transition-colors group">
                      <td className="p-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold bg-${theme.bg} text-${theme.text} border border-${theme.border}`}>
                          {theme.level}
                        </div>
                      </td>
                      <td className="p-4 font-bold tracking-wide">
                        <span className={`text-${theme.text}`}>{warning.severity}</span>
                      </td>
                      <td className="p-4 font-bold text-text-dark">{warning.district}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <CloudRain className="w-5 h-5 text-suk-river" weight="duotone" />
                          <span>Recorded <strong className="font-data">{warning.rainfall_24h_mm}mm</strong> of intense precipitation. Flash flood highly probable in low-lying zones.</span>
                        </div>
                      </td>
                      <td className="p-4 font-data text-xs text-text-muted whitespace-nowrap">
                        {warning.issued_at}
                      </td>
                      <td className="p-4">
                        {warning.is_stale ? (
                          <span className="bg-bg-surface border border-border-default text-text-muted text-[10px] font-data font-bold py-0.5 px-2 rounded">STALE</span>
                        ) : (
                          <span className="bg-risk-1 border border-border-default text-suk-forest text-[10px] font-data font-bold py-0.5 px-2 rounded">LIVE </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
