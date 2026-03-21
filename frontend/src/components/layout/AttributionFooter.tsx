import React from 'react';
import { DATA_PROVIDERS } from '../../constants/attribution';

export const AttributionFooter: React.FC = () => (
  <footer className="shrink-0 border-t border-border-light bg-bg-surface
                     px-8 py-3 overflow-x-auto">
    <div className="flex items-center space-x-1 min-w-max">
      <span className="font-ui text-[10px] font-bold text-text-muted uppercase
                       tracking-widest mr-3 shrink-0">
        Data:
      </span>
      {DATA_PROVIDERS.map(p => (
        <a
          key={p.abbr}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`${p.name} — ${p.role} (${p.license})`}
          className="font-data text-[10px] font-bold text-text-muted hover:text-suk-forest
                     bg-bg-white border border-border-light rounded px-2 py-0.5
                     transition-colors whitespace-nowrap shrink-0"
        >
          {p.abbr}
        </a>
      ))}
      <span className="font-ui text-[10px] text-text-muted ml-4 shrink-0">
        · Built by Satwik Laxmikamalakar Udupi · MIT License
      </span>
    </div>
  </footer>
);
