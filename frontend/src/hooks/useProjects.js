import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addProjectMembers,
  removeProjectMember,
  assignProjectManager,
} from '../services/projectsApi';
import { DASHBOARD_SUMMARY_KEY } from './useDashboardSummary';

const LIST_KEY = ['projects', 'list'];

export const useProjectsList = (params) =>
  useQuery({
    queryKey: [...LIST_KEY, params],
    queryFn: () => listProjects(params),
    placeholderData: (previous) => previous,
    staleTime: 30 * 1000,
  });

export const useInfiniteProjectsList = (params) =>
  useInfiniteQuery({
    queryKey: [...LIST_KEY, 'infinite', params],
    queryFn: ({ pageParam }) => listProjects({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined,
    staleTime: 30 * 1000,
  });

export const useProject = (id) =>
  useQuery({
    queryKey: ['projects', 'detail', id],
    queryFn: () => getProject(id),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });

const patchProjectInCaches = (queryClient, projectId, updater) => {
  const previous = queryClient.getQueriesData({ queryKey: LIST_KEY });
  queryClient.setQueriesData({ queryKey: LIST_KEY }, (old) => {
    if (!old?.projects) return old;
    return {
      ...old,
      projects: old.projects.map((project) =>
        project._id === projectId ? updater(project) : project
      ),
    };
  });
  return previous;
};

const removeProjectFromCaches = (queryClient, projectId) => {
  const previous = queryClient.getQueriesData({ queryKey: LIST_KEY });
  queryClient.setQueriesData({ queryKey: LIST_KEY }, (old) => {
    if (!old?.projects) return old;
    return {
      ...old,
      projects: old.projects.filter((project) => project._id !== projectId),
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

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.auth.user);

  return useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      const optimisticProject = {
        ...project,
        owner: project.owner?.name ? project.owner : currentUser,
        members: project.members || [],
        taskStats: project.taskStats || { total: 0, completed: 0, progress: 0 },
      };

      queryClient.setQueriesData({ queryKey: LIST_KEY }, (old) => {
        if (!old?.projects) return old;
        return {
          ...old,
          projects: [optimisticProject, ...old.projects],
          pagination: old.pagination
            ? { ...old.pagination, total: old.pagination.total + 1 }
            : old.pagination,
        };
      });
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateProject(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY });
      const previous = patchProjectInCaches(queryClient, id, (project) => ({
        ...project,
        ...data,
      }));
      return { previous };
    },
    onError: (err, vars, context) => rollback(queryClient, context?.previous),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      // Status changes (e.g. archiving) shift the dashboard's active/completed
      // project counts and its "project progress" chart.
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY });
      const previous = removeProjectFromCaches(queryClient, id);
      return { previous };
    },
    onError: (err, id, context) => rollback(queryClient, context?.previous),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
    },
  });
};

// `members` is an array of full user objects ({_id, name, avatar}) sourced from
// the picker's own search results, so the optimistic patch renders correctly
// even though the mutation response itself only returns member IDs.
export const useAddProjectMembers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, members }) => addProjectMembers(id, members.map((m) => m._id)),
    onMutate: async ({ id, members }) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY });
      const previous = patchProjectInCaches(queryClient, id, (project) => {
        const existingIds = new Set(project.members.map((m) => m._id));
        const toAdd = members.filter((m) => !existingIds.has(m._id));
        return { ...project, members: [...project.members, ...toAdd] };
      });
      return { previous };
    },
    onError: (err, vars, context) => rollback(queryClient, context?.previous),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      // Membership changes shift who this project counts toward on the dashboard.
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
    },
  });
};

export const useRemoveProjectMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }) => removeProjectMember(id, userId),
    onMutate: async ({ id, userId }) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY });
      const previous = patchProjectInCaches(queryClient, id, (project) => ({
        ...project,
        members: project.members.filter((m) => m._id !== userId),
      }));
      return { previous };
    },
    onError: (err, vars, context) => rollback(queryClient, context?.previous),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      // Membership changes shift who this project counts toward on the dashboard.
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
    },
  });
};

// `manager` is the full user object selected in the picker, for the same reason
// as useAddProjectMembers above.
export const useAssignProjectManager = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, manager }) => assignProjectManager(id, manager._id),
    onMutate: async ({ id, manager }) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY });
      const previous = patchProjectInCaches(queryClient, id, (project) => {
        const previousOwner = project.owner;
        const membersWithoutNewOwner = project.members.filter((m) => m._id !== manager._id);
        const membersWithPreviousOwner = membersWithoutNewOwner.some(
          (m) => m._id === previousOwner._id
        )
          ? membersWithoutNewOwner
          : [...membersWithoutNewOwner, previousOwner];

        return { ...project, owner: manager, members: membersWithPreviousOwner };
      });
      return { previous };
    },
    onError: (err, vars, context) => rollback(queryClient, context?.previous),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      // Membership changes shift who this project counts toward on the dashboard.
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
    },
  });
};
