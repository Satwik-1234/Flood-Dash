import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';

// Eager load — always needed immediately
import { Overview }     from './pages/Overview';
import { AlertCenter }  from './pages/AlertCenter';

// Lazy load — only load when user navigates there
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
  <div className="flex items-center justify-center w-full h-full bg-bg-cream">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-suk-forest border-t-transparent animate-spin" />
      <p className="font-ui text-sm text-text-muted">Loading…</p>
    </div>
  </div>
);

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center w-full h-full p-8">
    <div className="text-center space-y-4 max-w-lg">
      <h1 className="font-display text-4xl text-text-dark tracking-wide">{title}</h1>
      <p className="font-ui text-text-muted text-base border border-border-default bg-bg-white p-4 rounded-xl shadow-panel">
        Under construction.
      </p>
    </div>
  </div>
);

function App() {
  return (
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
          <Route path="*"      element={<PlaceholderPage title="404 — Not Found" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
