import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../utils/chartTheme';

const PriorityBadge = ({ priority }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-foreground/60">
    <span
      className="h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: PRIORITY_COLORS[priority] }}
    />
    {PRIORITY_LABELS[priority] || priority}
  </span>
);

export default PriorityBadge;
