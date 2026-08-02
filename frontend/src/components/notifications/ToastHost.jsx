import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { removeToast } from '../../redux/slices/uiSlice';

const TONE_STYLES = {
  info: { icon: Bell, iconClass: 'bg-primary-500/10 text-primary-600 dark:text-primary-400', barClass: 'bg-primary-500/60' },
  success: { icon: CheckCircle2, iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', barClass: 'bg-emerald-500/60' },
  error: { icon: AlertTriangle, iconClass: 'bg-red-500/10 text-red-600 dark:text-red-400', barClass: 'bg-red-500/60' },
};

const ToastItem = ({ toast }) => {
  const dispatch = useDispatch();
  const { icon: Icon, iconClass, barClass } = TONE_STYLES[toast.tone] || TONE_STYLES.info;

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(toast.id)), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="glass-strong pointer-events-auto relative w-80 overflow-hidden rounded-xl border border-border shadow-floating"
    >
      <div className="flex items-start gap-3 p-3.5">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
          <Icon size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{toast.title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-foreground/60">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(removeToast(toast.id))}
          className="text-foreground/30 hover:text-foreground"
          aria-label="Dismiss notification"
        >
          <X size={15} />
        </button>
      </div>
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 5, ease: 'linear' }}
        style={{ originX: 0 }}
        className={`absolute inset-x-0 bottom-0 h-0.5 ${barClass}`}
      />
    </motion.div>
  );
};

const ToastHost = () => {
  const toasts = useSelector((state) => state.ui.toasts);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastHost;
