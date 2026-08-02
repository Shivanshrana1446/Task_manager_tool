import { motion } from 'framer-motion';
import TaskStatusBadge from './TaskStatusBadge';
import PriorityBadge from '../projects/PriorityBadge';
import Avatar from '../ui/Avatar';
import { formatDueLabel } from '../../utils/formatters';

const TaskListView = ({ tasks, onTaskClick }) => (
  <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
    {tasks.map((task, index) => {
      const isOverdue =
        task.dueDate &&
        new Date(task.dueDate) < new Date() &&
        !['done', 'cancelled'].includes(task.status);

      return (
        <motion.button
          key={task._id}
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3) }}
          onClick={() => onTaskClick(task)}
          className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-primary-50 dark:hover:bg-primary-950"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
            {task.tags?.length > 0 && (
              <div className="mt-1 flex gap-1">
                {task.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <TaskStatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          <span
            className={`w-20 shrink-0 text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-foreground/50'}`}
          >
            {task.dueDate ? formatDueLabel(task.dueDate) : '—'}
          </span>
          <div className="flex -space-x-1.5">
            {(task.assignees || []).slice(0, 3).map((assignee) => (
              <div key={assignee._id} className="rounded-full ring-2 ring-surface">
                <Avatar name={assignee.name} src={assignee.avatar?.url} size="sm" />
              </div>
            ))}
          </div>
        </motion.button>
      );
    })}
    {tasks.length === 0 && (
      <p className="px-4 py-10 text-center text-sm text-foreground/40">No tasks found</p>
    )}
  </div>
);

export default TaskListView;
