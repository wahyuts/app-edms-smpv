import {
  EDMS_STORE,
  runEdmsTransaction,
  runStoreRequest,
} from "@/shared/services/indexeddb.service";

const cloneValue = (value) => JSON.parse(JSON.stringify(value));
const normalizeText = (value) => String(value ?? "").trim();
const normalizeKey = (value) => normalizeText(value).toLowerCase();

const createRepository = (storeName) => ({
  clear: () => runStoreRequest(storeName, "readwrite", (store) => store.clear()),
  count: () => runStoreRequest(storeName, "readonly", (store) => store.count()),
  getAll: async () => cloneValue(
    await runStoreRequest(storeName, "readonly", (store) => store.getAll()),
  ),
  getById: async (id) => (
    await runStoreRequest(storeName, "readonly", (store) => store.get(id))
  ) ?? null,
  put: (record) => runStoreRequest(storeName, "readwrite", (store) => store.put(record)),
});

export const ProjectRepository = {
  ...createRepository(EDMS_STORE.PROJECTS),
  create: (project) => runStoreRequest(
    EDMS_STORE.PROJECTS,
    "readwrite",
    (store) => store.add(project),
  ),
  checkProjectCodeUniqueness: async (projectCode, currentProjectId = null) => {
    const projectCodeKey = normalizeKey(projectCode);
    if (!projectCodeKey) return false;

    const projects = await ProjectRepository.getAll();
    return !projects.some((project) =>
      project.id !== currentProjectId &&
      normalizeKey(project.projectCode) === projectCodeKey,
    );
  },
  getByCode: async (projectCode) => (
    await runStoreRequest(
      EDMS_STORE.PROJECTS,
      "readonly",
      (store) => store.index("projectCode").get(projectCode),
    )
  ) ?? null,
};

export const ProjectMembershipRepository = {
  ...createRepository(EDMS_STORE.PROJECT_MEMBERSHIPS),
  create: (membership) => runStoreRequest(
    EDMS_STORE.PROJECT_MEMBERSHIPS,
    "readwrite",
    (store) => store.add(membership),
  ),
  checkProjectUserUniqueness: async ({ currentMembershipId = null, projectId, userId }) => {
    const memberships = await ProjectMembershipRepository.getByProjectId(projectId);

    return !memberships.some((membership) =>
      membership.id !== currentMembershipId &&
      String(membership.userId) === String(userId),
    );
  },
  getByProjectAndUser: async ({ projectId, userId }) => {
    const memberships = await ProjectMembershipRepository.getByProjectId(projectId);

    return cloneValue(memberships.find((membership) =>
      String(membership.userId) === String(userId),
    ) ?? null);
  },
  getByProjectId: async (projectId) => cloneValue(
    await runStoreRequest(
      EDMS_STORE.PROJECT_MEMBERSHIPS,
      "readonly",
      (store) => store.index("projectId").getAll(projectId),
    ),
  ),
  getByUserId: async (userId) => cloneValue(
    await runStoreRequest(
      EDMS_STORE.PROJECT_MEMBERSHIPS,
      "readonly",
      (store) => store.index("userId").getAll(userId),
    ),
  ),
};

export const ProjectPersistenceRepository = {
  runCloseProject: ({ documents, historyRecords, project }) => runEdmsTransaction(
    [EDMS_STORE.PROJECTS, EDMS_STORE.DOCUMENTS, EDMS_STORE.DOCUMENT_HISTORY],
    "readwrite",
    (stores) => {
      stores[EDMS_STORE.PROJECTS].put(project);
      documents.forEach((document) => stores[EDMS_STORE.DOCUMENTS].put(document));
      historyRecords.forEach((historyRecord) =>
        stores[EDMS_STORE.DOCUMENT_HISTORY].add(historyRecord),
      );
    },
  ),
  runCreateProjectWithInitialMembership: ({ membership, project }) => runEdmsTransaction(
    [EDMS_STORE.PROJECTS, EDMS_STORE.PROJECT_MEMBERSHIPS],
    "readwrite",
    (stores) => {
      stores[EDMS_STORE.PROJECTS].add(project);
      stores[EDMS_STORE.PROJECT_MEMBERSHIPS].add(membership);
    },
  ),
  runMutation: (operation) => runEdmsTransaction(
    [EDMS_STORE.PROJECTS, EDMS_STORE.PROJECT_MEMBERSHIPS],
    "readwrite",
    operation,
  ),
  runLegacyMembershipMigration: ({ membership, metadata }) => runEdmsTransaction(
    [EDMS_STORE.PROJECT_MEMBERSHIPS, EDMS_STORE.METADATA],
    "readwrite",
    (stores) => {
      if (membership) {
        stores[EDMS_STORE.PROJECT_MEMBERSHIPS].add(membership);
      }
      if (metadata) {
        stores[EDMS_STORE.METADATA].put(metadata);
      }
    },
  ),
  runSeed: ({ memberships, projects }) => runEdmsTransaction(
    [EDMS_STORE.PROJECTS, EDMS_STORE.PROJECT_MEMBERSHIPS, EDMS_STORE.METADATA],
    "readwrite",
    (stores) => {
      projects.forEach((project) => stores[EDMS_STORE.PROJECTS].put(project));
      memberships.forEach((membership) =>
        stores[EDMS_STORE.PROJECT_MEMBERSHIPS].put(membership),
      );
      stores[EDMS_STORE.METADATA].put({
        key: "projectSeedCompleted",
        value: true,
      });
      stores[EDMS_STORE.METADATA].put({
        key: "projectSeedVersion",
        value: 1,
      });
    },
  ),
};

export default ProjectRepository;
