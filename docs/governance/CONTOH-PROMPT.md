PHASE 2.1 — Authentication Foundation
Context
Project ini adalah Engineering Document Management System (EDMS) Rebuild.
Status project saat ini:
Phase 0 — Project Foundation
✅ COMPLETED

Phase 1 — Backend Foundation
✅ COMPLETED

========================================
BACKEND FOUNDATION COMPLETE
========================================
Backend telah memiliki foundation berikut:
Express.js
MySQL Connection Pool
JWT Configuration
bcrypt
Cookie Parser
Storage Foundation
Environment Validation
Logger
Error Handler
Response Helper
Graceful Startup & Shutdown
Health Check
Seluruh implementasi WAJIB mengikuti Source of Truth:
BUSINESS-WORKFLOW.md
ENGINEERING-FOUNDATION.md
SYSTEM-REQUIREMENTS.md
FEATURE-MAPPING.md
PRD.md
DATABASE-SCHEMA.md
DATABASE-DESIGN-DECISIONS.md
BACKEND-FOUNDATION.md
Dilarang mengubah Database Schema maupun Business Workflow.
Objective
Membangun Authentication Foundation yang mencakup:
Login
Logout
Refresh Token
Current User (/me)
JWT Access Token
Refresh Token
HttpOnly Cookie
Authentication Middleware
Phase ini BELUM mencakup:
Forgot Password
Reset Password
Email Service
RBAC
Permission Middleware
User CRUD
Role CRUD
Frontend Integration
Authentication Flow
Login
    │
    ▼
Validate Credential
    │
    ▼
Verify Password (bcrypt)
    │
    ▼
Generate Access Token
    │
    ▼
Generate Refresh Token
    │
    ▼
Save Refresh Session
    │
    ▼
Set HttpOnly Cookie
    │
    ▼
Authenticated
Folder Structure
Gunakan struktur berikut.
src/
│
├── config/
│   └── jwt.js
│
├── constants/
│   └── auth.constants.js
│
├── controllers/
│   └── auth.controller.js
│
├── middlewares/
│   └── authenticate.js
│
├── repositories/
│   └── auth.repository.js
│
├── routes/
│   └── auth.routes.js
│
├── services/
│   └── auth.service.js
│
├── utils/
│   └── token.js
│
└── validators/
    └── auth.validator.js
Jangan membuat struktur tambahan yang tidak diperlukan.
API Endpoint
Login
POST /api/v1/auth/login
Request:
{
  "username": "admin",
  "password": "password"
}
Logout
POST /api/v1/auth/logout
Logout current session.
Refresh Token
POST /api/v1/auth/refresh
Menggunakan Refresh Token dari HttpOnly Cookie.
Menghasilkan Access Token baru.
Current User
GET /api/v1/auth/me
Mengembalikan user yang sedang login.
Password hash tidak boleh ikut dikirim.
Login Rules
Gunakan tabel dan kolom sesuai DATABASE-SCHEMA.md.
Flow login:
Cari User
    │
    ▼
User Ada?
    │
    ├── Tidak
    │      ▼
    │     401
    │
    ▼
User Active?
    │
    ├── Tidak
    │      ▼
    │     401
    │
    ▼
Verify Password (bcrypt.compare)
    │
    ├── Gagal
    │      ▼
    │     401
    │
    ▼
Generate Access Token
    │
    ▼
Generate Refresh Token
    │
    ▼
Save Refresh Session
    │
    ▼
Set HttpOnly Cookie
    │
    ▼
Return User
JWT Configuration
Gunakan environment berikut.
JWT_SECRET
JWT_EXPIRES_IN
REFRESH_TOKEN_EXPIRES_IN
Rules:
Algorithm: HS256
Jangan hardcode secret.
Jangan menggunakan fallback secret.
Cookie Configuration
Gunakan HttpOnly Cookie.
Minimal:
httpOnly : true
sameSite : lax
secure   : berdasarkan APP_ENV
path      : /
Refresh Session
Gunakan tabel resmi pada DATABASE-SCHEMA.md.
Rules:
Jangan membuat tabel baru.
Simpan refresh session.
Simpan expiry.
Revoke session lama jika memang merupakan business rule resmi.
Jangan mengubah schema.
Authentication Middleware
Buat middleware:
authenticate.js
Tugas middleware:
Membaca Access Token.
Verify JWT.
Mengambil user terbaru dari database.
Memastikan user masih aktif.
Inject:
req.user
Jika gagal:
401 Unauthorized
Logout
Logout harus:
Revoke refresh session.
Clear HttpOnly Cookie.
Return success response.
Refresh Token
Flow:
Read Refresh Cookie
        │
        ▼
Verify Refresh Token
        │
        ▼
Validate Refresh Session
        │
        ▼
Generate New Access Token
        │
        ▼
Update Cookie
        │
        ▼
Success
Response Format
Success
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {},
    "role": {}
  }
}
Password hash tidak boleh ikut dikirim.
Error
{
  "success": false,
  "message": "Invalid credentials"
}
Semua response harus menggunakan JSON.
Security Rules
WAJIB:
Gunakan bcrypt.compare().
Gunakan jwt.sign().
Gunakan jwt.verify().
HttpOnly Cookie.
Password hash tidak pernah dikirim.
Password plaintext tidak pernah disimpan.
JWT tidak pernah dicatat pada logger.
Refresh Token tidak pernah dicatat pada logger.
Error Handling
Kondisi	HTTP
Username / Password salah	401
User inactive	401
Access Token invalid	401
Refresh Token invalid	401
User tidak ditemukan	404
Unexpected Error	500

Semua response menggunakan format JSON standar project.
Validation
Lakukan pengujian berikut.
Syntax Validation
node --check src/config/jwt.js
node --check src/constants/auth.constants.js
node --check src/controllers/auth.controller.js
node --check src/middlewares/authenticate.js
node --check src/repositories/auth.repository.js
node --check src/routes/auth.routes.js
node --check src/services/auth.service.js
node --check src/utils/token.js
node --check src/validators/auth.validator.js
Functional Validation
Login Success
Expected:
HTTP 200
Cookie terbentuk
Wrong Password
Expected:
401
Unknown Username
Expected:
401
Inactive User
Expected:
401
/me tanpa Login
Expected:
401
/me setelah Login
Expected:
200
Refresh Token
Expected:
200
Access Token baru berhasil dibuat.
Logout
Expected:
200
Cookie dihapus.
Refresh setelah Logout
Expected:
401
Password Hash
Pastikan password hash tidak pernah muncul pada response.
Logger
Pastikan logger tidak pernah mencatat:
Password
JWT
Refresh Token
Deliverables
Implementasikan:
Authentication Repository
Authentication Service
Authentication Controller
Authentication Route
Authentication Validator
Authentication Middleware
JWT Utility
Login API
Logout API
Refresh API
Current User API
Prohibited Scope
Jangan membuat:
Forgot Password
Reset Password
Email Service
RBAC
Permission
User CRUD
Role CRUD
Workflow
Upload API
Download API
Notification
Escalation
Audit Trail
Frontend Integration
Database Schema Modification
Definition of Done
Phase 2.1 dinyatakan selesai apabila:
Login berhasil.
Logout berhasil.
Refresh Token berhasil.
/me berhasil.
JWT berjalan dengan benar.
Refresh Session berjalan dengan benar.
HttpOnly Cookie aktif.
Authentication Middleware selesai.
Password hash aman.
Seluruh validation lulus.
Tidak ada perubahan schema database.
Final Report
Setelah selesai laporkan dengan format berikut:
Phase 2.1 selesai.

File yang dibuat:
- ...

Implementasi:
- Login
- Logout
- Refresh Token
- Current User
- Authentication Middleware
- JWT Utility
- Refresh Session

Validasi:
- node --check
- Login Success
- Wrong Password
- Unknown Username
- Inactive User
- /me
- Refresh
- Logout
- Logger Validation

Konfirmasi:
- Tidak ada perubahan schema.
- Tidak ada RBAC.
- Tidak ada Forgot Password.
- Tidak ada Reset Password.
- Tidak ada Frontend Integration.

Ready for Phase 2.2 — Password Recov