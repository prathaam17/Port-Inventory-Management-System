import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 transition-colors duration-200">
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} />
      <main 
        className={`pt-36 pb-8 px-4 sm:px-6 transition-all duration-300 min-h-screen ${
          isSidebarOpen ? 'md:pl-[310px] pl-4' : 'md:pl-[64px] pl-4'
        }`}
      >
        <div className="w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
