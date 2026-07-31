# FORM-SPEC.md

# ==============================================================================
# PART 1 — DOCUMENT OVERVIEW
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Document Level** | Technical Design Document |
| **Document Status** | Draft |
| **Owner** | Frontend Architecture |
| **Purpose** | Mendefinisikan standar implementasi seluruh Form pada Engineering Document Management System (EDMS), meliputi struktur Form, perilaku Form, validasi, interaksi pengguna, mekanisme submit, serta hubungan Form dengan Component, State Management, API, dan Permission. |
| **Depends On** | PRD.md, ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, UI-GUIDELINES.md, COMPONENT-SPEC.md, FILE-STRUCTURE.md, ROUTING.md, STATE-MANAGEMENT.md, API-CONTRACT.md, ACCESS-CONTROL.md |
| **Design Reference** | Approved UI Design Mockup |
| **Behaviour Reference** | BUSINESS-WORKFLOW.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, Technical Lead, AI Coding Agent |
| **Change Impact** | Very High |
| **Last Review** | Architecture Review |

---

# 1.1 Purpose

FORM-SPEC.md merupakan dokumen resmi yang mendefinisikan standar implementasi seluruh Form pada Engineering Document Management System (EDMS).

Dokumen ini menjelaskan bagaimana setiap Form harus dibangun, divalidasi, ditampilkan, diproses, dan diintegrasikan dengan arsitektur Frontend maupun Backend sehingga seluruh Form memiliki perilaku yang konsisten pada seluruh Product Module.

FORM-SPEC.md tidak mendefinisikan kebutuhan bisnis baru maupun Business Workflow.

Seluruh kebutuhan bisnis tetap mengacu pada **PRD.md**, sedangkan perilaku proses bisnis mengacu pada **BUSINESS-WORKFLOW.md** sebagai **Behaviour Reference Only**.

---

# 1.2 Objectives

Dokumen ini bertujuan untuk:

- Mendefinisikan standar implementasi seluruh Form pada EDMS.
- Menentukan struktur standar setiap Form.
- Menentukan spesifikasi setiap Field.
- Menentukan aturan validasi Form.
- Menentukan perilaku Form sebelum dan sesudah Submit.
- Menentukan hubungan Form dengan Component Library.
- Menentukan hubungan Form dengan State Management.
- Menentukan hubungan Form dengan API Contract.
- Menentukan hubungan Form dengan Access Control.
- Menjadi acuan implementasi Form bagi Frontend Developer.
- Menjadi referensi AI Coding Agent dalam menghasilkan implementasi Form yang konsisten.

---

# 1.3 Scope

FORM-SPEC.md mencakup:

- Form Architecture
- Form Structure
- Field Classification
- Field Specification
- Validation Rules
- Business Validation
- Field Dependency
- Default Values
- Form Behaviour
- Submit Behaviour
- Error Handling
- Success Handling
- Form State
- Permission Integration
- API Integration
- Form Acceptance Criteria

Dokumen ini tidak mencakup:

- Business Workflow
- Business Rules
- REST API Specification
- Database Schema
- UI Theme
- Component Internal Implementation
- Routing Architecture
- Backend Business Logic

Topik tersebut dijelaskan pada dokumen Source of Truth yang sesuai.

---

# 1.4 Document Position

FORM-SPEC.md merupakan bagian dari **Technical Design Documents**.

Dokumen ini menerjemahkan kebutuhan produk dan keputusan arsitektur menjadi standar implementasi seluruh Form pada Frontend.

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
UI-GUIDELINES.md
        │
        ▼
COMPONENT-SPEC.md
        │
        ▼
FORM-SPEC.md
        │
        ├── React Hook Form
        ├── Zod Validation
        ├── Form Components
        ├── Form Hooks
        ├── Service Layer
        └── REST API
```

FORM-SPEC.md tidak menggantikan PRD, UI-GUIDELINES, maupun COMPONENT-SPEC.

FORM-SPEC.md berfungsi sebagai dokumen yang mengintegrasikan seluruh standar implementasi Form agar dapat digunakan secara konsisten pada seluruh Product Module.

---

# 1.5 Source Documents

Seluruh isi FORM-SPEC.md wajib mengacu pada dokumen berikut.

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
- ACCESS-CONTROL.md
- Approved UI Design Mockup

## Behaviour Reference

- BUSINESS-WORKFLOW.md

Apabila terjadi perbedaan informasi, prioritas mengikuti **Project Documentation Hierarchy** yang telah ditetapkan.

BUSINESS-WORKFLOW.md hanya digunakan sebagai referensi perilaku proses bisnis dan tidak menjadi sumber spesifikasi teknis Form.

---

# 1.6 Form Design Principles

Seluruh implementasi Form wajib mengikuti prinsip berikut.

- Single Source of Truth.
- Form First Validation.
- Component Reusability.
- Consistent User Experience.
- Predictable Form Behaviour.
- Mockup First.
- API Ready.
- Service Layer Only.
- Permission Aware.
- Responsive Form Layout.
- Accessibility First.
- Minimal User Input.

---

# 1.7 Technology Reference

Seluruh implementasi Form wajib menggunakan teknologi yang telah ditetapkan pada ENGINEERING-FOUNDATION.md dan arsitektur Frontend proyek.

| Category | Technology |
|----------|------------|
| UI Framework | React |
| Form Library | React Hook Form |
| Validation | Zod |
| HTTP Client | Axios |
| Server State | TanStack Query |
| Global State | Zustand |
| Local State | React Hooks |
| API Access | Service Layer |

Implementasi Form tidak diperbolehkan menggunakan library Form lain tanpa melalui Architecture Review dan Change Request.

---

# 1.8 Form Philosophy

Setiap Form pada EDMS dipandang sebagai **User Interaction Boundary**, yaitu titik interaksi resmi antara pengguna dengan sistem.

Form bertanggung jawab untuk:

- Mengumpulkan input pengguna.
- Melakukan validasi data.
- Menampilkan feedback kepada pengguna.
- Mengirim data melalui Service Layer.
- Menampilkan hasil proses sesuai Response.

Form tidak bertanggung jawab terhadap:

- Business Workflow.
- Business Rule.
- Database Operation.
- REST API Implementation.
- Permission Resolution.
- State Management di luar lingkup Form.

Seluruh proses tersebut mengikuti dokumen Source of Truth masing-masing.

---

# 1.9 Expected Outcome

Setelah FORM-SPEC.md selesai disusun, Frontend Developer, QA Engineer, dan AI Coding Agent harus mampu:

- Mengimplementasikan seluruh Form menggunakan pola yang konsisten.
- Menggunakan React Hook Form dan Zod sesuai standar arsitektur.
- Menghubungkan Form dengan Service Layer tanpa akses API langsung dari Component.
- Mengintegrasikan Form dengan State Management yang telah ditetapkan.
- Menghasilkan perilaku Form yang konsisten pada seluruh Product Module.
- Mengimplementasikan validasi, submit, loading, error, dan success state secara seragam.
- Mengintegrasikan Form dengan Permission dan API Contract tanpa mengubah arsitektur aplikasi.

---

# END OF PART 1
# ==============================================================================

# ==============================================================================
# FORM-SPEC.md
# PART 2 — FORM ARCHITECTURE
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan arsitektur standar seluruh Form pada Engineering Document Management System (EDMS). |
| **Depends On** | ENGINEERING-FOUNDATION.md, COMPONENT-SPEC.md, FILE-STRUCTURE.md, STATE-MANAGEMENT.md |
| **Primary Audience** | Frontend Developer, Solution Architect, AI Coding Agent |

---

# 2.1 Overview

Seluruh Form pada Engineering Document Management System (EDMS) wajib menggunakan arsitektur yang konsisten agar mudah dipelihara, mudah diuji, serta mudah diintegrasikan dengan Backend.

Form bukan sekadar kumpulan Input Field, tetapi merupakan sebuah komponen yang menghubungkan User Interface, Validation, State Management, Permission, dan REST API.

---

# 2.2 Form Philosophy

Setiap Form dibangun berdasarkan prinsip berikut.

- Single Responsibility
- Reusable
- Predictable
- API Ready
- Validation First
- Service Layer Only
- Permission Aware
- State Driven

Form tidak diperbolehkan mengandung Business Logic maupun akses langsung ke REST API.

---

# 2.3 Architecture Diagram

Seluruh Form mengikuti arsitektur berikut.

```text
User

↓

Form Component

↓

React Hook Form

↓

Zod Validation

↓

Service Layer

↓

REST API

↓

Response

↓

UI Feedback
```

Seluruh komunikasi menuju Backend harus melalui Service Layer.

---

# 2.4 Form Layers

Arsitektur Form terdiri dari beberapa layer.

| Layer | Responsibility |
|--------|----------------|
| Presentation Layer | Menampilkan UI Form |
| Validation Layer | Memvalidasi Input |
| State Layer | Mengelola Form State |
| Service Layer | Mengirim Request |
| API Layer | Backend Communication |

Masing-masing layer memiliki tanggung jawab yang terpisah.

---

# 2.5 Form Lifecycle

Seluruh Form mengikuti lifecycle berikut.

```text
Initialize

↓

Load Default Values

↓

User Input

↓

Client Validation

↓

Submit

↓

API Request

↓

Response

↓

Success / Error
```

Lifecycle digunakan secara konsisten pada seluruh Form.

---

# 2.6 Form Integration

Form terintegrasi dengan dokumen berikut.

| Document | Integration |
|----------|-------------|
| UI-GUIDELINES.md | Layout Form |
| COMPONENT-SPEC.md | Form Components |
| STATE-MANAGEMENT.md | Form State |
| API-CONTRACT.md | Request & Response |
| ACCESS-CONTROL.md | Permission |
| ROUTING.md | Route Placement |

---

# 2.7 Standard Form Flow

```text
Open Form

↓

Load Data

↓

Render Component

↓

Input Validation

↓

Submit

↓

Loading

↓

Response

↓

Success / Error

↓

Refresh UI
```

---

# 2.8 Architecture Rules

### FORM-ARCH-001

Seluruh Form menggunakan React Hook Form.

---

### FORM-ARCH-002

Validation menggunakan Zod.

---

### FORM-ARCH-003

REST API hanya diakses melalui Service Layer.

---

### FORM-ARCH-004

Component tidak mengakses Axios secara langsung.

---

### FORM-ARCH-005

Business Logic tidak ditulis di dalam Form Component.

---

### FORM-ARCH-006

Form mengikuti struktur project pada FILE-STRUCTURE.md.

---

# 2.9 Folder Relationship

```text
features/

└── document-register/

      ├── components/

      ├── forms/

      ├── hooks/

      ├── services/

      ├── validators/

      └── pages/
```

Seluruh Form wajib mengikuti struktur folder yang telah ditetapkan.

---

# 2.10 Expected Outcome

Form Architecture dinyatakan memenuhi standar apabila.

- Seluruh Form menggunakan arsitektur yang sama.
- Validation terpisah dari UI.
- API diakses melalui Service Layer.
- Business Logic tidak berada di Component.
- Seluruh Form mudah diuji dan mudah dikembangkan.

# END OF PART 2
# ==============================================================================

# ==============================================================================
# FORM-SPEC.md
# PART 3 — FIELD CLASSIFICATION
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan klasifikasi seluruh Field yang digunakan pada Form Engineering Document Management System (EDMS). |
| **Depends On** | COMPONENT-SPEC.md, UI-GUIDELINES.md, API-CONTRACT.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 3.1 Overview

Field merupakan elemen terkecil dalam sebuah Form.

Setiap Field memiliki fungsi, tipe data, aturan validasi, serta perilaku yang harus diterapkan secara konsisten pada seluruh Product Module.

Seluruh Field harus menggunakan komponen standar yang telah didefinisikan pada COMPONENT-SPEC.md.

---

# 3.2 Field Categories

Field pada EDMS dikelompokkan menjadi beberapa kategori.

| Category | Description |
|----------|-------------|
| Text Input | Input teks satu baris |
| Textarea | Input teks multi baris |
| Number Input | Input angka |
| Select | Pilihan tunggal |
| Multi Select | Pilihan jamak |
| Date Picker | Tanggal |
| File Upload | Upload File |
| Checkbox | Pilihan Boolean |
| Radio Group | Pilihan eksklusif |
| Toggle Switch | Status aktif/nonaktif |
| Hidden Field | Data internal Form |
| Readonly Field | Informasi yang tidak dapat diubah |

---

# 3.3 Field Data Type

| Data Type | Example |
|-----------|---------|
| String | Document Number |
| Integer | Revision Number |
| Decimal | File Size |
| Boolean | Active Status |
| Date | Upload Date |
| Array | Attachment List |
| Object | Current User |
| Enum | Workflow Status |

Seluruh tipe data mengikuti API-CONTRACT.md.

---

# 3.4 Input Components

Seluruh Input menggunakan Component yang telah distandarkan.

| Field Type | Standard Component |
|------------|--------------------|
| Text | TextField |
| Number | NumberField |
| Select | SelectField |
| Date | DatePicker |
| Upload | FileUploader |
| Comment | Textarea |
| Search | SearchField |
| Password | PasswordField |

Tidak diperbolehkan membuat Input Component baru tanpa Architecture Review.

SelectField wajib menggunakan Dropdown dengan maksimal 5 opsi terlihat sekaligus.

Apabila opsi lebih dari 5:

- Dropdown menggunakan vertical scroll.
- Seluruh opsi tetap tersedia sebagai pilihan.
- Data opsi tidak boleh dipotong hanya untuk membatasi tampilan.
- Horizontal scroll tidak digunakan.

---

# 3.5 Field Properties

Setiap Field minimal memiliki properti berikut.

| Property | Description |
|----------|-------------|
| Name | Nama Field |
| Label | Label yang ditampilkan |
| Type | Jenis Data |
| Placeholder | Placeholder |
| Required | Mandatory / Optional |
| Readonly | Ya / Tidak |
| Disabled | Ya / Tidak |
| Default Value | Nilai Awal |
| Validation | Aturan Validasi |
| Permission | Permission bila diperlukan |

---

# 3.6 Required Level

Field dibagi menjadi tiga tingkat.

| Level | Description |
|--------|-------------|
| Mandatory | Harus diisi |
| Optional | Boleh kosong |
| Conditional | Wajib pada kondisi tertentu |

Conditional Field mengikuti Business Behaviour yang didefinisikan pada PRD.md dan BUSINESS-WORKFLOW.md.

---

# 3.7 Editable State

Field memiliki beberapa status.

| State | Description |
|--------|-------------|
| Editable | Dapat diubah |
| Readonly | Hanya dapat dilihat |
| Disabled | Tidak aktif |
| Hidden | Tidak ditampilkan |

Status Field dapat dipengaruhi oleh Permission maupun kondisi bisnis.

---

# 3.8 Field Naming Convention

Seluruh Field menggunakan aturan berikut.

- camelCase
- Deskriptif
- Tidak menggunakan singkatan yang ambigu
- Konsisten dengan API Payload

Contoh.

```text
documentNumber

documentTitle

drawingType

revisionCode

currentStatus

approvalComment
```

---

# 3.9 Classification Rules

### FIELD-001

Seluruh Field menggunakan Component standar.

---

### FIELD-002

Seluruh Field memiliki Data Type.

---

### FIELD-003

Seluruh Field memiliki Validation.

---

### FIELD-004

Seluruh Field memiliki Label.

---

### FIELD-005

Seluruh Field memiliki Default Value.

---

### FIELD-006

Nama Field mengikuti API Payload.

---

# 3.10 Expected Outcome

Field Classification dinyatakan memenuhi standar apabila.

- Seluruh Field memiliki klasifikasi yang jelas.
- Seluruh Field menggunakan Component standar.
- Seluruh Field mengikuti Data Type API.
- Seluruh Field memiliki properti yang lengkap.
- Seluruh Product Module menggunakan klasifikasi Field yang konsisten.

# END OF PART 3
# ==============================================================================

# ==============================================================================
# FORM-SPEC.md
# PART 4 — FIELD SPECIFICATION
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan spesifikasi teknis setiap Field yang digunakan pada seluruh Form Engineering Document Management System (EDMS). |
| **Depends On** | COMPONENT-SPEC.md, API-CONTRACT.md, UI-GUIDELINES.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 4.1 Overview

Setiap Field yang digunakan pada Form harus memiliki spesifikasi yang jelas agar implementasi seluruh Product Module bersifat konsisten.

Spesifikasi Field menjadi acuan utama bagi Frontend Developer dalam membangun Form serta memastikan struktur Request sesuai dengan API Contract.

---

# 4.2 Standard Field Structure

Setiap Field minimal memiliki informasi berikut.

| Property | Description |
|----------|-------------|
| Field Name | Nama Field |
| Label | Label yang ditampilkan |
| Data Type | Jenis Data |
| Component | Komponen UI |
| Required | Mandatory / Optional |
| Default Value | Nilai Awal |
| Validation | Aturan Validasi |
| Permission | Permission bila diperlukan |
| API Mapping | Nama Property pada Request |
| Description | Penjelasan fungsi Field |

---

# 4.3 Common Field Specification

Seluruh Product Module menggunakan spesifikasi dasar berikut.

| Field | Component | Data Type | Required |
|--------|-----------|-----------|----------|
| Search | SearchField | String | Optional |
| Description | Textarea | String | Optional |
| Status | SelectField | Enum | Mandatory |
| Comment | Textarea | String | Mengikuti Approval Decision Matrix |
| Revision | TextField | String | Mandatory |
| Attachment | FileUploader | File | Mengikuti Approval Decision Matrix |

---

# 4.4 Document Register Fields

Contoh Field pada Form Upload Document.

| Field | Component | Required | API Property |
|--------|-----------|----------|--------------|
| Document Number | TextField | Mandatory | documentNumber |
| Document Title | TextField | Mandatory | documentTitle |
| Drawing Type | SelectField | Mandatory | drawingType |
| Area | TextField | Mandatory | area |
| Revision | TextField | Mandatory | revision |
| Times For Review | NumberField | Mandatory | daysUntilValidation |
| Upload File | FileUploader + Temporary Upload | Mandatory | temporaryFileId |

Field mengikuti API-CONTRACT.md.

Terminologi UI untuk field SLA adalah `TIMES FOR REVIEW`. Terminologi bisnis tetap `Days Until Validation`, sedangkan property API/backend yang digunakan adalah `daysUntilValidation`.

Display rule:

| API Value | Frontend Display |
|-----------|------------------|
| 0 | Today |
| 1 | 1 Day |
| N | N Days |

Lifecycle file upload pada form Create Document:

File Selection

↓

`POST /api/v1/storage/temporary-uploads`

↓

Frontend menerima `temporaryFileId`

↓

Form Submit mengirim `temporaryFileId`

↓

Backend melakukan permanent file promotion setelah dokumen berhasil dibuat.

---

# 4.5 Approval Fields

Contoh Field pada Approval Dialog.

| Decision | Comment | Attachment |
|--------|---------|------------|
| Approval A | Tidak wajib / tidak digunakan | Tidak wajib / tidak digunakan |
| Approval B | Mandatory | Optional |
| Approval C | Optional | Optional |

Behaviour mengikuti BUSINESS-WORKFLOW.md.

Validasi:

- Approval B tidak dapat disubmit tanpa Comment.
- Attachment Approval B tidak menggantikan Comment.
- Approval C tetap dapat disubmit tanpa Comment dan tanpa Attachment.

---

# 4.5.1 Archive Document Fields

Contoh Field pada Archive Document Dialog.

| Field | Component | Required |
|--------|-----------|----------|
| Document Summary | ReadOnlySummary | Mandatory |
| Archive Description | StaticText | Mandatory |
| Reason | Textarea | Optional |

Action Button:

- Cancel
- Archive

Archive Dialog hanya digunakan oleh Admin pada Document dengan Workflow Status Approved.
Archive mengubah Document Lifecycle menjadi Archived tanpa mengubah Workflow Status.

---

# 4.6 Administration Fields

Contoh Field pada Administration.

| Field | Component |
|--------|-----------|
| Username | TextField |
| Full Name | TextField |
| Email | EmailField |
| Role | SelectField |
| Password | PasswordField |
| Confirm Password | PasswordField |

---

# 4.7 API Mapping

Seluruh Field harus memiliki pemetaan terhadap Request Body.

```text
Form Field

↓

React Hook Form

↓

Request DTO

↓

Service Layer

↓

REST API
```

Nama Field pada React Hook Form mengikuti nama Property pada API Request.

---

# 4.8 Field Rules

### FIELD-SPEC-001

Setiap Field memiliki Label.

---

### FIELD-SPEC-002

Setiap Field memiliki Data Type.

---

### FIELD-SPEC-003

Setiap Field memiliki API Mapping.

---

### FIELD-SPEC-004

Setiap Field menggunakan Component standar.

---

### FIELD-SPEC-005

Field mengikuti UI-GUIDELINES.md.

---

### FIELD-SPEC-006

Field mengikuti API-CONTRACT.md.

---

# 4.9 Reusability Rules

Field yang memiliki fungsi sama harus menggunakan spesifikasi yang sama.

Contoh.

- SearchField
- CommentField
- StatusField
- FileUploader

Tidak diperbolehkan membuat variasi baru tanpa kebutuhan bisnis yang jelas.

---

# 4.10 Expected Outcome

Field Specification dinyatakan memenuhi standar apabila.

- Seluruh Field memiliki spesifikasi lengkap.
- Nama Field konsisten dengan API.
- Component digunakan secara konsisten.
- Field dapat digunakan ulang.
- Implementasi mudah dipelihara.

# END OF PART 4
# ==============================================================================

# ==============================================================================
# FORM-SPEC.md
# PART 5 — VALIDATION RULES
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar validasi seluruh Form pada Engineering Document Management System (EDMS). |
| **Depends On** | ENGINEERING-FOUNDATION.md, API-CONTRACT.md, ACCESS-CONTROL.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 5.1 Overview

Validation memastikan data yang dimasukkan pengguna memenuhi aturan teknis sebelum dikirim ke Backend.

Validation dilakukan pada Frontend menggunakan React Hook Form dan Zod, kemudian divalidasi kembali oleh Backend.

Frontend Validation bertujuan meningkatkan User Experience.

Backend Validation menjadi validasi akhir.

---

# 5.2 Validation Flow

```text
User Input

↓

React Hook Form

↓

Zod Validation

↓

Valid ?

↓

YES

↓

Submit

↓

Backend Validation

↓

Success

atau

Error
```

---

# 5.3 Validation Categories

Validation dibagi menjadi beberapa kategori.

| Category | Description |
|----------|-------------|
| Required Validation | Field wajib diisi |
| Format Validation | Format Data |
| Length Validation | Panjang karakter |
| Range Validation | Nilai minimum / maksimum |
| Type Validation | Jenis Data |
| File Validation | Validasi Upload |
| Business Validation | Validasi proses bisnis |

Business Validation dijelaskan pada PART 6.

---

# 5.4 Required Validation

Contoh.

| Field | Rule |
|--------|------|
| Document Number | Required |
| Document Title | Required |
| Drawing Type | Required |
| Revision | Required |
| Times For Review / Days Until Validation | Required |

Field Mandatory tidak boleh dikirim dalam keadaan kosong.

Document Number wajib unik dalam scope Project.

Validasi duplicate Document Number menggunakan kombinasi Project ID dan Document Number.

Document Number yang sama pada Project berbeda tidak dianggap duplikat.

---

# 5.5 Format Validation

Contoh.

| Field | Validation |
|--------|------------|
| Email | Email Format |
| Registered Email | Required, Trim Whitespace, Email Format |
| Username | Alphanumeric |
| Document Number | Pattern sesuai standar proyek |
| Revision | Uppercase String |

---

# 5.6 File Validation

Upload File mengikuti aturan berikut.

| Validation | Description |
|------------|-------------|
| File Required | Ya / Tidak |
| File Extension | Mengikuti aturan sistem |
| File Size | Mengikuti batas maksimum sistem |
| Empty File | Tidak diperbolehkan |
| Corrupted File | Ditolak |

Validasi detail mengikuti kebijakan Backend.

---

# 5.7 Validation Messages

Pesan validasi harus.

- Singkat.
- Mudah dipahami.
- Konsisten.
- Menggunakan Bahasa Indonesia.

Contoh.

```text
Document Number wajib diisi.

Document Number sudah digunakan pada Project ini.

Revision tidak boleh kosong.

Format Email tidak valid.

Ukuran file melebihi batas maksimum.
```

---

# 5.8 Validation Rules

### VALID-001

Validation dilakukan sebelum Submit.

---

### VALID-002

Validation menggunakan Zod.

---

### VALID-002A

Forgot Password menggunakan React Hook Form dan Zod dengan field Username dan Registered Email.

Kedua field wajib diisi, whitespace di-trim sebelum validasi, dan Registered Email wajib menggunakan format Email valid.

Validasi account matching tidak dilakukan di UI Component dan wajib melalui Service Layer Authentication.

---

### VALID-003

Frontend dan Backend memiliki aturan validasi yang konsisten.

---

### VALID-004

Validation Message mudah dipahami.

---

### VALID-005

Validation mengikuti API-CONTRACT.md.

---

### VALID-006

Business Validation dipisahkan dari Technical Validation.

---

# 5.9 Validation Priority

Urutan validasi.

```text
Required

↓

Format

↓

Length

↓

Range

↓

Business Validation

↓

Submit
```

---

# 5.10 Expected Outcome

Validation Rules dinyatakan memenuhi standar apabila.

- Seluruh Field tervalidasi sebelum Submit.
- Validation menggunakan React Hook Form dan Zod.
- Error ditampilkan secara konsisten.
- Backend melakukan validasi ulang.
- Tidak ada Request invalid yang diproses.

# END OF PART 5
# ==============================================================================

# ==============================================================================
# FORM-SPEC.md
# PART 6 — BUSINESS VALIDATION
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan aturan validasi bisnis (Business Validation) yang diterapkan pada seluruh Form Engineering Document Management System (EDMS). |
| **Depends On** | PRD.md, API-CONTRACT.md, ACCESS-CONTROL.md |
| **Behaviour Reference** | BUSINESS-WORKFLOW.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 6.1 Overview

Business Validation merupakan validasi yang berasal dari aturan bisnis (Business Rules), bukan dari validasi teknis.

Business Validation dilakukan setelah seluruh Technical Validation berhasil.

Seluruh Business Validation harus mengikuti kebutuhan yang telah didefinisikan pada PRD.md dan menggunakan BUSINESS-WORKFLOW.md sebagai Behaviour Reference Only.

---

# 6.2 Validation Flow

```text
User Input

↓

Technical Validation

↓

Business Validation

↓

Permission Validation

↓

API Request

↓

Backend Validation

↓

Business Process
```

Business Validation hanya dijalankan apabila seluruh Technical Validation berhasil.

---

# 6.3 Business Validation Categories

Business Validation pada EDMS dibagi menjadi beberapa kategori.

| Category | Description |
|----------|-------------|
| Workflow Validation | Validasi berdasarkan Status Workflow |
| Status Validation | Validasi Status Dokumen |
| Revision Validation | Validasi perubahan revisi |
| Permission Validation | Validasi hak akses |
| Dependency Validation | Validasi hubungan antar Field |
| Approval Validation | Validasi proses Approval |
| Upload Validation | Validasi proses Upload |

---

# 6.4 Workflow Validation

Workflow Validation memastikan Form hanya dapat diproses pada tahapan Workflow yang benar.

Contoh.

| Current Status | Allowed Action |
|----------------|----------------|
| Process Review | Approval A/B/C |
| Project Review | Approval A/B/C |
| Approved | View History |

Behaviour mengikuti BUSINESS-WORKFLOW.md.

---

# 6.5 Approval Validation

Contoh validasi Approval.

| Approval | Validation |
|----------|------------|
| Approval A | Data wajib valid |
| Approval B | Comment wajib diisi |
| Approval C | Comment bersifat opsional |

Aturan ini mengikuti keputusan bisnis yang telah ditetapkan pada PRD dan BUSINESS-WORKFLOW.

---

# 6.6 Permission Validation

Sebelum Form diproses.

Sistem harus memastikan.

- User telah Login.
- User memiliki Permission.
- Action diperbolehkan.

Permission mengikuti ACCESS-CONTROL.md.

---

# 6.7 Upload Validation

Upload Document wajib memenuhi aturan berikut.

- Metadata lengkap.
- File berhasil dipilih.
- Format File sesuai aturan sistem.
- Revision valid.
- Times For Review wajib diisi sebagai Days Until Validation.

Detail validasi teknis mengikuti PART 5.

---

# 6.8 Business Validation Rules

### BUSINESS-001

Business Validation dilakukan setelah Technical Validation.

---

### BUSINESS-002

Business Validation mengikuti PRD.md.

---

### BUSINESS-003

Workflow mengikuti BUSINESS-WORKFLOW.md sebagai Behaviour Reference.

---

### BUSINESS-004

Permission mengikuti ACCESS-CONTROL.md.

---

### BUSINESS-005

Backend wajib melakukan validasi ulang.

---

### BUSINESS-006

Business Validation tidak ditulis di dalam UI Component.

---

# 6.9 Relationship With Other Documents

| Document | Relationship |
|----------|--------------|
| PRD.md | Functional Requirement |
| API-CONTRACT.md | Request Validation |
| ACCESS-CONTROL.md | Permission Validation |
| STATE-MANAGEMENT.md | Current User |
| BUSINESS-WORKFLOW.md | Behaviour Reference Only |

---

# 6.10 Expected Outcome

Business Validation dinyatakan memenuhi standar apabila.

- Seluruh aturan bisnis divalidasi sebelum proses Backend.
- Workflow dijalankan sesuai PRD.
- Permission divalidasi sebelum Submit.
- Backend melakukan validasi ulang.
- Seluruh Business Rule diterapkan secara konsisten.

# END OF PART 6
# ==============================================================================

# ==============================================================================
# FORM-SPEC.md
# PART 7 — DEPENDENCY RULES
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan hubungan (Dependency) antar Field, Component, State, Permission, dan API pada seluruh Form Engineering Document Management System (EDMS). |
| **Depends On** | COMPONENT-SPEC.md, STATE-MANAGEMENT.md, API-CONTRACT.md, ACCESS-CONTROL.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 7.1 Overview

Dependency Rules mendefinisikan bagaimana suatu Field atau Component dipengaruhi oleh kondisi tertentu.

Dependency dapat berasal dari:

- Nilai Field lain.
- Permission pengguna.
- Status Workflow.
- Response API.
- Current State.

Seluruh Dependency harus bersifat eksplisit dan mudah dipelihara.

---

# 7.2 Dependency Categories

| Category | Description |
|----------|-------------|
| Field Dependency | Antar Field |
| Component Dependency | Antar Component |
| Permission Dependency | Berdasarkan Permission |
| Workflow Dependency | Berdasarkan Status Workflow |
| API Dependency | Berdasarkan Response API |
| State Dependency | Berdasarkan Form State |

---

# 7.3 Field Dependency

Contoh hubungan antar Field.

| Parent Field | Child Field | Behaviour |
|--------------|-------------|-----------|
| Approval Decision | Comment | Menjadi Mandatory apabila memilih Approval B |
| Drawing Type | Area | Menyesuaikan pilihan yang tersedia |
| Workflow Status | History Button | Ditampilkan apabila Status = Approved |

Perilaku mengikuti PRD.md.

---

# 7.4 Component Dependency

Component dapat berubah berdasarkan kondisi.

Contoh.

| Component | Dependency |
|-----------|------------|
| Upload Button | Permission |
| Approval Button | Workflow |
| History Button | Workflow Status |
| Comment Field | Approval Decision |

---

# 7.5 Permission Dependency

Dependency berdasarkan Permission.

| Permission | Behaviour |
|------------|-----------|
| document-register.create | Upload Form aktif |
| approval.a / approval.b / approval.c | Approval Button tampil sesuai Action dan Official Role |
| document-register.download | Download Button aktif |
| user-management.view | User, Department, Project, dan Membership Form aktif |

Permission mengikuti ACCESS-CONTROL.md.

---

# 7.6 State Dependency

State Form memengaruhi perilaku Component.

| State | Behaviour |
|-------|-----------|
| Loading | Disable seluruh Input |
| Submitting | Disable Submit Button |
| Success | Reset atau Redirect |
| Error | Tampilkan Error Message |

State mengikuti STATE-MANAGEMENT.md.

---

# 7.7 API Dependency

Dependency terhadap Response API.

| Response | Behaviour |
|----------|-----------|
| Success | Refresh Data |
| Validation Error | Tampilkan Error |
| Unauthorized | Redirect Login |
| Forbidden | Access Denied |

Seluruh Response mengikuti API-CONTRACT.md.

---

# 7.8 Dependency Rules

### DEP-001

Dependency harus eksplisit.

---

### DEP-002

Tidak boleh terjadi Circular Dependency.

---

### DEP-003

Dependency mengikuti Source of Truth.

---

### DEP-004

Dependency tidak ditulis sebagai Hardcode.

---

### DEP-005

Dependency mengikuti State Management.

---

### DEP-006

Dependency harus mudah diuji.

---

# 7.9 Relationship With Other Documents

| Document | Relationship |
|----------|--------------|
| COMPONENT-SPEC.md | Component Behaviour |
| STATE-MANAGEMENT.md | Form State |
| API-CONTRACT.md | API Response |
| ACCESS-CONTROL.md | Permission Behaviour |
| PRD.md | Functional Behaviour |
| BUSINESS-WORKFLOW.md | Behaviour Reference Only |

---

# 7.10 Expected Outcome

Dependency Rules dinyatakan memenuhi standar apabila.

- Hubungan antar Field terdokumentasi dengan jelas.
- Permission memengaruhi Component secara konsisten.
- Workflow memengaruhi perilaku Form sesuai PRD.
- State memengaruhi UI secara konsisten.
- Dependency mudah dipelihara dan mudah diuji.

# END OF PART 7
# ==============================================================================

# ==============================================================================
# FORM-SPEC.md
# PART 8 — DEFAULT VALUES & FORM BEHAVIOUR
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar Default Values dan perilaku (Behaviour) seluruh Form pada Engineering Document Management System (EDMS). |
| **Depends On** | STATE-MANAGEMENT.md, API-CONTRACT.md, ACCESS-CONTROL.md |
| **Behaviour Reference** | BUSINESS-WORKFLOW.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 8.1 Overview

Setiap Form pada EDMS harus memiliki perilaku yang konsisten sejak pertama kali dibuka hingga proses Submit selesai.

Perilaku tersebut meliputi:

- Initial State
- Default Values
- Loading Behaviour
- Editing Behaviour
- Submit Behaviour
- Success Behaviour
- Cancel Behaviour
- Reset Behaviour

Behaviour Form harus konsisten pada seluruh Product Module.

---

# 8.2 Form Lifecycle

```text
Open Form

↓

Initialize

↓

Load Default Values

↓

Render Form

↓

User Interaction

↓

Validation

↓

Submit

↓

Loading

↓

API Response

↓

Success / Error

↓

Close / Reset / Redirect
```

---

# 8.3 Default Values

Setiap Form wajib memiliki Default Values.

| Field Type | Default Value |
|------------|---------------|
| Text | Empty String |
| Number | Null / Default Business Value |
| Select | Placeholder |
| Checkbox | False |
| Radio | Null |
| Date | Current Date atau Null |
| File Upload | Empty |
| Comment | Empty String |

Default Value mengikuti kebutuhan setiap Product Module.

---

# 8.4 Initial Behaviour

Ketika Form pertama kali dibuka.

Sistem harus.

- Memuat Default Values.
- Memuat Permission User.
- Memuat Data Reference bila diperlukan.
- Menginisialisasi Validation.
- Menampilkan Form dalam kondisi siap digunakan.

Belum ada Request API yang dikirim sebelum pengguna melakukan aksi.

---

# 8.5 Editing Behaviour

Selama pengguna mengisi Form.

Sistem harus.

- Memperbarui Form State.
- Menjalankan Validation secara otomatis.
- Menampilkan Error pada Field terkait.
- Menjaga nilai Field lain tetap konsisten.
- Memperbarui Dirty State.

Perubahan Field mengikuti Dependency Rules pada PART 7.

---

# 8.6 Submit Behaviour

Saat pengguna menekan tombol Submit.

Urutan proses.

```text
Validate Form

↓

Business Validation

↓

Permission Check

↓

Disable Submit Button

↓

Loading State

↓

Service Layer

↓

REST API
```

Submit hanya dilakukan apabila seluruh validasi berhasil.

---

# 8.7 Success Behaviour

Apabila proses berhasil.

Frontend harus.

- Menampilkan Success Message.
- Menutup Dialog (jika menggunakan Dialog).
- Melakukan Redirect atau Refresh Data sesuai kebutuhan.
- Menghapus Loading State.
- Menyegarkan Data melalui TanStack Query bila diperlukan.

Behaviour mengikuti kebutuhan Product Module.

---

# 8.8 Reset & Cancel Behaviour

Reset.

- Mengembalikan seluruh Field ke Default Value.
- Menghapus Validation Error.
- Menghapus Dirty State.

Cancel.

- Tidak mengirim Request.
- Menutup Dialog atau kembali ke halaman sebelumnya.
- Tidak mengubah Data.

---

# 8.9 Behaviour Rules

### BEHAVIOUR-001

Seluruh Form memiliki Default Values.

---

### BEHAVIOUR-002

Submit hanya dilakukan setelah seluruh Validation berhasil.

---

### BEHAVIOUR-003

Submit Button dinonaktifkan selama proses berlangsung.

---

### BEHAVIOUR-004

Loading State wajib ditampilkan selama proses Submit.

---

### BEHAVIOUR-005

Success Behaviour harus konsisten pada seluruh Product Module.

---

### BEHAVIOUR-006

Reset tidak mengubah Data pada Backend.

---

# 8.10 Expected Outcome

Default Values & Form Behaviour dinyatakan memenuhi standar apabila.

- Seluruh Form memiliki Initial State.
- Default Values terdokumentasi.
- Behaviour konsisten pada seluruh Product Module.
- Submit mengikuti Validation dan Permission.
- Success, Reset, dan Cancel memiliki perilaku yang seragam.

# END OF PART 8
# ==============================================================================

# ==============================================================================
# FORM-SPEC.md
# PART 9 — ERROR HANDLING & UX RULES
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar penanganan Error serta User Experience (UX) pada seluruh Form Engineering Document Management System (EDMS). |
| **Depends On** | UI-GUIDELINES.md, STATE-MANAGEMENT.md, API-CONTRACT.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 9.1 Overview

Error Handling memastikan pengguna memperoleh informasi yang jelas ketika terjadi kesalahan selama menggunakan Form.

UX Rules memastikan seluruh Form memberikan pengalaman penggunaan yang konsisten, mudah dipahami, dan responsif.

---

# 9.2 Error Categories

Error dikelompokkan menjadi beberapa kategori.

| Category | Description |
|----------|-------------|
| Validation Error | Kesalahan input pengguna |
| Business Error | Pelanggaran aturan bisnis |
| Permission Error | Tidak memiliki hak akses |
| Network Error | Gangguan koneksi |
| Server Error | Kesalahan Backend |
| Unexpected Error | Kesalahan yang tidak terduga |

---

# 9.3 Error Display Rules

Setiap Error harus.

- Ditampilkan dekat dengan Field terkait apabila memungkinkan.
- Menggunakan bahasa yang mudah dipahami.
- Tidak menampilkan informasi teknis Backend.
- Menggunakan gaya visual yang konsisten dengan UI-GUIDELINES.md.

---

# 9.4 Validation Error Behaviour

Apabila terjadi Validation Error.

Frontend harus.

- Memberikan Highlight pada Field.
- Menampilkan Validation Message.
- Mencegah proses Submit.
- Memindahkan fokus ke Field pertama yang Error apabila diperlukan.

---

# 9.5 API Error Behaviour

Apabila Response API gagal.

| HTTP Status | Behaviour |
|-------------|-----------|
| 400 | Tampilkan Validation Error |
| 401 | Redirect ke Login |
| 403 | Tampilkan Access Denied |
| 404 | Tampilkan Data Not Found |
| 409 | Tampilkan Conflict Message |
| 500 | Tampilkan General Error Message |

HTTP Status mengikuti API-CONTRACT.md.

---

# 9.6 Loading UX

Selama proses Submit.

Frontend harus.

- Menampilkan Loading Indicator.
- Menonaktifkan Submit Button.
- Mencegah Multiple Submit.
- Menjaga Input tetap konsisten sesuai kebutuhan Form.

---

# 9.7 Success UX

Apabila proses berhasil.

Frontend harus.

- Menampilkan Success Notification.
- Memperbarui Data yang relevan.
- Menutup Dialog bila diperlukan.
- Menghapus Error sebelumnya.
- Mengembalikan Form ke kondisi normal.

---

# 9.8 UX Rules

### UX-001

Validation Message harus mudah dipahami.

---

### UX-002

Tidak menampilkan Error teknis dari Backend kepada pengguna.

---

### UX-003

Loading State harus terlihat jelas.

---

### UX-004

Submit Button tidak boleh dapat diklik berulang kali selama proses berlangsung.

---

### UX-005

Error harus dapat dipulihkan tanpa me-refresh halaman apabila memungkinkan.

---

### UX-006

Seluruh Form mengikuti UI-GUIDELINES.md.

---

# 9.9 Relationship With Other Documents

| Document | Relationship |
|----------|--------------|
| UI-GUIDELINES.md | Error Display & UX |
| STATE-MANAGEMENT.md | Loading & Form State |
| API-CONTRACT.md | HTTP Status & Response |
| ACCESS-CONTROL.md | Permission Error |
| COMPONENT-SPEC.md | Notification & Dialog Components |

---

# 9.10 Expected Outcome

Error Handling & UX Rules dinyatakan memenuhi standar apabila.

- Seluruh Error ditampilkan secara konsisten.
- Validation Error mudah dipahami.
- HTTP Error ditangani sesuai API Contract.
- Loading, Success, dan Failure memberikan pengalaman pengguna yang konsisten.
- Seluruh Form mengikuti standar UX proyek EDMS.

# END OF PART 9
# ==============================================================================

# ==============================================================================
# FORM-SPEC.md
# PART 10 — FORM ACCEPTANCE CRITERIA
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar akhir yang harus dipenuhi sebelum implementasi Form pada Engineering Document Management System (EDMS) dinyatakan siap digunakan sebagai standar resmi proyek. |
| **Depends On** | PRD.md, ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, UI-GUIDELINES.md, COMPONENT-SPEC.md, ROUTING.md, STATE-MANAGEMENT.md, API-CONTRACT.md, ACCESS-CONTROL.md |
| **Behaviour Reference** | BUSINESS-WORKFLOW.md |
| **Primary Audience** | Product Owner, Solution Architect, Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 10.1 Purpose

Form Acceptance Criteria mendefinisikan seluruh persyaratan yang wajib dipenuhi sebelum implementasi Form dinyatakan **Approved**.

Bagian ini menjadi acuan pada proses Architecture Review, Development Review, QA Review, Integration Review, dan Code Review agar seluruh Form memiliki perilaku yang konsisten pada seluruh Product Module.

---

# 10.2 Acceptance Scope

Acceptance Criteria mencakup seluruh aspek Form Engineering.

- Form Architecture
- Field Classification
- Field Specification
- Technical Validation
- Business Validation
- Dependency Rules
- Default Values
- Form Behaviour
- Error Handling
- User Experience

Seluruh aspek tersebut wajib memenuhi standar sebelum proses implementasi dimulai.

---

# 10.3 Architecture Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| ARCH-001 | Seluruh Form menggunakan React Hook Form. | ☐ |
| ARCH-002 | Validation menggunakan Zod. | ☐ |
| ARCH-003 | Form menggunakan Service Layer. | ☐ |
| ARCH-004 | Form tidak mengakses REST API secara langsung. | ☐ |
| ARCH-005 | Form mengikuti FILE-STRUCTURE.md. | ☐ |
| ARCH-006 | Form mengikuti COMPONENT-SPEC.md. | ☐ |

---

# 10.4 Field Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| FIELD-001 | Seluruh Field memiliki Data Type. | ☐ |
| FIELD-002 | Seluruh Field memiliki Label. | ☐ |
| FIELD-003 | Seluruh Field memiliki Component standar. | ☐ |
| FIELD-004 | Seluruh Field memiliki API Mapping. | ☐ |
| FIELD-005 | Seluruh Field memiliki Default Value. | ☐ |
| FIELD-006 | Seluruh Field mengikuti API Payload. | ☐ |

---

# 10.5 Validation Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| VALID-001 | Technical Validation diterapkan pada seluruh Field. | ☐ |
| VALID-002 | Business Validation mengikuti PRD.md. | ☐ |
| VALID-003 | Validation Message konsisten. | ☐ |
| VALID-004 | Backend melakukan validasi ulang. | ☐ |
| VALID-005 | Validation mengikuti API-CONTRACT.md. | ☐ |

---

# 10.6 Behaviour Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| BEHAVIOUR-001 | Seluruh Form memiliki Default Values. | ☐ |
| BEHAVIOUR-002 | Submit mengikuti Validation Flow. | ☐ |
| BEHAVIOUR-003 | Loading State diterapkan. | ☐ |
| BEHAVIOUR-004 | Success Behaviour diterapkan. | ☐ |
| BEHAVIOUR-005 | Reset Behaviour diterapkan. | ☐ |
| BEHAVIOUR-006 | Cancel Behaviour diterapkan. | ☐ |

---

# 10.7 UX Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| UX-001 | Validation Error mudah dipahami. | ☐ |
| UX-002 | Loading Indicator ditampilkan. | ☐ |
| UX-003 | Multiple Submit dicegah. | ☐ |
| UX-004 | Success Message ditampilkan. | ☐ |
| UX-005 | Error mengikuti UI-GUIDELINES.md. | ☐ |
| UX-006 | Seluruh Form memiliki User Experience yang konsisten. | ☐ |

---

# 10.8 Integration Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| INT-001 | Form mengikuti ROUTING.md. | ☐ |
| INT-002 | Form mengikuti STATE-MANAGEMENT.md. | ☐ |
| INT-003 | Form mengikuti API-CONTRACT.md. | ☐ |
| INT-004 | Form mengikuti ACCESS-CONTROL.md. | ☐ |
| INT-005 | Form menggunakan Component sesuai COMPONENT-SPEC.md. | ☐ |
| INT-006 | Behaviour mengikuti BUSINESS-WORKFLOW.md sebagai Behaviour Reference Only. | ☐ |

---

# 10.9 Development Readiness Checklist

Seluruh checklist berikut harus terpenuhi sebelum implementasi Form dimulai.

| Checklist | Status |
|-----------|--------|
| Form Architecture selesai | ☐ |
| Field Classification selesai | ☐ |
| Field Specification selesai | ☐ |
| Technical Validation selesai | ☐ |
| Business Validation selesai | ☐ |
| Dependency Rules selesai | ☐ |
| Default Values selesai | ☐ |
| Form Behaviour selesai | ☐ |
| Error Handling selesai | ☐ |
| UX Rules selesai | ☐ |
| API Integration siap | ☐ |
| Permission Integration siap | ☐ |

---

# 10.10 Final Acceptance

FORM-SPEC.md dinyatakan **Approved** apabila.

- Seluruh Acceptance Criteria telah terpenuhi.
- Seluruh Form mengikuti standar arsitektur yang ditetapkan pada ENGINEERING-FOUNDATION.md.
- Seluruh Component mengikuti COMPONENT-SPEC.md.
- Seluruh Route mengikuti ROUTING.md.
- Seluruh Form State mengikuti STATE-MANAGEMENT.md.
- Seluruh Request dan Response mengikuti API-CONTRACT.md.
- Seluruh Permission mengikuti ACCESS-CONTROL.md.
- Seluruh tampilan mengikuti UI-GUIDELINES.md.
- Business Behaviour tetap mengacu pada BUSINESS-WORKFLOW.md sebagai **Behaviour Reference Only**.
- Product Owner menyetujui FORM-SPEC.md sebagai **Official Form Specification Baseline** untuk Engineering Document Management System (EDMS) Rebuild.

---

# End of PART 10

FORM-SPEC.md menjadi **Official Form Specification Baseline** yang mendefinisikan standar resmi implementasi seluruh Form pada Engineering Document Management System (EDMS) Rebuild.

Seluruh implementasi Frontend wajib mengacu pada dokumen ini agar seluruh Form memiliki struktur, validasi, perilaku, integrasi API, pengendalian akses, dan pengalaman pengguna yang konsisten pada seluruh Product Module.

Dokumen ini juga menjadi referensi utama bagi Backend Developer, QA Engineer, dan AI Coding Agent untuk memastikan implementasi Form selaras dengan seluruh Source of Truth proyek dan siap dikembangkan secara berkelanjutan.

# ==============================================================================

---

# PHASE 2 SOURCE OF TRUTH SYNCHRONIZATION

## Current Implementation

Form runtime menggunakan kombinasi React Hook Form, Zod safeParse, controlled component lokal, dan Service Layer validation.

Form operasional resmi:

- Login.
- Forgot Password.
- Reset Password.
- Select Project.
- Create Document.
- Workflow Action Approval A/B/C.
- Upload Revision.
- Archive Document.
- Restore Document.
- Project Create/Update/Activate/Deactivate/Close.
- Project Membership Create/Update.
- User Create/Update/Activate/Deactivate.
- Department Create/Update/Activate/Deactivate.
- Profile dan Change Password.
- Create User wajib menampilkan confirmation setelah validasi form PASS untuk menegaskan bahwa Username tidak dapat diubah setelah akun dibuat.

## Validation Baseline

- Document Number unik per Project.
- Create Document memerlukan Active Project, Membership aktif, dan permission `document-register.create`.
- Upload Revision hanya tersedia pada status comment/reject dan menggunakan permission runtime `document-register.edit`.
- Approval B wajib memiliki comment. Attachment bersifat opsional.
- Approval C dapat menggunakan default reason `Document is not approved` apabila comment kosong.
- File utama menerima `pdf`, `docx`, `xls`, `xlsx`, `jpg`, `jpeg`, dan `png` maksimum 100 MB.
- Workflow attachment menerima `pdf`, `jpg`, `jpeg`, dan `png` maksimum 100 MB.
- User email dan username wajib unik.
- Username hanya ditentukan pada Create User dan menjadi immutable setelah akun berhasil dibuat.
- Department name key wajib unik.
- Close Project membutuhkan validasi Active Project, Role Admin, project code confirmation, checkbox confirmation, dan tidak ada workflow aktif.
