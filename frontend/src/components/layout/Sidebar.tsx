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
  List
} from 'phosphor-react';

const navItems = [
  { path: '/', name: 'Overview', icon: MapPin },
  { path: '/map', name: 'Live Map', icon: MapTrifold },
  { path: '/rivers', name: 'Rivers', icon: Waves },
  { path: '/rain', name: 'Rainfall', icon: CloudRain },
  { path: '/alerts', name: 'Alerts', icon: WarningCircle, badge: 47 },
  { path: '/ml', name: 'ML Analysis', icon: ChartLineUp },
  { path: '/hist', name: 'Historical', icon: ClockCounterClockwise },
  { path: '/urban', name: 'Urban Flood', icon: Buildings },
  { path: '/about', name: 'About & Credits', icon: Info },
  { path: '/status', name: 'Data Status', icon: List },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 h-screen flex flex-col bg-bg-surface border-r border-border-default shrink-0">
      <div className="p-6">
        <h1 className="font-display text-text-dark font-bold text-2xl tracking-[0.10em] mt-1">
          Pravhatattva
        </h1>
        <p className="font-data text-text-muted text-[10px] tracking-widest mt-1 uppercase">Flood Intelligence</p>
      </div>

      <nav className="flex-1 overflow-y-auto pt-2 pb-6 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center w-full px-3 py-2.5 rounded-md transition-all text-sm font-ui font-medium ${
                    isActive 
                      ? 'bg-bg-white text-suk-forest border border-suk-forest shadow-panel' 
                      : 'text-text-muted hover:bg-bg-white hover:text-text-dark border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 mr-3 shrink-0 ${isActive ? 'text-suk-forest opacity-100' : 'opacity-80'}`} weight={isActive ? 'fill' : 'regular'} />
                    <span className="flex-1 whitespace-nowrap">{item.name}</span>
                    {item.badge && (
                      <span className="bg-risk-4-border text-bg-white text-[10px] font-data font-bold py-0.5 px-2 rounded-full ml-auto">
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

      <div className="p-4 border-t border-border-default shrink-0 bg-bg-surface-2/50">
        <div className="flex items-center justify-between px-2 mb-4">
          <div className="flex items-center group">
            <span className="w-2 h-2 rounded-full bg-suk-forest mr-2"></span>
            <span className="text-xs text-text-muted group-hover:text-text-body font-ui transition-colors">IMD</span>
          </div>
          <div className="flex items-center group">
            <span className="w-2 h-2 rounded-full bg-suk-forest mr-2"></span>
            <span className="text-xs text-text-muted group-hover:text-text-body font-ui transition-colors">CWC</span>
          </div>
          <div className="flex items-center group">
            <span className="w-2 h-2 rounded-full bg-suk-amber mr-2"></span>
            <span className="text-xs text-text-muted group-hover:text-text-body font-ui transition-colors">GloFAS</span>
          </div>
        </div>
        
        <div className="px-2">
          <p className="text-[11px] font-ui text-text-body font-bold tracking-wide">Satwik Laxmikamalakar Udupi</p>
          <p className="text-[10px] font-ui text-text-muted mt-0.5">B.Tech Agricultural Engr.</p>
        </div>
      </div>
    </aside>
  );
};
