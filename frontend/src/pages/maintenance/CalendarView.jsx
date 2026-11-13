import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import Button from '../../components/common/Button';
import {
  getMonthCalendarGrid,
  parseLocalDate,
  formatDateToISO,
  getEffectiveScheduleStatus,
  getTodayISO
} from '../../utils/dateHelpers';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarView({
  schedules = [],
  assets = [],
  onSelectEvent,
  onDateClick
}) {
  // Current calendar viewing month and year
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  // Generate calendar grid (Monday-Sunday)
  const calendarDays = useMemo(() => {
    return getMonthCalendarGrid(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Month label
  const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  // Map schedules by date string
  const eventsByDate = useMemo(() => {
    const map = {};
    schedules.forEach((sch) => {
      const dateKey = sch.dueDate;
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(sch);
    });
    return map;
  }, [schedules]);

  // Quick Asset lookup map
  const assetMap = useMemo(() => {
    const map = {};
    assets.forEach((a) => {
      map[a.id] = a;
      map[a.assetId] = a;
    });
    return map;
  }, [assets]);

  // Status Chip Colors
  const getEventBadgeClass = (status) => {
    switch (status) {
      case 'DUE':
        return 'bg-status-warning/20 text-status-warning border-status-warning/40 hover:bg-status-warning/30 shadow-glow-warning';
      case 'OVERDUE':
        return 'bg-status-critical/20 text-status-critical border-status-critical/40 hover:bg-status-critical/30 shadow-glow-critical';
      case 'COMPLETED':
        return 'bg-status-success/15 text-status-success border-status-success/30 hover:bg-status-success/25';
      case 'CANCELLED':
        return 'bg-white/[0.04] text-text-muted border-white/10 line-through opacity-60';
      case 'UPCOMING':
      default:
        return 'bg-status-info/15 text-status-info border-status-info/30 hover:bg-status-info/25';
    }
  };

  return (
    <div className="rounded-3xl border border-industrial-border bg-bg-card shadow-card-dark overflow-hidden">
      {/* Calendar Header Toolbar */}
      <div className="p-4 sm:p-6 border-b border-industrial-border bg-bg-secondary/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center text-accent-primary">
            <CalendarDays className="w-5 h-5" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold font-display text-text-primary tracking-tight">
              {monthName}
            </h2>
            <p className="text-xs font-mono text-text-muted">
              PREVENTIVE CALENDAR DISPATCH
            </p>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="font-mono text-xs"
          >
            Today
          </Button>

          <div className="flex items-center p-1 rounded-xl bg-bg-elevated border border-industrial-border">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-colors"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-industrial-border mx-1" />

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-colors"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Columns Header (Mon - Sun) */}
      <div className="grid grid-cols-7 border-b border-industrial-border bg-bg-secondary/40 text-center text-xs font-mono font-bold text-text-muted uppercase tracking-wider py-3">
        {WEEKDAYS.map((day, idx) => (
          <div key={day} className={idx >= 5 ? 'text-accent-primary/50' : ''}>
            {day}
          </div>
        ))}
      </div>

      {/* 7-Column Days Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-industrial-border/60 bg-bg-primary/40">
        {calendarDays.map((cell) => {
          const dayEvents = eventsByDate[cell.dateString] || [];
          const isTodayCell = cell.isToday;

          return (
            <div
              key={cell.dateString}
              onClick={() => onDateClick(cell.dateString)}
              className={`min-h-[110px] sm:min-h-[130px] p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                cell.isCurrentMonth
                  ? 'bg-bg-card hover:bg-white/[0.02]'
                  : 'bg-bg-primary/80 opacity-40 hover:opacity-70'
              } ${isTodayCell ? 'bg-accent-primary/[0.04] ring-1 ring-inset ring-accent-primary/40' : ''}`}
            >
              {/* Day Cell Top Bar */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-mono font-bold w-6 h-6 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isTodayCell
                      ? 'bg-accent-primary text-bg-primary shadow-glow-sm'
                      : cell.isCurrentMonth
                      ? 'text-text-primary'
                      : 'text-text-muted'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {isTodayCell && (
                  <span className="text-[9px] font-mono font-bold uppercase text-accent-primary tracking-wider hidden sm:inline">
                    TODAY
                  </span>
                )}
              </div>

              {/* Day Scheduled Events Stack */}
              <div className="flex-1 space-y-1 overflow-hidden">
                {dayEvents.slice(0, 2).map((ev) => {
                  const status = getEffectiveScheduleStatus(ev);
                  const badgeStyle = getEventBadgeClass(status);
                  const asset = assetMap[ev.assetId];

                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(ev);
                      }}
                      className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-medium truncate transition-all cursor-pointer flex items-center justify-between gap-1 ${badgeStyle}`}
                      title={`${ev.title} (${asset?.assetId || ev.assetId}) - Status: ${status}`}
                    >
                      <span className="truncate">{ev.title}</span>
                      <span className="text-[9px] font-bold shrink-0 opacity-80 uppercase">
                        {status.slice(0, 3)}
                      </span>
                    </div>
                  );
                })}

                {/* "+N More" chip */}
                {dayEvents.length > 2 && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(dayEvents[0]);
                    }}
                    className="text-[10px] font-mono text-accent-primary hover:underline px-1 pt-0.5 cursor-pointer block"
                  >
                    +{dayEvents.length - 2} more...
                  </div>
                )}
              </div>

              {/* Hover Quick Add Indicator */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-right pt-1 pointer-events-none">
                <span className="text-[9px] font-mono text-accent-primary flex items-center justify-end gap-0.5">
                  <Plus className="w-2.5 h-2.5" /> Add
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
