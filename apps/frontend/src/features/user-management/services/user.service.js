import { apiClient } from "@/shared/api";

import {
  USER_DEPARTMENT_OPTIONS,
  USER_STATUSES,
  USER_STATUS_OPTIONS,
} from "../constants/user.constants";
import { DepartmentService } from "./department.service";

export class UserValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = "UserValidationError";
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

const getErrorMessage = (error, fallback = "Gagal memuat User.") =>
  error?.response?.data?.message ?? error?.message ?? fallback;

const getErrorList = (error) => error?.response?.data?.errors ?? error?.errors ?? [];

const throwServiceError = (error, fallback) => {
  throw new UserValidationError(getErrorMessage(error, fallback), getErrorList(error));
};

export const normalizeUserRecord = (user = {}) => ({
  ...user,
  department: user.department ?? user.departmentNameSnapshot ?? "",
  departmentId: user.departmentId ?? null,
  departmentNameSnapshot: user.departmentNameSnapshot ?? user.department ?? "",
  fullName: user.fullName ?? user.name ?? "",
  isActive: user.status ? user.status === USER_STATUSES.ACTIVE : Boolean(user.isActive),
  name: user.fullName ?? user.name ?? "",
  status: user.status ?? (user.isActive ? USER_STATUSES.ACTIVE : USER_STATUSES.INACTIVE),
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

const requestCollection = async (params = {}) => {
  try {
    return unwrapCollection(await apiClient.get("/v1/users", { params }));
  } catch (error) {
    throwServiceError(error, "Gagal memuat User.");
  }
};

const getUsers = async () => {
  const { data } = await requestCollection({ page: 1, pageSize: 1000, sortBy: "createdAt", direction: "desc" });
  return cloneValue(data.map(normalizeUserRecord));
};

const getUserList = async (query = {}) => {
  const { data, pagination } = await requestCollection({
    ...query,
    pageSize: query.pageSize ?? query.limit ?? 10,
  });
  return {
    data: cloneValue(data.map(normalizeUserRecord)),
    pagination,
  };
};

const getUserDetail = async (userId) => {
  try {
    const response = await apiClient.get(`/v1/users/${userId}`);
    return normalizeUserRecord(response.data?.data);
  } catch (error) {
    throwServiceError(error, "User tidak ditemukan.");
  }
};

const getUserByUsername = async (username) =>
  (await getUsers()).find((user) => normalizeKey(user.username) === normalizeKey(username)) ?? null;

const checkUsernameUniqueness = async (username, currentUserId = null) =>
  !(await getUsers()).some(
    (user) => String(user.id) !== String(currentUserId) && normalizeKey(user.username) === normalizeKey(username),
  );

const checkEmailUniqueness = async (email, currentUserId = null) =>
  !(await getUsers()).some(
    (user) => String(user.id) !== String(currentUserId) && normalizeText(user.email).toLowerCase() === normalizeText(email).toLowerCase(),
  );

const resolveDepartmentPayload = async (payload = {}) => {
  if (payload.departmentId) {
    return {
      department: payload.department,
      departmentId: payload.departmentId,
    };
  }

  const department = await DepartmentService.getDepartmentByName(payload.department);
  return {
    department: payload.department,
    departmentId: department?.id ?? null,
  };
};

const createUser = async (payload = {}) => {
  try {
    const department = await resolveDepartmentPayload(payload);
    const response = await apiClient.post("/v1/users", {
      ...department,
      email: payload.email,
      initialPassword: payload.initialPassword,
      name: payload.name ?? payload.fullName,
      position: payload.position ?? null,
      username: payload.username,
    });
    return normalizeUserRecord(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Gagal membuat User.");
  }
};

const updateUser = async (userId, payload = {}) => {
  try {
    const department = await resolveDepartmentPayload(payload);
    const response = await apiClient.put(`/v1/users/${userId}`, {
      ...department,
      email: payload.email,
      name: payload.name ?? payload.fullName,
      position: payload.position ?? null,
      status: payload.status,
    });
    return normalizeUserRecord(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Gagal mengubah User.");
  }
};

const activateUser = async (userId) => {
  try {
    const response = await apiClient.patch(`/v1/users/${userId}/activate`);
    return normalizeUserRecord(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Gagal mengaktifkan User.");
  }
};

const deactivateUser = async (userId) => {
  try {
    const response = await apiClient.patch(`/v1/users/${userId}/deactivate`);
    return normalizeUserRecord(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Gagal menonaktifkan User.");
  }
};

const updateUserPassword = async () => {
  throw new UserValidationError("Reset Password Admin belum tersedia.", [
    { field: "password", message: "Gunakan Change Password atau Reset Password." },
  ]);
};

const deleteUser = async () => {
  throw new UserValidationError("User tidak dapat dihapus.", [
    { field: "status", message: "Gunakan status Inactive." },
  ]);
};

const searchUsers = (users, search = "") => {
  const keyword = normalizeKey(search);
  if (!keyword) return cloneValue(users);
  const searchableFields = ["name", "fullName", "username", "email", "department", "status"];
  return cloneValue(users.filter((user) =>
    searchableFields.some((fieldName) => normalizeKey(user[fieldName]).includes(keyword)),
  ));
};

const filterUsers = (users, filters = {}) =>
  cloneValue(users.filter((user) =>
    (!filters.department || user.department === filters.department) &&
    (!filters.status || user.status === filters.status),
  ));

const getTimestamp = (value) => {
  const timestamp = new Date(value ?? "").getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const sortUsers = (users, { direction = "desc", sortBy = "createdAt" } = {}) => {
  const multiplier = direction === "desc" ? -1 : 1;
  return cloneValue([...users].sort((firstUser, secondUser) => {
    if (sortBy === "createdAt" || sortBy === "updatedAt") {
      const firstTimestamp = getTimestamp(firstUser[sortBy]);
      const secondTimestamp = getTimestamp(secondUser[sortBy]);
      if (firstTimestamp !== null && secondTimestamp !== null && firstTimestamp !== secondTimestamp) {
        return firstTimestamp > secondTimestamp ? multiplier : -multiplier;
      }
    }
    const firstValue = normalizeKey(firstUser[sortBy] ?? firstUser.name);
    const secondValue = normalizeKey(secondUser[sortBy] ?? secondUser.name);
    if (firstValue === secondValue) return 0;
    return firstValue > secondValue ? multiplier : -multiplier;
  }));
};

const paginateUsers = (users, { page = 1, pageSize = 10 } = {}) => {
  const normalizedPageSize = Math.max(1, Number(pageSize) || 10);
  const totalItems = users.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedPageSize));
  const normalizedPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const startIndex = (normalizedPage - 1) * normalizedPageSize;
  return {
    data: cloneValue(users.slice(startIndex, startIndex + normalizedPageSize)),
    pagination: { page: normalizedPage, pageSize: normalizedPageSize, totalItems, totalPages },
  };
};

const queryUsers = (users, query = {}) =>
  paginateUsers(
    sortUsers(filterUsers(searchUsers(users, query.search), {
      department: query.department,
      status: query.status,
    }), {
      direction: query.direction ?? query.order,
      sortBy: query.sortBy ?? query.sort,
    }),
    { page: query.page, pageSize: query.pageSize },
  );

const renameDepartmentReferences = async () => [];
const getCredentialByUserId = async () => null;
const initialize = async () => true;

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
