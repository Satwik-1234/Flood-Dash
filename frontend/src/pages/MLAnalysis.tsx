import React, { useState } from 'react';
import { Brain, CloudRain, Waves, Drop, TrendUp, WarningOctagon, CaretRight } from 'phosphor-react';

interface PredictionConfig {
  rainfall_24h_mm: number;
  river_level_m: number;
  danger_level_m: number;
  soil_moisture_index: number;
  elevation_m: number;
}

interface PredictionResult {
  probability_pct: number;
  risk_level: number;
  factors: {
    river_saturation: number;
    rain_intensity: number;
    topography_susceptibility: number;
  }
}

export const MLAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<PredictionConfig>({
    rainfall_24h_mm: 120.5,
    river_level_m: 38.5,
    danger_level_m: 39.0,
    soil_moisture_index: 0.85,
    elevation_m: 540.0
  });

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Prediction failed');
      
      setResult(data.prediction);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-8 overflow-y-auto space-y-8 bg-bg-cream">
      
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-display text-text-dark text-3xl font-bold flex items-center">
            <Brain className="w-8 h-8 mr-3 text-suk-forest" weight="duotone" />
            Machine Learning Diagnostics
          </h2>
          <p className="font-ui text-text-muted mt-1">Run deterministic predictive hydrology simulations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Input Form */}
        <div className="lg:col-span-1 bg-bg-white border border-border-default rounded-xl shadow-sm p-6">
          <h3 className="font-display font-bold text-lg text-text-dark mb-4 border-b border-border-light pb-2">Hydrological Parameters</h3>
          
          <form onSubmit={handlePredict} className="space-y-4">
            <div>
              <label className="flex items-center text-sm font-ui font-bold text-text-body mb-1">
                <CloudRain className="w-4 h-4 mr-2 text-suk-river" /> 24h Rainfall (mm)
              </label>
              <input type="number" step="0.1" required value={form.rainfall_24h_mm} onChange={e => setForm({...form, rainfall_24h_mm: parseFloat(e.target.value)})}
                className="w-full bg-bg-surface border border-border-default rounded-md px-3 py-2 text-text-dark font-data text-sm focus:outline-none focus:border-suk-forest transition-colors" />
            </div>

            <div>
              <label className="flex items-center text-sm font-ui font-bold text-text-body mb-1">
                <Waves className="w-4 h-4 mr-2 text-suk-river" /> River Level (m)
              </label>
              <input type="number" step="0.1" required value={form.river_level_m} onChange={e => setForm({...form, river_level_m: parseFloat(e.target.value)})}
                className="w-full bg-bg-surface border border-border-default rounded-md px-3 py-2 text-text-dark font-data text-sm focus:outline-none focus:border-suk-forest transition-colors" />
            </div>

            <div>
              <label className="flex items-center text-sm font-ui font-bold text-text-body mb-1">
                <WarningOctagon className="w-4 h-4 mr-2 text-suk-fire" /> Danger Level (m)
              </label>
              <input type="number" step="0.1" required value={form.danger_level_m} onChange={e => setForm({...form, danger_level_m: parseFloat(e.target.value)})}
                className="w-full bg-bg-surface border border-border-default rounded-md px-3 py-2 text-text-dark font-data text-sm focus:outline-none focus:border-suk-forest transition-colors" />
            </div>

            <div>
              <label className="flex items-center text-sm font-ui font-bold text-text-body mb-1">
                <Drop className="w-4 h-4 mr-2 text-suk-amber" /> Soil Moisture (0.0 - 1.0)
              </label>
              <input type="number" step="0.01" min="0" max="1" required value={form.soil_moisture_index} onChange={e => setForm({...form, soil_moisture_index: parseFloat(e.target.value)})}
                className="w-full bg-bg-surface border border-border-default rounded-md px-3 py-2 text-text-dark font-data text-sm focus:outline-none focus:border-suk-forest transition-colors" />
            </div>

            <div>
              <label className="flex items-center text-sm font-ui font-bold text-text-body mb-1">
                <TrendUp className="w-4 h-4 mr-2 text-text-muted" /> Catchment Elevation (m)
              </label>
              <input type="number" step="1" required value={form.elevation_m} onChange={e => setForm({...form, elevation_m: parseFloat(e.target.value)})}
                className="w-full bg-bg-surface border border-border-default rounded-md px-3 py-2 text-text-dark font-data text-sm focus:outline-none focus:border-suk-forest transition-colors" />
            </div>

            <button disabled={loading} type="submit" className="w-full mt-6 bg-suk-forest hover:bg-suk-forest-mid text-bg-white font-ui font-bold py-3 rounded-lg flex items-center justify-center transition-colors shadow-sm disabled:opacity-50">
              {loading ? 'Simulating...' : 'Run Prediction Model'} <CaretRight className="w-4 h-4 ml-2" />
            </button>
            {error && <p className="text-xs text-suk-fire font-ui mt-2">{error}</p>}
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {result ? (
            <div className="space-y-6">
              
              <div className={`bg-risk-${result.risk_level} border border-risk-${result.risk_level}-border rounded-xl p-8 relative overflow-hidden shadow-sm`}>
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <h3 className={`font-ui font-bold tracking-wide uppercase text-risk-${result.risk_level}-text m-0 p-0 text-sm`}>Inference Result</h3>
                    <div className="font-display text-5xl font-bold mt-2 text-text-dark">Level {result.risk_level}</div>
                    <p className="font-ui text-text-body mt-2">Algorithm output confidence: {result.probability_pct}% probability of inundation.</p>
                  </div>
                  <div className={`w-24 h-24 rounded-full border-4 border-risk-${result.risk_level}-border flex items-center justify-center bg-bg-white shadow-inner`}>
                    <span className={`font-display text-2xl font-bold text-risk-${result.risk_level}-text`}>{result.probability_pct}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-bg-white border border-border-default rounded-xl p-5 shadow-sm">
                  <h4 className="font-ui text-xs font-bold text-text-muted uppercase">River Saturation</h4>
                  <div className="font-data text-2xl text-text-dark mt-1">{result.factors.river_saturation}%</div>
                </div>
                <div className="bg-bg-white border border-border-default rounded-xl p-5 shadow-sm">
                  <h4 className="font-ui text-xs font-bold text-text-muted uppercase">Rain Intensity Score</h4>
                  <div className="font-data text-2xl text-text-dark mt-1">{result.factors.rain_intensity}</div>
                </div>
                <div className="bg-bg-white border border-border-default rounded-xl p-5 shadow-sm">
                  <h4 className="font-ui text-xs font-bold text-text-muted uppercase">Topography Danger</h4>
                  <div className="font-data text-2xl text-text-dark mt-1">{result.factors.topography_susceptibility}</div>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-bg-surface-2 border border-border-default border-dashed rounded-xl h-full flex flex-col items-center justify-center p-12 text-center opacity-70">
              <Brain className="w-16 h-16 text-text-muted mb-4 opacity-50" />
              <h3 className="font-display text-xl text-text-body mb-2">Awaiting Parameters</h3>
              <p className="font-ui text-sm text-text-muted max-w-sm">Enter the hydrological metrics in the form to simulate the Flood Risk inference pipeline.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
