const userService = require('../services/userService');
const { recordAudit } = require('../services/auditService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { AUDIT_ACTIONS, ENTITY_TYPES } = require('../config/constants');

const listUsers = asyncHandler(async (req, res) => {
  const { data, pagination } = await userService.listUsers(req.query);
  res.status(200).json(new ApiResponse(200, { users: data, pagination }, 'Users fetched'));
});

const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json(new ApiResponse(200, { user }, 'User fetched'));
});

const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateMe(req.user.id, req.body);
  res.status(200).json(new ApiResponse(200, { user }, 'Profile updated'));
});

const changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  res.status(200).json(new ApiResponse(200, null, 'Password changed successfully'));
});

const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'An image file is required');
  }
  const user = await userService.updateAvatar(req.user.id, req.file);
  res.status(200).json(new ApiResponse(200, { user }, 'Avatar updated'));
});

const updateRole = asyncHandler(async (req, res) => {
  const { user, before } = await userService.updateRole(req.params.id, req.body.role);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPES.USER,
    entityId: user._id,
    before: { role: before },
    after: { role: user.role },
  });

  res.status(200).json(new ApiResponse(200, { user }, 'Role updated'));
});

const updateStatus = asyncHandler(async (req, res) => {
  const { user, before } = await userService.updateStatus(req.params.id, req.body.isActive);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPES.USER,
    entityId: user._id,
    before: { isActive: before },
    after: { isActive: user.isActive },
  });

  res.status(200).json(new ApiResponse(200, { user }, 'Status updated'));
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await userService.softDeleteUser(req.params.id);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.DELETE,
    entityType: ENTITY_TYPES.USER,
    entityId: user._id,
  });

  res.status(200).json(new ApiResponse(200, { user }, 'User deleted'));
});

const restoreUser = asyncHandler(async (req, res) => {
  const user = await userService.restoreUser(req.params.id);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.RESTORE,
    entityType: ENTITY_TYPES.USER,
    entityId: user._id,
  });

  res.status(200).json(new ApiResponse(200, { user }, 'User restored'));
});

module.exports = {
  listUsers,
  getUser,
  updateMe,
  changePassword,
  updateAvatar,
  updateRole,
  updateStatus,
  deleteUser,
  restoreUser,
};
