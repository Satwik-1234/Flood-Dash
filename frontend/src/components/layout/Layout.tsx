import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DATA_PROVIDERS } from '../../constants/attribution';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-bg-void border-t border-border-default/50 py-3 px-6 mt-auto">
      <div className="flex flex-wrap gap-4 items-center justify-center lg:justify-start overflow-hidden">
        {DATA_PROVIDERS.map((provider: { abbr: string, url: string, name: string, role: string, license: string }) => (
          <a
            key={provider.abbr}
            href={provider.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center space-x-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            title={`${provider.name} - ${provider.role} (${provider.license})`}
          >
            <span className="text-xs font-ui font-medium text-text-secondary group-hover:text-text-primary px-2 py-1 bg-bg-surface rounded border border-border-subtle group-hover:border-border-default whitespace-nowrap">
              {provider.abbr}
            </span>
          </a>
        ))}
      </div>
    </footer>
  );
};

export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-bg-cream text-text-body overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 h-full overflow-hidden relative">
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};
