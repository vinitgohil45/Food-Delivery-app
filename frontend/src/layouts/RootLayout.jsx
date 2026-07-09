import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import BottomNav from './BottomNav';

const RootLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#050508] transition-colors duration-300 pb-16 md:pb-0">
      {/* Premium Glassmorphic Header */}
      <Navbar />

      {/* Main Content Area with Code Splitting / Lazy boundary support */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer System */}
      <Footer />

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  );
};

export default RootLayout;
