const {
  ADMINISTRATION_MESSAGES,
  ENTITY_STATUS,
  PROJECT_STATUS,
} = require('../constants/administration.constants');
const projectRepository = require('../repositories/project.repository');
const userRepository = require('../repositories/user.repository');
const {
  buildPagination,
  createEntityId,
  createHttpError,
  mapDuplicateError,
  normalizeKey,
  parseListQuery,
} = require('../utils/administration');

const parseProjectListQuery = (query) => ({
  ...parseListQuery(query, {
    allowedSortBy: ['createdAt', 'createdDate', 'lastUpdated', 'projectCode', 'projectName', 'status', 'updatedAt'],
    defaultSortBy: 'createdAt',
  }),
  status: Object.values(PROJECT_STATUS).includes(query?.status) ? query.status : null,
});

const assertProjectExists = async (projectId) => {
  const project = await projectRepository.findProjectById(projectId);
  if (!project) {
    throw createHttpError(ADMINISTRATION_MESSAGES.NOT_FOUND, 404);
  }
  return project;
};

const assertUniqueProjectCode = async ({ currentProjectId = null, projectCode }) => {
  const existingProject = await projectRepository.findProjectByCode(projectCode);
  if (existingProject && String(existingProject.id) !== String(currentProjectId)) {
    throw createHttpError('Kode Project Sudah Digunakan', 409, [
      { field: 'projectCode', message: 'Kode Project Sudah Digunakan' },
    ]);
  }
};

const assertOpenProject = (project) => {
  if (project.status === PROJECT_STATUS.CLOSED) {
    throw createHttpError('Closed Project Tidak Dapat Diubah', 409, [
      { field: 'status', message: 'Closed Project Tidak Dapat Diubah' },
    ]);
  }
};

const listProjects = async (query) => {
  const listQuery = parseProjectListQuery(query);
  const result = await projectRepository.listProjects(listQuery);

  return {
    data: result.rows,
    pagination: buildPagination({
      page: listQuery.page,
      pageSize: listQuery.pageSize,
      totalItems: result.totalItems,
    }),
  };
};

const getProjectDetail = (projectId) => assertProjectExists(projectId);

const createProject = async ({ actorUserId, payload }) => {
  const creator = await userRepository.findUserById(actorUserId);
  if (!creator || creator.status !== ENTITY_STATUS.ACTIVE) {
    throw createHttpError('Session Tidak Valid', 401);
  }
  await assertUniqueProjectCode({ projectCode: payload.projectCode });
  try {
    return await projectRepository.createProjectWithInitialMembership({
      membership: {
        id: createEntityId('PMB'),
        assignedByUserId: actorUserId,
        userId: actorUserId,
      },
      project: {
        id: createEntityId('PRJ'),
        createdByUserId: actorUserId,
        description: payload.description,
        projectCode: payload.projectCode,
        projectName: payload.projectName,
        status: payload.status,
      },
    });
  } catch (error) {
    const duplicateError = mapDuplicateError(error, 'Kode Project Sudah Digunakan', 'projectCode');
    throw duplicateError || error;
  }
};

const updateProject = async ({ actorUserId, payload, projectId }) => {
  const currentProject = await assertProjectExists(projectId);
  assertOpenProject(currentProject);
  if (payload.status === PROJECT_STATUS.CLOSED) {
    throw createHttpError('Gunakan Close Project Untuk Menutup Project', 422, [
      { field: 'status', message: 'Gunakan Close Project Untuk Menutup Project' },
    ]);
  }
  await assertUniqueProjectCode({ currentProjectId: projectId, projectCode: payload.projectCode });

  return projectRepository.updateProject({
    projectId,
    project: {
      description: payload.description,
      projectCode: payload.projectCode,
      projectName: payload.projectName,
      status: payload.status,
      updatedByUserId: actorUserId,
    },
  });
};

const setProjectStatus = async ({ actorUserId, projectId, status }) => {
  const project = await assertProjectExists(projectId);
  assertOpenProject(project);
  if (status === PROJECT_STATUS.ACTIVE && project.status !== PROJECT_STATUS.INACTIVE) {
    throw createHttpError('Status Project Tidak Valid', 422);
  }
  if (status === PROJECT_STATUS.INACTIVE && project.status !== PROJECT_STATUS.ACTIVE) {
    throw createHttpError('Status Project Tidak Valid', 422);
  }
  return projectRepository.updateProjectStatus({ projectId, status, userId: actorUserId });
};

const getProjectClosureSummary = async (projectId) => {
  const project = await assertProjectExists(projectId);
  const summary = await projectRepository.getProjectClosureSummary(projectId);
  return {
    ...summary,
    project,
  };
};

const closeProject = async ({ actorUserId, payload, projectId }) => {
  const project = await assertProjectExists(projectId);
  if (project.status !== PROJECT_STATUS.ACTIVE) {
    throw createHttpError('Project Harus Active', 422, [
      { field: 'status', message: 'Project Harus Active' },
    ]);
  }
  if (payload.projectStatusSnapshot && payload.projectStatusSnapshot !== project.status) {
    throw createHttpError('Project Telah Berubah', 409, [
      { field: 'project', message: 'Project Telah Berubah' },
    ]);
  }
  if (normalizeKey(payload.projectCodeConfirmation) !== normalizeKey(project.projectCode)) {
    throw createHttpError('Kode Project Tidak Sesuai', 422, [
      { field: 'projectCodeConfirmation', message: 'Kode Project Tidak Sesuai' },
    ]);
  }
  const activeWorkflowDocument = await projectRepository.countActiveWorkflowDocuments(projectId);
  if (activeWorkflowDocument > 0) {
    throw createHttpError('Masih Ada Workflow Aktif', 409, [
      { field: 'workflow', message: 'Masih Ada Workflow Aktif' },
    ]);
  }
  const result = await projectRepository.closeProject({ projectId, userId: actorUserId });

  return {
    autoArchivedDocumentCount: result.autoArchivedDocumentCount,
    project: result.project,
  };
};

module.exports = {
  activateProject: ({ actorUserId, projectId }) =>
    setProjectStatus({ actorUserId, projectId, status: PROJECT_STATUS.ACTIVE }),
  closeProject,
  createProject,
  deactivateProject: ({ actorUserId, projectId }) =>
    setProjectStatus({ actorUserId, projectId, status: PROJECT_STATUS.INACTIVE }),
  getProjectClosureSummary,
  getProjectDetail,
  listProjects,
  updateProject,
};
