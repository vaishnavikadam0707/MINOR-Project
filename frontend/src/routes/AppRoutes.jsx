import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';

// Public pages
import LandingPage from '../pages/public/LandingPage';
import AboutPage from '../pages/public/AboutPage';
import FeaturesPage from '../pages/public/FeaturesPage';
import HowItWorksPage from '../pages/public/HowItWorksPage';
import DemoGuidePage from '../pages/public/DemoGuidePage';
import LoginPage from '../pages/auth/LoginPage';
import NotFoundPage from '../pages/public/NotFoundPage';

// App pages
import DashboardRouter from '../pages/dashboard/DashboardRouter';
import AssetInventoryPage from '../pages/assets/AssetInventoryPage';
import AssetDetailPage from '../pages/assets/AssetDetailPage';
import QrCodesPage from '../pages/qr/QrCodesPage';
import MaintenancePage from '../pages/maintenance/MaintenancePage';
import WorkOrdersPage from '../pages/workorders/WorkOrdersPage';
import WorkOrderDetailPage from '../pages/workorders/WorkOrderDetailPage';
import ServiceHistoryPage from '../pages/history/ServiceHistoryPage';
import CostsPage from '../pages/costs/CostsPage';
import ReportsPage from '../pages/reports/ReportsPage';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import UsersPage from '../pages/users/UsersPage';
import SettingsPage from '../pages/settings/SettingsPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/demo" element={<DemoGuidePage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected Dashboard Application Routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardRouter />} />
        <Route path="assets" element={<AssetInventoryPage />} />
        <Route path="assets/:id" element={<AssetDetailPage />} />
        <Route path="qr-codes" element={<QrCodesPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="work-orders" element={<WorkOrdersPage />} />
        <Route path="work-orders/:id" element={<WorkOrderDetailPage />} />
        <Route path="service-history" element={<ServiceHistoryPage />} />
        <Route path="repair-costs" element={<CostsPage />} />
        <Route path="costs" element={<Navigate to="/app/repair-costs" replace />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
    </Routes>
  );
}
