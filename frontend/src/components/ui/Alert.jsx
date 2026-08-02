import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import clsx from 'clsx';

const VARIANTS = {
  error: {
    icon: AlertCircle,
    classes: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  },
  success: {
    icon: CheckCircle2,
    classes: 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400',
  },
  info: {
    icon: Info,
    classes: 'border-primary-500/30 bg-primary-500/10 text-primary-700 dark:text-primary-400',
  },
};

const Alert = ({ variant = 'info', children }) => {
  const config = VARIANTS[variant];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {children && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.2 }}
          role="alert"
          className={clsx(
            'flex items-start gap-2 overflow-hidden rounded-lg border px-3.5 py-2.5 text-sm',
            config.classes
          )}
        >
          <Icon size={18} className="mt-0.5 shrink-0" />
          <span>{children}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Alert;
