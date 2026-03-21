import React from 'react';
import { ShieldCheck, GithubLogo, Code, Heart, Lightning } from 'phosphor-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="w-full h-full p-8 overflow-y-auto bg-bg-cream">
      
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Hero */}
        <div className="text-center bg-bg-white border border-border-default rounded-2xl p-10 shadow-sm relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-suk-forest opacity-5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-suk-river opacity-5 rounded-full blur-2xl pointer-events-none"></div>
          
          <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-suk-forest" weight="duotone" />
          <h1 className="font-display text-text-dark text-4xl font-bold mb-2">Pravhatattva v3.0</h1>
          <p className="font-ui text-text-muted text-lg">The Essence of Flow. Next-gen public safety infrastructure for India.</p>
        </div>

        {/* Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-bg-white border border-border-default rounded-xl p-6 shadow-sm">
            <h3 className="font-display font-bold text-lg text-text-dark flex items-center mb-4">
              <Lightning className="w-5 h-5 mr-2 text-suk-amber" /> Zero-Server Architecture
            </h3>
            <p className="font-ui text-sm text-text-body leading-relaxed">
              This system executes 100% of its telemetry scraping through automated GitHub Actions, storing Live Hydrology status inside raw JSON blobs. 
              By completely removing standard python deployment servers, Pravhatattva achieves perfect 100% uptime and $0 hosting costs natively scaling on GitHub Pages.
            </p>
          </div>

          <div className="bg-bg-white border border-border-default rounded-xl p-6 shadow-sm">
            <h3 className="font-display font-bold text-lg text-text-dark flex items-center mb-4">
              <Code className="w-5 h-5 mr-2 text-suk-river" /> Production-Grade Stack
            </h3>
            <ul className="font-ui text-sm text-text-body space-y-2">
              <li className="flex justify-between items-center border-b border-border-light pb-1"><span>Frontend Runtime</span> <strong>React 18 + Vite</strong></li>
              <li className="flex justify-between items-center border-b border-border-light pb-1"><span>Type Safety</span> <strong>TypeScript Strict Mode</strong></li>
              <li className="flex justify-between items-center border-b border-border-light pb-1"><span>Data Aggregation</span> <strong>TanStack Query + Zod</strong></li>
              <li className="flex justify-between items-center border-b border-border-light pb-1"><span>Mapping Engine</span> <strong>MapLibre GL JS</strong></li>
              <li className="flex justify-between items-center pb-1"><span>ML Execution</span> <strong>ONNX WASM (Browser Sandbox)</strong></li>
            </ul>
          </div>
        </div>

        {/* Attribution & Open Source */}
        <div className="bg-bg-surface-2 border border-border-default rounded-xl p-6 text-center">
          <h3 className="font-display font-bold text-lg text-text-dark mb-2">Open Source Mission</h3>
          <p className="font-ui text-sm text-text-body max-w-2xl mx-auto mb-6">
            Built for District Collectors, NDRF, and State Disaster Management Authorities. 
            Codebase open-sourced under absolute strict execution protocols.
          </p>
          
          <a 
            href="https://github.com/Satwik-1234/Flood-Dash" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-text-dark text-bg-white px-6 py-3 rounded-lg font-ui font-bold hover:bg-black transition-colors"
          >
            <GithubLogo className="w-5 h-5 mr-2" weight="fill" />
            View Repository
          </a>
          
          <div className="mt-8 pt-6 border-t border-border-strong font-ui text-xs text-text-muted flex items-center justify-center">
            Designed with <Heart className="w-3 h-3 mx-1 text-suk-fire" weight="fill" /> by Satwik Laxmikamalakar Udupi
          </div>
        </div>

      </div>

    </div>
  );
};
