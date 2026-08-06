# DATABASE SCHEMA

Document Status: Official Database Schema  
Phase: Phase C - Database Architecture Generation  
Date: 2026-07-21  
Scope Boundary: Architecture document only. This document does not define SQL, migration files, ORM models, API, controllers, repositories, triggers, or stored procedures.

---

# 1. Introduction

Dokumen ini adalah satu-satunya dokumen schema database resmi EDMS. Dokumen ini mengikuti Domain 1 Core Business, Domain 2 UI Documentation, Domain 3 Frontend Architecture, dan Domain 4 Data Layer decisions yang telah dibekukan.

Database schema pada dokumen ini disusun dari:

- Business Workflow dan PRD frozen;
- UI Documentation frozen;
- Frontend Architecture frozen;
- workflow aktual sebagai evidence;
- feature frontend sebagai evidence;
- IndexedDB stores;
- repository layer;
- service layer;
- persistent data;
- Storage Strategy.

Database mengikuti Source of Truth frozen. Frontend implementation adalah evidence, bukan authority utama apabila bertentangan dengan Domain 1-4.

Istilah `table` pada dokumen ini adalah struktur data backend konseptual. Dokumen ini tidak berisi SQL dan tidak menetapkan teknologi database tertentu.

---

# 2. Architecture Principles

| ID | Principle | Application in This Document |
|---|---|---|
| DB-001 | Evidence Based | Setiap entity harus memiliki evidence dari source code, audit, storage strategy, atau business decision. |
| DB-002 | Reverse Engineering | Entity diturunkan dari service, repository, workflow, dan persistence yang sudah ada. |
| DB-003 | Preserve Behaviour | Workflow frontend seperti approval, revision, archive, restore, SLA, escalation, notification, audit, dan project close harus tetap dapat berjalan. |
| DB-004 | Persistent Data Only | Derived, runtime, dan presentation data tidak dijadikan table. |
| DB-005 | Storage Strategy Compliance | File fisik tidak disimpan di database; database hanya menyimpan metadata file. |
| DB-006 | No Backend Business Logic | Dokumen ini hanya mendefinisikan struktur data, relasi, constraint, lifecycle, dan traceability. |

Derived data yang tidak menjadi table:

- Dashboard KPI counts.
- SLA timer display.
- SLA status display.
- SLA WIB formatted timestamps.
- Escalation level.
- Overdue duration.
- Notification unread counter.
- Audit summary counters.
- Search/filter/sort/pagination state.
- Viewer type.
- File size display.
- UI labels and badges.

---

# 3. Source Authority

| Priority | Source | Role |
|---:|---|---|
| 1 | BUSINESS-WORKFLOW.md | Frozen Core Business workflow and lifecycle |
| 2 | PRD.md | Frozen product and entity requirements |
| 3 | UI Documentation | Frozen UI/data presentation requirements |
| 4 | Frontend Architecture Documentation | Frozen data flow and service boundary |
| 5 | `docs/architecture/STORAGE-STRATEGY.md` | Official file/storage architecture |
| 6 | Latest Frontend Source Code | Implementation evidence |
| 7 | `docs/architecture/DATABASE-READINESS-AUDIT.md` | Supporting technical audit |
| 8 | `docs/architecture/DATABASE-SCHEMA-WORKING-DRAFT.md` | Historical reference only |

Conflict handling:

- Frozen Domain 1-4 documentation wins over older implementation evidence.
- `CURRENT-IMPLEMENTATION-AUDIT.md` wins over older audit material.
- Storage-related structure follows `STORAGE-STRATEGY.md` when frontend IndexedDB differs from target backend storage architecture.
- `DATABASE-SCHEMA-WORKING-DRAFT.md` is not used as a primary source.

---

# 4. Domain Overview

| Domain | Tables | Evidence |
|---|---|---|
| Authentication | `user_credentials`, `password_reset_tokens`, `refresh_sessions` | Auth service, reset repository, refresh token blueprint |
| Administration | `users`, `departments`, `roles`, `permissions`, `role_permissions` | User/department services, fixed authorization catalog, authorization service |
| Project | `projects`, `project_memberships`, `user_project_preferences` | Project service, Zustand context, active project localStorage |
| Document | `engineering_documents`, `document_revisions`, `document_history` | Document service, document repository |
| Storage | `stored_files`, `workflow_attachments` | File service, workflow attachment service, Storage Strategy |
| Workflow | `workflow_comments`, `comment_read_receipts` | Workflow comments store, comment read service |
| SLA | `document_sla_evaluations` | Persisted `slaStateEvaluation` marker |
| Notification | `notifications` | Notification service/repository |
| Audit | `audit_trail` | Audit service/repository |
| Technical Metadata | `system_metadata` | IndexedDB `metadata` store for seed/migration markers |

Not represented as tables:

| Excluded Structure | Reason |
|---|---|
| Dashboard KPI | Derived from documents. |
| SLA timer/status display | Derived from timestamps/status/current time. |
| Escalation level/duration | Derived from SLA evaluation. |
| Transmittal | Placeholder route only; no implemented data model. |
| Storage NAS page | Placeholder route only; no implemented data model. |
| Table filters, selected rows, modal state | Runtime/presentation state. |
| TanStack Query cache | Runtime cache. |
| Zustand loading/error state | Runtime state. |

---

## 4.1 Non-Production Schema Profile

| Table | Environment | Purpose |
|---|---|---|
| `mock_emails` | Development and testing only | Simulates outbound password reset email delivery used by the current frontend development flow. It must not be included in the production schema. |

---

# 5. Entity Inventory

| Entity | Backend Table | Domain | Evidence | Purpose | Included |
|---|---|---|---|---|---|
| User Account | `users` | Administration | `users` store, `UserService`, auth flow | User identity and lifecycle | Yes |
| User Credential | `user_credentials` | Authentication | `userCredentials` store, `AuthService`, `UserService.updateUserPassword` | Login/change/reset password credential state | Yes |
| Password Reset Token | `password_reset_tokens` | Authentication | `passwordResetTokens` store, password reset repository | Reset token lifecycle | Yes |
| Refresh Session | `refresh_sessions` | Authentication | Refresh Token Blueprint | Persistent, revocable, device-aware refresh token session | Yes |
| Mock Email | `mock_emails` | Authentication / Dev | `mockEmails` store, mock email detail page | Development reset email simulation | Non-production only |
| Department | `departments` | Administration | Department service/repository | Department master data | Yes |
| Role | `roles` | Authorization Catalog | `users.json`, authorization service | Fixed authorization role catalog; not operational Role Management module | Yes |
| Permission | `permissions` | Authorization Catalog | `users.json`, navigation permissions | Fixed permission catalog; not operational Permission Management module | Yes |
| Role Permission | `role_permissions` | Authorization Catalog | `users.json` rolePermissions | Fixed role-permission mapping | Yes |
| Project | `projects` | Project | Project service/repository | Project boundary and lifecycle | Yes |
| Project Membership | `project_memberships` | Project | Project membership repository/service | Project access and official role | Yes |
| User Project Preference | `user_project_preferences` | Project / Preference | `edms.activeProjectByUser`, `ProjectService.resolveActiveProject` | Last selected project per user | Yes, preference only |
| Engineering Document | `engineering_documents` | Document | `documents` store, DocumentService | Main document register business record | Yes |
| Document Revision | `document_revisions` | Document / Revision | `documentRevisions` store, upload revision flow | Revision history and active revision linkage | Yes |
| Temporary Upload | `temporary_uploads` | Storage | Backend temporary upload pipeline | Persistent registry for temporary upload metadata before document transaction | Yes, technical |
| Stored File | `stored_files` | Storage | FileService metadata, `files` store, Storage Strategy | Single official metadata record for each file | Yes |
| Workflow Comment | `workflow_comments` | Workflow | `workflowComments` store, approval B/C | Workflow review comments | Yes |
| Workflow Attachment | `workflow_attachments` | Storage / Workflow | WorkflowAttachmentService, Storage Strategy | Attachment metadata linked to workflow comment | Yes |
| Document History | `document_history` | Document / Audit-like Timeline | `documentHistory` store | Business timeline per document | Yes |
| Comment Read Receipt | `comment_read_receipts` | Workflow | `commentReadReceipts` store | Per-user comment read tracking | Yes |
| Document SLA Evaluation | `document_sla_evaluations` | SLA | Persisted `slaStateEvaluation` in document | SLA notification idempotency marker | Yes |
| Notification | `notifications` | Notification | Notification service/repository | Per-recipient notifications | Yes |
| Audit Trail | `audit_trail` | Audit | Audit service/repository | Activity record and soft hide behavior | Yes |
| System Metadata | `system_metadata` | Technical | `metadata` store | Seed/migration/compatibility markers | Yes, technical |

Consolidation decisions:

| Frontend Structure | Backend Treatment | Reason |
|---|---|---|
| `document.fileMetadata`, `document.fileHistory`, `files.metadata` | Consolidated into `stored_files` plus `document_revisions` links | Storage Strategy requires single file metadata truth. |
| Workflow comment embedded `attachment` | Split into `workflow_attachments` and `stored_files` | Attachment has independent file lifecycle and is not revision. |
| `document.slaStateEvaluation` | Split to `document_sla_evaluations` | It is persistent idempotency state, not display data. |
| User `roleId` and Project Membership `officialRole` | Kept separate via `users.role_id` and `project_memberships.official_role` | System permission and project operational role are both used. |
| Active Project Zustand state | Not stored | Runtime state only. |
| Active Project localStorage preference | `user_project_preferences` | Persistent user preference has implementation evidence. |
| Escalation items | Not stored as table | Derived from SLA; only audit/notification records persist. |

---

# 6. Entity Specification

## 6.1 Authentication

### `user_credentials`

| Item | Specification |
|---|---|
| Purpose | Store credential state for login, change password, and reset password. |
| Evidence | `userCredentials` IndexedDB store; `AuthService.login`; `UserService.updateUserPassword`. |
| Primary Key | `user_id` |
| Key Strategy | Same identifier as `users.id`. Current frontend uses numeric user ids. Backend may keep numeric ids for users to preserve seed compatibility. |
| Lifecycle | Active/Inactive mirrors user account; password update changes credential timestamp. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `user_id` | Yes | Credential keyPath is `userId`. |
| `password_hash` | Yes | Frontend has plaintext `password`; backend must store hash, not plaintext. |
| `is_active` | Yes | Credential active state checked during login. |
| `created_at` | Yes | Backend timestamp equivalent for credential creation. |
| `updated_at` | Yes | Frontend updates credential `updatedAt`. |
| `password_changed_at` | Optional | Derived from credential update event; supports existing change/reset password behavior. |

### `password_reset_tokens`

| Item | Specification |
|---|---|
| Purpose | Store reset token lifecycle for forgot/reset password. |
| Evidence | `passwordResetTokens` store; `PasswordResetRepository`; `AuthService.forgotPassword/resetPassword`. |
| Primary Key | `id` or `token_hash` |
| Primary Key | `id` |
| Key Strategy | Use a stable internal identifier as the primary key. `token_hash` is stored as a unique lookup value and must never expose the raw reset token. |
| Lifecycle | Created -> Revoked, Used, or Expired by timestamp. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `id` | Yes | Backend stable record id. |
| `token_hash` | Yes | Frontend has raw `token`; backend security requires hash. |
| `user_id` | Yes | Token belongs to a user. |
| `request_id` | Yes | Frontend creates and indexes request id. |
| `created_at` | Yes | Token creation timestamp. |
| `expires_at` | Yes | 15-minute TTL in current service. |
| `used_at` | Optional | Marks single use. |
| `revoked_at` | Optional | Active prior tokens revoked on new request. |

### `mock_emails` — Non-Production Only

| Item | Specification |
|---|---|
| Purpose | Development-only reset email simulation. |
| Evidence | `mockEmails` store; `MockEmailDetailPage`; `AuthService.getMockEmails`. |
| Production Rule | Not part of the production business workflow. This entity exists only to support the current frontend development and testing flow. |
| Primary Key | `id` |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `id` | Yes | Mock email keyPath. |
| `request_id` | Yes | Indexed and used by check email flow. |
| `to_email` | Yes | Frontend `to`. |
| `from_label` | Yes | Frontend `from`. |
| `subject` | Yes | Mock email subject. |
| `token` | Yes | Development-only raw reset token. |
| `user_id` | Yes | Reset target user. |
| `username` | Yes | Mock email display. |
| `created_at` | Yes | Indexed by `createdAt`. |

Implementation Rules:

- This entity is excluded from the production database schema.
- Production password recovery must use an outbound email provider.
- Raw reset tokens must never be persisted in production email records.
- This entity exists solely for frontend development and testing purposes.

## 6.2 Administration

### `users`

| Item | Specification |
|---|---|
| Purpose | User identity and account lifecycle. |
| Evidence | `users` store; `UserService`; auth session mapping; user management page. |
| Primary Key | `id` |
| Key Strategy | Current frontend uses numeric ids and generates next numeric id. Preserve numeric user id compatibility unless backend chooses a migration mapping. |
| Lifecycle | Active/Inactive; delete unsupported. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `id` | Yes | User keyPath and memberships reference user id. |
| `user_code` | Yes | `userCode`, generated `USR-000001`. |
| `username` | Yes | Unique login identifier. |
| `full_name` | Yes | `fullName/name` displayed and stored. |
| `email` | Yes | Required and unique in user service. |
| `department_id` | Optional | Backend relation to departments. Frontend stores department name. |
| `department_name_snapshot` | Optional | Preserves current frontend department string behavior and audit display. |
| `position` | Optional | Present in seed/current user mapping. |
| `role_id` | Yes | System authorization role used by AuthorizationService and Project Close admin check. |
| `status` | Yes | Canonical account lifecycle state: Active or Inactive. Backend derives active checks from this field. |
| `created_at` | Yes | Seed/user service. |
| `updated_at` | Optional | User update timestamp. |

### `departments`

| Item | Specification |
|---|---|
| Purpose | Department master data used by user management and SLA responsible department display. |
| Evidence | `departments` store; DepartmentService; user assignment validation. |
| Primary Key | `id` |
| Key Strategy | Current frontend uses numeric ids. |
| Lifecycle | Active/Inactive; delete unsupported. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `id` | Yes | Department keyPath. |
| `name` | Yes | Department name. |
| `name_key` | Yes | Unique normalized key. |
| `status` | Yes | Active/Inactive. |
| `created_at` | Yes | Seed/create service. |
| `updated_at` | Optional | Department update/status change. |

### `roles`

| Item | Specification |
|---|---|
| Purpose | Fixed system role catalog for authorization. |
| Evidence | `users.json.roles`; AuthorizationService. |
| Primary Key | `id` |
| Lifecycle | Active/Inactive catalog state. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `id` | Yes | Role id referenced by users and rolePermissions. |
| `role_code` | Yes | `ROLE-ADMIN`, etc. |
| `role_name` | Yes | Admin, Document Owner, Team Process, Team Project. |
| `is_active` | Yes | Authorization filters active roles. |

### `permissions`

| Item | Specification |
|---|---|
| Purpose | Permission catalog used by navigation and protected routes. |
| Evidence | `users.json.permissions`; navigation permissions; ProtectedRoute. |
| Primary Key | `id` |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `id` | Yes | Permission id used in rolePermissions. |
| `permission_code` | Yes | Frontend canonical codes such as `document-register.view`, `approval.a`. |
| `permission_name` | Yes | Display/seed name. |

### `role_permissions`

| Item | Specification |
|---|---|
| Purpose | Many-to-many mapping between roles and permissions. |
| Evidence | `users.json.rolePermissions`; AuthorizationService. |
| Primary Key | Composite (`role_id`, `permission_id`) |
| Key Strategy | The role-permission pair is the natural identity of the mapping. No generated identifier is required. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `role_id` | Yes | Maps to role. |
| `permission_id` | Yes | Maps to permission. |

## 6.3 Project

### `projects`

| Item | Specification |
|---|---|
| Purpose | Multi-project boundary and owner of project-scoped operational data. |
| Evidence | `projects` store; ProjectService; ProjectContextRoute. |
| Primary Key | `id` |
| Key Strategy | Current service uses string ids such as `PRJ-*`; use stable string identifier. |
| Lifecycle | Active -> Inactive, Inactive -> Active, Active -> Closed. Closed is final. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `id` | Yes | Project keyPath and all project-scoped records reference it. |
| `project_code` | Yes | Unique project code. |
| `project_name` | Yes | Required by schema. |
| `description` | Optional | Project form field. |
| `status` | Yes | Active, Inactive, Closed. |
| `created_by_user_id` | Optional | User who created the project. |
| `created_at` | Yes | `createdDate/createdAt`. |
| `updated_at` | Optional | `lastUpdated`. |
| `updated_by_user_id` | Optional | User who last updated the project. |
| `closed_at` | Optional | Project close flow. |
| `closed_by_user_id` | Optional | User who closed the project. |

### `project_memberships`

| Item | Specification |
|---|---|
| Purpose | Defines project access and official project role. |
| Evidence | `projectMemberships` store; ProjectService; active project context; notification recipient resolution. |
| Primary Key | `id` |
| Key Strategy | Current service creates `PMB-*`; use stable string identifier. |
| Lifecycle | Active/Inactive; read-only after Project Closed. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `id` | Yes | Membership keyPath. |
| `project_id` | Yes | Project scope. |
| `user_id` | Yes | Member user. |
| `official_role` | Yes | Admin, Document Owner, Team Process, Team Project. |
| `status` | Yes | Active/Inactive. |
| `assigned_by_user_id` | Optional | User who assigned the membership. |
| `assigned_at` | Yes | Frontend `assignedDate`. |
| `updated_at` | Optional | Frontend `lastUpdated`. |
| `updated_by_user_id` | Optional | User who last updated the membership. |

### `user_project_preferences`

| Item | Specification |
|---|---|
| Purpose | Persist last selected active project per user. |
| Evidence | localStorage `edms.activeProjectByUser`; `ProjectService.persistActiveProjectId`. |
| Primary Key | `user_id` |
| Key Strategy | One user can have at most one active project preference record. |
| Lifecycle | Created/updated/cleared when accessible projects change. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `user_id` | Yes | Preference is keyed by current user id. |
| `active_project_id` | Optional | Cleared when no accessible project. |
| `updated_at` | Yes | Backend equivalent for preference update. |

## 6.4 Document and Revision

### `engineering_documents`

| Item | Specification |
|---|---|
| Purpose | Main EDMS document register record. |
| Evidence | `documents` store; DocumentService; dashboard/SLA/escalation/notification workflows. |
| Primary Key | `id` |
| Key Strategy | Current service creates string ids `DOC-PFD-*` or `DOC-PID-*`; use stable string identifier. |
| Lifecycle | Active/Archived independent from workflow status. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `id` | Yes | Document keyPath. |
| `project_id` | Yes | Active Project and project isolation. |
| `document_number` | Yes | Required, unique within project. |
| `description` | Yes | Create/edit form. |
| `drawing` | Yes | PFD/P&ID route context. |
| `area` | Yes | Free-text form/filter field. |
| `days_until_validation` | Yes | SLA calculation input. |
| `workflow_status` | Yes | Process Review, Project Review, etc. |
| `lifecycle_status` | Yes | Active/Archived. |
| `revision_label` | Yes | Current frontend `revision`. |
| `responsible_role` | Yes | Current responsible role for workflow/notification/SLA. |
| `current_assignee_user_id` | Optional | Persistent reference to the currently assigned user. Display name is derived through the relation to `users`. May be null when no active eligible assignee is available. |
| `active_revision_id` | Yes after file upload | Active revision pointer. |
| `active_file_id` | Yes after file upload | Active stored file pointer. |
| `created_by_user_id` | Yes | User who created the document. |
| `created_at` | Yes | Frontend `createdDate`. |
| `updated_at` | Yes | Frontend `lastUpdated`. |
| `updated_by_user_id` | Optional | User who last updated the document. |
| `archived_at` | Optional | Archive/project close. |
| `archived_by_user_id` | Optional | User who archived the document or executed Project Close. |
| `archive_reason` | Optional | Archive modal or `Project Closed`. |
| `restored_at` | Optional | Restore flow. |
| `restored_by_user_id` | Optional | User who restored the document. |
| `sla_started_at` | Yes | SLA persisted timestamp. |
| `sla_stopped_at` | Optional | Set on Approved. |
| `sla_assignee_name_snapshot` | Optional | Historical display snapshot of the assignee name for the current SLA cycle. This field does not replace `current_assignee_user_id`. |

Current-state consistency rules

- `revision_label` is a denormalized current-state snapshot used by Document Register, Dashboard, SLA Monitoring, and other read-heavy views.
- `revision_label` must always match the `revision_label` of the record referenced by `active_revision_id`.
- `active_file_id` must match the `file_id` of the active revision referenced by `active_revision_id`.
- `responsible_role` represents the current workflow role.
- `current_assignee_user_id` represents the current assigned user and must belong to the same project through an active project membership.
- Current-state snapshot fields must be updated atomically whenever workflow status or active revision changes.

### `document_revisions`

| Item | Specification |
|---|---|
| Purpose | Revision history and active file linkage. |
| Evidence | `documentRevisions` store; create document and upload revision flows. |
| Primary Key | `id` |
| Key Strategy | Current service creates `REV-*`; use stable string identifier. |
| Lifecycle | Active/Superseded via `is_active`; revision records are retained. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `id` | Yes | Revision keyPath. |
| `project_id` | Yes | Indexed and project-scoped. |
| `document_id` | Yes | Indexed child of document. |
| `revision_label` | Yes | IFR-Submitted, IFA-Submitted, AS-Built. |
| `file_id` | Yes | Official reference to the immutable file metadata record in `stored_files.file_id`. |
| `storage_path_legacy` | Optional | Frontend compatibility for old `storagePath`; not business identity. |
| `is_active` | Yes | Current active revision marker. |
| `created_at` | Yes | Revision upload/create timestamp. |
| `created_by_user_id` | Yes | User who created or uploaded the revision. |

### `document_history`

| Item | Specification |
|---|---|
| Purpose | Business timeline for document events. |
| Evidence | `documentHistory` store; create, approval, upload revision, archive, restore, project close. |
| Primary Key | `id` |
| Key Strategy | Current service creates `DTL-*`; use stable string identifier. |
| Lifecycle | Append-only for business events; retained with document. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `id` | Yes | History keyPath. |
| `project_id` | Yes | Indexed project scope. |
| `document_id` | Yes | Indexed child of document. |
| `workflow_event` | Yes | Event label. |
| `activity` | Yes | Activity/action label. |
| `workflow_status` | Optional | Document status snapshot. |
| `revision_label` | Optional | Revision snapshot. |
| `lifecycle_status` | Optional | Archive/restore/project close history. |
| `reason` | Optional | Archive reason. |
| `created_at` | Yes | Frontend `createdDate`. |
| `created_by_user_id` | Optional | User identity of the actor. May be null for system-generated events. |
| `created_by_name_snapshot` | Yes | Actor display name retained as historical snapshot. |
| `created_by_official_role_snapshot` | Optional | Actor project role retained as historical snapshot. |

## 6.5 Storage and Workflow

### `temporary_uploads`

| Item | Specification |
|---|---|
| Purpose | Persistent registry for temporary uploads before they are finalized into permanent storage. |
| Evidence | Backend temporary upload pipeline and Storage Strategy temporary upload rules. |
| Primary Key | `id` |
| Key Strategy | Backend creates `TMP-*` row id and stable `temporary_file_id`. |
| Lifecycle | Created after temporary file write; retained until consumed or expired cleanup; runtime consumption deletes the temporary record after successful promotion to permanent storage. `consumed_at` remains a compatibility column for historical retention strategies. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `id` | Yes | Technical row identity. |
| `temporary_file_id` | Yes | Public internal handoff key used by Create Document. |
| `storage_key` | Yes | Relative temporary storage key. |
| `original_file_name` | Yes | User-uploaded file name. |
| `physical_file_name` | Yes | Temporary physical file name. |
| `mime_type` | Yes | Upload validation metadata. |
| `extension` | Yes | Upload validation metadata. |
| `file_size` | Yes | Upload validation metadata. |
| `checksum` | Optional | Integrity metadata generated by upload pipeline. |
| `uploaded_at` | Yes | Temporary upload timestamp. |
| `expires_at` | Yes | Cleanup/recovery lifecycle boundary. |
| `consumed_at` | Optional | Set after successful document finalization. |
| `created_by_user_id` | Yes | Actor who uploaded the temporary file. |

### `stored_files`

| Item | Specification |
|---|---|
| Purpose | Single official metadata record for every physical file. |
| Evidence | FileService metadata, `files` store, Storage Strategy SR-001 through SR-024. |
| Primary Key | `file_id` |
| Key Strategy | Current frontend creates `FILE-*`; use stable string file identity. |
| Lifecycle | Created once; metadata retained; physical file immutable after permanent storage. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `file_id` | Yes | File identity, current `FILE-*`. |
| `project_id` | Yes | Storage Strategy: every file belongs to a Project. |
| `document_id` | Optional | Denormalized ownership reference used for document-level isolation and file lookup. The canonical revision and attachment relationships are stored in `document_revisions.file_id` and `workflow_attachments.file_id`. |
| `original_file_name` | Yes | UI/download name. |
| `physical_file_name` | Yes | Storage Strategy hybrid internal filename. |
| `file_extension` | Yes | Validation and preview. |
| `mime_type` | Yes | Validation and preview. |
| `file_size` | Yes | Validation. |
| `storage_key` | Yes | Backend storage lookup identity. |
| `relative_path` | Yes | Storage-independent relative reference. |
| `file_category` | Yes | Active Document File, Revision File, Workflow Attachment. |
| `checksum` | Optional | Not implemented in frontend, but allowed by Storage Strategy metadata/integrity direction. |
| `uploaded_by_user_id` | Yes | User who uploaded the physical file. |
| `uploaded_at` | Yes | File metadata. |
| `is_active` | Yes | Current frontend toggles active file metadata. |

### `workflow_comments`

| Item | Specification |
|---|---|
| Purpose | Stores comments created by workflow actions. |
| Evidence | `workflowComments` store; `processWorkflowAction`. |
| Primary Key | `id` |
| Key Strategy | Current service creates `WFC-*`; use stable string identifier. |
| Lifecycle | Created during workflow; retained with document. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `id` | Yes | Comment keyPath. |
| `project_id` | Yes | Indexed project scope. |
| `document_id` | Yes | Indexed child. |
| `revision_id` | Optional | Current frontend does not always store it; useful when active revision exists. |
| `workflow_action` | Yes | Approval B/C title/action. |
| `workflow_comment` | Optional | Required for B if no attachment; default for C possible. |
| `created_by_user_id` | Optional | User identity of the comment author. |
| `created_by_name_snapshot` | Yes | Comment author display name retained as historical snapshot. |
| `created_by_official_role_snapshot` | Yes | Comment author project role retained as historical snapshot. |
| `created_at` | Yes | Frontend `createdDate/createdAt`. |

### `workflow_attachments`

| Item | Specification |
|---|---|
| Purpose | Metadata link between workflow comment and stored attachment file. |
| Evidence | WorkflowAttachmentService; attachment embedded in workflow comments; Storage Strategy says attachment is not revision. |
| Primary Key | `attachment_id` |
| Key Strategy | Current service creates `WFA-*`; use stable string identifier. |
| Lifecycle | Created with workflow comment; retained as workflow history. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `attachment_id` | Yes | Attachment id. |
| `comment_id` | Yes | Attachment belongs to workflow comment. |
| `project_id` | Yes | Storage Strategy project ownership. |
| `document_id` | Yes | Current attachment metadata has document id. |
| `file_id` | Yes | Link to `stored_files`. |
| `uploaded_by_user_id` | Yes | User who uploaded the attachment. |
| `uploaded_at` | Yes | Attachment metadata. |

### `comment_read_receipts`

| Item | Specification |
|---|---|
| Purpose | Per-user read status for workflow comments. |
| Evidence | `commentReadReceipts` store; CommentReadService. |
| Primary Key | `id` |
| Key Strategy | Use a stable string identifier compatible with the current frontend pattern `${userId}:${commentId}`. The pair (`user_id`, `comment_id`) must also be unique. |
| Lifecycle | Created/updated when user reads comments. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `id` | Yes | Frontend uses `${userId}:${commentId}`. |
| `project_id` | Yes | Project-scoped receipts. |
| `document_id` | Yes | Indexed document. |
| `comment_id` | Yes | Read comment. |
| `user_id` | Yes | Reader. |
| `read_at` | Yes | Read timestamp. |

## 6.6 SLA, Notification, Audit, Technical

### `document_sla_evaluations`

| Item | Specification |
|---|---|
| Purpose | Persist notification state per SLA cycle to avoid duplicate SLA notifications. |
| Evidence | `document.slaStateEvaluation`; `SlaMonitoringService.updatePersistedSlaEvaluation`. |
| Primary Key | `id` |
| Key Strategy | Use a stable internal identifier. The pair (`document_id`, `cycle_id`) must be unique to prevent duplicate evaluation records for the same SLA cycle. |
| Lifecycle | Created/updated per SLA cycle; superseded when SLA cycle changes. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `id` | Yes | Stable backend record id if not composite. |
| `project_id` | Yes | Cycle is project-scoped. |
| `document_id` | Yes | Evaluation belongs to document. |
| `cycle_id` | Yes | Current frontend builds from project/document/slaStartedAt. |
| `current_state` | Optional | Last evaluated SLA state. |
| `notified_states` | Yes | JSON Object containing notification timestamps for the current SLA cycle. Supported keys are `at_risk` and `overdue`; each value is either a UTC timestamp or null. |
| `updated_at` | Yes | Frontend marker `updatedAt`. |

Canonical JSON shape:

```json
{
  "at_risk": "2026-07-21T10:00:00Z",
  "overdue": "2026-07-22T10:00:00Z"
}
```
Rules:
- at_risk is set only when the At Risk notification has been generated for the current SLA cycle.
- overdue is set only when the Overdue notification has been generated for the current SLA cycle.
- Missing notification events must use null.
- A new SLA cycle must use a new evaluation record or reset the object under a new unique cycle_id.

### `notifications`

| Item | Specification |
|---|---|
| Purpose | Per-recipient notification records. |
| Evidence | `notifications` store; NotificationService. |
| Primary Key | `id` |
| Key Strategy | Current service creates `NOT-*`; use stable string identifier. |
| Lifecycle | Created -> Unread -> Read -> Hard Deleted by User. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `id` | Yes | Notification keyPath. |
| `identity_key` | Yes | Unique idempotency key. |
| `project_id` | Yes | Active project scoped. |
| `recipient_user_id` | Yes | Current user ownership. |
| `recipient_project_membership_id` | Optional | Current payload includes membership id. |
| `event_type` | Yes | Workflow/SLA event type. |
| `title` | Yes | Notification title. |
| `message` | Yes | Notification message. |
| `priority` | Yes | Low/Medium/High. |
| `official_role` | Optional | Recipient role snapshot. |
| `recipient_role` | Optional | Alias/snapshot used by frontend. |
| `related_resource_type` | Yes | Currently Engineering Document. |
| `related_resource_id` | Optional | Related document id. |
| `related_document_number` | Optional | Direct open/search display. |
| `action_target` | Optional | Frontend route target. |
| `is_read` | Yes | Canonical persisted read state. |
| `read_at` | Optional | Timestamp when the notification was marked as read. Must be null while `is_read` is false. |
| `created_at` | Yes | Creation timestamp. |
| `metadata` | Optional | Event-specific metadata. |

### `audit_trail`

| Item | Specification |
|---|---|
| Purpose | Activity record across authentication, administration, project, document, notification, escalation, and storage-related events. |
| Evidence | `auditTrail` store; AuditTrailService. |
| Primary Key | `id` |
| Key Strategy | Current service creates `AUD-*`; use stable string identifier. |
| Lifecycle | Created; may be soft-hidden by Admin; not hard-deleted in normal business flow. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `id` | Yes | Audit keyPath. |
| `identity_key` | Yes | Unique idempotency key. |
| `project_id` | Optional | Authentication can be global; project events are scoped. |
| `actor_user_id` | Optional | System actions may be null. |
| `actor_name` | Yes | Actor snapshot. |
| `department` | Optional | Actor department snapshot. |
| `official_role` | Optional | Actor role snapshot. |
| `action` | Yes | Audit action. |
| `business_event` | Yes | Dictionary event label. |
| `detail` | Yes | Dictionary detail. |
| `resource_type` | Yes | Authentication, Document, Project, etc. |
| `resource_id` | Optional | Target resource id. |
| `reference` | Optional | Document number, project code, username, etc. |
| `metadata` | Optional | Event-specific data. |
| `occurred_at` | Yes | Canonical UTC timestamp when the audited activity occurred. Frontend `createdAt` and `timestamp` values map to this single field. |
| `is_hidden` | Yes | Backend semantic equivalent of `isDeleted`. |
| `hidden_at` | Optional | Soft hide timestamp. |
| `hidden_by_user_id` | Optional | Admin who hid record. |

### `system_metadata`

| Item | Specification |
|---|---|
| Purpose | Store seed, compatibility, and migration markers. |
| Evidence | IndexedDB `metadata` store; seed and migration services. |
| Primary Key | `key` |
| Lifecycle | Created/updated by system operations. |

Attributes:

| Attribute | Required | Evidence / Note |
|---|---:|---|
| `key` | Yes | Metadata keyPath. |
| `value` | Yes | Version/flag/value payload. |
| `updated_at` | Optional | Backend operational timestamp. |

---

# 7. Relationship Specification

| Parent | Relationship | Child | Cardinality | Evidence |
|---|---|---|---|---|
| `departments` | has users | `users` | 1:N | UserService validates active department name; SLA resolver uses user department. |
| `roles` | assigned to users | `users` | 1:N | User `roleId`; AuthorizationService gets current role. |
| `roles` | grants permissions | `role_permissions` | 1:N | `users.json.rolePermissions`. |
| `permissions` | granted through mapping | `role_permissions` | 1:N | `users.json.rolePermissions`. |
| `users` | has credential | `user_credentials` | 1:1 | Credential keyPath is `userId`. |
| `users` | requests reset tokens | `password_reset_tokens` | 1:N | Reset repository indexes by userId. |
| `users` | has refresh sessions | `refresh_sessions` | 1:N | Refresh Token Blueprint requires persistent, revocable, device-aware sessions. |
| `users` | receives mock emails | `mock_emails` | 1:N | Mock email has `userId`. |
| `users` | has project memberships | `project_memberships` | 1:N | ProjectMembershipRepository indexes `userId`. |
| `projects` | has memberships | `project_memberships` | 1:N | Membership repository indexes `projectId`. |
| `users` | has active project preference | `user_project_preferences` | 1:0..1 | `edms.activeProjectByUser` keyed by user. |
| `projects` | can be selected preference | `user_project_preferences` | 1:N | Preference stores active project id. |
| `projects` | owns documents | `engineering_documents` | 1:N | Documents indexed by projectId. |
| `engineering_documents` | has revisions | `document_revisions` | 1:N | Revision repository indexes documentId. |
| `engineering_documents` | points to active revision | `document_revisions` | N:1 | Document has `activeRevisionId`; upload revision toggles active revision. |
| `engineering_documents` | points to active file | `stored_files` | N:1 | Document has `activeFileId`; Storage Strategy active file concept. |
| `document_revisions` | uses stored file | `stored_files` | 1:1 | Each revision references exactly one immutable stored file through `file_id`; upload revision creates a new file record. |
| `engineering_documents` | has workflow comments | `workflow_comments` | 1:N | WorkflowCommentRepository indexes documentId/projectId. |
| `workflow_comments` | may have attachment | `workflow_attachments` | 1:0..1 | Workflow attachment is saved against commentId; max one attachment in current flow. |
| `workflow_attachments` | uses stored file | `stored_files` | 1:1 | Attachment metadata maps to saved file. |
| `engineering_documents` | has history | `document_history` | 1:N | History repository indexes documentId/projectId. |
| `workflow_comments` | has read receipts | `comment_read_receipts` | 1:N | Receipt contains commentId. |
| `users` | has read receipts | `comment_read_receipts` | 1:N | Receipt id is user/comment pair. |
| `engineering_documents` | has SLA evaluation markers | `document_sla_evaluations` | 1:N by cycle | Cycle id includes document and `slaStartedAt`. |
| `users` | receives notifications | `notifications` | 1:N | Notifications indexed by recipientUserId. |
| `projects` | scopes notifications | `notifications` | 1:N | Notifications indexed by projectId. |
| `project_memberships` | snapshots notification recipient context | `notifications` | 1:N optional | Notification payload includes recipientProjectMembershipId. |
| `projects` | scopes audit | `audit_trail` | 1:N optional | Audit indexed by projectId; auth records may be global. |
| `users` | actor in audit | `audit_trail` | 1:N optional | Audit actorUserId. |

Foreign key strategy:

| Table | Foreign Keys |
|---|---|
| `users` | `department_id -> departments.id`, `role_id -> roles.id` |
| `user_credentials` | `user_id -> users.id` |
| `password_reset_tokens` | `user_id -> users.id` |
| `refresh_sessions` | `user_id -> users.id` |
| `mock_emails` | `user_id -> users.id` |
| `role_permissions` | `role_id -> roles.id`, `permission_id -> permissions.id` |
| `project_memberships` | `project_id -> projects.id`, `user_id -> users.id`, optional `assigned_by_user_id -> users.id`, optional `updated_by_user_id -> users.id` |
| `user_project_preferences` | `user_id -> users.id`, `active_project_id -> projects.id` |
| `projects` | optional `created_by_user_id -> users.id`, optional `updated_by_user_id -> users.id`, optional `closed_by_user_id -> users.id` |
| `engineering_documents` | `project_id -> projects.id`, optional `current_assignee_user_id -> users.id`, optional `created_by_user_id -> users.id`, optional `updated_by_user_id -> users.id`, optional `archived_by_user_id -> users.id`, optional `restored_by_user_id -> users.id`, `active_revision_id -> document_revisions.id`, `active_file_id -> stored_files.file_id` |
| `document_revisions` | `project_id -> projects.id`, `document_id -> engineering_documents.id`, `file_id -> stored_files.file_id`, `created_by_user_id -> users.id` |
| `stored_files` | `project_id -> projects.id`, optional `document_id -> engineering_documents.id`, `uploaded_by_user_id -> users.id` |
| `workflow_comments` | `project_id -> projects.id`, `document_id -> engineering_documents.id`, optional `revision_id -> document_revisions.id`, optional `created_by_user_id -> users.id` |
| `workflow_attachments` | `comment_id -> workflow_comments.id`, `project_id -> projects.id`, `document_id -> engineering_documents.id`, `file_id -> stored_files.file_id`, `uploaded_by_user_id -> users.id` |
| `document_history` | `project_id -> projects.id`, `document_id -> engineering_documents.id`, optional `created_by_user_id -> users.id` |
| `comment_read_receipts` | `project_id -> projects.id`, `document_id -> engineering_documents.id`, `comment_id -> workflow_comments.id`, `user_id -> users.id` |
| `document_sla_evaluations` | `project_id -> projects.id`, `document_id -> engineering_documents.id` |
| `notifications` | `project_id -> projects.id`, `recipient_user_id -> users.id`, optional `recipient_project_membership_id -> project_memberships.id` |
| `audit_trail` | optional `project_id -> projects.id`, optional `actor_user_id -> users.id` |

---

# 8. Attribute Specification

This section summarizes attributes by table. Field names use backend-style snake_case while preserving frontend semantics.

## 8.1 Conceptual Data Types

The following conceptual data types are used throughout this architecture document. The exact SQL data types will be defined later during physical database implementation.

| Conceptual Type | Description |
|---|---|
| Identifier | Stable primary key or foreign key value. |
| String | Short text value such as codes, names, labels, filenames, and identifiers. |
| Text | Long free-form text such as comments, descriptions, messages, and audit details. |
| Integer | Whole number value. |
| Boolean | True or False value. |
| Timestamp (UTC) | Date and time stored in UTC format. |
| Enum | Value restricted to predefined business states. |
| JSON Object | Structured metadata stored as JSON. |

## 8.2 Attribute Inventory

| Table | Attributes |
|---|---|
| `users` | `id`, `user_code`, `username`, `full_name`, `email`, `department_id`, `department_name_snapshot`, `position`, `role_id`, `status`, `created_at`, `updated_at` |
| `user_credentials` | `user_id`, `password_hash`, `is_active`, `created_at`, `updated_at`, `password_changed_at` |
| `password_reset_tokens` | `id`, `token_hash`, `user_id`, `request_id`, `created_at`, `expires_at`, `used_at`, `revoked_at` |
| `refresh_sessions` | `id`, `user_id`, `session_family_id`, `device_id`, `device_name`, `refresh_token_hash`, `previous_token_hash`, `issued_at`, `expires_at`, `rotated_at`, `revoked_at`, `revoked_reason`, `last_used_at`, `created_ip`, `last_ip` |
| `mock_emails` | `id`, `request_id`, `to_email`, `from_label`, `subject`, `token`, `user_id`, `username`, `created_at` |
| `departments` | `id`, `name`, `name_key`, `status`, `created_at`, `updated_at` |
| `roles` | `id`, `role_code`, `role_name`, `is_active` |
| `permissions` | `id`, `permission_code`, `permission_name` |
| `role_permissions` | `role_id`, `permission_id` |
| `projects` | `id`, `project_code`, `project_name`, `description`, `status`, `created_by_user_id`, `created_at`, `updated_at`, `updated_by_user_id`, `closed_at`, `closed_by_user_id` |
| `project_memberships` | `id`, `project_id`, `user_id`, `official_role`, `status`, `assigned_by_user_id`, `assigned_at`, `updated_at`, `updated_by_user_id` |
| `user_project_preferences` | `user_id`, `active_project_id`, `updated_at` |
| `engineering_documents` | `id`, `project_id`, `document_number`, `description`, `drawing`, `area`, `days_until_validation`, `workflow_status`, `lifecycle_status`, `revision_label`, `responsible_role`, `current_assignee_user_id`, `active_revision_id`, `active_file_id`, `created_by_user_id`, `created_at`, `updated_at`, `updated_by_user_id`, `archived_at`, `archived_by_user_id`, `archive_reason`, `restored_at`, `restored_by_user_id`, `sla_started_at`, `sla_stopped_at`, `sla_assignee_name_snapshot` |
| `document_revisions` | `id`, `project_id`, `document_id`, `revision_label`, `file_id`, `storage_path_legacy`, `is_active`, `created_at`, `created_by_user_id` |
| `temporary_uploads` | `id`, `temporary_file_id`, `storage_key`, `original_file_name`, `physical_file_name`, `mime_type`, `extension`, `file_size`, `checksum`, `uploaded_at`, `expires_at`, `consumed_at`, `created_by_user_id` |
| `stored_files` | `file_id`, `project_id`, `document_id`, `original_file_name`, `physical_file_name`, `file_extension`, `mime_type`, `file_size`, `storage_key`, `relative_path`, `file_category`, `checksum`, `uploaded_by_user_id`, `uploaded_at`, `is_active` |
| `workflow_comments` | `id`, `project_id`, `document_id`, `revision_id`, `workflow_action`, `workflow_comment`, `created_by_user_id`, `created_by_name_snapshot`, `created_by_official_role_snapshot`, `created_at` |
| `workflow_attachments` | `attachment_id`, `comment_id`, `project_id`, `document_id`, `file_id`, `uploaded_by_user_id`, `uploaded_at` |
| `document_history` | `id`, `project_id`, `document_id`, `workflow_event`, `activity`, `workflow_status`, `revision_label`, `lifecycle_status`, `reason`, `created_at`, `created_by_user_id`, `created_by_name_snapshot`, `created_by_official_role_snapshot` |
| `comment_read_receipts` | `id`, `project_id`, `document_id`, `comment_id`, `user_id`, `read_at` |
| `document_sla_evaluations` | `id`, `project_id`, `document_id`, `cycle_id`, `current_state`, `notified_states`, `updated_at` |
| `notifications` | `id`, `identity_key`, `project_id`, `recipient_user_id`, `recipient_project_membership_id`, `event_type`, `title`, `message`, `priority`, `official_role`, `recipient_role`, `related_resource_type`, `related_resource_id`, `related_document_number`, `action_target`, `is_read`, `read_at`, `created_at`, `metadata` |
| `audit_trail` | `id`, `identity_key`, `project_id`, `actor_user_id`, `actor_name`, `department`, `official_role`, `action`, `business_event`, `detail`, `resource_type`, `resource_id`, `reference`, `metadata`, `occurred_at`, `is_hidden`, `hidden_at`, `hidden_by_user_id` |
| `system_metadata` | `key`, `value`, `updated_at` |

Attribute naming notes:

| Frontend Name | Backend Name | Reason |
|---|---|---|
| `createdDate`, `createdAt` | `created_at` | Timestamp consistency. |
| `lastUpdated`, `updatedAt` | `updated_at` | Timestamp consistency. |
| `documentNumber` | `document_number` | Preserve business identity. |
| `storagePath` | `storage_path_legacy` or `relative_path` | Frontend compatibility vs Storage Strategy target. |
| `fileName` | `original_file_name` | Storage Strategy says original filename is user-facing name. |
| `isDeleted` in audit | `is_hidden` | Current behavior is soft hide, not business delete. |
| `slaStateEvaluation` | `document_sla_evaluations` fields | Persistent marker, not display data. |
| `createdAt`, `timestamp` | `occurred_at` | Audit Trail canonical timestamp. |

---

# 9. Constraint Specification

| Constraint | Table | Evidence |
|---|---|---|
| Username must be unique | `users.username` | UserService `checkUsernameUniqueness`; IndexedDB unique username. |
| Email must be unique | `users.email` | UserService `checkEmailUniqueness`. |
| User status must be Active/Inactive | `users.status` | User constants and service. |
| Department name key must be unique | `departments.name_key` | IndexedDB unique `nameKey`; DepartmentService uniqueness. |
| Department status must be Active/Inactive | `departments.status` | Department constants. |
| Active user assignment requires active department | User write flow | UserService `assertAssignableDepartment`. |
| Project code must be unique | `projects.project_code` | IndexedDB unique `projectCode`; ProjectService uniqueness. |
| Project status values limited to Active/Inactive/Closed | `projects.status` | Project constants. |
| Closed project is final | `projects.status` | Project close service and governance decision. |
| Active membership requires active project and active user | `project_memberships` | ProjectService validation. |
| Membership status must be Active/Inactive | `project_memberships.status` | Project constants. |
| Official role must be Admin/Document Owner/Team Process/Team Project | `project_memberships.official_role` | Project constants and workflow role checks. |
| One membership per user per project | `project_memberships(project_id, user_id)` | Active project resolution and official role handling assume one authoritative membership record per user in each project. |
| Membership official role is singular | `project_memberships.official_role` | Each user has one official operational role within a project membership. |
| Document number unique within project | `engineering_documents(project_id, document_number)` | DocumentService `assertDocumentNumberIsUnique`. |
| Document drawing must be PFD or P&ID | `engineering_documents.drawing` | Drawing context constants/routes. |
| Document workflow status must match known workflow statuses | `engineering_documents.workflow_status` | Document constants and transition matrices. |
| Document lifecycle must be Active/Archived | `engineering_documents.lifecycle_status` | Document lifecycle constants. |
| Archive requires Approved + Active lifecycle + Active Project + Admin | Application invariant | DocumentService `archiveDocument`. |
| Restore requires Archived + Active Project + Admin | Application invariant | DocumentService `restoreDocument`. |
| Upload revision only from Comment/Reject states | Application invariant | `uploadRevisionTransitionMatrix`. |
| Only one active revision per document | `document_revisions` | Upload revision sets previous active revisions inactive. |
| Active document file must be one revision file of same document | `engineering_documents.active_file_id` | Storage Strategy CONS-005; create/upload flows. |
| Stored file has one metadata record | `stored_files.file_id` and `storage_key` | Storage Strategy SR-002/SR-017. |
| Physical file name immutable after permanent storage | `stored_files.physical_file_name` | Storage Strategy SR-024. |
| Workflow attachment is not revision | `workflow_attachments`, `stored_files.file_category` | Storage Strategy SR-007; WorkflowAttachmentService. |
| Workflow attachment belongs to one workflow comment | `workflow_attachments.comment_id` | Storage Strategy CONS-004. |
| Max one attachment per workflow comment | `workflow_attachments.comment_id` unique | Current frontend stores a single `attachment` object per comment. |
| Comment read receipt unique per user/comment | `comment_read_receipts(user_id, comment_id)` | Frontend id `${userId}:${commentId}`. |
| Notification identity key unique | `notifications.identity_key` | IndexedDB unique identityKey and duplicate checks. |
| Audit identity key unique | `audit_trail.identity_key` | IndexedDB unique identityKey and duplicate checks. |
| Password reset token hash unique | `password_reset_tokens.token_hash` | Token lookup by token; backend stores hash. |
| Role-permission pair unique | `role_permissions(role_id, permission_id)` | RolePermissions mapping. |
| SLA evaluation unique per cycle | `document_sla_evaluations(document_id, cycle_id)` | Prevents duplicate notification marker records for the same document SLA cycle. |

Permission code canonical rule:

Frontend permission codes are canonical for backend seed/catalog because latest frontend source has higher authority than older source-of-truth names. Therefore, codes such as `document-register.view`, `sla-monitoring.view`, `escalation.view`, `storage.view`, and `approval.a/b/c` must be preserved unless the frontend is changed later.

---

# 10. Lifecycle Specification

## 10.1 User

```text
Active
  -> Inactive
Inactive
  -> Active
```

Rules:

- New user is Active.
- Delete user is unsupported.
- Credential active state mirrors user active state.

## 10.2 Department

```text
Active
  -> Inactive
Inactive
  -> Active
```

Rules:

- Delete department is unsupported.
- User creation/update requires active department unless unchanged current department.

## 10.3 Project

```text
Active
  -> Inactive
Inactive
  -> Active
Active
  -> Closed
Closed
  -> Final
```

Rules:

- Closed project cannot become Active or Inactive again.
- Project Close requires Admin and no active workflow documents.
- Approved Active documents are auto-archived during close.
- Closed project is excluded from active project context.

## 10.4 Project Membership

```text
Active
  -> Inactive
Inactive
  -> Active
```

Rules:

- Active membership requires active user and active project.
- Closed project membership is read-only.
- Membership provides active project official role.

## 10.5 Engineering Document Workflow Status

```text
Process Review
  -> Approval A -> Project Review
  -> Approval B -> Process Comment
  -> Approval C -> Process Reject

Project Review
  -> Approval A -> Approved
  -> Approval B -> Project Comment
  -> Approval C -> Project Reject

Process Comment / Process Reject
  -> Upload Revision -> Process Review

Project Comment / Project Reject
  -> Upload Revision -> Project Review
```

Rules:

- Workflow actions require project official role and permission.
- Approval B/C may create workflow comment and attachment.
- Approved stops SLA.

## 10.6 Engineering Document Lifecycle

```text
Active
  -> Archived
Archived
  -> Active
```

Rules:

- Archive requires Approved, Active Project, Admin.
- Restore requires Archived, Active Project, Admin.
- Archive/Restore do not move files.
- Project Close auto-archives eligible Approved Active documents.

## 10.7 Document Revision

```text
Active Revision
  -> Superseded
New Revision
  -> Active Revision
```

Rules:

- Upload Revision creates new revision and new file.
- Previous revision remains history.
- Revision file is immutable.

## 10.8 Stored File

```text
Prepared/Uploaded Metadata
  -> Permanent Stored File
Permanent Stored File
  -> Retained
```

Rules:

- Database stores metadata only.
- Physical file is not stored in database.
- Physical file name is immutable after permanent storage.
- Archive, Restore, and Project Close do not move or rename files.

## 10.9 Notification

```text
Unread
  -> Read
Read or Unread
  -> Deleted by recipient in current frontend behavior
```

Rules:

- Notification is personal to recipient and project.
- Read state is per recipient.
- Current frontend supports personal delete; retention policy is backend governance concern.

## 10.10 Audit Trail

```text
Visible
  -> Hidden
```

Rules:

- Audit records are not hard-deleted in normal business flow.
- Admin can soft-hide visible records.
- Hidden records are excluded from audit page list/detail.

## 10.11 SLA Evaluation

```text
Cycle Created
  -> Current State Updated
  -> Notified State Marked
New SLA Cycle
  -> New Evaluation State
```

Rules:

- SLA timer/status are derived.
- `document_sla_evaluations` stores idempotency marker only.

---

# 11. Storage Mapping

## 11.1 Storage Responsibility by Entity

| Frontend Source | Backend Table | Storage Responsibility | File Responsibility | Retention Responsibility |
|---|---|---|---|---|
| `documents.fileMetadata`, `files.metadata` | `stored_files` | Store official file metadata only | Physical file stored outside database | Retain all revision files |
| `documents.activeFileId` | `engineering_documents.active_file_id` | Point to active file metadata | Active file selected by business workflow | Retain pointer changes through revision history |
| `documentRevisions.activeFileId` | `document_revisions.file_id` | Link revision to one official stored file record | Revision file immutable | Retain revision and file metadata |
| `workflowComments.attachment` | `workflow_attachments` + `stored_files` | Attachment metadata separate from revision | Attachment file not active document | Retain with workflow comment |
| `storagePath` | `stored_files.relative_path` / `storage_key` | Backend storage lookup by metadata | No absolute path exposed to business layer | Storage provider independent |
| `originalFileName` | `stored_files.original_file_name` | User-facing filename | Used for download/display | Retain original value |
| No frontend physical name | `stored_files.physical_file_name` | Internal physical filename required by Storage Strategy | Hybrid name generated by storage layer | Immutable after permanent storage |

## 11.2 Storage Rules Applied

| Storage Strategy Rule | Database Mapping |
|---|---|
| Database stores metadata only | `stored_files` stores metadata; no file/blob column. |
| Every file has one metadata record | `stored_files.file_id` is one official file identity. |
| Every file belongs to one Project | `stored_files.project_id` required. |
| Every document has one active file | `engineering_documents.active_file_id` points to `stored_files.file_id`. |
| Upload Revision creates new file | New `document_revisions` and `stored_files` record. |
| Workflow Attachment is not Revision | `workflow_attachments` links to `stored_files`, not to active revision. |
| Archive/Restore/Project Close do not affect storage | Document/project status fields change; file metadata remains. |
| User download uses Original File Name | `stored_files.original_file_name` preserved. |
| Physical File Name is internal and immutable | `stored_files.physical_file_name` is separate from original filename. |

## 11.3 File Categories

| Category | Evidence | Table Mapping |
|---|---|---|
| Active Document File | Document active file pointer | `stored_files.file_category`, `engineering_documents.active_file_id` |
| Revision File | Upload revision/history | `document_revisions.file_id` |
| Workflow Attachment | Approval B/C attachment | `workflow_attachments.file_id` |

---

# 12. Traceability Matrix

| Feature | Workflow | Entity | Key Attributes | Relationship | Evidence |
|---|---|---|---|---|---|
| Login | Authenticate active user/credential | `users`, `user_credentials` | `username`, `password_hash`, `is_active` | User 1:1 Credential | AuthService.login, `users`, `userCredentials` stores |
| Forgot Password | Create reset token and mock email | `password_reset_tokens`, `mock_emails` | `request_id`, `token_hash`, `expires_at`, `revoked_at` | User 1:N Tokens | AuthService.forgotPassword |
| Reset Password | Use token once and update credential | `password_reset_tokens`, `user_credentials` | `used_at`, `password_hash`, `updated_at` | Token N:1 User | AuthService.resetPassword |
| User Management | Create/update/activate/deactivate user | `users`, `user_credentials`, `departments` | `username`, `email`, `status`, `department_id` | Department 1:N Users | UserService, user schemas |
| Department Management | Create/update/status department | `departments` | `name`, `name_key`, `status` | Department 1:N Users | DepartmentService |
| Authorization | Protect routes/actions | `roles`, `permissions`, `role_permissions`, `users` | `role_id`, `permission_code` | Role M:N Permission | AuthorizationService, `users.json` |
| Project Management | Create/update/status project | `projects` | `project_code`, `project_name`, `status` | Project owns scoped data | ProjectService |
| Project Membership | Grant project access/official role | `project_memberships` | `project_id`, `user_id`, `official_role`, `status` | Project 1:N Membership; User 1:N Membership | ProjectService |
| Active Project | Remember selected project | `user_project_preferences` | `user_id`, `active_project_id` | User 1:0..1 Preference | `edms.activeProjectByUser` |
| Create Document | Create document, revision, file, history | `engineering_documents`, `document_revisions`, `stored_files`, `document_history` | `document_number`, `active_revision_id`, `active_file_id`, `sla_started_at` | Project 1:N Documents | DocumentService.createDocument |
| Document Register | List/search/filter documents | `engineering_documents` | `drawing`, `area`, `workflow_status`, `lifecycle_status`, `revision_label` | Project 1:N Documents | useDocumentRegisterTable |
| Approval A | Move review forward | `engineering_documents`, `document_history`, `notifications`, `audit_trail` | `workflow_status`, `revision_label`, `responsible_role` | Document 1:N History | processWorkflowAction |
| Approval B/C | Comment/reject with optional attachment | `workflow_comments`, `workflow_attachments`, `stored_files` | `workflow_comment`, `workflow_action`, `file_id` | Comment 1:0..1 Attachment | processWorkflowAction, WorkflowAttachmentService |
| Upload Revision | Create new active revision/file | `document_revisions`, `stored_files`, `engineering_documents`, `document_history` | `is_active`, `file_id`, `active_file_id` | Document 1:N Revisions | processUploadRevision |
| Viewer/Download | Resolve active file metadata | `stored_files`, `engineering_documents` | `original_file_name`, `mime_type`, `storage_key`, `active_file_id` | Document N:1 Active File | FileService.getDocumentPreview/downloadDocumentFile |
| Workflow Comments | Display comments and attachments | `workflow_comments`, `workflow_attachments` | `created_by_official_role`, `workflow_comment`, `attachment_id` | Document 1:N Comments | getWorkflowCommentsByDocumentId |
| Comment Read | Track unread/read comments | `comment_read_receipts` | `user_id`, `comment_id`, `read_at` | User+Comment receipt | CommentReadService |
| Archive | Archive approved document | `engineering_documents`, `document_history`, `audit_trail` | `lifecycle_status`, `archived_at`, `archive_reason` | Document 1:N History | archiveDocument |
| Restore | Restore archived document | `engineering_documents`, `document_history`, `audit_trail` | `lifecycle_status`, `restored_at` | Document 1:N History | restoreDocument |
| Project Close | Close project and auto-archive docs | `projects`, `engineering_documents`, `document_history`, `audit_trail` | `status`, `closed_at`, `archived_at` | Project 1:N Documents | ProjectService.closeProject |
| SLA Monitoring | Track notification state per SLA cycle | `engineering_documents`, `document_sla_evaluations`, `notifications` | `sla_started_at`, `sla_stopped_at`, `cycle_id`, `notified_states` | Document 1:N SLA Evaluations | SlaMonitoringService |
| Escalation Alert | Show overdue documents and audit event | `engineering_documents`, `audit_trail`, `notifications` | `sla_started_at`, `days_until_validation`, `identity_key` | Project-scoped audit/notification | EscalationService |
| Notification List | Personal notification inbox/read/hard delete | `notifications` | `recipient_user_id`, `project_id`, `is_read`, `read_at` | User 1:N Notifications | NotificationService |
| Audit Trail | Activity list/detail/soft hide | `audit_trail` | `identity_key`, `action`, `resource_type`, `is_hidden` | Project 1:N Audit | AuditTrailService |

---

# 13. Backend Readiness

## 13.1 Ready for Backend Implementation

The following schema areas are ready as backend architecture because they have direct implementation evidence and clear persistence needs:

- User, credential, password reset token.
- Department.
- Role, permission, role permission.
- Project and project membership.
- User project preference.
- Engineering document, revision, and history.
- Stored file metadata.
- Workflow comment and attachment.
- Comment read receipt.
- SLA evaluation marker.
- Notification.
- Audit trail.
- System metadata.

## 13.2 Required Backend Cautions

| Area | Caution |
|---|---|
| Passwords | Frontend stores plaintext demo passwords; backend must store password hash only. |
| Reset tokens | Frontend stores raw token; backend must store token hash and show raw token only in outbound reset link. |
| File storage | Database must not store physical files or expose direct physical path. |
| Permission catalog | Use frontend permission codes as canonical unless frontend changes. |
| Official role | Keep system `users.role_id` separate from `project_memberships.official_role`. |
| Audit hide | Preserve soft hide behavior while retaining records. |
| Notification delete | Notification is User Inbox and may be hard deleted by the User. Audit Trail remains system evidence that the notification event occurred. |
| Mock emails | Non-production only. |
| Active project preference | Preference only; never a business workflow dependency. |
| SLA/Escalation | SLA status/timer and escalation level remain derived. Only SLA notification marker persists. |

## 13.3 Explicit Non-Goals

This document does not define:

- API endpoints.
- SQL DDL.
- SQL migrations.
- ORM models.
- Backend repositories.
- Backend services.
- Controllers.
- Stored procedures.
- Triggers.
- Graphical ERD.
- UI changes.
- Workflow changes.

---

# 14. Summary

`DATABASE-SCHEMA.md` defines the EDMS backend database architecture based on current frontend evidence and Phase B audit.

Core decisions:

- Persistent frontend data is mapped to backend tables.
- Derived data is not stored as tables.
- Runtime and presentation state are excluded.
- Storage metadata is centralized in `stored_files`.
- File physical content remains outside the database.
- Workflow attachments are separate from document revisions.
- Document lifecycle and workflow status are separate concepts.
- Project Membership is the operational source of project official role.
- User role remains the system authorization role source.
- SLA timer/status and escalation level remain calculated; only SLA notification idempotency state persists.
- Audit trail preserves existing soft hide behavior.

This document is ready to serve as the primary Source of Truth for backend database implementation, subject to the stated restriction that implementation artifacts must be created in a later phase.

---

# 15. Backend Database Implementation Blueprint

## 15.1 Scope Boundary

Bagian ini menurunkan conceptual schema menjadi aturan implementasi backend MySQL.

Bagian ini tidak membuat:

- `schema.sql`.
- migration.
- seed.
- ORM model.
- executable database artifact.

## 15.2 MySQL Datatype Rules

| Data Category | MySQL Implementation Rule |
|---|---|
| Identifier string | `VARCHAR(64)` atau panjang yang sesuai pola identifier bisnis seperti `PRJ-*`, `PMB-*`, `FILE-*` |
| Numeric internal id | `BIGINT UNSIGNED` untuk id teknis auto-increment bila tidak menggunakan string id |
| Short code | `VARCHAR(64)` dengan unique index bila menjadi kode bisnis |
| Name/title | `VARCHAR(255)` |
| Description/detail/reason/comment | `TEXT` |
| Email/username | `VARCHAR(255)` dengan normalized unique strategy |
| Status enum | `VARCHAR(64)` dengan service validation dan optional MySQL check constraint |
| Timestamp | `DATETIME(3)` atau `TIMESTAMP(3)` disimpan dalam UTC |
| Boolean | `TINYINT(1)` |
| File size | `BIGINT UNSIGNED` |
| JSON metadata | MySQL `JSON` hanya untuk metadata fleksibel, notification metadata, audit metadata, dan SLA marker object |
| Hash/checksum/token hash | `VARCHAR(255)` atau panjang sesuai algoritma |

## 15.3 Timestamp Rule

- Semua timestamp disimpan dalam UTC.
- Display WIB adalah presentation concern dan tidak menjadi kolom terpisah.
- `created_at` wajib tersedia pada record operasional.
- `updated_at` digunakan pada record yang dapat berubah.
- Business event timestamp audit menggunakan `occurred_at` atau nama ekuivalen yang konsisten.

## 15.4 Foreign Key Policy

| Relationship Type | FK Rule |
|---|---|
| Project scoped operational data | Wajib memiliki `project_id` dan FK ke `projects.id` |
| User ownership/actor | FK ke `users.id`, nullable hanya untuk historical snapshot atau system event |
| Document child data | FK ke `engineering_documents.id` |
| Revision file | FK dari `document_revisions.file_id` ke `stored_files.file_id` |
| Workflow attachment file | FK dari `workflow_attachments.file_id` ke `stored_files.file_id` |
| Notification recipient | FK ke `users.id` dan optional FK ke `project_memberships.id` |
| Authorization catalog | FK `role_permissions.role_id` dan `role_permissions.permission_id` wajib enforced |
| Refresh session | FK ke `users.id` wajib enforced |

Backend tidak boleh mempercayai `projectId` dari client tanpa validasi Project Membership dan resource ownership.

## 15.5 Cascade Policy

Default policy adalah restrict/no cascade delete untuk business data.

| Area | Cascade Policy |
|---|---|
| Users | Tidak hard delete user yang memiliki audit, notification, document, atau membership |
| Projects | Tidak hard delete project; gunakan status Active/Inactive/Closed |
| Documents | Tidak hard delete document; gunakan lifecycle Active/Archived |
| Revisions and files | Tidak cascade delete; file dan revision history retained |
| Workflow comments/attachments | Tidak cascade delete; retained sebagai workflow history |
| Audit trail | Tidak hard delete; soft hide only |
| Notifications | Personal hard delete is allowed because Notification is User Inbox, not system evidence. Audit Trail preserves evidence. |
| Refresh sessions | Boleh hard delete setelah expired sesuai retention policy karena bukan business history |
| Password reset tokens | Boleh purge setelah expired/used sesuai retention policy |

## 15.6 Index Strategy

Minimal index yang harus disiapkan pada implementasi MySQL:

| Table | Index Strategy |
|---|---|
| `users` | unique username, unique email, role_id, department_id, status |
| `departments` | unique name_key, status |
| `roles` | unique role_code, is_active |
| `permissions` | unique permission_code |
| `role_permissions` | unique role_id + permission_id |
| `projects` | unique project_code, status |
| `project_memberships` | unique project_id + user_id, user_id, official_role, status |
| `engineering_documents` | project_id + document_number unique, project_id + workflow_status, project_id + lifecycle_status, active_file_id |
| `document_revisions` | document_id + revision_sequence unique, document_id + is_active, file_id |
| `stored_files` | unique file_id, unique storage_key, project_id, document_id, file_category |
| `workflow_comments` | project_id + document_id, revision_id, created_at |
| `workflow_attachments` | unique comment_id, file_id |
| `notifications` | unique identity_key where applicable, recipient_user_id + project_id + read_status, created_at |
| `audit_trail` | project_id + occurred_at, actor_user_id, resource_type + resource_id, identity_key |
| `document_sla_evaluations` | unique document_id + cycle_id, project_id |
| `refresh_sessions` | user_id, session_family_id, refresh_token_hash unique, revoked_at, expires_at |
| `password_reset_tokens` | token_hash unique, user_id, expires_at, used_at |

## 15.7 Unique Strategy

- Business uniqueness must be enforced both in service validation and database unique index.
- Document number is unique within project, not globally.
- One project membership is allowed per user per project.
- Only one workflow attachment is allowed per workflow comment.
- Notification idempotency uses `identity_key`.
- SLA idempotency uses `document_id + cycle_id`.
- Active revision uniqueness must be enforced using a MySQL-compatible strategy, such as service transaction plus generated key/flag pattern.

## 15.8 JSON Column Usage

JSON columns are allowed only for:

- Notification metadata.
- Audit metadata.
- SLA notified states marker.
- Flexible technical metadata.

JSON columns must not replace normalized core relationships such as user, project, document, revision, stored file, workflow comment, workflow attachment, role, permission, or project membership.

## 15.9 Refresh Session Persistence

Backend requires a technical persistence model for refresh token sessions.

Conceptual table:

```text
refresh_sessions
```

Minimum attributes:

| Attribute | Requirement |
|---|---|
| `id` | Stable session id |
| `user_id` | FK to users |
| `session_family_id` | Groups rotated tokens from the same device session |
| `device_id` | Device-aware identifier |
| `device_name` | User agent/device label snapshot |
| `refresh_token_hash` | Hash of current refresh token |
| `previous_token_hash` | Optional previous token marker for rotation detection |
| `issued_at` | UTC timestamp |
| `expires_at` | UTC timestamp |
| `rotated_at` | UTC timestamp when token rotates |
| `revoked_at` | UTC timestamp when revoked |
| `revoked_reason` | Logout, force logout, password change, reset password, reuse detected |
| `last_used_at` | UTC timestamp |
| `created_ip` | Optional security metadata |
| `last_ip` | Optional security metadata |

Rules:

- Refresh token is persistent, revocable, and device aware.
- Refresh token rotation revokes or supersedes the previous token.
- Logout revokes the current session.
- Force logout revokes selected or all user sessions.
- Password change and password reset revoke active sessions.
- Raw refresh token is never stored.

## 15.10 Seed Boundary

Seed implementation is allowed only in the backend implementation phase and must be limited to:

- Bootstrap Admin user.
- Admin credential hash.
- Required department for bootstrap user.
- Fixed role catalog.
- Fixed permission catalog.
- Role-permission mapping.

Seed must not include operational demo projects, documents, revisions, workflow comments, notifications, audit trails, SLA records, escalation records, or file records.

## 15.11 Stored File Storage Key Rule

`stored_files.storage_key` and `stored_files.relative_path` store normalized relative storage keys.

Canonical revision file key:

```text
projects/{PROJECT_CODE}/documents/{DOCUMENT_NUMBER}/revisions/{REVISION}/{PHYSICAL_FILE_NAME}
```

Physical filename:

```text
{DOCUMENT_NUMBER}_{REVISION}_{SUBMIT_DATE_YYYYMMDD}_{SHORT_FILE_ID}_{SANITIZED_ORIGINAL_FILE_NAME}
```

Database relationships continue to use internal identifiers (`project_id`, `document_id`, `revision_id`, `file_id`). Physical project directory uses `projects.project_code`.

Workflow attachment key:

```text
projects/{PROJECT_CODE}/documents/{DOCUMENT_NUMBER}/attachments/process-comments/{ATTACHMENT_FILE_NAME}
projects/{PROJECT_CODE}/documents/{DOCUMENT_NUMBER}/attachments/project-comments/{ATTACHMENT_FILE_NAME}
```

`original_file_name` remains the download/display filename.
