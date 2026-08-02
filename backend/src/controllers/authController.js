const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { REFRESH_TOKEN_COOKIE, refreshTokenCookieOptions } = require('../utils/cookieOptions');

const setRefreshTokenCookie = (res, token) => {
  res.cookie(REFRESH_TOKEN_COOKIE, token, refreshTokenCookieOptions);
};

const clearRefreshTokenCookie = (res) => {
  const options = { ...refreshTokenCookieOptions };
  delete options.maxAge;
  res.clearCookie(REFRESH_TOKEN_COOKIE, options);
};

const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);

  setRefreshTokenCookie(res, refreshToken);
  res.status(201).json(new ApiResponse(201, { user, accessToken }, 'Registration successful'));
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  setRefreshTokenCookie(res, refreshToken);
  res.status(200).json(new ApiResponse(200, { user, accessToken }, 'Login successful'));
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);

  clearRefreshTokenCookie(res);
  res.status(200).json(new ApiResponse(200, null, 'Logout successful'));
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies[REFRESH_TOKEN_COOKIE];
  const { user, accessToken, refreshToken } = await authService.refreshAccessToken(token);

  setRefreshTokenCookie(res, refreshToken);
  res.status(200).json(new ApiResponse(200, { user, accessToken }, 'Token refreshed'));
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);

  res
    .status(200)
    .json(
      new ApiResponse(200, null, 'If that email is registered, a reset link has been sent')
    );
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);

  res.status(200).json(new ApiResponse(200, null, 'Password has been reset successfully'));
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  res.status(200).json(new ApiResponse(200, { user }, 'Current user fetched'));
});

module.exports = {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  getMe,
};
