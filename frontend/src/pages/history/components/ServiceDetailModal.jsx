import React, { useState } from 'react';
import {
  X,
  History,
  Printer,
  Calendar,
  Clock,
  User,
  Wrench,
  DollarSign,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MapPin,
  Building,
  ShieldCheck,
  ExternalLink,
  Edit,
  Receipt
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import { formatRupee, formatDate } from '../../../utils/formatters';
import PrintServiceReportModal from './PrintServiceReportModal';
import InvoiceModal from '../../costs/components/InvoiceModal';
import { useAppData } from '../../../context/AppDataContext';
import { useAuth } from '../../../context/AuthContext';
import { ROLES } from '../../../utils/permissions';

export default function ServiceDetailModal({
  isOpen,
  onClose,
  record,
  asset,
  technician,
  workOrder,
  onEdit
}) {
  const { repairCosts } = useAppData();
  const { role, currentUser } = useAuth();

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  if (!isOpen || !record) return null;

  // Find linked repair cost if any
  const linkedCost = repairCosts.find(
    (rc) =>
      (record.costRecordIds && record.costRecordIds.includes(rc.id)) ||
      rc.serviceId === record.id ||
      rc.serviceId === record.serviceId
  );

  const canEdit =
    role === ROLES.ADMIN ||
    role === ROLES.MANAGER ||
    (role === ROLES.TECHNICIAN && record.technicianId === currentUser?.id);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-bg-card border border-industrial-border rounded-2xl shadow-2xl overflow-hidden my-6">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-industrial-border bg-bg-surface/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent-primary/10 border border-accent-primary/30 text-accent-primary">
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-text-primary font-display">
                    Service Record Details
                  </h2>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-accent-primary/15 text-accent-primary border border-accent-primary/30">
                    {record.serviceId || record.id.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  Executed on <span className="font-mono text-text-primary">{formatDate(record.serviceDate)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canEdit && onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={Edit}
                  onClick={() => {
                    onClose();
                    onEdit(record);
                  }}
                >
                  Edit
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                icon={Printer}
                onClick={() => setPrintModalOpen(true)}
              >
                Print Report
              </Button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Section 1: Asset Information */}
            <div className="p-4 rounded-xl bg-bg-elevated border border-industrial-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-accent-primary font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Target Equipment
                </span>
                {asset && (
                  <Link
                    to={`/app/assets/${asset.id}`}
                    className="text-[11px] font-mono text-accent-primary hover:underline flex items-center gap-1"
                  >
                    Asset Dossier <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-text-muted text-[10px] uppercase font-mono block">Asset Name</span>
                  <span className="font-bold text-text-primary block truncate">{asset?.name || 'Institutional Asset'}</span>
                </div>
                <div>
                  <span className="text-text-muted text-[10px] uppercase font-mono block">Asset Code</span>
                  <span className="font-mono font-bold text-accent-primary block">{asset?.assetId || record.assetId}</span>
                </div>
                <div>
                  <span className="text-text-muted text-[10px] uppercase font-mono block">Category</span>
                  <span className="text-text-secondary block">{asset?.category || 'General'}</span>
                </div>
                <div>
                  <span className="text-text-muted text-[10px] uppercase font-mono block">Location</span>
                  <span className="text-text-secondary block truncate">{asset?.location || 'Campus'}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Service Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-bg-elevated border border-industrial-border">
                <span className="text-[10px] font-mono text-text-muted uppercase block">Service Type</span>
                <span className="font-bold text-text-primary mt-0.5 block">{record.serviceType || 'Maintenance'}</span>
              </div>
              <div className="p-3 rounded-xl bg-bg-elevated border border-industrial-border">
                <span className="text-[10px] font-mono text-text-muted uppercase block">Status</span>
                <span className="font-mono font-bold text-emerald-400 mt-0.5 block">
                  {record.serviceStatus || 'COMPLETED'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-bg-elevated border border-industrial-border">
                <span className="text-[10px] font-mono text-text-muted uppercase block">Technician</span>
                <span className="font-semibold text-text-primary mt-0.5 block truncate">
                  {technician?.name || 'Field Technician'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-bg-elevated border border-industrial-border">
                <span className="text-[10px] font-mono text-text-muted uppercase block">Related Work Order</span>
                {workOrder ? (
                  <Link
                    to={`/app/work-orders/${workOrder.id}`}
                    className="font-mono font-bold text-accent-primary hover:underline mt-0.5 block truncate"
                  >
                    {workOrder.workOrderId}
                  </Link>
                ) : (
                  <span className="font-mono text-text-muted mt-0.5 block">
                    {record.workOrderId || 'Ad-Hoc Direct'}
                  </span>
                )}
              </div>
            </div>

            {/* Section 3: Diagnostic Observations & Work Done */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-bg-surface/60 border border-industrial-border space-y-1">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">
                  Problem Identified / Fault Symptoms
                </span>
                <p className="text-text-primary leading-relaxed">
                  {record.problemIdentified || record.serviceDescription}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-bg-surface/60 border border-industrial-border space-y-1">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">
                  Work Conducted & Action Taken
                </span>
                <p className="text-text-secondary leading-relaxed">
                  {record.workPerformed || record.actionTaken || 'Full functional calibration and diagnostic test performed.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-bg-surface/60 border border-industrial-border space-y-1">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">
                  Parts & Consumables Replaced
                </span>
                <p className="font-mono text-accent-primary">
                  {record.partsReplaced || 'None'}
                </p>
              </div>
            </div>

            {/* Section 4: Cost Breakdown */}
            <div className="p-4 rounded-xl bg-bg-elevated border border-industrial-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-bold block">
                  Itemized Cost Summary
                </span>
                {linkedCost && (
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(linkedCost)}
                    className="text-[11px] font-mono text-accent-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Receipt className="w-3.5 h-3.5" /> View Commercial Invoice ({linkedCost.invoiceNumber})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-text-muted block text-[10px] font-mono">Labour Charge</span>
                  <span className="font-mono font-bold text-text-primary">{formatRupee(record.labourCost || 0)}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] font-mono">Spare Parts</span>
                  <span className="font-mono font-bold text-text-primary">{formatRupee(record.partsCost || 0)}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] font-mono">Incidental Fees</span>
                  <span className="font-mono font-bold text-text-primary">{formatRupee(record.otherCharges || 0)}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] font-mono uppercase font-bold text-accent-primary">
                    Total Expense
                  </span>
                  <span className="font-mono font-extrabold text-sm text-accent-primary">
                    {formatRupee(record.totalCost || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 5: Additional Remarks & Attestations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {record.finalRemarks && (
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">
                    Technician Remarks
                  </span>
                  <p className="text-text-secondary italic">"{record.finalRemarks}"</p>
                </div>
              )}

              {record.managerRemarks && (
                <div className="p-3 rounded-xl bg-purple-500/[0.05] border border-purple-500/20 space-y-1">
                  <span className="text-[10px] font-mono text-purple-300 uppercase tracking-wider block">
                    Manager Review & Sign-Off
                  </span>
                  <p className="text-text-secondary italic">"{record.managerRemarks}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-industrial-border bg-bg-surface/50">
            <span className="text-[11px] font-mono text-text-muted">
              Record ID: {record.id}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Back to Logs
              </Button>
              <Button variant="primary" size="sm" icon={Printer} onClick={() => setPrintModalOpen(true)}>
                Print Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Print Report Modal */}
      <PrintServiceReportModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        record={record}
        asset={asset}
        technician={technician}
        workOrder={workOrder}
      />

      {/* Embedded Linked Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal
          isOpen={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          expense={selectedInvoice}
          asset={asset}
          workOrder={workOrder}
        />
      )}
    </>
  );
}
