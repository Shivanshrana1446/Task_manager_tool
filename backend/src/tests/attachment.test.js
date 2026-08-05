const request = require('supertest');
const { uploadBuffer } = require('../services/cloudinaryService');

jest.mock('../services/cloudinaryService', () => ({
  uploadBuffer: jest.fn().mockResolvedValue({
    secure_url: 'https://cdn.example.com/files/report.pdf',
    public_id: 'attachments/mock456',
  }),
  deleteAsset: jest.fn().mockResolvedValue({}),
}));

const app = require('../app');
const { setupTestDB, createUser, authHeader } = require('./helpers/testUtils');

setupTestDB();

const setupProjectAndTask = async (ownerToken) => {
  const projectRes = await request(app)
    .post('/api/v1/projects')
    .set(authHeader(ownerToken))
    .send({ name: 'Attachment Project' });
  const project = projectRes.body.data.project;

  const taskRes = await request(app)
    .post('/api/v1/tasks')
    .set(authHeader(ownerToken))
    .send({ title: 'Attachment Task', project: project._id });

  return { project, task: taskRes.body.data.task };
};

describe('Attachment APIs', () => {
  it('uploads a file attached to a task', async () => {
    const { accessToken } = await createUser({ email: 'owner@example.com' });
    const { task } = await setupProjectAndTask(accessToken);

    const res = await request(app)
      .post('/api/v1/attachments')
      .set(authHeader(accessToken))
      .field('task', task._id)
      .attach('file', Buffer.from('%PDF-1.4 fake pdf'), {
        filename: 'report.pdf',
        contentType: 'application/pdf',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.attachment.url).toBe('https://cdn.example.com/files/report.pdf');
    // PDFs must upload as "raw" — Cloudinary's "auto" detection files them
    // under "image" instead, which breaks opening/downloading them as a PDF.
    expect(uploadBuffer).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ resourceType: 'raw' })
    );
  });

  it('uploads an image with resourceType "image"', async () => {
    const { accessToken } = await createUser({ email: 'owner6@example.com' });
    const { task } = await setupProjectAndTask(accessToken);

    const res = await request(app)
      .post('/api/v1/attachments')
      .set(authHeader(accessToken))
      .field('task', task._id)
      .attach('file', Buffer.from('fake-png-bytes'), {
        filename: 'photo.png',
        contentType: 'image/png',
      });

    expect(res.statusCode).toBe(201);
    expect(uploadBuffer).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ resourceType: 'image' })
    );
  });

  it('rejects an upload with no parent reference', async () => {
    const { accessToken } = await createUser();

    const res = await request(app)
      .post('/api/v1/attachments')
      .set(authHeader(accessToken))
      .attach('file', Buffer.from('data'), { filename: 'x.txt', contentType: 'text/plain' });

    expect(res.statusCode).toBe(422);
  });

  it('rejects an unsupported file type', async () => {
    const { accessToken } = await createUser({ email: 'owner2@example.com' });
    const { task } = await setupProjectAndTask(accessToken);

    const res = await request(app)
      .post('/api/v1/attachments')
      .set(authHeader(accessToken))
      .field('task', task._id)
      .attach('file', Buffer.from('mz-exe-bytes'), {
        filename: 'virus.exe',
        contentType: 'application/x-msdownload',
      });

    expect(res.statusCode).toBe(400);
  });

  it('rejects a file that exceeds the size limit with a 400, not a 500', async () => {
    const { accessToken } = await createUser({ email: 'owner5@example.com' });
    const { task } = await setupProjectAndTask(accessToken);

    const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024, 'a');

    const res = await request(app)
      .post('/api/v1/attachments')
      .set(authHeader(accessToken))
      .field('task', task._id)
      .attach('file', oversizedBuffer, { filename: 'huge.txt', contentType: 'text/plain' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/too large/i);
  });

  it('denies access to attachments outside the user\'s projects', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner3@example.com' });
    const { accessToken: outsiderToken } = await createUser({ email: 'outsider@example.com' });
    const { task } = await setupProjectAndTask(ownerToken);

    const uploadRes = await request(app)
      .post('/api/v1/attachments')
      .set(authHeader(ownerToken))
      .field('task', task._id)
      .attach('file', Buffer.from('data'), { filename: 'notes.txt', contentType: 'text/plain' });

    const res = await request(app)
      .get(`/api/v1/attachments/${uploadRes.body.data.attachment._id}`)
      .set(authHeader(outsiderToken));
    expect(res.statusCode).toBe(403);

    const listRes = await request(app)
      .get(`/api/v1/attachments?task=${task._id}`)
      .set(authHeader(outsiderToken));
    expect(listRes.statusCode).toBe(403);
  });

  it('only allows the uploader (or admin) to delete an attachment', async () => {
    const { accessToken: ownerToken } = await createUser({ email: 'owner4@example.com' });
    const { user: member, accessToken: memberToken } = await createUser({ email: 'member@example.com' });
    const { project, task } = await setupProjectAndTask(ownerToken);

    await request(app)
      .post(`/api/v1/projects/${project._id}/members`)
      .set(authHeader(ownerToken))
      .send({ members: [member._id.toString()] });

    const uploadRes = await request(app)
      .post('/api/v1/attachments')
      .set(authHeader(ownerToken))
      .field('task', task._id)
      .attach('file', Buffer.from('data'), { filename: 'notes2.txt', contentType: 'text/plain' });
    const attachmentId = uploadRes.body.data.attachment._id;

    const deniedDelete = await request(app)
      .delete(`/api/v1/attachments/${attachmentId}`)
      .set(authHeader(memberToken));
    expect(deniedDelete.statusCode).toBe(403);

    const allowedDelete = await request(app)
      .delete(`/api/v1/attachments/${attachmentId}`)
      .set(authHeader(ownerToken));
    expect(allowedDelete.statusCode).toBe(200);
  });
});
