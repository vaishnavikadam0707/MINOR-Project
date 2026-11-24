import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Wrench,
  User,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MapPin,
  Building,
  Layers,
  ArrowRight,
  ExternalLink,
  Edit3,
  Ban,
  CalendarClock
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import Modal from '../../components/modals/Modal';
import TextInput from '../../components/forms/TextInput';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasPermission } from '../../utils/permissions';
import {
  formatDateDisplay,
  getEffectiveScheduleStatus,
  getTodayISO
} from '../../utils/dateHelpers';

export default function ScheduleDetailsDrawer({
  isOpen,
  onClose,
  schedule,
  onEdit
}) {
  const navigate = useNavigate();
  const {
    assets,
    users,
    workOrders,
    completeSchedule,
    cancelSchedule,
    rescheduleSchedule,
    createWorkOrderFromSchedule
  } = useAppData();
  const { role, currentUser } = useAuth();
  const { showToast } = useToast();

  // Dialog states
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  if (!schedule) return null;

  // Lookups
  const asset = assets.find(
    (a) => a.id === schedule.assetId || a.assetId === schedule.assetId
  );
  const technician = users.find((u) => u.id === schedule.assignedTechnicianId);
  const linkedWo = workOrders.find(
    (w) => w.workOrderId === schedule.linkedWorkOrderId || w.id === schedule.linkedWorkOrderId || w.linkedScheduleId === schedule.id
  );
  const effectiveStatus = getEffectiveScheduleStatus(schedule);

  // Permissions
  const canComplete = hasPermission(role, 'CAN_COMPLETE_SCHEDULE');
  const canEdit = hasPermission(role, 'CAN_EDIT_SCHEDULE');
  const canCancel = hasPermission(role, 'CAN_CANCEL_SCHEDULE');
  const canReschedule = hasPermission(role, 'CAN_RESCHEDULE');
  const canCreateWO = hasPermission(role, 'CAN_CREATE_WO_FROM_SCHEDULE');

  // Handle Complete
  const handleConfirmComplete = () => {
    const res = completeSchedule(schedule.id, completionNotes);
    showToast({
      type: 'success',
      title: 'Maintenance Completed',
      message: res.nextSchedule
        ? `Marked completed. Next cycle scheduled for ${formatDateDisplay(res.nextSchedule.dueDate)}.`
        : `Schedule marked completed successfully.`
    });
    setCompleteDialogOpen(false);
    setCompletionNotes('');
    onClose();
  };

  // Handle Cancel
  const handleConfirmCancel = () => {
    cancelSchedule(schedule.id, cancelReason);
    showToast({
      type: 'info',
      title: 'Schedule Cancelled',
      message: `Schedule marked as cancelled.`
    });
    setCancelDialogOpen(false);
    setCancelReason('');
    onClose();
  };

  // Handle Reschedule
  const handleConfirmReschedule = (e) => {
    e.preventDefault();
    if (!newDueDate) {
      showToast({
        type: 'error',
        title: 'Date Required',
        message: 'Please choose a new scheduled due date.'
      });
      return;
    }
    rescheduleSchedule(schedule.id, newDueDate, rescheduleReason);
    showToast({
      type: 'success',
      title: 'Maintenance Rescheduled',
      message: `New due date set to ${formatDateDisplay(newDueDate)}.`
    });
    setRescheduleModalOpen(false);
    setNewDueDate('');
    setRescheduleReason('');
    onClose();
  };

  // Handle Create Work Order
  const handleCreateWorkOrder = () => {
    if (schedule.linkedWorkOrderId) {
      showToast({
        type: 'info',
        title: 'Already Linked',
        message: `Work Order ${schedule.linkedWorkOrderId} is already connected to this schedule.`
      });
      return;
    }
    const created = createWorkOrderFromSchedule(schedule.id);
    if (created) {
      showToast({
        type: 'success',
        title: 'Work Order Generated',
        message: `Ticket ${created.workOrderId} created and assigned.`
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Right-Side Drawer */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-screen max-w-md bg-bg-card border-l border-industrial-borderHover shadow-2xl flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-5 border-b border-industrial-border bg-bg-secondary/70 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold text-accent-primary">
                      {schedule.id.toUpperCase()}
                    </span>
                    <Badge status={effectiveStatus} size="xs" />
                  </div>
                  <h2 className="text-lg font-bold font-display text-text-primary leading-tight">
                    {schedule.title}
                  </h2>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs font-mono">
                {/* Asset Card Preview */}
                <div className="p-4 rounded-2xl bg-bg-elevated border border-industrial-border space-y-2">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                    Target Hardware
                  </span>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-bg-card border border-industrial-border overflow-hidden shrink-0 flex items-center justify-center">
                      {asset?.image ? (
                        <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
                      ) : (
                        <Layers className="w-5 h-5 text-accent-primary" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-text-primary text-sm font-display truncate">
                        {asset?.name || schedule.assetId}
                      </p>
                      <span className="text-accent-primary text-xs block">
                        {asset?.assetId || schedule.assetId}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-industrial-border text-text-muted space-y-1">
                    <p className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{asset?.location || 'Campus Location'}</span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <Building className="w-3.5 h-3.5 shrink-0" />
                      <span>{asset?.department || 'Department'}</span>
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-bg-elevated border border-industrial-border">
                    <span className="text-[10px] text-text-muted uppercase block">Due Date</span>
                    <span className="font-bold text-text-primary text-sm mt-0.5 block">
                      {formatDateDisplay(schedule.dueDate)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-bg-elevated border border-industrial-border">
                    <span className="text-[10px] text-text-muted uppercase block">Service Priority</span>
                    <div className="mt-1">
                      <Badge status={(schedule.priority || 'Medium').toUpperCase()} size="xs" />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-bg-elevated border border-industrial-border">
                    <span className="text-[10px] text-text-muted uppercase block">Maintenance Type</span>
                    <span className="font-semibold text-text-secondary text-xs mt-1 block">
                      {schedule.maintenanceType}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-bg-elevated border border-industrial-border">
                    <span className="text-[10px] text-text-muted uppercase block">Recurrence Series</span>
                    <span className="font-semibold text-accent-primary text-xs mt-1 block">
                      {schedule.recurrence}
                    </span>
                  </div>
                </div>

                {/* Assigned Technician */}
                <div className="p-4 rounded-xl bg-bg-elevated border border-industrial-border">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-2">
                    Assigned Technician
                  </span>

                  {technician ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent-primary/15 text-accent-primary font-bold flex items-center justify-center">
                        {technician.avatarInitials}
                      </div>
                      <div>
                        <p className="font-bold text-text-primary text-xs font-sans">
                          {technician.name}
                        </p>
                        <span className="text-text-muted text-[11px]">
                          {technician.department} • {technician.email}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-text-muted">No technician assigned yet.</span>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                    Maintenance Procedure & Checklist
                  </span>
                  <p className="text-xs text-text-secondary leading-relaxed bg-bg-elevated p-3.5 rounded-xl border border-industrial-border font-sans">
                    {schedule.description || 'No detailed instructions provided.'}
                  </p>
                </div>

                {/* Operational Notes */}
                {schedule.notes && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                      Special Operational Notes
                    </span>
                    <p className="text-xs text-accent-primary/80 bg-accent-primary/5 p-3 rounded-xl border border-accent-primary/20">
                      ℹ️ {schedule.notes}
                    </p>
                  </div>
                )}

                {/* Linked Work Order */}
                {(schedule.linkedWorkOrderId || linkedWo) && (
                  <div className="p-3.5 rounded-xl bg-status-info/10 border border-status-info/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-status-info uppercase font-bold block">
                        Linked Dispatch Work Order
                      </span>
                      <span className="text-xs font-bold text-text-primary">
                        {linkedWo?.workOrderId || schedule.linkedWorkOrderId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge status={linkedWo?.status || 'IN_PROGRESS'} size="xs" />
                      {linkedWo && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            navigate(`/app/work-orders/${linkedWo.id}`);
                          }}
                          className="p-1 rounded text-text-muted hover:text-accent-primary hover:bg-white/[0.08] transition-colors"
                          title="Open Work Order Details"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-5 border-t border-industrial-border bg-bg-secondary/70 space-y-2">
                {/* Primary Action: Mark Completed */}
                {canComplete && effectiveStatus !== 'COMPLETED' && effectiveStatus !== 'CANCELLED' && (
                  <Button
                    variant="primary"
                    size="md"
                    icon={CheckCircle2}
                    onClick={() => setCompleteDialogOpen(true)}
                    className="w-full justify-center shadow-glow-sm"
                  >
                    Mark Service Completed
                  </Button>
                )}

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {canEdit && effectiveStatus !== 'COMPLETED' && effectiveStatus !== 'CANCELLED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Edit3}
                      onClick={() => {
                        onClose();
                        onEdit(schedule);
                      }}
                      className="justify-center"
                    >
                      Edit
                    </Button>
                  )}

                  {canReschedule && effectiveStatus !== 'COMPLETED' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={CalendarClock}
                      onClick={() => {
                        setNewDueDate(schedule.dueDate);
                        setRescheduleModalOpen(true);
                      }}
                      className="justify-center"
                    >
                      Reschedule
                    </Button>
                  )}

                  {canCreateWO && !schedule.linkedWorkOrderId && effectiveStatus !== 'COMPLETED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Wrench}
                      onClick={handleCreateWorkOrder}
                      className="justify-center"
                    >
                      Dispatch WO
                    </Button>
                  )}

                  {canCancel && effectiveStatus !== 'COMPLETED' && effectiveStatus !== 'CANCELLED' && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Ban}
                      onClick={() => setCancelDialogOpen(true)}
                      className="justify-center"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* COMPLETE CONFIRMATION DIALOG */}
          <Modal
            isOpen={completeDialogOpen}
            onClose={() => setCompleteDialogOpen(false)}
            title="Complete Maintenance Task"
            subtitle="Record execution of preventive maintenance and trigger next recurrence"
            maxWidth="max-w-md"
          >
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-status-success/10 border border-status-success/30 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" />
                <div className="text-xs font-mono text-text-secondary">
                  <strong className="text-text-primary block font-sans">
                    {schedule.title}
                  </strong>
                  Recurrence: {schedule.recurrence}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5 font-mono">
                  Technician Execution Notes
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g. Filters cleaned with pressure washer, refrigerant gas topped to 125 PSI, tested at 18°C..."
                  rows={3}
                  className="w-full bg-bg-elevated text-text-primary text-xs rounded-xl border border-industrial-border p-3 focus:outline-none focus:border-accent-primary"
                />
              </div>

              {schedule.recurrence !== 'One Time' && (
                <p className="text-[11px] font-mono text-accent-primary/90 bg-accent-primary/10 p-2.5 rounded-xl border border-accent-primary/25">
                  ✓ Recurring Series: The next {schedule.recurrence.toLowerCase()} occurrence will be automatically generated and scheduled.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-industrial-border">
                <Button variant="outline" size="sm" onClick={() => setCompleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleConfirmComplete}>
                  Confirm Completion
                </Button>
              </div>
            </div>
          </Modal>

          {/* CANCEL CONFIRMATION DIALOG */}
          <Modal
            isOpen={cancelDialogOpen}
            onClose={() => setCancelDialogOpen(false)}
            title="Cancel Maintenance Schedule"
            subtitle="Mark this schedule as cancelled without generating next cycle"
            maxWidth="max-w-md"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5 font-mono">
                  Cancellation Reason
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Asset decommissioned, duplicate schedule, vendor contract ended..."
                  rows={3}
                  className="w-full bg-bg-elevated text-text-primary text-xs rounded-xl border border-industrial-border p-3 focus:outline-none focus:border-status-critical"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-industrial-border">
                <Button variant="outline" size="sm" onClick={() => setCancelDialogOpen(false)}>
                  Back
                </Button>
                <Button variant="danger" size="sm" onClick={handleConfirmCancel}>
                  Cancel Schedule
                </Button>
              </div>
            </div>
          </Modal>

          {/* RESCHEDULE MODAL */}
          <Modal
            isOpen={rescheduleModalOpen}
            onClose={() => setRescheduleModalOpen(false)}
            title="Reschedule Maintenance"
            subtitle="Change scheduled execution date"
            maxWidth="max-w-md"
          >
            <form onSubmit={handleConfirmReschedule} className="space-y-4">
              <TextInput
                label="New Due Date"
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                required
              />

              <TextInput
                label="Reschedule Justification (Optional)"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="e.g. Postponed due to college sports week"
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-industrial-border">
                <Button variant="outline" size="sm" onClick={() => setRescheduleModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save New Date
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </AnimatePresence>
  );
}
