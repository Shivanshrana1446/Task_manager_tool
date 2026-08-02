import axiosInstance from './axiosInstance';

export const listNotifications = (params) =>
  axiosInstance.get('/notifications', { params }).then((res) => res.data.data);

export const getUnreadCount = () =>
  axiosInstance.get('/notifications/unread-count').then((res) => res.data.data.count);

export const markNotificationAsRead = (id) =>
  axiosInstance.patch(`/notifications/${id}/read`).then((res) => res.data.data.notification);

export const markAllNotificationsAsRead = () =>
  axiosInstance.patch('/notifications/read-all').then((res) => res.data);

export const deleteNotification = (id) =>
  axiosInstance.delete(`/notifications/${id}`).then((res) => res.data.data.notification);
