import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, QrCode, Calendar, Wrench, CheckCircle, BarChart3, ShieldCheck } from 'lucide-react';
import Button from '../../components/common/Button';

export default function HowItWorksPage() {
  const navigate = useNavigate();

  const stages = [
    {
      num: '01',
      title: 'Catalog Campus Assets & Deploy QR Tags',
      sub: 'Digital Onboarding & Tagging',
      desc: 'Administrators register physical devices (e.g. Computer Lab ACs, Dell Workstations, Physics Lab Oscilloscopes). The system generates printable QR labels with unique URLs. Technicians affix the labels onto the hardware.',
      benefit: 'Eliminates lost inventory and confusion about model numbers.'
    },
    {
      num: '02',
      title: 'Automated Preventive Schedules',
      sub: 'Early Warning & Servicing Calibration',
      desc: 'Set recurring preventive maintenance rules. The calendar alerts campus managers when equipment is UPCOMING or DUE. Overdue items trigger high-visibility alerts on the manager dashboard.',
      benefit: 'Extends equipment lifetime by up to 40% and halts unexpected breakdowns.'
    },
    {
      num: '03',
      title: 'Role-Based Issue Reporting & Work Orders',
      sub: 'Kanban Dispatch & Strict Transitions',
      desc: 'When an asset malfunctions, faculty or lab assistants submit an issue report with attached demo photos. Managers assign qualified technicians. Technicians drag cards across the Kanban board, log service steps, and replace parts.',
      benefit: 'Zero lost requests; clear accountability for every technician.'
    },
    {
      num: '04',
      title: 'Financial Auditing & Predictive Analytics',
      sub: 'Rupee Cost Logging & Telemetry',
      desc: 'Technicians log labour, parts, and third-party invoice costs in Indian Rupees (₹). Campus management verifies the work, closes the ticket, and reviews spending patterns across departments.',
      benefit: 'Complete budget transparency and data-driven replacement decisions.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-mono text-accent-primary uppercase tracking-wider px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/30 inline-block mb-3">
          STANDARDIZED WORKFLOW
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-text-primary tracking-tight mb-4">
          How Smart AssetCare Works
        </h1>
        <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
          From hardware cataloging to preventive calibration, explore the complete operational lifecycle.
        </p>
      </div>

      <div className="space-y-8 max-w-4xl mx-auto mb-16">
        {stages.map((stage, i) => (
          <div
            key={stage.num}
            className="p-6 sm:p-8 rounded-3xl bg-bg-card border border-industrial-border relative overflow-hidden flex flex-col md:flex-row gap-6 items-start"
          >
            <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-accent-primary/40 text-accent-primary font-mono text-2xl font-bold flex items-center justify-center shrink-0 shadow-glow-sm">
              {stage.num}
            </div>

            <div className="flex-1">
              <span className="text-xs font-mono uppercase text-accent-primary tracking-wider block mb-1">
                {stage.sub}
              </span>
              <h3 className="text-xl font-bold font-display text-text-primary mb-2">
                {stage.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                {stage.desc}
              </p>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary font-mono">
                <CheckCircle className="w-3.5 h-3.5 text-accent-primary" />
                <span>Impact: {stage.benefit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Button
          variant="primary"
          size="lg"
          iconRight={ArrowRight}
          onClick={() => navigate('/login')}
        >
          Try It In The Live Demo
        </Button>
      </div>
    </div>
  );
}
