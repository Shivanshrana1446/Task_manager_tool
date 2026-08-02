const Comment = require('../models/Comment');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../config/roles');

const loadComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id).populate({
    path: 'task',
    populate: { path: 'project' },
  });
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }
  req.comment = comment;
  next();
});

const requireCommentProjectMember = (req, res, next) => {
  if (req.user.role === ROLES.ADMIN || req.comment.task.project.isMember(req.user.id)) {
    return next();
  }
  throw new ApiError(403, 'You do not have access to this comment');
};

const requireCommentAuthor = (req, res, next) => {
  if (req.user.role === ROLES.ADMIN || req.comment.author.toString() === req.user.id) {
    return next();
  }
  throw new ApiError(403, 'Only the comment author can perform this action');
};

module.exports = { loadComment, requireCommentProjectMember, requireCommentAuthor };
