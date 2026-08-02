import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Select from '../ui/Select';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { PROJECT_STATUSES, PRIORITIES } from '../../validation/projectSchemas';
import { PROJECT_STATUS_LABELS, PRIORITY_LABELS } from '../../utils/chartTheme';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt', label: 'Oldest first' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: '-name', label: 'Name (Z-A)' },
  { value: 'dueDate', label: 'Due date' },
];

const ProjectFilters = ({ filters, onChange }) => {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearch = useDebouncedValue(searchInput);

  useEffect(() => {
    if (debouncedSearch !== (filters.search || '')) {
      onChange({ ...filters, search: debouncedSearch, page: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const update = (patch) => onChange({ ...filters, ...patch, page: 1 });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 sm:max-w-xs">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
        />
        <input
          type="text"
          data-search-input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search projects..."
          className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          className="w-auto min-w-[9rem]"
          value={filters.status || ''}
          onChange={(event) => update({ status: event.target.value })}
        >
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {PROJECT_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>

        <Select
          className="w-auto min-w-[9rem]"
          value={filters.priority || ''}
          onChange={(event) => update({ priority: event.target.value })}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </Select>

        <Select
          className="w-auto min-w-[9rem]"
          value={filters.sort || '-createdAt'}
          onChange={(event) => update({ sort: event.target.value })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default ProjectFilters;
