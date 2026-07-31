const { isPasswordPolicyValid, getPasswordPolicyMessage } = require('./password.validator');
const {
  ENTITY_STATUS,
  OFFICIAL_ROLES,
  PROJECT_STATUS,
} = require('../constants/administration.constants');
const {
  normalizeText,
  toIntegerOrNull,
} = require('../utils/administration');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const projectCodePattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

const addRequiredText = (errors, body, field, label) => {
  const value = normalizeText(body?.[field]);
  if (!value) {
    errors.push({ field, message: `${label} Wajib Diisi` });
  }
  return value;
};

const addOptionalText = (body, field) => normalizeText(body?.[field]);

const validateEnum = (errors, field, value, allowedValues, message) => {
  if (!allowedValues.includes(value)) {
    errors.push({ field, message });
  }
};

const normalizeBodyAlias = (body = {}) => ({
  ...body,
  department: body.department ?? body.departmentName,
  name: body.name ?? body.fullName ?? body.departmentName,
});

const validateDepartmentCreate = (body) => {
  const normalizedBody = normalizeBodyAlias(body);
  const errors = [];
  const name = addRequiredText(errors, normalizedBody, 'name', 'Department');

  return { isValid: errors.length === 0, errors, value: { name } };
};

const validateDepartmentUpdate = validateDepartmentCreate;

const validateUserCreate = (body) => {
  const normalizedBody = normalizeBodyAlias(body);
  const errors = [];
  const username = addRequiredText(errors, normalizedBody, 'username', 'Username');
  const fullName = addRequiredText(errors, normalizedBody, 'name', 'Nama');
  const email = addRequiredText(errors, normalizedBody, 'email', 'Email');
  const initialPassword = normalizeText(normalizedBody?.initialPassword ?? normalizedBody?.password);
  const departmentId = toIntegerOrNull(normalizedBody?.departmentId);
  const departmentName = normalizeText(normalizedBody?.department);
  const position = addOptionalText(normalizedBody, 'position') || null;

  if (email && !emailPattern.test(email)) {
    errors.push({ field: 'email', message: 'Email Tidak Valid' });
  }
  if (!departmentId && !departmentName) {
    errors.push({ field: 'department', message: 'Department Wajib Diisi' });
  }
  if (!initialPassword) {
    errors.push({ field: 'initialPassword', message: 'Password Wajib Diisi' });
  } else if (!isPasswordPolicyValid(initialPassword)) {
    errors.push({ field: 'initialPassword', message: getPasswordPolicyMessage(initialPassword) });
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      departmentId,
      departmentName,
      email,
      fullName,
      initialPassword,
      position,
      username,
    },
  };
};

const validateUserUpdate = (body) => {
  const normalizedBody = normalizeBodyAlias(body);
  const errors = [];
  const username = Object.prototype.hasOwnProperty.call(normalizedBody, 'username')
    ? normalizeText(normalizedBody?.username)
    : null;
  const fullName = addRequiredText(errors, normalizedBody, 'name', 'Nama');
  const email = addRequiredText(errors, normalizedBody, 'email', 'Email');
  const departmentId = toIntegerOrNull(normalizedBody?.departmentId);
  const departmentName = normalizeText(normalizedBody?.department);
  const position = addOptionalText(normalizedBody, 'position') || null;
  const status = normalizeText(normalizedBody?.status);

  if (email && !emailPattern.test(email)) {
    errors.push({ field: 'email', message: 'Email Tidak Valid' });
  }
  if (!departmentId && !departmentName) {
    errors.push({ field: 'department', message: 'Department Wajib Diisi' });
  }
  validateEnum(
    errors,
    'status',
    status,
    Object.values(ENTITY_STATUS),
    'Status harus Active atau Inactive'
  );

  return {
    isValid: errors.length === 0,
    errors,
    value: { departmentId, departmentName, email, fullName, position, status, username },
  };
};

const validateProjectCreate = (body) => {
  const errors = [];
  const projectCode = addRequiredText(errors, body, 'projectCode', 'Kode Project');
  const projectName = addRequiredText(errors, body, 'projectName', 'Nama Project');
  const description = addOptionalText(body, 'description');
  const status = normalizeText(body?.status) || PROJECT_STATUS.ACTIVE;

  if (projectCode && !projectCodePattern.test(projectCode)) {
    errors.push({
      field: 'projectCode',
      message: 'Kode Project Tidak Valid',
    });
  }
  validateEnum(errors, 'status', status, Object.values(PROJECT_STATUS), 'Status Project Tidak Valid');
  if (status === PROJECT_STATUS.CLOSED) {
    errors.push({ field: 'status', message: 'Gunakan Close Project untuk menutup Project' });
  }

  return { isValid: errors.length === 0, errors, value: { description, projectCode, projectName, status } };
};

const validateProjectUpdate = (body) => validateProjectCreate(body);

const validateProjectClose = (body) => ({
  isValid: !body || body.confirmationAccepted === true,
  errors: body?.confirmationAccepted === true
    ? []
    : [{ field: 'confirmationAccepted', message: 'Konfirmasi Wajib Disetujui' }],
  value: {
    confirmationAccepted: body?.confirmationAccepted === true,
    projectCodeConfirmation: normalizeText(body?.projectCodeConfirmation),
    projectStatusSnapshot: normalizeText(body?.projectStatusSnapshot) || null,
  },
});

const validateMembershipCreate = (body) => {
  const errors = [];
  const projectId = addRequiredText(errors, body, 'projectId', 'Project');
  const userId = toIntegerOrNull(body?.userId);
  const officialRole = normalizeText(body?.officialRole);
  const status = normalizeText(body?.status) || ENTITY_STATUS.ACTIVE;

  if (!userId) {
    errors.push({ field: 'userId', message: 'User Wajib Diisi' });
  }
  validateEnum(errors, 'officialRole', officialRole, OFFICIAL_ROLES, 'Official Role Tidak Valid');
  validateEnum(errors, 'status', status, Object.values(ENTITY_STATUS), 'Status Membership Tidak Valid');

  return { isValid: errors.length === 0, errors, value: { officialRole, projectId, status, userId } };
};

const validateMembershipUpdate = (body) => {
  const errors = [];
  const officialRole = normalizeText(body?.officialRole);
  const status = normalizeText(body?.status);

  validateEnum(errors, 'officialRole', officialRole, OFFICIAL_ROLES, 'Official Role Tidak Valid');
  validateEnum(errors, 'status', status, Object.values(ENTITY_STATUS), 'Status Membership Tidak Valid');

  return { isValid: errors.length === 0, errors, value: { officialRole, status } };
};

const validateSelectActiveProject = (body) => {
  const projectId = normalizeText(body?.projectId);
  const errors = projectId ? [] : [{ field: 'projectId', message: 'Project Wajib Diisi' }];
  return { isValid: errors.length === 0, errors, value: { projectId } };
};

module.exports = {
  validateDepartmentCreate,
  validateDepartmentUpdate,
  validateMembershipCreate,
  validateMembershipUpdate,
  validateProjectClose,
  validateProjectCreate,
  validateProjectUpdate,
  validateSelectActiveProject,
  validateUserCreate,
  validateUserUpdate,
};
