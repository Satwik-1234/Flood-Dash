import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LiveMap } from './pages/LiveMap';
import { Overview } from './pages/Overview';
import { MLAnalysis } from './pages/MLAnalysis';
import { RiverForecast } from './pages/RiverForecast';
import { AlertCenter } from './pages/AlertCenter';
import { HistoricalEvents } from './pages/HistoricalEvents';
import { UrbanFloodRisk } from './pages/UrbanFloodRisk';
import { DistrictDrilldown } from './pages/DistrictDrilldown';

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center w-full h-full p-8">
    <div className="text-center space-y-4 max-w-lg">
      <h1 className="font-display text-4xl text-text-dark tracking-wide">{title}</h1>
      <p className="font-ui text-text-muted text-base border border-border-default bg-bg-white p-4 rounded-xl shadow-panel">
        This screen is a placeholder. The Neo-Indic configuration, data fetching hooks, and UI components are under construction for Phase 1.
      </p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="map" element={<LiveMap />} />
          <Route path="rivers" element={<RiverForecast />} />
          <Route path="rain" element={<PlaceholderPage title="Rainfall Radar" />} />
          <Route path="alerts" element={<AlertCenter />} />
          <Route path="ml" element={<MLAnalysis />} />
          <Route path="hist" element={<HistoricalEvents />} />
          <Route path="urban" element={<UrbanFloodRisk />} />
          <Route path="about" element={<PlaceholderPage title="About & Credits" />} />
          <Route path="status" element={<PlaceholderPage title="Data Status" />} />
          <Route path="dist" element={<DistrictDrilldown />} />
          <Route path="*" element={<PlaceholderPage title="404 - Not Found" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
