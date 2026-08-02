import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowLeft, Plus } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import Spinner from '../components/ui/Spinner';
import Avatar from '../components/ui/Avatar';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import StatusBadge from '../components/projects/StatusBadge';
import ProjectProgressBar from '../components/projects/ProjectProgressBar';
import ViewSwitcher from '../components/tasks/ViewSwitcher';
import TaskFilters from '../components/tasks/TaskFilters';
import TaskStatsRow from '../components/tasks/TaskStatsRow';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskListView from '../components/tasks/TaskListView';
import TaskTableView from '../components/tasks/TaskTableView';
import BulkActionsBar from '../components/tasks/BulkActionsBar';
import TaskFormModal from '../components/tasks/TaskFormModal';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import { useProject } from '../hooks/useProjects';
import { useTasksList, useDeleteTask, useBulkUpdateTaskStatus, useBulkDeleteTasks } from '../hooks/useTasks';
import { addToast } from '../redux/slices/uiSlice';

const DEFAULT_FILTERS = { page: 1, limit: 10, search: '', status: '', priority: '', assignee: '', sort: '-createdAt' };

const ProjectDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const [view, setView] = useState('kanban');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: project, isLoading: isProjectLoading } = useProject(id);
  const deleteMutation = useDeleteTask();
  const bulkUpdateMutation = useBulkUpdateTaskStatus();
  const bulkDeleteMutation = useBulkDeleteTasks();

  const projectMembers = useMemo(() => {
    if (!project) return [];
    const members = project.members || [];
    return project.owner ? [project.owner, ...members] : members;
  }, [project]);

  const kanbanParams = { project: id, limit: 100 };
  const pagedParams = Object.fromEntries(
    Object.entries({ ...filters, project: id }).filter(
      ([, value]) => value !== '' && value !== undefined
    )
  );

  const kanbanQuery = useTasksList(kanbanParams, { enabled: view === 'kanban' });
  const pagedQuery = useTasksList(pagedParams, { enabled: view !== 'kanban' });

  const isKanban = view === 'kanban';
  const activeQuery = isKanban ? kanbanQuery : pagedQuery;
  const tasks = activeQuery.data?.tasks || [];
  const pagination = activeQuery.data?.pagination;

  const selectedTask = tasks.find((task) => task._id === selectedTaskId) || null;

  const toggleSelect = (taskId) =>
    setSelectedIds((prev) =>
      prev.includes(taskId) ? prev.filter((existing) => existing !== taskId) : [...prev, taskId]
    );

  const toggleSelectAll = () => {
    const allSelected = tasks.length > 0 && tasks.every((task) => selectedIds.includes(task._id));
    setSelectedIds(allSelected ? [] : tasks.map((task) => task._id));
  };

  const handleBulkUpdateStatus = (status) => {
    bulkUpdateMutation.mutate(
      { ids: selectedIds, status },
      {
        onSuccess: (result) => {
          setSelectedIds([]);
          dispatch(
            addToast({
              title: 'Tasks updated',
              message:
                result.skippedCount > 0
                  ? `${result.updatedCount} updated, ${result.skippedCount} skipped (no permission).`
                  : `${result.updatedCount} task(s) updated.`,
            })
          );
        },
      }
    );
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedIds, {
      onSuccess: (result) => {
        setSelectedIds([]);
        dispatch(
          addToast({
            title: 'Tasks deleted',
            message:
              result.skippedCount > 0
                ? `${result.deletedCount} deleted, ${result.skippedCount} skipped (no permission).`
                : `${result.deletedCount} task(s) deleted.`,
          })
        );
      },
    });
  };

  const handleConfirmDelete = async () => {
    await deleteMutation.mutateAsync(deletingTask._id);
    setDeletingTask(null);
  };

  if (isProjectLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <Link
          to="/projects"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground"
        >
          <ArrowLeft size={14} />
          All projects
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            {project.description && (
              <p className="mt-1 max-w-2xl text-sm text-foreground/50">{project.description}</p>
            )}
            <div className="mt-3 flex items-center gap-2 text-sm text-foreground/60">
              <Avatar name={project.owner?.name} src={project.owner?.avatar?.url} size="sm" />
              <span>{project.owner?.name}</span>
              {project.members?.length > 0 && (
                <div className="ml-2 flex -space-x-1.5">
                  {project.members.slice(0, 5).map((member) => (
                    <div key={member._id} className="rounded-full ring-2 ring-background">
                      <Avatar name={member.name} src={member.avatar?.url} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-full max-w-xs">
            <ProjectProgressBar
              progress={project.taskStats?.progress ?? 0}
              completed={project.taskStats?.completed ?? 0}
              total={project.taskStats?.total ?? 0}
            />
          </div>
        </div>
      </div>

      <TaskStatsRow taskStats={project.taskStats} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ViewSwitcher view={view} onChange={setView} />
        <Button className="w-auto px-4" onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} />
          New task
        </Button>
      </div>

      <TaskFilters filters={filters} onChange={setFilters} currentUserId={currentUser?._id} />

      <AnimatePresence>
        {!isKanban && selectedIds.length > 0 && (
          <BulkActionsBar
            count={selectedIds.length}
            onClear={() => setSelectedIds([])}
            onUpdateStatus={handleBulkUpdateStatus}
            onDelete={handleBulkDelete}
            isUpdating={bulkUpdateMutation.isPending}
            isDeleting={bulkDeleteMutation.isPending}
          />
        )}
      </AnimatePresence>

      {activeQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size={24} />
        </div>
      ) : isKanban ? (
        <KanbanBoard tasks={tasks} onTaskClick={(task) => setSelectedTaskId(task._id)} />
      ) : view === 'list' ? (
        <TaskListView tasks={tasks} onTaskClick={(task) => setSelectedTaskId(task._id)} />
      ) : (
        <TaskTableView
          tasks={tasks}
          onTaskClick={(task) => setSelectedTaskId(task._id)}
          sort={filters.sort}
          onSortChange={(sort) => setFilters((prev) => ({ ...prev, sort, page: 1 }))}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onEditTask={setEditingTask}
          onDeleteTask={setDeletingTask}
        />
      )}

      {!isKanban && pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        />
      )}

      <TaskFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        projectId={id}
        projectMembers={projectMembers}
      />

      <TaskFormModal
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        projectId={id}
        projectMembers={projectMembers}
      />

      <TaskDetailModal
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTaskId(null)}
        task={selectedTask}
        projectMembers={projectMembers}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingTask)}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleConfirmDelete}
        title="Delete task?"
        message={deletingTask ? `"${deletingTask.title}" will be moved to trash.` : ''}
        confirmLabel="Delete"
        tone="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ProjectDetail;
