# MILESTONE 1B — REVISION 2
# REMOVE OFFICIAL ROLE FROM CREATE USER

## Execution Mode

Anda sedang mengerjakan revisi terfokus untuk **Milestone 1B — Frontend Administration Integration** pada proyek **Engineering Document Management System (EDMS) ReBuild**.

Revisi ini bertujuan memperbaiki domain model User Management agar sesuai dengan Business Workflow resmi.

Revisi hanya boleh mengubah frontend.

Backend tidak boleh diubah.

Database tidak boleh diubah.

Source of Truth tidak boleh diubah.

Jangan memperluas pekerjaan ke modul lain.

---

# Context

Milestone 1A dan Milestone 1B telah selesai.

Saat ini form **Create User** masih meminta user memilih Official Role.

Hal tersebut bertentangan dengan Business Workflow resmi EDMS.

Official Role bukan merupakan atribut User.

Official Role merupakan atribut **Project Membership**.

Akibatnya terdapat duplikasi konsep:

User

↓

Role

↓

Project Membership

Padahal Official Role seharusnya hanya hidup pada Project Membership.

---

# Objective

Perbaiki seluruh flow User Creation agar:

- Create User hanya membuat identitas global user.
- Create User tidak menentukan Official Role.
- Create User tidak membuat Project Membership.
- Create User tidak memberikan akses project.
- Official Role hanya ditentukan ketika Administrator melakukan Assign User to Project.
- My Profile tetap mampu menampilkan Official Role berdasarkan Active Project.

---

# Official Business Rules

## Rule 1

Create User hanya membuat identitas user.

Field yang diperbolehkan:

- Full Name
- Username
- Email
- Department
- Password
- Confirm Password

Field berikut tidak boleh ada:

- Official Role

---

## Rule 2

Official Role hanya berada pada:

Project Membership.

Bukan User.

Bukan Profile.

Bukan Authentication.

---

## Rule 3

Official Role hanya boleh dipilih pada halaman:

Assign User to Project.

Contoh:

Project

↓

User

↓

Official Role

↓

Membership Status

---

## Rule 4

User yang baru dibuat:

- belum memiliki Project Membership,
- belum mempunyai Active Project,
- belum mempunyai Official Role.

---

## Rule 5

User baru tetap boleh login apabila account aktif.

Namun sampai Administrator melakukan Assign User to Project:

Dashboard harus menampilkan:

No Project Access.

---

## Rule 6

My Profile selalu menampilkan Official Role berdasarkan Active Project.

Bukan berdasarkan data User.

---

## Official Role Behaviour

### Case 1

User belum mempunyai Project Membership.

My Profile harus menampilkan:

Official Role

Tidak Ada Official Role Pada Active Project

Active Project

Tidak Ada Project Access

---

### Case 2

User menjadi Team Process pada Active Project.

My Profile harus menampilkan:

Official Role

Team Process

---

### Case 3

User mengganti Active Project.

Misal:

Project A

↓

Team Process

Project B

↓

Document Owner

Maka My Profile harus otomatis berubah mengikuti Active Project.

Logout tidak diperlukan.

---

# Authority Hierarchy

Gunakan urutan berikut.

1. Business Rule pada prompt revisi ini.
2. Source of Truth resmi.
3. Backend Authentication Contract.
4. Backend Project Membership Contract.
5. Existing Frontend.
6. Mock Data lama.

---

# Required Reconnaissance

Analisis terlebih dahulu:

- Create User Modal
- Edit User Modal
- User Form Schema
- User Validation
- User Service
- User Query
- User Mutation
- Assign User to Project
- Project Membership Service
- Authentication Store
- Profile Page
- Active Project Context
- AppShell
- Backend User API
- Backend Project Membership API

Jangan mengubah kode sebelum memahami seluruh alur.

---

# Domain Model Clarification

Gunakan model berikut sebagai acuan resmi.

User

↓

Identity

↓

Department

↓

Status

↓

Authentication

Project Membership

↓

Project

↓

Official Role

↓

Membership Status

↓

Active Project Context

Jangan mencampurkan kedua konsep tersebut.

---

# Backend Reconnaissance (Read Only)

Analisis backend berikut:

- User API
- User Validator
- User Controller
- User Response Contract
- Project Membership API
- Official Role Validation
- Profile API
- /auth/me

Pastikan backend memang tidak mengharuskan Official Role ketika Create User.

Jika backend masih mewajibkan Official Role:

STOP.

Jangan mengubah backend.

Buat Conflict Report.

---

# Backend Protection Rules

DILARANG:

- mengubah backend,
- mengubah schema,
- mengubah migration,
- mengubah seed,
- mengubah endpoint,
- mengubah authentication,
- mengubah Project Membership API,
- menambah endpoint baru.

Jika backend masih meminta Official Role pada Create User:

STOP.

Laporkan Conflict Report.

Jangan membuat workaround frontend.

---

# Conflict Detection

STOP apabila:

- Backend masih mewajibkan Official Role saat Create User.
- Backend tidak dapat membuat User tanpa Project Membership.
- Backend mencampurkan User Role dan Official Role.
- Profile tidak dapat membaca Official Role dari Active Project.
- Source of Truth bertentangan dengan implementasi backend.

Gunakan format Conflict Report yang sama seperti Revision sebelumnya.

# Scope

## 1. Create User Form

Perbaiki form **Create User** agar hanya digunakan untuk membuat identitas global user.

Field yang diperbolehkan:

- Full Name
- Username
- Email
- Department
- Password
- Confirm Password

Field berikut WAJIB dihapus dari form:

- Official Role

Field tersebut tidak boleh:

- tampil di UI,
- dikirim ke backend,
- disimpan di local state,
- masuk ke validation schema,
- masuk ke request payload.

---

## 2. Create User Payload

Pastikan request Create User hanya mengirim field yang memang menjadi atribut User.

Payload tidak boleh lagi berisi:

```text
officialRole
official_role
role
roleId (Official Role)
projectRole
```

Apabila backend menggunakan RBAC internal seperti `role_id`, gunakan hanya sesuai kontrak backend.

Jangan menggunakan Official Role sebagai pengganti RBAC Role.

---

## 3. Edit User

Periksa form Edit User.

Apabila terdapat field Official Role pada Edit User:

- hapus field tersebut,
- hapus validasinya,
- hapus mapping request,
- hapus binding state.

Edit User hanya mengubah data User.

Bukan Project Membership.

---

## 4. Assign User to Project

Official Role hanya boleh dipilih pada halaman:

Assign User to Project.

Pastikan halaman tersebut tetap menggunakan pilihan resmi:

- Admin
- Document Owner
- Team Process
- Team Project

Official Role dipilih pada saat membuat atau mengubah Project Membership.

Jangan memindahkan logika ini ke User Management.

---

## 5. Project Membership

Pastikan seluruh Official Role tetap berasal dari:

Project Membership.

Bukan dari:

- User
- Authentication
- Profile
- Local Storage

Official Role harus mengikuti Active Project.

---

## 6. My Profile

My Profile harus membaca Official Role berdasarkan Active Project.

### Case 1

User belum memiliki Project Membership.

Tampilkan:

```text
Official Role
Tidak Ada Official Role Pada Active Project

Active Project
Tidak Ada Project Access
```

---

### Case 2

User menjadi Team Process.

My Profile:

```text
Official Role
Team Process
```

---

### Case 3

User berpindah Active Project.

Project A

↓

Team Process

Project B

↓

Document Owner

Maka My Profile harus ikut berubah.

Logout tidak diperlukan.

Jangan melakukan refresh manual.

---

## 7. Dashboard Behaviour

User baru:

- berhasil dibuat,
- belum mempunyai Project Membership,
- belum mempunyai Active Project.

Maka:

Login

↓

Dashboard

↓

No Project Access

Ini merupakan behaviour yang benar.

---

## 8. Authentication

Revisi ini tidak boleh mengubah:

- Login
- Logout
- Refresh Token
- Guest Route
- Protected Route
- Gateway Flow

Flow Login Gateway hasil Revision 1 harus tetap berjalan.

---

## 9. Active Project Context

Revisi ini tidak boleh mengubah:

- Active Project Selector
- Active Membership
- Accessible Projects
- Project Context Store

Perubahan hanya boleh berkaitan dengan:

Official Role pada proses Create User.

---

# UI Protection Rules

Pertahankan:

- Layout
- Modal
- Button
- Theme
- Sidebar
- Header
- Footer
- User List
- Project Membership UI

DILARANG:

- redesign modal,
- memindahkan posisi field lain tanpa alasan,
- mengubah terminology,
- mengubah halaman Profile,
- mengubah Dashboard,
- mengubah Gateway.

Perubahan UI hanya sebatas:

Menghapus field Official Role dari Create User dan Edit User apabila ada.

---

# Technical Requirements

Gunakan arsitektur frontend yang sudah berlaku:

```text
Page
    ↓
React Hook Form
    ↓
Zod Schema
    ↓
Service Layer
    ↓
Axios
    ↓
Backend API
```

Pastikan:

- schema diperbarui,
- default values diperbarui,
- request payload diperbarui,
- response mapping tetap berjalan,
- query invalidation tetap berjalan.

Jangan membuat duplicate state.

---

# Validation Scenarios

## Scenario 1

Buka Create User.

Expected:

Field Official Role sudah tidak ada.

---

## Scenario 2

Create User berhasil.

Expected:

Request payload tidak mengandung Official Role.

---

## Scenario 3

User baru login.

Belum mempunyai Project Membership.

Expected:

Gateway tidak muncul.

Dashboard menampilkan:

No Project Access.

---

## Scenario 4

Administrator membuka Assign User to Project.

Expected:

Dropdown Official Role masih tersedia.

Pilihan:

- Admin
- Document Owner
- Team Process
- Team Project

---

## Scenario 5

Administrator Assign User ke Project.

Official Role:

Team Process

Expected:

Project Membership berhasil dibuat.

---

## Scenario 6

User login kembali.

Active Project:

Project A

Official Role:

Team Process

Expected:

My Profile menampilkan:

```text
Official Role

Team Process
```

---

## Scenario 7

Administrator mengubah Official Role.

Team Process

↓

Document Owner

Expected:

Setelah context diperbarui,

My Profile ikut berubah.

---

## Scenario 8

User berpindah Active Project.

Project A

↓

Team Process

Project B

↓

Admin

Expected:

My Profile berubah menjadi:

```text
Official Role

Admin
```

---

## Scenario 9

Build Validation

Jalankan:

```bash
npm.cmd run build --workspace=apps/frontend
```

Expected:

PASS.

---

## Scenario 10

Lint Validation

Jalankan:

```bash
npm.cmd run lint --workspace=apps/frontend
```

Expected:

PASS.

---

## Scenario 11

Backend Validation

Pastikan:

- Backend tidak berubah.
- Endpoint tidak berubah.
- Database schema tidak berubah.
- Migration tidak berubah.
- Seed tidak berubah.

---

## Scenario 12

Profile Validation

Verifikasi tiga kondisi berikut:

### User tanpa Project

```text
Official Role

Tidak Ada Official Role Pada Active Project
```

### User dengan satu Project

```text
Official Role

Team Process
```

### User berganti Active Project

```text
Official Role berubah mengikuti Active Project.
```

---

# Final Review Checklist

Pastikan:

- Official Role sudah hilang dari Create User.
- Official Role sudah hilang dari Edit User jika sebelumnya ada.
- Assign User to Project tetap menjadi satu-satunya tempat memilih Official Role.
- Create User tidak lagi mengirim Official Role.
- User baru belum mempunyai Project Membership.
- User baru belum mempunyai Active Project.
- User baru login menuju Dashboard No Project Access.
- My Profile membaca Official Role dari Active Project.
- Pergantian Active Project mengubah Official Role di My Profile.
- Gateway Login hasil Revision 1 tetap bekerja.
- Tidak ada perubahan backend.
- Tidak ada perubahan database.
- Tidak ada perubahan Source of Truth.
- Build PASS.
- Lint PASS.

---

# Deliverables

Setelah selesai, berikan laporan berikut.

```markdown
# Milestone 1B Revision 2 Validation Report

## Status
Completed / Partially Completed / Blocked

## Root Cause
Mengapa Official Role tidak boleh berada pada Create User.

## Business Rule Applied
Ringkasan perubahan domain model.

## Files Modified
Daftar file frontend yang diubah.

## Backend Changes
None.

## Database Changes
None.

## Source of Truth Changes
None.

## UI Changes
Ringkasan perubahan tampilan.

## Payload Changes
Perubahan request Create User.

## Validation Results
Build, lint, dan scenario test.

## My Profile Validation
Hasil validasi Case 1, Case 2, dan Case 3.

## Conflicts
Conflict Report apabila ada.

## Risks
Risiko tersisa.

## Ready for Next Revision
Yes / No beserta alasan.
```

---

# Definition of Done

Revisi dianggap selesai apabila:

- Create User tidak lagi memiliki field Official Role.
- Edit User tidak lagi memiliki field Official Role apabila sebelumnya ada.
- Official Role hanya dapat dipilih melalui Assign User to Project.
- User baru tidak otomatis memiliki Project Membership.
- User baru tidak otomatis memiliki Active Project.
- User baru login menampilkan Dashboard dengan **No Project Access** apabila belum menjadi anggota project.
- My Profile selalu menampilkan Official Role berdasarkan **Active Project**.
- Jika tidak ada Active Project, My Profile menampilkan:

```text
Official Role
Tidak Ada Official Role Pada Active Project

Active Project
Tidak Ada Project Access
```

- Jika Active Project berubah, Official Role pada My Profile ikut berubah tanpa logout.
- Gateway Login hasil Revision 1 tetap berfungsi.
- Build frontend lulus.
- Lint frontend lulus.
- Backend tidak berubah.
- Database tidak berubah.
- Source of Truth tidak berubah.
- Revisi siap ditutup dan dapat dilanjutkan ke revisi berikutnya atau ke Milestone berikutnya.