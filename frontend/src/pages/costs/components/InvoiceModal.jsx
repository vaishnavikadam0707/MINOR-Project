import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  Paperclip,
  Check,
  History,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import { formatRupee, formatDate } from '../../../utils/formatters';
import { useAppData } from '../../../context/AppDataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { ROLES } from '../../../utils/permissions';
import ServiceDetailModal from '../../history/components/ServiceDetailModal';

export default function InvoiceModal({ isOpen, onClose, expense, asset, workOrder }) {
  const { serviceHistory, users, updateInvoicePaymentStatus } = useAppData();
  const { role } = useAuth();
  const { showToast } = useToast();

  const [serviceModalRecord, setServiceModalRecord] = useState(null);

  if (!isOpen || !expense) return null;

  const canManageInvoice = role === ROLES.ADMIN || role === ROLES.MANAGER;

  const handleStatusChange = (newStatus) => {
    updateInvoicePaymentStatus(expense.id, newStatus);
    showToast(`Invoice ${expense.invoiceNumber || expense.expenseId} marked as ${newStatus}.`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const status = (expense.paymentStatus || 'PAID').toUpperCase();

  // Find linked service record if any
  const linkedService = serviceHistory.find(
    (s) => s.id === expense.serviceId || s.serviceId === expense.serviceId
  );
  const tech = linkedService ? users.find((u) => u.id === linkedService.technicianId) : null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-bg-card border border-industrial-border rounded-2xl shadow-2xl overflow-hidden my-6">
          {/* Modal Controls Header (Hidden in Print) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-industrial-border bg-bg-surface/60 print:hidden">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent-primary" />
              <h3 className="text-sm font-bold text-text-primary font-display">
                Commercial Repair Invoice Dossier
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {linkedService && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={History}
                  onClick={() => setServiceModalRecord(linkedService)}
                >
                  View Service Record
                </Button>
              )}
              <Button variant="primary" size="sm" icon={Printer} onClick={handlePrint}>
                Print Invoice
              </Button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Invoice Sheet */}
          <div className="p-8 space-y-6 text-text-primary print:p-0 print:text-black print:bg-white">
            {/* Invoice Header */}
            <div className="border-b-2 border-accent-primary pb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent-primary text-black font-display font-black flex items-center justify-center text-sm print:border">
                    AC
                  </div>
                  <h1 className="text-xl font-black font-display tracking-tight uppercase">
                    Smart AssetCare
                  </h1>
                </div>
                <p className="text-xs text-text-secondary print:text-gray-600 mt-1">
                  Institutional Campus Facility & Infrastructure Accounts
                </p>
              </div>

              <div className="text-right space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted print:text-gray-500 block">
                  Invoice Number
                </span>
                <span className="font-mono font-bold text-accent-primary print:text-black text-sm block">
                  {expense.invoiceNumber || expense.expenseId || expense.id.toUpperCase()}
                </span>
                <span
                  className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    status === 'PAID'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 print:text-black print:border-black'
                      : status === 'OVERDUE'
                      ? 'bg-status-critical/15 text-status-critical border-status-critical/30 print:text-black'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30 print:text-black'
                  }`}
                >
                  PAYMENT STATUS: {status}
                </span>
              </div>
            </div>

            {/* Billed To and Equipment Info */}
            <div className="grid grid-cols-2 gap-6 text-xs p-4 rounded-xl bg-bg-surface/50 print:bg-gray-50 border border-industrial-border print:border-gray-300">
              <div>
                <span className="text-text-muted print:text-gray-500 block text-[10px] uppercase font-mono mb-1">
                  Billed Department / Institution
                </span>
                <strong className="text-text-primary print:text-black text-sm block">
                  {asset?.department || 'Campus Department'}
                </strong>
                <span className="text-text-secondary print:text-gray-600 block mt-0.5">
                  Location: {asset?.location || 'Central Campus Block'}
                </span>
                <span className="text-text-muted print:text-gray-500 block font-mono text-[11px] mt-0.5">
                  Expense Date: {formatDate(expense.expenseDate || expense.serviceDate)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-text-muted print:text-gray-500 block text-[10px] uppercase font-mono mb-1">
                  Target Physical Asset
                </span>
                <strong className="text-text-primary print:text-black text-sm block">
                  {asset?.name || 'Institutional Equipment'}
                </strong>
                <span className="font-mono text-accent-primary print:text-black block mt-0.5">
                  Asset ID: {asset?.assetId || expense.assetId}
                </span>
                {expense.workOrderId && (
                  <span className="text-text-muted print:text-gray-500 block font-mono text-[11px] mt-0.5">
                    Work Order: {expense.workOrderId}
                  </span>
                )}
                {expense.serviceId && (
                  <span className="text-text-muted print:text-gray-500 block font-mono text-[11px] mt-0.5">
                    Service Ref: {expense.serviceId}
                  </span>
                )}
              </div>
            </div>

            {/* Itemized Table */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-accent-primary print:text-black block">
                Itemized Diagnostic & Service Billing
              </span>

              <table className="w-full text-xs text-left border-collapse border border-industrial-border print:border-gray-300">
                <thead className="bg-bg-elevated print:bg-gray-100 font-mono text-[11px] text-text-muted print:text-gray-600">
                  <tr>
                    <th className="p-2.5 border border-industrial-border print:border-gray-300">Line Item Description</th>
                    <th className="p-2.5 border border-industrial-border print:border-gray-300">Category</th>
                    <th className="p-2.5 border border-industrial-border print:border-gray-300 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-industrial-border/60 print:divide-gray-300">
                  <tr>
                    <td className="p-2.5 border border-industrial-border print:border-gray-300">
                      <div className="font-semibold text-text-primary print:text-black">
                        Technician & Specialist Labour
                      </div>
                      <span className="text-[10px] text-text-muted print:text-gray-500">
                        Physical inspection, teardown, repair labor & functional stress-testing
                      </span>
                    </td>
                    <td className="p-2.5 border border-industrial-border print:border-gray-300 font-mono text-text-muted print:text-gray-600">
                      Labour Fee
                    </td>
                    <td className="p-2.5 border border-industrial-border print:border-gray-300 text-right font-mono font-medium">
                      {formatRupee(expense.labourCost || 0)}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 border border-industrial-border print:border-gray-300">
                      <div className="font-semibold text-text-primary print:text-black">
                        Spare Parts & Hardware Components
                      </div>
                      <span className="text-[10px] text-text-muted print:text-gray-500">
                        Replacement hardware, manufacturer components and sub-assemblies
                      </span>
                    </td>
                    <td className="p-2.5 border border-industrial-border print:border-gray-300 font-mono text-text-muted print:text-gray-600">
                      Hardware Parts
                    </td>
                    <td className="p-2.5 border border-industrial-border print:border-gray-300 text-right font-mono font-medium">
                      {formatRupee(expense.partsCost || 0)}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 border border-industrial-border print:border-gray-300">
                      <div className="font-semibold text-text-primary print:text-black">
                        Consumables & Incidental Expenses
                      </div>
                      <span className="text-[10px] text-text-muted print:text-gray-500">
                        Solvents, refrigerants, anti-static cleaning, logistics and transport
                      </span>
                    </td>
                    <td className="p-2.5 border border-industrial-border print:border-gray-300 font-mono text-text-muted print:text-gray-600">
                      Consumables
                    </td>
                    <td className="p-2.5 border border-industrial-border print:border-gray-300 text-right font-mono font-medium">
                      {formatRupee(expense.otherCharges || 0)}
                    </td>
                  </tr>

                  {/* Total */}
                  <tr className="bg-accent-primary/10 print:bg-gray-100 font-bold">
                    <td colSpan={2} className="p-3 border border-industrial-border print:border-gray-300 uppercase font-mono text-accent-primary print:text-black">
                      Total Invoice Amount
                    </td>
                    <td className="p-3 border border-industrial-border print:border-gray-300 text-right font-mono text-sm text-accent-primary print:text-black">
                      {formatRupee(expense.totalCost || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Description & Notes */}
            {(expense.description || expense.notes) && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] print:border-gray-300 text-xs space-y-1">
                <span className="text-[10px] font-mono uppercase text-text-muted print:text-gray-500 block">
                  Billing Notes & Observations:
                </span>
                <p className="text-text-secondary print:text-gray-700">
                  {expense.description} {expense.notes ? `• ${expense.notes}` : ''}
                </p>
              </div>
            )}

            {/* Simulated Attachment Badge */}
            {expense.invoiceName && (
              <div className="p-3 rounded-xl bg-accent-primary/[0.05] border border-accent-primary/20 flex items-center justify-between text-xs print:hidden">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-accent-primary" />
                  <div>
                    <span className="font-semibold text-text-primary block">{expense.invoiceName}</span>
                    <span className="text-[10px] text-text-muted font-mono">{expense.invoiceFileSize || '1.2 MB'} • Verified PDF Attachment</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-accent-primary/10 text-accent-primary">
                  Attached
                </span>
              </div>
            )}
          </div>

          {/* Modal Footer with Quick Status Actions for Admin/Manager */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-industrial-border bg-bg-surface/60 print:hidden">
            {canManageInvoice ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider mr-1">
                  Update Status:
                </span>
                <button
                  type="button"
                  onClick={() => handleStatusChange('PAID')}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-colors ${
                    status === 'PAID'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-bg-elevated border-industrial-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Mark Paid
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('PENDING')}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-colors ${
                    status === 'PENDING'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-bg-elevated border-industrial-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Mark Pending
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('OVERDUE')}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-colors ${
                    status === 'OVERDUE'
                      ? 'bg-status-critical/20 text-status-critical border-status-critical/40'
                      : 'bg-bg-elevated border-industrial-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Mark Overdue
                </button>
              </div>
            ) : (
              <span className="text-xs text-text-muted font-mono">Read-Only Financial Record</span>
            )}

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button variant="primary" size="sm" icon={Printer} onClick={handlePrint}>
                Print Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Service Detail Modal */}
      {serviceModalRecord && (
        <ServiceDetailModal
          isOpen={Boolean(serviceModalRecord)}
          onClose={() => setServiceModalRecord(null)}
          record={serviceModalRecord}
          asset={asset}
          technician={tech}
          workOrder={workOrder}
        />
      )}
    </>
  );
}
