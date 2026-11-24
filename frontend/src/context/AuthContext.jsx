import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { INITIAL_USERS } from '../data/seedData';
import { ROLES } from '../utils/permissions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    return storageService.loadCurrentUser();
  });

  const isAuthenticated = Boolean(currentUser);
  const role = currentUser?.role || null;

  // Persist session whenever user changes
  useEffect(() => {
    storageService.saveCurrentUser(currentUser);
  }, [currentUser]);

  // Login handler
  const login = useCallback((email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, error: 'Please enter both demo email and password.' };
    }

    if (cleanPassword !== 'Demo123!') {
      return { success: false, error: 'Invalid demo credentials. Default demo password is "Demo123!".' };
    }

    const currentUsers = storageService.getUsers();
    const existingUser = currentUsers.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    if (!existingUser) {
      return {
        success: false,
        error: 'Demo user not recognized. Please choose from registered Admin, Manager, Technician, or Staff accounts.'
      };
    }

    if (!existingUser.active) {
      return {
        success: false,
        error: 'This account has been deactivated by the system administrator. Access is disabled.'
      };
    }

    setCurrentUser(existingUser);
    storageService.saveCurrentUser(existingUser);

    return { success: true, user: existingUser };
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    setCurrentUser(null);
    storageService.saveCurrentUser(null);
  }, []);

  // Quick Switch Role handler (for evaluators)
  const switchRole = useCallback((targetRole) => {
    const currentUsers = storageService.getUsers();
    // Check if account with this role exists and is deactivated
    const existing = currentUsers.find((u) => u.role === targetRole);
    if (existing && !existing.active) {
      // Deactivated account cannot be logged into
      return null;
    }

    let matched = existing && existing.active ? existing : null;
    if (!matched) {
      matched = INITIAL_USERS.find((u) => u.role === targetRole && u.active);
    }
    if (matched) {
      setCurrentUser(matched);
      storageService.saveCurrentUser(matched);
      return matched;
    }
    return null;
  }, []);

  // Update profile
  const updateProfile = useCallback((updates) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      storageService.saveCurrentUser(updated);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        login,
        logout,
        switchRole,
        updateProfile,
        ROLES
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
