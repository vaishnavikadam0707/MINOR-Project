import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Activity,
  QrCode,
  Calendar,
  Layers,
  Wrench,
  BarChart3,
  DollarSign,
  Cpu,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Server,
  Zap,
  ChevronRight,
  TrendingUp,
  HardDrive,
  Users,
  Compass
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/cards/Card';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activePreviewTab, setActivePreviewTab] = useState('telemetry');

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (custom = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: custom * 0.1, ease: [0.22, 1, 0.36, 1] }
    })
  };

  const featureCards = [
    {
      icon: Layers,
      title: 'Asset Lifecycle Management',
      description: 'Centralize inventory for computers, lab instruments, ACs, and electrical infrastructure with full warranty and purchase tracking.',
      badge: 'Core Engine'
    },
    {
      icon: QrCode,
      title: 'Instant QR Tracking',
      description: 'Generate high-resolution printable QR labels for physical hardware. On-site staff can inspect asset records and service logs instantly.',
      badge: 'Zero Friction'
    },
    {
      icon: Calendar,
      title: 'Preventive Scheduling',
      description: 'Automate periodic inspections, filter cleanings, and calibration runs before equipment breaks down. Never miss a servicing interval.',
      badge: 'Predictive'
    },
    {
      icon: Wrench,
      title: 'Interactive Work Orders',
      description: 'Drag-and-drop Kanban workflow for technicians. Track status from Created to Assigned, In-Progress, Completed, and Verified.',
      badge: 'Kanban Board'
    },
    {
      icon: DollarSign,
      title: 'Repair Expense Analytics',
      description: 'Audit labor fees, replacement parts, and vendor invoices per asset. Gain total transparency into institutional maintenance expenditures.',
      badge: 'Financial Audit'
    },
    {
      icon: BarChart3,
      title: 'Operational Telemetry',
      description: 'Real-time uptime metrics, category distributions, failure rate hotspots, and technician workload telemetry at institutional scale.',
      badge: 'Executive View'
    }
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Register Assets',
      desc: 'Catalog college equipment with serial numbers, departments, warranty dates, and unique QR identities.'
    },
    {
      step: '02',
      title: 'Schedule Maintenance',
      desc: 'Configure automated preventive schedules (monthly, quarterly, annual) with technician assignments.'
    },
    {
      step: '03',
      title: 'Execute Work Orders',
      desc: 'Technicians receive priority tickets, update live status via Kanban, log parts replaced, and attach notes.'
    },
    {
      step: '04',
      title: 'Analyze Performance',
      desc: 'Audit repair costs, mean time between failures (MTBF), and asset health scores to optimize capital budgets.'
    }
  ];

  const benefits = [
    {
      title: 'Centralized Asset Records',
      desc: 'Replace fragmented spreadsheets and paper binders with one tamper-proof repository for all college equipment.'
    },
    {
      title: 'Better Maintenance Planning',
      desc: 'Transition from reactive panic repairs to structured preventive servicing calendars with zero downtime.'
    },
    {
      title: 'Organized Technician Workflow',
      desc: 'Empower campus maintenance crews with dedicated task boards, mobile checklists, and clear job scopes.'
    },
    {
      title: 'Zero Missed Servicing',
      desc: 'Automated warnings and color-coded alerts flag upcoming and overdue service requirements before failures.'
    },
    {
      title: 'Transparent Repair Expenses',
      desc: 'Itemize labour, spare parts, and external invoices in Indian Rupees (₹) to eliminate budget leakage.'
    },
    {
      title: 'Auditable Asset Visibility',
      desc: 'From physics labs to seminar halls, track exact physical locations and historical service lifecycles.'
    }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-24 sm:pt-20 sm:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          {/* Institutional Status Badge */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/30 text-xs font-mono text-accent-primary mb-6 shadow-glow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>CAMPUS ASSET & PREDICTIVE MAINTENANCE PLATFORM</span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
          </motion.div>

          {/* Main Hero Heading */}
          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-text-primary leading-[1.1] mb-6"
          >
            Every Asset. Every Insight.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary via-[#48ff92] to-accent-secondary">
              Under Control.
            </span>
          </motion.h1>

          {/* Supporting Description */}
          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-base sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed mb-10 font-sans"
          >
            Smart AssetCare brings asset tracking, preventive maintenance, work order management and repair analytics together in one intelligent workspace.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              variant="primary"
              size="lg"
              iconRight={ArrowRight}
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto"
            >
              Get Started
            </Button>

            <Button
              variant="secondary"
              size="lg"
              icon={Compass}
              onClick={() => {
                const el = document.getElementById('how-it-works-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else navigate('/how-it-works');
              }}
              className="w-full sm:w-auto"
            >
              Explore Platform
            </Button>
          </motion.div>
        </div>

        {/* 2. FUTURISTIC INDUSTRIAL COMMAND CENTER HERO VISUAL */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mt-16 sm:mt-24 relative max-w-5xl mx-auto"
        >
          {/* Outer glow aura */}
          <div className="absolute inset-0 bg-accent-primary/10 blur-[90px] rounded-full pointer-events-none -z-10" />

          {/* Central Command Container */}
          <div className="relative rounded-3xl border border-industrial-borderHover bg-bg-card/90 backdrop-blur-xl p-4 sm:p-8 shadow-2xl overflow-hidden">
            {/* Command Header bar */}
            <div className="flex items-center justify-between border-b border-industrial-border pb-4 mb-6 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-status-critical/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-status-warning/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-status-success/80 inline-block" />
                </span>
                <span className="text-text-muted hidden sm:inline">TERMINAL :: SAC-CENTRAL-COMMAND-v2.4</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-accent-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent-primary animate-ping" />
                  LIVE TELEMETRY STREAM
                </span>
                <span className="px-2 py-0.5 rounded bg-white/[0.06] text-text-muted">
                  SAMPLE DATA
                </span>
              </div>
            </div>

            {/* Industrial SVG Technical Illustration */}
            <div className="relative w-full h-72 sm:h-96 rounded-2xl bg-bg-primary/95 border border-industrial-border overflow-hidden flex items-center justify-center p-4">
              {/* Technical Grid inside frame */}
              <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

              {/* Decorative Measurement Crosshairs */}
              <div className="absolute top-4 left-4 font-mono text-[10px] text-text-muted flex flex-col gap-0.5">
                <span>COORD: X-1049 // Y-8842</span>
                <span>VOLTAGE: 238.4 VAC [STABLE]</span>
                <span>TEMP: 22.8°C [NOMINAL]</span>
              </div>

              <div className="absolute bottom-4 right-4 font-mono text-[10px] text-accent-primary/70 text-right flex flex-col gap-0.5">
                <span>PREDICTIVE ACCURACY: 99.2%</span>
                <span>PROTOCOL: LOCAL-SIMULATED-STATE</span>
              </div>

              {/* SVG Equipment & Circuit Architecture */}
              <svg className="w-full h-full max-w-2xl max-h-80" viewBox="0 0 600 320" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background Radar Rings */}
                <circle cx="300" cy="160" r="130" stroke="rgba(57,255,136,0.12)" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="300" cy="160" r="95" stroke="rgba(57,255,136,0.18)" strokeWidth="1.5" />
                <circle cx="300" cy="160" r="50" stroke="rgba(57,255,136,0.25)" strokeWidth="2" strokeDasharray="6 3" className="animate-spin-slow origin-center" />

                {/* Central Industrial Core: Dual Compressor Turbine / Server Chassis */}
                <rect x="230" y="90" width="140" height="140" rx="16" fill="#121C15" stroke="#39FF88" strokeWidth="2" />
                <rect x="245" y="105" width="110" height="110" rx="10" fill="#0D1510" stroke="rgba(57,255,136,0.3)" strokeWidth="1" />
                
                {/* Core Turbine Blades / Heat Exchanger Grid */}
                <circle cx="300" cy="160" r="36" fill="#18231B" stroke="#00B894" strokeWidth="2" />
                <path d="M300 128 L300 192 M268 160 L332 160 M277 137 L323 183 M277 183 L323 137" stroke="#39FF88" strokeWidth="2" strokeLinecap="round" />
                <circle cx="300" cy="160" r="10" fill="#39FF88" />

                {/* Circuit Bus Lines to Left & Right Nodes */}
                {/* Left Branch */}
                <path d="M230 140 L160 140 L120 100" stroke="#39FF88" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx="120" cy="100" r="7" fill="#121C15" stroke="#39FF88" strokeWidth="2" />
                <text x="50" y="80" fill="#F4F8F5" fontSize="10" fontFamily="monospace">LAB AIR COND #01</text>
                <text x="50" y="94" fill="#39FF88" fontSize="9" fontFamily="monospace">VIBRATION: 0.12 mm/s</text>

                <path d="M230 180 L150 180 L110 210" stroke="#5BA8FF" strokeWidth="2" />
                <circle cx="110" cy="210" r="7" fill="#121C15" stroke="#5BA8FF" strokeWidth="2" />
                <text x="40" y="230" fill="#F4F8F5" fontSize="10" fontFamily="monospace">CORE SWITCH CAT-6</text>
                <text x="40" y="244" fill="#5BA8FF" fontSize="9" fontFamily="monospace">UPTIME: 99.98%</text>

                {/* Right Branch */}
                <path d="M370 140 L440 140 L480 100" stroke="#39FF88" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx="480" cy="100" r="7" fill="#121C15" stroke="#39FF88" strokeWidth="2" />
                <text x="495" y="80" fill="#F4F8F5" fontSize="10" fontFamily="monospace">MAIN LAB UPS</text>
                <text x="495" y="94" fill="#39FF88" fontSize="9" fontFamily="monospace">HEALTH: OPTIMAL</text>

                <path d="M370 180 L450 180 L490 220" stroke="#F5B942" strokeWidth="2" />
                <circle cx="490" cy="220" r="7" fill="#121C15" stroke="#F5B942" strokeWidth="2" />
                <text x="495" y="215" fill="#F4F8F5" fontSize="10" fontFamily="monospace">PROJECTOR AST-PJ-004</text>
                <text x="495" y="229" fill="#F5B942" fontSize="9" fontFamily="monospace">FILTER DUE: 4 DAYS</text>

                {/* Vertical Waveform pulse */}
                <path d="M200 280 L230 280 L240 265 L250 295 L260 275 L270 285 L300 280 L350 280" stroke="rgba(57,255,136,0.5)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* 3. THREE FLOATING INFORMATION CARDS (PART 6.4) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              {/* Card 1: Asset Health */}
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="bg-bg-elevated/90 border border-status-success/30 rounded-2xl p-4 shadow-glow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-status-success/10 border border-status-success/30 flex items-center justify-center text-status-success shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-text-muted font-mono block">
                      Asset Health
                    </span>
                    <span className="text-2xl font-bold font-display text-text-primary tracking-tight">
                      98.4%
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-status-success/10 text-status-success border border-status-success/30">
                  DEMO DATA
                </span>
              </motion.div>

              {/* Card 2: Active Work Orders */}
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="bg-bg-elevated/90 border border-status-warning/30 rounded-2xl p-4 shadow-card-dark flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-status-warning/10 border border-status-warning/30 flex items-center justify-center text-status-warning shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-text-muted font-mono block">
                      Active Work Orders
                    </span>
                    <span className="text-2xl font-bold font-display text-text-primary tracking-tight">
                      12
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-status-warning/10 text-status-warning border border-status-warning/30">
                  DEMO DATA
                </span>
              </motion.div>

              {/* Card 3: Maintenance Due */}
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="bg-bg-elevated/90 border border-status-info/30 rounded-2xl p-4 shadow-card-dark flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-status-info/10 border border-status-info/30 flex items-center justify-center text-status-info shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-text-muted font-mono block">
                      Maintenance Due
                    </span>
                    <span className="text-2xl font-bold font-display text-text-primary tracking-tight">
                      04
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-status-info/10 text-status-info border border-status-info/30">
                  DEMO DATA
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 4. FEATURE SHOWCASE (PART 6.5) */}
      <section id="features-section" className="py-20 sm:py-28 border-t border-industrial-border bg-bg-secondary/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono text-accent-primary uppercase tracking-wider px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/30 inline-block mb-3">
              END-TO-END CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-text-primary tracking-tight mb-4">
              Engineered for Institutional Complexity
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Designed specifically to solve the real-world operational challenges of educational colleges, laboratory managers, and campus facility departments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((feat, index) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="group relative p-6 rounded-2xl bg-bg-card border border-industrial-border hover:border-accent-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-accent-primary/10 border border-accent-primary/25 flex items-center justify-center text-accent-primary group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/[0.04] text-text-muted border border-white/10">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold font-display text-text-primary mb-2 group-hover:text-accent-primary transition-colors">
                    {feat.title}
                  </h3>

                  <p className="text-sm text-text-secondary leading-relaxed">
                    {feat.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS (PART 6.6) */}
      <section id="how-it-works-section" className="py-20 sm:py-28 border-t border-industrial-border relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono text-accent-primary uppercase tracking-wider px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/30 inline-block mb-3">
              OPERATIONAL TIMELINE
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-text-primary tracking-tight mb-4">
              How Smart AssetCare Operates
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              A synchronized 4-stage lifecycle that connects faculty reporters, facility managers, and field technicians effortlessly.
            </p>
          </div>

          {/* Timeline Container */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting horizontal line for desktop */}
            <div className="hidden md:block absolute top-1/4 left-12 right-12 h-0.5 bg-gradient-to-r from-accent-primary/20 via-accent-primary/50 to-accent-secondary/20 z-0" />

            {workflowSteps.map((step, idx) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative z-10 flex flex-col items-start bg-bg-card/70 border border-industrial-border rounded-2xl p-6 backdrop-blur-sm hover:border-accent-primary/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-bg-elevated border border-accent-primary/40 text-accent-primary font-mono font-bold text-lg flex items-center justify-center mb-5 shadow-glow-sm">
                  {step.step}
                </div>
                <h3 className="text-base font-bold font-display text-text-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. BENEFITS GRID (PART 6.7) */}
      <section className="py-20 sm:py-28 border-t border-industrial-border bg-bg-secondary/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono text-accent-primary uppercase tracking-wider px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/30 inline-block mb-3">
              MEASURABLE ADVANTAGES
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-text-primary tracking-tight mb-4">
              Institutional Peace of Mind
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Eliminate unexpected lab shutdowns, unverified repair bills, and unaccounted equipment loss.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, idx) => (
              <div
                key={b.title}
                className="p-6 rounded-2xl bg-bg-card border border-industrial-border flex items-start gap-4"
              >
                <div className="w-8 h-8 rounded-lg bg-status-success/15 text-status-success flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-display text-text-primary mb-1.5">
                    {b.title}
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. DASHBOARD PREVIEW (PART 6.8) */}
      <section className="py-20 sm:py-28 border-t border-industrial-border relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-mono text-accent-primary uppercase tracking-wider px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/30 inline-block mb-3">
              LIVE WORKSPACE PREVIEW
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-text-primary tracking-tight mb-4">
              Dark-Mode Command Center
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Explore the exact high-density interface campus administrators and technicians use to control physical infrastructure.
            </p>
          </div>

          {/* Interactive Mock Dashboard Frame */}
          <div className="rounded-3xl border border-industrial-borderHover bg-bg-card/95 shadow-2xl overflow-hidden max-w-5xl mx-auto">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between p-4 bg-bg-secondary border-b border-industrial-border gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-bg-elevated border border-industrial-border text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
                  <span>PREVIEW: ROLE-BASED DASHBOARD</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => navigate('/login')}
                >
                  Enter Full Demo App
                </Button>
              </div>
            </div>

            {/* Dashboard Mock Content */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Top KPI Mock Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-bg-elevated border border-industrial-border">
                  <span className="text-[10px] font-mono uppercase text-text-muted">Total Registered</span>
                  <div className="text-2xl font-bold font-display text-text-primary mt-1">24 Assets</div>
                  <span className="text-[10px] text-accent-primary font-mono">100% Cataloged</span>
                </div>

                <div className="p-4 rounded-xl bg-bg-elevated border border-industrial-border">
                  <span className="text-[10px] font-mono uppercase text-text-muted">Operational</span>
                  <div className="text-2xl font-bold font-display text-status-success mt-1">21 Active</div>
                  <span className="text-[10px] text-text-secondary font-mono">87.5% Health</span>
                </div>

                <div className="p-4 rounded-xl bg-bg-elevated border border-industrial-border">
                  <span className="text-[10px] font-mono uppercase text-text-muted">Under Maintenance</span>
                  <div className="text-2xl font-bold font-display text-status-warning mt-1">3 Units</div>
                  <span className="text-[10px] text-status-warning font-mono">2 In Progress</span>
                </div>

                <div className="p-4 rounded-xl bg-bg-elevated border border-industrial-border">
                  <span className="text-[10px] font-mono uppercase text-text-muted">Monthly Expense</span>
                  <div className="text-2xl font-bold font-display text-accent-primary mt-1">₹42,500</div>
                  <span className="text-[10px] text-text-muted font-mono">Audit Cleared</span>
                </div>
              </div>

              {/* Mock Table Preview */}
              <div className="rounded-xl border border-industrial-border overflow-hidden">
                <div className="px-4 py-3 bg-bg-secondary flex items-center justify-between border-b border-industrial-border text-xs font-mono">
                  <span className="text-text-primary font-semibold">CAMPUS HARDWARE ROSTER</span>
                  <span className="text-text-muted">SHOWING 3 OF 24 ITEMS</span>
                </div>
                <div className="divide-y divide-industrial-border text-xs font-mono bg-bg-elevated/40">
                  <div className="p-3 sm:px-4 sm:py-3.5 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-text-primary">AST-AC-001</span>
                      <p className="text-text-muted font-sans text-xs">Computer Lab 1 - 2 Ton Inverter Split AC</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-status-success/10 text-status-success border border-status-success/30 text-[11px]">
                      OPERATIONAL
                    </span>
                  </div>

                  <div className="p-3 sm:px-4 sm:py-3.5 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-text-primary">AST-PJ-004</span>
                      <p className="text-text-muted font-sans text-xs">Seminar Hall - 4K Ceiling Laser Projector</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-status-warning/10 text-status-warning border border-status-warning/30 text-[11px]">
                      UNDER_MAINTENANCE
                    </span>
                  </div>

                  <div className="p-3 sm:px-4 sm:py-3.5 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-text-primary">AST-NW-005</span>
                      <p className="text-text-muted font-sans text-xs">Main Server Room - Cisco 48-Port Managed Switch</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-status-success/10 text-status-success border border-status-success/30 text-[11px]">
                      OPERATIONAL
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION BANNER */}
      <section className="py-16 sm:py-24 border-t border-industrial-border relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl p-8 sm:p-12 border border-accent-primary/40 bg-gradient-to-b from-bg-card to-bg-secondary shadow-glow-sm overflow-hidden text-center">
            {/* Background decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-secondary/10 rounded-full blur-3xl pointer-events-none" />

            <h3 className="text-2xl sm:text-4xl font-extrabold font-display text-text-primary mb-4">
              Ready to Upgrade Campus Asset Reliability?
            </h3>

            <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto mb-8">
              Explore the interactive demonstration with predefined Institutional Admin, Manager, Technician, and Faculty accounts.
            </p>

            <Button
              variant="primary"
              size="lg"
              iconRight={ArrowRight}
              onClick={() => navigate('/login')}
              className="px-8"
            >
              Launch Interactive Prototype
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
