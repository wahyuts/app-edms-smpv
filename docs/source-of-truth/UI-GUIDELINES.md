Source Documents

Primary

- Approved UI Design Mockup
- PRD.md

Engineering

- IMPLEMENTATION-PLAN.md
- ENGINEERING-FOUNDATION.md

Reference

- BUSINESS-WORKFLOW.md

# PART 1 — Document Overview

---

# 1.1 Purpose

UI-GUIDELINES.md mendefinisikan standar User Interface (UI) untuk Engineering Document Management System (EDMS).

Dokumen ini menerjemahkan kebutuhan yang didefinisikan pada PRD.md, ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, Approved UI Mockup, serta referensi BUSINESS-WORKFLOW.md menjadi pedoman visual yang wajib diikuti selama proses implementasi Frontend.

UI-GUIDELINES.md tidak mendefinisikan Business Rule, Workflow, API, maupun Database. Seluruh aturan bisnis tetap mengacu pada PRD.md dan dokumen Source of Truth lainnya.

---

# 1.2 Objectives

Dokumen ini memiliki tujuan sebagai berikut.

- Menjadi acuan resmi implementasi User Interface EDMS.
- Menjaga konsistensi visual pada seluruh module aplikasi.
- Mendefinisikan standar Layout, Navigation, Dashboard, Data Display, Form, Feedback, Responsive Design, dan Visual Consistency.
- Menjadi referensi implementasi Frontend berdasarkan Approved UI Mockup.
- Menjadi pedoman review UI sebelum proses Backend Integration.
- Menjadi acuan bagi Frontend Developer, QA Engineer, dan AI Coding Agent selama proses pengembangan.

---

# 1.3 Scope

Dokumen ini mencakup:

- Visual Design System
- Global Application Layout
- Navigation System
- Dashboard Guidelines
- Data Display Guidelines
- Form Guidelines
- Feedback & Interaction Guidelines
- Responsive Design Guidelines
- Visual Consistency Standards
- UI Acceptance Criteria

Dokumen ini tidak mencakup:

- Business Workflow
- API Contract
- Database Schema
- Backend Architecture
- Authentication Logic
- Authorization Logic
- State Management
- Component Technical Specification
- Form Technical Specification

---

# 1.4 Source Documents

Urutan referensi implementasi UI adalah sebagai berikut.

| Priority | Document | Description |
|----------|----------|-------------|
| 1 | Approved UI Mockup | **Visual Source of Truth** untuk Layout, Color, Typography, Iconography, Spacing, Visual Hierarchy, dan User Experience. |
| 2 | PRD.md | Source of Truth kebutuhan produk, fitur, workflow, permission, dan acceptance criteria. |
| 3 | IMPLEMENTATION-PLAN.md | Source of Truth implementasi Frontend dan Backend. |
| 4 | ENGINEERING-FOUNDATION.md | Source of Truth Technology Stack dan Engineering Rules. |
| 5 | BUSINESS-WORKFLOW.md | Referensi proses bisnis apabila diperlukan. |

Apabila terjadi konflik visual, **Approved UI Mockup menjadi acuan tertinggi**.

Seluruh implementasi Frontend wajib menghasilkan tampilan yang **semirip mungkin dengan Approved UI Mockup**. Perubahan visual hanya diperbolehkan apabila telah mendapatkan persetujuan resmi.

Apabila terjadi konflik perilaku sistem, **PRD.md** menjadi acuan utama.

---

# 1.5 UI Principles

Seluruh User Interface EDMS harus mengikuti prinsip berikut.

- **Mockup First** — Approved UI Mockup merupakan acuan utama implementasi visual.
- **Consistency** — Seluruh halaman memiliki tampilan dan perilaku yang seragam.
- **Information First** — Informasi penting harus mudah ditemukan dan dipahami.
- **Operational Efficiency** — UI mendukung aktivitas monitoring dan review dokumen secara cepat.
- **Role Awareness** — Action mengikuti Role, Permission, dan Workflow.
- **Reusable Components** — Seluruh halaman menggunakan reusable components.
- **Responsive Design** — Seluruh halaman dapat digunakan pada Desktop, Tablet, dan Mobile.

---

# 1.6 Visual Design System

Visual Design System merupakan standar identitas visual Engineering Document Management System (EDMS).

Seluruh implementasi Frontend wajib mengikuti standar berikut agar hasil akhir website semirip mungkin dengan Approved UI Mockup.

---

## 1.6.1 Color Tokens

| Token | HEX | Usage |
|--------|---------|----------------------------------------------|
| App Background | #020B16 | Background utama aplikasi. |
| Sidebar Background | #031528 | Background Sidebar Navigation. |
| Surface | #061B2F | Card, Panel, Table Container. |
| Surface Muted | #08233B | Input, Nested Panel, Secondary Surface. |
| Surface Hover | #0B2B47 | Hover State. |
| Border | #123A5A | Border Panel dan Divider. |
| Border Active | #0F7BFF | Active Border dan Focus Ring. |
| Primary | #0F7BFF | Primary Button, Active Navigation, Pagination. |
| Link | #00C8FF | Link, Document Number. |
| Success | #22C55E | Approved, Success, On Track. |
| Warning | #FACC15 | Warning, At Risk. |
| Process | #F97316 | Process Review, Process Comment, Project Comment. |
| Danger | #EF4444 | Process Reject, Project Reject, Overdue, Error, Escalation. |
| History | #6D3FD6 | History Button. |
| Text Primary | #F8FAFC | Heading dan informasi utama. |
| Text Secondary | #CBD5E1 | Label dan Body Text. |
| Text Muted | #94A3B8 | Placeholder dan Disabled Text. |

Implementasi warna wajib mengikuti token di atas.

---

## 1.6.2 Semantic Colors

| Status Domain | Status | Color |
|---------|---------|---------|
| Dashboard Metric | Total Documents | Primary |
| Workflow Status | Process Review | Warning |
| Workflow Status | Process Comment | Process |
| Workflow Status | Process Reject | Danger |
| Workflow Status | Project Review | Warning |
| Workflow Status | Project Comment | Process |
| Workflow Status | Project Reject | Danger |
| Workflow Status | Approved | Success |
| SLA Status | On Track | Success |
| SLA Status | At Risk | Warning |
| SLA Status | Overdue | Danger |
| SLA Status | Final As-Built | Success |

Semantic Color tidak boleh digunakan untuk arti yang berbeda.
Workflow Status dan SLA Status tidak boleh digabung menjadi satu label.

---

## 1.6.3 Typography Scale

| Element | Size | Weight |
|----------|------|--------|
| App Logo | 28px | 800 |
| Page Title | 28px | 700 |
| Section Title | 20px | 700 |
| Card Title | 14px | 600 |
| Metric Number | 36px | 800 |
| Table Header | 12px | 700 |
| Body Text | 14px | 400–500 |
| Caption | 12px | 400 |

Typography harus digunakan secara konsisten pada seluruh aplikasi.

---

## 1.6.4 Spacing Scale

Seluruh Layout menggunakan sistem spacing berbasis **4px Grid**.

| Token | Value |
|--------|-------|
| Space-1 | 4px |
| Space-2 | 8px |
| Space-3 | 12px |
| Space-4 | 16px |
| Space-5 | 20px |
| Space-6 | 24px |
| Space-8 | 32px |

Whitespace harus tetap terjaga agar Dashboard mudah dibaca tanpa mengurangi kepadatan informasi.

---

## 1.6.5 Border Radius

| Component | Radius |
|-----------|--------|
| Card | 8px |
| Panel | 8px |
| Button | 6px |
| Input | 6px |
| Icon Button | 6px |
| Badge | 6px |

Seluruh Border Radius harus digunakan secara konsisten.

---

## 1.6.6 Shadow

Shadow digunakan secara minimal.

- Digunakan untuk memisahkan layer antar Panel.
- Tidak digunakan sebagai elemen dekoratif.
- Menggunakan Shadow yang halus sesuai Approved UI Mockup.

---

## 1.6.7 Icon System

Seluruh aplikasi menggunakan **Lucide React** sebagai Icon Library.

Aturan penggunaan icon.

- Menggunakan satu gaya icon yang konsisten.
- Icon harus merepresentasikan fungsi dengan jelas.
- Tidak menggunakan icon dengan arti yang berbeda untuk fungsi yang sama.
- Icon mengikuti ukuran yang konsisten pada seluruh halaman.

---

# End of PART 1

PART 1 mendefinisikan tujuan dokumen, ruang lingkup, referensi utama, prinsip desain, serta Visual Design System yang menjadi fondasi seluruh User Interface Engineering Document Management System (EDMS).

Seluruh implementasi Frontend wajib menghasilkan tampilan yang **semirip mungkin dengan Approved UI Mockup**, menggunakan Visual Design System yang telah didefinisikan pada PART 1 sebagai acuan utama.

---


# PART 2 — Global Layout System

---

# 2.1 Purpose

Global Layout System mendefinisikan struktur tata letak utama (Global Application Layout) yang digunakan oleh seluruh halaman Engineering Document Management System (EDMS).

Tujuan utama bagian ini adalah memastikan seluruh module menggunakan struktur layout yang konsisten sehingga pengguna memperoleh pengalaman penggunaan yang seragam, sedangkan Frontend Developer maupun AI Coding Agent memiliki acuan implementasi yang sama.

Seluruh halaman setelah pengguna berhasil login wajib menggunakan Global Layout yang didefinisikan pada bagian ini.

---

# 2.2 Layout Philosophy

Engineering Document Management System (EDMS) menggunakan konsep **Persistent Application Layout**.

Setelah pengguna berhasil Login, struktur utama aplikasi tidak berubah.

Perpindahan menu hanya mengganti isi **Main Content Area**, sedangkan elemen global seperti Sidebar Navigation, Top Navigation, dan Footer tetap dipertahankan.

Pendekatan ini memberikan pengalaman navigasi yang konsisten serta mempermudah implementasi reusable layout pada Frontend.

---

# 2.3 Global Application Wireframe

Seluruh halaman utama EDMS menggunakan struktur layout berikut.

```text
+-----------------------------+--------------------------------------------------------------+
| SIDEBAR HEADER              | TOP NAVIGATION                                               |
| Company Logo / BIM EDMS     |              Active Project | User + Role | Notification Icon |
+-----------------------------+--------------------------------------------------------------+
|                             |                                                              |
|                             |                                                              |
| Sidebar Navigation          |                   Main Content Area                          |
|                             |                                                              |
|                             |                                                              |
|                             |                                                              |
|                             |                                                              |
|                             |                                                              |
+-----------------------------+--------------------------------------------------------------+
| SIDEBAR FOOTER              | Footer                                                       |
| Collapse Menu Button (<<)   |                                                              |
+-----------------------------+--------------------------------------------------------------+

```

Wireframe di atas menggambarkan struktur global aplikasi.

Setiap module hanya mengganti isi **Main Content Area** tanpa mengubah struktur layout utama.

---

# 2.4 Layout Regions

Global Application Layout terdiri dari empat region utama.

| Region | Description |
|---------|-------------|
| Top Navigation | Area global yang menampilkan Active Project, User Profile dengan Role, dan Notification. |
| Sidebar Navigation | Navigasi utama menuju seluruh module EDMS. |
| Main Content Area | Area kerja utama yang berubah sesuai module yang aktif. |
| Application Footer | Area informasi global pada bagian bawah aplikasi. |

---

# 2.5 Layout Behaviour

Seluruh halaman wajib mengikuti perilaku berikut.

- Sidebar Navigation selalu tampil setelah Login.
- Top Navigation selalu tampil pada seluruh halaman.
- Footer selalu berada pada bagian bawah aplikasi.
- Main Content Area berubah sesuai menu yang dipilih.
- Perpindahan menu tidak mengubah struktur layout.
- Seluruh module menggunakan Global Application Layout yang sama.

---

# 2.6 Responsive Behaviour

Global Layout harus mampu beradaptasi terhadap berbagai ukuran layar.

### Desktop

- Sidebar tampil penuh.
- Top Navigation tampil penuh.
- Main Content menggunakan ruang kerja maksimum.

### Tablet

- Sidebar dapat di-collapse.
- Main Content menyesuaikan lebar layar.
- Grid mengikuti ruang yang tersedia.

### Mobile

- Sidebar berubah menjadi Drawer Navigation.
- Main Content menggunakan lebar penuh.
- Komponen disusun secara vertikal.
- Horizontal scrolling hanya diperbolehkan pada komponen tabel apabila diperlukan.

---

# 2.7 Layout Rules

Seluruh halaman wajib memenuhi aturan berikut.

- Menggunakan Global Application Layout yang sama.
- Tidak mengubah posisi Sidebar Navigation.
- Tidak mengubah posisi Top Navigation.
- Tidak mengubah posisi Footer.
- Menjaga konsistensi Grid Layout.
- Menjaga konsistensi jarak antar section.
- Menjaga konsistensi visual hierarchy.
- Tidak membuat layout khusus tanpa kebutuhan bisnis yang jelas.

---

# 2.8 Special Layout

Beberapa halaman memiliki perlakuan khusus.

## Login Page

Login Page tidak menggunakan Global Application Layout.

Halaman Login menggunakan Authentication Layout sesuai desain yang telah disetujui.

---

## Under Development Page

Halaman seperti **Transmittal** tetap menggunakan Global Application Layout.

Yang berubah hanya Main Content Area dengan menampilkan informasi berikut.

> This feature is currently under development.

Sidebar, Top Navigation, dan Footer tetap menggunakan Global Layout.

---

# 2.9 Acceptance Criteria

Global Layout System dinyatakan selesai apabila:

- Seluruh halaman menggunakan Global Application Layout yang sama.
- Sidebar Navigation konsisten pada seluruh module.
- Top Navigation konsisten pada seluruh module.
- Footer konsisten pada seluruh module.
- Main Content Area berubah sesuai module yang aktif.
- Layout sesuai dengan Approved UI Mockup.
- Layout dapat digunakan pada Desktop, Tablet, dan Mobile.

---

# End of PART 2

PART 2 mendefinisikan struktur Global Application Layout yang menjadi fondasi seluruh halaman Engineering Document Management System (EDMS).

Seluruh guideline pada PART berikutnya wajib mengikuti struktur layout yang telah didefinisikan pada bagian ini.

# PART 3 — Navigation System

---

# 3.1 Purpose

Navigation System mendefinisikan standar navigasi yang digunakan pada seluruh halaman Engineering Document Management System (EDMS).

Tujuan utama bagian ini adalah memastikan seluruh proses perpindahan halaman berlangsung secara konsisten, mudah dipahami, serta memberikan pengalaman penggunaan yang seragam pada seluruh module aplikasi.

Navigation System hanya mengatur perilaku antarmuka pengguna (User Interface) dan tidak mengatur Business Workflow maupun Authorization Logic.

---

# 3.2 Navigation Structure

Seluruh navigasi aplikasi mengikuti struktur berikut.

```text
Sidebar Navigation

├── Dashboard

├── Document Register
│   ├── PFD
│   └── P&ID

├── Transmittal
│   ├── Incoming
│   └── Outgoing

├── SLA Monitoring

├── Escalation

├── Audit Trail

├── Storage NAS

└── Notifications
```

Seluruh menu ditampilkan pada Sidebar Navigation sesuai struktur navigasi aplikasi yang telah disetujui.

---

# 3.3 Navigation Components

Navigation System terdiri dari beberapa komponen utama.

| Component | Description |
|-----------|-------------|
| Sidebar Navigation | Navigasi utama menuju seluruh module EDMS. |
| Parent Menu | Menu yang memiliki submenu. |
| Child Menu | Menu turunan yang berada di bawah Parent Menu. |
| Active Menu | Menunjukkan halaman yang sedang dibuka. |
| Expand / Collapse Menu | Digunakan untuk membuka atau menutup submenu. |
| Collapse Sidebar Button | Digunakan untuk memperkecil atau memperbesar Sidebar. |
| Top Navigation | Area global yang menampilkan Notification dan User Profile. |

---

# 3.4 Navigation Behaviour

Seluruh navigasi mengikuti perilaku berikut.

- Klik pada menu tanpa submenu akan langsung membuka halaman tujuan.
- Klik pada Parent Menu akan menampilkan atau menyembunyikan submenu.
- Hanya satu halaman yang dapat berstatus **Active** pada waktu yang sama.
- Active Menu harus tetap terlihat meskipun Sidebar di-scroll.
- Perpindahan menu hanya mengubah **Main Content Area**.
- Sidebar, Top Navigation, dan Footer tidak berubah selama navigasi.
- Status Expand / Collapse Sidebar dipertahankan selama sesi pengguna berlangsung.
- Sidebar Navigation tidak boleh menampilkan horizontal scroll.
- Sidebar Navigation dapat menggunakan vertical scroll apabila tinggi menu melebihi viewport.
- Pada kondisi Sidebar Collapse, Parent Menu dengan Child Menu ditampilkan sebagai Flyout Menu di sisi kanan Sidebar.
- Flyout Menu tidak boleh terpotong oleh area scroll Sidebar dan tidak boleh mengubah lebar Main Content Area.

---

# 3.5 Active Navigation Rules

Untuk membantu orientasi pengguna, sistem wajib memberikan indikator visual terhadap menu yang sedang aktif.

Aturan yang harus dipenuhi:

- Parent Menu aktif apabila salah satu Child Menu sedang aktif.
- Child Menu aktif menggunakan visual yang berbeda dari Parent Menu.
- Active Menu harus tetap terlihat jelas pada seluruh ukuran layar.
- Menu yang tidak aktif tidak boleh menggunakan gaya visual Active.

---

# 3.6 Navigation Interaction

Setiap komponen navigasi memiliki perilaku interaksi sebagai berikut.

### Sidebar Navigation

- Mendukung Expand dan Collapse.
- Mendukung Nested Menu.
- Mendukung Active State.
- Tidak berubah posisi selama pengguna berpindah halaman.
- Pada kondisi Collapse, Nested Menu tetap dapat diakses melalui Flyout Menu di sisi kanan Sidebar.
- Area Navigation Menu dapat di-scroll secara vertical tanpa mengaktifkan horizontal scroll.

---

### Top Navigation

- Active Project Selector menjadi elemen utama pada Header.
- Active Project Selector menampilkan label `ACTIVE PROJECT`, Project Name, dan Project Code.
- Area User menampilkan nama User dan label `Role`.
- Notification menggunakan icon lonceng dengan unread badge.
- Urutan komponen kanan adalah Active Project, User + Role, lalu Notification.
- Pada Desktop dan Tablet lebar, ketiga komponen kanan tetap berjajar horizontal.
- Notification dapat dipilih untuk membuka halaman Notification.
- User Profile membuka menu akun pengguna.
- Seluruh aksi dilakukan tanpa mengubah struktur Global Layout.

---

### Collapse Sidebar

Ketika tombol Collapse Sidebar dipilih:

- Sidebar diperkecil.
- Icon menu tetap terlihat.
- Main Content Area menyesuaikan lebar yang tersedia.
- Struktur halaman tidak berubah.

---

# 3.7 Navigation Consistency Rules

Seluruh halaman wajib memenuhi aturan berikut.

- Menggunakan struktur navigasi yang sama.
- Menggunakan urutan menu yang sama.
- Menggunakan icon yang konsisten.
- Menggunakan Active State yang konsisten.
- Tidak mengubah posisi menu tanpa perubahan desain yang disetujui.
- Seluruh halaman dapat diakses melalui Sidebar Navigation.

---

# 3.8 Special Navigation

Beberapa menu memiliki perilaku khusus.

### Document Register

Merupakan Parent Menu yang memiliki submenu:

- PFD
- P&ID

---

### Transmittal

Merupakan Parent Menu yang memiliki submenu:

- Incoming
- Outgoing

Saat ini kedua submenu hanya menampilkan halaman informasi:

> **This feature is currently under development.**

Global Application Layout tetap digunakan sebagaimana didefinisikan pada PART 2.

---

### Notification

Notification dapat diakses melalui:

- Top Navigation
- Sidebar Navigation

Kedua akses tersebut mengarah ke halaman Notification yang sama.

---

# 3.9 Acceptance Criteria

Navigation System dinyatakan selesai apabila:

- Seluruh menu sesuai dengan Approved UI Mockup.
- Struktur Sidebar sesuai dengan Navigation Structure.
- Parent Menu dan Child Menu berfungsi dengan benar.
- Active Menu ditampilkan secara konsisten.
- Sidebar dapat di-Expand dan di-Collapse.
- Main Content Area berubah sesuai menu yang dipilih.
- Global Layout tetap dipertahankan selama proses navigasi.
- Halaman Placeholder Transmittal menampilkan pesan **"This feature is currently under development."** sesuai ketentuan proyek.

---

# End of PART 3

PART 3 mendefinisikan struktur, perilaku, dan aturan navigasi yang digunakan pada seluruh halaman Engineering Document Management System (EDMS).

Seluruh implementasi navigasi pada Frontend wajib mengikuti pedoman ini agar menghasilkan pengalaman pengguna yang konsisten dan selaras dengan Global Layout System yang telah ditetapkan pada PART 2.

# PART 4 — Dashboard Guidelines

---

# 4.1 Purpose

Dashboard merupakan halaman utama Engineering Document Management System (EDMS) yang memberikan ringkasan kondisi proyek, status dokumen, serta informasi operasional yang paling penting.

Dashboard harus menjadi halaman pertama yang dilihat pengguna setelah berhasil Login dan mampu memberikan gambaran umum mengenai kondisi seluruh dokumen engineering tanpa harus membuka module lain.

Bagian ini hanya mendefinisikan tata letak, hirarki visual, dan perilaku antarmuka Dashboard. Seluruh Business Rules tetap mengacu pada PRD.md dan BUSINESS-WORKFLOW.md.

---

# 4.2 Dashboard Layout Philosophy

Dashboard menggunakan pendekatan **Information First Layout**.

Informasi yang paling penting harus ditempatkan pada area yang paling mudah dilihat pengguna.

Urutan prioritas informasi adalah sebagai berikut.

1. Dashboard Header
2. Summary Cards
3. Document Register
4. SLA Overview (Label di frontend adalah Review Time Overview)
5. Escalation Alert

Urutan tersebut harus dipertahankan pada seluruh ukuran layar.

---

# 4.3 Dashboard Wireframe

Dashboard menggunakan struktur layout berikut.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Dashboard Header                                                                                                                           │
│ BIM Engineering / Dashboard                                                                                                                │
│ Monitoring utama seluruh dokumen engineering berdasarkan alur review Code A/B/C.                                                          │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                                            │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐                      │
│  │ Summary Card 1 │ │ Summary Card 2 │ │ Summary Card 3 │ │ Summary Card 4 │ │ Summary Card 5 │ │ Summary Card 6 │                      │
│  │                │ │                │ │                │ │                │ │                │ │                │                      │
│  └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘                      │
│                                                                                                                                            │
├──────────────────────────────────────────────────────────────────────────────────────┬───────────────────────────────────────────────────────┤
│                                                                                      │                                                       │
│                                                                                      │                 SLA Overview                         │
│                                                                                      │                                                       │
│                                                                                      ├───────────────────────────────────────────────────────┤
│                                                                                      │                                                       │
│                     Document Register Table                                          │               Escalation Alert                       │
│                                                                                      │                                                       │
│                                                                                      │                                                       │
│                                                                                      │                                                       │
│                                                                                      │                                                       │
│                                                                                      │                                                       │
├──────────────────────────────────────────────────────────────────────────────────────┴───────────────────────────────────────────────────────┤
│ Pagination                                                                                                                                │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Wireframe di atas menggambarkan struktur visual Dashboard berdasarkan Approved UI Mockup.

Summary Cards menggunakan **enam kolom dengan lebar yang seimbang** dan ditempatkan pada satu baris penuh sebagai ringkasan informasi utama.

Document Register Table menjadi area kerja utama Dashboard, sedangkan SLA Overview dan Escalation Alert ditempatkan pada panel kanan sebagai informasi pendukung.

Implementasi visual wajib mengikuti proporsi dan hierarki informasi yang telah ditetapkan pada Approved UI Mockup.

---

# 4.4 Dashboard Regions

Dashboard terdiri dari beberapa region utama.

| Region | Description |
|---------|-------------|
| Dashboard Header | Menampilkan nama halaman dan deskripsi singkat Dashboard. |
| Summary Cards | Menampilkan ringkasan statistik utama dokumen engineering. |
| Document Register Table | Menampilkan daftar dokumen beserta informasi utama setiap dokumen. |
| SLA Overview | Menampilkan ringkasan kondisi SLA dokumen. |
| Escalation Alert | Menampilkan daftar dokumen yang memerlukan perhatian segera. |
| Pagination | Digunakan untuk berpindah halaman pada Document Register Table. |

---

# 4.5 Visual Hierarchy

Dashboard harus mempertahankan hirarki visual berikut.

- Dashboard Header selalu berada pada bagian paling atas.
- Summary Cards berada tepat di bawah Dashboard Header.
- Document Register menjadi area utama Dashboard.
- SLA Overview berada di sisi kanan Document Register.
- Escalation Alert berada di bawah SLA Overview.
- Pagination berada di bawah Document Register.

Tidak diperbolehkan mengubah urutan region tanpa perubahan desain yang telah disetujui.

---

# 4.6 Dashboard Interaction

Dashboard mendukung interaksi berikut.

- Summary Cards dapat dipilih apabila memiliki fungsi navigasi.
- Summary Cards Dashboard dapat dipilih sebagai Workflow Status Filter untuk Document Register pada Active Project yang sama.
- Summary Card yang aktif harus memiliki active state visual yang berbeda dari hover state.
- Document Register mendukung Search, Filter, Sort, dan Pagination.
- Filter Status Document Register harus sinkron dengan Summary Card Dashboard yang sedang aktif.
- SLA Overview bersifat informatif.
- Escalation Alert dapat digunakan untuk membuka informasi detail apabila tersedia.
- Seluruh interaksi hanya mengubah Main Content Area.

---

# 4.7 Responsive Behaviour

Dashboard harus mempertahankan urutan informasi pada seluruh ukuran layar.

### Desktop

- Summary Cards ditampilkan dalam satu baris.
- Document Register berada di sisi kiri.
- SLA Overview dan Escalation Alert berada di sisi kanan.

### Tablet

- Summary Cards dapat dibagi menjadi beberapa baris.
- Right Panel ditempatkan di bawah Document Register apabila ruang tidak mencukupi.

### Mobile

- Seluruh region ditampilkan secara vertikal.
- Summary Cards ditampilkan bertumpuk.
- Document Register menggunakan horizontal scrolling apabila diperlukan.

---

# 4.8 Dashboard Rules

Dashboard wajib memenuhi aturan berikut.

- Mengikuti struktur layout pada Dashboard Wireframe.
- Mengikuti Approved UI Mockup.
- Menggunakan reusable component.
- Menampilkan informasi secara ringkas.
- Menjaga konsistensi visual dengan halaman lain.
- Tidak menampilkan informasi yang tidak didefinisikan pada PRD.

---

# 4.9 Acceptance Criteria

Dashboard dinyatakan memenuhi UI Guideline apabila:

- Layout sesuai Approved UI Mockup.
- Seluruh region berada pada posisi yang benar.
- Hirarki visual dipertahankan.
- Dashboard responsif pada Desktop, Tablet, dan Mobile.
- Seluruh komponen tampil konsisten dengan UI-GUIDELINES.md.
- Tidak terdapat perubahan visual yang bertentangan dengan desain yang telah disetujui.

---

# End of PART 4

PART 4 mendefinisikan tata letak, hirarki visual, dan aturan antarmuka Dashboard sebagai halaman utama Engineering Document Management System (EDMS).

Seluruh implementasi Dashboard wajib mengikuti pedoman ini agar menghasilkan tampilan yang konsisten dengan Approved UI Mockup.

# PART 5 — Data Display Guidelines

---

# 5.1 Purpose

Data Display Guidelines mendefinisikan standar penyajian informasi pada seluruh halaman Engineering Document Management System (EDMS).

Tujuan utama bagian ini adalah memastikan seluruh data ditampilkan secara konsisten, mudah dibaca, mudah dipahami, serta mempertahankan hierarki visual yang sesuai dengan Approved UI Mockup.

Bagian ini hanya mengatur bagaimana data ditampilkan pada User Interface dan tidak mengatur Business Logic maupun struktur data Backend.

---

# 5.2 Data Display Philosophy

Seluruh informasi pada EDMS harus mengikuti prinsip berikut.

- Menampilkan informasi yang relevan.
- Memprioritaskan keterbacaan.
- Mengurangi visual yang tidak diperlukan.
- Menggunakan struktur informasi yang konsisten.
- Mempermudah pengguna menemukan informasi penting.

Data harus disusun berdasarkan prioritas informasi, bukan berdasarkan jumlah informasi.

---

# 5.3 Display Components

Seluruh penyajian data pada aplikasi menggunakan komponen berikut.

| Component | Purpose |
|-----------|---------|
| Summary Card | Menampilkan ringkasan informasi utama. |
| Data Table | Menampilkan daftar data dalam bentuk tabel. |
| Badge | Menampilkan status atau kategori data. |
| Label | Menampilkan informasi singkat yang tidak memerlukan interaksi. |
| Icon | Membantu identifikasi aksi maupun status. |
| Pagination | Mengelola perpindahan halaman data. |

---

# 5.4 Summary Cards

Summary Cards digunakan sebagai ringkasan informasi utama pada Dashboard.

Aturan yang harus dipenuhi.

- Seluruh Summary Cards memiliki ukuran visual yang konsisten.
- Seluruh Summary Cards menggunakan tinggi yang sama.
- Seluruh Summary Cards disusun dalam satu baris pada Desktop.
- Informasi utama ditempatkan pada bagian tengah Card.
- Judul Card mudah dibaca.
- Nilai utama memiliki visual yang paling dominan.

---

# 5.5 Data Table

Data Table merupakan media utama penyajian data pada EDMS.

Seluruh tabel wajib memenuhi ketentuan berikut.

- Menggunakan struktur kolom yang konsisten.
- Header tabel selalu tampil pada bagian atas.
- Setiap baris hanya merepresentasikan satu data.
- Informasi ditampilkan secara horizontal.
- Seluruh kolom memiliki alignment yang konsisten.
- Data tidak boleh saling bertumpuk.
- Kolom Action selalu berada pada sisi kanan tabel.

---

# 5.6 Status Display

Status dokumen maupun status lainnya ditampilkan menggunakan Badge.

Aturan yang harus dipenuhi.

- Setiap status memiliki Badge yang konsisten.
- Badge mudah dibedakan secara visual.
- Status selalu menggunakan istilah yang sama dengan PRD.
- Badge tidak digunakan sebagai tombol kecuali memang memiliki fungsi interaksi.

---

# 5.7 Action Display

Seluruh aksi pada Data Table ditampilkan menggunakan icon atau button yang konsisten.

Aturan yang harus dipenuhi.

- Action ditempatkan pada kolom paling kanan.
- Icon menggunakan gaya visual yang sama.
- Jarak antar Action konsisten.
- Action yang tidak tersedia tidak ditampilkan kepada pengguna.
- History Button menggantikan Action Review ketika **Workflow Status = Approved**, sesuai ketentuan pada PRD.
History Button tidak bergantung pada SLA Status `Final As-Built`.

---

# 5.8 Empty State

Apabila tidak terdapat data yang dapat ditampilkan.

Sistem wajib:

- Menampilkan Empty State.
- Menampilkan informasi yang mudah dipahami pengguna.
- Tetap mempertahankan struktur halaman.
- Tidak menghilangkan Header maupun Toolbar.

---

# 5.9 Loading State

Selama proses pengambilan data.

Sistem wajib:

- Menampilkan Loading Indicator.
- Mempertahankan struktur layout.
- Menghindari perpindahan layout yang mengganggu pengguna.

---

# 5.10 Data Consistency Rules

Seluruh halaman wajib memenuhi aturan berikut.

- Menggunakan struktur Data Table yang konsisten.
- Menggunakan Badge yang konsisten.
- Menggunakan Icon yang konsisten.
- Menggunakan alignment yang konsisten.
- Menggunakan spacing yang konsisten.
- Menggunakan typography yang konsisten.
- Tidak mengubah urutan informasi tanpa kebutuhan bisnis yang jelas.

---

# 5.11 Acceptance Criteria

Data Display dinyatakan memenuhi UI Guideline apabila:

- Seluruh Summary Cards konsisten.
- Seluruh Data Table mengikuti struktur yang sama.
- Seluruh Badge konsisten.
- Seluruh Action berada pada posisi yang benar.
- Empty State ditampilkan dengan benar.
- Loading State ditampilkan dengan benar.
- Layout tetap sesuai Approved UI Mockup.
- Informasi mudah dibaca pada Desktop, Tablet, dan Mobile.

---

# End of PART 5

PART 5 mendefinisikan standar penyajian data pada seluruh halaman Engineering Document Management System (EDMS).

Seluruh implementasi Summary Cards, Data Table, Badge, Action, Loading State, dan Empty State wajib mengikuti pedoman pada bagian ini agar menghasilkan tampilan yang konsisten, mudah dipahami, dan selaras dengan Approved UI Mockup.

# PART 6 — Form Guidelines

---

# 6.1 Purpose

Form Guidelines mendefinisikan standar tampilan dan perilaku seluruh Form pada Engineering Document Management System (EDMS).

Tujuan utama bagian ini adalah memastikan seluruh Form memiliki struktur, tata letak, dan pengalaman penggunaan yang konsisten sehingga pengguna dapat memasukkan maupun memperbarui data dengan mudah.

Bagian ini hanya mengatur User Interface dan User Experience dari Form. Seluruh struktur field, validasi, serta Business Rules dijelaskan pada FORM-SPEC.md dan PRD.md.

---

# 6.2 Form Philosophy

Seluruh Form pada EDMS harus mengikuti prinsip berikut.

- Sederhana.
- Konsisten.
- Mudah dipahami.
- Mudah digunakan.
- Memberikan umpan balik yang jelas kepada pengguna.

Informasi yang wajib diisi harus mudah dikenali tanpa mengurangi keterbacaan Form secara keseluruhan.

---

# 6.3 Form Layout

Seluruh Form wajib menggunakan struktur layout yang konsisten.

```text
Page Header

↓

Form Section

↓

Form Fields

↓

Action Area
```

Apabila Form memiliki banyak informasi, maka Form dapat dibagi menjadi beberapa Section yang memiliki judul yang jelas.

---

# 6.4 Form Components

Seluruh Form menggunakan komponen berikut.

| Component | Purpose |
|-----------|---------|
| Text Field | Input data berbentuk teks. |
| Text Area | Input data dengan isi lebih panjang. |
| Select | Memilih satu nilai dari daftar pilihan. |
| Date Picker | Memilih tanggal. |
| Read Only Field | Menampilkan informasi yang tidak dapat diubah pengguna. |
| Button | Menjalankan aksi pada Form. |

Jenis komponen lain dapat digunakan apabila memang diperlukan oleh kebutuhan bisnis.

Select Dropdown wajib menampilkan maksimal 5 opsi sekaligus.

Apabila jumlah opsi lebih dari 5:

- Dropdown menggunakan vertical scroll.
- Seluruh opsi tetap tersedia dan dapat dipilih.
- Horizontal scroll tidak digunakan.
- Tinggi dropdown tidak boleh menyebabkan item terpotong.

---

# 6.5 Field Presentation

Seluruh field wajib memenuhi aturan berikut.

- Label selalu ditampilkan di atas field.
- Label mudah dibaca.
- Field memiliki ukuran yang konsisten.
- Jarak antar field konsisten.
- Placeholder hanya digunakan sebagai petunjuk tambahan.
- Placeholder tidak menggantikan Label.

---

# 6.6 Read Only Field

Beberapa informasi hanya ditampilkan sebagai informasi dan tidak dapat diubah oleh pengguna.

Contoh informasi Read Only.

- Username
- Department
- Official Role

Read Only Field harus tetap memiliki tampilan yang konsisten dengan field lainnya, namun tidak dapat menerima perubahan dari pengguna.

---

# 6.7 Form Actions

Area aksi selalu ditempatkan pada bagian bawah Form.

Aturan yang harus dipenuhi.

- Primary Action ditampilkan paling menonjol.
- Secondary Action menggunakan visual yang berbeda.
- Urutan tombol harus konsisten pada seluruh aplikasi.
- Action yang tidak tersedia tidak boleh ditampilkan.

---

# 6.8 Validation Display

Apabila terjadi kesalahan pengisian.

Sistem wajib:

- Menampilkan pesan validasi di dekat field yang bermasalah.
- Memberikan indikator visual pada field.
- Mempertahankan data yang telah diisi pengguna.
- Tidak menghapus seluruh Form.

Aturan validasi secara rinci dijelaskan pada FORM-SPEC.md.

---

# 6.9 Form Consistency Rules

Seluruh Form wajib memenuhi aturan berikut.

- Menggunakan layout yang konsisten.
- Menggunakan ukuran field yang konsisten.
- Menggunakan alignment yang konsisten.
- Menggunakan typography yang konsisten.
- Menggunakan spacing yang konsisten.
- Menggunakan Button Style yang konsisten.
- Menggunakan Read Only Field yang konsisten.

---

# 6.10 Acceptance Criteria

Form dinyatakan memenuhi UI Guideline apabila:

- Layout Form konsisten pada seluruh module.
- Seluruh Label tampil dengan benar.
- Seluruh Field memiliki alignment yang konsisten.
- Read Only Field ditampilkan sesuai kebutuhan.
- Action Area berada pada posisi yang konsisten.
- Validation Message ditampilkan dengan jelas.
- Form tetap mudah digunakan pada Desktop, Tablet, dan Mobile.
- Tampilan Form sesuai dengan Approved UI Mockup.

---

# End of PART 6

PART 6 mendefinisikan standar tata letak, penyajian, dan perilaku User Interface pada seluruh Form Engineering Document Management System (EDMS).

Seluruh implementasi Form wajib mengikuti pedoman pada bagian ini agar menghasilkan pengalaman penggunaan yang konsisten, mudah dipahami, dan selaras dengan Approved UI Mockup.

# PART 7 — Feedback & Interaction Guidelines

---

# 7.1 Purpose

Feedback & Interaction Guidelines mendefinisikan standar interaksi antara pengguna dan Engineering Document Management System (EDMS).

Tujuan utama bagian ini adalah memastikan setiap aksi yang dilakukan pengguna selalu mendapatkan umpan balik (Feedback) yang jelas, konsisten, dan mudah dipahami.

Bagian ini hanya mengatur perilaku User Interface dan tidak mengatur Business Logic maupun proses Backend.

---

# 7.2 Interaction Philosophy

Seluruh interaksi pada EDMS harus mengikuti prinsip berikut.

- Memberikan respon terhadap setiap aksi pengguna.
- Menghindari kebingungan pengguna.
- Memberikan informasi yang jelas mengenai hasil suatu aksi.
- Menjaga konsistensi pengalaman pengguna pada seluruh module.
- Mengurangi kemungkinan kesalahan penggunaan.

Setiap aksi harus memiliki feedback yang dapat dipahami pengguna.

---

# 7.3 User Interaction

Seluruh interaksi pengguna mengikuti pola berikut.

```text
User Action

↓

System Processing

↓

Visual Feedback

↓

Updated Interface
```

Pengguna harus mengetahui bahwa sistem sedang memproses maupun telah menyelesaikan suatu aksi.

---

# 7.4 Button Interaction

Seluruh Button pada aplikasi wajib memenuhi aturan berikut.

- Memberikan visual feedback ketika dipilih.
- Memiliki keadaan Default, Hover, Active, Focus, dan Disabled.
- Menggunakan gaya visual yang konsisten.
- Tidak mengubah posisi layout ketika dipilih.
- Menampilkan Loading State apabila proses membutuhkan waktu.

---

# 7.5 Dialog Interaction

Dialog digunakan untuk aksi yang memerlukan perhatian atau konfirmasi dari pengguna.

Contoh penggunaan.

- Delete Confirmation
- Logout Confirmation
- Cancel Confirmation
- Important Warning

Dialog harus muncul di atas halaman aktif tanpa mengubah struktur Global Layout.

---

# 7.6 Notification Feedback

Sistem dapat memberikan feedback kepada pengguna melalui Notification.

Feedback dapat berupa.

- Success
- Information
- Warning
- Error

Notification harus menggunakan gaya visual yang konsisten dan mudah dibedakan.

---

# 7.7 Loading Feedback

Apabila sistem sedang memproses suatu aksi.

Sistem wajib:

- Menampilkan Loading Indicator.
- Mencegah aksi ganda apabila diperlukan.
- Mempertahankan struktur layout.
- Menghilangkan Loading Indicator setelah proses selesai.

---

# 7.8 Error Feedback

Apabila terjadi kesalahan.

Sistem wajib:

- Menampilkan pesan yang mudah dipahami.
- Menjelaskan bahwa aksi tidak berhasil.
- Tidak menghapus data yang telah dimasukkan pengguna.
- Memberikan kesempatan kepada pengguna untuk mencoba kembali apabila memungkinkan.

Pesan Error tidak boleh menggunakan istilah teknis yang sulit dipahami oleh pengguna.

---

# 7.9 Feedback Consistency Rules

Seluruh feedback pada aplikasi wajib memenuhi aturan berikut.

- Menggunakan visual yang konsisten.
- Menggunakan bahasa yang jelas dan mudah dipahami.
- Tidak mengganggu aktivitas pengguna.
- Ditampilkan pada waktu yang tepat.
- Menghilang atau diperbarui sesuai kondisi sistem.
- Tidak menampilkan lebih dari satu feedback untuk aksi yang sama kecuali memang diperlukan.

---

# 7.10 Acceptance Criteria

Feedback & Interaction dinyatakan memenuhi UI Guideline apabila:

- Seluruh aksi pengguna menghasilkan feedback yang sesuai.
- Loading State ditampilkan ketika proses berlangsung.
- Error Message ditampilkan secara jelas.
- Success Feedback ditampilkan setelah aksi berhasil.
- Dialog digunakan untuk aksi yang memerlukan konfirmasi.
- Seluruh feedback memiliki tampilan yang konsisten.
- Perubahan visual tidak mengganggu struktur Global Layout.
- Seluruh interaksi sesuai dengan Approved UI Mockup.

---

# End of PART 7

PART 7 mendefinisikan standar interaksi dan feedback pada Engineering Document Management System (EDMS).

Seluruh implementasi Button, Dialog, Notification, Loading State, dan Error Feedback wajib mengikuti pedoman pada bagian ini agar menghasilkan pengalaman pengguna yang konsisten, informatif, dan sesuai dengan Approved UI Mockup.

# PART 8 — Responsive Design Guidelines

---

# 8.1 Purpose

Responsive Design Guidelines mendefinisikan standar adaptasi tampilan User Interface pada berbagai ukuran layar Engineering Document Management System (EDMS).

Tujuan utama bagian ini adalah memastikan seluruh halaman tetap mudah digunakan, mudah dibaca, dan mempertahankan pengalaman pengguna yang konsisten pada Desktop, Tablet, maupun Mobile.

Bagian ini hanya mengatur perilaku tampilan (Responsive Behaviour) dan tidak mengatur implementasi teknis CSS maupun Framework.

---

# 8.2 Responsive Philosophy

Seluruh halaman EDMS harus menggunakan pendekatan **Responsive First Layout**.

Perubahan ukuran layar tidak boleh mengubah fungsi aplikasi.

Yang berubah hanyalah tata letak (Layout Adaptation), sedangkan struktur informasi, urutan konten, dan fungsi setiap komponen tetap dipertahankan.

Prioritas utama responsive design adalah menjaga keterbacaan, kemudahan navigasi, dan kenyamanan penggunaan.

---

# 8.3 Supported Devices

User Interface EDMS harus dapat digunakan pada perangkat berikut.

| Device | Behaviour |
|---------|-----------|
| Desktop | Menggunakan layout penuh sesuai Approved UI Mockup. |
| Laptop | Menggunakan layout yang sama dengan Desktop dengan penyesuaian ruang kerja. |
| Tablet | Menyesuaikan Grid Layout dan memungkinkan Sidebar di-collapse. |
| Mobile | Menggunakan layout vertikal dengan Sidebar berubah menjadi Drawer Navigation. |

---

# 8.4 Responsive Layout Behaviour

Seluruh halaman wajib mengikuti aturan berikut.

### Desktop

- Sidebar tampil penuh.
- Top Navigation tampil penuh.
- Main Content menggunakan lebar maksimum.
- Dashboard menggunakan layout dua kolom sesuai Approved UI Mockup.

---

### Laptop

- Layout mengikuti Desktop.
- Grid menyesuaikan ruang yang tersedia.
- Tidak mengubah struktur halaman.

---

### Tablet

- Sidebar dapat di-collapse.
- Grid Layout dapat berubah menjadi satu kolom apabila diperlukan.
- Right Panel dapat dipindahkan ke bawah Main Content.
- Seluruh informasi tetap mempertahankan urutan visual.

---

### Mobile

- Sidebar berubah menjadi Drawer Navigation.
- Main Content menggunakan lebar penuh.
- Seluruh section ditampilkan secara vertikal.
- Summary Cards dapat ditampilkan dalam beberapa baris.
- Horizontal scrolling hanya diperbolehkan pada Data Table apabila memang diperlukan.

---

# 8.5 Responsive Component Behaviour

Seluruh komponen wajib mengikuti aturan berikut.

- Tidak keluar dari batas layar.
- Tidak saling bertumpuk.
- Tetap mudah dibaca.
- Tetap mudah dipilih menggunakan sentuhan.
- Mempertahankan jarak antar komponen.
- Menyesuaikan ukuran tanpa mengubah fungsi.

---

# 8.6 Responsive Content Rules

Penyajian informasi wajib mengikuti aturan berikut.

- Prioritaskan informasi yang paling penting.
- Hindari horizontal scrolling kecuali pada Data Table.
- Jangan menyembunyikan informasi penting.
- Jangan mengubah urutan informasi utama.
- Pertahankan hierarki visual pada seluruh ukuran layar.

---

# 8.7 Responsive Navigation Rules

Navigation System wajib beradaptasi terhadap perubahan ukuran layar.

Aturan yang harus dipenuhi.

- Sidebar berubah menjadi Drawer pada Mobile.
- Top Navigation tetap ditampilkan.
- Active Menu tetap terlihat.
- Nested Menu tetap dapat diakses.
- Seluruh halaman tetap dapat dijangkau melalui Navigation System.

---

# 8.8 Responsive Consistency Rules

Seluruh halaman wajib memenuhi aturan berikut.

- Menggunakan struktur responsive yang konsisten.
- Menggunakan Grid Layout yang konsisten.
- Mempertahankan Visual Hierarchy.
- Mempertahankan Navigation Behaviour.
- Mempertahankan Interaction Behaviour.
- Tidak mengubah fungsi aplikasi akibat perubahan ukuran layar.

---

# 8.9 Acceptance Criteria

Responsive Design dinyatakan memenuhi UI Guideline apabila:

- Seluruh halaman dapat digunakan pada Desktop, Laptop, Tablet, dan Mobile.
- Layout tetap konsisten pada seluruh ukuran layar.
- Sidebar beradaptasi sesuai jenis perangkat.
- Main Content tetap mudah dibaca.
- Navigation tetap mudah digunakan.
- Tidak terdapat elemen yang keluar dari area layar.
- Tidak terdapat kerusakan layout pada perubahan ukuran layar.
- Responsive Behaviour tetap sesuai dengan Approved UI Mockup.

---

# End of PART 8

PART 8 mendefinisikan standar adaptasi tampilan pada berbagai ukuran layar untuk Engineering Document Management System (EDMS).

Seluruh implementasi User Interface wajib mengikuti pedoman ini agar tetap memberikan pengalaman penggunaan yang konsisten, responsif, dan sesuai dengan Approved UI Mockup pada seluruh perangkat yang didukung.

# PART 9 — Visual Consistency Standards

---

# 9.1 Purpose

Visual Consistency Standards mendefinisikan standar tampilan visual yang harus diterapkan pada seluruh halaman Engineering Document Management System (EDMS).

Tujuan utama bagian ini adalah memastikan seluruh User Interface memiliki identitas visual yang konsisten sehingga pengguna memperoleh pengalaman penggunaan yang seragam pada seluruh module aplikasi.

Bagian ini tidak mendefinisikan nilai teknis seperti warna, ukuran font, maupun spacing. Detail tersebut dikelola pada sistem desain (Design System) proyek.

---

# 9.2 Visual Design Philosophy

Seluruh User Interface EDMS harus mengikuti prinsip berikut.

- Konsisten.
- Bersih.
- Profesional.
- Mudah dibaca.
- Mudah dipahami.
- Mengutamakan informasi.

Visual harus membantu pengguna memahami informasi tanpa mengalihkan perhatian dari aktivitas utama.

---

# 9.3 Typography Standards

Typography harus digunakan secara konsisten pada seluruh aplikasi.

Aturan yang harus dipenuhi.

- Menggunakan hierarki teks yang jelas.
- Judul halaman memiliki tingkat visual tertinggi.
- Heading digunakan untuk membagi section.
- Body Text digunakan untuk informasi utama.
- Caption digunakan untuk informasi tambahan.
- Hindari penggunaan lebih dari satu gaya typography untuk fungsi yang sama.

---

# 9.4 Color Usage Standards

Penggunaan warna harus memiliki fungsi yang jelas.

Warna digunakan untuk:

- Status.
- Feedback.
- Penekanan informasi.
- Navigasi aktif.
- Identitas visual aplikasi.

Warna tidak boleh digunakan hanya sebagai elemen dekoratif.

---

# 9.5 Icon Standards

Icon digunakan untuk membantu pengguna mengenali fungsi suatu aksi atau informasi.

Aturan yang harus dipenuhi.

- Menggunakan keluarga icon yang sama.
- Ukuran icon konsisten.
- Icon harus mudah dikenali.
- Icon yang sama harus memiliki fungsi yang sama.
- Hindari penggunaan icon yang memiliki makna ganda.

---

# 9.6 Spacing Standards

Seluruh halaman harus menggunakan jarak antar elemen secara konsisten.

Aturan yang harus dipenuhi.

- Spacing antar section konsisten.
- Spacing antar component konsisten.
- Margin dan Padding mengikuti Grid Layout.
- Hindari penempatan component yang terlalu rapat.
- Gunakan whitespace untuk meningkatkan keterbacaan.

---

# 9.7 Alignment Standards

Seluruh elemen User Interface harus memiliki alignment yang konsisten.

Aturan yang harus dipenuhi.

- Header sejajar dengan Content.
- Label sejajar dengan Field.
- Data pada tabel menggunakan alignment yang konsisten.
- Action Button memiliki alignment yang konsisten.
- Summary Cards memiliki alignment yang seragam.

---

# 9.8 Visual Hierarchy Standards

Hierarki visual harus membantu pengguna memahami prioritas informasi.

Urutan prioritas informasi adalah sebagai berikut.

1. Page Header
2. Primary Information
3. Secondary Information
4. Supporting Information
5. Action Area

Visual Hierarchy tidak boleh berubah tanpa perubahan desain yang telah disetujui.

---

# 9.9 Consistency Rules

Seluruh halaman wajib memenuhi aturan berikut.

- Menggunakan Typography yang konsisten.
- Menggunakan Color Usage yang konsisten.
- Menggunakan Icon yang konsisten.
- Menggunakan Alignment yang konsisten.
- Menggunakan Spacing yang konsisten.
- Menggunakan Visual Hierarchy yang konsisten.
- Mengikuti Approved UI Mockup.
- Tidak membuat gaya visual baru tanpa kebutuhan yang disetujui.

---

# 9.10 Acceptance Criteria

Visual Consistency dinyatakan memenuhi UI Guideline apabila:

- Seluruh halaman memiliki identitas visual yang konsisten.
- Typography digunakan secara konsisten.
- Warna digunakan sesuai fungsi.
- Icon digunakan secara konsisten.
- Alignment konsisten pada seluruh halaman.
- Spacing konsisten pada seluruh halaman.
- Visual Hierarchy mudah dipahami.
- Tampilan akhir sesuai dengan Approved UI Mockup.

---

# End of PART 9

PART 9 mendefinisikan standar konsistensi visual yang menjadi identitas antarmuka Engineering Document Management System (EDMS).

Seluruh implementasi User Interface wajib mengikuti pedoman ini agar menghasilkan tampilan yang profesional, konsisten, mudah dipahami, dan selaras dengan Approved UI Mockup.

# PART 10 — UI Acceptance Criteria

---

# 10.1 Purpose

UI Acceptance Criteria mendefinisikan standar akhir yang harus dipenuhi sebelum implementasi User Interface Engineering Document Management System (EDMS) dinyatakan selesai.

Bagian ini menjadi acuan resmi bagi Project Owner, Frontend Developer, QA Engineer, dan AI Coding Agent dalam melakukan proses review terhadap implementasi User Interface.

---

# 10.2 Review Objective

Proses UI Review bertujuan untuk memastikan bahwa seluruh implementasi User Interface:

- Sesuai dengan Approved UI Mockup.
- Konsisten terhadap UI-GUIDELINES.md.
- Mudah digunakan.
- Mudah dipahami.
- Siap digunakan sebelum proses Backend Integration.

---

# 10.3 Layout Verification

Seluruh halaman wajib memenuhi ketentuan berikut.

- Menggunakan Global Application Layout.
- Sidebar tampil dengan benar.
- Top Navigation tampil dengan benar.
- Main Content Area ditampilkan sesuai module.
- Footer tampil dengan benar.
- Layout tidak mengalami kerusakan.

---

# 10.4 Navigation Verification

Navigation System dinyatakan benar apabila.

- Seluruh menu dapat diakses.
- Parent Menu dan Child Menu bekerja dengan benar.
- Active Menu ditampilkan dengan benar.
- Collapse Sidebar berfungsi dengan baik.
- Navigation konsisten pada seluruh halaman.

---

# 10.5 Component Verification

Seluruh komponen User Interface harus memenuhi ketentuan berikut.

- Menggunakan reusable component.
- Menggunakan gaya visual yang konsisten.
- Tidak terdapat duplicate component.
- Posisi component sesuai Approved UI Mockup.
- Komponen mudah digunakan oleh pengguna.

---

# 10.6 Responsive Verification

Seluruh halaman wajib diverifikasi pada perangkat berikut.

- Desktop
- Laptop
- Tablet
- Mobile

Kriteria yang harus dipenuhi.

- Layout tetap konsisten.
- Informasi tetap mudah dibaca.
- Navigation tetap mudah digunakan.
- Tidak terdapat elemen yang keluar dari layar.
- Tidak terjadi kerusakan layout.

---

# 10.7 Interaction Verification

Seluruh interaksi pengguna wajib diverifikasi.

Meliputi.

- Button Interaction
- Form Interaction
- Navigation Interaction
- Loading State
- Empty State
- Error State
- Notification Feedback
- Dialog Interaction

Seluruh interaksi harus memberikan feedback yang jelas kepada pengguna.

---

# 10.8 Visual Verification

Visual User Interface dinyatakan memenuhi standar apabila.

- Typography konsisten.
- Color Usage konsisten.
- Icon konsisten.
- Spacing konsisten.
- Alignment konsisten.
- Visual Hierarchy konsisten.
- Seluruh halaman mengikuti identitas visual EDMS.

---

# 10.9 UI Completion Checklist

Implementasi UI dinyatakan selesai apabila seluruh checklist berikut telah terpenuhi.

| Checklist | Status |
|-----------|--------|
| Global Layout sesuai Approved UI Mockup | ☐ |
| Navigation System berfungsi dengan benar | ☐ |
| Dashboard Layout sesuai desain | ☐ |
| Data Display konsisten | ☐ |
| Form Layout konsisten | ☐ |
| Feedback & Interaction berjalan dengan baik | ☐ |
| Responsive Behaviour sesuai pedoman | ☐ |
| Visual Consistency terpenuhi | ☐ |
| Tidak terdapat kerusakan layout | ☐ |
| Tidak terdapat Console Error yang mempengaruhi UI | ☐ |

---

# 10.10 Final Acceptance Criteria

Implementasi User Interface Engineering Document Management System (EDMS) dinyatakan **Accepted** apabila memenuhi seluruh kondisi berikut.

- Seluruh halaman sesuai Approved UI Mockup.
- Seluruh ketentuan pada UI-GUIDELINES.md telah dipenuhi.
- Tidak terdapat inkonsistensi visual.
- Tidak terdapat kerusakan layout pada seluruh perangkat yang didukung.
- Seluruh komponen dapat digunakan dengan baik.
- Navigation berjalan sesuai desain.
- Responsive Behaviour berjalan dengan baik.
- Project Owner memberikan persetujuan akhir terhadap implementasi User Interface.

---

# End of PART 10

UI-GUIDELINES.md menjadi dokumen standar resmi yang mendefinisikan tata letak, navigasi, penyajian data, form, interaksi, responsive behaviour, serta konsistensi visual Engineering Document Management System (EDMS).

Seluruh implementasi Frontend wajib mengacu pada dokumen ini agar menghasilkan antarmuka yang konsisten, mudah dipelihara, dan sesuai dengan Approved UI Mockup.

---

# PHASE 2 SOURCE OF TRUTH SYNCHRONIZATION

## Current Implementation

Layout runtime menggunakan AppShell dengan Sidebar collapsible, Header, Active Project Selector, User Menu, dan Notification Bell.

Navigation aktif:

- Dashboard.
- Document Register: PFD dan P&ID.
- Transmittal: Incoming dan Outgoing sebagai placeholder.
- SLA Monitoring.
- Escalation Alert.
- Audit Trail.
- Storage NAS sebagai placeholder.
- Notification.
- Administration: User Management, Project Management, Project Membership.

UI behaviour resmi:

- Project-scoped page menampilkan guard apabila Active Project tidak tersedia atau Project tidak `Active`.
- Archived Document tidak tampil pada operasional normal kecuali melalui lifecycle filter Admin.
- Notification direct open dapat diblokir apabila project, membership, document, lifecycle, atau target module tidak valid.
- Project `Closed` tidak muncul pada Active Project Selector.
