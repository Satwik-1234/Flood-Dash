import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  MapPin, 
  MapTrifold, 
  Waves, 
  CloudRain, 
  WarningCircle, 
  ChartLineUp, 
  ClockCounterClockwise, 
  Buildings, 
  Info, 
  List,
  Activity,
  Cpu
} from 'phosphor-react';
import { useDataMeta } from '../../hooks/useTelemetry';

const navItems = [
  { path: '/', name: 'Overview', icon: MapPin },
  { path: '/map', name: 'Live Map', icon: MapTrifold },
  { path: '/rivers', name: 'Hydro-Logic', icon: Waves },
  { path: '/rain', name: 'Meteo-Grid', icon: CloudRain },
  { path: '/alerts', name: 'Risk Log', icon: WarningCircle, badge: 47 },
  { path: '/ml', name: 'ML Analysis', icon: ChartLineUp },
  { path: '/hist', name: 'Archive', icon: ClockCounterClockwise },
  { path: '/urban', name: 'Urban Pulse', icon: Buildings },
  { path: '/about', name: 'System Info', icon: Info },
  { path: '/status', name: 'Telemetry', icon: List },
];

export const Sidebar: React.FC = () => {
  const { data: meta } = useDataMeta();

  function getFreshness(key: string): 'fresh' | 'aging' | 'stale' {
    const m = meta as any;
    const source = m?.sources?.[key];
    if (!source?.last_fetch) return 'stale';
    const ageMin = (Date.now() - new Date(source.last_fetch).getTime()) / 60000;
    if (ageMin < 20) return 'fresh';
    if (ageMin < 60) return 'aging';
    return 'stale';
  }

  const freshnessColor = {
    fresh:  'bg-emerald-500',
    aging:  'bg-amber-500',
    stale:  'bg-red-500 animate-pulse',
  };

  return (
    <aside className="w-64 h-screen flex flex-col bg-slate-900 border-r border-slate-800 shrink-0 selection:bg-emerald-500/30">
      
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex items-center gap-2 mb-1">
           <div className="bg-emerald-500 p-1.5 rounded-sm">
              <Activity size={16} className="text-slate-900" />
           </div>
           <h1 className="font-display text-white font-black text-xl tracking-tighter uppercase leading-none">
              PRAVHAT <span className="font-light text-slate-500">IVV</span>
           </h1>
        </div>
        <p className="font-data text-slate-500 text-[9px] tracking-[0.2em] font-black uppercase mt-1">Kernel v4.0.Alpha</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 scrollbar-hide">
        <ul className="space-y-1.5">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center w-full px-3 py-2.5 rounded transition-all text-[11px] font-data font-black uppercase tracking-widest border ${
                    isActive 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                      : 'text-slate-500 hover:text-slate-300 border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-4 h-4 mr-3 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-600'}`} weight={isActive ? 'fill' : 'bold'} />
                    <span className="flex-1 whitespace-nowrap">{item.name}</span>
                    {item.badge && (
                      <span className={`text-[9px] font-black font-data py-0.5 px-1.5 rounded border ${isActive ? 'bg-emerald-500 text-slate-900 border-emerald-600' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Profile / Status */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
        <div className="flex items-center justify-between px-2 mb-5">
          {/* IMD */}
          <div className="flex flex-col items-center gap-1 group">
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${freshnessColor[getFreshness('imd_warnings')]}`}></span>
            <span className="text-[8px] font-black text-slate-600 group-hover:text-slate-400 font-data transition-colors">MAUSAM</span>
          </div>
          {/* CWC */}
          <div className="flex flex-col items-center gap-1 group">
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${freshnessColor[getFreshness('cwc_above_warning')]}`}></span>
            <span className="text-[8px] font-black text-slate-600 group-hover:text-slate-400 font-data transition-colors">CWC_FFS</span>
          </div>
          {/* Radar */}
          <div className="flex flex-col items-center gap-1 group">
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${freshnessColor[getFreshness('radar')]}`}></span>
            <span className="text-[8px] font-black text-slate-600 group-hover:text-slate-400 font-data transition-colors">RADAR</span>
          </div>
        </div>
        
        <div className="px-2 py-3 bg-slate-900/50 border border-slate-800 rounded flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <Cpu size={14} className="text-slate-500" />
           </div>
           <div>
              <p className="text-[9px] font-black font-data text-white leading-none uppercase tracking-tighter">S. L. Udupi</p>
              <p className="text-[8px] font-black font-data text-slate-500 mt-1 uppercase tracking-widest leading-none">OPERATOR // IN_CORE</p>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
