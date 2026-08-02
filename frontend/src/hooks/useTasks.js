import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTaskHistory,
  bulkUpdateTaskStatus,
  bulkDeleteTasks,
} from '../services/tasksApi';
import { DASHBOARD_SUMMARY_KEY } from './useDashboardSummary';
import { store } from '../redux/store';
import { addToast } from '../redux/slices/uiSlice';

// Optimistic task mutations roll back silently on failure — without this, a
// permission-denied edit just reverts a moment later with no explanation,
// which reads exactly like "the button doesn't work" rather than "denied."
const notifyIfForbidden = (error) => {
  if (error?.response?.status === 403) {
    store.dispatch(
      addToast({
        title: 'Action not allowed',
        message: error.response?.data?.message || "You don't have permission to do that.",
        tone: 'error',
      })
    );
  }
};

const LIST_KEY = ['tasks', 'list'];

export const useTasksList = (params, options = {}) =>
  useQuery({
    queryKey: [...LIST_KEY, params],
    queryFn: () => listTasks(params),
    enabled: options.enabled ?? true,
    placeholderData: (previous) => previous,
    staleTime: 15 * 1000,
  });

export const useTask = (id) =>
  useQuery({
    queryKey: ['tasks', 'detail', id],
    queryFn: () => getTask(id),
    enabled: Boolean(id),
  });

export const useTaskHistory = (id) =>
  useQuery({
    queryKey: ['tasks', 'history', id],
    queryFn: () => getTaskHistory(id),
    enabled: Boolean(id),
  });

const patchTaskInCaches = (queryClient, taskId, updater) => {
  const previous = queryClient.getQueriesData({ queryKey: LIST_KEY });
  queryClient.setQueriesData({ queryKey: LIST_KEY }, (old) => {
    if (!old?.tasks) return old;
    return {
      ...old,
      tasks: old.tasks.map((task) => (task._id === taskId ? updater(task) : task)),
    };
  });
  queryClient.setQueryData(['tasks', 'detail', taskId], (old) => (old ? updater(old) : old));
  return previous;
};

const removeTaskFromCaches = (queryClient, taskId) => {
  const previous = queryClient.getQueriesData({ queryKey: LIST_KEY });
  queryClient.setQueriesData({ queryKey: LIST_KEY }, (old) => {
    if (!old?.tasks) return old;
    return {
      ...old,
      tasks: old.tasks.filter((task) => task._id !== taskId),
      pagination: old.pagination
        ? { ...old.pagination, total: Math.max(old.pagination.total - 1, 0) }
        : old.pagination,
    };
  });
  return previous;
};

const rollback = (queryClient, previous) => {
  previous?.forEach(([key, value]) => queryClient.setQueryData(key, value));
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateTask(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY });
      const previous = patchTaskInCaches(queryClient, id, (task) => ({ ...task, ...data }));
      return { previous };
    },
    onError: (err, vars, context) => {
      rollback(queryClient, context?.previous);
      notifyIfForbidden(err);
    },
    onSettled: (data, error, vars) => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', vars.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'history', vars.id] });
      // Status/assignee changes shift pending/completed counts, task-status chart,
      // and per-project progress — all derived from the dashboard summary.
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY });
      const previous = removeTaskFromCaches(queryClient, id);
      return { previous };
    },
    onError: (err, id, context) => {
      rollback(queryClient, context?.previous);
      notifyIfForbidden(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
    },
  });
};

export const useBulkUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }) => bulkUpdateTaskStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
    },
    onError: notifyIfForbidden,
  });
};

export const useBulkDeleteTasks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids) => bulkDeleteTasks(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
    },
    onError: notifyIfForbidden,
  });
};
