const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { setupTestDB, createUser, authHeader } = require('./helpers/testUtils');

setupTestDB();

describe('Project APIs', () => {
  it('creates a project with the creator as owner', async () => {
    const { accessToken } = await createUser({ email: 'owner@example.com' });

    const res = await request(app)
      .post('/api/v1/projects')
      .set(authHeader(accessToken))
      .send({ name: 'Apollo', description: 'Moon mission' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.project.name).toBe('Apollo');
  });

  it('rejects a project name that is too short', async () => {
    const { accessToken } = await createUser();

    const res = await request(app)
      .post('/api/v1/projects')
      .set(authHeader(accessToken))
      .send({ name: 'ab' });

    expect(res.statusCode).toBe(422);
  });

  it('only lists projects the user owns or is a member of', async () => {
    const { user: owner, accessToken: ownerToken } = await createUser({ email: 'owner2@example.com' });
    const { accessToken: outsiderToken } = await createUser({ email: 'outsider@example.com' });

    await request(app)
      .post('/api/v1/projects')
      .set(authHeader(ownerToken))
      .send({ name: 'Private Project' });

    const ownerList = await request(app).get('/api/v1/projects').set(authHeader(ownerToken));
    expect(ownerList.body.data.pagination.total).toBe(1);

    const outsiderList = await request(app).get('/api/v1/projects').set(authHeader(outsiderToken));
    expect(outsiderList.body.data.pagination.total).toBe(0);

    void owner;
  });

  it('denies access to a project for a non-member', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner3@example.com' });
    const { accessToken: outsiderToken } = await createUser({ email: 'outsider2@example.com' });

    const created = await request(app)
      .post('/api/v1/projects')
      .set(authHeader(ownerToken))
      .send({ name: 'Guarded Project' });

    const res = await request(app)
      .get(`/api/v1/projects/${created.body.data.project._id}`)
      .set(authHeader(outsiderToken));

    expect(res.statusCode).toBe(403);
  });

  it('adds and removes members, and members gain read access', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner4@example.com' });
    const { user: member, accessToken: memberToken } = await createUser({ email: 'member@example.com' });

    const created = await request(app)
      .post('/api/v1/projects')
      .set(authHeader(ownerToken))
      .send({ name: 'Team Project' });
    const projectId = created.body.data.project._id;

    const addRes = await request(app)
      .post(`/api/v1/projects/${projectId}/members`)
      .set(authHeader(ownerToken))
      .send({ members: [member._id.toString()] });
    expect(addRes.statusCode).toBe(200);
    expect(addRes.body.data.project.members).toContain(member._id.toString());

    const memberView = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set(authHeader(memberToken));
    expect(memberView.statusCode).toBe(200);

    const removeRes = await request(app)
      .delete(`/api/v1/projects/${projectId}/members/${member._id}`)
      .set(authHeader(ownerToken));
    expect(removeRes.statusCode).toBe(200);
    expect(removeRes.body.data.project.members).not.toContain(member._id.toString());
  });

  it('prevents a non-owner from updating or deleting a project', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner5@example.com' });
    const { accessToken: memberToken } = await createUser({ email: 'member2@example.com' });

    const created = await request(app)
      .post('/api/v1/projects')
      .set(authHeader(ownerToken))
      .send({ name: 'Locked Project' });
    const projectId = created.body.data.project._id;

    await request(app)
      .post(`/api/v1/projects/${projectId}/members`)
      .set(authHeader(ownerToken))
      .send({ members: [] });

    const updateRes = await request(app)
      .patch(`/api/v1/projects/${projectId}`)
      .set(authHeader(memberToken))
      .send({ name: 'Hijacked' });
    expect(updateRes.statusCode).toBe(403);

    const deleteRes = await request(app)
      .delete(`/api/v1/projects/${projectId}`)
      .set(authHeader(memberToken));
    expect(deleteRes.statusCode).toBe(403);
  });

  it('soft-deletes and restores a project', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner6@example.com' });

    const created = await request(app)
      .post('/api/v1/projects')
      .set(authHeader(ownerToken))
      .send({ name: 'Disposable Project' });
    const projectId = created.body.data.project._id;

    const deleteRes = await request(app)
      .delete(`/api/v1/projects/${projectId}`)
      .set(authHeader(ownerToken));
    expect(deleteRes.statusCode).toBe(200);

    const getDeleted = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set(authHeader(ownerToken));
    expect(getDeleted.statusCode).toBe(404);

    const restoreRes = await request(app)
      .post(`/api/v1/projects/${projectId}/restore`)
      .set(authHeader(ownerToken));
    expect(restoreRes.statusCode).toBe(200);
  });

  it('returns 404 when restoring a project that does not exist', async () => {
    const { accessToken } = await createUser({ email: 'owner6b@example.com' });

    const res = await request(app)
      .post(`/api/v1/projects/${new mongoose.Types.ObjectId()}/restore`)
      .set(authHeader(accessToken));

    expect(res.statusCode).toBe(404);
  });

  it('reassigns the project manager, keeps the old owner as a member, and notifies the new manager', async () => {
    const { user: owner, accessToken: ownerToken } = await createUser({ email: 'owner7@example.com' });
    const { user: newManager } = await createUser({ email: 'newmanager@example.com' });

    const created = await request(app)
      .post('/api/v1/projects')
      .set(authHeader(ownerToken))
      .send({ name: 'Handoff Project' });
    const projectId = created.body.data.project._id;

    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/manager`)
      .set(authHeader(ownerToken))
      .send({ owner: newManager._id.toString() });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.project.owner).toBe(newManager._id.toString());
    expect(res.body.data.project.members).toContain(owner._id.toString());

    const notification = await Notification.findOne({ recipient: newManager._id });
    expect(notification).not.toBeNull();
    expect(notification.type).toBe('project_manager_assigned');
  });

  it('reassigns the manager to an existing member, who is swapped out for the old owner', async () => {
    const { user: owner, accessToken: ownerToken } = await createUser({ email: 'owner7b@example.com' });
    const { user: member1 } = await createUser({ email: 'member7a@example.com' });
    const { user: member2 } = await createUser({ email: 'member7b@example.com' });

    const created = await request(app)
      .post('/api/v1/projects')
      .set(authHeader(ownerToken))
      .send({ name: 'Handoff With Members' });
    const projectId = created.body.data.project._id;

    await request(app)
      .post(`/api/v1/projects/${projectId}/members`)
      .set(authHeader(ownerToken))
      .send({ members: [member1._id.toString(), member2._id.toString()] });

    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/manager`)
      .set(authHeader(ownerToken))
      .send({ owner: member1._id.toString() });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.project.owner).toBe(member1._id.toString());
    expect(res.body.data.project.members).toContain(owner._id.toString());
    expect(res.body.data.project.members).toContain(member2._id.toString());
    expect(res.body.data.project.members).not.toContain(member1._id.toString());
  });

  it('is a no-op when reassigning the manager to the current owner', async () => {
    const { user: owner, accessToken: ownerToken } = await createUser({ email: 'owner7c@example.com' });

    const created = await request(app)
      .post('/api/v1/projects')
      .set(authHeader(ownerToken))
      .send({ name: 'Self Handoff' });
    const projectId = created.body.data.project._id;

    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/manager`)
      .set(authHeader(ownerToken))
      .send({ owner: owner._id.toString() });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.project.owner).toBe(owner._id.toString());

    const notification = await Notification.findOne({ recipient: owner._id, type: 'project_manager_assigned' });
    expect(notification).toBeNull();
  });

  it('only the current owner or admin can reassign the project manager', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner8@example.com' });
    const { accessToken: outsiderToken } = await createUser({ email: 'outsider3@example.com' });
    const { user: candidate } = await createUser({ email: 'candidate@example.com' });

    const created = await request(app)
      .post('/api/v1/projects')
      .set(authHeader(ownerToken))
      .send({ name: 'Restricted Handoff' });
    const projectId = created.body.data.project._id;

    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/manager`)
      .set(authHeader(outsiderToken))
      .send({ owner: candidate._id.toString() });

    expect(res.statusCode).toBe(403);
  });

  it('includes task progress stats on list and detail responses', async () => {
    const { user: owner, accessToken: ownerToken } = await createUser({ email: 'owner9@example.com' });

    const created = await request(app)
      .post('/api/v1/projects')
      .set(authHeader(ownerToken))
      .send({ name: 'Stats Project' });
    const projectId = created.body.data.project._id;

    await Task.create([
      { title: 'Task A', project: projectId, reporter: owner._id, status: 'done' },
      { title: 'Task B', project: projectId, reporter: owner._id, status: 'todo' },
    ]);

    const listRes = await request(app).get('/api/v1/projects').set(authHeader(ownerToken));
    const listed = listRes.body.data.projects.find((p) => p._id === projectId);
    expect(listed.taskStats).toMatchObject({ total: 2, completed: 1, progress: 50 });
    expect(listed.taskStats.byStatus).toMatchObject({ done: 1, todo: 1 });

    const detailRes = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set(authHeader(ownerToken));
    expect(detailRes.body.data.project.taskStats).toMatchObject({
      total: 2,
      completed: 1,
      progress: 50,
    });
  });

  it('notifies members (but not the actor) when a project is updated', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner10@example.com' });
    const { user: member, accessToken: memberToken } = await createUser({
      email: 'member10@example.com',
    });

    const created = await request(app)
      .post('/api/v1/projects')
      .set(authHeader(ownerToken))
      .send({ name: 'Notify Project' });
    const projectId = created.body.data.project._id;

    await request(app)
      .post(`/api/v1/projects/${projectId}/members`)
      .set(authHeader(ownerToken))
      .send({ members: [member._id.toString()] });

    const updateRes = await request(app)
      .patch(`/api/v1/projects/${projectId}`)
      .set(authHeader(ownerToken))
      .send({ description: 'New scope' });
    expect(updateRes.statusCode).toBe(200);

    const memberNotifications = await request(app)
      .get('/api/v1/notifications')
      .set(authHeader(memberToken));
    expect(
      memberNotifications.body.data.notifications.some((n) => n.type === 'project_updated')
    ).toBe(true);

    const ownerNotification = await Notification.findOne({
      recipient: created.body.data.project.owner,
      type: 'project_updated',
    });
    expect(ownerNotification).toBeNull();
  });
});
