# DECISION-LOG.md

Document Version: 1.0
Document Status: Frozen

---

## Document Information

| Property | Value |
|----------|-------|
| Document Name | DECISION-LOG.md |
| Version | 1.0 |
| Status | Active |
| Document Type | Decision Log |
| Project | Engineering Document Management System (EDMS) Rebuild |
| Owner | Product Owner |
| Maintainer | Solution Architect |

---

# Purpose

Dokumen ini merupakan bagian dari Reference Documents pada Project Documentation Hierarchy.

Dokumen ini tidak mendefinisikan requirement sistem dan tidak digunakan sebagai dasar penyusunan PRD.

Fungsi utamanya adalah mencatat alasan di balik setiap keputusan desain dan arsitektur yang telah disetujui selama pengembangan proyek.

---

# Rules

- Setiap keputusan harus memiliki nomor unik.
- Setiap keputusan harus berstatus Approved sebelum diterapkan.
- Perubahan terhadap keputusan yang sudah disetujui harus melalui Architecture Review.
- Dokumen ini tidak mendefinisikan requirement.
- Dokumen ini hanya menjelaskan alasan dan hasil keputusan.
- Penambahan dokumen baru pada proyek harus ditempatkan pada level yang sesuai dalam Project Documentation Hierarchy.

---

# DECISION-001

## Title

Project Documentation Hierarchy

### Status

Approved

### Decision

Seluruh dokumentasi proyek EDMS disusun berdasarkan **Project Documentation Hierarchy**.

Setiap dokumen memiliki tanggung jawab yang berbeda sesuai levelnya.

### Project Documentation Hierarchy

#### Level 0 — Project Inputs

Dokumen dan artefak yang menjadi sumber kebutuhan awal proyek.

- Client Requirements
- Approved UI Design Mockup

#### Level 1 — Foundation Documents (Primary Source of Truth)

Dokumen yang menjadi acuan utama (Primary Source of Truth) dalam mendefinisikan kebutuhan sistem.

- BUSINESS-WORKFLOW.md
- SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable)
- FEATURE-MAPPING.md (Historical Reference / Unavailable)

#### Level 2 — Core Design Documents

Dokumen yang diturunkan dari Foundation Documents dan digunakan sebagai acuan desain produk serta implementasi.

- PRD.md
- UI-GUIDELINES.md
- IMPLEMENTATION-PLAN.md

#### Level 3 — Supporting Documents

Dokumen yang mendukung implementasi teknis.

Contoh:

- FORM-SPEC.md
- COMPONENT-SPEC.md
- TABLE-SPEC.md
- ROUTING.md
- STATE-MANAGEMENT.md
- LOCAL-STORAGE-API.md (Historical Reference / Unavailable)
- API-CONTRACT.md
- ACCESS-CONTROL.md
- DESIGN-TOKENS.md
- ICON-SYSTEM.md
- FILE-STRUCTURE.md
- MOCK-DATA.md

Daftar Supporting Documents dapat bertambah sesuai kebutuhan proyek tanpa mengubah struktur utama Project Documentation Hierarchy.

#### Reference Documents

Dokumen yang mencatat keputusan, perubahan, serta histori pengembangan proyek.

Reference Documents tidak mendefinisikan requirement sistem dan tidak digunakan sebagai dasar implementasi langsung.

- CHANGE-REQUEST.md
- DECISION-LOG.md
- UI-CHANGELOG.md

### Reason

Memisahkan fungsi setiap dokumen sehingga:

- tidak terjadi duplikasi informasi,
- setiap dokumen memiliki tanggung jawab yang jelas,
- mempermudah Product Owner, Developer, dan AI (Codex) dalam memahami hubungan antar dokumen,
- struktur dokumentasi tetap scalable ketika jumlah dokumen bertambah.

### Impact

Seluruh dokumentasi proyek EDMS harus mengikuti Project Documentation Hierarchy.

Foundation Documents pada Level 1 merupakan Primary Source of Truth.

Seluruh Core Design Documents dan Supporting Documents harus disusun berdasarkan Foundation Documents sesuai Project Documentation Hierarchy.


---

# DECISION-002

## Title

UI Driven Module Naming

### Status

Approved

### Decision

Nama Module mengikuti nama menu yang dilihat oleh pengguna pada antarmuka aplikasi.

Contoh:

- Dashboard
- Document Register
- User Management
- SLA Monitoring

### Reason

Menghindari perbedaan istilah antara UI, PRD, dokumentasi, dan source code.

### Impact

- SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable)
- FEATURE-MAPPING.md (Historical Reference / Unavailable)
- PRD.md

---

# DECISION-003

## Title

Document Register Architecture

### Status

Approved

### Decision

Seluruh dokumen engineering dikelola melalui satu modul yaitu **Document Register**.

Kategori awal:

- PFD
- P&ID

Kategori baru dapat ditambahkan tanpa mengubah arsitektur utama aplikasi.

### Reason

Mendukung scalability dan mempermudah penambahan kategori dokumen di masa depan.

### Impact

- SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable)
- PRD.md

---

# DECISION-004

## Title

Sidebar Navigation Structure

### Status

Approved

### Decision

Sidebar mengikuti Business Feature, bukan struktur source code.

Contoh:

- Dashboard
- Document Register
- Transmittal
- SLA Monitoring
- Audit Trail
- Administration

### Reason

Navigasi harus mengikuti cara berpikir pengguna.

### Impact

- UI-GUIDELINES.md
- PRD.md

---

# DECISION-005

## Title

Permission Management

### Status

Approved

### Decision

Permission Management bukan menu Sidebar.

Permission dikelola melalui halaman Role Management.

### Reason

Mengikuti konsep Role Based Access Control (RBAC) dan menyederhanakan struktur navigasi.

### Impact

- SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable)
- PRD.md

---

# DECISION-006

## Title

Notification Module

### Status

Approved

### Decision

Notification merupakan Shared Services Module.

Notification bukan bagian dari Administration Domain.

### Reason

Notification digunakan oleh seluruh modul aplikasi.

### Impact

- SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable)
- UI-GUIDELINES.md

---

# DECISION-007

## Title

Storage NAS

### Status

Approved

### Decision

Storage NAS merupakan Shared Services Module.

Storage NAS bukan Business Feature dan dapat disembunyikan sesuai Role pengguna.

### Reason

Storage NAS digunakan sebagai utilitas untuk membantu administrator dan developer memverifikasi lokasi penyimpanan dokumen.

### Impact

- SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable)
- PRD.md

---

# DECISION-008

## Title

Capability Based Documentation

### Status

Approved

### Decision

SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable) hanya mendefinisikan kemampuan sistem (System Capability).

Dokumen ini tidak mendefinisikan:

- Layout
- Field
- Button
- Popup
- Validasi Form
- Warna
- Detail UI

### Reason

Menjaga pemisahan tanggung jawab antar dokumen.

### Impact

- SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable)
- PRD.md
- UI-GUIDELINES.md

---

# DECISION-009

## Title

User Profile Placement

### Status

Approved

### Decision

User Profile merupakan fitur akun pengguna.

Pada antarmuka aplikasi, User Profile ditempatkan pada User Menu (Avatar), bukan pada Sidebar Administration.

### Reason

Memisahkan fitur personal pengguna dari fitur administrasi sistem.

### Impact

- PRD.md
- UI-GUIDELINES.md

---

# DECISION-010

## Title

Future Scalability

### Status

Approved

### Decision

Arsitektur aplikasi harus mendukung:

- Penambahan kategori dokumen.
- Penambahan modul baru.
- Perubahan Business Workflow.
- Perubahan UI.

Tanpa mengubah fondasi utama sistem.

### Reason

Mengakomodasi kebutuhan client yang diperkirakan akan terus berkembang.

### Impact

- Seluruh proyek.

---

# DECISION-011

## Title

Temporary Acceptance of XLS/XLSX Preview Dependency Security Risk

### Status

Approved

### Decision

Aplikasi tetap menggunakan package `xlsx` versi `0.18.5` untuk mendukung Preview file Microsoft Excel `.xls` dan `.xlsx` pada Document Viewer.

Hasil audit dependency masih menunjukkan satu High Severity Vulnerability pada production dependency `xlsx`.

Package tersebut tetap digunakan sementara karena:

- belum tersedia versi patched melalui registry npm yang digunakan proyek,
- belum ditemukan library alternatif yang memenuhi kebutuhan Preview `.xls` dan `.xlsx` secara setara,
- implementasi Preview Spreadsheet telah memenuhi kebutuhan bisnis,
- penggantian library saat ini berisiko menyebabkan regression besar pada Document Viewer.

Keputusan ini merupakan penerimaan risiko sementara dan bukan pernyataan bahwa dependency tersebut sepenuhnya aman.

### Risk

Advisory yang teridentifikasi mencakup:

- Prototype Pollution.
- Regular Expression Denial of Service.

Dampak yang paling relevan adalah kemungkinan file Spreadsheet berbahaya memengaruhi runtime Preview atau menyebabkan browser pengguna mengalami hang.

### Mitigation

- Spreadsheet diproses hanya ketika User membuka Preview.
- Preview bersifat Read Only.
- Parsing dilakukan pada browser pengguna dan tidak memproses file pada server.
- File original tidak dimodifikasi.
- Upload tetap mengikuti validasi file existing.
- Aplikasi digunakan oleh User yang telah terautentikasi.

Pemrosesan pada browser mengurangi dampak terhadap server, tetapi tidak menghilangkan risiko terhadap browser pengguna apabila file berasal dari sumber yang tidak terpercaya.

### Review Trigger

Keputusan ini wajib dievaluasi kembali apabila:

- tersedia versi resmi `xlsx` yang telah memperbaiki advisory,
- tersedia library alternatif yang mendukung `.xls`, `.xlsx`, multi worksheet, dan formula cached result tanpa regression besar,
- aplikasi memasuki tahap deployment production,
- dilakukan security review atau penetration test.

### Impact

- Document Viewer.
- Frontend dependency.
- Frontend Freeze security review.
- Deployment readiness.

---

# End of Document

Dokumen ini merupakan catatan resmi seluruh keputusan desain dan arsitektur proyek EDMS.

Dokumen ini merupakan bagian dari Reference Documents pada Project Documentation Hierarchy.

DECISION-LOG.md bukan Primary Source of Truth, namun digunakan sebagai referensi resmi untuk memahami alasan di balik setiap keputusan desain dan arsitektur yang telah disetujui selama pengembangan proyek.

---

# PHASE 2 SOURCE OF TRUTH SYNCHRONIZATION

## Current Implementation Decisions

Keputusan yang menjadi baseline PHASE 2:

- Frontend runtime dengan Fake API dan local persistence menjadi executable reference sampai backend production tersedia.
- Multi Project dan Project Membership menjadi model resmi runtime.
- Official Role pada Membership digunakan untuk workflow project-scoped.
- System Role pada User digunakan untuk administrasi global dan backward compatibility permission.
- Delete Document deprecated dan diganti Archive/Restore.
- Route `/escalation-alert` menggantikan `/escalation`.
- Route administration runtime menggunakan `/user-management`, `/project-management`, dan `/project-membership`.
- Attachment workflow Approval B/C bukan revision file.
- `xlsx` tetap diterima sebagai dependency frontend development sesuai catatan security review yang sudah ada, tetapi wajib dievaluasi ulang menjelang production deployment.

---

# WAVE 1.1 CORE BUSINESS NORMALIZATION DECISIONS

Keputusan Product Owner berikut menjadi baseline resmi Core Business Source of Truth:

- Approval B mewajibkan Comment. Attachment bersifat optional dan tidak dapat menggantikan Comment.
- Approval B transition resmi adalah `Process Review -> Process Comment` dan `Project Review -> Project Comment`.
- Approval C memiliki Comment optional dan Attachment optional.
- Approval C transition resmi adalah `Process Review -> Process Reject` dan `Project Review -> Project Reject`.
- Terminologi resmi adalah `SLA Status` dengan value `On Track`, `At Risk`, `Overdue`, dan `Final As-Built`.
- Istilah `Done` deprecated sebagai business status dan hanya boleh digunakan sebagai display wording.
- Workflow selesai hanya ketika Workflow Status `Approved`.
- Document Lifecycle resmi adalah `Active` dan `Archived`.
- Workflow Status dan Document Lifecycle tidak boleh dicampur.
- Authorization selalu berdasarkan Official Role dan Project Membership.
- Current Assignee hanya digunakan untuk monitoring, Dashboard, SLA, Escalation, dan Notification Display.
- Current Product Scope terbaru menggantikan module inventory lama yang bertentangan.

---

# STORAGE ARCHITECTURE ALIGNMENT DECISION

Keputusan sebelum Manual UAT:

- `projects.id` tetap menjadi identity database, foreign key, permission, membership, dan API relation.
- `projects.project_code` menjadi physical project directory untuk permanent storage.
- Permanent revision file disimpan di `projects/{PROJECT_CODE}/documents/{DOCUMENT_NUMBER}/revisions/{REVISION}/`.
- Canonical revision directory memakai `IFR-Submitted`, `IFA-Submitted`, dan `AS-Built`.
- Revision tidak boleh dicampur dengan Workflow Status.
- Physical filename memakai `{DOCUMENT_NUMBER}_{REVISION}_{SUBMIT_DATE_YYYYMMDD}_{SHORT_FILE_ID}_{SANITIZED_ORIGINAL_FILE_NAME}`.
- Download filename tetap memakai `original_file_name`.
- Workflow attachment disimpan di `attachments/process-comments/` atau `attachments/project-comments/`, bukan di `revisions/`.
- `stored_files.storage_key` harus berupa relative key yang portable untuk local storage, NAS, dan Object Storage/R2.
- Development storage sedang bersih saat keputusan ini diterapkan, sehingga tidak diperlukan migration historical file.

---

# DAYS UNTIL VALIDATION SLA PATCH DECISION

Keputusan sebelum Manual UAT lanjutan:

- Label frontend tetap `TIMES FOR REVIEW`.
- Business term resmi tetap `Days Until Validation`.
- Backend field/API field tetap `daysUntilValidation`.
- Display read-only memakai formatter `0 -> Today`, `1 -> 1 Day`, dan `N -> N Days`.
- `daysUntilValidation = 0` adalah value valid, bukan empty value.
- Upload Revision boleh membawa metadata optional `description`, `area`, dan `daysUntilValidation` agar revision/update cycle memakai deadline terbaru.
- SLA evaluator membandingkan komponen hari pada SLA Timer terhadap `daysUntilValidation`.
- `At Risk` terjadi saat `slaTimer.days` sama dengan `daysUntilValidation`.
- `Overdue` terjadi otomatis saat `slaTimer.days` lebih besar dari `daysUntilValidation`.
- Untuk `daysUntilValidation = 0`, seluruh timer `0d ...` berada pada `At Risk`; status berubah menjadi `Overdue` saat timer memasuki hari berikutnya.
- Escalation Level 1 berlaku saat dokumen sudah `Overdue` dengan selisih hari minimal 1, lalu Level 2/3/4 tetap mengikuti threshold existing.

---

# NOTIFICATION RECIPIENT MATRIX PATCH DECISION

Keputusan sebelum Manual UAT lanjutan:

- `Document Uploaded`, `Revision Uploaded`, dan `Approval A Completed` tetap dikirim kepada current assignee sesuai workflow transition.
- `Document Approved` dikirim kepada seluruh Admin dan Document Owner aktif pada project terkait.
- `Approval B Completed` dikirim kepada seluruh Admin dan Document Owner aktif pada project terkait.
- `Approval C Completed` dikirim kepada seluruh Admin dan Document Owner aktif pada project terkait.
- Title `Approval C Completed` dibedakan berdasarkan reviewer: `Document Not Approved By Team Process` atau `Document Not Approved By Team Project`.
- `SLA At Risk` memakai title `SLA Warning`, priority `Medium`, dan tetap dikirim ke seluruh membership aktif role Admin, Document Owner, Team Process, dan Team Project pada project terkait.
- `SLA Overdue` tetap memakai title `SLA Overdue`, priority `High`, dan tetap dikirim ke seluruh membership aktif role Admin, Document Owner, Team Process, dan Team Project pada project terkait.
- Constraint priority notification menerima `Medium` untuk menyesuaikan PRD dan Message Dictionary.

---

# USERNAME IMMUTABILITY DECISION

Keputusan saat Manual UAT Authentication dan Administration:

- Username hanya ditentukan saat Create User.
- Setelah akun berhasil dibuat, Username menjadi immutable.
- Edit User tetap menampilkan Username sebagai referensi identitas akun, tetapi tidak dapat mengubah Username.
- Backend User Update tidak menerima perubahan Username melalui normal UI maupun manipulated API payload.
- Create User wajib menampilkan confirmation setelah form valid dan sebelum request create dikirim, dengan Username aktual yang akan dibuat.

---

# NOTIFICATION SUPPRESSION POLICY DECISION

Keputusan setelah PART 8 Notification menjadi Source of Truth:

- Notification SLA tidak lagi menggunakan SLA Cycle sebagai business suppression utama.
- `SLA Warning` hanya dibuat ketika SLA State berubah dari state selain `At Risk` menjadi `At Risk`.
- `SLA Overdue` hanya dibuat ketika SLA State berubah dari state selain `Overdue` menjadi `Overdue`.
- Evaluasi ulang pada state yang sama, termasuk setelah Upload Revision, Approval B/C, Workflow Restart, SLA Reset, scheduler tick, refresh, login ulang, dan page load, tidak membuat Notification SLA tambahan.
- SLA Cycle tetap dipertahankan untuk audit, tracing, reporting, metadata notification, dan concurrency guard.
- `identity_key` dan `INSERT IGNORE` tetap dipertahankan sebagai race-condition protection, tetapi bukan business suppression utama.
- Decision layer Notification wajib mengevaluasi Need Action, previous SLA state, current SLA state, dan suppression reason sebelum memanggil repository insert.

---

# REALTIME ARCHITECTURE DECISION

Keputusan sebelum implementasi Realtime Infrastructure (Stage 6):

- REST API tetap menjadi Command Channel dan sumber data final.
- Realtime (Server-Sent Events) hanya digunakan sebagai Event Channel untuk sinkronisasi data.
- Backend tetap menjadi Source of Truth untuk seluruh Business State.
- Browser tidak boleh menetapkan Business State.
- Browser hanya melakukan display projection seperti SLA Timer menggunakan Unified Time Authority.
- Event realtime hanya menjadi sinyal perubahan data dan tidak menjalankan Business Mutation.
- Frontend wajib melakukan Query Invalidation dan REST Refetch setelah menerima event realtime.
- Event hanya boleh dipublikasikan setelah Business Transaction berhasil di-commit.
- Kegagalan realtime tidak boleh membatalkan Business Transaction.
- Notification tetap mengikuti Notification Domain dan Message Dictionary.
- Workflow realtime wajib didahului oleh Optimistic Concurrency.
- Active Project menjadi batas utama ruang lingkup event realtime.
- In-memory Event Bus diperbolehkan selama deployment masih menggunakan satu backend instance.
- REALTIME-SCOPE-BEHAVIOUR-DECISION.md menjadi Source of Truth resmi seluruh implementasi Realtime Infrastructure.

---

# WORKFLOW CONCURRENCY HARDENING DECISION

Keputusan Stage 6.2 sebelum implementasi Realtime Workflow:

- Approval A/B/C wajib membawa expected workflow state dari frontend.
- Expected workflow state minimal terdiri dari `expectedWorkflowStatus` dan `expectedActiveRevisionId`.
- Backend wajib melakukan atomic conditional update terhadap workflow status dan active revision sebelum mencatat history, audit, notification, atau SLA reset.
- Current Assignee wajib menjadi bagian dari guard workflow agar action stale tidak menimpa hasil user lain.
- Jika expected state tidak lagi cocok dengan canonical database state, backend mengembalikan HTTP `409 Conflict` dengan code `WORKFLOW_CONFLICT` atau `REVISION_CONFLICT`.
- Frontend wajib menutup modal stale, melakukan refetch data terkait, dan menampilkan pesan bahwa dokumen telah diperbarui oleh pengguna lain.
- Optimistic Concurrency menjadi prasyarat resmi sebelum Workflow Realtime/SSE diaktifkan.

---

# CURRENT RUNTIME DOCUMENTATION ALIGNMENT DECISION

Keputusan setelah backend integration, storage hardening, realtime implementation, dan Priority 3 SQL optimization:

- Backend REST API, MySQL, HttpOnly Cookie/auth token flow, Local Storage driver, Cloudflare R2 driver, temporary upload pipeline, scheduler backend, dan SSE realtime adalah current runtime untuk scope yang sudah dimigrasikan.
- Fake API, mock JSON, IndexedDB business persistence, browser file storage, local workflow engine, local revision engine, dan local history builder tetap dipertahankan sebagai historical/frontend baseline dan tidak boleh dihapus dari dokumentasi lama tanpa alasan, tetapi harus diberi label Legacy / Historical Reference.
- `UPLOAD_MAX_FILE_SIZE_BYTES` default backend adalah `25 * 1024 * 1024` bytes dan dapat dioverride melalui env.
- Railway development saat ini meng-override `UPLOAD_MAX_FILE_SIZE_BYTES` menjadi `100 MB` agar selaras dengan UI upload.
- `UPLOAD_TEMPORARY_TTL_HOURS` default backend adalah `24` jam dan dapat dioverride melalui env.
- `STORAGE_DRIVER` mendukung `local` dan `r2`; R2 env wajib hanya ketika `STORAGE_DRIVER=r2`.
- Dashboard Priority 3C menggunakan dashboard-specific SQL aggregate/query path.
- SLA Monitoring Priority 3D menggunakan SLA-specific query path dan tidak lagi bergantung pada `listProjectDocumentRegister()`.
- Shared legacy method `listProjectDocumentRegister()` tetap tidak boleh diubah destruktif karena masih menjadi dependency Escalation Alert legacy path sampai Priority 3E diputuskan/diimplementasikan.
- Realtime event names `history.changed`, `sla.changed`, dan `escalation.changed` saat ini berstatus reserved apabila constant sudah tersedia tetapi producer runtime belum aktif.
