import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Wrench,
  Calendar,
  Clock,
  User,
  Shield,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Archive,
  ExternalLink,
  MessageSquare,
  FileText,
  Activity,
  DollarSign,
  Layers,
  Send,
  Building,
  MapPin,
  Cpu,
  HelpCircle
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/cards/Card';

import AssignTechnicianModal from './components/AssignTechnicianModal';
import CompleteWorkOrderModal from './components/CompleteWorkOrderModal';
import ReworkModal from './components/ReworkModal';
import VerifyWorkOrderModal from './components/VerifyWorkOrderModal';
import CloseWorkOrderModal from './components/CloseWorkOrderModal';
import ServiceDetailModal from '../history/components/ServiceDetailModal';
import InvoiceModal from '../costs/components/InvoiceModal';

import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES, hasPermission } from '../../utils/permissions';
import {
  WORK_ORDER_STATUSES,
  WORK_ORDER_PRIORITIES,
  isWorkOrderOverdue,
  getAllowedNextTransitions
} from '../../utils/workOrderRules';
import { formatRupee, formatDate } from '../../utils/formatters';

export default function WorkOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    workOrders,
    assets,
    users,
    schedules,
    serviceHistory,
    repairCosts,
    updateWorkOrderStatus,
    addProgressNote
  } = useAppData();
  const { currentUser, role } = useAuth();
  const { showToast } = useToast();

  const [newNoteText, setNewNoteText] = useState('');
  const [modalState, setModalState] = useState({ type: null });
  const [selectedServiceRecord, setSelectedServiceRecord] = useState(null);
  const [selectedInvoiceCost, setSelectedInvoiceCost] = useState(null);

  // Resolve stable work order record
  const workOrder = workOrders.find((w) => w.id === id || w.workOrderId === id);

  if (!workOrder) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-industrial-border flex items-center justify-center text-text-muted">
          <HelpCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary font-display">Work Order Not Found</h2>
          <p className="text-xs text-text-secondary mt-1 max-w-md">
            The requested ticket identifier <code className="text-accent-primary font-mono">{id}</code> does not match any active or archived work order records.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/app/work-orders')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Work Orders
        </Button>
      </div>
    );
  }

  // Resolve target asset and related entities
  const asset = assets.find((a) => a.id === workOrder.assetId || a.assetId === workOrder.assetId);
  const creator = users.find((u) => u.id === workOrder.createdByUserId);
  const tech = users.find((u) => u.id === workOrder.assignedTechnicianId);
  const linkedSchedule = schedules.find(
    (s) => s.id === workOrder.linkedScheduleId || s.id === workOrder.maintenanceScheduleId
  );

  const relatedHistory = asset
    ? serviceHistory.filter((sh) => sh.assetId === asset.id || sh.assetId === asset.assetId)
    : [];
  const relatedCosts = asset
    ? repairCosts.filter((rc) => rc.assetId === asset.id || rc.assetId === asset.assetId)
    : [];

  // Direct certified service record and financial invoice generated for this work order
  const linkedDirectService = serviceHistory.find(
    (sh) => sh.workOrderId === workOrder.workOrderId || sh.workOrderId === workOrder.id
  );
  const linkedDirectCost = repairCosts.find(
    (rc) => rc.workOrderId === workOrder.workOrderId || rc.workOrderId === workOrder.id
  );

  const isOverdue = isWorkOrderOverdue(workOrder);
  const statusConfig = WORK_ORDER_STATUSES[workOrder.status] || {
    label: workOrder.status,
    textColor: 'text-accent-primary',
    bgLight: 'bg-accent-primary/10',
    borderColor: 'border-accent-primary/30',
    colorHex: '#39FF88'
  };
  const priorityConfig = WORK_ORDER_PRIORITIES[workOrder.priority] || WORK_ORDER_PRIORITIES.MEDIUM;

  const allowedTransitions = getAllowedNextTransitions(workOrder, currentUser);
  const isAssignedTech = role === ROLES.TECHNICIAN && workOrder.assignedTechnicianId === currentUser?.id;
  const isManagerOrAdmin = role === ROLES.ADMIN || role === ROLES.MANAGER;
  const canAddNote = (isAssignedTech || isManagerOrAdmin) && workOrder.status !== 'CLOSED';

  // Handle Progress Note submission
  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    addProgressNote(workOrder.id, newNoteText.trim());
    setNewNoteText('');
    showToast('Progress note logged to work order activity history.', 'success');
  };

  const handleActionClick = (transition) => {
    if (transition.modal) {
      setModalState({ type: transition.modal });
    } else {
      updateWorkOrderStatus(workOrder.id, transition.targetStatus);
      showToast(`Work order advanced to ${transition.targetStatus}.`, 'success');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Navigation & Back Link */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/app/work-orders"
          className="inline-flex items-center gap-2 text-xs font-mono text-text-secondary hover:text-accent-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Work Orders
        </Link>

        {/* Historical Record Alert if CLOSED */}
        {workOrder.status === 'CLOSED' && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-text-muted text-xs font-mono">
            <Archive className="w-3.5 h-3.5" /> Immutable Historical Record
          </span>
        )}
      </div>

      {/* Main Header Card */}
      <div className="p-6 rounded-2xl bg-bg-card border border-industrial-border shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-accent-primary/10 text-accent-primary border border-accent-primary/30">
                {workOrder.workOrderId}
              </span>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${priorityConfig.color}`}
              >
                {priorityConfig.label} Priority
              </span>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${statusConfig.bgLight} ${statusConfig.textColor} ${statusConfig.borderColor}`}
              >
                {statusConfig.label}
              </span>
              {isOverdue && (
                <span className="flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-status-critical/20 text-status-critical border border-status-critical/30 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" /> OVERDUE
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary font-display tracking-tight">
              {workOrder.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-text-muted font-mono flex-wrap">
              <span>Created: {workOrder.createdAt}</span>
              <span>•</span>
              <span className={isOverdue ? 'text-status-critical font-bold' : ''}>
                Target Due: {workOrder.dueDate}
              </span>
              {asset && (
                <>
                  <span>•</span>
                  <span>Asset: {asset.name}</span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {allowedTransitions.map((t, idx) => (
              <Button
                key={idx}
                variant={t.variant || 'primary'}
                size="sm"
                onClick={() => handleActionClick(t)}
              >
                {t.label}
              </Button>
            ))}

            {isManagerOrAdmin && workOrder.status !== 'CLOSED' && workOrder.status !== 'VERIFIED' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setModalState({ type: 'assign' })}
              >
                {workOrder.assignedTechnicianId ? 'Reassign Tech' : 'Assign Tech'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Overview, Resolution, Notes, Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section A: Issue Overview */}
          <div className="p-6 rounded-2xl bg-bg-card border border-industrial-border space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-accent-primary font-bold flex items-center gap-2">
              <FileText className="w-4 h-4" /> Section A: Fault Description & Scope
            </h3>

            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap bg-bg-surface/50 p-4 rounded-xl border border-industrial-border">
              {workOrder.description || 'No detailed description provided.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-bg-elevated border border-industrial-border">
                <span className="text-[10px] font-mono text-text-muted uppercase block">Created Date</span>
                <span className="text-xs font-mono font-bold text-text-primary mt-0.5 block">{workOrder.createdAt}</span>
              </div>
              <div className="p-3 rounded-xl bg-bg-elevated border border-industrial-border">
                <span className="text-[10px] font-mono text-text-muted uppercase block">Due Date</span>
                <span className={`text-xs font-mono font-bold mt-0.5 block ${isOverdue ? 'text-status-critical' : 'text-text-primary'}`}>
                  {workOrder.dueDate}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-bg-elevated border border-industrial-border">
                <span className="text-[10px] font-mono text-text-muted uppercase block">Priority</span>
                <span className="text-xs font-mono font-bold text-text-primary mt-0.5 block">{workOrder.priority}</span>
              </div>
              <div className="p-3 rounded-xl bg-bg-elevated border border-industrial-border">
                <span className="text-[10px] font-mono text-text-muted uppercase block">Current Stage</span>
                <span className="text-xs font-mono font-bold text-text-primary mt-0.5 block">{workOrder.status}</span>
              </div>
            </div>
          </div>

          {/* Section F: Resolution Summary (if completed) */}
          {workOrder.resolutionDescription && (
            <div className="p-6 rounded-2xl bg-bg-card border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Section F: Technician Resolution Report
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  Documented
                </span>
              </div>
              <p className="text-sm text-text-primary bg-emerald-500/[0.05] p-4 rounded-xl border border-emerald-500/20 leading-relaxed whitespace-pre-wrap">
                {workOrder.resolutionDescription}
              </p>
            </div>
          )}

          {/* Section G & H: Verification & Archival Meta */}
          {(workOrder.verifiedAt || workOrder.closedAt || workOrder.reworkReason) && (
            <div className="p-6 rounded-2xl bg-bg-card border border-industrial-border space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Management Audits & Sign-offs
              </h3>

              <div className="space-y-2 text-xs">
                {workOrder.verifiedAt && (
                  <div className="p-3 rounded-xl bg-purple-500/[0.05] border border-purple-500/20 flex items-start justify-between gap-3">
                    <div>
                      <strong className="text-purple-300">Management Verification:</strong>
                      <p className="text-text-secondary mt-0.5">{workOrder.verificationNote || 'Signed off with full compliance.'}</p>
                    </div>
                    <span className="font-mono text-[10px] text-text-muted shrink-0">{workOrder.verifiedAt}</span>
                  </div>
                )}

                {workOrder.closedAt && (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start justify-between gap-3">
                    <div>
                      <strong className="text-text-primary">Archival Closure:</strong>
                      <p className="text-text-secondary mt-0.5">{workOrder.closureNote || 'Closed and archived into equipment lifecycle history.'}</p>
                    </div>
                    <span className="font-mono text-[10px] text-text-muted shrink-0">{workOrder.closedAt}</span>
                  </div>
                )}

                {workOrder.reworkReason && workOrder.status === 'IN_PROGRESS' && (
                  <div className="p-3 rounded-xl bg-status-critical/[0.08] border border-status-critical/30 flex items-start gap-3">
                    <RotateCcw className="w-4 h-4 text-status-critical shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-status-critical">Active Rework Directive:</strong>
                      <p className="text-text-secondary mt-0.5">{workOrder.reworkReason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section E: Progress Notes */}
          <div className="p-6 rounded-2xl bg-bg-card border border-industrial-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-text-primary font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-accent-primary" /> Section E: Technician Progress Notes
              </h3>
              <span className="text-[11px] font-mono text-text-muted">
                {(workOrder.progressNotes || []).length} logged
              </span>
            </div>

            {/* Notes List */}
            <div className="space-y-3">
              {(workOrder.progressNotes && workOrder.progressNotes.length > 0) ? (
                workOrder.progressNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-xl bg-bg-elevated border border-industrial-border space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-accent-primary flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {note.createdByName || 'Technician'}
                      </span>
                      <span className="font-mono text-[10px] text-text-muted">
                        {note.createdAt ? note.createdAt.replace('T', ' ').substring(0, 16) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{note.text}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-white/[0.06] text-center text-xs text-text-muted">
                  No progress notes logged yet.
                </div>
              )}
            </div>

            {/* Add Note Form */}
            {canAddNote && (
              <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-industrial-border/60">
                <div className="relative">
                  <textarea
                    rows={2}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Log a field update (e.g. testing condenser pressure, awaiting replacement capacitor)..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border border-industrial-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary transition-colors"
                  />
                </div>
                <div className="flex justify-end">
                  <Button variant="primary" size="sm" type="submit" disabled={!newNoteText.trim()}>
                    <Send className="w-3.5 h-3.5 mr-1.5" /> Add Progress Note
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Section D: Activity Timeline */}
          <div className="p-6 rounded-2xl bg-bg-card border border-industrial-border space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-primary font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent-primary" /> Section D: Activity Timeline Audit Log
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/[0.08]">
              {(workOrder.activityHistory || []).map((entry, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline bullet */}
                  <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-accent-primary ring-4 ring-bg-card" />

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-text-primary">{entry.action}</span>
                      <span className="font-mono text-[10px] text-text-muted">
                        {entry.timestamp}
                      </span>
                    </div>

                    {entry.note && (
                      <p className="text-xs text-text-secondary bg-white/[0.02] p-2 rounded-lg border border-white/[0.04] mt-1">
                        {entry.note}
                      </p>
                    )}

                    {entry.actorName && (
                      <span className="text-[10px] font-mono text-text-muted block">
                        Actor: {entry.actorName}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Asset Info, Creator, Technician, Related */}
        <div className="space-y-6">
          {/* Section B: Asset Information */}
          <div className="p-6 rounded-2xl bg-bg-card border border-industrial-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-text-primary font-bold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-accent-primary" /> Section B: Target Asset
              </h3>
              {asset && (
                <Link
                  to={`/app/assets/${asset.id}`}
                  className="text-[11px] font-mono text-accent-primary hover:underline flex items-center gap-1"
                >
                  View Details <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            {asset ? (
              <div className="space-y-3 text-xs">
                {asset.image && (
                  <div className="h-32 rounded-xl overflow-hidden border border-industrial-border">
                    <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-sm font-bold text-text-primary block">{asset.name}</span>
                  <span className="font-mono text-text-muted text-[11px]">{asset.assetId}</span>
                </div>

                <div className="space-y-2 pt-2 border-t border-industrial-border">
                  <div className="flex items-center justify-between text-text-secondary">
                    <span className="text-text-muted">Category:</span>
                    <span className="font-medium text-text-primary">{asset.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-text-secondary">
                    <span className="text-text-muted">Location:</span>
                    <span className="font-medium text-text-primary text-right truncate max-w-[170px]">{asset.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-text-secondary">
                    <span className="text-text-muted">Department:</span>
                    <span className="font-medium text-text-primary">{asset.department}</span>
                  </div>
                  <div className="flex items-center justify-between text-text-secondary">
                    <span className="text-text-muted">Operational Status:</span>
                    <Badge status={asset.status} size="xs" />
                  </div>
                  {asset.healthScore !== undefined && (
                    <div className="flex items-center justify-between text-text-secondary">
                      <span className="text-text-muted">Health Score:</span>
                      <span className="font-mono font-bold text-accent-primary">{asset.healthScore}%</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">Asset details not available.</p>
            )}
          </div>

          {/* Section C: Request & Assignment Information */}
          <div className="p-6 rounded-2xl bg-bg-card border border-industrial-border space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-primary font-bold flex items-center gap-2">
              <User className="w-4 h-4 text-accent-primary" /> Section C: Personnel Involved
            </h3>

            {/* Creator */}
            <div className="p-3 rounded-xl bg-bg-elevated border border-industrial-border space-y-1">
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Reported By</span>
              <div className="text-xs font-bold text-text-primary">{creator?.name || 'Institutional Staff'}</div>
              <div className="text-[11px] text-text-secondary">{creator?.department || 'Campus Department'}</div>
              <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-text-muted mt-1">
                Role: {creator?.role || 'STAFF'}
              </span>
            </div>

            {/* Assigned Tech */}
            <div className="p-3 rounded-xl bg-bg-elevated border border-industrial-border space-y-1">
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Assigned Specialist</span>
              {tech ? (
                <>
                  <div className="text-xs font-bold text-accent-primary">{tech.name}</div>
                  <div className="text-[11px] text-text-secondary">{tech.department}</div>
                  <span className="text-[10px] font-mono text-text-muted block mt-1">{tech.email}</span>
                </>
              ) : (
                <div className="text-xs text-text-muted italic py-1">
                  Currently Unassigned. Facility Manager assignment pending.
                </div>
              )}
            </div>
          </div>

          {/* Section I: Related Records */}
          <div className="p-6 rounded-2xl bg-bg-card border border-industrial-border space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-primary font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-primary" /> Section I: Related Records
            </h3>

            {/* Linked Maintenance Schedule */}
            {linkedSchedule ? (
              <div className="p-3 rounded-xl bg-accent-primary/[0.05] border border-accent-primary/20 space-y-1 text-xs">
                <span className="text-[10px] font-mono text-accent-primary font-bold uppercase block">
                  Linked Preventive Schedule
                </span>
                <span className="font-bold text-text-primary block">{linkedSchedule.title}</span>
                <span className="text-text-muted font-mono text-[10px]">
                  Due: {linkedSchedule.dueDate} • Recurrence: {linkedSchedule.recurrence || 'None'}
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-text-muted italic">
                No preventive schedule linked to this ad-hoc work order.
              </div>
            )}

            {/* Asset Service History Preview */}
            <div className="space-y-2 pt-2 border-t border-industrial-border">
              <span className="text-[11px] font-mono uppercase text-text-muted block">
                Historical Asset Services ({relatedHistory.length})
              </span>
              {relatedHistory.slice(0, 2).map((sh) => (
                <div key={sh.id} className="p-2 rounded-lg bg-bg-elevated border border-white/[0.04] text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary">{sh.serviceType}</span>
                    <span className="font-mono text-text-muted">{sh.serviceDate}</span>
                  </div>
                  <p className="text-text-muted line-clamp-1 mt-0.5">{sh.notes}</p>
                </div>
              ))}
            </div>

            {/* Asset Repair Cost Preview */}
            <div className="space-y-2 pt-2 border-t border-industrial-border">
              <span className="text-[11px] font-mono uppercase text-text-muted block">
                Recent Repair Invoices ({relatedCosts.length})
              </span>
              {relatedCosts.slice(0, 2).map((rc) => (
                <div key={rc.id} className="p-2 rounded-lg bg-bg-elevated border border-white/[0.04] text-[11px] flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-text-primary block">{rc.description || 'Service Parts'}</span>
                    <span className="font-mono text-text-muted text-[10px]">Inv #{rc.invoiceNumber}</span>
                  </div>
                  <span className="font-mono font-bold text-accent-primary">
                    {formatRupee(rc.totalCost)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AssignTechnicianModal
        isOpen={modalState.type === 'assign'}
        onClose={() => setModalState({ type: null })}
        workOrder={workOrder}
      />

      <CompleteWorkOrderModal
        isOpen={modalState.type === 'complete'}
        onClose={() => setModalState({ type: null })}
        workOrder={workOrder}
      />

      <ReworkModal
        isOpen={modalState.type === 'rework'}
        onClose={() => setModalState({ type: null })}
        workOrder={workOrder}
      />

      <VerifyWorkOrderModal
        isOpen={modalState.type === 'verify'}
        onClose={() => setModalState({ type: null })}
        workOrder={workOrder}
      />

      <CloseWorkOrderModal
        isOpen={modalState.type === 'close'}
        onClose={() => setModalState({ type: null })}
        workOrder={workOrder}
      />
    </div>
  );
}
