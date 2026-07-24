USE edms_smpv_dev;

START TRANSACTION;

INSERT INTO departments (
  id,
  name,
  name_key,
  status,
  created_at,
  updated_at
) VALUES (
  1,
  'No Department',
  'no-department',
  'Active',
  '2026-01-01 00:00:00.000',
  NULL
);

INSERT INTO roles (
  id,
  role_code,
  role_name,
  is_active
) VALUES
  (1, 'ROLE-ADMIN', 'Admin', 1),
  (2, 'ROLE-DOCUMENT-OWNER', 'Document Owner', 1),
  (3, 'ROLE-TEAM-PROCESS', 'Team Process', 1),
  (4, 'ROLE-TEAM-PROJECT', 'Team Project', 1);

INSERT INTO permissions (
  id,
  permission_code,
  permission_name
) VALUES
  (1, 'dashboard.view', 'View Dashboard'),
  (2, 'document-register.view', 'View Document Register'),
  (3, 'document-register.create', 'Create Document Register'),
  (4, 'document-register.edit', 'Edit Document Register'),
  (5, 'document-register.archive', 'Archive Document Register'),
  (6, 'document-register.upload', 'Upload Document Register'),
  (7, 'document-register.download', 'Download Document Register'),
  (8, 'approval.a', 'Approval A'),
  (9, 'approval.b', 'Approval B'),
  (10, 'approval.c', 'Approval C'),
  (11, 'transmittal.incoming', 'Access Incoming Transmittal'),
  (12, 'transmittal.outgoing', 'Access Outgoing Transmittal'),
  (13, 'sla-monitoring.view', 'View SLA Monitoring'),
  (14, 'escalation.view', 'View Escalation'),
  (15, 'audit-trail.view', 'View Audit Trail'),
  (16, 'storage.view', 'View Storage Repository'),
  (17, 'notifications.view', 'View Notifications'),
  (18, 'profile.view', 'View Profile'),
  (19, 'password.change', 'Change Password'),
  (20, 'user-management.view', 'View User Management');

INSERT INTO role_permissions (
  role_id,
  permission_id
) VALUES
  (1, 1),
  (1, 2),
  (1, 3),
  (1, 4),
  (1, 5),
  (1, 6),
  (1, 7),
  (1, 8),
  (1, 9),
  (1, 10),
  (1, 11),
  (1, 12),
  (1, 13),
  (1, 14),
  (1, 15),
  (1, 16),
  (1, 17),
  (1, 18),
  (1, 19),
  (1, 20),
  (2, 1),
  (2, 2),
  (2, 3),
  (2, 4),
  (2, 6),
  (2, 7),
  (2, 13),
  (2, 14),
  (2, 15),
  (2, 17),
  (2, 18),
  (2, 19),
  (3, 1),
  (3, 2),
  (3, 7),
  (3, 8),
  (3, 9),
  (3, 10),
  (3, 13),
  (3, 14),
  (3, 15),
  (3, 17),
  (3, 18),
  (3, 19),
  (4, 1),
  (4, 2),
  (4, 7),
  (4, 8),
  (4, 9),
  (4, 10),
  (4, 13),
  (4, 14),
  (4, 15),
  (4, 17),
  (4, 18),
  (4, 19);

INSERT INTO document_types (
  id,
  document_type_code,
  document_type_name,
  drawing_context,
  is_active,
  created_at,
  updated_at
) VALUES
  (1, 'PFD', 'PFD', 'PFD', 1, '2026-01-01 00:00:00.000', NULL),
  (2, 'PID', 'P&ID', 'P&ID', 1, '2026-01-01 00:00:00.000', NULL);

INSERT INTO users (
  id,
  user_code,
  username,
  full_name,
  email,
  department_id,
  department_name_snapshot,
  position,
  role_id,
  status,
  created_at,
  updated_at
) VALUES (
  1,
  'USR-000001',
  'wahyuts',
  'Wahyu Trisna Setiadi',
  'wahyu.trisna100@gmail.com',
  1,
  'No Department',
  'EDMS Admin',
  1,
  'Active',
  '2026-01-01 00:00:00.000',
  NULL
);

INSERT INTO user_credentials (
  user_id,
  password_hash,
  is_active,
  created_at,
  updated_at,
  password_changed_at
) VALUES (
  1,
  '$2b$12$OeBCwxqS45mdfl.xSKFp5OnndOrX6aagXAc7yDXXW.Tetr/aLt10G',
  1,
  '2026-01-01 00:00:00.000',
  '2026-01-01 00:00:00.000',
  '2026-01-01 00:00:00.000'
);

INSERT INTO system_metadata (
  `key`,
  `value`,
  updated_at
) VALUES
  ('schema_version', '{"version":"1.0","phase":"1.3"}', '2026-01-01 00:00:00.000'),
  ('seed_version', '{"version":"1.0","phase":"1.4","name":"seed-base"}', '2026-01-01 00:00:00.000'),
  ('bootstrap_status', '{"adminCreated":true,"baseSeedApplied":true}', '2026-01-01 00:00:00.000');

COMMIT;
