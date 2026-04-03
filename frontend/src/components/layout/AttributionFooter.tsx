import React from 'react';
import { DATA_PROVIDERS } from '../../constants/attribution';

export const AttributionFooter: React.FC = () => (
  <footer className="shrink-0 border-t-2 border-slate-100 bg-[#F8FAFC] px-10 py-4 overflow-x-auto font-auth">
    <div className="flex items-center gap-6 min-w-max">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] shrink-0">
        Registry Sources // ➲
      </span>
      <div className="flex gap-2">
        {DATA_PROVIDERS.map(p => (
          <a
            key={p.abbr}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${p.name} — ${p.role}`}
            className="text-[9px] font-black text-slate-500 hover:text-sky-500 bg-white border-2 border-slate-100 px-3 py-1 transition-all whitespace-nowrap shrink-0 hover:border-sky-500"
          >
            {p.abbr}
          </a>
        ))}
      </div>
      <div className="h-4 w-px bg-slate-200" />
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">
        Authored by S. L. Udupi // GDI Command © 2026
      </span>
    </div>
  </footer>
);
