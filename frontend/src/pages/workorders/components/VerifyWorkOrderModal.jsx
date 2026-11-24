import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, FileCheck, Layers, DollarSign } from 'lucide-react';
import Button from '../../../components/common/Button';
import { useAppData } from '../../../context/AppDataContext';
import { useToast } from '../../../context/ToastContext';
import { formatRupee } from '../../../utils/formatters';

export default function VerifyWorkOrderModal({ isOpen, onClose, workOrder }) {
  const { verifyWorkOrder } = useAppData();
  const { showToast } = useToast();

  const [note, setNote] = useState('');
  const [labourCost, setLabourCost] = useState(
    workOrder?.labourCost !== undefined ? String(workOrder.labourCost) : '1200'
  );
  const [partsCost, setPartsCost] = useState(
    workOrder?.partsCost !== undefined ? String(workOrder.partsCost) : '850'
  );
  const [otherCharges, setOtherCharges] = useState(
    workOrder?.otherCharges !== undefined ? String(workOrder.otherCharges) : '150'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !workOrder) return null;

  const labourNum = Number(labourCost) || 0;
  const partsNum = Number(partsCost) || 0;
  const otherNum = Number(otherCharges) || 0;
  const totalExpenditure = labourNum + partsNum + otherNum;

  const handleVerify = () => {
    setIsSubmitting(true);
    try {
      verifyWorkOrder(workOrder.id, {
        note: note.trim() || 'Verified satisfactory completion according to campus safety guidelines',
        labourCost: labourNum,
        partsCost: partsNum,
        otherCharges: otherNum
      });
      showToast(`Work Order ${workOrder.workOrderId} verified by management. Service Record & Invoice generated.`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to verify work order.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-bg-card border border-industrial-border rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-industrial-border bg-bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary font-display">Verify Completed Work</h2>
              <p className="text-xs text-text-secondary">
                Management sign-off & financial certification for <span className="font-mono text-accent-primary font-bold">{workOrder.workOrderId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Work Order Info */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary">{workOrder.title}</span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                COMPLETED
              </span>
            </div>

            {workOrder.resolutionDescription && (
              <div className="pt-2 border-t border-white/[0.06]">
                <span className="text-text-muted block text-[10px] uppercase font-mono tracking-wider mb-1">
                  Technician Resolution Report:
                </span>
                <p className="text-text-secondary italic bg-black/30 p-2.5 rounded-lg border border-white/[0.04]">
                  "{workOrder.resolutionDescription}"
                </p>
              </div>
            )}

            {workOrder.partsReplaced && (
              <div className="text-[11px] font-mono text-text-secondary">
                <span className="text-text-muted">Parts Replaced: </span>
                <span className="text-accent-primary">{workOrder.partsReplaced}</span>
              </div>
            )}
          </div>

          {/* Itemized Cost Verification */}
          <div className="p-3.5 rounded-xl bg-bg-surface/50 border border-industrial-border space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-accent-primary block">
              Certified Financial Expenditure (INR ₹)
            </span>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-mono text-text-muted mb-0.5">Labour Fee</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={labourCost}
                  onChange={(e) => setLabourCost(e.target.value)}
                  className="w-full px-2.5 py-1 rounded bg-bg-elevated border border-industrial-border text-xs font-mono text-text-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-text-muted mb-0.5">Parts Cost</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={partsCost}
                  onChange={(e) => setPartsCost(e.target.value)}
                  className="w-full px-2.5 py-1 rounded bg-bg-elevated border border-industrial-border text-xs font-mono text-text-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-text-muted mb-0.5">Other/Incidental</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(e.target.value)}
                  className="w-full px-2.5 py-1 rounded bg-bg-elevated border border-industrial-border text-xs font-mono text-text-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-industrial-border flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-text-muted">Total Certified:</span>
              <span className="text-sm font-bold font-mono text-accent-primary">
                {formatRupee(totalExpenditure)}
              </span>
            </div>
          </div>

          {(workOrder.linkedScheduleId || workOrder.maintenanceScheduleId) && (
            <div className="p-3 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-xs text-text-secondary flex items-start gap-2.5">
              <Layers className="w-4 h-4 text-accent-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-accent-primary">Preventive Schedule Linked:</strong>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Verifying this work order will automatically mark the linked preventive schedule as completed and compute the next recurrence cadence.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Verification Notes / QA Remarks (Optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Inspected physical assembly; thermal scan within nominal 38°C ceiling; all warning lamps cleared."
              className="w-full px-3.5 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-purple-400 transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-industrial-border bg-bg-surface/50">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="accent" size="sm" onClick={handleVerify} disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Approve & Mark Verified'}
          </Button>
        </div>
      </div>
    </div>
  );
}
