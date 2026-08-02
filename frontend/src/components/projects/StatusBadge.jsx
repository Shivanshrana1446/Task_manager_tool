import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '../../utils/chartTheme';

const StatusBadge = ({ status }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-foreground/70 ring-1 ring-border">
    <span
      className="h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: PROJECT_STATUS_COLORS[status] }}
    />
    {PROJECT_STATUS_LABELS[status] || status}
  </span>
);

export default StatusBadge;
