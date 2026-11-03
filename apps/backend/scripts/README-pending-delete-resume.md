# Pending Permanent Delete Resume - Two Reviewed Operations

Scope: administrative CLI untuk dua operation existing yang disebut di bawah. Tidak membuat reservation atau idempotency key baru. Default dry-run. Implementasi ini hanya mengizinkan fixture tests, backup, dan live dry-run; live resume memerlukan persetujuan owner terpisah terhadap report/digest baru.

## 1. Dry-Run

Jalankan dari repository root. Output harus baru dan di luar live storage. Contoh sesuai backup yang sudah diverifikasi:

```powershell
node apps/backend/scripts/resume-pending-deletes.cjs `
  --config apps/backend/scripts/legacy-reconciliation.local.example.json `
  --env-file apps/backend/.env `
  --actor-user-id 1 `
  --operation-id 00aa58b7-fcc1-479b-88e7-9362e1c66dc9 `
  --operation-id a0b224f2-9bfe-43d0-a84a-aceefe8335b5 `
  --document-id DOC-PID-4bf29f17-828c-4a6a-a74a-8633c8b5b0de `
  --document-id DOC-PID-88283fe4-6abe-4fb4-810f-58b145160e11 `
  --backup-manifest tmp/delete-resume-backups/20261103T042710Z-68d33afd/backup-manifest.json `
  --report tmp/pending-delete-resume-preflight-NEW.json
```

Target wajib Windows, APP_ENV development, local driver, XAMPP MariaDB 10.4.32, `127.0.0.1:3306/edms_smpv_dev`, datadir `D:/xampp/mysql/data`, canonical storage root `D:/Project/app-edms-smpv/apps/backend/storage`. Tidak ada opsi remote, R2, actor lain, atau subset operation. Project harus SS-ALPHA-01 dan original actor 1 masih aktif sebagai Admin project.

Dry-run hanya SELECT di transaksi READ ONLY, tanpa GET_LOCK, row write locks, runtime app/server/pools, storage initialization, manifest persistence, atau engine resume. Native inspector existing berjalan dalam mode INSPECT; executable sementara dapat dibuat di OS temp, bukan file storage. Folder plan dan proposed manifest hanya in-memory. Snapshot seluruh schema/rows 33 tabel dan seluruh storage dibandingkan sebelum/sesudah. Perubahan concurrent atau backup tidak cocok menghasilkan BLOCKED. Snapshot bukan backup atau jaminan tidak pernah ada transient write dari proses lain.

## 2. Backups

`backup-manifest.json` memuat full logical dump, hasil verifikasi schema/individual INSERT row counts, completion footer, database snapshot, serta tujuh salinan file dengan relative storage paths, ukuran, SHA-256, dan original native identity. Backup berada di luar live storage; file sumber tidak dipindah atau diubah. CLI memverifikasi ulang delapan file backup, digest manifest, exact relative paths, tujuh distinct File IDs, source proof, dan database snapshot.

Backup manifest beserta database dump mengandung data sensitif: simpan lokal di tmp yang diabaikan Git. File copy memiliki native identity backup sendiri; `originalIdentity` adalah evidence file sumber, bukan identity backup yang disamakan secara palsu. Restore test tidak dijalankan.

## 3. Execute Only After Separate Owner Approval

Ulangi seluruh argumen scope/config/env/backup pada perintah dry-run di atas, tambahkan:

```powershell
--apply `
--approved-report tmp/pending-delete-resume-preflight-APPROVED.json `
--approval-digest OWNER_APPROVED_DELETE_RESUME_DIGEST `
--confirm RESUME_REVIEWED_PENDING_DELETES `
--report tmp/pending-delete-resume-apply-NEW.json
```

Fragmen ini belum merupakan approval. Digest metadata recovery sebelumnya TIDAK berlaku untuk Delete. SHA-256 report adalah integrity seal, bukan signature atau pengganti persetujuan owner. Jangan mengedit report atau mengganti key request awal; administrative path tidak memakai raw idempotency key sama sekali dan tetap mempertahankan operation identity/original actor.

Sebelum resume yang disetujui, backend/nodemon harus tetap berhenti dan backup harus tetap valid. CLI menolak perubahan global database/storage dari approved baseline, scope, actor, gate, reservation, file proof, backup, execution/manifest/attempt, atau unsettled IO. Tidak ada automatic retry atau fallback ke API publik.

## 4. Pre-Deletion Approval Checkpoint

Core `documentDelete.service.js` tidak diubah. Wrapper memakai existing hooks dan existing engine `resume(operationId)`:

1. Sebelum engine pertama, kedua inventory diverifikasi ulang; tidak ada execution/manifest/attempt.
2. Engine sendiri memperoleh advisory lock existing. Wrapper tidak memperoleh lock pesaing pada connection lain.
3. `beforeManifest` memvalidasi exact baseline sementara engine memegang claim.
4. `afterManifest`, sebelum file loop, memvalidasi phase, durable manifest digest, exact record keys/provider/file IDs/ownership evidence, original actor, inventory, namespace, physical proofs, dan folder plan terhadap approved report. Urutan random manifest IDs bukan perbedaan semantik; semua entries harus sama persis setelah diurutkan berdasarkan namespace/key.
5. Guard `deleteOwnedExact` tidak mendelegasikan ke storage existing tanpa checkpoint berhasil dan exact approved key/evidence. Checkpoint yang hilang tetap fail-closed, tanpa alternative deletion implementation.
6. `beforeFolderCleanup` memverifikasi seluruh file terminal, RUNNING folder intent, exact approved folder plan, root identity, tidak ada object tersisa atau directory identity baru. Folder cleanup hanya didelegasikan ke adapter existing.
7. Core tetap bertanggung jawab atas attempt ledger, filesystem deletion, SQL finalizer, Audit Trail, dan in-app notification delivery.

Callback inspeksi memakai koneksi READ ONLY terpisah; tidak menimpa transaksi engine. Perubahan metadata manual dari tool eksternal tetap tidak aman; semua pemeriksaan adalah snapshot plus native exact-delete verification, bukan filesystem transaction atomik lintas semua file.

## 5. Failure, Partial Outcome & Recovery

- File deletion bertahap dan tidak dapat di-rollback dengan SQL. Backup database saja tidak mengembalikan file fisik.
- PENDING, UNKNOWN, exception, checkpoint failure, atau notification pending menghentikan urutan; operation kedua tidak dijalankan jika operation pertama belum memenuhi hasil yang dipersyaratkan.
- Engine dapat telah menyimpan manifest/attempt sebelum checkpoint menolak atau sebelum crash. Jangan reset atau mengganti ledger.
- UNKNOWN/IN_FLIGHT atau COMMIT ACK loss memerlukan assessment read-only dan keputusan owner. Tidak otomatis retry, restore, atau membuka gate.
- Initial CLI ini mensyaratkan belum ada execution/manifest/attempt. Setelah interupsi, laporan initial tidak boleh dipaksakan ulang. Engine memiliki durable continuation semantics, tetapi kelanjutan tersebut memerlukan assessment/report/approval baru.
- Core hanya melewati file yang sudah SUCCEEDED + DELETED; unsafe outcomes tetap fail-closed. Folder-only continuation mengikuti exact identity/subset rules existing.
- Selesai dinilai dari execution phase COMPLETED. Reservation/gate serta historical pending reason bukan field yang di-reset wrapper. Notification delivery adalah side effect durable pasca-commit; kegagalan notification bukan alasan mengulang physical deletion.

## 6. Local Validation Boundary

Tests menjalankan service baru dan actual engine source dalam fixture in-memory, tanpa database/network/live storage. Storage fixture hanya memodelkan deletion; tidak menggunakan file UAT. Native Windows main-storage inspection hanya dilakukan dalam live dry-run. Actual live Delete execution belum dilakukan dan tidak diklaim PASS.
