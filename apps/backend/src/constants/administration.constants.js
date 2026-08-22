const ADMINISTRATION_PERMISSION = 'user-management.view';
const ADMIN_ROLE_CODE = 'ROLE-ADMIN';

const ENTITY_STATUS = Object.freeze({
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
});

const PROJECT_STATUS = Object.freeze({
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  CLOSED: 'Closed',
});

const OFFICIAL_ROLES = Object.freeze([
  'Admin',
  'Document Owner',
  'Team Process',
  'Team Project',
]);

const ADMINISTRATION_MESSAGES = Object.freeze({
  VALIDATION_ERROR: 'Data Tidak Valid',
  NOT_FOUND: 'Data Tidak Ditemukan',
  FORBIDDEN: 'Akses Ditolak',
  DEPARTMENT_CREATED: 'Department Berhasil Dibuat',
  DEPARTMENT_UPDATED: 'Department Berhasil Diubah',
  DEPARTMENT_ACTIVATED: 'Department Berhasil Diaktifkan',
  DEPARTMENT_DEACTIVATED: 'Department Berhasil Dinonaktifkan',
  USER_CREATED: 'User Berhasil Dibuat',
  USER_UPDATED: 'User Berhasil Diperbarui',
  USER_ACTIVATED: 'User Berhasil Diaktifkan',
  USER_DEACTIVATED: 'User Berhasil Dinonaktifkan',
  PROJECT_CREATED: 'Project Berhasil Dibuat',
  PROJECT_UPDATED: 'Project Berhasil Diubah',
  PROJECT_ACTIVATED: 'Project Berhasil Diaktifkan',
  PROJECT_DEACTIVATED: 'Project Berhasil Dinonaktifkan',
  PROJECT_CLOSED: 'Project Berhasil Ditutup',
  MEMBERSHIP_CREATED: 'Membership Berhasil Dibuat',
  MEMBERSHIP_UPDATED: 'Membership Berhasil Diubah',
  MEMBERSHIP_ACTIVATED: 'Membership Berhasil Diaktifkan',
  MEMBERSHIP_DEACTIVATED: 'Membership Berhasil Dinonaktifkan',
  PROJECT_CONTEXT_RETRIEVED: 'Konteks Project Berhasil Dimuat',
  ACTIVE_PROJECT_SELECTED: 'Project Aktif Berhasil Dipilih',
});

module.exports = {
  ADMIN_ROLE_CODE,
  ADMINISTRATION_MESSAGES,
  ADMINISTRATION_PERMISSION,
  ENTITY_STATUS,
  OFFICIAL_ROLES,
  PROJECT_STATUS,
};
