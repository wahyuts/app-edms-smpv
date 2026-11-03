# Residual Document Folder Cleanup

## 1. Scope and Status

CLI administratif ini hanya untuk empty document trees dari Permanent Delete yang sudah COMPLETED. Bukan Delete engine baru, bukan startup task, dan bukan endpoint frontend. Default selalu dry-run. Apply tersedia untuk Windows/NTFS, tetapi belum dijalankan pada storage/database utama. Linux local filesystem belum didukung native inspector.

R2 prefix tanpa object sudah clean dan tidak memerlukan operasi delete folder. Unknown object dan semua marker tetap dipertahankan. Branch penghapusan marker, termasuk kandidat yang sudah direview, masih BLOCKED karena adapter belum mempunyai kemampuan conditional-delete yang terverifikasi untuk mencegah penghapusan object pengganti. Tidak menganggap nama berakhiran slash, size nol, atau ETag sebagai bukti ownership/otorisasi. Tidak mengirim DeleteObject/DeleteObjects dari folder cleanup R2.

## 2. Dry-Run

Jalankan dari repository root, dengan config namespace eksplisit yang sama dengan reconciliation. Kredensial hanya dibaca dari env file; tidak ditulis ke report.

```powershell
node apps/backend/scripts/cleanup-residual-document-folders.cjs `
  --config apps/backend/scripts/legacy-reconciliation.local.example.json `
  --env-file apps/backend/.env `
  --report tmp/residual-document-folders-review-new.json
```

Config harus menyebut host, connection port, database, environment, versionPrefix, optional serverPort/datadir, dan setiap namespace/root secara eksplisit. Local root harus canonical dan absolut. R2 memakai explicit accountId/endpoint/bucketName/region serta credential existing dari env. Remote connection wajib memakai --allow-remote, tetapi flag tersebut bukan approval akses environment online.

Dry-run menggunakan transaksi database READ ONLY serta wrapper SELECT-only. Snapshot schema/hash seluruh rows pada seluruh base tables dibandingkan sebelum/sesudah. Tidak mengimpor app/server atau menjalankan startup initialization. Report disimpan dengan nama baru di tmp/ yang gitignored, tidak menimpa laporan/input existing.

Klasifikasi:

- ELIGIBLE_EMPTY_TREE: durable completion, manifest, attempt success, namespace/root identity, Audit Trail, dan ownership cocok; tree hanya berisi empty directories yang di-inspect secara native.
- BLOCKED_NONEMPTY: ada object/file yang tersisa. Tidak ada penghapusan file atau marker.
- AMBIGUOUS: namespace/provenance tidak lengkap, folder direkreasi setelah completion, prefix dipakai dokumen/file aktif, atau document number dipakai beberapa Delete operation.
- MISSING_OR_ALREADY_CLEAN: document root/prefix sudah tidak ada atau tidak berisi object pada R2.

Path berasal dari manifest binding, bukan tebakan dari konfigurasi aktif. Batas selalu projects/<project>/documents/<document>/. Document root termasuk target; documents/, project root, dan storage root tidak termasuk. Prefix scan R2 menggunakan trailing slash, pagination lengkap, serta batas resource; tidak menggunakan recursive prefix deletion.

## 3. Apply - Not Authorized in This Implementation Phase

Contoh ini hanya dokumentasi, bukan instruksi eksekusi tanpa approval owner baru:

```powershell
node apps/backend/scripts/cleanup-residual-document-folders.cjs `
  --config apps/backend/scripts/legacy-reconciliation.local.example.json `
  --env-file apps/backend/.env `
  --apply `
  --approved-report tmp/residual-document-folders-20261103-final-dry-run.json `
  --approval-digest "DIGEST_LAPORAN_YANG_DISETUJUI_OWNER" `
  --actor-user-id "ACTIVE_PROJECT_ADMIN_USER_ID" `
  --confirm CLEAN_REVIEWED_EMPTY_DOCUMENT_FOLDERS `
  --report tmp/residual-document-folders-apply-new.json
```

Apply hanya memproses item ELIGIBLE_EMPTY_TREE pada report yang disetujui. Gate operation asli harus CLOSED dan menunjuk operation yang sama. Menggunakan advisory claim Delete existing, coordinator lock Sprint A, project row lock untuk mencegah insert dokumen baru melalui FK, dan execution row lock. Actor harus user aktif dengan active Admin membership pada project terkait. Active/unresolved writer, unsettled IO, live document/file prefix, perubahan native identity, atau manifest mismatch akan menolak cleanup.

Ledger residualFolderCleanup disimpan dalam execution.inventory existing, terpisah per namespace/prefix. Intent RUNNING commit sebelum IO. Cleanup berlangsung pada transaksi fenced berikutnya, kemudian hasil CONFIRMED dan Audit Trail administratif commit bersama. Tidak mengubah historical phase COMPLETED, completion_snapshot, waktu completion, notification ledger, ataupun membuat Delete operation baru.

Native helper mem-pin storage-root ancestors dan seluruh directory handles. Setiap directory harus cocok dengan approved native identity; directory yang sudah hilang pada retry boleh dilewati. Unknown/new directories atau file menghalangi cleanup. Sebelum setiap disposition, helper memeriksa ulang identity dan kondisi empty; kernel menolak nonempty directory. Penghapusan menggunakan SetFileInformationByHandle bottom-up, bukan path-based recursive delete. Jika interruption terjadi sesudah beberapa direktori hilang, jangan reset; inspect ulang menggunakan approval/proof asli sebelum resume. Ledger RUNNING bukan bukti sukses, dan ROLLBACK SQL tidak mengembalikan direktori yang sudah dihapus. Audit identity stabil mencegah duplikasi saat ACK loss/retry.

## 4. Automatic Delete Integration

Operasi baru menangkap folder plan sebelum physical file deletion dan menyimpannya di execution.inventory bersama immutable inventory existing. Plan mencakup namespace, exact document prefix, native root identity dan seluruh directory identities. Unknown content yang tidak ada pada manifest ditolak sebelum file deletion.

Setelah semua file manifest DELETED dan attempt SUCCEEDED, engine menyimpan folder state RUNNING secara durable, melakukan empty-tree cleanup, memverifikasi document root/prefix sudah bersih, lalu menyimpan CONFIRMED. Finalizer menolak state/digest yang belum confirmed. Metadata deletion, terminal COMPLETED, final Audit Trail, dan notification mengikuti lifecycle existing setelah tahap ini. Folder failure menghasilkan Pending, bukan sukses penuh.

Historical Completed langsung mengikuti read path existing dan tidak dibuka ulang. Legacy unfinished manifests tanpa folder plan tidak di-upgrade berdasarkan tebakan: tetap Pending FOLDER_PROVENANCE_REQUIRED sampai ada keputusan recovery yang disetujui. Tidak ada migration baru; business workflow, numbering, upload, Archive/Restore, dan UI tidak diubah.

## 5. Operational Limits

- Windows fixed NTFS saja. UNC/removable/reparse/junction/hardlink escape, traversal, DOS aliases, trailing dots, dan unsupported platforms tetap fail-closed. Native tree scan dibatasi depth/handle count; R2 listing dibatasi object/page count.
- Folder creation time dibandingkan dengan historical completedAt untuk menolak tree yang direkreasi belakangan. Native IDs, completion, namespace, Audit Trail, dan live-reference checks adalah trust boundary; bukan klaim filesystem history kriptografis.
- R2 marker deletion masih memerlukan desain capability/ownership yang disetujui; jangan melemahkan guard untuk membuat kasus tersebut PASS. Primary references: https://developers.cloudflare.com/r2/api/s3/api/ dan https://developers.cloudflare.com/r2/reference/consistency/. Dokumentasi tersebut tidak diperlakukan sebagai verifikasi live account atau jaminan kemampuan conditional marker-delete pada adapter aplikasi ini.
- Tidak ada main-database/storage apply, live R2/Railway request, migration, atau Permanent Delete E2E pada fase implementasi ini. Destructive tests hanya pada fixture milik test.
