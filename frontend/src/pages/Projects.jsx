import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, FolderKanban } from 'lucide-react';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import FloatingActionButton from '../components/ui/FloatingActionButton';
import Spinner from '../components/ui/Spinner';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ProjectFilters from '../components/projects/ProjectFilters';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectCardSkeleton from '../components/projects/ProjectCardSkeleton';
import ProjectFormModal from '../components/projects/ProjectFormModal';
import AssignManagerModal from '../components/projects/AssignManagerModal';
import AssignMembersModal from '../components/projects/AssignMembersModal';
import { useInfiniteProjectsList, useDeleteProject, useUpdateProject } from '../hooks/useProjects';
import { useInfiniteScrollSentinel } from '../hooks/useInfiniteScrollSentinel';

const DEFAULT_FILTERS = { search: '', status: '', priority: '', sort: '-createdAt' };

const Projects = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [formModal, setFormModal] = useState({ isOpen: false, project: null });
  const [managerModal, setManagerModal] = useState({ isOpen: false, project: null });
  const [membersModal, setMembersModal] = useState({ isOpen: false, project: null });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, mode: null, project: null });

  const openCreateModal = () => setFormModal({ isOpen: true, project: null });
  const openEditModal = (project) => setFormModal({ isOpen: true, project });
  const closeFormModal = () => setFormModal({ isOpen: false, project: null });

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreateModal();
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('new');
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const queryParams = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined)
  );
  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteProjectsList(queryParams);
  const deleteMutation = useDeleteProject();
  const updateMutation = useUpdateProject();

  const projects = data?.pages.flatMap((page) => page.projects) || [];

  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), {
    enabled: Boolean(hasNextPage) && !isFetchingNextPage,
  });

  const openAssignManager = (project) => setManagerModal({ isOpen: true, project });
  const closeAssignManager = () => setManagerModal({ isOpen: false, project: null });

  const openAssignMembers = (project) => setMembersModal({ isOpen: true, project });
  const closeAssignMembers = () => setMembersModal({ isOpen: false, project: null });

  const handleDelete = (project) => setConfirmDialog({ isOpen: true, mode: 'delete', project });

  const handleArchiveToggle = (project) => {
    if (project.status === 'archived') {
      updateMutation.mutate({ id: project._id, data: { status: 'active' } });
    } else {
      setConfirmDialog({ isOpen: true, mode: 'archive', project });
    }
  };

  const closeConfirmDialog = () => setConfirmDialog({ isOpen: false, mode: null, project: null });

  const handleConfirm = async () => {
    const { mode, project } = confirmDialog;
    if (mode === 'delete') {
      await deleteMutation.mutateAsync(project._id);
    } else if (mode === 'archive') {
      await updateMutation.mutateAsync({ id: project._id, data: { status: 'archived' } });
    }
    closeConfirmDialog();
  };

  const hasActiveFilters = Boolean(filters.search || filters.status || filters.priority);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-foreground/50">
            Create, organize, and track every project in one place.
          </p>
        </div>
        <Button className="hidden w-auto px-4 sm:inline-flex" onClick={openCreateModal}>
          <Plus size={16} />
          New project
        </Button>
      </div>

      <ProjectFilters filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProjectCardSkeleton key={index} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          message={
            hasActiveFilters
              ? 'Try adjusting your search or filters.'
              : 'Create your first project to get started.'
          }
          action={
            !hasActiveFilters && (
              <Button className="w-auto px-4" onClick={openCreateModal}>
                <Plus size={16} />
                New project
              </Button>
            )
          }
        />
      ) : (
        <>
          <motion.div
            layout
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            style={{ opacity: isFetching && !isFetchingNextPage ? 0.6 : 1 }}
          >
            <AnimatePresence mode="popLayout">
              {projects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  onArchiveToggle={handleArchiveToggle}
                  onAssignManager={openAssignManager}
                  onAssignMembers={openAssignMembers}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          <div ref={sentinelRef} className="flex justify-center py-4">
            {isFetchingNextPage && <Spinner size={20} />}
          </div>
        </>
      )}

      <FloatingActionButton onClick={openCreateModal} label="Create project" icon={Plus} />

      <ProjectFormModal isOpen={formModal.isOpen} onClose={closeFormModal} project={formModal.project} />
      <AssignManagerModal
        isOpen={managerModal.isOpen}
        onClose={closeAssignManager}
        project={managerModal.project}
      />
      <AssignMembersModal
        isOpen={membersModal.isOpen}
        onClose={closeAssignMembers}
        project={membersModal.project}
      />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirm}
        title={confirmDialog.mode === 'delete' ? 'Delete project?' : 'Archive project?'}
        message={
          confirmDialog.mode === 'delete'
            ? `"${confirmDialog.project?.name}" will be moved to trash. This can be undone by an admin.`
            : `"${confirmDialog.project?.name}" will be archived and hidden from active views.`
        }
        confirmLabel={confirmDialog.mode === 'delete' ? 'Delete' : 'Archive'}
        tone={confirmDialog.mode === 'delete' ? 'danger' : 'warning'}
        isLoading={deleteMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default Projects;
