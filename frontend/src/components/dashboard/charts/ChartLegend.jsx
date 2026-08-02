const ChartLegend = ({ payload }) => (
  <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-foreground/60">
    {payload?.map((entry) => (
      <div key={entry.value} className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: entry.color }} />
        {entry.value}
      </div>
    ))}
  </div>
);

export default ChartLegend;
