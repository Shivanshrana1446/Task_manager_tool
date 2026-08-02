import clsx from 'clsx';
import { ArrowUpDown, Inbox } from 'lucide-react';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';

const Table = ({
  columns,
  data,
  keyField = '_id',
  sort,
  onSortChange,
  onRowClick,
  isLoading = false,
  skeletonRows = 6,
  emptyMessage = 'No records found',
  emptyIcon = Inbox,
}) => {
  const toggleSort = (key) => {
    if (!onSortChange) return;
    onSortChange(sort === key ? `-${key}` : key);
  };

  return (
    <div className="max-h-[70vh] overflow-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-surface">
          <tr className="border-b border-border text-xs uppercase tracking-wide text-foreground/40">
            {columns.map((col) => (
              <th key={col.key} className={clsx('whitespace-nowrap px-4 py-3 font-medium', col.headerClassName)}>
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    {col.label}
                    <ArrowUpDown size={12} />
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {isLoading
            ? Array.from({ length: skeletonRows }).map((_, index) => (
                <tr key={index}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-[10rem]" />
                    </td>
                  ))}
                </tr>
              ))
            : data.map((row) => (
                <tr
                  key={row[keyField]}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={clsx(
                    'transition-colors hover:bg-primary-50 dark:hover:bg-primary-950',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={clsx('px-4 py-3', col.className)}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {!isLoading && data.length === 0 && (
        <EmptyState icon={emptyIcon} title={emptyMessage} className="rounded-none border-none" />
      )}
    </div>
  );
};

export default Table;
