import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { projectFormSchema, PROJECT_STATUSES, PRIORITIES } from '../../validation/projectSchemas';
import { PROJECT_STATUS_LABELS, PRIORITY_LABELS } from '../../utils/chartTheme';
import { useCreateProject, useUpdateProject } from '../../hooks/useProjects';

const toDateInputValue = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

const ProjectFormModal = ({ isOpen, onClose, project }) => {
  const isEditMode = Boolean(project);
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const mutation = isEditMode ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'planning',
      priority: 'medium',
      startDate: '',
      dueDate: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: project?.name || '',
        description: project?.description || '',
        status: project?.status || 'planning',
        priority: project?.priority || 'medium',
        startDate: toDateInputValue(project?.startDate),
        dueDate: toDateInputValue(project?.dueDate),
      });
    }
  }, [isOpen, project, reset]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      startDate: values.startDate || null,
      dueDate: values.dueDate || null,
    };

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({ id: project._id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch {
      // surfaced via mutation.error below
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit project' : 'New project'}
      size="lg"
    >
      <div className="mb-4">
        <Alert variant="error">{mutation.error?.response?.data?.message}</Alert>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Project name"
          placeholder="Website redesign"
          error={errors.name?.message}
          {...register('name')}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
          <textarea
            rows={3}
            placeholder="What is this project about?"
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1.5 text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Status" error={errors.status?.message} {...register('status')}>
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PROJECT_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
          <Select label="Priority" error={errors.priority?.message} {...register('priority')}>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start date"
            type="date"
            error={errors.startDate?.message}
            {...register('startDate')}
          />
          <Input
            label="Due date"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" className="w-auto px-4" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="w-auto px-4" isLoading={mutation.isPending}>
            {isEditMode ? 'Save changes' : 'Create project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectFormModal;
