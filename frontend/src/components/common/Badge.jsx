import React from 'react';

const statusMap = {
  // Asset statuses
  OPERATIONAL: { label: 'Operational', color: 'text-status-success bg-status-success/10 border-status-success/30' },
  UNDER_MAINTENANCE: { label: 'Under Maintenance', color: 'text-status-warning bg-status-warning/10 border-status-warning/30' },
  OUT_OF_SERVICE: { label: 'Out of Service', color: 'text-status-critical bg-status-critical/10 border-status-critical/30' },
  RETIRED: { label: 'Retired', color: 'text-status-neutral bg-status-neutral/10 border-status-neutral/30' },

  // Work order statuses
  CREATED: { label: 'Created', color: 'text-status-info bg-status-info/10 border-status-info/30' },
  ASSIGNED: { label: 'Assigned', color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-status-warning bg-status-warning/10 border-status-warning/30' },
  COMPLETED: { label: 'Completed', color: 'text-accent-secondary bg-accent-secondary/10 border-accent-secondary/30' },
  VERIFIED: { label: 'Verified', color: 'text-status-success bg-status-success/10 border-status-success/30' },
  CLOSED: { label: 'Closed', color: 'text-status-neutral bg-status-neutral/10 border-status-neutral/30' },

  // Schedule statuses
  UPCOMING: { label: 'Upcoming', color: 'text-status-info bg-status-info/10 border-status-info/30' },
  DUE: { label: 'Due Today', color: 'text-status-warning bg-status-warning/10 border-status-warning/30' },
  OVERDUE: { label: 'Overdue', color: 'text-status-critical bg-status-critical/10 border-status-critical/30' },
  CANCELLED: { label: 'Cancelled', color: 'text-status-neutral bg-status-neutral/10 border-status-neutral/30' },

  // Priority levels
  LOW: { label: 'Low Priority', color: 'text-status-neutral bg-status-neutral/10 border-status-neutral/30' },
  MEDIUM: { label: 'Medium', color: 'text-status-info bg-status-info/10 border-status-info/30' },
  HIGH: { label: 'High Priority', color: 'text-status-warning bg-status-warning/10 border-status-warning/30' },
  CRITICAL: { label: 'Critical', color: 'text-status-critical bg-status-critical/10 border-status-critical/30' },

  // Generic
  active: { label: 'Active', color: 'text-status-success bg-status-success/10 border-status-success/30' },
  inactive: { label: 'Inactive', color: 'text-status-neutral bg-status-neutral/10 border-status-neutral/30' },
};

export default function Badge({
  status,
  variant,
  children,
  size = 'sm',
  showDot = true,
  className = ''
}) {
  const mapped = statusMap[status] || {
    label: children || status,
    color: 'text-text-secondary bg-white/[0.04] border-white/10'
  };

  const displayText = children || mapped.label;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs',
  }[size] || 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${mapped.color} ${sizeClasses} ${className}`}
    >
      {showDot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-pulse-subtle" />
      )}
      <span>{displayText}</span>
    </span>
  );
}
