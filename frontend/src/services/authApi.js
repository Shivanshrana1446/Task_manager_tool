import axiosInstance from './axiosInstance';

export const registerRequest = (payload) =>
  axiosInstance.post('/auth/register', payload).then((res) => res.data.data);

export const loginRequest = (payload) =>
  axiosInstance.post('/auth/login', payload).then((res) => res.data.data);

export const logoutRequest = () => axiosInstance.post('/auth/logout').then((res) => res.data);

export const refreshTokenRequest = () =>
  axiosInstance.post('/auth/refresh-token').then((res) => res.data.data);

export const forgotPasswordRequest = (payload) =>
  axiosInstance.post('/auth/forgot-password', payload).then((res) => res.data);

export const resetPasswordRequest = (token, payload) =>
  axiosInstance.post(`/auth/reset-password/${token}`, payload).then((res) => res.data);

export const getMeRequest = () =>
  axiosInstance.get('/auth/me').then((res) => res.data.data.user);
