const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const { setupTestDB, createUser, authHeader } = require('./helpers/testUtils');

setupTestDB();

const setupProjectAndTask = async (ownerToken) => {
  const projectRes = await request(app)
    .post('/api/v1/projects')
    .set(authHeader(ownerToken))
    .send({ name: 'Comment Project' });
  const project = projectRes.body.data.project;

  const taskRes = await request(app)
    .post('/api/v1/tasks')
    .set(authHeader(ownerToken))
    .send({ title: 'Comment Task', project: project._id });

  return { project, task: taskRes.body.data.task };
};

describe('Comment APIs', () => {
  it('adds a comment to a task and notifies the reporter/assignees', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner@example.com' });
    const { user: member, accessToken: memberToken } = await createUser({ email: 'member@example.com' });
    const { project, task } = await setupProjectAndTask(ownerToken);

    await request(app)
      .post(`/api/v1/projects/${project._id}/members`)
      .set(authHeader(ownerToken))
      .send({ members: [member._id.toString()] });

    const res = await request(app)
      .post('/api/v1/comments')
      .set(authHeader(memberToken))
      .send({ content: 'Looks good to me', task: task._id });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.comment.content).toBe('Looks good to me');

    const ownerNotifications = await request(app)
      .get('/api/v1/notifications')
      .set(authHeader(ownerToken));
    expect(ownerNotifications.body.data.notifications.some((n) => n.type === 'comment_added')).toBe(
      true
    );
  });

  it('notifies mentioned users', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner2@example.com' });
    const { user: mentioned, accessToken: mentionedToken } = await createUser({ email: 'mentioned@example.com' });
    const { project, task } = await setupProjectAndTask(ownerToken);

    await request(app)
      .post(`/api/v1/projects/${project._id}/members`)
      .set(authHeader(ownerToken))
      .send({ members: [mentioned._id.toString()] });

    await request(app)
      .post('/api/v1/comments')
      .set(authHeader(ownerToken))
      .send({ content: 'cc @teammate', task: task._id, mentions: [mentioned._id.toString()] });

    const notifications = await request(app)
      .get('/api/v1/notifications')
      .set(authHeader(mentionedToken));
    expect(notifications.body.data.notifications.some((n) => n.type === 'mention')).toBe(true);
  });

  it('rejects comment access for non-project-members', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner3@example.com' });
    const { accessToken: outsiderToken } = await createUser({ email: 'outsider@example.com' });
    const { task } = await setupProjectAndTask(ownerToken);

    const res = await request(app)
      .post('/api/v1/comments')
      .set(authHeader(outsiderToken))
      .send({ content: 'Not allowed', task: task._id });

    expect(res.statusCode).toBe(403);
  });

  it('only allows the author to edit or delete a comment', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner4@example.com' });
    const { accessToken: authorToken } = await createUser({ email: 'author@example.com' });
    const { project, task } = await setupProjectAndTask(ownerToken);

    const authorRes = await request(app)
      .post(`/api/v1/projects/${project._id}/members`)
      .set(authHeader(ownerToken))
      .send({ members: [] });
    void authorRes;

    const created = await request(app)
      .post('/api/v1/comments')
      .set(authHeader(ownerToken))
      .send({ content: 'Original comment', task: task._id });
    const commentId = created.body.data.comment._id;

    const deniedEdit = await request(app)
      .patch(`/api/v1/comments/${commentId}`)
      .set(authHeader(authorToken))
      .send({ content: 'Hijacked' });
    expect(deniedEdit.statusCode).toBe(403);

    const allowedEdit = await request(app)
      .patch(`/api/v1/comments/${commentId}`)
      .set(authHeader(ownerToken))
      .send({ content: 'Edited comment' });
    expect(allowedEdit.statusCode).toBe(200);
    expect(allowedEdit.body.data.comment.isEdited).toBe(true);

    const deleteRes = await request(app)
      .delete(`/api/v1/comments/${commentId}`)
      .set(authHeader(ownerToken));
    expect(deleteRes.statusCode).toBe(200);
  });

  it('returns 404 for a non-existent comment', async () => {
    const { accessToken } = await createUser({ email: 'owner6@example.com' });

    const res = await request(app)
      .get(`/api/v1/comments/${new mongoose.Types.ObjectId()}`)
      .set(authHeader(accessToken));

    expect(res.statusCode).toBe(404);
  });

  it('denies a non-project-member from viewing a single comment', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner7@example.com' });
    const { accessToken: outsiderToken } = await createUser({ email: 'outsider2@example.com' });
    const { task } = await setupProjectAndTask(ownerToken);

    const created = await request(app)
      .post('/api/v1/comments')
      .set(authHeader(ownerToken))
      .send({ content: 'Private note', task: task._id });
    const commentId = created.body.data.comment._id;

    const res = await request(app)
      .get(`/api/v1/comments/${commentId}`)
      .set(authHeader(outsiderToken));

    expect(res.statusCode).toBe(403);
  });

  it('supports threaded replies', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner5@example.com' });
    const { task } = await setupProjectAndTask(ownerToken);

    const parent = await request(app)
      .post('/api/v1/comments')
      .set(authHeader(ownerToken))
      .send({ content: 'Parent comment', task: task._id });

    const reply = await request(app)
      .post('/api/v1/comments')
      .set(authHeader(ownerToken))
      .send({ content: 'Reply comment', task: task._id, parentComment: parent.body.data.comment._id });
    expect(reply.statusCode).toBe(201);

    const list = await request(app)
      .get(`/api/v1/comments?task=${task._id}`)
      .set(authHeader(ownerToken));
    expect(list.body.data.pagination.total).toBe(2);
  });
});
