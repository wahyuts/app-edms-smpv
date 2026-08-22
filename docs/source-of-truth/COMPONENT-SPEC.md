# ==============================================================================
# PART 1 — Introduction
# ==============================================================================

## 1.1 Document Information

| Property | Value |
|----------|-------|
| Document Name | COMPONENT-SPEC.md |
| Version | 1.0.0 |
| Status | Draft |
| Document Level | Supporting Technical Document |
| Project | Engineering Document Management System (EDMS) Rebuild |
| Owner | Product Owner |
| Primary Consumers | Frontend Developer, UI Developer, QA Engineer, AI Coding Agent |

---

## 1.2 Purpose

COMPONENT-SPEC.md merupakan dokumen yang mendefinisikan spesifikasi seluruh komponen antarmuka (UI Components) yang digunakan pada Engineering Document Management System (EDMS) Rebuild.

Dokumen ini menjadi acuan implementasi komponen frontend agar seluruh halaman dibangun menggunakan komponen yang konsisten, reusable, mudah dipelihara, dan sesuai dengan standar arsitektur proyek.

COMPONENT-SPEC.md tidak mendefinisikan kebutuhan bisnis, alur proses bisnis, maupun desain halaman secara keseluruhan. Seluruh pembahasan difokuskan pada spesifikasi komponen antarmuka yang akan digunakan pada implementasi aplikasi.

---

## 1.3 Objectives

Dokumen ini disusun dengan tujuan sebagai berikut.

- Mendefinisikan standar seluruh UI Component yang digunakan pada aplikasi.
- Menjadi referensi implementasi komponen React yang reusable.
- Menjaga konsistensi tampilan dan perilaku komponen pada seluruh modul.
- Mengurangi duplikasi implementasi komponen.
- Mempermudah proses pengembangan, pengujian, dan pemeliharaan antarmuka.
- Menjadi referensi AI Coding Agent dalam membangun komponen aplikasi.

---

## 1.4 Scope

COMPONENT-SPEC.md hanya mencakup spesifikasi komponen antarmuka (UI Components).

Ruang lingkup dokumen ini meliputi:

- Layout Components
- Navigation Components
- Data Display Components
- Form Components
- Workflow Components
- Feedback Components
- Overlay Components
- Shared Components
- Component Composition
- Component Rules
- Component Acceptance Criteria

Dokumen ini tidak membahas:

- Business Workflow
- Product Requirement
- Database Design
- Backend API
- State Management
- Routing
- Hak akses pengguna
- Business Rules

Topik-topik tersebut dijelaskan pada dokumen lain sesuai Project Documentation Hierarchy.

---

## 1.5 Target Users

Dokumen ini digunakan oleh:

- Product Owner
- Solution Architect
- UI/UX Designer
- Frontend Developer
- QA Engineer
- AI Coding Agent

---

## 1.6 Relationship with Other Documents

COMPONENT-SPEC.md merupakan Supporting Technical Document yang disusun berdasarkan Core Design Documents dan Foundation Documents.

Urutan referensi dokumen adalah sebagai berikut.

```text
Approved UI Design Mockup
            │
            ▼
BUSINESS-WORKFLOW.md
(Behaviour Reference Only)
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
UI-GUIDELINES.md
            │
            ▼
ENGINEERING-FOUNDATION.md
            │
            ▼
IMPLEMENTATION-PLAN.md
            │
            ▼
COMPONENT-SPEC.md
```

COMPONENT-SPEC.md menerjemahkan kebutuhan produk dan desain antarmuka menjadi spesifikasi komponen frontend yang siap diimplementasikan.

---

## 1.7 Source of Truth

Penyusunan COMPONENT-SPEC.md menggunakan referensi berikut.

| Document | Purpose |
|----------|----------|
| PRD.md | Menentukan kebutuhan fitur yang memerlukan komponen |
| UI-GUIDELINES.md | Menentukan struktur visual, perilaku UI, dan pola interaksi |
| ENGINEERING-FOUNDATION.md | Menentukan standar implementasi frontend dan arsitektur komponen |
| IMPLEMENTATION-PLAN.md | Menentukan prioritas implementasi komponen |
| Approved UI Design Mockup | Menentukan bentuk visual komponen |
| BUSINESS-WORKFLOW.md | Referensi perilaku komponen yang dipengaruhi workflow (Behaviour Reference Only) |

Apabila terjadi konflik referensi maka prioritas yang digunakan adalah:

1. Approved UI Design Mockup
2. PRD.md
3. UI-GUIDELINES.md
4. ENGINEERING-FOUNDATION.md
5. IMPLEMENTATION-PLAN.md
6. BUSINESS-WORKFLOW.md (Behaviour Reference Only)

---

## 1.8 Component Principles

Seluruh komponen pada EDMS Rebuild wajib mengikuti prinsip berikut.

### CPS-001 — Reusable

Komponen harus dapat digunakan kembali pada berbagai halaman tanpa perubahan implementasi utama.

---

### CPS-002 — Modular

Setiap komponen memiliki satu tanggung jawab utama (Single Responsibility).

---

### CPS-003 — Consistent

Seluruh tampilan, perilaku, spacing, typography, warna, ikon, dan interaksi harus konsisten pada seluruh aplikasi.

---

### CPS-004 — Composable

Komponen dapat dikombinasikan untuk membentuk halaman yang lebih kompleks tanpa mengubah perilaku dasar masing-masing komponen.

---

### CPS-005 — Responsive

Seluruh komponen wajib mendukung Desktop, Tablet, dan Mobile sesuai UI Guidelines.

---

### CPS-006 — Accessible

Komponen harus mempertimbangkan aksesibilitas seperti keyboard navigation, focus state, dan semantic HTML.

---

### CPS-007 — Predictable

Perilaku komponen harus konsisten sehingga menghasilkan pengalaman pengguna yang mudah dipahami.

---

### CPS-008 — Business Workflow Agnostic

Komponen tidak diperbolehkan mengandung logika Business Workflow.

Workflow hanya menentukan data atau status yang ditampilkan oleh komponen, bukan implementasi komponen itu sendiri.

---

## 1.9 Component Architecture Philosophy

Engineering Document Management System (EDMS) Rebuild menggunakan pendekatan **Component-Driven Architecture**.

Setiap halaman dibangun dari kumpulan komponen kecil yang memiliki tanggung jawab tunggal.

Halaman (Page) berfungsi sebagai penyusun (Composer) dari berbagai komponen tersebut, sedangkan setiap komponen hanya bertanggung jawab terhadap tampilan dan perilaku antarmuka.

Pendekatan ini memberikan keuntungan sebagai berikut.

- Konsistensi tampilan pada seluruh aplikasi.
- Reusability yang tinggi.
- Kemudahan pengembangan fitur baru.
- Kemudahan pemeliharaan kode.
- Kemudahan pengujian komponen secara mandiri.
- Skalabilitas aplikasi yang lebih baik.

---

## 1.10 Implementation Principles

Dokumen ini mengikuti prinsip implementasi berikut.

- Tidak mendefinisikan Business Workflow.
- Tidak mendefinisikan Product Requirement.
- Tidak mendefinisikan Business Rules.
- Tidak mendefinisikan struktur Routing.
- Tidak mendefinisikan State Management.
- Tidak mendefinisikan API Contract.
- Tidak mendefinisikan struktur Database.
- Hanya mendefinisikan spesifikasi UI Component yang digunakan pada implementasi frontend.

Seluruh implementasi komponen wajib mengikuti teknologi dan standar yang telah ditetapkan pada ENGINEERING-FOUNDATION.md.

---

## 1.11 Expected Outcome

Setelah COMPONENT-SPEC.md selesai disusun, proyek EDMS Rebuild akan memiliki standar resmi mengenai seluruh komponen antarmuka yang digunakan pada aplikasi.

Dokumen ini menjadi referensi utama bagi Frontend Developer dan AI Coding Agent dalam membangun komponen yang konsisten, reusable, dan sesuai dengan desain produk tanpa mengubah kebutuhan bisnis yang telah ditetapkan pada dokumen sumber.

# ==============================================================================
# PART 2 — Component Architecture
# ==============================================================================

## 2.1 Purpose

Component Architecture mendefinisikan struktur dasar komponen frontend pada Engineering Document Management System (EDMS) Rebuild.

Bagian ini bertujuan memastikan seluruh komponen memiliki pola implementasi yang konsisten, mudah dipelihara, reusable, dan sesuai dengan arsitektur React yang telah ditetapkan pada ENGINEERING-FOUNDATION.md.

Component Architecture tidak membahas detail implementasi setiap komponen. Detail tersebut akan dijelaskan pada PART berikutnya.

---

## 2.2 Architecture Principles

Seluruh komponen frontend wajib mengikuti prinsip berikut.

### CA-001 Single Responsibility

Setiap komponen hanya memiliki satu tanggung jawab utama.

Contoh:

- SearchInput hanya menangani input pencarian.
- StatusBadge hanya menampilkan status.
- SummaryCard hanya menampilkan informasi ringkasan.

Komponen tidak diperbolehkan memiliki lebih dari satu fungsi utama.

---

### CA-002 Reusable First

Seluruh komponen harus dirancang agar dapat digunakan kembali pada berbagai halaman.

Komponen tidak boleh dibuat khusus hanya untuk satu halaman apabila masih memungkinkan digunakan pada modul lain.

---

### CA-003 Composition over Duplication

Halaman dibangun melalui kombinasi berbagai reusable component.

Tidak diperbolehkan membuat komponen baru apabila fungsi yang sama sudah tersedia.

---

### CA-004 Configurable

Perbedaan tampilan maupun perilaku komponen harus dikendalikan melalui Props, bukan dengan membuat komponen baru.

Contoh:

- Button Variant
- Badge Variant
- Card Variant

---

### CA-005 Presentation & Logic Separation

Komponen presentasi tidak boleh mengandung Business Logic.

Business Logic berada pada:

- Service Layer
- Custom Hooks
- State Management
- API Layer

Component hanya bertanggung jawab terhadap tampilan dan interaksi pengguna.

---

## 2.3 Component Hierarchy

Seluruh komponen mengikuti hierarki berikut.

```text
Application

│

├── Layout

│      ├── Sidebar
│      ├── TopNavigation
│      ├── MainContent
│      └── Footer

│
├── Page

│      ├── Dashboard
│      ├── Document Register
│      ├── Transmittal
│      ├── SLA Monitoring
│      ├── Escalation
│      ├── Audit Trail
│      ├── Storage NAS
│      ├── Notification
│      └── Administration

│
├── Section

│      ├── Summary Section
│      ├── Filter Section
│      ├── Table Section
│      ├── Sidebar Panel
│      └── Detail Panel

│
├── Component

│      ├── Card
│      ├── Table
│      ├── Badge
│      ├── Button
│      ├── Input
│      ├── Select
│      ├── Pagination
│      ├── Modal
│      ├── Toast
│      └── Loader

│
└── Primitive

       ├── Icon
       ├── Label
       ├── Text
       ├── Divider
       └── Spinner
```

Setiap layer hanya diperbolehkan menggunakan layer di bawahnya.

---

## 2.4 Component Categories

Komponen frontend dikelompokkan menjadi beberapa kategori.

| Category | Purpose |
|----------|----------|
| Layout Components | Menyusun struktur halaman aplikasi |
| Navigation Components | Navigasi utama dan perpindahan halaman |
| Display Components | Menampilkan data dan informasi |
| Form Components | Input dan pengolahan data |
| Feedback Components | Menampilkan status sistem kepada pengguna |
| Overlay Components | Modal, Drawer, Dialog, Popover |
| Workflow Components | Komponen khusus proses review dokumen |
| Shared Components | Komponen yang digunakan lintas modul |

Kategori ini akan dijelaskan lebih rinci pada PART berikutnya.

---

## 2.5 Component Naming Convention

Seluruh komponen React menggunakan PascalCase.

Contoh.

```text
Sidebar

TopNavigation

SummaryCard

DocumentTable

StatusBadge

SearchInput

Pagination

NotificationDropdown

HistoryButton

ApprovalButton
```

Nama komponen harus:

- Deskriptif
- Singkat
- Mudah dipahami
- Konsisten

---

## 2.6 Folder Organization

Setiap komponen memiliki folder tersendiri.

Contoh struktur.

```text
components/

├── layout/

├── navigation/

├── display/

├── forms/

├── feedback/

├── overlay/

├── workflow/

└── shared/
```

Struktur folder lengkap akan dijelaskan pada FILE-STRUCTURE.md.

---

## 2.7 Component Composition Rules

Halaman dibangun melalui proses komposisi komponen.

Contoh.

```text
Dashboard Page

│

├── DashboardLayout

│

├── DashboardHeader

│

├── SummaryCards

│

├── DocumentRegisterPanel

│      ├── SearchToolbar
│      ├── FilterBar
│      ├── DocumentTable
│      └── Pagination

│

├── SLAOverviewCard

│

└── EscalationCard
```

Komponen yang lebih besar hanya bertugas menyusun komponen yang lebih kecil.

---

## 2.8 State Ownership

Setiap komponen harus memiliki tanggung jawab state yang jelas.

| State Type | Owner |
|------------|-------|
| Local UI State | Component |
| Form State | React Hook Form |
| Global UI State | Zustand |
| Server State | TanStack Query |
| Business Data | Service Layer |

Komponen tidak diperbolehkan menyimpan state yang bukan menjadi tanggung jawabnya.

---

## 2.9 General Rules

Seluruh komponen wajib memenuhi aturan berikut.

- Reusable.
- Modular.
- Responsive.
- Stateless apabila memungkinkan.
- Tidak mengandung Business Workflow.
- Tidak melakukan pemanggilan API secara langsung.
- Tidak mengandung Query Database.
- Mengikuti UI-GUIDELINES.md.
- Mengikuti ENGINEERING-FOUNDATION.md.
- Mengikuti Approved UI Mockup.

---

## 2.10 Acceptance Criteria

Component Architecture dinyatakan memenuhi standar apabila.

- Seluruh komponen memiliki tanggung jawab tunggal.
- Seluruh halaman dibangun menggunakan reusable component.
- Tidak terdapat duplikasi komponen.
- Hierarki komponen diterapkan secara konsisten.
- Penamaan komponen mengikuti standar.
- Struktur folder mengikuti arsitektur proyek.
- Business Logic terpisah dari UI Component.
- Seluruh implementasi sesuai dengan ENGINEERING-FOUNDATION.md dan UI-GUIDELINES.md.

---

# End of PART 2

PART 2 mendefinisikan arsitektur dasar seluruh komponen frontend pada Engineering Document Management System (EDMS) Rebuild.

Seluruh spesifikasi komponen pada PART berikutnya wajib mengikuti struktur, prinsip, dan aturan yang telah ditetapkan pada PART 2 agar implementasi React tetap konsisten, reusable, scalable, dan mudah dipelihara.

# ==============================================================================
# PART 3 — Layout Components
# ==============================================================================

## 3.1 Purpose

Layout Components mendefinisikan komponen utama yang membentuk kerangka (Application Shell) Engineering Document Management System (EDMS) Rebuild.

Komponen pada bagian ini bertanggung jawab terhadap struktur halaman secara keseluruhan dan menjadi fondasi bagi seluruh halaman aplikasi.

Layout Components tidak menangani Business Logic maupun pengolahan data. Fungsinya hanya menyusun area tampilan agar konsisten sesuai Approved UI Mockup.

---

## 3.2 Layout Architecture

Seluruh halaman aplikasi menggunakan struktur layout yang sama.

```text
Application Layout

│

├── Sidebar

├── Top Navigation

├── Main Content

└── Footer
```

Layout dasar ini wajib digunakan pada seluruh halaman utama aplikasi.

---

## 3.3 Application Layout

### Purpose

Merupakan root layout seluruh aplikasi setelah pengguna berhasil login.

### Responsibilities

- Menyusun Sidebar.
- Menyusun Top Navigation.
- Menyusun Main Content.
- Menyusun Footer.
- Mengatur struktur halaman secara global.

### Contains

```text
Application Layout

├── Sidebar

├── Top Navigation

├── Main Content

└── Footer
```

Application Layout tidak diperbolehkan berisi Business Logic.

---

## 3.4 Sidebar Component

### Purpose

Menampilkan navigasi utama aplikasi.

### Responsibilities

- Menampilkan Logo EDMS.
- Menampilkan seluruh Navigation Menu.
- Menampilkan Active Menu.
- Mendukung Expand / Collapse Menu.
- Mendukung Nested Menu.
- Mendukung Responsive Drawer pada Mobile.

### Contains

```text
Sidebar

├── Logo

├── Navigation Menu

│      ├── Dashboard
│      ├── Document Register
│      ├── Transmittal
│      ├── SLA Monitoring
│      ├── Escalation
│      ├── Audit Trail
│      ├── Storage NAS
│      └── Notifications

└── Sidebar Footer
```

### Rules

- Selalu tampil pada Desktop.
- Dapat di-collapse.
- Tidak berpindah posisi.
- Active Menu mengikuti halaman aktif.
- Struktur mengikuti Approved UI Mockup.
- Navigation Menu dapat menggunakan vertical scroll apabila tinggi menu melebihi viewport.
- Sidebar tidak boleh menggunakan horizontal scroll pada kondisi Expanded maupun Collapse.
- Nested Menu pada kondisi Collapse ditampilkan melalui Flyout Menu di sisi kanan Sidebar.

---

## 3.5 Top Navigation Component

### Purpose

Menampilkan informasi global aplikasi.

### Responsibilities

- Menampilkan Active Project Selector.
- Menampilkan Notification.
- Menampilkan User Profile.
- Menampilkan User Menu.
- Menampilkan Global Action apabila diperlukan.

### Contains

```text
Top Navigation

├── Notification

├── User Profile

└── User Dropdown
```

### Rules

- Selalu berada di bagian atas.
- Tetap konsisten pada seluruh halaman.
- Tidak berubah antar module.
- Active Project Selector menampilkan label `ACTIVE PROJECT`, Project Name, dan Project Code.
- Active Project Selector menjadi elemen visual paling menonjol pada Top Navigation.
- Urutan komponen kanan adalah Active Project, User + Role, lalu Notification.
- Desktop layout tetap horizontal.

---

## 3.6 Main Content Component

### Purpose

Area utama untuk menampilkan isi halaman.

### Responsibilities

- Menampilkan Page Header.
- Menampilkan seluruh Section.
- Menjadi container utama seluruh halaman.

### Structure

```text
Main Content

├── Page Header

├── Section

├── Section

├── Section

└── Section
```

### Rules

- Lebar mengikuti Layout.
- Menggunakan spacing sesuai UI Guidelines.
- Tidak mengandung Navigation.

---

## 3.7 Footer Component

### Purpose

Menampilkan informasi aplikasi.

### Responsibilities

- Menampilkan Copyright.
- Menampilkan informasi versi apabila diperlukan.

### Rules

- Konsisten pada seluruh halaman.
- Tidak mengandung Navigation.
- Tidak mengandung Action Button.

---

## 3.8 Layout Composition

Komposisi layout halaman mengikuti pola berikut.

```text
Application Layout

├── Sidebar

├── Top Navigation

└── Main Content

      ├── Dashboard Page
      │
      ├── Dashboard Header
      │
      ├── Summary Cards
      │
      ├── Dashboard Content
      │
      └── Footer
```

Page lain menggunakan struktur yang sama dengan mengganti isi Main Content sesuai kebutuhan modul.

---

## 3.9 General Rules

Seluruh Layout Components wajib memenuhi ketentuan berikut.

- Reusable.
- Responsive.
- Konsisten pada seluruh halaman.
- Tidak mengandung Business Logic.
- Tidak melakukan Request API.
- Tidak menyimpan Business State.
- Mengikuti UI-GUIDELINES.md.
- Mengikuti Approved UI Mockup.

---

## 3.10 Acceptance Criteria

Layout Components dinyatakan memenuhi standar apabila.

- Application Layout digunakan pada seluruh halaman.
- Sidebar tampil konsisten sesuai mockup.
- Top Navigation tampil konsisten sesuai mockup.
- Main Content menjadi area utama seluruh halaman.
- Footer tampil konsisten.
- Layout mendukung Desktop, Tablet, dan Mobile.
- Tidak terdapat duplikasi struktur layout.
- Seluruh implementasi sesuai UI-GUIDELINES.md dan Approved UI Mockup.

---

# End of PART 3

PART 3 mendefinisikan spesifikasi Layout Components yang menjadi kerangka utama Engineering Document Management System (EDMS) Rebuild.

Seluruh halaman aplikasi wajib menggunakan struktur layout yang telah ditetapkan pada PART ini untuk memastikan konsistensi visual, kemudahan pemeliharaan, dan kesesuaian dengan Approved UI Mockup.

# ==============================================================================
# PART 4 — Navigation Components
# ==============================================================================

## 4.1 Purpose

Navigation Components mendefinisikan seluruh komponen navigasi yang digunakan pada Engineering Document Management System (EDMS) Rebuild.

Komponen pada bagian ini bertanggung jawab mengarahkan pengguna menuju halaman atau fitur yang tersedia sesuai struktur aplikasi.

Navigation Components hanya menangani proses navigasi antarmuka dan tidak diperbolehkan mengandung Business Logic maupun Business Workflow.

---

## 4.2 Navigation Architecture

Struktur navigasi aplikasi mengikuti hierarki berikut.

```text
Navigation

│

├── Sidebar Navigation

│      ├── Navigation Group
│      ├── Navigation Item
│      ├── Navigation Collapse
│      └── Navigation Footer

│

├── Top Navigation

│      ├── Notification
│      ├── Notification Badge
│      ├── User Profile
│      └── User Dropdown

│

└── Breadcrumb (Optional)
```

Seluruh halaman menggunakan struktur navigasi yang sama.

---

## 4.3 Sidebar Navigation Component

### Purpose

Menampilkan menu utama aplikasi.

### Responsibilities

- Menampilkan seluruh menu utama.
- Menampilkan menu bertingkat (Nested Menu).
- Menampilkan Active Menu.
- Menampilkan Expanded Menu.
- Mendukung Collapse Sidebar.
- Mendukung Responsive Sidebar.

### Structure

```text
Sidebar

├── Logo

├── Dashboard

├── Document Register
│      ├── PFD
│      └── P&ID

├── Transmittal
│      ├── Incoming
│      └── Outgoing

├── SLA Monitoring

├── Escalation

├── Audit Trail

├── Storage NAS

├── Notifications

└── Sidebar Footer
```

### Rules

- Dashboard tidak memiliki submenu.
- Document Register menggunakan expandable menu.
- Transmittal menggunakan expandable menu.
- Active Menu menggunakan warna Primary.
- Collapse hanya menyembunyikan label menu.
- Icon tetap ditampilkan saat Sidebar Collapse.
- Parent Menu dengan Child Menu tetap dapat dibuka pada Sidebar Collapse melalui Flyout Menu di sisi kanan Sidebar.
- Flyout Menu tidak mengubah struktur Navigation, Route, Permission, maupun lebar Main Content.
- Sidebar Navigation dapat menggunakan vertical scroll tanpa menampilkan horizontal scroll.
- Struktur wajib mengikuti Approved UI Mockup.

---

## 4.4 Navigation Item Component

### Purpose

Merepresentasikan satu menu navigasi.

### Responsibilities

- Menampilkan Icon.
- Menampilkan Label.
- Menampilkan Active State.
- Menampilkan Hover State.
- Menangani Click Navigation.

### States

- Default
- Hover
- Active
- Disabled

### Rules

- Seluruh item memiliki tinggi yang konsisten.
- Icon dan Label harus sejajar.
- Hover tidak mengubah ukuran komponen.
- Active State mengikuti Primary Color pada UI Guidelines.

---

## 4.5 Navigation Group Component

### Purpose

Mengelompokkan Navigation Item yang memiliki hubungan fungsional.

### Example

```text
Document Register

▼

PFD

P&ID
```

```text
Transmittal

▼

Incoming

Outgoing
```

### Rules

- Expand dan Collapse menggunakan animasi ringan.
- Child Menu memiliki indentasi yang konsisten.
- Parent Menu tetap terlihat ketika submenu terbuka.

---

## 4.6 Top Navigation Component

### Purpose

Menampilkan navigasi global aplikasi.

### Responsibilities

- Active Project Selector.
- User Profile dengan Active Role.
- Notification.
- Notification Badge.
- User Dropdown.

### Structure

```text
Top Navigation

├── Notification Icon

├── Notification Badge

├── User Profile

└── User Dropdown
```

### Rules

- Selalu berada di kanan atas.
- Konsisten pada seluruh halaman.
- Tidak berubah antar modul.
- Urutan komponen kanan adalah Active Project, User + Role, lalu Notification.
- Active Project Selector menampilkan label `ACTIVE PROJECT`, Project Name, dan Project Code.
- Active Project Selector menjadi elemen visual paling menonjol pada Top Navigation.
- User Profile menampilkan nama User dan label `Role`.
- Notification menggunakan icon lonceng dan unread badge.
- Desktop layout tetap horizontal.
- Mengikuti struktur Approved UI Mockup.

---

## 4.7 Notification Component

### Purpose

Menampilkan jumlah notifikasi pengguna.

### Responsibilities

- Menampilkan Notification Icon.
- Menampilkan Badge Counter.
- Membuka Notification Panel.

### States

- Empty
- Has Notification

### Rules

- Counter hanya menampilkan jumlah notifikasi yang belum dibaca.
- Badge mengikuti Semantic Color pada UI Guidelines.
- Notification Panel dijelaskan pada modul Notification.

---

## 4.8 User Profile Component

### Purpose

Menampilkan informasi pengguna yang sedang login.

### Responsibilities

- Menampilkan Nama Pengguna.
- Menampilkan Role aktif dengan label `Role`.
- Menampilkan Avatar (jika tersedia).
- Menampilkan Dropdown Menu.

### Dropdown Menu

```text
User Dropdown

├── Profile

├── Settings (Future)

└── Logout
```

### Rules

- Nama pengguna selalu ditampilkan.
- Role aktif berasal dari Active Project Membership apabila Active Project tersedia.
- Dropdown muncul ketika User Profile diklik.
- Logout tidak langsung keluar tanpa proses konfirmasi apabila disyaratkan sistem.

---

## 4.9 General Rules

Seluruh Navigation Components wajib memenuhi ketentuan berikut.

- Reusable.
- Responsive.
- Konsisten pada seluruh halaman.
- Tidak mengandung Business Logic.
- Tidak melakukan Request API secara langsung.
- Tidak menyimpan Business State.
- Mengikuti UI-GUIDELINES.md.
- Mengikuti ENGINEERING-FOUNDATION.md.
- Mengikuti Approved UI Mockup.

---

## 4.10 Acceptance Criteria

Navigation Components dinyatakan memenuhi standar apabila.

- Sidebar sesuai dengan Approved UI Mockup.
- Seluruh menu dapat digunakan dengan benar.
- Active Menu ditampilkan secara konsisten.
- Expandable Menu bekerja sesuai struktur navigasi.
- Notification tampil sesuai standar UI.
- User Profile dan Dropdown berfungsi dengan baik.
- Responsive Navigation berjalan pada Desktop, Tablet, dan Mobile.
- Seluruh implementasi sesuai UI-GUIDELINES.md dan ENGINEERING-FOUNDATION.md.

---

# End of PART 4

PART 4 mendefinisikan seluruh Navigation Components yang digunakan pada Engineering Document Management System (EDMS) Rebuild.

Seluruh komponen navigasi wajib mengikuti struktur, perilaku, dan standar visual yang telah ditetapkan agar pengalaman navigasi pengguna tetap konsisten, mudah dipahami, dan sesuai dengan Approved UI Mockup.

# ==============================================================================
# PART 5 — Display Components
# ==============================================================================

## 5.1 Purpose

Display Components mendefinisikan seluruh komponen yang digunakan untuk menampilkan informasi pada Engineering Document Management System (EDMS) Rebuild.

Komponen pada bagian ini bertanggung jawab menyajikan data secara konsisten, mudah dipahami, dan sesuai dengan Approved UI Mockup.

Display Components tidak mengelola Business Logic, Business Workflow, maupun proses pengambilan data dari Backend.

---

## 5.2 Display Architecture

Seluruh komponen penyajian data mengikuti struktur berikut.

```text
Display Components

│

├── Summary Components

├── Data Table Components

├── Badge Components

├── Information Components

├── Statistic Components

├── Pagination Components

└── Empty & Loading Components
```

Seluruh halaman menggunakan kombinasi komponen di atas untuk menyajikan informasi.

---

## 5.3 Summary Card Component

### Purpose

Menampilkan ringkasan informasi utama pada Dashboard.

### Responsibilities

- Menampilkan Judul.
- Menampilkan Nilai Utama.
- Menampilkan Icon apabila diperlukan.
- Menampilkan informasi tambahan apabila diperlukan.
- Menjadi shortcut filter apabila digunakan pada Dashboard Summary Area.

### Structure

```text
Summary Card

├── Card Header

├── Metric Value

├── Supporting Label

└── Icon (Optional)
```

### Example Usage

- Total Documents
- Process Review
- Project Review
- Approved
- Overdue
- Final As-Built

### Rules

- Seluruh Summary Card memiliki ukuran yang konsisten.
- Metric Value menjadi elemen visual paling dominan.
- Menggunakan Semantic Color sesuai UI-GUIDELINES.md.
- Tidak digunakan sebagai media input data bisnis.
- Apabila Summary Card digunakan sebagai filter shortcut, gunakan semantic button dan focus state yang terlihat.
- Active Summary Card harus merepresentasikan Filter Status yang sedang berlaku.
- Total Documents merepresentasikan All Status pada Dashboard Document Register.

---

## 5.4 Data Table Component

### Purpose

Menampilkan data utama aplikasi dalam bentuk tabel.

### Responsibilities

- Menampilkan Header.
- Menampilkan Data Row.
- Menampilkan Empty State.
- Mendukung Pagination.
- Mendukung Sorting apabila diperlukan.
- Mendukung Filtering melalui komponen terpisah.

### Structure

```text
Data Table

├── Table Header

├── Table Body

├── Table Row

├── Table Cell

└── Pagination
```

### Rules

- Header selalu berada di bagian atas.
- Setiap Row merepresentasikan satu data.
- Kolom mengikuti spesifikasi PRD.
- Layout mengikuti Approved UI Mockup.
- Tidak mengandung Business Logic.

---

## 5.5 Status Badge Component

### Purpose

Menampilkan status dokumen maupun status sistem.

### Responsibilities

- Menampilkan Status.
- Memberikan identifikasi visual menggunakan Semantic Color.

### Example Usage

- Process Review
- Process Comment
- Process Reject
- Project Review
- Project Comment
- Project Reject
- Approved
- On Track
- At Risk
- Overdue

### Rules

- Badge tidak digunakan sebagai tombol.
- Semantic Color mengikuti UI-GUIDELINES.md.
- Label mengikuti istilah resmi pada PRD.

---

## 5.6 Information Card Component

### Purpose

Menampilkan informasi pendukung yang tidak berbentuk tabel.

### Example Usage

- SLA Overview (Label di frontend adalah Review Time Overview)
- Escalation Alert
- Document Summary
- Activity Information

### Structure

```text
Information Card

├── Header

├── Content

└── Footer (Optional)
```

### Rules

- Menggunakan Card Style yang konsisten.
- Tidak digunakan sebagai Form.
- Mengikuti Layout Dashboard.

---

## 5.7 Pagination Component

### Purpose

Mengatur perpindahan halaman pada Data Table.

### Responsibilities

- Previous Page.
- Next Page.
- Current Page.
- Total Page.

### Rules

- Selalu berada di bawah Data Table.
- Active Page menggunakan Primary Color.
- Tidak tampil apabila hanya terdapat satu halaman data.

---

## 5.8 Empty State Component

### Purpose

Menampilkan kondisi ketika tidak terdapat data.

### Responsibilities

- Menampilkan Icon.
- Menampilkan Judul.
- Menampilkan Deskripsi.
- Menampilkan Action apabila diperlukan.

### Example Usage

- No Documents Found
- No Notifications
- No Search Results

### Rules

- Tetap mempertahankan struktur halaman.
- Menggunakan bahasa yang mudah dipahami.
- Tidak mengubah Layout utama.

---

## 5.9 Loading Component

### Purpose

Menampilkan indikator ketika data sedang diproses.

### Responsibilities

- Menampilkan Loading Indicator.
- Menjaga stabilitas Layout.
- Menghindari perubahan Layout secara drastis.

### Rules

- Tidak menutupi seluruh halaman kecuali diperlukan.
- Tidak menyebabkan Layout Shift.
- Menghilang setelah proses selesai.

---

## 5.10 General Rules

Seluruh Display Components wajib memenuhi ketentuan berikut.

- Reusable.
- Responsive.
- Stateless apabila memungkinkan.
- Tidak mengandung Business Logic.
- Tidak melakukan Request API secara langsung.
- Mengikuti UI-GUIDELINES.md.
- Mengikuti Approved UI Mockup.
- Menggunakan Visual Design System yang telah ditetapkan.

---

## 5.11 Acceptance Criteria

Display Components dinyatakan memenuhi standar apabila.

- Summary Card tampil konsisten pada seluruh Dashboard.
- Data Table mengikuti struktur yang telah ditetapkan.
- Status Badge menggunakan Semantic Color yang benar.
- Information Card mengikuti Layout Dashboard.
- Pagination bekerja dengan baik.
- Empty State tampil ketika data kosong.
- Loading State tampil selama proses berlangsung.
- Seluruh Display Components sesuai dengan UI-GUIDELINES.md dan Approved UI Mockup.

---

# End of PART 5

PART 5 mendefinisikan seluruh Display Components yang digunakan untuk menyajikan informasi pada Engineering Document Management System (EDMS) Rebuild.

Seluruh komponen pada bagian ini wajib mengikuti standar visual, struktur, dan perilaku yang telah ditetapkan agar penyajian informasi tetap konsisten, mudah dipahami, serta sesuai dengan Approved UI Mockup.

# ==============================================================================
# PART 6 — Form Components
# ==============================================================================

## 6.1 Purpose

Form Components mendefinisikan seluruh komponen antarmuka yang digunakan untuk menerima input pengguna pada Engineering Document Management System (EDMS) Rebuild.

Komponen pada bagian ini bertanggung jawab menyediakan pengalaman pengisian data yang konsisten, mudah digunakan, dan sesuai dengan Approved UI Mockup.

Form Components tidak mendefinisikan struktur field, validasi bisnis, maupun aturan workflow. Detail tersebut dijelaskan pada FORM-SPEC.md dan PRD.md.

---

## 6.2 Form Architecture

Seluruh Form Components mengikuti struktur berikut.

```text
Form Components

│

├── Text Input

├── Text Area

├── Select

├── Date Picker

├── File Upload

├── Search Input

├── Checkbox

├── Radio Button

├── Toggle Switch

├── Read Only Field

├── Form Action

└── Form Section
```

Seluruh halaman menggunakan kombinasi komponen di atas sesuai kebutuhan modul.

---

## 6.3 Text Input Component

### Purpose

Menerima input data berbentuk teks pendek.

### Responsibilities

- Menampilkan Label.
- Menampilkan Placeholder.
- Menampilkan Nilai Input.
- Menampilkan Validation State.

### Example Usage

- Document Number
- Revision
- Vendor Name
- Drawing Title
- Username

### States

- Default
- Focus
- Filled
- Disabled
- Error
- Read Only

### Rules

- Label selalu berada di atas field.
- Placeholder hanya sebagai petunjuk.
- Tinggi input konsisten pada seluruh aplikasi.
- Mengikuti Visual Design System.

---

## 6.4 Text Area Component

### Purpose

Menerima input berupa teks panjang.

### Example Usage

- Comment
- Description
- Notes
- Review Remark

### Rules

- Mendukung multi-line.
- Tinggi minimum konsisten.
- Dapat diperbesar secara vertikal apabila diperlukan.
- Tidak mengubah layout halaman.

---

## 6.5 Select Component

### Purpose

Memilih satu nilai dari daftar pilihan.

### Example Usage

- Project
- Discipline
- Department
- Document Type
- Status

### States

- Default
- Expanded
- Selected
- Disabled

### Rules

- Hanya satu nilai yang dapat dipilih.
- Menampilkan Placeholder sebelum terdapat pilihan.
- Menggunakan Dropdown yang konsisten.
- Dropdown menampilkan maksimal 5 opsi sekaligus.
- Opsi lebih dari 5 menggunakan vertical scroll.
- Seluruh opsi tetap tersedia dan tidak boleh dipotong dari data.
- Dropdown tidak menggunakan horizontal scroll.

---

## 6.6 Date Picker Component

### Purpose

Memilih tanggal.

### Example Usage

- Upload Date
- Review Date
- Due Date
- Validation Date

### Rules

- Menggunakan format tanggal yang konsisten pada seluruh aplikasi.
- Tidak menerima format tanggal yang berbeda pada halaman lain.
- Mengikuti standar regional yang telah ditetapkan proyek.

---

## 6.7 File Upload Component

### Purpose

Mengunggah dokumen engineering.

### Responsibilities

- Memilih file.
- Menampilkan nama file.
- Menampilkan ukuran file.
- Menampilkan status upload.

### Example Usage

- Upload Drawing
- Upload Revision
- Upload Attachment

### Rules

- Menggunakan area upload yang konsisten.
- Menampilkan informasi file yang dipilih.
- Tidak menangani proses upload Backend secara langsung.

---

## 6.8 Search Input Component

### Purpose

Mencari data pada halaman tertentu.

### Example Usage

- Search Document
- Search User
- Search Project
- Search Notification

### Rules

- Menggunakan ikon Search yang konsisten.
- Placeholder menjelaskan objek pencarian.
- Tidak mengandung Business Logic pencarian.

---

## 6.9 Selection Components

### Purpose

Menerima pilihan pengguna.

Komponen meliputi.

- Checkbox
- Radio Button
- Toggle Switch

### Rules

- Menggunakan gaya visual yang konsisten.
- Mudah dikenali.
- Mudah digunakan pada Desktop maupun Mobile.
- Mengikuti UI-GUIDELINES.md.

---

## 6.10 Read Only Component

### Purpose

Menampilkan informasi yang tidak dapat diubah pengguna.

### Example Usage

- Username
- Department
- Official Role
- Document ID
- Current Revision

### Rules

- Tetap menggunakan gaya visual Form.
- Tidak dapat menerima input.
- Mudah dibedakan dari field yang dapat diedit.

---

## 6.11 Form Action Component

### Purpose

Menampilkan aksi utama pada Form.

### Example Usage

- Save
- Submit
- Upload
- Update
- Cancel
- Reset

### Rules

- Primary Action menggunakan Primary Button.
- Secondary Action memiliki visual yang berbeda.
- Posisi Action konsisten pada seluruh aplikasi.
- Tidak mengandung Business Workflow.

---

## 6.12 General Rules

Seluruh Form Components wajib memenuhi ketentuan berikut.

- Reusable.
- Responsive.
- Accessible.
- Mengikuti Visual Design System.
- Mengikuti UI-GUIDELINES.md.
- Mengikuti Approved UI Mockup.
- Tidak mengandung Business Logic.
- Tidak melakukan Request API secara langsung.
- Tidak mengandung Validation Rules khusus.

---

## 6.13 Acceptance Criteria

Form Components dinyatakan memenuhi standar apabila.

- Seluruh Input Component memiliki tampilan yang konsisten.
- Seluruh Selection Component menggunakan perilaku yang konsisten.
- File Upload mengikuti standar UI proyek.
- Search Input memiliki perilaku yang konsisten.
- Read Only Field dapat dibedakan dengan jelas.
- Form Action mengikuti standar visual aplikasi.
- Seluruh Form Components sesuai dengan UI-GUIDELINES.md dan Approved UI Mockup.

---

# End of PART 6

PART 6 mendefinisikan seluruh Form Components yang digunakan pada Engineering Document Management System (EDMS) Rebuild.

Seluruh komponen pada bagian ini wajib mengikuti standar visual, struktur, dan perilaku yang telah ditetapkan agar proses input data tetap konsisten, mudah digunakan, serta sesuai dengan Approved UI Mockup tanpa menduplikasi aturan yang telah dijelaskan pada FORM-SPEC.md.

# ==============================================================================
# PART 7 — Feedback & Overlay Components
# ==============================================================================

## 7.1 Purpose

Feedback & Overlay Components mendefinisikan seluruh komponen yang digunakan untuk memberikan umpan balik (Feedback) kepada pengguna serta menampilkan informasi sementara (Overlay) pada Engineering Document Management System (EDMS) Rebuild.

Komponen pada bagian ini bertujuan meningkatkan pengalaman pengguna dengan memberikan informasi yang jelas mengenai hasil suatu aksi tanpa mengganggu alur kerja utama.

Feedback & Overlay Components tidak mengandung Business Logic maupun Business Workflow.

---

## 7.2 Component Architecture

Seluruh Feedback & Overlay Components mengikuti struktur berikut.

```text
Feedback & Overlay Components

│

├── Dialog

├── Modal

├── Drawer

├── Toast Notification

├── Alert Message

├── Loading Overlay

├── Skeleton Loader

├── Empty State

├── Error State

└── Tooltip
```

Seluruh komponen digunakan sesuai konteks interaksi pengguna.

---

## 7.3 Dialog Component

### Purpose

Menampilkan dialog konfirmasi sebelum pengguna menjalankan aksi penting.

### Example Usage

- Logout Confirmation
- Delete Confirmation
- Cancel Confirmation
- Submit Confirmation

### Structure

```text
Dialog

├── Title

├── Description

├── Primary Action

└── Secondary Action
```

### Rules

- Muncul di atas halaman aktif.
- Mengunci interaksi dengan halaman di belakangnya selama dialog terbuka.
- Digunakan hanya untuk aksi yang membutuhkan konfirmasi pengguna.
- Mengikuti Visual Design System.

---

## 7.4 Modal Component

### Purpose

Menampilkan informasi atau konten tambahan tanpa berpindah halaman.

### Example Usage

- Document Preview
- History Detail
- Comment Detail
- User Detail

### Structure

```text
Modal

├── Header

├── Body

└── Footer (Optional)
```

### Rules

- Tidak mengubah Layout utama.
- Dapat ditutup melalui tombol Close.
- Mendukung scrolling apabila konten melebihi tinggi layar.
- Mengikuti ukuran yang konsisten.

---

## 7.5 Drawer Component

### Purpose

Menampilkan panel tambahan dari sisi layar.

### Example Usage

- Mobile Navigation
- Filter Panel
- Detail Panel

### Rules

- Muncul dari sisi layar.
- Tidak mengubah struktur halaman.
- Dapat ditutup melalui tombol Close atau klik area luar.
- Digunakan terutama pada tampilan Tablet dan Mobile.

---

## 7.6 Toast Notification Component

### Purpose

Memberikan informasi singkat mengenai hasil suatu aksi.

### Example Usage

- Save Successful
- Upload Completed
- Update Successful
- Delete Successful

### Types

- Success
- Information
- Warning
- Error

### Rules

- Muncul sementara.
- Tidak menghalangi aktivitas pengguna.
- Menghilang secara otomatis setelah beberapa detik.
- Menggunakan Semantic Color sesuai UI-GUIDELINES.md.

---

## 7.7 Alert Component

### Purpose

Menampilkan informasi penting yang memerlukan perhatian pengguna.

### Example Usage

- Validation Warning
- Upload Failed
- Session Expired
- Permission Denied

### Rules

- Ditampilkan secara jelas.
- Menggunakan Semantic Color.
- Tidak digunakan sebagai Dialog.
- Tetap terlihat hingga kondisi yang menyebabkan Alert berubah atau pengguna menutupnya apabila diperbolehkan.

---

## 7.8 Loading Components

### Purpose

Menunjukkan bahwa sistem sedang memproses suatu aksi atau mengambil data.

Komponen meliputi.

- Spinner
- Loading Overlay
- Skeleton Loader

### Example Usage

- Initial Page Loading
- Table Loading
- Dashboard Loading
- File Upload Loading

### Rules

- Tidak menyebabkan Layout Shift.
- Mengikuti gaya visual yang konsisten.
- Menghilang setelah proses selesai.
- Tidak digunakan sebagai indikator permanen.

---

## 7.9 Empty State Component

### Purpose

Menampilkan kondisi ketika tidak terdapat data untuk ditampilkan.

### Example Usage

- No Documents
- No Notifications
- No Search Result
- No History

### Structure

```text
Empty State

├── Illustration / Icon

├── Title

├── Description

└── Action (Optional)
```

### Rules

- Tetap mempertahankan Layout halaman.
- Menggunakan bahasa yang mudah dipahami.
- Tidak menampilkan pesan teknis kepada pengguna.

---

## 7.10 Tooltip Component

### Purpose

Memberikan informasi singkat mengenai fungsi suatu komponen.

### Example Usage

- Icon Button
- Status Badge
- Toolbar Action

### Rules

- Ditampilkan saat Hover (Desktop).
- Ditampilkan saat Tap & Hold apabila diperlukan (Mobile).
- Bersifat singkat dan informatif.
- Tidak menggantikan Label utama.

---

## 7.11 General Rules

Seluruh Feedback & Overlay Components wajib memenuhi ketentuan berikut.

- Reusable.
- Responsive.
- Accessible.
- Mengikuti Visual Design System.
- Mengikuti UI-GUIDELINES.md.
- Mengikuti Approved UI Mockup.
- Tidak mengandung Business Logic.
- Tidak melakukan Request API secara langsung.
- Tidak mengubah struktur Global Layout.

---

## 7.12 Acceptance Criteria

Feedback & Overlay Components dinyatakan memenuhi standar apabila.

- Dialog digunakan untuk aksi yang memerlukan konfirmasi.
- Modal menampilkan informasi tambahan tanpa berpindah halaman.
- Drawer berfungsi dengan baik pada Tablet dan Mobile.
- Toast Notification tampil secara konsisten.
- Alert menggunakan Semantic Color yang benar.
- Loading Components tampil selama proses berlangsung.
- Empty State muncul ketika data tidak tersedia.
- Tooltip memberikan informasi yang jelas.
- Seluruh komponen sesuai dengan UI-GUIDELINES.md dan Approved UI Mockup.

---

# End of PART 7

PART 7 mendefinisikan seluruh Feedback & Overlay Components yang digunakan pada Engineering Document Management System (EDMS) Rebuild.

Seluruh komponen pada bagian ini wajib mengikuti standar visual, struktur, dan perilaku yang telah ditetapkan agar setiap interaksi pengguna memperoleh umpan balik yang jelas, konsisten, dan sesuai dengan Approved UI Mockup.

# ==============================================================================
# PART 8 — Workflow & Shared Components
# ==============================================================================

## 8.1 Purpose

Workflow & Shared Components mendefinisikan komponen yang digunakan untuk mendukung proses bisnis Engineering Document Management System (EDMS) Rebuild serta komponen umum (Shared Components) yang digunakan pada berbagai modul aplikasi.

Komponen pada bagian ini bersifat reusable dan dapat digunakan lintas halaman tanpa bergantung pada modul tertentu.

Business Workflow hanya menentukan perilaku komponen, sedangkan implementasi komponen tetap mengikuti prinsip reusable dan tidak mengandung Business Logic.

---

## 8.2 Component Architecture

Seluruh Workflow & Shared Components mengikuti struktur berikut.

```text
Workflow Components

│

├── Document Action

├── Approval Action

├── History Action

├── SLA Indicator

├── Escalation Indicator

├── Comment Indicator

└── Workflow Status


Shared Components

│

├── Action Button

├── Icon Button

├── Divider

├── Avatar

├── Breadcrumb

├── Chip

├── Tag

└── Label
```

---

## 8.2.1 Document Register Table Component

### Rules

- PFD Register dan P&ID Register menampilkan kolom Created Date.
- Posisi Created Date berada setelah Revision dan sebelum Status.
- Created Date menggunakan field Document existing dan ditampilkan sebagai tanggal tanpa jam.
- Dashboard Document Register Table tidak berubah.

---

## 8.3 Document Action Component

### Purpose

Menyediakan aksi utama terhadap dokumen pada Document Register.

### Example Usage

- View
- Download
- Comment
- Archive
- Restore

### Structure

```text
Document Action

├── View Button

├── Download Button

└── Comment Button
```

### Rules

- Selalu berada pada kolom Action.
- Menggunakan Icon yang konsisten.
- Urutan Action mengikuti Approved UI Mockup.
- Archive menggantikan Delete pada PFD Register dan P&ID Register.
- Archived Document hanya menampilkan View, Download, dan Restore.
- Tidak mengandung Business Logic.

---

## 8.4 Workflow Action Component

### Purpose

Menyediakan aksi yang berhubungan dengan proses review dokumen.

### Example Usage

- Approval A
- Approval B
- Approval C
- History

### Behaviour Reference

Mengikuti BUSINESS-WORKFLOW.md.

Sebagai contoh:

- Dokumen yang masih berada pada proses review menampilkan Action A, B, dan C.
- Dokumen dengan **Workflow Status = Approved** menampilkan **History Button** sebagai pengganti Action Review.
- History Button tidak bergantung pada SLA Status `Final As-Built`.

### Rules

- Behaviour mengikuti BUSINESS-WORKFLOW.md.
- Tampilan mengikuti UI-GUIDELINES.md.
- Tidak mengandung Business Logic.
- Tidak menentukan perubahan status dokumen.

---

## 8.5 SLA Indicator Component

### Purpose

Menampilkan kondisi SLA dokumen.

### Example Usage

- On Track
- At Risk
- Overdue
- Final As-Built

`Done` hanya boleh digunakan sebagai display wording timer selesai apabila diperlukan, bukan sebagai value SLA Status.

### Structure

```text
SLA Indicator

├── Status

├── Timer

└── Current Assignee
```

### Rules

- Menggunakan Semantic Color.
- Format mengikuti PRD.
- Mengikuti Behaviour Reference pada BUSINESS-WORKFLOW.md.
- `Current Assignee` hanya ditampilkan sebagai display/monitoring dan bukan sumber authorization.
- Tidak menghitung SLA secara mandiri.

---

## 8.6 Escalation Indicator Component

### Purpose

Menampilkan kondisi eskalasi dokumen.

### Example Usage

- Escalated
- High Priority
- Critical

### Rules

- Menggunakan Semantic Color.
- Tidak menentukan kapan eskalasi terjadi.
- Hanya menampilkan informasi yang diterima dari sistem.

---

## 8.7 Comment Indicator Component

### Purpose

Menampilkan informasi komentar pada dokumen.

### Example Usage

- Comment Available
- Review Comment
- Total Comment

### Rules

- Menggunakan Icon yang konsisten.
- Tidak menampilkan isi komentar secara langsung.
- Detail komentar ditampilkan melalui Modal atau halaman terkait.

---

## 8.8 Shared Components

Shared Components merupakan komponen umum yang digunakan pada berbagai halaman aplikasi.

Komponen meliputi.

### Action Button

Digunakan sebagai aksi utama maupun sekunder.

Contoh:

- Save
- Submit
- Upload
- Export
- Refresh

---

### Icon Button

Digunakan untuk aksi berbasis Icon.

Contoh:

- View
- Download
- Edit
- Delete
- Search

---

### Divider

Digunakan sebagai pemisah visual antar Section.

---

### Avatar

Menampilkan identitas pengguna.

---

### Breadcrumb

Menampilkan posisi halaman pada struktur navigasi aplikasi.

---

### Chip

Digunakan untuk menampilkan kategori atau filter aktif.

---

### Tag

Digunakan untuk menampilkan label singkat.

---

### Label

Digunakan sebagai identitas field atau informasi.

---

## 8.9 General Rules

Seluruh Workflow & Shared Components wajib memenuhi ketentuan berikut.

- Reusable.
- Responsive.
- Accessible.
- Mengikuti Visual Design System.
- Mengikuti UI-GUIDELINES.md.
- Mengikuti Approved UI Mockup.
- Tidak mengandung Business Logic.
- Tidak melakukan Request API secara langsung.
- Behaviour mengikuti BUSINESS-WORKFLOW.md apabila berkaitan dengan proses review dokumen.

---

## 8.10 Acceptance Criteria

Workflow & Shared Components dinyatakan memenuhi standar apabila.

- Document Action tampil sesuai Approved UI Mockup.
- Workflow Action mengikuti Behaviour Reference.
- SLA Indicator menampilkan informasi dengan benar.
- Escalation Indicator menggunakan Semantic Color yang tepat.
- Comment Indicator konsisten pada seluruh aplikasi.
- Shared Components dapat digunakan kembali pada berbagai modul.
- Tidak terdapat implementasi Business Logic di dalam komponen.
- Seluruh implementasi sesuai dengan UI-GUIDELINES.md, ENGINEERING-FOUNDATION.md, dan Approved UI Mockup.

---

# End of PART 8

PART 8 mendefinisikan seluruh Workflow Components dan Shared Components yang digunakan pada Engineering Document Management System (EDMS) Rebuild.

Seluruh komponen pada bagian ini wajib mengikuti standar visual, perilaku, dan arsitektur yang telah ditetapkan agar tetap reusable, konsisten, serta selaras dengan Approved UI Mockup dan Behaviour Reference pada BUSINESS-WORKFLOW.md.

# ==============================================================================
# PART 9 — Component Standards & Development Rules
# ==============================================================================

## 9.1 Purpose

Component Standards & Development Rules mendefinisikan standar implementasi yang wajib diikuti oleh seluruh UI Component pada Engineering Document Management System (EDMS) Rebuild.

Bagian ini bertujuan memastikan seluruh komponen memiliki kualitas implementasi yang konsisten, mudah dipelihara, mudah diuji, serta sesuai dengan arsitektur frontend yang telah ditetapkan.

Bagian ini tidak mendefinisikan standar penulisan kode secara umum. Aturan coding secara rinci dijelaskan pada CODING-STANDARDS.md.

---

## 9.2 Component Development Principles

Seluruh UI Component wajib mengikuti prinsip berikut.

### CDS-001 Single Responsibility

Satu komponen hanya memiliki satu tanggung jawab utama.

Komponen tidak diperbolehkan menangani lebih dari satu fungsi utama.

---

### CDS-002 Reusability

Komponen harus dapat digunakan kembali pada berbagai halaman tanpa modifikasi implementasi utama.

Perbedaan tampilan maupun perilaku harus dikendalikan menggunakan Props.

---

### CDS-003 Composability

Komponen harus dapat dikombinasikan menjadi komponen yang lebih besar tanpa mengubah perilaku dasarnya.

Halaman dibangun melalui komposisi berbagai reusable component.

---

### CDS-004 Predictability

Perilaku komponen harus konsisten pada seluruh aplikasi.

Komponen yang sama harus selalu memberikan perilaku yang sama.

---

### CDS-005 Visual Consistency

Seluruh komponen wajib mengikuti:

- UI-GUIDELINES.md
- Visual Design System
- Approved UI Mockup

---

## 9.3 Props Rules

Seluruh komponen menerima konfigurasi melalui Props.

Props digunakan untuk mengatur:

- Content
- Variant
- Size
- State
- Disabled
- Read Only
- Loading

Props tidak digunakan untuk menyimpan Business Logic.

---

## 9.4 State Rules

State harus ditempatkan sesuai tanggung jawabnya.

| State | Owner |
|--------|-------|
| UI Local State | Component |
| Form State | React Hook Form |
| Global UI State | Zustand |
| Server State | TanStack Query |
| Business Data | Service Layer |

Komponen tidak diperbolehkan menyimpan Business State yang bukan menjadi tanggung jawabnya.

---

## 9.5 Event Rules

Komponen hanya mengirimkan event kepada Parent Component.

Contoh event.

- onClick
- onChange
- onSubmit
- onCancel
- onClose
- onSearch
- onSelect

Komponen tidak menangani proses bisnis setelah event dikirimkan.

---

## 9.6 Business Logic Rules

Seluruh Business Logic berada di luar UI Component.

Business Logic ditempatkan pada:

- Service Layer
- Custom Hooks
- State Management
- API Layer

UI Component hanya menerima data dan menampilkan hasilnya.

Workflow yang berasal dari BUSINESS-WORKFLOW.md hanya memengaruhi perilaku tampilan komponen, bukan implementasi Business Logic di dalam komponen.

---

## 9.7 Performance Rules

Seluruh komponen wajib memperhatikan efisiensi render.

Prinsip yang harus dipenuhi.

- Hindari render yang tidak diperlukan.
- Hindari duplikasi komponen.
- Gunakan reusable component.
- Gunakan lazy rendering apabila diperlukan.
- Gunakan memoization apabila memberikan manfaat nyata.

Strategi optimasi harus tetap mempertahankan keterbacaan kode.

---

## 9.8 Accessibility Rules

Seluruh komponen wajib memenuhi standar aksesibilitas dasar.

Aturan yang harus dipenuhi.

- Mendukung navigasi menggunakan keyboard.
- Memiliki Focus State yang jelas.
- Menggunakan semantic HTML.
- Memiliki Label yang jelas untuk elemen interaktif.
- Tidak hanya mengandalkan warna sebagai penanda informasi.
- Tetap dapat digunakan pada berbagai ukuran layar.

---

## 9.9 Component Quality Checklist

Setiap UI Component harus memenuhi checklist berikut sebelum dinyatakan selesai.

| Checklist | Status |
|-----------|--------|
| Mengikuti UI-GUIDELINES.md | ☐ |
| Mengikuti Approved UI Mockup | ☐ |
| Bersifat Reusable | ☐ |
| Tidak mengandung Business Logic | ☐ |
| Responsive | ☐ |
| Accessible | ☐ |
| Menggunakan Props secara benar | ☐ |
| Menggunakan Event secara benar | ☐ |
| Tidak terdapat duplikasi implementasi | ☐ |
| Mudah dipelihara | ☐ |

---

## 9.10 Acceptance Criteria

Component Standards dinyatakan memenuhi standar apabila.

- Seluruh komponen mengikuti prinsip Single Responsibility.
- Seluruh komponen bersifat reusable.
- Props digunakan sebagai media konfigurasi komponen.
- Event hanya digunakan untuk komunikasi antarkomponen.
- Business Logic terpisah dari UI Component.
- Komponen memenuhi standar aksesibilitas dasar.
- Implementasi mengikuti ENGINEERING-FOUNDATION.md.
- Tampilan mengikuti UI-GUIDELINES.md.
- Seluruh komponen sesuai dengan Approved UI Mockup.

---

# End of PART 9

PART 9 mendefinisikan standar implementasi yang wajib diterapkan pada seluruh UI Component Engineering Document Management System (EDMS) Rebuild.

Seluruh komponen harus mengikuti prinsip arsitektur, pengelolaan state, penggunaan props, event, aksesibilitas, serta kualitas implementasi yang telah ditetapkan agar menghasilkan codebase yang konsisten, reusable, mudah dipelihara, dan selaras dengan Approved UI Mockup.

# ==============================================================================
# PART 10 — Component Acceptance Criteria
# ==============================================================================

## 10.1 Purpose

Component Acceptance Criteria mendefinisikan standar akhir yang harus dipenuhi sebelum suatu UI Component dinyatakan siap digunakan (Production Ready) pada Engineering Document Management System (EDMS) Rebuild.

Bagian ini berfungsi sebagai checklist resmi bagi Frontend Developer, QA Engineer, Technical Lead, dan AI Coding Agent untuk memastikan seluruh komponen telah memenuhi standar proyek.

---

## 10.2 Acceptance Scope

Acceptance Criteria berlaku untuk seluruh UI Component yang didefinisikan pada COMPONENT-SPEC.md, meliputi:

- Layout Components
- Navigation Components
- Display Components
- Form Components
- Feedback & Overlay Components
- Workflow Components
- Shared Components

Seluruh komponen wajib melalui proses verifikasi sebelum digunakan pada halaman aplikasi.

---

## 10.3 Functional Acceptance Criteria

Komponen dinyatakan memenuhi standar fungsional apabila:

| No | Criteria | Status |
|----|----------|--------|
| FAC-001 | Komponen menjalankan fungsi sesuai spesifikasi. | ☐ |
| FAC-002 | Seluruh State berfungsi dengan benar. | ☐ |
| FAC-003 | Seluruh Event bekerja sesuai kebutuhan. | ☐ |
| FAC-004 | Props diterapkan dengan benar. | ☐ |
| FAC-005 | Tidak terdapat Error pada proses interaksi pengguna. | ☐ |

---

## 10.4 Visual Acceptance Criteria

Komponen dinyatakan memenuhi standar visual apabila:

| No | Criteria | Status |
|----|----------|--------|
| VAC-001 | Tampilan sesuai Approved UI Mockup. | ☐ |
| VAC-002 | Mengikuti Visual Design System pada UI-GUIDELINES.md. | ☐ |
| VAC-003 | Menggunakan Typography yang konsisten. | ☐ |
| VAC-004 | Menggunakan Color Token yang benar. | ☐ |
| VAC-005 | Menggunakan Spacing yang konsisten. | ☐ |
| VAC-006 | Menggunakan Border Radius yang benar. | ☐ |
| VAC-007 | Menggunakan Icon yang konsisten. | ☐ |

---

## 10.5 Responsive Acceptance Criteria

Komponen dinyatakan memenuhi standar responsive apabila:

| No | Criteria | Status |
|----|----------|--------|
| RAC-001 | Berfungsi pada Desktop. | ☐ |
| RAC-002 | Berfungsi pada Tablet. | ☐ |
| RAC-003 | Berfungsi pada Mobile. | ☐ |
| RAC-004 | Tidak terjadi Layout Break. | ☐ |
| RAC-005 | Tidak terdapat Overflow yang tidak diinginkan. | ☐ |

---

## 10.6 Accessibility Acceptance Criteria

Komponen dinyatakan memenuhi standar aksesibilitas apabila:

| No | Criteria | Status |
|----|----------|--------|
| AAC-001 | Mendukung Keyboard Navigation. | ☐ |
| AAC-002 | Focus State terlihat dengan jelas. | ☐ |
| AAC-003 | Menggunakan Semantic HTML. | ☐ |
| AAC-004 | Label mudah dipahami pengguna. | ☐ |
| AAC-005 | Tidak hanya mengandalkan warna sebagai penanda informasi. | ☐ |

---

## 10.7 Engineering Acceptance Criteria

Komponen dinyatakan memenuhi standar engineering apabila:

| No | Criteria | Status |
|----|----------|--------|
| EAC-001 | Bersifat Reusable. | ☐ |
| EAC-002 | Mengikuti Single Responsibility Principle. | ☐ |
| EAC-003 | Tidak mengandung Business Logic. | ☐ |
| EAC-004 | Tidak melakukan Request API secara langsung. | ☐ |
| EAC-005 | Menggunakan struktur Props yang benar. | ☐ |
| EAC-006 | Menggunakan Event yang benar. | ☐ |
| EAC-007 | Mudah dipelihara dan dikembangkan. | ☐ |

---

## 10.8 Integration Acceptance Criteria

Komponen dinyatakan siap diintegrasikan dengan halaman aplikasi apabila:

| No | Criteria | Status |
|----|----------|--------|
| IAC-001 | Dapat digunakan pada lebih dari satu halaman. | ☐ |
| IAC-002 | Tidak memiliki ketergantungan terhadap halaman tertentu. | ☐ |
| IAC-003 | Dapat menerima data dari Service Layer. | ☐ |
| IAC-004 | Berfungsi bersama Zustand dan TanStack Query sesuai ENGINEERING-FOUNDATION.md. | ☐ |
| IAC-005 | Tidak memerlukan perubahan implementasi ketika digunakan kembali. | ☐ |

---

## 10.9 Production Ready Checklist

Sebelum dinyatakan selesai, setiap UI Component wajib memenuhi checklist berikut.

| Checklist | Status |
|-----------|--------|
| Mengikuti Approved UI Mockup | ☐ |
| Mengikuti UI-GUIDELINES.md | ☐ |
| Mengikuti ENGINEERING-FOUNDATION.md | ☐ |
| Mengikuti COMPONENT-SPEC.md | ☐ |
| Reusable | ☐ |
| Responsive | ☐ |
| Accessible | ☐ |
| Tidak mengandung Business Logic | ☐ |
| Tidak melakukan Request API | ☐ |
| Menggunakan Props dengan benar | ☐ |
| Menggunakan Event dengan benar | ☐ |
| Tidak terdapat duplikasi komponen | ☐ |
| Lolos proses QA Review | ☐ |

Komponen hanya dapat digunakan pada implementasi halaman apabila seluruh checklist telah terpenuhi.

---

## 10.10 Final Acceptance

UI Component dinyatakan **Production Ready** apabila memenuhi seluruh ketentuan berikut.

- Seluruh Acceptance Criteria telah terpenuhi.
- Tampilan sesuai Approved UI Mockup.
- Mengikuti Visual Design System pada UI-GUIDELINES.md.
- Mengikuti standar implementasi pada ENGINEERING-FOUNDATION.md.
- Mengikuti spesifikasi pada COMPONENT-SPEC.md.
- Tidak mengandung Business Logic.
- Dapat digunakan kembali pada berbagai modul aplikasi.
- Lulus proses Frontend Testing.
- Lulus QA Review.
- Siap digunakan pada proses integrasi Frontend dan Backend sesuai IMPLEMENTATION-PLAN.md.

---

# End of PART 10

PART 10 menetapkan standar akhir yang harus dipenuhi oleh seluruh UI Component sebelum dinyatakan **Production Ready**.

Seluruh komponen pada Engineering Document Management System (EDMS) Rebuild wajib memenuhi Acceptance Criteria yang telah ditetapkan pada bagian ini agar menghasilkan implementasi yang konsisten, berkualitas tinggi, mudah dipelihara, dan sesuai dengan Approved UI Mockup, UI-GUIDELINES.md, ENGINEERING-FOUNDATION.md, serta IMPLEMENTATION-PLAN.md.

---

# PHASE 2 SOURCE OF TRUTH SYNCHRONIZATION

## Current Implementation

Component runtime resmi meliputi AppShell, Sidebar, Header, Project Selector, ProtectedRoute, ProjectContextRoute, Data Table, Form, Modal/Dialog, Document Viewer, Notification Bell/List, SLA/Escalation Views, Audit Trail Views, dan Administration Views.

UI authorization wajib terjadi pada level route, menu, action button, dan action handler. Button Approval A/B/C hanya tampil apabila status dokumen, official role, project context, dan permission sesuai.

Component tidak menyimpan business rule sebagai sumber kebenaran. Business rule berasal dari constants, Service Layer, dan Source of Truth.

Placeholder component untuk Transmittal dan Storage NAS boleh tampil sebagai route/module placeholder, tetapi tidak boleh diperlakukan sebagai workflow operasional lengkap.

