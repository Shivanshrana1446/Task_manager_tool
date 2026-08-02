const request = require('supertest');
const app = require('../app');
const Notification = require('../models/Notification');
const { setupTestDB, createUser, authHeader } = require('./helpers/testUtils');

setupTestDB();

describe('Notification APIs', () => {
  it('lists only the current user\'s notifications', async () => {
    const { user: recipient, accessToken } = await createUser({ email: 'recipient@example.com' });
    const { accessToken: otherToken } = await createUser({ email: 'other@example.com' });

    await Notification.create({
      recipient: recipient._id,
      type: 'task_assigned',
      title: 'Task assigned',
      message: 'You got a task',
    });

    const mine = await request(app).get('/api/v1/notifications').set(authHeader(accessToken));
    expect(mine.body.data.pagination.total).toBe(1);

    const others = await request(app).get('/api/v1/notifications').set(authHeader(otherToken));
    expect(others.body.data.pagination.total).toBe(0);
  });

  it('reports the unread count and marks notifications as read', async () => {
    const { user: recipient, accessToken } = await createUser({ email: 'recipient2@example.com' });

    const n1 = await Notification.create({
      recipient: recipient._id,
      type: 'task_assigned',
      title: 'One',
      message: 'One',
    });
    await Notification.create({
      recipient: recipient._id,
      type: 'task_assigned',
      title: 'Two',
      message: 'Two',
    });

    const countRes = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set(authHeader(accessToken));
    expect(countRes.body.data.count).toBe(2);

    const readRes = await request(app)
      .patch(`/api/v1/notifications/${n1._id}/read`)
      .set(authHeader(accessToken));
    expect(readRes.statusCode).toBe(200);
    expect(readRes.body.data.notification.isRead).toBe(true);

    const countAfter = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set(authHeader(accessToken));
    expect(countAfter.body.data.count).toBe(1);
  });

  it('marks all notifications as read in one call', async () => {
    const { user: recipient, accessToken } = await createUser({ email: 'recipient3@example.com' });
    await Notification.create([
      { recipient: recipient._id, type: 'task_assigned', title: 'A', message: 'A' },
      { recipient: recipient._id, type: 'task_assigned', title: 'B', message: 'B' },
    ]);

    const res = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set(authHeader(accessToken));
    expect(res.statusCode).toBe(200);

    const countRes = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set(authHeader(accessToken));
    expect(countRes.body.data.count).toBe(0);
  });

  it('cannot mark another user\'s notification as read', async () => {
    const { user: recipient } = await createUser({ email: 'recipient4@example.com' });
    const { accessToken: intruderToken } = await createUser({ email: 'intruder@example.com' });

    const notification = await Notification.create({
      recipient: recipient._id,
      type: 'task_assigned',
      title: 'Private',
      message: 'Private',
    });

    const res = await request(app)
      .patch(`/api/v1/notifications/${notification._id}/read`)
      .set(authHeader(intruderToken));
    expect(res.statusCode).toBe(404);
  });

  it('dismisses (soft-deletes) a notification', async () => {
    const { user: recipient, accessToken } = await createUser({ email: 'recipient5@example.com' });
    const notification = await Notification.create({
      recipient: recipient._id,
      type: 'task_assigned',
      title: 'Dismiss me',
      message: 'Dismiss me',
    });

    const res = await request(app)
      .delete(`/api/v1/notifications/${notification._id}`)
      .set(authHeader(accessToken));
    expect(res.statusCode).toBe(200);

    const list = await request(app).get('/api/v1/notifications').set(authHeader(accessToken));
    expect(list.body.data.pagination.total).toBe(0);
  });
});
