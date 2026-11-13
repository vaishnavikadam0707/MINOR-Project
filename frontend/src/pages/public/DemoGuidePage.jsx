import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Users, Database, Terminal, ArrowRight, CheckCircle2 } from 'lucide-react';
import Button from '../../components/common/Button';

export default function DemoGuidePage() {
  const navigate = useNavigate();

  const demoAccounts = [
    {
      role: 'ADMIN',
      title: 'Institutional Admin',
      email: 'admin@smartassetcare.demo',
      desc: 'Superuser access. Master asset registry, user management, system settings, demo data reset, full audit trail.'
    },
    {
      role: 'MANAGER',
      title: 'Campus Facility Manager',
      email: 'manager@smartassetcare.demo',
      desc: 'Operational oversight. Assign work orders, schedule preventive maintenance, verify completed repairs, review department costs.'
    },
    {
      role: 'TECHNICIAN',
      title: 'Maintenance Field Technician',
      email: 'technician@smartassetcare.demo',
      desc: 'Hands-on task execution. Drag-and-drop Kanban tickets, log spare parts and labour expenses, submit service records.'
    },
    {
      role: 'STAFF',
      title: 'College Faculty / Lab Staff',
      email: 'staff@smartassetcare.demo',
      desc: 'End-user reporting. Submit defect tickets with issue photos, track real-time resolution progress, view asset specs.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-mono text-accent-primary uppercase tracking-wider px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/30 inline-block mb-3">
          DEMONSTRATION GUIDE
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-text-primary tracking-tight mb-4">
          Prototype Architecture & Demo Accounts
        </h1>
        <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
          Smart AssetCare is a high-fidelity frontend prototype. All data is persisted locally in browser localStorage.
        </p>
      </div>

      {/* Prototype Notice Alert */}
      <div className="p-6 rounded-3xl bg-status-warning/10 border border-status-warning/30 max-w-3xl mx-auto mb-12 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-status-warning shrink-0 mt-0.5" />
        <div className="text-xs text-text-secondary leading-relaxed">
          <strong className="text-status-warning font-semibold block text-sm mb-1">
            Simulation Architecture Notice
          </strong>
          This application runs entirely client-side using React 18, Tailwind CSS, Framer Motion, and browser localStorage. There is no external Spring Boot, Python, or MySQL server. Machine learning health scores and telemetry are simulated deterministically to mirror production behavior.
        </div>
      </div>

      {/* Demo Credentials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
        {demoAccounts.map((acc) => (
          <div
            key={acc.role}
            className="p-6 rounded-2xl bg-bg-card border border-industrial-border hover:border-accent-primary/40 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full bg-accent-primary/10 text-accent-primary font-mono text-xs border border-accent-primary/30 font-semibold">
                  {acc.role}
                </span>
                <span className="text-xs font-mono text-text-muted">Password: Demo123!</span>
              </div>
              <h3 className="text-base font-bold font-display text-text-primary mb-1">
                {acc.title}
              </h3>
              <p className="text-xs font-mono text-text-muted mb-3">
                {acc.email}
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                {acc.desc}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-industrial-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => navigate('/login')}
              >
                Sign In as {acc.role}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <Button
          variant="primary"
          size="lg"
          iconRight={ArrowRight}
          onClick={() => navigate('/login')}
        >
          Proceed to Login Terminal
        </Button>
      </div>
    </div>
  );
}
