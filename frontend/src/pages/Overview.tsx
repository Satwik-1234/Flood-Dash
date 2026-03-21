import React from 'react';
import { 
  WarningCircle, 
  MapPin, 
  CloudRain, 
  Buildings,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  WarningOctagon
} from 'phosphor-react';
import { Link } from 'react-router-dom';

const KPI_METRICS = [
  {
    title: 'Critical Alerts',
    value: '04',
    subtitle: 'Active Risk L4/L5',
    icon: WarningCircle,
    trend: '+2',
    trendType: 'danger',
    color: 'suk-fire',
    bg: 'risk-5',
    link: '/alerts'
  },
  {
    title: 'Active CWC Stations',
    value: '1,428',
    subtitle: 'Across India',
    icon: MapPin,
    trend: '98%',
    trendType: 'success',
    color: 'suk-forest',
    bg: 'risk-1',
    link: '/rivers'
  },
  {
    title: '24h Rainfall Avg.',
    value: '42.5',
    unit: 'mm',
    subtitle: 'Maharashtra Basin',
    icon: CloudRain,
    trend: '+12%',
    trendType: 'warning',
    color: 'suk-river',
    bg: 'bg-surface-2',
    link: '/rain'
  },
  {
    title: 'Districts Affected',
    value: '12',
    subtitle: 'Inundation > 15%',
    icon: Buildings,
    trend: 'Stable',
    trendType: 'neutral',
    color: 'suk-amber',
    bg: 'risk-3',
    link: '/dist'
  }
];

const RECENT_ALERTS = [
  {
    id: 'ALT-101',
    basin: 'Panchganga River',
    district: 'Kolhapur',
    level: 5,
    message: 'Extreme flood condition. Water level 41.5ft (Danger Mark: 39ft). Evacuation protocols initiated.',
    time: '12 mins ago'
  },
  {
    id: 'ALT-102',
    basin: 'Krishna River',
    district: 'Sangli',
    level: 4,
    message: 'Severe flood situation. Level rising steadily 1.2cm/hr.',
    time: '45 mins ago'
  },
  {
    id: 'ALT-103',
    basin: 'Godavari Basin',
    district: 'Nashik',
    level: 3,
    message: 'Heavy localized rainfall (85mm). Pluvial flood warnings issued for low-lying areas.',
    time: '2 hrs ago'
  }
];

export const Overview: React.FC = () => {
  return (
    <div className="w-full h-full p-8 overflow-y-auto space-y-8 bg-bg-cream">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-display text-text-dark text-3xl font-bold">National Overview</h2>
          <p className="font-ui text-text-muted mt-1">Real-time Flood Intelligence & Predictive Hydrology</p>
        </div>
        <div className="flex items-center space-x-2 text-sm font-ui bg-bg-white border border-border-default px-4 py-2 rounded-lg shadow-sm">
          <Clock className="w-4 h-4 text-suk-forest" />
          <span className="text-text-body font-medium">Auto-refresh (Live)</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {KPI_METRICS.map((kpi, idx) => (
          <Link to={kpi.link} key={idx} className="block group">
            <div className="bg-bg-white border border-border-default rounded-xl p-6 shadow-sm hover:shadow-md hover:border-border-strong transition-all h-full flex flex-col relative overflow-hidden">
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-lg bg-${kpi.bg}`}>
                  <kpi.icon className={`w-6 h-6 text-${kpi.color}`} weight="duotone" />
                </div>
                <div className={`flex items-center text-xs font-bold font-data px-2 py-1 rounded bg-bg-surface ${
                  kpi.trendType === 'danger' ? 'text-suk-fire' : 
                  kpi.trendType === 'success' ? 'text-suk-forest' : 
                  kpi.trendType === 'warning' ? 'text-suk-amber' : 'text-text-muted'
                }`}>
                  {kpi.trendType === 'danger' && <ArrowUpRight className="w-3 h-3 mr-1" />}
                  {kpi.trendType === 'success' && <ArrowUpRight className="w-3 h-3 mr-1" />}
                  {kpi.trendType === 'warning' && <ArrowUpRight className="w-3 h-3 mr-1" />}
                  {kpi.trend}
                </div>
              </div>

              <div className="mt-auto relative z-10">
                <div className="flex items-baseline space-x-1">
                  <span className="font-display text-4xl font-bold text-text-dark">{kpi.value}</span>
                  {kpi.unit && <span className="font-ui font-bold text-text-muted">{kpi.unit}</span>}
                </div>
                <h3 className="font-ui font-bold text-text-body mt-2">{kpi.title}</h3>
                <p className="font-ui text-sm text-text-muted mt-0.5">{kpi.subtitle}</p>
              </div>

              {/* Decorative Background Icon */}
              <kpi.icon className="absolute -bottom-4 -right-4 w-32 h-32 text-bg-surface-2 opacity-50 z-0 pointer-events-none transition-transform group-hover:scale-110" weight="fill" />
            </div>
          </Link>
        ))}
      </div>

      {/* Two Column Layout: Alerts & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Alerts Feed */}
        <div className="lg:col-span-2 bg-bg-white border border-border-default rounded-xl shadow-sm flex flex-col">
          <div className="p-6 border-b border-border-light flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <WarningOctagon className="w-5 h-5 text-suk-fire" weight="fill" />
              <h3 className="font-display font-bold text-lg text-text-dark">Critical Live Alerts</h3>
            </div>
            <Link to="/alerts" className="text-sm font-ui font-bold text-suk-forest hover:text-suk-forest-mid">View All &rarr;</Link>
          </div>
          <div className="divide-y divide-border-light flex-1">
            {RECENT_ALERTS.map(alert => (
              <div key={alert.id} className="p-6 hover:bg-bg-cream transition-colors flex items-start space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-lg bg-risk-${alert.level} text-risk-${alert.level}-text border border-risk-${alert.level}-border`}>
                  L{alert.level}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-ui font-bold text-text-dark">{alert.basin}</h4>
                      <p className="font-ui text-xs font-bold text-text-muted uppercase tracking-wider mt-0.5">{alert.district} District • {alert.id}</p>
                    </div>
                    <span className="font-data text-xs text-text-muted whitespace-nowrap">{alert.time}</span>
                  </div>
                  <p className="font-ui text-sm text-text-body mt-2 leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health / API Connections */}
        <div className="bg-bg-white border border-border-default rounded-xl shadow-sm p-6 flex flex-col">
          <h3 className="font-display font-bold text-lg text-text-dark mb-6">API Telemetry Status</h3>
          
          <div className="space-y-5 flex-1">
            {/* IMD */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-suk-forest animate-pulse"></div>
                <div>
                  <h4 className="font-ui font-bold text-sm text-text-dark">IMD AWS Network</h4>
                  <p className="font-ui text-xs text-text-muted">Updated 2 mins ago</p>
                </div>
              </div>
              <span className="font-data text-xs font-bold text-suk-forest bg-risk-1 px-2 py-1 rounded">100%</span>
            </div>

            {/* CWC */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-suk-forest animate-pulse"></div>
                <div>
                  <h4 className="font-ui font-bold text-sm text-text-dark">CWC River Gauges</h4>
                  <p className="font-ui text-xs text-text-muted">Updated 15 mins ago</p>
                </div>
              </div>
              <span className="font-data text-xs font-bold text-suk-forest bg-risk-1 px-2 py-1 rounded">98%</span>
            </div>

            {/* GloFAS */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-suk-amber"></div>
                <div>
                  <h4 className="font-ui font-bold text-sm text-text-dark">GloFAS Forecasts</h4>
                  <p className="font-ui text-xs text-text-muted">Latency detected (&gt;1hr)</p>
                </div>
              </div>
              <span className="font-data text-xs font-bold text-suk-amber bg-risk-3 px-2 py-1 rounded">Delayed</span>
            </div>

            {/* ISRO Bhuvan */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-suk-forest animate-pulse"></div>
                <div>
                  <h4 className="font-ui font-bold text-sm text-text-dark">ISRO Bhuvan WMS</h4>
                  <p className="font-ui text-xs text-text-muted">Tile server connected</p>
                </div>
              </div>
              <span className="font-data text-xs font-bold text-suk-forest bg-risk-1 px-2 py-1 rounded">Stable</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border-light">
            <Link to="/status" className="w-full block text-center py-2 bg-bg-surface hover:bg-bg-surface-2 border border-border-default rounded-lg font-ui font-bold text-sm text-text-body transition-colors">
              Detailed Diagnostics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
