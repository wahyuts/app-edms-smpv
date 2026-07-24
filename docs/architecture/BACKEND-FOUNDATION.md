# BACKEND FOUNDATION

> **Status:** Approved Baseline (Final)\
> **Project:** Engineering Document Management System (EDMS) Rebuild\
> **Document:** BACKEND-FOUNDATION.md\
> **Version:** 1.0 Final

------------------------------------------------------------------------

# 1. Purpose

BACKEND-FOUNDATION.md adalah **Engineering Constitution** untuk seluruh
Backend EDMS.

Dokumen ini menetapkan aturan engineering yang bersifat tetap dan
menjadi acuan seluruh implementasi backend.

Dokumen ini **tidak** mendefinisikan ulang Business Workflow, Source of
Truth, Database Engineering, API Contract, maupun Access Control.

------------------------------------------------------------------------

# 2. Official Hierarchy

``` text
Business Workflow
↓
Validated Frontend
↓
Source of Truth
↓
Database Engineering
↓
BACKEND-FOUNDATION.md
↓
Backend Source Code
```

Jika terjadi konflik, urutan di atas menjadi prioritas.

------------------------------------------------------------------------

# 3. Technology Stack

  Category         Technology
  ---------------- -------------------------------
  Runtime          Node.js
  Framework        Express.js
  Database         MySQL
  Authentication   JWT
  Password Hash    bcrypt
  Token Storage    HttpOnly Cookie
  File Upload      Multer
  Storage          Backend Managed Local Storage

## Environment Convention

Frontend hanya menggunakan variabel `VITE_*`.

Backend hanya menggunakan variabel tanpa prefix `VITE_`.

Secret tidak boleh berada di frontend.

Frontend:

``` env
VITE_APP_NAME=
VITE_APP_VERSION=
VITE_APP_ENV=
VITE_API_BASE_URL=
VITE_USE_MOCK_API=
VITE_ENABLE_DEMO_RESET=
VITE_ENABLE_MOCK_EMAIL=
```

Backend:

``` env
APP_NAME=
APP_VERSION=
APP_ENV=
PORT=
MYSQL_HOST=
MYSQL_PORT=
MYSQL_DATABASE=
MYSQL_USER=
MYSQL_PASSWORD=
JWT_SECRET=
JWT_EXPIRES_IN=
REFRESH_TOKEN_EXPIRES_IN=
CORS_ALLOWED_ORIGINS=
STORAGE_PATH=
BCRYPT_ROUNDS=
```

------------------------------------------------------------------------

# 4. Backend Architecture

``` text
HTTP Request
↓
Route
↓
Middleware
↓
Controller
↓
Service
↓
Repository
↓
Database / Storage
↓
HTTP Response
```

Controller tidak mengandung business logic. Service mengoordinasikan
proses bisnis. Repository hanya menangani persistence.

------------------------------------------------------------------------

# 5. Folder Structure

``` text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   └── utils/
├── storage/
└── package.json
```

------------------------------------------------------------------------

# 6. Storage Architecture

``` text
storage/
└── projects/
    └── {project-code}/
        └── documents/
            └── {document-code}/
                ├── revisions/
                └── workflow-attachments/
```

Contoh:

``` text
storage/
└── projects/
    └── PRJ-DEMO-001/
        └── documents/
            └── DOC-000001/
                ├── revisions/
                │   ├── REV-001.pdf
                │   └── REV-002.pdf
                └── workflow-attachments/
                    ├── CMT-001.png
                    └── CMT-002.pdf
```

Rules:

-   Database hanya menyimpan metadata.
-   File fisik hanya dapat diakses melalui Backend.
-   Frontend tidak pernah mengakses storage secara langsung.

------------------------------------------------------------------------

# 7. Engineering Rules

## Layer

BE-001 Controller tidak mengakses database.

BE-002 Business Logic hanya pada Service.

BE-003 Repository hanya untuk persistence.

BE-004 Repository tidak memanggil Repository lain.

BE-005 Service boleh menggunakan banyak Repository.

BE-006 Request wajib divalidasi.

BE-007 Response mengikuti API Contract.

BE-008 Error response selalu JSON.

BE-009 Gunakan async/await.

BE-010 Callback baru tidak digunakan.

## Database

BE-011 Operasi multi-table wajib Transaction.

BE-012 Jika satu proses gagal maka seluruh transaction wajib Rollback.

BE-013 Hard Delete hanya diperbolehkan untuk Technical Entity
(Notification, Refresh Session, Password Reset Token). Business Entity
mengikuti Business Workflow.

BE-014 Timestamp disimpan UTC.

BE-015 Upload hanya melalui Storage Service.

BE-016 Revision File dan Workflow Attachment adalah entity berbeda.

BE-017 Semua file memiliki metadata.

BE-018 Database tidak menyimpan file fisik.

## Security

BE-019 Permission diperiksa di Middleware.

BE-020 Authentication menggunakan JWT.

BE-021 JWT disimpan pada HttpOnly Cookie.

BE-022 Password menggunakan bcrypt.

BE-023 RBAC mengikuti Access Control.

BE-024 Konfigurasi sensitif berasal dari Environment Variable.

BE-025 Perubahan schema hanya melalui Change Request atau persetujuan
Project Owner.

## CORS

BE-026 Production tidak boleh menggunakan origin `*`.

BE-027 Allowed Origin dipisahkan:

  Environment   Origin
  ------------- ----------------------------------
  Development   http://localhost:5173
  Staging       https://staging-edms.company.com
  Production    https://edms.company.com

BE-028 Setiap environment memiliki Database, Storage, JWT Secret, Cookie
Domain, dan Environment Variable yang terpisah.

BE-029 Karena menggunakan HttpOnly Cookie maka CORS wajib mengaktifkan
`credentials: true`.

BE-030 Allowed Methods dan Allowed Headers dibatasi sesuai kebutuhan.

BE-031 CORS menggunakan `APP_ENV` dan `CORS_ALLOWED_ORIGINS`.

## External Services

BE-032

Seluruh layanan eksternal (Email Service, Object Storage, Push Notification, Third-Party API, dan layanan sejenis) wajib diakses melalui Service Layer.

Business Logic tidak boleh berkomunikasi langsung dengan Provider eksternal.

---

BE-033

Implementasi Provider eksternal harus bersifat interchangeable.

Pergantian Provider tidak boleh mengubah Business Logic maupun Controller.

Contoh:

```text
Authentication Service
        ↓
Email Service
        ↓
Email Provider (Resend / SendGrid / Amazon SES / SMTP)
```

---

BE-034

Seluruh konfigurasi Provider eksternal wajib berasal dari Environment Variable.

API Key, Secret Key, SMTP Credential, Endpoint, dan konfigurasi sensitif lainnya tidak boleh di-hardcode di dalam source code.

------------------------------------------------------------------------

# 8. Transaction Rules

``` text
BEGIN
↓
PROCESS
↓
COMMIT
```

Jika terjadi error:

``` text
BEGIN
↓
PROCESS
↓
ERROR
↓
ROLLBACK
```

Rollback mengembalikan database ke kondisi sebelum transaction dimulai.

------------------------------------------------------------------------

# 9. API Rules

-   REST API
-   Mengikuti API Contract
-   Response konsisten
-   HTTP Status Code sesuai standar
-   Pagination sesuai API Contract
-   Direkomendasikan menggunakan `/api/v1`

Contoh sukses:

``` json
{"success":true,"message":"Success","data":{}}
```

Contoh gagal:

``` json
{"success":false,"message":"Validation Error","errors":[]}
```

------------------------------------------------------------------------

# 10. Error Handling

Status yang digunakan:

400,401,403,404,409,422,500,503,504.

Rules:

-   Semua error JSON.
-   Tidak mengembalikan HTML error.
-   Unexpected exception dicatat.
-   Backend tidak boleh membuat frontend loading tanpa kepastian.

------------------------------------------------------------------------

# 11. Logging

Minimal mencatat Login, Upload, Revision, Approval, Archive, Restore,
Notification, dan Error penting.

------------------------------------------------------------------------

# 12. Freeze Rules

Perubahan terhadap dokumen ini hanya melalui Change Request atau Project
Owner Approval.

------------------------------------------------------------------------

# 13. Backend Roadmap

1.  Backend Setup
2.  Authentication
3.  Authorization
4.  Storage Service
5.  Upload Document
6.  Upload Revision
7.  Viewer & Download
8.  Workflow API
9.  Notification API
10. Audit API
11. Integration
12. Final Validation

------------------------------------------------------------------------

# 14. Engineering Principles

-   Single Responsibility
-   Separation of Concerns
-   Maintainability
-   Scalability
-   Security First
-   Source of Truth Driven Development
-   No Silent Modification

------------------------------------------------------------------------

# 15. Final Statement

Dokumen ini merupakan baseline resmi Backend Engineering dan menjadi
acuan tetap selama implementasi backend EDMS.
