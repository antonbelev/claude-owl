import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Breadcrumb } from './Breadcrumb';

export const AppLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />

      <div className="flex-1 flex flex-col overflow-hidden ml-0 transition-all duration-300">
        <div className="bg-white px-8 py-4 border-b border-neutral-200 flex-shrink-0">
          <Breadcrumb />
        </div>

        <main className="flex-1 overflow-y-auto bg-background-secondary">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
