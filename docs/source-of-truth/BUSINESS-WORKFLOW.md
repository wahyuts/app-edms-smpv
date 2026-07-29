# Engineering Document Management System (EDMS)

# BUSINESS-WORKFLOW.md

**Document Version:** 1.0  
**Document Status:** Released  
**Document Type:** Business Workflow Specification  
**Project:** Engineering Document Management System (EDMS)  
**Classification:** Internal Project Documentation  
**Owner:** Product Owner  
**Maintainer:** Solution Architect  
**Source of Truth:** Yes  
**Last Updated:** 13 July 2026

---

# Document Purpose

Dokumen ini merupakan **Business Workflow Specification** yang menjadi **Single Source of Truth** untuk seluruh proses bisnis pada Engineering Document Management System (EDMS).

Dokumen ini mendefinisikan seluruh aturan bisnis, alur kerja, lifecycle dokumen, proses approval, monitoring SLA, serta interaksi antar aktor yang terlibat dalam pengelolaan dokumen engineering.

Seluruh implementasi Frontend, Backend, Database, API, QA, maupun AI Coding Agent wajib mengacu pada dokumen ini.

---

# Objectives

BUSINESS-WORKFLOW.md dibuat dengan tujuan:

- Menjadi referensi utama Business Workflow EDMS.
- Menjelaskan lifecycle dokumen dari Upload hingga Approved.
- Menstandarkan seluruh Business Rules.
- Mendefinisikan hubungan antar aktor.
- Menjadi acuan implementasi Frontend dan Backend.
- Menjadi dasar penyusunan API, Database, dan QA Test Case.
- Menjadi Source of Truth bagi seluruh dokumentasi proyek.

---

# Scope

Dokumen ini mencakup seluruh proses bisnis yang berkaitan dengan Engineering Document Management System, meliputi:

- Document Upload Workflow
- Engineering Review Workflow
- Project Review Workflow
- Revision Management
- Approval Workflow
- Document Lifecycle
- SLA Monitoring
- Dashboard Read Model
- Workflow Notification
- Escalation
- Document Timeline
- Business Rules
- Workflow Engine
- Interaction Specification
- Implementation Reference
- Governance
- Multi Project Context
- Project Data Isolation
- Project Membership
- Project-Scoped Workflow

Dokumen ini **tidak membahas**:

- Authentication
- Login
- Logout
- User Management
- Project Management
- Project Membership
- Profile
- Change Password
- Permission Management
- Database Design
- API Implementation
- Deployment
- Infrastructure
- Source Code

Topik-topik tersebut dijelaskan pada dokumen lain.

---

# Intended Audience

Dokumen ini ditujukan untuk:

| Role | Purpose |
|------|----------|
| Product Owner | Mendefinisikan kebutuhan bisnis |
| Project Manager | Mengontrol implementasi proyek |
| Solution Architect | Mendesain arsitektur sistem |
| Frontend Developer | Implementasi User Interface |
| Backend Developer | Implementasi Business Logic |
| Database Engineer | Implementasi Database |
| QA Engineer | Penyusunan Test Case |
| UI/UX Designer | Validasi User Flow |
| AI Coding Agent | Implementasi berdasarkan Source of Truth |

---

# Document Governance

BUSINESS-WORKFLOW.md merupakan dokumen induk (Master Document) yang mendefinisikan seluruh Business Workflow EDMS.

Apabila terdapat perbedaan isi antara dokumen ini dengan dokumen lain, maka isi BUSINESS-WORKFLOW.md memiliki prioritas tertinggi.

Seluruh perubahan terhadap Business Workflow harus dilakukan dengan urutan berikut:

```text
Client Request
        │
        ▼
Change Request (CR)
        │
        ▼
Impact Analysis
        │
        ▼
Architecture Review
        │
        ▼
Update BUSINESS-WORKFLOW.md
        │
        ▼
Update Dependent Documents
```

Perubahan langsung terhadap dokumen turunan tanpa memperbarui BUSINESS-WORKFLOW.md tidak diperbolehkan.

---

# Source of Truth

BUSINESS-WORKFLOW.md merupakan **Single Source of Truth** terhadap seluruh Business Workflow EDMS.

Dokumen berikut wajib mengacu pada BUSINESS-WORKFLOW.md:

- PRD.md
- IMPLEMENTATION-PLAN.md
- API-CONTRACT.md
- ACCESS-CONTROL.md
- DOCUMENT-STATUS-RULES.md
- SLA-RULES.md
- SLA-MONITORING-SPEC.md
- UI-GUIDELINES.md
- COMPONENT-SPEC.md
- FORM-SPEC.md
- TABLE-SPEC.md
- DASHBOARD-INTERACTIONS.md
- STATE-MANAGEMENT.md
- AGENTS.md

---

# Revision History

| Version | Status | Description |
|----------|--------|-------------|
| 0.1 | Draft | Initial Business Workflow |
| 0.5 | Draft | Business Rules Completed |
| 0.8 | Draft | Workflow & Architecture Completed |
| 0.9 | Draft | Architecture Review Completed |
| 1.0 | Released | Initial Production Release |
| 2.0 | Released | Multi Project Support melalui Project Context, Project Membership, dan Project Data Isolation tanpa mengubah Workflow A/B/C. |

---

# Architecture Highlights

Business Workflow EDMS dibangun berdasarkan keputusan arsitektur berikut.

| ID | Architecture Decision |
|----|-----------------------|
| ADR-001 | Upload Revision tidak membuat Document baru |
| ADR-002 | Document Number tidak berubah saat Upload Revision |
| ADR-003 | Attachment terbaru menjadi Active Version |
| ADR-004 | Dashboard menggunakan Dashboard Read Model |
| ADR-005 | Escalation merupakan hasil monitoring SLA, bukan bagian Workflow |
| ADR-006 | SLA Status berbeda dengan Workflow Status dan Document Lifecycle |
| ADR-007 | Responsible Role berbeda dengan Current Assignee |
| ADR-008 | Document Actions dipisahkan dari Workflow Actions |
| ADR-009 | Approval C memiliki Workflow Comment yang bersifat opsional |
| ADR-010 | History menggunakan Document Timeline |
| ADR-011 | Satu aplikasi EDMS mendukung banyak Project melalui Project Context |
| ADR-012 | Seluruh data bisnis operasional wajib terisolasi berdasarkan Project |
| ADR-013 | Workflow Template digunakan bersama oleh seluruh Project |
| ADR-014 | User Account bersifat global, sedangkan Workflow Role ditetapkan melalui Project Membership |
| ADR-015 | Seluruh Workflow Event dan Supporting Services wajib membawa Project Context |

Penjelasan lengkap setiap Architecture Decision dijelaskan pada Chapter 9.

---

# Core Principles

Business Workflow EDMS dibangun berdasarkan prinsip-prinsip berikut.

## BP-001

Business Workflow merupakan Source of Truth terhadap seluruh proses dokumen.

---

## BP-002

Seluruh perubahan Status hanya dapat dilakukan melalui Workflow Engine.

---

## BP-003

Workflow Status, Document Revision, SLA Status, Responsible Role, Current Assignee, dan Document Lifecycle merupakan konsep yang berbeda dan tidak boleh saling menggantikan.

---

## BP-004

Dashboard menggunakan Dashboard Read Model dan tidak menyimpan Business State.

---

## BP-005

Document Actions tidak mengubah Business Workflow.

---

## BP-006

Workflow Actions merupakan satu-satunya aksi yang dapat mengubah Business Workflow.

---

## BP-007

Seluruh perubahan Workflow menghasilkan Audit Trail dan Document Timeline.

---

## BP-008

Supporting Services tidak mengubah Workflow dan hanya merespons hasil Workflow Engine.

---

## BP-009

Seluruh implementasi harus mengikuti Business Rules yang telah didefinisikan.

---

## BP-010

Perubahan Business Workflow harus dilakukan melalui Change Request dan Architecture Review.

---

## BP-011

Satu aplikasi EDMS dapat mengelola lebih dari satu Project.

---

## BP-012

Setiap aktivitas bisnis wajib dijalankan dalam satu Active Project.

---

## BP-013

Seluruh Document, Workflow, Revision, SLA, Escalation, Notification, dan Audit Trail wajib terisolasi berdasarkan Project.

---

## BP-014

Business Workflow A/B/C digunakan secara konsisten oleh seluruh Project dan tidak diduplikasi untuk setiap Project.

---

## BP-015

User Account bersifat global, sedangkan keanggotaan dan Official Role operasional pengguna ditentukan melalui Project Membership.

---

## BP-016

Data dari satu Project tidak boleh ditampilkan, diproses, maupun diakses dari Project lain tanpa perpindahan Active Project yang sah.

---

# High-Level Workflow

Sebelum Business Workflow Document dimulai, pengguna wajib bekerja dalam satu **Active Project**.

Project Context ditentukan melalui Project Selector atau mekanisme pemilihan Project yang sah.

Seluruh Workflow Document kemudian dijalankan hanya dalam Project tersebut.

```text
Login
        │
        ▼
Load Project Membership
        │
        ▼
Select Active Project
        │
        ▼
Load Project Context
        │
        ▼
Upload Document
        │
        ▼
Business Workflow A/B/C
```

Pemilihan Active Project tidak mengubah Workflow A/B/C.

Active Project hanya menentukan scope data dan aktivitas yang sedang digunakan.

Secara umum Business Workflow EDMS mengikuti alur berikut.

```text
Upload Document
        │
        ▼
Process Review
        │
        ▼
Engineering Review
        │
        ├─────────────► Approval A
        │                     │
        │                     ▼
        │             Project Review
        │
        ├─────────────► Approval B
        │                     │
        │                     ▼
        │            Process Comment
        │                     │
        │                     ▼
        │            Upload Revision
        │                     │
        │                     └──────────────┐
        │                                    │
        └─────────────► Approval C           │
                              │              │
                              ▼              │
                     Process Comment ◄───────┘

Project Review
        │
        ├─────────────► Approval A
        │                     │
        │                     ▼
        │                 Approved
        │
        ├─────────────► Approval B
        │                     │
        │                     ▼
        │            Project Comment
        │                     │
        │                     ▼
        │            Upload Revision
        │                     │
        │                     └──────────────┐
        │                                    │
        └─────────────► Approval C           │
                              │              │
                              ▼              │
                     Project Comment ◄───────┘
```

---

# Document Structure

BUSINESS-WORKFLOW.md terdiri dari sembilan chapter utama.

| Chapter | Title |
|----------|-------|
| 1 | Business Concepts |
| 2 | Actors & Responsibilities |
| 3 | Workflow Engine |
| 4 | Workflow Visualization |
| 5 | Business Rules |
| 6 | Workflow Supporting Services |
| 7 | Interaction Specification |
| 8 | Implementation Reference |
| 9 | Governance, Appendix & Release |

Setiap chapter saling berhubungan dan membentuk satu kesatuan Business Workflow EDMS.

---

# Reading Guide

Dokumen ini disusun secara berurutan.

Disarankan membaca dokumen sesuai urutan chapter berikut:

1. Business Concepts
2. Actors & Responsibilities
3. Workflow Engine
4. Workflow Visualization
5. Business Rules
6. Workflow Supporting Services
7. Interaction Specification
8. Implementation Reference
9. Governance, Appendix & Release

Urutan tersebut mencerminkan proses berpikir dari konsep bisnis hingga implementasi sistem.

---

# End of PART 1

PART 1 mendefinisikan fondasi BUSINESS-WORKFLOW.md dan menetapkan dokumen ini sebagai Single Source of Truth bagi seluruh Business Workflow Engineering Document Management System (EDMS).

Seluruh implementasi Frontend, Backend, Database, API, QA, maupun AI Coding Agent wajib mengacu pada prinsip-prinsip yang telah ditetapkan pada bagian ini sebelum melanjutkan ke chapter berikutnya.

# Chapter 1. Business Concepts

---

# 1.1 Introduction

Engineering Document Management System (EDMS) dibangun berdasarkan konsep bahwa sebuah dokumen engineering merupakan aset bisnis yang memiliki siklus hidup (Document Lifecycle), proses validasi (Workflow), revisi (Revision), serta target penyelesaian (SLA).

Dokumen tidak hanya berfungsi sebagai media penyimpanan file, tetapi juga sebagai objek bisnis yang mengalami perubahan status, perpindahan tanggung jawab, monitoring SLA, serta pencatatan riwayat aktivitas hingga dokumen mencapai status **Approved (Final As-Built)**.

Business Workflow pada EDMS dirancang untuk memastikan bahwa setiap perubahan terhadap dokumen:

- Terstruktur
- Dapat ditelusuri
- Dapat diaudit
- Konsisten
- Mudah dimonitor

---

# 1.2 Business Objectives

Business Workflow EDMS memiliki tujuan utama sebagai berikut:

- Mengontrol alur review dokumen engineering.
- Menstandarkan proses approval.
- Mengelola revisi dokumen secara terstruktur.
- Mengurangi kehilangan riwayat dokumen.
- Mempermudah monitoring SLA.
- Menyediakan audit trail lengkap.
- Menjamin hanya satu versi aktif (Active Version) yang digunakan.

---

# 1.3 Core Business Entities

Business Workflow EDMS terdiri dari beberapa entitas utama.

| Entity | Description |
|----------|-------------|
| Project | Entitas yang mewakili satu scope pekerjaan atau kontrak bisnis yang dikelola melalui EDMS. |
| Active Project | Project yang sedang dipilih dan menjadi konteks seluruh aktivitas pengguna. |
| Project Membership | Hubungan antara User Account, Project, dan Official Role pengguna pada Project tersebut. |
| Document | Entitas utama yang mewakili satu dokumen engineering dan selalu dimiliki oleh satu Project. |
| Revision | Tingkat perkembangan dokumen dalam satu Project. |
| Workflow | Proses perpindahan status dokumen dalam satu Project. |
| Workflow Status | Posisi dokumen dalam Workflow. |
| Responsible Role | Role yang bertanggung jawab terhadap suatu Status dalam Project. |
| Current Assignee | User yang menerima penugasan Workflow dalam Project aktif. |
| SLA | Target waktu penyelesaian review dalam satu Project. |
| Workflow Comment | Hasil review yang dapat berisi komentar dan/atau lampiran yang dibuat saat Approval B atau Approval C. |
| Document Timeline | Riwayat seluruh aktivitas Workflow dalam satu Project. |
| Dashboard Read Model | Tampilan informasi hasil Workflow berdasarkan Active Project. |
| Workflow Notification | Informasi otomatis akibat perubahan Workflow dalam Project. |
| Escalation | Monitoring dokumen yang melewati SLA dalam Project. |

---

# 1.4 Business Entity Relationship

Hubungan antar entitas digambarkan sebagai berikut.

```text
Project
│
├── Project Membership
│     │
│     ├── User Account
│     └── Official Role
│
└── Document
      │
      ├── Revision
      │
      ├── Workflow
      │     │
      │     ├── Status
      │     ├── Responsible Role
      │     └── Current Assignee
      │
      ├── SLA
      │     │
      │     ├── SLA Timer
      │     └── SLA Status
      │
      ├── Workflow Review
      │     │
      │     ├── Comment
      │     └── Attachment
      │
      ├── Escalation
      │
      ├── Workflow Notification
      │
      ├── Document Timeline
      │
      ├── Audit Trail
      │
      └── Dashboard Read Model
```

Project merupakan scope utama seluruh data bisnis.

Setiap Document hanya dimiliki oleh satu Project.

Semua Revision, Workflow, SLA, Notification, Escalation, dan Timeline mengikuti Project milik Document tersebut.

---

# 1.4.1 Multi Project Context

EDMS menggunakan konsep **Multi Project**.

Satu aplikasi EDMS dapat mengelola banyak Project dengan menggunakan Business Workflow yang sama.

Contoh struktur bisnis:

```text
EDMS
│
├── Project A
│     ├── Document
│     ├── Workflow
│     ├── SLA
│     ├── Escalation
│     ├── Notification
│     └── Audit Trail
│
├── Project B
│     ├── Document
│     ├── Workflow
│     ├── SLA
│     ├── Escalation
│     ├── Notification
│     └── Audit Trail
│
└── Project C
      ├── Document
      ├── Workflow
      ├── SLA
      ├── Escalation
      ├── Notification
      └── Audit Trail
```

Seluruh Project menggunakan Business Workflow yang sama, meliputi:

- Workflow Status
- Revision Lifecycle
- Approval A
- Approval B
- Approval C
- SLA Monitoring
- Escalation Alert
- Notification
- Audit Trail

Perbedaan antar Project hanya terletak pada data yang dimiliki oleh masing-masing Project.

Setiap Project memiliki kumpulan Document, Workflow, SLA, Escalation, Notification, dan Audit Trail yang **terisolasi** dari Project lainnya.

Data dari Project A tidak boleh ditampilkan, diproses, maupun dimodifikasi pada Project B atau Project lainnya.

---

## Active Project

**Active Project** adalah Project yang sedang dipilih oleh pengguna setelah berhasil Login.

Seluruh aktivitas pengguna dilakukan dalam satu Active Project.

Active Project menjadi konteks utama untuk seluruh modul berikut:

- Dashboard
- Document Register
- Create Document
- Edit Document
- Upload Revision
- Workflow Approval
- SLA Monitoring
- Escalation Alert
- Notification
- Audit Trail

Ketika pengguna berpindah Active Project, seluruh data yang ditampilkan pada modul-modul tersebut harus mengikuti Project yang baru dipilih.

Perpindahan Active Project **tidak mengubah** Workflow, Revision, SLA, maupun Status Document yang telah ada.

---

## Project Membership

**Project Membership** adalah hubungan antara User Account dengan suatu Project.

Project Membership menentukan:

- User Account
- Project
- Official Role
- Membership Status

Satu User Account dapat menjadi anggota lebih dari satu Project.

Official Role pengguna dapat berbeda pada setiap Project.

Contoh:

| User Account | Project | Official Role |
|--------------|---------|---------------|
| Andi | Project A | Team Process |
| Andi | Project B | Team Project |
| Budi | Project A | Document Owner |

Project Membership hanya menentukan hak akses dan tanggung jawab pengguna pada Project tersebut.

Project Membership **tidak mengubah Business Workflow** yang telah ditetapkan.

---

## Multi Project Principles

Implementasi Multi Project pada EDMS mengikuti prinsip-prinsip berikut:

- Satu aplikasi EDMS dapat mengelola banyak Project.
- Setiap Project memiliki data yang terisolasi.
- Seluruh Project menggunakan Business Workflow yang sama.
- Workflow Approval A/B/C tidak berubah.
- SLA Monitoring tidak berubah.
- Escalation Alert tidak berubah.
- Notification tidak berubah.
- Audit Trail tidak berubah.
- Active Project menentukan seluruh data yang ditampilkan kepada pengguna.
- User Account dapat menjadi anggota lebih dari satu Project.
- Official Role ditentukan melalui Project Membership.
- Data antar Project tidak boleh saling bercampur.
- Workflow Event dan Supporting Services selalu bekerja dalam Project Context yang sama.

---

# 1.5 Document Lifecycle

Setiap Document memiliki empat lifecycle yang berjalan secara independen.

## A. Workflow Status Lifecycle

Menggambarkan posisi dokumen di dalam Business Workflow.

```
Process Review

↓

Process Comment

↓

Process Reject

↓

Project Review

↓

Project Comment

↓

Project Reject

↓

Approved
```

---

## B. Document Revision Lifecycle

Menggambarkan tingkat perkembangan dokumen.

```
IFR-Submitted

↓

IFA-Submitted

↓

AS-Built
```

---

## C. SLA Lifecycle

Menggambarkan kondisi waktu review.

```
On Track

↓

At Risk

↓

Overdue

↓

Final As-Built
```

## D. Document Operational Lifecycle

Menggambarkan apakah dokumen masih ikut dalam operasional harian.

```text
Active

Archived
```

Document Operational Lifecycle terpisah dari Workflow Status.
Archive hanya mengubah Lifecycle dari Active menjadi Archived.
Restore hanya mengubah Lifecycle dari Archived menjadi Active.
Restore tidak mengubah Workflow Status dan tidak mengulang Approval.
Archive hanya boleh dilakukan oleh Admin pada Document dengan Workflow Status Approved.
Archived Document tetap menyimpan Revision History, Workflow History, Audit Trail, Viewer, Download, file, dan relasi dokumen.

Empat lifecycle tersebut saling berhubungan namun tidak saling menggantikan.
SLA Status dihitung berdasarkan Days Until Validation
SLA Timer menggunakan Count Up
SLA Status menjadi Final As-Built ketika Workflow Status Approved

---

# 1.6 Separation of Concepts

Business Workflow EDMS memisahkan beberapa konsep yang memiliki fungsi berbeda.

## Workflow Status

Menjelaskan posisi dokumen dalam proses bisnis.

Contoh:

- Process Review
- Process Comment
- Process Reject
- Project Review
- Project Comment
- Project Reject
- Approved

---

## Document Revision

Menjelaskan tingkat kematangan dokumen.

Contoh:

- IFR-Submitted
- IFA-Submitted
- AS-Built

---

## SLA Status

Menjelaskan kondisi SLA.

Contoh:

- On Track
- At Risk
- Overdue
- Final As-Built

---

## Current Assignee

Menjelaskan siapa user yang saat ini bertanggung jawab terhadap dokumen.

Contoh:

```
Andi
```

Keempat konsep tersebut merupakan domain yang berbeda dan tidak boleh saling menggantikan.

---

# 1.7 Responsible Role vs Current Assignee  Done 1

Business Workflow menggunakan dua konsep yang berbeda.

## Responsible Role

Responsible Role adalah role yang menurut Business Rules bertanggung jawab terhadap suatu Status.

Contoh:

| Workflow Status | Responsible Role |
|-----------------|------------------|
| Process Review | Team Process |
| Process Comment | Document Owner |
| Process Reject | Document Owner |
| Project Review | Team Project |
| Project Comment | Document Owner |
| Project Reject | Document Owner |
| Approved | None |

Responsible Role bersifat statis.

---

## Current Assignee

Current Assignee adalah user yang saat ini menjalankan Responsible Role.

Contoh:

| Responsible Role | Current Assignee |
|------------------|------------------|
| Team Process | Andi |
| Team Project | Budi |
| Document Owner | Wahyu |

Dashboard selalu menampilkan Current Assignee.

Contoh tampilan SLA Timer:

```
3d 2h (Andi)
```

Current Assignee bersifat dinamis.

---

# 1.8 Document Actions vs Workflow Actions

Seluruh aksi pada sistem dibagi menjadi dua kelompok.

## Document Actions

Document Actions merupakan aksi yang tidak mengubah Workflow.

Daftar Document Actions:

- View
- Download
- Comment
- History

Karakteristik:

- Read Only
- Tidak mengubah Status
- Tidak mengubah Revision
- Tidak mengubah SLA
- Tidak menghasilkan Workflow Event

History hanya tersedia apabila:

```
Workflow Status = Approved
```

---

## Workflow Actions

Workflow Actions merupakan aksi yang mengubah Business Workflow.

Workflow Actions terdiri dari:

| UI | Business Action |
|----|-----------------|
| A | Approved |
| B | Approved with Comment |
| C | Not Approved |

Workflow Actions hanya dapat dilakukan oleh user dengan Project Membership Active pada Project yang sama dan Official Role yang sesuai Responsible Role.

Current Assignee hanya digunakan untuk monitoring, Dashboard, SLA, Escalation, Notification Display, dan Reporting. Current Assignee bukan dasar authorization dan bukan pembatas Workflow Action.

Workflow Actions menghasilkan:

- Status Update
- Revision Update
- SLA Reset
- Workflow Notification
- Dashboard Refresh
- Audit Trail
- Document Timeline

---

# 1.8.1 Upload Context

## Upload Context

Business Workflow EDMS mengenal dua konteks Upload yang berbeda.

### Create Document

Dilakukan ketika pengguna membuat dokumen baru.

Karakteristik:

- Belum memiliki Document ID.
- Menghasilkan Document baru.
- Memulai Business Workflow.
- Mengikuti BR-001.

---

### Add Revision

Dilakukan ketika pengguna memperbarui dokumen yang telah terdaftar.

Karakteristik:

- Sudah memiliki Document ID.
- Tidak membuat Document baru.
- Tidak mengubah Document Number.
- Menambahkan Revision baru.
- Melanjutkan Workflow sesuai BR-005.

Jenis proses Upload selalu ditentukan berdasarkan konteks Document yang sedang aktif.

Nama file, nama attachment, maupun versi file tidak pernah digunakan sebagai penentu jenis proses Upload.

---

### 1.9 Workflow Comment

Workflow Comment merupakan hasil review yang dibuat oleh Reviewer saat melakukan Approval B (Approved with Comment) atau Approval C (Not Approved).

Workflow Comment berfungsi sebagai media komunikasi antara Reviewer dan Document Owner selama proses Workflow berlangsung.

Workflow Comment dapat berisi:

- Komentar dalam bentuk teks.
- Satu lampiran (Attachment) berupa dokumen atau gambar pendukung hasil review.

Attachment digunakan untuk membantu menjelaskan hasil review, misalnya berupa PDF hasil markup, gambar, atau screenshot.

Workflow Attachment merupakan bagian dari Workflow Comment dan bukan merupakan Document Revision, Active Document, maupun Upload Revision. Oleh karena itu, Attachment tidak mengubah Document Number, Revision History, maupun Workflow dokumen.

Workflow Attachment yang dipilih user wajib masuk ke temporary upload terlebih dahulu. Attachment baru menjadi data permanen setelah Approval B, Approval C, atau submit Workflow Attachment berhasil diproses backend menggunakan `temporaryFileId`.

Seluruh Workflow Comment beserta Attachment dapat dilihat kembali melalui Comment Viewer sebagai referensi bagi Document Owner selama proses revisi dokumen.

---

# 1.10 Document Timeline

Document Timeline merupakan riwayat seluruh aktivitas Business Workflow.

Timeline minimal mencatat:

- Upload Document
- Process Review
- Workflow Comment
- Upload Revision
- Project Review
- Approval
- Status Change
- Revision Change
- SLA Reset
- Workflow Notification

Document Timeline bersifat Read Only.

Timeline digunakan oleh fitur **History**.

---

# 1.11 Business Philosophy

Business Workflow EDMS dibangun berdasarkan prinsip berikut.

### BC-001

Satu Document hanya memiliki satu Workflow aktif.

---

### BC-002

Satu Document dapat memiliki banyak Revision.

---

### BC-003

Satu Document hanya memiliki satu Status aktif.

---

### BC-004

Setiap Status memiliki satu Responsible Role.

---

### BC-005

Workflow Engine menentukan Current Assignee berdasarkan Responsible Role.

---

### BC-006

Dashboard hanya menampilkan hasil Workflow melalui Dashboard Read Model.

---

### BC-007

Workflow Notification merupakan hasil Business Event.

---

### BC-008

Escalation merupakan hasil monitoring SLA.

Escalation bukan bagian dari Workflow.

---

### BC-009

Document Actions tidak mengubah Workflow.

---

### BC-010

Workflow Actions merupakan satu-satunya mekanisme yang dapat mengubah Status Dokumen.

---

### BC-011

Satu Project dapat memiliki banyak Document.

---

### BC-012

Satu Document hanya dimiliki oleh satu Project.

---

### BC-013

Seluruh Workflow Document selalu berjalan dalam Project milik Document tersebut.

---

### BC-014

Satu User Account dapat menjadi anggota lebih dari satu Project.

---

### BC-015

Official Role operasional pengguna dapat berbeda pada setiap Project.

---

### BC-016

Active Project menentukan data yang ditampilkan dan aktivitas yang dapat dilakukan pengguna.

---

### BC-017

Perpindahan Active Project tidak mengubah Status, Revision, SLA, maupun Workflow Document.

---

### BC-018

Data antar Project tidak boleh bercampur.

---

# 1.12 Relationship with Other Chapters

Business Concepts menjadi dasar bagi seluruh chapter berikutnya.

| Chapter | Dependency |
|----------|------------|
| Chapter 2 | Actors & Responsibilities |
| Chapter 3 | Workflow Engine |
| Chapter 4 | Workflow Visualization |
| Chapter 5 | Business Rules |
| Chapter 6 | Workflow Supporting Services |
| Chapter 7 | Interaction Specification |
| Chapter 8 | Implementation Reference |
| Chapter 9 | Governance, Appendix & Release |

Seluruh chapter berikut harus mengacu kepada terminologi dan konsep yang didefinisikan pada chapter ini.

---

# End of Chapter 1

Chapter ini mendefinisikan seluruh konsep bisnis yang menjadi fondasi Business Workflow EDMS.

Seluruh implementasi Frontend, Backend, Database, API, QA, maupun AI Coding Agent wajib menggunakan terminologi dan pemisahan konsep yang telah ditetapkan pada chapter ini.


# Chapter 2. Actors & Responsibilities

---

# 2.1 Introduction

Business Workflow EDMS melibatkan beberapa Business Actor yang bekerja sama untuk mengelola siklus hidup dokumen mulai dari proses Upload Document, Review, Revisi, hingga dokumen memperoleh status **Approved (Final As-Built)**.

Dalam arsitektur **Multi Project**, seluruh Business Actor menjalankan tanggung jawabnya di dalam satu **Project Context**.

Official Role operasional pengguna ditentukan melalui **Project Membership**.

User Account yang sama dapat menjalankan Official Role yang berbeda pada Project yang berbeda tanpa mengubah Business Workflow.

Setiap Business Actor memiliki tanggung jawab yang berbeda sesuai dengan Business Rules yang berlaku.

Business Workflow tidak memberikan hak akses berdasarkan User Account, melainkan berdasarkan Official Role yang dimiliki pengguna pada Project tersebut.

Workflow Engine kemudian menentukan **Current Assignee** berdasarkan Official Role dan Project Context yang sesuai.

---

# 2.2 Business Actor Model

Business Workflow EDMS mengenal tiga Business Actor utama.

| Business Actor | Description |
|----------------|-------------|
| Document Owner | Pemilik dokumen yang bertanggung jawab membuat, mengunggah, dan merevisi dokumen. |
| Team Process | Aktor yang melakukan validasi engineering terhadap dokumen. |
| Team Project | Aktor yang melakukan validasi project sebelum dokumen disetujui. |

Business Actor menggambarkan fungsi bisnis.

Business Actor bukan User Account.

---

# 2.3 Official Role Model

Official Role merupakan role yang digunakan Workflow Engine untuk menentukan siapa yang bertanggung jawab terhadap suatu Status.

EDMS menggunakan Official Role berikut pada Business Workflow.

| Business Actor | Official Role |
|----------------|---------------|
| Document Owner | Document Owner |
| Team Process | Team Process |
| Team Project | Team Project |

Official Role operasional berikut bersifat **Project-Scoped**:

- Admin, khusus sebagai Initial Project Membership untuk Creator Project
- Document Owner
- Team Process
- Team Project

Official Role tersebut diberikan kepada User Account melalui Project Membership.

Role Admin tetap bersifat System-Level untuk kebutuhan administrasi aplikasi.

Admin pada Project Membership digunakan untuk akses administrasi Project dan tidak menjadi Current Assignee pada Business Workflow Document.

Admin dengan Project Membership Active pada Project milik Document dapat menjalankan **Upload Revision Override** secara terbatas pada Workflow Status:

- Process Comment
- Process Reject
- Project Comment
- Project Reject

Upload Revision Override tidak mengubah Responsible Role, tidak menjadikan Admin sebagai Current Assignee, dan tidak memberikan hak Approval A/B/C.

Contoh:

```text
User Account: Andi

Project A
Official Role: Team Process

Project B
Official Role: Team Project
```

Perubahan Official Role pada satu Project tidak mengubah Official Role pengguna pada Project lain.

Official Role merupakan representasi role bisnis yang digunakan secara konsisten oleh seluruh modul EDMS.

Perubahan struktur organisasi maupun pergantian personel tidak mengubah Official Role ataupun Business Workflow.

Workflow Engine menentukan **Current Assignee** berdasarkan Official Role dan Project Membership yang sesuai pada Project tersebut.


---

# 2.4 Current Assignee

Current Assignee merupakan user yang sedang menjalankan Official Role.

Contoh:

| Official Role | Current Assignee |
|---------------|------------------|
| Team Process | Andi |
| Team Project | Budi |
| Document Owner | Wahyu |

Dashboard selalu menampilkan Current Assignee.

Contoh tampilan SLA Timer:

```
3d 2h (Andi)
```

Current Assignee ditentukan secara otomatis oleh Workflow Engine.

Dalam arsitektur Multi Project, Current Assignee hanya dapat ditentukan dari User Account yang:

- memiliki Project Membership pada Project milik Document;
- memiliki Official Role yang sesuai;
- memiliki Membership Status Active;
- memiliki User Account Status Active.

User dari Project lain tidak dapat menjadi Current Assignee untuk Document tersebut.

---

# 2.5 Responsibility Mapping

Workflow Engine menentukan Responsible Role berdasarkan Workflow Status.

| Workflow Status | Official Role | Business Actor |
|-----------------|---------------|----------------|
| Process Review | Team Process | Team Process |
| Process Comment | Document Owner | Document Owner |
| Process Reject | Document Owner | Document Owner |
| Project Review | Team Project | Team Project |
| Project Comment | Document Owner | Document Owner |
| Project Reject | Document Owner | Document Owner |
| Approved | None | Workflow Completed |

Mapping ini merupakan aturan bisnis dan tidak boleh diubah oleh Frontend.

Admin dapat menjadi actor tambahan untuk Upload Revision pada Process Comment, Process Reject, Project Comment, dan Project Reject selama Project Context, Project Membership, Permission, dan Workflow Status valid.

Hak ini merupakan override terbatas dan tidak mengubah Responsible Role Document Owner pada status tersebut.

---

# 2.6 Actor Responsibilities

## Document Owner

Document Owner bertanggung jawab terhadap:

- Upload Document
- Upload Revision
- Menanggapi Workflow Comment
- Memastikan dokumen siap direview

Document Owner tidak memiliki hak Approval.

---

## Admin

Admin mendukung administrasi Project dan monitoring operasional.

Dalam Business Workflow Document, Admin:

- tidak menjadi Current Assignee;
- tidak memiliki hak Approval A/B/C;
- dapat melakukan Upload Revision pada Process Comment, Process Reject, Project Comment, dan Project Reject apabila memiliki Project Membership Active pada Project milik Document serta Permission yang sesuai.

Admin Project lain tidak memiliki hak Upload Revision terhadap Document di luar Project Membership-nya.

---

## Team Process

Team Process bertanggung jawab melakukan Process Review.

Tanggung jawab:

- Melakukan Engineering Review
- Memilih Approval A, B, atau C
- Memberikan Workflow Comment apabila memilih Approval B
- Dapat memberikan Workflow Comment apabila memilih Approval C

Team Process tidak dapat melakukan Project Review.

---

## Team Project

Team Project bertanggung jawab melakukan Project Review.

Tanggung jawab:

- Melakukan Project Review
- Memilih Approval A, B, atau C
- Memberikan Workflow Comment apabila memilih Approval B
- Dapat memberikan Workflow Comment apabila memilih Approval C
- Menyelesaikan Workflow menjadi Approved

---

# 2.7 Responsibility Matrix

| Workflow Status | Responsible Role | Current Assignee | Objective |
|-----------------|------------------|------------------|-----------|
| Process Review | Team Process | Current Assignee | Engineering Review |
| Process Comment | Document Owner | Current Assignee | Upload Revision |
| Project Review | Team Project | Current Assignee | Project Review |
| Project Comment | Document Owner | Current Assignee | Upload Revision |
| Approved | None | None | Workflow Completed |

Workflow Engine hanya memiliki satu Responsible Role pada satu waktu.

## Project Responsibility Rules

Responsibility Matrix selalu diterapkan dalam satu Project Context.

Ketentuan:

- Team Process Project A hanya bertanggung jawab terhadap Document Project A.
- Team Project Project A hanya bertanggung jawab terhadap Document Project A.
- Document Owner Project A hanya dapat menjalankan Workflow Action pada Document Project A.
- Official Role yang sama pada Project lain tidak memberikan akses terhadap Document tersebut.
- Workflow Engine wajib memvalidasi Project Membership sebelum menjalankan Workflow Action.
- Current Assignee hanya dapat dipilih dari User Account yang memiliki Project Membership Active pada Project milik Document.
- Workflow Engine tidak boleh menetapkan Current Assignee dari Project yang berbeda walaupun memiliki Official Role yang sama.

---

# 2.8 Permission Matrix

## Document Actions

Document Actions dapat digunakan oleh seluruh user yang memiliki akses terhadap dokumen.

| Document Action | Document Owner | Team Process | Team Project |
|-----------------|----------------|------------------|------------------|
| View | ✓ | ✓ | ✓ |
| Download | ✓ | ✓ | ✓ |
| Comment (Read Only) | ✓ | ✓ | ✓ |
| History | Approved Only | Approved Only | Approved Only |

Document Actions tidak mengubah Workflow.

---

## Workflow Actions

Workflow Actions hanya tersedia apabila user memiliki Project Membership Active pada Project yang sama dan Official Role yang sesuai Responsible Role.

| Workflow Status | Document Owner | Team Process | Team Project |
|-----------------|----------------|------------------|------------------|
| Process Review | - | A, B, C | - |
| Process Comment | Upload Revision | - | - |
| Project Review | - | - | A, B, C |
| Project Comment | Upload Revision | - | - |
| Approved | - | - | - |

Catatan:

- Admin tidak termasuk Responsible Role pada Workflow Actions.
- Admin dengan Project Membership Active pada Project yang sama dapat menjalankan Upload Revision pada Process Comment dan Project Comment sebagai override terbatas.
- Override Admin tidak berlaku untuk Process Review, Project Review, Approved, Approval A/B/C, maupun Document milik Project lain.

---

# 2.9 Approval Rules

Workflow Action terdiri dari tiga jenis.

## Approval A

Business Action:

Approved

Workflow Comment:

Tidak diperlukan.

Hasil:

Workflow berpindah ke tahap berikutnya.

---

## Approval B

Business Action:

Approved with Comment

Workflow Comment:

Wajib diisi.

Reviewer dapat menambahkan satu Attachment sebagai lampiran Workflow Comment.

Attachment digunakan sebagai media pendukung hasil review, seperti PDF hasil markup, gambar, atau screenshot.

Pada Approval B, Reviewer wajib memberikan Comment. Attachment bersifat optional sebagai pendukung komentar.

Workflow Attachment merupakan bagian dari Workflow Comment dan tidak mengubah Workflow, Document Number, maupun Revision History.

Hasil:

Workflow Status berubah menjadi Process Comment atau Project Comment sesuai tahap review saat ini.

Document Owner wajib melakukan Upload Revision.

---

## Approval C

Business Action:

Not Approved

Workflow Comment:

Opsional.

Reviewer dapat menambahkan satu Attachment sebagai lampiran Workflow Comment.

Attachment digunakan sebagai media pendukung hasil review, seperti PDF hasil markup, gambar, atau screenshot.

Pada Approval C, Comment maupun Attachment bersifat opsional.

Workflow Attachment merupakan bagian dari Workflow Comment dan tidak mengubah Workflow, Document Number, maupun Revision History.

Hasil:

Workflow Status berubah menjadi Process Reject atau Project Reject sesuai tahap review saat ini.

Document Owner wajib melakukan Upload Revision.

---

# 2.10 Comment Rules

Workflow Comment merupakan bagian dari Workflow.

Approval B:

- Workflow Comment wajib diisi.

Approval C:

- Workflow Comment bersifat opsional.

Comment Viewer:

- Read Only
- Tidak dapat mengubah Workflow Comment.
- Menampilkan nama User dan Official Role pada saat Workflow Comment dibuat.

---

# 2.11 History Rules

History merupakan Document Action.

History hanya tersedia apabila:

```
Workflow Status = Approved
```

History menampilkan Document Timeline.

Document Timeline minimal berisi:

- Upload Document
- Engineering Review
- Workflow Comment
- Upload Revision
- Project Review
- Approval
- Status Change
- Revision Change
- SLA Reset
- Workflow Notification

History bersifat Read Only.

---

# 2.12 Workflow Ownership

Business Workflow mengikuti perpindahan ownership berikut.

```text
Document Owner
        │
        ▼
Team Process
        │
        ▼
Document Owner
        │
        ▼
Team Project
        │
        ▼
Document Owner
        │
        ▼
Approved
```

Workflow Engine menentukan perpindahan ownership berdasarkan Business Rules.

---

# 2.13 Design Principles

ACT-001

Business Actor menjelaskan fungsi bisnis.

---

ACT-002

Official Role menentukan tanggung jawab Workflow.

---

ACT-003

Current Assignee ditentukan oleh Workflow Engine.

---

ACT-004

Current Assignee dapat berubah tanpa mengubah Business Rules.

---

ACT-005

Document Actions selalu bersifat Read Only.

---

ACT-006

Workflow Actions merupakan satu-satunya aksi yang dapat mengubah Workflow.

---

ACT-007

Approval B mewajibkan Workflow Comment.

---

ACT-008

Approval C memperbolehkan Workflow Comment kosong maupun terisi.

---

ACT-009

History hanya tersedia setelah Workflow selesai.

---

ACT-010

Seluruh Workflow Action menghasilkan Audit Trail dan Document Timeline.

---

# 2.14 Relationship with Other Chapters

Chapter ini menjadi dasar implementasi bagi:

- Chapter 3 – Workflow Engine
- Chapter 4 – Workflow Visualization
- Chapter 5 – Business Rules
- Chapter 6 – Workflow Supporting Services
- Chapter 7 – Interaction Specification
- Chapter 8 – Implementation Reference

Seluruh chapter berikut wajib menggunakan definisi Business Actor, Official Role, Responsible Role, dan Current Assignee yang telah ditetapkan pada chapter ini.

---

# End of Chapter 2

Chapter ini mendefinisikan Business Actor, Official Role, Current Assignee, serta pembagian tanggung jawab pada Business Workflow EDMS.

Seluruh implementasi Frontend, Backend, Database, API, QA, maupun AI Coding Agent wajib mengacu pada Responsibility Matrix dan Permission Matrix yang telah ditetapkan pada chapter ini.


# Chapter 3. Workflow Processing Engine

---

# 3.1 Introduction

Workflow Processing Engine merupakan inti dari Business Workflow EDMS.

Komponen ini bertanggung jawab mengendalikan seluruh perpindahan Workflow berdasarkan Business Rules yang telah ditetapkan.

Workflow Processing Engine merupakan satu-satunya komponen yang diperbolehkan untuk:

- Mengubah Workflow Status
- Mengubah Document Revision
- Menentukan Responsible Role
- Menentukan Current Assignee
- Memulai Workflow Supporting Services

Seluruh perubahan Workflow harus diproses melalui Workflow Processing Engine.

Frontend, Dashboard, maupun Supporting Services tidak diperbolehkan mengubah Workflow secara langsung.

---

# 3.2 Workflow Lifecycle

Business Workflow EDMS mengikuti lifecycle berikut.

```text
Upload Document
        │
        ▼
Process Review
        │
        ▼
Engineering Review
        │
        ├────────────► Approval A
        │                     │
        │                     ▼
        │             Project Review
        │
        ├────────────► Approval B
        │                     │
        │                     ▼
        │            Process Reject
        │
        └────────────► Approval C
                              │
                              ▼
                     Process Reject
                              │
                              ▼
                     Upload Revision
                              │
                              ▼
                     Process Review

Project Review
        │
        ├────────────► Approval A
        │                     │
        │                     ▼
        │                 Approved
        │
        ├────────────► Approval B
        │                     │
        │                     ▼
        │            Project Reject
        │
        └────────────► Approval C
                              │
                              ▼
                     Project Reject
                              │
                              ▼
                     Upload Revision
                              │
                              ▼
                     Project Review
```

Workflow hanya dapat mengikuti jalur di atas.

---

# 3.3 Workflow Entry Point

Business Workflow selalu dimulai melalui proses Upload Document dalam satu Active Project.

Sebelum Upload Document diproses oleh Workflow Engine, sistem wajib memastikan:

- Active Project tersedia.
- Project berstatus Active.
- User Account berstatus Active.
- User memiliki Project Membership Active pada Active Project.
- User memiliki Official Role yang mengizinkan Upload Document.

Document baru secara otomatis menerima Project ID dari Active Project yang sedang dipilih oleh pengguna.

User tidak memilih Project secara manual di dalam Create Document.

Setelah proses Upload berhasil:

| Property | Value |
|----------|-------|
| Workflow Status | Process Review |
| Document Revision | IFR-Submitted |
| Responsible Role | Team Process |
| Current Assignee | Ditentukan Workflow Engine |
| SLA Timer | Start |

## SLA Timer

- Dimulai pada saat Workflow pertama dibuat.
- Menggunakan mekanisme Count Up.
- Baseline menggunakan waktu Upload Document (UTC).
- Akan di-reset sesuai Business Rules ketika terjadi perubahan Workflow Status yang memicu reset SLA.

Workflow dianggap aktif sejak Upload Document berhasil.

---

# 3.4 Workflow Ownership Matrix

Workflow Engine menentukan ownership berdasarkan Workflow Status.

| Workflow Status | Responsible Role | Business Actor |
|-----------------|------------------|----------------|
| Process Review | Team Process | Team Process |
| Process Reject | Document Owner | Document Owner |
| Project Review | Team Project | Team Project |
| Project Reject | Document Owner | Document Owner |
| Approved | None | Workflow Completed |

Workflow hanya mempunyai satu Responsible Role pada satu waktu.

---

# 3.5 Workflow Processing Sequence

Setiap Workflow Action diproses menggunakan urutan berikut.

```text
Workflow Action
        │
        ▼
Project Context Validation
        │
        ▼
Project Membership Validation
        │
        ▼
Permission Validation
        │
        ▼
Workflow Validation
        │
        ▼
Transition Validation
        │
        ▼
Update Workflow Status
        │
        ▼
Update Document Revision
        │
        ▼
Determine Responsible Role
        │
        ▼
Determine Current Assignee
        │
        ▼
Commit Transaction
        │
        ▼
Trigger Project-Scoped Workflow Supporting Services
        │
        ▼
Workflow Completed
```

Workflow Processing Engine wajib menjalankan proses tersebut secara berurutan.

Seluruh perubahan wajib menggunakan Project milik Document dan tidak boleh menggunakan Active Project yang berbeda.

---

# 3.6 Workflow Actions

Workflow Processing Engine hanya mengenal tiga Workflow Action.

| UI | Business Action | Description |
|----|-----------------|-------------|
| A | Approved | Melanjutkan Workflow |
| B | Approved with Comment | Mengembalikan dokumen untuk revisi |
| C | Not Approved | Mengembalikan dokumen untuk revisi |

Workflow Action hanya dapat dijalankan oleh user dengan Project Membership Active pada Project yang sama dan Official Role yang sesuai Responsible Role.

---

# 3.7 Workflow Processing Rules

## Approval A

Workflow Processing Engine melakukan:

1. Validasi Permission.
2. Validasi Workflow Status.
3. Mengubah Workflow Status.
4. Mengubah Document Revision.
5. Menentukan Responsible Role berikutnya.
6. Menentukan Current Assignee.
7. Menyimpan perubahan.
8. Menjalankan Workflow Supporting Services.

---

### Transition

#### Process Review

↓

Project Review

Revision

↓

IFA-Submitted

---

#### Project Review

↓

Approved

Revision

↓

AS-Built

---

## Approval B

Workflow Processing Engine melakukan:

1. Validasi Permission.
2. Validasi Workflow Comment wajib berisi Comment.
3. Menyimpan Workflow Attachment (jika tersedia).
4. Mengubah Workflow Status menjadi Process Comment atau Project Comment.
5. Document Revision tetap.
6. Menentukan Responsible Role menjadi Document Owner.
7. Menentukan Current Assignee.
8. Menyimpan perubahan.
9. Menjalankan Workflow Supporting Services.

Pada Approval B, Reviewer wajib memberikan Comment. Attachment bersifat optional.

---

### Transition

Process Review

↓

Process Comment

---

Project Review

↓

Project Comment

---

## Approval C

Workflow Processing Engine melakukan:

1. Validasi Permission.
2. Workflow Comment bersifat opsional.
3. Menyimpan Workflow Attachment (jika tersedia).
4. Mengubah Workflow Status menjadi Process Reject atau Project Reject.
5. Document Revision tetap.
6. Menentukan Responsible Role menjadi Document Owner.
7. Menentukan Current Assignee.
8. Menyimpan perubahan.
9. Menjalankan Workflow Supporting Services.

Pada Approval C, Comment maupun Attachment bersifat opsional.

---

### Transition

Process Review

↓

Process Reject

---

Project Review

↓

Project Reject

---

## Upload Revision

Upload Revision hanya dapat dilakukan apabila Workflow Status adalah:

- Process Comment
- Process Reject
- Project Comment
- Project Reject

Workflow Processing Engine:

- Tidak membuat Document baru.
- Tidak mengubah Document Number.
- Menambahkan Revision History.
- Menjadikan Attachment terbaru sebagai Active Version.
- Menggunakan `temporaryFileId` dari temporary upload sebagai input file saat Save/Submit; frontend tidak mengirim raw file langsung ke endpoint Upload Revision final.

Upload Revision dapat dijalankan oleh:

- Document Owner.
- Admin, hanya sebagai override terbatas pada Project yang sama.

Apabila Workflow Status sebelum Upload Revision adalah:

- Process Comment → Workflow Status menjadi Process Review.
- Process Reject -> Workflow Status menjadi Process Review.
- Project Comment → Workflow Status menjadi Project Review.
- Project Reject -> Workflow Status menjadi Project Review.

Workflow Transition wajib mengikuti Workflow Transition Matrix.

---

# 3.8 Workflow Validation

Sebelum Workflow diproses, sistem wajib melakukan validasi berikut.

| Validation | Description |
|------------|-------------|
| Project Context Validation | Document memiliki Project yang valid dan Project berstatus Active. |
| Project Membership Validation | User merupakan anggota aktif dari Project milik Document. |
| Permission Validation | User memiliki Official Role dan Permission yang sesuai dalam Project. |
| Workflow Status Validation | Workflow Status valid. |
| Workflow Transition Validation | Transisi diperbolehkan. |
| Workflow Comment Validation | Approval B wajib memenuhi aturan Workflow Comment dan Workflow Attachment. |
| Upload Revision Validation | Hanya diperbolehkan pada Process Comment, Process Reject, Project Comment, dan Project Reject. |
| Project Data Isolation Validation | Workflow Action tidak mengakses maupun mengubah data Project lain. |

Apabila salah satu validasi gagal, Workflow dibatalkan.

---

# 3.9 Workflow Completion

Workflow dianggap selesai apabila seluruh kondisi berikut terpenuhi.

| Property | Value |
|----------|-------|
| Workflow Status | Approved |
| Document Revision | AS-Built |
| Responsible Role | None |
| Current Assignee | None |

Setelah Workflow selesai:

- Workflow Processing Engine tidak menerima Workflow Action baru.
- Dashboard mengganti tombol Approval menjadi History.
- SLA Status menjadi **Final As-Built**. Istilah `Done` hanya boleh digunakan sebagai display wording untuk timer selesai, bukan business status.
- Document Timeline tetap dapat diakses.

---

# 3.10 Workflow Processing Principles

WPE-001

Workflow Processing Engine merupakan satu-satunya komponen yang mengubah Workflow.

---

WPE-002

Workflow Action hanya dapat dilakukan oleh user dengan Project Membership Active pada Project yang sama dan Official Role yang sesuai Responsible Role.

---

WPE-003

Document Actions tidak pernah diproses oleh Workflow Processing Engine.

---

WPE-004

Workflow Processing Engine selalu menentukan Responsible Role.

---

WPE-005

Workflow Processing Engine selalu menentukan Current Assignee.

---

WPE-006

Workflow Processing Engine selalu menghasilkan Workflow Event.

---

WPE-007

Workflow Processing Engine tidak pernah membuat Document baru saat Upload Revision.

---

WPE-008

Workflow Processing Engine tidak pernah mengubah Document Number.

---

WPE-009

Workflow Processing Engine selalu menyimpan Revision History.

---

WPE-010

Workflow Processing Engine selalu memicu Workflow Supporting Services setelah transaksi berhasil disimpan.

---

WPE-011

Workflow Processing Engine wajib memvalidasi Project Context.

---

WPE-012

Workflow Processing Engine hanya boleh memproses Document dalam Project milik Document tersebut.

---

WPE-013

Workflow Supporting Services wajib menerima Project Context dari Workflow Event.

---

WPE-014

Workflow Action tidak boleh memindahkan Document ke Project lain.

---

WPE-015

Perpindahan Active Project tidak mengubah Workflow Document.

---

# 3.11 Relationship with Other Chapters

Chapter ini menjadi dasar implementasi bagi:

- Chapter 4 – Workflow Visualization
- Chapter 5 – Business Rules
- Chapter 6 – Workflow Supporting Services
- Chapter 7 – Interaction Specification
- Chapter 8 – Implementation Reference
- Chapter 9 – Governance, Appendix & Release

Seluruh implementasi Frontend, Backend, Database, API, QA, maupun AI Coding Agent wajib mengikuti Workflow Processing Engine yang telah didefinisikan pada chapter ini.

---

# End of Chapter 3

Workflow Processing Engine merupakan inti dari Business Workflow EDMS.

Seluruh perubahan Workflow harus diproses melalui komponen ini agar konsistensi Business Rules, Document Revision, Responsible Role, Current Assignee, serta Workflow Supporting Services tetap terjaga.


# Chapter 4. Workflow Visualization & Transition Model

---

# 4.1 Introduction

Chapter ini mendefinisikan representasi visual Business Workflow EDMS.

Seluruh diagram pada chapter ini merupakan representasi resmi dari Business Rules yang telah didefinisikan sebelumnya.

Diagram digunakan untuk membantu memahami alur Workflow, namun tidak mendefinisikan aturan bisnis baru.

Apabila terjadi perbedaan antara diagram dan Business Rules, maka Business Rules memiliki prioritas yang lebih tinggi.

---

# 4.2 Workflow Visualization Principles

Workflow Visualization dibangun berdasarkan prinsip berikut.

WV-001

Diagram merupakan representasi visual dari Business Workflow.

---

WV-002

Diagram tidak boleh membuat Business Rule baru.

---

WV-003

Diagram harus selalu konsisten dengan Workflow Processing Engine.

---

WV-004

Diagram harus selalu konsisten dengan Business Rules.

---

WV-005

Diagram hanya menggambarkan Workflow yang valid.

---

WV-006

Workflow Status hanya dapat berubah melalui Workflow Processing Engine.

---

WV-007

Document Actions tidak mempengaruhi Workflow.

---

WV-008

Workflow Actions selalu menghasilkan Workflow Transition.

---

# 4.3 High-Level Workflow

Business Workflow EDMS mengikuti alur berikut.

```text
Document Owner
        │
        ▼
Upload Document
        │
        ▼
Workflow Processing Engine
        │
        ▼
Process Review
        │
        ▼
Team Process
        │
        ├──────────────► Approval A
        │                     │
        │                     ▼
        │              Project Review
        │
        ├──────────────► Approval B
        │                     │
        │                     ▼
        │             Process Comment
        │
        └──────────────► Approval C
                              │
                              ▼
                     Process Comment
                              │
                              ▼
                     Upload Revision
                              │
                              ▼
                     Process Review

Project Review
        │
        ▼
Team Project
        │
        ├──────────────► Approval A
        │                     │
        │                     ▼
        │                 Approved
        │
        ├──────────────► Approval B
        │                     │
        │                     ▼
        │            Project Comment
        │
        └──────────────► Approval C
                              │
                              ▼
                     Project Comment
                              │
                              ▼
                     Upload Revision
                              │
                              ▼
                     Project Review
```

---

# 4.4 Workflow Transition Matrix

Workflow hanya diperbolehkan berpindah sesuai tabel berikut.

| Current Workflow Status | Workflow Action | Next Workflow Status |
|-------------------------|-----------------|----------------------|
| Process Review | Approval A | Project Review |
| Process Review | Approval B | Process Comment |
| Process Review | Approval C | Process Reject |
| Process Comment | Upload Revision | Process Review |
| Process Reject | Upload Revision | Process Review |
| Project Review | Approval A | Approved |
| Project Review | Approval B | Project Comment |
| Project Review | Approval C | Project Reject |
| Project Comment | Upload Revision | Project Review |
| Project Reject | Upload Revision | Project Review |

Workflow di luar tabel ini harus ditolak oleh Workflow Processing Engine.

---

# 4.5 Revision Transition Matrix

Perubahan Revision mengikuti Workflow Transition.

| Workflow Transition | Revision |
|---------------------|----------|
| Upload Document | IFR-Submitted |
| Process Review → Project Review | IFA-Submitted |
| Process Review → Process Comment | IFR-Submitted |
| Project Review → Project Comment | IFA-Submitted |
| Project Review → Approved | AS-Built |

Revision tidak boleh diubah oleh Frontend.

---

# 4.6 Responsible Role Transition

Workflow Processing Engine menentukan Responsible Role berdasarkan Workflow Status.

| Workflow Status | Responsible Role |
|-----------------|------------------|
| Process Review | Team Process |
| Process Comment | Document Owner |
| Process Reject | Document Owner |
| Project Review | Team Project |
| Project Comment | Document Owner |
| Project Reject | Document Owner |
| Approved | None |

Current Assignee selalu ditentukan berdasarkan Responsible Role.

---

# 4.7 Workflow Action Classification

Workflow EDMS mengenal dua kelompok aksi.

## Document Actions

Document Actions tidak mengubah Workflow.

Terdiri dari:

- View
- Download
- Comment
- History

History hanya tersedia apabila:

```
Workflow Status = Approved
```

---

## Workflow Actions

Workflow Actions mengubah Workflow.

Terdiri dari:

- Approval A
- Approval B
- Approval C
- Upload Revision

Workflow Actions hanya tersedia bagi user dengan Project Membership Active pada Project yang sama dan Official Role yang sesuai Responsible Role.

---

# 4.8 Workflow Transition Rules

Workflow Processing Engine harus memastikan bahwa:

- Setiap Workflow Action menghasilkan satu Workflow Transition yang valid.
- Workflow Status hanya memiliki satu nilai aktif.
- Responsible Role selalu mengikuti Workflow Status.
- Current Assignee selalu mengikuti Responsible Role.
- Workflow selesai ketika Status menjadi Approved.

---

# 4.9 Read Only Interaction

Document Actions merupakan interaksi Read Only.

| Action | Workflow Changed |
|---------|------------------|
| View | No |
| Download | No |
| Comment | No |
| History | No |

Document Actions tidak pernah menghasilkan Workflow Event.

---

# 4.10 Workflow Completion

Workflow dianggap selesai apabila memenuhi seluruh kondisi berikut.

| Property | Value |
|----------|-------|
| Workflow Status | Approved |
| Revision | AS-Built |
| Responsible Role | None |
| Current Assignee | None |
| SLA Status | Final As-Built |
| SLA Timer | Display wording Done |

Setelah Workflow selesai:

- Tombol Approval A/B/C tidak lagi ditampilkan.
- Dashboard menampilkan tombol History.
- Workflow tidak dapat diproses kembali.

---

# 4.11 Workflow Design Principles

WTM-001

Workflow hanya memiliki satu jalur aktif.

---

WTM-002

Workflow Processing Engine merupakan satu-satunya pengendali Workflow.

---

WTM-003

Workflow Status selalu mengikuti Transition Matrix.

---

WTM-004

Document Revision selalu mengikuti Revision Transition Matrix.

---

WTM-005

Responsible Role selalu mengikuti Workflow Status.

---

WTM-006

Current Assignee selalu mengikuti Responsible Role.

---

WTM-007

Document Actions selalu bersifat Read Only.

---

WTM-008

Workflow Actions selalu menghasilkan Workflow Transition.

---

WTM-009

Workflow Completion selalu menghasilkan Status Approved.

---

WTM-010

Diagram hanya merepresentasikan Workflow yang valid.

---

# 4.12 Relationship with Other Chapters

Chapter ini merupakan representasi visual dari:

- Chapter 1 – Business Concepts
- Chapter 2 – Actors & Responsibilities
- Chapter 3 – Workflow Processing Engine

Chapter ini menjadi dasar implementasi bagi:

- Chapter 5 – Business Rules
- Chapter 6 – Workflow Supporting Services
- Chapter 7 – Interaction Specification
- Chapter 8 – Implementation Reference

Diagram dan Transition Matrix pada chapter ini harus selalu konsisten dengan Business Rules.

---

# End of Chapter 4

Chapter ini mendefinisikan representasi visual dan model transisi Business Workflow EDMS.

Seluruh Workflow yang diimplementasikan pada Frontend, Backend, Database, API, QA, maupun AI Coding Agent wajib mengikuti Transition Matrix dan Workflow Model yang telah ditetapkan pada chapter ini.


# Chapter 5. Business Rules

---

# 5.1 Introduction

Business Rules merupakan kumpulan aturan bisnis yang mengendalikan seluruh Business Workflow Engineering Document Management System (EDMS).

Seluruh perubahan terhadap Workflow harus mengikuti Business Rules yang didefinisikan pada chapter ini.

Business Rules menjadi acuan utama bagi:

- Frontend
- Backend
- Database
- API
- QA Test Case
- AI Coding Agent

Apabila terjadi konflik antara diagram, implementasi, atau dokumentasi lain, maka Business Rules memiliki prioritas tertinggi.

---

# 5.2 Business Rule Structure

Setiap Business Rule menggunakan struktur berikut.

| Field | Description |
|--------|-------------|
| Rule ID | Identitas unik Business Rule |
| Purpose | Tujuan aturan |
| Trigger | Peristiwa yang memicu aturan |
| Preconditions | Kondisi sebelum aturan dijalankan |
| Processing | Logika bisnis yang diproses |
| Post Conditions | Kondisi setelah proses selesai |
| Affected Components | Komponen yang berubah |
| Business Exceptions | Kondisi yang menyebabkan proses gagal |
| Related Chapters | Referensi chapter terkait |

---

# 5.2.1 Multi Project Context

Seluruh Business Rule pada Chapter ini dijalankan dalam satu **Project Context**.

Business Rule yang didefinisikan pada Chapter ini berlaku untuk seluruh Project dan menggunakan Business Workflow yang sama.

Sebelum menjalankan Business Rule, Workflow Engine wajib memvalidasi:

- Active Project.
- Project berstatus Active.
- User Account berstatus Active.
- Project Membership berstatus Active.
- Official Role yang sesuai.

Konsep Multi Project tidak mengubah Business Rule yang telah didefinisikan pada Chapter ini.

Multi Project hanya menentukan ruang lingkup (scope) penerapan Business Rule sehingga setiap Project memiliki data yang terisolasi.

---

# 5.3 BR-001 — Upload Document

## Purpose

Memulai Business Workflow.

---

## Trigger

Document Owner berhasil melakukan Upload Document.

---

## Preconditions

- User telah login.
- User memiliki hak Upload Document.
- Dokumen valid.
- Attachment berhasil diunggah.
- Field **Days Until Validation** telah diisi.

---

## Business Context

Upload Document merupakan proses pembuatan dokumen baru (Create Document).

Workflow ini hanya dijalankan apabila pengguna membuat dokumen baru yang belum memiliki **Document ID**.

Upload Document tidak boleh digunakan untuk memperbarui dokumen yang sudah ada.

Apabila dokumen telah memiliki Document ID, maka proses Upload harus diperlakukan sebagai Upload Revision sesuai BR-005.

---


## Processing

Workflow Processing Engine melakukan:

- Membuat Document baru.
- Menentukan Workflow Status = **Process Review**.
- Menentukan Document Revision = **IFR-Submitted**.
- Menentukan Responsible Role = **Team Process**.
- Menentukan Current Assignee.
- Memulai SLA Timer.
- Membuat Workflow Notification.
- Membuat Document Timeline.
- Memperbarui Dashboard Read Model.

---

## Post Conditions

Workflow aktif.

---

## Affected Components

- Document
- Workflow
- SLA Engine
- Dashboard Read Model
- Workflow Notification
- Document Timeline

---

## Business Exceptions

Upload gagal.

Workflow tidak dibuat.

---

## Related Chapters

- Workflow Processing Engine
- Workflow Supporting Services

---

# 5.4 BR-002 — Approval A

## Purpose

Melanjutkan Workflow ke tahap berikutnya.

---

## Trigger

User dengan Official Role yang sesuai Responsible Role memilih Approval A.

---

## Preconditions

- User memiliki Project Membership Active pada Project yang sama dan Official Role sesuai Responsible Role.
- Workflow Status valid.

---

## Processing

### Jika Workflow Status = Process Review

Workflow Status

↓

Project Review

Document Revision

↓

IFA-Submitted

Responsible Role

↓

Team Project

---

### Jika Workflow Status = Project Review

Workflow Status

↓

Approved

Document Revision

↓

AS-Built

Responsible Role

↓

None

---

Workflow Processing Engine kemudian:

- Menentukan Current Assignee.
- Reset SLA (jika berpindah ke Project Review).
- Mengubah SLA Status menjadi **Final As-Built** apabila Workflow Status menjadi Approved.
- Membuat Workflow Notification.
- Memperbarui Dashboard Read Model.
- Membuat Document Timeline.

---

## Post Conditions

Workflow berpindah ke tahap berikutnya.

---

## Affected Components

- Workflow
- Revision
- SLA
- Dashboard
- Notification
- Timeline

---

## Business Exceptions

Approval ditolak apabila user tidak memiliki Project Membership Active pada Project yang sama atau Official Role tidak sesuai Responsible Role.

---

# 5.5 BR-003 — Approval B

## Purpose

Mengembalikan dokumen kepada Document Owner untuk direvisi.

---

## Trigger

User dengan Official Role yang sesuai Responsible Role memilih Approval B.

---

## Preconditions

- User memiliki Project Membership Active pada Project yang sama dan Official Role sesuai Responsible Role.
- Reviewer wajib memberikan Workflow Comment. Workflow Attachment bersifat optional.

---

## Processing

Jika Workflow Status = Process Review

↓

Workflow Status = Process Comment

Jika Workflow Status = Project Review

↓

Workflow Status = Project Comment

Document Revision tidak berubah.

Responsible Role

↓

Document Owner

Workflow Processing Engine:

- Memvalidasi Workflow Comment wajib berisi Comment.
- Menyimpan Workflow Attachment (jika tersedia).
- Reset SLA.
- Menentukan Current Assignee.
- Membuat Workflow Notification.
- Memperbarui Dashboard.
- Membuat Timeline.

---

## Post Conditions

Document Owner wajib melakukan Upload Revision.

---

## Affected Components

- Workflow
- Workflow Comment
- SLA
- Notification
- Dashboard
- Timeline

---

## Business Exceptions

Approval B ditolak apabila Workflow Comment kosong. Workflow Attachment tidak menggantikan kewajiban Comment.

---

# 5.6 BR-004 — Approval C

## Purpose

Mengembalikan dokumen kepada Document Owner.

---

## Trigger

User dengan Official Role yang sesuai Responsible Role memilih Approval C.

---

## Preconditions

- User memiliki Project Membership Active pada Project yang sama dan Official Role sesuai Responsible Role.

Workflow Comment dan Workflow Attachment bersifat opsional.

---

## Processing

Jika Workflow Status = Process Review

↓

Workflow Status = Process Comment

Jika Workflow Status = Project Review

↓

Workflow Status = Project Comment

Document Revision tetap.

Responsible Role

↓

Document Owner

Workflow Processing Engine:

- Menyimpan Workflow Attachment (jika tersedia).
- Reset SLA.
- Menentukan Current Assignee.
- Membuat Workflow Notification.
- Memperbarui Dashboard.
- Membuat Timeline.

---

## Post Conditions

Document Owner wajib melakukan Upload Revision.

---

## Affected Components

- Workflow
- Workflow Comment
- SLA
- Dashboard
- Notification
- Timeline

---

## Business Exceptions

Tidak ada.

Workflow Comment maupun Workflow Attachment boleh kosong.

---

# 5.7 BR-005 — Upload Revision

## Purpose

Melanjutkan Workflow setelah Comment.

---

## Trigger

Document Owner atau Admin Project terkait melakukan Upload Revision.

---

## Preconditions

Workflow Status harus:

- Process Comment
- Project Comment

Actor harus memenuhi seluruh kondisi berikut:

- User Account berstatus Active.
- Project berstatus Active.
- Memiliki Project Membership Active pada Project milik Document.
- Memiliki Official Role Document Owner atau Admin pada Project tersebut.
- Memiliki Permission Upload Revision atau Edit Document yang berlaku pada Project.

---

## Business Context

Upload Revision merupakan proses memperbarui dokumen yang sudah terdaftar di dalam sistem.

Workflow ini hanya dijalankan apabila pengguna mengunggah file baru ke Document yang telah memiliki **Document ID** dan sedang berada pada Workflow Status:

- Process Comment
- Project Comment

Upload Revision tidak pernah membuat Document baru.

Upload Revision selalu menambahkan Revision baru pada Document yang sama.

Jenis proses Upload ditentukan berdasarkan konteks dokumen yang sedang aktif, bukan berdasarkan nama file maupun nama attachment yang diunggah.

---


## Processing

Workflow Processing Engine:

- Tidak membuat Document baru.
- Tidak mengubah Document Number.
- Menambahkan Revision History.
- Menjadikan Attachment terbaru sebagai Active Version.
- Mengembalikan Workflow ke tahap Review.
- Reset SLA.
- SLA Timer dimulai kembali sejak Upload Revision berhasil diproses.
- Membuat Workflow Notification.
- Memperbarui Dashboard.
- Membuat Timeline.

---

## Post Conditions

Workflow kembali ke Team Process atau Team Project sesuai Workflow Status.

---

## Affected Components

- Revision History
- Workflow
- SLA
- Dashboard
- Notification
- Timeline

---

## Business Exceptions

Upload Revision ditolak apabila Workflow Status bukan Process Comment, Process Reject, Project Comment, atau Project Reject.

Upload Revision juga ditolak apabila Actor bukan Document Owner atau Admin pada Project milik Document.

Admin dari Project lain tidak dapat melakukan Upload Revision.

---

# 5.8 BR-006 — Document Actions

Document Actions terdiri dari:

- View
- Download
- Comment
- History

Semua user yang memiliki akses terhadap dokumen dapat menggunakan:

- View
- Download
- Comment (Read Only)

History hanya tersedia apabila:

```
Workflow Status = Approved
```

Document Actions:

- Tidak mengubah Workflow.
- Tidak mengubah Revision.
- Tidak mengubah SLA.
- Tidak menghasilkan Workflow Event.

---

# 5.9 BR-007 — Workflow Actions

Workflow Actions terdiri dari:

- Approval A
- Approval B
- Approval C
- Upload Revision

Workflow Actions:

- Mengubah Workflow.
- Menghasilkan Workflow Event.
- Menghasilkan Audit Trail.
- Menghasilkan Document Timeline.
- Memperbarui Dashboard Read Model.

Workflow Actions hanya dapat dilakukan oleh user dengan Project Membership Active pada Project yang sama dan Official Role yang sesuai Responsible Role.

---

# 5.10 BR-008 — Workflow Comment

Approval B

↓

Reviewer wajib memberikan Workflow Comment. Workflow Attachment bersifat optional.

---

Approval C

↓

Workflow Comment maupun Workflow Attachment bersifat opsional.

---

Workflow Attachment

↓

Workflow Attachment merupakan bagian dari Workflow Comment.

Workflow Attachment bukan merupakan Document Revision, bukan Active Document, dan tidak mengubah Workflow maupun Revision History.

---

Comment Viewer

↓

Comment Viewer bersifat Read Only.

Comment Viewer menampilkan Workflow Comment beserta Workflow Attachment.

Comment Viewer menampilkan nama User dan Official Role yang tersimpan pada Workflow Comment.

Comment Viewer tidak dapat mengubah Workflow Comment maupun Workflow Attachment.

---

# 5.11 BR-009 — History

History merupakan Document Action.

History hanya tersedia apabila:

```
Workflow Status = Approved
```

History menampilkan Document Timeline.

Document Timeline minimal memuat:

- Upload Document
- Engineering Review
- Workflow Comment
- Upload Revision
- Project Review
- Approval
- Status Change
- Revision Change
- SLA Reset
- Workflow Notification

History bersifat Read Only.

---

# 5.12 BR-010 — Dashboard Read Model

Dashboard menggunakan Dashboard Read Model.

Dashboard:

- Tidak menyimpan Business State.
- Tidak mengubah Workflow.
- Tidak mengubah Revision.
- Tidak mengubah SLA.

Dashboard hanya membaca data dari:

- Workflow Processing Engine
- SLA Engine
- Workflow Notification
- Document Timeline

---

# 5.13 BR-011 — Responsible Role & Current Assignee

Responsible Role ditentukan berdasarkan Workflow Status.

Workflow Processing Engine menentukan Current Assignee berdasarkan Responsible Role.

Dashboard selalu menampilkan Current Assignee.

Contoh:

```
3d 2h (Andi)
```

---

# 5.14 BR-012 — SLA Rules

Setiap perubahan Workflow Status berikut:

- Process Review → Process Comment
- Process Comment → Process Review
- Project Review → Project Comment
- Project Comment → Project Review

harus melakukan:

```
Reset SLA Timer
```

Apabila Workflow Status menjadi:

```
Approved
```

SLA Timer berubah menjadi:

```
Done
```

Kategori SLA:

- On Track
- At Risk
- Overdue
- Final As-Built

Kategori SLA bukan Workflow Status.

---

# 5.15 BR-013 — Document Timeline

Setiap Workflow Action menghasilkan:

- Audit Trail
- Document Timeline

Document Timeline mencatat seluruh aktivitas Workflow, termasuk perubahan Status, Workflow Comment, dan Workflow Attachment (jika tersedia).

Timeline bersifat permanen.

Timeline tidak dapat diubah oleh user.

Timeline digunakan oleh fitur History.

---

# 5.16 Business Rule Dependency

| Rule ID | Affected Components |
|---------|---------------------|
| BR-001 | Workflow, SLA, Dashboard |
| BR-002 | Workflow, Revision, Timeline |
| BR-003 | Workflow, Comment, SLA |
| BR-004 | Workflow, SLA |
| BR-005 | Revision History |
| BR-006 | Document Actions |
| BR-007 | Workflow Engine |
| BR-008 | Workflow Comment |
| BR-009 | History |
| BR-010 | Dashboard Read Model |
| BR-011 | Responsible Role |
| BR-012 | SLA Engine |
| BR-013 | Document Timeline |

---

# 5.17 Business Rule Priority

Apabila terjadi konflik implementasi.

Prioritas adalah:

```
Business Rules
        │
        ▼
Workflow Processing Engine
        │
        ▼
Implementation Reference
        │
        ▼
Frontend
        │
        ▼
Backend
```

Business Rules selalu menjadi acuan utama.

---

# 5.18 Relationship with Other Chapters

Business Rules menjadi dasar implementasi bagi:

- Workflow Processing Engine
- Workflow Supporting Services
- Interaction Specification
- Implementation Reference
- Governance

Seluruh implementasi teknis wajib mengikuti Business Rules pada chapter ini.

---

# End of Chapter 5

Business Rules merupakan kontrak bisnis resmi yang mengendalikan seluruh Business Workflow EDMS.

Seluruh perubahan terhadap Workflow harus mengikuti Business Rules yang telah ditetapkan pada chapter ini.


# Chapter 6. Event-Driven Workflow Supporting Services

---

# 6.1 Introduction

Workflow Supporting Services merupakan kumpulan service yang bekerja setelah Workflow Processing Engine berhasil menyelesaikan suatu Workflow Action.

Supporting Services tidak mengubah Business Workflow.

Supporting Services hanya merespons Workflow Event yang dihasilkan oleh Workflow Processing Engine.

Workflow Processing Engine tetap menjadi satu-satunya komponen yang memiliki hak untuk mengubah:

- Workflow Status
- Document Revision
- Responsible Role
- Current Assignee

---

# 6.2 Supporting Service Architecture

Hubungan antar komponen digambarkan sebagai berikut.

```text
Workflow Action
        │
        ▼
Workflow Processing Engine
        │
        ▼
Workflow Event (+ Project Context)
        │
        ├──────────────► SLA Engine
        │
        ├──────────────► Workflow Notification
        │
        ├──────────────► Dashboard Read Model
        │
        ├──────────────► Document Timeline
        │
        └──────────────► Escalation Engine
```

Seluruh Supporting Services bekerja dalam scope Project yang berasal dari Workflow Event.

Supporting Services tidak diperbolehkan mengambil data lintas Project.

Contoh:

- SLA Engine hanya menghitung Document dari Project yang sesuai.
- Workflow Notification hanya mencari penerima dalam Project yang sesuai.
- Dashboard Read Model hanya memperbarui Dashboard Project yang sesuai.
- Document Timeline hanya mencatat aktivitas pada Project yang sesuai.
- Escalation Engine hanya mengevaluasi Document pada Project yang sesuai.

Workflow Event merupakan pemicu seluruh Supporting Services.

Supporting Services tidak saling mengubah Workflow maupun data bisnis utama.

Seluruh Supporting Services bekerja secara independen berdasarkan Workflow Event yang sama.

---

# 6.3 Workflow Event

Workflow Event merupakan hasil dari setiap Workflow Action.

Workflow Event menjadi sumber informasi bagi seluruh Supporting Services.

Workflow Event yang dihasilkan oleh Workflow Engine minimal terdiri dari:

| Workflow Action | Workflow Event |
|-----------------|----------------|
| Upload Document | Workflow Started |
| Approval A | Workflow Approved |
| Approval B | Workflow Returned with Comment |
| Approval C | Workflow Rejected |
| Upload Revision | Revision Uploaded |
| Approved | Workflow Completed |

Workflow Event tidak mengubah Workflow.

Workflow Event hanya mendistribusikan informasi kepada Supporting Services.

Setiap Workflow Event wajib membawa Project Context.

Minimal informasi Project Context terdiri dari:

| Field | Description |
|-------|-------------|
| Project ID | Identifier Project milik Document. |
| Project Name | Nama Project untuk kebutuhan display dan audit. |
| Document ID | Identifier Document dalam Project. |
| Actor User ID | User yang menjalankan Workflow Action. |
| Actor Project Membership ID | Project Membership yang digunakan saat Action dijalankan. |
| Actor Official Role | Official Role Actor pada Project tersebut. |

Workflow Event tanpa Project Context dinyatakan tidak valid.

Seluruh Supporting Services wajib menggunakan Project Context yang dibawa oleh Workflow Event dan tidak diperbolehkan mengambil data dari Project lain.

---

## 6.4 SLA Engine

### SLA Timer

SLA Timer merupakan penghitung waktu (**Count Up Timer**) yang digunakan untuk memonitor lamanya suatu dokumen berada pada **Workflow Status** yang sedang aktif.

SLA Timer dimulai secara otomatis setiap kali dokumen memasuki Workflow Status baru yang memerlukan proses review.

Perhitungan SLA menggunakan metode **Timestamp-based Realtime Calculation** dengan waktu sistem (**UTC**) sebagai acuan utama untuk menjaga konsistensi perhitungan di seluruh lingkungan aplikasi.

Format tampilan sementara selama tahap pengembangan:

```text
3d 4h 27m (Andi Team Process Pertamina)
```

Keterangan:

- **3d** = jumlah hari yang telah berlalu.
- **4h** = jumlah jam yang telah berlalu.
- **27m** = jumlah menit yang telah berlalu.
- **Andi Team Process Pertamina** = Current Assignee yang sedang bertanggung jawab terhadap dokumen.

SLA Timer menggunakan metode **Count Up**, dimulai dari:

```text
0d 0h 0m
```

hingga mencapai Status **Approved**, kemudian berubah menjadi:

```text
Done
```

---

### SLA Reset Rules

SLA Timer hanya di-reset ketika **Workflow Status berubah**.

Workflow Status yang digunakan dalam EDMS terdiri dari:

- Process Review
- Process Comment
- Project Review
- Project Comment
- Process Reject
- Project Reject
- Approved

Setiap kali Workflow Status berubah dari satu Status aktif ke Status aktif lainnya, SLA Timer di-reset menjadi:

```text
0d 0h 0m
```

Contoh:

```text
Process Review
↓
Process Comment
↓
SLA Timer = 0d 0h 0m
```

```text
Process Review
↓
Project Review
↓
SLA Timer = 0d 0h 0m
```

```text
Project Comment
↓
Project Review
↓
SLA Timer = 0d 0h 0m
```

```text
Process Reject
↓
Process Review
↓
SLA Timer = 0d 0h 0m
```

```text
Project Reject
↓
Project Review
↓
SLA Timer = 0d 0h 0m
```

Perubahan metadata dokumen tidak menyebabkan SLA Timer di-reset.

Perubahan **Days Until Validation** juga tidak menyebabkan SLA Timer di-reset apabila **Workflow Status** tidak berubah.

Apabila **Days Until Validation** diperbarui bersamaan dengan perubahan **Workflow Status**, maka SLA Timer tetap di-reset karena terjadi perubahan Workflow Status.

Apabila Workflow Status berubah menjadi:

```text
Approved
```

maka SLA Timer dihentikan dan ditampilkan sebagai:

```text
Done
```

---

### SLA Status

SLA Engine menentukan SLA Status berdasarkan perbandingan antara **SLA Timer** dengan nilai **Days Until Validation**.

| SLA Status | Business Rule |
|--------------|---------------|
| On Track | SLA Timer < Days Until Validation |
| At Risk | SLA Timer = Days Until Validation |
| Overdue | SLA Timer > Days Until Validation |
| Final As-Built | Workflow Status = Approved |

Ketika dokumen masuk SLA Status **Overdue**, dokumen tersebut otomatis menjadi kandidat untuk diproses oleh **Escalation Management**.

Ketika Workflow Status berubah menjadi **Approved**, SLA Timer dihentikan dan dokumen berpindah ke SLA Status **Final As-Built**.

Jumlah dokumen dengan SLA Status **Final As-Built** menjadi sumber data KPI Card **Final As-Built** pada Dashboard.

---

### SLA Calculation Principles

SLA Engine menggunakan prinsip perhitungan sebagai berikut:

- SLA Timer menggunakan metode **Timestamp-based Realtime Calculation**.
- SLA Timer menggunakan metode **Count Up**.
- SLA Timer dimulai setiap kali Workflow Status memasuki Status baru.
- SLA Timer hanya di-reset ketika terjadi perubahan Workflow Status.
- SLA Timer tidak di-reset oleh perubahan metadata dokumen.
- SLA Timer tetap berjalan pada hari kerja, Sabtu, Minggu, maupun hari libur.
- Timestamp disimpan menggunakan format **UTC**.
- Waktu ditampilkan kepada pengguna menggunakan zona waktu **WIB (UTC+7)**.
- Dashboard hanya menampilkan hasil perhitungan dari SLA Engine.
- Escalation Management menggunakan hasil kategori SLA yang dihasilkan oleh SLA Engine.
- Notification Management menggunakan hasil SLA Engine sebagai salah satu pemicu notifikasi.

---

# 6.5 Workflow Notification

Workflow Notification dibuat secara otomatis setelah Workflow Processing Engine menghasilkan Workflow Event.

Workflow Notification dapat dibuat untuk:

- Upload Document
- Approval A
- Approval B
- Approval C
- Upload Revision
- Workflow Completed

Workflow Notification bersifat informatif.

Workflow Notification tidak mengubah Workflow.

Dalam arsitektur Multi Project, penerima Workflow Notification harus memenuhi seluruh kondisi berikut:

- User Account berstatus Active.
- Project Membership berstatus Active.
- User merupakan anggota Project milik Document.
- User memiliki Official Role penerima pada Project tersebut.

Primary Recipient Workflow tetap mengikuti Business Workflow existing.

Selain Primary Recipient, Admin hanya menerima Personal Notification tambahan apabila Business Event termasuk allowlist Admin Notification.

Admin Notification tersebut menggunakan Message Dictionary existing:

- Approval B menggunakan Title `Revision Required` dan Message `Document requires revision. Review comment and attachment are available.`
- Approval C menggunakan Title `Document Not Approved` dan Message `Document was not approved.`
- Document Approved menggunakan Title `Document Approved` dan Message `The document has been approved.`
- SLA At Risk menggunakan Title `SLA Warning` dan Message `Document is approaching its SLA limit.`
- SLA Overdue menggunakan Title `SLA Overdue` dan Message `Document has exceeded the SLA limit.`

Admin tidak menerima Notification tambahan untuk Upload Document, Approval A menuju Project Review, Upload Revision, Workflow Completed yang bukan Document Approved, Escalation Created yang bukan SLA Overdue, Notification Read, Login, atau Logout.

Apabila User yang sama terdeteksi sebagai Primary Recipient dan Admin Recipient, sistem wajib membuat hanya satu Notification untuk User tersebut pada Business Event yang sama.

User dengan Official Role yang sama pada Project lain tidak menerima Notification.

Setiap Notification wajib memiliki Project ID.

Notification SLA At Risk dan SLA Overdue wajib dibuat berdasarkan transisi SLA State yang valid. Evaluasi ulang pada state yang sama tidak membuat Notification baru.

Duplicate prevention SLA berlaku per Project, Document, recipient, dan SLA State. Workflow Approval A, Approval B, Approval C, Upload Revision, atau status transition lain tidak boleh membuat ulang SLA Warning atau SLA Overdue untuk dokumen dan recipient yang sama apabila Notification SLA tersebut sudah pernah dibuat.

Query refetch, refresh, page load, timer refresh, login ulang, atau Project switching tanpa perubahan SLA State tidak boleh menghasilkan Notification SLA tambahan.

Catatan implementasi:

Versi MVP dapat menggunakan notifikasi di dalam aplikasi (in-app notification). Dukungan email, push notification, atau reminder akan dipertimbangkan pada versi berikutnya.

---

# 6.6 Dashboard Read Model

Dashboard merupakan representasi visual dari kondisi Business Workflow.

Dashboard tidak menyimpan Business State.

Dashboard hanya membaca informasi yang telah diproses oleh:

- Workflow Event
- SLA Engine
- Workflow Notification
- Document Timeline
- Escalation Engine

Dashboard diperbarui setelah Workflow Event diproses.

Dashboard Read Model hanya digunakan untuk kebutuhan tampilan (read-only) dan tidak digunakan untuk mengubah Business Workflow.

Dashboard Read Model selalu dibangun berdasarkan Active Project.

Dashboard hanya menampilkan:

- KPI milik Active Project.
- Document milik Active Project.
- SLA milik Active Project.
- Escalation milik Active Project.
- Workflow Activity milik Active Project.

Perpindahan Active Project menyebabkan Dashboard Read Model dimuat ulang tanpa mengubah data Project sebelumnya.

---

## Dashboard Components

Dashboard terdiri dari:

### Summary Cards

- Total Document
- Process Review
- Project Review
- Approved

---

### Monitoring Cards

- SLA Overview
- Escalation Alert

---

### Document Register

Menampilkan:

- Document Number
- Document Title
- Revision
- Workflow Status
- SLA Timer
- Current Assignee
- Document Actions
- Workflow Actions

---

# 6.7 Document Register Behaviour

Document Register merupakan representasi kondisi terbaru setiap dokumen.

---

## Document Actions

Semua user yang memiliki akses terhadap dokumen dapat menggunakan:

- View
- Download
- Comment (Read Only)

History hanya tersedia apabila:

```
Workflow Status = Approved
```

---

## Workflow Actions

Workflow Actions hanya muncul apabila user memiliki Project Membership Active pada Project yang sama dan Official Role sesuai Responsible Role.

### Process Review

Team Process memperoleh:

- Approval A
- Approval B
- Approval C

---

### Project Review

Team Project memperoleh:

- Approval A
- Approval B
- Approval C

---

### Approved

Workflow Actions disembunyikan.

Dashboard menampilkan:

```
History
```

Sebagai pengganti tombol Approval.

Perilaku ini merupakan implementasi resmi dari **CR-003**.

---

# 6.8 SLA Overview

SLA Overview merupakan Dashboard Read Model yang mengelompokkan dokumen berdasarkan kondisi SLA.

Kategori:

- On Track
- At Risk
- Overdue
- Final As-Built

Kategori SLA tidak mengubah Workflow Status.

---

## Navigation

Klik SLA Overview

↓

SLA Monitoring

↓

Filter:

- On Track
- At Risk
- Overdue
- Final As-Built

---

# 6.9 Escalation Engine

Escalation Engine memonitor seluruh dokumen dengan kategori:

```
Overdue
```

Ketika kondisi tersebut terpenuhi:

- Dokumen masuk ke halaman Escalation Alert.
- Dashboard memperbarui jumlah Escalation.

Escalation Engine:

- Tidak mengubah Workflow.
- Tidak mengubah Revision.
- Tidak mengubah Responsible Role.

Escalation hanya merupakan hasil monitoring SLA.

Dalam arsitektur Multi Project, Escalation Engine bekerja berdasarkan Project Context.

Escalation Engine hanya mengevaluasi Document yang berada pada Project yang sama dengan Project Context yang diterima melalui Workflow Event.

Dokumen Overdue hanya ditampilkan pada halaman Escalation Alert milik Project tersebut.

Escalation dari Project lain tidak boleh ditampilkan maupun diproses pada Active Project yang berbeda.

---

# 6.10 Document Timeline

Document Timeline mencatat seluruh Workflow Event.

Timeline minimal memuat:

- Upload Document
- Approval A
- Approval B
- Approval C
- Workflow Comment
- Workflow Attachment
- Upload Revision
- Workflow Status Change
- Revision Change
- SLA Reset
- Workflow Notification
- Workflow Completed

Timeline bersifat permanen.

Timeline tidak dapat diubah oleh user.

Timeline digunakan oleh fitur History.

---

# 6.11 Supporting Service Dependency Matrix

| Service | Depends On |
|----------|------------|
| SLA Engine | Workflow Event |
| Workflow Notification | Workflow Event |
| Dashboard Read Model | Workflow Event |
| Document Timeline | Workflow Event |
| Escalation Engine | SLA Engine |

Supporting Services tidak saling mengubah Workflow.

---

# 6.12 Event-Driven Principles

ES-001

Workflow Processing Engine merupakan satu-satunya penghasil Workflow Event.

---

ES-002

Supporting Services hanya merespons Workflow Event.

---

ES-003

Supporting Services tidak boleh mengubah Workflow Status.

---

ES-004

Dashboard hanya membaca Dashboard Read Model.

---

ES-005

Escalation hanya membaca hasil SLA Engine.

---

ES-006

Workflow Notification hanya dibuat setelah Workflow Event berhasil diproses.

---

ES-007

Document Timeline hanya mencatat Workflow Event.

---

ES-008

Document Actions tidak menghasilkan Workflow Event.

---

ES-009

Workflow Actions selalu menghasilkan Workflow Event.

---

ES-010

Dashboard selalu menampilkan Current Assignee sesuai Workflow Event terakhir.

---

---

ES-011

Seluruh Workflow Event wajib memiliki Project Context.

---

ES-012

Supporting Services hanya boleh memproses data dalam Project yang terdapat pada Workflow Event.

---

ES-013

Notification recipient wajib dibatasi berdasarkan Project Membership.

---

ES-014

Dashboard Read Model, SLA, Escalation, Notification, dan Timeline tidak boleh mencampur data antar Project.

---

# 6.13 Relationship with Other Chapters

Chapter ini merupakan implementasi lanjutan dari:

- Chapter 3 – Workflow Processing Engine
- Chapter 5 – Business Rules

Chapter ini menjadi dasar implementasi bagi:

- Chapter 7 – Interaction Specification
- Chapter 8 – Implementation Reference
- Chapter 9 – Governance, Appendix & Release

Seluruh implementasi Frontend, Backend, Database, API, QA, maupun AI Coding Agent wajib mengikuti arsitektur Event-Driven Supporting Services yang telah didefinisikan pada chapter ini.

---

# End of Chapter 6

Workflow Supporting Services memastikan bahwa setiap Workflow Event menghasilkan pembaruan SLA, Dashboard, Notification, Timeline, dan Escalation secara konsisten tanpa mengubah Business Workflow.

Seluruh Supporting Services harus bekerja berdasarkan Workflow Event dan tidak diperbolehkan mengubah Workflow Status secara langsung.


# Chapter 7. Interaction Specification

---

# 7.1 Introduction

Interaction Specification mendefinisikan bagaimana setiap Business Actor berinteraksi dengan Workflow Processing Engine dan seluruh Workflow Supporting Services.

Chapter ini tidak mendefinisikan Business Rules baru.

Seluruh interaction pada chapter ini merupakan implementasi langsung dari:

- Business Concepts
- Workflow Processing Engine
- Business Rules
- Event-Driven Workflow Supporting Services

Interaction Specification menjadi referensi utama implementasi Frontend, Backend, QA, dan AI Coding Agent.

---

# 7.2 Interaction Principles

Business Workflow EDMS dibangun berdasarkan prinsip berikut.

INT-001

Workflow Action selalu diproses oleh Workflow Processing Engine.

---

INT-002

Document Actions tidak pernah mengubah Workflow.

---

INT-003

Workflow Event selalu dihasilkan setelah Workflow berhasil diproses.

---

INT-004

Supporting Services hanya merespons Workflow Event.

---

INT-005

Dashboard hanya membaca Dashboard Read Model.

---

INT-006

History selalu menggunakan Document Timeline.

---

INT-007

Seluruh Interaction harus mengikuti Business Rules.

---

# 7.3 Business Interaction Flow

Business Interaction dimulai setelah User berhasil Login dan memilih Active Project.

```text
User Login
        │
        ▼
Load Project Membership
        │
        ▼
Select Active Project
        │
        ▼
Load Project Context
        │
        ▼
Display Project Dashboard
```

Setelah Active Project tersedia, Business Workflow dimulai ketika Document Owner melakukan Upload Document.

Document baru secara otomatis menerima Project ID dari Active Project.

Workflow Processing Engine memproses Upload kemudian menentukan:

- Workflow Status
- Document Revision
- Responsible Role
- Current Assignee

Workflow Event kemudian dihasilkan.

Workflow Event diproses oleh:

- SLA Engine
- Workflow Notification
- Dashboard Read Model
- Document Timeline
- Escalation Engine

Dokumen kemudian memasuki Process Review.

Team Process melakukan Review.

User dengan Official Role yang sesuai Responsible Role dan Project Membership Active dapat memilih salah satu Workflow Action berikut:

- Approval A
- Approval B
- Approval C

Approval A

↓

Project Review

Approval B

↓

Process Comment

Approval C

↓

Process Comment

Apabila Workflow berada pada Process Comment, maka Document Owner wajib melakukan Upload Revision.

Upload Revision mengembalikan Workflow ke Process Review.

Setelah Engineering Review selesai, Workflow berpindah ke Project Review.

Team Project kembali melakukan Review.

Current Assignee kembali dapat memilih:

- Approval A
- Approval B
- Approval C

Approval A

↓

Approved

Approval B

↓

Project Comment

Approval C

↓

Project Comment

Upload Revision pada Project Comment mengembalikan Workflow ke Project Review.

Workflow selesai ketika Status menjadi **Approved**.

Seluruh Business Interaction berlangsung dalam Project Context yang sama.

Workflow Action tidak boleh mengakses maupun mengubah Document dari Project lain.

---

# 7.4 Upload Document Interaction

Interaction Sequence.

```text
Document Owner
        │
        ▼
Active Project
        │
        ▼
Frontend
        │
        ▼
Backend
        │
        ▼
Project Context Validation
        │
        ▼
Project Status Validation
        │
        ▼
User Account Validation
        │
        ▼
Project Membership Validation
        │
        ▼
Official Role Validation
        │
        ▼
Workflow Processing Engine
        │
        ▼
Database
        │
        ▼
Workflow Event (+ Project Context)
        │
        ├────────────► SLA Engine
        ├────────────► Workflow Notification
        ├────────────► Document Timeline
        ├────────────► Dashboard Read Model
        └────────────► Escalation Engine
        │
        ▼
Response
```

## Output

- Project ID = Active Project
- Workflow Started
- Workflow Status = Process Review
- Document Revision = IFR-Submitted
- Responsible Role = Team Process
- Current Assignee = Ditentukan Workflow Engine
- SLA Timer = Started

---

# 7.5 Approval Interaction

Interaction Sequence.

```
Current Assignee

↓

Frontend

↓

Backend


↓

Project Context Validation

↓

Project Membership Validation

↓

Workflow Processing Engine

↓

Workflow Validation

↓

Database

↓

Workflow Event

↓

Supporting Services

↓

Dashboard Refresh

↓

Response
```

Output bergantung pada Workflow Action.

---

## Approval A

Output:

- Workflow Transition
- Revision Update
- Workflow Event

---

## Approval B

Output:

- Workflow Comment
- Workflow Attachment (Optional)
- Workflow Transition
- Workflow Event

Reviewer wajib memberikan Workflow Comment. Workflow Attachment bersifat optional.

---

## Approval C

Output:

- Workflow Comment (Optional)
- Workflow Attachment (Optional)
- Workflow Transition
- Workflow Event

Workflow Comment maupun Workflow Attachment bersifat opsional.

---

# 7.6 Upload Revision Interaction

Interaction Sequence.

```
Document Owner

↓

Frontend

↓

Backend

↓

Workflow Processing Engine

↓

Revision History

↓

Database

↓

Workflow Event

↓

Supporting Services

↓

Dashboard Refresh

↓

Response
```

Workflow Processing Engine:

- Tidak membuat Document baru.
- Tidak mengubah Document Number.
- Menjadikan Attachment terbaru sebagai Active Version.

---

# 7.7 Document Action Interaction

Document Actions selalu menggunakan Read Model.

Interaction.

```
User

↓

Frontend

↓

Backend

↓

Dashboard Read Model

↓

Response
```

Document Actions terdiri dari:

- View
- Download
- Comment (Workflow Comment dan Workflow Attachment)
- History

Workflow Processing Engine tidak terlibat.

---

# 7.8 Workflow Interaction Matrix

| Interaction | Workflow Engine | Workflow Event | Supporting Services |
|------------|-----------------|----------------|---------------------|
| Upload Document | ✓ | ✓ | ✓ |
| Approval A | ✓ | ✓ | ✓ |
| Approval B | ✓ | ✓ | ✓ |
| Approval C | ✓ | ✓ | ✓ |
| Upload Revision | ✓ | ✓ | ✓ |
| View | ✗ | ✗ | Read Only |
| Download | ✗ | ✗ | Read Only |
| Comment | ✗ | ✗ | Read Only |
| History | ✗ | ✗ | Read Only |

---

# 7.9 Workflow State Description

Workflow Processing Engine mengenal lima Workflow Status.

| Workflow Status | Description |
|-----------------|-------------|
| Process Review | Menunggu Engineering Review |
| Process Comment | Menunggu Upload Revision |
| Project Review | Menunggu Project Review |
| Project Comment | Menunggu Upload Revision |
| Approved | Workflow Selesai |

Workflow hanya boleh berpindah sesuai Workflow Transition Matrix.

---

# 7.10 Revision State Description

Document Revision terdiri dari:

| Revision | Description |
|----------|-------------|
| IFR-Submitted | Initial Submission |
| IFA-Submitted | Engineering Approved |
| AS-Built | Final Approved |

Revision selalu diubah oleh Workflow Processing Engine.

---

# 7.11 Workflow Event Matrix

| Workflow Action | Workflow Event |
|-----------------|----------------|
| Upload Document | Workflow Started |
| Approval A | Workflow Approved |
| Approval B | Workflow Returned with Comment |
| Approval C | Workflow Rejected |
| Upload Revision | Revision Uploaded |
| Approved | Workflow Completed |

Workflow Event menjadi input seluruh Supporting Services.

---

# 7.12 Interaction Rules

IR-001

Workflow Action selalu menghasilkan Workflow Event.

---

IR-002

Document Actions tidak menghasilkan Workflow Event.

---

IR-003

Workflow Processing Engine selalu berjalan sebelum Supporting Services.

---

IR-004

Dashboard hanya membaca Dashboard Read Model.

---

IR-005

History selalu membaca Document Timeline.

---

IR-006

Comment Viewer hanya membaca Workflow Comment beserta Workflow Attachment.

---

IR-007

Current Assignee selalu diperbarui oleh Workflow Processing Engine.

---

IR-008

Workflow Completion selalu menghasilkan Workflow Completed Event.

---

IR-009

Seluruh Interaction wajib memiliki Project Context.

---

IR-010

User hanya dapat menjalankan Interaction pada Project tempat User memiliki Project Membership Active.

---

IR-011

Document selalu diproses menggunakan Project milik Document.

---

IR-012

Perpindahan Active Project hanya memperbarui data yang ditampilkan dan tidak mengubah Business Workflow.

---

IR-013

Seluruh Supporting Services wajib menggunakan Project ID dari Workflow Event.

---

# 7.13 Implementation Notes

## Frontend

- Jangan mengubah Workflow Status secara langsung.
- Tombol Approval A/B/C hanya muncul apabila user memiliki Project Membership Active pada Project yang sama dan Official Role sesuai Responsible Role.
- Tombol History hanya muncul apabila Workflow Status = Approved.
- Document Actions selalu menggunakan endpoint Read Only.
- Seluruh halaman operasional wajib menggunakan Active Project.
- Create Document otomatis menggunakan Project ID dari Active Project.
- Frontend tidak boleh mengirim Project ID yang berbeda dari Active Project tanpa mekanisme resmi.
- Perpindahan Active Project wajib memuat ulang seluruh Project-Scoped Read Model.

---

## Backend

- Semua Workflow Action diproses oleh Workflow Processing Engine.
- Semua perubahan Status menghasilkan Workflow Event.
- Supporting Services hanya merespons Workflow Event.
- Workflow Processing Engine menjadi satu-satunya komponen yang mengubah Workflow Status, Revision, Responsible Role, dan Current Assignee.
- Semua query data operasional wajib dibatasi berdasarkan Project ID.
- Backend wajib memvalidasi Project Membership pada setiap Project-Scoped Action.
- Backend tidak boleh mempercayai Project ID dari Frontend tanpa validasi.
- Project ID Document tidak boleh diubah melalui Workflow Action.

---

## QA

Minimal lakukan verifikasi berikut.

- Workflow Action menghasilkan Workflow Event.
- Approval B mewajibkan Workflow Comment. Workflow Attachment bersifat optional.
- Approval C menerima Workflow Comment maupun Workflow Attachment yang kosong.
- History hanya muncul setelah Approved.
- Dashboard menggunakan Dashboard Read Model.
- Document Actions tidak mengubah Workflow.
- Data Project A tidak tampil pada Project B.
- Workflow Action Project A tidak dapat dijalankan oleh User tanpa Project Membership Project A.
- Pergantian Active Project tidak mengubah data Project sebelumnya.
- Notification, SLA, Escalation, dan Audit Trail tetap terisolasi per Project.

---

# 7.14 Relationship with Other Chapters

Chapter ini merupakan implementasi interaksi dari:

- Chapter 2 – Actors & Responsibilities
- Chapter 3 – Workflow Processing Engine
- Chapter 5 – Business Rules
- Chapter 6 – Event-Driven Workflow Supporting Services

Chapter ini menjadi dasar implementasi bagi:

- Chapter 8 – Implementation Reference
- Chapter 9 – Governance, Appendix & Release

---

# End of Chapter 7

Interaction Specification mendefinisikan bagaimana setiap Business Actor, Workflow Processing Engine, Workflow Event, dan Supporting Services saling berinteraksi selama siklus hidup dokumen.

Seluruh implementasi Frontend, Backend, Database, API, QA, maupun AI Coding Agent wajib mengikuti spesifikasi interaksi yang telah ditetapkan pada chapter ini.


# Chapter 8. Implementation Reference

---

# 8.1 Introduction

Implementation Reference merupakan kumpulan referensi implementasi resmi yang diturunkan langsung dari Business Rules.

Chapter ini tidak mendefinisikan Business Rule baru.

Seluruh isi chapter ini merupakan ringkasan implementasi yang harus digunakan secara konsisten oleh:

- Frontend Developer
- Backend Developer
- Database Engineer
- QA Engineer
- AI Coding Agent

---

# 8.2 Workflow Status Reference

| Workflow Status | Description | Responsible Role | Current Assignee | Workflow Active |
|-----------------|-------------|------------------|------------------|-----------------|
| Process Review | Menunggu Engineering Review | Team Process | Ya | Yes |
| Process Comment | Menunggu Upload Revision | Document Owner | Ya | Yes |
| Process Reject | Menunggu Upload Revision setelah Reject Process Review | Document Owner | Ya | Yes |
| Project Review | Menunggu Project Review | Team Project | Ya | Yes |
| Project Comment | Menunggu Upload Revision | Document Owner | Ya | Yes |
| Project Reject | Menunggu Upload Revision setelah Reject Project Review | Document Owner | Ya | Yes |
| Approved | Workflow Selesai | None | None | No |

Workflow Status hanya dapat diubah oleh Workflow Processing Engine.

---

# 8.3 Document Revision Reference

| Revision | Description |
|-----------|-------------|
| IFR-Submitted | Initial submission |
| IFA-Submitted | Engineering Review selesai |
| AS-Built | Final Approved |

Revision hanya berubah melalui Workflow Processing Engine.

---

# 8.4 Workflow Transition Matrix

| Current Workflow Status | Workflow Action | Next Workflow Status |
|-------------------------|-----------------|----------------------|
| Process Review | Approval A | Project Review |
| Process Review | Approval B | Process Comment |
| Process Review | Approval C | Process Reject |
| Process Comment | Upload Revision | Process Review |
| Process Reject | Upload Revision | Process Review |
| Project Review | Approval A | Approved |
| Project Review | Approval B | Project Comment |
| Project Review | Approval C | Project Reject |
| Project Comment | Upload Revision | Project Review |
| Project Reject | Upload Revision | Project Review |

Workflow di luar tabel ini harus ditolak.

---

# 8.5 Revision Transition Matrix

| Workflow Transition | Revision |
|---------------------|----------|
| Upload Document | IFR-Submitted |
| Process Review → Project Review | IFA-Submitted |
| Process Review → Process Comment | IFR-Submitted |
| Project Review → Project Comment | IFA-Submitted |
| Project Review → Approved | AS-Built |

---

# 8.6 SLA Status Reference

| SLA Status | Rule |
|----------|------|
| On Track | Elapsed Time < Days Until Validation |
| At Risk | Elapsed Time = Days Until Validation |
| Overdue | Elapsed Time > Days Until Validation |
| Final As-Built | Workflow Status = Approved |

SLA Status bukan Workflow Status dan bukan Document Lifecycle.

---

# 8.7 SLA Reset Matrix

| Trigger | Action |
|----------|--------|
| Process Review → Process Comment | Reset SLA |
| Process Comment → Process Review | Reset SLA |
| Project Review → Project Comment | Reset SLA |
| Project Comment → Project Review | Reset SLA |
| Workflow Status = Approved | SLA Status = Final As-Built |

---

# 8.8 Workflow Event Matrix

| Workflow Action | Workflow Event |
|-----------------|----------------|
| Upload Document | Workflow Started |
| Approval A | Workflow Approved |
| Approval B | Workflow Returned with Comment |
| Approval C | Workflow Rejected |
| Upload Revision | Revision Uploaded |
| Approved | Workflow Completed |

Workflow Event menjadi input bagi seluruh Supporting Services.

---

# 8.9 Workflow Data Ownership Matrix

| Data | Updated By |
|------|------------|
| Workflow Status | Workflow Processing Engine |
| Document Revision | Workflow Processing Engine |
| Responsible Role | Workflow Processing Engine |
| Current Assignee | Workflow Processing Engine |
| SLA Timer | SLA Engine |
| SLA Status | SLA Engine |
| Dashboard Read Model | Dashboard Service |
| Workflow Notification | Notification Service |
| Document Timeline | Timeline Service |
| Escalation Alert | Escalation Engine |

Komponen selain yang tercantum di atas tidak diperbolehkan mengubah data tersebut.

---

# 8.9.1 Project Context Reference

| Data | Project Scope |
|------|---------------|
| Project | Root Scope |
| Project Membership | Per Project |
| Document | Per Project |
| Revision | Mengikuti Project Document |
| Workflow | Mengikuti Project Document |
| Workflow Comment | Mengikuti Project Document |
| Workflow Attachment | Mengikuti Project Document |
| SLA Timer | Mengikuti Project Document |
| SLA Status | Mengikuti Project Document |
| Escalation Alert | Mengikuti Project Document |
| Workflow Notification | Per User dan Per Project |
| Document Timeline | Mengikuti Project Document |
| Audit Trail | Per Project |
| Dashboard Read Model | Per Active Project |

User Account dan Authentication Credential bersifat global.

Official Role operasional ditetapkan melalui Project Membership.

---

# 8.10 Dashboard Action Matrix

| Workflow Status | View | Download | Comment | History | Approval A | Approval B | Approval C |
|-----------------|------|----------|----------|----------|------------|------------|------------|
| Process Review | ✓ | ✓ | ✓ | - | ✓ | ✓ | ✓ |
| Process Comment | ✓ | ✓ | ✓ | - | - | - | - |
| Project Review | ✓ | ✓ | ✓ | - | ✓ | ✓ | ✓ |
| Project Comment | ✓ | ✓ | ✓ | - | - | - | - |
| Approved | ✓ | ✓ | ✓ | ✓ | - | - | - |

History menggantikan tombol Approval setelah Workflow selesai.

Implementasi ini merupakan bagian dari **CR-003**.

---

# 8.11 UI Behaviour Reference

## Document Actions

| Action | Behaviour |
|---------|-----------|
| View | Membuka Document Viewer |
| Download | Mengunduh Active Version |
| Comment | Membuka Workflow Comment (Read Only) |
| History | Membuka Document Timeline |

---

## Workflow Actions

| Action | Behaviour |
|---------|-----------|
| Approval A | Mengirim Workflow Action ke Workflow Processing Engine |
| Approval B | Mengirim Workflow Action + Workflow Comment |
| Approval C | Mengirim Workflow Action + Workflow Comment (Opsional) |
| Upload Revision | Mengunggah Attachment Baru dan melanjutkan Workflow |

Frontend tidak diperbolehkan mengubah Workflow Status secara langsung.

---

# 8.12 Backend Behaviour Reference

Backend wajib mengikuti aturan berikut.

- Seluruh Workflow diproses oleh Workflow Processing Engine.
- Workflow Status tidak boleh diubah langsung.
- Revision tidak boleh diubah langsung.
- Responsible Role tidak boleh diubah langsung.
- Current Assignee tidak boleh diubah langsung.
- Workflow Event harus dibuat setelah Workflow berhasil diproses.
- Supporting Services hanya merespons Workflow Event.
- Seluruh Project-Scoped Request wajib memvalidasi Project Membership.
- Seluruh query Document, Workflow, SLA, Escalation, Notification, Timeline, dan Audit Trail wajib menggunakan Project ID.
- Backend tidak boleh mengizinkan akses data lintas Project.
- Project ID Document tidak boleh diubah melalui Edit Document maupun Workflow Action.
- Project Context wajib diteruskan ke seluruh Supporting Services.

---

# 8.13 API Behaviour Reference

Semua endpoint Workflow harus:

- Melakukan Project Context Validation.
- Melakukan Project Membership Validation.
- Melakukan Permission Validation.
- Melakukan Workflow Validation.
- Melakukan Transition Validation.
- Menjalankan Workflow Processing Engine.
- Menghasilkan Workflow Event beserta Project Context.
- Mengembalikan Response terbaru.

Endpoint Read Only tidak boleh menjalankan Workflow Processing Engine.

Endpoint Read Only hanya boleh mengembalikan data yang berada pada Active Project.

API tidak boleh mengakses maupun mengembalikan data dari Project lain.

Project Context wajib diteruskan kepada seluruh Supporting Services yang dipicu oleh Workflow Event.

---

# 8.14 QA Verification Checklist

QA minimal harus memverifikasi:

- Workflow Transition sesuai Transition Matrix.
- Approval B mewajibkan Workflow Comment.
- Approval C menerima Workflow Comment kosong.
- Upload Revision tidak membuat Document baru.
- Document Number tetap.
- Active Version berubah ke Attachment terbaru.
- SLA Timer di-reset sesuai aturan.
- SLA Status menjadi Final As-Built ketika Workflow Status Approved; SLA Timer boleh menampilkan display wording Done.
- Dashboard menampilkan Current Assignee.
- History hanya muncul ketika Workflow Status = Approved.
- Document Actions tidak mengubah Workflow.
- Active Project berhasil dipilih.
- Dashboard hanya menampilkan data Active Project.
- Document baru menerima Project ID dari Active Project.
- User tanpa Project Membership tidak dapat mengakses Project.
- User dapat memiliki Official Role berbeda pada Project berbeda.
- Notification tidak dikirim kepada User dengan Role sama pada Project lain.
- SLA dan Escalation tidak bercampur antar Project.
- Audit Trail mencatat Project Context.
- Pergantian Active Project tidak mengubah Workflow Document.

---

# 8.15 AI Coding Guidelines

AI Coding Agent wajib mengikuti aturan berikut.

- Gunakan Business Rules sebagai referensi utama.
- Jangan mengubah Workflow tanpa Workflow Processing Engine.
- Jangan mengubah Workflow Status secara langsung.
- Jangan mengubah Revision secara langsung.
- Gunakan Workflow Event sebagai pemicu Supporting Services.
- Dashboard selalu menggunakan Dashboard Read Model.
- History selalu menggunakan Document Timeline.
- Workflow Comment mengikuti aturan Approval B dan Approval C.

---

# 8.16 Cross Reference

| Implementation Area | Reference Chapter |
|---------------------|-------------------|
| Business Concepts | Chapter 1 |
| Actors & Responsibilities | Chapter 2 |
| Workflow Processing Engine | Chapter 3 |
| Workflow Visualization | Chapter 4 |
| Business Rules | Chapter 5 |
| Supporting Services | Chapter 6 |
| Interaction Specification | Chapter 7 |

---

# End of Chapter 8

Implementation Reference merupakan panduan implementasi resmi bagi seluruh komponen sistem.

Frontend, Backend, Database, API, QA, dan AI Coding Agent wajib menggunakan referensi pada chapter ini untuk memastikan seluruh implementasi tetap konsisten dengan Business Workflow EDMS.


# Chapter 9. Governance & Release Management

---

# 9.1 Introduction

Chapter ini mendefinisikan tata kelola (Governance) terhadap BUSINESS-WORKFLOW.md.

Selain menjadi penutup dokumen, chapter ini juga menjadi referensi resmi mengenai:

- Document Governance
- Business Rule Catalog
- Architecture Decision Record (ADR)
- Change Request Management
- Official Terminology
- Versioning Policy
- Document Dependency
- Maintenance Policy
- Future Enhancement
- Release Notes

Chapter ini memastikan BUSINESS-WORKFLOW.md tetap menjadi Single Source of Truth selama siklus hidup proyek.

---

# 9.2 Document Governance

BUSINESS-WORKFLOW.md merupakan Master Document yang mendefinisikan seluruh Business Workflow EDMS.

Seluruh dokumen lain harus mengikuti BUSINESS-WORKFLOW.md.

Apabila terjadi konflik antar dokumen, maka BUSINESS-WORKFLOW.md memiliki prioritas tertinggi.

---

## Governance Principles

DGOV-001

Perubahan Business Workflow hanya boleh dilakukan melalui Change Request.

---

DGOV-002

Setiap Change Request wajib melalui Impact Analysis.

---

DGOV-003

Setiap perubahan wajib melalui Architecture Review.

---

DGOV-004

BUSINESS-WORKFLOW.md harus diperbarui terlebih dahulu sebelum dokumen turunan.

---

DGOV-005

Seluruh implementasi wajib mengacu pada BUSINESS-WORKFLOW.md.

---

# 9.3 Document Dependency Matrix

Dokumen berikut bergantung pada BUSINESS-WORKFLOW.md.

| Document | Dependency |
|----------|------------|
| PRD.md | High |
| IMPLEMENTATION-PLAN.md | High |
| API-CONTRACT.md | High |
| ACCESS-CONTROL.md | High |
| DOCUMENT-STATUS-RULES.md | High |
| SLA-RULES.md | High |
| SLA-MONITORING-SPEC.md | High |
| UI-GUIDELINES.md | Medium |
| COMPONENT-SPEC.md | Medium |
| FORM-SPEC.md | Medium |
| TABLE-SPEC.md | Medium |
| DASHBOARD-INTERACTIONS.md | Medium |
| STATE-MANAGEMENT.md | Medium |
| AGENTS.md | High |

Perubahan Business Workflow harus disinkronkan ke seluruh dokumen di atas.

---

# 9.4 Business Rule Catalog

| Rule ID | Rule Name |
|---------|-----------|
| BR-001 | Upload Document |
| BR-002 | Approval A |
| BR-003 | Approval B |
| BR-004 | Approval C |
| BR-005 | Upload Revision |
| BR-006 | Document Actions |
| BR-007 | Workflow Actions |
| BR-008 | Workflow Comment |
| BR-009 | History |
| BR-010 | Dashboard Read Model |
| BR-011 | Responsible Role & Current Assignee |
| BR-012 | SLA Rules |
| BR-013 | Document Timeline |

Business Rule Catalog merupakan indeks resmi seluruh aturan bisnis.

---

# 9.5 Architecture Decision Record (ADR) Index

| ADR | Decision |
|-----|----------|
| ADR-001 | Upload Revision tidak membuat Document baru |
| ADR-002 | Document Number tidak berubah |
| ADR-003 | Attachment terbaru menjadi Active Version |
| ADR-004 | Dashboard menggunakan Dashboard Read Model |
| ADR-005 | Escalation bukan bagian dari Workflow |
| ADR-006 | SLA Status berbeda dengan Workflow Status dan Document Lifecycle |
| ADR-007 | Responsible Role berbeda dengan Current Assignee |
| ADR-008 | Document Actions dipisahkan dari Workflow Actions |
| ADR-009 | Approval C memiliki Workflow Comment opsional |
| ADR-010 | History menggunakan Document Timeline |
| ADR-011 | Workflow menggunakan Event-Driven Supporting Services |
| ADR-012 | Official Role Canonical Naming Principle (ORCNP) |
| ADR-013 | Satu aplikasi EDMS mendukung Multi Project melalui Project Context |
| ADR-014 | Workflow Template digunakan bersama oleh seluruh Project |
| ADR-015 | Seluruh data bisnis operasional terisolasi berdasarkan Project |
| ADR-016 | User Account bersifat global dan Official Role operasional bersifat Project-Scoped |
| ADR-017 | Seluruh Workflow Event dan Supporting Services membawa Project Context |

Setiap ADR menjadi dasar keputusan arsitektur proyek.

EDMS hanya menggunakan empat Official Role:

- Admin
- Document Owner
- Team Process
- Team Project

Seluruh terminologi Reviewer Level 1, Reviewer Level 2, Engineering Reviewer, dan Project Reviewer dinyatakan deprecated.

---

# 9.6 Change Request Index

Seluruh perubahan Business Workflow harus dicatat sebagai Change Request.

| Change Request | Description | Status |
|----------------|-------------|--------|
| CR-001 | Approval C menggunakan Workflow Comment opsional | Implemented |
| CR-002 | Dashboard Document Register Enhancement (View, Download, Comment, SLA Timer, Current Assignee) | Implemented |
| CR-003 | History menggantikan Approval Button setelah Workflow selesai | Implemented |
| CR-004 | Multi Project Support melalui Project Context, Project Membership, dan Project Data Isolation | Approved |

Change Request berikutnya harus menggunakan penomoran berurutan.

---

# 9.7 Official Terminology

Seluruh dokumentasi menggunakan terminologi resmi berikut.

| Business Term | UI Label | Technical Name |
|---------------|----------|----------------|
| Workflow Status | Status | workflow_status |
| Document Revision | Revision | document_revision |
| Workflow Comment | Comment | workflow_comment |
| Document Timeline | History | document_history |
| Official Role | - | official_role |
| Responsible Role | - | responsible_role |
| Current Assignee | Current Assignee | current_assignee |
| Dashboard Read Model | Dashboard | dashboard_read_model |
| Workflow Processing Engine | - | workflow_engine |
| Workflow Event | - | workflow_event |
| Project | Project | project |
| Active Project | Active Project | active_project |
| Project Context | - | project_context |
| Project Membership | Project Member | project_membership |
| Project ID | - | project_id |

Terminologi ini harus digunakan secara konsisten pada seluruh dokumentasi dan implementasi.

---

# 9.8 Documentation Versioning Policy

Dokumentasi menggunakan Semantic Documentation Versioning.

| Version | Meaning |
|----------|---------|
| Major | Perubahan Business Workflow |
| Minor | Penambahan fitur tanpa mengubah Workflow |
| Patch | Perbaikan dokumentasi tanpa mengubah Business Rules |

Contoh:

```
1.0.0

↓

1.1.0

↓

1.2.0

↓

2.0.0
```

---

# 9.9 Document Maintenance Policy

Seluruh perubahan mengikuti alur berikut.

```text
Client Request
        │
        ▼
Change Request
        │
        ▼
Impact Analysis
        │
        ▼
Architecture Review
        │
        ▼
Update BUSINESS-WORKFLOW.md
        │
        ▼
Update Dependent Documents
        │
        ▼
Release New Documentation Version
```

Dokumen turunan tidak boleh diperbarui sebelum BUSINESS-WORKFLOW.md selesai diperbarui.

---

# 9.10 Future Enhancement

Fitur berikut berada di luar ruang lingkup versi 1.0.

- Multi Reviewer
- Parallel Approval
- Reminder Notification
- Email Notification
- Push Notification
- Digital Signature
- External Document Sharing
- Workflow Configuration
- SLA Holiday Calendar
- Delegation / Reassignment
- Audit Dashboard

Seluruh fitur tersebut harus melalui Change Request baru.

---

# 9.11 Release Notes

## Version 1.0.0

BUSINESS-WORKFLOW.md versi 1.0.0 mencakup:

- Business Concepts
- Actors & Responsibilities
- Workflow Processing Engine
- Workflow Visualization & Transition Model
- Business Rules
- Event-Driven Workflow Supporting Services
- Interaction Specification
- Implementation Reference
- Governance & Release Management
- Multi Project Context
- Project Membership
- Project Context
- Project-Scoped Workflow

Perubahan yang telah diimplementasikan:

- CR-001
- CR-002
- CR-003
- CR-004

Dokumen ini menjadi baseline resmi Business Workflow EDMS.

Seluruh Business Workflow tetap menggunakan mekanisme Approval A, Approval B, Approval C, SLA Monitoring, Escalation Alert, Notification, dan Audit Trail yang sama.

Perubahan pada CR-004 tidak mengubah Business Workflow, melainkan memperluas ruang lingkup sistem sehingga satu aplikasi EDMS dapat mendukung banyak Project melalui konsep Project Context dan Project Membership.

---

# 9.12 AI Coding Agent Guidelines

AI Coding Agent wajib:

- Membaca BUSINESS-WORKFLOW.md sebelum dokumen lain.
- Menggunakan Business Rules sebagai referensi utama.
- Menggunakan Workflow Processing Engine sebagai satu-satunya pengubah Workflow.
- Menggunakan Workflow Event untuk memicu Supporting Services.
- Mengikuti seluruh Workflow Transition Matrix.
- Mengikuti seluruh Implementation Reference.
- Tidak membuat asumsi di luar Business Rules.

---

# 9.13 Final Statement

BUSINESS-WORKFLOW.md merupakan Single Source of Truth bagi seluruh Business Workflow Engineering Document Management System (EDMS).

Seluruh implementasi Frontend, Backend, Database, API, QA, dan AI Coding Agent wajib mengacu pada dokumen ini.

Apabila terdapat konflik dengan dokumen lain, maka BUSINESS-WORKFLOW.md memiliki prioritas tertinggi.

---

# Workflow Status

| Property | Value |
|----------|-------|
| Document Name | BUSINESS-WORKFLOW.md |
| Version | 1.0.0 |
| Status | Released |
| Architecture Review | Completed |
| Editorial Review | Completed |
| Source of Truth | Yes |
| Ready for PRD Synchronization | Yes |
| Ready for Implementation Plan Synchronization | Yes |
| Ready for Frontend Specification | Yes |
| Ready for Backend Specification | Yes |
| Ready for AI Coding Agent | Yes |

---

# CR-012 — Project Close Permanent Closure

CR-012 menambahkan Project Close sebagai lifecycle Project permanen tanpa mengubah Business Workflow Approval Document A/B/C.

## Project Lifecycle

Status Project resmi:

- Active
- Inactive
- Closed

Transisi yang diperbolehkan:

- Active -> Inactive
- Inactive -> Active
- Active -> Closed

Transisi berikut ditolak:

- Inactive -> Closed
- Closed -> Active
- Closed -> Inactive

Project Inactive harus diaktifkan kembali sebelum dapat ditutup permanen.

## Closure Validation

Project hanya dapat di-Closed apabila:

- Project berstatus Active.
- User memiliki Role Admin.
- Project masih tersedia.
- Project belum berubah selama proses Wizard.
- Seluruh Workflow Document telah selesai.

Workflow aktif yang menolak Close Project:

- Process Review
- Process Comment
- Process Reject
- Project Review
- Project Comment
- Project Reject

Workflow selesai:

- Approved
- Archived

## Closure Effects

Saat Project berhasil di-Closed:

- Project menjadi final state dan tidak dapat dibuka kembali.
- Project tidak dapat menjadi Active Project.
- Project tidak muncul pada Active Project Selector.
- Dashboard operasional Project tidak tersedia.
- Create Document dan Upload Revision tidak tersedia karena Project tidak dapat menjadi Active Project.
- Approved Document di-Archive otomatis.
- Archived Document tetap Archived.
- Restore Archived Document ditolak setelah Project Closed.
- Project Membership tetap dipertahankan sebagai histori read only.
- Notification baru tidak dibuat dari proses Close Project.
- Audit Trail mencatat User, Project, waktu, status lama, status baru, dan jumlah Document yang di-archive otomatis.

## Active Project Context

Jika Project yang sedang menjadi Active Project di-Closed:

```text
Close Project
-> Clear Active Project Context
-> Cari Project Active lain
-> Project Selection Gateway atau Dashboard No Active Project
```

Sistem tidak boleh otomatis memilih Project lain.

# End of BUSINESS-WORKFLOW.md

BUSINESS-WORKFLOW.md Version 1.0.0 telah selesai disusun dan menjadi dokumen induk (Master Source of Truth) untuk seluruh Business Workflow Engineering Document Management System (EDMS).

Seluruh perubahan pada Business Workflow di masa mendatang wajib dimulai dari dokumen ini sebelum diperbarui ke seluruh dokumentasi turunan.

---

# PHASE 2 SOURCE OF TRUTH SYNCHRONIZATION

Bagian ini menetapkan baseline Business Workflow resmi hasil rekonstruksi implementasi EDMS saat ini.

## Current Implementation

- Sistem runtime saat ini adalah aplikasi Frontend React dengan Fake API, mock JSON, IndexedDB, localStorage, Zustand, TanStack Query, React Hook Form, dan Zod.
- Product Module aktif adalah Dashboard, Document Register PFD, Document Register P&ID, SLA Monitoring, Escalation Alert, Audit Trail, Notification, User Management, Project Management, Project Membership, Profile, Change Password, serta Authentication Flow.
- Transmittal Incoming, Transmittal Outgoing, dan Storage NAS sudah ada pada route dan navigation sebagai placeholder, tetapi belum menjadi workflow operasional penuh.
- Multi Project sudah menjadi implementasi aktif. Active Project Context wajib tersedia untuk module project-scoped.
- Project yang dapat dipilih sebagai Active Project hanya Project berstatus `Active` dengan Membership berstatus `Active`.
- Project `Inactive` dan `Closed` tidak dapat menjadi Active Project.

## Official Document Workflow

Status workflow Document resmi:

- `Process Review`
- `Process Comment`
- `Process Reject`
- `Project Review`
- `Project Comment`
- `Project Reject`
- `Approved`

Lifecycle Document resmi:

- `Active`
- `Archived`

Revision stage resmi:

- `IFR-Submitted`
- `IFA-Submitted`
- `AS-Built`

Transisi Approval resmi:

| Status Saat Ini | Action | Status Baru | Penanggung Jawab Berikutnya |
|---|---|---|---|
| Process Review | Approval A | Project Review | Team Project |
| Process Review | Approval B | Process Comment | Document Owner |
| Process Review | Approval C | Process Reject | Document Owner |
| Project Review | Approval A | Approved | None |
| Project Review | Approval B | Project Comment | Document Owner |
| Project Review | Approval C | Project Reject | Document Owner |

Aturan resmi:

- Approval A berarti dokumen diteruskan atau disetujui.
- Approval B berarti dokumen dikembalikan dengan komentar. Comment wajib diisi. Attachment dapat ditambahkan sebagai pendukung.
- Approval C berarti dokumen ditolak. Jika comment kosong, sistem menggunakan alasan default `Document is not approved`.
- Upload Revision hanya tersedia dari status `Process Comment`, `Process Reject`, `Project Comment`, dan `Project Reject`.
- Upload Revision dari Process-side mengembalikan dokumen ke `Process Review`.
- Upload Revision dari Project-side mengembalikan dokumen ke `Project Review`.
- Dokumen `Approved` menghasilkan revision stage `AS-Built`.
- Archive hanya tersedia untuk Document `Approved` dengan lifecycle `Active`.
- Restore hanya tersedia untuk Document lifecycle `Archived` pada Project berstatus `Active`.
- Delete Document operasional tidak berlaku. Aksi resmi adalah Archive dan Restore.

## Project Workflow

- Project status resmi adalah `Active`, `Inactive`, dan `Closed`.
- Transisi resmi adalah `Active -> Inactive`, `Inactive -> Active`, dan `Active -> Closed`.
- Project `Closed` bersifat final.
- Close Project hanya dapat dilakukan oleh Admin dari Project Management.
- Close Project ditolak apabila masih ada Document dengan workflow aktif: `Process Review`, `Process Comment`, `Process Reject`, `Project Review`, `Project Comment`, atau `Project Reject`.
- Saat Project berhasil `Closed`, seluruh Document `Approved` dengan lifecycle `Active` diubah otomatis menjadi `Archived`.
- Project `Closed` tidak menghasilkan Notification baru dan tidak dapat menerima Restore Document.

## SLA, Escalation, Notification, dan Audit

- SLA dihitung dari `slaStartedAt`.
- SLA status resmi adalah `On Track`, `At Risk`, `Overdue`, dan `Final As-Built`.
- `At Risk` terjadi pada hari validasi. `Overdue` terjadi setelah hari validasi terlewati. `Approved` ditampilkan sebagai `Final As-Built`.
- Escalation Alert hanya berlaku untuk Document non-Approved yang `Overdue`.
- Escalation level resmi adalah Level 1, Level 2, Level 3, dan Level 4.
- Notification bersifat personal per recipient user dan project.
- Direct open Notification wajib memvalidasi user, membership, status project, dokumen, lifecycle, dan target module.
- Audit Trail mencatat Authentication, Document, Workflow, Attachment, Notification, Escalation, Project, User, Department, Archive, Restore, dan Project Close.

## Target Architecture

Database schema, REST API production, HttpOnly Cookie, dan NAS/Object Storage adalah target arsitektur produksi. Hingga backend tersedia, behaviour runtime resmi direpresentasikan oleh Service Layer Frontend, Fake API, IndexedDB, mock JSON, Zustand, TanStack Query, dan localStorage.

