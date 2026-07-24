export const OFFICIAL_ROLES = [
  { id: 1, roleCode: "ROLE-ADMIN", roleName: "Admin" },
  { id: 2, roleCode: "ROLE-DOCUMENT-OWNER", roleName: "Document Owner" },
  { id: 3, roleCode: "ROLE-TEAM-PROCESS", roleName: "Team Process" },
  { id: 4, roleCode: "ROLE-TEAM-PROJECT", roleName: "Team Project" },
];

export const ROLE_ID_BY_NAME = Object.fromEntries(
  OFFICIAL_ROLES.map((role) => [role.roleName, role.id]),
);

export const ROLE_NAME_BY_ID = Object.fromEntries(
  OFFICIAL_ROLES.map((role) => [role.id, role.roleName]),
);

export const USER_STATUSES = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export const USER_STATUS_OPTIONS = [
  USER_STATUSES.ACTIVE,
  USER_STATUSES.INACTIVE,
];

export const USER_DEPARTMENT_OPTIONS = [
  "DIV 2",
];

export const DEFAULT_USER_STATUS = USER_STATUSES.ACTIVE;
