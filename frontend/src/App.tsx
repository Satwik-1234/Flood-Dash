import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Eager-load critical pages
import Overview from './pages/Overview';

// Lazy-load the rest (Default exports)
const LiveMap          = lazy(() => import('./pages/LiveMap'));
const FloodWatch       = lazy(() => import('./pages/FloodWatch'));
const ReservoirMonitor = lazy(() => import('./pages/ReservoirMonitor'));
const IMDWarnings      = lazy(() => import('./pages/IMDWarnings'));
const SystemMonitor    = lazy(() => import('./pages/SystemMonitor'));

const PageLoading = () => (
  <div className="flex items-center justify-center w-full h-full bg-[#020617]">
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-accent-blue animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <p className="text-[10px] font-mono text-t3 tracking-widest uppercase">Initializing Module…</p>
    </div>
  </div>
);

const NotFound = () => (
  <div className="flex items-center justify-center w-full h-full bg-[#020617]">
    <div className="text-center">
      <p className="font-display text-6xl font-bold text-t3">404</p>
      <p className="text-sm font-mono text-t3 mt-2 tracking-widest uppercase">Sector Not Found</p>
    </div>
  </div>
);

function AppRoutes() {
  const isProd = (import.meta as any).env.PROD;
  const base = isProd ? '/Flood-Dash' : '/';

  return (
    <BrowserRouter basename={base}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="map"         element={<Suspense fallback={<PageLoading />}><LiveMap /></Suspense>} />
          <Route path="flood-watch" element={<Suspense fallback={<PageLoading />}><FloodWatch /></Suspense>} />
          <Route path="reservoir"   element={<Suspense fallback={<PageLoading />}><ReservoirMonitor /></Suspense>} />
          <Route path="imd"         element={<Suspense fallback={<PageLoading />}><IMDWarnings /></Suspense>} />
          <Route path="system"      element={<Suspense fallback={<PageLoading />}><SystemMonitor /></Suspense>} />
          <Route path="*"           element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AppRoutes />
  );
}

export default App;
