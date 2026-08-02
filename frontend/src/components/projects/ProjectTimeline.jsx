import { formatShortDate } from '../../utils/formatters';

const ProjectTimeline = ({ startDate, dueDate }) => {
  if (!startDate && !dueDate) {
    return <p className="text-xs text-foreground/40">No timeline set</p>;
  }

  if (!startDate || !dueDate) {
    return (
      <p className="text-xs text-foreground/50">
        {dueDate ? `Due ${formatShortDate(dueDate)}` : `Starts ${formatShortDate(startDate)}`}
      </p>
    );
  }

  const start = new Date(startDate).getTime();
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  const totalSpan = Math.max(due - start, 1);
  const elapsed = Math.min(Math.max(now - start, 0), totalSpan);
  const elapsedPercent = (elapsed / totalSpan) * 100;
  const isOverdue = now > due;

  return (
    <div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full ${isOverdue ? 'bg-red-500' : 'bg-primary-500'}`}
          style={{ width: `${elapsedPercent}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-foreground/40">
        <span>{formatShortDate(startDate)}</span>
        <span className={isOverdue ? 'font-medium text-red-500' : ''}>
          {formatShortDate(dueDate)}
        </span>
      </div>
    </div>
  );
};

export default ProjectTimeline;
