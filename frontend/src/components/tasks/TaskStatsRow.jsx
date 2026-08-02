import { KANBAN_STATUSES } from '../../validation/taskSchemas';
import { TASK_STATUS_LABELS } from '../../utils/chartTheme';

const TaskStatsRow = ({ taskStats }) => {
  const byStatus = taskStats?.byStatus || {};
  const total = taskStats?.total ?? 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <div className="rounded-xl border border-border bg-surface px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground/40">Total</p>
        <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{total}</p>
      </div>
      {KANBAN_STATUSES.map((status) => (
        <div key={status} className="rounded-xl border border-border bg-surface px-4 py-3">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-foreground/40">
            {TASK_STATUS_LABELS[status]}
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {byStatus[status] || 0}
          </p>
        </div>
      ))}
    </div>
  );
};

export default TaskStatsRow;
