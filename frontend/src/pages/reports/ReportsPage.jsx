import React from 'react';
import { BarChart3, Download, Printer } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/cards/Card';
import { useAppData } from '../../context/AppDataContext';
import { formatRupee } from '../../utils/formatters';

export default function ReportsPage() {
  const { metrics, repairCosts, assets, workOrders } = useAppData();

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Asset ID,Name,Category,Status,Health,Purchase Cost\n' +
      assets.map((a) => `"${a.assetId}","${a.name}","${a.category}","${a.status}",${a.healthScore},${a.purchaseCost}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartAssetCare_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Institutional asset telemetry, equipment reliability metrics and audit exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
          >
            Export Assets CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-bg-card border border-industrial-border">
          <span className="text-xs font-mono text-text-muted uppercase">Total Capital Assets</span>
          <div className="text-2xl font-bold font-display text-text-primary mt-1">{metrics.totalAssets} Registered</div>
          <span className="text-xs font-mono text-status-success">{metrics.operationalAssets} Operational</span>
        </div>

        <div className="p-5 rounded-2xl bg-bg-card border border-industrial-border">
          <span className="text-xs font-mono text-text-muted uppercase">Total Maintenance Spend</span>
          <div className="text-2xl font-bold font-display text-accent-primary mt-1">{formatRupee(metrics.totalRepairCost)}</div>
          <span className="text-xs font-mono text-text-muted">{repairCosts.length} itemized repairs</span>
        </div>

        <div className="p-5 rounded-2xl bg-bg-card border border-industrial-border">
          <span className="text-xs font-mono text-text-muted uppercase">Work Order Resolution Rate</span>
          <div className="text-2xl font-bold font-display text-text-primary mt-1">
            {workOrders.length ? Math.round((metrics.completedWorkOrders / workOrders.length) * 100) : 100}%
          </div>
          <span className="text-xs font-mono text-status-info">{metrics.completedWorkOrders} tickets resolved</span>
        </div>
      </div>
    </div>
  );
}
