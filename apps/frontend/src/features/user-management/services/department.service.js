import { apiClient } from "@/shared/api";

import {
  DEFAULT_DEPARTMENT_STATUS,
  DEPARTMENT_STATUSES,
  DEPARTMENT_STATUS_OPTIONS,
} from "../constants/department.constants";

export class DepartmentValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = "DepartmentValidationError";
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

export const normalizeDepartmentRecord = (department = {}) => {
  const name = normalizeText(department.name ?? department.departmentName);
  const status = DEPARTMENT_STATUS_OPTIONS.includes(department.status)
    ? department.status
    : DEFAULT_DEPARTMENT_STATUS;

  return {
    ...department,
    departmentName: name,
    name,
    nameKey: department.nameKey ?? normalizeKey(name),
    status,
    updatedAt: department.updatedAt ?? null,
  };
};

const getErrorMessage = (error, fallback = "Gagal memuat Department.") =>
  error?.response?.data?.message ?? error?.message ?? fallback;

const getErrorList = (error) => error?.response?.data?.errors ?? error?.errors ?? [];

const throwServiceError = (error, fallback) => {
  throw new DepartmentValidationError(getErrorMessage(error, fallback), getErrorList(error));
};

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
    return unwrapCollection(await apiClient.get("/v1/departments", { params }));
  } catch (error) {
    throwServiceError(error, "Gagal memuat Department.");
  }
};

const getAllDepartments = async () => {
  const { data } = await requestCollection({ page: 1, pageSize: 1000, sortBy: "name", direction: "asc" });
  return cloneValue(data.map(normalizeDepartmentRecord));
};

const getActiveDepartments = async () =>
  cloneValue((await getAllDepartments()).filter((department) => department.status === DEPARTMENT_STATUSES.ACTIVE));

const getDepartmentList = async (query = {}) => {
  const { data, pagination } = await requestCollection({
    ...query,
    pageSize: query.pageSize ?? query.limit ?? 10,
  });
  return {
    data: cloneValue(data.map(normalizeDepartmentRecord)),
    pagination,
  };
};

const getDepartmentDetail = async (departmentId) => {
  try {
    const response = await apiClient.get(`/v1/departments/${departmentId}`);
    return normalizeDepartmentRecord(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Department tidak ditemukan.");
  }
};

const createDepartment = async (payload = {}) => {
  try {
    const response = await apiClient.post("/v1/departments", {
      name: payload.name ?? payload.departmentName,
    });
    return normalizeDepartmentRecord(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Gagal membuat Department.");
  }
};

const updateDepartment = async (departmentId, payload = {}) => {
  try {
    const response = await apiClient.put(`/v1/departments/${departmentId}`, {
      name: payload.name ?? payload.departmentName,
    });
    return normalizeDepartmentRecord(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Gagal mengubah Department.");
  }
};

const activateDepartment = async (departmentId) => {
  try {
    const response = await apiClient.patch(`/v1/departments/${departmentId}/activate`);
    return normalizeDepartmentRecord(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Gagal mengaktifkan Department.");
  }
};

const deactivateDepartment = async (departmentId) => {
  try {
    const response = await apiClient.patch(`/v1/departments/${departmentId}/deactivate`);
    return normalizeDepartmentRecord(response.data?.data);
  } catch (error) {
    throwServiceError(error, "Gagal menonaktifkan Department.");
  }
};

const deleteDepartment = async () => {
  throw new DepartmentValidationError("Department tidak dapat dihapus.", [
    { field: "status", message: "Gunakan status Inactive." },
  ]);
};

const searchDepartments = (departments, search = "") => {
  const keyword = normalizeKey(search);
  if (!keyword) return cloneValue(departments);
  return cloneValue(departments.filter((department) => normalizeKey(department.name).includes(keyword)));
};

const filterDepartments = (departments, filters = {}) =>
  cloneValue(departments.filter((department) => !filters.status || department.status === filters.status));

const getSortableValue = (department, sortBy) => {
  if (sortBy === "createdAt" || sortBy === "updatedAt") {
    return new Date(department[sortBy] ?? 0).getTime();
  }
  return normalizeKey(department[sortBy] ?? department.name);
};

const sortDepartments = (departments, { direction = "asc", sortBy = "name" } = {}) => {
  const multiplier = direction === "desc" ? -1 : 1;
  return cloneValue([...departments].sort((firstDepartment, secondDepartment) => {
    const firstValue = getSortableValue(firstDepartment, sortBy);
    const secondValue = getSortableValue(secondDepartment, sortBy);
    if (firstValue === secondValue) return 0;
    return firstValue > secondValue ? multiplier : -multiplier;
  }));
};

const paginateDepartments = (departments, { page = 1, pageSize = 10 } = {}) => {
  const normalizedPageSize = Math.max(1, Number(pageSize) || 10);
  const totalItems = departments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedPageSize));
  const normalizedPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const startIndex = (normalizedPage - 1) * normalizedPageSize;

  return {
    data: cloneValue(departments.slice(startIndex, startIndex + normalizedPageSize)),
    pagination: { page: normalizedPage, pageSize: normalizedPageSize, totalItems, totalPages },
  };
};

const queryDepartments = (departments, query = {}) =>
  paginateDepartments(
    sortDepartments(filterDepartments(searchDepartments(departments, query.search), { status: query.status }), {
      direction: query.direction ?? query.order,
      sortBy: query.sortBy ?? query.sort,
    }),
    { page: query.page, pageSize: query.pageSize },
  );

const getDepartmentByName = async (departmentName) => {
  const nameKey = normalizeKey(departmentName);
  return (await getAllDepartments()).find((department) => department.nameKey === nameKey) ?? null;
};

const isActiveDepartmentName = async (departmentName) =>
  (await getDepartmentByName(departmentName))?.status === DEPARTMENT_STATUSES.ACTIVE;

const checkDepartmentNameUniqueness = async (departmentName, currentDepartmentId = null) => {
  const nameKey = normalizeKey(departmentName);
  return !(await getAllDepartments()).some(
    (department) => String(department.id) !== String(currentDepartmentId) && department.nameKey === nameKey,
  );
};

const initialize = async () => true;

export const DepartmentService = {
  activateDepartment,
  checkDepartmentNameUniqueness,
  createDepartment,
  deactivateDepartment,
  deleteDepartment,
  filterDepartments,
  getActiveDepartments,
  getAllDepartments,
  getDepartmentByName,
  getDepartmentDetail,
  getDepartmentList,
  initialize,
  isActiveDepartmentName,
  paginateDepartments,
  queryDepartments,
  searchDepartments,
  sortDepartments,
  updateDepartment,
};

export default DepartmentService;
