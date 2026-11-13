import React from 'react';
import Modal from './Modal';
import Button from '../common/Button';
import { AlertTriangle, Info } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) {
  const isDanger = variant === 'danger';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      showCloseButton={!isLoading}
    >
      <div className="flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
          isDanger
            ? 'bg-status-critical/15 text-status-critical border border-status-critical/30 shadow-glow-critical'
            : 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30 shadow-glow-sm'
        }`}>
          {isDanger ? (
            <AlertTriangle className="w-6 h-6" />
          ) : (
            <Info className="w-6 h-6" />
          )}
        </div>

        <h3 className="text-lg font-bold font-display text-text-primary mb-2">
          {title}
        </h3>

        <div className="text-sm text-text-secondary leading-relaxed mb-6">
          {message}
        </div>

        <div className="flex items-center justify-center gap-3 w-full">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>

          <Button
            variant={isDanger ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
