const path = require('path');
const Attachment = require('../models/Attachment');
const { paginateQuery, pickFilter } = require('../utils/queryHelper');
const { uploadBuffer } = require('./cloudinaryService');

// Cloudinary's own "auto" detection files PDFs under the image resource type
// (each page is image-renderable), which breaks opening/downloading them as
// a plain PDF. Images go through "image" for thumbnails/transforms; every
// other allowed document type goes through "raw" and is served byte-for-byte.
const resourceTypeForMimeType = (mimeType) =>
  mimeType?.startsWith('image/') ? 'image' : 'raw';

// Raw (non-image) Cloudinary assets have no separate "format" concept the
// way images do — the delivery URL only ends in the right extension, and
// Cloudinary only sets the correct Content-Type on download, if that
// extension is baked into the public_id itself. Without this, a PDF still
// uploads fine but comes back as an extensionless URL that browsers can't
// recognize as a PDF.
const buildPublicId = (originalName) => {
  const ext = path.extname(originalName);
  const base = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 60);
  const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${base}-${unique}${ext}`;
};

const createAttachment = async (uploaderId, file, refs) => {
  const result = await uploadBuffer(file.buffer, {
    folder: 'task-manager/attachments',
    resourceType: resourceTypeForMimeType(file.mimetype),
    publicId: buildPublicId(file.originalname),
  });

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
