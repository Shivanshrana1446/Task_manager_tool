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
      // axiosInstance sets a default Content-Type: application/json on every
      // request. That default wins over axios's own FormData auto-detection
      // unless we explicitly clear it here — leaving it in place makes the
      // server treat this as a JSON body with no file at all ("A file is
      // required"). Setting it to undefined removes the inherited default so
      // the browser can set the correct multipart Content-Type + boundary.
      headers: { 'Content-Type': undefined },
      onUploadProgress,
    })
    .then((res) => res.data.data.attachment);
};

export const deleteAttachment = (id) =>
  axiosInstance.delete(`/attachments/${id}`).then((res) => res.data.data.attachment);
