const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { io: ioClient } = require('socket.io-client');
const request = require('supertest');

const app = require('../app');
const { initSocket } = require('../socket');
const { createUser, authHeader } = require('./helpers/testUtils');

let mongoServer;
let httpServer;
let baseUrl;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  httpServer = http.createServer(app);
  initSocket(httpServer);

  await new Promise((resolve) => {
    httpServer.listen(0, resolve);
  });
  baseUrl = `http://localhost:${httpServer.address().port}`;
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await new Promise((resolve) => httpServer.close(resolve));
  await mongoose.disconnect();
  await mongoServer.stop();
});

const connectClient = (token) =>
  new Promise((resolve, reject) => {
    const socket = ioClient(baseUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
    });
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (err) => reject(err));
  });

describe('Socket.IO real-time notifications', () => {
  it('rejects a connection with no token', async () => {
    await expect(connectClient(undefined)).rejects.toThrow(/authentication required/i);
  });

  it('rejects a connection with an invalid token', async () => {
    await expect(connectClient('not-a-real-token')).rejects.toThrow(/invalid or expired token/i);
  });

  it('authenticates a connection with a valid access token', async () => {
    const { accessToken } = await createUser({ email: 'socket-user@example.com' });

    const socket = await connectClient(accessToken);
    expect(socket.connected).toBe(true);
    socket.disconnect();
  });

  it('delivers a real-time notification when a task is assigned', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner-socket@example.com' });
    const { user: assignee, accessToken: assigneeToken } = await createUser({
      email: 'assignee-socket@example.com',
    });

    const projectRes = await request(app)
      .post('/api/v1/projects')
      .set(authHeader(ownerToken))
      .send({ name: 'Realtime Project' });
    const projectId = projectRes.body.data.project._id;

    await request(app)
      .post(`/api/v1/projects/${projectId}/members`)
      .set(authHeader(ownerToken))
      .send({ members: [assignee._id.toString()] });

    const assigneeSocket = await connectClient(assigneeToken);
    const notificationPromise = new Promise((resolve) => {
      assigneeSocket.once('notification:new', resolve);
    });

    await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(ownerToken))
      .send({
        title: 'Real-time task',
        project: projectId,
        assignees: [assignee._id.toString()],
      });

    const notification = await notificationPromise;
    expect(notification.type).toBe('task_assigned');
    expect(notification.recipient).toBe(assignee._id.toString());

    assigneeSocket.disconnect();
  });

  it('notifies other tabs when a notification is marked as read', async () => {
    const { user: recipient, accessToken } = await createUser({ email: 'multi-tab@example.com' });

    const Notification = require('../models/Notification');
    const notification = await Notification.create({
      recipient: recipient._id,
      type: 'task_assigned',
      title: 'Test',
      message: 'Test message',
    });

    const socket = await connectClient(accessToken);
    const readPromise = new Promise((resolve) => {
      socket.once('notification:read', resolve);
    });

    await request(app)
      .patch(`/api/v1/notifications/${notification._id}/read`)
      .set(authHeader(accessToken));

    const payload = await readPromise;
    expect(payload.id).toBe(notification._id.toString());

    socket.disconnect();
  });
});
