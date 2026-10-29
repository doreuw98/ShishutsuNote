import { useEffect, useRef } from 'react';
import type { SyntheticEvent } from 'react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleCancel(event: SyntheticEvent<HTMLDialogElement, Event>) {
    event.preventDefault();
    onCancel();
  }

  return (
    <dialog aria-labelledby="confirm-title" className="dialog confirm-dialog" onCancel={handleCancel} ref={dialogRef}>
      <div className="confirm-symbol" aria-hidden="true">!</div>
      <h2 id="confirm-title">{title}</h2>
      <p>{description}</p>
      <div className="dialog-actions">
        <button autoFocus className="button button-quiet" onClick={onCancel} type="button">キャンセル</button>
        <button className="button button-danger" onClick={onConfirm} type="button">{confirmLabel}</button>
      </div>
    </dialog>
  );
}
