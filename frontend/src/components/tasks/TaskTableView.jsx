import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import TaskStatusBadge from './TaskStatusBadge';
import PriorityBadge from '../projects/PriorityBadge';
import Avatar from '../ui/Avatar';
import { formatShortDate } from '../../utils/formatters';

const COLUMNS = [
  { key: 'title', label: 'Task', sortable: true },
  { key: 'status', label: 'Status', sortable: false },
  { key: 'priority', label: 'Priority', sortable: true },
  { key: 'assignees', label: 'Assignee', sortable: false },
  { key: 'dueDate', label: 'Due date', sortable: true },
  { key: 'createdAt', label: 'Created', sortable: true },
];

const taskShortId = (id) => `#${id.slice(-6).toUpperCase()}`;

const TaskTableView = ({
  tasks,
  onTaskClick,
  sort,
  onSortChange,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onEditTask,
  onDeleteTask,
}) => {
  const toggleSort = (key) => {
    if (sort === key) onSortChange(`-${key}`);
    else onSortChange(key);
  };

  const allSelected = tasks.length > 0 && tasks.every((task) => selectedIds.includes(task._id));
  const canSelect = Boolean(onToggleSelect);

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-foreground/40">
            {canSelect && (
              <th className="w-10 whitespace-nowrap px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all tasks"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                />
              </th>
            )}
            <th className="whitespace-nowrap px-4 py-3 font-medium">Task ID</th>
            {COLUMNS.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-4 py-3 font-medium">
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    {col.label}
                    <ArrowUpDown size={12} />
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
            {(onEditTask || onDeleteTask) && (
              <th className="whitespace-nowrap px-4 py-3 font-medium">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tasks.map((task) => (
            <tr
              key={task._id}
              onClick={() => onTaskClick(task)}
              className="cursor-pointer transition-colors hover:bg-primary-50 dark:hover:bg-primary-950"
            >
              {canSelect && (
                <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label={`Select ${task.title}`}
                    checked={selectedIds.includes(task._id)}
                    onChange={() => onToggleSelect(task._id)}
                    className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                </td>
              )}
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-foreground/50">
                {taskShortId(task._id)}
              </td>
              <td className="max-w-xs truncate px-4 py-3 font-medium text-foreground">
                {task.title}
              </td>
              <td className="px-4 py-3">
                <TaskStatusBadge status={task.status} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="px-4 py-3">
                <div className="flex -space-x-1.5">
                  {(task.assignees || []).slice(0, 3).map((assignee) => (
                    <div key={assignee._id} className="rounded-full ring-2 ring-surface">
                      <Avatar name={assignee.name} src={assignee.avatar?.url} size="sm" />
                    </div>
                  ))}
                  {(!task.assignees || task.assignees.length === 0) && (
                    <span className="text-foreground/30">—</span>
                  )}
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-foreground/60">
                {task.dueDate ? formatShortDate(task.dueDate) : '—'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-foreground/60">
                {task.createdAt ? formatShortDate(task.createdAt) : '—'}
              </td>
              {(onEditTask || onDeleteTask) && (
                <td className="whitespace-nowrap px-4 py-3" onClick={(event) => event.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    {onEditTask && (
                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        aria-label={`Edit ${task.title}`}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-foreground/40 hover:bg-primary-50 hover:text-foreground dark:hover:bg-primary-950"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                    {onDeleteTask && (
                      <button
                        type="button"
                        onClick={() => onDeleteTask(task)}
                        aria-label={`Delete ${task.title}`}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-foreground/40 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {tasks.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-foreground/40">No tasks found</p>
      )}
    </div>
  );
};

export default TaskTableView;
