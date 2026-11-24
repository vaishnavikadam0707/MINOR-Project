// Versioned LocalStorage Service for Smart AssetCare
import {
  INITIAL_USERS,
  INITIAL_ASSETS,
  INITIAL_WORK_ORDERS,
  INITIAL_MAINTENANCE_SCHEDULES,
  INITIAL_SERVICE_HISTORY,
  INITIAL_REPAIR_COSTS,
  INITIAL_NOTIFICATIONS
} from '../data/seedData.js';

const STORAGE_KEY = 'smartAssetCareDemo_v1';
const USER_KEY = 'smartAsset_currentUser_v1';

export const storageService = {
  // Load complete state from localStorage or initialize with seed data
  loadAppState: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.assets && parsed.workOrders && parsed.schedules) {
          // Normalize schedules for recurrenceSeriesId and current-anchor dates
          const normalizedSchedules = parsed.schedules.map((s) => {
            const hasLegacyDate = s.dueDate && s.dueDate.startsWith('2024');
            let updatedDueDate = s.dueDate;
            if (hasLegacyDate) {
              const matchedSeed = INITIAL_MAINTENANCE_SCHEDULES.find((seed) => seed.id === s.id);
              if (matchedSeed) {
                updatedDueDate = matchedSeed.dueDate;
              } else {
                updatedDueDate = s.dueDate.replace('2024', '2026');
              }
            }
            return {
              ...s,
              dueDate: updatedDueDate,
              recurrenceSeriesId: s.recurrenceSeriesId || `ser-${s.id}`
            };
          });

          return {
            ...parsed,
            users: parsed.users || INITIAL_USERS,
            notifications: parsed.notifications || INITIAL_NOTIFICATIONS,
            schedules: normalizedSchedules
          };
        }
      }
    } catch (err) {
      console.warn('Failed to parse saved demo data from localStorage, resetting to seeds:', err);
    }

    // Default seed state
    const defaultState = {
      users: INITIAL_USERS,
      assets: INITIAL_ASSETS,
      workOrders: INITIAL_WORK_ORDERS,
      schedules: INITIAL_MAINTENANCE_SCHEDULES,
      serviceHistory: INITIAL_SERVICE_HISTORY,
      repairCosts: INITIAL_REPAIR_COSTS,
      notifications: INITIAL_NOTIFICATIONS,
      lastUpdated: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }

    return defaultState;
  },

  // Load current users from state
  getUsers: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
          return parsed.users;
        }
      }
    } catch (e) {
      console.warn('Failed to parse users from localStorage:', e);
    }
    return INITIAL_USERS;
  },

  // Persist updated app state
  saveAppState: (state) => {
    try {
      const toSave = {
        ...state,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (err) {
      console.error('Failed to save state to localStorage:', err);
    }
  },

  // Reset demo data to pristine initial seed state
  resetToSeeds: () => {
    try {
      const defaultState = {
        users: INITIAL_USERS,
        assets: INITIAL_ASSETS,
        workOrders: INITIAL_WORK_ORDERS,
        schedules: INITIAL_MAINTENANCE_SCHEDULES,
        serviceHistory: INITIAL_SERVICE_HISTORY,
        repairCosts: INITIAL_REPAIR_COSTS,
        notifications: INITIAL_NOTIFICATIONS,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
      return defaultState;
    } catch (err) {
      console.error('Failed to reset localStorage data:', err);
      return null;
    }
  },

  // Load current logged-in user
  loadCurrentUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Failed to parse current user session:', err);
    }
    // Default to Institutional Admin for rich prototype evaluation
    return INITIAL_USERS[0];
  },

  // Save current logged-in user session
  saveCurrentUser: (user) => {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (err) {
      console.error('Failed to save user session:', err);
    }
  }
};
