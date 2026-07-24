# SCHEMA GENERATION REPORT

## Executive Summary

Phase: EDMS Rebuild Phase 1.3 — Generate Database Schema

Output generated:

- `database/schema/schema.sql`
- `docs/architecture/SCHEMA-GENERATION-REPORT.md`

Schema target:

- MySQL
- InnoDB
- `utf8mb4`
- `utf8mb4_unicode_ci`

## Generation Metrics

| Metric | Count |
|---|---:|
| Table | 23 |
| Lookup Table | 4 |
| Junction Table | 2 |
| Foreign Key | 56 |
| UNIQUE Constraint / Unique Key | 20 |
| INDEX / Non-Unique Key | 72 |
| CHECK Constraint | 40 *(Runtime Verified)* |
| VIEW | 0 |

## Table Inventory

Production tables generated:

1. `departments`
2. `roles`
3. `permissions`
4. `document_types`
5. `users`
6. `role_permissions`
7. `user_credentials`
8. `password_reset_tokens`
9. `refresh_sessions`
10. `projects`
11. `project_memberships`
12. `user_project_preferences`
13. `engineering_documents`
14. `stored_files`
15. `document_revisions`
16. `workflow_comments`
17. `workflow_attachments`
18. `document_history`
19. `comment_read_receipts`
20. `document_sla_evaluations`
21. `notifications`
22. `audit_trail`
23. `system_metadata`

Non-production `mock_emails` was not generated because `DATABASE-SCHEMA.md` marks it as development/testing only.

## Lookup Tables

- `roles`
- `permissions`
- `departments`
- `document_types`

## Junction Tables

- `role_permissions`
- `project_memberships`

`project_memberships` is both an operational project access table and a user-project-role junction table.

## Circular Dependency Handling

Approved decisions applied:

- DDD-012: `engineering_documents.active_revision_id` may form a conceptual circular reference.
- DDD-013: `engineering_documents.active_file_id` uses the same strategy.

DDL handling:

1. `engineering_documents` is created first with nullable `active_revision_id` and `active_file_id`.
2. `stored_files` is created with FK to `engineering_documents`.
3. `document_revisions` is created with FK to `engineering_documents` and `stored_files`.
4. `ALTER TABLE engineering_documents` adds FK constraints to `document_revisions` and `stored_files`.

Runtime insert/update handling remains the approved business-service transaction pattern:

```text
INSERT document
-> INSERT stored file
-> INSERT revision
-> UPDATE document active_revision_id and active_file_id
```

No entity redesign was performed.

## Validation Summary

Schema validation performed against:

- `BUSINESS-WORKFLOW.md`
- Validated Frontend source evidence
- `docs/source-of-truth/`
- `docs/architecture/DATABASE-SCHEMA.md`
- `docs/architecture/DATABASE-DESIGN-DECISIONS.md`
- `API-CONTRACT.md`
- `ACCESS-CONTROL.md`
- `FORM-SPEC.md`

Validation results:

| Area | Result |
|---|---|
| Duplicate table | Passed |
| Duplicate column | Passed |
| Missing approved lookup table | Passed |
| Missing approved junction table | Passed |
| Missing FK for approved relationship | Passed |
| Missing UNIQUE for approved uniqueness | Passed |
| Missing index from approved index strategy | Passed |
| Missing CHECK for fixed business catalog | Passed |
| Forbidden DML statement | Passed |
| Seeder/dummy data | Passed |
| Stored procedure / trigger / scheduler | Passed |
| View generation | Not applicable |

## Compatibility

| Baseline | Status |
|---|---|
| Business Workflow | Compatible |
| Validated Frontend | Compatible |
| Source of Truth | Compatible |
| `DATABASE-SCHEMA.md` | Compatible |
| `DATABASE-DESIGN-DECISIONS.md` | Compatible |
| API Contract | Compatible |
| Access Control | Compatible |
| Storage Strategy | Compatible |

## Runtime Validation

Runtime validation was successfully performed using a real MariaDB instance.

### Environment

| Item | Value |
|------|-------|
| Database Engine | MariaDB |
| Version | 10.4.32 |
| Storage Engine | InnoDB |
| Character Set | utf8mb4 |
| Collation | utf8mb4_unicode_ci |

### Runtime Verification

| Validation | Status |
|------------|--------|
| Schema Import | ✅ Passed |
| Production Tables | ✅ 23 Created |
| Foreign Keys | ✅ Verified |
| Indexes | ✅ Verified |
| CHECK Constraints | ✅ Verified |
| Runtime Errors | ✅ None |

### CHECK Constraint Verification

Runtime query executed successfully against:

information_schema.CHECK_CONSTRAINTS

Result:

```text
Total CHECK Constraint = 40
```
Runtime verification is considered authoritative and supersedes the static generation count reported during schema generation.

Runtime Verdict

DATABASE SCHEMA VERIFIED ON MARIADB

Status:

PASSED

## Implementation Notes

- `document_types` was generated as an approved lookup table according to DDD-004.
- No `workflow`, `workflow_transition`, or `workflow_master` table was generated according to DDD-005.
- `document_history` is the official workflow history table according to DDD-006.
- `stored_files` is the official storage repository table according to DDD-007.
- `document_revisions.revision_sequence` was generated according to DDD-008.
- `engineering_documents.current_assignee_user_id` was generated and indexed according to DDD-009 and DDD-014.
- Timeline index `document_history(project_id, document_id, created_at)` was generated according to DDD-015.
- Search-supporting indexes were generated for document register fields available in the approved schema.
- `mock_emails` was excluded from production schema.
- No seed data was generated.

## Final Verdict

SCHEMA GENERATION COMPLETED

Runtime Validation:

PASSED

Database Engine:

MariaDB 10.4.32

Overall Status:

DATABASE SCHEMA VERIFIED

READY FOR SEED GENERATION
