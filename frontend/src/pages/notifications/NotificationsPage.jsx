import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Check,
  Trash2,
  Search,
  ExternalLink,
  AlertTriangle,
  Clock,
  Calendar,
  Wrench,
  DollarSign,
  Layers,
  ShieldAlert,
  Inbox,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications,
    markNotificationAsRead,
    markNotificationAsUnread,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllReadNotifications
  } = useAppData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // Filters & Search
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'UNREAD', 'READ', 'MAINTENANCE', 'WORK_ORDERS', 'FINANCIAL', 'ASSETS'
  const [priorityFilter, setPriorityFilter] = useState('ALL'); // 'ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog State for Clear All Read
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [deleteSingleId, setDeleteSingleId] = useState(null);

  // Filter scoped to user visibility
  const userNotifications = useMemo(() => {
    return notifications.filter(
      (n) => !n.recipientUserId || n.recipientUserId === currentUser?.id
    );
  }, [notifications, currentUser]);

  // Unread count
  const unreadCount = useMemo(() => {
    return userNotifications.filter((n) => !n.read).length;
  }, [userNotifications]);

  const readCount = userNotifications.length - unreadCount;

  // Category & Filter logic
  const filteredNotifications = useMemo(() => {
    return userNotifications.filter((n) => {
      // 1. Tab / Category Filter
      if (activeTab === 'UNREAD' && n.read) return false;
      if (activeTab === 'READ' && !n.read) return false;
      if (activeTab === 'MAINTENANCE') {
        const isMaint = (n.type || '').startsWith('MAINTENANCE');
        if (!isMaint) return false;
      }
      if (activeTab === 'WORK_ORDERS') {
        const isWo = (n.type || '').startsWith('WORK_ORDER');
        if (!isWo) return false;
      }
      if (activeTab === 'FINANCIAL') {
        const isFin = (n.type || '').includes('INVOICE') || (n.type || '').includes('REPAIR_COST');
        if (!isFin) return false;
      }
      if (activeTab === 'ASSETS') {
        const isAst = (n.type || '').includes('ASSET');
        if (!isAst) return false;
      }

      // 2. Priority Filter
      if (priorityFilter !== 'ALL' && (n.priority || 'MEDIUM') !== priorityFilter) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (n.title || '').toLowerCase().includes(q);
        const matchesMsg = (n.message || '').toLowerCase().includes(q);
        const matchesRecord = (n.relatedRecordId || '').toLowerCase().includes(q);
        const matchesType = (n.type || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg && !matchesRecord && !matchesType) {
          return false;
        }
      }

      return true;
    });
  }, [userNotifications, activeTab, priorityFilter, searchQuery]);

  // Helper for notification type visuals
  const getTypeMeta = (type = '', priority = 'MEDIUM') => {
    if (type.includes('OVERDUE') || priority === 'CRITICAL') {
      return {
        icon: AlertTriangle,
        badgeStyle: 'bg-status-critical/15 text-status-critical border-status-critical/30',
        badgeText: 'Critical Alert',
        cardBorder: 'border-status-critical/40'
      };
    }
    if (type.includes('MAINTENANCE')) {
      return {
        icon: Calendar,
        badgeStyle: 'bg-status-warning/15 text-status-warning border-status-warning/30',
        badgeText: 'Maintenance',
        cardBorder: 'border-status-warning/30'
      };
    }
    if (type.includes('WORK_ORDER_VERIFICATION')) {
      return {
        icon: ShieldAlert,
        badgeStyle: 'bg-accent-primary/15 text-accent-primary border-accent-primary/30',
        badgeText: 'Verification Due',
        cardBorder: 'border-accent-primary/40'
      };
    }
    if (type.includes('WORK_ORDER')) {
      return {
        icon: Wrench,
        badgeStyle: 'bg-status-info/15 text-status-info border-status-info/30',
        badgeText: 'Work Order',
        cardBorder: 'border-status-info/30'
      };
    }
    if (type.includes('INVOICE') || type.includes('COST')) {
      return {
        icon: DollarSign,
        badgeStyle: 'bg-accent-secondary/15 text-accent-secondary border-accent-secondary/30',
        badgeText: 'Financial',
        cardBorder: 'border-accent-secondary/30'
      };
    }
    if (type.includes('HEALTH') || type.includes('ASSET')) {
      return {
        icon: Layers,
        badgeStyle: 'bg-status-warning/15 text-status-warning border-status-warning/30',
        badgeText: 'Asset Status',
        cardBorder: 'border-status-warning/30'
      };
    }
    return {
      icon: Bell,
      badgeStyle: 'bg-white/10 text-text-secondary border-white/20',
      badgeText: 'System Alert',
      cardBorder: 'border-industrial-border'
    };
  };

  const handleClearRead = () => {
    clearAllReadNotifications();
    setConfirmClearOpen(false);
    showToast({
      type: 'info',
      title: 'Notifications Cleared',
      message: 'All read system alerts have been permanently deleted.'
    });
  };

  const handleDeleteSingle = () => {
    if (deleteSingleId) {
      deleteNotification(deleteSingleId);
      setDeleteSingleId(null);
      showToast({
        type: 'info',
        title: 'Notification Deleted',
        message: 'Notification removed from your feed.'
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center text-accent-primary">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
                Notification Center
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                Real-time campus maintenance warnings, dispatch updates, and status notices.
              </p>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={CheckCheck}
              onClick={markAllNotificationsAsRead}
            >
              Mark All as Read ({unreadCount})
            </Button>
          )}

          {readCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={Trash2}
              onClick={() => setConfirmClearOpen(true)}
              className="text-status-critical hover:text-status-critical"
            >
              Clear Read ({readCount})
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-bg-card border border-industrial-border rounded-2xl">
          {[
            { id: 'ALL', label: 'All Alerts', count: userNotifications.length },
            { id: 'UNREAD', label: 'Unread', count: unreadCount, badge: true },
            { id: 'READ', label: 'Read', count: readCount },
            { id: 'MAINTENANCE', label: 'Maintenance' },
            { id: 'WORK_ORDERS', label: 'Work Orders' },
            { id: 'FINANCIAL', label: 'Financial' },
            { id: 'ASSETS', label: 'Asset Alerts' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                activeTab === tab.id
                  ? 'bg-accent-primary text-bg-primary font-bold shadow-glow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === tab.id
                      ? 'bg-bg-primary/20 text-bg-primary'
                      : tab.badge && tab.count > 0
                      ? 'bg-status-critical text-white'
                      : 'bg-white/[0.08] text-text-muted'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Priority Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications by title, ID, note..."
              className="w-full bg-bg-card text-xs text-text-primary rounded-xl border border-industrial-border pl-9 pr-3 py-2 placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-xs font-mono text-text-muted">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-bg-card border border-industrial-border rounded-xl px-2.5 py-1.5 text-xs font-mono text-text-secondary focus:outline-none focus:border-accent-primary"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((n) => {
            const meta = getTypeMeta(n.type, n.priority);
            const IconComponent = meta.icon;

            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start justify-between gap-4 relative group ${
                  !n.read
                    ? `bg-bg-card ${meta.cardBorder} shadow-glow-sm`
                    : 'bg-bg-card/40 border-industrial-border opacity-75 hover:opacity-100 hover:border-industrial-borderHover'
                }`}
              >
                {/* Left content area */}
                <div
                  className="flex items-start gap-3.5 min-w-0 flex-1 cursor-pointer"
                  onClick={() => {
                    markNotificationAsRead(n.id);
                    if (n.relatedPath) navigate(n.relatedPath);
                  }}
                >
                  {/* Category Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.badgeStyle}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${meta.badgeStyle}`}>
                        {meta.badgeText}
                      </span>

                      {n.priority && (
                        <span
                          className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                            n.priority === 'CRITICAL'
                              ? 'bg-status-critical/20 text-status-critical border border-status-critical/40 animate-pulse'
                              : n.priority === 'HIGH'
                              ? 'bg-status-warning/20 text-status-warning border border-status-warning/40'
                              : 'bg-white/[0.05] text-text-muted border border-white/10'
                          }`}
                        >
                          {n.priority}
                        </span>
                      )}

                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" title="Unread" />
                      )}
                    </div>

                    <h3 className={`text-sm font-bold tracking-tight ${!n.read ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {n.title}
                    </h3>

                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      {n.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-mono text-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {n.createdAt}
                      </span>

                      {n.relatedRecordId && (
                        <span className="text-accent-primary bg-accent-primary/5 px-2 py-0.5 rounded-md border border-accent-primary/20">
                          ID: {n.relatedRecordId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex sm:flex-col items-center gap-1.5 shrink-0 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end border-industrial-border">
                  {/* Read / Unread toggle */}
                  <button
                    onClick={() => {
                      if (n.read) markNotificationAsUnread(n.id);
                      else markNotificationAsRead(n.id);
                    }}
                    className="p-1.5 rounded-lg border border-industrial-border text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                    title={n.read ? 'Mark as Unread' : 'Mark as Read'}
                    aria-label={n.read ? 'Mark as Unread' : 'Mark as Read'}
                  >
                    {n.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-accent-primary" />}
                  </button>

                  {/* Navigate to target record */}
                  {n.relatedPath && (
                    <button
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        navigate(n.relatedPath);
                      }}
                      className="p-1.5 rounded-lg border border-industrial-border text-text-muted hover:text-accent-primary hover:bg-white/[0.04] transition-colors"
                      title="Open Related Record"
                      aria-label="Open Related Record"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}

                  {/* Delete Notification */}
                  <button
                    onClick={() => setDeleteSingleId(n.id)}
                    className="p-1.5 rounded-lg border border-industrial-border text-text-muted hover:text-status-critical hover:bg-status-critical/10 transition-colors"
                    title="Delete Notification"
                    aria-label="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center rounded-3xl bg-bg-card border border-industrial-border space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-industrial-border text-text-muted flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold font-display text-text-primary">
              No Notifications Found
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              There are no alerts matching your active filter criteria. Check back for real-time equipment updates.
            </p>
            {activeTab !== 'ALL' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveTab('ALL');
                  setPriorityFilter('ALL');
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog: Clear All Read */}
      <ConfirmDialog
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={handleClearRead}
        title="Clear All Read Notifications?"
        message={`Are you sure you want to permanently clear ${readCount} read notifications? Unread notifications will remain intact.`}
        confirmText="Clear Notifications"
      />

      {/* Confirmation Dialog: Delete Single */}
      <ConfirmDialog
        isOpen={Boolean(deleteSingleId)}
        onClose={() => setDeleteSingleId(null)}
        onConfirm={handleDeleteSingle}
        title="Delete Notification?"
        message="This alert will be permanently removed from your system notifications feed."
        confirmText="Delete Alert"
      />
    </div>
  );
}
