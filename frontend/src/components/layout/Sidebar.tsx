import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Waves, 
  Droplets, 
  CloudRain, 
  Terminal,
  Activity
} from 'lucide-react';
import { useDataMeta } from '../../hooks/useTelemetry';
import { clsx } from 'clsx';

const Sidebar: React.FC = () => {
  const { data: meta } = useDataMeta();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'COMMAND' },
    { to: '/map', icon: MapIcon, label: 'GIS THEATRE' },
    { to: '/flood-watch', icon: Waves, label: 'RIVER WATCH' },
    { to: '/reservoir', icon: Droplets, label: 'RESERVOIR' },
    { to: '/imd', icon: CloudRain, label: 'WEATHER' },
    { to: '/system', icon: Terminal, label: 'SYSTEM' },
  ];

  return (
    <div className="nav-island">
      <div className="flex flex-col items-center mb-6 pt-2">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 mb-2">
          <Activity className="w-5 h-5 text-accent-cyan" />
        </div>
        <div className="w-1 h-1 rounded-full bg-accent-cyan pulse-cyan" />
      </div>

      <nav className="flex flex-col gap-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx(
              'nav-item group relative transition-all duration-200',
              isActive && 'active'
            )}
          >
            <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
            
            {/* Tooltip */}
            <div className="absolute left-16 px-2 py-1 bg-slate-900 border border-white/10 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[1000] font-bold tracking-widest shadow-xl">
              {item.label}
            </div>
            
            {/* Active Indicator Halo */}
            <div className={clsx(
              "absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none",
              "bg-accent-blue/5 opacity-0 group-[.active]:opacity-100"
            )} />
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pb-4 flex flex-col items-center gap-4">
        <div className="text-[9px] font-mono text-t3 -rotate-90 origin-center whitespace-nowrap py-4 tracking-[0.3em]">
          NODE VR-05
        </div>
        <div 
          className={clsx(
            "w-1.5 h-1.5 rounded-full transition-colors duration-500",
            meta?.status === 'error' ? 'bg-accent-red shadow-[0_0_8px_#ef4444]' : 'bg-accent-cyan shadow-[0_0_8px_#22d3ee]'
          )}
        />
      </div>
    </div>
  );
};

export default Sidebar;
