import { useEffect, useState } from 'react';
import { Plus, Pencil, UserCog, Users as UsersIcon, Trash2, Search } from 'lucide-react';
import Table from '../../components/ui/Table';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import TeamFormModal from '../../components/admin/TeamFormModal';
import AssignTeamLeadModal from '../../components/admin/AssignTeamLeadModal';
import TeamMembersModal from '../../components/admin/TeamMembersModal';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useTeamsList, useDeleteTeam } from '../../hooks/useTeams';
import { formatShortDate } from '../../utils/formatters';

const DEFAULT_FILTERS = { page: 1, limit: 10, search: '', sort: '-createdAt' };

const AdminTeams = () => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput);
  const [formModal, setFormModal] = useState({ isOpen: false, team: null });
  const [leadModal, setLeadModal] = useState({ isOpen: false, team: null });
  const [membersModal, setMembersModal] = useState({ isOpen: false, team: null });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, team: null });

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters((prev) => ({ ...prev, search: debouncedSearch, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const queryParams = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined)
  );
  const { data, isLoading, isFetching } = useTeamsList(queryParams);
  const deleteMutation = useDeleteTeam();

  const teams = data?.teams || [];
  const pagination = data?.pagination;

  const openCreate = () => setFormModal({ isOpen: true, team: null });
  const openEdit = (team) => setFormModal({ isOpen: true, team });
  const closeForm = () => setFormModal({ isOpen: false, team: null });

  const openLead = (team) => setLeadModal({ isOpen: true, team });
  const closeLead = () => setLeadModal({ isOpen: false, team: null });

  const openMembers = (team) => setMembersModal({ isOpen: true, team });
  const closeMembers = () => setMembersModal({ isOpen: false, team: null });

  const closeConfirm = () => setConfirmDialog({ isOpen: false, team: null });

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(confirmDialog.team._id);
    closeConfirm();
  };

  const columns = [
    {
      key: 'name',
      label: 'Team',
      sortable: true,
      render: (team) => (
        <div className="min-w-0 max-w-xs">
          <p className="truncate font-medium text-foreground">{team.name}</p>
          <p className="truncate text-xs text-foreground/40">{team.description || 'No description'}</p>
        </div>
      ),
    },
    {
      key: 'lead',
      label: 'Lead',
      render: (team) => (
        <div className="flex items-center gap-2">
          <Avatar name={team.lead?.name} src={team.lead?.avatar?.url} size="sm" />
          <span className="truncate text-foreground/70">{team.lead?.name}</span>
        </div>
      ),
    },
    {
      key: 'members',
      label: 'Members',
      render: (team) => (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {team.members.slice(0, 3).map((member) => (
              <div key={member._id} className="rounded-full ring-2 ring-surface">
                <Avatar name={member.name} src={member.avatar?.url} size="sm" />
              </div>
            ))}
          </div>
          <span className="text-xs text-foreground/40">{team.members.length}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (team) => <span className="text-foreground/60">{formatShortDate(team.createdAt)}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (team) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => openLead(team)}
            aria-label={`Assign lead for ${team.name}`}
            className="rounded-lg p-1.5 text-foreground/40 transition-colors hover:bg-primary-50 hover:text-foreground dark:hover:bg-primary-950"
          >
            <UserCog size={15} />
          </button>
          <button
            type="button"
            onClick={() => openMembers(team)}
            aria-label={`Manage members for ${team.name}`}
            className="rounded-lg p-1.5 text-foreground/40 transition-colors hover:bg-primary-50 hover:text-foreground dark:hover:bg-primary-950"
          >
            <UsersIcon size={15} />
          </button>
          <button
            type="button"
            onClick={() => openEdit(team)}
            aria-label={`Edit ${team.name}`}
            className="rounded-lg p-1.5 text-foreground/40 transition-colors hover:bg-primary-50 hover:text-foreground dark:hover:bg-primary-950"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDialog({ isOpen: true, team })}
            aria-label={`Delete ${team.name}`}
            className="rounded-lg p-1.5 text-foreground/40 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
          >
            <Trash2 size={15} />
          </button>
        </div>
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
            placeholder="Search teams..."
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
          />
        </div>
        <Button className="w-auto px-4" onClick={openCreate}>
          <Plus size={16} />
          New team
        </Button>
      </div>

      <div style={{ opacity: isFetching ? 0.6 : 1 }}>
        <Table columns={columns} data={teams} isLoading={isLoading} emptyMessage="No teams found" />
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

      <TeamFormModal isOpen={formModal.isOpen} onClose={closeForm} team={formModal.team} />
      <AssignTeamLeadModal isOpen={leadModal.isOpen} onClose={closeLead} team={leadModal.team} />
      <TeamMembersModal isOpen={membersModal.isOpen} onClose={closeMembers} team={membersModal.team} />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirm}
        onConfirm={handleDelete}
        title="Delete team?"
        message={`"${confirmDialog.team?.name}" will be moved to trash. This can be undone by an admin.`}
        confirmLabel="Delete"
        tone="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdminTeams;
