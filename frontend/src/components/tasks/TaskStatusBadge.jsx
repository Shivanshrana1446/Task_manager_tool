import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '../../utils/chartTheme';

const TaskStatusBadge = ({ status }) => (
  <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-foreground/70 ring-1 ring-border">
    <span
      className="h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: TASK_STATUS_COLORS[status] }}
    />
    {TASK_STATUS_LABELS[status] || status}
  </span>
);

export default TaskStatusBadge;
