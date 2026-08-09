# CURRENT IMPLEMENTATION AUDIT

> **Current Status:** Historical / Legacy Frontend Baseline  
> **Runtime Alignment:** Dokumen ini mencatat audit fase frontend-local sebelum backend-integrated runtime selesai. Source code saat ini sudah memiliki Backend REST API, MySQL, storage driver Local/R2, temporary upload pipeline, SSE realtime, scheduler, dan TanStack Query REST integration untuk scope yang sudah dimigrasikan. Informasi IndexedDB, Fake API, local workflow engine, browser file storage, dan localStorage business state pada dokumen ini tetap dipertahankan sebagai historical evidence, tetapi bukan Runtime Source of Truth saat ini.

Document Status: Approved
Phase: Completed (Phase B — Current Implementation Audit)
Date: 2026-07-21
Next Phase: DATABASE-SCHEMA.md Generation (Phase C)
Reference Authority: Phase A
Scope Boundary: Reverse engineering only. This document does not create database design, SQL, migration, ERD, or new architecture decision.

---

---

# 1. Introduction

Dokumen ini mencatat audit implementasi EDMS terbaru berdasarkan source code frontend aktual di repository. Tujuan audit adalah memahami perilaku aplikasi, aliran data, data yang dipakai fitur, dan persistence yang saat ini benar-benar ada.

Audit ini mengikuti authority Phase A:

| Priority | Authority | Usage in Phase B |
|---:|---|---|
| 1 | Latest Frontend Source Code | Primary evidence |
| 2 | `docs/architecture/STORAGE-STRATEGY.md` | Storage validation reference |
| 3 | Business Decisions yang telah disepakati | Supporting rule reference |
| 4 | `docs/architecture/DATABASE-READINESS-AUDIT.md` | Prior audit reference |
| 5 | `docs/source-of-truth/` | Supporting reference |
| 6 | `DATABASE-SCHEMA-WORKING-DRAFT.md` | Historical reference only |

Phase B tidak membuat desain database. Istilah seperti "store", "record", "field", dan "data requirement" di dokumen ini merujuk pada implementasi frontend/IndexedDB saat ini, bukan rancangan tabel.

---

# 2. Audit Scope

Area yang diaudit:

| Area | Evidence |
|---|---|
| Frontend app | `apps/frontend/src/` |
| Routing | `app/routes/root.route.js`, `app/router/router.js` |
| Layout and shell | `app/shell/AppShell.jsx`, `shared/layouts/ContentLayout.jsx`, `app/layouts/AuthLayout.jsx` |
| Navigation | `app/navigation/navigation.js` |
| Zustand store | `shared/stores/project-context.store.js` |
| TanStack Query | `shared/api/query-client.js`, feature hooks/pages using `useQuery` and `useMutation` |
| Local persistence | `shared/services/indexeddb.service.js`, `shared/services/browser-file-storage.service.js` |
| Mock JSON | `src/mocks/*.json` |
| Feature services | Auth, user, department, project, document, file, workflow attachment, notification, audit, SLA, escalation |
| Repositories | IndexedDB repositories under each feature |
| Forms and validation | Zod schemas and modal/page validation |
| Constants/enums | Document, upload, user, department, project, audit constants |
| Utilities | SLA timer display, document action visibility, drawing context |
| Backend/database folders | `apps/backend/` empty; `database/migration`, `database/schema`, `database/seed` empty |

Reference documents checked:

- `docs/architecture/STORAGE-STRATEGY.md`
- `docs/architecture/DATABASE-READINESS-AUDIT.md`
- `docs/source-of-truth/ACCESS-CONTROL.md`
- `docs/source-of-truth/API-CONTRACT.md`
- `docs/source-of-truth/BUSINESS-WORKFLOW.md`
- Governance notes for Project Close, especially `docs/governance/CR-012.md`, `CR-012-Project-Close-v2.md`, and `KEPUTUSAN-CLOSED-PROJECT.md`

---

# 3. Repository Inventory

## 3.1 Top-Level Structure

| Path | Current Finding |
|---|---|
| `apps/frontend/` | Main implemented EDMS application. React 19, Vite, Zustand, TanStack Query, IndexedDB fake persistence. |
| `apps/backend/` | Folder exists but contains no implementation files at audit time. |
| `database/migration/` | Folder exists, empty. |
| `database/schema/` | Folder exists, empty. |
| `database/seed/` | Folder exists, empty. |
| `docs/architecture/` | Contains storage strategy, readiness audit, working draft. |
| `docs/source-of-truth/` | Supporting docs; partially outdated per Phase A. |
| `docs/governance/` | Business decisions and change requests. |

## 3.2 Frontend Feature Folders

| Feature Folder | Pages | Components | Hooks | Services | Repositories | Schemas | Constants/Utils |
|---|---|---|---|---|---|---|---|
| `auth` | Login, forgot password, check email, mock email detail, reset password, profile, change password, legacy UserManagement page | Password input via shared form | Page-local hooks/state | `auth.service`, `auth-seed.service` | `auth.repository`, `password-reset.repository` | `password-recovery.schema` | Auth storage keys in service |
| `dashboard` | Dashboard | Dashboard table reuse | Uses document table hook | Uses Document, SLA, Escalation services | None direct | None | Dashboard KPI logic in page |
| `document-register` | Document Register | Table, dashboard table, action group, action modal, preview canvas, spreadsheet preview | `useDocumentRegisterTable` | `document.service`, `file.service`, `workflow-attachment.service`, `comment-read.service`, seed/reset services | `document.repository` | Modal-local validation | Document constants, upload constants, drawing context, action visibility |
| `sla-management` | None | None | None | SLA engine, migration, responsible party resolver | Uses document/user/project repositories through services | None | SLA timer display utilities |
| `sla-monitoring` | SLA Monitoring | Table, summary | `useSlaMonitoringTable` | `sla-monitoring.service` | None direct | None | Uses document/SLA constants |
| `escalation-alert` | Escalation Alert | Table, summary | `useEscalationAlertTable` | `escalation.service` | None direct | None | Escalation level logic in service/hook |
| `notification` | Notification Page | Table, summary, detail modal | `useNotificationPage`, `useCurrentUserUnreadNotificationCount` | `notification.service` | `notification.repository` | None | Event type constants in service |
| `audit-trail` | Audit Trail Page | Table, summary, detail modal | `useAuditTrailPage` | `audit-trail.service` | `audit-trail.repository` | None | Audit action/resource constants |
| `user-management` | User Management | Department management section | Page-local state | User, department, seed, demo reset services | User and department repositories | User and department Zod schemas | User, department, query constants |
| `project` | Select Project, Project Management, Project Membership Management | Active project selector, no access state | Page-local state | `project.service` | `project.repository` | Project Zod schemas | Project status/role constants |
| `_template` | None | None | None | None | None | None | Development template only |

## 3.3 Shared Modules

| Shared Module | Current Use |
|---|---|
| `shared/api/query-client.js` | TanStack Query client. |
| `shared/api/*axios*` and `api-client.js` | API abstraction placeholders; no real backend integration observed in audited flows. |
| `shared/stores/project-context.store.js` | Zustand store for accessible projects, active project, active membership, official role, loading/error flags. |
| `shared/services/indexeddb.service.js` | Creates IndexedDB database `edms-file-storage`, version 10, with all fake persistence stores. |
| `shared/services/browser-file-storage.service.js` | Stores browser `File` blobs plus metadata in IndexedDB `files` store keyed by `storagePath`. |
| `shared/services/authorization.service.js` | Resolves system and active project permissions from `users.json` role/permission catalog. |
| `shared/hooks/usePermission.js` | Permission helper wrapper. |
| `shared/components/toast/*` | Toast runtime UI state. |
| `shared/components/form/*` | Shared select/password UI controls. |

## 3.4 IndexedDB Store Inventory

Implemented in `shared/services/indexeddb.service.js`:

| Store | Key | Indexes Observed |
|---|---|---|
| `documents` | `id` | `projectId` |
| `documentRevisions` | `id` | `documentId`, `projectId`, `documentProject` |
| `documentHistory` | `id` | `documentId`, `projectId`, `documentProject` |
| `files` | `storagePath` | None |
| `metadata` | `key` | None |
| `workflowComments` | `id` | `documentId`, `projectId`, `documentProject` |
| `commentReadReceipts` | `id` | `documentId`, `userDocument`, `projectId` |
| `notifications` | `id` | `recipientUserId`, `projectId`, `recipientProject`, unique `identityKey` |
| `users` | `id` | unique `username` |
| `userCredentials` | `userId` | None |
| `departments` | `id` | unique `nameKey` |
| `auditTrail` | `id` | unique `identityKey`, `createdAt`, `action`, `actorUserId`, `projectId` |
| `projects` | `id` | unique `projectCode` |
| `projectMemberships` | `id` | `userId`, `projectId`, `userProjectRole` |
| `passwordResetTokens` | `token` | `userId`, `requestId` |
| `mockEmails` | `id` | `requestId`, `createdAt` |

---

# 4. Module Inventory

| Module | Current Status | Primary Evidence |
|---|---|---|
| Authentication | Implemented with localStorage session and IndexedDB credentials | `auth.service.js`, auth pages |
| Password Recovery | Implemented as mock email/reset token flow | `password-reset.repository.js`, forgot/check/mock/reset pages |
| User Profile | Implemented | `ProfilePage.jsx`, `AuthService.updateCurrentProfile` |
| Change Password | Implemented | `ChangePasswordPage.jsx`, `AuthService.changePassword` |
| User Management | Implemented | `UserManagementPage.jsx`, `user.service.js` |
| Department Management | Implemented within User Management | `DepartmentManagementSection.jsx`, `department.service.js` |
| Role Management | Not implemented as standalone CRUD; role catalog fixed in mock/constants | `users.json`, `authorization.service.js` |
| Permission Management | Not implemented as standalone CRUD; permission catalog fixed in mock | `users.json`, navigation |
| Project Management | Implemented | `ProjectManagementPage.jsx`, `project.service.js` |
| Project Membership | Implemented | `ProjectMembershipManagementPage.jsx`, `project.service.js` |
| Active Project Context | Implemented | `project-context.store.js`, `ProjectService.resolveActiveProject` |
| Dashboard | Implemented | `DashboardPage.jsx` |
| Document Register PFD/P&ID | Implemented | routes and `DocumentRegisterPage.jsx` |
| Create Document | Implemented | `CreateDocumentModal`, `DocumentService.createDocument` |
| Edit Document | Implemented | `EditDocumentModal`, `DocumentService.updateDocument` |
| Viewer/Preview | Implemented for PDF/image/DOCX/fallback | `FileService.getDocumentPreview`, `PreviewCanvas`, `SpreadsheetPreview` |
| Download Document | Implemented using browser object URL | `FileService.downloadDocumentFile` |
| Approval Workflow | Implemented for Approval A/B/C | `DocumentService.processWorkflowAction` |
| Workflow Comment | Implemented for Approval B/C and comments modal | `workflowComments` store, `DocumentActionGroup` |
| Workflow Attachment | Implemented for Approval B/C only | `workflow-attachment.service.js` |
| Document History/Timeline | Implemented | `documentHistory` store, `getDocumentTimelineByDocumentId` |
| Upload Revision | Implemented from comment/reject statuses | `DocumentService.processUploadRevision` |
| Archive | Implemented for Admin on Active Project/Approved docs | `archiveDocument` |
| Restore | Implemented for Admin on Active Project/Archived docs | `restoreDocument` |
| SLA Monitoring | Implemented as derived evaluation plus notification marker | `sla-monitoring.service.js`, SLA hooks |
| Escalation Alert | Implemented as derived from SLA overdue | `escalation.service.js`, escalation hooks |
| Notification | Implemented per recipient/project | `notification.service.js` |
| Audit Trail | Implemented with soft hide | `audit-trail.service.js` |
| Transmittal Incoming/Outgoing | Route exists but page is under development placeholder | `root.route.js`, `navigation.js` |
| Storage NAS | Route exists but page is under development placeholder | `root.route.js`, `navigation.js` |
| Reset Demo Data | Implemented as frontend demo utility services, not visible as primary routed module in audited routes | reset/demo services |

---

# 5. Feature Inventory

## 5.1 Authentication and Profile

| Feature | Description | Components/Pages | Services | Store/Data | Workflow |
|---|---|---|---|---|---|
| Login | Username/password check against IndexedDB credential, then set `edms.currentUser` | `LoginPage` | `AuthService.login` | `users`, `userCredentials`, localStorage | Records Login audit; resolves project context after login. |
| Logout | Clears current user | App shell/auth UI | `AuthService.logout` | localStorage | Records Logout audit. |
| Forgot password | Generic response regardless account match | `ForgotPasswordPage` | `AuthService.forgotPassword` | `passwordResetTokens`, `mockEmails` | Revokes active tokens for matching user, creates mock email and audit. |
| Reset password | Validates token state and updates credential password | `ResetPasswordPage` | `AuthService.resetPassword` | `passwordResetTokens`, `userCredentials` | Marks token used and records audit. |
| Mock email detail | Displays dev reset email/token | `MockEmailDetailPage` | `AuthService.getMockEmailDetail` | `mockEmails` | Development-only behavior in current implementation. |
| Profile update | Updates current user's `fullName` and `email` | `ProfilePage` | `AuthService.updateCurrentProfile`, `UserService.updateUser` | `users`, localStorage | Records Edit Profile audit. |
| Change password | Updates credential after current password check | `ChangePasswordPage` | `AuthService.changePassword` | `userCredentials` | Records Change Password audit. |

## 5.2 Project and Membership

| Feature | Description | Components/Pages | Services | Store/Data | Workflow |
|---|---|---|---|---|---|
| Project list/query | Search, filter, sort, paginate projects | `ProjectManagementPage` | `ProjectService.getProjectList/queryProjects` | `projects` | Admin-facing operational list. |
| Create/update project | Validated by Zod; project code uniqueness checked | `ProjectManagementPage` | `createProject`, `updateProject` | `projects` | Records audit in project service. |
| Activate/deactivate project | Status transition Active/Inactive | `ProjectManagementPage` | `activateProject`, `deactivateProject` | `projects` | Closed project is final in service rules. |
| Close project | Validates active project, admin, no active workflow docs, confirmation code/checklist | `ProjectManagementPage` | `validateProjectClose`, `closeProject` | `projects`, `documents`, `documentHistory`, `auditTrail` | Sets project Closed; auto-archives Approved Active documents; records Project Closed audit. |
| Project membership list/query | Enriched with project/user display data | `ProjectMembershipManagementPage` | `getEnrichedProjectMemberships` | `projectMemberships`, `projects`, `users` | Search/filter/sort/paginate runtime behavior. |
| Create/update membership | Validates project, user, official role, status | `ProjectMembershipManagementPage` | `createProjectMembership`, `updateProjectMembership` | `projectMemberships` | Closed project membership is read-only; active membership requires active project/user. |
| Active project selection | Stores per-user active project id in localStorage and Zustand | `SelectProjectPage`, `ActiveProjectSelector`, `AppShell` | `resolveActiveProject`, `setActiveProjectForUser` | localStorage `edms.activeProjectByUser`, Zustand | Active Project gates project-scoped routes. |

## 5.3 Document Register and Workflow

| Feature | Description | Components/Pages | Services | Store/Data | Workflow |
|---|---|---|---|---|---|
| Document list | Project-scoped list filtered by lifecycle and drawing | `DocumentRegisterPage`, `DocumentRegisterTable` | `getDocumentsByDrawing`, `getDocumentsByLifecycle` | `documents` | Admin can use lifecycle filter; non-admin sees active lifecycle. |
| Create document | Creates document, first revision, history, active file metadata | `CreateDocumentModal` | `createDocument`, `uploadDocumentFile` | `documents`, `documentRevisions`, `documentHistory`, `files` | Initial status Process Review, revision IFR-Submitted, responsible role Team Process. |
| Edit document | Updates description/area/days and optionally file depending UI action | `EditDocumentModal`, action group | `updateDocument` | `documents`, maybe `files` | Does not create workflow transition unless upload revision flow is used. |
| Approval A | Status transition according to current status | `DocumentActionGroup`, modal | `processWorkflowAction` | `documents`, `documentRevisions`, `documentHistory`, notifications, audit | Process Review -> Project Review; Project Review -> Approved. |
| Approval B | Sends document to comment status; workflow comment is mandatory and attachment is optional evidence | Action modal | `processWorkflowAction`, `WorkflowAttachmentService` | `documents`, `workflowComments`, `files`, `documentHistory` | Process Review -> Process Comment; Project Review -> Project Comment. |
| Approval C | Sends document to reject status; default message if no comment | Action modal | `processWorkflowAction`, `WorkflowAttachmentService` | `documents`, `workflowComments`, `files`, `documentHistory` | Process Review -> Process Reject; Project Review -> Project Reject. |
| Upload revision | From comment/reject statuses back to review | Action modal | `processUploadRevision`, file replacement helpers | `documents`, `documentRevisions`, `documentHistory`, `files` | Creates new active revision/file; old active file moved into `fileHistory`. |
| View/preview | Opens active file; DOCX converted with `mammoth`; PDF/image native preview | Preview components | `FileService.getDocumentPreview` | `files`, document file metadata | Viewer reads by current active file state. |
| Download | Downloads active file using original file name | Table/action group | `FileService.downloadDocumentFile` | `files`, audit | Creates object URL; records Download Document audit. |
| Workflow comments | Lists workflow comments by document/project | Action group/modal | `getWorkflowCommentsByDocumentId` | `workflowComments` | Sorted newest first. |
| Comment read receipts | Tracks read state per user/document/comment | Action group | `CommentReadService` | `commentReadReceipts` | Runtime unread indicator plus persisted receipt. |
| Document timeline | Lists document history records | History modal | `getDocumentTimelineByDocumentId` | `documentHistory` | Sorted by timestamp/sequence/id fallback. |
| Archive document | Admin-only, Active Project, Approved document | Archive modal/action | `archiveDocument` | `documents`, `documentHistory`, `auditTrail` | Sets lifecycle Archived and stores archive metadata. |
| Restore document | Admin-only, Active Project, Archived document | Action group | `restoreDocument` | `documents`, `documentHistory`, `auditTrail` | Sets lifecycle Active and clears archive fields. |

## 5.4 Dashboard, SLA, Escalation

| Feature | Description | Components/Pages | Services | Store/Data | Workflow |
|---|---|---|---|---|---|
| Dashboard KPI | Counts documents by workflow statuses | `DashboardPage` | `DocumentService.getDocuments` | `documents` | Derived counts only. |
| Dashboard document table | Reuses document register table | `DashboardDocumentRegisterTable` | `useDocumentRegisterTable` | `documents` | KPI card status filters drive table. |
| SLA Overview | Counts On Track, At Risk, Overdue, Final As-Built | `DashboardPage`, `SlaSummary` | `SlaMonitoringService.createSummary` | Derived from documents | Refreshes at intervals. |
| SLA Monitoring | Lists documents with SLA timer/status | `SlaMonitoringPage` | `SlaMonitoringService.getDocuments` | `documents`, `slaStateEvaluation` | Creates At Risk/Overdue notification once per SLA cycle. |
| Escalation Alert | Lists overdue active workflow documents | `EscalationAlertPage` | `EscalationService.getEscalations` | Derived from documents plus audit side effect | Records Escalation Created audit with identity key. |

## 5.5 Notification and Audit

| Feature | Description | Components/Pages | Services | Store/Data | Workflow |
|---|---|---|---|---|---|
| Create workflow notification | Creates personal notification for role/membership recipients | Service side effect | `NotificationService.createWorkflowNotification` | `notifications` | Triggered by upload, approval, revision, approved. |
| Create SLA notification | Creates At Risk/Overdue notifications | SLA service | `createSlaStateNotification` | `notifications`, document `slaStateEvaluation` | Duplicate controlled by identity key and SLA marker. |
| Notification list | Search, filter, sort, paginate current user's project notifications | `NotificationPage`, hook | `getCurrentUserNotifications` | `notifications` | Current active project and current user scoped. |
| Notification read | Mark one, selected, or all as read | Notification page | `markAsRead`, `markNotificationsAsRead`, `markAllAsRead` | `notifications`, `auditTrail` | Records Notification Read audit. |
| Notification delete | Deletes selected notifications owned by current user | Notification page | `deleteCurrentUserNotifications` | `notifications` | Personal delete in current implementation. |
| Direct open notification | Resolves target route and project context; blocks inactive/closed/archive/missing cases | Notification page | `resolveDirectOpenTarget` | `projects`, `memberships`, `documents` | Can switch active project before navigating. |
| Audit record | Creates audit trail records with dictionary action/detail | Feature services | `AuditTrailService.recordActivitySafely` | `auditTrail` | Identity key prevents duplicates. |
| Audit list/detail | Search, filter, sort, paginate visible active project audit | `AuditTrailPage` | `getActivityList`, `getActivityDetail` | `auditTrail` | Project scoped. |
| Audit summary/filter options | Counts today/total/active users and available filters | Audit hook/page | `getActivitySummary`, `getActivityFilterOptions` | `auditTrail` | Derived from visible records. |
| Audit soft hide | Admin can hide selected visible records | Audit page | `softDeleteActivities` | `auditTrail` | Sets deletion/hide fields in repository; records become invisible. |

---

# 6. Data Flow Inventory

## 6.1 Login and Active Project Context

```text
Login form
-> AuthService.login(username, password)
-> UserService/UserCredentialRepository
-> validate active user and active credential
-> localStorage edms.currentUser
-> AuditTrailService LOGIN
-> ProjectService.resolveActiveProject
-> localStorage edms.activeProjectByUser
-> Zustand project-context.store
-> ProtectedRoute/ProjectContextRoute gates operational pages
```

## 6.2 Create Document

```text
DocumentRegisterPage
-> CreateDocumentModal form validation
-> DocumentService.createDocument
-> active project required
-> project membership/access and permission check
-> document number uniqueness within active project
-> ProjectService.resolveCurrentAssignee(Team Process)
-> FileService.uploadDocumentFile
-> BrowserFileStorageService.saveFile(files store)
-> documents + documentRevisions + documentHistory mutation
-> SLA initial fields and evaluation
-> NotificationService.createWorkflowNotification(Document Uploaded)
-> AuditTrailService Upload Document
-> Document Register/Dashboard/SLA/Escalation views reload or recalculate
```

## 6.3 Approval Workflow

```text
DocumentActionGroup
-> DocumentService.processWorkflowAction(documentId, Approval A/B/C)
-> active project/document/project role/permission validation
-> transition matrix calculates next status
-> revision label matrix calculates next revision display
-> SLA status entry reset based on new document status
-> optional workflow comment and attachment for Approval B/C
-> documents + active revision + workflowComments + documentHistory mutation
-> WorkflowAttachmentService saves attachment file when supplied
-> NotificationService creates next recipient notification
-> AuditTrailService records workflow action
-> optional attachment audit
-> optional document approved audit
-> optional escalation resolved audit
```

## 6.4 Upload Revision

```text
Document action modal
-> DocumentService.processUploadRevision
-> document must be active lifecycle and in active project
-> allowed only from Process/Project Comment or Reject statuses
-> Document Owner or Admin project role required
-> FileService.prepareFileReplacement(revisions path)
-> FileService.finalizeFileReplacement
-> previous active file metadata set inactive
-> new file metadata set active
-> documents updated with new activeFileId, activeRevisionId, fileHistory, status, SLA fields
-> previous active revisions set inactive
-> new documentRevision added
-> documentHistory Upload Revision added
-> NotificationService Revision Uploaded
-> AuditTrailService Upload Revision
-> optional escalation resolved audit
```

## 6.5 Archive and Restore

```text
Archive:
Document action
-> DocumentService.archiveDocument
-> Active Project + Admin role + archive permission
-> document must be Approved and Active lifecycle
-> documents updated lifecycle Archived with archivedAt/archivedBy/archiveReason
-> documentHistory Document Archived
-> AuditTrailService Document Archived

Restore:
Document action
-> DocumentService.restoreDocument
-> Project must still be Active
-> Active Project + Admin role + archive permission
-> document must be Archived
-> documents updated lifecycle Active and archive fields cleared
-> documentHistory Document Restored
-> AuditTrailService Document Restored
```

## 6.6 Project Close

```text
ProjectManagementPage
-> ProjectService.validateProjectClose
-> current user must be Admin by roleId mapping
-> project must be Active
-> active workflow document count must be 0
-> confirmation code and checkbox required
-> ProjectService.closeProject
-> Approved Active documents mapped to Archived
-> documentHistory archive records created
-> project status set Closed with closedAt/closedBy
-> ProjectPersistenceRepository.runCloseProject
-> AuditTrailService Project Closed
-> active project context resolved again
-> dashboard/documents/notifications/audit/SLA/escalation queries invalidated
```

## 6.7 SLA Monitoring and Escalation

```text
DocumentService.getDocuments
-> SlaResponsiblePartyResolverService.resolveDocuments
-> SlaEngineService.evaluate
-> SLA status/timer derived from slaStartedAt, slaStoppedAt, status, daysUntilValidation, current time
-> SlaMonitoringService.createSlaTransitionNotifications
-> document.slaStateEvaluation persisted as notification marker
-> NotificationService creates SLA At Risk/Overdue notification when transition is new
-> EscalationService derives overdue items
-> AuditTrailService records Escalation Created using identity key
```

## 6.8 Notification Direct Open

```text
NotificationPage
-> NotificationService.resolveDirectOpenTarget
-> validate notification belongs to current user and project
-> validate project exists and is Active
-> validate active membership
-> resolve related document by id or document number
-> block archived/missing/inactive/closed target states
-> for SLA/Escalation, validate current operational SLA state still matches
-> optionally switch active project
-> navigate to Document Register, SLA Monitoring, or Escalation Alert with documentNumber search
```

## 6.9 Audit Trail

```text
Feature service event
-> AuditTrailService.recordActivitySafely
-> normalize actor from current user/localStorage and active official role for project-scoped resources
-> map action to AUDIT_TRAIL_DICTIONARY businessEvent/detail
-> create identityKey if not supplied
-> AuditTrailRepository.create unless duplicate
-> AuditTrailPage queries active project visible records
-> Admin can soft hide selected visible records
```

---

# 7. Current Data Requirements

## 7.1 Page-Level Requirements

| Page/Feature | Data Required by Current Implementation |
|---|---|
| Login | username, password, user active state, credential active state, current user session snapshot |
| Forgot Password | username, email, user, credential, requestId, token, token created/expires/used/revoked, mock email |
| Reset Password | token state, user, credential, new password, confirm password |
| Profile | current user id/name/fullName/email/username/department/status |
| Change Password | username/current password/new password/confirm password/credential |
| Select Project | accessible active projects for current user, memberships, stored active project preference |
| Dashboard | active project documents, document status counts, SLA summary, escalation summary, document table rows |
| Document Register | document number, description, drawing, area, revision, status, lifecycle, responsible role, current assignee, SLA status/timer, active file metadata, history, workflow comments, permissions |
| Create Document | documentNumber, description, drawing, area, daysUntilValidation, file, createdBy, active project, actor membership |
| Edit Document | description, area, daysUntilValidation, optional file, current active file metadata, status/lifecycle validation |
| Approval Modal | workflow action, comment, optional attachment for B/C, actor role, current document status, current assignee target |
| Upload Revision | new file, description/area/daysUntilValidation updates, previous active file, active revision state |
| Viewer/Preview | storagePath, activeFileId, file blob, file metadata, viewerType, previewHtml/messages for DOCX |
| History | documentHistory records plus document identity/status/revision |
| SLA Monitoring | evaluated documents, SLA status, SLA timer, responsible role/department display, status filters |
| Escalation Alert | overdue evaluated documents, daysOverdue, overdueDuration, escalationLevel |
| Notification Page | notifications owned by current user in active project, read state, event type, priority, target document/project |
| Audit Trail Page | active project audit records, actor, action, resource, reference, timestamps, hidden/deleted flag |
| User Management | users, credentials, departments, statuses, uniqueness of username/email |
| Department Management | departments, nameKey, status, user references to department name |
| Project Management | projects, status, close summary counts, operational data existence |
| Project Membership | memberships, projects, users, official role, status |
| Transmittal | Navigation/route placeholder only; no operational data requirement found in implementation. |
| Storage NAS | Navigation/route placeholder only; no operational data requirement found in implementation. |

## 7.2 Record Shape Requirements Observed

| Data Object | Fields Observed in Implementation |
|---|---|
| User | `id`, `userCode`, `username`, `fullName`, `name`, `email`, `department`, `position`, `roleId`, `officialRole`, `status`, `isActive`, `createdAt`, `updatedAt` |
| Credential | `userId`, `password`, `isActive`, `updatedAt` |
| Password reset token | `token`, `userId`, `requestId`, `createdAt`, `expiresAt`, `usedAt`, `revokedAt` |
| Mock email | `id`, `requestId`, `from`, `to`, `subject`, `token`, `userId`, `username`, `createdAt` |
| Department | `id`, `name`, `departmentName`, `nameKey`, `status`, `createdAt`, `updatedAt` |
| Role | `id`, `roleCode`, `roleName`, `isActive` |
| Permission | `id`, `permissionCode`, `permissionName` |
| Role permission | `roleId`, `permissionId` |
| Project | `id`, `projectCode`, `projectName`, `description`, `status`, `createdDate/createdAt`, `lastUpdated`, `createdBy`, `lastUpdatedBy`, `closedAt`, `closedBy` |
| Project membership | `id`, `projectId`, `userId`, `officialRole`, `status`, `assignedBy`, `assignedDate`, `lastUpdated`, `lastUpdatedBy` |
| Document | `id`, `projectId`, `documentNumber`, `description`, `drawing`, `area`, `revision`, `lifecycle`, `status`, `responsibleRole`, `currentAssignee`, `daysUntilValidation`, `createdDate`, `createdBy`, `lastUpdated`, `lastUpdatedBy`, `activeFileId`, `activeRevisionId`, `storagePath`, `fileMetadata`, `fileHistory`, `archivedAt`, `archivedBy`, `archiveReason`, `restoredAt`, `restoredBy`, `slaAssignee`, `slaStartedAt`, `slaStoppedAt`, `slaStateEvaluation` |
| Document revision | `id`, `projectId`, `documentId`, `revision`, `activeFileId`, `storagePath`, `isActive`, `createdAt`, `createdBy` |
| Document history | `id`, `projectId`, `documentId`, `workflowEvent`, `activity`, `status`, `revision`, `createdDate`, `createdBy`, `createdByOfficialRole`, optional `lifecycle`, `reason` |
| Stored browser file record | `storagePath`, `file`, `metadata`, `storedAt` |
| Document file metadata | `fileId`, `documentId`, `revisionId`, `fileName`, `originalFileName`, `fileExtension`, `mimeType`, `fileSize`, `fileSizeDisplay`, `storageType`, `uploadedAt`, `uploadedBy`, `isActive`, `activeVersion` |
| Workflow comment | `id`, `projectId`, `documentId`, `workflowAction`, `workflowComment`, `createdDate/createdAt`, `createdBy`, `createdByOfficialRole`, `attachment` |
| Workflow attachment metadata | `attachmentId`, `commentId`, `documentId`, `storageReference`, `storageType`, `originalFileName`, `fileExtension`, `mimeType`, `fileSize`, `fileSizeDisplay`, `uploadedAt`, `uploadedBy` |
| Comment read receipt | `id`, `projectId`, `documentId`, `commentId`, `userId`, `readAt` |
| Notification | `id`, `identityKey`, `projectId`, `recipientUserId`, `recipientProjectMembershipId`, `eventType`, `title`, `message`, `priority`, `officialRole`, `recipientRole`, `relatedResourceType`, `relatedResourceId`, `relatedDocumentNumber`, `actionTarget`, `read`, `readAt`, `readStatus`, `createdAt`, `metadata` |
| Audit trail | `id`, `identityKey`, `projectId`, `actorUserId`, `actorName`, `department`, `officialRole`, `action`, `businessEvent`, `detail`, `resourceType`, `resourceId`, `reference`, `metadata`, `createdAt`, `timestamp`, `isDeleted`, `deletedAt`, `deletedByUserId` |
| Metadata marker | `key`, `value` |

---

# 8. Persistence Classification

## 8.1 Persistent Data

Data berikut benar-benar disimpan di IndexedDB stores atau localStorage:

| Classification | Data |
|---|---|
| IndexedDB business data | Users, credentials, departments, projects, project memberships, documents, revisions, document history, workflow comments, comment read receipts, notifications, audit trail |
| IndexedDB file data | Browser `File` blobs and file/attachment metadata in `files` store |
| IndexedDB technical metadata | Seed versions, migration versions, compatibility flags |
| Password recovery dev data | Password reset tokens, mock emails |
| Browser localStorage | `edms.currentUser`, `edms.activeProjectByUser`, sidebar collapsed state |

## 8.2 Derived Data

Data berikut dihitung dari data lain pada runtime:

| Derived Data | Derivation |
|---|---|
| Dashboard KPI counts | Counts from active project documents by status/lifecycle |
| SLA status | `status`, `slaStartedAt`, `slaStoppedAt`, `daysUntilValidation`, current time |
| SLA timer display | elapsed minutes formatted to `Xd Xh Xm` or `Done` |
| SLA WIB timestamps | formatted from UTC timestamps |
| SLA summary | count by evaluated SLA status |
| Escalation item | evaluated document where status is not Approved and SLA is Overdue |
| Escalation level | days overdue thresholds: Level 1 >=1, Level 2 >=4, Level 3 >=7, Level 4 >=10 |
| Overdue duration | SLA elapsed time minus validation days |
| Current assignee display | resolved from project membership official role and active users |
| SLA responsible department display | resolved from active departments/users/memberships |
| Notification unread count | count unread notifications for user/project |
| Audit summary | count visible records and active users today |
| Search/filter/sort/pagination results | React state and service functions |
| File size display | formatted from raw `fileSize` |
| Viewer type | derived from file extension/MIME |

## 8.3 Runtime Data

| Runtime Data | Location |
|---|---|
| Zustand project context loading/error state | `project-context.store.js` |
| Current page filters, selected rows, pagination | React hook/page state |
| Modal open/close and submitting state | React component state |
| Preview object URLs | Browser runtime |
| TanStack Query cache | Query client runtime |
| Dashboard right panel collapsed module variable | `DashboardPage.jsx` module state |
| Refresh keys and interval timers | Hooks/pages |

## 8.4 Presentation Data

| Presentation Data | Evidence |
|---|---|
| Navigation titles/icons | `navigation.js` |
| Card colors, table styles, labels, descriptions | React components/pages |
| Toast messages | Feature pages and toast provider |
| Direct open error copy | `notification.service.js` |
| Button visibility grouping top/workflow/history | `documentActionVisibility.js` |
| Lifecycle filter visibility for Admin only | `useDocumentRegisterTable` |

## 8.5 Configuration Data

| Config Data | Evidence |
|---|---|
| Document statuses, revisions, lifecycle, action codes | `document.constants.js` |
| Official roles | `document.constants.js`, `project.constants.js`, `user.constants.js` |
| Permission codes | `users.json`, `document.constants.js`, `navigation.js` |
| File validation accepted types and max size | `file.service.js`, `upload.constants.js` |
| Workflow attachment allowed types | `workflow-attachment.service.js` |
| Project/member statuses | `project.constants.js` |
| User/department statuses | user and department constants |
| Audit action dictionary | `audit-trail.constants.js` |
| Notification event dictionary | `notification.service.js` |
| Seed and migration version constants | seed/migration services |

## 8.6 Legacy or Historical Data

| Legacy/Historical Structure | Current Finding |
|---|---|
| `DATABASE-SCHEMA-WORKING-DRAFT.md` | Historical reference only per Phase A. |
| Legacy user official role migration | `ProjectService` migrates legacy user role to project membership when needed. |
| Global `roleId` on user | Still used for system authorization and admin project close check; project official role comes from membership. |
| Empty operational mocks | Documents/projects/comments/notifications/timelines JSON are empty but seed services still support them. |
| `document.fileHistory` embedded file references | Current frontend keeps historical active files inside document record. |
| Workflow comment embedded `attachment` | Current frontend stores attachment metadata inside workflow comment. |
| Placeholder routes | Transmittal and Storage NAS routes exist but render "under development". |

---

# 9. Workflow Inventory

| Workflow | Current Implementation |
|---|---|
| Authentication | Login validates IndexedDB user and credential, sets localStorage current user, records audit. Logout clears localStorage and records audit. |
| Password recovery | Forgot password creates token/mock email only for matching active account but always returns generic success. Reset validates token invalid/used/expired/valid state and updates credential. |
| Active Project | Accessible projects = active projects with active memberships for active user. Last selected project is stored in localStorage per user. |
| Project lifecycle | Active/Inactive supported; Closed supported as final state via close project flow. |
| Project close | Admin only; Active project only; blocked if active workflow documents exist; Approved Active docs become Archived; Archived docs remain Archived; project becomes Closed. |
| Membership lifecycle | Active/Inactive; Active requires active user and active project; Closed project memberships read-only. |
| User lifecycle | Active/Inactive; delete unsupported. Credential active state mirrors user active state. |
| Department lifecycle | Active/Inactive; delete unsupported. Rename propagates department name references to users. |
| Document lifecycle | Active/Archived. Archive/Restore separate from workflow status and restricted to Admin/Active Project. |
| Document workflow | Process Review -> Approval A/B/C; Project Review -> Approval A/B/C. Approval A can progress to Project Review or Approved; Approval B/C move to Comment/Reject states. |
| Revision workflow | Upload Revision allowed from comment/reject statuses and returns to review status. New file/revision becomes active, previous file/revision becomes inactive/history. |
| Workflow comment | Mandatory for Approval B; created for Approval C when message or attachment exists, with default rejection comment when needed. |
| Workflow attachment | Only Approval B/C supports attachment; allowed types PDF/JPG/JPEG/PNG; stored separately in browser file store but metadata embedded in comment. |
| SLA workflow | SLA timestamp starts/resets when document enters a status via status entry creation. Approved sets stopped timestamp and status Final As-Built. |
| Escalation workflow | Derived from Overdue SLA for non-approved documents; records Escalation Created audit idempotently. |
| Notification workflow | Workflow/SLA events create per-recipient notifications based on project membership official role; read/delete operations are user/project scoped. |
| Audit workflow | Feature services create audit records with identity keys; Audit page shows active project visible records; Admin can soft hide. |

---

# 10. Storage Strategy Validation

Validation reference: `docs/architecture/STORAGE-STRATEGY.md`.

## 10.1 Already Aligned

| Storage Strategy Rule | Current Implementation Evidence |
|---|---|
| Database/source stores metadata separately from physical access concept | Document records contain file metadata and `files` store stores file blob plus metadata. |
| Original file name preserved for UI/download | `FileService.downloadDocumentFile` uses `metadata.originalFileName`; attachment download uses original name fallback. |
| Upload revision creates new file identity | `processUploadRevision` creates new `REV-*` and `FileService` creates new `FILE-*`. |
| Previous revision/history retained in frontend state | Previous active file is appended to `document.fileHistory`; previous active revisions set inactive, not deleted in normal upload revision flow. |
| Workflow attachment is not a revision | `WorkflowAttachmentService` stores attachment under `workflow-attachments/{documentId}/{commentId}` and `DocumentService` only creates it for workflow comments. |
| Archive/Restore do not move files in frontend | `archiveDocument` and `restoreDocument` update document lifecycle/history/audit only; no file movement observed. |
| Download user-facing filename uses original file name | Active document and workflow attachment download both use `originalFileName`. |

## 10.2 Not Yet Aligned or Frontend-Only Difference

| Area | Current Implementation | Storage Strategy Expectation |
|---|---|---|
| Backend as only storage gateway | Frontend directly saves/loads blobs in browser IndexedDB. | Storage Strategy says Backend is the only storage gateway. |
| File metadata single source of truth | Metadata exists embedded in document `fileMetadata`, `fileHistory`, workflow comment `attachment`, and `files.metadata`. | Strategy requires one official metadata record per physical file. |
| Physical file name | Current frontend has `fileId`, `originalFileName`, `storagePath`; no `physicalFileName`/hybrid naming implementation. | Strategy defines separate File Identity, Original File Name, Physical File Name. |
| Storage key/relative path | Current `storagePath` is browser path-like string (`documents/{id}/active/{fileId}`, `workflow-attachments/{documentId}/{commentId}`). | Strategy requires storage-independent metadata reference and relative reference; exact backend key not implemented. |
| Project ownership for file metadata | Document file metadata has `documentId` but not consistently `projectId` inside metadata; project ownership comes through document. Workflow attachment metadata has document/comment but not direct project id. | Strategy says every file belongs to one Project. |
| Checksum/integrity metadata | No checksum calculation observed. | Storage Strategy includes integrity/security principles but checksum details are future/out-of-scope in parts. |
| Immutable permanent file | Frontend updates metadata on saved file and can delete files during rollback/demo reset. | Strategy treats permanent storage as immutable and deletion exceptional; frontend is demo/local persistence. |
| Viewer access | Viewer reads browser file directly from IndexedDB. | Strategy says viewer access should go through metadata/backend gateway. |

## 10.3 Not Implemented in Current Frontend

| Storage Topic | Current Finding |
|---|---|
| NAS/object/cloud provider | Not implemented. |
| Backend upload/download/viewer service | Not implemented. |
| Physical filename lifecycle | Not implemented. |
| Storage provider abstraction | Not implemented beyond browser storage service. |
| File checksum, virus scanning, encryption | Not implemented. |
| File retention/deletion policy | Not implemented. |

---

# 11. Initial Conflict Detection

| ID | Type | Sources | Finding |
|---|---|---|---|
| CON-B-001 | Permission naming conflict | Frontend `users.json`, `navigation.js`; `ACCESS-CONTROL.md`, `API-CONTRACT.md` | Frontend uses `document-register.view`, `sla-monitoring.view`, `escalation.view`, `storage.view`, `approval.a/b/c`; source-of-truth docs also mention abstract names like `document.read`, `sla.read`, `escalation.read`, `storage.read`, `permission.manage`. |
| CON-B-002 | Placeholder vs documented modules | Frontend routes; source-of-truth/API docs | Transmittal and Storage NAS are present in navigation/routes but render under-development placeholders. Docs mention them as required/future modules. |
| CON-B-003 | Storage gateway conflict | Frontend file services; Storage Strategy | Current frontend stores and reads files directly from IndexedDB. Storage Strategy requires Backend as the only storage gateway. |
| CON-B-004 | File metadata duplication | Frontend document/comment/files records; Storage Strategy | Metadata appears embedded in multiple records. Storage Strategy requires one official metadata record per physical file. |
| CON-B-005 | Physical filename not represented | Frontend file metadata; Storage Strategy | Current metadata has `fileId`, `originalFileName`, `storagePath`, but no separate `physicalFileName` field. |
| CON-B-006 | User role vs project official role | Frontend auth/authorization/project service; docs/business decisions | User `roleId` still drives system permission and Project Close admin check, while project scoped official role comes from membership. |
| CON-B-007 | Audit immutability vs soft hide | Frontend audit service; audit/storage/security expectations | Audit records can be soft-hidden by Admin via `isDeleted` style fields, while auditability/immutability principles prefer retained records. |
| CON-B-008 | Mock password/token security | Frontend auth service; API contract/security expectations | Current IndexedDB demo stores plaintext passwords and raw reset tokens. API contract mentions secure random token, token hash, password hashing, no token logging. |
| CON-B-009 | Project seed status | Frontend mocks/seed | `projects.json` and `projectMemberships` are empty, but `DEFAULT_PROJECT_ID` and legacy migration refer to `PRJ-APP-001`. Implementation can operate with empty project seed plus migration skip behavior. |
| CON-B-010 | Empty operational mock data | Frontend mocks | Operational mocks for documents, comments, timelines, notifications are empty, but seed services and repositories support those records. |
| CON-B-011 | Backend/database absence | Repo structure | `apps/backend/` and database folders exist but have no implementation files. |
| CON-B-012 | Area/document type master data ambiguity | Frontend forms/constants; docs | Drawing is fixed route context PFD/P&ID; area is free text in forms. No implemented area master module was found. |
| CON-B-013 | Notification delete behavior | Frontend notification service; audit/retention expectations | Current notification delete physically deletes current user's selected notification records from IndexedDB. No retention policy observed. |
| CON-B-014 | Project Closed notifications | Governance docs; frontend services | Project Close service itself records audit but does not create notifications; generic notification service can create notifications for document/SLA events, while direct open blocks Closed Project. Closed project is excluded from active project context. |

No conflict above is resolved in Phase B. They are recorded for later phases.

---

# 12. Summary

Phase B confirms that the current EDMS implementation is a frontend-complete, browser-persisted application. The operational behavior is concentrated in frontend services and IndexedDB repositories, with Zustand used for active project context and TanStack Query used primarily for user/project/admin, notification, and audit pages.

Primary persistent concepts currently implemented:

- users and credentials;
- departments;
- fixed roles, permissions, and role-permission mapping from mock JSON;
- projects and project memberships;
- active project preference and active project runtime context;
- documents, active revisions, historical revisions, document history;
- browser file records and file metadata;
- workflow comments, workflow attachments, comment read receipts;
- password reset tokens and mock emails;
- notifications;
- audit trail;
- seed/migration metadata.

Primary derived concepts currently implemented:

- dashboard KPI counts;
- SLA timer/status/summary;
- escalation item/level/duration;
- unread notification count;
- audit summary/filter options;
- assignee and department display;
- table search/filter/sort/pagination state.

Important current behavior preserved by audit:

- Database/schema design has not started in this document.
- `DATABASE-SCHEMA-WORKING-DRAFT.md` remains historical only.
- Transmittal and Storage NAS are placeholders, not implemented data modules.
- Current file storage is browser IndexedDB and differs from official Storage Strategy in several areas.
- Archive, Restore, Upload Revision, Approval, SLA, Escalation, Notification, Audit, and Project Close workflows are implemented in frontend services and should be treated as behavioral evidence for Phase C.

Phase B output is complete when this document is used as the factual basis for Phase C. Any future database architecture generation must trace back to this audit and the Phase A authority rules.
