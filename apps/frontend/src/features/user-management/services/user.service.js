import {
  DEFAULT_USER_STATUS,
  USER_DEPARTMENT_OPTIONS,
  USER_STATUSES,
  USER_STATUS_OPTIONS,
} from "../constants/user.constants";
import {
  UserCredentialRepository,
  UserPersistenceRepository,
  UserRepository,
} from "../repositories/user.repository";
import {
  AUDIT_RESOURCE_TYPE,
  AUDIT_TRAIL_ACTION,
  AuditTrailService,
} from "@/features/audit-trail";
import {
  changeUserPasswordSchema,
  createUserSchema,
  formatValidationIssues,
  updateUserSchema,
} from "../schemas/user.schema";
import { DepartmentService } from "./department.service";
import { UserSeedService, normalizeUserRecord } from "./user-seed.service";

let initializationPromise = null;

const initialize = async () => {
  if (!initializationPromise) {
    initializationPromise = UserSeedService.initialize().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
};

export class UserValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = "UserValidationError";
    this.errors = errors;
  }
}

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const normalizeText = (value) => String(value ?? "").trim();
const normalizeKey = (value) => normalizeText(value).toLowerCase();

const parseSchema = (schema, payload) => {
  const result = schema.safeParse(payload);
  if (result.success) return result.data;

  throw new UserValidationError(
    "Validation failed.",
    formatValidationIssues(result.error.issues),
  );
};

const createEntityId = (users) => {
  const numericIds = users
    .map((user) => Number(user.id))
    .filter((id) => Number.isFinite(id));
  return numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
};

const createUserCode = (id) =>
  `USR-${String(id).padStart(6, "0")}`;

const mapUserListItem = (user) => {
  const normalizedUser = normalizeUserRecord(user);

  return {
    ...normalizedUser,
    name: normalizedUser.name,
    status: normalizedUser.status,
  };
};

const getUsers = async () => {
  await initialize();
  const users = await UserRepository.getAll();
  return cloneValue(users.map(mapUserListItem));
};

const getUserList = async (query = {}) => queryUsers(await getUsers(), query);

const getUserDetail = async (userId) => {
  await initialize();
  const user = await UserRepository.getById(userId);
  return user ? cloneValue(mapUserListItem(user)) : null;
};

const getUserByUsername = async (username) => {
  await initialize();
  const user = await UserRepository.getByUsername(username);
  return user ? cloneValue(mapUserListItem(user)) : null;
};

const checkUsernameUniqueness = async (username, currentUserId = null) => {
  await initialize();
  const usernameKey = normalizeKey(username);
  if (!usernameKey) return false;

  const users = await UserRepository.getAll();
  return !users.some((user) =>
    user.id !== currentUserId && normalizeKey(user.username) === usernameKey,
  );
};

const checkEmailUniqueness = async (email, currentUserId = null) => {
  await initialize();
  const emailKey = normalizeKey(email);
  if (!emailKey) return false;

  const users = await UserRepository.getAll();
  return !users.some((user) =>
    user.id !== currentUserId && normalizeKey(user.email) === emailKey,
  );
};

const assertUniqueUserFields = async ({ email, username }, currentUserId = null) => {
  const errors = [];
  if (!(await checkUsernameUniqueness(username, currentUserId))) {
    errors.push({
      field: "username",
      message: "Username already exists.",
    });
  }
  if (!(await checkEmailUniqueness(email, currentUserId))) {
    errors.push({
      field: "email",
      message: "Email already exists.",
    });
  }
  if (errors.length > 0) {
    throw new UserValidationError("Validation failed.", errors);
  }
};

const assertAssignableDepartment = async (departmentName, currentDepartmentName = null) => {
  const normalizedDepartmentName = normalizeText(departmentName);
  const isCurrentDepartment =
    normalizeKey(normalizedDepartmentName) === normalizeKey(currentDepartmentName);

  if (isCurrentDepartment) return;

  if (!(await DepartmentService.isActiveDepartmentName(normalizedDepartmentName))) {
    throw new UserValidationError("Validation failed.", [
      {
        field: "department",
        message: "Department must use an active Department Master Data record.",
      },
    ]);
  }
};

const createUser = async (payload = {}) => {
  await initialize();
  const input = parseSchema(createUserSchema, payload);

  await assertUniqueUserFields(input);
  await assertAssignableDepartment(input.department);

  const users = await UserRepository.getAll();
  const id = createEntityId(users);
  const now = new Date().toISOString();
  const user = normalizeUserRecord({
    createdAt: now,
    department: input.department,
    email: input.email,
    fullName: input.name,
    id,
    isActive: true,
    name: input.name,
    status: DEFAULT_USER_STATUS,
    updatedAt: null,
    userCode: createUserCode(id),
    username: input.username,
  });
  const credential = {
    isActive: true,
    password: input.initialPassword,
    updatedAt: now,
    userId: id,
  };

  await UserPersistenceRepository.runMutation((stores) => {
    stores.users.add(user);
    stores.userCredentials.add(credential);
  });
  await AuditTrailService.recordActivitySafely({
    action: AUDIT_TRAIL_ACTION.CREATE_USER,
    metadata: {
      targetUsername: user.username,
    },
    reference: user.username,
    resourceId: user.id,
    resourceType: AUDIT_RESOURCE_TYPE.USER,
  });

  return cloneValue(user);
};

const updateUser = async (userId, payload = {}) => {
  await initialize();
  const currentUser = await UserRepository.getById(userId);
  if (!currentUser) {
    throw new UserValidationError("User was not found.", [
      { field: "id", message: "User was not found." },
    ]);
  }

  const input = parseSchema(updateUserSchema, payload);
  await assertUniqueUserFields(input, userId);
  await assertAssignableDepartment(input.department, currentUser.department);

  const now = new Date().toISOString();
  const updatedUser = normalizeUserRecord({
    ...currentUser,
    department: input.department,
    email: input.email,
    fullName: input.name,
    isActive: input.status === USER_STATUSES.ACTIVE,
    name: input.name,
    status: input.status,
    updatedAt: now,
    username: input.username,
  });
  const credential = await UserCredentialRepository.getByUserId(userId);

  await UserPersistenceRepository.runMutation((stores) => {
    stores.users.put(updatedUser);
    if (credential) {
      stores.userCredentials.put({
        ...credential,
        isActive: updatedUser.isActive,
        updatedAt: now,
      });
    }
  });
  await AuditTrailService.recordActivitySafely({
    action: AUDIT_TRAIL_ACTION.UPDATE_USER,
    metadata: {
      targetUsername: updatedUser.username,
    },
    reference: updatedUser.username,
    resourceId: updatedUser.id,
    resourceType: AUDIT_RESOURCE_TYPE.USER,
  });

  return cloneValue(updatedUser);
};

const updateUserPassword = async (userId, payload = {}) => {
  await initialize();
  const input = parseSchema(changeUserPasswordSchema, payload);
  const user = await UserRepository.getById(userId);
  const credential = await UserCredentialRepository.getByUserId(userId);

  if (!user || !credential) {
    throw new UserValidationError("User credential was not found.", [
      { field: "id", message: "User credential was not found." },
    ]);
  }

  const updatedCredential = {
    ...credential,
    password: input.newPassword,
    updatedAt: new Date().toISOString(),
  };

  await UserCredentialRepository.update(updatedCredential);
  return cloneValue(updatedCredential);
};

const setUserStatus = async (userId, status) => {
  await initialize();
  const user = await UserRepository.getById(userId);
  if (!user) {
    throw new UserValidationError("User was not found.", [
      { field: "id", message: "User was not found." },
    ]);
  }

  const normalizedStatus = status === USER_STATUSES.INACTIVE
    ? USER_STATUSES.INACTIVE
    : USER_STATUSES.ACTIVE;
  const now = new Date().toISOString();
  const updatedUser = normalizeUserRecord({
    ...user,
    isActive: normalizedStatus === USER_STATUSES.ACTIVE,
    status: normalizedStatus,
    updatedAt: now,
  });
  const credential = await UserCredentialRepository.getByUserId(userId);

  await UserPersistenceRepository.runMutation((stores) => {
    stores.users.put(updatedUser);
    if (credential) {
      stores.userCredentials.put({
        ...credential,
        isActive: updatedUser.isActive,
        updatedAt: now,
      });
    }
  });
  await AuditTrailService.recordActivitySafely({
    action: normalizedStatus === USER_STATUSES.ACTIVE
      ? AUDIT_TRAIL_ACTION.ACTIVATE_USER
      : AUDIT_TRAIL_ACTION.DEACTIVATE_USER,
    metadata: {
      targetUsername: updatedUser.username,
    },
    reference: updatedUser.username,
    resourceId: updatedUser.id,
    resourceType: AUDIT_RESOURCE_TYPE.USER,
  });

  return cloneValue(updatedUser);
};

const renameDepartmentReferences = async (previousDepartmentName, nextDepartmentName) => {
  await initialize();
  const previousDepartmentKey = normalizeKey(previousDepartmentName);
  const nextDepartment = normalizeText(nextDepartmentName);

  if (!previousDepartmentKey || !nextDepartment) return [];

  const users = await UserRepository.getAll();
  const now = new Date().toISOString();
  const updatedUsers = users
    .filter((user) => normalizeKey(user.department) === previousDepartmentKey)
    .map((user) => normalizeUserRecord({
      ...user,
      department: nextDepartment,
      updatedAt: now,
    }));

  if (updatedUsers.length === 0) return [];

  await UserPersistenceRepository.runMutation((stores) => {
    updatedUsers.forEach((user) => {
      stores.users.put(user);
    });
  });

  return cloneValue(updatedUsers);
};

const activateUser = (userId) => setUserStatus(userId, USER_STATUSES.ACTIVE);

const deactivateUser = (userId) => setUserStatus(userId, USER_STATUSES.INACTIVE);

const deleteUser = async () => {
  throw new UserValidationError(
    "Delete User is not supported by PRD PART 9. Use Inactive status to preserve user history.",
    [
      {
        field: "status",
        message: "User accounts must use Active / Inactive lifecycle and must not be deleted.",
      },
    ],
  );
};

const searchUsers = (users, search = "") => {
  const keyword = normalizeKey(search);
  if (!keyword) return cloneValue(users);

  const searchableFields = [
    "name",
    "fullName",
    "username",
    "email",
    "department",
    "status",
  ];

  return cloneValue(users.filter((user) =>
    searchableFields.some((fieldName) =>
      normalizeKey(user[fieldName]).includes(keyword),
    ),
  ));
};

const filterUsers = (users, filters = {}) => cloneValue(users.filter((user) => {
  const departmentFilter = filters.department;
  const statusFilter = filters.status;

  return (
    (!departmentFilter || user.department === departmentFilter) &&
    (!statusFilter || user.status === statusFilter)
  );
}));

const getTimestamp = (value) => {
  const timestamp = new Date(value ?? "").getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const getFallbackSortValue = (user) =>
  normalizeKey(user.id ?? user.userCode ?? user.username ?? user.name);

const compareTimestampValues = (firstUser, secondUser, sortBy, multiplier) => {
  const firstTimestamp = getTimestamp(firstUser[sortBy]);
  const secondTimestamp = getTimestamp(secondUser[sortBy]);

  if (firstTimestamp !== null && secondTimestamp === null) return -1;
  if (firstTimestamp === null && secondTimestamp !== null) return 1;
  if (firstTimestamp !== null && secondTimestamp !== null) {
    if (firstTimestamp === secondTimestamp) return 0;
    return firstTimestamp > secondTimestamp ? multiplier : -multiplier;
  }

  const firstFallback = getFallbackSortValue(firstUser);
  const secondFallback = getFallbackSortValue(secondUser);
  if (firstFallback === secondFallback) return 0;
  return firstFallback > secondFallback ? -1 : 1;
};

const getSortableValue = (user, sortBy) => normalizeKey(user[sortBy]);

const sortUsers = (users, { direction = "desc", sortBy = "createdAt" } = {}) => {
  const multiplier = direction === "desc" ? -1 : 1;
  return cloneValue([...users].sort((firstUser, secondUser) => {
    if (sortBy === "createdAt" || sortBy === "updatedAt") {
      return compareTimestampValues(firstUser, secondUser, sortBy, multiplier);
    }

    const firstValue = getSortableValue(firstUser, sortBy);
    const secondValue = getSortableValue(secondUser, sortBy);
    if (firstValue === secondValue) return 0;
    return firstValue > secondValue ? multiplier : -multiplier;
  }));
};

const paginateUsers = (users, { page = 1, pageSize = 10 } = {}) => {
  const normalizedPageSize = Math.max(1, Number(pageSize) || 10);
  const totalItems = users.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedPageSize));
  const normalizedPage = Math.min(
    Math.max(1, Number(page) || 1),
    totalPages,
  );
  const startIndex = (normalizedPage - 1) * normalizedPageSize;

  return {
    data: cloneValue(users.slice(startIndex, startIndex + normalizedPageSize)),
    pagination: {
      page: normalizedPage,
      pageSize: normalizedPageSize,
      totalItems,
      totalPages,
    },
  };
};

function queryUsers(users, query = {}) {
  const filteredUsers = filterUsers(searchUsers(users, query.search), {
    department: query.department,
    status: query.status,
  });
  const sortedUsers = sortUsers(filteredUsers, {
    direction: query.direction ?? query.order,
    sortBy: query.sortBy ?? query.sort,
  });

  return paginateUsers(sortedUsers, {
    page: query.page,
    pageSize: query.pageSize,
  });
}

const getCredentialByUserId = async (userId) => {
  await initialize();
  return cloneValue(await UserCredentialRepository.getByUserId(userId));
};

export const UserService = {
  activateUser,
  checkEmailUniqueness,
  checkUsernameUniqueness,
  createUser,
  deactivateUser,
  deleteUser,
  filterUsers,
  getCredentialByUserId,
  getActiveDepartments: async () => cloneValue(await DepartmentService.getActiveDepartments()),
  getDepartmentFilterOptions: async () => cloneValue(await DepartmentService.getAllDepartments()),
  getDepartments: () => cloneValue(USER_DEPARTMENT_OPTIONS),
  getStatuses: () => cloneValue(USER_STATUS_OPTIONS),
  getUserByUsername,
  getUserDetail,
  getUserList,
  getUsers,
  initialize,
  paginateUsers,
  queryUsers,
  renameDepartmentReferences,
  searchUsers,
  sortUsers,
  updateUser,
  updateUserPassword,
};

export default UserService;
