import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Layers,
  QrCode,
  Calendar,
  Wrench,
  DollarSign,
  BarChart3,
  Bell,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Activity,
  Shield,
  RotateCw,
  Sparkles,
  History
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { canAccessRoute, getRoleBadgeStyle } from '../../utils/permissions';

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen
}) {
  const { currentUser, role, logout, switchRole, ROLES } = useAuth();
  const { metrics } = useAppData();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // All master navigation items
  const navItems = [
    {
      title: 'Dashboard',
      path: '/app/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Asset Inventory',
      path: '/app/assets',
      icon: Layers,
      count: metrics?.totalAssets
    },
    {
      title: 'QR Codes',
      path: '/app/qr-codes',
      icon: QrCode,
    },
    {
      title: 'Maintenance',
      path: '/app/maintenance',
      icon: Calendar,
      count: metrics?.maintenanceDueCount,
      countWarning: metrics?.maintenanceOverdueCount > 0
    },
    {
      title: 'Work Orders',
      path: '/app/work-orders',
      icon: Wrench,
      count: metrics?.activeWorkOrders,
      countCritical: metrics?.criticalAlertsCount > 0
    },
    {
      title: 'Service History',
      path: '/app/service-history',
      icon: History,
      count: metrics?.totalServiceRecords
    },
    {
      title: 'Repair Costs',
      path: '/app/repair-costs',
      icon: DollarSign,
    },
    {
      title: 'Reports & Analytics',
      path: '/app/reports',
      icon: BarChart3,
    },
    {
      title: 'Notifications',
      path: '/app/notifications',
      icon: Bell,
      count: metrics?.unreadNotificationsCount,
      countWarning: metrics?.unreadNotificationsCount > 0
    },
    {
      title: 'User Management',
      path: '/app/users',
      icon: Users,
    },
    {
      title: 'Settings',
      path: '/app/settings',
      icon: Settings,
    },
  ];

  // Filter items accessible to the active role
  const visibleNavItems = navItems.filter((item) => canAccessRoute(role, item.path));

  const roleStyle = getRoleBadgeStyle(role);

  const handleRoleQuickSwitch = (e) => {
    const target = e.target.value;
    if (target && target !== role) {
      const switched = switchRole(target);
      if (switched) {
        showToast({
          type: 'success',
          title: `Role Switched: ${target}`,
          message: `Active session set to ${switched.name}.`
        });
        navigate('/app/dashboard');
      } else {
        showToast({
          type: 'error',
          title: 'Account Deactivated',
          message: `The ${target} account is currently deactivated by the administrator.`
        });
      }
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-bg-sidebar border-r border-industrial-border select-none">
      {/* Brand Header */}
      <div className={`flex items-center justify-between p-4 border-b border-industrial-border ${isCollapsed ? 'justify-center px-2' : ''}`}>
        <NavLink to="/app/dashboard" className="flex items-center gap-3 min-w-0 group">
          <div className="w-10 h-10 rounded-xl bg-bg-card border border-accent-primary/40 flex items-center justify-center text-accent-primary shrink-0 group-hover:border-accent-primary group-hover:shadow-glow-sm transition-all">
            <Activity className="w-5 h-5" />
          </div>

          {!isCollapsed && (
            <div className="min-w-0">
              <span className="font-display font-extrabold text-sm tracking-tight text-text-primary group-hover:text-accent-primary transition-colors block truncate">
                SMART ASSETCARE
              </span>
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block truncate">
                Command Console
              </span>
            </div>
          )}
        </NavLink>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] border border-transparent hover:border-industrial-border transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Indicator Banner */}
      {!isCollapsed && (
        <div className="px-4 py-2.5 bg-bg-elevated/40 border-b border-industrial-border flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full ${roleStyle.dot} shrink-0 animate-pulse`} />
            <span className="text-xs font-semibold text-text-primary truncate">
              {roleStyle.label}
            </span>
          </div>

          {/* Quick Role Select */}
          <select
            value={role}
            onChange={handleRoleQuickSwitch}
            className="bg-bg-card border border-industrial-border rounded-lg text-[10px] font-mono text-text-secondary px-1.5 py-1 focus:outline-none focus:border-accent-primary"
            title="Switch demo role instantly"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="TECHNICIAN">TECHNICIAN</option>
            <option value="STAFF">STAFF</option>
          </select>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/app/dashboard' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              title={isCollapsed ? item.title : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all relative group ${
                isActive
                  ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/30 shadow-glow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-accent-primary' : 'text-text-muted group-hover:text-text-primary'}`} />

              {!isCollapsed && (
                <span className="truncate flex-1 font-sans">
                  {item.title}
                </span>
              )}

              {!isCollapsed && item.count !== undefined && item.count > 0 && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    item.countCritical
                      ? 'bg-status-critical/20 text-status-critical border border-status-critical/30'
                      : item.countWarning
                      ? 'bg-status-warning/20 text-status-warning border border-status-warning/30'
                      : 'bg-white/[0.06] text-text-muted border border-white/10'
                  }`}
                >
                  {item.count}
                </span>
              )}

              {/* Tooltip on collapsed desktop view */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-bg-card border border-industrial-border rounded-lg text-xs font-medium text-text-primary shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  {item.title}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer & Logout */}
      <div className="p-3 border-t border-industrial-border bg-bg-secondary/40">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-accent-primary/15 border border-accent-primary/30 text-accent-primary font-mono font-bold text-xs flex items-center justify-center shrink-0">
            {currentUser?.avatarInitials || 'US'}
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-text-primary truncate">
                {currentUser?.name || 'User'}
              </p>
              <p className="text-[11px] text-text-muted truncate font-mono">
                {currentUser?.department || role}
              </p>
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="p-1.5 rounded-lg text-text-muted hover:text-status-critical hover:bg-status-critical/10 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden md:block fixed top-0 bottom-0 left-0 z-40 transition-all duration-300 ${
          isCollapsed ? 'w-[76px]' : 'w-[250px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-72 max-w-[85vw] h-full z-10"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
