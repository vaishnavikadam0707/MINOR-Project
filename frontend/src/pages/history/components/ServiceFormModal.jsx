import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  AlertCircle,
  Calendar,
  Layers,
  Wrench,
  DollarSign,
  User,
  CheckCircle2,
  FileText,
  ShieldCheck
} from 'lucide-react';
import Button from '../../../components/common/Button';
import { useAppData } from '../../../context/AppDataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { getTodayISO } from '../../../utils/dateHelpers';
import { formatRupee } from '../../../utils/formatters';

export default function ServiceFormModal({ isOpen, onClose, initialData = null, defaultAssetId = null }) {
  const { assets, users, workOrders, addServiceRecord, updateServiceRecord, addRepairCost } = useAppData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    assetId: '',
    workOrderId: '',
    technicianId: '',
    serviceDate: getTodayISO(),
    serviceType: 'Preventive Maintenance',
    serviceStatus: 'COMPLETED',
    problemIdentified: '',
    serviceDescription: '',
    workPerformed: '',
    partsReplaced: '',
    labourCost: '0',
    partsCost: '0',
    otherCharges: '0',
    finalRemarks: '',
    managerRemarks: '',
    createRepairCost: true,
    paymentStatus: 'PAID',
    invoiceNumber: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          assetId: initialData.assetId || '',
          workOrderId: initialData.workOrderId || '',
          technicianId: initialData.technicianId || currentUser?.id || '',
          serviceDate: initialData.serviceDate || getTodayISO(),
          serviceType: initialData.serviceType || 'Preventive Maintenance',
          serviceStatus: initialData.serviceStatus || 'COMPLETED',
          problemIdentified: initialData.problemIdentified || '',
          serviceDescription: initialData.serviceDescription || '',
          workPerformed: initialData.workPerformed || initialData.actionTaken || '',
          partsReplaced: initialData.partsReplaced || '',
          labourCost: initialData.labourCost !== undefined ? String(initialData.labourCost) : '0',
          partsCost: initialData.partsCost !== undefined ? String(initialData.partsCost) : '0',
          otherCharges: initialData.otherCharges !== undefined ? String(initialData.otherCharges) : '0',
          finalRemarks: initialData.finalRemarks || '',
          managerRemarks: initialData.managerRemarks || '',
          createRepairCost: false,
          paymentStatus: 'PAID',
          invoiceNumber: ''
        });
      } else {
        const fallbackAssetId = defaultAssetId || (assets.length > 0 ? assets[0].id : '');
        const defaultTechId = currentUser?.role === 'TECHNICIAN'
          ? currentUser.id
          : users.find((u) => u.role === 'TECHNICIAN')?.id || currentUser?.id || '';

        setFormData({
          assetId: fallbackAssetId,
          workOrderId: '',
          technicianId: defaultTechId,
          serviceDate: getTodayISO(),
          serviceType: 'Preventive Maintenance',
          serviceStatus: 'COMPLETED',
          problemIdentified: '',
          serviceDescription: '',
          workPerformed: '',
          partsReplaced: '',
          labourCost: '1200',
          partsCost: '0',
          otherCharges: '150',
          finalRemarks: 'Physical calibration tested and within nominal thresholds.',
          managerRemarks: '',
          createRepairCost: true,
          paymentStatus: 'PAID',
          invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`
        });
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, initialData, defaultAssetId, assets, users, currentUser]);

  if (!isOpen) return null;

  // Live total computation
  const labourNum = Number(formData.labourCost) || 0;
  const partsNum = Number(formData.partsCost) || 0;
  const otherNum = Number(formData.otherCharges) || 0;
  const calculatedTotal = labourNum + partsNum + otherNum;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.assetId) errs.assetId = 'Target asset is required.';
    if (!formData.serviceDate) errs.serviceDate = 'Service date is required.';
    if (!formData.problemIdentified?.trim()) errs.problemIdentified = 'Diagnostic observation / problem description is required.';
    if (!formData.workPerformed?.trim()) errs.workPerformed = 'Work conducted & actions taken description is required.';

    if (labourNum < 0) errs.labourCost = 'Labour cost cannot be negative.';
    if (partsNum < 0) errs.partsCost = 'Parts cost cannot be negative.';
    if (otherNum < 0) errs.otherCharges = 'Other charges cannot be negative.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) {
      showToast('Please correct the validation errors in the form.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        assetId: formData.assetId,
        workOrderId: formData.workOrderId || null,
        technicianId: formData.technicianId || currentUser?.id || 'usr-tech-03',
        serviceDate: formData.serviceDate,
        serviceType: formData.serviceType,
        serviceStatus: formData.serviceStatus,
        problemIdentified: formData.problemIdentified.trim(),
        serviceDescription: formData.serviceDescription.trim() || formData.problemIdentified.trim(),
        workPerformed: formData.workPerformed.trim(),
        actionTaken: formData.workPerformed.trim(),
        partsReplaced: formData.partsReplaced.trim() || 'None',
        labourCost: labourNum,
        partsCost: partsNum,
        otherCharges: otherNum,
        totalCost: calculatedTotal,
        finalRemarks: formData.finalRemarks.trim(),
        managerRemarks: formData.managerRemarks.trim()
      };

      if (isEditing) {
        updateServiceRecord(initialData.id, payload);
        showToast(`Service log ${initialData.serviceId || initialData.id} updated successfully.`, 'success');
      } else {
        const createdService = addServiceRecord(payload);

        // Optionally create matching repair cost ledger entry
        if (formData.createRepairCost && calculatedTotal > 0) {
          addRepairCost({
            assetId: formData.assetId,
            workOrderId: formData.workOrderId || null,
            serviceId: createdService.id,
            serviceDate: formData.serviceDate,
            expenseDate: formData.serviceDate,
            labourCost: labourNum,
            partsCost: partsNum,
            otherCharges: otherNum,
            totalCost: calculatedTotal,
            invoiceNumber: formData.invoiceNumber || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            invoiceName: `${formData.invoiceNumber || 'INV-2026'}.pdf`,
            invoiceFileSize: '1.2 MB',
            paymentStatus: formData.paymentStatus,
            description: `[Service] ${formData.problemIdentified.trim()}`,
            notes: `Auto-generated financial ledger entry from Service Log ${createdService.serviceId}`,
            createdByUserId: currentUser?.id
          });
        }

        showToast(`Service Record ${createdService.serviceId} logged successfully.`, 'success');
      }

      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to record service history log.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter available work orders for the selected asset
  const availableWorkOrders = workOrders.filter(
    (w) => !formData.assetId || w.assetId === formData.assetId
  );

  const technicians = users.filter((u) => u.role === 'TECHNICIAN' || u.role === 'STAFF');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-bg-card border border-industrial-border rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-industrial-border bg-bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent-primary/10 border border-accent-primary/30 text-accent-primary">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary font-display">
                {isEditing ? 'Edit Service History Log' : 'Record Service & Maintenance Intervention'}
              </h2>
              <p className="text-xs text-text-secondary">
                {isEditing
                  ? `Update maintenance intervention record ${initialData.serviceId || initialData.id}`
                  : 'Log technical repairs, calibration tests, and component replacements'}
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
              Target Physical Asset <span className="text-status-critical">*</span>
            </label>
            <select
              value={formData.assetId}
              onChange={(e) => handleChange('assetId', e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary transition-colors ${
                errors.assetId ? 'border-status-critical' : 'border-industrial-border'
              }`}
            >
              <option value="" disabled>-- Select Campus Equipment --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetId} - {a.name} ({a.location})
                </option>
              ))}
            </select>
            {errors.assetId && (
              <p className="mt-1 text-xs text-status-critical flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.assetId}
              </p>
            )}
          </div>

          {/* Service Date, Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Service Date <span className="text-status-critical">*</span>
              </label>
              <input
                type="date"
                value={formData.serviceDate}
                onChange={(e) => handleChange('serviceDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Service Type <span className="text-status-critical">*</span>
              </label>
              <select
                value={formData.serviceType}
                onChange={(e) => handleChange('serviceType', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              >
                <option value="Preventive Maintenance">Preventive Maintenance</option>
                <option value="Corrective Maintenance">Corrective Maintenance</option>
                <option value="Emergency Repair">Emergency Repair</option>
                <option value="Inspection">Inspection</option>
                <option value="Replacement">Replacement</option>
                <option value="Calibration">Calibration</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Operational Status
              </label>
              <select
                value={formData.serviceStatus}
                onChange={(e) => handleChange('serviceStatus', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              >
                <option value="COMPLETED">Completed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PENDING">Pending Review</option>
              </select>
            </div>
          </div>

          {/* Assigned Technician & Optional Linked Work Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Executing Technician <span className="text-status-critical">*</span>
              </label>
              <select
                value={formData.technicianId}
                onChange={(e) => handleChange('technicianId', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              >
                {technicians.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Linked Work Order (Optional)
              </label>
              <select
                value={formData.workOrderId}
                onChange={(e) => handleChange('workOrderId', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary truncate"
              >
                <option value="">-- Direct Ad-Hoc Intervention --</option>
                {availableWorkOrders.map((w) => (
                  <option key={w.id} value={w.workOrderId || w.id}>
                    {w.workOrderId} - {w.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Problem Identified */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Problem Identified / Fault Symptoms <span className="text-status-critical">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Excessive bearing vibration detected on industrial motor during vibration sensor sweep."
              value={formData.problemIdentified}
              onChange={(e) => handleChange('problemIdentified', e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl bg-bg-elevated border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary ${
                errors.problemIdentified ? 'border-status-critical' : 'border-industrial-border'
              }`}
            />
            {errors.problemIdentified && (
              <p className="mt-1 text-xs text-status-critical flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.problemIdentified}
              </p>
            )}
          </div>

          {/* Work Conducted / Action Taken */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Work Performed & Corrective Actions <span className="text-status-critical">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Disassembled bearing housing, flushed degraded lithium grease, seated replacement ball bearing and re-torqued mount bolts."
              value={formData.workPerformed}
              onChange={(e) => handleChange('workPerformed', e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl bg-bg-elevated border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary ${
                errors.workPerformed ? 'border-status-critical' : 'border-industrial-border'
              }`}
            />
            {errors.workPerformed && (
              <p className="mt-1 text-xs text-status-critical flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.workPerformed}
              </p>
            )}
          </div>

          {/* Parts Replaced */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Spare Parts & Consumables Replaced
            </label>
            <input
              type="text"
              placeholder="e.g. SKF 6204-2RSH Deep Groove Ball Bearing, Shell Gadus S2 grease"
              value={formData.partsReplaced}
              onChange={(e) => handleChange('partsReplaced', e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>

          {/* Itemized Cost Breakdown */}
          <div className="p-4 rounded-xl bg-bg-surface/50 border border-industrial-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-accent-primary">
                Itemized Maintenance Cost (INR ₹)
              </span>
              <span className="text-[11px] text-text-muted">
                Total auto-calculates live
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-text-muted mb-1">
                  Labour / Specialist Charge (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={formData.labourCost}
                  onChange={(e) => handleChange('labourCost', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-text-muted mb-1">
                  Spare Parts Cost (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={formData.partsCost}
                  onChange={(e) => handleChange('partsCost', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-text-muted mb-1">
                  Other / Consumables (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={formData.otherCharges}
                  onChange={(e) => handleChange('otherCharges', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-industrial-border flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-text-secondary">
                Total Service Expenditure:
              </span>
              <span className="text-base font-bold font-mono text-accent-primary shadow-glow-sm">
                {formatRupee(calculatedTotal)}
              </span>
            </div>
          </div>

          {/* Sync with Financial Ledger Checkbox */}
          {!isEditing && (
            <div className="p-3 rounded-xl bg-accent-primary/10 border border-accent-primary/20 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.createRepairCost}
                  onChange={(e) => handleChange('createRepairCost', e.target.checked)}
                  className="w-4 h-4 rounded text-accent-primary focus:ring-accent-primary bg-bg-elevated border-industrial-border"
                />
                <span className="text-xs font-semibold text-text-primary">
                  Also record commercial invoice in Repair Cost ledger
                </span>
              </label>

              {formData.createRepairCost && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">
                      Invoice Reference #
                    </label>
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-bg-elevated border border-industrial-border font-mono text-text-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">
                      Settlement Status
                    </label>
                    <select
                      value={formData.paymentStatus}
                      onChange={(e) => handleChange('paymentStatus', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-bg-elevated border border-industrial-border text-text-primary focus:outline-none"
                    >
                      <option value="PAID">Paid / Cleared</option>
                      <option value="PENDING">Pending Approval</option>
                      <option value="OVERDUE">Overdue</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Technician Remarks
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Machine operates within normal vibration ceiling. Next check recommended in 60 days."
                value={formData.finalRemarks}
                onChange={(e) => handleChange('finalRemarks', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Manager Review & Certification
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Service verified and approved for laboratory operational deployment."
                value={formData.managerRemarks}
                onChange={(e) => handleChange('managerRemarks', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-industrial-border">
            <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Service Record' : 'Save Service Record'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
