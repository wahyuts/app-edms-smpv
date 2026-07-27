# MILESTONE 1B — REVISION 1
# ACTIVE PROJECT LOGIN GATEWAY FLOW

## Execution Mode

Anda sedang mengerjakan revisi terfokus untuk **Milestone 1B — Frontend Administration Integration** pada proyek **Engineering Document Management System (EDMS) ReBuild**.

Revisi ini hanya memperbaiki alur navigasi setelah login berdasarkan jumlah project aktif yang dapat diakses user.

Jangan memperluas pekerjaan ke modul lain.

Sebelum mengubah kode:

1. Analisis alur authentication frontend yang berjalan saat ini.
2. Analisis route untuk Login, Active Project Gateway, Dashboard, dan Protected Route.
3. Analisis `auth.store`, `auth.service`, route guard, dan `AppShell`.
4. Analisis response aktual dari `/auth/me` atau endpoint context yang memuat:
   - `accessibleProjects`,
   - `activeProject`,
   - `activeMembership`.
5. Pastikan keputusan navigasi dibuat dari data backend nyata, bukan mock atau hard-coded value.
6. Pertahankan desain halaman Login, Active Project Gateway, Dashboard, dan No Project Access yang sudah tersedia.
7. Jangan mengubah backend.
8. Jangan mengubah database, migration, seed, atau Source of Truth.
9. Jangan melakukan redesign atau refactor besar.
10. Jika data backend tidak cukup untuk menerapkan business rule ini, **STOP** dan buat Conflict Report.

---

## Context

Milestone 1B telah mengintegrasikan frontend Administration dengan backend.

Hasil yang sudah tersedia:

- User Management menggunakan backend API.
- Department Management menggunakan backend API.
- Project Management menggunakan backend API.
- Project Membership menggunakan backend API.
- Active Project Context menggunakan auth context/backend.
- `auth.store` menyimpan `accessibleProjects` dan `activeMembership`.
- TanStack Query cache dibersihkan saat logout.
- Frontend build dan lint telah lulus.
- Backend tidak diubah pada Milestone 1B.

Namun, alur setelah login belum mengikuti business rule resmi Active Project Gateway.

Saat ini ditemukan perilaku yang tidak tepat:

- user yang mempunyai minimal satu project aktif dapat langsung masuk Dashboard, atau
- Gateway dan No Project Access belum ditentukan secara konsisten dari jumlah project yang dapat diakses.

Revisi ini harus memperbaiki masalah tersebut.

---

## Objective

Implementasikan alur navigasi resmi setelah login:

### Kondisi A — User memiliki minimal satu Accessible Active Project

```text
Login berhasil
        ↓
Muat authentication context
        ↓
accessibleProjects.length > 0
        ↓
Tampilkan Active Project Gateway
        ↓
User wajib memilih project
        ↓
Set Active Project melalui mekanisme backend resmi
        ↓
Refresh/sinkronkan authentication context
        ↓
Masuk ke Dashboard
```

User tidak boleh langsung masuk Dashboard sebelum memilih project melalui Gateway.

### Kondisi B — User tidak memiliki Accessible Active Project

```text
Login berhasil
        ↓
Muat authentication context
        ↓
accessibleProjects.length === 0
        ↓
Langsung masuk Dashboard
        ↓
Tampilkan No Project Access
```

User dengan nol project tidak boleh diarahkan ke Active Project Gateway.

---

## Official Business Rules

Gunakan aturan berikut sebagai keputusan final untuk revisi ini.

### Rule 1 — Gateway wajib untuk user yang memiliki project

Jika user memiliki minimal satu project aktif yang dapat diakses:

- user harus diarahkan ke Active Project Gateway setelah login,
- Gateway tetap harus ditampilkan walaupun user hanya memiliki satu project,
- project tidak boleh dipilih otomatis,
- user harus melakukan aksi eksplisit memilih project,
- setelah pilihan berhasil disimpan oleh backend, user diarahkan ke Dashboard.

### Rule 2 — Zero Project langsung Dashboard

Jika user tidak memiliki project aktif yang dapat diakses:

- user tidak melewati Gateway,
- user langsung diarahkan ke Dashboard,
- Dashboard menampilkan state `No Project Access`,
- header menampilkan tidak ada project aktif,
- fitur yang membutuhkan project context tidak boleh menampilkan data palsu.

### Rule 3 — Active project lama tidak melewati Gateway setelah login baru

Pada login baru:

- frontend tidak boleh langsung menggunakan active project lama dari browser untuk melewati Gateway,
- project context dari user sebelumnya harus sudah dibersihkan saat logout,
- login user lain tidak boleh mewarisi project context sebelumnya,
- keputusan Gateway harus berdasarkan context user yang baru login.

### Rule 4 — Browser refresh setelah project dipilih

Setelah user memilih project melalui Gateway:

- refresh halaman tidak boleh memaksa Gateway muncul kembali apabila backend masih memiliki active project yang valid,
- Dashboard dapat langsung dimuat jika active project backend masih valid,
- jika active project sudah tidak valid, inactive, closed, atau membership tidak lagi aktif, frontend harus kembali menentukan flow yang aman berdasarkan context terbaru.

### Rule 5 — Manual navigation protection

User tidak boleh melewati Gateway dengan mengetik URL Dashboard secara manual apabila:

```text
accessibleProjects.length > 0
AND
activeProject belum dipilih atau belum valid
```

Route guard harus mengarahkan user kembali ke Active Project Gateway.

### Rule 6 — Gateway tidak boleh diakses user tanpa project

Jika:

```text
accessibleProjects.length === 0
```

dan user mencoba membuka route Gateway secara manual, arahkan ke Dashboard dengan state `No Project Access`.

---

## Authority Hierarchy

Gunakan hierarki berikut:

```text
1. Business Rule dalam prompt revisi ini
2. Source of Truth proyek
3. Backend Authentication dan Project Context Contract
4. Existing Frontend Architecture
5. Mock Data lama
```

Mock data tidak boleh menjadi dasar keputusan navigasi.

---

## Required Reconnaissance

Sebelum implementasi, baca dan petakan file yang berkaitan dengan:

- Login page
- Login submit handler
- Authentication service
- Authentication store
- Axios interceptor
- Session restoration
- Guest route
- Protected route
- Root route configuration
- Active Project Gateway page
- Active Project selector
- Project service
- Project context service
- Dashboard page
- AppShell
- No Project Access state
- Logout handler
- TanStack Query client/cache cleanup

Buat mapping internal:

```text
Login Success
→ Auth Context Load
→ accessibleProjects Evaluation
→ activeProject Evaluation
→ Destination Route
```

Jangan mengubah kode sebelum memahami alur aktual.

---

## Backend Reconnaissance — Read Only

Analisis endpoint dan response backend yang berkaitan dengan:

- login,
- `/auth/me`,
- profile alias apabila digunakan,
- project context,
- select active project,
- logout,
- refresh token.

Pastikan diketahui secara pasti:

- property untuk accessible projects,
- property untuk active project,
- property untuk active membership,
- endpoint memilih active project,
- response setelah active project dipilih,
- behaviour active project setelah refresh session.

Backend hanya boleh dibaca.

---

## Backend Protection Rules

DILARANG:

- mengubah file backend,
- menambah endpoint backend,
- mengubah authentication controller,
- mengubah project-context controller,
- mengubah service atau repository backend,
- mengubah response contract backend,
- mengubah middleware backend,
- mengubah database schema,
- mengubah migration,
- mengubah seed,
- membuat bypass frontend untuk menutupi kekurangan backend.

Jika backend tidak menyediakan data atau operasi yang diperlukan:

1. STOP pada area terdampak.
2. Jangan mengubah backend.
3. Buat Conflict Report.
4. Sertakan endpoint, request, response, dan dampaknya.
5. Berikan rekomendasi patch backend terpisah.

---

## Conflict Detection Protocol

STOP apabila ditemukan salah satu kondisi berikut:

1. `/auth/me` tidak menyediakan daftar project yang dapat diakses user.
2. Frontend tidak dapat membedakan nol project dengan project belum selesai dimuat.
3. Backend tidak menyediakan mekanisme memilih active project.
4. Backend menyatakan active project valid tetapi membership user tidak aktif.
5. Active project hanya dapat ditentukan melalui hard-coded project ID.
6. Route guard harus melewati authorization agar flow bekerja.
7. Implementasi memerlukan perubahan schema.
8. Business rule di Source of Truth bertentangan dengan prompt revisi ini.
9. Active project context tidak dapat diisolasi antar-user.

Gunakan format:

```markdown
# Conflict Report

## Area
Area yang terdampak.

## Expected Business Behaviour
Perilaku resmi yang seharusnya terjadi.

## Existing Backend Contract
Endpoint dan response aktual.

## Existing Frontend Behaviour
Perilaku frontend saat ini.

## Conflict
Ketidaksesuaian spesifik.

## Impact
Dampak terhadap login, project context, authorization, atau keamanan data.

## Recommended Resolution
Solusi yang direkomendasikan.

## Required Decision
Keputusan yang diperlukan sebelum implementasi dilanjutkan.
```

---

## Scope

### 1. Login Success Routing

Perbaiki login success handler agar tidak langsung mengarahkan semua user ke Dashboard.

Setelah login berhasil:

1. Muat authentication context dari backend.
2. Tunggu sampai context benar-benar selesai dimuat.
3. Jangan mengambil keputusan ketika data masih `undefined` atau loading.
4. Evaluasi jumlah `accessibleProjects`.
5. Terapkan flow berikut:

```javascript
if (accessibleProjects.length > 0) {
  navigate("/select-project");
} else {
  navigate("/dashboard");
}
```

Contoh di atas hanya menjelaskan business behaviour.

Sesuaikan nama route dan struktur implementasi dengan repository aktual.

Jangan menggunakan timeout, delay buatan, atau hard-coded redirect.

---

### 2. Active Project Gateway

Pastikan Gateway:

- menampilkan seluruh accessible active project milik user,
- tidak memakai mock data,
- tetap tampil jika hanya ada satu project,
- memiliki selection yang jelas,
- tidak memilih project otomatis,
- menonaktifkan tombol lanjut jika belum ada pilihan,
- memanggil backend untuk menetapkan active project,
- menunggu response sukses,
- menyinkronkan ulang auth context,
- baru kemudian mengarahkan ke Dashboard.

Jika pemilihan gagal:

- user tetap berada di Gateway,
- tampilkan toast error Bahasa Indonesia,
- jangan menganggap project sudah aktif,
- jangan mengarahkan ke Dashboard.

---

### 3. Protected Route Decision

Perbaiki route guard agar mengenali tiga keadaan berbeda.

#### State A — Authentication masih dimuat

```text
auth loading
```

Tampilkan loading state yang sudah tersedia.

Jangan redirect sebelum proses selesai.

#### State B — User memiliki project tetapi belum memilih active project

```text
authenticated
accessibleProjects.length > 0
activeProject tidak valid atau belum dipilih
```

Arahkan ke Active Project Gateway.

#### State C — User tidak memiliki project

```text
authenticated
accessibleProjects.length === 0
```

Izinkan masuk Dashboard.

Dashboard akan menampilkan `No Project Access`.

#### State D — User memiliki active project valid

```text
authenticated
activeProject valid
activeMembership valid
```

Izinkan masuk Dashboard dan route project-scoped lainnya.

---

### 4. Gateway Route Guard

Tambahkan atau sesuaikan guard Gateway:

```text
Jika belum login
→ Login

Jika accessibleProjects.length === 0
→ Dashboard No Project Access

Jika user baru login dan belum memilih project
→ Tetap di Gateway

Jika active project sudah valid dari session backend
→ Dashboard
```

Namun, pastikan flow login baru tetap mengikuti Rule 1.

Jangan membuat redirect loop antara Gateway dan Dashboard.

---

### 5. Dashboard No Project Access

Untuk user tanpa project:

- Dashboard harus tetap dapat dibuka.
- Tampilkan komponen `No Project Access` yang sudah tersedia.
- Jangan menampilkan data mock.
- Jangan menampilkan active project palsu.
- Header harus menampilkan kondisi tidak ada project aktif.
- Official Role boleh kosong atau menggunakan representasi resmi yang sudah ada.
- Aksi yang membutuhkan project context harus tidak tersedia atau tidak aktif sesuai desain yang berlaku.

Jangan redesign tampilan.

---

### 6. AppShell and Header State

Pastikan AppShell/Header membaca context yang benar.

#### Dengan active project valid

Tampilkan:

- active project,
- project code apabila tersedia,
- official role berdasarkan active membership.

#### Tanpa project

Tampilkan:

- `No Active Project`,
- `No Project Access`,
- role kosong atau representasi resmi yang sudah disetujui.

Jangan menampilkan project terakhir dari local state apabila backend tidak menganggapnya valid.

---

### 7. Session Restoration

Saat browser refresh:

1. Panggil authentication context backend.
2. Tunggu response selesai.
3. Jika active project masih valid, izinkan masuk Dashboard.
4. Jika user memiliki project tetapi active project tidak valid, arahkan ke Gateway.
5. Jika user tidak memiliki project, arahkan atau izinkan Dashboard No Project Access.
6. Jangan membuat flicker redirect berulang.
7. Jangan menggunakan data auth lama sebelum context terbaru selesai dimuat.

---

### 8. Logout Cleanup

Pastikan logout membersihkan:

- authenticated user,
- accessible projects,
- active project,
- active membership,
- project-related Zustand state,
- TanStack Query cache sensitif,
- local/session storage terkait project jika memang digunakan.

Setelah logout:

```text
Login user lain
→ Tidak boleh menerima project context user sebelumnya
```

---

## UI Protection Rules

Pertahankan tampilan yang sudah ada untuk:

- Login page,
- Active Project Gateway,
- Dashboard,
- No Project Access,
- Header,
- Sidebar,
- Footer.

DILARANG:

- redesign,
- mengubah warna global,
- mengubah layout global,
- mengganti terminology tanpa dasar,
- membuat halaman Gateway baru jika halaman yang benar sudah tersedia,
- mengubah fitur Administration lainnya,
- mengubah Document Register,
- mengubah SLA,
- mengubah Escalation,
- mengubah Notification,
- mengubah Audit Trail.

Perubahan UI hanya boleh dilakukan jika diperlukan untuk memperbaiki state atau behaviour pada flow ini.

---

## Technical Requirements

Gunakan stack dan pola yang sudah berlaku:

- React
- React Router
- Axios
- TanStack Query
- Zustand
- JavaScript/JSX
- arrow function jika praktis

Pertahankan struktur:

```text
Page / Route Guard
        ↓
Auth Store / Query Hook
        ↓
Service Layer
        ↓
Axios Instance
        ↓
Backend
```

Jangan melakukan request langsung dari komponen jika service layer sudah tersedia.

Jangan menduplikasi authentication context di banyak store tanpa alasan.

Tetapkan satu source of truth frontend yang jelas untuk:

- authenticated user,
- accessible projects,
- active project,
- active membership,
- auth initialization/loading state.

---

## Out of Scope

JANGAN mengerjakan:

- Backend patch
- Database seed correction
- User Management revision
- Department revision
- Project CRUD revision
- Project Membership CRUD revision
- Profile update endpoint
- Document Management
- Workflow
- SLA
- Escalation
- Notification
- Audit Trail
- Storage
- UI redesign
- Deployment
- Refactor besar authentication architecture

---

## Validation Scenarios

Lakukan validasi minimal berikut.

### Scenario 1 — User dengan satu project

```text
User login
accessibleProjects.length = 1
```

Expected:

- diarahkan ke Gateway,
- project tidak dipilih otomatis,
- user memilih project,
- backend menyimpan active project,
- user masuk Dashboard,
- Header menampilkan project dan official role yang benar.

---

### Scenario 2 — User dengan beberapa project

```text
User login
accessibleProjects.length > 1
```

Expected:

- diarahkan ke Gateway,
- seluruh project aktif yang dapat diakses tampil,
- user dapat memilih salah satu,
- project yang dipilih menjadi active project,
- user masuk Dashboard menggunakan context yang benar.

---

### Scenario 3 — User tanpa project

```text
User login
accessibleProjects.length = 0
```

Expected:

- tidak diarahkan ke Gateway,
- langsung masuk Dashboard,
- Dashboard menampilkan No Project Access,
- Header menampilkan No Active Project,
- tidak ada active membership palsu.

---

### Scenario 4 — Manual Dashboard access sebelum memilih project

```text
authenticated
accessibleProjects.length > 0
activeProject belum dipilih
user membuka /dashboard
```

Expected:

- diarahkan ke Gateway.

---

### Scenario 5 — Manual Gateway access tanpa project

```text
authenticated
accessibleProjects.length = 0
user membuka route Gateway
```

Expected:

- diarahkan ke Dashboard No Project Access.

---

### Scenario 6 — Refresh setelah memilih project

```text
active project valid
browser refresh
```

Expected:

- session dipulihkan,
- tidak kembali ke Gateway,
- Dashboard tetap menggunakan project yang benar.

---

### Scenario 7 — Active project tidak lagi valid

```text
active project inactive/closed
atau
membership inactive
```

Expected:

- context lama tidak digunakan,
- jika masih memiliki accessible project lain, arahkan ke Gateway,
- jika tidak memiliki project, Dashboard No Project Access.

---

### Scenario 8 — Logout dan login user lain

Expected:

- project context user pertama bersih,
- user kedua tidak melihat project user pertama,
- routing ditentukan ulang dari accessible projects user kedua.

---

### Scenario 9 — Select project gagal

Expected:

- user tetap di Gateway,
- active project tidak berubah secara palsu,
- Dashboard tidak dibuka,
- toast error tampil dalam Bahasa Indonesia.

---

### Scenario 10 — Build and static quality

Jalankan:

```bash
npm.cmd run build --workspace=apps/frontend
npm.cmd run lint --workspace=apps/frontend
```

Keduanya harus lulus.

Periksa juga:

- browser console,
- redirect loop,
- repeated API request,
- stale project state,
- mock runtime reference pada flow terkait.

---

## Validation Rules

Gunakan backend dan data database nyata apabila tersedia.

Apabila credential valid masih belum tersedia:

- lakukan static validation,
- lakukan unit-level atau controlled state validation jika infrastructure tersedia,
- jangan mengklaim browser end-to-end test berhasil,
- laporkan dengan jujur skenario yang belum dapat diuji.

Jangan membuat credential hard-coded.

Jangan mengubah seed tanpa instruksi terpisah.

---

## Final Review Checklist

Pastikan:

- user dengan minimal satu project selalu melewati Gateway setelah login baru,
- satu project tidak dipilih otomatis,
- user tanpa project langsung masuk Dashboard,
- No Project Access tampil dengan benar,
- manual Dashboard access tidak dapat melewati Gateway,
- manual Gateway access user tanpa project diarahkan ke Dashboard,
- session restoration bekerja,
- logout membersihkan seluruh project context,
- tidak ada redirect loop,
- tidak ada data project lintas user,
- tidak ada penggunaan mock pada flow ini,
- frontend build lulus,
- frontend lint lulus,
- backend tidak berubah,
- database tidak berubah,
- Source of Truth tidak berubah.

---

## Deliverables

Setelah selesai, berikan laporan berikut:

```markdown
# Milestone 1B Revision 1 Validation Report

## Status
Completed / Partially Completed / Blocked

## Root Cause
Jelaskan penyebab alur sebelumnya tidak sesuai.

## Implemented Flow
Ringkasan flow login dan Gateway setelah revisi.

## Routing Decision Matrix

| Authentication | Accessible Projects | Active Project | Expected Destination |
|---|---:|---|---|
| Unauthenticated | N/A | N/A | Login |
| Authenticated | 0 | None | Dashboard — No Project Access |
| Authenticated | > 0 | None/Invalid | Active Project Gateway |
| Authenticated | > 0 | Valid | Dashboard |

## Files Modified
Daftar file frontend yang diubah.

## Backend Changes
Harus menyatakan: None.

## Database Changes
Harus menyatakan: None.

## Source of Truth Changes
Harus menyatakan: None.

## Validation Results
Hasil build, lint, browser test, dan scenario test.

## Scenario Results
Hasil tiap skenario validasi.

## Authentication Limitation
Catatan jika credential valid belum tersedia.

## Conflicts
Conflict Report apabila ditemukan.

## Risks
Risiko tersisa.

## Ready for Next Revision
Yes / No beserta alasan.
```

---

## Definition of Done

Revisi dianggap selesai apabila:

- user dengan minimal satu accessible active project diarahkan ke Active Project Gateway setelah login,
- user tetap wajib memilih project walaupun hanya memiliki satu project,
- user tanpa project langsung masuk Dashboard,
- Dashboard user tanpa project menampilkan No Project Access,
- user tidak dapat melewati Gateway melalui URL manual,
- Gateway tidak dapat diakses user tanpa project,
- pemilihan project menggunakan backend resmi,
- Dashboard baru dibuka setelah project berhasil ditetapkan,
- active project dan active membership tersinkronisasi,
- session restoration tidak memunculkan redirect yang salah,
- logout membersihkan seluruh project context,
- tidak ada kebocoran context antar-user,
- tidak ada mock runtime pada flow terkait,
- frontend build dan lint lulus,
- backend tidak berubah,
- database tidak berubah,
- Source of Truth tidak berubah,
- tidak ada redesign atau perubahan di luar scope.
