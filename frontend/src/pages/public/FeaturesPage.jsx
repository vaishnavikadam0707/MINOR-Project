import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  QrCode,
  Calendar,
  Wrench,
  DollarSign,
  BarChart3,
  Bell,
  Cpu,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import Button from '../../components/common/Button';

export default function FeaturesPage() {
  const navigate = useNavigate();

  const detailedFeatures = [
    {
      icon: Layers,
      title: 'Physical Asset Inventory',
      desc: 'Complete digital registry with serial numbers, manufacturer model numbers, purchase dates, warranty tracking, and current status: OPERATIONAL, UNDER_MAINTENANCE, OUT_OF_SERVICE, or RETIRED.',
      points: ['Grid & Table view toggles', 'Multi-attribute search & filters', 'Asset health scoring (simulated)', 'Archival protection']
    },
    {
      icon: QrCode,
      title: 'QR Code Generation & Print',
      desc: 'Dynamic QR codes containing direct asset links. Facility staff can print durable labels for affixing onto machines, desks, and server racks.',
      points: ['Instant SVG/PNG generation', 'Print-ready label formats', 'Fast mobile route navigation', 'Asset ID synchronization']
    },
    {
      icon: Calendar,
      title: 'Preventive Maintenance Scheduling',
      desc: 'Plan regular servicing routines—weekly filter cleans, quarterly calibration, and annual safety audits. Automatically categorizes tasks into UPCOMING, DUE, and OVERDUE.',
      points: ['Interactive monthly calendar', 'Recurrence engine (monthly/yearly)', 'Technician pre-assignment', 'Priority escalation']
    },
    {
      icon: Wrench,
      title: 'Interactive Work Order Kanban',
      desc: 'Drag-and-drop workflow across 6 institutional stages: CREATED, ASSIGNED, IN_PROGRESS, COMPLETED, VERIFIED, and CLOSED with permission validations.',
      points: ['Strict status transition rules', 'Role-based action restrictions', 'Resolution documentation', 'Attachment simulations']
    },
    {
      icon: DollarSign,
      title: 'Repair Expense & Invoice Audit',
      desc: 'Itemize labour charges, replacement parts, and vendor bills in Indian Rupees (₹). Keep campus accounting transparent and eliminate unapproved expenditure.',
      points: ['Auto cost calculations', 'Invoice document links', 'Asset-wise spending history', 'Category-wise cost trends']
    },
    {
      icon: BarChart3,
      title: 'Executive Analytics & Reporting',
      desc: 'Comprehensive charts depicting asset distributions, technician workloads, MTBF metrics, and maintenance cost trajectories with CSV export support.',
      points: ['Category breakdown charts', 'Workload balancing graphs', 'Date range filtering', 'One-click CSV exports']
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-mono text-accent-primary uppercase tracking-wider px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/30 inline-block mb-3">
          FUNCTIONAL MATRIX
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-text-primary tracking-tight mb-4">
          Engineered Features
        </h1>
        <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
          Every tool required to maintain institutional hardware readiness without administrative headaches.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {detailedFeatures.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.title}
              className="p-6 rounded-3xl bg-bg-card border border-industrial-border hover:border-accent-primary/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 border border-accent-primary/25 flex items-center justify-center text-accent-primary mb-5">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold font-display text-text-primary mb-2">
                  {feat.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-6">
                  {feat.desc}
                </p>
              </div>

              <div className="border-t border-industrial-border pt-4">
                <ul className="space-y-1.5">
                  {feat.points.map((pt, i) => (
                    <li key={i} className="text-[11px] font-mono text-text-muted flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <Button
          variant="primary"
          size="lg"
          iconRight={ArrowRight}
          onClick={() => navigate('/login')}
        >
          Launch Interactive Demo
        </Button>
      </div>
    </div>
  );
}
