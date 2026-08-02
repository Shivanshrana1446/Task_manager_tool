import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMembers,
  removeTeamMember,
  assignTeamLead,
} from '../services/teamsApi';

const LIST_KEY = ['admin', 'teams'];

export const useTeamsList = (params) =>
  useQuery({
    queryKey: [...LIST_KEY, params],
    queryFn: () => listTeams(params),
    placeholderData: (previous) => previous,
    staleTime: 30 * 1000,
  });

const patchTeamInCaches = (queryClient, teamId, updater) => {
  const previous = queryClient.getQueriesData({ queryKey: LIST_KEY });
  queryClient.setQueriesData({ queryKey: LIST_KEY }, (old) => {
    if (!old?.teams) return old;
    return { ...old, teams: old.teams.map((team) => (team._id === teamId ? updater(team) : team)) };
  });
  return previous;
};

const removeTeamFromCaches = (queryClient, teamId) => {
  const previous = queryClient.getQueriesData({ queryKey: LIST_KEY });
  queryClient.setQueriesData({ queryKey: LIST_KEY }, (old) => {
    if (!old?.teams) return old;
    return {
      ...old,
      teams: old.teams.filter((team) => team._id !== teamId),
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

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTeam,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateTeam(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY });
      const previous = patchTeamInCaches(queryClient, id, (team) => ({ ...team, ...data }));
      return { previous };
    },
    onError: (err, vars, context) => rollback(queryClient, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTeam,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY });
      const previous = removeTeamFromCaches(queryClient, id);
      return { previous };
    },
    onError: (err, id, context) => rollback(queryClient, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
};

// `members` is an array of full user objects ({_id, name, avatar}) sourced from
// the picker's own search results, so the optimistic patch renders correctly
// even though the mutation response itself only returns member IDs.
export const useAddTeamMembers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, members }) => addTeamMembers(id, members.map((m) => m._id)),
    onMutate: async ({ id, members }) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY });
      const previous = patchTeamInCaches(queryClient, id, (team) => {
        const existingIds = new Set(team.members.map((m) => m._id));
        const toAdd = members.filter((m) => !existingIds.has(m._id));
        return { ...team, members: [...team.members, ...toAdd] };
      });
      return { previous };
    },
    onError: (err, vars, context) => rollback(queryClient, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
};

export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }) => removeTeamMember(id, userId),
    onMutate: async ({ id, userId }) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY });
      const previous = patchTeamInCaches(queryClient, id, (team) => ({
        ...team,
        members: team.members.filter((m) => m._id !== userId),
      }));
      return { previous };
    },
    onError: (err, vars, context) => rollback(queryClient, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
};

// `lead` is the full user object selected in the picker, for the same reason as above.
export const useAssignTeamLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, lead }) => assignTeamLead(id, lead._id),
    onMutate: async ({ id, lead }) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY });
      const previous = patchTeamInCaches(queryClient, id, (team) => {
        const previousLead = team.lead;
        const membersWithoutNewLead = team.members.filter((m) => m._id !== lead._id);
        const membersWithPreviousLead = membersWithoutNewLead.some((m) => m._id === previousLead._id)
          ? membersWithoutNewLead
          : [...membersWithoutNewLead, previousLead];

        return { ...team, lead, members: membersWithPreviousLead };
      });
      return { previous };
    },
    onError: (err, vars, context) => rollback(queryClient, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
};
