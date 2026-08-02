const request = require('supertest');
const app = require('../app');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { setupTestDB, createUser, authHeader } = require('./helpers/testUtils');

setupTestDB();

describe('Admin APIs', () => {
  describe('RBAC', () => {
    it('rejects non-admins from every admin endpoint', async () => {
      const { accessToken } = await createUser({ email: 'member-rbac@example.com' });

      const endpoints = ['/api/v1/admin/audit-logs', '/api/v1/admin/analytics', '/api/v1/admin/system-health', '/api/v1/admin/roles'];

      for (const endpoint of endpoints) {
        // eslint-disable-next-line no-await-in-loop
        const res = await request(app).get(endpoint).set(authHeader(accessToken));
        expect(res.statusCode).toBe(403);
      }
    });
  });

  describe('Audit logs', () => {
    it('lists audit logs and filters by entityType and action', async () => {
      const { accessToken: adminToken } = await createUser({ email: 'admin-audit@example.com', role: 'admin' });

      await request(app)
        .post('/api/v1/projects')
        .set(authHeader(adminToken))
        .send({ name: 'Audited Project' });

      const res = await request(app)
        .get('/api/v1/admin/audit-logs?entityType=Project&action=create')
        .set(authHeader(adminToken));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.logs.length).toBeGreaterThan(0);
      expect(res.body.data.logs[0].entityType).toBe('Project');
      expect(res.body.data.logs[0].action).toBe('create');
      expect(res.body.data.pagination.total).toBeGreaterThan(0);
    });
  });

  describe('Analytics', () => {
    it('returns overview cards and chart data', async () => {
      const { user: admin, accessToken: adminToken } = await createUser({
        email: 'admin-analytics@example.com',
        role: 'admin',
      });

      const project = await Project.create({ name: 'Analytics Project', owner: admin._id, status: 'active' });
      await Task.create({
        title: 'Done task',
        project: project._id,
        reporter: admin._id,
        assignees: [admin._id],
        status: 'done',
        completedAt: new Date(),
      });
      await Task.create({
        title: 'Todo task',
        project: project._id,
        reporter: admin._id,
        assignees: [admin._id],
        status: 'todo',
      });

      const res = await request(app).get('/api/v1/admin/analytics').set(authHeader(adminToken));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.cards.totalProjects).toBeGreaterThanOrEqual(1);
      expect(res.body.data.cards.totalTasks).toBeGreaterThanOrEqual(2);
      expect(res.body.data.charts.usersByRole.find((r) => r.role === 'admin').count).toBeGreaterThanOrEqual(1);
      expect(res.body.data.charts.tasksByStatus.find((t) => t.status === 'done').count).toBeGreaterThanOrEqual(1);
      expect(res.body.data.charts.monthlyUserGrowth).toHaveLength(6);
      expect(res.body.data.charts.topContributors[0].completed).toBeGreaterThanOrEqual(1);
    });
  });

  describe('System health', () => {
    it('reports server, memory, and database status', async () => {
      const { accessToken: adminToken } = await createUser({ email: 'admin-health@example.com', role: 'admin' });

      const res = await request(app).get('/api/v1/admin/system-health').set(authHeader(adminToken));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.database.status).toBe('connected');
      expect(res.body.data.node.version).toMatch(/^v/);
      expect(typeof res.body.data.memory.rssMB).toBe('number');
    });
  });

  describe('Roles', () => {
    it('returns role definitions with live user counts', async () => {
      const { accessToken: adminToken } = await createUser({ email: 'admin-roles@example.com', role: 'admin' });
      await createUser({ email: 'pm-roles@example.com', role: 'project_manager' });

      const res = await request(app).get('/api/v1/admin/roles').set(authHeader(adminToken));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.roles).toHaveLength(3);
      const adminRole = res.body.data.roles.find((r) => r.role === 'admin');
      expect(adminRole.userCount).toBeGreaterThanOrEqual(1);
      expect(adminRole.label).toBe('Administrator');
      const pmRole = res.body.data.roles.find((r) => r.role === 'project_manager');
      expect(pmRole.userCount).toBeGreaterThanOrEqual(1);
    });
  });
});
