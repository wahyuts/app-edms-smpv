import { env } from "@/app/config/env";
import { AuthService } from "@/features/auth/services/auth.service";
import {
  ROLE_ID_BY_NAME,
  USER_STATUSES,
} from "@/features/user-management/constants/user.constants";
import { DEPARTMENT_STATUSES } from "@/features/user-management/constants/department.constants";
import { AuthorizationService } from "@/shared/services/authorization.service";
import {
  EDMS_STORE,
  runEdmsTransaction,
} from "@/shared/services/indexeddb.service";
import { queryClient } from "@/shared/api/query-client";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

const BOOTSTRAP_USERNAME = "wahyuts";
const CONFIRMATION_TEXT = "RESET ALL DEMO DATA";
const RESET_PERMISSION = "user-management.view";
const ADMIN_ROLE_NAME = "Admin";

const USER_COMPATIBILITY_VERSION = 1;
const DEPARTMENT_SEED_VERSION = 1;
const DOCUMENT_SEED_VERSION = 2;
const PROJECT_SEED_VERSION = 1;
const PROJECT_CONTEXT_MIGRATION_VERSION = 1;
const LEGACY_USER_MEMBERSHIP_MIGRATION_VERSION = 1;

const ACTIVE_PROJECT_STORAGE_KEY = "edms.activeProjectByUser";
const CURRENT_USER_STORAGE_KEY = "edms.currentUser";

const allStoreNames = Object.values(EDMS_STORE);

export class DemoDataResetError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = "DemoDataResetError";
    this.errors = errors;
  }
}

const normalizeText = (value) => String(value ?? "").trim();
const normalizeKey = (value) => normalizeText(value).toLowerCase();
const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const requestToPromise = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });

const isFeatureEnabled = () => env.ENABLE_DEMO_RESET === true;

const assertFeatureEnabled = () => {
  if (!isFeatureEnabled()) {
    throw new DemoDataResetError("Reset All Demo Data is disabled by configuration.");
  }
};

const assertConfirmationText = (confirmationText) => {
  if (confirmationText !== CONFIRMATION_TEXT) {
    throw new DemoDataResetError("Confirmation text does not match.");
  }
};

const assertAuthorizedExecutor = () => {
  const currentUser = AuthService.getCurrentUser();
  const currentRole = AuthorizationService.getCurrentRole();

  if (!currentUser?.id) {
    throw new DemoDataResetError("User session is not available.");
  }
  if (currentRole?.roleName !== ADMIN_ROLE_NAME) {
    throw new DemoDataResetError("Only Admin can reset demo data.");
  }
  if (!AuthorizationService.hasPermission(RESET_PERMISSION)) {
    throw new DemoDataResetError("Admin permission is required to reset demo data.");
  }

  return currentUser;
};

const getDepartmentName = (department) =>
  normalizeText(department?.name ?? department?.departmentName);

const normalizeDepartment = (department) => {
  const name = getDepartmentName(department);

  return {
    ...department,
    departmentName: name,
    name,
    nameKey: normalizeKey(name),
    status: department.status ?? DEPARTMENT_STATUSES.ACTIVE,
    updatedAt: department.updatedAt ?? null,
  };
};

const normalizeBootstrapUser = (user) => ({
  ...user,
  isActive: true,
  officialRole: "Admin",
  roleId: ROLE_ID_BY_NAME.Admin,
  status: USER_STATUSES.ACTIVE,
});

const validateBootstrapUser = ({ credentials, departments, users }) => {
  const bootstrapUsers = users.filter((user) =>
    normalizeKey(user.username) === BOOTSTRAP_USERNAME,
  );

  if (bootstrapUsers.length === 0) {
    throw new DemoDataResetError("Protected bootstrap user wahyuts was not found.");
  }
  if (bootstrapUsers.length > 1) {
    throw new DemoDataResetError("Protected bootstrap user wahyuts has duplicate records.");
  }

  const bootstrapUserRecord = bootstrapUsers[0];
  const bootstrapUser = normalizeBootstrapUser(bootstrapUserRecord);
  const credential = credentials.find((item) =>
    String(item.userId) === String(bootstrapUser.id),
  );

  if (!credential) {
    throw new DemoDataResetError("Protected bootstrap user credential was not found.");
  }
  if (
    bootstrapUserRecord.status !== USER_STATUSES.ACTIVE ||
    bootstrapUserRecord.isActive !== true
  ) {
    throw new DemoDataResetError("Protected bootstrap user must be Active.");
  }
  if (Number(bootstrapUserRecord.roleId) !== ROLE_ID_BY_NAME.Admin) {
    throw new DemoDataResetError("Protected bootstrap user must have Admin role.");
  }
  if (credential.isActive !== true) {
    throw new DemoDataResetError("Protected bootstrap user credential must be Active.");
  }

  const departmentName = normalizeText(bootstrapUser.department);
  if (!departmentName) {
    throw new DemoDataResetError("Protected bootstrap user Department is required.");
  }

  const matchingDepartments = departments.filter((department) =>
    normalizeKey(getDepartmentName(department)) === normalizeKey(departmentName),
  );

  if (matchingDepartments.length === 0) {
    throw new DemoDataResetError("Protected bootstrap user Department was not found.");
  }
  if (matchingDepartments.length > 1) {
    throw new DemoDataResetError("Protected bootstrap user Department has duplicate records.");
  }

  return {
    bootstrapDepartment: normalizeDepartment({
      ...matchingDepartments[0],
      status: DEPARTMENT_STATUSES.ACTIVE,
    }),
    bootstrapUser,
    credential,
  };
};

const putMetadata = (metadataStore, records) => {
  records.forEach((record) => metadataStore.put(record));
};

const writeBootstrapFinalState = (stores, plan) => {
  Object.values(EDMS_STORE).forEach((storeName) => {
    stores[storeName].clear();
  });

  stores[EDMS_STORE.USERS].put(plan.bootstrapUser);
  stores[EDMS_STORE.USER_CREDENTIALS].put(plan.credential);
  stores[EDMS_STORE.DEPARTMENTS].put(plan.bootstrapDepartment);

  putMetadata(stores[EDMS_STORE.METADATA], [
    { key: "authSeedCompleted", value: true },
    { key: "authSeedVersion", value: USER_COMPATIBILITY_VERSION },
    { key: "userCompatibilityVersion", value: USER_COMPATIBILITY_VERSION },
    { key: "departmentSeedVersion", value: DEPARTMENT_SEED_VERSION },
    { key: "documentSeedCompleted", value: true },
    { key: "documentSeedVersion", value: DOCUMENT_SEED_VERSION },
    { key: "projectSeedCompleted", value: true },
    { key: "projectSeedVersion", value: PROJECT_SEED_VERSION },
    {
      key: "projectContextMigrationVersion",
      value: PROJECT_CONTEXT_MIGRATION_VERSION,
    },
    {
      key: "legacyUserMembershipMigrationVersion",
      value: LEGACY_USER_MEMBERSHIP_MIGRATION_VERSION,
    },
    {
      key: "demoDataResetCompletedAt",
      value: new Date().toISOString(),
    },
  ]);
};

const validateFinalState = async (stores, plan) => {
  const [
    users,
    credentials,
    departments,
    projects,
    memberships,
    documents,
    revisions,
    history,
    comments,
    readReceipts,
    notifications,
    auditTrail,
    files,
  ] = await Promise.all([
    requestToPromise(stores[EDMS_STORE.USERS].getAll()),
    requestToPromise(stores[EDMS_STORE.USER_CREDENTIALS].getAll()),
    requestToPromise(stores[EDMS_STORE.DEPARTMENTS].getAll()),
    requestToPromise(stores[EDMS_STORE.PROJECTS].getAll()),
    requestToPromise(stores[EDMS_STORE.PROJECT_MEMBERSHIPS].getAll()),
    requestToPromise(stores[EDMS_STORE.DOCUMENTS].getAll()),
    requestToPromise(stores[EDMS_STORE.DOCUMENT_REVISIONS].getAll()),
    requestToPromise(stores[EDMS_STORE.DOCUMENT_HISTORY].getAll()),
    requestToPromise(stores[EDMS_STORE.WORKFLOW_COMMENTS].getAll()),
    requestToPromise(stores[EDMS_STORE.COMMENT_READ_RECEIPTS].getAll()),
    requestToPromise(stores[EDMS_STORE.NOTIFICATIONS].getAll()),
    requestToPromise(stores[EDMS_STORE.AUDIT_TRAIL].getAll()),
    requestToPromise(stores[EDMS_STORE.FILES].getAll()),
  ]);

  const bootstrapUser = users[0];
  const bootstrapCredential = credentials[0];
  const bootstrapDepartment = departments[0];
  const operationalRecordCount = [
    projects,
    memberships,
    documents,
    revisions,
    history,
    comments,
    readReceipts,
    notifications,
    auditTrail,
    files,
  ].reduce((total, records) => total + records.length, 0);

  if (
    users.length !== 1 ||
    normalizeKey(bootstrapUser?.username) !== BOOTSTRAP_USERNAME ||
    bootstrapUser?.id !== plan.bootstrapUser.id ||
    bootstrapUser?.email !== plan.bootstrapUser.email ||
    bootstrapUser?.status !== USER_STATUSES.ACTIVE ||
    Number(bootstrapUser?.roleId) !== ROLE_ID_BY_NAME.Admin
  ) {
    throw new DemoDataResetError("Final-state validation failed for bootstrap user.");
  }
  if (
    credentials.length !== 1 ||
    String(bootstrapCredential?.userId) !== String(plan.bootstrapUser.id) ||
    bootstrapCredential?.password !== plan.credential.password
  ) {
    throw new DemoDataResetError("Final-state validation failed for bootstrap credential.");
  }
  if (
    departments.length !== 1 ||
    normalizeKey(getDepartmentName(bootstrapDepartment)) !==
      normalizeKey(plan.bootstrapUser.department)
  ) {
    throw new DemoDataResetError("Final-state validation failed for Department dependency.");
  }
  if (operationalRecordCount !== 0) {
    throw new DemoDataResetError("Final-state validation failed because operational data remains.");
  }

  return {
    auditTrailCount: auditTrail.length,
    departmentCount: departments.length,
    documentCount: documents.length,
    notificationCount: notifications.length,
    projectCount: projects.length,
    projectMembershipCount: memberships.length,
    userCount: users.length,
  };
};

const runAtomicReset = async () =>
  runEdmsTransaction(allStoreNames, "readwrite", async (stores, transaction) => {
    try {
      const [users, credentials, departments] = await Promise.all([
        requestToPromise(stores[EDMS_STORE.USERS].getAll()),
        requestToPromise(stores[EDMS_STORE.USER_CREDENTIALS].getAll()),
        requestToPromise(stores[EDMS_STORE.DEPARTMENTS].getAll()),
      ]);
      const plan = validateBootstrapUser({ credentials, departments, users });

      writeBootstrapFinalState(stores, plan);
      const finalState = await validateFinalState(stores, plan);

      return {
        finalState,
        plan: cloneValue(plan),
      };
    } catch (error) {
      transaction.abort();
      throw error;
    }
  });

const clearRuntimeState = async () => {
  const failures = [];

  try {
    queryClient.clear();
  } catch (error) {
    failures.push(error);
  }

  try {
    useProjectContextStore.getState().clearProjectContext();
  } catch (error) {
    failures.push(error);
  }

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
      window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
    AuthService.clearCurrentUser();
  } catch (error) {
    failures.push(error);
  }

  if (failures.length > 0) {
    throw new DemoDataResetError("Reset data succeeded, but runtime state cleanup failed.");
  }
};

const resetAllDemoData = async ({ confirmationText } = {}) => {
  assertFeatureEnabled();
  assertConfirmationText(confirmationText);
  assertAuthorizedExecutor();

  const resetResult = await runAtomicReset();

  await clearRuntimeState();

  return {
    bootstrapUsername: BOOTSTRAP_USERNAME,
    finalState: resetResult.finalState,
    success: true,
  };
};

export const DemoDataResetService = {
  BOOTSTRAP_USERNAME,
  CONFIRMATION_TEXT,
  RESET_PERMISSION,
  isFeatureEnabled,
  resetAllDemoData,
};

export default DemoDataResetService;
