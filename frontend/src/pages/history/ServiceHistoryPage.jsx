import React from 'react';
import { History, FileText, CheckCircle2 } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import Badge from '../../components/common/Badge';

export default function ServiceHistoryPage() {
  const { serviceHistory, assets } = useAppData();

  const getAssetName = (astId) => {
    const a = assets.find((x) => x.id === astId);
    return a ? `${a.assetId} - ${a.name}` : astId;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
          Service History Logs
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          Historical record of physical repairs, parts replaced, and maintenance completions.
        </p>
      </div>

      <div className="space-y-4">
        {serviceHistory.map((item) => (
          <div key={item.id} className="p-5 rounded-2xl bg-bg-card border border-industrial-border space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="font-bold text-accent-primary">{getAssetName(item.assetId)}</span>
              <span className="text-text-muted">Serviced on: {item.serviceDate}</span>
            </div>
            <h3 className="text-sm font-bold text-text-primary">{item.problemIdentified}</h3>
            <p className="text-xs text-text-secondary">{item.serviceDescription}</p>
            <div className="pt-2 border-t border-industrial-border flex flex-wrap items-center justify-between text-xs font-mono gap-2">
              <span className="text-text-muted">Parts: {item.partsReplaced}</span>
              <span className="text-status-success font-semibold">✓ {item.finalRemarks}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
