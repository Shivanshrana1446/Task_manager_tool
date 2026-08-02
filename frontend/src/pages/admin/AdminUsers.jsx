import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { Search, Trash2 } from 'lucide-react';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  useAdminUsersList,
  useUpdateUserRole,
  useUpdateUserStatus,
  useDeleteUser,
} from '../../hooks/useAdminUsers';
import { formatShortDate } from '../../utils/formatters';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'team_member', label: 'Team Member' },
];

const DEFAULT_FILTERS = { page: 1, limit: 10, search: '', role: '', isActive: '', sort: 'name' };

const AdminUsers = () => {
  const currentUser = useSelector((state) => state.auth.user);
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    role: searchParams.get('role') || '',
  }));
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, user: null });

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters((prev) => ({ ...prev, search: debouncedSearch, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const queryParams = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined)
  );
  const { data, isLoading, isFetching } = useAdminUsersList(queryParams);
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const deleteMutation = useDeleteUser();

  const users = data?.users || [];
  const pagination = data?.pagination;

  const closeConfirm = () => setConfirmDialog({ isOpen: false, user: null });

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(confirmDialog.user._id);
    closeConfirm();
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={user.name} src={user.avatar?.url} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{user.name}</p>
            <p className="truncate text-xs text-foreground/40">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (user) => (
        <Select
          className="w-auto min-w-[10rem] py-1.5 text-xs"
          value={user.role}
          disabled={user._id === currentUser?._id}
          onChange={(event) => updateRole.mutate({ id: user._id, role: event.target.value })}
        >
          {ROLE_OPTIONS.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </Select>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (user) => (
        <button
          type="button"
          disabled={user._id === currentUser?._id}
          onClick={() => updateStatus.mutate({ id: user._id, isActive: !user.isActive })}
          aria-label={`Toggle status for ${user.name}`}
          className="disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Badge variant={user.isActive ? 'success' : 'danger'}>
            {user.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </button>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      sortable: true,
      render: (user) => <span className="text-foreground/60">{formatShortDate(user.createdAt)}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (user) => (
        <button
          type="button"
          disabled={user._id === currentUser?._id}
          onClick={() => setConfirmDialog({ isOpen: true, user })}
          aria-label={`Delete ${user.name}`}
          className="text-foreground/40 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Select
            className="w-auto min-w-[9rem]"
            value={filters.role}
            onChange={(event) => setFilters((prev) => ({ ...prev, role: event.target.value, page: 1 }))}
          >
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>
          <Select
            className="w-auto min-w-[9rem]"
            value={filters.isActive}
            onChange={(event) => setFilters((prev) => ({ ...prev, isActive: event.target.value, page: 1 }))}
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </div>
      </div>

      <div style={{ opacity: isFetching ? 0.6 : 1 }}>
        <Table
          columns={columns}
          data={users}
          isLoading={isLoading}
          emptyMessage="No users found"
        />
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

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirm}
        onConfirm={handleDelete}
        title="Delete user?"
        message={`"${confirmDialog.user?.name}" will be removed from the system. This can be undone by an admin.`}
        confirmLabel="Delete"
        tone="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdminUsers;
