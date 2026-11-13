import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  Eye,
  Edit3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Calendar,
  AlertTriangle,
  Clock
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import {
  formatDateDisplay,
  getEffectiveScheduleStatus
} from '../../utils/dateHelpers';
import { hasPermission } from '../../utils/permissions';
import { useAuth } from '../../context/AuthContext';

export default function ListView({
  schedules = [],
  assets = [],
  users = [],
  onSelectSchedule,
  onEditSchedule,
  onCompleteSchedule
}) {
  const { role } = useAuth();

  // Sorting state
  const [sortField, setSortField] = useState('dueDate');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const canEdit = hasPermission(role, 'CAN_EDIT_SCHEDULE');
  const canComplete = hasPermission(role, 'CAN_COMPLETE_SCHEDULE');

  // Quick lookups
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

  // Priority weight map for sorting
  const priorityWeight = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1
  };

  // Sorting
  const sortedSchedules = useMemo(() => {
    const list = [...schedules];
    list.sort((a, b) => {
      if (sortField === 'priority') {
        const pA = priorityWeight[a.priority] || 0;
        const pB = priorityWeight[b.priority] || 0;
        return sortDirection === 'asc' ? pA - pB : pB - pA;
      }

      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [schedules, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedSchedules.length / pageSize) || 1;
  const paginatedSchedules = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedSchedules.slice(start, start + pageSize);
  }, [sortedSchedules, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="rounded-3xl border border-industrial-border overflow-hidden bg-bg-card shadow-card-dark">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-bg-secondary text-text-muted border-b border-industrial-border uppercase tracking-wider text-[11px]">
            <tr>
              <th
                className="p-4 cursor-pointer hover:text-text-primary transition-colors"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Schedule ID</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>

              <th className="p-4">Target Asset</th>

              <th
                className="p-4 cursor-pointer hover:text-text-primary transition-colors"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Maintenance Title</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>

              <th className="p-4">Type</th>

              <th
                className="p-4 cursor-pointer hover:text-text-primary transition-colors"
                onClick={() => handleSort('dueDate')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Due Date</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-accent-primary" />
                </div>
              </th>

              <th className="p-4">Assigned Tech</th>

              <th
                className="p-4 cursor-pointer hover:text-text-primary transition-colors"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Priority</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>

              <th className="p-4">Status</th>

              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-industrial-border">
            {paginatedSchedules.map((item) => {
              const asset = assetMap[item.assetId];
              const technician = userMap[item.assignedTechnicianId];
              const effectiveStatus = getEffectiveScheduleStatus(item);

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectSchedule(item)}
                  className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  <td className="p-4 font-bold text-accent-primary whitespace-nowrap">
                    {item.id.toUpperCase()}
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <div>
                      <span className="font-bold text-text-primary block font-sans">
                        {asset?.name || item.assetId}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {asset?.assetId || item.assetId} • {asset?.location}
                      </span>
                    </div>
                  </td>

                  <td className="p-4 font-semibold text-text-primary max-w-xs truncate">
                    <span className="group-hover:text-accent-primary transition-colors">
                      {item.title}
                    </span>
                    {item.recurrence && item.recurrence !== 'One Time' && (
                      <span className="text-[10px] text-text-muted block">
                        ↻ {item.recurrence}
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-text-secondary whitespace-nowrap">
                    {item.maintenanceType}
                  </td>

                  <td className="p-4 font-bold text-text-primary whitespace-nowrap">
                    {formatDateDisplay(item.dueDate)}
                  </td>

                  <td className="p-4 text-text-secondary whitespace-nowrap">
                    {technician ? technician.name : <span className="text-text-muted italic">Unassigned</span>}
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <Badge status={(item.priority || 'Medium').toUpperCase()} size="xs" />
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <Badge status={effectiveStatus} size="xs" />
                  </td>

                  <td
                    className="p-4 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectSchedule(item)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-accent-primary hover:bg-white/[0.04] transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {canComplete && effectiveStatus !== 'COMPLETED' && effectiveStatus !== 'CANCELLED' && (
                        <button
                          onClick={() => onCompleteSchedule(item)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-status-success hover:bg-status-success/10 transition-colors"
                          title="Complete service"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}

                      {canEdit && effectiveStatus !== 'COMPLETED' && effectiveStatus !== 'CANCELLED' && (
                        <button
                          onClick={() => onEditSchedule(item)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                          title="Edit schedule"
                        >
                          <Edit3 className="w-4 h-4" />
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

      {/* Pagination Footer */}
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
            Page {currentPage} of {totalPages} ({sortedSchedules.length} total items)
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
  );
}
