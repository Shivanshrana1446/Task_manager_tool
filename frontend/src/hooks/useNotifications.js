import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../services/notificationsApi';

export const NOTIFICATIONS_LIST_KEY = ['notifications', 'list'];
export const UNREAD_COUNT_KEY = ['notifications', 'unread-count'];

export const useNotificationsList = (params) =>
  useQuery({
    queryKey: [...NOTIFICATIONS_LIST_KEY, params],
    queryFn: () => listNotifications(params),
    placeholderData: (previous) => previous,
    staleTime: 15 * 1000,
  });

export const useInfiniteNotificationsList = (params) =>
  useInfiniteQuery({
    queryKey: [...NOTIFICATIONS_LIST_KEY, 'infinite', params],
    queryFn: ({ pageParam }) => listNotifications({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined,
    staleTime: 15 * 1000,
  });

export const useUnreadCount = () =>
  useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: getUnreadCount,
    staleTime: 15 * 1000,
  });

// Cached notification lists come in two shapes: the flat `{ notifications, pagination }`
// used by the bell dropdown (useNotificationsList), and the paginated `{ pages: [...] }`
// shape from useInfiniteNotificationsList (the history page). These helpers patch
// whichever shape is present so mutations/socket events stay in sync with both.
export const mapNotificationsCache = (old, mapNotification) => {
  if (!old) return old;
  if (old.notifications) {
    return { ...old, notifications: old.notifications.map(mapNotification) };
  }
  if (old.pages) {
    return {
      ...old,
      pages: old.pages.map((page) => ({ ...page, notifications: page.notifications.map(mapNotification) })),
    };
  }
  return old;
};

export const filterNotificationsCache = (old, predicate) => {
  if (!old) return old;
  if (old.notifications) {
    const notifications = old.notifications.filter(predicate);
    return {
      ...old,
      notifications,
      pagination: old.pagination
        ? { ...old.pagination, total: Math.max(old.pagination.total - (old.notifications.length - notifications.length), 0) }
        : old.pagination,
    };
  }
  if (old.pages) {
    return {
      ...old,
      pages: old.pages.map((page) => ({ ...page, notifications: page.notifications.filter(predicate) })),
    };
  }
  return old;
};

const markRead = (id) => (notification) =>
  notification._id === id ? { ...notification, isRead: true } : notification;

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: (_data, id) => {
      queryClient.setQueriesData({ queryKey: NOTIFICATIONS_LIST_KEY }, (old) =>
        mapNotificationsCache(old, markRead(id))
      );
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_LIST_KEY });
      queryClient.setQueryData(UNREAD_COUNT_KEY, 0);
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNotification,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_LIST_KEY });
      const previous = queryClient.getQueriesData({ queryKey: NOTIFICATIONS_LIST_KEY });
      queryClient.setQueriesData({ queryKey: NOTIFICATIONS_LIST_KEY }, (old) =>
        filterNotificationsCache(old, (notification) => notification._id !== id)
      );
      return { previous };
    },
    onError: (err, id, context) => {
      context?.previous?.forEach(([key, value]) => queryClient.setQueryData(key, value));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_LIST_KEY }),
  });
};
