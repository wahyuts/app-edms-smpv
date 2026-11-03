# Sprint A - Database Concurrency Validation

Tanggal: 2 November 2026. Scope: XAMPP lokal, database test terisolasi, Permanent Delete Foundation saja.

## A. Migration Compatibility Report

| Item | MySQL | MariaDB |
|---|---|---|
| Engine version | Current Railway version UNKNOWN, tidak diakses | VERIFIED: 10.4.32-MariaDB |
| Migration file | 20261102_0001_permanent_delete_foundation_mysql.sql | 20261102_0001_permanent_delete_foundation_mariadb.sql |
| Syntax | Static review; target CHECK-enforcing MySQL 8.0.16+ | Executed pada XAMPP test DB |
| Generated column | STORED; runtime belum diuji | PERSISTENT; metadata menunjukkan STORED GENERATED |
| Constraints/indexes | Logical DDL reviewed; runtime belum diuji | Behavioral verification PASS; 12 index definitions diperiksa |
| Concurrency | NOT TESTED pada MySQL | 18 scenarios PASS, termasuk multi-connection races |

Kedua file memiliki logical DDL lengkap yang identik setelah normalisasi STORED/PERSISTENT; tidak ada CHECK/index yang dihilangkan untuk MariaDB. Lima tabel tetap InnoDB, utf8mb4_unicode_ci; request/key hashes tetap ascii_bin. Composite keys, state CHECK, active temporary unique claim, operation identity dan manifest key identity dipertahankan. Tidak ada FK ke business rows atau cascade yang dapat menghapus evidence setelah hard delete di sprint berikutnya.

File original dipertahankan sebagai LEGACY PREPARATION ARCHIVE, seluruh baris berupa komentar. File tersebut belum pernah diterapkan oleh workflow ini sebelum pemisahan. Referensi existing hanya ditemukan pada dokumentasi preparation; tidak ada automatic migration runner/startup execution yang memerlukan file original. Canonical adalah dua varian engine-specific: pilih tepat satu, jangan menjalankan seluruh folder migration. Unit test memastikan arsip original tidak memiliki SQL executable.

Tidak ada klaim MySQL runtime PASS atau READY FOR PRODUCTION. Versi target Railway yang sebenarnya harus diverifikasi melalui proses terpisah yang disetujui owner, bukan akses remote pada fase ini.

## B. Files Changed in This Phase

Seluruh patch Sprint A sebelumnya dipertahankan. Perubahan tambahan fase ini:

| File | Change | Reason |
|---|---|---|
| database/migration/20261102_0001_permanent_delete_foundation_mysql.sql | Canonical MySQL variant | Engine-specific applicability |
| database/migration/20261102_0001_permanent_delete_foundation_mariadb.sql | Canonical MariaDB variant | Verified PERSISTENT syntax |
| database/migration/20261102_0001_permanent_delete_foundation.sql | Retained comment-only legacy archive | Hindari accidental duplicate execution |
| apps/backend/src/repositories/documentCoordination.repository.js | UTC_TIMESTAMP(3) explicit pada empat insert paths | Bug runtime timestamp non-UTC yang direproduksi |
| apps/backend/tests/integration/sprintADatabaseValidation.cjs | Real DB harness, ownership/scope guards, synthetic fixtures, fault injection | Tutup validation gap database nyata |
| apps/backend/tests/unit/documentCoordinationMigration.test.js | Tiga static regression tests | DDL equivalence, non-executable archive, UTC insert coverage |
| database/migration/20261102_0001_permanent_delete_foundation_ROLLBACK.md | Canonical variants, test execution status, UTC rule | Operational applicability |
| database/migration/reports/20261102_0001_permanent_delete_sprint_a_validation.md | Historical-stage note saja | Jangan menimpa fakta pengujian fase sebelumnya |
| database/migration/reports/20261102_0001_sprint_a_database_initial_results.json | Initial failed-run evidence | 17 PASS, satu kegagalan UTC sebesar 25200 detik |
| database/migration/reports/20261102_0001_sprint_a_database_results.json | Final machine-readable evidence | 18 PASS, 0 FAIL; engine, IDs dan timing tanpa credential |
| database/migration/reports/20261102_0001_sprint_a_database_validation.md | Laporan ini | Final scope/results/limitations |

## C. Test Database Details

- Engine: MariaDB 10.4.32 pada `127.0.0.1:3306`, hostname `DESKTOP-3DFA1TA`.
- Process preflight: listener 3306 dimiliki PID 8568, executable `D:\xampp\mysql\bin\mysqld.exe`; my.ini menunjuk basedir/data XAMPP lokal. Tidak hanya mengandalkan localhost/nama database.
- Default isolation: REPEATABLE-READ. InnoDB DEFAULT, mendukung transactions, XA dan savepoints. Page size 16384 bytes.
- Default mysql2 session SQL mode: IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION. Global SQL mode tidak memuat IGNORE_SPACE; keduanya dicatat terpisah. Server timezone SYSTEM.
- Database: `edms_sprint_a_test`, belum ada pada initial preflight, dibuat oleh pekerjaan ini. Application .env menunjuk `edms_smpv_dev`, bukan test DB.
- Harness hanya mengambil credential lokal yang sudah tersedia, tidak menebak password, tidak mengimpor application env/database initialization. Host, port dan nama database test tidak dapat dioverride oleh environment aplikasi.
- Canonical `database/schema/schema-dev.sql` dipakai untuk 24 business tables dengan FK/index/CHECK asli. Dua statement header CREATE DATABASE/USE asli diverifikasi lalu tidak dieksekusi. Tidak ada perubahan pada canonical schema file.
- MariaDB technical migration dieksekusi satu kali saat inisialisasi. Ownership table terpisah menyimpan workflow identity, hash schema/migration dan status READY. Rerun hanya membaca marker/hash lalu menambahkan fixture dengan run identity baru; tidak drop, overwrite atau mengulangi migration.
- Fixture: synthetic users, roles, projects, memberships, documents, notifications dan coordination records. Tidak ada data asli disalin atau email dikirim.
- Semua data test dipertahankan, termasuk intentional ACTIVE/UNRESOLVED operations; tidak ada cleanup DELETE/TRUNCATE/DROP. Jangan menggunakan database ini sebagai application database operasional.
- Connection facade memastikan DATABASE() tepat test DB, menolak protected database identifiers, USE, DROP, TRUNCATE, DELETE, REPLACE, SET GLOBAL dan disabling FK checks. KILL hanya tersedia pada control path dengan connection ID milik harness dan DB target diverifikasi dari PROCESSLIST.
- Lock wait timeout test dibatasi dua detik per session dan watchdog per scenario 15 detik. Timezone hanya diatur per session. Final runtime validation juga dijalankan tanpa penambahan strict SQL mode; konfigurasi global dibandingkan sebelum/sesudah dan tetap sama.

Initial DDL initialization memakai strict test session pada iterasi awal harness. Runtime constraint/concurrency rerun terakhir memakai inherited/default SQL mode. Tidak ada perubahan konfigurasi global, my.ini, atau koneksi aplikasi lain.

## D. Concurrency Test Matrix

Berikut hasil final, menggunakan repository/service source aktual dan koneksi MariaDB nyata. Storage IO disimulasikan tanpa R2, bukan persistence double.

| Scenario | Expected | Actual | Result |
|---|---|---|---|
| Migration/layout/indexes | Lima technical tables sesuai source | InnoDB, generated expression, 12 indexes dan logical engine equivalence terverifikasi | PASS |
| CHECK/NOT NULL/scope | Invalid states tidak diterima | Tujuh invalid CHECK cases ditolak; NOT NULL failures dipakai pada rollback tests | PASS |
| Unique constraints | Tidak ada duplicate active temp/gate/operation/manifest identity | Direct conflicting inserts ditolak; temp claim dapat dipakai lagi hanya setelah settled | PASS |
| Admission sebelum reservation | Writer lama drain, writer baru ditolak | SQL commit selama pending berhasil; setelah settled confirmed; token lama tidak dapat mutation baru | PASS |
| Held gate contention | Reservation menunggu, tidak bypass | Promise tetap pending selama lock ditahan, lalu reservation berhasil setelah commit | PASS |
| Concurrent admission/reservation | Salah satu urutan terpilih secara atomik | 20 races dengan urutan mulai bergantian; kedua winner cases terjadi; tidak ada admission setelah reservation | PASS |
| Dua Admin reservation | Same identity idempotent; different identity 409 | Actual project-membership authorization, hanya satu operation row | PASS |
| Full writer lifecycle | Pending sampai IO/SQL/post-commit selesai | SQL commit selama pending, kemudian confirmed; detached SQL setelah confirmed ditolak | PASS |
| Unknown COPY/restart | Unknown tetap pending | Business rollback tidak menghapus durable IO; module reload membaca evidence yang sama | PASS |
| Admission/reservation/business rollback | Gate dan data tidak false-complete | Failed inserts rollback gate; business description kembali sebelum perubahan; known rollback settled | PASS |
| Connection loss selama simulated COPY | SQL lock lepas bukan bukti storage selesai | Koneksi test diputus; reservation diperoleh tetapi pending; late simulated IO ACK tidak menghapus DB UNKNOWN | PASS |
| Project Close conflict/normal | Konflik rollback seluruh archive; normal tetap Closed | Tidak ada partial archive pada konflik; normal close mengarsipkan Approved document | PASS |
| Project Close overlap reservation | Sorted locking tidak melewati reserved target | Concurrent reservation menyebabkan close ditolak tanpa partial commit | PASS |
| Bulk notification/SLA stale candidate | Tidak ada late owned SQL | Guard menolak mark-all dan SLA upsert; notification tetap unread | PASS |
| Intentional inverse-order deadlock | Database memilih victim; retry aman | ER_LOCK_DEADLOCK pada satu transaction; keduanya rollback; fresh admission konsisten | PASS |
| Real pool starvation | IO evidence tidak membutuhkan occupied business connection | Business pool 1 dan evidence pool 1 menyelesaikan IO sambil business transaction aktif dan admission lain antre | PASS |
| Cross-document/project isolation | Gate target tidak menjadi global lock | Gate A ditahan; writer B dan project lain tetap berhasil | PASS |
| UTC timestamp | Technical timestamps tidak bergantung timezone session | Coordinator/writer/IO/operation tetap UTC pada session +07:00 setelah targeted fix | PASS |

Setiap statement database dalam tabel dijalankan pada test DB. Tidak ada real provider request, actual Permanent Delete, file deletion atau document hard delete. Unknown/restart test memakai reload module baru yang membaca persistence database yang sama; bukan klaim kill/restart seluruh server database atau provider R2.

## E. Regression Results and Findings

### Targeted Runtime Bug

Initial run: 17 PASS, 1 FAIL. Coordinator created_at menggunakan CURRENT_TIMESTAMP default dan bergeser 25200 detik ketika session memakai +07:00. Penyebab: mysql2 `timezone: 'Z'` tidak menjadikan default SQL session timezone UTC.

Fix minimal: insert coordinator, writer, storage IO dan delete operation menyebut created_at/updated_at dengan UTC_TIMESTAMP(3). Update paths sebelumnya sudah memakai UTC_TIMESTAMP(3). Tidak mengubah workflow, IO semantics, storage keys, DB global timezone atau business tables. Future manifest writer wajib mengikuti pola UTC yang sama.

Rerun awal juga memperbaiki plumbing harness: error listener dipasang sekali per underlying pooled connection; pemeriksaan global membandingkan GLOBAL sebelum/sesudah, bukan nilai session yang memiliki IGNORE_SPACE. Hasil parsial tanpa final verdict tidak dihitung sebagai PASS. Final complete runs setelah perbaikan menghasilkan 18/18 PASS.

### Final Results

| Validation | Result |
|---|---|
| MariaDB migration execution | PASS, isolated test DB only |
| Constraints/index/UTC verification | PASS |
| Real database scenarios | 18 PASS, 0 FAIL |
| Automated backend unit/regression/HTTP | 272 PASS, 0 FAIL, 0 skipped, 0 cancelled |
| Baseline difference | 269 + 3 new migration/UTC/archive static regressions; assertion existing tidak dilemahkan |
| Syntax checks | 31 changed/new JS/CJS files PASS |
| git diff --check | PASS; hanya warning LF/CRLF |
| MySQL engine execution | NOT TESTED; logical SQL review/equivalence only |
| Live R2/email | NOT ACCESSED / NOT SENT |

Commands dari repository root:

```powershell
node apps/backend/tests/integration/sprintADatabaseValidation.cjs --execute-local-test-only
$tests = @(rg --files apps/backend/tests/unit -g '*.test.js')
node --require ./apps/backend/tests/helpers/isolatedHttpRegression.cjs --test @tests
git diff --check
```

Machine-readable final evidence dan initial UTC failure ada pada dua JSON files di folder laporan ini. Tidak menyimpan password atau connection string berisi credential. ID koneksi dalam evidence hanya koneksi test; connection failure tidak memutus koneksi aplikasi/main database.

## F. Safety Confirmation

- `edms_db`, `edms_smpv_dev`, serta database development/staging/production existing lain tidak menerima statement mutation dari pekerjaan ini. Pembuktian scope berdasarkan fixed connection target dan query guards, bukan klaim seluruh row database aktif tidak berubah oleh pihak lain.
- Railway tidak diakses; MySQL migration tidak dijalankan secara remote.
- R2 live tidak diakses, tidak ada email atau Delete notification dikirim.
- Development Reset tidak dijalankan atau diubah. Tidak ada maintenance framework baru.
- Tidak ada actual Permanent Delete, physical file deletion, document metadata hard delete atau final Delete audit event.
- Tidak ada frontend, business workflow, role/permission, seed, canonical schema, filename atau storage key naming changes.
- Tidak ada commit, push, production migration atau deployment. Tidak ada global SQL mode/timezone changes.
- General upload/COMMIT recovery tetap HOLD; baseline reproduction PASS bukan perbaikan kelemahan existing tersebut.

Development Reset tetap development-only destructive maintenance utility, hanya untuk maintenance eksklusif ketika semua application writers berhenti dan tidak ada unresolved storage operations. Concurrent execution tidak didukung dan tetap di luar scope Sprint A.

## G. Final Verdict

**SPRINT A CLOSED** untuk fondasi dan validasi database XAMPP lokal yang diminta.

Tidak ada critical safety finding yang belum ditangani dari final MariaDB run. Batas eksplisit: MySQL runtime dan versi Railway belum diverifikasi, provider R2 nyata tidak diuji, dan migration belum diterapkan pada main development/online databases. Status ini bukan READY FOR PRODUCTION. Pemilihan/eksekusi migration di environment lain tetap memerlukan review dan persetujuan terpisah.

STOP setelah validasi ini. Tidak memulai Sprint B/C/D/E dan tidak mengaktifkan public Delete endpoint.
