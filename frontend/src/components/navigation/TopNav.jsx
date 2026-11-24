import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  ChevronRight,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Layers,
  Wrench
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { getRoleBadgeStyle } from '../../utils/permissions';

export default function TopNav({
  isCollapsed,
  setIsCollapsed,
  setMobileOpen
}) {
  const { currentUser, role, logout, switchRole, ROLES } = useAuth();
  const { assets, workOrders, notifications, markNotificationAsRead, metrics } = useAppData();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // State for dropdowns
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute Breadcrumb Trail
  const getBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    // Remove 'app'
    const cleanParts = parts.filter((p) => p !== 'app');
    if (!cleanParts.length) return [{ label: 'Dashboard', path: '/app/dashboard' }];

    const breadcrumbs = [];
    let currentPath = '/app';

    cleanParts.forEach((part) => {
      currentPath += `/${part}`;
      const labelMap = {
        dashboard: 'Dashboard',
        assets: 'Assets',
        'qr-codes': 'QR Codes',
        maintenance: 'Maintenance',
        'work-orders': 'Work Orders',
        'service-history': 'Service History',
        'repair-costs': 'Repair Costs',
        costs: 'Repair Costs',
        reports: 'Reports',
        notifications: 'Notifications',
        users: 'Users',
        settings: 'Settings'
      };

      breadcrumbs.push({
        label: labelMap[part] || part.toUpperCase(),
        path: currentPath
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const roleStyle = getRoleBadgeStyle(role);

  // Global search filtering
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return { assets: [], workOrders: [] };
    const q = searchQuery.toLowerCase();

    const matchedAssets = assets
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.assetId.toLowerCase().includes(q) ||
          a.serialNumber?.toLowerCase().includes(q)
      )
      .slice(0, 3);

    const matchedWorkOrders = workOrders
      .filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.workOrderId.toLowerCase().includes(q) ||
          w.description?.toLowerCase().includes(q)
      )
      .slice(0, 3);

    return { assets: matchedAssets, workOrders: matchedWorkOrders };
  }, [searchQuery, assets, workOrders]);

  const hasResults =
    searchResults.assets.length > 0 || searchResults.workOrders.length > 0;

  // Filter unread notifications for current user
  const userNotifications = notifications
    .filter((n) => !n.recipientUserId || n.recipientUserId === currentUser?.id)
    .slice(0, 5);

  const unreadCount = metrics?.unreadNotificationsCount || 0;

  return (
    <header className="sticky top-0 z-30 bg-bg-secondary/85 backdrop-blur-md border-b border-industrial-border h-16">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left Side: Mobile toggle & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-xl bg-bg-card border border-industrial-border text-text-secondary hover:text-text-primary"
            aria-label="Open navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs Navigation */}
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs font-mono">
            <Link
              to="/app/dashboard"
              className="text-text-muted hover:text-accent-primary transition-colors"
            >
              PORTAL
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.path}>
                <ChevronRight className="w-3.5 h-3.5 text-text-muted/60" />
                <span
                  className={
                    idx === breadcrumbs.length - 1
                      ? 'text-accent-primary font-semibold'
                      : 'text-text-muted hover:text-text-primary'
                  }
                >
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Center: Global Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search assets, work orders, serials..."
              className="w-full bg-bg-card text-xs text-text-primary rounded-xl border border-industrial-border pl-9 pr-8 py-2 placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 text-text-muted hover:text-text-primary"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {searchFocused && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-bg-card border border-industrial-border rounded-2xl shadow-2xl p-3 z-50 divide-y divide-industrial-border">
              {hasResults ? (
                <>
                  {searchResults.assets.length > 0 && (
                    <div className="pb-2">
                      <span className="text-[10px] font-mono uppercase text-text-muted px-2 block mb-1">
                        Matching Assets
                      </span>
                      {searchResults.assets.map((ast) => (
                        <div
                          key={ast.id}
                          onClick={() => {
                            navigate(`/app/assets/${ast.assetId}`);
                            setSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="p-2 rounded-xl hover:bg-white/[0.04] cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-accent-primary" />
                            <div>
                              <p className="text-xs font-semibold text-text-primary">
                                {ast.name}
                              </p>
                              <span className="text-[10px] font-mono text-text-muted">
                                {ast.assetId} • {ast.location}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-accent-primary">
                            {ast.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.workOrders.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] font-mono uppercase text-text-muted px-2 block mb-1">
                        Matching Work Orders
                      </span>
                      {searchResults.workOrders.map((wo) => (
                        <div
                          key={wo.id}
                          onClick={() => {
                            navigate(`/app/work-orders`);
                            setSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="p-2 rounded-xl hover:bg-white/[0.04] cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-status-warning" />
                            <div>
                              <p className="text-xs font-semibold text-text-primary">
                                {wo.title}
                              </p>
                              <span className="text-[10px] font-mono text-text-muted">
                                {wo.workOrderId} • Priority: {wo.priority}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-status-warning">
                            {wo.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 text-center text-xs text-text-muted">
                  No records matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Quick Role Pill, Notifications & User Avatar */}
        <div className="flex items-center gap-3">
          {/* Active Role Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-card border border-industrial-border text-xs">
            <span className={`w-2 h-2 rounded-full ${roleStyle.dot} animate-pulse`} />
            <span className="text-[11px] font-mono font-medium text-text-secondary">
              ROLE:
            </span>
            <span className="text-[11px] font-mono font-bold text-text-primary">
              {role}
            </span>
          </div>

          {/* Notifications Button & Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
              className="relative p-2 rounded-xl bg-bg-card border border-industrial-border text-text-secondary hover:text-text-primary hover:border-accent-primary/40 transition-colors"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-status-critical text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-bg-card border border-industrial-border rounded-2xl shadow-2xl p-4 z-50">
                <div className="flex items-center justify-between pb-3 border-b border-industrial-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-display text-text-primary">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/30">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <Link
                    to="/app/notifications"
                    onClick={() => setNotificationDropdownOpen(false)}
                    className="text-[11px] font-mono text-accent-primary hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="divide-y divide-industrial-border py-2 max-h-72 overflow-y-auto">
                  {userNotifications.length > 0 ? (
                    userNotifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationAsRead(n.id);
                          if (n.relatedPath) navigate(n.relatedPath);
                          setNotificationDropdownOpen(false);
                        }}
                        className={`p-2.5 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-colors ${
                          !n.read ? 'bg-accent-primary/[0.03]' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-text-primary">
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-[10px] font-mono text-text-muted mt-1 block">
                          {n.createdAt}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-text-muted">
                      No notifications available.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl bg-bg-card border border-industrial-border hover:border-accent-primary/40 transition-colors"
              aria-label="User profile menu"
            >
              <div className="w-7 h-7 rounded-lg bg-accent-primary/15 text-accent-primary font-mono text-xs font-bold flex items-center justify-center">
                {currentUser?.avatarInitials || 'US'}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-text-primary">
                {currentUser?.name?.split(' ')[0] || 'User'}
              </span>
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-bg-card border border-industrial-border rounded-2xl shadow-2xl p-2 z-50">
                <div className="p-3 border-b border-industrial-border">
                  <p className="text-xs font-bold text-text-primary truncate">
                    {currentUser?.name}
                  </p>
                  <p className="text-[11px] font-mono text-text-muted truncate">
                    {currentUser?.email}
                  </p>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-mono border ${roleStyle.bg}`}>
                    {roleStyle.label}
                  </span>
                </div>

                {/* Quick Role Switch in profile menu */}
                <div className="p-2 border-b border-industrial-border">
                  <span className="text-[10px] font-mono text-text-muted uppercase block mb-1">
                    Demo Role Switch
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                    {['ADMIN', 'MANAGER', 'TECHNICIAN', 'STAFF'].map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          const switched = switchRole(r);
                          setProfileDropdownOpen(false);
                          if (switched) {
                            showToast({
                              type: 'success',
                              title: `Switched to ${r}`,
                              message: `Active session set to ${switched.name}.`
                            });
                            navigate('/app/dashboard');
                          } else {
                            showToast({
                              type: 'error',
                              title: 'Account Deactivated',
                              message: `The ${r} account is currently deactivated by the administrator.`
                            });
                          }
                        }}
                        className={`px-2 py-1 rounded-lg text-left transition-colors ${
                          role === r
                            ? 'bg-accent-primary/20 text-accent-primary font-bold'
                            : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-1 space-y-0.5">
                  <Link
                    to="/app/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>My Profile & Settings</span>
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setProfileDropdownOpen(false);
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-status-critical hover:bg-status-critical/10 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
