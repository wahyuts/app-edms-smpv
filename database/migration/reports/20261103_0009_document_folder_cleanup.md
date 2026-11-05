# Permanent Delete - Document Folder Cleanup

Tanggal: 3 November 2026. Scope: targeted implementation, fixture tests, dan local residual read-only dry-run. Tidak menjalankan Permanent Delete atau residual apply pada database/storage utama.

## 1. Root Cause

Engine existing membersihkan exact file pada durable manifest, lalu memfinalisasi metadata dan COMPLETED. Tidak ada tahap empty-directory cleanup. Pada R2 tidak ada physical directories; prefix menghilang bila tidak ada object tersisa. Marker merupakan object sungguhan dan tidak boleh dianggap aman hanya karena key berakhiran slash atau size nol.

## 2. Implemented Scope

| Area | Implementation |
| --- | --- |
| Exact scope | utils/documentFolder.js memvalidasi projects/<project>/documents/<document>/ dan menurunkan target dari manifest namespace/key, bukan menebak root. |
| Windows | Native WindowsExactFile helper ditambah mode tree: pin ancestors dan directory handles, inspect identities, enumerate no-follow, delete hanya empty directories bottom-up sampai document root. |
| Local adapter | inspectDocumentFolders dan cleanupDocumentFolders memverifikasi namespace/root dan document boundary. Missing tree idempotent; replacement/new directory/unknown file tetap blocked. |
| R2 | ListObjectsV2 exact bucket/prefix, semua pagination, bounded resources. Empty prefix clean tanpa DELETE. Semua unknown objects dan marker dipertahankan. |
| Automatic lifecycle | Folder plan tersimpan sebelum file IO, RUNNING durable setelah semua file terminal, CONFIRMED setelah storage verified clean. Finalizer menolak folder state/digest belum confirmed. |
| Historical operations | Completed tidak dibuka ulang. Residual cleanup memakai separate ledger dalam execution.inventory, tidak mengganti completion_snapshot/phase/waktu completion. |
| Residual CLI | cleanup-residual-document-folders.cjs default read-only dry-run; explicit report/digest/Admin/confirmation untuk apply. Main apply NOT EXECUTED. |

State tambahan memakai JSON execution.inventory yang sudah tersedia; tidak ada schema migration. File cleanup, file numbering, workflow, SLA rules, Archive/Restore, RBAC, serta UI tidak diubah. Legacy unfinished executions tanpa folder plan tetap Pending, bukan auto-upgrade tanpa provenance.

## 3. Files Changed

- apps/backend/src/utils/documentFolder.js (baru)
- apps/backend/src/services/documentFolderCleanup.service.js (baru)
- apps/backend/src/services/residualDocumentFolders.service.js (baru)
- apps/backend/src/services/documentDelete.service.js
- apps/backend/src/repositories/documentDelete.repository.js
- apps/backend/src/services/storage.service.js
- apps/backend/src/storage/drivers/localStorage.driver.js
- apps/backend/src/storage/drivers/r2Storage.driver.js
- apps/backend/src/storage/windowsExactFile.js
- apps/backend/src/storage/native/WindowsExactFile.cs
- apps/backend/scripts/cleanup-residual-document-folders.cjs (baru)
- apps/backend/scripts/README-residual-document-folders.md (baru)
- apps/backend/tests/helpers/deleteStorageDrivers.cjs
- apps/backend/tests/unit/documentFolderCleanup.test.js (baru)
- apps/backend/tests/unit/documentFolderLifecycle.test.js (baru)
- apps/backend/tests/unit/residualDocumentFolders.test.js (baru)
- database/migration/reports/20261103_0009_document_folder_cleanup.md (laporan ini)

Perubahan Sprint sebelumnya yang sudah ada di dirty working tree tidak di-revert dan bukan bagian baru dari laporan ini.

## 4. Local Residual Inventory

Target terverifikasi: 127.0.0.1:3306 / edms_smpv_dev, MariaDB 10.4.32, storage root D:\Project\app-edms-smpv\apps\backend\storage. Ada empat historical COMPLETED executions dengan durable operation, manifest, successful file attempts, dan Delete Audit Trail.

| Historical Document | Result | Directories | Evidence |
| --- | --- | --- | --- |
| PFD-EDMS-0009 | ELIGIBLE_EMPTY_TREE | 5 | Empty native tree, namespace/root identity dan durable ownership cocok. |
| PFD-EDMS-0007 | ELIGIBLE_EMPTY_TREE | 5 | Empty revision tree, namespace/root identity dan durable ownership cocok. |
| PID-EDMS-0010 | ELIGIBLE_EMPTY_TREE | 3 | Empty native tree, namespace/root identity dan durable ownership cocok. |
| PID-EDMS-0015 | AMBIGUOUS | Tidak diotorisasi | FOLDER_LIVE_REFERENCE: nomor dokumen dipakai dokumen aktif baru DOC-PID-2a9ec4e8-1742-4f5c-b84a-31a98e57000c, Process Review, Active; dua stored files memakai prefix tersebut. |

Summary: ELIGIBLE_EMPTY_TREE 3, BLOCKED_NONEMPTY 0, AMBIGUOUS 1, MISSING_OR_ALREADY_CLEAN 0. Total 13 direktori dalam tiga tree eligible, termasuk document roots. Tidak ada direktori yang dihapus pada storage utama.

Final report lokal (gitignored): tmp/residual-document-folders-20261103-final-dry-run.json.

```text
Approval digest (belum merupakan approval owner):
4b11abb2f757c6a1436326f04958a27cffab63b29cb7b9f13d65522fd27b2ad4

Database before/after digest, 33 base tables:
c54bcbf11140710b66b500c4c5a11044ad006732c95e795af9b9aa9b2fe8b7b6

Physical before/after digest, 44 files dan 93 directories:
8b06829de63ae488ed1c43d4f84f794b371f5609ae7837ba7b11537994958d9b
```

Physical snapshot memeriksa relative path, inode/device-related identity fields, creation/modified time, ukuran, dan SHA-256 semua regular files tanpa mengikuti symlink. Read access-time tidak digunakan sebagai klaim tidak berubah. Snapshot identik adalah bukti pada observation windows; tidak mengklaim membuktikan tidak pernah ada transient write dari proses lain. CLI sendiri dibatasi database READ ONLY dan SELECT-only pada dry-run.

## 5. Validation

Targeted set: documentFolderCleanup, documentFolderLifecycle, residualDocumentFolders, localExactCleanup, documentDelete, documentWriterCoordination, adminDocumentEdit, fileProvenance, workflowAttachmentProvenance.

| Check | Result |
| --- | --- |
| Targeted tests | 172 total: 171 PASS, 0 FAIL, 1 SKIP |
| SKIP | Windows file-symlink creation privilege tidak tersedia; junction/reparse protection tetap PASS. |
| Real Windows fixture cleanup | PASS: stage variants, attachments/nested empty tree, exact boundary, missing/retry, directory replacement, junction, concurrent insertion protection. |
| Unknown file preservation | PASS; file/image tak dikenal tidak dihapus. |
| R2 mock | PASS: no-marker empty prefix, complete pagination, unknown object, namespace/prefix mismatch. Verified-marker candidate tetap blocked karena capability belum terverifikasi. |
| Durable lifecycle | PASS in isolated fixtures: RUNNING before IO, CONFIRMED before finalizer, blocked/interruption Pending, replay/resume, historical Completed unchanged. |
| Residual CLI service | PASS in fixtures: completion/audit/manifest checks, live-reference ambiguity, recreated-directory rejection, intent/retry/audit idempotency, Admin and writer/IO gates. |
| Existing file deletion / upload / Archive / Restore | Selected regression fixtures PASS. Tidak mengulang full backend suite. |
| Syntax | 13 implementation/new-test JS/CJS files PASS; C# helper compiled and executed in Windows fixture tests. |
| git diff --check | PASS |
| Main-database mutation / storage cleanup / online UAT | NOT EXECUTED |

## 6. Limitations and Blocker

**BLOCKER untuk seluruh scope R2 marker deletion:** Tidak tersedia verified conditional marker-delete capability pada adapter existing. Pemeriksaan HEAD/ETag/zero-byte lalu DELETE tanpa guard yang terjamin dapat menghapus object pengganti. Implementasi sengaja tidak menambahkan unguarded DeleteObject ataupun melemahkan ownership. Branch ini perlu keputusan/desain capability provider yang terpisah sebelum bisa dinyatakan selesai; tidak ada live R2 test.

Dokumentasi resmi yang diperiksa untuk batasan ini: https://developers.cloudflare.com/r2/api/s3/api/ dan https://developers.cloudflare.com/r2/reference/consistency/. Conditional Put yang didokumentasikan tidak otomatis membuktikan conditional Delete pada adapter ini. Ini keterbatasan verifikasi implementasi, bukan klaim bahwa semua produk/API Cloudflare pasti tidak mampu melakukannya.

Windows local dan R2 empty-prefix handling sudah diimplementasikan/fixture-tested. Linux/UNC/non-NTFS tetap fail-closed, tanpa fallback recursive deletion. Legacy unfinished Delete tanpa persisted folder identities memerlukan recovery decision, sedangkan historical Completed memakai residual CLI dan tidak dilabel ulang. Belum ada MariaDB mutation integration atau browser UAT untuk lifecycle folder baru.

## 7. Final Verdict

**BLOCKED** untuk memenuhi keseluruhan requirement karena verified R2 marker deletion belum dapat diimplementasikan dengan capability yang terjamin. Local Windows automatic/residual empty-tree cleanup dan R2 no-marker prefix handling tersedia untuk review, dengan targeted tests dan local dry-run PASS.

Tidak menjalankan Permanent Delete atau residual apply pada main environment. Tidak mengubah data/schema database utama, physical files/directories utama, UI, workflow, atau environment configuration. Tidak mengakses live Railway/R2, melakukan migration/reset/repair, commit/push, atau deployment. STOP menunggu owner review; jangan memakai digest dry-run sebagai izin cleanup otomatis.
