# ==============================================================================
# MOCK-DATA.md
# PART 1 — DOCUMENT OVERVIEW
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Document Level** | Technical Design Document |
| **Document Status** | Draft |
| **Owner** | Frontend Architecture |
| **Purpose** | Mendefinisikan standar resmi Mock Data yang digunakan selama proses pengembangan Frontend Engineering Document Management System (EDMS) sehingga seluruh implementasi memiliki struktur data yang konsisten, siap diintegrasikan dengan REST API, dan sesuai dengan Source of Truth proyek. |
| **Depends On** | PRD.md, ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, UI-GUIDELINES.md, COMPONENT-SPEC.md, FILE-STRUCTURE.md, ROUTING.md, STATE-MANAGEMENT.md, API-CONTRACT.md, ACCESS-CONTROL.md, FORM-SPEC.md |
| **Design Reference** | Approved UI Design Mockup |
| **Behaviour Reference** | BUSINESS-WORKFLOW.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, Technical Lead, AI Coding Agent |
| **Change Impact** | Very High |
| **Last Review** | Architecture Review |

---

# 1.1 Purpose

MOCK-DATA.md merupakan dokumen resmi yang mendefinisikan standar penyusunan, struktur, organisasi, dan penggunaan Mock Data pada proyek **Engineering Document Management System (EDMS) Rebuild**.

Mock Data digunakan sebagai **Official Development Data Source** selama proses pengembangan Frontend sebelum REST API tersedia.

Dokumen ini memastikan seluruh data dummy yang digunakan selama pengembangan memiliki struktur yang konsisten dengan kontrak API, kebutuhan antarmuka pengguna, arsitektur aplikasi, dan spesifikasi produk yang telah ditetapkan.

MOCK-DATA.md tidak mendefinisikan Business Workflow, Business Rule, maupun Functional Requirement baru.

Seluruh perilaku sistem tetap mengacu pada dokumen Source of Truth yang telah ditetapkan, sedangkan BUSINESS-WORKFLOW.md hanya digunakan sebagai **Behaviour Reference Only**.

---

# 1.2 Objectives

Penyusunan MOCK-DATA.md bertujuan untuk:

- Menetapkan standar resmi Mock Data pada proyek EDMS Rebuild.
- Menentukan struktur dataset yang digunakan selama pengembangan Frontend.
- Menjamin kesesuaian struktur Mock Data dengan API Contract.
- Mendukung strategi **Mock First Development**.
- Memastikan Mock Data dapat diganti menjadi REST API tanpa perubahan pada Component.
- Menjadi acuan implementasi Service Layer selama tahap Development.
- Mengurangi inkonsistensi struktur data antar Feature.
- Menjadi referensi implementasi bagi Frontend Developer, Backend Developer, QA Engineer, dan AI Coding Agent.

---

# 1.3 Scope

Dokumen ini mencakup:

- Mock Data Philosophy
- Dataset Architecture
- Dataset Organization
- Entity Dataset
- JSON Structure Standard
- Data Relationship
- Mock Service Strategy
- Data Generation Rules
- Naming Convention
- Mock API Mapping
- Dataset Ownership
- Mock Data Acceptance Criteria

Dokumen ini tidak membahas:

- Business Workflow
- Business Rules
- REST API Implementation
- Backend Business Logic
- Database Schema
- UI Styling
- React Component Implementation
- State Management Implementation Detail

Topik tersebut dijelaskan pada dokumen Source of Truth yang sesuai.

---

# 1.4 Document Position

MOCK-DATA.md merupakan bagian dari **Technical Design Documents** yang menerjemahkan kebutuhan produk, arsitektur aplikasi, dan kontrak API menjadi dataset resmi yang digunakan selama proses pengembangan Frontend.

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
API-CONTRACT.md
        │
        ▼
STATE-MANAGEMENT.md
        │
        ▼
MOCK-DATA.md
        │
        ▼
Mock JSON
        │
        ▼
Service Layer
        │
        ▼
React Components
```

MOCK-DATA.md tidak menggantikan API-CONTRACT.md maupun STATE-MANAGEMENT.md.

Dokumen ini melengkapi keduanya dengan mendefinisikan dataset yang digunakan selama tahap Development sehingga Frontend dapat dibangun sebelum REST API tersedia.

---

# 1.5 Source of Truth

Seluruh isi MOCK-DATA.md wajib mengacu pada dokumen berikut.

| Priority | Reference | Purpose |
|----------|-----------|---------|
| **1** | PRD.md | Menentukan Product Module, Entity, Feature, Functional Behaviour, dan Business Data yang harus direpresentasikan oleh Mock Data. |
| **2** | ENGINEERING-FOUNDATION.md | Menentukan Technology Stack, Mock First Development Strategy, Service Layer Pattern, dan API Ready Architecture. |
| **3** | IMPLEMENTATION-PLAN.md | Menentukan urutan implementasi module serta strategi penggunaan Mock Data selama Development. |
| **4** | API-CONTRACT.md | Menentukan struktur Request, Response, Payload, serta format data yang harus diikuti oleh Mock JSON. |
| **5** | STATE-MANAGEMENT.md | Menentukan hubungan antara Mock Data, Service Layer, TanStack Query, dan React Components. |
| **6** | COMPONENT-SPEC.md | Menentukan kebutuhan data setiap Component. |
| **7** | FORM-SPEC.md | Menentukan struktur data Form, Option List, Default Value, dan Validation Source. |
| **8** | ACCESS-CONTROL.md | Menentukan Role, Permission, serta data hak akses yang harus tersedia pada Mock Data. |
| **9** | FILE-STRUCTURE.md | Menentukan lokasi penyimpanan dataset dan organisasi file Mock Data. |
| **10** | ROUTING.md | Menentukan hubungan antara Route, Page, dan dataset yang digunakan. |
| **11** | UI-GUIDELINES.md | Menentukan kebutuhan visual yang memerlukan dataset untuk ditampilkan pada antarmuka pengguna. |
| **12** | Approved UI Design Mockup | Menjadi Visual Source of Truth terhadap informasi yang harus tersedia pada setiap halaman. |
| **13** | BUSINESS-WORKFLOW.md | Digunakan sebagai **Behaviour Reference Only** untuk memastikan perubahan data mengikuti alur bisnis yang telah ditetapkan. |

MOCK-DATA.md tidak diperbolehkan mendefinisikan struktur data yang bertentangan dengan dokumen Source of Truth tersebut.

---

# 1.6 Mock Data Principles

Seluruh Mock Data wajib mengikuti prinsip berikut.

- Single Source of Truth.
- Mock First Development.
- API Ready Structure.
- Service Layer Only.
- Feature First Organization.
- Predictable Dataset.
- Consistent Entity Structure.
- Reusable Dataset.
- No Business Logic Inside Mock Data.
- Easy Backend Replacement.

---

# 1.7 Expected Outcome

Setelah MOCK-DATA.md diterapkan, seluruh proses pengembangan Frontend EDMS Rebuild diharapkan memiliki Mock Data yang:

- Konsisten dengan PRD.md dan API-CONTRACT.md.
- Mengikuti struktur Entity resmi proyek.
- Siap digunakan oleh Service Layer.
- Dapat dikonsumsi oleh TanStack Query tanpa transformasi tambahan.
- Mendukung seluruh Product Module sesuai Approved UI Design Mockup.
- Mudah diganti dari Mock JSON menjadi REST API tanpa mengubah Component maupun State Management.
- Menjadi acuan resmi implementasi Frontend, QA Engineer, Backend Developer, dan AI Coding Agent selama proses pengembangan.

---

# END OF PART 1

# ==============================================================================
# MOCK-DATA.md
# PART 2 — MOCK DATA PHILOSOPHY
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan filosofi penggunaan Mock Data sebagai sumber data resmi selama pengembangan Frontend EDMS sebelum Backend tersedia. |
| **Depends On** | ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, API-CONTRACT.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 2.1 Overview

Mock Data merupakan representasi data nyata yang digunakan selama proses pengembangan Frontend.

Seluruh Mock Data harus memiliki struktur yang identik dengan REST API sehingga proses migrasi menuju Backend Production tidak memerlukan perubahan pada Component, Store, maupun Routing.

Mock Data bukan sekadar data dummy, melainkan **Official Development Data Source**.

---

# 2.2 Philosophy

Mock Data pada EDMS dibangun berdasarkan prinsip **API First Development**.

Frontend dikembangkan seolah-olah REST API telah tersedia.

Perbedaannya hanya terletak pada sumber data.

```text
Development

Component

↓

Service Layer

↓

Mock JSON



Production

Component

↓

Service Layer

↓

REST API
```

Dengan pendekatan ini, Component tidak mengetahui apakah data berasal dari Mock JSON atau REST API.

---

# 2.3 Core Principles

Seluruh Mock Data wajib mengikuti prinsip berikut.

## MOCK-001 — Single Source of Truth

Setiap Entity hanya memiliki satu dataset resmi.

---

## MOCK-002 — API Ready

Struktur JSON harus identik dengan Response REST API.

---

## MOCK-003 — Feature First

Dataset dipisahkan berdasarkan Feature.

---

## MOCK-004 — No Business Logic

Mock Data hanya menyimpan data.

Tidak boleh mengandung Business Logic.

---

## MOCK-005 — Reusable

Satu dataset dapat digunakan oleh beberapa halaman.

---

## MOCK-006 — Predictable

Isi dataset harus konsisten.

---

## MOCK-007 — Replaceable

Mock JSON dapat diganti dengan REST API tanpa mengubah Component.

---

## MOCK-008 — Source Mock vs Runtime Demo Data

Source Mock / Seed Definition berbeda dengan Runtime Persisted Demo Data.

Reset All Demo Data hanya menghapus runtime persisted demo data dan tidak mengambil ulang credential dari file Mock JSON source.

Fresh installation menggunakan clean bootstrap baseline:

- User Account hanya `wahyuts`.
- Credential bootstrap tersedia hanya untuk inisialisasi storage baru.
- Department minimum akun `wahyuts` adalah `DIV 2`.
- Fixed Role Catalog tetap tersedia.
- Permission Catalog tetap tersedia.
- Role-Permission Mapping tetap tersedia.
- Project kosong.
- Project Membership kosong.
- Document, Revision, Workflow Comment, Workflow Notification, SLA, Escalation, Notification, dan Audit Trail demo kosong.
- Password Reset Token dan Mock Email development kosong.

Setelah reset berhasil, runtime data berada pada kondisi bootstrap:

- User Account hanya `wahyuts`.
- Department minimum akun `wahyuts` tetap valid.
- Project kosong.
- Project Membership kosong.
- Document, Revision, Workflow Comment, SLA, Escalation, Notification, dan Audit Trail demo kosong.

Seed source tetap dipertahankan sebagai baseline development untuk fresh initialization dan tidak dianggap sebagai data runtime yang harus dihapus dari repository.

---

# 2.4 Development Strategy

Strategi pengembangan menggunakan pendekatan berikut.

```text
JSON Dataset

↓

Service Layer

↓

TanStack Query

↓

React Component

↓

User Interface
```

Seluruh akses data dilakukan melalui Service Layer.

Component tidak membaca file JSON secara langsung.

---

# 2.5 Dataset Ownership

Setiap dataset memiliki pemilik yang jelas.

| Dataset | Owner |
|----------|-------|
| Dashboard | Dashboard Feature |
| Documents | Document Register |
| Notifications | Notification Feature |
| Users | Administration |
| Roles | Administration |
| Permissions | Access Control |
| SLA | SLA Monitoring |
| Escalation | Escalation |
| Audit Trail | Audit Trail |

---

## 2.5.1 Document Lifecycle Data

Dataset Documents wajib mendukung field Lifecycle.

Nilai resmi:

- Active
- Archived

Default Lifecycle untuk dokumen existing adalah Active apabila field belum tersedia.
Archived Document tetap berada pada dataset Documents yang sama dan tidak boleh dipindahkan ke dataset Archive terpisah.
Archive dan Restore tidak menghapus Revision History, Workflow History, Audit Trail, file, atau relasi dokumen.

---

## 2.5.2 Document Created Date Data

Dataset Documents menggunakan field Created Date existing untuk mencatat tanggal pertama kali Document dibuat di EDMS.

Implementasi mock dapat menggunakan nama field yang sudah tersedia pada aplikasi, yaitu `createdDate`.
Field ini tidak boleh dibuat ulang ketika hanya menampilkan data di Document Register Table.
PFD Register dan P&ID Register menampilkan Created Date; Dashboard tidak berubah.

---

# 2.6 Data Flow

Seluruh aliran data mengikuti pola berikut.

```text
Mock JSON

↓

Mock Service

↓

TanStack Query

↓

React Component

↓

UI
```

Perubahan sumber data tidak memengaruhi implementasi UI.

---

# 2.7 Design Goals

Mock Data harus memenuhi tujuan berikut.

- Predictable
- Reusable
- API Ready
- Mock First
- Easy Maintenance
- Feature Isolation
- Easy Migration
- Easy Testing

---

# 2.8 Anti Patterns

Implementasi berikut tidak diperbolehkan.

- Component membaca JSON secara langsung.
- Menyimpan Business Logic pada JSON.
- Struktur JSON berbeda dengan API.
- Satu Entity memiliki beberapa dataset utama.
- Hardcode data di dalam Component.

---

# 2.9 Relationship With Other Documents

| Document | Relationship |
|----------|--------------|
| API-CONTRACT.md | JSON Structure |
| STATE-MANAGEMENT.md | Data Consumption |
| FORM-SPEC.md | Form Dataset |
| COMPONENT-SPEC.md | Component Props |
| ROUTING.md | Dataset Usage |
| ACCESS-CONTROL.md | Permission Dataset |

---

# 2.10 Expected Outcome

Mock Data Philosophy dinyatakan berhasil apabila.

- Seluruh Mock Data mengikuti API Contract.
- Component tidak mengetahui sumber data.
- Seluruh Feature menggunakan dataset resmi.
- Migrasi menuju REST API tidak mengubah implementasi Frontend.

# END OF PART 2
# ==============================================================================

# ==============================================================================
# MOCK-DATA.md
# PART 3 — DATASET ARCHITECTURE
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan arsitektur organisasi seluruh dataset Mock Data pada Engineering Document Management System (EDMS). |
| **Depends On** | FILE-STRUCTURE.md, API-CONTRACT.md, STATE-MANAGEMENT.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 3.1 Overview

Dataset Architecture menjelaskan bagaimana seluruh Mock Data diorganisasikan di dalam project agar mudah dipelihara, mudah digunakan kembali, dan konsisten dengan struktur Feature First.

Seluruh dataset harus dipisahkan berdasarkan domain bisnis, bukan berdasarkan halaman.

---

# 3.2 Dataset Organization

Dataset mengikuti struktur Feature First.

```text
Mock Data

├── Dashboard

├── Documents

├── Notifications

├── Users

├── Roles

├── Permissions

├── SLA

├── Escalation

├── Audit Trail

└── Shared
```

Setiap folder hanya menyimpan dataset milik Feature tersebut.

---

# 3.3 Directory Structure

Runtime mock structure resmi mengikuti Domain 3 Frontend Architecture:

```text
src/
└── shared/
    └── mocks/
        ├── users/
        ├── departments/
        ├── projects/
        ├── project-memberships/
        ├── documents/
        ├── revisions/
        ├── workflow-comments/
        ├── workflow-attachments/
        ├── notifications/
        ├── audit-trails/
        └── authorization-catalog/
```

Historical Reference: struktur lama di bawah berbasis `src/mocks`, `src/data`, root `services`, dan `factories` bukan runtime folder structure aktif.

```text
apps/

└── frontend/

    └── src/

        ├── mocks/

        │

        ├── data/

        │   ├── dashboard/
        │   ├── documents/
        │   ├── notifications/
        │   ├── users/
        │   ├── roles/
        │   ├── permissions/
        │   ├── sla/
        │   ├── escalation/
        │   ├── audit-trail/
        │   └── shared/

        │
        ├── services/
        │
        └── factories/
```

Struktur runtime aktif mengikuti FILE-STRUCTURE.md.

---

# 3.4 Dataset Categories

| Category | Description |
|----------|-------------|
| Master Data | Data referensi |
| Transaction Data | Data operasional |
| Dashboard Data | Ringkasan Dashboard |
| User Data | User |
| Authorization Catalog | Roles dan Permissions sebagai catalog/reference |
| Monitoring Data | SLA & Escalation |
| Audit Data | Audit Trail |

---

# 3.5 Dataset Lifecycle

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

Historical Reference: diagram lama di bawah bukan runtime data flow aktif.

```text
Create Dataset

↓

Store JSON

↓

Mock Service

↓

Query

↓

Component

↓

UI
```

---

# 3.6 Dataset Rules

### DATASET-001

Satu Entity memiliki satu dataset utama.

---

### DATASET-002

Dataset dipisahkan berdasarkan Feature.

---

### DATASET-003

Tidak boleh ada duplikasi Entity.

---

### DATASET-004

Nama dataset menggunakan kebab-case.

---

### DATASET-005

Dataset mengikuti API-CONTRACT.md.

---

### DATASET-006

Dataset hanya diakses melalui Service Layer.

---

# 3.7 Dataset Naming Convention

| Entity | File Name |
|----------|-----------|
| Dashboard | dashboard.json |
| Documents | documents.json |
| Notifications | notifications.json |
| Users | users.json |
| Departments | departments.json |
| Projects | projects.json |
| Project Memberships | project-memberships.json |
| Revisions | revisions.json |
| Workflow Comments | workflow-comments.json |
| Workflow Attachments | workflow-attachments.json |
| Roles | roles.json (Authorization Catalog / Historical Reference) |
| Permissions | permissions.json (Authorization Catalog / Historical Reference) |
| SLA | sla-monitoring.json |
| Escalation | escalation.json |
| Audit Trail | audit-trail.json |

---

# 3.8 Architecture Diagram

```text
JSON Dataset

↓

Mock Service

↓

TanStack Query

↓

React Component

↓

UI
```

Seluruh Feature mengikuti arsitektur yang sama.

---

# 3.9 Relationship With Other Documents

| Document | Relationship |
|----------|--------------|
| FILE-STRUCTURE.md | Folder Organization |
| API-CONTRACT.md | JSON Schema |
| STATE-MANAGEMENT.md | Server State |
| COMPONENT-SPEC.md | Component Data |
| FORM-SPEC.md | Form Dataset |

---

# 3.10 Expected Outcome

Dataset Architecture dinyatakan memenuhi standar apabila.

- Seluruh dataset memiliki struktur yang konsisten.
- Dataset dipisahkan berdasarkan Feature.
- JSON mengikuti API Contract.
- Service Layer menjadi satu-satunya akses data.
- Struktur siap diganti menjadi REST API.

# END OF PART 3
# ==============================================================================

# ==============================================================================
# MOCK-DATA.md
# PART 4 — ENTITY DEFINITION
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan seluruh Entity yang digunakan pada Mock Data Engineering Document Management System (EDMS). |
| **Depends On** | PRD.md, API-CONTRACT.md, FORM-SPEC.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 4.1 Overview

Entity merupakan representasi objek bisnis yang digunakan pada seluruh Product Module EDMS.

Setiap Entity memiliki struktur data yang tetap dan menjadi dasar penyusunan Mock JSON maupun REST API.

Seluruh Entity wajib memiliki identitas yang unik serta mengikuti API Contract.

---

# 4.2 Entity Categories

Entity pada EDMS dikelompokkan berdasarkan domain bisnis.

| Category | Entity |
|----------|--------|
| Dashboard | Dashboard Summary |
| Document Management | Document |
| User Management | User |
| Authorization | Role, Permission |
| Notification | Notification |
| SLA Monitoring | SLA Record |
| Escalation | Escalation Record |
| Audit | Audit Trail |
| Reference | Area, Discipline, Drawing Type |

---

# 4.3 Core Entity List

| Entity | Primary Key | Description |
|----------|-------------|-------------|
| Dashboard | id | Ringkasan Dashboard |
| Document | id | Data Dokumen Engineering |
| User | id | Data Pengguna |
| Role | id | Hak Peran |
| Permission | id | Hak Akses |
| Notification | id | Data Notifikasi |
| SLA | id | Monitoring SLA |
| Escalation | id | Data Eskalasi |
| Audit Trail | id | Riwayat Aktivitas |

Setiap Entity hanya memiliki satu representasi utama.

---

# 4.4 Document Entity

Entity Document menjadi pusat seluruh proses bisnis EDMS.

Contoh atribut.

| Property | Type |
|----------|------|
| id | Integer |
| documentNumber | String |
| documentTitle | String |
| drawingType | String |
| area | String |
| revision | String |
| status | Enum |
| slaTimer | String |
| currentAssignee | Object |
| attachment | Array |

Seluruh struktur mengikuti API-CONTRACT.md.

---

# 4.5 User Entity

Contoh atribut.

| Property | Type |
|----------|------|
| id | Integer |
| username | String |
| fullName | String |
| email | String |
| role | Object |
| isActive | Boolean |

---

# 4.6 Reference Entity

Reference Entity digunakan sebagai sumber data Dropdown maupun Lookup.

| Entity | Usage |
|----------|-------|
| Area | Form Upload |
| Discipline | Form Upload |
| Drawing Type | Form Upload |
| Workflow Status | Dashboard & Table |
| Approval Status | Approval Dialog |

Reference Data bersifat reusable.

---

# 4.7 Entity Rules

### ENTITY-001

Setiap Entity memiliki Primary Key.

---

### ENTITY-002

Setiap Entity memiliki struktur tetap.

---

### ENTITY-003

Entity mengikuti API-CONTRACT.md.

---

### ENTITY-004

Entity tidak mengandung Business Logic.

---

### ENTITY-005

Entity dapat digunakan ulang.

---

### ENTITY-006

Seluruh Entity menggunakan camelCase untuk Property.

---

# 4.8 Entity Relationship

```text
User
 │
 ├──────────────┐
 ▼              ▼

Role      Notification

 │

 ▼

Permission



Document

 │

 ├──────────┐

 ▼          ▼

SLA     Escalation

 │

 ▼

Audit Trail
```

Hubungan Entity hanya mendefinisikan relasi data, bukan Business Workflow.

---

# 4.9 Relationship With Other Documents

| Document | Relationship |
|----------|--------------|
| PRD.md | Business Entity |
| API-CONTRACT.md | Entity Schema |
| FORM-SPEC.md | Form Data Source |
| ACCESS-CONTROL.md | Role & Permission |
| COMPONENT-SPEC.md | Data Display |

---

# 4.10 Expected Outcome

Entity Definition dinyatakan memenuhi standar apabila.

- Seluruh Entity terdokumentasi.
- Struktur Entity konsisten.
- Entity mengikuti API Contract.
- Entity dapat digunakan ulang.
- Seluruh Product Module menggunakan Entity yang sama.

# END OF PART 4
# ==============================================================================

# ==============================================================================
# MOCK-DATA.md
# PART 5 — JSON DATASET SPECIFICATION
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar struktur file JSON yang digunakan sebagai Mock Data pada Engineering Document Management System (EDMS). |
| **Depends On** | API-CONTRACT.md, FILE-STRUCTURE.md, ENTITY DEFINITION |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 5.1 Overview

Setiap dataset Mock Data direpresentasikan dalam bentuk file JSON.

Struktur JSON harus identik dengan Response REST API agar proses migrasi menuju Backend tidak memerlukan perubahan pada Component maupun Service Layer.

---

# 5.2 JSON Structure Principles

Seluruh JSON wajib mengikuti prinsip berikut.

- API Ready
- Consistent Structure
- Predictable
- Easy Parsing
- Reusable
- Human Readable

---

# 5.3 Dataset Structure

Contoh struktur dataset.

```text
dashboard.json

documents.json

users.json

roles.json (Authorization Catalog / Historical Reference)
permissions.json (Authorization Catalog / Historical Reference)
notifications.json

sla-monitoring.json

escalation.json

audit-trail.json
```

Satu file mewakili satu Entity utama.

---

# 5.4 Standard JSON Layout

Seluruh dataset menggunakan struktur dasar berikut.

```json
{
  "success": true,
  "message": "Success",
  "data": []
}
```

Apabila diperlukan metadata.

```json
{
  "success": true,
  "message": "Success",
  "data": [],
  "meta": {}
}
```

Struktur mengikuti Response API.

---

# 5.5 Collection & Detail Dataset

Dataset dibedakan menjadi dua jenis.

| Type | Description |
|------|-------------|
| Collection | Daftar Entity |
| Detail | Satu Entity |

Contoh.

```text
documents.json

↓

Collection



document-detail.json

↓

Detail
```

---

# 5.6 Pagination Dataset

Dataset yang mendukung tabel menggunakan struktur berikut.

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 100,
    "totalPages": 10
  }
}
```

Mengikuti API-CONTRACT.md.

---

# 5.7 JSON Rules

### JSON-001

Satu dataset mewakili satu Entity utama.

---

### JSON-002

Nama Property mengikuti camelCase.

---

### JSON-003

Nama file menggunakan kebab-case.

---

### JSON-004

Struktur JSON mengikuti API Response.

---

### JSON-005

Tidak diperbolehkan menambahkan Property yang tidak ada pada API Contract.

---

### JSON-006

Dataset harus dapat diparsing tanpa transformasi tambahan.

---

# 5.8 Naming Convention

| Dataset | File |
|----------|------|
| Dashboard | dashboard.json |
| Documents | documents.json |
| Users | users.json |
| Roles | roles.json (Authorization Catalog / Historical Reference) |
| Permissions | permissions.json (Authorization Catalog / Historical Reference) |
| Notifications | notifications.json |
| SLA | sla-monitoring.json |
| Escalation | escalation.json |
| Audit Trail | audit-trail.json |

---

# 5.9 Relationship With Other Documents

| Document | Relationship |
|----------|--------------|
| API-CONTRACT.md | Response Structure |
| FILE-STRUCTURE.md | Storage Location |
| STATE-MANAGEMENT.md | Query Consumption |
| FORM-SPEC.md | Form Data Source |
| COMPONENT-SPEC.md | UI Binding |

---

# 5.10 Expected Outcome

JSON Dataset Specification dinyatakan memenuhi standar apabila.

- Seluruh JSON mengikuti API Contract.
- Struktur dataset konsisten.
- Dataset siap digunakan oleh Service Layer.
- Dataset siap dikonsumsi oleh TanStack Query.
- Migrasi menuju REST API tidak memerlukan perubahan struktur data.

# END OF PART 5
# ==============================================================================

# ==============================================================================
# MOCK-DATA.md
# PART 6 — RELATIONSHIP MAPPING
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan hubungan (Relationship) antar Entity pada Mock Data Engineering Document Management System (EDMS). |
| **Depends On** | PRD.md, API-CONTRACT.md, ENTITY DEFINITION |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 6.1 Overview

Relationship Mapping mendefinisikan bagaimana setiap Entity saling berhubungan di dalam Mock Data.

Relationship ini digunakan untuk memastikan struktur dataset konsisten dengan Business Domain dan REST API.

Relationship Mapping tidak mendefinisikan Business Workflow.

Relationship hanya menjelaskan keterkaitan data.

---

# 6.2 Relationship Categories

Relationship dibagi menjadi beberapa kategori.

| Category | Description |
|----------|-------------|
| One-to-One | Satu Entity memiliki satu pasangan Entity |
| One-to-Many | Satu Entity memiliki banyak Entity |
| Many-to-One | Banyak Entity mengacu pada satu Entity |
| Reference Lookup | Entity digunakan sebagai referensi |
| Shared Entity | Entity digunakan oleh banyak Feature |

---

# 6.3 Core Relationship

Relationship utama pada EDMS.

```text
User

│

├──────────────┐

▼              ▼

Role      Notification

│

▼

Permission



Document

│

├────────────┬────────────┐

▼            ▼            ▼

SLA      Escalation    Audit Trail
```

---

# 6.4 Document Relationship

Document menjadi Entity utama.

| Parent | Child | Relationship |
|----------|-------|--------------|
| Document | SLA | One-to-One |
| Document | Escalation | One-to-One |
| Document | Audit Trail | One-to-Many |
| Document | Notification | One-to-Many |

---

# 6.5 User Relationship

| Parent | Child | Relationship |
|----------|-------|--------------|
| User | Role | Many-to-One |
| Role | Permission | One-to-Many |
| User | Notification | One-to-Many |
| User | Audit Trail | One-to-Many |

---

# 6.6 Reference Relationship

Reference Entity digunakan oleh banyak Form.

| Reference | Used By |
|-----------|---------|
| Area | Document |
| Drawing Type | Document |
| Discipline | Document |
| Status | Dashboard |
| Approval Status | Approval Dialog |

Reference Data tidak memiliki hubungan transaksi.

---

# 6.7 Relationship Rules

### REL-001

Setiap Relationship harus memiliki Parent dan Child yang jelas.

---

### REL-002

Relationship mengikuti API-CONTRACT.md.

---

### REL-003

Reference Data bersifat read-only.

---

### REL-004

Entity tidak boleh memiliki Circular Relationship.

---

### REL-005

Relationship tidak mengandung Business Logic.

---

### REL-006

Primary Key harus konsisten pada seluruh dataset.

---

# 6.8 Relationship Diagram

```text
Users
 │
 ▼
Roles
 │
 ▼
Permissions


Documents
 │
 ├────────► SLA
 │
 ├────────► Escalation
 │
 ├────────► Notifications
 │
 └────────► Audit Trail


Reference Data
 │
 ├────────► Area
 ├────────► Discipline
 ├────────► Drawing Type
 └────────► Status
```

---

# 6.9 Relationship With Other Documents

| Document | Relationship |
|----------|--------------|
| PRD.md | Business Entity |
| API-CONTRACT.md | Entity Reference |
| FORM-SPEC.md | Lookup Dataset |
| ACCESS-CONTROL.md | Role Relationship |
| COMPONENT-SPEC.md | UI Binding |

---

# 6.10 Expected Outcome

Relationship Mapping dinyatakan memenuhi standar apabila.

- Seluruh Entity memiliki Relationship yang jelas.
- Tidak terjadi Circular Relationship.
- Primary Key digunakan secara konsisten.
- Dataset dapat digunakan ulang.
- Struktur Relationship identik dengan REST API.

# END OF PART 6
# ==============================================================================

# ==============================================================================
# MOCK-DATA.md
# PART 7 — FAKE API STRATEGY
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan strategi penggunaan Fake API sebagai lapisan abstraksi antara Mock JSON dan React Component pada Engineering Document Management System (EDMS). |
| **Depends On** | ENGINEERING-FOUNDATION.md, STATE-MANAGEMENT.md, API-CONTRACT.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 7.1 Overview

Fake API merupakan implementasi Service Layer yang membaca Mock JSON dan mengembalikan Response dengan struktur yang identik dengan REST API.

Seluruh React Component hanya berkomunikasi dengan Service Layer.

Component tidak diperbolehkan membaca file JSON secara langsung.

Current runtime alignment:

- Fake API, Mock JSON, IndexedDB mock stores, dan local token simulation adalah **Legacy / Historical Frontend Baseline**.
- Backend-integrated runtime saat ini menggunakan Backend REST API dan MySQL sebagai source data utama untuk scope yang sudah dimigrasikan.
- Mock Data tetap dipertahankan sebagai seed/reference development dan historical parity document, bukan sebagai Runtime Source of Truth.
- Component tetap tidak boleh membaca mock JSON secara langsung.

---

# 7.2 Fake API Architecture

```text
Mock JSON

↓

Fake API Service

↓

TanStack Query

↓

React Component

↓

UI
```

Pada saat Backend selesai dikembangkan, Fake API cukup diganti menjadi REST API tanpa mengubah Component.

---

# 7.3 Service Layer Principle

Service Layer bertanggung jawab untuk.

- Membaca dataset Mock JSON.
- Mengembalikan Promise.
- Menyeragamkan Response.
- Menyimulasikan Request API.
- Menjadi satu-satunya akses data.

Service Layer tidak mengandung Business Logic.

---

# 7.4 Fake API Behaviour

Fake API harus mensimulasikan perilaku REST API.

Contoh.

| Action | Behaviour |
|---------|-----------|
| GET | Mengambil Data |
| POST | Menambah Data |
| PUT | Memperbarui Data |
| PATCH | Memperbarui sebagian Data |
| DELETE | Menghapus Data |

Response mengikuti API-CONTRACT.md.

---

# 7.5 Response Simulation

Seluruh Response menggunakan struktur yang sama.

```json
{
  "success": true,
  "message": "Success",
  "data": []
}
```

Apabila terjadi Error.

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": []
}
```

---

# 7.6 Fake API Rules

### API-001

Component tidak boleh membaca JSON secara langsung.

---

### API-002

Seluruh akses data melalui Service Layer.

---

### API-003

Response mengikuti API-CONTRACT.md.

---

### API-004

Seluruh Method mengembalikan Promise.

---

### API-005

Fake API tidak mengandung Business Logic.

---

### API-006

Fake API harus dapat diganti menjadi REST API tanpa perubahan Component.

---

# 7.7 Migration Strategy

Tahapan migrasi.

```text
Phase 1

Mock JSON

↓

Fake API



Phase 2

REST API

↓

Service Layer



Phase 3

Production
```

Perubahan hanya dilakukan pada implementasi Service Layer.

---

# 7.8 Development Rules

- Gunakan Fake API selama Frontend Development.
- Jangan mengakses Mock JSON dari Component.
- Gunakan TanStack Query untuk seluruh Server State.
- Seluruh Endpoint mengikuti API-CONTRACT.md.
- Struktur Response harus identik dengan Backend.

---

# 7.9 Relationship With Other Documents

| Document | Relationship |
|----------|--------------|
| ENGINEERING-FOUNDATION.md | Mock First Strategy |
| STATE-MANAGEMENT.md | Server State |
| API-CONTRACT.md | Response Contract |
| COMPONENT-SPEC.md | Data Provider |
| FILE-STRUCTURE.md | Service Location |

---

# 7.10 Expected Outcome

Fake API Strategy dinyatakan memenuhi standar apabila.

- Seluruh Component menggunakan Service Layer.
- Mock JSON tidak diakses secara langsung.
- Response identik dengan REST API.
- Migrasi menuju Backend tidak mengubah UI maupun State Management.
- Seluruh Feature menggunakan pola akses data yang konsisten.

# END OF PART 7
# ==============================================================================

# ==============================================================================
# MOCK-DATA.md
# PART 8 — DATA GENERATION RULES
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar pembuatan (Generation Rules) seluruh Mock Data pada Engineering Document Management System (EDMS). |
| **Depends On** | PRD.md, API-CONTRACT.md, FORM-SPEC.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 8.1 Overview

Data Generation Rules mendefinisikan bagaimana Mock Data harus dibuat agar menyerupai kondisi operasional sistem yang sesungguhnya.

Mock Data harus cukup realistis untuk mendukung proses Development, Testing, Demonstration, dan User Acceptance Test (UAT).

Seluruh dataset harus mengikuti struktur Entity dan API Contract yang telah ditetapkan.

---

# 8.2 Generation Principles

Seluruh Mock Data wajib mengikuti prinsip berikut.

- Realistic
- Consistent
- Repeatable
- Predictable
- Reusable
- API Ready
- Representative
- Easy Maintenance

Mock Data tidak boleh dibuat secara acak tanpa aturan.

---

# 8.3 Dataset Volume

Jumlah data harus cukup untuk menguji seluruh fitur.

| Dataset | Recommended Minimum |
|----------|---------------------|
| Dashboard | 1 Record |
| Documents | 100 Records |
| Notifications | 30 Records |
| Users | 20 Records |
| Roles | 5 Records |
| Permissions | 30 Records |
| SLA Monitoring | 100 Records |
| Escalation | 20 Records |
| Audit Trail | 200 Records |

Jumlah tersebut dapat disesuaikan sesuai kebutuhan pengujian.

---

# 8.4 Data Distribution

Distribusi data harus mencerminkan kondisi nyata.

Contoh Workflow Status.

| Status | Recommendation |
|---------|----------------|
| Process Review | 30% |
| Process Comment | 15% |
| Process Reject | 5% |
| Project Review | 20% |
| Project Comment | 10% |
| Project Reject | 5% |
| Approved | 20% |

Distribusi bertujuan menghasilkan tampilan Dashboard yang representatif.

---

# 8.5 Reference Data Rules

Reference Data harus bersifat stabil.

Contoh.

- Drawing Type
- Area
- Discipline
- Role
- Permission
- Workflow Status

Reference Data tidak berubah selama satu siklus pengembangan.

---

# 8.6 Identifier Rules

Seluruh Entity harus memiliki Identifier yang unik.

Contoh.

```text
DOC-000001

DOC-000002

USR-000001

NOT-000001
```

Identifier harus konsisten pada seluruh dataset.

---

# 8.7 Relationship Consistency

Seluruh Foreign Key harus mengacu pada Entity yang valid.

Contoh.

```text
document.userId

↓

users.id
```

Tidak diperbolehkan membuat Relationship yang tidak valid.

---

# 8.8 Generation Rules

### GEN-001

Seluruh Primary Key harus unik.

---

### GEN-002

Foreign Key harus valid.

---

### GEN-003

Data wajib mengikuti API Schema.

---

### GEN-004

Reference Data tidak boleh duplikat.

---

### GEN-005

Mock Data tidak mengandung Business Logic.

---

### GEN-006

Seluruh Dataset harus dapat digunakan kembali.

---

# 8.9 Relationship With Other Documents

| Document | Relationship |
|----------|--------------|
| PRD.md | Business Entity |
| API-CONTRACT.md | JSON Structure |
| FORM-SPEC.md | Form Option Data |
| ACCESS-CONTROL.md | Role & Permission Data |
| STATE-MANAGEMENT.md | Query Dataset |

---

# 8.10 Expected Outcome

Data Generation Rules dinyatakan memenuhi standar apabila.

- Seluruh dataset memiliki data yang realistis.
- Primary Key dan Foreign Key konsisten.
- Distribusi data mendukung seluruh Product Module.
- Dataset siap digunakan untuk Development dan Testing.
- Mock Data dapat diganti dengan REST API tanpa perubahan struktur.

# END OF PART 8
# ==============================================================================

# ==============================================================================
# MOCK-DATA.md
# PART 9 — MOCK DATA CONVENTION
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan konvensi penamaan, organisasi, dan standar implementasi Mock Data pada Engineering Document Management System (EDMS). |
| **Depends On** | FILE-STRUCTURE.md, API-CONTRACT.md, ENGINEERING-FOUNDATION.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 9.1 Overview

Mock Data Convention memastikan seluruh dataset memiliki struktur, penamaan, dan organisasi yang seragam sehingga mudah dipahami, mudah dipelihara, dan mudah diintegrasikan dengan REST API.

Konvensi ini berlaku untuk seluruh dataset, Mock Service, dan Factory yang digunakan selama proses Development.

---

# 9.2 File Naming Convention

Seluruh file menggunakan format **kebab-case**.

Contoh.

```text
dashboard.json

documents.json

users.json

roles.json (Authorization Catalog / Historical Reference)
permissions.json (Authorization Catalog / Historical Reference)
notifications.json

sla-monitoring.json

escalation.json

audit-trail.json
```

Tidak diperbolehkan menggunakan spasi maupun PascalCase pada nama file.

---

# 9.3 Property Naming Convention

Seluruh Property menggunakan **camelCase**.

Contoh.

```text
documentNumber

documentTitle

drawingType

currentAssignee

approvalStatus

validationDays
```

Nama Property harus identik dengan API-CONTRACT.md.

---

# 9.4 Directory Convention

Dataset mengikuti struktur project.

```text
src/

└── mocks/

    ├── data/

    ├── services/

    ├── factories/

    └── index.js
```

Lokasi akhir mengikuti FILE-STRUCTURE.md.

---

# 9.5 Dataset Convention

Setiap dataset harus memenuhi aturan berikut.

| Rule | Description |
|------|-------------|
| One Entity | Satu dataset mewakili satu Entity utama |
| API Ready | Struktur mengikuti API Response |
| Reusable | Dataset dapat digunakan ulang |
| Predictable | Data konsisten |
| Readable | Mudah dipahami |

---

# 9.6 Mock Service Convention

Seluruh Mock Service mengikuti pola berikut.

```text
getDocuments()

getDocumentById()

createDocument()

updateDocument()

deleteDocument()
```

Penamaan Method mengikuti REST API.

---

# 9.7 Factory Convention

Apabila menggunakan Data Factory.

Penamaan mengikuti pola berikut.

```text
createDocument()

createUser()

createNotification()

createAuditTrail()
```

Factory digunakan untuk menghasilkan dataset yang konsisten.

---

# 9.8 Convention Rules

### CONVENTION-001

Nama file menggunakan kebab-case.

---

### CONVENTION-002

Property menggunakan camelCase.

---

### CONVENTION-003

Mock Service menggunakan camelCase.

---

### CONVENTION-004

Factory menggunakan awalan `create`.

---

### CONVENTION-005

Struktur mengikuti FILE-STRUCTURE.md.

---

### CONVENTION-006

Seluruh Response mengikuti API-CONTRACT.md.

---

# 9.9 Relationship With Other Documents

| Document | Relationship |
|----------|--------------|
| FILE-STRUCTURE.md | Folder Organization |
| API-CONTRACT.md | Response Schema |
| ENGINEERING-FOUNDATION.md | Development Pattern |
| STATE-MANAGEMENT.md | Data Consumption |
| COMPONENT-SPEC.md | Component Binding |

---

# 9.10 Expected Outcome

Mock Data Convention dinyatakan memenuhi standar apabila.

- Seluruh dataset memiliki penamaan yang konsisten.
- Struktur file mengikuti FILE-STRUCTURE.md.
- Property mengikuti API-CONTRACT.md.
- Mock Service memiliki pola implementasi yang seragam.
- Dataset mudah dipelihara dan mudah diganti menjadi REST API.

# END OF PART 9
# ==============================================================================

# ==============================================================================
# MOCK-DATA.md
# PART 10 — MOCK DATA ACCEPTANCE CRITERIA
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar akhir (Acceptance Criteria) yang harus dipenuhi sebelum Mock Data digunakan sebagai Official Development Dataset pada Engineering Document Management System (EDMS). |
| **Depends On** | PRD.md, ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, API-CONTRACT.md, STATE-MANAGEMENT.md, FORM-SPEC.md |
| **Behaviour Reference** | BUSINESS-WORKFLOW.md |
| **Primary Audience** | Product Owner, Solution Architect, Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 10.1 Purpose

Mock Data Acceptance Criteria merupakan standar akhir yang digunakan untuk memastikan bahwa seluruh dataset Mock Data telah memenuhi kebutuhan pengembangan Frontend, Testing, QA, serta siap digantikan oleh REST API tanpa mengubah arsitektur aplikasi.

Bagian ini menjadi acuan pada proses Architecture Review, Development Review, Integration Review, dan Quality Assurance sebelum Mock Data dinyatakan sebagai **Official Development Dataset**.

---

# 10.2 Acceptance Scope

Acceptance Criteria mencakup seluruh aspek implementasi Mock Data.

- Mock Data Philosophy
- Dataset Architecture
- Entity Definition
- JSON Dataset Specification
- Relationship Mapping
- Fake API Strategy
- Data Generation Rules
- Mock Data Convention

Seluruh aspek tersebut wajib memenuhi standar sebelum digunakan pada proses pengembangan Frontend.

---

# 10.3 Dataset Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| DATASET-001 | Seluruh dataset mengikuti Feature First Architecture. | ☐ |
| DATASET-002 | Seluruh dataset memiliki struktur yang konsisten. | ☐ |
| DATASET-003 | Setiap Entity memiliki satu dataset utama. | ☐ |
| DATASET-004 | Tidak terdapat duplikasi dataset utama. | ☐ |
| DATASET-005 | Dataset mengikuti FILE-STRUCTURE.md. | ☐ |
| DATASET-006 | Dataset siap digunakan oleh Service Layer. | ☐ |

---

# 10.4 Entity Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| ENTITY-001 | Seluruh Entity telah terdokumentasi. | ☐ |
| ENTITY-002 | Seluruh Entity memiliki Primary Key. | ☐ |
| ENTITY-003 | Seluruh Entity mengikuti API Schema. | ☐ |
| ENTITY-004 | Seluruh Relationship telah tervalidasi. | ☐ |
| ENTITY-005 | Seluruh Reference Data tersedia. | ☐ |
| ENTITY-006 | Seluruh Entity dapat digunakan ulang. | ☐ |

---

# 10.5 JSON Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| JSON-001 | Struktur JSON identik dengan API Response. | ☐ |
| JSON-002 | Property menggunakan camelCase. | ☐ |
| JSON-003 | Dataset menggunakan kebab-case. | ☐ |
| JSON-004 | Response mengikuti API-CONTRACT.md. | ☐ |
| JSON-005 | Pagination mengikuti standar API. | ☐ |
| JSON-006 | Dataset dapat diparsing tanpa transformasi tambahan. | ☐ |

---

# 10.6 Fake API Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| API-001 | Seluruh akses data menggunakan Service Layer. | ☐ |
| API-002 | Component tidak membaca Mock JSON secara langsung. | ☐ |
| API-003 | Fake API mengembalikan Promise. | ☐ |
| API-004 | Response mengikuti API Contract. | ☐ |
| API-005 | Fake API tidak mengandung Business Logic. | ☐ |
| API-006 | Fake API siap diganti menjadi REST API. | ☐ |

---

# 10.7 Data Quality Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| QUALITY-001 | Primary Key bersifat unik. | ☐ |
| QUALITY-002 | Foreign Key valid. | ☐ |
| QUALITY-003 | Dataset memiliki distribusi data yang realistis. | ☐ |
| QUALITY-004 | Reference Data konsisten. | ☐ |
| QUALITY-005 | Dataset tidak memiliki data rusak (invalid). | ☐ |
| QUALITY-006 | Dataset mendukung seluruh Product Module. | ☐ |

---

# 10.8 Development Readiness Checklist

Seluruh checklist berikut harus terpenuhi sebelum Mock Data digunakan pada proses implementasi Frontend.

| Checklist | Status |
|-----------|--------|
| Dataset Architecture selesai | ☐ |
| Entity Definition selesai | ☐ |
| JSON Dataset selesai | ☐ |
| Relationship Mapping selesai | ☐ |
| Fake API selesai | ☐ |
| Data Generation Rules selesai | ☐ |
| Mock Data Convention selesai | ☐ |
| API Mapping selesai | ☐ |
| State Integration siap | ☐ |
| Form Integration siap | ☐ |
| Component Integration siap | ☐ |
| QA Dataset siap | ☐ |

---

# 10.9 Integration Acceptance

| Document | Validation |
|----------|------------|
| PRD.md | Business Entity sesuai |
| ENGINEERING-FOUNDATION.md | Mock First Development sesuai |
| IMPLEMENTATION-PLAN.md | Mendukung urutan implementasi |
| FILE-STRUCTURE.md | Lokasi dataset sesuai |
| STATE-MANAGEMENT.md | Siap digunakan TanStack Query |
| API-CONTRACT.md | Struktur Request & Response sesuai |
| ACCESS-CONTROL.md | Dataset Role & Permission tersedia |
| FORM-SPEC.md | Dataset Form dan Lookup tersedia |
| COMPONENT-SPEC.md | Dataset memenuhi kebutuhan Component |
| UI-GUIDELINES.md | Dataset mampu menampilkan seluruh UI |
| BUSINESS-WORKFLOW.md | Behaviour Mock Data sesuai sebagai Behaviour Reference Only |

---

# 10.10 Final Acceptance

MOCK-DATA.md dinyatakan **Approved** apabila.

- Seluruh Acceptance Criteria telah terpenuhi.
- Seluruh dataset mengikuti struktur Entity resmi proyek.
- Seluruh JSON mengikuti API-CONTRACT.md.
- Seluruh Mock Service mengikuti ENGINEERING-FOUNDATION.md.
- Seluruh struktur mengikuti FILE-STRUCTURE.md.
- Seluruh dataset dapat digunakan oleh STATE-MANAGEMENT.md.
- Seluruh Form memperoleh dataset sesuai FORM-SPEC.md.
- Seluruh Component memperoleh data sesuai COMPONENT-SPEC.md.
- Seluruh tampilan UI dapat dirender menggunakan Mock Data sesuai UI-GUIDELINES.md.
- Seluruh Role dan Permission tersedia sesuai ACCESS-CONTROL.md.
- Business Behaviour tetap mengacu pada BUSINESS-WORKFLOW.md sebagai **Behaviour Reference Only**.
- Product Owner menyetujui MOCK-DATA.md sebagai **Official Mock Data Baseline** untuk Engineering Document Management System (EDMS) Rebuild.

---

# End of PART 10

MOCK-DATA.md menjadi **Official Mock Data Baseline** yang mendefinisikan standar resmi seluruh dataset, struktur JSON, Relationship Mapping, Fake API, serta konvensi penggunaan Mock Data pada Engineering Document Management System (EDMS) Rebuild.

Seluruh implementasi Frontend wajib menggunakan Mock Data yang didefinisikan pada dokumen ini selama proses pengembangan sebelum Backend tersedia. Dengan demikian, proses migrasi dari Mock JSON menuju REST API dapat dilakukan hanya dengan mengganti implementasi Service Layer tanpa mengubah Component, State Management, Routing, maupun Form.

Dokumen ini juga menjadi referensi utama bagi Frontend Developer, Backend Developer, QA Engineer, dan AI Coding Agent untuk memastikan bahwa seluruh data yang digunakan selama Development konsisten dengan Source of Truth proyek dan siap diintegrasikan dengan Backend pada tahap implementasi berikutnya.

# ==============================================================================

---

# PHASE 2 SOURCE OF TRUTH SYNCHRONIZATION

## Current Implementation

Legacy / historical implementation:

Mock data dan local persistence menjadi runtime data source resmi untuk frontend pada fase sebelum Backend tersedia.

Current backend-integrated runtime:

- Backend REST API dan MySQL menjadi runtime data source resmi untuk scope yang sudah dimigrasikan.
- Mock data dan local persistence dipertahankan sebagai historical baseline, seed/reference development, dan compatibility reference.
- Mock password dan local token hanya berlaku untuk development simulation lama; runtime backend-integrated menggunakan backend credential store dan password hashing.

IndexedDB database: `edms-file-storage`, version `10`.

Object store runtime:

- `documents`
- `documentRevisions`
- `documentHistory`
- `files`
- `metadata`
- `workflowComments`
- `commentReadReceipts`
- `notifications`
- `users`
- `userCredentials`
- `departments`
- `auditTrail`
- `projects`
- `projectMemberships`
- `passwordResetTokens`
- `mockEmails`

Seed JSON yang dipakai Service Layer pada legacy/mock mode harus memuat users, Authorization Catalog untuk roles/permissions, projects, memberships, departments, documents, notifications, dan audit baseline yang konsisten dengan ACCESS-CONTROL.md dan BUSINESS-WORKFLOW.md.

Production dan backend-integrated runtime wajib menggunakan backend credential store dan password hashing.

