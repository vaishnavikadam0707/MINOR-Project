import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Download,
  RotateCcw,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  MapPin,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import Button from '../../components/common/Button';
import SearchInput from '../../components/forms/SearchInput';
import SelectInput from '../../components/forms/SelectInput';
import Badge from '../../components/common/Badge';
import MetricCard from '../../components/cards/MetricCard';
import AssetFormModal from './AssetFormModal';
import DeleteAssetModal from './DeleteAssetModal';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasPermission } from '../../utils/permissions';
import { formatDate } from '../../utils/formatters';

export default function AssetInventoryPage() {
  const navigate = useNavigate();
  const { assets, schedules, metrics } = useAppData();
  const { role } = useAuth();
  const { showToast } = useToast();

  // View state: 'grid' or 'table'
  const [viewMode, setViewMode] = useState('grid');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Sorting state (for table view)
  const [sortField, setSortField] = useState('assetId');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  // Pagination state (for table view)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedAssetForEdit, setSelectedAssetForEdit] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAssetForDelete, setSelectedAssetForDelete] = useState(null);

  // Permissions
  const canAdd = hasPermission(role, 'CAN_ADD_ASSET');
  const canEdit = hasPermission(role, 'CAN_EDIT_ASSET');
  const canDelete = hasPermission(role, 'CAN_DELETE_ASSET') || role === 'MANAGER';

  // Dynamic filter options derived from current asset dataset
  const categoryOptions = useMemo(() => {
    const unique = Array.from(new Set(assets.map((a) => a.category).filter(Boolean)));
    return unique.sort().map((c) => ({ value: c, label: c }));
  }, [assets]);

  const locationOptions = useMemo(() => {
    const unique = Array.from(new Set(assets.map((a) => a.location).filter(Boolean)));
    return unique.sort().map((l) => ({ value: l, label: l }));
  }, [assets]);

  const departmentOptions = useMemo(() => {
    const unique = Array.from(new Set(assets.map((a) => a.department).filter(Boolean)));
    return unique.sort().map((d) => ({ value: d, label: d }));
  }, [assets]);

  const statusOptions = [
    { value: 'OPERATIONAL', label: 'Operational' },
    { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
    { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
    { value: 'RETIRED', label: 'Retired' }
  ];

  // Map next maintenance date helper
  const getNextMaintenance = (assetId, assetCode) => {
    const matched = schedules.filter(
      (s) => s.assetId === assetId || s.assetId === assetCode
    );
    const active = matched.find(
      (s) => s.status === 'UPCOMING' || s.status === 'DUE' || s.status === 'OVERDUE'
    );
    return active ? active.dueDate : null;
  };

  // Check if any filter is active
  const isFiltered = Boolean(
    searchQuery || selectedCategory || selectedLocation || selectedDepartment || selectedStatus
  );

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
    setSelectedDepartment('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  // Combined Filtering
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = asset.name?.toLowerCase().includes(q);
        const matchesId = asset.assetId?.toLowerCase().includes(q);
        const matchesSerial = asset.serialNumber?.toLowerCase().includes(q);
        const matchesBrand = asset.brand?.toLowerCase().includes(q);
        const matchesModel = asset.model?.toLowerCase().includes(q);

        if (!matchesName && !matchesId && !matchesSerial && !matchesBrand && !matchesModel) {
          return false;
        }
      }

      // Category
      if (selectedCategory && asset.category !== selectedCategory) {
        return false;
      }

      // Location
      if (selectedLocation && asset.location !== selectedLocation) {
        return false;
      }

      // Department
      if (selectedDepartment && asset.department !== selectedDepartment) {
        return false;
      }

      // Status
      if (selectedStatus && asset.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [assets, searchQuery, selectedCategory, selectedLocation, selectedDepartment, selectedStatus]);

  // Sorting
  const sortedAssets = useMemo(() => {
    const list = [...filteredAssets];
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredAssets, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedAssets.length / pageSize) || 1;
  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAssets.slice(start, start + pageSize);
  }, [sortedAssets, currentPage, pageSize]);

  // Handle Sort Change
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!sortedAssets.length) {
      showToast({
        type: 'warning',
        title: 'No Data to Export',
        message: 'Current filter results are empty.'
      });
      return;
    }

    const headers = [
      'Asset ID',
      'Name',
      'Category',
      'Status',
      'Health (%)',
      'Brand',
      'Model',
      'Serial Number',
      'Location',
      'Department',
      'Purchase Date',
      'Purchase Cost',
      'Warranty Expiry'
    ];

    const rows = sortedAssets.map((a) => [
      `"${a.assetId || ''}"`,
      `"${(a.name || '').replace(/"/g, '""')}"`,
      `"${a.category || ''}"`,
      `"${a.status || ''}"`,
      a.healthScore || 0,
      `"${a.brand || ''}"`,
      `"${a.model || ''}"`,
      `"${a.serialNumber || ''}"`,
      `"${(a.location || '').replace(/"/g, '""')}"`,
      `"${(a.department || '').replace(/"/g, '""')}"`,
      `"${a.purchaseDate || ''}"`,
      a.purchaseCost || 0,
      `"${a.warrantyExpiry || ''}"`
    ]);

    const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SmartAssetCare_Assets_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast({
      type: 'success',
      title: 'CSV Export Generated',
      message: `Exported ${sortedAssets.length} asset records.`
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & PRIMARY ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
            Asset Management
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Monitor, organize and maintain all registered assets from one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-bg-card border border-industrial-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-accent-primary/20 text-accent-primary font-bold shadow-glow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline font-mono text-[11px]">Grid</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-accent-primary/20 text-accent-primary font-bold shadow-glow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="Table View"
              aria-label="Table View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline font-mono text-[11px]">Table</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>

          {canAdd && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setSelectedAssetForEdit(null);
                setFormModalOpen(true);
              }}
            >
              Add Asset
            </Button>
          )}
        </div>
      </div>

      {/* 2. FOUR KPI CARDS (PART 11.1) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Total Assets"
          value={metrics.totalAssets}
          subvalue="Campus Inventory"
          icon={Layers}
          status="neutral"
        />

        <MetricCard
          title="Operational"
          value={metrics.operationalAssets}
          subvalue="Active & Online"
          icon={CheckCircle2}
          status="success"
        />

        <MetricCard
          title="Under Maintenance"
          value={metrics.underMaintenanceAssets}
          subvalue="In Repair Pipeline"
          icon={AlertTriangle}
          status="warning"
        />

        <MetricCard
          title="Out of Service / Retired"
          value={metrics.outOfServiceAssets + metrics.retiredAssets}
          subvalue="Requires Attention"
          icon={RotateCcw}
          status={metrics.outOfServiceAssets > 0 ? 'critical' : 'neutral'}
        />
      </div>

      {/* 3. COMBINED SEARCH & FILTER BAR */}
      <div className="p-4 rounded-2xl bg-bg-card border border-industrial-border space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-5">
            <SearchInput
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onClear={() => setSearchQuery('')}
              placeholder="Search by name, ID, serial, model..."
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-2">
            <SelectInput
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              options={categoryOptions}
              placeholder="All Categories"
            />
          </div>

          {/* Department Filter */}
          <div className="md:col-span-2">
            <SelectInput
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setCurrentPage(1);
              }}
              options={departmentOptions}
              placeholder="All Departments"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <SelectInput
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              options={statusOptions}
              placeholder="All Statuses"
            />
          </div>

          {/* Clear Filters Button */}
          <div className="md:col-span-1 flex items-center justify-end">
            {isFiltered && (
              <button
                onClick={clearFilters}
                className="p-2 rounded-xl text-text-muted hover:text-accent-primary hover:bg-white/[0.04] transition-colors text-xs font-mono flex items-center gap-1"
                title="Clear all filters"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="md:hidden">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Results Info Row */}
        <div className="flex items-center justify-between text-xs font-mono text-text-muted pt-1">
          <span>
            Showing <strong className="text-text-primary">{filteredAssets.length}</strong> of{' '}
            {assets.length} registered assets
          </span>

          {isFiltered && (
            <span className="text-accent-primary flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
              Active Filters Applied
            </span>
          )}
        </div>
      </div>

      {/* 4. VIEW SELECTION (GRID OR TABLE) */}
      {filteredAssets.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-bg-card border border-industrial-border space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] text-text-muted flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-display text-text-primary">
            No Matching Assets Found
          </h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Try adjusting your search query, clearing category or department filters to see more results.
          </p>
          {isFiltered && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Reset Filters
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (PART 11.2) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.map((asset) => {
            const nextMaint = getNextMaintenance(asset.id, asset.assetId);

            return (
              <div
                key={asset.id}
                onClick={() => navigate(`/app/assets/${asset.assetId}`)}
                className="group p-5 rounded-2xl bg-bg-card border border-industrial-border hover:border-accent-primary/40 hover:shadow-glow-sm hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Thumbnail photo */}
                      <div className="w-12 h-12 rounded-xl bg-bg-elevated border border-industrial-border overflow-hidden shrink-0 flex items-center justify-center group-hover:border-accent-primary/40 transition-colors">
                        <img
                          src={asset.image}
                          alt={asset.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <span className="text-[11px] font-mono font-bold text-accent-primary">
                          {asset.assetId}
                        </span>
                        <h3 className="text-sm font-bold font-display text-text-primary truncate group-hover:text-accent-primary transition-colors">
                          {asset.name}
                        </h3>
                        <span className="text-[10px] text-text-muted font-mono block">
                          {asset.category}
                        </span>
                      </div>
                    </div>

                    <Badge status={asset.status} size="xs" />
                  </div>

                  {/* Location & Department */}
                  <div className="space-y-1.5 py-2 text-xs font-mono text-text-secondary border-t border-b border-industrial-border/60">
                    <p className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span className="truncate">{asset.location}</span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate text-[11px] text-text-muted">
                      <Building className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span className="truncate">{asset.department}</span>
                    </p>
                  </div>
                </div>

                {/* Footer Metrics & Actions */}
                <div className="pt-3 mt-3 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-text-muted block">Next Service</span>
                    <span className="font-semibold text-text-primary">
                      {nextMaint ? formatDate(nextMaint) : '—'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-text-muted block">Health Score</span>
                    <span className="font-bold text-accent-primary">
                      {asset.healthScore}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (PART 11.3) */
        <div className="rounded-2xl border border-industrial-border overflow-hidden bg-bg-card shadow-card-dark">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-bg-secondary text-text-muted border-b border-industrial-border uppercase tracking-wider text-[11px]">
                <tr>
                  <th
                    className="p-4 cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => handleSort('assetId')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Asset ID</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th
                    className="p-4 cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Asset Name</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Status</th>
                  <th
                    className="p-4 cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => handleSort('healthScore')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Health</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="p-4">Next Maint.</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-industrial-border">
                {paginatedAssets.map((asset) => {
                  const nextMaint = getNextMaintenance(asset.id, asset.assetId);

                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => navigate(`/app/assets/${asset.assetId}`)}
                    >
                      <td className="p-4 font-bold text-accent-primary whitespace-nowrap">
                        {asset.assetId}
                      </td>

                      <td className="p-4 font-semibold text-text-primary font-sans">
                        <div className="flex items-center gap-2">
                          <span className="group-hover:text-accent-primary transition-colors">
                            {asset.name}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-text-secondary whitespace-nowrap">
                        {asset.category}
                      </td>

                      <td className="p-4 text-text-muted whitespace-nowrap max-w-xs truncate">
                        {asset.location}
                      </td>

                      <td className="p-4 text-text-muted whitespace-nowrap">
                        {asset.department}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <Badge status={asset.status} size="xs" />
                      </td>

                      <td className="p-4 font-bold text-accent-primary whitespace-nowrap">
                        {asset.healthScore}%
                      </td>

                      <td className="p-4 text-text-secondary whitespace-nowrap">
                        {nextMaint ? formatDate(nextMaint) : '—'}
                      </td>

                      <td
                        className="p-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/app/assets/${asset.assetId}`)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-accent-primary hover:bg-white/[0.04] transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => {
                                setSelectedAssetForEdit(asset);
                                setFormModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                              title="Edit asset"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => {
                                setSelectedAssetForDelete(asset);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-text-muted hover:text-status-critical hover:bg-status-critical/10 transition-colors"
                              title="Delete or archive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="p-4 border-t border-industrial-border bg-bg-secondary flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-text-muted">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-bg-elevated border border-industrial-border rounded-lg px-2 py-1 text-text-primary focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span>
                Page {currentPage} of {totalPages}
              </span>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-industrial-border bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed hover:text-text-primary transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-industrial-border bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed hover:text-text-primary transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <AssetFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedAssetForEdit(null);
        }}
        assetToEdit={selectedAssetForEdit}
      />

      <DeleteAssetModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedAssetForDelete(null);
        }}
        asset={selectedAssetForDelete}
      />
    </div>
  );
}
