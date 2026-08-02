import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const TONE_STYLES = {
  danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  default: 'bg-primary-500/10 text-primary-600 dark:text-primary-400',
};

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  isLoading,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="flex gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${TONE_STYLES[tone]}`}
      >
        <AlertTriangle size={20} />
      </div>
      <p className="pt-2 text-sm text-foreground/70">{message}</p>
    </div>

    <div className="mt-6 flex justify-end gap-3">
      <Button variant="secondary" className="w-auto px-4" onClick={onClose} disabled={isLoading}>
        {cancelLabel}
      </Button>
      <Button
        variant={tone === 'danger' ? 'danger' : 'primary'}
        className="w-auto px-4"
        onClick={onConfirm}
        isLoading={isLoading}
      >
        {confirmLabel}
      </Button>
    </div>
  </Modal>
);

export default ConfirmDialog;
