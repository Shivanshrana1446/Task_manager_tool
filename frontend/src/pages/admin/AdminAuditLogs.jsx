import { useState } from 'react';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Pagination from '../../components/ui/Pagination';
import { useAuditLogsList } from '../../hooks/useAdmin';
import { formatRelativeTime } from '../../utils/formatters';

const ACTIONS = ['create', 'update', 'delete', 'restore', 'status_change', 'assign', 'login', 'logout', 'comment', 'upload'];
const ENTITY_TYPES = ['User', 'Project', 'Task', 'Comment', 'Attachment', 'Team'];

const ACTION_LABELS = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  restore: 'Restored',
  status_change: 'Status changed',
  assign: 'Assigned',
  login: 'Logged in',
  logout: 'Logged out',
  comment: 'Commented',
  upload: 'Uploaded',
};

const ACTION_VARIANTS = {
  create: 'success',
  restore: 'success',
  update: 'primary',
  assign: 'primary',
  status_change: 'warning',
  delete: 'danger',
  login: 'neutral',
  logout: 'neutral',
  comment: 'neutral',
  upload: 'neutral',
};

const DEFAULT_FILTERS = { page: 1, limit: 15, action: '', entityType: '', from: '', to: '', sort: '-createdAt' };

const AdminAuditLogs = () => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const queryParams = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined)
  );
  const { data, isLoading, isFetching } = useAuditLogsList(queryParams);

  const logs = data?.logs || [];
  const pagination = data?.pagination;

  const update = (patch) => setFilters((prev) => ({ ...prev, ...patch, page: 1 }));

  const columns = [
    {
      key: 'user',
      label: 'Actor',
      render: (log) =>
        log.user ? (
          <div className="flex items-center gap-2">
            <Avatar name={log.user.name} src={log.user.avatar?.url} size="sm" />
            <span className="truncate text-foreground/70">{log.user.name}</span>
          </div>
        ) : (
          <span className="text-foreground/40">System</span>
        ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (log) => <Badge variant={ACTION_VARIANTS[log.action] || 'neutral'}>{ACTION_LABELS[log.action] || log.action}</Badge>,
    },
    {
      key: 'entityType',
      label: 'Entity',
      render: (log) => (
        <span className="text-foreground/70">
          {log.entityType}
          <span className="ml-1.5 font-mono text-xs text-foreground/30">#{log.entityId?.slice(-6)}</span>
        </span>
      ),
    },
    {
      key: 'ipAddress',
      label: 'IP address',
      render: (log) => <span className="text-foreground/50">{log.ipAddress || '—'}</span>,
    },
    {
      key: 'createdAt',
      label: 'When',
      sortable: true,
      render: (log) => <span className="whitespace-nowrap text-foreground/60">{formatRelativeTime(log.createdAt)}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          className="w-auto min-w-[9rem]"
          value={filters.action}
          onChange={(event) => update({ action: event.target.value })}
        >
          <option value="">All actions</option>
          {ACTIONS.map((action) => (
            <option key={action} value={action}>
              {ACTION_LABELS[action]}
            </option>
          ))}
        </Select>

        <Select
          className="w-auto min-w-[9rem]"
          value={filters.entityType}
          onChange={(event) => update({ entityType: event.target.value })}
        >
          <option value="">All entities</option>
          {ENTITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>

        <label className="flex items-center gap-2 text-xs text-foreground/50">
          From
          <input
            type="date"
            value={filters.from}
            onChange={(event) => update({ from: event.target.value })}
            className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-foreground/50">
          To
          <input
            type="date"
            value={filters.to}
            onChange={(event) => update({ to: event.target.value })}
            className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
          />
        </label>
      </div>

      <div style={{ opacity: isFetching ? 0.6 : 1 }}>
        <Table columns={columns} data={logs} isLoading={isLoading} emptyMessage="No audit log entries found" />
      </div>

      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        />
      )}
    </div>
  );
};

export default AdminAuditLogs;
