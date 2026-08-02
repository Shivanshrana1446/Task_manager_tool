const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../config/roles');

const loadTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id).populate('project');
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  req.task = task;
  next();
});

const requireTaskProjectMember = (req, res, next) => {
  if (req.user.role === ROLES.ADMIN || req.task.project.isMember(req.user.id)) {
    return next();
  }
  throw new ApiError(403, 'You do not have access to this task');
};

// Shared with taskService's bulk operations so both the single-task middleware
// and the bulk endpoints enforce the exact same rules.
const canWriteTask = (user, task) => {
  const uid = user.id;
  const isAssignee = task.assignees.some((assignee) => assignee.toString() === uid);
  const isReporter = task.reporter.toString() === uid;
  const isProjectOwner = task.project.owner.toString() === uid;
  // A Project Manager manages every task inside a project they belong to,
  // not only ones they happen to own/be assigned/report on.
  const isManagingPM = user.role === ROLES.PROJECT_MANAGER && task.project.isMember(uid);

  return user.role === ROLES.ADMIN || isAssignee || isReporter || isProjectOwner || isManagingPM;
};

const canManageTask = (user, task) => {
  const isProjectOwner = task.project.owner.toString() === user.id;
  const isManagingPM = user.role === ROLES.PROJECT_MANAGER && task.project.isMember(user.id);
  return user.role === ROLES.ADMIN || isProjectOwner || isManagingPM;
};

const requireTaskWriteAccess = (req, res, next) => {
  if (canWriteTask(req.user, req.task)) {
    return next();
  }
  throw new ApiError(403, 'You do not have permission to modify this task');
};

const requireTaskManageAccess = (req, res, next) => {
  if (canManageTask(req.user, req.task)) {
    return next();
  }
  throw new ApiError(403, 'Only the project owner can perform this action');
};

const requireTaskProjectMemberFromBody = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.body.task).populate('project');
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  if (req.user.role !== ROLES.ADMIN && !task.project.isMember(req.user.id)) {
    throw new ApiError(403, 'You do not have access to this task');
  }
  req.task = task;
  next();
});

const requireTaskProjectMemberFromQuery = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.query.task).populate('project');
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  if (req.user.role !== ROLES.ADMIN && !task.project.isMember(req.user.id)) {
    throw new ApiError(403, 'You do not have access to this task');
  }
  req.task = task;
  next();
});

module.exports = {
  loadTask,
  requireTaskProjectMember,
  requireTaskWriteAccess,
  requireTaskManageAccess,
  requireTaskProjectMemberFromBody,
  requireTaskProjectMemberFromQuery,
  canWriteTask,
  canManageTask,
};
