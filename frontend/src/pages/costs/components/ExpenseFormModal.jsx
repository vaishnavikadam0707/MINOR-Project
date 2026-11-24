import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  AlertCircle,
  Calendar,
  FileText,
  Paperclip,
  Layers,
  Wrench,
  Check
} from 'lucide-react';
import Button from '../../../components/common/Button';
import { useAppData } from '../../../context/AppDataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { getTodayISO } from '../../../utils/dateHelpers';
import { formatRupee } from '../../../utils/formatters';

export default function ExpenseFormModal({ isOpen, onClose, initialData = null }) {
  const { assets, workOrders, serviceHistory, addRepairCost, updateRepairCost } = useAppData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    assetId: '',
    workOrderId: '',
    serviceId: '',
    expenseDate: getTodayISO(),
    labourCost: '',
    partsCost: '',
    otherCharges: '',
    description: '',
    invoiceNumber: '',
    paymentStatus: 'PAID',
    notes: '',
    invoiceName: '',
    invoiceFileSize: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          assetId: initialData.assetId || '',
          workOrderId: initialData.workOrderId || '',
          serviceId: initialData.serviceId || '',
          expenseDate: initialData.expenseDate || initialData.serviceDate || getTodayISO(),
          labourCost: initialData.labourCost !== undefined ? String(initialData.labourCost) : '0',
          partsCost: initialData.partsCost !== undefined ? String(initialData.partsCost) : '0',
          otherCharges: initialData.otherCharges !== undefined ? String(initialData.otherCharges) : '0',
          description: initialData.description || '',
          invoiceNumber: initialData.invoiceNumber || '',
          paymentStatus: initialData.paymentStatus || 'PAID',
          notes: initialData.notes || '',
          invoiceName: initialData.invoiceName || '',
          invoiceFileSize: initialData.invoiceFileSize || ''
        });
      } else {
        setFormData({
          assetId: assets.length > 0 ? assets[0].id : '',
          workOrderId: '',
          serviceId: '',
          expenseDate: getTodayISO(),
          labourCost: '0',
          partsCost: '0',
          otherCharges: '0',
          description: '',
          invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          paymentStatus: 'PAID',
          notes: '',
          invoiceName: '',
          invoiceFileSize: ''
        });
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, initialData, assets]);

  if (!isOpen) return null;

  // Live total calculation (Section 2.4)
  const labourNum = Number(formData.labourCost) || 0;
  const partsNum = Number(formData.partsCost) || 0;
  const otherNum = Number(formData.otherCharges) || 0;
  const calculatedTotal = labourNum + partsNum + otherNum;

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // If user selected a service record, auto-fill asset and workOrder if present
      if (field === 'serviceId' && value) {
        const matchedSh = serviceHistory.find((s) => s.id === value || s.serviceId === value);
        if (matchedSh) {
          if (matchedSh.assetId) updated.assetId = matchedSh.assetId;
          if (matchedSh.workOrderId) updated.workOrderId = matchedSh.workOrderId;
          if (!prev.description && matchedSh.problemIdentified) {
            updated.description = matchedSh.problemIdentified;
          }
        }
      }
      return updated;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Browser-based file input handling (metadata simulation as requested in Section 2.5)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeKB = Math.round(file.size / 1024);
      const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
      setFormData((prev) => ({
        ...prev,
        invoiceName: file.name,
        invoiceFileSize: sizeStr
      }));
      showToast(`Attached invoice metadata: ${file.name} (${sizeStr})`, 'info');
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.assetId) errs.assetId = 'Target asset is required.';
    if (!formData.expenseDate) errs.expenseDate = 'Expense date is required.';
    if (!formData.description?.trim()) errs.description = 'Expense description is required.';
    if (!formData.invoiceNumber?.trim()) errs.invoiceNumber = 'Invoice reference number is required.';

    if (labourNum < 0) errs.labourCost = 'Labour cost cannot be negative.';
    if (partsNum < 0) errs.partsCost = 'Parts cost cannot be negative.';
    if (otherNum < 0) errs.otherCharges = 'Incidental cost cannot be negative.';

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
        serviceId: formData.serviceId || null,
        expenseDate: formData.expenseDate,
        serviceDate: formData.expenseDate,
        labourCost: labourNum,
        partsCost: partsNum,
        otherCharges: otherNum,
        totalCost: calculatedTotal,
        description: formData.description.trim(),
        invoiceNumber: formData.invoiceNumber.trim(),
        invoiceName: formData.invoiceName || `${formData.invoiceNumber.trim()}.pdf`,
        invoiceFileSize: formData.invoiceFileSize || '1.1 MB',
        paymentStatus: formData.paymentStatus,
        notes: formData.notes.trim()
      };

      if (isEditing) {
        updateRepairCost(initialData.id, payload);
        showToast(`Repair cost entry ${initialData.expenseId || initialData.id} updated.`, 'success');
      } else {
        const created = addRepairCost(payload);
        showToast(`Repair expense ${created.expenseId} recorded successfully.`, 'success');
      }

      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to save repair expense record.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Available Work Orders for selected asset
  const availableWorkOrders = workOrders.filter(
    (w) => !formData.assetId || w.assetId === formData.assetId
  );

  // Available Service Records for selected asset
  const availableServices = serviceHistory.filter(
    (s) => !formData.assetId || s.assetId === formData.assetId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-bg-card border border-industrial-border rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-industrial-border bg-bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent-primary/10 border border-accent-primary/30 text-accent-primary">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary font-display">
                {isEditing ? 'Edit Maintenance Expense' : 'Record Maintenance Expense'}
              </h2>
              <p className="text-xs text-text-secondary">
                {isEditing
                  ? `Update financial line items for ${initialData.expenseId || initialData.id}`
                  : 'Log itemized service labour, parts replacement and commercial invoice'}
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

          {/* Related Links: Work Order & Service Record */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Related Work Order (Optional)
              </label>
              <select
                value={formData.workOrderId}
                onChange={(e) => handleChange('workOrderId', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border border-industrial-border text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary truncate"
              >
                <option value="">-- No Work Order Linked --</option>
                {availableWorkOrders.map((w) => (
                  <option key={w.id} value={w.workOrderId || w.id}>
                    {w.workOrderId} - {w.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Related Service Log (Optional)
              </label>
              <select
                value={formData.serviceId}
                onChange={(e) => handleChange('serviceId', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border border-industrial-border text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary truncate"
              >
                <option value="">-- No Service Log Linked --</option>
                {availableServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.serviceId || s.id} ({s.serviceDate}) - {s.serviceType || 'Service'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description & Expense Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Expenditure Description <span className="text-status-critical">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Compressor chemical wash and refrigerant refill"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary transition-colors ${
                  errors.description ? 'border-status-critical' : 'border-industrial-border'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-status-critical flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Expense Date <span className="text-status-critical">*</span>
              </label>
              <input
                type="date"
                value={formData.expenseDate}
                onChange={(e) => handleChange('expenseDate', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary ${
                  errors.expenseDate ? 'border-status-critical' : 'border-industrial-border'
                }`}
              />
            </div>
          </div>

          {/* Itemized Cost Breakdown (Section 2.4: Labour, Parts, Other -> Auto Total) */}
          <div className="p-4 rounded-xl bg-bg-surface/50 border border-industrial-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-accent-primary">
                Itemized Cost Breakdown (INR ₹)
              </span>
              <span className="text-[11px] text-text-muted">
                Total auto-calculates live
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-text-muted mb-1">
                  Labour / Specialist Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={formData.labourCost}
                  onChange={(e) => handleChange('labourCost', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-text-muted mb-1">
                  Spare Parts / Materials (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={formData.partsCost}
                  onChange={(e) => handleChange('partsCost', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-text-muted mb-1">
                  Consumables / Other (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={formData.otherCharges}
                  onChange={(e) => handleChange('otherCharges', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>
            </div>

            {/* Calculated Total Display */}
            <div className="pt-3 border-t border-industrial-border flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-text-secondary">
                Calculated Total Expenditure:
              </span>
              <span className="text-lg font-bold font-mono text-accent-primary shadow-glow-sm">
                {formatRupee(calculatedTotal)}
              </span>
            </div>
          </div>

          {/* Invoice Number & Payment Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Invoice Reference # <span className="text-status-critical">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-DAIKIN-8821"
                value={formData.invoiceNumber}
                onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary ${
                  errors.invoiceNumber ? 'border-status-critical' : 'border-industrial-border'
                }`}
              />
              {errors.invoiceNumber && (
                <p className="mt-1 text-xs text-status-critical flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.invoiceNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Settlement Status <span className="text-status-critical">*</span>
              </label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => handleChange('paymentStatus', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border border-industrial-border text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              >
                <option value="PAID">Paid / Cleared</option>
                <option value="PENDING">Pending Approval / Disbursement</option>
                <option value="OVERDUE">Overdue / Past Due Date</option>
              </select>
            </div>
          </div>

          {/* Invoice File Attachment (Section 2.5) */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Invoice Document Attachment (PDF / Scanned Bill)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-secondary hover:text-accent-primary hover:border-accent-primary cursor-pointer transition-colors">
                <Paperclip className="w-4 h-4" />
                <span>Choose Invoice Document</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {formData.invoiceName ? (
                <span className="text-xs text-text-primary font-mono truncate max-w-xs flex items-center gap-1.5 bg-accent-primary/10 px-2.5 py-1 rounded-lg border border-accent-primary/30">
                  <Check className="w-3.5 h-3.5 text-accent-primary" />
                  {formData.invoiceName} ({formData.invoiceFileSize || 'Attached'})
                </span>
              ) : (
                <span className="text-xs text-text-muted italic">
                  No file selected (simulated browser metadata)
                </span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Accounting Notes & Warranty Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Disbursed from Lab Maintenance Fund. Replacement compressor parts carry 1-year vendor warranty."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-industrial-border">
            <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Expense' : 'Save Expense Record'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
