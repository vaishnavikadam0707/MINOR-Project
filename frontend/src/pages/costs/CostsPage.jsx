import React from 'react';
import { DollarSign, FileSpreadsheet, Plus } from 'lucide-react';
import Button from '../../components/common/Button';
import { useAppData } from '../../context/AppDataContext';
import { formatRupee } from '../../utils/formatters';

export default function CostsPage() {
  const { repairCosts, assets, metrics } = useAppData();

  const getAssetName = (astId) => {
    const a = assets.find((x) => x.id === astId);
    return a ? `${a.assetId} - ${a.name}` : astId;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
            Repair Cost Tracking
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Audit itemized labour fees, parts invoices and institutional expenditures in INR (₹).
          </p>
        </div>

        <div className="p-3 rounded-xl bg-accent-primary/10 border border-accent-primary/30 text-right">
          <span className="text-[10px] font-mono text-text-muted uppercase block">Total Expenditure</span>
          <span className="text-lg font-bold font-display text-accent-primary">{formatRupee(metrics.totalRepairCost)}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-industrial-border overflow-hidden bg-bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-bg-secondary text-text-muted border-b border-industrial-border">
              <tr>
                <th className="p-4">Cost ID</th>
                <th className="p-4">Asset</th>
                <th className="p-4">Date</th>
                <th className="p-4">Labour</th>
                <th className="p-4">Parts</th>
                <th className="p-4">Other</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-border">
              {repairCosts.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02]">
                  <td className="p-4 font-bold text-accent-primary">{c.id.toUpperCase()}</td>
                  <td className="p-4 font-semibold text-text-primary">{getAssetName(c.assetId)}</td>
                  <td className="p-4 text-text-muted">{c.serviceDate}</td>
                  <td className="p-4 text-text-secondary">{formatRupee(c.labourCost)}</td>
                  <td className="p-4 text-text-secondary">{formatRupee(c.partsCost)}</td>
                  <td className="p-4 text-text-secondary">{formatRupee(c.otherCharges)}</td>
                  <td className="p-4 font-bold text-accent-primary">{formatRupee(c.totalCost)}</td>
                  <td className="p-4 text-text-muted">{c.invoiceName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
