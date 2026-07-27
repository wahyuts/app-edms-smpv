const {
  ADMINISTRATION_MESSAGES,
} = require('../constants/administration.constants');
const projectMembershipRepository = require('../repositories/projectMembership.repository');
const {
  createHttpError,
} = require('../utils/administration');

const buildEmptyContext = () => ({
  accessibleProjects: [],
  activeMembership: null,
  activeProject: null,
  officialRole: null,
});

const resolveProjectContext = async (userId) => {
  const accessibleRecords = await projectMembershipRepository.listAccessibleProjectsByUserId(userId);
  const accessibleProjects = accessibleRecords.map((record) => record.activeProject);

  if (accessibleRecords.length === 0) {
    await projectMembershipRepository.clearUserProjectPreference(userId);
    return buildEmptyContext();
  }

  const preference = await projectMembershipRepository.getUserProjectPreference(userId);
  const selectedRecord =
    accessibleRecords.find((record) => record.activeProject.id === preference?.active_project_id) ||
    accessibleRecords[0];

  await projectMembershipRepository.setUserProjectPreference({
    projectId: selectedRecord.activeProject.id,
    userId,
  });

  return {
    accessibleProjects,
    activeMembership: selectedRecord.activeMembership,
    activeProject: selectedRecord.activeProject,
    officialRole: selectedRecord.activeMembership.officialRole,
  };
};

const selectActiveProject = async ({ projectId, userId }) => {
  const membership = await projectMembershipRepository.findActiveMembershipByProjectAndUser({
    projectId,
    userId,
  });

  if (!membership) {
    throw createHttpError('Akses Project Ditolak', 403, [
      { field: 'projectId', message: 'Project Tidak Dapat Diakses' },
    ]);
  }

  await projectMembershipRepository.setUserProjectPreference({ projectId, userId });
  return resolveProjectContext(userId);
};

const requireActiveProjectMembership = async ({ projectId, userId }) => {
  const membership = await projectMembershipRepository.findActiveMembershipByProjectAndUser({
    projectId,
    userId,
  });

  if (!membership) {
    throw createHttpError(ADMINISTRATION_MESSAGES.FORBIDDEN, 403);
  }

  return membership;
};

module.exports = {
  requireActiveProjectMembership,
  resolveProjectContext,
  selectActiveProject,
};
