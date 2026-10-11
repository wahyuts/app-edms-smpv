-- CR-013 / Railway Development / MySQL 9.x
-- WARNING: No verified backup. ALTER TABLE causes implicit commits; this is NOT atomic.
-- Run only against EDMS Development -> database `railway`.
-- DBeaver: Execute SQL Script (Alt+X), not Execute SQL Statement (Ctrl+Enter).
-- IMPORTANT: Do NOT enable "continue on error". Stop immediately on any error.
-- Single-use script. Do NOT rerun blindly if execution stops partway.
-- This does not modify engineering_documents or system_metadata.

DELIMITER $$

CREATE PROCEDURE railway_cr013_viewer_apply_once()
BEGIN
  DECLARE v_count INT DEFAULT 0;

  -- Guard: exact environment, baseline roles, and permissions.
  IF DATABASE() <> 'railway' OR DATABASE() IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'STOP: database must be railway';
  END IF;
  IF @@version_comment NOT LIKE '%MySQL%' OR CAST(SUBSTRING_INDEX(VERSION(), '.', 1) AS UNSIGNED) < 8 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'STOP: expected MySQL 8+ server';
  END IF;
  SELECT COUNT(*) INTO v_count FROM roles;
  IF v_count <> 4 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'STOP: expected exactly 4 existing roles';
  END IF;
  SELECT COUNT(*) INTO v_count FROM roles
   WHERE (id=1 AND role_name='Admin')
      OR (id=2 AND role_name='Document Owner')
      OR (id=3 AND role_name='Team Process')
      OR (id=4 AND role_name='Team Project');
  IF v_count <> 4 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'STOP: role ID/name baseline differs';
  END IF;
  SELECT COUNT(*) INTO v_count FROM role_permissions;
  IF v_count <> 56 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'STOP: expected 56 existing role mappings';
  END IF;
  SELECT COUNT(*) INTO v_count FROM permissions
  WHERE permission_code IN (
    'dashboard.view', 'document-register.view', 'document-register.download',
    'sla-monitoring.view', 'escalation.view', 'audit-trail.view',
    'notifications.view', 'profile.view', 'password.change'
  );
  IF v_count <> 9 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'STOP: expected 9 Viewer permissions';
  END IF;
  SELECT COUNT(*) INTO v_count
    FROM information_schema.TABLE_CONSTRAINTS tc
    JOIN information_schema.CHECK_CONSTRAINTS cc
      ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA
     AND cc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME
   WHERE tc.CONSTRAINT_SCHEMA='railway'
     AND tc.CONSTRAINT_TYPE='CHECK'
     AND (
       (tc.TABLE_NAME='project_memberships' AND tc.CONSTRAINT_NAME='chk_project_memberships_official_role') OR
       (tc.TABLE_NAME='workflow_comments' AND tc.CONSTRAINT_NAME='chk_workflow_comments_created_by_official_role') OR
       (tc.TABLE_NAME='document_history' AND tc.CONSTRAINT_NAME='chk_document_history_created_by_official_role') OR
       (tc.TABLE_NAME='notifications' AND tc.CONSTRAINT_NAME IN ('chk_notifications_official_role','chk_notifications_recipient_role')) OR
       (tc.TABLE_NAME='audit_trail' AND tc.CONSTRAINT_NAME='chk_audit_trail_official_role')
     )
     AND cc.CHECK_CLAUSE NOT LIKE '%Viewer%';
  IF v_count <> 6 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'STOP: expected 6 existing four-role CHECKs';
  END IF;

  -- Schema changes: each ALTER is independently committed by MySQL.
  ALTER TABLE project_memberships
    DROP CHECK chk_project_memberships_official_role,
    ADD CONSTRAINT chk_project_memberships_official_role
      CHECK (official_role IN ('Admin','Document Owner','Team Process','Team Project','Viewer'));

  ALTER TABLE workflow_comments
    DROP CHECK chk_workflow_comments_created_by_official_role,
    ADD CONSTRAINT chk_workflow_comments_created_by_official_role
      CHECK (created_by_official_role_snapshot IS NULL OR created_by_official_role_snapshot IN ('Admin','Document Owner','Team Process','Team Project','Viewer'));

  ALTER TABLE document_history
    DROP CHECK chk_document_history_created_by_official_role,
    ADD CONSTRAINT chk_document_history_created_by_official_role
      CHECK (created_by_official_role_snapshot IS NULL OR created_by_official_role_snapshot IN ('Admin','Document Owner','Team Process','Team Project','Viewer'));

  ALTER TABLE notifications
    DROP CHECK chk_notifications_official_role,
    DROP CHECK chk_notifications_recipient_role,
    ADD CONSTRAINT chk_notifications_official_role
      CHECK (official_role IS NULL OR official_role IN ('Admin','Document Owner','Team Process','Team Project','Viewer')),
    ADD CONSTRAINT chk_notifications_recipient_role
      CHECK (recipient_role IS NULL OR recipient_role IN ('Admin','Document Owner','Team Process','Team Project','Viewer'));

  ALTER TABLE audit_trail
    DROP CHECK chk_audit_trail_official_role,
    ADD CONSTRAINT chk_audit_trail_official_role
      CHECK (official_role IS NULL OR official_role IN ('Admin','Document Owner','Team Process','Team Project','Viewer'));

  -- Additive role and mapping; existing four role mappings remain untouched.
  INSERT INTO roles (id,role_code,role_name,is_active)
  VALUES (5,'ROLE-VIEWER','Viewer',1);

  INSERT INTO role_permissions (role_id,permission_id)
  SELECT 5, id FROM permissions
   WHERE permission_code IN (
    'dashboard.view', 'document-register.view', 'document-register.download',
    'sla-monitoring.view', 'escalation.view', 'audit-trail.view',
    'notifications.view', 'profile.view', 'password.change'
   );

  -- Postflight checks; failures here mean some/all changes ALREADY happened.
  SELECT COUNT(*) INTO v_count FROM role_permissions WHERE role_id=5;
  IF v_count <> 9 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'POSTCHECK FAIL: Viewer mappings not 9';
  END IF;
  SELECT COUNT(*) INTO v_count FROM role_permissions;
  IF v_count <> 65 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'POSTCHECK FAIL: total mappings not 65';
  END IF;
  SELECT COUNT(*) INTO v_count
    FROM information_schema.TABLE_CONSTRAINTS tc
    JOIN information_schema.CHECK_CONSTRAINTS cc
      ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA
     AND cc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME
   WHERE tc.CONSTRAINT_SCHEMA='railway'
     AND tc.CONSTRAINT_TYPE='CHECK'
     AND (
       (tc.TABLE_NAME='project_memberships' AND tc.CONSTRAINT_NAME='chk_project_memberships_official_role') OR
       (tc.TABLE_NAME='workflow_comments' AND tc.CONSTRAINT_NAME='chk_workflow_comments_created_by_official_role') OR
       (tc.TABLE_NAME='document_history' AND tc.CONSTRAINT_NAME='chk_document_history_created_by_official_role') OR
       (tc.TABLE_NAME='notifications' AND tc.CONSTRAINT_NAME IN ('chk_notifications_official_role','chk_notifications_recipient_role')) OR
       (tc.TABLE_NAME='audit_trail' AND tc.CONSTRAINT_NAME='chk_audit_trail_official_role')
     )
     AND cc.CHECK_CLAUSE LIKE '%Viewer%';
  IF v_count <> 6 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'POSTCHECK FAIL: Viewer CHECK count not 6';
  END IF;
  SELECT 'CR-013 DATABASE MIGRATION: PASS' AS result;
END$$

DELIMITER ;

CALL railway_cr013_viewer_apply_once();

-- Only reached if script continues after successful CALL.
DROP PROCEDURE railway_cr013_viewer_apply_once;

-- Final human-readable verification.
SELECT id,role_code,role_name,is_active FROM roles ORDER BY id;
SELECT role_id,COUNT(*) AS permission_count FROM role_permissions GROUP BY role_id ORDER BY role_id;
SELECT tc.TABLE_NAME,tc.CONSTRAINT_NAME,cc.CHECK_CLAUSE
FROM information_schema.TABLE_CONSTRAINTS tc
JOIN information_schema.CHECK_CONSTRAINTS cc
  ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME
WHERE tc.CONSTRAINT_SCHEMA='railway' AND tc.CONSTRAINT_TYPE='CHECK'
  AND tc.CONSTRAINT_NAME IN (
    'chk_project_memberships_official_role',
    'chk_workflow_comments_created_by_official_role',
    'chk_document_history_created_by_official_role',
    'chk_notifications_official_role',
    'chk_notifications_recipient_role',
    'chk_audit_trail_official_role'
  )
ORDER BY tc.TABLE_NAME,tc.CONSTRAINT_NAME;
