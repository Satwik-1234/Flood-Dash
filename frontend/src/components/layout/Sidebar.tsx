import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChartBar,
  MapTrifold,
  Waves,
  Database,
  WarningOctagon,
  Terminal,
  Activity,
  ShieldCheck,
} from 'phosphor-react';
import { useDataMeta } from '../../hooks/useTelemetry';

const NAV = [
  { path: '/',          label: 'Overview',     icon: ChartBar,        end: true as const },
  { path: '/map',       label: 'GIS Theatre',  icon: MapTrifold },
  { path: '/flood',     label: 'River Watch',  icon: Waves },
  { path: '/reservoirs',label: 'Reservoirs',   icon: Database },
  { path: '/imd',       label: 'IMD / Weather',icon: WarningOctagon },
  { path: '/monitor',   label: 'System Monitor',icon: Terminal },
];

export const Sidebar: React.FC = () => {
  const { data: meta } = useDataMeta() as any;

  const getAge = (key: string): 'fresh' | 'aging' | 'stale' => {
    const t = meta?.generated_at;
    if (!t) return 'stale';
    const mins = (Date.now() - new Date(t).getTime()) / 60000;
    if (mins < 20) return 'fresh';
    if (mins < 120) return 'aging';
    return 'stale';
  };

  const dotColor = { fresh: '#10B981', aging: '#F59E0B', stale: '#EF4444' };

  return (
    <aside className="w-56 shrink-0 h-screen flex flex-col border-r border-white/5 bg-bg-s1 select-none">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-accent-blue rounded flex items-center justify-center shrink-0">
            <ShieldCheck size={16} weight="fill" className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-t1 font-bold text-sm leading-none tracking-tight">
              PRAVHATATTVA
            </h1>
            <p className="text-[9px] text-t3 font-mono mt-0.5 tracking-widest">FLOOD COMMAND v5</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <p className="section-label px-3 mb-3">Modules</p>
        <ul className="space-y-0.5">
          {NAV.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.end ?? false}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/20'
                      : 'text-t2 hover:text-t1 hover:bg-bg-s2 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      size={16}
                      weight={isActive ? 'fill' : 'regular'}
                      className={isActive ? 'text-accent-blue' : 'text-t3'}
                    />
                    <span className="font-sans tracking-wide">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Data Status */}
      <div className="px-4 py-4 border-t border-white/5 space-y-3">
        <p className="section-label mb-2">Pipeline</p>
        {[
          { key: 'cwc', label: 'CWC Telemetry' },
          { key: 'imd', label: 'IMD Grid' },
          { key: 'radar', label: 'Radar' },
        ].map(s => {
          const age = getAge(s.key);
          return (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-t3">{s.label}</span>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: dotColor[age], boxShadow: age !== 'stale' ? `0 0 4px ${dotColor[age]}` : 'none' }}
                />
                <span className="text-[9px] font-mono text-t3 capitalize">{age}</span>
              </div>
            </div>
          );
        })}

        {meta && (
          <div className="pt-2 border-t border-white/5">
            <p className="text-[9px] font-mono text-t3">
              Last sync: {new Date(meta.generated_at).toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
              })} IST
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-white/5 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-bg-s2 border border-white/10 flex items-center justify-center">
            <Activity size={12} className="text-accent-cyan" />
          </div>
          <div>
            <p className="text-[10px] font-sans text-t1 font-semibold leading-none">S. L. UDUPI</p>
            <p className="text-[8px] font-mono text-t3 mt-0.5">OPERATOR // CCCSS 2026</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
