import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Target, Cpu, Users, Award, ArrowRight, Activity } from 'lucide-react';
import Button from '../../components/common/Button';

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-mono text-accent-primary uppercase tracking-wider px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/30 inline-block mb-3">
          INSTITUTIONAL MISSION
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-text-primary tracking-tight mb-4">
          About Smart AssetCare
        </h1>
        <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
          Bridging the critical gap between educational infrastructure management and predictive maintenance intelligence.
        </p>
      </div>

      {/* Story Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="p-8 rounded-3xl bg-bg-card border border-industrial-border relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center text-accent-primary mb-6">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-display text-text-primary mb-3">
            The Campus Infrastructure Problem
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed space-y-3">
            Modern universities and technical colleges maintain thousands of capital assets—from high-density computer laboratories and analytical chemistry centrifuges to split HVAC units and high-speed network switches.
            <br /><br />
            Historically, equipment tracking has relied on paper ledgers, fragmented Excel spreadsheets, and frantic phone calls when an air conditioner breaks during final examinations. Smart AssetCare was engineered to unify physical asset tracking, maintenance workflows, and repair budgets into one real-time command station.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-bg-card border border-industrial-border relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-accent-secondary/10 border border-accent-secondary/30 flex items-center justify-center text-accent-secondary mb-6">
            <Cpu className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-display text-text-primary mb-3">
            Our Architectural Vision
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed space-y-3">
            Smart AssetCare replaces reactive crisis management with predictive maintenance. By attaching QR identifiers to hardware, scheduling recurring servicing cycles, and giving technicians a dedicated Kanban board, colleges reduce downtime by up to 60%.
            <br /><br />
            Our goal is simple: ensure every classroom, laboratory, and department operates at peak reliability, with complete financial transparency over every rupee spent.
          </p>
        </div>
      </div>

      {/* Role Architecture Box */}
      <div className="rounded-3xl border border-industrial-borderHover bg-bg-secondary p-8 sm:p-12 mb-16">
        <h3 className="text-xl font-bold font-display text-text-primary mb-6 text-center">
          Engineered for Multi-Tier Institutional Roles
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-bg-card border border-industrial-border">
            <span className="text-xs font-mono text-accent-primary block mb-1">ROLE 01</span>
            <h4 className="font-bold text-text-primary mb-1">Institutional Admin</h4>
            <p className="text-xs text-text-secondary">Full control over asset master records, demo users, budgets, and audit logs.</p>
          </div>

          <div className="p-5 rounded-2xl bg-bg-card border border-industrial-border">
            <span className="text-xs font-mono text-accent-primary block mb-1">ROLE 02</span>
            <h4 className="font-bold text-text-primary mb-1">Campus Manager</h4>
            <p className="text-xs text-text-secondary">Assigns work orders to technicians, schedules maintenance, and verifies quality.</p>
          </div>

          <div className="p-5 rounded-2xl bg-bg-card border border-industrial-border">
            <span className="text-xs font-mono text-accent-primary block mb-1">ROLE 03</span>
            <h4 className="font-bold text-text-primary mb-1">Field Technician</h4>
            <p className="text-xs text-text-secondary">Executes Kanban tickets, logs parts replaced, records labour costs and notes.</p>
          </div>

          <div className="p-5 rounded-2xl bg-bg-card border border-industrial-border">
            <span className="text-xs font-mono text-accent-primary block mb-1">ROLE 04</span>
            <h4 className="font-bold text-text-primary mb-1">Faculty & Staff</h4>
            <p className="text-xs text-text-secondary">Instantly reports equipment faults, uploads defect photos, tracks status in real-time.</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Button
          variant="primary"
          size="lg"
          iconRight={ArrowRight}
          onClick={() => navigate('/login')}
        >
          Explore Demo Roles Now
        </Button>
      </div>
    </div>
  );
}
