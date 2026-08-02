const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  User,
  Project,
  Task,
  Comment,
  Attachment,
  AuditLog,
  Notification,
} = require('../models');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

const makeUser = (overrides = {}) =>
  User.create({
    name: 'Test User',
    email: `user-${new mongoose.Types.ObjectId()}@example.com`,
    password: 'StrongPass1',
    ...overrides,
  });

describe('User model', () => {
  it('allows a new account to reuse an email after the old one is soft-deleted', async () => {
    const user = await makeUser({ email: 'reuse@example.com' });
    await user.softDelete();

    const recreated = await makeUser({ email: 'reuse@example.com' });
    expect(recreated.email).toBe('reuse@example.com');
  });

  it('excludes soft-deleted users from find by default, but exposes them via withDeleted/onlyDeleted', async () => {
    const user = await makeUser();
    await user.softDelete();

    expect(await User.findById(user._id)).toBeNull();
    expect(await User.findById(user._id).withDeleted()).not.toBeNull();

    const deletedOnly = await User.find().onlyDeleted();
    expect(deletedOnly).toHaveLength(1);

    await deletedOnly[0].restore();
    expect(await User.findById(user._id)).not.toBeNull();
  });

  it('populates ownedProjects via virtual populate', async () => {
    const owner = await makeUser();
    await Project.create({ name: 'Apollo', owner: owner._id });

    const populated = await User.findById(owner._id).populate('ownedProjects');
    expect(populated.ownedProjects).toHaveLength(1);
    expect(populated.ownedProjects[0].name).toBe('Apollo');
  });
});

describe('Project model', () => {
  it('requires a name and an owner', async () => {
    await expect(Project.create({})).rejects.toThrow(/required/);
  });

  it('rejects a due date before the start date', async () => {
    const owner = await makeUser();
    await expect(
      Project.create({
        name: 'Bad dates',
        owner: owner._id,
        startDate: new Date('2026-06-01'),
        dueDate: new Date('2026-05-01'),
      })
    ).rejects.toThrow(/on or after the start date/);
  });

  it('computes taskCount via a count virtual', async () => {
    const owner = await makeUser();
    const project = await Project.create({ name: 'Gemini', owner: owner._id });
    await Task.create([
      { title: 'Task 1', project: project._id, reporter: owner._id },
      { title: 'Task 2', project: project._id, reporter: owner._id },
    ]);

    const populated = await Project.findById(project._id).populate('taskCount');
    expect(populated.taskCount).toBe(2);
  });

  it('computes durationDays from startDate/dueDate', async () => {
    const owner = await makeUser();
    const project = await Project.create({
      name: 'Duration test',
      owner: owner._id,
      startDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-11'),
    });

    expect(project.durationDays).toBe(10);
  });
});

describe('Task model', () => {
  it('requires title, project, and reporter', async () => {
    await expect(Task.create({})).rejects.toThrow(/required/);
  });

  it('computes isOverdue based on dueDate and status', async () => {
    const owner = await makeUser();
    const project = await Project.create({ name: 'Overdue test', owner: owner._id });

    const overdue = await Task.create({
      title: 'Late task',
      project: project._id,
      reporter: owner._id,
      dueDate: new Date('2020-01-01'),
      status: 'todo',
    });
    expect(overdue.isOverdue).toBe(true);

    const doneButLate = await Task.create({
      title: 'Late but done',
      project: project._id,
      reporter: owner._id,
      dueDate: new Date('2020-01-01'),
      status: 'done',
    });
    expect(doneButLate.isOverdue).toBe(false);
  });

  it('populates subtasks and comments via virtual populate', async () => {
    const owner = await makeUser();
    const project = await Project.create({ name: 'Subtasks', owner: owner._id });
    const parent = await Task.create({ title: 'Parent', project: project._id, reporter: owner._id });
    await Task.create({ title: 'Child', project: project._id, reporter: owner._id, parentTask: parent._id });
    await Comment.create({ content: 'Nice work', task: parent._id, author: owner._id });

    const populated = await Task.findById(parent._id).populate('subtasks').populate('comments');
    expect(populated.subtasks).toHaveLength(1);
    expect(populated.comments).toHaveLength(1);
  });
});

describe('Comment model', () => {
  it('requires content, task, and author', async () => {
    await expect(Comment.create({})).rejects.toThrow(/required/);
  });

  it('tracks edits via the isEdited virtual', async () => {
    const owner = await makeUser();
    const project = await Project.create({ name: 'Comments', owner: owner._id });
    const task = await Task.create({ title: 'Task', project: project._id, reporter: owner._id });
    const comment = await Comment.create({ content: 'Original', task: task._id, author: owner._id });

    expect(comment.isEdited).toBe(false);

    comment.editedAt = new Date();
    await comment.save();
    expect(comment.isEdited).toBe(true);
  });

  it('populates threaded replies', async () => {
    const owner = await makeUser();
    const project = await Project.create({ name: 'Threads', owner: owner._id });
    const task = await Task.create({ title: 'Task', project: project._id, reporter: owner._id });
    const parent = await Comment.create({ content: 'Parent', task: task._id, author: owner._id });
    await Comment.create({ content: 'Reply', task: task._id, author: owner._id, parentComment: parent._id });

    const populated = await Comment.findById(parent._id).populate('replies');
    expect(populated.replies).toHaveLength(1);
  });
});

describe('Attachment model', () => {
  const baseAttachment = {
    fileName: 'diagram.png',
    originalName: 'diagram.png',
    url: 'https://cdn.example.com/diagram.png',
    publicId: 'diagram',
    mimeType: 'image/png',
    size: 2048,
  };

  it('rejects an attachment with no parent entity', async () => {
    const owner = await makeUser();
    await expect(
      Attachment.create({ ...baseAttachment, uploadedBy: owner._id })
    ).rejects.toThrow(/linked to at least one/);
  });

  it('accepts an attachment linked to a task', async () => {
    const owner = await makeUser();
    const project = await Project.create({ name: 'Files', owner: owner._id });
    const task = await Task.create({ title: 'Task', project: project._id, reporter: owner._id });

    const attachment = await Attachment.create({
      ...baseAttachment,
      task: task._id,
      uploadedBy: owner._id,
    });

    expect(attachment.sizeInKB).toBe(2);
    expect(attachment.extension).toBe('png');
  });
});

describe('AuditLog model', () => {
  it('rejects an unknown entityType', async () => {
    const owner = await makeUser();
    await expect(
      AuditLog.create({
        user: owner._id,
        action: 'create',
        entityType: 'NotAModel',
        entityId: new mongoose.Types.ObjectId(),
      })
    ).rejects.toThrow();
  });

  it('resolves the polymorphic entity via refPath', async () => {
    const owner = await makeUser();
    const project = await Project.create({ name: 'Audited', owner: owner._id });
    const task = await Task.create({ title: 'Task', project: project._id, reporter: owner._id });

    const log = await AuditLog.create({
      user: owner._id,
      action: 'create',
      entityType: 'Task',
      entityId: task._id,
    });

    const populated = await AuditLog.findById(log._id).populate('entity');
    expect(populated.entity.title).toBe('Task');
  });
});

describe('Notification model', () => {
  it('requires entityId when entityType is set', async () => {
    const recipient = await makeUser();
    await expect(
      Notification.create({
        recipient: recipient._id,
        type: 'task_assigned',
        title: 'You were assigned a task',
        message: 'Check it out',
        entityType: 'Task',
      })
    ).rejects.toThrow(/entityId is required/);
  });

  it('marks a notification as read', async () => {
    const recipient = await makeUser();
    const notification = await Notification.create({
      recipient: recipient._id,
      type: 'task_assigned',
      title: 'You were assigned a task',
      message: 'Check it out',
    });

    expect(notification.isRead).toBe(false);
    await notification.markAsRead();
    expect(notification.isRead).toBe(true);
    expect(notification.readAt).not.toBeNull();
  });

  it('resolves the polymorphic entity via refPath', async () => {
    const owner = await makeUser();
    const project = await Project.create({ name: 'Notify', owner: owner._id });

    const notification = await Notification.create({
      recipient: owner._id,
      type: 'project_invite',
      title: 'Invited to project',
      message: 'You were added to a project',
      entityType: 'Project',
      entityId: project._id,
    });

    const populated = await Notification.findById(notification._id).populate('entity');
    expect(populated.entity.name).toBe('Notify');
  });
});
