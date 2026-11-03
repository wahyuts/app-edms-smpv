# Permanent Delete - Legacy Reconciliation and Upload Provenance

Tanggal: 3 November 2026. Scope: implementation, isolated fixture/mock tests, dan read-only dry-run pada XAMPP utama. Tidak ada migration atau binding apply.

## 1. Implementation Summary

- CLI administratif baru default dry-run, dengan config namespace eksplisit dan hasil per-file VERIFIED/MISSING/AMBIGUOUS/BLOCKED.
- Reuse inventory ownership/shared references/alias checks dari Delete repository Sprint B; tidak membuat inventory keamanan paralel.
- Apply tersedia tetapi belum dijalankan. Membutuhkan laporan yang direview, approval digest, confirmation string, dan active project Admin. Tidak menggunakan users.position/global role sebagai otoritas.
- Transaksi apply per dokumen memakai coordinator gate Sprint A yang sama dengan admission/reservation. Fungsi lockGate diekstrak tanpa perubahan SQL/semantik ke repository kecil agar CLI tidak mengimpor runtime pools.
- Gate CLOSED, Delete operation, writer unresolved/aktif, atau IO belum settled menolak apply. Tidak membuat Delete reservation. Namespace/binding dan Audit Trail commit atomik; konflik ditolak, binding identik no-op.
- COMMIT acknowledgement failure pada reconciliation ditandai uncertainDocument; rollback tidak dianggap membatalkan commit yang mungkin sudah berhasil. Resume memakai verifikasi ulang dan tidak menduplikasi binding/audit.
- Upload tetap menggunakan insertStoredFile() dan transaksi bisnis existing. Setelah finalize berhasil, completeStoredFileProvenance() memverifikasi final key, namespace, size, SHA-256, serta native identity lokal sebelum commit.
- Namespace capture/provenance schema/binding failure tidak lagi dilewati sebagai upload sukses. Metadata-only edit tidak memanggil completion.
- Tidak mengubah upload COMMIT recovery yang sebelumnya HOLD. Regression baseline masih mereproduksi risiko existing: COMMIT applied + ACK lost dapat diikuti compensation pada file yang sudah direferensikan. Patch ini bukan penyelesaian workstream tersebut.

## 2. Files Changed in This Work

Working tree sudah memiliki perubahan Sprint A-E sebelum pekerjaan ini. Daftar berikut hanya file yang disentuh/ditambahkan pada pekerjaan provenance ini, bukan seluruh git diff terhadap HEAD.

| Area | File |
| --- | --- |
| New verification service | apps/backend/src/services/fileProvenance.service.js |
| New reconciliation service | apps/backend/src/services/legacyFileReconciliation.service.js |
| Shared gate extraction | apps/backend/src/repositories/documentGate.repository.js; apps/backend/src/repositories/documentCoordination.repository.js |
| Binding completion | apps/backend/src/repositories/storageNamespace.repository.js; apps/backend/src/repositories/document.repository.js |
| Storage facade | apps/backend/src/services/storage.service.js |
| Three upload paths | apps/backend/src/services/document.service.js; apps/backend/src/services/revision.service.js; apps/backend/src/services/workflowAttachment.service.js |
| Local inspector | apps/backend/src/storage/drivers/localStorage.driver.js; apps/backend/src/storage/native/WindowsExactFile.cs |
| Administrative CLI | apps/backend/scripts/reconcile-legacy-files.cjs |
| Explicit local config | apps/backend/scripts/legacy-reconciliation.local.example.json |
| Operational runbook | apps/backend/scripts/README-legacy-reconciliation.md |
| New tests | apps/backend/tests/unit/fileProvenance.test.js; apps/backend/tests/unit/workflowAttachmentProvenance.test.js |
| Regression fixtures/tests | apps/backend/tests/helpers/documentCoordinationMock.js; apps/backend/tests/helpers/isolatedDocumentCoordination.cjs; apps/backend/tests/unit/adminDocumentEdit.test.js; apps/backend/tests/unit/documentDelete.test.js; apps/backend/tests/unit/documentWriterCoordination.test.js; apps/backend/tests/unit/documentCoordinationMigration.test.js; apps/backend/tests/unit/uploadCommitFailureBaseline.test.js |
| This report | database/migration/reports/20261103_0008_legacy_reconciliation_upload_provenance.md |

## 3. New Upload Validation

| Flow | Result | Evidence |
| --- | --- | --- |
| Create Document | PASS in fixture | Existing transaction/commit fault tests call final provenance after finalize; injected provenance failure rolls back and compensates before commit. |
| Upload Revision / Admin revision | PASS in fixture | Status matrix preserved; native completion before commit; metadata-only skips completion; provenance failure preserves historical object and metadata. |
| Workflow Attachment | PASS in fixture | Actual service plus real binding/completion helpers; success, inspection failure, capture failure, binding failure; rollback and compensation verified. |
| Native local identity | PASS on Windows fixtures and existing-file read-only inspection | Pinned native root/file identity, size, SHA-256; extended-length path fixture verified without modification. |
| R2 descriptor/hash | PASS with provider mock | Actual driver pins configured descriptor and streams GetObject bytes; no live R2 access. |

Tidak menjalankan upload UAT melalui API/database utama karena scope utama hanya read-only/dry-run.

## 4. Actual Local Dry-Run

Target: 127.0.0.1:3306, edms_smpv_dev, 10.4.32-MariaDB, hostname DESKTOP-3DFA1TA, datadir D:\xampp\mysql\data\. Identitas proses XAMPP PID 31688 telah diperiksa read-only pada audit sebelumnya. Storage candidate root secara eksplisit: D:\Project\app-edms-smpv\apps\backend\storage.

Command yang benar-benar dijalankan dari repository root:

```powershell
node apps/backend/scripts/reconcile-legacy-files.cjs --config apps/backend/scripts/legacy-reconciliation.local.example.json --env-file apps/backend/.env --report tmp/legacy-reconciliation-local-dry-run-20261103-reviewed.json
```

| Check | Result |
| --- | --- |
| Total files | 47: 38 revision files, 9 workflow attachments |
| VERIFIED | 47 |
| MISSING / AMBIGUOUS / BLOCKED | 0 / 0 / 0 |
| Already bound | 0 |
| Eligible for apply | 47 |
| Namespace/binding writes | NONE |
| Main database tables snapshotted | 33 |
| Before/after schema and row digest | IDENTICAL |
| Apply / Permanent Delete | NOT EXECUTED |

Snapshot digest before dan after:

```text
a531bc0ca3d8b73ec9aaecbf76040c6ae627bc0fbe3e74905dce29d419a2b776
```

Approval digest laporan final (bukan otomatis approval owner):

```text
c3f90a7ac2c619de2431020d9f088fbd90a1b9dac099ef901f275770521a0dcf
```

Laporan JSON per-file disimpan lokal dalam tmp/ yang gitignored, tanpa credential/password. Ketiga file PFD-EDMS-0009 VERIFIED, tetap unbound. Tidak ada file yang belum eligible pada laporan final.

Dry-run pertama dengan inspector lama sempat melaporkan tiga MISSING pada path 262-269 karakter. Pemeriksaan read-only extended path membuktikan file ada; Win32 CreateFile belum memakai extended-length path. Patch dua pemanggilan CreateFile mempertahankan exact canonical handle/no-follow checks, lalu native inspector berhasil membaca ketiga file. Laporan awal dipertahankan lokal sebagai evidence, tetapi bukan laporan final untuk approval.

Snapshot identik membuktikan kesamaan data/schema pada dua observation windows, bukan bukti tidak pernah ada transient write dari aplikasi lain di antaranya. Database READ ONLY transaction dan SELECT-only inventory wrapper membatasi operasi CLI itu sendiri. Snapshot bukan backup.

## 5. Validation Results

| Validation | Result |
| --- | --- |
| All backend unit/regression tests with isolated HTTP preload | 364 total: 363 PASS, 0 FAIL, 1 SKIP |
| SKIP | Windows account lacks symbolic-link creation privilege; junction/reparse tests tetap PASS. |
| Namespace/hash/size/missing/shared/alias rejection | PASS in fixtures |
| Identical/conflicting binding; retry after audit failure; commit ACK loss | PASS in fixtures |
| Shared-gate fencing and existing admission/Delete regressions | PASS with isolated persistence doubles; no new MariaDB mutation integration run. |
| Four upload provenance-failure compensation paths + attachment fault cases | PASS in fixtures |
| JS/CJS syntax | PASS, 14 implementation/new-test files explicitly checked |
| git diff --check | PASS |
| Main database binding apply / Delete E2E | NOT EXECUTED |
| Browser/UI, frontend build | NOT RUN; no frontend changes in this work. |

Full regression command: enumerate apps/backend/tests/unit/*.test.js with rg, then node --require ./apps/backend/tests/helpers/isolatedHttpRegression.cjs --test against that list. Preload rejects real DB/provider/network clients; native fixture tests touch only test-owned temporary files. No isolated MariaDB instance was created or started.

## 6. Remaining Risks and Operational Gates

- Apply is reviewed code and fixture-tested, not actual MariaDB-applied/UAT-tested. Owner approval is still required before any binding apply or Delete E2E.
- Existing file history is not inferred from the active environment. Operator approval of explicit namespace candidates and per-file hash/ownership evidence remains the administrative trust boundary.
- Local Linux/Railway Volume lacks an equivalent inspector/safe-delete adapter. No fallback unlink and no Completed claim. Mandatory upload provenance also fails closed there; do not deploy this upload change to a Linux local-storage environment before the separate adapter work is approved and implemented. Windows/NTFS and mocked R2 are the validated targets here.
- Real Railway/R2 environments, credentials, objects, and deployment are NOT VERIFIED/NOT ACCESSED. R2 GET/hash inspection adds latency, IO cost, and transaction lock duration. Full database snapshots should be capacity-reviewed before using the administrative CLI on large databases.
- The original upload COMMIT ACK-loss risk remains unchanged and reproducible in baseline regression tests. It must not be confused with the tested idempotent reconciliation resume behavior.
- Existing namespace identity can change after a filesystem restore/root recreation. Such mismatch remains BLOCKED and requires reviewed reconciliation, not silent rebinding.

## 7. Safety and Final Verdict

```text
Main Database: READ-ONLY INSPECTION / DRY-RUN ONLY
Legacy Binding Apply: NOT EXECUTED
Permanent Delete on Main Database: NOT EXECUTED
Existing Physical Files: NOT MODIFIED / MOVED / DELETED
Migration / Reset / Repair: NOT EXECUTED
Railway / Live R2: NOT ACCESSED
Frontend / UI / Business Workflow: UNCHANGED IN THIS WORK
Commit / Push / Deployment: NOT PERFORMED
```

**READY FOR OWNER REVIEW** for Windows local and the mocked R2 implementation. This verdict is not approval for binding apply, online deployment, Linux local storage, or Permanent Delete E2E. STOP pending owner review.
