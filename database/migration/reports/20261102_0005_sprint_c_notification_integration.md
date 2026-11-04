# Sprint C - Permanent Delete Notification Integration

Tanggal: 2 November 2026. Scope: backend in-app notification setelah durable Permanent Delete completion.

## Implementation

### Targeted Audit

- Source yang dibaca: `docs/source-of-truth/BUSINESS-WORKFLOW.md`, `ENGINEERING-FOUNDATION.md`, `PRD.md`, dokumentasi architecture/database/backend yang relevan, laporan Sprint B 0004, notification repository/service, membership repository, completion/final Audit, dan frontend notification target guards.
- BUSINESS-WORKFLOW mengharuskan project isolation dan notifikasi sebagai hasil business event. PRD mempertahankan baseline CR-009 Archive/Restore serta deprecated operational Delete. Sprint C mengikuti persetujuan terbatas Permanent Delete internal Sprint A/B/C, tanpa mengubah Archive/Restore, workflow, atau UI operasional.
- `notifications` sudah mendukung stable unique identity, project/recipient/membership, event/title/message, nullable navigation fields, dan metadata. `document_delete_executions.completion_snapshot` dapat menyimpan durable recipient/delivery state. Tidak perlu schema change atau migration baru.
- Notification repository existing memiliki read/list/delete berdasarkan project dan recipient. Notification ber-resource `Document` juga terkena admission fence; karena dokumen sudah dihapus, informational event baru memakai resource type `Document Delete`, bukan live `Document`.

### Trigger, Recipients, and Recovery

1. Pada transaksi final Delete, active membership dan active user untuk project target diambil dengan locking read dan disimpan dalam completion snapshot. Official Role berasal dari `project_memberships.official_role`; kelima role, termasuk Viewer dan Admin actor yang masih eligible, tercakup. User ID dideduplikasi.
2. Snapshot penerima, final Audit, hard-delete metadata, dan phase `COMPLETED` menjadi durable pada commit yang sama. Penerima tidak dihitung ulang dari current membership ketika delivery diulang.
3. Engine melepas koneksi transaksi Delete sebelum menjalankan notification dispatcher. Dispatcher selalu membaca ulang phase `COMPLETED` yang sudah committed; admission/manifest/partial cleanup bukan trigger sukses.
4. Snapshot memuat `notificationDelivery.version`, `state`, `recipients`, dan `deliveredUserIds`. Ini ledger kecil dalam sidecar existing, bukan notification subsystem atau outbox table baru.
5. Satu transaksi delivery mengunci execution row, membuat satu in-app row melalui shared notification insert primitive, lalu menyimpan receipt penerima. Row notifikasi dan receipt commit bersama.
6. Stable identity adalah `permanent-delete:<operationId>:<recipientUserId>`, ditopang `notifications.identity_key` unique. Notification ID juga deterministik. Concurrent workers diserialisasi oleh execution row lock.
7. Jika gagal sebelum commit, insert/receipt rollback bersama. Jika commit berhasil tetapi response hilang, receipt tetap membuktikan delivery pada retry. Kegagalan delivery tidak mengubah phase Delete atau Audit; engine tetap mengembalikan `COMPLETED` dengan notification status `PENDING`.
8. Receipt dipertahankan walaupun pengguna menghapus notifikasinya, sehingga retry tidak menghidupkan kembali notifikasi yang telah dihapus.
9. `createDeleteNotificationDispatcher({ pool }).dispatch(operationId)` tersedia untuk retry/recovery internal, dan engine otomatis mencoba delivery lagi saat resume Completed. Tidak menambahkan scheduler, endpoint publik, atau mekanisme email.
10. Realtime hint memakai publisher existing setelah recipient commit, dengan scope user-project, notification resource ID, dan tanpa deleted-document target. Database notification tetap authoritative; realtime hint bersifat best effort.

### Content and Navigation

- Event/title: `Document Permanently Deleted`.
- Message: `Document <Document Number> has been permanently deleted by an Administrator.`
- Metadata: notification type, project ID, `deletedDocumentNumber`, Delete operation ID, actor ID, dan persistent UTC completion timestamp.
- Tidak memasukkan reason bebas, inventory, storage key, bucket/account detail, atau credential.
- `related_resource_id`, `related_document_number`, dan `action_target` semuanya NULL. Document Number tetap ada dalam message dan metadata.
- Alasannya: dua komponen frontend existing mengaktifkan Open Document jika salah satu dari tiga field tersebut terisi. Mengisi `related_document_number` akan menimbulkan target ke dokumen yang sudah tidak ada. Bentuk informational payload ini membuat guard existing false tanpa perubahan frontend; perilakunya diuji memakai fungsi guard dari kedua source komponen aktual.
- Read/delete tidak memerlukan live document atau membuka admission gate yang sudah ditutup.

### Files Changed in This Sprint

| File | Perubahan |
| --- | --- |
| apps/backend/src/repositories/notificationWrite.repository.js | Shared insert primitive; legacy tetap INSERT IGNORE, Delete delivery memakai strict transactional insert |
| apps/backend/src/repositories/notification.repository.js | Delegasi query insert existing ke primitive yang sama; read/delete dan admission behavior dari Sprint sebelumnya dipertahankan |
| apps/backend/src/repositories/documentDeleteNotification.repository.js | Recipient snapshot, informational DTO, stable identity, duplicate reconciliation |
| apps/backend/src/repositories/documentDelete.repository.js | Persist recipient/delivery snapshot dalam transaksi completion existing |
| apps/backend/src/services/documentDeleteNotification.service.js | Post-completion dispatcher, per-recipient atomic receipt, retry/concurrency, post-commit realtime hint |
| apps/backend/src/services/documentDelete.service.js | Trigger setelah core completion/koneksi dilepas; notification error tidak menurunkan Completed; timestamp tetap dari completion snapshot |
| apps/backend/tests/unit/documentDeleteNotification.test.js | Delapan unit test baru |
| apps/backend/tests/integration/sprintCNotificationScenarios.cjs | Delapan belas skenario Sprint C pada repository/service aktual |
| apps/backend/tests/integration/sprintCNotificationValidation.cjs | Entry point terisolasi, reuse hardened runner dan baseline Sprint B |
| apps/backend/tests/integration/sprintBDatabaseValidation.cjs | Report fase baru, tracked notification IDs, managed query adapter, optional Sprint C scenarios |
| apps/backend/tests/integration/sprintADatabaseValidation.cjs | Report fase baru dan allowlist shared insert primitive yang direview |
| apps/backend/tests/integration/finalizeSprintBInstance.cjs | Final integrity/result verification untuk Sprint C, lalu isolated shutdown |

Tidak menambah migration, tabel/kolom, npm dependency, email integration, atau public Delete route. Working tree sudah memuat perubahan Sprint A/B sebelumnya; perubahan tersebut tidak direvert atau dianggap sebagai edit baru Sprint C.

## Validation

Environment: MariaDB 10.4.32, `127.0.0.1:13317`, server ID 13317, datadir `tmp/mariadb-sprint-b-20261102/data`. Destructive assertions hanya memakai database `edms_sprint_b_isolated`, UUID/run-prefixed fixtures, fake R2, dan test-owned local filesystem sandbox.

| Validation | Result | Evidence |
| --- | --- | --- |
| Backend unit tests | 310 PASS, 0 FAIL, 1 SKIP; 311 total | Existing isolated preload, seluruh unit test; delapan tambahan Sprint C PASS |
| Sprint A isolated regression | 18 PASS | 20261102_0005_sprint_a_isolated_results.json |
| Sprint B isolated regression | 30 PASS | 20261102_0005_sprint_b_isolated_results.json |
| Sprint C integration | 18 PASS | 20261102_0005_sprint_c_isolated_results.json memuat 30 baseline Sprint B + 18 Sprint C = 48 PASS |
| JavaScript/CJS syntax | 53 file PASS | node --check pada modified/untracked JavaScript/CJS |
| Diff whitespace | PASS | git diff --check |
| Final restore/identity/shutdown | PASS | 20261102_0005_isolated_final_verification.json |

Satu SKIP adalah uji file symlink Sprint B karena privilege Windows tidak tersedia, bukan test Sprint C. Semua skenario Sprint C benar-benar dijalankan dan PASS.

| Sprint C Scenario | Result |
| --- | --- |
| C01 Completed, kelima active roles, Admin actor/Viewer, exclude inactive/nonmember/other project | PASS |
| C02 Pending tidak membuat notifikasi sukses | PASS |
| C03 Failed finalization rollback tidak membuat notifikasi sukses | PASS |
| C04 Unknown storage outcome tidak membuat notifikasi atau mengulang delete tak pasti | PASS |
| C05 Recovery Completed menghasilkan notifikasi | PASS |
| C06 Repeated completion tidak menduplikasi event/recipient/final Audit | PASS |
| C07 Concurrent notification workers tidak menduplikasi user | PASS |
| C08 Partial insert failure rollback dan recovery hanya mengisi penerima tersisa | PASS |
| C09 Completion-time recipient snapshot tidak berubah akibat membership baru/inactive sesudah completion | PASS |
| C10 Document Number persisten setelah hard delete; navigation guards existing false | PASS |
| C11 Historical Audit utuh; final Audit tepat satu setelah notification failure/retry | PASS |
| C12 Individual read tetap benar dan menolak recipient lain | PASS |
| C13 List, summary, mark-all-read tetap project/recipient scoped | PASS |
| C14 User-deleted notification tidak muncul kembali saat resume/dispatch | PASS |
| C15 Bulk delete tidak menghapus notifikasi project/recipient lain | PASS |
| C16 Membership dihapus setelah completion: frozen recipient tetap menerima, membership FK aman | PASS |
| C17 Notification failure tidak demote completion atau menjalankan ulang physical cleanup | PASS |
| C18 Tidak memuat email/Resend provider atau mengirim production email | PASS |

Dua masalah harness pada run awal ditangani tanpa melemahkan assertion: managed pool belum menyediakan `query()` yang dipakai pagination, dan allowlist Sprint A belum mengenali shared insert primitive yang baru. Failed evidence disimpan di `20261102_0005_sprint_c_initial_results.json` dan `20261102_0005_sprint_a_initial_results.json`; hasil akhir berasal dari full rerun.

## Safety

- Main XAMPP instance/database `edms_smpv_dev` dan `edms_db` tidak diakses melalui SQL atau dimodifikasi oleh pekerjaan ini. Tidak restart/repair/reset original instance.
- Tidak ada real document/attachment/storage yang dihapus atau dimodifikasi.
- Tidak mengakses Railway atau live R2; seluruh R2 requests menggunakan fake adapter.
- Tidak mengaktifkan Resend, mengirim email nyata, atau membaca runtime production environment.
- Tidak ada frontend/source UI changes, workflow/SLA/revision/Archive/Project Close/RBAC changes, atau public Delete endpoint.
- Tidak menjalankan migration baru/main-database migration, seed, reset, commit, push, atau deployment.
- Ketiga database restore masing-masing tetap 24 tabel/1.231 baris, per-table counts tidak berubah. Original backup SHA-256 tetap sama; akun synthetic tetap ditolak membaca database restore.
- Final verification memastikan active command lain nol sebelum isolated shutdown; instance test dihentikan normal. Datadir/fixture test dipertahankan, tidak direset.

## Verdict

**SPRINT C COMPLETE**

Semua DoD Sprint C terpenuhi berdasarkan unit dan integration evidence aktual. Batasan Sprint B tidak dibuka kembali dan bukan blocker Sprint C.

Completion sebelum Sprint C yang tidak mempunyai recipient snapshot dikembalikan sebagai `LEGACY_NOT_PREPARED`, bukan menebak penerima historis dari current membership. Tidak melakukan retroactive notification/backfill pada data lama.

STOP setelah Sprint C. Tidak melanjutkan Sprint D/E, expose Delete, atau deployment tanpa persetujuan owner terpisah.
