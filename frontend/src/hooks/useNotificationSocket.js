import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { socket, connectSocket, disconnectSocket } from '../services/socket';
import { addToast } from '../redux/slices/uiSlice';
import { NOTIFICATIONS_LIST_KEY, UNREAD_COUNT_KEY, mapNotificationsCache } from './useNotifications';

export const useNotificationSocket = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return undefined;
    }

    connectSocket();

    const handleNew = (notification) => {
      queryClient.setQueryData(UNREAD_COUNT_KEY, (old) => (typeof old === 'number' ? old + 1 : 1));
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_LIST_KEY });
      dispatch(addToast({ title: notification.title, message: notification.message }));
    };

    const handleRead = ({ id }) => {
      queryClient.setQueryData(UNREAD_COUNT_KEY, (old) =>
        typeof old === 'number' ? Math.max(old - 1, 0) : old
      );
      queryClient.setQueriesData({ queryKey: NOTIFICATIONS_LIST_KEY }, (old) =>
        mapNotificationsCache(old, (notification) =>
          notification._id === id ? { ...notification, isRead: true } : notification
        )
      );
    };

    const handleReadAll = () => {
      queryClient.setQueryData(UNREAD_COUNT_KEY, 0);
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_LIST_KEY });
    };

    socket.on('notification:new', handleNew);
    socket.on('notification:read', handleRead);
    socket.on('notification:read-all', handleReadAll);

    return () => {
      socket.off('notification:new', handleNew);
      socket.off('notification:read', handleRead);
      socket.off('notification:read-all', handleReadAll);
    };
  }, [isAuthenticated, queryClient, dispatch]);
};
