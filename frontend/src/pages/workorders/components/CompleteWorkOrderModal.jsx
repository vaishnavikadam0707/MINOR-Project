import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, FileText, DollarSign, Wrench } from 'lucide-react';
import Button from '../../../components/common/Button';
import { useAppData } from '../../../context/AppDataContext';
import { useToast } from '../../../context/ToastContext';
import { formatRupee } from '../../../utils/formatters';

export default function CompleteWorkOrderModal({ isOpen, onClose, workOrder }) {
  const { updateWorkOrderStatus } = useAppData();
  const { showToast } = useToast();

  const [resolution, setResolution] = useState(workOrder?.resolutionDescription || '');
  const [partsReplaced, setPartsReplaced] = useState(workOrder?.partsReplaced || '');
  const [labourCost, setLabourCost] = useState(workOrder?.labourCost !== undefined ? String(workOrder.labourCost) : '1200');
  const [partsCost, setPartsCost] = useState(workOrder?.partsCost !== undefined ? String(workOrder.partsCost) : '850');
  const [otherCharges, setOtherCharges] = useState(workOrder?.otherCharges !== undefined ? String(workOrder.otherCharges) : '150');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !workOrder) return null;

  const labourNum = Number(labourCost) || 0;
  const partsNum = Number(partsCost) || 0;
  const otherNum = Number(otherCharges) || 0;
  const calculatedTotal = labourNum + partsNum + otherNum;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!resolution.trim() || resolution.trim().length < 8) {
      setError('Please provide a meaningful resolution description (at least 8 characters) detailing repairs or adjustments made.');
      return;
    }

    setIsSubmitting(true);
    try {
      updateWorkOrderStatus(workOrder.id, 'COMPLETED', {
        resolutionDescription: resolution.trim(),
        note: `Resolution: ${resolution.trim().substring(0, 80)}...`,
        partsReplaced: partsReplaced.trim() || 'Standard service consumables',
        labourCost: labourNum,
        partsCost: partsNum,
        otherCharges: otherNum,
        totalCost: calculatedTotal
      });
      showToast(`Work Order ${workOrder.workOrderId} marked as COMPLETED. Sent to management for verification.`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to complete work order.', 'error');
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
            <div className="p-2 rounded-xl bg-status-success/10 border border-status-success/30 text-status-success">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary font-display">Complete Work Order</h2>
              <p className="text-xs text-text-secondary">
                Submit resolution & service billing details for <span className="font-mono text-accent-primary font-bold">{workOrder.workOrderId}</span>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
            <div className="text-text-secondary">
              <strong>Task:</strong> {workOrder.title}
            </div>
            <div className="text-text-muted text-[11px] mt-1 font-mono">
              Due Date: {workOrder.dueDate} • Priority: {workOrder.priority}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Resolution Description <span className="text-status-critical">*</span>
            </label>
            <textarea
              rows={3}
              value={resolution}
              onChange={(e) => {
                setResolution(e.target.value);
                if (error) setError('');
              }}
              placeholder="Detail the root cause diagnosis, components replaced, recalibrations completed, and operational test measurements..."
              className={`w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-status-success transition-colors ${
                error ? 'border-status-critical' : 'border-industrial-border'
              }`}
            />
            {error ? (
              <p className="mt-1 text-xs text-status-critical flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            ) : (
              <p className="text-[11px] text-text-muted mt-1">
                This description is mandatory and will be reviewed by Facility Managers during formal verification.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Parts & Consumables Used
            </label>
            <input
              type="text"
              value={partsReplaced}
              onChange={(e) => setPartsReplaced(e.target.value)}
              placeholder="e.g. Laser diode assembly, 1x cooling fan, R32 refrigerant"
              className="w-full px-3.5 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>

          {/* Itemized Cost Estimates */}
          <div className="p-3.5 rounded-xl bg-bg-surface/50 border border-industrial-border space-y-2.5">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-accent-primary block">
              Itemized Service Expenditure (INR ₹)
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
                  className="w-full px-2.5 py-1.5 rounded-lg bg-bg-elevated border border-industrial-border text-xs font-mono text-text-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-text-muted mb-0.5">Spare Parts</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={partsCost}
                  onChange={(e) => setPartsCost(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-bg-elevated border border-industrial-border text-xs font-mono text-text-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-text-muted mb-0.5">Incidental</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-bg-elevated border border-industrial-border text-xs font-mono text-text-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-industrial-border flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-text-muted">Total Claim:</span>
              <span className="text-sm font-bold font-mono text-accent-primary">
                {formatRupee(calculatedTotal)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-industrial-border">
            <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Submit Resolution'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
