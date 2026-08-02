const User = require('../models/User');
const { ROLES } = require('../config/roles');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const hashToken = require('../utils/hashToken');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('./emailService');

const issueTokens = async (user) => {
  const payload = { sub: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  user.refreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const register = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'Email is already registered');
  }

  const user = await User.create({ name, email, password, role: ROLES.TEAM_MEMBER });
  const tokens = await issueTokens(user);

  return { user, ...tokens };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated');
  }

  const tokens = await issueTokens(user);

  return { user, ...tokens };
};

const refreshAccessToken = async (token) => {
  if (!token) {
    throw new ApiError(401, 'Refresh token is missing');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.sub).select('+refreshToken');
  if (!user || !user.refreshToken || user.refreshToken !== hashToken(token)) {
    throw new ApiError(401, 'Refresh token is no longer valid');
  }

  const tokens = await issueTokens(user);

  return { user, ...tokens };
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });

  if (user) {
    const rawToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${env.clientUrl}/reset-password/${rawToken}`;
    await sendPasswordResetEmail({ to: user.email, resetUrl });
  }
};

const resetPassword = async (rawToken, newPassword) => {
  const user = await User.findOne({
    passwordResetToken: hashToken(rawToken),
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new ApiError(400, 'Password reset token is invalid or has expired');
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken = undefined;

  await user.save();
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};
