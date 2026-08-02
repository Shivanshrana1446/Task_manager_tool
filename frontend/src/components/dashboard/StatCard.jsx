import { motion } from 'framer-motion';
import clsx from 'clsx';
import { compactNumber } from '../../utils/formatters';
import { useCountUp } from '../../hooks/useCountUp';
import Skeleton from '../ui/Skeleton';

const ACCENTS = {
  blue: 'bg-primary-500/10 text-primary-600 dark:text-primary-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
  slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
};

const StatCard = ({ label, value, icon: Icon, accent = 'blue', isLoading, subtext }) => {
  const animatedValue = useCountUp(isLoading ? 0 : Number(value) || 0);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground/60">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              {compactNumber(animatedValue)}
            </p>
          )}
          {subtext && !isLoading && (
            <p className="mt-1 text-xs text-foreground/50">{subtext}</p>
          )}
        </div>

        {Icon && (
          <div
            className={clsx(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
              ACCENTS[accent]
            )}
          >
            <Icon size={20} strokeWidth={2} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
