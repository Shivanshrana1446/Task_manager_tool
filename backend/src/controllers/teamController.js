const teamService = require('../services/teamService');
const { recordAudit } = require('../services/auditService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { AUDIT_ACTIONS, ENTITY_TYPES } = require('../config/constants');

const createTeam = asyncHandler(async (req, res) => {
  const team = await teamService.createTeam(req.body);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPES.TEAM,
    entityId: team._id,
    after: team.toObject(),
  });

  res.status(201).json(new ApiResponse(201, { team }, 'Team created'));
});

const listTeams = asyncHandler(async (req, res) => {
  const { data, pagination } = await teamService.listTeams(req.query);
  res.status(200).json(new ApiResponse(200, { teams: data, pagination }, 'Teams fetched'));
});

const getTeam = asyncHandler(async (req, res) => {
  const team = await teamService.getTeamDetail(req.team);
  res.status(200).json(new ApiResponse(200, { team }, 'Team fetched'));
});

const updateTeam = asyncHandler(async (req, res) => {
  const before = req.team.toObject();
  const team = await teamService.updateTeam(req.team, req.body);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPES.TEAM,
    entityId: team._id,
    before,
    after: team.toObject(),
  });

  res.status(200).json(new ApiResponse(200, { team }, 'Team updated'));
});

const deleteTeam = asyncHandler(async (req, res) => {
  await teamService.softDeleteTeam(req.team);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.DELETE,
    entityType: ENTITY_TYPES.TEAM,
    entityId: req.team._id,
  });

  res.status(200).json(new ApiResponse(200, { team: req.team }, 'Team deleted'));
});

const restoreTeam = asyncHandler(async (req, res) => {
  const team = await teamService.findDeletedTeam(req.params.id);
  await teamService.restoreTeam(team);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.RESTORE,
    entityType: ENTITY_TYPES.TEAM,
    entityId: team._id,
  });

  res.status(200).json(new ApiResponse(200, { team }, 'Team restored'));
});

const addMembers = asyncHandler(async (req, res) => {
  const { team, newlyAdded } = await teamService.addMembers(req.team, req.body.members);

  if (newlyAdded.length > 0) {
    await recordAudit({
      req,
      action: AUDIT_ACTIONS.ASSIGN,
      entityType: ENTITY_TYPES.TEAM,
      entityId: team._id,
      after: { addedMembers: newlyAdded },
    });
  }

  res.status(200).json(new ApiResponse(200, { team }, 'Members added'));
});

const removeMember = asyncHandler(async (req, res) => {
  const team = await teamService.removeMember(req.team, req.params.userId);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPES.TEAM,
    entityId: team._id,
    after: { removedMember: req.params.userId },
  });

  res.status(200).json(new ApiResponse(200, { team }, 'Member removed'));
});

const assignLead = asyncHandler(async (req, res) => {
  const before = { lead: req.team.lead.toString() };
  const { team, changed } = await teamService.assignLead(req.team, req.body.lead);

  if (changed) {
    await recordAudit({
      req,
      action: AUDIT_ACTIONS.ASSIGN,
      entityType: ENTITY_TYPES.TEAM,
      entityId: team._id,
      before,
      after: { lead: team.lead.toString() },
    });
  }

  res.status(200).json(new ApiResponse(200, { team }, 'Team lead updated'));
});

module.exports = {
  createTeam,
  listTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  restoreTeam,
  addMembers,
  removeMember,
  assignLead,
};
