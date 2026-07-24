# EDMS Rebuild Project — Conversation Context Summary

Dokumen ini merupakan ringkasan komprehensif dari percakapan sebelumnya dan digunakan sebagai konteks awal apabila melanjutkan diskusi di chat baru. Seluruh poin di bawah merupakan keputusan resmi atau hasil diskusi yang telah disepakati.

---

# 1. Tujuan Project

Project yang sedang dikerjakan adalah **rebuild total Engineering Document Management System (EDMS)** menggunakan arsitektur baru.

Tujuan rebuild adalah:

- mempertahankan business workflow yang sudah disepakati,
- membangun ulang frontend dan backend dengan arsitektur yang lebih bersih,
- memisahkan business logic dengan implementasi,
- mempermudah maintenance jangka panjang,
- mempersiapkan sistem menuju production.

---

# 2. Source of Truth Project

Seluruh implementasi wajib mengacu pada dokumen berikut.

## Business Layer

- BUSINESS-WORKFLOW.md
- ENGINEERING-FOUNDATION.md
- SYSTEM-REQUIREMENTS.md
- FEATURE-MAPPING.md

## Product Layer

- PRD.md

## Database Layer

- DATABASE-SCHEMA.md
- DATABASE-DESIGN-DECISIONS.md

## Backend Layer

- BACKEND-FOUNDATION.md

Business Workflow merupakan acuan tertinggi.

Backend maupun frontend tidak boleh membuat business rule sendiri.

---

# 3. Tech Stack Final

## Frontend

- React
- Vite
- JavaScript (bukan TypeScript)
- TailwindCSS
- React Router
- Axios
- Zustand
- TanStack Query
- React Hook Form
- Zod

## Backend

- Node.js
- Express.js
- CommonJS
- mysql2/promise
- JWT
- bcrypt
- HttpOnly Cookie
- Multer

## Database

MySQL

Current Development Database

```text
edms_smpv_dev
```

---

# 4. Backend Architecture

Backend menggunakan arsitektur berlapis.

```text
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
```

Seluruh implementasi backend wajib mengikuti pola tersebut.

---

# 5. Storage Architecture

Backend menggunakan local storage yang dikelola backend.

```text
storage/

└── projects/
    └── {project-code}/
        └── documents/
            └── {document-code}/
                ├── revisions/
                └── workflow-attachments/
```

Frontend tidak mengakses storage secara langsung.

---

# 6. Monorepo Structure

```text
APP-EDMS-SMPV/

apps/
    frontend/
    backend/

database/

docs/
```

---

# 7. Official Role

Role resmi sistem hanya:

- Admin
- Document Owner
- Team Process
- Team Project

Tidak boleh menambahkan role lain seperti:

- Super Admin
- Engineering Reviewer
- Project Reviewer
- Document Controller

---

# 8. Progress Backend

## Phase 0

✅ COMPLETE

- Foundation
- Documentation
- Environment
- Database Foundation

---

## Phase 1

✅ COMPLETE

- Backend Foundation
- Express
- Repository Pattern
- Service Pattern
- Middleware
- Logger
- Error Handler
- Storage Manager

---

## Phase 2

### Phase 2.1

✅ COMPLETE

Authentication

- Login
- Logout
- Refresh
- JWT
- HttpOnly Cookie
- /me

---

### Phase 2.2

✅ COMPLETE

Password Recovery

- Forgot Password
- Reset Password

---

### Phase 2.2C

✅ COMPLETE

Resend Email Integration

---

### Phase 2.3

✅ COMPLETE

Authorization & RBAC

- Role Middleware
- Permission Middleware
- Authorization Repository
- Authorization Service
- Permission Context
- 401 / 403

---

### Phase 2.3B

✅ COMPLETE

Change Password

- Current Password Validation
- Password Policy
- Password Hash Update
- Transaction
- Refresh Session Revocation
- Cookie Clearing
- Password Changed Validation

Semua endpoint telah diuji menggunakan Thunder Client dan berjalan dengan baik.

---

# 9. Kondisi Backend Saat Ini

Backend telah berhasil:

- terkoneksi ke MySQL,
- login berhasil,
- refresh token berhasil,
- logout berhasil,
- endpoint `/me` berhasil,
- role berhasil dimuat,
- permission berhasil dimuat,
- JWT berjalan normal,
- HttpOnly Cookie berjalan normal.

Authentication backend dianggap siap digunakan frontend.

---

# 10. Strategi Prompt Backend

Selama pembangunan backend digunakan pendekatan **Architecture-Driven Prompt Engineering**.

Karakteristik prompt:

- selalu berdasarkan Source of Truth,
- memiliki scope sempit,
- memiliki constraint yang jelas,
- memiliki validation,
- memiliki Definition of Done,
- menghindari over-engineering.

Prompt backend tidak pernah dibuat secara umum seperti "buat login", tetapi selalu memuat:

- Context
- Objective
- Scope
- Prohibited Scope
- Technical Requirement
- Validation
- Deliverables
- Definition of Done

Pendekatan ini berhasil menjaga konsistensi seluruh backend.

---

# 11. Roadmap Backend

## Phase 0

✅ Complete

## Phase 1

✅ Complete

## Phase 2

Authentication & Authorization

- 2.1 ✅
- 2.2 ✅
- 2.2C ✅
- 2.3 ✅
- 2.3B ✅
- 2.4 🚧 Ready to Start
- 2.5 Pending

Seluruh phase setelah 2.5 belum dimulai.

---

# 12. Phase Berikutnya

Phase berikutnya adalah:

## Phase 2.4 — Frontend Authentication Integration

Status:

```text
READY TO START
```

Namun **belum boleh dibuat prompt implementasinya**, karena masih akan didiskusikan terlebih dahulu.

---

# 13. Topik Diskusi Saat Ini

Fokus diskusi sekarang adalah **bagaimana mengintegrasikan frontend yang saat ini masih menggunakan Fake API + IndexedDB dengan backend authentication yang sudah selesai**.

Belum ada keputusan final mengenai strategi migrasinya.

Beberapa hal yang masih menjadi bahan diskusi:

- bagaimana mengganti login frontend dari Fake API ke REST API,
- bagaimana menangani session setelah menggunakan HttpOnly Cookie,
- bagaimana hubungan backend authentication dengan data IndexedDB,
- batas migrasi antara Fake API dan REST API.

Keputusan mengenai hal tersebut akan dibuat sebelum menyusun prompt Phase 2.4.

---

# 14. Frontend Saat Ini

Frontend sudah merupakan aplikasi yang berjalan penuh menggunakan:

- Fake API
- IndexedDB

Seluruh business data saat ini masih berada di frontend.

Backend belum digunakan oleh frontend.

---

# 15. Rencana Deployment

Muncul ide baru untuk membuat **environment staging** sebelum memulai Phase 2.4.

Tujuannya:

- menguji backend dan frontend secara publik,
- memperoleh browser dengan IndexedDB yang bersih,
- melakukan pengujian authentication tanpa mengganggu data development lokal.

Deployment belum dilakukan.

Masih berupa rencana.

---

# 16. Rekomendasi Deployment

Rekomendasi yang muncul dalam diskusi:

Repository

- GitHub (Private)

Deployment

- Railway

Karena Railway mendukung:

- React
- Express
- MySQL
- Persistent Volume

Alternatif:

- Vercel (Frontend)
- Railway (Backend)

Namun Railway penuh dianggap lebih sederhana untuk tahap staging.

Belum ada keputusan final.

---

# 17. Hal yang Sengaja Diabaikan

Dalam percakapan sebelumnya sempat terkirim gambar mengenai arsitektur **Multi Project**.

Pengguna kemudian mengklarifikasi bahwa gambar tersebut **salah kirim**.

Keputusan resmi:

- gambar dianggap tidak pernah dikirim,
- seluruh analisis berdasarkan gambar tersebut dibatalkan,
- tidak digunakan sebagai referensi project.

---

# 18. Preferensi Pengguna

Beberapa preferensi penting yang harus dipertahankan selama diskusi selanjutnya:

- lebih suka diskusi desain terlebih dahulu sebelum membuat prompt Codex,
- tidak ingin Codex langsung melakukan implementasi tanpa arah arsitektur yang jelas,
- menghindari over-engineering,
- mengutamakan kestabilan arsitektur dibanding kecepatan implementasi,
- seluruh implementasi harus tetap mengikuti Source of Truth,
- setiap phase harus selesai dan tervalidasi sebelum lanjut ke phase berikutnya.

---

# 19. Status Terakhir

Status resmi project saat ini adalah:

```text
Backend Foundation
████████████████████ 100%

Authentication
████████████████████ 100%

Authorization
████████████████████ 100%

Change Password
████████████████████ 100%

Frontend Authentication Integration
READY TO START
(Belum dikerjakan)

Deployment Staging
Masih tahap diskusi

Roadmap
Sudah disusun

Prompt Phase 2.4
BELUM dibuat
Menunggu keputusan arsitektur hasil diskusi.
```

---

# 20. Catatan Penting untuk Chat Berikutnya

Saat melanjutkan percakapan:

- anggap seluruh informasi di atas sebagai konteks yang sudah diketahui,
- jangan mengulang pembahasan backend yang sudah selesai,
- jangan membuat prompt Phase 2.4 terlebih dahulu,
- fokus utama diskusi adalah menentukan strategi integrasi frontend authentication dan rencana deployment staging yang paling tepat sebelum implementasi dimulai.