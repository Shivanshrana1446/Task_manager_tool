const attachmentService = require('../services/attachmentService');
const { recordAudit } = require('../services/auditService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { AUDIT_ACTIONS, ENTITY_TYPES } = require('../config/constants');

const createAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'A file is required');
  }

  const attachment = await attachmentService.createAttachment(req.user.id, req.file, req.body);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.UPLOAD,
    entityType: ENTITY_TYPES.ATTACHMENT,
    entityId: attachment._id,
    after: attachment.toObject(),
  });

  res.status(201).json(new ApiResponse(201, { attachment }, 'File uploaded'));
});

const listAttachments = asyncHandler(async (req, res) => {
  const { data, pagination } = await attachmentService.listAttachments(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, { attachments: data, pagination }, 'Attachments fetched'));
});

const getAttachment = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { attachment: req.attachment }, 'Attachment fetched'));
});

const deleteAttachment = asyncHandler(async (req, res) => {
  await attachmentService.softDeleteAttachment(req.attachment);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.DELETE,
    entityType: ENTITY_TYPES.ATTACHMENT,
    entityId: req.attachment._id,
  });

  res.status(200).json(new ApiResponse(200, { attachment: req.attachment }, 'Attachment deleted'));
});

module.exports = { createAttachment, listAttachments, getAttachment, deleteAttachment };
