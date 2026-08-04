import { useState } from 'react';
import { Pencil, Trash2, Calendar } from 'lucide-react';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import Avatar from '../ui/Avatar';
import TaskFormModal from './TaskFormModal';
import SubtaskList from './SubtaskList';
import ChecklistList from './ChecklistList';
import ActivityTimeline from './ActivityTimeline';
import RichTextEditor, { isRichTextEmpty } from '../ui/RichTextEditor';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../validation/taskSchemas';
import { TASK_STATUS_LABELS, PRIORITY_LABELS } from '../../utils/chartTheme';
import { formatShortDate } from '../../utils/formatters';
import { useUpdateTask, useDeleteTask } from '../../hooks/useTasks';

const TaskDetailModal = ({ isOpen, onClose, task, projectMembers }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  if (!task) return null;

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(task._id);
    setIsDeleteOpen(false);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen && !isEditOpen} onClose={onClose} title={task.title} size="xl">
        <div className="-mt-2 mb-4 flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            className="w-auto px-3 py-1.5 text-xs"
            onClick={() => setIsEditOpen(true)}
          >
            <Pencil size={13} /> Edit
          </Button>
          <Button
            variant="danger"
            className="w-auto px-3 py-1.5 text-xs"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 size={13} /> Delete
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            {!isRichTextEmpty(task.description) && (
              <div className="text-sm text-foreground/70">
                <RichTextEditor value={task.description} readOnly />
              </div>
            )}

            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Checklist</h3>
              <ChecklistList task={task} />
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Subtasks</h3>
              <SubtaskList parentTask={task} />
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Activity</h3>
              <ActivityTimeline taskId={task._id} projectMembers={projectMembers} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-foreground/40">
                Status
              </label>
              <Select
                value={task.status}
                onChange={(event) =>
                  updateMutation.mutate({ id: task._id, data: { status: event.target.value } })
                }
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {TASK_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-foreground/40">
                Priority
              </label>
              <Select
                value={task.priority}
                onChange={(event) =>
                  updateMutation.mutate({ id: task._id, data: { priority: event.target.value } })
                }
              >
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-foreground/40">
                Due date
              </label>
              <p className="flex items-center gap-1.5 text-sm text-foreground/70">
                <Calendar size={14} />
                {task.dueDate ? formatShortDate(task.dueDate) : 'No due date'}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-foreground/40">
                Assignees
              </label>
              {task.assignees?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {task.assignees.map((assignee) => (
                    <div
                      key={assignee._id}
                      className="flex items-center gap-1.5 rounded-full bg-surface px-2 py-1 text-xs ring-1 ring-border"
                    >
                      <Avatar name={assignee.name} src={assignee.avatar?.url} size="sm" />
                      {assignee.name}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-foreground/40">Unassigned</p>
              )}
            </div>

            {task.tags?.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-foreground/40">
                  Labels
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <TaskFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        task={task}
        projectMembers={projectMembers}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete task?"
        message={`"${task.title}" will be moved to trash.`}
        confirmLabel="Delete"
        tone="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};

export default TaskDetailModal;
