import React, { useState, useEffect } from 'react';
import Modal from '../../components/modals/Modal';
import TextInput from '../../components/forms/TextInput';
import SelectInput from '../../components/forms/SelectInput';
import Button from '../../components/common/Button';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasPermission } from '../../utils/permissions';
import { Image, Sparkles, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  'Air Conditioner',
  'Computer',
  'Laptop',
  'Projector',
  'Printer',
  'Laboratory Equipment',
  'Networking Device',
  'Electrical Equipment',
  'Fans',
  'Furniture',
  'Other'
];

const STATUS_OPTIONS = [
  { value: 'OPERATIONAL', label: 'Operational' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
  { value: 'RETIRED', label: 'Retired' }
];

const SAMPLE_PRESET_IMAGES = [
  { label: 'Air Conditioner', url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=600&q=80' },
  { label: 'Workstation Computer', url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=600&q=80' },
  { label: 'Enterprise Printer', url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80' },
  { label: 'Laser Projector', url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Network Switch / Rack', url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80' },
  { label: 'Laboratory Equipment', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80' },
  { label: 'Centrifuge Biotech', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80' },
  { label: 'Industrial Fan', url: 'https://images.unsplash.com/photo-1618941716939-553df3c6c278?auto=format&fit=crop&w=600&q=80' }
];

export default function AssetFormModal({
  isOpen,
  onClose,
  assetToEdit = null,
  onSaved = null
}) {
  const { addAsset, updateAsset, isAssetIdUnique } = useAppData();
  const { role } = useAuth();
  const { showToast } = useToast();

  const isEditing = Boolean(assetToEdit);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    assetId: '',
    category: 'Computer',
    description: '',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: '',
    warrantyExpiry: '',
    location: '',
    department: 'Computer Science',
    status: 'OPERATIONAL',
    healthScore: 95,
    image: SAMPLE_PRESET_IMAGES[1].url
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or prefill form
  useEffect(() => {
    if (assetToEdit) {
      setFormData({
        name: assetToEdit.name || '',
        assetId: assetToEdit.assetId || '',
        category: assetToEdit.category || 'Computer',
        description: assetToEdit.description || '',
        brand: assetToEdit.brand || '',
        model: assetToEdit.model || '',
        serialNumber: assetToEdit.serialNumber || '',
        purchaseDate: assetToEdit.purchaseDate || '',
        purchaseCost: assetToEdit.purchaseCost !== undefined ? String(assetToEdit.purchaseCost) : '',
        warrantyExpiry: assetToEdit.warrantyExpiry || '',
        location: assetToEdit.location || '',
        department: assetToEdit.department || '',
        status: assetToEdit.status || 'OPERATIONAL',
        healthScore: assetToEdit.healthScore || 90,
        image: assetToEdit.image || SAMPLE_PRESET_IMAGES[1].url
      });
    } else {
      // Auto-generate a suggested Asset ID for new assets
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setFormData({
        name: '',
        assetId: `AST-EQ-${randomSuffix}`,
        category: 'Computer',
        description: '',
        brand: '',
        model: '',
        serialNumber: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchaseCost: '',
        warrantyExpiry: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location: 'Computer Science Wing, Room 201',
        department: 'Computer Science',
        status: 'OPERATIONAL',
        healthScore: 98,
        image: SAMPLE_PRESET_IMAGES[1].url
      });
    }
    setErrors({});
  }, [assetToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};

    if (!formData.name.trim()) {
      errs.name = 'Asset name is required.';
    }

    if (!formData.assetId.trim()) {
      errs.assetId = 'Asset ID is required.';
    } else {
      const isUnique = isAssetIdUnique(
        formData.assetId,
        isEditing ? assetToEdit.id : null
      );
      if (!isUnique) {
        errs.assetId = 'Asset ID already exists. Please choose a unique identifier.';
      }
    }

    if (!formData.category) {
      errs.category = 'Category is required.';
    }

    if (!formData.location.trim()) {
      errs.location = 'Campus location is required.';
    }

    if (!formData.department.trim()) {
      errs.department = 'Department is required.';
    }

    if (formData.purchaseCost && isNaN(Number(formData.purchaseCost))) {
      errs.purchaseCost = 'Purchase cost must be a valid number.';
    } else if (Number(formData.purchaseCost) < 0) {
      errs.purchaseCost = 'Purchase cost cannot be negative.';
    }

    if (formData.purchaseDate && formData.warrantyExpiry) {
      if (new Date(formData.warrantyExpiry) < new Date(formData.purchaseDate)) {
        errs.warrantyExpiry = 'Warranty expiry cannot be earlier than purchase date.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check permission
    const permitted = isEditing
      ? hasPermission(role, 'CAN_EDIT_ASSET')
      : hasPermission(role, 'CAN_ADD_ASSET');

    if (!permitted) {
      showToast({
        type: 'error',
        title: 'Action Denied',
        message: 'Your current role does not have permission to modify master asset records.'
      });
      return;
    }

    if (!validate()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please resolve the highlighted form errors.'
      });
      return;
    }

    setIsSubmitting(true);

    const assetPayload = {
      ...formData,
      assetId: formData.assetId.trim().toUpperCase(),
      purchaseCost: Number(formData.purchaseCost) || 0,
      healthScore: Number(formData.healthScore) || 95
    };

    if (isEditing) {
      updateAsset(assetToEdit.id, assetPayload);
      showToast({
        type: 'success',
        title: 'Asset Updated',
        message: `Asset ${assetPayload.assetId} (${assetPayload.name}) has been saved.`
      });
    } else {
      const created = addAsset(assetPayload);
      showToast({
        type: 'success',
        title: 'Asset Registered',
        message: `Asset ${created.assetId} successfully registered in campus inventory.`
      });
    }

    setIsSubmitting(false);
    if (onSaved) onSaved();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Asset: ${assetToEdit?.assetId}` : 'Register New Campus Asset'}
      subtitle={
        isEditing
          ? 'Update master specifications, location or operational status.'
          : 'Catalog educational equipment, lab devices, and campus infrastructure.'
      }
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Identifiers Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextInput
            label="Asset Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Computer Lab 1 Air Conditioner"
            error={errors.name}
            required
          />

          <TextInput
            label="Asset ID (Unique Code)"
            name="assetId"
            value={formData.assetId}
            onChange={handleChange}
            placeholder="e.g. AST-AC-001"
            error={errors.assetId}
            helperText="Uppercase alphanumeric format used for QR and barcodes."
            required
          />
        </div>

        {/* Category & Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SelectInput
            label="Asset Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={CATEGORIES}
            error={errors.category}
            required
          />

          <SelectInput
            label="Operational Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={STATUS_OPTIONS}
            required
          />

          <TextInput
            label="Simulated Health (%)"
            name="healthScore"
            type="number"
            min="0"
            max="100"
            value={formData.healthScore}
            onChange={handleChange}
            helperText="0-100% demo telemetry score."
          />
        </div>

        {/* Location & Department */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextInput
            label="Physical Campus Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Lab Block A, 2nd Floor, Room 204"
            error={errors.location}
            required
          />

          <TextInput
            label="Custodian Department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="e.g. Computer Science & Eng"
            error={errors.department}
            required
          />
        </div>

        {/* Brand, Model, Serial Number */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TextInput
            label="Manufacturer / Brand"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            placeholder="e.g. Daikin, Dell, Cisco"
          />

          <TextInput
            label="Model Number"
            name="model"
            value={formData.model}
            onChange={handleChange}
            placeholder="e.g. FTKF60TV16U"
          />

          <TextInput
            label="Serial Number"
            name="serialNumber"
            value={formData.serialNumber}
            onChange={handleChange}
            placeholder="e.g. DK-2023-AC-8921"
          />
        </div>

        {/* Purchase & Warranty Information */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TextInput
            label="Purchase Date"
            name="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={handleChange}
          />

          <TextInput
            label="Purchase Cost (₹)"
            name="purchaseCost"
            type="number"
            min="0"
            step="1"
            value={formData.purchaseCost}
            onChange={handleChange}
            placeholder="e.g. 62500"
            error={errors.purchaseCost}
          />

          <TextInput
            label="Warranty Expiry Date"
            name="warrantyExpiry"
            type="date"
            value={formData.warrantyExpiry}
            onChange={handleChange}
            error={errors.warrantyExpiry}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
            Technical Description & Specifications
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            placeholder="Detailed equipment specifications, power ratings, accessories included..."
            className="w-full bg-bg-elevated text-text-primary text-sm rounded-xl border border-industrial-border p-3 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30"
          />
        </div>

        {/* Image Selection & Preview */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Asset Photograph / Hardware Preview
          </label>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="w-24 h-24 rounded-2xl bg-bg-elevated border border-industrial-border overflow-hidden shrink-0 flex items-center justify-center">
              {formData.image ? (
                <img
                  src={formData.image}
                  alt="Asset Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <Image className="w-8 h-8 text-text-muted" />
              )}
            </div>

            <div className="flex-1 space-y-2 w-full">
              <TextInput
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="Paste image URL..."
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-text-muted mr-1">Presets:</span>
                {SAMPLE_PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, image: preset.url }))}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-bg-elevated border border-industrial-border text-text-secondary hover:text-accent-primary hover:border-accent-primary/40 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-industrial-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            {isEditing ? 'Save Asset Changes' : 'Register Asset'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
