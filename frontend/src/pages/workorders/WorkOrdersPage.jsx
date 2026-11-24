import React, { useState, useMemo } from 'react';
import {
  Kanban,
  List,
  Plus,
  Search,
  Filter,
  Download,
  X,
  AlertTriangle,
  Clock,
  UserCheck,
  CheckCircle2,
  Layers,
  Wrench,
  AlertCircle
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/cards/Card';
import KanbanBoard from './components/KanbanBoard';
import WorkOrderListView from './components/WorkOrderListView';
import WorkOrderFormModal from './components/WorkOrderFormModal';
import AssignTechnicianModal from './components/AssignTechnicianModal';
import CompleteWorkOrderModal from './components/CompleteWorkOrderModal';
import ReworkModal from './components/ReworkModal';
import VerifyWorkOrderModal from './components/VerifyWorkOrderModal';
import CloseWorkOrderModal from './components/CloseWorkOrderModal';

import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasPermission, ROLES } from '../../utils/permissions';
import { isWorkOrderOverdue } from '../../utils/workOrderRules';

export default function WorkOrdersPage() {
  const { scopedWorkOrders, assets, users, metrics } = useAppData();
  const { currentUser, role } = useAuth();
  const { showToast } = useToast();

  const canCreate = hasPermission(role, 'CAN_CREATE_WORK_ORDER');
  const isManagerOrAdmin = role === ROLES.ADMIN || role === ROLES.MANAGER;

  // View Mode: 'kanban' | 'list'
  const [viewMode, setViewMode] = useState('kanban');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assetFilter, setAssetFilter] = useState('ALL');
  const [technicianFilter, setTechnicianFilter] = useState('ALL');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Modal State Management
  const [modalState, setModalState] = useState({
    type: null, // 'create' | 'assign' | 'complete' | 'rework' | 'verify' | 'close'
    workOrder: null
  });

  const handleOpenModal = (modalType, workOrder = null) => {
    setModalState({ type: modalType, workOrder });
  };

  const handleCloseModal = () => {
    setModalState({ type: null, workOrder: null });
  };

  // KPIs derived from the role-scoped collection
  const kpis = useMemo(() => {
    const total = scopedWorkOrders.length;
    const created = scopedWorkOrders.filter((w) => w.status === 'CREATED').length;
    const assigned = scopedWorkOrders.filter((w) => w.status === 'ASSIGNED').length;
    const inProgress = scopedWorkOrders.filter((w) => w.status === 'IN_PROGRESS').length;
    const awaitingVerification = scopedWorkOrders.filter((w) => w.status === 'COMPLETED').length;
    const overdue = scopedWorkOrders.filter((w) => isWorkOrderOverdue(w)).length;

    return { total, created, assigned, inProgress, awaitingVerification, overdue };
  }, [scopedWorkOrders]);

  // Combined Multi-Filter Engine
  const filteredWorkOrders = useMemo(() => {
    return scopedWorkOrders.filter((wo) => {
      // Search query (ID, title, description, asset name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const asset = assets.find((a) => a.id === wo.assetId || a.assetId === wo.assetId);
        const matchesId = wo.workOrderId?.toLowerCase().includes(query);
        const matchesTitle = wo.title?.toLowerCase().includes(query);
        const matchesDesc = wo.description?.toLowerCase().includes(query);
        const matchesAsset = asset?.name?.toLowerCase().includes(query) || asset?.assetId?.toLowerCase().includes(query);

        if (!matchesId && !matchesTitle && !matchesDesc && !matchesAsset) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter !== 'ALL' && wo.status !== statusFilter) {
        return false;
      }

      // Priority Filter
      if (priorityFilter !== 'ALL' && wo.priority !== priorityFilter) {
        return false;
      }

      // Asset Filter
      if (assetFilter !== 'ALL' && wo.assetId !== assetFilter) {
        return false;
      }

      // Technician Filter
      if (technicianFilter !== 'ALL') {
        if (technicianFilter === 'UNASSIGNED') {
          if (wo.assignedTechnicianId) return false;
        } else if (wo.assignedTechnicianId !== technicianFilter) {
          return false;
        }
      }

      // Overdue Filter
      if (overdueOnly && !isWorkOrderOverdue(wo)) {
        return false;
      }

      return true;
    });
  }, [scopedWorkOrders, searchQuery, statusFilter, priorityFilter, assetFilter, technicianFilter, overdueOnly, assets]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'ALL' ||
    priorityFilter !== 'ALL' ||
    assetFilter !== 'ALL' ||
    technicianFilter !== 'ALL' ||
    overdueOnly;

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setAssetFilter('ALL');
    setTechnicianFilter('ALL');
    setOverdueOnly(false);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredWorkOrders.length === 0) {
      showToast('No work orders to export based on current filters.', 'warning');
      return;
    }

    const headers = [
      'Work Order ID',
      'Title',
      'Asset ID',
      'Asset Name',
      'Priority',
      'Status',
      'Technician ID',
      'Technician Name',
      'Created Date',
      'Due Date',
      'Is Overdue'
    ];

    const rows = filteredWorkOrders.map((w) => {
      const asset = assets.find((a) => a.id === w.assetId || a.assetId === w.assetId);
      const tech = users.find((u) => u.id === w.assignedTechnicianId);
      const overdue = isWorkOrderOverdue(w) ? 'YES' : 'NO';

      return [
        `"${w.workOrderId || ''}"`,
        `"${(w.title || '').replace(/"/g, '""')}"`,
        `"${asset?.assetId || w.assetId || ''}"`,
        `"${(asset?.name || '').replace(/"/g, '""')}"`,
        `"${w.priority || ''}"`,
        `"${w.status || ''}"`,
        `"${w.assignedTechnicianId || 'UNASSIGNED'}"`,
        `"${tech?.name || 'Unassigned'}"`,
        `"${w.createdAt || ''}"`,
        `"${w.dueDate || ''}"`,
        `"${overdue}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SmartAssetCare_WorkOrders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${filteredWorkOrders.length} work orders to CSV.`, 'success');
  };

  const technicians = users.filter((u) => u.role === ROLES.TECHNICIAN);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-accent-primary/10 border border-accent-primary/30 text-accent-primary">
              <Wrench className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-accent-primary font-bold">
              Dispatch & Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
            Work Order Management
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Track maintenance requests, assign technicians and monitor repair operations across the campus.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Toggle */}
          <div className="flex items-center rounded-xl bg-bg-card border border-industrial-border p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-accent-primary text-black shadow-[0_0_12px_rgba(57,255,136,0.25)]'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-accent-primary text-black shadow-[0_0_12px_rgba(57,255,136,0.25)]'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Table
            </button>
          </div>

          {/* Export CSV */}
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
            title="Export filtered records as CSV"
          >
            Export CSV
          </Button>

          {/* Create Button */}
          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => handleOpenModal('create')}
            >
              {role === ROLES.STAFF ? 'Report Issue' : 'Create Work Order'}
            </Button>
          )}
        </div>
      </div>

      {/* 6 KPI Cards (Section 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total */}
        <div
          onClick={() => {
            setStatusFilter('ALL');
            setOverdueOnly(false);
          }}
          className={`p-3.5 rounded-2xl bg-bg-card border transition-all cursor-pointer ${
            statusFilter === 'ALL' && !overdueOnly
              ? 'border-accent-primary shadow-[0_0_15px_rgba(57,255,136,0.15)] ring-1 ring-accent-primary/40'
              : 'border-industrial-border hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-text-muted mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Total Orders</span>
            <Layers className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="text-2xl font-bold font-display text-text-primary">{kpis.total}</div>
          <span className="text-[10px] text-text-muted mt-1 block">Active institutional scope</span>
        </div>

        {/* 2. Created / Unassigned */}
        <div
          onClick={() => {
            setStatusFilter('CREATED');
            setOverdueOnly(false);
          }}
          className={`p-3.5 rounded-2xl bg-bg-card border transition-all cursor-pointer ${
            statusFilter === 'CREATED'
              ? 'border-sky-500 shadow-[0_0_15px_rgba(56,189,248,0.2)] ring-1 ring-sky-500/40'
              : 'border-industrial-border hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-text-muted mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Created</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-display text-sky-400">{kpis.created}</div>
          <span className="text-[10px] text-text-muted mt-1 block">Awaiting technician</span>
        </div>

        {/* 3. Assigned */}
        <div
          onClick={() => {
            setStatusFilter('ASSIGNED');
            setOverdueOnly(false);
          }}
          className={`p-3.5 rounded-2xl bg-bg-card border transition-all cursor-pointer ${
            statusFilter === 'ASSIGNED'
              ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/40'
              : 'border-industrial-border hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-text-muted mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Assigned</span>
            <UserCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-display text-amber-400">{kpis.assigned}</div>
          <span className="text-[10px] text-text-muted mt-1 block">Dispatched to technician</span>
        </div>

        {/* 4. In Progress */}
        <div
          onClick={() => {
            setStatusFilter('IN_PROGRESS');
            setOverdueOnly(false);
          }}
          className={`p-3.5 rounded-2xl bg-bg-card border transition-all cursor-pointer ${
            statusFilter === 'IN_PROGRESS'
              ? 'border-accent-primary shadow-[0_0_15px_rgba(57,255,136,0.2)] ring-1 ring-accent-primary/40'
              : 'border-industrial-border hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-text-muted mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">In Progress</span>
            <Wrench className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="text-2xl font-bold font-display text-accent-primary">{kpis.inProgress}</div>
          <span className="text-[10px] text-text-muted mt-1 block">Under active repair</span>
        </div>

        {/* 5. Awaiting Verification (COMPLETED) */}
        <div
          onClick={() => {
            setStatusFilter('COMPLETED');
            setOverdueOnly(false);
          }}
          className={`p-3.5 rounded-2xl bg-bg-card border transition-all cursor-pointer ${
            statusFilter === 'COMPLETED'
              ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/40'
              : 'border-industrial-border hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-text-muted mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Verification</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-display text-emerald-400">{kpis.awaitingVerification}</div>
          <span className="text-[10px] text-text-muted mt-1 block">Awaiting sign-off</span>
        </div>

        {/* 6. Overdue Work Orders */}
        <div
          onClick={() => {
            setOverdueOnly(!overdueOnly);
            setStatusFilter('ALL');
          }}
          className={`p-3.5 rounded-2xl bg-bg-card border transition-all cursor-pointer ${
            overdueOnly
              ? 'border-status-critical shadow-[0_0_15px_rgba(239,68,68,0.25)] ring-1 ring-status-critical/50'
              : 'border-industrial-border hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-text-muted mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Overdue</span>
            <AlertTriangle className="w-4 h-4 text-status-critical" />
          </div>
          <div className="text-2xl font-bold font-display text-status-critical">{kpis.overdue}</div>
          <span className="text-[10px] text-status-critical/80 mt-1 block font-mono">
            {kpis.overdue > 0 ? 'Action required' : 'All on schedule'}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-bg-card border border-industrial-border space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search work order ID, title, asset..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="ALL">Status: All</option>
              <option value="CREATED">Created</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="VERIFIED">Verified</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Priority Dropdown */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="ALL">Priority: All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {/* Asset Dropdown */}
          <div>
            <select
              value={assetFilter}
              onChange={(e) => setAssetFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary truncate"
            >
              <option value="ALL">Asset: All Assets</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetId} - {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Technician Dropdown (Admin/Manager only) */}
          {isManagerOrAdmin && (
            <div>
              <select
                value={technicianFilter}
                onChange={(e) => setTechnicianFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary truncate"
              >
                <option value="ALL">Tech: All Specialists</option>
                <option value="UNASSIGNED">Unassigned Only</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Filter Badges & Overdue Toggle */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-industrial-border/60 text-xs flex-wrap">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-text-secondary hover:text-text-primary">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="rounded bg-bg-elevated border-industrial-border text-accent-primary focus:ring-accent-primary w-4 h-4"
              />
              <span className="font-mono text-[11px] font-semibold text-status-critical flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Show Overdue Only
              </span>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[11px] font-mono text-accent-primary hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Reset Filters
              </button>
            )}
          </div>

          <div className="text-[11px] font-mono text-text-muted">
            Displaying <strong className="text-text-primary">{filteredWorkOrders.length}</strong> of {scopedWorkOrders.length} work orders
          </div>
        </div>
      </div>

      {/* Main View Area: Kanban vs List */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          workOrders={filteredWorkOrders}
          onOpenModal={handleOpenModal}
        />
      ) : (
        <WorkOrderListView
          workOrders={filteredWorkOrders}
          onOpenModal={handleOpenModal}
        />
      )}

      {/* Modals */}
      <WorkOrderFormModal
        isOpen={modalState.type === 'create'}
        onClose={handleCloseModal}
      />

      <AssignTechnicianModal
        isOpen={modalState.type === 'assign'}
        onClose={handleCloseModal}
        workOrder={modalState.workOrder}
      />

      <CompleteWorkOrderModal
        isOpen={modalState.type === 'complete'}
        onClose={handleCloseModal}
        workOrder={modalState.workOrder}
      />

      <ReworkModal
        isOpen={modalState.type === 'rework'}
        onClose={handleCloseModal}
        workOrder={modalState.workOrder}
      />

      <VerifyWorkOrderModal
        isOpen={modalState.type === 'verify'}
        onClose={handleCloseModal}
        workOrder={modalState.workOrder}
      />

      <CloseWorkOrderModal
        isOpen={modalState.type === 'close'}
        onClose={handleCloseModal}
        workOrder={modalState.workOrder}
      />
    </div>
  );
}
