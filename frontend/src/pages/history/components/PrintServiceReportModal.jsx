import React from 'react';
import { X, Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Button from '../../../components/common/Button';
import { formatRupee, formatDate } from '../../../utils/formatters';

export default function PrintServiceReportModal({ isOpen, onClose, record, asset, technician, workOrder }) {
  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-bg-card border border-industrial-border rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-industrial-border bg-bg-surface/60 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-accent-primary" />
            <h3 className="text-sm font-bold text-text-primary font-display">
              Service Report & Audit Certificate Preview
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" icon={Printer} onClick={handlePrint}>
              Print Report
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="p-8 space-y-6 text-text-primary print:p-0 print:text-black print:bg-white">
          {/* Institution Header */}
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
                Institutional Campus Facility & Maintenance Engineering Division
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted print:text-gray-500 block">
                Certificate Ref
              </span>
              <span className="font-mono font-bold text-accent-primary print:text-black text-sm">
                {record.serviceId || record.id.toUpperCase()}
              </span>
              <span className="text-[10px] text-text-muted print:text-gray-500 block mt-0.5">
                Date: {record.serviceDate || new Date().toISOString().split('T')[0]}
              </span>
            </div>
          </div>

          <div className="text-center py-2 bg-accent-primary/10 print:bg-gray-100 rounded-xl border border-accent-primary/20 print:border-gray-300">
            <h2 className="text-sm font-extrabold font-mono uppercase tracking-widest text-accent-primary print:text-black">
              Official Technical Service Certificate
            </h2>
          </div>

          {/* Section 1: Asset Information */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-accent-primary print:text-black border-b border-industrial-border print:border-gray-300 pb-1">
              1. Equipment Identification
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-text-muted print:text-gray-500 block text-[10px] uppercase font-mono">Asset Name</span>
                <span className="font-bold">{asset?.name || 'Institutional Equipment'}</span>
              </div>
              <div>
                <span className="text-text-muted print:text-gray-500 block text-[10px] uppercase font-mono">Asset ID</span>
                <span className="font-mono font-bold text-accent-primary print:text-black">{asset?.assetId || record.assetId}</span>
              </div>
              <div>
                <span className="text-text-muted print:text-gray-500 block text-[10px] uppercase font-mono">Category</span>
                <span>{asset?.category || 'General Equipment'}</span>
              </div>
              <div>
                <span className="text-text-muted print:text-gray-500 block text-[10px] uppercase font-mono">Campus Location</span>
                <span>{asset?.location || 'Campus Facility'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Service Metadata */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-accent-primary print:text-black border-b border-industrial-border print:border-gray-300 pb-1">
              2. Service Execution Details
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-text-muted print:text-gray-500 block text-[10px] uppercase font-mono">Service Type</span>
                <span className="font-bold">{record.serviceType || 'Routine Maintenance'}</span>
              </div>
              <div>
                <span className="text-text-muted print:text-gray-500 block text-[10px] uppercase font-mono">Status</span>
                <span className="font-mono font-bold text-emerald-400 print:text-black">{record.serviceStatus || 'COMPLETED'}</span>
              </div>
              <div>
                <span className="text-text-muted print:text-gray-500 block text-[10px] uppercase font-mono">Assigned Specialist</span>
                <span>{technician?.name || 'Field Technician'}</span>
              </div>
              <div>
                <span className="text-text-muted print:text-gray-500 block text-[10px] uppercase font-mono">Related Work Order</span>
                <span className="font-mono">{record.workOrderId || workOrder?.workOrderId || 'Ad-Hoc Direct'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Technical Findings & Corrective Action */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-accent-primary print:text-black border-b border-industrial-border print:border-gray-300 pb-1">
              3. Technical Diagnosis & Action Taken
            </h4>
            <div className="text-xs space-y-2 bg-bg-surface/50 print:bg-gray-50 p-3.5 rounded-xl border border-industrial-border print:border-gray-300">
              <div>
                <strong className="text-text-secondary print:text-gray-700 block mb-0.5 font-mono text-[11px]">Reported Problem / Root Cause:</strong>
                <p className="leading-relaxed">{record.problemIdentified || record.serviceDescription}</p>
              </div>
              <div className="pt-2 border-t border-industrial-border/60 print:border-gray-200">
                <strong className="text-text-secondary print:text-gray-700 block mb-0.5 font-mono text-[11px]">Corrective Actions Performed:</strong>
                <p className="leading-relaxed">{record.workPerformed || record.actionTaken || 'Full functional calibration and diagnostic test performed.'}</p>
              </div>
              <div className="pt-2 border-t border-industrial-border/60 print:border-gray-200">
                <strong className="text-text-secondary print:text-gray-700 block mb-0.5 font-mono text-[11px]">Components / Consumables Replaced:</strong>
                <p className="font-mono text-accent-primary print:text-black">{record.partsReplaced || 'None'}</p>
              </div>
            </div>
          </div>

          {/* Section 4: Cost Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-accent-primary print:text-black border-b border-industrial-border print:border-gray-300 pb-1">
              4. Itemized Expenditure
            </h4>
            <table className="w-full text-xs text-left border-collapse border border-industrial-border print:border-gray-300">
              <thead className="bg-bg-elevated print:bg-gray-100 font-mono text-[11px] text-text-muted print:text-gray-600">
                <tr>
                  <th className="p-2 border border-industrial-border print:border-gray-300">Expenditure Category</th>
                  <th className="p-2 border border-industrial-border print:border-gray-300">Description</th>
                  <th className="p-2 border border-industrial-border print:border-gray-300 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-industrial-border print:border-gray-300 font-medium">Labour & Engineering</td>
                  <td className="p-2 border border-industrial-border print:border-gray-300">Specialist diagnostic and service hours</td>
                  <td className="p-2 border border-industrial-border print:border-gray-300 text-right font-mono">{formatRupee(record.labourCost || 0)}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-industrial-border print:border-gray-300 font-medium">Spare Parts & Hardware</td>
                  <td className="p-2 border border-industrial-border print:border-gray-300">{record.partsReplaced || 'Materials'}</td>
                  <td className="p-2 border border-industrial-border print:border-gray-300 text-right font-mono">{formatRupee(record.partsCost || 0)}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-industrial-border print:border-gray-300 font-medium">Consumables & Incidental</td>
                  <td className="p-2 border border-industrial-border print:border-gray-300">Calibration materials & cleaning chemicals</td>
                  <td className="p-2 border border-industrial-border print:border-gray-300 text-right font-mono">{formatRupee(record.otherCharges || 0)}</td>
                </tr>
                <tr className="bg-accent-primary/10 print:bg-gray-100 font-bold">
                  <td colSpan={2} className="p-2.5 border border-industrial-border print:border-gray-300 uppercase font-mono text-accent-primary print:text-black">
                    Total Certified Maintenance Cost
                  </td>
                  <td className="p-2.5 border border-industrial-border print:border-gray-300 text-right font-mono text-sm text-accent-primary print:text-black">
                    {formatRupee(record.totalCost || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 5: Authorization Signatures */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-xs border-t border-industrial-border print:border-gray-300">
            <div className="space-y-6">
              <span className="text-[10px] font-mono uppercase text-text-muted print:text-gray-500 block">
                Field Technician Attestation
              </span>
              <div className="h-10 border-b border-dashed border-text-muted/60 print:border-gray-400" />
              <div className="text-[11px]">
                <strong>{technician?.name || 'Rajesh Kumar'}</strong>
                <span className="text-text-muted print:text-gray-500 block">Senior Hardware Services Specialist</span>
              </div>
            </div>

            <div className="space-y-6 text-right">
              <span className="text-[10px] font-mono uppercase text-text-muted print:text-gray-500 block">
                Facility & Operations Verification
              </span>
              <div className="h-10 border-b border-dashed border-text-muted/60 print:border-gray-400" />
              <div className="text-[11px]">
                <strong>Prof. Sunita Deshmukh</strong>
                <span className="text-text-muted print:text-gray-500 block">Campus Facility Operations Director</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-industrial-border bg-bg-surface/60 print:hidden">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" icon={Printer} onClick={handlePrint}>
            Print Document
          </Button>
        </div>
      </div>
    </div>
  );
}
