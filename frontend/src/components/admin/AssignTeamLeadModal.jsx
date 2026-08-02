import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import UserPicker from '../ui/UserPicker';
import { useAssignTeamLead } from '../../hooks/useTeams';

const AssignTeamLeadModal = ({ isOpen, onClose, team }) => {
  const [lead, setLead] = useState(null);
  const mutation = useAssignTeamLead();

  useEffect(() => {
    if (isOpen) {
      setLead(team?.lead || null);
    }
  }, [isOpen, team]);

  if (!team) return null;

  const handleSubmit = async () => {
    if (!lead || lead._id === team.lead._id) {
      onClose();
      return;
    }
    try {
      await mutation.mutateAsync({ id: team._id, lead });
      onClose();
    } catch {
      // surfaced via mutation.error below
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign team lead" size="sm">
      <div className="mb-4">
        <Alert variant="error">{mutation.error?.response?.data?.message}</Alert>
      </div>

      <p className="mb-4 text-sm text-foreground/60">
        Choose who leads <span className="font-medium text-foreground">{team.name}</span>. The current
        lead will remain a team member.
      </p>

      <UserPicker label="Team lead" value={lead} onChange={setLead} />

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" className="w-auto px-4" onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="w-auto px-4"
          onClick={handleSubmit}
          isLoading={mutation.isPending}
          disabled={!lead}
        >
          Save
        </Button>
      </div>
    </Modal>
  );
};

export default AssignTeamLeadModal;
