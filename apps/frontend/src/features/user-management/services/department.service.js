import {
  DEFAULT_DEPARTMENT_STATUS,
  DEPARTMENT_STATUSES,
  DEPARTMENT_STATUS_OPTIONS,
} from "../constants/department.constants";
import {
  DepartmentPersistenceRepository,
  DepartmentRepository,
} from "../repositories/department.repository";
import {
  AUDIT_RESOURCE_TYPE,
  AUDIT_TRAIL_ACTION,
  AuditTrailService,
} from "@/features/audit-trail";
import {
  createDepartmentSchema,
  formatDepartmentValidationIssues,
  updateDepartmentSchema,
} from "../schemas/department.schema";

let initializationPromise = null;

const cloneValue = (value) => JSON.parse(JSON.stringify(value));
const normalizeText = (value) => String(value ?? "").trim();
const normalizeKey = (value) => normalizeText(value).toLowerCase();

export const normalizeDepartmentRecord = (department = {}) => {
  const name = normalizeText(department.name ?? department.departmentName);
  const status = DEPARTMENT_STATUS_OPTIONS.includes(department.status)
    ? department.status
    : DEFAULT_DEPARTMENT_STATUS;

  return {
    ...department,
    departmentName: name,
    name,
    nameKey: normalizeKey(name),
    status,
    updatedAt: department.updatedAt ?? null,
  };
};

export class DepartmentValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = "DepartmentValidationError";
    this.errors = errors;
  }
}

const initialize = async () => {
  if (!initializationPromise) {
    initializationPromise = import("./department-seed.service").then(
      ({ DepartmentSeedService }) => DepartmentSeedService.initialize(),
    ).catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
};

const parseSchema = (schema, payload) => {
  const normalizedPayload = {
    ...payload,
    name: payload.name ?? payload.departmentName,
  };
  const result = schema.safeParse(normalizedPayload);
  if (result.success) return result.data;

  throw new DepartmentValidationError(
    "Validation failed.",
    formatDepartmentValidationIssues(result.error.issues),
  );
};

const createEntityId = (departments) => {
  const numericIds = departments
    .map((department) => Number(department.id))
    .filter((id) => Number.isFinite(id));
  return numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
};

const assertDepartmentExists = async (departmentId) => {
  const department = await DepartmentRepository.getById(departmentId);

  if (!department) {
    throw new DepartmentValidationError("Department was not found.", [
      { field: "id", message: "Department was not found." },
    ]);
  }

  return normalizeDepartmentRecord(department);
};

const checkDepartmentNameUniqueness = async (
  departmentName,
  currentDepartmentId = null,
) => {
  await initialize();
  return DepartmentRepository.checkNameUniqueness(
    departmentName,
    currentDepartmentId,
  );
};

const assertUniqueDepartmentName = async (departmentName, currentDepartmentId = null) => {
  if (!(await checkDepartmentNameUniqueness(departmentName, currentDepartmentId))) {
    throw new DepartmentValidationError("Validation failed.", [
      {
        field: "name",
        message: "Department Name already exists.",
      },
    ]);
  }
};

const getAllDepartments = async () => {
  await initialize();
  const departments = await DepartmentRepository.getAll();
  return cloneValue(departments.map(normalizeDepartmentRecord));
};

const getActiveDepartments = async () => {
  const departments = await getAllDepartments();
  return cloneValue(
    departments.filter((department) => department.status === DEPARTMENT_STATUSES.ACTIVE),
  );
};

const getDepartmentDetail = async (departmentId) => {
  await initialize();
  const department = await DepartmentRepository.getById(departmentId);
  return department ? cloneValue(normalizeDepartmentRecord(department)) : null;
};

const createDepartment = async (payload = {}) => {
  await initialize();
  const input = parseSchema(createDepartmentSchema, payload);
  await assertUniqueDepartmentName(input.name);

  const departments = await DepartmentRepository.getAll();
  const now = new Date().toISOString();
  const department = normalizeDepartmentRecord({
    createdAt: now,
    id: createEntityId(departments),
    name: input.name,
    status: DEPARTMENT_STATUSES.ACTIVE,
    updatedAt: null,
  });

  await DepartmentRepository.create(department);
  await AuditTrailService.recordActivitySafely({
    action: AUDIT_TRAIL_ACTION.CREATE_DEPARTMENT,
    reference: department.name,
    resourceId: department.id,
    resourceType: AUDIT_RESOURCE_TYPE.DEPARTMENT,
  });
  return cloneValue(department);
};

const updateDepartment = async (departmentId, payload = {}) => {
  await initialize();
  const currentDepartment = await assertDepartmentExists(departmentId);
  const input = parseSchema(updateDepartmentSchema, payload);
  await assertUniqueDepartmentName(input.name, departmentId);

  const updatedDepartment = normalizeDepartmentRecord({
    ...currentDepartment,
    name: input.name,
    status: currentDepartment.status,
    updatedAt: new Date().toISOString(),
  });

  await DepartmentRepository.update(updatedDepartment);
  await AuditTrailService.recordActivitySafely({
    action: AUDIT_TRAIL_ACTION.UPDATE_DEPARTMENT,
    reference: updatedDepartment.name,
    resourceId: updatedDepartment.id,
    resourceType: AUDIT_RESOURCE_TYPE.DEPARTMENT,
  });
  return cloneValue(updatedDepartment);
};

const setDepartmentStatus = async (departmentId, status) => {
  await initialize();
  const currentDepartment = await assertDepartmentExists(departmentId);
  const updatedDepartment = normalizeDepartmentRecord({
    ...currentDepartment,
    status,
    updatedAt: new Date().toISOString(),
  });

  await DepartmentPersistenceRepository.runMutation((stores) => {
    stores.departments.put(updatedDepartment);
  });
  await AuditTrailService.recordActivitySafely({
    action: status === DEPARTMENT_STATUSES.ACTIVE
      ? AUDIT_TRAIL_ACTION.ACTIVATE_DEPARTMENT
      : AUDIT_TRAIL_ACTION.DEACTIVATE_DEPARTMENT,
    reference: updatedDepartment.name,
    resourceId: updatedDepartment.id,
    resourceType: AUDIT_RESOURCE_TYPE.DEPARTMENT,
  });

  return cloneValue(updatedDepartment);
};

const activateDepartment = (departmentId) =>
  setDepartmentStatus(departmentId, DEPARTMENT_STATUSES.ACTIVE);

const deactivateDepartment = (departmentId) =>
  setDepartmentStatus(departmentId, DEPARTMENT_STATUSES.INACTIVE);

const deleteDepartment = async () => {
  throw new DepartmentValidationError(
    "Delete Department is not supported by PRD PART 9.11. Use Inactive status to preserve user references.",
    [
      {
        field: "status",
        message: "Department Master Data must use Active / Inactive lifecycle and must not be deleted.",
      },
    ],
  );
};

const searchDepartments = (departments, search = "") => {
  const keyword = normalizeKey(search);
  if (!keyword) return cloneValue(departments);

  return cloneValue(departments.filter((department) =>
    normalizeKey(department.name).includes(keyword),
  ));
};

const filterDepartments = (departments, filters = {}) => {
  const statusFilter = filters.status;

  return cloneValue(departments.filter((department) =>
    !statusFilter || department.status === statusFilter,
  ));
};

const getSortableValue = (department, sortBy) => {
  if (sortBy === "createdAt" || sortBy === "updatedAt") {
    return new Date(department[sortBy] ?? 0).getTime();
  }

  return normalizeKey(department.name);
};

const sortDepartments = (
  departments,
  { direction = "asc", sortBy = "name" } = {},
) => {
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
  const normalizedPage = Math.min(
    Math.max(1, Number(page) || 1),
    totalPages,
  );
  const startIndex = (normalizedPage - 1) * normalizedPageSize;

  return {
    data: cloneValue(departments.slice(startIndex, startIndex + normalizedPageSize)),
    pagination: {
      page: normalizedPage,
      pageSize: normalizedPageSize,
      totalItems,
      totalPages,
    },
  };
};

const queryDepartments = (departments, query = {}) => {
  const filteredDepartments = filterDepartments(
    searchDepartments(departments, query.search),
    { status: query.status },
  );
  const sortedDepartments = sortDepartments(filteredDepartments, {
    direction: query.direction ?? query.order,
    sortBy: query.sortBy ?? query.sort,
  });

  return paginateDepartments(sortedDepartments, {
    page: query.page,
    pageSize: query.pageSize,
  });
};

const getDepartmentList = async (query = {}) =>
  queryDepartments(await getAllDepartments(), query);

const getDepartmentByName = async (departmentName) => {
  await initialize();
  const department = await DepartmentRepository.getByName(departmentName);
  return department ? cloneValue(normalizeDepartmentRecord(department)) : null;
};

const isActiveDepartmentName = async (departmentName) => {
  const department = await getDepartmentByName(departmentName);
  return department?.status === DEPARTMENT_STATUSES.ACTIVE;
};

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
