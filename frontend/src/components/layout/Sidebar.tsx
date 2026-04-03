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
  Cpu,
  ShieldCheck,
  Broadcast
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
    fresh:  'bg-sky-500',
    aging:  'bg-amber-500',
    stale:  'bg-red-500 animate-pulse',
  };

  return (
    <aside className="w-72 h-screen flex flex-col bg-[#020617] border-r-4 border-slate-900 shrink-0 font-auth selection:bg-sky-500/30">
      
      {/* Sidebar Header */}
      <div className="p-8 border-b-2 border-white/5">
        <div className="flex items-center gap-3 mb-2">
           <div className="bg-sky-500 p-2 rounded-none">
              <ShieldCheck size={20} weight="fill" className="text-[#020617]" />
           </div>
           <h1 className="text-white font-black text-2xl tracking-tighter uppercase leading-none">
              PRAVHAT<span className="text-sky-500">ATTVA</span>
           </h1>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 tracking-[0.4em] uppercase mt-2">
           <Broadcast size={12} className="text-sky-500" /> Kernel // v4.0.Alpha
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-8 px-5 scrollbar-hide">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center w-full px-4 py-3 rounded-none transition-all text-[11px] font-black uppercase tracking-widest border-l-4 ${
                    isActive 
                      ? 'bg-sky-500/10 text-sky-400 border-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.1)]' 
                      : 'text-slate-500 hover:text-slate-300 border-transparent hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 mr-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-600'}`} weight={isActive ? 'fill' : 'bold'} />
                    <span className="flex-1 whitespace-nowrap">{item.name}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-black py-0.5 px-2 rounded-none border ${isActive ? 'bg-amber-500 text-slate-900 border-amber-600' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
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

      {/* Bottom Status / Profile */}
      <div className="p-6 bg-[#0F172A]/50 border-t-2 border-white/5 shrink-0">
        <div className="flex items-center justify-around mb-8">
          {[
            { id: 'imd_warnings', label: 'MAUSAM' },
            { id: 'cwc_above_warning', label: 'CWC_FFS' },
            { id: 'radar', label: 'RADAR' }
          ].map(s => (
            <div key={s.id} className="flex flex-col items-center gap-2 group cursor-help">
              <div className={`w-2 h-2 rounded-none ring-2 ring-transparent group-hover:ring-white/20 transition-all ${freshnessColor[getFreshness(s.id)]}`} />
              <span className="text-[8px] font-black text-slate-600 group-hover:text-slate-400 tracking-widest transition-colors">{s.label}</span>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-white border-4 border-slate-900 flex items-center gap-4 shadow-[8px_8px_0_rgba(15,23,42,1)]">
           <div className="w-10 h-10 rounded-none bg-slate-900 flex items-center justify-center border-2 border-sky-500 shadow-inner">
              <Cpu size={18} weight="fill" className="text-sky-500" />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-900 leading-none uppercase tracking-tighter">S. L. UDUPI</p>
              <p className="text-[8px] font-black text-sky-600 mt-1 uppercase tracking-widest leading-none">OPERATOR // SEC_GDI</p>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
