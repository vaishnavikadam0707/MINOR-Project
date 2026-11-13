import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { useAuth } from './AuthContext';
import {
  getEffectiveScheduleStatus,
  calculateNextRecurrenceDate,
  getTodayISO
} from '../utils/dateHelpers';

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
    const nextNumber = (appState.workOrders.length + 1).toString().padStart(3, '0');
    const newWo = {
      id: `wo-${Date.now().toString(36)}`,
      workOrderId: `WO-2024-${nextNumber}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'CREATED',
      activityHistory: [
        {
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          action: `Created by ${currentUser?.name || 'Staff'}`
        }
      ],
      ...woData
    };

    setAppState((prev) => ({
      ...prev,
      workOrders: [newWo, ...prev.workOrders]
    }));

    return newWo;
  }, [appState.workOrders.length, currentUser]);

  const updateWorkOrderStatus = useCallback((workOrderId, nextStatus, note = '') => {
    setAppState((prev) => {
      const updated = prev.workOrders.map((wo) => {
        if (wo.id === workOrderId || wo.workOrderId === workOrderId) {
          const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
          const historyEntry = {
            timestamp,
            action: `Status updated to ${nextStatus} by ${currentUser?.name || 'User'}${note ? ` (${note})` : ''}`
          };

          return {
            ...wo,
            status: nextStatus,
            activityHistory: [...(wo.activityHistory || []), historyEntry]
          };
        }
        return wo;
      });

      return { ...prev, workOrders: updated };
    });
  }, [currentUser]);

  const assignTechnician = useCallback((workOrderId, technicianId) => {
    const tech = users.find((u) => u.id === technicianId);
    setAppState((prev) => {
      const updated = prev.workOrders.map((wo) => {
        if (wo.id === workOrderId || wo.workOrderId === workOrderId) {
          const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
          const historyEntry = {
            timestamp,
            action: `Assigned to ${tech?.name || 'Technician'} by ${currentUser?.name || 'Manager'}`
          };
          return {
            ...wo,
            assignedTechnicianId: technicianId,
            status: wo.status === 'CREATED' ? 'ASSIGNED' : wo.status,
            activityHistory: [...(wo.activityHistory || []), historyEntry]
          };
        }
        return wo;
      });
      return { ...prev, workOrders: updated };
    });
  }, [currentUser, users]);

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

      const nextNumber = (prev.workOrders.length + 1).toString().padStart(3, '0');
      createdWo = {
        id: `wo-${Date.now().toString(36)}`,
        workOrderId: `WO-2024-${nextNumber}`,
        assetId: schedule.assetId,
        title: `[Maint] ${schedule.title}`,
        description: schedule.description || `Generated from scheduled maintenance ${schedule.id}`,
        priority: (schedule.priority || 'MEDIUM').toUpperCase(),
        createdByUserId: currentUser?.id,
        assignedTechnicianId: schedule.assignedTechnicianId || null,
        createdAt: getTodayISO(),
        dueDate: schedule.dueDate,
        status: schedule.assignedTechnicianId ? 'ASSIGNED' : 'CREATED',
        linkedScheduleId: schedule.id,
        activityHistory: [
          {
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            action: `Generated from maintenance schedule ${schedule.id} by ${currentUser?.name || 'Manager'}`
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
    const newHistory = {
      ...historyData,
      id: `sh-${Date.now().toString(36)}`,
      technicianId: historyData.technicianId || currentUser?.id,
      serviceDate: historyData.serviceDate || new Date().toISOString().split('T')[0],
      costRecordIds: historyData.costRecordIds || [],
      attachmentIds: historyData.attachmentIds || []
    };

    setAppState((prev) => ({
      ...prev,
      serviceHistory: [newHistory, ...prev.serviceHistory]
    }));

    return newHistory;
  }, [currentUser]);

  const addRepairCost = useCallback((costData) => {
    const labour = Number(costData.labourCost) || 0;
    const parts = Number(costData.partsCost) || 0;
    const other = Number(costData.otherCharges) || 0;
    const total = labour + parts + other;

    const newCost = {
      ...costData,
      id: `rc-${Date.now().toString(36)}`,
      labourCost: labour,
      partsCost: parts,
      otherCharges: other,
      totalCost: total,
      serviceDate: costData.serviceDate || new Date().toISOString().split('T')[0],
      createdByUserId: currentUser?.id
    };

    setAppState((prev) => ({
      ...prev,
      repairCosts: [newCost, ...prev.repairCosts]
    }));

    return newCost;
  }, [currentUser]);

  // -------------------------------------------------------------
  // NOTIFICATIONS ACTIONS
  // -------------------------------------------------------------
  const markNotificationAsRead = useCallback((notificationId) => {
    setAppState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    }));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true }))
    }));
  }, []);

  // -------------------------------------------------------------
  // USER & RESET ACTIONS
  // -------------------------------------------------------------
  const addUser = useCallback((userData) => {
    const newUser = {
      ...userData,
      id: `usr-${Date.now().toString(36)}`,
      active: true,
      avatarInitials: userData.name
        ? userData.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
        : 'US',
      joinedAt: new Date().toISOString().split('T')[0]
    };

    setAppState((prev) => ({
      ...prev,
      users: [...prev.users, newUser]
    }));
  }, []);

  const toggleUserStatus = useCallback((userId) => {
    setAppState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, active: !u.active } : u))
    }));
  }, []);

  const resetAllData = useCallback(() => {
    const fresh = storageService.resetToSeeds();
    if (fresh) {
      setAppState(fresh);
    }
  }, []);

  // -------------------------------------------------------------
  // DERIVED DATA & COMPUTED KPIS
  // -------------------------------------------------------------
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

    const criticalAlertsCount =
      workOrders.filter((w) => w.priority === 'CRITICAL' && w.status !== 'CLOSED').length +
      overdueSchedulesCount;

    // Unread notifications for current user
    const unreadNotificationsCount = notifications.filter(
      (n) => (!n.recipientUserId || n.recipientUserId === currentUser?.id) && !n.read
    ).length;

    return {
      totalAssets,
      operationalAssets,
      underMaintenanceAssets,
      outOfServiceAssets,
      retiredAssets,
      activeWorkOrders,
      pendingWorkOrders,
      completedWorkOrders,
      maintenanceDueCount,
      maintenanceOverdueCount,
      upcomingSchedulesCount,
      dueTodaySchedulesCount,
      overdueSchedulesCount,
      completedSchedulesCount,
      totalRepairCost,
      averageRepairCost,
      criticalAlertsCount,
      unreadNotificationsCount,
      totalUsers: users.length
    };
  }, [assets, workOrders, schedules, repairCosts, notifications, currentUser, users]);

  return (
    <AppDataContext.Provider
      value={{
        users,
        assets,
        workOrders,
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
        addSchedule,
        updateSchedule,
        completeSchedule,
        cancelSchedule,
        rescheduleSchedule,
        createWorkOrderFromSchedule,
        addServiceRecord,
        addRepairCost,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addUser,
        toggleUserStatus,
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
