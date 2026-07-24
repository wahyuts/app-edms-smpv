# 🚀 EDMS Rebuild Official Roadmap

---

# Phase 0 — Project Foundation
**Status:** ✅ COMPLETE

## Scope
- Project Structure
- Backend Architecture
- Source of Truth
- Coding Standards
- Storage Architecture
- Environment Configuration
- Database Foundation

---

# Phase 1 — Backend Foundation
**Status:** ✅ COMPLETE

## Scope
- Express Foundation
- MySQL Connection
- Repository Pattern
- Service Layer
- Controller Layer
- Middleware Foundation
- Logger
- Error Handler
- Storage Manager
- File Upload Foundation

---

# Phase 2 — Authentication & Authorization

## Phase 2.1 — Authentication Foundation
**Status:** ✅ COMPLETE

### Scope
- Login
- Logout
- Refresh Token
- JWT Authentication
- HttpOnly Cookie
- `/me`
- Authenticate Middleware

---

## Phase 2.2 — Password Recovery Foundation
**Status:** ✅ COMPLETE

### Scope
- Forgot Password
- Reset Password
- Password Reset Token
- Password Validation

---

## Phase 2.2C — Resend Email Integration
**Status:** ✅ COMPLETE

### Scope
- Email Provider Abstraction
- Dummy Provider
- Resend Provider
- Automatic Provider Selection

---

## Phase 2.3 — Authorization & RBAC
**Status:** ✅ COMPLETE

### Scope
- Role Constants
- Authorization Repository
- Authorization Service
- Role Middleware
- Permission Middleware
- `/me` Authorization Context
- Standard 401 / 403 Handling
- No Admin Universal Bypass

---

## Phase 2.3B — Change Password
**Status:** ✅ COMPLETE

### Scope
- Change Password Endpoint
- Current Password Verification
- Password Policy
- Password Hash Update
- Transaction-safe Update
- Refresh Session Revocation
- Cookie Clearing
- Password Changed Validation

---

## Phase 2.4 — Frontend Authentication Integration
**Status:** 🚧 READY TO START

### Scope
- Frontend Login Integration
- Frontend Logout Integration
- Refresh Token Integration
- `/me` Integration
- Route Protection
- Axios Authentication
- HttpOnly Cookie Integration

### Discussion Required
- Fake API ↔ REST API Migration Strategy
- IndexedDB Coexistence Strategy
- User Synchronization Strategy
- Migration Boundary Definition

---

## Phase 2.5 — Authentication Final Validation
**Status:** ⏳ PENDING

### Scope
- End-to-End Authentication Test
- Cookie Validation
- Session Validation
- Authentication Regression
- Frontend ↔ Backend Validation

---

# Phase 3 — Master Data Management
**Status:** ⏳ PENDING

## Modules
- User Management
- Project Management
- Project Membership
- Role Management
- Permission Management

---

# Phase 4 — Document Management
**Status:** ⏳ PENDING

## Modules
- Document Register
- Create Document
- Edit Document
- Upload Revision
- Viewer
- History
- Archive
- Restore

---

# Phase 5 — Workflow Management
**Status:** ⏳ PENDING

## Modules
- Process Review
- Project Review
- Process Comment
- Project Comment
- Approval A
- Approval B
- Approval C
- Workflow Attachment

---

# Phase 6 — SLA Management
**Status:** ⏳ PENDING

## Modules
- SLA Timer
- SLA Monitoring
- Days Until Validation (DUV)
- On Track
- At Risk
- Overdue
- Final As-Built

---

# Phase 7 — Notification Management
**Status:** ⏳ PENDING

## Modules
- Notification Center
- Read / Unread
- Escalation Notification
- User Notification

---

# Phase 8 — Dashboard
**Status:** ⏳ PENDING

## Modules
- Dashboard KPI
- SLA Overview
- Escalation Alert
- Dashboard Widgets
- Dashboard Summary

---

# Phase 9 — Audit Trail
**Status:** ⏳ PENDING

## Modules
- Activity Log
- Search
- Filter
- Pagination

---

# Phase 10 — System Integration & UAT
**Status:** ⏳ PENDING

## Scope
- Full System Integration
- User Acceptance Test (UAT)
- Bug Fixing
- Performance Testing
- Security Validation

---

# Phase 11 — Production Release
**Status:** ⏳ PENDING

## Scope
- Production Deployment
- Final Data Migration
- Production Validation
- Monitoring
- Go Live

---

# 📊 Overall Progress

| Phase | Status | Progress |
|--------|--------|---------:|
| Phase 0 — Project Foundation | ✅ Complete | 100% |
| Phase 1 — Backend Foundation | ✅ Complete | 100% |
| Phase 2 — Authentication & Authorization | 🚧 In Progress | ~85% |
| Phase 3 — Master Data Management | ⏳ Pending | 0% |
| Phase 4 — Document Management | ⏳ Pending | 0% |
| Phase 5 — Workflow Management | ⏳ Pending | 0% |
| Phase 6 — SLA Management | ⏳ Pending | 0% |
| Phase 7 — Notification Management | ⏳ Pending | 0% |
| Phase 8 — Dashboard | ⏳ Pending | 0% |
| Phase 9 — Audit Trail | ⏳ Pending | 0% |
| Phase 10 — System Integration & UAT | ⏳ Pending | 0% |
| Phase 11 — Production Release | ⏳ Pending | 0% |