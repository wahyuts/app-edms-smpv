## Documentation Note

Dokumen ini dikembangkan secara iteratif.

Sebagian prinsip dokumentasi (misalnya penamaan Source of Truth) disempurnakan pada fase akhir penyusunan PRD.

Mulai PART 5 — Document Register Module STEP 6 — Business Rule Directory dan seterusnya seluruh referensi mengikuti aturan:

"Source of Truth wajib menunjuk ke PART, STEP, atau dokumen yang benar-benar ada."

Bagian yang disusun sebelum aturan tersebut tetap dipertahankan untuk menjaga stabilitas dokumentasi dan menghindari revisi berantai.

# Table of Contents

## Core Modules

- [PART 1 — Introduction](#part-1--introduction)
- [PART 2 — Product Overview](#part-2--product-overview)
- [PART 3 — Authentication](#part-3--authentication)
- [PART 4 — Dashboard](#part-4--dashboard)
- [PART 5 — Document Register Module](#part-5--document-register-module)
- [PART 6 — SLA Monitoring](#part-6--sla-monitoring)
- [PART 7 — Audit Trail](#part-7--audit-trail)
- [PART 8 — Notification](#part-8--notification)
- [PART 9 — User Management](#part-9--user-management)
- [PART 10 — Role Management](#part-10--role-management)
- [PART 11 — User Profile](#part-11--user-profile)
- [PART 12 — Transmittal](#part-12--transmittal)
- [PART 13 — Escalation Alert](#part-13--escalation-alert)
- [PART 14 — Multi Project Management](#part-14--multi-project-management)
- [PART 15 — Appendix](#part-15--appendix)

---

# Quick Navigation

## Product Foundation

- [Introduction](#part-1--introduction)
- [Product Overview](#part-2--product-overview)

---

## Authentication & Security

- [Authentication](#part-3--authentication)
- [User Management](#part-9--user-management)
- [Role Management](#part-10--role-management)
- [User Profile](#part-11--user-profile)
- [Multi Project Management](#part-14--multi-project-management)

---

## Engineering Document Modules

- [Dashboard](#part-4--dashboard)
- [Document Register](#part-5--document-register)
- [SLA Monitoring](#part-6--sla-monitoring)
- [Audit Trail](#part-7--audit-trail)
- [Notification](#part-8--notification)
- [Escalation Alert](#part-13--escalation-alert)

---

## Future Module

- [Transmittal](#part-12--transmittal)

---

## Project References

- [Appendix](#part-15--appendix)

# ==============================================================================
# PART 1 — Introduction
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Document Level** | Core Design Document |
| **Document Status** | Frozen |
| **Owner** | Product Owner |
| **Purpose** | Menjelaskan tujuan, ruang lingkup, dan posisi PRD sebagai acuan utama pengembangan produk EDMS Rebuild. |
| **Depends On** | BUSINESS-WORKFLOW.md, SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable), FEATURE-MAPPING.md (Historical Reference / Unavailable) |
| **Design Reference** | Approved UI Design Mockup |
| **Related Modules** | Seluruh Product Module EDMS |
| **Used By** | UI-GUIDELINES.md, IMPLEMENTATION-PLAN.md |
| **Primary Audience** | Product Owner, UI/UX Designer, Frontend Developer, Backend Developer |
| **Change Impact** | High |
| **Last Review** | Architecture Review |

---

## 1.1 Purpose

Product Requirements Document (PRD) merupakan dokumen yang menjelaskan bagaimana produk EDMS Rebuild harus bekerja dari sudut pandang pengguna (User Perspective).

Dokumen ini menerjemahkan kebutuhan bisnis menjadi spesifikasi produk yang akan menjadi acuan dalam proses desain antarmuka, implementasi Frontend, implementasi Backend, serta pengujian sistem.

PRD tidak menggantikan BUSINESS-WORKFLOW.md maupun SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable), tetapi melengkapi kedua dokumen tersebut dengan menjelaskan perilaku setiap fitur yang akan digunakan oleh pengguna.

---

## 1.2 Objectives

Tujuan penyusunan PRD adalah:

- Menjelaskan fungsi setiap Product Module.
- Menjelaskan bagaimana pengguna berinteraksi dengan sistem.
- Menentukan perilaku sistem terhadap setiap aksi pengguna.
- Menentukan validasi yang harus dilakukan sistem.
- Menentukan hak akses setiap fitur berdasarkan Role.
- Menjadi acuan utama dalam penyusunan UI-GUIDELINES.md.
- Menjadi acuan utama dalam penyusunan IMPLEMENTATION-PLAN.md.
- Menjadi referensi implementasi bagi tim pengembang.

---

## 1.3 Scope

PRD mencakup seluruh Product Module yang termasuk dalam ruang lingkup Project Rebuild EDMS.

Module yang dibahas meliputi:

- Authentication
- Dashboard
- Document Register
- SLA Monitoring
- Audit Trail
- Notification
- User Management
- Authorization Catalog Reference (Role Management Historical Reference)
- User Profile
- Multi Project Management
- Project Selector
- Project Membership
- Transmittal (Future Ready)

---

## 1.4 Document Position

PRD merupakan bagian dari **Core Design Documents**.

Dokumen ini disusun berdasarkan Foundation Documents (Primary Source of Truth) yang telah melalui proses Review dan Freeze.

Hubungan antar dokumen adalah sebagai berikut.

```text
Foundation Documents
│
├── BUSINESS-WORKFLOW.md
├── SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable)
└── FEATURE-MAPPING.md (Historical Reference / Unavailable)
        │
        ▼
Approved UI Design Mockup
        │
        ▼
PRD.md
        │
        ├── UI-GUIDELINES.md
        └── IMPLEMENTATION-PLAN.md
```

Seluruh isi PRD harus konsisten dengan Foundation Documents.

---

## 1.5 Source Documents

PRD menggunakan dokumen berikut sebagai referensi utama.

### Foundation Documents

- BUSINESS-WORKFLOW.md
- SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable)
- FEATURE-MAPPING.md (Historical Reference / Unavailable)

### Design Reference

- Approved UI Design Mockup

PRD tidak diperbolehkan menambahkan Business Requirement baru yang tidak berasal dari dokumen referensi tersebut.

---

## 1.6 Target Product

Produk yang dibangun adalah Engineering Document Management System (EDMS) berbasis Web.

Versi Rebuild difokuskan pada:

- Penyederhanaan alur kerja pengguna.
- Peningkatan User Experience (UX).
- Konsistensi antarmuka aplikasi.
- Skalabilitas untuk penambahan module engineering di masa depan.
- Kemudahan pemeliharaan dan pengembangan sistem.

---

## 1.7 Product Principles

Penyusunan PRD mengikuti prinsip berikut.

### PP-001

PRD berfokus pada kebutuhan produk dan pengalaman pengguna, bukan implementasi teknis.

---

### PP-002

Seluruh Product Module harus mengikuti Business Workflow yang telah ditetapkan pada BUSINESS-WORKFLOW.md.

---

### PP-003

Seluruh kebutuhan produk harus sesuai dengan SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable).

---

### PP-004

Seluruh tampilan antarmuka harus mengacu pada Approved UI Design Mockup.

---

### PP-005

Setiap Product Module harus memiliki tujuan bisnis, hak akses, validasi, serta perilaku sistem yang jelas.

---

---

### PP-006

EDMS mendukung pengelolaan banyak Project dalam satu aplikasi.

---

### PP-007

Seluruh Product Module yang mengelola data operasional wajib bekerja berdasarkan Active Project.

---

### PP-008

Data dari satu Project tidak boleh ditampilkan, diproses, maupun diubah dari Project lain.

---

### PP-009

User Account bersifat global, sedangkan Official Role operasional dan hak akses Project ditentukan melalui Project Membership.

---

### PP-010

Seluruh Project menggunakan Business Workflow A/B/C, SLA Rules, Escalation Rules, Notification Rules, dan Audit Trail Rules yang sama.

---

## 1.8 Out of Scope

PRD tidak membahas implementasi teknis berikut.

- Backend Architecture
- REST API
- Database Schema
- React Architecture
- Source Code Structure
- State Management
- Technology Stack

Seluruh implementasi teknis akan dijelaskan pada dokumen Technical Design.

---

## 1.9 Expected Outcome

Setelah PRD selesai disusun, setiap Product Module memiliki spesifikasi yang jelas mengenai:

- Tujuan fitur.
- User Interaction.
- Business Rules.
- Validation.
- Permission.
- System Behavior.
- Acceptance Criteria.

PRD menjadi acuan utama dalam penyusunan UI-GUIDELINES.md, IMPLEMENTATION-PLAN.md, serta proses implementasi EDMS Rebuild.

# ==============================================================================
# PART 2 — Product Overview
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Document Level** | Core Design Document |
| **Document Status** | Frozen |
| **Owner** | Product Owner |
| **Purpose** | Menjelaskan gambaran umum EDMS Rebuild, Product Modules, Application Layout Architecture, serta Global UI Strategy yang menjadi acuan implementasi seluruh halaman aplikasi. |
| **Depends On** | BUSINESS-WORKFLOW.md, SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable), FEATURE-MAPPING.md (Historical Reference / Unavailable) |
| **Design Reference** | Approved UI Design Mockup |
| **Related Modules** | Seluruh Product Module |
| **Used By** | UI-GUIDELINES.md, IMPLEMENTATION-PLAN.md |
| **Primary Audience** | Product Owner, UI/UX Designer, Frontend Developer, Backend Developer |
| **Change Impact** | High |
| **Last Review** | Architecture Review |

---

# 2.1 Product Overview

Engineering Document Management System (EDMS) Rebuild merupakan aplikasi berbasis web yang digunakan untuk mengelola dokumen engineering mulai dari proses review, revisi, approval, monitoring SLA, escalation, hingga audit aktivitas pengguna.

EDMS mendukung pengelolaan banyak Project dalam satu aplikasi melalui konsep **Multi Project**.

Setiap Project menggunakan Business Workflow yang sama, tetapi memiliki Document, Workflow, SLA, Escalation, Notification, dan Audit Trail yang terisolasi dari Project lainnya.

Project Rebuild mempertahankan Business Workflow yang telah disetujui dengan meningkatkan kualitas User Experience (UX), konsistensi antarmuka, keamanan pemisahan data antar Project, performa aplikasi, dan kemudahan pengembangan di masa mendatang.

---

# 2.2 Product Goals

EDMS Rebuild dikembangkan untuk:

- Menyederhanakan pengelolaan dokumen engineering.
- Mempercepat proses review dan approval.
- Mempermudah monitoring status dokumen.
- Menyediakan informasi SLA secara real-time.
- Menampilkan Escalation yang membutuhkan perhatian.
- Menyediakan arsitektur aplikasi yang mudah dipelihara dan dikembangkan.
- Mendukung pengelolaan banyak Project dalam satu aplikasi.
- Menjamin isolasi data antar Project.
- Memungkinkan User Account menjadi anggota lebih dari satu Project.
- Memungkinkan Official Role operasional berbeda pada setiap Project.
- Memudahkan pengguna berpindah Project melalui Active Project Selector.

---

# 2.3 Target Users

EDMS digunakan oleh pengguna internal yang telah memiliki User Account aktif.

Hak akses sistem mengikuti kombinasi:

- System-Level Role.
- Project Membership.
- Project-Scoped Official Role.
- Permission.

Role **Admin** bersifat System-Level dan digunakan untuk kebutuhan administrasi aplikasi.

Role **Admin** dapat digunakan sebagai Initial Project Membership untuk Creator Project agar Project baru langsung dapat diakses dan dikelola oleh Admin pembuat Project.

Official Role operasional berikut bersifat Project-Scoped:

- Document Owner
- Team Process
- Team Project

User Account yang sama dapat menjadi anggota lebih dari satu Project dan dapat memiliki Official Role yang berbeda pada setiap Project.

Seluruh akses terhadap data operasional mengikuti Active Project dan Project Membership pengguna.

---

# 2.4 Product Modules

EDMS Rebuild terdiri dari Product Module berikut.

```text
Authentication

Dashboard

Document Register
│
├── PFD
└── P&ID

Transmittal (Future Ready)
│
├── Incoming
└── Outgoing

SLA Monitoring

Escalation Alert

Audit Trail

Storage NAS

Notification

User Management

Department Management

Authorization Catalog Reference
│
└── Permission Reference

Multi Project Management
│
├── Project Management
│
├── Project Selector
│
└── Project Membership

User Profile
```

---

# 2.5 Application Layout Architecture

Seluruh halaman setelah Login menggunakan Application Layout Architecture yang sama.

Application Layout menjaga konsistensi navigasi, pengalaman pengguna, dan struktur antarmuka pada seluruh aplikasi.

Hanya **Main Content Area** yang berubah sesuai Product Module yang sedang dibuka.

---

## Application Layout Blueprint

```text
+-----------------------------+--------------------------------------------------------------------------+
| SIDEBAR HEADER              | TOP NAVIGATION                                                           |
| Company Logo / BIM EDMS     | Active Project | User + Role | Notification Icon                      |
+-----------------------------+--------------------------------------------------------------------------+
|                             |                                                                          |
|                             |                                                                          |
| Sidebar Navigation          |                         Main Content Area                                |
|                             |                                                                          |
|                             |                                                                          |
|                             |                                                                          |
|                             |                                                                          |
+-----------------------------+--------------------------------------------------------------------------+
| SIDEBAR FOOTER              | Footer                                                                   |
| Collapse Menu Button (<<)   |                                                                          |
+-----------------------------+--------------------------------------------------------------------------+
```

Layout di atas mengikuti Approved UI Design Mockup dan perluasan layout berdasarkan CR-004 — Multi Project Support.

---

## Layout Areas

| Area | Description |
|------|-------------|
| Sidebar | Navigasi utama aplikasi. |
| Top Navigation | Navigasi global setelah Login. |
| Main Content Area | Area kerja seluruh Product Module. |
| Footer | Informasi aplikasi. |

---

## Sidebar

Sidebar terdiri dari tiga bagian.

```text
Sidebar

├── Sidebar Header

├── Sidebar Navigation

└── Sidebar Footer
```

---

### Sidebar Header

**Position**

Top Left.

**Components**

- Company Logo
- Company Name / Application Name

Contoh pada mockup:

```text
BIM EDMS
```

Logo dan nama perusahaan bersifat **configurable** sesuai implementasi.

---

### Sidebar Navigation

**Position**

Left Sidebar.

Mengikuti Approved UI Design Mockup.

```text
Dashboard

Document Register
│
├── PFD
└── P&ID

Transmittal
│
├── Incoming
└── Outgoing

SLA Monitoring

Escalation

Audit Trail

Storage NAS

Notification
```

Sidebar bersifat **Role-Based**.

Role lain dapat memiliki menu tambahan sesuai Permission yang dimiliki.

---

### Sidebar Footer

**Position**

Bottom Left.

**Components**

- Collapse Menu Button (<<)

Collapse Menu digunakan untuk memperkecil maupun memperbesar Sidebar.

---

## Top Navigation

**Position**

Top Right.

Top Navigation terdiri dari:

- Active Project Selector
- User Profile dengan Active Role
- Notification Button
- Notification Counter

---

### Active Project Selector

Active Project Selector menampilkan Project yang sedang digunakan oleh pengguna.

Contoh:

```text
Active Project

[ Project Alpha ▼ ]
```

Untuk CR-007, Active Project Selector pada Header menampilkan informasi berikut tanpa perlu membuka dropdown:

```text
ACTIVE PROJECT
Project Alpha ▼
PRJ-ALPHA
```

Active Project Selector menjadi elemen paling menonjol pada Top Navigation.

Selector menampilkan:

- Label `ACTIVE PROJECT`.
- Project Name.
- Project Code.
- Chevron untuk membuka daftar Project.

Pada kondisi tidak ada Active Project, selector menampilkan state yang jelas seperti:

```text
NO ACTIVE PROJECT
No Project Access
```

Project yang tersedia pada Active Project Selector hanya Project yang memenuhi seluruh kondisi berikut:

- Project berstatus Active.
- User Account berstatus Active.
- User memiliki Project Membership Active pada Project tersebut.

Apabila pengguna hanya memiliki satu Project Membership Active, sistem dapat memilih Project tersebut secara otomatis sebagai Active Project.

Apabila pengguna memiliki lebih dari satu Project Membership Active, pengguna dapat memilih Project yang akan digunakan melalui Active Project Selector.

Setelah Login berhasil, apabila pengguna memiliki minimal satu Project Active yang dapat diakses melalui Project Membership Active, sistem menampilkan halaman **Select Active Project** sebelum Dashboard.

Halaman **Select Active Project** menggunakan daftar Project yang sama dengan Active Project Selector dan hanya menampilkan Project yang:

- Project berstatus Active.
- User Account berstatus Active.
- User memiliki Project Membership Active pada Project tersebut.

Project terakhir yang pernah dipilih dapat ditampilkan sebagai default selected Project, tetapi pengguna tetap harus menekan tombol `Continue to Dashboard` sebelum memasuki Workspace EDMS.

Apabila pengguna tidak memiliki Project Active yang dapat diakses, halaman **Select Active Project** tidak ditampilkan dan pengguna masuk ke Dashboard menggunakan behaviour existing. Project-Scoped Page tetap menampilkan `No Project Access`.

Setelah pengguna menekan `Continue to Dashboard`, Dashboard selalu dibuka menggunakan Active Project yang dikonfirmasi tersebut. Header menampilkan Active Project yang sama, dan Role pada Header berasal dari Project Membership pada Project tersebut.

Ketika pengguna memilih Project lain:

- Active Project diperbarui.
- Main Content Area dimuat ulang.
- Dashboard mengikuti Active Project yang baru.
- Document Register mengikuti Active Project yang baru.
- SLA Monitoring mengikuti Active Project yang baru.
- Escalation Alert mengikuti Active Project yang baru.
- Notification mengikuti Active Project yang baru.
- Audit Trail mengikuti Active Project yang baru.
- Search, Filter, Sort, dan Pagination pada Product Module terkait dapat dikembalikan ke kondisi awal.
- Data Project sebelumnya tidak diubah.
- Business Workflow Document tidak berubah.

Active Project Selector hanya menentukan Project Context yang sedang digunakan.

Active Project Selector tidak digunakan untuk:

- Memindahkan Document antar Project.
- Mengubah Project ID pada Document.
- Mengubah Workflow Status.
- Mengubah Revision.
- Mengubah SLA Timer.
- Mengubah Escalation Level.

Apabila Active Project menjadi Inactive atau Project Membership pengguna menjadi Inactive, sistem harus membatalkan Active Project tersebut dan meminta pengguna memilih Project Active lain yang masih dapat diakses.

---

### Notification

Notification Button ditampilkan sebagai icon lonceng pada Top Navigation.

Notification Button menampilkan Notification milik Current User berdasarkan Active Project.

Notification Counter menampilkan jumlah Notification berstatus Unread milik Current User pada Active Project.

Unread Counter ditampilkan sebagai badge pada icon lonceng apabila jumlah unread lebih dari 0.

Perubahan Active Project menyebabkan:

- Notification List dimuat ulang.
- Notification Counter dihitung ulang.
- Read Status Notification pada Project lain tidak berubah.

---

### User Profile

User Profile ditampilkan dalam bentuk Dropdown Menu.

```text
User Profile ▼

├── My Profile

├── Change Password

└── Logout
```

Menu administrasi seperti:

- User Management
- Department Management
- Role Management
- Multi Project Management
- Reset All Demo Data (Developer / Demo Utility, jika feature flag aktif)

tersedia melalui Sidebar berdasarkan Role dan Permission pengguna.

Logout hanya tersedia melalui User Profile Dropdown Menu.

Untuk CR-007, area User pada Header menampilkan:

```text
User Name ▼
Role: Active Role
```

Label tampilan Role pada Top Navigation menggunakan `Role`.

Role yang ditampilkan berasal dari Active Project Membership milik Current User pada Active Project.

Perubahan Active Project menyebabkan Role pada Top Navigation ikut berubah sesuai Project Membership.

Legacy Official Role pada User Account tidak digunakan sebagai sumber tampilan operasional ketika Active Project Membership tersedia.

---

### Top Navigation Behaviour

Top Navigation wajib memenuhi perilaku berikut:

- Active Project Selector selalu menampilkan Active Project saat ini.
- Active Project Selector menampilkan Project Name dan Project Code tanpa perlu membuka dropdown.
- Urutan komponen kanan adalah Active Project Selector, User Profile dengan Role, lalu Notification icon.
- Ketiga komponen tersebut tetap berjajar horizontal pada Desktop.
- Notification hanya menampilkan data milik Current User pada Active Project.
- User Profile menampilkan informasi Current User dan Role aktif.
- Perubahan Active Project tidak mengakhiri User Session.
- Perubahan Active Project tidak mengubah User Account.
- Perubahan Active Project tidak mengubah Project Membership.
- Seluruh komponen Top Navigation mengikuti Permission pengguna.
- Project yang tidak dapat diakses tidak boleh ditampilkan pada Active Project Selector.

---

### Acceptance Criteria

Top Navigation dinyatakan memenuhi spesifikasi apabila:

- Active Project Selector ditampilkan setelah Login berhasil.
- Active Project Selector menjadi elemen utama Header.
- Label `ACTIVE PROJECT` tampil pada selector.
- Project Name dan Project Code tampil pada selector.
- Active Project Selector hanya menampilkan Project yang dapat diakses pengguna.
- User dapat mengganti Active Project.
- Pergantian Active Project memuat ulang seluruh Project-Scoped Module.
- Data antar Project tidak bercampur.
- User Profile menampilkan nama User dan label `Role`.
- Role mengikuti Active Project Membership.
- Notification ditampilkan sebagai icon lonceng.
- Notification List mengikuti Active Project.
- Notification Counter mengikuti Active Project.
- Setelah Login, User dengan minimal satu Project Active diarahkan ke halaman Select Active Project sebelum Dashboard.
- User harus mengonfirmasi Active Project melalui tombol Continue to Dashboard.
- User tanpa Project Active tetap menggunakan behaviour Dashboard existing dan No Project Access.
- Notification Counter tampil sebagai unread badge pada icon lonceng.
- User Profile Dropdown tetap berfungsi.
- Logout mengakhiri Session dan mengembalikan pengguna ke Login Screen.

---

## Main Content Area

Seluruh Product Module ditampilkan pada area ini.

Perpindahan halaman tidak mengubah Sidebar, Top Navigation maupun Footer.

---

## Footer

Footer hanya berada pada Main Content Area.

Area kiri bawah tetap digunakan oleh Sidebar Footer.

---

# 2.6 Global UI Strategy

Global UI Strategy menjadi standar implementasi seluruh halaman EDMS Rebuild.

---

## UI Priority

Prioritas implementasi UI adalah sebagai berikut.

1. Approved UI Design Mockup
2. System Standard Layout
3. UI-GUIDELINES.md

---

## Visual Source of Truth

Approved UI Design Mockup merupakan **Visual Source of Truth** yang menjadi acuan utama implementasi antarmuka pengguna.

Visual Source of Truth mencakup, namun tidak terbatas pada:

- Application Layout
- Navigation Structure
- Screen Layout
- Component Position
- Typography
- Theme Color
- Iconography
- Spacing
- Visual Hierarchy
- Component Shape
- Visual Consistency

---

## System Standard Layout

Apabila suatu Product Module atau Screen belum memiliki Approved UI Design Mockup, maka implementasi wajib menggunakan **System Standard Layout**.

System Standard Layout wajib:

- Mengikuti Theme Color EDMS.
- Mengikuti Typography EDMS.
- Mengikuti Component Style EDMS.
- Mengikuti Spacing EDMS.
- Mengikuti Icon Style EDMS.
- Mengikuti Application Layout Architecture.
- Mengikuti UI-GUIDELINES.md.

Apabila Approved UI Design Mockup tersedia di kemudian hari, maka desain tersebut secara otomatis menggantikan System Standard Layout tanpa mengubah Business Workflow, Functional Requirements, maupun Business Rules.

---

## Icon Strategy

Seluruh icon pada implementasi UI wajib mengikuti **Approved UI Design Mockup**.

Implementasi menggunakan **icon library resmi yang ditetapkan oleh proyek**.

Icon yang digunakan harus mempertahankan kesamaan bentuk visual, makna, dan fungsi dengan icon yang ditampilkan pada **Approved UI Design Mockup**.

Ketentuan implementasi icon adalah sebagai berikut.

- Seluruh icon yang ditampilkan pada Approved UI Design Mockup wajib diimplementasikan.
- Posisi, fungsi, dan tujuan penggunaan icon harus mengikuti Approved UI Design Mockup.
- Tidak diperbolehkan menghilangkan icon yang telah ditentukan pada mockup.
- Tidak diperbolehkan mengganti icon tanpa adanya Change Request yang telah disetujui.
- Apabila icon yang identik tidak tersedia pada icon library resmi proyek, maka implementasi wajib menggunakan icon yang memiliki bentuk dan fungsi paling mendekati.

---

# 2.7 Design Principles

- Mengutamakan kemudahan penggunaan.
- Menjaga konsistensi UI.
- Mengurangi langkah pengguna.
- Mempertahankan Business Workflow.
- Mengikuti Visual Source of Truth.
- Menggunakan Application Layout Architecture pada seluruh halaman setelah Login.

---

# 2.8 Product Scope

Versi Rebuild mencakup:

- Authentication
- Dashboard
- Document Register
- SLA Monitoring
- Escalation
- Audit Trail
- Storage NAS
- Notification
- User Management
- Role Management
- User Profile
- Multi Project Management
- Project Selector
- Project Membership
- Project Data Isolation

Transmittal disiapkan sebagai **Future Ready Module**.

---

# 2.9 Success Criteria

EDMS Rebuild dinyatakan berhasil apabila:

- Business Workflow berjalan sesuai requirement.
- Seluruh Role mengikuti Permission yang dimiliki.
- UI mengikuti Approved UI Design Mockup.
- Seluruh icon digunakan sesuai mockup.
- Seluruh halaman mengikuti Application Layout Architecture.
- Screen yang belum memiliki mockup menggunakan System Standard Layout.
- Aplikasi siap dikembangkan tanpa mengubah arsitektur utama.
- Pengguna hanya dapat membuka Project tempat pengguna memiliki Project Membership Active.
- Seluruh Product Module operasional mengikuti Active Project.
- Data antar Project tidak bercampur.
- User Account dapat memiliki Official Role berbeda pada Project yang berbeda.
- Perpindahan Active Project tidak mengubah Business Workflow maupun data Project sebelumnya.


# ==============================================================================
# PART 3 — Authentication
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Document Level** | Core Design Document |
| **Document Status** | Frozen |
| **Owner** | Product Owner |
| **Purpose** | Menjelaskan spesifikasi Product Module Authentication, Login Screen, Session Management, User Menu, dan mekanisme akses pengguna menuju Application Layout. |
| **Depends On** | BUSINESS-WORKFLOW.md, SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable), FEATURE-MAPPING.md (Historical Reference / Unavailable), PART 2 – Application Layout Architecture |
| **Design Reference** | System Standard Layout (Refer to PART 2 – Global UI Strategy) |
| **Related Modules** | Dashboard, User Profile, User Management, Role Management |
| **Used By** | UI-GUIDELINES.md, IMPLEMENTATION-PLAN.md |
| **Primary Audience** | Product Owner, UI/UX Designer, Frontend Developer, Backend Developer |
| **Change Impact** | High |
| **Last Review** | Architecture Review |

---

# 3.1 Module Overview

Authentication merupakan Product Module yang bertanggung jawab memverifikasi identitas pengguna sebelum memberikan akses ke EDMS Rebuild.

Module ini mencakup:

- Login Screen
- Authentication Process
- Session Management
- User Menu
- Logout

Setelah proses Authentication berhasil, sistem membangun **Application Layout** sesuai Role dan Permission pengguna, kemudian menampilkan Dashboard sebagai halaman awal.

Authentication juga bertanggung jawab memastikan hanya pengguna yang memiliki Session valid yang dapat mengakses Application Layout.

Authentication menggunakan mekanisme Session yang aman untuk mempertahankan status Authentication pengguna selama sesi penggunaan aplikasi.

Detail implementasi mekanisme Session dijelaskan pada IMPLEMENTATION-PLAN.md.

---

# 3.2 Business Objective

Authentication dikembangkan untuk:

- Memastikan hanya pengguna yang berwenang yang dapat mengakses aplikasi.
- Memverifikasi Username dan Password.
- Menentukan Role dan Permission pengguna.
- Mengelola Session pengguna.
- Menjaga keamanan akses aplikasi.
- Mendukung mekanisme Role-Based Access Control (RBAC).

---

# 3.3 Login Screen Blueprint

Login Screen merupakan **Public Screen** yang ditampilkan sebelum pengguna berhasil Login.

Login Screen **tidak menggunakan Application Layout Architecture** sebagaimana dijelaskan pada PART 2.

Karena Approved UI Design Mockup untuk Login belum tersedia, Login Screen menggunakan **System Standard Layout** sesuai Global UI Strategy.

```text
+----------------------------------------------------------------------------+

                           Company Logo

                           Company Name

              Engineering Document Management System


Username

+--------------------------------------------------------------+

Password

+--------------------------------------------------------------+    👁

                       +--------------------+
                       |       LOGIN        |
                       +--------------------+


Version x.x.x

Copyright © Company Name

+----------------------------------------------------------------------------+
```

> **Design Note**
>
> Login Screen menggunakan **System Standard Layout** sebagaimana dijelaskan pada **PART 2 – Global UI Strategy**.
>
> Seluruh implementasi Login wajib mengikuti Design Language EDMS Rebuild, termasuk Theme Color, Typography, Component Style, Icon Strategy, Spacing, Visual Consistency, dan prinsip desain yang telah ditetapkan pada proyek.
>
> Apabila Approved UI Design Mockup untuk Login tersedia di masa mendatang, maka desain tersebut secara otomatis menggantikan System Standard Layout tanpa mengubah Business Workflow, Functional Requirements, maupun Business Rules.

---

# 3.4 Login Screen Sections

## Login Header

**Position**

Top Center.

**Components**

- Company Logo
- Company Name
- Application Description

Company Branding bersifat **configurable** sesuai identitas perusahaan.

---

## Login Form

**Position**

Center.

**Components**

- Username Field
- Password Field
- Show / Hide Password Icon
- Login Button

---

## Login Footer

**Position**

Bottom Center.

**Components**

- Application Version
- Copyright

---

# 3.5 Authentication Flow

```text
User

↓

Login Screen

↓

Input Username & Password

↓

Authentication

↓

Validate User Account Status

↓

Load System-Level Role

↓

Load User Permission

↓

Load Active Project Membership

↓

Create User Session

↓

Apakah User memiliki Project Membership Active?

├── Ya
│
│   ↓
│
│ Select atau Restore Active Project
│
│   ↓
│
│ Build Application Layout
│
│   ↓
│
│ Display Dashboard berdasarkan Active Project
│
└── Tidak
    ↓
    Display No Project Access State
```

Apabila Authentication gagal, sistem tetap berada pada Login Screen dan menampilkan Validation Message.

Apabila Authentication berhasil tetapi pengguna tidak memiliki Project Membership Active, sistem tidak menampilkan data operasional Project.

System-Level Module tetap dapat diakses berdasarkan Role dan Permission walaupun Active Project belum tersedia.

No Project Access State hanya memblokir Project-Scoped Module.

---

# 3.6 Data Source

| Feature | Data Source |
|----------|-------------|
| Login | User Account |
| System-Level Role | User Management |
| Permission | Role Management |
| Project Access | Project Membership |
| Active Project | Project Management |
| Project-Scoped Official Role | Project Membership |
| User Profile | User Profile |
| Session | Authentication Service |
---

# 3.7 Functional Requirements

### AUTH-F001

Pengguna dapat Login menggunakan Username dan Password.

---

### AUTH-F002

Sistem memvalidasi Username dan Password.

---

### AUTH-F003

Sistem memuat Role dan Permission setelah Authentication berhasil.

---

### AUTH-F004

Sistem membuat Session pengguna.

---

### AUTH-F005

Sistem membangun Application Layout sesuai Role dan Permission pengguna.

---

### AUTH-F006

Dashboard ditampilkan sebagai halaman pertama setelah Login berhasil.

---

### AUTH-F007

Pengguna dapat membuka User Menu melalui Top Navigation.

---

### AUTH-F008

Pengguna dapat membuka halaman My Profile.

---

### AUTH-F009

Pengguna dapat melakukan Reset Password terhadap akun miliknya sendiri.

Forgot Password untuk public recovery menggunakan Username dan Registered Email. Sistem selalu menampilkan generic response setelah request diproses agar tidak mengungkapkan keberadaan Username, kecocokan Email, status Account, atau validitas kombinasi data.

Reset Password public recovery hanya dapat dilakukan melalui Reset Link dengan token yang valid. Token simulation pada Frontend Local Persistence memiliki expiration 15 menit, single-use behaviour, status Invalid / Expired / Used, dan token aktif lama untuk account yang sama dinonaktifkan ketika request valid baru dibuat.

Current implementation masih berupa Frontend Simulation. Development Mock Mailbox hanya tersedia ketika `VITE_ENABLE_MOCK_EMAIL=true`; Email Delivery sungguhan dan secure backend token handling menunggu Backend Integration.

---

### AUTH-F010

Administrator dapat mengakses menu Create User.

---

### AUTH-F011

Pengguna dapat Logout melalui User Menu.

---

### AUTH-F012

Logout mengakhiri Session dan mengembalikan pengguna ke Login Screen.

---

### AUTH-F013

Sistem memuat seluruh Project Membership Active setelah Authentication berhasil.

---

### AUTH-F014

Sistem menentukan daftar Project yang dapat diakses oleh pengguna.

---

### AUTH-F015

Sistem menyediakan Active Project sebelum menampilkan data operasional.

---

### AUTH-F016

Dashboard ditampilkan berdasarkan Active Project.

---

### AUTH-F017

Pengguna yang tidak memiliki Project Membership Active tidak dapat mengakses data operasional Project.

---

### AUTH-F018

Sistem dapat memulihkan Active Project terakhir selama Project dan Project Membership masih berstatus Active.

---

# 3.8 Business Rules

### AUTH-BR001

Seluruh pengguna wajib Login sebelum mengakses Product Module.

---

### AUTH-BR002

Role dan Permission ditentukan setelah Authentication berhasil.

---

### AUTH-BR003

Pengguna yang belum Login tidak dapat mengakses Application Layout.

---

### AUTH-BR004

EDMS tidak menyediakan fitur Self Registration.

Seluruh akun pengguna dibuat oleh Administrator melalui menu **Create User**.

---

### AUTH-BR005

Menu yang ditampilkan mengikuti Role dan Permission pengguna.

---

### AUTH-BR006

Logout hanya dapat dilakukan melalui User Profile Dropdown Menu.

---

### AUTH-BR007

Apabila pengguna masih memiliki Session yang valid, sistem langsung membangun Application Layout tanpa menampilkan Login Screen kembali.

---

### AUTH-BR008

Authentication tidak memberikan akses otomatis terhadap seluruh Project.

---

### AUTH-BR009

Akses Project hanya diberikan melalui Project Membership Active.

---

### AUTH-BR010

User Account yang berstatus Inactive tidak dapat Login.

---

### AUTH-BR011

Project yang berstatus Inactive tidak dapat dipilih sebagai Active Project.

---

### AUTH-BR012

Project Membership yang berstatus Inactive tidak memberikan akses terhadap Project.

---

### AUTH-BR013

Active Project harus tersedia sebelum pengguna mengakses Product Module operasional.

---

# 3.9 Validation Rules

### AUTH-V001

Username wajib diisi.

---

### AUTH-V002

Password wajib diisi.

---

### AUTH-V003

Username dan Password harus sesuai dengan User Account.

---

### AUTH-V004

Password ditampilkan dalam bentuk tersembunyi (Masked Password) dan dapat ditampilkan menggunakan Show / Hide Password Icon.

---

### AUTH-V005

Authentication gagal menampilkan Validation Message tanpa memberikan informasi sensitif mengenai penyebab kegagalan Login.

---

# 3.10 Permissions

| Feature | Permission |
|----------|------------|
| Login | Public |
| Create User | Admin |
| My Profile | Authenticated User |
| Reset Password | Authenticated User |
| Logout | Authenticated User |

Hak akses Product Module lainnya mengikuti Role dan Permission yang dimiliki pengguna.

---

# 3.11 UI Components

## Login Screen

- Company Logo
- Company Name
- Application Description
- Username Field
- Password Field
- Show / Hide Password Icon
- Login Button
- Validation Message
- Application Version

---

### User Menu

User Menu merupakan menu personal yang dapat diakses oleh User Account setelah berhasil Login.

Menu User terdiri dari:

- My Profile
- Change Password
- Logout

Business Rules:

- Create User tidak tersedia pada User Menu.
- Pengelolaan User dilakukan melalui Administration > User Management.
- Change Password hanya mengubah Password milik User Account yang sedang Login.
- Logout mengakhiri Session aktif.

---

# 3.12 Acceptance Criteria

### AUTH-AC001

Pengguna dapat Login menggunakan akun yang valid.

---

### AUTH-AC002

Pengguna tidak dapat Login menggunakan akun yang tidak valid.

---

### AUTH-AC003

Authentication berhasil membangun Application Layout sesuai Role dan Permission pengguna.

---

### AUTH-AC004

Dashboard ditampilkan sebagai halaman pertama setelah Login berhasil.

---

### AUTH-AC005

User Menu mengikuti Role dan Permission pengguna.

---

### AUTH-AC006

Logout mengakhiri Session dan kembali ke Login Screen.

---

### AUTH-AC007

Sistem tidak menyediakan fitur Self Registration.

---

### AUTH-AC008

Login Screen mengikuti System Standard Layout dan Global UI Strategy selama Approved UI Design Mockup belum tersedia.

---

### AUTH-AC009

Authentication berhasil memuat daftar Project yang dapat diakses pengguna.

---

### AUTH-AC010

Dashboard ditampilkan berdasarkan Active Project.

---

### AUTH-AC011

User tanpa Project Membership Active tidak dapat mengakses data Project.

---

### AUTH-AC012

Project Inactive tidak tersedia pada Active Project Selector.

---

### AUTH-AC013

Project Membership Inactive tidak memberikan akses kepada pengguna.

---

# ==============================================================================
# PART 4 — Dashboard
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Document Level** | Core Design Document |
| **Document Status** | Draft |
| **Owner** | Product Owner |
| **Purpose** | Menjelaskan spesifikasi Product Module Dashboard sebagai halaman utama setelah Login yang berfungsi sebagai Monitoring Center dan Operational Workspace untuk proses pengelolaan dokumen engineering. |
| **Depends On** | BUSINESS-WORKFLOW.md, SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable), FEATURE-MAPPING.md (Historical Reference / Unavailable), PART 2 – Application Layout Architecture, PART 3 – Authentication |
| **Design Reference** | Approved UI Design Mockup |
| **Related Modules** | Document Register, SLA Monitoring, Escalation, Notification, Audit Trail, User Profile |
| **Used By** | UI-GUIDELINES.md, IMPLEMENTATION-PLAN.md |
| **Primary Audience** | Product Owner, UI/UX Designer, Frontend Developer, Backend Developer |
| **Change Impact** | Very High |
| **Last Review** | Architecture Review |

---

# 4.1 Module Overview

Dashboard merupakan halaman pertama yang ditampilkan setelah proses Authentication berhasil.

Dashboard berfungsi sebagai **Monitoring Center** sekaligus **Operational Workspace** bagi pengguna selama menjalankan aktivitas pengelolaan dokumen engineering.

Berbeda dengan Dashboard pada aplikasi pelaporan pada umumnya yang hanya menampilkan informasi, Dashboard EDMS Rebuild memungkinkan pengguna untuk langsung melakukan aktivitas operasional terhadap dokumen tanpa harus berpindah ke Product Module lain.

Dashboard mengintegrasikan informasi penting mengenai kondisi Project, status dokumen, SLA, Escalation, serta menyediakan akses cepat terhadap proses Review dan Approval yang sedang berjalan.

Dashboard selalu bekerja dalam satu **Active Project** sehingga seluruh informasi yang ditampilkan hanya berasal dari Project yang sedang dipilih oleh pengguna.

Dashboard terdiri atas tiga area utama.

---

## Project Context

Dashboard selalu bekerja berdasarkan **Active Project**.

Seluruh informasi Dashboard wajib dibatasi berdasarkan Active Project, meliputi:

- Summary Area.
- Document Register Panel.
- SLA Overview.
- Escalation Alert.
- Workflow Action.
- Current Assignee.
- Dashboard Refresh.

Dashboard tidak boleh menampilkan data dari Project lain.

Ketika Active Project berubah, seluruh Dashboard Data Source dimuat ulang menggunakan Project yang baru dipilih tanpa mengubah data Project sebelumnya.

---

## Page Header

Page Header berada pada bagian paling atas **Main Content Area**.

Page Header berfungsi menampilkan identitas halaman yang sedang dibuka beserta deskripsi singkat mengenai fungsi halaman tersebut.

Page Header terdiri dari tiga komponen.

- Module Category
- Page Title
- Page Description

Contoh pada halaman Dashboard.

```text
APP ENGINEERING

Dashboard

Monitoring utama seluruh dokumen engineering berdasarkan alur review Code A/B/C.
dalam bahasa inggris kalimatnya menjadi:
Primary monitoring of all engineering documents based on the Code A/B/C review workflow.
```

Page Header bersifat **dinamis**.

Page Title dan Page Description akan berubah mengikuti Product Module yang sedang dibuka, sedangkan Module Category tetap mengikuti identitas aplikasi atau perusahaan.

---

## Summary Area

Summary Area berada tepat di bawah Page Header.

Area ini digunakan untuk memberikan ringkasan kondisi dokumen engineering secara **real-time**.

Summary Area terdiri dari enam Summary Card yang ditampilkan secara horizontal sesuai Approved UI Design Mockup.

Summary Card terdiri dari:

- Total Documents
- Process Review
- Process Comment
- Project Review
- Project Comment
- Approved / Final As-Built

Seluruh Summary Card hanya menampilkan informasi ringkasan dan tidak melakukan perubahan terhadap data bisnis.

---

## Operational Workspace

Operational Workspace merupakan area kerja utama Dashboard.

Area ini memungkinkan pengguna melakukan aktivitas operasional secara langsung terhadap dokumen engineering tanpa harus berpindah halaman.

Operational Workspace terdiri dari satu panel utama yaitu **Document Register Panel**.

Document Register Panel menjadi **Entry Point** bagi pengguna untuk menjalankan Business Workflow.

Melalui Document Register Panel, pengguna dapat melakukan aktivitas seperti:

- View Document
- Download Document
- View Document Comment
- Approval (A)
- Approval With Comment (B)
- Not Approved (C)
- View Document History

Seluruh aksi pada Operational Workspace mengikuti Business Workflow yang telah ditetapkan pada BUSINESS-WORKFLOW.md.

Dashboard bertindak sebagai **Entry Point** terhadap Business Process, sedangkan seluruh perubahan Status Document, Revision Document, SLA Timer, Current Assignee, Notification, maupun proses bisnis lainnya tetap mengikuti Business Rules yang telah ditetapkan pada BUSINESS-WORKFLOW.md.

Dashboard tidak membuat Business Logic baru.

---

## Right Information Panel

Right Information Panel berada pada sisi kanan Dashboard.

Panel ini ditampilkan secara vertikal dan selalu berada di samping Operational Workspace.

Right Information Panel terdiri dari dua widget.

---

### Right Information Panel Collapse

Dashboard menyediakan satu tombol Collapse yang mengontrol seluruh Right Information Panel.

Right Information Panel terdiri dari:

- SLA Overview
- Escalation Alert

Business Rules:

- Tombol Collapse berada pada bagian atas Panel.
- Collapse berlaku untuk seluruh Panel, bukan masing-masing Card.
- Saat Panel di-collapse, Document Register Table otomatis menggunakan ruang kosong yang tersedia.
- Layout Dashboard harus menggunakan lebar adaptif sehingga tetap nyaman pada berbagai resolusi layar.

---

### SLA Overview

Menampilkan ringkasan kondisi SLA dokumen.

Informasi yang ditampilkan meliputi:

- On Track
- At Risk
- Overdue
- Final As-Built

Widget ini bersifat **read-only**.

---

### Escalation Alert

Menampilkan ringkasan escalation yang sedang terjadi.

Informasi yang ditampilkan meliputi:

- Total Escalation
- Level 1
- Level 2
- Level 3
- Level 4

Widget ini bersifat **read-only**.

---

# 4.2 Business Objective

Dashboard dikembangkan untuk mencapai tujuan berikut.

- Menampilkan kondisi proyek secara real-time kepada pengguna.
- Menampilkan ringkasan status dokumen melalui Summary Area.
- Menyediakan informasi SLA yang mudah dipantau.
- Menampilkan Escalation yang memerlukan perhatian segera.
- Menyediakan akses cepat terhadap dokumen yang sedang diproses.
- Memungkinkan pengguna melakukan proses review dan approval langsung dari Dashboard.
- Mengurangi perpindahan halaman selama proses kerja.
- Mempercepat penyelesaian Business Workflow.
- Menjadikan Dashboard sebagai halaman kerja utama setelah Login.

Dashboard tidak bertujuan menggantikan Product Module lain.

Dashboard hanya menyediakan representasi operasional yang paling sering digunakan oleh pengguna, sedangkan pengelolaan dokumen secara lengkap tetap dilakukan melalui Product Module yang bersangkutan seperti Document Register, SLA Monitoring, maupun Product Module lainnya.

# 4.3 Screen Layout Blueprint

Dashboard menggunakan **Application Layout Architecture** sebagaimana dijelaskan pada **PART 2**.

Blueprint berikut menggambarkan susunan visual Dashboard berdasarkan **Approved UI Design Mockup**.

Sidebar, Top Navigation, dan Footer mengikuti standar global pada PART 2.

Blueprint ini hanya menjelaskan susunan komponen Dashboard tanpa membahas Business Logic.

Note: kata kata Refer PART 2 dibawah ini itu arti detailnya adalah mengacu ke :
**Section 2.5 — Application Layout Architecture**

**Subsection: Application Layout Blueprint**

```text
+-----------------------------------------------------------------------------------------------------------------------------+
| SIDEBAR (Refer PART 2)          | TOP NAVIGATION (Refer PART 2)                                                            |
|                                 |                                                🔔 Notification      User Profile ▼      |
+---------------------------------+-------------------------------------------------------------------------------------------+
|                                 | BIM ENGINEERING                                                                          |
|                                 | Dashboard                                                                                 |
|                                 | Monitoring utama seluruh dokumen engineering berdasarkan alur review Code A/B/C.       |
|                                 |-------------------------------------------------------------------------------------------|
|                                 |                                                                                           |
|                                 | +------------+ +------------+ +------------+ +------------+ +------------+ +------------+|
|                                 | |   Total    | |  Process   | |  Process   | |  Project   | |  Project   | | Approved / ||
|                                 | | Documents  | |   Review   | |  Comment   | |   Review   | |  Comment   | | Final A/B  ||
|                                 | |            | |            | |            | |            | |            | |            ||
|                                 | +------------+ +------------+ +------------+ +------------+ +------------+ +------------+|
|                                 |                                                                 +-----------------------+ |
|                                 | +-----------------------------------------------------------+   |     SLA Overview      | |
|                                 | | Document Register Panel                                   |   |-----------------------| |
|                                 | |-----------------------------------------------------------|   | On Track              | |
|                                 | | Search | Filter | Sort | Page Size                        |   | At Risk               | |
|                                 | |-----------------------------------------------------------|   | Overdue               | |
|                                 | |                                                           |   | Final As-Built        | |
|                                 | |             Document Register Table                       |   +-----------------------+ |
|                                 | |                                                           |                           |
|                                 | |                                                           |   +-----------------------+ |
|                                 | |                                                           |   |   Escalation Alert   | |
|                                 | |                                                           |   |-----------------------| |
|                                 | |                                                           |   | Total Escalation     | |
|                                 | |                                                           |   | Level 1              | |
|                                 | |                                                           |   | Level 2              | |
|                                 | |                                                           |   | Level 3              | |
|                                 | |-----------------------------------------------------------|   | Level 4              | |
|                                 | | Pagination                                                |   | View All             | |
|                                 | +-----------------------------------------------------------+   +-----------------------+ |
|                                 |                                                                                           |
+---------------------------------+-------------------------------------------------------------------------------------------+
| Sidebar Footer                  | Footer                                                                                    |
| Collapse Menu                   | Copyright © Company                                                                       |
+-----------------------------------------------------------------------------------------------------------------------------+
```

---

## Layout Legend

| Area | Description |
|------|-------------|
| A | Page Header |
| B | Summary Area |
| C | Document Register Panel |
| D | Right Information Panel |
| E | Footer |

---

# 4.4 Screen Sections

Dashboard dibagi menjadi lima section utama.

---

## A. Page Header

### Position

Bagian paling atas Main Content.

### Purpose

Menampilkan identitas halaman yang sedang dibuka beserta penjelasan singkat mengenai fungsi halaman tersebut.

### Components

- Module Category
- Page Title
- Page Description

Contoh pada halaman Dashboard.

```text
BIM ENGINEERING

Dashboard

Monitoring utama seluruh dokumen engineering berdasarkan alur review Code A/B/C.
dalam bahasa inggris kalimatnya menjadi:
Primary monitoring of all engineering documents based on the Code A/B/C review workflow.
```

Page Header bersifat **dinamis**.

- **Module Category** mengikuti identitas aplikasi atau perusahaan.
- **Page Title** berubah mengikuti Product Module yang sedang dibuka.
- **Page Description** menjelaskan tujuan halaman tersebut.

---

## B. Summary Area

### Position

Tepat di bawah Page Header.

### Purpose

Menampilkan ringkasan kondisi dokumen engineering secara cepat.

### Components

Summary Area terdiri dari enam Summary Card yang ditampilkan secara horizontal sesuai Approved UI Design Mockup.

Urutan card wajib mengikuti mockup.

1. Total Documents
2. Process Review
3. Process Comment
4. Project Review
5. Project Comment
6. Approved / Final As-Built

Summary Area hanya menampilkan informasi ringkasan dan tidak melakukan perubahan terhadap data bisnis.

---

## C. Document Register Panel

### Position

Di bawah Summary Area.

Panel ini merupakan area terbesar pada Dashboard.

### Purpose

Menjadi Operational Workspace utama pengguna untuk menjalankan aktivitas Business Workflow.

### Components

Document Register Panel terdiri dari:

- Panel Header
- Search
- Filter
- Sort
- Page Size
- Document Register Table
- Pagination

Seluruh aktivitas operasional dilakukan melalui panel ini.

Detail spesifikasi setiap kolom, toolbar, tombol aksi, serta interaksi pengguna dijelaskan pada **STEP 5 – Functional Requirements**.

---

## D. Right Information Panel

### Position

Berada di sisi kanan Document Register Panel.

Panel ditampilkan secara vertikal dan tidak menutupi Footer.

### Purpose

Menyediakan informasi pendukung yang dapat dipantau pengguna selama menjalankan aktivitas pada Dashboard.

Right Information Panel terdiri dari dua widget.

### SLA Overview

Menampilkan ringkasan kondisi SLA dokumen.

Informasi yang ditampilkan meliputi:

- On Track
- At Risk
- Overdue
- Final As-Built

Widget bersifat **read-only**.

---

### Escalation Alert

Menampilkan ringkasan escalation yang sedang terjadi.

Informasi yang ditampilkan meliputi:

- Total Escalation
- Level 1
- Level 2
- Level 3
- Level 4

Widget bersifat **read-only**.

---

## E. Footer

### Position

Bagian paling bawah Main Content.

Footer hanya berada pada Main Content Area.

Sidebar tetap menutupi sisi kiri Footer sesuai Application Layout Architecture pada PART 2.


# 4.5 Dashboard Interaction Flow

Dashboard merupakan halaman kerja utama setelah pengguna berhasil Login.

Seluruh interaksi pengguna pada Dashboard dibagi menjadi empat kategori utama.

1. Navigation Flow
2. Read Flow
3. Operational Flow
4. Workflow Flow

Business Logic yang terjadi setelah suatu aksi dijalankan mengikuti BUSINESS-WORKFLOW.md.

Dashboard hanya bertindak sebagai Entry Point terhadap Business Process.

---

# 4.5.1 Navigation Flow

Navigation Flow merupakan aktivitas pengguna untuk menemukan dokumen yang ingin dikerjakan.

Flow ini tidak mengubah data bisnis maupun Workflow Status.

---

## Search Document

```text
Dashboard
      │
      ▼
Search Box
      │
      ▼
Input Keyword
      │
      ▼
Search
      │
      ▼
Document Register Table diperbarui
```

Pengguna dapat mencari dokumen menggunakan keyword sesuai ketentuan sistem.

---

## Filter Document

```text
Dashboard
      │
      ▼
Filter
      │
      ▼
Pilih Filter
      │
      ▼
Apply Filter
      │
      ▼
Document Register Table diperbarui
```

Pengguna dapat memfilter daftar dokumen berdasarkan filter yang tersedia.

Contoh:

- Status
- Area
- Discipline
- Drawing Type

Daftar filter mengikuti Functional Requirement pada STEP 5.

---

## Sort Document

```text
Dashboard
      │
      ▼
Sort By
      │
      ▼
Pilih Field
      │
      ▼
Ascending / Descending
      │
      ▼
Document Register Table diperbarui
```

Pengguna dapat mengurutkan data sesuai field yang dipilih.

---

## Change Page Size

```text
Dashboard
      │
      ▼
Page Size
      │
      ▼
Pilih Jumlah Data
      │
      ▼
Document Register Table diperbarui
```

---

## Pagination

```text
Dashboard
      │
      ▼
Pagination
      │
      ▼
Pilih Halaman
      │
      ▼
Document Register Table diperbarui
```

---

# 4.5.2 Read Flow

Read Flow merupakan aktivitas pengguna untuk melihat informasi tanpa mengubah data bisnis.

---

## View Document

```text
Dashboard
      │
      ▼
Klik View
      │
      ▼
Preview Document
      │
      ▼
Close Preview
```

Flow ini bersifat read-only.

---

## Download Document

```text
Dashboard
      │
      ▼
Klik Download
      │
      ▼
Download File
```

Flow ini tidak mengubah data.

---

## View Comment

```text
Dashboard
      │
      ▼
Klik Comment
      │
      ▼
Comment Viewer
      │
      ▼
Close
```

Flow ini bersifat read-only.

---

## View History

History hanya tersedia sesuai ketentuan BUSINESS-WORKFLOW.md.

```text
Dashboard
      │
      ▼
Klik History
      │
      ▼
History Viewer
      │
      ▼
Close
```

Flow ini tidak mengubah data.

---

# 4.5.3 Operational Flow

Operational Flow merupakan aktivitas pengguna untuk memilih dokumen yang akan diproses.

Flow ini belum mengubah Workflow.

---

## Select Document

```text
Dashboard
      │
      ▼
Document Register Table
      │
      ▼
Pilih Dokumen
      │
      ▼
Document Selected
```

Setelah dokumen dipilih, pengguna dapat menjalankan aksi sesuai Permission dan Workflow Status.

---

# 4.5.4 Workflow Flow

Workflow Flow merupakan aktivitas pengguna yang dapat memicu perubahan Business Workflow.

Seluruh perubahan Status Document, Revision Document, SLA Timer, Current Assignee, Notification, maupun Timeline mengikuti BUSINESS-WORKFLOW.md.

Dashboard tidak mendefinisikan Business Logic tersebut.

---

## Approval (A)

```text
Dashboard
      │
      ▼
Klik A
      │
      ▼
Konfirmasi
      │
      ▼
BUSINESS-WORKFLOW.md
      │
      ▼
Dashboard Refresh
```

---

## Approval With Comment (B)

```text
Dashboard
      │
      ▼
Klik B
      │
      ▼
Input Comment
      │
      ▼
Submit
      │
      ▼
BUSINESS-WORKFLOW.md
      │
      ▼
Dashboard Refresh
```

---

## Not Approved (C)

```text
Dashboard
      │
      ▼
Klik C
      │
      ▼
(Optional Comment)
      │
      ▼
Submit
      │
      ▼
BUSINESS-WORKFLOW.md
      │
      ▼
Dashboard Refresh
```

---

# Dashboard Refresh

Setelah suatu Workflow berhasil dijalankan, Dashboard memperbarui informasi yang ditampilkan.

Komponen yang dapat diperbarui meliputi:

- Summary Area
- Document Register Panel
- SLA Overview
- Escalation Alert

Mekanisme pembaruan data dijelaskan pada IMPLEMENTATION-PLAN.md.

Dashboard tidak menentukan bagaimana proses refresh diimplementasikan.

# 4.6 Data Source

Dashboard tidak menyimpan data bisnis secara mandiri.

Seluruh informasi yang ditampilkan pada Dashboard berasal dari Product Module maupun Business Process lain yang telah didefinisikan pada BUSINESS-WORKFLOW.md.

Dashboard bertindak sebagai **Presentation Layer** yang menggabungkan berbagai sumber data menjadi satu halaman kerja terpadu.

Dokumen ini hanya menjelaskan **Business Data Source**.

Implementasi API, Service Layer, Mock JSON, maupun mekanisme pengambilan data dijelaskan pada IMPLEMENTATION-PLAN.md dan FRONTEND-DATA-STRATEGY.md.

---

# 4.6.1 Summary Area

Summary Area menampilkan ringkasan kondisi dokumen engineering.

Data diperoleh melalui proses agregasi seluruh Document berdasarkan Workflow Status saat ini.

| Summary Card | Business Data Source |
|---------------|----------------------|
| Total Documents | Document |
| Process Review | Document |
| Process Comment | Document |
| Project Review | Document |
| Project Comment | Document |
| Approved / Final As-Built | Document |

Summary Area hanya menampilkan informasi ringkasan.

Summary Area tidak melakukan perubahan terhadap data bisnis.

---

# 4.6.2 Document Register Panel

Document Register Panel menggunakan Document sebagai sumber data utama.

Data yang ditampilkan meliputi:

- Document Number
- Description
- Drawing
- Area
- Current Revision
- Workflow Status
- SLA Timer
- Current Assignee
- Available Actions

Data yang ditampilkan mengikuti Permission pengguna yang sedang Login.

Detail struktur tabel dijelaskan pada STEP 5.

---

# 4.6.3 SLA Overview

Widget SLA Overview menggunakan informasi SLA setiap Document.

Informasi yang ditampilkan meliputi:

- On Track
- At Risk
- Overdue
- Final As-Built

Perhitungan SLA mengikuti BUSINESS-WORKFLOW.md.

Dashboard hanya menampilkan hasil perhitungan tersebut.

---

# 4.6.4 Escalation Alert

Escalation Alert menggunakan data Escalation yang dihasilkan dari kondisi SLA.

Informasi yang ditampilkan meliputi:

- Total Escalation
- Level 1
- Level 2
- Level 3
- Level 4

Dashboard tidak menentukan aturan Escalation.

Seluruh aturan mengikuti BUSINESS-WORKFLOW.md.

---

# 4.6.5 View Document

Preview Document menggunakan Current Revision dari Document yang dipilih.

Dashboard hanya membuka file dalam mode Read Only.

Dashboard tidak mengubah file maupun metadata Document.

---

# 4.6.6 Download Document

Download menggunakan Current Revision dari Document yang dipilih.

Dashboard tidak mengubah data bisnis.

---

# 4.6.7 Comment Viewer

Comment Viewer menggunakan Comment History yang berkaitan dengan Document yang dipilih.

Comment Viewer menampilkan nama User dan Official Role yang tersimpan pada Workflow Comment.

Dashboard hanya menampilkan informasi Comment.

Dashboard tidak melakukan perubahan terhadap Comment melalui halaman Dashboard.

---

# 4.6.8 History Viewer

History Viewer menggunakan Workflow History dari Document yang dipilih.

History dapat menampilkan informasi seperti:

- Upload Document
- Upload Revision
- Approval
- Workflow Status
- Revision History
- Comment History
- Timeline Activity

Seluruh informasi mengikuti BUSINESS-WORKFLOW.md.

Dashboard hanya menampilkan History.

---

# 4.6.9 Dashboard Refresh

Dashboard memperbarui data setelah suatu Business Process berhasil dijalankan.

Komponen yang diperbarui meliputi:

- Summary Area
- Document Register Panel
- SLA Overview
- Escalation Alert

Dashboard tidak menentukan mekanisme sinkronisasi data.

Implementasi Refresh dijelaskan pada IMPLEMENTATION-PLAN.md.

---

# 4.6.10 Dashboard Data Mapping

Dashboard Data Mapping menjelaskan hubungan antara komponen Dashboard dengan sumber data bisnis yang digunakan.

| Dashboard Component | Business Data Source | Read / Write | Description |
|---------------------|----------------------|--------------|-------------|
| Summary Area | Document | Read | Menampilkan ringkasan jumlah dokumen berdasarkan Workflow Status. |
| Document Register Panel | Document | Read | Menampilkan daftar dokumen sesuai hak akses pengguna. |
| SLA Overview | SLA | Read | Menampilkan kondisi SLA setiap Document. |
| Escalation Alert | Escalation | Read | Menampilkan escalation berdasarkan kondisi SLA. |
| View Document | Current Document File | Read | Menampilkan file Current Revision dalam mode Preview. |
| Download Document | Current Document File | Read | Mengunduh Current Revision dari Document. |
| Comment Viewer | Comment History | Read | Menampilkan seluruh Comment yang berkaitan dengan Document. |
| History Viewer | Workflow History | Read | Menampilkan Timeline dan riwayat Workflow Document. |

---

## Data Mapping Rules

Dashboard tidak menjadi pemilik data bisnis.

Seluruh data berasal dari Product Module atau Business Process yang telah ditetapkan pada BUSINESS-WORKFLOW.md.

Dashboard hanya bertugas:

- Menampilkan informasi.
- Menggabungkan data dari beberapa Business Domain.
- Menjadi Entry Point bagi pengguna untuk menjalankan Business Workflow.

Dashboard tidak melakukan manipulasi data secara langsung.

Seluruh perubahan data mengikuti Business Rules yang dijelaskan pada BUSINESS-WORKFLOW.md.

# ==============================================================================
# 4.7 Functional Requirements
# PART A — Page Header
# ==============================================================================

## 4.7.1 Overview

Page Header merupakan bagian pertama yang ditampilkan pada setiap Product Module di dalam aplikasi EDMS.

Page Header berfungsi memberikan identitas halaman yang sedang dibuka sehingga pengguna selalu mengetahui konteks pekerjaan yang sedang dilakukan.

Page Header merupakan komponen standar yang digunakan secara konsisten pada seluruh Product Module.

---

## 4.7.2 Purpose

Page Header dikembangkan untuk:

- Menampilkan identitas halaman yang sedang dibuka.
- Menjelaskan tujuan utama halaman kepada pengguna.
- Memberikan konsistensi tampilan antar Product Module.
- Membantu pengguna memahami konteks pekerjaan tanpa harus membaca isi halaman terlebih dahulu.

Page Header tidak memiliki Business Logic.

---

## 4.7.3 Layout

Page Header berada pada bagian paling atas Main Content Area.

Urutan komponen wajib mengikuti standar berikut.

```text
Module Category

↓

Page Title

↓

Page Description
```

Posisi dan tata letak mengikuti Approved UI Design Mockup.

---

## 4.7.4 Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-PH-001 | Sistem harus menampilkan Module Category pada bagian paling atas Page Header. |
| FR-PH-002 | Sistem harus menampilkan Page Title sesuai Product Module yang sedang dibuka. |
| FR-PH-003 | Sistem harus menampilkan Page Description yang menjelaskan fungsi halaman. |
| FR-PH-004 | Page Header harus diperbarui secara otomatis ketika pengguna berpindah halaman. |
| FR-PH-005 | Page Header harus menggunakan struktur yang sama pada seluruh Product Module. |
| FR-PH-006 | Posisi Page Header harus mengikuti Approved UI Design Mockup. |
| FR-PH-007 | Seluruh icon yang digunakan pada Page Header harus mengikuti standar Icon System proyek dan memiliki bentuk yang paling identik dengan Approved UI Design Mockup. |

---

## 4.7.5 Module Category

Module Category menampilkan identitas aplikasi atau perusahaan.

Contoh.

```text
BIM ENGINEERING
```

Module Category bersifat tetap dan digunakan pada seluruh Product Module.

---

## 4.7.6 Page Title

Page Title menampilkan nama halaman yang sedang dibuka.

Contoh.

Dashboard

Document Register

Transmittal

SLA Monitoring

Audit Trail

Notification

Storage NAS

Page Title harus berubah secara otomatis mengikuti halaman yang sedang dibuka.

---

## 4.7.7 Page Description

Page Description menjelaskan tujuan utama halaman.

Contoh pada Dashboard.

```text
Monitoring utama seluruh dokumen engineering berdasarkan alur review Code A/B/C.
dalam bahasa inggris kalimatnya menjadi:
Primary monitoring of all engineering documents based on the Code A/B/C review workflow.
```

Setiap Product Module wajib memiliki Page Description yang berbeda sesuai fungsi bisnisnya.

---

## 4.7.8 Display Rules

- Module Category selalu ditampilkan.
- Page Title selalu ditampilkan.
- Page Description selalu ditampilkan.
- Ketiga komponen harus ditampilkan dalam urutan yang sama pada seluruh Product Module.
- Informasi harus menggunakan bahasa yang konsisten sesuai standar aplikasi.

---

## 4.7.9 Permissions

Page Header dapat dilihat oleh seluruh pengguna yang memiliki akses ke Product Module tersebut.

Tidak terdapat pembatasan Role khusus.

---

## 4.7.10 UI Components

Page Header terdiri dari komponen berikut.

- Module Category Label
- Page Title
- Page Description

Seluruh komponen mengikuti UI-GUIDELINES.md.

---

## 4.7.11 Acceptance Criteria

Page Header dinyatakan memenuhi spesifikasi apabila:

- Module Category ditampilkan dengan benar.
- Page Title berubah sesuai Product Module yang sedang dibuka.
- Page Description sesuai dengan fungsi halaman.
- Urutan komponen mengikuti standar Page Header.
- Layout sesuai Approved UI Design Mockup.
- Perpindahan halaman memperbarui Page Header secara otomatis.

# ==============================================================================
# 4.7 Functional Requirements
# PART B — Summary Area
# ==============================================================================

## 4.7.12 Overview

Summary Area merupakan area informasi utama pada Dashboard yang menampilkan ringkasan kondisi seluruh dokumen engineering berdasarkan Workflow Status saat ini.

Summary Area memungkinkan pengguna memahami kondisi proyek secara cepat tanpa harus membaca seluruh isi Document Register.

Summary Area berfungsi sebagai **visual summary** sekaligus shortcut filter tampilan Document Register Panel.

Summary Area tidak melakukan perubahan terhadap data bisnis.

---

## 4.7.13 Purpose

Summary Area dikembangkan untuk:

- Menampilkan ringkasan kondisi dokumen engineering.
- Memberikan gambaran cepat mengenai distribusi Workflow Status.
- Membantu pengguna menentukan prioritas pekerjaan.
- Mengurangi kebutuhan membuka Document Register hanya untuk melihat jumlah dokumen.
- Memungkinkan pengguna memfilter Document Register Panel berdasarkan Workflow Status melalui Summary Card.

Summary Area bersifat **Read Only terhadap data bisnis** dan hanya dapat mengubah filter tampilan Document Register Panel.

---

## 4.7.14 Layout

Summary Area berada tepat di bawah Page Header.

Summary Area terdiri dari **enam Summary Card** yang ditampilkan secara horizontal.

Urutan card wajib mengikuti Approved UI Design Mockup.

```text
+-----------+ +-----------+ +-----------+ +-----------+ +-----------+ +----------------------+
| Total Doc | | Process   | | Process   | | Project   | | Project   | | Approved / Final A/B |
|           | | Review    | | Comment   | | Review    | | Comment   | |                      |
+-----------+ +-----------+ +-----------+ +-----------+ +-----------+ +----------------------+
```

Posisi, ukuran, urutan, serta proporsi setiap Summary Card harus mengikuti Approved UI Design Mockup.

---

## 4.7.15 Summary Cards

Summary Area terdiri dari enam Summary Card.

### Card 1 — Total Documents

Menampilkan jumlah seluruh Document yang dapat diakses oleh pengguna.

---

### Card 2 — Process Review

Menampilkan jumlah Document dengan Workflow Status **Process Review**.

---

### Card 3 - Process Comment / Reject

Menampilkan jumlah Document dengan Workflow Status **Process Comment** dan **Process Reject**. Bagian bawah Card menampilkan rincian **Comment : X** dan **Reject : Y** dengan typography lebih kecil.

---

### Card 4 — Project Review

Menampilkan jumlah Document dengan Workflow Status **Project Review**.

---

### Card 5 - Project Comment / Reject

Menampilkan jumlah Document dengan Workflow Status **Project Comment** dan **Project Reject**. Bagian bawah Card menampilkan rincian **Comment : X** dan **Reject : Y** dengan typography lebih kecil.

---

### Card 6 — Approved / Final As-Built

Menampilkan jumlah Document dengan Workflow Status **Approved**.

---

## 4.7.16 Business Definition

| Summary Card | Business Definition |
|--------------|---------------------|
| Total Documents | Seluruh Document yang dapat diakses oleh pengguna. |
| Process Review | Document dengan Workflow Status = Process Review. |
| Process Comment / Reject | Document dengan Workflow Status = Process Comment atau Process Reject. |
| Project Review | Document dengan Workflow Status = Project Review. |
| Project Comment / Reject | Document dengan Workflow Status = Project Comment atau Project Reject. |
| Approved / Final As-Built | Document dengan Workflow Status = Approved. |

Business Definition menjadi acuan utama dalam proses agregasi data.

---

## 4.7.17 Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-SA-001 | Sistem harus menampilkan enam Summary Card sesuai Approved UI Design Mockup. |
| FR-SA-002 | Urutan Summary Card harus mengikuti spesifikasi PRD. |
| FR-SA-003 | Nilai setiap Summary Card harus dihitung berdasarkan Business Definition. |
| FR-SA-004 | Data yang ditampilkan harus mengikuti Permission pengguna yang sedang Login. |
| FR-SA-005 | Summary Area harus diperbarui setelah Dashboard Refresh. |
| FR-SA-006 | Summary Area hanya bersifat Read Only terhadap data bisnis dan dapat digunakan sebagai Status Filter Document Register Panel. |
| FR-SA-007 | Layout Summary Area harus mengikuti Approved UI Design Mockup. |
| FR-SA-008 | Setiap Summary Card harus memiliki Card Description sesuai Business Definition. |
| FR-SA-009 | Klik Summary Card harus menyinkronkan Filter Status pada Document Register Panel. |
| FR-SA-010 | Klik Total Documents harus menghapus Filter Status dan menampilkan seluruh Document pada Active Project. |

---

## 4.7.18 Display Rules

- Keenam Summary Card harus selalu ditampilkan.
- Urutan Summary Card tidak boleh diubah.
- Nilai setiap Summary Card harus menampilkan angka agregasi terbaru.
- Apabila tidak terdapat data, sistem menampilkan nilai **0**.
- Seluruh Summary Card menggunakan desain visual yang konsisten.
- Card Description harus selalu ditampilkan pada setiap Summary Card.
- Active Summary Card harus memiliki state visual yang jelas ketika digunakan sebagai filter.

---

## 4.7.19 Interaction Rules

Summary Area merupakan **Informational Component** yang dapat digunakan sebagai shortcut filter tampilan.

Pengguna tidak dapat melakukan perubahan data bisnis melalui Summary Area.

Seluruh Summary Card dapat dipilih untuk menerapkan Workflow Status Filter pada Document Register Panel dalam Active Project yang sama.

Mapping Summary Card terhadap Filter Status:

| Summary Card | Filter Status |
|--------------|---------------|
| Total Documents | All Status |
| Process Review | Process Review |
| Process Comment / Reject | Process Comment OR Process Reject |
| Project Review | Project Review |
| Project Comment / Reject | Project Comment OR Project Reject |
| Approved / Final As-Built | Approved |

Ketika Summary Card dipilih:

- Filter Status pada Document Register Panel harus ikut berubah.
- Document Register Panel harus dimuat ulang berdasarkan Active Project yang sedang aktif.
- Pagination kembali ke halaman pertama.
- Search, filter lain, sort, dan page size tetap dapat digunakan bersama selama masih valid.
- Hanya satu Summary Card yang aktif pada satu waktu.

Ketika Filter Status pada Document Register Panel diubah secara manual, active state Summary Card harus mengikuti Filter Status yang sedang berlaku.

Jika Filter Status adalah All Status, Summary Card Total Documents menjadi aktif atau kembali ke default state sesuai pola UI Dashboard.

---

## 4.7.20 Permissions

Seluruh pengguna yang memiliki akses ke Dashboard dapat melihat Summary Area.

Jumlah Document yang ditampilkan mengikuti Role dan Permission pengguna.

---

## 4.7.21 UI Components

### A. Visual Components

Visual Components membentuk tampilan fisik setiap Summary Card.

- Summary Card Container
- Card Background
- Card Icon

Seluruh icon wajib mengikuti **Icon System** proyek.

Icon yang dipilih harus memiliki bentuk dan fungsi yang paling identik dengan **Approved UI Design Mockup**.

---

### B. Content Components

Content Components menampilkan informasi bisnis kepada pengguna.

Setiap Summary Card terdiri dari:

- Total Value
- Card Title
- Card Description

**Card Title** merupakan nama Summary Card.

Contoh:

- Total Documents
- Process Review
- Process Comment
- Project Review
- Project Comment
- Approved / Final As-Built

**Card Description** merupakan penjelasan singkat mengenai arti bisnis dari Summary Card.

Contoh:

| Card Title | Card Description |
|------------|------------------|
| Total Documents | All engineering documents |
| Process Review | Documents under process review |
| Process Comment | Waiting for process comments |
| Project Review | Documents under project review |
| Project Comment | Waiting for project comments |
| Approved / Final As-Built | Approved engineering documents |

Card Description harus konsisten dengan Business Definition yang telah ditetapkan.

---

## 4.7.22 Acceptance Criteria

Summary Area dinyatakan memenuhi spesifikasi apabila:

- Keenam Summary Card ditampilkan sesuai Approved UI Design Mockup.
- Urutan Summary Card sesuai spesifikasi.
- Nilai setiap Summary Card sesuai Business Definition.
- Card Title sesuai dengan Workflow Status yang direpresentasikan.
- Card Description sesuai Business Definition.
- Nilai mengikuti Permission pengguna.
- Dashboard Refresh memperbarui seluruh Summary Card.
- Layout mengikuti Approved UI Design Mockup.
- Icon mengikuti Icon System proyek.

# ==============================================================================
# 4.7 Functional Requirements
# PART C.1 — Document Register Panel
# ==============================================================================

## 4.7.23 Overview

Document Register Panel merupakan komponen utama pada Dashboard yang berfungsi sebagai **Operational Workspace** bagi pengguna.

Melalui Document Register Panel, pengguna dapat mencari, memfilter, melihat, dan menjalankan proses bisnis terhadap dokumen engineering sesuai hak akses yang dimiliki.

Document Register Panel menjadi titik utama interaksi antara pengguna dengan Business Workflow yang telah didefinisikan pada BUSINESS-WORKFLOW.md.

---

## 4.7.24 Purpose

Document Register Panel dikembangkan untuk:

- Menampilkan daftar dokumen engineering.
- Menjadi area kerja utama pengguna.
- Menyediakan akses cepat terhadap dokumen.
- Menyediakan akses terhadap proses review.
- Menyediakan akses terhadap Approval.
- Menyediakan akses terhadap Document History.
- Mengurangi perpindahan halaman selama proses kerja.

Document Register Panel tidak mendefinisikan Business Workflow.

Seluruh perubahan data mengikuti BUSINESS-WORKFLOW.md.

---

## 4.7.25 Layout

Document Register Panel berada pada bagian tengah Dashboard.

Panel berada tepat di bawah Summary Area dan di sebelah kiri Right Information Panel.

Panel menempati area kerja terbesar pada Dashboard.

Layout panel mengikuti Approved UI Design Mockup.

```text
+--------------------------------------------------------------------------------------+
| Document Register Panel                                                              |
|--------------------------------------------------------------------------------------|
| Panel Header                                                                         |
|--------------------------------------------------------------------------------------|
| Toolbar                                                                              |
|--------------------------------------------------------------------------------------|
|                                                                                      |
|                      Document Register Table                                          |
|                                                                                      |
|--------------------------------------------------------------------------------------|
| Pagination                                                                           |
+--------------------------------------------------------------------------------------+
```

Seluruh isi panel mengikuti struktur di atas.

---

## 4.7.26 Panel Structure

Document Register Panel terdiri dari lima bagian utama.

```text
Document Register Panel
│
├── Panel Header
│
├── Toolbar
│
├── Document Register Table
│
└── Pagination
```

Setiap bagian memiliki spesifikasi tersendiri pada PART berikutnya.

---

## 4.7.27 Business Definition

Document Register Panel merupakan representasi seluruh Document yang dapat diakses oleh pengguna sesuai Role dan Permission.

Panel tidak menyimpan data.

Panel hanya menampilkan dan menyediakan akses terhadap Business Process.

Seluruh perubahan Status Document, Revision, SLA Timer, Current Assignee, Notification, maupun Workflow mengikuti BUSINESS-WORKFLOW.md.

---

## 4.7.28 Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-DRP-001 | Sistem harus menampilkan Document Register Panel pada Dashboard. |
| FR-DRP-002 | Panel harus menjadi area kerja utama pengguna. |
| FR-DRP-003 | Panel harus menampilkan Document Register sesuai hak akses pengguna. |
| FR-DRP-004 | Panel harus mengikuti struktur Panel Header, Toolbar, Table, dan Pagination. |
| FR-DRP-005 | Panel harus diperbarui setelah Dashboard Refresh. |
| FR-DRP-006 | Panel tidak boleh menyimpan Business Logic. |
| FR-DRP-007 | Seluruh aksi yang tersedia pada panel harus mengikuti BUSINESS-WORKFLOW.md. |
| FR-DRP-008 | Layout panel harus mengikuti Approved UI Design Mockup. |

---

## 4.7.29 Display Rules

- Document Register Panel selalu ditampilkan pada Dashboard.
- Panel harus berada di bawah Summary Area.
- Panel harus berada di sebelah kiri Right Information Panel.
- Panel harus menjadi area dengan ukuran terbesar pada Dashboard.
- Struktur panel harus konsisten pada seluruh ukuran Desktop yang didukung.

---

## 4.7.30 Interaction Rules

Document Register Panel menjadi pusat seluruh interaksi pengguna terhadap Document.

Aktivitas yang dilakukan melalui panel meliputi:

- Mencari Document.
- Memfilter Document.
- Mengurutkan Document.
- Mengubah jumlah data per halaman.
- Berpindah halaman.
- Melihat Document.
- Mengunduh Document.
- Melihat Comment.
- Menjalankan Approval.
- Melihat History.

Setiap aktivitas memiliki spesifikasi Functional Requirement masing-masing.

---

## 4.7.31 Permissions

Document Register Panel hanya menampilkan Document yang dapat diakses oleh pengguna berdasarkan Role dan Permission.

Hak akses terhadap setiap Action Button mengikuti Access Control yang telah ditentukan pada BUSINESS-WORKFLOW.md dan ACCESS-CONTROL.md.

---

## 4.7.32 UI Components

### A. Visual Components

- Document Register Panel Container
- Panel Border
- Panel Background
- Panel Shadow
- Panel Divider

---

### B. Content Components

- Panel Header
- Toolbar
- Document Register Table
- Pagination

---

### C. Interactive Components

- Search Field
- Filter Control
- Sort Control
- Page Size Selector
- Pagination Control
- Table Row
- Action Buttons

Seluruh icon wajib mengikuti **Icon System** proyek.

Icon yang dipilih harus memiliki bentuk dan fungsi yang paling identik dengan **Approved UI Design Mockup**.

---

## 4.7.33 Acceptance Criteria

Document Register Panel dinyatakan memenuhi spesifikasi apabila:

- Panel ditampilkan sesuai Approved UI Design Mockup.
- Struktur panel terdiri dari Panel Header, Toolbar, Table, dan Pagination.
- Panel menjadi area kerja utama Dashboard.
- Seluruh data mengikuti Permission pengguna.
- Dashboard Refresh memperbarui isi panel.
- Panel tidak mengimplementasikan Business Logic secara mandiri.
- Seluruh Action mengikuti BUSINESS-WORKFLOW.md.

# ==============================================================================
# 4.7 Functional Requirements
# PART C.2 — Panel Header
# ==============================================================================

## 4.7.34 Overview

Panel Header merupakan bagian paling atas dari **Document Register Panel**.

Panel Header berfungsi menampilkan identitas area kerja yang sedang digunakan oleh pengguna.

Pada tampilan antarmuka (UI), Panel Header menampilkan **Display Title** sesuai dengan Approved UI Design Mockup.

Panel Header tidak memiliki Business Logic dan tidak melakukan manipulasi data.

---

## 4.7.35 Purpose

Panel Header dikembangkan untuk:

- Menampilkan identitas area kerja.
- Memberikan konteks kepada pengguna mengenai isi panel.
- Menjaga konsistensi tampilan seluruh Product Module.
- Memisahkan identitas panel dengan Toolbar yang berada di bawahnya.

---

## 4.7.36 Layout

Panel Header berada pada bagian paling atas **Document Register Panel**.

Layout mengikuti Approved UI Design Mockup.

```text
+--------------------------------------------------------------------------------------+
| Document Register Table                                                              |
+--------------------------------------------------------------------------------------+
| Toolbar                                                                             |
+--------------------------------------------------------------------------------------+
```

Panel Header selalu berada tepat di atas Toolbar.

Panel Header dipisahkan menggunakan Divider sesuai desain mockup.

---

## 4.7.37 Business Definition

Panel Header bukan merupakan sumber data bisnis.

Panel Header hanya berfungsi sebagai identitas visual dari area kerja yang sedang digunakan.

Perubahan Workflow, Status Document, SLA, maupun Business Process tidak mempengaruhi isi Panel Header.

---

## 4.7.38 Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-PHDR-001 | Sistem harus menampilkan Panel Header pada bagian paling atas Document Register Panel. |
| FR-PHDR-002 | Panel Header harus menampilkan Display Title **"Document Register Table"** sesuai Approved UI Design Mockup. |
| FR-PHDR-003 | Display Title harus selalu ditampilkan. |
| FR-PHDR-004 | Panel Header harus berada tepat di atas Toolbar. |
| FR-PHDR-005 | Layout Panel Header harus mengikuti Approved UI Design Mockup. |
| FR-PHDR-006 | Panel Header tidak boleh digunakan untuk menjalankan Business Workflow. |
| FR-PHDR-007 | Panel Header tidak boleh digunakan untuk menampilkan informasi dinamis selain Display Title. |

---

## 4.7.39 Display Rules

- Display Title selalu ditampilkan.
- Display Title menggunakan teks:

```text
Document Register Table
```

- Display Title berada pada sisi kiri Panel Header.
- Panel Header menggunakan satu baris (single row).
- Panel Header berada tepat di atas Toolbar.
- Tampilan mengikuti Approved UI Design Mockup.

---

## 4.7.40 Interaction Rules

Panel Header tidak memiliki interaksi.

Pengguna tidak dapat melakukan aksi apa pun melalui Panel Header.

Seluruh interaksi pengguna dimulai dari Toolbar yang berada tepat di bawah Panel Header.

Apabila pada masa mendatang diperlukan penambahan tombol seperti:

- Create Document
- Export
- Import
- Refresh

maka perubahan tersebut harus melalui **Change Request** dan berada di luar ruang lingkup PRD versi ini.

---

## 4.7.41 Permissions

Seluruh pengguna yang memiliki akses ke Dashboard dapat melihat Panel Header.

Tidak terdapat pembatasan Role terhadap Panel Header.

---

## 4.7.42 UI Components

### A. Visual Components

- Panel Header Container
- Panel Background
- Bottom Divider

---

### B. Content Components

- Display Title

Nilai Display Title pada Dashboard adalah:

```text
Document Register Table
```

Display Title mengikuti nama area kerja yang ditampilkan kepada pengguna.

---

### C. Interactive Components

Tidak terdapat Interactive Component pada Panel Header.

---

## 4.7.43 Acceptance Criteria

Panel Header dinyatakan memenuhi spesifikasi apabila:

- Ditampilkan pada bagian paling atas Document Register Panel.
- Menampilkan Display Title **"Document Register Table"**.
- Berada tepat di atas Toolbar.
- Tidak memiliki Business Logic.
- Tidak memiliki fungsi manipulasi data.
- Layout sesuai Approved UI Design Mockup.

---

## Notes

Untuk menghindari ambiguitas antara dokumentasi dan implementasi:

- **Component Name** yang digunakan pada dokumentasi dan implementasi tetap **Document Register Panel**.
- **Display Title** yang ditampilkan kepada pengguna adalah **"Document Register Table"** sesuai Approved UI Design Mockup.

Dengan demikian:

- **Component Name** digunakan sebagai identitas arsitektur aplikasi dan implementasi React.
- **Display Title** digunakan sebagai teks yang tampil pada antarmuka pengguna.

# ==============================================================================
# 4.7 Functional Requirements
# PART C.3 — Document Register Table
# ==============================================================================

## 4.7.44 Overview

Document Register Table merupakan komponen utama pada Dashboard yang menampilkan daftar seluruh dokumen engineering sesuai hak akses pengguna.

Table menjadi media utama bagi pengguna untuk:

- Melihat informasi dokumen.
- Memantau Workflow Status.
- Memantau SLA.
- Menjalankan Business Workflow melalui Action Button.

Document Register Table tidak menyimpan data.

Seluruh data berasal dari Business Data Source sebagaimana dijelaskan pada **4.6 Data Source**.

---

## 4.7.45 Purpose

Document Register Table dikembangkan untuk:

- Menampilkan daftar Document.
- Menampilkan kondisi Workflow setiap Document.
- Menampilkan Current Revision.
- Menampilkan SLA Timer.
- Menjadi titik awal seluruh Business Process.

Document Register Table merupakan komponen utama dari Document Register Panel.

---

## 4.7.46 Layout

Document Register Table berada di bawah Toolbar.

Layout mengikuti Approved UI Design Mockup.

```text
+-------------------------------------------------------------------------------------------------------------+
| No | Document Number | Description | Drawing | Area | Revision | Status | SLA Timer | Actions |
+-------------------------------------------------------------------------------------------------------------+
| .. | ............... | ........... | ....... | .... | .........| .......| ..........| ........|
| .. | ............... | ........... | ....... | .... | .........| .......| ..........| ........|
| .. | ............... | ........... | ....... | .... | .........| .......| ..........| ........|
+-------------------------------------------------------------------------------------------------------------+
```

Urutan kolom wajib mengikuti Approved UI Design Mockup.

---

## 4.7.47 Business Definition

Document Register Table menampilkan seluruh Document yang dapat diakses oleh pengguna.

Setiap baris (row) mewakili **satu Document**.

Table tidak menampilkan Revision sebagai baris terpisah.

Current Revision yang aktif ditampilkan pada kolom **Revision**.

Seluruh perubahan Workflow mengikuti BUSINESS-WORKFLOW.md.

---

## 4.7.48 Table Structure

Document Register Table terdiri dari:

- Table Header
- Table Body
- Table Row
- Table Cell

Setiap Table Row merepresentasikan satu Document.

---

## 4.7.49 Column Specification

| Column | Business Data | Business Definition | Display Rule | Sortable | Searchable |
|----------|---------------|--------------------|--------------|----------|------------|
| No | Row Number | Nomor urut data pada halaman aktif. | Integer berurutan mulai dari 1. | No | No |
| Document Number | Document | Nomor Document Engineering yang unik dalam scope Project. | Text. | Yes | Yes |
| Description | Document | Deskripsi singkat Document. | Text. | Yes | Yes |
| Drawing | Document | Jenis atau nama Drawing. | Text. | Yes | Yes |
| Area | Document | Area kerja Document. | Text. | Yes | Yes |
| Revision | Document | Current Revision yang sedang aktif. | Text. | Yes | Yes |
| Status | Workflow | Workflow Status saat ini. | Status Badge. | Yes | Yes |
| SLA Timer | SLA | Waktu berjalan SLA beserta Current Assignee. | Format **3d 2h 15m**. | Yes | No |
| Actions | Workflow | Aksi yang tersedia sesuai Permission dan Workflow Status. | Action Button. | No | No |

---

## 4.7.50 Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-DRT-001 | Sistem harus menampilkan seluruh kolom sesuai Approved UI Design Mockup. |
| FR-DRT-002 | Urutan kolom tidak boleh diubah. |
| FR-DRT-003 | Setiap baris harus merepresentasikan satu Document. |
| FR-DRT-004 | Data pada setiap kolom harus mengikuti Business Definition. |
| FR-DRT-005 | Kolom Status harus menggunakan Status Badge. |
| FR-DRT-006 | Kolom SLA Timer harus menggunakan format **Xd Xh Xm**. |
| FR-DRT-007 | Kolom Actions harus menampilkan Action Button sesuai Permission dan Workflow Status. |
| FR-DRT-008 | Table harus diperbarui setelah Dashboard Refresh. |

---

## 4.7.51 Display Rules

- Urutan kolom mengikuti Approved UI Design Mockup.
- Seluruh header kolom selalu ditampilkan.
- Status menggunakan Badge.
- SLA Timer menggunakan format:

```text
3d 2h 15m
```

- Current Assignee selalu ditampilkan di dalam kolom SLA Timer.
- Nilai kosong ditampilkan menggunakan placeholder sesuai UI Guidelines.
- Layout tabel mengikuti Approved UI Design Mockup.

---

## 4.7.52 Row Behaviour

Setiap Table Row merepresentasikan satu Document.

Pemilihan satu Row tidak mengubah Business Workflow.

Row hanya menjadi konteks bagi Action Button yang dipilih pengguna.

---

## 4.7.53 Cell Display Rules

Setiap jenis data memiliki aturan tampilan yang berbeda.

| Column | Display Type |
|----------|--------------|
| No | Integer |
| Document Number | Text |
| Description | Text |
| Drawing | Text |
| Area | Text |
| Revision | Text |
| Status | Badge |
| SLA Timer | Timer Text |
| Actions | Action Buttons |

---

## 4.7.54 Interaction Rules

Document Register Table hanya menampilkan informasi.

Seluruh perubahan Business Workflow dilakukan melalui Action Button.

Pemilihan Row tidak mengubah Status Document.

---

## 4.7.55 Permissions

Data yang ditampilkan mengikuti Role dan Permission pengguna.

Kolom dapat ditampilkan kepada seluruh pengguna yang memiliki akses ke Dashboard.

Isi kolom **Actions** mengikuti Permission pengguna dan Workflow Status Document.

---

## 4.7.56 UI Components

### A. Visual Components

- Table Container
- Table Header
- Table Body
- Table Row
- Table Cell
- Status Badge

---

### B. Content Components

- Table Header Text
- Cell Value
- SLA Timer Text
- Current Assignee
- Action Buttons

---

### C. Interactive Components

- Table Row
- Action Buttons

Spesifikasi Action Button dijelaskan pada **PART C.4**.

---

## 4.7.57 Acceptance Criteria

Document Register Table dinyatakan memenuhi spesifikasi apabila:

- Struktur tabel mengikuti Approved UI Design Mockup.
- Urutan kolom sesuai spesifikasi.
- Seluruh kolom menampilkan data sesuai Business Definition.
- Status menggunakan Badge.
- SLA Timer menggunakan format **Xd Xh Xm**.
- Setiap Row merepresentasikan satu Document.
- Dashboard Refresh memperbarui isi tabel.
- Action Button mengikuti Permission dan BUSINESS-WORKFLOW.md.

# ==============================================================================
# 4.7 Functional Requirements
# PART C.4 — Action Buttons
# ==============================================================================

## 4.7.58 Overview

Action Buttons merupakan kumpulan tombol aksi yang tersedia pada kolom **Actions** di setiap baris Document Register Table.

Action Buttons memungkinkan pengguna berinteraksi terhadap Document sesuai **Workflow Status**, **Role**, dan **Permission**.

Action Buttons hanya menjadi media interaksi (UI Entry Point).

Seluruh perubahan Business Workflow mengikuti BUSINESS-WORKFLOW.md.

---

## 4.7.59 Purpose

Action Buttons dikembangkan untuk:

- Memberikan akses cepat terhadap fungsi utama Document.
- Mengurangi perpindahan halaman.
- Menjalankan Business Workflow langsung dari Dashboard.
- Memberikan pengalaman kerja yang efisien.
- Menyediakan antarmuka kerja yang konsisten pada seluruh Document.

---

## 4.7.60 Layout

Action Buttons berada pada kolom paling kanan Document Register Table.

Layout mengikuti Approved UI Design Mockup.

### Kondisi 1 — Workflow Masih Berjalan

```text
👁   ⬇   💬

 A   B   C
```

### Kondisi 2 — Workflow Selesai

```text
👁   ⬇   💬

 History
```

Read Actions selalu berada pada baris pertama.

Workflow Actions selalu berada pada baris kedua.

---

## 4.7.61 Business Definition

Action Buttons merupakan titik masuk pengguna menuju Business Workflow.

Dashboard tidak menentukan hasil Business Process.

Dashboard hanya meneruskan aksi pengguna ke Business Process yang telah didefinisikan pada BUSINESS-WORKFLOW.md.

---

## 4.7.62 Action Groups

### A. Read Actions

Read Actions hanya digunakan untuk melihat informasi.

Tidak mengubah Business Data.

Terdiri dari:

- View
- Download
- Comment

---

### B. Workflow Actions

Workflow Actions dapat memicu perubahan Business Workflow.

Terdiri dari:

- Approval (A)
- Approval With Comment (B)
- Not Approved (C)
- History

---

## 4.7.63 Action Definition

| Action Code | Display | Category | Description |
|-------------|----------|----------|-------------|
| ACT-VIEW | View | Read Action | Membuka Preview Document. |
| ACT-DOWNLOAD | Download | Read Action | Mengunduh Current Revision. |
| ACT-COMMENT | Comment | Read Action | Menampilkan Comment Viewer. |
| ACT-APPROVE | A | Workflow Action | Menjalankan Approval sesuai BUSINESS-WORKFLOW.md. |
| ACT-APPROVE-COMMENT | B | Workflow Action | Menjalankan Approval With Comment sesuai BUSINESS-WORKFLOW.md. |
| ACT-NOT-APPROVED | C | Workflow Action | Menjalankan Not Approved sesuai BUSINESS-WORKFLOW.md. |
| ACT-HISTORY | History | Workflow Action | Menampilkan Workflow History. |

Action Code digunakan sebagai referensi standar pada:

- ACCESS-CONTROL.md
- FEATURE-MAPPING.md (Historical Reference / Unavailable)
- API-CONTRACT.md
- Frontend Permission Guard
- Unit Test
- Dokumentasi Implementasi

---

## 4.7.64 Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-ACT-001 | Sistem harus menampilkan Read Actions pada setiap Document yang dapat diakses pengguna. |
| FR-ACT-002 | Read Actions terdiri dari View, Download, dan Comment. |
| FR-ACT-003 | Workflow Actions harus mengikuti Workflow Status Document. |
| FR-ACT-004 | Workflow Actions harus mengikuti Permission pengguna. |
| FR-ACT-005 | Tombol A, B, dan C hanya ditampilkan apabila Document masih berada pada tahap Review sesuai BUSINESS-WORKFLOW.md. |
| FR-ACT-006 | Tombol History hanya ditampilkan apabila Document telah mencapai kondisi sesuai BUSINESS-WORKFLOW.md. |
| FR-ACT-007 | Dashboard tidak boleh menampilkan Workflow Action yang tidak dimiliki pengguna berdasarkan Permission. |
| FR-ACT-008 | Seluruh icon mengikuti Icon System proyek. |
| FR-ACT-009 | Icon yang digunakan harus memiliki bentuk dan fungsi yang paling identik dengan Approved UI Design Mockup. |

---

## 4.7.65 Action Availability

Ketersediaan Action Button ditentukan oleh tiga parameter:

- Workflow Status Document.
- Role pengguna.
- Permission pengguna.

| Workflow Status | Read Actions | Workflow Actions | Permission Reference |
|-----------------|-------------|------------------|----------------------|
| Process Review | ACT-VIEW, ACT-DOWNLOAD, ACT-COMMENT | ACT-APPROVE, ACT-APPROVE-COMMENT, ACT-NOT-APPROVED | ACCESS-CONTROL.md |
| Project Review | ACT-VIEW, ACT-DOWNLOAD, ACT-COMMENT | ACT-APPROVE, ACT-APPROVE-COMMENT, ACT-NOT-APPROVED | ACCESS-CONTROL.md |
| Approved / Final As-Built | ACT-VIEW, ACT-DOWNLOAD, ACT-COMMENT | ACT-HISTORY | ACCESS-CONTROL.md |

Workflow Status lainnya mengikuti BUSINESS-WORKFLOW.md.

Permission setiap Action mengikuti ACCESS-CONTROL.md.

---

## 4.7.66 Display Rules

- Read Actions selalu berada pada baris pertama.
- Workflow Actions selalu berada pada baris kedua.
- Read Actions ditampilkan dengan Icon.
- Workflow Actions ditampilkan dengan Button.
- Action Button yang tidak dimiliki pengguna tidak boleh ditampilkan.
- Urutan Action Button tidak boleh diubah.

Urutan Read Actions:

```text
View → Download → Comment
```

Urutan Workflow Actions:

```text
A → B → C
```

atau

```text
History
```

Layout mengikuti Approved UI Design Mockup.

---

## 4.7.67 Interaction Rules

### ACT-VIEW

- Membuka Preview Document.
- Tidak mengubah Business Data.

---

### ACT-DOWNLOAD

- Mengunduh Current Revision.
- Tidak mengubah Business Data.

---

### ACT-COMMENT

- Membuka Comment Viewer.
- Tidak mengubah Business Data.

---

### ACT-APPROVE

- Mengirim aksi Approval ke BUSINESS-WORKFLOW.md.
- Dashboard tidak menentukan hasil Approval.

---

### ACT-APPROVE-COMMENT

- Mengirim aksi Approval With Comment ke BUSINESS-WORKFLOW.md.
- Dashboard tidak menentukan hasil Approval.

---

### ACT-NOT-APPROVED

- Mengirim aksi Not Approved ke BUSINESS-WORKFLOW.md.
- Dashboard tidak menentukan hasil Not Approved.

---

### ACT-HISTORY

- Membuka Workflow History.
- Tidak mengubah Business Data.

---

## 4.7.68 Permissions

Action Button ditentukan berdasarkan tiga parameter:

- Workflow Status.
- Role.
- Permission.

Dashboard tidak menentukan hak akses.

Seluruh Permission mengikuti ACCESS-CONTROL.md.

---

## 4.7.69 UI Components

### A. Visual Components

- Action Container
- Read Action Icons
- Workflow Action Buttons
- History Button

---

### B. Content Components

- Tooltip
- Button Label
- History Label

Tooltip wajib menjelaskan fungsi setiap Action Button secara singkat.

---

### C. Interactive Components

- ACT-VIEW
- ACT-DOWNLOAD
- ACT-COMMENT
- ACT-APPROVE
- ACT-APPROVE-COMMENT
- ACT-NOT-APPROVED
- ACT-HISTORY

Seluruh icon wajib mengikuti **Icon System** proyek.

Icon yang dipilih harus memiliki bentuk dan fungsi yang paling identik dengan **Approved UI Design Mockup**.

---

## 4.7.70 Acceptance Criteria

Action Buttons dinyatakan memenuhi spesifikasi apabila:

- Read Actions ditampilkan sesuai Permission pengguna.
- Workflow Actions ditampilkan sesuai Workflow Status dan Permission.
- Tombol History menggantikan A/B/C sesuai BUSINESS-WORKFLOW.md.
- Dashboard tidak menampilkan Action Button yang tidak dimiliki pengguna.
- Tooltip ditampilkan pada setiap Action Button.
- Icon mengikuti Icon System proyek.
- Layout mengikuti Approved UI Design Mockup.
- Seluruh aksi mengikuti BUSINESS-WORKFLOW.md.

# ==============================================================================
# 4.7 Functional Requirements
# PART C.5 — Pagination
# ==============================================================================

## 4.7.71 Overview

Pagination merupakan komponen navigasi yang berada pada bagian paling bawah Document Register Panel.

Pagination memungkinkan pengguna berpindah halaman ketika jumlah Document melebihi kapasitas tampilan dalam satu halaman.

Pagination tidak mengubah Business Data maupun Business Workflow.

Pagination hanya mengubah data yang ditampilkan pada Document Register Table.

---

## 4.7.72 Purpose

Pagination dikembangkan untuk:

- Membagi daftar Document menjadi beberapa halaman.
- Mempermudah navigasi data dalam jumlah besar.
- Menjaga performa tampilan Dashboard.
- Memberikan pengalaman navigasi yang konsisten.

Pagination bersifat **Navigation Component**.

---

## 4.7.73 Layout

Pagination berada pada bagian paling bawah Document Register Panel.

Layout mengikuti Approved UI Design Mockup.

```text
+--------------------------------------------------------------------------------------+
|                                                                                      |
| Previous         1     2     3     ...     Next                                      |
|                                                                                      |
+--------------------------------------------------------------------------------------+
```

Pagination selalu berada di bawah Document Register Table.

---

## 4.7.74 Business Definition

Pagination tidak mempengaruhi Business Workflow.

Pagination hanya mengubah halaman data yang sedang ditampilkan kepada pengguna.

Seluruh data tetap berasal dari Business Data Source yang sama.

---

## 4.7.75 Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-PAG-001 | Sistem harus menampilkan Pagination apabila jumlah Document melebihi kapasitas satu halaman. |
| FR-PAG-002 | Sistem harus menampilkan nomor halaman secara berurutan. |
| FR-PAG-003 | Sistem harus menyediakan tombol Previous dan Next. |
| FR-PAG-004 | Halaman aktif harus memiliki indikator visual yang berbeda. |
| FR-PAG-005 | Berpindah halaman harus mempertahankan kondisi Search, Filter, Sort, dan Page Size yang sedang aktif. |
| FR-PAG-006 | Pagination tidak boleh mengubah Business Workflow maupun Business Data. |
| FR-PAG-007 | Layout Pagination harus mengikuti Approved UI Design Mockup. |

---

## 4.7.76 Display Rules

- Pagination selalu berada di bawah Document Register Table.
- Nomor halaman ditampilkan secara berurutan.
- Halaman aktif memiliki indikator visual yang berbeda.
- Tombol Previous dinonaktifkan pada halaman pertama.
- Tombol Next dinonaktifkan pada halaman terakhir.
- Tampilan mengikuti Approved UI Design Mockup.

---

## 4.7.77 Interaction Rules

### Previous

Berpindah ke halaman sebelumnya.

---

### Next

Berpindah ke halaman berikutnya.

---

### Page Number

Berpindah langsung ke halaman yang dipilih.

Perpindahan halaman hanya memperbarui isi Document Register Table.

Tidak mengubah Business Data.

---

## 4.7.78 Permissions

Seluruh pengguna yang memiliki akses ke Dashboard dapat menggunakan Pagination.

Pagination tidak dipengaruhi oleh Role.

Data yang ditampilkan tetap mengikuti Permission pengguna.

---

## 4.7.79 UI Components

### A. Visual Components

- Pagination Container
- Page Number Button
- Previous Button
- Next Button
- Active Page Indicator

---

### B. Content Components

- Current Page Number
- Total Available Pages

---

### C. Interactive Components

- Previous Button
- Next Button
- Page Number Button

---

## 4.7.80 Acceptance Criteria

Pagination dinyatakan memenuhi spesifikasi apabila:

- Ditampilkan sesuai Approved UI Design Mockup.
- Berada di bawah Document Register Table.
- Halaman aktif memiliki indikator visual.
- Previous dan Next bekerja dengan benar.
- Perpindahan halaman memperbarui isi tabel.
- Pagination tidak mengubah Business Workflow maupun Business Data.

# ==============================================================================
# 4.7 Functional Requirements
# PART D.1 — Right Information Panel (Decision Support Area)
# ==============================================================================

## 4.7.81 Overview

Right Information Panel merupakan **Decision Support Area** pada Dashboard.

Panel ini berada pada sisi kanan Operational Workspace dan berfungsi menampilkan informasi pendukung yang membantu pengguna memahami kondisi proyek secara cepat.

Right Information Panel tidak digunakan untuk menjalankan Business Workflow secara langsung.

Seluruh informasi yang ditampilkan bersifat **Read Only**.

---

## 4.7.82 Purpose

Right Information Panel dikembangkan untuk:

- Menampilkan informasi pendukung Dashboard.
- Membantu pengguna memonitor kondisi SLA.
- Membantu pengguna mengidentifikasi dokumen yang membutuhkan perhatian segera.
- Membantu pengguna menentukan prioritas pekerjaan.
- Mengurangi kebutuhan membuka halaman SLA Monitoring hanya untuk melihat kondisi proyek.

Panel tidak melakukan perubahan terhadap Business Data.

---

## 4.7.83 Dashboard Architecture

Dashboard dibagi menjadi tiga area utama.

```text
Dashboard
│
├── Summary Area
│   └── Menampilkan ringkasan kondisi proyek.
│
├── Operational Workspace
│   └── Document Register Panel
│
└── Decision Support Area
    └── Right Information Panel
        ├── SLA Overview
        └── Escalation Alert
```

Ketiga area tersebut memiliki tanggung jawab yang berbeda dan saling melengkapi.

---

## 4.7.84 Layout

Right Information Panel berada pada sisi kanan Dashboard.

Posisinya mengikuti ketentuan berikut:

- Berada di sebelah kanan **Operational Workspace**.
- Berada tepat di bawah **Summary Area**.
- Tidak menutupi Footer.
- Mengikuti Approved UI Design Mockup.

Panel terdiri dari dua widget utama.

```text
+----------------------------------+

SLA Overview

----------------------------------

Escalation Alert

+----------------------------------+
```

Widget ditampilkan secara vertikal.

Urutan widget wajib sebagai berikut:

1. SLA Overview
2. Escalation Alert

---

## 4.7.85 Panel Structure

Right Information Panel terdiri dari dua widget.

```text
Right Information Panel
│
├── SLA Overview
│
└── Escalation Alert
```

Masing-masing widget memiliki spesifikasi Functional Requirement tersendiri.

---

## 4.7.86 Business Definition

Right Information Panel merupakan **Decision Support Area**.

Panel ini tidak menjadi sumber Business Data.

Panel hanya menampilkan informasi hasil Business Process yang telah didefinisikan pada BUSINESS-WORKFLOW.md.

Panel tidak memiliki Business Logic.

Panel tidak mengubah Workflow.

---

## 4.7.87 Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-RIP-001 | Sistem harus menampilkan Right Information Panel pada Dashboard. |
| FR-RIP-002 | Right Information Panel merupakan Decision Support Area pada Dashboard. |
| FR-RIP-003 | Panel harus berada di sebelah kanan Operational Workspace. |
| FR-RIP-004 | Panel harus berada tepat di bawah Summary Area. |
| FR-RIP-005 | Panel harus terdiri dari dua widget, yaitu SLA Overview dan Escalation Alert. |
| FR-RIP-006 | SLA Overview harus selalu ditampilkan di atas Escalation Alert. |
| FR-RIP-007 | Panel harus diperbarui setelah Dashboard Refresh. |
| FR-RIP-008 | Panel hanya bersifat Read Only. |
| FR-RIP-009 | Layout harus mengikuti Approved UI Design Mockup. |

---

## 4.7.88 Display Rules

- Right Information Panel selalu ditampilkan.
- Panel berada pada sisi kanan Operational Workspace.
- Widget ditampilkan secara vertikal.
- SLA Overview selalu berada pada bagian atas.
- Escalation Alert selalu berada di bawah SLA Overview.
- Tinggi panel mengikuti tinggi widget.
- Panel tidak boleh menutupi Footer.
- Layout mengikuti Approved UI Design Mockup.

---

## 4.7.89 Interaction Rules

Right Information Panel merupakan **Informational Component**.

Panel tidak digunakan untuk:

- Approval.
- Upload Document.
- Upload Revision.
- Edit Document.
- Mengubah Workflow.

Interaksi pengguna hanya sebatas melihat informasi yang ditampilkan.

Apabila pada masa mendatang widget mendukung navigasi menuju halaman SLA Monitoring atau Escalation, perubahan tersebut harus dianggap sebagai **Change Request** dan berada di luar ruang lingkup PRD versi ini.

---

## 4.7.90 Permissions

Seluruh pengguna yang memiliki akses ke Dashboard dapat melihat Right Information Panel.

Informasi yang ditampilkan mengikuti Role dan Permission pengguna.

---

## 4.7.91 UI Components

### A. Visual Components

- Right Information Panel Container
- Widget Container
- Widget Divider
- Widget Background

---

### B. Content Components

- SLA Overview Widget
- Escalation Alert Widget

---

### C. Interactive Components

Pada versi PRD ini tidak terdapat Interactive Component.

Seluruh widget bersifat Read Only.

---

## 4.7.92 Acceptance Criteria

Right Information Panel dinyatakan memenuhi spesifikasi apabila:

- Ditampilkan pada sisi kanan Operational Workspace.
- Berada tepat di bawah Summary Area.
- Berisi dua widget (SLA Overview dan Escalation Alert).
- Widget ditampilkan secara vertikal sesuai Approved UI Design Mockup.
- Panel tidak mengubah Business Data maupun Business Workflow.
- Seluruh informasi diperbarui setelah Dashboard Refresh.
- Layout mengikuti Approved UI Design Mockup.

# ==============================================================================
# 4.7 Functional Requirements
# PART D.2 — SLA Overview
# ==============================================================================

## 4.7.93 Overview

SLA Overview merupakan widget utama pada **Decision Support Area** yang menampilkan ringkasan kondisi Service Level Agreement (SLA) seluruh Document Engineering.

Widget ini membantu pengguna memahami kondisi kesehatan (Project Health) berdasarkan hasil perhitungan SLA tanpa harus membuka halaman SLA Monitoring.

SLA Overview hanya menampilkan hasil perhitungan SLA.

Perhitungan SLA dilakukan oleh Business Rules yang didefinisikan pada BUSINESS-WORKFLOW.md.

---

## 4.7.94 Purpose

SLA Overview dikembangkan untuk:

- Menampilkan ringkasan kondisi SLA proyek.
- Memberikan gambaran tingkat kepatuhan terhadap target SLA.
- Membantu pengguna menentukan prioritas pekerjaan.
- Membantu Project Manager mengidentifikasi risiko keterlambatan.

Widget tidak melakukan perubahan terhadap Business Data.

---

## 4.7.95 Layout

SLA Overview berada pada posisi paling atas Right Information Panel.

Layout mengikuti Approved UI Design Mockup.

```text
+----------------------------------------+

SLA Overview

----------------------------------------

🟢  On Track                    125

🟡  At Risk                      18

🔴  Overdue                       6

⚫  Final As-Built               95

+----------------------------------------+
```

Widget ditampilkan secara vertikal.

Urutan kategori SLA tidak boleh diubah.

---

## 4.7.96 Business Definition

SLA Overview merupakan representasi visual dari kondisi SLA seluruh Document Engineering yang dapat diakses oleh pengguna.

Widget tidak melakukan perhitungan SLA.

Widget hanya menampilkan hasil klasifikasi SLA yang telah dihitung oleh SLA Engine sesuai BUSINESS-WORKFLOW.md.

---

## 4.7.97 SLA Status

| SLA Status | Business Definition |
|--------------|--------------------|
| On Track | Document masih berada dalam target SLA. |
| At Risk | Document mendekati batas SLA dan memerlukan perhatian. |
| Overdue | Document telah melewati target SLA. |
| Final As-Built | Document telah selesai sehingga monitoring SLA dihentikan. |

Business Definition mengikuti BUSINESS-WORKFLOW.md.

---

## 4.7.98 Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-SLA-001 | Sistem harus menampilkan widget SLA Overview pada bagian atas Right Information Panel. |
| FR-SLA-002 | Widget harus menampilkan empat kategori SLA. |
| FR-SLA-003 | Nilai setiap kategori berasal dari SLA Engine. |
| FR-SLA-004 | Data mengikuti Permission pengguna. |
| FR-SLA-005 | Widget diperbarui setelah Dashboard Refresh. |
| FR-SLA-006 | Widget bersifat Read Only. |
| FR-SLA-007 | Layout mengikuti Approved UI Design Mockup. |

---

## 4.7.99 Display Rules

- SLA Overview selalu ditampilkan.
- Urutan kategori SLA wajib mengikuti spesifikasi PRD.
- Nilai ditampilkan sebagai angka agregasi.
- Nilai kosong ditampilkan sebagai **0**.
- Warna Status Indicator mengikuti Design System.
- Widget mengikuti Approved UI Design Mockup.

---

## 4.7.100 Display Specification

Setiap baris pada SLA Overview terdiri dari empat elemen.

| Element | Description | Display Rule |
|----------|-------------|--------------|
| Status Indicator | Penanda visual kategori SLA. | Menggunakan warna atau icon sesuai Design System. |
| Category Label | Nama kategori SLA. | Menampilkan On Track, At Risk, Overdue, atau Final As-Built. |
| Alignment Spacer | Pengatur tata letak. | Menjaga agar Category Label dan Total Value tetap sejajar. |
| Total Value | Jumlah Document pada kategori SLA. | Ditampilkan dalam format angka (integer). |

Seluruh elemen harus mengikuti Approved UI Design Mockup.

---

## 4.7.101 Interaction Rules

SLA Overview merupakan **Informational Widget**.

Widget tidak digunakan untuk:

- Approval.
- Upload Document.
- Upload Revision.
- Edit Document.
- Mengubah Workflow.

Pada versi PRD ini tidak terdapat interaksi.

Apabila pada masa mendatang widget dapat membuka halaman SLA Monitoring, perubahan tersebut dianggap sebagai **Change Request**.

---

## 4.7.102 Permissions

Seluruh pengguna yang memiliki akses ke Dashboard dapat melihat SLA Overview.

Data yang ditampilkan mengikuti Role dan Permission pengguna.

---

## 4.7.103 UI Components

### A. Visual Components

- SLA Widget Container
- Widget Header
- Category Row
- Status Indicator
- Divider

---

### B. Content Components

- Widget Title
- Category Label
- Total Value

---

### C. Interactive Components

Tidak terdapat Interactive Component pada versi PRD ini.

---

## 4.7.104 Data Mapping

| UI Component | Business Data Source | Read / Write | Description |
|--------------|----------------------|--------------|-------------|
| Widget Title | Static Content | Read | Menampilkan judul widget. |
| Category Label | SLA Engine | Read | Menampilkan kategori SLA. |
| Total Value | SLA Engine | Read | Menampilkan jumlah Document pada setiap kategori SLA. |

---

## 4.7.105 Acceptance Criteria

SLA Overview dinyatakan memenuhi spesifikasi apabila:

- Ditampilkan pada posisi paling atas Right Information Panel.
- Menampilkan empat kategori SLA sesuai BUSINESS-WORKFLOW.md.
- Urutan kategori mengikuti spesifikasi PRD.
- Nilai berasal dari SLA Engine.
- Nilai mengikuti Permission pengguna.
- Widget diperbarui setelah Dashboard Refresh.
- Widget bersifat Read Only.
- Layout mengikuti Approved UI Design Mockup.
- Widget tidak mengubah Business Data maupun Business Workflow.

# ==============================================================================
# 4.7 Functional Requirements
# PART D.3 — Escalation Alert
# ==============================================================================

## 4.7.106 Overview

Escalation Alert merupakan widget pada **Decision Support Area** yang menampilkan daftar Document yang memerlukan perhatian segera berdasarkan hasil evaluasi Escalation Rules.

Widget membantu pengguna mengidentifikasi pekerjaan dengan prioritas tertinggi tanpa harus membuka halaman Escalation.

Escalation Alert hanya menampilkan hasil evaluasi Escalation Engine.

Seluruh proses evaluasi Escalation mengikuti BUSINESS-WORKFLOW.md.

---

## 4.7.107 Purpose

Escalation Alert dikembangkan untuk:

- Menampilkan Document yang membutuhkan tindakan segera.
- Membantu pengguna menentukan prioritas pekerjaan.
- Mengurangi risiko keterlambatan penyelesaian Document.
- Membantu Project Manager melakukan monitoring pekerjaan kritis.

Widget tidak melakukan perubahan terhadap Business Data.

---

## 4.7.108 Layout

Escalation Alert berada di bawah SLA Overview.

Layout mengikuti Approved UI Design Mockup.

```text
+--------------------------------------------+

Escalation Alert

--------------------------------------------

🔴 DOC-001

Project Review

Overdue 3 Days

--------------------------------------------

🟡 DOC-014

Process Review

At Risk

--------------------------------------------

🔴 DOC-028

Project Comment

Overdue 1 Day

+--------------------------------------------+
```

Widget ditampilkan secara vertikal.

Daftar Alert diurutkan berdasarkan prioritas tertinggi.

---

## 4.7.109 Business Definition

Escalation Alert merupakan representasi visual dari hasil evaluasi Escalation Engine.

Widget tidak menentukan prioritas.

Widget hanya menampilkan hasil evaluasi Escalation Rules sesuai BUSINESS-WORKFLOW.md.

---

## 4.7.110 Escalation Categories

| Category | Business Definition |
|-----------|--------------------|
| Critical | Document dengan tingkat eskalasi tertinggi dan memerlukan tindakan segera. |
| Warning | Document yang mulai mendekati kondisi kritis dan perlu perhatian. |

Kategori mengikuti BUSINESS-WORKFLOW.md.

---

## 4.7.111 Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-ESC-001 | Sistem harus menampilkan widget Escalation Alert di bawah SLA Overview. |
| FR-ESC-002 | Widget harus menampilkan daftar Document yang memiliki status eskalasi. |
| FR-ESC-003 | Data berasal dari Escalation Engine. |
| FR-ESC-004 | Daftar Alert diurutkan berdasarkan prioritas tertinggi. |
| FR-ESC-005 | Widget mengikuti Permission pengguna. |
| FR-ESC-006 | Widget diperbarui setelah Dashboard Refresh. |
| FR-ESC-007 | Widget bersifat Read Only. |
| FR-ESC-008 | Layout mengikuti Approved UI Design Mockup. |

---

## 4.7.112 Display Rules

- Widget selalu ditampilkan.
- Alert dengan prioritas tertinggi berada pada urutan pertama.
- Jumlah Alert mengikuti hasil Escalation Engine.
- Jika tidak terdapat Alert, sistem menampilkan pesan:

```text
No escalation alerts.
```

- Layout mengikuti Approved UI Design Mockup.

---

## 4.7.113 Display Specification

Setiap Alert terdiri dari empat elemen.

| Element | Description | Display Rule |
|----------|-------------|--------------|
| Severity Indicator | Menunjukkan tingkat prioritas Alert. | Menggunakan warna atau icon sesuai Design System. |
| Document Number | Identitas Document. | Ditampilkan sebagai teks. |
| Workflow Status | Status Document saat ini. | Ditampilkan sebagai teks atau badge sesuai Design System. |
| Escalation Information | Informasi eskalasi. | Menampilkan kondisi seperti "Overdue 3 Days" atau "At Risk". |

Seluruh elemen mengikuti Approved UI Design Mockup.

---

## 4.7.114 Interaction Rules

Escalation Alert merupakan **Informational Widget**.

Widget tidak digunakan untuk:

- Approval.
- Upload Document.
- Upload Revision.
- Edit Document.
- Mengubah Workflow.

Pada versi PRD ini widget tidak memiliki interaksi.

Apabila pada masa mendatang Alert dapat diklik untuk membuka halaman Escalation atau Document Register dengan filter tertentu, perubahan tersebut dianggap sebagai **Change Request**.

---

## 4.7.115 Permissions

Seluruh pengguna yang memiliki akses ke Dashboard dapat melihat Escalation Alert.

Data yang ditampilkan mengikuti Role dan Permission pengguna.

---

## 4.7.116 UI Components

### A. Visual Components

- Escalation Widget Container
- Widget Header
- Alert Row
- Severity Indicator
- Divider

---

### B. Content Components

- Widget Title
- Document Number
- Workflow Status
- Escalation Information

---

### C. Interactive Components

Tidak terdapat Interactive Component pada versi PRD ini.

---

## 4.7.117 Data Mapping

| UI Component | Business Data Source | Read / Write | Description |
|--------------|----------------------|--------------|-------------|
| Widget Title | Static Content | Read | Menampilkan judul widget. |
| Document Number | Document Register | Read | Menampilkan nomor Document. |
| Workflow Status | Workflow Engine | Read | Menampilkan Status Document saat ini. |
| Escalation Information | Escalation Engine | Read | Menampilkan informasi eskalasi. |

---

## 4.7.118 Acceptance Criteria

Escalation Alert dinyatakan memenuhi spesifikasi apabila:

- Ditampilkan di bawah SLA Overview.
- Menampilkan daftar Alert sesuai Escalation Engine.
- Daftar diurutkan berdasarkan prioritas tertinggi.
- Data mengikuti Permission pengguna.
- Widget diperbarui setelah Dashboard Refresh.
- Widget bersifat Read Only.
- Layout mengikuti Approved UI Design Mockup.
- Widget tidak mengubah Business Data maupun Business Workflow.

# ==============================================================================
# PART 4 — Dashboard Module
# STEP 6 — Business Rules
# Official Business Rule Documentation Standard
# ==============================================================================

## 4.8 Overview

Business Rules Dashboard mendefinisikan aturan bisnis yang wajib dipatuhi oleh seluruh komponen Dashboard.

Dashboard berfungsi sebagai:

- Presentation Layer
- Operational Workspace
- Decision Support Area

Dashboard tidak mengimplementasikan Business Logic.

Seluruh Business Logic tetap didefinisikan pada BUSINESS-WORKFLOW.md.

Business Rules pada Dashboard hanya mengatur bagaimana Dashboard menampilkan informasi, berinteraksi dengan pengguna, dan mematuhi Business Workflow yang telah ditetapkan.

---

## 4.8 Purpose

Business Rules Dashboard dikembangkan untuk:

- Menjamin konsistensi perilaku seluruh komponen Dashboard.
- Menjaga agar Business Logic tidak berpindah ke Frontend.
- Menjadi acuan implementasi bagi Frontend Developer, Backend Developer, QA Engineer, dan AI Coding Assistant.
- Menjamin seluruh implementasi tetap konsisten terhadap BUSINESS-WORKFLOW.md.
- Menjadi dasar penyusunan Test Case dan Code Review Checklist.

---

## 4.8 Business Rule Categories

Business Rules Dashboard dibagi menjadi tujuh kategori.

| Category | Description |
|----------|-------------|
| Display | Aturan mengenai tampilan Dashboard. |
| Workflow | Aturan hubungan Dashboard dengan Business Workflow. |
| Permission | Aturan hak akses pengguna. |
| Navigation | Aturan navigasi Dashboard. |
| Refresh | Aturan pembaruan data Dashboard. |
| Data Integrity | Aturan konsistensi sumber data Dashboard. |
| Read Only | Aturan komponen yang hanya menampilkan informasi. |

---

## 4.8 Rule Priority

Setiap Business Rule memiliki tingkat prioritas implementasi.

| Priority | Description |
|----------|-------------|
| Critical | Wajib dipatuhi. Pelanggaran akan menyebabkan kesalahan Business Process, Workflow, Data Integrity, atau Security. |
| High | Sangat penting untuk menjaga konsistensi sistem dan pengalaman pengguna. |
| Medium | Penting untuk menjaga konsistensi implementasi dan kesesuaian UI. |
| Low | Aturan tambahan yang meningkatkan kualitas implementasi namun tidak memengaruhi Business Process utama. |

Priority digunakan sebagai acuan untuk:

- Implementasi Frontend.
- Implementasi Backend.
- Code Review.
- QA Testing.
- Regression Testing.
- AI Code Generation.

---

## 4.8 Business Rule Matrix

| Rule ID | Category | Priority | Business Rule | Affected Components | Reference |
|----------|----------|----------|---------------|---------------------|-----------|
| BR-DASH-001 | Display | High | Dashboard hanya menampilkan informasi dan tidak menyimpan Business Data. | Dashboard Module | BUSINESS-WORKFLOW.md |
| BR-DASH-002 | Display | High | Dashboard harus mengikuti Approved UI Design Mockup sebagai Visual Source of Truth. | Seluruh Dashboard UI | UI-GUIDELINES.md |
| BR-DASH-003 | Display | Medium | Seluruh icon harus mengikuti Icon System proyek dan memiliki bentuk yang paling identik dengan Approved UI Design Mockup. | Seluruh Icon Dashboard | ICON-SYSTEM.md |
| BR-DASH-004 | Workflow | Critical | Dashboard tidak boleh menentukan Business Workflow. | Seluruh Dashboard Module | BUSINESS-WORKFLOW.md |
| BR-DASH-005 | Workflow | Critical | Seluruh perubahan Workflow hanya boleh dilakukan melalui Workflow Action Button. | Action Buttons | BUSINESS-WORKFLOW.md |
| BR-DASH-006 | Workflow | Critical | Dashboard hanya meneruskan aksi pengguna ke Business Process yang sesuai. | Action Buttons | BUSINESS-WORKFLOW.md |
| BR-DASH-007 | Workflow | Critical | Dashboard tidak boleh melakukan perhitungan SLA maupun Escalation. | SLA Overview, Escalation Alert | BUSINESS-WORKFLOW.md |
| BR-DASH-008 | Permission | Critical | Dashboard hanya menampilkan Document yang dapat diakses oleh pengguna. | Document Register Table | ACCESS-CONTROL.md |
| BR-DASH-009 | Permission | Critical | Workflow Action harus mengikuti Role dan Permission pengguna. | Action Buttons | ACCESS-CONTROL.md |
| BR-DASH-010 | Permission | High | Seluruh Widget Dashboard hanya menampilkan data yang dapat diakses oleh pengguna. | Summary Area, SLA Overview, Escalation Alert | ACCESS-CONTROL.md |
| BR-DASH-011 | Navigation | High | Search, Filter, Sort, dan Page Size harus dipertahankan ketika pengguna melakukan Pagination. | Toolbar, Pagination, Document Register Table | PRD Dashboard |
| BR-DASH-012 | Navigation | High | Perpindahan halaman tidak boleh mengubah kondisi Search, Filter, Sort, maupun Page Size yang sedang aktif. | Pagination, Toolbar | PRD Dashboard |
| BR-DASH-013 | Navigation | High | Aktivitas Search, Filter, Sort, dan Pagination tidak boleh mengubah Business Data. | Toolbar, Document Register Table | PRD Dashboard |
| BR-DASH-014 | Refresh | High | Dashboard Refresh harus memperbarui seluruh informasi Dashboard. | Dashboard Module | BUSINESS-WORKFLOW.md |
| BR-DASH-015 | Refresh | High | Dashboard Refresh harus memperbarui Summary Area, Document Register Table, SLA Overview, dan Escalation Alert secara konsisten. | Summary Area, Document Register Table, SLA Overview, Escalation Alert | PRD Dashboard |
| BR-DASH-016 | Refresh | High | Dashboard harus selalu menampilkan data terbaru setelah proses Refresh selesai. | Seluruh Dashboard Module | BUSINESS-WORKFLOW.md |
| BR-DASH-017 | Data Integrity | Critical | Seluruh informasi Dashboard harus berasal dari Business Data Source yang sama sesuai Dashboard Data Mapping. | Summary Area, Document Register Table, SLA Overview, Escalation Alert | STEP 4 — Dashboard Data Source |
| BR-DASH-018 | Data Integrity | Critical | Dashboard tidak boleh menampilkan informasi yang bertentangan dengan BUSINESS-WORKFLOW.md. | Seluruh Dashboard Module | BUSINESS-WORKFLOW.md |
| BR-DASH-019 | Read Only | High | Summary Area, SLA Overview, dan Escalation Alert merupakan Informational Component dan tidak boleh mengubah Business Data. | Summary Area, SLA Overview, Escalation Alert | PRD Dashboard |
| BR-DASH-020 | Read Only | High | View, Download, Comment, dan History merupakan Read Action dan tidak boleh mengubah Business Data. | Action Buttons | BUSINESS-WORKFLOW.md |
| BR-DASH-021 | Project Context | Critical | Dashboard hanya boleh menampilkan data milik Active Project. | Seluruh Dashboard Module | BUSINESS-WORKFLOW.md → Multi Project Context |
| BR-DASH-022 | Project Context | Critical | Perubahan Active Project wajib memuat ulang Summary Area, Document Register Table, SLA Overview, dan Escalation Alert. | Seluruh Dashboard Module | PART 14 — Multi Project Management |
| BR-DASH-023 | Data Integrity | Critical | Data Project lain tidak boleh muncul pada Dashboard Active Project. | Seluruh Dashboard Module | BUSINESS-WORKFLOW.md → Project Data Isolation |
| BR-DASH-024 | Permission | Critical | Workflow Action hanya dapat dijalankan apabila User memiliki Project Membership Active dan Official Role yang sesuai pada Project tersebut. | Action Buttons | BUSINESS-WORKFLOW.md |

---

## 4.8 Acceptance Criteria

Business Rules Dashboard dinyatakan memenuhi spesifikasi apabila:

- Seluruh Business Rule terdokumentasi dalam Business Rule Matrix.
- Setiap Business Rule memiliki Rule ID yang unik.
- Setiap Business Rule memiliki Category yang jelas.
- Setiap Business Rule memiliki Priority.
- Setiap Business Rule memiliki Affected Components.
- Setiap Business Rule memiliki Reference Document yang valid.
- Tidak terdapat Business Rule yang bertentangan dengan BUSINESS-WORKFLOW.md.
- Dashboard tidak mengimplementasikan Business Logic.
- Dashboard hanya bertindak sebagai Presentation Layer, Operational Workspace, dan Decision Support Area.

# ==============================================================================
# PART 4 — Dashboard Module
# STEP 7 — Validation Rules
# Official Validation Documentation Standard
# ==============================================================================

## 4.9 Overview

Validation Rules mendefinisikan aturan validasi yang harus diterapkan pada seluruh fitur Dashboard.

Validation Rules memastikan bahwa Dashboard menampilkan informasi secara konsisten sesuai Business Rules, Permission, dan kondisi sistem.

Validation Rules tidak mendefinisikan Business Logic.

Seluruh Business Logic tetap mengikuti BUSINESS-WORKFLOW.md.

---

## 4.9 Purpose

Validation Rules dikembangkan untuk:

- Menjamin konsistensi perilaku Dashboard.
- Menjadi dasar penyusunan QA Test Case.
- Memastikan seluruh fitur Dashboard bekerja sesuai Functional Requirements.
- Menjamin Dashboard tidak melanggar Business Rules.

---

## 4.9 Validation Categories

Validation Rules Dashboard dibagi menjadi enam kategori.

| Category | Description |
|----------|-------------|
| Search | Validasi fitur pencarian Document. |
| Filter | Validasi penyaringan data. |
| Sort | Validasi pengurutan data. |
| Pagination | Validasi perpindahan halaman. |
| Refresh | Validasi pembaruan Dashboard. |
| Permission | Validasi tampilan berdasarkan Role dan Permission. |

> **Project Context Validation**

Seluruh Validation Categories di atas selalu dijalankan dalam **Active Project**.

Setiap proses Search, Filter, Sort, Pagination, Refresh, maupun Permission hanya berlaku terhadap data yang berada pada Active Project sesuai Project Membership pengguna.

---

## 4.9 Validation Matrix

| Validation ID | Category | Validation Rule | Expected Result | Reference |
|---------------|----------|-----------------|-----------------|-----------|
| VAL-DASH-001 | Search | Search Keyword kosong. | Seluruh Document ditampilkan. | FR Dashboard |
| VAL-DASH-002 | Search | Search Keyword tidak ditemukan. | Dashboard menampilkan keadaan kosong (Empty State) tanpa error. | FR Dashboard |
| VAL-DASH-003 | Search | Search berhasil. | Hanya Document yang sesuai Keyword ditampilkan. | FR Dashboard |
| VAL-DASH-004 | Filter | Filter tidak dipilih. | Seluruh Document ditampilkan. | FR Dashboard |
| VAL-DASH-005 | Filter | Filter dipilih. | Dashboard hanya menampilkan Document sesuai Filter. | FR Dashboard |
| VAL-DASH-006 | Sort | Sort Ascending dipilih. | Data ditampilkan secara Ascending. | FR Dashboard |
| VAL-DASH-007 | Sort | Sort Descending dipilih. | Data ditampilkan secara Descending. | FR Dashboard |
| VAL-DASH-008 | Pagination | Pengguna berpindah halaman. | Dashboard mempertahankan Search, Filter, Sort, dan Page Size. | Business Rules |
| VAL-DASH-009 | Refresh | Dashboard di-refresh. | Seluruh widget diperbarui secara konsisten. | Business Rules |
| VAL-DASH-010 | Permission | Pengguna tidak memiliki hak Workflow Action. | Workflow Action tidak ditampilkan. | ACCESS-CONTROL.md |
| VAL-DASH-011 | Permission | Pengguna memiliki hak Workflow Action. | Workflow Action ditampilkan sesuai Permission. | ACCESS-CONTROL.md |
| VAL-DASH-012 | Permission | Pengguna hanya memiliki Read Permission. | Hanya Read Action yang ditampilkan. | ACCESS-CONTROL.md |
| VAL-DASH-013 | Project Context | Active Project berubah. | Seluruh Dashboard dimuat ulang berdasarkan Active Project yang baru. | PART 14 — Multi Project Management |
| VAL-DASH-014 | Project Context | User mencoba mengakses Document Project lain. | Akses ditolak dan data tidak ditampilkan. | BUSINESS-WORKFLOW.md |
| VAL-DASH-015 | Project Context | Active Project menjadi Inactive. | Active Project dibatalkan dan pengguna wajib memilih Project Active lain. | PART 14 — Multi Project Management |
| VAL-DASH-016 | Project Context  | Project Membership pengguna menjadi Inactive. | Pengguna kehilangan akses terhadap Project tersebut. | PART 14 — Multi Project Management |

---

## 4.9 Acceptance Criteria

Validation Rules Dashboard dinyatakan memenuhi spesifikasi apabila:

- Seluruh fitur Dashboard memiliki aturan validasi yang terdokumentasi.
- Validation Rules tidak bertentangan dengan Business Rules.
- Validation Rules tidak mendefinisikan Business Logic.
- Dashboard menampilkan hasil sesuai Expected Result pada setiap skenario validasi.
- Validation Rules dapat digunakan sebagai dasar penyusunan QA Test Case.

# ==============================================================================
# PART 4 — Dashboard Module
# STEP 8 — Permissions
# ==============================================================================

## 4.10 Overview

Permissions Dashboard mendefinisikan bagaimana setiap komponen Dashboard harus mematuhi hak akses pengguna.

Dashboard tidak mendefinisikan Role maupun Permission.

Seluruh definisi Role, Permission, Access Control, dan Permission Matrix berada pada **ACCESS-CONTROL.md** sebagai **Single Source of Truth**.

STEP ini hanya menjelaskan bagaimana setiap komponen Dashboard harus berperilaku terhadap Permission yang telah diberikan oleh sistem.

---

## 4.10 Purpose

Permissions Dashboard dikembangkan untuk:

- Menjamin seluruh komponen Dashboard mematuhi hak akses pengguna.
- Menjadi acuan implementasi Frontend Permission Guard.
- Menjamin Dashboard hanya menampilkan informasi yang dapat diakses pengguna.
- Menghindari duplikasi Permission Matrix yang telah didefinisikan pada ACCESS-CONTROL.md.
- Menjamin konsistensi implementasi Permission pada seluruh Dashboard Component.

---

## 4.10 Permission Principles

Dashboard wajib mengikuti prinsip berikut.

1. Dashboard tidak menentukan Permission.

2. Dashboard hanya mengonsumsi hasil Permission yang diberikan sistem.

3. Permission diterapkan secara konsisten pada seluruh Dashboard Component.

4. Dashboard tidak boleh mengimplementasikan Business Logic Permission.

5. ACCESS-CONTROL.md merupakan Single Source of Truth untuk seluruh Permission.

---

## 4.10 Permission Mapping

| Dashboard Component | Permission Controlled | Behaviour | Reference |
|---------------------|----------------------|-----------|-----------|
| Page Header | No | **Always Display** | PRD Dashboard |
| Summary Area | Yes | **Display Based on Permission** | ACCESS-CONTROL.md |
| Document Register Table | Yes | **Display Based on Permission** | ACCESS-CONTROL.md |
| Search | Yes | **Display Based on Permission** | ACCESS-CONTROL.md |
| Filter | Yes | **Display Based on Permission** | ACCESS-CONTROL.md |
| Sort | Yes | **Display Based on Permission** | ACCESS-CONTROL.md |
| Pagination | Yes | **Display Based on Permission** | ACCESS-CONTROL.md |
| View | Yes | **Display Based on Permission** | ACCESS-CONTROL.md |
| Download | Yes | **Display Based on Permission** | ACCESS-CONTROL.md |
| Comment | Yes | **Display Based on Permission** | ACCESS-CONTROL.md |
| Workflow Actions (A/B/C) | Yes | **Display Based on Permission & Workflow Status** | ACCESS-CONTROL.md |
| History | Yes | **Display Based on Permission & Workflow Status** | ACCESS-CONTROL.md |
| SLA Overview | Yes | **Display Based on Permission** | ACCESS-CONTROL.md |
| Escalation Alert | Yes | **Display Based on Permission** | ACCESS-CONTROL.md |

---

## 4.10 Permission Behaviour

Dashboard wajib menerapkan perilaku Permission berikut.

### Always Display

Komponen selalu ditampilkan kepada seluruh pengguna yang memiliki akses ke Dashboard.

Contoh:

- Page Header

---

### Display Based on Permission

Komponen hanya ditampilkan apabila pengguna memiliki Permission yang sesuai.

Apabila Permission tidak tersedia, Dashboard tidak boleh menampilkan data maupun fungsi yang bersangkutan.

Contoh:

- Summary Area
- Document Register Table
- Search
- Filter
- Sort
- Pagination
- View
- Download
- Comment
- SLA Overview
- Escalation Alert

---

### Display Based on Permission & Workflow Status

Komponen hanya ditampilkan apabila memenuhi dua kondisi sekaligus:

- Pengguna memiliki Permission yang sesuai.
- Workflow Status mengizinkan Action tersebut.

Contoh:

- Workflow Action (A)
- Workflow Action (B)
- Workflow Action (C)
- History

Seluruh aturan Workflow mengikuti BUSINESS-WORKFLOW.md.

---

## 4.10 Implementation Rules

Dashboard wajib menerapkan aturan berikut.

- Dashboard tidak boleh melakukan evaluasi Permission secara mandiri.
- Dashboard hanya menggunakan hasil evaluasi Permission dari sistem.
- Dashboard tidak boleh menampilkan Document di luar hak akses pengguna.
- Dashboard tidak boleh menampilkan Action yang tidak dimiliki pengguna.
- Dashboard harus memperbarui tampilan apabila Permission pengguna berubah setelah sesi diperbarui.
- Dashboard harus menggunakan ACCESS-CONTROL.md sebagai Single Source of Truth.

---

## 4.10 Acceptance Criteria

Permissions Dashboard dinyatakan memenuhi spesifikasi apabila:

- Seluruh Dashboard Component mengikuti ACCESS-CONTROL.md.
- Tidak terdapat Permission yang didefinisikan ulang di Dashboard Module.
- Dashboard hanya menampilkan Document yang dapat diakses pengguna.
- Dashboard hanya menampilkan Action sesuai Permission dan Workflow Status.
- Dashboard tidak mengimplementasikan Business Logic Permission.
- Dashboard menggunakan ACCESS-CONTROL.md sebagai Single Source of Truth.
- Seluruh Dashboard Component menerapkan Behaviour yang telah didefinisikan pada Permission Mapping.

# ==============================================================================
# PART 4 — Dashboard Module
# STEP 9 — UI Components (Dashboard Component Inventory)
# ==============================================================================

## 4.11 Overview

Dashboard Component Inventory mendefinisikan seluruh komponen UI yang membentuk Dashboard.

STEP ini tidak menjelaskan spesifikasi masing-masing komponen.

Spesifikasi detail telah didefinisikan pada STEP 5.

STEP ini hanya berfungsi sebagai inventaris komponen Dashboard.

---

## 4.11 Purpose

Dashboard Component Inventory dikembangkan untuk:

- Menjadi daftar resmi seluruh Dashboard Component.
- Menjadi acuan implementasi Frontend.
- Menjadi acuan struktur Component Architecture.
- Mempermudah pemetaan komponen terhadap desain UI.

---

## 4.11 Component Categories

Dashboard terdiri dari tiga area utama.

```text
Dashboard

↓

Summary Area

↓

Operational Workspace

↓

Decision Support Area
```

Setiap area terdiri dari beberapa UI Component.

---

## 4.11 Dashboard Component Inventory

| Area | Component | Component Type | Detail Reference |
|-------|-----------|----------------|------------------|
| Summary Area | Page Header | Layout Component | STEP 5 PART A |
| Summary Area | Summary Card Container | Container Component | STEP 5 PART B |
| Summary Area | Summary Card | Widget Component | STEP 5 PART B |
| Operational Workspace | Document Register Panel | Panel Component | STEP 5 PART C.1 |
| Operational Workspace | Panel Header | Header Component | STEP 5 PART C.2 |
| Operational Workspace | Search | Input Component | STEP 5 PART C.2 |
| Operational Workspace | Filter | Selection Component | STEP 5 PART C.2 |
| Operational Workspace | Sort | Selection Component | STEP 5 PART C.2 |
| Operational Workspace | Document Register Table | Table Component | STEP 5 PART C.3 |
| Operational Workspace | Action Buttons | Action Component | STEP 5 PART C.4 |
| Operational Workspace | Pagination | Navigation Component | STEP 5 PART C.5 |
| Decision Support Area | Right Information Panel | Container Component | STEP 5 PART D.1 |
| Decision Support Area | SLA Overview | Widget Component | STEP 5 PART D.2 |
| Decision Support Area | Escalation Alert | Widget Component | STEP 5 PART D.3 |

---

## 4.11 Component Dependency

Dashboard Component memiliki hubungan sebagai berikut.

```text
Dashboard

├── Summary Area
│
│   ├── Page Header
│   └── Summary Cards
│
├── Operational Workspace
│
│   ├── Document Register Panel
│   │
│   ├── Panel Header
│   ├── Search
│   ├── Filter
│   ├── Sort
│   ├── Document Register Table
│   ├── Action Buttons
│   └── Pagination
│
└── Decision Support Area
    │
    ├── SLA Overview
    └── Escalation Alert
```

---

## 4.11 Component Hierarchy

Dashboard Component menggunakan struktur hierarki berikut.

```text
Dashboard

↓

Area

↓

Panel

↓

Widget

↓

Table

↓

Action

↓

Element
```

Hierarki ini menjadi acuan implementasi Frontend Component Architecture.

---

## 4.11 Acceptance Criteria

Dashboard Component Inventory dinyatakan memenuhi spesifikasi apabila:

- Seluruh Component Dashboard terdokumentasi.
- Setiap Component memiliki Detail Reference.
- Tidak terdapat Component yang tidak memiliki spesifikasi.
- Seluruh Component mengikuti Approved UI Design Mockup.

# ==============================================================================
# PART 4 — Dashboard Module
# STEP 10 — Acceptance Criteria
# ==============================================================================

## 4.12 Overview

Acceptance Criteria mendefinisikan kondisi yang harus dipenuhi agar Dashboard Module dinyatakan selesai dan memenuhi spesifikasi PRD.

Acceptance Criteria digunakan sebagai acuan utama pada proses:

- User Acceptance Test (UAT)
- System Integration Test (SIT)
- Quality Assurance (QA)
- Frontend Development Review
- Product Owner Review

Acceptance Criteria tidak menggantikan Functional Requirements, Business Rules, Validation Rules, maupun Permission Rules.

Acceptance Criteria merupakan verifikasi akhir terhadap seluruh spesifikasi Dashboard.

---

## 4.12 Purpose

Acceptance Criteria dikembangkan untuk:

- Menentukan Definition of Done Dashboard Module.
- Menjadi checklist akhir implementasi Dashboard.
- Menjadi acuan proses QA dan UAT.
- Memastikan implementasi sesuai PRD.

---

## 4.12 Acceptance Categories

Acceptance Criteria Dashboard dibagi menjadi tujuh kategori.

| Category | Description |
|----------|-------------|
| Layout | Struktur Dashboard sesuai Approved UI Design Mockup. |
| Functional | Seluruh fungsi Dashboard berjalan sesuai Functional Requirements. |
| Business Rules | Dashboard mematuhi seluruh Business Rules. |
| Validation | Dashboard memenuhi seluruh Validation Rules. |
| Permission | Dashboard menerapkan seluruh Permission Rules. |
| Data Integrity | Dashboard menampilkan data yang konsisten. |
| UI Consistency | Dashboard mengikuti Design System dan UI Guidelines. |

---

## 4.12 Acceptance Criteria Matrix

| AC ID | Category | Acceptance Criteria | Verification Reference |
|--------|----------|---------------------|------------------------|
| AC-DASH-001 | Layout | Dashboard Layout sesuai Approved UI Design Mockup. | STEP 2 |
| AC-DASH-002 | Layout | Summary Area, Operational Workspace, dan Decision Support Area ditampilkan sesuai Blueprint Dashboard. | STEP 2 |
| AC-DASH-003 | Functional | Seluruh Functional Requirement telah diimplementasikan. | STEP 5 |
| AC-DASH-004 | Functional | Seluruh Dashboard Component tersedia sesuai Component Inventory. | STEP 9 |
| AC-DASH-005 | Business Rules | Dashboard mematuhi seluruh Business Rules. | STEP 6 |
| AC-DASH-006 | Validation | Dashboard memenuhi seluruh Validation Rules. | STEP 7 |
| AC-DASH-007 | Permission | Dashboard menerapkan seluruh Permission Rules. | STEP 8 |
| AC-DASH-008 | Data Integrity | Dashboard menampilkan data yang konsisten dengan Dashboard Data Mapping. | STEP 4 |
| AC-DASH-009 | Data Integrity | Dashboard tidak mengubah Business Data di luar Workflow Action yang diizinkan. | BUSINESS-WORKFLOW.md |
| AC-DASH-010 | UI Consistency | Seluruh icon mengikuti Icon System proyek. | ICON-SYSTEM.md |
| AC-DASH-011 | UI Consistency | Seluruh komponen mengikuti UI Guidelines dan Design Tokens. | UI-GUIDELINES.md |
| AC-DASH-012 | UI Consistency | Seluruh tampilan konsisten dengan Approved UI Design Mockup. | UI-GUIDELINES.md |

---

## 4.12 Definition of Done

Dashboard Module dinyatakan selesai apabila seluruh kondisi berikut terpenuhi.

### Layout

- Seluruh struktur Dashboard sesuai Approved UI Design Mockup.
- Tidak terdapat perbedaan layout yang signifikan.
- Responsive Layout berjalan sesuai spesifikasi.

---

### Functional

- Seluruh fitur Dashboard berjalan sesuai Functional Requirements.
- Tidak terdapat fungsi utama yang belum diimplementasikan.

---

### Business Rules

- Dashboard tidak mengimplementasikan Business Logic.
- Dashboard mematuhi seluruh Business Rules.

---

### Validation

- Seluruh Validation Rules berhasil dipenuhi.
- Tidak terdapat Validation Error pada Dashboard.

---

### Permission

- Seluruh Permission mengikuti ACCESS-CONTROL.md.
- Dashboard tidak menampilkan informasi di luar hak akses pengguna.

---

### Data Integrity

- Seluruh data berasal dari Dashboard Data Mapping.
- Dashboard tidak menampilkan data yang bertentangan dengan BUSINESS-WORKFLOW.md.

---

### UI Consistency

- Seluruh icon menggunakan Icon System resmi proyek.
- Seluruh warna mengikuti Design Tokens.
- Seluruh komponen mengikuti UI Guidelines.
- Seluruh tampilan identik dengan Approved UI Design Mockup.

---

## 4.12 Final Acceptance Statement

Dashboard Module dinyatakan **Accepted** apabila:

- Seluruh Acceptance Criteria berstatus **Pass**.
- Tidak terdapat Business Rule yang dilanggar.
- Tidak terdapat Functional Requirement yang belum diimplementasikan.
- Tidak terdapat Validation Rule yang gagal.
- Tidak terdapat Permission Rule yang gagal.
- Layout sesuai Approved UI Design Mockup.
- Dashboard memenuhi seluruh spesifikasi yang didefinisikan pada PART 4.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 1 — Module Overview
# ==============================================================================

# 5.1 Module Overview

## 5.1.1 Overview

Document Register Module merupakan modul operasional utama pada Engineering Document Management System (EDMS).

Modul ini digunakan untuk mengelola seluruh siklus hidup (Document Lifecycle) Engineering Document, mulai dari pembuatan dokumen, pengelolaan metadata, proses review, revisi dokumen, hingga dokumen mencapai status Approved / Final As-Built.

Document Register menjadi pusat aktivitas seluruh Business Workflow yang telah didefinisikan pada BUSINESS-WORKFLOW.md.

---

## 5.1.2 Module Position

Document Register merupakan bagian dari menu utama aplikasi.

```text
Engineering Document Management System

│

├── Dashboard

├── Document Register
│
│   ├── PFD
│   └── P&ID
│
├── SLA Monitoring

├── Notification

└── Administration
```

Menu **PFD** dan **P&ID** merupakan dua halaman operasional yang berada di dalam Document Register Module.

---

## 5.1.3 Business Objective

Document Register Module dikembangkan untuk:

- Menjadi pusat pengelolaan seluruh Engineering Document.
- Menjadi titik awal Business Workflow Document Review.
- Menjadi tempat pengguna membuat Document baru.
- Menjadi tempat pengguna memperbarui metadata Document.
- Menjadi tempat pengguna mengunggah revisi Document.
- Menjadi tempat Reviewer melakukan proses Review.
- Menjadi sumber utama informasi Document bagi Dashboard dan modul lainnya.

---

## 5.1.4 Module Scope

Ruang lingkup Document Register Module meliputi:

- PFD Page
- P&ID Page
- Document Register Table
- Create Document Modal
- Edit Document Modal
- View Document
- Download Document
- Comment
- Workflow Actions
- Search
- Filter
- Sort
- Pagination

Modul ini tidak mencakup implementasi Dashboard, Authentication, maupun SLA Monitoring.

---

## 5.1.5 Drawing Context

Document Register menggunakan konsep **Drawing Context**.

Pada versi saat ini terdapat dua Drawing Context:

- PFD
- P&ID

Drawing Context menentukan jenis dokumen yang sedang dikelola oleh pengguna.

Drawing Context diperoleh secara otomatis berdasarkan halaman yang sedang dibuka.

Contoh:

| Active Page | Drawing Context |
|-------------|-----------------|
| PFD | PFD |
| P&ID | P&ID |

Pengguna tidak perlu memilih nilai Drawing secara manual.

Nilai Drawing akan ditetapkan otomatis oleh sistem ketika Document dibuat.

---

## 5.1.6 Module Principles

Document Register Module mengikuti prinsip berikut.

### A. Context Driven

Perilaku halaman mengikuti Drawing Context yang sedang aktif.

Sebagai contoh:

- Halaman PFD menghasilkan Document dengan Drawing = PFD.
- Halaman P&ID menghasilkan Document dengan Drawing = P&ID.

---

### B. Workflow Driven

Status Document tidak ditentukan oleh pengguna.

Seluruh perubahan Status mengikuti BUSINESS-WORKFLOW.md.

---

### C. Revision Driven

Revision tidak diinput secara manual.

Revision ditentukan oleh Business Workflow.

---

### D. Operational Module

Document Register merupakan modul operasional.

Seluruh aktivitas Create, Read, Update, Delete, Review, dan Upload Revision dilakukan melalui modul ini.

---

## 5.1.7 Module Architecture

```text
Document Register Module

│

├── PFD Page

│   ├── Create Document
│   ├── Edit Document
│   ├── Document Register Table
│   ├── Workflow Actions
│   └── Document Operations

│

└── P&ID Page

    ├── Create Document
    ├── Edit Document
    ├── Document Register Table
    ├── Workflow Actions
    └── Document Operations
```

Kedua halaman menggunakan Business Rules, Workflow, Layout, dan Functional Requirements yang sama.

Perbedaan hanya terdapat pada **Drawing Context**.

---

## 5.1.8 Design Principles

Document Register Module mengikuti prinsip desain berikut.

- Menggunakan Global Layout yang telah didefinisikan pada PART 2.
- Menggunakan Theme, Color Palette, Typography, dan Spacing sesuai UI Guidelines.
- Menggunakan Icon System resmi proyek.
- Menggunakan Layout yang konsisten antara halaman PFD dan P&ID.
- Mengikuti Approved UI Design Mockup sebagai Visual Source of Truth.

---

## 5.1.9 Out of Scope

Hal-hal berikut tidak termasuk ruang lingkup Document Register Module.

- Dashboard Monitoring
- Authentication
- User Management
- Authorization Catalog / Permission Reference (Historical Reference)
- SLA Monitoring
- Notification Management
- Backend Implementation
- Database Design
- REST API
- JWT Authentication

Seluruh implementasi Backend akan didefinisikan pada dokumentasi implementasi yang terpisah.

---

## 5.1.10 Success Criteria

Document Register Module dinyatakan memenuhi tujuan modul apabila:

- Pengguna dapat mengelola Engineering Document melalui halaman PFD maupun P&ID.
- Seluruh Business Workflow mengikuti BUSINESS-WORKFLOW.md.
- Pengguna tidak perlu memilih Drawing secara manual.
- Status dan Revision selalu ditentukan oleh Business Workflow.
- Seluruh tampilan mengikuti Approved UI Design Mockup.
- Modul dapat diimplementasikan menggunakan Mock Data maupun Backend tanpa mengubah spesifikasi UI.


# ==============================================================================
# PART 5 — Document Register Module
# STEP 2 — Screen Layout Blueprint
# ==============================================================================

# 5.2 Screen Layout Blueprint

## 5.2.1 Overview

Document Register Module menggunakan **Application Layout Architecture** yang telah didefinisikan pada **Section 2.5** sebagai **Layout Source of Truth**.

Seluruh Product Module pada EDMS wajib menggunakan Application Layout Architecture yang sama.

Document Register Module **tidak diperbolehkan** mengubah struktur Application Layout.

Perubahan hanya diperbolehkan pada **Main Content Area**.

---

## 5.2.2 Screen Philosophy

Document Register merupakan **Operational Workspace** yang digunakan pengguna untuk mengelola seluruh Engineering Document sesuai BUSINESS-WORKFLOW.md.

Halaman ini menjadi pusat aktivitas operasional pengguna, mulai dari membuat dokumen baru, mengelola metadata, mengunggah revisi dokumen, melakukan review, hingga mengakses riwayat dokumen.

Seluruh aktivitas operasional dilakukan melalui **Main Content Area**.

---

## 5.2.3 Application Layout Reference

Referensi Layout untuk Document Register mengacu pada:

**Section 2.5 — Application Layout Architecture**

**Subsection: Application Layout Blueprint**

Komponen berikut **tidak didefinisikan kembali** pada PART 5 karena telah menjadi bagian dari Application Layout Architecture.

- Sidebar Header
- Sidebar Navigation
- Sidebar Footer
- Top Navigation
- Footer

PART 5 hanya mendefinisikan struktur **Main Content Area**.

---

## 5.2.4 Screen Blueprint

### Global Layout

```text
Referensi :

Section 2.5 — Application Layout Architecture

Subsection :
Application Layout Blueprint

Seluruh komponen berikut mengikuti blueprint tersebut.

• Sidebar Header
• Sidebar Navigation
• Sidebar Footer
• Top Navigation
• Footer
```

---

### Main Content Blueprint

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐

BIM ENGINEERING

Document Register

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

PFD

Manage all engineering documents based on PFD drawings.

                                                                                               ┌───────────────┐
                                                                                               │ Create PFD    │
                                                                                               └───────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Document Register Table                                                                                       │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                │
│ Search                         Filter Status             Sort By                Page Size                      │
│ ┌───────────────────────┐      ┌───────────────┐         ┌──────────────┐      ┌──────────┐                  │
│ │ Search document...     │      │ All Status ▼ │         │ Document No ▼│      │ 10 ▼     │                  │
│ └───────────────────────┘      └───────────────┘         └──────────────┘      └──────────┘                  │
│                                                                                                                │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ No │ Document Number │ Description │ Revision │ Status │ Actions                                                │
├────┼─────────────────┼─────────────┼──────────┼────────┼────────────────────────────────────────────────────────┤
│ 1  │ P-XXX-001       │ ........... │ IFR      │ ...... │ View │ Edit │ Download │ Delete │ Comment │ A B C     │
│ 2  │ P-XXX-002       │ ........... │ IFA      │ ...... │ View │ Edit │ Download │ Delete │ Comment │ A B C     │
│ 3  │ P-XXX-003       │ IFC         │ ......   │ ...... │ View │ Edit │ Download │ Delete │ Comment │ History   │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Showing 1 to 10 of xx entries                                            Previous   1   2   Next              │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Layout Notes

#### Application Layout

Mengikuti spesifikasi pada:

**Section 2.5 — Application Layout Architecture**

Subsection:

**Application Layout Blueprint**

---

#### Main Content Area

Main Content Area terdiri dari:

- Module Header
- Drawing Context Header
- Create Button
- Document Register Panel
- Toolbar
- Document Register Table
- Pagination

Seluruh implementasi visual mengikuti **Approved UI Design Mockup**.

---

## 5.2.5 Drawing Context Layout

Document Register menggunakan konsep **Drawing Context**.

Pada versi saat ini terdapat dua Drawing Context.

| Component | PFD | P&ID |
|------------|-----|-------|
| Module Header | Document Register | Document Register |
| Drawing Context Title | PFD | P&ID |
| Page Description | Drawing PFD | Drawing P&ID |
| Create Button | Create PFD | Create P&ID |
| Create Modal | Create PFD | Create P&ID |
| Edit Modal | Edit PFD | Edit P&ID |
| Document Data | Drawing = PFD | Drawing = P&ID |

Selain komponen di atas, seluruh Layout harus identik.

---

## 5.2.6 Main Content Structure

Main Content Area terdiri dari dua bagian utama.

### A. Page Header

Menampilkan identitas halaman aktif.

Komponen:

- Module Label (BIM ENGINEERING)
- Module Title (Document Register)
- Drawing Context Title (PFD / P&ID)
- Page Description

---

### B. Document Register Panel

Merupakan area operasional utama.

Panel terdiri dari:

#### Panel Header

```text
Document Register Table
```

#### Toolbar

Toolbar digunakan untuk membantu pengguna menemukan dan mengelola dokumen.

Komponen:

- Search
- Status Filter
- Sort By
- Page Size
- Create Button

---

#### Document Register Table

Menampilkan daftar Engineering Document sesuai Drawing Context.

Spesifikasi kolom tabel dijelaskan pada **STEP 5 — Functional Requirements**.

---

#### Pagination

Digunakan untuk navigasi halaman Document Register.

---

## 5.2.7 Layout Principles

### A. Application Layout Consistency

Seluruh struktur halaman mengikuti **Section 2.5 — Application Layout Architecture**.

---

### B. Drawing Context Consistency

Layout PFD dan P&ID harus identik.

Perbedaan hanya terdapat pada:

- Drawing Context
- Page Description
- Create/Edit Modal Title
- Document Data

---

### C. Operational Focus

Document Register Panel merupakan area operasional utama.

Seluruh aktivitas Create, Edit, Delete, Review, Download, Comment, Upload Revision, dan Workflow dilakukan melalui panel ini.

---

### D. Responsive Layout

Layout mengikuti Responsive Rules yang telah didefinisikan pada UI Guidelines.

---

## 5.2.8 Layout Constraints

Document Register wajib memenuhi ketentuan berikut.

- Menggunakan Application Layout Architecture pada **Section 2.5**.
- Tidak diperbolehkan mengubah Sidebar.
- Tidak diperbolehkan mengubah Top Navigation.
- Tidak diperbolehkan mengubah Footer.
- Menggunakan Theme Website baru.
- Menggunakan Design Tokens resmi proyek.
- Menggunakan Icon System resmi proyek.
- Mengikuti Approved UI Design Mockup sebagai Visual Source of Truth.

---

## 5.2.9 Navigation Relationship

```text
Sidebar Navigation

        │

        ▼

Document Register

        │

   ┌────┴────┐

   ▼         ▼

 PFD       P&ID

   │         │

   └────┬────┘

        ▼

Document Register Panel
```

---

## 5.2.10 Acceptance Criteria

Screen Layout Blueprint dinyatakan memenuhi spesifikasi apabila:

- Menggunakan Application Layout Architecture pada **Section 2.5**.
- Main Content Area mengikuti Blueprint pada PART 5.
- Layout PFD dan P&ID identik.
- Perbedaan hanya terdapat pada Drawing Context.
- Document Register Panel menjadi pusat aktivitas operasional.
- Seluruh tampilan mengikuti Approved UI Design Mockup.


# ==============================================================================
# PART 5 — Document Register Module
# STEP 3 — Screen Sections
# ==============================================================================

# 5.3 Screen Sections

## 5.3.1 Overview

Document Register Module dibagi menjadi beberapa Screen Section berdasarkan fungsi operasional yang dilakukan oleh pengguna.

Setiap Screen Section memiliki tanggung jawab yang berbeda dan bekerja secara terintegrasi untuk mendukung proses pengelolaan Engineering Document.

---

## 5.3.2 Screen Section Hierarchy

```text
Main Content Area

│

├── Page Header

├── Action Area

└── Document Register Panel
```

---

## 5.3.3 Page Header

Page Header merupakan identitas halaman yang sedang dibuka.

Komponen yang ditampilkan:

- Module Label
- Module Title
- Drawing Context Title
- Page Description

Contoh:

```text
BIM ENGINEERING

Document Register

PFD

Manage all engineering documents based on PFD drawings.
```

Drawing Context mengikuti halaman yang sedang aktif.

---

## 5.3.4 Action Area

Action Area merupakan area yang menyediakan aksi utama terhadap halaman.

Pada versi saat ini Action Area hanya terdiri dari:

- Create Button

Contoh:

```text
[ Create PFD ]
```

atau

```text
[ Create P&ID ]
```

Nama tombol mengikuti Drawing Context.

Action Area ditempatkan pada bagian kanan atas Main Content Area.

---

## 5.3.5 Document Register Panel

Document Register Panel merupakan area operasional utama.

Panel ini menjadi pusat seluruh aktivitas pengelolaan Engineering Document.

Panel terdiri dari beberapa Sub Section.

```text
Document Register Panel

│

├── Panel Header

├── Toolbar

├── Document Register Table

└── Pagination
```

---

## 5.3.6 Panel Header

Panel Header digunakan untuk mengidentifikasi isi panel.

Komponen:

```text
Document Register Table
```

Panel Header selalu ditampilkan.

---

## 5.3.7 Toolbar

Toolbar menyediakan kontrol untuk membantu pengguna menemukan Engineering Document.

Komponen Toolbar terdiri dari:

- Search
- Status Filter
- Sort By
- Page Size

Toolbar tidak melakukan perubahan terhadap data.

Toolbar hanya mempengaruhi tampilan Document Register Table.

---

## 5.3.8 Document Register Table

Document Register Table menampilkan daftar Engineering Document sesuai Drawing Context yang sedang aktif.

Data yang ditampilkan mengikuti hasil Search, Filter, Sort, dan Pagination.

Struktur kolom tabel dijelaskan pada STEP 5 — Functional Requirements.

---

## 5.3.9 Pagination

Pagination digunakan untuk berpindah halaman ketika jumlah Document melebihi kapasitas Page Size.

Pagination selalu berada di bagian bawah Document Register Panel.

---

## 5.3.10 Section Relationship

```text
Page Header

↓

Action Area

↓

Document Register Panel

        │

        ├── Toolbar

        ├── Table

        └── Pagination
```

---

## 5.3.11 Design Principles

Setiap Screen Section wajib memenuhi ketentuan berikut.

### Consistency

Mengikuti Application Layout Architecture pada Section 2.5.

---

### Operational Focus

Document Register Panel menjadi pusat aktivitas operasional.

---

### Drawing Context Awareness

Seluruh informasi yang ditampilkan mengikuti Drawing Context yang sedang aktif.

---

### Responsive Layout

Setiap Screen Section mengikuti Responsive Rules pada UI Guidelines.

---

## 5.3.12 Acceptance Criteria

STEP 3 dinyatakan memenuhi spesifikasi apabila:

- Screen Section mengikuti Screen Blueprint pada STEP 2.
- Setiap Section memiliki fungsi yang jelas.
- Action Area hanya berisi aksi utama halaman.
- Toolbar hanya digunakan sebagai kontrol tampilan data.
- Document Register Panel menjadi pusat aktivitas operasional.
- Seluruh tampilan mengikuti Approved UI Design Mockup.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 4 — Document Information Model
# ==============================================================================

# 5.4 Document Information Model

## 5.4.1 Overview

Document Information Model mendefinisikan seluruh informasi bisnis (Business Information) yang dimiliki oleh sebuah Engineering Document.

Model ini menjadi **Single Source of Truth** untuk seluruh informasi yang digunakan pada Document Register Module.

Document Information Model digunakan sebagai referensi utama bagi:

- Document Register Table
- Create Document Modal
- Edit Document Modal
- View Document
- BUSINESS-WORKFLOW.md
- BACKEND-READY-SCHEMA.md (Historical Reference / Unavailable)
- API-CONTRACT.md
- LOCAL-STORAGE-API.md (Historical Reference / Unavailable)

Document Information Model **bukan** merupakan desain Database maupun API.

Model ini hanya mendefinisikan **Business Information** yang dikelola oleh sistem.

---

## 5.4.2 Information Classification

Seluruh Document Information dikelompokkan menjadi empat kategori utama.

```text
Engineering Document

│

├── User Input Information

├── System Generated Information

├── Workflow Information

└── Storage Information
```

---

## 5.4.3 User Input Information

Informasi yang berasal langsung dari input pengguna.

| Document Information | Description |
|----------------------|-------------|
| Upload Document | File Engineering Document yang diunggah oleh pengguna. |
| Document Number | Nomor Engineering Document yang unik dalam scope Project. |
| Description | Deskripsi singkat Engineering Document. |
| Area | Area atau lokasi Engineering Document. |
| Days Until Validation | Target hari proses validasi pertama yang digunakan sebagai dasar SLA Timer. |

---

## 5.4.4 System Generated Information

Informasi yang dihasilkan otomatis oleh sistem.

| Document Information | Description |
|----------------------|-------------|
| Drawing | Ditentukan otomatis berdasarkan Drawing Context (PFD / P&ID). |
| NAS Location | Lokasi penyimpanan file yang dihasilkan setelah proses upload berhasil. |
| Created Date | Tanggal pembuatan Document. |
| Created By | Pengguna yang membuat Document. |
| Last Updated | Waktu perubahan terakhir. |
| Last Updated By | Pengguna terakhir yang melakukan perubahan. |
| Project ID | Identifier Project yang memiliki Engineering Document dan ditetapkan otomatis dari Active Project. |

---

## 5.4.5 Workflow Information

Informasi yang sepenuhnya dikendalikan oleh BUSINESS-WORKFLOW.md.

| Document Information | Description |
|----------------------|-------------|
| Revision | Dihasilkan otomatis mengikuti Business Workflow. |
| Status | Dihasilkan otomatis mengikuti Business Workflow. |
| Current Assignee | Resolved display assignee untuk monitoring, Dashboard, SLA, Escalation, dan Notification Display. |
| SLA Timer | Waktu berjalan berdasarkan Business Workflow. |
| SLA Status | Status SLA (`On Track`, `At Risk`, `Overdue`, `Final As-Built`). Istilah `Done` hanya boleh digunakan sebagai display wording timer selesai. |

Workflow Information **tidak dapat diubah secara langsung oleh pengguna.**

---

## 5.4.6 Storage Information

Informasi mengenai penyimpanan file Engineering Document.

| Document Information | Description |
|----------------------|-------------|
| Original File Name | Nama asli file yang diunggah pengguna. |
| File Type | Jenis file (PDF, DWG, dan format lain yang didukung). |
| File Size | Ukuran file. |
| NAS Location | Lokasi penyimpanan file pada NAS. |

Storage Information dikelola otomatis oleh sistem.

---

## 5.4.7 Information Ownership

| Information Category | Managed By |
|----------------------|------------|
| User Input Information | User |
| Workflow Information | BUSINESS-WORKFLOW |
| System Generated Information | System |
| Storage Information | System |

---

## 5.4.8 Information Lifecycle

```text
Create Document

↓

User Input Information

↓

System Generated Information

↓

Workflow Information

↓

Storage Information

↓

Engineering Document
```

Seluruh kategori informasi tersebut membentuk satu entitas **Engineering Document**.

---

## 5.4.9 Information Availability

Setiap informasi memiliki lokasi penggunaan yang berbeda.

| Document Information | Create | Edit | Table | View | Workflow |
|----------------------|:------:|:----:|:-----:|:----:|:--------:|
| Upload Document | ✓ | ✓ | — | ✓ | ✓ |
| Document Number | ✓ | ✓ | ✓ | ✓ | — |
| Description | ✓ | ✓ | ✓ | ✓ | — |
| Area | ✓ | ✓ | — | ✓ | — |
| Days Until Validation | ✓ | ✓ | — | ✓ | ✓ |
| Drawing | Auto | Auto | ✓ | ✓ | ✓ |
| Revision | Auto | Auto | ✓ | ✓ | ✓ |
| Status | Auto | Auto | ✓ | ✓ | ✓ |
| Current Assignee | — | — | ✓ | ✓ | ✓ |
| SLA Timer | — | — | ✓ | ✓ | ✓ |
| SLA Status | — | — | — | ✓ | ✓ |
| NAS Location | Auto | Auto | — | ✓ | — |
| Project ID | Auto | Auto | — | ✓ | ✓ |

---

## 5.4.10 Business Principles

Document Information Model mengikuti prinsip berikut.

### A. Single Source of Truth

Seluruh definisi Document Information hanya boleh memiliki satu referensi resmi.

---

### B. Workflow Driven

Revision, Status, Current Assignee, SLA Timer, dan SLA Status hanya boleh berubah melalui BUSINESS-WORKFLOW.md.

---

### C. Context Driven

Drawing ditentukan otomatis berdasarkan Drawing Context (PFD atau P&ID).

Pengguna tidak memilih Drawing secara manual.

---

### D. Project Context Driven

Setiap Engineering Document wajib dimiliki oleh satu Project.

Project ID ditetapkan secara otomatis berdasarkan Active Project ketika Document dibuat.

Pengguna tidak memilih maupun mengubah Project melalui Create Document Modal atau Edit Document Modal.

Document tidak dapat dipindahkan ke Project lain melalui Edit Document maupun Workflow Action.

Seluruh query Document Register wajib dibatasi berdasarkan Active Project.

Document ID tetap unik secara global sebagai identifier internal sistem.

Document Number wajib unik dalam satu Project dan boleh digunakan kembali pada Project lain.

Validasi duplicate Document Number wajib menggunakan kombinasi Project ID dan Document Number.

---

### E. Project Data Isolation

Document dari satu Project tidak boleh ditampilkan, diproses, maupun diubah pada Project lain.

Project Data Isolation wajib diterapkan pada:

- Document Register Table.
- Create Document.
- Edit Document.
- View Document.
- Download Document.
- Workflow Action.
- Upload Revision.
- Comment.
- History.

---

### F. Automatic Generation

Informasi yang dapat dihasilkan oleh sistem tidak boleh diminta sebagai input pengguna.

---

### G. Separation of Responsibility

Input pengguna harus dipisahkan secara jelas dari informasi yang dihasilkan oleh System maupun BUSINESS-WORKFLOW.

---

## 5.4.11 Cross Reference

Document Information Model menjadi referensi utama bagi:

- STEP 5 — Functional Requirements
- STEP 7 — Validation Rules
- BUSINESS-WORKFLOW.md
- BACKEND-READY-SCHEMA.md (Historical Reference / Unavailable)
- API-CONTRACT.md
- LOCAL-STORAGE-API.md (Historical Reference / Unavailable)

---

## 5.4.12 Master Information Matrix

Master Information Matrix merupakan **Information Dictionary** resmi untuk seluruh Engineering Document.

Seluruh Feature pada PART 5 wajib mengacu pada matriks ini dan tidak diperbolehkan mendefinisikan ulang karakteristik informasi yang sama.

| Document Information | Source | Display Location | Editable | Required | Validation Reference | Business Owner |
|----------------------|--------|------------------|:--------:|:--------:|----------------------|----------------|
| Upload Document | User | Create, Edit, View | ✓ | **Create:** ✓<br>**Edit:** Optional | STEP 7 — Validation Rules | User |
| Document Number | User | Create, Edit, Table, View | ✓ | ✓ | STEP 7 — Validation Rules | User |
| Description | User | Create, Edit, Table, View | ✓ | ✓ | STEP 7 — Validation Rules | User |
| Area | User | Create, Edit, View | ✓ | ✓ | STEP 7 — Validation Rules | User |
| Days Until Validation | User | Create, Edit, View | ✓ | ✓ | STEP 7 — Validation Rules | User |
| Drawing | System (Drawing Context) | Table, View | ✗ | Auto | BUSINESS-WORKFLOW.md | System |
| Revision | BUSINESS-WORKFLOW | Table, View | ✗ | Auto | BUSINESS-WORKFLOW.md | BUSINESS-WORKFLOW |
| Status | BUSINESS-WORKFLOW | Table, View | ✗ | Auto | BUSINESS-WORKFLOW.md | BUSINESS-WORKFLOW |
| Current Assignee | BUSINESS-WORKFLOW | Table, View | ✗ | Auto | BUSINESS-WORKFLOW.md | BUSINESS-WORKFLOW |
| SLA Timer | BUSINESS-WORKFLOW | Table, View | ✗ | Auto | BUSINESS-WORKFLOW.md | BUSINESS-WORKFLOW |
| SLA Status | BUSINESS-WORKFLOW | View | ✗ | Auto | BUSINESS-WORKFLOW.md | BUSINESS-WORKFLOW |
| NAS Location | System | View | ✗ | Auto | Storage Rule | System |
| Created Date | System | View | ✗ | Auto | System Generated | System |
| Created By | System | View | ✗ | Auto | System Generated | System |
| Last Updated | System | View | ✗ | Auto | System Generated | System |
| Last Updated By | System | View | ✗ | Auto | System Generated | System |
| Original File Name | Storage | View | ✗ | Auto | Storage Rule | System |
| File Type | Storage | View | ✗ | Auto | Storage Rule | System |
| File Size | Storage | View | ✗ | Auto | Storage Rule | System |
| Project ID | System (Active Project) | View | ✗ | Auto | BUSINESS-WORKFLOW.md → Multi Project Context | System |

---

### Matrix Rules

#### A. Single Source of Truth

Master Information Matrix merupakan referensi resmi seluruh karakteristik Document Information.

---

#### B. Source Rule

| Source | Description |
|---------|-------------|
| User | Nilai berasal dari input pengguna. |
| System | Nilai dihasilkan otomatis oleh sistem. |
| BUSINESS-WORKFLOW | Nilai mengikuti BUSINESS-WORKFLOW.md. |
| Storage | Nilai berasal dari sistem penyimpanan file. |

---

#### C. Display Location Rule

Display Location menunjukkan lokasi dimana informasi dapat ditampilkan.

Lokasi yang digunakan pada PART 5 meliputi:

- Create Modal
- Edit Modal
- Document Register Table
- View Document

---

#### D. Editable Rule

| Value | Description |
|-------|-------------|
| ✓ | Nilai dapat diubah oleh pengguna. |
| ✗ | Nilai hanya dapat diubah oleh System atau BUSINESS-WORKFLOW. |

---

#### E. Required Rule

| Value | Description |
|-------|-------------|
| ✓ | Wajib diisi pengguna. |
| Optional | Tidak wajib diisi. |
| Auto | Dihasilkan otomatis oleh System atau BUSINESS-WORKFLOW. |

Catatan:

- Upload Document **wajib** pada Create Modal.
- Upload Document **opsional** pada Edit Modal.

---

#### F. Validation Reference

Kolom Validation Reference menunjukkan referensi aturan validasi setiap informasi.

Seluruh detail validasi didefinisikan pada:

**STEP 7 — Validation Rules**

---

#### G. Business Owner

Business Owner menunjukkan pihak yang bertanggung jawab terhadap nilai suatu informasi.

| Business Owner | Description |
|----------------|-------------|
| User | Nilai berasal dari input pengguna. |
| System | Nilai dihasilkan otomatis oleh sistem. |
| BUSINESS-WORKFLOW | Nilai mengikuti BUSINESS-WORKFLOW.md. |

---

#### H. Cross Reference

Master Information Matrix menjadi referensi utama bagi:

- STEP 5 — Functional Requirements
- STEP 7 — Validation Rules
- BUSINESS-WORKFLOW.md
- BACKEND-READY-SCHEMA.md (Historical Reference / Unavailable)
- API-CONTRACT.md
- LOCAL-STORAGE-API.md (Historical Reference / Unavailable)

Seluruh perubahan terhadap Document Information wajib dilakukan pada matriks ini terlebih dahulu sebelum diterapkan pada Feature lainnya.

---

## 5.4.13 Acceptance Criteria

STEP 4 dinyatakan selesai apabila:

- Seluruh Document Information telah terdefinisi.
- Setiap Document Information memiliki Source yang jelas.
- Setiap Document Information memiliki Display Location yang jelas.
- Setiap Document Information memiliki status Editable yang jelas.
- Setiap Document Information memiliki aturan Required yang jelas.
- Setiap Document Information memiliki Validation Reference yang jelas.
- Workflow Information mengikuti BUSINESS-WORKFLOW.md.
- Master Information Matrix menjadi Single Source of Truth bagi seluruh Document Information pada Document Register Module.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART A — Page Header
# ==============================================================================

# 5.5 Functional Requirements

# PART A — Page Header

## 5.5.1 Overview

Page Header merupakan komponen pertama yang ditampilkan pada Main Content Area.

Komponen ini berfungsi memberikan identitas halaman berdasarkan Drawing Context yang sedang aktif.

Page Header tidak memiliki fungsi operasional secara langsung, namun berfungsi sebagai orientasi visual sehingga pengguna selalu mengetahui modul dan Drawing Context yang sedang digunakan.

---

## 5.5.2 UI Wireframe

```text
Main Content Area

──────────────────────────────────────────────────────────────────────────────

BIM ENGINEERING

Document Register

──────────────────────────────────────────────────────────────────────────────

PFD

Manage all engineering documents based on PFD drawings.
```

Page Header selalu berada pada bagian paling atas Main Content Area.

---

## 5.5.3 Component Structure

```text
Page Header

│

├── Module Label

├── Module Title

├── Drawing Context Title

└── Page Description
```

---

## 5.5.4 Component Specification

| Component | Description |
|------------|-------------|
| Module Label | Menampilkan identitas sistem (BIM ENGINEERING). |
| Module Title | Menampilkan nama modul aktif (Document Register). |
| Drawing Context Title | Menampilkan Drawing Context yang sedang aktif (PFD atau P&ID). |
| Page Description | Menjelaskan fungsi halaman berdasarkan Drawing Context yang sedang aktif. |

---

## 5.5.5 Display Specification

| Component | Display Value |
|------------|---------------|
| Module Label | BIM ENGINEERING |
| Module Title | Document Register |
| Drawing Context Title | PFD atau P&ID |
| Page Description | Kelola seluruh Engineering Document berdasarkan Drawing Context yang sedang aktif. |

Contoh:

### Halaman PFD

```text
BIM ENGINEERING

Document Register

PFD

Manage all engineering documents based on PFD drawings.
```

---

### Halaman P&ID

```text
BIM ENGINEERING

Document Register

P&ID

Manage all engineering documents based on P&ID drawings.
```

---

## 5.5.6 Functional Behaviour

Page Header diperbarui secara otomatis berdasarkan Drawing Context yang sedang aktif.

Komponen berikut bersifat statis:

- Module Label
- Module Title

Komponen berikut bersifat dinamis:

- Drawing Context Title
- Page Description

Perubahan hanya terjadi ketika pengguna berpindah halaman antara PFD dan P&ID.

---

## 5.5.7 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-PH-001 | Module Label selalu menampilkan **BIM ENGINEERING**. |
| BR-PH-002 | Module Title selalu menampilkan **Document Register**. |
| BR-PH-003 | Drawing Context Title mengikuti halaman aktif. |
| BR-PH-004 | Page Description mengikuti Drawing Context yang sedang aktif. |

---

## 5.5.8 Validation Rules

Page Header tidak menerima input dari pengguna.

Tidak terdapat proses validasi.

---

## 5.5.9 Permission Reference

Seluruh Role yang memiliki akses ke halaman PFD atau P&ID dapat melihat seluruh komponen Page Header.

Tidak terdapat pembatasan tampilan berdasarkan Role.

---

## 5.5.10 State Behaviour

| State | Behaviour |
|--------|-----------|
| Initial Load | Menampilkan Drawing Context sesuai halaman yang dibuka. |
| Context Change | Drawing Context Title dan Page Description diperbarui secara otomatis. |
| Browser Refresh | Mempertahankan Drawing Context sesuai URL aktif. |

---

## 5.5.11 Interaction Flow

Walaupun Page Header tidak memiliki interaksi langsung dari pengguna, komponen ini tetap mengikuti perubahan konteks halaman.

```text
User memilih menu

↓

Document Register

↓

PFD / P&ID

↓

System membaca Drawing Context

↓

Page Header diperbarui

├── Module Label
│      (Tetap)
│
├── Module Title
│      (Tetap)
│
├── Drawing Context Title
│      (Berubah)
│
└── Page Description
       (Berubah)
```

Perubahan Page Header terjadi secara otomatis tanpa memerlukan tindakan tambahan dari pengguna.

---

## 5.5.12 Cross Reference

Page Header mengacu pada:

- Section 2.5 — Application Layout Architecture
- Section 5.2 — Screen Layout Blueprint
- Section 5.3 — Screen Sections
- Section 5.4 — Document Information Model

---

## 5.5.13 Acceptance Criteria

Page Header dinyatakan memenuhi spesifikasi apabila:

- Module Label selalu menampilkan **BIM ENGINEERING**.
- Module Title selalu menampilkan **Document Register**.
- Drawing Context Title mengikuti halaman aktif.
- Page Description mengikuti Drawing Context yang sedang aktif.
- Layout mengikuti Approved UI Design Mockup.
- Tidak terdapat perbedaan struktur antara halaman PFD dan P&ID selain Drawing Context.


# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART B — Action Area
# ==============================================================================

# PART B — Action Area

## 5.5.14 Overview

Action Area merupakan area yang menyediakan **Primary Action** pada halaman Document Register.

Primary Action adalah aksi utama yang dapat dilakukan pengguna terhadap halaman yang sedang aktif.

Pada versi saat ini, Action Area hanya menyediakan satu Primary Action, yaitu **Create Document**.

Action Area berada pada bagian kanan atas Main Content Area dan sejajar dengan Page Header.

---

## 5.5.15 UI Wireframe

```text
PFD

Manage all engineering documents based on PFD drawings.


                                                           ┌─────────────────┐
                                                           │  Create PFD     │
                                                           └─────────────────┘
```

atau

```text
P&ID

Manage all engineering documents based on P&ID drawings.


                                                          ┌──────────────────┐
                                                          │  Create P&ID     │
                                                          └──────────────────┘
```

Action Area selalu berada di atas Document Register Panel.

---

## 5.5.16 Component Structure

```text
Action Area

│

└── Primary Action Button

      │

      └── Create Document
```

---

## 5.5.17 Component Specification

| Component | Description |
|-----------|-------------|
| Primary Action Button | Tombol utama untuk membuat Engineering Document baru sesuai Drawing Context yang sedang aktif. |

---

## 5.5.18 Display Specification

| Drawing Context | Button Label |
|-----------------|--------------|
| PFD | Create PFD |
| P&ID | Create P&ID |

Button Label selalu mengikuti Drawing Context.

---

## 5.5.19 Functional Behaviour

Action Area selalu menampilkan satu Primary Action Button.

Ketika pengguna menekan tombol tersebut, sistem membuka Create Document Modal sesuai Drawing Context yang sedang aktif.

Contoh:

Halaman **PFD**

↓

```text
Create PFD
```

↓

Membuka

```text
Create PFD Modal
```

---

Halaman **P&ID**

↓

```text
Create P&ID
```

↓

Membuka

```text
Create P&ID Modal
```

---

## 5.5.20 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-AA-001 | Action Area hanya menampilkan Primary Action yang tersedia pada halaman aktif. |
| BR-AA-002 | Button Label mengikuti Drawing Context. |
| BR-AA-003 | Create Button membuka Create Document Modal sesuai Drawing Context. |
| BR-AA-004 | Primary Action hanya ditampilkan kepada Role yang memiliki hak akses. |

---

## 5.5.21 Validation Rules

Action Area tidak menerima input pengguna.

Tidak terdapat proses validasi.

---

## 5.5.22 Permission Reference

### Official Role Definition

| Role | Description |
|------|-------------|
| **Admin** | Mengelola konfigurasi dan administrasi sistem EDMS. |
| **Document Owner** | Membuat, mengunggah, memperbarui, dan mengelola Engineering Document yang menjadi tanggung jawabnya. |
| **Team Process** | Reviewer tahap pertama yang bertanggung jawab melakukan Process Review dan Process Comment sesuai BUSINESS-WORKFLOW.md. |
| **Team Project** | Reviewer tahap kedua yang bertanggung jawab melakukan Project Review, Project Comment, serta memberikan keputusan akhir sesuai BUSINESS-WORKFLOW.md. |

---

### Create Button Permission

| Official Role | Create Button |
|--------------|:-------------:|
| Admin | ✓ |
| Document Owner | ✓ |
| Team Process | ✗ |
| Team Project | ✗ |

Hak akses rinci akan didefinisikan pada:

**STEP 8 — Permission Matrix**

---

## 5.5.23 State Behaviour

| State | Behaviour |
|--------|-----------|
| Initial Load | Menampilkan Create Button sesuai Drawing Context. |
| Drawing Context Change | Label tombol diperbarui mengikuti Drawing Context. |
| Permission Denied | Create Button tidak ditampilkan. |

---

## 5.5.24 Interaction Flow

```text
User membuka halaman

↓

System membaca Drawing Context

↓

System memeriksa Official Role

↓

Apakah Create Button diperbolehkan?

│

├── Ya
│
│     ↓
│
│  Create Button ditampilkan
│
│     ↓
│
│  User klik Create Button
│
│     ↓
│
│  System membuka
│
│  Create Document Modal
│
│     ↓
│
│  Drawing Context diteruskan
│
│     ↓
│
│  Create PFD Modal
│
│       atau
│
│  Create P&ID Modal
│
└── Tidak
      ↓
   Button disembunyikan
```

---

## 5.5.25 Action Specification

| Action | Trigger | System Response |
|--------|---------|-----------------|
| Create PFD | Click | Membuka Create PFD Modal |
| Create P&ID | Click | Membuka Create P&ID Modal |

---

## 5.5.26 Cross Reference

Action Area mengacu pada:

- Section 2.5 — Application Layout Architecture
- Section 5.2 — Screen Layout Blueprint
- Section 5.3 — Screen Sections
- Section 5.4 — Document Information Model
- PART D — Create Document Modal
- STEP 8 — Permission Matrix
- BUSINESS-WORKFLOW.md

---

## 5.5.27 Acceptance Criteria

Action Area dinyatakan memenuhi spesifikasi apabila:

- Primary Action Button selalu berada pada posisi kanan atas Main Content Area.
- Button Label mengikuti Drawing Context.
- Button hanya ditampilkan kepada Official Role yang memiliki hak akses.
- Tombol membuka Create Document Modal sesuai Drawing Context.
- Seluruh tampilan mengikuti Approved UI Design Mockup.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART C.1 — Document Register Panel Overview
# ==============================================================================

# PART C.1 — Document Register Panel Overview

## 5.5.28 Overview

Document Register Panel merupakan **Operational Workspace** pada Document Register Module.

Panel ini menjadi pusat seluruh aktivitas operasional pengguna dalam mengelola Engineering Document.

Seluruh aktivitas seperti:

- Mencari Document
- Filter Document
- Sort Document
- Mengatur jumlah data per halaman
- Melihat daftar Document
- Menjalankan Document Actions
- Berpindah halaman data

dilakukan melalui Document Register Panel.

Document Register Panel tidak menyimpan data maupun Business Logic.

Panel hanya menjadi media interaksi antara pengguna dengan Engineering Document sesuai BUSINESS-WORKFLOW.md.

---

## 5.5.29 UI Wireframe

```text
┌────────────────────────────────────────────────────────────────────────────────────────────┐

Document Register Table

├────────────────────────────────────────────────────────────────────────────────────────────┤

 Toolbar

 Search        Filter Status        Sort By        Page Size

├────────────────────────────────────────────────────────────────────────────────────────────┤

 Document Register Table

├────────────────────────────────────────────────────────────────────────────────────────────┤

 Pagination

└────────────────────────────────────────────────────────────────────────────────────────────┘
```

Document Register Panel berada tepat di bawah Action Area.

---

## 5.5.30 Component Structure

```text
Document Register Panel

│

├── Panel Header

├── Toolbar

├── Document Register Table

├── Actions Column

└── Pagination
```

Document Register Panel merupakan container bagi seluruh komponen operasional Document Register.

---

## 5.5.31 Component Specification

| Component | Description |
|------------|-------------|
| Panel Header | Menampilkan identitas panel. |
| Toolbar | Menyediakan Search, Filter Status, Sort By, dan Page Size. |
| Document Register Table | Menampilkan daftar Engineering Document. |
| Actions Column | Menampilkan seluruh Document Actions sesuai hak akses pengguna. |
| Pagination | Navigasi halaman data. |

---

## 5.5.32 Display Specification

Document Register Panel wajib menampilkan komponen berikut secara berurutan.

| Order | Component | Mandatory |
|-------|-----------|:---------:|
| 1 | Panel Header | ✓ |
| 2 | Toolbar | ✓ |
| 3 | Document Register Table | ✓ |
| 4 | Pagination | ✓ |

Actions Column merupakan bagian dari Document Register Table dan tidak berdiri sebagai komponen terpisah.

---

## 5.5.33 Functional Behaviour

Document Register Panel bertanggung jawab menampilkan Engineering Document sesuai kondisi halaman aktif.

Isi panel diperbarui berdasarkan:

- Drawing Context
- Search
- Status Filter
- Sort By
- Page Size
- Pagination

Panel tidak mengubah Engineering Document secara langsung.

Perubahan data dilakukan melalui Feature berikut:

- Create Document Modal
- Edit Document Modal
- Document Actions

---

## 5.5.34 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-DRP-001 | Document Register Panel selalu ditampilkan pada halaman PFD dan P&ID. |
| BR-DRP-002 | Panel hanya menampilkan Engineering Document sesuai Drawing Context. |
| BR-DRP-003 | Data yang ditampilkan mengikuti hak akses pengguna. |
| BR-DRP-004 | Document Register Panel menjadi Operational Workspace Document Register Module. |

---

## 5.5.35 Validation Rules

Document Register Panel tidak menerima input Business Data.

Validasi dilakukan oleh komponen yang berada di dalam panel, seperti:

- Toolbar
- Create Document Modal
- Edit Document Modal

---

## 5.5.36 Permission Reference

### Official Role Access

| Official Role | Access Panel |
|---------------|:------------:|
| Admin | ✓ |
| Document Owner | ✓ |
| Team Process | ✓ |
| Team Project | ✓ |

Hak akses terhadap setiap komponen di dalam panel akan dijelaskan pada spesifikasi masing-masing dan dirinci pada **STEP 8 — Permission Matrix**.

---

## 5.5.37 State Behaviour

| State | Behaviour |
|--------|-----------|
| Initial Load | Menampilkan seluruh komponen panel. |
| Search | Memperbarui daftar Document. |
| Filter | Memperbarui daftar Document. |
| Sort | Mengurutkan daftar Document. |
| Page Size | Mengubah jumlah data yang ditampilkan. |
| Pagination | Berpindah halaman data. |
| Drawing Context Change | Memuat ulang daftar Engineering Document sesuai Drawing Context. |

---

## 5.5.38 Interaction Flow

```text
User membuka

Document Register

        │

        ▼

System membaca

Drawing Context

        │

        ▼

System mengambil

Engineering Document

        │

        ▼

Document Register Panel

ditampilkan

        │

        ▼

User menggunakan

Toolbar

(Search / Filter /
Sort / Page Size)

        │

        ▼

System memperbarui

Document Register Table

        │

        ▼

User memilih

Actions Column

(View / Edit /
Download / Comment /
Workflow /
Delete /
History)
```

---

## 5.5.39 Cross Reference

Document Register Panel mengacu pada:

- Section 2.5 — Application Layout Architecture
- Section 5.2 — Screen Layout Blueprint
- Section 5.3 — Screen Sections
- Section 5.4 — Document Information Model
- PART C.2 — Toolbar
- PART C.3 — Document Register Table
- PART C.4 — Actions Column
- PART G — Pagination
- PART F — Document Actions
- STEP 8 — Permission Matrix
- BUSINESS-WORKFLOW.md

---

## 5.5.40 Acceptance Criteria

Document Register Panel dinyatakan memenuhi spesifikasi apabila:

- Selalu ditampilkan pada halaman PFD maupun P&ID.
- Memiliki struktur Panel Header, Toolbar, Document Register Table, dan Pagination.
- Actions Column menjadi bagian dari Document Register Table.
- Menampilkan Engineering Document sesuai Drawing Context.
- Menjadi Operational Workspace bagi seluruh aktivitas Document Register.
- Seluruh tampilan mengikuti Approved UI Design Mockup.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART C.2 — Toolbar
# ==============================================================================

# PART C.2 — Toolbar

## 5.5.41 Overview

Toolbar merupakan komponen interaktif yang digunakan untuk membantu pengguna menemukan Engineering Document dengan lebih cepat.

Toolbar tidak melakukan perubahan terhadap Engineering Document.

Toolbar hanya mempengaruhi data yang ditampilkan pada Document Register Table.

Seluruh perubahan yang dilakukan Toolbar bersifat **Display Control**, bukan **Data Modification**.

---

## 5.5.42 UI Wireframe

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐

 Search                 Filter Status            Sort By               Page Size

┌──────────────────┐   ┌─────────────────┐     ┌────────────────┐    ┌─────────┐
│ Search...        │   │ All Status ▼    │     │ Document No ▼  │    │ 10 ▼    │
└──────────────────┘   └─────────────────┘     └────────────────┘    └─────────┘

└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Toolbar selalu berada tepat di bawah Panel Header.

---

## 5.5.43 Component Structure

```text
Toolbar

│

├── Search Box

├── Status Filter

├── Sort By

└── Page Size
```

---

## 5.5.44 Component Specification

| Component | Description |
|------------|-------------|
| Search Box | Mencari Engineering Document berdasarkan kata kunci. |
| Status Filter | Menampilkan Document berdasarkan Status tertentu. |
| Sort By | Mengurutkan daftar Engineering Document. |
| Page Size | Menentukan jumlah Document yang ditampilkan per halaman. |

---

## 5.5.45 Display Specification

| Component | Default Value |
|------------|---------------|
| Search Box | Empty |
| Status Filter | All Status |
| Sort By | Document Number (Ascending) |
| Page Size | 10 |

Toolbar selalu ditampilkan pada halaman PFD maupun P&ID.

---

## 5.5.46 Functional Behaviour

Toolbar memperbarui isi Document Register Table berdasarkan kontrol yang dipilih pengguna.

Perubahan pada Toolbar tidak mengubah data Engineering Document di database.

Toolbar hanya mengubah tampilan hasil pencarian.

Masing-masing komponen memiliki fungsi berikut:

### Search Box

- Mencari Engineering Document berdasarkan kata kunci.
- Pencarian dilakukan secara langsung (real-time) atau setelah pengguna menekan Enter, sesuai implementasi frontend.
- Bidang yang dicari akan dirinci pada STEP 7 — Validation Rules atau spesifikasi implementasi.

### Status Filter

Menampilkan Engineering Document berdasarkan Status.

Contoh:

- All Status
- Process Review
- Process Comment
- Process Reject
- Project Review
- Project Comment
- Project Reject
- Approved

Daftar Status mengikuti BUSINESS-WORKFLOW.md.

### Sort By

Mengurutkan daftar Engineering Document.

Contoh:

- Document Number
- Description
- Revision
- Status
- Created Date

Default:

Document Number (Ascending)

### Page Size

Menentukan jumlah data yang ditampilkan.

Contoh:

- 10
- 25
- 50
- 100

---

## 5.5.47 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-TB-001 | Toolbar tidak mengubah Engineering Document. |
| BR-TB-002 | Toolbar hanya mempengaruhi tampilan Document Register Table. |
| BR-TB-003 | Search, Filter, Sort, dan Page Size dapat digunakan secara bersamaan. |
| BR-TB-004 | Status Filter mengikuti Status resmi pada BUSINESS-WORKFLOW.md. |

---

## 5.5.48 Validation Rules

Toolbar tidak melakukan validasi Business Data.

Validasi hanya dilakukan terhadap input kontrol.

Contoh:

- Search menerima input teks.
- Page Size hanya menerima nilai yang tersedia.
- Status Filter hanya menerima Status yang valid.
- Sort By hanya menerima pilihan yang tersedia.

Detail validasi akan dijelaskan pada:

**STEP 7 — Validation Rules**

---

## 5.5.49 Permission Reference

Toolbar dapat digunakan oleh seluruh Official Role yang memiliki akses ke Document Register Module.

| Official Role | Toolbar Access |
|---------------|:--------------:|
| Admin | ✓ |
| Document Owner | ✓ |
| Team Process | ✓ |
| Team Project | ✓ |

---

## 5.5.50 State Behaviour

| State | Behaviour |
|--------|-----------|
| Initial Load | Menampilkan nilai default Toolbar. |
| Search | Memperbarui hasil pencarian. |
| Filter | Memperbarui daftar Document. |
| Sort | Mengurutkan daftar Document. |
| Page Size | Mengubah jumlah data per halaman. |
| Reset | Mengembalikan seluruh kontrol ke nilai default. |

---

## 5.5.51 Interaction Flow

```text
User menggunakan Toolbar

        │

        ▼

Search
Filter
Sort
Page Size

        │

        ▼

System membaca

Toolbar State

        │

        ▼

System mengambil

Engineering Document

yang sesuai

        │

        ▼

Document Register Table

diperbarui
```

---

## 5.5.52 Action Specification

| Action | Trigger | System Response |
|--------|---------|-----------------|
| Search | User mengetik kata kunci | Memperbarui hasil pencarian. |
| Filter Status | User memilih Status | Menampilkan Document sesuai Status. |
| Sort By | User memilih metode pengurutan | Mengurutkan daftar Document. |
| Page Size | User memilih jumlah data | Mengubah jumlah data yang ditampilkan. |
| Reset Toolbar | System / User | Mengembalikan Toolbar ke kondisi default. |

---

## 5.5.53 Cross Reference

Toolbar mengacu pada:

- Section 5.2 — Screen Layout Blueprint
- Section 5.3 — Screen Sections
- Section 5.4 — Document Information Model
- PART C.1 — Document Register Panel Overview
- PART C.3 — Document Register Table
- STEP 7 — Validation Rules
- BUSINESS-WORKFLOW.md

---

## 5.5.54 Acceptance Criteria

Toolbar dinyatakan memenuhi spesifikasi apabila:

- Selalu terdiri dari Search Box, Status Filter, Sort By, dan Page Size.
- Tidak mengubah Engineering Document secara langsung.
- Seluruh kontrol dapat digunakan secara bersamaan.
- Status Filter mengikuti Status resmi pada BUSINESS-WORKFLOW.md.
- Seluruh perubahan Toolbar langsung mempengaruhi tampilan Document Register Table.
- Tampilan mengikuti Approved UI Design Mockup.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART C.3 — Document Register Table
# ==============================================================================

# PART C.3 — Document Register Table

## 5.5.55 Overview

Document Register Table merupakan komponen utama yang menampilkan daftar Engineering Document sesuai Drawing Context yang sedang aktif.

Table menjadi media utama bagi pengguna untuk:

- Melihat Engineering Document
- Mengetahui Status Document
- Mengetahui Revision Document
- Menjalankan Document Actions

Document Register Table hanya menampilkan informasi.

Seluruh perubahan terhadap Engineering Document dilakukan melalui Feature lain seperti:

- Create Document
- Edit Document
- Document Actions
- BUSINESS-WORKFLOW.md

---

## 5.5.56 UI Wireframe

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐

 No │ Document Number │ Description │ Revision │ Status │ Actions

├────┼─────────────────┼─────────────┼──────────┼────────┼───────────────────────────────────────────────────────────────────────────────┤

 1   │ PFD-001         │ .........   │ IFR      │ Process Review │ View Edit Download Comment A B C

 2   │ PFD-002         │ .........   │ IFA      │ Project Review │ View Edit Download Comment A B C

 3   │ PFD-003         │ .........   │ IFC      │ Approved       │ View Download History

└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5.5.57 Component Structure

```text
Document Register Table

│

├── Table Header

├── Table Body

├── Table Row

├── Table Cell

└── Actions Column
```

---

## 5.5.58 Column Specification

| Column | Description | Source | Sortable | Visible |
|----------|-------------|---------|:--------:|:-------:|
| No | Nomor urut data pada halaman aktif. | System | ✗ | ✓ |
| Document Number | Nomor Engineering Document. | Document Information Model | ✓ | ✓ |
| Description | Deskripsi singkat Engineering Document. | Document Information Model | ✓ | ✓ |
| Revision | Revision hasil BUSINESS-WORKFLOW. | BUSINESS-WORKFLOW | ✓ | ✓ |
| Status | Status hasil BUSINESS-WORKFLOW. | BUSINESS-WORKFLOW | ✓ | ✓ |
| Actions | Seluruh aksi yang tersedia terhadap Document. | Permission + Workflow | ✗ | ✓ |

---

## 5.5.59 Display Specification

Document Register Table wajib menampilkan kolom berikut sesuai urutan.

| Order | Column |
|--------|--------|
| 1 | No |
| 2 | Document Number |
| 3 | Description |
| 4 | Revision |
| 5 | Status |
| 6 | Actions |

Urutan kolom merupakan standar resmi Document Register Module.

### CR-010 Created Date Display Rule

Mulai CR-010, halaman Document Register PFD dan P&ID wajib menampilkan kolom **Created Date**.

Urutan kolom untuk PFD Register dan P&ID Register adalah:

```text
No
Document Number
Description
Area
Revision
Created Date
Status
Actions
```

Created Date adalah tanggal pertama kali Document dibuat di EDMS dan berasal dari field Document existing.
Created Date ditampilkan sebagai tanggal tanpa jam, misalnya `15 Jul 2026`.
Dashboard Document Register Table tidak berubah.

---

## 5.5.60 Functional Behaviour

Document Register Table memperbarui isi tabel berdasarkan:

- Drawing Context
- Search
- Status Filter
- Sort By
- Page Size
- Pagination

Setiap baris pada tabel merepresentasikan satu Engineering Document.

Kolom **Actions** hanya menampilkan aksi yang diperbolehkan sesuai Official Role, Status Document, dan BUSINESS-WORKFLOW.md.

---

## 5.5.61 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-TBL-001 | Setiap baris hanya merepresentasikan satu Engineering Document. |
| BR-TBL-002 | Kolom Revision mengikuti BUSINESS-WORKFLOW.md. |
| BR-TBL-003 | Kolom Status mengikuti BUSINESS-WORKFLOW.md. |
| BR-TBL-004 | Actions mengikuti Official Role dan Status Document. |
| BR-TBL-005 | Document Register Table hanya menampilkan hasil dari Toolbar. |

---

## 5.5.62 Validation Rules

Document Register Table tidak menerima input pengguna secara langsung.

Validasi dilakukan pada:

- Toolbar
- Create Document Modal
- Edit Document Modal
- Workflow Actions

---

## 5.5.63 Permission Reference

Seluruh Official Role dapat melihat Document Register Table.

| Official Role | View Table |
|---------------|:----------:|
| Admin | ✓ |
| Document Owner | ✓ |
| Team Process | ✓ |
| Team Project | ✓ |

Hak akses terhadap isi kolom **Actions** dijelaskan pada:

**PART C.4 — Actions Column Specification**

---

## 5.5.64 State Behaviour

| State | Behaviour |
|--------|-----------|
| Initial Load | Menampilkan daftar Engineering Document. |
| Search | Memperbarui hasil pencarian. |
| Filter | Memperbarui hasil filter. |
| Sort | Mengurutkan data. |
| Page Size | Mengubah jumlah data yang ditampilkan. |
| Pagination | Menampilkan halaman yang dipilih. |
| Empty State | Menampilkan informasi bahwa tidak ada Document yang sesuai. |

---

## 5.5.65 Interaction Flow

```text
User membuka
Document Register

        │

        ▼

Toolbar

(Search / Filter / Sort)

        │

        ▼

System mengambil

Engineering Document

        │

        ▼

Document Register Table

ditampilkan

        │

        ▼

User memilih

Actions Column
```

---

## 5.5.66 Action Specification

| Action | Trigger | System Response |
|---------|---------|-----------------|
| Refresh Table | Toolbar berubah | Memperbarui isi tabel. |
| Select Row | User memilih Document | Mengaktifkan Document Actions. |
| Empty Result | Tidak ada data | Menampilkan Empty State. |

---

## 5.5.67 Cross Reference

Document Register Table mengacu pada:

- Section 5.4 — Document Information Model
- PART C.1 — Document Register Panel Overview
- PART C.2 — Toolbar
- PART C.4 — Actions Column
- PART F — Document Actions
- STEP 7 — Validation Rules
- STEP 8 — Permission Matrix
- BUSINESS-WORKFLOW.md

---

## 5.5.68 Acceptance Criteria

Document Register Table dinyatakan memenuhi spesifikasi apabila:

- Selalu menampilkan enam kolom resmi.
- Setiap baris merepresentasikan satu Engineering Document.
- Revision dan Status mengikuti BUSINESS-WORKFLOW.md.
- Actions mengikuti Official Role dan Status Document.
- Isi tabel selalu mengikuti Toolbar dan Drawing Context.
- Seluruh tampilan mengikuti Approved UI Design Mockup.


# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART C.4 — Actions Column Specification
# ==============================================================================

# PART C.4 — Actions Column Specification

## 5.5.69 Overview

Actions Column merupakan kolom terakhir pada Document Register Table yang menyediakan akses terhadap seluruh Document Actions yang dapat dilakukan pada setiap Engineering Document.

Actions Column tidak memiliki Business Logic sendiri.

Kolom ini hanya bertugas menentukan **Action Visibility** berdasarkan Business Rules yang telah ditetapkan.

Perilaku masing-masing Action dijelaskan secara rinci pada:

**PART F — Document Actions**

---

## 5.5.70 UI Wireframe

### Process Review / Process Comment

```text
Actions

[View] [Edit] [Download] [Delete] [Comment] [A] [B] [C]
```

---

### Project Review / Project Comment

```text
Actions

[View] [Edit] [Download] [Delete] [Comment] [A] [B] [C]
```

---

### Approved

```text
Actions

[View] [Download] [History]
```

Tampilan Action yang diterima pengguna bergantung pada kombinasi:

- Official Role
- Status Document
- Tahapan BUSINESS-WORKFLOW

---

## 5.5.71 Component Structure

```text
Actions Column

│

├── View

├── Edit

├── Download

├── Delete

├── Comment

├── Workflow Actions

│      ├── A (Approve)

│      ├── B (Approve with Comment)

│      └── C (Not Approved)

└── History
```

---

## 5.5.72 Component Specification

| Component | Description |
|------------|-------------|
| View | Membuka Document Viewer. |
| Edit | Membuka Edit Document Modal. |
| Download | Mengunduh Engineering Document. |
| Delete | Menghapus Engineering Document sesuai hak akses. |
| Comment | Membuka fitur komentar sesuai BUSINESS-WORKFLOW. |
| Workflow Actions | Menampilkan Action A, B, dan C kepada Reviewer yang berwenang. |
| History | Menampilkan riwayat Workflow setelah Engineering Document berstatus Approved. |

---

## 5.5.73 Visibility Matrix

### Global Action Visibility Rule

Visibilitas setiap Action ditentukan berdasarkan kombinasi:

- Official Role
- Status Document
- Tahapan BUSINESS-WORKFLOW

---

| Official Role | Process Review / Process Comment | Project Review / Project Comment | Approved |
|---------------|----------------------------------|----------------------------------|-----------|
| **Admin** | View • Edit • Download • Delete | View • Edit • Download • Delete | View • Download • History |
| **Document Owner** | View • Edit • Download • Delete | View • Edit • Download • Delete | View • Download • History |
| **Team Process** | View • Download • Comment • A • B • C | View • Download | View • Download • History |
| **Team Project** | View • Download | View • Download • Comment • A • B • C | View • Download • History |

---

### Visibility Principles

- Admin dan Document Owner **tidak pernah** melihat Workflow Actions (A/B/C).
- Team Process hanya dapat melakukan Review pada tahap Process Review atau Process Comment.
- Team Project hanya dapat melakukan Review pada tahap Project Review atau Project Comment.
- Setelah Document berstatus **Approved**, Workflow Actions disembunyikan dan digantikan oleh **History**.

---

## 5.5.74 Functional Behaviour

Actions Column menentukan Action yang tersedia pada setiap Engineering Document.

Actions diperbarui secara otomatis apabila terjadi perubahan pada:

- Official Role
- Status Document
- Tahapan BUSINESS-WORKFLOW

Actions Column tidak menjalankan Business Logic.

Actions Column hanya meneruskan pengguna ke Feature yang sesuai.

---

## 5.5.75 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-AC-001 | Actions Column selalu berada pada kolom terakhir Document Register Table. |
| BR-AC-002 | Visibilitas Action ditentukan oleh Official Role. |
| BR-AC-003 | Visibilitas Action ditentukan oleh Status Document. |
| BR-AC-004 | Visibilitas Action ditentukan oleh tahapan BUSINESS-WORKFLOW. |
| BR-AC-005 | Workflow Actions (A/B/C) hanya ditampilkan kepada Official Role yang berwenang sesuai tahapan BUSINESS-WORKFLOW. |
| BR-AC-006 | Admin dan Document Owner tidak pernah melihat Workflow Actions (A/B/C). |
| BR-AC-007 | Team Process hanya dapat melakukan Review pada Process Review dan Process Comment. |
| BR-AC-008 | Team Project hanya dapat melakukan Review pada Project Review dan Project Comment. |
| BR-AC-009 | Setelah Status Document menjadi Approved, Workflow Actions digantikan oleh History. |
| BR-AC-010 | Perilaku masing-masing Action mengacu pada PART F — Document Actions. |

---

## 5.5.76 Validation Rules

Actions Column tidak menerima input pengguna.

Validasi dilakukan pada masing-masing Feature:

- PART E — Edit Document Modal
- PART F.1 — View
- PART F.2 — Download
- PART F.3 — Comment
- PART F.4 — Workflow Actions
- PART F.5 — Delete
- PART F.6 — History

---

## 5.5.77 Permission Reference

Permission terhadap setiap Action mengikuti:

- Official Role
- Visibility Matrix
- BUSINESS-WORKFLOW.md

Detail hak akses akan didefinisikan pada:

**STEP 8 — Permission Matrix**

---

## 5.5.78 State Behaviour

| State | Behaviour |
|--------|-----------|
| Initial Load | Menampilkan Action sesuai Visibility Matrix. |
| Official Role Change | Action diperbarui sesuai Official Role. |
| Status Change | Action diperbarui mengikuti Status terbaru. |
| Workflow Transition | Action diperbarui mengikuti tahapan BUSINESS-WORKFLOW. |
| Approved | Workflow Actions disembunyikan dan diganti History. |

---

## 5.5.79 Interaction Flow

```text
Document Register Table

        │

        ▼

User memilih

Engineering Document

        │

        ▼

System membaca

Official Role

        │

        ▼

System membaca

Status Document

        │

        ▼

System membaca

Tahapan BUSINESS-WORKFLOW

        │

        ▼

Visibility Matrix

        │

        ▼

Actions Column

dibentuk

        │

        ▼

User memilih

Document Action

        │

        ▼

System menjalankan

Feature terkait
```

---

## 5.5.80 Action Specification

| Action | Trigger | System Response |
|---------|---------|-----------------|
| View | Click | Membuka Document Viewer. |
| Edit | Click | Membuka Edit Document Modal. |
| Download | Click | Mengunduh Engineering Document. |
| Archive | Click | Mengarsipkan Document Approved dengan Lifecycle Archived. |
| Restore | Click | Memulihkan Archived Document menjadi Lifecycle Active. |
| Comment | Click | Membuka fitur komentar sesuai BUSINESS-WORKFLOW. |
| Workflow Action (A/B/C) | Click | Menjalankan BUSINESS-WORKFLOW. |
| History | Click | Membuka Document History. |

---

## 5.5.81 Cross Reference

Actions Column mengacu pada:

- PART C.3 — Document Register Table
- PART D — Create Document Modal
- PART E — Edit Document Modal
- PART F — Document Actions
- STEP 6 — Business Rule Matrix
- STEP 8 — Permission Matrix
- BUSINESS-WORKFLOW.md

---

## 5.5.82 Acceptance Criteria

Actions Column dinyatakan memenuhi spesifikasi apabila:

- Selalu berada pada kolom terakhir Document Register Table.
- Seluruh Action mengikuti Visibility Matrix.
- Workflow Actions hanya ditampilkan kepada Official Role yang berwenang.
- Admin dan Document Owner tidak pernah melihat Action A/B/C.
- Team Process hanya melakukan Review pada Process Review dan Process Comment.
- Team Project hanya melakukan Review pada Project Review dan Project Comment.
- Setelah Status menjadi Approved, Workflow Actions digantikan oleh History.
- Perilaku setiap Action mengacu pada PART F — Document Actions.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART D.1 — Create Document Modal Layout
# ==============================================================================

# PART D.1 — Create Document Modal Layout

## 5.5.83 Overview

Create Document Modal merupakan **Document Creation Workspace** yang digunakan untuk membuat Engineering Document baru.

Modal ini ditampilkan ketika pengguna menekan **Primary Action Button (Create)** pada Action Area.

Nama modal mengikuti Drawing Context yang sedang aktif.

- Halaman PFD → **Create PFD**
- Halaman P&ID → **Create P&ID**

Create Document Modal hanya bertanggung jawab menyediakan antarmuka untuk memasukkan informasi Engineering Document.

Validasi field, perilaku masing-masing field, dan proses penyimpanan dibahas pada bagian berikutnya.

---

## 5.5.84 UI Wireframe

### Create PFD

```text
┌──────────────────────────────────────────────────────────────┐

                      Create PFD

────────────────────────────────────────────────────────────────

Upload Document

┌──────────────────────────────────────────────────────────┐
│ Choose File...                                           │
└──────────────────────────────────────────────────────────┘

Document Number

┌──────────────────────────────────────────────────────────┐
│                                                          │
└──────────────────────────────────────────────────────────┘

Description

┌──────────────────────────────────────────────────────────┐
│                                                          │
└──────────────────────────────────────────────────────────┘

Area

┌──────────────────────────────────────────────────────────┐
│                                                          │
└──────────────────────────────────────────────────────────┘

Days Until Validation

┌──────────────────────────────────────────────────────────┐
│                                                          │
└──────────────────────────────────────────────────────────┘

NAS Location

┌──────────────────────────────────────────────────────────┐
│                                                          │
└──────────────────────────────────────────────────────────┘
(Read Only - Empty)

────────────────────────────────────────────────────────────────

                    [ Cancel ]   [ Save ]

└──────────────────────────────────────────────────────────────┘
```

---

### Create P&ID

Layout identik dengan Create PFD.

Perbedaan hanya pada Modal Title.

---

## 5.5.85 Component Structure

```text
Create Document Modal

│

├── Modal Header

├── Modal Body

│      ├── Upload Document
│      ├── Document Number
│      ├── Description
│      ├── Area
│      ├── Days Until Validation
│      └── NAS Location

├── Modal Footer

│      ├── Cancel Button
│      └── Save Button

└── Modal Overlay
```

---

## 5.5.86 Component Specification

| Component | Description |
|------------|-------------|
| Modal Header | Menampilkan nama modal sesuai Drawing Context. |
| Modal Body | Menampilkan seluruh informasi yang diperlukan untuk membuat Engineering Document. |
| Modal Footer | Menampilkan tombol aksi modal. |
| Modal Overlay | Menonaktifkan interaksi dengan halaman utama selama modal aktif. |

---

## 5.5.87 Display Specification

### Modal Title

| Drawing Context | Modal Title |
|-----------------|-------------|
| PFD | Create PFD |
| P&ID | Create P&ID |

---

### Layout Rules

- Modal ditampilkan di tengah layar.
- Overlay menutupi seluruh halaman.
- Seluruh field ditampilkan secara vertikal.
- Tombol Cancel dan Save berada pada bagian kanan bawah modal.
- NAS Location selalu ditampilkan dalam kondisi **Read Only**.
- Pada proses Create, NAS Location ditampilkan **kosong (Empty)**.

---

## 5.5.88 Official Field Classification

Seluruh field pada Create Document Modal diklasifikasikan berdasarkan sumber nilainya.

| Field Category | Description |
|----------------|-------------|
| User Input Field | Nilai diinput langsung oleh pengguna. |
| File Input Field | Nilai berasal dari proses upload file oleh pengguna. |
| System Information Field | Nilai dihasilkan atau diisi oleh sistem dan tidak dapat diedit oleh pengguna. |

Klasifikasi ini menjadi standar resmi untuk seluruh Form pada EDMS.

---

## 5.5.89 Functional Behaviour

Create Document Modal ditampilkan ketika pengguna memilih **Create Document**.

Selama modal aktif:

- Pengguna tidak dapat berinteraksi dengan halaman utama.
- Drawing Context diteruskan ke modal.
- NAS Location ditampilkan dalam kondisi **Read Only** dan **kosong (Empty)**.
- NAS Location **tidak diisi selama proses Create**.
- Nilai NAS Location akan dibuat oleh sistem setelah proses upload dan penyimpanan Engineering Document berhasil.
- Seluruh field mengikuti aturan validasi pada PART D.2.

---

## 5.5.90 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-CDM-001 | Modal Title mengikuti Drawing Context. |
| BR-CDM-002 | Hanya satu Create Document Modal yang boleh aktif dalam satu waktu. |
| BR-CDM-003 | Overlay menonaktifkan interaksi dengan halaman utama. |
| BR-CDM-004 | NAS Location merupakan System Information Field. |
| BR-CDM-005 | NAS Location selalu Read Only. |
| BR-CDM-006 | NAS Location kosong selama proses Create. |
| BR-CDM-007 | NAS Location dihasilkan oleh sistem setelah proses upload dan penyimpanan berhasil. |

---

## 5.5.91 Validation Rules

Validasi setiap field tidak dibahas pada bagian ini.

Seluruh aturan validasi akan dijelaskan pada:

- PART D.2 — Input Fields
- STEP 7 — Validation Rules

---

## 5.5.92 Permission Reference

| Official Role | Create Modal |
|---------------|:------------:|
| Admin | ✓ |
| Document Owner | ✓ |
| Team Process | ✗ |
| Team Project | ✗ |

Hak akses mengikuti:

- Official Role Definition
- STEP 8 — Permission Matrix

---

## 5.5.93 State Behaviour

| State | Behaviour |
|--------|-----------|
| Closed | Modal tidak ditampilkan. |
| Open | Modal tampil dan siap menerima input. |
| Saving | Seluruh kontrol dinonaktifkan selama proses penyimpanan. |
| Success | Modal ditutup setelah penyimpanan berhasil. |
| Cancelled | Modal ditutup tanpa menyimpan perubahan. |

---

## 5.5.94 Interaction Flow

```text
User klik

Create Button

        │

        ▼

System membaca

Drawing Context

        │

        ▼

System memeriksa

Official Role

        │

        ▼

Create Document Modal

ditampilkan

        │

        ▼

NAS Location

ditampilkan kosong
(Read Only)

        │

        ▼

User mengisi

Field Input

        │

        ▼

Menunggu aksi

Save

atau

Cancel
```

---

## 5.5.95 Action Specification

| Action | Trigger | System Response |
|----------|---------|-----------------|
| Open Modal | Click Create Button | Menampilkan Create Document Modal. |
| Cancel | Click Cancel | Menutup modal tanpa menyimpan perubahan. |
| Save | Click Save | Memulai proses validasi dan penyimpanan. |
| Close | Click Close (X) | Menutup modal tanpa menyimpan perubahan. |

---

## 5.5.96 Cross Reference

Create Document Modal mengacu pada:

- PART B — Action Area
- PART D.2 — Input Fields
- PART D.3 — Field Behaviour
- PART D.4 — Action Buttons
- PART D.5 — Modal Flow
- STEP 7 — Validation Rules
- STEP 8 — Permission Matrix
- BUSINESS-WORKFLOW.md

---

## 5.5.97 Acceptance Criteria

Create Document Modal dinyatakan memenuhi spesifikasi apabila:

- Modal Title mengikuti Drawing Context.
- Layout mengikuti Approved UI Design Mockup.
- Seluruh field ditampilkan sesuai urutan yang ditentukan.
- Overlay menonaktifkan interaksi dengan halaman utama.
- NAS Location selalu ditampilkan kosong dalam kondisi Read Only selama proses Create.
- NAS Location hanya dihasilkan oleh sistem setelah proses upload dan penyimpanan berhasil.
- Hanya Official Role yang berwenang yang dapat membuka modal.
- Modal dapat ditutup melalui Cancel, Save (berhasil), atau Close (X) apabila tersedia.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART D.2 — Input Fields
# ==============================================================================

# PART D.2 — Input Fields

## 5.5.98 Overview

Input Fields merupakan kumpulan field yang digunakan pengguna untuk memasukkan informasi Engineering Document pada Create Document Modal.

Setiap field memiliki klasifikasi, fungsi, placeholder, sumber data, serta aturan validasi yang berbeda.

Bagian ini menjadi **Single Source of Truth** bagi seluruh Input Field pada Create Document Modal.

---

## 5.5.99 Field Definition Matrix

| Field | Field Category | UI Control | Placeholder | Required | Editable | Source | Validation Reference |
|--------|----------------|------------|-------------|:--------:|:--------:|--------|----------------------|
| Upload Document | File Input Field | File Upload | Choose engineering document... | ✓ | ✓ | User | STEP 7 |
| Document Number | User Input Field | Text Field | Enter document number | ✓ | ✓ | User | STEP 7 |
| Description | User Input Field | Text Field | Enter document description | ✓ | ✓ | User | STEP 7 |
| Area | User Input Field | Text Field | Enter area | ✓ | ✓ | User | STEP 7 |
| Days Until Validation | User Input Field | Number Field | Enter number of days | ✓ | ✓ | User | STEP 7 |
| NAS Location | System Information Field | Read Only Text Field | — | ✗ | ✗ | System | N/A |

---

## 5.5.100 Field Purpose

| Field | Purpose |
|--------|---------|
| Upload Document | Mengunggah Engineering Document ke sistem. |
| Document Number | Mengidentifikasi Engineering Document secara unik dalam scope Project. |
| Description | Memberikan deskripsi singkat mengenai Engineering Document. |
| Area | Menunjukkan area atau lokasi Engineering Document digunakan. |
| Days Until Validation | Menentukan target waktu validasi sebagai dasar SLA Timer. |
| NAS Location | Menampilkan lokasi penyimpanan dokumen yang dihasilkan oleh sistem setelah proses upload dan penyimpanan berhasil. |

---

## 5.5.101 Display Specification

### Upload Document

- Menggunakan File Upload Control.
- Belum ada file yang dipilih ketika modal pertama kali dibuka.

---

### Document Number

- Text Field.
- Placeholder:

```text
Enter document number
```

---

### Description

- Text Field.
- Placeholder:

```text
Enter document description
```

---

### Area

- Text Field.
- Placeholder:

```text
Enter area
```

---

### Days Until Validation

- Number Field.
- Label UI: `DAY TIMES FOR REVIEW`.
- API/backend property: `daysUntilValidation`.
- Placeholder:

```text
Enter number of days
```

- Menerima angka `>= 0`.
- Display rule: `0` ditampilkan sebagai `Today`, `1` sebagai `1 Day`, dan nilai lebih besar sebagai `N Days`.

---

### NAS Location

- Read Only Text Field.
- Placeholder tidak digunakan.
- Selalu kosong selama proses Create.
- Tidak dapat diedit oleh pengguna.

---

## 5.5.102 Functional Behaviour

### Upload Document

Pengguna memilih file Engineering Document yang akan diunggah.

File belum dikirim ke sistem sampai pengguna menekan tombol **Save**.

---

### Document Number

Diisi secara manual oleh pengguna.

Document Number wajib unik pada Project aktif.

Document Number yang sama dapat digunakan pada Project berbeda.

---

### Description

Diisi secara manual oleh pengguna.

---

### Area

Diisi secara manual oleh pengguna.

---

### Days Until Validation

Diisi secara manual oleh pengguna.

Nilai ini digunakan sebagai dasar perhitungan SLA Timer setelah Engineering Document berhasil dibuat.

---

### NAS Location

NAS Location merupakan **System Information Field**.

Field ini:

- selalu Read Only,
- selalu kosong selama proses Create,
- tidak dapat diedit oleh pengguna,
- akan diisi oleh sistem setelah proses upload dan penyimpanan Engineering Document berhasil.

---

## 5.5.103 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-FLD-001 | Upload Document wajib dipilih sebelum proses penyimpanan. |
| BR-FLD-002 | Document Number wajib diisi. |
| BR-FLD-003 | Description wajib diisi. |
| BR-FLD-004 | Area wajib diisi. |
| BR-FLD-005 | Days Until Validation wajib diisi dan digunakan sebagai dasar SLA Timer. |
| BR-FLD-006 | NAS Location merupakan System Information Field. |
| BR-FLD-007 | NAS Location tidak dapat diedit oleh pengguna. |
| BR-FLD-008 | NAS Location hanya dihasilkan oleh sistem setelah proses upload dan penyimpanan berhasil. |

---

## 5.5.104 Validation Rules

Aturan validasi rinci setiap field tidak dibahas pada bagian ini.

Seluruh validasi akan dijelaskan pada:

- PART D.3 — Field Behaviour
- STEP 7 — Validation Rules

---

## 5.5.105 Permission Reference

| Official Role | Create Document |
|---------------|:---------------:|
| Admin | ✓ |
| Document Owner | ✓ |
| Team Process | ✗ |
| Team Project | ✗ |

Seluruh field mengikuti hak akses Create Document.

Hak akses rinci akan dijelaskan pada **STEP 8 — Permission Matrix**.

---

## 5.5.106 State Behaviour

| State | Behaviour |
|--------|-----------|
| Initial | Seluruh User Input Field kosong. |
| Editing | Pengguna dapat mengisi seluruh User Input Field dan File Input Field. |
| Saving | Seluruh field dinonaktifkan sementara selama proses penyimpanan. |
| Success | Data berhasil disimpan dan modal ditutup. |
| Failed | Seluruh input tetap dipertahankan agar pengguna dapat memperbaiki kesalahan. |

---

## 5.5.107 Interaction Flow

```text
Create Document Modal

        │

        ▼

User memilih

Upload Document

        │

        ▼

User mengisi

Document Number

Description

Area

Days Until Validation

        │

        ▼

NAS Location

tetap kosong

(Read Only)

        │

        ▼

User memilih

Save

        │

        ▼

System menjalankan

Validation

        │

        ▼

Jika valid

↓

Proses Upload & Save
```

---

## 5.5.108 Action Specification

| User Action | System Response |
|-------------|-----------------|
| Select File | Menyimpan file sementara sebelum proses Save. |
| Input Text | Memperbarui nilai field terkait. |
| Input Number | Memperbarui nilai Days Until Validation. |
| Click Save | Memulai proses validasi dan penyimpanan. |
| Click Cancel | Menutup modal tanpa menyimpan perubahan. |

---

## 5.5.109 Cross Reference

Input Fields mengacu pada:

- PART D.1 — Create Document Modal Layout
- PART D.3 — Field Behaviour
- PART D.4 — Action Buttons
- STEP 7 — Validation Rules
- STEP 8 — Permission Matrix
- BUSINESS-WORKFLOW.md

---

## 5.5.110 Acceptance Criteria

Input Fields dinyatakan memenuhi spesifikasi apabila:

- Seluruh field mengikuti Field Definition Matrix.
- Placeholder ditampilkan sesuai spesifikasi.
- Upload Document menggunakan File Upload Control.
- Days Until Validation menjadi dasar SLA Timer.
- NAS Location merupakan System Information Field.
- NAS Location selalu kosong selama proses Create.
- NAS Location hanya dihasilkan oleh sistem setelah proses upload dan penyimpanan berhasil.
- Seluruh field mengikuti Official Field Classification Standard.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART D.3 — Field Behaviour
# ==============================================================================

# PART D.3 — Field Behaviour

## 5.5.111 Overview

Field Behaviour mendefinisikan bagaimana setiap field pada Create Document Modal berperilaku selama siklus pembuatan Engineering Document.

Bagian ini tidak menjelaskan struktur field maupun aturan validasi.

Fokus utama bagian ini adalah:

- Perilaku setiap field.
- Interaksi pengguna terhadap field.
- Respons sistem terhadap perubahan field.
- Hubungan antar field.
- Persiapan proses penyimpanan Engineering Document.

---

## 5.5.112 Official Field Behaviour Lifecycle

Seluruh field pada Create Document Modal mengikuti lifecycle berikut.

```text
Modal Open
      │
      ▼
User Interaction
      │
      ▼
Field Updated
      │
      ▼
Validation
      │
      ▼
Ready for Save
```

System Information Field mengikuti lifecycle yang berbeda.

```text
Modal Open
      │
      ▼
Read Only
      │
      ▼
Waiting System Process
      │
      ▼
System Generated
```

---

## 5.5.113 Behaviour Matrix

| Field | Initial State | User Interaction | System Behaviour |
|---------|---------------|-----------------|------------------|
| Upload Document | Empty | Select / Replace File | Menyimpan file sementara hingga Save ditekan. |
| Document Number | Empty | Input Text | Memperbarui nilai field secara langsung. |
| Description | Empty | Input Text | Memperbarui nilai field secara langsung. |
| Area | Empty | Input Text | Memperbarui nilai field secara langsung. |
| Days Until Validation | Empty | Input Number | Menjadi dasar pembentukan SLA Timer setelah Document berhasil dibuat. |
| NAS Location | Empty (Read Only) | Tidak dapat diedit | Menunggu proses sistem dan akan dihasilkan setelah upload serta penyimpanan berhasil. |

---

## 5.5.114 File Input Field Behaviour

### Upload Document

Behaviour:

- Pengguna memilih satu Engineering Document.
- File dapat diganti sebelum Save.
- File hanya disimpan sementara selama modal masih terbuka.
- File baru dikirim ke sistem ketika Save ditekan.
- Cancel akan membatalkan file yang telah dipilih.

---

## 5.5.115 User Input Field Behaviour

Field berikut termasuk User Input Field:

- Document Number
- Description
- Area
- Days Until Validation

Behaviour umum:

- Nilai dapat diubah kapan saja selama modal aktif.
- Nilai tidak hilang apabila validasi gagal.
- Nilai dikirim ke sistem ketika Save ditekan.
- Tidak ada field yang berubah otomatis akibat perubahan field lain.

---

## 5.5.116 System Information Field Behaviour

NAS Location merupakan **System Information Field**.

Behaviour:

- Selalu Read Only.
- Selalu kosong ketika Create Modal dibuka.
- Tidak dapat diedit oleh pengguna.
- Tidak berubah selama proses Create.
- Tidak berasal dari Upload Control.
- Nilainya dihasilkan oleh sistem setelah:

  - Upload Document berhasil.
  - Engineering Document berhasil disimpan.

- Nilai NAS Location baru dapat dilihat ketika Engineering Document dibuka kembali melalui Edit Document Modal.

---

## 5.5.117 Inter-Field Behaviour

Setiap field bekerja secara independen.

Namun beberapa field memiliki hubungan terhadap proses sistem.

### Upload Document

Upload Document tidak mengisi NAS Location.

Upload Document hanya menyediakan file yang akan diproses ketika Save dilakukan.

---

### Days Until Validation

Nilai Days Until Validation digunakan sebagai dasar:

- Inisialisasi SLA Timer.
- Penentuan Target Validation Date.

Pada UI runtime, field ini ditampilkan sebagai `DAY TIMES FOR REVIEW`; API/backend tetap menggunakan property `daysUntilValidation`. Nilai `0` berarti `Today`.

Perubahan nilai ini tidak mempengaruhi field lain selama modal masih terbuka.

---

## 5.5.118 Processing Preparation

Sebelum proses Save dimulai, sistem memastikan bahwa seluruh informasi telah siap diproses.

Data yang dipersiapkan meliputi:

- Upload Document
- Document Number
- Description
- Area
- Days Until Validation

NAS Location tidak termasuk data yang dipersiapkan oleh pengguna karena akan dihasilkan oleh sistem.

Urutan proses penyimpanan secara lengkap dijelaskan pada:

**PART D.5 — Modal Flow**

---

## 5.5.119 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-FBH-001 | User Input Field dapat diubah sebelum Save. |
| BR-FBH-002 | Upload Document hanya dikirim ke sistem setelah Save ditekan. |
| BR-FBH-003 | NAS Location merupakan System Information Field. |
| BR-FBH-004 | NAS Location selalu kosong selama Create berlangsung. |
| BR-FBH-005 | Days Until Validation menjadi dasar pembentukan SLA Timer. |
| BR-FBH-006 | Validasi gagal tidak menghapus nilai User Input Field. |
| BR-FBH-007 | Upload Document tidak secara otomatis menghasilkan NAS Location. |
| BR-FBH-008 | NAS Location hanya dihasilkan setelah upload dan penyimpanan Engineering Document berhasil. |

---

## 5.5.120 Validation Rules

Perilaku field mengikuti aturan validasi yang dijelaskan pada:

- STEP 7 — Validation Rules

Bagian ini tidak mendefinisikan aturan validasi secara rinci.

---

## 5.5.121 Permission Reference

| Official Role | Create Behaviour |
|---------------|:----------------:|
| Admin | ✓ |
| Document Owner | ✓ |
| Team Process | ✗ |
| Team Project | ✗ |

Hak akses mengikuti:

- Official Role Definition
- STEP 8 — Permission Matrix

---

## 5.5.122 State Behaviour

| Modal State | Behaviour |
|--------------|----------|
| Open | Seluruh User Input Field siap diisi. |
| Editing | Pengguna dapat mengubah seluruh User Input Field dan File Input Field. |
| Validation Failed | Seluruh nilai input tetap dipertahankan. |
| Saving | Seluruh field dinonaktifkan sementara. |
| Success | Data dikirim ke sistem dan modal ditutup. |
| Cancel | Seluruh perubahan dibatalkan. |

---

## 5.5.123 Interaction Flow

```text
Create Document Modal

        │

        ▼

User memilih

Upload Document

        │

        ▼

User mengisi

Document Number

Description

Area

Days Until Validation

        │

        ▼

NAS Location

tetap kosong
(Read Only)

        │

        ▼

User menekan

Save

        │

        ▼

System melakukan

Validation

        │

        ▼

Processing Ready

        │

        ▼

Menunggu

PART D.5

Modal Flow
```

---

## 5.5.124 Action Specification

| User Action | System Behaviour |
|--------------|------------------|
| Select File | Menyimpan file sementara. |
| Replace File | Mengganti file sementara. |
| Edit User Input | Memperbarui nilai field. |
| Click Save | Menyiapkan seluruh data untuk Processing Pipeline. |
| Click Cancel | Membatalkan seluruh perubahan. |

---

## 5.5.125 Cross Reference

Field Behaviour mengacu pada:

- PART D.1 — Create Document Modal Layout
- PART D.2 — Input Fields
- PART D.4 — Action Buttons
- PART D.5 — Modal Flow
- STEP 7 — Validation Rules
- STEP 8 — Permission Matrix
- BUSINESS-WORKFLOW.md

---

## 5.5.126 Acceptance Criteria

Field Behaviour dinyatakan memenuhi spesifikasi apabila:

- Seluruh User Input Field mengikuti Official Field Behaviour Lifecycle.
- Upload Document hanya diproses setelah Save ditekan.
- NAS Location merupakan System Information Field.
- NAS Location selalu kosong selama proses Create.
- NAS Location hanya dihasilkan oleh sistem setelah upload dan penyimpanan berhasil.
- Days Until Validation menjadi dasar pembentukan SLA Timer.
- Seluruh field siap diproses pada Processing Pipeline yang dijelaskan di PART D.5.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART D.4 — Action Buttons
# ==============================================================================

# PART D.4 — Action Buttons

## 5.5.127 Overview

Action Buttons merupakan komponen yang menyediakan aksi utama pada Create Document Modal.

Action Buttons tidak melakukan Business Logic secara langsung.

Setiap Action Button hanya memicu proses tertentu yang kemudian dijalankan oleh sistem sesuai BUSINESS-WORKFLOW.md.

Pada Create Document Modal hanya terdapat dua Action Button:

- Cancel
- Save

Seluruh Action Button pada EDMS mengikuti:

- Official Button Feedback Standard
- Official Processing State Standard

---

## 5.5.128 UI Wireframe

```text
┌──────────────────────────────────────────────────────────────┐

                    Create PFD

───────────────────────────────────────────────────────────────

                 (Input Fields)

───────────────────────────────────────────────────────────────

                 [ Cancel ]   [ Save ]

└──────────────────────────────────────────────────────────────┘
```

Action Button selalu berada pada Modal Footer.

---

## 5.5.129 Component Structure

```text
Modal Footer

│

├── Cancel Button

└── Save Button
```

---

## 5.5.130 Component Specification

| Button | Description |
|----------|-------------|
| Cancel | Menutup modal tanpa menyimpan perubahan. |
| Save | Menjalankan Validation dan memulai Processing Pipeline. |

---

## 5.5.131 Display Specification

### Cancel Button

- Secondary Button
- Berada di sebelah kiri Save
- Selalu ditampilkan

### Save Button

- Primary Button
- Berada di posisi paling kanan
- Menjadi Primary Action pada modal

### Layout Rules

- Cancel selalu di kiri.
- Save selalu di kanan.
- Posisi tombol konsisten pada seluruh modal EDMS.
- Urutan tombol tidak boleh diubah.

---

# 5.5.132 Official Processing State Standard

Seluruh proses pada modal EDMS mengikuti lifecycle berikut.

```text
Idle

 │

 ▼

Validating

 │

 ▼

Saving

 │

 ├────────────► Failed

 │

 └────────────► Success
```

### State Description

| Processing State | Description |
|------------------|-------------|
| Idle | Modal siap menerima input pengguna. |
| Validating | Sistem melakukan validasi seluruh input. |
| Saving | Sistem menjalankan Processing Pipeline. |
| Failed | Proses dihentikan karena terjadi kesalahan. |
| Success | Seluruh proses selesai dengan sukses. |

Standar ini berlaku untuk seluruh modal pada EDMS.

---

# 5.5.133 Official Button Feedback Standard

Action Button mengikuti Processing State.

## Save Button Lifecycle

| Processing State | Button Label | Status | Feedback |
|------------------|--------------|--------|----------|
| Idle | Save | Enabled | Siap digunakan. |
| Validating | Save | Disabled | Menunggu hasil validasi. |
| Saving | Saving... | Disabled | Loading Spinner ditampilkan. |
| Failed | Save | Enabled | Error Message ditampilkan. |
| Success | Modal Closed | Completed | Modal ditutup otomatis. |

---

## Cancel Button Lifecycle

| Processing State | Status | Behaviour |
|------------------|--------|-----------|
| Idle | Enabled | Modal dapat ditutup. |
| Validating | Disabled | Menunggu hasil validasi. |
| Saving | Disabled | Tidak dapat membatalkan proses. |
| Failed | Enabled | Pengguna dapat membatalkan atau memperbaiki data. |
| Success | Hidden | Modal ditutup otomatis. |

---

## Button Feedback Principles

Seluruh Action Button wajib:

- Memberikan feedback visual.
- Mengikuti Processing State.
- Menampilkan Loading Spinner selama Saving.
- Mencegah Double Click.
- Kembali ke kondisi Idle apabila proses gagal.
- Memiliki perilaku yang konsisten pada seluruh aplikasi EDMS.

---

## 5.5.134 Functional Behaviour

### Cancel Button

Ketika pengguna memilih Cancel:

- Seluruh perubahan dibatalkan.
- File sementara dibuang.
- Modal ditutup.
- Tidak ada data yang dikirim ke sistem.

---

### Save Button

Ketika pengguna memilih Save:

1. Sistem berpindah ke Processing State **Validating**.
2. Seluruh field diperiksa.
3. Jika Validation gagal → Processing State menjadi **Failed**.
4. Jika Validation berhasil → Processing State berubah menjadi **Saving**.
5. Processing Pipeline dimulai.

Processing Pipeline dijelaskan pada:

**PART D.5 — Modal Flow**

---

## 5.5.135 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-BTN-001 | Cancel tidak pernah menyimpan perubahan. |
| BR-BTN-002 | Save selalu menjalankan Validation terlebih dahulu. |
| BR-BTN-003 | Processing Pipeline hanya dimulai apabila Validation berhasil. |
| BR-BTN-004 | Seluruh Action Button mengikuti Official Button Feedback Standard. |
| BR-BTN-005 | Seluruh Modal mengikuti Official Processing State Standard. |
| BR-BTN-006 | Seluruh Input Field dinonaktifkan selama Processing State = Saving. |
| BR-BTN-007 | Double Click Prevention wajib diterapkan selama Validating dan Saving. |
| BR-BTN-008 | Loading Spinner hanya muncul pada Processing State = Saving. |
| BR-BTN-009 | Setelah Failed, seluruh kontrol kembali ke kondisi Idle. |

---

## 5.5.136 Validation Rules

Action Button tidak memiliki aturan validasi sendiri.

Save Button hanya memicu proses Validation.

Seluruh aturan Validation dijelaskan pada:

- STEP 7 — Validation Rules

---

## 5.5.137 Permission Reference

| Official Role | Cancel | Save |
|---------------|:------:|:----:|
| Admin | ✓ | ✓ |
| Document Owner | ✓ | ✓ |
| Team Process | ✗ | ✗ |
| Team Project | ✗ | ✗ |

Hak akses mengikuti STEP 8 — Permission Matrix.

---

## 5.5.138 State Behaviour

| Processing State | Cancel | Save | Input Field |
|------------------|:------:|:----:|:-----------:|
| Idle | Enabled | Enabled | Enabled |
| Validating | Disabled | Disabled | Disabled |
| Saving | Disabled | Disabled | Disabled |
| Failed | Enabled | Enabled | Enabled |
| Success | Modal Closed | Completed | Read Only |

---

## 5.5.139 Interaction Flow

```text
User

Click Save

      │

      ▼

Processing State

Idle

      │

      ▼

Validating

      │

      ├──────────────► Failed

      │                     │

      │                     ▼

      │               Show Validation Error

      │

      ▼

Saving

      │

      ▼

Processing Pipeline

(PART D.5)

      │

      ▼

Success

      │

      ▼

Close Modal

Refresh Document Register
```

---

## 5.5.140 Action Specification

| Action | Trigger | System Response |
|----------|---------|-----------------|
| Cancel | Click Cancel | Menutup modal tanpa menyimpan perubahan. |
| Save | Click Save | Memulai Processing State = Validating. |
| Validation Failed | Validation Error | Processing State = Failed. |
| Validation Success | Validation Passed | Processing State = Saving. |
| Saving | Processing | Save berubah menjadi **Saving...**, Loading Spinner ditampilkan. |
| Success | Save Complete | Modal ditutup dan Document Register diperbarui. |

---

## 5.5.141 Cross Reference

Action Buttons mengacu pada:

- PART D.1 — Create Document Modal Layout
- PART D.2 — Input Fields
- PART D.3 — Field Behaviour
- PART D.5 — Modal Flow
- STEP 7 — Validation Rules
- STEP 8 — Permission Matrix
- BUSINESS-WORKFLOW.md

---

## 5.5.142 Acceptance Criteria

Action Buttons dinyatakan memenuhi spesifikasi apabila:

- Hanya terdiri dari Cancel dan Save.
- Mengikuti Official Button Feedback Standard.
- Mengikuti Official Processing State Standard.
- Save selalu memulai Processing State = Validating.
- Loading Spinner hanya ditampilkan pada Processing State = Saving.
- Double Click Prevention diterapkan selama Validating dan Saving.
- Setelah proses gagal, seluruh kontrol kembali ke kondisi Idle.
- Perilaku Action Button konsisten pada seluruh aplikasi EDMS.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART D.5 — Modal Flow
# ==============================================================================

# PART D.5 — Modal Flow

## 5.5.143 Overview

Modal Flow mendefinisikan keseluruhan alur proses Create Document mulai dari pengguna membuka modal hingga Engineering Document berhasil dibuat.

Bagian ini menjadi **Single Source of Truth** untuk seluruh lifecycle proses Create Document.

Modal Flow mengintegrasikan:

- User Interaction
- Processing State
- Validation
- File Upload
- Business Workflow
- SLA Initialization
- Document Register Refresh

---

## 5.5.144 Official Processing Pipeline

Seluruh proses Create Document mengikuti Processing Pipeline berikut.

```text
Open Create Modal

        │

        ▼

Input Engineering Document

        │

        ▼

Click Save

        │

        ▼

Validation

        │

 ┌──────┴────────┐

 │               │

 ▼               ▼

Failed        Passed

 │               │

 ▼               ▼

Show Error     Upload Document

                    │

                    ▼

        Validate Active Project

                    │

                    ▼

     Validate Project Membership

                    │

                    ▼

          Assign Project ID

                    │

                    ▼

        Generate NAS Location

                    │

                    ▼

      Save Engineering Document

                    │

                    ▼

    Initialize BUSINESS-WORKFLOW

                    │

                    ▼

        Initialize SLA Timer

                    │

                    ▼

       Generate Workflow Event

                    │

                    ▼

        Close Create Modal

                    │

                    ▼

 Refresh Document Register
```

Pipeline ini menjadi standar resmi seluruh proses Create Document.

---

## 5.5.145 Processing Stages

| Stage | Description |
|--------|-------------|
| Open Modal | Menampilkan Create Document Modal. |
| Input Data | Pengguna mengisi seluruh field yang diperlukan. |
| Validation | Sistem memeriksa seluruh data. |
| Upload Document | File Engineering Document diunggah. |
| Validate Active Project | Sistem memastikan Active Project tersedia sebelum Document dibuat. |
| Validate Project Membership | Sistem memastikan pengguna memiliki Project Membership yang valid pada Active Project. |
| Assign Project ID | Sistem menetapkan Project ID dari Active Project ke Engineering Document yang akan dibuat. |
| Generate NAS Location | Sistem menghasilkan lokasi penyimpanan dokumen. |
| Save Metadata | Sistem menyimpan seluruh metadata Engineering Document beserta Project ID. |
| Initialize BUSINESS-WORKFLOW | Sistem membuat Status awal dan Revision awal sesuai BUSINESS-WORKFLOW.md. |
| Initialize SLA Timer | Sistem membuat SLA Timer menggunakan Days Until Validation. |
| Close Modal | Modal ditutup setelah seluruh proses berhasil. |
| Refresh Table | Document Register Table diperbarui berdasarkan Active Project. |

---

## 5.5.146 Initial Document Initialization

Setelah proses Create berhasil, sistem secara otomatis membentuk informasi awal Engineering Document.

| Attribute | Initial Value | Source |
|-----------|---------------|--------|
| Project ID | Active Project | Project Context |
| Drawing | PFD atau P&ID | Drawing Context |
| Revision | IFR-Submitted | BUSINESS-WORKFLOW.md |
| Status | Process Review | BUSINESS-WORKFLOW.md |
| Current Assignee | Team Process | BUSINESS-WORKFLOW.md |
| SLA Timer | Running | Days Until Validation |
| NAS Location | System Generated | Upload Process |

Seluruh nilai awal dihasilkan oleh sistem dan tidak dimasukkan oleh pengguna melalui Create Modal.

---

## 5.5.147 Processing State Behaviour

| Processing State | System Behaviour |
|------------------|------------------|
| Idle | Menunggu interaksi pengguna. |
| Validating | Memeriksa seluruh field input. |
| Saving | Menjalankan Processing Pipeline. |
| Failed | Menampilkan Validation Error dan mempertahankan seluruh input. |
| Success | Menutup modal dan memperbarui Document Register. |

Processing State mengikuti **Official Processing State Standard**.

---

## 5.5.148 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-MF-001 | Processing Pipeline hanya dimulai setelah Validation berhasil. |
| BR-MF-002 | Upload Document dilakukan sebelum metadata disimpan. |
| BR-MF-003 | NAS Location hanya dihasilkan setelah Upload Document berhasil. |
| BR-MF-004 | Revision awal mengikuti BUSINESS-WORKFLOW.md. |
| BR-MF-005 | Status awal mengikuti BUSINESS-WORKFLOW.md. |
| BR-MF-006 | Current Assignee awal mengikuti BUSINESS-WORKFLOW.md. |
| BR-MF-007 | SLA Timer diinisialisasi menggunakan Days Until Validation. |
| BR-MF-008 | Modal hanya ditutup setelah seluruh Processing Pipeline selesai. |
| BR-MF-009 | Document Register wajib diperbarui setelah proses berhasil. |
| BR-MF-010 | Document baru wajib menerima Project ID dari Active Project. |
| BR-MF-011 | Create Document ditolak apabila Active Project atau Project Membership tidak valid. |
| BR-MF-012 | User tidak dapat memilih atau mengubah Project ID melalui Create Document Modal. |

---

## 5.5.149 Failure Handling

Apabila proses gagal pada salah satu tahap Processing Pipeline:

- Modal tetap terbuka.
- Seluruh User Input Field dipertahankan.
- Upload Document tetap dipertahankan selama sesi modal berlangsung.
- NAS Location tidak dihasilkan.
- SLA Timer tidak dibuat.
- BUSINESS-WORKFLOW tidak diinisialisasi.
- Sistem menampilkan pesan kesalahan kepada pengguna.
- Processing State berubah menjadi **Failed**.

---

## 5.5.150 Success Handling

Apabila seluruh Processing Pipeline berhasil:

- Engineering Document berhasil dibuat.
- NAS Location berhasil dihasilkan.
- Revision awal dibuat.
- Status awal dibuat.
- Current Assignee ditentukan.
- SLA Timer mulai berjalan.
- Modal ditutup.
- Document Register Table diperbarui.
- Engineering Document langsung muncul pada halaman Document Register sesuai Drawing Context yang aktif.

---

## 5.5.151 Interaction Flow

```text
User

Click Create

        │

        ▼

Create Modal

        │

        ▼

Input Data

        │

        ▼

Save

        │

        ▼

Processing Pipeline

        │

        ▼

Validation

        │

 ┌──────┴─────────┐

 │                │

 ▼                ▼

Failed        Success

 │                │

 ▼                ▼

Show Error    Refresh Table

                   │

                   ▼

             Document Appears
```

---

## 5.5.152 Cross Reference

Modal Flow mengacu pada:

- PART D.1 — Create Document Modal Layout
- PART D.2 — Input Fields
- PART D.3 — Field Behaviour
- PART D.4 — Action Buttons
- STEP 7 — Validation Rules
- STEP 8 — Permission Matrix
- BUSINESS-WORKFLOW.md

---

## 5.5.153 Acceptance Criteria

Modal Flow dinyatakan memenuhi spesifikasi apabila:

- Mengikuti Official Processing Pipeline.
- Mengikuti Official Processing State Standard.
- Upload dilakukan sebelum metadata disimpan.
- NAS Location hanya dihasilkan setelah Upload berhasil.
- Revision, Status, dan Current Assignee diinisialisasi secara otomatis sesuai BUSINESS-WORKFLOW.md.
- SLA Timer diinisialisasi menggunakan Days Until Validation.
- Modal hanya ditutup setelah seluruh proses berhasil.
- Document Register diperbarui secara otomatis setelah Engineering Document berhasil dibuat.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART E.1 — Edit Document Modal Layout
# ==============================================================================

# PART E.1 — Edit Document Modal Layout

## 5.5.154 Overview

Edit Document Modal merupakan **Document Update Workspace** yang digunakan untuk memperbarui informasi Engineering Document yang telah ada.

Modal ini ditampilkan ketika pengguna menekan tombol **Edit** pada kolom **Actions** di Document Register Table.

Berbeda dengan Create Document Modal, seluruh informasi pada Edit Document Modal berasal dari Engineering Document yang telah tersimpan.

Nama modal mengikuti Drawing Context yang sedang aktif.

- Halaman PFD → **Edit PFD**
- Halaman P&ID → **Edit P&ID**

Edit Document Modal hanya bertanggung jawab menyediakan antarmuka untuk memperbarui informasi Engineering Document.

Edit Document Modal **tidak membuat Engineering Document baru** dan **tidak mengontrol Business Workflow**.

---

## 5.5.155 UI Wireframe

### Edit PFD

```text
┌──────────────────────────────────────────────────────────────┐

                        Edit PFD

────────────────────────────────────────────────────────────────

Upload Document (Optional)

┌──────────────────────────────────────────────────────────┐
│ Choose File...                                           │
└──────────────────────────────────────────────────────────┘

Document Number

┌──────────────────────────────────────────────────────────┐
│ Existing Document Number                                 │
└──────────────────────────────────────────────────────────┘

Description

┌──────────────────────────────────────────────────────────┐
│ Existing Description                                     │
└──────────────────────────────────────────────────────────┘

Area

┌──────────────────────────────────────────────────────────┐
│ Existing Area                                            │
└──────────────────────────────────────────────────────────┘

Days Until Validation

┌──────────────────────────────────────────────────────────┐
│ Existing Days Until Validation                           │
└──────────────────────────────────────────────────────────┘

NAS Location

┌──────────────────────────────────────────────────────────┐
│ \\NAS\Project\PFD\PFD-001.pdf                            │
└──────────────────────────────────────────────────────────┘
(Read Only)

────────────────────────────────────────────────────────────────

                 [ Cancel ]      [ Update ]

└──────────────────────────────────────────────────────────────┘
```

Layout Edit P&ID identik dengan Edit PFD, hanya berbeda pada judul modal.

---

## 5.5.156 Component Structure

```text
Edit Document Modal

│

├── Modal Header

├── Modal Body

│      ├── Upload Document (Optional)
│      ├── Document Number
│      ├── Description
│      ├── Area
│      ├── Days Until Validation
│      └── NAS Location (Read Only)

├── Modal Footer

│      ├── Cancel Button
│      └── Update Button

└── Modal Overlay
```

---

## 5.5.157 Component Specification

| Component | Description |
|------------|-------------|
| Modal Header | Menampilkan nama modal sesuai Drawing Context. |
| Modal Body | Menampilkan informasi Engineering Document yang dapat diperbarui. |
| Modal Footer | Menampilkan tombol Cancel dan Update. |
| Modal Overlay | Menonaktifkan interaksi dengan halaman utama selama modal aktif. |

---

## 5.5.158 Display Specification

### Modal Title

| Drawing Context | Modal Title |
|-----------------|-------------|
| PFD | Edit PFD |
| P&ID | Edit P&ID |

### Layout Rules

- Modal ditampilkan di tengah layar.
- Overlay menutupi seluruh halaman.
- Seluruh nilai awal berasal dari Engineering Document yang dipilih.
- Upload Document bersifat **opsional**.
- NAS Location selalu ditampilkan sebagai **System Information Field** dalam kondisi **Read Only**.
- Layout mengikuti **Official Modal Documentation Standard**.

---

## 5.5.159 Functional Behaviour

Ketika Edit Document Modal dibuka:

- Sistem mengambil Engineering Document yang dipilih.
- Seluruh User Input Field diisi menggunakan data yang tersimpan.
- NAS Location ditampilkan menggunakan nilai yang tersimpan pada sistem.
- Upload Document tetap kosong dan siap menerima file revisi apabila diperlukan.
- Pengguna hanya dapat memperbarui informasi yang diperbolehkan.

Perubahan baru diproses setelah pengguna menekan tombol **Update**.

---

## 5.5.160 Official Document Lifecycle Principle

Edit Document Modal hanya bertanggung jawab memperbarui data Engineering Document yang diperbolehkan.

**Edit Document Modal tidak secara langsung mengubah:**

- Revision
- Status
- Current Assignee
- SLA Timer
- BUSINESS-WORKFLOW

Perubahan terhadap atribut-atribut tersebut **hanya dapat terjadi apabila dipicu oleh aturan yang didefinisikan di BUSINESS-WORKFLOW.md.**

Dengan demikian:

- Perubahan Document Number **tidak otomatis** mengubah Revision.
- Perubahan Description **tidak otomatis** mengubah Status.
- Perubahan Area **tidak otomatis** mengubah Current Assignee.
- Perubahan Days Until Validation **tidak otomatis** menginisialisasi ulang SLA Timer.
- Upload file revisi **tidak otomatis** mengubah Workflow.

Seluruh perubahan terhadap Document Lifecycle harus mengikuti BUSINESS-WORKFLOW.md.

Prinsip ini menjadi **Official Document Lifecycle Principle** untuk seluruh aplikasi EDMS.

---

## 5.5.161 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-EDM-001 | Modal Title mengikuti Drawing Context. |
| BR-EDM-002 | Seluruh data awal berasal dari Engineering Document yang dipilih. |
| BR-EDM-003 | NAS Location merupakan System Information Field dan selalu Read Only. |
| BR-EDM-004 | Upload Document bersifat opsional. |
| BR-EDM-005 | Update hanya memperbarui informasi yang diperbolehkan. |
| BR-EDM-006 | Edit Document Modal tidak secara langsung mengubah Document Lifecycle. |
| BR-EDM-007 | Perubahan Revision, Status, Current Assignee, SLA Timer, dan BUSINESS-WORKFLOW hanya terjadi apabila dipicu oleh BUSINESS-WORKFLOW.md. |

---

## 5.5.162 Validation Rules

Validasi masing-masing field dijelaskan pada:

- PART E.2 — Input Fields
- STEP 7 — Validation Rules

---

## 5.5.163 Permission Reference

| Official Role | Edit Modal |
|---------------|:----------:|
| Admin | ✓ |
| Document Owner | ✓ |
| Team Process | ✗ |
| Team Project | ✗ |

Hak akses mengikuti Official Role Definition dan STEP 8 — Permission Matrix.

---

## 5.5.164 State Behaviour

| State | Behaviour |
|--------|-----------|
| Closed | Modal tidak ditampilkan. |
| Loading | Sistem mengambil data Engineering Document. |
| Open | Modal siap menerima perubahan. |
| Updating | Seluruh kontrol dinonaktifkan sementara selama proses Update. |
| Success | Modal ditutup setelah Update berhasil. |
| Cancelled | Modal ditutup tanpa menyimpan perubahan. |

---

## 5.5.165 Interaction Flow

```text
User

Click Edit

        │

        ▼

Load Engineering Document

        │

        ▼

Populate Existing Data

        │

        ▼

User Updates Allowed Fields

        │

        ▼

Document Lifecycle

remains unchanged

        │

        ▼

Click Update

        │

        ▼

Update Processing Pipeline
(Refer PART E.5)
```

---

## 5.5.166 Action Specification

| Action | Trigger | System Response |
|----------|---------|-----------------|
| Open Modal | Click Edit | Menampilkan Edit Modal beserta data Engineering Document. |
| Cancel | Click Cancel | Menutup modal tanpa menyimpan perubahan. |
| Update | Click Update | Memulai Validation dan Update Processing Pipeline. |
| Close | Click Close (X) | Menutup modal tanpa menyimpan perubahan. |

---

## 5.5.167 Cross Reference

Edit Document Modal mengacu pada:

- PART C.4 — Actions Column Specification
- PART D — Create Document Modal
- PART E.2 — Input Fields
- PART E.3 — Field Behaviour
- PART E.4 — Action Buttons
- PART E.5 — Modal Flow
- STEP 7 — Validation Rules
- STEP 8 — Permission Matrix
- BUSINESS-WORKFLOW.md

---

## 5.5.168 Acceptance Criteria

Edit Document Modal dinyatakan memenuhi spesifikasi apabila:

- Modal Title mengikuti Drawing Context.
- Seluruh field awal berasal dari Engineering Document yang dipilih.
- Upload Document bersifat opsional.
- NAS Location selalu ditampilkan sebagai System Information Field dalam kondisi Read Only.
- Layout mengikuti Official Modal Documentation Standard.
- Edit Document Modal tidak secara langsung mengubah Document Lifecycle.
- Perubahan terhadap Revision, Status, Current Assignee, SLA Timer, dan BUSINESS-WORKFLOW hanya terjadi sesuai aturan BUSINESS-WORKFLOW.md.
- Hanya Official Role yang berwenang yang dapat membuka Edit Modal.
- Perubahan hanya diproses setelah pengguna menekan tombol Update.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART E.2 — Input Fields
# ==============================================================================

# PART E.2 — Input Fields

## 5.5.169 Overview

Input Fields merupakan kumpulan field yang digunakan pengguna untuk memperbarui informasi Engineering Document pada Edit Document Modal.

Berbeda dengan Create Document Modal, seluruh nilai awal field berasal dari Engineering Document yang telah tersimpan.

Bagian ini menjadi **Single Source of Truth** untuk seluruh Input Field pada Edit Document Modal.

---

## 5.5.170 Field Definition Matrix

| Field | Field Category | UI Control | Placeholder | Initial Value | Required | Editable | Source | Validation Reference |
|--------|----------------|------------|-------------|---------------|:--------:|:--------:|--------|----------------------|
| Upload Document | File Input Field | File Upload | Choose revised engineering document... | Empty | ✗ | ✓ | User | STEP 7 |
| Document Number | User Input Field | Text Field | Enter document number | Database | ✓ | ✓ | Database | STEP 7 |
| Description | User Input Field | Text Field | Enter document description | Database | ✓ | ✓ | Database | STEP 7 |
| Area | User Input Field | Text Field | Enter area | Database | ✓ | ✓ | Database | STEP 7 |
| Days Until Validation | User Input Field | Number Field | Enter number of days | Database | ✓ | ✓ | Database | STEP 7 |
| NAS Location | System Information Field | Read Only Text Field | — | Database | ✗ | ✗ | System | N/A |

---

## 5.5.171 Field Purpose

| Field | Purpose |
|--------|---------|
| Upload Document | Mengunggah file revisi apabila diperlukan. |
| Document Number | Memperbarui nomor Engineering Document dalam scope Project yang sama. |
| Description | Memperbarui deskripsi Engineering Document. |
| Area | Memperbarui area Engineering Document. |
| Days Until Validation | Memperbarui target validasi apabila diizinkan oleh BUSINESS-WORKFLOW. |
| NAS Location | Menampilkan lokasi penyimpanan file yang saat ini digunakan oleh sistem. |

---

## 5.5.172 Display Specification

### Upload Document

- Menggunakan File Upload Control.
- Selalu kosong ketika Edit Modal dibuka.
- Bersifat **opsional**.
- Placeholder:

```text
Choose revised engineering document...
```

---

### Document Number

- Text Field.
- Nilai awal berasal dari database.
- Placeholder:

```text
Enter document number
```

Perubahan Document Number wajib divalidasi terhadap Document lain pada Project yang sama.

Document Number yang sama pada Project lain tidak dianggap duplikat.

---

### Description

- Text Field.
- Nilai awal berasal dari database.
- Placeholder:

```text
Enter document description
```

---

### Area

- Text Field.
- Nilai awal berasal dari database.
- Placeholder:

```text
Enter area
```

---

### Days Until Validation

- Number Field.
- Nilai awal berasal dari database.
- Placeholder:

```text
Enter number of days
```

- Hanya menerima angka positif.

---

### NAS Location

- Read Only Text Field.
- Nilai berasal dari database.
- Tidak dapat diedit.
- Merupakan **System Information Field**.

---

## 5.5.173 Functional Behaviour

### Upload Document

Upload Document digunakan untuk mengunggah file revisi.

Behaviour:

- Bersifat opsional.
- Tidak wajib diisi ketika melakukan Edit.
- Apabila tidak ada file baru yang dipilih, sistem tetap dapat menyimpan perubahan metadata.
- Apabila file baru dipilih, file tersebut akan diproses pada Update Processing Pipeline.

---

### User Input Fields

Field berikut dapat diperbarui:

- Document Number
- Description
- Area
- Days Until Validation

Seluruh nilai awal berasal dari database.

---

### NAS Location

NAS Location merupakan **System Information Field**.

Behaviour:

- Selalu Read Only.
- Berasal dari database.
- Tidak dapat diubah oleh pengguna.
- Nilainya hanya dapat berubah sebagai hasil dari Update Processing Pipeline apabila file revisi berhasil diunggah.

---

## 5.5.174 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-EFLD-001 | Upload Document bersifat opsional. |
| BR-EFLD-002 | Seluruh User Input Field menggunakan nilai awal dari database. |
| BR-EFLD-003 | NAS Location merupakan System Information Field. |
| BR-EFLD-004 | NAS Location tidak dapat diedit oleh pengguna. |
| BR-EFLD-005 | Perubahan NAS Location hanya dapat dilakukan oleh sistem melalui Update Processing Pipeline. |
| BR-EFLD-006 | Perubahan metadata tidak secara langsung mengubah Document Lifecycle. |
| BR-EFLD-007 | Seluruh perubahan terhadap Document Lifecycle mengikuti BUSINESS-WORKFLOW.md. |

---

## 5.5.175 Validation Rules

Validasi setiap field dijelaskan pada:

- PART E.3 — Field Behaviour
- STEP 7 — Validation Rules

---

## 5.5.176 Permission Reference

| Official Role | Edit Document |
|---------------|:-------------:|
| Admin | ✓ |
| Document Owner | ✓ |
| Team Process | ✗ |
| Team Project | ✗ |

Hak akses mengikuti:

- Official Role Definition
- STEP 8 — Permission Matrix

---

## 5.5.177 State Behaviour

| State | Behaviour |
|--------|-----------|
| Loading | Seluruh data Engineering Document diambil dari database. |
| Editing | Seluruh User Input Field siap diperbarui. |
| Updating | Seluruh kontrol dinonaktifkan sementara. |
| Success | Perubahan berhasil disimpan. |
| Failed | Seluruh input tetap dipertahankan. |

---

## 5.5.178 Interaction Flow

```text
Edit Modal

        │

        ▼

Load Engineering Document

        │

        ▼

Populate Existing Data

        │

        ▼

User memperbarui

Metadata

(Optional)

Upload Revised Document

        │

        ▼

NAS Location

tetap Read Only

        │

        ▼

Update
```

---

## 5.5.179 Action Specification

| User Action | System Response |
|-------------|-----------------|
| Replace File | Menyimpan file revisi sementara hingga Update ditekan. |
| Edit Metadata | Memperbarui nilai field. |
| Click Update | Menjalankan Validation dan Update Processing Pipeline. |
| Click Cancel | Menutup modal tanpa menyimpan perubahan. |

---

## 5.5.180 Cross Reference

Input Fields mengacu pada:

- PART E.1 — Edit Document Modal Layout
- PART E.3 — Field Behaviour
- PART E.4 — Action Buttons
- PART E.5 — Modal Flow
- STEP 7 — Validation Rules
- STEP 8 — Permission Matrix
- BUSINESS-WORKFLOW.md

---

## 5.5.181 Acceptance Criteria

Input Fields dinyatakan memenuhi spesifikasi apabila:

- Seluruh field mengikuti Field Definition Matrix.
- Seluruh User Input Field menggunakan nilai awal dari database.
- Upload Document bersifat opsional.
- Metadata dapat diperbarui tanpa mengunggah file baru.
- NAS Location selalu ditampilkan sebagai System Information Field dalam kondisi Read Only.
- Perubahan terhadap Document Lifecycle hanya terjadi sesuai BUSINESS-WORKFLOW.md.
- Seluruh field mengikuti Official Field Classification Standard.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART E.3 — Field Behaviour
# ==============================================================================

# PART E.3 — Field Behaviour

## 5.5.182 Overview

Field Behaviour mendefinisikan perilaku setiap field pada Edit Document Modal selama proses pembaruan Engineering Document.

Berbeda dengan Create Document Modal, seluruh field pada Edit Document Modal telah memiliki nilai awal yang berasal dari Engineering Document yang tersimpan.

Bagian ini menjelaskan:

- Perilaku setiap field.
- Interaksi pengguna.
- Respons sistem.
- Hubungan antar field.
- Persiapan Update Processing Pipeline.

---

## 5.5.183 Official Field Behaviour Lifecycle

Seluruh field pada Edit Document Modal mengikuti lifecycle berikut.

```text
Load Existing Data

        │

        ▼

Populate Fields

        │

        ▼

User Modification

        │

        ▼

Validation

        │

        ▼

Ready for Update
```

System Information Field mengikuti lifecycle berikut.

```text
Load Existing Data

        │

        ▼

Display Information

(Read Only)

        │

        ▼

Waiting System Process

        │

        ▼

Updated By System
(If Required)
```

---

## 5.5.184 Behaviour Matrix

| Field | Initial State | User Interaction | System Behaviour |
|--------|---------------|-----------------|------------------|
| Upload Document | Empty | Select / Replace File | Menyimpan file revisi sementara hingga Update ditekan. |
| Document Number | Database | Edit Text | Memperbarui nilai field. |
| Description | Database | Edit Text | Memperbarui nilai field. |
| Area | Database | Edit Text | Memperbarui nilai field. |
| Days Until Validation | Database | Edit Number | Memperbarui nilai field. |
| NAS Location | Database (Read Only) | Tidak dapat diedit | Tetap menggunakan nilai yang tersimpan sampai sistem memperbaruinya melalui Update Processing Pipeline. |

---

## 5.5.185 File Input Field Behaviour

### Upload Document

Upload Document digunakan untuk mengunggah file revisi.

Behaviour:

- Bersifat **opsional**.
- Selalu kosong ketika Edit Modal dibuka.
- Pengguna dapat memilih file revisi.
- Pengguna dapat mengganti file revisi sebelum Update ditekan.
- File revisi hanya disimpan sementara selama modal masih terbuka.
- File revisi belum menggantikan file lama.
- File revisi baru diproses ketika pengguna menekan **Update**.

---

## 5.5.186 Official File Replacement Behaviour

Seluruh proses penggantian file pada EDMS mengikuti prinsip berikut.

### Tanpa File Revisi

Apabila pengguna **tidak memilih Upload Document**:

- Sistem tetap menggunakan file Engineering Document yang saat ini tersimpan.
- NAS Location tetap menggunakan lokasi file yang lama.
- Tidak terjadi proses upload file.
- Metadata tetap dapat diperbarui.

---

### Dengan File Revisi

Apabila pengguna memilih Upload Document:

- Sistem menyimpan file revisi sementara.
- File lama **belum digantikan**.
- Engineering Document tetap menggunakan file lama selama proses Edit berlangsung.
- File revisi hanya menjadi **Candidate Replacement File**.

Penggantian file hanya dilakukan apabila:

- Validation berhasil.
- Update Processing Pipeline berhasil diselesaikan.

Setelah seluruh proses berhasil:

- File lama digantikan oleh file revisi.
- NAS Location diperbarui oleh sistem apabila lokasi penyimpanan berubah.
- Engineering Document menggunakan file revisi sebagai dokumen aktif.

Standar ini menjadi **Official File Replacement Behaviour** untuk seluruh aplikasi EDMS.

---

## 5.5.187 User Input Field Behaviour

Field berikut dapat diperbarui:

- Document Number
- Description
- Area
- Days Until Validation

Behaviour:

- Nilai awal berasal dari database.
- Dapat diubah selama modal masih terbuka.
- Nilai tetap dipertahankan apabila validasi gagal.
- Nilai dikirim ke sistem ketika tombol Update ditekan.
- Tidak mengubah field lain secara otomatis.

---

## 5.5.188 System Information Field Behaviour

NAS Location merupakan **System Information Field**.

Behaviour:

- Selalu Read Only.
- Selalu berasal dari database.
- Tidak dapat diedit oleh pengguna.
- Tidak berubah ketika pengguna memilih file revisi.
- Hanya dapat berubah setelah Update Processing Pipeline berhasil diselesaikan.

---

## 5.5.189 Inter-Field Behaviour

Field bekerja secara independen.

Namun beberapa field memiliki hubungan terhadap proses sistem.

### Upload Document

Pemilihan file revisi:

- Tidak langsung mengganti file lama.
- Tidak langsung mengubah NAS Location.
- Tidak langsung mengubah Document Lifecycle.

---

### Days Until Validation

Perubahan nilai Days Until Validation tidak secara langsung mengubah SLA Timer.

Perubahan SLA Timer hanya dapat terjadi apabila diatur oleh BUSINESS-WORKFLOW.md.

---

## 5.5.190 Processing Preparation

Sebelum Update Processing Pipeline dimulai, sistem mempersiapkan:

- File revisi (jika ada)
- Document Number
- Description
- Area
- Days Until Validation

NAS Location tidak termasuk data yang dipersiapkan oleh pengguna karena merupakan **System Information Field**.

Urutan proses pembaruan dijelaskan pada:

**PART E.5 — Modal Flow**

---

## 5.5.191 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-EFB-001 | Upload Document bersifat opsional. |
| BR-EFB-002 | Metadata dapat diperbarui tanpa upload file revisi. |
| BR-EFB-003 | File revisi tidak langsung menggantikan file lama. |
| BR-EFB-004 | File lama hanya digantikan setelah Update Processing Pipeline berhasil. |
| BR-EFB-005 | NAS Location hanya diperbarui oleh sistem. |
| BR-EFB-006 | Days Until Validation tidak secara langsung mengubah SLA Timer. |
| BR-EFB-007 | Perubahan Document Lifecycle hanya mengikuti BUSINESS-WORKFLOW.md. |

---

## 5.5.192 Validation Rules

Perilaku field mengikuti aturan validasi yang dijelaskan pada:

- STEP 7 — Validation Rules

Bagian ini tidak mendefinisikan aturan validasi.

---

## 5.5.193 Permission Reference

| Official Role | Edit Behaviour |
|---------------|:--------------:|
| Admin | ✓ |
| Document Owner | ✓ |
| Team Process | ✗ |
| Team Project | ✗ |

Hak akses mengikuti:

- Official Role Definition
- STEP 8 — Permission Matrix

---

## 5.5.194 State Behaviour

| Processing State | Behaviour |
|------------------|-----------|
| Loading | Mengambil Engineering Document dari database. |
| Editing | Pengguna dapat memperbarui metadata dan memilih file revisi. |
| Validation Failed | Seluruh perubahan dipertahankan. |
| Updating | Seluruh kontrol dinonaktifkan sementara. |
| Success | Perubahan berhasil disimpan dan modal ditutup. |
| Cancel | Seluruh perubahan dibatalkan. |

---

## 5.5.195 Interaction Flow

```text
Load Existing Data

        │

        ▼

Populate Fields

        │

        ▼

User Updates Metadata

(Optional)

Select Revised File

        │

        ▼

Candidate Replacement File

        │

        ▼

Click Update

        │

        ▼

Processing Ready

        │

        ▼

Refer PART E.5
```

---

## 5.5.196 Action Specification

| User Action | System Behaviour |
|-------------|------------------|
| Replace File | Menyimpan file revisi sementara. |
| Edit Metadata | Memperbarui nilai field. |
| Click Update | Menyiapkan seluruh data untuk Update Processing Pipeline. |
| Click Cancel | Membatalkan seluruh perubahan. |

---

## 5.5.197 Cross Reference

Field Behaviour mengacu pada:

- PART E.1 — Edit Document Modal Layout
- PART E.2 — Input Fields
- PART E.4 — Action Buttons
- PART E.5 — Modal Flow
- STEP 7 — Validation Rules
- STEP 8 — Permission Matrix
- BUSINESS-WORKFLOW.md

---

## 5.5.198 Acceptance Criteria

Field Behaviour dinyatakan memenuhi spesifikasi apabila:

- Seluruh User Input Field mengikuti Official Field Behaviour Lifecycle.
- Upload Document bersifat opsional.
- Metadata dapat diperbarui tanpa upload file revisi.
- File revisi tidak menggantikan file lama sebelum Update Processing Pipeline berhasil.
- NAS Location tetap menggunakan nilai yang tersimpan hingga diperbarui oleh sistem.
- Perubahan terhadap Document Lifecycle hanya mengikuti BUSINESS-WORKFLOW.md.
- Seluruh field siap diproses pada Update Processing Pipeline.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART E.4 — Action Buttons
# ==============================================================================

# PART E.4 — Action Buttons

## 5.5.199 Overview

Action Buttons merupakan komponen yang menyediakan aksi utama pada Edit Document Modal.

Action Buttons tidak menjalankan Business Logic secara langsung.

Setiap Action Button hanya memicu proses tertentu yang kemudian dijalankan oleh sistem sesuai BUSINESS-WORKFLOW.md.

Pada Edit Document Modal hanya terdapat dua Action Button:

- Cancel
- Update

Seluruh Action Button mengikuti:

- Official Button Feedback Standard
- Official Processing State Standard

---

## 5.5.200 UI Wireframe

```text
┌────────────────────────────────────────────────────────────┐

                     Edit PFD

─────────────────────────────────────────────────────────────

                  (Input Fields)

─────────────────────────────────────────────────────────────

                 [ Cancel ]    [ Update ]

└────────────────────────────────────────────────────────────┘
```

Action Button selalu berada pada Modal Footer.

---

## 5.5.201 Component Structure

```text
Modal Footer

│

├── Cancel Button

└── Update Button
```

---

## 5.5.202 Component Specification

| Button | Description |
|----------|-------------|
| Cancel | Menutup Edit Modal tanpa menyimpan perubahan. |
| Update | Menjalankan Validation dan memulai Update Processing Pipeline. |

---

## 5.5.203 Display Specification

### Cancel Button

- Secondary Button.
- Selalu berada di sebelah kiri.
- Selalu ditampilkan.

---

### Update Button

- Primary Button.
- Selalu berada di sebelah kanan.
- Menjadi Primary Action pada Edit Modal.

---

### Layout Rules

- Cancel selalu di kiri.
- Update selalu di kanan.
- Posisi tombol konsisten pada seluruh modal EDMS.
- Urutan tombol tidak boleh diubah.

---

## 5.5.204 Official Processing State Standard

Seluruh proses pada Edit Modal mengikuti Official Processing State Standard.

```text
Idle

 │

 ▼

Validating

 │

 ▼

Updating

 │

 ├────────────► Failed

 │

 └────────────► Success
```

### Processing State

| State | Description |
|---------|-------------|
| Idle | Modal siap menerima perubahan. |
| Validating | Sistem melakukan validasi. |
| Updating | Sistem menjalankan Update Processing Pipeline. |
| Failed | Update gagal. |
| Success | Update berhasil. |

---

## 5.5.205 Official Button Feedback Standard

### Update Button Lifecycle

| Processing State | Button Label | Status | Feedback |
|------------------|--------------|--------|----------|
| Idle | Update | Enabled | Siap digunakan. |
| Validating | Update | Disabled | Menunggu hasil validasi. |
| Updating | Updating... | Disabled | Loading Spinner ditampilkan. |
| Failed | Update | Enabled | Error Message ditampilkan. |
| Success | Modal Closed | Completed | Modal ditutup otomatis. |

---

### Cancel Button Lifecycle

| Processing State | Status | Behaviour |
|------------------|--------|-----------|
| Idle | Enabled | Modal dapat ditutup. |
| Validating | Disabled | Menunggu validasi selesai. |
| Updating | Disabled | Tidak dapat membatalkan proses. |
| Failed | Enabled | Pengguna dapat memperbaiki data atau membatalkan perubahan. |
| Success | Hidden | Modal ditutup otomatis. |

---

### Button Feedback Principles

Seluruh Action Button wajib:

- Mengikuti Official Button Feedback Standard.
- Mengikuti Official Processing State Standard.
- Menampilkan Loading Spinner selama Updating.
- Mencegah Double Click.
- Kembali ke kondisi Idle apabila proses gagal.

---

## 5.5.206 Functional Behaviour

### Cancel Button

Ketika pengguna memilih Cancel:

- Seluruh perubahan metadata dibatalkan.
- Candidate Replacement File dibuang.
- Modal ditutup.
- Tidak ada perubahan yang disimpan.

---

### Update Button

Ketika pengguna memilih Update:

1. Sistem berpindah ke Processing State **Validating**.
2. Seluruh field diperiksa.
3. Jika Validation gagal → Processing State menjadi **Failed**.
4. Jika Validation berhasil → Processing State menjadi **Updating**.
5. Update Processing Pipeline dimulai.

Update Processing Pipeline dijelaskan pada:

**PART E.5 — Modal Flow**

---

## 5.5.207 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-EBTN-001 | Cancel tidak pernah menyimpan perubahan. |
| BR-EBTN-002 | Update selalu menjalankan Validation terlebih dahulu. |
| BR-EBTN-003 | Update Processing Pipeline hanya dimulai setelah Validation berhasil. |
| BR-EBTN-004 | Seluruh Action Button mengikuti Official Button Feedback Standard. |
| BR-EBTN-005 | Seluruh Modal mengikuti Official Processing State Standard. |
| BR-EBTN-006 | Seluruh Input Field dinonaktifkan selama Updating. |
| BR-EBTN-007 | Candidate Replacement File dibuang apabila pengguna memilih Cancel. |
| BR-EBTN-008 | Update tidak secara langsung mengubah Document Lifecycle. |
| BR-EBTN-009 | Perubahan Document Lifecycle hanya mengikuti BUSINESS-WORKFLOW.md. |

---

## 5.5.208 Validation Rules

Action Button tidak memiliki aturan validasi sendiri.

Update Button hanya memicu proses Validation.

Seluruh aturan Validation dijelaskan pada:

- STEP 7 — Validation Rules

---

## 5.5.209 Permission Reference

| Official Role | Cancel | Update |
|---------------|:------:|:------:|
| Admin | ✓ | ✓ |
| Document Owner | ✓ | ✓ |
| Team Process | ✗ | ✗ |
| Team Project | ✗ | ✗ |

Hak akses mengikuti:

- Official Role Definition
- STEP 8 — Permission Matrix

---

## 5.5.210 State Behaviour

| Processing State | Cancel | Update | Input Field |
|------------------|:------:|:------:|:-----------:|
| Idle | Enabled | Enabled | Enabled |
| Validating | Disabled | Disabled | Disabled |
| Updating | Disabled | Disabled | Disabled |
| Failed | Enabled | Enabled | Enabled |
| Success | Modal Closed | Completed | Read Only |

---

## 5.5.211 Interaction Flow

```text
User

Click Update

      │

      ▼

Processing State

Idle

      │

      ▼

Validating

      │

 ┌────┴─────────┐

 │              │

 ▼              ▼

Failed      Validation Passed

 │              │

 ▼              ▼

Show Error   Updating...

                 │

                 ▼

Update Processing Pipeline

(Refer PART E.5)

                 │

                 ▼

Success

                 │

                 ▼

Close Modal

Refresh Document Register
```

---

## 5.5.212 Action Specification

| Action | Trigger | System Response |
|----------|---------|-----------------|
| Cancel | Click Cancel | Menutup modal tanpa menyimpan perubahan. |
| Update | Click Update | Memulai Processing State = Validating. |
| Validation Failed | Validation Error | Processing State = Failed. |
| Validation Success | Validation Passed | Processing State = Updating. |
| Updating | Processing | Update berubah menjadi **Updating...**, Loading Spinner ditampilkan. |
| Success | Update Complete | Modal ditutup dan Document Register diperbarui. |

---

## 5.5.213 Cross Reference

Action Buttons mengacu pada:

- PART E.1 — Edit Document Modal Layout
- PART E.2 — Input Fields
- PART E.3 — Field Behaviour
- PART E.5 — Modal Flow
- STEP 7 — Validation Rules
- STEP 8 — Permission Matrix
- BUSINESS-WORKFLOW.md

---

## 5.5.214 Acceptance Criteria

Action Buttons dinyatakan memenuhi spesifikasi apabila:

- Hanya terdiri dari Cancel dan Update.
- Mengikuti Official Button Feedback Standard.
- Mengikuti Official Processing State Standard.
- Update selalu memulai Processing State = Validating.
- Loading Spinner hanya ditampilkan pada Processing State = Updating.
- Candidate Replacement File dibuang apabila pengguna membatalkan proses.
- Double Click Prevention diterapkan selama Validating dan Updating.
- Perubahan terhadap Document Lifecycle hanya terjadi sesuai BUSINESS-WORKFLOW.md.
- Perilaku Action Button konsisten pada seluruh aplikasi EDMS.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART E.5 — Modal Flow
# ==============================================================================

# PART E.5 — Modal Flow

## 5.5.215 Overview

Modal Flow mendefinisikan keseluruhan proses pembaruan Engineering Document mulai dari pengguna membuka Edit Document Modal hingga perubahan berhasil disimpan.

Bagian ini menjadi **Single Source of Truth** untuk seluruh lifecycle proses Update Engineering Document.

Modal Flow mengintegrasikan:

- User Interaction
- Processing State
- Validation
- Optional File Replacement
- Metadata Update
- BUSINESS-WORKFLOW
- Document Lifecycle
- Document Register Refresh

---

## 5.5.216 Official Update Processing Pipeline

Seluruh proses Update Engineering Document mengikuti Processing Pipeline berikut.

```text
Open Edit Modal

        │

        ▼

Load Engineering Document

        │

        ▼

Populate Existing Data

        │

        ▼

User Updates Metadata

(Optional)

Select Revised File

        │

        ▼

Click Update

        │

        ▼

Validation

        │

 ┌──────┴─────────┐

 │                │

 ▼                ▼

Failed        Passed

 │                │

 ▼                ▼

Show Error     Determine Update Type

                    │

         ┌──────────┴──────────┐

         │                     │

         ▼                     ▼

Metadata Only         Metadata + File

         │                     │

         └──────────┬──────────┘

                    ▼

          Update Engineering Document

                    │

                    ▼

      Replace Active Document File
       (Only if Revised File Exists)

                    │

                    ▼

      Update NAS Location
 (Only if Storage Location Changes)

                    │

                    ▼

 Apply BUSINESS-WORKFLOW Rules

                    │

                    ▼

 Apply Document Lifecycle Rules

                    │

                    ▼

 Refresh Document Register

                    │

                    ▼

 Close Edit Modal
```

Pipeline ini menjadi standar resmi seluruh proses Update Engineering Document.

---

## 5.5.217 Processing Stages

| Stage | Description |
|--------|-------------|
| Open Modal | Menampilkan Edit Document Modal. |
| Load Existing Data | Mengambil Engineering Document dari sistem. |
| Populate Fields | Mengisi seluruh field menggunakan data yang tersimpan. |
| Validation | Memvalidasi perubahan pengguna. |
| Determine Update Type | Menentukan apakah hanya metadata atau metadata + file yang berubah. |
| Update Metadata | Memperbarui informasi Engineering Document. |
| Replace File | Mengganti file aktif apabila terdapat Candidate Replacement File. |
| Update NAS Location | Memperbarui NAS Location apabila diperlukan. |
| Apply BUSINESS-WORKFLOW Rules | Menjalankan aturan workflow apabila terdapat kondisi yang memicunya. |
| Apply Document Lifecycle Rules | Memastikan lifecycle mengikuti Official Document Lifecycle Principle. |
| Refresh Document Register | Memperbarui daftar dokumen. |
| Close Modal | Menutup modal setelah proses berhasil. |

---

## 5.5.218 Update Types

### Metadata Only Update

Terjadi apabila:

- Pengguna hanya memperbarui metadata.
- Tidak memilih Upload Document.

System Behaviour:

- Metadata diperbarui.
- File aktif tetap digunakan.
- NAS Location tetap sama.
- Candidate Replacement File tidak ada.

---

### Metadata + File Update

Terjadi apabila:

- Pengguna memperbarui metadata.
- Memilih Upload Document.

System Behaviour:

- Metadata diperbarui.
- Candidate Replacement File diproses.
- File aktif diganti setelah seluruh pipeline berhasil.
- NAS Location diperbarui apabila lokasi penyimpanan berubah.

---

## 5.5.219 Official Document Lifecycle Principle

Update Engineering Document **tidak secara langsung mengubah**:

- Revision
- Status
- Current Assignee
- SLA Timer
- BUSINESS-WORKFLOW

Perubahan terhadap atribut tersebut hanya terjadi apabila dipicu oleh aturan yang didefinisikan pada BUSINESS-WORKFLOW.md.

Dengan demikian:

- Update metadata tidak otomatis mengubah workflow.
- Upload file revisi tidak otomatis mengubah workflow.
- Perubahan lifecycle sepenuhnya dikendalikan oleh BUSINESS-WORKFLOW.md.

---

## 5.5.220 Processing State Behaviour

| Processing State | System Behaviour |
|------------------|------------------|
| Idle | Menunggu interaksi pengguna. |
| Validating | Memvalidasi seluruh perubahan. |
| Updating | Menjalankan Update Processing Pipeline. |
| Failed | Menampilkan pesan kesalahan dan mempertahankan seluruh perubahan. |
| Success | Menutup modal dan memperbarui Document Register. |

Processing State mengikuti **Official Processing State Standard**.

---

## 5.5.221 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-EMF-001 | Update Processing Pipeline hanya dimulai setelah Validation berhasil. |
| BR-EMF-002 | Candidate Replacement File hanya diproses apabila Upload Document dipilih. |
| BR-EMF-003 | File aktif hanya diganti setelah seluruh Update Processing Pipeline berhasil. |
| BR-EMF-004 | NAS Location hanya diperbarui oleh sistem. |
| BR-EMF-005 | Metadata dapat diperbarui tanpa upload file revisi. |
| BR-EMF-006 | Update Engineering Document mengikuti Official Document Lifecycle Principle. |
| BR-EMF-007 | Perubahan Revision, Status, Current Assignee, SLA Timer, dan BUSINESS-WORKFLOW hanya terjadi sesuai BUSINESS-WORKFLOW.md. |
| BR-EMF-008 | Document Register wajib diperbarui setelah proses Update berhasil. |

---

## 5.5.222 Failure Handling

Apabila proses gagal:

- Modal tetap terbuka.
- Seluruh metadata tetap dipertahankan.
- Candidate Replacement File tetap dipertahankan selama sesi Edit berlangsung.
- File aktif tidak berubah.
- NAS Location tidak berubah.
- Document Lifecycle tidak berubah.
- Sistem menampilkan pesan kesalahan.
- Processing State berubah menjadi **Failed**.

---

## 5.5.223 Success Handling

Apabila seluruh Update Processing Pipeline berhasil:

- Metadata berhasil diperbarui.
- Candidate Replacement File menjadi file aktif (jika ada).
- NAS Location diperbarui oleh sistem apabila diperlukan.
- BUSINESS-WORKFLOW dievaluasi.
- Document Lifecycle mengikuti BUSINESS-WORKFLOW.
- Document Register diperbarui.
- Modal ditutup.
- Engineering Document tetap berada pada Drawing Context yang sama (PFD atau P&ID).

---

## 5.5.224 Interaction Flow

```text
User

Click Edit

        │

        ▼

Load Existing Document

        │

        ▼

Update Metadata

(Optional)

Upload Revised File

        │

        ▼

Validation

        │

 ┌──────┴────────┐

 │               │

 ▼               ▼

Failed        Success

 │               │

 ▼               ▼

Show Error   Update Processing Pipeline

                  │

                  ▼

      Evaluate BUSINESS-WORKFLOW

                  │

                  ▼

Refresh Document Register

                  │

                  ▼

Close Modal
```

---

## 5.5.225 Cross Reference

Modal Flow mengacu pada:

- PART E.1 — Edit Document Modal Layout
- PART E.2 — Input Fields
- PART E.3 — Field Behaviour
- PART E.4 — Action Buttons
- STEP 7 — Validation Rules
- STEP 8 — Permission Matrix
- BUSINESS-WORKFLOW.md

---

## 5.5.226 Acceptance Criteria

Modal Flow dinyatakan memenuhi spesifikasi apabila:

- Mengikuti Official Update Processing Pipeline.
- Mengikuti Official Processing State Standard.
- Candidate Replacement File hanya menggantikan file aktif setelah seluruh pipeline berhasil.
- Metadata dapat diperbarui tanpa upload file revisi.
- NAS Location hanya diperbarui oleh sistem.
- Update Engineering Document mengikuti Official Document Lifecycle Principle.
- Perubahan Revision, Status, Current Assignee, SLA Timer, dan BUSINESS-WORKFLOW hanya terjadi sesuai BUSINESS-WORKFLOW.md.
- Document Register diperbarui secara otomatis setelah Update berhasil.
- Modal ditutup setelah seluruh proses selesai dengan sukses.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART F.1 — View Document Workspace
# ==============================================================================

# PART F.1 — View Document Workspace

## 5.5.227 Overview

View Document Workspace merupakan workspace yang digunakan untuk menampilkan Engineering Document secara langsung di dalam aplikasi EDMS tanpa mengunduh file.

Workspace ini dibuka ketika pengguna memilih tombol **View** pada Document Register Table.

View Document Workspace menyediakan lingkungan baca (**Read Only Workspace**) sehingga pengguna dapat melihat isi Engineering Document tanpa mengubah data maupun Document Lifecycle.

View Document Workspace termasuk kategori **Information Workspace**.

---

## 5.5.228 Workspace Objective

Workspace ini bertujuan untuk:

- Menampilkan Engineering Document.
- Menyediakan pengalaman membaca dokumen secara langsung di aplikasi.
- Menghindari kebutuhan mengunduh file hanya untuk melihat isi dokumen.
- Memastikan seluruh pengguna melihat Engineering Document yang sedang aktif.

Workspace ini tidak digunakan untuk:

- Edit Document.
- Approval.
- Comment.
- Delete.
- Workflow Transition.

---

## 5.5.229 Workspace Scope

View Document Workspace mencakup:

- Viewer Layout
- Viewer Toolbar
- Viewer Navigation
- Viewer Behaviour
- Viewer Capability
- Error Handling

Seluruh komponen tersebut dijelaskan pada subbagian berikutnya.

---

## 5.5.230 Workspace Classification

| Category | Value |
|----------|-------|
| Workspace Type | Information Workspace |
| Interaction | Read Only |
| Document Lifecycle | Tidak berubah |
| BUSINESS-WORKFLOW | Tidak dijalankan |
| Metadata | Tidak berubah |
| Active File | Digunakan sebagai sumber tampilan |

---

## 5.5.231 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-VWS-001 | Workspace hanya dapat menampilkan Engineering Document aktif. |
| BR-VWS-002 | Workspace selalu menggunakan mode Read Only. |
| BR-VWS-003 | Workspace tidak mengubah Document Lifecycle. |
| BR-VWS-004 | Workspace tidak menjalankan BUSINESS-WORKFLOW. |
| BR-VWS-005 | Workspace tidak mengubah Metadata Engineering Document. |

---

## 5.5.232 Cross Reference

Workspace ini mengacu pada:

- PART C.4 — Actions Column Specification
- BUSINESS-WORKFLOW.md
- STEP 8 — Permission Matrix

---

## 5.5.233 Next Sections

Bagian berikutnya akan menjelaskan:

- F.1.2 Viewer Layout
- F.1.3 Viewer Components
- F.1.4 Viewer Toolbar
- F.1.5 Viewer Behaviour
- F.1.6 Viewer Capability Standard
- F.1.7 Permission
- F.1.8 Error Handling
- F.1.9 Acceptance Criteria

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART F.1 — View Document Workspace
# F.1.1 — Overview
# ==============================================================================

# F.1.1 — Overview

## 5.5.227 Purpose

View Document Workspace merupakan workspace yang digunakan untuk menampilkan Engineering Document secara langsung di dalam aplikasi EDMS tanpa memerlukan proses download.

Workspace ini memberikan pengalaman membaca dokumen (Read Only Workspace) sehingga pengguna dapat melihat isi Engineering Document dengan cepat tanpa mempengaruhi Document Lifecycle maupun BUSINESS-WORKFLOW.

View Document Workspace dibuka ketika pengguna menekan tombol **View** pada kolom **Actions** di Document Register Table.

---

## 5.5.228 Objectives

View Document Workspace memiliki tujuan sebagai berikut:

- Menampilkan Engineering Document secara langsung di dalam aplikasi.
- Mengurangi kebutuhan mengunduh dokumen hanya untuk proses review atau pemeriksaan.
- Menyediakan pengalaman membaca dokumen yang konsisten untuk seluruh Official Role.
- Memastikan seluruh pengguna melihat **Active Engineering Document** yang sedang berlaku.
- Menjadi pusat aktivitas baca dokumen sebelum pengguna melakukan tindakan lain seperti Download, Comment, atau Workflow Review.

---

## 5.5.229 Workspace Scope

View Document Workspace mencakup seluruh komponen yang berhubungan dengan proses membaca Engineering Document.

Ruang lingkup workspace meliputi:

- Viewer Layout
- Viewer Components
- Viewer Toolbar
- Viewer Navigation
- Viewer Behaviour
- Viewer Capability
- Permission
- Error Handling

Workspace ini tidak mencakup:

- Edit Engineering Document
- Delete Engineering Document
- Workflow Approval
- Workflow Transition
- Metadata Editing
- Upload Revisi

Seluruh fungsi tersebut dibahas pada bagian lain di dalam PART 5.

---

## 5.5.230 Workspace Classification

| Attribute | Value |
|-----------|-------|
| Workspace Type | Information Workspace |
| Interaction Type | Read Only |
| Primary Purpose | Document Viewing |
| Data Modification | Not Allowed |
| BUSINESS-WORKFLOW | Not Triggered |
| Document Lifecycle | Preserved |
| Active File Source | Engineering Document Active File |

---

## 5.5.231 Entry Point

View Document Workspace hanya dapat dibuka melalui:

```text
Document Register

        │

        ▼

Document Register Table

        │

        ▼

Actions Column

        │

        ▼

View Button

        │

        ▼

View Document Workspace
```

Workspace tidak dapat dibuka secara langsung tanpa memilih Engineering Document.

---

## 5.5.232 Exit Point

Pengguna dapat keluar dari View Document Workspace melalui:

- Close Button.
- Keyboard Shortcut (jika didukung).
- Browser Back Navigation (jika implementasi menggunakan halaman terpisah).

Ketika Workspace ditutup:

- Engineering Document tetap tidak berubah.
- Metadata tetap tidak berubah.
- Document Lifecycle tetap dipertahankan.
- BUSINESS-WORKFLOW tidak dijalankan.

---

## 5.5.233 Workspace Principles

View Document Workspace mengikuti prinsip berikut:

### Read Only Workspace

Workspace hanya digunakan untuk membaca Engineering Document.

Tidak ada perubahan terhadap data.

---

### Active Document Principle

Workspace selalu menampilkan **Engineering Document Active File**.

Apabila terdapat Candidate Replacement File yang belum berhasil diproses melalui Update Processing Pipeline, Viewer tetap menggunakan Active Engineering Document.

---

### Lifecycle Preservation Principle

Membuka View Document Workspace tidak mengubah:

- Revision
- Status
- Current Assignee
- SLA Timer
- BUSINESS-WORKFLOW

Seluruh Document Lifecycle tetap mengikuti Official Document Lifecycle Principle.

---

### Independent Workspace Principle

Workspace bersifat independen.

Menutup Viewer tidak mempengaruhi:

- Document Register
- Dashboard
- Create Modal
- Edit Modal

---

## 5.5.234 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-VWS-001 | Workspace hanya dapat dibuka melalui View Button pada Document Register. |
| BR-VWS-002 | Workspace selalu menggunakan Engineering Document Active File. |
| BR-VWS-003 | Workspace selalu berjalan dalam mode Read Only. |
| BR-VWS-004 | Workspace tidak mengubah Metadata Engineering Document. |
| BR-VWS-005 | Workspace tidak menjalankan BUSINESS-WORKFLOW. |
| BR-VWS-006 | Workspace tidak mengubah Document Lifecycle. |
| BR-VWS-007 | Candidate Replacement File tidak boleh ditampilkan sebelum Update Processing Pipeline berhasil. |

---

## 5.5.235 Cross Reference

Workspace ini mengacu pada:

- PART C.4 — Actions Column Specification
- PART D — Create Document Modal
- PART E — Edit Document Modal
- PART F.2 — Viewer Layout
- BUSINESS-WORKFLOW.md
- STEP 8 — Permission Matrix

---

## 5.5.236 Acceptance Criteria

View Document Workspace dinyatakan memenuhi spesifikasi apabila:

- Workspace hanya dapat dibuka melalui View Button.
- Workspace menampilkan Engineering Document Active File.
- Workspace selalu berjalan dalam mode Read Only.
- Workspace tidak mengubah Metadata.
- Workspace tidak mengubah Document Lifecycle.
- Workspace tidak menjalankan BUSINESS-WORKFLOW.
- Workspace mengikuti Information Workspace Standard.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART F.1 — View Document Workspace
# F.1.2 — Viewer Layout
# ==============================================================================

# F.1.2 — Viewer Layout

## 5.5.237 Overview

Viewer Layout mendefinisikan struktur visual dari View Document Workspace.

Layout ini mengikuti **Application Layout Architecture** yang telah didefinisikan pada:

- PART 2 — Application Layout Architecture

View Document Workspace hanya menggantikan **Main Content Area**.

Global Layout tidak berubah.

Komponen berikut tetap menggunakan Global Layout:

- Top Navigation
- Left Sidebar
- User Profile
- Notification Area
- Theme
- Responsive Layout

Referensi:

**PART 2 → Application Layout Architecture**

---

# 5.5.238 Workspace Layout

```text
+--------------------------------------------------------------------------------------+
|                     Refer PART 2 — Application Layout Architecture                   |
+--------------------------------------------------------------------------------------+

 Top Navigation (Refer PART 2)

+--------------------------------------------------------------------------------------+

 Sidebar
 (Refer
 PART 2)

│
│
│

│   +-------------------------------------------------------------------------+
│   |                                                                         |
│   |                    View Document Workspace                              |
│   |-------------------------------------------------------------------------|
│   | Workspace Header                                                       |
│   |-------------------------------------------------------------------------|
│   | Document Number                                                        |
│   | Description                                                            |
│   | Revision | Status | Current Assignee                                   |
│   |-------------------------------------------------------------------------|
│   | Viewer Toolbar                                                         |
│   |-------------------------------------------------------------------------|
│   |                                                                         |
│   |                                                                         |
│   |                                                                         |
│   |                    Document Viewer Area                                |
│   |                                                                         |
│   |                                                                         |
│   |                                                                         |
│   |-------------------------------------------------------------------------|
│   | Viewer Status Bar                                                      |
│   +-------------------------------------------------------------------------+
```

Seluruh area di luar Workspace mengikuti **PART 2 — Application Layout Architecture**.

---

## 5.5.239 Layout Structure

```text
View Document Workspace

│

├── Workspace Header

├── Viewer Toolbar

├── Document Viewer Area

└── Viewer Status Bar
```

Workspace menggunakan struktur tunggal tanpa panel samping tambahan.

---

# 5.5.240 Layout Components

| Component | Purpose |
|------------|---------|
| Workspace Header | Menampilkan identitas Engineering Document yang sedang dibuka. |
| Viewer Toolbar | Menyediakan kontrol Viewer. |
| Document Viewer Area | Menampilkan isi Engineering Document. |
| Viewer Status Bar | Menampilkan informasi status Viewer. |

---

# 5.5.241 Workspace Header

Workspace Header berada pada bagian paling atas Workspace.

Workspace Header menampilkan informasi berikut:

- Document Number
- Description
- Revision
- Status
- Current Assignee

Current Assignee menunjukkan pengguna atau role yang saat ini bertanggung jawab terhadap Engineering Document sesuai BUSINESS-WORKFLOW.md.

Workspace Header hanya menampilkan **Document Identity**.

Workspace Header **tidak menampilkan**:

- SLA Timer
- Days Until Validation
- Workflow Action
- Edit Button
- Delete Button
- Approval Button
- Comment Composer

Karena View Document Workspace merupakan **Information Workspace** yang berfokus pada aktivitas membaca dokumen.

---

# 5.5.242 Viewer Toolbar

Toolbar berada tepat di bawah Workspace Header.

Toolbar menyediakan kontrol untuk berinteraksi dengan tampilan dokumen.

Spesifikasi lengkap Toolbar dijelaskan pada:

**PART F.1.4 — Viewer Toolbar**

---

# 5.5.243 Document Viewer Area

Document Viewer Area merupakan area utama Workspace.

Area ini digunakan untuk menampilkan:

- Engineering Drawing
- PDF
- Dokumen lain yang didukung sistem

Viewer Area harus menjadi komponen terbesar pada Workspace.

Workspace selalu memprioritaskan area baca dokumen dibandingkan komponen lainnya.

---

# 5.5.244 Viewer Status Bar

Viewer Status Bar berada di bagian paling bawah Workspace.

Status Bar digunakan untuk menampilkan informasi Viewer.

Contoh informasi:

- Current Page
- Total Pages
- Zoom Percentage
- Viewer Status

Viewer Status Bar tidak digunakan sebagai area aksi.

---

# 5.5.245 Responsive Layout

Viewer Layout mengikuti Responsive Layout Standard.

### Desktop

- Workspace menggunakan lebar maksimum.
- Document Viewer Area menjadi fokus utama.

### Tablet

- Viewer Toolbar menyesuaikan lebar layar.
- Document Viewer Area tetap menjadi area terbesar.

### Mobile

Apabila didukung:

- Toolbar disederhanakan.
- Workspace tetap memprioritaskan Document Viewer Area.

---

# 5.5.246 Layout Principles

Viewer Layout mengikuti prinsip berikut.

### Readability First

Document Viewer Area selalu menjadi komponen terbesar.

---

### Document Identity First

Workspace Header hanya menampilkan identitas utama Engineering Document sehingga pengguna langsung mengetahui dokumen yang sedang dibuka tanpa mengganggu area baca.

---

### Workspace Consistency

Layout mengikuti struktur Workspace EDMS.

---

### Global Layout Preservation

Workspace tidak mengubah:

- Sidebar
- Top Navigation
- Theme
- User Profile

---

### Minimal Distraction

Workspace hanya menampilkan komponen yang diperlukan untuk aktivitas membaca Engineering Document.

---

# 5.5.247 Official Workspace Classification Standard

View Document Workspace diklasifikasikan sebagai:

| Attribute | Value |
|-----------|-------|
| Workspace Type | Information Workspace |
| Interaction | Read Only |
| Business Process | None |
| Data Modification | Not Allowed |
| Workflow Trigger | No |
| Primary Focus | Document Reading |

Standar ini menjadi bagian dari **Official Workspace Classification Standard**.

Workspace lain akan menggunakan klasifikasi yang sama sesuai karakteristiknya.

---

# 5.5.248 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-VLAY-001 | Viewer Layout mengikuti PART 2 — Application Layout Architecture. |
| BR-VLAY-002 | Workspace hanya mengganti Main Content Area. |
| BR-VLAY-003 | Document Viewer Area harus menjadi area terbesar. |
| BR-VLAY-004 | Workspace Header hanya menampilkan Document Identity. |
| BR-VLAY-005 | Workspace Header wajib menampilkan Current Assignee. |
| BR-VLAY-006 | Viewer Toolbar berada di bawah Workspace Header. |
| BR-VLAY-007 | Viewer Status Bar hanya menampilkan informasi Viewer. |
| BR-VLAY-008 | Workspace Header tidak menampilkan Workflow Action maupun informasi SLA. |

---

# 5.5.249 Cross Reference

Viewer Layout mengacu pada:

- PART 2 — Application Layout Architecture
- PART F.1.1 — Overview
- PART F.1.3 — Viewer Components
- PART F.1.4 — Viewer Toolbar
- BUSINESS-WORKFLOW.md

---

# 5.5.250 Acceptance Criteria

Viewer Layout dinyatakan memenuhi spesifikasi apabila:

- Mengikuti Application Layout Architecture.
- Hanya mengganti Main Content Area.
- Memiliki Workspace Header.
- Workspace Header menampilkan Document Number, Description, Revision, Status, dan Current Assignee.
- Workspace Header tidak menampilkan Workflow Action maupun informasi SLA.
- Memiliki Viewer Toolbar.
- Memiliki Document Viewer Area sebagai area terbesar.
- Memiliki Viewer Status Bar.
- Mengikuti Official Workspace Classification Standard.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART F.1 — View Document Workspace
# F.1.3 — Viewer Components
# ==============================================================================

# F.1.3 — Viewer Components

## 5.5.251 Overview

Viewer Components mendefinisikan seluruh komponen yang membentuk View Document Workspace.

Setiap komponen memiliki tanggung jawab yang spesifik sehingga Workspace tetap modular, konsisten, dan mudah dikembangkan.

Viewer Components mengikuti:

- Official Viewer Component Standard
- Official Component Category Standard

---

# 5.5.252 Viewer Component Hierarchy

```text
View Document Workspace

│

├── Workspace Header

├── Viewer Toolbar

├── Viewer Canvas

├── Viewer Status Bar

└── Viewer Overlay
```

Seluruh komponen bekerja secara independen namun saling terintegrasi.

---

# 5.5.253 Official Component Category Standard

Seluruh komponen pada EDMS diklasifikasikan menggunakan kategori berikut.

| Component Category | Purpose | Example |
|--------------------|---------|---------|
| Information Component | Menampilkan informasi kepada pengguna. | Workspace Header, Status Bar |
| Control Component | Menyediakan aksi atau kontrol terhadap Workspace. | Viewer Toolbar |
| Display Component | Menampilkan konten utama Workspace. | Viewer Canvas |
| Feedback Component | Memberikan umpan balik sistem kepada pengguna. | Loading Overlay, Error Overlay |

Standar ini berlaku untuk seluruh Workspace dan Module di EDMS.

---

# 5.5.254 Viewer Component Matrix

| Component | Category | Primary Purpose | User Interaction |
|------------|----------|-----------------|-----------------|
| Workspace Header | Information Component | Menampilkan identitas Engineering Document. | Read Only |
| Viewer Toolbar | Control Component | Mengontrol tampilan Viewer. | Interactive |
| Viewer Canvas | Display Component | Menampilkan Engineering Document. | Interactive |
| Viewer Status Bar | Information Component | Menampilkan status Viewer. | Read Only |
| Viewer Overlay | Feedback Component | Menampilkan Loading dan Error State. | Automatic |

---

# 5.5.255 Component Relationship

Hubungan antar komponen mengikuti urutan berikut.

```text
Workspace Header

        │

        ▼

Viewer Toolbar

        │

        ▼

Viewer Canvas

        │

        ▼

Viewer Status Bar

────────────────────────────

Viewer Overlay

↓

Dapat muncul

di atas seluruh Viewer
```

Hubungan antar komponen:

- Workspace Header menyediakan konteks dokumen.
- Viewer Toolbar mengontrol Viewer Canvas.
- Viewer Canvas menjadi area utama membaca dokumen.
- Viewer Status Bar menampilkan status Viewer Canvas.
- Viewer Overlay dapat muncul di atas seluruh komponen ketika diperlukan.

---

# 5.5.256 Workspace Header

Workspace Header merupakan Information Component.

Workspace Header menampilkan:

- Document Number
- Description
- Revision
- Status
- Current Assignee

Workspace Header tidak memiliki kontrol maupun aksi.

---

# 5.5.257 Viewer Toolbar

Viewer Toolbar merupakan Control Component.

Toolbar hanya menyediakan kontrol Viewer.

Toolbar tidak digunakan untuk:

- Approval
- Edit
- Delete
- Workflow

Toolbar Specification dijelaskan pada:

**PART F.1.4 — Viewer Toolbar**

---

# 5.5.258 Viewer Canvas

Viewer Canvas merupakan Display Component.

Canvas digunakan untuk:

- Menampilkan Engineering Drawing.
- Menampilkan PDF.
- Menampilkan halaman dokumen.

Canvas harus menjadi komponen terbesar pada Workspace.

Canvas tidak boleh digunakan untuk:

- Edit Drawing
- Annotation Editing
- Workflow

---

# 5.5.259 Viewer Status Bar

Viewer Status Bar merupakan Information Component.

Status Bar menampilkan:

- Current Page
- Total Pages
- Zoom Percentage
- Viewer Status

Status Bar tidak menerima interaksi pengguna.

---

# 5.5.260 Viewer Overlay

Viewer Overlay merupakan Feedback Component.

Overlay muncul ketika:

- Loading Document
- Document Error
- Unsupported Format

Overlay bersifat sementara.

Setelah kondisi selesai, Overlay menghilang secara otomatis.

---

# 5.5.261 Official Viewer Component Standard

Seluruh Document Viewer pada EDMS mengikuti struktur berikut.

```text
Workspace Header

↓

Viewer Toolbar

↓

Viewer Canvas

↓

Viewer Status Bar

↓

Viewer Overlay
```

Urutan ini menjadi **Official Viewer Component Standard**.

---

# 5.5.262 Component Principles

Viewer Components mengikuti prinsip berikut.

### Single Responsibility

Setiap komponen hanya memiliki satu tanggung jawab utama.

---

### Component Independence

Setiap komponen dapat dikembangkan tanpa mengubah komponen lain.

---

### Readability First

Viewer Canvas selalu menjadi fokus utama Workspace.

---

### Component Consistency

Seluruh Viewer pada EDMS mengikuti struktur komponen yang sama.

---

### Category Consistency

Seluruh komponen EDMS wajib menggunakan Official Component Category Standard.

---

# 5.5.263 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-VCOMP-001 | Viewer mengikuti Official Viewer Component Standard. |
| BR-VCOMP-002 | Seluruh komponen menggunakan Official Component Category Standard. |
| BR-VCOMP-003 | Viewer Canvas menjadi area terbesar. |
| BR-VCOMP-004 | Workspace Header hanya menampilkan Document Identity. |
| BR-VCOMP-005 | Viewer Toolbar hanya berisi kontrol Viewer. |
| BR-VCOMP-006 | Viewer Status Bar hanya menampilkan status Viewer. |
| BR-VCOMP-007 | Viewer Overlay hanya muncul pada kondisi tertentu. |
| BR-VCOMP-008 | Overlay tidak mengubah komponen lain. |

---

# 5.5.264 Cross Reference

Viewer Components mengacu pada:

- PART F.1.1 — Overview
- PART F.1.2 — Viewer Layout
- PART F.1.4 — Viewer Toolbar
- PART F.1.5 — Viewer Behaviour
- BUSINESS-WORKFLOW.md

---

# 5.5.265 Acceptance Criteria

Viewer Components dinyatakan memenuhi spesifikasi apabila:

- Mengikuti Official Viewer Component Standard.
- Mengikuti Official Component Category Standard.
- Seluruh komponen memiliki kategori yang jelas.
- Viewer Canvas menjadi area terbesar.
- Hubungan antar komponen mengikuti Component Relationship.
- Overlay hanya muncul ketika diperlukan.
- Seluruh komponen bersifat modular dan independen.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART F.1 — View Document Workspace
# F.1.4 — Viewer Toolbar
# ==============================================================================

# F.1.4 — Viewer Toolbar

## 5.5.266 Overview

Viewer Toolbar merupakan **Control Component** yang menyediakan seluruh kontrol utama untuk berinteraksi dengan tampilan Engineering Document di dalam View Document Workspace.

Toolbar hanya mengontrol **cara Engineering Document ditampilkan** kepada pengguna.

Toolbar tidak mengubah Engineering Document, tidak menjalankan BUSINESS-WORKFLOW, dan tidak memodifikasi Document Lifecycle.

Seluruh kontrol pada Toolbar mengikuti **Official Viewer Toolbar Standard**.

---

## 5.5.267 Toolbar Layout

```text
+------------------------------------------------------------------------------------------------------+

 [ ← Back ]

--------------------------------------------------------------------------------------------------------

 [ − ] [100%] [ + ]   |   [ Fit Width ] [ Fit Page ]   |   [ Previous ] [ 1 / 8 ] [ Next ]   |   [ Full Screen ]

+------------------------------------------------------------------------------------------------------+
```

Toolbar selalu berada:

- Di bawah **Workspace Header**
- Di atas **Document Viewer Area**

Toolbar menggunakan satu baris horizontal.

---

## 5.5.268 Toolbar Components

| Component | Category | Purpose |
|-----------|----------|---------|
| Back Button | Control Component | Menutup View Document Workspace dan kembali ke Document Register. |
| Zoom Out | Control Component | Memperkecil tampilan Engineering Document. |
| Zoom Indicator | Information Component | Menampilkan persentase Zoom saat ini. |
| Zoom In | Control Component | Memperbesar tampilan Engineering Document. |
| Fit Width | Control Component | Menyesuaikan dokumen terhadap lebar Viewer Area. |
| Fit Page | Control Component | Menampilkan satu halaman penuh pada Viewer Area. |
| Previous Page | Control Component | Berpindah ke halaman sebelumnya. |
| Page Indicator | Information Component | Menampilkan halaman aktif dan total halaman. |
| Next Page | Control Component | Berpindah ke halaman berikutnya. |
| Full Screen | Control Component | Mengaktifkan atau menonaktifkan mode Full Screen. |

---

## 5.5.269 Toolbar Behaviour

Viewer Toolbar hanya berinteraksi dengan **Viewer Canvas**.

Toolbar tidak pernah:

- Mengubah Metadata.
- Mengubah Revision.
- Mengubah Status.
- Mengubah Current Assignee.
- Mengubah SLA Timer.
- Mengubah BUSINESS-WORKFLOW.
- Mengubah Document Lifecycle.

Seluruh aksi Toolbar bersifat **lokal** terhadap tampilan Viewer.

---

## 5.5.270 Toolbar Interaction Matrix

| User Action | System Behaviour |
|-------------|------------------|
| Back | Menutup View Document Workspace dan kembali ke Document Register. |
| Zoom In | Memperbesar tampilan Engineering Document. |
| Zoom Out | Memperkecil tampilan Engineering Document. |
| Fit Width | Menyesuaikan dokumen dengan lebar Viewer Area. |
| Fit Page | Menampilkan satu halaman penuh. |
| Previous Page | Berpindah ke halaman sebelumnya. |
| Next Page | Berpindah ke halaman berikutnya. |
| Full Screen | Mengaktifkan atau menonaktifkan mode Full Screen. |

---

## 5.5.271 Official Viewer Toolbar Standard

Viewer Toolbar wajib memenuhi ketentuan berikut:

### Viewer Control Only

Toolbar hanya berisi kontrol yang berkaitan dengan tampilan dokumen.

---

### No Business Action

Toolbar tidak boleh memuat:

- Download
- Edit
- Delete
- Comment
- Workflow Action (A/B/C)
- History

Seluruh aksi tersebut merupakan **Document Actions** dan hanya tersedia pada Document Register.

---

### No Data Modification

Toolbar tidak boleh mengubah:

- Metadata
- Revision
- Status
- Current Assignee
- SLA Timer
- BUSINESS-WORKFLOW

---

### Workspace Consistency

Seluruh View Document Workspace pada EDMS menggunakan struktur Toolbar yang sama.

---

## 5.5.272 Toolbar Principles

Viewer Toolbar mengikuti prinsip berikut.

### Separation of Responsibility

Toolbar bertanggung jawab mengontrol **Viewer**, bukan **Engineering Document**.

---

### Local Interaction

Seluruh aksi Toolbar hanya mempengaruhi tampilan lokal pada Viewer.

---

### Readability First

Toolbar membantu pengguna membaca dokumen dengan lebih nyaman tanpa mengganggu area baca.

---

### Consistent Navigation

Seluruh kontrol Viewer memiliki perilaku yang konsisten pada seluruh Engineering Document.

---

## 5.5.273 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-VTB-001 | Toolbar hanya mengontrol Viewer Canvas. |
| BR-VTB-002 | Toolbar tidak mengubah Engineering Document. |
| BR-VTB-003 | Toolbar tidak menjalankan BUSINESS-WORKFLOW. |
| BR-VTB-004 | Toolbar tidak mengubah Document Lifecycle. |
| BR-VTB-005 | Seluruh kontrol Toolbar bersifat lokal pada Viewer. |
| BR-VTB-006 | Toolbar mengikuti Official Viewer Toolbar Standard. |
| BR-VTB-007 | Download tidak boleh ditampilkan pada Viewer Toolbar. |
| BR-VTB-008 | Business Action hanya tersedia pada Document Register Actions. |

---

## 5.5.274 Cross Reference

Viewer Toolbar mengacu pada:

- PART F.1.2 — Viewer Layout
- PART F.1.3 — Viewer Components
- PART F.1.5 — Viewer Behaviour
- PART F.2 — Download Document
- Official Component Category Standard

---

## 5.5.275 Acceptance Criteria

Viewer Toolbar dinyatakan memenuhi spesifikasi apabila:

- Berada di bawah Workspace Header.
- Mengontrol Viewer Canvas.
- Menyediakan Zoom, Navigation, Fit Width, Fit Page, Full Screen, dan Back.
- Tidak menampilkan Download.
- Tidak menampilkan Edit, Delete, Comment, Workflow Action (A/B/C), maupun History.
- Seluruh Business Action hanya tersedia melalui Document Register Actions.
- Mengikuti Official Viewer Toolbar Standard.
- Mengikuti prinsip Separation of Responsibility.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART F.1 — View Document Workspace
# F.1.5 — Viewer Behaviour
# ==============================================================================

# F.1.5 — Viewer Behaviour

## 5.5.276 Overview

Viewer Behaviour mendefinisikan bagaimana View Document Workspace merespons interaksi pengguna selama proses membaca Engineering Document.

Behaviour ini mengatur hubungan antara:

- Viewer Toolbar
- Viewer Canvas
- Viewer Status Bar
- Viewer Overlay

Seluruh Behaviour mengikuti:

- Official Viewer Component Standard
- Official Workspace Classification Standard
- Official Action Placement Principle

---

# 5.5.277 Viewer Behaviour Lifecycle

Seluruh View Document Workspace mengikuti lifecycle berikut.

```text
Open Viewer

      │

      ▼

Load Active Engineering Document

      │

      ▼

Render Viewer Canvas

      │

      ▼

Ready For Interaction

      │

      ▼

User Interaction

      │

      ▼

Update Viewer State

      │

      ▼

Close Viewer
```

Lifecycle ini hanya mempengaruhi **Workspace**.

Tidak mempengaruhi Engineering Document.

---

# 5.5.278 Viewer State Matrix

| Viewer State | Description |
|--------------|-------------|
| Loading | Viewer mengambil Active Engineering Document. |
| Rendering | Viewer sedang merender dokumen. |
| Ready | Viewer siap menerima interaksi pengguna. |
| Viewing | Pengguna sedang membaca dokumen. |
| Error | Viewer gagal membuka dokumen. |
| Closing | Workspace sedang ditutup. |

Viewer State hanya berlaku pada View Document Workspace.

---

# 5.5.279 Interaction Behaviour Matrix

| User Interaction | Viewer Behaviour |
|------------------|------------------|
| Open Viewer | Membuka View Document Workspace dan memuat Active Engineering Document. |
| Zoom In | Memperbesar tampilan Viewer Canvas tanpa mengubah dokumen. |
| Zoom Out | Memperkecil tampilan Viewer Canvas tanpa mengubah dokumen. |
| Fit Width | Menyesuaikan tampilan dengan lebar Viewer Area. |
| Fit Page | Menampilkan satu halaman penuh. |
| Previous Page | Menampilkan halaman sebelumnya. |
| Next Page | Menampilkan halaman berikutnya. |
| Full Screen | Mengubah tampilan Viewer ke mode Full Screen. |
| Close Viewer | Menutup Workspace dan kembali ke Document Register. |

---

# 5.5.280 Viewer Canvas Behaviour

Viewer Canvas merupakan pusat seluruh interaksi Viewer.

Canvas harus:

- Menampilkan Active Engineering Document.
- Merespons seluruh kontrol Toolbar.
- Mempertahankan kualitas tampilan saat Zoom.
- Mempertahankan posisi halaman selama pengguna melakukan Zoom.
- Memperbarui tampilan secara langsung setelah setiap aksi Toolbar.

Viewer Canvas tidak boleh:

- Mengubah Metadata.
- Mengubah Engineering Document.
- Mengubah Document Lifecycle.

---

# 5.5.281 Viewer Status Behaviour

Viewer Status Bar diperbarui secara otomatis ketika:

- Halaman berubah.
- Zoom berubah.
- Dokumen selesai dimuat.
- Viewer mengalami Error.

Status Bar hanya menampilkan informasi.

Status Bar tidak menerima input pengguna.

---

# 5.5.282 Viewer Overlay Behaviour

Viewer Overlay hanya muncul pada kondisi berikut.

### Loading

```text
Loading Engineering Document...
```

### Rendering

```text
Rendering Document...
```

### Error

```text
Unable to display Engineering Document.
```

Overlay akan menghilang secara otomatis ketika Viewer kembali ke keadaan **Ready**.

---

# 5.5.283 Official Viewer Behaviour Principles

View Document Workspace mengikuti prinsip berikut.

### Read Only Behaviour

Seluruh interaksi hanya mempengaruhi tampilan Viewer.

---

### Active Document Behaviour

Viewer selalu menggunakan Active Engineering Document.

Candidate Replacement File tidak pernah ditampilkan.

---

### Local Interaction Behaviour

Zoom, Navigation, dan Full Screen hanya mempengaruhi sesi Viewer saat ini.

Perubahan tersebut tidak disimpan sebagai preferensi sistem.

---

### Stateless Viewing

Ketika Workspace ditutup:

- Zoom kembali ke nilai default saat Viewer dibuka kembali.
- Halaman aktif kembali mengikuti perilaku default sistem.
- Tidak ada state Viewer yang dipertahankan, kecuali di masa depan terdapat fitur khusus yang mendefinisikannya.

---

# 5.5.284 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-VBH-001 | Viewer hanya menampilkan Active Engineering Document. |
| BR-VBH-002 | Viewer selalu berjalan dalam mode Read Only. |
| BR-VBH-003 | Viewer Behaviour tidak mengubah Engineering Document. |
| BR-VBH-004 | Viewer Behaviour tidak mengubah Document Lifecycle. |
| BR-VBH-005 | Zoom dan Navigation hanya mempengaruhi Viewer Canvas. |
| BR-VBH-006 | Candidate Replacement File tidak boleh ditampilkan. |
| BR-VBH-007 | Viewer State hanya berlaku selama Workspace aktif. |
| BR-VBH-008 | Viewer kembali ke keadaan awal ketika Workspace dibuka kembali. |

---

# 5.5.285 Error Behaviour

Apabila terjadi kegagalan:

- Viewer Canvas tidak ditampilkan.
- Viewer Overlay menampilkan Error State.
- Workspace tetap dapat ditutup menggunakan tombol Back.
- Engineering Document tidak mengalami perubahan.
- BUSINESS-WORKFLOW tidak dijalankan.

---

# 5.5.286 Cross Reference

Viewer Behaviour mengacu pada:

- PART F.1.2 — Viewer Layout
- PART F.1.3 — Viewer Components
- PART F.1.4 — Viewer Toolbar
- PART F.1.6 — Viewer Capability Standard
- Official Action Placement Principle
- Official Component Category Standard
- BUSINESS-WORKFLOW.md

---

# 5.5.287 Acceptance Criteria

Viewer Behaviour dinyatakan memenuhi spesifikasi apabila:

- Mengikuti Viewer Behaviour Lifecycle.
- Menggunakan Active Engineering Document.
- Seluruh interaksi hanya mempengaruhi Viewer Workspace.
- Candidate Replacement File tidak pernah ditampilkan.
- Viewer State berubah sesuai interaksi pengguna.
- Viewer kembali ke keadaan awal setelah Workspace ditutup.
- Tidak mengubah Metadata maupun Document Lifecycle.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART F.1 — View Document Workspace
# F.1.6 — Viewer Capability Standard
# ==============================================================================

# F.1.6 — Viewer Capability Standard

## 5.5.288 Overview

Viewer Capability Standard mendefinisikan kemampuan minimum yang wajib dimiliki oleh seluruh Document Viewer pada aplikasi EDMS.

Standar ini bersifat **technology independent**.

Dokumen ini tidak menentukan library atau framework Viewer yang harus digunakan.

Implementasi dapat menggunakan teknologi apa pun selama seluruh capability yang didefinisikan pada dokumen ini dapat dipenuhi.

Standar ini menjadi **Single Source of Truth** untuk kemampuan Viewer pada seluruh aplikasi EDMS.

---

# 5.5.289 Capability Classification

Capability Viewer dikelompokkan menjadi empat kategori.

| Capability Category | Purpose |
|---------------------|---------|
| Viewing Capability | Menampilkan Engineering Document. |
| Navigation Capability | Berpindah antar halaman dokumen. |
| Display Capability | Mengatur tampilan dokumen. |
| System Capability | Memberikan umpan balik terhadap kondisi sistem. |

Kategori ini berlaku untuk seluruh Document Viewer.

---

# 5.5.290 Capability Matrix

| Capability | Required | Description |
|------------|:--------:|-------------|
| Display Active Engineering Document | ✓ | Menampilkan dokumen aktif. |
| Zoom In | ✓ | Memperbesar tampilan dokumen. |
| Zoom Out | ✓ | Memperkecil tampilan dokumen. |
| Zoom Indicator | ✓ | Menampilkan persentase Zoom. |
| Fit Width | ✓ | Menyesuaikan tampilan terhadap lebar Viewer. |
| Fit Page | ✓ | Menampilkan satu halaman penuh. |
| Previous Page | ✓ | Berpindah ke halaman sebelumnya. |
| Next Page | ✓ | Berpindah ke halaman berikutnya. |
| Current Page Indicator | ✓ | Menampilkan halaman aktif. |
| Total Page Indicator | ✓ | Menampilkan jumlah halaman. |
| Full Screen | ✓ | Menampilkan Viewer dalam mode layar penuh. |
| Loading Indicator | ✓ | Menampilkan proses pemuatan dokumen. |
| Error Display | ✓ | Menampilkan pesan apabila Viewer gagal memuat dokumen. |

---

# 5.5.291 Capability Behaviour

Seluruh capability Viewer mengikuti prinsip berikut.

### Read Only Capability

Viewer hanya digunakan untuk membaca Engineering Document.

Capability berikut **tidak diperbolehkan**:

- Edit Document
- Annotation Editing
- Digital Signature
- Workflow Approval
- Metadata Editing

---

### Active Document Capability

Viewer selalu menampilkan **Active Engineering Document**.

Capability tidak boleh menggunakan:

- Candidate Replacement File
- Draft File
- Temporary File

---

### Local Workspace Capability

Seluruh capability hanya berlaku selama Workspace aktif.

Capability tidak mengubah:

- Metadata
- Revision
- Status
- Current Assignee
- SLA Timer
- BUSINESS-WORKFLOW

---

# 5.5.292 Capability Classification Matrix

| Capability | Category |
|------------|----------|
| Display Active Engineering Document | Viewing Capability |
| Zoom In / Zoom Out | Display Capability |
| Zoom Indicator | Display Capability |
| Fit Width | Display Capability |
| Fit Page | Display Capability |
| Previous / Next Page | Navigation Capability |
| Current Page Indicator | Navigation Capability |
| Total Page Indicator | Navigation Capability |
| Full Screen | Display Capability |
| Loading Indicator | System Capability |
| Error Display | System Capability |

---

# 5.5.293 Official Viewer Capability Standard

Seluruh Document Viewer pada EDMS wajib memenuhi capability berikut.

## Viewing

- Display Active Engineering Document

---

## Navigation

- Previous Page
- Next Page
- Current Page Indicator
- Total Page Indicator

---

## Display

- Zoom In
- Zoom Out
- Zoom Indicator
- Fit Width
- Fit Page
- Full Screen

---

## System

- Loading Indicator
- Error Display

Capability di luar daftar tersebut bersifat opsional dan dapat ditambahkan pada fase pengembangan berikutnya.

---

# 5.5.294 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-VCAP-001 | Viewer wajib memenuhi Official Viewer Capability Standard. |
| BR-VCAP-002 | Viewer hanya digunakan untuk membaca Engineering Document. |
| BR-VCAP-003 | Viewer selalu menggunakan Active Engineering Document. |
| BR-VCAP-004 | Capability Viewer tidak mengubah Engineering Document. |
| BR-VCAP-005 | Capability Viewer tidak mengubah Document Lifecycle. |
| BR-VCAP-006 | Capability Viewer mengikuti Official Workspace State Management Principle. |

---

# 5.5.295 Cross Reference

Viewer Capability Standard mengacu pada:

- PART F.1.3 — Viewer Components
- PART F.1.4 — Viewer Toolbar
- PART F.1.5 — Viewer Behaviour
- Official Component Category Standard
- Official Workspace State Management Principle
- Official Action Placement Principle

---

# 5.5.296 Acceptance Criteria

Viewer Capability Standard dinyatakan memenuhi spesifikasi apabila:

- Seluruh capability wajib tersedia.
- Viewer hanya digunakan untuk membaca Engineering Document.
- Viewer selalu menggunakan Active Engineering Document.
- Capability tidak mengubah Metadata maupun Document Lifecycle.
- Viewer mengikuti Official Workspace State Management Principle.
- Implementasi tetap memenuhi capability tanpa bergantung pada teknologi tertentu.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART F.1 — View Document Workspace
# F.1.7 — Permission
# ==============================================================================

# F.1.7 — Permission

## 5.5.297 Overview

Permission mendefinisikan hak akses pengguna terhadap View Document Workspace.

View Document Workspace merupakan **Information Workspace** sehingga hak akses difokuskan pada kemampuan untuk membaca Engineering Document tanpa melakukan perubahan terhadap data maupun Document Lifecycle.

Seluruh aturan hak akses mengikuti:

- Official Role Definition
- Official Workspace Classification Standard
- BUSINESS-WORKFLOW.md
- STEP 8 — Permission Matrix

Hak akses View Document Workspace tidak ditentukan berdasarkan nama role, tetapi berdasarkan **hak akses pengguna terhadap Engineering Document** sebagaimana didefinisikan pada Official Role Definition dan STEP 8 — Permission Matrix.

---

## 5.5.298 Permission Matrix

| Official Role | Open Viewer | View Engineering Document | Viewer Controls | Modify Engineering Document |
|---------------|:-----------:|:-------------------------:|:---------------:|:---------------------------:|
| Admin | ✓ | ✓ | ✓ | ✗ |
| Document Owner | ✓ | ✓ | ✓ | ✗ |
| Team Process | ✓ | ✓ | ✓ | ✗ |
| Team Project | ✓ | ✓ | ✓ | ✗ |

Keterangan:

- **Open Viewer** : Membuka View Document Workspace.
- **View Engineering Document** : Menampilkan Active Engineering Document.
- **Viewer Controls** : Menggunakan Zoom, Navigation, Fit View, dan Full Screen.
- **Modify Engineering Document** : Tidak diizinkan melalui View Document Workspace.

Matriks di atas merupakan implementasi Official Role saat ini.

Perubahan terhadap Official Role di masa depan mengikuti STEP 8 — Permission Matrix tanpa memerlukan perubahan pada spesifikasi View Document Workspace.

---

## 5.5.299 Permission Principles

View Document Workspace mengikuti prinsip berikut.

### Engineering Document Access Principle

Seluruh pengguna yang memiliki **hak akses terhadap Engineering Document** dapat membuka View Document Workspace.

Hak akses tersebut ditentukan oleh:

- Official Role Definition
- STEP 8 — Permission Matrix

Workspace tidak bergantung pada nama role tertentu sehingga tetap dapat digunakan apabila di masa depan terdapat penambahan Official Role baru.

---

### Read Only Workspace

View Document Workspace hanya memberikan hak untuk membaca Engineering Document.

Workspace tidak memberikan hak untuk:

- Mengubah Metadata
- Upload File Revisi
- Mengubah Revision
- Mengubah Status
- Mengubah Current Assignee
- Mengubah SLA Timer
- Menjalankan BUSINESS-WORKFLOW

---

### Workspace Independence Principle

Hak akses terhadap View Document Workspace tidak secara otomatis memberikan hak akses terhadap:

- Edit Document
- Download Document
- Archive Document
- Restore Document
- Comment Workspace
- Workflow Actions (A / B / C)
- History Workspace

Masing-masing Document Action memiliki aturan Permission tersendiri.

---

## 5.5.300 Access Flow

```text
User

      │

      ▼

Click View

      │

      ▼

Check Engineering Document Access

      │

 ┌────┴────────┐

 │             │

 ▼             ▼

Granted      Denied

 │             │

 ▼             ▼

Open        Display
Viewer      Access Denied Message
```

Permission selalu diperiksa sebelum View Document Workspace dibuka.

---

## 5.5.301 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-VPERM-001 | Pengguna yang memiliki hak akses terhadap Engineering Document dapat membuka View Document Workspace. |
| BR-VPERM-002 | View Document Workspace selalu berjalan dalam mode Read Only. |
| BR-VPERM-003 | Viewer Controls tersedia bagi seluruh pengguna yang memiliki akses ke Workspace. |
| BR-VPERM-004 | View Document Workspace tidak memberikan hak untuk mengubah Engineering Document. |
| BR-VPERM-005 | Hak akses terhadap Document Actions mengikuti aturan masing-masing dan tidak diwarisi dari View Document Workspace. |
| BR-VPERM-006 | Penambahan Official Role baru tidak memerlukan perubahan pada spesifikasi View Document Workspace selama mengikuti Official Role Definition dan STEP 8 — Permission Matrix. |

---

## 5.5.302 Permission Dependency

View Document Workspace bergantung pada:

- Official Role Definition
- Engineering Document Access Permission
- Engineering Document Availability

Workspace tidak bergantung pada:

- Status Engineering Document
- Revision Engineering Document
- Tahapan BUSINESS-WORKFLOW

Selama pengguna memiliki hak akses terhadap Engineering Document, Workspace dapat dibuka.

---

## 5.5.303 Cross Reference

Permission mengacu pada:

- PART F.1.1 — Overview
- PART F.1.5 — Viewer Behaviour
- STEP 8 — Permission Matrix
- Official Role Definition
- Official Workspace Classification Standard
- BUSINESS-WORKFLOW.md

---

## 5.5.304 Acceptance Criteria

View Document Workspace dinyatakan memenuhi spesifikasi apabila:

- Pengguna yang memiliki hak akses terhadap Engineering Document dapat membuka Viewer.
- Viewer selalu berjalan dalam mode Read Only.
- Seluruh Viewer Controls dapat digunakan tanpa mengubah Engineering Document.
- Hak akses terhadap View Document Workspace tidak memberikan hak terhadap Document Actions lainnya.
- Penambahan Official Role baru tidak memerlukan perubahan spesifikasi Workspace selama mengikuti Official Role Definition dan STEP 8 — Permission Matrix.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART F.1 — View Document Workspace
# F.1.8 — Error Handling
# ==============================================================================

# F.1.8 — Error Handling

## 5.5.305 Overview

Error Handling mendefinisikan bagaimana View Document Workspace merespons kondisi kegagalan selama proses membuka dan menampilkan Engineering Document.

Tujuan utama Error Handling adalah:

- Memberikan informasi yang jelas kepada pengguna.
- Memberikan langkah pemulihan (Recovery Action).
- Memastikan Workspace tetap stabil.
- Mencegah perubahan terhadap Engineering Document.
- Menjaga konsistensi User Experience.

Seluruh Error Handling mengikuti:

- Official Workspace State Management Principle
- Official Component Category Standard
- Official Permission Abstraction Principle
- Official Error Recovery Standard

---

# 5.5.306 Error Handling Lifecycle

Seluruh Workspace mengikuti lifecycle berikut.

```text
Request Viewer

        │

        ▼

Processing

        │

 ┌──────┴────────────┐

 │                   │

 ▼                   ▼

Success            Error

 │                   │

 ▼                   ▼

Viewer Ready     Error Overlay

                      │

                      ▼

              Recovery Action

                      │

         ┌────────────┴────────────┐

         │                         │

         ▼                         ▼

Retry                 Close / Back

```

Workspace harus selalu memiliki jalur pemulihan (*Recovery Path*).

Workspace tidak boleh berada pada kondisi **unrecoverable state**.

---

# 5.5.307 Error Classification

| Error Category | Description | User Impact |
|----------------|-------------|-------------|
| Permission Error | Pengguna tidak memiliki hak akses terhadap Engineering Document. | Viewer tidak dibuka. |
| Document Not Found | Engineering Document tidak ditemukan. | Viewer tidak dibuka. |
| File Not Available | File Engineering Document tidak tersedia. | Viewer tidak dapat menampilkan dokumen. |
| Unsupported Format | Format dokumen tidak didukung Viewer. | Dokumen tidak dapat ditampilkan. |
| Rendering Error | Viewer gagal merender dokumen. | Viewer masuk ke Error State. |
| Unexpected Error | Kesalahan sistem yang tidak terduga. | Viewer masuk ke Error State. |

---

# 5.5.308 System Behaviour

### Permission Error

System Behaviour:

- Workspace tidak dibuka.
- Menampilkan Access Denied Message.
- Engineering Document tidak berubah.

Recovery Action:

- Back to Document Register.

---

### Document Not Found

System Behaviour:

- Viewer tidak dimuat.
- Menampilkan informasi bahwa dokumen tidak ditemukan.

Recovery Action:

- Close Viewer.

---

### File Not Available

System Behaviour:

- Workspace tetap terbuka.
- Viewer Canvas tidak ditampilkan.
- Viewer Overlay menampilkan File Not Available.

Recovery Action:

- Retry.
- Close Viewer.

---

### Unsupported Format

System Behaviour:

- Viewer Canvas tidak dirender.
- Viewer Overlay menampilkan Unsupported Format.

Recovery Action:

- Close Viewer.

---

### Rendering Error

System Behaviour:

- Viewer Overlay ditampilkan.
- Viewer Toolbar tetap aktif.

Recovery Action:

- Retry.
- Close Viewer.

---

### Unexpected Error

System Behaviour:

- Viewer masuk ke Error State.
- Engineering Document tidak berubah.
- BUSINESS-WORKFLOW tidak dijalankan.

Recovery Action:

- Retry.
- Close Viewer.

---

# 5.5.309 Official Error Recovery Standard

Seluruh Workspace dan Modal pada EDMS mengikuti prinsip berikut.

### User Message

Setiap Error harus menjelaskan kondisi yang terjadi menggunakan bahasa yang mudah dipahami.

---

### Recovery Action

Setiap Error wajib menyediakan minimal satu tindakan pemulihan.

Recovery Action dapat berupa:

- Retry
- Back
- Close Workspace
- Cancel
- Return to Previous Page

Recovery Action dipilih sesuai konteks Workspace.

---

### Safe System State

Selama Error terjadi, sistem harus menjamin bahwa:

- Metadata tidak berubah.
- Engineering Document tidak berubah.
- Revision tidak berubah.
- Status tidak berubah.
- Current Assignee tidak berubah.
- SLA Timer tidak berubah.
- BUSINESS-WORKFLOW tidak dijalankan.

---

### Consistent Error Experience

Seluruh Workspace dan Modal menggunakan pola Error yang sama.

Standar ini menjadi **Official Error Recovery Standard**.

---

# 5.5.310 Error Message & Recovery Matrix

| Error Type | User Message | Recovery Action |
|-------------|--------------|-----------------|
| Permission Error | You do not have permission to view this document. | Back to Document Register |
| Document Not Found | The requested document could not be found. | Close Viewer |
| File Not Available | The document file is currently unavailable. | Retry / Close Viewer |
| Unsupported Format | This document format is not supported by the Viewer. | Close Viewer |
| Rendering Error | Unable to display the document. Please try again. | Retry |
| Unexpected Error | An unexpected error occurred. Please try again later. | Retry / Close Viewer |

Pesan dapat diterjemahkan sesuai bahasa aplikasi.

Yang distandarkan adalah struktur:

- User Message
- Recovery Action

Bukan bahasa yang digunakan.

---

# 5.5.311 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-VERR-001 | Error tidak mengubah Engineering Document. |
| BR-VERR-002 | Error tidak mengubah Document Lifecycle. |
| BR-VERR-003 | Error tidak menjalankan BUSINESS-WORKFLOW. |
| BR-VERR-004 | Pengguna selalu memiliki Recovery Action. |
| BR-VERR-005 | Error Message harus mudah dipahami pengguna. |
| BR-VERR-006 | Seluruh Workspace mengikuti Official Error Recovery Standard. |
| BR-VERR-007 | Recovery Action tidak boleh mengubah Metadata maupun Document Lifecycle. |

---

# 5.5.312 Cross Reference

Error Handling mengacu pada:

- PART F.1.2 — Viewer Layout
- PART F.1.3 — Viewer Components
- PART F.1.5 — Viewer Behaviour
- Official Workspace State Management Principle
- Official Permission Abstraction Principle
- Official Error Recovery Standard
- BUSINESS-WORKFLOW.md

---

# 5.5.313 Acceptance Criteria

Error Handling dinyatakan memenuhi spesifikasi apabila:

- Seluruh Error mengikuti Official Error Recovery Standard.
- Setiap Error memiliki User Message yang informatif.
- Setiap Error memiliki minimal satu Recovery Action.
- Error tidak mengubah Engineering Document.
- Error tidak mengubah Document Lifecycle.
- Error tidak menjalankan BUSINESS-WORKFLOW.
- Pengguna selalu dapat keluar atau memulihkan Workspace.
- Pengalaman Error konsisten pada seluruh Workspace dan Modal EDMS.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART F.1 — View Document Workspace
# F.1.9 — Acceptance Criteria
# ==============================================================================

# F.1.9 — Acceptance Criteria

## 5.5.314 Overview

Acceptance Criteria mendefinisikan kondisi yang harus dipenuhi agar implementasi **View Document Workspace** dinyatakan sesuai dengan spesifikasi PRD.

Seluruh Acceptance Criteria mengacu pada:

- Official Workspace Classification Standard
- Official Viewer Component Standard
- Official Viewer Capability Standard
- Official Workspace State Management Principle
- Official Action Placement Principle
- Official Permission Abstraction Principle
- Official Error Recovery Standard

View Document Workspace dinyatakan **Complete** apabila seluruh kriteria berikut telah terpenuhi.

---

# 5.5.315 Functional Acceptance

| No | Requirement | Status |
|----|-------------|:------:|
| F-01 | View Button membuka View Document Workspace. | □ |
| F-02 | Workspace hanya menampilkan Active Engineering Document. | □ |
| F-03 | Workspace berjalan dalam mode Read Only. | □ |
| F-04 | Workspace tidak mengubah Metadata Engineering Document. | □ |
| F-05 | Workspace tidak mengubah Document Lifecycle. | □ |
| F-06 | Workspace tidak menjalankan BUSINESS-WORKFLOW. | □ |

---

# 5.5.316 Layout Acceptance

| No | Requirement | Status |
|----|-------------|:------:|
| L-01 | Workspace mengikuti PART 2 — Application Layout Architecture. | □ |
| L-02 | Workspace hanya mengganti Main Content Area. | □ |
| L-03 | Workspace Header ditampilkan dengan benar. | □ |
| L-04 | Viewer Toolbar ditampilkan dengan benar. | □ |
| L-05 | Viewer Canvas menjadi area terbesar. | □ |
| L-06 | Viewer Status Bar ditampilkan dengan benar. | □ |

---

# 5.5.317 Component Acceptance

| No | Requirement | Status |
|----|-------------|:------:|
| C-01 | Seluruh Viewer Components mengikuti Official Viewer Component Standard. | □ |
| C-02 | Seluruh komponen menggunakan Official Component Category Standard. | □ |
| C-03 | Workspace Header hanya menampilkan Document Identity. | □ |
| C-04 | Viewer Toolbar hanya berisi Viewer Controls. | □ |
| C-05 | Viewer Overlay hanya muncul pada kondisi Loading atau Error. | □ |

---

# 5.5.318 Toolbar Acceptance

| No | Requirement | Status |
|----|-------------|:------:|
| T-01 | Toolbar menyediakan Zoom In dan Zoom Out. | □ |
| T-02 | Toolbar menyediakan Fit Width dan Fit Page. | □ |
| T-03 | Toolbar menyediakan Previous Page dan Next Page. | □ |
| T-04 | Toolbar menyediakan Full Screen. | □ |
| T-05 | Toolbar menyediakan Back Button. | □ |
| T-06 | Toolbar tidak menampilkan Download. | □ |
| T-07 | Toolbar tidak menampilkan Business Actions. | □ |

---

# 5.5.319 Behaviour Acceptance

| No | Requirement | Status |
|----|-------------|:------:|
| B-01 | Viewer menggunakan Active Engineering Document. | □ |
| B-02 | Zoom hanya mempengaruhi Viewer Canvas. | □ |
| B-03 | Navigation hanya mempengaruhi Viewer Canvas. | □ |
| B-04 | Full Screen hanya mempengaruhi Workspace. | □ |
| B-05 | Candidate Replacement File tidak pernah ditampilkan. | □ |
| B-06 | Viewer kembali ke state awal setelah Workspace ditutup. | □ |

---

# 5.5.320 Permission Acceptance

| No | Requirement | Status |
|----|-------------|:------:|
| P-01 | Permission mengikuti Official Permission Abstraction Principle. | □ |
| P-02 | Pengguna yang memiliki hak akses terhadap Engineering Document dapat membuka Viewer. | □ |
| P-03 | Viewer selalu berjalan dalam mode Read Only. | □ |
| P-04 | Workspace tidak memberikan hak terhadap Document Actions lainnya. | □ |

---

# 5.5.321 Error Handling Acceptance

| No | Requirement | Status |
|----|-------------|:------:|
| E-01 | Seluruh Error mengikuti Official Error Recovery Standard. | □ |
| E-02 | Seluruh Error memiliki User Message yang jelas. | □ |
| E-03 | Seluruh Error memiliki Recovery Action. | □ |
| E-04 | Error tidak mengubah Engineering Document. | □ |
| E-05 | Error tidak mengubah Document Lifecycle. | □ |
| E-06 | Pengguna selalu dapat keluar dari Workspace. | □ |

---

# 5.5.322 Integration Acceptance

| No | Requirement | Status |
|----|-------------|:------:|
| I-01 | Workspace dapat dibuka dari Document Register Actions. | □ |
| I-02 | Workspace kembali ke Document Register saat ditutup. | □ |
| I-03 | Workspace mengikuti Application Layout Architecture. | □ |
| I-04 | Workspace mengikuti BUSINESS-WORKFLOW.md. | □ |
| I-05 | Workspace mengikuti Official Workspace State Management Principle. | □ |

---

# 5.5.323 Quality Checklist

Implementasi dianggap memenuhi standar apabila:

### Functional Quality

- Seluruh fungsi Viewer berjalan sesuai spesifikasi.

---

### UI Quality

- Layout sesuai Application Layout Architecture.
- Workspace konsisten dengan standar UI EDMS.

---

### UX Quality

- Workspace mudah digunakan.
- Viewer responsif.
- Navigasi jelas.
- Error mudah dipahami.
- Recovery Action tersedia.

---

### Architecture Quality

Implementasi mengikuti seluruh Official Standard berikut:

- Official Workspace Classification Standard
- Official Viewer Component Standard
- Official Viewer Capability Standard
- Official Component Category Standard
- Official Workspace State Management Principle
- Official Action Placement Principle
- Official Permission Abstraction Principle
- Official Error Recovery Standard

---

# 5.5.324 Completion Criteria

View Document Workspace dinyatakan **Complete** apabila:

- Seluruh Functional Acceptance terpenuhi.
- Seluruh Layout Acceptance terpenuhi.
- Seluruh Component Acceptance terpenuhi.
- Seluruh Toolbar Acceptance terpenuhi.
- Seluruh Behaviour Acceptance terpenuhi.
- Seluruh Permission Acceptance terpenuhi.
- Seluruh Error Handling Acceptance terpenuhi.
- Seluruh Integration Acceptance terpenuhi.
- Seluruh Quality Checklist terpenuhi.

Apabila salah satu kriteria belum terpenuhi, maka implementasi belum dapat dinyatakan selesai.

---

# 5.5.325 Cross Reference

Acceptance Criteria mengacu pada:

- PART F.1.1 — Overview
- PART F.1.2 — Viewer Layout
- PART F.1.3 — Viewer Components
- PART F.1.4 — Viewer Toolbar
- PART F.1.5 — Viewer Behaviour
- PART F.1.6 — Viewer Capability Standard
- PART F.1.7 — Permission
- PART F.1.8 — Error Handling
- PART 2 — Application Layout Architecture
- BUSINESS-WORKFLOW.md

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART F.2 — Download Document
# ==============================================================================

# PART F.2 — Download Document

## 5.5.326 Overview

Download Document merupakan proses yang digunakan untuk mengambil salinan **Active Engineering Document** dari sistem EDMS.

Download Document tidak membuka Workspace baru.

Sebaliknya, sistem melakukan proses pengambilan file aktif dan mentransfer file tersebut kepada browser untuk diproses sesuai mekanisme download yang didukung.

Download Document termasuk kategori **Document Retrieval Process**.

---

# 5.5.327 Objectives

Download Document memiliki tujuan sebagai berikut.

- Mengambil Active Engineering Document.
- Mentransfer Active Engineering Document kepada browser.
- Menyediakan salinan dokumen resmi kepada pengguna.
- Memastikan file yang ditransfer merupakan Active Engineering Document.
- Memastikan proses download tidak mengubah Engineering Document.

Download Document tidak digunakan untuk:

- Membuka View Document Workspace.
- Mengubah Metadata.
- Mengubah Revision.
- Mengubah Status.
- Mengubah Current Assignee.
- Mengubah SLA Timer.
- Menjalankan BUSINESS-WORKFLOW.

---

# 5.5.328 Download Flow

```text
User

      │

      ▼

Click Download

      │

      ▼

Check Engineering Document Access

      │

 ┌────┴─────────┐

 │              │

 ▼              ▼

Granted      Denied

 │              │

 ▼              ▼

Locate Active Engineering Document

      │

      ▼

Prepare File Transfer

      │

      ▼

Transfer File to Browser

      │

      ▼

Transfer Completed
```

Download Flow berakhir ketika sistem berhasil mentransfer file kepada browser.

Proses penyimpanan file ke perangkat pengguna berada di luar tanggung jawab aplikasi EDMS.

---

# 5.5.329 Download Behaviour

Ketika pengguna memilih **Download**:

Sistem harus:

- Memverifikasi hak akses pengguna.
- Mengambil Active Engineering Document.
- Menyiapkan file untuk ditransfer.
- Mentransfer file kepada browser.

Selama proses tersebut sistem harus mempertahankan:

- Metadata Engineering Document.
- Document Lifecycle.
- BUSINESS-WORKFLOW.

Download Document tidak boleh:

- Mengubah Engineering Document.
- Mengubah Revision.
- Mengubah Status.
- Mengubah Current Assignee.
- Mengubah SLA Timer.
- Menjalankan BUSINESS-WORKFLOW.

---

# 5.5.330 Official Document Retrieval Principle

Download Document mengikuti prinsip berikut.

### Active Document Principle

Hanya **Active Engineering Document** yang boleh digunakan sebagai sumber download.

Candidate Replacement File tidak boleh digunakan.

---

### Transfer Responsibility Principle

Tanggung jawab aplikasi EDMS berakhir setelah file berhasil ditransfer kepada browser.

Proses berikut berada di luar tanggung jawab EDMS:

- Penyimpanan file oleh browser.
- Pemilihan lokasi penyimpanan.
- Penamaan file oleh browser (jika dikonfigurasi pengguna).
- Kegagalan penyimpanan akibat perangkat pengguna.

---

### Read Without Modification

Download hanya menghasilkan salinan dokumen.

Tidak ada perubahan terhadap:

- Engineering Document.
- Metadata.
- Document Lifecycle.

---

### Independent Process

Download merupakan proses independen.

Keberhasilan maupun kegagalan transfer file tidak mempengaruhi:

- Dashboard.
- Document Register.
- View Document Workspace.
- Comment Workspace.
- Workflow.
- Document Lifecycle.

---

# 5.5.331 Download State

| State | Description |
|--------|-------------|
| Idle | Menunggu interaksi pengguna. |
| Permission Check | Memverifikasi hak akses terhadap Engineering Document. |
| Preparing | Sistem menyiapkan Active Engineering Document. |
| Transferring | File sedang ditransfer kepada browser. |
| Transfer Completed | Transfer file kepada browser berhasil diselesaikan. |
| Failed | Transfer file gagal dilakukan. |

State ini hanya berlaku selama proses transfer berlangsung.

---

# 5.5.332 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-DOWN-001 | Download hanya menggunakan Active Engineering Document. |
| BR-DOWN-002 | Candidate Replacement File tidak boleh ditransfer. |
| BR-DOWN-003 | Download tidak mengubah Metadata Engineering Document. |
| BR-DOWN-004 | Download tidak mengubah Document Lifecycle. |
| BR-DOWN-005 | Download tidak menjalankan BUSINESS-WORKFLOW. |
| BR-DOWN-006 | Tanggung jawab EDMS berakhir setelah Transfer Completed. |
| BR-DOWN-007 | Download mengikuti Official Document Retrieval Principle. |

---

# 5.5.333 Cross Reference

Download Document mengacu pada:

- PART C.4 — Actions Column Specification
- PART F.1 — View Document Workspace
- PART E — Edit Document Modal
- Official Permission Abstraction Principle
- BUSINESS-WORKFLOW.md
- STEP 8 — Permission Matrix

---

# 5.5.334 Acceptance Criteria

Download Document dinyatakan memenuhi spesifikasi apabila:

- Hanya menggunakan Active Engineering Document.
- Candidate Replacement File tidak pernah digunakan.
- Hak akses diverifikasi sebelum transfer dimulai.
- File berhasil ditransfer kepada browser.
- Transfer tidak mengubah Metadata Engineering Document.
- Transfer tidak mengubah Document Lifecycle.
- Transfer tidak menjalankan BUSINESS-WORKFLOW.
- Download mengikuti Official Document Retrieval Principle.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART F.3 — Review Comment Workspace
# ==============================================================================

# PART F.3 — Review Comment Workspace

## 5.5.335 Overview

Review Comment Workspace merupakan Workspace yang digunakan untuk memberikan komentar sebagai bagian dari BUSINESS-WORKFLOW.

Workspace ini berbeda dengan **Comment History Viewer** pada Dashboard.

Review Comment Workspace bersifat **Input Workspace**, sedangkan Comment History Viewer bersifat **Read Only Workspace**.

Workspace ini hanya dapat dibuka ketika Engineering Document berada pada tahapan workflow yang memerlukan komentar dari Reviewer.

Review Comment Workspace mengikuti:

- Official Comment Separation Principle
- Official Workspace Classification Standard
- Official Workspace State Management Principle
- Official Permission Abstraction Principle

---

# 5.5.336 Workspace Objectives

Workspace ini bertujuan untuk:

- Memberikan Review Comment.
- Mendukung BUSINESS-WORKFLOW.
- Menjadi media komunikasi resmi selama proses review.
- Menjadi bagian dari Audit Trail Engineering Document.

Workspace ini tidak digunakan untuk:

- Diskusi bebas.
- Chat.
- Messaging.
- Melihat History Comment.

---

# 5.5.337 Workspace Layout

Workspace mengikuti **Application Layout Architecture** pada PART 2.

Workspace hanya mengganti **Main Content Area**.

Global Layout tetap menggunakan:

- Top Navigation
- Sidebar
- User Profile
- Theme
- Responsive Layout

---

## Main Content Blueprint

```text
+--------------------------------------------------------------------------------------+
|                Refer PART 2 — Application Layout Architecture                        |
+--------------------------------------------------------------------------------------+

 Top Navigation (Refer PART 2)

+--------------------------------------------------------------------------------------+

 Sidebar
 (Refer
 PART 2)

│
│
│

│   +-------------------------------------------------------------------------+
│   |                                                                         |
│   |                 Review Comment Workspace                                |
│   |-------------------------------------------------------------------------|
│   | Review Header                                                          |
│   |-------------------------------------------------------------------------|
│   | Document Number                                                        |
│   | Description                                                            |
│   | Revision | Status | Current Assignee                                   |
│   |-------------------------------------------------------------------------|
│   | Review Information                                                     |
│   |-------------------------------------------------------------------------|
│   | Approval Context                                                       |
│   | Current Workflow Stage                                                 |
│   |-------------------------------------------------------------------------|
│   |                                                                         |
│   | Review Comment                                                         |
│   | +-------------------------------------------------------------------+  |
│   | |                                                                   |  |
│   | |                   Multiline Text Area                             |  |
│   | |                                                                   |  |
│   | +-------------------------------------------------------------------+  |
│   |                                                                         |
│   |-------------------------------------------------------------------------|
│   |                         [ Cancel ]   [ Submit ]                         |
│   +-------------------------------------------------------------------------+
```

---

# 5.5.338 Workspace Components

Workspace terdiri dari komponen berikut.

| Component | Category | Purpose |
|------------|----------|---------|
| Review Header | Information Component | Menampilkan identitas Engineering Document. |
| Review Information | Information Component | Menampilkan konteks review yang sedang berlangsung. |
| Review Comment Composer | Input Component | Tempat pengguna menulis komentar review. |
| Action Buttons | Control Component | Submit atau membatalkan Review Comment. |

Workspace mengikuti **Official Component Category Standard**.

---

# 5.5.339 Review Behaviour

Review Comment Workspace mengikuti perilaku berikut.

### Open Workspace

Workspace hanya dapat dibuka apabila:

- Pengguna memiliki hak akses terhadap Engineering Document.
- BUSINESS-WORKFLOW berada pada tahapan yang memerlukan komentar.

---

### Submit

Ketika pengguna memilih **Submit**:

Sistem harus:

- Memvalidasi isi komentar.
- Menyimpan Review Comment.
- Menghubungkan komentar dengan Engineering Document.
- Menghubungkan komentar dengan tahapan BUSINESS-WORKFLOW yang sedang berlangsung.
- Menutup Workspace apabila proses berhasil.

---

### Cancel

Ketika pengguna memilih **Cancel**:

- Workspace ditutup.
- Review Comment yang belum dikirim tidak disimpan.
- Engineering Document tidak berubah.
- BUSINESS-WORKFLOW tidak berubah.

---

# 5.5.340 Validation Rules

Review Comment mengikuti aturan berikut.

| Field | Required | Validation |
|--------|:--------:|------------|
| Review Comment | Conditional | Wajib mengikuti BUSINESS-WORKFLOW. |

Apabila BUSINESS-WORKFLOW mengharuskan komentar (misalnya **Approved with Comment**), maka Review Comment wajib diisi.

Apabila BUSINESS-WORKFLOW tidak mewajibkan komentar, maka Review Comment bersifat opsional.

Validasi detail mengacu pada:

**STEP 7 — Validation Rules**

---

# 5.5.341 Permission

Review Comment Workspace mengikuti:

- Official Permission Abstraction Principle
- Official Role Definition
- STEP 8 — Permission Matrix

Workspace hanya dapat digunakan oleh pengguna yang:

- Memiliki hak akses terhadap Engineering Document.
- Sedang berada pada tahapan BUSINESS-WORKFLOW yang mengizinkan pemberian Review Comment.

Hak akses tidak bergantung pada nama role, tetapi pada permission yang berlaku.

---

# 5.5.342 Error Handling

Review Comment Workspace mengikuti:

- Official Error Recovery Standard

Error yang mungkin terjadi:

- Permission Denied
- Validation Failed
- Failed to Save Review Comment
- Unexpected Error

Setiap Error wajib memiliki:

- User Message
- Recovery Action

Error tidak boleh mengubah:

- Engineering Document
- Metadata
- Document Lifecycle
- BUSINESS-WORKFLOW

---

# 5.5.343 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-RC-001 | Review Comment Workspace mengikuti Official Comment Separation Principle. |
| BR-RC-002 | Workspace hanya digunakan untuk memberikan Review Comment. |
| BR-RC-003 | Workspace tidak digunakan untuk melihat History Comment. |
| BR-RC-004 | Workspace hanya tersedia pada tahapan BUSINESS-WORKFLOW yang memerlukan Review Comment. |
| BR-RC-005 | Review Comment menjadi bagian dari Audit Trail Engineering Document. |
| BR-RC-006 | Validation mengikuti BUSINESS-WORKFLOW. |
| BR-RC-007 | Permission mengikuti Official Permission Abstraction Principle. |

---

# 5.5.344 Cross Reference

Review Comment Workspace mengacu pada:

- PART 2 — Application Layout Architecture
- BUSINESS-WORKFLOW.md
- PART F.6 — History Workspace
- Dashboard — Comment History Viewer
- STEP 7 — Validation Rules
- STEP 8 — Permission Matrix

---

# 5.5.345 Acceptance Criteria

Review Comment Workspace dinyatakan memenuhi spesifikasi apabila:

- Workspace mengikuti Official Comment Separation Principle.
- Workspace hanya digunakan untuk memberikan Review Comment.
- Workspace tidak digunakan untuk melihat histori komentar.
- Workspace hanya tersedia pada tahapan BUSINESS-WORKFLOW yang sesuai.
- Validation mengikuti BUSINESS-WORKFLOW.
- Permission mengikuti Official Permission Abstraction Principle.
- Error Handling mengikuti Official Error Recovery Standard.
- Review Comment tersimpan sebagai bagian dari Audit Trail Engineering Document.

---

# 5.5.346 Comment Read State

- Indicator "!" menunjukkan terdapat Review Comment yang belum dibaca oleh user aktif.

- Status read bersifat per-user.

- Status read tidak mempengaruhi user lain.

- Setelah View Comment dibuka,
seluruh comment yang tersedia saat itu dianggap telah dibaca oleh user aktif.

- Status read harus tetap tersimpan setelah:

  • Refresh
  • Logout
  • Login kembali
  • Browser ditutup

- Jika terdapat comment baru setelah user membaca comment sebelumnya,
indicator "!" harus muncul kembali.

- Indicator dihitung berdasarkan
Latest Comment Timestamp
dibandingkan
Last Read Timestamp milik user aktif.

- Workspace View Comment bersifat read-only.
Membuka Workspace tidak mengubah Business Workflow.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART F.4 — Workflow Actions (A / B / C)
# ==============================================================================

# PART F.4 — Workflow Actions (A / B / C)

## 5.5.346 Overview

Workflow Actions merupakan aksi yang digunakan oleh Reviewer untuk memberikan keputusan terhadap Engineering Document sesuai BUSINESS-WORKFLOW.

Workflow Actions terdiri dari tiga keputusan utama:

- A — Approved
- B — Approved with Comment
- C — Not Approved

Workflow Actions merupakan satu-satunya mekanisme yang mengubah tahapan BUSINESS-WORKFLOW pada proses review Engineering Document.

Workflow Actions mengikuti:

- BUSINESS-WORKFLOW.md
- Official Permission Abstraction Principle
- Official Role Definition
- Official Documentation Efficiency Strategy (ODES)

---

# 5.5.347 Workflow Objectives

Workflow Actions bertujuan untuk:

- Memberikan keputusan hasil review.
- Mengubah tahapan BUSINESS-WORKFLOW sesuai keputusan.
- Menghasilkan Audit Trail.
- Menjamin setiap keputusan mengikuti Business Rules yang telah ditetapkan.

Workflow Actions tidak digunakan untuk:

- Mengedit Engineering Document.
- Mengunggah file revisi.
- Memberikan Review Comment (dilakukan melalui Review Comment Workspace).
- Melihat History.

---

# 5.5.348 Workflow Action Matrix

| Action | Name | Comment | Workflow Result |
|---------|------|:-------:|-----------------|
| A | Approved | Optional | Melanjutkan ke tahapan berikutnya sesuai BUSINESS-WORKFLOW. |
| B | Approved with Comment | **Required** | Berpindah ke tahapan Comment sesuai BUSINESS-WORKFLOW. |
| C | Not Approved | Optional* | Berpindah ke tahapan Comment sesuai BUSINESS-WORKFLOW. |

\* Mengikuti keputusan BUSINESS-WORKFLOW saat ini. Apabila di masa depan aturan berubah, validasi mengikuti BUSINESS-WORKFLOW sebagai Single Source of Truth.

---

# 5.5.349 Workflow Behaviour

## Action A — Approved

Sistem harus:

- Memvalidasi permission pengguna.
- Mencatat keputusan Approval.
- Menyimpan komentar apabila diisi.
- Memindahkan Engineering Document ke tahapan berikutnya sesuai BUSINESS-WORKFLOW.

---

## Action B — Approved with Comment

Sistem harus:

- Memvalidasi permission pengguna.
- Memastikan Review Comment telah diisi.
- Menyimpan Review Comment.
- Memindahkan Engineering Document ke tahapan Comment sesuai BUSINESS-WORKFLOW.

---

## Action C — Not Approved

Sistem harus:

- Memvalidasi permission pengguna.
- Menyimpan Review Comment apabila diisi.
- Memindahkan Engineering Document ke tahapan Comment sesuai BUSINESS-WORKFLOW.

---

# 5.5.350 Permission

Workflow Actions hanya tersedia apabila seluruh kondisi berikut terpenuhi:

- Pengguna memiliki permission untuk melakukan review.
- Tahapan BUSINESS-WORKFLOW mengizinkan keputusan review.
- Engineering Document berada pada status yang sesuai.

Permission mengikuti:

- Official Permission Abstraction Principle.
- STEP 8 — Permission Matrix.

---

# 5.5.351 Validation

Validation mengikuti:

- BUSINESS-WORKFLOW.md
- STEP 7 — Validation Rules

Aturan utama:

| Workflow Action | Validation |
|-----------------|------------|
| A | Permission wajib valid. |
| B | Permission valid dan Review Comment wajib diisi. |
| C | Permission wajib valid. Review Comment mengikuti BUSINESS-WORKFLOW. |

---

# 5.5.352 Error Handling

Workflow Actions mengikuti:

- Official Error Recovery Standard

Kemungkinan Error:

- Permission Denied
- Validation Failed
- Workflow Transition Failed
- Unexpected Error

Setiap Error wajib memiliki:

- User Message
- Recovery Action

Workflow tidak boleh berubah apabila proses gagal.

---

# 5.5.353 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-WF-001 | Workflow Actions hanya mengikuti BUSINESS-WORKFLOW. |
| BR-WF-002 | Action A melanjutkan ke tahapan berikutnya sesuai BUSINESS-WORKFLOW. |
| BR-WF-003 | Action B mewajibkan Review Comment. |
| BR-WF-004 | Action C mengikuti validasi komentar pada BUSINESS-WORKFLOW. |
| BR-WF-005 | Workflow Action menghasilkan Audit Trail. |
| BR-WF-006 | Workflow Action tidak dapat dijalankan tanpa permission yang sesuai. |

---

# 5.5.354 Cross Reference

Workflow Actions mengacu pada:

- BUSINESS-WORKFLOW.md
- PART F.3 — Review Comment Workspace
- STEP 7 — Validation Rules
- STEP 8 — Permission Matrix
- Official Permission Abstraction Principle
- Official Error Recovery Standard

---

# 5.5.355 Acceptance Criteria

Workflow Actions dinyatakan memenuhi spesifikasi apabila:

- Action A, B, dan C mengikuti BUSINESS-WORKFLOW.
- Validation mengikuti STEP 7.
- Permission mengikuti STEP 8.
- Action B mewajibkan Review Comment.
- Workflow menghasilkan Audit Trail.
- Workflow tidak berubah apabila terjadi Error.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART F.4.1 — UI Action Visibility Matrix
# ==============================================================================

## 5.5.355.1 Overview

UI Action Visibility Matrix mendefinisikan Action yang harus ditampilkan pada setiap baris Document Register berdasarkan kombinasi:

- User Role
- Workflow Status
- Business Workflow
- Access Control

Matrix ini merupakan implementasi visual dari BUSINESS-WORKFLOW.md dan ACCESS-CONTROL.md.

AI maupun Developer tidak diperbolehkan mengubah Action berdasarkan asumsi sendiri.

---

## 5.5.355.2 Visibility Rules

Action pada setiap document mengikuti aturan berikut.

| Action | Keterangan |
|----------|------------|
| View | Selalu tersedia untuk seluruh Role yang memiliki akses membaca Document. |
| Download | Selalu tersedia untuk seluruh Role yang memiliki akses Download Document. |
| Comment | Selalu tersedia untuk seluruh Role yang memiliki akses melihat Comment. |
| A | Hanya muncul apabila User memiliki hak melakukan Approval dan Status Document sesuai Business Workflow. |
| B | Hanya muncul apabila User memiliki hak melakukan Approval dan Status Document sesuai Business Workflow. |
| C | Hanya muncul apabila User memiliki hak melakukan Approval dan Status Document sesuai Business Workflow. |
| History | Hanya muncul apabila Status Document = Approved. |

---

## 5.5.355.3 UI Action Visibility Matrix

| Role | Process Review | Process Comment | Project Review | Project Comment | Approved |
|------|----------------|----------------|----------------|----------------|-----------|
| Admin | View<br>Download<br>Comment | View<br>Download<br>Comment | View<br>Download<br>Comment | View<br>Download<br>Comment | View<br>Download<br>Comment<br>History |
| Document Owner | View<br>Download<br>Comment | View<br>Download<br>Comment | View<br>Download<br>Comment | View<br>Download<br>Comment | View<br>Download<br>Comment<br>History |
| Team Process | View<br>Download<br>Comment<br>A<br>B<br>C | View<br>Download<br>Comment | View<br>Download<br>Comment | View<br>Download<br>Comment | View<br>Download<br>Comment<br>History |
| Team Project | View<br>Download<br>Comment | View<br>Download<br>Comment | View<br>Download<br>Comment<br>A<br>B<br>C | View<br>Download<br>Comment | View<br>Download<br>Comment<br>History |

---

## 5.5.355.4 Workflow Rules

Business Workflow menentukan kapan Action Approval dapat ditampilkan.

| Status | Action |
|----------|---------|
| Process Review | Team Process memperoleh Action A, B, C. |
| Process Comment | Tidak ada Action Approval. |
| Project Review | Team Project memperoleh Action A, B, C. |
| Project Comment | Tidak ada Action Approval. |
| Approved | Action Approval diganti menjadi History. |

---

## 5.5.355.5 Design Rules

UI wajib mengikuti aturan berikut.

- Tombol View, Download, dan Comment berada pada baris pertama.
- Tombol A, B, dan C berada pada baris kedua.
- Tombol History menggantikan seluruh tombol Approval ketika Status = Approved.
- Susunan Action wajib konsisten pada seluruh halaman:
  - Dashboard
  - Document Register PFD
  - Document Register P&ID

---

## 5.5.355.6 Implementation Rules

Developer maupun AI wajib mengikuti aturan berikut.

- Action tidak boleh ditentukan berdasarkan Role saja.
- Action wajib ditentukan berdasarkan kombinasi:
  - User Role
  - Workflow Status
  - Business Workflow
  - Access Control
- Visibility Action harus konsisten pada seluruh halaman Document Register.
- Perubahan Business Workflow wajib otomatis mengubah Action yang ditampilkan tanpa mengubah struktur UI.

---

## 5.5.355.7 Acceptance Criteria

- Action sesuai dengan Business Workflow.
- Action sesuai dengan Role pengguna.
- Action berubah otomatis ketika Status berubah.
- Tombol History hanya muncul pada Status Approved.
- Layout Action konsisten pada Dashboard, PFD, dan P&ID.
- Tidak terdapat kombinasi Action yang bertentangan dengan BUSINESS-WORKFLOW.md.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART F.4.2 — Workflow Review Attachment
# ==============================================================================

## 5.5.355.8 Overview

Workflow Review Attachment merupakan Attachment yang diunggah oleh Reviewer sebagai bagian dari proses Workflow Review.

Attachment ini berbeda dengan Engineering Document maupun Revision Document. Workflow Review Attachment hanya digunakan sebagai dokumen pendukung ketika Reviewer memberikan keputusan Approval B (Approved with Comment) atau Approval C (Not Approved).

Workflow Review Attachment menjadi bagian dari Workflow Comment dan tersimpan sebagai bagian dari Workflow History.

Attachment dapat dilihat maupun diunduh kembali melalui Comment Viewer oleh pengguna yang memiliki hak akses terhadap dokumen.

---

## 5.5.355.9 Business Rules

Workflow Review Attachment mengikuti aturan berikut.

| Rule ID | Description |
|----------|-------------|
| BR-WRA-001 | Approval A tidak menyediakan Workflow Review Attachment. |
| BR-WRA-002 | Approval B mendukung Workflow Review Attachment. |
| BR-WRA-003 | Approval C mendukung Workflow Review Attachment. |
| BR-WRA-004 | Workflow Review Attachment bersifat opsional. |
| BR-WRA-005 | Setiap Workflow Comment hanya dapat memiliki maksimal satu Workflow Review Attachment. |
| BR-WRA-006 | Pada Approval B, Reviewer wajib memberikan Comment. Workflow Review Attachment bersifat optional. |
| BR-WRA-007 | Pada Approval C, Comment maupun Workflow Review Attachment bersifat opsional. |
| BR-WRA-008 | Workflow Review Attachment tidak mengubah Active Revision Document, Document Number, maupun Revision History. |
| BR-WRA-009 | Workflow Review Attachment menjadi bagian dari Workflow History dan dapat diakses kembali melalui Comment Viewer. |

---

## 5.5.355.10 Functional Behaviour

Ketika Reviewer memilih Approval B atau Approval C, sistem menyediakan area tambahan untuk mengunggah Workflow Review Attachment.

Reviewer dapat:

- Mengunggah maksimal satu Workflow Review Attachment.
- Menghapus Workflow Review Attachment sebelum Workflow dikirim.
- Mengunduh kembali Workflow Review Attachment sebelum Workflow dikirim.

Setelah Workflow berhasil dikirim:

- Workflow Review Attachment menjadi Read Only.
- Workflow Review Attachment tercatat sebagai bagian dari Workflow Comment pada Workflow History.
- Workflow Review Attachment tidak dapat diubah maupun diganti.

---

## 5.5.355.11 UI Behaviour

Form Approval B dan Approval C terdiri dari komponen berikut.

- Workflow Comment
- Workflow Review Attachment
- Attachment List
- Upload Button
- Remove Button (sebelum Submit)
- Download Button

Workflow Review Attachment hanya muncul pada Approval B dan Approval C.

Approval A tidak menampilkan komponen tersebut.

---

## 5.5.355.12 Validation Rules

| Field | Validation |
|--------|------------|
| Workflow Review Attachment | Optional |
| File Count | Maksimal satu file diperbolehkan |
| Duplicate File | Tidak Berlaku (karena hanya satu file) |
| Empty Attachment | Diperbolehkan |
| Upload Failed | Workflow tidak dapat dikirim apabila proses upload gagal |

Validasi Workflow Action mengikuti Business Rules berikut:

- Approval B wajib memiliki Workflow Comment. Workflow Review Attachment bersifat optional.
- Approval C memperbolehkan Workflow Comment maupun Workflow Review Attachment kosong.

Seluruh validasi format file mengikuti STEP 7 — Validation Rules.

---

## 5.5.355.13 Workflow Integration

Workflow Review Attachment merupakan bagian dari Workflow Event.

Ketika Workflow berhasil diproses:

- Workflow Comment disimpan.
- Workflow Review Attachment disimpan.
- Audit Trail dibuat.
- Notification diproses.
- Workflow History diperbarui.

Workflow Review Attachment tidak mempengaruhi Business Workflow maupun Status Transition.

---

## 5.5.355.14 Permission Rules

Workflow Review Attachment mengikuti Permission yang sama dengan Workflow Action.

| Role | Upload | Download | View |
|------|:------:|:--------:|:----:|
| Team Process | ✓ | ✓ | ✓ |
| Team Project | ✓ | ✓ | ✓ |
| Document Owner | ✗ | ✓ | ✓ |
| Admin | ✗ | ✓ | ✓ |

---

## 5.5.355.15 Acceptance Criteria

Workflow Review Attachment dinyatakan memenuhi spesifikasi apabila:

- Hanya tersedia pada Approval B dan Approval C.
- Bersifat opsional.
- Mendukung lebih dari satu Attachment.
- Tidak mengubah Active Revision Document.
- Menjadi bagian dari Workflow History.
- Mengikuti Permission Workflow.
- Tidak mengubah Business Workflow.


# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART F.5 — Delete Document
# ==============================================================================

# PART F.5 — Delete Document

## CR-009 Superseding Rule

Mulai CR-009, konsep Delete Document pada UI operasional EDMS diganti dengan Archive Document.
Document tidak boleh dihapus permanen melalui Document Register.
Action Delete pada PFD Register dan P&ID Register wajib diganti menjadi Archive.
Archive merupakan perubahan Document Lifecycle dari Active menjadi Archived, bukan penghapusan data.
Restore mengembalikan Document Lifecycle dari Archived menjadi Active tanpa mengubah Workflow Status.

Aturan Archive:

- Hanya Admin pada Active Project yang dapat melakukan Archive dan Restore.
- Archive hanya dapat dilakukan pada Document dengan Workflow Status Approved.
- Archived Document tidak muncul pada operasional normal.
- Admin dapat melihat Lifecycle Filter dengan opsi Active, Archived, dan All.
- Saat Lifecycle = Archived, Actions hanya View, Download, dan Restore.
- Archived Document tidak dihitung pada Dashboard KPI, SLA, dan Escalation.
- Archive tidak menghasilkan Notification baru.
- Archive dan Restore menghasilkan Audit Trail.
- Revision History, Workflow History, Audit Trail, Viewer, Download, file, dan relasi Document tetap dipertahankan.

Apabila ada teks lama pada PART ini yang menyebut Delete Document, maka teks tersebut bersifat superseded oleh CR-009 dan tidak boleh digunakan sebagai dasar implementasi UI operasional.

## PHASE 2 Active Rule

Mulai sinkronisasi PHASE 2, seluruh subbagian legacy pada PART F.5 yang masih mendeskripsikan Delete Document wajib dibaca sebagai histori deprecated. Aturan operasional resmi untuk implementasi saat ini adalah:

- Nama feature aktif: Archive and Restore Document.
- Permission aktif: `document-register.archive`.
- Actor aktif: `Admin` pada Active Project.
- Archive hanya berlaku untuk Workflow Status `Approved` dengan lifecycle `Active`.
- Restore hanya berlaku untuk Document lifecycle `Archived` pada Project status `Active`.
- Archive dan Restore tidak menghapus file, metadata, revision history, workflow history, notification history, atau audit trail.
- Archive dan Restore tidak mengubah Workflow Status.
- Archive dan Restore wajib mencatat Audit Trail.
- Delete permanen dari Document Register tidak tersedia pada runtime EDMS.

## 5.5.356 Overview

Delete Document merupakan aksi yang digunakan untuk menghapus Engineering Document dari Document Register.

Delete merupakan **destructive action** sehingga hanya dapat dilakukan oleh pengguna yang memiliki permission sesuai Official Role Definition dan STEP 8 — Permission Matrix.

Delete Document mengikuti:

- BUSINESS-WORKFLOW.md
- Official Permission Abstraction Principle
- Official Error Recovery Standard
- Official System Responsibility Boundary Principle

---

## 5.5.357 Objectives

Delete Document bertujuan untuk:

- Menghapus Engineering Document yang tidak lagi diperlukan.
- Menjaga integritas Document Register.
- Mencatat aktivitas penghapusan sebagai Audit Trail.

Delete Document tidak digunakan untuk:

- Mengubah Revision.
- Mengubah Status.
- Menjalankan BUSINESS-WORKFLOW.
- Menghapus sebagian Metadata.

---

## 5.5.358 Delete Flow

```text
User

↓

Click Delete

↓

Permission Check

↓

Confirmation Dialog

↓

Delete Engineering Document

↓

Refresh Document Register

↓

Operation Completed
```

Apabila pengguna memilih **Cancel**, proses dihentikan tanpa perubahan terhadap sistem.

---

## 5.5.359 Confirmation Dialog

Sebelum proses Delete dijalankan, sistem wajib menampilkan dialog konfirmasi.

Dialog minimal menampilkan:

- Document Number
- Document Description
- Pesan konfirmasi penghapusan

Action Button:

- Cancel
- Delete

Delete hanya dijalankan apabila pengguna memilih **Delete**.

---

## 5.5.360 Behaviour

Ketika Delete berhasil:

- Engineering Document dihapus dari Document Register.
- Aktivitas dicatat pada Audit Trail.
- Document Register diperbarui.
- Pengguna tetap berada pada halaman Document Register.

Delete tidak boleh:

- Menjalankan BUSINESS-WORKFLOW.
- Mengubah Engineering Document lain.
- Mengubah SLA Document lain.

---

## 5.5.361 Permission

Permission mengikuti:

- Official Permission Abstraction Principle.
- Official Role Definition.
- STEP 8 — Permission Matrix.

Delete Action hanya ditampilkan kepada pengguna yang memiliki permission untuk menghapus Engineering Document.

---

## 5.5.362 Error Handling

Delete mengikuti:

- Official Error Recovery Standard.

Kemungkinan Error:

- Permission Denied
- Delete Failed
- Unexpected Error

Setiap Error wajib memiliki:

- User Message
- Recovery Action

Apabila Delete gagal:

- Engineering Document tetap tersedia.
- Tidak ada perubahan terhadap BUSINESS-WORKFLOW.
- Tidak ada perubahan terhadap Document Lifecycle.

---

## 5.5.363 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-DEL-001 | Delete memerlukan Confirmation Dialog. |
| BR-DEL-002 | Delete mengikuti Official Permission Abstraction Principle. |
| BR-DEL-003 | Delete menghasilkan Audit Trail. |
| BR-DEL-004 | Delete tidak menjalankan BUSINESS-WORKFLOW. |
| BR-DEL-005 | Delete mengikuti Official Error Recovery Standard. |
| BR-DEL-006 | Delete mengikuti Official System Responsibility Boundary Principle. |

---

## 5.5.364 Cross Reference

Delete Document mengacu pada:

- BUSINESS-WORKFLOW.md
- STEP 8 — Permission Matrix
- PART C.4 — Actions Column Specification
- Official Permission Abstraction Principle
- Official Error Recovery Standard
- Official System Responsibility Boundary Principle

---

## 5.5.365 Acceptance Criteria

Delete Document dinyatakan memenuhi spesifikasi apabila:

- Hanya pengguna yang memiliki permission dapat melihat Delete Action.
- Confirmation Dialog selalu ditampilkan sebelum Delete.
- Delete menghasilkan Audit Trail.
- Delete tidak menjalankan BUSINESS-WORKFLOW.
- Error mengikuti Official Error Recovery Standard.
- Penghapusan mengikuti Official System Responsibility Boundary Principle.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART F.6 — History Workspace
# ==============================================================================

# PART F.6 — History Workspace

## 5.5.366 Overview

History Workspace merupakan Workspace yang digunakan untuk menampilkan seluruh riwayat aktivitas Engineering Document.

Workspace ini bersifat **Read Only** dan digunakan sebagai sumber informasi historis terhadap seluruh perubahan yang pernah terjadi pada Engineering Document.

History Workspace mengikuti:

- BUSINESS-WORKFLOW.md
- Official Workspace Classification Standard
- Official Workspace State Management Principle
- Official Permission Abstraction Principle
- Official System Responsibility Boundary Principle

---

## 5.5.367 Objectives

History Workspace bertujuan untuk:

- Menampilkan Audit Trail Engineering Document.
- Menampilkan riwayat perubahan Status.
- Menampilkan riwayat Revision.
- Menampilkan riwayat Workflow Decision.
- Menampilkan riwayat Review Comment.
- Menampilkan aktivitas penting yang berkaitan dengan Engineering Document.

History Workspace tidak digunakan untuk:

- Mengubah data.
- Memberikan Review Comment.
- Menjalankan Workflow.
- Mengubah Metadata.
- Menghapus History.

---

## 5.5.368 Workspace Layout

Workspace mengikuti **Application Layout Architecture** pada PART 2.

Workspace hanya mengganti **Main Content Area**.

Global Layout tetap menggunakan:

- Top Navigation
- Sidebar
- User Profile
- Responsive Layout

---

### Main Content Blueprint

```text
+--------------------------------------------------------------------------------------+
|                Refer PART 2 — Application Layout Architecture                        |
+--------------------------------------------------------------------------------------+

 Top Navigation (Refer PART 2)

+--------------------------------------------------------------------------------------+

 Sidebar
 (Refer
 PART 2)

│
│
│

│   +-------------------------------------------------------------------------+
│   |                      Document History Workspace                          |
│   |-------------------------------------------------------------------------|
│   | History Header                                                         |
│   |-------------------------------------------------------------------------|
│   | Document Number                                                        |
│   | Description                                                            |
│   | Revision | Status | Current Assignee                                   |
│   |-------------------------------------------------------------------------|
│   |                                                                         |
│   | Activity Timeline                                                      |
│   |-------------------------------------------------------------------------|
│   | ● Upload Document                                                      |
│   | ● Process Review                                                       |
│   | ● Review Comment                                                       |
│   | ● Revision Uploaded                                                    |
│   | ● Project Review                                                       |
│   | ● Approved                                                             |
│   |-------------------------------------------------------------------------|
│   |                           [ Close ]                                    |
│   +-------------------------------------------------------------------------+
```

---

## 5.5.369 History Components

| Component | Category | Purpose |
|-----------|----------|---------|
| History Header | Information Component | Menampilkan identitas Engineering Document. |
| Activity Timeline | Information Component | Menampilkan seluruh riwayat aktivitas dokumen secara kronologis. |
| Close Button | Control Component | Menutup History Workspace dan kembali ke Document Register. |

Workspace mengikuti **Official Component Category Standard**.

---

## 5.5.370 History Behaviour

History Workspace hanya menampilkan data yang telah tersimpan sebagai Audit Trail.

Timeline dapat menampilkan aktivitas seperti:

- Upload Engineering Document.
- Workflow Decision (A/B/C).
- Review Comment.
- Upload Revision.
- Perubahan Status.
- Perubahan Revision.
- Approval.
- Aktivitas lain yang didefinisikan oleh BUSINESS-WORKFLOW.

Seluruh informasi ditampilkan secara **Read Only**.

History Workspace tidak menyediakan fungsi:

- Edit.
- Delete.
- Approve.
- Comment.
- Download.

---

## 5.5.371 Permission

Permission mengikuti:

- Official Permission Abstraction Principle.
- Official Role Definition.
- STEP 8 — Permission Matrix.

Pengguna yang memiliki hak akses terhadap Engineering Document dapat membuka History Workspace sesuai permission yang berlaku.

---

## 5.5.372 Error Handling

History Workspace mengikuti:

- Official Error Recovery Standard.

Kemungkinan Error:

- Permission Denied
- History Not Available
- Unexpected Error

Setiap Error wajib memiliki:

- User Message
- Recovery Action

History Workspace tidak boleh mengubah Engineering Document maupun Audit Trail.

---

## 5.5.373 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-HIS-001 | History Workspace hanya bersifat Read Only. |
| BR-HIS-002 | Seluruh aktivitas ditampilkan berdasarkan Audit Trail. |
| BR-HIS-003 | Timeline mengikuti urutan kronologis aktivitas. |
| BR-HIS-004 | History Workspace tidak menjalankan BUSINESS-WORKFLOW. |
| BR-HIS-005 | History Workspace tidak mengubah Engineering Document. |
| BR-HIS-006 | Permission mengikuti Official Permission Abstraction Principle. |

---

## 5.5.374 Cross Reference

History Workspace mengacu pada:

- BUSINESS-WORKFLOW.md
- PART F.3 — Review Comment Workspace
- PART F.4 — Workflow Actions
- Official Permission Abstraction Principle
- Official Error Recovery Standard
- STEP 8 — Permission Matrix

---

## 5.5.375 Acceptance Criteria

History Workspace dinyatakan memenuhi spesifikasi apabila:

- Seluruh aktivitas ditampilkan berdasarkan Audit Trail.
- Timeline ditampilkan secara kronologis.
- Workspace berjalan dalam mode Read Only.
- Tidak dapat mengubah Engineering Document maupun Audit Trail.
- Permission mengikuti STEP 8 — Permission Matrix.
- Error mengikuti Official Error Recovery Standard.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 5 — Functional Requirements
# PART G — Pagination
# ==============================================================================

# PART G — Pagination

## 5.5.376 Overview

Pagination merupakan komponen navigasi yang digunakan untuk berpindah antar halaman pada Document Register ketika jumlah Engineering Document melebihi kapasitas tampilan satu halaman.

Pagination hanya mengatur navigasi tampilan data.

Pagination tidak mengubah:

- Engineering Document
- Metadata
- BUSINESS-WORKFLOW
- Document Lifecycle

Pagination mengikuti:

- Official Component Category Standard
- Official Workspace State Management Principle
- Official Documentation Efficiency Strategy (ODES)

---

## 5.5.377 Pagination Layout

Pagination ditempatkan pada bagian bawah **Document Register Panel**.

### Main Content Blueprint

```text
+---------------------------------------------------------------+

 Previous     Page 1   2   3   4   ...   Next

 Showing 1–20 of 132 Documents

+---------------------------------------------------------------+
```

Komponen terdiri dari:

- Previous Button
- Page Number
- Next Button
- Total Data Information

---

## 5.5.378 Behaviour

Pagination mengikuti perilaku berikut.

### Previous

Menampilkan halaman sebelumnya apabila tersedia.

---

### Next

Menampilkan halaman berikutnya apabila tersedia.

---

### Page Number

Menampilkan halaman yang dipilih pengguna.

---

### Data Refresh

Perubahan halaman hanya memperbarui isi **Document Register Table**.

Global Layout dan Document Register Panel tidak berubah.

---

### Current Page

Halaman aktif ditampilkan menggunakan state aktif (active state).

---

## 5.5.379 Business Rules

| Rule ID | Description |
|----------|-------------|
| BR-PAG-001 | Pagination hanya mengubah halaman tampilan data. |
| BR-PAG-002 | Pagination tidak mengubah Engineering Document. |
| BR-PAG-003 | Pagination tidak menjalankan BUSINESS-WORKFLOW. |
| BR-PAG-004 | Pagination tidak mengubah Document Lifecycle. |
| BR-PAG-005 | Pagination mempertahankan Filter dan Search yang sedang aktif. |

---

## 5.5.380 Cross Reference

Pagination mengacu pada:

- PART C — Document Register Panel
- Official Workspace State Management Principle
- Official Component Category Standard

---

## 5.5.381 Acceptance Criteria

Pagination dinyatakan memenuhi spesifikasi apabila:

- Previous dan Next berfungsi dengan benar.
- Halaman aktif ditampilkan dengan jelas.
- Perpindahan halaman hanya memperbarui Document Register Table.
- Filter dan Search tetap dipertahankan selama perpindahan halaman.
- Pagination tidak mengubah Engineering Document maupun BUSINESS-WORKFLOW.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 6 — Business Rule Directory
# ==============================================================================

# STEP 6 — Business Rule Directory

## 6.1 Overview

Business Rule Directory merupakan direktori terpusat yang digunakan untuk mengelompokkan dan menelusuri seluruh Business Rule yang digunakan pada aplikasi Engineering Document Management System (EDMS).

STEP 6 **tidak mendefinisikan ulang Business Rule**.

Seluruh Business Rule tetap didefinisikan pada modul atau dokumen yang menjadi **Single Source of Truth**, sedangkan STEP 6 hanya berfungsi sebagai indeks referensi.

Business Rule Directory mengikuti:

- Official Documentation Efficiency Strategy (ODES)
- Single Source of Truth Principle

---

# 6.2 Objectives

Business Rule Directory bertujuan untuk:

- Menjadi indeks seluruh Business Rule EDMS.
- Mempermudah pencarian Rule berdasarkan kategori.
- Menghindari duplikasi dokumentasi.
- Menjaga konsistensi Business Rule antar dokumen.
- Mempermudah implementasi Frontend, Backend, dan QA.

Business Rule tidak boleh didefinisikan ulang di STEP 6.

---

# 6.3 Business Rule Classification

Seluruh Business Rule dikelompokkan ke dalam kategori berikut.

| Prefix | Category | Description |
|----------|----------|-------------|
| BR-GLOBAL | Global | Aturan umum yang berlaku untuk seluruh sistem. |
| BR-WF | Workflow | Aturan BUSINESS-WORKFLOW. |
| BR-UI | User Interface | Aturan perilaku UI dan Workspace. |
| BR-VAL | Validation | Aturan validasi data dan form. |
| BR-PERM | Permission | Aturan hak akses pengguna. |
| BR-SLA | SLA | Aturan SLA Timer dan SLA Status. |

Seluruh Rule menggunakan prefix kategori agar mudah ditelusuri selama implementasi.

---

# 6.4 Business Rule Directory

Business Rule Directory terdiri dari empat informasi utama.

| Column | Description |
|----------|-------------|
| Rule ID | Identitas unik Business Rule. |
| Category | Kelompok Business Rule. |
| Summary | Ringkasan singkat Business Rule. |
| Source of Truth | Dokumen atau bagian tempat Rule didefinisikan secara lengkap. |

Business Rule lengkap tidak ditulis ulang pada STEP 6.

---

# 6.5 Business Rule Matrix

| Rule ID | Category | Summary | Source of Truth |
|----------|----------|---------|-----------------|
| BR-GLOBAL-001 | Global | Official Role Definition | STEP 4 |
| BR-GLOBAL-002 | Global | Official Comment Separation Principle | PART F.3 |
| BR-GLOBAL-003 | Global | Official Permission Abstraction Principle | Official Standards |
| BR-GLOBAL-004 | Global | Official Error Recovery Standard | Official Standards |
| BR-GLOBAL-005 | Global | Official Workspace State Management Principle | Official Standards |
| BR-GLOBAL-006 | Global | Official System Responsibility Boundary Principle | Official Standards |
| BR-WF-001 | Workflow | Workflow Action A mengikuti BUSINESS-WORKFLOW | BUSINESS-WORKFLOW.md |
| BR-WF-002 | Workflow | Workflow Action B mewajibkan Review Comment | BUSINESS-WORKFLOW.md |
| BR-WF-003 | Workflow | Workflow Action C mengikuti BUSINESS-WORKFLOW | BUSINESS-WORKFLOW.md |
| BR-UI-001 | UI | Action Visibility mengikuti Role, Status, dan Workflow | PART C.4 |
| BR-UI-002 | UI | Workspace mengikuti Application Layout Architecture | PART 2 |
| BR-VAL-001 | Validation | Validation mengikuti STEP 7 | STEP 7 |
| BR-PERM-001 | Permission | Permission mengikuti STEP 8 | STEP 8 |
| BR-SLA-001 | SLA | SLA mengikuti BUSINESS-WORKFLOW | BUSINESS-WORKFLOW.md |
| BR-UI-003 | UI | Comment Unread Indicator bersifat per-user dan persisten | STEP 5 PART F.3 — Review Comment Workspace |

> **Catatan:** Matriks di atas adalah direktori awal. Daftar ini akan terus bertambah seiring bertambahnya modul dan Business Rule pada PRD.

---

# 6.6 Rule Lookup Guideline

Developer, QA, maupun AI Coding Agent tidak menggunakan STEP 6 untuk memahami detail Rule.

Langkah yang digunakan adalah:

1. Cari Rule ID pada Business Rule Directory.
2. Lihat kategori Rule.
3. Ikuti tautan pada kolom **Source of Truth**.
4. Gunakan definisi lengkap pada dokumen tersebut.

Dengan mekanisme ini, setiap Business Rule hanya memiliki satu definisi resmi.

---

# 6.7 Cross Reference

Business Rule Directory mengacu pada:

- BUSINESS-WORKFLOW.md
- PART 2 — Application Layout Architecture
- STEP 4 — Document Information Model
- STEP 7 — Validation Rules
- STEP 8 — Permission Matrix
- Official Architecture Standards

---

# 6.8 Acceptance Criteria

Business Rule Directory dinyatakan memenuhi spesifikasi apabila:

- Tidak mendefinisikan ulang Business Rule.
- Seluruh Rule memiliki Rule ID yang unik.
- Seluruh Rule memiliki kategori yang sesuai.
- Seluruh Rule memiliki Source of Truth.
- Seluruh Rule dapat ditelusuri melalui Business Rule Directory.
- STEP 6 berfungsi sebagai indeks, bukan sebagai tempat duplikasi dokumentasi.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 6 — Business Rule Directory
# ==============================================================================

# STEP 6 — Business Rule Directory

## 6.1 Overview

Business Rule Directory merupakan direktori terpusat yang digunakan untuk mengelompokkan dan menelusuri seluruh Business Rule pada aplikasi Engineering Document Management System (EDMS).

STEP 6 **tidak mendefinisikan ulang Business Rule**.

Seluruh Business Rule tetap didefinisikan pada PART, STEP, atau dokumen yang menjadi **Single Source of Truth**, sedangkan STEP 6 hanya berfungsi sebagai indeks referensi.

STEP 6 mengikuti:

- Official Documentation Efficiency Strategy (ODES)
- Single Source of Truth Principle

---

# 6.2 Objectives

Business Rule Directory bertujuan untuk:

- Menjadi indeks seluruh Business Rule EDMS.
- Mempermudah pencarian Rule berdasarkan kategori.
- Menghindari duplikasi dokumentasi.
- Menjaga konsistensi Business Rule antar dokumen.
- Mempermudah implementasi Frontend, Backend, QA, dan AI Coding Agent.

Business Rule tidak boleh didefinisikan ulang di STEP 6.

---

# 6.3 Business Rule Classification

Seluruh Business Rule dikelompokkan menjadi:

| Prefix | Category | Description |
|----------|----------|-------------|
| BR-GLOBAL | Global | Aturan umum yang berlaku pada seluruh aplikasi EDMS. |
| BR-WF | Workflow | Aturan BUSINESS-WORKFLOW. |
| BR-UI | User Interface | Aturan tampilan dan interaksi pengguna. |
| BR-VAL | Validation | Aturan validasi data dan form. |
| BR-PERM | Permission | Aturan hak akses pengguna. |
| BR-SLA | SLA | Aturan SLA Timer dan SLA Status. |

Seluruh Rule menggunakan prefix kategori agar mudah dicari selama implementasi.

---

# 6.4 Business Rule Directory Structure

Business Rule Directory menggunakan struktur berikut.

| Column | Description |
|----------|-------------|
| Rule ID | Identitas unik Business Rule. |
| Category | Kategori Business Rule. |
| Summary | Ringkasan singkat Business Rule. |
| Source of Truth | PART, STEP, atau nama dokumen tempat Rule didefinisikan secara lengkap. |

> **Source of Truth wajib menunjuk ke section atau dokumen yang benar-benar ada.**
>
> Tidak diperbolehkan menggunakan istilah kolektif seperti:
>
> - Official Standards
> - Official Architecture Standards
> - Internal Standards
>
> kecuali benar-benar dibuat sebagai dokumen resmi.

---

# 6.5 Business Rule Matrix

| Rule ID | Category | Summary | Source of Truth |
|----------|----------|---------|-----------------|
| BR-GLOBAL-001 | Global | Official Role Definition | STEP 4 — Document Information Model |
| BR-GLOBAL-002 | Global | Official Widget Documentation Standard | STEP 5 PART B — Action Area |
| BR-GLOBAL-003 | Global | Official Component Documentation Standard | STEP 5 PART B — Action Area |
| BR-GLOBAL-004 | Global | Official Field Classification Standard | STEP 5 PART D — Create Document Modal |
| BR-GLOBAL-005 | Global | Official Modal Documentation Standard | STEP 5 PART D — Create Document Modal |
| BR-GLOBAL-006 | Global | Official Button Feedback Standard | STEP 5 PART D — Create Document Modal |
| BR-GLOBAL-007 | Global | Official Processing State Standard | STEP 5 PART D — Create Document Modal |
| BR-GLOBAL-008 | Global | Official Workspace Classification Standard | STEP 5 PART F.1 — View Document Workspace |
| BR-GLOBAL-009 | Global | Official Component Category Standard | STEP 5 PART F.1 — View Document Workspace |
| BR-GLOBAL-010 | Global | Official Viewer Component Standard | STEP 5 PART F.1 — View Document Workspace |
| BR-GLOBAL-011 | Global | Official Viewer Capability Standard | STEP 5 PART F.1 — View Document Workspace |
| BR-GLOBAL-012 | Global | Official Workspace State Management Principle | STEP 5 PART F.1 — View Document Workspace |
| BR-GLOBAL-013 | Global | Official Action Placement Principle | STEP 5 PART F.1 — View Document Workspace |
| BR-GLOBAL-014 | Global | Official Permission Abstraction Principle | STEP 5 PART F.1 — View Document Workspace |
| BR-GLOBAL-015 | Global | Official Error Recovery Standard | STEP 5 PART F.1 — View Document Workspace |
| BR-GLOBAL-016 | Global | Official System Responsibility Boundary Principle | STEP 5 PART F.2 — Download Document |
| BR-GLOBAL-017 | Global | Official Comment Separation Principle | STEP 5 PART F.3 — Review Comment Workspace |
| BR-GLOBAL-018 | Global | Official Documentation Efficiency Strategy (ODES) | STEP 6 — Business Rule Directory |

| BR-WF-001 | Workflow | Workflow Decision mengikuti BUSINESS-WORKFLOW | BUSINESS-WORKFLOW.md |
| BR-WF-002 | Workflow | Action A mengikuti BUSINESS-WORKFLOW | STEP 5 PART F.4 — Workflow Actions |
| BR-WF-003 | Workflow | Action B mewajibkan Review Comment | STEP 5 PART F.4 — Workflow Actions |
| BR-WF-004 | Workflow | Action C mengikuti BUSINESS-WORKFLOW | STEP 5 PART F.4 — Workflow Actions |

| BR-UI-001 | UI | Visibility Action mengikuti Role, Status, dan BUSINESS-WORKFLOW | STEP 5 PART C.4 — Actions Column |
| BR-UI-002 | UI | Workspace mengikuti Application Layout Architecture | PART 2 — Application Layout Architecture |

| BR-VAL-001 | Validation | Validation mengikuti Validation Rules | STEP 7 — Validation Rules |

| BR-PERM-001 | Permission | Permission mengikuti Permission Matrix | STEP 8 — Permission Matrix |

| BR-SLA-001 | SLA | SLA mengikuti BUSINESS-WORKFLOW | BUSINESS-WORKFLOW.md |

> **Catatan**
>
> Business Rule Matrix bersifat dinamis.
>
> Daftar Rule akan bertambah seiring bertambahnya modul pada PRD.

---

# 6.6 Rule Lookup Procedure

Developer, QA, maupun AI Coding Agent menggunakan Business Rule Directory dengan langkah berikut.

1. Identifikasi Rule ID yang diperlukan.
2. Lihat kategori Rule.
3. Buka lokasi pada kolom **Source of Truth**.
4. Gunakan definisi lengkap pada lokasi tersebut.

Business Rule tidak boleh diinterpretasikan berdasarkan ringkasan pada STEP 6.

Definisi resmi selalu berada pada Source of Truth.

---

# 6.7 Cross Reference

Business Rule Directory mengacu pada:

- BUSINESS-WORKFLOW.md
- PART 2 — Application Layout Architecture
- STEP 4 — Document Information Model
- STEP 5 — Functional Requirements
- STEP 7 — Validation Rules
- STEP 8 — Permission Matrix

---

# 6.8 Acceptance Criteria

Business Rule Directory dinyatakan memenuhi spesifikasi apabila:

- Tidak mendefinisikan ulang Business Rule.
- Seluruh Rule memiliki Rule ID yang unik.
- Seluruh Rule memiliki kategori yang benar.
- Seluruh Rule memiliki Summary yang jelas.
- Seluruh Rule memiliki Source of Truth yang valid.
- Source of Truth selalu menunjuk ke PART, STEP, atau dokumen yang benar-benar ada.
- STEP 6 berfungsi sebagai direktori Business Rule, bukan sebagai tempat duplikasi dokumentasi.


# ==============================================================================
# PART 5 — Document Register Module
# STEP 7 — Validation Directory
# ==============================================================================

# STEP 7 — Validation Directory

## 7.1 Overview

Validation Directory merupakan direktori terpusat yang digunakan untuk mengelompokkan dan menelusuri seluruh Validation Rule pada aplikasi Engineering Document Management System (EDMS).

STEP 7 **tidak mendefinisikan ulang Validation Rule**.

Seluruh Validation Rule tetap didefinisikan pada PART, STEP, atau dokumen yang menjadi **Single Source of Truth**, sedangkan STEP 7 hanya berfungsi sebagai indeks referensi.

Validation Directory mengikuti:

- Official Documentation Efficiency Strategy (ODES)
- Single Source of Truth Principle

---

## 7.2 Objectives

Validation Directory bertujuan untuk:

- Menjadi indeks seluruh Validation Rule EDMS.
- Mempermudah pencarian Validation Rule berdasarkan kategori.
- Menghindari duplikasi dokumentasi.
- Menjaga konsistensi Validation Rule antar dokumen.
- Mempermudah implementasi Frontend, Backend, QA, dan AI Coding Agent.

Validation Rule tidak boleh didefinisikan ulang pada STEP 7.

---

## 7.3 Validation Classification

Seluruh Validation Rule dikelompokkan menjadi kategori berikut.

| Prefix | Category | Description |
|----------|----------|-------------|
| VAL-FORM | Form Validation | Validasi seluruh Input Field dan Form. |
| VAL-WF | Workflow Validation | Validasi yang dipengaruhi BUSINESS-WORKFLOW. |
| VAL-PERM | Permission Validation | Validasi Permission sebelum Action dijalankan. |
| VAL-FILE | File Validation | Validasi Upload dan Replacement File. |
| VAL-SYSTEM | System Validation | Validasi yang dilakukan sistem sebelum Processing dijalankan. |

Seluruh Validation menggunakan prefix kategori agar mudah dicari selama implementasi.

---

## 7.4 Validation Directory Structure

Validation Directory menggunakan struktur berikut.

| Column | Description |
|----------|-------------|
| Validation ID | Identitas unik Validation Rule. |
| Category | Kategori Validation. |
| Summary | Ringkasan Validation Rule. |
| Source of Truth | PART, STEP, atau nama dokumen tempat Validation Rule didefinisikan secara lengkap. |

> **Source of Truth wajib menunjuk ke PART, STEP, atau dokumen yang benar-benar ada.**

Validation Directory tidak boleh menjadi tempat mendefinisikan ulang Validation Rule.

---

## 7.5 Validation Matrix

| Validation ID | Category | Summary | Source of Truth |
|---------------|----------|---------|-----------------|
| VAL-FORM-001 | Form | Master Validation seluruh Document Information | STEP 4 — Document Information Model |
| VAL-FORM-002 | Form | Validation untuk Create Document Input Fields | STEP 5 PART D.2 — Input Fields |
| VAL-FORM-003 | Form | Behaviour Validation pada Create Document | STEP 5 PART D.3 — Field Behaviour |
| VAL-FORM-004 | Form | Validation untuk Edit Document Input Fields | STEP 5 PART E.2 — Input Fields |
| VAL-FORM-005 | Form | Behaviour Validation pada Edit Document | STEP 5 PART E.3 — Field Behaviour |
| VAL-WF-001 | Workflow | Validation sebelum proses Create Document dijalankan | STEP 5 PART D.5 — Modal Flow |
| VAL-WF-002 | Workflow | Validation sebelum proses Update Document dijalankan | STEP 5 PART E.5 — Modal Flow |
| VAL-WF-003 | Workflow | Workflow Transition Validation | BUSINESS-WORKFLOW.md |
| VAL-PERM-001 | Permission | Permission Validation | STEP 8 — Permission Matrix |
| VAL-FILE-001 | File | Upload Engineering Document Validation | STEP 5 PART D.2 — Input Fields |
| VAL-FILE-002 | File | Replacement Engineering Document Validation | STEP 5 PART E.2 — Input Fields |
| VAL-SYSTEM-001 | System | Validation sebelum Workflow Processing dijalankan | BUSINESS-WORKFLOW.md |

> **Catatan**
>
> Validation Matrix bersifat dinamis.
>
> Daftar Validation Rule akan bertambah seiring bertambahnya modul pada PRD.

---

## 7.6 Validation Principles

Seluruh Validation Rule pada aplikasi EDMS mengikuti prinsip berikut.

### A. Single Source of Truth

Setiap Validation Rule hanya memiliki satu lokasi dokumentasi resmi.

Validation Directory tidak mendefinisikan ulang Validation Rule.

---

### B. Layer Responsibility

Validation dilakukan sesuai tanggung jawab masing-masing layer.

- UI Validation
- Business Validation
- Workflow Validation
- Permission Validation
- System Validation

---

### C. Workflow Driven Validation

Validation yang berkaitan dengan:

- Revision
- Status
- Current Assignee
- SLA Timer
- SLA Status

selalu mengikuti **BUSINESS-WORKFLOW.md**.

---

### D. Permission First

Permission Validation harus berhasil sebelum Validation lainnya dijalankan.

---

### E. Validation Before Processing

Seluruh Validation wajib berhasil sebelum Processing Pipeline dijalankan.

---

### F. Documentation Consistency

Seluruh Validation Rule wajib memiliki Source of Truth yang valid.

Source of Truth harus menunjuk ke PART, STEP, atau dokumen yang benar-benar ada.

---

## 7.7 Validation Lookup Procedure

Developer, QA, maupun AI Coding Agent menggunakan Validation Directory dengan langkah berikut.

1. Identifikasi Validation ID yang dibutuhkan.
2. Lihat Category Validation.
3. Buka lokasi pada kolom **Source of Truth**.
4. Gunakan definisi lengkap pada lokasi tersebut.

Validation Rule tidak boleh diinterpretasikan berdasarkan ringkasan pada STEP 7.

Definisi resmi selalu berada pada **Source of Truth**.

---

## 7.8 Cross Reference

Validation Directory mengacu pada:

- STEP 4 — Document Information Model
- STEP 5 PART D.2 — Input Fields
- STEP 5 PART D.3 — Field Behaviour
- STEP 5 PART D.5 — Modal Flow
- STEP 5 PART E.2 — Input Fields
- STEP 5 PART E.3 — Field Behaviour
- STEP 5 PART E.5 — Modal Flow
- STEP 8 — Permission Matrix
- BUSINESS-WORKFLOW.md
- BACKEND-READY-SCHEMA.md (Historical Reference / Unavailable)
- API-CONTRACT.md
- LOCAL-STORAGE-API.md (Historical Reference / Unavailable)

---

## 7.9 Acceptance Criteria

Validation Directory dinyatakan memenuhi spesifikasi apabila:

- Tidak mendefinisikan ulang Validation Rule.
- Seluruh Validation memiliki Validation ID yang unik.
- Seluruh Validation memiliki kategori yang sesuai.
- Seluruh Validation memiliki Summary yang jelas.
- Seluruh Validation memiliki Source of Truth yang valid.
- Source of Truth selalu menunjuk ke PART, STEP, atau dokumen yang benar-benar ada.
- STEP 7 berfungsi sebagai Validation Directory, bukan sebagai tempat duplikasi Validation Rule.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 8 — Permission Directory
# ==============================================================================

# STEP 8 — Permission Directory

## 8.1 Overview

Permission Directory merupakan direktori terpusat yang digunakan untuk mengelompokkan seluruh Permission Rule pada aplikasi Engineering Document Management System (EDMS).

STEP 8 **tidak mendefinisikan ulang Permission Rule**.

Seluruh Permission Rule tetap didefinisikan pada PART, STEP, atau dokumen yang menjadi **Single Source of Truth**, sedangkan STEP 8 hanya berfungsi sebagai indeks referensi.

Permission Directory mengikuti:

- Official Documentation Efficiency Strategy (ODES)
- Single Source of Truth Principle

---

## 8.2 Objectives

Permission Directory bertujuan untuk:

- Menjadi indeks seluruh Permission Rule EDMS.
- Mempermudah pencarian Permission berdasarkan fitur.
- Menghindari duplikasi dokumentasi.
- Menjaga konsistensi hak akses pada seluruh modul.
- Menjadi referensi implementasi Frontend, Backend, QA, dan AI Coding Agent.

Permission Rule tidak boleh didefinisikan ulang pada STEP 8.

---

## 8.3 Permission Classification

Seluruh Permission Rule dikelompokkan menjadi kategori berikut.

| Prefix | Category | Description |
|----------|----------|-------------|
| PERM-VIEW | View Permission | Hak akses untuk melihat informasi. |
| PERM-CREATE | Create Permission | Hak akses membuat data baru. |
| PERM-UPDATE | Update Permission | Hak akses memperbarui data. |
| PERM-WORKFLOW | Workflow Permission | Hak akses menjalankan BUSINESS-WORKFLOW. |
| PERM-ARCHIVE | Archive Permission | Hak akses mengarsipkan dan memulihkan Engineering Document tanpa permanent delete. |
| PERM-SYSTEM | System Permission | Hak akses yang dijalankan oleh sistem. |

Seluruh Permission menggunakan prefix kategori agar mudah dicari selama implementasi.

---

## 8.4 Permission Directory Structure

Permission Directory menggunakan struktur berikut.

| Column | Description |
|----------|-------------|
| Permission ID | Identitas unik Permission Rule. |
| Category | Kategori Permission. |
| Summary | Ringkasan singkat Permission Rule. |
| Source of Truth | PART, STEP, atau nama dokumen tempat Permission Rule didefinisikan secara lengkap. |

> **Source of Truth wajib menunjuk ke PART, STEP, atau dokumen yang benar-benar ada.**

Permission Directory tidak boleh menjadi tempat mendefinisikan ulang Permission Rule.

---

## 8.5 Permission Matrix

| Permission ID | Category | Summary | Source of Truth |
|---------------|----------|---------|-----------------|
| PERM-VIEW-001 | View | View Engineering Document | STEP 5 PART F.1 — View Document Workspace |
| PERM-VIEW-002 | View | View History | STEP 5 PART F.6 — History Workspace |
| PERM-CREATE-001 | Create | Create Engineering Document | STEP 5 PART D — Create Document Modal |
| PERM-UPDATE-001 | Update | Edit Engineering Document | STEP 5 PART E — Edit Document Modal |
| PERM-WORKFLOW-001 | Workflow | Review Comment Permission | STEP 5 PART F.3 — Review Comment Workspace |
| PERM-WORKFLOW-002 | Workflow | Workflow Action (A/B/C) | STEP 5 PART F.4 — Workflow Actions |
| PERM-ARCHIVE-001 | Archive | Archive and Restore Engineering Document | STEP 5 PART F.5 — Archive Document |
| PERM-SYSTEM-001 | System | Workflow Processing Permission | BUSINESS-WORKFLOW.md |

> **Catatan**
>
> Permission Matrix bersifat dinamis.
>
> Daftar Permission Rule akan bertambah seiring bertambahnya modul pada PRD.

---

## 8.6 Permission Principles

Seluruh Permission Rule pada aplikasi EDMS mengikuti prinsip berikut.

### A. Single Source of Truth

Setiap Permission Rule hanya memiliki satu lokasi dokumentasi resmi.

Permission Directory tidak mendefinisikan ulang Permission Rule.

---

### B. Permission Before Action

Setiap Action harus melalui proses Permission Validation terlebih dahulu.

---

### C. Workflow Driven Permission

Permission yang berkaitan dengan Approval, Review, dan Comment mengikuti BUSINESS-WORKFLOW.md.

---

### D. Role Based Permission

Permission diberikan berdasarkan Official Role Definition.

Role yang digunakan pada EDMS:

- Admin
- Document Owner
- Team Process
- Team Project

---

### E. Visibility Follows Permission

Visibilitas Action pada User Interface mengikuti Permission yang dimiliki pengguna.

Permission menentukan apakah suatu Action ditampilkan, bukan sebaliknya.

---

### F. Least Privilege Principle

Pengguna hanya memperoleh Permission yang diperlukan untuk menjalankan tugasnya.

---

## 8.7 Permission Lookup Procedure

Developer, QA, maupun AI Coding Agent menggunakan Permission Directory dengan langkah berikut.

1. Identifikasi Permission ID.
2. Lihat kategori Permission.
3. Buka lokasi pada kolom **Source of Truth**.
4. Gunakan definisi lengkap pada lokasi tersebut.

Permission Rule tidak boleh diinterpretasikan berdasarkan ringkasan pada STEP 8.

Definisi resmi selalu berada pada **Source of Truth**.

---

## 8.8 Cross Reference

Permission Directory mengacu pada:

- STEP 4 — Document Information Model
- STEP 5 PART C.4 — Actions Column
- STEP 5 PART D — Create Document Modal
- STEP 5 PART E — Edit Document Modal
- STEP 5 PART F.1 — View Document Workspace
- STEP 5 PART F.3 — Review Comment Workspace
- STEP 5 PART F.4 — Workflow Actions
- STEP 5 PART F.5 — Delete Document
- STEP 5 PART F.6 — History Workspace
- BUSINESS-WORKFLOW.md

---

## 8.9 Acceptance Criteria

Permission Directory dinyatakan memenuhi spesifikasi apabila:

- Tidak mendefinisikan ulang Permission Rule.
- Seluruh Permission memiliki Permission ID yang unik.
- Seluruh Permission memiliki kategori yang sesuai.
- Seluruh Permission memiliki Summary yang jelas.
- Seluruh Permission memiliki Source of Truth yang valid.
- Source of Truth selalu menunjuk ke PART, STEP, atau dokumen yang benar-benar ada.
- STEP 8 berfungsi sebagai Permission Directory, bukan sebagai tempat duplikasi Permission Rule.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 9 — Component Directory
# ==============================================================================

# STEP 9 — Component Directory

## 9.1 Overview

Component Directory merupakan direktori terpusat yang digunakan untuk mengelompokkan seluruh User Interface Component yang digunakan pada aplikasi Engineering Document Management System (EDMS).

STEP 9 **tidak mendefinisikan ulang Component Specification**.

Seluruh spesifikasi Component tetap didefinisikan pada PART, STEP, atau dokumen yang menjadi **Single Source of Truth**, sedangkan STEP 9 hanya berfungsi sebagai indeks referensi.

Component Directory mengikuti:

- Official Documentation Efficiency Strategy (ODES)
- Single Source of Truth Principle

---

## 9.2 Objectives

Component Directory bertujuan untuk:

- Menjadi indeks seluruh UI Component EDMS.
- Mempermudah pencarian Component.
- Menghindari duplikasi dokumentasi.
- Menjaga konsistensi penggunaan Component.
- Mempermudah implementasi Frontend, Backend, QA, dan AI Coding Agent.

Component Specification tidak boleh didefinisikan ulang pada STEP 9.

---

## 9.3 Component Classification

Seluruh Component dikelompokkan menjadi kategori berikut.

| Prefix | Category | Description |
|----------|----------|-------------|
| CMP-LAYOUT | Layout | Struktur utama halaman. |
| CMP-PANEL | Panel | Panel atau Container. |
| CMP-TABLE | Table | Data Table dan Grid. |
| CMP-FORM | Form | Form Input dan Field. |
| CMP-MODAL | Modal | Modal Dialog. |
| CMP-WORKSPACE | Workspace | Workspace atau halaman kerja. |
| CMP-ACTION | Action | Button dan User Action. |
| CMP-NAV | Navigation | Pagination dan navigasi. |

Seluruh Component menggunakan prefix kategori agar mudah dicari selama implementasi.

---

## 9.4 Component Directory Structure

Component Directory menggunakan struktur berikut.

| Column | Description |
|----------|-------------|
| Component ID | Identitas unik Component. |
| Category | Kategori Component. |
| Component Name | Nama resmi Component. |
| Source of Truth | PART, STEP, atau dokumen tempat Component didefinisikan secara lengkap. |

> **Source of Truth wajib menunjuk ke PART, STEP, atau dokumen yang benar-benar ada.**

Component Directory tidak boleh menjadi tempat mendefinisikan ulang Component Specification.

---

## 9.5 Component Matrix

| Component ID | Category | Component Name | Source of Truth |
|--------------|----------|----------------|-----------------|
| CMP-LAYOUT-001 | Layout | Application Layout Architecture | PART 2 — Application Layout Architecture |
| CMP-PANEL-001 | Panel | Page Header | STEP 5 PART A — Page Header |
| CMP-PANEL-002 | Panel | Action Area | STEP 5 PART B — Action Area |
| CMP-PANEL-003 | Panel | Document Register Panel | STEP 5 PART C — Document Register Panel |
| CMP-TABLE-001 | Table | Document Register Table | STEP 5 PART C.3 — Document Register Table |
| CMP-FORM-001 | Form | Create Document Modal | STEP 5 PART D — Create Document Modal |
| CMP-FORM-002 | Form | Edit Document Modal | STEP 5 PART E — Edit Document Modal |
| CMP-WORKSPACE-001 | Workspace | View Document Workspace | STEP 5 PART F.1 — View Document Workspace |
| CMP-WORKSPACE-002 | Workspace | Review Comment Workspace | STEP 5 PART F.3 — Review Comment Workspace |
| CMP-WORKSPACE-003 | Workspace | History Workspace | STEP 5 PART F.6 — History Workspace |
| CMP-ACTION-001 | Action | Workflow Actions (A / B / C) | STEP 5 PART F.4 — Workflow Actions |
| CMP-ACTION-002 | Action | Archive Document | STEP 5 PART F.5 — Archive Document |
| CMP-NAV-001 | Navigation | Pagination | STEP 5 PART G — Pagination |

> **Catatan**
>
> Component Matrix bersifat dinamis.
>
> Daftar Component akan bertambah seiring bertambahnya modul pada PRD.

---

## 9.6 Component Principles

Seluruh Component pada aplikasi EDMS mengikuti prinsip berikut.

### A. Single Source of Truth

Setiap Component hanya memiliki satu lokasi dokumentasi resmi.

Component Directory tidak mendefinisikan ulang spesifikasi Component.

---

### B. Reusability

Component dirancang untuk dapat digunakan kembali pada modul lain tanpa mengubah perilaku dasar.

---

### C. Consistency

Component dengan fungsi yang sama harus memiliki tampilan, perilaku, dan interaksi yang konsisten di seluruh aplikasi.

---

### D. Separation of Responsibility

Setiap Component hanya bertanggung jawab terhadap fungsi utamanya.

Perubahan pada satu Component tidak boleh mengubah tanggung jawab Component lain.

---

### E. Documentation Consistency

Seluruh Component wajib memiliki Source of Truth yang valid.

Source of Truth harus menunjuk ke PART, STEP, atau dokumen yang benar-benar ada.

---

## 9.7 Component Lookup Procedure

Developer, QA, maupun AI Coding Agent menggunakan Component Directory dengan langkah berikut.

1. Identifikasi Component ID.
2. Lihat kategori Component.
3. Buka lokasi pada kolom **Source of Truth**.
4. Gunakan spesifikasi lengkap pada lokasi tersebut.

Component tidak boleh diimplementasikan hanya berdasarkan ringkasan pada STEP 9.

Definisi resmi selalu berada pada **Source of Truth**.

---

## 9.8 Cross Reference

Component Directory mengacu pada:

- PART 2 — Application Layout Architecture
- STEP 5 PART A — Page Header
- STEP 5 PART B — Action Area
- STEP 5 PART C — Document Register Panel
- STEP 5 PART D — Create Document Modal
- STEP 5 PART E — Edit Document Modal
- STEP 5 PART F.1 — View Document Workspace
- STEP 5 PART F.3 — Review Comment Workspace
- STEP 5 PART F.4 — Workflow Actions
- STEP 5 PART F.5 — Archive Document
- STEP 5 PART F.6 — History Workspace
- STEP 5 PART G — Pagination

---

## 9.9 Acceptance Criteria

Component Directory dinyatakan memenuhi spesifikasi apabila:

- Tidak mendefinisikan ulang Component Specification.
- Seluruh Component memiliki Component ID yang unik.
- Seluruh Component memiliki kategori yang sesuai.
- Seluruh Component memiliki Source of Truth yang valid.
- Source of Truth selalu menunjuk ke PART, STEP, atau dokumen yang benar-benar ada.
- STEP 9 berfungsi sebagai Component Directory, bukan sebagai tempat duplikasi Component Specification.

# ==============================================================================
# PART 5 — Document Register Module
# STEP 10 — Acceptance Directory
# ==============================================================================

# STEP 10 — Acceptance Directory

## 10.1 Overview

Acceptance Directory merupakan direktori terpusat yang digunakan untuk mengelompokkan seluruh Acceptance Criteria pada aplikasi Engineering Document Management System (EDMS).

STEP 10 **tidak mendefinisikan ulang Acceptance Criteria**.

Seluruh Acceptance Criteria tetap didefinisikan pada PART, STEP, atau dokumen yang menjadi **Single Source of Truth**, sedangkan STEP 10 hanya berfungsi sebagai indeks referensi.

Acceptance Directory mengikuti:

- Official Documentation Efficiency Strategy (ODES)
- Single Source of Truth Principle

---

## 10.2 Objectives

Acceptance Directory bertujuan untuk:

- Menjadi indeks seluruh Acceptance Criteria.
- Mempermudah QA melakukan penelusuran Acceptance Criteria.
- Mempermudah Frontend dan Backend melakukan self validation.
- Menghindari duplikasi dokumentasi.
- Menjaga konsistensi Acceptance Criteria antar modul.

Acceptance Criteria tidak boleh didefinisikan ulang pada STEP 10.

---

## 10.3 Acceptance Classification

Acceptance Criteria dikelompokkan berdasarkan modul.

| Prefix | Category | Description |
|----------|----------|-------------|
| ACC-LAYOUT | Layout | Acceptance untuk Layout dan Page Structure. |
| ACC-FORM | Form | Acceptance untuk Form dan Modal. |
| ACC-WORKSPACE | Workspace | Acceptance untuk Workspace. |
| ACC-WORKFLOW | Workflow | Acceptance untuk Workflow Processing. |
| ACC-ACTION | Action | Acceptance untuk User Action. |
| ACC-NAV | Navigation | Acceptance untuk Navigation Component. |

---

## 10.4 Acceptance Directory Structure

Acceptance Directory menggunakan struktur berikut.

| Column | Description |
|----------|-------------|
| Acceptance ID | Identitas unik Acceptance Criteria. |
| Category | Kategori Acceptance. |
| Summary | Ringkasan Acceptance Criteria. |
| Source of Truth | PART, STEP, atau dokumen tempat Acceptance Criteria didefinisikan secara lengkap. |

> **Source of Truth wajib menunjuk ke PART, STEP, atau dokumen yang benar-benar ada.**

Acceptance Directory tidak boleh menjadi tempat mendefinisikan ulang Acceptance Criteria.

---

## 10.5 Acceptance Matrix

| Acceptance ID | Category | Summary | Source of Truth |
|---------------|----------|---------|-----------------|
| ACC-LAYOUT-001 | Layout | Page Header memenuhi spesifikasi | STEP 5 PART A — Page Header |
| ACC-LAYOUT-002 | Layout | Action Area memenuhi spesifikasi | STEP 5 PART B — Action Area |
| ACC-LAYOUT-003 | Layout | Document Register Panel memenuhi spesifikasi | STEP 5 PART C — Document Register Panel |
| ACC-FORM-001 | Form | Create Document Modal memenuhi spesifikasi | STEP 5 PART D — Create Document Modal |
| ACC-FORM-002 | Form | Edit Document Modal memenuhi spesifikasi | STEP 5 PART E — Edit Document Modal |
| ACC-WORKSPACE-001 | Workspace | View Document Workspace memenuhi spesifikasi | STEP 5 PART F.1 — View Document Workspace |
| ACC-WORKSPACE-002 | Workspace | Review Comment Workspace memenuhi spesifikasi | STEP 5 PART F.3 — Review Comment Workspace |
| ACC-WORKSPACE-003 | Workspace | History Workspace memenuhi spesifikasi | STEP 5 PART F.6 — History Workspace |
| ACC-WORKFLOW-001 | Workflow | Workflow Actions memenuhi spesifikasi | STEP 5 PART F.4 — Workflow Actions |
| ACC-ACTION-001 | Action | Archive Document memenuhi spesifikasi | STEP 5 PART F.5 — Archive Document |
| ACC-NAV-001 | Navigation | Pagination memenuhi spesifikasi | STEP 5 PART G — Pagination |

> **Catatan**
>
> Acceptance Matrix bersifat dinamis.
>
> Daftar Acceptance Criteria akan bertambah seiring bertambahnya modul pada PRD.

---

## 10.6 Acceptance Principles

Seluruh Acceptance Criteria pada aplikasi EDMS mengikuti prinsip berikut.

### A. Single Source of Truth

Setiap Acceptance Criteria hanya memiliki satu lokasi dokumentasi resmi.

Acceptance Directory tidak mendefinisikan ulang Acceptance Criteria.

---

### B. Verifiable

Setiap Acceptance Criteria harus dapat diverifikasi melalui implementasi maupun pengujian.

---

### C. Traceable

Setiap Acceptance Criteria harus dapat ditelusuri kembali ke PART, STEP, atau dokumen yang menjadi Source of Truth.

---

### D. Documentation Consistency

Seluruh Acceptance Criteria wajib memiliki Source of Truth yang valid.

Source of Truth harus menunjuk ke PART, STEP, atau dokumen yang benar-benar ada.

---

## 10.7 Acceptance Lookup Procedure

Developer, QA, maupun AI Coding Agent menggunakan Acceptance Directory dengan langkah berikut.

1. Identifikasi Acceptance ID.
2. Lihat kategori Acceptance.
3. Buka lokasi pada kolom **Source of Truth**.
4. Gunakan Acceptance Criteria lengkap pada lokasi tersebut.

Acceptance Criteria tidak boleh diinterpretasikan hanya berdasarkan ringkasan pada STEP 10.

Definisi resmi selalu berada pada **Source of Truth**.

---

## 10.8 Cross Reference

Acceptance Directory mengacu pada:

- STEP 5 — Functional Requirements
- STEP 6 — Business Rule Directory
- STEP 7 — Validation Directory
- STEP 8 — Permission Directory
- STEP 9 — Component Directory
- BUSINESS-WORKFLOW.md

---

## 10.9 Acceptance Criteria

Acceptance Directory dinyatakan memenuhi spesifikasi apabila:

- Tidak mendefinisikan ulang Acceptance Criteria.
- Seluruh Acceptance memiliki Acceptance ID yang unik.
- Seluruh Acceptance memiliki kategori yang sesuai.
- Seluruh Acceptance memiliki Summary yang jelas.
- Seluruh Acceptance memiliki Source of Truth yang valid.
- Source of Truth selalu menunjuk ke PART, STEP, atau dokumen yang benar-benar ada.
- STEP 10 berfungsi sebagai Acceptance Directory, bukan sebagai tempat duplikasi Acceptance Criteria.


# ==============================================================================
# PART 6 — SLA Monitoring (Review Time Monitoring)
# 6.1 Overview
# ==============================================================================

## 6.1 Overview

SLA Monitoring merupakan modul yang menyediakan pemantauan terhadap kondisi **Service Level Agreement (SLA)** seluruh Engineering Document yang sedang diproses dalam aplikasi **Engineering Document Management System (EDMS)**.

Modul ini memberikan visibilitas terhadap performa proses review dokumen dengan menampilkan kondisi SLA secara real-time berdasarkan data yang berasal dari Business Workflow.

SLA Monitoring membantu pengguna mengidentifikasi dokumen yang:

- Masih berada dalam target SLA.
- Mendekati batas waktu SLA.
- Melewati batas waktu SLA.
- Telah menyelesaikan seluruh proses Workflow.

Seluruh informasi SLA ditampilkan secara **read-only** dan tidak melakukan perubahan terhadap Workflow maupun Document Lifecycle.
> **Architecture Note**
>
> PART ini berpusat pada **SLA Status Domain** sebagai Single Source of Truth untuk seluruh informasi SLA pada aplikasi EDMS.
>
> Seluruh informasi SLA yang ditampilkan pada Dashboard maupun halaman SLA Monitoring berasal dari hasil perhitungan SLA Status yang didefinisikan pada PART ini.
>
> Dengan demikian, Dashboard dan halaman SLA Monitoring wajib menggunakan definisi, logika perhitungan, dan aturan SLA Status yang sama sehingga konsistensi informasi SLA tetap terjaga di seluruh aplikasi.

---

## Project Context

SLA Monitoring selalu bekerja berdasarkan Active Project.

Halaman SLA Monitoring hanya menampilkan Document dan hasil perhitungan SLA milik Active Project.

SLA Timer dan SLA Status tetap mengikuti BUSINESS-WORKFLOW.md.

Perpindahan Active Project:

- memuat ulang SLA Overview;
- memuat ulang SLA Monitoring Table;
- memuat ulang Search dan Filter Data Source;
- tidak mereset SLA Timer;
- tidak mengubah SLA Status;
- tidak mengubah Workflow Document.

Data SLA dari Project lain tidak boleh ditampilkan pada Active Project.

---

## Objectives

Modul SLA Monitoring bertujuan untuk:

- Memantau kondisi SLA seluruh Engineering Document.
- Memberikan visibilitas terhadap Current Assignee setiap dokumen.
- Membantu pengguna memprioritaskan pekerjaan berdasarkan kondisi SLA.
- Mengidentifikasi potensi keterlambatan proses review.
- Menyediakan informasi operasional secara real-time tanpa mengubah Business Workflow.
- Menyediakan definisi SLA Status yang digunakan secara konsisten pada seluruh modul aplikasi.

---

## Scope

PART ini mencakup spesifikasi mengenai:

- SLA Summary Cards.
- SLA Monitoring Table.
- SLA Status.
- SLA Timer.
- Current Assignee.
- Filtering.
- Search.
- Permission.
- Business Rules.
- Validation Rules.
- Error Handling.
- Acceptance Criteria.

PART ini tidak mencakup:

- Workflow Approval.
- Workflow Comment.
- Upload Revision.
- Edit Document.
- Archive Document.
- Workflow Configuration.

Seluruh fungsi tersebut tetap menjadi tanggung jawab modul lain sesuai Source of Truth masing-masing.

---

## Module Characteristics

SLA Monitoring merupakan **Dashboard Read Module**.

Modul ini hanya menampilkan hasil pembacaan data yang dihasilkan oleh Workflow Engine dan tidak memiliki kemampuan untuk mengubah Workflow.

Seluruh informasi yang ditampilkan berasal dari:

- Business Workflow.
- Workflow Engine.
- Dashboard Read Model.
- SLA Rules.

SLA Monitoring tidak menyimpan Workflow State sendiri.

---

## Design Principles

PART ini mengikuti prinsip berikut:

- Single Source of Truth.
- Dashboard Read Model.
- Official Documentation Efficiency Strategy (ODES).
- Official Role Canonical Naming Principle (ORCNP).
- Read-Only Monitoring Principle.

---

## Dependencies

Modul SLA Monitoring bergantung pada:

- BUSINESS-WORKFLOW.md
- SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable)
- FEATURE-MAPPING.md (Historical Reference / Unavailable)
- PART 4 — Dashboard
- PART 5 — Document Register Module

---

## Cross Reference

Implementasi PART ini mengacu pada:

- BUSINESS-WORKFLOW.md
- PART 4 — Dashboard
- PART 5 — Document Register Module

Seluruh perubahan terhadap Workflow, SLA Rules, Current Assignee, maupun Workflow Status harus mengikuti Source of Truth yang terdapat pada dokumen-dokumen tersebut.

# ==============================================================================
# PART 6 — SLA Monitoring
# 6.2 Objectives
# ==============================================================================

## 6.2 Objectives

Modul SLA Monitoring dirancang untuk menyediakan visibilitas terhadap performa proses Engineering Document berdasarkan Service Level Agreement (SLA) yang sedang berjalan.

Objectives modul ini adalah sebagai berikut.

### OBJ-SLA-001 — Monitoring SLA

Menyediakan informasi kondisi SLA seluruh Engineering Document secara real-time berdasarkan Business Workflow.

---

### OBJ-SLA-002 — Work Prioritization

Membantu pengguna memprioritaskan pekerjaan berdasarkan kondisi SLA sehingga dokumen yang mendekati atau melewati target SLA dapat segera ditindaklanjuti.

---

### OBJ-SLA-003 — Operational Visibility

Memberikan visibilitas terhadap Current Assignee yang sedang bertanggung jawab pada setiap Engineering Document.

---

### OBJ-SLA-004 — Performance Monitoring

Menyediakan ringkasan performa Workflow melalui indikator SLA sehingga pengguna dapat mengetahui kondisi pekerjaan secara cepat.

---

### OBJ-SLA-005 — Early Warning

Memberikan indikasi dini terhadap dokumen yang berpotensi mengalami keterlambatan sebelum melewati target SLA.

---

### OBJ-SLA-006 — Read-Only Monitoring

Menyediakan informasi SLA tanpa memberikan kemampuan untuk mengubah Workflow, Workflow Status, maupun Document Lifecycle.

---

### OBJ-SLA-007 — Business Workflow Consistency

Memastikan seluruh informasi SLA selalu konsisten dengan Business Workflow serta Dashboard Read Model sebagai Single Source of Truth.

---

## Success Criteria

PART ini dianggap memenuhi tujuan apabila:

- Pengguna dapat melihat kondisi SLA seluruh Engineering Document.
- Pengguna dapat mengetahui Current Assignee setiap dokumen.
- Pengguna dapat membedakan kondisi On Track, At Risk, Overdue, dan Final As-Built. Istilah `Done` hanya boleh digunakan sebagai display wording bila diperlukan.
- Pengguna dapat memprioritaskan pekerjaan berdasarkan kondisi SLA.
- Modul tidak mengubah Workflow maupun Document Lifecycle.
- Seluruh informasi SLA berasal dari Source of Truth yang telah ditentukan.

---

## Cross Reference

Objectives pada PART ini mengacu pada:

- BUSINESS-WORKFLOW.md
- SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable)
- FEATURE-MAPPING.md (Historical Reference / Unavailable)
- PART 4 — Dashboard
- PART 5 — Document Register Module

# ==============================================================================
# PART 6 — SLA Monitoring
# 6.3 Dashboard Layout
# ==============================================================================

## 6.3 Dashboard Layout

Halaman SLA Monitoring menggunakan layout yang berfokus pada penyajian informasi operasional secara cepat, ringkas, dan mudah dipahami.

Layout dirancang untuk membantu pengguna mengidentifikasi kondisi SLA seluruh Engineering Document tanpa harus membuka setiap dokumen satu per satu.

Halaman SLA Monitoring terdiri dari tiga area utama:

1. Summary Area
2. Filter Area
3. SLA Monitoring Table Area

---

## Layout Structure

Halaman menggunakan struktur sebagai berikut.

```text
+----------------------------------------------------------+
| Page Header                                              |
+----------------------------------------------------------+

+----------------------------------------------------------+
| Summary Area                                             |
+----------------------------------------------------------+

+----------------------------------------------------------+
| Filter Area                                              |
+----------------------------------------------------------+

+----------------------------------------------------------+
| SLA Monitoring Table Area                                |
+----------------------------------------------------------+
```

---

## Layout Sections

### A. Page Header

Menampilkan informasi halaman.

Komponen:

- Page Title
- Breadcrumb
- Last Refresh Information (opsional)

---

### B. Summary Area (SLA Overview)

Summary Area (SLA Overview) merupakan area yang menampilkan kumpulan Summary Card sebagai ringkasan kondisi SLA seluruh Engineering Document.

Pada modul SLA Monitoring, Summary Area terdiri dari Summary Card berikut:

- On Track
- At Risk
- Overdue
- Final As-Built

Summary Card hanya menampilkan ringkasan informasi dan tidak menggantikan fungsi SLA Monitoring Table.

Spesifikasi setiap Summary Card dijelaskan pada:

**PART 6.4 — Summary Area (SLA Overview)**

---

### C. Filter Area

Filter Area digunakan untuk memfilter data SLA berdasarkan kebutuhan pengguna.

Spesifikasi lengkap dijelaskan pada:

**PART 6.6 — Filtering & Search**

---

### D. SLA Monitoring Table Area

SLA Monitoring Table Area menampilkan daftar seluruh Engineering Document beserta informasi SLA.

Spesifikasi lengkap dijelaskan pada:

**PART 6.5 — SLA Monitoring Table**

---

## Responsive Behaviour

Layout harus mendukung:

- Desktop
- Laptop
- Tablet

Pada ukuran layar yang lebih kecil:

- Summary Area tetap berada pada bagian atas halaman.
- Filter Area tetap berada sebelum tabel.
- SLA Monitoring Table menggunakan horizontal scrolling apabila diperlukan.

Informasi SLA tidak boleh disembunyikan hanya karena keterbatasan ukuran layar.

---

## Design Principles

Layout mengikuti prinsip berikut:

- Dashboard Read Model.
- Information First.
- Read-Only Monitoring.
- Responsive Layout.
- Official Documentation Efficiency Strategy (ODES).

---

## Cross Reference

Layout ini mengacu pada:

- PART 4 — Dashboard
- PART 6.4 — Summary Area
- PART 6.5 — SLA Monitoring Table
- PART 6.6 — Filtering & Search

# ==============================================================================
# PART 6 — SLA Monitoring
# 6.3 Dashboard Layout
# ==============================================================================

## 6.3 Dashboard Layout

Halaman **SLA Monitoring** menggunakan layout yang berfokus pada penyajian informasi SLA secara ringkas, terstruktur, dan mudah dipahami sehingga pengguna dapat dengan cepat mengidentifikasi kondisi Service Level Agreement (SLA) seluruh Engineering Document.

---

### 6.3.1 Layout Scope

Bagian ini mendefinisikan struktur **Main Content Area** yang bersifat spesifik untuk halaman **SLA Monitoring**.

Elemen global aplikasi yang merupakan bagian dari **Application Layout Architecture**, termasuk:

- Header
- SIDEBAR HEADER
- Sidebar Navigation
- TOP NAVIGATION
- SIDEBAR FOOTER 
- Footer

mengacu pada **PART 2 — Product Overview**, **2.5 Application Layout Architecture**, sebagai **Single Source of Truth**, sehingga tidak didefinisikan kembali pada PART ini.

Diagram layout pada PART ini hanya menggambarkan penempatan komponen di dalam **Main Content Area** halaman SLA Monitoring.

---

### 6.3.2 Layout Structure

Struktur Main Content Area halaman SLA Monitoring terdiri dari tiga area utama.

```text
Main Content Area
+----------------------------------------------------------+
| Page Header                                              |
+----------------------------------------------------------+

+------------------------------------------------------------+
| Summary Area                                               |
+------------------------------------------------------------+

+------------------------------------------------------------+
| Filter Area                                                |
+------------------------------------------------------------+

+------------------------------------------------------------+
| SLA Monitoring Table Area                                  |
+------------------------------------------------------------+
```

---

### 6.3.3 Layout Sections

#### A. Summary Area (SLA Overview)

Summary Area merupakan area yang menampilkan kumpulan **Summary Card** sebagai ringkasan kondisi SLA seluruh Engineering Document.

Summary Area terdiri dari empat Summary Card:

- On Track
- At Risk
- Overdue
- Final As-Built

Summary Area hanya menampilkan informasi ringkasan dan tidak menggantikan fungsi SLA Monitoring Table.

Spesifikasi Summary Area dijelaskan pada:

**PART 6.4 — Summary Area (SLA Overview)**

---

#### B. Filter Area

Filter Area digunakan untuk membantu pengguna mempersempit data SLA yang ditampilkan pada SLA Monitoring Table.

Spesifikasi Filter Area dijelaskan pada:

**PART 6.6 — Filtering & Search**

---

#### C. SLA Monitoring Table Area

SLA Monitoring Table Area menampilkan daftar Engineering Document beserta informasi SLA yang berkaitan dengan setiap dokumen.

Spesifikasi lengkap tabel dijelaskan pada:

**PART 6.5 — SLA Monitoring Table**

---

### 6.3.4 Responsive Behaviour

Layout harus mendukung tampilan pada:

- Desktop
- Laptop
- Tablet

Pada ukuran layar yang lebih kecil:

- Summary Area tetap berada di bagian paling atas.
- Filter Area tetap berada sebelum SLA Monitoring Table.
- SLA Monitoring Table mendukung horizontal scrolling apabila diperlukan.

Informasi SLA tidak boleh dihilangkan hanya karena keterbatasan ukuran layar.

---

### 6.3.5 Design Principles

Dashboard Layout pada modul SLA Monitoring mengikuti prinsip berikut:

- Information First
- Read-Only Monitoring
- Responsive Layout
- Dashboard Read Model
- Official Documentation Efficiency Strategy (ODES)

---

### 6.3.6 Cross Reference

Section ini mengacu pada:

- PART 2 — Product Overview
  - 2.5 Application Layout Architecture
- PART 4 — Dashboard
- PART 6.4 — Summary Area (SLA Overview)
- PART 6.5 — SLA Monitoring Table
- PART 6.6 — Filtering & Search

# ==============================================================================
# PART 6 — SLA Monitoring
# 6.4 Summary Area (SLA Overview)
# 6.4.1 Overview
# ==============================================================================

## 6.4.1 Overview

Summary Area (SLA Overview) merupakan komponen utama pada modul **SLA Monitoring** yang digunakan untuk menyajikan ringkasan kondisi **SLA Status** seluruh Engineering Document.

Summary Area memberikan gambaran cepat mengenai kondisi Service Level Agreement (SLA) seluruh Engineering Document tanpa mengharuskan pengguna membaca seluruh data pada SLA Monitoring Table.

Summary Area terdiri dari empat Summary Card:

- On Track
- At Risk
- Overdue
- Final As-Built

Setiap Summary Card menampilkan jumlah Engineering Document berdasarkan kategori SLA Status yang telah dihitung menggunakan **SLA Status Calculation Rules**.

Summary Area dibangun berdasarkan **SLA Status Domain** yang didefinisikan pada PART ini dan menjadi **Single Source of Truth** untuk seluruh informasi SLA yang ditampilkan pada aplikasi.

Summary Area merupakan komponen **reusable** yang digunakan pada beberapa modul aplikasi, yaitu:

- Dashboard (SLA Overview)
- SLA Monitoring

Kedua implementasi tersebut wajib menggunakan:

- SLA Status Domain
- SLA Status Calculation Rules
- Interaction Behaviour

yang didefinisikan pada PART ini sehingga informasi SLA yang ditampilkan selalu konsisten di seluruh aplikasi.

Summary Area hanya berfungsi sebagai **read model** dan tidak melakukan perhitungan SLA secara mandiri.

Seluruh data yang ditampilkan berasal dari hasil perhitungan SLA Status yang dilakukan berdasarkan Business Workflow.

---

### Architecture Note

Summary Area merupakan **consumer** dari **SLA Status Domain**.

Business Logic tidak boleh diimplementasikan di dalam komponen Summary Area maupun Summary Card.

Seluruh nilai yang ditampilkan pada setiap Summary Card berasal dari hasil perhitungan **SLA Status Calculation Rules** yang didefinisikan pada PART ini.

Perubahan terhadap definisi SLA Status, Calculation Rules, Aggregation Rules, maupun Interaction Behaviour hanya boleh dilakukan pada **PART 6 — SLA Monitoring** sebagai **Single Source of Truth**.

# ==============================================================================
# PART 6 — SLA Monitoring
# 6.4 Summary Area (SLA Overview)
# 6.4.2 SLA Status Domain
# ==============================================================================

## 6.4.2 SLA Status Domain

SLA Status merupakan indikator yang menunjukkan kondisi Service Level Agreement (SLA) setiap Engineering Document berdasarkan target waktu validasi yang telah ditentukan.

SLA Status digunakan untuk membantu pengguna memonitor performa penyelesaian dokumen tanpa mengubah Business Workflow maupun Workflow Status.

SLA Status terdiri dari empat kategori:

- On Track
- At Risk
- Overdue
- Final As-Built

SLA Status merupakan domain yang berbeda dengan **Workflow Status**.

| Workflow Status | SLA Status |
|-----------------|------------|
| Process Review | On Track / At Risk / Overdue |
| Process Comment | On Track / At Risk / Overdue |
| Process Reject | On Track / At Risk / Overdue |
| Project Review | On Track / At Risk / Overdue |
| Project Comment | On Track / At Risk / Overdue |
| Project Reject | On Track / At Risk / Overdue |
| Approved | Final As-Built |

Workflow Status menggambarkan posisi Engineering Document di dalam Business Workflow.

SLA Status menggambarkan kondisi pencapaian target waktu validasi (Service Level Agreement).

Perubahan Workflow Status dapat mempengaruhi SLA Status, namun kedua atribut tersebut merupakan domain yang berbeda dan tidak boleh diperlakukan sebagai atribut yang sama.

---

### SLA Status Data Source

SLA Status dibentuk berdasarkan kombinasi informasi berikut:

- Workflow Status
- SLA Timer
- Days Until Validation

Days Until Validation merupakan target waktu validasi yang ditentukan ketika Engineering Document pertama kali dibuat.

SLA Timer merupakan waktu berjalan yang dihitung sesuai ketentuan pada BUSINESS-WORKFLOW.md.

Workflow Status digunakan untuk menentukan kondisi khusus seperti Final As-Built.

---

### Architecture Note

SLA Status merupakan **Business Domain**.

Dashboard (SLA Overview), Summary Area pada halaman SLA Monitoring, SLA Monitoring Table, Filtering, maupun fitur lain yang membutuhkan informasi SLA wajib menggunakan SLA Status yang didefinisikan pada PART ini.

Modul lain tidak diperbolehkan membuat definisi maupun perhitungan SLA Status secara terpisah.

Seluruh perubahan terhadap definisi SLA Status hanya boleh dilakukan pada PART ini sebagai **Single Source of Truth**.

# ==============================================================================
# PART 6 — SLA Monitoring
# 6.4 Summary Area (SLA Overview)
# 6.4.3 SLA Status Calculation Rules
# ==============================================================================

## 6.4.3 SLA Status Calculation Rules

SLA Status dihitung secara otomatis berdasarkan kombinasi antara:

- Workflow Status
- SLA Timer
- Days Until Validation

Perhitungan SLA Status digunakan sebagai dasar untuk menampilkan informasi pada:

- Dashboard (SLA Overview)
- Summary Area pada halaman SLA Monitoring
- SLA Monitoring Table
- Fitur lain yang menggunakan SLA Status

---

### SLA Timer Behaviour

SLA Timer merupakan durasi waktu yang dihitung sejak Engineering Document memasuki **Workflow Status** yang sedang aktif.

SLA Timer **bukan** merupakan umur Engineering Document.

Setiap kali **Workflow Status berubah** sesuai Business Workflow, **SLA Timer wajib di-reset** dan mulai menghitung kembali dari awal untuk Workflow Status yang baru.

Dengan demikian, SLA Status selalu dihitung berdasarkan **Current SLA Timer** pada **Current Workflow Stage**, bukan berdasarkan total umur Engineering Document.

Perilaku SLA Timer mengacu pada **BUSINESS-WORKFLOW.md** sebagai Single Source of Truth.

---

### SLA Status Calculation Rules

| Rule ID | Condition | SLA Status |
|----------|-----------|------------|
| SLA-001 | Current SLA Timer < Days Until Validation | On Track |
| SLA-002 | Current SLA Timer = Days Until Validation | At Risk |
| SLA-003 | Current SLA Timer > Days Until Validation | Overdue |
| SLA-004 | Workflow Status = Approved | Final As-Built |

---

### Priority Rule

Apabila **Workflow Status** bernilai **Approved**, maka **SLA Status** wajib menjadi **Final As-Built** tanpa memperhatikan nilai Current SLA Timer maupun Days Until Validation.

Rule ini memiliki prioritas tertinggi dibandingkan seluruh SLA Status Calculation Rules lainnya.

---

### Rule Evaluation Order

Sistem wajib mengevaluasi SLA Status menggunakan urutan berikut:

1. Periksa Workflow Status.
2. Apabila Workflow Status = Approved, maka SLA Status = Final As-Built.
3. Apabila Workflow Status selain Approved, gunakan Current SLA Timer pada Current Workflow Stage.
4. Bandingkan Current SLA Timer dengan Days Until Validation.
5. Tentukan SLA Status berdasarkan SLA Status Calculation Rules.

---

### Calculation Examples

| Workflow Status | Current SLA Timer | Days Until Validation | SLA Status |
|-----------------|------------------:|----------------------:|------------|
| Process Review | 2 Hari | 5 Hari | On Track |
| Process Review | 5 Hari | 5 Hari | At Risk |
| Process Review | 7 Hari | 5 Hari | Overdue |
| Project Review | 1 Hari | 5 Hari | On Track |
| Project Comment | 6 Hari | 5 Hari | Overdue |
| Approved | 10 Hari | 5 Hari | Final As-Built |

---

### Architecture Note

SLA Status merupakan hasil perhitungan Business Rule yang didefinisikan pada PART ini.

Dashboard (SLA Overview), Summary Area pada halaman SLA Monitoring, SLA Monitoring Table, maupun fitur lain yang menampilkan SLA Status wajib menggunakan hasil perhitungan yang sama.

Implementasi perhitungan SLA Status di luar aturan yang didefinisikan pada PART ini tidak diperbolehkan.

Seluruh perubahan terhadap SLA Timer Behaviour maupun SLA Status Calculation Rules harus mengikuti ketentuan yang terdapat pada **BUSINESS-WORKFLOW.md** dan PART ini sebagai **Single Source of Truth**.

# ==============================================================================
# PART 6 — SLA Monitoring
# 6.4 Summary Area (SLA Overview)
# 6.4.4 Interaction Behaviour
# ==============================================================================

## 6.4.4 Interaction Behaviour

Summary Area mendukung interaksi pengguna untuk mempermudah navigasi dan proses monitoring Engineering Document berdasarkan SLA Status.

Interaction Behaviour berbeda tergantung pada modul tempat Summary Area digunakan.

---

### Dashboard

Pada halaman Dashboard, setiap Summary Card berfungsi sebagai **shortcut** menuju halaman SLA Monitoring.

Ketika pengguna mengklik salah satu Summary Card, sistem harus:

1. Membuka halaman **SLA Monitoring**.
2. Menerapkan filter **SLA Status** secara otomatis sesuai Summary Card yang dipilih.
3. Menampilkan hanya Engineering Document yang sesuai dengan SLA Status tersebut.

Contoh:

| Summary Card | Halaman Tujuan | Filter Otomatis |
|--------------|----------------|-----------------|
| On Track | SLA Monitoring | SLA Status = On Track |
| At Risk | SLA Monitoring | SLA Status = At Risk |
| Overdue | SLA Monitoring | SLA Status = Overdue |
| Final As-Built | SLA Monitoring | SLA Status = Final As-Built |

---

### SLA Monitoring

Pada halaman SLA Monitoring, Summary Card tidak melakukan navigasi.

Ketika pengguna mengklik salah satu Summary Card, sistem harus:

1. Mempertahankan pengguna pada halaman SLA Monitoring.
2. Menerapkan filter **SLA Status** pada SLA Monitoring Table.
3. Menampilkan hanya Engineering Document yang sesuai dengan Summary Card yang dipilih.

Contoh:

| Summary Card | Filter Table |
|--------------|--------------|
| On Track | SLA Status = On Track |
| At Risk | SLA Status = At Risk |
| Overdue | SLA Status = Overdue |
| Final As-Built | SLA Status = Final As-Built |

---

### Filter Synchronization

Apabila Summary Card dipilih, filter SLA Status pada halaman SLA Monitoring harus diperbarui secara otomatis sehingga selalu mencerminkan Summary Card yang sedang aktif.

Perubahan filter melalui Summary Card harus memiliki perilaku yang sama dengan apabila pengguna memilih SLA Status melalui Filter Area.

---

### Architecture Note

Summary Area menggunakan komponen UI yang sama pada Dashboard maupun halaman SLA Monitoring.

Perbedaan implementasi hanya terletak pada **Interaction Behaviour**:

- Dashboard → Navigasi ke SLA Monitoring dengan filter otomatis.
- SLA Monitoring → Filter data pada SLA Monitoring Table tanpa berpindah halaman.

Business Logic maupun Calculation Rules tidak berubah dan tetap mengacu pada **PART 6.4.3 — SLA Status Calculation Rules** sebagai Single Source of Truth.

# ==============================================================================
# PART 6 — SLA Monitoring
# 6.4 Summary Area (SLA Overview)
# 6.4.5 Acceptance Criteria
# ==============================================================================

## 6.4.5 Acceptance Criteria

Summary Area (SLA Overview) dinyatakan memenuhi spesifikasi apabila memenuhi seluruh kriteria berikut.

| AC ID | Acceptance Criteria |
|-------|----------------------|
| AC-SLA-001 | Summary Area menampilkan empat Summary Card: On Track, At Risk, Overdue, dan Final As-Built. |
| AC-SLA-002 | Nilai setiap Summary Card dihitung berdasarkan SLA Status Calculation Rules yang didefinisikan pada PART ini. |
| AC-SLA-003 | Summary Area tidak melakukan perhitungan SLA secara mandiri dan hanya menampilkan hasil perhitungan SLA Status. |
| AC-SLA-004 | Dashboard dan halaman SLA Monitoring menggunakan definisi SLA Status yang sama sebagai Single Source of Truth. |
| AC-SLA-005 | Klik Summary Card pada Dashboard membuka halaman SLA Monitoring dengan SLA Status Filter yang sesuai secara otomatis. |
| AC-SLA-006 | Klik Summary Card pada halaman SLA Monitoring memfilter data pada SLA Monitoring Table tanpa berpindah halaman. |
| AC-SLA-007 | Perubahan Workflow Status yang menyebabkan reset SLA Timer harus menghasilkan perhitungan ulang SLA Status sesuai BUSINESS-WORKFLOW.md. |
| AC-SLA-008 | Apabila Workflow Status berubah menjadi Approved, SLA Status harus menjadi Final As-Built tanpa memperhatikan Current SLA Timer. |
| AC-SLA-009 | Nilai Summary Card harus diperbarui secara otomatis setelah terjadi perubahan yang mempengaruhi SLA Status. |
| AC-SLA-010 | Informasi yang ditampilkan pada Summary Area harus selalu konsisten dengan SLA Monitoring Table. |

---

### Cross Reference

Acceptance Criteria pada bagian ini mengacu pada:

- BUSINESS-WORKFLOW.md
- PART 6.4.2 — SLA Status Domain
- PART 6.4.3 — SLA Status Calculation Rules
- PART 6.4.4 — Interaction Behaviour

# ==============================================================================
# PART 6 — SLA Monitoring
# 6.5 SLA Monitoring Table
# ==============================================================================

## 6.5 SLA Monitoring Table

SLA Monitoring Table merupakan area utama pada halaman **SLA Monitoring** yang digunakan untuk menampilkan daftar Engineering Document beserta informasi SLA secara rinci.

Tabel ini berfungsi sebagai **detail view** dari Summary Area (SLA Overview). Seluruh data yang ditampilkan pada tabel harus menggunakan hasil perhitungan **SLA Status** sebagaimana didefinisikan pada **PART 6.4.3 — SLA Status Calculation Rules**.

---

### Layout

SLA Monitoring Table berada di bawah **Summary Area (SLA Overview)** dan menggunakan **Main Content Area Layout** sebagaimana didefinisikan pada **PART 2 — Product Overview → 2.5 Application Layout Architecture**.

Tabel harus mendukung:

- Vertical Scrolling
- Responsive Layout
- Empty State
- Loading State

---

### Column Definition

| No | Column | Description |
|----|--------|-------------|
| 1 | Document Number | Nomor Engineering Document yang unik dalam scope Project. |
| 2 | Document Title | Nama atau judul Engineering Document. |
| 3 | Area | Area Engineering Document. |
| 4 | Revision | Revisi Engineering Document saat ini (misalnya IFR-Submitted, IFA-Submitted, Approved). |
| 5 | Workflow Status | Status Workflow saat ini (Process Review, Process Comment, Process Reject, Project Review, Project Comment, Project Reject, Approved). |
| 6 | Current Assignee | Resolved display assignee untuk monitoring, Dashboard, SLA, Escalation, dan Notification Display. Authorization tetap berdasarkan Official Role dan Project Membership. |
| 7 | SLA Timer | Current SLA Timer pada Workflow Status yang sedang aktif. |
| 8 | SLA Status | Kondisi SLA Engineering Document (On Track, At Risk, Overdue, Final As-Built). |
| 9 | Actions | Menampilkan aksi yang tersedia sesuai Role pengguna, Workflow Status, Revision, Business Workflow, dan Access Control. |

---

### Actions

Kolom **Actions** digunakan untuk menampilkan aksi yang dapat dilakukan terhadap Engineering Document.

Action yang tersedia meliputi:

- View
- Edit
- Approval A
- Approval B
- Approval C
- History

Ketersediaan setiap Action ditentukan secara otomatis berdasarkan:

- Role pengguna.
- Workflow Status.
- Revision.
- Business Workflow.
- Access Control.

Tidak seluruh Action ditampilkan secara bersamaan.

Seluruh aturan mengenai visibilitas dan perilaku setiap Action mengacu pada:

- BUSINESS-WORKFLOW.md
- PART 3 — Authentication
- PART 5 — Document Register Module
- ACCESS-CONTROL.md

---

### Behaviour

SLA Monitoring Table harus memenuhi perilaku berikut:

- Menampilkan seluruh Engineering Document yang memenuhi kondisi filter aktif.
- Menggunakan hasil perhitungan SLA Status sebagaimana didefinisikan pada **PART 6.4.3 — SLA Status Calculation Rules**.
- Memperbarui data secara otomatis apabila terjadi perubahan Workflow Status yang mempengaruhi SLA Status.
- Mendukung filtering melalui **Summary Area (SLA Overview)** maupun **Filter Area**.
- Menampilkan informasi yang konsisten dengan Dashboard (SLA Overview).
- Seluruh row wajib berasal dari Active Project.
- Project ID digunakan sebagai scope query dan tidak wajib ditampilkan sebagai kolom.

**Days Until Validation** merupakan parameter internal yang digunakan sistem untuk menghitung SLA Status dan **tidak ditampilkan** pada SLA Monitoring Table.

---

### Acceptance Criteria

| AC ID | Acceptance Criteria |
|--------|---------------------|
| AC-TBL-001 | Tabel menampilkan seluruh kolom yang telah didefinisikan pada bagian Column Definition. |
| AC-TBL-002 | Nilai SLA Status mengikuti PART 6.4.3 — SLA Status Calculation Rules. |
| AC-TBL-003 | Nilai SLA Timer menampilkan Current SLA Timer pada Workflow Status yang sedang aktif. |
| AC-TBL-004 | Current Assignee menampilkan penanggung jawab sesuai Business Workflow. |
| AC-TBL-005 | Kolom Actions hanya menampilkan Action yang diizinkan sesuai Role, Workflow Status, Revision, Business Workflow, dan Access Control. |
| AC-TBL-006 | Perubahan Workflow Status menyebabkan SLA Timer di-reset dan SLA Status dihitung ulang sesuai BUSINESS-WORKFLOW.md. |
| AC-TBL-007 | Data pada tabel selalu konsisten dengan Summary Area (SLA Overview). |
| AC-TBL-008 | Empty State ditampilkan apabila tidak terdapat Engineering Document yang memenuhi filter. |
| AC-TBL-009 | Loading State ditampilkan selama proses pengambilan data berlangsung. |

---

### Cross Reference

Bagian ini mengacu pada:

- BUSINESS-WORKFLOW.md
- PART 2 — Product Overview → 2.5 Application Layout Architecture
- PART 3 — Authentication
- PART 4 — Dashboard
- PART 5 — Document Register Module
- ACCESS-CONTROL.md
- PART 6.4 — Summary Area (SLA Overview)

# ==============================================================================
# PART 6 — SLA Monitoring
# 6.6 Filtering & Search
# ==============================================================================

## 6.6 Filtering & Search

Filtering & Search digunakan untuk membantu pengguna menemukan Engineering Document berdasarkan kondisi SLA maupun informasi dokumen secara cepat.

Seluruh proses Filtering & Search hanya mempengaruhi data yang ditampilkan pada **SLA Monitoring Table** dan tidak mengubah Engineering Document, Business Workflow, maupun SLA Status.

---

### Search

Sistem harus menyediakan fasilitas pencarian Engineering Document menggunakan kata kunci.

Pencarian dilakukan secara real-time terhadap data yang ditampilkan pada SLA Monitoring Table.

Minimal data yang dapat dicari meliputi:

- Document Number
- Document Title
- Area

---

### Filter

SLA Monitoring harus menyediakan Filter Area yang memungkinkan pengguna memfilter Engineering Document berdasarkan:

- SLA Status
- Workflow Status
- Current Assignee

Seluruh filter dapat digunakan secara bersamaan (Combined Filtering).

Apabila pengguna memilih Summary Card pada **Summary Area (SLA Overview)**, sistem harus secara otomatis mengaktifkan filter **SLA Status** yang sesuai.

---

### Behaviour

Filtering & Search harus memenuhi perilaku berikut:

- Search dan Filter dapat digunakan secara bersamaan.
- Perubahan Search maupun Filter langsung memperbarui data pada SLA Monitoring Table.
- Reset Filter mengembalikan seluruh Search dan Filter ke kondisi default.
- Filtering & Search hanya mempengaruhi data yang ditampilkan pada SLA Monitoring Table.
- Summary Area (SLA Overview) selalu menampilkan **Global SLA Summary** dan tidak dipengaruhi oleh Search maupun Filter yang sedang aktif.
- Apabila pengguna memilih Summary Card pada Summary Area (SLA Overview), sistem harus mengaktifkan SLA Status Filter secara otomatis pada SLA Monitoring Table sesuai Summary Card yang dipilih.

---

### Acceptance Criteria

| AC ID | Acceptance Criteria |
|--------|---------------------|
| AC-FLT-001 | Pengguna dapat mencari Engineering Document menggunakan Search Box. |
| AC-FLT-002 | Pengguna dapat memfilter Engineering Document berdasarkan SLA Status. |
| AC-FLT-003 | Pengguna dapat memfilter Engineering Document berdasarkan Workflow Status. |
| AC-FLT-004 | Pengguna dapat memfilter Engineering Document berdasarkan Current Assignee. |
| AC-FLT-005 | Search dan Filter dapat digunakan secara bersamaan. |
| AC-FLT-006 | Reset Filter mengembalikan seluruh Search dan Filter ke kondisi default. |
| AC-FLT-007 | Klik Summary Card pada Summary Area (SLA Overview) secara otomatis mengaktifkan SLA Status Filter yang sesuai. |
| AC-FLT-008 | Filtering & Search hanya mempengaruhi data yang ditampilkan pada SLA Monitoring Table. |
| AC-FLT-009 | Summary Area (SLA Overview) selalu menampilkan Global SLA Summary dan tidak berubah akibat Search maupun Filter yang diterapkan pada SLA Monitoring Table. |

---

### Cross Reference

Bagian ini mengacu pada:

- BUSINESS-WORKFLOW.md
- PART 4 — Dashboard
- PART 6.4 — Summary Area (SLA Overview)
- PART 6.5 — SLA Monitoring Table

# ==============================================================================
# PART 6 — SLA Monitoring
# 6.7 Permission Matrix
# ==============================================================================

## 6.7 Permission Matrix

SLA Monitoring merupakan modul **read-only monitoring** yang digunakan untuk memantau kondisi SLA seluruh Engineering Document.

Hak akses terhadap halaman SLA Monitoring maupun informasi yang ditampilkan mengikuti Role dan Access Control yang didefinisikan pada sistem.

---

### Permission Matrix

| Feature | Admin | Document Owner | Team Process | Team Project |
|---------|:-----:|:--------------:|:------------:|:------------:|
| View SLA Monitoring Page | ✓ | ✓ | ✓ | ✓ |
| View Summary Area (SLA Overview) | ✓ | ✓ | ✓ | ✓ |
| View SLA Monitoring Table | ✓ | ✓ | ✓ | ✓ |
| Search Engineering Document | ✓ | ✓ | ✓ | ✓ |
| Filter Engineering Document | ✓ | ✓ | ✓ | ✓ |

---

### Permission Rules

SLA Monitoring hanya menyediakan fungsi monitoring terhadap Engineering Document.

Modul ini **tidak menyediakan** fungsi untuk:

- Mengubah Engineering Document.
- Mengubah Workflow Status.
- Mengubah SLA Status.
- Mengubah SLA Timer.
- Melakukan Approval Workflow.

Seluruh perubahan terhadap Engineering Document maupun Business Workflow harus dilakukan melalui modul yang sesuai sebagaimana didefinisikan pada **BUSINESS-WORKFLOW.md** dan **PART 5 — Document Register Module**.

---

### Cross Reference

Bagian ini mengacu pada:

- BUSINESS-WORKFLOW.md
- ACCESS-CONTROL.md
- PART 3 — Authentication
- PART 5 — Document Register Module

# ==============================================================================
# PART 6 — SLA Monitoring
# 6.7 Permission Matrix
# ==============================================================================

## 6.7 Permission Matrix

SLA Monitoring merupakan modul **read-only monitoring** yang digunakan untuk memantau kondisi SLA seluruh Engineering Document.

Seluruh Official Role memiliki hak untuk mengakses halaman SLA Monitoring sebagai sarana monitoring dan koordinasi pekerjaan.

---

### Permission Matrix

| Feature | Admin | Document Owner | Team Process | Team Project |
|---------|:-----:|:--------------:|:------------:|:------------:|
| View SLA Monitoring Page | ✓ | ✓ | ✓ | ✓ |
| View Summary Area (SLA Overview) | ✓ | ✓ | ✓ | ✓ |
| View SLA Monitoring Table | ✓ | ✓ | ✓ | ✓ |
| Search Engineering Document | ✓ | ✓ | ✓ | ✓ |
| Filter Engineering Document | ✓ | ✓ | ✓ | ✓ |

---

### Permission Rules

SLA Monitoring merupakan modul monitoring yang digunakan untuk menampilkan informasi SLA seluruh Engineering Document.

Seluruh Official Role melihat informasi SLA yang sama sebagai dasar monitoring dan koordinasi pekerjaan.

Hak akses pada modul ini hanya mengatur kemampuan pengguna untuk mengakses fitur monitoring dan **tidak membatasi visibilitas informasi SLA**.

Meskipun seluruh Role memiliki hak untuk mengakses halaman SLA Monitoring, ketersediaan Action pada kolom **Actions** tetap mengikuti Business Workflow dan Access Control yang berlaku.

Sistem wajib menentukan Action yang ditampilkan berdasarkan kombinasi:

- Role pengguna.
- Workflow Status.
- Document Revision.
- Business Workflow.
- Access Control.

Dengan demikian, seluruh pengguna dapat melihat Engineering Document yang sama, namun Action yang tersedia dapat berbeda sesuai kondisi Engineering Document dan hak akses masing-masing Role.

SLA Monitoring **tidak menyediakan** fungsi untuk:

- Mengubah Engineering Document.
- Mengubah Workflow Status.
- Mengubah SLA Status.
- Mengubah SLA Timer.

Seluruh perubahan terhadap Engineering Document maupun Business Workflow dilakukan melalui modul yang sesuai sebagaimana didefinisikan pada:

- BUSINESS-WORKFLOW.md
- PART 5 — Document Register Module
- ACCESS-CONTROL.md

---

### Cross Reference

Bagian ini mengacu pada:

- BUSINESS-WORKFLOW.md
- ACCESS-CONTROL.md
- PART 3 — Authentication
- PART 5 — Document Register Module

# ==============================================================================
# PART 6 — SLA Monitoring
# 6.8 Error Handling
# ==============================================================================

## 6.8 Error Handling

SLA Monitoring harus mampu menangani kondisi kegagalan sistem maupun data secara konsisten agar pengguna tetap memperoleh informasi yang jelas mengenai kondisi aplikasi.

Error Handling pada modul ini hanya mempengaruhi proses penampilan informasi dan **tidak mengubah Engineering Document, Business Workflow, maupun SLA Status**.

---

### Error Handling Rules

Sistem harus menangani kondisi berikut:

| Scenario | System Behaviour |
|----------|------------------|
| Gagal memuat data SLA Monitoring | Menampilkan pesan kesalahan dan menyediakan aksi Retry. |
| Data SLA Monitoring kosong | Menampilkan Empty State tanpa dianggap sebagai kesalahan sistem. |
| Hasil Search atau Filter tidak ditemukan | Menampilkan Empty State yang menjelaskan bahwa tidak ada Engineering Document yang sesuai dengan kriteria pencarian. |
| Terjadi kegagalan komunikasi dengan server | Menampilkan pesan kesalahan dan menyediakan aksi Retry tanpa mengubah data yang sedang tersimpan. |
| Active Project tidak tersedia | Sistem menampilkan **Project Selection Required State** dan tidak memuat data SLA Monitoring. |
| Project Membership tidak valid | Sistem menolak akses terhadap SLA Monitoring dan menampilkan **Access Denied**. |
| User mencoba mengakses Document dari Project lain | Sistem menolak request dan tidak menampilkan data SLA Monitoring. |

---

### Recovery Behaviour

Apabila proses pengambilan data berhasil setelah Retry dilakukan, sistem harus:

- Memuat kembali Summary Area (SLA Overview).
- Memuat kembali SLA Monitoring Table.
- Mempertahankan Search dan Filter yang masih aktif apabila memungkinkan.

---

### Acceptance Criteria

| AC ID | Acceptance Criteria |
|--------|---------------------|
| AC-ERR-001 | Sistem menampilkan pesan kesalahan apabila data SLA Monitoring gagal dimuat. |
| AC-ERR-002 | Sistem menyediakan aksi Retry untuk proses pengambilan data yang gagal. |
| AC-ERR-003 | Empty State ditampilkan apabila tidak terdapat Engineering Document atau hasil Search maupun Filter tidak ditemukan. |
| AC-ERR-004 | Error Handling tidak mengubah Engineering Document, Business Workflow, maupun SLA Status. |
| AC-ERR-005 | Setelah Retry berhasil, Summary Area dan SLA Monitoring Table dimuat kembali secara konsisten. |
| AC-ERR-006 | SLA Monitoring hanya dapat ditampilkan apabila Active Project dan Project Membership pengguna valid. |

---

### Cross Reference

Bagian ini mengacu pada:

- PART 6.4 — Summary Area (SLA Overview)
- PART 6.5 — SLA Monitoring Table
- PART 6.6 — Filtering & Search

# ==============================================================================
# PART 6 — SLA Monitoring
# 6.9 Cross Reference
# ==============================================================================

## 6.9 Cross Reference

PART 6 — SLA Monitoring dibangun berdasarkan Business Workflow, Architecture, Access Control, dan Product Definition yang telah didefinisikan pada dokumen maupun PART berikut.

| Reference | Purpose |
|-----------|---------|
| BUSINESS-WORKFLOW.md | Menjadi Source of Truth untuk Business Workflow, Workflow Status, Workflow Transition, SLA Timer Behaviour, dan Workflow Responsibility. |
| PART 2 — Product Overview → 2.5 Application Layout Architecture | Menjadi Source of Truth untuk struktur Main Content Area dan Application Layout. |
| PART 3 — Authentication | Menjadi Source of Truth untuk Authentication, User Identity, Session Management, dan Login Behaviour. |
| PART 4 — Dashboard | Menjadi Source of Truth untuk Dashboard Architecture dan Dashboard Summary Area. |
| PART 5 — Document Register Module | Menjadi Source of Truth untuk Engineering Document, Revision Lifecycle, Workflow Status, Current Assignee, serta Business Workflow yang berkaitan dengan Document Register. |
| ACCESS-CONTROL.md | Menjadi Source of Truth untuk Role Permission dan Action Visibility. |

---

### Dependency Summary

PART 6 menggunakan informasi yang berasal dari beberapa Source of Truth dan tidak mendefinisikan ulang domain yang telah dimiliki oleh dokumen lain.

Sebaliknya, PART 6 menjadi **Single Source of Truth** untuk domain berikut:

- SLA Status
- SLA Status Calculation Rules
- Summary Area (SLA Overview)
- SLA Monitoring
- SLA Monitoring Table
- SLA Monitoring Filtering & Search

Seluruh modul lain yang menggunakan informasi SLA wajib mengacu pada PART 6 dan tidak diperbolehkan membuat definisi SLA secara terpisah.

---

### Implementation Note

Apabila terdapat perubahan terhadap Business Workflow yang mempengaruhi:

- SLA Timer Behaviour
- Workflow Status
- Workflow Transition
- Workflow Responsibility

maka perubahan tersebut harus dilakukan terlebih dahulu pada **BUSINESS-WORKFLOW.md**, kemudian diikuti dengan penyesuaian pada PART 6 apabila diperlukan.

PART 6 tidak diperbolehkan mengubah ataupun mendefinisikan ulang Business Workflow.

Sebaliknya, apabila terdapat perubahan terhadap:

- SLA Status
- SLA Status Calculation Rules
- Summary Area (SLA Overview)
- SLA Monitoring Behaviour

maka perubahan dilakukan pada PART 6 sebagai **Single Source of Truth**.

---

## PART 6 Completion

Dengan selesainya PART 6, spesifikasi berikut telah didefinisikan secara lengkap:

- SLA Monitoring Overview
- SLA Monitoring Objectives
- Dashboard Layout
- Summary Area (SLA Overview)
- SLA Status Domain
- SLA Status Calculation Rules
- SLA Monitoring Table
- Filtering & Search
- Permission Matrix
- Error Handling

PART 6 dinyatakan **Complete** dan menjadi **Single Source of Truth** untuk seluruh spesifikasi SLA Monitoring pada Engineering Document Management System (EDMS).

# ==============================================================================
# PART 7 — AUDIT TRAIL
# 7.1 Overview
# ==============================================================================

## 7.1 Overview

Audit Trail merupakan modul yang digunakan untuk mencatat seluruh aktivitas penting (Significant Activity) yang terjadi di dalam Engineering Document Management System (EDMS).

Audit Trail menyediakan catatan historis yang bersifat kronologis sehingga setiap aktivitas pengguna maupun sistem dapat ditelusuri kembali untuk kebutuhan monitoring, audit, investigasi, dan compliance.

Audit Trail hanya berfungsi sebagai **Activity History** dan tidak mempengaruhi Business Workflow maupun Business Logic yang berjalan pada sistem.

Setiap aktivitas penting yang terjadi pada sistem wajib menghasilkan tepat satu Audit Trail Record sesuai prinsip:

> **One Significant Activity = One Audit Trail Record**

Audit Trail bersifat **immutable**, sehingga data yang telah tercatat tidak boleh diubah maupun dihapus oleh pengguna aplikasi.

Modul ini mencatat aktivitas yang berasal dari berbagai domain sistem, termasuk namun tidak terbatas pada:

- Workflow Activity
- Document Activity
- User Activity
- Administration Activity
- System Activity

Seluruh aktivitas dicatat secara kronologis berdasarkan waktu terjadinya aktivitas sehingga membentuk riwayat aktivitas sistem yang lengkap dan dapat ditelusuri.

---

### Architecture Principle

Audit Trail merupakan **Activity History Domain**.

Audit Trail **bukan** merupakan Business Workflow maupun Notification System.

Setiap Workflow Event dapat menghasilkan Audit Trail Record.

Namun Audit Trail hanya berfungsi mencatat aktivitas dan tidak menentukan Business Workflow maupun Notification Behaviour.

---

### Source of Truth

Definisi Business Workflow yang menghasilkan aktivitas mengacu pada:

- BUSINESS-WORKFLOW.md

Hak akses pengguna mengacu pada:

- ACCESS-CONTROL.md
- PART 3 — Authentication

Sedangkan definisi Audit Trail sebagai Activity History didefinisikan pada PART ini sebagai **Single Source of Truth**.

# ==============================================================================
# PART 7 — AUDIT TRAIL
# 7.2 Objectives
# ==============================================================================

## 7.2 Objectives

Audit Trail dirancang untuk menyediakan riwayat aktivitas sistem yang akurat, lengkap, dan dapat ditelusuri kembali sehingga seluruh aktivitas penting dalam Engineering Document Management System (EDMS) dapat dipantau secara transparan.

Modul ini memiliki tujuan sebagai berikut:

- Menyediakan catatan historis seluruh aktivitas penting yang terjadi di dalam sistem.
- Mendukung kebutuhan audit, investigasi, dan compliance melalui pencatatan aktivitas yang kronologis.
- Mempermudah penelusuran perubahan maupun aktivitas yang dilakukan oleh pengguna terhadap Engineering Document.
- Menyediakan informasi aktivitas sebagai referensi monitoring dan analisis operasional.
- Menjaga integritas riwayat aktivitas melalui prinsip **immutable record**, sehingga setiap Audit Trail Record tidak dapat diubah maupun dihapus.

Audit Trail tidak digunakan untuk menjalankan Business Workflow maupun menentukan keputusan bisnis.

Seluruh aktivitas yang dicatat pada Audit Trail hanya berfungsi sebagai **historical record** dari aktivitas yang telah terjadi.

---

### Design Objectives

PART 7 dikembangkan berdasarkan prinsip berikut:

- **Complete** — Seluruh aktivitas penting harus tercatat.
- **Chronological** — Aktivitas ditampilkan berdasarkan urutan waktu kejadian.
- **Consistent** — Format pencatatan aktivitas menggunakan standar yang sama di seluruh sistem.
- **Traceable** — Setiap aktivitas dapat ditelusuri kembali berdasarkan waktu, pengguna, dokumen, maupun jenis aktivitas.
- **Immutable** — Audit Trail Record tidak dapat diubah maupun dihapus setelah berhasil dicatat.

---

### Architecture Note

Audit Trail merupakan modul **read-only** yang digunakan sebagai sumber informasi historis aktivitas sistem.

Audit Trail tidak melakukan perubahan terhadap Engineering Document, Business Workflow, maupun SLA Status.

Seluruh aktivitas yang dicatat berasal dari modul lain yang menghasilkan **Significant Activity** sesuai ketentuan pada PART ini.

# ==============================================================================
# PART 7 — AUDIT TRAIL
# 7.3 Screen Layout
# ==============================================================================

## 7.3 Screen Layout

Halaman Audit Trail menggunakan **Application Layout Architecture** sebagaimana didefinisikan pada **PART 2 — Product Overview → 2.5 Application Layout Architecture**.

PART ini hanya mendefinisikan layout pada **Main Content Area**.

Seluruh elemen di luar Main Content Area, termasuk Navigation Sidebar, Top Navigation Bar, Footer, dan struktur halaman aplikasi mengikuti spesifikasi yang telah didefinisikan pada PART 2.

---

### Main Content Area Layout

Main Content Area halaman Audit Trail terdiri dari tiga area utama yang disusun secara vertikal.

```text
┌─────────────────────────────────────────────────────────────┐
│                     Page Header                            │
│                  Audit Trail                               │
├─────────────────────────────────────────────────────────────┤
│                 Filter & Search Area                       │
├─────────────────────────────────────────────────────────────┤
│                 Audit Trail Table                          │
└─────────────────────────────────────────────────────────────┘
```

---

### Layout Sections

#### A. Page Header

Page Header menampilkan identitas halaman Audit Trail.

Bagian ini dapat berisi:

- Page Title
- Page Description (opsional)

---

#### B. Filter & Search Area

Filter & Search Area digunakan untuk membantu pengguna menemukan Audit Trail Record berdasarkan kriteria tertentu.

Filter Area merupakan area kerja pengguna (Working Area) dan hanya mempengaruhi data yang ditampilkan pada Audit Trail Table.

---

#### C. Audit Trail Table

Audit Trail Table merupakan area utama yang menampilkan daftar Audit Trail Record secara kronologis.

Tabel ini menggunakan struktur kolom yang didefinisikan pada **PART 7.5 — Audit Trail Table**.

---

### Responsive Behaviour

Layout harus mampu beradaptasi terhadap berbagai ukuran layar tanpa mengubah struktur informasi.

Pada layar dengan ukuran lebih kecil, sistem dapat menerapkan horizontal scrolling pada Audit Trail Table apabila seluruh kolom tidak dapat ditampilkan secara bersamaan.

---

### Design Principles

Layout Audit Trail dikembangkan berdasarkan prinsip berikut:

- Simple
- Readable
- Consistent
- Information-Oriented

Layout difokuskan untuk mempermudah pengguna melakukan pencarian dan penelusuran aktivitas sistem.

---

### Cross Reference

Bagian ini mengacu pada:

- PART 2 — Product Overview → 2.5 Application Layout Architecture
- PART 7.5 — Audit Trail Table
- PART 7.7 — Filtering & Search

# ==============================================================================
# PART 7 — AUDIT TRAIL
# 7.4 Audit Trail Domain
# ==============================================================================

## 7.4 Audit Trail Domain

Audit Trail Domain merupakan domain yang bertanggung jawab untuk mencatat seluruh **Significant Activity** yang terjadi di dalam Engineering Document Management System (EDMS).

Setiap Significant Activity wajib menghasilkan tepat satu **Audit Trail Record** yang disimpan secara kronologis sebagai bagian dari riwayat aktivitas sistem.

Audit Trail Record bersifat **immutable** sehingga tidak dapat diubah maupun dihapus setelah berhasil dicatat.

---

### Audit Trail Record

Setiap Audit Trail Record minimal terdiri dari informasi berikut:

- Time
- User
- Role
- Action
- Document Number
- Detail

Seluruh informasi tersebut ditampilkan pada Audit Trail Table sebagaimana didefinisikan pada **PART 7.5 — Audit Trail Table**.

---

### Significant Activity

Significant Activity merupakan aktivitas yang dianggap penting untuk dicatat sebagai bagian dari riwayat sistem.

Seluruh Significant Activity wajib menggunakan nama Action yang telah distandarkan pada **PART 7.6 — Activity Dictionary**.

Activity yang menghasilkan Audit Trail Record meliputi, namun tidak terbatas pada:

#### Authentication

- Login
- Logout
- Reset Password

#### Document Register

- Create Document
- Edit Document
- Upload Revision
- Download Document
- View Document
- View Document History

#### Document Review

- Approval A
- Approval B
- Approval C
- Workflow Status Change

#### User Management

- Create User
- Update User
- Activate User
- Deactivate User
- Reset User Password

#### Role Management

- Create Role
- Update Role
- Delete Role
- Assign Permission
- Remove Permission

#### User Profile

- Update Profile
- Change Password

#### Notification

- Notification Sent
- Notification Read

#### Escalation Alert

- Escalation Triggered
- Escalation Resolved

Activity lain hanya boleh dicatat apabila telah memiliki definisi resmi pada PART 7.6 — Activity Dictionary.

---

### Audit Trail Principles

Audit Trail Domain dikembangkan berdasarkan prinsip berikut:

- **One Significant Activity = One Audit Trail Record**
- **Chronological Recording**
- **Immutable Record**
- **Standardized Activity Naming**
- **System-wide Activity History**

---

### Project Context

Setiap Audit Trail Record yang berkaitan dengan aktivitas Project wajib memiliki Project Context.

Minimal Project Context terdiri dari:

- Project ID.
- Project Name.
- Actor User ID.
- Actor Project Membership ID, apabila tersedia.
- Actor Official Role pada Project.

Audit Trail untuk data operasional hanya ditampilkan berdasarkan Active Project.

Aktivitas System-Level yang tidak berkaitan dengan Project dapat menggunakan Resource Type `System` dan tidak wajib memiliki Project ID.

---

### Scope of Audit Logging

Audit Trail hanya mencatat aktivitas yang memiliki dampak terhadap keamanan, konfigurasi sistem, perubahan data bisnis, atau perpindahan Workflow.

Aktivitas yang bersifat navigasi antarmuka (UI Navigation) tidak dicatat sebagai Audit Trail kecuali telah didefinisikan sebagai Significant Activity pada PART 7.6.

Seluruh Product Module wajib menggunakan Activity Dictionary sebagai satu-satunya acuan penamaan Action.

Tidak diperbolehkan membuat Action baru di luar Activity Dictionary tanpa melakukan revisi terhadap PART 7.6.

---

### Architecture Note

Audit Trail hanya mencatat aktivitas yang telah terjadi.

Audit Trail tidak menentukan Business Workflow, tidak menjalankan Business Logic, dan tidak mengubah Engineering Document.

Seluruh Workflow Event yang menghasilkan Audit Trail mengacu pada **BUSINESS-WORKFLOW.md**.

Standarisasi nama aktivitas (Action) didefinisikan pada **PART 7.6 — Activity Dictionary** sebagai Single Source of Truth.

# ==============================================================================
# PART 7 — AUDIT TRAIL
# 7.5 Audit Trail Table
# ==============================================================================

## 7.5 Audit Trail Table

Audit Trail Table merupakan area utama pada halaman **Audit Trail** yang digunakan untuk menampilkan daftar Audit Trail Record secara kronologis.

Tabel ini berfungsi sebagai **historical activity log** yang memungkinkan pengguna menelusuri seluruh Significant Activity yang terjadi pada Engineering Document Management System (EDMS).

Seluruh data yang ditampilkan pada tabel berasal dari Audit Trail Domain sebagaimana didefinisikan pada **PART 7.4 — Audit Trail Domain**.

---

### Layout

Audit Trail Table berada di bawah **Filter & Search Area** dan menggunakan **Main Content Area Layout** sebagaimana didefinisikan pada **PART 2 — Product Overview → 2.5 Application Layout Architecture**.

Tabel harus mendukung:

- Vertical Scrolling
- Responsive Layout
- Empty State
- Loading State

---

### Column Definition

| No | Column | Description |
|----|--------|-------------|
| 1 | No | Nomor urut Audit Trail Record. |
| 2 | Time | Waktu terjadinya aktivitas sistem. |
| 3 | User | Nama User Account yang melakukan aktivitas. |
| 4 | Official Role | Official Role User pada saat aktivitas terjadi. |
| 5 | Department | Department User pada saat aktivitas terjadi. |
| 6 | Action | Jenis aktivitas sesuai Activity Dictionary. |
| 7 | Resource Type | Jenis Resource yang berkaitan dengan aktivitas, misalnya Document, User, Department, Notification, atau Escalation. |
| 8 | Reference | Nomor referensi apabila tersedia, misalnya Document Number. |
| 9 | Detail | Deskripsi singkat hasil aktivitas sesuai Activity Dictionary. |

---

### Behaviour

Audit Trail Table harus memenuhi perilaku berikut:

- Menampilkan Audit Trail Record berdasarkan urutan waktu (aktivitas terbaru ditampilkan terlebih dahulu).
- Seluruh Audit Trail Record bersifat **read-only**.
- Audit Trail Record tidak dapat diubah maupun dihapus melalui halaman Audit Trail.
- Kolom **Action** menggunakan nilai yang telah distandarkan pada **PART 7.6 — Activity Dictionary**.
- Kolom **Detail** menampilkan ringkasan hasil aktivitas dan **tidak menampilkan isi komentar, perubahan data secara rinci, maupun informasi panjang lainnya**.
- Seluruh informasi yang ditampilkan merupakan hasil pencatatan aktivitas sistem dan tidak dapat dimodifikasi oleh pengguna.
- Audit Trail Table hanya menampilkan Audit Trail Record milik **Active Project**.
- Kolom **Project** tidak wajib ditampilkan karena halaman Audit Trail selalu berada dalam satu **Active Project**.
- Project ID tetap wajib disimpan pada setiap Audit Trail Record sebagai bagian dari **Project Data Isolation**.

---

### Resource Type Behaviour

Audit Trail Table menggunakan struktur generik sehingga dapat digunakan oleh seluruh modul pada sistem.

Kolom **Reference** bersifat opsional.

Contoh:

- Document → menggunakan Document Number sebagai Reference.
- User → tidak memiliki Document Number.
- Department → tidak memiliki Document Number.
- Notification → tidak memiliki Document Number.
- Escalation → dapat menggunakan Document Number apabila tersedia.

Audit Trail Table tidak boleh bergantung pada satu jenis Resource tertentu.

---

### Acceptance Criteria

| AC ID | Acceptance Criteria |
|--------|---------------------|
| AC-AUD-001 | Tabel menampilkan seluruh kolom yang telah didefinisikan pada bagian Column Definition sesuai Resource Type yang berkaitan dengan aktivitas.|
| AC-AUD-002 | Audit Trail Record ditampilkan berdasarkan urutan waktu terbaru (descending). |
| AC-AUD-003 | Seluruh Audit Trail Record bersifat read-only. |
| AC-AUD-004 | Pengguna tidak dapat mengubah maupun menghapus Audit Trail Record. |
| AC-AUD-005 | Kolom Action menggunakan nilai yang telah didefinisikan pada PART 7.6 — Activity Dictionary. |
| AC-AUD-006 | Kolom Detail hanya menampilkan ringkasan hasil aktivitas dan tidak menampilkan komentar maupun data panjang lainnya. |
| AC-AUD-007 | Empty State ditampilkan apabila belum terdapat Audit Trail Record. |
| AC-AUD-008 | Loading State ditampilkan selama proses pengambilan data berlangsung. |

---

### Cross Reference

Bagian ini mengacu pada:

- PART 2 — Product Overview → 2.5 Application Layout Architecture
- PART 7.4 — Audit Trail Domain
- PART 7.6 — Activity Dictionary

# ==============================================================================
# PART 7 — AUDIT TRAIL
# 7.6 Activity Dictionary
# ==============================================================================

## 7.6 Activity Dictionary

Activity Dictionary merupakan **Single Source of Truth** yang mendefinisikan standar **Action**, **Business Event**, dan **Detail** yang digunakan oleh seluruh Audit Trail Record pada Engineering Document Management System (EDMS).

Seluruh modul pada sistem wajib menggunakan Activity Dictionary ini dan tidak diperbolehkan membuat variasi penamaan Action maupun Detail di luar standar yang telah ditentukan pada PART ini.

---

### Activity Dictionary

| Action | Business Event | Detail |
|---------|----------------|--------|
| Login | User Login Success | User logged in. |
| Logout | User Logout Success | User logged out. |
| Change Password | User Password Changed | User password changed. |
| Edit Profile | User Profile Updated | User profile updated. |
| Upload Document | Document Uploaded | Document uploaded. |
| Edit Document | Document Updated | Document updated. |
| Download Document | Document Downloaded | Document downloaded. |
| Upload Revision | Revision Uploaded | Revision uploaded. |
| Approval A | Approval A Completed | Approval A completed. |
| Approval B | Approval B Completed | Approval B completed with comment. |
| Approval C | Approval C Completed | Approval C completed. |
| Workflow Status Change | Workflow Status Updated | Workflow status updated. |
| Workflow Attachment | Workflow Attachment Uploaded | Workflow attachment uploaded. |
| Document Approved | Document Approved | Document reached Approved status. |
| Create User | User Created | User account created. |
| Update User | User Updated | User account updated. |
| Activate User | User Activated | User account activated. |
| Deactivate User | User Deactivated | User account deactivated. |
| Create Department | Department Created | Department created. |
| Update Department | Department Updated | Department updated. |
| Activate Department | Department Activated | Department activated. |
| Deactivate Department | Department Deactivated | Department deactivated. |
| Notification Created | Notification Created | Personal notification created. |
| Notification Read | Notification Read | Notification marked as read. |
| Escalation Created | Escalation Created | Document entered Escalation Alert. |
| Escalation Resolved | Escalation Resolved | Document left Escalation Alert. |

---

### Activity Scope Rules

Activity Dictionary hanya memuat Significant Activity yang telah disetujui sebagai bagian dari Audit Trail.

Ketentuan pencatatan aktivitas adalah sebagai berikut:

- Aktivitas hanya dicatat setelah proses utama berhasil.
- Aktivitas yang gagal tidak boleh dicatat sebagai aktivitas sukses.
- Satu Significant Activity menghasilkan tepat satu Audit Trail Record.
- Perubahan Workflow Status yang menjadi bagian dari Approval A, Approval B, Approval C, atau Upload Revision tidak boleh menghasilkan duplicate Audit Trail Record untuk kejadian yang sama.
- Workflow Attachment dicatat apabila proses upload Attachment berhasil.
- Notification Created dicatat satu kali untuk setiap Personal Notification Record yang berhasil dibuat.
- Notification Read dicatat ketika penerima Notification mengubah status Notification menjadi Read.
- Escalation Created dicatat hanya saat Document pertama kali masuk kondisi Overdue.
- Evaluasi SLA berulang tidak boleh menghasilkan duplicate Escalation Created.
- Escalation Resolved dicatat saat Document keluar dari daftar Escalation karena kondisi penyelesaiannya terpenuhi.
- User dan Department tidak dihapus secara fisik melalui lifecycle normal; perubahan lifecycle menggunakan Activate dan Deactivate.
- Activity yang belum tercantum pada Activity Dictionary tidak boleh dicatat sebelum PART 7.6 diperbarui.

---

### Standard Naming Rules

Seluruh Audit Trail Record wajib mengikuti ketentuan berikut:

- Kolom **Action** wajib menggunakan nilai yang telah didefinisikan pada **Activity Dictionary**.
- Kolom **Business Event** wajib menggunakan Business Event yang sesuai dengan Activity Dictionary.
- Kolom **Detail** wajib menggunakan deskripsi standar yang telah ditentukan pada Activity Dictionary.
- Sistem tidak diperbolehkan membuat variasi nama **Action**, **Business Event**, maupun **Detail** di luar Activity Dictionary.
- Satu Significant Activity hanya menghasilkan satu Audit Trail Record.
- Audit Trail Record hanya dibuat setelah proses utama berhasil diselesaikan.
- Aktivitas yang gagal tidak boleh menghasilkan Audit Trail Record dengan status berhasil.
- Audit Trail Record bersifat permanen dan tidak dapat diubah maupun dihapus melalui aplikasi.
- Seluruh proses pencatatan Audit Trail dilakukan secara otomatis oleh sistem.
- Seluruh modul wajib menggunakan Activity Dictionary sebagai satu-satunya standar penamaan Audit Trail.

Apabila diperlukan Activity baru, Activity tersebut wajib ditambahkan terlebih dahulu pada **PART 7.6 — Activity Dictionary** sebelum dapat digunakan oleh modul lain.

---

### Document Number Rules

Apabila aktivitas berkaitan dengan Engineering Document, sistem wajib mengisi kolom **Document Number**.

Apabila aktivitas tidak berkaitan dengan Engineering Document, kolom **Document Number** ditampilkan sebagai:

```text
-
```

---

### Future Extension

Activity Dictionary dapat diperluas apabila terdapat Significant Activity baru pada modul lain.

Setiap penambahan Activity baru wajib ditambahkan pada PART ini sehingga seluruh sistem tetap menggunakan standar Action, Business Event, dan Detail yang konsisten.

---

### Architecture Note

Activity Dictionary merupakan **Single Source of Truth** untuk:

- Action
- Business Event
- Detail

Seluruh modul yang menghasilkan Audit Trail wajib mengacu pada Activity Dictionary dan tidak diperbolehkan menggunakan penamaan yang berbeda.

# ==============================================================================
# PART 7 — AUDIT TRAIL
# 7.7 Filtering & Search
# ==============================================================================

## 7.7 Filtering & Search

Filtering & Search digunakan untuk membantu pengguna menemukan Audit Trail Record berdasarkan aktivitas, pengguna, maupun Engineering Document secara cepat.

Seluruh proses Filtering & Search hanya mempengaruhi data yang ditampilkan pada **Audit Trail Table** dan tidak mengubah Audit Trail Record maupun data pada modul lainnya.

---

### Search

Sistem harus menyediakan fasilitas pencarian Audit Trail Record menggunakan kata kunci.

Pencarian dilakukan secara real-time terhadap data yang ditampilkan pada Audit Trail Table.

Minimal data yang dapat dicari meliputi:

- User
- Official Role
- Department
- Action
- Resource Type
- Reference
- Detail

Search hanya mempengaruhi data yang ditampilkan pada Audit Trail Table dan tidak mengubah Audit Trail Record.

---

### Filter

Audit Trail menyediakan Filter Area yang memungkinkan pengguna memfilter Audit Trail Record berdasarkan:

- Time Period
- User
- Official Role
- Department
- Action
- Resource Type

Seluruh Filter dapat digunakan secara bersamaan (Combined Filtering).

---

### Behaviour

Filtering & Search harus memenuhi perilaku berikut:

- Search dan Filter dapat digunakan secara bersamaan.
- Perubahan Search maupun Filter langsung memperbarui data pada Audit Trail Table.
- Reset Filter mengembalikan seluruh Search dan Filter ke kondisi default.
- Filtering & Search hanya mempengaruhi data yang ditampilkan pada Audit Trail Table.
- Audit Trail Record tidak mengalami perubahan akibat Search maupun Filter yang diterapkan.
- Search dan Filter hanya diterapkan terhadap Audit Trail Record milik **Active Project**.
- Perubahan **Active Project** mengembalikan Search, Filter, Sort, dan Pagination ke kondisi default sebelum memuat Audit Trail Record Project yang baru.

---

### Acceptance Criteria

| AC ID | Acceptance Criteria |
|--------|---------------------|
| AC-AUD-FLT-001 | Pengguna dapat mencari Audit Trail Record menggunakan Search Box. |
| AC-AUD-FLT-002 | Pengguna dapat memfilter Audit Trail Record berdasarkan Time Period. |
| AC-AUD-FLT-003 | Pengguna dapat memfilter Audit Trail Record berdasarkan User. |
| AC-AUD-FLT-004 | Pengguna dapat memfilter Audit Trail Record berdasarkan Official Role. |
| AC-AUD-FLT-005 | Pengguna dapat memfilter Audit Trail Record berdasarkan Department. |
| AC-AUD-FLT-006 | Pengguna dapat memfilter Audit Trail Record berdasarkan Action. |
| AC-AUD-FLT-007 | Pengguna dapat memfilter Audit Trail Record berdasarkan Resource Type. |
| AC-AUD-FLT-008 | Search dan Filter dapat digunakan secara bersamaan. |
| AC-AUD-FLT-009 | Reset Filter mengembalikan seluruh Search dan Filter ke kondisi default. |
| AC-AUD-FLT-010 | Search dan Filter hanya bekerja pada Audit Trail Record milik Active Project. |
| AC-AUD-FLT-011 | Perubahan Active Project mengembalikan Search, Filter, Sort, dan Pagination ke kondisi default sebelum memuat data Project yang baru. |

---

### Cross Reference

Bagian ini mengacu pada:

- PART 7.5 — Audit Trail Table
- PART 7.6 — Activity Dictionary

# ==============================================================================
# PART 7 — AUDIT TRAIL
# 7.8 Permission Matrix
# ==============================================================================

## 7.8 Permission Matrix

Audit Trail merupakan modul **read-only** yang digunakan untuk menampilkan riwayat aktivitas sistem.

Seluruh Official Role memiliki hak untuk mengakses halaman Audit Trail sebagai sarana monitoring, penelusuran aktivitas, dan kebutuhan audit.

---

### Permission Matrix

| Feature | Admin | Document Owner | Team Process | Team Project |
|---------|:-----:|:--------------:|:------------:|:------------:|
| View Audit Trail Page | ✓ | ✓ | ✓ | ✓ |
| View Audit Trail Table | ✓ | ✓ | ✓ | ✓ |
| Search Audit Trail | ✓ | ✓ | ✓ | ✓ |
| Filter Audit Trail | ✓ | ✓ | ✓ | ✓ |

---

### Permission Rules

Audit Trail merupakan modul yang digunakan untuk menampilkan riwayat aktivitas sistem.

Seluruh Official Role dapat melihat Audit Trail Record yang sama sebagai bagian dari aktivitas sistem.

Audit Trail tidak menyediakan fungsi untuk:

- Menambah Audit Trail Record.
- Mengubah Audit Trail Record.
- Menghapus Audit Trail Record.

Seluruh Audit Trail Record dibuat secara otomatis oleh sistem berdasarkan Business Event yang terjadi.

Pengguna aplikasi tidak diperbolehkan membuat Audit Trail Record secara manual.

---

### Architecture Note

Audit Trail merupakan modul monitoring yang bersifat **read-only**.

Hak akses pada modul ini hanya mengatur kemampuan pengguna untuk mengakses informasi Audit Trail dan tidak mempengaruhi proses pencatatan Audit Trail Record.

Seluruh proses pencatatan Audit Trail dilakukan secara otomatis oleh sistem sesuai Activity Dictionary yang didefinisikan pada **PART 7.6 — Activity Dictionary**.

---

### Cross Reference

Bagian ini mengacu pada:

- PART 3 — Authentication
- ACCESS-CONTROL.md
- PART 7.4 — Audit Trail Domain
- PART 7.6 — Activity Dictionary

# ==============================================================================
# PART 7 — AUDIT TRAIL
# 7.9 Cross Reference
# ==============================================================================

## 7.9 Cross Reference

PART 7 — Audit Trail dibangun berdasarkan Business Workflow, Authentication, Access Control, dan Product Definition yang telah didefinisikan pada dokumen maupun PART berikut.

| Reference | Purpose |
|-----------|---------|
| BUSINESS-WORKFLOW.md | Menjadi Source of Truth untuk Business Workflow, Workflow Event, Workflow Status, Workflow Transition, dan aktivitas yang menghasilkan Audit Trail Record. |
| PART 2 — Product Overview → 2.5 Application Layout Architecture | Menjadi Source of Truth untuk Application Layout Architecture dan Main Content Area Layout. |
| PART 3 — Authentication | Menjadi Source of Truth untuk Authentication, User Identity, Session Management, dan Login Behaviour. |
| PART 5 — Document Register Module | Menjadi Source of Truth untuk seluruh aktivitas Engineering Document yang menghasilkan Audit Trail Record. |
| ACCESS-CONTROL.md | Menjadi Source of Truth untuk Official Role dan Access Control. |

---

### Dependency Summary

PART 7 menggunakan Business Event yang berasal dari berbagai modul dalam sistem dan tidak mendefinisikan ulang Business Workflow maupun Business Logic yang telah dimiliki oleh dokumen lain.

Sebaliknya, PART 7 menjadi **Single Source of Truth** untuk domain berikut:

- Audit Trail
- Audit Trail Record
- Activity Dictionary
- Audit Trail Table
- Audit Trail Filtering & Search

Seluruh modul yang menghasilkan Audit Trail wajib mengacu pada PART ini.

---

### Implementation Note

Apabila terdapat perubahan terhadap Business Workflow maupun Business Event yang menghasilkan Audit Trail Record, maka perubahan tersebut harus dilakukan terlebih dahulu pada Source of Truth yang bersangkutan, kemudian diikuti dengan penyesuaian pada PART 7 apabila diperlukan.

PART 7 tidak diperbolehkan mengubah maupun mendefinisikan ulang:

- Business Workflow
- Authentication
- Access Control
- Document Lifecycle

Sebaliknya, perubahan terhadap:

- Activity Dictionary
- Audit Trail Record
- Audit Trail Behaviour
- Audit Trail Table

harus dilakukan pada PART 7 sebagai **Single Source of Truth**.

---

## PART 7 Completion

Dengan selesainya PART 7, spesifikasi berikut telah didefinisikan secara lengkap:

- Audit Trail Overview
- Audit Trail Objectives
- Audit Trail Screen Layout
- Audit Trail Domain
- Audit Trail Table
- Activity Dictionary
- Filtering & Search
- Permission Matrix

PART 7 dinyatakan **Complete** dan menjadi **Single Source of Truth** untuk seluruh spesifikasi Audit Trail pada Engineering Document Management System (EDMS).

# ==============================================================================
# PART 8 — NOTIFICATION
# 8.1 Overview
# ==============================================================================

## 8.1 Overview

Notification merupakan modul yang digunakan untuk menyampaikan informasi yang memerlukan perhatian maupun tindakan dari pengguna berdasarkan Business Event yang terjadi di dalam Engineering Document Management System (EDMS).

Notification hanya dibuat apabila suatu Business Event menghasilkan **Need Action** bagi pengguna tertentu.

Modul ini menggunakan pendekatan **Personal Notification**, sehingga setiap Notification hanya dikirim kepada pengguna yang menjadi **Current Assignee** atau penerima yang ditentukan oleh Business Workflow.

Notification tidak digunakan sebagai riwayat aktivitas sistem maupun media komunikasi proyek.

Riwayat aktivitas sistem didefinisikan pada **PART 7 — Audit Trail**, sedangkan Notification hanya berfungsi sebagai pengingat dan penyampaian informasi yang memerlukan tindakan pengguna.

---

### Architecture Principle

Notification merupakan **Personal Action Communication Domain**.

Setiap Notification berasal dari Business Event yang terjadi pada sistem.

Namun, tidak setiap Business Event menghasilkan Notification.

Hanya Business Event yang memerlukan tindakan dari pengguna (**Need Action**) yang menghasilkan Notification.

Notification dikirim kepada penerima yang sesuai berdasarkan Business Workflow dan tidak bersifat global.

---

### Source of Truth

Definisi Business Workflow yang menghasilkan Business Event mengacu pada:

- BUSINESS-WORKFLOW.md

Penentuan Current Assignee mengacu pada:

- PART 5 — Document Register Module

Sedangkan definisi Notification sebagai **Personal Action Communication Domain** didefinisikan pada PART ini sebagai **Single Source of Truth**.

# ==============================================================================
# PART 8 — NOTIFICATION
# 8.2 Objectives
# ==============================================================================

## 8.2 Objectives

Notification dirancang untuk memastikan setiap pengguna memperoleh informasi yang memerlukan perhatian maupun tindakan secara tepat waktu berdasarkan Business Event yang terjadi pada Engineering Document Management System (EDMS).

Modul ini memiliki tujuan sebagai berikut:

- Menyampaikan informasi yang memerlukan tindakan kepada pengguna yang tepat.
- Membantu Current Assignee mengetahui pekerjaan yang harus segera dilakukan.
- Mengurangi keterlambatan proses Business Workflow akibat informasi yang terlewat.
- Mendukung kelancaran koordinasi antar pengguna melalui penyampaian informasi yang relevan.
- Menyediakan informasi yang mudah dipahami melalui pesan yang menggunakan bahasa yang sederhana dan berorientasi pada pengguna.

Notification tidak digunakan sebagai media penyimpanan riwayat aktivitas sistem.

Seluruh Notification hanya berfungsi sebagai **Personal Action Communication** yang membantu pengguna mengetahui tindakan berikutnya.

---

### Design Objectives

PART 8 dikembangkan berdasarkan prinsip berikut:

- **Personal** — Notification hanya ditujukan kepada pengguna yang menjadi penerima berdasarkan Business Workflow.
- **Action-Oriented** — Notification hanya dibuat apabila suatu Business Event menghasilkan Need Action.
- **Relevant** — Hanya informasi yang memerlukan perhatian pengguna yang dikirim sebagai Notification.
- **Human-Friendly** — Notification menggunakan judul dan pesan yang mudah dipahami oleh pengguna.
- **Timely** — Notification dikirim segera setelah Business Event yang memenuhi kriteria terjadi.

---

### Architecture Note

Notification merupakan modul komunikasi yang bersifat personal.

Notification tidak menentukan Business Workflow, tidak mengubah Engineering Document, dan tidak menggantikan fungsi Audit Trail.

Seluruh Notification dihasilkan berdasarkan Business Event yang memenuhi kriteria **Need Action** sebagaimana didefinisikan pada PART ini.

# ==============================================================================
# PART 8 — NOTIFICATION
# 8.3 Notification Layout
# ==============================================================================

## 8.3 Notification Layout

Notification menggunakan **Application Layout Architecture** sebagaimana didefinisikan pada **PART 2 — Product Overview → 2.5 Application Layout Architecture**.

PART ini hanya mendefinisikan layout pada area Notification yang berada di dalam **Main Content Area** maupun komponen Notification yang ditampilkan pada Application Header.

Seluruh elemen di luar Main Content Area, termasuk Navigation Sidebar, Top Navigation Bar, Footer, dan struktur halaman aplikasi mengikuti spesifikasi yang telah didefinisikan pada PART 2.

---

### Layout Components

Modul Notification terdiri dari dua komponen utama:

- Notification Bell
- Notification Panel

---

### Notification Bell

Notification Bell ditempatkan pada **Application Header** sebagai titik akses utama menuju Notification Panel.

Notification Bell menampilkan indikator apabila terdapat Notification yang belum dibaca (Unread Notification).

---

### Notification Panel

Notification Panel ditampilkan ketika pengguna berinteraksi dengan Notification Bell.

Panel ini menampilkan daftar Personal Notification milik pengguna yang sedang login.

Setiap Notification Item ditampilkan menggunakan struktur yang didefinisikan pada **PART 8.5 — Notification Panel**.

---

### Responsive Behaviour

Notification harus tetap dapat diakses pada berbagai ukuran layar tanpa mengubah struktur informasi.

Pada perangkat dengan ukuran layar yang lebih kecil, Notification Panel dapat menyesuaikan ukuran maupun posisi tampilannya agar tetap nyaman digunakan.

---

### Design Principles

Layout Notification dikembangkan berdasarkan prinsip berikut:

- Simple
- Consistent
- Accessible
- User-Focused

Layout difokuskan untuk membantu pengguna mengetahui informasi yang memerlukan tindakan secara cepat tanpa mengganggu aktivitas utama pada aplikasi.

---

### Cross Reference

Bagian ini mengacu pada:

- PART 2 — Product Overview → 2.5 Application Layout Architecture
- PART 8.5 — Notification Panel

# ==============================================================================
# PART 8 — NOTIFICATION
# 8.4 Notification Domain
# ==============================================================================

## 8.4 Notification Domain

Notification Domain merupakan domain yang bertanggung jawab untuk menyampaikan informasi yang memerlukan tindakan kepada pengguna berdasarkan Business Event yang terjadi di dalam Engineering Document Management System (EDMS).

Setiap Notification dibuat sebagai respon terhadap Business Event yang memenuhi kriteria **Need Action**.

Notification tidak digunakan untuk mencatat riwayat aktivitas sistem maupun menyimpan Business Workflow.

---

### Notification Record

Setiap Notification Record minimal terdiri dari informasi berikut:

- Recipient User ID
- Official Role
- Title
- Message
- Time
- Priority
- Read Status
- Read At

Seluruh informasi tersebut ditampilkan pada Notification Panel sebagaimana didefinisikan pada **PART 8.5 — Notification Panel**.

---

### Need Action

Notification hanya dibuat apabila suatu Business Event memerlukan tindakan dari pengguna.

Business Event yang tidak menghasilkan Need Action tidak menghasilkan Notification.

---

### Personal Notification

Notification menggunakan konsep **Personal Notification**.

Business Workflow menentukan **Official Role** yang menjadi tujuan Notification.

Sistem kemudian mengirimkan Notification kepada seluruh User Account Active yang memiliki Project Membership Active dengan Official Role tersebut pada Project terkait.

Admin pada Project terkait hanya menerima Personal Notification untuk Business Event yang termasuk allowlist Admin Notification.

Primary Recipient Workflow tidak berubah.

Admin Recipient hanya ditambahkan apabila User Account Active, Project Active, Project Membership Active, Official Role pada Project tersebut adalah Admin, Membership berada pada Project milik Document, dan Business Event termasuk allowlist Admin Notification.

Admin tidak menerima Notification berikut hanya karena berada pada Project yang sama:

- New Review Task.
- Revision Ready for Review.
- New Project Review Task.
- Workflow Completed yang bukan Document Approved.

Notification Admin menggunakan Message Dictionary existing:

- Approval B menggunakan Title `Revision Required` dan Message `Document requires revision. Review comment and attachment are available.`
- Approval C dari **Process Review** menggunakan Title `Document Not Approved By Team Process` dan Message `Document was not approved.` dengan Workflow Status hasil **Process Reject**.
- Approval C dari **Project Review** menggunakan Title `Document Not Approved By Team Project` dan Message `Document was not approved.` dengan Workflow Status hasil **Project Reject**.
- Document Approved menggunakan Title `Document Approved` dan Message `The document has been approved.`
- SLA At Risk menggunakan Title `SLA Warning` dan Message `Document is approaching its SLA limit.`
- SLA Overdue menggunakan Title `SLA Overdue` dan Message `Document has exceeded the SLA limit.`

Admin Notification menggunakan allowlist eksplisit berikut:

| Business Event | Admin Receives Notification |
|---|:---:|
| Approval B Completed | Yes |
| Approval C Completed | Yes |
| Document Approved | Yes |
| SLA At Risk | Yes |
| SLA Overdue | Yes |
| Document Uploaded | No |
| Approval A Completed menuju Project Review | No |
| Revision Uploaded | No |

Ketika Approval A dijalankan oleh Team Project pada Status Project Review dan Document berubah menjadi Approved, sistem mengirim Personal Notification **Document Approved** kepada:

- Seluruh Document Owner Active dengan Project Membership Active pada Project milik Document.
- Seluruh Admin Active dengan Project Membership Active pada Project milik Document.

Ketika Document pertama kali memasuki SLA Status **At Risk**, sistem mengirim Personal Notification **SLA At Risk** kepada seluruh User Active dengan Project Membership Active pada Project milik Document dan Official Role:

- Admin.
- Document Owner.
- Team Process.
- Team Project.

Ketika Document pertama kali memasuki SLA Status **Overdue**, sistem mengirim Personal Notification **SLA Overdue** kepada seluruh User Active dengan Project Membership Active pada Project milik Document dan Official Role:

- Admin.
- Document Owner.
- Team Process.
- Team Project.

Apabila User yang sama memenuhi lebih dari satu jalur penerima, sistem wajib mencegah duplicate Notification untuk Business Event yang sama.

Apabila lebih dari satu User Account memiliki Project Membership Active dengan Official Role yang sama pada Project terkait, maka setiap User Account menerima Notification miliknya masing-masing.

Notification tidak bersifat global dan tidak digunakan sebagai media pengumuman kepada seluruh pengguna.

---

### Project-Scoped Personal Notification

Setiap Personal Notification yang berasal dari aktivitas Project wajib memiliki Project Context.

Minimal Project Context terdiri dari:

- Project ID
- Recipient User ID
- Recipient Project Membership ID
- Recipient Official Role pada Project

Notification hanya dibuat untuk User Account yang memenuhi seluruh kondisi berikut:

- User Account berstatus Active.
- Memiliki Project Membership Active.
- Menjadi anggota Project yang berkaitan dengan Business Event.
- Memiliki Official Role penerima pada Project tersebut.

Admin Recipient wajib berasal dari Project yang sama dengan Business Event.

User Account dengan Official Role yang sama pada Project lain tidak menerima Notification tersebut.

Notification hanya ditampilkan pada Active Project yang sesuai dan tidak boleh muncul pada Project lain.

---

### Priority

Setiap Notification harus memiliki tingkat prioritas untuk membantu pengguna mengenali tingkat urgensi suatu Notification.

Priority terdiri dari:

- High
- Medium
- Low

Aturan penentuan Priority mengacu pada **PART 8.6 — Message Dictionary**.

---

### Read Status

Setiap Notification memiliki Read Status yang menunjukkan apakah Notification telah dibaca oleh penerima.

Read Status terdiri dari:

- Unread
- Read

Perubahan Read Status tidak mengubah Business Workflow maupun Business Event yang mendasari Notification tersebut.

---

### Notification Lifecycle

Notification mengikuti siklus berikut:

```text
Business Event
        │
        ▼
Need Action Evaluation
        │
        ▼
Determine Official Role
        │
        ▼
Validate Project Context
        │
        ▼
Find Active Project Membership(s)
        │
        ▼
Generate Personal Notification
        │
        ▼
Unread
        │
        ▼
Read
```

Notification tetap disimpan setelah dibaca dan dapat dihapus oleh User dari User Inbox miliknya.

Notification adalah User Inbox dan boleh di-hard delete oleh User. Notification bukan system evidence. Audit Trail tetap menjadi system evidence dan tetap mencatat bahwa notification pernah dikirim.

---

### Architecture Principles

Notification Domain dikembangkan berdasarkan prinsip berikut:

- Personal Notification
- Need Action
- Human-Friendly Communication
- Priority-Based Information
- Read / Unread Tracking

---

### Architecture Note

Notification hanya berfungsi sebagai media komunikasi kepada pengguna.

Notification tidak menentukan Business Workflow, tidak mengubah Engineering Document, dan tidak menggantikan fungsi Audit Trail.

Notification juga tidak menentukan apakah suatu Business Event harus terjadi. Seluruh Business Event tetap berasal dari Business Workflow sebagai Source of Truth.

Notification Domain hanya bertanggung jawab mengevaluasi hasil Business Event untuk menentukan apakah Notification perlu dibuat, disuppress, atau dibuat kembali (Re-Notification) sesuai kebijakan Notification Generation yang berlaku.

Seluruh Business Event yang menghasilkan Notification mengacu pada:

- BUSINESS-WORKFLOW.md

Standarisasi Title, Message, Priority, serta aturan pembentukan Notification didefinisikan pada **PART 8** sebagai **Single Source of Truth**.

Standarisasi Title, Message, dan Priority secara spesifik didefinisikan pada **PART 8.6 — Message Dictionary**.

---

## Notification Generation Rules

Notification hanya boleh dibuat apabila terjadi **Business Event** yang memenuhi seluruh kondisi berikut:

- Business Event menghasilkan **Need Action**.
- Business Event memiliki **Current Assignee** yang valid.
- Business Event berasal dari Active Project.
- Business Event belum menghasilkan Notification aktif dengan tujuan dan konteks yang sama.

Notification tidak dibuat berdasarkan perubahan data biasa, melainkan berdasarkan perubahan Business Workflow yang memerlukan tindakan dari pengguna.

---

### Notification Generation Principles

Proses pembentukan Notification mengikuti prinsip berikut:

- Satu Business Event dapat menghasilkan satu atau lebih Personal Notification apabila memiliki lebih dari satu penerima.
- Satu Notification hanya memiliki satu penerima.
- Notification tidak dibuat ulang apabila Business Event yang sama tidak menghasilkan Need Action baru.
- Read Status tidak mempengaruhi pembentukan Notification baru.
- Notification Counter hanya bertambah ketika Notification baru berhasil dibuat.

---

### Notification Suppression Rules

Sistem tidak boleh membuat Notification baru apabila:

- Business Event yang terjadi tidak menghasilkan Need Action.
- Current Assignee tidak berubah.
- Business Event hanya memperbarui informasi tanpa menghasilkan pekerjaan baru.
- Notification dengan tujuan yang sama masih aktif untuk penerima yang sama.
- Notification hanya berubah status Read atau Unread.

Suppression hanya mencegah pembentukan Notification baru dan tidak menghapus Notification yang telah ada.

---

### Re-Notification Rules

Notification baru dapat dibuat kembali apabila terjadi Business Event baru yang menghasilkan Need Action baru.

Contoh kondisi tersebut antara lain:

- Perpindahan Current Assignee.
- Perubahan Workflow yang menghasilkan tugas baru.
- Engineering Document kembali memerlukan tindakan setelah proses Review berikutnya.

Setiap Re-Notification diperlakukan sebagai Notification baru dan tidak mengubah riwayat Notification sebelumnya.

---

# ==============================================================================
# PART 8 — NOTIFICATION
# 8.5 Notification Panel
# ==============================================================================

## 8.5 Notification Panel

Notification Panel merupakan komponen utama yang digunakan untuk menampilkan daftar Personal Notification kepada pengguna yang sedang login.

Notification Panel hanya menampilkan Personal Notification milik User Account yang sedang login.

Notification milik User Account lain tidak pernah ditampilkan meskipun memiliki Official Role yang sama.

Seluruh Notification yang ditampilkan berasal dari Notification Domain sebagaimana didefinisikan pada **PART 8.4 — Notification Domain**.

---

### Layout

Notification Panel ditampilkan melalui Notification Bell yang berada pada Application Header.

Setiap Notification ditampilkan sebagai satu **Notification Item**.

Notification Panel harus mendukung:

- Vertical Scrolling
- Empty State
- Loading State

---

### Notification Item

Setiap Notification Item menampilkan informasi berikut:

- Title
- Message
- Time
- Priority
- Read Status

Struktur pesan yang digunakan mengacu pada **PART 8.6 — Message Dictionary**.

---

### Behaviour

Notification Panel harus memenuhi perilaku berikut:

- Menampilkan Notification berdasarkan waktu terbaru (descending).
- Hanya menampilkan Personal Notification milik pengguna yang sedang login.
- Notification dengan status **Unread** harus dapat dibedakan secara visual dari Notification yang telah **Read**.
- Notification tetap ditampilkan setelah berstatus **Read**.
- Notification tidak dapat diubah maupun dihapus oleh pengguna.
- Notification tidak menampilkan Business Event secara langsung kepada pengguna.
- Title dan Message menggunakan format yang telah distandarkan pada **PART 8.6 — Message Dictionary**.

---

### Acceptance Criteria

| AC ID | Acceptance Criteria |
|--------|---------------------|
| AC-NOT-001 | Notification Panel hanya menampilkan Notification milik pengguna yang sedang login. |
| AC-NOT-002 | Notification ditampilkan berdasarkan waktu terbaru (descending). |
| AC-NOT-003 | Setiap Notification Item menampilkan Title, Message, Time, Priority, dan Read Status. |
| AC-NOT-004 | Notification dengan status Unread memiliki pembeda visual dibandingkan Notification yang telah Read. |
| AC-NOT-005 | Notification tetap ditampilkan setelah berubah menjadi Read. |
| AC-NOT-006 | Pengguna tidak dapat mengubah maupun menghapus Notification. |
| AC-NOT-007 | Empty State ditampilkan apabila tidak terdapat Notification. |
| AC-NOT-008 | Loading State ditampilkan selama proses pengambilan Notification berlangsung. |

---

### Cross Reference

Bagian ini mengacu pada:

- PART 8.4 — Notification Domain
- PART 8.6 — Message Dictionary

# ==============================================================================
# PART 8 — NOTIFICATION
# 8.6 Message Dictionary
# ==============================================================================

## 8.6 Message Dictionary

Message Dictionary merupakan **Single Source of Truth** yang mendefinisikan standar **Business Event**, **Title**, **Message**, dan **Priority** yang digunakan oleh seluruh Notification pada Engineering Document Management System (EDMS).

Seluruh modul yang menghasilkan Notification wajib menggunakan Message Dictionary ini dan tidak diperbolehkan membuat variasi Title maupun Message di luar standar yang telah ditentukan pada PART ini.

---

### Message Dictionary

| Business Event | Title | Message | Priority |
|---------------|-------|---------|:--------:|
| Document Uploaded | **New Review Task** | A new document is waiting for your review. | Medium |
| Approval A Completed | **New Project Review Task** | A document is waiting for your project review. | Medium |
| Approval B Completed | **Revision Required** | Document requires revision. Review comment and attachment are available. | High |
| Approval C Completed — Process Review | **Document Not Approved By Team Process** | Document was not approved. | High |
| Approval C Completed — Project Review | **Document Not Approved By Team Project** | Document was not approved. | High |
| Revision Uploaded | **Revision Ready for Review** | A revised document is ready for review. | Medium |
| Document Approved | **Document Approved** | The document has been approved. | Low |
| SLA At Risk | **SLA Warning** | Document is approaching its SLA limit. | Medium |
| SLA Overdue | **SLA Overdue** | Document has exceeded the SLA limit. | High |

---

### Standard Message Rules

Seluruh Notification wajib mengikuti ketentuan berikut:

- Title menggunakan format yang singkat, mudah dipahami, dan berorientasi pada tindakan pengguna.
- Message menggunakan bahasa yang sederhana, natural, dan mudah dipahami oleh pengguna.
- Priority ditentukan berdasarkan tingkat urgensi Business Event.
- Satu Business Event menghasilkan satu Notification Message yang telah distandarkan pada PART ini.
- Notification tidak menampilkan istilah teknis maupun informasi internal sistem yang tidak diperlukan oleh pengguna.

---

### Priority Rules

Priority digunakan untuk membantu pengguna mengenali tingkat urgensi Notification.

| Priority | Description |
|----------|-------------|
| High | Memerlukan perhatian segera dari recipient Notification. |
| Medium | Memerlukan tindakan dalam proses Business Workflow normal. |
| Low | Bersifat informatif dan tidak memerlukan tindakan segera. |

---

### Future Extension

Apabila terdapat Business Event baru yang menghasilkan Notification, maka Business Event tersebut wajib ditambahkan pada Message Dictionary sehingga seluruh sistem tetap menggunakan standar Notification yang konsisten.

---

### Architecture Note

Message Dictionary merupakan **Single Source of Truth** untuk:

- Business Event
- Notification Title
- Notification Message
- Notification Priority

Seluruh Notification yang dihasilkan oleh sistem wajib mengacu pada Message Dictionary dan tidak diperbolehkan menggunakan format pesan yang berbeda.

Business Event
        │
        ▼
Need Action?
        │
        ▼
Generate Notification
        │
        ▼
Deliver to Project-Scoped Recipient
        │
        ▼
Unread
        │
User Click
        ▼
Read
        │
        ▼
Open Related Module
        │
        ▼
Focus Related Engineering Document

# ==============================================================================
# PART 8 — NOTIFICATION
# 8.7 Notification Behaviour
# ==============================================================================

## 8.7 Notification Behaviour

Notification Behaviour mendefinisikan bagaimana Notification dibuat, ditampilkan, dibaca, dan digunakan oleh pengguna selama Business Workflow berlangsung.

Seluruh perilaku Notification hanya mempengaruhi Notification milik pengguna yang sedang login dan tidak mengubah Business Workflow maupun Engineering Document.

---

### Notification Generation

Notification dibuat secara otomatis ketika suatu Business Event memenuhi kriteria **Need Action**.

Setiap Business Event hanya menghasilkan Notification apabila terdapat pengguna yang harus melakukan tindakan berikutnya berdasarkan Business Workflow.

Business Event yang tidak menghasilkan Need Action tidak menghasilkan Notification.

Untuk Business Event SLA At Risk dan SLA Overdue, Notification dibuat berdasarkan **SLA State Transition**, bukan hanya berdasarkan SLA State (untuk label frontend namanya Review Status) saat ini.

SLA Warning hanya dibuat ketika SLA State dokumen berubah dari state selain **At Risk** menjadi **At Risk**.

SLA Overdue hanya dibuat ketika SLA State dokumen berubah dari state selain **Overdue** menjadi **Overdue**.

Evaluasi ulang, query refetch, browser refresh, login ulang, page load, timer refresh, atau perpindahan Project tanpa perubahan SLA State tidak boleh menghasilkan Notification SLA tambahan.

Duplicate prevention Notification SLA wajib mempertimbangkan Project ID, Document ID, Recipient User ID, dan SLA State yang dimasuki.

Workflow Approval A, Approval B, Approval C, Upload Revision, atau status transition lain tidak boleh membuat ulang SLA Warning untuk dokumen yang sama apabila SLA Warning sebelumnya sudah pernah dibuat untuk recipient tersebut.

---

### Notification Ordering

Notification ditampilkan berdasarkan waktu terbaru (**descending**).

Notification terbaru selalu ditampilkan pada urutan paling atas.

---

### Read Behaviour

Setiap Notification yang baru dibuat memiliki status:

- Unread

Ketika pengguna memilih Notification tersebut, sistem harus:

- Mengubah Read Status menjadi **Read**.
- Mempertahankan Notification pada Notification Panel.
- Tidak mengubah Business Workflow maupun Business Event.

---

### Navigation Behaviour

Setelah Notification dipilih oleh pengguna, sistem harus:

- Membuka modul yang berkaitan dengan Notification tersebut.
- Menampilkan Engineering Document yang berkaitan sehingga pengguna dapat langsung melanjutkan pekerjaannya.
Apabila Workflow Action memiliki Workflow Comment maupun Workflow Attachment, sistem harus menyediakan akses sehingga pengguna dapat melihat hasil Review beserta Attachment yang berkaitan setelah Engineering Document dibuka.
- Mengurangi kebutuhan pengguna untuk mencari Engineering Document secara manual.

Tujuan navigasi ditentukan berdasarkan Business Event yang menghasilkan Notification.

---

### Personal Inbox Behaviour

Notification Panel hanya menampilkan Notification milik pengguna yang sedang login.

Notification milik pengguna lain tidak boleh ditampilkan maupun diakses.

Notification Panel hanya menampilkan Notification milik **Active Project**.

Perubahan **Active Project** menyebabkan:

- Notification List dimuat ulang.
- Notification Counter dihitung ulang.
- Notification Project sebelumnya tidak ditampilkan.
- Read Status pada Project lain tidak berubah.

Notification yang berasal dari Project lain tidak boleh ditampilkan maupun diakses.

---

### Acceptance Criteria

| AC ID | Acceptance Criteria |
|--------|---------------------|
| AC-NOT-BHV-001 | Notification dibuat secara otomatis ketika Business Event memenuhi kriteria Need Action. |
| AC-NOT-BHV-002 | Notification dikirim kepada penerima Project-Scoped yang ditentukan oleh Business Workflow, Official Role, dan Project Membership. Current Assignee digunakan sebagai display/monitoring, bukan dasar authorization. |
| AC-NOT-BHV-003 | Notification ditampilkan berdasarkan waktu terbaru (descending). |
| AC-NOT-BHV-004 | Notification baru memiliki status Unread. |
| AC-NOT-BHV-005 | Ketika Notification dipilih, Read Status berubah menjadi Read. |
| AC-NOT-BHV-006 | Setelah Notification dipilih, sistem membuka modul dan Engineering Document yang berkaitan sehingga pengguna dapat langsung melanjutkan pekerjaan. |
| AC-NOT-BHV-007 | Notification tetap tersedia setelah berstatus Read. |
| AC-NOT-BHV-008 | Notification hanya dapat dilihat oleh pengguna yang menjadi penerima Notification tersebut. |
| AC-NOT-BHV-009 | Notification Panel hanya menampilkan Notification milik Active Project. |
| AC-NOT-BHV-010 | Perubahan Active Project memuat ulang Notification List dan Notification Counter. |
| AC-NOT-BHV-011 | Read Status bersifat personal dan tetap dipertahankan pada setiap Project. |
| AC-NOT-BHV-012 | Notification dari Project lain tidak ditampilkan pada Active Project yang sedang digunakan. |

---

### Cross Reference

Bagian ini mengacu pada:

- PART 5 — Document Register Module
- PART 8.4 — Notification Domain
- PART 8.5 — Notification Panel
- PART 8.6 — Message Dictionary

# ==============================================================================
# PART 8 — NOTIFICATION
# 8.8 Permission Matrix
# ==============================================================================

## 8.8 Permission Matrix

Notification merupakan modul **Personal Action Communication** yang digunakan untuk menyampaikan informasi kepada pengguna yang memerlukan tindakan berdasarkan Business Workflow.

Seluruh Official Role memiliki hak untuk mengakses Notification sebagai bagian dari aktivitas sehari-hari pada Engineering Document Management System (EDMS).

Namun, setiap pengguna hanya dapat melihat Notification yang ditujukan kepada dirinya sendiri.

---

### Permission Matrix

| Feature | Admin | Document Owner | Team Process | Team Project |
|---------|:-----:|:--------------:|:------------:|:------------:|
| View Notification Bell | ✓ | ✓ | ✓ | ✓ |
| Open Notification Panel | ✓ | ✓ | ✓ | ✓ |
| View Personal Notification | ✓ | ✓ | ✓ | ✓ |
| Mark Notification as Read | ✓ | ✓ | ✓ | ✓ |
| Navigate to Related Module | ✓ | ✓ | ✓ | ✓ |

---

### Permission Rules

Notification menggunakan konsep **Personal Notification**.

Setiap User Account hanya dapat mengakses Notification miliknya sendiri.

Apabila beberapa User Account memiliki Official Role yang sama, masing-masing tetap memiliki Notification, Read Status, dan Notification Counter yang terpisah.

Pengguna tidak diperbolehkan:

- Melihat Notification milik pengguna lain.
- Mengubah isi Notification.
- Menghapus Notification.
- Mengubah Priority Notification.

Seluruh Notification dibuat secara otomatis oleh sistem berdasarkan Business Event yang memenuhi kriteria **Need Action**.

---

### Architecture Note

Hak akses pada Notification hanya mengatur kemampuan pengguna untuk melihat dan menggunakan Notification miliknya sendiri.

Permission tidak menentukan Business Workflow, Current Assignee, maupun proses pembentukan Notification.

Seluruh proses pembentukan Notification mengacu pada:

- BUSINESS-WORKFLOW.md
- PART 8.4 — Notification Domain
- PART 8.6 — Message Dictionary

Notification tetap menggunakan prinsip **Personal Notification**, sehingga hanya penerima Notification yang dapat melihat maupun berinteraksi dengan Notification tersebut.

---

### Cross Reference

Bagian ini mengacu pada:

- PART 3 — Authentication
- PART 5 — Document Register Module
- PART 8.4 — Notification Domain
- PART 8.6 — Message Dictionary
- ACCESS-CONTROL.md

# ==============================================================================
# PART 8 — NOTIFICATION
# 8.9 Error Handling
# ==============================================================================

## 8.9 Error Handling

Notification harus tetap memberikan pengalaman pengguna yang konsisten meskipun terjadi kegagalan selama proses pengambilan maupun penampilan Notification.

Error Handling hanya mempengaruhi proses penyajian Notification dan tidak mempengaruhi Business Workflow, Engineering Document, maupun Audit Trail.

---

### Error Handling Rules

Apabila terjadi kegagalan saat mengambil Notification, sistem harus:

- Menampilkan informasi bahwa Notification tidak dapat dimuat.
- Memungkinkan pengguna mencoba kembali proses pengambilan Notification.
- Tetap mempertahankan Notification yang telah berhasil dimuat sebelumnya apabila tersedia.

Apabila belum terdapat Notification untuk pengguna, sistem harus menampilkan **Empty State** dan bukan **Error State**.

Apabila Active Project tidak tersedia, sistem harus meminta pengguna memilih Active Project sebelum Notification dimuat.

Apabila Project Membership pengguna pada Active Project tidak valid, sistem harus menolak akses terhadap Notification Project tersebut.

Apabila Notification berasal dari Project lain, sistem tidak boleh menampilkan Notification tersebut.

---

### Recovery Behaviour

Setelah gangguan berhasil dipulihkan, sistem harus:

- Mengambil kembali Notification terbaru milik pengguna.
- Menampilkan Notification sesuai urutan waktu terbaru (descending).
- Mempertahankan Read Status yang telah tersimpan.
- Tidak membuat Notification baru sebagai akibat dari proses Recovery.
- Tidak mengubah urutan Notification maupun isi Notification yang telah dihasilkan sebelumnya.
- Memuat kembali Notification berdasarkan Active Project yang sedang digunakan.

Recovery hanya memulihkan proses penyajian Notification dan tidak mengubah Business Workflow, Business Event, Engineering Document, maupun Audit Trail.

---

### Acceptance Criteria

| AC ID | Acceptance Criteria |
|--------|---------------------|
| AC-NOT-ERR-001 | Sistem menampilkan Error State apabila Notification gagal dimuat. |
| AC-NOT-ERR-002 | Pengguna dapat mencoba kembali proses pengambilan Notification setelah terjadi kegagalan. |
| AC-NOT-ERR-003 | Empty State ditampilkan apabila pengguna belum memiliki Notification. |
| AC-NOT-ERR-004 | Setelah Recovery berhasil, Notification ditampilkan kembali sesuai urutan waktu terbaru (descending). |
| AC-NOT-ERR-005 | Recovery tidak menghasilkan Notification baru. |
| AC-NOT-ERR-006 | Recovery tidak mengubah Read Status Notification yang telah tersimpan. |
| AC-NOT-ERR-007 | Recovery tidak mengubah urutan maupun isi Notification yang telah dihasilkan sebelumnya. |
| AC-NOT-ERR-008 | Error Handling tidak mempengaruhi Business Workflow, Business Event, Engineering Document, maupun Audit Trail. |
| AC-NOT-ERR-009 | Notification hanya dapat dimuat apabila Active Project tersedia. |
| AC-NOT-ERR-010 | Notification tidak ditampilkan apabila Project Membership pengguna tidak valid. |
| AC-NOT-ERR-011 | Notification dari Project lain tidak boleh ditampilkan pada Active Project yang sedang digunakan. |

---

### Cross Reference

Bagian ini mengacu pada:

- PART 8.4 — Notification Domain
- PART 8.5 — Notification Panel
- PART 8.7 — Notification Behaviour

Business Workflow
        │
        ▼
Business Event
        │
        ▼
Need Action?
        │
   No ─────────────► No Notification
        │
       Yes
        ▼
Generate Notification
        │
        ▼
Current Assignee
        │
        ▼
Personal Notification
        │
        ▼
Unread
        │
User Click
        ▼
Read
        │
        ▼
Navigate to Related Module
        │
        ▼
Focus Related Engineering Document

# ==============================================================================
# PART 8 — NOTIFICATION
# 8.10 Cross Reference
# ==============================================================================

## 8.10 Cross Reference

PART 8 — Notification dibangun berdasarkan Business Workflow, Authentication, Access Control, dan Product Definition yang telah didefinisikan pada dokumen maupun PART berikut.

| Reference | Purpose |
|-----------|---------|
| BUSINESS-WORKFLOW.md | Menjadi Source of Truth untuk Business Workflow, Business Event, Current Assignee, dan Workflow Transition yang menghasilkan Notification. |
| PART 2 — Product Overview → 2.5 Application Layout Architecture | Menjadi Source of Truth untuk Application Layout Architecture dan Main Content Area Layout. |
| PART 3 — Authentication | Menjadi Source of Truth untuk Authentication, User Identity, Session Management, dan Login Behaviour. |
| PART 5 — Document Register Module | Menjadi Source of Truth untuk Engineering Document, Current Assignee, Workflow Status, dan Business Workflow yang menghasilkan Notification. |
| ACCESS-CONTROL.md | Menjadi Source of Truth untuk Official Role dan Access Control. |

---

### Dependency Summary

PART 8 menggunakan Business Event yang berasal dari Business Workflow dan tidak mendefinisikan ulang Business Workflow maupun Business Logic yang telah dimiliki oleh dokumen lain.

Sebaliknya, PART 8 menjadi **Single Source of Truth** untuk domain berikut:

- Notification
- Notification Record
- Notification Panel
- Notification Behaviour
- Message Dictionary

Seluruh modul yang menghasilkan Notification wajib mengacu pada PART ini.

---

### Implementation Note

Apabila terdapat perubahan terhadap Business Workflow maupun Business Event yang menghasilkan Notification, maka perubahan tersebut harus dilakukan terlebih dahulu pada Source of Truth yang bersangkutan, kemudian diikuti dengan penyesuaian pada PART 8 apabila diperlukan.

PART 8 tidak diperbolehkan mengubah maupun mendefinisikan ulang:

- Business Workflow
- Authentication
- Access Control
- Document Lifecycle

Sebaliknya, perubahan terhadap:

- Notification Domain
- Notification Behaviour
- Notification Panel
- Message Dictionary

harus dilakukan pada PART 8 sebagai **Single Source of Truth**.

---

## PART 8 Completion

Dengan selesainya PART 8, spesifikasi berikut telah didefinisikan secara lengkap:

- Notification Overview
- Notification Objectives
- Notification Layout
- Notification Domain
- Notification Panel
- Message Dictionary
- Notification Behaviour
- Permission Matrix
- Error Handling

PART 8 dinyatakan **Complete** dan menjadi **Single Source of Truth** untuk seluruh spesifikasi Notification pada Engineering Document Management System (EDMS).

# ==============================================================================
# PART 9 — USER MANAGEMENT
# 9.1 Overview
# ==============================================================================

## 9.1 Overview

User Management merupakan modul administrasi yang digunakan untuk mengelola seluruh akun pengguna pada Engineering Document Management System (EDMS).

Modul ini bertanggung jawab terhadap pengelolaan identitas pengguna (User Identity), termasuk pembuatan akun baru, perubahan informasi pengguna, pengelolaan status akun, serta pengelolaan Master Data Department yang digunakan oleh akun pengguna.

Department Management menjadi bagian dari User Management dan digunakan sebagai sumber pilihan Department pada proses Create User maupun Edit User.

User Management hanya dapat diakses oleh pengguna dengan System-Level Role dan Permission administrasi yang valid.

Modul ini tidak digunakan untuk mengelola hak akses (Permission), Business Workflow, maupun Authentication.

Pengelolaan hak akses mengacu pada **PART 10 — Role Management**, sedangkan Authentication mengacu pada **PART 3 — Authentication**.

---

### Architecture Principle

User Management merupakan **Identity Management Domain**.

User Management juga mengelola **Department Master Data** sebagai data referensi identitas pengguna.

Department Master Data tidak mengubah Business Workflow, Permission, Authentication, maupun Engineering Document.

Seluruh informasi yang dikelola pada modul ini berfokus pada identitas akun pengguna dan tidak mengubah Business Workflow maupun Engineering Document yang telah berjalan.

Official Role operasional tidak menjadi atribut User Management dan ditentukan melalui Project Membership.

User Management menggunakan pendekatan **Active / Inactive User Lifecycle**, sehingga akun pengguna tidak dihapus dari sistem untuk menjaga konsistensi data dan integritas riwayat aktivitas.

---

### Navigation

User Management diakses melalui **User Dropdown** pada Application Header.

Menu tersebut hanya ditampilkan kepada pengguna dengan Permission administrasi yang valid.

Struktur User Dropdown adalah sebagai berikut:

```text
User Management      (Admin Only)
──────────────────────────────
My Profile
Change Password
Logout
```

Menu **My Profile** dan **Change Password** mengacu pada **PART 11 — User Profile**, sedangkan **Logout** mengacu pada **PART 3 — Authentication**.

---

### Source of Truth

PART 9 menjadi **Single Source of Truth** untuk:

- User Management
- User Identity
- User Lifecycle
- User Management Process
- Department Management
- Department Master Data
- Department Lifecycle

Official Role operasional dikelola melalui **Project Membership** sebagaimana didefinisikan pada **PART 14 — Multi Project Management**.

Definisi Authentication mengacu pada **PART 3 — Authentication**.

# ==============================================================================
# PART 9 — USER MANAGEMENT
# 9.2 Objectives
# ==============================================================================

## 9.2 Objectives

User Management dirancang untuk menyediakan mekanisme administrasi yang terpusat dalam mengelola akun pengguna pada Engineering Document Management System (EDMS).

Modul ini memungkinkan Admin untuk membuat, memperbarui, dan mengelola status akun pengguna sebagai identitas global sistem.

User Management tidak digunakan untuk mengelola Authentication, Permission, maupun Business Workflow.

---

### Business Objectives

PART 9 dikembangkan untuk mencapai tujuan berikut:

- Menyediakan pengelolaan akun pengguna secara terpusat.
- Memastikan setiap pengguna memiliki identitas akun yang jelas dan konsisten.
- Mendukung pengelolaan siklus hidup akun pengguna melalui mekanisme **Active / Inactive**.
- Memastikan setiap pengguna memiliki tepat satu Official Role sesuai Fixed Role Strategy.
- Mempermudah Admin dalam mengelola akun pengguna tanpa mempengaruhi riwayat Engineering Document maupun Audit Trail.
- Menyediakan pengelolaan Master Data Department secara terpusat oleh Admin.
- Memastikan field Department pada Create User dan Edit User menggunakan Department yang valid dan berstatus Active.

---

### Design Objectives

User Management dikembangkan berdasarkan prinsip berikut:

- **Identity-Centric** — Modul berfokus pada pengelolaan identitas pengguna.
- **Simple Administration** — Seluruh proses administrasi pengguna dirancang sederhana dan mudah digunakan oleh Admin.
- **Data Integrity** — Perubahan data pengguna tidak menghilangkan riwayat aktivitas yang telah tercatat pada sistem.
- **Role Consistency** — Setiap pengguna selalu memiliki satu Official Role yang valid sesuai Fixed Role Strategy.
- **Lifecycle-Oriented** — Pengelolaan akun menggunakan pendekatan Active / Inactive untuk menjaga konsistensi data.
- **Master Data Driven** — Department pengguna berasal dari Department Master Data dan tidak dikelola sebagai nilai bebas atau hardcoded.
- **Reference Integrity** — Department yang telah digunakan oleh User tetap dipertahankan untuk menjaga integritas data.

---

### Architecture Note

User Management hanya bertanggung jawab terhadap pengelolaan identitas akun pengguna.

Pengelolaan Authentication, Password, Permission, Notification, maupun Business Workflow tetap menjadi tanggung jawab domain masing-masing sesuai Source of Truth yang telah didefinisikan pada PART terkait.

Department Management merupakan bagian dari User Management dan hanya bertanggung jawab mengelola Department Master Data yang digunakan sebagai referensi identitas pengguna.

Department Management tidak menentukan Official Role, Permission, Authentication, maupun Business Workflow.

# ==============================================================================
# PART 9 — USER MANAGEMENT
# 9.3 User Management Layout
# ==============================================================================

## 9.3 User Management Layout

User Management menggunakan **Application Layout Architecture** sebagaimana didefinisikan pada **PART 2 — Product Overview → 2.5 Application Layout Architecture**.

PART ini hanya mendefinisikan layout pada area User Management yang berada di dalam **Main Content Area**.

Seluruh elemen di luar Main Content Area, termasuk Navigation Sidebar, Top Navigation Bar, Footer, dan struktur halaman aplikasi mengikuti spesifikasi yang telah didefinisikan pada PART 2.

---

### Module Entry

User Management diakses melalui **User Dropdown** pada Application Header.

Menu **User Management** hanya ditampilkan kepada pengguna dengan Permission administrasi yang valid.

Ketika dipilih, sistem menampilkan halaman **User Management** sebagai modul administrasi akun pengguna.

---

### Layout Components

Halaman User Management terdiri dari komponen utama berikut:

- Page Header
- User Management Section
- Department Management Section

User Management Section terdiri dari:

- Search Area
- Filter Area
- User Management Table
- Create User Action

Department Management Section terdiri dari:

- Department Search
- Department Status Filter
- Department Table
- Add Department Action

Page Header menampilkan judul halaman beserta tombol **Create User** sebagai aksi utama pada modul ini.

Search Area digunakan untuk mencari akun pengguna.

Filter Area digunakan untuk memfilter daftar pengguna berdasarkan kriteria yang telah ditentukan.

User Management Table digunakan untuk menampilkan seluruh akun pengguna yang tersedia pada sistem.

Department Management Section digunakan oleh Admin untuk mengelola Department Master Data yang menjadi sumber pilihan Department pada Create User dan Edit User.

Department Management dapat ditampilkan sebagai tab, section, atau area khusus di dalam halaman User Management selama tetap mengikuti System Standard Layout dan konsistensi visual EDMS.

---

### Responsive Behaviour

Layout User Management harus tetap dapat digunakan pada berbagai ukuran layar tanpa mengubah struktur informasi utama.

Pada perangkat dengan ukuran layar yang lebih kecil, setiap komponen harus menyesuaikan tata letaknya agar tetap mudah digunakan tanpa mengurangi fungsi utama modul.

---

### Design Principles

Layout User Management dikembangkan berdasarkan prinsip berikut:

- Simple
- Consistent
- Efficient
- Administrator-Focused

Layout difokuskan untuk membantu Admin mengelola akun pengguna secara cepat, sederhana, dan konsisten.

---

### Cross Reference

Bagian ini mengacu pada:

- PART 2 — Product Overview → 2.5 Application Layout Architecture
- PART 9.5 — User Management Table
- PART 9.6 — User Management Form
- PART 9.11 — Department Management

# ==============================================================================
# PART 9 — USER MANAGEMENT
# 9.4 User Domain
# ==============================================================================

## 9.4 User Domain

User Domain merupakan domain yang bertanggung jawab untuk mengelola identitas seluruh akun pengguna pada Engineering Document Management System (EDMS).

Setiap User merepresentasikan satu akun global yang digunakan untuk mengakses sistem.

User Domain hanya mengelola identitas akun pengguna dan tidak mengelola Authentication, Permission, maupun Business Workflow.

---

### User Identity

Setiap User memiliki informasi identitas sebagai berikut:

- Name
- Username
- Email
- Department
- Status

Informasi tersebut menjadi identitas utama pengguna selama menggunakan sistem.

Nilai Department tidak diinput sebagai free text.

Department harus dipilih dari Department Master Data yang dikelola melalui Department Management.

Pada proses Create User, hanya Department berstatus Active yang dapat dipilih.

---

### Department Reference

Department merupakan referensi identitas organisasi yang digunakan oleh User.

Setiap User wajib memiliki satu Department yang valid.

Department pengguna mengacu pada Department Master Data yang dikelola melalui Department Management.

Department tidak menentukan Official Role, Permission, maupun Business Workflow.

Perubahan Department pengguna tidak mengubah riwayat aktivitas, Audit Trail, Notification, Engineering Document, maupun Business Workflow History yang telah tercatat sebelumnya.

---

### Official Role

Official Role operasional diberikan kepada User melalui **Project Membership**.

Satu User Account dapat memiliki Official Role yang berbeda pada Project yang berbeda.

Daftar Official Role menggunakan **Fixed Role Strategy** sebagaimana didefinisikan pada **PART 10 — Role Management**.

Perubahan Official Role pada satu Project tidak mengubah Official Role pengguna pada Project lainnya maupun riwayat aktivitas yang telah tercatat sebelumnya.

---

### User Status

Setiap User memiliki Status yang menunjukkan apakah akun tersebut masih dapat menggunakan sistem.

Status User terdiri dari:

- Active
- Inactive

Status merupakan bagian dari User Identity dan dikelola melalui proses User Management.

---

### User Lifecycle

User Domain menggunakan pendekatan **Active / Inactive User Lifecycle**.

Akun pengguna tidak dihapus dari sistem untuk menjaga konsistensi data dan integritas riwayat aktivitas.

Perubahan Status dari **Active** menjadi **Inactive** hanya mempengaruhi kemampuan pengguna untuk menggunakan sistem dan tidak menghapus informasi maupun riwayat aktivitas yang telah tercatat sebelumnya.

---

### Relationship with Project Membership

User Account bersifat global dan tidak dibuat ulang untuk setiap Project.

Hubungan antara User Account dengan Project dikelola melalui **Project Membership** sebagaimana didefinisikan pada **PART 14 — Multi Project Management**.

User Management tetap bertanggung jawab terhadap:

- Name
- Username
- Email
- Department
- User Status

User Management tidak menentukan Official Role operasional pengguna pada setiap Project.

Official Role operasional diberikan melalui **Project Membership** dan dapat berbeda pada setiap Project.

Satu User Account dapat menjadi anggota lebih dari satu Project tanpa membuat User Account baru.

Perubahan Project Membership tidak mengubah identitas User Account.

---

### Identity Integrity

Perubahan terhadap informasi identitas pengguna, seperti Name, Username, Email, maupun Department, tidak mengubah Audit Trail, Notification, maupun Engineering Document yang telah dihasilkan sebelumnya.

Seluruh riwayat aktivitas tetap mempertahankan hubungan dengan User yang bersangkutan untuk menjaga integritas data sistem.

Apabila Department yang digunakan oleh User kemudian berubah menjadi Inactive, User tetap mempertahankan referensi Department tersebut.

Department Inactive tidak dapat dipilih untuk User baru, tetapi tidak boleh dihapus dari User yang telah menggunakannya.

---

### Architecture Principles

User Domain dikembangkan berdasarkan prinsip berikut:

- Identity-Centric
- Active / Inactive Lifecycle
- Data Integrity
- Single User Identity
- Master Data Driven Department
- Department Reference Integrity

---

### Architecture Note

User Domain hanya bertanggung jawab terhadap identitas akun pengguna.

Authentication, Password Management, Notification, Permission, dan Business Workflow tetap dikelola oleh domain masing-masing sesuai Source of Truth yang telah ditentukan.

Official Role operasional dikelola melalui **Project Membership** sebagaimana didefinisikan pada **PART 14 — Multi Project Management**.

# ==============================================================================
# PART 9 — USER MANAGEMENT
# 9.5 User Management Table
# ==============================================================================

## 9.5 User Management Table

User Management Table digunakan sebagai tampilan utama untuk menampilkan seluruh akun pengguna yang terdaftar pada Engineering Document Management System (EDMS).

Tabel ini menjadi pusat navigasi Admin untuk melihat informasi pengguna serta mengakses proses pengelolaan akun.

---

### Table Columns

User Management Table menampilkan informasi berikut:

| Column | Description |
|---------|-------------|
| No | Nomor urut data pada halaman yang sedang ditampilkan. |
| Name | Nama pengguna. |
| Username | Username yang digunakan untuk login ke sistem. |
| Email | Alamat email pengguna. |
| Department | Department pengguna. |
| Status | Status akun pengguna (Active / Inactive). |
| Actions | Menampilkan aksi yang tersedia untuk pengguna. |

---

### Actions Column

Kolom **Actions** menyediakan tombol berikut:

| Action | Description |
|---------|-------------|
| Edit | Membuka Edit User untuk mengelola informasi akun pengguna. |
| Activate | Mengaktifkan kembali akun User yang berstatus Inactive. |
| Deactivate | Menonaktifkan akun User yang berstatus Active tanpa menghapus riwayat akun. |

Ketersediaan tombol pada kolom **Actions** mengikuti Permission yang telah ditentukan pada PART 9.8.

---

### Search

User Management menyediakan fasilitas pencarian (Search) untuk membantu Admin menemukan akun pengguna dengan lebih cepat.

Search digunakan untuk mencari pengguna berdasarkan informasi identitas yang dimiliki oleh akun pengguna.

---

### Filter

User Management menyediakan Filter berdasarkan:

- Department
- Status

Filter Department menggunakan seluruh Department Master Data yang relevan sebagai pilihan filter.

Pilihan filter Department tidak dibentuk hanya dari nilai Department yang sedang muncul pada halaman tabel.

Filter dapat digunakan secara mandiri maupun dikombinasikan untuk mempersempit hasil pencarian pengguna.

---

### Empty State

Apabila belum terdapat akun pengguna yang sesuai dengan hasil pencarian atau filter yang digunakan, sistem harus menampilkan **Empty State**.

Empty State menunjukkan bahwa tidak terdapat data yang dapat ditampilkan dan bukan merupakan kondisi Error.

---

### Responsive Behaviour

Pada ukuran layar yang lebih kecil, User Management Table harus tetap mempertahankan keterbacaan informasi utama.

Apabila diperlukan, tabel dapat menggunakan mekanisme horizontal scrolling tanpa mengurangi informasi yang ditampilkan.

---

### Cross Reference

Bagian ini mengacu pada:

- PART 9.3 — User Management Layout
- PART 9.6 — User Management Form
- PART 9.8 — Permission Matrix

# ==============================================================================
# PART 9 — USER MANAGEMENT
# 9.6 User Management Form
# ==============================================================================

## 9.6 User Management Form

User Management Form digunakan oleh Admin untuk membuat akun pengguna baru maupun memperbarui informasi akun pengguna yang telah terdaftar.

Modul ini terdiri dari dua jenis form, yaitu **Create User** dan **Edit User**, yang memiliki tujuan bisnis dan informasi yang berbeda.

---

### Create User Form

Create User digunakan untuk membuat akun pengguna baru yang akan memperoleh akses ke Engineering Document Management System (EDMS).

Form ini terdiri dari informasi berikut:

| Field | Description |
|---------|-------------|
| Name | Nama pengguna. |
| Username | Username yang digunakan untuk login ke sistem. |
| Email | Alamat email pengguna. |
| Department | Department pengguna yang dipilih dari Department Master Data berstatus Active.|
| Initial Password | Password awal yang diberikan kepada pengguna. |
| Confirm Password | Konfirmasi Initial Password. |

Department pada Create User menggunakan Selection Control.

Pilihan Department berasal dari Department Master Data.

Hanya Department dengan Status **Active** yang dapat dipilih ketika membuat User baru.

Department tidak dapat dimasukkan sebagai free text melalui Create User Form.

Sebelum akun dibuat, sistem menampilkan confirmation yang memperlihatkan Username aktual dan menjelaskan bahwa Username tidak dapat diubah setelah akun berhasil dibuat.

Setelah proses Create User berhasil, sistem mengembalikan Admin ke halaman **User Management**.

---

### Edit User Form

Edit User digunakan untuk memperbarui informasi identitas akun pengguna yang telah terdaftar.

Form ini terdiri dari informasi berikut:

| Field | Description |
|---------|-------------|
| Name | Nama pengguna. |
| Username | Username pengguna, ditampilkan read-only dan tidak dapat diubah. |
| Email | Alamat email pengguna. |
| Department | Department pengguna yang dipilih dari Department Master Data. |
| Status | Status akun pengguna (Active / Inactive). |

Form **Edit User** tidak menampilkan maupun mengubah Password pengguna.

Username hanya ditentukan pada Create User dan menjadi immutable setelah akun berhasil dibuat. Edit User tidak boleh mengubah Username, termasuk melalui manipulated API payload.

Perubahan Password mengikuti proses Authentication dan User Profile sesuai PART terkait.

Department pada Edit User menggunakan Selection Control.

Department berstatus Active dapat dipilih sebagai nilai baru.

Apabila User saat ini menggunakan Department yang telah berstatus Inactive, Department tersebut tetap ditampilkan sebagai nilai existing agar referensi User tidak hilang.

Department Inactive tidak dapat dipilih untuk mengganti Department User lain.

---

### Department Field Rules

Field Department mengikuti aturan berikut:

- Department wajib dipilih.
- Department berasal dari Department Master Data.
- Department tidak menerima free text.
- Create User hanya menampilkan Department Active.
- Edit User menampilkan Department Active sebagai pilihan.
- Department Inactive yang telah digunakan User tetap ditampilkan sebagai existing value.
- Department Inactive tidak dapat digunakan untuk assignment baru.
- Perubahan pilihan Department tidak mengubah Official Role maupun Permission.

---

### Form Principles

User Management Form dikembangkan berdasarkan prinsip berikut:

- Identity-Oriented
- Simple Administration
- Consistent User Experience
- Separation of Identity and Credential

Create User digunakan untuk membuat identitas akun beserta Initial Password, sedangkan Edit User hanya digunakan untuk mengelola identitas akun pengguna.

---

### Responsive Behaviour

User Management Form harus tetap dapat digunakan pada berbagai ukuran layar.

Seluruh field dan komponen form harus menyesuaikan tata letak tanpa mengurangi fungsi maupun keterbacaan informasi.

---

### Cross Reference

Bagian ini mengacu pada:

- PART 3 — Authentication
- PART 9.4 — User Domain
- PART 9.5 — User Management Table
- PART 9.11 — Department Management
- PART 11 — User Profile

# ==============================================================================
# PART 9 — USER MANAGEMENT
# 9.7 User Management Behaviour
# ==============================================================================

## 9.7 User Management Behaviour

User Management menyediakan proses administrasi akun pengguna yang dilakukan oleh Admin.

Seluruh perubahan terhadap akun pengguna hanya mempengaruhi identitas akun dan tidak mengubah Business Workflow, Engineering Document, Audit Trail, maupun Notification yang telah tercatat sebelumnya.

---

### Create User Behaviour

Admin dapat membuat akun pengguna baru melalui halaman **Create User**.

Sebelum proses Create User disimpan, sistem memvalidasi bahwa Department yang dipilih masih tersedia dan berstatus Active.

Setelah validasi form berhasil, Admin wajib mengonfirmasi Username sebelum request Create User dikirim.

Setelah proses berhasil disimpan:

- Akun pengguna baru ditambahkan ke User Management.
- Department diterapkan sesuai pilihan Admin dari Department Master Data.
- Status awal pengguna menjadi **Active**.
- Official Role operasional diberikan melalui **Project Membership** setelah User Account berhasil dibuat.
- Sistem mengembalikan Admin ke halaman **User Management**.

---

### Edit User Behaviour

Admin dapat memperbarui informasi identitas pengguna melalui halaman **Edit User**.

Field Username tetap terlihat pada Edit User sebagai referensi identitas akun, tetapi tidak editable.

Informasi yang dapat diperbarui meliputi:

- Name
- Username
- Email
- Department
- Status

Official Role operasional pengguna dikelola melalui **Project Membership** dan tidak diubah melalui User Management.

Perubahan Department hanya dapat menggunakan Department Master Data yang berstatus Active.

Apabila User sebelumnya menggunakan Department yang telah menjadi Inactive, nilai tersebut tetap dipertahankan sampai Admin memilih Department Active sebagai pengganti.

Perubahan identitas tidak menghapus maupun mengubah riwayat aktivitas pengguna yang telah tercatat sebelumnya.

---

### Department Behaviour

Department pengguna berasal dari Department Master Data.

Ketika Department baru ditambahkan dan berstatus Active, Department tersebut langsung tersedia sebagai pilihan pada Create User dan Edit User.

Ketika Department diubah menjadi Inactive:

- Department tidak lagi tersedia untuk assignment baru.
- User yang telah menggunakan Department tersebut tetap mempertahankan referensinya.
- Riwayat User tidak berubah.
- Department tidak dihapus dari sistem.

Perubahan Department Master Data tidak mengubah Official Role, Permission, Authentication, Business Workflow, Engineering Document, Audit Trail, maupun Notification yang telah tercatat.

---

### User Status Behaviour

User Management menggunakan dua Status akun:

- Active
- Inactive

Perubahan Status dilakukan melalui halaman **Edit User**.

Apabila Status diubah menjadi **Inactive**, pengguna tidak lagi dapat menggunakan akun tersebut untuk mengakses Engineering Document Management System (EDMS).

Perubahan Status tidak menghapus akun pengguna maupun riwayat aktivitas yang telah dimiliki.

---

### Project Membership Behaviour

User Management hanya mengelola identitas User Account.

Hubungan antara User Account dengan Project dikelola melalui **Project Membership** sebagaimana didefinisikan pada **PART 14 — Multi Project Management**.

Perubahan User Account tidak secara otomatis mengubah Project Membership.

Apabila Status User diubah menjadi **Inactive**:

- Pengguna tidak dapat Login ke sistem.
- Pengguna tidak dapat mengakses Project mana pun.
- Project Membership tetap dipertahankan.
- Engineering Document, Audit Trail, Notification, dan Business Workflow History tidak berubah.

Apabila Status User diubah kembali menjadi **Active**, akses terhadap Project mengikuti Project Membership yang masih berstatus Active.

Perubahan User Account tidak mengubah Official Role operasional pengguna pada setiap Project.

---

### User Identity Behaviour

Perubahan terhadap informasi identitas pengguna hanya berlaku untuk informasi akun yang aktif digunakan oleh sistem.

Perubahan tersebut tidak mengubah hubungan antara pengguna dengan:

- Engineering Document
- Audit Trail
- Notification
- Business Workflow History

Seluruh riwayat aktivitas tetap mempertahankan referensi kepada akun pengguna yang bersangkutan.

---

### Navigation Behaviour

Alur navigasi User Management adalah sebagai berikut:

```text
User Dropdown
        │
        ▼
User Management
        │
        ├──────────────► Create User
        │                      │
        │                      ▼
        │                  Save User
        │                      │
        │                      ▼
        │              Back to User Management
        │
        ▼
User List
        │
        ▼
Edit User
        │
        ▼
Save Changes
        │
        ▼
Back to User Management
```

---

### Architecture Principles

User Management Behaviour dikembangkan berdasarkan prinsip berikut:

- Identity First
- Simple Administration
- Data Integrity
- Fixed Role Strategy
- Active / Inactive Lifecycle
- Master Data Driven Department
- Department Reference Integrity

Seluruh proses administrasi pengguna dirancang untuk menjaga konsistensi data tanpa mempengaruhi domain lain yang telah didefinisikan sebagai Source of Truth.

---

### Cross Reference

Bagian ini mengacu pada:

- PART 3 — Authentication
- PART 9.4 — User Domain
- PART 9.6 — User Management Form
- PART 9.11 — Department Management
- PART 10 — Role Management
- PART 11 — User Profile

# ==============================================================================
# PART 9 — USER MANAGEMENT
# 9.8 Permission Matrix
# ==============================================================================

## 9.8 Permission Matrix

User Management merupakan modul administrasi yang digunakan untuk mengelola akun pengguna pada Engineering Document Management System (EDMS).

Modul ini hanya dapat diakses oleh pengguna dengan System-Level Role dan Permission administrasi yang valid.

Pengguna tanpa Permission administrasi tidak memiliki akses terhadap User Management.

---

### Permission Matrix

| Feature | Admin | Document Owner | Team Process | Team Project |
|---------|:-----:|:--------------:|:------------:|:------------:|
| View User Management | ✓ | — | — | — |
| View User List | ✓ | — | — | — |
| Search User | ✓ | — | — | — |
| Filter User | ✓ | — | — | — |
| Create User | ✓ | — | — | — |
| Edit User | ✓ | — | — | — |
| Change User Status | ✓ | — | — | — |
| View Department List | ✓ | — | — | — |
| Search Department | ✓ | — | — | — |
| Filter Department | ✓ | — | — | — |
| Create Department | ✓ | — | — | — |
| Edit Department | ✓ | — | — | — |
| Activate Department | ✓ | — | — | — |
| Deactivate Department | ✓ | — | — | — |

---

### Permission Rules

Admin memiliki hak untuk:

- Melihat seluruh akun pengguna yang terdaftar pada sistem.
- Membuat akun pengguna baru.
- Memperbarui informasi identitas pengguna.
- Mengubah Official Role pengguna.
- Mengubah Status pengguna melalui proses Edit User.
- Melihat seluruh Department yang tersedia.
- Menambahkan Department baru.
- Memperbarui nama Department.
- Mengaktifkan Department.
- Menonaktifkan Department.

Pengguna selain Admin tidak diperbolehkan:

- Mengakses User Management.
- Melihat daftar akun pengguna.
- Membuat akun pengguna.
- Mengubah identitas pengguna lain.
- Mengubah Official Role pengguna lain.
- Mengubah Status pengguna lain.
- Mengakses Department Management.
- Menambahkan atau mengubah Department.
- Mengaktifkan maupun menonaktifkan Department.

---

### Access Boundary

Hak akses pada PART 9 hanya mengatur pengelolaan akun pengguna.

Permission pada modul ini tidak mengatur:

- Authentication
- Password Management
- Permission Definition
- Business Workflow
- Engineering Document

Masing-masing domain tersebut mengacu pada Source of Truth yang telah ditentukan pada PART terkait.

Hak akses Department Management hanya mengatur Department Master Data sebagai referensi identitas User.

Department Management tidak memberikan Permission terhadap Business Workflow maupun Product Module lainnya.

---

### Architecture Note

User Management menggunakan pendekatan **Centralized Administration**, sehingga seluruh proses administrasi akun pengguna dilakukan oleh Admin.

Pengguna tetap dapat mengelola akun pribadinya melalui **My Profile** dan **Change Password**, namun proses tersebut berada di luar ruang lingkup PART 9 dan mengacu pada **PART 11 — User Profile**.

---

### Cross Reference

Bagian ini mengacu pada:

- PART 3 — Authentication
- PART 9.4 — User Domain
- PART 9.11 — Department Management
- PART 10 — Role Management
- PART 11 — User Profile

# ==============================================================================
# PART 9 — USER MANAGEMENT
# 9.9 Error Handling
# ==============================================================================

## 9.9 Error Handling

User Management harus tetap memberikan pengalaman penggunaan yang konsisten apabila terjadi kegagalan selama proses pengelolaan akun pengguna.

Error Handling hanya mempengaruhi proses administrasi User Management dan tidak mengubah Business Workflow, Engineering Document, Audit Trail, Notification, maupun Authentication yang telah berjalan.

---

### Error Handling Rules

Apabila terjadi kegagalan saat memuat User Management, sistem harus:

- Menampilkan informasi bahwa data pengguna tidak dapat dimuat.
- Memungkinkan Admin mencoba kembali proses pengambilan data pengguna.
- Tetap mempertahankan data yang telah berhasil dimuat sebelumnya apabila tersedia.

Apabila belum terdapat akun pengguna yang sesuai dengan hasil pencarian atau filter yang digunakan, sistem harus menampilkan **Empty State** dan bukan **Error State**.

Apabila proses Create User maupun Edit User gagal disimpan, data yang telah tersimpan pada sistem tidak boleh berubah.

Apabila Department Master Data gagal dimuat, sistem harus:

- Menampilkan informasi bahwa data Department tidak dapat dimuat.
- Menyediakan mekanisme Retry.
- Tidak menampilkan daftar Department yang tidak dapat diverifikasi.
- Mencegah Create User atau Edit User disimpan apabila validitas Department tidak dapat dipastikan.

Apabila proses Create Department, Edit Department, Activate Department, atau Deactivate Department gagal, data Department yang telah tersimpan sebelumnya tidak boleh berubah.

---

### Recovery Behaviour

Setelah gangguan berhasil dipulihkan, sistem harus:

- Mengambil kembali data pengguna terbaru.
- Menampilkan User Management Table sesuai kondisi data terbaru.
- Mempertahankan hasil pencarian maupun filter yang masih berlaku selama sesi pengguna apabila memungkinkan.
- Tidak membuat akun pengguna baru maupun mengubah data pengguna sebagai akibat dari proses Recovery.

Recovery hanya memulihkan proses administrasi User Management dan tidak mengubah Business Workflow, Engineering Document, Audit Trail, Notification, maupun Authentication.

Setelah Recovery Department Management berhasil, sistem harus:

- Mengambil kembali Department Master Data terbaru.
- Memperbarui pilihan Department pada Create User dan Edit User.
- Memperbarui Department Filter pada User Management.
- Tidak membuat maupun mengubah Department secara otomatis.

---

### Acceptance Criteria

| AC ID | Acceptance Criteria |
|--------|---------------------|
| AC-USER-ERR-001 | Sistem menampilkan Error State apabila User Management gagal dimuat. |
| AC-USER-ERR-002 | Admin dapat mencoba kembali proses pengambilan data pengguna setelah terjadi kegagalan. |
| AC-USER-ERR-003 | Empty State ditampilkan apabila tidak terdapat data pengguna yang sesuai. |
| AC-USER-ERR-004 | Kegagalan Create User tidak menghasilkan akun pengguna baru. |
| AC-USER-ERR-005 | Kegagalan Edit User tidak mengubah data pengguna yang telah tersimpan sebelumnya. |
| AC-USER-ERR-006 | Setelah Recovery berhasil, User Management Table menampilkan data pengguna terbaru. |
| AC-USER-ERR-007 | Recovery tidak membuat akun baru maupun mengubah data pengguna secara otomatis. |
| AC-USER-ERR-008 | Error Handling tidak mempengaruhi Business Workflow, Engineering Document, Audit Trail, Notification, maupun Authentication. |
| AC-USER-ERR-009 | Sistem menampilkan Error State apabila Department Master Data gagal dimuat. |
| AC-USER-ERR-010 | Admin dapat melakukan Retry untuk memuat kembali Department Master Data. |
| AC-USER-ERR-011 | Create User dan Edit User tidak dapat disimpan menggunakan Department yang tidak valid. |
| AC-USER-ERR-012 | Kegagalan Create atau Edit Department tidak mengubah Department Master Data yang telah tersimpan. |
| AC-USER-ERR-013 | Setelah Recovery berhasil, pilihan Department pada User Management menggunakan data terbaru. |

---

### Cross Reference

Bagian ini mengacu pada:

- PART 3 — Authentication
- PART 9.5 — User Management Table
- PART 9.6 — User Management Form
- PART 9.7 — User Management Behaviour
- PART 9.11 — Department Management

# ==============================================================================
# PART 9 — USER MANAGEMENT
# 9.10 Cross Reference
# ==============================================================================

## 9.10 Cross Reference

PART 9 — User Management dibangun berdasarkan Application Architecture, Authentication, Access Control, dan Business Workflow yang telah didefinisikan pada dokumen maupun PART terkait.

| Reference | Purpose |
|-----------|---------|
| PART 2 — Product Overview → 2.5 Application Layout Architecture | Menjadi Source of Truth untuk Application Layout Architecture dan Main Content Area Layout. |
| PART 3 — Authentication | Menjadi Source of Truth untuk Authentication, Login Behaviour, Session Management, dan Logout. |
| BUSINESS-WORKFLOW.md | Menjadi Source of Truth untuk Business Workflow yang menggunakan identitas pengguna sebagai pelaksana aktivitas. |
| ACCESS-CONTROL.md | Menjadi Source of Truth untuk Access Control dan Official Role. |
| PART 10 — Role Management | Menjadi Source of Truth untuk Official Role, Role Definition, dan Permission Structure. |
| PART 11 — User Profile | Menjadi Source of Truth untuk My Profile dan Change Password. |
| PART 9.11 — Department Management | Menjadi Source of Truth untuk Department Master Data, Department Lifecycle, serta penggunaan Department pada User Management. |

---

### Dependency Summary

PART 9 menggunakan User Identity dan Authentication dari PART 3 sebagai dasar pengelolaan akun pengguna.

PART 9 juga mengelola Department Master Data yang digunakan sebagai referensi pada identitas User.

PART 9 tidak mendefinisikan ulang Authentication, Password Management, Permission, maupun Business Workflow.

Sebaliknya, PART 9 menjadi **Single Source of Truth** untuk domain berikut:

- User Management
- User Identity
- User Lifecycle
- User Management Table
- User Management Form
- User Management Behaviour
- Department Management
- Department Master Data
- Department Lifecycle

Seluruh modul yang memerlukan pengelolaan akun pengguna wajib mengacu pada PART ini.

---

### Implementation Note

Apabila terdapat perubahan terhadap struktur identitas pengguna, maka perubahan tersebut harus dilakukan terlebih dahulu pada PART 9 sebagai **Single Source of Truth**.

Apabila terdapat perubahan terhadap struktur, lifecycle, atau penggunaan Department Master Data, perubahan tersebut harus dilakukan pada PART 9.11 — Department Management sebagai Source of Truth.

Perubahan Department tidak boleh didefinisikan pada PART 10 — Role Management karena Department bukan Official Role dan tidak menentukan Permission.

Apabila terdapat perubahan terhadap:

- Authentication
- Official Role
- Permission
- Business Workflow

maka perubahan dilakukan pada Source of Truth masing-masing dan PART 9 hanya disesuaikan apabila diperlukan.

PART 9 tidak diperbolehkan mendefinisikan ulang:

- Authentication
- Password Management
- Permission
- Business Workflow

guna menjaga batas tanggung jawab antar domain tetap konsisten.

---

# ==============================================================================
# PART 9 — USER MANAGEMENT
# 9.11 Department Management
# ==============================================================================

## 9.11 Department Management

Department Management merupakan fitur administrasi yang digunakan oleh Admin untuk mengelola Department Master Data pada Engineering Document Management System (EDMS).

Department Master Data digunakan sebagai sumber pilihan field Department pada:

- Create User
- Edit User
- Filter Department pada User Management

Department Management merupakan bagian dari User Management dan tidak menjadi Product Module terpisah.

---

### Department Domain

Setiap Department memiliki informasi berikut:

| Field | Description |
|---------|-------------|
| Department Name | Nama unik Department. |
| Status | Status Department (Active / Inactive). |

Department tidak menentukan Official Role, Permission, Authentication, maupun Business Workflow.

---

### Department Lifecycle

Department Management menggunakan pendekatan **Active / Inactive Lifecycle**.

Department tidak dihapus secara permanen dari sistem untuk menjaga integritas referensi User.

Status Department terdiri dari:

- Active
- Inactive

Department Active dapat digunakan untuk assignment baru pada Create User dan Edit User.

Department Inactive tidak dapat digunakan untuk assignment baru, tetapi tetap dipertahankan pada User yang telah menggunakan Department tersebut.

---

### Department Management Table

Department Management Table menampilkan informasi berikut:

| Column | Description |
|---------|-------------|
| No | Nomor urut data pada halaman aktif. |
| Department Name | Nama Department. |
| Status | Status Department (Active / Inactive). |
| Actions | Menampilkan aksi yang tersedia terhadap Department. |

Kolom Actions menyediakan aksi berikut:

| Action | Description |
|---------|-------------|
| Edit | Memperbarui nama Department. |
| Activate | Mengaktifkan Department yang berstatus Inactive. |
| Deactivate | Menonaktifkan Department yang berstatus Active. |

Department Management tidak menyediakan hard delete.

---

### Create Department

Admin dapat menambahkan Department baru melalui aksi **Add Department**.

Create Department menggunakan field berikut:

| Field | Requirement |
|---------|-------------|
| Department Name | Wajib diisi dan harus unik. |
| Status | Default Active. |

Setelah berhasil dibuat, Department Active langsung tersedia pada:

- Create User
- Edit User
- Filter Department

---

### Edit Department

Admin dapat memperbarui nama Department melalui aksi Edit.

Perubahan nama Department berlaku pada data aktif yang ditampilkan oleh sistem tanpa menghapus referensi User yang telah menggunakan Department tersebut.

Edit Department tidak membuat record Department baru.

---

### Activate Department

Department berstatus Inactive dapat diaktifkan kembali.

Setelah diaktifkan:

- Status berubah menjadi Active.
- Department kembali tersedia pada Create User.
- Department kembali tersedia sebagai pilihan baru pada Edit User.
- Department tersedia pada Filter Department.

---

### Deactivate Department

Department berstatus Active dapat dinonaktifkan.

Sebelum proses dilakukan, sistem menampilkan Confirmation Modal:

```text
Deactivate Department

Department ini tidak akan tersedia untuk assignment User baru.
User yang telah menggunakan Department ini tetap mempertahankan referensinya.

[Cancel] [Deactivate]
```

Setelah dikonfirmasi:

- Status Department berubah menjadi Inactive.
- Department tidak tersedia untuk assignment baru.
- User existing tetap mempertahankan Department tersebut.
- Riwayat dan referensi data tidak dihapus.

---

### Search and Filter

Department Management menyediakan:

- Search berdasarkan Department Name.
- Filter Status:
  - All Status
  - Active
  - Inactive

Pilihan filter Status bersifat tetap dan tidak dibentuk hanya dari data yang sedang tampil pada tabel.

---

### Validation Rules

Department Management mengikuti aturan validasi berikut:

| Validation ID | Validation Rule | Expected Result |
|---------------|-----------------|-----------------|
| VAL-DEPT-001 | Department Name kosong. | Proses ditolak. |
| VAL-DEPT-002 | Department Name hanya berisi spasi. | Proses ditolak. |
| VAL-DEPT-003 | Department Name telah digunakan. | Proses ditolak. |
| VAL-DEPT-004 | Perbandingan nama berbeda huruf besar atau kecil. | Tetap dianggap duplikat. |
| VAL-DEPT-005 | Department Active digunakan pada Create User. | Department dapat dipilih. |
| VAL-DEPT-006 | Department Inactive digunakan untuk assignment baru. | Proses ditolak. |
| VAL-DEPT-007 | Department Inactive masih digunakan User existing. | Referensi User tetap dipertahankan. |
| VAL-DEPT-008 | Proses Deactivate gagal. | Status Department sebelumnya tetap dipertahankan. |

Nama Department harus dinormalisasi dengan menghapus spasi yang tidak diperlukan pada awal maupun akhir nilai sebelum proses validasi uniqueness dilakukan.

---

### Business Rules

| Rule ID | Business Rule |
|---------|---------------|
| BR-DEPT-001 | Hanya Admin yang dapat mengakses Department Management. |
| BR-DEPT-002 | Department Name wajib diisi. |
| BR-DEPT-003 | Department Name wajib unik secara case-insensitive. |
| BR-DEPT-004 | Department menggunakan Active / Inactive Lifecycle. |
| BR-DEPT-005 | Department tidak dapat dihapus secara permanen. |
| BR-DEPT-006 | Hanya Department Active yang dapat digunakan untuk assignment User baru. |
| BR-DEPT-007 | User existing tetap mempertahankan Department yang telah menjadi Inactive. |
| BR-DEPT-008 | Department Active langsung tersedia pada Create User dan Edit User. |
| BR-DEPT-009 | Perubahan Department tidak mengubah Official Role maupun Permission. |
| BR-DEPT-010 | Perubahan Department tidak mengubah Business Workflow, Engineering Document, Audit Trail, Notification, maupun riwayat aktivitas User. |

---

### Permission Matrix

| Feature | Admin | Document Owner | Team Process | Team Project |
|---------|:-----:|:--------------:|:------------:|:------------:|
| View Department Management | ✓ | — | — | — |
| View Department List | ✓ | — | — | — |
| Search Department | ✓ | — | — | — |
| Filter Department | ✓ | — | — | — |
| Create Department | ✓ | — | — | — |
| Edit Department | ✓ | — | — | — |
| Activate Department | ✓ | — | — | — |
| Deactivate Department | ✓ | — | — | — |

---

### Error Handling

Apabila Department Master Data gagal dimuat, sistem harus menampilkan Error State dan menyediakan mekanisme Retry.

Apabila proses Create, Edit, Activate, atau Deactivate Department gagal:

- Data existing tidak boleh berubah.
- Form atau modal tetap mempertahankan data yang telah diinput apabila memungkinkan.
- Sistem menampilkan pesan kesalahan yang dapat dipahami.
- Admin dapat mencoba kembali proses tersebut.

---

### Acceptance Criteria

| AC ID | Acceptance Criteria |
|-------|---------------------|
| AC-DEPT-001 | Hanya Admin yang dapat mengakses Department Management. |
| AC-DEPT-002 | Admin dapat melihat seluruh Department. |
| AC-DEPT-003 | Admin dapat menambahkan Department baru. |
| AC-DEPT-004 | Nama Department kosong atau hanya spasi ditolak. |
| AC-DEPT-005 | Nama Department duplikat ditolak secara case-insensitive. |
| AC-DEPT-006 | Department baru berstatus Active tersedia pada Create User dan Edit User. |
| AC-DEPT-007 | Admin dapat memperbarui nama Department. |
| AC-DEPT-008 | Admin dapat menonaktifkan Department. |
| AC-DEPT-009 | Department Inactive tidak tersedia untuk assignment User baru. |
| AC-DEPT-010 | User existing tetap mempertahankan Department yang telah Inactive. |
| AC-DEPT-011 | Admin dapat mengaktifkan kembali Department. |
| AC-DEPT-012 | Department yang diaktifkan kembali tersedia untuk assignment User baru. |
| AC-DEPT-013 | Department Management tidak menyediakan hard delete. |
| AC-DEPT-014 | Search dan Filter Status Department bekerja sesuai spesifikasi. |
| AC-DEPT-015 | Perubahan Department tidak mengubah Official Role, Permission, Authentication, Business Workflow, maupun riwayat User. |

---

### Cross Reference

Bagian ini mengacu pada:

- PART 2 — Product Overview → 2.5 Application Layout Architecture
- PART 3 — Authentication
- PART 9.4 — User Domain
- PART 9.5 — User Management Table
- PART 9.6 — User Management Form
- PART 9.7 — User Management Behaviour
- PART 9.8 — Permission Matrix
- ACCESS-CONTROL.md

---

## PART 9 Completion

Dengan selesainya PART 9, spesifikasi berikut telah didefinisikan secara lengkap:

- User Management Overview
- User Management Objectives
- User Management Layout
- User Domain
- User Management Table
- User Management Form
- User Management Behaviour
- Department Management
- Department Master Data
- Department Lifecycle
- Permission Matrix
- Error Handling

PART 9 dinyatakan **Complete** dan menjadi **Single Source of Truth** untuk seluruh spesifikasi User Management dan Department Management pada Engineering Document Management System (EDMS).

---

# ==============================================================================
# PART 10 — ROLE MANAGEMENT
# 10.1 Overview
# ==============================================================================

## 10.1 Overview

Role Management merupakan modul yang mendefinisikan Official Role yang digunakan pada Engineering Document Management System (EDMS).

Modul ini bertanggung jawab untuk mendefinisikan tanggung jawab setiap Official Role sebagai dasar penggunaan sistem, Business Workflow, serta akses terhadap setiap modul yang tersedia pada EDMS.

Role Management menggunakan pendekatan **Fixed Role Strategy**, sehingga Official Role ditentukan sebagai bagian dari arsitektur sistem dan tidak dikelola melalui proses Create, Edit, maupun Delete Role.

Seluruh pengguna yang terdaftar pada EDMS wajib memiliki tepat satu Official Role sebagaimana didefinisikan pada PART ini.

---

### Architecture Principle

Role Management merupakan **Official Role Definition Domain**.

Domain ini tidak digunakan untuk mengelola akun pengguna maupun Permission pada masing-masing modul.

Sebaliknya, Role Management menjadi acuan utama mengenai:

- Definisi Official Role.
- Tanggung jawab setiap Official Role.
- Hubungan Official Role dengan Business Workflow.
- Hubungan Official Role dengan modul-modul pada EDMS.

Detail hak akses terhadap masing-masing modul tetap didefinisikan pada PART yang bersangkutan sebagai **Single Source of Truth**.

---

### Fixed Role Strategy

Engineering Document Management System (EDMS) menggunakan strategi **Fixed Role**, sehingga Official Role telah ditentukan sebagai bagian dari desain sistem.

Official Role yang digunakan pada versi ini terdiri dari:

- Admin
- Document Owner
- Team Process
- Team Project

Penambahan maupun perubahan Official Role berada di luar ruang lingkup versi ini dan dapat dipertimbangkan pada pengembangan berikutnya.

---

### Source of Truth

PART 10 menjadi **Single Source of Truth** untuk:

- Official Role Definition
- Official Role Responsibility
- Fixed Role Strategy
- User & Role Relationship

Definisi Permission pada setiap modul tetap mengacu pada PART masing-masing.

Pengelolaan akun pengguna mengacu pada **PART 9 — User Management**.

# ==============================================================================
# PART 10 — ROLE MANAGEMENT
# 10.2 Objectives
# ==============================================================================

## 10.2 Objectives

Role Management dirancang untuk menyediakan definisi Official Role yang digunakan sebagai dasar pembagian tanggung jawab pada Engineering Document Management System (EDMS).

Modul ini memastikan definisi Official Role tersedia secara konsisten, sedangkan assignment Official Role kepada User dilakukan melalui Project Membership.

Role Management tidak digunakan untuk mengelola akun pengguna maupun mengatur Permission setiap modul secara langsung.

---

### Business Objectives

PART 10 dikembangkan untuk mencapai tujuan berikut:

- Menyediakan definisi Official Role yang digunakan pada EDMS.
- Menetapkan tanggung jawab utama setiap Official Role.
- Mendukung Fixed Role Strategy sebagai dasar pembagian tanggung jawab pengguna.
- Menjadi acuan hubungan antara Official Role dengan Business Workflow.
- Menjaga konsistensi penggunaan Official Role pada seluruh modul EDMS.

---

### Design Objectives

Role Management dikembangkan berdasarkan prinsip berikut:

- **Role Definition First** — Role didefinisikan sebagai bagian dari arsitektur sistem.
- **Fixed Role Strategy** — Official Role bersifat tetap dan tidak dikelola melalui proses administrasi.
- **Single Responsibility** — Setiap Official Role memiliki tanggung jawab utama yang jelas.
- **Cross Module Consistency** — Definisi Official Role digunakan secara konsisten oleh seluruh modul.
- **Single Source of Truth** — Definisi Official Role hanya dikelola pada PART 10.

---

### Architecture Note

Role Management hanya bertanggung jawab terhadap definisi Official Role beserta tanggung jawab utamanya.

Pengelolaan akun pengguna mengacu pada **PART 9 — User Management**, sedangkan Permission pada setiap modul tetap menjadi tanggung jawab PART yang bersangkutan sesuai prinsip **Single Source of Truth**.

Official Role digunakan sebagai dasar pembagian tanggung jawab pada Business Workflow, namun tidak mendefinisikan ulang Business Workflow yang telah ditetapkan pada **BUSINESS-WORKFLOW.md**.

# ==============================================================================
# PART 10 — ROLE MANAGEMENT
# 10.3 Role Management Layout
# ==============================================================================

## 10.3 Role Management Layout

Role Management menggunakan **Application Layout Architecture** sebagaimana didefinisikan pada **PART 2 — Product Overview → 2.5 Application Layout Architecture**.

PART ini hanya mendefinisikan layout pada area Role Management yang berada di dalam **Main Content Area**.

Seluruh elemen di luar Main Content Area, termasuk Navigation Sidebar, Top Navigation Bar, Footer, dan struktur halaman aplikasi mengikuti spesifikasi yang telah didefinisikan pada PART 2.

---

### Module Entry

Role Management diakses melalui menu **User Management**.

Menu ini hanya tersedia bagi pengguna dengan Official Role **Admin**.

Ketika dipilih, sistem menampilkan halaman **Role Management** sebagai katalog resmi Official Role yang digunakan pada Engineering Document Management System (EDMS).

---

### Layout Components

Halaman Role Management terdiri dari komponen utama berikut:

- Page Header
- Official Role List
- Official Role Detail

**Page Header** menampilkan judul halaman Role Management.

**Official Role List** menampilkan seluruh Official Role yang digunakan pada EDMS.

Ketika salah satu Official Role dipilih, sistem menampilkan **Official Role Detail** yang berisi informasi lengkap mengenai Role tersebut.

Role Management tidak menyediakan fungsi Create Role, Edit Role, maupun Delete Role.

---

### Responsive Behaviour

Layout Role Management harus tetap dapat digunakan pada berbagai ukuran layar tanpa mengurangi keterbacaan informasi.

Pada perangkat dengan ukuran layar yang lebih kecil, Official Role List dan Official Role Detail harus tetap mudah diakses dengan tata letak yang menyesuaikan ukuran layar.

---

### Design Principles

Layout Role Management dikembangkan berdasarkan prinsip berikut:

- Simple
- Informative
- Consistent
- Readability First

Role Management merupakan halaman referensi Official Role dan bukan modul administrasi Role.

Layout dirancang untuk membantu pengguna memahami tanggung jawab setiap Official Role secara cepat dan konsisten.

---

### Cross Reference

Bagian ini mengacu pada:

- PART 2 — Product Overview → 2.5 Application Layout Architecture
- PART 10.4 — Official Role Domain
- PART 10.5 — Official Role Catalog

# ==============================================================================
# PART 10 — ROLE MANAGEMENT
# 10.4 Official Role Domain
# ==============================================================================

## 10.4 Official Role Domain

Official Role Domain merupakan domain yang bertanggung jawab untuk mendefinisikan seluruh Official Role yang digunakan pada Engineering Document Management System (EDMS).

Setiap Official Role merepresentasikan satu tanggung jawab bisnis yang digunakan sebagai dasar pembagian tugas, Business Workflow, serta akses terhadap modul-modul yang tersedia pada sistem.

Official Role bukan merupakan akun pengguna dan tidak berubah selama siklus hidup pengguna.

Sebaliknya, Official Role diberikan kepada User melalui **Project Membership** sebagaimana didefinisikan pada **PART 14 — Multi Project Management**.

---

### Official Role Definition

Engineering Document Management System (EDMS) menggunakan empat Official Role, yaitu:

- Admin
- Document Owner
- Team Process
- Team Project

Setiap Official Role memiliki tanggung jawab bisnis yang berbeda dan digunakan secara konsisten pada seluruh modul EDMS.

---

### Fixed Role Strategy

Official Role menggunakan pendekatan **Fixed Role Strategy**.

Daftar Official Role ditentukan sebagai bagian dari arsitektur sistem dan tidak dikelola melalui proses administrasi.

Penambahan, pengurangan, maupun perubahan Official Role berada di luar ruang lingkup versi ini.

---

### Role Scope

Engineering Document Management System (EDMS) menggunakan dua ruang lingkup Official Role.

#### System-Level Role

System-Level Role berlaku pada tingkat aplikasi dan digunakan untuk kebutuhan administrasi sistem.

Official Role yang termasuk System-Level Role adalah:

- Admin

#### Project-Scoped Official Role

Project-Scoped Official Role hanya berlaku pada satu Project melalui **Project Membership**.

Official Role yang termasuk Project-Scoped Official Role adalah:

- Admin, khusus sebagai Initial Project Membership untuk Creator Project.
- Document Owner
- Team Process
- Team Project

Admin pada Project Membership digunakan untuk administrasi Project dan tidak menjadi Current Assignee pada Business Workflow Document.

Satu User Account dapat memiliki Official Role yang berbeda pada Project yang berbeda.

Perubahan Official Role pada satu Project tidak mempengaruhi Official Role pengguna pada Project lainnya maupun Business Workflow.

---

### User & Role Relationship

Hubungan antara User Account dan Official Role dikelola melalui **Project Membership**.

Satu User Account dapat memiliki lebih dari satu Project Membership.

Setiap Project Membership memiliki tepat satu Official Role.

Satu Official Role dapat dimiliki oleh banyak User Account pada Project yang berbeda maupun pada Project yang sama sesuai kebutuhan bisnis.

Hubungan antara User Account dan Official Role digunakan sebagai dasar identifikasi tanggung jawab pengguna pada setiap Project.

---

### Role Responsibility

Official Role digunakan untuk:

- Menentukan tanggung jawab utama pengguna.
- Mendukung pelaksanaan Business Workflow.
- Menjadi dasar pemberian akses pada setiap modul.
- Menjaga konsistensi penggunaan Role di seluruh sistem.

Detail hak akses pada masing-masing modul tetap mengacu pada PART yang bersangkutan sebagai **Single Source of Truth**.

---

### Domain Principles

Official Role Domain dikembangkan berdasarkan prinsip berikut:

- Fixed Role Strategy
- Project-Scoped Official Role
- System-Level Administration
- Shared Role Assignment
- Business Responsibility First
- Cross Module Consistency

---

### Architecture Note

Official Role hanya mendefinisikan identitas peran bisnis yang digunakan pada EDMS.

Domain ini tidak mengelola:

- Authentication
- User Identity
- Permission
- Business Workflow

Masing-masing domain tersebut mengacu pada Source of Truth yang telah ditentukan pada PART terkait.

# ==============================================================================
# PART 10 — ROLE MANAGEMENT
# 10.5 Official Role Catalog
# ==============================================================================

## 10.5 Official Role Catalog

Official Role Catalog merupakan referensi resmi yang menjelaskan setiap Official Role yang digunakan pada Engineering Document Management System (EDMS).

Setiap Official Role memiliki tujuan bisnis, tanggung jawab utama, serta hubungan dengan Business Workflow dan modul-modul pada sistem.

Official Role Catalog tidak digunakan untuk mengelola Permission secara rinci.

Detail Permission tetap mengacu pada PART masing-masing sesuai prinsip **Single Source of Truth**.

---

### Admin

**Description**

Admin merupakan Official Role yang bertanggung jawab terhadap administrasi sistem EDMS.

Role ini memastikan konfigurasi administrasi berjalan dengan baik dan mendukung operasional seluruh pengguna sistem.

**Primary Responsibility**

- Mengelola akun pengguna.
- Mengelola informasi administrasi sistem.
- Memastikan konfigurasi sistem tersedia untuk seluruh pengguna.

**Business Function**

Admin mendukung operasional sistem dan tidak menjadi bagian dari proses Review maupun Approval Engineering Document.

Admin dengan Project Membership Active dapat membantu operasional Project melalui Upload Revision Override pada Document yang berada dalam status Process Comment, Process Reject, Project Comment, atau Project Reject.

Override tersebut tetap dibatasi oleh Project Context, Permission, Project Membership Active, dan Workflow Status yang didefinisikan pada BUSINESS-WORKFLOW.md.

Admin tidak menjadi Current Assignee dan tidak memperoleh hak Approval A/B/C melalui override tersebut.

**Reference Module**

- PART 9 — User Management
- PART 11 — User Profile

---

### Document Owner

**Description**

Document Owner merupakan Official Role yang bertanggung jawab terhadap pengelolaan Engineering Document yang menjadi tanggung jawabnya.

Role ini menjadi titik awal proses Business Workflow sebelum dokumen memasuki proses Review.

**Primary Responsibility**

- Mengelola Engineering Document.
- Melakukan Upload Revision.
- Menindaklanjuti hasil Review sesuai Business Workflow.

**Business Function**

Document Owner bertanggung jawab menjaga kelengkapan dan keberlangsungan siklus hidup Engineering Document.

**Reference Module**

- BUSINESS-WORKFLOW.md
- PART 5 — Document Register
- PART 6 — SLA Monitoring

---

### Team Process

**Description**

Team Process merupakan Official Role yang bertanggung jawab melakukan Process Review terhadap Engineering Document.

Role ini melakukan evaluasi dokumen pada tahapan Process Review sesuai Business Workflow.

**Primary Responsibility**

- Melakukan Process Review.
- Memberikan keputusan Review sesuai Business Workflow.
- Mengembalikan dokumen apabila diperlukan perbaikan.

**Business Function**

Team Process memastikan Engineering Document memenuhi kebutuhan Process sebelum diteruskan ke tahapan berikutnya.

**Reference Module**

- BUSINESS-WORKFLOW.md
- PART 5 — Document Register
- PART 6 — SLA Monitoring

---

### Team Project

**Description**

Team Project merupakan Official Role yang bertanggung jawab melakukan Project Review terhadap Engineering Document.

Role ini melakukan evaluasi dokumen pada tahapan Project Review sesuai Business Workflow.

**Primary Responsibility**

- Melakukan Project Review.
- Memberikan keputusan Review sesuai Business Workflow.
- Menyelesaikan proses Review sebelum dokumen dinyatakan Approved.

**Business Function**

Team Project memastikan Engineering Document memenuhi kebutuhan Project sebelum proses Engineering Document selesai.

**Reference Module**

- BUSINESS-WORKFLOW.md
- PART 5 — Document Register
- PART 6 — SLA Monitoring

---

### Architecture Note

Official Role Catalog hanya menjelaskan definisi dan tanggung jawab setiap Official Role.

Official Role Catalog tidak mendefinisikan:

- Permission Matrix
- Business Workflow
- Authentication
- User Management

Masing-masing tetap mengacu pada Source of Truth yang telah ditetapkan pada PART terkait.

# ==============================================================================
# PART 10 — ROLE MANAGEMENT
# 10.6 Role Behaviour
# ==============================================================================

## 10.6 Role Behaviour

Official Role digunakan sebagai dasar pembagian tanggung jawab pengguna pada Engineering Document Management System (EDMS).

Role Behaviour menjelaskan bagaimana Official Role diterapkan kepada User dan digunakan secara konsisten oleh seluruh modul pada sistem.

Official Role tidak berubah selama proses operasional sistem dan tidak dikelola melalui proses administrasi.

---

### Role Assignment Behaviour

Official Role operasional diberikan kepada User melalui **Project Membership**.

Setiap Project Membership memiliki tepat satu Official Role.

Official Role tidak ditetapkan pada saat User Account dibuat.

Perubahan Official Role dilakukan melalui **Project Membership Management** dan tidak melalui proses Edit User.

---

### Project-Scoped Role Behaviour

Official Role operasional diberikan kepada User melalui **Project Membership**.

User Management hanya membuat User Account dan tidak menetapkan Official Role operasional untuk seluruh Project.

Setiap Project Membership memiliki tepat satu Official Role.

Satu User Account dapat memiliki Official Role yang berbeda pada Project yang berbeda.

Perubahan Official Role dilakukan melalui **Project Membership Management** sebagaimana didefinisikan pada **PART 14 — Multi Project Management**.

Perubahan Official Role pada satu Project tidak mempengaruhi Official Role pengguna pada Project lainnya.

---

### Fixed Role Behaviour

Official Role menggunakan pendekatan **Fixed Role Strategy**.

Seluruh Official Role telah ditentukan sebagai bagian dari arsitektur sistem.

Sistem tidak menyediakan mekanisme untuk membuat, mengubah, maupun menghapus Official Role.

---

### Business Workflow Behaviour

Official Role digunakan sebagai dasar pembagian tanggung jawab pada Business Workflow.

Setiap tahapan Business Workflow menentukan Official Role yang bertanggung jawab terhadap aktivitas tersebut.

Pelaksanaan Business Workflow tetap mengacu pada **BUSINESS-WORKFLOW.md** sebagai Source of Truth.

---

### Module Behaviour

Official Role digunakan oleh setiap modul untuk menentukan fungsi yang tersedia bagi pengguna.

Implementasi hak akses tetap didefinisikan pada PART masing-masing sesuai prinsip **Single Source of Truth**.

Role Management tidak mendefinisikan ulang Permission setiap modul.

---

### Consistency Behaviour

Perubahan Official Role pada User hanya mempengaruhi penggunaan sistem setelah perubahan tersebut disimpan.

Perubahan Official Role tidak mengubah:

- Engineering Document yang telah tercatat.
- Audit Trail yang telah tersimpan.
- Notification yang telah dikirim.
- Riwayat Business Workflow yang telah selesai.
- Official Role pengguna pada Project lainnya.

Seluruh riwayat aktivitas tetap mempertahankan referensi terhadap pengguna yang melaksanakan aktivitas tersebut.

---

### Architecture Principles

Role Behaviour dikembangkan berdasarkan prinsip berikut:

- Fixed Role Strategy
- Project-Scoped Official Role
- Business Responsibility First
- Cross Module Consistency
- Data Integrity

Role Behaviour memastikan penggunaan Official Role tetap konsisten pada seluruh modul tanpa menduplikasi aturan bisnis yang telah didefinisikan pada Source of Truth masing-masing.

---

### Cross Reference

Bagian ini mengacu pada:

- BUSINESS-WORKFLOW.md
- PART 9 — User Management
- PART 10.4 — Official Role Domain
- PART 10.5 — Official Role Catalog

# ==============================================================================
# PART 10 — ROLE MANAGEMENT
# 10.7 Permission Reference
# ==============================================================================

## 10.7 Permission Reference

Role Management tidak mendefinisikan Permission secara rinci untuk setiap modul pada Engineering Document Management System (EDMS).

PART ini hanya mendefinisikan Official Role sebagai dasar pembagian tanggung jawab pengguna.

Implementasi Permission tetap menjadi tanggung jawab masing-masing modul sesuai prinsip **Single Source of Truth**.

---

### Permission Philosophy

Permission pada EDMS dikelola secara terdistribusi berdasarkan domain bisnis masing-masing.

Setiap modul bertanggung jawab mendefinisikan hak akses yang berkaitan dengan fungsi bisnisnya sendiri.

Pendekatan ini menjaga konsistensi dokumentasi serta menghindari duplikasi definisi Permission pada beberapa PART.

---

### Permission Ownership

Permission untuk setiap modul mengacu pada Source of Truth berikut:

| Module | Permission Reference |
|----------|----------------------|
| Dashboard | PART 4 — Dashboard |
| Document Register | PART 5 — Document Register |
| SLA Monitoring | PART 6 — SLA Monitoring |
| Audit Trail | PART 7 — Audit Trail |
| Notification | PART 8 — Notification |
| User Management | PART 9 — User Management |
| User Profile | PART 11 — User Profile |

---

### Role Relationship

Official Role digunakan oleh seluruh modul sebagai dasar penentuan hak akses.

Namun Role Management tidak mendefinisikan:

- Hak akses terhadap fitur.
- Visibility komponen antarmuka.
- Business Rule setiap modul.

Seluruh aturan tersebut mengacu pada PART yang bersangkutan.

---

### Architecture Principles

Permission Reference dikembangkan berdasarkan prinsip berikut:

- Single Source of Truth
- Domain Ownership
- No Permission Duplication
- Cross Module Consistency

Setiap perubahan Permission hanya dilakukan pada PART yang menjadi pemilik modul tersebut.

Role Management secara otomatis mengikuti perubahan tersebut tanpa mendefinisikan ulang Permission.

---

### Architecture Note

Apabila terjadi perubahan Permission pada suatu modul, perubahan hanya dilakukan pada PART yang menjadi Source of Truth modul tersebut.

PART 10 tidak memerlukan perubahan selama tidak terjadi perubahan terhadap Official Role yang digunakan oleh sistem.

Perubahan terhadap Official Role tetap mengacu pada PART 10 sebagai Single Source of Truth.

# ==============================================================================
# PART 10 — ROLE MANAGEMENT
# 10.8 Role Summary
# ==============================================================================

## 10.8 Role Summary

Role Summary memberikan ringkasan mengenai setiap Official Role yang digunakan pada Engineering Document Management System (EDMS).

Bagian ini berfungsi sebagai referensi cepat untuk memahami tanggung jawab utama setiap Official Role beserta hubungan dengan modul-modul yang tersedia pada sistem.

Role Summary tidak menggantikan definisi Official Role maupun Permission yang telah didefinisikan pada PART terkait.

---

### Official Role Summary

| Official Role | Primary Responsibility | Primary Module Reference |
|---------------|------------------------|--------------------------|
| Admin | Mengelola administrasi sistem dan akun pengguna. | PART 9 — User Management |
| Document Owner | Mengelola Engineering Document dan melakukan Upload Revision. | BUSINESS-WORKFLOW.md, PART 5 — Document Register |
| Team Process | Melakukan Process Review sesuai Business Workflow. | BUSINESS-WORKFLOW.md, PART 5 — Document Register |
| Team Project | Melakukan Project Review sesuai Business Workflow. | BUSINESS-WORKFLOW.md, PART 5 — Document Register |

---

### Role Relationship Summary

Seluruh Official Role saling melengkapi dalam mendukung siklus hidup Engineering Document.

Hubungan antar Official Role mengikuti Business Workflow yang telah ditetapkan dan bukan hubungan hierarki organisasi.

Setiap Official Role memiliki tanggung jawab yang berbeda namun saling terhubung untuk menyelesaikan proses Engineering Document secara end-to-end.

---

### Module Relationship Summary

Official Role digunakan oleh berbagai modul pada EDMS sebagai dasar pelaksanaan fungsi bisnis.

| Module | Relationship |
|----------|--------------|
| Authentication | Mengidentifikasi User Identity dan Session. |
| Document Register | Menyediakan fungsi sesuai Active Project Membership Official Role. |
| SLA Monitoring | Menampilkan aktivitas sesuai Business Workflow dan Official Role. |
| Audit Trail | Mencatat aktivitas pengguna beserta Official Role pada Project Context saat aktivitas terjadi. |
| Notification | Mengirim Notification kepada pengguna sesuai Project Membership, Official Role, dan Business Workflow. |
| User Management | Mengelola User Identity tanpa menetapkan Official Role operasional. |
| Project Membership | Menetapkan Official Role pengguna pada Project. |
| User Profile | Menampilkan Official Role dari Active Project Membership. |

---

### Architecture Principles

Role Summary dikembangkan berdasarkan prinsip berikut:

- Quick Reference
- Business Responsibility
- Cross Module Understanding
- Single Source of Truth

Role Summary berfungsi sebagai ringkasan Official Role dan tidak mendefinisikan ulang Business Workflow maupun Permission.

---

### Architecture Note

Role Summary merupakan dokumentasi referensi yang memudahkan pembaca memahami hubungan antara Official Role dengan modul-modul pada EDMS.

Apabila diperlukan informasi yang lebih rinci mengenai Permission maupun Business Rule, pembaca harus mengacu pada PART yang menjadi Source of Truth masing-masing.\\# ==============================================================================
# PART 10 — ROLE MANAGEMENT
# 10.9 Error Handling
# ==============================================================================

## 10.9 Error Handling

Role Management harus tetap memberikan informasi Official Role secara konsisten meskipun terjadi gangguan pada proses pemuatan data.

Error Handling pada PART ini hanya mempengaruhi tampilan Official Role Catalog dan tidak mengubah User Management, Authentication, Permission, Business Workflow, maupun Engineering Document.

---

### Error Handling Rules

Apabila terjadi kegagalan saat memuat Role Management, sistem harus:

- Menampilkan Error State yang menjelaskan bahwa informasi Official Role tidak dapat dimuat.
- Menyediakan mekanisme Retry untuk memuat kembali informasi Official Role.
- Tidak menampilkan informasi Official Role yang tidak lengkap maupun tidak konsisten.

Apabila tidak terdapat Official Role yang dapat ditampilkan, sistem harus menampilkan **Empty State** dan bukan **Error State**.

---

### Recovery Behaviour

Setelah proses Recovery berhasil, sistem harus:

- Memuat kembali Official Role Catalog terbaru.
- Menampilkan informasi Official Role secara lengkap.
- Memastikan seluruh hubungan referensi menuju PART terkait tetap tersedia.

Recovery tidak mengubah:

- Official Role
- User
- Permission
- Business Workflow
- Engineering Document

Recovery hanya memulihkan tampilan Role Management.

---

### Acceptance Criteria

| AC ID | Acceptance Criteria |
|--------|---------------------|
| AC-ROLE-ERR-001 | Sistem menampilkan Error State apabila Official Role Catalog gagal dimuat. |
| AC-ROLE-ERR-002 | Pengguna dapat melakukan Retry untuk memuat kembali Official Role Catalog. |
| AC-ROLE-ERR-003 | Empty State ditampilkan apabila tidak terdapat Official Role yang tersedia. |
| AC-ROLE-ERR-004 | Recovery berhasil menampilkan kembali Official Role Catalog. |
| AC-ROLE-ERR-005 | Recovery tidak mengubah Official Role yang digunakan oleh sistem. |
| AC-ROLE-ERR-006 | Recovery tidak mempengaruhi User Management, Authentication, Permission, Business Workflow, maupun Engineering Document. |

---

### Architecture Note

Role Management merupakan modul referensi Official Role.

Error Handling pada PART ini hanya berkaitan dengan kegagalan penyajian informasi Official Role dan tidak mengubah konfigurasi sistem maupun data bisnis.

Apabila terjadi perubahan terhadap Official Role, perubahan tersebut dilakukan melalui proses pengembangan sistem dan bukan melalui mekanisme yang didefinisikan pada PART ini.

---

### Cross Reference

Bagian ini mengacu pada:

- PART 3 — Authentication
- PART 9 — User Management
- PART 10.5 — Official Role Catalog
- PART 10.7 — Permission Reference

# ==============================================================================
# PART 10 — ROLE MANAGEMENT
# 10.10 Cross Reference
# ==============================================================================

## 10.10 Cross Reference

PART 10 — Role Management dibangun berdasarkan Application Architecture, Authentication, User Management, serta Business Workflow yang telah didefinisikan pada dokumen maupun PART terkait.

Role Management berfungsi sebagai **Single Source of Truth** untuk seluruh definisi Official Role yang digunakan pada Engineering Document Management System (EDMS).

---

### Reference Matrix

| Reference | Purpose |
|-----------|---------|
| PART 2 — Product Overview → 2.5 Application Layout Architecture | Menjadi Source of Truth untuk Application Layout Architecture. |
| PART 3 — Authentication | Menjadi Source of Truth untuk Authentication, Login Behaviour, Session Management, dan Logout. |
| BUSINESS-WORKFLOW.md | Menjadi Source of Truth untuk Business Workflow yang menggunakan Official Role sebagai dasar pembagian tanggung jawab. |
| ACCESS-CONTROL.md | Menjadi Source of Truth untuk Access Control Architecture. |
| PART 9 — User Management | Menjadi Source of Truth untuk User Identity dan User Administration. |
| PART 14 — Multi Project Management | Menjadi Source of Truth untuk Project Membership sebagai assignment Official Role pengguna pada Project. |
| PART 11 — User Profile | Menjadi Source of Truth untuk informasi Official Role yang ditampilkan pada akun pengguna yang sedang login. |

---

### Dependency Summary

PART 10 mendefinisikan Official Role yang digunakan secara konsisten pada seluruh modul EDMS.

PART 10 tidak mendefinisikan ulang:

- Authentication
- User Identity
- Permission
- Business Workflow
- Notification
- Engineering Document

Seluruh domain tersebut tetap mengacu pada Source of Truth masing-masing.

Sebaliknya, seluruh modul yang menggunakan Official Role wajib mengacu pada PART 10 sebagai referensi resmi definisi Role.

---

### Implementation Note

Apabila terjadi perubahan terhadap:

- Definisi Official Role
- Fixed Role Strategy
- Hubungan User dan Official Role

maka perubahan dilakukan terlebih dahulu pada PART 10 sebagai **Single Source of Truth**.

Apabila terjadi perubahan terhadap:

- Permission
- Business Workflow
- Authentication
- User Management

maka perubahan dilakukan pada PART yang menjadi pemilik domain tersebut.

PART 10 hanya disesuaikan apabila perubahan tersebut mempengaruhi definisi Official Role.

---

## PART 10 Completion

Dengan selesainya PART 10, spesifikasi berikut telah didefinisikan secara lengkap:

- Role Management Overview
- Role Management Objectives
- Role Management Layout
- Official Role Domain
- Official Role Catalog
- Role Behaviour
- Permission Reference
- Role Summary
- Error Handling

PART 10 dinyatakan **Complete** dan menjadi **Single Source of Truth** untuk seluruh definisi Official Role pada Engineering Document Management System (EDMS).

# ==============================================================================
# PART 11 — USER PROFILE
# 11.1 Overview
# ==============================================================================

## 11.1 Overview

User Profile merupakan modul yang digunakan oleh setiap pengguna untuk mengelola informasi akun miliknya sendiri pada Engineering Document Management System (EDMS).

Modul ini menyediakan fasilitas bagi pengguna untuk memperbarui informasi pribadi yang diperbolehkan serta mengelola kredensial akun melalui proses Change Password.

User Profile hanya berlaku untuk akun pengguna yang sedang login dan tidak digunakan untuk mengelola akun pengguna lain.

---

### Architecture Principle

User Profile merupakan **Personal Account Management Domain**.

Domain ini bertanggung jawab terhadap pengelolaan informasi akun milik pengguna sendiri dan tidak digunakan untuk administrasi pengguna maupun definisi Official Role.

Seluruh perubahan yang dilakukan melalui User Profile hanya mempengaruhi akun pengguna yang sedang login.

---

### Personal Account Scope

Pada versi ini, User Profile terdiri dari dua fungsi utama:

- My Profile
- Change Password

My Profile digunakan untuk mengelola informasi pribadi yang diperbolehkan.

Change Password digunakan untuk memperbarui kredensial akun pengguna.

---

### Source of Truth

PART 11 menjadi **Single Source of Truth** untuk:

- My Profile
- Change Password
- Personal Account Management
- Personal Profile Behaviour

Pengelolaan akun pengguna tetap mengacu pada **PART 9 — User Management**.

Definisi Official Role tetap mengacu pada **PART 10 — Role Management**.

Authentication tetap mengacu pada **PART 3 — Authentication**.

# ==============================================================================
# PART 11 — USER PROFILE
# 11.2 Objectives
# ==============================================================================

## 11.2 Objectives

User Profile dirancang untuk memberikan fasilitas kepada setiap pengguna agar dapat mengelola informasi akun miliknya sendiri secara mandiri tanpa mempengaruhi akun pengguna lain.

Modul ini memastikan pengguna dapat memperbarui informasi pribadi yang diperbolehkan serta menjaga keamanan akun melalui mekanisme Change Password.

User Profile tidak digunakan untuk mengelola User, Official Role, maupun Permission.

---

### Business Objectives

PART 11 dikembangkan untuk mencapai tujuan berikut:

- Memberikan pengguna kendali terhadap informasi akun pribadinya.
- Menyediakan mekanisme perubahan Password yang aman.
- Memisahkan pengelolaan akun pribadi dari administrasi pengguna.
- Menjaga konsistensi identitas pengguna pada seluruh modul EDMS.
- Mendukung keamanan akun melalui pengelolaan kredensial secara mandiri.

---

### Design Objectives

User Profile dikembangkan berdasarkan prinsip berikut:

- **Personal Account Ownership** — Pengguna hanya mengelola akun miliknya sendiri.
- **Identity & Credential Separation** — Informasi profil dan Password dikelola sebagai dua fungsi yang berbeda.
- **Security First** — Perubahan Password mengikuti mekanisme keamanan Authentication.
- **Simple User Experience** — Informasi yang dapat diubah dibatasi pada kebutuhan pengguna.
- **Single Source of Truth** — User Profile menjadi sumber utama untuk pengelolaan akun pribadi.

---

### Architecture Note

User Profile hanya bertanggung jawab terhadap pengelolaan akun pribadi pengguna yang sedang login.

Pengelolaan akun pengguna lain tetap mengacu pada **PART 9 — User Management**.

Definisi Official Role tetap mengacu pada **PART 10 — Role Management**.

Authentication, Login, Logout, Session Management, dan Credential Validation tetap mengacu pada **PART 3 — Authentication**.

# ==============================================================================
# PART 11 — USER PROFILE
# 11.3 User Profile Layout
# ==============================================================================

## 11.3 User Profile Layout

User Profile menggunakan **Application Layout Architecture** sebagaimana didefinisikan pada **PART 2 — Product Overview → 2.5 Application Layout Architecture**.

PART ini hanya mendefinisikan layout pada area User Profile yang berada di dalam **Main Content Area**.

Seluruh elemen di luar Main Content Area, termasuk Navigation Sidebar, Top Navigation Bar, Footer, dan struktur halaman aplikasi mengikuti spesifikasi yang telah didefinisikan pada PART 2.

---

### Module Entry

User Profile diakses melalui **User Dropdown** pada Top Navigation Bar.

Menu ini tersedia untuk seluruh pengguna yang telah berhasil Login.

Ketika dipilih, sistem menampilkan halaman **User Profile** yang berisi informasi akun pengguna yang sedang Login.

---

### Layout Components

Halaman User Profile terdiri dari komponen utama berikut:

- Page Header
- My Profile Section
- Change Password Section

**Page Header** menampilkan judul halaman User Profile.

**My Profile Section** menampilkan informasi identitas akun pengguna.

**Change Password Section** digunakan untuk memperbarui Password akun pengguna.

Kedua section ditampilkan dalam satu halaman sehingga pengguna dapat mengelola akun pribadinya tanpa berpindah halaman.

---

### Responsive Behaviour

Layout User Profile harus tetap dapat digunakan pada berbagai ukuran layar.

Pada perangkat dengan ukuran layar yang lebih kecil, seluruh field dan komponen harus menyesuaikan tata letak tanpa mengurangi keterbacaan maupun kemudahan penggunaan.

---

### Design Principles

Layout User Profile dikembangkan berdasarkan prinsip berikut:

- Simple
- Personal
- Consistent
- Readability First

User Profile dirancang sebagai halaman pengelolaan akun pribadi sehingga seluruh informasi dan tindakan yang tersedia hanya berkaitan dengan akun pengguna yang sedang Login.

---

### Cross Reference

Bagian ini mengacu pada:

- PART 2 — Product Overview → 2.5 Application Layout Architecture
- PART 11.4 — User Profile Domain
- PART 11.5 — My Profile
- PART 11.6 — Change Password

# ==============================================================================
# PART 11 — USER PROFILE
# 11.4 User Profile Domain
# ==============================================================================

## 11.4 User Profile Domain

User Profile Domain merupakan domain yang bertanggung jawab terhadap pengelolaan akun pribadi pengguna yang sedang Login pada Engineering Document Management System (EDMS).

Domain ini menyediakan ruang bagi setiap pengguna untuk melihat informasi akun pribadinya, memperbarui informasi yang diperbolehkan, serta mengelola Password tanpa mempengaruhi akun pengguna lain.

User Profile Domain tidak digunakan untuk mengelola User, Official Role, maupun Permission.

---

### Personal Identity

User Profile merepresentasikan identitas pribadi dari pengguna yang sedang Login.

Informasi identitas tersebut meliputi:

- Name
- Username
- Email
- Department
- Official Role

Informasi tersebut digunakan sebagai identitas akun pengguna selama menggunakan Engineering Document Management System (EDMS).

---

### Profile Ownership

Setiap User hanya dapat mengakses User Profile miliknya sendiri.

User tidak diperbolehkan melihat maupun mengelola User Profile milik pengguna lain melalui modul ini.

Pengelolaan akun pengguna lain tetap mengacu pada **PART 9 — User Management**.

---

### Profile Scope

User Profile hanya mengelola informasi pribadi yang menjadi ruang lingkup akun pengguna.

Domain ini terdiri dari dua fungsi utama:

- My Profile
- Change Password

Pengelolaan Official Role, Department, maupun User Management berada di luar ruang lingkup User Profile.

---

### User Relationship

User Profile merupakan representasi akun pribadi dari User yang sedang Login.

Setiap perubahan yang dilakukan melalui User Profile hanya mempengaruhi akun pengguna tersebut dan tidak mempengaruhi User lain yang terdaftar pada sistem.

---

### Domain Principles

User Profile Domain dikembangkan berdasarkan prinsip berikut:

- Personal Account Ownership
- Identity & Credential Separation
- Single User Context
- Security First
- Data Integrity

---

### Architecture Note

User Profile hanya bertanggung jawab terhadap pengelolaan akun pribadi pengguna yang sedang Login.

Domain ini tidak mengelola:

- User Management
- Official Role
- Permission
- Authentication
- Business Workflow

Masing-masing domain tetap mengacu pada Source of Truth yang telah ditetapkan pada PART terkait.

# ==============================================================================
# PART 11 — USER PROFILE
# 11.5 My Profile
# ==============================================================================

## 11.5 My Profile

My Profile merupakan fitur yang digunakan oleh pengguna untuk melihat dan mengelola informasi akun pribadinya pada Engineering Document Management System (EDMS).

Halaman ini hanya menampilkan informasi milik pengguna yang sedang Login.

Pengguna tidak dapat mengakses maupun mengelola informasi akun pengguna lain melalui My Profile.

---

### Profile Information

My Profile menampilkan informasi berikut:

| Field | Description |
|---------|-------------|
| Name | Nama pengguna. |
| Username | Username yang digunakan untuk Login ke sistem. |
| Email | Alamat Email pengguna. |
| Department | Department pengguna. |
| Official Role | Official Role pada Active Project apabila Active Project tersedia. |

Dalam arsitektur Multi Project, Official Role yang ditampilkan pada My Profile mengikuti Active Project Membership.

Apabila Active Project berubah, Official Role pada My Profile ikut berubah sesuai Project Membership pada Project yang sedang aktif.

Legacy Official Role pada User Account tidak digunakan sebagai sumber Authorization Project-Scoped setelah User memiliki Project Membership.

---

### Editable Information

Pengguna dapat memperbarui informasi berikut:

| Field | Editable |
|---------|:--------:|
| Name | ✓ |
| Email | ✓ |

Informasi yang diperbarui merupakan bagian dari identitas pribadi pengguna.

---

### Read Only Information

Informasi berikut hanya ditampilkan sebagai referensi dan tidak dapat diubah melalui My Profile.

| Field | Status |
|---------|--------|
| Username | Read Only |
| Department | Read Only |
| Official Role | Read Only |

Perubahan terhadap informasi tersebut hanya dapat dilakukan melalui domain yang menjadi Source of Truth masing-masing.

---

### Information Scope

My Profile hanya mengelola informasi pribadi milik pengguna yang sedang Login.

Fitur ini tidak digunakan untuk:

- Mengubah Official Role.
- Mengubah Department.
- Mengelola akun pengguna lain.
- Mengubah Permission.
- Mengubah Business Workflow.

---

### Architecture Principles

My Profile dikembangkan berdasarkan prinsip berikut:

- Personal Ownership
- Editable Personal Information
- Read Only Organization Information
- Simple User Experience
- Single Source of Truth

Informasi organisasi tetap dikelola oleh domain yang menjadi pemiliknya, sedangkan My Profile hanya mengelola informasi pribadi pengguna.

---

### Cross Reference

Bagian ini mengacu pada:

- PART 3 — Authentication
- PART 9 — User Management
- PART 10 — Role Management
- PART 11.6 — Change Password
- ACCESS-CONTROL.md

# ==============================================================================
# PART 11 — USER PROFILE
# 11.6 Change Password
# ==============================================================================

## 11.6 Change Password

Change Password merupakan fitur yang digunakan oleh pengguna untuk memperbarui Password akun miliknya sendiri pada Engineering Document Management System (EDMS).

Fitur ini hanya dapat digunakan oleh pengguna yang sedang Login dan tidak dapat digunakan untuk mengubah Password akun pengguna lain.

Perubahan Password dilakukan sebagai bagian dari pengelolaan akun pribadi dan mengikuti mekanisme Authentication yang telah didefinisikan pada **PART 3 — Authentication**.

---

### Password Update

Change Password menggunakan informasi berikut:

| Field | Description |
|---------|-------------|
| Current Password | Password yang sedang digunakan oleh pengguna. |
| New Password | Password baru yang akan digunakan. |
| Confirm Password | Konfirmasi Password baru. |

Ketiga field tersebut wajib diisi untuk melakukan proses perubahan Password.

---

### Security Scope

Change Password hanya digunakan untuk memperbarui Password akun pengguna yang sedang Login.

Fitur ini tidak digunakan untuk:

- Mengubah Password pengguna lain.
- Mengubah User Profile pengguna lain.
- Mengubah User Management.
- Mengubah Official Role.
- Mengubah Permission.

---

### Logout Behaviour

Apabila proses perubahan Password berhasil diselesaikan, sistem harus:

- Mengakhiri Session pengguna yang sedang Login.
- Mengarahkan pengguna kembali ke halaman Login.
- Meminta pengguna Login kembali menggunakan Password yang baru.

Pengguna tidak dapat melanjutkan penggunaan sistem menggunakan Session yang dibuat sebelum Password diperbarui.

Perilaku Session dan Authentication tetap mengacu pada **PART 3 — Authentication**.

---

### Architecture Principles

Change Password dikembangkan berdasarkan prinsip berikut:

- Personal Credential Ownership
- Security First
- Identity & Credential Separation
- Session Integrity
- Single Source of Truth

Password merupakan Credential pengguna dan dikelola secara terpisah dari informasi identitas pengguna.

---

### Cross Reference

Bagian ini mengacu pada:

- PART 3 — Authentication
- PART 9 — User Management
- PART 11.5 — My Profile

# ==============================================================================
# PART 11 — USER PROFILE
# 11.7 User Profile Behaviour
# ==============================================================================

## 11.7 User Profile Behaviour

User Profile Behaviour menjelaskan bagaimana pengguna mengelola akun pribadinya pada Engineering Document Management System (EDMS).

Seluruh proses pada User Profile hanya berlaku untuk akun pengguna yang sedang Login dan tidak mempengaruhi akun pengguna lain yang terdaftar pada sistem.

---

### My Profile Behaviour

Pengguna dapat memperbarui informasi pribadi yang diperbolehkan melalui halaman **My Profile**.

Informasi yang dapat diperbarui meliputi:

- Name
- Email

Setelah perubahan berhasil disimpan, sistem menampilkan informasi profil terbaru milik pengguna yang sedang Login.Perubahan informasi berlaku sejak proses penyimpanan berhasil diselesaikan.

Perubahan informasi pribadi tidak mengubah:

- Username
- Department
- Official Role
- Business Workflow
- Audit Trail
- Notification
- Engineering Document

---

### Change Password Behaviour

Pengguna dapat memperbarui Password akun miliknya sendiri melalui halaman **Change Password**.

Setelah proses perubahan Password berhasil:

- Password baru menjadi Credential yang digunakan untuk Login berikutnya.
- Session pengguna yang sedang aktif diakhiri.
- Pengguna diarahkan kembali ke halaman Login.
- Pengguna harus Login kembali menggunakan Password yang baru.

---

### Personal Account Behaviour

Seluruh perubahan yang dilakukan melalui User Profile hanya mempengaruhi akun pengguna yang sedang Login.

User Profile tidak digunakan untuk:

- Mengelola akun pengguna lain.
- Mengubah Official Role.
- Mengubah Department.
- Mengubah Permission.
- Mengubah Business Workflow.

Seluruh perubahan di luar ruang lingkup tersebut tetap mengacu pada domain yang menjadi Source of Truth masing-masing.

---

### Session Behaviour

Perubahan informasi pada **My Profile** tidak mempengaruhi Session pengguna.

Perubahan Password mengakhiri Session yang sedang aktif untuk menjaga keamanan akun.

Session baru hanya dapat dibuat melalui proses Login sesuai mekanisme Authentication.

---

### Architecture Principles

User Profile Behaviour dikembangkan berdasarkan prinsip berikut:

- Personal Account Ownership
- Identity & Credential Separation
- Session Integrity
- Security First
- Data Integrity

Seluruh Behaviour pada User Profile dirancang untuk memastikan pengguna hanya dapat mengelola akun pribadinya tanpa mempengaruhi domain lain pada EDMS.

---

### Cross Reference

Bagian ini mengacu pada:

- PART 3 — Authentication
- PART 9 — User Management
- PART 11.5 — My Profile
- PART 11.6 — Change Password

# ==============================================================================
# PART 11 — USER PROFILE
# 11.8 Profile Summary
# ==============================================================================

## 11.8 Profile Summary

Profile Summary memberikan gambaran mengenai hubungan antara User Profile dengan domain-domain utama pada Engineering Document Management System (EDMS).

Bagian ini membantu pembaca memahami bagaimana User Profile berinteraksi dengan Authentication, User Management, dan Official Role tanpa mendefinisikan ulang aturan bisnis yang telah ditetapkan pada Source of Truth masing-masing.

---

### Personal Account Relationship

User Profile merupakan representasi akun pribadi pengguna yang sedang Login.

Melalui User Profile, pengguna dapat:

- Melihat informasi akun pribadinya.
- Memperbarui informasi pribadi yang diperbolehkan.
- Mengganti Password akun miliknya sendiri.

Seluruh aktivitas tersebut hanya berlaku pada akun pengguna yang sedang Login.

---

### Domain Relationship Summary

User Profile berhubungan dengan beberapa domain utama pada EDMS sebagai berikut:

| Domain | Relationship |
|----------|--------------|
| Authentication | Mengelola proses Login, Logout, Session, dan Credential pengguna. |
| User Management | Menyediakan identitas akun pengguna yang ditampilkan pada My Profile. |
| Project Membership | Menyediakan Official Role pada Active Project yang ditampilkan sebagai informasi Read Only pada My Profile. |

---

### Business Module Relationship

Hubungan User Profile dengan modul lainnya dijelaskan sebagai berikut:

| Module | Relationship |
|----------|--------------|
| Dashboard | Menggunakan identitas pengguna yang sedang Login. |
| Document Register | Menggunakan identitas pengguna sebagai pelaksana aktivitas. |
| SLA Monitoring | Menggunakan identitas pengguna pada proses Business Workflow. |
| Audit Trail | Mencatat aktivitas pengguna berdasarkan akun yang sedang Login. |
| Notification | Menampilkan Notification milik pengguna yang sedang Login. |

---

### Architecture Principles

Profile Summary dikembangkan berdasarkan prinsip berikut:

- Personal Account Ownership
- Cross Domain Consistency
- Single Source of Truth
- Readability First

Profile Summary berfungsi sebagai ringkasan hubungan User Profile dengan domain lain dan tidak menggantikan definisi Authentication, User Management, maupun Role Management.

---

### Architecture Note

User Profile merupakan domain yang berfokus pada pengelolaan akun pribadi pengguna.

Apabila diperlukan informasi yang lebih rinci mengenai Authentication, User Management, Official Role, maupun Business Workflow, pembaca harus mengacu pada Source of Truth yang telah ditentukan pada PART masing-masing.

# ==============================================================================
# PART 11 — USER PROFILE
# 11.9 Error Handling
# ==============================================================================

## 11.9 Error Handling

User Profile harus tetap memberikan pengalaman yang konsisten ketika pengguna mengelola akun pribadinya.

Error Handling pada PART ini hanya berkaitan dengan proses My Profile dan Change Password.

Error Handling tidak mengubah User Management, Official Role, Authentication Policy, Permission, Business Workflow, maupun Engineering Document.

---

### Error Handling Rules

Apabila terjadi kegagalan pada proses User Profile, sistem harus:

- Menampilkan Error State yang menjelaskan bahwa proses tidak dapat diselesaikan.
- Mempertahankan informasi yang terakhir berhasil disimpan.
- Tidak menerapkan perubahan yang belum berhasil disimpan.
- Memberikan kesempatan kepada pengguna untuk mencoba kembali proses yang gagal.

Apabila informasi User Profile tidak dapat dimuat, sistem harus menampilkan Error State dan menyediakan mekanisme Retry.

---

### Recovery Behaviour

Setelah proses Recovery berhasil, sistem harus:

- Menampilkan informasi User Profile terbaru.
- Memastikan perubahan yang berhasil disimpan dapat ditampilkan secara konsisten.
- Memastikan informasi Read Only tetap sesuai dengan Source of Truth masing-masing.

Recovery tidak mengubah:

- Official Role
- Department
- Permission
- Business Workflow
- Engineering Document

Recovery hanya memulihkan proses User Profile yang mengalami kegagalan.

---

### Acceptance Criteria

| AC ID | Acceptance Criteria |
|--------|---------------------|
| AC-PROFILE-ERR-001 | Sistem menampilkan Error State apabila User Profile gagal dimuat. |
| AC-PROFILE-ERR-002 | Pengguna dapat melakukan Retry untuk memuat kembali User Profile. |
| AC-PROFILE-ERR-003 | Perubahan yang gagal disimpan tidak diterapkan pada User Profile. |
| AC-PROFILE-ERR-004 | Recovery berhasil menampilkan informasi User Profile terbaru. |
| AC-PROFILE-ERR-005 | Recovery tidak mengubah Official Role maupun Department. |
| AC-PROFILE-ERR-006 | Recovery tidak mempengaruhi User Management, Permission, Business Workflow, maupun Engineering Document. |
| AC-PROFILE-ERR-007 | Setelah Recovery berhasil, pengguna dapat kembali melanjutkan pengelolaan User Profile tanpa kehilangan data yang sebelumnya telah berhasil disimpan. |

---

### Architecture Note

User Profile merupakan domain pengelolaan akun pribadi.

Error Handling pada PART ini hanya berkaitan dengan proses pengelolaan informasi pribadi dan Change Password.

Validation Password, Authentication Policy, Session Management, maupun Credential Verification tetap mengacu pada **PART 3 — Authentication** sebagai Single Source of Truth.

---

### Cross Reference

Bagian ini mengacu pada:

- PART 3 — Authentication
- PART 9 — User Management
- PART 10 — Role Management
- PART 11.5 — My Profile
- PART 11.6 — Change Password

# ==============================================================================
# PART 11 — USER PROFILE
# 11.10 Cross Reference
# ==============================================================================

## 11.10 Cross Reference

PART 11 — User Profile dibangun berdasarkan Application Architecture, Authentication, User Management, dan Role Management yang telah didefinisikan pada dokumen maupun PART terkait.

User Profile berfungsi sebagai **Single Source of Truth** untuk seluruh pengelolaan akun pribadi pengguna pada Engineering Document Management System (EDMS).

---

### Reference Matrix

| Reference | Purpose |
|-----------|---------|
| PART 2 — Product Overview → 2.5 Application Layout Architecture | Menjadi Source of Truth untuk Application Layout Architecture. |
| PART 3 — Authentication | Menjadi Source of Truth untuk Authentication, Login Behaviour, Session Management, Credential Validation, dan Logout Behaviour. |
| PART 9 — User Management | Menjadi Source of Truth untuk User Identity, User Administration, serta pengelolaan akun pengguna. |
| PART 10 — Role Management | Menjadi Source of Truth untuk Official Role Definition. |
| PART 14 — Multi Project Management | Menjadi Source of Truth untuk Project Membership sebagai sumber Official Role yang ditampilkan pada User Profile. |
| ACCESS-CONTROL.md | Menjadi Source of Truth untuk Access Control Architecture. |

---

### Dependency Summary

PART 11 mendefinisikan pengelolaan akun pribadi milik pengguna yang sedang Login.

PART 11 tidak mendefinisikan ulang:

- Authentication
- User Management
- Official Role
- Permission
- Business Workflow
- Notification
- Engineering Document

Seluruh domain tersebut tetap mengacu pada Source of Truth masing-masing.

Sebaliknya, seluruh proses pengelolaan akun pribadi pengguna wajib mengacu pada PART 11 sebagai referensi resmi.

---

### Implementation Note

Apabila terjadi perubahan terhadap:

- My Profile
- Change Password
- Personal Account Behaviour

maka perubahan dilakukan terlebih dahulu pada PART 11 sebagai **Single Source of Truth**.

Apabila terjadi perubahan terhadap:

- Authentication
- User Management
- Official Role
- Permission

maka perubahan dilakukan pada PART yang menjadi pemilik domain tersebut.

PART 11 hanya disesuaikan apabila perubahan tersebut mempengaruhi pengelolaan akun pribadi pengguna.

---

## PART 11 Completion

Dengan selesainya PART 11, spesifikasi berikut telah didefinisikan secara lengkap:

- User Profile Overview
- User Profile Objectives
- User Profile Layout
- User Profile Domain
- My Profile
- Change Password
- User Profile Behaviour
- Profile Summary
- Error Handling

PART 11 dinyatakan **Complete** dan menjadi **Single Source of Truth** untuk seluruh pengelolaan akun pribadi pengguna pada Engineering Document Management System (EDMS).

# ==============================================================================
# PART 12 — TRANSMITTAL
# 12.1 Overview
# ==============================================================================

## 12.1 Overview

Transmittal merupakan modul yang telah disiapkan sebagai bagian dari struktur Engineering Document Management System (EDMS) untuk mendukung pengembangan fitur pada versi berikutnya.

Pada versi ini, modul Transmittal belum menyediakan fungsi bisnis maupun proses operasional.

Pengguna tetap dapat mengakses menu Transmittal melalui Navigation Sidebar, namun sistem hanya menampilkan halaman informasi bahwa fitur tersebut masih dalam tahap pengembangan.

---

### Architecture Principle

Transmittal merupakan **Feature Placeholder Domain**.

Domain ini berfungsi sebagai placeholder yang mempertahankan struktur navigasi aplikasi tanpa mendefinisikan Business Workflow maupun fungsi operasional Transmittal.

---

### Current Scope

Pada versi ini, Transmittal hanya menyediakan:

- Navigation Entry
- Placeholder Page

Placeholder Page menampilkan informasi berikut:

> **This feature is currently under development.**

Tidak terdapat proses bisnis, pengelolaan data, maupun interaksi pengguna pada modul ini.

---

### Source of Truth

PART 12 menjadi **Single Source of Truth** untuk:

- Transmittal Placeholder
- Placeholder Behaviour
- Future Feature Reservation

Seluruh implementasi fitur Transmittal akan didefinisikan pada versi berikutnya setelah kebutuhan bisnis telah ditetapkan secara resmi.

# ==============================================================================
# PART 12 — TRANSMITTAL
# 12.2 Objectives
# ==============================================================================

## 12.2 Objectives

Transmittal disiapkan sebagai placeholder module untuk mempertahankan struktur navigasi Engineering Document Management System (EDMS) sekaligus menyediakan ruang bagi implementasi fitur Transmittal pada pengembangan berikutnya.

Pada versi ini, modul Transmittal belum memiliki proses bisnis, Business Workflow, maupun fungsi operasional.

---

### Business Objectives

PART 12 dikembangkan untuk mencapai tujuan berikut:

- Mempertahankan struktur navigasi aplikasi sesuai desain produk.
- Menyediakan placeholder resmi untuk modul Transmittal.
- Menghindari implementasi fitur tanpa kebutuhan bisnis yang telah ditetapkan.
- Menyediakan fondasi untuk pengembangan fitur Transmittal pada versi berikutnya.

---

### Design Objectives

Transmittal Placeholder dikembangkan berdasarkan prinsip berikut:

- **Navigation Consistency** — Menu Transmittal tetap tersedia pada Navigation Sidebar.
- **Future Ready** — Struktur modul telah dipersiapkan untuk pengembangan berikutnya.
- **No Business Assumption** — Tidak mendefinisikan proses bisnis yang belum mendapatkan persetujuan.
- **Single Source of Truth** — Seluruh status placeholder didefinisikan pada PART 12.

---

### Architecture Note

Pada versi ini, Transmittal hanya menyediakan halaman placeholder yang menampilkan informasi:

> **This feature is currently under development.**

Seluruh fungsi bisnis, Business Workflow, maupun spesifikasi Transmittal akan didefinisikan setelah kebutuhan bisnis resmi tersedia.

PART 12 tidak mendefinisikan proses distribusi dokumen maupun perilaku operasional Transmittal.

# ==============================================================================
# PART 12 — TRANSMITTAL
# 12.3 Transmittal Layout
# ==============================================================================

## 12.3 Transmittal Layout

Transmittal menggunakan **Application Layout Architecture** sebagaimana didefinisikan pada **PART 2 — Product Overview → 2.5 Application Layout Architecture**.

PART ini hanya mendefinisikan layout pada area Transmittal yang berada di dalam **Main Content Area**.

Seluruh elemen di luar Main Content Area, termasuk Navigation Sidebar, Top Navigation Bar, Footer, dan struktur halaman aplikasi mengikuti spesifikasi yang telah didefinisikan pada PART 2.

---

### Module Entry

Transmittal diakses melalui **Navigation Sidebar**.

Modul ini menyediakan dua submenu:

- Incoming
- Outgoing

Ketika pengguna memilih salah satu submenu tersebut, sistem menampilkan halaman Placeholder Transmittal.

---

### Layout Components

Halaman Placeholder Transmittal terdiri dari komponen berikut:

- Page Header
- Placeholder Content

**Page Header** menampilkan judul halaman sesuai submenu yang dipilih.

**Placeholder Content** menampilkan informasi berikut:

> **This feature is currently under development.**

Tidak terdapat tabel, form, filter, pencarian, tombol aksi, maupun komponen operasional lainnya pada halaman ini.

---

### Responsive Behaviour

Layout Placeholder Transmittal harus tetap mengikuti Application Layout Architecture pada berbagai ukuran layar.

Placeholder Content harus tetap berada pada Main Content Area dan mudah dibaca baik pada Desktop maupun Mobile.

---

### Design Principles

Layout Transmittal Placeholder dikembangkan berdasarkan prinsip berikut:

- Simple
- Consistent
- Readability First
- Future Ready

Layout dirancang sebagai placeholder sehingga tidak menyediakan komponen operasional maupun interaksi bisnis.

---

### Cross Reference

Bagian ini mengacu pada:

- PART 2 — Product Overview → 2.5 Application Layout Architecture
- PART 12.4 — Placeholder Behaviour

# ==============================================================================
# PART 12 — TRANSMITTAL
# 12.4 Placeholder Behaviour
# ==============================================================================

## 12.4 Placeholder Behaviour

Placeholder Behaviour menjelaskan bagaimana sistem merespons ketika pengguna mengakses modul Transmittal pada Engineering Document Management System (EDMS).

Pada versi ini, Transmittal belum menyediakan fungsi bisnis maupun proses operasional.

Seluruh interaksi pengguna hanya menampilkan halaman Placeholder tanpa melakukan pemrosesan data.

---

### Navigation Behaviour

Pengguna dapat membuka halaman Transmittal melalui Navigation Sidebar.

Ketika pengguna memilih submenu:

- Incoming
- Outgoing

sistem menampilkan halaman Placeholder sesuai submenu yang dipilih.

---

### Placeholder Display Behaviour

Halaman Placeholder hanya menampilkan informasi berikut:

> **This feature is currently under development.**

Pesan tersebut ditampilkan pada Main Content Area sebagai informasi bahwa fitur Transmittal belum tersedia pada versi ini.

---

### User Interaction Behaviour

Pada halaman Placeholder:

- Pengguna tidak dapat membuat Transmittal.
- Pengguna tidak dapat melihat daftar Transmittal.
- Pengguna tidak dapat melakukan pencarian.
- Pengguna tidak dapat melakukan Filter.
- Pengguna tidak dapat melakukan tindakan operasional lainnya.

Halaman hanya berfungsi sebagai Placeholder.

---

### Future Ready Behaviour

Struktur Navigation dan Routing tetap dipertahankan sehingga implementasi fitur Transmittal pada versi berikutnya tidak memerlukan perubahan terhadap struktur navigasi aplikasi.

Perubahan hanya dilakukan pada Main Content Area sesuai kebutuhan bisnis yang akan ditetapkan di masa mendatang.

---

### Architecture Principles

Placeholder Behaviour dikembangkan berdasarkan prinsip berikut:

- Navigation Consistency
- No Business Assumption
- Future Ready
- Single Source of Truth

Placeholder Behaviour hanya menjelaskan perilaku modul pada versi saat ini dan tidak mendefinisikan fitur Transmittal yang belum menjadi kebutuhan bisnis.

---

### Cross Reference

Bagian ini mengacu pada:

- PART 2 — Product Overview
- PART 12.3 — Transmittal Layout
- PART 12.5 — Future Implementation Note

# ==============================================================================
# PART 12 — TRANSMITTAL
# 12.5 Future Implementation Note
# ==============================================================================

## 12.5 Future Implementation Note

Transmittal merupakan modul yang telah dipersiapkan sebagai Placeholder untuk mendukung pengembangan Engineering Document Management System (EDMS) pada versi berikutnya.

Pada versi ini, implementasi fitur Transmittal sengaja ditunda karena kebutuhan bisnis belum didefinisikan secara resmi.

---

### Deferred Feature

Seluruh fungsi operasional Transmittal berada di luar ruang lingkup versi ini.

PART 12 tidak mendefinisikan:

- Business Workflow
- Data Structure
- User Interaction
- Business Rule
- Permission
- User Interface selain Placeholder Page

Seluruh spesifikasi tersebut akan ditetapkan setelah kebutuhan bisnis resmi tersedia.

---

### Future Development Policy

Implementasi Transmittal hanya dapat dilakukan apabila telah tersedia:

- Business Requirement yang telah disetujui.
- Business Workflow yang telah didefinisikan.
- User Interface yang telah disetujui.
- Business Rule yang telah ditetapkan.

Sebelum seluruh kebutuhan tersebut tersedia, Placeholder tetap menjadi implementasi resmi modul Transmittal.

---

### Scope Limitation

Pada versi ini, PART 12 hanya mendefinisikan:

- Navigation Sidebar Entry
- Placeholder Page
- Placeholder Behaviour

Implementasi di luar ruang lingkup tersebut tidak termasuk dalam versi ini.

---

### Architecture Principles

Future Implementation Note dikembangkan berdasarkan prinsip berikut:

- Requirement First
- No Business Assumption
- Future Ready
- Single Source of Truth

Seluruh pengembangan Transmittal pada masa mendatang harus dimulai dari kebutuhan bisnis yang telah ditetapkan secara resmi dan bukan berdasarkan asumsi implementasi.

---

### Cross Reference

Bagian ini mengacu pada:

- BUSINESS-WORKFLOW.md
- PART 2 — Product Overview
- PART 12.1 — Overview
- PART 12.4 — Placeholder Behaviour

# ==============================================================================
# PART 12 — TRANSMITTAL
# 12.6 Cross Reference
# ==============================================================================

## 12.6 Cross Reference

PART 12 — Transmittal dibangun berdasarkan Application Architecture yang telah didefinisikan pada PART terkait.

Pada versi ini, Transmittal berfungsi sebagai **Feature Placeholder** dan belum memiliki proses bisnis maupun fungsi operasional.

PART 12 menjadi **Single Source of Truth** untuk status Placeholder Transmittal pada Engineering Document Management System (EDMS).

---

### Reference Matrix

| Reference | Purpose |
|-----------|---------|
| PART 2 — Product Overview → 2.5 Application Layout Architecture | Menjadi Source of Truth untuk Application Layout Architecture. |
| ROUTING.md | Menjadi Source of Truth untuk Navigation Routing menuju halaman Placeholder Transmittal. |
| BUSINESS-WORKFLOW.md | Menjadi referensi apabila implementasi Transmittal dikembangkan pada versi berikutnya. |

---

### Dependency Summary

Pada versi ini, PART 12 tidak memiliki ketergantungan terhadap:

- Business Workflow
- User Management
- Role Management
- Notification
- Audit Trail
- SLA Monitoring
- Engineering Document

Seluruh modul tersebut tetap berjalan secara independen tanpa implementasi Transmittal.

Sebaliknya, Navigation Sidebar dan Routing tetap menyediakan akses menuju Placeholder Transmittal sesuai struktur aplikasi.

---

### Implementation Note

Selama Placeholder masih digunakan:

- Navigation Sidebar tetap dipertahankan.
- Routing tetap dipertahankan.
- Global Layout tetap mengikuti PART 2.
- Main Content Area hanya menampilkan halaman Placeholder.

Implementasi fitur Transmittal hanya dilakukan setelah kebutuhan bisnis resmi tersedia dan PART 12 diperbarui sebagai **Single Source of Truth**.

---

## PART 12 Completion

Dengan selesainya PART 12, spesifikasi berikut telah didefinisikan secara lengkap:

- Transmittal Overview
- Transmittal Objectives
- Transmittal Layout
- Placeholder Behaviour
- Future Implementation Note

PART 12 dinyatakan **Complete** dan menjadi **Single Source of Truth** untuk implementasi Placeholder Transmittal pada Engineering Document Management System (EDMS).


# ==============================================================================
# PART 13 – Escalation Alert
# ==============================================================================

## 13.1 Feature Overview

### Deskripsi

**Escalation Alert** adalah fitur monitoring yang digunakan untuk membantu pengguna mengidentifikasi dokumen yang telah melewati batas waktu penyelesaian sesuai Service Level Agreement (SLA).

Fitur ini menyediakan halaman khusus yang secara otomatis menampilkan seluruh dokumen dengan **SLA Status = Overdue**, sehingga pengguna dapat dengan cepat mengetahui dokumen mana yang memerlukan perhatian dan tindakan lebih lanjut.

Escalation Alert dirancang sebagai sarana monitoring operasional dan tidak menjadi bagian dari proses persetujuan (approval) maupun alur bisnis (Business Workflow) dokumen.

---

### Project Context

Escalation Alert selalu bekerja berdasarkan **Active Project**.

Seluruh dokumen yang ditampilkan pada halaman Escalation Alert hanya berasal dari Active Project yang sedang digunakan oleh pengguna.

Escalation Engine tidak melakukan evaluasi terhadap dokumen dari Project lain.

Ketika Active Project berubah:

- Escalation Alert dimuat ulang menggunakan Active Project yang baru.
- Jumlah Escalation diperbarui sesuai Active Project.
- Escalation Level dihitung ulang berdasarkan dokumen pada Active Project.
- Data Project sebelumnya tidak ditampilkan.

Escalation Alert tidak menggabungkan dokumen dari beberapa Project dalam satu tampilan.

---

### Latar Belakang

Dalam proses pengelolaan dokumen, setiap dokumen memiliki target waktu penyelesaian yang ditentukan melalui parameter **Days Until Validation**.

Selama proses review berlangsung, sistem akan menghitung durasi pengerjaan melalui **SLA Timer**. Apabila durasi tersebut melebihi batas yang telah ditentukan, dokumen akan memasuki kondisi **Overdue**.

Tanpa adanya mekanisme monitoring yang terpusat, dokumen yang mengalami keterlambatan berpotensi tidak segera diketahui oleh pihak yang bertanggung jawab sehingga dapat mempengaruhi progres pekerjaan maupun proyek secara keseluruhan.

Untuk mengatasi kondisi tersebut, sistem menyediakan fitur **Escalation Alert** sebagai pusat monitoring seluruh dokumen yang berstatus Overdue.

---

### Tujuan

Fitur Escalation Alert dikembangkan untuk mencapai tujuan berikut:

- Memberikan visibilitas terhadap seluruh dokumen yang mengalami keterlambatan.
- Membantu Current Assignee mengetahui dokumen yang membutuhkan perhatian segera.
- Mengurangi risiko dokumen Overdue terlewatkan.
- Mendukung monitoring progres penyelesaian dokumen.
- Meningkatkan kepatuhan terhadap target SLA yang telah ditetapkan.

---

### Karakteristik Fitur

Escalation Alert memiliki karakteristik sebagai berikut:

- Berjalan secara otomatis berdasarkan hasil perhitungan SLA.
- Hanya menampilkan dokumen yang berstatus **Overdue**.
- Bersifat monitoring (read-only).
- Tidak mengubah Status Dokumen.
- Tidak mengubah Revision Status.
- Tidak mengubah Business Workflow.
- Tidak memerlukan tindakan manual dari pengguna.

---

### Ruang Lingkup

Pada versi ini, Escalation Alert mencakup kemampuan berikut:

- Menampilkan daftar dokumen Overdue.
- Menghitung Escalation Level secara otomatis.
- Menampilkan durasi keterlambatan dokumen.
- Mengirim satu notifikasi kepada penerima Project-Scoped berdasarkan Official Role dan Project Membership ketika dokumen pertama kali menjadi Overdue.

Fitur berikut tidak termasuk dalam ruang lingkup implementasi saat ini:

- Eskalasi ke Supervisor atau Manager.
- Reminder berkala.
- Pengiriman Email.
- Pengiriman WhatsApp.
- Auto Reassignment.
- Workflow Escalation.
- Dashboard Analytics Escalation.

Fitur-fitur tersebut dapat dipertimbangkan sebagai pengembangan pada versi berikutnya.

---

### Design Principle

Escalation Alert dibangun berdasarkan prinsip **Monitoring Without Workflow Modification**.

Artinya, fitur ini hanya berfungsi sebagai media monitoring terhadap dokumen yang mengalami keterlambatan tanpa mengubah proses bisnis yang telah berjalan.

Seluruh informasi yang ditampilkan pada halaman Escalation Alert merupakan hasil evaluasi otomatis dari sistem berdasarkan data SLA yang sudah tersedia.


## 13.2 Escalation Trigger Rules

### Deskripsi

Escalation Alert bekerja berdasarkan hasil evaluasi SLA yang dilakukan secara otomatis oleh sistem.

Sistem akan terus memantau hubungan antara **SLA Timer** dan **Days Until Validation** untuk setiap dokumen yang masih berada dalam proses review.

Apabila durasi pengerjaan dokumen telah melebihi batas waktu yang ditentukan, maka dokumen akan dikategorikan sebagai **Overdue** dan secara otomatis ditampilkan pada halaman **Escalation Alert**.

Seluruh proses dilakukan secara otomatis tanpa memerlukan tindakan manual dari pengguna.

---

### Trigger Masuk Escalation Alert

Dokumen akan secara otomatis masuk ke halaman **Escalation Alert** apabila memenuhi seluruh kondisi berikut:

- Dokumen masih berada dalam proses review.
- SLA Timer telah melebihi nilai **Days Until Validation**.
- SLA Status berubah menjadi **Overdue**.

Ilustrasi proses:

```text
Document Under Review
          │
          ▼
SLA Timer berjalan
          │
          ▼
SLA Timer > Days Until Validation
          │
          ▼
SLA Status = Overdue
          │
          ▼
Automatically Displayed
in Escalation Alert
```

---

### Trigger Keluar dari Escalation Alert

Dokumen akan otomatis keluar dari halaman **Escalation Alert** apabila sudah tidak memenuhi kondisi **Overdue**.

Perubahan tersebut dapat terjadi apabila:

- Dokumen telah selesai diproses (Approved).
- SLA Status berubah menjadi **On Track**.
- SLA Status berubah menjadi **At Risk**.
- Kondisi lain yang menyebabkan SLA Status tidak lagi **Overdue**.

Ilustrasi proses:

```text
Escalation Alert
          │
          ▼
SLA Status berubah
          │
          ▼
SLA Status ≠ Overdue
          │
          ▼
Automatically Removed
from Escalation Alert
```

---

### Trigger Evaluation

Evaluasi Escalation Alert dilakukan secara otomatis oleh sistem setiap kali terjadi perubahan yang mempengaruhi perhitungan SLA.

Beberapa contoh kondisi yang memicu evaluasi ulang antara lain:

- Dokumen baru diunggah.
- Status Dokumen berubah.
- SLA Timer bertambah.
- Days Until Validation diperbarui.
- Dokumen selesai diproses.

Setiap hasil evaluasi akan menentukan apakah dokumen harus ditampilkan atau dihapus dari halaman Escalation Alert.

---

### Trigger Logic

Logika dasar Escalation Alert mengikuti aturan berikut:

| Kondisi | Hasil |
|----------|-------|
| SLA Timer ≤ Days Until Validation | Tidak ditampilkan pada Escalation Alert |
| SLA Timer > Days Until Validation | Ditampilkan pada Escalation Alert |
| SLA Status = Overdue | Tetap ditampilkan |
| SLA Status ≠ Overdue | Dihapus dari Escalation Alert |

---

### Design Principle

Escalation Alert tidak melakukan perubahan terhadap data dokumen.

Fitur ini hanya menggunakan hasil perhitungan SLA yang telah tersedia untuk menentukan apakah sebuah dokumen perlu ditampilkan pada halaman Escalation Alert.

Dengan demikian, Escalation Alert berfungsi sebagai mekanisme monitoring yang bersifat **otomatis**, **real-time**, dan **non-intrusive**, tanpa mempengaruhi Business Workflow maupun Status Dokumen.

## 13.3 Escalation Level

### Deskripsi

Escalation Level merupakan indikator yang menunjukkan tingkat keterlambatan suatu dokumen berdasarkan jumlah hari sejak dokumen memasuki status **Overdue**.

Semakin lama dokumen berada dalam kondisi Overdue, maka semakin tinggi Level yang ditampilkan pada halaman **Escalation Alert**.

Level ini digunakan sebagai informasi visual untuk membantu pengguna mengidentifikasi dokumen yang membutuhkan perhatian lebih cepat selama proses monitoring.

---

### Perhitungan Level

Perhitungan Escalation Level dilakukan secara otomatis berdasarkan nilai **Overdue Days**.

**Overdue Days** adalah jumlah hari sejak dokumen pertama kali berubah menjadi **Overdue**.

Pembagian Level ditentukan sebagai berikut:

| Overdue Days | Escalation Level |
|--------------|------------------|
| 1 – 3 Hari | Level 1 |
| 4 – 6 Hari | Level 2 |
| 7 – 9 Hari | Level 3 |
| ≥ 10 Hari | Level 4 |

Level maksimum yang dapat ditampilkan oleh sistem adalah **Level 4**.

Apabila jumlah hari keterlambatan melebihi 10 hari, sistem tetap menampilkan **Level 4**.

---

### Contoh Perhitungan

Sebagai contoh, sebuah dokumen memiliki **Days Until Validation = 5 Hari**.

| SLA Timer | Overdue Days | Escalation Level |
|-----------|--------------|------------------|
| 5 Hari | - | - |
| 6 Hari | 1 Hari | Level 1 |
| 8 Hari | 3 Hari | Level 1 |
| 9 Hari | 4 Hari | Level 2 |
| 12 Hari | 7 Hari | Level 3 |
| 15 Hari | 10 Hari | Level 4 |
| 20 Hari | 15 Hari | Level 4 |

---

### Perhitungan Dinamis

Escalation Level merupakan **derived data** yang dihitung secara dinamis oleh sistem setiap kali dilakukan evaluasi SLA.

Nilai Level **tidak disimpan** sebagai data permanen di dalam database.

Sebaliknya, sistem menghitung nilai tersebut berdasarkan **Overdue Days** sehingga informasi yang ditampilkan selalu sesuai dengan kondisi SLA terkini.

Pendekatan ini menghindari duplikasi data dan menjaga konsistensi informasi pada seluruh sistem.

---

### Hubungan dengan Overdue Duration

Selain menghitung **Overdue Days** untuk menentukan Escalation Level, sistem juga menghitung **Overdue Duration** yang digunakan sebagai informasi pada antarmuka pengguna.

Kedua istilah tersebut memiliki fungsi yang berbeda.

| Data | Digunakan Untuk |
|------|-----------------|
| Overdue Days | Perhitungan Escalation Level |
| Overdue Duration | Informasi yang ditampilkan pada halaman Escalation Alert |

Sebagai contoh:

- Overdue Days : **10 Hari**
- Overdue Duration : **10d 4h**

Dalam contoh tersebut, sistem akan menampilkan **Escalation Level 4** dan **Overdue Duration 10d 4h** pada halaman Escalation Alert.

---

### Penggunaan

Escalation Level digunakan untuk:

- Menunjukkan tingkat keterlambatan dokumen.
- Membantu pengguna mengidentifikasi dokumen yang memerlukan perhatian lebih cepat.
- Mendukung proses monitoring dokumen Overdue.

Escalation Level tidak digunakan untuk:

- Mengubah Status Dokumen.
- Mengubah Revision Status.
- Mengubah Business Workflow.
- Mengubah Current Assignee.
- Menentukan Approval.
- Menentukan hak akses pengguna.

---

### Design Principle

Escalation Level merupakan indikator monitoring yang dihitung secara otomatis berdasarkan durasi keterlambatan dokumen.

Level ini hanya digunakan sebagai informasi visual pada halaman **Escalation Alert** dan tidak memberikan pengaruh terhadap proses bisnis maupun data utama dokumen.

## 13.4 Notification Rules

### Deskripsi

Escalation Alert terintegrasi dengan modul **Notification** untuk memberikan pemberitahuan kepada pengguna Project terkait ketika sebuah dokumen pertama kali memasuki kondisi **Overdue**.

Notification bertujuan meningkatkan kesadaran (**awareness**) Admin, Document Owner, Team Process, dan Team Project pada Project terkait terhadap dokumen yang telah melewati batas waktu penyelesaian sehingga dapat segera ditindaklanjuti.

Escalation Alert hanya menentukan kapan Notification harus dibuat, sedangkan proses penyimpanan, pengelolaan, dan penyajian Notification merupakan tanggung jawab modul Notification.

---

### Notification Trigger

Notification dibuat secara otomatis ketika dokumen memenuhi seluruh kondisi berikut:

- Dokumen masih berada dalam proses review.
- SLA Status berubah menjadi **Overdue**.
- Dokumen belum pernah menghasilkan Notification Escalation Alert pada kondisi Overdue tersebut.

Setelah seluruh kondisi terpenuhi, sistem akan membuat satu Personal Notification untuk setiap penerima Project-Scoped yang memenuhi syarat.

---

### Notification Recipient

Pada versi sistem ini, Notification ditujukan kepada seluruh User Active dengan Project Membership Active pada Project milik Document dan Official Role:

- Admin.
- Document Owner.
- Team Process.
- Team Project.

User dari Project lain, User Inactive, Membership Inactive, dan Project Inactive tidak menerima Notification Overdue.

---

### Notification Frequency

Untuk menghindari pengiriman Notification yang berulang, sistem menerapkan aturan berikut:

- Notification dibuat satu kali ketika dokumen pertama kali menjadi **Overdue**.
- Notification tidak dibuat ulang selama dokumen masih berada pada kondisi **Overdue**.
- Bertambahnya durasi keterlambatan tidak menghasilkan Notification baru.
- Perubahan Escalation Level tidak menghasilkan Notification baru.
- Refresh, query refetch, browser restart, login ulang, page load, dan Project switching tanpa perubahan SLA State tidak menghasilkan Notification Overdue tambahan.
- Workflow Action atau reset SLA tidak membuat Notification Overdue tambahan apabila Notification Overdue sebelumnya sudah pernah dibuat untuk dokumen dan recipient yang sama.

Dengan demikian, satu dokumen hanya menghasilkan satu Notification untuk setiap recipient pada setiap kejadian Overdue.

---

### Notification Lifecycle

Notification tetap tersimpan pada modul Notification setelah berhasil dibuat.

Selama dokumen masih berada dalam kondisi **Overdue**, sistem tidak akan membuat Notification tambahan.

Apabila dokumen sudah tidak lagi berstatus **Overdue**, sistem juga tidak membuat Notification lanjutan maupun Notification penutupan (closing notification).

Pengelolaan status Notification, seperti **Read** dan **Unread**, mengikuti mekanisme yang berlaku pada modul Notification.

---

### Design Principle

Notification pada Escalation Alert dirancang sebagai **single-event notification**, yaitu pemberitahuan yang hanya dibuat satu kali ketika dokumen pertama kali memasuki kondisi **Overdue**.

Pendekatan ini dipilih untuk:

- Menghindari spam Notification.
- Menjaga daftar Notification tetap ringkas dan relevan.
- Memastikan pengguna menerima informasi penting tanpa gangguan akibat pemberitahuan yang berulang.

Notification pada fitur Escalation Alert bukan merupakan reminder berkala maupun mekanisme eskalasi berjenjang.

## 13.5 User Interface Specification

### Deskripsi

Halaman **Escalation Alert** merupakan halaman monitoring yang menampilkan seluruh dokumen dengan **SLA Status = Overdue**.

Halaman ini membantu pengguna mengidentifikasi dokumen yang telah melewati batas waktu penyelesaian sehingga dapat segera ditindaklanjuti oleh **Current Assignee**.

Daftar dokumen pada halaman ini diperbarui secara otomatis berdasarkan hasil evaluasi SLA.

---

### Tujuan Halaman

Halaman Escalation Alert bertujuan untuk:

- Menampilkan seluruh dokumen yang sedang berstatus **Overdue**.
- Memberikan informasi tingkat keterlambatan setiap dokumen.
- Membantu pengguna memprioritaskan penanganan dokumen yang terlambat.
- Menyediakan akses cepat menuju informasi dokumen.

Halaman ini bersifat **monitoring** dan tidak digunakan untuk melakukan proses approval maupun perubahan status dokumen.

---

### Data Source

Seluruh data pada halaman Escalation Alert berasal dari hasil evaluasi SLA yang dilakukan oleh sistem.

Hanya dokumen dengan **SLA Status = Overdue** yang ditampilkan pada halaman ini.

Apabila sebuah dokumen sudah tidak lagi berstatus **Overdue**, maka dokumen tersebut akan otomatis dihapus dari daftar Escalation Alert.

---

### Tabel Escalation Alert

Halaman Escalation Alert menampilkan daftar dokumen dalam bentuk tabel.

| Kolom | Deskripsi |
|--------|-----------|
| No | Nomor urut data. |
| Document Number | Nomor dokumen yang unik dalam scope Project. |
| Current Assignee | Pengguna yang saat ini bertanggung jawab terhadap dokumen. |
| Escalation Level | Tingkat keterlambatan berdasarkan jumlah **Overdue Days**. |
| SLA Status | Status SLA dokumen, selalu bernilai **Overdue** pada halaman ini. |
| Overdue Duration | Lama keterlambatan dokumen dalam format hari dan jam (contoh: **10d 4h**). |
| Action | Aksi yang tersedia untuk melihat detail dokumen. |

---

### Search

Halaman menyediakan fasilitas pencarian untuk memudahkan pengguna menemukan dokumen tertentu.

Pencarian dapat dilakukan berdasarkan:

- Document Number
- Document Title

Hasil pencarian diperbarui secara langsung sesuai kata kunci yang dimasukkan pengguna.

---

### Pagination

Apabila jumlah dokumen melebihi kapasitas tampilan satu halaman, sistem akan menggunakan mekanisme pagination.

Pagination bertujuan menjaga performa halaman serta mempermudah navigasi data.

---

### Sorting

Pengguna dapat mengurutkan data berdasarkan kolom tertentu.

Minimal mendukung pengurutan berdasarkan:

- Document Number
- Escalation Level
- Overdue Duration

Urutan dapat ditampilkan secara **Ascending** maupun **Descending**.

---

### Action

Setiap baris dokumen menyediakan aksi:

**View**

Aksi **View** digunakan untuk membuka informasi detail dokumen tanpa mengubah data dokumen tersebut.

Tidak tersedia aksi Approval, Reject, maupun perubahan workflow pada halaman Escalation Alert.

---

### Empty State

Apabila tidak terdapat dokumen yang berstatus **Overdue**, sistem menampilkan informasi bahwa tidak ada dokumen yang perlu dilakukan monitoring.

Dalam kondisi ini, tabel tidak menampilkan data.

---

### Design Principle

Halaman Escalation Alert dirancang sebagai halaman monitoring yang sederhana, informatif, dan mudah dipahami.

Seluruh informasi yang ditampilkan merupakan hasil evaluasi otomatis sistem dan bersifat **read-only**.

Pengguna dapat melihat informasi keterlambatan dokumen tanpa melakukan perubahan terhadap Status Dokumen maupun Business Workflow.


## 13.6 Business Rules

Business Rules berikut mendefinisikan aturan yang mengatur perilaku fitur **Escalation Alert**.

### EA-001 – Escalation Trigger

Sistem hanya boleh menampilkan dokumen pada halaman **Escalation Alert** apabila **SLA Status** dokumen bernilai **Overdue**.

---

### EA-002 – Automatic Detection

Sistem harus secara otomatis mengevaluasi kondisi SLA setiap dokumen dan menentukan apakah dokumen perlu ditampilkan pada halaman **Escalation Alert**.

Proses evaluasi dilakukan tanpa memerlukan tindakan manual dari pengguna.

---

### EA-003 – Automatic Removal

Sistem harus secara otomatis menghapus dokumen dari halaman **Escalation Alert** apabila **SLA Status** sudah tidak lagi bernilai **Overdue**.

---

### EA-004 – Escalation Level Calculation

Escalation Level harus dihitung secara otomatis berdasarkan jumlah **Overdue Days** sesuai aturan berikut:

| Overdue Days | Escalation Level |
|--------------|------------------|
| 1 – 3 Hari | Level 1 |
| 4 – 6 Hari | Level 2 |
| 7 – 9 Hari | Level 3 |
| ≥ 10 Hari | Level 4 |

Escalation Level memiliki batas maksimum **Level 4**.

---

### EA-005 – Dynamic Level

Escalation Level merupakan **derived data** yang dihitung secara dinamis setiap kali sistem melakukan evaluasi SLA.

Nilai Escalation Level tidak boleh disimpan sebagai data permanen di dalam database.

---

### EA-006 – Notification Generation

Sistem harus membuat satu Notification secara otomatis ketika sebuah dokumen pertama kali memasuki kondisi **Overdue**.

Notification dibuat sebagai hasil dari proses Escalation Alert.

---

### EA-007 – Notification Recipient

Notification Escalation Alert dikirim kepada seluruh User Active dengan Project Membership Active pada Project milik Document dan Official Role Admin, Document Owner, Team Process, atau Team Project.

---

### EA-008 – Notification Frequency

Untuk setiap kejadian **Overdue**, sistem hanya boleh membuat satu Notification.

Perubahan Escalation Level maupun bertambahnya durasi keterlambatan tidak boleh menghasilkan Notification tambahan.

---

### EA-009 – Read-Only Monitoring

Halaman **Escalation Alert** hanya digunakan sebagai media monitoring.

Fitur ini tidak boleh:

- Mengubah Status Dokumen.
- Mengubah Revision Status.
- Mengubah Current Assignee.
- Mengubah Business Workflow.
- Melakukan Approval atau Rejection.

---

### EA-010 – Data Consistency

Seluruh informasi yang ditampilkan pada halaman **Escalation Alert** harus berasal dari hasil evaluasi SLA yang dilakukan oleh sistem.

Escalation Alert tidak diperbolehkan menggunakan data yang dihitung atau dikelola secara terpisah dari mekanisme SLA Monitoring.

---

### EA-011 – Single Source of Truth

SLA Monitoring merupakan **Single Source of Truth** untuk menentukan apakah sebuah dokumen memenuhi kondisi **Overdue**.

Escalation Alert tidak melakukan perhitungan SLA secara mandiri dan hanya menggunakan hasil evaluasi dari modul SLA Monitoring.

## 13.6 Business Rules

Business Rules berikut mendefinisikan aturan bisnis yang berlaku pada fitur **Escalation Alert**.

| Rule ID | Business Rule |
|----------|---------------|
| **EA-001** | Sistem hanya menampilkan dokumen dengan **SLA Status = Overdue** pada halaman **Escalation Alert**. |
| **EA-002** | Dokumen yang memenuhi kondisi **Overdue** harus secara otomatis ditampilkan pada halaman **Escalation Alert** tanpa memerlukan tindakan manual dari pengguna. |
| **EA-003** | Dokumen harus otomatis dihapus dari halaman **Escalation Alert** apabila **SLA Status** tidak lagi bernilai **Overdue**. |
| **EA-004** | Escalation Level dihitung secara otomatis berdasarkan jumlah **Overdue Days** sesuai ketentuan pada **13.3 Escalation Level**. |
| **EA-005** | Escalation Level merupakan **derived data** dan tidak boleh disimpan sebagai data permanen di dalam database. |
| **EA-006** | Sistem harus membuat satu Notification ketika dokumen pertama kali memasuki kondisi **Overdue**. |
| **EA-007** | Notification Escalation Alert dikirim kepada Admin, Document Owner, Team Process, dan Team Project pada Project milik Document. |
| **EA-008** | Selama dokumen masih berada pada kondisi **Overdue**, sistem tidak boleh membuat Notification tambahan untuk dokumen yang sama. |
| **EA-009** | Escalation Alert hanya berfungsi sebagai media monitoring dan tidak boleh mengubah Status Dokumen, Revision Status, Current Assignee, maupun Business Workflow. |
| **EA-010** | Seluruh data yang ditampilkan pada halaman **Escalation Alert** harus berasal dari hasil evaluasi **SLA Monitoring** sebagai **Single Source of Truth**. |

---

### Rule Summary

Fitur Escalation Alert dibangun berdasarkan prinsip berikut:

- Monitoring dilakukan secara otomatis berdasarkan hasil evaluasi SLA.
- Hanya dokumen **Overdue** yang ditampilkan.
- Notification dibuat satu kali untuk setiap kejadian **Overdue**.
- Escalation Level dihitung secara dinamis.
- Escalation Alert tidak mempengaruhi proses bisnis maupun alur persetujuan dokumen.

## 13.7 Acceptance Criteria

Fitur **Escalation Alert** dinyatakan memenuhi kebutuhan bisnis apabila seluruh kriteria berikut telah terpenuhi.

| No | Acceptance Criteria | Expected Result |
|----|---------------------|-----------------|
| AC-01 | Dokumen dengan **SLA Status = Overdue** | Dokumen otomatis ditampilkan pada halaman **Escalation Alert**. |
| AC-02 | Dokumen dengan **SLA Status ≠ Overdue** | Dokumen tidak ditampilkan pada halaman **Escalation Alert**. |
| AC-03 | Dokumen berubah dari **Overdue** menjadi status SLA lainnya | Dokumen otomatis dihapus dari halaman **Escalation Alert**. |
| AC-04 | Dokumen pertama kali memasuki kondisi **Overdue** | Sistem membuat satu **Notification** untuk setiap Admin, Document Owner, Team Process, dan Team Project pada Project milik Document. |
| AC-05 | Dokumen tetap berada pada kondisi **Overdue** | Sistem tidak membuat Notification tambahan. |
| AC-06 | Escalation Level ditampilkan | Nilai Level dihitung sesuai jumlah **Overdue Days** sebagaimana didefinisikan pada **13.3 Escalation Level**. |
| AC-07 | Jumlah hari keterlambatan melebihi 10 hari | Escalation Level tetap ditampilkan sebagai **Level 4**. |
| AC-08 | Halaman **Escalation Alert** ditampilkan | Seluruh data berasal dari hasil evaluasi **SLA Monitoring**. |
| AC-09 | Pengguna membuka halaman **Escalation Alert** | Pengguna dapat melihat informasi dokumen tanpa mengubah Status Dokumen, Revision Status, maupun Business Workflow. |
| AC-10 | Pengguna memilih aksi **View** | Sistem menampilkan detail dokumen sesuai hak akses pengguna tanpa mengubah data dokumen. |
| AC-11 | Pengguna mengganti **Active Project** | Halaman **Escalation Alert** dimuat ulang dan hanya menampilkan dokumen **Overdue** milik **Active Project** yang baru. |
| AC-12 | Pengguna mencoba mengakses dokumen **Overdue** dari Project lain | Sistem menolak akses dan dokumen tidak ditampilkan pada **Escalation Alert**. |
| AC-13 | **Active Project** menjadi **Inactive** atau **Project Membership** pengguna tidak lagi valid | Sistem membatalkan akses ke **Escalation Alert** hingga pengguna memilih **Active Project** lain yang masih dapat diakses. |

---

### Definition of Done

Fitur **Escalation Alert** dinyatakan selesai apabila seluruh kondisi berikut terpenuhi:

- Sistem secara otomatis mendeteksi dokumen yang berstatus **Overdue**.
- Dokumen **Overdue** otomatis ditampilkan pada halaman **Escalation Alert**.
- Dokumen otomatis dihapus dari halaman Escalation Alert ketika sudah tidak lagi berstatus **Overdue**.
- Escalation Level dihitung secara dinamis sesuai jumlah **Overdue Days**.
- Escalation Level tidak disimpan sebagai data permanen di dalam database.
- Notification dibuat satu kali ketika dokumen pertama kali menjadi **Overdue**.
- Notification dikirim kepada Admin, Document Owner, Team Process, dan Team Project pada Project milik Document.
- Escalation Alert tidak mengubah Business Workflow, Status Dokumen, maupun Revision Status.
- Seluruh informasi pada halaman Escalation Alert berasal dari hasil evaluasi **SLA Monitoring**.

---

### Success Criteria

Implementasi Escalation Alert dianggap berhasil apabila:

- Seluruh dokumen **Overdue** dapat dimonitor melalui satu halaman terpusat.
- Admin, Document Owner, Team Process, dan Team Project pada Project milik Document menerima Notification ketika dokumen pertama kali menjadi **Overdue**.
- Tidak terjadi pengiriman Notification berulang untuk dokumen yang sama selama masih berada pada kondisi **Overdue**.
- Pengguna dapat mengidentifikasi tingkat keterlambatan dokumen melalui **Escalation Level**.
- Fitur berjalan tanpa mengubah proses bisnis yang telah didefinisikan pada Business Workflow.

---

# ==============================================================================
# PART 14 — MULTI PROJECT MANAGEMENT
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Document Level** | Core Design Document |
| **Document Status** | Draft |
| **Owner** | Product Owner |
| **Purpose** | Menjelaskan Project Management, Active Project Selector, Project Membership, dan Project Data Isolation pada EDMS. |
| **Depends On** | BUSINESS-WORKFLOW.md → Multi Project Context, PART 3 — Authentication, PART 9 — User Management, PART 10 — Role Management |
| **Design Reference** | System Standard Layout |
| **Related Modules** | Seluruh Product Module operasional |
| **Used By** | UI-GUIDELINES.md, IMPLEMENTATION-PLAN.md |
| **Primary Audience** | Product Owner, UI/UX Designer, Frontend Developer, Backend Developer, QA Engineer |
| **Change Impact** | Very High |
| **Last Review** | CR-004 Architecture Review |

---

# 14.1 Overview

Multi Project Management memungkinkan satu aplikasi EDMS mengelola banyak Project menggunakan Business Workflow yang sama.

Setiap Project memiliki data operasional yang terisolasi, meliputi:

- Document.
- Revision.
- Workflow.
- SLA.
- Escalation.
- Notification.
- Audit Trail.
- Document Timeline.
- Dashboard Read Model.

Multi Project Management terdiri dari tiga kemampuan utama:

- Project Management.
- Active Project Selector.
- Project Membership.

---

# 14.2 Objectives

Multi Project Management dikembangkan untuk:

- Mendukung banyak Project dalam satu aplikasi.
- Menjamin isolasi data antar Project.
- Memungkinkan Admin mengelola Project.
- Memungkinkan User Account menjadi anggota lebih dari satu Project.
- Memungkinkan Official Role berbeda pada setiap Project.
- Menyediakan Active Project sebagai konteks seluruh aktivitas pengguna.
- Mempertahankan Business Workflow yang sama pada seluruh Project.

---

# 14.3 Project Domain

Project merupakan scope utama data operasional EDMS.

Setiap Project memiliki informasi minimal berikut:

| Field | Description |
|-------|-------------|
| Project ID | Identifier unik Project yang dihasilkan sistem. |
| Project Code | Kode unik Project. |
| Project Name | Nama Project. |
| Description | Deskripsi Project. |
| Status | Active atau Inactive. |
| Created Date | Waktu Project dibuat. |
| Created By | User yang membuat Project. |
| Last Updated | Waktu perubahan terakhir. |
| Last Updated By | User terakhir yang mengubah Project. |

Project ID dan Project Code harus unik.

---

# 14.4 Project Lifecycle

Project menggunakan lifecycle:

```text
Active

↓

Inactive

↓

Active
```

Project tidak dihapus melalui lifecycle normal.

Project Inactive:

- tidak dapat dipilih sebagai Active Project;
- tidak menerima Document baru;
- tidak menerima Workflow Action baru;
- tetap mempertahankan seluruh data dan riwayat;
- tetap dapat tersedia untuk kebutuhan Audit sesuai Permission.

---

# 14.5 Project Management

Project Management hanya tersedia kepada Admin atau User yang memiliki Permission administrasi Project.

Project Management merupakan System-Level Administration Module dan tidak membutuhkan Active Project.

Admin atau User dengan Permission administrasi Project tetap dapat membuka Project Management walaupun belum memiliki Project Membership Active.

Fitur meliputi:

- View Project List.
- Create Project.
- Edit Project.
- Activate Project.
- Deactivate Project.

Create Project wajib membuat Initial Project Membership untuk Creator Project.

Initial Project Membership menggunakan:

- User = Creator Project.
- Official Role = Admin.
- Membership Status = Active.

Initial Project Membership dibuat dalam satu proses transaksi dengan Create Project.

Apabila pembuatan Initial Project Membership gagal, Create Project dianggap gagal.

Initial Project Membership tidak menggantikan Project Membership Management.

Project Management tidak mengubah Business Workflow Document.

First-Time System Bootstrap:

- Admin dapat Login tanpa Active Project.
- Admin dapat membuka System-Level Administration berdasarkan Permission.
- Admin dapat membuat Project pertama.
- Create Project membuat Initial Project Membership untuk Creator Project.
- Project baru muncul pada Active Project Selector setelah Project Context dimuat ulang.
- Project-Scoped Module baru dapat digunakan setelah Active Project tersedia.

No Project Access State tidak boleh menjadi pengganti global untuk seluruh Application Shell.

No Project Access State hanya ditampilkan pada Project-Scoped Module.

---

# 14.6 Project Management Table

Project Management Table menampilkan:

| Column | Description |
|--------|-------------|
| No | Nomor urut. |
| Project Code | Kode unik Project. |
| Project Name | Nama Project. |
| Description | Deskripsi singkat Project. |
| Status | Active atau Inactive. |
| Member Count | Jumlah Project Membership Active. |
| Document Count | Jumlah Document dalam Project. |
| Actions | Edit dan Activate/Deactivate. |

Tombol Delete Project tidak ditampilkan.

---

# 14.7 Project Form

Create Project dan Edit Project menggunakan field:

| Field | Create | Edit | Required |
|-------|:------:|:----:|:--------:|
| Project Code | ✓ | ✓ | ✓ |
| Project Name | ✓ | ✓ | ✓ |
| Description | ✓ | ✓ | Optional |
| Status | âœ“ | âœ“ | âœ“ |

Project Code harus unik.

Project yang telah memiliki data operasional tidak dapat dipindahkan atau digabung melalui Project Form.

Project Code tidak dapat diubah apabila Project telah memiliki Document atau data operasional lain.

---

# 14.8 Active Project Selector

Active Project Selector tersedia pada Top Navigation.

Selector hanya menampilkan Project yang memenuhi seluruh kondisi berikut:

- Project berstatus Active.
- User Account berstatus Active.
- User memiliki Project Membership Active.

Ketika User memilih Project:

- Project menjadi Active Project.
- Seluruh Project-Scoped Module dimuat ulang.
- Data Project sebelumnya tidak diubah.
- Search, Filter, Sort, dan Pagination dapat dikembalikan ke kondisi default.
- Business Workflow tetap sama.

Apabila User hanya memiliki satu Project Membership Active, Project tersebut dapat dipilih otomatis.

---

# 14.9 Project Membership Domain

Project Membership merupakan hubungan antara User Account, Project, Official Role, dan Membership Status.

Setiap Project Membership memiliki:

| Field | Description |
|-------|-------------|
| Project Membership ID | Identifier unik Membership. |
| User Account | User yang menjadi anggota Project. |
| Project | Project yang diberikan kepada User. |
| Official Role | Admin, Document Owner, Team Process, atau Team Project. |
| Membership Status | Active atau Inactive. |
| Assigned Date | Waktu Membership dibuat. |
| Assigned By | Admin yang memberikan Membership. |
| Last Updated | Waktu perubahan terakhir. |
| Last Updated By | User terakhir yang mengubah Membership. |

Satu User Account dapat memiliki banyak Project Membership pada Project yang berbeda.

Kombinasi User Account dan Project tidak boleh menghasilkan Membership duplikat.

---

# 14.10 Project Membership Management

Project Membership Management menyediakan fitur:

- View Project Member List.
- Add User to Project.
- Update Official Role.
- Activate Membership.
- Deactivate Membership.

Project Membership tidak mengubah User Account global.

Deactivate Membership:

- menghapus akses User terhadap Project;
- tidak menonaktifkan User Account;
- tidak menghapus riwayat aktivitas;
- tidak menghapus Notification, Audit Trail, atau Document History.

Audit Trail wajib mencatat:

- Membership Created.
- Membership Updated.
- Membership Activated.
- Membership Deactivated.

Legacy User Membership Migration:

- hanya berlaku untuk User Account yang sudah tersedia sebelum Multi Project dan belum memiliki Project Membership apa pun;
- menggunakan APP EDMS Baseline Project sebagai Project tujuan;
- menggunakan Official Role legacy yang valid sebagai Official Role Project Membership;
- memetakan User Status Active menjadi Membership Status Active;
- memetakan User Status Inactive menjadi Membership Status Inactive;
- tidak memberikan akses otomatis ke Project lain;
- bersifat idempotent dan tidak membuat Membership duplikat;
- tidak berlaku untuk User Account baru setelah Multi Project aktif.

User Account baru tetap memperoleh akses Project melalui Project Membership Management.

---

# 14.11 Official Role Assignment

Official Role operasional diberikan melalui Project Membership.

Ketika Active Project tersedia, Official Role operasional yang berlaku adalah Official Role dari Active Project Membership milik Current User.

Active Official Role digunakan untuk:

- Authorization Project-Scoped Operation.
- Navigation dan Action Visibility pada Project-Scoped Module.
- Create Document.
- Edit Document.
- Upload Revision.
- Workflow Approval A/B/C.
- Workflow Comment dan Workflow Attachment.
- Responsible Role Validation.
- Current Assignee Resolution.
- Notification Recipient Resolution.
- Audit Trail Project-Scoped Actor Context.

System-Level Administration tetap menggunakan System-Level Role dan Permission.

Legacy Official Role pada User Account hanya digunakan untuk kebutuhan backward compatibility dan Legacy User Membership Migration.

Setelah User memiliki Project Membership, Legacy Official Role tidak boleh mengoverride Active Project Membership Official Role.

Role yang tersedia:

- Admin.
- Document Owner.
- Team Process.
- Team Project.

Role Admin digunakan sebagai Initial Project Membership untuk Creator Project dan tetap merepresentasikan kewenangan administrasi.

Contoh:

| User Account | Project | Official Role |
|--------------|---------|---------------|
| Andi | Project A | Team Process |
| Andi | Project B | Team Project |
| Budi | Project A | Document Owner |

Perubahan Official Role pada satu Project tidak memengaruhi Project lain.

---

# 14.12 Project Data Isolation

Seluruh data operasional wajib memiliki Project Context.

Project Data Isolation berlaku terhadap:

- Dashboard.
- Document Register.
- Create Document.
- Edit Document.
- Workflow A/B/C.
- Upload Revision.
- Viewer.
- Download.
- Comment.
- History.
- SLA Monitoring.
- Escalation Alert.
- Notification.
- Audit Trail.

Sistem wajib menolak request apabila Project Context tidak sesuai dengan Project milik Resource.

Project ID dari Frontend tidak boleh dipercaya tanpa validasi Project Membership dan Resource Ownership.

---

# 14.13 Business Rules

| Rule ID | Description |
|---------|-------------|
| BR-MPJ-001 | Satu aplikasi EDMS dapat mengelola banyak Project. |
| BR-MPJ-002 | Seluruh Project menggunakan Business Workflow yang sama. |
| BR-MPJ-003 | Setiap data operasional wajib dimiliki oleh satu Project. |
| BR-MPJ-004 | User hanya dapat mengakses Project melalui Project Membership Active. |
| BR-MPJ-005 | Project Inactive tidak dapat dipilih sebagai Active Project. |
| BR-MPJ-006 | User Account Inactive tidak dapat mengakses Project. |
| BR-MPJ-007 | Official Role operasional ditentukan melalui Project Membership. |
| BR-MPJ-008 | Data antar Project tidak boleh bercampur. |
| BR-MPJ-009 | Perpindahan Active Project tidak mengubah Business Data. |
| BR-MPJ-010 | Document tidak dapat dipindahkan antar Project melalui Edit atau Workflow Action. |
| BR-MPJ-011 | Project dan Project Membership menggunakan lifecycle Active/Inactive. |
| BR-MPJ-012 | Deactivation tidak menghapus riwayat maupun data terkait. |
| BR-MPJ-013 | Create Project wajib membuat Initial Project Membership Active untuk Creator Project dengan Official Role Admin. |
| BR-MPJ-014 | Kombinasi User Account dan Project tidak boleh memiliki Membership duplikat. |
| BR-MPJ-015 | Legacy User tanpa Project Membership dimigrasikan satu kali ke APP EDMS Baseline Project apabila memiliki Official Role dan User Status yang valid. |
| BR-MPJ-016 | User Account baru tidak otomatis memperoleh Membership ke APP EDMS Baseline Project. |

---

# 14.14 Validation Rules

| Validation ID | Validation | Expected Result |
|---------------|------------|-----------------|
| VAL-MPJ-001 | Project Code kosong. | Project tidak dapat disimpan. |
| VAL-MPJ-002 | Project Code duplikat. | Project tidak dapat disimpan. |
| VAL-MPJ-003 | Project Name kosong. | Project tidak dapat disimpan. |
| VAL-MPJ-004 | Project Inactive dipilih. | Project tidak dapat menjadi Active Project. |
| VAL-MPJ-005 | User tidak memiliki Project Membership. | Akses Project ditolak. |
| VAL-MPJ-006 | Project Membership Inactive. | Akses Project ditolak. |
| VAL-MPJ-007 | User Account Inactive. | Akses aplikasi ditolak. |
| VAL-MPJ-008 | Resource berasal dari Project lain. | Request ditolak. |
| VAL-MPJ-009 | Membership duplikat. | Membership tidak dapat disimpan. |
| VAL-MPJ-010 | Official Role tidak valid. | Membership tidak dapat disimpan. |
| VAL-MPJ-011 | Initial Project Membership gagal dibuat. | Create Project dianggap gagal. |
| VAL-MPJ-012 | Legacy Baseline Project tidak ditemukan. | Legacy User Membership Migration dihentikan dengan error yang jelas. |
| VAL-MPJ-013 | Legacy Official Role tidak dikenali. | User tersebut tidak dimigrasikan dan dicatat pada hasil migrasi. |

---

# 14.15 Permission Matrix

| Feature | Admin | Document Owner | Team Process | Team Project |
|---------|:-----:|:--------------:|:------------:|:------------:|
| View Accessible Project | ✓ | ✓ | ✓ | ✓ |
| Switch Active Project | ✓ | ✓ | ✓ | ✓ |
| View Project Management | ✓ | ✗ | ✗ | ✗ |
| Create Project | ✓ | ✗ | ✗ | ✗ |
| Edit Project | ✓ | ✗ | ✗ | ✗ |
| Activate/Deactivate Project | ✓ | ✗ | ✗ | ✗ |
| View Project Membership | ✓ | Project Access Only | Project Access Only | Project Access Only |
| Add Project Member | ✓ | ✗ | ✗ | ✗ |
| Update Project Member | ✓ | ✗ | ✗ | ✗ |
| Activate/Deactivate Membership | ✓ | ✗ | ✗ | ✗ |

Permission detail tetap mengikuti sistem Permission resmi proyek.

---

# 14.16 Error Handling

| Error Condition | System Behaviour |
|-----------------|------------------|
| Project tidak ditemukan | Menampilkan Project Not Found. |
| Project Inactive | Menolak akses dan meminta pemilihan Project lain. |
| Membership tidak ditemukan | Menampilkan Access Denied. |
| Membership Inactive | Menampilkan Access Denied. |
| Cross Project Access | Menolak request tanpa menampilkan data Resource. |
| Gagal menyimpan Project | Mempertahankan input dan menampilkan Error Message. |
| Gagal menyimpan Membership | Mempertahankan input dan menampilkan Error Message. |

---

# 14.17 Acceptance Criteria

Multi Project Management dinyatakan memenuhi spesifikasi apabila:

- Admin dapat membuat dan mengubah Project.
- Admin dapat Activate dan Deactivate Project.
- User hanya melihat Project yang dapat diakses.
- User dapat mengganti Active Project.
- Seluruh Project-Scoped Module mengikuti Active Project.
- Admin dapat menambahkan User ke Project.
- Admin dapat menetapkan Official Role per Project.
- User dapat memiliki Official Role berbeda pada Project berbeda.
- Project Membership dapat diaktifkan dan dinonaktifkan.
- Data antar Project tidak bercampur.
- Project Inactive tidak dapat digunakan untuk aktivitas baru.
- Deactivation tidak menghapus data maupun riwayat.
- Business Workflow A/B/C tetap tidak berubah.

---

# 14.18 Cross Reference

Bagian ini mengacu pada:

- BUSINESS-WORKFLOW.md → Multi Project Context.
- PART 2 — Product Overview.
- PART 3 — Authentication.
- PART 4 — Dashboard.
- PART 5 — Document Register.
- PART 6 — SLA Monitoring.
- PART 7 — Audit Trail.
- PART 8 — Notification.
- PART 9 — User Management.
- PART 10 — Role Management.
- PART 13 — Escalation Alert.

---

# ==============================================================================
# PART 15 — APPENDIX
# 15.1 Overview
# ==============================================================================

## 15.1 Overview

Appendix merupakan bagian penutup dari Product Requirement Document (PRD) Engineering Document Management System (EDMS).

PART ini berfungsi sebagai referensi pendukung yang melengkapi spesifikasi pada PART sebelumnya tanpa mendefinisikan kebutuhan bisnis maupun perilaku sistem yang baru.

Seluruh informasi pada Appendix digunakan untuk membantu pembaca memahami istilah, referensi dokumen, ruang lingkup implementasi, serta informasi pendukung lainnya yang digunakan selama proses pengembangan EDMS.

---

### Purpose

Appendix disediakan untuk:

- Menyediakan referensi pendukung bagi seluruh PART pada PRD.
- Menjelaskan istilah dan akronim yang digunakan secara konsisten pada proyek.
- Menjadi referensi terhadap dokumen Source of Truth lainnya.
- Mendokumentasikan batasan implementasi dan ruang lingkup versi saat ini.

Appendix tidak digunakan untuk menambahkan Feature Requirement, Business Workflow, maupun Business Rule baru.

---

### Scope

PART 14 mencakup informasi berikut:

- Terminology
- Acronyms
- Document Reference
- Assumptions & Limitations
- Revision History

Seluruh informasi tersebut bersifat referensi dan tidak mengubah spesifikasi yang telah didefinisikan pada PART sebelumnya.

---

### Source of Truth

PART 14 menjadi **Single Source of Truth** untuk:

- Terminology
- Acronyms
- Document References
- Assumptions & Limitations
- Revision History

Seluruh Feature Requirement, Business Workflow, User Interface, maupun System Behaviour tetap mengacu pada PART dan dokumen yang menjadi Source of Truth masing-masing.


# ==============================================================================
# PART 15 — APPENDIX
# 15.2 Terminology
# ==============================================================================

## 15.2 Terminology

Bagian ini mendefinisikan istilah-istilah utama yang digunakan secara konsisten pada Product Requirement Document (PRD) Engineering Document Management System (EDMS).

Seluruh istilah pada bagian ini berlaku sebagai referensi resmi selama proses analisis, desain, pengembangan, pengujian, maupun pemeliharaan sistem.

---

### Business Terminology

| Term | Definition |
|------|------------|
| Engineering Document | Dokumen teknis yang dikelola oleh EDMS selama seluruh siklus hidup dokumen. |
| Document Register | Modul utama yang digunakan untuk melihat dan mengelola daftar Engineering Document. |
| Business Workflow | Alur proses bisnis yang mengatur perpindahan status dokumen sesuai aturan perusahaan. |
| Revision | Identitas revisi dokumen yang menunjukkan tahapan perkembangan dokumen. |
| Workflow Status | Status aktif dokumen pada Business Workflow. |
| Workflow Comment | Hasil review yang dapat berisi komentar teks dan/atau Workflow Attachment pada Approval B atau Approval C. |
| Workflow Attachment | File pendukung berupa PDF atau gambar yang dilampirkan Reviewer pada Approval B atau Approval C sebagai bagian dari Workflow Comment. Workflow Attachment bukan Document Revision maupun Active Engineering Document. |
| SLA Monitoring | Mekanisme pemantauan waktu penyelesaian proses dokumen berdasarkan target yang ditentukan. |
| Notification | Informasi yang dikirimkan sistem kepada pengguna mengenai aktivitas atau perubahan pada dokumen. |
| Audit Trail | Riwayat aktivitas yang dicatat sistem untuk keperluan pelacakan perubahan. |
| Transmittal | Modul placeholder yang disediakan sebagai persiapan implementasi fitur Transmittal pada versi mendatang. |

---

### User & Organization Terminology

| Term | Definition |
|------|------------|
| User | Pengguna yang memiliki akun dan dapat mengakses EDMS sesuai hak aksesnya. |
| User Management | Modul administrasi untuk mengelola akun pengguna. |
| User Profile | Modul yang digunakan pengguna untuk mengelola akun pribadinya sendiri. |
| Official Role | Peran resmi pengguna yang digunakan sebagai dasar pembagian tanggung jawab dalam sistem. |
| Department | Unit organisasi tempat pengguna terdaftar. |

---

### System Terminology

| Term | Definition |
|------|------------|
| Authentication | Mekanisme verifikasi identitas pengguna sebelum mengakses sistem. |
| Login Session | Status autentikasi aktif setelah pengguna berhasil Login. |
| Placeholder | Halaman sementara yang disediakan sebelum suatu fitur diimplementasikan secara penuh. |
| Main Content Area | Area utama aplikasi yang menampilkan konten sesuai menu yang dipilih pengguna. |
| Application Layout | Struktur layout global aplikasi yang terdiri dari Sidebar, Top Navigation Bar, Main Content Area, dan Footer. |

---

### Terminology Principle

Seluruh istilah pada bagian ini digunakan secara konsisten di seluruh PRD.

Apabila terdapat istilah yang memiliki definisi resmi pada PART tertentu, maka definisi tersebut tetap menjadi **Single Source of Truth**, sedangkan bagian Terminology hanya berfungsi sebagai referensi ringkas.

# ==============================================================================
# PART 15 — APPENDIX
# 15.3 Acronyms
# ==============================================================================

## 15.3 Acronyms

Bagian ini mendefinisikan singkatan (acronyms) yang digunakan secara konsisten pada Product Requirement Document (PRD) Engineering Document Management System (EDMS).

Seluruh singkatan pada bagian ini berlaku sebagai referensi resmi selama proses analisis, desain, pengembangan, pengujian, maupun pemeliharaan sistem.

---

### Business Acronyms

| Acronym | Definition |
|----------|------------|
| EDMS | Engineering Document Management System |
| SLA | Service Level Agreement |
| PFD | Process Flow Diagram |
| P&ID | Piping and Instrumentation Diagram |

---

### Document Revision Acronyms

| Acronym | Definition |
|----------|------------|
| IFR | Issued For Review |
| IFA | Issued For Approval |
| AFC | Approved For Construction |
| As-Built | Final document reflecting actual construction results |

---

### System Acronyms

| Acronym | Definition |
|----------|------------|
| UI | User Interface |
| UX | User Experience |
| API | Application Programming Interface |
| RBAC | Role-Based Access Control |

---

### Acronym Principle

Seluruh singkatan pada bagian ini digunakan secara konsisten di seluruh dokumentasi proyek.

Apabila terdapat perubahan terhadap definisi suatu singkatan sesuai standar perusahaan atau kebutuhan bisnis, maka perubahan tersebut harus dilakukan pada bagian ini agar tetap menjadi referensi resmi bagi seluruh dokumentasi proyek.

# ==============================================================================
# PART 15 — APPENDIX
# 15.4 Document Reference
# ==============================================================================

## 15.4 Document Reference

Bagian ini mendefinisikan dokumen-dokumen yang digunakan sebagai referensi resmi selama penyusunan, pengembangan, dan pemeliharaan Product Requirement Document (PRD) Engineering Document Management System (EDMS).

Seluruh dokumen pada bagian ini berfungsi sebagai pendukung implementasi dan harus digunakan sesuai domain yang menjadi tanggung jawab masing-masing.

---

### Core Reference Documents

Dokumen berikut merupakan referensi utama dalam penyusunan PRD:

| Document | Purpose |
|----------|---------|
| BUSINESS-WORKFLOW.md | Mendefinisikan Business Workflow dan Business Rule EDMS. |
| SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable) | Mendefinisikan kebutuhan sistem secara keseluruhan. |
| FEATURE-MAPPING.md (Historical Reference / Unavailable) | Mendefinisikan pemetaan fitur berdasarkan kebutuhan bisnis. |
| PRD.md | Mendefinisikan kebutuhan produk sebagai Single Source of Truth untuk implementasi fitur. |

---

### Supporting Reference Documents

Dokumen berikut digunakan sebagai referensi pendukung implementasi:

| Document | Purpose |
|----------|---------|
| UI-GUIDELINES.md | Standar desain antarmuka pengguna. |
| COMPONENT-SPEC.md | Spesifikasi komponen antarmuka pengguna. |
| ROUTING.md | Struktur Routing aplikasi. |
| STATE-MANAGEMENT.md | Pengelolaan State aplikasi. |
| ACCESS-CONTROL.md | Arsitektur Access Control dan hak akses pengguna. |
| API-CONTRACT.md | Kontrak komunikasi antara Frontend dan Backend. |
| IMPLEMENTATION-PLAN.md | Rencana implementasi dan tahapan pengembangan proyek. |
| CHANGE-REQUEST.md | Mencatat perubahan kebutuhan resmi yang diajukan setelah Source of Truth disetujui, termasuk alasan, dampak, status, dan sprint implementasinya. |

---

### Reference Principle

Setiap dokumen memiliki domain kepemilikan (ownership) yang berbeda.

Perubahan terhadap suatu domain harus dilakukan pada dokumen yang menjadi **Single Source of Truth** untuk domain tersebut.

PRD tidak menggantikan tanggung jawab dokumen referensi lainnya.

---

### Documentation Hierarchy

Urutan referensi dokumentasi pada proyek EDMS adalah sebagai berikut:

```text
BUSINESS-WORKFLOW.md
            │
            ▼
SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable)
            │
            ▼
FEATURE-MAPPING.md (Historical Reference / Unavailable)
            │
            ▼
PRD.md
            │
            ▼
Supporting Documents
```

Seluruh dokumentasi pendukung harus tetap konsisten terhadap dokumen yang berada pada tingkat referensi di atasnya.

---

### Architecture Note

Apabila terjadi perubahan kebutuhan bisnis, maka pembaruan harus dilakukan secara berurutan sesuai Documentation Hierarchy.

Perubahan tidak diperbolehkan dimulai dari dokumen implementasi apabila mempengaruhi kebutuhan bisnis yang telah didefinisikan pada dokumen referensi tingkat atas.

### Change Request Reference

Perubahan kebutuhan yang berasal dari permintaan Client wajib dicatat terlebih dahulu pada `CHANGE-REQUEST.md`.

Setelah Change Request disetujui, dokumen Source of Truth yang terdampak harus diperbarui sebelum perubahan diterapkan pada implementasi sistem.

Workflow Comment Attachment pada Approval B dan Approval C berasal dari:

- CR-001 — Workflow Comment Attachment

# ==============================================================================
# PART 15 — APPENDIX
# 15.5 Assumptions & Limitations
# ==============================================================================

## 15.5 Assumptions & Limitations

Bagian ini mendokumentasikan asumsi, batasan implementasi, serta ruang lingkup yang digunakan selama penyusunan Product Requirement Document (PRD) Engineering Document Management System (EDMS).

Seluruh asumsi dan batasan pada bagian ini berlaku untuk versi PRD saat ini dan dapat diperbarui apabila kebutuhan bisnis berubah secara resmi.

---

### Current Scope

Versi PRD ini hanya mencakup kebutuhan bisnis yang telah disetujui dan didefinisikan secara resmi.

Seluruh fitur, Business Workflow, User Interface, maupun System Behaviour yang terdapat pada PRD merupakan hasil kebutuhan bisnis yang telah dikonfirmasi selama proses analisis.

---

### Assumptions

Selama penyusunan PRD ini digunakan asumsi berikut:

- Official Role menggunakan pendekatan **Fixed Role**.
- Notification menggunakan pendekatan **Personal Notification**.
- User Profile hanya mengelola akun pengguna yang sedang Login.
- Transmittal disediakan sebagai Placeholder Module tanpa fungsi operasional.
- Workflow Comment dapat berisi komentar teks dan/atau satu Workflow Attachment sesuai aturan Approval B dan Approval C pada BUSINESS-WORKFLOW.md.
- Workflow Attachment merupakan file pendukung hasil review dan bukan Document Revision, Active Engineering Document, maupun Upload Revision.
- File yang dipilih user untuk Create Document, Upload Revision, Workflow Comment Attachment, Approval B attachment, atau Approval C attachment diproses melalui temporary upload terlebih dahulu; permanent storage hanya dibuat setelah aksi Save atau Submit berhasil.
- Seluruh Navigation, Layout, dan Business Workflow mengikuti Source of Truth yang telah ditetapkan pada dokumen referensi.

---

### Limitations

Versi PRD ini tidak mencakup:

- Dynamic Role Management (Historical Reference / not included in current runtime).
- Implementasi penuh modul Transmittal.
- Fitur yang belum memiliki kebutuhan bisnis resmi.
- Workflow Attachment pada versi saat ini dibatasi maksimal satu file untuk setiap tindakan Approval B atau Approval C.
- Workflow Attachment pada versi saat ini hanya mendukung format PDF, PNG, JPG, dan JPEG.
- Workflow Attachment tidak menyediakan fitur annotation atau markup langsung di dalam aplikasi.
- Perubahan terhadap Business Workflow yang belum disetujui.

Seluruh fitur di luar ruang lingkup tersebut dianggap berada di luar cakupan versi saat ini.

---

### Future Enhancement

Pengembangan berikutnya dapat mencakup implementasi fitur yang saat ini masih berada di luar ruang lingkup, setelah tersedia:

- Business Requirement yang telah disetujui.
- Business Workflow yang telah didefinisikan.
- User Interface yang telah disetujui.
- Business Rule yang telah ditetapkan.

Seluruh pengembangan baru harus tetap mengikuti Documentation Hierarchy dan Single Source of Truth yang berlaku.

---

### Architecture Principles

Assumptions & Limitations dikembangkan berdasarkan prinsip berikut:

- Requirement First
- No Business Assumption
- Scope Driven Development
- Future Ready
- Single Source of Truth

Keputusan implementasi pada PRD ini hanya didasarkan pada kebutuhan bisnis yang telah dikonfirmasi dan bukan berdasarkan asumsi implementasi.

# ==============================================================================
# PART 15 — APPENDIX
# 15.6 Revision History
# ==============================================================================

## 15.6 Revision History

Bagian ini mendokumentasikan riwayat perubahan resmi terhadap Product Requirement Document (PRD) Engineering Document Management System (EDMS).

Revision History digunakan untuk mencatat perubahan yang mempengaruhi kebutuhan bisnis, arsitektur sistem, maupun ruang lingkup produk.

Perubahan editorial, perbaikan penulisan, atau perubahan minor yang tidak mempengaruhi spesifikasi tidak wajib dicatat pada bagian ini.

---

### Revision History

| Version | Status | Description |
|----------|--------|-------------|
| v1.0 | Initial Release | Versi awal Product Requirement Document (PRD). |
| v2.0 | Major Revision | Restrukturisasi PRD berdasarkan perubahan Business Workflow dan Architecture Review. |
| v3.0 | Current Release | Penyusunan ulang PRD berdasarkan Source of Truth terbaru, Documentation Hierarchy, dan Domain Separation Architecture. |
| v3.1 | Minor Revision | Penambahan Workflow Attachment pada Approval B dan Approval C berdasarkan CR-001, termasuk penyesuaian Workflow Comment, Comment Viewer, Audit Trail, Notification, dan dokumentasi terkait. |

---

### Revision Principle

Revision History hanya digunakan untuk mencatat perubahan yang bersifat mayor, antara lain:

- Perubahan Business Workflow.
- Perubahan Architecture.
- Penambahan atau penghapusan Feature.
- Perubahan ruang lingkup produk.
- Perubahan Source of Truth.

Perubahan minor yang tidak mempengaruhi spesifikasi utama tidak dicatat pada Revision History.

---

### Versioning Policy

Setiap perubahan versi mengikuti prinsip berikut:

| Version Type | Description |
|--------------|-------------|
| Major Version | Digunakan apabila terjadi perubahan signifikan terhadap kebutuhan bisnis, arsitektur, atau ruang lingkup sistem. |
| Minor Version | Digunakan untuk penambahan atau penyempurnaan spesifikasi tanpa mengubah arsitektur utama. |
| Editorial Update | Digunakan untuk perbaikan penulisan, konsistensi, atau format dokumentasi tanpa perubahan requirement. |

---

### Architecture Principles

Revision History dikembangkan berdasarkan prinsip berikut:

- Documentation Governance
- Traceability
- Controlled Change
- Single Source of Truth

Seluruh perubahan terhadap PRD harus dapat ditelusuri melalui proses revisi yang terdokumentasi secara resmi.

# ==============================================================================
# PART 15 — APPENDIX
# 15.7 PRD Completion
# ==============================================================================

## 15.7 PRD Completion

Product Requirement Document (PRD) ini merupakan dokumen resmi yang mendefinisikan kebutuhan produk, ruang lingkup implementasi, serta spesifikasi Engineering Document Management System (EDMS).

Seluruh Feature Requirement, Business Behaviour, User Interface, Business Rule, dan Architecture yang terdapat pada PRD ini telah disusun berdasarkan kebutuhan bisnis yang telah ditetapkan selama proses analisis.

Dokumen ini menjadi acuan utama bagi seluruh aktivitas desain, pengembangan, pengujian, serta pemeliharaan sistem sampai dilakukan revisi resmi pada versi berikutnya.

---

### PRD Summary

PRD ini mencakup spesifikasi berikut:

- Product Introduction
- Product Overview
- Authentication
- Dashboard
- Document Register
- SLA Monitoring
- Audit Trail
- Notification
- User Management
- Project Management
- Project Membership
- Profile
- Change Password
- User Profile
- Transmittal Placeholder
- Escalation Alert
- Department Management

---

### Single Source of Truth Declaration

Product Requirement Document (PRD) ini ditetapkan sebagai **Single Source of Truth** untuk seluruh kebutuhan produk Engineering Document Management System (EDMS).

Seluruh implementasi Frontend, Backend, User Interface, Business Workflow, maupun pengembangan fitur harus mengacu pada PRD ini beserta dokumen referensi yang menjadi Source of Truth pada domain masing-masing.

Perubahan terhadap kebutuhan bisnis maupun ruang lingkup produk hanya dapat dilakukan melalui proses revisi dokumentasi secara resmi sesuai Documentation Hierarchy yang telah ditetapkan.

---

### Documentation Governance

Seluruh dokumentasi proyek harus mempertahankan prinsip berikut:

- Single Source of Truth
- Documentation Hierarchy
- Domain Ownership
- Requirement First
- Controlled Change
- Cross Document Consistency

Setiap perubahan harus dilakukan pada dokumen yang menjadi pemilik domain sebelum diterapkan pada dokumen turunan maupun implementasi sistem.

---

### Final Statement

Dengan selesainya PART 14, Product Requirement Document (PRD) Engineering Document Management System (EDMS) dinyatakan **Complete**.

Dokumen ini menjadi referensi resmi selama proses analisis, desain, implementasi, pengujian, dan pengembangan sistem hingga diterbitkannya revisi resmi berikutnya.

---

# CR-012 — Project Close

CR-012 menambahkan status Project resmi ketiga yaitu `Closed`.

Lifecycle Project resmi:

```text
Active -> Inactive -> Active -> Closed
```

Transisi yang diperbolehkan:

- Active -> Inactive
- Inactive -> Active
- Active -> Closed

Transisi dari `Closed` menuju status lain tidak diperbolehkan. Project `Inactive` harus diaktifkan kembali sebelum dapat ditutup permanen.

Project `Closed` bersifat final, tidak muncul pada Active Project Selector, tidak dapat menjadi Active Project, tidak memiliki Dashboard operasional, tidak dapat membuat Document baru, tidak dapat Upload Revision, dan tidak menghasilkan Notification baru. Project Membership, seluruh histori dokumen, dan Audit Trail tetap dipertahankan.

Close Project hanya dapat dilakukan oleh User dengan Role `Admin` melalui Administration -> Project Management -> Project List -> Close Project. Proses Close menggunakan wizard tiga langkah: Project Validation, Project Summary & Closure Impact, dan Confirmation.

Validasi Close Project:

- Project harus berstatus Active.
- User memiliki Role Admin.
- Project masih tersedia.
- Project belum berubah selama wizard berlangsung.
- Tidak terdapat Document dengan workflow aktif: Process Review, Process Comment, Process Reject, Project Review, Project Comment, Project Reject.

Document dengan Workflow Status `Approved` dianggap workflow selesai. Document Lifecycle `Archived` adalah kondisi operasional terpisah. Saat Project berhasil `Closed`, seluruh Document `Approved` dengan lifecycle `Active` di-Archive otomatis. Document yang sudah `Archived` tetap `Archived` dan tidak dapat di-Restore setelah Project Closed.

Apabila Project yang sedang menjadi Active Project berhasil di-Closed, Active Project Context wajib dibersihkan. Sistem dapat menampilkan Project Selection Gateway apabila masih ada Project Active lain, atau Dashboard dengan No Active Project apabila tidak ada Project Active. Sistem tidak otomatis memilih Project lain.

# END OF DOCUMENT

---

# PHASE 2 SOURCE OF TRUTH SYNCHRONIZATION

## Current Product Scope

Produk EDMS saat ini adalah aplikasi frontend operasional dengan local persistence yang merepresentasikan workflow final sebelum backend production tersedia.

Module aktif resmi:

- Authentication: Login, Forgot Password, Check Email, Mock Email, Reset Password.
- Project Selection dan Active Project Context.
- Dashboard.
- Document Register PFD dan P&ID.
- Document Viewer, Download, Comment, Workflow History, Revision History.
- Workflow Approval A/B/C.
- Upload Revision.
- Archive dan Restore Document.
- SLA Monitoring.
- Escalation Alert.
- Notification.
- Audit Trail.
- User Management.
- Department Management.
- Project Management.
- Project Membership.
- Profile dan Change Password.

Module placeholder resmi:

- Transmittal Incoming.
- Transmittal Outgoing.
- Storage NAS.

## Product Rule Corrections

- Multi Project adalah current implementation, bukan future-only scope.
- Delete Document operasional deprecated dan diganti Archive/Restore.
- Role Management dan Permission Management sebagai route terpisah deprecated pada runtime saat ini; administrasi yang aktif adalah User, Department, Project, dan Project Membership Management.
- Backend REST API, SQL schema, dan MySQL merupakan current integrated runtime yang sudah berjalan untuk scope backend-integrated saat ini. NAS/Object Storage production tetap menjadi target architecture apabila belum aktif pada environment berjalan.

## Storage Architecture Runtime Rule

Manual UAT baseline menggunakan backend sebagai authority untuk permanent storage path.

- Physical project directory menggunakan `projects.project_code`, bukan `projects.id`.
- Database relation tetap memakai internal id: `project_id`, `document_id`, `revision_id`, dan `file_id`.
- Document file disimpan berdasarkan `DOCUMENT_NUMBER`.
- Revision file disimpan berdasarkan canonical revision label: `IFR-Submitted`, `IFA-Submitted`, `AS-Built`.
- Revision berbeda dari Workflow Status.
- Physical filename menggunakan backend submit date dan stable short id dari file identity.
- Download filename tetap menggunakan original filename yang diunggah user.
- Workflow attachment dipisahkan dari document revision dan disimpan di folder attachment komentar process/project.
- Temporary upload tetap menjadi satu-satunya pipeline file sebelum promotion permanen.

