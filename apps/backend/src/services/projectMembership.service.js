const {
  ADMINISTRATION_MESSAGES,
  ENTITY_STATUS,
  PROJECT_STATUS,
} = require('../constants/administration.constants');
const {
  REALTIME_EVENT_SCOPE,
  REALTIME_EVENT_TYPE,
  REALTIME_RESOURCE_TYPE,
} = require('../constants/realtime.constants');
const projectMembershipRepository = require('../repositories/projectMembership.repository');
const projectRepository = require('../repositories/project.repository');
const realtimePublisher = require('./realtimePublisher.service');
const userRepository = require('../repositories/user.repository');
const {
  buildPagination,
  createEntityId,
  createHttpError,
  mapDuplicateError,
  parseListQuery,
} = require('../utils/administration');

const parseMembershipListQuery = (query) => ({
  ...parseListQuery(query, {
    allowedSortBy: ['assignedAt', 'assignedDate', 'lastUpdated', 'officialRole', 'projectName', 'status', 'userName', 'username'],
    defaultSortBy: 'assignedAt',
  }),
  officialRole: query?.officialRole || null,
  projectId: query?.projectId || null,
  status: Object.values(ENTITY_STATUS).includes(query?.status) ? query.status : null,
});

const publishMembershipContextChanged = ({ actorUserId = null, membership, reason }) => {
  if (!membership?.id || !membership?.userId || !reason) return;

  realtimePublisher.publishSafely({
    actorUserId,
    projectId: null,
    reason,
    recipientUserId: membership.userId,
    resourceId: membership.id,
    resourceType: REALTIME_RESOURCE_TYPE.PROJECT_MEMBERSHIP,
    scope: REALTIME_EVENT_SCOPE.USER,
    type: REALTIME_EVENT_TYPE.PROJECT_MEMBERSHIP_CHANGED,
  });
};

const assertMembershipExists = async (membershipId) => {
  const membership = await projectMembershipRepository.findMembershipById(membershipId);
  if (!membership) {
    throw createHttpError(ADMINISTRATION_MESSAGES.NOT_FOUND, 404);
  }
  return membership;
};

const assertActiveProject = async (projectId) => {
  const project = await projectRepository.findProjectById(projectId);
  if (!project) {
    throw createHttpError('Project Tidak Ditemukan', 422, [
      { field: 'projectId', message: 'Project Tidak Ditemukan' },
    ]);
  }
  if (project.status !== PROJECT_STATUS.ACTIVE) {
    throw createHttpError('Project Tidak Aktif', 422, [
      { field: 'projectId', message: 'Project Tidak Aktif' },
    ]);
  }
  return project;
};

const assertActiveUser = async (userId) => {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw createHttpError('User Tidak Ditemukan', 422, [
      { field: 'userId', message: 'User Tidak Ditemukan' },
    ]);
  }
  if (user.status !== ENTITY_STATUS.ACTIVE) {
    throw createHttpError('User Tidak Aktif', 422, [
      { field: 'userId', message: 'User Tidak Aktif' },
    ]);
  }
  return user;
};

const assertMutableMembershipProject = async (projectId) => {
  const project = await projectRepository.findProjectById(projectId);
  if (!project) {
    throw createHttpError('Project Tidak Ditemukan', 422);
  }
  if (project.status === PROJECT_STATUS.CLOSED) {
    throw createHttpError('Membership Project Closed Tidak Dapat Diubah', 409, [
      { field: 'projectId', message: 'Membership Project Closed Tidak Dapat Diubah' },
    ]);
  }
  return project;
};

const listMemberships = async (query) => {
  const listQuery = parseMembershipListQuery(query);
  const result = await projectMembershipRepository.listMemberships(listQuery);

  return {
    data: result.rows,
    pagination: buildPagination({
      page: listQuery.page,
      pageSize: listQuery.pageSize,
      totalItems: result.totalItems,
    }),
  };
};

const getMembershipDetail = (membershipId) => assertMembershipExists(membershipId);

const createMembership = async ({ actorUserId, payload }) => {
  await Promise.all([
    assertActiveProject(payload.projectId),
    assertActiveUser(payload.userId),
  ]);
  const existingMembership = await projectMembershipRepository.findMembershipByProjectAndUser({
    projectId: payload.projectId,
    userId: payload.userId,
  });
  if (existingMembership) {
    throw createHttpError('Membership Sudah Ada', 409, [
      { field: 'userId', message: 'Membership Sudah Ada' },
    ]);
  }

  try {
    const membership = await projectMembershipRepository.createMembership({
      membership: {
        id: createEntityId('PMB'),
        assignedByUserId: actorUserId,
        officialRole: payload.officialRole,
        projectId: payload.projectId,
        status: payload.status,
        userId: payload.userId,
      },
    });
    publishMembershipContextChanged({
      actorUserId,
      membership,
      reason: 'project_membership_created',
    });
    return membership;
  } catch (error) {
    const duplicateError = mapDuplicateError(error, 'Membership Sudah Ada', 'userId');
    throw duplicateError || error;
  }
};

const updateMembership = async ({ actorUserId, membershipId, payload }) => {
  const membership = await assertMembershipExists(membershipId);
  const project = await assertMutableMembershipProject(membership.projectId);

  if (payload.status === ENTITY_STATUS.ACTIVE) {
    if (project.status !== PROJECT_STATUS.ACTIVE) {
      throw createHttpError('Project Tidak Aktif', 422);
    }
    await assertActiveUser(membership.userId);
  }

  const updatedMembership = await projectMembershipRepository.updateMembership({
    membership: {
      officialRole: payload.officialRole,
      status: payload.status,
      updatedByUserId: actorUserId,
    },
    membershipId,
  });
  publishMembershipContextChanged({
    actorUserId,
    membership: updatedMembership,
    reason: 'project_membership_updated',
  });
  return updatedMembership;
};

const setMembershipStatus = async ({ actorUserId, membershipId, status }) => {
  const membership = await assertMembershipExists(membershipId);
  const project = await assertMutableMembershipProject(membership.projectId);

  if (status === ENTITY_STATUS.ACTIVE) {
    if (project.status !== PROJECT_STATUS.ACTIVE) {
      throw createHttpError('Project Tidak Aktif', 422);
    }
    await assertActiveUser(membership.userId);
  }
  if (membership.status === status) {
    return membership;
  }

  const updatedMembership = await projectMembershipRepository.updateMembershipStatus({
    membershipId,
    status,
    userId: actorUserId,
  });
  publishMembershipContextChanged({
    actorUserId,
    membership: updatedMembership,
    reason: status === ENTITY_STATUS.ACTIVE
      ? 'project_membership_activated'
      : 'project_membership_deactivated',
  });
  return updatedMembership;
};

module.exports = {
  activateMembership: ({ actorUserId, membershipId }) =>
    setMembershipStatus({ actorUserId, membershipId, status: ENTITY_STATUS.ACTIVE }),
  createMembership,
  deactivateMembership: ({ actorUserId, membershipId }) =>
    setMembershipStatus({ actorUserId, membershipId, status: ENTITY_STATUS.INACTIVE }),
  getMembershipDetail,
  listMemberships,
  updateMembership,
};
