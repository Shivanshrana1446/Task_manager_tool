import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { searchUsers, updateUserRole, updateUserStatus, deleteUser } from '../services/usersApi';

const LIST_KEY = ['admin', 'users'];

export const useAdminUsersList = (params) =>
  useQuery({
    queryKey: [...LIST_KEY, params],
    queryFn: () => searchUsers(params),
    placeholderData: (previous) => previous,
    staleTime: 30 * 1000,
  });

const patchUserInCaches = (queryClient, userId, updater) => {
  const previous = queryClient.getQueriesData({ queryKey: LIST_KEY });
  queryClient.setQueriesData({ queryKey: LIST_KEY }, (old) => {
    if (!old?.users) return old;
    return { ...old, users: old.users.map((user) => (user._id === userId ? updater(user) : user)) };
  });
  return previous;
};

const removeUserFromCaches = (queryClient, userId) => {
  const previous = queryClient.getQueriesData({ queryKey: LIST_KEY });
  queryClient.setQueriesData({ queryKey: LIST_KEY }, (old) => {
    if (!old?.users) return old;
    return {
      ...old,
      users: old.users.filter((user) => user._id !== userId),
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

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }) => updateUserRole(id, role),
    onMutate: async ({ id, role }) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY });
      const previous = patchUserInCaches(queryClient, id, (user) => ({ ...user, role }));
      return { previous };
    },
    onError: (err, vars, context) => rollback(queryClient, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }) => updateUserStatus(id, isActive),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY });
      const previous = patchUserInCaches(queryClient, id, (user) => ({ ...user, isActive }));
      return { previous };
    },
    onError: (err, vars, context) => rollback(queryClient, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY });
      const previous = removeUserFromCaches(queryClient, id);
      return { previous };
    },
    onError: (err, id, context) => rollback(queryClient, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
};
