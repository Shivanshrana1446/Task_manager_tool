import axiosInstance from './axiosInstance';

export const getDashboardSummary = () =>
  axiosInstance.get('/dashboard/summary').then((res) => res.data.data.summary);
