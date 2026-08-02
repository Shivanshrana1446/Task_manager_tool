import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ResponsiveContainer } from 'recharts';
import { CHART_GRID, CHART_MUTED, CHART_ACCENT } from '../../../utils/chartTheme';
import ChartTooltip from './ChartTooltip';

const ProjectProgressBars = ({ data = [] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={data}
      layout="vertical"
      margin={{ top: 4, right: 32, left: 4, bottom: 4 }}
      barCategoryGap="28%"
    >
      <CartesianGrid horizontal={false} stroke={CHART_GRID} />
      <XAxis
        type="number"
        domain={[0, 100]}
        tick={{ fill: CHART_MUTED, fontSize: 11 }}
        axisLine={{ stroke: CHART_GRID }}
        tickLine={false}
        unit="%"
      />
      <YAxis
        type="category"
        dataKey="name"
        width={110}
        tick={{ fill: CHART_MUTED, fontSize: 12 }}
        axisLine={false}
        tickLine={false}
      />
      <Tooltip
        cursor={{ fill: 'rgb(var(--chart-blue) / 0.08)' }}
        content={<ChartTooltip valueFormatter={(v) => `${v}%`} />}
      />
      <Bar dataKey="progress" name="Progress" fill={CHART_ACCENT} radius={[0, 4, 4, 0]} maxBarSize={18}>
        <LabelList
          dataKey="progress"
          position="right"
          formatter={(v) => `${v}%`}
          fill={CHART_MUTED}
          fontSize={11}
        />
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export default ProjectProgressBars;
