import axiosInstance from './axiosInstance';

export const listTeams = (params) =>
  axiosInstance.get('/teams', { params }).then((res) => res.data.data);

export const getTeam = (id) => axiosInstance.get(`/teams/${id}`).then((res) => res.data.data.team);

export const createTeam = (payload) =>
  axiosInstance.post('/teams', payload).then((res) => res.data.data.team);

export const updateTeam = (id, payload) =>
  axiosInstance.patch(`/teams/${id}`, payload).then((res) => res.data.data.team);

export const deleteTeam = (id) =>
  axiosInstance.delete(`/teams/${id}`).then((res) => res.data.data.team);

export const restoreTeam = (id) =>
  axiosInstance.post(`/teams/${id}/restore`).then((res) => res.data.data.team);

export const addTeamMembers = (id, members) =>
  axiosInstance.post(`/teams/${id}/members`, { members }).then((res) => res.data.data.team);

export const removeTeamMember = (id, userId) =>
  axiosInstance.delete(`/teams/${id}/members/${userId}`).then((res) => res.data.data.team);

export const assignTeamLead = (id, lead) =>
  axiosInstance.patch(`/teams/${id}/lead`, { lead }).then((res) => res.data.data.team);
