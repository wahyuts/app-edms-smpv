import projectsDataset from "@/mocks/projects.json";
import { AuthService } from "@/features/auth/services/auth.service";
import { UserService } from "@/features/user-management";
import {
  ROLE_NAME_BY_ID,
  USER_STATUSES,
} from "@/features/user-management/constants/user.constants";
import { UserRepository } from "@/features/user-management/repositories/user.repository";
import {
  DOCUMENT_LIFECYCLE,
  DOCUMENT_STATUS,
} from "@/features/document-register/constants/document.constants";
import {
  DocumentRepository,
  DocumentPersistenceRepository,
  HistoryRepository,
  MetadataRepository,
  RevisionRepository,
  WorkflowCommentRepository,
} from "@/features/document-register/repositories/document.repository";
import { NotificationRepository } from "@/features/notification/repositories/notification.repository";
import { AuditTrailRepository } from "@/features/audit-trail/repositories/audit-trail.repository";
import {
  AUDIT_RESOURCE_TYPE,
  AUDIT_TRAIL_ACTION,
  AuditTrailService,
} from "@/features/audit-trail";

import {
  ProjectMembershipRepository,
  ProjectPersistenceRepository,
  ProjectRepository,
} from "../repositories/project.repository";
import {
  PROJECT_MEMBERSHIP_STATUS,
  PROJECT_MEMBERSHIP_STATUS_OPTIONS,
  PROJECT_OFFICIAL_ROLE,
  PROJECT_OFFICIAL_ROLE_OPTIONS,
  PROJECT_STATUS,
  PROJECT_STATUS_OPTIONS,
} from "../constants/project.constants";
import {
  createProjectMembershipSchema,
  createProjectSchema,
  formatProjectValidationIssues,
  updateProjectMembershipSchema,
  updateProjectSchema,
} from "../schemas/project.schema";

export const DEFAULT_PROJECT_ID = "PRJ-APP-001";

const ACTIVE_PROJECT_STORAGE_KEY = "edms.activeProjectByUser";
const PROJECT_SEED_VERSION = 1;
const PROJECT_CONTEXT_MIGRATION_VERSION = 1;
const LEGACY_USER_MEMBERSHIP_MIGRATION_VERSION = 1;
const PROJECT_SEED_COMPLETED_KEY = "projectSeedCompleted";
const PROJECT_SEED_VERSION_KEY = "projectSeedVersion";
const PROJECT_CONTEXT_MIGRATION_VERSION_KEY = "projectContextMigrationVersion";
const LEGACY_USER_MEMBERSHIP_MIGRATION_VERSION_KEY =
  "legacyUserMembershipMigrationVersion";
const LEGACY_USER_MEMBERSHIP_MIGRATION_RESULT_KEY =
  "legacyUserMembershipMigrationResult";
const LEGACY_BASELINE_PROJECT_CODE = "APP-EDMS";

let initializationPromise = null;

const cloneValue = (value) => JSON.parse(JSON.stringify(value));
const normalizeText = (value) => String(value ?? "").trim();
const normalizeKey = (value) => normalizeText(value).toLowerCase();

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

const canUseStorage = () => (
  typeof window !== "undefined" && Boolean(window.localStorage)
);

const getStoredProjectMap = () => {
  if (!canUseStorage()) return {};

  try {
    return JSON.parse(window.localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY) ?? "{}");
  } catch {
    window.localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
    return {};
  }
};

const getStoredActiveProjectId = (userId) => {
  const projectMap = getStoredProjectMap();
  return projectMap[String(userId)] ?? null;
};

const persistActiveProjectId = (userId, projectId) => {
  if (!canUseStorage() || !userId) return;
  const projectMap = getStoredProjectMap();

  if (projectId) {
    projectMap[String(userId)] = projectId;
  } else {
    delete projectMap[String(userId)];
  }

  window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, JSON.stringify(projectMap));
};

const initialize = async () => {
  if (!initializationPromise) {
    initializationPromise = Promise.all([
      MetadataRepository.getById(PROJECT_SEED_COMPLETED_KEY),
      MetadataRepository.getById(PROJECT_SEED_VERSION_KEY),
      MetadataRepository.getById(PROJECT_CONTEXT_MIGRATION_VERSION_KEY),
      MetadataRepository.getById(LEGACY_USER_MEMBERSHIP_MIGRATION_VERSION_KEY),
    ])
      .then(async ([
        completedMetadata,
        versionMetadata,
        migrationMetadata,
        legacyMembershipMigrationMetadata,
      ]) => {
        if (
          completedMetadata?.value !== true ||
          versionMetadata?.value !== PROJECT_SEED_VERSION
        ) {
          await ProjectPersistenceRepository.runSeed({
            memberships: cloneValue(projectsDataset.projectMemberships),
            projects: cloneValue(projectsDataset.projects),
          });
        }

        if (migrationMetadata?.value !== PROJECT_CONTEXT_MIGRATION_VERSION) {
          await DocumentPersistenceRepository.runProjectContextMigration({
            defaultProjectId: DEFAULT_PROJECT_ID,
            metadata: {
              key: PROJECT_CONTEXT_MIGRATION_VERSION_KEY,
              value: PROJECT_CONTEXT_MIGRATION_VERSION,
            },
          });
        }

        await UserService.initialize();

        if (
          legacyMembershipMigrationMetadata?.value !==
          LEGACY_USER_MEMBERSHIP_MIGRATION_VERSION
        ) {
          if (await shouldRunLegacyUserMembershipMigration()) {
            await migrateLegacyUserMemberships();
          }
        }

        return { version: PROJECT_SEED_VERSION };
      })
      .catch((error) => {
        initializationPromise = null;
        throw error;
      });
  }

  return initializationPromise;
};

const isActiveProject = (project) => project?.status === PROJECT_STATUS.ACTIVE;
const isActiveMembership = (membership) =>
  membership?.status === PROJECT_MEMBERSHIP_STATUS.ACTIVE;
const isActiveUser = (user) => user?.isActive === true || user?.status === "Active";

const createMigrationResult = () => ({
  baselineProjectCode: LEGACY_BASELINE_PROJECT_CODE,
  baselineProjectId: DEFAULT_PROJECT_ID,
  failed: [],
  migrated: [],
  skipped: [],
});

const markLegacyMembershipMigrationSkipped = async (reason) => {
  const result = createMigrationResult();

  result.completedAt = new Date().toISOString();
  result.skipped.push({ reason });
  await ProjectPersistenceRepository.runLegacyMembershipMigration({
    metadata: {
      key: LEGACY_USER_MEMBERSHIP_MIGRATION_RESULT_KEY,
      value: cloneValue(result),
    },
  });
  await ProjectPersistenceRepository.runLegacyMembershipMigration({
    metadata: {
      key: LEGACY_USER_MEMBERSHIP_MIGRATION_VERSION_KEY,
      value: LEGACY_USER_MEMBERSHIP_MIGRATION_VERSION,
    },
  });

  return result;
};

const shouldRunLegacyUserMembershipMigration = async () => {
  const projectById = await ProjectRepository.getById(DEFAULT_PROJECT_ID);
  const baselineProject =
    projectById ?? await ProjectRepository.getByCode(LEGACY_BASELINE_PROJECT_CODE);

  if (!baselineProject) {
    await markLegacyMembershipMigrationSkipped(
      "Clean bootstrap baseline has no legacy baseline Project.",
    );
    return false;
  }

  return true;
};

const getProjects = async () => {
  await initialize();
  return ProjectRepository.getAll();
};

const normalizeProjectRecord = (project = {}) => {
  const projectCode = normalizeText(project.projectCode);
  const projectName = normalizeText(project.projectName ?? project.name);
  const status = PROJECT_STATUS_OPTIONS.includes(project.status)
    ? project.status
    : PROJECT_STATUS.ACTIVE;

  return {
    ...project,
    description: normalizeText(project.description),
    projectCode,
    projectName,
    status,
  };
};

const normalizeMembershipRecord = (membership = {}) => ({
  ...membership,
  officialRole: PROJECT_OFFICIAL_ROLE_OPTIONS.includes(membership.officialRole)
    ? membership.officialRole
    : PROJECT_OFFICIAL_ROLE.DOCUMENT_OWNER,
  status: PROJECT_MEMBERSHIP_STATUS_OPTIONS.includes(membership.status)
    ? membership.status
    : PROJECT_MEMBERSHIP_STATUS.ACTIVE,
});

const getStoredLegacyMembershipMigrationResult = async () => {
  const metadata = await MetadataRepository.getById(
    LEGACY_USER_MEMBERSHIP_MIGRATION_RESULT_KEY,
  );

  return metadata?.value ?? createMigrationResult();
};

const resolveLegacyBaselineProject = async () => {
  const projectById = await ProjectRepository.getById(DEFAULT_PROJECT_ID);
  const project = projectById ?? await ProjectRepository.getByCode(LEGACY_BASELINE_PROJECT_CODE);

  if (!project) {
    throw new ProjectValidationError(
      "Legacy baseline Project was not found.",
      [
        {
          field: "projectId",
          message: `Legacy baseline Project ${DEFAULT_PROJECT_ID} / ${LEGACY_BASELINE_PROJECT_CODE} was not found.`,
        },
      ],
    );
  }

  const normalizedProject = normalizeProjectRecord(project);
  if (!isActiveProject(normalizedProject)) {
    throw new ProjectValidationError("Legacy baseline Project is not Active.", [
      {
        field: "projectId",
        message: "Legacy baseline Project must be Active before legacy User migration.",
      },
    ]);
  }

  return normalizedProject;
};

const LEGACY_OFFICIAL_ROLE_MAPPING = Object.freeze(
  Object.fromEntries(PROJECT_OFFICIAL_ROLE_OPTIONS.map((roleName) => [roleName, roleName])),
);

const resolveLegacyOfficialRole = (user = {}) => {
  const explicitRole = normalizeText(user.officialRole);
  if (LEGACY_OFFICIAL_ROLE_MAPPING[explicitRole]) {
    return LEGACY_OFFICIAL_ROLE_MAPPING[explicitRole];
  }

  const roleFromId = ROLE_NAME_BY_ID[user.roleId] ?? ROLE_NAME_BY_ID[Number(user.roleId)];
  return LEGACY_OFFICIAL_ROLE_MAPPING[roleFromId] ?? null;
};

const resolveLegacyMembershipStatus = (user = {}) => {
  if (user.status === USER_STATUSES.ACTIVE) return PROJECT_MEMBERSHIP_STATUS.ACTIVE;
  if (user.status === USER_STATUSES.INACTIVE) return PROJECT_MEMBERSHIP_STATUS.INACTIVE;
  if (user.isActive === true) return PROJECT_MEMBERSHIP_STATUS.ACTIVE;
  if (user.isActive === false) return PROJECT_MEMBERSHIP_STATUS.INACTIVE;

  return null;
};

const isValidLegacyUserId = (userId) =>
  userId !== null && userId !== undefined && normalizeText(userId) !== "";

const createLegacyMembershipRecord = ({ baselineProject, officialRole, status, user }) => {
  const now = new Date().toISOString();

  return normalizeMembershipRecord({
    assignedBy: "Legacy User Membership Migration",
    assignedDate: now,
    id: createEntityId("PMB"),
    lastUpdated: now,
    lastUpdatedBy: "Legacy User Membership Migration",
    officialRole,
    projectId: baselineProject.id,
    status,
    userId: user.id,
  });
};

const migrateLegacyUserMemberships = async () => {
  const result = createMigrationResult();
  const baselineProject = await resolveLegacyBaselineProject();
  const users = await UserRepository.getAll();

  result.baselineProjectCode = baselineProject.projectCode;
  result.baselineProjectId = baselineProject.id;

  for (const user of users) {
    const userReference = user?.username ?? user?.id ?? "-";

    try {
      if (!isValidLegacyUserId(user?.id)) {
        result.failed.push({
          reason: "User ID is invalid.",
          user: userReference,
        });
        continue;
      }

      const existingMemberships = await ProjectMembershipRepository.getByUserId(user.id);
      if (existingMemberships.length > 0) {
        result.skipped.push({
          reason: "User already has Project Membership.",
          user: userReference,
        });
        continue;
      }

      const officialRole = resolveLegacyOfficialRole(user);
      if (!officialRole) {
        result.failed.push({
          reason: "Legacy Official Role is not recognized.",
          user: userReference,
        });
        continue;
      }

      const status = resolveLegacyMembershipStatus(user);
      if (!status) {
        result.failed.push({
          reason: "User Status cannot be mapped to Membership Status.",
          user: userReference,
        });
        continue;
      }

      const existingBaselineMembership =
        await ProjectMembershipRepository.getByProjectAndUser({
          projectId: baselineProject.id,
          userId: user.id,
        });

      if (existingBaselineMembership) {
        result.skipped.push({
          reason: "Baseline Project Membership already exists.",
          user: userReference,
        });
        continue;
      }

      const membership = createLegacyMembershipRecord({
        baselineProject,
        officialRole,
        status,
        user,
      });

      await ProjectPersistenceRepository.runLegacyMembershipMigration({
        membership,
      });
      result.migrated.push({
        membershipId: membership.id,
        officialRole,
        status,
        user: userReference,
        userId: user.id,
      });
    } catch (error) {
      result.failed.push({
        reason: error instanceof Error ? error.message : "Membership migration failed.",
        user: userReference,
      });
    }
  }

  result.completedAt = new Date().toISOString();
  await ProjectPersistenceRepository.runLegacyMembershipMigration({
    metadata: {
      key: LEGACY_USER_MEMBERSHIP_MIGRATION_RESULT_KEY,
      value: cloneValue(result),
    },
  });
  await ProjectPersistenceRepository.runLegacyMembershipMigration({
    metadata: {
      key: LEGACY_USER_MEMBERSHIP_MIGRATION_VERSION_KEY,
      value: LEGACY_USER_MEMBERSHIP_MIGRATION_VERSION,
    },
  });

  return result;
};

const parseSchema = (schema, payload) => {
  const result = schema.safeParse(payload);
  if (result.success) return result.data;

  throw new ProjectValidationError(
    "Validation failed.",
    formatProjectValidationIssues(result.error.issues),
  );
};

const createEntityId = (prefix) => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const ACTIVE_WORKFLOW_DOCUMENT_STATUSES = new Set([
  DOCUMENT_STATUS.PROCESS_REVIEW,
  DOCUMENT_STATUS.PROCESS_COMMENT,
  DOCUMENT_STATUS.PROCESS_REJECT,
  DOCUMENT_STATUS.PROJECT_REVIEW,
  DOCUMENT_STATUS.PROJECT_COMMENT,
  DOCUMENT_STATUS.PROJECT_REJECT,
]);

const ERR_PC_001 = "Project tidak ditemukan.";
const ERR_PC_002 = "Anda tidak memiliki hak untuk menutup Project.";
const ERR_PC_003 = "Project harus berstatus Active sebelum dapat ditutup.";
const ERR_PC_004 = "Masih terdapat Document yang belum menyelesaikan Workflow.";
const ERR_PC_005 = "Kode Project yang dimasukkan tidak sesuai.";
const ERR_PC_006 = "Konfirmasi harus disetujui terlebih dahulu.";
const ERR_PC_007 = "Project telah berubah selama proses berlangsung.\n\nSilakan muat ulang halaman.";

const isClosedProject = (project) => project?.status === PROJECT_STATUS.CLOSED;
const isArchivedLifecycle = (document = {}) =>
  document.lifecycle === DOCUMENT_LIFECYCLE.ARCHIVED;

const isApprovedActiveDocument = (document = {}) =>
  document.status === DOCUMENT_STATUS.APPROVED && !isArchivedLifecycle(document);

const isActiveWorkflowDocument = (document = {}) =>
  ACTIVE_WORKFLOW_DOCUMENT_STATUSES.has(document.status);

const assertCurrentUserIsAdmin = () => {
  const currentUser = AuthService.getCurrentUser();
  const currentRoleName = ROLE_NAME_BY_ID[currentUser?.roleId];

  if (currentRoleName !== PROJECT_OFFICIAL_ROLE.ADMIN) {
    throw new ProjectValidationError(ERR_PC_002, [
      { field: "authorization", message: ERR_PC_002 },
    ]);
  }

  return currentUser;
};

const assertProjectExists = async (projectId) => {
  const project = await getProjectById(projectId);
  if (!project) {
    throw new ProjectValidationError(ERR_PC_001, [
      { field: "id", message: ERR_PC_001 },
    ]);
  }

  return normalizeProjectRecord(project);
};

const assertMembershipExists = async (membershipId) => {
  await initialize();
  const membership = await ProjectMembershipRepository.getById(membershipId);
  if (!membership) {
    throw new ProjectValidationError("Project Membership was not found.", [
      { field: "id", message: "Project Membership was not found." },
    ]);
  }

  return normalizeMembershipRecord(membership);
};

const assertActiveProject = async (projectId) => {
  const project = await assertProjectExists(projectId);
  if (!isActiveProject(project)) {
    throw new ProjectValidationError("Validation failed.", [
      { field: "projectId", message: "Project must be Active." },
    ]);
  }

  return project;
};

const assertActiveUser = async (userId) => {
  const user = await UserService.getUserDetail(userId);
  if (!user) {
    throw new ProjectValidationError("Validation failed.", [
      { field: "userId", message: "User was not found." },
    ]);
  }
  if (!isActiveUser(user)) {
    throw new ProjectValidationError("Validation failed.", [
      { field: "userId", message: "User must be Active." },
    ]);
  }

  return user;
};

const checkProjectCodeUniqueness = async (projectCode, currentProjectId = null) => {
  await initialize();
  return ProjectRepository.checkProjectCodeUniqueness(projectCode, currentProjectId);
};

const assertUniqueProjectCode = async (projectCode, currentProjectId = null) => {
  if (!(await checkProjectCodeUniqueness(projectCode, currentProjectId))) {
    throw new ProjectValidationError("Validation failed.", [
      {
        field: "projectCode",
        message: "Project Code already exists.",
      },
    ]);
  }
};

const hasProjectOperationalData = async (projectId) => {
  if (!projectId) return false;

  const [
    documents,
    revisions,
    history,
    comments,
    notifications,
    auditRecords,
  ] = await Promise.all([
    DocumentRepository.getByProjectId(projectId),
    RevisionRepository.getByProjectId(projectId),
    HistoryRepository.getByProjectId(projectId),
    WorkflowCommentRepository.getByProjectId(projectId),
    NotificationRepository.getByProjectId(projectId),
    AuditTrailRepository.getByProjectId(projectId),
  ]);

  return [
    documents,
    revisions,
    history,
    comments,
    notifications,
    auditRecords,
  ].some((records) => records.length > 0);
};

const getProjectClosureSummary = async (projectId) => {
  await initialize();
  const project = await assertProjectExists(projectId);
  const documents = (await DocumentRepository.getByProjectId(projectId))
    .map((document) => ({
      ...document,
      lifecycle: Object.values(DOCUMENT_LIFECYCLE).includes(document.lifecycle)
        ? document.lifecycle
        : DOCUMENT_LIFECYCLE.ACTIVE,
    }));
  const approvedDocuments = documents.filter(isApprovedActiveDocument);
  const archivedDocuments = documents.filter(isArchivedLifecycle);
  const activeWorkflowDocuments = documents.filter(isActiveWorkflowDocument);

  return {
    activeWorkflowDocument: activeWorkflowDocuments.length,
    archivedDocument: archivedDocuments.length,
    approvedDocument: approvedDocuments.length,
    project,
    totalDocument: documents.length,
  };
};

const validateProjectClose = async (projectId) => {
  const currentUser = assertCurrentUserIsAdmin();
  const summary = await getProjectClosureSummary(projectId);

  if (!isActiveProject(summary.project)) {
    throw new ProjectValidationError(ERR_PC_003, [
      { field: "status", message: ERR_PC_003 },
    ]);
  }

  if (summary.activeWorkflowDocument > 0) {
    throw new ProjectValidationError(ERR_PC_004, [
      { field: "workflow", message: ERR_PC_004 },
    ]);
  }

  return {
    ...summary,
    validation: {
      checkedAt: new Date().toISOString(),
      projectStatus: summary.project.status,
      userId: currentUser.id,
    },
  };
};

const resolveProjectContextAfterClosure = async (user = AuthService.getCurrentUser()) => {
  if (user?.id) persistActiveProjectId(user.id, null);

  return {
    activeMembership: null,
    activeProject: null,
    accessibleProjects: await getAccessibleProjectsForUser(user),
  };
};

const getProjectById = async (projectId) => {
  await initialize();
  const project = await ProjectRepository.getById(projectId);
  return project ? cloneValue(project) : null;
};

const createProject = async (payload = {}) => {
  await initialize();
  const creator = AuthService.getCurrentUser();
  if (!creator?.id) {
    throw new ProjectValidationError("User session is not available.", [
      { field: "creator", message: "User session is not available." },
    ]);
  }

  const input = parseSchema(createProjectSchema, payload);
  await assertUniqueProjectCode(input.projectCode);

  const now = new Date().toISOString();
  const project = normalizeProjectRecord({
    createdBy: creator.fullName ?? creator.name ?? creator.username ?? "Current User",
    createdDate: now,
    description: input.description,
    id: createEntityId("PRJ"),
    lastUpdated: now,
    lastUpdatedBy: creator.fullName ?? creator.name ?? creator.username ?? "Current User",
    projectCode: input.projectCode,
    projectName: input.projectName,
    status: input.status,
  });
  const membership = {
    assignedBy: project.createdBy,
    assignedDate: now,
    id: createEntityId("PMB"),
    lastUpdated: now,
    lastUpdatedBy: project.createdBy,
    officialRole: PROJECT_OFFICIAL_ROLE.ADMIN,
    projectId: project.id,
    status: PROJECT_MEMBERSHIP_STATUS.ACTIVE,
    userId: creator.id,
  };

  await ProjectPersistenceRepository.runCreateProjectWithInitialMembership({
    membership,
    project,
  });

  return cloneValue(project);
};

const getActorName = () => {
  const currentUser = AuthService.getCurrentUser();

  return currentUser?.fullName ?? currentUser?.name ?? currentUser?.username ?? "Current User";
};

const recordMembershipAudit = async ({ action, membership, project, user }) => {
  await AuditTrailService.recordActivitySafely({
    action,
    metadata: {
      membershipStatus: membership.status,
      officialRole: membership.officialRole,
      projectCode: project?.projectCode ?? membership.projectId,
      targetUserId: membership.userId,
      targetUsername: user?.username ?? null,
    },
    projectId: membership.projectId,
    reference: `${project?.projectCode ?? membership.projectId} / ${
      user?.username ?? membership.userId
    }`,
    resourceId: membership.id,
    resourceType: AUDIT_RESOURCE_TYPE.PROJECT_MEMBERSHIP,
  });
};

const createProjectMembership = async (payload = {}) => {
  await initialize();
  const input = parseSchema(createProjectMembershipSchema, payload);
  const [project, user] = await Promise.all([
    assertActiveProject(input.projectId),
    assertActiveUser(input.userId),
  ]);

  if (
    !(await ProjectMembershipRepository.checkProjectUserUniqueness({
      projectId: input.projectId,
      userId: input.userId,
    }))
  ) {
    throw new ProjectValidationError("Validation failed.", [
      {
        field: "userId",
        message: "Membership for this Project and User already exists.",
      },
    ]);
  }

  const now = new Date().toISOString();
  const membership = normalizeMembershipRecord({
    assignedBy: getActorName(),
    assignedDate: now,
    id: createEntityId("PMB"),
    lastUpdated: now,
    lastUpdatedBy: getActorName(),
    officialRole: input.officialRole,
    projectId: input.projectId,
    status: input.status,
    userId: input.userId,
  });

  await ProjectMembershipRepository.create(membership);
  await recordMembershipAudit({
    action: AUDIT_TRAIL_ACTION.CREATE_PROJECT_MEMBERSHIP,
    membership,
    project,
    user,
  });

  return cloneValue(membership);
};

const updateProject = async (projectId, payload = {}) => {
  await initialize();
  const currentProject = await assertProjectExists(projectId);
  if (isClosedProject(currentProject)) {
    throw new ProjectValidationError("Closed Project tidak dapat diubah.", [
      { field: "status", message: "Closed Project tidak dapat diubah." },
    ]);
  }
  const input = parseSchema(updateProjectSchema, {
    ...payload,
    projectCode: payload.projectCode ?? currentProject.projectCode,
  });
  if (input.status === PROJECT_STATUS.CLOSED) {
    throw new ProjectValidationError(ERR_PC_003, [
      { field: "status", message: "Gunakan Wizard Close Project untuk menutup Project." },
    ]);
  }
  const nextProjectCode = normalizeText(input.projectCode);
  const projectCodeChanged =
    normalizeKey(nextProjectCode) !== normalizeKey(currentProject.projectCode);

  if (projectCodeChanged) {
    if (await hasProjectOperationalData(projectId)) {
      throw new ProjectValidationError("Validation failed.", [
        {
          field: "projectCode",
          message: "Project Code cannot be changed after the Project has operational data.",
        },
      ]);
    }
    await assertUniqueProjectCode(nextProjectCode, projectId);
  }

  const updatedProject = normalizeProjectRecord({
    ...currentProject,
    description: input.description,
    lastUpdated: new Date().toISOString(),
    lastUpdatedBy:
      AuthService.getCurrentUser()?.fullName ??
      AuthService.getCurrentUser()?.name ??
      AuthService.getCurrentUser()?.username ??
      "Current User",
    projectCode: nextProjectCode,
    projectName: input.projectName,
    status: input.status,
  });

  await ProjectRepository.put(updatedProject);
  return cloneValue(updatedProject);
};

const setProjectStatus = async (projectId, status) => {
  const currentProject = await assertProjectExists(projectId);
  if (isClosedProject(currentProject)) {
    throw new ProjectValidationError("Closed Project tidak dapat diubah.", [
      { field: "status", message: "Closed Project tidak dapat diubah." },
    ]);
  }
  if (
    status === PROJECT_STATUS.ACTIVE &&
    currentProject.status !== PROJECT_STATUS.INACTIVE
  ) {
    throw new ProjectValidationError("State transition Project tidak diperbolehkan.", [
      { field: "status", message: "State transition Project tidak diperbolehkan." },
    ]);
  }
  if (
    status === PROJECT_STATUS.INACTIVE &&
    currentProject.status !== PROJECT_STATUS.ACTIVE
  ) {
    throw new ProjectValidationError("State transition Project tidak diperbolehkan.", [
      { field: "status", message: "State transition Project tidak diperbolehkan." },
    ]);
  }
  if (status === PROJECT_STATUS.CLOSED) {
    throw new ProjectValidationError("Gunakan Wizard Close Project untuk menutup Project.", [
      { field: "status", message: "Gunakan Wizard Close Project untuk menutup Project." },
    ]);
  }
  return updateProject(projectId, {
    description: currentProject.description,
    projectName: currentProject.projectName,
    status,
  });
};

const activateProject = (projectId) => setProjectStatus(projectId, PROJECT_STATUS.ACTIVE);
const deactivateProject = (projectId) => setProjectStatus(projectId, PROJECT_STATUS.INACTIVE);

const closeProject = async ({
  confirmationAccepted = false,
  projectCodeConfirmation = "",
  projectId,
  projectStatusSnapshot,
} = {}) => {
  await initialize();
  const currentProject = await assertProjectExists(projectId);
  if (projectStatusSnapshot && currentProject.status !== projectStatusSnapshot) {
    throw new ProjectValidationError(ERR_PC_007, [
      { field: "project", message: ERR_PC_007 },
    ]);
  }
  const validation = await validateProjectClose(projectId);

  if (normalizeKey(projectCodeConfirmation) !== normalizeKey(validation.project.projectCode)) {
    throw new ProjectValidationError(ERR_PC_005, [
      { field: "projectCodeConfirmation", message: ERR_PC_005 },
    ]);
  }
  if (!confirmationAccepted) {
    throw new ProjectValidationError(ERR_PC_006, [
      { field: "confirmationAccepted", message: ERR_PC_006 },
    ]);
  }

  const closedAt = new Date().toISOString();
  const actorName = getActorName();
  const actorMembership = await getActiveMembership({
    projectId,
    user: AuthService.getCurrentUser(),
  });
  const actorOfficialRole =
    actorMembership?.officialRole ?? PROJECT_OFFICIAL_ROLE.ADMIN;
  const documents = (await DocumentRepository.getByProjectId(projectId))
    .map((document) => ({
      ...document,
      lifecycle: Object.values(DOCUMENT_LIFECYCLE).includes(document.lifecycle)
        ? document.lifecycle
        : DOCUMENT_LIFECYCLE.ACTIVE,
    }));
  const activeWorkflowDocuments = documents.filter(isActiveWorkflowDocument);
  if (activeWorkflowDocuments.length > 0) {
    throw new ProjectValidationError(ERR_PC_004, [
      { field: "workflow", message: ERR_PC_004 },
    ]);
  }

  const approvedDocuments = documents.filter(isApprovedActiveDocument);
  const archivedDocuments = approvedDocuments.map((document) => ({
    ...document,
    archivedAt: closedAt,
    archivedBy: actorName,
    archiveReason: "Project Closed",
    lastUpdated: closedAt,
    lastUpdatedBy: actorName,
    lifecycle: DOCUMENT_LIFECYCLE.ARCHIVED,
  }));
  const historyRecords = archivedDocuments.map((document) => ({
    activity: AUDIT_TRAIL_ACTION.DOCUMENT_ARCHIVED,
    createdBy: actorName,
    createdByOfficialRole: actorOfficialRole,
    createdDate: closedAt,
    documentId: document.id,
    id: createEntityId("DTL"),
    lifecycle: DOCUMENT_LIFECYCLE.ARCHIVED,
    projectId,
    reason: "Project Closed",
    revision: document.revision,
    status: document.status,
    workflowEvent: AUDIT_TRAIL_ACTION.DOCUMENT_ARCHIVED,
  }));
  const closedProject = normalizeProjectRecord({
    ...validation.project,
    closedAt,
    closedBy: actorName,
    lastUpdated: closedAt,
    lastUpdatedBy: actorName,
    status: PROJECT_STATUS.CLOSED,
  });

  await ProjectPersistenceRepository.runCloseProject({
    documents: archivedDocuments,
    historyRecords,
    project: closedProject,
  });

  await AuditTrailService.recordActivitySafely({
    action: AUDIT_TRAIL_ACTION.PROJECT_CLOSED,
    identityKey: [
      AUDIT_TRAIL_ACTION.PROJECT_CLOSED,
      closedProject.id,
      closedAt,
    ].join(":"),
    metadata: {
      autoArchivedDocumentCount: archivedDocuments.length,
      newStatus: PROJECT_STATUS.CLOSED,
      oldStatus: PROJECT_STATUS.ACTIVE,
      projectCode: closedProject.projectCode,
      projectName: closedProject.projectName,
    },
    projectId: closedProject.id,
    reference: closedProject.projectCode,
    resourceId: closedProject.id,
    resourceType: AUDIT_RESOURCE_TYPE.PROJECT,
  });

  return {
    autoArchivedDocumentCount: archivedDocuments.length,
    project: cloneValue(closedProject),
  };
};

const updateProjectMembership = async (membershipId, payload = {}) => {
  await initialize();
  const currentMembership = await assertMembershipExists(membershipId);
  const input = parseSchema(updateProjectMembershipSchema, payload);
  const [project, user] = await Promise.all([
    assertProjectExists(currentMembership.projectId),
    UserService.getUserDetail(currentMembership.userId),
  ]);

  if (isClosedProject(project)) {
    throw new ProjectValidationError("Membership Project Closed bersifat read only.", [
      { field: "status", message: "Membership Project Closed bersifat read only." },
    ]);
  }
  if (input.status === PROJECT_MEMBERSHIP_STATUS.ACTIVE && !isActiveProject(project)) {
    throw new ProjectValidationError("Validation failed.", [
      { field: "status", message: "Membership cannot be Active for an Inactive Project." },
    ]);
  }
  if (input.status === PROJECT_MEMBERSHIP_STATUS.ACTIVE && !isActiveUser(user)) {
    throw new ProjectValidationError("Validation failed.", [
      { field: "status", message: "Membership cannot be Active for an Inactive User." },
    ]);
  }

  const updatedMembership = normalizeMembershipRecord({
    ...currentMembership,
    lastUpdated: new Date().toISOString(),
    lastUpdatedBy: getActorName(),
    officialRole: input.officialRole,
    status: input.status,
  });

  await ProjectMembershipRepository.put(updatedMembership);
  await recordMembershipAudit({
    action: AUDIT_TRAIL_ACTION.UPDATE_PROJECT_MEMBERSHIP,
    membership: updatedMembership,
    project,
    user,
  });

  return cloneValue(updatedMembership);
};

const setProjectMembershipStatus = async (membershipId, status) => {
  const currentMembership = await assertMembershipExists(membershipId);
  const [project, user] = await Promise.all([
    assertProjectExists(currentMembership.projectId),
    UserService.getUserDetail(currentMembership.userId),
  ]);

  if (isClosedProject(project)) {
    throw new ProjectValidationError("Membership Project Closed bersifat read only.", [
      { field: "status", message: "Membership Project Closed bersifat read only." },
    ]);
  }
  if (status === PROJECT_MEMBERSHIP_STATUS.ACTIVE && !isActiveProject(project)) {
    throw new ProjectValidationError("Validation failed.", [
      { field: "status", message: "Membership cannot be Active for an Inactive Project." },
    ]);
  }
  if (status === PROJECT_MEMBERSHIP_STATUS.ACTIVE && !isActiveUser(user)) {
    throw new ProjectValidationError("Validation failed.", [
      { field: "status", message: "Membership cannot be Active for an Inactive User." },
    ]);
  }

  const updatedMembership = normalizeMembershipRecord({
    ...currentMembership,
    lastUpdated: new Date().toISOString(),
    lastUpdatedBy: getActorName(),
    status,
  });

  await ProjectMembershipRepository.put(updatedMembership);

  await recordMembershipAudit({
    action: status === PROJECT_MEMBERSHIP_STATUS.ACTIVE
      ? AUDIT_TRAIL_ACTION.ACTIVATE_PROJECT_MEMBERSHIP
      : AUDIT_TRAIL_ACTION.DEACTIVATE_PROJECT_MEMBERSHIP,
    membership: updatedMembership,
    project,
    user,
  });

  return updatedMembership;
};

const activateProjectMembership = (membershipId) =>
  setProjectMembershipStatus(membershipId, PROJECT_MEMBERSHIP_STATUS.ACTIVE);
const deactivateProjectMembership = (membershipId) =>
  setProjectMembershipStatus(membershipId, PROJECT_MEMBERSHIP_STATUS.INACTIVE);

const getProjectMemberships = async () => {
  await initialize();
  return cloneValue((await ProjectMembershipRepository.getAll()).map(normalizeMembershipRecord));
};

const getProjectMembershipsByUser = async (userId) => {
  await initialize();
  if (!userId) return [];
  return cloneValue(
    (await ProjectMembershipRepository.getByUserId(userId)).map(normalizeMembershipRecord),
  );
};

const getActiveProjectMemberships = async (projectId) => {
  await initialize();
  if (!projectId) return [];

  return (await ProjectMembershipRepository.getByProjectId(projectId))
    .map(normalizeMembershipRecord)
    .filter(isActiveMembership);
};

const getEnrichedProjectMemberships = async () => {
  const [memberships, projects, users] = await Promise.all([
    getProjectMemberships(),
    getProjects(),
    UserService.getUsers(),
  ]);
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const userById = new Map(users.map((user) => [String(user.id), user]));

  return memberships.map((membership) => {
    const project = projectById.get(membership.projectId);
    const user = userById.get(String(membership.userId));

    return {
      ...membership,
      projectCode: project?.projectCode ?? membership.projectId,
      projectName: project?.projectName ?? membership.projectId,
      projectStatus: project?.status ?? "-",
      userName: user?.fullName ?? user?.name ?? user?.username ?? String(membership.userId),
      userStatus: user?.status ?? (user?.isActive ? "Active" : "Inactive"),
      username: user?.username ?? String(membership.userId),
    };
  });
};

const searchProjects = (projects, search = "") => {
  const keyword = normalizeKey(search);
  if (!keyword) return cloneValue(projects);

  return cloneValue(projects.filter((project) =>
    [
      project.projectCode,
      project.projectName,
      project.description,
      project.status,
    ].some((fieldValue) => normalizeKey(fieldValue).includes(keyword)),
  ));
};

const filterProjects = (projects, filters = {}) => cloneValue(
  projects.filter((project) =>
    !filters.status || project.status === filters.status,
  ),
);

const getTimestamp = (value) => {
  const timestamp = new Date(value ?? "").getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const compareTimestampRecords = ({
  direction,
  firstRecord,
  secondRecord,
  sortBy,
  fallbackField = "id",
}) => {
  const firstTimestamp = getTimestamp(firstRecord[sortBy]);
  const secondTimestamp = getTimestamp(secondRecord[sortBy]);
  const multiplier = direction === "desc" ? -1 : 1;

  if (firstTimestamp !== null && secondTimestamp === null) return -1;
  if (firstTimestamp === null && secondTimestamp !== null) return 1;
  if (firstTimestamp !== null && secondTimestamp !== null) {
    if (firstTimestamp === secondTimestamp) return 0;
    return firstTimestamp > secondTimestamp ? multiplier : -multiplier;
  }

  const firstFallback = normalizeKey(firstRecord[fallbackField] ?? firstRecord.id);
  const secondFallback = normalizeKey(secondRecord[fallbackField] ?? secondRecord.id);
  if (firstFallback === secondFallback) return 0;
  return firstFallback > secondFallback ? -1 : 1;
};

const getSortableValue = (project, sortBy) =>
  normalizeKey(project[sortBy] ?? project.projectName);

const sortProjects = (projects, { direction = "desc", sortBy = "createdDate" } = {}) => {
  const multiplier = direction === "desc" ? -1 : 1;

  return cloneValue([...projects].sort((firstProject, secondProject) => {
    if (sortBy === "createdDate" || sortBy === "lastUpdated") {
      return compareTimestampRecords({
        direction,
        fallbackField: "projectCode",
        firstRecord: firstProject,
        secondRecord: secondProject,
        sortBy,
      });
    }

    const firstValue = getSortableValue(firstProject, sortBy);
    const secondValue = getSortableValue(secondProject, sortBy);

    if (firstValue === secondValue) return 0;
    return firstValue > secondValue ? multiplier : -multiplier;
  }));
};

const paginateProjects = (projects, { page = 1, pageSize = 10 } = {}) => {
  const normalizedPageSize = Math.max(1, Number(pageSize) || 10);
  const totalItems = projects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedPageSize));
  const normalizedPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const startIndex = (normalizedPage - 1) * normalizedPageSize;

  return {
    data: cloneValue(projects.slice(startIndex, startIndex + normalizedPageSize)),
    pagination: {
      page: normalizedPage,
      pageSize: normalizedPageSize,
      totalItems,
      totalPages,
    },
  };
};

const queryProjects = (projects, query = {}) => {
  const filteredProjects = filterProjects(
    searchProjects(projects, query.search),
    { status: query.status },
  );
  const sortedProjects = sortProjects(filteredProjects, {
    direction: query.direction ?? query.order,
    sortBy: query.sortBy ?? query.sort,
  });

  return paginateProjects(sortedProjects, {
    page: query.page,
    pageSize: query.pageSize,
  });
};

const searchProjectMemberships = (memberships, search = "") => {
  const keyword = normalizeKey(search);
  if (!keyword) return cloneValue(memberships);

  return cloneValue(memberships.filter((membership) =>
    [
      membership.projectCode,
      membership.projectName,
      membership.userName,
      membership.username,
      membership.officialRole,
      membership.status,
    ].some((fieldValue) => normalizeKey(fieldValue).includes(keyword)),
  ));
};

const filterProjectMemberships = (memberships, filters = {}) => cloneValue(
  memberships.filter((membership) =>
    (!filters.projectId || membership.projectId === filters.projectId) &&
    (!filters.officialRole || membership.officialRole === filters.officialRole) &&
    (!filters.status || membership.status === filters.status),
  ),
);

const getMembershipSortableValue = (membership, sortBy) =>
  normalizeKey(membership[sortBy] ?? membership.projectName);

const sortProjectMemberships = (
  memberships,
  { direction = "desc", sortBy = "assignedDate" } = {},
) => {
  const multiplier = direction === "desc" ? -1 : 1;

  return cloneValue([...memberships].sort((firstMembership, secondMembership) => {
    if (sortBy === "assignedDate" || sortBy === "lastUpdated") {
      return compareTimestampRecords({
        direction,
        fallbackField: "id",
        firstRecord: firstMembership,
        secondRecord: secondMembership,
        sortBy,
      });
    }

    const firstValue = getMembershipSortableValue(firstMembership, sortBy);
    const secondValue = getMembershipSortableValue(secondMembership, sortBy);

    if (firstValue === secondValue) return 0;
    return firstValue > secondValue ? multiplier : -multiplier;
  }));
};

const paginateProjectMemberships = (memberships, { page = 1, pageSize = 10 } = {}) =>
  paginateProjects(memberships, { page, pageSize });

const queryProjectMemberships = (memberships, query = {}) => {
  const filteredMemberships = filterProjectMemberships(
    searchProjectMemberships(memberships, query.search),
    {
      officialRole: query.officialRole,
      projectId: query.projectId,
      status: query.status,
    },
  );
  const sortedMemberships = sortProjectMemberships(filteredMemberships, {
    direction: query.direction ?? query.order,
    sortBy: query.sortBy ?? query.sort,
  });

  return paginateProjectMemberships(sortedMemberships, {
    page: query.page,
    pageSize: query.pageSize,
  });
};

const getProjectMembershipList = async (query = {}) =>
  queryProjectMemberships(await getEnrichedProjectMemberships(), query);

const getProjectList = async (query = {}) =>
  queryProjects((await getProjects()).map(normalizeProjectRecord), query);

const getAccessibleProjectsForUser = async (user = AuthService.getCurrentUser()) => {
  await initialize();
  if (!isActiveUser(user)) return [];

  const [projects, memberships] = await Promise.all([
    ProjectRepository.getAll(),
    ProjectMembershipRepository.getByUserId(user.id),
  ]);
  const activeMembershipProjectIds = new Set(
    memberships.filter(isActiveMembership).map((membership) => membership.projectId),
  );

  return cloneValue(projects.filter((project) =>
    isActiveProject(project) && activeMembershipProjectIds.has(project.id),
  ));
};

const getActiveMembership = async ({ projectId, user = AuthService.getCurrentUser() } = {}) => {
  if (!projectId || !isActiveUser(user)) return null;
  const memberships = await getProjectMembershipsByUser(user.id);
  return memberships.find((membership) =>
    membership.projectId === projectId && isActiveMembership(membership),
  ) ?? null;
};

const canAccessProject = async ({ projectId, user = AuthService.getCurrentUser() } = {}) => {
  const [project, membership] = await Promise.all([
    getProjectById(projectId),
    getActiveMembership({ projectId, user }),
  ]);

  return isActiveProject(project) && Boolean(membership);
};

const assertCanAccessProject = async ({
  projectId,
  user = AuthService.getCurrentUser(),
} = {}) => {
  const [project, membership] = await Promise.all([
    getProjectById(projectId),
    getActiveMembership({ projectId, user }),
  ]);

  if (!project) {
    throw new Error("Project Not Found.");
  }
  if (!isActiveProject(project)) {
    throw new Error("Project Inactive.");
  }
  if (!membership) {
    throw new Error("Project access denied.");
  }

  return { membership, project };
};

const getActiveUsersByOfficialRole = async ({ officialRole, projectId } = {}) => {
  await initialize();
  if (!projectId || !officialRole) return [];

  const [memberships, users] = await Promise.all([
    getActiveProjectMemberships(projectId),
    UserService.getUsers(),
  ]);
  const activeUsersById = new Map(
    users.filter(isActiveUser).map((user) => [String(user.id), user]),
  );

  return memberships
    .filter((membership) => membership.officialRole === officialRole)
    .map((membership) => {
      const user = activeUsersById.get(String(membership.userId));

      return user
        ? {
            ...user,
            projectMembershipId: membership.id,
            projectOfficialRole: membership.officialRole,
          }
        : null;
    })
    .filter(Boolean);
};

const resolveCurrentAssignee = async ({ officialRole, projectId } = {}) => {
  const [assignee] = await getActiveUsersByOfficialRole({ officialRole, projectId });

  return assignee?.fullName ?? assignee?.name ?? assignee?.username ?? null;
};

const resolveActiveProject = async (user = AuthService.getCurrentUser()) => {
  const accessibleProjects = await getAccessibleProjectsForUser(user);

  if (accessibleProjects.length === 0) {
    if (user?.id) persistActiveProjectId(user.id, null);
    return {
      activeMembership: null,
      activeProject: null,
      accessibleProjects,
    };
  }

  const storedProjectId = getStoredActiveProjectId(user.id);
  const activeProject =
    accessibleProjects.find((project) => project.id === storedProjectId) ??
    accessibleProjects[0];
  const activeMembership = await getActiveMembership({
    projectId: activeProject.id,
    user,
  });

  persistActiveProjectId(user.id, activeProject.id);

  return {
    activeMembership,
    activeProject,
    accessibleProjects,
  };
};

const setActiveProjectForUser = async ({ projectId, user = AuthService.getCurrentUser() } = {}) => {
  if (!user?.id) {
    throw new Error("User session is not available.");
  }
  if (!(await canAccessProject({ projectId, user }))) {
    throw new Error("Project cannot be accessed by current user.");
  }

  persistActiveProjectId(user.id, projectId);
  return resolveActiveProject(user);
};

export const ProjectService = {
  DEFAULT_PROJECT_ID,
  activateProjectMembership,
  activateProject,
  assertCanAccessProject,
  canAccessProject,
  checkProjectCodeUniqueness,
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
