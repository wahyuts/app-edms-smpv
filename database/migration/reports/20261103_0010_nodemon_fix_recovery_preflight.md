# Local Folder Cleanup - Nodemon Fix and Recovery Preflight

Tanggal: 3 November 2026. Scope: minimal development watcher fix, normal watcher shutdown, fixture validation, dan read-only recovery preflight. Tidak menjalankan residual apply, Permanent Delete, atau ledger mutation.

## 1. Minimal Fix

apps/backend/package.json:

```text
Before: nodemon src/server.js
After : nodemon --watch src src/server.js
```

Entrypoint tetap src/server.js; start/predev/dependencies tidak diubah. Nodemon --dump yang benar-benar dijalankan menghasilkan dirs hanya D:\Project\app-edms-smpv\apps\backend\src, recursive monitor src/**/*, extensions js/mjs/cjs/json, run=false dan lastStarted=0. Tidak menjalankan app, predev seed check, atau backend restart. Tidak ada perubahan storage adapter, Delete engine, schema, atau frontend.

## 2. Normal Watcher Release

Sebelum penghentian, proses diverifikasi memakai akun non-Administrator:

- Nodemon PID 22276: node D:\Project\app-edms-smpv\apps\backend\node_modules\nodemon\bin\nodemon.js src/server.js.
- Child backend PID 16652, parent PID 22276: node src/server.js.
- Parent cmd/npm/bash console chain diinventarisasi; tidak terdapat foreground project lain atau process control plane dalam console target. Tidak ada sinyal yang dikirim sebelum verifikasi ini.

Urutan dilakukan shutdown dahulu, baru edit package.json, untuk menghindari file package.json memicu restart pada watcher lama. Ctrl+C normal dikirim hanya ke console backend yang telah diverifikasi. Tidak memakai taskkill, Stop-Process, forced handle closure, atau Administrator. Kedua PID sudah berhenti dan backend tidak dijalankan kembali selama pekerjaan ini.

Setelah reader handle terlepas, path berikut hilang secara otomatis sebagai penyelesaian delete-pending yang sudah terjadi pada apply sebelumnya:

```text
projects/SS-ALPHA-01/documents/PFD-EDMS-0009/revisions/IFR-Submitted
```

Tidak ada penghapusan manual atau residual apply baru. Scope awal 13 direktori kini menyisakan 12. Direktori lain dan seluruh file utama tidak dihapus oleh pekerjaan ini.

## 3. Targeted Validation

Test baru: apps/backend/tests/unit/nodemonStorageWatch.test.js.

- Script dev tetap memakai entrypoint existing; seluruh source js/mjs/cjs/json di src berada dalam recursive watch scope.
- Actual nodemon configuration dump hanya memantau src dan tidak memulai backend.
- Fixture native Windows dengan read-only reader mereproduksi LOCAL_FOLDER_NONEMPTY/DeletePending; normal close reader menghilangkan child. Native retry pada fixture memakai proof lama, menghapus hanya parent tree kosong, dan mempertahankan sibling file.
- Existing residualDocumentFolders tests memverifikasi durable RUNNING intent dapat di-resume tanpa reset, serta live-reference, writer, IO, Admin, identity, interruption, dan audit guards.

Command yang dijalankan:

```powershell
node --require ./apps/backend/tests/helpers/isolatedHttpRegression.cjs --test apps/backend/tests/unit/nodemonStorageWatch.test.js apps/backend/tests/unit/residualDocumentFolders.test.js
```

Hasil: 13 PASS, 0 FAIL, 0 SKIP. Destructive fixture berada di tmp/, bukan storage utama. Tidak mengulang full regression suite.

## 4. Recovery Inventory

Target aktual: 127.0.0.1:3306 / edms_smpv_dev, 10.4.32-MariaDB, datadir D:\xampp\mysql\data\, namespace lokal d5ccbf2f930937946645176a1502066129163f86b837a01c5d5df0327b0b9614.

| Document | Internal Document ID | Remaining Empty Directories | Result |
| --- | --- | --- | --- |
| PFD-EDMS-0009 | DOC-PFD-96a3e19c-6393-4aa9-af53-4929a515ee8a | 4 | ELIGIBLE_EMPTY_TREE; residual intent tetap RUNNING. |
| PFD-EDMS-0007 | DOC-PFD-b17b919e-f04e-4983-ba01-dd8cdd0bac48 | 5 | ELIGIBLE_EMPTY_TREE; belum diproses. |
| PID-EDMS-0010 | DOC-PID-68452eb1-1cb5-4571-ab32-64c8ca9914ac | 3 | ELIGIBLE_EMPTY_TREE; belum diproses. |
| PID-EDMS-0015 | Dokumen aktif yang menggunakan kembali nomor tersebut | Excluded | AMBIGUOUS / FOLDER_LIVE_REFERENCE; dua stored files tetap ada. |

Ketiga kandidat mempunyai durable Completed evidence dan ownership yang cocok. Tidak ada active document/prefix reference, unsettled writer/IO, atau foreign manifest pada kandidat. Semua native directory identities yang tersisa merupakan subset identik dari original proof; root identity dan namespace tidak berubah. Tidak ada unknown file, junction, symlink, atau directory replacement pada tree eligible.

Ledger execution sebelum/sesudah recovery preflight identik. Historical phase tetap COMPLETED; intent PFD-EDMS-0009 masih RUNNING dengan approval digest lama, tidak di-reset atau ditandai sukses. Existing CLI memang membaca historical completion secara terpisah dari residual intent dan mendukung resume setelah revalidation.

## 5. Actual CLI Report and Integrity Evidence

Command dry-run:

```powershell
node apps/backend/scripts/cleanup-residual-document-folders.cjs --config apps/backend/scripts/legacy-reconciliation.local.example.json --env-file apps/backend/.env --report tmp/residual-document-folders-recovery-preflight-20261103.json
```

Report lokal gitignored: tmp/residual-document-folders-recovery-preflight-20261103.json.

```text
New approval digest, dihasilkan langsung oleh CLI:
4dcca1ae668fadbae46cbd8539d7d52413a057c4ee0d7e02f3b15f46ed546e9d

Database before/after recovery dry-run: 33 tables, identical digest
60a4097560f64e8c57b6cf88d369c8bfc1df0f22ea1e15b15b0b0965d31d332a

Physical before/after recovery dry-run: 44 files, 92 directories, identical digest
c626ef5cdb5141f9806ef64d683c8dc49f6017cdff9e7cfa27570f104c83b330
```

Native read-only inspection juga memverifikasi ukuran dan SHA-256 42 stored files terhadap metadata database. Perbandingan physical snapshot mencakup semua 44 regular files, directory identities/modified times, dan file content hash, tanpa mengikuti symlink. Tidak ada database mutation pada fase ini. Perubahan filesystem satu direktori delete-pending terjadi sebelum dry-run karena normal watcher release, bukan karena CLI dry-run atau manual removal.

## 6. Next Step and Verdict

**RECOVERY PREFLIGHT PASS - NEW OWNER APPROVAL REQUIRED.**

Owner perlu menyetujui digest baru untuk tiga target yang sama dengan total 12 direktori tersisa sebelum apply ulang. Jangan memakai digest baru sebagai izin otomatis. CLI existing dapat dipakai untuk safe resume tanpa reset RUNNING ledger; PID-EDMS-0015 tetap excluded. Backend saat ini tetap berhenti. Saat dijalankan kembali nanti, gunakan script dev yang sudah dibatasi ke src, dan jangan menghidupkan kembali command nodemon lama yang memantau storage.

Tidak ada retry apply, Permanent Delete, manual filesystem deletion, perubahan ACL storage, mutation database, migration/reset/repair, akses Railway/R2, commit/push, atau deployment.
