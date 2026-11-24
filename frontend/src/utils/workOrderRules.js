// Centralized Work Order Business Rules & Status Transition State Machine
import { isBeforeToday } from './dateHelpers.js';
import { ROLES } from './permissions.js';

export const WORK_ORDER_STATUSES = {
  CREATED: {
    key: 'CREATED',
    label: 'Created / Unassigned',
    shortLabel: 'Created',
    badge: 'info',
    columnTitle: 'Created',
    colorHex: '#38BDF8',
    borderColor: 'border-sky-500/30',
    bgLight: 'bg-sky-500/10',
    textColor: 'text-sky-400',
    glowColor: 'rgba(56, 189, 248, 0.2)'
  },
  ASSIGNED: {
    key: 'ASSIGNED',
    label: 'Assigned to Technician',
    shortLabel: 'Assigned',
    badge: 'warning',
    columnTitle: 'Assigned',
    colorHex: '#FBBF24',
    borderColor: 'border-amber-500/30',
    bgLight: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    glowColor: 'rgba(251, 191, 36, 0.2)'
  },
  IN_PROGRESS: {
    key: 'IN_PROGRESS',
    label: 'In Progress / Servicing',
    shortLabel: 'In Progress',
    badge: 'accent',
    columnTitle: 'In Progress',
    colorHex: '#39FF88',
    borderColor: 'border-accent-primary/40',
    bgLight: 'bg-accent-primary/10',
    textColor: 'text-accent-primary',
    glowColor: 'rgba(57, 255, 136, 0.25)'
  },
  COMPLETED: {
    key: 'COMPLETED',
    label: 'Completed / Awaiting Verification',
    shortLabel: 'Completed',
    badge: 'success',
    columnTitle: 'Completed',
    colorHex: '#10B981',
    borderColor: 'border-emerald-500/30',
    bgLight: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    glowColor: 'rgba(16, 185, 129, 0.2)'
  },
  VERIFIED: {
    key: 'VERIFIED',
    label: 'Verified by Management',
    shortLabel: 'Verified',
    badge: 'purple',
    columnTitle: 'Verified',
    colorHex: '#A855F7',
    borderColor: 'border-purple-500/30',
    bgLight: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    glowColor: 'rgba(168, 85, 247, 0.2)'
  },
  CLOSED: {
    key: 'CLOSED',
    label: 'Closed & Archived',
    shortLabel: 'Closed',
    badge: 'neutral',
    columnTitle: 'Closed',
    colorHex: '#64748B',
    borderColor: 'border-white/10',
    bgLight: 'bg-white/[0.04]',
    textColor: 'text-text-muted',
    glowColor: 'rgba(255, 255, 255, 0.05)'
  }
};

export const KANBAN_COLUMNS = ['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'CLOSED'];

export const WORK_ORDER_PRIORITIES = {
  LOW: {
    key: 'LOW',
    label: 'Low',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    dotColor: 'bg-emerald-400'
  },
  MEDIUM: {
    key: 'MEDIUM',
    label: 'Medium',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    dotColor: 'bg-blue-400'
  },
  HIGH: {
    key: 'HIGH',
    label: 'High',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    dotColor: 'bg-amber-400'
  },
  CRITICAL: {
    key: 'CRITICAL',
    label: 'Critical',
    color: 'text-status-critical bg-status-critical/15 border-status-critical/30',
    dotColor: 'bg-status-critical'
  }
};

/**
 * Derived overdue calculation (Section 12)
 * A work order is overdue if dueDate < today and status is NOT in COMPLETED, VERIFIED, CLOSED.
 */
export function isWorkOrderOverdue(workOrder) {
  if (!workOrder || !workOrder.dueDate) return false;
  if (['COMPLETED', 'VERIFIED', 'CLOSED'].includes(workOrder.status)) return false;
  return isBeforeToday(workOrder.dueDate);
}

/**
 * Filter work orders based on logged-in user role's scope
 * - ADMIN / MANAGER: view all
 * - TECHNICIAN: view only assigned to technician
 * - STAFF: view only submitted by staff
 */
export function getScopedWorkOrders(workOrders = [], currentUser = null) {
  if (!currentUser) return workOrders;
  if (currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.MANAGER) {
    return workOrders;
  }
  if (currentUser.role === ROLES.TECHNICIAN) {
    return workOrders.filter((w) => w.assignedTechnicianId === currentUser.id);
  }
  if (currentUser.role === ROLES.STAFF) {
    return workOrders.filter((w) => w.createdByUserId === currentUser.id);
  }
  return workOrders;
}

/**
 * Central State Machine Validator (Section 6)
 * Strictly enforces allowed transitions and role rules.
 *
 * Allowed normal flow:
 * CREATED -> ASSIGNED
 * ASSIGNED -> IN_PROGRESS
 * IN_PROGRESS -> COMPLETED
 * COMPLETED -> VERIFIED
 * VERIFIED -> CLOSED
 *
 * Special Rework flow:
 * COMPLETED -> IN_PROGRESS (ADMIN or MANAGER only, requires reason)
 */
export function validateStatusTransition(workOrder, targetStatus, user, options = {}) {
  if (!workOrder) {
    return { allowed: false, reason: 'Work order not found' };
  }
  if (!targetStatus) {
    return { allowed: false, reason: 'Destination status is required' };
  }

  const currentStatus = workOrder.status;

  // No-op if dropped on current status
  if (currentStatus === targetStatus) {
    return { allowed: false, reason: 'Work order is already in this status' };
  }

  // Once CLOSED, no normal transitions allowed
  if (currentStatus === 'CLOSED') {
    return { allowed: false, reason: 'Closed work orders are archived and cannot be transitioned.' };
  }

  const role = user?.role;

  // STAFF cannot transition any statuses
  if (role === ROLES.STAFF) {
    return { allowed: false, reason: 'Faculty & staff members cannot change work order status.' };
  }

  // TECHNICIAN validations
  if (role === ROLES.TECHNICIAN) {
    if (workOrder.assignedTechnicianId !== user.id) {
      return { allowed: false, reason: 'You can only update work orders assigned to you.' };
    }

    if (targetStatus === 'ASSIGNED') {
      return { allowed: false, reason: 'Technicians cannot assign or reassign work orders.' };
    }

    if (targetStatus === 'VERIFIED') {
      return { allowed: false, reason: 'Technicians cannot verify their own work. Verification requires a Facility Manager or Administrator.' };
    }

    if (targetStatus === 'CLOSED') {
      return { allowed: false, reason: 'Only Facility Managers or Administrators can close work orders.' };
    }

    if (currentStatus === 'COMPLETED' && targetStatus === 'IN_PROGRESS') {
      return { allowed: false, reason: 'Only Managers or Administrators can reopen completed work for rework.' };
    }

    // Allowed for Technician: ASSIGNED -> IN_PROGRESS
    if (currentStatus === 'ASSIGNED' && targetStatus === 'IN_PROGRESS') {
      return { allowed: true, requiresModal: false };
    }

    // Allowed for Technician: IN_PROGRESS -> COMPLETED (requires resolution description)
    if (currentStatus === 'IN_PROGRESS' && targetStatus === 'COMPLETED') {
      return { allowed: true, requiresModal: 'complete' };
    }

    return {
      allowed: false,
      reason: `Technicians cannot transition directly from ${currentStatus} to ${targetStatus}. Follow the standard flow.`
    };
  }

  // ADMIN / MANAGER validations
  if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
    // 1. CREATED -> ASSIGNED
    if (currentStatus === 'CREATED' && targetStatus === 'ASSIGNED') {
      return { allowed: true, requiresModal: 'assign' };
    }

    // 2. ASSIGNED -> IN_PROGRESS
    if (currentStatus === 'ASSIGNED' && targetStatus === 'IN_PROGRESS') {
      return { allowed: true, requiresModal: false };
    }

    // 3. IN_PROGRESS -> COMPLETED
    if (currentStatus === 'IN_PROGRESS' && targetStatus === 'COMPLETED') {
      return { allowed: true, requiresModal: 'complete' };
    }

    // 4. COMPLETED -> VERIFIED
    if (currentStatus === 'COMPLETED' && targetStatus === 'VERIFIED') {
      return { allowed: true, requiresModal: 'verify' };
    }

    // 5. Special Rework: COMPLETED -> IN_PROGRESS
    if (currentStatus === 'COMPLETED' && targetStatus === 'IN_PROGRESS') {
      return { allowed: true, requiresModal: 'rework', isRework: true };
    }

    // 6. VERIFIED -> CLOSED
    if (currentStatus === 'VERIFIED' && targetStatus === 'CLOSED') {
      return { allowed: true, requiresModal: 'close' };
    }

    // Specific user-friendly invalid explanation messages for common illegal jumps
    if (currentStatus === 'CREATED') {
      if (targetStatus === 'IN_PROGRESS' || targetStatus === 'COMPLETED') {
        return { allowed: false, reason: 'Invalid transition: You must first assign a technician before starting or completing work.' };
      }
      if (targetStatus === 'VERIFIED' || targetStatus === 'CLOSED') {
        return { allowed: false, reason: 'Invalid transition: Work order must be completed and verified before closure.' };
      }
    }

    if (currentStatus === 'ASSIGNED') {
      if (targetStatus === 'COMPLETED' || targetStatus === 'VERIFIED' || targetStatus === 'CLOSED') {
        return { allowed: false, reason: 'Invalid transition: Work order must first be marked In Progress before completion.' };
      }
      if (targetStatus === 'CREATED') {
        return { allowed: false, reason: 'To unassign, clear the technician from the details drawer instead of dragging back.' };
      }
    }

    if (currentStatus === 'IN_PROGRESS') {
      if (targetStatus === 'ASSIGNED') {
        return { allowed: false, reason: 'Invalid transition: Work already in progress cannot be moved backward to Assigned.' };
      }
      if (targetStatus === 'VERIFIED' || targetStatus === 'CLOSED') {
        return { allowed: false, reason: 'Invalid transition: Work must be completed by a technician before verification or closure.' };
      }
    }

    if (currentStatus === 'COMPLETED') {
      if (targetStatus === 'CLOSED') {
        return { allowed: false, reason: 'Invalid transition: Completed work must first be Verified before it can be Closed.' };
      }
      if (targetStatus === 'CREATED' || targetStatus === 'ASSIGNED') {
        return { allowed: false, reason: 'Invalid transition: If repair needs more work, use "Reopen for Rework" to return to In Progress.' };
      }
    }

    if (currentStatus === 'VERIFIED') {
      if (targetStatus !== 'CLOSED') {
        return { allowed: false, reason: 'Invalid transition: Verified work orders can only proceed to Closed.' };
      }
    }

    return { allowed: false, reason: `Cannot transition from ${currentStatus} to ${targetStatus}. Workflow rules prohibit skipping stages.` };
  }

  return { allowed: false, reason: 'Unauthorized action.' };
}

/**
 * Returns allowed next actions for accessible dropdown / button UI
 */
export function getAllowedNextTransitions(workOrder, user) {
  if (!workOrder || !user) return [];
  const status = workOrder.status;
  const role = user.role;
  const isAssignedTech = role === ROLES.TECHNICIAN && workOrder.assignedTechnicianId === user.id;
  const isAdminOrManager = role === ROLES.ADMIN || role === ROLES.MANAGER;

  const actions = [];

  if (status === 'CREATED' && isAdminOrManager) {
    actions.push({
      targetStatus: 'ASSIGNED',
      label: 'Assign Technician',
      modal: 'assign',
      variant: 'primary'
    });
  }

  if (status === 'ASSIGNED' && (isAdminOrManager || isAssignedTech)) {
    actions.push({
      targetStatus: 'IN_PROGRESS',
      label: 'Start Work',
      modal: null,
      variant: 'primary'
    });
  }

  if (status === 'IN_PROGRESS' && (isAdminOrManager || isAssignedTech)) {
    actions.push({
      targetStatus: 'COMPLETED',
      label: 'Mark Completed',
      modal: 'complete',
      variant: 'success'
    });
  }

  if (status === 'COMPLETED' && isAdminOrManager) {
    actions.push({
      targetStatus: 'VERIFIED',
      label: 'Verify Work',
      modal: 'verify',
      variant: 'accent'
    });
    actions.push({
      targetStatus: 'IN_PROGRESS',
      label: 'Reopen for Rework',
      modal: 'rework',
      isRework: true,
      variant: 'danger'
    });
  }

  if (status === 'VERIFIED' && isAdminOrManager) {
    actions.push({
      targetStatus: 'CLOSED',
      label: 'Close Work Order',
      modal: 'close',
      variant: 'secondary'
    });
  }

  return actions;
}
