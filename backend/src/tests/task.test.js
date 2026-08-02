const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const { setupTestDB, createUser, authHeader } = require('./helpers/testUtils');

setupTestDB();

const createProject = async (ownerToken, body = { name: 'Test Project' }) => {
  const res = await request(app).post('/api/v1/projects').set(authHeader(ownerToken)).send(body);
  return res.body.data.project;
};

describe('Task APIs', () => {
  it('creates a task for a project the user belongs to', async () => {
    const { accessToken } = await createUser({ email: 'owner@example.com' });
    const project = await createProject(accessToken);

    const res = await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(accessToken))
      .send({ title: 'Design landing page', project: project._id });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.task.title).toBe('Design landing page');
    expect(res.body.data.task.status).toBe('todo');
  });

  it('rejects task creation for a project the user cannot access', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner2@example.com' });
    const { accessToken: outsiderToken } = await createUser({ email: 'outsider@example.com' });
    const project = await createProject(ownerToken);

    const res = await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(outsiderToken))
      .send({ title: 'Sneaky task', project: project._id });

    expect(res.statusCode).toBe(403);
  });

  it('filters tasks by project, status, and search, and paginates', async () => {
    const { accessToken } = await createUser({ email: 'owner3@example.com' });
    const project = await createProject(accessToken);

    await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(accessToken))
      .send({ title: 'Write specs', project: project._id, status: 'in_progress' });
    await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(accessToken))
      .send({ title: 'Review specs', project: project._id, status: 'todo' });

    const filtered = await request(app)
      .get(`/api/v1/tasks?project=${project._id}&status=in_progress`)
      .set(authHeader(accessToken));
    expect(filtered.body.data.tasks).toHaveLength(1);
    expect(filtered.body.data.tasks[0].title).toBe('Write specs');

    const searched = await request(app)
      .get('/api/v1/tasks?search=Review')
      .set(authHeader(accessToken));
    expect(searched.body.data.tasks).toHaveLength(1);
  });

  it('filters tasks by a due date range', async () => {
    const { accessToken } = await createUser({ email: 'owner3b@example.com' });
    const project = await createProject(accessToken);

    await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(accessToken))
      .send({ title: 'Due early', project: project._id, dueDate: '2026-01-05T00:00:00.000Z' });
    await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(accessToken))
      .send({ title: 'Due late', project: project._id, dueDate: '2026-06-15T00:00:00.000Z' });

    const before = await request(app)
      .get('/api/v1/tasks?dueBefore=2026-03-01T00:00:00.000Z')
      .set(authHeader(accessToken));
    expect(before.body.data.tasks.map((t) => t.title)).toEqual(['Due early']);

    const after = await request(app)
      .get('/api/v1/tasks?dueAfter=2026-03-01T00:00:00.000Z')
      .set(authHeader(accessToken));
    expect(after.body.data.tasks.map((t) => t.title)).toEqual(['Due late']);

    const between = await request(app)
      .get('/api/v1/tasks?dueAfter=2026-01-01T00:00:00.000Z&dueBefore=2026-12-31T00:00:00.000Z')
      .set(authHeader(accessToken));
    expect(between.body.data.tasks).toHaveLength(2);
  });

  it('rejects listing tasks filtered by a project the user cannot access', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner3c@example.com' });
    const { accessToken: outsiderToken } = await createUser({ email: 'outsider1b@example.com' });
    const project = await createProject(ownerToken);

    const res = await request(app)
      .get(`/api/v1/tasks?project=${project._id}`)
      .set(authHeader(outsiderToken));

    expect(res.statusCode).toBe(403);
  });

  it('returns 404 when restoring a task that does not exist', async () => {
    const { accessToken: adminToken } = await createUser({ email: 'admin1b@example.com', role: 'admin' });

    const res = await request(app)
      .post(`/api/v1/tasks/${new mongoose.Types.ObjectId()}/restore`)
      .set(authHeader(adminToken));

    expect(res.statusCode).toBe(404);
  });

  it('only allows assignee, reporter, project owner, or admin to update a task', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner4@example.com' });
    const { accessToken: outsiderToken } = await createUser({ email: 'outsider2@example.com' });
    const project = await createProject(ownerToken);

    const created = await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(ownerToken))
      .send({ title: 'Protected task', project: project._id });
    const taskId = created.body.data.task._id;

    const denied = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set(authHeader(outsiderToken))
      .send({ title: 'Hijacked' });
    expect(denied.statusCode).toBe(403);

    const allowed = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set(authHeader(ownerToken))
      .send({ title: 'Updated title' });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.body.data.task.title).toBe('Updated title');
  });

  it('notifies newly assigned users and records a status_change audit entry', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner5@example.com' });
    const { user: assignee, accessToken: assigneeToken } = await createUser({ email: 'assignee@example.com' });
    const project = await createProject(ownerToken);

    await request(app)
      .post(`/api/v1/projects/${project._id}/members`)
      .set(authHeader(ownerToken))
      .send({ members: [assignee._id.toString()] });

    const created = await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(ownerToken))
      .send({ title: 'Assign me', project: project._id });
    const taskId = created.body.data.task._id;

    await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set(authHeader(ownerToken))
      .send({ assignees: [assignee._id.toString()], status: 'in_progress' });

    const notifications = await request(app)
      .get('/api/v1/notifications')
      .set(authHeader(assigneeToken));

    const types = notifications.body.data.notifications.map((n) => n.type);
    expect(types).toEqual(expect.arrayContaining(['task_assigned', 'task_updated']));
  });

  it('soft-deletes a task (project owner only) and admin can restore it', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner6@example.com' });
    const { accessToken: adminToken } = await createUser({ email: 'admin@example.com', role: 'admin' });
    const project = await createProject(ownerToken);

    const created = await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(ownerToken))
      .send({ title: 'Disposable task', project: project._id });
    const taskId = created.body.data.task._id;

    const deleteRes = await request(app)
      .delete(`/api/v1/tasks/${taskId}`)
      .set(authHeader(ownerToken));
    expect(deleteRes.statusCode).toBe(200);

    const getDeleted = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set(authHeader(ownerToken));
    expect(getDeleted.statusCode).toBe(404);

    const restoreRes = await request(app)
      .post(`/api/v1/tasks/${taskId}/restore`)
      .set(authHeader(adminToken));
    expect(restoreRes.statusCode).toBe(200);
  });

  it('supports creating a subtask under a parent task', async () => {
    const { accessToken } = await createUser({ email: 'owner7@example.com' });
    const project = await createProject(accessToken);

    const parent = await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(accessToken))
      .send({ title: 'Parent task', project: project._id });

    const child = await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(accessToken))
      .send({ title: 'Child task', project: project._id, parentTask: parent.body.data.task._id });
    expect(child.statusCode).toBe(201);

    const list = await request(app)
      .get(`/api/v1/tasks?parentTask=${parent.body.data.task._id}`)
      .set(authHeader(accessToken));
    expect(list.body.data.tasks).toHaveLength(1);
    expect(list.body.data.tasks[0].title).toBe('Child task');
  });

  it('lets a project manager who is a member (not owner) manage any task in that project', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'pmowner@example.com' });
    const { user: manager, accessToken: managerToken } = await createUser({
      email: 'pmmember@example.com',
      role: 'project_manager',
    });
    const { user: assignee } = await createUser({ email: 'pmassignee@example.com' });
    const project = await createProject(ownerToken);
    await request(app)
      .post(`/api/v1/projects/${project._id}/members`)
      .set(authHeader(ownerToken))
      .send({ members: [manager._id.toString(), assignee._id.toString()] });

    const created = await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(ownerToken))
      .send({ title: 'PM-managed task', project: project._id });
    const taskId = created.body.data.task._id;

    const assignRes = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set(authHeader(managerToken))
      .send({ assignees: [assignee._id.toString()] });
    expect(assignRes.statusCode).toBe(200);
    expect(assignRes.body.data.task.assignees[0]._id).toBe(assignee._id.toString());

    const deleteRes = await request(app)
      .delete(`/api/v1/tasks/${taskId}`)
      .set(authHeader(managerToken));
    expect(deleteRes.statusCode).toBe(200);
  });

  it('records a chronological history of changes for a task', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner8@example.com' });
    const { accessToken: outsiderToken } = await createUser({ email: 'outsider3@example.com' });
    const project = await createProject(ownerToken);

    const created = await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(ownerToken))
      .send({ title: 'Tracked task', project: project._id });
    const taskId = created.body.data.task._id;

    await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set(authHeader(ownerToken))
      .send({ status: 'in_progress' });

    const history = await request(app)
      .get(`/api/v1/tasks/${taskId}/history`)
      .set(authHeader(ownerToken));

    expect(history.statusCode).toBe(200);
    expect(history.body.data.history).toHaveLength(2);
    expect(history.body.data.history[0].action).toBe('create');
    expect(history.body.data.history[1].action).toBe('status_change');
    expect(history.body.data.history[1].user.name).toBeDefined();

    const denied = await request(app)
      .get(`/api/v1/tasks/${taskId}/history`)
      .set(authHeader(outsiderToken));
    expect(denied.statusCode).toBe(403);
  });

  it('accepts the testing status and stores/updates a checklist', async () => {
    const { accessToken } = await createUser({ email: 'owner11@example.com' });
    const project = await createProject(accessToken);

    const created = await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(accessToken))
      .send({
        title: 'Checklist task',
        project: project._id,
        status: 'testing',
        checklist: [{ text: 'Write tests' }, { text: 'Update docs', isDone: true }],
      });

    expect(created.statusCode).toBe(201);
    expect(created.body.data.task.status).toBe('testing');
    expect(created.body.data.task.checklist).toHaveLength(2);
    expect(created.body.data.task.checklist[0]).toMatchObject({ text: 'Write tests', isDone: false });
    expect(created.body.data.task.checklist[1]).toMatchObject({ text: 'Update docs', isDone: true });

    const taskId = created.body.data.task._id;
    const itemId = created.body.data.task.checklist[0]._id;

    const updated = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set(authHeader(accessToken))
      .send({
        checklist: [
          { _id: itemId, text: 'Write tests', isDone: true },
          { text: 'Update docs', isDone: true },
        ],
      });

    expect(updated.statusCode).toBe(200);
    expect(updated.body.data.task.checklist.find((item) => item._id === itemId).isDone).toBe(true);
  });

  describe('Bulk task operations', () => {
    it('bulk-updates the status of tasks the caller can write to, skipping the rest', async () => {
      const { accessToken: ownerToken } = await createUser({ email: 'bulkowner1@example.com' });
      const { accessToken: outsiderToken } = await createUser({ email: 'bulkoutsider1@example.com' });
      const project = await createProject(ownerToken);
      const outsiderProject = await createProject(outsiderToken, { name: 'Outsider project' });

      const ownTask = await request(app)
        .post('/api/v1/tasks')
        .set(authHeader(ownerToken))
        .send({ title: 'Owner task', project: project._id });
      const foreignTask = await request(app)
        .post('/api/v1/tasks')
        .set(authHeader(outsiderToken))
        .send({ title: 'Outsider task', project: outsiderProject._id });

      const res = await request(app)
        .patch('/api/v1/tasks/bulk')
        .set(authHeader(ownerToken))
        .send({
          ids: [ownTask.body.data.task._id, foreignTask.body.data.task._id],
          status: 'in_review',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.updatedCount).toBe(1);
      expect(res.body.data.skippedCount).toBe(1);

      const check = await request(app)
        .get(`/api/v1/tasks/${ownTask.body.data.task._id}`)
        .set(authHeader(ownerToken));
      expect(check.body.data.task.status).toBe('in_review');

      const untouched = await request(app)
        .get(`/api/v1/tasks/${foreignTask.body.data.task._id}`)
        .set(authHeader(outsiderToken));
      expect(untouched.body.data.task.status).toBe('todo');
    });

    it('bulk-deletes tasks only the project owner/admin can manage', async () => {
      const { accessToken: ownerToken } = await createUser({ email: 'bulkowner2@example.com' });
      const { user: memberUser, accessToken: memberToken } = await createUser({
        email: 'bulkmember2@example.com',
      });
      const project = await createProject(ownerToken);
      await request(app)
        .post(`/api/v1/projects/${project._id}/members`)
        .set(authHeader(ownerToken))
        .send({ members: [memberUser._id.toString()] });

      const task = await request(app)
        .post('/api/v1/tasks')
        .set(authHeader(ownerToken))
        .send({ title: 'To be bulk-deleted', project: project._id });

      const deniedRes = await request(app)
        .delete('/api/v1/tasks/bulk')
        .set(authHeader(memberToken))
        .send({ ids: [task.body.data.task._id] });
      expect(deniedRes.body.data.deletedCount).toBe(0);
      expect(deniedRes.body.data.skippedCount).toBe(1);

      const res = await request(app)
        .delete('/api/v1/tasks/bulk')
        .set(authHeader(ownerToken))
        .send({ ids: [task.body.data.task._id] });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.deletedCount).toBe(1);

      const getDeleted = await request(app)
        .get(`/api/v1/tasks/${task.body.data.task._id}`)
        .set(authHeader(ownerToken));
      expect(getDeleted.statusCode).toBe(404);
    });

    it('rejects an empty ids array', async () => {
      const { accessToken } = await createUser({ email: 'bulkowner3@example.com' });

      const res = await request(app)
        .patch('/api/v1/tasks/bulk')
        .set(authHeader(accessToken))
        .send({ ids: [], status: 'done' });

      expect(res.statusCode).toBe(422);
    });
  });
});
