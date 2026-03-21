import React, { useState } from 'react';
import { CloudRain, Clock, Info } from 'phosphor-react';
import { computeEffectiveRunoff, computeAMCClass, BASIN_CN_LOOKUP } from '../utils/scscn';

const DISTRICT_RAINFALL = [
  { district: 'Kolhapur',   state: 'Maharashtra', observed_24h: 210.5, normal_24h: 18.2, season_total: 1840, season_normal: 2948 },
  { district: 'Sangli',     state: 'Maharashtra', observed_24h: 148.2, normal_24h: 12.4, season_total: 1420, season_normal: 2350 },
  { district: 'Nashik',     state: 'Maharashtra', observed_24h: 87.0,  normal_24h: 11.0, season_total: 1050, season_normal: 1950 },
  { district: 'Pune',       state: 'Maharashtra', observed_24h: 64.0,  normal_24h: 9.8,  season_total: 890,  season_normal: 1750 },
  { district: 'Satara',     state: 'Maharashtra', observed_24h: 172.0, normal_24h: 14.5, season_total: 1680, season_normal: 2600 },
  { district: 'Solapur',    state: 'Maharashtra', observed_24h: 22.0,  normal_24h: 7.2,  season_total: 390,  season_normal: 820  },
  { district: 'Ratnagiri',  state: 'Maharashtra', observed_24h: 285.0, normal_24h: 32.0, season_total: 3200, season_normal: 3800 },
  { district: 'Raigad',     state: 'Maharashtra', observed_24h: 198.0, normal_24h: 25.0, season_total: 2640, season_normal: 3200 },
];

type DepartureStatus = 'Large Excess' | 'Excess' | 'Normal' | 'Deficient' | 'Large Deficit';

function getDepartureStatus(departurePct: number): { label: DepartureStatus; color: string } {
  if (departurePct >  60) return { label: 'Large Excess',    color: 'text-risk-5-text bg-risk-5'  };
  if (departurePct >  19) return { label: 'Excess',          color: 'text-risk-3-text bg-risk-3' };
  if (departurePct > -19) return { label: 'Normal',          color: 'text-risk-1-text bg-risk-1'};
  if (departurePct > -59) return { label: 'Deficient',       color: 'text-text-muted bg-bg-surface'};
  return                          { label: 'Large Deficit',  color: 'text-text-muted bg-bg-surface-2'};
}

export const RainfallRadar: React.FC = () => {
  const [sortBy, setSortBy]     = useState<'departure' | 'observed' | 'district'>('departure');
  const [showRunoff, setRunoff] = useState(false);

  const enriched = DISTRICT_RAINFALL.map(d => {
    const departurePct = Math.round(((d.observed_24h - d.normal_24h) / d.normal_24h) * 100);
    const seasonDep    = Math.round(((d.season_total - d.season_normal) / d.season_normal) * 100);
    const amc          = computeAMCClass(Math.min(d.season_total * 0.04, 80)); // rough API estimate
    const cn           = BASIN_CN_LOOKUP['DEFAULT'] ?? 76;
    const scscn        = computeEffectiveRunoff(d.observed_24h, cn, amc);
    return { ...d, departurePct, seasonDep, scscn, status: getDepartureStatus(departurePct) };
  }).sort((a, b) =>
    sortBy === 'departure' ? b.departurePct - a.departurePct :
    sortBy === 'observed'  ? b.observed_24h - a.observed_24h :
    a.district.localeCompare(b.district)
  );

  return (
    <div className="w-full h-full p-8 overflow-y-auto space-y-8 bg-bg-cream">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-display text-text-dark text-3xl font-bold flex items-center">
            <CloudRain className="w-8 h-8 mr-3 text-suk-river" weight="duotone" />
            Rainfall & Runoff Radar
          </h2>
          <p className="font-ui text-text-muted mt-1">
            District-level observed rainfall with SCS-CN effective runoff transformation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-sm font-ui cursor-pointer">
            <input type="checkbox" checked={showRunoff}
                   onChange={e => setRunoff(e.target.checked)}
                   className="rounded" />
            <span className="text-text-body font-bold">Show Runoff Q</span>
          </label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  className="bg-bg-white border border-border-default rounded-lg px-3 py-2
                             font-ui text-sm focus:outline-none focus:border-suk-forest">
            <option value="departure">Sort: Departure %</option>
            <option value="observed">Sort: Observed mm</option>
            <option value="district">Sort: District A–Z</option>
          </select>
        </div>
      </div>

      {/* SCS-CN info banner */}
      <div className="bg-bg-white border border-border-default rounded-xl p-4 flex items-start space-x-3">
        <Info className="w-5 h-5 text-suk-river shrink-0 mt-0.5" />
        <p className="font-ui text-sm text-text-body">
          <strong>Effective Runoff (Q)</strong> is what actually floods — not raw rainfall.
          The SCS Curve Number method transforms rainfall P into runoff Q based on soil
          saturation (AMC class) and land use. Same rain, 3× the runoff on Day 45 of monsoon.
        </p>
      </div>

      {/* State table */}
      <div className="bg-bg-white border border-border-default rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-surface border-b border-border-default font-ui text-xs
                           font-bold text-text-muted uppercase tracking-wider">
              <th className="p-4">District</th>
              <th className="p-4 text-right">24h Observed</th>
              <th className="p-4 text-right">24h Normal</th>
              <th className="p-4 text-right">Departure %</th>
              {showRunoff && <th className="p-4 text-right">Runoff Q (mm)</th>}
              {showRunoff && <th className="p-4 text-right">AMC</th>}
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Season Dep.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light font-ui text-sm text-text-body">
            {enriched.map(d => (
              <tr key={d.district} className="hover:bg-bg-cream transition-colors">
                <td className="p-4 font-bold text-text-dark">
                  {d.district}
                  <span className="font-ui text-xs text-text-muted ml-1 font-normal">
                    {d.state}
                  </span>
                </td>
                <td className="p-4 text-right font-data font-bold">{d.observed_24h} mm</td>
                <td className="p-4 text-right font-data text-text-muted">{d.normal_24h} mm</td>
                <td className={`p-4 text-right font-data font-bold
                  ${d.departurePct > 60 ? 'text-suk-fire' :
                    d.departurePct > 19 ? 'text-suk-amber' : 'text-text-muted'}`}>
                  {d.departurePct > 0 ? '+' : ''}{d.departurePct}%
                </td>
                {showRunoff && (
                  <td className="p-4 text-right font-data font-bold text-suk-fire">
                    {d.scscn.runoff_Q_mm} mm
                  </td>
                )}
                {showRunoff && (
                  <td className="p-4 text-right">
                    <span className={`font-data text-xs font-bold px-2 py-0.5 rounded
                      ${d.scscn.amc_class === 'III' ? 'bg-risk-5 text-risk-5-text' :
                        d.scscn.amc_class === 'II'  ? 'bg-risk-3 text-risk-3-text' :
                                                       'bg-risk-1 text-risk-1-text'}`}>
                      AMC-{d.scscn.amc_class}
                    </span>
                  </td>
                )}
                <td className="p-4">
                  <span className={`font-ui text-xs font-bold px-2 py-1 rounded
                                    ${d.status.color}`}>
                    {d.status.label}
                  </span>
                </td>
                <td className={`p-4 text-right font-data text-sm font-bold
                  ${d.seasonDep > 0 ? 'text-suk-river' : 'text-text-muted'}`}>
                  {d.seasonDep > 0 ? '+' : ''}{d.seasonDep}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="font-ui text-xs text-text-muted text-right">
        Source: IMD district API (mock) · SCS-CN: USDA TR-55 adapted IS:11223 ·
        Updated: {new Date().toLocaleTimeString('en-IN')}
      </p>
    </div>
  );
};

export default RainfallRadar;
