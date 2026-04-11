import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div
      className="confirm-modal-overlay"
      role="presentation"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-modal-title" className="confirm-modal-title">
          {title}
        </h2>
        <div className="confirm-modal-body">{children}</div>
        <div className="confirm-modal-actions">
          <button type="button" className="confirm-modal-btn cancel" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-modal-btn ${variant === 'danger' ? 'danger' : 'primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
