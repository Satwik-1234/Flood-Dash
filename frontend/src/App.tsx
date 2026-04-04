import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { IntelProvider } from './context/IntelContext';

// Eager-load critical pages
import { Overview } from './pages/Overview';

// Lazy-load the rest
const LiveMap          = lazy(() => import('./pages/LiveMap').then(m => ({ default: m.LiveMap })));
const FloodWatch       = lazy(() => import('./pages/FloodWatch').then(m => ({ default: m.FloodWatch })));
const ReservoirMonitor = lazy(() => import('./pages/ReservoirMonitor').then(m => ({ default: m.ReservoirMonitor })));
const IMDWarnings      = lazy(() => import('./pages/IMDWarnings').then(m => ({ default: m.IMDWarnings })));
const SystemMonitor    = lazy(() => import('./pages/SystemMonitor').then(m => ({ default: m.SystemMonitor })));

const PageLoading = () => (
  <div className="flex items-center justify-center w-full h-full bg-bg-base">
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-accent-blue animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <p className="text-[10px] font-mono text-t3 tracking-widest">LOADING MODULE…</p>
    </div>
  </div>
);

const NotFound = () => (
  <div className="flex items-center justify-center w-full h-full bg-bg-base">
    <div className="text-center">
      <p className="font-display text-6xl font-bold text-t3">404</p>
      <p className="text-sm font-mono text-t3 mt-2">MODULE NOT FOUND</p>
    </div>
  </div>
);

function AppRoutes() {
  return (
    <BrowserRouter basename={(import.meta as any).env.PROD ? '/Flood-Dash' : '/'}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="map"        element={<Suspense fallback={<PageLoading />}><LiveMap /></Suspense>} />
          <Route path="flood"      element={<Suspense fallback={<PageLoading />}><FloodWatch /></Suspense>} />
          <Route path="reservoirs" element={<Suspense fallback={<PageLoading />}><ReservoirMonitor /></Suspense>} />
          <Route path="imd"        element={<Suspense fallback={<PageLoading />}><IMDWarnings /></Suspense>} />
          <Route path="monitor"    element={<Suspense fallback={<PageLoading />}><SystemMonitor /></Suspense>} />
          <Route path="*"          element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <IntelProvider>
      <AppRoutes />
    </IntelProvider>
  );
}

export default App;
