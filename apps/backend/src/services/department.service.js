const {
  ADMINISTRATION_MESSAGES,
  ENTITY_STATUS,
} = require('../constants/administration.constants');
const departmentRepository = require('../repositories/department.repository');
const {
  buildPagination,
  createHttpError,
  mapDuplicateError,
  normalizeKey,
  parseListQuery,
} = require('../utils/administration');

const parseDepartmentListQuery = (query) => ({
  ...parseListQuery(query, {
    allowedSortBy: ['createdAt', 'name', 'status', 'updatedAt'],
    defaultSortBy: 'name',
  }),
  status: Object.values(ENTITY_STATUS).includes(query?.status) ? query.status : null,
});

const assertDepartmentExists = async (departmentId) => {
  const department = await departmentRepository.findDepartmentById(departmentId);
  if (!department) {
    throw createHttpError(ADMINISTRATION_MESSAGES.NOT_FOUND, 404);
  }
  return department;
};

const assertUniqueDepartmentName = async ({ currentDepartmentId = null, name }) => {
  const existingDepartment = await departmentRepository.findDepartmentByNameKey(normalizeKey(name));
  if (existingDepartment && String(existingDepartment.id) !== String(currentDepartmentId)) {
    throw createHttpError('Department Sudah Digunakan', 409, [
      { field: 'name', message: 'Department Sudah Digunakan' },
    ]);
  }
};

const listDepartments = async (query) => {
  const listQuery = parseDepartmentListQuery(query);
  const result = await departmentRepository.listDepartments(listQuery);

  return {
    data: result.rows,
    pagination: buildPagination({
      page: listQuery.page,
      pageSize: listQuery.pageSize,
      totalItems: result.totalItems,
    }),
  };
};

const getDepartmentDetail = (departmentId) => assertDepartmentExists(departmentId);

const createDepartment = async (payload) => {
  await assertUniqueDepartmentName({ name: payload.name });
  try {
    return await departmentRepository.createDepartment({
      name: payload.name,
      nameKey: normalizeKey(payload.name),
    });
  } catch (error) {
    const duplicateError = mapDuplicateError(error, 'Department Sudah Digunakan', 'name');
    throw duplicateError || error;
  }
};

const updateDepartment = async (departmentId, payload) => {
  await assertDepartmentExists(departmentId);
  await assertUniqueDepartmentName({ currentDepartmentId: departmentId, name: payload.name });
  try {
    return await departmentRepository.updateDepartment({
      departmentId,
      name: payload.name,
      nameKey: normalizeKey(payload.name),
    });
  } catch (error) {
    const duplicateError = mapDuplicateError(error, 'Department Sudah Digunakan', 'name');
    throw duplicateError || error;
  }
};

const setDepartmentStatus = async (departmentId, status) => {
  const department = await assertDepartmentExists(departmentId);
  if (department.status === status) {
    return department;
  }
  if (status === ENTITY_STATUS.INACTIVE) {
    const assignedUsers = await departmentRepository.countUsersByDepartmentId(departmentId);
    if (assignedUsers > 0) {
      throw createHttpError('Department Masih Digunakan', 409, [
        { field: 'department', message: 'Department Masih Digunakan' },
      ]);
    }
  }
  return departmentRepository.updateDepartmentStatus({ departmentId, status });
};

module.exports = {
  activateDepartment: (departmentId) => setDepartmentStatus(departmentId, ENTITY_STATUS.ACTIVE),
  createDepartment,
  deactivateDepartment: (departmentId) => setDepartmentStatus(departmentId, ENTITY_STATUS.INACTIVE),
  getDepartmentDetail,
  listDepartments,
  updateDepartment,
};
