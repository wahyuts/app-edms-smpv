# ==============================================================================
# ROUTING.md
# PART 1 — DOCUMENT OVERVIEW
# ==============================================================================

# 1.1 Purpose

ROUTING.md merupakan dokumen resmi yang mendefinisikan arsitektur navigasi dan struktur routing pada Engineering Document Management System (EDMS).

Dokumen ini menjadi acuan implementasi navigasi aplikasi berbasis React Router sehingga seluruh perpindahan halaman, penggunaan Layout, struktur URL, dan hubungan antar Product Module dilakukan secara konsisten sesuai Product Requirement Document (PRD), ENGINEERING-FOUNDATION, IMPLEMENTATION-PLAN, UI-GUIDELINES, COMPONENT-SPEC, FILE-STRUCTURE, serta Approved UI Design Mockup.

ROUTING.md tidak mendefinisikan kebutuhan bisnis baru maupun Business Workflow. Seluruh perilaku bisnis tetap mengacu pada BUSINESS-WORKFLOW.md sebagai **Behaviour Reference Only**.

---

# 1.2 Objectives

Dokumen ini bertujuan untuk:

- Mendefinisikan struktur routing seluruh Product Module EDMS.
- Menentukan hubungan antara Route, Layout, dan Page.
- Menjadi acuan implementasi React Router pada Frontend.
- Menjamin konsistensi navigasi sesuai Approved UI Design Mockup.
- Menjadi referensi bagi Frontend Developer, Backend Developer, QA Engineer, dan AI Coding Agent dalam mengimplementasikan navigasi aplikasi.
- Mengurangi risiko inkonsistensi URL, Layout, dan perpindahan halaman selama proses pengembangan.

---

# 1.3 Scope

ROUTING.md mencakup:

- Routing Architecture
- Route Hierarchy
- Layout Routing
- Navigation Mapping
- Route Grouping
- Route Naming Convention
- Route Rules
- Protected Route Concept
- Route Dependency
- Routing Acceptance Criteria

Dokumen ini tidak membahas:

- Business Workflow
- Business Rules
- Functional Requirements
- UI Design Detail
- Component Specification
- API Contract
- Database Schema
- State Management
- Access Control

Topik tersebut dijelaskan pada dokumen Source of Truth yang sesuai.

---

# 1.4 Target Readers

Dokumen ini ditujukan untuk:

| Role | Purpose |
|------|---------|
| Product Owner | Memastikan struktur navigasi sesuai kebutuhan produk |
| Solution Architect | Menjaga konsistensi arsitektur navigasi aplikasi |
| Frontend Developer | Mengimplementasikan React Router dan struktur navigasi |
| Backend Developer | Memahami hubungan Product Module dengan URL aplikasi |
| QA Engineer | Menyusun skenario pengujian navigasi aplikasi |
| AI Coding Agent | Menghasilkan implementasi routing yang konsisten |

---

# 1.5 Source Documents

Seluruh isi ROUTING.md wajib mengacu pada dokumen berikut.

## Primary Source

- PRD.md
- ENGINEERING-FOUNDATION.md
- IMPLEMENTATION-PLAN.md
- UI-GUIDELINES.md
- COMPONENT-SPEC.md
- FILE-STRUCTURE.md
- Approved UI Design Mockup

## Behaviour Reference

- BUSINESS-WORKFLOW.md

Apabila terjadi perbedaan informasi, prioritas mengikuti **Project Documentation Hierarchy** yang telah ditetapkan.

BUSINESS-WORKFLOW.md hanya digunakan sebagai **Behaviour Reference**, bukan sebagai sumber struktur routing maupun navigasi aplikasi.

---

# 1.6 Routing Principles

Seluruh implementasi routing wajib mengikuti prinsip berikut.

- Single Source of Truth.
- Route to Page, Never Directly to Component.
- Layout First Architecture.
- Feature First Routing.
- Consistent URL Structure.
- Predictable Navigation.
- Protected Route Ready.
- Deep Link Ready.
- Responsive Navigation.
- React Router Based.

---

# 1.7 Expected Outcome

Setelah ROUTING.md selesai disusun, Frontend Developer, QA Engineer, dan AI Coding Agent harus mampu:

- Memahami struktur navigasi seluruh aplikasi EDMS.
- Mengimplementasikan React Router secara konsisten.
- Menghubungkan setiap Route dengan Layout dan Page yang sesuai.
- Menjaga kesesuaian navigasi terhadap Approved UI Design Mockup.
- Mengembangkan Product Module baru tanpa mengubah arsitektur routing utama.
- Mengintegrasikan Protected Route dan Navigation Guard sesuai ENGINEERING-FOUNDATION tanpa mengubah struktur Route yang telah ditetapkan.

---

# END OF PART 1
# ==============================================================================

# ==============================================================================
# PART 2 — Routing Philosophy
# ==============================================================================

## 2.1 Purpose

Routing Philosophy mendefinisikan prinsip dasar yang menjadi landasan seluruh implementasi navigasi pada Engineering Document Management System (EDMS) Rebuild.

Bagian ini memastikan bahwa seluruh Route, Layout, Navigation, dan URL memiliki perilaku yang konsisten di seluruh aplikasi.

Routing Philosophy menjadi pedoman bagi seluruh implementasi React Router serta menjadi acuan dalam pengembangan Product Module baru.

---

## 2.2 Routing Philosophy

Engineering Document Management System (EDMS) Rebuild menggunakan pendekatan **Layout-Based Routing** yang dipadukan dengan **Feature-Oriented Routing**.

Setiap Route merepresentasikan sebuah **Page**, bukan Component.

Hubungan routing mengikuti hierarki berikut.

```text
Route

↓

Layout

↓

Page

↓

Feature

↓

Component
```

Pendekatan ini memastikan bahwa setiap halaman memiliki struktur yang konsisten, mudah dipelihara, dan mudah dikembangkan.

---

## 2.3 Routing Principles

Seluruh implementasi routing wajib mengikuti prinsip berikut.

### RP-001 Route Represents Page

Satu Route hanya mewakili satu Page.

Route tidak diperbolehkan mengarah langsung ke UI Component.

---

### RP-002 Layout First

Seluruh Page berada di dalam Layout yang sesuai.

Layout bertanggung jawab terhadap struktur global aplikasi seperti Sidebar, Top Navigation, Footer, dan Content Area.

---

### RP-003 Feature-Oriented Routing

Routing mengikuti Product Module yang telah didefinisikan pada PRD.

Contoh.

```text
Dashboard

↓

Document Register

↓

Transmittal

↓

SLA Monitoring

↓

Escalation

↓

Audit Trail

↓

Storage NAS

↓

Notifications

↓

Administration
```

---

### RP-004 Predictable URL

URL harus mudah dipahami oleh pengguna.

URL menggunakan nama Feature yang jelas.

Contoh.

```text
/dashboard

/document-register

/transmittal

/sla-monitoring

/escalation-alert
```

---

### RP-005 Consistent Navigation

Seluruh navigasi Sidebar, Breadcrumb, dan Menu harus menggunakan struktur Route yang sama.

Tidak diperbolehkan terdapat navigasi yang menuju halaman di luar Route yang telah ditetapkan.

---

### RP-006 Deep Link Ready

Seluruh halaman harus dapat diakses secara langsung melalui URL tanpa bergantung pada halaman sebelumnya.

---

### RP-007 Future Scalability

Struktur Route harus mendukung penambahan Product Module baru tanpa mengubah struktur Route yang sudah ada.

---

## 2.4 Routing Objectives

Routing pada EDMS bertujuan untuk:

- Menyediakan navigasi yang konsisten.
- Menjaga hubungan antara Menu, URL, dan Page.
- Mempermudah implementasi React Router.
- Mempermudah implementasi Protected Route.
- Mendukung Bookmark dan Deep Link.
- Mendukung Browser Navigation.
- Mendukung skalabilitas aplikasi.

---

## 2.5 Routing Characteristics

Routing pada EDMS memiliki karakteristik berikut.

- Modular.
- Predictable.
- Hierarchical.
- Scalable.
- URL Friendly.
- Feature-Oriented.
- Layout Based.
- React Router Compatible.

---

## 2.6 Navigation Consistency

Seluruh Route wajib konsisten dengan:

- Sidebar Navigation.
- Top Navigation.
- Breadcrumb.
- Page Title.
- Browser URL.
- Product Module pada PRD.
- UI-GUIDELINES.md.

Apabila terjadi perubahan navigasi, Route harus diperbarui secara konsisten.

---

## 2.7 Routing Design Rules

Seluruh implementasi routing wajib memenuhi aturan berikut.

- Tidak menggunakan Route yang ambigu.
- Tidak membuat Route yang tidak memiliki Page.
- Tidak menghubungkan Route langsung ke Component.
- Seluruh Route harus memiliki tujuan yang jelas.
- Seluruh URL menggunakan format yang konsisten.
- Routing mengikuti struktur FILE-STRUCTURE.md.

---

## 2.8 General Rules

Routing Philosophy wajib mengikuti:

- PRD.md
- ENGINEERING-FOUNDATION.md
- IMPLEMENTATION-PLAN.md
- UI-GUIDELINES.md
- COMPONENT-SPEC.md
- FILE-STRUCTURE.md
- Approved UI Design Mockup

BUSINESS-WORKFLOW.md hanya digunakan sebagai Behaviour Reference.

---

## 2.9 Best Practices

Untuk menjaga kualitas arsitektur routing.

- Gunakan Route yang sederhana.
- Gunakan URL yang mudah dipahami.
- Pisahkan Layout dan Page.
- Hindari Route yang berulang.
- Gunakan struktur Route yang konsisten.
- Pastikan setiap Route dapat diuji secara independen.

---

## 2.10 Acceptance Criteria

Routing Philosophy dinyatakan memenuhi standar apabila.

- Seluruh Route merepresentasikan Page.
- Seluruh Page berada di dalam Layout.
- URL mengikuti Product Module.
- Routing mendukung Deep Link.
- Routing mudah dipahami.
- Routing konsisten dengan UI Mockup.
- Routing siap mendukung Protected Route.
- Seluruh implementasi mengikuti ENGINEERING-FOUNDATION.md dan FILE-STRUCTURE.md.

---

# End of PART 2

# ==============================================================================
# PART 3 — Route Architecture
# ==============================================================================

## 3.1 Purpose

Route Architecture mendefinisikan struktur hierarki routing yang digunakan oleh Engineering Document Management System (EDMS) Rebuild.

Bagian ini menjelaskan bagaimana Route, Layout, Page, Feature, dan Component saling berhubungan sehingga implementasi React Router memiliki arsitektur yang konsisten.

---

## 3.2 Route Architecture Overview

EDMS menggunakan arsitektur routing bertingkat.

```text
Browser URL

↓

Route

↓

Layout

↓

Page

↓

Feature Module

↓

UI Components
```

Setiap layer memiliki tanggung jawab yang berbeda dan tidak boleh saling mengambil alih fungsi.

---

## 3.3 Route Hierarchy

Hierarki routing mengikuti struktur berikut.

```text
Application

│

├── Public Route

└── Protected Route
        │
        ├── Dashboard
        ├── Document Register
        ├── Transmittal
        ├── SLA Monitoring
        ├── Escalation
        ├── Audit Trail
        ├── Storage NAS
        ├── Notifications
        └── Administration
```

Seluruh Product Module berada di bawah Protected Route.

---

## 3.4 Route Relationship

Hubungan antar elemen routing mengikuti struktur berikut.

```text
Route

↓

Layout

↓

Page

↓

Feature

↓

Component
```

Contoh.

```text
/dashboard

↓

Main Layout

↓

Dashboard Page

↓

Dashboard Feature

↓

Summary Card

↓

Document Register Table

↓

SLA Overview

↓

Escalation Alert
```

---

## 3.5 Layout Architecture

Layout bertanggung jawab terhadap struktur global aplikasi.

```text
Application Layout

│

├── Sidebar

├── Top Navigation

├── Main Content

└── Footer
```

Setiap Page dirender di dalam **Main Content**.

---

## 3.6 Route Organization

Seluruh Route dikelompokkan berdasarkan Product Module.

```text
Dashboard

Document Register

Transmittal

SLA Monitoring

Escalation

Audit Trail

Storage NAS

Notifications

Administration
```

Setiap Product Module memiliki Route utama dan dapat memiliki Child Route sesuai kebutuhan implementasi.

---

## 3.7 Architecture Rules

Seluruh Route Architecture wajib memenuhi aturan berikut.

- Route mengarah ke Page.
- Page berada di dalam Layout.
- Layout menggunakan Shared Component.
- Component tidak menjadi tujuan Route.
- Feature dipisahkan berdasarkan Product Module.
- Struktur mengikuti FILE-STRUCTURE.md.

---

## 3.8 Dependency Flow

Hubungan dependency routing mengikuti struktur berikut.

```text
Browser

↓

Route

↓

Layout

↓

Page

↓

Feature

↓

Component
```

Dependency hanya diperbolehkan mengikuti arah tersebut.

---

## 3.9 General Rules

Route Architecture wajib memenuhi ketentuan berikut.

- Menggunakan React Router.
- Mengikuti Layout-Based Architecture.
- Mengikuti Feature-Oriented Architecture.
- Konsisten dengan UI-GUIDELINES.md.
- Konsisten dengan COMPONENT-SPEC.md.
- Konsisten dengan FILE-STRUCTURE.md.
- Mendukung Protected Route.
- Mendukung penambahan Feature baru.

---

## 3.10 Acceptance Criteria

Route Architecture dinyatakan memenuhi standar apabila.

- Hierarki Route jelas.
- Hubungan Route, Layout, dan Page terdokumentasi.
- Seluruh Product Module berada pada struktur yang benar.
- Tidak terdapat Route yang langsung menuju Component.
- Dependency mengikuti arsitektur yang telah ditetapkan.
- Struktur mudah dipahami oleh Developer dan AI Coding Assistant.
- Konsisten dengan seluruh Source of Truth proyek.

---

# End of PART 3

# ==============================================================================
# PART 4 — Public Routes
# ==============================================================================

## 4.1 Purpose

Public Routes mendefinisikan seluruh halaman yang dapat diakses tanpa memerlukan autentikasi pengguna.

Pada Engineering Document Management System (EDMS) Rebuild, jumlah Public Route dibuat seminimal mungkin untuk menjaga keamanan sistem.

Bagian ini menjadi acuan implementasi React Router sebelum mekanisme Authentication dan Authorization diterapkan pada ACCESS-CONTROL.md.

---

## 4.2 Public Route Philosophy

EDMS merupakan aplikasi internal perusahaan.

Oleh karena itu, hampir seluruh Product Module berada pada Protected Route.

Public Route hanya digunakan untuk kebutuhan berikut.

- Authentication
- Error Handling
- Session Management

Public Route tidak diperbolehkan mengakses data Engineering Document.

---

## 4.3 Public Route Hierarchy

Struktur Public Route mengikuti arsitektur berikut.

```text
Application

│

└── Public Routes

    │

    ├── /

    ├── /login

    ├── /forgot-password

    ├── /reset-password

    ├── /401

    ├── /403

    ├── /404

    └── /500
```

---

## 4.4 Public Route Mapping

| Route | Page | Description |
|---------|------|-------------|
| `/` | Landing Redirect | Mengarahkan pengguna ke Login atau Dashboard sesuai status autentikasi dan Project Selection Flow. |
| `/login` | Login Page | Halaman autentikasi pengguna. |
| `/select-project` | Select Active Project | Gateway setelah Login untuk memilih dan mengonfirmasi Active Project sebelum Dashboard. Route ini memerlukan Authentication dan menggunakan Authentication Layout tanpa Sidebar. |
| `/forgot-password` | Forgot Password | Permintaan reset password menggunakan Username dan Registered Email. |
| `/check-email` | Check Your Email | Generic response setelah request reset password diproses. |
| `/mock-email/:emailId` | Development Mock Email Detail | Detail email simulasi reset password, hanya tersedia ketika development mock email aktif. |
| `/reset-password` | Reset Password | Membuat password baru menggunakan token yang valid. Route tanpa token valid dianggap Invalid. |
| `/401` | Unauthorized | Pengguna belum terautentikasi. |
| `/403` | Forbidden | Pengguna tidak memiliki hak akses. |
| `/404` | Not Found | Halaman tidak ditemukan. |
| `/500` | Internal Server Error | Terjadi kesalahan pada sistem. |

---

## 4.5 Public Route Layout

Seluruh Public Route menggunakan Authentication Layout.

```text
Authentication Layout

│

├── Logo

├── Authentication Content

└── Footer
```

Layout ini terpisah dari Main Application Layout.

---

## 4.6 Public Route Rules

Seluruh Public Route wajib memenuhi aturan berikut.

### PR-001

Public Authentication Route tidak memerlukan Login, kecuali `/select-project` yang merupakan Protected Gateway setelah Login.

---

### PR-002

Tidak menampilkan Sidebar Navigation.

---

### PR-003

Tidak menampilkan Dashboard Layout.

---

### PR-004

Tidak mengakses data Engineering Document.

---

### PR-005

Setelah Login berhasil, pengguna diarahkan menuju Project Selection Gateway apabila memiliki minimal satu Project Active yang dapat diakses. Apabila tidak memiliki Project Active, pengguna diarahkan menuju Default Protected Route.

---

## 4.7 Navigation Behaviour

Navigasi Public Route mengikuti aturan berikut.

```text
User

↓

Login

↓

Authentication Success

↓

Dashboard
```

atau

```text
User

↓

Access Denied

↓

403 Page
```

atau

```text
User

↓

Unknown URL

↓

404 Page
```

---

## 4.8 Dependency

Untuk CR-008, setelah `Authentication Success`, sistem memuat Accessible Project terlebih dahulu.

Flow Login terbaru:

```text
Login
  -> Authentication Success
  -> Load Accessible Project
  -> 0 Project: Dashboard
  -> >=1 Project: Select Active Project
  -> Continue to Dashboard
  -> Dashboard
```

Public Route hanya bergantung pada.

- Authentication Module
- Session Validation
- React Router

Public Route tidak bergantung pada Product Module.

---

## 4.9 General Rules

Seluruh Public Route wajib.

- Menggunakan Authentication Layout.
- Tidak memiliki Sidebar.
- Tidak memiliki Breadcrumb.
- Tidak memiliki Navigation Menu.
- Tidak mengakses API selain Authentication.
- Mengikuti ENGINEERING-FOUNDATION.md.
- Mengikuti UI-GUIDELINES.md.

---

## 4.10 Acceptance Criteria

Public Route dinyatakan memenuhi standar apabila.

- Seluruh halaman Login dapat diakses tanpa autentikasi.
- Error Page dapat diakses kapan saja.
- Public Route tidak menampilkan Main Layout.
- Public Route tidak mengakses Product Module.
- Seluruh implementasi konsisten dengan React Router Architecture.

---

# End of PART 4

# ==============================================================================
# PART 5 — Protected Routes
# ==============================================================================

## 5.1 Purpose

Protected Routes mendefinisikan seluruh halaman yang hanya dapat diakses oleh pengguna yang telah berhasil melakukan autentikasi.

Seluruh Product Module Engineering Document Management System (EDMS) berada pada Protected Route.

Bagian ini menjadi dasar implementasi Navigation, Layout, dan Route Guard yang akan digunakan bersama ACCESS-CONTROL.md.

---

## 5.2 Protected Route Philosophy

Protected Route merupakan area utama aplikasi.

Seluruh aktivitas pengguna dilakukan melalui Protected Route setelah proses Login berhasil.

Setiap Protected Route berada di dalam Main Application Layout sehingga seluruh halaman memiliki struktur UI yang konsisten.

---

## 5.3 Protected Route Hierarchy

```text
Protected Routes

│

├── Dashboard

├── Document Register
│     ├── PFD
│     └── P&ID
│
├── Transmittal
│     ├── Incoming
│     └── Outgoing
│
├── SLA Monitoring

├── Escalation

├── Audit Trail

├── Storage NAS

├── Notifications

└── Administration
```

Seluruh Product Module mengikuti struktur navigasi yang telah ditetapkan pada UI-GUIDELINES.md.

---

## 5.4 Protected Route Mapping

| Route | Page |
|---------|------|
| `/dashboard` | Dashboard |
| `/document-register/pfd` | Document Register - PFD |
| `/document-register/pid` | Document Register - P&ID |
| `/transmittal/incoming` | Incoming Transmittal |
| `/transmittal/outgoing` | Outgoing Transmittal |
| `/sla-monitoring` | SLA Monitoring |
| `/escalation-alert` | Escalation Alert |
| `/audit-trail` | Audit Trail |
| `/storage-nas` | Storage NAS |
| `/notifications` | Notifications |
| `/user-management` | User Management |
| `/project-management` | Project Management |
| `/project-membership` | Project Membership |

---

## 5.5 Protected Route Layout

Seluruh Protected Route menggunakan Main Application Layout.

```text
Main Layout

│

├── Sidebar Navigation

├── Top Navigation

├── Breadcrumb

├── Main Content

└── Footer
```

Layout ini digunakan secara konsisten oleh seluruh Product Module.

---

## 5.6 Navigation Behaviour

Navigasi Protected Route mengikuti alur berikut.

```text
Login

↓

Dashboard

↓

Sidebar Navigation

↓

Selected Product Module

↓

Page

↓

Feature
```

Perpindahan antar Product Module dilakukan melalui Sidebar Navigation atau Breadcrumb.

---

## 5.7 Route Guard Concept

Seluruh Protected Route berada di belakang Authentication.

Konsep Route Guard.

```text
Request Route

↓

Authenticated ?

↓

YES

↓

Render Layout

↓

Render Page

↓

NO

↓

Redirect Login
```

Detail Authorization akan dijelaskan pada ACCESS-CONTROL.md.

---

## 5.8 Dependency

Protected Route bergantung pada.

- Authentication
- Main Layout
- Sidebar Navigation
- Breadcrumb
- React Router

Protected Route tidak bergantung langsung pada Business Workflow.

---

## 5.9 General Rules

Seluruh Protected Route wajib.

- Menggunakan Main Layout.
- Menampilkan Sidebar Navigation.
- Menampilkan Top Navigation.
- Menampilkan Breadcrumb.
- Menggunakan URL yang konsisten.
- Mengikuti struktur Product Module pada PRD.
- Mengikuti UI-GUIDELINES.md.
- Mengikuti COMPONENT-SPEC.md.

---

## 5.10 Acceptance Criteria

Protected Route dinyatakan memenuhi standar apabila.

- Seluruh Product Module berada pada Protected Route.
- Main Layout digunakan secara konsisten.
- Navigasi mengikuti Sidebar.
- Route Guard dapat diterapkan tanpa mengubah struktur Route.
- Seluruh URL mengikuti Product Module.
- Struktur konsisten dengan PRD, UI-GUIDELINES.md, dan FILE-STRUCTURE.md.

---

# End of PART 5

# ==============================================================================
# PART 6 — Navigation Mapping
# ==============================================================================

## 6.1 Purpose

Navigation Mapping mendefinisikan hubungan antara User Interface Navigation dengan Route yang tersedia pada Engineering Document Management System (EDMS) Rebuild.

Bagian ini memastikan bahwa seluruh menu, submenu, Sidebar Navigation, Top Navigation, dan Breadcrumb memiliki hubungan yang konsisten terhadap Route yang telah ditetapkan.

Navigation Mapping menjadi acuan implementasi React Router, Sidebar Component, dan Navigation Component.

---

## 6.2 Navigation Philosophy

Navigasi aplikasi mengikuti prinsip berikut.

- Navigation follows Product Module.
- Every Navigation has exactly one Route.
- Every Route has exactly one Primary Navigation.
- Navigation reflects Product Hierarchy.
- Navigation follows Approved UI Design Mockup.

---

## 6.3 Navigation Hierarchy

Struktur navigasi aplikasi mengikuti hierarki berikut.

```text
Dashboard

Document Register
├── PFD
└── P&ID

Transmittal
├── Incoming
└── Outgoing

SLA Monitoring

Escalation

Audit Trail

Storage NAS

Notifications

Administration
```

Hierarki di atas menjadi struktur utama Sidebar Navigation.

---

## 6.4 Sidebar Navigation Mapping

| Navigation | Route |
|------------|---------------------------|
| Dashboard | /dashboard |
| Document Register → PFD | /document-register/pfd |
| Document Register → P&ID | /document-register/pid |
| Transmittal → Incoming | /transmittal/incoming |
| Transmittal → Outgoing | /transmittal/outgoing |
| SLA Monitoring | /sla-monitoring |
| Escalation Alert | /escalation-alert |
| Audit Trail | /audit-trail |
| Storage NAS | /storage-nas |
| Notifications | /notifications |
| User Management | /user-management |
| Project Management | /project-management |
| Project Membership | /project-membership |

Seluruh menu utama pada Sidebar wajib memiliki Route yang sesuai.

---

## 6.5 Navigation Behaviour

Perilaku navigasi mengikuti alur berikut.

```text
User

↓

Sidebar Menu

↓

React Router

↓

Route

↓

Layout

↓

Page

↓

Feature Module
```

Perubahan Route secara otomatis memperbarui halaman aktif, Sidebar Active State, serta Breadcrumb.

---

## 6.6 Active Navigation Rules

Sidebar wajib menampilkan Active State berdasarkan Route saat ini.

Contoh.

```text
Current Route

↓

/document-register/pfd

↓

Active Menu

↓

Document Register

↓

PFD
```

Apabila pengguna berpindah Route, Active State wajib diperbarui secara otomatis.

---

## 6.7 Navigation Rules

Seluruh Navigation wajib memenuhi aturan berikut.

### NM-001

Setiap Navigation memiliki satu Route.

---

### NM-002

Setiap Route memiliki satu Navigation utama.

---

### NM-003

Navigation mengikuti Product Module pada PRD.

---

### NM-004

Navigation mengikuti struktur Sidebar pada UI-GUIDELINES.md.

---

### NM-005

Navigation tidak diperbolehkan mengakses Component secara langsung.

---

### NM-006

Navigation selalu menuju Page melalui React Router.

---

## 6.8 Dependency

Navigation bergantung pada.

- React Router
- Sidebar Component
- Top Navigation
- Breadcrumb
- Layout
- Product Module

Navigation tidak bergantung pada Business Logic.

---

## 6.9 General Rules

Seluruh Navigation wajib.

- Konsisten dengan UI Mockup.
- Konsisten dengan PRD.
- Menggunakan Route yang telah ditentukan.
- Tidak memiliki Navigation tanpa Route.
- Tidak memiliki Route tanpa Navigation (kecuali Error Pages).
- Mengikuti FILE-STRUCTURE.md.

---

## 6.10 Acceptance Criteria

Navigation Mapping dinyatakan memenuhi standar apabila.

- Seluruh Navigation memiliki Route.
- Sidebar sesuai dengan Product Module.
- Active Menu mengikuti Current Route.
- Navigation konsisten dengan UI-GUIDELINES.md.
- Tidak terdapat Navigation yang ambigu.
- Seluruh implementasi konsisten dengan ENGINEERING-FOUNDATION.md dan FILE-STRUCTURE.md.

---

# End of PART 6

# ==============================================================================
# PART 7 — Breadcrumb Structure
# ==============================================================================

## 7.1 Purpose

Breadcrumb Structure mendefinisikan standar Breadcrumb Navigation pada Engineering Document Management System (EDMS) Rebuild.

Breadcrumb berfungsi memberikan informasi posisi pengguna terhadap hierarki navigasi aplikasi serta mempermudah perpindahan antar Product Module.

---

## 7.2 Breadcrumb Philosophy

Breadcrumb mengikuti struktur Product Module yang telah ditetapkan pada PRD dan Sidebar Navigation.

Breadcrumb tidak mengikuti Business Workflow.

Breadcrumb hanya merepresentasikan lokasi halaman di dalam struktur aplikasi.

---

## 7.3 Breadcrumb Hierarchy

Struktur Breadcrumb mengikuti hierarki berikut.

```text
Dashboard

↓

Product Module

↓

Child Module (jika ada)

↓

Current Page
```

---

## 7.4 Breadcrumb Mapping

| Route | Breadcrumb |
|--------|------------|
| /dashboard | Dashboard |
| /document-register/pfd | Dashboard > Document Register > PFD |
| /document-register/pid | Dashboard > Document Register > P&ID |
| /transmittal/incoming | Dashboard > Transmittal > Incoming |
| /transmittal/outgoing | Dashboard > Transmittal > Outgoing |
| /sla-monitoring | Dashboard > SLA Monitoring |
| /escalation-alert | Dashboard > Escalation Alert |
| /audit-trail | Dashboard > Audit Trail |
| /storage-nas | Dashboard > Storage NAS |
| /notifications | Dashboard > Notifications |
| /user-management | Dashboard > Administration > User Management |
| /project-management | Dashboard > Administration > Project Management |
| /project-membership | Dashboard > Administration > Project Membership |

---

## 7.5 Breadcrumb Behaviour

Breadcrumb diperbarui secara otomatis ketika Route berubah.

```text
Route Changed

↓

React Router

↓

Breadcrumb Updated

↓

Current Page Displayed
```

Tidak diperbolehkan memperbarui Breadcrumb secara manual.

---

## 7.6 Breadcrumb Rules

### BC-001

Setiap Protected Route wajib memiliki Breadcrumb.

---

### BC-002

Breadcrumb mengikuti struktur Product Module.

---

### BC-003

Breadcrumb mengikuti Route saat ini.

---

### BC-004

Breadcrumb tidak digunakan pada Login Page.

---

### BC-005

Error Page tidak menampilkan Breadcrumb.

---

### BC-006

Breadcrumb ditampilkan pada Main Layout.

---

## 7.7 Dependency

Breadcrumb bergantung pada.

- React Router
- Main Layout
- Navigation Mapping

Breadcrumb tidak bergantung pada Business Workflow maupun Business Logic.

---

## 7.8 Display Rules

Breadcrumb harus.

- Selalu berada di bawah Top Navigation.
- Selalu berada di atas Page Title.
- Menggunakan urutan yang konsisten.
- Mengikuti struktur Sidebar Navigation.

---

## 7.9 General Rules

Seluruh Breadcrumb wajib.

- Mengikuti struktur Route.
- Mengikuti Product Module.
- Konsisten dengan UI-GUIDELINES.md.
- Tidak menggunakan nama yang ambigu.
- Mudah dipahami oleh pengguna.

---

## 7.10 Acceptance Criteria

Breadcrumb Structure dinyatakan memenuhi standar apabila.

- Seluruh Protected Route memiliki Breadcrumb.
- Breadcrumb mengikuti Current Route.
- Breadcrumb mengikuti struktur Product Module.
- Breadcrumb diperbarui secara otomatis.
- Breadcrumb konsisten dengan Navigation Mapping.
- Seluruh implementasi konsisten dengan UI-GUIDELINES.md, FILE-STRUCTURE.md, dan ENGINEERING-FOUNDATION.md.

---

# End of PART 7

# ==============================================================================
# PART 8 — Route Rules
# ==============================================================================

## 8.1 Purpose

Route Rules mendefinisikan standar implementasi seluruh Route pada Engineering Document Management System (EDMS) Rebuild.

Bagian ini bertujuan menjaga konsistensi struktur URL, penamaan Route, penggunaan Layout, Child Route, Redirect, serta perilaku navigasi sehingga implementasi React Router tetap mudah dipahami, mudah dipelihara, dan konsisten dengan seluruh Source of Truth proyek.

---

## 8.2 Route Naming Rules

Seluruh Route wajib mengikuti aturan penamaan berikut.

### RR-001

Menggunakan huruf kecil (**lowercase**).

**Contoh**

```text
/dashboard
```

---

### RR-002

Menggunakan format:

```text
kebab-case
```

**Contoh**

```text
/notification-center
```

---

### RR-003

Tidak menggunakan spasi.

---

### RR-004

Tidak menggunakan karakter khusus.

---

### RR-005

Nama Route harus mewakili Product Module yang sebenarnya.

---

## 8.3 URL Structure Rules

Seluruh URL mengikuti struktur berikut.

```text
/

↓

Main Module

↓

Child Module (Optional)

↓

Sub Module (Optional)
```

Contoh.

```text
/dashboard

/document-register/pfd

/document-register/pid

/transmittal/incoming

/transmittal/outgoing
```

Struktur URL harus mencerminkan hierarki Product Module.

---

## 8.4 Parent & Child Route Rules

Parent Route digunakan sebagai kelompok navigasi.

Child Route digunakan sebagai halaman di dalam Parent Route.

Contoh.

```text
Document Register

│

├── PFD

└── P&ID
```

Implementasi Route.

```text
/document-register

├── /pfd

└── /pid
```

React Router.

```text
/document-register/pfd

/document-register/pid
```

Pendekatan yang sama digunakan pada seluruh Product Module yang memiliki Child Module.

---

## 8.5 Redirect Rules

Redirect hanya diperbolehkan pada kondisi berikut.

### Root Redirect

```text
/

↓

Login

atau

Dashboard
```

sesuai status autentikasi pengguna.

---

### Invalid Route

```text
Unknown URL

↓

404
```

---

### Unauthorized

```text
Protected Route

↓

Not Authenticated

↓

Login
```

---

### Forbidden

```text
Protected Route

↓

Authenticated

↓

No Permission

↓

403
```

---

## 8.6 Route Parameter Rules

Saat ini EDMS tidak menggunakan Route Parameter sebagai navigasi utama Product Module.

Apabila diperlukan pada implementasi tertentu, parameter hanya digunakan untuk mengidentifikasi resource.

Contoh.

```text
/documents/:documentId

/users/:userId
```

Route Parameter tidak diperbolehkan menggantikan struktur Product Module.

---

## 8.7 Route Organization Rules

Seluruh Route wajib mengikuti aturan berikut.

- Route mengarah ke Page.
- Satu Route mewakili satu Page.
- Child Route berada di bawah Parent Route.
- Route mengikuti Product Module pada PRD.
- Route mengikuti Navigation Mapping.
- Route mengikuti FILE-STRUCTURE.md.
- Route tidak mengarah langsung ke Component.

---

## 8.8 Error Route Rules

Error Route wajib tersedia.

```text
/401

/403

/404

/500
```

Ketentuan.

- Tidak menggunakan Main Layout.
- Tidak menampilkan Sidebar.
- Tidak menampilkan Breadcrumb.
- Dapat diakses sesuai kondisi yang berlaku.

---

## 8.9 General Rules

Seluruh Route wajib memenuhi ketentuan berikut.

- Menggunakan React Router.
- Menggunakan URL yang mudah dipahami.
- Mengikuti Product Module.
- Mengikuti Navigation Mapping.
- Mengikuti Breadcrumb Structure.
- Mengikuti UI-GUIDELINES.md.
- Mengikuti FILE-STRUCTURE.md.
- Tidak terdapat URL yang ambigu.
- Tidak terdapat Route yang tidak digunakan.

---

## 8.10 Acceptance Criteria

Route Rules dinyatakan memenuhi standar apabila.

- Seluruh URL menggunakan format yang konsisten.
- Parent Route dan Child Route mengikuti hierarki Product Module.
- Redirect mengikuti aturan yang telah ditetapkan.
- Error Route tersedia.
- Route Parameter digunakan secara konsisten.
- Tidak terdapat Route yang ambigu.
- Seluruh implementasi konsisten dengan ENGINEERING-FOUNDATION.md, UI-GUIDELINES.md, dan FILE-STRUCTURE.md.

---

# End of PART 8
# ==============================================================================

# ==============================================================================
# PART 9 — Route Dependency
# ==============================================================================

## 9.1 Purpose

Route Dependency mendefinisikan hubungan (dependency) antara Route, Layout, Page, Feature Module, Navigation, dan Component pada Engineering Document Management System (EDMS) Rebuild.

Bagian ini bertujuan memastikan implementasi React Router memiliki dependency yang jelas sehingga setiap Route hanya berkomunikasi dengan layer yang diperbolehkan sesuai arsitektur aplikasi.

---

## 9.2 Dependency Philosophy

Seluruh dependency routing mengikuti prinsip berikut.

- One Direction Dependency
- Separation of Concerns
- Feature Isolation
- Layout First
- Low Coupling
- High Cohesion

Setiap Route hanya diperbolehkan bergantung pada layer yang berada tepat di bawahnya.

---

## 9.3 Route Dependency Flow

Dependency routing mengikuti struktur berikut.

```text
Browser URL

↓

React Router

↓

Route

↓

Layout

↓

Page

↓

Feature Module

↓

UI Component

↓

Hook

↓

Service

↓

REST API

↓

Backend
```

Dependency wajib mengikuti arah tersebut.

---

## 9.4 Route Layer Dependency

Hubungan dependency antar layer.

| Layer | Can Access |
|---------|------------|
| Browser URL | React Router |
| React Router | Route |
| Route | Layout |
| Layout | Page |
| Page | Feature Module |
| Feature Module | Component |
| Component | Hook |
| Hook | Service |
| Service | REST API |

Dependency di luar hubungan tersebut tidak diperbolehkan.

---

## 9.5 Allowed Dependency

Dependency berikut diperbolehkan.

```text
Route

↓

Layout
```

---

```text
Layout

↓

Page
```

---

```text
Page

↓

Feature Module
```

---

```text
Feature Module

↓

Shared Component
```

---

```text
Component

↓

Hook

↓

Service
```

---

## 9.6 Forbidden Dependency

Dependency berikut tidak diperbolehkan.

```text
Route

↓

Component
```

---

```text
Route

↓

Service
```

---

```text
Layout

↓

REST API
```

---

```text
Component

↓

Database
```

---

```text
Hook

↓

Database
```

---

```text
Route

↓

Business Logic
```

---

## 9.7 Route Independence

Setiap Route harus berdiri secara independen.

Contoh.

```text
/dashboard
```

tidak bergantung pada.

```text
/document-register/pfd
```

Setiap Product Module hanya berbagi dependency melalui.

- Shared Component
- Shared Hook
- Shared Service
- Shared Utility
- Shared Store

---

## 9.8 Circular Dependency Rules

Circular Dependency tidak diperbolehkan.

Contoh yang salah.

```text
Route A

↓

Route B

↓

Route C

↓

Route A
```

Apabila diperlukan komunikasi antar Product Module, gunakan Shared Service atau Global State.

---

## 9.9 General Rules

Seluruh Route Dependency wajib memenuhi ketentuan berikut.

- Mengikuti React Router Architecture.
- Mengikuti Feature-Oriented Architecture.
- Mengikuti Layout-Based Routing.
- Tidak mengandung Circular Dependency.
- Tidak mengakses Database.
- Tidak mengandung Business Logic.
- Mengikuti ENGINEERING-FOUNDATION.md.
- Mengikuti FILE-STRUCTURE.md.
- Mengikuti COMPONENT-SPEC.md.

---

## 9.10 Acceptance Criteria

Route Dependency dinyatakan memenuhi standar apabila.

- Dependency mengikuti satu arah.
- Tidak terdapat Circular Dependency.
- Route hanya mengakses Layout.
- Layout hanya mengakses Page.
- Page hanya mengakses Feature Module.
- Service menjadi satu-satunya komunikasi menuju Backend.
- Seluruh dependency konsisten dengan ENGINEERING-FOUNDATION.md dan FILE-STRUCTURE.md.

---

# End of PART 9
# ==============================================================================

# ==============================================================================
# PART 10 — Routing Acceptance Criteria
# ==============================================================================

## 10.1 Purpose

Routing Acceptance Criteria mendefinisikan standar akhir yang harus dipenuhi sebelum implementasi routing pada Engineering Document Management System (EDMS) Rebuild dinyatakan siap digunakan sebagai dasar pengembangan Frontend.

Bagian ini menjadi acuan verifikasi bagi Product Owner, Solution Architect, Frontend Developer, QA Engineer, dan AI Coding Agent.

---

## 10.2 Acceptance Scope

Acceptance Criteria mencakup seluruh aspek routing, meliputi.

- Routing Philosophy
- Route Architecture
- Public Route
- Protected Route
- Navigation Mapping
- Breadcrumb Structure
- Route Rules
- Route Dependency

Seluruh aspek tersebut wajib memenuhi standar sebelum implementasi dimulai.

---

## 10.3 Route Architecture Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| ARC-001 | Menggunakan React Router. | ☐ |
| ARC-002 | Menggunakan Layout-Based Routing. | ☐ |
| ARC-003 | Menggunakan Feature-Oriented Routing. | ☐ |
| ARC-004 | Seluruh Route mengarah ke Page. | ☐ |
| ARC-005 | Tidak terdapat Route yang langsung menuju Component. | ☐ |

---

## 10.4 Navigation Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| NAV-001 | Sidebar mengikuti Product Module. | ☐ |
| NAV-002 | Seluruh Navigation memiliki Route. | ☐ |
| NAV-003 | Active Navigation mengikuti Current Route. | ☐ |
| NAV-004 | Navigation sesuai UI-GUIDELINES.md. | ☐ |
| NAV-005 | Tidak terdapat Navigation yang ambigu. | ☐ |

---

## 10.5 Breadcrumb Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| BC-001 | Seluruh Protected Route memiliki Breadcrumb. | ☐ |
| BC-002 | Breadcrumb mengikuti Route. | ☐ |
| BC-003 | Breadcrumb mengikuti Product Module. | ☐ |
| BC-004 | Breadcrumb diperbarui secara otomatis. | ☐ |
| BC-005 | Login Page tidak menggunakan Breadcrumb. | ☐ |

---

## 10.6 Route Rule Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| RR-001 | URL menggunakan kebab-case. | ☐ |
| RR-002 | Parent Route mengikuti Product Module. | ☐ |
| RR-003 | Child Route mengikuti struktur Parent Route. | ☐ |
| RR-004 | Error Route tersedia. | ☐ |
| RR-005 | Redirect mengikuti aturan Routing. | ☐ |

---

## 10.7 Dependency Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| DEP-001 | Dependency mengikuti satu arah. | ☐ |
| DEP-002 | Tidak terdapat Circular Dependency. | ☐ |
| DEP-003 | Route tidak mengakses Business Logic. | ☐ |
| DEP-004 | Route tidak mengakses Service secara langsung. | ☐ |
| DEP-005 | Seluruh dependency mengikuti Route Architecture. | ☐ |

---

## 10.8 Development Readiness Checklist

Sebelum implementasi dimulai, seluruh checklist berikut harus terpenuhi.

| Checklist | Status |
|------------|--------|
| Route Hierarchy telah ditetapkan | ☐ |
| Public Route telah ditentukan | ☐ |
| Protected Route telah ditentukan | ☐ |
| Navigation Mapping selesai | ☐ |
| Breadcrumb Mapping selesai | ☐ |
| Route Rules selesai | ☐ |
| Route Dependency selesai | ☐ |
| Struktur Route sesuai FILE-STRUCTURE.md | ☐ |
| Navigasi sesuai UI-GUIDELINES.md | ☐ |
| Product Module sesuai PRD.md | ☐ |

---

## 10.9 Production Readiness

Routing dinyatakan siap digunakan apabila.

- Seluruh Route mengikuti Product Module.
- Seluruh Navigation mengikuti UI Mockup.
- Breadcrumb bekerja secara konsisten.
- Route mudah dipahami.
- URL mudah dibaca pengguna.
- Route mendukung pengembangan Product Module baru.
- Struktur siap digunakan oleh React Router.
- Struktur siap diimplementasikan oleh AI Coding Agent.

---

## 10.10 Final Acceptance

ROUTING.md dinyatakan **Approved** apabila.

- Seluruh Acceptance Criteria telah terpenuhi.
- Struktur Route konsisten dengan PRD.md.
- Struktur Route mengikuti ENGINEERING-FOUNDATION.md.
- Struktur Route mengikuti IMPLEMENTATION-PLAN.md.
- Struktur Route mengikuti UI-GUIDELINES.md.
- Struktur Route mengikuti COMPONENT-SPEC.md.
- Struktur Route mengikuti FILE-STRUCTURE.md.
- Product Owner menyetujui ROUTING.md sebagai **Routing Baseline** untuk seluruh implementasi Frontend Engineering Document Management System (EDMS) Rebuild.

---

# End of PART 10

ROUTING.md menjadi **Routing Baseline** yang mendefinisikan arsitektur navigasi resmi Engineering Document Management System (EDMS) Rebuild.

Seluruh implementasi React Router, Sidebar Navigation, Breadcrumb, Protected Route, dan Navigation Component wajib mengacu pada dokumen ini agar struktur navigasi aplikasi tetap konsisten, mudah dipelihara, scalable, dan selaras dengan seluruh Source of Truth proyek.

# ==============================================================================

---

# PHASE 2 SOURCE OF TRUTH SYNCHRONIZATION

## Current Implementation

React Router menggunakan `RouterProvider` dengan Public Auth Routes, Protected Routes, dan Project Context Routes.

Route publik resmi:

- `/login`
- `/forgot-password`
- `/check-email`
- `/mock-email/:emailId`
- `/reset-password`

Route protected global:

- `/select-project`
- `/profile`
- `/change-password`
- `/user-management`
- `/project-management`
- `/project-membership`

Route protected project-scoped:

- `/dashboard`
- `/document-register/pfd`
- `/document-register/pid`
- `/transmittal/incoming`
- `/transmittal/outgoing`
- `/sla-monitoring`
- `/escalation-alert`
- `/audit-trail`
- `/storage-nas`
- `/notifications`

Route `/` redirect ke `/dashboard`. Route `/escalation` adalah historical/deprecated route dan diganti oleh `/escalation-alert`. Route `/administration/*` adalah historical/deprecated route untuk runtime saat ini dan diganti oleh route top-level `/user-management`, `/project-management`, dan `/project-membership`.

Navigation resmi mengikuti Sidebar runtime: Dashboard, Document Register PFD/P&ID, Transmittal Incoming/Outgoing, SLA Monitoring, Escalation Alert, Audit Trail, Storage NAS, Notification, dan Administration yang berisi User Management, Project Management, dan Project Membership. Jangan menambah route aktif Role Management atau Permission Management.
