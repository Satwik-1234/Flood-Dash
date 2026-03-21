import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AttributionFooter } from './AttributionFooter';



export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-bg-cream text-text-body overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 h-full overflow-hidden relative">
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
        <AttributionFooter />
      </div>
    </div>
  );
};
