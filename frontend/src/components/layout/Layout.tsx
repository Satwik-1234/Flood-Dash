import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 pl-24">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
