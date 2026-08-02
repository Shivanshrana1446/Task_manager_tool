const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { paginateQuery, pickFilter } = require('../utils/queryHelper');
const { uploadBuffer, deleteAsset } = require('./cloudinaryService');

const listUsers = (query) =>
  paginateQuery({
    Model: User,
    filter: pickFilter(query, ['role', 'isActive']),
    query,
    searchFields: ['name', 'email'],
    defaultSort: 'name',
  });

const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

const updateMe = async (userId, data) => {
  const user = await getUserById(userId);
  if (data.name !== undefined) user.name = data.name;
  await user.save();
  return user;
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect');
  }
  user.password = newPassword;
  user.refreshToken = undefined;
  await user.save();
  return user;
};

const updateAvatar = async (userId, file) => {
  const user = await User.findById(userId).select('+avatar.publicId');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const result = await uploadBuffer(file.buffer, { folder: 'task-manager/avatars', resourceType: 'image' });

  if (user.avatar?.publicId) {
    await deleteAsset(user.avatar.publicId, { resourceType: 'image' }).catch(() => null);
  }

  user.avatar = { url: result.secure_url, publicId: result.public_id };
  await user.save();
  return user;
};

const updateRole = async (userId, role) => {
  const user = await getUserById(userId);
  const before = user.role;
  user.role = role;
  await user.save();
  return { user, before };
};

const updateStatus = async (userId, isActive) => {
  const user = await getUserById(userId);
  const before = user.isActive;
  user.isActive = isActive;
  await user.save();
  return { user, before };
};

const softDeleteUser = async (userId) => {
  const user = await getUserById(userId);
  await user.softDelete();
  return user;
};

const restoreUser = async (userId) => {
  const user = await User.findById(userId).withDeleted();
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  await user.restore();
  return user;
};

module.exports = {
  listUsers,
  getUserById,
  updateMe,
  changePassword,
  updateAvatar,
  updateRole,
  updateStatus,
  softDeleteUser,
  restoreUser,
};
