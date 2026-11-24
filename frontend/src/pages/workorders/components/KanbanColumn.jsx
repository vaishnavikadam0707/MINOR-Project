import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { WORK_ORDER_STATUSES } from '../../../utils/workOrderRules';
import WorkOrderCard from './WorkOrderCard';
import { Layers, Plus } from 'lucide-react';

export default function KanbanColumn({
  statusKey,
  workOrders = [],
  onOpenModal,
  onDirectTransition,
  activeDraggingCard = null
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: statusKey
  });

  const config = WORK_ORDER_STATUSES[statusKey] || {
    label: statusKey,
    columnTitle: statusKey,
    textColor: 'text-text-primary',
    borderColor: 'border-industrial-border',
    bgLight: 'bg-white/[0.04]',
    colorHex: '#39FF88'
  };

  // Determine drop zone visual state
  const isTargetOfDrag = isOver && activeDraggingCard;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col flex-shrink-0 w-80 md:w-[320px] rounded-2xl bg-bg-card border transition-all duration-200 select-none ${
        isTargetOfDrag
          ? 'border-accent-primary bg-accent-primary/[0.03] shadow-[0_0_20px_rgba(57,255,136,0.15)] ring-1 ring-accent-primary/50'
          : 'border-industrial-border/80 hover:border-industrial-border'
      }`}
    >
      {/* Column Header */}
      <div className="p-3.5 border-b border-industrial-border flex items-center justify-between bg-bg-surface/40 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: config.colorHex, boxShadow: `0 0 8px ${config.colorHex}` }}
          />
          <h3 className="text-xs font-bold font-mono tracking-wider text-text-primary uppercase">
            {config.columnTitle}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              workOrders.length > 0
                ? `${config.bgLight} ${config.textColor} ${config.borderColor}`
                : 'bg-white/[0.04] text-text-muted border-white/[0.08]'
            }`}
          >
            {workOrders.length}
          </span>
        </div>
      </div>

      {/* Cards Scrollable Body / Drop Container */}
      <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[420px] max-h-[calc(100vh-320px)]">
        {workOrders.length > 0 ? (
          workOrders.map((wo) => (
            <WorkOrderCard
              key={wo.id}
              workOrder={wo}
              onOpenModal={onOpenModal}
              onDirectTransition={onDirectTransition}
            />
          ))
        ) : (
          <div
            className={`h-full min-h-[140px] flex flex-col items-center justify-center p-6 rounded-xl border border-dashed transition-colors text-center ${
              isTargetOfDrag
                ? 'border-accent-primary bg-accent-primary/[0.05] text-accent-primary'
                : 'border-white/[0.06] bg-black/20 text-text-muted'
            }`}
          >
            <Layers className="w-6 h-6 mb-2 opacity-40" />
            <p className="text-xs font-medium">No tickets in this stage</p>
            <span className="text-[10px] text-text-muted mt-0.5">
              {isTargetOfDrag ? 'Drop ticket here' : 'Drop valid card to advance'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
