import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import UserPicker from '../ui/UserPicker';
import { teamFormSchema } from '../../validation/teamSchemas';
import { useCreateTeam, useUpdateTeam } from '../../hooks/useTeams';

const TeamFormModal = ({ isOpen, onClose, team }) => {
  const isEditMode = Boolean(team);
  const [lead, setLead] = useState(null);
  const createMutation = useCreateTeam();
  const updateMutation = useUpdateTeam();
  const mutation = isEditMode ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(teamFormSchema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ name: team?.name || '', description: team?.description || '' });
      setLead(null);
    }
  }, [isOpen, team, reset]);

  const onSubmit = async (values) => {
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({ id: team._id, data: values });
      } else {
        if (!lead) return;
        await createMutation.mutateAsync({ ...values, lead: lead._id });
      }
      onClose();
    } catch {
      // surfaced via mutation.error below
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit team' : 'New team'} size="md">
      <div className="mb-4">
        <Alert variant="error">{mutation.error?.response?.data?.message}</Alert>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Team name"
          placeholder="Platform Engineering"
          error={errors.name?.message}
          {...register('name')}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
          <textarea
            rows={3}
            placeholder="What does this team own?"
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1.5 text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        {!isEditMode && <UserPicker label="Team lead" value={lead} onChange={setLead} />}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" className="w-auto px-4" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-auto px-4"
            isLoading={mutation.isPending}
            disabled={!isEditMode && !lead}
          >
            {isEditMode ? 'Save changes' : 'Create team'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TeamFormModal;
