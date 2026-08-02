import Skeleton from '../ui/Skeleton';

const ProjectCardSkeleton = () => (
  <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <div className="w-2/3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    <Skeleton className="h-2 w-full rounded-full" />
    <Skeleton className="h-1.5 w-full rounded-full" />
    <div className="flex items-center justify-between border-t border-border pt-3">
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  </div>
);

export default ProjectCardSkeleton;
