import React, { useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Layers,
  ArrowLeft,
  Edit3,
  QrCode,
  Download,
  Printer,
  Calendar,
  Wrench,
  DollarSign,
  Activity,
  Shield,
  ShieldAlert,
  Clock,
  MapPin,
  Building,
  Cpu,
  FileText,
  CheckCircle2,
  AlertTriangle,
  History,
  Copy,
  Check,
  TrendingUp,
  Plus,
  ExternalLink,
  Receipt
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/cards/Card';
import AssetFormModal from './AssetFormModal';
import DeleteAssetModal from './DeleteAssetModal';
import InvoiceModal from '../costs/components/InvoiceModal';
import ExpenseFormModal from '../costs/components/ExpenseFormModal';
import ServiceDetailModal from '../history/components/ServiceDetailModal';
import ServiceFormModal from '../history/components/ServiceFormModal';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasPermission } from '../../utils/permissions';
import { formatRupee, formatDate } from '../../utils/formatters';

export default function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { assets, schedules, serviceHistory, repairCosts, workOrders, users } = useAppData();
  const { role } = useAuth();
  const { showToast } = useToast();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedInvoiceCost, setSelectedInvoiceCost] = useState(null);
  const [selectedServiceRecord, setSelectedServiceRecord] = useState(null);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  // Hidden canvas for downloading PNG
  const qrCanvasRef = useRef(null);

  // Find asset by either mongo-like id or user-friendly assetId
  const asset = assets.find((a) => a.id === id || a.assetId === id);

  if (!asset) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-status-critical/10 text-status-critical border border-status-critical/30 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-display text-text-primary mb-2">
          Asset Record Not Found
        </h2>
        <p className="text-xs text-text-secondary max-w-md mb-6">
          The requested identifier "{id}" does not exist in the active campus inventory or may have been deleted.
        </p>
        <Button variant="primary" icon={ArrowLeft} onClick={() => navigate('/app/assets')}>
          Return to Asset Inventory
        </Button>
      </div>
    );
  }

  // Related data lookups
  const matchedSchedules = schedules.filter(
    (s) => s.assetId === asset.id || s.assetId === asset.assetId
  );
  const nextSchedule = matchedSchedules.find(
    (s) => s.status === 'UPCOMING' || s.status === 'DUE' || s.status === 'OVERDUE'
  );

  const matchedHistory = serviceHistory.filter(
    (sh) => sh.assetId === asset.id || sh.assetId === asset.assetId
  );
  const lastHistory = matchedHistory[0] || null;

  const matchedCosts = repairCosts.filter(
    (rc) => rc.assetId === asset.id || rc.assetId === asset.assetId
  );
  const totalRepairSpend = matchedCosts.reduce(
    (acc, c) => acc + (Number(c.totalCost) || 0),
    0
  );

  const mostRecentCost = useMemo(() => {
    if (!matchedCosts.length) return null;
    return [...matchedCosts].sort((a, b) => {
      const dateA = a.expenseDate || a.serviceDate || '';
      const dateB = b.expenseDate || b.serviceDate || '';
      return dateB.localeCompare(dateA);
    })[0];
  }, [matchedCosts]);

  const assetCostTrend = useMemo(() => {
    if (!matchedCosts.length) return [];
    return [...matchedCosts]
      .sort((a, b) => {
        const dateA = a.expenseDate || a.serviceDate || '';
        const dateB = b.expenseDate || b.serviceDate || '';
        return dateA.localeCompare(dateB);
      })
      .map((c) => ({
        date: formatDate(c.expenseDate || c.serviceDate),
        rawDate: c.expenseDate || c.serviceDate,
        total: Number(c.totalCost) || 0,
        id: c.expenseId || c.id
      }));
  }, [matchedCosts]);

  // Warranty status calculation
  const isWarrantyActive = React.useMemo(() => {
    if (!asset.warrantyExpiry) return false;
    return new Date(asset.warrantyExpiry) > new Date();
  }, [asset.warrantyExpiry]);

  // Copy Asset ID helper
  const handleCopyId = () => {
    navigator.clipboard.writeText(asset.assetId);
    setCopied(true);
    showToast({
      type: 'info',
      title: 'Copied to Clipboard',
      message: `Asset ID ${asset.assetId} copied.`
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Download QR Code PNG helper
  const handleDownloadQr = () => {
    const canvas = document.getElementById(`qr-canvas-${asset.assetId}`);
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${asset.assetId}_QR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast({
        type: 'success',
        title: 'QR Code Downloaded',
        message: `Saved ${asset.assetId}_QR.png`
      });
    }
  };

  // Print QR Label helper
  const handlePrintQr = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (!printWindow) {
      showToast({
        type: 'error',
        title: 'Pop-up Blocked',
        message: 'Please allow popups to open the print-ready QR label.'
      });
      return;
    }

    const canvas = document.getElementById(`qr-canvas-${asset.assetId}`);
    const qrDataUrl = canvas ? canvas.toDataURL('image/png') : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Label - ${asset.assetId}</title>
          <style>
            @page { size: auto; margin: 12mm; }
            body {
              font-family: 'Inter', system-ui, sans-serif;
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #fff;
              color: #000;
            }
            .label-card {
              border: 3px solid #000;
              border-radius: 12px;
              padding: 20px;
              width: 320px;
              text-align: center;
              page-break-inside: avoid;
            }
            .brand {
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              margin-bottom: 8px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 6px;
            }
            .asset-id {
              font-family: monospace;
              font-size: 20px;
              font-weight: 900;
              margin: 8px 0;
            }
            .asset-name {
              font-size: 13px;
              font-weight: 600;
              margin-bottom: 6px;
            }
            .location {
              font-size: 11px;
              color: #555;
              margin-bottom: 14px;
            }
            img.qr {
              width: 180px;
              height: 180px;
              margin: 0 auto;
              display: block;
            }
            .footer-tag {
              font-size: 9px;
              font-family: monospace;
              color: #666;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="brand">SMART ASSETCARE // CAMPUS EQUIPMENT</div>
            <div class="asset-id">${asset.assetId}</div>
            <div class="asset-name">${asset.name}</div>
            <div class="location">Location: ${asset.location}</div>
            <img class="qr" src="${qrDataUrl}" alt="QR Code" />
            <div class="footer-tag">SCAN TO INSPECT SERVICE HISTORY</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const canEdit = hasPermission(role, 'CAN_EDIT_ASSET');
  const canDelete = hasPermission(role, 'CAN_DELETE_ASSET') || role === 'MANAGER';

  // Health gauge calculation (strokeDashoffset)
  const healthValue = Math.min(100, Math.max(0, asset.healthScore || 95));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthValue / 100) * circumference;

  const healthColor =
    healthValue >= 85
      ? '#39FF88'
      : healthValue >= 60
      ? '#F5B942'
      : '#FF5D62';

  const healthStatusText =
    healthValue >= 85
      ? 'Optimal Operating Condition'
      : healthValue >= 60
      ? 'Preventive Servicing Recommended'
      : 'Critical Degradation - Action Required';

  const qrRouteUrl = `/app/assets/${asset.assetId}`;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hidden QRCodeCanvas for generating downloadable PNG */}
      <div className="hidden">
        <QRCodeCanvas
          id={`qr-canvas-${asset.assetId}`}
          value={window.location.origin + qrRouteUrl}
          size={512}
          level="H"
          includeMargin={true}
        />
      </div>

      {/* TOP HEADER & BREADCRUMB */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate('/app/assets')}
            className="text-text-muted hover:text-text-primary"
          >
            Back to Asset Inventory
          </Button>

          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                icon={Edit3}
                onClick={() => setEditModalOpen(true)}
              >
                Edit Specifications
              </Button>
            )}

            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteModalOpen(true)}
              >
                Lifecycle Actions
              </Button>
            )}
          </div>
        </div>

        {/* Hero Asset Title Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-3xl bg-bg-card border border-industrial-borderHover shadow-card-dark relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent-primary/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <span
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-accent-primary/15 border border-accent-primary/35 font-mono text-xs font-bold text-accent-primary hover:bg-accent-primary/25 cursor-pointer transition-colors shadow-glow-sm"
                title="Click to copy Asset ID"
              >
                {asset.assetId}
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-accent-primary/70" />}
              </span>

              <Badge status={asset.status} size="sm" />

              <span className="text-xs font-mono text-text-muted">
                {asset.category}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold font-display text-text-primary tracking-tight">
              {asset.name}
            </h1>

            <p className="text-xs sm:text-sm text-text-secondary flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent-primary shrink-0" />
              <span>{asset.location}</span>
              <span className="text-text-muted">•</span>
              <Building className="w-4 h-4 text-text-muted shrink-0" />
              <span>{asset.department}</span>
            </p>
          </div>

          {/* Quick Buttons for QR */}
          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={handleDownloadQr}
            >
              Download QR
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={Printer}
              onClick={handlePrintQr}
            >
              Print Asset Tag
            </Button>
          </div>
        </div>
      </div>

      {/* 2 COLUMN GRID: OVERVIEW & HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION A: OVERVIEW & IMAGE */}
        <Card title="Asset Overview & Specifications" className="lg:col-span-2">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Asset Photo */}
            <div className="w-full md:w-56 h-56 rounded-2xl bg-bg-elevated border border-industrial-border overflow-hidden shrink-0 relative group">
              <img
                src={asset.image}
                alt={asset.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 text-center">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-bg-card/90 text-text-muted border border-white/10 backdrop-blur-sm">
                  {asset.category}
                </span>
              </div>
            </div>

            {/* Specifications Matrix */}
            <div className="flex-1 space-y-4 w-full">
              <p className="text-sm text-text-secondary leading-relaxed">
                {asset.description || 'No additional technical description provided for this campus asset.'}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                <div className="p-3 rounded-xl bg-bg-elevated border border-industrial-border">
                  <span className="text-[10px] text-text-muted uppercase block">Manufacturer / Brand</span>
                  <span className="font-bold text-text-primary text-sm mt-0.5 block">{asset.brand || '—'}</span>
                </div>

                <div className="p-3 rounded-xl bg-bg-elevated border border-industrial-border">
                  <span className="text-[10px] text-text-muted uppercase block">Model Number</span>
                  <span className="font-bold text-text-primary text-sm mt-0.5 block">{asset.model || '—'}</span>
                </div>

                <div className="p-3 rounded-xl bg-bg-elevated border border-industrial-border">
                  <span className="text-[10px] text-text-muted uppercase block">Serial Number</span>
                  <span className="font-bold text-accent-primary text-sm mt-0.5 block">{asset.serialNumber || '—'}</span>
                </div>

                <div className="p-3 rounded-xl bg-bg-elevated border border-industrial-border">
                  <span className="text-[10px] text-text-muted uppercase block">Custodian Department</span>
                  <span className="font-bold text-text-primary text-sm mt-0.5 block">{asset.department}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION D: ANIMATED CIRCULAR ASSET HEALTH GAUGE */}
        <Card title="Simulated Asset Health" subtitle="Operating condition telemetry">
          <div className="flex flex-col items-center justify-center py-4 text-center">
            {/* Circular SVG Gauge */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
                {/* Background Track */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Animated Health Progress Stroke */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke={healthColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Center percentage readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold font-display text-text-primary tracking-tight">
                  {healthValue}%
                </span>
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                  Health Index
                </span>
              </div>
            </div>

            {/* Health explanation */}
            <div className="mt-4 space-y-1">
              <h4 className="text-sm font-bold text-text-primary font-display" style={{ color: healthColor }}>
                {healthStatusText}
              </h4>
              <p className="text-[11px] text-text-muted font-mono max-w-xs">
                Uptime status: {asset.status === 'OPERATIONAL' ? 'Zero unexpected shutdowns' : 'Servicing in progress'}
              </p>
            </div>

            {/* Mandatory Demonstration Disclaimer */}
            <div className="mt-4 p-2.5 rounded-xl bg-bg-elevated border border-industrial-border text-[10px] font-mono text-text-muted text-center w-full">
              ⚠️ Simulated Health Indicator (Calculated from sample operational intervals)
            </div>
          </div>
        </Card>
      </div>

      {/* 2 COLUMN GRID: PURCHASE & MAINTENANCE INFO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION B: PURCHASE & WARRANTY */}
        <Card title="Purchase & Warranty Information" subtitle="Acquisition records and coverage status">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-bg-elevated border border-industrial-border">
              <span className="text-xs font-mono text-text-muted uppercase block">Purchase Date</span>
              <span className="text-sm font-bold font-display text-text-primary mt-1 block">
                {formatDate(asset.purchaseDate)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-bg-elevated border border-industrial-border">
              <span className="text-xs font-mono text-text-muted uppercase block">Capital Purchase Cost</span>
              <span className="text-base font-bold font-display text-accent-primary mt-1 block">
                {formatRupee(asset.purchaseCost)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-bg-elevated border border-industrial-border">
              <span className="text-xs font-mono text-text-muted uppercase block">Warranty Expiry</span>
              <span className="text-sm font-bold font-display text-text-primary mt-1 block">
                {formatDate(asset.warrantyExpiry)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-bg-elevated border border-industrial-border flex flex-col justify-between">
              <span className="text-xs font-mono text-text-muted uppercase block">Warranty Coverage</span>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border ${
                    isWarrantyActive
                      ? 'bg-status-success/15 text-status-success border-status-success/30'
                      : 'bg-status-warning/15 text-status-warning border-status-warning/30'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {isWarrantyActive ? 'Active Manufacturer Warranty' : 'Warranty Expired'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION C: MAINTENANCE & SERVICING CYCLE */}
        <Card title="Preventive Maintenance Schedule" subtitle="Planned inspections and servicing intervals">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-bg-elevated border border-industrial-border">
                <span className="text-[10px] text-text-muted uppercase block">Last Serviced Date</span>
                <span className="font-bold text-text-primary text-sm mt-1 block">
                  {lastHistory ? formatDate(lastHistory.serviceDate) : 'No prior servicing'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-bg-elevated border border-industrial-border">
                <span className="text-[10px] text-text-muted uppercase block">Next Scheduled Due</span>
                <span className="font-bold text-accent-primary text-sm mt-1 block">
                  {nextSchedule ? formatDate(nextSchedule.dueDate) : 'None scheduled'}
                </span>
              </div>
            </div>

            {nextSchedule ? (
              <div className="p-4 rounded-xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-accent-primary uppercase font-bold block">
                    Upcoming Task: {nextSchedule.maintenanceType}
                  </span>
                  <h4 className="text-xs font-bold text-text-primary mt-0.5">
                    {nextSchedule.title}
                  </h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Recurrence: {nextSchedule.recurrence} • Priority: {nextSchedule.priority}
                  </p>
                </div>

                <Badge status={nextSchedule.status} size="xs" />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-bg-elevated border border-industrial-border text-center text-xs text-text-muted">
                No active upcoming maintenance scheduled.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* SECTION E: SERVICE HISTORY TIMELINE */}
      <Card
        title="Service & Maintenance History"
        subtitle={`Chronological log of ${matchedHistory.length} completed maintenance operations`}
        icon={History}
        action={
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => setServiceModalOpen(true)}
          >
            Log Service
          </Button>
        }
      >
        <div className="space-y-6">
          {matchedHistory.length > 0 ? (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-industrial-border">
              {matchedHistory.map((item, index) => (
                <div key={item.id} className="relative group">
                  {/* Timeline Node */}
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-bg-card border-2 border-accent-primary group-hover:scale-125 transition-transform" />

                  <div
                    onClick={() => setSelectedServiceRecord(item)}
                    className="p-4 rounded-2xl bg-bg-elevated border border-industrial-border space-y-2 hover:border-accent-primary/60 transition-all cursor-pointer shadow-sm hover:shadow-glow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <span className="font-bold text-accent-primary flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Service Date: {formatDate(item.serviceDate)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-text-muted">
                          {item.serviceId || item.id.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-accent-primary font-mono flex items-center gap-0.5 hover:underline">
                          View Certificate <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-text-primary">
                      {item.problemIdentified || item.serviceDescription}
                    </h4>

                    <p className="text-xs text-text-secondary">
                      {item.workPerformed || item.actionTaken}
                    </p>

                    <div className="p-2.5 rounded-xl bg-bg-card border border-industrial-border text-xs font-mono space-y-1">
                      <div>
                        <span className="text-text-muted">Parts Replaced: </span>
                        <span className="text-status-warning font-semibold">{item.partsReplaced || 'None'}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-industrial-border/40">
                        <span className="text-text-muted">Certified Service Expense:</span>
                        <span className="font-bold text-accent-primary">{formatRupee(item.totalCost || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-text-muted">
              No historical maintenance records logged for this asset yet.
            </div>
          )}
        </div>
      </Card>

      {/* SECTION F: REPAIR COST SUMMARY */}
      <Card
        title="Repair Expenses & Financial Audit"
        subtitle={`Total capital spent on repairs: ${formatRupee(totalRepairSpend)}`}
        icon={DollarSign}
        action={
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => setExpenseModalOpen(true)}
          >
            Record Expense
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-bg-elevated border border-industrial-border">
              <span className="text-[10px] text-text-muted uppercase block">Total Expenses</span>
              <span className="text-base font-bold text-accent-primary mt-1 block">
                {formatRupee(totalRepairSpend)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-bg-elevated border border-industrial-border">
              <span className="text-[10px] text-text-muted uppercase block">Number of Repairs</span>
              <span className="text-base font-bold text-text-primary mt-1 block">
                {matchedCosts.length} Bills
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-bg-elevated border border-industrial-border">
              <span className="text-[10px] text-text-muted uppercase block">Average Cost / Repair</span>
              <span className="text-base font-bold text-text-primary mt-1 block">
                {matchedCosts.length ? formatRupee(Math.round(totalRepairSpend / matchedCosts.length)) : '₹0'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-bg-elevated border border-industrial-border">
              <span className="text-[10px] text-text-muted uppercase block">Cost to Value Ratio</span>
              <span className="text-base font-bold text-text-secondary mt-1 block">
                {asset.purchaseCost ? `${Math.round((totalRepairSpend / asset.purchaseCost) * 100)}%` : '0%'}
              </span>
            </div>
          </div>

          {matchedCosts.length > 0 && (
            <div className="rounded-xl border border-industrial-border overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-bg-secondary text-text-muted border-b border-industrial-border">
                  <tr>
                    <th className="p-3">Cost ID</th>
                    <th className="p-3">Service Date</th>
                    <th className="p-3">Labour (₹)</th>
                    <th className="p-3">Parts (₹)</th>
                    <th className="p-3">Other (₹)</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Invoice File</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-industrial-border bg-bg-card">
                  {matchedCosts.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedInvoiceCost(c)}
                      className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <td className="p-3 font-bold text-accent-primary">
                        {c.expenseId || c.id.toUpperCase()}
                      </td>
                      <td className="p-3 text-text-muted">{formatDate(c.expenseDate || c.serviceDate)}</td>
                      <td className="p-3 text-text-secondary">{formatRupee(c.labourCost)}</td>
                      <td className="p-3 text-text-secondary">{formatRupee(c.partsCost)}</td>
                      <td className="p-3 text-text-secondary">{formatRupee(c.otherCharges)}</td>
                      <td className="p-3 font-bold text-accent-primary">{formatRupee(c.totalCost)}</td>
                      <td className="p-3 text-text-muted">{c.invoiceName || c.invoiceNumber || 'Invoice.pdf'}</td>
                      <td className="p-3 text-right">
                        <span className="text-[11px] text-accent-primary font-mono group-hover:underline flex items-center justify-end gap-1">
                          <FileText className="w-3.5 h-3.5" /> View Bill
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* SECTION G: INTERACTIVE QR CODE */}
      <Card
        title="Asset Digital QR Passport"
        subtitle="Physical label verification & mobile scanning target"
        icon={QrCode}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-4">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="p-4 rounded-2xl bg-white shadow-2xl flex items-center justify-center shrink-0">
              <QRCodeSVG
                value={window.location.origin + qrRouteUrl}
                size={140}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-mono text-accent-primary font-bold">
                ENCODED ROUTE TARGET
              </span>
              <p className="text-sm font-bold text-text-primary font-mono">
                {qrRouteUrl}
              </p>
              <p className="text-xs text-text-muted max-w-md">
                Affix this QR code to the physical hardware. When scanned by on-site technicians or faculty, it loads this exact asset record directly.
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleDownloadQr}
              className="flex-1 sm:flex-initial justify-center"
            >
              Download PNG
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={Printer}
              onClick={handlePrintQr}
              className="flex-1 sm:flex-initial justify-center"
            >
              Print Label
            </Button>
          </div>
        </div>
      </Card>

      {/* MODALS */}
      <AssetFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        assetToEdit={asset}
      />

      <DeleteAssetModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        asset={asset}
        onSuccess={() => navigate('/app/assets')}
      />

      {/* Service Detail Modal */}
      {selectedServiceRecord && (
        <ServiceDetailModal
          isOpen={Boolean(selectedServiceRecord)}
          onClose={() => setSelectedServiceRecord(null)}
          record={selectedServiceRecord}
          asset={asset}
          technician={users.find((u) => u.id === selectedServiceRecord.technicianId)}
          workOrder={workOrders.find(
            (w) => w.id === selectedServiceRecord.workOrderId || w.workOrderId === selectedServiceRecord.workOrderId
          )}
        />
      )}

      {/* Commercial Invoice Modal */}
      {selectedInvoiceCost && (
        <InvoiceModal
          isOpen={Boolean(selectedInvoiceCost)}
          onClose={() => setSelectedInvoiceCost(null)}
          expense={selectedInvoiceCost}
          asset={asset}
          workOrder={workOrders.find(
            (w) => w.id === selectedInvoiceCost.workOrderId || w.workOrderId === selectedInvoiceCost.workOrderId
          )}
        />
      )}

      {/* Log Service Modal */}
      <ServiceFormModal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        defaultAssetId={asset.id}
      />

      {/* Record Expense Modal */}
      <ExpenseFormModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        initialData={{ assetId: asset.id }}
      />
    </div>
  );
}
