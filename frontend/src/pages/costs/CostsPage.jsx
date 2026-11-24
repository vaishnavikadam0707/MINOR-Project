import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  Download,
  Plus,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  PieChart as PieChartIcon,
  RefreshCw,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/cards/Card';
import MetricCard from '../../components/cards/MetricCard';
import InvoiceModal from './components/InvoiceModal';
import ExpenseFormModal from './components/ExpenseFormModal';
import ServiceDetailModal from '../history/components/ServiceDetailModal';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../utils/permissions';
import { formatRupee, formatDate } from '../../utils/formatters';

// Palette for Category Pie Chart
const CATEGORY_COLORS = [
  '#39FF88', // Neon Green
  '#38BDF8', // Sky Blue
  '#F59E0B', // Amber
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#F43F5E'  // Rose
];

export default function CostsPage() {
  const { repairCosts, assets, workOrders, serviceHistory, metrics, deleteRepairCost } = useAppData();
  const { role } = useAuth();
  const { showToast } = useToast();

  const canManageCosts = role === ROLES.ADMIN || role === ROLES.MANAGER;

  // Modals state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedInvoiceCost, setSelectedInvoiceCost] = useState(null);
  const [selectedServiceRecord, setSelectedServiceRecord] = useState(null);
  const [deleteConfirmCost, setDeleteConfirmCost] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sorting state
  const [sortField, setSortField] = useState('date'); // 'date' | 'totalCost' | 'asset'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Helper: Find asset by ID
  const getAsset = (assetId) => {
    return assets.find((a) => a.id === assetId || a.assetId === assetId);
  };

  // Helper: Find work order by ID
  const getWorkOrder = (woId) => {
    if (!woId) return null;
    return workOrders.find((w) => w.id === woId || w.workOrderId === woId);
  };

  // Helper: Find service history by ID
  const getServiceHistory = (shId) => {
    if (!shId) return null;
    return serviceHistory.find((s) => s.id === shId || s.serviceId === shId);
  };

  // Extract distinct categories from assets
  const availableCategories = useMemo(() => {
    const cats = new Set();
    assets.forEach((a) => {
      if (a.category) cats.add(a.category);
    });
    return Array.from(cats).sort();
  }, [assets]);

  // Filtered & Sorted Repair Costs
  const filteredCosts = useMemo(() => {
    return repairCosts.filter((cost) => {
      const asset = getAsset(cost.assetId);
      const assetName = asset?.name || '';
      const assetCode = asset?.assetId || cost.assetId || '';
      const expenseId = cost.expenseId || cost.id || '';
      const invoiceNum = cost.invoiceNumber || '';
      const description = cost.description || '';

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          assetName.toLowerCase().includes(q) ||
          assetCode.toLowerCase().includes(q) ||
          expenseId.toLowerCase().includes(q) ||
          invoiceNum.toLowerCase().includes(q) ||
          description.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Category Filter
      if (categoryFilter !== 'ALL') {
        if (!asset || asset.category !== categoryFilter) return false;
      }

      // Payment Status Filter
      if (paymentStatusFilter !== 'ALL') {
        const status = (cost.paymentStatus || 'PAID').toUpperCase();
        if (status !== paymentStatusFilter) return false;
      }

      // Date Range Filter
      const costDate = cost.expenseDate || cost.serviceDate || '';
      if (startDate && costDate < startDate) return false;
      if (endDate && costDate > endDate) return false;

      return true;
    }).sort((a, b) => {
      if (sortField === 'date') {
        const dateA = a.expenseDate || a.serviceDate || '';
        const dateB = b.expenseDate || b.serviceDate || '';
        return sortOrder === 'asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
      }
      if (sortField === 'totalCost') {
        const costA = Number(a.totalCost) || 0;
        const costB = Number(b.totalCost) || 0;
        return sortOrder === 'asc' ? costA - costB : costB - costA;
      }
      if (sortField === 'asset') {
        const assetA = getAsset(a.assetId)?.name || '';
        const assetB = getAsset(b.assetId)?.name || '';
        return sortOrder === 'asc' ? assetA.localeCompare(assetB) : assetB.localeCompare(assetA);
      }
      return 0;
    });
  }, [repairCosts, assets, searchQuery, categoryFilter, paymentStatusFilter, startDate, endDate, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredCosts.length / itemsPerPage) || 1;
  const paginatedCosts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCosts.slice(start, start + itemsPerPage);
  }, [filteredCosts, currentPage, itemsPerPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'totalCost' ? 'desc' : 'desc');
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setPaymentStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    categoryFilter !== 'ALL' ||
    paymentStatusFilter !== 'ALL' ||
    Boolean(startDate) ||
    Boolean(endDate);

  // ==========================================
  // CHART DATA COMPUTATIONS
  // ==========================================

  // 1. Monthly Maintenance Expenses (Chronological Trend)
  const monthlyData = useMemo(() => {
    if (!repairCosts.length) return [];
    const map = new Map();

    repairCosts.forEach((rc) => {
      const d = rc.expenseDate || rc.serviceDate;
      if (!d) return;
      const key = d.substring(0, 7); // YYYY-MM
      const amount = Number(rc.totalCost) || 0;
      map.set(key, (map.get(key) || 0) + amount);
    });

    const sortedKeys = Array.from(map.keys()).sort();
    return sortedKeys.map((key) => {
      const [year, month] = key.split('-');
      const dateObj = new Date(Number(year), Number(month) - 1, 1);
      const label = dateObj.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      return {
        month: label,
        rawMonth: key,
        total: map.get(key)
      };
    });
  }, [repairCosts]);

  // 2. Expenses by Asset Category
  const categoryChartData = useMemo(() => {
    if (!repairCosts.length) return [];
    const map = new Map();

    repairCosts.forEach((rc) => {
      const asset = getAsset(rc.assetId);
      const cat = asset?.category || 'General';
      const amount = Number(rc.totalCost) || 0;
      map.set(cat, (map.get(cat) || 0) + amount);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [repairCosts, assets]);

  // 3. Expenses by Service Type
  const serviceTypeData = useMemo(() => {
    if (!repairCosts.length) return [];
    const map = new Map();

    repairCosts.forEach((rc) => {
      let type = 'Corrective Maintenance';
      const sh = getServiceHistory(rc.serviceId);
      if (sh?.serviceType) {
        type = sh.serviceType;
      } else {
        const wo = getWorkOrder(rc.workOrderId);
        if (wo?.linkedScheduleId) {
          type = 'Preventive Maintenance';
        } else if (wo?.priority === 'CRITICAL') {
          type = 'Emergency Repair';
        } else if (rc.description && rc.description.toLowerCase().includes('preventive')) {
          type = 'Preventive Maintenance';
        } else if (rc.description && rc.description.toLowerCase().includes('emergency')) {
          type = 'Emergency Repair';
        } else if (rc.description && rc.description.toLowerCase().includes('upgrade')) {
          type = 'Hardware Upgrade';
        }
      }
      const amount = Number(rc.totalCost) || 0;
      map.set(type, (map.get(type) || 0) + amount);
    });

    return Array.from(map.entries())
      .map(([type, total]) => ({ type, total }))
      .sort((a, b) => b.total - a.total);
  }, [repairCosts, serviceHistory, workOrders]);

  // 4. Top 5 Assets by Maintenance Expenses (Horizontal Bar)
  const topAssetsData = useMemo(() => {
    if (!repairCosts.length) return [];
    const map = new Map();

    repairCosts.forEach((rc) => {
      const asset = getAsset(rc.assetId);
      const name = asset?.name || rc.assetId;
      const code = asset?.assetId || rc.assetId;
      const label = name.length > 16 ? `${name.substring(0, 14)}...` : name;
      const amount = Number(rc.totalCost) || 0;

      if (!map.has(code)) {
        map.set(code, { name: label, fullName: `${code} - ${name}`, total: 0 });
      }
      map.get(code).total += amount;
    });

    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [repairCosts, assets]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredCosts.length === 0) {
      showToast('No records to export with current filters.', 'warning');
      return;
    }

    const headers = [
      'Expense ID',
      'Invoice Number',
      'Asset ID',
      'Asset Name',
      'Category',
      'Work Order ID',
      'Service ID',
      'Expense Date',
      'Labour Cost (INR)',
      'Parts Cost (INR)',
      'Other Charges (INR)',
      'Total Cost (INR)',
      'Payment Status',
      'Description'
    ];

    const rows = filteredCosts.map((c) => {
      const asset = getAsset(c.assetId);
      return [
        c.expenseId || c.id,
        c.invoiceNumber || 'N/A',
        asset?.assetId || c.assetId || '',
        `"${(asset?.name || '').replace(/"/g, '""')}"`,
        asset?.category || '',
        c.workOrderId || '',
        c.serviceId || '',
        c.expenseDate || c.serviceDate || '',
        c.labourCost || 0,
        c.partsCost || 0,
        c.otherCharges || 0,
        c.totalCost || 0,
        c.paymentStatus || 'PAID',
        `"${(c.description || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SmartAssetCare_Repair_Costs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${filteredCosts.length} repair cost entries to CSV.`, 'success');
  };

  // Delete Action Handler
  const confirmDeleteExpense = () => {
    if (!deleteConfirmCost) return;
    deleteRepairCost(deleteConfirmCost.id);
    showToast(`Expense record ${deleteConfirmCost.expenseId || deleteConfirmCost.id} deleted.`, 'info');
    setDeleteConfirmCost(null);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-accent-primary/10 border border-accent-primary/30 text-accent-primary">
              <Receipt className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
              Repair Cost Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-2xl">
            Audit itemized labour fees, equipment parts invoices, contractor expenditures, and institutional maintenance budgets in INR (₹).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>

          {canManageCosts && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              }}
            >
              Record Expense
            </Button>
          )}
        </div>
      </div>

      {/* 2.1 SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Maintenance Expenses"
          value={formatRupee(metrics.totalRepairCost)}
          subvalue={`${repairCosts.length} recorded repairs`}
          icon={DollarSign}
          status="neutral"
        />

        <MetricCard
          title="This Month's Expenses"
          value={formatRupee(metrics.thisMonthExpenses)}
          subvalue="Current calendar month"
          icon={Calendar}
          status="info"
        />

        <MetricCard
          title="Average Repair Cost"
          value={formatRupee(metrics.averageRepairCost)}
          subvalue="Per completed repair"
          icon={TrendingUp}
          status="warning"
        />

        <MetricCard
          title="Highest Repair Cost"
          value={formatRupee(metrics.highestRepairCost)}
          subvalue="Single incident maximum"
          icon={AlertTriangle}
          status={metrics.highestRepairCost > 10000 ? 'critical' : 'neutral'}
        />
      </div>

      {/* 2.2 COST ANALYTICS & CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Maintenance Expenses */}
        <Card
          title="Monthly Expenditure Trend"
          subtitle="Capital spent on repairs over time (INR ₹)"
          icon={TrendingUp}
        >
          <div className="h-64 w-full pt-4">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 15, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="neonCostGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#39FF88" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#39FF88" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2E23" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#9AA79E', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#1F2E23' }}
                  />
                  <YAxis
                    tick={{ fill: '#9AA79E', fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#1F2E23' }}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121C15',
                      border: '1px solid rgba(57, 255, 136, 0.3)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                    }}
                    formatter={(value) => [formatRupee(value), 'Total Expenditure']}
                    labelStyle={{ color: '#F0F6F2', fontWeight: 'bold' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#39FF88"
                    strokeWidth={2.5}
                    fill="url(#neonCostGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-muted">
                No monthly maintenance expenses recorded yet.
              </div>
            )}
          </div>
        </Card>

        {/* Chart 2: Expenses by Asset Category */}
        <Card
          title="Expenses by Asset Category"
          subtitle="Expenditure distribution across equipment categories"
          icon={PieChartIcon}
        >
          <div className="h-64 w-full flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {categoryChartData.length > 0 ? (
              <>
                <div className="w-full sm:w-1/2 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell
                            key={`cat-cell-${index}`}
                            fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#121C15',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                        formatter={(val) => [formatRupee(val), 'Expense']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full sm:w-1/2 flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                  {categoryChartData.map((cat, i) => (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between text-xs font-mono p-1.5 rounded-lg bg-bg-surface/50 border border-industrial-border/40"
                    >
                      <span className="flex items-center gap-2 truncate text-text-secondary">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                        />
                        <span className="truncate">{cat.name}</span>
                      </span>
                      <span className="font-bold text-text-primary ml-2 shrink-0">
                        {formatRupee(cat.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-muted">
                No category breakdown data available.
              </div>
            )}
          </div>
        </Card>

        {/* Chart 3: Expenses by Service Type */}
        <Card
          title="Expenses by Service Type"
          subtitle="Preventive vs. Corrective vs. Emergency spending"
          icon={BarChart2}
        >
          <div className="h-64 w-full pt-4">
            {serviceTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceTypeData} margin={{ top: 10, right: 15, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2E23" vertical={false} />
                  <XAxis
                    dataKey="type"
                    tick={{ fill: '#9AA79E', fontSize: 10 }}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    axisLine={{ stroke: '#1F2E23' }}
                  />
                  <YAxis
                    tick={{ fill: '#9AA79E', fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#1F2E23' }}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121C15',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                    formatter={(val) => [formatRupee(val), 'Cost']}
                    labelStyle={{ color: '#F0F6F2', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="total" fill="#38BDF8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-muted">
                No service type breakdown available.
              </div>
            )}
          </div>
        </Card>

        {/* Chart 4: Top 5 Assets by Maintenance Expenses */}
        <Card
          title="Top 5 High-Maintenance Assets"
          subtitle="Equipment incurring the greatest cumulative expenditure"
          icon={AlertTriangle}
        >
          <div className="h-64 w-full pt-2">
            {topAssetsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={topAssetsData}
                  margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2E23" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: '#9AA79E', fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#1F2E23' }}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#9AA79E', fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#1F2E23' }}
                    width={95}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121C15',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                    formatter={(val) => [formatRupee(val), 'Total Maintenance']}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                    labelStyle={{ color: '#F0F6F2', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="total" fill="#A855F7" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-muted">
                No high-cost asset records logged yet.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 2.3 & 2.4 REPAIR COST TABLE, SEARCH & FILTERS */}
      <div className="space-y-4">
        {/* FILTERS BAR */}
        <div className="p-4 rounded-2xl bg-bg-card border border-industrial-border space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search asset, ID, bill number, description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-3 py-2 rounded-xl bg-bg-surface border border-industrial-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl bg-bg-surface border border-industrial-border text-xs text-text-primary focus:outline-none focus:border-accent-primary"
              >
                <option value="ALL">All Categories</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Status Dropdown */}
            <div>
              <select
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl bg-bg-surface border border-industrial-border text-xs text-text-primary focus:outline-none focus:border-accent-primary"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending Approval</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div>
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortField(field);
                  setSortOrder(order);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl bg-bg-surface border border-industrial-border text-xs text-text-primary focus:outline-none focus:border-accent-primary font-mono"
              >
                <option value="date-desc">Date (Newest first)</option>
                <option value="date-asc">Date (Oldest first)</option>
                <option value="totalCost-desc">Total Cost (Highest first)</option>
                <option value="totalCost-asc">Total Cost (Lowest first)</option>
                <option value="asset-asc">Asset Name (A - Z)</option>
                <option value="asset-desc">Asset Name (Z - A)</option>
              </select>
            </div>
          </div>

          {/* Secondary Row: Date Range & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-industrial-border/50 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-text-muted font-mono text-[11px] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Date Range:
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-lg bg-bg-surface border border-industrial-border text-text-primary text-xs focus:outline-none focus:border-accent-primary font-mono"
              />
              <span className="text-text-muted">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-lg bg-bg-surface border border-industrial-border text-text-primary text-xs focus:outline-none focus:border-accent-primary font-mono"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-text-muted font-mono text-[11px]">
                Showing {filteredCosts.length} of {repairCosts.length} expenses
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-2.5 py-1 rounded-lg text-accent-primary hover:bg-accent-primary/10 transition-colors font-mono text-[11px]"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2.3 REPAIR COST TABLE */}
        <div className="rounded-2xl border border-industrial-border overflow-hidden bg-bg-card shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-bg-secondary text-text-muted border-b border-industrial-border select-none">
                <tr>
                  <th
                    className="p-3.5 cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Expense ID</span>
                      <ArrowUpDown className="w-3 h-3 text-text-muted" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort('asset')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Target Asset</span>
                      <ArrowUpDown className="w-3 h-3 text-text-muted" />
                    </div>
                  </th>
                  <th className="p-3.5">Ref Work Order</th>
                  <th className="p-3.5">Ref Service ID</th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Date</span>
                      <ArrowUpDown className="w-3 h-3 text-text-muted" />
                    </div>
                  </th>
                  <th className="p-3.5 text-right">Labour (₹)</th>
                  <th className="p-3.5 text-right">Parts (₹)</th>
                  <th className="p-3.5 text-right">Other (₹)</th>
                  <th
                    className="p-3.5 text-right cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort('totalCost')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Total Cost</span>
                      <ArrowUpDown className="w-3 h-3 text-text-muted" />
                    </div>
                  </th>
                  <th className="p-3.5 text-center">Payment Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-industrial-border">
                {paginatedCosts.length > 0 ? (
                  paginatedCosts.map((c) => {
                    const asset = getAsset(c.assetId);
                    const wo = getWorkOrder(c.workOrderId);
                    const sh = getServiceHistory(c.serviceId);
                    const paymentStatus = (c.paymentStatus || 'PAID').toUpperCase();

                    return (
                      <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                        {/* Expense ID */}
                        <td className="p-3.5">
                          <span className="font-bold text-accent-primary">
                            {c.expenseId || c.id.toUpperCase()}
                          </span>
                          {c.invoiceNumber && (
                            <span className="text-[10px] text-text-muted block truncate max-w-[120px]">
                              Inv: {c.invoiceNumber}
                            </span>
                          )}
                        </td>

                        {/* Target Asset */}
                        <td className="p-3.5">
                          {asset ? (
                            <Link
                              to={`/app/assets/${asset.id}`}
                              className="font-bold text-text-primary hover:text-accent-primary transition-colors flex items-center gap-1 group/link"
                            >
                              <span className="truncate max-w-[180px]">{asset.name}</span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 text-accent-primary shrink-0 transition-opacity" />
                            </Link>
                          ) : (
                            <span className="text-text-muted">{c.assetId}</span>
                          )}
                          <span className="text-[10px] text-text-muted block">
                            {asset?.assetId || c.assetId} • {asset?.category || 'Equipment'}
                          </span>
                        </td>

                        {/* Work Order ID */}
                        <td className="p-3.5">
                          {c.workOrderId ? (
                            <Link
                              to={`/app/work-orders/${c.workOrderId}`}
                              className="text-text-secondary hover:text-accent-primary transition-colors underline decoration-dotted"
                            >
                              {c.workOrderId}
                            </Link>
                          ) : (
                            <span className="text-text-muted text-[11px]">—</span>
                          )}
                        </td>

                        {/* Service ID */}
                        <td className="p-3.5">
                          {c.serviceId ? (
                            <button
                              type="button"
                              onClick={() => {
                                const matchedSh = getServiceHistory(c.serviceId);
                                if (matchedSh) {
                                  setSelectedServiceRecord(matchedSh);
                                } else {
                                  setSelectedServiceRecord({
                                    id: c.serviceId,
                                    serviceId: c.serviceId,
                                    assetId: c.assetId,
                                    workOrderId: c.workOrderId,
                                    serviceDate: c.expenseDate || c.serviceDate,
                                    serviceType: 'Maintenance',
                                    serviceStatus: 'COMPLETED',
                                    problemIdentified: c.description || 'Routine service maintenance',
                                    workPerformed: c.description || 'Equipment inspected and serviced',
                                    labourCost: c.labourCost || 0,
                                    partsCost: c.partsCost || 0,
                                    otherCharges: c.otherCharges || 0,
                                    totalCost: c.totalCost || 0
                                  });
                                }
                              }}
                              className="px-2 py-0.5 rounded-md bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 border border-accent-primary/30 transition-colors cursor-pointer text-[11px]"
                              title="Click to view Technical Service Record"
                            >
                              {c.serviceId}
                            </button>
                          ) : (
                            <span className="text-text-muted text-[11px]">—</span>
                          )}
                        </td>

                        {/* Expense Date */}
                        <td className="p-3.5 text-text-secondary whitespace-nowrap">
                          {formatDate(c.expenseDate || c.serviceDate)}
                        </td>

                        {/* Labour Cost */}
                        <td className="p-3.5 text-right text-text-secondary">
                          {formatRupee(c.labourCost || 0)}
                        </td>

                        {/* Parts Cost */}
                        <td className="p-3.5 text-right text-text-secondary">
                          {formatRupee(c.partsCost || 0)}
                        </td>

                        {/* Other Cost */}
                        <td className="p-3.5 text-right text-text-secondary">
                          {formatRupee(c.otherCharges || 0)}
                        </td>

                        {/* Total Cost */}
                        <td className="p-3.5 text-right font-bold text-accent-primary text-sm whitespace-nowrap">
                          {formatRupee(c.totalCost)}
                        </td>

                        {/* Payment Status Badge */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          {paymentStatus === 'PAID' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-operational/10 text-status-operational border border-status-operational/30">
                              <CheckCircle2 className="w-3 h-3" /> PAID
                            </span>
                          )}
                          {paymentStatus === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-warning/10 text-status-warning border border-status-warning/30">
                              <Clock className="w-3 h-3" /> PENDING
                            </span>
                          )}
                          {paymentStatus === 'OVERDUE' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-critical/10 text-status-critical border border-status-critical/30">
                              <AlertTriangle className="w-3 h-3" /> OVERDUE
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedInvoiceCost(c)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-accent-primary hover:bg-white/[0.05] transition-colors"
                              title="View Invoice Sheet"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            {canManageCosts && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingExpense(c);
                                    setExpenseModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-colors"
                                  title="Edit Expense"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => setDeleteConfirmCost(c)}
                                  className="p-1.5 rounded-lg text-text-muted hover:text-status-critical hover:bg-status-critical/10 transition-colors"
                                  title="Delete Expense"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="11" className="p-12 text-center text-text-muted">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-text-muted/40" />
                        <span className="text-sm font-semibold">No repair expenses match current criteria.</span>
                        <span className="text-xs text-text-muted">
                          Try resetting filters or recording a new repair expenditure.
                        </span>
                        {hasActiveFilters && (
                          <button
                            onClick={clearFilters}
                            className="mt-2 text-xs text-accent-primary hover:underline font-mono"
                          >
                            Reset all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-industrial-border bg-bg-surface/30 text-xs font-mono">
            <div className="flex items-center gap-2 text-text-muted">
              <span>Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded bg-bg-surface border border-industrial-border text-text-primary text-xs focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>
                Page {currentPage} of {totalPages}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                icon={ChevronRight}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2.5 EXPENSE FORM MODAL (ADD / EDIT) */}
      <ExpenseFormModal
        isOpen={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        initialData={editingExpense}
      />

      {/* 2.6 INVOICE MODAL */}
      {selectedInvoiceCost && (
        <InvoiceModal
          isOpen={Boolean(selectedInvoiceCost)}
          onClose={() => setSelectedInvoiceCost(null)}
          expense={selectedInvoiceCost}
          asset={getAsset(selectedInvoiceCost.assetId)}
          workOrder={getWorkOrder(selectedInvoiceCost.workOrderId)}
        />
      )}

      {/* SERVICE DETAIL MODAL */}
      {selectedServiceRecord && (
        <ServiceDetailModal
          isOpen={Boolean(selectedServiceRecord)}
          onClose={() => setSelectedServiceRecord(null)}
          record={selectedServiceRecord}
          asset={getAsset(selectedServiceRecord.assetId)}
          workOrder={getWorkOrder(selectedServiceRecord.workOrderId)}
        />
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmCost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-bg-card border border-status-critical/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-status-critical">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-text-primary font-display">
                Confirm Expenditure Deletion
              </h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to permanently delete expense record{' '}
              <strong className="text-accent-primary font-mono">
                {deleteConfirmCost.expenseId || deleteConfirmCost.id}
              </strong>{' '}
              ({formatRupee(deleteConfirmCost.totalCost)})? This will remove the audit trail from institutional financial statements.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmCost(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={confirmDeleteExpense}
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
