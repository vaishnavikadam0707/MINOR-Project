import React, { useState, useEffect } from 'react';
import Modal from '../../components/modals/Modal';
import TextInput from '../../components/forms/TextInput';
import SelectInput from '../../components/forms/SelectInput';
import Button from '../../components/common/Button';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasPermission } from '../../utils/permissions';
import { getTodayISO, formatDateToISO } from '../../utils/dateHelpers';
import { Calendar, Wrench, User, AlertCircle, Clock } from 'lucide-react';

const MAINTENANCE_TYPES = [
  'Preventive Maintenance',
  'Inspection',
  'Cleaning',
  'Repair',
  'Replacement'
];

const PRIORITIES = [
  { value: 'Low', label: 'Low - Standard Routine' },
  { value: 'Medium', label: 'Medium - Operational Importance' },
  { value: 'High', label: 'High - Lab Critical Equipment' },
  { value: 'Critical', label: 'Critical - Zero Downtime Safety' }
];

const RECURRENCES = [
  { value: 'One Time', label: 'One Time (Single Occurrence)' },
  { value: 'Weekly', label: 'Weekly (Every 7 Days)' },
  { value: 'Monthly', label: 'Monthly (Every Month)' },
  { value: 'Quarterly', label: 'Quarterly (Every 3 Months)' },
  { value: 'Half Yearly', label: 'Half Yearly (Every 6 Months)' },
  { value: 'Yearly', label: 'Yearly (Annual Inspection)' }
];

export default function ScheduleFormModal({
  isOpen,
  onClose,
  scheduleToEdit = null,
  initialDate = null,
  initialAssetId = null,
  onSaved = null
}) {
  const { assets, users, addSchedule, updateSchedule } = useAppData();
  const { role, currentUser } = useAuth();
  const { showToast } = useToast();

  const isEditing = Boolean(scheduleToEdit);

  // Form Fields
  const [formData, setFormData] = useState({
    assetId: '',
    title: '',
    description: '',
    maintenanceType: 'Preventive Maintenance',
    dueDate: getTodayISO(),
    priority: 'Medium',
    assignedTechnicianId: '',
    recurrence: 'Quarterly',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available technicians
  const technicians = users.filter((u) => u.role === 'TECHNICIAN' && u.active);
  const technicianOptions = [
    { value: '', label: 'Unassigned (Assign Later)' },
    ...technicians.map((t) => ({ value: t.id, label: `${t.name} (${t.department})` }))
  ];

  // Asset options
  const assetOptions = assets.map((a) => ({
    value: a.id,
    label: `${a.assetId} - ${a.name} (${a.location})`
  }));

  // Populate or pre-fill form
  useEffect(() => {
    if (scheduleToEdit) {
      setFormData({
        assetId: scheduleToEdit.assetId || '',
        title: scheduleToEdit.title || '',
        description: scheduleToEdit.description || '',
        maintenanceType: scheduleToEdit.maintenanceType || 'Preventive Maintenance',
        dueDate: scheduleToEdit.dueDate || getTodayISO(),
        priority: scheduleToEdit.priority || 'Medium',
        assignedTechnicianId: scheduleToEdit.assignedTechnicianId || '',
        recurrence: scheduleToEdit.recurrence || 'Quarterly',
        notes: scheduleToEdit.notes || ''
      });
    } else {
      setFormData({
        assetId: initialAssetId || (assets[0]?.id || ''),
        title: '',
        description: '',
        maintenanceType: 'Preventive Maintenance',
        dueDate: initialDate || getTodayISO(),
        priority: 'Medium',
        assignedTechnicianId: technicians[0]?.id || '',
        recurrence: 'Quarterly',
        notes: ''
      });
    }
    setErrors({});
  }, [scheduleToEdit, initialDate, initialAssetId, isOpen, assets, technicians]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};

    if (!formData.assetId) {
      errs.assetId = 'Please select a registered campus asset.';
    }

    if (!formData.title.trim()) {
      errs.title = 'Maintenance title is required.';
    } else if (formData.title.length > 100) {
      errs.title = 'Title cannot exceed 100 characters.';
    }

    if (!formData.dueDate) {
      errs.dueDate = 'Due date is required.';
    }

    if (!formData.priority) {
      errs.priority = 'Priority is required.';
    }

    if (!formData.recurrence) {
      errs.recurrence = 'Recurrence cadence is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check permissions
    const permitted = isEditing
      ? hasPermission(role, 'CAN_EDIT_SCHEDULE')
      : hasPermission(role, 'CAN_CREATE_SCHEDULE');

    if (!permitted) {
      showToast({
        type: 'error',
        title: 'Action Denied',
        message: 'Your role does not have authorization to modify maintenance schedules.'
      });
      return;
    }

    if (!validate()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please resolve form errors before saving.'
      });
      return;
    }

    setIsSubmitting(true);

    if (isEditing) {
      updateSchedule(scheduleToEdit.id, formData);
      showToast({
        type: 'success',
        title: 'Schedule Updated',
        message: `Maintenance schedule "${formData.title}" updated.`
      });
    } else {
      addSchedule(formData);
      showToast({
        type: 'success',
        title: 'Schedule Created',
        message: `New ${formData.recurrence.toLowerCase()} schedule added to maintenance calendar.`
      });
    }

    setIsSubmitting(false);
    if (onSaved) onSaved();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Maintenance: ${scheduleToEdit?.id?.toUpperCase()}` : 'Schedule Preventive Maintenance'}
      subtitle="Configure periodic inspection, filter wash or diagnostic testing for campus hardware"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Asset Selection */}
        <SelectInput
          label="Target Campus Asset"
          name="assetId"
          value={formData.assetId}
          onChange={handleChange}
          options={assetOptions}
          placeholder="Select asset from inventory..."
          error={errors.assetId}
          required
        />

        {/* Title */}
        <TextInput
          label="Maintenance Activity Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. Laser Projector Optical Alignment & Lens Wipe"
          error={errors.title}
          helperText={`${formData.title.length}/100 characters`}
          required
        />

        {/* Type & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectInput
            label="Maintenance Type"
            name="maintenanceType"
            value={formData.maintenanceType}
            onChange={handleChange}
            options={MAINTENANCE_TYPES}
            required
          />

          <SelectInput
            label="Service Priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            options={PRIORITIES}
            required
          />
        </div>

        {/* Due Date & Recurrence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextInput
            label="Scheduled Due Date"
            name="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={handleChange}
            error={errors.dueDate}
            required
          />

          <SelectInput
            label="Recurrence Interval"
            name="recurrence"
            value={formData.recurrence}
            onChange={handleChange}
            options={RECURRENCES}
            required
          />
        </div>

        {/* Technician Assignment */}
        <SelectInput
          label="Assigned Maintenance Technician"
          name="assignedTechnicianId"
          value={formData.assignedTechnicianId}
          onChange={handleChange}
          options={technicianOptions}
        />

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
            Maintenance Checklist & Work Scope
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Detailed procedure: chemical coil wash, bearing lubrication, firmware patch..."
            className="w-full bg-bg-elevated text-text-primary text-sm rounded-xl border border-industrial-border p-3 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30"
          />
        </div>

        {/* Operational Notes */}
        <TextInput
          label="Operational Notes (Optional)"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="e.g. Schedule after 4:30 PM when classes conclude"
        />

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-industrial-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            {isEditing ? 'Save Changes' : 'Schedule Maintenance'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
