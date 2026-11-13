import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from '../components/navigation/PublicNavbar';
import PublicFooter from '../components/navigation/PublicFooter';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col relative selection:bg-accent-primary selection:text-bg-primary">
      {/* Background patterns */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none opacity-60 z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] radial-glow pointer-events-none z-0" />
      
      {/* Top Navbar */}
      <PublicNavbar />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 pt-20">
        <Outlet />
      </main>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
