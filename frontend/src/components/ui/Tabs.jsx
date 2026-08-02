import clsx from 'clsx';

const Tabs = ({ tabs, value, onChange, className }) => (
  <div className={clsx('flex gap-1 rounded-lg border border-border bg-surface p-1', className)}>
    {tabs.map((tab) => (
      <button
        key={tab.value}
        type="button"
        onClick={() => onChange(tab.value)}
        className={clsx(
          'flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          value === tab.value
            ? 'bg-primary-600 text-white'
            : 'text-foreground/60 hover:text-foreground'
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default Tabs;
