'use client';
import Modal from './Modal';

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = 'Delete', 
  variant = 'danger' 
}) {
  const btnClass = variant === 'danger' ? 'btn-danger' : 'btn-primary';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div style={{ marginBottom: 'var(--space-6)', color: 'var(--text-secondary)' }}>
        {message}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className={`btn ${btnClass}`} onClick={() => {
          onConfirm();
          onClose();
        }}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
