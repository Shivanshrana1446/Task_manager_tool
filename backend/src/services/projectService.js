const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');
const { paginateQuery, pickFilter } = require('../utils/queryHelper');
const { ROLES } = require('../config/roles');
const { attachTaskStats } = require('./projectStatsService');

const MEMBER_POPULATE = [
  { path: 'owner', select: 'name email avatar' },
  { path: 'members', select: 'name email avatar' },
];

const createProject = (ownerId, data) =>
  Project.create({
    name: data.name,
    description: data.description,
    owner: ownerId,
    members: data.members || [],
    status: data.status,
    priority: data.priority,
    startDate: data.startDate,
    dueDate: data.dueDate,
  });

const listProjects = async (user, query) => {
  const filter = pickFilter(query, ['status', 'priority']);

  if (user.role !== ROLES.ADMIN) {
    filter.$or = [{ owner: user.id }, { members: user.id }];
  }

  const { data, pagination } = await paginateQuery({
    Model: Project,
    filter,
    query,
    searchFields: ['name', 'description'],
    defaultSort: '-createdAt',
    populate: MEMBER_POPULATE,
  });

  return { data: await attachTaskStats(data), pagination };
};

const getProjectDetail = async (project) => {
  await project.populate(MEMBER_POPULATE);
  return (await attachTaskStats([project]))[0];
};

const updateProject = async (project, data) => {
  ['name', 'description', 'status', 'priority', 'startDate', 'dueDate'].forEach((field) => {
    if (data[field] !== undefined) {
      project[field] = data[field];
    }
  });
  await project.save();
  return project;
};

const softDeleteProject = (project) => project.softDelete();

const findDeletedProject = async (projectId) => {
  const project = await Project.findById(projectId).withDeleted();
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  return project;
};

const restoreProject = async (project) => project.restore();

const addMembers = async (project, memberIds) => {
  const existing = new Set(project.members.map((m) => m.toString()));
  const newlyAdded = memberIds.filter((id) => !existing.has(id.toString()) && id !== project.owner.toString());

  project.members.push(...newlyAdded);
  await project.save();
  return { project, newlyAdded };
};

const removeMember = async (project, userId) => {
  project.members = project.members.filter((member) => member.toString() !== userId);
  await project.save();
  return project;
};

const assignManager = async (project, newOwnerId) => {
  const previousOwnerId = project.owner.toString();

  if (previousOwnerId === newOwnerId) {
    return { project, previousOwnerId, changed: false };
  }

  project.owner = newOwnerId;

  const membersWithoutNewOwner = project.members.filter(
    (member) => member.toString() !== newOwnerId
  );
  if (!membersWithoutNewOwner.some((member) => member.toString() === previousOwnerId)) {
    membersWithoutNewOwner.push(previousOwnerId);
  }
  project.members = membersWithoutNewOwner;

  await project.save();
  return { project, previousOwnerId, changed: true };
};

module.exports = {
  createProject,
  listProjects,
  getProjectDetail,
  updateProject,
  softDeleteProject,
  findDeletedProject,
  restoreProject,
  addMembers,
  removeMember,
  assignManager,
};
