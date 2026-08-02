const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../config/roles');

const loadProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  req.project = project;
  next();
});

const requireProjectMember = (req, res, next) => {
  if (req.user.role === ROLES.ADMIN || req.project.isMember(req.user.id)) {
    return next();
  }
  throw new ApiError(403, 'You do not have access to this project');
};

const requireProjectOwner = (req, res, next) => {
  if (req.user.role === ROLES.ADMIN || req.project.owner.toString() === req.user.id) {
    return next();
  }
  throw new ApiError(403, 'Only the project owner can perform this action');
};

const requireProjectMemberFromBody = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.body.project);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  if (req.user.role !== ROLES.ADMIN && !project.isMember(req.user.id)) {
    throw new ApiError(403, 'You do not have access to this project');
  }
  req.project = project;
  next();
});

module.exports = {
  loadProject,
  requireProjectMember,
  requireProjectOwner,
  requireProjectMemberFromBody,
};
