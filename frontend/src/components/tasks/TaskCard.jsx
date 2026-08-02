import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, GitBranch } from 'lucide-react';
import PriorityBadge from '../projects/PriorityBadge';
import Avatar from '../ui/Avatar';
import { formatDueLabel } from '../../utils/formatters';

const TaskCard = ({ task, subtaskStats, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    !['done', 'cancelled'].includes(task.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-grab touch-none rounded-xl border border-border bg-surface p-3.5 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <p className="mb-2 line-clamp-2 text-sm font-medium text-foreground">{task.title}</p>

      {task.tags?.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[10px] text-foreground/40">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <PriorityBadge priority={task.priority} />
        {subtaskStats && subtaskStats.total > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-foreground/40">
            <GitBranch size={11} />
            {subtaskStats.completed}/{subtaskStats.total}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        {task.dueDate ? (
          <span
            className={`flex items-center gap-1 text-[11px] font-medium ${
              isOverdue ? 'text-red-500' : 'text-foreground/50'
            }`}
          >
            <Calendar size={11} />
            {formatDueLabel(task.dueDate)}
          </span>
        ) : (
          <span />
        )}

        {task.assignees?.length > 0 && (
          <div className="flex -space-x-1.5">
            {task.assignees.slice(0, 3).map((assignee) => (
              <div key={assignee._id} className="rounded-full ring-2 ring-surface">
                <Avatar name={assignee.name} src={assignee.avatar?.url} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
