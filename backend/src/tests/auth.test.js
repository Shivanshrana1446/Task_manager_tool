const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

jest.mock('../services/emailService', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

const app = require('../app');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../services/emailService');
const { createUser, authHeader } = require('./helpers/testUtils');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await User.deleteMany({});
  jest.clearAllMocks();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

const credentials = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'StrongPass1',
};

describe('Auth: register', () => {
  it('registers a new user and issues an access token + refresh cookie', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(credentials);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.user.email).toBe(credentials.email);
    expect(res.body.data.user.role).toBe('team_member');
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=/);
  });

  it('rejects duplicate email registration', async () => {
    await request(app).post('/api/v1/auth/register').send(credentials);
    const res = await request(app).post('/api/v1/auth/register').send(credentials);

    expect(res.statusCode).toBe(409);
  });

  it('rejects a weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...credentials, password: 'weak' });

    expect(res.statusCode).toBe(422);
  });

  it('ignores a client-supplied role and forces team_member', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...credentials, role: 'admin' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.user.role).toBe('team_member');
  });
});

describe('Auth: login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send(credentials);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
  });

  it('rejects an incorrect password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: 'WrongPass1' });

    expect(res.statusCode).toBe(401);
  });

  it('rejects an unknown email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: credentials.password });

    expect(res.statusCode).toBe(401);
  });

  it('rejects login for a deactivated account', async () => {
    const { accessToken: adminToken } = await createUser({ email: 'admin-deactivate@example.com', role: 'admin' });
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...credentials, email: 'deactivated@example.com' });
    const userId = registerRes.body.data.user._id;

    await request(app)
      .patch(`/api/v1/users/${userId}/status`)
      .set(authHeader(adminToken))
      .send({ isActive: false });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'deactivated@example.com', password: credentials.password });

    expect(res.statusCode).toBe(403);
  });
});

describe('Auth: protected routes', () => {
  it('rejects /me without a token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('returns the current user with a valid access token', async () => {
    const register = await request(app).post('/api/v1/auth/register').send(credentials);
    const { accessToken } = register.body.data;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.email).toBe(credentials.email);
  });

  it('returns 404 from /me if the account has since been deleted', async () => {
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...credentials, email: 'ghost-me@example.com' });
    const { accessToken, user } = registerRes.body.data;

    const { accessToken: adminToken } = await createUser({ email: 'admin-ghost@example.com', role: 'admin' });
    await request(app).delete(`/api/v1/users/${user._id}`).set(authHeader(adminToken));

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(404);
  });
});

describe('Auth: refresh token + logout', () => {
  it('rotates the refresh token and issues a new access token', async () => {
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/register').send(credentials);

    const refreshRes = await agent.post('/api/v1/auth/refresh-token');
    expect(refreshRes.statusCode).toBe(200);
    expect(refreshRes.body.data.accessToken).toEqual(expect.any(String));
  });

  it('rejects refresh without a cookie', async () => {
    const res = await request(app).post('/api/v1/auth/refresh-token');
    expect(res.statusCode).toBe(401);
  });

  it('rejects a malformed refresh token cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('Cookie', 'refreshToken=not-a-real-jwt');

    expect(res.statusCode).toBe(401);
  });

  it('rejects a refresh token that has been invalidated by logout', async () => {
    const agent = request.agent(app);
    const register = await agent.post('/api/v1/auth/register').send(credentials);
    const { accessToken } = register.body.data;
    const refreshCookie = register.headers['set-cookie'].find((cookie) => cookie.startsWith('refreshToken='));

    await agent.post('/api/v1/auth/logout').set('Authorization', `Bearer ${accessToken}`);

    const res = await request(app).post('/api/v1/auth/refresh-token').set('Cookie', refreshCookie);

    expect(res.statusCode).toBe(401);
  });

  it('invalidates the refresh token on logout', async () => {
    const agent = request.agent(app);
    const register = await agent.post('/api/v1/auth/register').send(credentials);
    const { accessToken } = register.body.data;

    const logoutRes = await agent
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(logoutRes.statusCode).toBe(200);

    const refreshRes = await agent.post('/api/v1/auth/refresh-token');
    expect(refreshRes.statusCode).toBe(401);
  });
});

describe('Auth: forgot / reset password', () => {
  it('accepts a forgot-password request and sends a reset email', async () => {
    await request(app).post('/api/v1/auth/register').send(credentials);

    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: credentials.email });

    expect(res.statusCode).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it('resolves the same way for an unknown email (no user enumeration)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'ghost@example.com' });

    expect(res.statusCode).toBe(200);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('resets the password with a valid token and allows login with the new password', async () => {
    await request(app).post('/api/v1/auth/register').send(credentials);
    await request(app).post('/api/v1/auth/forgot-password').send({ email: credentials.email });

    const resetUrl = sendPasswordResetEmail.mock.calls[0][0].resetUrl;
    const token = resetUrl.split('/').pop();

    const newPassword = 'NewStrongPass1';
    const resetRes = await request(app)
      .post(`/api/v1/auth/reset-password/${token}`)
      .send({ password: newPassword, confirmPassword: newPassword });

    expect(resetRes.statusCode).toBe(200);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: newPassword });

    expect(loginRes.statusCode).toBe(200);
  });

  it('rejects reset with an invalid token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password/not-a-real-token')
      .send({ password: 'NewStrongPass1', confirmPassword: 'NewStrongPass1' });

    expect(res.statusCode).toBe(400);
  });

  it('rejects reset when passwords do not match', async () => {
    await request(app).post('/api/v1/auth/register').send(credentials);
    await request(app).post('/api/v1/auth/forgot-password').send({ email: credentials.email });
    const resetUrl = sendPasswordResetEmail.mock.calls[0][0].resetUrl;
    const token = resetUrl.split('/').pop();

    const res = await request(app)
      .post(`/api/v1/auth/reset-password/${token}`)
      .send({ password: 'NewStrongPass1', confirmPassword: 'Mismatch1' });

    expect(res.statusCode).toBe(422);
  });
});
