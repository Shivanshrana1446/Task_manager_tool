import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '../../utils/chartTheme';

const KanbanColumn = ({ status, tasks, subtaskStatsMap, onTaskClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl bg-black/[0.02] p-2 dark:bg-white/[0.03]">
      <div className="mb-2 flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: TASK_STATUS_COLORS[status] }}
          />
          <span className="text-sm font-semibold text-foreground">
            {TASK_STATUS_LABELS[status]}
          </span>
        </div>
        <span className="rounded-full bg-border px-2 py-0.5 text-xs font-medium text-foreground/50">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[5rem] flex-1 flex-col gap-2 rounded-xl p-1 transition-colors ${
          isOver ? 'bg-primary-500/5 ring-2 ring-primary-500/30' : ''
        }`}
      >
        <SortableContext items={tasks.map((task) => task._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              subtaskStats={subtaskStatsMap[task._id]}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-foreground/30">No tasks</p>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
