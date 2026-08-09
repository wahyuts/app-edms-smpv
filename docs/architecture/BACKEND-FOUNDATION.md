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
  File Upload      Busboy Streaming Upload
  Storage          Backend Managed Local Storage / Cloudflare R2

Historical Note:

- `Multer` adalah konsep upload lama pada fase awal backend.
- Runtime saat ini menggunakan Busboy-based streaming upload agar penggunaan memory lebih terkendali saat file besar diproses.

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
MYSQL_CONNECTION_LIMIT=
UPLOAD_MAX_FILE_SIZE_BYTES=
UPLOAD_TEMPORARY_TTL_HOURS=
STORAGE_DRIVER=
R2_ACCOUNT_ID=
R2_BUCKET_NAME=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=
R2_REGION=
R2_PUBLIC_BASE_URL=
SLA_NOTIFICATION_SCHEDULER_ENABLED=
SLA_NOTIFICATION_SCHEDULER_INTERVAL_MS=
SLA_NOTIFICATION_BATCH_SIZE=
SLA_NOTIFICATION_JOB_TOKEN=
TEMPORARY_UPLOAD_CLEANUP_SCHEDULER_ENABLED=
TEMPORARY_UPLOAD_CLEANUP_INTERVAL_MS=
TEMPORARY_UPLOAD_CLEANUP_BATCH_SIZE=
```

Runtime env notes:

- `APP_ENV` menerima `development`, `test`, `staging`, atau `production`.
- `MYSQL_CONNECTION_LIMIT` bersifat optional dan default backend adalah `10`.
- `UPLOAD_MAX_FILE_SIZE_BYTES` bersifat optional dan default backend adalah `25 * 1024 * 1024` bytes.
- Railway development saat ini dapat meng-override `UPLOAD_MAX_FILE_SIZE_BYTES` menjadi `100 MB` agar selaras dengan batas upload yang ditampilkan frontend.
- `UPLOAD_TEMPORARY_TTL_HOURS` bersifat optional dan default backend adalah `24` jam.
- `STORAGE_DRIVER` menerima `local` atau `r2`.
- Env `R2_*` wajib tersedia apabila `STORAGE_DRIVER=r2`.
- Scheduler SLA Notification dan Temporary Upload Cleanup dikendalikan melalui env masing-masing dan tidak mengubah Business Workflow.

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

Current canonical physical storage uses business-readable identifiers:

```text
storage/projects/{PROJECT_CODE}/documents/{DOCUMENT_NUMBER}/revisions/{REVISION}/{PHYSICAL_FILE_NAME}
storage/projects/{PROJECT_CODE}/documents/{DOCUMENT_NUMBER}/attachments/process-comments/{ATTACHMENT_FILE_NAME}
storage/projects/{PROJECT_CODE}/documents/{DOCUMENT_NUMBER}/attachments/project-comments/{ATTACHMENT_FILE_NAME}
```

`PROJECT_CODE`, `DOCUMENT_NUMBER`, and canonical revision labels (`IFR-Submitted`, `IFA-Submitted`, `AS-Built`) are used only for physical storage readability. Database relationships continue to use internal ids.

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

# 13A. Unified Temporary Upload Pipeline

Backend menggunakan temporary upload sebagai satu-satunya handoff file untuk aksi user yang masih menunggu Save atau Submit.

Pipeline resmi:

1. File dipilih user dan diunggah ke `POST /api/v1/storage/temporary-uploads`.
2. Backend membuat metadata `temporary_uploads` dan menyimpan file pada storage temporary.
3. Endpoint bisnis menerima `temporaryFileId`, bukan raw multipart file.
4. Service layer memvalidasi ownership user, expiry, single-use, dan keberadaan physical temporary file.
5. Dalam transaksi bisnis, backend membuat metadata permanen, memindahkan file ke storage project, dan menghapus record temporary upload.

Endpoint bisnis yang memakai pipeline ini:

- Create Document.
- Upload Revision.
- Approval B attachment.
- Approval C attachment.
- Workflow Comment Attachment.

Cancel atau abandoned upload tidak membuat resource permanen. Cleanup temporary dilakukan hanya terhadap record/file temporary yang expired, orphan, atau jelas merupakan artifact validation.

------------------------------------------------------------------------

# 13A.1 Canonical Storage Path

Backend wajib membentuk permanent storage key, bukan frontend.

Rules:

- `projects.id` tetap menjadi internal database/API identity.
- `projects.project_code` menjadi physical project directory.
- Document folder menggunakan `document_number`.
- Revision folder menggunakan canonical revision label: `IFR-Submitted`, `IFA-Submitted`, `AS-Built`.
- Revision berbeda dari Workflow Status.
- `stored_files.storage_key` dan `relative_path` menyimpan relative path portable.
- Download memakai `original_file_name`, bukan physical filename.

Canonical document revision key:

```text
projects/{PROJECT_CODE}/documents/{DOCUMENT_NUMBER}/revisions/{REVISION}/{DOCUMENT_NUMBER}_{REVISION}_{SUBMIT_DATE_YYYYMMDD}_{SHORT_FILE_ID}_{SANITIZED_ORIGINAL_FILE_NAME}
```

Workflow attachment key:

```text
projects/{PROJECT_CODE}/documents/{DOCUMENT_NUMBER}/attachments/process-comments/{ATTACHMENT_FILE_NAME}
projects/{PROJECT_CODE}/documents/{DOCUMENT_NUMBER}/attachments/project-comments/{ATTACHMENT_FILE_NAME}
```

------------------------------------------------------------------------

# 13B. Project-Scoped Authorization

Backend membedakan system RBAC role dan Active Project Official Role.

Resolution:

- `users.role_id` tetap menjadi sumber permission global.
- `project_memberships.official_role` pada Active Project menjadi sumber permission project-scoped.
- Authentication payload mengembalikan permission efektif untuk Active Project saat ini.
- Project switch wajib melakukan refresh auth/profile agar frontend guard membaca permission efektif terbaru.

Project-scoped route tetap harus melakukan service-level validation terhadap active membership, document project relation, temporary upload ownership, dan workflow responsible role.

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
