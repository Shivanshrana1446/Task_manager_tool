import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_GRID, CHART_MUTED, CHART_ACCENT } from '../../../utils/chartTheme';
import ChartTooltip from './ChartTooltip';

const UserGrowthArea = ({ data = [] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
      <defs>
        <linearGradient id="userGrowthFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART_ACCENT} stopOpacity={0.22} />
          <stop offset="100%" stopColor={CHART_ACCENT} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid vertical={false} stroke={CHART_GRID} />
      <XAxis
        dataKey="label"
        tick={{ fill: CHART_MUTED, fontSize: 12 }}
        axisLine={{ stroke: CHART_GRID }}
        tickLine={false}
      />
      <YAxis
        allowDecimals={false}
        tick={{ fill: CHART_MUTED, fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        width={28}
      />
      <Tooltip
        cursor={{ stroke: CHART_MUTED, strokeDasharray: '3 3' }}
        content={<ChartTooltip valueFormatter={(v) => `${v} new user${v === 1 ? '' : 's'}`} />}
      />
      <Area
        type="monotone"
        dataKey="count"
        name="New users"
        stroke={CHART_ACCENT}
        strokeWidth={2}
        fill="url(#userGrowthFill)"
        dot={{ r: 3, fill: CHART_ACCENT, strokeWidth: 2, stroke: 'rgb(var(--color-surface))' }}
        activeDot={{ r: 5 }}
        animationDuration={700}
      />
    </AreaChart>
  </ResponsiveContainer>
);

export default UserGrowthArea;
