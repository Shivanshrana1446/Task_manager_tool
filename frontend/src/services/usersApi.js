import axiosInstance from './axiosInstance';

export const searchUsers = (params) =>
  axiosInstance.get('/users', { params }).then((res) => res.data.data);

export const updateUserRole = (id, role) =>
  axiosInstance.patch(`/users/${id}/role`, { role }).then((res) => res.data.data.user);

export const updateUserStatus = (id, isActive) =>
  axiosInstance.patch(`/users/${id}/status`, { isActive }).then((res) => res.data.data.user);

export const deleteUser = (id) =>
  axiosInstance.delete(`/users/${id}`).then((res) => res.data.data.user);

export const restoreUser = (id) =>
  axiosInstance.post(`/users/${id}/restore`).then((res) => res.data.data.user);
