import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  PlayCircle,
  FileCheck
} from 'lucide-react';
import MetricCard from '../../components/cards/MetricCard';
import Card from '../../components/cards/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { workOrders, schedules, updateWorkOrderStatus } = useAppData();
  const { showToast } = useToast();

  // Filter tasks assigned to this technician
  const myWorkOrders = workOrders.filter(
    (w) => w.assignedTechnicianId === currentUser?.id
  );

  const pendingCount = myWorkOrders.filter((w) => w.status === 'ASSIGNED').length;
  const inProgressCount = myWorkOrders.filter((w) => w.status === 'IN_PROGRESS').length;
  const completedCount = myWorkOrders.filter(
    (w) => w.status === 'COMPLETED' || w.status === 'VERIFIED' || w.status === 'CLOSED'
  ).length;

  // Active tickets that need attention
  const activeTasks = myWorkOrders
    .filter((w) => w.status === 'ASSIGNED' || w.status === 'IN_PROGRESS')
    .slice(0, 4);

  // Quick Action: Start work
  const handleStartWork = (workOrderId) => {
    updateWorkOrderStatus(workOrderId, 'IN_PROGRESS', 'Started physical diagnostic by technician');
    showToast({
      type: 'success',
      title: 'Work Started',
      message: `Work Order status updated to IN_PROGRESS.`
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
            Technician Field Console
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Welcome back, {currentUser?.name}. Here are your assigned repairs and maintenance tasks.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/app/work-orders')}
          icon={Wrench}
        >
          Open Work Order Kanban
        </Button>
      </div>

      {/* 5 KPI CARDS (PART 10.3) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <MetricCard
          title="Assigned Tickets"
          value={myWorkOrders.length}
          subvalue="Total Allocated"
          icon={Wrench}
          status="neutral"
          onClick={() => navigate('/app/work-orders')}
        />

        <MetricCard
          title="Pending Start"
          value={pendingCount}
          subvalue="Assigned State"
          icon={Clock}
          status="warning"
          onClick={() => navigate('/app/work-orders')}
        />

        <MetricCard
          title="In Progress"
          value={inProgressCount}
          subvalue="Actively Servicing"
          icon={PlayCircle}
          status="info"
          onClick={() => navigate('/app/work-orders')}
        />

        <MetricCard
          title="Completed"
          value={completedCount}
          subvalue="Resolved Jobs"
          icon={CheckCircle2}
          status="success"
          onClick={() => navigate('/app/work-orders')}
        />

        <MetricCard
          title="Upcoming Maint."
          value={schedules.length}
          subvalue="Campus Schedule"
          icon={Calendar}
          status="neutral"
          onClick={() => navigate('/app/maintenance')}
        />
      </div>

      {/* ACTIVE DISPATCH TASKS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="My Priority Assigned Work Orders"
          subtitle="Tickets requiring immediate attention"
          action={
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate('/app/work-orders')}
            >
              All My Jobs
            </Button>
          }
        >
          <div className="divide-y divide-industrial-border">
            {activeTasks.length > 0 ? (
              activeTasks.map((task) => (
                <div key={task.id} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-text-primary">
                        {task.workOrderId}
                      </span>
                      <Badge status={task.priority} size="xs" />
                    </div>
                    <Badge status={task.status} size="xs" />
                  </div>

                  <p className="text-xs font-medium text-text-primary">
                    {task.title}
                  </p>
                  <p className="text-xs text-text-muted line-clamp-2">
                    {task.description}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-text-muted">
                      Due Date: {task.dueDate}
                    </span>

                    {task.status === 'ASSIGNED' ? (
                      <Button
                        variant="primary"
                        size="xs"
                        icon={PlayCircle}
                        onClick={() => handleStartWork(task.id)}
                      >
                        Start Work
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => navigate('/app/work-orders')}
                      >
                        Update Progress
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-text-muted py-6 text-center">
                No active pending tasks. All assigned jobs are up to date!
              </p>
            )}
          </div>
        </Card>

        {/* RECENT COMPLETED WORK */}
        <Card
          title="Recent Work Logged"
          subtitle="Completed maintenance and repair records"
          action={
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate('/app/service-history')}
            >
              Service History
            </Button>
          }
        >
          <div className="divide-y divide-industrial-border">
            {myWorkOrders
              .filter((w) => w.status === 'COMPLETED' || w.status === 'VERIFIED' || w.status === 'CLOSED')
              .slice(0, 4)
              .map((w) => (
                <div key={w.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-text-primary">
                      {w.workOrderId}
                    </span>
                    <Badge status={w.status} size="xs" />
                  </div>
                  <p className="text-xs text-text-secondary truncate">
                    {w.title}
                  </p>
                  {w.resolutionDescription && (
                    <p className="text-[11px] text-accent-primary/90 font-mono">
                      ✓ {w.resolutionDescription}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
