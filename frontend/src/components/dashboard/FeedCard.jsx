import Skeleton from '../ui/Skeleton';

const FeedCard = ({ title, action, isLoading, isEmpty, emptyMessage = 'Nothing here yet.', children }) => (
  <div className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {action}
    </div>

    {isLoading ? (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    ) : isEmpty ? (
      <p className="py-6 text-center text-sm text-foreground/40">{emptyMessage}</p>
    ) : (
      <ul className="space-y-3">{children}</ul>
    )}
  </div>
);

export default FeedCard;
