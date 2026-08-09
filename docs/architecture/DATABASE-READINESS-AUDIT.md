# Database Readiness Audit

Document status: Technical Audit Artifact  
Phase: Phase 1 - Database Readiness Audit  
Date: 2026-07-21  
Scope boundary: Audit and analysis only. This document is not a new Source of Truth.
Current status: Historical / Legacy Readiness Audit  
Runtime alignment: Source code saat ini sudah memiliki backend Express, MySQL schema/runtime, repository/service/controller layer, storage metadata, temporary upload lifecycle, notification/audit/SLA support, dan realtime SSE. Pernyataan seperti backend absent, IndexedDB sebagai runtime utama, atau endpoint candidate lama pada dokumen ini dipertahankan sebagai historical context dan tidak menggantikan `DATABASE-SCHEMA.md`, `API-CONTRACT.md`, `BACKEND-FOUNDATION.md`, atau source code runtime terbaru.

## 1. Executive Summary

Frontend EDMS is treated as Frozen for this audit. Existing UI, service layer, IndexedDB persistence, mock data, and project context behavior are the operational reference for backend/database design.

The audit found that the frontend already models most backend data needs through IndexedDB stores, service validations, and workflow side effects. After Domain 4 normalization, `DATABASE-SCHEMA.md` is the official database schema document. This readiness audit is a supporting technical artifact and does not override frozen Domain 1-4 documentation.

Summary count:

| Item | Count |
|---|---:|
| Audited domains | 24 |
| Candidate entities | 29 |
| Candidate persistent tables | 27 |
| Candidate junction tables | 4 |
| Candidate indexes | 31 |
| Gap records | 18 |
| Conflict records | 6 |
| Verdict | READY FOR STORAGE STRATEGY DESIGN |

## 2. Audit Scope

Audited domains:

| No | Domain |
|---:|---|
| 1 | Authentication |
| 2 | User Management |
| 3 | Department Management |
| 4 | Role and Permission |
| 5 | Project Management |
| 6 | Project Membership |
| 7 | Active Project Context |
| 8 | Engineering Document |
| 9 | Document Type and Drawing |
| 10 | Area |
| 11 | Document Revision |
| 12 | Stored File Metadata |
| 13 | Workflow Comment |
| 14 | Workflow Attachment |
| 15 | Approval Workflow |
| 16 | Document History and Revision History |
| 17 | SLA |
| 18 | Escalation |
| 19 | Notification |
| 20 | Audit Trail |
| 21 | Archive Document |
| 22 | Project Close |
| 23 | Reset All Demo Data |
| 24 | Viewer and Download |

## 3. Sources Reviewed

Primary preparation:

| Source | Status | Notes |
|---|---|---|
| `docs/ai/AI-IMPLEMENTATION-GUIDE.md` | Reviewed | Reading order and phase boundary confirmed. |
| `docs/source-of-truth/BUSINESS-WORKFLOW.md` | Reviewed | Primary behavior reference. |
| `docs/source-of-truth/PRD.md` | Reviewed | Product domains, multi-project, escalation, close project, appendix. |
| `docs/source-of-truth/ACCESS-CONTROL.md` | Reviewed | Role/permission and route/action authorization. |
| `docs/source-of-truth/API-CONTRACT.md` | Reviewed | Backend endpoint direction only; no endpoint implemented. |
| `docs/source-of-truth/STATE-MANAGEMENT.md` | Reviewed | Server/global/runtime state boundaries. |
| `docs/source-of-truth/MOCK-DATA.md` | Reviewed | Seed and mock dataset expectations. |
| `docs/source-of-truth/FORM-SPEC.md` | Reviewed | Form and validation reference. |
| `docs/source-of-truth/ROUTING.md` | Reviewed | Auth, project gateway, operational route scope. |
| `docs/source-of-truth/COMPONENT-SPEC.md` | Reviewed | UI behavior support. |
| `docs/source-of-truth/UI-GUIDELINES.md` | Reviewed | Frontend freeze support. |
| `docs/source-of-truth/IMPLEMENTATION-PLAN.md` | Reviewed | Implementation context. |
| `docs/source-of-truth/ENGINEERING-FOUNDATION.md` | Reviewed | Foundation context. |
| `docs/source-of-truth/FILE-STRUCTURE.md` | Reviewed | File structure context. |
| `docs/source-of-truth/CODING-STANDARDS.md` | Reviewed | Boundary only. |
| `docs/source-of-truth/CHANGE-REQUEST.md` | Reviewed | CR-001 through CR-012 relevant to audit. |
| `docs/governance/DECISION-LOG.md` | Reviewed | Decision references. |
| `docs/governance/CR-012-Project-Close-v2.md` | Reviewed | Project Close supporting reference. |
| `docs/governance/KEPUTUSAN-CLOSED-PROJECT.md` | Reviewed | Project Close supporting decision note. |

Implementation folders:

| Folder | Status | Notes |
|---|---|---|
| `apps/frontend/` | Audited | Services, repositories, stores, mocks, routes, constants, pages. |
| `database/migration/` | Audited | Folder exists, no files. |
| `database/schema/` | Audited | Folder exists, no files. |
| `database/seed/` | Audited | Folder exists, no files. |
| `apps/backend/` | Audited | Folder not present in file inventory; treated as absent placeholder. |

Service files audited include auth, user, department, project, document, file, workflow attachment, notification, audit trail, SLA monitoring, escalation, reset demo, IndexedDB, browser file storage, authorization, and project context store.

## 4. Frontend Freeze Confirmation

Frontend is the behavioral Source of Truth for this phase. No UI, frontend source, backend source, schema, migration, seed, API, controller, repository, service, database connection, or upload folder was changed.

The audit respects the Golden Rule:

| Rule | Audit Result |
|---|---|
| Frontend behavior must be preserved | Confirmed. |
| Database will become structural Source of Truth | Phase 2 concern. |
| Do not simplify business workflow | Confirmed. |
| Record gaps without implementing | Confirmed. |

## 5. Domain Inventory

| Domain | Persistence Need | Key Frontend Evidence | Notes |
|---|---|---|---|
| Authentication | Mixed permanent/runtime | `AuthService`, password reset repositories, `localStorage` current user | Session is runtime; credentials/tokens permanent. |
| User Management | Permanent | `UserService`, `users`, `userCredentials` stores | User identity separate from credential. |
| Department | Permanent | `DepartmentService`, `departments` store | Master data Active/Inactive. |
| Role and Permission | Permanent catalog | `users.json`, `AuthorizationService` | Fixed role catalog in frontend; not user global official role for operations. |
| Project | Permanent | `ProjectService`, `projects` store | Active/Inactive/Closed lifecycle. |
| Project Membership | Permanent | `ProjectMembershipRepository` | Operational official role source. |
| Active Project Context | Runtime/session plus local preference | Zustand store and `edms.activeProjectByUser` | Do not make all state a table. |
| Engineering Document | Permanent project-scoped | `DocumentService`, `documents` store | Global `id`, project-scoped `documentNumber`. |
| Revision | Permanent project-scoped | `documentRevisions` store | Active revision plus history. |
| File Metadata | Permanent | document `fileMetadata`, IndexedDB `files` metadata | File blob storage strategy pending. |
| Workflow Comment | Permanent project-scoped | `workflowComments` store | Stores actor official role snapshot. |
| Workflow Attachment | Permanent metadata plus file storage | `WorkflowAttachmentService` | Not a document revision. |
| SLA | Partial persistent, mostly derived | `SlaEngineService`, `slaStateEvaluation` | Timer not stored. |
| Escalation | Mostly derived plus event/audit/notification marker | `EscalationService`, notification identity keys | Level is derived. |
| Notification | Permanent personal records | `NotificationService` | Per recipient, per project. |
| Audit Trail | Permanent append-preferred with hide flag | `AuditTrailService` | Soft hide supported for Admin. |
| Archive | Permanent lifecycle fields | `archiveDocument`, `restoreDocument` | Same document table. |
| Project Close | Transactional permanent state change | `closeProject` | Requires transaction across project, document, history. |
| Reset Demo | Non-production utility | `DemoDataResetService` | Endpoint candidate only, feature-flagged. |
| Viewer/Download | File metadata/access | `FileService`, preview components | DB does not render. |

## 6. Entity Inventory

| Entity | Scope | Source | Purpose | Candidate Table | Notes |
|---|---|---|---|---|---|
| User Account | Global | Frontend, PRD | Identity and account lifecycle | `users` | Official role legacy only; operational role from membership. |
| User Credential | Global sensitive | Frontend | Password/auth credential lifecycle | `user_credentials` | Store hash in backend, not plaintext. |
| Password Reset Token | Global sensitive | Frontend, CR-011 | Reset password token lifecycle | `password_reset_tokens` | Store token hash; single use, TTL, revocation. |
| Mock Email | Dev only | Frontend, CR-011 | Development reset email simulation | `mock_emails` or non-prod only | Do not enable in production. |
| Department | Global | CR-002, Frontend | User department master data | `departments` | Active/Inactive, unique name. |
| System Role | Global catalog | Frontend, Access Control | Authorization role catalog | `roles` | Fixed catalog currently. |
| Permission | Global catalog | Frontend, Access Control | Permission catalog | `permissions` | Codes differ from some docs; reconcile before schema seed. |
| Role Permission | Global junction | Frontend | RBAC mapping | `role_permissions` | Many-to-many. |
| Project | Global admin, owns scoped data | PRD, CR-004, CR-012 | Multi-project unit | `projects` | Status Active/Inactive/Closed. |
| Project Membership | Project-scoped junction | Frontend, CR-004 | User access and official role per project | `project_memberships` | Unique project+user. |
| Active Project Preference | Runtime/local preference | Frontend | Last selected project per user | Optional `user_project_preferences` | Can also be session/profile preference; not required for workflow. |
| Engineering Document | Project-scoped | Frontend, CR-004 | Main document register record | `documents` | Global document id; project+number unique. |
| Document Revision | Project-scoped | Frontend | Revision history and active file link | `document_revisions` | Active/superseded state. |
| Stored File | Project-scoped or linked | Frontend file services | Storage metadata record | `stored_files` | Blob not designed in Phase 1. |
| Document History | Project-scoped | Frontend | Timeline/history presentation | `document_history` | Preserve even if lifecycle changes. |
| Workflow Comment | Project-scoped | Frontend, CR-001 | Review comments | `workflow_comments` | Actor role snapshot required. |
| Workflow Attachment | Project-scoped | Frontend, CR-001 | Attachment metadata for Approval B/C | `workflow_attachments` | Max one per workflow comment. |
| Comment Read Receipt | Project-scoped/personal | Frontend | Read tracking for workflow comments | `comment_read_receipts` | Present in IndexedDB. |
| Notification | Project-scoped/personal | CR-003, Frontend | Personal user notifications | `notifications` | Each user has own read state. |
| Audit Trail | Mixed global/project | Frontend | Activity record | `audit_trail` | Hidden flag, not hard delete. |
| SLA State Evaluation | Project-scoped | Frontend | Notification marker per SLA cycle | `document_sla_evaluations` or document fields | Avoid repeated SLA notifications. |
| Escalation Event Marker | Project-scoped | Frontend | Idempotency/audit marker | `escalation_events` optional | May be covered by audit/notification identity keys. |
| Document Type/Drawing | Fixed catalog | Frontend constants | PFD and P&ID category | Enum/check or `document_types` | Fixed catalog now; table only if future category admin needed. |
| Area | Project/document attribute | Frontend forms/services | Document area filtering/display | `documents.area` or future `areas` | Current frontend treats as text attribute. |
| Project Closure Event | Project-scoped | Frontend close project | Closure summary and reason | `project_closure_events` optional | Useful for transaction audit/closure metadata. |
| Seed Metadata | Global technical | Frontend metadata store | Migration/seed version marker | Backend migrations metadata | Not business data. |
| Reset Demo Execution | Non-prod technical | Frontend reset service | Operational reset audit | Audit or `demo_reset_runs` optional | Non-production only. |
| File Access Event | Project-scoped audit | Frontend download audit | Download/view trace | Audit Trail | No separate table required initially. |
| User Project Preference | User/session | Frontend localStorage | Last selected project | Optional | Do not block schema readiness on this. |

## 7. Attribute Inventory

| Entity | Required Attributes |
|---|---|
| User Account | `id`, `userCode`, `username`, `fullName/name`, `email`, `departmentId/name`, `status`, `isActive`, `createdAt`, `updatedAt`, `activatedAt`, `deactivatedAt`, legacy `roleId` if retained |
| User Credential | `userId`, `passwordHash`, `isActive`, `createdAt`, `updatedAt`, `passwordChangedAt` |
| Password Reset Token | `tokenHash`, `userId`, `requestId`, `createdAt`, `expiresAt`, `usedAt`, `revokedAt` |
| Department | `id`, `name`, `nameKey`, `status`, `createdAt`, `updatedAt`, `activatedAt`, `deactivatedAt` |
| Role | `id`, `roleCode`, `roleName`, `isActive` |
| Permission | `id`, `permissionCode`, `permissionName` |
| Project | `id`, `projectCode`, `projectName`, `description`, `status`, `createdBy`, `createdAt/createdDate`, `updatedAt/lastUpdated`, `activatedAt`, `deactivatedAt`, `closedAt`, `closedBy`, `closeReason` |
| Project Membership | `id`, `projectId`, `userId`, `officialRole`, `status`, `assignedBy/createdBy`, `assignedDate/createdAt`, `lastUpdated/updatedAt`, `lastUpdatedBy/updatedBy`, `activatedAt`, `deactivatedAt` |
| Document | `id`, `projectId`, `documentNumber`, `description`, `drawing`, `area`, `daysUntilValidation`, `status`, `lifecycle`, `revision`, `responsibleRole`, `currentAssignee`, `activeRevisionId`, `activeFileId`, `storagePath`, `createdBy`, `createdDate/createdAt`, `lastUpdated/updatedAt`, `archivedAt`, `archivedBy`, `archiveReason`, `restoredAt`, `restoredBy`, `slaStartedAt`, `slaStoppedAt`, `slaAssignee`, `slaStateEvaluation` |
| Document Revision | `id`, `projectId`, `documentId`, `revision`, `revisionSequence`, `activeFileId`, `storagePath`, `createdAt/uploadedAt`, `createdBy/uploadedBy`, `isActive`, `sourceStatus`, `resultStatus` |
| Stored File | `fileId`, `projectId`, `documentId`, `revisionId`, `commentId`, `originalFileName`, `storedFileName`, `fileExtension`, `mimeType`, `fileSize`, `storageKey`, `relativePath`, `fileCategory`, `checksum`, `uploadedBy`, `uploadedAt`, `isActive` |
| Workflow Comment | `id`, `projectId`, `documentId`, `revisionId`, `workflowAction`, `workflowComment`, `createdBy`, `createdByUserId`, `createdByOfficialRole`, `createdDate/createdAt`, `attachmentId` |
| Workflow Attachment | `attachmentId`, `commentId`, `projectId`, `documentId`, `fileId/storageReference`, `originalFileName`, `mimeType`, `fileExtension`, `fileSize`, `uploadedBy`, `uploadedAt` |
| Comment Read Receipt | `id`, `projectId`, `documentId`, `commentId`, `userId`, `readAt` |
| Notification | `id`, `identityKey`, `projectId`, `recipientUserId`, `recipientProjectMembershipId`, `eventType`, `title`, `message`, `priority`, `officialRole/recipientRole`, `relatedResourceType`, `relatedResourceId`, `relatedDocumentNumber`, `actionTarget`, `read`, `readStatus`, `readAt`, `createdAt`, `metadata` |
| Audit Trail | `id`, `identityKey`, `projectId`, `actorUserId`, `actorName`, `officialRole`, `department`, `action`, `businessEvent`, `resourceType`, `resourceId`, `reference`, `detail`, `metadata`, `createdAt/timestamp`, `isDeleted/isHidden`, `deletedAt/hiddenAt`, `deletedByUserId/hiddenBy` |

## 8. Relationship and Cardinality

| Parent | Relationship | Child | Cardinality | Required | Delete Behaviour |
|---|---|---|---|---|---|
| Department | has users | User Account | 1:N | User requires active department on create/update | Restrict hard delete; allow inactive. |
| User Account | has credential | User Credential | 1:1 | Required for login | Restrict hard delete; deactivate credential with user. |
| User Account | requests reset | Password Reset Token | 1:N | Optional | Retain token audit until retention expiry; no cascade by default. |
| Role | grants | Permission | M:N via Role Permission | Required for authorization | Restrict delete for fixed roles. |
| Project | has memberships | Project Membership | 1:N | Required for access | Retain memberships after Project Closed. |
| User Account | joins projects | Project Membership | 1:N | Optional | User inactive does not delete memberships. |
| Project | owns documents | Engineering Document | 1:N | Required | Restrict hard delete; Project Close archives eligible docs. |
| Engineering Document | has revisions | Document Revision | 1:N | At least one after upload | Do not cascade delete in production; preserve history. |
| Engineering Document | has active revision | Document Revision | N:1 | Required after upload | Service-managed active pointer. |
| Document Revision | references active file | Stored File | N:1 or 1:1 | Required for uploaded revision | Restrict deletion; supersede metadata. |
| Engineering Document | has history | Document History | 1:N | Required for business events | Never cascade delete in business flow. |
| Engineering Document | has workflow comments | Workflow Comment | 1:N | Optional | Retain with document. |
| Workflow Comment | has attachment | Workflow Attachment | 1:0..1 | Optional, max one | Retain with comment; not revision. |
| Workflow Attachment | uses stored file | Stored File | 1:1 | Required when attached | Restrict delete; storage cleanup policy later. |
| Workflow Comment | has read receipts | Comment Read Receipt | 1:N | Optional | May delete only with dev reset. |
| User Account | owns notifications | Notification | 1:N | Required recipient | User inactive retains old notifications. |
| Project | scopes notifications | Notification | 1:N | Required for project events | Project Close stops new notifications; retains old. |
| Project | scopes audit | Audit Trail | 1:N | Required for project activities | Audit must not be hard deleted. |

## 9. Project Scope Classification

| Entity | Classification | Reason |
|---|---|---|
| User Account | Global | Shared across projects. |
| User Credential | Global sensitive | Belongs to global user. |
| Department | Global | Used by global users. |
| Role/Permission Catalog | Global | Authorization catalog. |
| Project | Global/admin root | Owns project-scoped data. |
| Project Membership | Project-scoped junction | Ties user to project and official role. |
| Document | Project-scoped | Must match Active Project. |
| Revision | Project-scoped | Has `projectId` and `documentId`. |
| File Metadata | Project-scoped when attached to project resources | Needs project ownership for isolation. |
| Workflow Comment/Attachment | Project-scoped | Must follow document project. |
| Comment Read Receipt | Project-scoped and personal | User+comment+project. |
| Notification | Project-scoped and personal | Per recipient, per project. |
| Audit Trail | Mixed | Auth can be global; document/project events are scoped. |
| SLA/Escalation | Project-scoped derived | Derived from scoped document. |
| Active Project Context | Runtime/session/local preference | Not business table by default. |
| Sidebar collapsed/table filters/modal state | Runtime/frontend | Do not store in database. |

## 10. Lifecycle and Status Inventory

| Area | Status/Lifecycle Values | Transition Rules |
|---|---|---|
| User | Active, Inactive | Create Active; activate/deactivate; no delete. |
| Credential | Active, Inactive | Mirrors user active state; password update changes credential timestamp. |
| Department | Active, Inactive | Create Active; activate/deactivate; no delete. |
| Project | Active, Inactive, Closed | Active->Inactive, Inactive->Active, Active->Closed. Closed final. Inactive cannot directly Close. |
| Project Membership | Active, Inactive | Active requires active project and active user; Closed project read-only. |
| Document Workflow | Process Review, Process Comment, Process Reject, Project Review, Project Comment, Project Reject, Approved | Approval A/B/C matrix; Upload Revision from Comment/Reject back to Review. |
| Document Lifecycle | Active, Archived | Archive only Admin, Active Project, Approved document. Restore only Active Project and Archived document. |
| Revision | Active, Superseded via `isActive` | Upload Revision deactivates previous active revision and creates new active revision. |
| SLA | On Track, At Risk, Overdue, Final As-Built | Derived from timestamp and days; `Done` is display wording only and is not an enum/API/database value. |
| Notification | Unread, Read | Read per user; delete is personal list deletion only. |
| Audit Trail | Visible, Hidden | Admin hide/soft delete only; no hard delete in business flow. |
| Password Token | Valid, Expired, Used, Invalid/Revoked | TTL 15 minutes; single use; revoke active old token on new valid request. |

## 11. Constraint Inventory

| Entity | Field/Combination | Constraint | Layer | Reason |
|---|---|---|---|---|
| User | `id` | Primary key | Database | Stable identity. |
| User | `username` | Unique, case-normalized | Both | Login identifier. |
| User | `email` | Unique, case-normalized | Backend Service | Frontend validates uniqueness; DB can add normalized unique key. |
| User Credential | `userId` | Primary/unique FK | Database | One credential per user. |
| Department | `nameKey` | Unique | Both | Duplicate department rule. |
| Role | `roleCode`, `roleName` | Unique | Database | Fixed role catalog. |
| Permission | `permissionCode` | Unique | Database | Stable permission checks. |
| Role Permission | `roleId`,`permissionId` | Composite unique | Database | No duplicate grants. |
| Project | `id` | Primary key | Database | Stable project id. |
| Project | `projectCode` | Unique, format regex | Both | Admin-visible project code. |
| Project | status transition | Active/Inactive/Closed rules | Backend Service | MySQL check cannot enforce transition history alone. |
| Project Membership | `projectId`,`userId` | Composite unique | Both | No duplicate membership per project/user. |
| Project Membership | `officialRole` | Enum/fixed catalog | Both | Valid operational roles only. |
| Project Membership | Active membership with inactive user/project | Prohibited | Backend Service | Requires cross-entity validation. |
| Document | `id` | Primary key, globally unique | Database | Internal stable ID. |
| Document | `projectId`,`documentNumber` | Composite unique | Both | Reuse number across projects allowed. |
| Document | `projectId` | FK/index | Database | Project isolation. |
| Document | `drawing` | Enum/check PFD/P&ID | Both | Current fixed catalog. |
| Document | `lifecycle` | Active/Archived | Both | Archive behavior. |
| Revision | `documentId`,`revisionSequence` | Composite unique | Both | Ordered revision history. |
| Revision | one active per document | Unique partial equivalent | Backend Service + DB design | MySQL needs generated key/flag strategy. |
| Stored File | `fileId` | Primary key | Database | Stable file identity. |
| Stored File | `storageKey` | Unique | Database | Prevent storage overwrite. |
| Workflow Comment | `documentId`,`projectId` | FK consistency | Both | Must belong to same project. |
| Workflow Attachment | `commentId` | Unique nullable FK | Both | Max one attachment per comment. |
| Comment Read Receipt | `userId`,`commentId` | Composite unique | Database | One read receipt per user/comment. |
| Notification | `identityKey` | Unique | Both | Idempotency and no duplicate SLA/workflow notices. |
| Notification | `recipientUserId`,`projectId` | Index | Database | Counter/list scope. |
| Audit Trail | `identityKey` | Unique when present | Both | Idempotency. |
| Audit Trail | hard delete | Prohibited | Backend Service | Preserve audit history. |
| Password Reset Token | `tokenHash` | Unique | Database | Secure token lookup. |
| Reset Demo | non-production flag and Admin | Required | Backend Service | Production guard. |

## 12. Timestamp Inventory

Principle: store UTC, display WIB. Do not store formatted display strings.

| Timestamp | Entity/Use |
|---|---|
| `createdAt` / `createdDate` | User, Department, Project, Document, Revision, Comment, Notification, Audit |
| `updatedAt` / `lastUpdated` | User, Department, Project, Document, Membership |
| `activatedAt` | User, Department, Project, Membership |
| `deactivatedAt` | User, Department, Project, Membership |
| `closedAt` | Project |
| `archivedAt` | Document |
| `restoredAt` | Document |
| `uploadedAt` | Stored File, Revision, Attachment |
| `readAt` | Notification, Comment Read Receipt |
| `hiddenAt` / `deletedAt` | Audit Trail soft hide |
| `slaStartedAt` | Document SLA cycle |
| `slaStoppedAt` | Approved document SLA stop |
| `slaStateEvaluation.updatedAt` | SLA notification marker |
| `createdAt` for token | Password reset token |
| `expiresAt` | Password reset token |
| `usedAt` | Password reset token |
| `revokedAt` | Password reset token |
| `storedAt` | File storage record, technical |

## 13. File Metadata Requirements

| Requirement | Source | Notes |
|---|---|---|
| File identity | `fileId`, `attachmentId` | Separate file records recommended. |
| Original filename | File and attachment services | Needed for display/download. |
| Stored filename | Storage design pending | Must not rely only on original filename. |
| Extension | File validation | `pdf`, `docx`, `xls`, `xlsx`, `jpg`, `jpeg`, `png`; attachment only `pdf`, `jpg`, `jpeg`, `png`. |
| MIME type | File validation | Validate MIME against extension. |
| Size | File validation | Max 100 MB current frontend. |
| Checksum | Prompt requirement | Not implemented frontend; recommended for backend integrity. |
| Storage key/relative path | Frontend `storagePath`/`storageReference` | Phase 2 storage strategy must define. |
| File category | Inferred | Active document, revision, workflow attachment. |
| Ownership | Project, document, revision/comment | Needed for access isolation. |
| Active file resolution | Document `activeFileId`, `activeRevisionId`, revision `isActive` | Must be service-managed. |
| Archive behavior | Archive does not move physical file | Preserve metadata and file relation. |
| Project Close behavior | No new files; approved active docs archived | Existing files remain. |
| Temporary upload | File replacement rollback exists frontend | Backend needs staging/transaction strategy. |

## 14. Local Persistence Mapping

| Frontend Store/Object | Current Shape | Candidate Table(s) | Normalization Needed | Notes |
|---|---|---|---|---|
| `documents` | Document records with embedded `fileMetadata`, `fileHistory`, SLA fields | `documents`, `stored_files`, `document_revisions`, `document_sla_evaluations` | Yes | Do not keep file history embedded in document. |
| `documentRevisions` | Revision records keyed by `id`, indexed by `documentId`, `projectId` | `document_revisions` | Low | Add sequence/source/result statuses. |
| `documentHistory` | Timeline records | `document_history` | Low | Store timestamps, not formatted strings. |
| `files` | Blob+metadata keyed by `storagePath` | `stored_files` plus external/object/NAS storage | Yes | Blob storage strategy pending. |
| `metadata` | Seed/migration version records | migration metadata | Partial | Technical, not business entity. |
| `workflowComments` | Comment with embedded attachment metadata | `workflow_comments`, `workflow_attachments`, `stored_files` | Yes | Attachment max one. |
| `commentReadReceipts` | User/document/comment read records | `comment_read_receipts` | Low | Personal read state. |
| `notifications` | Personal notifications with identity key | `notifications` | Low | Delete is personal deletion, not event deletion. |
| `users` | User identity plus legacy roleId | `users`, optional legacy fields | Partial | Operational role must not come from global user. |
| `userCredentials` | Plain password in demo | `user_credentials` | Yes | Backend must hash. |
| `departments` | Department master data | `departments` | Low | Unique `nameKey`. |
| `auditTrail` | Activity records plus hidden fields | `audit_trail` | Low | Preserve immutable intent. |
| `projects` | Project records | `projects` | Low | Normalize timestamp names. |
| `projectMemberships` | Membership records | `project_memberships` | Low | Unique project+user. |
| `passwordResetTokens` | Token records keyed by token | `password_reset_tokens` | Yes | Store token hash, not token. |
| `mockEmails` | Dev mock reset emails | non-prod `mock_emails` or dev-only adapter | Yes | Do not enable production. |
| `localStorage: edms.currentUser` | Authenticated user snapshot | Session/JWT, not table | Yes | Runtime/session only. |
| `localStorage: edms.activeProjectByUser` | userId->projectId map | optional user preference or session | Maybe | Not business workflow data. |
| `localStorage: edms.sidebar.collapsed` | UI preference | Do not store | No | Runtime/UI only. |
| Zustand project context | accessible projects, active project, active membership, active role | Session/server-derived | Yes | Derived from project+membership. |
| TanStack Query cache | Client cache | Do not store | No | Runtime cache. |

## 15. Service Layer Mapping

| Service | Responsibility | Key Methods | Reads | Writes | Candidate Endpoint(s) | Candidate Transaction Boundary |
|---|---|---|---|---|---|---|
| `AuthService` | Login/logout/profile/password recovery | `login`, `logout`, `changePassword`, `forgotPassword`, `resetPassword`, `validatePasswordResetToken`, `updateCurrentProfile` | users, credentials, tokens, mock emails | credentials, tokens, mock emails, audit, local session | `/auth/login`, `/auth/logout`, `/auth/change-password`, `/auth/forgot-password`, `/auth/reset-password`, `/profile` | Password reset request; reset password; profile update + audit |
| `UserService` | User CRUD lifecycle | create/update/activate/deactivate/password | users, credentials, departments | users, credentials, audit | `/users`, `/users/{id}`, `/users/{id}/activate`, `/users/{id}/deactivate` | Create user+credential+audit; status+credential+audit |
| `DepartmentService` | Department master data | create/update/activate/deactivate | departments | departments, audit | `/departments` | Department mutation + audit |
| `AuthorizationService` | Permission resolution | hasPermission/projectPermission | roles, permissions, memberships | none | `/me/permissions` candidate | None |
| `ProjectService` | Project, membership, context, close | create/update/activate/deactivate/close/membership/context | projects, memberships, users, documents, notifications, audit | projects, memberships, documents, history, audit | `/projects`, `/projects/{id}/close`, `/project-memberships`, `/me/project-context` | Create project+initial membership; close project archive docs+history+audit |
| `DocumentService` | Document lifecycle/workflow/revision | create/update/archive/restore/workflow/uploadRevision | documents, revisions, history, comments, memberships | documents, revisions, history, comments, notifications, audit, files | `/documents`, `/documents/{id}/workflow-actions`, `/documents/{id}/revisions`, `/documents/{id}/archive`, `/documents/{id}/restore` | Create document+file+revision+history+notification+audit; workflow action; upload revision |
| `FileService` | Document file validation/preview/download | upload, replacement, preview, download | files, documents | files, audit | `/files`, `/documents/{id}/file`, `/documents/{id}/download` | File staging/finalize with document mutation |
| `WorkflowAttachmentService` | Approval B/C attachment | save/preview/download/delete | files | files | `/workflow-comments/{id}/attachment` | Attachment save + workflow comment |
| `NotificationService` | Personal notifications | create, list, mark read, delete, direct open | notifications, projects, documents, memberships | notifications, audit | `/notifications`, `/notifications/{id}/read`, `/notifications/read-all`, `/notifications/{id}` | Create notification(s)+audit; mark read+audit |
| `AuditTrailService` | Activity logging/list/hide | record/list/detail/summary/hide | audit | audit | `/audit-trail`, `/audit-trail/{id}/hide` | Audit create idempotency; hide many |
| `SlaMonitoringService` | SLA evaluation and notifications | getDocuments, createSummary | documents, notifications | documents.slaStateEvaluation, notifications, audit | `/sla-monitoring` | SLA state evaluation + notification marker |
| `EscalationService` | Overdue list and audit marker | getEscalations | documents | audit | `/escalations` | Escalation audit marker idempotent |
| `DemoDataResetService` | Non-prod reset | resetAllDemoData | all stores | all demo data, bootstrap user/credential/department | `/admin/demo-reset` | Full transaction, feature flag, Admin only |

## 16. CRUD and Transaction Mapping

| Flow | Actor | Affected Entities | Generated History/Notification/Audit | Transaction Requirement |
|---|---|---|---|---|
| Login | Active user | session runtime | Audit Login | User+credential read; audit best-effort. |
| Logout | Authenticated user | session runtime | Audit Logout | Clear session then audit. |
| Change Password | Current user | credential | Audit Change Password | Credential update + audit. |
| Forgot Password | Any requester | token, mock email dev | Audit request only for valid account | Revoke old active tokens + create token/email. |
| Reset Password | Token holder | credential, token | Audit completed | Validate token + update password + mark used. |
| Create User | Admin | user, credential | Audit Create User | User+credential+audit. |
| Update User | Admin | user, credential status if status changes | Audit Update User | User+credential+audit. |
| Activate/Deactivate User | Admin | user, credential | Audit lifecycle | User+credential+audit. |
| Create Department | Admin | department | Audit Create Department | Department+audit. |
| Update/Activate/Deactivate Department | Admin | department | Audit Department action | Department+audit. |
| Create Project | Admin/user with permission | project, initial membership | Audit recommended | Project+initial membership atomic. |
| Update Project | Admin | project | Audit recommended | Project update; reject Closed and invalid code change. |
| Activate/Deactivate Project | Admin | project | Audit recommended | Project lifecycle update. |
| Close Project | Admin | project, approved docs, document history | Audit Project Closed and Document Archived history | Strong atomic transaction. |
| Create Membership | Admin | membership | Audit Membership Created | Membership+audit. |
| Update/Activate/Deactivate Membership | Admin | membership | Audit Membership action | Membership+audit; read-only after close. |
| Select Active Project | Authenticated user | runtime/context/local preference | None | Validate membership/project; no business data mutation. |
| Create Document | Document Owner/Admin via permission | document, revision, file, history | Workflow notification, audit | File staging + document/revision/history + notification/audit. |
| Update Document | Authorized | document | Audit Edit Document | Document update + audit. |
| Approval A/B/C | Responsible role | document, active revision label, comment optional, attachment optional, history | Notification, audit, attachment audit | Workflow transaction plus file rollback for attachment. |
| Upload Revision | Document Owner/Admin | document, revisions, files, history | Notification, audit, possible escalation resolved audit | File replacement + document + revision history atomic. |
| Archive/Restore Document | Admin | document, history | Audit Archive/Restore | Document lifecycle + history + audit. |
| Mark Notification Read | Recipient user | notification | Audit Notification Read | Notification+audit. |
| Delete Notification | Recipient user | notification inbox ownership | Audit Trail remains system evidence | User Inbox hard delete is allowed. |
| Hide Audit Trail | Admin active official role | audit hidden fields | No business data impact | Audit update only. |
| Reset Demo Data | Bootstrap Admin in non-prod | all operational data, bootstrap user credential/department | Existing audit removed by design | Full transaction and runtime cleanup. |

## 17. Candidate Table List

| Candidate Table | Scope | Notes |
|---|---|---|
| `users` | Global | Identity and lifecycle. |
| `user_credentials` | Global sensitive | Password hash lifecycle. |
| `password_reset_tokens` | Global sensitive | Hash token, TTL, used/revoked. |
| `mock_emails` | Dev only | Optional/non-production. |
| `departments` | Global | Master data. |
| `roles` | Global | Fixed authorization catalog. |
| `permissions` | Global | Permission catalog. |
| `projects` | Global root | Owns project-scoped entities. |
| `project_memberships` | Project-scoped | User/project/official role. |
| `documents` | Project-scoped | Main register and active pointers. |
| `document_revisions` | Project-scoped | Revision history and file link. |
| `stored_files` | Project-scoped/global linked | Metadata only; storage strategy later. |
| `document_history` | Project-scoped | Timeline/history records. |
| `workflow_comments` | Project-scoped | Review comments and role snapshot. |
| `workflow_attachments` | Project-scoped | Max one per comment. |
| `comment_read_receipts` | Project-scoped/personal | Read status for comments. |
| `notifications` | Project-scoped/personal | Personal notification records. |
| `audit_trail` | Mixed | Immutable-preferred with hide flag. |
| `document_sla_evaluations` | Project-scoped | Optional normalized marker; could remain on documents. |
| `project_closure_events` | Project-scoped | Optional closure summary/reason. |
| `user_project_preferences` | User preference | Optional last selected project. |
| `migration_metadata` | Technical | Replaces frontend metadata store for technical markers. |
| `demo_reset_runs` | Non-prod technical | Optional if reset events must be retained outside reset. |
| `file_access_audit` | Not needed initially | Use audit trail instead. |
| `document_types` | Optional | Only if PFD/P&ID becomes configurable. |
| `areas` | Optional | Only if Area becomes master data. |
| `sessions` | Optional | Depends auth strategy; not required by frontend data model. |

## 18. Candidate Junction Table List

| Junction Table | Parent A | Parent B | Notes |
|---|---|---|---|
| `role_permissions` | roles | permissions | Current frontend mapping. |
| `project_memberships` | projects | users | Also holds official role/status. |
| `notification_recipients` | notification event | users | Not needed if records are already per recipient; avoid unless adding event table. |
| `document_file_links` | documents/revisions/comments | stored_files | Optional alternative to direct FK fields. |

## 19. Candidate Index List

| Table | Candidate Index | Reason |
|---|---|---|
| `users` | unique `username_normalized` | Login and duplicate validation. |
| `users` | unique `email_normalized` | Forgot password/profile duplicate validation. |
| `users` | `department_id`, `status` | User management filters. |
| `departments` | unique `name_key` | Duplicate rule. |
| `roles` | unique `role_code`, unique `role_name` | Catalog lookup. |
| `permissions` | unique `permission_code` | Permission checks. |
| `role_permissions` | unique `role_id, permission_id` | Duplicate grant prevention. |
| `projects` | unique `project_code` | Project code constraint. |
| `projects` | `status` | Project selector/list. |
| `project_memberships` | unique `project_id, user_id` | Duplicate membership rule. |
| `project_memberships` | `user_id, status` | Accessible projects. |
| `project_memberships` | `project_id, official_role, status` | Recipient/assignee resolution. |
| `documents` | unique `project_id, document_number_normalized` | Project-scoped uniqueness. |
| `documents` | `project_id, lifecycle` | Active/archived filtering. |
| `documents` | `project_id, status` | Dashboard/KPI/workflow. |
| `documents` | `project_id, drawing` | PFD/P&ID lists. |
| `documents` | `active_revision_id`, `active_file_id` | Active resolution. |
| `document_revisions` | `document_id` | Revision history. |
| `document_revisions` | `project_id` | Project isolation. |
| `document_revisions` | `document_id, is_active` | Active revision lookup. |
| `document_history` | `document_id, project_id, created_at` | Timeline newest first. |
| `workflow_comments` | `document_id, project_id, created_at` | Comment viewer. |
| `workflow_attachments` | unique `comment_id` | Max one attachment. |
| `stored_files` | unique `storage_key` | Storage lookup. |
| `stored_files` | `project_id, document_id, revision_id` | Access and history. |
| `comment_read_receipts` | unique `user_id, comment_id` | Read idempotency. |
| `notifications` | unique `identity_key` | Idempotent creation. |
| `notifications` | `recipient_user_id, project_id, read` | Counter/list. |
| `notifications` | `project_id, related_resource_id` | Direct open and cleanup. |
| `audit_trail` | unique `identity_key` | Idempotent audit. |
| `audit_trail` | `project_id, created_at` | Audit list. |
| `password_reset_tokens` | unique `token_hash`, `user_id` | Token validation/revocation. |

## 20. Derived Data - Do Not Store

| Derived Value | Derivation |
|---|---|
| SLA timer display (`1d 2h 3m`, `Done`) | `slaStartedAt`, `slaStoppedAt`, current time/status. |
| SLA `calculatedAtWib`, `startedAtWib`, `stoppedAtWib` | Format UTC timestamps for WIB display. |
| Escalation Level | Days overdue thresholds. |
| Overdue Duration | SLA timer minus days for validation. |
| Dashboard KPI counts | Query documents by status/lifecycle/project. |
| Notification unread counter | Count unread notifications per current user/project. |
| Current assignee display | Resolve active users by project membership official role. |
| SLA display assignment department | Resolve from active users and departments. |
| Search/filter/sort/pagination state | Presentation query state. |
| File size display | Format raw file size. |

## 21. Runtime State - Do Not Store

| Runtime State | Location |
|---|---|
| Current user browser session snapshot | `localStorage: edms.currentUser`, future session/JWT. |
| Active project context | Zustand `project-context.store.js`. |
| Accessible projects list | Derived from projects + memberships. |
| Active official role | Derived from active membership. |
| Project selection modal/page state | Frontend route state. |
| Sidebar collapsed | `localStorage: edms.sidebar.collapsed`. |
| Table selected rows, filters, page size | React state/URL query where applicable. |
| Modal open/close state | React state. |
| TanStack Query cache | Client cache. |
| Object URLs for downloads/previews | Browser runtime. |

## 22. Security-Sensitive Data

| Data | Current Frontend | Backend Requirement |
|---|---|---|
| Password | Plaintext demo credential | Hash with strong password hashing; never store plaintext. |
| Reset token | Plain mock token | Store hash; show raw token only in outbound email link. |
| Mock email reset links | Dev simulation | Non-production only behind feature flag. |
| Session/current user | localStorage snapshot | Secure session/JWT strategy; server validation. |
| File uploads | Browser IndexedDB blobs | Validate MIME/extension/size; consider checksum and malware scanning policy. |
| Audit hide | Admin active official role | Enforce server-side; preserve immutable records. |
| Reset demo | Feature flag plus Admin | Disable production; transactional authorization. |
| Project ID from frontend | Accepted after service checks | Never trust request projectId without membership/resource ownership validation. |

## 23. Seed Data Requirements

Allowed minimal seed:

| Seed Item | Required | Notes |
|---|---|---|
| Role Admin | Yes | Fixed catalog. |
| Minimum permission catalog | Yes | At least Admin access required for bootstrap. |
| Role-permission Admin mapping | Yes | Bootstrap Admin must function. |
| One User Admin `wahyuts` | Yes | Protected bootstrap account per frontend/demo reset. |
| Admin credential | Yes | Backend must hash. |
| Department dependency for Admin (`DIV 2` currently) | Yes if user FK requires it | Keep minimal. |

Do not seed project demo, document demo, revision demo, workflow demo, notification demo, audit demo, SLA demo, escalation demo, or file demo.

## 24. Storage Strategy Inputs

| Input | Required Decision |
|---|---|
| Project ownership | Every document/revision/comment/attachment/notification/audit project event needs `projectId`. |
| Document ownership | Files must reference document and project. |
| Revision ownership | Active document file and revision file must be resolvable. |
| Workflow attachment ownership | Attachment must reference workflow comment, document, project, and file. |
| Storage metadata | `fileId`, original/stored filename, extension, MIME, size, checksum, storage key, relative path, category, uploaded by/at. |
| Temporary upload | Need staging/finalize/rollback behavior equivalent to frontend file replacement. |
| Archive behavior | Archive changes metadata/lifecycle only; physical file should not move in Phase 2. |
| Project Close behavior | Stop new uploads, archive approved active docs, retain existing files. |
| Viewer/download | DB stores identity/access metadata only; renderer is not database concern. |
| Absolute path | Do not decide in Phase 1. |

## 25. Backend API Candidates

| Candidate Endpoint | Purpose |
|---|---|
| `POST /api/v1/auth/login` | Login. |
| `POST /api/v1/auth/logout` | Logout/session invalidation. |
| `POST /api/v1/auth/change-password` | Historical Reference. Official route is `PATCH /api/v1/profile/password`. |
| `POST /api/v1/auth/forgot-password` | Username+email generic reset request. |
| `GET /api/v1/auth/reset-password-tokens/{token}/validate` | Validate reset token state. |
| `POST /api/v1/auth/reset-password` | Reset password using token. |
| `GET/PATCH /api/v1/profile` | My Profile. |
| `PATCH /api/v1/profile/password` | Official current user password change route. |
| `GET/POST /api/v1/users` | User list/create. |
| `GET/PATCH /api/v1/users/{id}` | User detail/update. |
| `POST /api/v1/users/{id}/activate` | Activate user. |
| `POST /api/v1/users/{id}/deactivate` | Deactivate user. |
| `GET/POST /api/v1/departments` | Department list/create. |
| `PATCH /api/v1/departments/{id}` | Department update. |
| `POST /api/v1/departments/{id}/activate` | Activate department. |
| `POST /api/v1/departments/{id}/deactivate` | Deactivate department. |
| `GET /api/v1/roles`, `GET /api/v1/permissions` | Catalog read. |
| `GET/POST /api/v1/projects` | Project list/create. |
| `PATCH /api/v1/projects/{id}` | Project update. |
| `POST /api/v1/projects/{id}/activate` | Activate project. |
| `POST /api/v1/projects/{id}/deactivate` | Deactivate project. |
| `GET /api/v1/projects/{id}/close-summary` | Close validation/summary. |
| `POST /api/v1/projects/{id}/close` | Close project transaction. |
| `GET/POST /api/v1/project-memberships` | Membership list/create. |
| `PATCH /api/v1/project-memberships/{id}` | Membership update. |
| `POST /api/v1/project-memberships/{id}/activate` | Activate membership. |
| `POST /api/v1/project-memberships/{id}/deactivate` | Deactivate membership. |
| `GET /api/v1/me/project-context` | Resolve accessible/active project context. |
| `POST /api/v1/me/active-project` | Set active project preference/session. |
| `GET/POST /api/v1/documents` | Document list/create. |
| `GET/PATCH /api/v1/documents/{id}` | Document detail/update. |
| `POST /api/v1/documents/{id}/workflow-actions` | Approval A/B/C. |
| `POST /api/v1/documents/{id}/revisions` | Upload revision. |
| `POST /api/v1/documents/{id}/archive` | Archive document. |
| `POST /api/v1/documents/{id}/restore` | Restore document. |
| `GET /api/v1/documents/{id}/history` | Timeline. |
| `GET /api/v1/documents/{id}/comments` | Workflow comments. |
| `GET /api/v1/files/{fileId}/download` | Download document/revision/attachment. |
| `GET /api/v1/sla-monitoring` | Historical Reference. Official route is `GET /api/v1/sla`. |
| `GET /api/v1/sla` | Official SLA list/summary route. |
| `GET /api/v1/escalations` | Escalation list. |
| `GET /api/v1/notifications` | Current user notifications. |
| `POST /api/v1/notifications/{id}/read` | Mark read. |
| `POST /api/v1/notifications/read-all` | Mark all read. |
| `DELETE /api/v1/notifications` | Historical candidate bulk delete. Official runtime delete is `DELETE /api/v1/notifications/{id}` for User Inbox hard delete. |
| `GET /api/v1/audit-trail` | Audit list. |
| `POST /api/v1/audit-trail/hide` | Admin hide audit records. |
| `POST /api/v1/admin/demo-reset` | Non-production reset utility. |

## 26. Gap Analysis

| ID | Classification | Gap | Impact | Recommendation |
|---|---|---|---|---|
| GAP-001 | Critical | Backend/password design not implemented; frontend stores plaintext demo passwords. | Cannot use current credential shape in production. | Phase 2 must define password hash fields, reset token hash, session invalidation. |
| GAP-002 | Critical | Storage strategy not decided. | Cannot finalize `stored_files` physical path/storage key semantics. | Proceed to Storage Strategy Design before clean schema. |
| GAP-003 | High | Permission code naming differs between docs (`document.read`) and frontend (`document-register.view`). | Seed/catalog mismatch can break authorization. | Reconcile catalog using frontend frozen behavior and Access Control priority. |
| GAP-004 | High | System role vs official project role are still coupled by same fixed role names in frontend. | Risk of global user role overriding project membership. | Keep separate columns/tables and resolution rules. |
| GAP-005 | High | Audit Trail supports soft hide despite immutable audit ideal. | Compliance risk if hide is interpreted as deletion. | Preserve existing hide decision but document immutability and retention. |
| GAP-006 | High | Comment attachment metadata is embedded in workflow comment. | Normalization required for DB/file access. | Split `workflow_attachments` and `stored_files`. |
| GAP-007 | High | Document file metadata is embedded in document/fileHistory. | Active/revision file resolution can become inconsistent. | Normalize stored file and revision relationships. |
| GAP-008 | High | SLA notification marker is embedded in document as `slaStateEvaluation`. | Schema decision needed: document JSON vs separate table. | Prefer separate marker table if auditability/querying matters. |
| GAP-009 | Medium | Area is a free text attribute in frontend, not confirmed master data. | Premature `areas` table could add unsupported admin feature. | Keep as document attribute unless PO asks master data. |
| GAP-010 | Medium | PFD/P&ID are fixed constants but Decision Log mentions scalability. | Table vs enum decision affects future extensibility. | Use enum/fixed catalog now; optional table only with admin-managed types. |
| GAP-011 | Medium | Project Close reason is not a user-entered field; auto archive reason is `Project Closed`. | Schema may over-model reason. | Store nullable close reason only if closure wizard later captures it. |
| GAP-012 | Medium | `createdDate`/`lastUpdated` naming differs from `createdAt`/`updatedAt`. | Migration mapping risk. | Standardize DB to UTC `created_at`, `updated_at`; map frontend names in API. |
| GAP-013 | Medium | Active Project last selected is localStorage only. | User experience across devices undecided. | Treat as optional preference, not core table. |
| GAP-014 | Medium | Backend folder absent. | No existing backend architecture to audit. | Phase 2 must not assume backend implementation exists. |
| GAP-015 | Medium | Database folders are empty. | No existing constraints/schema to preserve. | Clean schema can be designed after storage strategy. |
| GAP-016 | Low | Mock email dev store exists. | Risk of production leakage. | Keep dev-only; no production seed. |
| GAP-017 | Low | File checksum not implemented in frontend. | Integrity/dedup not available. | Add metadata requirement in storage strategy. |
| GAP-018 | Documentation Only | `SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable)`, `FEATURE-MAPPING.md (Historical Reference / Unavailable)`, `UI-CHANGELOG.md` absent. | Source priority cannot be fully applied. | Record as documentation gap and use available valid sources. |

## 27. Documentation Gaps

| Missing/Incomplete Source | Expected by Prompt/Priority | Handling |
|---|---|---|
| `docs/source-of-truth/SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable)` | Source Priority #2 | Not found. Used PRD, Business Workflow, Access Control, frontend implementation. |
| `docs/source-of-truth/FEATURE-MAPPING.md (Historical Reference / Unavailable)` | Source Priority #3 | Not found. Used PRD, Routing, State Management, frontend features. |
| `UI-CHANGELOG.md` | Reference document requested | Not found in repo. Used `CHANGE-REQUEST.md` and governance notes. |
| Backend implementation | Requested audit target | `apps/backend/` absent from file inventory. Treated as not implemented. |
| Database implementation files | Requested audit target | Empty `migration`, `schema`, `seed` folders. Treated as no final DB. |

## 28. Conflict Register

| ID | Sources | Conflict | Database Impact | Priority/Recommendation |
|---|---|---|---|---|
| CON-001 | Access Control docs vs frontend permissions | Docs mention `document.read`, frontend uses `document-register.view`, `approval.a/b/c`, etc. | Role/permission seed can mismatch UI. | Follow frontend frozen for behavior; reconcile catalog before schema seed. |
| CON-002 | PRD ideal official role from Project Membership vs frontend user seed legacy `roleId` | User still has global `roleId` for system authorization and legacy mapping. | Risk of treating official role as user attribute. | Separate system authorization role and project official role; keep legacy role only for bootstrap/backward compatibility. |
| CON-003 | Audit immutability ideal vs frontend `softDeleteActivities` | Audit can be hidden by Admin. | Schema needs hidden fields despite immutable preference. | Preserve hide as existing decision, no hard delete. |
| CON-004 | Source priority references `SYSTEM-REQUIREMENTS`/`FEATURE-MAPPING`, absent | Cannot compare priority levels 2 and 3. | Open requirement trace gap. | Document gap; do not invent. |
| CON-005 | Storage NAS decision vs frontend IndexedDB storage | Decision Log references Storage NAS utility; frontend stores blobs in IndexedDB. | Physical storage design unresolved. | Storage Strategy Design required. |
| CON-006 | Project Close notification rule vs generic notification service | Project Close says no new notification; notification service can create for document/SLA events generally. | Close transaction must suppress notifications. | Explicit service validation: Closed projects create no new notifications. |

## 29. Open Questions

| Question | Needed Before |
|---|---|
| What physical storage strategy will replace IndexedDB: local disk, NAS, object storage, or hybrid? | Clean schema and upload API. |
| Should `stored_files.checksum` be mandatory, and which algorithm should be used? | Storage strategy. |
| Should Active Project last selection persist server-side per user or remain session/client preference? | Clean schema optional preference. |
| Should SLA evaluation marker be separate table or JSON/document columns? | Clean schema. |
| Should project closure store a user-entered close reason, or only `closedAt/closedBy` plus audit metadata? | Clean schema. |
| Which permission catalog names are canonical: frontend frozen codes or Access Control abstract codes? | Seed and RBAC schema. |
| Should mock email records exist in backend dev database or be an in-memory/dev adapter only? | Backend implementation. |
| What retention policy applies to password reset tokens, notifications, and audit hidden records? | Clean schema/security policy. |

## 30. Recommendations for Phase 2

1. Perform Storage Strategy Design next, because file metadata is central to documents, revisions, workflow attachments, viewer, download, archive, and project close.
2. Define security storage rules before schema: password hashing, reset token hashing, session strategy, token retention, and no raw token logging.
3. Reconcile permission code catalog using frontend frozen behavior, then map any documentation aliases.
4. Model Project Membership as operational official role source and keep global system authorization role separate.
5. Normalize embedded frontend structures: file metadata/history, workflow attachment, SLA evaluation marker.
6. Preserve Project Close as a transaction across project, approved active documents, document history, and audit.
7. Do not seed operational/demo data. Seed only bootstrap Admin, required department, roles, permissions, and role-permission mapping.
8. Keep derived SLA/escalation/dashboard/counter values out of persistent columns unless stored as event markers for idempotency.

## 31. Readiness Verdict

Verdict:

```text
READY FOR STORAGE STRATEGY DESIGN
```

Reason:

The frontend freeze has enough behavioral information for database design, but clean schema should wait for storage decisions and security-sensitive persistence decisions. Storage metadata, active file resolution, checksum policy, temporary upload handling, and physical path/key strategy are not yet final.

Decisions required before Clean Database Schema:

| Decision | Priority |
|---|---|
| Physical storage target and storage key format | Critical |
| Stored file checksum requirement | High |
| Password/token/session security model | Critical |
| Canonical permission code catalog | High |
| SLA notification marker storage shape | Medium |
| Active project preference persistence | Low |
| Audit hide/immutability retention policy | High |

## 32. Post-Audit Architecture Resolution

Setelah Phase 1 - Database Readiness Audit selesai, beberapa keputusan arsitektur resmi telah ditetapkan melalui dokumen **STORAGE-STRATEGY.md**.

Bagian ini berfungsi sebagai resolusi terhadap beberapa Open Question dan Gap yang masih bersifat konseptual pada saat audit dilakukan.

### RES-001 — File Naming Strategy

Storage menggunakan empat atribut yang berbeda:

- Document Number
- File Identity
- Original File Name
- Physical File Name

Keempat atribut tersebut memiliki fungsi yang berbeda dan tidak boleh diperlakukan sebagai informasi yang sama.

Document Number dan Original File Name dapat memiliki nilai yang sama maupun berbeda.

Sistem tidak boleh mengasumsikan bahwa keduanya selalu identik.

---

### RES-002 — Physical File Naming Policy

Physical File Name menggunakan pendekatan:

```text
Hybrid Human Readable + Unique Identifier
```

Format konseptual:

```text
{DOCUMENT_NUMBER}_{REVISION}_{SHORT_FILE_ID}_{SANITIZED_ORIGINAL_FILE_NAME}
```

Contoh:

```text
PFD-EDMS-0002_REV03_FILE-d77eaf41_Drawing_Final_Approved.pdf
```

Pendekatan ini dipilih untuk:

- menghindari konflik nama file,
- mempertahankan keterbacaan oleh administrator sistem,
- mempermudah pencarian file secara manual,
- menjaga hubungan antara file dengan Document,
- serta tetap menyediakan identitas unik bagi setiap file.

---

### RES-003 — Download Filename Policy

Storage membaca file menggunakan File Identity dan Physical File Name.

---

# 33. Domain 5 Backend Blueprint Resolution

Bagian ini mencatat resolusi setelah Domain 5 Step B Backend Implementation Blueprint.

Dokumen ini tetap merupakan audit pendukung. Blueprint resmi diturunkan pada:

- `IMPLEMENTATION-PLAN.md`
- `API-CONTRACT.md`
- `DATABASE-SCHEMA.md`
- `STORAGE-STRATEGY.md`

## 33.1 Step A Gap Resolution

| Step A Gap | Resolution Status | Backend Blueprint Decision |
|---|---|---|
| Authentication refresh/session persistence | Resolved as blueprint | Refresh token persistent, revocable, device aware, rotated, and invalidated on logout/force logout/password change/reset password |
| Endpoint-level backend contract | Resolved as blueprint | Runtime endpoints mapped to request, response, validation, permission, transaction, and side effect in `API-CONTRACT.md` |
| Authorization permission mismatch | Resolved as blueprint | Backend authorization follows `ACCESS-CONTROL.md`; old candidate mappings are Historical Reference |
| Background process strategy | Resolved as blueprint | Scheduler/Cron/Worker required for SLA Evaluation, Escalation Evaluation, and Notification Dispatch |
| Storage transaction policy | Resolved as blueprint | Upload Temporary -> Virus Scan -> Checksum -> Metadata Validation -> Database Transaction -> Permanent Storage -> Audit Trail -> Notification -> rollback on failure |
| Backend module structure | Resolved as blueprint | backend/routes/controllers/services/repositories/validators/middlewares/jobs/storage/config/utils/database |
| Database implementation rules | Resolved as blueprint | MySQL datatype, FK, cascade, UTC timestamp, JSON usage, index, unique strategy defined without DDL |
| Candidate route conflict | Resolved as blueprint | `API-CONTRACT.md` is route authority; candidate routes are Historical Reference |

## 33.2 Remaining Implementation-Phase Work

The following items are intentionally not created in Domain 5 Step B:

- Express source code.
- MySQL connection implementation.
- `schema.sql`.
- migration files.
- seed files.
- ORM models.
- executable scheduler/worker code.
- physical storage provider implementation.

These are implementation artifacts and must be created in the backend implementation phase, not during blueprint documentation.

## 33.3 Updated Backend Readiness Verdict

Verdict:

```text
READY FOR BACKEND IMPLEMENTATION PHASE
```

Reason:

Domain 5 Step B converts the active readiness gaps into documented backend implementation decisions while preserving Domain 1-4 business, UI, frontend architecture, and data contract baselines.

Namun seluruh proses download harus menggunakan Original File Name sebagai nama file yang diterima oleh pengguna.

Ketentuan ini berlaku untuk:

- Download melalui aplikasi,
- Download Revision,
- Download History,
- Document Viewer,
- Toolbar bawaan PDF Viewer,
- maupun proses Save As.

Physical File Name tidak boleh digunakan sebagai nama download yang ditampilkan kepada pengguna.

---

### RES-004 — Metadata Separation

Metadata file diperlakukan sebagai domain yang terpisah dari Business Metadata.

Minimal setiap file akan memiliki atribut berikut:

- File Identity
- Original File Name
- Physical File Name
- File Extension
- MIME Type
- File Size
- Storage Key
- Relative Path
- File Category

Implementasi detail akan ditetapkan pada **DATABASE-SCHEMA.md**.

---

### Impact to Phase 2

Keputusan di atas menyelesaikan sebagian pertanyaan konseptual mengenai File Naming Strategy yang sebelumnya masih terbuka pada saat audit dilakukan.

Dengan adanya keputusan ini, Phase 2 dapat melanjutkan desain **DATABASE-SCHEMA.md** tanpa perlu membuka kembali diskusi mengenai identitas file, nama file fisik, maupun nama file yang diterima oleh pengguna saat proses download.

