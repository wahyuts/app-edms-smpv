-- CR-013 - Official Role Viewer
-- Engine target: MariaDB 10.4.32+
-- Checkpoint A artifact only. Do not execute before Development target, backup,
-- engine/version, and actual CHECK constraints are verified and approved.
--
-- Read-only preflight queries:
-- SELECT VERSION() AS database_version;
-- SELECT @@version_comment AS database_engine;
-- SELECT DATABASE() AS active_database;
-- SELECT tc.TABLE_NAME, tc.CONSTRAINT_NAME, cc.CHECK_CLAUSE
-- FROM information_schema.TABLE_CONSTRAINTS tc
-- JOIN information_schema.CHECK_CONSTRAINTS cc
--   ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
--  AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
-- WHERE tc.CONSTRAINT_SCHEMA = DATABASE()
--   AND tc.TABLE_NAME IN (
--     'project_memberships',
--     'workflow_comments',
--     'document_history',
--     'notifications',
--     'audit_trail'
--   )
-- ORDER BY tc.TABLE_NAME, tc.CONSTRAINT_NAME;
--
-- Rollback note:
-- Do not restore the four-role CHECK constraints after any Viewer data exists.
-- Prefer forward-fix unless business approval confirms no Viewer data is present.

ALTER TABLE project_memberships
  DROP CONSTRAINT chk_project_memberships_official_role,
  ADD CONSTRAINT chk_project_memberships_official_role
    CHECK (official_role IN ('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer'));

ALTER TABLE workflow_comments
  DROP CONSTRAINT chk_workflow_comments_created_by_official_role,
  ADD CONSTRAINT chk_workflow_comments_created_by_official_role
    CHECK (created_by_official_role_snapshot IS NULL OR created_by_official_role_snapshot IN ('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer'));

ALTER TABLE document_history
  DROP CONSTRAINT chk_document_history_created_by_official_role,
  ADD CONSTRAINT chk_document_history_created_by_official_role
    CHECK (created_by_official_role_snapshot IS NULL OR created_by_official_role_snapshot IN ('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer'));

ALTER TABLE notifications
  DROP CONSTRAINT chk_notifications_official_role,
  DROP CONSTRAINT chk_notifications_recipient_role,
  ADD CONSTRAINT chk_notifications_official_role
    CHECK (official_role IS NULL OR official_role IN ('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer')),
  ADD CONSTRAINT chk_notifications_recipient_role
    CHECK (recipient_role IS NULL OR recipient_role IN ('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer'));

ALTER TABLE audit_trail
  DROP CONSTRAINT chk_audit_trail_official_role,
  ADD CONSTRAINT chk_audit_trail_official_role
    CHECK (official_role IS NULL OR official_role IN ('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer'));

INSERT INTO roles (
  id,
  role_code,
  role_name,
  is_active
)
SELECT
  5,
  'ROLE-VIEWER',
  'Viewer',
  1
WHERE NOT EXISTS (
  SELECT 1
  FROM roles
  WHERE id = 5
     OR role_code = 'ROLE-VIEWER'
     OR role_name = 'Viewer'
);

INSERT INTO role_permissions (
  role_id,
  permission_id
)
SELECT viewer_role.id, permissions.id
FROM roles viewer_role
JOIN permissions ON permissions.permission_code IN (
  'dashboard.view',
  'document-register.view',
  'document-register.download',
  'sla-monitoring.view',
  'escalation.view',
  'audit-trail.view',
  'notifications.view',
  'profile.view',
  'password.change'
)
WHERE viewer_role.role_code = 'ROLE-VIEWER'
ON DUPLICATE KEY UPDATE permission_id = VALUES(permission_id);

INSERT INTO system_metadata (
  `key`,
  `value`,
  updated_at
) VALUES
  ('schema_version', '{"version":"1.1","phase":"2B","changeRequest":"CR-013"}', UTC_TIMESTAMP(3)),
  ('seed_version', '{"version":"1.1","phase":"2B","name":"viewer-additive-seed","changeRequest":"CR-013"}', UTC_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `value` = VALUES(`value`),
  updated_at = VALUES(updated_at);
