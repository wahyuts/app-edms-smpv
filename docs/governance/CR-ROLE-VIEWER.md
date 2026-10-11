# CR-ROLE-VIEWER

Document Status: DEVELOPMENT IMPLEMENTATION COMPLETE / DEVELOPMENT UAT PASSED / RAILWAY DEVELOPMENT DATABASE MIGRATED MANUALLY / APPLICATION DEPLOYMENT PENDING

Date: 2026-10-11

Scope: Official Role Viewer documentation alignment, migration preparation, development implementation status, and pre-deployment readiness tracking.

---

# 1. Purpose

Dokumen ini mencatat perubahan Source of Truth, rancangan database migration, status implementasi development, dan kesiapan pre-deployment untuk penambahan Official Role `Viewer`.

Dokumen ini bukan approval untuk menjalankan SQL pada staging/Railway/production dan bukan bukti online deployment.

Execution status:

- Development Migration Executed: YES
- Development Seed Executed: YES
- Development Database Modified: YES
- Backend Runtime Modified: YES
- Frontend Runtime Modified: YES
- Static Authorization Verification: COMPLETE
- Development Manual UAT: SUCCESS
- Pre-Deployment Readiness: READY WITH CONDITIONS
- Railway Development Migration Executed Manually: YES
- Railway Development Seed Executed: NO
- Railway Development system_metadata Updated: NO
- Deployment Modified: NO
- Application Deployment: NOT STARTED

Railway Development manual migration record:

- Connection: EDMS Development.
- Database: `railway`.
- Database Engine: MySQL Community Server 9.7.2.
- Execution method: manual SQL execution through DBeaver.
- Migration status: SUCCESS - Database Verification PASS.
- Viewer role: `ROLE-VIEWER`, id `5`, Active.
- Viewer permission mappings: `9`.
- Total permission mappings after migration: `65`.
- Existing role permission counts remain Admin `20`, Document Owner `12`, Team Process `12`, Team Project `12`.
- Updated CHECK constraints: `6` of `6`.
- `engineering_documents.responsible_role` was not changed.
- `engineering_documents`, `system_metadata`, and existing four-role permission mappings were not changed.

Railway Development reconciliation note:

The canonical repository migration files remain the source for fresh database setup and other environments. They include `system_metadata` updates by design. Railway Development was migrated manually without `system_metadata` changes, so the canonical migration must not be rerun blindly against Railway Development. Any future execution against Railway Development requires explicit approval and a dedicated reconciliation plan.

---

# 2. Viewer Access Matrix v1.0

| Module / Action | Viewer |
|---|---|
| Dashboard View | ALLOWED |
| Document Register View | ALLOWED |
| Document View | ALLOWED |
| Document Download | ALLOWED |
| Comment Read | ALLOWED |
| History Read | ALLOWED |
| Attachment View | ALLOWED |
| Attachment Download | ALLOWED |
| Document Create | NOT ALLOWED |
| Document Edit | NOT ALLOWED |
| Document Delete | NOT ALLOWED |
| Document Archive/Restore | NOT ALLOWED |
| Revision Upload/Delete | NOT ALLOWED |
| Workflow A/B/C | NOT ALLOWED |
| Comment Create/Edit/Delete | NOT ALLOWED |
| Attachment Upload/Delete | NOT ALLOWED |
| SLA Monitoring View | ALLOWED |
| Escalation Alert View | ALLOWED |
| Audit Trail View | ALLOWED |
| Notification View | ALLOWED |
| Notification Mark as Read | ALLOWED |
| Personal Notification Delete | ALLOWED |
| Comment Read Receipt | ALLOWED |
| My Profile View/Edit | ALLOWED |
| Change Password | ALLOWED |
| SLA Action Notification | NOT ALLOWED |
| User Management | NOT ALLOWED |
| Project Management | NOT ALLOWED |
| Project Membership Management | NOT ALLOWED |
| Role/Permission Management | NOT ALLOWED |

Default rule:

Jika permission atau action tidak tercantum sebagai ALLOWED, Viewer harus diperlakukan sebagai NOT ALLOWED.

Catatan scope: Notification, My Profile, dan Change Password hanya berlaku untuk akun Viewer sendiri. Audit Trail berlaku project-scoped sesuai authorization backend.

---

# 3. Database Constraint Inventory

Target perubahan adalah memperluas fixed Official Role values dari:

```text
Admin
Document Owner
Team Process
Team Project
```

menjadi:

```text
Admin
Document Owner
Team Process
Team Project
Viewer
```

| Table | Column | Constraint | Nullable | Default | FK/Index Dependency | Migration Risk |
|---|---|---|---|---|---|---|
| `project_memberships` | `official_role` | `chk_project_memberships_official_role` | NOT NULL | none | indexed by `idx_project_memberships_official_role`; FK from `notifications.recipient_project_membership_id` to membership id only | Medium, required before inserting Viewer membership |
| `workflow_comments` | `created_by_official_role_snapshot` | `chk_workflow_comments_created_by_official_role` | NULL | NULL | no role FK; snapshot only | Low, protects future historical snapshot if Viewer ever creates read-only receipt is not stored here |
| `document_history` | `created_by_official_role_snapshot` | `chk_document_history_created_by_official_role` | NULL | NULL | no role FK; snapshot only | Low, protects future historical snapshot compatibility |
| `notifications` | `official_role` | `chk_notifications_official_role` | NULL | NULL | no role FK; recipient membership FK is separate | Medium, needed if informational Viewer notification is later created |
| `notifications` | `recipient_role` | `chk_notifications_recipient_role` | NULL | NULL | no role FK; recipient membership FK is separate | Medium, needed if Viewer personal notification is later created |
| `audit_trail` | `official_role` | `chk_audit_trail_official_role` | NULL | NULL | no role FK | Medium, needed when Viewer activity such as login/profile/read/delete notification is audited |

Canonical schema files inspected:

- `database/schema/schema-dev.sql`
- `database/schema/schema-staging.sql`
- `database/schema/schema-prod.sql`

All three schema artifacts currently use the five-role CHECK constraint pattern including `Viewer`.

---

# 4. Migration Draft

Draft status:

```text
PREPARATION ONLY
NOT APPROVED FOR EXECUTION
RUNTIME DB VERSION VERIFICATION REQUIRED
```

Compatibility note:

Repository policy requires compatibility with MariaDB 10.4.32+ and MySQL 8.x. CHECK constraint DDL syntax must be verified against the actual runtime database engine before execution.

## 4.1 Proposed CHECK Expression

```sql
CHECK (official_role IN ('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer'))
```

For nullable snapshot columns:

```sql
CHECK (created_by_official_role_snapshot IS NULL OR created_by_official_role_snapshot IN ('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer'))
```

For nullable notification role columns:

```sql
CHECK (official_role IS NULL OR official_role IN ('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer'))
CHECK (recipient_role IS NULL OR recipient_role IN ('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer'))
```

For nullable audit role:

```sql
CHECK (official_role IS NULL OR official_role IN ('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer'))
```

## 4.2 MySQL 8 Candidate Draft

```sql
-- PREPARATION ONLY / NOT APPROVED FOR EXECUTION
-- Verify runtime DB engine/version before use.

ALTER TABLE project_memberships
  DROP CHECK chk_project_memberships_official_role,
  ADD CONSTRAINT chk_project_memberships_official_role
    CHECK (official_role IN ('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer'));

ALTER TABLE workflow_comments
  DROP CHECK chk_workflow_comments_created_by_official_role,
  ADD CONSTRAINT chk_workflow_comments_created_by_official_role
    CHECK (created_by_official_role_snapshot IS NULL OR created_by_official_role_snapshot IN ('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer'));

ALTER TABLE document_history
  DROP CHECK chk_document_history_created_by_official_role,
  ADD CONSTRAINT chk_document_history_created_by_official_role
    CHECK (created_by_official_role_snapshot IS NULL OR created_by_official_role_snapshot IN ('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer'));

ALTER TABLE notifications
  DROP CHECK chk_notifications_official_role,
  DROP CHECK chk_notifications_recipient_role,
  ADD CONSTRAINT chk_notifications_official_role
    CHECK (official_role IS NULL OR official_role IN ('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer')),
  ADD CONSTRAINT chk_notifications_recipient_role
    CHECK (recipient_role IS NULL OR recipient_role IN ('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer'));

ALTER TABLE audit_trail
  DROP CHECK chk_audit_trail_official_role,
  ADD CONSTRAINT chk_audit_trail_official_role
    CHECK (official_role IS NULL OR official_role IN ('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer'));
```

## 4.3 MariaDB Candidate Draft

```sql
-- PREPARATION ONLY / NOT APPROVED FOR EXECUTION
-- Verify runtime DB engine/version before use.

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
```

---

# 5. Rollback Strategy

## 5.1 Before Migration

Rollback cukup membatalkan Phase 2B/2C implementation plan.

Tidak ada perubahan database yang perlu dikembalikan karena SQL belum dieksekusi.

## 5.2 After Migration Before Viewer Data Exists

Rollback dapat mengembalikan CHECK constraint ke empat role lama setelah verifikasi tidak ada data `Viewer`.

DDL rollback tetap membutuhkan backup, engine/version verification, dan explicit approval.

## 5.3 After Viewer Data Exists

Rollback tidak boleh menghapus data Viewer otomatis.

Rollback constraint ke empat role lama dapat gagal apabila terdapat:

- Project Membership dengan `official_role = 'Viewer'`.
- Notification dengan `official_role` atau `recipient_role = 'Viewer'`.
- Audit Trail dengan `official_role = 'Viewer'`.
- History/comment snapshot dengan role Viewer.

Kondisi ini membutuhkan forward-fix atau keputusan migrasi data terpisah.

DDL pada MySQL/MariaDB dapat melakukan implicit commit, sehingga rollback transactional tidak boleh diasumsikan aman.

---

# 6. Seed & Permission Preparation

Viewer role plan:

- Tambah role baru `Viewer`.
- Gunakan role code baru, misalnya `ROLE-VIEWER`.
- Jangan mengubah ID, code, atau permission empat role existing.

Viewer permission set v1.0:

- `dashboard.view`
- `document-register.view`
- `document-register.download`
- `sla-monitoring.view`
- `escalation.view`
- `audit-trail.view`
- `notifications.view`
- `profile.view`
- `password.change`

Do not grant:

- `document-register.create`
- `document-register.edit`
- `document-register.archive`
- `document-register.upload`
- `approval.a`
- `approval.b`
- `approval.c`
- `user-management.view`
- `storage.view`
- `transmittal.incoming`
- `transmittal.outgoing`

Seed safety:

- Existing `seed-base.sql` uses fixed IDs.
- Viewer seed update must avoid duplicate role and duplicate role-permission pairs.
- Runtime seed artifact is synchronized by backend prestart script.
- Development seed synchronization has been completed for CR-013.
- Online seed/reference-data execution remains pending until approved deployment.

---

# 7. Deployment Order

Development:

1. Backup database.
2. Verify runtime DB engine/version.
3. Apply approved migration only after user approval.
4. Apply approved seed/reference data update.
5. Deploy backend Viewer authorization.
6. Deploy frontend Viewer navigation/action visibility.
7. Verify Viewer membership and regression for four existing roles.
8. Status as of CR-013 Step 1: development execution completed; online deployment remains pending.

Staging:

1. Repeat Development order with staging backup/snapshot.
2. Validate Viewer role assignment.
3. Validate denial of workflow/document mutations.
4. Validate notification and audit trail scope.

Production:

1. Obtain explicit production approval.
2. Verify backup/restore capability.
3. Verify runtime DB engine/version.
4. Apply approved migration.
5. Apply approved reference data update.
6. Deploy backend.
7. Deploy frontend.
8. Verify project-scoped Viewer access and existing role regression.

Compatibility notes:

- Old backend with expanded CHECK constraints remains compatible because existing role values still pass.
- New backend requires Viewer role to exist in role catalog before assigning Viewer membership.
- Old frontend may not expose Viewer role in Project Membership UI.
- New frontend requires backend permission set to avoid false menu/action visibility.

---

# 8. Approval Gates

Required approvals before execution:

- Migration activation.
- Database execution.
- Seed/reference-data update.
- Backend Viewer authorization implementation.
- Frontend Viewer action/navigation implementation.
- Production deployment.

Any active database verification is:

```text
REQUIRES SEPARATE APPROVAL - NOT EXECUTED
```
