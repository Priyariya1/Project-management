import { useState } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}) {
  const [working, setWorking] = useState(false);

  const handleConfirm = async () => {
    setWorking(true);
    try {
      await onConfirm();
    } finally {
      setWorking(false);
    }
  };

  return (
    <Modal open={open} title={title} onClose={working ? () => {} : onCancel} size="sm">
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={working}>
          Cancel
        </button>
        <button type="button" className="btn-danger" onClick={handleConfirm} disabled={working}>
          {working ? <Spinner className="h-4 w-4" label="Deleting…" /> : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
