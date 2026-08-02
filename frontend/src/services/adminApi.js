import axiosInstance from './axiosInstance';

export const listAuditLogs = (params) =>
  axiosInstance.get('/admin/audit-logs', { params }).then((res) => res.data.data);

export const getAdminAnalytics = () =>
  axiosInstance.get('/admin/analytics').then((res) => res.data.data);

export const getSystemHealth = () =>
  axiosInstance.get('/admin/system-health').then((res) => res.data.data);

export const listRoles = () =>
  axiosInstance.get('/admin/roles').then((res) => res.data.data.roles);
