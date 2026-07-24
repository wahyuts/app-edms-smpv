# ==============================================================================
# ACCESS-CONTROL.md
# PART 1 — DOCUMENT OVERVIEW
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Document Level** | Technical Design Document |
| **Document Status** | Draft |
| **Owner** | Solution Architecture |
| **Purpose** | Mendefinisikan standar Authentication, Authorization, Role-Based Access Control (RBAC), Permission, Protected Resources, serta mekanisme pengendalian akses pada Engineering Document Management System (EDMS). |
| **Depends On** | PRD.md, ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, UI-GUIDELINES.md, COMPONENT-SPEC.md, FILE-STRUCTURE.md, ROUTING.md, STATE-MANAGEMENT.md, API-CONTRACT.md |
| **Design Reference** | Approved UI Design Mockup |
| **Behaviour Reference** | BUSINESS-WORKFLOW.md |
| **Primary Audience** | Solution Architect, Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |
| **Change Impact** | Very High |
| **Last Review** | Architecture Review |

---

# 1.1 Purpose

ACCESS-CONTROL.md merupakan dokumen resmi yang mendefinisikan mekanisme pengendalian akses pada Engineering Document Management System (EDMS).

Dokumen ini menjelaskan bagaimana sistem mengontrol hak akses pengguna terhadap Product Module, Route, User Interface, Action, dan REST API berdasarkan mekanisme **Role-Based Access Control (RBAC)** yang telah ditetapkan.

ACCESS-CONTROL.md menjadi acuan implementasi Authorization pada Frontend maupun Backend sehingga seluruh proses pengendalian akses dilakukan secara konsisten dan dapat dipertanggungjawabkan.

Dokumen ini tidak mendefinisikan kebutuhan bisnis baru, Business Workflow baru, maupun perubahan terhadap Functional Requirement yang telah ditetapkan pada dokumen Source of Truth.

Seluruh perilaku bisnis tetap mengacu pada BUSINESS-WORKFLOW.md sebagai **Behaviour Reference Only**.

---

# 1.2 Objectives

Dokumen ini bertujuan untuk:

- Menetapkan standar Role-Based Access Control (RBAC) pada EDMS.
- Mendefinisikan hubungan antara Role, Permission, Protected Resource, dan Action.
- Menentukan standar Authorization pada Frontend dan Backend.
- Menjadi acuan implementasi Navigation Guard dan Protected Route.
- Menentukan aturan visibilitas Menu, Page, Component, dan Action berdasarkan Permission.
- Menjadi acuan implementasi Authorization pada REST API.
- Menjamin konsistensi mekanisme pengendalian akses di seluruh Product Module.
- Menjadi referensi bagi QA Engineer dalam menyusun skenario pengujian Authorization.
- Menjadi referensi AI Coding Agent dalam mengimplementasikan Access Control secara konsisten.

---

# 1.3 Scope

ACCESS-CONTROL.md mencakup:

- Access Control Philosophy
- Authentication & Authorization Relationship
- Role Definition
- Permission Definition
- Protected Resource
- Route Authorization
- Navigation Authorization
- UI Authorization
- Component Authorization
- Action Authorization
- API Authorization
- Permission Mapping
- Authorization Rules
- Access Validation
- Security Principles
- Acceptance Criteria

Dokumen ini tidak membahas:

- Business Workflow
- Business Rules
- Functional Requirements
- UI Design Detail
- REST API Specification
- Database Schema
- State Management Architecture
- Backend Business Logic

Topik tersebut dijelaskan pada dokumen Source of Truth yang sesuai.

---

# 1.4 Document Position

ACCESS-CONTROL.md merupakan bagian dari **Technical Design Documents**.

Dokumen ini menerjemahkan kebutuhan produk, arsitektur sistem, struktur routing, serta kontrak API menjadi standar implementasi Authorization yang digunakan secara konsisten pada seluruh lapisan aplikasi.

Hubungan antar dokumen adalah sebagai berikut.

```text
PRD.md
        │
        ▼
ENGINEERING-FOUNDATION.md
        │
        ▼
IMPLEMENTATION-PLAN.md
        │
        ▼
ROUTING.md
        │
FILE-STRUCTURE.md
        │
STATE-MANAGEMENT.md
        │
API-CONTRACT.md
        │
        ▼
ACCESS-CONTROL.md
        │
        ├── Frontend Authorization
        ├── Protected Route
        ├── Navigation Guard
        ├── Component Guard
        ├── Action Guard
        └── Backend Authorization
```

ACCESS-CONTROL.md tidak menggantikan PRD, ROUTING.md, maupun API-CONTRACT.md.

Dokumen ini berfungsi sebagai standar implementasi Authorization yang menghubungkan seluruh lapisan sistem agar memiliki mekanisme pengendalian akses yang konsisten.

---

# 1.5 Source Documents

Seluruh isi ACCESS-CONTROL.md wajib mengacu pada dokumen berikut.

## Primary Source

- PRD.md
- ENGINEERING-FOUNDATION.md
- IMPLEMENTATION-PLAN.md
- UI-GUIDELINES.md
- COMPONENT-SPEC.md
- FILE-STRUCTURE.md
- ROUTING.md
- STATE-MANAGEMENT.md
- API-CONTRACT.md
- Approved UI Design Mockup

## Behaviour Reference

- BUSINESS-WORKFLOW.md

Apabila terjadi perbedaan informasi, prioritas mengikuti **Project Documentation Hierarchy** yang telah ditetapkan.

BUSINESS-WORKFLOW.md hanya digunakan sebagai **Behaviour Reference** untuk menentukan perilaku sistem setelah pengguna memiliki hak akses yang sesuai.

---

# 1.6 Access Control Principles

Seluruh implementasi Access Control wajib mengikuti prinsip berikut.

- Single Source of Truth.
- Authentication Before Authorization.
- Role-Based Access Control (RBAC).
- Least Privilege Principle.
- Permission-Based Authorization.
- Deny by Default.
- Protected Route Ready.
- UI and API Consistency.
- Backend Enforcement.
- Separation of Authentication and Authorization.

---

# 1.7 Expected Outcome

Setelah ACCESS-CONTROL.md selesai disusun, Frontend Developer, Backend Developer, QA Engineer, dan AI Coding Agent harus mampu:

- Memahami hubungan antara Authentication, Role, Permission, dan Authorization.
- Mengimplementasikan Protected Route sesuai ROUTING.md.
- Mengimplementasikan Navigation Guard dan Component Guard secara konsisten.
- Mengendalikan visibilitas Menu, Page, Component, dan Action berdasarkan Permission.
- Melindungi REST API menggunakan mekanisme Authorization yang konsisten.
- Menjamin bahwa Frontend dan Backend menggunakan aturan Permission yang sama.
- Mengembangkan Product Module baru tanpa mengubah arsitektur Access Control yang telah ditetapkan.

# END OF PART 1
# ==============================================================================

# ==============================================================================
# ACCESS-CONTROL.md
# PART 2 — RBAC PHILOSOPHY
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan filosofi Role-Based Access Control (RBAC) yang menjadi dasar seluruh mekanisme Authorization pada Engineering Document Management System (EDMS). |
| **Depends On** | PRD.md, ENGINEERING-FOUNDATION.md, API-CONTRACT.md |
| **Primary Audience** | Frontend Developer, Backend Developer, Solution Architect, AI Coding Agent |

---

# 2.1 Overview

Engineering Document Management System (EDMS) menggunakan **Role-Based Access Control (RBAC)** sebagai mekanisme utama dalam mengendalikan akses terhadap seluruh Resource sistem.

RBAC memastikan setiap pengguna hanya dapat mengakses fitur, halaman, komponen, aksi, dan REST API sesuai dengan Role dan Permission yang dimilikinya.

Pendekatan ini menghasilkan sistem yang lebih aman, konsisten, mudah dipelihara, dan mudah dikembangkan.

---

# 2.2 Philosophy

Seluruh mekanisme Authorization dibangun berdasarkan prinsip bahwa **Permission merupakan pusat pengendalian akses**, sedangkan Role berfungsi sebagai kumpulan Permission.

User tidak diberikan hak akses secara langsung.

Hubungan akses mengikuti hirarki berikut.

```text
User

↓

Role

↓

Permission

↓

Protected Resource
```

Dengan pendekatan ini, perubahan hak akses dapat dilakukan melalui Role tanpa mengubah implementasi aplikasi.

---

# 2.3 Core Principles

Seluruh implementasi RBAC wajib mengikuti prinsip berikut.

### ACP-001 — Authentication Before Authorization

Authorization hanya dilakukan setelah proses Authentication berhasil.

---

### ACP-002 — Role Owns Permission

Role bertanggung jawab memiliki kumpulan Permission.

---

### ACP-003 — Permission Controls Resource

Permission menentukan apakah Resource dapat diakses.

---

### ACP-004 — Backend Is Final Authority

Frontend hanya digunakan untuk meningkatkan User Experience.

Backend tetap menjadi otoritas utama dalam melakukan Authorization.

---

### ACP-005 — Least Privilege Principle

Setiap Role hanya memperoleh Permission yang benar-benar dibutuhkan.

---

### ACP-006 — Deny by Default

Apabila Permission tidak ditemukan, akses harus ditolak.

---

### ACP-007 — Consistent Authorization

Authorization pada Route, UI, Component, Action, dan API harus menggunakan Permission yang sama.

---

# 2.4 Authorization Flow

Seluruh proses Authorization mengikuti alur berikut.

```text
User Login

↓

Authentication

↓

Current User

↓

Current Role

↓

Permission Collection

↓

Authorization Check

↓

Access Granted / Access Denied
```

---

# 2.5 Access Hierarchy

Hubungan antar objek Authorization.

```text
User
   │
   ▼
Role
   │
   ▼
Permission
   │
   ├── Route
   ├── Page
   ├── Menu
   ├── Component
   ├── Action
   └── REST API
```

Permission menjadi pusat pengendalian seluruh Resource.

---

# 2.6 Authorization Scope

Permission dapat digunakan untuk mengendalikan.

- Product Module
- Navigation Menu
- Route
- Page
- React Component
- Button
- Dialog
- Upload
- Download
- Approval Action
- REST API
- Administration Feature

---

# 2.7 Design Goals

RBAC pada EDMS harus memenuhi tujuan berikut.

- Consistent
- Secure
- Scalable
- Easy Maintenance
- Easy Testing
- Easy Auditing
- Easy Extension
- API Ready
- Frontend Independent
- Backend Independent

---

# 2.8 Anti Patterns

Implementasi berikut tidak diperbolehkan.

- Hardcode Role pada Component.
- Hardcode Permission pada UI.
- Authorization berdasarkan Username.
- Authorization berdasarkan Page Name.
- Authorization hanya dilakukan di Frontend.
- Memberikan seluruh Permission kepada seluruh Role.
- Melewati proses Authorization pada REST API.

---

# 2.9 Expected Outcome

Setelah filosofi RBAC diterapkan.

- Seluruh Permission memiliki fungsi yang jelas.
- Seluruh Resource memiliki mekanisme Authorization.
- Frontend dan Backend menggunakan standar Authorization yang sama.
- Penambahan Role baru tidak memerlukan perubahan arsitektur.
- Mekanisme Authorization tetap konsisten pada seluruh Product Module.

# END OF PART 2
# ==============================================================================

# ==============================================================================
# ACCESS-CONTROL.md
# PART 3 — ROLE DEFINITION
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan struktur Role yang digunakan pada Engineering Document Management System (EDMS) sebagai dasar pemberian Permission dan Authorization. |
| **Depends On** | PRD.md, BUSINESS-WORKFLOW.md (Behaviour Reference), API-CONTRACT.md |
| **Primary Audience** | Solution Architect, Backend Developer, Frontend Developer, QA Engineer |

---

# 3.1 Overview

Role merupakan representasi tanggung jawab pengguna di dalam Engineering Document Management System (EDMS).

Setiap Role memiliki sekumpulan Permission yang menentukan Resource apa saja yang dapat diakses dan Action apa saja yang dapat dilakukan.

Role tidak melakukan Authorization secara langsung.

Authorization selalu dilakukan berdasarkan Permission yang dimiliki oleh Role tersebut.

---

# 3.2 Role Architecture

Hubungan antar objek.

```text
User

↓

Role

↓

Permission

↓

Protected Resource
```

Satu User memiliki satu atau lebih Role.

Satu Role memiliki banyak Permission.

Satu Permission dapat digunakan oleh lebih dari satu Role.

---

# 3.3 Role Responsibility

Role bertanggung jawab terhadap.

- Hak akses Menu.
- Hak akses Route.
- Hak akses Product Module.
- Hak akses Component.
- Hak akses Action.
- Hak akses REST API.

Role tidak bertanggung jawab terhadap Business Workflow.

Business Workflow tetap mengikuti BUSINESS-WORKFLOW.md.

---

# 3.4 Standard Roles

Role pada EDMS mengikuti definisi yang telah ditetapkan pada PRD.md.

Contoh implementasi Role meliputi.

| Role | Description |
|-------|-------------|
| Administrator | Mengelola konfigurasi sistem, pengguna, role, dan permission. |
| Engineer | Mengelola dokumen engineering sesuai tanggung jawabnya. |
| Lead Engineer | Melakukan proses review dan validasi sesuai workflow. |
| Project Engineer / Project Reviewer | Melakukan review pada tahapan Project Review sesuai Business Workflow. |
| Management / Viewer | Memiliki hak akses baca terhadap informasi yang diizinkan. |

Role final mengikuti definisi resmi pada PRD.md.

---

# 3.5 Role Characteristics

Seluruh Role memiliki karakteristik berikut.

- Memiliki Identifier unik.
- Memiliki Nama Role.
- Memiliki Deskripsi.
- Memiliki sekumpulan Permission.
- Tidak menyimpan Business Logic.
- Tidak bergantung pada UI.

---

# 3.6 Role Assignment

Proses Assignment.

```text
User

↓

Assigned Role

↓

Permission Collection

↓

Authorization
```

Perubahan Role akan memengaruhi seluruh Permission yang dimiliki User.

---

# 3.7 Multiple Role Strategy

Apabila seorang User memiliki lebih dari satu Role.

Permission yang berlaku merupakan gabungan seluruh Permission yang dimiliki.

```text
Role A

+

Role B

↓

Merged Permission
```

Conflict Resolution mengikuti aturan pada bagian **Access Rules**.

---

# 3.8 Role Rules

Seluruh Role wajib memenuhi aturan berikut.

### ROLE-001

Role tidak boleh berisi Business Logic.

---

### ROLE-002

Role hanya berisi kumpulan Permission.

---

### ROLE-003

Role tidak boleh digunakan langsung pada Component.

---

### ROLE-004

Authorization dilakukan berdasarkan Permission.

---

### ROLE-005

Role mengikuti definisi resmi pada PRD.md.

---

### ROLE-006

Role harus mudah diperluas tanpa mengubah arsitektur Authorization.

---

# 3.9 Relationship With Other Documents

Role digunakan oleh dokumen berikut.

| Document | Relationship |
|----------|--------------|
| PRD.md | Mendefinisikan kebutuhan Role. |
| ROUTING.md | Menentukan Route yang dilindungi. |
| COMPONENT-SPEC.md | Menentukan Component yang membutuhkan Permission. |
| STATE-MANAGEMENT.md | Menyimpan informasi Current User dan Authentication State. |
| API-CONTRACT.md | Menghubungkan Permission dengan Protected Endpoint. |
| ACCESS-CONTROL.md | Mendefinisikan Role dan Permission. |

---

# 3.10 Expected Outcome

Role Definition dinyatakan memenuhi standar apabila.

- Seluruh Role memiliki tanggung jawab yang jelas.
- Seluruh Role menggunakan Permission sebagai dasar Authorization.
- Role mudah diperluas tanpa mengubah struktur sistem.
- Seluruh Product Module menggunakan mekanisme Role yang konsisten.
- Implementasi selaras dengan PRD.md dan BUSINESS-WORKFLOW.md sebagai Behaviour Reference.

# END OF PART 3
# ==============================================================================

# ==============================================================================
# ACCESS-CONTROL.md
# PART 4 — PERMISSION MATRIX
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan struktur Permission yang digunakan untuk mengendalikan akses terhadap seluruh Product Module, Route, UI Component, Action, dan REST API pada Engineering Document Management System (EDMS). |
| **Depends On** | PRD.md, COMPONENT-SPEC.md, ROUTING.md, API-CONTRACT.md |
| **Primary Audience** | Backend Developer, Frontend Developer, QA Engineer, AI Coding Agent |

---

# 4.1 Overview

Permission merupakan unit terkecil dalam mekanisme Authorization.

Seluruh keputusan akses terhadap Resource dilakukan berdasarkan Permission, bukan berdasarkan Role secara langsung.

Role hanya berfungsi sebagai kumpulan Permission.

---

# 4.2 Permission Philosophy

Permission harus bersifat.

- Granular
- Reusable
- Predictable
- Independent
- Easy to Extend

Permission tidak boleh bergantung pada.

- Username
- UI
- Component
- Business Workflow

Permission hanya mewakili hak akses terhadap Resource.

---

# 4.3 Permission Structure

Format penamaan Permission.

```text
{resource}.{action}
```

Contoh.

```text
dashboard.view

document-register.view

document-register.create

document-register.edit

approval.a

document-register.download

notifications.view

sla-monitoring.view

audit-trail.view

user-management.view

profile.view

password.change
```

---

# 4.4 Permission Categories

Permission dikelompokkan berdasarkan Product Module.

| Product Module | Permission Prefix / Permission | Status |
|----------------|-------------------------------|--------|
| Dashboard | dashboard.view | Current |
| Document Register | document-register.* | Current |
| Approval Action | approval.* | Current |
| Notification | notifications.view | Current |
| SLA Monitoring | sla-monitoring.view | Current |
| Escalation Alert | escalation.view | Current |
| Audit Trail | audit-trail.view | Current |
| Storage NAS | storage.view | Current |
| User Management | user-management.view | Current |
| Project Management | user-management.view | Current |
| Project Membership | user-management.view | Current |
| Department Management | user-management.view | Current |
| Profile | profile.view | Current |
| Change Password | password.change | Current |
| Document Register Legacy | document.* | Deprecated / Historical Reference |
| SLA Monitoring Legacy | sla.* | Deprecated / Historical Reference |
| Audit Trail Legacy | audit.* | Deprecated / Historical Reference |
| User Management Legacy | user.* | Deprecated / Historical Reference |
| Role Management Runtime | role.* | Superseded / Historical Reference |
| Permission Management Runtime | permission.* | Superseded / Historical Reference |

---

# 4.5 Permission Matrix

| Permission | Description |
|------------|-------------|
| dashboard.view | Melihat Dashboard |
| document-register.view | Melihat Document Register |
| document-register.create | Upload Document |
| document-register.edit | Mengubah metadata Document |
| document-register.archive | Archive dan Restore Document |
| document-register.upload | Reserved / tidak menjadi runtime gate Upload Revision saat ini |
| document-register.download | Download Document |
| approval.a | Menjalankan Approval A |
| approval.b | Menjalankan Approval B |
| approval.c | Menjalankan Approval C |
| notifications.view | Melihat Notification |
| sla-monitoring.view | Melihat SLA Monitoring |
| escalation.view | Melihat Escalation Alert |
| audit-trail.view | Melihat Audit Trail |
| storage.view | Mengakses Storage NAS |
| user-management.view | Mengakses User Management |
| user-management.view | Mengakses User, Department, Project, dan Project Membership Management |
| profile.view | Melihat Profile |
| password.change | Mengubah password |

Daftar Permission final mengikuti kebutuhan Product Module pada PRD.md.

---

# 4.6 Permission Relationship

Hubungan Permission.

```text
Role

↓

Permission

↓

Route

↓

Page

↓

Component

↓

Action

↓

REST API
```

Permission menjadi pusat pengendalian seluruh Resource.

---

# 4.7 Permission Rules

Seluruh Permission wajib memenuhi aturan berikut.

### PERM-001

Menggunakan format `{resource}.{action}`.

---

### PERM-002

Permission bersifat reusable.

---

### PERM-003

Permission tidak bergantung pada UI.

---

### PERM-004

Permission tidak bergantung pada Route.

---

### PERM-005

Permission digunakan secara konsisten pada Frontend dan Backend.

---

### PERM-006

Satu Permission dapat digunakan oleh lebih dari satu Role.

---

# 4.8 Permission Naming Convention

Seluruh Permission menggunakan.

- Lowercase
- Dot Notation
- Resource First
- Action Last

Contoh.

```text
document-register.view

approval.a

user-management.view
```

---

# 4.9 Permission Mapping Strategy

Permission digunakan secara konsisten pada.

- Navigation
- Route
- Page
- Component
- Button
- Dialog
- REST API
- Backend Authorization

Satu Permission menjadi dasar seluruh mekanisme Authorization.

---

# 4.10 Expected Outcome

Permission Matrix dinyatakan memenuhi standar apabila.

- Seluruh Product Module memiliki Permission.
- Permission mudah dipahami.
- Permission dapat digunakan ulang.
- Permission konsisten pada Frontend dan Backend.
- Permission siap digunakan pada Route Guard, Component Guard, dan API Authorization.

# END OF PART 4
# ==============================================================================

# ==============================================================================
# ACCESS-CONTROL.md
# PART 5 — PROTECTED RESOURCES
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan seluruh Resource yang harus dilindungi oleh mekanisme Authorization pada Engineering Document Management System (EDMS). |
| **Depends On** | ROUTING.md, COMPONENT-SPEC.md, API-CONTRACT.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 5.1 Overview

Protected Resource merupakan seluruh Resource yang memerlukan Authentication dan Authorization sebelum dapat diakses oleh pengguna.

Resource dapat berupa halaman, Route, Component, Action, maupun REST API.

---

# 5.2 Protected Resource Categories

Resource dikelompokkan menjadi beberapa kategori.

- Product Module
- Route
- Navigation Menu
- Page
- React Component
- Action
- REST API

Setiap kategori menggunakan Permission yang sama sebagai dasar Authorization.

---

# 5.3 Product Module Protection

Seluruh Product Module merupakan Protected Resource.

| Product Module | Protection |
|----------------|------------|
| Dashboard | Required |
| Document Register | Required |
| Transmittal | Required |
| SLA Monitoring | Required |
| Escalation | Required |
| Audit Trail | Required |
| Storage NAS | Required |
| Notification | Required |
| Administration | Required |

Authentication diperlukan sebelum pengguna dapat mengakses module tersebut.

---

# 5.4 Route Protection

Seluruh Protected Route mengikuti ROUTING.md.

Contoh.

| Route | Protection |
|--------|------------|
| /dashboard | Required |
| /document-register/pfd | Required |
| /document-register/pid | Required |
| /sla-monitoring | Required |
| /audit-trail | Required |
| /user-management | Required |

Route Protection dilakukan sebelum halaman dirender.

---

# 5.5 UI Resource Protection

Resource UI yang dapat dilindungi.

- Sidebar Menu
- Navigation Item
- Dashboard Card
- Table Action
- Button
- Dialog
- Form
- Dropdown
- Modal

Component ditampilkan berdasarkan Permission.

---

# 5.6 Action Protection

Action berikut memerlukan Authorization.

- Upload Document
- Download Document
- Approval A
- Approval B
- Approval C
- View History
- Update Profile
- User Management
- Project Management
- Project Membership
- Department Management

Role Management bukan operational module utama pada current runtime scope dan hanya boleh diperlakukan sebagai reference/historical apabila masih disebut. Permission Management sebagai operational runtime module lama dinyatakan superseded.

Action yang tidak memiliki Permission harus disembunyikan atau dinonaktifkan.

---

# 5.7 API Resource Protection

Seluruh Protected Endpoint mengikuti API-CONTRACT.md.

Contoh.

| Endpoint | Protection |
|----------|------------|
| GET /api/v1/documents | Required |
| POST /api/v1/documents | Required |
| POST /api/v1/documents/{id}/approve | Required |
| GET /api/v1/users | Required |
| POST /api/v1/users | Required |

Backend melakukan validasi Authorization terhadap seluruh Protected Endpoint.

---

# 5.8 Resource Protection Rules

Seluruh Resource wajib memenuhi aturan berikut.

### RES-001

Resource dilindungi menggunakan Permission.

---

### RES-002

Authentication dilakukan sebelum Authorization.

---

### RES-003

Frontend tidak boleh menjadi satu-satunya mekanisme proteksi.

---

### RES-004

Backend wajib memvalidasi seluruh Protected Resource.

---

### RES-005

Resource tanpa Permission dianggap tidak dapat diakses.

---

# 5.9 Protection Flow

```text
User Request

↓

Authentication

↓

Role

↓

Permission

↓

Protected Resource

↓

Access Granted / Access Denied
```

Flow ini digunakan secara konsisten pada seluruh Product Module.

---

# 5.10 Expected Outcome

Protected Resources dinyatakan memenuhi standar apabila.

- Seluruh Resource memiliki mekanisme proteksi.
- Route menggunakan Permission.
- UI menggunakan Permission.
- Action menggunakan Permission.
- REST API menggunakan Permission.
- Frontend dan Backend menerapkan mekanisme Authorization yang sama.

# END OF PART 5
# ==============================================================================

# ==============================================================================
# ACCESS-CONTROL.md
# PART 6 — ROUTE AUTHORIZATION
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan mekanisme Authorization terhadap seluruh Route pada Engineering Document Management System (EDMS). |
| **Depends On** | ROUTING.md, STATE-MANAGEMENT.md, API-CONTRACT.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 6.1 Overview

Seluruh Route pada Engineering Document Management System (EDMS) dikendalikan menggunakan mekanisme Authorization berbasis Permission.

Route Authorization memastikan pengguna hanya dapat mengakses halaman yang sesuai dengan hak akses yang dimiliki.

Authorization dilakukan sebelum halaman dirender.

---

# 6.2 Authorization Flow

```text
User Request

↓

Authentication

↓

Current User

↓

Current Role

↓

Permission Collection

↓

Route Authorization

↓

Render Page

atau

Access Denied
```

---

# 6.3 Route Classification

Route dibagi menjadi dua kategori.

| Route Type | Authentication |
|------------|----------------|
| Public Route | Not Required |
| Protected Route | Required |

Sebagian besar Route pada EDMS merupakan **Protected Route**.

---

# 6.4 Protected Route Mapping

Seluruh Route mengikuti definisi pada ROUTING.md.

| Route | Permission |
|--------|------------|
| /dashboard | dashboard.view |
| /document-register/pfd | document-register.view |
| /document-register/pid | document-register.view |
| /transmittal/incoming | transmittal.incoming |
| /transmittal/outgoing | transmittal.outgoing |
| /sla-monitoring | sla-monitoring.view |
| /escalation-alert | escalation.view |
| /audit-trail | audit-trail.view |
| /storage-nas | storage.view |
| /notifications | notifications.view |
| /user-management | user-management.view |
| /project-management | user-management.view |
| /project-membership | user-management.view |
| /profile | profile.view |

Permission mengikuti Permission Matrix pada PART 4.

---

# 6.5 Route Guard

Seluruh Protected Route menggunakan Route Guard.

```text
Route Request

↓

Check Authentication

↓

Check Permission

↓

Authorized ?

↓

YES

↓

Render Route

↓

NO

↓

Access Denied
```

Frontend wajib melakukan pengecekan sebelum Route dirender.

---

# 6.6 Backend Enforcement

Walaupun Frontend melakukan Route Guard.

Backend tetap wajib melakukan Authorization.

Route Guard **bukan mekanisme keamanan utama**, melainkan peningkatan User Experience.

REST API tetap menjadi lapisan keamanan utama.

---

# 6.7 Route Authorization Rules

### ROUTE-001

Seluruh Protected Route wajib melakukan Authentication.

---

### ROUTE-002

Seluruh Protected Route wajib melakukan Authorization.

---

### ROUTE-003

Route Guard menggunakan Permission.

---

### ROUTE-004

Route Guard tidak menggunakan Role secara langsung.

---

### ROUTE-005

Permission mengikuti Permission Matrix.

---

### ROUTE-006

Frontend dan Backend menggunakan aturan Permission yang sama.

---

# 6.8 Unauthorized Behaviour

Apabila pengguna tidak memiliki Permission.

Frontend harus.

- Tidak merender halaman.
- Menghentikan proses navigasi.
- Menampilkan halaman Access Denied atau Unauthorized.
- Tidak menampilkan data Protected Resource.

Backend harus mengembalikan.

```text
HTTP 403 Forbidden
```

---

# 6.9 Relationship With Other Documents

Route Authorization terhubung dengan.

| Document | Relationship |
|----------|--------------|
| ROUTING.md | Mendefinisikan Route |
| API-CONTRACT.md | Melindungi Endpoint |
| STATE-MANAGEMENT.md | Menyediakan Authentication State |
| COMPONENT-SPEC.md | Menentukan Component yang dirender |

---

# 6.10 Expected Outcome

Route Authorization dinyatakan memenuhi standar apabila.

- Seluruh Protected Route menggunakan Permission.
- Route Guard bekerja secara konsisten.
- Backend melakukan Authorization terhadap seluruh Request.
- Frontend tidak merender halaman tanpa Permission.
- Seluruh implementasi mengikuti ROUTING.md dan API-CONTRACT.md.

# END OF PART 6
# ==============================================================================

# ==============================================================================
# ACCESS-CONTROL.md
# PART 7 — UI AUTHORIZATION
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan mekanisme Authorization terhadap seluruh User Interface (UI) pada Engineering Document Management System (EDMS). |
| **Depends On** | UI-GUIDELINES.md, COMPONENT-SPEC.md, ROUTING.md, API-CONTRACT.md |
| **Primary Audience** | Frontend Developer, UI Developer, QA Engineer, AI Coding Agent |

---

# 7.1 Overview

Selain Route, seluruh User Interface (UI) pada EDMS juga dikendalikan menggunakan Permission.

UI Authorization memastikan pengguna hanya melihat Menu, Component, Button, dan Informasi yang memang diizinkan.

Authorization dilakukan pada tingkat tampilan tanpa menggantikan validasi Backend.

---

# 7.2 UI Authorization Scope

Authorization dapat diterapkan pada.

- Sidebar Menu
- Navigation Item
- Dashboard Card
- Toolbar
- Button
- Dropdown Menu
- Form Control
- Modal
- Dialog
- Table Action
- Information Panel
- Widget

---

# 7.3 Sidebar Authorization

Sidebar mengikuti ROUTING.md.

Contoh.

| Sidebar Menu | Permission |
|--------------|------------|
| Dashboard | dashboard.view |
| Document Register | document-register.view |
| Transmittal | transmittal.incoming / transmittal.outgoing |
| SLA Monitoring | sla-monitoring.view |
| Escalation Alert | escalation.view |
| Audit Trail | audit-trail.view |
| Storage NAS | storage.view |
| Notifications | notifications.view |
| Administration | user-management.view |

Sidebar hanya ditampilkan apabila pengguna memiliki Permission yang sesuai.
Untuk menu project-scoped, visibility juga wajib memvalidasi Official Role dan Active Project Membership.

---

# 7.4 Component Authorization

Component mengikuti COMPONENT-SPEC.md.

Contoh.

| Component | Permission |
|-----------|------------|
| Dashboard Summary Card | dashboard.view |
| Document Register Table | document-register.view |
| Notification Panel | notifications.view |
| SLA Overview Card | sla-monitoring.view |
| Escalation Alert Card | escalation.view |

Component yang tidak memiliki Permission tidak dirender.
Project-scoped component tidak boleh menggunakan Current Assignee sebagai sumber authorization.

---

# 7.5 Table Action Authorization

Action pada Document Register mengikuti Permission.

| UI Component | Permission |
|--------------|------------|
| View Button | document-register.view |
| Download Button | document-register.download |
| Comment Button | document-register.view |
| Approval A Button | approval.a |
| Approval B Button | approval.b |
| Approval C Button | approval.c |
| History Button | document-register.view |

Business Behaviour tetap mengikuti BUSINESS-WORKFLOW.md.
Approval action visibility wajib menggunakan Official Role dan Active Project Membership, bukan Current Assignee.

---

# 7.6 Administration UI Authorization

Seluruh halaman Administration merupakan Protected UI.

| UI Module | Permission |
|-----------|------------|
| User Management | user-management.view |
| Project Management | user-management.view |
| Project Membership | user-management.view |
| Department Management | user-management.view |
| Reset All Demo Data | user-management.view / Admin |

Reset All Demo Data merupakan Developer / Demo Utility.

Ketentuan akses:

- Hanya Admin yang boleh melihat tombol.
- Hanya Admin dengan Permission administrasi yang sah yang boleh menjalankan reset.
- Project-Scoped Permission tidak boleh memberikan akses reset.
- Feature flag reset demo wajib aktif.
- Jika feature flag tidak aktif, UI dan Service Layer wajib menolak akses.

---

# 7.7 UI Authorization Rules

### UI-001

Component menggunakan Permission.

---

### UI-002

Component tidak menggunakan Role secara langsung.

---

### UI-003

Component tanpa Permission tidak dirender.

---

### UI-004

Permission mengikuti Permission Matrix.

---

### UI-005

UI Authorization tidak menggantikan Backend Authorization.

---

### UI-006

Seluruh Product Module menggunakan mekanisme Authorization yang sama.

---

# 7.8 Rendering Strategy

```text
Authentication

↓

Permission

↓

UI Authorization

↓

Render Component

atau

Hide Component
```

Render dilakukan setelah Permission berhasil divalidasi.

---

# 7.9 Relationship With Other Documents

UI Authorization terhubung dengan.

| Document | Relationship |
|----------|--------------|
| UI-GUIDELINES.md | Standar UI |
| COMPONENT-SPEC.md | Definisi Component |
| ROUTING.md | Route Navigation |
| API-CONTRACT.md | Backend Authorization |
| STATE-MANAGEMENT.md | Current User State |

---

# 7.10 Expected Outcome

UI Authorization dinyatakan memenuhi standar apabila.

- Sidebar mengikuti Permission.
- Component mengikuti Permission.
- Table Action mengikuti Permission.
- Administration UI mengikuti Permission.
- Frontend dan Backend menggunakan mekanisme Authorization yang konsisten.

# END OF PART 7
# ==============================================================================

# ==============================================================================
# ACCESS-CONTROL.md
# PART 8 — ACTION AUTHORIZATION
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan mekanisme Authorization terhadap seluruh Action yang dapat dilakukan pengguna pada Engineering Document Management System (EDMS). |
| **Depends On** | COMPONENT-SPEC.md, API-CONTRACT.md, BUSINESS-WORKFLOW.md (Behaviour Reference Only) |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 8.1 Overview

Action Authorization merupakan lapisan terakhir dari mekanisme Authorization setelah pengguna berhasil melewati Authentication, Route Authorization, dan UI Authorization.

Action Authorization menentukan apakah seorang pengguna diperbolehkan menjalankan suatu operasi terhadap Resource tertentu.

Seluruh Action harus divalidasi menggunakan Permission sebelum diproses.

---

# 8.2 Authorization Flow

```text
User

↓

Authentication

↓

Permission

↓

Action Authorization

↓

Execute Action

atau

Access Denied
```

Action hanya dapat dijalankan apabila Permission yang diperlukan dimiliki oleh pengguna.

---

# 8.3 Action Categories

Action pada EDMS dikelompokkan menjadi beberapa kategori.

- Read
- Create
- Update
- Delete
- Upload
- Download
- Review
- Approve
- Reject
- View History
- Manage
- Export

Seluruh kategori mengikuti Permission Matrix pada PART 4.

---

# 8.4 Document Register Actions

| Action | Permission |
|----------|------------|
| View Document | document-register.view |
| Upload Document | document-register.create |
| Update Document | document.update |
| Download Document | document-register.download |
| View Comment | document-register.view |
| View History | document.history |
| Archive Document | document-register.archive |
| Restore Document | document-register.archive |
| Approval A | approval.a |
| Approval B | approval.b |
| Approval C | approval.c |

Behaviour Approval mengikuti BUSINESS-WORKFLOW.md.
Archive dan Restore hanya tersedia untuk Admin pada Active Project.
Archive hanya dapat dijalankan pada Document dengan Workflow Status Approved.
Role selain Admin tidak melihat Archive, Restore, atau Lifecycle Filter.

---

# 8.5 Administration Actions

| Action | Permission |
|----------|------------|
| Create User | user-management.view |
| Update User | user-management.view |
| Activate/Deactivate User | user-management.view |
| Create Department | user-management.view |
| Update Department | user-management.view |
| Activate/Deactivate Department | user-management.view |
| Create Project | user-management.view |
| Update Project | user-management.view |
| Activate/Deactivate Project | user-management.view |
| Close Project | Admin |
| Create/Update Project Membership | user-management.view |
| Reset All Demo Data | user-management.view + Admin + Feature Flag |

---

# 8.6 Dashboard Actions

| Action | Permission |
|----------|------------|
| View Dashboard | dashboard.view |
| View Notification | notifications.view |
| View SLA Monitoring | sla-monitoring.view |
| View Escalation Alert | escalation.view |
| View Audit Trail | audit-trail.view |

---

# 8.7 Action Rules

### ACTION-001

Seluruh Action menggunakan Permission.

---

### ACTION-002

Action tidak menggunakan Role secara langsung.

---

### ACTION-003

Permission mengikuti Permission Matrix.

---

### ACTION-004

Frontend wajib melakukan pengecekan sebelum Action dijalankan.

---

### ACTION-005

Backend wajib melakukan validasi ulang sebelum Action diproses.

---

### ACTION-006

Action tanpa Permission harus ditolak.

---

# 8.8 Failed Authorization Behaviour

Apabila Authorization gagal.

Frontend harus.

- Menonaktifkan Action.
- Menyembunyikan Action apabila diperlukan.
- Tidak mengirim Request yang tidak sah.

Backend harus.

- Mengembalikan HTTP 403 Forbidden.
- Tidak memproses Business Logic.
- Mencatat kejadian apabila diperlukan untuk Audit.

---

# 8.9 Relationship With Other Documents

Action Authorization terhubung dengan.

| Document | Relationship |
|----------|--------------|
| COMPONENT-SPEC.md | Mendefinisikan Action Component |
| API-CONTRACT.md | Mendefinisikan Protected Endpoint |
| ROUTING.md | Menentukan Protected Route |
| STATE-MANAGEMENT.md | Menyediakan Current User & Permission |
| BUSINESS-WORKFLOW.md | Behaviour setelah Action berhasil dijalankan |

---

# 8.10 Expected Outcome

Action Authorization dinyatakan memenuhi standar apabila.

- Seluruh Action menggunakan Permission.
- Frontend dan Backend menerapkan validasi yang sama.
- Business Workflow hanya dijalankan setelah Authorization berhasil.
- Seluruh Action mengikuti Permission Matrix.
- Tidak ada Action yang dapat dijalankan tanpa Permission.

# END OF PART 8
# ==============================================================================

# ==============================================================================
# ACCESS-CONTROL.md
# PART 9 — ACCESS RULES
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan aturan umum (Governance Rules) yang mengatur implementasi Authentication dan Authorization pada Engineering Document Management System (EDMS). |
| **Depends On** | ENGINEERING-FOUNDATION.md, ROUTING.md, STATE-MANAGEMENT.md, API-CONTRACT.md |
| **Primary Audience** | Solution Architect, Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 9.1 Overview

Access Rules merupakan seperangkat aturan yang wajib dipatuhi oleh seluruh implementasi Authorization pada EDMS.

Aturan ini memastikan seluruh Product Module menggunakan mekanisme pengendalian akses yang konsisten.

---

# 9.2 Authentication Rules

### AUTH-001

Authentication wajib dilakukan sebelum Authorization.

---

### AUTH-002

Current User harus tersedia sebelum Permission diperiksa.

---

### AUTH-003

Authentication mengikuti ENGINEERING-FOUNDATION.md.

---

### AUTH-004

Authentication State mengikuti STATE-MANAGEMENT.md.

---

# 9.3 Authorization Rules

### ACCESS-001

Authorization menggunakan Permission.

---

### ACCESS-002

Role hanya sebagai kumpulan Permission.

---

### ACCESS-003

Permission menjadi dasar seluruh Authorization.

---

### ACCESS-004

Permission digunakan secara konsisten pada Route, UI, Action, dan REST API.

---

### ACCESS-005

Authorization dilakukan pada Frontend dan Backend.

---

### ACCESS-006

Backend merupakan otoritas utama Authorization.

---

### ACCESS-007

Permission yang tidak dikenal dianggap tidak memiliki hak akses.

---

### ACCESS-008

Seluruh Resource menggunakan prinsip **Deny by Default**.

---

# 9.4 Frontend Rules

Frontend wajib.

- Melakukan Route Guard.
- Melakukan UI Authorization.
- Melakukan Action Authorization.
- Menyembunyikan Resource yang tidak memiliki Permission.
- Tidak bergantung pada Role secara langsung.

Frontend tidak boleh dijadikan satu-satunya mekanisme keamanan.

---

# 9.5 Backend Rules

Backend wajib.

- Memvalidasi Authentication.
- Memvalidasi Permission.
- Melindungi seluruh Protected Endpoint.
- Mengembalikan HTTP Status sesuai API-CONTRACT.md.
- Tidak menjalankan Business Logic sebelum Authorization berhasil.

---

# 9.6 Security Rules

Seluruh implementasi wajib mengikuti prinsip berikut.

- Least Privilege.
- Deny by Default.
- Backend Enforcement.
- Consistent Permission.
- Single Source of Truth.
- Separation of Authentication and Authorization.

---

# 9.7 Permission Governance

Permission harus memenuhi aturan berikut.

- Tidak boleh duplikat.
- Tidak boleh ambigu.
- Menggunakan format `{resource}.{action}`.
- Dapat digunakan kembali.
- Tidak bergantung pada UI maupun Route.

---

# 9.8 Future Scalability

Arsitektur Access Control harus mampu mendukung.

- Penambahan Role baru.
- Penambahan Permission baru.
- Penambahan Product Module baru.
- Penambahan Route baru.
- Penambahan REST API baru.

Tanpa mengubah struktur dasar Authorization.

---

# 9.9 Relationship With Other Documents

| Document | Relationship |
|----------|--------------|
| ENGINEERING-FOUNDATION.md | Authentication Foundation |
| ROUTING.md | Route Protection |
| STATE-MANAGEMENT.md | Authentication State |
| API-CONTRACT.md | Protected Endpoint |
| COMPONENT-SPEC.md | Component Authorization |
| PRD.md | Functional Requirement |
| BUSINESS-WORKFLOW.md | Behaviour Reference Only |

---

# 9.10 Expected Outcome

Access Rules dinyatakan memenuhi standar apabila.

- Seluruh implementasi mengikuti Rule yang sama.
- Frontend dan Backend menggunakan Permission yang konsisten.
- Tidak ada Resource yang dapat diakses tanpa Authorization.
- Seluruh Product Module mengikuti prinsip RBAC.
- Arsitektur Access Control mudah dipelihara dan mudah dikembangkan.

# END OF PART 9
# ==============================================================================

# ==============================================================================
# ACCESS-CONTROL.md
# PART 10 — ACCESS ACCEPTANCE CRITERIA
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar akhir yang harus dipenuhi sebelum implementasi Access Control pada Engineering Document Management System (EDMS) dinyatakan siap digunakan sebagai standar resmi keamanan aplikasi. |
| **Depends On** | PRD.md, ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, ROUTING.md, STATE-MANAGEMENT.md, API-CONTRACT.md |
| **Primary Audience** | Product Owner, Solution Architect, Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 10.1 Purpose

Access Acceptance Criteria mendefinisikan seluruh persyaratan yang wajib dipenuhi sebelum ACCESS-CONTROL.md dinyatakan **Approved**.

Bagian ini menjadi acuan resmi pada proses Architecture Review, Security Review, Development Review, Integration Review, dan Code Review untuk memastikan seluruh mekanisme Authentication dan Authorization telah diterapkan secara konsisten.

---

# 10.2 Acceptance Scope

Acceptance Criteria mencakup seluruh aspek Access Control, meliputi.

- RBAC Philosophy
- Role Definition
- Permission Matrix
- Protected Resources
- Route Authorization
- UI Authorization
- Action Authorization
- Access Rules
- Security Principles

Seluruh aspek tersebut wajib memenuhi standar sebelum implementasi Frontend maupun Backend dimulai.

---

# 10.3 RBAC Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| RBAC-001 | Menggunakan Role-Based Access Control (RBAC). | ☐ |
| RBAC-002 | Authorization dilakukan berdasarkan Permission. | ☐ |
| RBAC-003 | Role hanya berfungsi sebagai kumpulan Permission. | ☐ |
| RBAC-004 | Menggunakan prinsip Least Privilege. | ☐ |
| RBAC-005 | Menggunakan prinsip Deny by Default. | ☐ |
| RBAC-006 | Mengikuti ENGINEERING-FOUNDATION.md. | ☐ |

---

# 10.4 Permission Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| PERM-001 | Seluruh Product Module memiliki Permission. | ☐ |
| PERM-002 | Permission menggunakan format `{resource}.{action}`. | ☐ |
| PERM-003 | Permission tidak duplikat. | ☐ |
| PERM-004 | Permission digunakan secara konsisten pada Frontend dan Backend. | ☐ |
| PERM-005 | Permission mengikuti Permission Matrix. | ☐ |

---

# 10.5 Resource Protection Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| RES-001 | Seluruh Protected Route menggunakan Permission. | ☐ |
| RES-002 | Seluruh Protected UI menggunakan Permission. | ☐ |
| RES-003 | Seluruh Protected Action menggunakan Permission. | ☐ |
| RES-004 | Seluruh Protected REST API menggunakan Permission. | ☐ |
| RES-005 | Resource tanpa Permission tidak dapat diakses. | ☐ |

---

# 10.6 Security Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| SEC-001 | Authentication dilakukan sebelum Authorization. | ☐ |
| SEC-002 | Backend melakukan Authorization terhadap seluruh Protected Endpoint. | ☐ |
| SEC-003 | Frontend menggunakan Route Guard. | ☐ |
| SEC-004 | Frontend menggunakan UI Authorization. | ☐ |
| SEC-005 | Frontend menggunakan Action Authorization. | ☐ |
| SEC-006 | Authentication mengikuti ENGINEERING-FOUNDATION.md. | ☐ |

---

# 10.7 Governance Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| GOV-001 | Route Authorization mengikuti ROUTING.md. | ☐ |
| GOV-002 | UI Authorization mengikuti COMPONENT-SPEC.md. | ☐ |
| GOV-003 | Authentication State mengikuti STATE-MANAGEMENT.md. | ☐ |
| GOV-004 | REST API Authorization mengikuti API-CONTRACT.md. | ☐ |
| GOV-005 | Business Behaviour mengikuti BUSINESS-WORKFLOW.md sebagai Behaviour Reference Only. | ☐ |

---

# 10.8 Development Readiness Checklist

Sebelum implementasi dimulai, seluruh checklist berikut harus terpenuhi.

| Checklist | Status |
|-----------|--------|
| RBAC Philosophy selesai | ☐ |
| Role Definition selesai | ☐ |
| Permission Matrix selesai | ☐ |
| Protected Resources selesai | ☐ |
| Route Authorization selesai | ☐ |
| UI Authorization selesai | ☐ |
| Action Authorization selesai | ☐ |
| Access Rules selesai | ☐ |
| API Authorization mengikuti API-CONTRACT.md | ☐ |
| Authentication mengikuti ENGINEERING-FOUNDATION.md | ☐ |
| Authorization mengikuti ROUTING.md | ☐ |
| Current User mengikuti STATE-MANAGEMENT.md | ☐ |

---

# 10.9 Production Readiness

Access Control dinyatakan siap digunakan apabila.

- Seluruh Product Module memiliki mekanisme Authorization.
- Seluruh Protected Route menggunakan Route Guard.
- Seluruh Protected UI menggunakan Permission.
- Seluruh Action menggunakan Permission.
- Seluruh REST API menggunakan Authorization.
- Frontend dan Backend menggunakan Permission yang sama.
- Authentication dan Authorization telah dipisahkan dengan jelas.
- Tidak terdapat Resource yang dapat diakses tanpa validasi Permission.
- Seluruh implementasi konsisten dengan ENGINEERING-FOUNDATION.md, ROUTING.md, STATE-MANAGEMENT.md, dan API-CONTRACT.md.

---

# 10.10 Final Acceptance

ACCESS-CONTROL.md dinyatakan **Approved** apabila.

- Seluruh Acceptance Criteria telah terpenuhi.
- Seluruh mekanisme Authorization konsisten dengan PRD.md.
- Seluruh Permission mengikuti ENGINEERING-FOUNDATION.md.
- Seluruh Route Protection mengikuti ROUTING.md.
- Seluruh Authentication State mengikuti STATE-MANAGEMENT.md.
- Seluruh Protected Endpoint mengikuti API-CONTRACT.md.
- Business Behaviour tetap mengacu pada BUSINESS-WORKFLOW.md sebagai Behaviour Reference Only.
- Frontend dan Backend menggunakan standar Authorization yang sama.
- Product Owner menyetujui ACCESS-CONTROL.md sebagai **Official Access Control Baseline** untuk seluruh Engineering Document Management System (EDMS) Rebuild.

---

# End of PART 10

ACCESS-CONTROL.md menjadi **Official Access Control Baseline** yang mendefinisikan standar resmi Authentication, Authorization, Role-Based Access Control (RBAC), Permission, Route Protection, UI Protection, Action Protection, dan API Authorization pada Engineering Document Management System (EDMS) Rebuild.

Seluruh implementasi Frontend dan Backend wajib mengacu pada dokumen ini agar mekanisme keamanan sistem tetap konsisten, terdokumentasi, mudah dipelihara, scalable, dan selaras dengan seluruh Source of Truth proyek.

# ==============================================================================

---

# PHASE 2 SOURCE OF TRUTH SYNCHRONIZATION

Bagian ini menetapkan Access Control resmi yang sesuai dengan implementasi saat ini.

## Current Implementation

Authentication runtime menggunakan `AuthService`, IndexedDB `users` dan `userCredentials`, serta localStorage key `edms.currentUser`. Password reset menggunakan token lokal dengan TTL 15 menit dan mock email. Target produksi tetap wajib memindahkan session ke backend, hashing password, dan HttpOnly Cookie.

Authorization runtime dipisahkan menjadi:

- System Role melalui `currentUser.roleId` untuk fitur global.
- Official Role per Project Membership untuk fitur project-scoped.
- Active Official Role diambil dari Active Project Context.

## Official Permission Catalog

Permission resmi:

| Permission | Scope |
|---|---|
| dashboard.view | Project |
| document-register.view | Project |
| document-register.create | Project |
| document-register.edit | Project |
| document-register.archive | Project |
| document-register.upload | Reserved / Historical Reference |
| document-register.download | Project |
| approval.a | Project |
| approval.b | Project |
| approval.c | Project |
| transmittal.incoming | Project |
| transmittal.outgoing | Project |
| sla-monitoring.view | Project |
| escalation.view | Project |
| audit-trail.view | Project |
| storage.view | Project |
| notifications.view | Project |
| profile.view | Global |
| password.change | Global |
| user-management.view | Global |

Permission lama `document.read`, `document.review`, `sla.read`, `audit.read`, `escalation.read`, `notification.read`, `user.manage`, `role.manage`, dan `permission.manage` dinyatakan deprecated untuk implementasi runtime.

## Official Role Behaviour

- `Admin` dapat mengelola Project, Membership, User, Department, Archive, Restore, Audit visibility, dan Close Project.
- `Document Owner` membuat Document dan Upload Revision pada dokumen yang dikembalikan atau ditolak.
- `Team Process` menjalankan Approval A/B/C pada status `Process Review`.
- `Team Project` menjalankan Approval A/B/C pada status `Project Review`.
- User tanpa Membership aktif pada Project tidak boleh mengakses module project-scoped.

## Route Protection

Route project-scoped wajib melewati Authentication, Permission Guard, dan Active Project Guard. Route global hanya memerlukan Authentication dan system permission.
