# Backend Prompt Engineering Strategy
## EDMS Rebuild Project

Dokumen ini merangkum bagaimana proses penyusunan prompt backend dilakukan selama pengembangan EDMS Rebuild. Tujuan utamanya adalah agar seluruh implementasi backend yang dikerjakan Codex selalu konsisten terhadap Source of Truth proyek, tidak keluar dari scope, dan tetap mengikuti arsitektur yang telah disepakati.

---

# 1. Filosofi Pembuatan Prompt

Selama pengembangan backend, **Codex tidak pernah diberikan instruksi yang bersifat "buatkan fitur login" atau "buatkan CRUD user" secara umum.**

Sebaliknya, setiap prompt selalu dibuat menggunakan pola berikut:

```text
Business Requirement
        ↓
Source of Truth
        ↓
Architecture Constraint
        ↓
Implementation Scope
        ↓
Validation
        ↓
Definition of Done
```

Dengan pendekatan tersebut, Codex tidak hanya membuat kode yang "berjalan", tetapi juga menjaga konsistensi terhadap arsitektur proyek.

---

# 2. Dokumen Referensi (Source of Truth)

Setiap prompt backend selalu mengacu pada dokumen resmi proyek.

Urutan prioritas referensi adalah sebagai berikut.

## Level 1 — Business Source of Truth

Dokumen utama yang menjelaskan bagaimana sistem harus bekerja.

- BUSINESS-WORKFLOW.md
- ENGINEERING-FOUNDATION.md
- SYSTEM-REQUIREMENTS.md
- FEATURE-MAPPING.md

Dokumen ini menjadi acuan utama untuk:

- Business Rules
- Workflow
- Actor
- Role
- Status
- Module
- Feature

---

## Level 2 — Product Source of Truth

Menjelaskan implementasi produk secara lebih detail.

- PRD.md

Digunakan untuk:

- Functional Requirement
- User Flow
- API Behavior
- Screen Behavior
- Feature Scope

---

## Level 3 — Database Source of Truth

Digunakan untuk memastikan backend tidak membuat schema sendiri.

- DATABASE-SCHEMA.md
- DATABASE-DESIGN-DECISIONS.md

Digunakan sebagai referensi:

- Table
- Relation
- Constraint
- Foreign Key
- Naming Convention
- Storage Strategy

---

## Level 4 — Backend Source of Truth

Digunakan sebagai referensi implementasi backend.

- BACKEND-FOUNDATION.md

Digunakan untuk memastikan:

- Folder Structure
- Layer Architecture
- Middleware Pattern
- Repository Pattern
- Service Pattern
- Error Handling
- Storage Management
- Security Pattern

---

# 3. Arsitektur Backend yang Selalu Dipertahankan

Seluruh prompt backend selalu menjaga struktur berikut.

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

Tidak ada prompt yang boleh melewati layer.

Misalnya:

❌ Controller langsung query database.

❌ Service langsung membaca request HTTP.

❌ Repository mengakses req/res.

---

# 4. Prinsip Scope Isolation

Setiap Phase memiliki scope yang sangat jelas.

Contoh:

## Phase 2.1

Hanya:

- Login
- Logout
- Refresh
- /me

Tidak boleh:

- Forgot Password
- RBAC
- User CRUD

---

## Phase 2.2

Hanya:

- Forgot Password
- Reset Password

Tidak boleh:

- Change Password
- User Management

---

## Phase 2.3

Hanya:

- Authorization
- RBAC

Tidak boleh:

- CRUD Role
- CRUD Permission
- CRUD User

---

## Phase 2.3B

Hanya:

- Change Password

Tidak boleh:

- Admin Reset Password
- User CRUD

---

Dengan cara ini setiap phase menjadi independen dan mudah divalidasi.

---

# 5. Struktur Prompt yang Selalu Digunakan

Hampir seluruh prompt backend memiliki struktur yang sama.

## A. Context

Menjelaskan kondisi project saat ini.

Misalnya:

- Phase sebelumnya selesai.
- Authentication sudah tersedia.
- Database sudah ada.
- Schema tidak boleh berubah.

---

## B. Objective

Menjelaskan tujuan phase.

Contoh:

```text
Build Change Password feature.
```

---

## C. Scope

Menjelaskan apa yang harus dibuat.

Misalnya:

- Endpoint
- Middleware
- Validation
- Repository
- Service

---

## D. Prohibited Scope

Bagian yang selalu ada.

Berisi hal-hal yang **tidak boleh** dikerjakan Codex.

Contoh:

- Jangan membuat CRUD.
- Jangan mengubah schema.
- Jangan membuat role baru.
- Jangan membuat permission baru.
- Jangan membuat frontend.

Bagian ini sangat penting untuk mencegah Codex melakukan over-engineering.

---

## E. Technical Requirement

Berisi aturan implementasi.

Misalnya:

- bcrypt
- JWT
- HttpOnly Cookie
- Transaction
- Repository Pattern

---

## F. Validation

Bagian yang selalu diwajibkan.

Misalnya:

- node --check
- Login Test
- Refresh Test
- RBAC Test
- Transaction Test
- Regression Test

---

## G. Deliverables

Menjelaskan hasil yang harus tersedia.

Misalnya:

- File baru
- File diperbarui
- Endpoint
- Middleware

---

## H. Definition of Done

Menjadi checklist akhir.

Phase dianggap selesai apabila seluruh poin lulus.

---

# 6. Cara Mengendalikan Codex

Selama backend dibuat, prompt tidak pernah menggunakan kalimat seperti:

```text
Implement login.
```

Tetapi selalu:

```text
Implement login.

Do not modify schema.

Do not create new tables.

Do not create new role.

Do not create permission seed.

Reuse existing validator.

Reuse existing transaction pattern.

Keep repository pattern.

Keep middleware pattern.
```

Semakin banyak constraint yang diberikan, semakin stabil hasil Codex.

---

# 7. Validation Setelah Implementasi

Setelah Codex selesai bekerja, selalu dilakukan review menggunakan format laporan yang sama.

Contohnya:

```text
Phase selesai.

File dibuat:
...

File diperbarui:
...

Implementasi:
...

Validasi:
...

Konfirmasi:
...
```

Kemudian dilakukan Architecture Review sebelum phase dinyatakan selesai.

---

# 8. Gate Review

Setiap phase harus melewati gate review.

Contoh:

```text
Authentication
──────────────

Login
✅

Logout
✅

Refresh
✅

/me
✅

RBAC
✅

Status

PASSED
```

Phase berikutnya tidak boleh dimulai sebelum gate review selesai.

---

# 9. Strategi Roadmap

Roadmap backend selalu dikerjakan secara bertahap.

```text
Foundation
        ↓
Authentication
        ↓
Authorization
        ↓
Master Data
        ↓
Document
        ↓
Workflow
        ↓
SLA
        ↓
Notification
        ↓
Dashboard
        ↓
Audit Trail
        ↓
Integration
        ↓
Production
```

Setiap phase menjadi fondasi phase berikutnya.

---

# 10. Prinsip yang Selalu Dijaga

Selama seluruh backend development, beberapa prinsip berikut tidak pernah berubah.

## Single Source of Truth

Backend tidak boleh membuat business rule sendiri.

Semua aturan harus berasal dari Source of Truth.

---

## Architecture First

Prompt selalu menjaga arsitektur lebih dahulu daripada implementasi.

---

## Scope First

Setiap phase hanya mengerjakan satu domain.

---

## No Over Engineering

Codex dilarang membuat fitur di luar scope.

---

## Regression Safety

Setiap phase wajib memastikan feature lama tetap berjalan.

---

## Validation Driven Development

Setiap implementasi harus memiliki validation checklist.

---

## Definition of Done

Phase baru dianggap selesai setelah seluruh validation lulus.

---

# 11. Hasil Pendekatan Ini

Dengan strategi prompt di atas, backend berhasil dibangun secara bertahap hingga kondisi berikut:

✅ Backend Foundation

✅ Authentication Foundation

✅ Password Recovery

✅ Resend Integration

✅ Authorization & RBAC

✅ Change Password

Seluruh phase tersebut selesai tanpa perubahan schema, tanpa perubahan business workflow, dan tetap konsisten terhadap Source of Truth proyek.

---

# 12. Kesimpulan

Pendekatan prompt backend pada proyek EDMS Rebuild menggunakan prinsip **Architecture-Driven Prompt Engineering**, yaitu setiap prompt disusun berdasarkan Source of Truth, memiliki scope yang sempit, constraint yang jelas, validation yang lengkap, serta Definition of Done yang terukur.

Dengan metode ini, Codex berfungsi sebagai implementor teknis, sedangkan seluruh keputusan bisnis, arsitektur, dan batas implementasi tetap dikendalikan oleh dokumentasi proyek dan proses review.