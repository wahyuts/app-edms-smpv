# Legacy File Reconciliation

Scope: administrative CLI, bukan startup task, migration, atau endpoint publik. Default selalu dry-run. Tidak menghapus, memindahkan, atau mengubah physical file. Apply hanya menulis namespace/binding, coordinator yang diperlukan, dan Audit Trail dalam transaksi per dokumen.

## 1. Explicit Configuration

Gunakan `legacy-reconciliation.local.example.json` untuk target XAMPP yang telah diaudit. Kredensial database dibaca dari file environment yang disebutkan dengan `--env-file`; kredensial tidak disimpan dalam config atau laporan. Host, connection port, nama database, environment, versi server, dan optional datadir harus sesuai. `serverPort` adalah port internal server, berbeda dari connection port proxy Railway.

Setiap entry `namespaces` harus eksplisit:

- Local: `{"provider":"local","root":"D:/canonical/absolute/root"}`. CLI memverifikasi real root dan inspector native Windows/NTFS mem-pin ancestor/file handles, menolak reparse/hardlink, serta membaca native identity dan SHA-256.
- R2: `{"provider":"r2","accountId":"ACCOUNT","endpoint":"https://ACCOUNT.r2.cloudflarestorage.com","bucketName":"BUCKET","region":"auto"}`. Kredensial memakai `R2_ACCESS_KEY_ID` dan `R2_SECRET_ACCESS_KEY` dari env file. Inspector GET exact key pada descriptor tersebut dan menghitung SHA-256 secara streaming, bukan ETag. Tidak melakukan list-based guessing.

Lebih dari satu namespace dapat diperiksa. Jika ada dua kandidat yang cocok, hasil AMBIGUOUS. Jika satu kandidat tidak dapat diperiksa, hasil tetap BLOCKED walaupun kandidat lain cocok. Provider historis yang belum diketahui harus diklarifikasi melalui inventory/config review, bukan diasumsikan memakai adapter aplikasi saat ini. Digest merupakan bukti integritas laporan yang disetujui operator, bukan tanda tangan atau bukti asal historis secara kriptografis.

## 2. Dry-Run

Jalankan dari root repository. Gunakan nama output baru setiap kali; file existing tidak ditimpa.

```powershell
node apps/backend/scripts/reconcile-legacy-files.cjs `
  --config apps/backend/scripts/legacy-reconciliation.local.example.json `
  --env-file apps/backend/.env `
  --report tmp/legacy-reconciliation-review-new.json
```

CLI tidak mengimpor application/server/database pools atau menjalankan storage initialization. SQL inventory dibatasi SELECT dan dibungkus `START TRANSACTION READ ONLY`. Snapshot schema dan hash seluruh rows pada seluruh base tables dibandingkan sebelum/sesudah dalam transaksi baca terpisah. Hanya digest, bukan data personal, ditulis ke laporan. Jika ada perubahan concurrent dari aplikasi lain, laporan tidak diterbitkan sebagai approval evidence. Snapshot ini bukan backup dan bukan bukti tidak pernah ada transient write dari proses lain.

Laporan memuat status VERIFIED/MISSING/AMBIGUOUS/BLOCKED, exact file/project/document IDs, namespace, proof, inventory fingerprint, alreadyBound, eligibleForApply, serta approvalDigest. Payload inventory/hash penuh berada di file lokal `tmp/` yang diabaikan Git; simpan dengan akses terbatas. Snapshot penuh membaca metadata seluruh database; jadwalkan review kapasitas sebelum memakai CLI pada database online yang besar.

## 3. Apply - Prepared Only, Owner Approval Required

Contoh berikut dokumentasi saja. Apply belum diizinkan/dijalankan pada tahap implementasi ini.

```powershell
node apps/backend/scripts/reconcile-legacy-files.cjs `
  --config apps/backend/scripts/legacy-reconciliation.local.example.json `
  --env-file apps/backend/.env `
  --apply `
  --approved-report tmp/legacy-reconciliation-local-dry-run-20261103-reviewed.json `
  --approval-digest "DIGEST_LAPORAN_YANG_DISETUJUI_OWNER" `
  --actor-user-id "ACTIVE_PROJECT_ADMIN_USER_ID" `
  --confirm APPLY_REVIEWED_FILE_BINDINGS `
  --report tmp/legacy-reconciliation-apply-new.json
```

Safety gates:

1. Target identity, namespace descriptor, report digest dan confirmation harus sama dengan laporan yang direview. Namespace identity tidak dibangun ulang berdasarkan dugaan environment.
2. Actor harus user aktif dengan active Admin membership pada project terkait dan project aktif; bukan global role.
3. Lock coordinator Sprint A yang sama dengan upload/Delete. Gate harus OPEN; tidak ada Delete operation, active/unresolved writer, atau unsettled IO. Tidak membuat Delete reservation. Jika busy, STOP dan ulangi dry-run setelah lifecycle writer selesai.
4. Revalidate inventory ownership/shared references/alias, hash, ukuran, namespace, dan native identity. Periksa ulang storage proof sebelum menulis binding; bukti berubah ditolak.
5. Namespace/binding/Audit Trail commit bersama per dokumen. Binding identik no-op; konflik ditolak. Hanya provisional `UPLOAD_ADAPTER_SNAPSHOT` dengan namespace/key sama dapat dilengkapi. Binding yang telah masuk Delete operation tidak ditimpa.
6. Tidak ada automatic retry setelah error. Kelompok dokumen yang sudah commit dilaporkan melalui `completedDocuments`. COMMIT ACK loss dilaporkan sebagai `uncertainDocument`; ROLLBACK tidak dianggap membatalkan commit yang mungkin sudah terjadi. Review ulang dry-run; binding identik tidak menghasilkan audit kedua.

Remote connection selalu memerlukan `--allow-remote` dan config/environment spesifik. Flag ini bukan persetujuan mengakses Railway dalam pekerjaan implementasi lokal. Database online dan R2 live belum diuji.

## 4. New Upload and Limitations

Create Document, Upload Revision, dan Workflow Attachment tetap memakai `insertStoredFile()` serta transaction/finalize existing. Provisional namespace binding dibuat di transaksi yang sama, lalu setelah finalize sukses, final object di-inspect dan proof lengkap disimpan sebelum COMMIT. Tidak ada sukses tanpa schema provenance, namespace, checksum, identity, atau binding yang valid. Metadata-only edit tidak menyentuh binding.

Kegagalan sebelum commit memakai rollback/compensation existing. Workstream upload COMMIT ACK-loss recovery tidak diubah; regression baseline masih mereproduksi risiko existing tersebut. Reconciliation mempunyai penanganan uncertainty sendiri dan tidak melakukan storage mutation.

Windows/NTFS inspector mendukung extended-length paths melalui Win32 canonical handles tanpa mengurangi no-follow/identity checks. Linux/Railway Volume belum mempunyai inspector/safe-delete adapter yang setara: tidak ada fallback unlink, tidak ada klaim Delete Completed. Karena provenance diwajibkan, upload baru pada local Linux juga akan fail-closed; environment tersebut memerlukan workstream adapter terpisah sebelum memakai perubahan upload ini. R2 inspection menambah GET/stream hashing sebelum commit sehingga menambah latency dan waktu lock transaksi. Tidak ada UAT upload atau apply menggunakan database utama pada fase ini.
