import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import UserPicker from '../ui/UserPicker';
import TagInput from '../ui/TagInput';
import RichTextEditor, { isRichTextEmpty } from '../ui/RichTextEditor';
import ChecklistEditor from './ChecklistEditor';
import AttachmentManager from './AttachmentManager';
import StagedAttachmentPicker from './StagedAttachmentPicker';
import { taskFormSchema, TASK_STATUSES, TASK_PRIORITIES } from '../../validation/taskSchemas';
import { TASK_STATUS_LABELS, PRIORITY_LABELS } from '../../utils/chartTheme';
import { useCreateTask, useUpdateTask } from '../../hooks/useTasks';
import { uploadAttachment } from '../../services/attachmentsApi';
import { addToast } from '../../redux/slices/uiSlice';

const toDateInputValue = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

const TaskFormModal = ({ isOpen, onClose, task, projectId, projectMembers = [], parentTask }) => {
  const isEditMode = Boolean(task);
  const dispatch = useDispatch();
  const [assignees, setAssignees] = useState([]);
  const [tags, setTags] = useState([]);
  const [description, setDescription] = useState('');
  const [checklist, setChecklist] = useState([]);
  const [stagedAttachments, setStagedAttachments] = useState([]);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const mutation = isEditMode ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      status: 'todo',
      priority: 'medium',
      startDate: '',
      dueDate: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        title: task?.title || '',
        status: task?.status || 'todo',
        priority: task?.priority || 'medium',
        startDate: toDateInputValue(task?.startDate),
        dueDate: toDateInputValue(task?.dueDate),
        estimatedHours: task?.estimatedHours ?? '',
      });
      setAssignees(task?.assignees || []);
      setTags(task?.tags || []);
      setDescription(task?.description || '');
      setChecklist(task?.checklist || []);
      setStagedAttachments([]);
    }
  }, [isOpen, task, reset]);

  const uploadStagedAttachments = async (taskId) => {
    const validFiles = stagedAttachments.filter((item) => !item.error);
    if (validFiles.length === 0) return;

    setIsUploadingAttachments(true);
    const results = await Promise.allSettled(
      validFiles.map((item) => uploadAttachment(taskId, item.file))
    );
    setIsUploadingAttachments(false);

    const failedCount = results.filter((r) => r.status === 'rejected').length;
    if (failedCount > 0) {
      dispatch(
        addToast({
          title: 'Some attachments failed to upload',
          message: `${failedCount} of ${validFiles.length} file(s) couldn't be uploaded. Open the task to retry.`,
          tone: 'error',
        })
      );
    }
  };

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      description: isRichTextEmpty(description) ? '' : description,
      startDate: values.startDate || null,
      dueDate: values.dueDate || null,
      estimatedHours: values.estimatedHours === '' ? null : Number(values.estimatedHours),
      assignees: assignees.map((user) => user._id),
      tags,
      checklist,
    };

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({ id: task._id, data: payload });
      } else {
        const newTask = await createMutation.mutateAsync({
          ...payload,
          project: projectId,
          parentTask: parentTask || null,
        });
        await uploadStagedAttachments(newTask._id);
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
      title={isEditMode ? 'Edit task' : parentTask ? 'New subtask' : 'New task'}
      size="lg"
    >
      <div className="mb-4">
        <Alert variant="error">{mutation.error?.response?.data?.message}</Alert>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Title"
          placeholder="What needs to be done?"
          error={errors.title?.message}
          {...register('title')}
        />

        <RichTextEditor label="Description" value={description} onChange={setDescription} />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Status" error={errors.status?.message} {...register('status')}>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {TASK_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
          <Select label="Priority" error={errors.priority?.message} {...register('priority')}>
            {TASK_PRIORITIES.map((priority) => (
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

        <UserPicker
          label="Assignees"
          multiple
          value={assignees}
          onChange={setAssignees}
          options={projectMembers}
          placeholder="Assign project members..."
        />

        <TagInput label="Labels" value={tags} onChange={setTags} />

        <Input
          label="Estimated hours"
          type="number"
          min="0"
          step="0.5"
          placeholder="e.g. 4"
          error={errors.estimatedHours?.message}
          {...register('estimatedHours')}
        />

        <ChecklistEditor items={checklist} onChange={setChecklist} />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Attachments</label>
          {isEditMode ? (
            <AttachmentManager taskId={task._id} />
          ) : (
            <StagedAttachmentPicker files={stagedAttachments} onChange={setStagedAttachments} />
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" className="w-auto px-4" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-auto px-4"
            isLoading={mutation.isPending || isUploadingAttachments}
          >
            {isUploadingAttachments
              ? 'Uploading attachments...'
              : isEditMode
                ? 'Save changes'
                : 'Create task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskFormModal;
