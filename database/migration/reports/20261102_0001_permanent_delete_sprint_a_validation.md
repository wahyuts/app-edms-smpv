# Sprint A - Permanent Delete Foundation

Historical implementation-stage report. Subsequent XAMPP database validation, the UTC insert fix, and canonical engine-specific migration status are recorded separately in `20261102_0001_sprint_a_database_validation.md`. Original counts and NOT EXECUTED statements below describe the earlier stage, not the later isolated database run.

## A. Sprint Status

**SPRINT A COMPLETE WITH CONDITIONS**

Tanggal pemeriksaan: 2 November 2026. Implementasi dilanjutkan dari working tree Sprint A sebelumnya, tanpa reset/revert. Status ini berlaku untuk fondasi kode dan validasi terisolasi, bukan persetujuan migration/deployment atau pembuktian concurrency pada database nyata.

Syarat sebelum backend hasil patch digunakan: migration additive harus direview dan diterapkan melalui persetujuan environment tersendiri; jalankan migration verification dan concurrency pada MySQL/MariaDB terisolasi terlebih dahulu. Jangan menjalankan backend baru terhadap schema yang belum memiliki tabel teknis ini. Jangan menjalankan mixed fleet writer versi lama dan baru.

## B. Implementation Summary

- Gate per project/document mengurutkan writer admission dan reservation secara atomik melalui transaksi dan row lock. Duplicate-key UPDATE memperoleh exclusive lock tanpa shared-lock upgrade dari INSERT IGNORE.
- Writer lama dapat drain selama QUIESCENCE_PENDING memakai identity yang sama, termasuk transaksi bisnis, finalize/move, compensation dan post-commit notification/SLA/audit.
- IO intent menyimpan provider, exact source/destination, UUID attempt dan writer identity sebelum adapter dipanggil. Evidence mencakup satu pemanggilan adapter beserta retry internal SDK; bukan klaim wire-level reconciliation.
- Evidence pool terpisah dari business pool mencegah IO acknowledgement membutuhkan connection bisnis yang sedang ditempati transaksi. Evidence connection tidak memegang coordinator/business row lock.
- Unknown IO, COMMIT uncertainty, kegagalan completion persistence, crash, serta continuation SQL/storage yang tidak di-await tetap menahan writer sebagai ACTIVE/UNRESOLVED. Tidak ada TTL, HEAD/list, atau restart yang mengubah unknown menjadi settled.
- Token closed tidak dapat memulai mutation baru. Delegasi Edit Document ke Admin Edit satu kali saja, untuk actor, document dan payload yang sama.
- Evaluator mengambil immutable operation identity di luar transaksi, lalu gate dan state terbaru di dalam transaksi. Completion evidence diperiksa setelah gate lock; QUIESCENCE_CONFIRMED tidak diturunkan kembali oleh snapshot lama.
- Temporary claim berlaku juga untuk Approval B/C yang menerima temporaryFileId sebagai argumen top-level. Consume memerlukan claim yang cocok; cleanup melakukan recheck expiry dengan UTC database setelah claim diperoleh.
- Read/action guards memakai error envelope existing: HTTP 409, DOCUMENT_DELETION_IN_PROGRESS, dan pesan kontrak yang telah disetujui. Reservation tetap internal, tanpa route publik.
- Development Reset tidak diubah atau dihubungkan dengan coordinator. Source existing menolak APP_ENV selain development sebelum reset dijalankan.

Dokumen existing yang tersedia tetap menjadi acuan; tidak ada perubahan Source of Truth. AGENTS.md, SYSTEM-REQUIREMENTS.md, dan FEATURE-MAPPING.md tidak ditemukan dengan nama tersebut, sehingga tidak dibuat dokumen pengganti.

## C. Files Changed

Path berikut relatif terhadap root repository dan mencakup patch Sprint A sebelumnya serta resume ini.

| File | Change | Reason | Regression Risk |
|---|---|---|---|
| apps/backend/src/config/database.js | Tutup evidence pool saat shutdown | Lifecycle resource | Rendah |
| apps/backend/src/config/documentCoordinationDatabase.js | Pool evidence terpisah, bounded | Hindari ketergantungan IO evidence pada occupied business pool | Sedang |
| apps/backend/src/repositories/documentCoordination.repository.js | Gate, writer/IO persistence, reservation, evaluator, recovery reads | Atomicity dan fail-closed persistence | Tinggi |
| apps/backend/src/services/documentAdmission.service.js | Async context/token, continuation fencing, guard, authorization | Lifecycle drain yang terikat operasi awal | Tinggi |
| apps/backend/src/repositories/document.repository.js | Guard transaksi, DB outcome evidence, receipt gate | SQL coordination tanpa mengubah hasil workflow | Tinggi |
| apps/backend/src/repositories/audit.repository.js | Gate untuk append Document audit | Tidak ada late document audit mutation setelah confirmed | Sedang |
| apps/backend/src/repositories/notification.repository.js | Gate create/read/delete/bulk; update hanya selected identities | Lindungi stale/bulk writes | Sedang |
| apps/backend/src/repositories/project.repository.js | Sorted gates, target recheck, bounded bulk UPDATE | Project Close all-or-none pada konflik | Tinggi |
| apps/backend/src/repositories/sla.repository.js | Gate upsert | Lindungi scheduler/post-commit SQL | Sedang |
| apps/backend/src/repositories/temporaryUpload.repository.js | Read-only expired-record recheck | Hindari cleanup berdasarkan stale candidate | Rendah |
| apps/backend/src/services/document.service.js | Create/action lifecycle, detail guard | Coverage create/edit/archive/restore dan nested reads | Tinggi |
| apps/backend/src/services/revision.service.js | Admission wrapper | Revision dan Admin Edit dalam lifecycle awal | Tinggi |
| apps/backend/src/services/approval.service.js | Admission wrapper | Approval A/B/C termasuk post-commit processing | Tinggi |
| apps/backend/src/services/workflowAttachment.service.js | Admission dan nested download guard | Attachment finalize dan akses file | Sedang |
| apps/backend/src/services/fileAccess.service.js | Guard sesudah membership, sebelum storage access | Preview/download/revision protection | Sedang |
| apps/backend/src/services/storage.service.js | Durable wrapper finalize/copy/move/put/delete | Tracking tanpa mengubah adapter semantics | Tinggi |
| apps/backend/src/services/upload.service.js | Matching consume/discard claim | Temporary ownership/fencing | Sedang |
| apps/backend/src/services/temporaryUploadCleanup.service.js | Claim, fresh expiry check, outcome evidence | Cleanup vs finalize coordination | Sedang |
| apps/backend/tests/helpers/isolatedDocumentCoordination.cjs | Fail-closed VM loader, transactional-lock/pool doubles | Test source coordinator tanpa DB/storage nyata | Test only |
| apps/backend/tests/helpers/documentCoordinationMock.js | Technical dependency doubles | Pertahankan business regression fixtures | Test only |
| apps/backend/tests/helpers/isolatedHttpRegression.cjs | Hanya ephemeral test-owned loopback HTTP | HTTP integration tanpa live application endpoints | Test only |
| apps/backend/tests/helpers/isolatedEmailRegression.cjs | Blokir evidence DB dan temporary storage juga | Isolasi runtime dependencies | Test only |
| apps/backend/tests/helpers/approvalEmailLoader.js | Tambah transparent admission/continuation dependency double | Assertion email existing tetap dipertahankan | Test only |
| apps/backend/tests/unit/documentAdmission.test.js | 42 foundation/fault/concurrency model tests | Gate/drain/unknown/restart/fencing/pool model | Test only |
| apps/backend/tests/unit/documentWriterCoordination.test.js | 19 module coordination tests | SQL, create, archive/restore, bulk close dan cleanup | Test only |
| apps/backend/tests/unit/documentAdmission.http.test.js | Real route/middleware/controller guard test | 18 read/action paths, envelope, 401/403/isolation | Test only |
| apps/backend/tests/unit/adminDocumentEdit.test.js | Fixture technical dependency | Existing assertions tidak dilemahkan | Test only |
| apps/backend/tests/unit/approvalAutomaticComment.test.js | Fixture technical dependency | Existing assertions tidak dilemahkan | Test only |
| apps/backend/tests/unit/uploadCommitFailureBaseline.test.js | Transparent technical dependency double | Reproduksi baseline HOLD tetap dipertahankan | Test only |
| database/migration/20261102_0001_permanent_delete_foundation.sql | Lima tabel additive | Persistence teknis Sprint A | Tinggi sebelum runtime verification |
| database/migration/20261102_0001_permanent_delete_foundation_ROLLBACK.md | Applicability, lock boundary, rollback dan maintenance limits | Operational safety | Dokumentasi |
| database/migration/reports/20261102_0001_permanent_delete_sprint_a_validation.md | Laporan ini | Evidence dan conditions | Dokumentasi |

## D. Writer Coverage Matrix

PASS pada tabel ini mengacu pada pengujian terisolasi, bukan database nyata.

| Writer | Admission | Durable Tracking | Quiescence | Test |
|---|---|---|---|---|
| Create Document | Per document baru sebelum mutation | Lifecycle, IO, DB outcome | Sampai post-commit processing selesai | PASS: actual service + baseline |
| Upload Revision / Admin Edit | Wrapper, single-use delegation | Lifecycle dan IO termasuk cleanup | Sampai notification/SLA/audit selesai | PASS: existing regression + foundation + HTTP |
| Approval A/B/C / workflow comments | Wrapper | Lifecycle, revision move, attachment IO | Termasuk post-commit producers | PASS: approval/comment/email regression, guard, top-level temp claim |
| Workflow Attachment | Wrapper dan temp claim | Lifecycle, finalize/compensation | Tidak selesai hanya karena SQL rollback | PASS: existing attachment regression + HTTP/foundation |
| Metadata edit | Wrapper | SQL lifecycle; IO hanya jika ada file | Termasuk SLA/notification/audit continuation | PASS: Admin/Owner regression dan SQL drain |
| Archive/Restore | Wrapper | SQL lifecycle, tanpa storage IO record | Sampai audit append selesai | PASS: actual services + HTTP |
| Comment read receipts | Gate dalam transaksi | Tanpa storage registry | Lock sampai statement commit | PASS: actual repository + HTTP |
| SLA persistence | Gate pada upsert | Tanpa storage registry; mewarisi token bila producer writer lama | Scheduler baru tidak melewati gate; closed context ditolak | PASS: actual repository + drain tests |
| Notification create/read/delete/bulk | Gate per target, urutan konsisten | Tanpa storage registry; mewarisi lifecycle caller | Semua target harus diizinkan sebelum mutation | PASS: actual repository, mixed-target bulk conflict |
| Document Audit Trail append | Gate pada insert; audit historis tetap retained | SQL lifecycle caller bila tersedia | Tidak ada append baru dari closed token | PASS: actual repository/create/archive/restore |
| Project Close | Sorted target coordinator locks sebelum business rows | SQL transaction saja | Reservation menunggu commit; konflik abort seluruh close | PASS: actual repository, fake persistence |
| Temporary consume/discard/cleanup | Durable unique temp claim | IO evidence dan unknown SQL outcome | Unknown claim tidak dilepas otomatis | PASS: actual cleanup/consume + claim race tests |

Scheduled candidates dibaca di luar gate, tetapi final persistence selalu memperoleh guard. Detached approval email callback hanya membaca document data dan mengirim email; tidak diberi hak menulis document-owned SQL/storage. Email behavior tidak diubah.

## E. Guard Coverage Matrix

| Operation | Guard | HTTP Contract | Test |
|---|---|---|---|
| Detail/history/comments/revisions | Shared detail guard setelah akses project | 409 + exact code/message | PASS HTTP |
| Preview/download active file | Membership lalu document guard sebelum storage inspection | Sama | PASS HTTP |
| Nested revision view/download | Parent document scope | Sama | PASS HTTP |
| Nested workflow attachment download | Parent scope setelah membership | Sama | PASS HTTP |
| Edit/revision/approval A/B/C/attachment | Admission sebelum handler mutation | Sama | PASS HTTP |
| Archive/Restore/read receipts | Admission atau atomic SQL guard | Sama | PASS HTTP |
| Repeated internal reservation | Same identity mengembalikan operation existing; identity lain 409 | Sama untuk konflik | PASS unit |
| Other document | Tidak ikut ditutup | Normal response | PASS HTTP dan unit |
| Other project | Gate terpisah; reservation cross-project forbidden | 403 | PASS unit; tidak ada public reservation route |

HTTP harness menguji 401, permission/membership 403, 18 jalur dengan 409 dan response envelope, serta 200 untuk dokumen lain. Request yang sudah melewati read admission sebelum reservation dapat menyelesaikan pembacaan; stream existing tidak dibatalkan dan byte yang sudah terkirim tidak dapat ditarik kembali. List/dashboard tetap tersedia. Tidak ada frontend guard atau toast ditambahkan.

## F. Migration Review

- Additive: hanya CREATE TABLE untuk document_admission_coordinators, document_delete_operations, document_writer_operations, document_storage_io_steps, document_delete_file_manifest.
- PK/unique: composite coordinator identity, satu operation per target Sprint A, request identity per target, active temporary claim, dan exact-key hash identity pada manifest.
- Index mendukung pencarian pending operation, target writer/lifecycle, serta IO per writer/state. Semua tabel menggunakan InnoDB dan UTC timestamp yang ditulis repository.
- Tidak ada FK ke business document, sehingga technical evidence tetap ada setelah future hard delete. Tidak ada cascade deletion. Tidak ada FK IO-to-writer yang dapat membuat evidence persistence menunggu writer lock dari transaksi lain.
- CHECK membatasi state; expression generated STORED untuk active temporary claim ditargetkan ke MySQL 8+ dan MariaDB 10.4.32. Review ini bersifat statis, bukan hasil execution terhadap kedua engine.
- Tidak mengubah business tables, canonical schema, workflow status, role/permission, Audit Trail schema atau seed.
- Execution status: NOT EXECUTED. Tidak menambahkan startup migration/seed.
- DDL implicit commit; rollback otomatis tidak disediakan. Jangan drop evidence atau revert ke kode yang mengabaikan gate ketika operation/writer belum terminal. Rincian ada pada rollback considerations.

## G. Test Results

Command final dari repository root:

```powershell
$tests = @(rg --files apps/backend/tests/unit -g '*.test.js')
node --require ./apps/backend/tests/helpers/isolatedHttpRegression.cjs --test @tests
```

| Validation | Result | Evidence / Batas |
|---|---|---|
| Seluruh 11 file unit/regression | PASS | 269 tests, 0 fail, 0 skipped, 0 cancelled |
| Foundation/fault/concurrency model | PASS | 42 tests pada documentAdmission.test.js |
| Existing module coordination | PASS | 19 tests pada documentWriterCoordination.test.js |
| HTTP integration | PASS | Lima HTTP regression existing dan satu guard matrix test, seluruhnya termasuk total 269 |
| Syntax | PASS | 29 changed/new JS/CJS files diperiksa dengan node --check |
| Whitespace | PASS | git diff --check; Git hanya memberi peringatan konversi LF/CRLF |
| MySQL/MariaDB migration/concurrency | NOT EXECUTED | Tidak tersedia target DB test terisolasi; docker/mysqld/mariadbd/mysql/mariadb tidak ditemukan melalui PATH. Tidak menggunakan DB utama sebagai pengganti |
| Live R2 / actual filesystem fault test | NOT EXECUTED | Provider fault disimulasikan; tidak ada live storage operation |

Fault injection mencakup unknown COPY/late completion, disconnect/rollback, unknown compensation yang error-nya disuppress, intent/completion persistence failure, crash/restart, closed token retry, duplicate/concurrent reservation, detached SQL/IO continuation dan bounded business/evidence pool model.

Assertion existing tidak diubah agar PASS. Fixture business regression diberi dependency double teknis; concurrency/IO safety diuji terpisah dengan source coordinator yang sebenarnya dan persistence doubles. HTTP preload hanya membuka listener port 0 pada 127.0.0.1 dan hanya mengizinkan koneksi ke port milik test tersebut. Runtime dotenv, database clients, R2/email provider, dan koneksi eksternal tetap diblokir.

## H. Remaining Risks

### 1. Critical Blocker

Tidak ditemukan critical implementation issue tambahan pada review statis dan pengujian terisolasi terakhir. Ini bukan bukti bahwa seluruh behavior database runtime telah tervalidasi. Kesiapan deployment tetap bersyarat pada pengujian engine nyata dan migration verification.

### 2. Sprint B Dependency

Manifest saat ini hanya persistence schema, belum preparation/finalization. Physical cleanup, metadata hard delete, recovery orchestration, terminal operation lifecycle, ownership verification untuk legacy/cross-document keys, retention, Delete audit final event dan Delete notifications tetap Sprint B atau sprint berikutnya sesuai persetujuan owner. Tidak ada worker/scheduler atau public Delete route.

### 3. Development Reset Operational Limitation

> Development Reset is a development-only destructive maintenance utility. It must be executed exclusively with all application writers stopped and no unresolved storage operations. Concurrent execution with normal application activity is unsupported. Maintenance coordination is outside Sprint A scope.

Pembatasan maintenance eksklusif belum ditegakkan secara teknis. Tidak ada klaim aman concurrent. Development Reset source tidak diubah; existing APP_ENV guard menolak environment selain development. Storage-smoke tetap utility maintenance, bukan recovery Delete.

### 4. HOLD Workstream

General upload recovery dan COMMIT/R2 compensation recovery tetap HOLD. uploadCommitFailureBaseline PASS berarti reproduksi kelemahan existing tetap terdeteksi, bukan kelemahan tersebut diperbaiki. Tracking tidak mengubah keputusan cleanup existing; ketidakpastian tetap menahan quiescence. Unknown writer dapat pending tanpa batas sampai ada prosedur recovery yang disetujui.

### 5. Validation Gaps

Belum ada pengujian InnoDB multi-connection, real lock/deadlock behavior, real transaction isolation, actual migration syntax execution atau network-level provider timeout. Pool starvation test menggunakan bounded doubles, bukan server database. Tidak ada koneksi ke main development DB, Railway atau production.

## I. Regression Safety Confirmation

Business workflow A/B/C, revision numbering, SLA calculation/reset, notification recipient rules, Archive/Restore, Project Close business conditions, RBAC role definitions, filename/key naming, dan adapter upload/download semantics tidak diubah. Perubahan existing paths hanya berupa coordination, durable evidence, fencing dan guard. Audit payload/sanitization/retention tetap; insert Document audit kini melewati gate.

Frontend, environment files, developmentReset.service.js, seed, canonical schema dan Source of Truth tidak diubah. Tidak ada actual Permanent Delete, actual file deletion, database mutation, migration execution, Delete notification, final Delete audit, production deployment, commit atau push oleh pekerjaan ini. HTTP request hanya ke aplikasi test terisolasi, bukan aplikasi lokal yang sedang berjalan.

## J. Final Verdict

**SPRINT A COMPLETE WITH CONDITIONS**

Fondasi kode dan automated tests terisolasi selesai. Sebelum backend baru digunakan, wajib review migration dan jalankan execution/verification serta concurrency pada database terisolasi dengan persetujuan terpisah. Status ini bukan READY FOR PRODUCTION DEPLOYMENT. Tidak melanjutkan Sprint B/C/D/E.
