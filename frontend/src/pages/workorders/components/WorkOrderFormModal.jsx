import React, { useState, useEffect } from 'react';
import { X, Wrench, AlertCircle, Calendar, UserCheck, Layers, AlertTriangle } from 'lucide-react';
import Button from '../../../components/common/Button';
import { useAppData } from '../../../context/AppDataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { ROLES } from '../../../utils/permissions';
import { getTodayISO } from '../../../utils/dateHelpers';

export default function WorkOrderFormModal({ isOpen, onClose, initialData = null, defaultAssetId = null }) {
  const { assets, users, schedules, createWorkOrder } = useAppData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const isStaff = currentUser?.role === ROLES.STAFF;
  const isManagerOrAdmin = currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.MANAGER;

  // Technicians list
  const technicians = users.filter((u) => u.role === ROLES.TECHNICIAN && u.active);

  // Available schedules that don't already have an active linked work order
  const availableSchedules = schedules.filter((s) => s.status !== 'COMPLETED' && s.status !== 'CANCELLED');

  const [formData, setFormData] = useState({
    assetId: defaultAssetId || '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: getTodayISO(),
    assignedTechnicianId: '',
    linkedScheduleId: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          assetId: initialData.assetId || '',
          title: initialData.title || '',
          description: initialData.description || '',
          priority: initialData.priority || 'MEDIUM',
          dueDate: initialData.dueDate || getTodayISO(),
          assignedTechnicianId: initialData.assignedTechnicianId || '',
          linkedScheduleId: initialData.linkedScheduleId || initialData.maintenanceScheduleId || ''
        });
      } else {
        setFormData({
          assetId: defaultAssetId || (assets.length > 0 ? assets[0].id : ''),
          title: '',
          description: '',
          priority: 'MEDIUM',
          dueDate: getTodayISO(),
          assignedTechnicianId: '',
          linkedScheduleId: ''
        });
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, initialData, defaultAssetId, assets]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // If user selected a schedule, auto-fill asset and title if empty
      if (field === 'linkedScheduleId' && value) {
        const sched = schedules.find((s) => s.id === value);
        if (sched) {
          if (!prev.title) updated.title = `[Maint] ${sched.title}`;
          if (!prev.description) updated.description = sched.description || '';
          if (sched.assetId) updated.assetId = sched.assetId;
          if (sched.dueDate) updated.dueDate = sched.dueDate;
          if (sched.priority) updated.priority = sched.priority.toUpperCase();
          if (sched.assignedTechnicianId && isManagerOrAdmin) {
            updated.assignedTechnicianId = sched.assignedTechnicianId;
          }
        }
      }
      return updated;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.assetId) errs.assetId = 'Please select a campus asset.';
    if (!formData.title?.trim()) errs.title = 'Issue title is required.';
    if (!formData.description?.trim()) errs.description = 'Please describe the fault or maintenance task.';
    if (!formData.priority) errs.priority = 'Priority level is required.';
    if (!formData.dueDate) errs.dueDate = 'Due date is required.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) {
      showToast('Please fix the errors in the form before submitting.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        assetId: formData.assetId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        dueDate: formData.dueDate,
        createdByUserId: currentUser?.id,
        assignedTechnicianId: isManagerOrAdmin && formData.assignedTechnicianId ? formData.assignedTechnicianId : null,
        linkedScheduleId: formData.linkedScheduleId || null
      };

      const created = createWorkOrder(payload);
      showToast(
        `Work Order ${created.workOrderId} created successfully${payload.assignedTechnicianId ? ' and assigned' : ''}.`,
        'success'
      );
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to create work order. Please check inputs.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-bg-card border border-industrial-border rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-industrial-border bg-bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent-primary/10 border border-accent-primary/30 text-accent-primary">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary font-display">
                {isStaff ? 'Report Maintenance Issue' : 'Create Work Order'}
              </h2>
              <p className="text-xs text-text-secondary">
                {isStaff
                  ? 'Submit an equipment fault ticket for facility technician review'
                  : 'Dispatch a new task to campus maintenance personnel'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Target Asset */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Target Asset <span className="text-status-critical">*</span>
            </label>
            <select
              value={formData.assetId}
              onChange={(e) => handleChange('assetId', e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border text-sm text-text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-accent-primary ${
                errors.assetId ? 'border-status-critical' : 'border-industrial-border'
              }`}
            >
              <option value="" disabled>
                -- Select Campus Asset --
              </option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.assetId}) - {asset.location}
                </option>
              ))}
            </select>
            {errors.assetId && (
              <p className="mt-1 text-xs text-status-critical flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.assetId}
              </p>
            )}
          </div>

          {/* Issue Title */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Issue Title <span className="text-status-critical">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Unusual motor grinding noise in Lab 204"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-1 focus:ring-accent-primary ${
                errors.title ? 'border-status-critical' : 'border-industrial-border'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-status-critical flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.title}
              </p>
            )}
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Priority Level <span className="text-status-critical">*</span>
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border border-industrial-border text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              >
                <option value="LOW">Low (Routine Checkup / Minor)</option>
                <option value="MEDIUM">Medium (Degraded Performance)</option>
                <option value="HIGH">High (Equipment Inoperable)</option>
                <option value="CRITICAL">Critical (Safety Hazard / Facility Impact)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Target Due Date <span className="text-status-critical">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary ${
                    errors.dueDate ? 'border-status-critical' : 'border-industrial-border'
                  }`}
                />
              </div>
              {errors.dueDate && (
                <p className="mt-1 text-xs text-status-critical flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.dueDate}
                </p>
              )}
            </div>
          </div>

          {/* Technician Assignment (Admin/Manager only) */}
          {isManagerOrAdmin && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Assign Field Technician (Optional)
              </label>
              <select
                value={formData.assignedTechnicianId}
                onChange={(e) => handleChange('assignedTechnicianId', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border border-industrial-border text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              >
                <option value="">-- Leave Unassigned (Status: CREATED) --</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} ({tech.department || 'Field Technician'})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-text-muted mt-1">
                Selecting a technician now will initialize this work order in the <strong>ASSIGNED</strong> state.
              </p>
            </div>
          )}

          {/* Link to Scheduled Maintenance (Optional) */}
          {isManagerOrAdmin && availableSchedules.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Link to Preventive Schedule (Optional)
              </label>
              <select
                value={formData.linkedScheduleId}
                onChange={(e) => handleChange('linkedScheduleId', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border border-industrial-border text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              >
                <option value="">-- Not Linked to Preventive Schedule --</option>
                {availableSchedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} (Due: {s.dueDate}) [{s.priority}]
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-text-muted mt-1">
                When this work order is later verified, the linked schedule will automatically be completed and its next recurrence scheduled.
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Fault Description & Observations <span className="text-status-critical">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Describe symptoms, error codes, fault frequency or specific instructions for technicians..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-1 focus:ring-accent-primary ${
                errors.description ? 'border-status-critical' : 'border-industrial-border'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-status-critical flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.description}
              </p>
            )}
          </div>

          {/* Creator Attribution */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-text-secondary flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-accent-primary" />
              Creator: <span className="font-semibold text-text-primary">{currentUser?.name || 'Authorized User'}</span>
            </span>
            <span className="font-mono text-[11px] text-text-muted">{currentUser?.role}</span>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-industrial-border">
            <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : isStaff ? 'Submit Issue Ticket' : 'Dispatch Work Order'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
