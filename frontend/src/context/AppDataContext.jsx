import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { useAuth } from './AuthContext';
import {
  getEffectiveScheduleStatus,
  calculateNextRecurrenceDate,
  getTodayISO
} from '../utils/dateHelpers';
import {
  isWorkOrderOverdue,
  getScopedWorkOrders
} from '../utils/workOrderRules';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const { currentUser } = useAuth();

  // Load state from localStorage / seedData
  const [appState, setAppState] = useState(() => {
    return storageService.loadAppState();
  });

  // Automatically persist changes to localStorage
  useEffect(() => {
    storageService.saveAppState(appState);
  }, [appState]);

  // Destructure collections
  const {
    users = [],
    assets = [],
    workOrders = [],
    schedules = [],
    serviceHistory = [],
    repairCosts = [],
    notifications = []
  } = appState;

  // -------------------------------------------------------------
  // ASSET ACTIONS
  // -------------------------------------------------------------
  const addAsset = useCallback((newAssetData) => {
    const newAsset = {
      ...newAssetData,
      id: `ast-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      healthScore: newAssetData.healthScore || 95,
      status: newAssetData.status || 'OPERATIONAL'
    };

    setAppState((prev) => ({
      ...prev,
      assets: [newAsset, ...prev.assets]
    }));

    return newAsset;
  }, []);

  const updateAsset = useCallback((assetId, updates) => {
    setAppState((prev) => ({
      ...prev,
      assets: prev.assets.map((ast) =>
        ast.id === assetId || ast.assetId === assetId
          ? { ...ast, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
          : ast
      )
    }));
  }, []);

  const deleteAsset = useCallback((assetId) => {
    setAppState((prev) => ({
      ...prev,
      assets: prev.assets.filter((ast) => ast.id !== assetId && ast.assetId !== assetId)
    }));
  }, []);

  const archiveAsset = useCallback((assetId) => {
    setAppState((prev) => ({
      ...prev,
      assets: prev.assets.map((ast) =>
        ast.id === assetId || ast.assetId === assetId
          ? { ...ast, status: 'RETIRED', updatedAt: new Date().toISOString().split('T')[0] }
          : ast
      )
    }));
  }, []);

  const isAssetIdUnique = useCallback((assetId, currentAssetId = null) => {
    if (!assetId) return false;
    const clean = assetId.trim().toUpperCase();
    return !assets.some(
      (a) =>
        a.assetId.toUpperCase() === clean &&
        a.id !== currentAssetId &&
        a.assetId !== currentAssetId
    );
  }, [assets]);

  const hasRelatedRecords = useCallback((assetId) => {
    const asset = assets.find((a) => a.id === assetId || a.assetId === assetId);
    const targetId = asset?.id || assetId;
    const targetCode = asset?.assetId || assetId;

    const matchedWo = workOrders.filter(
      (w) => w.assetId === targetId || w.assetId === targetCode
    );
    const matchedSched = schedules.filter(
      (s) => s.assetId === targetId || s.assetId === targetCode
    );
    const matchedHistory = serviceHistory.filter(
      (sh) => sh.assetId === targetId || sh.assetId === targetCode
    );
    const matchedCosts = repairCosts.filter(
      (rc) => rc.assetId === targetId || rc.assetId === targetCode
    );

    const totalCount =
      matchedWo.length + matchedSched.length + matchedHistory.length + matchedCosts.length;

    return {
      hasRecords: totalCount > 0,
      workOrdersCount: matchedWo.length,
      schedulesCount: matchedSched.length,
      serviceHistoryCount: matchedHistory.length,
      repairCostsCount: matchedCosts.length,
      totalCount
    };
  }, [assets, workOrders, schedules, serviceHistory, repairCosts]);

  const getAsset = useCallback((idOrAssetId) => {
    if (!idOrAssetId) return null;
    return assets.find(
      (a) => a.id === idOrAssetId || a.assetId === idOrAssetId
    ) || null;
  }, [assets]);

  // -------------------------------------------------------------
  // WORK ORDER ACTIONS
  // -------------------------------------------------------------
  const createWorkOrder = useCallback((woData) => {
    let createdWo = null;
    setAppState((prev) => {
      // Find highest numeric ID in existing workOrderId to guarantee uniqueness
      let maxNum = 0;
      prev.workOrders.forEach((w) => {
        const match = (w.workOrderId || '').match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      const nextNumber = String(maxNum + 1).padStart(3, '0');
      const initialStatus = woData.assignedTechnicianId ? 'ASSIGNED' : 'CREATED';
      const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const todayISO = getTodayISO();

      const assignedTech = prev.users.find((u) => u.id === woData.assignedTechnicianId);

      createdWo = {
        id: `wo-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        workOrderId: `WO-2026-${nextNumber}`,
        createdAt: todayISO,
        status: initialStatus,
        priority: woData.priority || 'MEDIUM',
        title: woData.title || '',
        description: woData.description || '',
        assetId: woData.assetId,
        createdByUserId: woData.createdByUserId || currentUser?.id || 'usr-staff-04',
        assignedTechnicianId: woData.assignedTechnicianId || null,
        dueDate: woData.dueDate || todayISO,
        linkedScheduleId: woData.linkedScheduleId || woData.maintenanceScheduleId || null,
        resolutionDescription: '',
        progressNotes: [],
        activityHistory: [
          {
            id: `act-${Date.now()}-init`,
            timestamp: nowTimestamp,
            actorId: currentUser?.id,
            actorName: currentUser?.name || 'User',
            action: `Work order created${woData.assignedTechnicianId ? ` and assigned to ${assignedTech?.name || 'technician'}` : ''}`,
            fromStatus: null,
            toStatus: initialStatus,
            note: woData.description || 'Initial creation'
          }
        ],
        ...woData
      };

      // Also link in schedule if scheduleId was given
      let updatedSchedules = prev.schedules;
      const targetSchedId = woData.linkedScheduleId || woData.maintenanceScheduleId;
      if (targetSchedId) {
        updatedSchedules = prev.schedules.map((s) =>
          s.id === targetSchedId ? { ...s, linkedWorkOrderId: createdWo.workOrderId } : s
        );
      }

      return {
        ...prev,
        workOrders: [createdWo, ...prev.workOrders],
        schedules: updatedSchedules
      };
    });

    return createdWo;
  }, [currentUser]);

  const updateWorkOrderStatus = useCallback((workOrderId, nextStatus, options = {}) => {
    let updatedRecord = null;
    const note = typeof options === 'string' ? options : options.note || '';
    const resolutionDescription = typeof options === 'object' ? options.resolutionDescription : '';
    const reworkReason = typeof options === 'object' ? options.reworkReason : '';
    const actionLabel = typeof options === 'object' ? options.actionLabel : '';

    setAppState((prev) => {
      const todayISO = getTodayISO();
      const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
      let linkedSchedToComplete = null;

      const updatedWorkOrders = prev.workOrders.map((wo) => {
        if (wo.id === workOrderId || wo.workOrderId === workOrderId) {
          const fromStatus = wo.status;
          const historyEntry = {
            id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            timestamp: nowTimestamp,
            actorId: currentUser?.id,
            actorName: currentUser?.name || 'User',
            action: actionLabel || `Status changed from ${fromStatus} to ${nextStatus}`,
            fromStatus,
            toStatus: nextStatus,
            note: note || resolutionDescription || reworkReason || ''
          };

          const updated = {
            ...wo,
            status: nextStatus,
            activityHistory: [...(wo.activityHistory || []), historyEntry]
          };

          if (resolutionDescription) {
            updated.resolutionDescription = resolutionDescription;
          }

          if (typeof options === 'object') {
            if (options.partsReplaced !== undefined) updated.partsReplaced = options.partsReplaced;
            if (options.labourCost !== undefined) updated.labourCost = options.labourCost;
            if (options.partsCost !== undefined) updated.partsCost = options.partsCost;
            if (options.otherCharges !== undefined) updated.otherCharges = options.otherCharges;
          }

          if (nextStatus === 'VERIFIED') {
            updated.verifiedByUserId = currentUser?.id;
            updated.verifiedAt = todayISO;
            updated.verificationNote = note || '';

            // Flag linked schedule for completion
            if (wo.linkedScheduleId || wo.maintenanceScheduleId) {
              linkedSchedToComplete = wo.linkedScheduleId || wo.maintenanceScheduleId;
            }
          }

          if (nextStatus === 'CLOSED') {
            updated.closedByUserId = currentUser?.id;
            updated.closedAt = todayISO;
            updated.closureNote = note || '';
          }

          if (reworkReason) {
            updated.reworkReason = reworkReason;
          }

          updatedRecord = updated;
          return updated;
        }
        return wo;
      });

      // If a linked maintenance schedule needs to be completed upon verification (Section 14)
      let updatedSchedules = prev.schedules;
      if (linkedSchedToComplete) {
        const targetSched = prev.schedules.find(
          (s) =>
            (s.id === linkedSchedToComplete ||
              s.linkedWorkOrderId === updatedRecord?.workOrderId ||
              s.linkedWorkOrderId === updatedRecord?.id) &&
            s.status !== 'COMPLETED'
        );
        if (targetSched) {
          const seriesId = targetSched.recurrenceSeriesId || `ser-${targetSched.id}`;
          updatedSchedules = prev.schedules.map((s) => {
            if (s.id === targetSched.id) {
              return {
                ...s,
                status: 'COMPLETED',
                completedAt: todayISO,
                completionNotes: `Verified via Work Order ${updatedRecord?.workOrderId}`
              };
            }
            return s;
          });

          // Recurrence progression check
          if (targetSched.recurrence && targetSched.recurrence !== 'One Time') {
            const nextDueDate = calculateNextRecurrenceDate(targetSched.dueDate, targetSched.recurrence, todayISO);
            if (nextDueDate) {
              const existingActive = prev.schedules.some(
                (s) =>
                  s.recurrenceSeriesId === seriesId &&
                  s.id !== targetSched.id &&
                  s.status !== 'COMPLETED' &&
                  s.status !== 'CANCELLED'
              );
              if (!existingActive) {
                const nextId = `ms-${Date.now().toString(36)}-next`;
                const createdNextSchedule = {
                  id: nextId,
                  recurrenceSeriesId: seriesId,
                  assetId: targetSched.assetId,
                  title: targetSched.title,
                  description: targetSched.description,
                  maintenanceType: targetSched.maintenanceType,
                  dueDate: nextDueDate,
                  priority: targetSched.priority,
                  assignedTechnicianId: targetSched.assignedTechnicianId,
                  recurrence: targetSched.recurrence,
                  status: getEffectiveScheduleStatus({ dueDate: nextDueDate, status: 'UPCOMING' }),
                  notes: targetSched.notes || '',
                  createdAt: todayISO
                };
                updatedSchedules.unshift(createdNextSchedule);
              }
            }
          }
        }
      }

      // If nextStatus === 'VERIFIED', automatically generate a Service History and Repair Cost record if not already created (Section 1.4 & 2.6)
      let updatedServiceHistory = prev.serviceHistory;
      let updatedRepairCosts = prev.repairCosts;
      let updatedAssets = prev.assets;

      if (nextStatus === 'VERIFIED' && updatedRecord) {
        const alreadyLogged = prev.serviceHistory.some(
          (sh) =>
            sh.workOrderId === updatedRecord.workOrderId ||
            sh.workOrderId === updatedRecord.id
        );

        if (!alreadyLogged) {
          let maxShNum = 0;
          prev.serviceHistory.forEach((sh) => {
            const match = (sh.serviceId || sh.id || '').match(/(\d+)$/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxShNum) maxShNum = num;
            }
          });
          const nextShNum = String(maxShNum + 1).padStart(3, '0');

          let maxExpNum = 0;
          prev.repairCosts.forEach((rc) => {
            const match = (rc.expenseId || rc.id || '').match(/(\d+)$/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxExpNum) maxExpNum = num;
            }
          });
          const nextExpNum = String(maxExpNum + 1).padStart(3, '0');

          const newShId = `sh-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
          const newRcId = `rc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

          const labourCost = Number(updatedRecord.labourCost) || 1200;
          const partsCost = Number(updatedRecord.partsCost) || 850;
          const otherCharges = Number(updatedRecord.otherCharges) || 150;
          const totalCost = labourCost + partsCost + otherCharges;

          const createdServiceRecord = {
            id: newShId,
            serviceId: `SH-2026-${nextShNum}`,
            assetId: updatedRecord.assetId,
            workOrderId: updatedRecord.workOrderId,
            technicianId: updatedRecord.assignedTechnicianId || currentUser?.id || 'usr-tech-03',
            serviceDate: todayISO,
            serviceType: updatedRecord.linkedScheduleId
              ? 'Preventive Maintenance'
              : updatedRecord.priority === 'CRITICAL'
              ? 'Emergency Repair'
              : 'Corrective Maintenance',
            serviceStatus: 'COMPLETED',
            problemIdentified: updatedRecord.title,
            serviceDescription: updatedRecord.description || updatedRecord.title,
            workPerformed: updatedRecord.resolutionDescription || 'Inspected, repaired and tested.',
            actionTaken: updatedRecord.resolutionDescription || 'Certified operational by technician.',
            partsReplaced: updatedRecord.partsReplaced || 'Standard service consumables',
            labourCost,
            partsCost,
            otherCharges,
            totalCost,
            finalRemarks: updatedRecord.verificationNote || 'Verified and signed off by management.',
            managerRemarks: updatedRecord.verificationNote || 'Approved.',
            costRecordIds: [newRcId],
            attachmentIds: []
          };

          const createdRepairCost = {
            id: newRcId,
            expenseId: `EXP-2026-${nextExpNum}`,
            assetId: updatedRecord.assetId,
            workOrderId: updatedRecord.workOrderId,
            serviceId: newShId,
            serviceDate: todayISO,
            expenseDate: todayISO,
            labourCost,
            partsCost,
            otherCharges,
            totalCost,
            invoiceNumber: `INV-2026-${nextExpNum}`,
            invoiceName: `INV-2026-${nextExpNum}.pdf`,
            invoiceFileSize: '1.2 MB',
            paymentStatus: 'PAID',
            description: `[WO Verified] ${updatedRecord.title}`,
            notes: `Auto-generated financial ledger entry from verified Work Order ${updatedRecord.workOrderId}`,
            createdByUserId: currentUser?.id
          };

          updatedServiceHistory = [createdServiceRecord, ...prev.serviceHistory];
          updatedRepairCosts = [createdRepairCost, ...prev.repairCosts];

          // Update asset's lastServiceDate and health
          updatedAssets = prev.assets.map((a) =>
            a.id === updatedRecord.assetId || a.assetId === updatedRecord.assetId
              ? {
                  ...a,
                  lastServiceDate: todayISO,
                  healthScore: Math.min(100, (a.healthScore || 80) + 4)
                }
              : a
          );
        }
      }

      return {
        ...prev,
        workOrders: updatedWorkOrders,
        schedules: updatedSchedules,
        serviceHistory: updatedServiceHistory,
        repairCosts: updatedRepairCosts,
        assets: updatedAssets
      };
    });

    return updatedRecord;
  }, [currentUser]);

  const assignTechnician = useCallback((workOrderId, technicianId) => {
    let updatedWo = null;
    setAppState((prev) => {
      const tech = prev.users.find((u) => u.id === technicianId);
      const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

      const updatedWorkOrders = prev.workOrders.map((wo) => {
        if (wo.id === workOrderId || wo.workOrderId === workOrderId) {
          const fromStatus = wo.status;
          const nextStatus = wo.status === 'CREATED' ? 'ASSIGNED' : wo.status;
          const historyEntry = {
            id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            timestamp: nowTimestamp,
            actorId: currentUser?.id,
            actorName: currentUser?.name || 'Manager',
            action: `Technician assigned: ${tech?.name || 'Unassigned'}`,
            fromStatus,
            toStatus: nextStatus,
            note: `Assigned to ${tech?.name} (${tech?.department || 'Operations'})`
          };
          updatedWo = {
            ...wo,
            assignedTechnicianId: technicianId,
            status: nextStatus,
            activityHistory: [...(wo.activityHistory || []), historyEntry]
          };
          return updatedWo;
        }
        return wo;
      });

      return { ...prev, workOrders: updatedWorkOrders };
    });
    return updatedWo;
  }, [currentUser]);

  const addProgressNote = useCallback((workOrderId, noteText) => {
    if (!noteText || !noteText.trim()) return;
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const noteId = `note-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newNote = {
      id: noteId,
      text: noteText.trim(),
      createdByUserId: currentUser?.id,
      createdByName: currentUser?.name || 'Technician',
      createdAt: nowTimestamp
    };

    setAppState((prev) => ({
      ...prev,
      workOrders: prev.workOrders.map((wo) => {
        if (wo.id === workOrderId || wo.workOrderId === workOrderId) {
          const historyEntry = {
            id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            timestamp: nowTimestamp,
            actorId: currentUser?.id,
            actorName: currentUser?.name || 'Technician',
            action: 'Progress Note Logged',
            fromStatus: wo.status,
            toStatus: wo.status,
            note: noteText.trim()
          };
          return {
            ...wo,
            progressNotes: [...(wo.progressNotes || []), newNote],
            activityHistory: [...(wo.activityHistory || []), historyEntry]
          };
        }
        return wo;
      })
    }));
  }, [currentUser]);

  const reopenForRework = useCallback((workOrderId, reworkReason) => {
    return updateWorkOrderStatus(workOrderId, 'IN_PROGRESS', {
      reworkReason,
      note: reworkReason,
      actionLabel: 'Reopened for Rework'
    });
  }, [updateWorkOrderStatus]);

  const verifyWorkOrder = useCallback((workOrderId, options = '') => {
    const note = typeof options === 'string' ? options : options.note || '';
    const labourCost = typeof options === 'object' ? options.labourCost : undefined;
    const partsCost = typeof options === 'object' ? options.partsCost : undefined;
    const otherCharges = typeof options === 'object' ? options.otherCharges : undefined;
    return updateWorkOrderStatus(workOrderId, 'VERIFIED', {
      note,
      labourCost,
      partsCost,
      otherCharges,
      actionLabel: 'Verified by Management'
    });
  }, [updateWorkOrderStatus]);

  const closeWorkOrder = useCallback((workOrderId, closureNote = '') => {
    return updateWorkOrderStatus(workOrderId, 'CLOSED', {
      note: closureNote,
      actionLabel: 'Closed & Archived'
    });
  }, [updateWorkOrderStatus]);

  // -------------------------------------------------------------
  // MAINTENANCE SCHEDULE ACTIONS
  // -------------------------------------------------------------
  const addSchedule = useCallback((schedData) => {
    const todayISO = getTodayISO();
    const newId = `ms-${Date.now().toString(36)}`;
    const effectiveStatus = getEffectiveScheduleStatus({
      dueDate: schedData.dueDate,
      status: schedData.status || 'UPCOMING'
    });

    const newSched = {
      ...schedData,
      id: newId,
      recurrenceSeriesId: schedData.recurrenceSeriesId || `ser-${newId}`,
      createdAt: todayISO,
      status: effectiveStatus
    };

    setAppState((prev) => ({
      ...prev,
      schedules: [newSched, ...prev.schedules]
    }));

    return newSched;
  }, []);

  const updateSchedule = useCallback((schedId, updates) => {
    setAppState((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s) => {
        if (s.id === schedId) {
          const updated = { ...s, ...updates };
          // Recalculate status if dueDate changed and not completed/cancelled
          if (updates.dueDate && updated.status !== 'COMPLETED' && updated.status !== 'CANCELLED') {
            updated.status = getEffectiveScheduleStatus(updated);
          }
          return updated;
        }
        return s;
      })
    }));
  }, []);

  /**
   * Idempotent completion handler with recurrence progression (Section 12)
   */
  const completeSchedule = useCallback((schedId, completionNotes = '') => {
    const todayISO = getTodayISO();
    let createdNextSchedule = null;

    setAppState((prev) => {
      const target = prev.schedules.find((s) => s.id === schedId);
      if (!target) return prev;

      // Idempotency: if already completed, do nothing
      if (target.status === 'COMPLETED') return prev;

      const seriesId = target.recurrenceSeriesId || `ser-${target.id}`;

      // Mark current occurrence as completed
      const updatedSchedules = prev.schedules.map((s) => {
        if (s.id === schedId) {
          return {
            ...s,
            status: 'COMPLETED',
            completedAt: todayISO,
            completionNotes: completionNotes || 'Routine service executed successfully'
          };
        }
        return s;
      });

      // Calculate next occurrence if recurring
      if (target.recurrence && target.recurrence !== 'One Time') {
        const nextDueDate = calculateNextRecurrenceDate(target.dueDate, target.recurrence, todayISO);

        if (nextDueDate) {
          // Check if an active uncompleted schedule in this series already exists
          const existingActive = prev.schedules.some(
            (s) =>
              s.recurrenceSeriesId === seriesId &&
              s.id !== schedId &&
              s.status !== 'COMPLETED' &&
              s.status !== 'CANCELLED'
          );

          if (!existingActive) {
            const nextId = `ms-${Date.now().toString(36)}-next`;
            createdNextSchedule = {
              id: nextId,
              recurrenceSeriesId: seriesId,
              assetId: target.assetId,
              title: target.title,
              description: target.description,
              maintenanceType: target.maintenanceType,
              dueDate: nextDueDate,
              priority: target.priority,
              assignedTechnicianId: target.assignedTechnicianId,
              recurrence: target.recurrence,
              status: getEffectiveScheduleStatus({ dueDate: nextDueDate, status: 'UPCOMING' }),
              notes: target.notes || '',
              createdAt: todayISO
            };

            updatedSchedules.unshift(createdNextSchedule);
          }
        }
      }

      return {
        ...prev,
        schedules: updatedSchedules
      };
    });

    return { success: true, nextSchedule: createdNextSchedule };
  }, []);

  const cancelSchedule = useCallback((schedId, cancellationReason = '') => {
    const todayISO = getTodayISO();
    setAppState((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s) =>
        s.id === schedId
          ? {
              ...s,
              status: 'CANCELLED',
              cancellationReason: cancellationReason || 'Cancelled by manager',
              cancelledAt: todayISO
            }
          : s
      )
    }));
  }, []);

  const rescheduleSchedule = useCallback((schedId, newDueDate, rescheduleReason = '') => {
    setAppState((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s) => {
        if (s.id === schedId) {
          const updated = {
            ...s,
            dueDate: newDueDate,
            rescheduleReason,
            rescheduledAt: getTodayISO()
          };
          if (updated.status !== 'COMPLETED' && updated.status !== 'CANCELLED') {
            updated.status = getEffectiveScheduleStatus(updated);
          }
          return updated;
        }
        return s;
      })
    }));
  }, []);

  const createWorkOrderFromSchedule = useCallback((schedId) => {
    let createdWo = null;
    setAppState((prev) => {
      const schedule = prev.schedules.find((s) => s.id === schedId);
      if (!schedule) return prev;

      // Prevent duplicate work orders if already linked
      if (schedule.linkedWorkOrderId) {
        return prev;
      }

      let maxNum = 0;
      prev.workOrders.forEach((w) => {
        const match = (w.workOrderId || '').match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      const nextNumber = String(maxNum + 1).padStart(3, '0');
      const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const todayISO = getTodayISO();

      createdWo = {
        id: `wo-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        workOrderId: `WO-2026-${nextNumber}`,
        assetId: schedule.assetId,
        title: `[Maint] ${schedule.title}`,
        description: schedule.description || `Generated from scheduled maintenance ${schedule.id}`,
        priority: (schedule.priority || 'MEDIUM').toUpperCase(),
        createdByUserId: currentUser?.id || 'usr-manager-02',
        assignedTechnicianId: schedule.assignedTechnicianId || null,
        createdAt: todayISO,
        dueDate: schedule.dueDate,
        status: schedule.assignedTechnicianId ? 'ASSIGNED' : 'CREATED',
        linkedScheduleId: schedule.id,
        resolutionDescription: '',
        progressNotes: [],
        activityHistory: [
          {
            id: `act-${Date.now()}-sched-init`,
            timestamp: nowTimestamp,
            actorId: currentUser?.id,
            actorName: currentUser?.name || 'Manager',
            action: `Generated from maintenance schedule ${schedule.id}`,
            fromStatus: null,
            toStatus: schedule.assignedTechnicianId ? 'ASSIGNED' : 'CREATED',
            note: schedule.title
          }
        ]
      };

      // Link work order ID in the schedule
      const updatedSchedules = prev.schedules.map((s) =>
        s.id === schedId ? { ...s, linkedWorkOrderId: createdWo.workOrderId } : s
      );

      return {
        ...prev,
        workOrders: [createdWo, ...prev.workOrders],
        schedules: updatedSchedules
      };
    });

    return createdWo;
  }, [currentUser]);

  // -------------------------------------------------------------
  // SERVICE HISTORY & REPAIR COST ACTIONS
  // -------------------------------------------------------------
  const addServiceRecord = useCallback((historyData) => {
    let created = null;
    setAppState((prev) => {
      let maxShNum = 0;
      prev.serviceHistory.forEach((sh) => {
        const match = (sh.serviceId || sh.id || '').match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxShNum) maxShNum = num;
        }
      });
      const nextShNum = String(maxShNum + 1).padStart(3, '0');
      const todayISO = getTodayISO();

      const labourCost = Number(historyData.labourCost) || 0;
      const partsCost = Number(historyData.partsCost) || 0;
      const otherCharges = Number(historyData.otherCharges) || 0;
      const totalCost = labourCost + partsCost + otherCharges;

      created = {
        id: `sh-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        serviceId: `SH-2026-${nextShNum}`,
        serviceDate: historyData.serviceDate || todayISO,
        serviceType: historyData.serviceType || 'Preventive Maintenance',
        serviceStatus: historyData.serviceStatus || 'COMPLETED',
        problemIdentified: historyData.problemIdentified || '',
        serviceDescription: historyData.serviceDescription || '',
        workPerformed: historyData.workPerformed || historyData.actionTaken || '',
        actionTaken: historyData.actionTaken || historyData.workPerformed || '',
        partsReplaced: historyData.partsReplaced || 'None',
        technicianId: historyData.technicianId || currentUser?.id || 'usr-tech-03',
        labourCost,
        partsCost,
        otherCharges,
        totalCost,
        finalRemarks: historyData.finalRemarks || '',
        managerRemarks: historyData.managerRemarks || '',
        costRecordIds: historyData.costRecordIds || [],
        attachmentIds: historyData.attachmentIds || [],
        ...historyData
      };

      // Update asset's lastServiceDate
      const updatedAssets = prev.assets.map((a) =>
        a.id === created.assetId || a.assetId === created.assetId
          ? { ...a, lastServiceDate: created.serviceDate }
          : a
      );

      return {
        ...prev,
        serviceHistory: [created, ...prev.serviceHistory],
        assets: updatedAssets
      };
    });
    return created;
  }, [currentUser]);

  const updateServiceRecord = useCallback((id, updates) => {
    setAppState((prev) => {
      let updatedTotalCost = undefined;
      const updatedHistory = prev.serviceHistory.map((sh) => {
        if (sh.id === id || sh.serviceId === id) {
          const labour = Number(updates.labourCost !== undefined ? updates.labourCost : sh.labourCost) || 0;
          const parts = Number(updates.partsCost !== undefined ? updates.partsCost : sh.partsCost) || 0;
          const other = Number(updates.otherCharges !== undefined ? updates.otherCharges : sh.otherCharges) || 0;
          const total = labour + parts + other;
          updatedTotalCost = total;

          return {
            ...sh,
            ...updates,
            labourCost: labour,
            partsCost: parts,
            otherCharges: other,
            totalCost: total
          };
        }
        return sh;
      });

      // Synchronize linked repair cost if cost changed
      let updatedCosts = prev.repairCosts;
      if (updatedTotalCost !== undefined) {
        updatedCosts = prev.repairCosts.map((rc) => {
          if (rc.serviceId === id || rc.id === updates.costRecordId) {
            const labour = Number(updates.labourCost !== undefined ? updates.labourCost : rc.labourCost) || 0;
            const parts = Number(updates.partsCost !== undefined ? updates.partsCost : rc.partsCost) || 0;
            const other = Number(updates.otherCharges !== undefined ? updates.otherCharges : rc.otherCharges) || 0;
            return {
              ...rc,
              labourCost: labour,
              partsCost: parts,
              otherCharges: other,
              totalCost: labour + parts + other
            };
          }
          return rc;
        });
      }

      return {
        ...prev,
        serviceHistory: updatedHistory,
        repairCosts: updatedCosts
      };
    });
  }, []);

  const deleteServiceRecord = useCallback((id) => {
    setAppState((prev) => ({
      ...prev,
      serviceHistory: prev.serviceHistory.filter((sh) => sh.id !== id && sh.serviceId !== id)
    }));
  }, []);

  const addRepairCost = useCallback((costData) => {
    let created = null;
    setAppState((prev) => {
      let maxExpNum = 0;
      prev.repairCosts.forEach((rc) => {
        const match = (rc.expenseId || rc.id || '').match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxExpNum) maxExpNum = num;
        }
      });
      const nextExpNum = String(maxExpNum + 1).padStart(3, '0');
      const todayISO = getTodayISO();

      const labour = Number(costData.labourCost) || 0;
      const parts = Number(costData.partsCost) || 0;
      const other = Number(costData.otherCharges) || 0;
      const total = labour + parts + other;

      created = {
        id: `rc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        expenseId: `EXP-2026-${nextExpNum}`,
        assetId: costData.assetId,
        workOrderId: costData.workOrderId || null,
        serviceId: costData.serviceId || null,
        serviceDate: costData.expenseDate || costData.serviceDate || todayISO,
        expenseDate: costData.expenseDate || costData.serviceDate || todayISO,
        labourCost: labour,
        partsCost: parts,
        otherCharges: other,
        totalCost: total,
        invoiceNumber: costData.invoiceNumber || `INV-2026-${nextExpNum}`,
        invoiceName: costData.invoiceName || `${costData.invoiceNumber || `INV-2026-${nextExpNum}`}.pdf`,
        invoiceFileSize: costData.invoiceFileSize || '1.1 MB',
        paymentStatus: costData.paymentStatus || 'PAID',
        description: costData.description || 'Maintenance service expenditure',
        notes: costData.notes || '',
        createdByUserId: currentUser?.id,
        ...costData
      };

      // Also update linked service record cost summary if serviceId was linked
      let updatedServiceHistory = prev.serviceHistory;
      if (created.serviceId) {
        updatedServiceHistory = prev.serviceHistory.map((sh) => {
          if (sh.id === created.serviceId || sh.serviceId === created.serviceId) {
            return {
              ...sh,
              labourCost: labour,
              partsCost: parts,
              otherCharges: other,
              totalCost: total,
              costRecordIds: Array.from(new Set([...(sh.costRecordIds || []), created.id]))
            };
          }
          return sh;
        });
      }

      return {
        ...prev,
        repairCosts: [created, ...prev.repairCosts],
        serviceHistory: updatedServiceHistory
      };
    });
    return created;
  }, [currentUser]);

  const updateRepairCost = useCallback((id, updates) => {
    setAppState((prev) => {
      let targetServiceId = null;
      let finalLabour = 0;
      let finalParts = 0;
      let finalOther = 0;
      let finalTotal = 0;

      const updatedCosts = prev.repairCosts.map((rc) => {
        if (rc.id === id || rc.expenseId === id) {
          const labour = Number(updates.labourCost !== undefined ? updates.labourCost : rc.labourCost) || 0;
          const parts = Number(updates.partsCost !== undefined ? updates.partsCost : rc.partsCost) || 0;
          const other = Number(updates.otherCharges !== undefined ? updates.otherCharges : rc.otherCharges) || 0;
          const total = labour + parts + other;

          finalLabour = labour;
          finalParts = parts;
          finalOther = other;
          finalTotal = total;
          targetServiceId = updates.serviceId || rc.serviceId;

          return {
            ...rc,
            ...updates,
            labourCost: labour,
            partsCost: parts,
            otherCharges: other,
            totalCost: total
          };
        }
        return rc;
      });

      // Synchronize linked service record
      let updatedHistory = prev.serviceHistory;
      if (targetServiceId) {
        updatedHistory = prev.serviceHistory.map((sh) => {
          if (sh.id === targetServiceId || sh.serviceId === targetServiceId) {
            return {
              ...sh,
              labourCost: finalLabour,
              partsCost: finalParts,
              otherCharges: finalOther,
              totalCost: finalTotal
            };
          }
          return sh;
        });
      }

      return {
        ...prev,
        repairCosts: updatedCosts,
        serviceHistory: updatedHistory
      };
    });
  }, []);

  const deleteRepairCost = useCallback((id) => {
    setAppState((prev) => ({
      ...prev,
      repairCosts: prev.repairCosts.filter((rc) => rc.id !== id && rc.expenseId !== id)
    }));
  }, []);

  const updateInvoicePaymentStatus = useCallback((costId, paymentStatus) => {
    setAppState((prev) => ({
      ...prev,
      repairCosts: prev.repairCosts.map((rc) =>
        rc.id === costId || rc.expenseId === costId
          ? { ...rc, paymentStatus }
          : rc
      )
    }));
  }, []);

  // -------------------------------------------------------------
  // NOTIFICATIONS ACTIONS
  // -------------------------------------------------------------
  const addNotification = useCallback((notifData) => {
    let created = null;
    setAppState((prev) => {
      // Deduplicate: If an identical notification type & relatedRecordId already exists, skip
      if (notifData.type && notifData.relatedRecordId) {
        const exists = prev.notifications.some(
          (n) => n.type === notifData.type && n.relatedRecordId === notifData.relatedRecordId
        );
        if (exists) return prev;
      }

      const todayISO = getTodayISO();
      const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
      created = {
        id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        title: notifData.title || 'System Notification',
        message: notifData.message || '',
        type: notifData.type || 'SYSTEM_ALERT',
        priority: notifData.priority || 'MEDIUM',
        relatedRecordId: notifData.relatedRecordId || null,
        relatedPath: notifData.relatedPath || null,
        recipientUserId: notifData.recipientUserId || null,
        createdAt: nowTimestamp,
        read: false,
        ...notifData
      };

      return {
        ...prev,
        notifications: [created, ...prev.notifications]
      };
    });
    return created;
  }, []);

  const markNotificationAsRead = useCallback((notificationId) => {
    setAppState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    }));
  }, []);

  const markNotificationAsUnread = useCallback((notificationId) => {
    setAppState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: false } : n
      )
    }));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true }))
    }));
  }, []);

  const deleteNotification = useCallback((notificationId) => {
    setAppState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== notificationId)
    }));
  }, []);

  const clearAllReadNotifications = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => !n.read)
    }));
  }, []);

  // -------------------------------------------------------------
  // USER & RESET ACTIONS
  // -------------------------------------------------------------
  const isEmailUnique = useCallback((email, excludeUserId = null) => {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    return !users.some(
      (u) => u.email.toLowerCase() === clean && u.id !== excludeUserId
    );
  }, [users]);

  const addUser = useCallback((userData) => {
    const newUser = {
      ...userData,
      id: `usr-${Date.now().toString(36)}`,
      active: userData.active !== undefined ? userData.active : true,
      avatarInitials: userData.name
        ? userData.name
            .trim()
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2)
        : 'US',
      joinedAt: new Date().toISOString().split('T')[0]
    };

    setAppState((prev) => ({
      ...prev,
      users: [...prev.users, newUser]
    }));

    return newUser;
  }, []);

  const updateUser = useCallback((userId, updates) => {
    setAppState((prev) => ({
      ...prev,
      users: prev.users.map((u) => {
        if (u.id === userId) {
          const updatedName = updates.name !== undefined ? updates.name : u.name;
          const initials = updatedName
            ? updatedName
                .trim()
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2)
            : u.avatarInitials;

          return {
            ...u,
            ...updates,
            avatarInitials: initials
          };
        }
        return u;
      })
    }));
  }, []);

  const toggleUserStatus = useCallback((userId) => {
    let result = { success: true };
    setAppState((prev) => {
      const targetUser = prev.users.find((u) => u.id === userId);
      if (!targetUser) return prev;

      // Prevent deactivating if it's the only active administrator
      if (targetUser.active && targetUser.role === 'ADMIN') {
        const activeAdmins = prev.users.filter((u) => u.role === 'ADMIN' && u.active);
        if (activeAdmins.length <= 1) {
          result = {
            success: false,
            error: 'Cannot deactivate the only active Administrator account. System must maintain at least one active Admin.'
          };
          return prev;
        }
      }

      return {
        ...prev,
        users: prev.users.map((u) => (u.id === userId ? { ...u, active: !u.active } : u))
      };
    });
    return result;
  }, []);

  const resetAllData = useCallback(() => {
    const fresh = storageService.resetToSeeds();
    if (fresh) {
      setAppState(fresh);
    }
  }, []);

  // Export entire dataset as JSON string
  const exportAllDataJSON = useCallback(() => {
    const exportBundle = {
      app: 'Smart AssetCare',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      dataset: appState
    };
    return JSON.stringify(exportBundle, null, 2);
  }, [appState]);

  // Automatic Controlled Notification Generation (Phase 6, Section 2.5)
  useEffect(() => {
    setAppState((prev) => {
      let newlyGenerated = [];
      const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const existingNotifKeys = new Set(
        prev.notifications.map((n) => `${n.type}__${n.relatedRecordId}`)
      );

      // 1. Maintenance Overdue & Due Today
      prev.schedules.forEach((s) => {
        const eff = getEffectiveScheduleStatus(s);
        if (eff === 'OVERDUE') {
          const key = `MAINTENANCE_OVERDUE__${s.id}`;
          if (!existingNotifKeys.has(key)) {
            existingNotifKeys.add(key);
            newlyGenerated.push({
              id: `notif-${Date.now().toString(36)}-m-ovd-${s.id}`,
              title: 'Maintenance Overdue',
              message: `Scheduled maintenance "${s.title}" on asset ${s.assetId} is past its due date (${s.dueDate}).`,
              type: 'MAINTENANCE_OVERDUE',
              priority: 'CRITICAL',
              relatedRecordId: s.id,
              relatedPath: '/app/maintenance',
              recipientUserId: s.assignedTechnicianId || 'usr-manager-02',
              createdAt: nowTimestamp,
              read: false
            });
          }
        } else if (eff === 'DUE') {
          const key = `MAINTENANCE_DUE__${s.id}`;
          if (!existingNotifKeys.has(key)) {
            existingNotifKeys.add(key);
            newlyGenerated.push({
              id: `notif-${Date.now().toString(36)}-m-due-${s.id}`,
              title: 'Maintenance Due Today',
              message: `Routine maintenance "${s.title}" for asset ${s.assetId} is scheduled for today.`,
              type: 'MAINTENANCE_DUE',
              priority: 'HIGH',
              relatedRecordId: s.id,
              relatedPath: '/app/maintenance',
              recipientUserId: s.assignedTechnicianId || 'usr-manager-02',
              createdAt: nowTimestamp,
              read: false
            });
          }
        }
      });

      // 2. Work Orders requiring manager verification
      prev.workOrders.forEach((w) => {
        if (w.status === 'COMPLETED') {
          const key = `WORK_ORDER_VERIFICATION_REQUIRED__${w.workOrderId || w.id}`;
          if (!existingNotifKeys.has(key)) {
            existingNotifKeys.add(key);
            newlyGenerated.push({
              id: `notif-${Date.now().toString(36)}-wo-ver-${w.workOrderId || w.id}`,
              title: 'Work Order Verification Required',
              message: `Work Order ${w.workOrderId} (${w.title}) marked complete and awaits supervisor sign-off.`,
              type: 'WORK_ORDER_VERIFICATION_REQUIRED',
              priority: 'HIGH',
              relatedRecordId: w.workOrderId || w.id,
              relatedPath: `/app/work-orders/${w.workOrderId || w.id}`,
              recipientUserId: 'usr-manager-02',
              createdAt: nowTimestamp,
              read: false
            });
          }
        }
      });

      // 3. Low Asset Health Scores
      prev.assets.forEach((a) => {
        if (typeof a.healthScore === 'number' && a.healthScore < 70 && a.status !== 'RETIRED') {
          const key = `LOW_ASSET_HEALTH__${a.assetId || a.id}`;
          if (!existingNotifKeys.has(key)) {
            existingNotifKeys.add(key);
            newlyGenerated.push({
              id: `notif-${Date.now().toString(36)}-ast-hlth-${a.assetId || a.id}`,
              title: 'Low Asset Health Alert',
              message: `Equipment ${a.name} (${a.assetId}) has dropped to simulated health score ${a.healthScore}%. Inspection advised.`,
              type: 'LOW_ASSET_HEALTH',
              priority: a.healthScore < 50 ? 'CRITICAL' : 'HIGH',
              relatedRecordId: a.assetId || a.id,
              relatedPath: `/app/assets/${a.assetId || a.id}`,
              recipientUserId: 'usr-manager-02',
              createdAt: nowTimestamp,
              read: false
            });
          }
        }
      });

      // 4. Overdue / Pending Invoices
      prev.repairCosts.forEach((rc) => {
        if (rc.paymentStatus === 'PENDING') {
          const key = `INVOICE_PENDING__${rc.expenseId || rc.id}`;
          if (!existingNotifKeys.has(key)) {
            existingNotifKeys.add(key);
            newlyGenerated.push({
              id: `notif-${Date.now().toString(36)}-inv-pnd-${rc.expenseId || rc.id}`,
              title: 'Invoice Payment Pending',
              message: `Invoice ${rc.invoiceNumber || rc.expenseId} (${rc.description || 'Repair'}) requires institutional payment processing.`,
              type: 'INVOICE_PENDING',
              priority: 'MEDIUM',
              relatedRecordId: rc.expenseId || rc.id,
              relatedPath: '/app/repair-costs',
              recipientUserId: 'usr-admin-01',
              createdAt: nowTimestamp,
              read: false
            });
          }
        }
      });

      if (newlyGenerated.length === 0) return prev;
      return {
        ...prev,
        notifications: [...newlyGenerated, ...prev.notifications]
      };
    });
  }, []);

  // -------------------------------------------------------------
  // DERIVED DATA & COMPUTED KPIS
  // -------------------------------------------------------------
  const scopedWorkOrders = useMemo(() => {
    return getScopedWorkOrders(workOrders, currentUser);
  }, [workOrders, currentUser]);

  const metrics = useMemo(() => {
    const totalAssets = assets.length;
    const operationalAssets = assets.filter((a) => a.status === 'OPERATIONAL').length;
    const underMaintenanceAssets = assets.filter((a) => a.status === 'UNDER_MAINTENANCE').length;
    const outOfServiceAssets = assets.filter((a) => a.status === 'OUT_OF_SERVICE').length;
    const retiredAssets = assets.filter((a) => a.status === 'RETIRED').length;

    const activeWorkOrders = workOrders.filter(
      (w) => w.status !== 'COMPLETED' && w.status !== 'VERIFIED' && w.status !== 'CLOSED'
    ).length;
    const pendingWorkOrders = workOrders.filter((w) => w.status === 'CREATED' || w.status === 'ASSIGNED').length;
    const completedWorkOrders = workOrders.filter((w) => w.status === 'COMPLETED' || w.status === 'VERIFIED').length;

    const upcomingSchedulesCount = schedules.filter(
      (s) => getEffectiveScheduleStatus(s) === 'UPCOMING'
    ).length;
    const dueTodaySchedulesCount = schedules.filter(
      (s) => getEffectiveScheduleStatus(s) === 'DUE'
    ).length;
    const overdueSchedulesCount = schedules.filter(
      (s) => getEffectiveScheduleStatus(s) === 'OVERDUE'
    ).length;
    const completedSchedulesCount = schedules.filter(
      (s) => s.status === 'COMPLETED'
    ).length;

    const maintenanceDueCount = upcomingSchedulesCount + dueTodaySchedulesCount;
    const maintenanceOverdueCount = overdueSchedulesCount;

    const totalRepairCost = repairCosts.reduce((sum, c) => sum + (Number(c.totalCost) || 0), 0);
    const averageRepairCost = repairCosts.length ? Math.round(totalRepairCost / repairCosts.length) : 0;
    const highestRepairCost = repairCosts.reduce((max, c) => Math.max(max, Number(c.totalCost) || 0), 0);

    const currentYearMonth = new Date().toISOString().substring(0, 7);
    const thisMonthExpenses = repairCosts
      .filter((c) => (c.expenseDate || c.serviceDate || '').startsWith(currentYearMonth))
      .reduce((sum, c) => sum + (Number(c.totalCost) || 0), 0);

    const totalServiceRecords = serviceHistory.length;
    const completedServicesCount = serviceHistory.filter((s) => (s.serviceStatus || 'COMPLETED') === 'COMPLETED').length;
    const pendingServicesCount = serviceHistory.filter((s) => (s.serviceStatus || 'COMPLETED') !== 'COMPLETED').length;

    const criticalAlertsCount =
      workOrders.filter((w) => w.priority === 'CRITICAL' && w.status !== 'CLOSED').length +
      overdueSchedulesCount;

    // Unread notifications for current user
    const unreadNotificationsCount = notifications.filter(
      (n) => (!n.recipientUserId || n.recipientUserId === currentUser?.id) && !n.read
    ).length;

    // Six KPI cards for Work Orders (scoped by role)
    const workOrderKPIs = {
      total: scopedWorkOrders.length,
      created: scopedWorkOrders.filter((w) => w.status === 'CREATED').length,
      assigned: scopedWorkOrders.filter((w) => w.status === 'ASSIGNED').length,
      inProgress: scopedWorkOrders.filter((w) => w.status === 'IN_PROGRESS').length,
      awaitingVerification: scopedWorkOrders.filter((w) => w.status === 'COMPLETED').length,
      verified: scopedWorkOrders.filter((w) => w.status === 'VERIFIED').length,
      closed: scopedWorkOrders.filter((w) => w.status === 'CLOSED').length,
      overdue: scopedWorkOrders.filter((w) => isWorkOrderOverdue(w)).length
    };

    return {
      totalAssets,
      operationalAssets,
      underMaintenanceAssets,
      outOfServiceAssets,
      retiredAssets,
      activeWorkOrders,
      pendingWorkOrders,
      completedWorkOrders,
      workOrderKPIs,
      maintenanceDueCount,
      maintenanceOverdueCount,
      upcomingSchedulesCount,
      dueTodaySchedulesCount,
      overdueSchedulesCount,
      completedSchedulesCount,
      totalRepairCost,
      averageRepairCost,
      highestRepairCost,
      thisMonthExpenses,
      totalServiceRecords,
      completedServicesCount,
      pendingServicesCount,
      criticalAlertsCount,
      unreadNotificationsCount,
      totalUsers: users.length
    };
  }, [assets, workOrders, scopedWorkOrders, schedules, serviceHistory, repairCosts, notifications, currentUser, users]);

  return (
    <AppDataContext.Provider
      value={{
        users,
        assets,
        workOrders,
        scopedWorkOrders,
        schedules,
        serviceHistory,
        repairCosts,
        notifications,
        metrics,
        addAsset,
        updateAsset,
        deleteAsset,
        archiveAsset,
        isAssetIdUnique,
        hasRelatedRecords,
        getAsset,
        createWorkOrder,
        updateWorkOrderStatus,
        assignTechnician,
        addProgressNote,
        reopenForRework,
        verifyWorkOrder,
        closeWorkOrder,
        addSchedule,
        updateSchedule,
        completeSchedule,
        cancelSchedule,
        rescheduleSchedule,
        createWorkOrderFromSchedule,
        addServiceRecord,
        updateServiceRecord,
        deleteServiceRecord,
        addRepairCost,
        updateRepairCost,
        deleteRepairCost,
        updateInvoicePaymentStatus,
        addNotification,
        markNotificationAsRead,
        markNotificationAsUnread,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllReadNotifications,
        addUser,
        updateUser,
        toggleUserStatus,
        isEmailUnique,
        exportAllDataJSON,
        resetAllData
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}
