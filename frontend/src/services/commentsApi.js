import axiosInstance from './axiosInstance';

export const listComments = (taskId) =>
  axiosInstance
    .get('/comments', { params: { task: taskId, limit: 100 } })
    .then((res) => res.data.data.comments);

export const createComment = (payload) =>
  axiosInstance.post('/comments', payload).then((res) => res.data.data.comment);

export const updateComment = (id, content) =>
  axiosInstance.patch(`/comments/${id}`, { content }).then((res) => res.data.data.comment);

export const deleteComment = (id) =>
  axiosInstance.delete(`/comments/${id}`).then((res) => res.data.data.comment);
