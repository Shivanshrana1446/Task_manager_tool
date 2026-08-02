import clsx from 'clsx';
import { chartColor } from '../../utils/chartTheme';

const DOT_COLORS = {
  neutral: null,
  primary: chartColor('chart-blue'),
  success: chartColor('status-good'),
  warning: chartColor('status-warning'),
  danger: chartColor('status-critical'),
};

const Badge = ({ variant = 'neutral', className, children }) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-foreground/70 ring-1 ring-border',
      className
    )}
  >
    {DOT_COLORS[variant] && (
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: DOT_COLORS[variant] }}
      />
    )}
    {children}
  </span>
);

export default Badge;
