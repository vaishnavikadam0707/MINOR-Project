import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  List,
  Search,
  Filter,
  RotateCcw,
  Layers,
  Wrench,
  Ban,
  Activity
} from 'lucide-react';
import Button from '../../components/common/Button';
import MetricCard from '../../components/cards/MetricCard';
import SearchInput from '../../components/forms/SearchInput';
import SelectInput from '../../components/forms/SelectInput';
import CalendarView from './CalendarView';
import ListView from './ListView';
import ScheduleFormModal from './ScheduleFormModal';
import ScheduleDetailsDrawer from './ScheduleDetailsDrawer';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasPermission } from '../../utils/permissions';
import { getEffectiveScheduleStatus } from '../../utils/dateHelpers';

export default function MaintenancePage() {
  const { schedules, assets, users, metrics } = useAppData();
  const { role } = useAuth();
  const { showToast } = useToast();

  // View state: 'calendar' or 'list'
  const [viewMode, setViewMode] = useState('calendar');

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal / Drawer states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState(null);
  const [modalInitialDate, setModalInitialDate] = useState(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedScheduleForDetails, setSelectedScheduleForDetails] = useState(null);

  // Role permissions
  const canCreate = hasPermission(role, 'CAN_CREATE_SCHEDULE');

  // Quick lookup dictionaries
  const assetMap = useMemo(() => {
    const map = {};
    assets.forEach((a) => {
      map[a.id] = a;
      map[a.assetId] = a;
    });
    return map;
  }, [assets]);

  const userMap = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      map[u.id] = u;
    });
    return map;
  }, [users]);

  // Dynamic filter dropdown options
  const assetOptions = useMemo(() => {
    return assets.map((a) => ({
      value: a.id,
      label: `${a.assetId} - ${a.name}`
    }));
  }, [assets]);

  const categoryOptions = useMemo(() => {
    const unique = Array.from(new Set(assets.map((a) => a.category).filter(Boolean)));
    return unique.sort().map((c) => ({ value: c, label: c }));
  }, [assets]);

  const locationOptions = useMemo(() => {
    const unique = Array.from(new Set(assets.map((a) => a.location).filter(Boolean)));
    return unique.sort().map((l) => ({ value: l, label: l }));
  }, [assets]);

  const technicianOptions = useMemo(() => {
    const techs = users.filter((u) => u.role === 'TECHNICIAN');
    return techs.map((t) => ({ value: t.id, label: t.name }));
  }, [users]);

  const priorityOptions = [
    { value: 'Low', label: 'Low Priority' },
    { value: 'Medium', label: 'Medium Priority' },
    { value: 'High', label: 'High Priority' },
    { value: 'Critical', label: 'Critical Priority' }
  ];

  const statusOptions = [
    { value: 'UPCOMING', label: 'Upcoming' },
    { value: 'DUE', label: 'Due Today' },
    { value: 'OVERDUE', label: 'Overdue' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  // Check if any filter is active
  const isFiltered = Boolean(
    searchQuery ||
    selectedAssetId ||
    selectedCategory ||
    selectedLocation ||
    selectedTechnicianId ||
    selectedPriority ||
    selectedStatus
  );

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedAssetId('');
    setSelectedCategory('');
    setSelectedLocation('');
    setSelectedTechnicianId('');
    setSelectedPriority('');
    setSelectedStatus('');
  };

  // -------------------------------------------------------------
  // COMBINED FILTERING (Section 7)
  // -------------------------------------------------------------
  const filteredSchedules = useMemo(() => {
    return schedules.filter((sch) => {
      const asset = assetMap[sch.assetId];
      const tech = userMap[sch.assignedTechnicianId];
      const effectiveStatus = getEffectiveScheduleStatus(sch);

      // Search matching title, asset name, asset ID, tech name, description
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = sch.title?.toLowerCase().includes(q);
        const matchesDesc = sch.description?.toLowerCase().includes(q);
        const matchesAssetName = asset?.name?.toLowerCase().includes(q);
        const matchesAssetId = asset?.assetId?.toLowerCase().includes(q);
        const matchesTech = tech?.name?.toLowerCase().includes(q);

        if (!matchesTitle && !matchesDesc && !matchesAssetName && !matchesAssetId && !matchesTech) {
          return false;
        }
      }

      // Asset filter
      if (selectedAssetId && sch.assetId !== selectedAssetId && asset?.id !== selectedAssetId) {
        return false;
      }

      // Category filter
      if (selectedCategory && asset?.category !== selectedCategory) {
        return false;
      }

      // Location filter
      if (selectedLocation && asset?.location !== selectedLocation) {
        return false;
      }

      // Technician filter
      if (selectedTechnicianId && sch.assignedTechnicianId !== selectedTechnicianId) {
        return false;
      }

      // Priority filter
      if (selectedPriority && (sch.priority || '').toLowerCase() !== selectedPriority.toLowerCase()) {
        return false;
      }

      // Status filter
      if (selectedStatus && effectiveStatus !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [
    schedules,
    searchQuery,
    selectedAssetId,
    selectedCategory,
    selectedLocation,
    selectedTechnicianId,
    selectedPriority,
    selectedStatus,
    assetMap,
    userMap
  ]);

  // Open Form modal prefilled with clicked calendar date
  const handleDateClick = (dateString) => {
    if (!canCreate) return;
    setScheduleToEdit(null);
    setModalInitialDate(dateString);
    setFormModalOpen(true);
  };

  // Open Details drawer for clicked event
  const handleSelectEvent = (schedule) => {
    setSelectedScheduleForDetails(schedule);
    setDetailsDrawerOpen(true);
  };

  // Open Edit modal from drawer or table
  const handleEditSchedule = (schedule) => {
    setSelectedScheduleForDetails(null);
    setDetailsDrawerOpen(false);
    setScheduleToEdit(schedule);
    setModalInitialDate(null);
    setFormModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & PRIMARY ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
            Maintenance Scheduling
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Plan preventive maintenance, monitor upcoming service activities and keep institutional assets operational.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-bg-card border border-industrial-border">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-accent-primary/20 text-accent-primary font-bold shadow-glow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="Calendar View"
              aria-label="Calendar View"
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline font-mono text-[11px]">Calendar</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-accent-primary/20 text-accent-primary font-bold shadow-glow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="List View"
              aria-label="List View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline font-mono text-[11px]">List</span>
            </button>
          </div>

          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setScheduleToEdit(null);
                setModalInitialDate(null);
                setFormModalOpen(true);
              }}
            >
              Add Schedule
            </Button>
          )}
        </div>
      </div>

      {/* 2. FOUR KPI CARDS (Section 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Upcoming Maintenance"
          value={metrics.upcomingSchedulesCount ?? 0}
          subvalue="Future Servicing Due"
          icon={CalendarIcon}
          status="info"
        />

        <MetricCard
          title="Due Today"
          value={metrics.dueTodaySchedulesCount ?? 0}
          subvalue="Immediate Action"
          icon={Clock}
          status="warning"
        />

        <MetricCard
          title="Overdue Maintenance"
          value={metrics.overdueSchedulesCount ?? 0}
          subvalue="Past Due Interval"
          icon={AlertTriangle}
          status={metrics.overdueSchedulesCount > 0 ? 'critical' : 'neutral'}
        />

        <MetricCard
          title="Completed Maintenance"
          value={metrics.completedSchedulesCount ?? 0}
          subvalue="Resolved Operations"
          icon={CheckCircle2}
          status="success"
        />
      </div>

      {/* 3. CALENDAR & LIST FILTERS TOOLBAR (Section 7) */}
      <div className="p-4 rounded-2xl bg-bg-card border border-industrial-border space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Free-text search */}
          <div className="md:col-span-4">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search title, asset, technician..."
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-2">
            <SelectInput
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={categoryOptions}
              placeholder="All Categories"
            />
          </div>

          {/* Technician Filter */}
          <div className="md:col-span-2">
            <SelectInput
              value={selectedTechnicianId}
              onChange={(e) => setSelectedTechnicianId(e.target.value)}
              options={technicianOptions}
              placeholder="All Technicians"
            />
          </div>

          {/* Priority Filter */}
          <div className="md:col-span-2">
            <SelectInput
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              options={priorityOptions}
              placeholder="All Priorities"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <SelectInput
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={statusOptions}
              placeholder="All Statuses"
            />
          </div>
        </div>

        {/* Filter Summary Row */}
        <div className="flex items-center justify-between text-xs font-mono text-text-muted pt-1">
          <span>
            Displaying <strong className="text-text-primary">{filteredSchedules.length}</strong> of{' '}
            {schedules.length} total scheduled events
          </span>

          {isFiltered && (
            <div className="flex items-center gap-2">
              <span className="text-accent-primary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
                Active Filters Applied
              </span>

              <button
                onClick={clearFilters}
                className="text-[11px] text-text-muted hover:text-accent-primary flex items-center gap-1 ml-2 underline"
              >
                <RotateCcw className="w-3 h-3" /> Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. ACTIVE VIEW MODE (CALENDAR OR LIST) */}
      {viewMode === 'calendar' ? (
        <CalendarView
          schedules={filteredSchedules}
          assets={assets}
          onSelectEvent={handleSelectEvent}
          onDateClick={handleDateClick}
        />
      ) : (
        <ListView
          schedules={filteredSchedules}
          assets={assets}
          users={users}
          onSelectSchedule={handleSelectEvent}
          onEditSchedule={handleEditSchedule}
          onCompleteSchedule={(sch) => {
            setSelectedScheduleForDetails(sch);
            setDetailsDrawerOpen(true);
          }}
        />
      )}

      {/* 5. ADD / EDIT SCHEDULE MODAL */}
      <ScheduleFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setScheduleToEdit(null);
          setModalInitialDate(null);
        }}
        scheduleToEdit={scheduleToEdit}
        initialDate={modalInitialDate}
      />

      {/* 6. SCHEDULE DETAILS DRAWER */}
      <ScheduleDetailsDrawer
        isOpen={detailsDrawerOpen}
        onClose={() => {
          setDetailsDrawerOpen(false);
          setSelectedScheduleForDetails(null);
        }}
        schedule={selectedScheduleForDetails}
        onEdit={handleEditSchedule}
      />
    </div>
  );
}
