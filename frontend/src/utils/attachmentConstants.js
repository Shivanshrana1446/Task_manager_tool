// Keep these in sync with backend/src/config/constants.js (ATTACHMENT_LIMITS).
export const MAX_ATTACHMENT_SIZE_MB = 10;
export const MAX_ATTACHMENT_SIZE_BYTES = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
];

export const validateAttachmentFile = (file) => {
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return `Exceeds the ${MAX_ATTACHMENT_SIZE_MB}MB size limit`;
  }
  if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.type)) {
    return 'Unsupported file type';
  }
  return null;
};
