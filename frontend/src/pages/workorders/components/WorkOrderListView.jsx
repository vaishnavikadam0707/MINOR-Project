import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  MoreVertical,
  User
} from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import {
  WORK_ORDER_STATUSES,
  WORK_ORDER_PRIORITIES,
  isWorkOrderOverdue,
  getAllowedNextTransitions
} from '../../../utils/workOrderRules';
import { useAppData } from '../../../context/AppDataContext';
import { useAuth } from '../../../context/AuthContext';

export default function WorkOrderListView({
  workOrders = [],
  onOpenModal = null
}) {
  const { assets, users, updateWorkOrderStatus } = useAppData();
  const { currentUser } = useAuth();

  const [sortField, setSortField] = useState('dueDate');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sorting
  const sortedOrders = useMemo(() => {
    const list = [...workOrders];
    list.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'priority') {
        const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        valA = order[a.priority] || 0;
        valB = order[b.priority] || 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [workOrders, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedOrders.slice(start, start + itemsPerPage);
  }, [sortedOrders, currentPage, itemsPerPage]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getAsset = (id) => assets.find((a) => a.id === id || a.assetId === id);
  const getTech = (id) => users.find((u) => u.id === id);

  return (
    <div className="bg-bg-card rounded-2xl border border-industrial-border overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-industrial-border bg-bg-surface/60 text-text-secondary font-mono uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort('workOrderId')}
                  className="flex items-center gap-1 hover:text-text-primary transition-colors"
                >
                  Work Order ID <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4 font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort('title')}
                  className="flex items-center gap-1 hover:text-text-primary transition-colors"
                >
                  Issue Title <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4 font-semibold">Target Asset</th>
              <th className="py-3 px-4 font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort('priority')}
                  className="flex items-center gap-1 hover:text-text-primary transition-colors"
                >
                  Priority <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4 font-semibold">Assigned Technician</th>
              <th className="py-3 px-4 font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort('dueDate')}
                  className="flex items-center gap-1 hover:text-text-primary transition-colors"
                >
                  Due Date <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4 font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort('status')}
                  className="flex items-center gap-1 hover:text-text-primary transition-colors"
                >
                  Status <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-industrial-border/60">
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((wo) => {
                const asset = getAsset(wo.assetId);
                const tech = getTech(wo.assignedTechnicianId);
                const isOverdue = isWorkOrderOverdue(wo);
                const priorityConfig = WORK_ORDER_PRIORITIES[wo.priority] || WORK_ORDER_PRIORITIES.MEDIUM;
                const statusConfig = WORK_ORDER_STATUSES[wo.status] || {
                  label: wo.status,
                  colorHex: '#39FF88',
                  bgLight: 'bg-accent-primary/10',
                  textColor: 'text-accent-primary',
                  borderColor: 'border-accent-primary/30'
                };
                const allowedTransitions = getAllowedNextTransitions(wo, currentUser);

                return (
                  <tr
                    key={wo.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-bold">
                      <Link
                        to={`/app/work-orders/${wo.id}`}
                        className="text-accent-primary hover:underline"
                      >
                        {wo.workOrderId}
                      </Link>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <Link
                        to={`/app/work-orders/${wo.id}`}
                        className="font-medium text-text-primary hover:text-accent-primary line-clamp-1 block transition-colors"
                      >
                        {wo.title}
                      </Link>
                      <span className="text-[10px] text-text-muted line-clamp-1 mt-0.5">
                        {wo.description}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-text-primary font-medium truncate max-w-[150px]">
                        {asset ? asset.name : 'Unknown Asset'}
                      </div>
                      <span className="font-mono text-[10px] text-text-muted">
                        {asset ? asset.assetId : '—'}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${priorityConfig.color}`}
                      >
                        {priorityConfig.label}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {tech ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center font-bold text-[9px] font-mono border border-accent-primary/40">
                            {tech.avatarInitials || tech.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-text-primary">{tech.name}</span>
                        </div>
                      ) : (
                        <span className="text-text-muted italic flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-text-muted" /> Unassigned
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono">
                      <div
                        className={`flex items-center gap-1.5 ${
                          isOverdue && wo.status !== 'CLOSED' && wo.status !== 'VERIFIED'
                            ? 'text-status-critical font-bold'
                            : 'text-text-secondary'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{wo.dueDate}</span>
                        {isOverdue && wo.status !== 'CLOSED' && wo.status !== 'VERIFIED' && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-status-critical/20 text-status-critical border border-status-critical/30 animate-pulse">
                            LATE
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-1 rounded-full border ${statusConfig.bgLight} ${statusConfig.textColor} ${statusConfig.borderColor}`}
                      >
                        {statusConfig.shortLabel || wo.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {allowedTransitions.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const t = allowedTransitions[0];
                              if (t.modal && onOpenModal) {
                                onOpenModal(t.modal, wo);
                              } else {
                                updateWorkOrderStatus(wo.id, t.targetStatus);
                              }
                            }}
                            className="px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-accent-primary/10 text-accent-primary border border-accent-primary/30 hover:bg-accent-primary/20 transition-colors"
                          >
                            {allowedTransitions[0].label}
                          </button>
                        )}
                        <Link
                          to={`/app/work-orders/${wo.id}`}
                          className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-colors inline-block"
                          title="View Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-text-muted">
                  No work orders found matching the active filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-industrial-border bg-bg-surface/30 text-xs">
          <span className="text-text-muted font-mono">
            Page {currentPage} of {totalPages} ({sortedOrders.length} total tickets)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-industrial-border bg-bg-elevated text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-industrial-border bg-bg-elevated text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
