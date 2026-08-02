const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const AuditLog = require('../models/AuditLog');
const { setupTestDB, createUser, authHeader } = require('./helpers/testUtils');

setupTestDB();

describe('Team APIs', () => {
  it('rejects team creation from a non-admin', async () => {
    const { user: lead, accessToken } = await createUser({ email: 'lead@example.com' });

    const res = await request(app)
      .post('/api/v1/teams')
      .set(authHeader(accessToken))
      .send({ name: 'Rocketeers', lead: lead._id.toString() });

    expect(res.statusCode).toBe(403);
  });

  it('creates a team and records an audit log entry', async () => {
    const { accessToken: adminToken } = await createUser({ email: 'admin1@example.com', role: 'admin' });
    const { user: lead } = await createUser({ email: 'lead2@example.com' });
    const { user: member } = await createUser({ email: 'member1@example.com' });

    const res = await request(app)
      .post('/api/v1/teams')
      .set(authHeader(adminToken))
      .send({ name: 'Rocketeers', description: 'Launch team', lead: lead._id.toString(), members: [member._id.toString()] });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.team.name).toBe('Rocketeers');
    expect(res.body.data.team.members).toHaveLength(1);

    const audit = await AuditLog.findOne({ entityType: 'Team', action: 'create' });
    expect(audit).not.toBeNull();
  });

  it('rejects creating a team with an invalid lead id', async () => {
    const { accessToken: adminToken } = await createUser({ email: 'admin2@example.com', role: 'admin' });

    const res = await request(app)
      .post('/api/v1/teams')
      .set(authHeader(adminToken))
      .send({ name: 'Bad Team', lead: 'not-an-id' });

    expect(res.statusCode).toBe(422);
  });

  it('lists teams with search and pagination', async () => {
    const { accessToken: adminToken } = await createUser({ email: 'admin3@example.com', role: 'admin' });
    const { user: lead } = await createUser({ email: 'lead3@example.com' });

    await request(app)
      .post('/api/v1/teams')
      .set(authHeader(adminToken))
      .send({ name: 'Falcon Squad', lead: lead._id.toString() });
    await request(app)
      .post('/api/v1/teams')
      .set(authHeader(adminToken))
      .send({ name: 'Dragon Crew', lead: lead._id.toString() });

    const res = await request(app)
      .get('/api/v1/teams?search=Falcon')
      .set(authHeader(adminToken));

    expect(res.body.data.pagination.total).toBe(1);
    expect(res.body.data.teams[0].name).toBe('Falcon Squad');
  });

  it('updates a team, manages members, and reassigns the lead', async () => {
    const { accessToken: adminToken } = await createUser({ email: 'admin4@example.com', role: 'admin' });
    const { user: lead } = await createUser({ email: 'lead4@example.com' });
    const { user: member } = await createUser({ email: 'member2@example.com' });
    const { user: newLead } = await createUser({ email: 'newlead@example.com' });

    const created = await request(app)
      .post('/api/v1/teams')
      .set(authHeader(adminToken))
      .send({ name: 'Original Team', lead: lead._id.toString() });
    const teamId = created.body.data.team._id;

    const updated = await request(app)
      .patch(`/api/v1/teams/${teamId}`)
      .set(authHeader(adminToken))
      .send({ name: 'Renamed Team' });
    expect(updated.body.data.team.name).toBe('Renamed Team');

    const addRes = await request(app)
      .post(`/api/v1/teams/${teamId}/members`)
      .set(authHeader(adminToken))
      .send({ members: [member._id.toString()] });
    expect(addRes.body.data.team.members).toHaveLength(1);

    const removeRes = await request(app)
      .delete(`/api/v1/teams/${teamId}/members/${member._id.toString()}`)
      .set(authHeader(adminToken));
    expect(removeRes.body.data.team.members).toHaveLength(0);

    const leadRes = await request(app)
      .patch(`/api/v1/teams/${teamId}/lead`)
      .set(authHeader(adminToken))
      .send({ lead: newLead._id.toString() });
    expect(leadRes.body.data.team.lead).toBe(newLead._id.toString());
  });

  it('soft-deletes and restores a team', async () => {
    const { accessToken: adminToken } = await createUser({ email: 'admin5@example.com', role: 'admin' });
    const { user: lead } = await createUser({ email: 'lead5@example.com' });

    const created = await request(app)
      .post('/api/v1/teams')
      .set(authHeader(adminToken))
      .send({ name: 'Temporary Team', lead: lead._id.toString() });
    const teamId = created.body.data.team._id;

    const deleteRes = await request(app)
      .delete(`/api/v1/teams/${teamId}`)
      .set(authHeader(adminToken));
    expect(deleteRes.statusCode).toBe(200);

    const listAfterDelete = await request(app).get('/api/v1/teams').set(authHeader(adminToken));
    expect(listAfterDelete.body.data.teams.find((t) => t._id === teamId)).toBeUndefined();

    const restoreRes = await request(app)
      .post(`/api/v1/teams/${teamId}/restore`)
      .set(authHeader(adminToken));
    expect(restoreRes.statusCode).toBe(200);

    const listAfterRestore = await request(app).get('/api/v1/teams').set(authHeader(adminToken));
    expect(listAfterRestore.body.data.teams.find((t) => t._id === teamId)).toBeDefined();
  });

  it('returns 404 when restoring a team that does not exist', async () => {
    const { accessToken: adminToken } = await createUser({ email: 'admin6@example.com', role: 'admin' });

    const res = await request(app)
      .post(`/api/v1/teams/${new mongoose.Types.ObjectId()}/restore`)
      .set(authHeader(adminToken));

    expect(res.statusCode).toBe(404);
  });

  it('fetches a single team by id, populated with lead and members', async () => {
    const { accessToken: adminToken } = await createUser({ email: 'admin7@example.com', role: 'admin' });
    const { user: lead } = await createUser({ email: 'lead6@example.com' });

    const created = await request(app)
      .post('/api/v1/teams')
      .set(authHeader(adminToken))
      .send({ name: 'Fetchable Team', lead: lead._id.toString() });

    const res = await request(app)
      .get(`/api/v1/teams/${created.body.data.team._id}`)
      .set(authHeader(adminToken));

    expect(res.statusCode).toBe(200);
    expect(res.body.data.team.lead.name).toBe(lead.name);
  });

  it('is a no-op when reassigning the lead to the current lead', async () => {
    const { accessToken: adminToken } = await createUser({ email: 'admin8@example.com', role: 'admin' });
    const { user: lead } = await createUser({ email: 'lead7@example.com' });

    const created = await request(app)
      .post('/api/v1/teams')
      .set(authHeader(adminToken))
      .send({ name: 'Steady Team', lead: lead._id.toString() });
    const teamId = created.body.data.team._id;

    const res = await request(app)
      .patch(`/api/v1/teams/${teamId}/lead`)
      .set(authHeader(adminToken))
      .send({ lead: lead._id.toString() });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.team.lead).toBe(lead._id.toString());

    const auditCount = await AuditLog.countDocuments({ entityType: 'Team', action: 'assign', entityId: teamId });
    expect(auditCount).toBe(0);
  });
});
