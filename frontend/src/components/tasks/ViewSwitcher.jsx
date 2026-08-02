import { LayoutGrid, List, Table2 } from 'lucide-react';
import clsx from 'clsx';

const VIEWS = [
  { key: 'kanban', label: 'Board', icon: LayoutGrid },
  { key: 'list', label: 'List', icon: List },
  { key: 'table', label: 'Table', icon: Table2 },
];

const ViewSwitcher = ({ view, onChange }) => (
  <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
    {VIEWS.map(({ key, label, icon: Icon }) => (
      <button
        key={key}
        type="button"
        onClick={() => onChange(key)}
        className={clsx(
          'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          view === key
            ? 'bg-primary-600 text-white'
            : 'text-foreground/60 hover:bg-primary-50 dark:hover:bg-primary-950'
        )}
      >
        <Icon size={15} />
        {label}
      </button>
    ))}
  </div>
);

export default ViewSwitcher;
