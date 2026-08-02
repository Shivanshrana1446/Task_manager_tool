import clsx from 'clsx';

const Skeleton = ({ className, ...props }) => (
  <div className={clsx('skeleton rounded-md', className)} {...props} />
);

export default Skeleton;
