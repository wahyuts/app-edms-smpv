const bcrypt = require('bcrypt');
const env = require('../config/env');
const {
  ADMIN_ROLE_CODE,
  ADMINISTRATION_MESSAGES,
  ENTITY_STATUS,
} = require('../constants/administration.constants');
const departmentRepository = require('../repositories/department.repository');
const userRepository = require('../repositories/user.repository');
const {
  buildPagination,
  createHttpError,
  mapDuplicateError,
  normalizeKey,
  parseListQuery,
  toIntegerOrNull,
} = require('../utils/administration');

const parseUserListQuery = (query) => ({
  ...parseListQuery(query, {
    allowedSortBy: ['createdAt', 'email', 'name', 'status', 'updatedAt', 'username'],
    defaultSortBy: 'createdAt',
  }),
  departmentId: toIntegerOrNull(query?.departmentId),
  status: Object.values(ENTITY_STATUS).includes(query?.status) ? query.status : null,
});

const assertUserExists = async (userId) => {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw createHttpError(ADMINISTRATION_MESSAGES.NOT_FOUND, 404);
  }
  return user;
};

const assertUniqueUserFields = async ({ currentUserId = null, email, username }) => {
  const [existingUsername, existingEmail] = await Promise.all([
    userRepository.findUserByUsername(username),
    userRepository.findUserByEmail(email),
  ]);
  const errors = [];

  if (existingUsername && String(existingUsername.id) !== String(currentUserId)) {
    errors.push({ field: 'username', message: 'Username Sudah Digunakan' });
  }
  if (existingEmail && String(existingEmail.id) !== String(currentUserId)) {
    errors.push({ field: 'email', message: 'Email Sudah Digunakan' });
  }
  if (errors.length > 0) {
    throw createHttpError('User Sudah Digunakan', 409, errors);
  }
};

const resolveDepartment = async ({ departmentId, departmentName }) => {
  const department = departmentId
    ? await departmentRepository.findDepartmentById(departmentId)
    : await departmentRepository.findDepartmentByNameKey(normalizeKey(departmentName));

  if (!department) {
    throw createHttpError('Department Tidak Ditemukan', 422, [
      { field: 'department', message: 'Department Tidak Ditemukan' },
    ]);
  }
  if (department.status !== ENTITY_STATUS.ACTIVE) {
    throw createHttpError('Department Tidak Aktif', 422, [
      { field: 'department', message: 'Department Tidak Aktif' },
    ]);
  }

  return department;
};

const resolveActiveRole = async (roleId) => {
  const role = await userRepository.findRoleById(roleId);
  if (!role || !role.isActive) {
    throw createHttpError('Role Tidak Valid', 422, [
      { field: 'roleId', message: 'Role Tidak Valid' },
    ]);
  }
  return role;
};

const resolveDefaultCreateUserRbacRole = async () => {
  const role = await userRepository.findLeastPrivilegedActiveRole({
    excludedRoleCode: ADMIN_ROLE_CODE,
  });

  if (!role) {
    throw createHttpError('Default RBAC Role Tidak Tersedia', 500, [
      { field: 'roleId', message: 'Default RBAC Role Tidak Tersedia' },
    ]);
  }

  return role;
};

const listUsers = async (query) => {
  const listQuery = parseUserListQuery(query);
  const result = await userRepository.listUsers(listQuery);

  return {
    data: result.rows,
    pagination: buildPagination({
      page: listQuery.page,
      pageSize: listQuery.pageSize,
      totalItems: result.totalItems,
    }),
  };
};

const getUserDetail = (userId) => assertUserExists(userId);

const createUser = async (payload) => {
  const [department, defaultRole] = await Promise.all([
    resolveDepartment(payload),
    resolveDefaultCreateUserRbacRole(),
    assertUniqueUserFields(payload),
  ]);
  const passwordHash = await bcrypt.hash(payload.initialPassword, env.bcryptRounds);

  try {
    return await userRepository.createUserWithCredential({
      passwordHash,
      user: {
        departmentId: department.id,
        departmentNameSnapshot: department.name,
        email: payload.email,
        fullName: payload.fullName,
        position: payload.position,
        roleId: defaultRole.id,
        username: payload.username,
      },
    });
  } catch (error) {
    const duplicateError = mapDuplicateError(error, 'User Sudah Digunakan', 'username');
    throw duplicateError || error;
  }
};

const updateUser = async ({ actorUserId, payload, userId }) => {
  await assertUserExists(userId);
  if (String(actorUserId) === String(userId) && payload.status === ENTITY_STATUS.INACTIVE) {
    throw createHttpError('User Sendiri Tidak Dapat Dinonaktifkan', 403);
  }
  const [department] = await Promise.all([
    resolveDepartment(payload),
    assertUniqueUserFields({ ...payload, currentUserId: userId }),
  ]);

  try {
    return await userRepository.updateUser({
      userId,
      user: {
        departmentId: department.id,
        departmentNameSnapshot: department.name,
        email: payload.email,
        fullName: payload.fullName,
        position: payload.position,
        status: payload.status,
        username: payload.username,
      },
    });
  } catch (error) {
    const duplicateError = mapDuplicateError(error, 'User Sudah Digunakan', 'username');
    throw duplicateError || error;
  }
};

const setUserStatus = async ({ actorUserId, status, userId }) => {
  const user = await assertUserExists(userId);
  if (String(actorUserId) === String(userId) && status === ENTITY_STATUS.INACTIVE) {
    throw createHttpError('User Sendiri Tidak Dapat Dinonaktifkan', 403);
  }
  if (user.status === status) {
    return user;
  }
  return userRepository.updateUserStatus({ status, userId });
};

module.exports = {
  activateUser: ({ actorUserId, userId }) =>
    setUserStatus({ actorUserId, status: ENTITY_STATUS.ACTIVE, userId }),
  createUser,
  deactivateUser: ({ actorUserId, userId }) =>
    setUserStatus({ actorUserId, status: ENTITY_STATUS.INACTIVE, userId }),
  getUserDetail,
  listUsers,
  updateUser,
};
