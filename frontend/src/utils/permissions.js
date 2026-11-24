// Centralized Role-Based Access Control (RBAC) System
export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  TECHNICIAN: 'TECHNICIAN',
  STAFF: 'STAFF',
};

// Route permission mapping
export const ROUTE_PERMISSIONS = {
  '/app/dashboard': [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.STAFF],
  '/app/assets': [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.STAFF],
  '/app/assets/new': [ROLES.ADMIN, ROLES.MANAGER],
  '/app/assets/:id': [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.STAFF],
  '/app/qr-codes': [ROLES.ADMIN, ROLES.MANAGER],
  '/app/maintenance': [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.STAFF],
  '/app/work-orders': [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.STAFF],
  '/app/work-orders/:id': [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.STAFF],
  '/app/service-history': [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.STAFF],
  '/app/repair-costs': [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN],
  '/app/costs': [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN],
  '/app/reports': [ROLES.ADMIN, ROLES.MANAGER],
  '/app/notifications': [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.STAFF],
  '/app/users': [ROLES.ADMIN],
  '/app/settings': [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.STAFF],
};

// Specific feature actions
export const PERMISSIONS = {
  // Assets
  CAN_ADD_ASSET: [ROLES.ADMIN, ROLES.MANAGER],
  CAN_EDIT_ASSET: [ROLES.ADMIN, ROLES.MANAGER],
  CAN_DELETE_ASSET: [ROLES.ADMIN],
  CAN_DOWNLOAD_QR: [ROLES.ADMIN, ROLES.MANAGER],

  // Maintenance
  CAN_CREATE_SCHEDULE: [ROLES.ADMIN, ROLES.MANAGER],
  CAN_EDIT_SCHEDULE: [ROLES.ADMIN, ROLES.MANAGER],
  CAN_CANCEL_SCHEDULE: [ROLES.ADMIN, ROLES.MANAGER],
  CAN_COMPLETE_SCHEDULE: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN],
  CAN_RESCHEDULE: [ROLES.ADMIN, ROLES.MANAGER],
  CAN_CREATE_WO_FROM_SCHEDULE: [ROLES.ADMIN, ROLES.MANAGER],

  // Work Orders
  CAN_CREATE_WORK_ORDER: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],
  CAN_ASSIGN_TECHNICIAN: [ROLES.ADMIN, ROLES.MANAGER],
  CAN_UPDATE_WORK_ORDER_STATUS: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN],
  CAN_VERIFY_WORK_ORDER: [ROLES.ADMIN, ROLES.MANAGER],
  CAN_CLOSE_WORK_ORDER: [ROLES.ADMIN, ROLES.MANAGER],

  // Service & Costs
  CAN_VIEW_SERVICE_HISTORY: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.STAFF],
  CAN_ADD_SERVICE_RECORD: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN],
  CAN_EDIT_SERVICE_RECORD: [ROLES.ADMIN, ROLES.MANAGER],
  CAN_VIEW_REPAIR_COSTS: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN],
  CAN_MANAGE_REPAIR_COSTS: [ROLES.ADMIN, ROLES.MANAGER],
  CAN_MANAGE_INVOICES: [ROLES.ADMIN, ROLES.MANAGER],
  CAN_EXPORT_FINANCIAL_REPORTS: [ROLES.ADMIN, ROLES.MANAGER],
  CAN_ADD_SERVICE_NOTE: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN],
  CAN_RECORD_REPAIR_COST: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN],

  // Reports & Administration
  CAN_VIEW_REPORTS: [ROLES.ADMIN, ROLES.MANAGER],
  CAN_EXPORT_REPORTS: [ROLES.ADMIN, ROLES.MANAGER],
  CAN_MANAGE_USERS: [ROLES.ADMIN],
  CAN_RESET_DEMO_DATA: [ROLES.ADMIN],
};

// Helper to test specific permission
export function hasPermission(userRole, permissionKey) {
  if (!userRole) return false;
  const allowedRoles = PERMISSIONS[permissionKey];
  return Array.isArray(allowedRoles) && allowedRoles.includes(userRole);
}

// Helper to check route access
export function canAccessRoute(userRole, pathname) {
  if (!userRole) return false;

  const cleanPath = pathname && pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  // Exact match first
  if (ROUTE_PERMISSIONS[cleanPath]) {
    return ROUTE_PERMISSIONS[cleanPath].includes(userRole);
  }

  // Parameterized match (e.g. /app/assets/AST-001)
  for (const [routePattern, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (routePattern.includes(':')) {
      const regexStr = '^' + routePattern.replace(/:[^/]+/g, '[^/]+') + '$';
      const regex = new RegExp(regexStr);
      if (regex.test(cleanPath)) {
        return allowedRoles.includes(userRole);
      }
    }
  }

  // Default allow
  return true;
}

// Role badge styling helper
export function getRoleBadgeStyle(role) {
  switch (role) {
    case ROLES.ADMIN:
      return {
        bg: 'bg-status-critical/15 text-status-critical border-status-critical/30',
        label: 'Institutional Admin',
        dot: 'bg-status-critical'
      };
    case ROLES.MANAGER:
      return {
        bg: 'bg-accent-primary/15 text-accent-primary border-accent-primary/30',
        label: 'Facility Manager',
        dot: 'bg-accent-primary'
      };
    case ROLES.TECHNICIAN:
      return {
        bg: 'bg-status-warning/15 text-status-warning border-status-warning/30',
        label: 'Field Technician',
        dot: 'bg-status-warning'
      };
    case ROLES.STAFF:
      return {
        bg: 'bg-status-info/15 text-status-info border-status-info/30',
        label: 'Faculty & Staff',
        dot: 'bg-status-info'
      };
    default:
      return {
        bg: 'bg-white/10 text-text-secondary border-white/20',
        label: role || 'Unknown',
        dot: 'bg-text-muted'
      };
  }
}
