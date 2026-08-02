import { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { useTasksList, useCreateTask, useUpdateTask, useDeleteTask } from '../../hooks/useTasks';
import Spinner from '../ui/Spinner';

const SubtaskList = ({ parentTask }) => {
  const [title, setTitle] = useState('');
  const { data, isLoading } = useTasksList({
    parentTask: parentTask._id,
    limit: 50,
    sort: 'position',
  });
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const subtasks = data?.tasks || [];
  const completed = subtasks.filter((subtask) => subtask.status === 'done').length;

  const handleAdd = (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate(
      { title: title.trim(), project: parentTask.project, parentTask: parentTask._id },
      { onSuccess: () => setTitle('') }
    );
  };

  const toggleDone = (subtask) => {
    updateMutation.mutate({
      id: subtask._id,
      data: { status: subtask.status === 'done' ? 'todo' : 'done' },
    });
  };

  return (
    <div>
      {subtasks.length > 0 && (
        <p className="mb-2 text-xs font-medium text-foreground/40">
          {completed}/{subtasks.length} completed
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-3">
          <Spinner size={16} />
        </div>
      ) : (
        <ul className="space-y-1">
          {subtasks.map((subtask) => (
            <li
              key={subtask._id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-primary-50 dark:hover:bg-primary-950"
            >
              <button
                type="button"
                onClick={() => toggleDone(subtask)}
                aria-label={subtask.status === 'done' ? 'Mark as not done' : 'Mark as done'}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  subtask.status === 'done'
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-border text-transparent'
                }`}
              >
                <Check size={12} />
              </button>
              <span
                className={`flex-1 text-sm ${
                  subtask.status === 'done' ? 'text-foreground/40 line-through' : 'text-foreground/80'
                }`}
              >
                {subtask.title}
              </span>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(subtask._id)}
                aria-label={`Delete ${subtask.title}`}
                className="text-foreground/30 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="mt-2 flex items-center gap-2 px-2">
        <Plus size={14} className="text-foreground/30" />
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a subtask..."
          className="flex-1 bg-transparent py-1 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
        />
      </form>
    </div>
  );
};

export default SubtaskList;
