# DATABASE-VALIDATION-REPORT

## 1. Executive Summary

Phase: EDMS Rebuild Phase 1.6 — Database Validation & Import Test

Artefak divalidasi:

- `database/schema/schema.sql`
- `database/seed/seed-base.sql`
- `database/seed/seed-demo.sql`

Hasil:

- Static validation: PASSED
- Runtime import validation: NOT EXECUTED — RUNTIME UNAVAILABLE
- Conflict report: Not generated
- Silent modification: Not performed
- `seed-staging.sql`: Not generated, following official roadmap decision

Final verdict:

DATABASE STATIC VALIDATION PASSED — RUNTIME VALIDATION PENDING

## 2. Validation Scope

Validation scope mencakup:

- Struktur SQL schema
- Seed base bootstrap/master data
- Seed demo operational data
- Record count reconciliation
- Foreign key dependency review
- Unique constraint review
- CHECK-compatible value review
- Workflow coverage
- Document lifecycle coverage
- SLA coverage
- Escalation coverage
- Notification coverage
- Audit trail coverage
- Security and bcrypt validation
- Staging bootstrap scenario

## 3. Environment

| Item | Value |
|---|---|
| Database Engine | MySQL/MariaDB runtime not available |
| Database Version | NOT EXECUTED — RUNTIME UNAVAILABLE |
| Runtime Availability | Unavailable: no `mysql`, `mariadb`, or Docker runtime found |
| Operating Environment | Windows PowerShell workspace |
| Validation Date | 2026-07-22 16:23:12 +07:00 |
| Validation Mode | Static Validation Fallback |

Runtime import was not executed. This report does not claim successful database import.

## 4. Artifact Inventory

| Artifact | Status |
|---|---|
| `database/schema/schema.sql` | Present |
| `database/seed/seed-base.sql` | Present |
| `database/seed/seed-demo.sql` | Present |
| `docs/architecture/SCHEMA-GENERATION-REPORT.md` | Present |
| `docs/architecture/SEED-BASE-GENERATION-REPORT.md` | Present |
| `docs/architecture/SEED-DEMO-GENERATION-REPORT.md` | Present |

## 5. Schema Validation

Static schema validation result:

| Validation | Expected | Static Actual | Status |
|---|---:|---:|---|
| Table count | 23 | 23 | PASSED |
| Foreign key declarations | Available | 56 | PASSED |
| Unique key declarations | Available | 20 | PASSED |
| CHECK constraints | Available | 36 | PASSED |
| InnoDB engine usage | Required | Present | PASSED |
| `utf8mb4` charset | Required | Present | PASSED |
| Trigger | Must not exist | Not found | PASSED |
| Stored procedure | Must not exist | Not found | PASSED |
| Event scheduler | Must not exist | Not found | PASSED |
| `foreign_key_checks = 0` | Must not exist | Not found | PASSED |
| Unsupported runtime syntax | Runtime unavailable | NOT EXECUTED | PENDING |

Schema import result:

NOT EXECUTED — RUNTIME UNAVAILABLE

## 6. Seed Base Validation

Static seed-base validation result:

| Validation | Expected | Static Actual | Status |
|---|---:|---:|---|
| Departments | 1 | 1 | PASSED |
| Roles | 4 | 4 | PASSED |
| Permissions | 20 | 20 | PASSED |
| Role permissions | 56 | 56 | PASSED |
| Document types | 2 | 2 | PASSED |
| Bootstrap users | 1 | 1 | PASSED |
| Bootstrap credentials | 1 | 1 | PASSED |
| System metadata | 3 | 3 | PASSED |
| `START TRANSACTION` | Required | Present | PASSED |
| `COMMIT` | Required | Present | PASSED |
| Explicit column list | Required | Present | PASSED |
| Transaction table exclusion | Required | No transaction table insert found | PASSED |

Bootstrap user validation:

| Field | Expected | Static Actual | Status |
|---|---|---|---|
| User Code | `USR-000001` | `USR-000001` | PASSED |
| Username | `wahyuts` | `wahyuts` | PASSED |
| Role | Admin | Admin via `role_id = 1` | PASSED |
| Department | No Department | `department_id = 1` / No Department | PASSED |
| Status | Active | Active | PASSED |

Seed-base import result:

NOT EXECUTED — RUNTIME UNAVAILABLE

## 7. Seed Demo Validation

Static seed-demo validation result:

| Validation | Expected | Static Actual | Status |
|---|---:|---:|---|
| Demo users | 3 | 3 | PASSED |
| Demo credentials | 3 | 3 | PASSED |
| Projects | 1 | 1 | PASSED |
| Project memberships | 4 | 4 | PASSED |
| User project preferences | 4 | 4 | PASSED |
| Engineering documents | 9 | 9 | PASSED |
| Stored files | 12 | 12 | PASSED |
| Document revisions | 10 | 10 | PASSED |
| Workflow comments | 4 | 4 | PASSED |
| Workflow attachments | 2 | 2 | PASSED |
| Document history | 14 | 14 | PASSED |
| Comment read receipts | 3 | 3 | PASSED |
| Document SLA evaluations | 9 | 9 | PASSED |
| Notifications | 8 | 8 | PASSED |
| Audit trail | 15 | 15 | PASSED |
| `START TRANSACTION` | Required | Present | PASSED |
| `COMMIT` | Required | Present | PASSED |
| Approved active file/revision update pattern | Required | Present | PASSED |

Seed-demo import result:

NOT EXECUTED — RUNTIME UNAVAILABLE

Seed demo classification:

`seed-demo.sql` is a simulated database dataset for Development, QA, and Internal Demo. It is not a full mirror or migration of the complete frontend IndexedDB dataset. This is a known classification note and not a validation failure.

## 8. Record Count Reconciliation

| Table | Expected Base | Expected Demo | Expected Final | Actual | Status |
|---|---:|---:|---:|---|---|
| `departments` | 1 | 0 | 1 | Static: 1 | PASSED |
| `roles` | 4 | 0 | 4 | Static: 4 | PASSED |
| `permissions` | 20 | 0 | 20 | Static: 20 | PASSED |
| `role_permissions` | 56 | 0 | 56 | Static: 56 | PASSED |
| `document_types` | 2 | 0 | 2 | Static: 2 | PASSED |
| `users` | 1 | 3 | 4 | Static: 4 | PASSED |
| `user_credentials` | 1 | 3 | 4 | Static: 4 | PASSED |
| `system_metadata` | 3 | 0 | 3 | Static: 3 | PASSED |
| `projects` | 0 | 1 | 1 | Static: 1 | PASSED |
| `project_memberships` | 0 | 4 | 4 | Static: 4 | PASSED |
| `user_project_preferences` | 0 | 4 | 4 | Static: 4 | PASSED |
| `engineering_documents` | 0 | 9 | 9 | Static: 9 | PASSED |
| `stored_files` | 0 | 12 | 12 | Static: 12 | PASSED |
| `document_revisions` | 0 | 10 | 10 | Static: 10 | PASSED |
| `workflow_comments` | 0 | 4 | 4 | Static: 4 | PASSED |
| `workflow_attachments` | 0 | 2 | 2 | Static: 2 | PASSED |
| `document_history` | 0 | 14 | 14 | Static: 14 | PASSED |
| `comment_read_receipts` | 0 | 3 | 3 | Static: 3 | PASSED |
| `document_sla_evaluations` | 0 | 9 | 9 | Static: 9 | PASSED |
| `notifications` | 0 | 8 | 8 | Static: 8 | PASSED |
| `audit_trail` | 0 | 15 | 15 | Static: 15 | PASSED |
| `refresh_sessions` | 0 | 0 | 0 | Static: 0 | PASSED |
| `password_reset_tokens` | 0 | 0 | 0 | Static: 0 | PASSED |

Runtime actual counts:

NOT EXECUTED — RUNTIME UNAVAILABLE

## 9. Constraint Validation

### Foreign Key

Runtime orphan detection queries:

NOT EXECUTED — RUNTIME UNAVAILABLE

Static dependency validation:

| Relationship | Static Status |
|---|---|
| `users -> departments` | PASSED |
| `users -> roles` | PASSED |
| `user_credentials -> users` | PASSED |
| `project_memberships -> projects` | PASSED |
| `project_memberships -> users` | PASSED |
| `project_memberships.official_role -> official role catalog` | PASSED |
| `user_project_preferences -> users` | PASSED |
| `user_project_preferences -> projects` | PASSED |
| `engineering_documents -> projects` | PASSED |
| `engineering_documents -> document_types` | PASSED |
| `engineering_documents -> users` | PASSED |
| `stored_files -> engineering_documents` | PASSED |
| `document_revisions -> engineering_documents` | PASSED |
| `document_revisions -> stored_files` | PASSED |
| `workflow_comments -> engineering_documents` | PASSED |
| `workflow_attachments -> workflow_comments` | PASSED |
| `document_history -> engineering_documents` | PASSED |
| `comment_read_receipts -> workflow_comments` | PASSED |
| `document_sla_evaluations -> engineering_documents` | PASSED |
| `notifications -> users` | PASSED |
| `audit_trail -> users` | PASSED for non-system actor rows; system rows use nullable actor by design |

Note:

`project_memberships` does not have a physical FK to `roles` in the approved schema. The approved model stores project official role as `project_memberships.official_role` with CHECK constraint, while system authorization role is stored separately as `users.role_id`. Static validation therefore checks official role values against the official role catalog rather than inventing a new FK.

### Unique

Runtime duplicate queries:

NOT EXECUTED — RUNTIME UNAVAILABLE

Static unique validation:

- `user_code`: no duplicate in seed files
- `username`: no duplicate in seed files
- `email`: no duplicate in seed files
- `role_code`: no duplicate in seed-base
- `permission_code`: no duplicate in seed-base
- `department.name_key`: no duplicate in seed-base
- `project_code`: no duplicate in seed-demo
- `document_number` scoped to project: no duplicate in seed-demo
- `document_type_code`: no duplicate in seed-base
- `document_revisions(document_id, revision_sequence)`: no duplicate in seed-demo
- `system_metadata.key`: no duplicate in seed-base

Status: PASSED

### Check

Runtime CHECK enforcement:

NOT EXECUTED — RUNTIME UNAVAILABLE

Static CHECK-compatible value validation:

- User status: PASSED
- Role active flag: PASSED
- Department status: PASSED
- Project status: PASSED
- Membership status: PASSED
- Official role values: PASSED
- Workflow status values: PASSED
- Lifecycle values: PASSED
- Revision labels: PASSED
- SLA states: PASSED
- Notification priority/read values: PASSED
- Audit hidden flag: PASSED
- Boolean-compatible values: PASSED
- Non-negative numeric values: PASSED

### Index

Schema statically declares index coverage for:

- `username`
- `email`
- `project_code`
- project status
- workflow status
- `current_assignee_user_id`
- `document_number`
- `revision_sequence`
- `storage_key`
- notification identity
- audit identity
- timeline history

Runtime index inspection:

NOT EXECUTED — RUNTIME UNAVAILABLE

## 10. Workflow Validation

Static workflow coverage:

| Required State | Evidence |
|---|---|
| Process Review | `DOC-DEMO-001` |
| Project Review | `DOC-DEMO-002` |
| Process Comment | `DOC-DEMO-003` |
| Process Reject | `DOC-DEMO-004` |
| Project Comment | `DOC-DEMO-005` |
| Project Reject | `DOC-DEMO-006` |
| Approved | `DOC-DEMO-007`, `DOC-DEMO-008`, `DOC-DEMO-009` |

Status values are limited to approved schema and Source of Truth values.

Status: PASSED

## 11. Document Lifecycle Validation

Static lifecycle coverage:

| Required Lifecycle / Relation | Evidence |
|---|---|
| Active document | `DOC-DEMO-001` through `DOC-DEMO-007`, `DOC-DEMO-009` |
| Approved document | `DOC-DEMO-007`, `DOC-DEMO-008`, `DOC-DEMO-009` |
| Archived document | `DOC-DEMO-008` |
| Restored document | `DOC-DEMO-009` |
| Upload Revision | `DOC-DEMO-002` with `REV-DEMO-002A` and `REV-DEMO-002` |
| Active revision | One active revision per demo document |
| Active stored file | Active file pointer updated for each demo document |
| Revision history | `document_revisions` includes superseded and active revision for `DOC-DEMO-002` |
| Document history | 14 records in `document_history` |

Circular dependency handling:

- Documents are inserted with `active_revision_id` and `active_file_id` as `NULL`.
- Stored files and revisions are inserted.
- `engineering_documents` is updated to point to the active revision and active file.

Static relation review found no active revision or active file intentionally pointing to another document.

Status: PASSED

## 12. SLA Validation

Static SLA coverage:

| Required SLA State | Evidence |
|---|---|
| On Track | `SLA-DEMO-001` / `DOC-DEMO-001` |
| At Risk | `SLA-DEMO-002` / `DOC-DEMO-002` |
| Overdue | `SLA-DEMO-003` through `SLA-DEMO-006` |
| Final As-Built | `SLA-DEMO-007` through `SLA-DEMO-009` |

Notes:

- `Done` is not used as a database/API enum value.
- Approved documents use `Final As-Built`, following `API-CONTRACT.md`.
- SLA rows are demo snapshots and not a runtime recalculation result.

Status: PASSED

## 13. Escalation Validation

Escalation is not stored as permanent workflow state on `engineering_documents`.

Static escalation evidence:

| Level | Evidence |
|---|---|
| Level 1 | Notification/audit metadata for `DOC-DEMO-003` |
| Level 2 | Notification/audit metadata for `DOC-DEMO-005` |
| Level 3 | Audit metadata for `DOC-DEMO-006` |
| Level 4 | Notification/audit metadata for `DOC-DEMO-006` |

No escalation table or column was added.

Status: PASSED

## 14. Notification Validation

Static notification coverage:

| Required Notification | Evidence |
|---|---|
| Approval Request | `NTF-DEMO-001` |
| Comment Added | `NTF-DEMO-002` |
| Document Approved | `NTF-DEMO-003` |
| Escalation Alert | `NTF-DEMO-004`, `NTF-DEMO-005`, `NTF-DEMO-006` |
| Archive Completed | `NTF-DEMO-007` |
| Restore Completed | `NTF-DEMO-008` |

Static relation review:

- Recipients reference valid seeded users.
- Recipient project memberships reference valid demo memberships.
- Project references use `PRJ-DEMO-001`.
- Related document references point to demo document identifiers.
- Read/unread values are boolean-compatible.

Runtime orphan query result:

NOT EXECUTED — RUNTIME UNAVAILABLE

Status: PASSED statically

## 15. Audit Trail Validation

Static audit coverage:

| Required Audit Event | Evidence |
|---|---|
| Login | `AUD-DEMO-001` |
| Upload Document | `AUD-DEMO-002` |
| Edit Document | `AUD-DEMO-003` |
| Approval A | `AUD-DEMO-007` |
| Approval B | `AUD-DEMO-004` |
| Approval C | `AUD-DEMO-005` |
| Upload Revision | `AUD-DEMO-006` |
| Document Approved | `AUD-DEMO-008` |
| Archive | `AUD-DEMO-009` |
| Restore | `AUD-DEMO-010` |
| Notification Created | `AUD-DEMO-011` |
| Escalation Created | `AUD-DEMO-012` through `AUD-DEMO-015` |

Static relation review:

- User actor rows reference valid seeded users.
- System-generated escalation rows use nullable `actor_user_id`, which is allowed by schema.
- Metadata is JSON literal.
- Audit trail is used as evidence/history, not as replacement for business state.

Status: PASSED statically

## 16. Security Validation

| Validation | Result |
|---|---|
| Bootstrap credential stored as bcrypt hash | PASSED |
| Bootstrap bcrypt prefix compatible | PASSED |
| Bootstrap bcrypt cost factor = 12 | PASSED |
| Bootstrap bcrypt verifies official credential | PASSED |
| Demo credentials stored as bcrypt hash | PASSED |
| Demo bcrypt prefix compatible | PASSED |
| Demo bcrypt cost factor = 12 | PASSED |
| Demo bcrypt verifies demo credential | PASSED |
| Plaintext password in schema/seed/report | Not found |
| JWT secret/API key/database credential in seed | Not found |
| Alternative hash algorithm in credential seed | Not found |

Bcrypt Verification: PASSED

Password hashes are not shown in this report.

## 17. Staging Bootstrap Validation

Official roadmap decision:

`seed-staging.sql` is not created.

Staging/UAT bootstrap flow:

```text
schema.sql
-> seed-base.sql
```

Static staging validation:

| Expected | Static Result |
|---|---|
| Schema creates 23 tables | PASSED |
| Master data available | PASSED |
| Bootstrap Admin available | PASSED |
| Transaction tables empty after seed-base | PASSED |
| No demo data after seed-base | PASSED |
| Staging ready to receive data through application/backend | PASSED statically |

Runtime staging import:

NOT EXECUTED — RUNTIME UNAVAILABLE

## 18. Known Limitations

- Runtime import validation was not performed because MySQL/MariaDB runtime is unavailable.
- Orphan detection queries were not executed; FK integrity was reviewed statically from insert order and references.
- Unique duplicate queries were not executed; duplicate review was performed statically from seed values.
- CHECK enforcement was not executed by database runtime; CHECK-compatible values were reviewed statically.
- Negative transaction rollback test was not executed.
- Repeatability fresh import test was not executed.
- `seed-demo.sql` is a simulated database dataset for Development, QA, and Internal Demo.
- `seed-demo.sql` is not a full mirror or migration of the complete frontend IndexedDB dataset.

## 19. Compatibility

| Baseline | Status |
|---|---|
| Business Workflow | Compatible |
| Validated Frontend | Compatible |
| Source of Truth | Compatible |
| ENGINEERING-FOUNDATION.md | Compatible |
| DATABASE-SCHEMA.md | Compatible |
| DATABASE-DESIGN-DECISIONS.md | Compatible |
| schema.sql | Compatible |
| seed-base.sql | Compatible |
| seed-demo.sql | Compatible |
| API Contract | Compatible |
| Access Control | Compatible |

## 20. Final Verdict

DATABASE STATIC VALIDATION PASSED — RUNTIME VALIDATION PENDING
