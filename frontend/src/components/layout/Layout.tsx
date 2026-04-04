import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => (
  <div className="flex h-screen w-full bg-bg-base text-t1 overflow-hidden font-sans">
    <Sidebar />
    <main className="flex-1 h-full overflow-hidden relative">
      <Outlet />
    </main>
  </div>
);
