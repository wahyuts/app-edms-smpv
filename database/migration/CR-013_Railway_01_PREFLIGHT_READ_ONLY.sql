-- CR-013 Railway Development: READ-ONLY PREFLIGHT
-- Run as SQL SCRIPT (Alt+X) against EDMS Development / railway.
-- Do NOT run the migration unless ALL rows report PASS.
SELECT '01_database' AS test,
       IF(DATABASE()='railway' AND @@version_comment LIKE '%MySQL%' AND CAST(SUBSTRING_INDEX(VERSION(),'.',1) AS UNSIGNED)>=8,'PASS','STOP') AS result,
       CONCAT(COALESCE(DATABASE(),'NULL'),' / ',VERSION(),' / ',@@version_comment) AS details;
SELECT '02_existing_roles' AS test,
       IF(COUNT(*)=4 AND SUM((id=1 AND role_name='Admin') OR (id=2 AND role_name='Document Owner') OR (id=3 AND role_name='Team Process') OR (id=4 AND role_name='Team Project'))=4,'PASS','STOP') AS result,
       CONCAT('roles=',COUNT(*)) AS details
FROM roles;
SELECT '03_existing_mappings' AS test, IF(COUNT(*)=56,'PASS','STOP') AS result, CONCAT('mappings=',COUNT(*)) AS details FROM role_permissions;
SELECT '04_viewer_permissions' AS test, IF(COUNT(*)=9,'PASS','STOP') AS result, CONCAT('permissions=',COUNT(*)) AS details
FROM permissions WHERE permission_code IN ('dashboard.view','document-register.view','document-register.download','sla-monitoring.view','escalation.view','audit-trail.view','notifications.view','profile.view','password.change');
SELECT '05_expected_constraints' AS test,
       IF(COUNT(*)=6 AND SUM(cc.CHECK_CLAUSE LIKE '%Viewer%')=0,'PASS','STOP') AS result,
       CONCAT('found=',COUNT(*),', already_viewer=',COALESCE(SUM(cc.CHECK_CLAUSE LIKE '%Viewer%'),0)) AS details
FROM information_schema.TABLE_CONSTRAINTS tc
JOIN information_schema.CHECK_CONSTRAINTS cc ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME
WHERE tc.CONSTRAINT_SCHEMA='railway' AND tc.CONSTRAINT_TYPE='CHECK'
AND ((tc.TABLE_NAME='project_memberships' AND tc.CONSTRAINT_NAME='chk_project_memberships_official_role')
OR (tc.TABLE_NAME='workflow_comments' AND tc.CONSTRAINT_NAME='chk_workflow_comments_created_by_official_role')
OR (tc.TABLE_NAME='document_history' AND tc.CONSTRAINT_NAME='chk_document_history_created_by_official_role')
OR (tc.TABLE_NAME='notifications' AND tc.CONSTRAINT_NAME IN ('chk_notifications_official_role','chk_notifications_recipient_role'))
OR (tc.TABLE_NAME='audit_trail' AND tc.CONSTRAINT_NAME='chk_audit_trail_official_role'));
-- Inspect actual constraint definitions, especially nullable semantics, before execution.
SELECT tc.TABLE_NAME,tc.CONSTRAINT_NAME,cc.CHECK_CLAUSE
FROM information_schema.TABLE_CONSTRAINTS tc
JOIN information_schema.CHECK_CONSTRAINTS cc ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME
WHERE tc.CONSTRAINT_SCHEMA='railway' AND tc.CONSTRAINT_TYPE='CHECK'
AND tc.CONSTRAINT_NAME IN ('chk_project_memberships_official_role','chk_workflow_comments_created_by_official_role','chk_document_history_created_by_official_role','chk_notifications_official_role','chk_notifications_recipient_role','chk_audit_trail_official_role')
ORDER BY tc.TABLE_NAME,tc.CONSTRAINT_NAME;
