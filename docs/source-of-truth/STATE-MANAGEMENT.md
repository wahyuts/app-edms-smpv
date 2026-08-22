# ==============================================================================
# STATE-MANAGEMENT.md
# PART 1 — DOCUMENT OVERVIEW
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Document Level** | Technical Design Document |
| **Document Status** | Draft |
| **Owner** | Frontend Architecture |
| **Purpose** | Mendefinisikan standar pengelolaan state pada Engineering Document Management System (EDMS) agar seluruh implementasi Frontend memiliki arsitektur state yang konsisten, scalable, predictable, dan mudah dipelihara. |
| **Depends On** | PRD.md, ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, UI-GUIDELINES.md, COMPONENT-SPEC.md, FILE-STRUCTURE.md, ROUTING.md |
| **Design Reference** | Approved UI Design Mockup |
| **Behaviour Reference** | BUSINESS-WORKFLOW.md |
| **Primary Audience** | Frontend Developer, Technical Lead, QA Engineer, AI Coding Agent |
| **Change Impact** | Very High |
| **Last Review** | Architecture Review |

---

# 1.1 Purpose

STATE-MANAGEMENT.md merupakan dokumen resmi yang mendefinisikan standar pengelolaan state pada aplikasi Engineering Document Management System (EDMS).

Dokumen ini menjelaskan bagaimana data dikelola, disimpan, dibaca, diperbarui, dan dibagikan antar halaman maupun antar komponen aplikasi sehingga seluruh implementasi Frontend mengikuti arsitektur yang telah ditetapkan.

STATE-MANAGEMENT.md tidak mendefinisikan kebutuhan bisnis, Business Workflow, maupun User Interface baru.

Seluruh kebutuhan bisnis tetap mengacu pada PRD.md, sedangkan perilaku sistem mengacu pada BUSINESS-WORKFLOW.md sebagai Behaviour Reference Only.

---

# 1.2 Objectives

Dokumen ini bertujuan untuk:

- Menentukan standar pengelolaan state pada seluruh aplikasi EDMS.
- Menetapkan pembagian tanggung jawab antara Local State, Global State, dan Server State.
- Menjaga konsistensi implementasi state pada seluruh Product Module.
- Mengurangi duplikasi data dan business logic.
- Mendukung arsitektur Feature First yang telah ditetapkan.
- Menjadi acuan implementasi Zustand sebagai Global State Manager.
- Menjadi acuan implementasi TanStack Query sebagai Server State Manager.
- Menjadi referensi AI Coding Agent dalam membangun arsitektur state aplikasi.

---

# 1.3 Scope

STATE-MANAGEMENT.md mencakup:

- State Management Philosophy
- State Architecture
- Local State Strategy
- Global State Strategy
- Server State Strategy
- Store Organization
- State Flow
- State Lifecycle
- State Synchronization
- State Naming Convention
- State Rules
- State Best Practices
- Acceptance Criteria

Dokumen ini tidak membahas:

- Business Workflow
- Business Rules
- REST API Contract
- Database Schema
- UI Design Detail
- Backend Architecture
- Component Styling

Topik tersebut dijelaskan pada dokumen Source of Truth masing-masing.

---

# 1.4 Document Position

STATE-MANAGEMENT.md merupakan bagian dari Technical Design Documents.

Dokumen ini menerjemahkan kebutuhan produk dan keputusan arsitektur menjadi standar implementasi state pada Frontend.

Hubungan antar dokumen adalah sebagai berikut.

```text
BUSINESS-WORKFLOW.md
        │
        │ (Behaviour Reference Only)
        ▼
PRD.md
        │
        ▼
ENGINEERING-FOUNDATION.md
        │
        ▼
IMPLEMENTATION-PLAN.md
        │
        ▼
FILE-STRUCTURE.md
        │
        ▼
STATE-MANAGEMENT.md
        │
        ├── Zustand Store
        ├── TanStack Query
        ├── React Local State
        └── Custom Hooks
```

STATE-MANAGEMENT.md tidak menggantikan ENGINEERING-FOUNDATION.md maupun IMPLEMENTATION-PLAN.md, tetapi melengkapi keduanya dengan mendefinisikan standar implementasi state.

---

# 1.5 Source Documents

Seluruh isi STATE-MANAGEMENT.md wajib mengacu pada dokumen berikut.

## Primary Source

- PRD.md
- ENGINEERING-FOUNDATION.md
- IMPLEMENTATION-PLAN.md
- UI-GUIDELINES.md
- COMPONENT-SPEC.md
- FILE-STRUCTURE.md
- ROUTING.md
- Approved UI Design Mockup

## Behaviour Reference

- BUSINESS-WORKFLOW.md

Apabila terjadi perbedaan informasi, prioritas mengikuti Project Documentation Hierarchy yang telah ditetapkan.

---

# 1.6 State Management Principles

Seluruh implementasi state wajib mengikuti prinsip berikut.

- Single Source of Truth.
- Separation of Concerns.
- Predictable State Flow.
- Feature First Architecture.
- Minimal Global State.
- Server Data Belongs to Server State.
- Keep Local State Local.
- No Duplicate State.
- API Ready Architecture.
- Reusable State Logic.

---

# 1.7 Technology Reference

State Management pada EDMS menggunakan teknologi yang telah ditetapkan pada ENGINEERING-FOUNDATION.md.

| Category | Technology |
|----------|------------|
| Local State | React Hooks |
| Global State | Zustand |
| Server State | TanStack Query |
| HTTP Client | Axios |
| Form State | React Hook Form |
| Validation | Zod |

Tidak diperbolehkan menggunakan library state management lain tanpa melalui Architecture Review dan Change Request.

---

# 1.8 Expected Outcome

Setelah STATE-MANAGEMENT.md selesai disusun, seluruh tim pengembang dan AI Coding Agent harus mampu:

- Memahami jenis state yang digunakan pada setiap fitur.
- Menentukan lokasi penyimpanan state yang tepat.
- Menghindari duplikasi state antar module.
- Mengimplementasikan Zustand secara konsisten.
- Mengimplementasikan TanStack Query sesuai fungsinya sebagai Server State Manager.
- Mengimplementasikan React Local State hanya untuk kebutuhan komponen.
- Menghasilkan arsitektur Frontend yang scalable, maintainable, dan mudah dikembangkan.

# END OF PART 1
# ==============================================================================

# ==============================================================================
# STATE-MANAGEMENT.md
# PART 2 — STATE MANAGEMENT PHILOSOPHY
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan filosofi pengelolaan state yang menjadi dasar seluruh implementasi Frontend EDMS. |
| **Depends On** | ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md |
| **Related Sections** | PART 3 — State Architecture |
| **Primary Audience** | Frontend Developer, Technical Lead, AI Coding Agent |

---

# 2.1 Overview

State Management merupakan fondasi utama yang mengatur bagaimana data dikelola selama siklus hidup aplikasi.

Pada EDMS, state tidak hanya digunakan untuk menampilkan informasi kepada pengguna, tetapi juga menjaga konsistensi antarmuka, sinkronisasi data, serta integrasi antara Frontend dengan Backend.

Seluruh implementasi state harus mengikuti arsitektur yang telah ditetapkan pada ENGINEERING-FOUNDATION.md dan IMPLEMENTATION-PLAN.md.

---

# 2.2 Philosophy

State Management EDMS dibangun berdasarkan prinsip bahwa setiap jenis data hanya memiliki **satu sumber kebenaran (Single Source of Truth)**.

Data tidak boleh disimpan pada lebih dari satu lokasi apabila memiliki tujuan yang sama.

Setiap perubahan data harus dilakukan pada sumber state yang benar sehingga seluruh UI memperoleh informasi yang konsisten.

---

# 2.3 Core Principles

Seluruh implementasi wajib mengikuti prinsip berikut.

## SMP-001 — Single Source of Truth

Satu jenis data hanya boleh memiliki satu pemilik (Owner).

---

## SMP-002 — Separation of Responsibility

Setiap jenis state memiliki tanggung jawab yang berbeda.

---

## SMP-003 — Predictable State

Perubahan state harus dapat diprediksi dan mudah ditelusuri.

---

## SMP-004 — Feature Isolation

State antar Feature tidak boleh saling bergantung secara langsung.

---

## SMP-005 — Shared Through Store

Data yang digunakan lintas halaman harus dibagikan melalui Store.

---

## SMP-006 — UI Independence

UI tidak menjadi penyimpan data utama.

Component hanya menampilkan state.

---

## SMP-007 — Server Data Ownership

Data yang berasal dari Backend tetap dimiliki oleh Server.

Frontend hanya menyimpan cache sementara.

---

## SMP-008 — Minimal Global State

Hanya data yang benar-benar dibutuhkan lintas halaman yang boleh ditempatkan pada Global Store.

---

# 2.4 State Categories

State dalam EDMS dibagi menjadi tiga kategori utama.

| Category | Owner | Lifetime |
|----------|-------|----------|
| Local State | React Component | Selama Component aktif |
| Global State | Zustand Store | Selama aplikasi berjalan |
| Server State | TanStack Query | Mengikuti cache policy |

Ketiga kategori tersebut memiliki fungsi yang berbeda dan tidak boleh dipertukarkan.

---

# 2.5 Data Ownership

Setiap data memiliki pemilik yang jelas.

| Data | Owner |
|------|-------|
| Form Input | Local State |
| Modal State | Local State |
| Sidebar State | Global Store |
| Authentication | Global Store |
| Current User | Global Store |
| Notification Counter | Server State |
| Dashboard Summary | Server State |
| Document Register | Server State |
| SLA Overview | Server State |
| Escalation Alert | Server State |

---

# 2.6 State Responsibility Matrix

| State Type | Read | Update | Share |
|------------|------|--------|-------|
| Local State | Component | Component | No |
| Global State | Entire App | Store Action | Yes |
| Server State | Query | Mutation | Automatic Cache |

---

# 2.7 Design Goals

State Management harus memenuhi tujuan berikut.

- Predictable
- Scalable
- Maintainable
- Testable
- Reusable
- API Ready
- Mock Ready
- Easy Debugging

---

# 2.8 Anti Patterns

Implementasi berikut tidak diperbolehkan.

- Duplicate Global State.
- Menyimpan Server Data pada Zustand.
- Menyimpan Form State pada Global Store.
- Direct API Call dari Component.
- Cross Feature State Dependency.
- Shared Mutable Object.
- Circular Store Dependency.

---

# 2.9 Expected Outcome

Setelah mengikuti filosofi ini, seluruh implementasi state akan:

- Memiliki struktur yang konsisten.
- Mudah dipelihara.
- Mudah diintegrasikan dengan Backend.
- Mudah diuji.
- Mengurangi bug akibat inkonsistensi state.

# END OF PART 2
# ==============================================================================

# ==============================================================================
# STATE-MANAGEMENT.md
# PART 3 — STATE ARCHITECTURE
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan arsitektur state yang digunakan pada seluruh aplikasi EDMS. |
| **Depends On** | ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, FILE-STRUCTURE.md |
| **Related Sections** | PART 2 — State Management Philosophy |
| **Primary Audience** | Frontend Developer, Technical Lead, AI Coding Agent |

---

# 3.1 Overview

State Architecture menjelaskan bagaimana seluruh jenis state saling berinteraksi di dalam aplikasi.

Arsitektur ini memastikan setiap data berada pada lapisan yang tepat sehingga implementasi tetap modular, mudah dipelihara, dan siap diintegrasikan dengan REST API.

---

# 3.2 Architecture Overview

EDMS menggunakan tiga lapisan state.

```text
React Component
       │
       ▼
React Local State
       │
       ▼
Zustand Global Store
       │
       ▼
TanStack Query
       │
       ▼
Service Layer
       │
       ▼
REST API
```

Masing-masing lapisan memiliki tanggung jawab yang berbeda.

---

# 3.3 Layer Responsibilities

## Layer 1 — React Component

Bertanggung jawab terhadap rendering UI.

Tidak menyimpan data lintas halaman.

---

## Layer 2 — Local State

Digunakan untuk state yang hanya dibutuhkan oleh Component.

Contoh:

- Input Value
- Dropdown Open
- Modal Visibility
- Selected Tab

---

## Layer 3 — Global Store

Digunakan untuk data yang dibutuhkan oleh lebih dari satu halaman.

Contoh:

- Authentication
- Current User
- Theme
- Sidebar
- Breadcrumb

---

## Layer 4 — Server State

Digunakan untuk seluruh data yang berasal dari Backend.

Contoh:

- Dashboard Summary
- Document Register
- Notification
- User List
- SLA Monitoring
- Audit Trail

---

## Layer 5 — Service Layer

Seluruh komunikasi data dilakukan melalui Service Layer.

Component tidak diperbolehkan mengakses REST API secara langsung.

---

# 3.4 State Flow

Seluruh perubahan state mengikuti alur berikut.

```text
User Action
      │
      ▼
Component Event
      │
      ▼
Local State
      │
      ▼
Store Action / Query
      │
      ▼
Service Layer
      │
      ▼
REST API
      │
      ▼
TanStack Query Cache
      │
      ▼
UI Re-render
```

Alur ini harus diterapkan secara konsisten pada seluruh Product Module.

---

# 3.5 Store Hierarchy

Global Store tidak dibuat sebagai satu store besar.

Store dipisahkan berdasarkan domain.

```text
stores/

├── auth/
├── layout/
├── user/
├── notification/
├── dashboard/
├── document/
├── sla/
└── escalation/
```

Setiap Store bertanggung jawab terhadap domain masing-masing.

---

# 3.6 State Boundaries

Untuk menghindari coupling antar module, berlaku aturan berikut.

- Store tidak boleh mengakses Store lain secara langsung.
- Component hanya menggunakan Store yang dibutuhkan.
- Store tidak mengetahui struktur UI.
- Service tidak mengetahui Component.
- Query tidak mengetahui Store.

---

# 3.7 Data Flow Principles

Seluruh data mengalir satu arah.

```text
Server
    │
    ▼
Query
    │
    ▼
Component
    │
    ▼
User Interaction
```

Perubahan data dilakukan melalui Mutation yang kemudian memperbarui cache.

---

# 3.8 Synchronization Strategy

Sinkronisasi state dilakukan melalui TanStack Query.

Setelah Mutation berhasil:

- Cache diperbarui.
- Query terkait di-invalidasi bila diperlukan.
- Component melakukan render ulang secara otomatis.

Global Store tidak digunakan untuk sinkronisasi Server State.

---

# 3.9 Architecture Rules

Seluruh implementasi wajib mengikuti aturan berikut.

- Component tidak melakukan Direct API Call.
- Service Layer menjadi satu-satunya akses data.
- Server State menggunakan TanStack Query.
- Global State menggunakan Zustand.
- Local State menggunakan React Hooks.
- Tidak diperbolehkan menyimpan data yang sama pada dua Store berbeda.
- Tidak diperbolehkan membuat Store lintas domain.

---

# 3.10 Expected Outcome

State Architecture dinyatakan berhasil apabila:

- Setiap data memiliki owner yang jelas.
- Tidak terjadi duplicate state.
- Seluruh Feature mengikuti arsitektur yang sama.
- Integrasi Mock Data dan REST API dapat dilakukan tanpa mengubah Component.
- Arsitektur tetap scalable untuk penambahan module baru.

# END OF PART 3
# ==============================================================================

# ==============================================================================
# STATE-MANAGEMENT.md
# PART 4 — GLOBAL STATE
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar penggunaan Global State pada Engineering Document Management System (EDMS). |
| **Technology** | Zustand |
| **Depends On** | ENGINEERING-FOUNDATION.md, FILE-STRUCTURE.md, ROUTING.md |
| **Primary Audience** | Frontend Developer, AI Coding Agent |

---

# 4.1 Overview

Global State digunakan untuk menyimpan data yang harus dapat diakses oleh lebih dari satu Feature Module atau lebih dari satu halaman.

Global State pada EDMS menggunakan **Zustand** sebagai Global State Manager.

Seluruh Global State harus memiliki tanggung jawab yang jelas dan tidak digunakan untuk menyimpan Server State.

---

# 4.2 Purpose

Global State digunakan apabila data memenuhi salah satu kondisi berikut.

- Digunakan oleh lebih dari satu halaman.
- Digunakan oleh lebih dari satu Feature Module.
- Tidak berasal langsung dari Backend.
- Harus tetap tersedia selama aplikasi berjalan.
- Dibutuhkan oleh Layout maupun Navigation.

---

# 4.3 Global State Architecture

Arsitektur Global State.

```text
React Component

↓

Custom Hook

↓

Zustand Store

↓

Store Action

↓

State Updated

↓

Component Re-render
```

Component tidak diperbolehkan memodifikasi state secara langsung.

Seluruh perubahan dilakukan melalui Store Action.

---

# 4.4 Global Store Organization

Store dipisahkan berdasarkan domain.

```text
stores/

├── auth/
│      ├── auth.store.js
│      └── auth.actions.js
│
├── layout/
│      ├── layout.store.js
│      └── layout.actions.js
│
├── user/
│      ├── user.store.js
│      └── user.actions.js
│
└── ui/
       ├── ui.store.js
       └── ui.actions.js
```

Setiap Store hanya bertanggung jawab terhadap satu domain.

---

# 4.5 Recommended Global State

Berikut adalah data yang direkomendasikan berada pada Global State.

| Store | Data |
|---------|------|
| Auth Store | Login Session |
| User Store | Current User |
| Layout Store | Sidebar Collapse |
| Layout Store | Current Breadcrumb |
| UI Store | Loading Indicator |
| UI Store | Global Toast |
| UI Store | Theme Preference |
| UI Store | Active Navigation |
| Project Context Store | Active Project, Active Membership, Active Official Role |

Setelah Login berhasil, aplikasi wajib memuat daftar Project yang dapat diakses oleh Current User.

Apabila daftar tersebut berisi minimal satu Project Active, Project Context Store dapat menyimpan Project terakhir sebagai default selected Active Project, tetapi Dashboard belum dibuka sampai User mengonfirmasi pilihan pada halaman **Select Active Project**.

Ketika User menekan `Continue to Dashboard`, sistem memvalidasi ulang Project Active dan Project Membership Active, lalu memperbarui:

- Active Project.
- Active Membership.
- Active Official Role.
- Project-Scoped Query Cache.

Apabila daftar Project kosong, Project Context Store menyimpan state tanpa Active Project dan aplikasi langsung menggunakan behaviour Dashboard existing. Project-Scoped Page tetap menampilkan `No Project Access`.

Reset All Demo Data wajib membersihkan runtime state yang berkaitan dengan data demo.

State yang dibersihkan setelah reset berhasil:

- Active Project runtime.
- Project Context runtime.
- Active Project persistence.
- TanStack Query cache.
- Session Current User.

Setelah runtime state dibersihkan, User diarahkan ke Login dan wajib Login ulang menggunakan akun bootstrap `wahyuts`.

Reset All Demo Data tidak mengambil ulang credential dari source mock. Credential runtime terbaru akun `wahyuts` tetap dipertahankan agar perubahan password yang sah tidak dibatalkan oleh reset.

Password Recovery Frontend Simulation menyimpan Mock Reset Token dan Development Mock Email melalui Local Persistence Service.

Token menyimpan `token`, `userId`, `createdAt`, `expiresAt`, dan `usedAt`. Token berlaku 15 menit, hanya dapat digunakan sekali, dan token aktif lama untuk User yang sama dinonaktifkan ketika request valid baru dibuat.

Mock Email hanya digunakan untuk Development Mock Mailbox dan hanya boleh dirender ketika `VITE_ENABLE_MOCK_EMAIL=true`.

Data di atas digunakan lintas halaman sehingga layak berada pada Global State.

---

# 4.6 State Update Flow

Perubahan Global State mengikuti alur berikut.

```text
User Action

↓

Component

↓

Store Action

↓

Zustand Store

↓

State Updated

↓

UI Updated
```

Seluruh perubahan dilakukan melalui Action.

---

# 4.7 Global State Rules

Global State wajib memenuhi aturan berikut.

### GS-001

Setiap Store hanya memiliki satu tanggung jawab.

---

### GS-002

Store tidak boleh saling mengakses secara langsung.

---

### GS-003

Store tidak boleh menyimpan Business Logic.

---

### GS-004

Store tidak melakukan HTTP Request.

---

### GS-005

Store tidak menyimpan Server State.

---

### GS-006

Store hanya menyimpan data yang dibutuhkan lintas halaman.

---

### GS-007

Store mengikuti struktur FILE-STRUCTURE.md.

---

# 4.8 Anti Patterns

Implementasi berikut tidak diperbolehkan.

- Dashboard Summary disimpan pada Zustand.
- Document Register disimpan pada Zustand.
- Notification List disimpan pada Zustand.
- SLA Monitoring disimpan pada Zustand.
- Data hasil REST API disalin ke Global Store.
- Store memanggil Axios secara langsung.

---

# 4.9 Best Practices

Seluruh implementasi Global State disarankan.

- Store kecil dan modular.
- Menggunakan Action yang jelas.
- Tidak menyimpan data yang tidak diperlukan.
- Mudah diuji.
- Mudah digunakan kembali.
- Mudah dipelihara.

---

# 4.10 Expected Outcome

Global State dinyatakan memenuhi standar apabila.

- Seluruh Store memiliki domain yang jelas.
- Tidak terdapat duplicate state.
- Tidak menyimpan Server State.
- Tidak mengandung Business Logic.
- Seluruh perubahan dilakukan melalui Action.
- Struktur Store mengikuti ENGINEERING-FOUNDATION.md dan FILE-STRUCTURE.md.

# END OF PART 4
# ==============================================================================

# ==============================================================================
# STATE-MANAGEMENT.md
# PART 5 — LOCAL STATE
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar penggunaan Local State pada Engineering Document Management System (EDMS). |
| **Technology** | React Hooks (useState, useReducer, useMemo, useCallback) |
| **Depends On** | COMPONENT-SPEC.md, UI-GUIDELINES.md |
| **Primary Audience** | Frontend Developer, AI Coding Agent |

---

# 5.1 Overview

Local State digunakan untuk mengelola data yang hanya dibutuhkan oleh satu Component atau satu Page.

Local State tidak boleh dibagikan kepada Feature Module lain.

Seluruh Local State menggunakan React Hooks sesuai standar ENGINEERING-FOUNDATION.md.

---

# 5.2 Purpose

Local State digunakan apabila data hanya dibutuhkan oleh Component yang sedang aktif.

State akan dibuat ketika Component dirender dan akan dihapus ketika Component di-unmount.

---

# 5.3 Local State Architecture

```text
Component

↓

React Hook

↓

Local State

↓

Component Re-render
```

State hanya dimiliki oleh Component tersebut.

---

# 5.4 Recommended Local State

Contoh penggunaan Local State.

| Component | Local State |
|------------|-------------|
| Search Box | Search Keyword |
| Filter Dropdown | Selected Filter |
| Sort Dropdown | Selected Sort |
| Pagination | Current Page |
| Modal | Open / Close |
| Confirmation Dialog | Dialog State |
| Upload Form | Selected File |
| Input Field | Input Value |
| Accordion | Expanded State |
| Tab Navigation | Active Tab |

State di atas tidak dibutuhkan oleh halaman lain sehingga tetap berada pada Local State.

---

# 5.5 Local State Lifecycle

```text
Component Mounted

↓

Initialize State

↓

User Interaction

↓

State Updated

↓

Component Re-render

↓

Component Unmounted

↓

State Destroyed
```

Local State hanya hidup selama Component aktif.

---

# 5.6 Local State Rules

### LS-001

Gunakan Local State untuk UI State.

---

### LS-002

Gunakan Local State untuk Form State sementara.

---

### LS-003

Gunakan Local State untuk Dialog State.

---

### LS-004

Gunakan Local State untuk Input Component.

---

### LS-005

Jangan gunakan Local State untuk data lintas halaman.

---

### LS-006

Jangan gunakan Local State untuk Server Data.

---

### LS-007

Local State tidak boleh menggantikan Global Store.

---

# 5.7 Anti Patterns

Implementasi berikut tidak diperbolehkan.

- Current User disimpan pada Local State.
- Dashboard Summary disimpan pada Local State.
- Notification List disimpan pada Local State.
- Sidebar State disimpan pada Local State.
- Authentication disimpan pada Local State.

---

# 5.8 Best Practices

Disarankan untuk.

- Menjaga Local State tetap sederhana.
- Menghapus state yang tidak diperlukan.
- Menghindari nested state yang kompleks.
- Menggunakan useReducer apabila state memiliki banyak transisi.
- Menggunakan memoization apabila diperlukan.

---

# 5.9 Relationship with Other States

Hubungan Local State dengan jenis state lainnya.

| State Type | Responsibility |
|------------|----------------|
| Local State | Component UI |
| Global State | Shared Application Data |
| Server State | Backend Data |

Setiap jenis state memiliki tanggung jawab yang berbeda.

---

# 5.10 Expected Outcome

Local State dinyatakan memenuhi standar apabila.

- Hanya digunakan oleh Component terkait.
- Tidak digunakan sebagai Global State.
- Tidak menyimpan Server State.
- Mudah dipahami.
- Mudah diuji.
- Mengikuti COMPONENT-SPEC.md dan ENGINEERING-FOUNDATION.md.

# END OF PART 5
# ==============================================================================

# ==============================================================================
# STATE-MANAGEMENT.md
# PART 6 — SERVER STATE
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar pengelolaan Server State pada Engineering Document Management System (EDMS). |
| **Technology** | TanStack Query |
| **Depends On** | ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, API-CONTRACT.md (Future) |
| **Primary Audience** | Frontend Developer, Technical Lead, AI Coding Agent |

---

# 6.1 Overview

Server State merupakan seluruh data yang berasal dari Backend melalui REST API.

Berbeda dengan Local State maupun Global State, Server State **tidak dimiliki oleh Frontend**.

Frontend hanya bertugas mengambil, menampilkan, melakukan cache, melakukan sinkronisasi, dan memperbarui data melalui mekanisme yang disediakan oleh TanStack Query.

Seluruh Server State pada EDMS wajib menggunakan **TanStack Query**.

---

# 6.2 Purpose

Server State digunakan untuk:

- Mengambil data dari REST API.
- Menyimpan cache hasil request.
- Mengurangi request yang tidak diperlukan.
- Menjaga sinkronisasi data antar halaman.
- Mendukung refetch otomatis.
- Mendukung optimistic update apabila diperlukan.
- Mempermudah integrasi dengan Backend.

---

# 6.3 Server State Architecture

Arsitektur Server State mengikuti struktur berikut.

```text
React Component

↓

TanStack Query Hook

↓

Query / Mutation

↓

Service Layer

↓

Axios

↓

REST API

↓

Backend

↓

Response

↓

TanStack Query Cache

↓

Component Re-render
```

Seluruh komunikasi dengan Backend harus mengikuti arsitektur di atas.

---

# 6.4 Server State Ownership

Seluruh data berikut dimiliki oleh Backend dan dikelola sebagai Server State.

| Feature | State Owner |
|----------|-------------|
| Dashboard Summary | TanStack Query |
| Dashboard Statistics | TanStack Query |
| Document Register | TanStack Query |
| Document Detail | TanStack Query |
| Document History | TanStack Query |
| Transmittal | TanStack Query |
| SLA Monitoring | TanStack Query |
| Escalation Alert | TanStack Query |
| Notification List | TanStack Query |
| Audit Trail | TanStack Query |
| Storage NAS | TanStack Query |
| User List | TanStack Query |
| Department List | TanStack Query |
| Project List | TanStack Query |
| Project Membership List | TanStack Query |

Role List dan Permission List bukan runtime server-state aktif. Jika istilah tersebut masih ditemukan pada histori proyek, statusnya adalah Superseded / Historical Reference.

Seluruh data tersebut tidak boleh disalin ke Zustand.
Document Lifecycle Filter merupakan UI state pada Document Register.
Admin dapat menggunakan nilai Active, Archived, atau All.
Role selain Admin selalu menggunakan Active secara efektif dan tidak melihat Lifecycle Filter.
Dashboard, SLA, Escalation, dan operasional normal wajib menggunakan Lifecycle Active.

---

# 6.5 Query Organization

Seluruh Query dikelompokkan berdasarkan Product Module.

```text
queries/

├── dashboard/
│      ├── useDashboardSummary.js
│      ├── useDashboardStatistics.js
│      └── index.js
│
├── documents/
│      ├── useDocumentList.js
│      ├── useDocumentDetail.js
│      ├── useDocumentHistory.js
│      └── index.js
│
├── transmittal/
│
├── sla/
│
├── escalation/
│
├── notifications/
│
├── audit/
│
├── storage/
│
└── administration/
```

Struktur Query mengikuti Product Module yang telah ditetapkan pada PRD.

---

# 6.6 Query & Mutation Flow

Seluruh operasi Server State mengikuti alur berikut.

## Read Data (Query)

```text
Component

↓

Query Hook

↓

TanStack Query

↓

Service Layer

↓

REST API

↓

Cache

↓

Component
```

---

## Update Data (Mutation)

```text
Component

↓

Mutation Hook

↓

Service Layer

↓

REST API

↓

Mutation Success

↓

Invalidate Query

↓

Automatic Refetch

↓

Updated UI
```

Seluruh perubahan Server State dilakukan melalui Mutation.

---

# 6.7 Server State Rules

### SS-001

Seluruh data Backend wajib menggunakan TanStack Query.

---

### SS-002

Component tidak diperbolehkan memanggil Axios secara langsung.

---

### SS-003

Component hanya menggunakan Query Hook atau Mutation Hook.

---

### SS-004

Seluruh komunikasi API dilakukan melalui Service Layer.

---

### SS-005

Server State tidak boleh disimpan pada Zustand.

---

### SS-006

Cache dikelola oleh TanStack Query.

---

### SS-007

Seluruh Query mengikuti Product Module.

---

### SS-008

Mutation harus memperbarui cache melalui mekanisme TanStack Query.

Data User Account bersifat global dan dapat dikonsumsi oleh User Management, Project Membership, Notification, Audit Trail, dan modul lain yang membutuhkan identitas User. Seluruh consumer User Account wajib menggunakan Query Key yang konsisten. Setelah Create User, Edit User, Activate User, atau Deactivate User berhasil, aplikasi wajib meng-invalidate cache User dan cache turunan yang menampilkan data User, termasuk Project Membership, sehingga data terbaru tersedia tanpa browser refresh.

---

# 6.8 Server State Boundary

Pembagian tanggung jawab state adalah sebagai berikut.

| Data | Local State | Global State | Server State |
|------|:-----------:|:------------:|:------------:|
| Search Keyword | ✅ | ❌ | ❌ |
| Selected Filter | ✅ | ❌ | ❌ |
| Pagination UI | ✅ | ❌ | ❌ |
| Dialog State | ✅ | ❌ | ❌ |
| Sidebar Collapse | ❌ | ✅ | ❌ |
| Current User Session | ❌ | ✅ | ❌ |
| Active Navigation | ❌ | ✅ | ❌ |
| Theme Preference | ❌ | ✅ | ❌ |
| Dashboard Summary | ❌ | ❌ | ✅ |
| Dashboard Statistics | ❌ | ❌ | ✅ |
| Document Register | ❌ | ❌ | ✅ |
| Document Detail | ❌ | ❌ | ✅ |
| Document History | ❌ | ❌ | ✅ |
| Notification List | ❌ | ❌ | ✅ |
| SLA Monitoring | ❌ | ❌ | ✅ |
| Escalation Alert | ❌ | ❌ | ✅ |
| Audit Trail | ❌ | ❌ | ✅ |
| Storage NAS | ❌ | ❌ | ✅ |
| User Management | ❌ | ❌ | ✅ |

Tabel ini menjadi acuan utama dalam menentukan lokasi penyimpanan state.

---

# 6.9 Anti Patterns

Implementasi berikut tidak diperbolehkan.

- Menyimpan hasil Query ke Zustand.
- Menyalin seluruh Response API ke Local State.
- Memanggil Axios langsung dari Component.
- Menggunakan useEffect sebagai pengganti TanStack Query.
- Membuat Query yang sama pada beberapa Feature.
- Melakukan Manual Refetch tanpa alasan yang jelas.
- Menyimpan cache API secara manual.

---

# 6.10 Expected Outcome

Server State dinyatakan memenuhi standar apabila.

- Seluruh data Backend dikelola oleh TanStack Query.
- Seluruh komunikasi API dilakukan melalui Service Layer.
- Component tidak melakukan Direct API Call.
- Cache dikelola secara otomatis oleh TanStack Query.
- Tidak terdapat duplikasi Server State pada Zustand maupun Local State.
- Struktur Query mengikuti Product Module.
- Seluruh implementasi konsisten dengan ENGINEERING-FOUNDATION.md, FILE-STRUCTURE.md, dan ROUTING.md.

# END OF PART 6
# ==============================================================================

# ==============================================================================
# STATE-MANAGEMENT.md
# PART 7 — STORE ORGANIZATION
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan struktur organisasi Store pada Engineering Document Management System (EDMS). |
| **Technology** | Zustand + TanStack Query |
| **Depends On** | FILE-STRUCTURE.md, ROUTING.md, COMPONENT-SPEC.md |
| **Primary Audience** | Frontend Developer, Technical Lead, AI Coding Agent |

---

# 7.1 Overview

Store Organization mendefinisikan bagaimana seluruh Store diorganisasikan di dalam aplikasi EDMS.

Tujuan utama dari organisasi Store adalah menjaga konsistensi arsitektur, menghindari duplicate state, mempermudah maintenance, serta memastikan setiap Product Module memiliki tanggung jawab yang jelas.

Seluruh Store harus mengikuti struktur Feature-Oriented Architecture yang telah ditetapkan pada FILE-STRUCTURE.md.

---

# 7.2 Store Organization Philosophy

Store pada EDMS dibangun berdasarkan prinsip berikut.

- Domain Driven Organization.
- Single Responsibility.
- Feature Isolation.
- Minimal Global State.
- Reusable State Logic.
- Predictable State Management.
- Easy Testing.
- Easy Scalability.

Setiap Store hanya bertanggung jawab terhadap satu domain aplikasi.

---

# 7.3 Directory Structure

Struktur Store mengikuti FILE-STRUCTURE.md.

```text
apps/
└── frontend/
    └── src/
        ├── stores/
        │
        ├── auth/
        │     ├── auth.store.js
        │     ├── auth.actions.js
        │     ├── auth.selectors.js
        │     └── index.js
        │
        ├── layout/
        │     ├── layout.store.js
        │     ├── layout.actions.js
        │     ├── layout.selectors.js
        │     └── index.js
        │
        ├── ui/
        │     ├── ui.store.js
        │     ├── ui.actions.js
        │     ├── ui.selectors.js
        │     └── index.js
        │
        ├── user/
        │     ├── user.store.js
        │     ├── user.actions.js
        │     ├── user.selectors.js
        │     └── index.js
        │
        └── index.js
```

Store hanya digunakan untuk Global State.

Server State tetap berada pada TanStack Query.

---

# 7.4 Store Responsibility

Setiap Store memiliki domain yang jelas.

| Store | Responsibility |
|--------|----------------|
| Auth Store | Authentication Session |
| User Store | Current User Information |
| Layout Store | Sidebar, Breadcrumb, Navigation |
| UI Store | Theme, Toast, Global Loading, Dialog |

Store tidak diperbolehkan menangani domain di luar tanggung jawabnya.

---

# 7.5 Store Access Flow

Seluruh akses Store mengikuti alur berikut.

```text
React Component

↓

Custom Hook

↓

Selector

↓

Store

↓

Action

↓

State Updated

↓

Component Re-render
```

Component tidak diperbolehkan mengakses state internal secara langsung tanpa menggunakan Store API yang telah disediakan.

---

# 7.6 Store Composition

Store dibangun menggunakan komposisi yang sederhana.

```text
Store

│

├── Initial State

├── Selectors

├── Actions

└── Utilities
```

Masing-masing bagian memiliki tanggung jawab yang berbeda sehingga Store tetap mudah dipelihara.

---

# 7.7 Store Rules

### SO-001

Satu Store hanya memiliki satu domain.

---

### SO-002

Store tidak boleh saling mengimpor Store lain secara langsung.

---

### SO-003

Store tidak boleh melakukan HTTP Request.

---

### SO-004

Store tidak boleh menyimpan Server State.

---

### SO-005

Store tidak boleh mengandung Business Logic.

---

### SO-006

Store hanya menyimpan Global State.

---

### SO-007

Seluruh perubahan state dilakukan melalui Action.

---

### SO-008

Pembacaan state menggunakan Selector atau Custom Hook.

---

# 7.8 Dependency Rules

Dependency Store mengikuti struktur berikut.

```text
Component

↓

Custom Hook

↓

Selector

↓

Store

↓

Action
```

Dependency sebaliknya tidak diperbolehkan.

Store tidak boleh mengetahui keberadaan Component maupun Page.

---

# 7.9 Best Practices

Seluruh implementasi Store disarankan mengikuti praktik berikut.

- Pisahkan Store berdasarkan domain.
- Gunakan nama Store yang konsisten.
- Gunakan Selector untuk membaca state.
- Hindari Store yang terlalu besar.
- Hindari nested state yang kompleks.
- Gunakan Action yang spesifik.
- Simpan hanya data yang benar-benar diperlukan.
- Dokumentasikan setiap Store sesuai domainnya.

---

# 7.10 Expected Outcome

Store Organization dinyatakan memenuhi standar apabila.

- Setiap Store memiliki domain yang jelas.
- Tidak terdapat duplicate state.
- Store tidak saling bergantung secara langsung.
- Store tidak menyimpan Server State.
- Store tidak melakukan HTTP Request.
- Store mengikuti struktur FILE-STRUCTURE.md.
- Seluruh implementasi konsisten dengan ENGINEERING-FOUNDATION.md, COMPONENT-SPEC.md, dan ROUTING.md.

# END OF PART 7
# ==============================================================================

# ==============================================================================
# STATE-MANAGEMENT.md
# PART 8 — STATE FLOW
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan alur perpindahan (flow) state pada Engineering Document Management System (EDMS). |
| **Technology** | React, Zustand, TanStack Query |
| **Depends On** | ROUTING.md, COMPONENT-SPEC.md, FILE-STRUCTURE.md |
| **Primary Audience** | Frontend Developer, Technical Lead, AI Coding Agent |

---

# 8.1 Overview

State Flow mendefinisikan bagaimana data bergerak di dalam aplikasi, mulai dari interaksi pengguna, pengelolaan state, komunikasi dengan Backend, hingga pembaruan User Interface.

Seluruh alur state harus mengikuti arsitektur yang telah ditetapkan sehingga perubahan data dapat diprediksi, mudah ditelusuri, dan mudah dipelihara.

---

# 8.2 State Flow Philosophy

State Flow pada EDMS mengikuti prinsip **One-Way Data Flow**.

Seluruh perubahan data selalu bergerak dalam satu arah sehingga tidak terjadi perubahan state yang tidak terkontrol.

```text
User

↓

Event

↓

State

↓

UI Update
```

Pendekatan ini menjaga aplikasi tetap konsisten dan mempermudah proses debugging.

---

# 8.3 Local State Flow

Perubahan Local State mengikuti alur berikut.

```text
User Interaction

↓

React Component

↓

Local State

↓

Component Re-render
```

Contoh.

```text
User

↓

Click Upload Button

↓

Modal Open State

↓

Upload Dialog Displayed
```

Local State hanya memengaruhi Component yang bersangkutan.

---

# 8.4 Global State Flow

Perubahan Global State mengikuti alur berikut.

```text
User Interaction

↓

Component

↓

Store Action

↓

Zustand Store

↓

State Updated

↓

Subscribed Component Re-render
```

Contoh.

```text
User

↓

Collapse Sidebar

↓

Layout Store

↓

Sidebar State Updated

↓

Entire Layout Updated
```

Seluruh perubahan Global State dilakukan melalui Store Action.

---

# 8.5 Server State Flow

Perubahan Server State mengikuti alur berikut.

```text
Component

↓

TanStack Query

↓

Service Layer

↓

REST API

↓

Backend

↓

Response

↓

Query Cache

↓

Component Re-render
```

Contoh.

```text
Open Dashboard

↓

useDashboardSummary()

↓

dashboardService

↓

REST API

↓

Summary Data

↓

Dashboard Updated
```

Seluruh komunikasi Backend menggunakan pola ini.

---

# 8.6 Mutation Flow

Seluruh perubahan data ke Backend mengikuti alur berikut.

```text
User

↓

Component

↓

Mutation Hook

↓

Service Layer

↓

REST API

↓

Backend Updated

↓

Invalidate Query

↓

Automatic Refetch

↓

Updated UI
```

TanStack Query bertanggung jawab melakukan sinkronisasi cache setelah Mutation berhasil.

---

# 8.7 Cross-State Interaction

Interaksi antar jenis state mengikuti aturan berikut.

```text
Local State

↓

Trigger Action

↓

Global State

↓

Trigger Query

↓

Server State

↓

UI Updated
```

Hubungan antar state harus selalu mengikuti arah tersebut.

State tidak diperbolehkan saling memperbarui secara langsung.

---

# 8.8 State Synchronization

Sinkronisasi data dilakukan menggunakan mekanisme berikut.

| State Type | Synchronization Strategy |
|------------|--------------------------|
| Local State | React Re-render |
| Global State | Zustand Subscription |
| Server State | TanStack Query Cache |

Setiap jenis state memiliki mekanisme sinkronisasi yang berbeda sesuai tanggung jawabnya.

---

# 8.9 State Flow Rules

Seluruh implementasi wajib mengikuti aturan berikut.

### SF-001

State Flow menggunakan One-Way Data Flow.

---

### SF-002

Component tidak melakukan Direct API Call.

---

### SF-003

Seluruh komunikasi Backend dilakukan melalui Service Layer.

---

### SF-004

Seluruh perubahan Global State dilakukan melalui Store Action.

---

### SF-005

Server State hanya diperbarui melalui Mutation.

---

### SF-006

Cache dikelola oleh TanStack Query.

---

### SF-007

State tidak boleh diperbarui secara langsung (Direct Mutation).

---

### SF-008

Setiap perubahan state harus menghasilkan UI yang konsisten.

---

# 8.10 Expected Outcome

State Flow dinyatakan memenuhi standar apabila.

- Seluruh data mengikuti One-Way Data Flow.
- Local State hanya memengaruhi Component terkait.
- Global State diperbarui melalui Store Action.
- Server State dikelola oleh TanStack Query.
- Seluruh komunikasi Backend melalui Service Layer.
- Tidak terdapat perubahan state yang tidak dapat ditelusuri.
- Seluruh implementasi konsisten dengan ENGINEERING-FOUNDATION.md, FILE-STRUCTURE.md, ROUTING.md, dan COMPONENT-SPEC.md.

# END OF PART 8
# ==============================================================================

# ==============================================================================
# STATE-MANAGEMENT.md
# PART 9 — STATE RULES
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan aturan implementasi State Management pada Engineering Document Management System (EDMS). |
| **Technology** | React, Zustand, TanStack Query |
| **Depends On** | ENGINEERING-FOUNDATION.md, FILE-STRUCTURE.md, ROUTING.md, COMPONENT-SPEC.md |
| **Primary Audience** | Frontend Developer, Technical Lead, QA Engineer, AI Coding Agent |

---

# 9.1 Overview

State Rules mendefinisikan standar implementasi yang wajib diikuti oleh seluruh Product Module pada Engineering Document Management System (EDMS).

Tujuan utama bagian ini adalah memastikan seluruh implementasi state tetap konsisten, mudah dipelihara, tidak memiliki duplicate state, serta mengikuti arsitektur yang telah ditetapkan.

Seluruh aturan pada bagian ini bersifat wajib.

---

# 9.2 General Rules

Seluruh implementasi State Management wajib memenuhi prinsip berikut.

- Single Source of Truth.
- One-Way Data Flow.
- Feature-Oriented State.
- Separation of Concerns.
- Minimal Global State.
- Predictable State Changes.
- Reusable State Logic.
- No Duplicate State.

---

# 9.3 Local State Rules

Local State wajib digunakan untuk data yang hanya dibutuhkan oleh satu Component atau satu Page.

### SR-001

Gunakan React Hooks untuk Local State.

---

### SR-002

Local State tidak boleh dibagikan antar Product Module.

---

### SR-003

Local State tidak boleh digunakan untuk Authentication.

---

### SR-004

Local State tidak boleh menyimpan Server Data.

---

### SR-005

Local State harus dihapus ketika Component di-unmount.

---

# 9.4 Global State Rules

Global State wajib mengikuti aturan berikut.

### SR-006

Global State menggunakan Zustand.

---

### SR-007

Global State hanya menyimpan data yang digunakan lintas halaman atau lintas Product Module.

---

### SR-008

Global State tidak boleh menyimpan hasil REST API.

---

### SR-009

Global State tidak boleh mengandung Business Logic.

---

### SR-010

Seluruh perubahan Global State dilakukan melalui Store Action.

---

### SR-011

Store dipisahkan berdasarkan Domain.

---

# 9.5 Server State Rules

Server State wajib mengikuti aturan berikut.

### SR-012

Server State menggunakan TanStack Query.

---

### SR-013

Server State berasal dari REST API.

---

### SR-014

Component tidak diperbolehkan melakukan Direct API Call.

---

### SR-015

Seluruh komunikasi API dilakukan melalui Service Layer.

---

### SR-016

Cache dikelola oleh TanStack Query.

---

### SR-017

Server State tidak boleh disalin ke Global Store.

---

### SR-018

Mutation harus memperbarui Query Cache menggunakan mekanisme TanStack Query.

---

# 9.6 Store Rules

Store wajib memenuhi aturan berikut.

### SR-019

Satu Store hanya memiliki satu domain.

---

### SR-020

Store tidak boleh mengakses Store lain secara langsung.

---

### SR-021

Store tidak boleh melakukan HTTP Request.

---

### SR-022

Store tidak boleh mengetahui struktur UI.

---

### SR-023

Store tidak boleh mengandung Business Logic.

---

### SR-024

Store hanya bertanggung jawab terhadap Global State.

---

# 9.7 State Synchronization Rules

Sinkronisasi state wajib mengikuti aturan berikut.

### SR-025

Server State menggunakan Query Cache.

---

### SR-026

Global State menggunakan Zustand Subscription.

---

### SR-027

Local State menggunakan React Re-render.

---

### SR-028

Tidak diperbolehkan melakukan sinkronisasi state secara manual tanpa alasan yang jelas.

---

### SR-029

Invalidate Query digunakan setelah Mutation apabila diperlukan sinkronisasi data.

---

# 9.8 Forbidden Practices

Implementasi berikut tidak diperbolehkan.

- Menyimpan Dashboard Summary pada Zustand.
- Menyimpan Document Register pada Local State.
- Menyimpan Notification List pada Global Store.
- Melakukan Direct API Call dari Component.
- Menyimpan Business Logic di Store.
- Membuat Store lintas Domain.
- Menyalin seluruh Response API ke Global State.
- Membuat Duplicate State.
- Menggunakan State yang sama pada beberapa Store.
- Membuat Circular Dependency antar Store.
- Menggunakan Global State untuk menggantikan Local State.
- Menggunakan Local State untuk menggantikan Server State.

---

# 9.9 Best Practices

Seluruh implementasi State Management disarankan mengikuti praktik berikut.

- Gunakan Local State seminimal mungkin.
- Gunakan Global State hanya apabila benar-benar diperlukan.
- Gunakan TanStack Query untuk seluruh data Backend.
- Pisahkan Store berdasarkan Domain.
- Gunakan Selector atau Custom Hook untuk membaca Store.
- Gunakan Mutation untuk seluruh perubahan Server Data.
- Gunakan Query Key yang konsisten.
- Dokumentasikan setiap Store dan Query sesuai Product Module.
- Hindari nested state yang kompleks.
- Hindari duplicate state.

---

# 9.10 Acceptance Criteria

State Rules dinyatakan memenuhi standar apabila.

- Tidak terdapat Duplicate State.
- Seluruh Global State menggunakan Zustand.
- Seluruh Server State menggunakan TanStack Query.
- Local State hanya digunakan pada Component terkait.
- Store tidak mengandung Business Logic.
- Component tidak melakukan Direct API Call.
- Seluruh komunikasi Backend melalui Service Layer.
- Store dipisahkan berdasarkan Domain.
- Seluruh implementasi mengikuti ENGINEERING-FOUNDATION.md.
- Seluruh implementasi mengikuti FILE-STRUCTURE.md.
- Seluruh implementasi mengikuti COMPONENT-SPEC.md.
- Seluruh implementasi mengikuti ROUTING.md.

---

# END OF PART 9
# ==============================================================================

# ==============================================================================
# STATE-MANAGEMENT.md
# PART 10 — STATE MANAGEMENT ACCEPTANCE CRITERIA
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar akhir yang harus dipenuhi sebelum implementasi State Management pada Engineering Document Management System (EDMS) dinyatakan siap digunakan sebagai fondasi pengembangan Frontend. |
| **Depends On** | ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, FILE-STRUCTURE.md, ROUTING.md, COMPONENT-SPEC.md |
| **Primary Audience** | Product Owner, Technical Lead, Frontend Developer, QA Engineer, AI Coding Agent |

---

# 10.1 Purpose

State Management Acceptance Criteria mendefinisikan seluruh persyaratan yang wajib dipenuhi sebelum implementasi State Management dinyatakan **Approved**.

Bagian ini menjadi acuan resmi dalam proses Architecture Review, Development Review, dan Code Review untuk memastikan seluruh implementasi mengikuti standar arsitektur proyek.

---

# 10.2 Acceptance Scope

Acceptance Criteria mencakup seluruh aspek State Management, meliputi.

- State Management Philosophy
- State Architecture
- Global State
- Local State
- Server State
- Store Organization
- State Flow
- State Rules

Seluruh aspek tersebut wajib memenuhi standar sebelum implementasi Frontend dimulai.

---

# 10.3 Architecture Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| ARC-001 | Menggunakan arsitektur State Management yang telah ditetapkan. | ☐ |
| ARC-002 | Menggunakan React Hooks untuk Local State. | ☐ |
| ARC-003 | Menggunakan Zustand untuk Global State. | ☐ |
| ARC-004 | Menggunakan TanStack Query untuk Server State. | ☐ |
| ARC-005 | Menggunakan Service Layer untuk komunikasi REST API. | ☐ |
| ARC-006 | Mengikuti Feature-Oriented Architecture. | ☐ |

---

# 10.4 Local State Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| LS-001 | Local State hanya digunakan oleh Component terkait. | ☐ |
| LS-002 | Local State tidak menyimpan Authentication. | ☐ |
| LS-003 | Local State tidak menyimpan Server Data. | ☐ |
| LS-004 | Local State dihapus saat Component di-unmount. | ☐ |
| LS-005 | Local State menggunakan React Hooks. | ☐ |

---

# 10.5 Global State Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| GS-001 | Global State menggunakan Zustand. | ☐ |
| GS-002 | Store dipisahkan berdasarkan Domain. | ☐ |
| GS-003 | Store tidak mengandung Business Logic. | ☐ |
| GS-004 | Store tidak melakukan HTTP Request. | ☐ |
| GS-005 | Store tidak menyimpan Server State. | ☐ |
| GS-006 | Seluruh perubahan dilakukan melalui Store Action. | ☐ |

---

# 10.6 Server State Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| SS-001 | Seluruh data Backend menggunakan TanStack Query. | ☐ |
| SS-002 | Seluruh komunikasi Backend melalui Service Layer. | ☐ |
| SS-003 | Component tidak melakukan Direct API Call. | ☐ |
| SS-004 | Cache dikelola oleh TanStack Query. | ☐ |
| SS-005 | Mutation memperbarui Query Cache. | ☐ |
| SS-006 | Tidak terdapat duplicate Server State pada Zustand. | ☐ |

---

# 10.7 Store Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| ST-001 | Store memiliki satu domain yang jelas. | ☐ |
| ST-002 | Tidak terdapat Circular Dependency antar Store. | ☐ |
| ST-003 | Store mengikuti struktur FILE-STRUCTURE.md. | ☐ |
| ST-004 | Store menggunakan Selector atau Custom Hook. | ☐ |
| ST-005 | Store tidak mengetahui struktur UI. | ☐ |

---

# 10.8 Development Readiness Checklist

Sebelum implementasi dimulai, seluruh checklist berikut harus terpenuhi.

| Checklist | Status |
|-----------|--------|
| State Architecture telah ditetapkan | ☐ |
| Local State Strategy selesai | ☐ |
| Global State Strategy selesai | ☐ |
| Server State Strategy selesai | ☐ |
| Store Organization selesai | ☐ |
| State Flow selesai | ☐ |
| State Rules selesai | ☐ |
| Struktur mengikuti FILE-STRUCTURE.md | ☐ |
| Routing mengikuti ROUTING.md | ☐ |
| Component mengikuti COMPONENT-SPEC.md | ☐ |
| Technology Stack mengikuti ENGINEERING-FOUNDATION.md | ☐ |

---

# 10.9 Production Readiness

State Management dinyatakan siap digunakan apabila.

- Seluruh jenis state memiliki tanggung jawab yang jelas.
- Tidak terdapat Duplicate State.
- Seluruh komunikasi Backend menggunakan Service Layer.
- Seluruh Global State menggunakan Zustand.
- Seluruh Server State menggunakan TanStack Query.
- Struktur Store mengikuti Domain yang telah ditetapkan.
- State mengikuti One-Way Data Flow.
- Seluruh implementasi mudah dipelihara dan mudah dikembangkan.
- Seluruh implementasi siap digunakan pada seluruh Product Module EDMS.

---

# 10.10 Final Acceptance

STATE-MANAGEMENT.md dinyatakan **Approved** apabila.

- Seluruh Acceptance Criteria telah terpenuhi.
- Arsitektur State Management konsisten dengan PRD.md.
- Arsitektur State Management mengikuti ENGINEERING-FOUNDATION.md.
- Arsitektur State Management mengikuti IMPLEMENTATION-PLAN.md.
- Arsitektur State Management mengikuti FILE-STRUCTURE.md.
- Arsitektur State Management mengikuti ROUTING.md.
- Arsitektur State Management mengikuti COMPONENT-SPEC.md.
- Implementasi siap diintegrasikan dengan API-CONTRACT.md.
- Product Owner menyetujui STATE-MANAGEMENT.md sebagai **State Management Baseline** untuk seluruh implementasi Frontend Engineering Document Management System (EDMS) Rebuild.

---

# End of PART 10

STATE-MANAGEMENT.md menjadi **State Management Baseline** yang mendefinisikan standar resmi pengelolaan state pada Engineering Document Management System (EDMS) Rebuild.

Seluruh implementasi React Hooks, Zustand, TanStack Query, Store Organization, Service Layer, serta State Flow wajib mengacu pada dokumen ini agar pengelolaan state tetap konsisten, scalable, mudah dipelihara, dan selaras dengan seluruh Source of Truth proyek.

# ==============================================================================

---

# PHASE 2 SOURCE OF TRUTH SYNCHRONIZATION

## Current Implementation

Legacy / historical implementation:

- Zustand digunakan untuk Active Project Context: `accessibleProjects`, `activeProject`, `activeMembership`, `activeOfficialRole`, `loading`, `error`, dan `initialized`.
- TanStack Query digunakan untuk server-state simulation dari Service Layer, invalidation, refetch, dan caching.
- localStorage digunakan untuk `edms.currentUser`, `edms.activeProjectByUser`, dan `edms.sidebar.collapsed`.
- Pada fase legacy/frontend-local, IndexedDB digunakan sebagai local persistence utama untuk entity dan file binary.
- Component tidak boleh memanggil IndexedDB langsung; akses data berjalan melalui Service Layer.

Current backend-integrated runtime:

- Backend REST API menjadi Runtime Source of Truth untuk business data.
- MySQL menjadi canonical persistence untuk entity, workflow, notification, audit, SLA marker, project membership, dan storage metadata.
- TanStack Query digunakan untuk server-state dari REST API, cache, invalidation, refetch, realtime recovery, dan post-mutation synchronization.
- Zustand tetap digunakan untuk Active Project Context dan global UI/project context state.
- localStorage hanya digunakan untuk frontend snapshot atau preference non-business seperti `edms.currentUser`, sidebar collapse state, dan UI preference lain yang tidak menjadi canonical business data.
- IndexedDB, mock JSON, Fake API, dan local workflow/history builder dinyatakan **Legacy / Historical Frontend Baseline** dan bukan Runtime Source of Truth untuk implementasi backend-integrated saat ini.
- Realtime SSE hanya menjadi Event Channel untuk invalidation/refetch; data final tetap diambil ulang melalui REST API.

## State Boundary

- Authentication State berasal dari `AuthService`.
- Project Context State berasal dari `project-context.store`.
- UI State lokal seperti modal, wizard step, selected row, dan filter sementara dikelola di component atau hooks.
- Persistent entity state runtime berada di Backend REST API dan MySQL.
- Query state yang berasal dari REST API dikelola TanStack Query.
- IndexedDB persistence diklasifikasikan sebagai legacy/historical baseline kecuali secara eksplisit dipakai untuk tool development non-runtime.

## Project Context Rule

Project-scoped feature hanya boleh aktif apabila user memiliki Active Project berstatus `Active` dan Membership berstatus `Active`. Jika Project berubah menjadi `Closed`, Active Project Context wajib dibersihkan dan sistem tidak memilih project lain otomatis.
