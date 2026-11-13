import React from 'react';
import Modal from '../../components/modals/Modal';
import Button from '../../components/common/Button';
import { AlertTriangle, Archive, Trash2, ShieldCheck, History } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasPermission } from '../../utils/permissions';

export default function DeleteAssetModal({
  isOpen,
  onClose,
  asset,
  onSuccess
}) {
  const { deleteAsset, archiveAsset, hasRelatedRecords } = useAppData();
  const { role } = useAuth();
  const { showToast } = useToast();

  if (!asset) return null;

  const relationSummary = hasRelatedRecords(asset.id);
  const canDeleteHard = hasPermission(role, 'CAN_DELETE_ASSET');

  const handleArchive = () => {
    archiveAsset(asset.id);
    showToast({
      type: 'info',
      title: 'Asset Archived',
      message: `${asset.assetId} (${asset.name}) marked as RETIRED. Historical tickets and service logs preserved.`
    });
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleDeletePermanent = () => {
    if (!canDeleteHard) {
      showToast({
        type: 'error',
        title: 'Action Prohibited',
        message: 'Only Institutional Admins can permanently delete asset records.'
      });
      return;
    }

    deleteAsset(asset.id);
    showToast({
      type: 'warning',
      title: 'Asset Removed',
      message: `${asset.assetId} (${asset.name}) removed from local prototype inventory.`
    });
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Asset Lifecycle: ${asset.assetId}`}
      subtitle="Safeguard audit records and historical maintenance integrity"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Warning Icon Banner */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-status-critical/10 border border-status-critical/30">
          <div className="w-10 h-10 rounded-xl bg-status-critical/20 text-status-critical flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-text-primary truncate">
              {asset.name}
            </h4>
            <span className="text-[10px] font-mono text-status-critical block">
              STATUS: {asset.status} • {asset.location}
            </span>
          </div>
        </div>

        {/* Relational Records Notice */}
        {relationSummary.hasRecords ? (
          <div className="p-3.5 rounded-2xl bg-bg-elevated border border-industrial-border space-y-2 text-xs">
            <p className="font-semibold text-text-primary flex items-center gap-1.5">
              <History className="w-4 h-4 text-accent-primary" />
              Active Relational Dependencies Detected:
            </p>
            <ul className="space-y-1 text-text-secondary pl-5 list-disc text-[11px] font-mono">
              {relationSummary.workOrdersCount > 0 && (
                <li>{relationSummary.workOrdersCount} Work Orders</li>
              )}
              {relationSummary.schedulesCount > 0 && (
                <li>{relationSummary.schedulesCount} Preventive Schedules</li>
              )}
              {relationSummary.serviceHistoryCount > 0 && (
                <li>{relationSummary.serviceHistoryCount} Service History Records</li>
              )}
              {relationSummary.repairCostsCount > 0 && (
                <li>{relationSummary.repairCostsCount} Repair Cost Records</li>
              )}
            </ul>
            <p className="text-[11px] text-text-muted pt-1">
              Per campus compliance rules, permanent deletion would break historical work logs. We strongly advise archiving the asset by setting its status to <strong>RETIRED</strong>.
            </p>
          </div>
        ) : (
          <p className="text-xs text-text-secondary leading-relaxed">
            This asset has no historical tickets or expenses. Deleting will remove it from the local demonstration catalog.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:flex-1 justify-center"
          >
            Cancel
          </Button>

          {/* Primary Recommended Action: Archive */}
          <Button
            variant="primary"
            icon={Archive}
            onClick={handleArchive}
            className="w-full sm:flex-1 justify-center"
          >
            Archive (Retire)
          </Button>

          {/* Permanent Delete for Admins */}
          {canDeleteHard && (
            <Button
              variant="danger"
              icon={Trash2}
              onClick={handleDeletePermanent}
              className="w-full sm:w-auto justify-center text-xs"
              title="Delete permanently from prototype"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
