# DEVELOPMENT ENVIRONMENT RESET
## Data Reset + Baseline Reseed Only
## Local Implementation & E2E Only — Manual Railway/R2 Online UAT by User

---

# 1. Context

Project ini adalah Engineering Document Management System (EDMS).

Project memiliki environment:

```text
Development
Staging
Production
```

Saat ini terdapat fitur legacy pada User Management:

```text
Reset All Demo Data
```

Fitur tersebut berasal dari implementasi lama ketika aplikasi masih memakai IndexedDB/local demo data.

Sekarang aplikasi sudah menggunakan:

```text
Frontend React/Vite
↓
Backend Node.js/Express
↓
MySQL
↓
Storage Local / Cloudflare R2
```

sebagai arsitektur utama.

Fitur Reset Demo Data lama harus diubah menjadi:

```text
Development Environment Reset
```

---

# 2. Core Reset Definition — HARD RULE

Development Environment Reset BUKAN:

```text
DROP DATABASE
```

BUKAN:

```text
DROP TABLE
```

BUKAN:

```text
rebuild schema
```

BUKAN:

```text
apply schema.sql kembali
```

Target reset adalah:

```text
PERTAHANKAN DATABASE EXISTING
↓
PERTAHANKAN SEMUA TABLE / SCHEMA EXISTING
↓
HAPUS DATA RUNTIME / TESTING SECARA AMAN
↓
JALANKAN:
database/seed/seed-base.sql
↓
DATABASE KEMBALI KE BASELINE
```

---

# 3. Absolute Database Safety

DILARANG menjalankan:

```sql
DROP DATABASE ...
```

DILARANG menjalankan:

```sql
DROP TABLE ...
```

DILARANG membuat database baru.

DILARANG rebuild schema melalui:

```text
database/schema/**
```

sebagai bagian dari tombol Reset Demo Data.

Database dan seluruh struktur table yang sudah ada harus tetap dipertahankan.

Task ini hanya:

```text
DATA RESET
+
BASELINE RESEED
```

---

# 4. Main Objective

Ketika Admin melakukan Development Reset:

```text
Data testing/runtime Development
↓
dihapus
↓
schema tetap
↓
baseline seed dijalankan
↓
Development kembali ke kondisi awal
```

Baseline HARUS berasal dari:

```text
database/seed/seed-base.sql
```

---

# 5. Canonical Seed — SINGLE SOURCE OF TRUTH

Baseline resmi untuk reset adalah:

```text
database/seed/seed-base.sql
```

File tersebut merupakan:

```text
SINGLE SOURCE OF TRUTH
```

untuk data baseline Development Reset.

---

# 6. seed-demo.sql — STRICTLY PROHIBITED

Terdapat file lain:

```text
database/seed/seed-demo.sql
```

File tersebut DILARANG digunakan dalam Development Reset.

DILARANG:

- menjalankan `seed-demo.sql`;
- merge dengan `seed-base.sql`;
- mengambil sebagian data dari `seed-demo.sql`;
- menjadikan `seed-demo.sql` fallback;
- menggunakannya untuk reseed.

Development Reset hanya boleh menggunakan:

```text
database/seed/seed-base.sql
```

---

# 7. Baseline Means Seed Data, Not Schema

Pahami distinction berikut:

```text
schema
=
struktur table / column / FK / index
```

sedangkan:

```text
seed-base.sql
=
data baseline awal
```

Development Reset hanya mengembalikan:

```text
DATA
```

ke baseline.

Schema existing tidak dibangun ulang.

---

# 8. Current Legacy Button Problem

Hasil audit sebelumnya menemukan bahwa tombol Reset Demo Data masih ada di render tree, tetapi guard role memakai contract lama:

```js
currentRole?.roleName === "Admin"
```

Backend auth sekarang menormalisasi role menjadi:

```js
{
  id,
  code,
  name
}
```

Frontend menyimpan role tersebut secara langsung.

Karena itu contract resmi sekarang adalah:

```js
currentRole?.name === "Admin"
```

Perbaiki guard sesuai contract aktual.

JANGAN mempertahankan `roleName`.

---

# 9. Frontend Visibility Guard

Tombol Reset Demo Data hanya boleh tampil jika seluruh kondisi terpenuhi:

```text
VITE_APP_ENV === "development"
AND
VITE_ENABLE_DEMO_RESET === true
AND
currentRole?.name === "Admin"
AND
existing required permission === true
```

Jika salah satu false:

```text
button hidden
```

---

# 10. Frontend vs Backend Environment

Frontend menggunakan:

```env
VITE_APP_ENV=development
VITE_ENABLE_DEMO_RESET=true
```

Backend menggunakan:

```env
APP_ENV=development
```

Jangan mencampur keduanya.

Frontend hanya membaca variable `VITE_*`.

Backend membaca `APP_ENV`.

---

# 11. Backend Security Guard — CRITICAL

Backend endpoint reset hanya boleh berjalan jika:

```text
APP_ENV === "development"
AND
backend reset feature flag === true
AND
authenticated
AND
Admin
AND
required permission valid
```

Expected:

```text
development → ALLOWED

test        → BLOCKED
staging     → BLOCKED
production  → BLOCKED
```

---

# 12. Do Not Use Non-Production Guard

DILARANG membuat:

```js
env.appEnv !== "production"
```

sebagai guard reset.

Karena itu akan memungkinkan:

```text
staging
test
```

Gunakan hanya:

```js
env.appEnv === "development"
```

---

# 13. Backend Feature Flag

Tambahkan backend flag jika belum ada, misalnya:

```env
ENABLE_DEVELOPMENT_RESET=true
```

atau nama yang mengikuti convention project.

Final backend guard:

```text
APP_ENV === development
+
ENABLE_DEVELOPMENT_RESET === true
+
Admin
+
permission
```

---

# 14. Database Target Principle

Reset tidak boleh mengetahui apakah database:

```text
XAMPP
Railway
Local
Cloud
```

secara hardcoded.

Target reset selalu:

```text
ACTIVE DATABASE CONNECTION BACKEND
```

menggunakan konfigurasi existing:

```env
MYSQL_HOST
MYSQL_PORT
MYSQL_DATABASE
MYSQL_USER
MYSQL_PASSWORD
```

---

# 15. Local Behaviour

Jika backend lokal terhubung ke:

```text
MySQL/XAMPP Development
```

maka:

```text
Reset
↓
MySQL/XAMPP Development
```

yang di-reset.

---

# 16. Railway Behaviour — DESIGN ONLY

Jika backend Railway Development terhubung ke:

```text
Railway MySQL Development
```

maka secara arsitektur:

```text
Reset
↓
Railway MySQL Development
```

yang menjadi target.

Codex TIDAK melakukan Railway Online UAT pada task ini.

---

# 17. User-Provided Railway Deployment Fact

User telah memverifikasi bahwa Railway Backend Development menggunakan:

```text
Root Directory:
/apps/backend
```

Canonical seed berada di:

```text
database/seed/seed-base.sql
```

yang berada di luar root tersebut.

Gunakan ini sebagai:

```text
USER-PROVIDED FACT
```

JANGAN klaim melakukan audit Railway Dashboard.

---

# 18. Runtime Seed Problem

Backend Railway tidak boleh bergantung pada runtime path:

```text
../../database/seed/seed-base.sql
```

karena canonical seed berada di luar Railway Root Directory.

Karena itu diperlukan:

```text
GENERATED RUNTIME COPY
```

di dalam backend deployment tree.

---

# 19. Automatic Runtime Seed Synchronization

Target:

```text
CANONICAL

database/seed/seed-base.sql
        │
        │ automatic sync
        ▼

BACKEND RUNTIME ARTIFACT

apps/backend/<appropriate-path>/seed-base.runtime.sql
```

Path final ditentukan setelah audit struktur repository.

---

# 20. Runtime Artifact Is Not Source of Truth

Runtime seed adalah:

```text
GENERATED ARTIFACT
```

Bukan seed kedua.

DILARANG diedit manual.

Canonical tetap:

```text
database/seed/seed-base.sql
```

Jika memungkinkan beri marker:

```text
GENERATED FILE
DO NOT EDIT DIRECTLY
SOURCE: database/seed/seed-base.sql
```

---

# 21. User Workflow Must Stay Simple

User hanya melakukan:

```text
Edit:
database/seed/seed-base.sql
↓
commit / git push
↓
automatic synchronization
↓
runtime seed ikut terbaru
```

User TIDAK BOLEH diwajibkan:

```text
manual copy
manual paste
edit runtime seed
maintain duplicate seed
```

---

# 22. Audit Build / Sync Strategy

Sebelum implementasi runtime copy, audit source lokal:

```text
root package.json
apps/backend/package.json
workspace scripts
.gitignore
Railway config files yang ada di repo
Dockerfile jika ada
Nixpacks config jika ada
build/start scripts
```

Pilih sync strategy paling aman berdasarkan source aktual.

---

# 23. Generated Artifact & Git

Jika karena Railway Root Directory `/apps/backend` runtime seed harus tersedia sebagai tracked generated file, itu diperbolehkan.

Tetapi:

```text
canonical tetap database/seed/seed-base.sql
```

dan runtime copy wajib:

```text
generated
auto-synced
verified
never manually edited
```

---

# 24. Sync Verification

Implementasikan verification seperti:

```text
SHA-256
checksum
byte comparison
```

atau mekanisme deterministic lain.

Target:

```text
canonical seed
==
runtime seed content
```

Jika tidak sinkron:

```text
validation FAIL
```

Jangan diam-diam memakai runtime seed lama.

---

# 25. Reset Strategy — DATA ONLY

Audit schema/FK untuk menentukan urutan penghapusan data.

Pilih mekanisme seperti:

```text
DELETE
TRUNCATE
```

atau strategi lain yang aman.

Tetapi hasil akhirnya harus:

```text
TABLE EXISTING TETAP ADA
```

---

# 26. DILARANG REBUILD SCHEMA

Jangan:

```text
drop tables
apply schema
recreate indexes
recreate constraints
```

Development Reset bukan migration tool.

Schema diasumsikan sudah sesuai source/migration saat aplikasi berjalan.

---

# 27. Foreign Key Handling

Audit dependency FK.

Jika menggunakan:

```text
DELETE
TRUNCATE
```

pastikan urutan aman.

Jika temporary FK checks diperlukan:

- disable secara terkendali;
- lakukan reset;
- enable kembali;
- jangan meninggalkan session/database pada state FK disabled.

---

# 28. Auto Increment

Audit apakah baseline membutuhkan deterministic auto increment state.

Jika perlu reset AUTO_INCREMENT untuk table runtime tertentu, lakukan hanya jika aman dan diperlukan.

Jangan reset sembarangan jika seed-base mengandalkan explicit ID.

---

# 29. Seed Execution

Setelah data lama dibersihkan:

```text
run runtime copy of seed-base.sql
```

menggunakan active MySQL connection backend.

Jangan bergantung pada external `mysql` CLI jika Node/MySQL driver existing dapat melakukan dengan aman.

---

# 30. Seed SQL Audit

Audit actual:

```text
database/seed/seed-base.sql
```

Periksa:

- multi statements;
- INSERT;
- upsert;
- explicit IDs;
- FK;
- transaction;
- comments;
- delimiter;
- any `USE` statement.

Jika canonical seed memiliki statement yang tidak cocok untuk runtime execution, tangani dengan parser/execution path minimal TANPA mengubah arti canonical seed.

---

# 31. Do Not Apply Schema

Sekali lagi:

```text
seed execution
≠
schema execution
```

JANGAN menjalankan:

```text
database/schema/**
```

dari Reset Demo Data.

---

# 32. Expected Database Result

Hasil reset:

```text
schema/tables → tetap

runtime/testing data → hilang

baseline data → sesuai seed-base.sql
```

Jangan hardcode jumlah row.

Gunakan isi actual seed-base.

---

# 33. Storage Reset

Database reset dapat membuat storage object lama menjadi orphan.

Karena itu Development Reset juga harus membersihkan storage Development yang relevan.

Storage target selalu:

```text
ACTIVE STORAGE CONFIGURATION BACKEND
```

---

# 34. Local Storage

Jika:

```env
STORAGE_DRIVER=local
```

bersihkan file runtime Development dalam configured storage root secara aman.

Jangan menghapus:

- source code;
- root repository;
- directory di luar configured storage;
- arbitrary OS path.

---

# 35. R2 Support

Jika:

```env
STORAGE_DRIVER=r2
```

reset service secara arsitektur harus dapat membersihkan storage Development melalui R2 driver/config existing.

Namun:

```text
R2 ONLINE UAT
```

tidak dilakukan Codex pada task ini.

---

# 36. Do Not Delete Bucket

Development Reset DILARANG menghapus R2 bucket.

Hanya object EDMS Development dalam scope configured storage yang boleh dibersihkan.

---

# 37. Environment Isolation

DILARANG hardcode:

```text
R2 Development bucket
R2 Staging bucket
R2 Production bucket
Railway DB hostname
XAMPP DB
```

Gunakan active backend config.

---

# 38. Legacy IndexedDB Reset

Audit:

```text
demo-data-reset.service.js
IndexedDB reset logic
```

Fitur baru tidak boleh lagi menjadikan IndexedDB sebagai Source of Truth.

Frontend Reset harus memanggil backend API.

Jangan menghapus shared IndexedDB utility bila masih digunakan feature lain.

---

# 39. Confirmation UI

Development Reset adalah destructive action.

Wajib ada confirmation modal.

Reuse pattern existing.

Minimal jelaskan:

```text
Seluruh data Development akan dihapus
dan dikembalikan ke baseline.
```

Jangan redesign User Management.

---

# 40. Loading UI

Saat reset berlangsung:

```text
Reset Demo Data
↓
spinner
↓
Resetting...
```

Button disabled.

Double click dicegah.

---

# 41. Backend Single-Run Guard

Backend juga wajib mempunyai guard.

Jika reset sedang berjalan:

```text
request kedua
→ reject / conflict
```

Jangan hanya mengandalkan frontend disabled state.

---

# 42. Active Session After Reset

Audit auth/session implementation.

Reset kemungkinan menghapus:

- refresh token/session;
- project membership;
- active project preference;
- other runtime context.

Setelah reset success jangan mempertahankan stale state.

Behaviour aman kemungkinan:

```text
reset success
↓
clear frontend query cache
↓
clear Zustand/project state
↓
clear auth/session
↓
redirect Login
```

Tetapkan berdasarkan source aktual.

---

# 43. Reset Operation Ordering

Audit dulu urutan paling aman.

Contoh konsep:

```text
Acquire reset lock
↓
Clean storage
↓
Clear runtime DB data
↓
Run baseline seed
↓
Verify baseline
↓
Release lock
```

atau DB/storage ordering lain bila lebih aman.

Jangan mengikuti contoh secara buta.

---

# 44. Failure Safety

Jika reset gagal di tengah proses:

DILARANG:

```text
return success
```

Log step yang gagal.

Jangan:

- menjalankan seed-demo;
- drop schema;
- fallback destructive;
- mengklaim baseline sudah pulih.

---

# 45. Database Transaction Consideration

Audit apakah proses data clear + baseline reseed dapat dilakukan dalam transaction yang aman.

Gunakan transaction jika compatible.

Tetapi jangan memaksa transaction untuk operasi storage yang tidak transactional.

Pisahkan DB transaction vs storage failure strategy secara jelas.

---

# 46. Baseline Verification

Setelah reseed, lakukan verification minimal berdasarkan data penting aktual dalam seed-base.

Jangan hardcode asumsi yang tidak ada di seed.

Pastikan:

```text
seed execution successful
```

dan required Admin/reference data tersedia.

---

# 47. Structured Logging

Gunakan logger existing.

Event contoh:

```text
development_reset_started
development_reset_database_cleanup_started
development_reset_database_cleanup_completed
development_reset_seed_started
development_reset_seed_completed
development_reset_storage_started
development_reset_storage_completed
development_reset_completed
development_reset_failed
development_reset_rejected
```

Jangan log secrets.

---

# 48. No Persistent Audit Row Unless Baseline Requires It

Karena tujuan reset adalah kembali persis ke baseline, jangan menambahkan audit DB row setelah reset jika itu membuat database tidak lagi sesuai seed-base.

Operational backend log cukup.

---

# 49. Mandatory Source Audit Before Coding

Audit:

## Frontend

```text
env config
UserManagementPage
demo-data-reset.service
AuthorizationService
auth service/store
query client
project state
confirmation modal
toast
loading pattern
IndexedDB consumers
```

## Backend

```text
env config
auth middleware
authorization
role
permission middleware
database pool
repositories
storage abstraction
local driver
R2 driver
logger
error handler
```

## Database

```text
schema
migration
seed-base.sql
seed-demo.sql
FK relations
```

## Build

```text
root package.json
backend package.json
.gitignore
Railway config files locally available
Dockerfile/Nixpacks config if present
```

---

# 50. Local Implementation Scope

Codex bertanggung jawab untuk:

```text
source audit
implementation
local static validation
local DB E2E
local storage E2E
seed sync validation
regression validation
```

---

# 51. Online UAT Is Separate

Codex TIDAK bertanggung jawab untuk melakukan:

```text
Railway Dashboard verification
Railway MySQL online reset
R2 online reset
Vercel online browser UAT
Railway log inspection
```

User akan melakukan semuanya secara manual setelah Local PASS.

---

# 52. Local E2E Safety Gate

Sebelum destructive Local E2E:

Pastikan:

```text
APP_ENV === development
```

dan target DB dapat dibuktikan aman untuk Development.

Jika tidak yakin:

```text
DO NOT RUN
```

gunakan status:

```text
BLOCKED FOR SAFETY
```

---

# 53. Local E2E Test Matrix

## Test 1 — Button Visible

```text
VITE_APP_ENV=development
VITE_ENABLE_DEMO_RESET=true
Admin
permission valid
```

Expected:

```text
button visible
```

---

## Test 2 — Feature Disabled

```text
VITE_ENABLE_DEMO_RESET=false
```

Expected:

```text
button hidden
```

---

## Test 3 — Non Admin

Expected:

```text
button hidden
```

Manual endpoint:

```text
rejected
```

---

## Test 4 — APP_ENV staging

Test dengan isolated/mocked environment.

Expected:

```text
reset rejected
```

Jangan menyentuh staging DB.

---

## Test 5 — APP_ENV production

Expected:

```text
reset rejected
```

Jangan menyentuh production DB.

---

## Test 6 — Backend Feature Disabled

Expected:

```text
reset rejected
```

---

## Test 7 — Runtime Data Reset

Buat representative Development test data.

Jalankan reset.

Expected:

```text
all runtime/test rows removed
all tables still exist
schema unchanged
```

---

## Test 8 — Baseline Seed

Expected:

```text
seed-base applied successfully
```

---

## Test 9 — Schema Preservation

WAJIB verifikasi:

```text
table count before
==
table count after
```

dan struktur table tidak berubah karena reset.

Tidak boleh ada DROP TABLE.

---

## Test 10 — seed-demo Not Used

Expected:

```text
seed-demo not executed
```

---

## Test 11 — Repeat Reset

Reset baseline lagi.

Expected:

```text
deterministic
no duplicate baseline
schema unchanged
```

---

## Test 12 — Concurrent Reset

Trigger dua request.

Expected:

```text
one runs
one rejected
```

---

## Test 13 — Local Storage

Jika storage local:

```text
runtime files removed
configured root survives
unrelated files survive
```

---

# 54. Runtime Seed Sync Test

Verifikasi:

```text
database/seed/seed-base.sql
```

dan runtime artifact sinkron.

Expected:

```text
PASS
```

Test stale detection bila aman.

Restore temporary modifications setelah test.

---

# 55. E2E Test Data Cleanup

Development Reset itu sendiri harus menghapus data test yang dibuat E2E.

Setelah test:

```text
test artifacts = 0
```

kecuali data yang memang berasal dari seed-base.

---

# 56. Static Validation

Jalankan:

```text
Backend syntax check
Backend import
Reset route import
Reset service import
Frontend lint
Frontend production build
Seed sync check
Seed verification check
Relevant automated tests
```

---

# 57. Regression Validation

Pastikan tidak ada regresi pada:

```text
Login
Logout
Refresh Token
User Management
Project Management
Membership
Create Document
Upload Revision
Approval A/B/C
Dashboard
Document Register
SLA
Escalation
Notification
Audit Trail
Realtime
Storage
Temporary Upload
TTL Scheduler
```

---

# 58. Prohibited Scope

DILARANG:

```text
DROP DATABASE
DROP TABLE
REBUILD SCHEMA
RUN schema.sql
RUN seed-demo.sql
hardcode Railway
hardcode XAMPP
hardcode R2 bucket
change Business Workflow
change auth contract
change Official Roles
change approved UI layout
touch Staging DB
touch Production DB
perform Railway Online UAT
perform R2 Online UAT
```

---

# 59. Deliverables

## A. Audit Result

## B. Root Cause Legacy Button

## C. Files Changed

## D. Frontend Guard

## E. Backend Guard

## F. Active Database Target Strategy

## G. Data Reset Strategy

Wajib menyatakan:

```text
NO DATABASE DROP
NO TABLE DROP
NO SCHEMA REBUILD
```

## H. Canonical Seed

```text
database/seed/seed-base.sql
```

## I. seed-demo Status

```text
NOT USED
```

## J. Runtime Seed Sync

## K. Sync Verification

## L. Storage Reset Strategy

## M. Session/Post Reset Strategy

## N. Local E2E Results

Gunakan:

```text
PASS
FAIL
BLOCKED FOR SAFETY
NOT EXECUTED
```

## O. Schema Preservation Validation

## P. Test Artifact Cleanup

## Q. Regression Result

## R. Online UAT Status

Wajib tulis:

```text
Railway Online UAT: NOT EXECUTED
Railway MySQL Reset UAT: NOT EXECUTED
Cloudflare R2 Online UAT: NOT EXECUTED
Vercel Online UAT: NOT EXECUTED
```

## S. Final Status

Jika Local PASS:

```text
DEVELOPMENT ENVIRONMENT DATA RESET & BASELINE RESEED — LOCAL E2E PASS
READY FOR MANUAL ONLINE RAILWAY/R2 UAT
```

---

# 60. Definition of Done

Local phase COMPLETE jika:

```text
Reset button visible untuk Admin Development
role guard memakai currentRole.name
frontend environment guard bekerja
backend APP_ENV guard bekerja
staging blocked
production blocked
backend feature flag bekerja
active DB connection menjadi reset target
database tidak di-drop
table tidak di-drop
schema tidak dibangun ulang
runtime data dibersihkan
seed-base dijalankan
seed-demo tidak pernah digunakan
schema tetap sama
automatic runtime seed copy tersedia
canonical tetap seed-base.sql
user tidak perlu manual copy
storage Development dibersihkan sesuai active driver
single-run guard bekerja
post-reset stale frontend state ditangani
Local E2E PASS
test artifacts 0
static validation PASS
```

---

# 61. Manual Online Railway/R2 UAT

OUT OF EXECUTION SCOPE.

User akan melakukan setelah deploy.

Codex hanya mempersiapkan implementation agar secara architecture:

```text
Backend Local
→ Active Local DB

Backend Railway Development
→ Active Railway MySQL Development
```

tanpa hardcode.

---

# 62. Final Safety Priority

Urutan prioritas:

```text
SAFETY
>
NO SCHEMA DESTRUCTION
>
ENVIRONMENT ISOLATION
>
DETERMINISTIC DATA RESET
>
CANONICAL SEED
>
AUTOMATIC SYNC
>
CONVENIENCE
```

---

# 63. Final Instruction

Lakukan:

```text
1. Audit source.
2. Implement Development Data Reset.
3. Jangan drop database.
4. Jangan drop table.
5. Jangan rebuild schema.
6. Hapus data runtime/testing.
7. Reseed hanya dari database/seed/seed-base.sql.
8. Implement automatic runtime seed synchronization.
9. Jalankan Local E2E.
10. Verifikasi schema tetap.
11. Bersihkan test artifact.
12. Jalankan regression/static validation.
13. Berikan laporan.
14. STOP.
```

Jangan melakukan Manual Railway/R2 Online UAT.

Setelah Local PASS, hanya laporkan:

```text
READY FOR MANUAL ONLINE RAILWAY/R2 UAT
```