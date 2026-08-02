const Attachment = require('../models/Attachment');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../config/roles');

const resolveProjectFromRefs = async ({ task, project, comment }) => {
  if (task) {
    const taskDoc = await Task.findById(task).populate('project');
    return taskDoc?.project || null;
  }
  if (project) {
    return Project.findById(project);
  }
  if (comment) {
    const commentDoc = await Comment.findById(comment).populate({
      path: 'task',
      populate: { path: 'project' },
    });
    return commentDoc?.task?.project || null;
  }
  return null;
};

const resolveAttachmentProject = (attachment) =>
  resolveProjectFromRefs({
    task: attachment.task,
    project: attachment.project,
    comment: attachment.comment,
  });

const loadAttachment = asyncHandler(async (req, res, next) => {
  const attachment = await Attachment.findById(req.params.id);
  if (!attachment) {
    throw new ApiError(404, 'Attachment not found');
  }
  req.attachment = attachment;
  req.attachmentProject = await resolveAttachmentProject(attachment);
  next();
});

const requireAttachmentProjectMember = (req, res, next) => {
  if (
    req.user.role === ROLES.ADMIN ||
    (req.attachmentProject && req.attachmentProject.isMember(req.user.id))
  ) {
    return next();
  }
  throw new ApiError(403, 'You do not have access to this attachment');
};

const requireAttachmentOwner = (req, res, next) => {
  if (req.user.role === ROLES.ADMIN || req.attachment.uploadedBy.toString() === req.user.id) {
    return next();
  }
  throw new ApiError(403, 'Only the uploader can perform this action');
};

const requireParentAccess = (source) =>
  asyncHandler(async (req, res, next) => {
    const refs = source === 'body' ? req.body : req.query;
    const project = await resolveProjectFromRefs(refs);

    if (!project) {
      throw new ApiError(404, 'Referenced task, project, or comment not found');
    }
    if (req.user.role !== ROLES.ADMIN && !project.isMember(req.user.id)) {
      throw new ApiError(403, 'You do not have access to this resource');
    }

    req.attachmentProject = project;
    next();
  });

module.exports = {
  resolveProjectFromRefs,
  resolveAttachmentProject,
  loadAttachment,
  requireAttachmentProjectMember,
  requireAttachmentOwner,
  requireAttachmentAccessFromBody: requireParentAccess('body'),
  requireAttachmentAccessFromQuery: requireParentAccess('query'),
};
