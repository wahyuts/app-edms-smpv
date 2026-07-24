# ==============================================================================
# IMPLEMENTATION-PLAN.md
# PART 1 — DOCUMENT OVERVIEW
# ==============================================================================

# 1.1 Purpose

IMPLEMENTATION-PLAN.md merupakan dokumen resmi yang mendefinisikan strategi implementasi Engineering Document Management System (EDMS).

Dokumen ini menerjemahkan Product Requirement Document (PRD) menjadi rencana implementasi teknis yang dapat langsung digunakan oleh Frontend Developer, Backend Developer, QA Engineer, dan AI Coding Agent selama proses pengembangan aplikasi.

IMPLEMENTATION-PLAN.md tidak mendefinisikan kebutuhan bisnis maupun kebutuhan sistem baru. Seluruh implementasi harus mengacu pada Source of Truth yang telah ditetapkan.

---

# 1.2 Objectives

Dokumen ini bertujuan untuk:

- Menentukan urutan implementasi seluruh modul EDMS.
- Menentukan dependency antar modul.
- Menjadi blueprint implementasi Frontend dan Backend.
- Menjadi panduan AI Coding Agent selama proses coding.
- Menjaga konsistensi implementasi sesuai arsitektur proyek.
- Mengurangi risiko implementasi yang tidak sesuai dengan PRD.

---

# 1.3 Scope

IMPLEMENTATION-PLAN.md mencakup:

- Project Architecture
- Development Sequence
- Module Implementation Plan
- Shared Component Planning
- Mock Data Strategy
- Backend Integration Strategy
- Implementation Rules
- Definition of Done
- Project Implementation Checklist

Dokumen ini tidak membahas:

- Business Workflow
- Business Rules
- Functional Requirements
- UI Design Detail
- API Contract
- Database Schema

Topik tersebut dijelaskan pada dokumen Source of Truth lainnya.

---

# 1.4 Target Readers

Dokumen ini ditujukan untuk:

| Role | Purpose |
|------|---------|
| Product Owner | Mengontrol roadmap implementasi |
| Project Manager | Mengelola tahapan pengembangan |
| Frontend Developer | Implementasi User Interface |
| Backend Developer | Implementasi REST API dan Business Logic |
| QA Engineer | Menyusun skenario pengujian |
| AI Coding Agent | Menghasilkan source code berdasarkan Implementation Plan |

---

# 1.5 Source Documents

Seluruh isi IMPLEMENTATION-PLAN.md wajib mengacu pada dokumen berikut.

## Primary Source

- BUSINESS-WORKFLOW.md
- PRD.md
- ENGINEERING-FOUNDATION.md
- Approved UI Design Mockup

Historical Reference / Unavailable:

- SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable)
- FEATURE-MAPPING.md (Historical Reference / Unavailable)

Kedua dokumen di atas tidak tersedia pada repository saat normalisasi DOMAIN 3. Keduanya tidak boleh diperlakukan sebagai active dependency sampai file resmi tersedia kembali.

Apabila terjadi perbedaan informasi, maka prioritas mengikuti Project Documentation Hierarchy yang telah ditetapkan.

Frontend implementation baseline mengikuti PHASE 2 runtime architecture: React + Vite + JavaScript (JSX), React Router, Tailwind CSS, Axios melalui Service Layer, TanStack Query untuk Server State, Zustand untuk Global UI/Session/Active Project Context, React Hook Form, dan Zod.

---

# 1.6 Implementation Principles

Seluruh implementasi wajib mengikuti prinsip berikut.

- Requirement First.
- Single Source of Truth.
- Feature First Architecture.
- Mock First Development.
- Service Layer Pattern.
- Reusable Component.
- Mobile Responsive.
- API Ready.
- Keep It Simple.
- Code Consistency.

---

# 1.7 Expected Outcome

Setelah IMPLEMENTATION-PLAN.md selesai, AI Coding Agent harus mampu:

- Memahami urutan pembangunan sistem.
- Mengetahui file yang harus dibuat.
- Mengetahui dependency setiap modul.
- Mengimplementasikan Frontend sesuai Approved UI Mockup.
- Mengimplementasikan Backend sesuai Engineering Foundation.
- Menghubungkan Frontend dengan Mock Data maupun REST API tanpa mengubah arsitektur aplikasi.

---

# END OF PART 1
# ==============================================================================

# ==============================================================================
# IMPLEMENTATION-PLAN.md
# PART 2 — PROJECT ARCHITECTURE
# ==============================================================================

# 2.1 Purpose

Project Architecture mendefinisikan struktur implementasi Engineering Document Management System (EDMS) berdasarkan arsitektur yang telah ditetapkan pada ENGINEERING-FOUNDATION.md.

Bagian ini menjadi acuan utama dalam membangun Frontend dan Backend agar seluruh modul menggunakan pola implementasi yang konsisten.

---

# 2.2 Architecture Overview

EDMS menggunakan arsitektur Frontend dan Backend yang dipisahkan (Separated Architecture).

```text
Frontend (React)
        │
        ▼
Service Layer
        │
        ▼
REST API
        │
        ▼
Backend (Express.js)
        │
        ▼
MySQL
```

Seluruh komunikasi data wajib melalui Service Layer.

React Component tidak diperbolehkan mengakses REST API secara langsung.

---

# 2.3 Frontend Architecture

Frontend dibangun menggunakan pendekatan Feature First Architecture.

Setiap module memiliki struktur implementasi yang berdiri sendiri sehingga mudah dikembangkan dan dipelihara.

Setiap module minimal terdiri dari:

- Pages
- Components
- Services
- Hooks
- Store
- Mock Data
- Types (jika diperlukan)

Seluruh implementasi Frontend harus mengikuti ENGINEERING-FOUNDATION.md.

---

# 2.4 Backend Architecture

Backend dibangun menggunakan Express.js dengan pendekatan REST API.

Setiap module Backend bertanggung jawab terhadap:

- Business Logic
- Authentication
- Authorization
- Data Validation
- Database Access
- API Response

Seluruh Business Rule tetap mengacu pada PRD dan BUSINESS-WORKFLOW.md.

---

# 2.5 Development Architecture

Selama proses development, Frontend menggunakan Mock JSON sebagai sumber data.

```text
React UI
      │
      ▼
Service Layer
      │
      ▼
Mock JSON
```

Pada tahap integrasi, Mock JSON digantikan oleh REST API tanpa mengubah struktur Component.

```text
React UI
      │
      ▼
Service Layer
      │
      ▼
REST API
      │
      ▼
Express.js
```

---

# 2.6 Shared Architecture Rules

Seluruh module wajib mengikuti aturan berikut.

- Menggunakan Feature First Architecture.
- Menggunakan reusable component.
- Menggunakan Service Layer.
- Tidak melakukan duplicate business logic.
- Tidak melakukan duplicate UI Component.
- Tidak melakukan direct API Call dari Component.
- Seluruh module harus responsive.
- Seluruh module harus mengikuti Approved UI Design Mockup.

---

# 2.7 Module Dependency

Urutan dependency implementasi secara umum adalah sebagai berikut.

```text
Authentication
        │
        ▼
Application Layout
        │
        ▼
Shared Components
        │
        ▼
Dashboard
        │
        ▼
Document Register
        │
        ▼
SLA Monitoring
        │
        ▼
Audit Trail
        │
        ▼
Notification
        │
        ▼
Administration
        │
        ▼
Transmittal
```

Setiap module hanya boleh dibangun apabila dependency sebelumnya telah selesai.

---

# 2.8 Architecture Principles

Seluruh implementasi wajib mengikuti prinsip berikut.

- Separation of Concerns
- Feature First Architecture
- Service Layer Pattern
- Reusable Component
- Mock First Development
- API Ready Architecture
- Responsive Design
- Single Source of Truth

---

# END OF PART 2
# ==============================================================================

# ==============================================================================
# IMPLEMENTATION-PLAN.md
# PART 3 — IMPLEMENTATION LIFECYCLE
# ==============================================================================

# 3.1 Purpose

Implementation Lifecycle mendefinisikan tahapan resmi pembangunan Engineering Document Management System (EDMS).

Setiap Implementation Phase harus diselesaikan, diuji, diperbaiki apabila diperlukan, dan mendapatkan persetujuan sebelum melanjutkan ke Phase berikutnya.

Pendekatan ini bertujuan untuk memastikan kualitas implementasi tetap terjaga selama proses pengembangan dan mengurangi risiko perbaikan besar pada tahap akhir proyek.

---

# 3.2 Implementation Lifecycle

Seluruh implementasi EDMS mengikuti siklus berikut.

```text
Implementation Phase
        │
        ▼
Development
        │
        ▼
Self Testing
        │
        ▼
Bug Fix
        │
        ▼
Project Owner Review
        │
        ▼
Phase Gate
        │
        ▼
Approved
        │
        ▼
Next Phase
```

Apabila suatu Phase belum dinyatakan lulus pada Phase Gate, maka implementasi berikutnya tidak diperbolehkan dimulai.

---

# 3.3 Implementation Phases

| Phase | Scope | Deliverable |
|--------|-------|-------------|
| Phase 1 | Authentication, Global Layout, Shared Components | Foundation Module |
| Phase 2 | Dashboard, Document Register | Core Document Module |
| Phase 3 | SLA Monitoring, Audit Trail, Notification | Monitoring Module |
| Phase 4 | User Management, Department Management, Project Management, Project Membership, Authorization Catalog Reference, User Profile | Administration Module |
| Phase 5 | Transmittal (Placeholder), Backend Integration | Integrated System |
| Phase 6 | System Testing, Bug Fixing, Production Preparation | Production Ready System |

---

# 3.4 Phase Activities

Setiap Implementation Phase wajib mengikuti aktivitas berikut.

## Development

Mengimplementasikan seluruh module sesuai IMPLEMENTATION-PLAN.md, PRD.md, ENGINEERING-FOUNDATION.md, dan Approved UI Design Mockup.

---

## Self Testing

AI Coding Agent wajib melakukan pengujian terhadap seluruh fitur yang dibangun pada Phase tersebut.

Pengujian minimal meliputi:

- Functional Testing
- UI Rendering
- Responsive Layout
- Navigation
- Form Validation
- Mock Data Integration
- Error Handling
- Loading State
- Empty State

---

## Bug Fix

Seluruh temuan pada proses Self Testing wajib diselesaikan sebelum masuk ke tahap berikutnya.

---

## Project Owner Review

Project Owner melakukan pemeriksaan terhadap implementasi berdasarkan:

- Kesesuaian dengan PRD
- Kesesuaian dengan Approved UI Design Mockup
- Konsistensi UI
- Konsistensi Business Behaviour
- Kualitas implementasi

---

## Phase Gate

Phase Gate merupakan proses persetujuan resmi sebelum melanjutkan ke Phase berikutnya.

Apabila Phase Gate dinyatakan gagal, implementasi harus kembali ke tahap Bug Fix sampai memenuhi seluruh kriteria.

---

# 3.5 Phase Gate Rules

Setiap Phase hanya dapat dinyatakan selesai apabila memenuhi seluruh kondisi berikut.

- Seluruh fitur pada Phase telah selesai diimplementasikan.
- Tidak terdapat error yang menghalangi penggunaan fitur.
- Seluruh halaman dapat dirender dengan baik.
- Responsive Layout berjalan sesuai UI Guideline.
- Mock Data berjalan dengan baik.
- Tidak terdapat broken navigation.
- Tidak terdapat console error.
- Project Owner telah memberikan persetujuan.

---

# 3.6 Implementation Principles

Seluruh proses implementasi wajib mengikuti prinsip berikut.

- Build One Phase at a Time.
- Test Before Continue.
- Fix Before Review.
- Review Before Approval.
- Complete Before Next Phase.
- Follow Dependency.
- Follow Approved UI Mockup.
- Follow PRD.
- Follow ENGINEERING-FOUNDATION.

---

# 3.7 Expected Outcome

Pada akhir setiap Implementation Phase diharapkan:

- Seluruh fitur pada Phase telah stabil.
- Seluruh bug kritikal telah diselesaikan.
- Kualitas implementasi telah diverifikasi.
- Project Owner telah menyetujui hasil implementasi.
- Sistem siap melanjutkan ke Phase berikutnya.

---

# END OF PART 3
# ==============================================================================

# ==============================================================================
# IMPLEMENTATION-PLAN.md
# PART 4 — MODULE IMPLEMENTATION BLUEPRINT
# ==============================================================================

# 4.1 Purpose

Module Implementation Blueprint mendefinisikan spesifikasi implementasi setiap module pada Engineering Document Management System (EDMS).

Bagian ini menjadi acuan utama bagi Frontend Developer, Backend Developer, dan AI Coding Agent dalam membangun seluruh module aplikasi secara konsisten berdasarkan PRD.md, ENGINEERING-FOUNDATION.md, dan Approved UI Design Mockup.

Seluruh Business Rules, Functional Behaviour, dan UI Behaviour tetap mengacu pada PRD.md.

---

# 4.2 Standard Module Template

Seluruh module EDMS wajib mengikuti struktur implementasi berikut.

| Section | Description |
|----------|-------------|
| Purpose | Tujuan module |
| Pages | Halaman yang harus dibuat |
| Components | React Components |
| Services | Service Layer |
| Store | Zustand Store |
| Mock Data | Mock JSON |
| Future API | REST API Endpoint |
| Dependencies | Dependency Module |
| Acceptance Criteria | Kriteria selesai implementasi |
| Testing Checklist | Pengujian sebelum Phase Gate |

Seluruh module menggunakan template yang sama.

---

# 4.3 Module Implementation Blueprint

## Phase 1 — Foundation

### Authentication

**Purpose**

Membangun sistem autentikasi aplikasi meliputi Login, Logout, Session Validation, dan Protected Route.

**Pages**

- LoginPage.jsx

**Components**

- LoginForm
- UsernameInput
- PasswordInput
- LoginButton
- FormErrorMessage

**Services**

- auth.service.js

**Store**

- auth.store.js

**Mock Data**

- auth.json

**Future API**

- POST /auth/login
- POST /auth/logout
- GET /auth/me

**Dependencies**

- None

**Acceptance Criteria**

- Login berhasil.
- Logout berhasil.
- Session dipulihkan setelah browser di-refresh.
- Protected Route berjalan.
- Unauthorized User diarahkan ke Login.

**Testing Checklist**

- ☐ Login Success
- ☐ Login Failed
- ☐ Logout
- ☐ Session Restore
- ☐ Protected Route
- ☐ Unauthorized Redirect
- ☐ Console Error Free

---

### Global Application Layout

**Purpose**

Membangun layout utama aplikasi sesuai Approved UI Design Mockup.

**Pages**

- MainLayout.jsx

**Components**

- Sidebar
- TopNavbar
- UserMenu
- Breadcrumb
- MainContent

**Dependencies**

- Authentication

**Acceptance Criteria**

- Layout sesuai mockup.
- Sidebar Navigation berjalan.
- Responsive.
- User Menu tampil.
- Active Navigation berjalan.

**Testing Checklist**

- ☐ Sidebar
- ☐ Top Navigation
- ☐ Active Menu
- ☐ Responsive
- ☐ Console Error Free

---

### Shared Components

**Purpose**

Membangun reusable component yang digunakan oleh seluruh module.

**Components**

- Button
- Input
- Select
- Textarea
- DatePicker
- SearchBox
- Badge
- Card
- Table
- Pagination
- Modal
- Drawer
- Toast
- LoadingSpinner
- Skeleton
- EmptyState

**Acceptance Criteria**

- Reusable.
- Responsive.
- Mengikuti UI Guideline.

**Testing Checklist**

- ☐ Reusable
- ☐ Responsive
- ☐ Variant
- ☐ Disabled State
- ☐ Loading State

---

## Phase 2 — Core Module

### Dashboard

**Purpose**

Menampilkan ringkasan kondisi proyek dan informasi operasional EDMS.

**Pages**

- DashboardPage.jsx

**Components**

- DashboardToolbar
- SummaryCards
- SLAOverviewCard
- EscalationAlertCard
- DocumentRegisterTable

**Services**

- dashboard.service.js

**Store**

- dashboard.store.js

**Mock Data**

- dashboard-summary.json
- dashboard-register.json

**Future API**

- GET /dashboard
- GET /dashboard/documents

**Dependencies**

- Authentication
- Global Application Layout
- Shared Components

**Acceptance Criteria**

- Seluruh widget tampil sesuai mockup.
- Document Register tampil.
- SLA Overview tampil.
- Escalation Alert tampil.
- Responsive.

**Testing Checklist**

- ☐ Summary Cards
- ☐ SLA Overview
- ☐ Escalation Alert
- ☐ Document Register
- ☐ Search
- ☐ Loading State
- ☐ Empty State
- ☐ Responsive
- ☐ Console Error Free

---

### Remaining Modules

Blueprint berikut menggunakan struktur yang sama.

#### Phase 2

- Document Register

#### Phase 3

- SLA Monitoring
- Audit Trail
- Notification

#### Phase 4

- User Management
- Department Management
- Project Management
- Project Membership
- Authorization Catalog Reference (Historical Reference)
- User Profile

#### Phase 5

- Transmittal (Placeholder)
- Backend Integration

---

# 4.4 Blueprint Rules

Seluruh module wajib mengikuti aturan berikut.

- Menggunakan Feature First Architecture.
- Menggunakan Service Layer.
- Menggunakan Mock First Development.
- Menggunakan Zustand untuk Client State.
- Menggunakan TanStack Query untuk Server State.
- Menggunakan reusable component.
- Tidak melakukan direct API call dari React Component.
- Seluruh implementasi mengikuti PRD.md.
- Seluruh implementasi mengikuti ENGINEERING-FOUNDATION.md.
- Seluruh implementasi mengikuti Approved UI Design Mockup.

---

# 4.5 Blueprint Completion Rules

Suatu module dinyatakan selesai apabila memenuhi seluruh kondisi berikut.

- Acceptance Criteria terpenuhi.
- Testing Checklist selesai.
- Tidak terdapat console error.
- Responsive Layout berjalan dengan baik.
- Mock Data berjalan sesuai skenario.
- Siap mengikuti Phase Gate pada PART 3.

---

# END OF PART 4
# ==============================================================================

# ==============================================================================
# IMPLEMENTATION-PLAN.md
# PART 5 — GLOBAL COMPONENT STRATEGY
# ==============================================================================

# 5.1 Purpose

Global Component Strategy mendefinisikan standar penggunaan reusable component pada Engineering Document Management System (EDMS).

Seluruh User Interface harus dibangun menggunakan reusable component agar implementasi tetap konsisten, mudah dipelihara, dan mengurangi duplikasi kode.

Blueprint detail setiap module mengacu pada PART 4.

---

# 5.2 Component Philosophy

Seluruh komponen UI harus memenuhi prinsip berikut.

- Reusable
- Configurable
- Consistent
- Responsive
- Independent
- Easy to Maintain

Komponen hanya bertanggung jawab terhadap tampilan dan interaksi pengguna.

Business Logic tidak diperbolehkan berada di dalam reusable component.

---

# 5.3 Component Categories

Seluruh reusable component dikelompokkan menjadi beberapa kategori.

## Form Components

- Button
- Input
- Textarea
- Select
- Date Picker
- Checkbox
- Radio Button
- Search Box

---

## Display Components

- Card
- Badge
- Avatar
- Tooltip
- Divider

---

## Data Components

- Table
- Pagination
- Empty State
- Loading Skeleton
- Loading Spinner

---

## Feedback Components

- Alert
- Toast Notification
- Confirmation Dialog

---

## Navigation Components

- Sidebar
- Top Navigation
- Breadcrumb
- User Menu

---

## Overlay Components

- Modal
- Drawer
- Dropdown

---

# 5.4 Component Usage Rules

Seluruh module wajib menggunakan reusable component.

Tidak diperbolehkan membuat komponen baru apabila komponen dengan fungsi yang sama telah tersedia.

Apabila diperlukan variasi tampilan, gunakan Variant atau Props tanpa membuat duplicate component.

---

# 5.5 Component Ownership

Reusable Component merupakan Shared Resource yang dapat digunakan oleh seluruh module berikut.

- Authentication
- Dashboard
- Document Register
- SLA Monitoring
- Audit Trail
- Notification
- User Management
- Department Management
- Project Management
- Project Membership
- Authorization Catalog Reference (Historical Reference)
- User Profile
- Transmittal

---

# 5.6 Component Development Rules

Seluruh reusable component harus memenuhi ketentuan berikut.

- Dibuat satu kali.
- Digunakan oleh banyak module.
- Tidak bergantung pada Business Logic tertentu.
- Tidak melakukan pemanggilan REST API.
- Mendukung Responsive Layout.
- Mengikuti UI-GUIDELINES.md.
- Mengikuti ENGINEERING-FOUNDATION.md.

---

# 5.7 Acceptance Criteria

Global Component Strategy dinyatakan selesai apabila:

- Seluruh reusable component telah tersedia.
- Tidak terdapat duplicate component.
- Seluruh module menggunakan reusable component.
- Seluruh component mengikuti UI-GUIDELINES.md.
- Seluruh component siap digunakan pada seluruh module EDMS.

# ==============================================================================
# END OF PART 5
# ==============================================================================

# ==============================================================================
# IMPLEMENTATION-PLAN.md
# PART 6 — DATA SOURCE MAPPING
# ==============================================================================

# 6.1 Purpose

Data Source Mapping mendefinisikan hubungan antara Mock Data, Service Layer, dan REST API untuk setiap module pada Engineering Document Management System (EDMS).

Bagian ini memastikan seluruh Frontend dibangun menggunakan pendekatan Mock First Development tanpa mengubah struktur implementasi ketika Backend telah selesai.

---

# 6.2 Data Source Architecture

Seluruh aliran data pada EDMS mengikuti arsitektur berikut.

Runtime data flow resmi:

```text
Mock JSON
↓
Service Layer
↓
TanStack Query
↓
Store (jika diperlukan)
↓
Page
↓
Component
```

Historical Reference: diagram lama di bawah yang menempatkan React Components langsung setelah Service Layer bukan runtime data flow aktif.

```text
Mock JSON
      │
      ▼
Service Layer
      │
      ▼
React Components

Production

REST API
      │
      ▼
Service Layer
      │
      ▼
React Components
```

UI Component tidak diperbolehkan mengakses Mock JSON maupun REST API secara langsung.

---

# 6.3 Data Source Mapping

| Module | Mock Data | Service | Future API |
|----------|-----------|----------|------------|
| Authentication | auth.json | auth.service.js | /auth |
| Dashboard | dashboard-summary.json | dashboard.service.js | /dashboard |
| Dashboard | dashboard-register.json | dashboard.service.js | /dashboard/documents |
| Document Register | documents.json | document.service.js | /documents |
| SLA Monitoring | sla.json | sla.service.js | /sla |
| Audit Trail | audit-trail.json | audit.service.js | /audit-trail |
| Notification | notifications.json | notification.service.js | /notifications |
| User Management | users.json | user.service.js | /users |
| Authorization Catalog Reference | roles.json / permissions.json (Authorization Catalog / Historical Reference) | authorization-catalog.service.js | /roles and /permissions (Reference Catalog / Historical Reference) |
| User Profile | profile.json | profile.service.js | /profile |
| Transmittal | transmittal.json | transmittal.service.js | /transmittal |

Authorization Catalog pada tabel di atas adalah Historical Reference / Reference Catalog. Current runtime administration scope adalah User Management, Department Management, Project Management, dan Project Membership.

---

# 6.4 Development Strategy

Selama proses Frontend Development:

- Data berasal dari Mock JSON.
- Service Layer menjadi satu-satunya akses data.
- Server State dikelola melalui TanStack Query.
- Page/Component menggunakan TanStack Query hook atau Store apabila diperlukan dan tidak mengakses Mock JSON langsung.

Selama proses Backend Integration:

- Mock JSON diganti dengan REST API.
- Struktur Service Layer tetap dipertahankan.
- Page/Component tidak mengalami perubahan.

---

# 6.5 Mapping Rules

Seluruh module wajib mengikuti aturan berikut.

- Satu module memiliki satu Service Layer utama.
- Mock Data mengikuti struktur Response API yang direncanakan.
- Nama field Mock Data harus konsisten dengan Response API.
- Perubahan Data Source tidak boleh memerlukan perubahan pada Page/Component.
- Seluruh komunikasi data dilakukan melalui Service Layer.

---

# 6.6 Acceptance Criteria

Data Source Mapping dinyatakan selesai apabila:

- Seluruh module memiliki Mock Data.
- Seluruh module memiliki Service Layer.
- Seluruh Mock Data mengikuti struktur Response API.
- Frontend dapat berjalan menggunakan Mock Data.
- Pergantian dari Mock JSON ke REST API tidak memerlukan perubahan pada Page/Component.

# ==============================================================================
# END OF PART 6
# ==============================================================================

# ==============================================================================
# IMPLEMENTATION-PLAN.md
# PART 7 — BACKEND INTEGRATION STRATEGY
# ==============================================================================

# 7.1 Purpose

Backend Integration Strategy mendefinisikan proses transisi dari Mock Data ke REST API tanpa mengubah struktur implementasi Frontend.

Seluruh proses integrasi harus mengikuti ENGINEERING-FOUNDATION.md dan mempertahankan arsitektur Service Layer yang telah ditetapkan.

---

# 7.2 Integration Objective

Proses integrasi bertujuan untuk:

- Mengganti Mock Data dengan REST API.
- Mempertahankan seluruh React Component.
- Mempertahankan seluruh State Management.
- Mempertahankan struktur Service Layer.
- Mengurangi perubahan kode saat Backend selesai.

---

# 7.3 Integration Flow

Seluruh proses integrasi mengikuti alur berikut.

Runtime integration flow resmi wajib melewati TanStack Query sebelum Service Layer dipanggil oleh UI layer. Diagram lama di bawah dipertahankan sebagai Historical Reference apabila masih menunjukkan Component langsung ke Service Layer.

```text
Frontend (Mock)

React Component
        │
        ▼
Service Layer
        │
        ▼
Mock JSON

                │
                │ Replace Data Source
                ▼

Frontend (Production)

React Component
        │
        ▼
Service Layer
        │
        ▼
REST API
        │
        ▼
Express.js
        │
        ▼
MySQL
```

Target utama proses integrasi adalah memastikan React Component tidak memerlukan perubahan ketika Backend telah tersedia.

---

# 7.4 Integration Sequence

Integrasi Backend dilakukan setelah seluruh Frontend selesai menggunakan Mock Data.

Urutan integrasi adalah sebagai berikut.

| Order | Module |
|--------|--------|
| 1 | Authentication |
| 2 | Dashboard |
| 3 | Document Register |
| 4 | SLA Monitoring |
| 5 | Audit Trail |
| 6 | Notification |
| 7 | User Management |
| 8 | Authorization Catalog Reference (Historical Reference) |
| 9 | User Profile |
| 10 | Transmittal (Placeholder) |

Setiap module hanya dapat diintegrasikan apabila REST API untuk module tersebut telah tersedia.

---

# 7.5 Integration Rules

Seluruh proses integrasi wajib mengikuti aturan berikut.

- Tidak mengubah React Component.
- Tidak mengubah struktur Zustand Store.
- Tidak mengubah struktur TanStack Query.
- Tidak mengubah struktur Routing.
- Tidak mengubah struktur Layout.
- Perubahan hanya dilakukan pada Service Layer.
- Struktur Response API harus sesuai dengan Mock Data.
- Struktur Request API harus mengikuti API-CONTRACT.md.

---

# 7.6 Integration Testing

Setelah setiap module selesai diintegrasikan, wajib dilakukan pengujian berikut.

- API Response Validation
- Error Handling
- Authentication Validation
- Authorization Validation
- Loading State
- Empty State
- Network Error
- Session Validation
- Console Error Verification

Setiap pengujian harus berhasil sebelum module dinyatakan siap digunakan.

---

# 7.7 Acceptance Criteria

Backend Integration Strategy dinyatakan berhasil apabila:

- Seluruh Mock Data telah digantikan oleh REST API.
- Seluruh React Component tetap digunakan tanpa perubahan.
- Seluruh Service Layer terhubung ke REST API.
- Seluruh module berfungsi dengan baik menggunakan Backend.
- Tidak terdapat perubahan pada User Interface.
- Seluruh pengujian integrasi berhasil diselesaikan.

# ==============================================================================
# END OF PART 7
# ==============================================================================

# ==============================================================================
# IMPLEMENTATION-PLAN.md
# PART 8 — ENGINEERING STANDARDS
# ==============================================================================

# 8.1 Purpose

Engineering Standards mendefinisikan standar implementasi yang wajib diterapkan pada seluruh Frontend dan Backend Engineering Document Management System (EDMS).

Standar ini bertujuan untuk menjaga kualitas source code, konsistensi implementasi, kemudahan pemeliharaan, dan kesiapan sistem untuk dikembangkan pada masa mendatang.

---

# 8.2 General Standards

Seluruh implementasi wajib mengikuti standar berikut.

- Mengikuti PRD.md.
- Mengikuti ENGINEERING-FOUNDATION.md.
- Mengikuti Approved UI Design Mockup.
- Mengikuti UI-GUIDELINES.md.
- Mengikuti COMPONENT-SPEC.md.
- Mengikuti API-CONTRACT.md.
- Mengikuti ACCESS-CONTROL.md.

Apabila terjadi konflik, prioritas mengikuti Project Documentation Hierarchy.

---

# 8.3 Frontend Standards

Seluruh implementasi Frontend wajib memenuhi ketentuan berikut.

- Menggunakan React Functional Component.
- Menggunakan Arrow Function.
- Menggunakan Feature First Architecture.
- Menggunakan Service Layer.
- Menggunakan TanStack Query untuk Server State.
- Menggunakan Zustand untuk Client State.
- Menggunakan React Hook Form untuk seluruh Form.
- Menggunakan Zod untuk Form Validation.
- Menggunakan reusable component.
- Tidak melakukan direct API Call dari React Component.

---

# 8.4 Backend Standards

Seluruh implementasi Backend wajib memenuhi ketentuan berikut.

- Menggunakan Express.js.
- Menggunakan REST API.
- Menggunakan JWT Authentication.
- Menggunakan HttpOnly Cookie.
- Menggunakan bcrypt Password Hashing.
- Menggunakan struktur Response yang konsisten.
- Menggunakan validasi pada seluruh Request.
- Memisahkan Business Logic dari Route Handler.

---

# 8.5 Code Quality Standards

Seluruh source code harus memenuhi standar berikut.

- Mudah dibaca.
- Mudah dipelihara.
- Tidak terdapat duplicate code.
- Tidak terdapat hardcoded Business Rule.
- Memiliki struktur folder yang konsisten.
- Menggunakan nama file dan nama fungsi yang konsisten.
- Menghindari implementasi yang tidak digunakan.

---

# 8.6 User Interface Standards

Seluruh User Interface harus memenuhi ketentuan berikut.

- Konsisten dengan Approved UI Design Mockup.
- Responsive pada Desktop, Tablet, dan Mobile.
- Menggunakan reusable component.
- Memiliki Loading State.
- Memiliki Empty State.
- Memiliki Error State.
- Memiliki Feedback yang jelas kepada pengguna.

---

# 8.7 Testing Standards

Setiap module wajib melewati pengujian berikut sebelum mengikuti Phase Gate.

- Functional Testing.
- Responsive Testing.
- Navigation Testing.
- Form Validation Testing.
- Authentication Testing.
- Authorization Testing.
- Error Handling Testing.
- Console Error Verification.

Tidak diperbolehkan melanjutkan ke Phase berikutnya sebelum seluruh pengujian berhasil.

---

# 8.8 Completion Standards

Implementasi suatu module dinyatakan memenuhi Engineering Standards apabila:

- Seluruh Acceptance Criteria terpenuhi.
- Seluruh Testing Checklist selesai.
- Tidak terdapat Critical Bug.
- Tidak terdapat Console Error.
- Project Owner telah memberikan persetujuan.
- Module dinyatakan lulus Phase Gate.

# ==============================================================================
# END OF PART 8
# ==============================================================================

# ==============================================================================
# IMPLEMENTATION-PLAN.md
# PART 9 — MODULE COMPLETION CRITERIA
# ==============================================================================

# 9.1 Purpose

Module Completion Criteria mendefinisikan persyaratan minimum yang harus dipenuhi sebelum suatu module dinyatakan selesai dan siap melanjutkan ke Implementation Phase berikutnya.

Seluruh module wajib memenuhi seluruh kriteria pada bagian ini tanpa pengecualian.

---

# 9.2 Functional Completion

Suatu module dinyatakan selesai secara fungsional apabila:

- Seluruh fitur pada module telah selesai diimplementasikan.
- Seluruh Acceptance Criteria pada Module Blueprint telah terpenuhi.
- Tidak terdapat fitur yang belum selesai.
- Seluruh navigasi berfungsi dengan baik.

---

# 9.3 User Interface Completion

Seluruh tampilan User Interface harus memenuhi ketentuan berikut.

- Sesuai Approved UI Design Mockup.
- Responsive pada Desktop, Tablet, dan Mobile.
- Menggunakan reusable component.
- Konsisten dengan UI-GUIDELINES.md.
- Tidak terdapat layout yang rusak.

---

# 9.4 Engineering Completion

Seluruh implementasi harus memenuhi standar engineering berikut.

- Menggunakan Feature First Architecture.
- Menggunakan Service Layer.
- Menggunakan State Management yang sesuai.
- Menggunakan struktur folder yang telah ditetapkan.
- Tidak terdapat duplicate code.
- Tidak terdapat hardcoded Business Rule.

---

# 9.5 Testing Completion

Seluruh pengujian wajib berhasil.

Minimal meliputi:

- Functional Testing
- Responsive Testing
- Navigation Testing
- Authentication Testing
- Authorization Testing
- Form Validation Testing
- Error Handling Testing
- Loading State Testing
- Empty State Testing

Seluruh hasil pengujian harus dinyatakan berhasil.

---

# 9.6 Code Quality Completion

Source code harus memenuhi standar berikut.

- Tidak terdapat Console Error.
- Tidak terdapat Runtime Error.
- Tidak terdapat Build Error.
- Tidak terdapat Warning yang mempengaruhi aplikasi.
- Struktur source code konsisten.
- Seluruh file berhasil dikompilasi.

---

# 9.7 Documentation Completion

Sebelum module dinyatakan selesai, seluruh dokumentasi implementasi harus telah diperbarui apabila terdapat perubahan yang disetujui selama proses pengembangan.

Perubahan implementasi tidak diperbolehkan bertentangan dengan PRD.md maupun ENGINEERING-FOUNDATION.md.

---

# 9.8 Project Owner Approval

Module hanya dapat dinyatakan selesai setelah memperoleh persetujuan dari Project Owner berdasarkan hasil review implementasi.

Review meliputi:

- Functional Behaviour
- User Interface
- Business Behaviour
- Engineering Quality

---

# 9.9 Phase Gate

Setelah seluruh kriteria pada PART 9 terpenuhi, module mengikuti Phase Gate sebagaimana dijelaskan pada PART 3.

Module yang belum lulus Phase Gate tidak diperbolehkan melanjutkan ke Implementation Phase berikutnya.

---

# 9.10 Completion Status

Module dinyatakan selesai apabila memenuhi seluruh kondisi berikut.

- Functional Complete
- UI Complete
- Engineering Complete
- Testing Complete
- Code Quality Complete
- Project Owner Approved
- Phase Gate Passed

Apabila salah satu kondisi belum terpenuhi, maka status module tetap dinyatakan **In Progress**.

# ==============================================================================
# END OF PART 9
# ==============================================================================

# ==============================================================================
# IMPLEMENTATION-PLAN.md
# PART 10 — PROJECT IMPLEMENTATION TRACKER
# ==============================================================================

# 10.1 Purpose

Project Implementation Tracker digunakan untuk memantau progres implementasi Engineering Document Management System (EDMS) selama proses pengembangan.

Bagian ini menjadi acuan resmi untuk mengetahui status setiap Implementation Phase, status setiap module, serta kesiapan proyek menuju Production Release.

---

# 10.2 Project Progress Flow

Seluruh proyek mengikuti alur berikut.

```text
Planning
      │
      ▼
Implementation
      │
      ▼
Self Testing
      │
      ▼
Bug Fix
      │
      ▼
Project Owner Review
      │
      ▼
Phase Gate
      │
      ▼
Completed
```

Status setiap Phase harus diperbarui setelah seluruh aktivitas pada Phase tersebut selesai.

---

# 10.3 Implementation Phase Tracker

| Phase | Scope | Status |
|--------|-------|--------|
| Phase 1 | Foundation Module | ☐ |
| Phase 2 | Core Module | ☐ |
| Phase 3 | Monitoring Module | ☐ |
| Phase 4 | Administration Module | ☐ |
| Phase 5 | Backend Integration | ☐ |
| Phase 6 | Production Preparation | ☐ |

Status hanya dapat diubah setelah Phase Gate dinyatakan lulus.

---

# 10.4 Module Progress Tracker

| Module | Status |
|---------|--------|
| Authentication | ☐ |
| Global Application Layout | ☐ |
| Shared Components | ☐ |
| Dashboard | ☐ |
| Document Register | ☐ |
| SLA Monitoring | ☐ |
| Audit Trail | ☐ |
| Notification | ☐ |
| User Management | ☐ |
| Authorization Catalog Reference (Historical Reference) | ☐ |
| User Profile | ☐ |
| Transmittal (Placeholder) | ☐ |

Status setiap module mengikuti PART 9 — Module Completion Criteria.

---

# 10.5 Integration Progress Tracker

| Integration | Status |
|-------------|--------|
| Authentication API | ☐ |
| Dashboard API | ☐ |
| Document Register API | ☐ |
| SLA API | ☐ |
| Audit Trail API | ☐ |
| Notification API | ☐ |
| User Management API | ☐ |
| Authorization Catalog API (Reference / Historical) | ☐ |
| User Profile API | ☐ |
| Transmittal API | ☐ |

Seluruh integrasi dilakukan setelah Frontend selesai menggunakan Mock Data.

---

# 10.6 Quality Gate Tracker

Setiap Phase harus memenuhi seluruh Quality Gate berikut.

| Quality Gate | Status |
|--------------|--------|
| Development Completed | ☐ |
| Self Testing Passed | ☐ |
| Bug Fixed | ☐ |
| Project Owner Reviewed | ☐ |
| Phase Gate Passed | ☐ |

Seluruh status wajib selesai sebelum melanjutkan ke Phase berikutnya.

---

# 10.7 Production Readiness Checklist

Sebelum sistem dinyatakan Production Ready, seluruh checklist berikut harus terpenuhi.

| Checklist | Status |
|-----------|--------|
| Frontend Completed | ☐ |
| Backend Completed | ☐ |
| API Integration Completed | ☐ |
| Authentication Verified | ☐ |
| Authorization Verified | ☐ |
| Responsive Layout Verified | ☐ |
| Console Error Free | ☐ |
| Critical Bug Free | ☐ |
| Project Owner Approved | ☐ |

---

# 10.8 Final Project Status

Project hanya dapat dinyatakan selesai apabila seluruh kondisi berikut terpenuhi.

- Seluruh Implementation Phase selesai.
- Seluruh Module selesai.
- Seluruh REST API telah terintegrasi.
- Seluruh Quality Gate telah dilalui.
- Production Readiness Checklist telah terpenuhi.
- Project Owner memberikan persetujuan akhir.

Status akhir proyek:

```
☐ In Progress

☐ Ready for Production

☐ Production Released
```

# ==============================================================================
# CR-012 — PROJECT CLOSE IMPLEMENTATION ADDENDUM
# ==============================================================================

## Scope

Project Close diterapkan pada Frontend menggunakan arsitektur existing:

- React Page pada Project Management.
- Service Layer Project sebagai pemilik operasi Project.
- Local Persistence Service sebagai sumber Business Data.
- Zustand Project Context Store untuk Active Project Context.
- TanStack Query invalidation untuk refresh data operasional.

Tidak ada Backend API, database schema, permission baru, role baru, atau workflow approval baru pada fase ini.

## Implementation Rules

- Status Project resmi: Active, Inactive, Closed.
- State transition yang diperbolehkan: Active -> Inactive, Inactive -> Active, Active -> Closed.
- Closed tidak dapat berubah kembali ke Active atau Inactive.
- Close Project hanya melalui Wizard Project Management.
- Wizard memiliki tiga step: validation, summary impact, confirmation.
- Approved Document pada Project yang di-Closed diubah ke lifecycle Archived secara otomatis.
- Archived Document tetap Archived.
- Restore Document hanya diperbolehkan pada Project Active.
- Membership Project Closed tetap tersimpan dan menjadi read only.
- Project Closed tidak menghasilkan Notification baru.
- Audit Trail mencatat Project Close dengan old status, new status, user, project, waktu, dan jumlah document yang di-archive otomatis.
- Jika Project yang di-Closed adalah Active Project, Project Context dibersihkan dan sistem tidak memilih Project lain otomatis.

## Verification Checklist

- Wizard validation menolak Project Inactive, Project Closed, workflow aktif, Project Code salah, dan checkbox kosong.
- Wizard berhasil untuk Project Active tanpa Document, seluruh Approved, seluruh Archived, atau kombinasi Approved + Archived.
- Approved Document berubah menjadi Archived.
- Archived Document tetap Archived.
- Project Closed hilang dari Project Selector.
- Dashboard operasional hanya mengikuti Active Project.
- Notification Project lain tetap berjalan.
- Audit Trail mencatat Project Close.

# ==============================================================================
# END OF PART 10
# ==============================================================================

---

# PHASE 2 SOURCE OF TRUTH SYNCHRONIZATION

## Current Implementation

Frontend implementation telah melampaui beberapa baseline awal dan sekarang menjadi executable reference untuk:

- Multi Project.
- Active Project Context.
- Document workflow Approval A/B/C.
- Upload Revision.
- Archive/Restore.
- SLA Monitoring.
- Escalation Alert.
- Notification.
- Audit Trail.
- User, Department, Project, dan Membership Management.
- Forgot Password dan Reset Password simulation.

## Implementation Priority After Synchronization

Prioritas berikutnya bukan redesign, melainkan menjaga parity antara Source of Truth, frontend runtime, backend production contract, database schema, storage strategy, dan QA scenario.

Backend implementation wajib meniru behaviour Service Layer yang telah tersinkron pada PHASE 2 sebelum mengganti Fake API dan IndexedDB.

---

# DOMAIN 5 BACKEND IMPLEMENTATION BLUEPRINT

## Backend Architecture Baseline

Backend production menggunakan stack:

- Node.js.
- Express.js.
- MySQL.

Layer resmi backend:

```text
Routes
  -> Controllers
  -> Services
  -> Repositories
  -> MySQL
```

Aturan layer:

- Routes hanya mendefinisikan URL, HTTP method, middleware, dan controller target.
- Controllers hanya melakukan request parsing, memanggil service, dan membentuk response.
- Services menjadi satu-satunya tempat Business Logic, workflow orchestration, authorization contextual check, transaction orchestration, audit, notification trigger, dan storage coordination.
- Repositories hanya menangani akses database.
- Validators hanya menangani validasi request payload, query, parameter, dan file metadata.
- Middlewares menangani authentication, authorization, project context, error handling, request id, dan upload pre-processing.
- Jobs menangani proses terjadwal untuk SLA, escalation, dan notification dispatch.
- Storage menangani temporary upload, virus scan handoff, checksum, permanent storage, download, preview, dan rollback file.

## Backend Folder Blueprint

```text
backend/
  routes/
    auth.routes.js
    dashboard.routes.js
    documents.routes.js
    workflow.routes.js
    notifications.routes.js
    sla.routes.js
    escalations.routes.js
    audit-trails.routes.js
    users.routes.js
    departments.routes.js
    projects.routes.js
    project-memberships.routes.js
    profiles.routes.js
    storage.routes.js
  controllers/
  services/
  repositories/
  validators/
  middlewares/
  jobs/
  storage/
  config/
  utils/
  database/
```

Domain module dipisahkan berdasarkan resource bisnis, bukan berdasarkan halaman UI.

## Backend Module Map

| Domain | Routes | Controllers | Services | Repositories | Validators | Middleware | Jobs | Storage |
|---|---|---|---|---|---|---|---|---|
| Authentication | auth.routes.js | AuthController | AuthService, SessionService | UserRepository, CredentialRepository, RefreshSessionRepository, PasswordResetRepository | auth.validator.js | authenticate, rateLimit | tokenCleanupJob | - |
| Dashboard | dashboard.routes.js | DashboardController | DashboardService | DocumentRepository, NotificationRepository, AuditTrailRepository | dashboard.validator.js | authenticate, authorize, projectContext | - | - |
| Document | documents.routes.js | DocumentController | DocumentService | DocumentRepository, RevisionRepository, StoredFileRepository, HistoryRepository | document.validator.js | authenticate, authorize, projectContext, uploadMiddleware | - | StorageService |
| Workflow | workflow.routes.js | WorkflowController | WorkflowService | DocumentRepository, WorkflowCommentRepository, WorkflowAttachmentRepository, StoredFileRepository, HistoryRepository | workflow.validator.js | authenticate, authorize, projectContext, uploadMiddleware | - | StorageService |
| Revision | documents.routes.js | DocumentController | RevisionService | RevisionRepository, StoredFileRepository, DocumentRepository, HistoryRepository | revision.validator.js | authenticate, authorize, projectContext, uploadMiddleware | - | StorageService |
| Archive/Restore | documents.routes.js | DocumentController | ArchiveService | DocumentRepository, HistoryRepository, AuditTrailRepository | lifecycle.validator.js | authenticate, authorize, projectContext | - | - |
| Notification | notifications.routes.js | NotificationController | NotificationService | NotificationRepository | notification.validator.js | authenticate, authorize, projectContext | notificationDispatchJob | - |
| SLA | sla.routes.js | SlaController | SlaService | DocumentRepository, SlaEvaluationRepository, NotificationRepository | sla.validator.js | authenticate, authorize, projectContext | slaEvaluationJob | - |
| Escalation | escalations.routes.js | EscalationController | EscalationService | DocumentRepository, AuditTrailRepository, NotificationRepository | escalation.validator.js | authenticate, authorize, projectContext | escalationEvaluationJob | - |
| Audit Trail | audit-trails.routes.js | AuditTrailController | AuditTrailService | AuditTrailRepository | audit.validator.js | authenticate, authorize, projectContext | - | - |
| User | users.routes.js | UserController | UserService | UserRepository, CredentialRepository, DepartmentRepository | user.validator.js | authenticate, authorize | - | - |
| Department | departments.routes.js | DepartmentController | DepartmentService | DepartmentRepository | department.validator.js | authenticate, authorize | - | - |
| Project | projects.routes.js | ProjectController | ProjectService, ProjectCloseService | ProjectRepository, ProjectMembershipRepository, DocumentRepository, HistoryRepository, AuditTrailRepository | project.validator.js | authenticate, authorize | - | - |
| Project Membership | project-memberships.routes.js | ProjectMembershipController | ProjectMembershipService | ProjectMembershipRepository, UserRepository, ProjectRepository | project-membership.validator.js | authenticate, authorize | - | - |
| Profile | profiles.routes.js | ProfileController | ProfileService, AuthService | UserRepository, CredentialRepository, RefreshSessionRepository | profile.validator.js | authenticate | - | - |
| Storage | storage.routes.js | StorageController | StorageService | StoredFileRepository | storage.validator.js | authenticate, authorize, projectContext | storageCleanupJob | StorageProvider |

## Backend Transaction Boundary

| Transaction | Boundary | Commit Condition | Rollback Condition |
|---|---|---|---|
| Create Document | Validate project, upload temporary file, validate metadata, create stored file metadata, create document, create active revision, create history, create audit, create notification marker if required | All database writes and storage finalize succeed | Validation, DB write, storage finalize, audit, or notification creation fails |
| Edit Document | Validate document ownership, validate editable fields, update document, create history, create audit | Update/history/audit succeed | Any validation or write fails |
| Upload Revision | Validate workflow status, upload temporary file, virus scan, checksum, create stored file metadata, supersede previous revision, create new active revision, update document status/revision/active file, create history, audit, notification | File finalized and all DB writes succeed | File validation, storage, revision update, audit, or notification fails |
| Approval | Validate permission, active project membership, official role, workflow status, comment/attachment rule, optional attachment storage, update workflow status, create comment/attachment/history/audit/notification | Workflow state and side effects persist together | Invalid rule, attachment failure, DB failure, audit failure, notification failure |
| Archive | Validate Admin, Approved status, Active lifecycle, Active project, update lifecycle, create history, audit | Lifecycle/history/audit succeed | Validation or write fails |
| Restore | Validate Admin, Archived lifecycle, Active project, update lifecycle, create history, audit | Lifecycle/history/audit succeed | Validation or write fails |
| Project Close | Validate Admin, Active project, no active workflow document, close project, auto-archive eligible Approved Active documents, clear operational context marker where applicable, create history and audit | Project and affected documents are updated atomically | Any project/document/history/audit write fails |
| Change Password | Validate current credential or reset token, hash new password, update credential, revoke active refresh sessions, create audit | Password and session invalidation succeed | Credential, token, revocation, or audit write fails |
| Notification | Resolve recipient by project membership and official role, create idempotent notification records, mark dispatch state | Idempotent insert/update succeeds | Recipient resolution or write fails |
| Audit Trail | Create immutable audit record or soft-hide existing audit record | Audit write succeeds | Audit write fails |

## Background Job Blueprint

| Job | Trigger | Frequency | Responsibility | Idempotency | Retry Policy |
|---|---|---|---|---|---|
| SLA Evaluation Job | Scheduler/Cron | Periodic, production interval configurable | Evaluate SLA Status for active documents, update `document_sla_evaluations`, create At Risk/Overdue notification markers | `document_id + cycle_id + notified_state` | Retry failed evaluation with bounded retry and error audit |
| Escalation Evaluation Job | Scheduler/Cron after SLA job | Periodic, production interval configurable | Evaluate Overdue documents, derive escalation level, create idempotent escalation audit/notification where required | Notification `identity_key` and audit `identity_key` | Retry failed project/document batch without duplicating identity keys |
| Notification Dispatch Job | Worker queue or scheduler | Continuous or periodic | Dispatch pending notification records to configured channel while preserving personal notification list | Notification id and dispatch status | Retry transient failure; mark permanent failure without deleting notification |
| Token Cleanup Job | Scheduler/Cron | Daily or configurable | Expire/revoke old refresh sessions and password reset tokens | Token/session id | Retry safe; no duplicate business effect |
| Storage Cleanup Job | Scheduler/Cron | Configurable | Remove orphan temporary upload files that were not finalized | Temporary upload id | Retry safe; never deletes permanent storage |

Dashboard hanya membaca hasil evaluasi dan tidak menjalankan SLA/Escalation evaluation sebagai request-driven business process.

## Backend Readiness Rule

Blueprint ini tidak mengubah:

- Business Rule.
- UI Behaviour.
- Frontend Architecture.
- Data Contract.
- Workflow Status.
- Document Lifecycle.
- Permission Catalog.

Blueprint hanya menurunkan keputusan implementasi backend dari Domain 1 sampai Domain 4.

