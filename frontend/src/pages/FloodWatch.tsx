import React, { useState, useMemo } from 'react';
import { 
  Search, 
  AlertTriangle, 
  ChevronRight, 
  Info,
  Layers,
  Activity,
  Filter,
  ArrowUpRight,
  Waves
} from 'lucide-react';
import { 
  useCWCLiveLevels, 
  useCWCAboveWarning, 
  useHydrograph,
  useCWCStationCatalog
} from '../hooks/useTelemetry';
import { CWCStationMeta } from '../hooks/useTelemetry';
import { clsx } from 'clsx';
import Hydrograph from '../components/charts/Hydrograph';

const FloodWatch: React.FC = () => {
  const { data: stations = [] }          = useCWCStationCatalog();
  const { data: levels = [], isLoading } = useCWCLiveLevels();
  const { data: warnings = [] }          = useCWCAboveWarning();
  
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'warning' | 'alert'>('all');
  const [selected, setSelected] = useState<string | null>(null);

  const warningSet = useMemo(() => new Set(warnings.map(w => w.stationCode)), [warnings]);

  // Merge Live Levels with Station Metadata
  const mergedData = useMemo(() => {
    const catalogMap = new Map<string, CWCStationMeta>(stations.map(s => [s.code, s]));
    return levels.map(l => {
      const meta = catalogMap.get(l.stationCode);
      return {
        ...l,
        stationName: meta?.name || l.stationCode,
        riverName: meta?.river || 'N/A',
        warning_m: meta?.warning_m || 0,
        danger_m: meta?.danger_m || 0
      };
    });
  }, [levels, stations]);

  const filtered = useMemo(() => {
    let data = mergedData;
    if (search) data = data.filter(l => 
      l.stationCode.toLowerCase().includes(search.toLowerCase()) || 
      l.stationName?.toLowerCase().includes(search.toLowerCase())
    );
    if (filter === 'warning') data = data.filter(l => warningSet.has(l.stationCode));
    return [...data].sort((a, b) => {
      const aW = warningSet.has(a.stationCode) ? 0 : 1;
      const bW = warningSet.has(b.stationCode) ? 0 : 1;
      return aW - bW;
    });
  }, [mergedData, search, filter, warningSet]);

  const selectedStation = selected ? mergedData.find(l => l.stationCode === selected) : null;

  return (
    <div className="flex-1 flex flex-col bg-bg-deep overflow-hidden">
      {/* Tactical Header */}
      <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-surface-base">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Waves className="w-4 h-4 text-accent-cyan" />
             <span className="text-[10px] font-bold tracking-[0.2em] text-t3 uppercase">Telemetry Stream: ACTIVE</span>
          </div>
          <h1 className="heading-display text-3xl text-white">River Watch</h1>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Search & Filter Island */}
           <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-t3" />
                <input 
                  type="text" 
                  placeholder="Filter stations..."
                  className="bg-transparent pl-9 pr-4 py-2 text-xs font-medium text-white focus:outline-none w-48"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-[1px] h-6 bg-white/10 mx-1" />
              <button 
                onClick={() => setFilter(filter === 'all' ? 'warning' : 'all')}
                className={clsx(
                  "px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest transition-all",
                  filter === 'warning' ? "bg-accent-amber/20 text-accent-amber border border-accent-amber/30" : "text-t3 hover:text-white"
                )}
              >
                {filter === 'warning' ? 'CRITICAL ONLY' : 'ALL NODES'}
              </button>
           </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Table View */}
        <div className="flex-1 overflow-y-auto p-8">
           <div className="glass-panel rounded-3xl overflow-hidden border-white/5">
              <table className="data-table">
                 <thead>
                    <tr>
                       <th>Ident</th>
                       <th>Sensor Location</th>
                       <th>Basin</th>
                       <th className="text-right">Level</th>
                       <th>Status</th>
                       <th className="w-12"></th>
                    </tr>
                 </thead>
                 <tbody>
                    {filtered.map(l => (
                      <tr 
                        key={l.stationCode} 
                        onClick={() => setSelected(l.stationCode)}
                        className={clsx(
                          "cursor-pointer transition-all duration-200 group",
                          selected === l.stationCode ? "bg-accent-blue/10" : "hover:bg-white/5",
                          warningSet.has(l.stationCode) && "bg-accent-amber/5"
                        )}
                      >
                         <td className="font-mono text-[11px] text-accent-cyan">{l.stationCode}</td>
                         <td className="font-bold text-white tracking-tight">{l.stationName || 'Gauging Station'}</td>
                         <td className="text-t2 text-[11px]">{l.riverName || 'National Basin'}</td>
                         <td className="text-right">
                            <span className={clsx(
                              "font-mono-data text-base font-bold",
                              warningSet.has(l.stationCode) ? "text-accent-amber" : "text-white"
                            )}>{l.latestDataValue?.toFixed(2)}</span>
                            <span className="text-[9px] text-t3 ml-1 font-mono">m</span>
                         </td>
                         <td>
                            <div className="flex items-center gap-2">
                               <div className={clsx(
                                 "w-1.5 h-1.5 rounded-full",
                                 warningSet.has(l.stationCode) ? "bg-accent-amber pulse-cyan" : "bg-ok"
                               )} />
                               <span className={clsx(
                                 "text-[10px] font-bold tracking-widest uppercase",
                                 warningSet.has(l.stationCode) ? "text-accent-amber" : "text-ok"
                               )}>{warningSet.has(l.stationCode) ? 'Warning' : 'Stable'}</span>
                            </div>
                         </td>
                         <td>
                            <ArrowUpRight className="w-4 h-4 text-t3 opacity-0 group-hover:opacity-100 transition-all" />
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Intelligence Side-Panel */}
        {selectedStation && (
          <StationInspector 
            station={selectedStation} 
            isWarning={warningSet.has(selectedStation.stationCode)}
            onClose={() => setSelected(null)} 
          />
        )}
      </div>
    </div>
  );
};

const StationInspector: React.FC<{ station: any; isWarning: boolean; onClose: () => void }> = ({ station, isWarning, onClose }) => {
  const { data: trend } = useHydrograph(station.stationCode);

  return (
    <div className="w-[450px] border-l border-white/5 bg-surface-base/80 backdrop-blur-xl p-8 flex flex-col animate-slideInRight">
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/10">
            <Activity className="w-4 h-4 text-accent-cyan" />
            <span className="text-[10px] font-bold text-t2 tracking-widest uppercase truncate w-32">NODE {station.stationCode}</span>
         </div>
         <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5 text-t3" />
         </button>
      </div>

      <div className="mb-10">
         <h2 className="heading-display text-3xl text-white mb-2">{station.stationName || 'Gauging Node'}</h2>
         <div className="flex items-center gap-4 text-xs text-t3">
            <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {station.riverName || 'River Basin'}</span>
            <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Telemetry: LIVE</span>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
         <div className="glass-card p-6 bg-accent-blue/5 border-accent-blue/20">
            <div className="text-[9px] font-bold text-accent-blue uppercase tracking-widest mb-3">CURRENT FLOW</div>
            <div className="flex items-baseline gap-2">
               <span className="text-4xl font-bold text-white font-display">{station.latestDataValue?.toFixed(2)}</span>
               <span className="text-sm font-mono text-t3">m</span>
            </div>
         </div>
         <div className={clsx(
           "glass-card p-6",
           isWarning ? "bg-accent-amber/5 border-accent-amber/30" : "bg-white/5 border-white/10"
         )}>
            <div className="text-[9px] font-bold text-t3 uppercase tracking-widest mb-3">24H VARIANCE</div>
            <div className="flex items-baseline gap-2">
               <span className="text-4xl font-bold text-white font-display">±0.12</span>
               <span className="text-sm font-mono text-red-500 text-t3">m</span>
            </div>
         </div>
      </div>

      <div className="flex-1 flex flex-col">
         <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
               <Filter className="w-3.5 h-3.5 text-t3" />
               <span className="text-[10px] font-bold text-t2 tracking-widest uppercase">24H Hydrograph History</span>
            </div>
            <span className="text-[9px] font-mono text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded">SYNC: OK</span>
         </div>
         <div className="p-4 bg-black/20 rounded-3xl border border-white/5 flex-1 min-h-[250px]">
           <Hydrograph data={trend || []} height={250} />
         </div>
      </div>

      <div className="mt-8 flex gap-3">
         <button className="flex-1 py-4 bg-accent-blue text-white rounded-2xl text-[10px] font-bold tracking-widest shadow-lg shadow-accent-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            EXPORT TELEMETRY
         </button>
      </div>
    </div>
  );
};

export default FloodWatch;
