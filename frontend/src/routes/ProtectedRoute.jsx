import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessRoute } from '../utils/permissions';
import { useToast } from '../context/ToastContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();

  const isAuthorized = isAuthenticated && canAccessRoute(role, location.pathname);

  useEffect(() => {
    if (isAuthenticated && !isAuthorized) {
      showToast({
        type: 'warning',
        title: 'Access Restricted',
        message: `Your current role (${role}) does not have permission to access "${location.pathname}". Redirected to your authorized dashboard.`
      });
    }
  }, [isAuthenticated, isAuthorized, role, location.pathname, showToast]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAuthorized) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
}
