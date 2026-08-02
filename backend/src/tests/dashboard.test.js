const request = require('supertest');
const app = require('../app');
const { setupTestDB, createUser, authHeader } = require('./helpers/testUtils');

setupTestDB();

const createProject = async (ownerToken, body = { name: 'Dash Project' }) => {
  const res = await request(app).post('/api/v1/projects').set(authHeader(ownerToken)).send(body);
  return res.body.data.project;
};

const createTask = async (token, body) => {
  const res = await request(app).post('/api/v1/tasks').set(authHeader(token)).send(body);
  return res.body.data.task;
};

describe('Dashboard APIs', () => {
  it('returns a personal summary for a regular member', async () => {
    const { user, accessToken } = await createUser({ email: 'member@example.com' });
    const project = await createProject(accessToken);

    await createTask(accessToken, {
      title: 'Overdue task',
      project: project._id,
      assignees: [user._id.toString()],
      dueDate: '2000-01-01T00:00:00.000Z',
    });

    const res = await request(app).get('/api/v1/dashboard/summary').set(authHeader(accessToken));

    expect(res.statusCode).toBe(200);
    const { summary } = res.body.data;
    expect(summary.scope).toBe('member');
    expect(summary.cards.totalProjects).toBe(1);
    expect(summary.cards.overdueTasks).toBe(1);
    expect(summary.charts.taskStatus).toEqual(
      expect.arrayContaining([{ status: 'todo', count: 1 }])
    );
    expect(summary.charts.projectProgress[0].name).toBe('Dash Project');
    expect(summary.charts.monthlyProductivity).toHaveLength(6);
    expect(summary.charts.teamPerformance).toEqual([]);
  });

  it('tracks completed tasks in cards, project progress, and monthly productivity', async () => {
    const { user, accessToken } = await createUser({ email: 'doer@example.com' });
    const project = await createProject(accessToken, { name: 'Productive Project' });

    const task = await createTask(accessToken, {
      title: 'Ship feature',
      project: project._id,
      assignees: [user._id.toString()],
    });
    await request(app)
      .patch(`/api/v1/tasks/${task._id}`)
      .set(authHeader(accessToken))
      .send({ status: 'done' });

    const res = await request(app).get('/api/v1/dashboard/summary').set(authHeader(accessToken));
    const { summary } = res.body.data;

    expect(summary.cards.completedTasks).toBe(1);
    expect(summary.cards.pendingTasks).toBe(0);
    expect(summary.charts.projectProgress[0]).toMatchObject({
      name: 'Productive Project',
      totalTasks: 1,
      completedTasks: 1,
      progress: 100,
    });

    const currentMonthEntry = summary.charts.monthlyProductivity.at(-1);
    expect(currentMonthEntry.completed).toBe(1);
  });

  it('lists upcoming deadlines and recent comments scoped to the user', async () => {
    const { user, accessToken } = await createUser({ email: 'scoped@example.com' });
    const project = await createProject(accessToken, { name: 'Scoped Project' });

    const soonDue = new Date();
    soonDue.setDate(soonDue.getDate() + 2);

    const task = await createTask(accessToken, {
      title: 'Due soon',
      project: project._id,
      assignees: [user._id.toString()],
      dueDate: soonDue.toISOString(),
    });

    await request(app)
      .post('/api/v1/comments')
      .set(authHeader(accessToken))
      .send({ content: 'On track', task: task._id });

    const res = await request(app).get('/api/v1/dashboard/summary').set(authHeader(accessToken));
    const { summary } = res.body.data;

    expect(summary.feeds.upcomingDeadlines).toHaveLength(1);
    expect(summary.feeds.upcomingDeadlines[0].title).toBe('Due soon');
    expect(summary.feeds.recentComments).toHaveLength(1);
    expect(summary.feeds.recentComments[0].content).toBe('On track');
  });

  it('computes team performance for a project manager scoped to their projects', async () => {
    const { accessToken: pmToken } = await createUser({
      email: 'pm@example.com',
      role: 'project_manager',
    });
    const { user: member } = await createUser({ email: 'contributor@example.com' });
    const project = await createProject(pmToken, { name: 'Managed Project' });

    await request(app)
      .post(`/api/v1/projects/${project._id}/members`)
      .set(authHeader(pmToken))
      .send({ members: [member._id.toString()] });

    await createTask(pmToken, {
      title: 'Assigned task',
      project: project._id,
      assignees: [member._id.toString()],
    });

    const res = await request(app).get('/api/v1/dashboard/summary').set(authHeader(pmToken));
    const { summary } = res.body.data;

    expect(summary.charts.teamPerformance).toHaveLength(1);
    expect(summary.charts.teamPerformance[0]).toMatchObject({
      name: 'Test User',
      assigned: 1,
      completed: 0,
    });
  });

  it('returns an org-wide summary for an admin', async () => {
    const { accessToken: adminToken } = await createUser({ email: 'admin@example.com', role: 'admin' });
    await createUser({ email: 'someone@example.com' });

    const res = await request(app).get('/api/v1/dashboard/summary').set(authHeader(adminToken));

    expect(res.statusCode).toBe(200);
    expect(res.body.data.summary.scope).toBe('admin');
    expect(res.body.data.summary.cards.totalProjects).toBeGreaterThanOrEqual(0);
  });

  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/v1/dashboard/summary');
    expect(res.statusCode).toBe(401);
  });
});
