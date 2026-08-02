import { motion } from 'framer-motion';

const EmptyState = ({ icon: Icon, title, message, action, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center ${className}`}
  >
    {Icon && (
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
        <Icon size={26} strokeWidth={1.75} />
      </div>
    )}
    <div className="space-y-1">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {message && <p className="max-w-sm text-sm text-foreground/50">{message}</p>}
    </div>
    {action && <div className="mt-2">{action}</div>}
  </motion.div>
);

export default EmptyState;
