import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2 } from 'lucide-react';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Avatar from '../../components/ui/Avatar';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusBadge from '../../components/projects/StatusBadge';
import PriorityBadge from '../../components/projects/PriorityBadge';
import ProjectProgressBar from '../../components/projects/ProjectProgressBar';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useProjectsList, useDeleteProject } from '../../hooks/useProjects';
import { PROJECT_STATUSES, PRIORITIES } from '../../validation/projectSchemas';
import { PROJECT_STATUS_LABELS, PRIORITY_LABELS } from '../../utils/chartTheme';
import { formatShortDate } from '../../utils/formatters';

const DEFAULT_FILTERS = {
  page: 1,
  limit: 10,
  search: '',
  status: '',
  priority: '',
  sort: '-createdAt',
};

const AdminProjects = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, project: null });

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters((prev) => ({ ...prev, search: debouncedSearch, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const queryParams = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined)
  );
  const { data, isLoading, isFetching } = useProjectsList(queryParams);
  const deleteMutation = useDeleteProject();

  const projects = data?.projects || [];
  const pagination = data?.pagination;

  const closeConfirm = () => setConfirmDialog({ isOpen: false, project: null });

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(confirmDialog.project._id);
    closeConfirm();
  };

  const columns = [
    {
      key: 'name',
      label: 'Project',
      sortable: true,
      render: (project) => (
        <div className="min-w-0 max-w-xs">
          <p className="truncate font-medium text-foreground">{project.name}</p>
          <p className="truncate text-xs text-foreground/40">{project.description || 'No description'}</p>
        </div>
      ),
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (project) => (
        <div className="flex items-center gap-2">
          <Avatar name={project.owner?.name} src={project.owner?.avatar?.url} size="sm" />
          <span className="truncate text-foreground/70">{project.owner?.name}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (project) => <StatusBadge status={project.status} />,
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (project) => <PriorityBadge priority={project.priority} />,
    },
    {
      key: 'progress',
      label: 'Progress',
      className: 'min-w-[10rem]',
      render: (project) => (
        <ProjectProgressBar
          progress={project.taskStats?.progress || 0}
          completed={project.taskStats?.completed || 0}
          total={project.taskStats?.total || 0}
        />
      ),
    },
    {
      key: 'members',
      label: 'Members',
      render: (project) => (
        <div className="flex -space-x-1.5">
          {(project.members || []).slice(0, 3).map((member) => (
            <div key={member._id} className="rounded-full ring-2 ring-surface">
              <Avatar name={member.name} src={member.avatar?.url} size="sm" />
            </div>
          ))}
          {(!project.members || project.members.length === 0) && (
            <span className="text-foreground/30">—</span>
          )}
        </div>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due date',
      sortable: true,
      render: (project) => (
        <span className="whitespace-nowrap text-foreground/60">
          {project.dueDate ? formatShortDate(project.dueDate) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (project) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setConfirmDialog({ isOpen: true, project });
          }}
          aria-label={`Delete ${project.name}`}
          className="text-foreground/40 transition-colors hover:text-red-500"
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
            placeholder="Search projects..."
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Select
            className="w-auto min-w-[9rem]"
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value, page: 1 }))}
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
            value={filters.priority}
            onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value, page: 1 }))}
          >
            <option value="">All priorities</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div style={{ opacity: isFetching ? 0.6 : 1 }}>
        <Table
          columns={columns}
          data={projects}
          isLoading={isLoading}
          onRowClick={(project) => navigate(`/projects/${project._id}`)}
          emptyMessage="No projects found"
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
        title="Delete project?"
        message={`"${confirmDialog.project?.name}" will be moved to trash. This can be undone by an admin.`}
        confirmLabel="Delete"
        tone="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdminProjects;
