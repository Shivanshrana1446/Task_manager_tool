const env = require('../config/env');
const parseDurationMs = require('./parseDuration');

const REFRESH_TOKEN_COOKIE = 'refreshToken';

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  path: `${env.apiPrefix}/auth`,
  maxAge: parseDurationMs(env.jwt.refreshExpiresIn),
};

module.exports = { REFRESH_TOKEN_COOKIE, refreshTokenCookieOptions };
