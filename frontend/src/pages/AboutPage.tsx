import React from 'react';
import { ShieldCheck, GithubLogo, Code, Heart, Lightning, Broadcast, Globe, TreeStructure } from 'phosphor-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="w-full h-full p-12 overflow-y-auto bg-[#F8FAFC] font-auth">
      
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header Hero: Command Intelligence */}
        <div className="relative bg-white border-4 border-slate-900 p-16 shadow-[16px_16px_0_rgba(15,23,42,0.1)] overflow-hidden">
          <div className="absolute top-0 right-0 p-8">
            <Broadcast size={120} className="text-sky-500 opacity-5 -rotate-12" weight="fill" />
          </div>
          
          <ShieldCheck className="w-20 h-20 mb-6 text-sky-500" weight="fill" />
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-4">
            PRAVHA<span className="text-sky-500">TATTVA</span> <span className="text-amber-500">v4.0</span>
          </h1>
          <p className="text-slate-500 text-lg uppercase tracking-[0.3em] font-black">
            National Hydrological Command & Intelligence Matrix
          </p>
        </div>

        {/* Core Architecture Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border-4 border-slate-900 p-8 shadow-[8px_8px_0_rgba(15,23,42,0.1)]">
            <Lightning className="w-8 h-8 mb-4 text-amber-500" weight="fill" />
            <h3 className="font-black text-slate-900 uppercase tracking-widest mb-4">Zero-Server Core</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed uppercase font-bold tracking-wider">
              100% serverless telemetry ingestion via GitHub Actions. Scale-invariant architecture with zero operational overhead and infinite horizontal scalability on the Global Content Delivery Network.
            </p>
          </div>

          <div className="bg-white border-4 border-slate-900 p-8 shadow-[8px_8px_0_rgba(15,23,42,0.1)]">
            <Globe className="w-8 h-8 mb-4 text-sky-500" weight="fill" />
            <h3 className="font-black text-slate-900 uppercase tracking-widest mb-4">Authoritative GIS</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed uppercase font-bold tracking-wider">
              Synchronized with 1:50,000 scale official India-WRIS (NWIC) ArcGIS REST services. National boundary verification via 100% government-authorized hydrological mapping protocols.
            </p>
          </div>

          <div className="bg-white border-4 border-slate-900 p-8 shadow-[8px_8px_0_rgba(15,23,42,0.1)]">
            <TreeStructure className="w-8 h-8 mb-4 text-slate-900" weight="fill" />
            <h3 className="font-black text-slate-900 uppercase tracking-widest mb-4">Agency Registry</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed uppercase font-bold tracking-wider">
              Unified telemetry hub integrating Central Water Commission (CWC) hydrological sensors and India Meteorological Department (IMD) synoptic warnings into a single intelligence node.
            </p>
          </div>
        </div>

        {/* Technical Specification Table */}
        <div className="bg-white border-4 border-slate-900 overflow-hidden shadow-[12px_12px_0_rgba(15,23,42,0.1)]">
          <div className="bg-slate-900 p-4 text-white text-[10px] font-black uppercase tracking-[0.5em]">System.Configuration.Specs // ➲</div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              {[
                { label: 'Map Engine', val: 'MapLibre GL JS (WASM Accelerated)' },
                { label: 'Data Registry', val: 'TanStack Query // Adaptive Polling' },
                { label: 'Style Engine', val: 'Authoritarian CSS Framework' },
              ].map(s => (
                <div key={s.label} className="flex justify-between border-b-2 border-slate-50 pb-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
                  <span className="text-[9px] font-black text-slate-900 uppercase">{s.val}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {[
                { label: 'Gis Network', val: 'ArcGIS REST / India-WRIS' },
                { label: 'Telemetry', val: 'NWIC / CWC Service Discovery' },
                { label: 'Warning Svc', val: 'IMD Mausam Integration' },
              ].map(s => (
                <div key={s.label} className="flex justify-between border-b-2 border-slate-50 pb-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
                  <span className="text-[9px] font-black text-sky-600 uppercase">{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Attribution & Legal */}
        <div className="bg-sky-50 border-4 border-sky-500/20 p-12 text-center relative">
          <div className="absolute top-0 right-0 p-4">
            <Broadcast size={24} className="text-sky-500 animate-pulse" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">Command Attribution</h3>
          <p className="text-slate-500 text-[11px] uppercase font-black tracking-widest max-w-2xl mx-auto mb-10 leading-loose">
            Designed for National Security, District Administration, and Strategic Disaster Mitigation. 
            All intelligence derived from official Union government telemetry nodes.
          </p>
          
          <div className="flex flex-col items-center gap-6">
            <a 
              href="https://github.com/Satwik-1234/Flood-Dash" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-10 py-5 bg-slate-900 text-white font-black uppercase text-xs tracking-[0.3em] hover:bg-sky-500 transition-all shadow-[8px_8px_0_rgba(15,23,42,0.2)]"
            >
              <div className="flex items-center gap-3">
                <GithubLogo size={20} weight="fill" /> Access Kernel Source
              </div>
            </a>
            
            <div className="pt-8 border-t border-slate-200 w-full flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Authoritative Build by <span className="text-slate-900">S. L. Udupi</span> // Distributed under MIT Protocol
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;
