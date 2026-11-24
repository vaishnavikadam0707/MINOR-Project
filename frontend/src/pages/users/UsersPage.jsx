import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  UserCheck,
  UserX
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import UserFormModal from './components/UserFormModal';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getRoleBadgeStyle, ROLES } from '../../utils/permissions';

export default function UsersPage() {
  const { users, addUser, updateUser, toggleUserStatus } = useAppData();
  const { currentUser, role } = useAuth();
  const { showToast } = useToast();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'ACTIVE', 'INACTIVE'
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;

  // Modal State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Status Change Confirmation Dialog State
  const [statusDialogUser, setStatusDialogUser] = useState(null);

  // RBAC Permission Check
  const isAdmin = role === ROLES.ADMIN;

  // -------------------------------------------------------------
  // 3.1 User Dashboard Metrics
  // -------------------------------------------------------------
  const userMetrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.active).length;
    const inactive = total - active;
    const byRole = {
      ADMIN: users.filter((u) => u.role === ROLES.ADMIN).length,
      MANAGER: users.filter((u) => u.role === ROLES.MANAGER).length,
      TECHNICIAN: users.filter((u) => u.role === ROLES.TECHNICIAN).length,
      STAFF: users.filter((u) => u.role === ROLES.STAFF).length
    };
    return { total, active, inactive, byRole };
  }, [users]);

  // -------------------------------------------------------------
  // Filtered & Sorted Table Rows
  // -------------------------------------------------------------
  const processedUsers = useMemo(() => {
    let list = [...users];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone && u.phone.toLowerCase().includes(q)) ||
          u.department.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
      );
    }

    // Role filter
    if (roleFilter !== 'ALL') {
      list = list.filter((u) => u.role === roleFilter);
    }

    // Status filter
    if (statusFilter === 'ACTIVE') {
      list = list.filter((u) => u.active);
    } else if (statusFilter === 'INACTIVE') {
      list = list.filter((u) => !u.active);
    }

    // Sorting
    list.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [users, searchQuery, roleFilter, statusFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(processedUsers.length / rowsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const startIdx = (currentPage - 1) * rowsPerPage;
    return processedUsers.slice(startIdx, startIdx + rowsPerPage);
  }, [processedUsers, currentPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Add / Edit Handlers
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setFormModalOpen(true);
  };

  const handleSaveUser = (userData) => {
    if (editingUser) {
      updateUser(editingUser.id, userData);
      showToast({
        type: 'success',
        title: 'User Profile Updated',
        message: `Account settings for ${userData.name} updated successfully.`
      });
    } else {
      addUser(userData);
      showToast({
        type: 'success',
        title: 'User Registered',
        message: `New account created for ${userData.name} (${userData.role}).`
      });
    }
  };

  const handleConfirmStatusToggle = () => {
    if (statusDialogUser) {
      const res = toggleUserStatus(statusDialogUser.id);
      if (res && res.success === false) {
        showToast({
          type: 'error',
          title: 'Action Prohibited',
          message: res.error || 'Cannot alter administrator status.'
        });
      } else {
        showToast({
          type: 'info',
          title: statusDialogUser.active ? 'User Deactivated' : 'User Activated',
          message: `Account for ${statusDialogUser.name} is now ${
            statusDialogUser.active ? 'deactivated' : 'active'
          }.`
        });
      }
      setStatusDialogUser(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-status-critical/15 text-status-critical border border-status-critical/30 flex items-center justify-center mx-auto shadow-glow-critical">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-display text-text-primary">
          Restricted Administration Module
        </h2>
        <p className="text-xs text-text-secondary leading-relaxed">
          User access control and privilege administration is strictly reserved for Institutional Administrators. Switch your session to ADMIN to evaluate this console.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center text-accent-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
                User Management
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                Admin console: Manage campus roles, technicians, and departmental faculty privileges.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={UserPlus}
          onClick={handleOpenAddModal}
        >
          Add Demo User
        </Button>
      </div>

      {/* 3.1 User Dashboard KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-bg-card border border-industrial-border">
          <span className="text-[10px] font-mono uppercase text-text-muted block">Total Users</span>
          <div className="text-2xl font-bold font-display text-text-primary mt-1">
            {userMetrics.total} Registered
          </div>
          <span className="text-[11px] font-mono text-text-secondary mt-1 block">Campus Accounts</span>
        </div>

        <div className="p-4 rounded-2xl bg-bg-card border border-industrial-border">
          <span className="text-[10px] font-mono uppercase text-text-muted block">Active Users</span>
          <div className="text-2xl font-bold font-display text-status-success mt-1">
            {userMetrics.active}
          </div>
          <span className="text-[11px] font-mono text-status-success mt-1 block">
            Permitted Sign-in
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-bg-card border border-industrial-border">
          <span className="text-[10px] font-mono uppercase text-text-muted block">Deactivated Users</span>
          <div className={`text-2xl font-bold font-display mt-1 ${userMetrics.inactive > 0 ? 'text-status-critical' : 'text-text-primary'}`}>
            {userMetrics.inactive}
          </div>
          <span className="text-[11px] font-mono text-text-muted mt-1 block">
            Access Suspended
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-bg-card border border-industrial-border">
          <span className="text-[10px] font-mono uppercase text-text-muted block">Role Breakdown</span>
          <div className="flex items-center gap-2 mt-1.5 text-xs font-mono">
            <span className="text-status-critical font-bold">{userMetrics.byRole.ADMIN} Ad</span>
            <span className="text-accent-primary font-bold">{userMetrics.byRole.MANAGER} Mg</span>
            <span className="text-status-warning font-bold">{userMetrics.byRole.TECHNICIAN} Tc</span>
            <span className="text-status-info font-bold">{userMetrics.byRole.STAFF} St</span>
          </div>
          <span className="text-[10px] font-mono text-text-muted mt-1 block">
            Role distribution
          </span>
        </div>
      </div>

      {/* 3.2 Filters, Search & Table */}
      <div className="space-y-4">
        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search user by name, email, department..."
              className="w-full bg-bg-card text-xs text-text-primary rounded-xl border border-industrial-border pl-9 pr-3 py-2 placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-bg-card border border-industrial-border rounded-xl px-3 py-2 text-xs font-mono text-text-secondary focus:outline-none focus:border-accent-primary"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="TECHNICIAN">Technician</option>
              <option value="STAFF">Staff</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-bg-card border border-industrial-border rounded-xl px-3 py-2 text-xs font-mono text-text-secondary focus:outline-none focus:border-accent-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Deactivated Only</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="rounded-2xl border border-industrial-border overflow-hidden bg-bg-card shadow-card-dark">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-bg-secondary text-text-muted border-b border-industrial-border">
                <tr>
                  <th
                    onClick={() => handleSort('id')}
                    className="p-4 cursor-pointer hover:text-accent-primary select-none uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-1">
                      <span>User ID</span>
                      <ArrowUpDown className="w-3 h-3 text-text-muted/60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('name')}
                    className="p-4 cursor-pointer hover:text-accent-primary select-none uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-1">
                      <span>User</span>
                      <ArrowUpDown className="w-3 h-3 text-text-muted/60" />
                    </div>
                  </th>
                  <th className="p-4 uppercase tracking-wider">Email</th>
                  <th
                    onClick={() => handleSort('role')}
                    className="p-4 cursor-pointer hover:text-accent-primary select-none uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-1">
                      <span>Role</span>
                      <ArrowUpDown className="w-3 h-3 text-text-muted/60" />
                    </div>
                  </th>
                  <th className="p-4 uppercase tracking-wider">Department</th>
                  <th className="p-4 uppercase tracking-wider">Contact</th>
                  <th className="p-4 uppercase tracking-wider">Account Status</th>
                  <th className="p-4 uppercase tracking-wider">Created</th>
                  <th className="p-4 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-industrial-border text-text-secondary">
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((u) => {
                    const roleBadge = getRoleBadgeStyle(u.role);
                    const isSelf = u.id === currentUser?.id;

                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-bold text-accent-primary">{u.id}</td>

                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center text-accent-primary font-bold shrink-0">
                              {u.avatarInitials || 'US'}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-text-primary font-sans block truncate">
                                {u.name}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] text-accent-primary font-mono block">
                                  (Active Session)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-text-muted truncate max-w-[180px]">
                          {u.email}
                        </td>

                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full border text-[10px] ${roleBadge.bg}`}>
                            {roleBadge.label}
                          </span>
                        </td>

                        <td className="p-4 text-text-secondary truncate max-w-[160px]">
                          {u.department || '—'}
                        </td>

                        <td className="p-4 text-text-muted">
                          {u.phone || '—'}
                        </td>

                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 font-bold ${u.active ? 'text-status-success' : 'text-status-critical'}`}>
                            {u.active ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-status-critical" />
                            )}
                            {u.active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>

                        <td className="p-4 text-text-muted">
                          {u.joinedAt || '2024-01-10'}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 rounded-lg border border-industrial-border text-text-muted hover:text-accent-primary hover:bg-white/[0.04] transition-colors"
                              title="Edit User"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setStatusDialogUser(u)}
                              disabled={isSelf && u.active}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isSelf && u.active
                                  ? 'opacity-30 cursor-not-allowed border-industrial-border text-text-muted'
                                  : u.active
                                  ? 'border-status-critical/30 text-status-critical hover:bg-status-critical/10'
                                  : 'border-status-success/30 text-status-success hover:bg-status-success/10'
                              }`}
                              title={
                                isSelf && u.active
                                  ? 'Cannot deactivate active session'
                                  : u.active
                                  ? 'Deactivate User'
                                  : 'Activate User'
                              }
                            >
                              {u.active ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-text-muted italic">
                      No users found matching query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-industrial-border flex items-center justify-between text-xs font-mono text-text-muted bg-bg-secondary/40">
            <span>
              Page {currentPage} of {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-industrial-border text-text-secondary disabled:opacity-30 disabled:pointer-events-none hover:bg-white/[0.04]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-industrial-border text-text-secondary disabled:opacity-30 disabled:pointer-events-none hover:bg-white/[0.04]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit User Modal (Section 3.3 & 3.4) */}
      <UserFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        initialUser={editingUser}
        onSave={handleSaveUser}
      />

      {/* Deactivate / Activate Confirm Dialog (Section 3.5) */}
      <ConfirmDialog
        isOpen={Boolean(statusDialogUser)}
        onClose={() => setStatusDialogUser(null)}
        onConfirm={handleConfirmStatusToggle}
        title={statusDialogUser?.active ? 'Deactivate User Account?' : 'Activate User Account?'}
        message={
          statusDialogUser?.active
            ? `Are you sure you want to deactivate ${statusDialogUser.name}? They will be blocked from logging into the system. Historical tickets and service records remain preserved.`
            : `Are you sure you want to restore active sign-in access for ${statusDialogUser?.name}?`
        }
        confirmText={statusDialogUser?.active ? 'Deactivate Account' : 'Activate Account'}
        variant={statusDialogUser?.active ? 'danger' : 'primary'}
      />
    </div>
  );
}
