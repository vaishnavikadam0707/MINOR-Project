import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import ManagerDashboard from './ManagerDashboard';
import TechnicianDashboard from './TechnicianDashboard';
import StaffDashboard from './StaffDashboard';

export default function DashboardRouter() {
  const { role } = useAuth();

  switch (role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'MANAGER':
      return <ManagerDashboard />;
    case 'TECHNICIAN':
      return <TechnicianDashboard />;
    case 'STAFF':
      return <StaffDashboard />;
    default:
      return <AdminDashboard />;
  }
}
