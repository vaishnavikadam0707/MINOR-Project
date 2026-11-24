import React, { useState } from 'react';
import { X, Archive, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Button from '../../../components/common/Button';
import { useAppData } from '../../../context/AppDataContext';
import { useToast } from '../../../context/ToastContext';

export default function CloseWorkOrderModal({ isOpen, onClose, workOrder }) {
  const { closeWorkOrder } = useAppData();
  const { showToast } = useToast();

  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !workOrder) return null;

  const handleClose = () => {
    setIsSubmitting(true);
    try {
      closeWorkOrder(workOrder.id, note.trim() || 'Work order archived and closed after verification');
      showToast(`Work Order ${workOrder.workOrderId} has been closed and archived into service records.`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to close work order.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-bg-card border border-industrial-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-industrial-border bg-bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/[0.08] border border-white/20 text-text-primary">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary font-display">Close & Archive Work Order</h2>
              <p className="text-xs text-text-secondary">
                Archive ticket <span className="font-mono text-accent-primary font-bold">{workOrder.workOrderId}</span>
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

        {/* Warning Banner */}
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex items-start gap-3 text-xs text-text-secondary">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-400 block mb-0.5">Permanent Historical Archive</span>
            Once closed, this work order becomes an immutable historical log. Normal status controls and editing will be permanently disabled, and all timestamps will be preserved in the asset audit log.
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
            <div className="text-text-primary font-medium">{workOrder.title}</div>
            <div className="text-text-muted text-[11px] mt-1 font-mono">
              Status: VERIFIED • Created: {workOrder.createdAt} • Due: {workOrder.dueDate}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Closure Summary / Archival Note (Optional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Asset restored to fully operational condition. All invoices and diagnostic checklists attached."
              className="w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border border-industrial-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-industrial-border bg-bg-surface/50">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleClose} disabled={isSubmitting}>
            {isSubmitting ? 'Archiving...' : 'Confirm Closure'}
          </Button>
        </div>
      </div>
    </div>
  );
}
