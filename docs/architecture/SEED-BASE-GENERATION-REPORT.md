# SEED-BASE-GENERATION-REPORT

## Executive Summary

Phase: EDMS Rebuild Phase 1.4 — Generate Seed Base

Output generated:

- `database/seed/seed-base.sql`
- `docs/architecture/SEED-BASE-GENERATION-REPORT.md`

Seed-base dibuat sebagai baseline minimum untuk Development, Staging, dan Production. Seed ini tidak berisi data demo dan tidak mengisi tabel transaksi.

## Seed Inventory

| Category | Table | Count |
|---|---|---:|
| Department | `departments` | 1 |
| Role | `roles` | 4 |
| Permission | `permissions` | 20 |
| Role Permission | `role_permissions` | 56 |
| Document Type | `document_types` | 2 |
| User | `users` | 1 |
| Credential | `user_credentials` | 1 |
| System Metadata | `system_metadata` | 3 |

## Department

| Name | Status |
|---|---|
| No Department | Active |

## Roles

| Role Code | Role Name |
|---|---|
| ROLE-ADMIN | Admin |
| ROLE-DOCUMENT-OWNER | Document Owner |
| ROLE-TEAM-PROCESS | Team Process |
| ROLE-TEAM-PROJECT | Team Project |

## Permissions

Seed menggunakan permission resmi dari `ACCESS-CONTROL.md` Phase 2 Source of Truth Synchronization:

- `dashboard.view`
- `document-register.view`
- `document-register.create`
- `document-register.edit`
- `document-register.archive`
- `document-register.upload`
- `document-register.download`
- `approval.a`
- `approval.b`
- `approval.c`
- `transmittal.incoming`
- `transmittal.outgoing`
- `sla-monitoring.view`
- `escalation.view`
- `audit-trail.view`
- `storage.view`
- `notifications.view`
- `profile.view`
- `password.change`
- `user-management.view`

Historical/mock-only permissions such as `transmittal.view`, `profile.edit`, and `auth.logout` were not seeded because they are not listed in the latest official runtime permission catalog.

"document-register.upload disertakan dalam permission catalog karena masih merupakan Reserved / Historical Reference sesuai ACCESS-CONTROL.md. Permission ini bukan runtime gate untuk fitur Upload Revision."

## Role Permission

| Role | Mapping Summary |
|---|---|
| Admin | All 20 official runtime/reserved permissions |
| Document Owner | Dashboard, Document Register view/create/edit/upload/download, SLA, Escalation, Audit Trail, Notification, Profile, Change Password |
| Team Process | Dashboard, Document Register view/download, Approval A/B/C, SLA, Escalation, Audit Trail, Notification, Profile, Change Password |
| Team Project | Dashboard, Document Register view/download, Approval A/B/C, SLA, Escalation, Audit Trail, Notification, Profile, Change Password |

## Document Type

| Code | Name | Drawing Context | Status |
|---|---|---|---|
| PFD | PFD | PFD | Active |
| PID | P&ID | P&ID | Active |

## Admin Bootstrap

| Field | Value |
|---|---|
| User Code | USR-000001 |
| Username | wahyuts |
| Full Name | Wahyu Trisna Setiadi |
| Email | wahyu.trisna100@gmail.com |
| Department | No Department |
| Position | EDMS Admin |
| Role | Admin |
| Status | Active |
| Created At | 2026-01-01 00:00:00 UTC |

Credential bootstrap disimpan sebagai bcrypt hash. Password hash tidak ditampilkan di report.

## Runtime Validation

MariaDB/MySQL execution validation was not performed because no local `mysql`, MariaDB client/server, or Docker runtime is available in the current environment.

Static validation performed:

| Validation | Result |
|---|---|
| Explicit column list | Passed |
| FK dependency insertion order | Passed |
| Unique values | Passed |
| CHECK-compatible values | Passed |
| `START TRANSACTION` and `COMMIT` present | Passed |
| `INSERT IGNORE` absent | Passed |
| `REPLACE` absent | Passed |
| `SET foreign_key_checks = 0` absent | Passed |
| Stored procedure absent | Passed |
| Trigger absent | Passed |
| Event scheduler absent | Passed |
| Plaintext password absent | Passed |
| bcrypt hash present | Passed |
| bcrypt hash verifies bootstrap credential | Passed |
| Transaction tables not seeded | Passed |

## Transaction Table Exclusion

The following tables are intentionally not seeded:

- `projects`
- `project_memberships`
- `user_project_preferences`
- `engineering_documents`
- `stored_files`
- `document_revisions`
- `workflow_comments`
- `workflow_attachments`
- `document_history`
- `comment_read_receipts`
- `document_sla_evaluations`
- `notifications`
- `audit_trail`
- `refresh_sessions`
- `password_reset_tokens`
- `mock_emails`

## Compatibility

| Baseline | Status |
|---|---|
| Business Workflow | Compatible |
| Validated Frontend | Compatible |
| Source of Truth | Compatible |
| ENGINEERING-FOUNDATION.md | Compatible |
| DATABASE-SCHEMA.md | Compatible |
| DATABASE-DESIGN-DECISIONS.md | Compatible |
| schema.sql | Compatible |
| API Contract | Compatible |
| Access Control | Compatible |

## Final Verdict

SEED BASE GENERATION COMPLETED
