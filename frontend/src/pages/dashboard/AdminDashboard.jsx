import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Users,
  Wrench,
  Calendar,
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  Plus,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area
} from 'recharts';
import MetricCard from '../../components/cards/MetricCard';
import Card from '../../components/cards/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useAppData } from '../../context/AppDataContext';
import { formatRupee } from '../../utils/formatters';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { assets, workOrders, schedules, repairCosts, users, metrics } = useAppData();

  // Category distribution data
  const categoryData = React.useMemo(() => {
    const counts = {};
    assets.forEach((a) => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });
    return Object.keys(counts).map((key) => ({
      name: key,
      value: counts[key]
    }));
  }, [assets]);

  // Work order status distribution data
  const woStatusData = React.useMemo(() => {
    const statuses = ['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'CLOSED'];
    return statuses.map((st) => ({
      status: st.replace('_', ' '),
      count: workOrders.filter((w) => w.status === st).length
    }));
  }, [workOrders]);

  // Monthly expense trend data
  const costTrendData = [
    { month: 'Jun', amount: 12500 },
    { month: 'Jul', amount: 8900 },
    { month: 'Aug', amount: 15400 },
    { month: 'Sep', amount: 11200 },
    { month: 'Oct', amount: metrics.totalRepairCost || 16400 }
  ];

  // Colors for charts
  const PIE_COLORS = ['#39FF88', '#00B894', '#5BA8FF', '#F5B942', '#FF5D62', '#A29BFE', '#FD79A8'];

  // Critical alerts list
  const criticalTickets = workOrders
    .filter((w) => w.priority === 'CRITICAL' || w.priority === 'HIGH')
    .slice(0, 4);

  // Recent work orders
  const recentOrders = workOrders.slice(0, 4);

  // Technician workload calculation
  const techWorkload = React.useMemo(() => {
    const technicians = users.filter((u) => u.role === 'TECHNICIAN');
    return technicians.map((tech) => {
      const assignedCount = workOrders.filter(
        (w) => w.assignedTechnicianId === tech.id && w.status !== 'CLOSED' && w.status !== 'VERIFIED'
      ).length;
      return {
        id: tech.id,
        name: tech.name,
        department: tech.department,
        activeTasks: assignedCount
      };
    });
  }, [users, workOrders]);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
            Institutional Command Center
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Global telemetry, campus hardware health, and institutional maintenance expenditure.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/reports')}
            icon={FileText}
          >
            Export Report
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/app/assets')}
            icon={Plus}
          >
            Add New Asset
          </Button>
        </div>
      </div>

      {/* 6 KPI CARDS (PART 10.1) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Total Assets"
          value={metrics.totalAssets}
          subvalue={`${metrics.operationalAssets} Operational`}
          icon={Layers}
          status="neutral"
          onClick={() => navigate('/app/assets')}
        />

        <MetricCard
          title="Campus Users"
          value={metrics.totalUsers}
          subvalue="4 Active Roles"
          icon={Users}
          status="info"
          onClick={() => navigate('/app/users')}
        />

        <MetricCard
          title="Active Tickets"
          value={metrics.activeWorkOrders}
          subvalue={`${metrics.pendingWorkOrders} Pending`}
          icon={Wrench}
          status="warning"
          onClick={() => navigate('/app/work-orders')}
        />

        <MetricCard
          title="Maint. Due"
          value={metrics.maintenanceDueCount}
          subvalue={`${metrics.maintenanceOverdueCount} Overdue`}
          icon={Calendar}
          status={metrics.maintenanceOverdueCount > 0 ? 'critical' : 'warning'}
          onClick={() => navigate('/app/maintenance')}
        />

        <MetricCard
          title="Critical Alerts"
          value={metrics.criticalAlertsCount}
          subvalue="High Attention"
          icon={AlertTriangle}
          status="critical"
          onClick={() => navigate('/app/work-orders')}
        />

        <MetricCard
          title="Repair Expense"
          value={formatRupee(metrics.totalRepairCost)}
          subvalue={`${repairCosts.length} itemized bills`}
          icon={DollarSign}
          status="success"
          onClick={() => navigate('/app/costs')}
        />
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <Card title="Hardware Distribution by Category" subtitle="Campus assets breakdown">
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121C15',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 justify-center">
            {categoryData.slice(0, 4).map((c, i) => (
              <span key={c.name} className="text-[10px] font-mono text-text-muted flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                {c.name} ({c.value})
              </span>
            ))}
          </div>
        </Card>

        {/* Work Orders by Status */}
        <Card title="Work Order Pipeline" subtitle="Current tickets across all stages">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={woStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="status" tick={{ fill: '#9AA79E', fontSize: 10 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fill: '#9AA79E', fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121C15',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" fill="#39FF88" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Monthly Maintenance Cost */}
        <Card title="Maintenance Expenditure Trend" subtitle="Monthly repair totals in ₹">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#39FF88" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#39FF88" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#9AA79E', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9AA79E', fontSize: 10 }} />
                <Tooltip
                  formatter={(val) => [formatRupee(val), 'Cost']}
                  contentStyle={{
                    backgroundColor: '#121C15',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="amount" stroke="#39FF88" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* RECENT TICKETS & TECHNICIAN WORKLOAD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical & High Priority Alerts */}
        <Card
          title="Critical & High Priority Tickets"
          subtitle="Immediate action required"
          action={
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate('/app/work-orders')}
            >
              View Kanban
            </Button>
          }
        >
          <div className="divide-y divide-industrial-border">
            {criticalTickets.length > 0 ? (
              criticalTickets.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-text-primary">
                        {t.workOrderId}
                      </span>
                      <Badge status={t.priority} size="xs" />
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5 truncate">
                      {t.title}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <Badge status={t.status} size="xs" />
                    <span className="text-[10px] font-mono text-text-muted block mt-1">
                      Due: {t.dueDate}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-text-muted py-4 text-center">No critical alerts pending.</p>
            )}
          </div>
        </Card>

        {/* Technician Workload */}
        <Card title="Technician Dispatch & Capacity" subtitle="Active work order allocations">
          <div className="divide-y divide-industrial-border">
            {techWorkload.map((t) => (
              <div key={t.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center text-accent-primary font-mono font-bold text-xs">
                    {t.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary">{t.name}</p>
                    <span className="text-[10px] font-mono text-text-muted">{t.department}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-semibold text-accent-primary">
                    {t.activeTasks} Active {t.activeTasks === 1 ? 'Task' : 'Tasks'}
                  </span>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => navigate('/app/work-orders')}
                  >
                    Assign
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
