const ProjectProgressBar = ({ progress = 0, completed = 0, total = 0 }) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-xs">
      <span className="font-medium text-foreground/70">Progress</span>
      <span className="tabular-nums text-foreground/50">
        {completed}/{total} tasks
      </span>
    </div>
    <div className="h-2 w-full overflow-hidden rounded-full bg-border">
      <div
        className="h-full rounded-full bg-primary-500 transition-all duration-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

export default ProjectProgressBar;
