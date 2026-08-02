import clsx from 'clsx';

const SIZES = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

const Avatar = ({ name, src, size = 'md', className }) => {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={clsx('shrink-0 rounded-full object-cover', SIZES[size], className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300',
        SIZES[size],
        className
      )}
    >
      {initial}
    </div>
  );
};

export default Avatar;
