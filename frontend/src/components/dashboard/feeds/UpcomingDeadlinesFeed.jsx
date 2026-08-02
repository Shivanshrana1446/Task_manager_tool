import { CalendarClock } from 'lucide-react';
import FeedCard from '../FeedCard';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../../utils/chartTheme';
import { formatDueLabel } from '../../../utils/formatters';

const UpcomingDeadlinesFeed = ({ items, isLoading }) => (
  <FeedCard
    title="Upcoming deadlines"
    isLoading={isLoading}
    isEmpty={!items?.length}
    emptyMessage="No deadlines in the next 7 days."
  >
    {items?.map((task) => (
      <li key={task._id} className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface ring-1 ring-border">
          <CalendarClock size={14} className="text-foreground/50" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
          <p className="truncate text-xs text-foreground/40">{task.project?.name}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-xs font-medium text-foreground/70">
            {formatDueLabel(task.dueDate)}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-foreground/40">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
            />
            {PRIORITY_LABELS[task.priority]}
          </span>
        </div>
      </li>
    ))}
  </FeedCard>
);

export default UpcomingDeadlinesFeed;
