import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Plus,
  X,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  ArrowUpDown,
  ExternalLink,
  Printer,
  ChevronLeft,
  ChevronRight,
  User,
  Layers,
  Wrench,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ServiceDetailModal from './components/ServiceDetailModal';
import PrintServiceReportModal from './components/PrintServiceReportModal';
import ServiceFormModal from './components/ServiceFormModal';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES, hasPermission } from '../../utils/permissions';
import { formatRupee, formatDate } from '../../utils/formatters';

export default function ServiceHistoryPage() {
  const { serviceHistory, assets, users, workOrders, repairCosts, deleteServiceRecord } = useAppData();
  const { currentUser, role } = useAuth();
  const { showToast } = useToast();

  const canManageService = role === ROLES.ADMIN || role === ROLES.MANAGER;
  const canLogService = role === ROLES.ADMIN || role === ROLES.MANAGER || role === ROLES.TECHNICIAN;

  // Selected Record for Detail or Print
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [printRecord, setPrintRecord] = useState(null);

  // Form Modal (Add / Edit)
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Delete Confirmation Modal
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [techFilter, setTechFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sorting
  const [sortField, setSortField] = useState('serviceDate');
  const [sortDirection, setSortDirection] = useState('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // List of all technicians for filter dropdown
  const technicians = useMemo(() => {
    return users.filter((u) => u.role === ROLES.TECHNICIAN || u.role === ROLES.STAFF);
  }, [users]);

  // Scoped records based on role (Staff only see assets in their department or self-related)
  const scopedHistory = useMemo(() => {
    if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
      return serviceHistory;
    }
    if (role === ROLES.TECHNICIAN) {
      // Technicians see services they performed, or campus services
      return serviceHistory;
    }
    if (role === ROLES.STAFF) {
      // Staff see services on assets in their department
      const userDept = currentUser?.department?.toLowerCase() || '';
      return serviceHistory.filter((sh) => {
        const asset = assets.find((a) => a.id === sh.assetId || a.assetId === sh.assetId);
        return (
          asset &&
          (asset.department?.toLowerCase().includes(userDept) ||
            userDept.includes(asset.department?.toLowerCase() || ''))
        );
      });
    }
    return serviceHistory;
  }, [serviceHistory, role, currentUser, assets]);

  // KPIs (Section 1.1)
  const kpis = useMemo(() => {
    const totalRecords = scopedHistory.length;
    const completedServices = scopedHistory.filter(
      (s) => (s.serviceStatus || 'COMPLETED').toUpperCase() === 'COMPLETED'
    ).length;
    const pendingServices = scopedHistory.filter(
      (s) => (s.serviceStatus || 'COMPLETED').toUpperCase() !== 'COMPLETED'
    ).length;

    // Total expenses across these services
    const totalExpenses = scopedHistory.reduce((sum, s) => {
      if (s.totalCost) return sum + Number(s.totalCost);
      // Fallback: look up in repairCosts
      const linkedCost = repairCosts.find(
        (rc) => (s.costRecordIds || []).includes(rc.id) || rc.serviceId === s.id
      );
      return sum + (Number(linkedCost?.totalCost) || 0);
    }, 0);

    return { totalRecords, completedServices, pendingServices, totalExpenses };
  }, [scopedHistory, repairCosts]);

  // Combined Multi-Filter Engine
  const filteredRecords = useMemo(() => {
    return scopedHistory.filter((record) => {
      const asset = assets.find((a) => a.id === record.assetId || a.assetId === record.assetId);
      const tech = users.find((u) => u.id === record.technicianId);

      // Search Query (Asset name, Asset ID, Service ID, Technician name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = asset?.name?.toLowerCase().includes(query);
        const matchesAssetId =
          asset?.assetId?.toLowerCase().includes(query) ||
          record.assetId?.toLowerCase().includes(query);
        const matchesServiceId = (record.serviceId || record.id)?.toLowerCase().includes(query);
        const matchesTech = tech?.name?.toLowerCase().includes(query);
        const matchesDesc =
          (record.serviceDescription || record.problemIdentified)?.toLowerCase().includes(query);

        if (!matchesName && !matchesAssetId && !matchesServiceId && !matchesTech && !matchesDesc) {
          return false;
        }
      }

      // Filter by Service Type
      if (typeFilter !== 'ALL' && record.serviceType !== typeFilter) {
        return false;
      }

      // Filter by Service Status
      if (statusFilter !== 'ALL') {
        const currentStatus = (record.serviceStatus || 'COMPLETED').toUpperCase();
        if (currentStatus !== statusFilter) return false;
      }

      // Filter by Technician
      if (techFilter !== 'ALL' && record.technicianId !== techFilter) {
        return false;
      }

      // Date Range Filter
      if (startDate && record.serviceDate < startDate) {
        return false;
      }
      if (endDate && record.serviceDate > endDate) {
        return false;
      }

      return true;
    });
  }, [scopedHistory, searchQuery, typeFilter, statusFilter, techFilter, startDate, endDate, assets, users]);

  // Sorted Records
  const sortedRecords = useMemo(() => {
    const list = [...filteredRecords];
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'totalCost') {
        valA = Number(a.totalCost || 0);
        valB = Number(b.totalCost || 0);
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredRecords, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedRecords.slice(start, start + itemsPerPage);
  }, [sortedRecords, currentPage, itemsPerPage]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    typeFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    techFilter !== 'ALL' ||
    startDate !== '' ||
    endDate !== '';

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setTechFilter('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      showToast('No records to export.', 'warning');
      return;
    }

    const headers = [
      'Service ID',
      'Asset ID',
      'Asset Name',
      'Work Order ID',
      'Service Date',
      'Technician',
      'Service Type',
      'Status',
      'Labour Cost',
      'Parts Cost',
      'Other Charges',
      'Total Cost',
      'Problem Identified',
      'Work Performed'
    ];

    const rows = filteredRecords.map((r) => {
      const asset = assets.find((a) => a.id === r.assetId || a.assetId === r.assetId);
      const tech = users.find((u) => u.id === r.technicianId);

      return [
        `"${r.serviceId || r.id}"`,
        `"${asset?.assetId || r.assetId || ''}"`,
        `"${(asset?.name || '').replace(/"/g, '""')}"`,
        `"${r.workOrderId || 'N/A'}"`,
        `"${r.serviceDate || ''}"`,
        `"${(tech?.name || 'Unassigned').replace(/"/g, '""')}"`,
        `"${r.serviceType || ''}"`,
        `"${r.serviceStatus || 'COMPLETED'}"`,
        `"${r.labourCost || 0}"`,
        `"${r.partsCost || 0}"`,
        `"${r.otherCharges || 0}"`,
        `"${r.totalCost || 0}"`,
        `"${(r.problemIdentified || '').replace(/"/g, '""')}"`,
        `"${(r.workPerformed || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SmartAssetCare_ServiceHistory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${filteredRecords.length} service records to CSV.`, 'success');
  };

  const confirmDeleteRecord = () => {
    if (!deleteConfirmRecord) return;
    deleteServiceRecord(deleteConfirmRecord.id);
    showToast(`Service log ${deleteConfirmRecord.serviceId || deleteConfirmRecord.id} deleted.`, 'info');
    setDeleteConfirmRecord(null);
  };

  const getAsset = (id) => assets.find((a) => a.id === id || a.assetId === id);
  const getTech = (id) => users.find((u) => u.id === id);
  const getWO = (id) => workOrders.find((w) => w.id === id || w.workOrderId === id);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-accent-primary/10 border border-accent-primary/30 text-accent-primary">
              <History className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-accent-primary font-bold">
              Lifecycle Maintenance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
            Service History & Maintenance Logs
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Complete historical audit trail of physical equipment interventions, technical calibrations, and verified repairs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
          >
            Export Log CSV
          </Button>

          {canLogService && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setEditingRecord(null);
                setServiceModalOpen(true);
              }}
            >
              Record Service Log
            </Button>
          )}
        </div>
      </div>

      {/* 4 Summary KPI Cards (Section 1.1) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Service Records */}
        <div className="p-4 rounded-2xl bg-bg-card border border-industrial-border shadow-lg">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Total Records</span>
            <History className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="text-2xl font-bold font-display text-text-primary">{kpis.totalRecords}</div>
          <span className="text-[10px] text-text-muted mt-1 block">Logged maintenance services</span>
        </div>

        {/* Completed Services */}
        <div className="p-4 rounded-2xl bg-bg-card border border-industrial-border shadow-lg">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-status-success" />
          </div>
          <div className="text-2xl font-bold font-display text-status-success">{kpis.completedServices}</div>
          <span className="text-[10px] text-text-muted mt-1 block">Certified operational sign-offs</span>
        </div>

        {/* Pending Services */}
        <div className="p-4 rounded-2xl bg-bg-card border border-industrial-border shadow-lg">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Pending Review</span>
            <Clock className="w-4 h-4 text-status-warning" />
          </div>
          <div className="text-2xl font-bold font-display text-status-warning">{kpis.pendingServices}</div>
          <span className="text-[10px] text-text-muted mt-1 block">Awaiting documentation</span>
        </div>

        {/* Total Service Expenses */}
        <div className="p-4 rounded-2xl bg-bg-card border border-industrial-border shadow-lg">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Total Expenses</span>
            <DollarSign className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="text-2xl font-bold font-display text-accent-primary">{formatRupee(kpis.totalExpenses)}</div>
          <span className="text-[10px] text-text-muted mt-1 block font-mono">Certified maintenance ledger</span>
        </div>
      </div>

      {/* Filter Toolbar (Section 1.2) */}
      <div className="p-4 rounded-2xl bg-bg-card border border-industrial-border space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search asset, service ID, technician..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>

          {/* Service Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="ALL">Service Type: All</option>
              <option value="Preventive Maintenance">Preventive Maintenance</option>
              <option value="Corrective Maintenance">Corrective Maintenance</option>
              <option value="Emergency Repair">Emergency Repair</option>
              <option value="Inspection">Inspection</option>
              <option value="Replacement">Replacement</option>
              <option value="Calibration">Calibration</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="ALL">Status: All</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          {/* Technician Filter */}
          <div>
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary truncate"
            >
              <option value="ALL">Technician: All</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Start & End */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/2 px-2 py-1.5 rounded-xl bg-bg-elevated border border-industrial-border text-[11px] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              title="Start Date"
            />
            <span className="text-text-muted text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 px-2 py-1.5 rounded-xl bg-bg-elevated border border-industrial-border text-[11px] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              title="End Date"
            />
          </div>
        </div>

        {/* Footer Meta & Clear Filter */}
        <div className="flex items-center justify-between pt-2 border-t border-industrial-border/60 text-xs flex-wrap">
          <div className="flex items-center gap-2">
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

          <span className="text-[11px] font-mono text-text-muted">
            Displaying <strong className="text-text-primary">{filteredRecords.length}</strong> of {scopedHistory.length} service records
          </span>
        </div>
      </div>

      {/* Service History Table (Section 1.2) */}
      <div className="bg-bg-card rounded-2xl border border-industrial-border overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-industrial-border bg-bg-surface/60 text-text-secondary font-mono uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold">Service ID</th>
                <th className="py-3 px-4 font-semibold">Target Asset</th>
                <th className="py-3 px-4 font-semibold">Work Order</th>
                <th className="py-3 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('serviceDate')}
                    className="flex items-center gap-1 hover:text-text-primary transition-colors"
                  >
                    Service Date <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold">Technician</th>
                <th className="py-3 px-4 font-semibold">Service Type</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('totalCost')}
                    className="flex items-center gap-1 hover:text-text-primary transition-colors"
                  >
                    Total Cost <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-border/60">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((item) => {
                  const asset = getAsset(item.assetId);
                  const tech = getTech(item.technicianId);
                  const wo = getWO(item.workOrderId);
                  const status = (item.serviceStatus || 'COMPLETED').toUpperCase();

                  const canEditThis =
                    canManageService ||
                    (role === ROLES.TECHNICIAN && item.technicianId === currentUser?.id);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      onClick={() => setSelectedRecord(item)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-accent-primary">
                        {item.serviceId || item.id.toUpperCase()}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-text-primary font-medium truncate max-w-[170px]">
                          {asset?.name || 'Institutional Equipment'}
                        </div>
                        <span className="font-mono text-[10px] text-text-muted">
                          {asset?.assetId || item.assetId}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        {wo ? (
                          <span className="text-accent-primary font-bold">
                            {wo.workOrderId}
                          </span>
                        ) : (
                          <span className="text-text-muted">
                            {item.workOrderId || '—'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-text-secondary">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-text-muted" />
                          <span>{formatDate(item.serviceDate)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {tech ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center font-bold text-[9px] font-mono border border-accent-primary/30">
                              {tech.avatarInitials || tech.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-text-primary">{tech.name}</span>
                          </div>
                        ) : (
                          <span className="text-text-muted italic flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-text-muted" /> Field Tech
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[11px] font-medium text-text-secondary">
                          {item.serviceType || 'Maintenance'}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <p className="line-clamp-1 text-text-primary font-medium">
                          {item.problemIdentified || item.serviceDescription}
                        </p>
                        <span className="line-clamp-1 text-[10px] text-text-muted">
                          {item.workPerformed || item.actionTaken || 'Inspected and certified.'}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            status === 'COMPLETED'
                              ? 'bg-status-success/15 text-status-success border-status-success/30'
                              : status === 'IN_PROGRESS'
                              ? 'bg-accent-primary/15 text-accent-primary border-accent-primary/30'
                              : 'bg-status-warning/15 text-status-warning border-status-warning/30'
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-accent-primary">
                        {formatRupee(item.totalCost || 0)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(item)}
                            className="p-1 rounded-lg text-text-muted hover:text-accent-primary hover:bg-white/[0.08] transition-colors"
                            title="View Full Details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setPrintRecord(item)}
                            className="p-1 rounded-lg text-text-muted hover:text-accent-primary hover:bg-white/[0.08] transition-colors"
                            title="Print Report Certificate"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {canEditThis && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRecord(item);
                                setServiceModalOpen(true);
                              }}
                              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.08] transition-colors"
                              title="Edit Service Record"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {canManageService && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmRecord(item)}
                              className="p-1 rounded-lg text-text-muted hover:text-status-critical hover:bg-status-critical/10 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-text-muted">
                    No service history records found matching active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-industrial-border bg-bg-surface/30 text-xs">
            <span className="text-text-muted font-mono">
              Page {currentPage} of {totalPages} ({sortedRecords.length} records)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-industrial-border bg-bg-elevated text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-industrial-border bg-bg-elevated text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Service Details Modal (Section 1.3) */}
      {selectedRecord && (
        <ServiceDetailModal
          isOpen={Boolean(selectedRecord)}
          onClose={() => setSelectedRecord(null)}
          record={selectedRecord}
          asset={getAsset(selectedRecord.assetId)}
          technician={getTech(selectedRecord.technicianId)}
          workOrder={getWO(selectedRecord.workOrderId)}
          onEdit={(rec) => {
            setEditingRecord(rec);
            setServiceModalOpen(true);
          }}
        />
      )}

      {/* Standalone Print Service Report Modal */}
      {printRecord && (
        <PrintServiceReportModal
          isOpen={Boolean(printRecord)}
          onClose={() => setPrintRecord(null)}
          record={printRecord}
          asset={getAsset(printRecord.assetId)}
          technician={getTech(printRecord.technicianId)}
          workOrder={getWO(printRecord.workOrderId)}
        />
      )}

      {/* Service Form Modal (Add / Edit) */}
      <ServiceFormModal
        isOpen={serviceModalOpen}
        onClose={() => {
          setServiceModalOpen(false);
          setEditingRecord(null);
        }}
        initialData={editingRecord}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-bg-card border border-status-critical/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-status-critical">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-text-primary font-display">
                Confirm Service Log Deletion
              </h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to permanently delete service record{' '}
              <strong className="text-accent-primary font-mono">
                {deleteConfirmRecord.serviceId || deleteConfirmRecord.id}
              </strong>{' '}
              ({deleteConfirmRecord.serviceType})? This action will remove the audit log entry from equipment lifecycle records.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmRecord(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={confirmDeleteRecord}
              >
                Delete Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
