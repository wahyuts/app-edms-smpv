const assert = require('node:assert/strict');
const test = require('node:test');

const { OFFICIAL_ROLES } = require('../../src/constants/administration.constants');
const { ROLES } = require('../../src/constants/role.constants');
const authorizationRepository = require('../../src/repositories/authorization.repository');
const authorizationService = require('../../src/services/authorization.service');
const notificationService = require('../../src/services/notification.service');
const notificationRepository = require('../../src/repositories/notification.repository');
const projectMembershipRepository = require('../../src/repositories/projectMembership.repository');
const {
  validateMembershipCreate,
  validateMembershipUpdate,
} = require('../../src/validators/administration.validator');

const viewerPermissionCodes = [
  'dashboard.view',
  'document-register.view',
  'document-register.download',
  'sla-monitoring.view',
  'escalation.view',
  'audit-trail.view',
  'notifications.view',
  'profile.view',
  'password.change',
];

const mutationPermissionCodes = [
  'document-register.create',
  'document-register.edit',
  'document-register.archive',
  'document-register.upload',
  'approval.a',
  'approval.b',
  'approval.c',
  'storage.view',
  'user-management.view',
];

const createPermission = (code, id = code) => ({
  code,
  id,
  name: code,
});

test('Viewer is registered as a fixed official role', () => {
  assert.equal(ROLES.VIEWER, 'Viewer');
  assert.ok(OFFICIAL_ROLES.includes('Viewer'));
});

test('project membership validators accept Viewer official role', () => {
  const createValidation = validateMembershipCreate({
    officialRole: 'Viewer',
    projectId: 'PRJ-001',
    status: 'Active',
    userId: 5,
  });
  const updateValidation = validateMembershipUpdate({
    officialRole: 'Viewer',
    status: 'Active',
  });

  assert.equal(createValidation.isValid, true);
  assert.equal(createValidation.value.officialRole, 'Viewer');
  assert.equal(updateValidation.isValid, true);
  assert.equal(updateValidation.value.officialRole, 'Viewer');
});

test('project Viewer authorization merges only allowed Viewer permissions', async (t) => {
  const originalFindPermissionsByRoleId = authorizationRepository.findPermissionsByRoleId;
  const originalFindRoleByName = authorizationRepository.findRoleByName;

  t.after(() => {
    authorizationRepository.findPermissionsByRoleId = originalFindPermissionsByRoleId;
    authorizationRepository.findRoleByName = originalFindRoleByName;
  });

  authorizationRepository.findRoleByName = async (roleName) => ({
    id: roleName === 'Viewer' ? 5 : 1,
    roleCode: roleName === 'Viewer' ? 'ROLE-VIEWER' : 'ROLE-ADMIN',
    roleName,
    isActive: true,
  });
  authorizationRepository.findPermissionsByRoleId = async (roleId) => {
    if (roleId === 5) return viewerPermissionCodes.map(createPermission);

    return [
      createPermission('profile.view'),
      createPermission('password.change'),
    ];
  };

  const authorizedUser = await authorizationService.buildProjectAuthorizationContext({
    id: 99,
    role: {
      id: 1,
      roleCode: 'ROLE-ADMIN',
      roleName: 'Admin',
      isActive: true,
    },
  }, ROLES.VIEWER);
  const permissionCodes = authorizedUser.permissions.map((permission) => permission.code);

  viewerPermissionCodes.forEach((permissionCode) => {
    assert.ok(permissionCodes.includes(permissionCode), `${permissionCode} should be allowed`);
  });
  mutationPermissionCodes.forEach((permissionCode) => {
    assert.ok(!permissionCodes.includes(permissionCode), `${permissionCode} should be denied`);
  });
});

test('active project official role changes effective project permissions', async (t) => {
  const originalFindPermissionsByRoleId = authorizationRepository.findPermissionsByRoleId;
  const originalFindRoleByName = authorizationRepository.findRoleByName;

  t.after(() => {
    authorizationRepository.findPermissionsByRoleId = originalFindPermissionsByRoleId;
    authorizationRepository.findRoleByName = originalFindRoleByName;
  });

  authorizationRepository.findRoleByName = async (roleName) => ({
    id: roleName === 'Viewer' ? 5 : 3,
    roleCode: roleName === 'Viewer' ? 'ROLE-VIEWER' : 'ROLE-TEAM-PROCESS',
    roleName,
    isActive: true,
  });
  authorizationRepository.findPermissionsByRoleId = async (roleId) => {
    if (roleId === 5) return viewerPermissionCodes.map(createPermission);
    if (roleId === 3) {
      return [
        'dashboard.view',
        'document-register.view',
        'document-register.download',
        'approval.a',
        'approval.b',
        'approval.c',
        'profile.view',
        'password.change',
      ].map(createPermission);
    }

    return [createPermission('profile.view'), createPermission('password.change')];
  };

  const baseUser = {
    id: 99,
    role: {
      id: 1,
      roleCode: 'ROLE-ADMIN',
      roleName: 'Admin',
      isActive: true,
    },
  };
  const viewerContext = await authorizationService.buildProjectAuthorizationContext(baseUser, ROLES.VIEWER);
  const teamProcessContext = await authorizationService.buildProjectAuthorizationContext(baseUser, ROLES.TEAM_PROCESS);
  const viewerPermissions = viewerContext.permissions.map((permission) => permission.code);
  const teamProcessPermissions = teamProcessContext.permissions.map((permission) => permission.code);

  assert.ok(!viewerPermissions.includes('approval.a'));
  assert.ok(!viewerPermissions.includes('approval.b'));
  assert.ok(!viewerPermissions.includes('approval.c'));
  assert.ok(teamProcessPermissions.includes('approval.a'));
  assert.ok(teamProcessPermissions.includes('approval.b'));
  assert.ok(teamProcessPermissions.includes('approval.c'));
});

test('SLA Warning and Overdue notifications do not target Viewer role', async (t) => {
  const originalListMemberships = projectMembershipRepository.listActiveMembershipsByProjectAndOfficialRoles;
  const originalListExisting = notificationRepository.listSlaNotificationsByBusinessKey;
  const originalCreateNotification = notificationRepository.createNotification;
  let requestedRoles = null;

  t.after(() => {
    projectMembershipRepository.listActiveMembershipsByProjectAndOfficialRoles = originalListMemberships;
    notificationRepository.listSlaNotificationsByBusinessKey = originalListExisting;
    notificationRepository.createNotification = originalCreateNotification;
  });

  projectMembershipRepository.listActiveMembershipsByProjectAndOfficialRoles = async ({ officialRoles }) => {
    requestedRoles = officialRoles;

    return [];
  };
  notificationRepository.listSlaNotificationsByBusinessKey = async () => [];
  notificationRepository.createNotification = async () => 0;

  await notificationService.createSlaStateNotifications({
    document: {
      id: 'DOC-001',
      projectId: 'PRJ-001',
      documentNumber: 'PFD-001',
      revision: 'IFR-Submitted',
      slaStartedAt: '2026-01-01T00:00:00.000Z',
      status: 'Process Review',
    },
    eventType: notificationService.NOTIFICATION_EVENT_TYPE.SLA_OVERDUE,
  });

  assert.deepEqual(requestedRoles, [
    'Admin',
    'Document Owner',
    'Team Process',
    'Team Project',
  ]);
  assert.ok(!requestedRoles.includes('Viewer'));
});
