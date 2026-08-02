const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const authLimiter = require('../middleware/authLimiter');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/authValidators');

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new account
 *     description: >
 *       Always creates the account with role `team_member`, regardless of any `role`
 *       field sent in the request body. Returns an access token in the body and sets
 *       an httpOnly `refreshToken` cookie, exactly like `POST /auth/login`.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 100 }
 *               email: { type: string, format: email }
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Must contain a lowercase letter, an uppercase letter, and a number.
 *           example:
 *             name: Ada Lovelace
 *             email: ada@example.com
 *             password: StrongPass1
 *     responses:
 *       201:
 *         description: Account created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 statusCode: { type: integer, example: 201 }
 *                 message: { type: string, example: Registration successful }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *                     accessToken: { type: string }
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: Registration successful
 *               data:
 *                 user:
 *                   _id: 65f1a2b3c4d5e6f7a8b9c0d1
 *                   name: Ada Lovelace
 *                   email: ada@example.com
 *                   role: team_member
 *                   isActive: true
 *                   avatar: { url: null }
 *                   createdAt: "2026-01-15T09:30:00.000Z"
 *                   updatedAt: "2026-01-15T09:30:00.000Z"
 *                 accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWYxYTJiMyJ9.abc123
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { success: false, message: Email is already registered, errors: [] }
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/register', authLimiter, registerValidator, authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     description: >
 *       Returns an access token in the body and sets an httpOnly `refreshToken` cookie
 *       (7 days by default). Rate-limited to 20 attempts per 15 minutes per IP.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *           example:
 *             email: ada@example.com
 *             password: StrongPass1
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Login successful }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *                     accessToken: { type: string }
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: Login successful
 *               data:
 *                 user:
 *                   _id: 65f1a2b3c4d5e6f7a8b9c0d1
 *                   name: Ada Lovelace
 *                   email: ada@example.com
 *                   role: team_member
 *                   isActive: true
 *                   avatar: { url: null }
 *                   createdAt: "2026-01-15T09:30:00.000Z"
 *                   updatedAt: "2026-01-15T09:30:00.000Z"
 *                 accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWYxYTJiMyJ9.abc123
 *       401:
 *         description: Wrong email/password, or the account has been deactivated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             examples:
 *               invalidCredentials:
 *                 summary: Wrong email or password
 *                 value: { success: false, message: Invalid email or password, errors: [] }
 *               deactivated:
 *                 summary: Account deactivated by an admin
 *                 value: { success: false, message: This account has been deactivated, errors: [] }
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/login', authLimiter, loginValidator, authController.login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange the refresh-token cookie for a new access token
 *     description: >
 *       Reads the httpOnly `refreshToken` cookie set by login/register (sent
 *       automatically by browsers/Postman's cookie jar — no request body needed),
 *       rotates it, and returns a fresh access token.
 *     security: []
 *     responses:
 *       200:
 *         description: Token refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: Token refreshed
 *               data: { accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWYxYTJiMyJ9.def456 }
 *       401:
 *         description: Refresh token missing, malformed/expired, or invalidated by a prior logout
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             examples:
 *               missing:
 *                 summary: No refreshToken cookie sent
 *                 value: { success: false, message: Refresh token is missing, errors: [] }
 *               expired:
 *                 summary: Cookie present but signature invalid/expired
 *                 value: { success: false, message: Invalid or expired refresh token, errors: [] }
 *               revoked:
 *                 summary: Valid JWT, but already logged out elsewhere
 *                 value: { success: false, message: Refresh token is no longer valid, errors: [] }
 */
router.post('/refresh-token', authController.refresh);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset email
 *     description: >
 *       Always returns 200 with the same generic message whether or not the email is
 *       registered, so the endpoint can't be used to enumerate accounts. In development
 *       (no SMTP configured), the reset link is written to the server log instead of
 *       being emailed.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *           example:
 *             email: ada@example.com
 *     responses:
 *       200:
 *         description: Generic success response (does not reveal whether the email exists)
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: If that email is registered, a reset link has been sent
 *               data: null
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/forgot-password',
  authLimiter,
  forgotPasswordValidator,
  authController.forgotPassword
);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using a reset token
 *     description: >
 *       `token` is the raw token from the reset-link URL emailed (or logged) by
 *       `POST /auth/forgot-password`. Resetting the password also invalidates any
 *       existing refresh token, signing the user out of other sessions.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *         example: 3f7a1c9e2b8d4f6a0c1e5b9d7a3f2c8e
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password, confirmPassword]
 *             properties:
 *               password: { type: string, format: password, minLength: 8 }
 *               confirmPassword: { type: string, format: password }
 *           example:
 *             password: NewStrongPass1
 *             confirmPassword: NewStrongPass1
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: Password has been reset successfully
 *               data: null
 *       400:
 *         description: Token is invalid, already used, or expired
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { success: false, message: Password reset token is invalid or has expired, errors: [] }
 *       422:
 *         description: Validation failed (weak password, or passwords do not match)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example:
 *               success: false
 *               message: Validation failed
 *               errors: [{ field: confirmPassword, message: Passwords do not match }]
 */
router.post('/reset-password/:token', resetPasswordValidator, authController.resetPassword);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out and invalidate the refresh token
 *     description: Clears the stored refresh token server-side and clears the cookie client-side.
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             example: { success: true, statusCode: 200, message: Logged out successfully, data: null }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: Current user fetched
 *               data:
 *                 user:
 *                   _id: 65f1a2b3c4d5e6f7a8b9c0d1
 *                   name: Ada Lovelace
 *                   email: ada@example.com
 *                   role: team_member
 *                   isActive: true
 *                   avatar: { url: null }
 *                   createdAt: "2026-01-15T09:30:00.000Z"
 *                   updatedAt: "2026-01-15T09:30:00.000Z"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: The account behind this token no longer exists (e.g. deleted by an admin)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { success: false, message: User not found, errors: [] }
 */
router.get('/me', authenticate, authController.getMe);

module.exports = router;
