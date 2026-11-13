// Centralized Date and Calendar Utilities for Smart AssetCare

/**
 * Safely parse a YYYY-MM-DD string into a local Date without UTC offset shifts
 */
export function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(dateStr);
}

/**
 * Format Date object into local YYYY-MM-DD ISO string
 */
export function formatDateToISO(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : parseLocalDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Return current local date as YYYY-MM-DD
 */
export function getTodayISO() {
  return formatDateToISO(new Date());
}

/**
 * Compare two dates or date strings by calendar day
 */
export function isSameDay(date1, date2) {
  if (!date1 || !date2) return false;
  return formatDateToISO(date1) === formatDateToISO(date2);
}

/**
 * Determine if a date is today
 */
export function isToday(dateStr) {
  return isSameDay(dateStr, new Date());
}

/**
 * Determine if a date is before today
 */
export function isBeforeToday(dateStr) {
  if (!dateStr) return false;
  return formatDateToISO(dateStr) < getTodayISO();
}

/**
 * Determine if a date is after today
 */
export function isAfterToday(dateStr) {
  if (!dateStr) return false;
  return formatDateToISO(dateStr) > getTodayISO();
}

/**
 * Format date for display: "3 Nov 2026"
 */
export function formatDateDisplay(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = parseLocalDate(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Calculate dynamic status for a maintenance schedule (Section 4)
 * Completed and cancelled schedules must never be classified as overdue.
 */
export function getEffectiveScheduleStatus(schedule) {
  if (!schedule) return 'UPCOMING';
  const rawStatus = (schedule.status || '').toUpperCase();

  if (rawStatus === 'COMPLETED') return 'COMPLETED';
  if (rawStatus === 'CANCELLED') return 'CANCELLED';

  const due = schedule.dueDate;
  if (!due) return 'UPCOMING';

  if (isToday(due)) return 'DUE';
  if (isBeforeToday(due)) return 'OVERDUE';
  return 'UPCOMING';
}

/**
 * Safely add calendar months with month-end day clamping (avoids Jan 31 -> Mar 3 overflow)
 */
export function addMonthsClamped(date, monthsToAdd) {
  const d = date instanceof Date ? new Date(date.getTime()) : parseLocalDate(date);
  const targetYear = d.getFullYear();
  const targetMonth = d.getMonth() + monthsToAdd;
  const originalDay = d.getDate();

  // Create temporary date on the 1st of target month
  const temp = new Date(targetYear, targetMonth, 1);
  // Total days in target month
  const daysInTargetMonth = new Date(temp.getFullYear(), temp.getMonth() + 1, 0).getDate();
  const clampedDay = Math.min(originalDay, daysInTargetMonth);

  return new Date(temp.getFullYear(), temp.getMonth(), clampedDay);
}

/**
 * Calculate next recurrence occurrence (Section 12)
 * Supports: 'One Time', 'Weekly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly'
 * Advances past missed intervals if completed late.
 */
export function calculateNextRecurrenceDate(currentDueDateStr, recurrence, referenceDateStr = null) {
  if (!recurrence || recurrence === 'One Time') return null;

  const currentDue = parseLocalDate(currentDueDateStr);
  const refDate = referenceDateStr ? parseLocalDate(referenceDateStr) : new Date();
  const refISO = formatDateToISO(refDate);

  let nextDate = new Date(currentDue.getTime());

  const advanceOneStep = (d) => {
    switch (recurrence) {
      case 'Weekly': {
        const next = new Date(d.getTime());
        next.setDate(next.getDate() + 7);
        return next;
      }
      case 'Monthly':
        return addMonthsClamped(d, 1);
      case 'Quarterly':
        return addMonthsClamped(d, 3);
      case 'Half Yearly':
        return addMonthsClamped(d, 6);
      case 'Yearly':
        return addMonthsClamped(d, 12);
      default:
        return null;
    }
  };

  // Advance by 1 interval
  nextDate = advanceOneStep(nextDate);
  if (!nextDate) return null;

  // If completed late, advance past missed intervals until strictly in the future
  let iterations = 0;
  while (formatDateToISO(nextDate) <= refISO && iterations < 50) {
    const advanced = advanceOneStep(nextDate);
    if (!advanced) break;
    nextDate = advanced;
    iterations++;
  }

  return formatDateToISO(nextDate);
}

/**
 * Build a 7-column calendar grid (Monday - Sunday) for a given year & month (0-11)
 */
export function getMonthCalendarGrid(year, month) {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // JavaScript getDay(): Sunday = 0, Monday = 1, ..., Saturday = 6
  // Convert so Monday = 0, ..., Sunday = 6
  let firstDayIndex = firstDayOfMonth.getDay() - 1;
  if (firstDayIndex === -1) firstDayIndex = 6; // Sunday is 6

  const daysInMonth = lastDayOfMonth.getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const grid = [];
  const todayISO = getTodayISO();

  // 1. Previous month padding days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const date = new Date(year, month - 1, dayNum);
    const dateString = formatDateToISO(date);
    grid.push({
      date,
      dateString,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateString === todayISO,
      isPast: dateString < todayISO,
      weekday: (grid.length) % 7
    });
  }

  // 2. Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateString = formatDateToISO(date);
    grid.push({
      date,
      dateString,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateString === todayISO,
      isPast: dateString < todayISO,
      weekday: (grid.length) % 7
    });
  }

  // 3. Next month padding days to complete full grid (multiple of 7: 35 or 42)
  const remainingCells = 7 - (grid.length % 7);
  if (remainingCells < 7) {
    for (let d = 1; d <= remainingCells; d++) {
      const date = new Date(year, month + 1, d);
      const dateString = formatDateToISO(date);
      grid.push({
        date,
        dateString,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateString === todayISO,
        isPast: dateString < todayISO,
        weekday: (grid.length) % 7
      });
    }
  }

  // If grid is 35 cells, keep it; if 28 or less (rare), pad to 35
  while (grid.length < 35) {
    const d = grid.length - daysInMonth - firstDayIndex + 1;
    const date = new Date(year, month + 1, d);
    const dateString = formatDateToISO(date);
    grid.push({
      date,
      dateString,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: dateString === todayISO,
      isPast: dateString < todayISO,
      weekday: (grid.length) % 7
    });
  }

  return grid;
}
