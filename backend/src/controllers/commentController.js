const commentService = require('../services/commentService');
const { recordAudit } = require('../services/auditService');
const { notifyMany } = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { AUDIT_ACTIONS, ENTITY_TYPES, NOTIFICATION_TYPES } = require('../config/constants');

const createComment = asyncHandler(async (req, res) => {
  const comment = await commentService.createComment(req.user.id, req.body);
  const task = req.task;

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.COMMENT,
    entityType: ENTITY_TYPES.COMMENT,
    entityId: comment._id,
    after: comment.toObject(),
  });

  // The project owner watches every task's activity, not just ones they
  // report/are assigned to — notifyMany dedupes automatically.
  const watchers = [task.reporter, ...task.assignees, task.project.owner];
  await notifyMany(watchers, {
    sender: req.user.id,
    type: NOTIFICATION_TYPES.COMMENT_ADDED,
    title: 'New comment',
    message: `New comment on "${task.title}"`,
    entityType: ENTITY_TYPES.TASK,
    entityId: task._id,
  });

  if (comment.mentions.length > 0) {
    await notifyMany(comment.mentions, {
      sender: req.user.id,
      type: NOTIFICATION_TYPES.MENTION,
      title: 'You were mentioned',
      message: `You were mentioned in a comment on "${task.title}"`,
      entityType: ENTITY_TYPES.COMMENT,
      entityId: comment._id,
    });
  }

  res.status(201).json(new ApiResponse(201, { comment }, 'Comment created'));
});

const listComments = asyncHandler(async (req, res) => {
  const { data, pagination } = await commentService.listComments(req.query);
  res.status(200).json(new ApiResponse(200, { comments: data, pagination }, 'Comments fetched'));
});

const getComment = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { comment: req.comment }, 'Comment fetched'));
});

const updateComment = asyncHandler(async (req, res) => {
  const before = req.comment.toObject();
  const comment = await commentService.updateComment(req.comment, req.body.content);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPES.COMMENT,
    entityId: comment._id,
    before,
    after: comment.toObject(),
  });

  res.status(200).json(new ApiResponse(200, { comment }, 'Comment updated'));
});

const deleteComment = asyncHandler(async (req, res) => {
  await commentService.softDeleteComment(req.comment);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.DELETE,
    entityType: ENTITY_TYPES.COMMENT,
    entityId: req.comment._id,
  });

  res.status(200).json(new ApiResponse(200, { comment: req.comment }, 'Comment deleted'));
});

module.exports = { createComment, listComments, getComment, updateComment, deleteComment };
