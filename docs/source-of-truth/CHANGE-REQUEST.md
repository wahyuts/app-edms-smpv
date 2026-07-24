
## CR-012

## Date

2026-07-18

## Request By

Client

## Priority

High

## Description

Approval C pada Workflow Approval harus menghasilkan status Reject agar berbeda secara bisnis dan visual dari Approval B.

Approval B tetap menghasilkan Status Comment.

Approval C menghasilkan:

- Process Reject dari Process Review.
- Project Reject dari Project Review.

## Impact

### Business Workflow

- Workflow Status resmi mencakup Process Reject dan Project Reject.
- Upload Revision dari Process Reject kembali ke Process Review.
- Upload Revision dari Project Reject kembali ke Project Review.
- Current Assignee untuk Process Reject dan Project Reject adalah Document Owner.
- Current Assignee tidak mengubah Permission Upload Revision.
- Admin tetap dapat melakukan Upload Revision sesuai Rule existing.

### Dashboard

- Jumlah KPI Card tetap enam.
- Card Process Comment berubah menjadi Process Comment / Reject.
- Card Project Comment berubah menjadi Project Comment / Reject.
- KPI gabungan menampilkan jumlah utama Comment + Reject serta rincian Comment : X dan Reject : Y.
- Klik KPI gabungan memfilter Document Register menggunakan status Comment OR Reject.

### UI

- Badge Process Reject dan Project Reject menggunakan token Danger.
- Badge Process Comment dan Project Comment menggunakan token Process / Amber Orange.

### Supporting Services

- SLA, Escalation, Notification, Audit Trail, Fake API, dan Mock Data harus mengenali Process Reject dan Project Reject sebagai Workflow Status resmi.

---

## CR-001

## Date

2026-07-11

## Request By

Client

## Priority

High

## Description

Pada proses Approval B dan Approval C, reviewer saat ini hanya dapat memberikan komentar dalam bentuk teks.

Client meminta agar reviewer dapat melampirkan file pendukung seperti PDF hasil markup, gambar, atau screenshot sebagai bagian dari Workflow Comment.

Attachment digunakan sebagai media pendukung review engineering dan bukan sebagai Upload Revision dokumen.

## Change Type (Tipe Masalahnya apa)

☑ UI

☑ Business

☑ Feature

☐ Bug Fix

☐ Performance

☐ Security

☐ Documentation

## Impact

### Business Workflow

- Approval B berubah menjadi:
  - Comment wajib.
  - Attachment optional.

Catatan normalisasi WAVE 1.1: aturan lama yang memperbolehkan Attachment menggantikan Comment dinyatakan superseded oleh Product Owner Decision DECISION-001.

- Approval C:
  - Comment tetap opsional.
  - Attachment juga opsional.

Workflow Approval tidak berubah.

### UI

- Approval B Modal
- Approval C Modal
- Comment Viewer

### Data

Workflow Comment mendukung **maksimal satu Attachment** untuk setiap Approval B atau Approval C.

Attachment:

- bukan Document Revision
- bukan Active File
- bukan Upload Revision
- menjadi bagian dari Workflow Comment

### Storage

Frontend:

- Menggunakan Local Persistence.

Backend:

- Akan menggunakan mekanisme Upload Service pada Sprint Backend Integration.

## Affected Modules

- Approval B Modal
- Approval C Modal
- Workflow Comment
- Comment Viewer
- Local Persistence

## Implementation

Sprint 8.5

## Status

Closed

---


## CR-002

## Date

2026-07-12

## Request By

Client

## Priority

Medium

## Description

Saat ini field Department pada Create User dan Edit User menggunakan daftar Department yang bersifat tetap (hardcoded).

Client meminta agar Admin dapat mengelola daftar Department secara mandiri, sehingga Admin dapat menambahkan Department baru sesuai kebutuhan organisasi tanpa melakukan perubahan kode aplikasi.

Department yang dibuat Admin akan langsung tersedia sebagai pilihan pada field Department ketika melakukan Create User maupun Edit User.

## Change Type (Tipe Masalahnya apa)

☑ UI

☑ Business

☑ Feature

☐ Bug Fix

☐ Performance

☐ Security

☐ Documentation

## Impact

### Business Workflow

Tidak ada perubahan terhadap Business Workflow.

Workflow Approval, Workflow Status, SLA, Escalation, Notification, maupun Document Lifecycle tetap mengikuti Business Workflow yang telah ada.

### UI

- User Management
- Create User Modal
- Edit User Modal
- Department Management

### Data

Department menjadi Master Data yang dikelola oleh Admin.

Department:

- tidak lagi menggunakan daftar hardcoded
- dapat ditambahkan oleh Admin
- dapat diubah oleh Admin
- menggunakan mekanisme Active / Inactive
- digunakan sebagai sumber data dropdown Department pada User Management

### Storage

Frontend:

- Menggunakan Local Persistence.

Backend:

- Akan menggunakan mekanisme Department Service pada Sprint Backend Integration.

## Affected Modules

- User Management
- Create User Modal
- Edit User Modal
- Department Management
- User Service
- Local Persistence

## Implementation

Sprint 9.5

## Status

Closed

---


## CR-003

## Date

2026-07-13

## Request By

Internal Design Decision

## Priority

Medium

## Description

Pada implementasi Notification saat ini, sistem dirancang mengirim Notification kepada Current Assignee.

Namun setelah implementasi Multi Project, satu Official Role dapat dimiliki oleh lebih dari satu User Account melalui Project Membership pada Project yang sama.

Contoh:

- Team Process
  - Andi
  - Anto
  - team.process

Dengan kondisi tersebut, sistem tidak dapat menentukan secara deterministik satu penerima Notification berdasarkan Official Role.

Sebagai solusi, Notification diubah menjadi **Role-Based Personal Notification Distribution**.

Setiap Business Event yang menghasilkan Need Action akan membuat Notification personal untuk **seluruh User Account Active yang memiliki Project Membership Active dengan Official Role penerima Workflow pada Project terkait**.

Setiap User memiliki Notification Record, Read Status, dan Notification Counter masing-masing.

## Change Type (Tipe Masalahnya apa)

☑ Business

☑ Feature

☑ Documentation

☐ UI

☐ Bug Fix

☐ Performance

☐ Security

## Impact

### Business Workflow

Workflow Status, Workflow Transition, SLA, Escalation, maupun Document Lifecycle tidak berubah.

Perubahan hanya terjadi pada mekanisme distribusi Notification.

Notification:

- tidak lagi dikirim kepada satu Current Assignee
- dikirim kepada seluruh User Account Active yang memiliki Project Membership Active dengan Official Role penerima pada Project terkait
- setiap User memiliki Notification sendiri
- setiap User memiliki Read Status sendiri
- setiap User memiliki Notification Counter sendiri

### UI

Tidak ada perubahan layout UI.

Halaman Notification tetap menggunakan tampilan yang telah disetujui.

Perubahan hanya memengaruhi data yang ditampilkan.

### Data

Notification menjadi Personal Notification.

Setiap Notification memiliki:

- Recipient User ID
- Read Status
- Read At

Read Status tidak dibagikan antar User Account.

Notification Counter dihitung berdasarkan Notification milik Current User.

### Storage

Frontend:

- Menggunakan Local Persistence.

Backend:

- Akan menggunakan Notification Service pada Sprint Backend Integration.

## Affected Modules

- Notification Service
- Notification Repository
- Notification Page
- Notification Counter
- Workflow Notification
- Escalation Notification
- Local Persistence

## Implementation

Sprint 11

## Status

Closed

---


## CR-004

## Date

2026-07-13

## Request By

Client

## Priority

High

## Description

Saat ini Engineering Document Management System (EDMS) hanya mendukung pengelolaan dokumen untuk **satu Project (Single Project Scope)**.

Client meminta agar satu aplikasi EDMS dapat digunakan untuk mengelola **banyak Project (Multi Project)** tanpa perlu membuat aplikasi atau database yang terpisah.

Setiap Project memiliki kumpulan Document, Workflow, SLA, Escalation, Notification, dan Audit Trail yang terisolasi satu sama lain, namun tetap menggunakan Business Workflow yang sama.

Seluruh Workflow Approval A/B/C, Official Role (Document Owner, Team Process, Team Project), SLA Monitoring, Escalation Alert, Notification, dan Audit Trail tetap mengikuti mekanisme yang telah disetujui sebelumnya.

Perubahan ini hanya menambahkan konsep **Project Context** sehingga pengguna dapat memilih Project yang sedang dikerjakan dan seluruh data aplikasi akan mengikuti Project tersebut.

## Change Type (Tipe Masalahnya apa)

☑ UI

☑ Business

☑ Feature

☑ Documentation

☐ Bug Fix

☐ Performance

☐ Security

## Impact

### Business Workflow

Business Workflow utama tidak berubah.

Perubahan yang terjadi adalah penambahan langkah sebelum pengguna mulai bekerja, yaitu memilih **Active Project**.

Seluruh proses berikut tetap mengikuti Workflow yang telah ada:

- Document Register
- Workflow Approval A/B/C
- SLA Monitoring
- Escalation Alert
- Notification
- Audit Trail

Setiap aktivitas hanya berlaku pada Project yang sedang aktif.

### UI

- Top Navigation
- Project Selector
- Dashboard
- Document Register
- SLA Monitoring
- Escalation Alert
- Notification
- Audit Trail
- Administration

### Data

Seluruh data operasional menjadi berbasis Project.

Setiap Project memiliki data yang terisolasi, meliputi:

- Documents
- Document Revision
- Workflow
- Workflow Comment
- SLA
- Escalation
- Notification
- Audit Trail

User Account tetap bersifat global dan dapat menjadi anggota lebih dari satu Project sesuai hak akses yang diberikan.

Create Project membuat Initial Project Membership untuk Creator Project dengan Official Role Admin dan Membership Status Active agar Project baru langsung dapat diakses oleh pembuatnya.

Project Membership Management mengelola assignment User ke Project, Official Role per Project, lifecycle Active/Inactive, validasi duplicate Membership untuk kombinasi Project dan User, serta pencatatan Audit Trail untuk Membership Created, Membership Updated, Membership Activated, dan Membership Deactivated.

Data User yang digunakan Project Membership Management wajib tersinkronisasi dengan User Management. Setelah User dibuat, diedit, diaktifkan, atau dinonaktifkan, cache User dan cache Project Membership yang menampilkan informasi User wajib diperbarui atau di-invalidate sehingga Assign User menggunakan daftar User Active terbaru tanpa browser refresh.

Legacy User Membership Migration menambahkan Project Membership satu kali untuk User Account yang sudah tersedia sebelum Multi Project, belum memiliki Project Membership apa pun, memiliki Official Role legacy yang valid, dan memiliki User Status yang dapat dipetakan. Migration hanya berjalan pada runtime legacy yang masih memiliki APP EDMS Baseline Project, tidak membuat Project otomatis pada clean bootstrap baseline, tidak memberikan akses otomatis ke Project lain, dan tidak berlaku untuk User Account baru.

Administration tetap dapat diakses berdasarkan Role dan Permission walaupun Active Project belum tersedia. No Project Access State hanya memblokir Project-Scoped Module seperti Dashboard, Document Register, SLA Monitoring, Escalation Alert, Notification Project-Scoped, dan Audit Trail Project-Scoped.

Ketika Active Project tersedia, Official Role operasional berasal dari Active Project Membership milik Current User. Role tersebut digunakan sebagai Active Official Role untuk My Profile, Project-Scoped Authorization, Create Document, Workflow Action berdasarkan Responsible Role, Current Assignee Resolution, Notification Recipient Resolution, dan Audit Trail Project-Scoped Actor Context. Legacy Official Role pada User Account hanya digunakan untuk backward compatibility dan Legacy User Membership Migration, serta tidak boleh mengoverride Project Membership setelah Membership tersedia.

Workflow Action divalidasi berdasarkan Project Membership Active pada Project yang sama dan Official Role yang sesuai Responsible Role. Current Assignee tetap digunakan untuk monitoring, SLA, Escalation, Dashboard, Notification, dan Reporting.

Comment Viewer menampilkan nama User beserta Official Role yang tersimpan pada Workflow Comment agar histori aktivitas tetap merepresentasikan kapasitas User saat komentar dibuat.

User Management hanya mengelola User Identity, Department, Status, dan Credential awal. Official Role tidak lagi ditampilkan, dibuat, atau diubah melalui User Management. Project Membership menjadi Single Source of Truth untuk assignment Official Role operasional pada setiap Project.

Document ID tetap unik secara global sebagai identifier internal sistem. Document Number bersifat unik dalam scope Project dan boleh digunakan kembali pada Project lain. Validasi duplicate Document Number wajib menggunakan kombinasi Project ID dan Document Number agar Project Data Isolation tetap konsisten.

### Storage

Frontend:

- Menggunakan Local Persistence dengan Project Context.

Backend:

- Akan menggunakan Project Service dan Project Membership Service pada Sprint Backend Integration.

## Affected Modules

- Dashboard
- Project Selector
- Document Register
- Workflow
- SLA Monitoring
- Escalation Alert
- Notification
- Audit Trail
- User Management
- Project Management (New)
- Project Membership (New)
- Local Persistence

## Implementation

Sprint 14–16

## Status

Closed

---



## CR-005

## Date

2026-07-16

## Request By

Client

## Priority

High

## Description

Client meminta fitur **Reset All Demo Data** sebagai Developer / Demo Utility untuk menghapus seluruh runtime persisted demo data dan mengembalikan aplikasi ke kondisi bootstrap kosong.

Setelah reset berhasil, sistem hanya mempertahankan satu User Account berikut:

```text
Username: wahyuts
Official Role: Admin
Status: Active
```

Akun `wahyuts` menjadi **Protected Bootstrap Admin Account** untuk memulai konfigurasi sistem dari awal.

## Change Type (Tipe Masalahnya apa)

☑ UI

☑ Feature

☑ Security

☑ Documentation

☐ Bug Fix

☐ Performance

☐ Business

## Impact

### Business Workflow

Tidak ada perubahan terhadap Business Workflow.

Workflow Approval A/B/C, SLA, Escalation, Notification Rules, Audit Trail Activity Dictionary, Document Lifecycle, dan Project Membership behaviour tetap mengikuti Business Workflow yang telah ada.

Fitur Reset All Demo Data merupakan Developer / Demo Utility dan bukan Business Feature.

### UI

- User Management
- Administration
- Confirmation Modal

Tombol **Reset All Demo Data** hanya ditampilkan untuk Admin dengan Permission administrasi yang sesuai dan hanya apabila feature flag reset demo aktif.

Confirmation Modal wajib menjelaskan bahwa:

- Seluruh data demo akan dihapus permanen.
- Seluruh Project akan dihapus.
- Seluruh User selain `wahyuts` akan dihapus.
- Seluruh Document dan aktivitas sistem akan dihapus.
- Proses tidak dapat dibatalkan.
- Hanya akun Admin `wahyuts` yang dipertahankan.

Admin wajib mengetik teks berikut secara persis sebelum tombol Confirm Reset aktif:

```text
RESET ALL DEMO DATA
```

### Data

Reset menghapus seluruh runtime persisted demo data selain dependency minimum akun `wahyuts`.

Data yang dihapus meliputi:

- Seluruh User selain `wahyuts`
- Seluruh credential User lain
- Seluruh Department demo selain Department minimum akun `wahyuts`
- Seluruh Project
- Seluruh Project Membership
- Seluruh Document
- Seluruh Revision
- Seluruh Document History dan Timeline
- Seluruh Workflow Comment dan Workflow Attachment
- Seluruh SLA data
- Seluruh Escalation data
- Seluruh Notification
- Seluruh Audit Trail demo
- Seluruh Project Context persistence
- Seluruh file upload runtime
- Seluruh stale cache terkait data demo

Data yang dipertahankan:

- User ID existing akun `wahyuts`
- Name
- Username
- Email
- Password dan authentication credential existing
- User Status Active
- Official Role Admin
- Permission Admin melalui fixed Role / Permission catalog
- Department minimum yang digunakan akun `wahyuts`
- Static configuration
- Source Mock / Seed Definition

Reset tidak membuat ulang akun `wahyuts`, tidak mengganti password, tidak mengubah username, tidak mengubah email, dan tidak membuat Project Membership otomatis.

Source credential pada Mock JSON hanya digunakan untuk fresh installation. Jika akun `wahyuts` telah mengganti password melalui Change Password, Reset All Demo Data wajib mempertahankan credential runtime terbaru dan tidak mengembalikan password ke nilai source baseline.

Jika akun `wahyuts` tidak ditemukan, duplicate, Inactive, bukan Admin, tidak memiliki credential, atau Department dependency tidak valid, reset wajib dihentikan sebelum data dihapus.

### Storage

Frontend:

- Menggunakan Local Persistence existing.
- Reset dilakukan sebagai safe replacement dalam satu operasi terkontrol.
- TanStack Query cache dibersihkan.
- Project Context runtime dibersihkan.
- Active Project persistence dibersihkan.
- Session current user dibersihkan.
- User diarahkan ke Login setelah reset berhasil.

Backend:

- Akan menggunakan Service Layer, Repository, Transaction, dan Authorization existing pada Sprint Backend Integration.
- Endpoint reset harus tetap dilindungi feature flag dan Admin Permission.

### Environment

Fitur hanya aktif apabila configuration / environment flag reset demo aktif.

Contoh:

```text
ENABLE_DEMO_RESET=true
```

Apabila flag tidak aktif:

- Tombol tidak ditampilkan.
- Confirmation Modal tidak dapat dibuka.
- Service reset menolak eksekusi.
- Reset tidak dapat dipanggil melalui manipulasi UI, route, maupun function call manual.

Production Environment tidak boleh mengaktifkan fitur ini tanpa feature flag yang sah.

## Affected Modules

- User Management
- Department Management
- Project Management
- Project Membership
- Authentication
- Project Context
- Document Register
- Workflow Comment
- Revision
- SLA Monitoring
- Escalation Alert
- Notification
- Audit Trail
- Local Persistence
- Application Cache
- Session Management

## Implementation

Sprint 17

## Status

Approved

---

# PHASE 2 SOURCE OF TRUTH SYNCHRONIZATION

## Current Implementation Consolidation

Change Request yang sudah menjadi implementasi aktif:

- Multi Project dan Project Isolation.
- Active Project Selector.
- Project Membership dengan Official Role.
- Archive/Restore menggantikan Delete Document.
- Project Close final state.
- Forgot Password dan Reset Password simulation.
- Notification direct open validation.
- SLA transition notification dan Escalation Alert.

Bagian Change Request lama yang menyebut Single Project adalah historical background, bukan current implementation. Runtime resmi saat ini adalah Multi Project.

Delete Document adalah historical/deprecated requirement dan tidak boleh digunakan sebagai dasar implementasi UI operasional.


## CR-006

## Date

2026-07-17

## Request By

Client

## Priority

Medium

## Description

Client meminta seluruh KPI Card pada Dashboard dapat diklik dan digunakan sebagai Workflow Status Filter untuk Document Register Table pada Active Project yang sama.

KPI Card tetap menampilkan perhitungan yang sudah ada dan tidak mengubah Business Workflow, Workflow Status, SLA, Escalation, Notification, Audit Trail, Project Membership, maupun Permission.

## Change Type (Tipe Masalahnya apa)

☑ UI

☐ Business

☑ Feature

☐ Bug Fix

☐ Performance

☑ Documentation

## Impact

### Dashboard

- KPI Card Dashboard menjadi interactive shortcut untuk Filter Status Document Register.
- KPI Card yang aktif harus memiliki active state yang jelas.
- Total Documents berfungsi sebagai All Status dan menghapus Filter Status.

### Document Register

- Filter Status Document Register menjadi single source of truth bersama KPI Card Dashboard.
- Klik KPI Card memperbarui Filter Status.
- Perubahan Filter Status memperbarui active KPI Card.
- Pagination kembali ke halaman pertama ketika Filter Status berubah.

### Project Context

- Filter hanya berlaku dalam Active Project yang sedang aktif.
- Perubahan Active Project memuat ulang KPI dan Document Register berdasarkan Project baru.
- Status Filter yang masih relevan dapat dipertahankan pada Project baru.

### Search, Filter, Sort, Pagination

- Search tetap bekerja di atas hasil Status Filter.
- Filter lain, sort, dan page size tetap dapat digunakan bersama Status Filter.
- Hasil filtering dihitung dari seluruh data Active Project sebelum pagination.

## Affected Modules

- Dashboard
- KPI Card
- Document Register Table
- Filter Status
- Active Project
- Project Context
- Pagination
- Source of Truth Documentation

## Implementation

Sprint 18

## Status

Approved

---


## CR-007

## Date

2026-07-17

## Request By

Client

## Priority

Medium

## Description

Client meminta peningkatan visibilitas Active Project pada Header agar User langsung memahami Project aktif setelah Login sebelum melakukan pekerjaan operasional.

Header juga perlu menampilkan nama User beserta Role aktif dari Active Project Membership, serta mengganti tombol teks Notification menjadi icon lonceng dengan unread badge.

## Change Type (Tipe Masalahnya apa)

â˜‘ UI

â˜ Business

â˜ Feature

â˜ Bug Fix

â˜ Performance

â˜‘ Documentation

## Impact

### Business Workflow

Tidak ada perubahan terhadap Business Workflow.

Workflow Approval A/B/C, Project Membership, Project Access, Permission, Notification Rules, Project Data Isolation, Dashboard, Document Register, SLA, Escalation, dan Audit Trail tetap mengikuti Source of Truth yang telah ada.

### UI

- Active Project menjadi elemen utama pada Header.
- Project Selector menampilkan label `ACTIVE PROJECT`.
- Project Name dan Project Code selalu terlihat pada selector.
- User area menampilkan nama User dan label `Role`.
- Role yang ditampilkan berasal dari Active Project Membership.
- Notification menggunakan icon lonceng dan unread badge.
- Urutan Header kanan adalah Project â†’ User + Role â†’ Notification.
- Desktop layout tetap horizontal.

### Data

Tidak ada struktur data baru.

Active Project tetap berasal dari Project Context.

Role aktif tetap berasal dari Active Project Membership.

Unread badge tetap berasal dari Notification Counter milik Current User pada Active Project.

### Storage

Tidak ada perubahan storage.

Frontend tetap menggunakan Project Context Store, Auth current user, dan Notification Counter existing.

Backend tidak terdampak.

## Affected Modules

- Top Navigation
- Active Project Selector
- Project Context
- Project Membership
- Active Official Role
- User Profile Dropdown
- Notification Button
- Notification Counter
- Responsive Header

## Implementation

Sprint 18

## Status

Approved

---


## CR-008

## Date

2026-07-17

## Request By

Client

## Priority

High

## Description

Setelah Login berhasil, User dengan minimal satu Project Active yang dapat diakses tidak langsung masuk ke Dashboard.

User terlebih dahulu diarahkan ke halaman **Select Active Project** untuk memilih dan mengonfirmasi Project yang akan digunakan sebelum masuk ke Workspace EDMS.

Project terakhir yang pernah dipilih boleh menjadi default selected, tetapi User tetap harus menekan tombol `Continue to Dashboard`.

## Change Type (Tipe Masalahnya apa)

[x] UI

[x] Business

[x] Feature

[ ] Bug Fix

[ ] Performance

[ ] Security

[x] Documentation

## Impact

### Business Workflow

Tidak ada perubahan terhadap Business Workflow Document, Approval, SLA, Escalation, Notification, maupun Audit Trail.

CR ini hanya menambahkan Project Selection Gateway setelah Authentication Success agar User sadar terhadap Active Project sebelum masuk Dashboard.

### UI

- Login Flow
- Select Active Project Page
- Active Project Selector
- Header Active Project Synchronization

### Data

Active Project tetap disimpan menggunakan mekanisme Project Context existing.

Dashboard, Notification, Audit Trail, SLA, Escalation, Workflow, dan Document tetap mengikuti Active Project yang dipilih.

### Routing

Route baru:

```text
/select-project
```

Route menggunakan Authentication Layout, memerlukan Login, tidak menampilkan Sidebar, dan hanya muncul pada flow Login apabila User memiliki minimal satu Project Active.

## Affected Modules

- Authentication
- Login Flow
- Project Context
- Active Project
- Project Membership
- Active Role Resolver
- Dashboard Routing
- Header Project Selector
- Protected Route
- No Project Access
- User Session

## Implementation

Sprint 18.1

## Status

Approved

---



## CR-009

## Date

2026-07-17

## Request By

Client

## Priority

High

## Description

Delete Document pada operasional EDMS diganti menjadi **Archive Document**.
Archive merupakan perubahan Document Lifecycle dari Active menjadi Archived, bukan permanent delete.
Restore mengembalikan Lifecycle menjadi Active tanpa mengubah Workflow Status.

## Change Type (Tipe Masalahnya apa)

[x] UI

[x] Business

[x] Feature

[ ] Bug Fix

[ ] Performance

[x] Security

[x] Documentation

## Impact

### Business Workflow

Workflow Status tetap tidak berubah.
Document Lifecycle ditambahkan sebagai konsep terpisah dari Workflow Status dengan nilai Active dan Archived.
Archive hanya dapat dilakukan Admin pada Document Approved.
Restore tidak mengulang Approval dan menjaga Workflow Status tetap Approved.

### UI

- PFD Register
- P&ID Register
- Actions Column
- Archive Confirmation Dialog
- Lifecycle Filter Admin

### Data

Archived Document tetap berada pada dataset Document yang sama.
Revision History, Workflow History, Audit Trail, Viewer, Download, file, dan relasi Document tetap dipertahankan.
Dashboard KPI, SLA, Escalation, dan operasional normal hanya menghitung Lifecycle Active.

### Audit Trail

Archive menghasilkan Audit Trail **Document Archived**.
Restore menghasilkan Audit Trail **Document Restored**.

## Affected Modules

- Document Register
- PFD Register
- P&ID Register
- Permission
- Audit Trail
- Dashboard KPI
- SLA
- Escalation
- Mock Data
- Source of Truth

## Implementation

Sprint 18.2

## Status

Approved

---


## CR-010

## Date

2026-07-17

## Request By

Client

## Priority

Medium

## Description

Document Register PFD dan P&ID menampilkan kolom **Created Date** agar User mengetahui tanggal pertama kali Document didaftarkan ke EDMS.

## Change Type (Tipe Masalahnya apa)

[x] UI

[ ] Business

[x] Feature

[ ] Bug Fix

[ ] Performance

[ ] Security

[x] Documentation

## Impact

### Business Workflow

Tidak ada perubahan terhadap Workflow, Approval, Revision, History, Audit Trail, Notification, SLA, Escalation, atau Dashboard.

### UI

- PFD Register
- P&ID Register
- Document Register Table

### Data

Created Date menggunakan field Document existing yang merepresentasikan tanggal pertama kali Document dibuat.
Tidak ada timestamp baru dan tanggal pembuatan Document tidak diubah.

### Dashboard

Dashboard tidak berubah.

## Affected Modules

- Document Register
- PFD Register
- P&ID Register
- Mock Data
- Source of Truth

## Implementation

Sprint 18.3

## Status

Approved

---

## CR-011

## Date

2026-07-18

## Request By

Client

## Priority

High

## Description

Forgot Password ditingkatkan dari flow Username-only menjadi flow berbasis Username dan Registered Email.

Setelah request diproses, sistem selalu menampilkan generic response agar tidak mengungkapkan apakah Username tersedia, Email benar, Account inactive, atau kombinasi data valid.

Password Reset hanya dapat dilanjutkan melalui Reset Link dengan Mock Token pada Frontend Simulation. Token berlaku 15 menit, hanya dapat digunakan sekali, dan token aktif lama untuk account yang sama dinonaktifkan ketika request valid baru dibuat.

Development Mock Mailbox tersedia hanya ketika feature flag `VITE_ENABLE_MOCK_EMAIL=true`. Email Delivery sungguhan, secure token production, password hashing backend, rate limiting production, session invalidation backend, dan transactional email menunggu Backend Integration.

## Change Type (Tipe Masalahnya apa)

[x] UI

[ ] Business

[x] Feature

[ ] Bug Fix

[ ] Performance

[x] Security

[x] Documentation

## Impact

### Authentication Recovery

- Forgot Password menggunakan Username dan Registered Email.
- Request selalu menghasilkan generic response.
- Reset Password tidak dapat dilakukan hanya berdasarkan Username atau Email.
- Reset Password membutuhkan token dari Reset Link.
- Token memiliki status Valid, Expired, Used, dan Invalid.

### Development Simulation

- Fake API membuat Mock Token dan Mock Email hanya untuk kombinasi account valid.
- Mock Mailbox hanya dirender ketika `VITE_ENABLE_MOCK_EMAIL=true`.
- Production guard tidak menyediakan shortcut reset langsung di browser ketika feature flag false.

### Backend Integration

- UI flow disiapkan agar kompatibel dengan REST API dan transactional email.
- Backend nanti wajib menangani secure random token, token hash storage, expiration, single use, revocation, password hashing, rate limiting, HTTPS, session invalidation, security audit, dan no token logging.

## Affected Modules

- Forgot Password
- Check Your Email
- Development Mock Mailbox
- Mock Email Detail
- Reset Password
- Authentication Service
- Local Persistence
- Routing
- Environment Configuration
- Source of Truth

## Implementation

Sprint 18.4

## Status

Approved

---


