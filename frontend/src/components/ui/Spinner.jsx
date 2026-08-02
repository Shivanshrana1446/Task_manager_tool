import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

const Spinner = ({ size = 20, className }) => (
  <Loader2 size={size} className={clsx('animate-spin', className)} aria-label="Loading" />
);

export default Spinner;
