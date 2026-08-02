import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_GRID, CHART_MUTED, CHART_ACCENT, CHART_ACCENT_TRACK } from '../../../utils/chartTheme';
import ChartTooltip from './ChartTooltip';
import ChartLegend from './ChartLegend';

const TeamPerformanceBars = ({ data = [] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={data}
      layout="vertical"
      margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
      barGap={4}
    >
      <CartesianGrid horizontal={false} stroke={CHART_GRID} />
      <XAxis
        type="number"
        allowDecimals={false}
        tick={{ fill: CHART_MUTED, fontSize: 11 }}
        axisLine={{ stroke: CHART_GRID }}
        tickLine={false}
      />
      <YAxis
        type="category"
        dataKey="name"
        width={92}
        tick={{ fill: CHART_MUTED, fontSize: 12 }}
        axisLine={false}
        tickLine={false}
      />
      <Tooltip cursor={{ fill: 'rgb(var(--chart-blue) / 0.06)' }} content={<ChartTooltip />} />
      <Legend content={<ChartLegend />} />
      <Bar dataKey="assigned" name="Assigned" fill={CHART_ACCENT_TRACK} radius={[0, 4, 4, 0]} maxBarSize={14} />
      <Bar dataKey="completed" name="Completed" fill={CHART_ACCENT} radius={[0, 4, 4, 0]} maxBarSize={14} />
    </BarChart>
  </ResponsiveContainer>
);

export default TeamPerformanceBars;
