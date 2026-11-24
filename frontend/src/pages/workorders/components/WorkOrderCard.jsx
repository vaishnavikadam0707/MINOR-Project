import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDraggable } from '@dnd-kit/core';
import {
  Calendar,
  Clock,
  User,
  AlertTriangle,
  MoreVertical,
  ExternalLink,
  Wrench,
  CheckCircle,
  RotateCcw,
  ShieldCheck,
  Archive,
  ArrowRight
} from 'lucide-react';
import Badge from '../../../components/common/Badge';
import {
  WORK_ORDER_PRIORITIES,
  isWorkOrderOverdue,
  getAllowedNextTransitions
} from '../../../utils/workOrderRules';
import { useAppData } from '../../../context/AppDataContext';
import { useAuth } from '../../../context/AuthContext';

export default function WorkOrderCard({
  workOrder,
  isOverlay = false,
  onOpenModal = null,
  onDirectTransition = null
}) {
  const navigate = useNavigate();
  const { assets, users } = useAppData();
  const { currentUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Setup draggable hook if not in overlay mode
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: workOrder?.id || '',
    data: { workOrder },
    disabled: isOverlay || workOrder?.status === 'CLOSED'
  });

  if (!workOrder) return null;

  const asset = assets.find((a) => a.id === workOrder.assetId || a.assetId === workOrder.assetId);
  const tech = users.find((u) => u.id === workOrder.assignedTechnicianId);
  const isOverdue = isWorkOrderOverdue(workOrder);
  const priorityConfig = WORK_ORDER_PRIORITIES[workOrder.priority] || WORK_ORDER_PRIORITIES.MEDIUM;

  const allowedTransitions = getAllowedNextTransitions(workOrder, currentUser);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50
      }
    : undefined;

  const handleActionClick = (e, transition) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (transition.modal && onOpenModal) {
      onOpenModal(transition.modal, workOrder);
    } else if (onDirectTransition) {
      onDirectTransition(workOrder.id, transition.targetStatus);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative p-3.5 rounded-xl bg-bg-elevated border transition-all duration-200 select-none ${
        isDragging ? 'opacity-30 border-dashed border-accent-primary shadow-none' : ''
      } ${
        isOverlay
          ? 'border-accent-primary shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(57,255,136,0.3)] rotate-2 scale-105 cursor-grabbing z-50'
          : 'border-industrial-border hover:border-white/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] cursor-grab active:cursor-grabbing'
      } ${
        isOverdue && workOrder.status !== 'CLOSED' && workOrder.status !== 'VERIFIED'
          ? 'border-l-4 border-l-status-critical'
          : workOrder.priority === 'CRITICAL'
          ? 'border-l-4 border-l-status-critical'
          : workOrder.priority === 'HIGH'
          ? 'border-l-4 border-l-amber-500'
          : 'border-l-4 border-l-accent-primary/60'
      }`}
    >
      {/* Header: ID, Priority, Overdue indicator */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link
            to={`/app/work-orders/${workOrder.id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-mono text-[11px] font-bold text-accent-primary hover:underline flex items-center gap-1"
          >
            {workOrder.workOrderId}
          </Link>
          <span
            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${priorityConfig.color}`}
          >
            {priorityConfig.label}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isOverdue && (
            <span className="flex items-center gap-0.5 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-status-critical/20 text-status-critical border border-status-critical/30 animate-pulse">
              <AlertTriangle className="w-2.5 h-2.5" /> OVERDUE
            </span>
          )}

          {/* Quick status action menu */}
          {allowedTransitions.length > 0 && !isOverlay && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-white/[0.08] transition-colors"
                title="Status Actions"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                    }}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-bg-card border border-industrial-border shadow-2xl py-1.5 z-50 animate-scale-up text-left">
                    <div className="px-3 py-1 text-[10px] font-mono text-text-muted uppercase tracking-wider border-b border-industrial-border mb-1">
                      Available Actions
                    </div>
                    {allowedTransitions.map((t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => handleActionClick(e, t)}
                        className={`w-full px-3 py-1.5 text-xs text-left flex items-center justify-between hover:bg-white/[0.08] transition-colors ${
                          t.isRework ? 'text-status-critical hover:text-status-critical' : 'text-text-primary'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <ArrowRight className="w-3 h-3 text-accent-primary" />
                          {t.label}
                        </span>
                        <span className="text-[9px] font-mono text-text-muted">{t.targetStatus}</span>
                      </button>
                    ))}
                    <div className="border-t border-industrial-border mt-1 pt-1">
                      <Link
                        to={`/app/work-orders/${workOrder.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-text-secondary hover:text-accent-primary hover:bg-white/[0.08] flex items-center gap-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Full Details
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-xs font-semibold text-text-primary line-clamp-2 mb-2 leading-relaxed group-hover:text-accent-primary/90 transition-colors">
        {workOrder.title}
      </h4>

      {/* Target Asset Information */}
      <div className="p-2 rounded-lg bg-black/30 border border-white/[0.04] mb-3 text-[11px] flex items-center justify-between gap-2">
        <span className="text-text-secondary truncate font-medium">
          {asset ? asset.name : 'Unassigned Asset'}
        </span>
        <span className="text-[10px] font-mono text-text-muted shrink-0 bg-white/[0.05] px-1.5 py-0.5 rounded">
          {asset ? asset.assetId : '—'}
        </span>
      </div>

      {/* Footer: Technician, Due date */}
      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/[0.05]">
        {/* Assigned tech */}
        <div className="flex items-center gap-1.5">
          {tech ? (
            <div className="flex items-center gap-1.5" title={`Technician: ${tech.name}`}>
              <div className="w-5 h-5 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center font-bold text-[9px] font-mono border border-accent-primary/40">
                {tech.avatarInitials || tech.name.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-text-secondary truncate max-w-[90px] text-[10px]">
                {tech.name.split(' ')[0]}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-text-muted italic flex items-center gap-1">
              <User className="w-3 h-3 text-text-muted" /> Unassigned
            </span>
          )}
        </div>

        {/* Due date */}
        <div
          className={`flex items-center gap-1 font-mono text-[10px] ${
            isOverdue && workOrder.status !== 'CLOSED' && workOrder.status !== 'VERIFIED'
              ? 'text-status-critical font-bold'
              : 'text-text-muted'
          }`}
          title={`Target Due Date: ${workOrder.dueDate}`}
        >
          <Calendar className="w-3 h-3" />
          <span>{workOrder.dueDate}</span>
        </div>
      </div>
    </div>
  );
}
