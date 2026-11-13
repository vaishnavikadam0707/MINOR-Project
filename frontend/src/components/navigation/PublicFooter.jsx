import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Shield, Terminal, Cpu, ArrowUpRight } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-bg-secondary border-t border-industrial-border relative overflow-hidden">
      {/* Background glow element */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-accent-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-bg-card border border-accent-primary/30 flex items-center justify-center text-accent-primary">
                <Activity className="w-5 h-5" />
              </div>
              <span className="font-display font-extrabold text-lg text-text-primary tracking-tight">
                SMART ASSETCARE
              </span>
            </Link>

            <p className="text-sm text-text-secondary max-w-md leading-relaxed">
              Industrial-grade asset tracking, preventive maintenance automation, work order Kanban boards, and repair expense analytics engineered for educational institutions and campus facilities.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/25 text-[11px] font-mono text-accent-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
                SYSTEM STATUS: SIMULATION ACTIVE
              </span>
              <span className="text-[11px] font-mono text-text-muted">
                v2.4.0-PROTOTYPE
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary font-mono">
              Platform Modules
            </h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>
                <Link to="/features" className="hover:text-accent-primary transition-colors flex items-center gap-1">
                  Asset Management
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-accent-primary transition-colors flex items-center gap-1">
                  QR Code Tracking
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-accent-primary transition-colors flex items-center gap-1">
                  Preventive Scheduling
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-accent-primary transition-colors flex items-center gap-1">
                  Work Order Kanban
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-accent-primary transition-colors flex items-center gap-1">
                  Cost & Expense Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutional / Role Switch */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary font-mono">
              Demo Access Roles
            </h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>
                <Link to="/login" className="hover:text-accent-primary transition-colors flex items-center gap-1">
                  Institutional Admin <ArrowUpRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-accent-primary transition-colors flex items-center gap-1">
                  Campus Manager <ArrowUpRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-accent-primary transition-colors flex items-center gap-1">
                  Field Technician <ArrowUpRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-accent-primary transition-colors flex items-center gap-1">
                  Faculty / Staff <ArrowUpRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>
              </li>
              <li>
                <Link to="/demo" className="hover:text-accent-primary transition-colors flex items-center gap-1">
                  Architecture Overview
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer and Copyright */}
        <div className="mt-12 pt-8 border-t border-industrial-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} Smart AssetCare. Educational Institution Asset & Maintenance Command Center.</p>
          <div className="p-2 rounded-lg bg-bg-card border border-industrial-border text-[11px] font-mono text-text-secondary max-w-lg text-center sm:text-right">
            ⚠️ Demonstration Prototype: All IoT sensors, telemetry, and AI predictions are browser-simulated.
          </div>
        </div>
      </div>
    </footer>
  );
}
