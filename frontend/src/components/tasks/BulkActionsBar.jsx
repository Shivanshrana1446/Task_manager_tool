import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, X } from 'lucide-react';
import Select from '../ui/Select';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { TASK_STATUSES } from '../../validation/taskSchemas';
import { TASK_STATUS_LABELS } from '../../utils/chartTheme';

const BulkActionsBar = ({
  count,
  onClear,
  onUpdateStatus,
  onDelete,
  isUpdating,
  isDeleting,
}) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="glass flex flex-wrap items-center gap-3 rounded-xl border border-border px-4 py-3"
      >
        <span className="text-sm font-medium text-foreground">{count} selected</span>

        <Select
          className="w-auto min-w-[9rem]"
          value=""
          onChange={(event) => event.target.value && onUpdateStatus(event.target.value)}
          disabled={isUpdating}
        >
          <option value="">Set status...</option>
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {TASK_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>

        <Button
          variant="danger"
          className="w-auto px-3 py-2 text-xs"
          onClick={() => setIsDeleteOpen(true)}
          isLoading={isDeleting}
        >
          <Trash2 size={13} /> Delete
        </Button>

        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-foreground/40 hover:bg-primary-50 hover:text-foreground dark:hover:bg-primary-950"
        >
          <X size={16} />
        </button>
      </motion.div>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          onDelete();
          setIsDeleteOpen(false);
        }}
        title="Delete selected tasks?"
        message={`${count} task${count === 1 ? '' : 's'} will be moved to trash. Tasks you don't have permission to delete will be skipped.`}
        confirmLabel="Delete"
        tone="danger"
        isLoading={isDeleting}
      />
    </>
  );
};

export default BulkActionsBar;
