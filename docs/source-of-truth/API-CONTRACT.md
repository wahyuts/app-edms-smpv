# ==============================================================================
# API-CONTRACT.md
# PART 1 — DOCUMENT OVERVIEW
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Document Level** | Technical Design Document |
| **Document Status** | Draft |
| **Owner** | Product Owner |
| **Purpose** | Mendefinisikan kontrak resmi komunikasi antara Frontend dan Backend melalui REST API pada Engineering Document Management System (EDMS) Rebuild. |
| **Depends On** | PRD.md, ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, UI-GUIDELINES.md, COMPONENT-SPEC.md, FILE-STRUCTURE.md, ROUTING.md, STATE-MANAGEMENT.md |
| **Design Reference** | Approved UI Design Mockup |
| **Behaviour Reference** | BUSINESS-WORKFLOW.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, Technical Lead, AI Coding Assistant |
| **Change Impact** | Very High |
| **Last Review** | Architecture Review |

---

# 1.1 Purpose

API-CONTRACT.md merupakan dokumen resmi yang mendefinisikan kontrak komunikasi antara Frontend dan Backend pada Engineering Document Management System (EDMS) Rebuild.

Dokumen ini menjelaskan spesifikasi REST API yang akan digunakan oleh seluruh Product Module sehingga implementasi Frontend dan Backend dapat dikembangkan secara paralel dengan tetap mempertahankan konsistensi struktur data, pola komunikasi, dan perilaku sistem.

API-CONTRACT.md tidak mendefinisikan kebutuhan bisnis maupun Business Workflow baru.

Seluruh perilaku sistem, Business Rules, Functional Requirements, dan User Interaction tetap mengacu pada PRD.md serta BUSINESS-WORKFLOW.md sebagai **Behaviour Reference Only**.

---

# 1.2 Objectives

Dokumen ini bertujuan untuk:

- Menjadi kontrak resmi antara Frontend dan Backend.
- Menstandarkan seluruh REST API yang digunakan oleh EDMS Rebuild.
- Menentukan struktur Request dan Response yang konsisten.
- Menentukan pola komunikasi antar layer aplikasi.
- Mendukung implementasi Frontend menggunakan Service Layer.
- Mendukung implementasi Backend menggunakan Express.js REST API.
- Menjadi referensi implementasi bagi Frontend Developer, Backend Developer, QA Engineer, dan AI Coding Assistant.
- Mengurangi ambiguitas implementasi antar tim pengembang.
- Memastikan seluruh Product Module menggunakan standar API yang seragam.

---

# 1.3 Scope

API-CONTRACT.md mencakup seluruh kontrak REST API yang digunakan oleh Engineering Document Management System (EDMS) Rebuild.

Ruang lingkup dokumen meliputi:

- Authentication API
- Dashboard API
- Document Register API
- SLA Monitoring API
- Escalation API
- Audit Trail API
- Notification API
- User Management API
- Authorization Catalog API (Reference Catalog / Historical Reference)
- User Profile API
- Transmittal API (Future Ready)
- Common Request Format
- Common Response Format
- Error Response
- Pagination
- Filtering
- Sorting
- Authentication Strategy
- Authorization Rules
- API Versioning
- Endpoint Naming Convention
- Request & Response Schema

Dokumen ini tidak membahas implementasi Business Logic, Database Schema, SQL Query, maupun implementasi source code Backend.

---

# 1.4 Document Position

API-CONTRACT.md merupakan bagian dari **Technical Design Documents** yang menjembatani kebutuhan produk dengan implementasi layanan Backend.

Hubungan antar dokumen adalah sebagai berikut.

```text
BUSINESS-WORKFLOW.md
        │
        │ (Behaviour Reference Only)
        ▼
SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable)
FEATURE-MAPPING.md (Historical Reference / Unavailable)
        │
        ▼
PRD.md
        │
        ├── ENGINEERING-FOUNDATION.md
        ├── IMPLEMENTATION-PLAN.md
        ├── UI-GUIDELINES.md
        ├── COMPONENT-SPEC.md
        ├── FILE-STRUCTURE.md
        ├── ROUTING.md
        └── STATE-MANAGEMENT.md
                │
                ▼
          API-CONTRACT.md
          │            │
          ▼            ▼
Frontend      Backend REST API
(Service)     (Express.js)
          │            │
          └──────┬─────┘
                 ▼
               MySQL
```

API-CONTRACT.md tidak menentukan kebutuhan bisnis maupun desain antarmuka.

Dokumen ini hanya mendefinisikan bagaimana Frontend dan Backend saling berkomunikasi secara konsisten melalui REST API.

---

# 1.5 Source of Truth

API-CONTRACT.md disusun berdasarkan dokumen berikut.

| Priority | Reference | Purpose |
|----------|-----------|---------|
| **1** | PRD.md | Menentukan Product Module, Functional Requirements, Business Behaviour, serta kebutuhan data setiap fitur. |
| **2** | ENGINEERING-FOUNDATION.md | Menentukan Technology Stack, REST API Philosophy, Authentication Strategy, Service Layer Pattern, dan Architecture. |
| **3** | IMPLEMENTATION-PLAN.md | Menentukan urutan implementasi module, Future API, dependency, dan strategi integrasi. |
| **4** | UI-GUIDELINES.md | Menentukan data yang harus ditampilkan oleh setiap halaman dan komponen UI. |
| **5** | COMPONENT-SPEC.md | Menentukan kebutuhan data setiap React Component yang dikonsumsi melalui API. |
| **6** | FILE-STRUCTURE.md | Menentukan organisasi Service Layer dan struktur implementasi API pada proyek. |
| **7** | ROUTING.md | Menentukan hubungan antara halaman aplikasi dan endpoint API yang digunakan. |
| **8** | STATE-MANAGEMENT.md | Menentukan pembagian Server State dan Client State sehingga pola konsumsi API tetap konsisten. |
| **9** | Approved UI Design Mockup | Menjadi Visual Source of Truth untuk memastikan API menyediakan data yang dibutuhkan oleh antarmuka pengguna. |
| **10** | BUSINESS-WORKFLOW.md | Digunakan sebagai **Behaviour Reference Only** untuk memastikan endpoint mendukung alur bisnis yang telah ditetapkan tanpa mendefinisikan ulang Business Workflow. |

API-CONTRACT.md tidak diperbolehkan mendefinisikan endpoint, struktur data, maupun perilaku API yang bertentangan dengan seluruh Source of Truth tersebut.

---

# 1.6 API Design Principles

Seluruh API pada EDMS Rebuild wajib mengikuti prinsip berikut.

- RESTful API Architecture.
- Resource-Oriented Endpoint Design.
- Consistent Request Structure.
- Consistent Response Structure.
- Predictable URL Convention.
- Stateless Communication.
- JSON sebagai standar pertukaran data.
- JWT Authentication menggunakan HttpOnly Cookie.
- Service Layer sebagai satu-satunya akses Frontend ke Backend.
- Separation of Concerns.
- Backward Compatibility melalui API Versioning.
- AI-Friendly API Specification.

---

# 1.7 Out of Scope

API-CONTRACT.md tidak membahas hal-hal berikut.

- Business Workflow
- Business Rules
- Product Requirement
- UI Layout
- React Component Implementation
- Backend Source Code
- Express Routing Implementation
- Database Schema
- SQL Query
- Stored Procedure
- ORM Configuration
- MySQL Optimization
- DevOps Configuration
- Deployment Strategy

Seluruh aspek tersebut dijelaskan pada dokumen Source of Truth yang sesuai.

---

# 1.8 Expected Outcome

Setelah API-CONTRACT.md diterapkan, seluruh tim pengembang diharapkan memiliki pemahaman yang sama mengenai kontrak komunikasi antara Frontend dan Backend.

Dokumen ini menjadi acuan resmi sehingga:

- Frontend dapat mengembangkan Service Layer tanpa menunggu implementasi Backend.
- Backend dapat mengimplementasikan REST API sesuai kontrak yang telah disepakati.
- QA Engineer dapat menyusun skenario pengujian API berdasarkan endpoint dan response yang terdokumentasi.
- AI Coding Assistant dapat menghasilkan implementasi Frontend maupun Backend secara konsisten.
- Seluruh Product Module menggunakan pola komunikasi yang seragam, terdokumentasi, dan mudah dipelihara.

---

# END OF PART 1
# ==============================================================================

# ==============================================================================
# API-CONTRACT.md
# PART 2 — API DESIGN PRINCIPLES
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan filosofi dan prinsip desain REST API pada Engineering Document Management System (EDMS) Rebuild. |
| **Depends On** | ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md |
| **Primary Audience** | Backend Developer, Frontend Developer, Technical Lead, AI Coding Agent |

---

# 2.1 Overview

Seluruh komunikasi antara Frontend dan Backend pada Engineering Document Management System (EDMS) menggunakan arsitektur **REST API**.

API dirancang agar mudah dipahami, mudah dikembangkan, konsisten pada seluruh Product Module, serta mendukung pengembangan Frontend dan Backend secara paralel.

Seluruh implementasi wajib mengikuti prinsip yang dijelaskan pada bagian ini.

---

# 2.2 API Philosophy

API EDMS dibangun berdasarkan filosofi berikut.

- Resource-Oriented.
- Stateless Communication.
- Consistent Response.
- Predictable Endpoint.
- Version Ready.
- AI-Friendly.
- Frontend Independent.
- Backend Independent.
- Service Layer First.

API tidak dirancang mengikuti tampilan UI, tetapi mengikuti Resource yang dimiliki sistem.

---

# 2.3 Design Goals

Seluruh API harus memenuhi tujuan berikut.

- Mudah dipahami.
- Mudah digunakan.
- Konsisten.
- Mudah dikembangkan.
- Mudah diuji.
- Mudah didokumentasikan.
- Siap digunakan Mock API.
- Siap digunakan Production API.

---

# 2.4 REST Principles

Seluruh Endpoint wajib mengikuti prinsip REST.

| Principle | Description |
|------------|-------------|
| Resource Based | Endpoint mewakili Resource. |
| Stateless | Server tidak menyimpan Session Request. |
| Client Server | Frontend dan Backend terpisah. |
| Uniform Interface | Seluruh Endpoint menggunakan pola yang konsisten. |
| Cache Ready | Mendukung mekanisme cache. |

---

# 2.5 Resource-Oriented Design

Endpoint dibuat berdasarkan Product Module.

Contoh.

```text
Authentication

Dashboard

Document Register

Transmittal

Notification

User

Role

Audit Trail
```

Bukan berdasarkan Action.

Contoh yang benar.

```text
GET /documents

POST /documents

GET /notifications
```

Contoh yang tidak diperbolehkan.

```text
/getDocument

/saveDocument

/deleteDocument
```

---

# 2.6 Communication Pattern

Seluruh komunikasi mengikuti pola berikut.

```text
React Component

↓

Service Layer

↓

Axios

↓

REST API

↓

Express Controller

↓

Service

↓

Repository

↓

Database
```

Component tidak diperbolehkan mengakses REST API secara langsung.

---

# 2.7 API Characteristics

Seluruh API wajib memiliki karakteristik berikut.

- Stateless.
- JSON Response.
- Predictable URL.
- Consistent Naming.
- Version Ready.
- Easy Debugging.
- Easy Logging.
- Easy Monitoring.

---

# 2.8 API Layer Responsibility

| Layer | Responsibility |
|---------|----------------|
| React Component | Menampilkan UI |
| Service Layer | Memanggil REST API |
| REST API | Menyediakan Resource |
| Business Service | Business Logic |
| Repository | Database Access |
| Database | Data Persistence |

Masing-masing layer hanya memiliki satu tanggung jawab.

---

# 2.9 General Rules

Seluruh API wajib mengikuti aturan berikut.

- Menggunakan REST API.
- Menggunakan JSON.
- Menggunakan HTTPS.
- Menggunakan Version Prefix.
- Menggunakan HTTP Method sesuai Resource.
- Menggunakan Status Code yang benar.
- Menggunakan struktur Response yang konsisten.
- Menggunakan struktur Error yang konsisten.
- Tidak mengembalikan HTML.

---

# 2.10 Expected Outcome

API Design Principles dinyatakan berhasil apabila.

- Seluruh Product Module mengikuti standar REST.
- Endpoint mudah dipahami.
- Frontend dan Backend dapat dikembangkan secara paralel.
- Struktur API konsisten.
- Seluruh implementasi mengikuti ENGINEERING-FOUNDATION.md.

# END OF PART 2
# ==============================================================================

# ==============================================================================
# API-CONTRACT.md
# PART 3 — ENDPOINT ORGANIZATION
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan organisasi Endpoint REST API berdasarkan Product Module Engineering Document Management System (EDMS). |
| **Depends On** | PRD.md, ROUTING.md, FILE-STRUCTURE.md |
| **Primary Audience** | Backend Developer, Frontend Developer, AI Coding Agent |

---

# 3.1 Overview

Seluruh Endpoint pada EDMS diorganisasikan berdasarkan **Product Module**, bukan berdasarkan halaman (Page) ataupun Component.

Pendekatan ini menjaga agar struktur API tetap konsisten, mudah dipelihara, dan mudah dikembangkan ketika Product Module bertambah.

---

# 3.2 Organization Philosophy

Endpoint mengikuti Product Module.

```text
Authentication

Dashboard

Document Register

Transmittal

Notification

Administration
```

Bukan mengikuti.

```text
Dashboard Page

Upload Dialog

Document Table

Sidebar
```

UI mengonsumsi API.

API tidak mengikuti struktur UI.

---

# 3.3 Endpoint Hierarchy

```text
/api/v1

│

├── auth/

├── dashboard/

├── documents/

├── transmittals/

├── notifications/

├── sla/

├── escalations/

├── audit-trails/

├── storage/

├── users/

├── roles/

├── permissions/

└── profiles/
```

Seluruh Endpoint berada di bawah prefix.

```text
/api/v1
```

Versi API berikutnya menggunakan prefix baru.

```text
/api/v2
```

Tanpa mengubah kontrak versi sebelumnya.

---

# 3.4 Product Module Mapping

| Product Module | Endpoint Group |
|----------------|----------------|
| Authentication | /auth |
| Dashboard | /dashboard |
| Document Register | /documents |
| Transmittal | /transmittals |
| Notification | /notifications |
| SLA Monitoring | /sla |
| Escalation | /escalations |
| Audit Trail | /audit-trails |
| Storage NAS | /storage (DEFERRED / NOT IMPLEMENTED as Storage NAS listing in current runtime) |
| User Management | /users |
| Department Management | /departments |
| Project Management | /projects |
| Project Membership | /project-memberships |
| Project Close | /projects/{id}/close |
| Role Catalog | /roles (Reference Catalog / Historical Reference) |
| Permission Catalog | /permissions (Reference Catalog / Historical Reference) |
| User Profile | /profile |

Setiap Product Module memiliki kelompok Endpoint masing-masing.

---

# 3.5 HTTP Method Organization

Seluruh Endpoint menggunakan HTTP Method standar.

| Method | Purpose |
|----------|----------|
| GET | Read Resource |
| POST | Create Resource |
| PUT | Replace Resource |
| PATCH | Partial Update |
| DELETE | Delete Resource |

Method harus mencerminkan operasi terhadap Resource.

---

# 3.6 URL Structure

Format URL.

```text
/api/v1/{resource}
```

Contoh.

```text
/api/v1/dashboard

/api/v1/documents

/api/v1/notifications

/api/v1/users
```

Resource tambahan.

```text
/api/v1/documents/{id}

/api/v1/users/{id}
```

---

# 3.7 Naming Convention

Seluruh Endpoint wajib mengikuti aturan berikut.

- Lowercase.
- Plural Resource.
- Kebab-case.
- Tidak menggunakan Verb.
- Tidak menggunakan underscore.
- Tidak menggunakan camelCase.

Contoh.

```text
/users

/document-history

/audit-trails
```

---

# 3.8 Endpoint Rules

Seluruh Endpoint wajib memenuhi aturan berikut.

- Satu Endpoint mewakili satu Resource.
- Tidak menggunakan nama Page.
- Tidak menggunakan nama Component.
- Mengikuti Product Module.
- Mendukung Versioning.
- Mudah dipahami.
- Mudah dipelihara.

---

# 3.9 Endpoint Dependency

Hubungan Endpoint.

```text
Frontend

↓

Service Layer

↓

REST API

↓

Business Service

↓

Repository

↓

Database
```

Frontend hanya mengetahui Service Layer.

Backend hanya mengekspos REST API.

---

# 3.10 Expected Outcome

Endpoint Organization dinyatakan memenuhi standar apabila.

- Seluruh Endpoint mengikuti Product Module.
- Seluruh URL konsisten.
- Seluruh Resource mudah dipahami.
- Versioning siap digunakan.
- Seluruh implementasi mengikuti PRD.md, ROUTING.md, dan FILE-STRUCTURE.md.

# END OF PART 3
# ==============================================================================

# ==============================================================================
# API-CONTRACT.md
# PART 4 — REST ENDPOINT SPECIFICATION
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan spesifikasi Endpoint REST API untuk seluruh Product Module EDMS. |
| **Depends On** | PRD.md, ROUTING.md, STATE-MANAGEMENT.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 4.1 Overview

Bagian ini mendefinisikan standar spesifikasi seluruh REST Endpoint yang digunakan oleh Engineering Document Management System (EDMS).

Setiap Endpoint merupakan representasi dari sebuah Resource dan menjadi kontrak resmi komunikasi antara Frontend dan Backend.

---

# 4.2 Endpoint Specification Format

Seluruh Endpoint wajib mengikuti format dokumentasi berikut.

| Field | Description |
|--------|-------------|
| Endpoint Name | Nama Endpoint |
| HTTP Method | GET, POST, PUT, PATCH, DELETE |
| URL | Endpoint URL |
| Purpose | Tujuan Endpoint |
| Authentication | Required / Public |
| Authorization | Permission yang dibutuhkan |
| Request | Request Body / Parameter |
| Response | Success Response |
| Error Response | Error Response |
| Related Module | Product Module |

Seluruh Endpoint pada dokumen ini menggunakan format tersebut.

---

# 4.3 Authentication Endpoints

| Endpoint | Method | Purpose |
|----------|--------|----------|
| /api/v1/auth/login | POST | Login User |
| /api/v1/auth/logout | POST | Logout User |
| /api/v1/auth/refresh | POST | Refresh Access Token |
| /api/v1/auth/me | GET | Current User Profile and Auth Context |
| /api/v1/auth/profile | GET | Current User Profile Alias |
| /api/v1/auth/change-password | POST | Change Current User Password |
| /api/v1/password/forgot | POST | Request Password Reset using Username and Registered Email with generic response |
| /api/v1/password/reset | POST | Complete Password Reset using valid token |

Historical / superseded authentication routes:

| Endpoint | Method | Runtime Status |
|----------|--------|----------------|
| /api/v1/auth/forgot-password | POST | HISTORICAL / NOT ACTIVE IN CURRENT RUNTIME |
| /api/v1/auth/reset-password/validate | POST | HISTORICAL / NOT ACTIVE IN CURRENT RUNTIME |
| /api/v1/auth/reset-password | POST | HISTORICAL / NOT ACTIVE IN CURRENT RUNTIME |

Password Reset Backend Integration wajib mempertahankan generic response, secure random token, token hash storage, expiration, single use, revocation of old token, password hashing, rate limiting, transactional email provider, HTTPS, session invalidation, security audit, dan no token logging.

---

# 4.4 Dashboard Endpoints

| Endpoint | Method | Purpose |
|----------|--------|----------|
| /api/v1/dashboard/summary | GET | Dashboard Summary Cards |
| /api/v1/dashboard/statistics | GET | Dashboard Statistics |
| /api/v1/dashboard/recent-activities | GET | Recent Activities |

---

# 4.5 Document Register Endpoints

| Endpoint | Method | Purpose |
|----------|--------|----------|
| /api/v1/documents | GET | Document List |
| /api/v1/documents | POST | Upload Document |
| /api/v1/documents/{id} | GET | Document Detail |
| /api/v1/documents/{id} | PATCH | Update Document |
| /api/v1/documents/{id}/archive | PATCH | Archive Document |
| /api/v1/documents/{id}/restore | PATCH | Restore Document |
| /api/v1/documents/{id}/revisions | POST | Upload Revision |
| /api/v1/documents/{id}/revisions | GET | Revision History |
| /api/v1/documents/{id}/history | GET | Document History |
| /api/v1/documents/{id}/comments | GET | Comment List |
| /api/v1/documents/{id}/comments/read | PATCH | Mark Workflow Comments Read |
| /api/v1/documents/{id}/view | GET | View Active Document File Inline |
| /api/v1/documents/{id}/download | GET | Download Document |
| /api/v1/documents/{id}/revisions/{revisionId}/view | GET | View Historical Revision File Inline |
| /api/v1/documents/{id}/revisions/{revisionId}/download | GET | Download Historical Revision File |
| /api/v1/documents/{id}/workflow-attachments | POST | Upload Workflow Attachment Metadata from temporaryFileId |
| /api/v1/documents/{id}/workflow-attachments/{attachmentId}/download | GET | View or Download Workflow Attachment File |

Operational Document Register tidak menyediakan permanent delete melalui UI.
Archive mengubah Document Lifecycle menjadi Archived tanpa menghapus History, Revision, Audit Trail, file, atau relasi dokumen.

---

# 4.6 Document Review Endpoints

Endpoint khusus workflow review.

| Endpoint | Method | Purpose |
|----------|--------|----------|
| /api/v1/documents/{id}/approve | POST | Approval A |
| /api/v1/documents/{id}/approve-with-comment | POST | Approval B |
| /api/v1/documents/{id}/reject | POST | Approval C |

Business Behaviour mengikuti BUSINESS-WORKFLOW.md.

Approval request schema:

| Action | Comment | Attachment | Required Data |
|---|---|---|---|
| Approval A | Optional | Optional | `expectedWorkflowStatus`, `expectedActiveRevisionId`, optional `expectedCurrentAssigneeUserId`, reviewer, workflow history, timestamp, audit, notification |
| Approval B | Mandatory | Optional | `expectedWorkflowStatus`, `expectedActiveRevisionId`, optional `expectedCurrentAssigneeUserId`, reviewer, workflow history, timestamp, attachment metadata if any, audit, notification |
| Approval C | Optional | Optional | `expectedWorkflowStatus`, `expectedActiveRevisionId`, optional `expectedCurrentAssigneeUserId`, reviewer, workflow history, timestamp, attachment metadata if any, audit, notification |

Attachment pada Approval B/C adalah workflow attachment dan bukan document revision.

Jika expected workflow state tidak cocok dengan canonical database state, API mengembalikan HTTP `409 Conflict` dengan `code` `WORKFLOW_CONFLICT`.

Workflow Status resmi yang harus didukung API Document Register adalah:

- Process Review
- Process Comment
- Process Reject
- Project Review
- Project Comment
- Project Reject
- Approved

---

# 4.7 Supporting Module Endpoints

| Module | Endpoint |
|----------|----------|
| Notification | /api/v1/notifications |
| SLA Monitoring | /api/v1/sla |
| Escalation | /api/v1/escalations |
| Audit Trail | /api/v1/audit-trails |
| Storage NAS | /api/v1/storage (DEFERRED / NOT IMPLEMENTED as Storage NAS listing in current runtime) |
| Temporary Upload | /api/v1/storage/temporary-uploads |

---

# 4.8 Administration Endpoints

| Module | Endpoint |
|----------|----------|
| Users | /api/v1/users |
| Departments | /api/v1/departments |
| Projects | /api/v1/projects |
| Project Memberships | /api/v1/project-memberships |
| Project Close | /api/v1/projects/{id}/close |
| Roles | /api/v1/roles (Reference Catalog / Historical Reference) |
| Permissions | /api/v1/permissions (Reference Catalog / Historical Reference) |
| User Profile | /api/v1/profile |

Runtime Administration API tidak menggunakan Roles dan Permissions sebagai operational endpoint.

---

# 4.9 Endpoint Rules

Seluruh Endpoint wajib memenuhi aturan berikut.

- Menggunakan prefix `/api/v1`.
- Menggunakan plural resource.
- Menggunakan HTTP Method yang sesuai.
- Menggunakan JSON.
- Tidak menggunakan nama Page.
- Tidak menggunakan nama Component.
- Mengikuti Product Module.
- Mendukung API Versioning.
- Mendukung Authentication.
- Mendukung Authorization.

---

# 4.10 Expected Outcome

REST Endpoint Specification dinyatakan memenuhi standar apabila.

- Seluruh Product Module memiliki Endpoint.
- Seluruh Endpoint mengikuti REST Architecture.
- Seluruh Endpoint mengikuti Product Module.
- Endpoint mudah dipahami.
- Frontend dan Backend menggunakan kontrak yang sama.

# END OF PART 4
# ==============================================================================

# ==============================================================================
# API-CONTRACT.md
# PART 5 — REQUEST & RESPONSE SCHEMA
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar struktur Request dan Response seluruh REST API EDMS. |
| **Depends On** | ENGINEERING-FOUNDATION.md, STATE-MANAGEMENT.md |
| **Primary Audience** | Backend Developer, Frontend Developer, QA Engineer, AI Coding Agent |

---

# 5.1 Overview

Seluruh REST API pada EDMS menggunakan struktur Request dan Response yang konsisten.

Konsistensi ini bertujuan mempermudah integrasi Frontend, Backend, Mock API, serta pengujian otomatis.

---

# 5.2 Request Structure

Request Body menggunakan format JSON.

Contoh.

```json
{
  "documentNumber": "P-CDU-PID-010",
  "description": "Heater System",
  "drawingType": "PID"
}
```

---

# 5.3 Success Response Structure

Seluruh Response berhasil menggunakan struktur berikut.

```json
{
  "success": true,
  "message": "Request processed successfully.",
  "data": {}
}
```

---

# 5.4 Collection Response

Response untuk data koleksi.

```json
{
  "success": true,
  "message": "Documents retrieved successfully.",
  "data": [],
  "pagination": {}
}
```

---

# 5.5 Pagination Schema

Endpoint yang mendukung Pagination wajib menggunakan struktur berikut.

```json
{
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 125,
    "totalPages": 13
  }
}
```

---

# 5.6 Error Response Structure

Apabila Request gagal.

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": []
}
```

---

# 5.7 Validation Error Structure

Error validasi menggunakan format berikut.

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "documentNumber",
      "message": "Document Number is required."
    }
  ]
}
```

---

# 5.8 Standard Response Fields

| Field | Description |
|--------|-------------|
| success | Status Request |
| message | Informasi Response |
| data | Payload |
| pagination | Pagination Information |
| errors | Validation Errors |

Field di atas menjadi standar seluruh Response.

---

# 5.9 Schema Rules

Seluruh Request dan Response wajib memenuhi aturan berikut.

- Menggunakan JSON.
- Menggunakan UTF-8.
- Property menggunakan camelCase.
- Menggunakan struktur Response yang konsisten.
- Tidak mengembalikan HTML.
- Tidak mengembalikan Stack Trace.
- Tidak mengembalikan SQL Error.
- Menggunakan HTTP Status Code yang sesuai.

---

# 5.10 Expected Outcome

Request & Response Schema dinyatakan memenuhi standar apabila.

- Seluruh Endpoint menggunakan struktur Request yang konsisten.
- Seluruh Endpoint menggunakan struktur Response yang konsisten.
- Error Response mengikuti standar.
- Pagination mengikuti standar.
- Seluruh implementasi mudah digunakan oleh Frontend maupun Backend.

# END OF PART 5
# ==============================================================================

# ==============================================================================
# API-CONTRACT.md
# PART 6 — AUTHENTICATION & AUTHORIZATION
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar Authentication dan Authorization pada seluruh REST API Engineering Document Management System (EDMS). |
| **Depends On** | ENGINEERING-FOUNDATION.md, ACCESS-CONTROL.md (Future), PRD.md |
| **Primary Audience** | Backend Developer, Frontend Developer, QA Engineer, AI Coding Agent |

---

# 6.1 Overview

Seluruh REST API pada Engineering Document Management System (EDMS) menggunakan mekanisme Authentication dan Authorization untuk melindungi resource yang dimiliki sistem.

Authentication menentukan identitas pengguna.

Authorization menentukan hak akses pengguna terhadap suatu Resource.

Kedua mekanisme tersebut wajib diterapkan secara konsisten pada seluruh Protected Endpoint.

---

# 6.2 Authentication Strategy

EDMS menggunakan strategi Authentication berikut.

- JWT (JSON Web Token)
- HttpOnly Cookie
- Secure Cookie (Production)
- SameSite Cookie Policy
- Stateless Authentication
- Session Refresh menggunakan Refresh Token

Frontend tidak menyimpan Access Token pada Local Storage maupun Session Storage.

---

# 6.3 Authentication Flow

```text
User Login

↓

POST /api/v1/auth/login

↓

Backend Validation

↓

JWT Generated

↓

HttpOnly Cookie

↓

Authenticated User

↓

Access Protected Resource
```

Authentication dilakukan sebelum pengguna dapat mengakses seluruh Protected Resource.

---

# 6.4 Authorization Model

Authorization menggunakan Role-Based Access Control (RBAC).

Hak akses pengguna ditentukan berdasarkan Role dan Permission yang dimiliki.

Seluruh aturan detail akan dijelaskan pada ACCESS-CONTROL.md.

---

# 6.5 Endpoint Security Classification

| Endpoint Type | Authentication |
|---------------|----------------|
| Login | Public |
| Logout | Required |
| Refresh Token | Required |
| Dashboard | Required |
| Documents | Required |
| Notifications | Required |
| SLA Monitoring | Required |
| Escalation | Required |
| Audit Trail | Required |
| Administration | Required |

Secara default seluruh Endpoint bersifat Protected kecuali Login.

---

# 6.6 Authorization Matrix

| Resource | Permission Required |
|----------|---------------------|
| Dashboard | dashboard.view |
| Documents | document-register.view |
| Upload Document | document-register.create |
| Upload Revision | document-register.edit |
| Archive Document | document-register.archive |
| Review Document | approval.a / approval.b / approval.c |
| Notification | notifications.view |
| SLA Monitoring | sla-monitoring.view |
| Escalation | escalation.view |
| Audit Trail | audit-trail.view |
| User Management | user-management.view |
| Project Management | user-management.view |
| Project Membership | user-management.view |

Nama Permission mengikuti ACCESS-CONTROL.md.

---

# 6.7 Authentication Rules

Seluruh Authentication wajib mengikuti aturan berikut.

### AUTH-001

Menggunakan JWT.

---

### AUTH-002

Access Token dikirim menggunakan HttpOnly Cookie.

---

### AUTH-003

Password tidak pernah dikirim kembali pada Response.

---

### AUTH-004

Token tidak disimpan pada Local Storage.

---

### AUTH-005

Seluruh Protected Endpoint wajib melakukan Authentication.

---

### AUTH-006

Logout menghapus Authentication Session.

---

### AUTH-007

Refresh Token digunakan untuk memperbarui Access Token.

---

# 6.8 Authorization Rules

### AUTHZ-001

Authorization dilakukan setelah Authentication berhasil.

---

### AUTHZ-002

Role menentukan Permission.

---

### AUTHZ-003

Permission menentukan akses terhadap Resource.

---

### AUTHZ-004

Endpoint yang tidak memiliki Permission harus mengembalikan HTTP 403.

---

### AUTHZ-005

Endpoint yang belum terautentikasi harus mengembalikan HTTP 401.

---

# 6.9 Security Best Practices

Seluruh implementasi disarankan mengikuti praktik berikut.

- Menggunakan HTTPS.
- Menggunakan Secure Cookie.
- Menggunakan HttpOnly Cookie.
- Menggunakan SameSite Cookie.
- Menggunakan Token Expiration.
- Menggunakan Refresh Token Rotation.
- Melakukan Audit Logging terhadap Login dan Logout.

---

# 6.10 Expected Outcome

Authentication & Authorization dinyatakan memenuhi standar apabila.

- Seluruh Protected Endpoint menggunakan JWT Authentication.
- Authorization mengikuti RBAC.
- Frontend tidak menyimpan Token pada Local Storage.
- Seluruh Endpoint mengembalikan HTTP Status yang sesuai.
- Seluruh implementasi konsisten dengan ENGINEERING-FOUNDATION.md dan ACCESS-CONTROL.md.

# END OF PART 6
# ==============================================================================

# ==============================================================================
# API-CONTRACT.md
# PART 7 — ERROR HANDLING & HTTP STATUS
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar Error Handling dan penggunaan HTTP Status Code pada REST API Engineering Document Management System (EDMS). |
| **Depends On** | ENGINEERING-FOUNDATION.md, API-CONTRACT.md PART 5 |
| **Primary Audience** | Backend Developer, Frontend Developer, QA Engineer, AI Coding Agent |

---

# 7.1 Overview

Seluruh REST API wajib menggunakan mekanisme Error Handling yang konsisten.

Response Error harus mudah dipahami oleh Frontend, mudah didokumentasikan, dan mudah diuji.

Error Response tidak boleh mengungkapkan informasi internal sistem.

---

# 7.2 Error Response Standard

Seluruh Error menggunakan struktur berikut.

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": []
}
```

Struktur ini berlaku untuk seluruh Product Module.

---

# 7.3 HTTP Status Code

| Status | Meaning | Usage |
|---------|---------|-------|
| 200 | OK | Request berhasil |
| 201 | Created | Resource berhasil dibuat |
| 204 | No Content | Delete berhasil |
| 400 | Bad Request | Request tidak valid |
| 401 | Unauthorized | Belum Login |
| 403 | Forbidden | Tidak memiliki Permission |
| 404 | Not Found | Resource tidak ditemukan |
| 409 | Conflict | Data konflik |
| 422 | Validation Error | Validasi gagal |
| 500 | Internal Server Error | Kesalahan Server |

Seluruh Endpoint wajib menggunakan Status Code di atas.

---

# 7.4 Validation Error

Kesalahan validasi menggunakan format berikut.

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "documentNumber",
      "message": "Document Number is required."
    }
  ]
}
```

---

# 7.5 Authentication Error

Apabila pengguna belum Login.

```json
{
  "success": false,
  "message": "Unauthorized."
}
```

HTTP Status.

```text
401 Unauthorized
```

---

# 7.6 Authorization Error

Apabila pengguna tidak memiliki Permission.

```json
{
  "success": false,
  "message": "Forbidden."
}
```

HTTP Status.

```text
403 Forbidden
```

---

# 7.7 Resource Not Found

```json
{
  "success": false,
  "message": "Resource not found."
}
```

HTTP Status.

```text
404 Not Found
```

---

# 7.8 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error."
}
```

Response tidak boleh mengandung.

- SQL Error
- Stack Trace
- Source Code
- File Path
- Internal Exception
- Database Detail

---

# 7.9 Error Handling Rules

Seluruh implementasi wajib memenuhi aturan berikut.

### ERR-001

Menggunakan struktur Error Response yang konsisten.

---

### ERR-002

Tidak mengembalikan HTML.

---

### ERR-003

Tidak mengembalikan Stack Trace.

---

### ERR-004

Menggunakan HTTP Status Code yang sesuai.

---

### ERR-005

Validation Error menggunakan HTTP 422.

---

### ERR-006

Authentication Error menggunakan HTTP 401.

---

### ERR-007

Authorization Error menggunakan HTTP 403.

---

### ERR-008

Server Error menggunakan HTTP 500.

---

# 7.10 Expected Outcome

Error Handling dinyatakan memenuhi standar apabila.

- Seluruh Endpoint menggunakan Error Response yang konsisten.
- Seluruh HTTP Status mengikuti standar REST.
- Tidak ada informasi sensitif pada Response.
- Frontend dapat menangani seluruh Error secara konsisten.
- QA dapat melakukan pengujian Error berdasarkan standar yang telah ditetapkan.

# END OF PART 7
# ==============================================================================

# ==============================================================================
# API-CONTRACT.md
# PART 8 — API CONVENTION
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar penamaan, struktur URL, Request, Response, dan konvensi implementasi REST API pada Engineering Document Management System (EDMS). |
| **Depends On** | ENGINEERING-FOUNDATION.md, FILE-STRUCTURE.md, STATE-MANAGEMENT.md |
| **Primary Audience** | Backend Developer, Frontend Developer, QA Engineer, AI Coding Agent |

---

# 8.1 Overview

API Convention mendefinisikan standar implementasi REST API agar seluruh Product Module memiliki pola komunikasi yang konsisten.

Seluruh Endpoint, Request, Response, Header, Query Parameter, Pagination, Filtering, Sorting, serta Versioning wajib mengikuti aturan pada bagian ini.

---

# 8.2 URL Convention

Seluruh URL mengikuti format berikut.

```text
/api/v{version}/{resource}
```

Contoh.

```text
/api/v1/dashboard

/api/v1/documents

/api/v1/notifications

/api/v1/users
```

---

# 8.3 Resource Naming Convention

Seluruh Resource mengikuti aturan berikut.

- Lowercase
- Plural Noun
- Kebab-case
- Tidak menggunakan Verb
- Tidak menggunakan underscore
- Tidak menggunakan camelCase

Contoh.

```text
/users

/documents

/audit-trails

/document-history
```

---

# 8.4 HTTP Method Convention

| Method | Purpose |
|----------|----------|
| GET | Read Resource |
| POST | Create Resource |
| PUT | Replace Resource |
| PATCH | Partial Update Resource |
| DELETE | Delete Resource |

Method harus mencerminkan operasi terhadap Resource.

---

# 8.5 Query Parameter Convention

Filtering.

```text
GET /documents?status=approved
```

Sorting.

```text
GET /documents?sort=documentNumber
```

Ordering.

```text
GET /documents?order=asc
```

Searching.

```text
GET /documents?search=heater
```

Pagination.

```text
GET /documents?page=1&pageSize=20
```

Query Parameter dapat digunakan secara bersamaan.

---

# 8.6 Request Convention

Seluruh Request menggunakan.

```text
Content-Type

↓

application/json
```

Request Body menggunakan JSON.

Property menggunakan camelCase.

Contoh.

```json
{
  "documentNumber": "P-CDU-PID-001",
  "drawingType": "PID",
  "description": "Heater System"
}
```

---

# 8.7 Response Convention

Seluruh Response mengikuti struktur standar.

```json
{
  "success": true,
  "message": "Request processed successfully.",
  "data": {}
}
```

Collection Response.

```json
{
  "success": true,
  "message": "Data retrieved successfully.",
  "data": [],
  "pagination": {}
}
```

---

# 8.8 Header Convention

Header yang digunakan.

| Header | Description |
|---------|-------------|
| Content-Type | application/json |
| Accept | application/json |
| Authorization | Bearer Token (jika diperlukan) |

Apabila Authentication menggunakan HttpOnly Cookie, Authorization Header dapat digunakan sesuai kebutuhan implementasi sistem.

---

# 8.9 API Convention Rules

Seluruh REST API wajib memenuhi aturan berikut.

### API-001

Menggunakan HTTPS.

---

### API-002

Menggunakan JSON.

---

### API-003

Menggunakan UTF-8.

---

### API-004

Menggunakan Version Prefix.

---

### API-005

Menggunakan Resource-Oriented URL.

---

### API-006

Menggunakan camelCase pada JSON Property.

---

### API-007

Menggunakan HTTP Method sesuai Resource.

---

### API-008

Menggunakan struktur Response yang konsisten.

---

### API-009

Menggunakan struktur Error Response yang konsisten.

---

### API-010

Tidak mengembalikan HTML.

---

# 8.10 Expected Outcome

API Convention dinyatakan memenuhi standar apabila.

- Seluruh Endpoint menggunakan URL yang konsisten.
- Seluruh Request menggunakan JSON.
- Seluruh Response menggunakan format yang sama.
- Query Parameter mengikuti standar.
- Header mengikuti standar.
- Seluruh implementasi konsisten dengan ENGINEERING-FOUNDATION.md dan STATE-MANAGEMENT.md.

# END OF PART 8
# ==============================================================================

# ==============================================================================
# API-CONTRACT.md
# PART 9 — API VERSIONING & BEST PRACTICES
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan strategi Versioning dan Best Practices REST API pada Engineering Document Management System (EDMS). |
| **Depends On** | ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md |
| **Primary Audience** | Backend Developer, Frontend Developer, Technical Lead, AI Coding Agent |

---

# 9.1 Overview

API Versioning memastikan perubahan pada REST API dapat dilakukan tanpa merusak kompatibilitas implementasi Frontend yang sudah ada.

Best Practices memberikan pedoman implementasi agar seluruh Endpoint tetap konsisten, mudah dipelihara, dan mudah dikembangkan.

---

# 9.2 Versioning Strategy

EDMS menggunakan **URI Versioning**.

Format.

```text
/api/v1/
```

Versi berikutnya.

```text
/api/v2/
```

Setiap perubahan besar (Breaking Change) harus menggunakan versi API baru.

---

# 9.3 Backward Compatibility

Versi API yang telah dirilis tetap dipertahankan selama masa transisi.

Contoh.

```text
/api/v1/documents

↓

tetap tersedia

↓

/api/v2/documents
```

Frontend dapat melakukan migrasi secara bertahap tanpa mengganggu operasional sistem.

---

# 9.4 Deprecation Policy

Apabila sebuah Endpoint akan dihentikan.

Langkah yang dilakukan.

1. Endpoint ditandai sebagai **Deprecated**.
2. Dokumentasi diperbarui.
3. Frontend diberikan waktu migrasi.
4. Endpoint lama dihapus setelah masa transisi selesai.

Endpoint tidak boleh dihapus secara langsung tanpa pemberitahuan.

---

# 9.5 API Evolution Rules

Perubahan berikut **tidak memerlukan** versi baru.

- Penambahan optional field.
- Perbaikan bug.
- Optimasi performa.
- Penambahan endpoint baru.
- Penambahan resource baru.

Perubahan berikut **memerlukan** versi baru.

- Menghapus field.
- Mengubah struktur Response.
- Mengubah URL Endpoint.
- Mengubah arti data.
- Mengubah format Request.

---

# 9.6 API Best Practices

Seluruh implementasi disarankan mengikuti praktik berikut.

- Resource-Oriented Endpoint.
- Stateless Communication.
- Consistent Response.
- Consistent Error Handling.
- Small Payload.
- Clear Documentation.
- Predictable URL.
- Reusable Endpoint.
- Backward Compatible.
- Easy Monitoring.

---

# 9.7 Performance Guidelines

Disarankan.

- Gunakan Pagination untuk Collection.
- Gunakan Filtering.
- Gunakan Sorting.
- Hindari over-fetching.
- Hindari under-fetching.
- Gunakan Cache apabila memungkinkan.
- Gunakan Compression pada Production.

---

# 9.8 Documentation Rules

Setiap Endpoint harus memiliki dokumentasi minimal.

- Purpose
- HTTP Method
- URL
- Authentication
- Authorization
- Request Schema
- Response Schema
- Error Response
- Related Product Module

Dokumentasi harus diperbarui setiap terjadi perubahan API.

---

# 9.9 Best Practice Rules

Seluruh implementasi wajib memenuhi aturan berikut.

### BP-001

Endpoint mengikuti Product Module.

---

### BP-002

Menggunakan Version Prefix.

---

### BP-003

Tidak melakukan Breaking Change tanpa versi baru.

---

### BP-004

Seluruh perubahan didokumentasikan.

---

### BP-005

Seluruh Endpoint memiliki Request dan Response yang konsisten.

---

### BP-006

Mengikuti prinsip RESTful API.

---

### BP-007

Mendukung Frontend dan Backend berkembang secara independen.

---

# 9.10 Expected Outcome

API Versioning & Best Practices dinyatakan memenuhi standar apabila.

- Seluruh Endpoint memiliki strategi Versioning yang jelas.
- Breaking Change tidak merusak implementasi yang sudah ada.
- Dokumentasi selalu diperbarui.
- Seluruh Endpoint mengikuti Best Practices.
- API mudah dipelihara, mudah dikembangkan, dan siap untuk pengembangan jangka panjang.

# END OF PART 9
# ==============================================================================

# ==============================================================================
# API-CONTRACT.md
# PART 10 — API ACCEPTANCE CRITERIA
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar akhir yang harus dipenuhi sebelum implementasi REST API pada Engineering Document Management System (EDMS) dinyatakan siap digunakan sebagai kontrak resmi antara Frontend dan Backend. |
| **Depends On** | PRD.md, ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, FILE-STRUCTURE.md, ROUTING.md, STATE-MANAGEMENT.md |
| **Primary Audience** | Product Owner, Solution Architect, Backend Developer, Frontend Developer, QA Engineer, AI Coding Agent |

---

# 10.1 Purpose

API Acceptance Criteria mendefinisikan seluruh persyaratan yang wajib dipenuhi sebelum API-CONTRACT.md dinyatakan **Approved**.

Bagian ini menjadi acuan resmi pada proses Architecture Review, Development Review, Integration Review, dan Code Review untuk memastikan seluruh implementasi REST API mengikuti standar yang telah ditetapkan.

---

# 10.2 Acceptance Scope

Acceptance Criteria mencakup seluruh aspek API Contract, meliputi.

- API Design Principles
- Endpoint Organization
- REST Endpoint Specification
- Request & Response Schema
- Authentication & Authorization
- Error Handling
- API Convention
- API Versioning
- API Best Practices

Seluruh aspek tersebut wajib memenuhi standar sebelum implementasi Backend maupun Frontend dimulai.

---

# 10.3 API Architecture Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| ARC-001 | Menggunakan arsitektur REST API. | ☐ |
| ARC-002 | Menggunakan Resource-Oriented Endpoint. | ☐ |
| ARC-003 | Menggunakan JSON sebagai format pertukaran data. | ☐ |
| ARC-004 | Menggunakan Service Layer pada Frontend. | ☐ |
| ARC-005 | Menggunakan API Version Prefix. | ☐ |
| ARC-006 | Mengikuti ENGINEERING-FOUNDATION.md. | ☐ |

---

# 10.4 Endpoint Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| END-001 | Seluruh Product Module memiliki Endpoint. | ☐ |
| END-002 | Endpoint mengikuti Product Module. | ☐ |
| END-003 | URL menggunakan Resource-Oriented Design. | ☐ |
| END-004 | HTTP Method sesuai REST Standard. | ☐ |
| END-005 | Endpoint mudah dipahami dan terdokumentasi. | ☐ |

---

# 10.5 Request & Response Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| RES-001 | Request menggunakan JSON. | ☐ |
| RES-002 | Response menggunakan struktur standar. | ☐ |
| RES-003 | Error Response menggunakan struktur standar. | ☐ |
| RES-004 | Pagination mengikuti standar. | ☐ |
| RES-005 | Property menggunakan camelCase. | ☐ |

---

# 10.6 Security Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| SEC-001 | Authentication menggunakan JWT. | ☐ |
| SEC-002 | Authentication menggunakan HttpOnly Cookie. | ☐ |
| SEC-003 | Authorization mengikuti RBAC. | ☐ |
| SEC-004 | Protected Endpoint melakukan Authentication. | ☐ |
| SEC-005 | Protected Endpoint melakukan Authorization. | ☐ |
| SEC-006 | Token tidak disimpan pada Local Storage. | ☐ |

---

# 10.7 Error Handling Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| ERR-001 | Seluruh Error menggunakan format standar. | ☐ |
| ERR-002 | HTTP Status Code sesuai standar REST. | ☐ |
| ERR-003 | Validation Error menggunakan HTTP 422. | ☐ |
| ERR-004 | Authentication Error menggunakan HTTP 401. | ☐ |
| ERR-005 | Authorization Error menggunakan HTTP 403. | ☐ |
| ERR-006 | Internal Error tidak membocorkan informasi sensitif. | ☐ |

---

# 10.8 Development Readiness Checklist

Sebelum implementasi dimulai, seluruh checklist berikut harus terpenuhi.

| Checklist | Status |
|-----------|--------|
| API Design Principles selesai | ☐ |
| Endpoint Organization selesai | ☐ |
| REST Endpoint Specification selesai | ☐ |
| Request & Response Schema selesai | ☐ |
| Authentication & Authorization selesai | ☐ |
| Error Handling selesai | ☐ |
| API Convention selesai | ☐ |
| API Versioning selesai | ☐ |
| Struktur mengikuti STATE-MANAGEMENT.md | ☐ |
| Service Layer mengikuti FILE-STRUCTURE.md | ☐ |
| Endpoint mengikuti ROUTING.md | ☐ |
| Product Module mengikuti PRD.md | ☐ |

---

# 10.9 Production Readiness

API Contract dinyatakan siap digunakan apabila.

- Seluruh Endpoint telah terdokumentasi.
- Seluruh Product Module memiliki kontrak API yang jelas.
- Frontend dan Backend dapat dikembangkan secara independen.
- Seluruh Request dan Response mengikuti standar.
- Authentication dan Authorization telah ditetapkan.
- Error Handling telah distandarkan.
- API siap digunakan oleh Mock Service maupun Backend Production.
- Seluruh implementasi konsisten dengan ENGINEERING-FOUNDATION.md, FILE-STRUCTURE.md, ROUTING.md, dan STATE-MANAGEMENT.md.

---

# 10.10 Final Acceptance

API-CONTRACT.md dinyatakan **Approved** apabila.

- Seluruh Acceptance Criteria telah terpenuhi.
- Seluruh Endpoint konsisten dengan PRD.md.
- Seluruh Endpoint mengikuti ENGINEERING-FOUNDATION.md.
- Seluruh Endpoint mengikuti IMPLEMENTATION-PLAN.md.
- Seluruh Endpoint mengikuti FILE-STRUCTURE.md.
- Seluruh Endpoint mengikuti ROUTING.md.
- Seluruh Endpoint mengikuti STATE-MANAGEMENT.md.
- Seluruh Endpoint siap diimplementasikan oleh Frontend Service Layer dan Backend REST API.
- Product Owner menyetujui API-CONTRACT.md sebagai **Official API Contract Baseline** untuk seluruh Engineering Document Management System (EDMS) Rebuild.

---

# End of PART 10

API-CONTRACT.md menjadi **Official API Contract Baseline** yang mendefinisikan kontrak resmi komunikasi antara Frontend dan Backend pada Engineering Document Management System (EDMS) Rebuild.

Seluruh implementasi Service Layer, REST API, Request & Response Schema, Authentication, Authorization, Error Handling, dan API Versioning wajib mengacu pada dokumen ini agar komunikasi antar sistem tetap konsisten, terdokumentasi, scalable, mudah dipelihara, dan selaras dengan seluruh Source of Truth proyek.

# ==============================================================================

---

# PHASE 2 SOURCE OF TRUTH SYNCHRONIZATION

## Current Implementation

Kontrak API runtime saat ini diimplementasikan melalui Frontend Service Layer yang mengonsumsi Backend REST API berbasis Node.js + Express.js dan MySQL.

Historical development phase sebelumnya menggunakan Frontend Service Layer dengan Fake API, Mock JSON, IndexedDB, localStorage, Zustand, TanStack Query, React Hook Form, dan Zod. Informasi historical tersebut tetap berguna sebagai konteks migrasi, tetapi bukan runtime authority untuk flow backend-integrated saat ini.

Service Layer runtime mencakup:

- Authentication dan password reset.
- Project, Project Membership, dan Active Project resolution.
- Document create, workflow action, upload revision, archive, restore, history, dan comments.
- File storage dan preview.
- Workflow attachment.
- Notification lifecycle.
- SLA monitoring dan escalation.
- Audit Trail.
- User dan Department management.

## Production Mapping

Endpoint production wajib mempertahankan behaviour yang sama dengan Service Layer runtime:

- Permission mengikuti `ACCESS-CONTROL.md`.
- Route consumer mengikuti `ROUTING.md`.
- Payload form mengikuti `FORM-SPEC.md`.
- Status, lifecycle, revision stage, SLA, escalation, notification, archive, restore, dan audit mengikuti `BUSINESS-WORKFLOW.md`.

## Storage API Behaviour

Upload Document dan Upload Revision menyimpan file utama sebagai active/revision file. Attachment Approval B/C disimpan sebagai workflow attachment dan tidak menjadi document revision.

## Field-Level Data Contract

Field berikut menjadi kontrak data minimum untuk resource utama Data Layer.

| Resource | Required Fields |
|---|---|
| Document | `id`, `projectId`, `documentNumber`, `description`, `drawing`, `area`, `daysUntilValidation`, `workflowStatus`, `lifecycle`, `revision`, `responsibleRole`, `currentAssignee`, `activeRevisionId`, `activeFileId`, `slaStartedAt`, `slaStoppedAt`, `createdBy`, `createdAt`, `updatedAt` |
| Revision | `id`, `projectId`, `documentId`, `revision`, `revisionSequence`, `fileId`, `isActive`, `sourceStatus`, `resultStatus`, `uploadedBy`, `uploadedAt` |
| Workflow Comment | `id`, `projectId`, `documentId`, `revisionId`, `workflowAction`, `comment`, `createdBy`, `createdByUserId`, `createdByOfficialRole`, `createdAt`, `attachmentId` |
| Workflow Attachment | `attachmentId`, `commentId`, `projectId`, `documentId`, `fileId`, `originalFileName`, `mimeType`, `fileExtension`, `fileSize`, `uploadedBy`, `uploadedAt` |
| Notification | `id`, `identityKey`, `projectId`, `recipientUserId`, `recipientProjectMembershipId`, `eventType`, `title`, `message`, `priority`, `recipientRole`, `relatedResourceType`, `relatedResourceId`, `readStatus`, `readAt`, `createdAt`, `metadata` |
| Audit Trail | `id`, `identityKey`, `projectId`, `actorUserId`, `actorName`, `officialRole`, `department`, `action`, `businessEvent`, `resourceType`, `resourceId`, `detail`, `metadata`, `timestamp`, `isHidden` |
| User | `id`, `username`, `email`, `fullName`, `departmentId`, `status`, `createdAt`, `updatedAt` |
| Department | `id`, `name`, `nameKey`, `status`, `createdAt`, `updatedAt` |
| Project | `id`, `projectCode`, `projectName`, `status`, `createdAt`, `updatedAt`, `closedAt`, `closedBy` |
| Project Membership | `id`, `projectId`, `userId`, `officialRole`, `status`, `assignedBy`, `assignedAt`, `updatedAt` |

Status contract:

- `workflowStatus` hanya menggunakan `Process Review`, `Process Comment`, `Process Reject`, `Project Review`, `Project Comment`, `Project Reject`, dan `Approved`.
- `lifecycle` hanya menggunakan `Active` dan `Archived`.
- `slaStatus` hanya menggunakan `On Track`, `At Risk`, `Overdue`, dan `Final As-Built`.
- `Done` tidak boleh menjadi API value atau enum database; `Done` hanya display wording.
- Project-scoped permission pada authenticated response mengikuti Active Project Official Role, sedangkan permission global mengikuti system RBAC role pada user.

Collection endpoint tetap wajib mendukung struktur pagination, filtering, dan sorting standar pada PART 5 dan PART 8 dokumen ini.

---

# DOMAIN 5 BACKEND API BLUEPRINT

## Route Authority

Route resmi backend mengikuti `API-CONTRACT.md`.

Candidate route dari audit atau dokumen historis yang berbeda dari dokumen ini diperlakukan sebagai Historical Reference dan tidak menjadi route runtime resmi.

## Backend Endpoint Blueprint

| Endpoint | Request | Response | Validation | Permission | Transaction | Side Effect |
|---|---|---|---|---|---|---|
| `POST /api/v1/auth/login` | username, password, device metadata | auth profile, cookie set | active user, credential valid | Public | Credential read, refresh session create | Audit login |
| `POST /api/v1/auth/logout` | current session | success | valid session | Authenticated | Refresh session revoke | Audit logout |
| `POST /api/v1/auth/refresh` | refresh cookie/session | new access cookie | persistent session active, not revoked, device match | Authenticated | Token rotation | Audit refresh anomaly if failed |
| `GET /api/v1/auth/me` | current user | user profile, permissions, active project context | session valid | Authenticated | Read only | None |
| `GET /api/v1/auth/profile` | current user | user profile, permissions, active project context | session valid | Authenticated | Read only | Alias of current user profile |
| `POST /api/v1/auth/change-password` | current password, new password, confirmation | success | password policy, current password valid | Authenticated | Password update | Audit |
| `POST /api/v1/password/forgot` | username, registered email | generic response | user/email match if exists | Public | Reset token create/revoke old token | Email dispatch record, audit security event |
| `POST /api/v1/password/reset` | token, new password | success | token valid, password policy | Public | Password update, token used | Audit password reset |
| `GET /api/v1/dashboard/summary` | active project query/context | summary cards | active project membership | `dashboard.view` | Read only | None |
| `GET /api/v1/dashboard/statistics` | active project query/context | chart/statistics data | active project membership | `dashboard.view` | Read only | None |
| `GET /api/v1/dashboard/recent-activities` | pagination/filter | recent activities | active project membership | `dashboard.view` | Read only | None |
| `GET /api/v1/documents` | pagination, filter, sorting, project, search | document collection | project ownership | `document-register.view` | Read only | None |
| `POST /api/v1/documents` | document metadata, `temporaryFileId` | document, revision, file metadata | form rules, temporary file rules, active project | `document-register.create` | Create Document | Audit, notification |
| `GET /api/v1/documents/{id}` | document id | document detail | project ownership | `document-register.view` | Read only | None |
| `PATCH /api/v1/documents/{id}` | editable metadata | updated document | editable state, project ownership | `document-register.edit` | Edit Document | History, audit |
| `PATCH /api/v1/documents/{id}/archive` | archive reason optional | archived document | Approved, Active lifecycle, Active project, Admin | `document-register.archive` + Admin | Archive | History, audit |
| `PATCH /api/v1/documents/{id}/restore` | restore reason optional | restored document | Archived lifecycle, Active project, Admin | `document-register.archive` + Admin | Restore | History, audit |
| `POST /api/v1/documents/{id}/revisions` | `temporaryFileId`, `expectedWorkflowStatus`, `expectedActiveRevisionId`, optional `expectedCurrentAssigneeUserId`, optional `description`, `area`, `daysUntilValidation` | updated document and revision | Comment/Reject status, expected active revision, temporary file rules, active project, `daysUntilValidation >= 0` | `document-register.edit` | Upload Revision | History, audit, notification, SLA cycle update; metadata update uses latest Days Until Validation |
| `GET /api/v1/documents/{id}/revisions` | document id | revision collection | project ownership | `document-register.view` | Read only | None |
| `GET /api/v1/documents/{id}/history` | document id | history collection | project ownership | `document-register.view` | Read only | None |
| `GET /api/v1/documents/{id}/comments` | document id | workflow comment collection | project ownership | `document-register.view` | Read only | Comment read receipt may update only through explicit read flow if implemented |
| `PATCH /api/v1/documents/{id}/comments/read` | document id | `{ documentId, markedReadCount }` | project ownership | `document-register.view` | Mark comment read | Creates missing `comment_read_receipts` for current user only |
| `GET /api/v1/documents/{id}/view` | document id or active file | inline file response | project ownership, file metadata valid | `document-register.view` | Read only | Audit View Document |
| `GET /api/v1/documents/{id}/download` | document id or active file | attachment file response | project ownership, file metadata valid | `document-register.download` | Read only | Audit Download Document |
| `GET /api/v1/documents/{id}/revisions/{revisionId}/view` | document id, revision id | inline historical revision file response | project ownership, file metadata valid | `document-register.view` | Read only | Audit View Document with revision context |
| `GET /api/v1/documents/{id}/revisions/{revisionId}/download` | document id, revision id | attachment historical revision file response | project ownership, file metadata valid | `document-register.download` | Read only | Audit Download Document with revision context |
| `POST /api/v1/documents/{id}/approve` | `expectedWorkflowStatus`, `expectedActiveRevisionId`, optional `expectedCurrentAssigneeUserId` | updated document | Approval A status/role/current assignee/expected state rule | `approval.a` | Approval | History, audit, notification |
| `POST /api/v1/documents/{id}/approve-with-comment` | mandatory comment, optional attachment `temporaryFileId`, `expectedWorkflowStatus`, `expectedActiveRevisionId`, optional `expectedCurrentAssigneeUserId` | updated document/comment | Approval B status/role/comment/current assignee/expected state rule | `approval.b` | Approval | Comment, optional attachment, history, audit, notification |
| `POST /api/v1/documents/{id}/reject` | optional comment, optional attachment `temporaryFileId`, `expectedWorkflowStatus`, `expectedActiveRevisionId`, optional `expectedCurrentAssigneeUserId` | updated document/comment | Approval C status/role/current assignee/expected state rule | `approval.c` | Approval | Comment if provided, optional attachment, history, audit, notification |
| `POST /api/v1/documents/{id}/workflow-attachments` | `commentId`, `temporaryFileId` | workflow attachment metadata | project ownership, temporary file rules | `storage.view` or document/workflow permissions | Workflow Attachment | Permanent storage promotion, audit |
| `GET /api/v1/documents/{id}/workflow-attachments/{attachmentId}/download` | document id, attachment id | workflow attachment file response | project ownership, attachment metadata valid | `storage.view` or `document-register.view` or `document-register.download` | Read only | None |
| `GET /api/v1/notifications` | pagination/filter/project | notification collection | recipient is current user | `notifications.view` | Read only | None |
| `PATCH /api/v1/notifications/{id}/read` | notification id | updated notification | recipient ownership | `notifications.view` | Notification read | Audit optional |
| `PATCH /api/v1/notifications/read-all` | project optional | updated count | recipient ownership | `notifications.view` | Notification read all | Audit optional |
| `DELETE /api/v1/notifications` | selected notification ids | delete summary | current user ownership, non-empty ids | `notifications.view` | User Inbox bulk hard delete | Audit Trail remains system evidence |
| `DELETE /api/v1/notifications/{id}` | notification id | success | recipient ownership | `notifications.view` | User Inbox hard delete | Audit Trail remains system evidence |
| `GET /api/v1/sla` | pagination/filter/project | SLA list/summary | active project membership | `sla-monitoring.view` | Read only | None |
| `GET /api/v1/escalations` | pagination/filter/project | escalation list | active project membership | `escalation.view` | Read only | None |
| `GET /api/v1/audit-trails` | pagination/filter/project (`projectId`, `page`, `pageSize`, `search`, `action`, `actorName`, `officialRole`, `resourceType`, `fromDate`, `toDate`, `sortBy`, `direction`) | audit collection | project access | `audit-trail.view` | Read only | None |
| `PATCH /api/v1/audit-trails/{id}/hide` | audit id | success | Admin, audit visible | `audit-trail.view` + Admin | Audit soft hide | Audit hide record optional |
| `POST /api/v1/storage/temporary-uploads` | multipart `file` | `temporaryFileId` and temporary upload metadata | authenticated user, allowed file type, size limit | `storage.view` or document/workflow permissions | Temporary Upload | Temporary file write and metadata create |
| `GET /api/v1/storage` | pagination/filter/project | storage metadata collection | project access | `storage.view` | DEFERRED / NOT IMPLEMENTED in current runtime | Future Storage NAS scope |

Historical / superseded blueprint routes:

| Endpoint | Runtime Status |
|---|---|
| `POST /api/v1/auth/forgot-password` | HISTORICAL / NOT ACTIVE IN CURRENT RUNTIME |
| `POST /api/v1/auth/reset-password/validate` | HISTORICAL / NOT ACTIVE IN CURRENT RUNTIME |
| `POST /api/v1/auth/reset-password` | HISTORICAL / NOT ACTIVE IN CURRENT RUNTIME |
| `PATCH /api/v1/profile/password` | HISTORICAL / superseded by `POST /api/v1/auth/change-password` |

### Dashboard Summary Response

`GET /api/v1/dashboard/summary` mengembalikan data runtime project aktif:

- `kpiSummary`
  - `totalDocuments`
  - `processReview`
  - `processComment`
  - `processReject`
  - `projectReview`
  - `projectComment`
  - `projectReject`
  - `approved`
  - `archived`
  - `finalAsBuilt`
- `slaSummary`
- `escalationSummary`
- `currentAssigneeSummary`

### Unified Temporary Upload Contract

Seluruh file yang dipilih user tetapi masih menunggu aksi Save atau Submit wajib melewati temporary upload terlebih dahulu.

Runtime flow:

1. Frontend mengirim file ke `POST /api/v1/storage/temporary-uploads` menggunakan `multipart/form-data`.
2. Backend mengembalikan `temporaryFileId`.
3. Frontend mengirim aksi final menggunakan JSON dan `temporaryFileId`.
4. Backend memvalidasi temporary upload masih tersedia, belum expired, belum digunakan, dan dibuat oleh user yang sama.
5. Backend membuat metadata permanen, memindahkan file dari `storage/temporary` ke `storage/projects`, lalu menghapus record temporary upload dalam transaksi bisnis.

Endpoint final berikut tidak menerima raw multipart file:

| Endpoint | Request Body |
|---|---|
| `POST /api/v1/documents` | metadata document + `temporaryFileId` |
| `POST /api/v1/documents/{id}/revisions` | `temporaryFileId`, `expectedWorkflowStatus`, `expectedActiveRevisionId`, optional `expectedCurrentAssigneeUserId` |
| `POST /api/v1/documents/{id}/approve` | `expectedWorkflowStatus`, `expectedActiveRevisionId`, optional `expectedCurrentAssigneeUserId` |
| `POST /api/v1/documents/{id}/approve-with-comment` | `comment`, optional `temporaryFileId`, `expectedWorkflowStatus`, `expectedActiveRevisionId`, optional `expectedCurrentAssigneeUserId` |
| `POST /api/v1/documents/{id}/reject` | optional `comment`, optional `temporaryFileId`, `expectedWorkflowStatus`, `expectedActiveRevisionId`, optional `expectedCurrentAssigneeUserId` |
| `POST /api/v1/documents/{id}/workflow-attachments` | `commentId`, `temporaryFileId` |

Reuse `temporaryFileId`, penggunaan oleh user berbeda, file temporary yang sudah expired, atau storage temporary yang hilang wajib ditolak dan tidak boleh membuat permanent metadata.

### Canonical Storage Contract

Backend adalah satu-satunya authority untuk physical storage path. Frontend tidak mengirim dan tidak menghitung storage path.

Project identity tetap menggunakan `projects.id` untuk API identity, permission, project membership, dan foreign key database. Physical project directory menggunakan `projects.project_code`.

Canonical storage key:

```text
projects/{PROJECT_CODE}/documents/{DOCUMENT_NUMBER}/revisions/{REVISION}/{PHYSICAL_FILE_NAME}
```

Canonical revision vocabulary:

```text
IFR-Submitted
IFA-Submitted
AS-Built
```

Revision berbeda dari Workflow Status. Contoh: revision `IFR-Submitted` dapat berada pada Workflow Status `Process Review`, `Process Comment`, atau `Process Reject`.

Physical filename:

```text
{DOCUMENT_NUMBER}_{REVISION}_{SUBMIT_DATE_YYYYMMDD}_{SHORT_FILE_ID}_{SANITIZED_ORIGINAL_FILE_NAME}
```

`SUBMIT_DATE_YYYYMMDD` berasal dari timestamp backend pada saat Upload Document atau Upload Revision diproses. `SHORT_FILE_ID` berasal dari identity `stored_files.file_id`.

`stored_files.storage_key` dan `stored_files.relative_path` wajib menyimpan normalized relative path, bukan absolute path, agar kompatibel dengan local storage, NAS, dan Object Storage/R2.

User-facing download filename tetap berasal dari `stored_files.original_file_name` melalui `Content-Disposition`; physical filename tidak menjadi nama file download.

Workflow attachment bukan document revision dan disimpan terpisah:

```text
projects/{PROJECT_CODE}/documents/{DOCUMENT_NUMBER}/attachments/process-comments/{ATTACHMENT_FILE_NAME}
projects/{PROJECT_CODE}/documents/{DOCUMENT_NUMBER}/attachments/project-comments/{ATTACHMENT_FILE_NAME}
```

### Bulk Delete Notification

`DELETE /api/v1/notifications` menghapus notification milik current authenticated user berdasarkan daftar Notification ID yang dipilih.

Authentication: required.

Permission: `notifications.view`.

Request body:

```json
{
  "notificationIds": [
    "notification-id-1",
    "notification-id-2"
  ]
}
```

Validation:

- `notificationIds` wajib berupa array.
- `notificationIds` tidak boleh kosong.
- Setiap ID wajib berupa identifier sistem yang tidak kosong.
- Duplicate ID ditangani secara aman oleh backend.
- User hanya boleh menghapus notification miliknya sendiri pada Project yang dapat diakses.

Response mengikuti implementasi aktual:

```json
{
  "success": true,
  "message": "Notification Terpilih Berhasil Dihapus",
  "data": {
    "deletedCount": 2,
    "deletedIds": [
      "notification-id-1",
      "notification-id-2"
    ]
  }
}
```

Relevant error responses:

- `401` apabila unauthenticated.
- `403` apabila tidak memiliki permission `notifications.view`.
- `422` apabila payload invalid atau daftar notification kosong.
- `500` apabila terjadi internal error.

| `GET /api/v1/users` | pagination/filter/search | user collection | admin permission | `user-management.view` | Read only | None |
| `POST /api/v1/users` | user payload including immutable `username` | created user | user form, department active, unique username/email | `user-management.view` | Create user and credential | Audit |
| `PUT /api/v1/users/{id}` | editable user payload excluding username mutation | updated user | user exists, department active, username immutable | `user-management.view` | Update allowed user fields only | Audit, cache invalidation consumer side |
| `PATCH /api/v1/users/{id}/activate` | user id | updated user | user exists | `user-management.view` | User status | Audit |
| `PATCH /api/v1/users/{id}/deactivate` | user id | updated user | user exists | `user-management.view` | User status, session revocation if required | Audit |
| `GET /api/v1/departments` | pagination/filter/search | department collection | admin permission | `user-management.view` | Read only | None |
| `POST /api/v1/departments` | department payload | created department | unique normalized name | `user-management.view` | Create department | Audit |
| `PATCH /api/v1/departments/{id}` | department payload | updated department | department exists, unique name | `user-management.view` | Update department | Audit |
| `PATCH /api/v1/departments/{id}/activate` | department id | updated department | department exists | `user-management.view` | Department status | Audit |
| `PATCH /api/v1/departments/{id}/deactivate` | department id | updated department | department exists, assignment rules | `user-management.view` | Department status | Audit |
| `GET /api/v1/projects` | pagination/filter/search | project collection | admin or project access context | `user-management.view` | Read only | None |
| `POST /api/v1/projects` | project payload | created project and initial membership | unique project code, creator valid | `user-management.view` | Create project + initial membership | Audit |
| `PATCH /api/v1/projects/{id}` | project payload | updated project | project exists, not Closed if prohibited | `user-management.view` | Update project | Audit |
| `PATCH /api/v1/projects/{id}/activate` | project id | updated project | Inactive project | `user-management.view` | Project status | Audit |
| `PATCH /api/v1/projects/{id}/deactivate` | project id | updated project | Active project, no blocking rule | `user-management.view` | Project status | Audit |
| `POST /api/v1/projects/{id}/close` | confirmation payload | closed project summary | Admin, Active project, no active workflow document | Admin | Project Close | Auto archive, history, audit, suppress new close notification |
| `GET /api/v1/project-memberships` | pagination/filter/project | membership collection | project/admin access | `user-management.view` | Read only | None |
| `POST /api/v1/project-memberships` | membership payload | created membership | active user/project, valid official role, unique user/project | `user-management.view` | Create membership | Audit |
| `PATCH /api/v1/project-memberships/{id}` | membership payload | updated membership | membership exists, project not Closed | `user-management.view` | Update membership | Audit |
| `PATCH /api/v1/project-memberships/{id}/activate` | membership id | updated membership | active user/project | `user-management.view` | Membership status | Audit |
| `PATCH /api/v1/project-memberships/{id}/deactivate` | membership id | updated membership | membership exists | `user-management.view` | Membership status | Audit |
| `GET /api/v1/roles` | none | role catalog | catalog available | Reference Catalog | Read only | None |
| `GET /api/v1/permissions` | none | permission catalog | catalog available | Reference Catalog | Read only | None |
| `GET /api/v1/auth/profile` | current user | profile data | authenticated | `profile.view` | Read only | None |
| `PATCH /api/v1/profile` | profile payload | updated profile | editable profile fields | `profile.view` | Profile update | Audit |
| `POST /api/v1/auth/change-password` | current/new password | success | password policy, current password valid | `password.change` | Change Password | Revoke sessions, audit |

## Authorization Blueprint

Backend authorization follows `ACCESS-CONTROL.md`.

Permission flow:

```text
Permission Catalog
  -> Authorization Middleware
  -> Endpoint Permission Check
  -> Service Context Validation
  -> Business Operation
```

Rules:

- Permission code uses the frozen permission catalog in `ACCESS-CONTROL.md`.
- Project-scoped operation must validate Active Project, Project Membership, Official Role, and resource ownership.
- Current Assignee is not an authorization source.
- Roles and permissions endpoints are Reference Catalog / Historical Reference, not operational administration endpoints.
- Controller must not bypass authorization middleware or service-level contextual validation.

## Refresh Token API Blueprint

Refresh token behaviour:

- Refresh token is persisted in backend storage.
- Refresh session is device aware.
- Token rotation creates a new valid token and revokes the previous token in the same session family.
- Logout revokes the current refresh session.
- Force logout revokes all refresh sessions for a user or selected session family.
- Password change and password reset revoke active refresh sessions according to security policy.
- Access token is delivered through HttpOnly Cookie and is not stored in Local Storage or Session Storage.

