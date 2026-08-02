import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import UserPicker from '../ui/UserPicker';
import { useAssignProjectManager } from '../../hooks/useProjects';

const AssignManagerModal = ({ isOpen, onClose, project }) => {
  const [manager, setManager] = useState(null);
  const mutation = useAssignProjectManager();

  useEffect(() => {
    if (isOpen) {
      setManager(project?.owner || null);
    }
  }, [isOpen, project]);

  if (!project) return null;

  const handleSubmit = async () => {
    if (!manager || manager._id === project.owner._id) {
      onClose();
      return;
    }
    try {
      await mutation.mutateAsync({ id: project._id, manager });
      onClose();
    } catch {
      // surfaced via mutation.error below
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign project manager" size="sm">
      <div className="mb-4">
        <Alert variant="error">{mutation.error?.response?.data?.message}</Alert>
      </div>

      <p className="mb-4 text-sm text-foreground/60">
        Choose who manages <span className="font-medium text-foreground">{project.name}</span>. The
        current manager will remain a project member.
      </p>

      <UserPicker label="Project manager" value={manager} onChange={setManager} />

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" className="w-auto px-4" onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="w-auto px-4"
          onClick={handleSubmit}
          isLoading={mutation.isPending}
          disabled={!manager}
        >
          Save
        </Button>
      </div>
    </Modal>
  );
};

export default AssignManagerModal;
