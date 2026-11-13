import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Activity,
  Wrench,
  Calendar,
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  Clock,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import MetricCard from '../../components/cards/MetricCard';
import Card from '../../components/cards/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useAppData } from '../../context/AppDataContext';
import { formatRupee } from '../../utils/formatters';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { assets, workOrders, schedules, repairCosts, users, metrics } = useAppData();

  // Pending verification tasks (COMPLETED work orders waiting for manager verification)
  const pendingVerifications = workOrders.filter((w) => w.status === 'COMPLETED');

  // Upcoming maintenance schedule preview
  const upcomingSchedules = schedules
    .filter((s) => s.status === 'DUE' || s.status === 'UPCOMING' || s.status === 'OVERDUE')
    .slice(0, 4);

  // Asset health summary
  const averageHealth = React.useMemo(() => {
    if (!assets.length) return 0;
    const sum = assets.reduce((acc, a) => acc + (a.healthScore || 90), 0);
    return Math.round(sum / assets.length);
  }, [assets]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
            Facility Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Preventive servicing schedules, technician dispatches, and repair quality verifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/maintenance')}
            icon={Calendar}
          >
            Maintenance Calendar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/app/work-orders')}
            icon={Wrench}
          >
            Dispatch Kanban
          </Button>
        </div>
      </div>

      {/* 6 KPI CARDS (PART 10.2) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Total Assets"
          value={metrics.totalAssets}
          subvalue="Campus Inventory"
          icon={Layers}
          status="neutral"
          onClick={() => navigate('/app/assets')}
        />

        <MetricCard
          title="Operational"
          value={metrics.operationalAssets}
          subvalue={`${averageHealth}% Mean Health`}
          icon={Activity}
          status="success"
          onClick={() => navigate('/app/assets')}
        />

        <MetricCard
          title="In Repair"
          value={metrics.underMaintenanceAssets}
          subvalue="Active Servicing"
          icon={Wrench}
          status="warning"
          onClick={() => navigate('/app/assets')}
        />

        <MetricCard
          title="Pending Tickets"
          value={metrics.pendingWorkOrders}
          subvalue="Needs Assignment"
          icon={Clock}
          status="info"
          onClick={() => navigate('/app/work-orders')}
        />

        <MetricCard
          title="Overdue Maint."
          value={metrics.maintenanceOverdueCount}
          subvalue="High Priority"
          icon={AlertTriangle}
          status="critical"
          onClick={() => navigate('/app/maintenance')}
        />

        <MetricCard
          title="Monthly Expense"
          value={formatRupee(metrics.totalRepairCost)}
          subvalue="Audit Approved"
          icon={DollarSign}
          status="neutral"
          onClick={() => navigate('/app/costs')}
        />
      </div>

      {/* PENDING VERIFICATIONS ALERT */}
      {pendingVerifications.length > 0 && (
        <div className="p-4 rounded-2xl bg-status-warning/10 border border-status-warning/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-status-warning/20 text-status-warning flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                {pendingVerifications.length} Completed {pendingVerifications.length === 1 ? 'Work Order Requires' : 'Work Orders Require'} Manager Verification
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Technicians have completed physical repairs and logged resolution notes. Please review and verify.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/app/work-orders')}
            iconRight={ArrowRight}
          >
            Review in Kanban
          </Button>
        </div>
      )}

      {/* 2 COLUMN OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Schedule Preview */}
        <Card
          title="Upcoming Preventive Maintenance"
          subtitle="Scheduled servicing intervals"
          action={
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate('/app/maintenance')}
            >
              Open Calendar
            </Button>
          }
        >
          <div className="divide-y divide-industrial-border">
            {upcomingSchedules.length > 0 ? (
              upcomingSchedules.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-text-primary">{s.title}</p>
                    <span className="text-[11px] font-mono text-text-muted">
                      Type: {s.maintenanceType} • Recurrence: {s.recurrence}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <Badge status={s.status} size="xs" />
                    <span className="text-[10px] font-mono text-text-muted block mt-1">
                      Due: {s.dueDate}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-text-muted py-4 text-center">No upcoming maintenance due.</p>
            )}
          </div>
        </Card>

        {/* Work Order Progress */}
        <Card
          title="Recent Work Order Pipeline"
          subtitle="Latest reported campus issues"
          action={
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate('/app/work-orders')}
            >
              Manage Tickets
            </Button>
          }
        >
          <div className="divide-y divide-industrial-border">
            {workOrders.slice(0, 4).map((wo) => (
              <div key={wo.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-text-primary">
                      {wo.workOrderId}
                    </span>
                    <Badge status={wo.priority} size="xs" />
                  </div>
                  <p className="text-xs text-text-secondary truncate mt-0.5">
                    {wo.title}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <Badge status={wo.status} size="xs" />
                  <span className="text-[10px] font-mono text-text-muted block mt-1">
                    {wo.createdAt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
