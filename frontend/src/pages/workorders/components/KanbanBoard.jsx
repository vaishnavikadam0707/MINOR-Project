import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core';
import { KANBAN_COLUMNS, validateStatusTransition } from '../../../utils/workOrderRules';
import KanbanColumn from './KanbanColumn';
import WorkOrderCard from './WorkOrderCard';
import { useAppData } from '../../../context/AppDataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

export default function KanbanBoard({
  workOrders = [],
  onOpenModal
}) {
  const { updateWorkOrderStatus } = useAppData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [activeDraggingCard, setActiveDraggingCard] = useState(null);

  // Configure sensors with distance constraint so clicks/links aren't intercepted as drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event) => {
    const cardData = event.active?.data?.current?.workOrder;
    if (cardData) {
      setActiveDraggingCard(cardData);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDraggingCard(null);

    if (!over || !active) return;

    const targetStatus = over.id;
    const workOrder = active.data?.current?.workOrder;

    if (!workOrder || workOrder.status === targetStatus) return;

    // Validate transition
    const validation = validateStatusTransition(workOrder, targetStatus, currentUser);

    if (!validation.allowed) {
      showToast(validation.reason || 'This status transition is not permitted.', 'warning');
      return;
    }

    // If modal is required (e.g. resolution notes, technician assignment, rework reason, verification)
    if (validation.requiresModal) {
      onOpenModal(validation.requiresModal, workOrder);
      return;
    }

    // Direct transition (e.g. ASSIGNED -> IN_PROGRESS)
    try {
      updateWorkOrderStatus(workOrder.id, targetStatus);
      showToast(`Work Order ${workOrder.workOrderId} moved to ${targetStatus}.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update work order status.', 'error');
    }
  };

  const handleDirectTransition = (workOrderId, targetStatus) => {
    try {
      updateWorkOrderStatus(workOrderId, targetStatus);
      showToast(`Status updated to ${targetStatus}.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update status.', 'error');
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full overflow-x-auto pb-6 scrollbar-thin">
        <div className="flex gap-4 min-w-max items-start">
          {KANBAN_COLUMNS.map((columnKey) => {
            const columnWorkOrders = workOrders.filter((w) => w.status === columnKey);
            return (
              <KanbanColumn
                key={columnKey}
                statusKey={columnKey}
                workOrders={columnWorkOrders}
                onOpenModal={onOpenModal}
                onDirectTransition={handleDirectTransition}
                activeDraggingCard={activeDraggingCard}
              />
            );
          })}
        </div>
      </div>

      {/* Drag Overlay for smooth card preview while dragging */}
      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeDraggingCard ? <WorkOrderCard workOrder={activeDraggingCard} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
