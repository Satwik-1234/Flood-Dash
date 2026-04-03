import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { useRealtimeTelemetry } from './hooks/useWebSocket';

// Eager load — always needed immediately
import { Overview }     from './pages/Overview';
import { AlertCenter }  from './pages/AlertCenter';

// Lazy load
const LiveMap         = lazy(() => import('./pages/LiveMap').then(m => ({ default: m.LiveMap })));
const MLAnalysis      = lazy(() => import('./pages/MLAnalysis').then(m => ({ default: m.MLAnalysis })));
const RiverForecast   = lazy(() => import('./pages/RiverForecast').then(m => ({ default: m.RiverForecast })));
const RainfallRadar   = lazy(() => import('./pages/RainfallRadar').then(m => ({ default: m.RainfallRadar })));
const HistoricalEvents = lazy(() => import('./pages/HistoricalEvents').then(m => ({ default: m.HistoricalEvents })));
const UrbanFloodRisk  = lazy(() => import('./pages/UrbanFloodRisk').then(m => ({ default: m.UrbanFloodRisk })));
const DistrictDrilldown = lazy(() => import('./pages/DistrictDrilldown').then(m => ({ default: m.DistrictDrilldown })));
const AboutPage       = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const DataSources     = lazy(() => import('./pages/DataSources').then(m => ({ default: m.DataSources })));

const PageSkeleton = () => (
  <div className="flex items-center justify-center w-full h-full bg-[#F8FAFC]">
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-2">
         <div className="w-3 h-3 bg-sky-500 animate-ping" />
         <div className="w-3 h-3 bg-sky-600 animate-ping delay-75" />
         <div className="w-3 h-3 bg-sky-700 animate-ping delay-150" />
      </div>
      <p className="font-auth text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Synchronizing Registry // ➲</p>
    </div>
  </div>
);

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center w-full h-full p-20 bg-[#F8FAFC]">
    <div className="text-center space-y-8 max-w-2xl border-4 border-slate-900 bg-white p-16 shadow-[16px_16px_0_rgba(15,23,42,0.1)]">
      <h1 className="font-auth text-6xl font-black text-slate-900 tracking-tighter uppercase">{title}</h1>
      <p className="font-auth text-slate-500 text-xs uppercase tracking-widest leading-loose">
        Node is currently in an uninitialized state within the national grid. 
        Authorization protocols are pending.
      </p>
    </div>
  </div>
);

import { IntelProvider } from './context/IntelContext';

function App() {
  useRealtimeTelemetry(); // Connect WebSocket for live data push
  return (
    <IntelProvider>
      <BrowserRouter basename={(import.meta as any).env.PROD ? "/Flood-Dash" : "/"}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="alerts" element={<AlertCenter />} />
            <Route path="map"    element={<Suspense fallback={<PageSkeleton />}><LiveMap /></Suspense>} />
            <Route path="rivers" element={<Suspense fallback={<PageSkeleton />}><RiverForecast /></Suspense>} />
            <Route path="rain"   element={<Suspense fallback={<PageSkeleton />}><RainfallRadar /></Suspense>} />
            <Route path="ml"     element={<Suspense fallback={<PageSkeleton />}><MLAnalysis /></Suspense>} />
            <Route path="hist"   element={<Suspense fallback={<PageSkeleton />}><HistoricalEvents /></Suspense>} />
            <Route path="urban"  element={<Suspense fallback={<PageSkeleton />}><UrbanFloodRisk /></Suspense>} />
            <Route path="about"  element={<Suspense fallback={<PageSkeleton />}><AboutPage /></Suspense>} />
            <Route path="status" element={<Suspense fallback={<PageSkeleton />}><DataSources /></Suspense>} />
            <Route path="dist"   element={<Suspense fallback={<PageSkeleton />}><DistrictDrilldown /></Suspense>} />
            <Route path="*"      element={<PlaceholderPage title="404 // NODE UNREACHABLE" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </IntelProvider>
  );
}

export default App;
