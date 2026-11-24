import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import Modal from '../../../components/modals/Modal';
import Button from '../../../components/common/Button';
import TextInput from '../../../components/forms/TextInput';
import SelectInput from '../../../components/forms/SelectInput';
import { ROLES } from '../../../utils/permissions';
import { useAppData } from '../../../context/AppDataContext';
import { useAuth } from '../../../context/AuthContext';

export default function UserFormModal({
  isOpen,
  onClose,
  initialUser = null,
  onSave
}) {
  const { isEmailUnique } = useAppData();
  const { currentUser } = useAuth();
  const isEditing = Boolean(initialUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState(ROLES.TECHNICIAN);
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialUser) {
      setName(initialUser.name || '');
      setEmail(initialUser.email || '');
      setPhone(initialUser.phone || '');
      setDepartment(initialUser.department || '');
      setRole(initialUser.role || ROLES.TECHNICIAN);
      setActive(initialUser.active !== undefined ? initialUser.active : true);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setDepartment('Operations & Maintenance');
      setRole(ROLES.TECHNICIAN);
      setActive(true);
    }
    setErrors({});
  }, [initialUser, isOpen]);

  const validate = () => {
    const errs = {};
    if (!name.trim() || name.trim().length < 2) {
      errs.name = 'Full name is required (at least 2 characters).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email format (e.g., user@campus.edu).';
    } else if (!isEmailUnique(email.trim(), initialUser?.id)) {
      errs.email = 'This email address is already registered to another user.';
    }

    if (phone.trim()) {
      const phoneClean = phone.replace(/[\s()-]/g, '');
      if (phoneClean.length < 8) {
        errs.phone = 'Please enter a valid telephone / contact number.';
      }
    }

    if (!role) {
      errs.role = 'Role selection is mandatory.';
    }

    // Guard: Prevent deactivating the only active Admin
    if (isEditing && initialUser?.id === currentUser?.id && !active) {
      errs.active = 'You cannot deactivate your own active Administrator session.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      department: department.trim() || 'General Operations',
      role,
      active
    });
    onClose();
  };

  const roleOptions = [
    { value: ROLES.ADMIN, label: 'ADMIN — Full Institutional Administration' },
    { value: ROLES.MANAGER, label: 'MANAGER — Facility & Maintenance Supervisor' },
    { value: ROLES.TECHNICIAN, label: 'TECHNICIAN — Field Maintenance Specialist' },
    { value: ROLES.STAFF, label: 'STAFF — Faculty / Department Requester' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit User: ${initialUser?.name}` : 'Register New Campus User'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isEditing && (
          <div className="p-3 rounded-xl bg-bg-secondary border border-industrial-border text-xs font-mono text-text-muted flex items-center justify-between">
            <span>Unique User ID:</span>
            <span className="font-bold text-accent-primary">{initialUser?.id}</span>
          </div>
        )}

        {/* Full Name */}
        <div>
          <label className="block text-xs font-mono text-text-secondary uppercase mb-1">
            Full Name <span className="text-status-critical">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Dr. Ramesh Sharma"
            className={`w-full bg-bg-card border rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none transition-all ${
              errors.name ? 'border-status-critical focus:ring-1 focus:ring-status-critical' : 'border-industrial-border focus:border-accent-primary'
            }`}
          />
          {errors.name && (
            <p className="text-[11px] text-status-critical mt-1 flex items-center gap-1 font-mono">
              <AlertCircle className="w-3 h-3" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-mono text-text-secondary uppercase mb-1">
            Institutional Email <span className="text-status-critical">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., user@smartassetcare.demo"
            className={`w-full bg-bg-card border rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none transition-all ${
              errors.email ? 'border-status-critical focus:ring-1 focus:ring-status-critical' : 'border-industrial-border focus:border-accent-primary'
            }`}
          />
          {errors.email && (
            <p className="text-[11px] text-status-critical mt-1 flex items-center gap-1 font-mono">
              <AlertCircle className="w-3 h-3" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Contact Phone & Department Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-text-secondary uppercase mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., +91 98230 11223"
              className={`w-full bg-bg-card border rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none transition-all ${
                errors.phone ? 'border-status-critical' : 'border-industrial-border focus:border-accent-primary'
              }`}
            />
            {errors.phone && (
              <p className="text-[11px] text-status-critical mt-1 font-mono">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono text-text-secondary uppercase mb-1">
              Department / Wing
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g., Electrical Services"
              className="w-full bg-bg-card border border-industrial-border rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
            />
          </div>
        </div>

        {/* Assigned System Role */}
        <div>
          <label className="block text-xs font-mono text-text-secondary uppercase mb-1">
            System RBAC Role <span className="text-status-critical">*</span>
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-bg-card border border-industrial-border rounded-xl px-3.5 py-2.5 text-xs font-mono text-text-primary focus:outline-none focus:border-accent-primary"
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Account Status Switch */}
        <div className="p-3.5 rounded-2xl bg-bg-secondary border border-industrial-border flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-text-primary">Account Access Status</p>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Active accounts can log into the prototype portal.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-status-success"></div>
          </label>
        </div>
        {errors.active && (
          <p className="text-[11px] text-status-critical font-mono">{errors.active}</p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-industrial-border">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            {isEditing ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
