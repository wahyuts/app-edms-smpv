USE edms_smpv;

START TRANSACTION;

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
) VALUES
  (2, 'USR-000002', 'docowner.demo', 'Dina Saraswati', 'dina.saraswati@example.test', 1, 'No Department', 'Document Control Lead', 2, 'Active', '2026-01-02 00:00:00.000', NULL),
  (3, 'USR-000003', 'process.demo', 'Rafi Pradana', 'rafi.pradana@example.test', 1, 'No Department', 'Process Engineer', 3, 'Active', '2026-01-02 00:00:00.000', NULL),
  (4, 'USR-000004', 'project.demo', 'Maya Kartika', 'maya.kartika@example.test', 1, 'No Department', 'Project Engineer', 4, 'Active', '2026-01-02 00:00:00.000', NULL);

INSERT INTO user_credentials (
  user_id,
  password_hash,
  is_active,
  created_at,
  updated_at,
  password_changed_at
) VALUES
  (2, '$2b$12$6hsztp.DxIujJm1RZ8WYueIrJWqaNTeKWhQiHRIFIAGkXmA8GN8o2', 1, '2026-01-02 00:00:00.000', '2026-01-02 00:00:00.000', '2026-01-02 00:00:00.000'),
  (3, '$2b$12$6hsztp.DxIujJm1RZ8WYueIrJWqaNTeKWhQiHRIFIAGkXmA8GN8o2', 1, '2026-01-02 00:00:00.000', '2026-01-02 00:00:00.000', '2026-01-02 00:00:00.000'),
  (4, '$2b$12$6hsztp.DxIujJm1RZ8WYueIrJWqaNTeKWhQiHRIFIAGkXmA8GN8o2', 1, '2026-01-02 00:00:00.000', '2026-01-02 00:00:00.000', '2026-01-02 00:00:00.000');

INSERT INTO projects (
  id,
  project_code,
  project_name,
  description,
  status,
  created_by_user_id,
  created_at,
  updated_at,
  updated_by_user_id,
  closed_at,
  closed_by_user_id
) VALUES (
  'PRJ-DEMO-001',
  'SMPV-DEMO-2026',
  'SMPV EDMS Demo Project',
  'Internal demo project for EDMS workflow validation.',
  'Active',
  1,
  '2026-01-02 01:00:00.000',
  NULL,
  NULL,
  NULL,
  NULL
);

INSERT INTO project_memberships (
  id,
  project_id,
  user_id,
  official_role,
  status,
  assigned_by_user_id,
  assigned_at,
  updated_at,
  updated_by_user_id
) VALUES
  ('PMB-DEMO-001', 'PRJ-DEMO-001', 1, 'Admin', 'Active', 1, '2026-01-02 01:05:00.000', NULL, NULL),
  ('PMB-DEMO-002', 'PRJ-DEMO-001', 2, 'Document Owner', 'Active', 1, '2026-01-02 01:06:00.000', NULL, NULL),
  ('PMB-DEMO-003', 'PRJ-DEMO-001', 3, 'Team Process', 'Active', 1, '2026-01-02 01:07:00.000', NULL, NULL),
  ('PMB-DEMO-004', 'PRJ-DEMO-001', 4, 'Team Project', 'Active', 1, '2026-01-02 01:08:00.000', NULL, NULL);

INSERT INTO user_project_preferences (
  user_id,
  active_project_id,
  updated_at
) VALUES
  (1, 'PRJ-DEMO-001', '2026-01-02 01:10:00.000'),
  (2, 'PRJ-DEMO-001', '2026-01-02 01:10:00.000'),
  (3, 'PRJ-DEMO-001', '2026-01-02 01:10:00.000'),
  (4, 'PRJ-DEMO-001', '2026-01-02 01:10:00.000');

INSERT INTO engineering_documents (
  id,
  project_id,
  document_type_id,
  document_number,
  description,
  drawing,
  area,
  days_until_validation,
  workflow_status,
  lifecycle_status,
  revision_label,
  responsible_role,
  current_assignee_user_id,
  active_revision_id,
  active_file_id,
  created_by_user_id,
  created_at,
  updated_at,
  updated_by_user_id,
  archived_at,
  archived_by_user_id,
  archive_reason,
  restored_at,
  restored_by_user_id,
  sla_started_at,
  sla_stopped_at,
  sla_assignee_name_snapshot
) VALUES
  ('DOC-DEMO-001', 'PRJ-DEMO-001', 1, 'PFD-DEMO-0001', 'Process flow diagram awaiting process review.', 'PFD', 'Area 100', 14, 'Process Review', 'Active', 'IFR-Submitted', 'Team Process', 3, NULL, NULL, 2, '2026-01-05 02:00:00.000', '2026-01-05 02:00:00.000', 2, NULL, NULL, NULL, NULL, NULL, '2026-01-05 02:00:00.000', NULL, 'Rafi Pradana'),
  ('DOC-DEMO-002', 'PRJ-DEMO-001', 1, 'PFD-DEMO-0002', 'Revised process diagram waiting for project review.', 'PFD', 'Area 110', 7, 'Project Review', 'Active', 'IFA-Submitted', 'Team Project', 4, NULL, NULL, 2, '2026-01-04 02:00:00.000', '2026-01-08 04:00:00.000', 2, NULL, NULL, NULL, NULL, NULL, '2026-01-08 04:00:00.000', NULL, 'Maya Kartika'),
  ('DOC-DEMO-003', 'PRJ-DEMO-001', 2, 'PID-DEMO-0003', 'Instrument diagram returned with process comment.', 'P&ID', 'Area 120', 3, 'Process Comment', 'Active', 'IFR-Submitted', 'Document Owner', 2, NULL, NULL, 2, '2026-01-03 02:00:00.000', '2026-01-06 05:00:00.000', 3, NULL, NULL, NULL, NULL, NULL, '2026-01-06 05:00:00.000', NULL, 'Dina Saraswati'),
  ('DOC-DEMO-004', 'PRJ-DEMO-001', 2, 'PID-DEMO-0004', 'Instrument diagram rejected by process team.', 'P&ID', 'Area 130', 5, 'Process Reject', 'Active', 'IFR-Submitted', 'Document Owner', 2, NULL, NULL, 2, '2026-01-03 03:00:00.000', '2026-01-06 06:00:00.000', 3, NULL, NULL, NULL, NULL, NULL, '2026-01-06 06:00:00.000', NULL, 'Dina Saraswati'),
  ('DOC-DEMO-005', 'PRJ-DEMO-001', 1, 'PFD-DEMO-0005', 'Process diagram returned with project comment.', 'PFD', 'Area 140', 4, 'Project Comment', 'Active', 'IFA-Submitted', 'Document Owner', 2, NULL, NULL, 2, '2026-01-03 04:00:00.000', '2026-01-07 07:00:00.000', 4, NULL, NULL, NULL, NULL, NULL, '2026-01-07 07:00:00.000', NULL, 'Dina Saraswati'),
  ('DOC-DEMO-006', 'PRJ-DEMO-001', 1, 'PFD-DEMO-0006', 'Process diagram rejected by project team.', 'PFD', 'Area 150', 4, 'Project Reject', 'Active', 'IFA-Submitted', 'Document Owner', 2, NULL, NULL, 2, '2026-01-03 05:00:00.000', '2026-01-07 08:00:00.000', 4, NULL, NULL, NULL, NULL, NULL, '2026-01-07 08:00:00.000', NULL, 'Dina Saraswati'),
  ('DOC-DEMO-007', 'PRJ-DEMO-001', 2, 'PID-DEMO-0007', 'Approved final as-built instrument diagram.', 'P&ID', 'Area 160', 10, 'Approved', 'Active', 'AS-Built', 'None', NULL, NULL, NULL, 2, '2026-01-02 02:00:00.000', '2026-01-10 09:00:00.000', 4, NULL, NULL, NULL, NULL, NULL, '2026-01-09 09:00:00.000', '2026-01-10 09:00:00.000', NULL),
  ('DOC-DEMO-008', 'PRJ-DEMO-001', 1, 'PFD-DEMO-0008', 'Approved document archived by admin.', 'PFD', 'Area 170', 10, 'Approved', 'Archived', 'AS-Built', 'None', NULL, NULL, NULL, 2, '2026-01-02 03:00:00.000', '2026-01-11 10:00:00.000', 1, '2026-01-11 10:00:00.000', 1, 'Superseded by approved package archive.', NULL, NULL, '2026-01-09 10:00:00.000', '2026-01-10 10:00:00.000', NULL),
  ('DOC-DEMO-009', 'PRJ-DEMO-001', 2, 'PID-DEMO-0009', 'Approved document archived and restored for validation.', 'P&ID', 'Area 180', 10, 'Approved', 'Active', 'AS-Built', 'None', NULL, NULL, NULL, 2, '2026-01-02 04:00:00.000', '2026-01-12 11:00:00.000', 1, NULL, NULL, NULL, '2026-01-12 11:00:00.000', 1, '2026-01-09 11:00:00.000', '2026-01-10 11:00:00.000', NULL);

INSERT INTO stored_files (
  file_id,
  project_id,
  document_id,
  original_file_name,
  physical_file_name,
  file_extension,
  mime_type,
  file_size,
  storage_key,
  relative_path,
  file_category,
  checksum,
  uploaded_by_user_id,
  uploaded_at,
  is_active
) VALUES
  ('FILE-DEMO-001', 'PRJ-DEMO-001', 'DOC-DEMO-001', 'PFD-DEMO-0001_IFR.pdf', 'PFD-DEMO-0001_IFR_FILE-DEMO-001_PFD-DEMO-0001_IFR.pdf', 'pdf', 'application/pdf', 248120, 'projects/PRJ-DEMO-001/documents/DOC-DEMO-001/FILE-DEMO-001.pdf', 'documents/DOC-DEMO-001/revisions/FILE-DEMO-001.pdf', 'Active Document File', 'sha256-demo-001', 2, '2026-01-05 02:00:00.000', 1),
  ('FILE-DEMO-002A', 'PRJ-DEMO-001', 'DOC-DEMO-002', 'PFD-DEMO-0002_IFR.pdf', 'PFD-DEMO-0002_IFR_FILE-DEMO-002A_PFD-DEMO-0002_IFR.pdf', 'pdf', 'application/pdf', 241330, 'projects/PRJ-DEMO-001/documents/DOC-DEMO-002/FILE-DEMO-002A.pdf', 'documents/DOC-DEMO-002/revisions/FILE-DEMO-002A.pdf', 'Revision File', 'sha256-demo-002a', 2, '2026-01-04 02:00:00.000', 0),
  ('FILE-DEMO-002', 'PRJ-DEMO-001', 'DOC-DEMO-002', 'PFD-DEMO-0002_IFA.pdf', 'PFD-DEMO-0002_IFA_FILE-DEMO-002_PFD-DEMO-0002_IFA.pdf', 'pdf', 'application/pdf', 252840, 'projects/PRJ-DEMO-001/documents/DOC-DEMO-002/FILE-DEMO-002.pdf', 'documents/DOC-DEMO-002/revisions/FILE-DEMO-002.pdf', 'Active Document File', 'sha256-demo-002', 2, '2026-01-08 04:00:00.000', 1),
  ('FILE-DEMO-003', 'PRJ-DEMO-001', 'DOC-DEMO-003', 'PID-DEMO-0003_IFR.pdf', 'PID-DEMO-0003_IFR_FILE-DEMO-003_PID-DEMO-0003_IFR.pdf', 'pdf', 'application/pdf', 318440, 'projects/PRJ-DEMO-001/documents/DOC-DEMO-003/FILE-DEMO-003.pdf', 'documents/DOC-DEMO-003/revisions/FILE-DEMO-003.pdf', 'Active Document File', 'sha256-demo-003', 2, '2026-01-03 02:00:00.000', 1),
  ('FILE-DEMO-004', 'PRJ-DEMO-001', 'DOC-DEMO-004', 'PID-DEMO-0004_IFR.pdf', 'PID-DEMO-0004_IFR_FILE-DEMO-004_PID-DEMO-0004_IFR.pdf', 'pdf', 'application/pdf', 304210, 'projects/PRJ-DEMO-001/documents/DOC-DEMO-004/FILE-DEMO-004.pdf', 'documents/DOC-DEMO-004/revisions/FILE-DEMO-004.pdf', 'Active Document File', 'sha256-demo-004', 2, '2026-01-03 03:00:00.000', 1),
  ('FILE-DEMO-005', 'PRJ-DEMO-001', 'DOC-DEMO-005', 'PFD-DEMO-0005_IFA.pdf', 'PFD-DEMO-0005_IFA_FILE-DEMO-005_PFD-DEMO-0005_IFA.pdf', 'pdf', 'application/pdf', 267900, 'projects/PRJ-DEMO-001/documents/DOC-DEMO-005/FILE-DEMO-005.pdf', 'documents/DOC-DEMO-005/revisions/FILE-DEMO-005.pdf', 'Active Document File', 'sha256-demo-005', 2, '2026-01-03 04:00:00.000', 1),
  ('FILE-DEMO-006', 'PRJ-DEMO-001', 'DOC-DEMO-006', 'PFD-DEMO-0006_IFA.pdf', 'PFD-DEMO-0006_IFA_FILE-DEMO-006_PFD-DEMO-0006_IFA.pdf', 'pdf', 'application/pdf', 276420, 'projects/PRJ-DEMO-001/documents/DOC-DEMO-006/FILE-DEMO-006.pdf', 'documents/DOC-DEMO-006/revisions/FILE-DEMO-006.pdf', 'Active Document File', 'sha256-demo-006', 2, '2026-01-03 05:00:00.000', 1),
  ('FILE-DEMO-007', 'PRJ-DEMO-001', 'DOC-DEMO-007', 'PID-DEMO-0007_AS_BUILT.pdf', 'PID-DEMO-0007_AS_BUILT_FILE-DEMO-007_PID-DEMO-0007_AS_BUILT.pdf', 'pdf', 'application/pdf', 352100, 'projects/PRJ-DEMO-001/documents/DOC-DEMO-007/FILE-DEMO-007.pdf', 'documents/DOC-DEMO-007/revisions/FILE-DEMO-007.pdf', 'Active Document File', 'sha256-demo-007', 2, '2026-01-10 09:00:00.000', 1),
  ('FILE-DEMO-008', 'PRJ-DEMO-001', 'DOC-DEMO-008', 'PFD-DEMO-0008_AS_BUILT.pdf', 'PFD-DEMO-0008_AS_BUILT_FILE-DEMO-008_PFD-DEMO-0008_AS_BUILT.pdf', 'pdf', 'application/pdf', 341220, 'projects/PRJ-DEMO-001/documents/DOC-DEMO-008/FILE-DEMO-008.pdf', 'documents/DOC-DEMO-008/revisions/FILE-DEMO-008.pdf', 'Active Document File', 'sha256-demo-008', 2, '2026-01-10 10:00:00.000', 1),
  ('FILE-DEMO-009', 'PRJ-DEMO-001', 'DOC-DEMO-009', 'PID-DEMO-0009_AS_BUILT.pdf', 'PID-DEMO-0009_AS_BUILT_FILE-DEMO-009_PID-DEMO-0009_AS_BUILT.pdf', 'pdf', 'application/pdf', 366910, 'projects/PRJ-DEMO-001/documents/DOC-DEMO-009/FILE-DEMO-009.pdf', 'documents/DOC-DEMO-009/revisions/FILE-DEMO-009.pdf', 'Active Document File', 'sha256-demo-009', 2, '2026-01-10 11:00:00.000', 1),
  ('FILE-DEMO-ATT-003', 'PRJ-DEMO-001', 'DOC-DEMO-003', 'process-comment-markup.xlsx', 'PID-DEMO-0003_COMMENT_FILE-DEMO-ATT-003_process-comment-markup.xlsx', 'xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 18422, 'projects/PRJ-DEMO-001/workflow-attachments/DOC-DEMO-003/WFC-DEMO-003.xlsx', 'workflow-attachments/DOC-DEMO-003/WFC-DEMO-003.xlsx', 'Workflow Attachment', 'sha256-demo-att-003', 3, '2026-01-06 05:00:00.000', 1),
  ('FILE-DEMO-ATT-005', 'PRJ-DEMO-001', 'DOC-DEMO-005', 'project-review-redline.pdf', 'PFD-DEMO-0005_COMMENT_FILE-DEMO-ATT-005_project-review-redline.pdf', 'pdf', 'application/pdf', 90520, 'projects/PRJ-DEMO-001/workflow-attachments/DOC-DEMO-005/WFC-DEMO-005.pdf', 'workflow-attachments/DOC-DEMO-005/WFC-DEMO-005.pdf', 'Workflow Attachment', 'sha256-demo-att-005', 4, '2026-01-07 07:00:00.000', 1);

INSERT INTO document_revisions (
  id,
  project_id,
  document_id,
  revision_label,
  revision_sequence,
  file_id,
  storage_path_legacy,
  is_active,
  source_status,
  result_status,
  created_at,
  created_by_user_id
) VALUES
  ('REV-DEMO-001', 'PRJ-DEMO-001', 'DOC-DEMO-001', 'IFR-Submitted', 1, 'FILE-DEMO-001', 'documents/DOC-DEMO-001/revisions/FILE-DEMO-001.pdf', 1, NULL, 'Process Review', '2026-01-05 02:00:00.000', 2),
  ('REV-DEMO-002A', 'PRJ-DEMO-001', 'DOC-DEMO-002', 'IFR-Submitted', 1, 'FILE-DEMO-002A', 'documents/DOC-DEMO-002/revisions/FILE-DEMO-002A.pdf', 0, NULL, 'Process Comment', '2026-01-04 02:00:00.000', 2),
  ('REV-DEMO-002', 'PRJ-DEMO-001', 'DOC-DEMO-002', 'IFA-Submitted', 2, 'FILE-DEMO-002', 'documents/DOC-DEMO-002/revisions/FILE-DEMO-002.pdf', 1, 'Process Comment', 'Project Review', '2026-01-08 04:00:00.000', 2),
  ('REV-DEMO-003', 'PRJ-DEMO-001', 'DOC-DEMO-003', 'IFR-Submitted', 1, 'FILE-DEMO-003', 'documents/DOC-DEMO-003/revisions/FILE-DEMO-003.pdf', 1, NULL, 'Process Comment', '2026-01-03 02:00:00.000', 2),
  ('REV-DEMO-004', 'PRJ-DEMO-001', 'DOC-DEMO-004', 'IFR-Submitted', 1, 'FILE-DEMO-004', 'documents/DOC-DEMO-004/revisions/FILE-DEMO-004.pdf', 1, NULL, 'Process Reject', '2026-01-03 03:00:00.000', 2),
  ('REV-DEMO-005', 'PRJ-DEMO-001', 'DOC-DEMO-005', 'IFA-Submitted', 1, 'FILE-DEMO-005', 'documents/DOC-DEMO-005/revisions/FILE-DEMO-005.pdf', 1, 'Project Review', 'Project Comment', '2026-01-03 04:00:00.000', 2),
  ('REV-DEMO-006', 'PRJ-DEMO-001', 'DOC-DEMO-006', 'IFA-Submitted', 1, 'FILE-DEMO-006', 'documents/DOC-DEMO-006/revisions/FILE-DEMO-006.pdf', 1, 'Project Review', 'Project Reject', '2026-01-03 05:00:00.000', 2),
  ('REV-DEMO-007', 'PRJ-DEMO-001', 'DOC-DEMO-007', 'AS-Built', 1, 'FILE-DEMO-007', 'documents/DOC-DEMO-007/revisions/FILE-DEMO-007.pdf', 1, 'Project Review', 'Approved', '2026-01-10 09:00:00.000', 4),
  ('REV-DEMO-008', 'PRJ-DEMO-001', 'DOC-DEMO-008', 'AS-Built', 1, 'FILE-DEMO-008', 'documents/DOC-DEMO-008/revisions/FILE-DEMO-008.pdf', 1, 'Project Review', 'Approved', '2026-01-10 10:00:00.000', 4),
  ('REV-DEMO-009', 'PRJ-DEMO-001', 'DOC-DEMO-009', 'AS-Built', 1, 'FILE-DEMO-009', 'documents/DOC-DEMO-009/revisions/FILE-DEMO-009.pdf', 1, 'Project Review', 'Approved', '2026-01-10 11:00:00.000', 4);

UPDATE engineering_documents SET active_revision_id = 'REV-DEMO-001', active_file_id = 'FILE-DEMO-001' WHERE id = 'DOC-DEMO-001';
UPDATE engineering_documents SET active_revision_id = 'REV-DEMO-002', active_file_id = 'FILE-DEMO-002' WHERE id = 'DOC-DEMO-002';
UPDATE engineering_documents SET active_revision_id = 'REV-DEMO-003', active_file_id = 'FILE-DEMO-003' WHERE id = 'DOC-DEMO-003';
UPDATE engineering_documents SET active_revision_id = 'REV-DEMO-004', active_file_id = 'FILE-DEMO-004' WHERE id = 'DOC-DEMO-004';
UPDATE engineering_documents SET active_revision_id = 'REV-DEMO-005', active_file_id = 'FILE-DEMO-005' WHERE id = 'DOC-DEMO-005';
UPDATE engineering_documents SET active_revision_id = 'REV-DEMO-006', active_file_id = 'FILE-DEMO-006' WHERE id = 'DOC-DEMO-006';
UPDATE engineering_documents SET active_revision_id = 'REV-DEMO-007', active_file_id = 'FILE-DEMO-007' WHERE id = 'DOC-DEMO-007';
UPDATE engineering_documents SET active_revision_id = 'REV-DEMO-008', active_file_id = 'FILE-DEMO-008' WHERE id = 'DOC-DEMO-008';
UPDATE engineering_documents SET active_revision_id = 'REV-DEMO-009', active_file_id = 'FILE-DEMO-009' WHERE id = 'DOC-DEMO-009';

INSERT INTO workflow_comments (
  id,
  project_id,
  document_id,
  revision_id,
  workflow_action,
  workflow_comment,
  created_by_user_id,
  created_by_name_snapshot,
  created_by_official_role_snapshot,
  created_at
) VALUES
  ('WFC-DEMO-003', 'PRJ-DEMO-001', 'DOC-DEMO-003', 'REV-DEMO-003', 'Approval B', 'Please verify instrument tag loop and update the process note before resubmission.', 3, 'Rafi Pradana', 'Team Process', '2026-01-06 05:00:00.000'),
  ('WFC-DEMO-004', 'PRJ-DEMO-001', 'DOC-DEMO-004', 'REV-DEMO-004', 'Approval C', 'Document is not approved because the submitted drawing does not match the latest process basis.', 3, 'Rafi Pradana', 'Team Process', '2026-01-06 06:00:00.000'),
  ('WFC-DEMO-005', 'PRJ-DEMO-001', 'DOC-DEMO-005', 'REV-DEMO-005', 'Approval B', 'Project review found drawing note conflicts. See redline attachment for the required revision.', 4, 'Maya Kartika', 'Team Project', '2026-01-07 07:00:00.000'),
  ('WFC-DEMO-006', 'PRJ-DEMO-001', 'DOC-DEMO-006', 'REV-DEMO-006', 'Approval C', 'Project team rejected this issue for construction package alignment.', 4, 'Maya Kartika', 'Team Project', '2026-01-07 08:00:00.000');

INSERT INTO workflow_attachments (
  attachment_id,
  comment_id,
  project_id,
  document_id,
  file_id,
  uploaded_by_user_id,
  uploaded_at
) VALUES
  ('WFA-DEMO-003', 'WFC-DEMO-003', 'PRJ-DEMO-001', 'DOC-DEMO-003', 'FILE-DEMO-ATT-003', 3, '2026-01-06 05:00:00.000'),
  ('WFA-DEMO-005', 'WFC-DEMO-005', 'PRJ-DEMO-001', 'DOC-DEMO-005', 'FILE-DEMO-ATT-005', 4, '2026-01-07 07:00:00.000');

INSERT INTO document_history (
  id,
  project_id,
  document_id,
  workflow_event,
  activity,
  workflow_status,
  revision_label,
  lifecycle_status,
  reason,
  created_at,
  created_by_user_id,
  created_by_name_snapshot,
  created_by_official_role_snapshot
) VALUES
  ('DTH-DEMO-001-01', 'PRJ-DEMO-001', 'DOC-DEMO-001', 'Create Document Completed', 'Create Document', 'Process Review', 'IFR-Submitted', 'Active', NULL, '2026-01-05 02:00:00.000', 2, 'Dina Saraswati', 'Document Owner'),
  ('DTH-DEMO-002-01', 'PRJ-DEMO-001', 'DOC-DEMO-002', 'Create Document Completed', 'Create Document', 'Process Review', 'IFR-Submitted', 'Active', NULL, '2026-01-04 02:00:00.000', 2, 'Dina Saraswati', 'Document Owner'),
  ('DTH-DEMO-002-02', 'PRJ-DEMO-001', 'DOC-DEMO-002', 'Approval B Completed', 'Approval B', 'Process Comment', 'IFR-Submitted', 'Active', 'Returned with process comment.', '2026-01-06 03:00:00.000', 3, 'Rafi Pradana', 'Team Process'),
  ('DTH-DEMO-002-03', 'PRJ-DEMO-001', 'DOC-DEMO-002', 'Upload Revision Completed', 'Upload Revision', 'Project Review', 'IFA-Submitted', 'Active', 'Revision uploaded after process comment.', '2026-01-08 04:00:00.000', 2, 'Dina Saraswati', 'Document Owner'),
  ('DTH-DEMO-003-01', 'PRJ-DEMO-001', 'DOC-DEMO-003', 'Approval B Completed', 'Approval B', 'Process Comment', 'IFR-Submitted', 'Active', 'Process comment added.', '2026-01-06 05:00:00.000', 3, 'Rafi Pradana', 'Team Process'),
  ('DTH-DEMO-004-01', 'PRJ-DEMO-001', 'DOC-DEMO-004', 'Approval C Completed', 'Approval C', 'Process Reject', 'IFR-Submitted', 'Active', 'Rejected by process team.', '2026-01-06 06:00:00.000', 3, 'Rafi Pradana', 'Team Process'),
  ('DTH-DEMO-005-01', 'PRJ-DEMO-001', 'DOC-DEMO-005', 'Approval B Completed', 'Approval B', 'Project Comment', 'IFA-Submitted', 'Active', 'Project comment added.', '2026-01-07 07:00:00.000', 4, 'Maya Kartika', 'Team Project'),
  ('DTH-DEMO-006-01', 'PRJ-DEMO-001', 'DOC-DEMO-006', 'Approval C Completed', 'Approval C', 'Project Reject', 'IFA-Submitted', 'Active', 'Rejected by project team.', '2026-01-07 08:00:00.000', 4, 'Maya Kartika', 'Team Project'),
  ('DTH-DEMO-007-01', 'PRJ-DEMO-001', 'DOC-DEMO-007', 'Approval A Completed', 'Approval A', 'Approved', 'AS-Built', 'Active', NULL, '2026-01-10 09:00:00.000', 4, 'Maya Kartika', 'Team Project'),
  ('DTH-DEMO-008-01', 'PRJ-DEMO-001', 'DOC-DEMO-008', 'Approval A Completed', 'Approval A', 'Approved', 'AS-Built', 'Active', NULL, '2026-01-10 10:00:00.000', 4, 'Maya Kartika', 'Team Project'),
  ('DTH-DEMO-008-02', 'PRJ-DEMO-001', 'DOC-DEMO-008', 'Document Archived', 'Document Archived', 'Approved', 'AS-Built', 'Archived', 'Superseded by approved package archive.', '2026-01-11 10:00:00.000', 1, 'Wahyu Trisna Setiadi', 'Admin'),
  ('DTH-DEMO-009-01', 'PRJ-DEMO-001', 'DOC-DEMO-009', 'Approval A Completed', 'Approval A', 'Approved', 'AS-Built', 'Active', NULL, '2026-01-10 11:00:00.000', 4, 'Maya Kartika', 'Team Project'),
  ('DTH-DEMO-009-02', 'PRJ-DEMO-001', 'DOC-DEMO-009', 'Document Archived', 'Document Archived', 'Approved', 'AS-Built', 'Archived', 'Temporary archive for validation.', '2026-01-11 11:00:00.000', 1, 'Wahyu Trisna Setiadi', 'Admin'),
  ('DTH-DEMO-009-03', 'PRJ-DEMO-001', 'DOC-DEMO-009', 'Document Restored', 'Document Restored', 'Approved', 'AS-Built', 'Active', 'Restored after validation.', '2026-01-12 11:00:00.000', 1, 'Wahyu Trisna Setiadi', 'Admin');

INSERT INTO comment_read_receipts (
  id,
  project_id,
  document_id,
  comment_id,
  user_id,
  read_at
) VALUES
  ('CRR-DEMO-003-2', 'PRJ-DEMO-001', 'DOC-DEMO-003', 'WFC-DEMO-003', 2, '2026-01-06 06:00:00.000'),
  ('CRR-DEMO-005-2', 'PRJ-DEMO-001', 'DOC-DEMO-005', 'WFC-DEMO-005', 2, '2026-01-07 08:00:00.000'),
  ('CRR-DEMO-006-1', 'PRJ-DEMO-001', 'DOC-DEMO-006', 'WFC-DEMO-006', 1, '2026-01-07 09:00:00.000');

INSERT INTO document_sla_evaluations (
  id,
  project_id,
  document_id,
  cycle_id,
  current_state,
  notified_states,
  updated_at
) VALUES
  ('SLA-DEMO-001', 'PRJ-DEMO-001', 'DOC-DEMO-001', 'DOC-DEMO-001:2026-01-05T02:00:00.000Z', 'On Track', '["On Track"]', '2026-01-05 02:00:00.000'),
  ('SLA-DEMO-002', 'PRJ-DEMO-001', 'DOC-DEMO-002', 'DOC-DEMO-002:2026-01-08T04:00:00.000Z', 'At Risk', '["At Risk"]', '2026-01-08 04:00:00.000'),
  ('SLA-DEMO-003', 'PRJ-DEMO-001', 'DOC-DEMO-003', 'DOC-DEMO-003:2026-01-06T05:00:00.000Z', 'Overdue', '["At Risk","Overdue"]', '2026-01-10 05:00:00.000'),
  ('SLA-DEMO-004', 'PRJ-DEMO-001', 'DOC-DEMO-004', 'DOC-DEMO-004:2026-01-06T06:00:00.000Z', 'Overdue', '["Overdue"]', '2026-01-12 06:00:00.000'),
  ('SLA-DEMO-005', 'PRJ-DEMO-001', 'DOC-DEMO-005', 'DOC-DEMO-005:2026-01-07T07:00:00.000Z', 'Overdue', '["Level 1","Level 2"]', '2026-01-12 07:00:00.000'),
  ('SLA-DEMO-006', 'PRJ-DEMO-001', 'DOC-DEMO-006', 'DOC-DEMO-006:2026-01-07T08:00:00.000Z', 'Overdue', '["Level 1","Level 2","Level 3","Level 4"]', '2026-01-14 08:00:00.000'),
  ('SLA-DEMO-007', 'PRJ-DEMO-001', 'DOC-DEMO-007', 'DOC-DEMO-007:2026-01-09T09:00:00.000Z', 'Final As-Built', '["Final As-Built"]', '2026-01-10 09:00:00.000'),
  ('SLA-DEMO-008', 'PRJ-DEMO-001', 'DOC-DEMO-008', 'DOC-DEMO-008:2026-01-09T10:00:00.000Z', 'Final As-Built', '["Final As-Built"]', '2026-01-10 10:00:00.000'),
  ('SLA-DEMO-009', 'PRJ-DEMO-001', 'DOC-DEMO-009', 'DOC-DEMO-009:2026-01-09T11:00:00.000Z', 'Final As-Built', '["Final As-Built"]', '2026-01-10 11:00:00.000');

INSERT INTO notifications (
  id,
  identity_key,
  project_id,
  recipient_user_id,
  recipient_project_membership_id,
  event_type,
  title,
  message,
  priority,
  official_role,
  recipient_role,
  related_resource_type,
  related_resource_id,
  related_document_number,
  action_target,
  is_read,
  read_at,
  created_at,
  metadata
) VALUES
  ('NTF-DEMO-001', 'demo:approval-request:DOC-DEMO-001', 'PRJ-DEMO-001', 3, 'PMB-DEMO-003', 'Approval Request', 'Approval Request', 'PFD-DEMO-0001 is waiting for Process Review.', 'Normal', 'Team Process', 'Team Process', 'Document', 'DOC-DEMO-001', 'PFD-DEMO-0001', '/documents/DOC-DEMO-001', 0, NULL, '2026-01-05 02:01:00.000', '{"workflowStatus":"Process Review"}'),
  ('NTF-DEMO-002', 'demo:comment-added:DOC-DEMO-003', 'PRJ-DEMO-001', 2, 'PMB-DEMO-002', 'Comment Added', 'Workflow Comment Added', 'PID-DEMO-0003 has process review comments.', 'High', 'Document Owner', 'Document Owner', 'Document', 'DOC-DEMO-003', 'PID-DEMO-0003', '/documents/DOC-DEMO-003/comments', 0, NULL, '2026-01-06 05:01:00.000', '{"workflowStatus":"Process Comment"}'),
  ('NTF-DEMO-003', 'demo:document-approved:DOC-DEMO-007', 'PRJ-DEMO-001', 2, 'PMB-DEMO-002', 'Document Approved', 'Document Approved', 'PID-DEMO-0007 reached Final As-Built.', 'Normal', 'Document Owner', 'Document Owner', 'Document', 'DOC-DEMO-007', 'PID-DEMO-0007', '/documents/DOC-DEMO-007/history', 1, '2026-01-10 09:30:00.000', '2026-01-10 09:01:00.000', '{"workflowStatus":"Approved"}'),
  ('NTF-DEMO-004', 'demo:escalation-level-1:DOC-DEMO-003', 'PRJ-DEMO-001', 1, 'PMB-DEMO-001', 'Escalation Alert', 'Escalation Level 1', 'PID-DEMO-0003 is overdue and requires follow up.', 'High', 'Admin', 'Admin', 'Escalation', 'DOC-DEMO-003', 'PID-DEMO-0003', '/escalations', 0, NULL, '2026-01-10 05:30:00.000', '{"level":"Level 1","slaStatus":"Overdue"}'),
  ('NTF-DEMO-005', 'demo:escalation-level-2:DOC-DEMO-005', 'PRJ-DEMO-001', 1, 'PMB-DEMO-001', 'Escalation Alert', 'Escalation Level 2', 'PFD-DEMO-0005 has exceeded escalation threshold level 2.', 'High', 'Admin', 'Admin', 'Escalation', 'DOC-DEMO-005', 'PFD-DEMO-0005', '/escalations', 0, NULL, '2026-01-12 07:30:00.000', '{"level":"Level 2","slaStatus":"Overdue"}'),
  ('NTF-DEMO-006', 'demo:escalation-level-4:DOC-DEMO-006', 'PRJ-DEMO-001', 1, 'PMB-DEMO-001', 'Escalation Alert', 'Escalation Level 4', 'PFD-DEMO-0006 requires urgent management attention.', 'Critical', 'Admin', 'Admin', 'Escalation', 'DOC-DEMO-006', 'PFD-DEMO-0006', '/escalations', 0, NULL, '2026-01-14 08:30:00.000', '{"level":"Level 4","slaStatus":"Overdue"}'),
  ('NTF-DEMO-007', 'demo:archive-completed:DOC-DEMO-008', 'PRJ-DEMO-001', 2, 'PMB-DEMO-002', 'Archive Completed', 'Document Archived', 'PFD-DEMO-0008 has been archived by Admin.', 'Normal', 'Document Owner', 'Document Owner', 'Document', 'DOC-DEMO-008', 'PFD-DEMO-0008', '/documents/DOC-DEMO-008/history', 1, '2026-01-11 11:00:00.000', '2026-01-11 10:01:00.000', '{"lifecycle":"Archived"}'),
  ('NTF-DEMO-008', 'demo:restore-completed:DOC-DEMO-009', 'PRJ-DEMO-001', 2, 'PMB-DEMO-002', 'Restore Completed', 'Document Restored', 'PID-DEMO-0009 has been restored to Active lifecycle.', 'Normal', 'Document Owner', 'Document Owner', 'Document', 'DOC-DEMO-009', 'PID-DEMO-0009', '/documents/DOC-DEMO-009/history', 0, NULL, '2026-01-12 11:01:00.000', '{"lifecycle":"Active"}');

INSERT INTO audit_trail (
  id,
  identity_key,
  project_id,
  actor_user_id,
  actor_name,
  department,
  official_role,
  action,
  business_event,
  detail,
  resource_type,
  resource_id,
  reference,
  metadata,
  occurred_at,
  is_hidden,
  hidden_at,
  hidden_by_user_id
) VALUES
  ('AUD-DEMO-001', 'demo:audit:login:admin:2026-01-02T01:00:00Z', 'PRJ-DEMO-001', 1, 'Wahyu Trisna Setiadi', 'No Department', 'Admin', 'Login', 'User Login Success', 'Admin logged in to demo project.', 'Authentication', '1', 'wahyuts', '{"source":"seed-demo"}', '2026-01-02 01:00:00.000', 0, NULL, NULL),
  ('AUD-DEMO-002', 'demo:audit:create:DOC-DEMO-001', 'PRJ-DEMO-001', 2, 'Dina Saraswati', 'No Department', 'Document Owner', 'Upload Document', 'Document Uploaded', 'PFD-DEMO-0001 uploaded.', 'Document', 'DOC-DEMO-001', 'PFD-DEMO-0001', '{"workflowStatus":"Process Review"}', '2026-01-05 02:00:00.000', 0, NULL, NULL),
  ('AUD-DEMO-003', 'demo:audit:edit:DOC-DEMO-002', 'PRJ-DEMO-001', 2, 'Dina Saraswati', 'No Department', 'Document Owner', 'Edit Document', 'Document Updated', 'PFD-DEMO-0002 metadata updated before revision upload.', 'Document', 'DOC-DEMO-002', 'PFD-DEMO-0002', '{"area":"Area 110"}', '2026-01-08 03:30:00.000', 0, NULL, NULL),
  ('AUD-DEMO-004', 'demo:audit:approval-b:DOC-DEMO-003', 'PRJ-DEMO-001', 3, 'Rafi Pradana', 'No Department', 'Team Process', 'Approval B', 'Approval B Completed', 'Process team returned PID-DEMO-0003 with comment.', 'Document', 'DOC-DEMO-003', 'PID-DEMO-0003', '{"nextStatus":"Process Comment"}', '2026-01-06 05:00:00.000', 0, NULL, NULL),
  ('AUD-DEMO-005', 'demo:audit:approval-c:DOC-DEMO-004', 'PRJ-DEMO-001', 3, 'Rafi Pradana', 'No Department', 'Team Process', 'Approval C', 'Approval C Completed', 'Process team rejected PID-DEMO-0004.', 'Document', 'DOC-DEMO-004', 'PID-DEMO-0004', '{"nextStatus":"Process Reject"}', '2026-01-06 06:00:00.000', 0, NULL, NULL),
  ('AUD-DEMO-006', 'demo:audit:upload-revision:DOC-DEMO-002', 'PRJ-DEMO-001', 2, 'Dina Saraswati', 'No Department', 'Document Owner', 'Upload Revision', 'Revision Uploaded', 'PFD-DEMO-0002 revision uploaded and returned to Project Review.', 'Document', 'DOC-DEMO-002', 'PFD-DEMO-0002', '{"revision":"IFA-Submitted"}', '2026-01-08 04:00:00.000', 0, NULL, NULL),
  ('AUD-DEMO-007', 'demo:audit:approval-a:DOC-DEMO-007', 'PRJ-DEMO-001', 4, 'Maya Kartika', 'No Department', 'Team Project', 'Approval A', 'Approval A Completed', 'Project team approved PID-DEMO-0007.', 'Document', 'DOC-DEMO-007', 'PID-DEMO-0007', '{"nextStatus":"Approved"}', '2026-01-10 09:00:00.000', 0, NULL, NULL),
  ('AUD-DEMO-008', 'demo:audit:approved:DOC-DEMO-007', 'PRJ-DEMO-001', 4, 'Maya Kartika', 'No Department', 'Team Project', 'Document Approved', 'Document Approved', 'PID-DEMO-0007 reached Approved status.', 'Document', 'DOC-DEMO-007', 'PID-DEMO-0007', '{"revision":"AS-Built"}', '2026-01-10 09:00:01.000', 0, NULL, NULL),
  ('AUD-DEMO-009', 'demo:audit:archive:DOC-DEMO-008', 'PRJ-DEMO-001', 1, 'Wahyu Trisna Setiadi', 'No Department', 'Admin', 'Document Archived', 'Document Archived', 'PFD-DEMO-0008 archived.', 'Document', 'DOC-DEMO-008', 'PFD-DEMO-0008', '{"lifecycle":"Archived"}', '2026-01-11 10:00:00.000', 0, NULL, NULL),
  ('AUD-DEMO-010', 'demo:audit:restore:DOC-DEMO-009', 'PRJ-DEMO-001', 1, 'Wahyu Trisna Setiadi', 'No Department', 'Admin', 'Document Restored', 'Document Restored', 'PID-DEMO-0009 restored.', 'Document', 'DOC-DEMO-009', 'PID-DEMO-0009', '{"lifecycle":"Active"}', '2026-01-12 11:00:00.000', 0, NULL, NULL),
  ('AUD-DEMO-011', 'demo:audit:notification:DOC-DEMO-001', 'PRJ-DEMO-001', 2, 'Dina Saraswati', 'No Department', 'Document Owner', 'Notification Created', 'Notification Created', 'Approval request notification created.', 'Notification', 'NTF-DEMO-001', 'PFD-DEMO-0001', '{"recipient":"Team Process"}', '2026-01-05 02:01:00.000', 0, NULL, NULL),
  ('AUD-DEMO-012', 'demo:audit:escalation-level-1:DOC-DEMO-003', 'PRJ-DEMO-001', NULL, 'System', 'No Department', NULL, 'Escalation Created', 'Escalation Created', 'Level 1 escalation created for PID-DEMO-0003.', 'Escalation', 'DOC-DEMO-003', 'PID-DEMO-0003', '{"level":"Level 1","slaStatus":"Overdue"}', '2026-01-10 05:30:00.000', 0, NULL, NULL),
  ('AUD-DEMO-013', 'demo:audit:escalation-level-2:DOC-DEMO-005', 'PRJ-DEMO-001', NULL, 'System', 'No Department', NULL, 'Escalation Created', 'Escalation Created', 'Level 2 escalation created for PFD-DEMO-0005.', 'Escalation', 'DOC-DEMO-005', 'PFD-DEMO-0005', '{"level":"Level 2","slaStatus":"Overdue"}', '2026-01-12 07:30:00.000', 0, NULL, NULL),
  ('AUD-DEMO-014', 'demo:audit:escalation-level-3:DOC-DEMO-006', 'PRJ-DEMO-001', NULL, 'System', 'No Department', NULL, 'Escalation Created', 'Escalation Created', 'Level 3 escalation created for PFD-DEMO-0006.', 'Escalation', 'DOC-DEMO-006', 'PFD-DEMO-0006', '{"level":"Level 3","slaStatus":"Overdue"}', '2026-01-13 08:30:00.000', 0, NULL, NULL),
  ('AUD-DEMO-015', 'demo:audit:escalation-level-4:DOC-DEMO-006', 'PRJ-DEMO-001', NULL, 'System', 'No Department', NULL, 'Escalation Created', 'Escalation Created', 'Level 4 escalation created for PFD-DEMO-0006.', 'Escalation', 'DOC-DEMO-006', 'PFD-DEMO-0006', '{"level":"Level 4","slaStatus":"Overdue"}', '2026-01-14 08:30:00.000', 0, NULL, NULL);

COMMIT;
