import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '../../../utils/chartTheme';
import ChartTooltip from './ChartTooltip';

const STATUS_ORDER = ['planning', 'active', 'on_hold', 'completed', 'archived'];

const ProjectsByStatusDonut = ({ data = [] }) => {
  const byStatus = Object.fromEntries(data.map((row) => [row.status, row.count]));
  const chartData = STATUS_ORDER.map((status) => ({
    status,
    label: PROJECT_STATUS_LABELS[status],
    count: byStatus[status] || 0,
  }));
  const total = chartData.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="flex h-full items-center gap-2">
      <div className="relative h-full min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="label"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              animationDuration={700}
            >
              {chartData.map((entry) => (
                <Cell key={entry.status} fill={PROJECT_STATUS_COLORS[entry.status]} />
              ))}
            </Pie>
            <Tooltip
              content={<ChartTooltip valueFormatter={(v) => `${v} project${v === 1 ? '' : 's'}`} />}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-foreground">{total}</span>
          <span className="text-xs text-foreground/50">projects</span>
        </div>
      </div>

      <ul className="flex shrink-0 flex-col gap-2 pr-1 text-xs">
        {chartData.map((entry) => (
          <li key={entry.status} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: PROJECT_STATUS_COLORS[entry.status] }}
            />
            <span className="text-foreground/70">{entry.label}</span>
            <span className="ml-auto pl-2 font-semibold tabular-nums text-foreground">
              {entry.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectsByStatusDonut;
