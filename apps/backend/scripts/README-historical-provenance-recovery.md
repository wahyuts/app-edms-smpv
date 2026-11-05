# Targeted Historical Provenance Recovery

Scope: CLI administratif khusus XAMPP lokal, bukan route, scheduler, startup hook, atau pengganti Permanent Delete engine. Tahap implementasi hanya mengizinkan tests fixture dan dry-run. Apply pada database UAT memerlukan persetujuan owner terpisah terhadap laporan dan digest aktual.

## 1. Authorized Scope

Scope di-hardcode pada `historicalProvenanceRecovery.service.js`; CLI juga mewajibkan exact Operation, Document, dan File ID. Boleh memilih satu atau kedua kelompok lengkap, bukan subset file dalam kelompok.

| Document | Operation ID | File ID | Proposal |
|---|---|---|---|
| PID-EDMS-0001 | 00aa58b7-fcc1-479b-88e7-9362e1c66dc9 | FILE-ccec6360-9346-4c77-b18b-c815596ee3b0 | Lengkapi provisional attachment evidence |
| PID-EDMS-0020 | a0b224f2-9bfe-43d0-a84a-aceefe8335b5 | FILE-389f7d3f-e241-492e-bd64-d75fd976aa1c | Lengkapi provisional attachment evidence |
| PID-EDMS-0020 | a0b224f2-9bfe-43d0-a84a-aceefe8335b5 | FILE-e332a359-3124-4311-b018-811340a9e194 | Koreksi binding IFR ke exact IFA key; evidence identity lama dipertahankan |

## 2. Read-Only Dry-Run

Jalankan dari repository root. Selalu gunakan output baru; input/report existing tidak ditimpa.

```powershell
node apps/backend/scripts/recover-historical-provenance.cjs `
  --config apps/backend/scripts/legacy-reconciliation.local.example.json `
  --env-file apps/backend/.env `
  --operation-id 00aa58b7-fcc1-479b-88e7-9362e1c66dc9 `
  --operation-id a0b224f2-9bfe-43d0-a84a-aceefe8335b5 `
  --document-id DOC-PID-4bf29f17-828c-4a6a-a74a-8633c8b5b0de `
  --document-id DOC-PID-88283fe4-6abe-4fb4-810f-58b145160e11 `
  --file-id FILE-ccec6360-9346-4c77-b18b-c815596ee3b0 `
  --file-id FILE-389f7d3f-e241-492e-bd64-d75fd976aa1c `
  --file-id FILE-e332a359-3124-4311-b018-811340a9e194 `
  --report tmp/historical-provenance-preflight-NEW.json
```

Target wajib `127.0.0.1:3306/edms_smpv_dev`, MariaDB `10.4.32`, datadir `D:/xampp/mysql/data`, APP_ENV `development`, driver `local`, canonical storage root proyek ini. Tidak ada opsi remote/R2. Tidak mengimpor server/application/runtime pools atau menjalankan storage initialization. SQL inventory dibungkus `START TRANSACTION READ ONLY` dan wrapper SELECT-only, tanpa row locks atau advisory lock acquisition.

Inspector native existing hanya dipanggil dalam mode INSPECT, bukan DELETE/CLEAN_EMPTY_TREE. Inspector memverifikasi canonical identity, no-follow/reparse/hardlink checks, ukuran dan SHA-256. Helper executable sementara dapat dibuat di OS temp sesuai implementasi existing; tidak memodifikasi file storage. Seluruh file/directory storage di-snapshot sebelum/sesudah; schema dan rows seluruh base tables juga di-hash sebelum/sesudah. Perubahan concurrent menyebabkan verdict BLOCKED, tanpa digest yang layak di-approve. Snapshot bukan backup dan bukan bukti tidak pernah ada transient write dari proses lain.

## 3. Approval & Apply - NOT AUTHORIZED YET

Setelah owner menyetujui laporan aktual, ulangi argument scope/config/env yang sama dan tambahkan:

```powershell
--apply `
--approved-report tmp/historical-provenance-preflight-NEW.json `
--approval-digest APPROVED_SHA256_DIGEST `
--actor-user-id 1 `
--confirm APPLY_REVIEWED_HISTORICAL_PROVENANCE `
--report tmp/historical-provenance-apply-NEW.json
```

Fragmen ini bukan perintah eksekusi lengkap atau persetujuan apply. Digest adalah integrity seal laporan, bukan signature atau pengganti approval owner. Output menyimpan metadata sensitif pada lokasi lokal yang aman, bukan version control. Tidak menyimpan credential atau raw idempotency key. Actor harus user aktif dengan active Admin membership pada project terkait; project harus aktif.

Sebelum apply yang kelak disetujui: hentikan writer secara normal, siapkan backup yang disetujui, dan pastikan evidence belum berubah. Tool menolak mismatch, tidak memperbaiki atau membuka gate untuk memaksa PASS.

## 4. Safety & Transaction Boundary

1. Advisory lock `edms-del:<operation hash>` sama dengan Delete engine. Lock coordinator existing, project, operation, file, dan binding rows dalam transaksi per dokumen. Tidak ada INSERT/UPDATE pada gate atau Delete ledger.
2. Wajib gate CLOSED terikat pada exact operation, QUIESCENCE_CONFIRMED, tanpa execution/manifest/attempt/foreign manifest, writer settled dengan completion evidence valid, dan IO seluruhnya SUCCEEDED.
3. Semua metadata, ownership/alias/cross-document references, namespace, native root/file identity, checksum, physical file inventory, dan unknown objects diverifikasi ulang. Snapshot berubah ditolak.
4. Pembacaan inventory untuk stale revision memakai proyeksi in-memory exact key yang direview; raw binding asli tetap masuk fingerprint. Bukan perubahan validator Permanent Delete. Setelah write, validator canonical harus membaca rows aktual tanpa proyeksi.
5. Attachment mencatat `OWNER_REVIEWED_PENDING_DELETE_RECOVERY`, current identity, `CURRENT_NATIVE_INSPECTION_NOT_UPLOAD_TIME`, operation ID, approval digest, dan actor ID. Tidak mengklaim original upload-time identity.
6. Revisi wajib memiliki tepat satu durable MOVE SUCCEEDED/acknowledged dari source IFR ke destination IFA, writer COMMITTED/SETTLED, destination metadata/revision sesuai, source lama absent, serta identity/size/SHA sama dengan evidence tersimpan. Hanya key binding yang dikoreksi; string evidence lama dipertahankan.
7. Hanya binding yang disetujui diperbarui dengan conditional old-key/old-evidence check. Physical proof dan tree diverifikasi lagi sebelum commit. Audit before/after, actor, namespace, IDs, digest, dan proof di-insert dalam transaksi yang sama.
8. Kegagalan sebelum COMMIT: rollback kelompok dokumen tersebut. Kelompok sebelumnya yang sudah committed tetap dilaporkan dalam `completedDocuments`. Tidak ada compensation filesystem karena tool tidak pernah memindah/menghapus file.
9. Kegagalan saat COMMIT: `uncertainDocument`, STOP tanpa retry. ROLLBACK setelah ACK loss bukan bukti COMMIT tidak terjadi. Periksa audit identity `historical-provenance:<hash([digest, operationId])>` dan actual binding secara read-only sebelum keputusan baru.
10. Apply ulang laporan yang sudah dipakai ditolak `RECOVERY_ALREADY_APPLIED`, tanpa duplicate audit/write. Tool tidak membentuk proposal baru dari metadata yang sudah dipulihkan secara otomatis.

## 5. Post-Recovery & Separate Delete Approval

Verifikasi binding aktual, evidence, audit, canonical inventory, physical checksum/identity/tree, serta data dan ledger unrelated. Recovery tidak menghapus atau mengubah `cleanupPendingReason` di operation; reason lama bukan bukti hasil retry baru. Gate tetap CLOSED, operation tetap existing, dan tidak ada execution Delete yang dibuat oleh recovery.

Resume Delete memerlukan persetujuan terpisah, menggunakan exact operation existing. API membutuhkan initiating actor/idempotency key awal; key baru bisa menghasilkan 409. Jika key tidak tersedia, jalur administratif resume harus di-review terpisah, bukan membuat operation baru atau reset gate.

SQL/OS runtime UAT apply belum diuji pada database utama. Pemeriksaan file adalah snapshot yang diverifikasi ulang, bukan filesystem lock permanen sampai SQL commit; perubahan dari tool eksternal tetap memerlukan writer quiescence operasional. Risiko unknown COMMIT ditangani fail-closed, bukan automatic repair.
