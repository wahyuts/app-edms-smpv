-- CR-013 Railway Development. DESTRUCTIVE DDL. NO VERIFIED BACKUP.
-- ONLY run after ALL 5 preflight tests PASS and constraint definitions are reviewed.
-- DBeaver: Stop on error, Execute SQL Script (Alt+X). Do NOT rerun on partial failure.
-- DDL implicit commits; rollback cannot undo completed ALTER TABLE statements.
-- Does NOT touch engineering_documents or system_metadata.
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
INSERT INTO roles (id,role_code,role_name,is_active)
SELECT 5,'ROLE-VIEWER','Viewer',1
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE id=5 OR role_code='ROLE-VIEWER' OR role_name='Viewer');
INSERT INTO role_permissions (role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.permission_code IN
('dashboard.view','document-register.view','document-register.download','sla-monitoring.view','escalation.view','audit-trail.view','notifications.view','profile.view','password.change')
WHERE r.id=5 AND r.role_code='ROLE-VIEWER'
AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id=r.id AND rp.permission_id=p.id);
-- Verification. Read result rows; no automated PASS guarantees in this script.
SELECT id,role_code,role_name,is_active FROM roles ORDER BY id;
SELECT role_id,COUNT(*) AS permission_count FROM role_permissions GROUP BY role_id ORDER BY role_id;
SELECT tc.TABLE_NAME,tc.CONSTRAINT_NAME,cc.CHECK_CLAUSE
FROM information_schema.TABLE_CONSTRAINTS tc
JOIN information_schema.CHECK_CONSTRAINTS cc ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME
WHERE tc.CONSTRAINT_SCHEMA='railway' AND tc.CONSTRAINT_TYPE='CHECK'
AND tc.CONSTRAINT_NAME IN ('chk_project_memberships_official_role','chk_workflow_comments_created_by_official_role','chk_document_history_created_by_official_role','chk_notifications_official_role','chk_notifications_recipient_role','chk_audit_trail_official_role')
ORDER BY tc.TABLE_NAME,tc.CONSTRAINT_NAME;
