# MILESTONE 1B — FRONTEND ADMINISTRATION INTEGRATION

## Execution Mode

Anda sedang mengerjakan satu sprint implementasi penuh untuk proyek **Engineering Document Management System (EDMS) ReBuild**.

Milestone 1A — Backend Administration telah selesai dan endpoint utama telah melewati API smoke test serta transaction validation.

Prioritas milestone ini adalah mengganti penggunaan mock atau fake data pada seluruh fitur Administration dengan Backend Administration API yang telah tersedia.

Sebelum mengubah kode:

1. Analisis struktur repository secara menyeluruh.
2. Baca seluruh Source of Truth yang diwajibkan.
3. Analisis source code frontend yang berkaitan dengan Administration.
4. Analisis kontrak Backend Administration hasil Milestone 1A.
5. Identifikasi route, request body, response body, pagination, filter, sorting, authentication, permission, dan error contract.
6. Pertahankan UI, UX, layout, terminology, dan business behaviour yang telah disetujui.
7. Gunakan service layer sebagai satu-satunya akses data frontend.
8. Reuse Axios instance, interceptor, TanStack Query, Zustand, form schema, toast, modal, table, dan komponen yang sudah tersedia.
9. Jangan melakukan redesign.
10. Jangan melakukan refactor besar di luar scope.
11. Jangan mengubah source code backend.
12. Jangan mengubah database schema, migration, seed, atau Source of Truth.
13. Jika backend dan frontend tidak cocok secara fundamental, **STOP** dan buat Conflict Report.
14. Fokus pada integrasi end-to-end yang benar-benar dapat digunakan, bukan sekadar mengganti URL mock dengan URL backend.

---

## Context

Fondasi yang telah selesai:

- Project Foundation
- Backend Foundation
- Database Foundation
- Authentication
- Password Recovery
- Frontend Authentication Integration
- Backend Administration
- Department API
- User API
- Project API
- Project Membership API
- Authorization
- Profile API
- Active Project Context

Hasil validasi Milestone 1A:

- API smoke test: **12/12 passed**
- Transaction/API validation: **5/5 passed**
- Database schema changes: **None**
- Frontend changes: **None**
- Blocking issue: **None**

Follow-up autentikasi yang perlu divalidasi menggunakan credential seed lokal yang diketahui dan valid:

- successful login,
- refresh,
- logout,
- `/auth/me`.

---

## Objective

Integrasikan seluruh Backend Administration ke frontend hingga pengguna dapat:

- login menggunakan backend nyata,
- melihat dan mengelola User,
- melihat dan mengelola Project,
- melihat dan mengelola Project Membership,
- menggunakan Profile,
- melihat daftar project yang dapat diakses,
- memilih atau mengganti Active Project,
- dan memperoleh UI sesuai permission yang diberikan backend.

Target akhirnya adalah Administration Module berjalan end-to-end tanpa ketergantungan pada mock data untuk operasi utama.

---

## Authority and Reference Hierarchy

Gunakan hierarki berikut:

```text
1. Business Workflow dan Source of Truth
2. Database dan Backend Architecture Decisions
3. Backend Administration Contract Milestone 1A
4. Existing Frontend UI dan UX
5. Mock Data atau Fake API lama
```

Backend Administration yang telah tervalidasi menjadi kontrak teknis utama untuk integrasi.

Namun backend tidak boleh digunakan untuk membenarkan perilaku yang bertentangan dengan Source of Truth.

Mock data hanya menjadi referensi lama dan tidak boleh mengalahkan kontrak API nyata.

---

## Required Source of Truth

WAJIB membaca:

### Business

- `BUSINESS-WORKFLOW.md`
- `SYSTEM-REQUIREMENTS.md`
- `FEATURE-MAPPING.md`
- `PRD.md`

### Backend and Database

- `BACKEND-FOUNDATION.md`
- `DATABASE-SCHEMA.md`
- `DATABASE-DESIGN-DECISIONS.md`
- `STORAGE-STRATEGY.md`

### Frontend and Language

- `UI-LANGUAGE-GUIDELINES.md`
- dokumen frontend foundation, routing, state management, form, table, component, dan API contract yang berlaku di repository.

Apabila nama dokumen berbeda, cari dokumen ekuivalen yang menjadi Source of Truth resmi.

---

## Backend Reconnaissance — Read Only

Sebelum mengubah frontend, analisis backend berikut:

- Administration routes
- Authentication routes
- Controllers
- Validators
- Response helpers
- Error contract
- Permission middleware
- Department endpoints
- User endpoints
- Project endpoints
- Project Membership endpoints
- Profile endpoint
- Active Project Context endpoint
- Pagination metadata
- Search, filter, dan sorting parameters
- Cookie dan refresh-token behaviour

Tujuan analisis:

1. Memastikan frontend menggunakan endpoint yang benar.
2. Memahami bentuk request dan response aktual.
3. Memahami error code dan validation detail.
4. Memahami permission yang dibutuhkan.
5. Menghindari asumsi berdasarkan mock data lama.
6. Menentukan mapping frontend tanpa mengubah makna bisnis.

Backend hanya boleh dibaca.

---

## Backend Protection Rules

DILARANG:

- mengubah file backend,
- menambah endpoint backend,
- mengubah controller, service, repository, route, atau validator backend,
- mengubah response contract backend,
- mengubah authorization backend,
- mengubah authentication backend,
- mengubah database schema,
- mengubah migration,
- mengubah seed,
- memperbaiki bug backend secara diam-diam,
- membuat bypass frontend untuk menutupi error backend.

Jika ditemukan bug backend yang benar-benar menghalangi integrasi:

1. **STOP** pada area terdampak.
2. Jangan mengubah backend.
3. Buat Conflict Report.
4. Jelaskan bukti request, response, dan dampaknya.
5. Berikan rekomendasi patch backend terpisah.

Area frontend lain yang tidak terdampak boleh dilanjutkan apabila aman dan tidak menghasilkan integrasi palsu.

---

## Conflict Detection Protocol

Bandingkan:

```text
Source of Truth
vs
Backend Administration Contract
vs
Existing Frontend
vs
Mock/Fake API
```

### Blocking Conflict

STOP apabila ditemukan:

1. Backend tidak menyediakan data wajib yang ditetapkan Source of Truth.
2. Frontend memerlukan perubahan schema agar dapat bekerja.
3. Backend menggunakan role atau permission yang bertentangan dengan dokumen.
4. Official Role dan RBAC Role tercampur.
5. Response backend tidak cukup untuk menentukan authorization secara aman.
6. Active Project Context tidak dapat diisolasi per user.
7. Backend contract hanya dapat digunakan melalui hard-coded value.
8. Integrasi memerlukan bypass authentication atau authorization.
9. Dua Source of Truth memberikan aturan berbeda.
10. Perubahan frontend yang diperlukan akan mengubah business workflow.

Gunakan format:

```markdown
# Conflict Report

## Area
Modul atau fitur terdampak.

## Source of Truth Requirement
Aturan resmi dan dokumen terkait.

## Backend Contract
Method, endpoint, request, response, atau behaviour aktual.

## Existing Frontend Behaviour
Perilaku frontend saat ini.

## Conflict
Ketidaksesuaian spesifik.

## Impact
Dampak terhadap integrasi, keamanan, UI, atau milestone berikutnya.

## Recommended Resolution
Solusi paling aman.

## Alternative
Pilihan lain beserta trade-off.

## Required Decision
Keputusan yang dibutuhkan sebelum dilanjutkan.
```

### Non-Blocking Mismatch

Integrasi boleh dilanjutkan apabila perbedaannya hanya berupa:

- nama property yang dapat di-mapping secara aman,
- bentuk wrapper response,
- mock data yang sudah usang,
- perbedaan format tanggal,
- default value UI,
- struktur pagination yang dapat diadaptasi,
- endpoint service frontend yang belum diarahkan ke backend,
- state lokal yang perlu diselaraskan.

Catat seluruh mismatch dalam Implementation Report.

---

## Scope

### 1. Authentication Validation

Gunakan credential seed lokal yang valid dan diketahui.

Validasi end-to-end:

- Login
- `/auth/me`
- Refresh Token
- Logout
- Guest Route
- Protected Route
- Session restoration
- Unauthorized handling
- Expired access token handling
- Redirect setelah logout

Jangan hard-code token.

Jangan menyimpan access token secara tidak aman apabila arsitektur menggunakan HttpOnly cookie.

Jika credential valid belum tersedia, laporkan sebagai blocking prerequisite untuk validasi penuh, tetapi lanjutkan integrasi lain yang dapat diuji secara aman.

---

### 2. Administration Service Layer

Pastikan seluruh akses data Administration melalui service layer frontend.

Implementasikan atau sesuaikan:

- Department Service
- User Service
- Project Service
- Project Membership Service
- Profile Service
- Project Context Service

Service layer harus:

- menggunakan Axios instance yang sudah ada,
- mengikuti base URL environment,
- mengirim cookie apabila dibutuhkan,
- meneruskan query parameter secara benar,
- melakukan mapping hanya bila diperlukan,
- tidak mengandung UI state,
- tidak menggunakan fallback mock secara diam-diam.

Hapus ketergantungan runtime terhadap Fake API untuk fitur yang sudah terintegrasi.

Jangan menghapus mock infrastructure global apabila masih dipakai modul di luar Milestone 1B.

---

### 3. Department Integration

Integrasikan fitur Department apabila tersedia pada frontend resmi:

- List
- Detail
- Create
- Update
- Activate
- Deactivate
- Search
- Filter
- Sorting
- Pagination
- Loading
- Empty State
- Error State
- Validation Error
- Duplicate Error

Apabila Department hanya digunakan sebagai pilihan pada form User dan tidak memiliki halaman khusus, integrasikan sesuai kebutuhan UI yang memang ada.

Jangan membuat halaman baru tanpa dasar frontend atau Source of Truth.

---

### 4. User Management Integration

Integrasikan:

- User List
- User Detail
- Create User
- Edit User
- Activate User
- Deactivate User
- Department Assignment
- RBAC Role Assignment sesuai backend
- Search
- Filter
- Sorting
- Pagination
- Form validation
- Server validation error
- Duplicate username
- Duplicate email
- Loading state
- Empty state
- Confirmation action
- Success dan error toast

Pastikan frontend tidak pernah menampilkan:

- password hash,
- refresh token,
- internal database detail,
- raw SQL error,
- stack trace.

Jangan menggunakan `position` sebagai Official Role.

---

### 5. Project Management Integration

Integrasikan:

- Project List
- Project Detail
- Create Project
- Edit Project
- Activate atau deactivate jika didukung backend dan UI
- Close Project
- Search
- Filter
- Sorting
- Pagination
- Duplicate project code handling
- Closed project state
- Loading state
- Empty state
- Confirmation action
- Success dan error toast

Jangan mengimplementasikan Document atau Workflow pada milestone ini.

---

### 6. Project Membership Integration

Integrasikan:

- List project member
- Add member
- Edit membership
- Change Official Role
- Remove atau deactivate membership sesuai API
- Duplicate membership error
- User selection
- Official Role selection
- Active status
- Search, filter, sorting, dan pagination apabila tersedia
- Loading dan empty state
- Confirmation modal
- Success dan error toast

Official Role hanya:

- Admin
- Document Owner
- Team Process
- Team Project

Gunakan nilai backend yang sebenarnya.

Jangan membuat role lain.

Jangan menyamakan RBAC Role dengan Official Role.

---

### 7. User Profile Integration

Integrasikan Profile menggunakan backend nyata.

Pastikan frontend dapat menampilkan data yang tersedia secara resmi, seperti:

- identity user,
- username,
- email,
- department,
- RBAC role,
- permissions,
- project memberships,
- active project context,
- official role untuk active project.

Hanya tampilkan field yang benar-benar tersedia dan sah.

Jangan membuat fallback palsu dari mock data.

Pertahankan Change Password dan Logout yang sudah berjalan.

---

### 8. Active Project Context

Integrasikan:

- daftar project yang dapat diakses user,
- pemilihan active project,
- switch active project,
- penyimpanan state frontend yang sesuai,
- sinkronisasi dengan backend context,
- pemuatan ulang context saat refresh,
- official role berdasarkan project aktif,
- penolakan project yang tidak dapat diakses,
- handling project inactive atau closed.

Gunakan Zustand hanya untuk client state yang memang diperlukan.

Backend tetap menjadi authority atas validitas active project.

Jangan menganggap project yang tersimpan di browser masih valid tanpa verifikasi backend.

Jangan mencampurkan active project antar-user setelah logout/login.

---

### 9. Authorization and Navigation

Integrasikan permission backend terhadap:

- route protection,
- menu visibility,
- action button visibility,
- create action,
- edit action,
- activate/deactivate action,
- project membership management,
- profile access.

Frontend permission hanya untuk UX.

Frontend tidak menggantikan authorization backend.

Hindari hard-coded username atau email untuk menentukan hak akses.

Gunakan permission atau role context yang resmi.

Menu Administration untuk role Admin mencakup:

- User Management
- Project Management
- Project Membership

Jangan membuat menu role lain yang tidak disetujui.

---

### 10. TanStack Query Integration

Gunakan TanStack Query untuk server state.

Pastikan:

- query key konsisten,
- parameter filter menjadi bagian query key,
- mutation invalidates query yang tepat,
- tidak melakukan refetch berlebihan,
- loading dan error dapat ditampilkan,
- stale data tidak tertukar antar-project,
- project-scoped query memasukkan active project identifier bila relevan,
- logout membersihkan cache sensitif,
- switch project tidak menampilkan data project sebelumnya.

Jangan menyimpan seluruh server data di Zustand apabila TanStack Query sudah menanganinya.

---

### 11. Forms and Validation

Gunakan:

- React Hook Form
- Zod
- schema yang telah tersedia
- backend validation sebagai authority akhir

Selaraskan:

- required field,
- format email,
- username,
- project code,
- department,
- role,
- official role,
- status,
- duplicate error,
- field-level server error.

Jangan menghapus client-side validation yang masih benar.

Jangan menutupi server validation dengan pesan generik apabila field error dapat ditampilkan secara aman.

---

### 12. UI and Language

Pertahankan:

- layout,
- sidebar,
- modal,
- table,
- action placement,
- icon system,
- design token,
- responsive behaviour,
- terminology resmi.

Jangan redesign.

Seluruh toast dan pesan user-facing mengikuti `UI-LANGUAGE-GUIDELINES.md`.

Gunakan Bahasa Indonesia yang singkat dan jelas.

Contoh gaya:

- `User berhasil dibuat.`
- `Project berhasil diperbarui.`
- `Username sudah digunakan.`
- `Anda tidak memiliki akses.`
- `Project aktif berhasil diganti.`

Jangan menampilkan raw backend error.

---

## Technical Requirements

Gunakan stack resmi frontend:

- React
- Vite
- JavaScript/JSX
- Tailwind CSS
- React Router
- Axios
- TanStack Query
- Zustand
- React Hook Form
- Zod

Gunakan arrow function apabila praktis dan konsisten dengan repository.

Struktur akses data:

```text
Page / Component
       ↓
Query Hook / Mutation Hook
       ↓
Service Layer
       ↓
Axios Instance
       ↓
Backend API
```

DILARANG melakukan request Axios langsung dari komponen apabila service layer sudah menjadi standar proyek.

---

## Frontend Modification Boundaries

BOLEH mengubah file frontend yang berkaitan langsung dengan:

- Administration pages
- Administration components
- Administration services
- Query hooks
- Zustand project context
- Profile integration
- Authorization utilities
- Route guards
- Form schemas
- Administration table configuration
- Environment API configuration
- Toast/error mapping

DILARANG:

- redesign global UI,
- mengubah fitur Document,
- mengubah Workflow,
- mengubah SLA,
- mengubah Escalation,
- mengubah Notification business module,
- mengubah Audit Trail,
- mengubah source code backend,
- mengubah database,
- mengubah Source of Truth,
- menghapus mock data yang masih dibutuhkan modul lain,
- melakukan formatting massal seluruh repository.

---

## Out of Scope

JANGAN mengerjakan:

- Document Management integration
- Document Register API integration
- Upload dan Revision
- Viewer dan Download
- Workflow A/B/C
- Workflow Comment
- Workflow Attachment
- SLA
- Escalation
- Notification Center integration
- Audit Trail integration
- Cloudflare R2
- Production deployment
- UI redesign
- Backend patch tanpa persetujuan

Semua Core EDMS akan diintegrasikan pada milestone berikutnya.

---

## Implementation Workflow

### Step 1 — Repository Reconnaissance

Analisis:

- frontend routes,
- pages,
- components,
- services,
- fake API,
- mock JSON,
- TanStack Query configuration,
- Zustand stores,
- form schemas,
- auth store,
- Axios instance,
- interceptors,
- route guards,
- backend Administration contract.

Jangan mengubah kode pada tahap ini.

---

### Step 2 — Contract Mapping

Buat mapping internal:

```text
Frontend Feature
→ Existing Mock Contract
→ Backend Endpoint
→ Request Mapping
→ Response Mapping
→ Permission
→ Required UI Adjustment
```

Identifikasi blocking conflict dan non-blocking mismatch.

Jika ada blocking conflict, kirim Conflict Report.

Jika tidak ada, lanjutkan tanpa meminta konfirmasi tambahan.

---

### Step 3 — Authentication Follow-up

Siapkan atau gunakan credential seed lokal yang valid tanpa mengubah schema.

Validasi:

- successful login,
- `/auth/me`,
- refresh,
- logout.

Jangan mencatat password pada laporan atau source code.

Jika seed perlu dijalankan, gunakan mekanisme seed resmi yang sudah tersedia.

Jangan membuat akun tersembunyi atau credential hard-coded di production path.

---

### Step 4 — Service and Query Integration

Integrasikan seluruh Administration API melalui service dan query layer.

Pastikan tidak ada request langsung yang menyimpang dari pola proyek.

---

### Step 5 — UI Integration

Hubungkan:

- list,
- form,
- modal,
- table,
- search,
- filter,
- sorting,
- pagination,
- action,
- profile,
- active project,
- permission,
- navigation.

Pertahankan UI yang sudah ada.

---

### Step 6 — Validation and Testing

Lakukan minimal:

- static validation,
- frontend build,
- lint frontend apabila tersedia,
- existing test suite apabila tersedia,
- successful login test,
- refresh test,
- logout test,
- Administration API integration smoke test,
- create/update/action scenario,
- duplicate scenario,
- unauthorized scenario,
- forbidden scenario,
- active project switch,
- cache isolation,
- page refresh/session restoration,
- browser console check.

Jangan menjalankan script yang mengubah backend atau database secara tidak terkontrol.

Gunakan data testing sementara dan bersihkan setelah validasi.

---

### Step 7 — Final Review

Pastikan:

- backend tidak berubah,
- database tidak berubah,
- Source of Truth tidak berubah,
- mock tidak lagi dipakai oleh Administration runtime,
- modul lain tetap dapat memakai mock lama,
- tidak ada hard-coded token,
- tidak ada password pada source atau log,
- permission diterapkan,
- active project tidak bocor antar-user,
- build berhasil,
- Authentication tidak regression,
- UI tetap konsisten.

---

## Validation Checklist

### Authentication

- Login sukses dengan credential valid.
- Login salah menghasilkan pesan yang benar.
- `/auth/me` memuat context user.
- Refresh token berjalan.
- Logout membersihkan state dan cache.
- Protected route tidak dapat dibuka tanpa session.
- Guest route menangani user yang sudah login.
- Refresh browser tidak menghilangkan session yang masih valid.

### User Management

- List user berasal dari backend.
- Password tidak tampil.
- Create user berhasil.
- Duplicate username ditangani.
- Duplicate email ditangani.
- Edit user berhasil.
- Activate/deactivate berhasil.
- Search, filter, sorting, dan pagination bekerja.
- Form error tampil pada field yang sesuai.

### Project Management

- List project berasal dari backend.
- Create project berhasil.
- Initial membership hasil backend tertangani.
- Duplicate project code ditangani.
- Edit project berhasil.
- Close project bekerja sesuai API.
- Search, filter, sorting, dan pagination bekerja.

### Project Membership

- Member list berasal dari backend.
- Add member berhasil.
- Duplicate membership ditangani.
- Official Role memakai project membership.
- Official Role invalid tidak dapat dikirim.
- Update membership berhasil.
- Remove/deactivate membership berhasil sesuai API.
- RBAC Role tidak tercampur dengan Official Role.

### Profile and Project Context

- Profile berasal dari backend.
- Available projects sesuai membership.
- Active project dapat dipilih.
- Active project dapat diganti.
- Context bertahan sesuai mekanisme resmi.
- Project invalid ditolak.
- Official Role sesuai project aktif.
- Logout membersihkan project context.
- Login user lain tidak menerima context user sebelumnya.

### Authorization

- Menu tampil sesuai permission.
- Route terlindungi.
- Tombol aksi mengikuti permission.
- Unauthorized menghasilkan redirect atau handling yang benar.
- Forbidden menghasilkan pesan yang benar.
- Frontend tidak melakukan bypass endpoint.

### Quality

- Frontend build passed.
- Tidak ada error console signifikan.
- Tidak ada request berulang tanpa sebab.
- Tidak ada data mock bercampur dengan data API.
- Loading state tersedia.
- Empty state tersedia.
- Error state tersedia.
- Toast menggunakan Bahasa Indonesia.
- Backend diff bersih.
- Database diff bersih.
- Dokumen Source of Truth diff bersih.

---

## Deliverables

Setelah selesai, berikan laporan:

```markdown
# Milestone 1B Implementation Report

## Status
Completed / Partially Completed / Blocked

## Integrated Modules
Daftar modul yang telah terhubung ke backend.

## Authentication Validation
Hasil login, /me, refresh, logout, dan session restoration.

## API Contract Mapping
Ringkasan endpoint yang digunakan oleh setiap fitur.

## Mock Replacement
Daftar fitur Administration yang tidak lagi memakai mock runtime.

## Files Added
Daftar file baru.

## Files Modified
Daftar file frontend yang diubah.

## Backend Changes
Harus menyatakan: None.

## Database Changes
Harus menyatakan: None.

## Source of Truth Changes
Harus menyatakan: None.

## Validation Results
Command dan hasil build, lint, test, dan smoke test.

## Non-Blocking Mismatches
Perbedaan yang berhasil dimapping secara aman.

## Conflicts
Conflict Report apabila ada.

## Risks
Risiko tersisa.

## Deferred Items
Item yang sengaja ditunda karena out of scope.

## Ready for Milestone 2
Yes / No beserta alasan.
```

Laporan harus ringkas dan berorientasi pada hasil.

---

## Definition of Done

Milestone selesai apabila:

- Authentication frontend tervalidasi menggunakan backend nyata.
- User Management terhubung ke backend.
- Project Management terhubung ke backend.
- Project Membership terhubung ke backend.
- User Profile terhubung ke backend.
- Active Project Context terhubung ke backend.
- Authorization dan navigation menggunakan context backend.
- Administration tidak lagi bergantung pada mock runtime.
- UI dan UX yang disetujui tetap dipertahankan.
- Seluruh user-facing message mengikuti UI Language Guidelines.
- Frontend build berhasil.
- Tidak ada regression Authentication.
- Tidak ada perubahan backend.
- Tidak ada perubahan database schema.
- Tidak ada perubahan Source of Truth.
- Tidak ada hard-coded credential atau authorization bypass.
- Siap dilanjutkan ke **Milestone 2 — Backend Core EDMS Engine**.
