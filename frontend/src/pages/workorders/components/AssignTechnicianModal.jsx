import React, { useState } from 'react';
import { X, UserCheck, Shield, CheckCircle2, Wrench, Briefcase } from 'lucide-react';
import Button from '../../../components/common/Button';
import { useAppData } from '../../../context/AppDataContext';
import { useToast } from '../../../context/ToastContext';
import { ROLES } from '../../../utils/permissions';

export default function AssignTechnicianModal({ isOpen, onClose, workOrder }) {
  const { users, workOrders, assignTechnician } = useAppData();
  const { showToast } = useToast();

  const [selectedTechId, setSelectedTechId] = useState(workOrder?.assignedTechnicianId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !workOrder) return null;

  // Filter verified technicians
  const technicians = users.filter((u) => u.role === ROLES.TECHNICIAN && u.active);

  // Calculate active workload for each technician
  const getWorkload = (techId) => {
    return workOrders.filter(
      (w) =>
        w.assignedTechnicianId === techId &&
        w.status !== 'CLOSED' &&
        w.status !== 'VERIFIED'
    ).length;
  };

  const handleAssign = () => {
    if (!selectedTechId) {
      showToast('Please select a technician to assign.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const tech = users.find((u) => u.id === selectedTechId);
      assignTechnician(workOrder.id, selectedTechId);
      showToast(`Work order ${workOrder.workOrderId} successfully assigned to ${tech?.name}.`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to assign technician.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-bg-card border border-industrial-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-industrial-border bg-bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-status-warning/10 border border-status-warning/30 text-status-warning">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary font-display">Assign Field Technician</h2>
              <p className="text-xs text-text-secondary">
                Dispatch ticket <span className="font-mono text-accent-primary font-bold">{workOrder.workOrderId}</span>
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

        {/* Work Order Preview */}
        <div className="px-6 py-3 bg-white/[0.02] border-b border-industrial-border text-xs flex items-center justify-between">
          <span className="text-text-secondary truncate max-w-[280px]">
            <strong>Task:</strong> {workOrder.title}
          </span>
          <span className="font-mono px-2 py-0.5 rounded bg-white/[0.05] text-text-muted">
            Status: {workOrder.status}
          </span>
        </div>

        {/* Technicians List */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Available Service Specialists ({technicians.length})
          </p>

          {technicians.map((tech) => {
            const activeLoad = getWorkload(tech.id);
            const isSelected = selectedTechId === tech.id;
            const isCurrent = workOrder.assignedTechnicianId === tech.id;

            return (
              <div
                key={tech.id}
                onClick={() => setSelectedTechId(tech.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-accent-primary/10 border-accent-primary shadow-[0_0_15px_rgba(57,255,136,0.15)]'
                    : 'bg-bg-elevated border-industrial-border hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-sm border ${
                      isSelected
                        ? 'bg-accent-primary text-black border-accent-primary'
                        : 'bg-white/[0.06] text-accent-primary border-white/10'
                    }`}
                  >
                    {tech.avatarInitials || tech.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary">{tech.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
                          Currently Assigned
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary flex items-center gap-2 mt-0.5">
                      <Briefcase className="w-3.5 h-3.5 text-text-muted" />
                      {tech.department || 'Electrical & Hardware Services'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        activeLoad === 0
                          ? 'bg-status-success/20 text-status-success'
                          : activeLoad > 3
                          ? 'bg-status-critical/20 text-status-critical'
                          : 'bg-status-warning/20 text-status-warning'
                      }`}
                    >
                      {activeLoad} active {activeLoad === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-muted mt-1 block font-mono">
                    {activeLoad === 0 ? '🟢 Idle / Available' : activeLoad > 3 ? '🔴 High Load' : '🟡 Moderate Load'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-industrial-border bg-bg-surface/50">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleAssign} disabled={isSubmitting || !selectedTechId}>
            {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
