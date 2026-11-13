import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Wrench,
  Clock,
  CheckCircle2,
  PlusCircle,
  AlertCircle,
  Search,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import MetricCard from '../../components/cards/MetricCard';
import Card from '../../components/cards/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/modals/Modal';
import TextInput from '../../components/forms/TextInput';
import SelectInput from '../../components/forms/SelectInput';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { assets, workOrders, createWorkOrder, metrics } = useAppData();
  const { showToast } = useToast();

  // Requests submitted by this staff member
  const myRequests = workOrders.filter(
    (w) => w.createdByUserId === currentUser?.id
  );

  const pendingRequests = myRequests.filter(
    (w) => w.status === 'CREATED' || w.status === 'ASSIGNED' || w.status === 'IN_PROGRESS'
  );

  const completedRequests = myRequests.filter(
    (w) => w.status === 'COMPLETED' || w.status === 'VERIFIED' || w.status === 'CLOSED'
  );

  // Quick report issue modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [formError, setFormError] = useState('');

  const handleCreateRequest = (e) => {
    e.preventDefault();
    if (!selectedAssetId || !issueTitle.trim() || !issueDescription.trim()) {
      setFormError('Please select an asset and describe the issue.');
      return;
    }

    const newWo = createWorkOrder({
      assetId: selectedAssetId,
      title: issueTitle,
      description: issueDescription,
      priority,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdByUserId: currentUser?.id,
      assignedTechnicianId: null
    });

    showToast({
      type: 'success',
      title: 'Ticket Submitted',
      message: `Request ${newWo.workOrderId} created and forwarded to campus facility managers.`
    });

    setModalOpen(false);
    setSelectedAssetId('');
    setIssueTitle('');
    setIssueDescription('');
    setFormError('');
  };

  const assetOptions = assets.map((a) => ({
    value: a.id,
    label: `${a.assetId} - ${a.name} (${a.location})`
  }));

  return (
    <div className="space-y-6">
      {/* Top Header with Prominent Report Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
            Faculty & Staff Service Portal
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Welcome, {currentUser?.name}. Report classroom & laboratory equipment issues quickly.
          </p>
        </div>

        <Button
          variant="cyber"
          size="md"
          icon={PlusCircle}
          onClick={() => setModalOpen(true)}
          className="shadow-glow-md"
        >
          Report Equipment Fault
        </Button>
      </div>

      {/* 4 KPI CARDS (PART 10.4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Campus Assets"
          value={metrics.totalAssets}
          subvalue={`${metrics.operationalAssets} Available`}
          icon={Layers}
          status="neutral"
          onClick={() => navigate('/app/assets')}
        />

        <MetricCard
          title="My Reports"
          value={myRequests.length}
          subvalue="Total Submitted"
          icon={Wrench}
          status="info"
        />

        <MetricCard
          title="Under Repair"
          value={pendingRequests.length}
          subvalue="Pending Resolution"
          icon={Clock}
          status="warning"
        />

        <MetricCard
          title="Resolved"
          value={completedRequests.length}
          subvalue="Tickets Closed"
          icon={CheckCircle2}
          status="success"
        />
      </div>

      {/* MY RECENT REQUESTS & STATUS TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Requests List */}
        <Card
          title="My Reported Maintenance Tickets"
          subtitle="Track repair progress in real-time"
          action={
            <Button
              variant="outline"
              size="xs"
              onClick={() => setModalOpen(true)}
              icon={PlusCircle}
            >
              New Ticket
            </Button>
          }
        >
          <div className="divide-y divide-industrial-border">
            {myRequests.length > 0 ? (
              myRequests.map((req) => (
                <div key={req.id} className="py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-text-primary">
                        {req.workOrderId}
                      </span>
                      <Badge status={req.priority} size="xs" />
                    </div>
                    <Badge status={req.status} size="xs" />
                  </div>

                  <p className="text-xs font-medium text-text-primary">
                    {req.title}
                  </p>
                  <p className="text-xs text-text-muted">
                    {req.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-text-muted">
                    <span>Submitted: {req.createdAt}</span>
                    <span>Target Due: {req.dueDate}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-text-muted">
                You haven't reported any equipment problems yet.
              </div>
            )}
          </div>
        </Card>

        {/* Recently Cataloged Campus Assets */}
        <Card
          title="Department Hardware Directory"
          subtitle="Quick inspection of campus laboratory equipment"
          action={
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate('/app/assets')}
            >
              Search All
            </Button>
          }
        >
          <div className="divide-y divide-industrial-border">
            {assets.slice(0, 4).map((ast) => (
              <div key={ast.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-text-primary">
                      {ast.assetId}
                    </span>
                    <Badge status={ast.status} size="xs" />
                  </div>
                  <p className="text-xs text-text-secondary truncate mt-0.5">
                    {ast.name}
                  </p>
                  <span className="text-[10px] font-mono text-text-muted">
                    {ast.location}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-semibold text-accent-primary">
                    {ast.healthScore}% Health
                  </span>
                  <span className="text-[10px] font-mono text-text-muted block mt-0.5">
                    {ast.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* REPORT ISSUE MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Report Campus Equipment Problem"
        subtitle="Submit a maintenance ticket directly to facility technicians"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-status-critical/15 border border-status-critical/30 text-status-critical text-xs">
              {formError}
            </div>
          )}

          <SelectInput
            label="Select Affected Asset"
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            options={assetOptions}
            placeholder="Choose asset from campus inventory..."
            required
          />

          <TextInput
            label="Problem Summary / Issue Title"
            value={issueTitle}
            onChange={(e) => setIssueTitle(e.target.value)}
            placeholder="e.g. AC leaking water in Computer Lab 1"
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
              Detailed Description <span className="text-status-critical">*</span>
            </label>
            <textarea
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              rows={3}
              placeholder="Describe symptoms, noise, error codes on display..."
              className="w-full bg-bg-elevated text-text-primary text-sm rounded-xl border border-industrial-border p-3 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30"
              required
            />
          </div>

          <SelectInput
            label="Perceived Urgency / Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={[
              { value: 'LOW', label: 'Low - Can wait for weekly maintenance' },
              { value: 'MEDIUM', label: 'Medium - Normal priority' },
              { value: 'HIGH', label: 'High - Affecting ongoing classes/lab' },
              { value: 'CRITICAL', label: 'Critical - Safety hazard or power outage' }
            ]}
          />

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
            >
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
