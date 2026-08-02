import axiosInstance from './axiosInstance';

export const listProjects = (params) =>
  axiosInstance.get('/projects', { params }).then((res) => res.data.data);

export const getProject = (id) =>
  axiosInstance.get(`/projects/${id}`).then((res) => res.data.data.project);

export const createProject = (payload) =>
  axiosInstance.post('/projects', payload).then((res) => res.data.data.project);

export const updateProject = (id, payload) =>
  axiosInstance.patch(`/projects/${id}`, payload).then((res) => res.data.data.project);

export const deleteProject = (id) =>
  axiosInstance.delete(`/projects/${id}`).then((res) => res.data.data.project);

export const restoreProject = (id) =>
  axiosInstance.post(`/projects/${id}/restore`).then((res) => res.data.data.project);

export const addProjectMembers = (id, members) =>
  axiosInstance.post(`/projects/${id}/members`, { members }).then((res) => res.data.data.project);

export const removeProjectMember = (id, userId) =>
  axiosInstance.delete(`/projects/${id}/members/${userId}`).then((res) => res.data.data.project);

export const assignProjectManager = (id, owner) =>
  axiosInstance.patch(`/projects/${id}/manager`, { owner }).then((res) => res.data.data.project);
