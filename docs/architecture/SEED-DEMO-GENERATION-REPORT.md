# SEED-DEMO-GENERATION-REPORT

## Executive Summary

Phase: EDMS Rebuild Phase 1.5 — Generate Seed Demo

Output generated:

- `database/seed/seed-demo.sql`
- `docs/architecture/SEED-DEMO-GENERATION-REPORT.md`

Seed demo dibuat khusus untuk Development, QA, dan Demo Internal. Seed ini tidak ditujukan untuk Production.

Dataset menggunakan baseline:

```text
schema.sql
-> seed-base.sql
-> seed-demo.sql
```

## Dataset Inventory

| Table | Count |
|---|---:|
| `users` | 3 demo users |
| `user_credentials` | 3 demo credentials |
| `projects` | 1 |
| `project_memberships` | 4 |
| `user_project_preferences` | 4 |
| `engineering_documents` | 9 |
| `stored_files` | 12 |
| `document_revisions` | 10 |
| `workflow_comments` | 4 |
| `workflow_attachments` | 2 |
| `document_history` | 14 |
| `comment_read_receipts` | 3 |
| `document_sla_evaluations` | 9 |
| `notifications` | 8 |
| `audit_trail` | 15 |

Seed demo assumes `seed-base.sql` has already inserted:

- `No Department`
- Official roles
- Official permissions
- Role-permission catalog
- `PFD` and `P&ID`
- Bootstrap Admin

## User And Membership Coverage

| Role | User |
|---|---|
| Admin | `wahyuts` from seed-base |
| Document Owner | `docowner.demo` |
| Team Process | `process.demo` |
| Team Project | `project.demo` |

All four users are active members of `PRJ-DEMO-001`.

## Workflow Coverage

| Coverage | Document |
|---|---|
| Process Review | `DOC-DEMO-001` |
| Project Review | `DOC-DEMO-002` |
| Process Comment | `DOC-DEMO-003` |
| Process Reject | `DOC-DEMO-004` |
| Project Comment | `DOC-DEMO-005` |
| Project Reject | `DOC-DEMO-006` |
| Approved Active | `DOC-DEMO-007` |
| Archived Document | `DOC-DEMO-008` |
| Restored Document | `DOC-DEMO-009` |
| Upload Revision | `DOC-DEMO-002` |
| Approval B Comment | `DOC-DEMO-003`, `DOC-DEMO-005` |
| Approval C Comment | `DOC-DEMO-004`, `DOC-DEMO-006` |
| Workflow Attachment | `DOC-DEMO-003`, `DOC-DEMO-005` |

Lifecycle path represented:

```text
Create
-> Review
-> Comment
-> Revision
-> Approved
-> Archive
-> Restore
```

## SLA Coverage

| SLA State | Document |
|---|---|
| On Track | `DOC-DEMO-001` |
| At Risk | `DOC-DEMO-002` |
| Overdue | `DOC-DEMO-003`, `DOC-DEMO-004`, `DOC-DEMO-005`, `DOC-DEMO-006` |
| Final As-Built | `DOC-DEMO-007`, `DOC-DEMO-008`, `DOC-DEMO-009` |

The user-facing display wording `Done` is represented by database/API value `Final As-Built`, following `API-CONTRACT.md`.

## Escalation Coverage

Escalation level is derived from SLA and stored as notification/audit metadata for demo observability.

| Level | Evidence |
|---|---|
| Level 1 | `DOC-DEMO-003` notification and audit |
| Level 2 | `DOC-DEMO-005` notification and audit |
| Level 3 | `DOC-DEMO-006` audit |
| Level 4 | `DOC-DEMO-006` notification and audit |

## Notification Coverage

Notification examples:

- Approval Request
- Comment Added
- Document Approved
- Escalation Alert
- Archive Completed
- Restore Completed

## Audit Coverage

Audit examples:

- Login
- Upload Document
- Edit Document
- Approval A
- Approval B
- Approval C
- Upload Revision
- Document Approved
- Archive
- Restore
- Notification Created
- Escalation Created

## Runtime Validation

MariaDB/MySQL execution validation was not performed because no local `mysql`, MariaDB client/server, or Docker runtime is available in the current environment.

Static validation performed:

| Validation | Result |
|---|---|
| Explicit column list | Passed |
| FK dependency insertion order | Passed |
| Circular active file/revision handled with approved update pattern | Passed |
| Document types limited to PFD and P&ID | Passed |
| Workflow statuses use approved values | Passed |
| Lifecycle statuses use approved values | Passed |
| Revision labels use approved values | Passed |
| SLA states use approved values | Passed |
| Escalation levels represented without schema redesign | Passed |
| Stored file metadata only, no binary file | Passed |
| `START TRANSACTION` and `COMMIT` present | Passed |
| `INSERT IGNORE` absent | Passed |
| `REPLACE` absent | Passed |
| `SET foreign_key_checks = 0` absent | Passed |
| Trigger absent | Passed |
| Procedure absent | Passed |
| Event scheduler absent | Passed |

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
| seed-base.sql | Compatible |

## Final Verdict

SEED DEMO GENERATION COMPLETED
