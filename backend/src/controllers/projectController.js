const projectService = require('../services/projectService');
const { recordAudit } = require('../services/auditService');
const { createNotification, notifyMany } = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { AUDIT_ACTIONS, ENTITY_TYPES, NOTIFICATION_TYPES } = require('../config/constants');
const { ROLES } = require('../config/roles');

const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user.id, req.body);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPES.PROJECT,
    entityId: project._id,
    after: project.toObject(),
  });

  res.status(201).json(new ApiResponse(201, { project }, 'Project created'));
});

const listProjects = asyncHandler(async (req, res) => {
  const { data, pagination } = await projectService.listProjects(req.user, req.query);
  res.status(200).json(new ApiResponse(200, { projects: data, pagination }, 'Projects fetched'));
});

const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectDetail(req.project);
  res.status(200).json(new ApiResponse(200, { project }, 'Project fetched'));
});

const updateProject = asyncHandler(async (req, res) => {
  const before = req.project.toObject();
  const project = await projectService.updateProject(req.project, req.body);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPES.PROJECT,
    entityId: project._id,
    before,
    after: project.toObject(),
  });

  const watchers = [project.owner, ...project.members];
  await notifyMany(watchers, {
    sender: req.user.id,
    type: NOTIFICATION_TYPES.PROJECT_UPDATED,
    title: 'Project updated',
    message: `"${project.name}" was updated`,
    entityType: ENTITY_TYPES.PROJECT,
    entityId: project._id,
  });

  res.status(200).json(new ApiResponse(200, { project }, 'Project updated'));
});

const deleteProject = asyncHandler(async (req, res) => {
  await projectService.softDeleteProject(req.project);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.DELETE,
    entityType: ENTITY_TYPES.PROJECT,
    entityId: req.project._id,
  });

  res.status(200).json(new ApiResponse(200, { project: req.project }, 'Project deleted'));
});

const restoreProject = asyncHandler(async (req, res) => {
  const project = await projectService.findDeletedProject(req.params.id);

  if (req.user.role !== ROLES.ADMIN && project.owner.toString() !== req.user.id) {
    throw new ApiError(403, 'Only the project owner can perform this action');
  }

  await projectService.restoreProject(project);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.RESTORE,
    entityType: ENTITY_TYPES.PROJECT,
    entityId: project._id,
  });

  res.status(200).json(new ApiResponse(200, { project }, 'Project restored'));
});

const addMembers = asyncHandler(async (req, res) => {
  const { project, newlyAdded } = await projectService.addMembers(req.project, req.body.members);

  if (newlyAdded.length > 0) {
    await notifyMany(newlyAdded, {
      sender: req.user.id,
      type: NOTIFICATION_TYPES.PROJECT_INVITE,
      title: 'Added to a project',
      message: `You were added to the project "${project.name}"`,
      entityType: ENTITY_TYPES.PROJECT,
      entityId: project._id,
    });

    await recordAudit({
      req,
      action: AUDIT_ACTIONS.ASSIGN,
      entityType: ENTITY_TYPES.PROJECT,
      entityId: project._id,
      after: { addedMembers: newlyAdded },
    });
  }

  res.status(200).json(new ApiResponse(200, { project }, 'Members added'));
});

const removeMember = asyncHandler(async (req, res) => {
  const project = await projectService.removeMember(req.project, req.params.userId);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPES.PROJECT,
    entityId: project._id,
    after: { removedMember: req.params.userId },
  });

  res.status(200).json(new ApiResponse(200, { project }, 'Member removed'));
});

const assignManager = asyncHandler(async (req, res) => {
  const before = { owner: req.project.owner.toString() };
  const { project, changed } = await projectService.assignManager(req.project, req.body.owner);

  if (changed) {
    await recordAudit({
      req,
      action: AUDIT_ACTIONS.ASSIGN,
      entityType: ENTITY_TYPES.PROJECT,
      entityId: project._id,
      before,
      after: { owner: project.owner.toString() },
    });

    await createNotification({
      recipient: project.owner,
      sender: req.user.id,
      type: NOTIFICATION_TYPES.PROJECT_MANAGER_ASSIGNED,
      title: 'You are now the project manager',
      message: `You were assigned as the manager of "${project.name}"`,
      entityType: ENTITY_TYPES.PROJECT,
      entityId: project._id,
    });
  }

  res.status(200).json(new ApiResponse(200, { project }, 'Project manager updated'));
});

module.exports = {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  restoreProject,
  addMembers,
  removeMember,
  assignManager,
};
