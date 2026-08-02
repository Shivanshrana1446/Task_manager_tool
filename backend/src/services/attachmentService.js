const Attachment = require('../models/Attachment');
const { paginateQuery, pickFilter } = require('../utils/queryHelper');
const { uploadBuffer } = require('./cloudinaryService');

const createAttachment = async (uploaderId, file, refs) => {
  const result = await uploadBuffer(file.buffer, { folder: 'task-manager/attachments' });

  return Attachment.create({
    fileName: result.public_id,
    originalName: file.originalname,
    url: result.secure_url,
    publicId: result.public_id,
    mimeType: file.mimetype,
    size: file.size,
    task: refs.task || null,
    project: refs.project || null,
    comment: refs.comment || null,
    uploadedBy: uploaderId,
  });
};

const listAttachments = (query) =>
  paginateQuery({
    Model: Attachment,
    filter: pickFilter(query, ['task', 'project', 'comment']),
    query,
    defaultSort: '-createdAt',
  });

const softDeleteAttachment = (attachment) => attachment.softDelete();

module.exports = { createAttachment, listAttachments, softDeleteAttachment };
