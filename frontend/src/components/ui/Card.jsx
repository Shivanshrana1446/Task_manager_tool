import clsx from 'clsx';

const Card = ({ className, children, ...props }) => (
  <div
    className={clsx(
      'rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export default Card;
