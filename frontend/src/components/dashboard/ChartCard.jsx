import Skeleton from '../ui/Skeleton';

const ChartCard = ({
  title,
  subtitle,
  action,
  isLoading,
  height = 260,
  empty,
  emptyTitle = 'Nothing to show yet',
  emptyMessage = 'Data will appear here once available.',
  children,
}) => (
  <div className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-foreground/50">{subtitle}</p>}
      </div>
      {action}
    </div>

    <div style={{ height }} className="relative">
      {isLoading ? (
        <Skeleton className="h-full w-full" />
      ) : empty ? (
        <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm font-medium text-foreground/60">{emptyTitle}</p>
          <p className="text-xs text-foreground/40">{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </div>
  </div>
);

export default ChartCard;
