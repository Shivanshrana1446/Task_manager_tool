import axiosInstance from './axiosInstance';

export const listAttachments = (taskId) =>
  axiosInstance
    .get('/attachments', { params: { task: taskId, limit: 100 } })
    .then((res) => res.data.data.attachments);

export const uploadAttachment = (taskId, file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('task', taskId);
  formData.append('file', file);

  return axiosInstance
    .post('/attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
    .then((res) => res.data.data.attachment);
};

export const deleteAttachment = (id) =>
  axiosInstance.delete(`/attachments/${id}`).then((res) => res.data.data.attachment);
