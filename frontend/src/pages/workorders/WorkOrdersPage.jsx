import React from 'react';
import { Wrench, Plus, Kanban, List } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../utils/permissions';

export default function WorkOrdersPage() {
  const { workOrders } = useAppData();
  const { role } = useAuth();
  const canCreate = hasPermission(role, 'CAN_CREATE_WORK_ORDER');

  const columns = ['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'CLOSED'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
            Work Order Management
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Track reported issues, technician assignments and maintenance progress.
          </p>
        </div>

        {canCreate && (
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => alert('Full Kanban drag-and-drop board with dnd-kit will be implemented in Phase 4!')}
          >
            Create Work Order
          </Button>
        )}
      </div>

      {/* 6 Column Kanban Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const inCol = workOrders.filter((w) => w.status === col);
          return (
            <div key={col} className="bg-bg-card rounded-2xl border border-industrial-border p-3 flex flex-col min-w-[200px]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-industrial-border">
                <span className="text-[11px] font-mono font-bold text-text-secondary">{col.replace('_', ' ')}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-text-muted">{inCol.length}</span>
              </div>

              <div className="space-y-2 flex-1">
                {inCol.map((w) => (
                  <div key={w.id} className="p-3 rounded-xl bg-bg-elevated border border-industrial-border text-xs space-y-1 hover:border-accent-primary/40 transition-colors">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-accent-primary">{w.workOrderId}</span>
                      <Badge status={w.priority} size="xs" />
                    </div>
                    <p className="font-semibold text-text-primary line-clamp-2">{w.title}</p>
                    <span className="text-[10px] text-text-muted font-mono block">Due: {w.dueDate}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
