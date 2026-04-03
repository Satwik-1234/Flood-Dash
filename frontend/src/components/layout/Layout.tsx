import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AttributionFooter } from './AttributionFooter';

export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] text-slate-800 overflow-hidden font-auth selection:bg-sky-500/30">
      <Sidebar />
      <div className="flex flex-col flex-1 h-full overflow-hidden relative">
        <main className="flex-1 flex flex-col min-h-0 relative overflow-hidden backdrop-blur-sm">
          <Outlet />
        </main>
        <AttributionFooter />
      </div>
    </div>
  );
};
