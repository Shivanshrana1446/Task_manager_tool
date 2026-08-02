const Team = require('../models/Team');
const ApiError = require('../utils/ApiError');
const { paginateQuery, pickFilter } = require('../utils/queryHelper');

const MEMBER_POPULATE = [
  { path: 'lead', select: 'name email avatar role' },
  { path: 'members', select: 'name email avatar role' },
];

const createTeam = (data) =>
  Team.create({
    name: data.name,
    description: data.description,
    lead: data.lead,
    members: data.members || [],
  });

const listTeams = async (query) => {
  const filter = pickFilter(query, ['lead']);

  const { data, pagination } = await paginateQuery({
    Model: Team,
    filter,
    query,
    searchFields: ['name', 'description'],
    defaultSort: '-createdAt',
    populate: MEMBER_POPULATE,
  });

  return { data, pagination };
};

const getTeamDetail = async (team) => {
  await team.populate(MEMBER_POPULATE);
  return team;
};

const updateTeam = async (team, data) => {
  ['name', 'description'].forEach((field) => {
    if (data[field] !== undefined) {
      team[field] = data[field];
    }
  });
  await team.save();
  return team;
};

const softDeleteTeam = (team) => team.softDelete();

const findDeletedTeam = async (teamId) => {
  const team = await Team.findById(teamId).withDeleted();
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }
  return team;
};

const restoreTeam = (team) => team.restore();

const addMembers = async (team, memberIds) => {
  const existing = new Set(team.members.map((m) => m.toString()));
  const newlyAdded = memberIds.filter((id) => !existing.has(id.toString()));

  team.members.push(...newlyAdded);
  await team.save();
  return { team, newlyAdded };
};

const removeMember = async (team, userId) => {
  team.members = team.members.filter((member) => member.toString() !== userId);
  await team.save();
  return team;
};

const assignLead = async (team, newLeadId) => {
  const previousLeadId = team.lead.toString();

  if (previousLeadId === newLeadId) {
    return { team, previousLeadId, changed: false };
  }

  team.lead = newLeadId;

  const membersWithoutNewLead = team.members.filter((member) => member.toString() !== newLeadId);
  if (!membersWithoutNewLead.some((member) => member.toString() === previousLeadId)) {
    membersWithoutNewLead.push(previousLeadId);
  }
  team.members = membersWithoutNewLead;

  await team.save();
  return { team, previousLeadId, changed: true };
};

module.exports = {
  createTeam,
  listTeams,
  getTeamDetail,
  updateTeam,
  softDeleteTeam,
  findDeletedTeam,
  restoreTeam,
  addMembers,
  removeMember,
  assignLead,
};
