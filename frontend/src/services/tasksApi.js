import axiosInstance from './axiosInstance';

export const listTasks = (params) =>
  axiosInstance.get('/tasks', { params }).then((res) => res.data.data);

export const getTask = (id) => axiosInstance.get(`/tasks/${id}`).then((res) => res.data.data.task);

export const createTask = (payload) =>
  axiosInstance.post('/tasks', payload).then((res) => res.data.data.task);

export const updateTask = (id, payload) =>
  axiosInstance.patch(`/tasks/${id}`, payload).then((res) => res.data.data.task);

export const deleteTask = (id) =>
  axiosInstance.delete(`/tasks/${id}`).then((res) => res.data.data.task);

export const getTaskHistory = (id) =>
  axiosInstance.get(`/tasks/${id}/history`).then((res) => res.data.data.history);

export const bulkUpdateTaskStatus = (ids, status) =>
  axiosInstance.patch('/tasks/bulk', { ids, status }).then((res) => res.data.data);

export const bulkDeleteTasks = (ids) =>
  axiosInstance.delete('/tasks/bulk', { data: { ids } }).then((res) => res.data.data);
