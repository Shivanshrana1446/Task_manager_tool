import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import Spinner from './Spinner';

const VARIANTS = {
  primary:
    'bg-primary-600 text-white shadow-soft hover:bg-primary-700 hover:shadow-elevated focus-visible:ring-primary-500 disabled:bg-primary-400 disabled:shadow-none',
  secondary:
    'bg-surface text-foreground border border-border hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950 focus-visible:ring-primary-500',
  ghost: 'bg-transparent text-foreground hover:bg-surface focus-visible:ring-primary-500',
  danger: 'bg-red-600 text-white shadow-soft hover:bg-red-700 hover:shadow-elevated focus-visible:ring-red-500 disabled:bg-red-400 disabled:shadow-none',
};

const Button = forwardRef(
  (
    { className, variant = 'primary', isLoading = false, disabled, children, ...props },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        disabled={disabled || isLoading}
        className={clsx(
          'inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-[background-color,box-shadow,border-color,color]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed',
          VARIANTS[variant],
          className
        )}
        {...props}
      >
        {isLoading && <Spinner size={16} />}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
