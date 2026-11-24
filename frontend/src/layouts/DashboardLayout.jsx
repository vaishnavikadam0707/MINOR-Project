import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import TopNav from '../components/navigation/TopNav';
import SmartAssistant from '../components/assistant/SmartAssistant';
import { ShieldAlert } from 'lucide-react';

export default function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col relative selection:bg-accent-primary selection:text-bg-primary">
      {/* Background grid */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none opacity-40 z-0" />
      <div className="fixed top-0 right-0 w-[500px] h-[300px] bg-accent-primary/5 blur-[120px] pointer-events-none z-0" />

      {/* Sidebar (Desktop fixed & Mobile drawer) */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'md:ml-[76px]' : 'md:ml-[250px]'
        }`}
      >
        {/* Top Navigation */}
        <TopNav
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          setMobileOpen={setMobileOpen}
        />

        {/* Prototype Notice Banner */}
        <div className="bg-bg-elevated/80 border-b border-industrial-border px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-text-muted">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
            <span className="text-text-secondary font-medium">
              LOCAL PROTOTYPE ENVIRONMENT
            </span>
            <span className="hidden sm:inline text-text-muted">
              • All sensor telemetries, predictive health scores, and costs are simulated.
            </span>
          </div>

          <span className="hidden md:inline font-mono text-accent-primary/80">
            STORAGE: LOCALSTORAGE PERSISTED
          </span>
        </div>

        {/* Dashboard Page View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
