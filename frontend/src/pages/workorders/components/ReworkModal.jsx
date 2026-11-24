import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle, AlertCircle } from 'lucide-react';
import Button from '../../../components/common/Button';
import { useAppData } from '../../../context/AppDataContext';
import { useToast } from '../../../context/ToastContext';

export default function ReworkModal({ isOpen, onClose, workOrder }) {
  const { reopenForRework } = useAppData();
  const { showToast } = useToast();

  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !workOrder) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 8) {
      setError('Please provide a specific rework reason (at least 8 characters) explaining what requires further repair.');
      return;
    }

    setIsSubmitting(true);
    try {
      reopenForRework(workOrder.id, reason.trim());
      showToast(`Work Order ${workOrder.workOrderId} reopened for rework and returned to IN_PROGRESS.`, 'info');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to reopen work order for rework.', 'error');
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
            <div className="p-2 rounded-xl bg-status-critical/10 border border-status-critical/30 text-status-critical">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary font-display">Reopen for Rework</h2>
              <p className="text-xs text-text-secondary">
                Reject resolution and request re-servicing for <span className="font-mono text-accent-primary font-bold">{workOrder.workOrderId}</span>
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
        <div className="p-4 bg-status-critical/10 border-b border-status-critical/20 flex items-start gap-3 text-xs text-text-secondary">
          <AlertTriangle className="w-4 h-4 text-status-critical shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-status-critical block mb-0.5">Manager Quality Control Action</span>
            This action moves the ticket from <strong>COMPLETED</strong> back to <strong>IN_PROGRESS</strong>. The assigned technician will be notified to perform additional adjustments.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Reason for Reopening <span className="text-status-critical">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="State why the previous repair was unsatisfactory (e.g., equipment still tripping circuit breaker under high load, vibration persists above 2.5mm/s)..."
              className={`w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-status-critical transition-colors ${
                error ? 'border-status-critical' : 'border-industrial-border'
              }`}
            />
            {error ? (
              <p className="mt-1 text-xs text-status-critical flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            ) : (
              <p className="text-[11px] text-text-muted mt-1">
                This explanation will be logged into the permanent activity audit history.
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-industrial-border">
            <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Confirm Reopen for Rework'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
