const mongoose = require('mongoose');
const request = require('supertest');

jest.mock('../services/cloudinaryService', () => ({
  uploadBuffer: jest.fn().mockResolvedValue({
    secure_url: 'https://cdn.example.com/avatar.png',
    public_id: 'avatars/mock123',
  }),
  deleteAsset: jest.fn().mockResolvedValue({}),
}));

const app = require('../app');
const { setupTestDB, createUser, authHeader } = require('./helpers/testUtils');

setupTestDB();

describe('User APIs', () => {
  it('lists users with pagination', async () => {
    const { accessToken } = await createUser({ email: 'lister@example.com' });
    await createUser({ email: 'a@example.com', name: 'Alpha' });
    await createUser({ email: 'b@example.com', name: 'Beta' });

    const res = await request(app)
      .get('/api/v1/users?limit=2&page=1')
      .set(authHeader(accessToken));

    expect(res.statusCode).toBe(200);
    expect(res.body.data.users.length).toBe(2);
    expect(res.body.data.pagination.total).toBe(3);
  });

  it('searches users by name', async () => {
    const { accessToken } = await createUser({ email: 'searcher@example.com' });
    await createUser({ email: 'zed@example.com', name: 'Zendaya' });

    const res = await request(app)
      .get('/api/v1/users?search=Zendaya')
      .set(authHeader(accessToken));

    expect(res.body.data.users).toHaveLength(1);
    expect(res.body.data.users[0].name).toBe('Zendaya');
  });

  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.statusCode).toBe(401);
  });

  it('updates the current user profile', async () => {
    const { accessToken } = await createUser();

    const res = await request(app)
      .patch('/api/v1/users/me')
      .set(authHeader(accessToken))
      .send({ name: 'Updated Name' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.name).toBe('Updated Name');
  });

  it('changes password and rejects an incorrect current password', async () => {
    const { accessToken } = await createUser({ email: 'pw@example.com' });

    const wrong = await request(app)
      .patch('/api/v1/users/me/password')
      .set(authHeader(accessToken))
      .send({ currentPassword: 'WrongPass1', newPassword: 'NewStrongPass1' });
    expect(wrong.statusCode).toBe(401);

    const right = await request(app)
      .patch('/api/v1/users/me/password')
      .set(authHeader(accessToken))
      .send({ currentPassword: 'StrongPass1', newPassword: 'NewStrongPass1' });
    expect(right.statusCode).toBe(200);

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pw@example.com', password: 'NewStrongPass1' });
    expect(login.statusCode).toBe(200);
  });

  it('uploads an avatar via the mocked Cloudinary service', async () => {
    const { accessToken } = await createUser();

    const res = await request(app)
      .post('/api/v1/users/me/avatar')
      .set(authHeader(accessToken))
      .attach('avatar', Buffer.from('fake-image-bytes'), {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.avatar.url).toBe('https://cdn.example.com/avatar.png');
  });

  it('deletes the previous avatar asset when a new one replaces it', async () => {
    const { accessToken } = await createUser({ email: 'reupload@example.com' });
    const { deleteAsset } = require('../services/cloudinaryService');

    await request(app)
      .post('/api/v1/users/me/avatar')
      .set(authHeader(accessToken))
      .attach('avatar', Buffer.from('first-image'), { filename: 'first.png', contentType: 'image/png' });
    expect(deleteAsset).not.toHaveBeenCalled();

    const res = await request(app)
      .post('/api/v1/users/me/avatar')
      .set(authHeader(accessToken))
      .attach('avatar', Buffer.from('second-image'), { filename: 'second.png', contentType: 'image/png' });

    expect(res.statusCode).toBe(200);
    expect(deleteAsset).toHaveBeenCalledWith('avatars/mock123', { resourceType: 'image' });
  });

  it('rejects an avatar upload with no file attached', async () => {
    const { accessToken } = await createUser({ email: 'no-file@example.com' });

    const res = await request(app).post('/api/v1/users/me/avatar').set(authHeader(accessToken));

    expect(res.statusCode).toBe(400);
  });

  it('rejects a role change from a non-admin', async () => {
    const { accessToken } = await createUser();
    const { user: target } = await createUser({ email: 'target@example.com' });

    const res = await request(app)
      .patch(`/api/v1/users/${target._id}/role`)
      .set(authHeader(accessToken))
      .send({ role: 'admin' });

    expect(res.statusCode).toBe(403);
  });

  it('allows an admin to change roles and deactivate/reactivate a user', async () => {
    const { accessToken: adminToken } = await createUser({ email: 'admin@example.com', role: 'admin' });
    const { user: target } = await createUser({ email: 'target2@example.com' });

    const roleRes = await request(app)
      .patch(`/api/v1/users/${target._id}/role`)
      .set(authHeader(adminToken))
      .send({ role: 'project_manager' });
    expect(roleRes.statusCode).toBe(200);
    expect(roleRes.body.data.user.role).toBe('project_manager');

    const statusRes = await request(app)
      .patch(`/api/v1/users/${target._id}/status`)
      .set(authHeader(adminToken))
      .send({ isActive: false });
    expect(statusRes.statusCode).toBe(200);
    expect(statusRes.body.data.user.isActive).toBe(false);
  });

  it('soft-deletes and restores a user (admin only)', async () => {
    const { accessToken: adminToken } = await createUser({ email: 'admin2@example.com', role: 'admin' });
    const { user: target } = await createUser({ email: 'target3@example.com' });

    const deleteRes = await request(app)
      .delete(`/api/v1/users/${target._id}`)
      .set(authHeader(adminToken));
    expect(deleteRes.statusCode).toBe(200);

    const getDeleted = await request(app)
      .get(`/api/v1/users/${target._id}`)
      .set(authHeader(adminToken));
    expect(getDeleted.statusCode).toBe(404);

    const restoreRes = await request(app)
      .post(`/api/v1/users/${target._id}/restore`)
      .set(authHeader(adminToken));
    expect(restoreRes.statusCode).toBe(200);

    const getRestored = await request(app)
      .get(`/api/v1/users/${target._id}`)
      .set(authHeader(adminToken));
    expect(getRestored.statusCode).toBe(200);
  });

  it('returns 404 when restoring a user that does not exist', async () => {
    const { accessToken: adminToken } = await createUser({ email: 'admin3@example.com', role: 'admin' });

    const res = await request(app)
      .post(`/api/v1/users/${new mongoose.Types.ObjectId()}/restore`)
      .set(authHeader(adminToken));

    expect(res.statusCode).toBe(404);
  });
});
