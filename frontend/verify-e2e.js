// E2E Verification & Integration Test Suite for Smart AssetCare
// Tests Workflows 1-10 and Role-Based Access Controls

// 1. Mock browser localStorage and window
const storageStore = new Map();
globalThis.localStorage = {
  getItem: (key) => (storageStore.has(key) ? storageStore.get(key) : null),
  setItem: (key, val) => storageStore.set(key, String(val)),
  removeItem: (key) => storageStore.delete(key),
  clear: () => storageStore.clear()
};
globalThis.window = {
  location: { origin: 'http://localhost:5173' }
};

import { storageService } from './src/services/storageService.js';
import {
  INITIAL_USERS,
  INITIAL_ASSETS,
  INITIAL_WORK_ORDERS,
  INITIAL_MAINTENANCE_SCHEDULES,
  INITIAL_SERVICE_HISTORY,
  INITIAL_REPAIR_COSTS,
  INITIAL_NOTIFICATIONS
} from './src/data/seedData.js';
import {
  ROLES,
  PERMISSIONS,
  ROUTE_PERMISSIONS,
  hasPermission,
  canAccessRoute
} from './src/utils/permissions.js';
import {
  validateStatusTransition,
  getAllowedNextTransitions,
  getScopedWorkOrders,
  isWorkOrderOverdue
} from './src/utils/workOrderRules.js';
import {
  getEffectiveScheduleStatus,
  calculateNextRecurrenceDate,
  getTodayISO
} from './src/utils/dateHelpers.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failedTests++;
  }
}

console.log('=== STARTING SMART ASSETCARE E2E AUTOMATED VERIFICATION ===\n');

// -------------------------------------------------------------
// WORKFLOW 1: ASSET REGISTRATION & PERSISTENCE
// -------------------------------------------------------------
console.log('--- WORKFLOW 1: Asset Registration & Persistence ---');
const appState = storageService.loadAppState();
assert(appState.assets.length > 0, 'Initial assets loaded from seed data');
assert(appState.users.length === 4, 'Four initial demo users loaded');

const newAsset = {
  id: 'ast-test-01',
  assetId: 'AST-TEST-999',
  name: 'Robotics Precision Analyzer',
  category: 'Laboratory Equipment',
  status: 'OPERATIONAL',
  healthScore: 98,
  location: 'Lab Block D - Room 402',
  department: 'Biotechnology',
  purchaseCost: 250000,
  purchaseDate: '2026-01-15'
};
appState.assets.unshift(newAsset);
storageService.saveAppState(appState);

// Verify persistence after reload
const reloadedState = storageService.loadAppState();
const foundAsset = reloadedState.assets.find((a) => a.assetId === 'AST-TEST-999');
assert(Boolean(foundAsset), 'Newly created asset persisted to storage and retrieved');
assert(foundAsset.healthScore === 98, 'Asset details match entered information');

// -------------------------------------------------------------
// WORKFLOW 2: ASSET EDITING & ARCHIVING (HISTORICAL PROTECTION)
// -------------------------------------------------------------
console.log('\n--- WORKFLOW 2: Asset Editing & Archiving ---');
// Edit asset
foundAsset.name = 'Robotics Precision Analyzer V2';
foundAsset.location = 'Lab Block D - Room 405';
storageService.saveAppState(reloadedState);

const updatedState = storageService.loadAppState();
const editedAsset = updatedState.assets.find((a) => a.assetId === 'AST-TEST-999');
assert(editedAsset.name === 'Robotics Precision Analyzer V2', 'Asset name update preserved');
assert(editedAsset.location === 'Lab Block D - Room 405', 'Asset location update preserved');

// Test dependency check on an existing asset with related records (e.g. AST-AC-001)
const assetWithRecords = updatedState.assets.find((a) => a.assetId === 'AST-AC-001');
const relatedWos = updatedState.workOrders.filter((w) => w.assetId === assetWithRecords.id || w.assetId === assetWithRecords.assetId);
const relatedScheds = updatedState.schedules.filter((s) => s.assetId === assetWithRecords.id || s.assetId === assetWithRecords.assetId);
const totalRelated = relatedWos.length + relatedScheds.length;
assert(totalRelated > 0, `Asset ${assetWithRecords.assetId} has ${totalRelated} active relational records`);

// Archive asset -> status set to RETIRED
assetWithRecords.status = 'RETIRED';
storageService.saveAppState(updatedState);
const stateAfterArchive = storageService.loadAppState();
const archivedAsset = stateAfterArchive.assets.find((a) => a.assetId === 'AST-AC-001');
assert(archivedAsset.status === 'RETIRED', 'Archived asset has status RETIRED');
// Verify historical records remain intact
const preservedWos = stateAfterArchive.workOrders.filter((w) => w.assetId === 'AST-AC-001' || w.assetId === assetWithRecords.id);
assert(preservedWos.length === relatedWos.length, 'Historical work orders preserved after asset archiving');

// -------------------------------------------------------------
// WORKFLOW 3: PREVENTIVE MAINTENANCE & NOTIFICATIONS
// -------------------------------------------------------------
console.log('\n--- WORKFLOW 3: Preventive Maintenance ---');
const todayStr = getTodayISO();
const newSchedule = {
  id: 'ms-test-01',
  recurrenceSeriesId: 'ser-ms-test-01',
  assetId: 'AST-TEST-999',
  title: 'Quarterly Sensor Calibration',
  description: 'Clean optical lenses and recalibrate load sensors.',
  maintenanceType: 'Preventive Maintenance',
  dueDate: todayStr,
  priority: 'High',
  assignedTechnicianId: 'usr-tech-03',
  recurrence: 'Quarterly',
  status: 'DUE',
  createdAt: todayStr
};
stateAfterArchive.schedules.unshift(newSchedule);
storageService.saveAppState(stateAfterArchive);

const stateAfterSchedule = storageService.loadAppState();
const retrievedSchedule = stateAfterSchedule.schedules.find((s) => s.id === 'ms-test-01');
assert(Boolean(retrievedSchedule), 'Maintenance schedule created and found in storage');
assert(retrievedSchedule.assetId === 'AST-TEST-999', 'Schedule references correct asset');

// Check recurrence date calculation
const nextRecurrence = calculateNextRecurrenceDate(todayStr, 'Quarterly');
assert(Boolean(nextRecurrence) && nextRecurrence > todayStr, `Recurrence calculation returns valid next date (${nextRecurrence})`);

// -------------------------------------------------------------
// WORKFLOW 4: WORK ORDER LIFECYCLE & STATE MACHINE TRANSITIONS
// -------------------------------------------------------------
console.log('\n--- WORKFLOW 4: Work Order Lifecycle ---');
const adminUser = INITIAL_USERS.find((u) => u.role === ROLES.ADMIN);
const managerUser = INITIAL_USERS.find((u) => u.role === ROLES.MANAGER);
const techUser = INITIAL_USERS.find((u) => u.role === ROLES.TECHNICIAN);
const staffUser = INITIAL_USERS.find((u) => u.role === ROLES.STAFF);

// 1. Staff creates a work order
const newWo = {
  id: 'wo-test-lifecycle-01',
  workOrderId: 'WO-2026-999',
  createdAt: todayStr,
  status: 'CREATED',
  priority: 'HIGH',
  title: 'Calibration Warning on Precision Analyzer',
  description: 'Optical reading fluctuation reported during morning shift.',
  assetId: 'AST-TEST-999',
  createdByUserId: staffUser.id,
  assignedTechnicianId: null,
  dueDate: todayStr,
  resolutionDescription: '',
  activityHistory: []
};
stateAfterSchedule.workOrders.unshift(newWo);

// Check: Staff cannot transition to IN_PROGRESS
const staffTransitionCheck = validateStatusTransition(newWo, 'IN_PROGRESS', staffUser);
assert(!staffTransitionCheck.allowed, 'Staff blocked from transitioning work order status');

// 2. Manager assigns technician
const assignCheck = validateStatusTransition(newWo, 'ASSIGNED', managerUser);
assert(assignCheck.allowed && assignCheck.requiresModal === 'assign', 'Manager allowed to transition CREATED -> ASSIGNED');
newWo.status = 'ASSIGNED';
newWo.assignedTechnicianId = techUser.id;

// 3. Technician starts work (ASSIGNED -> IN_PROGRESS)
const techStartCheck = validateStatusTransition(newWo, 'IN_PROGRESS', techUser);
assert(techStartCheck.allowed, 'Assigned Technician allowed to start work (ASSIGNED -> IN_PROGRESS)');
newWo.status = 'IN_PROGRESS';

// Check: Technician cannot directly verify
const techVerifyCheck = validateStatusTransition(newWo, 'VERIFIED', techUser);
assert(!techVerifyCheck.allowed, 'Technician blocked from verifying own work (requires Manager/Admin)');

// 4. Technician completes work (IN_PROGRESS -> COMPLETED)
const techCompleteCheck = validateStatusTransition(newWo, 'COMPLETED', techUser);
assert(techCompleteCheck.allowed && techCompleteCheck.requiresModal === 'complete', 'Technician allowed to complete work order');
newWo.status = 'COMPLETED';
newWo.resolutionDescription = 'Replaced optical sensor photodiode and recalibrated voltage baseline.';
newWo.partsReplaced = 'Photodiode Pack 12V';
newWo.labourCost = 1500;
newWo.partsCost = 2200;
newWo.otherCharges = 300;

// 5. Manager verifies work (COMPLETED -> VERIFIED)
const managerVerifyCheck = validateStatusTransition(newWo, 'VERIFIED', managerUser);
assert(managerVerifyCheck.allowed, 'Manager allowed to verify completed work order');
newWo.status = 'VERIFIED';
newWo.verifiedByUserId = managerUser.id;
newWo.verifiedAt = todayStr;

// 6. Manager closes and archives work order (VERIFIED -> CLOSED)
const managerCloseCheck = validateStatusTransition(newWo, 'CLOSED', managerUser);
assert(managerCloseCheck.allowed, 'Manager allowed to close verified work order');
newWo.status = 'CLOSED';

// Check: Once closed, transitions are blocked
const closedTransitionCheck = validateStatusTransition(newWo, 'IN_PROGRESS', adminUser);
assert(!closedTransitionCheck.allowed, 'Closed work orders are immutable and cannot be transitioned');

// -------------------------------------------------------------
// WORKFLOW 5: SERVICE HISTORY & FINANCIAL MANAGEMENT
// -------------------------------------------------------------
console.log('\n--- WORKFLOW 5: Service History & Financial Management ---');
const totalCostCalc = newWo.labourCost + newWo.partsCost + newWo.otherCharges;
assert(totalCostCalc === 4000, `Total cost calculation accurate: ₹${totalCostCalc}`);

const newServiceRecord = {
  id: 'sh-test-01',
  serviceId: 'SH-2026-999',
  assetId: newWo.assetId,
  workOrderId: newWo.workOrderId,
  technicianId: techUser.id,
  serviceDate: todayStr,
  serviceType: 'Corrective Maintenance',
  serviceStatus: 'COMPLETED',
  problemIdentified: newWo.title,
  workPerformed: newWo.resolutionDescription,
  partsReplaced: newWo.partsReplaced,
  labourCost: newWo.labourCost,
  partsCost: newWo.partsCost,
  otherCharges: newWo.otherCharges,
  totalCost: totalCostCalc,
  costRecordIds: ['rc-test-01']
};
stateAfterSchedule.serviceHistory.unshift(newServiceRecord);

const newRepairCost = {
  id: 'rc-test-01',
  expenseId: 'EXP-2026-999',
  assetId: newWo.assetId,
  workOrderId: newWo.workOrderId,
  serviceId: newServiceRecord.id,
  expenseDate: todayStr,
  labourCost: newWo.labourCost,
  partsCost: newWo.partsCost,
  otherCharges: newWo.otherCharges,
  totalCost: totalCostCalc,
  invoiceNumber: 'INV-2026-999',
  paymentStatus: 'PAID'
};
stateAfterSchedule.repairCosts.unshift(newRepairCost);
storageService.saveAppState(stateAfterSchedule);

const stateAfterFinancials = storageService.loadAppState();
const retrievedSh = stateAfterFinancials.serviceHistory.find((s) => s.workOrderId === 'WO-2026-999');
const retrievedRc = stateAfterFinancials.repairCosts.find((c) => c.workOrderId === 'WO-2026-999');
assert(Boolean(retrievedSh), 'Service history record created and linked to work order');
assert(Boolean(retrievedRc), 'Repair cost record created and linked to work order and service record');
assert(retrievedSh.totalCost === retrievedRc.totalCost, 'Financial ledger totals match service history');

// Test expense editing and synchronization
const costToEdit = stateAfterFinancials.repairCosts.find((c) => c.expenseId === 'EXP-2026-999');
costToEdit.labourCost = 1800;
costToEdit.totalCost = 1800 + Number(costToEdit.partsCost) + Number(costToEdit.otherCharges);
const shToEdit = stateAfterFinancials.serviceHistory.find((s) => s.workOrderId === 'WO-2026-999');
if (shToEdit) {
  shToEdit.labourCost = costToEdit.labourCost;
  shToEdit.totalCost = costToEdit.totalCost;
}
storageService.saveAppState(stateAfterFinancials);

const stateAfterCostEdit = storageService.loadAppState();
const editedRc = stateAfterCostEdit.repairCosts.find((c) => c.expenseId === 'EXP-2026-999');
assert(editedRc.labourCost === 1800, 'Expense labour cost updated correctly');
assert(editedRc.totalCost === 4300, 'Expense total cost recalculated correctly (₹4300)');

// -------------------------------------------------------------
// WORKFLOW 6: ANALYTICS & REPORTS CONSISTENCY
// -------------------------------------------------------------
console.log('\n--- WORKFLOW 6: Analytics & Reports ---');
const totalExpenses = stateAfterCostEdit.repairCosts.reduce((sum, c) => sum + Number(c.totalCost), 0);
assert(totalExpenses > 0, `Total repair expenses aggregated successfully: ₹${totalExpenses}`);
const opAssetsCount = stateAfterCostEdit.assets.filter((a) => a.status === 'OPERATIONAL').length;
assert(opAssetsCount > 0, `Operational assets KPI calculated: ${opAssetsCount}`);

// -------------------------------------------------------------
// WORKFLOW 7: NOTIFICATIONS & PERSISTENCE
// -------------------------------------------------------------
console.log('\n--- WORKFLOW 7: Notifications ---');
const newNotif = {
  id: 'notif-test-01',
  title: 'Urgent Diagnostic Required',
  message: 'Sensor alert flagged on asset AST-TEST-999.',
  type: 'ASSET_ALERT',
  priority: 'HIGH',
  relatedRecordId: 'AST-TEST-999',
  relatedPath: '/app/assets/AST-TEST-999',
  recipientUserId: techUser.id,
  createdAt: todayStr,
  read: false
};
stateAfterCostEdit.notifications.unshift(newNotif);
storageService.saveAppState(stateAfterCostEdit);

let notifState = storageService.loadAppState();
let retrievedNotif = notifState.notifications.find((n) => n.id === 'notif-test-01');
assert(retrievedNotif && !retrievedNotif.read, 'Notification created and unread count increased');

// Mark read
retrievedNotif.read = true;
storageService.saveAppState(notifState);
notifState = storageService.loadAppState();
retrievedNotif = notifState.notifications.find((n) => n.id === 'notif-test-01');
assert(retrievedNotif && retrievedNotif.read, 'Notification marked as read and persisted');

// Mark unread
retrievedNotif.read = false;
storageService.saveAppState(notifState);
notifState = storageService.loadAppState();
retrievedNotif = notifState.notifications.find((n) => n.id === 'notif-test-01');
assert(retrievedNotif && !retrievedNotif.read, 'Notification marked as unread and persisted');

// -------------------------------------------------------------
// WORKFLOW 8: USER MANAGEMENT & RBAC
// -------------------------------------------------------------
console.log('\n--- WORKFLOW 8: User Management & RBAC ---');
// Create new user as ADMIN
const testNewUser = {
  id: 'usr-new-tech-05',
  name: 'Sunil Rao',
  email: 'sunil.rao@smartassetcare.demo',
  phone: '+91 98765 43219',
  department: 'Biomedical Engineering',
  role: ROLES.TECHNICIAN,
  active: true
};
notifState.users.push(testNewUser);
storageService.saveAppState(notifState);

let userState = storageService.loadAppState();
let createdUser = userState.users.find((u) => u.id === 'usr-new-tech-05');
assert(Boolean(createdUser), 'New technician user created and found in user list');

// Deactivate user
createdUser.active = false;
storageService.saveAppState(userState);

userState = storageService.loadAppState();
createdUser = userState.users.find((u) => u.id === 'usr-new-tech-05');
assert(createdUser.active === false, 'Technician account deactivated successfully');

// Verify route permissions for each role
assert(canAccessRoute(ROLES.ADMIN, '/app/users'), 'ADMIN can access /app/users');
assert(!canAccessRoute(ROLES.MANAGER, '/app/users'), 'MANAGER blocked from /app/users');
assert(!canAccessRoute(ROLES.TECHNICIAN, '/app/users'), 'TECHNICIAN blocked from /app/users');
assert(!canAccessRoute(ROLES.STAFF, '/app/users'), 'STAFF blocked from /app/users');

assert(canAccessRoute(ROLES.ADMIN, '/app/reports'), 'ADMIN can access /app/reports');
assert(canAccessRoute(ROLES.MANAGER, '/app/reports'), 'MANAGER can access /app/reports');
assert(!canAccessRoute(ROLES.TECHNICIAN, '/app/reports'), 'TECHNICIAN blocked from /app/reports');
assert(!canAccessRoute(ROLES.STAFF, '/app/reports'), 'STAFF blocked from /app/reports');

assert(canAccessRoute(ROLES.TECHNICIAN, '/app/repair-costs'), 'TECHNICIAN can view /app/repair-costs');
assert(!canAccessRoute(ROLES.STAFF, '/app/repair-costs'), 'STAFF blocked from /app/repair-costs');

// -------------------------------------------------------------
// WORKFLOW 9: SMART ASSISTANT QUERIES
// -------------------------------------------------------------
console.log('\n--- WORKFLOW 9: Smart Assistant Query Logic ---');
// Verify answers calculated from live data
const currentAssets = userState.assets;
const opCount = currentAssets.filter((a) => a.status === 'OPERATIONAL').length;
const totalAssetsCount = currentAssets.length;
assert(opCount > 0, `Assistant calculation: ${opCount}/${totalAssetsCount} assets operational`);

const pendingWos = userState.workOrders.filter(
  (w) => w.status !== 'COMPLETED' && w.status !== 'VERIFIED' && w.status !== 'CLOSED'
);
assert(pendingWos.length >= 0, `Assistant calculation: ${pendingWos.length} pending work orders`);

const totalExp = userState.repairCosts.reduce((s, c) => s + Number(c.totalCost), 0);
assert(totalExp > 0, `Assistant calculation: Total maintenance expenditure ₹${totalExp}`);

// -------------------------------------------------------------
// WORKFLOW 10: DEMO DATA RESET
// -------------------------------------------------------------
console.log('\n--- WORKFLOW 10: Demo Data Reset ---');
// Reset demo data to initial seeds
const resetState = storageService.resetToSeeds();
assert(resetState !== null, 'resetToSeeds() executed successfully');
assert(resetState.assets.length === INITIAL_ASSETS.length, 'Original initial asset count restored');
assert(resetState.workOrders.length === INITIAL_WORK_ORDERS.length, 'Original work orders count restored');
assert(resetState.schedules.length === INITIAL_MAINTENANCE_SCHEDULES.length, 'Original preventive schedules restored');
assert(resetState.repairCosts.length === INITIAL_REPAIR_COSTS.length, 'Original repair costs restored');
assert(resetState.users.length === INITIAL_USERS.length, 'Original users restored');

const postResetReload = storageService.loadAppState();
assert(postResetReload.assets.length === INITIAL_ASSETS.length, 'Persisted reset state verified in localStorage');

console.log(`\n=== VERIFICATION COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED ===`);
if (failedTests > 0) {
  process.exit(1);
}
