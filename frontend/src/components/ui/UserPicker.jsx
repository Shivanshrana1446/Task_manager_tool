import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { searchUsers } from '../../services/usersApi';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import Avatar from './Avatar';
import Spinner from './Spinner';

const UserPicker = ({
  label,
  multiple = false,
  value,
  onChange,
  excludeIds = [],
  placeholder = 'Search people...',
  options: fixedOptions,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const debouncedQuery = useDebouncedValue(query);

  const { data, isFetching } = useQuery({
    queryKey: ['users', 'search', debouncedQuery],
    queryFn: () => searchUsers({ search: debouncedQuery, limit: 8 }),
    staleTime: 30 * 1000,
    enabled: !fixedOptions,
  });

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const selected = multiple ? value || [] : value ? [value] : [];
  const selectedIds = new Set(selected.map((user) => user._id));

  const candidates = fixedOptions
    ? fixedOptions.filter((user) => user.name.toLowerCase().includes(query.trim().toLowerCase()))
    : data?.users || [];
  const options = candidates.filter(
    (user) => !excludeIds.includes(user._id) && !(multiple && selectedIds.has(user._id))
  );
  const isFetchingOptions = fixedOptions ? false : isFetching;

  const handleSelect = (user) => {
    if (multiple) {
      onChange([...(value || []), user]);
      setQuery('');
    } else {
      onChange(user);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleRemove = (userId) => {
    onChange(multiple ? (value || []).filter((user) => user._id !== userId) : null);
  };

  return (
    <div className="w-full" ref={containerRef}>
      {label && <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>}

      {!multiple && value ? (
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
          <div className="flex items-center gap-2">
            <Avatar name={value.name} src={value.avatar?.url} size="sm" />
            <span className="text-sm text-foreground">{value.name}</span>
          </div>
          <button
            type="button"
            onClick={() => handleRemove(value._id)}
            className="text-foreground/40 hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
          />
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
          />

          {isOpen && (
            <div className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-surface py-1.5 shadow-xl">
              {isFetchingOptions ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner size={16} />
                </div>
              ) : options.length === 0 ? (
                <p className="px-3.5 py-2 text-sm text-foreground/40">No users found</p>
              ) : (
                options.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => handleSelect(user)}
                    className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-foreground/80 hover:bg-primary-50 dark:hover:bg-primary-950"
                  >
                    <Avatar name={user.name} src={user.avatar?.url} size="sm" />
                    <span className="flex-1 truncate">{user.name}</span>
                    <span className="truncate text-xs text-foreground/40">{user.email}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {multiple && selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((user) => (
            <span
              key={user._id}
              className="flex items-center gap-1.5 rounded-full bg-primary-50 py-1 pl-1 pr-2 text-xs text-primary-700 dark:bg-primary-950 dark:text-primary-300"
            >
              <Avatar name={user.name} src={user.avatar?.url} size="sm" className="h-5 w-5 text-[9px]" />
              {user.name}
              <button
                type="button"
                onClick={() => handleRemove(user._id)}
                className="text-primary-500 hover:text-primary-700"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserPicker;
