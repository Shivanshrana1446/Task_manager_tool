import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import UserPicker from '../ui/UserPicker';
import Avatar from '../ui/Avatar';
import { useAddProjectMembers, useRemoveProjectMember } from '../../hooks/useProjects';

const AssignMembersModal = ({ isOpen, onClose, project }) => {
  const [pendingMembers, setPendingMembers] = useState([]);
  const addMutation = useAddProjectMembers();
  const removeMutation = useRemoveProjectMember();

  useEffect(() => {
    if (isOpen) setPendingMembers([]);
  }, [isOpen]);

  if (!project) return null;

  const handleAdd = async () => {
    if (pendingMembers.length === 0) return;
    try {
      await addMutation.mutateAsync({ id: project._id, members: pendingMembers });
      setPendingMembers([]);
    } catch {
      // surfaced via addMutation.error below
    }
  };

  const handleRemove = (userId) => {
    removeMutation.mutate({ id: project._id, userId });
  };

  const excludeIds = [
    project.owner._id,
    ...project.members.map((m) => m._id),
    ...pendingMembers.map((m) => m._id),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project members" size="md">
      <div className="mb-4 space-y-3">
        <Alert variant="error">
          {addMutation.error?.response?.data?.message ||
            removeMutation.error?.response?.data?.message}
        </Alert>

        <UserPicker
          label="Add members"
          multiple
          value={pendingMembers}
          onChange={setPendingMembers}
          excludeIds={excludeIds}
        />

        {pendingMembers.length > 0 && (
          <Button className="w-auto px-4" onClick={handleAdd} isLoading={addMutation.isPending}>
            Add {pendingMembers.length} member{pendingMembers.length === 1 ? '' : 's'}
          </Button>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-foreground">
          Current members ({project.members.length})
        </p>
        {project.members.length === 0 ? (
          <p className="text-sm text-foreground/40">No members yet.</p>
        ) : (
          <ul className="max-h-56 space-y-1 overflow-y-auto">
            {project.members.map((member) => (
              <li
                key={member._id}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-primary-50 dark:hover:bg-primary-950"
              >
                <div className="flex items-center gap-2">
                  <Avatar name={member.name} src={member.avatar?.url} size="sm" />
                  <span className="text-sm text-foreground">{member.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(member._id)}
                  className="text-foreground/40 hover:text-red-500"
                  aria-label={`Remove ${member.name}`}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="secondary" className="w-auto px-4" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
};

export default AssignMembersModal;
