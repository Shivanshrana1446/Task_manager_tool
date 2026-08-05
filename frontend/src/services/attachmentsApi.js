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
      // No explicit Content-Type here — axios must compute its own boundary
      // for the multipart body it's about to encode. Setting a bare
      // "multipart/form-data" (no boundary) makes the server's multipart
      // parser unable to correctly split the body, silently corrupting
      // binary file content while simple text fields still come through.
      onUploadProgress,
    })
    .then((res) => res.data.data.attachment);
};

export const deleteAttachment = (id) =>
  axiosInstance.delete(`/attachments/${id}`).then((res) => res.data.data.attachment);
