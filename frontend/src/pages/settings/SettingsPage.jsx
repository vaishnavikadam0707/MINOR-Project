import React, { useState } from 'react';
import { Settings, User, RotateCcw, Shield, Check, Lock } from 'lucide-react';
import Button from '../../components/common/Button';
import TextInput from '../../components/forms/TextInput';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { hasPermission } from '../../utils/permissions';

export default function SettingsPage() {
  const { currentUser, updateProfile, role } = useAuth();
  const { resetAllData } = useAppData();
  const { showToast } = useToast();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const canReset = hasPermission(role, 'CAN_RESET_DEMO_DATA');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({ name, phone });
    showToast({
      type: 'success',
      title: 'Profile Updated',
      message: 'Your personal display name has been saved to local state.'
    });
  };

  const handleConfirmReset = () => {
    if (!canReset) {
      showToast({
        type: 'error',
        title: 'Action Prohibited',
        message: 'Only Institutional Administrators are permitted to reset demo data to seeds.'
      });
      setResetModalOpen(false);
      return;
    }

    resetAllData();
    setResetModalOpen(false);
    showToast({
      type: 'info',
      title: 'Demo Data Restored',
      message: 'All assets, work orders, schedules, and costs have been reset to pristine seed data.'
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
          Application Settings
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          Manage your user profile, interface preferences, and prototype demonstration data.
        </p>
      </div>

      {/* My Profile */}
      <div className="p-6 rounded-3xl bg-bg-card border border-industrial-border space-y-4">
        <h2 className="text-base font-bold font-display text-text-primary flex items-center gap-2">
          <User className="w-4 h-4 text-accent-primary" />
          Personal Profile
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
          <TextInput
            label="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <TextInput
            label="Email Address (Demo Account)"
            value={currentUser?.email || ''}
            disabled
            helperText="Demo email is locked to active role."
          />

          <TextInput
            label="Contact Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Button type="submit" variant="primary" size="sm">
            Save Changes
          </Button>
        </form>
      </div>

      {/* Demo Data Management */}
      <div className="p-6 rounded-3xl bg-bg-card border border-status-critical/30 space-y-4">
        <h2 className="text-base font-bold font-display text-text-primary flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-status-critical" />
          Prototype Demo Data Management
        </h2>
        <p className="text-xs text-text-secondary leading-relaxed">
          Restore the initial demonstration dataset (assets, work orders, preventive schedules, costs, and notifications). Any local prototype modifications will be safely re-seeded.
        </p>

        {canReset ? (
          <Button
            variant="danger"
            size="sm"
            icon={RotateCcw}
            onClick={() => setResetModalOpen(true)}
          >
            Reset Demo Data to Factory Seeds
          </Button>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-text-muted">
            <Lock className="w-4 h-4 text-status-warning shrink-0" />
            <span>Restricted action: Only Institutional Administrators can reset the prototype demo database.</span>
          </div>
        )}
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset All Demo Data?"
        message="This action will restore all sample assets, tickets, technician logs and repair expenses to their original state in localStorage."
        confirmText="Reset to Seeds"
      />
    </div>
  );
}
