import { apiClient } from "@/shared/api";
import { AuthService } from "@/features/auth/services/auth.service";
import { UserService } from "@/features/user-management";

import {
  PROJECT_MEMBERSHIP_STATUS,
  PROJECT_MEMBERSHIP_STATUS_OPTIONS,
  PROJECT_OFFICIAL_ROLE,
  PROJECT_OFFICIAL_ROLE_OPTIONS,
  PROJECT_STATUS,
  PROJECT_STATUS_OPTIONS,
} from "../constants/project.constants";

export const DEFAULT_PROJECT_ID = "PRJ-APP-001";

export {
  PROJECT_MEMBERSHIP_STATUS,
  PROJECT_MEMBERSHIP_STATUS_OPTIONS,
  PROJECT_OFFICIAL_ROLE_OPTIONS,
  PROJECT_STATUS,
  PROJECT_STATUS_OPTIONS,
};

export class ProjectValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = "ProjectValidationError";
    this.errors = errors;
  }
}

const cloneValue = (value) => JSON.parse(JSON.stringify(value));
const normalizeText = (value) => String(value ?? "").trim();
const normalizeKey = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getErrorMessage = (error, fallback = "Gagal memuat Project.") =>
  error?.response?.data?.message ?? error?.message ?? fallback;

const getErrorList = (error) => error?.response?.data?.errors ?? error?.errors ?? [];

const throwServiceError = (error, fallback) => {
  throw new ProjectValidationError(getErrorMessage(error, fallback), getErrorList(error));
};

const normalizeProjectRecord = (project = {}) => ({
  ...project,
  createdDate: project.createdDate ?? project.createdAt ?? null,
  description: normalizeText(project.description),
  lastUpdated: project.lastUpdated ?? project.updatedAt ?? null,
  projectCode: normalizeText(project.projectCode),
  projectName: normalizeText(project.projectName ?? project.name),
  status: PROJECT_STATUS_OPTIONS.includes(project.status) ? project.status : PROJECT_STATUS.ACTIVE,
});

const normalizeMembershipRecord = (membership = {}) => ({
  ...membership,
  assignedDate: membership.assignedDate ?? membership.assignedAt ?? null,
  lastUpdated: membership.lastUpdated ?? membership.updatedAt ?? null,
  officialRole: PROJECT_OFFICIAL_ROLE_OPTIONS.includes(membership.officialRole)
    ? membership.officialRole
    : PROJECT_OFFICIAL_ROLE.DOCUMENT_OWNER,
  status: PROJECT_MEMBERSHIP_STATUS_OPTIONS.includes(membership.status)
    ? membership.status
    : PROJECT_MEMBERSHIP_STATUS.ACTIVE,
});

const normalizeProjectContext = (context = {}) => ({
  accessibleProjects: cloneValue((context.accessibleProjects ?? []).map(normalizeProjectRecord)),
  activeMembership: context.activeMembership ? normalizeMembershipRecord(context.activeMembership) : null,
  activeProject: context.activeProject ? normalizeProjectRecord(context.activeProject) : null,
});

const unwrapCollection = (response) => ({
  data: response.data?.data?.data ?? [],
  pagination: response.data?.data?.pagination ?? {
    page: 1,
    pageSize: response.data?.data?.data?.length ?? 0,
    totalItems: response.data?.data?.data?.length ?? 0,
    totalPages: 1,
  },
});

const requestProjects = async (params = {}) => {
  try {
    return unwrapCollection(await apiClient.get("/v1/projects", { params }));
  } catch (error) {
    throwServiceError(error, "Gagal memuat Project.");
  }
};

const requestMemberships = async (params = {}) => {
  try {
    return unwrapCollection(await apiClient.get("/v1/project-memberships", { params }));
  } catch (error) {
    throwServiceError(error, "Gagal memuat Project Membership.");
  }
};

const getProjects = async () => {
  const { data } = await requestProjects({ page: 1, pageSize: 1000, sortBy: "createdAt", direction: "desc" });
  return cloneValue(data.map(normalizeProjectRecord));
};

const getProjectList = async (query = {}) => {
  const { data, pagination } = await requestProjects({
    ...query,
    pageSize: query.pageSize ?? query.limit ?? 10,
  });
  return { data: cloneValue(data.map(normalizeProjectRecord)), pagination };
};

const getProjectById = async (projectId) => {
  try {
    const response = await apiClient.get(`/v1/projects/${projectId}`);
    return normalizeProjectRecord(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Project tidak ditemukan.");
  }
};

const createProject = async (payload = {}) => {
  try {
    const response = await apiClient.post("/v1/projects", {
      description: payload.description ?? "",
      projectCode: payload.projectCode,
      projectName: payload.projectName,
      status: payload.status ?? PROJECT_STATUS.ACTIVE,
    });
    return normalizeProjectRecord(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Gagal membuat Project.");
  }
};

const updateProject = async (projectId, payload = {}) => {
  try {
    const response = await apiClient.put(`/v1/projects/${projectId}`, {
      description: payload.description ?? "",
      projectCode: payload.projectCode,
      projectName: payload.projectName,
      status: payload.status,
    });
    return normalizeProjectRecord(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Gagal mengubah Project.");
  }
};

const activateProject = async (projectId) => {
  try {
    const response = await apiClient.patch(`/v1/projects/${projectId}/activate`);
    return normalizeProjectRecord(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Gagal mengaktifkan Project.");
  }
};

const deactivateProject = async (projectId) => {
  try {
    const response = await apiClient.patch(`/v1/projects/${projectId}/deactivate`);
    return normalizeProjectRecord(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Gagal menonaktifkan Project.");
  }
};

const getProjectClosureSummary = async (projectId) => {
  try {
    const response = await apiClient.get(`/v1/projects/${projectId}/closure-summary`);
    const summary = response.data?.data ?? {};
    const project = normalizeProjectRecord(summary.project);
    return {
      ...summary,
      project,
      validation: {
        checkedAt: new Date().toISOString(),
        projectStatus: project.status,
        userId: AuthService.getCurrentUser()?.id ?? null,
      },
    };
  } catch (error) {
    throwServiceError(error, "Gagal memuat ringkasan Close Project.");
  }
};

const validateProjectClose = getProjectClosureSummary;

const closeProject = async ({
  confirmationAccepted = false,
  projectCodeConfirmation = "",
  projectId,
  projectStatusSnapshot,
} = {}) => {
  try {
    const response = await apiClient.post(`/v1/projects/${projectId}/close`, {
      confirmationAccepted,
      projectCodeConfirmation,
      projectStatusSnapshot,
    });
    return {
      ...response.data?.data,
      project: normalizeProjectRecord(response.data?.data?.project),
    };
  } catch (error) {
    throwServiceError(error, "Gagal menutup Project.");
  }
};

const getProjectMemberships = async () => {
  const { data } = await requestMemberships({ page: 1, pageSize: 1000, sortBy: "assignedAt", direction: "desc" });
  return cloneValue(data.map(normalizeMembershipRecord));
};

const getProjectMembershipList = async (query = {}) => {
  const { data, pagination } = await requestMemberships({
    ...query,
    pageSize: query.pageSize ?? query.limit ?? 10,
  });
  return { data: cloneValue(data.map(normalizeMembershipRecord)), pagination };
};

const getEnrichedProjectMemberships = getProjectMemberships;

const getProjectMembershipsByUser = async (userId) =>
  cloneValue((await getProjectMemberships()).filter((membership) => String(membership.userId) === String(userId)));

const getActiveProjectMemberships = async (projectId) =>
  cloneValue((await getProjectMemberships()).filter(
    (membership) => membership.projectId === projectId && membership.status === PROJECT_MEMBERSHIP_STATUS.ACTIVE,
  ));

const createProjectMembership = async (payload = {}) => {
  try {
    const response = await apiClient.post("/v1/project-memberships", payload);
    return normalizeMembershipRecord(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Gagal membuat Project Membership.");
  }
};

const updateProjectMembership = async (membershipId, payload = {}) => {
  try {
    const response = await apiClient.put(`/v1/project-memberships/${membershipId}`, payload);
    return normalizeMembershipRecord(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Gagal mengubah Project Membership.");
  }
};

const activateProjectMembership = async (membershipId) => {
  try {
    const response = await apiClient.patch(`/v1/project-memberships/${membershipId}/activate`);
    return normalizeMembershipRecord(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Gagal mengaktifkan Project Membership.");
  }
};

const deactivateProjectMembership = async (membershipId) => {
  try {
    const response = await apiClient.patch(`/v1/project-memberships/${membershipId}/deactivate`);
    return normalizeMembershipRecord(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Gagal menonaktifkan Project Membership.");
  }
};

const resolveActiveProject = async () => {
  try {
    const response = await apiClient.get("/v1/project-context");
    return normalizeProjectContext(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Gagal memuat konteks Project.");
  }
};

const setActiveProjectForUser = async ({ projectId } = {}) => {
  try {
    const response = await apiClient.post("/v1/project-context/active-project", { projectId });
    return normalizeProjectContext(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Gagal mengganti Project aktif.");
  }
};

const resolveProjectContextAfterClosure = async () => {
  const context = await resolveActiveProject();
  return {
    ...context,
    activeMembership: null,
    activeProject: null,
  };
};

const getAccessibleProjectsForUser = async () => (await resolveActiveProject()).accessibleProjects;

const getActiveMembership = async ({ projectId, user = AuthService.getCurrentUser() } = {}) => {
  if (!projectId || !user?.id) return null;
  return (await getProjectMembershipsByUser(user.id)).find(
    (membership) => membership.projectId === projectId && membership.status === PROJECT_MEMBERSHIP_STATUS.ACTIVE,
  ) ?? null;
};

const canAccessProject = async ({ projectId } = {}) =>
  (await getAccessibleProjectsForUser()).some((project) => project.id === projectId);

const assertCanAccessProject = async ({ projectId } = {}) => {
  const [project, membership] = await Promise.all([
    getProjectById(projectId),
    getActiveMembership({ projectId }),
  ]);
  if (!project) throw new Error("Project tidak ditemukan.");
  if (project.status !== PROJECT_STATUS.ACTIVE) throw new Error("Project tidak aktif.");
  if (!membership) throw new Error("Anda tidak memiliki akses Project.");
  return { membership, project };
};

const getActiveUsersByOfficialRole = async ({ officialRole, projectId } = {}) => {
  if (!projectId || !officialRole) return [];
  const [memberships, users] = await Promise.all([
    getActiveProjectMemberships(projectId),
    UserService.getUsers(),
  ]);
  const activeUsersById = new Map(users.filter((user) => user.status === "Active").map((user) => [String(user.id), user]));
  return memberships
    .filter((membership) => membership.officialRole === officialRole)
    .map((membership) => {
      const user = activeUsersById.get(String(membership.userId));
      return user ? { ...user, projectMembershipId: membership.id, projectOfficialRole: membership.officialRole } : null;
    })
    .filter(Boolean);
};

const resolveCurrentAssignee = async ({ officialRole, projectId } = {}) =>
  (await getActiveUsersByOfficialRole({ officialRole, projectId }))[0]?.fullName ?? null;

const hasProjectOperationalData = async () => false;
const getStoredLegacyMembershipMigrationResult = async () => ({
  failed: [],
  migrated: [],
  skipped: [{ reason: "Migrasi legacy hanya tersedia pada runtime mock lama." }],
});

const searchRecords = (records, search = "", fields = []) => {
  const keyword = normalizeKey(search);
  if (!keyword) return cloneValue(records);
  return cloneValue(records.filter((record) =>
    fields.some((fieldName) => normalizeKey(record[fieldName]).includes(keyword)),
  ));
};

const getTimestamp = (value) => {
  const timestamp = new Date(value ?? "").getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const compareRecords = (firstRecord, secondRecord, { direction = "desc", sortBy, fallbackField = "id" }) => {
  const multiplier = direction === "desc" ? -1 : 1;
  if (["createdDate", "createdAt", "lastUpdated", "updatedAt", "assignedDate", "assignedAt"].includes(sortBy)) {
    const firstTimestamp = getTimestamp(firstRecord[sortBy]);
    const secondTimestamp = getTimestamp(secondRecord[sortBy]);
    if (firstTimestamp !== null && secondTimestamp !== null && firstTimestamp !== secondTimestamp) {
      return firstTimestamp > secondTimestamp ? multiplier : -multiplier;
    }
  }
  const firstValue = normalizeKey(firstRecord[sortBy] ?? firstRecord[fallbackField]);
  const secondValue = normalizeKey(secondRecord[sortBy] ?? secondRecord[fallbackField]);
  if (firstValue === secondValue) return 0;
  return firstValue > secondValue ? multiplier : -multiplier;
};

const paginateRecords = (records, { page = 1, pageSize = 10 } = {}) => {
  const normalizedPageSize = Math.max(1, Number(pageSize) || 10);
  const totalItems = records.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedPageSize));
  const normalizedPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const startIndex = (normalizedPage - 1) * normalizedPageSize;
  return {
    data: cloneValue(records.slice(startIndex, startIndex + normalizedPageSize)),
    pagination: { page: normalizedPage, pageSize: normalizedPageSize, totalItems, totalPages },
  };
};

const filterProjects = (projects, filters = {}) =>
  cloneValue(projects.filter((project) => !filters.status || project.status === filters.status));

const searchProjects = (projects, search = "") =>
  searchRecords(projects, search, ["projectCode", "projectName", "description", "status"]);

const sortProjects = (projects, { direction = "desc", sortBy = "createdDate" } = {}) =>
  cloneValue([...projects].sort((firstProject, secondProject) =>
    compareRecords(firstProject, secondProject, { direction, fallbackField: "projectCode", sortBy }),
  ));

const paginateProjects = paginateRecords;

const queryProjects = (projects, query = {}) =>
  paginateProjects(
    sortProjects(filterProjects(searchProjects(projects, query.search), { status: query.status }), {
      direction: query.direction ?? query.order,
      sortBy: query.sortBy ?? query.sort,
    }),
    { page: query.page, pageSize: query.pageSize },
  );

const filterProjectMemberships = (memberships, filters = {}) =>
  cloneValue(memberships.filter((membership) =>
    (!filters.projectId || membership.projectId === filters.projectId) &&
    (!filters.officialRole || membership.officialRole === filters.officialRole) &&
    (!filters.status || membership.status === filters.status),
  ));

const searchProjectMemberships = (memberships, search = "") =>
  searchRecords(memberships, search, ["projectCode", "projectName", "userName", "username", "officialRole", "status"]);

const sortProjectMemberships = (memberships, { direction = "desc", sortBy = "assignedDate" } = {}) =>
  cloneValue([...memberships].sort((firstMembership, secondMembership) =>
    compareRecords(firstMembership, secondMembership, { direction, fallbackField: "id", sortBy }),
  ));

const paginateProjectMemberships = paginateRecords;

const queryProjectMemberships = (memberships, query = {}) =>
  paginateProjectMemberships(
    sortProjectMemberships(
      filterProjectMemberships(searchProjectMemberships(memberships, query.search), {
        officialRole: query.officialRole,
        projectId: query.projectId,
        status: query.status,
      }),
      { direction: query.direction ?? query.order, sortBy: query.sortBy ?? query.sort },
    ),
    { page: query.page, pageSize: query.pageSize },
  );

const initialize = async () => true;

export const ProjectService = {
  DEFAULT_PROJECT_ID,
  activateProjectMembership,
  activateProject,
  assertCanAccessProject,
  canAccessProject,
  checkProjectCodeUniqueness: async (projectCode, currentProjectId = null) =>
    !(await getProjects()).some((project) =>
      String(project.id) !== String(currentProjectId) && normalizeKey(project.projectCode) === normalizeKey(projectCode),
    ),
  closeProject,
  createProjectMembership,
  createProject,
  deactivateProjectMembership,
  deactivateProject,
  filterProjects,
  filterProjectMemberships,
  getAccessibleProjectsForUser,
  getActiveMembership,
  getActiveProjectMemberships,
  getActiveUsersByOfficialRole,
  getEnrichedProjectMemberships,
  getProjectMembershipList,
  getProjectMemberships,
  getProjectList,
  getProjectById,
  getProjectMembershipsByUser,
  getProjects,
  getStoredLegacyMembershipMigrationResult,
  hasProjectOperationalData,
  initialize,
  paginateProjects,
  paginateProjectMemberships,
  queryProjectMemberships,
  queryProjects,
  resolveActiveProject,
  resolveProjectContextAfterClosure,
  resolveCurrentAssignee,
  searchProjectMemberships,
  searchProjects,
  setActiveProjectForUser,
  sortProjectMemberships,
  sortProjects,
  updateProjectMembership,
  updateProject,
  validateProjectClose,
  getProjectClosureSummary,
};

export default ProjectService;
