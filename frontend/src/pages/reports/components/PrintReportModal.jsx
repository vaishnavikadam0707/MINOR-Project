import React from 'react';
import { Printer, X, Download } from 'lucide-react';
import Button from '../../../components/common/Button';
import { formatRupee } from '../../../utils/formatters';

export default function PrintReportModal({
  isOpen,
  onClose,
  reportTitle,
  dateRangeLabel,
  kpiData,
  tableData,
  columns
}) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-bg-card border border-industrial-border rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-industrial-border flex items-center justify-between bg-bg-secondary print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center text-accent-primary">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-text-primary">
                Print Preview: {reportTitle}
              </h2>
              <p className="text-xs text-text-secondary font-mono">
                Filter: {dateRangeLabel} • {tableData.length} records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" icon={Printer} onClick={handlePrint}>
              Print Now
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/[0.04]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto print:p-0 print:overflow-visible bg-white text-slate-900 font-sans" id="printable-report">
          {/* Print Header */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
                SMART ASSETCARE™
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Predictive Maintenance & Asset Lifecycle Management System
              </p>
              <div className="mt-2 text-xs font-mono text-slate-500">
                <span>Date Range: <strong>{dateRangeLabel}</strong></span> |{' '}
                <span>Generated: {new Date().toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded uppercase">
                {reportTitle}
              </span>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">CONFIDENTIAL & OFFICIAL</p>
            </div>
          </div>

          {/* KPI Summary Block */}
          {kpiData && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              {kpiData.map((kpi, idx) => (
                <div key={idx} className="text-center">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">
                    {kpi.label}
                  </span>
                  <span className="text-base font-bold text-slate-900 mt-0.5 block">
                    {kpi.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 divide-y divide-slate-200">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr>
                  {columns.map((col, idx) => (
                    <th key={idx} className="p-2.5 border-r border-slate-200 last:border-r-0">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableData.slice(0, 50).map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className="p-2 border-r border-slate-200 last:border-r-0 text-slate-800">
                        {col.render ? col.render(row) : row[col.accessor] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {tableData.length > 50 && (
              <p className="text-[11px] text-slate-500 italic mt-2 text-center">
                Displaying first 50 of {tableData.length} records in print preview.
              </p>
            )}
          </div>

          {/* Print Footer / Sign-off */}
          <div className="mt-10 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Verified By: __________________________</span>
            <span>Signature: __________________________</span>
            <span>Date: ________________</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-industrial-border bg-bg-secondary flex justify-end gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" icon={Printer} onClick={handlePrint}>
            Print / Save PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
