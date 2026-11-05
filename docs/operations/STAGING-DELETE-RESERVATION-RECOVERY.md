# STAGING DELETE RESERVATION RECOVERY

> **Status:** Prepared - Live Verification and Owner Approval Required
> **Last Updated:** 2026-11-04

## 1. Target

Railway environment `staging` saja. Railway `production` adalah EDMS Development; `real_production` dilarang digunakan.

Project ID: `PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c`.

| Document | Document ID | Operation ID |
|---|---|---|
| COBA-1 | DOC-PID-5f6ea1c2-3f53-432d-a0e5-f738be2911b0 | d1b06c71-ccf1-4d85-abbb-9f7f61a5d197 |
| PROJECT-1 | DOC-PID-2fe931bb-dac7-4c90-afa9-3addf4351e1f | 86135cc8-923b-451a-abb3-4a21729cba4c |
| PROJECT-2 | DOC-PID-e2823245-4e10-47d4-bc91-14254f05cd9f | 012e8f62-a55a-4b2f-bbbb-f7f95e95bf0b |

Identitas berasal dari owner. CLOSED gate, QUIESCENCE_CONFIRMED, ketiadaan execution/manifest/attempt/writer/IO, serta keberadaan R2 dilaporkan owner; belum diverifikasi live oleh implementasi ini.

## 2. Safety Gates

- Verifikasi connection Railway environment/service secara independen; nama database `railway` bukan bukti Staging.
- Cocokkan `SELECT DATABASE(), @@server_uuid` dengan target yang disetujui. Cocokkan namespace account/endpoint/bucket Staging dengan namespace ID; jangan menampilkan credential.
- Siapkan backup yang dapat dipercaya dan maintenance yang menghentikan backend workers, scheduler, operator recovery lain, serta out-of-band storage writers. Tidak adanya user aktif bukan bukti quiescence.
- Pastikan prevention fix dan handler cancellation marker tersedia sebelum membuka gate. Jangan membuka gate dengan backend versi lama yang masih dapat mencoba operation lama.
- Lakukan read-only verification terlebih dahulu hanya setelah akses live read-only disetujui. Jangan memanggil endpoint DELETE sebagai pemeriksaan.

## 3. Controlled Procedure

Internal module: `apps/backend/src/services/deleteReservationRecovery.service.js`. Tidak memiliki route, startup hook, CLI live, atau import konfigurasi credential. Module hanya menerima adapter yang disiapkan secara eksplisit; tidak menjalankan recovery dengan memulai backend.

1. Setelah izin live inspection tersedia, buat instance `createRecovery({ pool, storage, namespace, targets: STAGING_TARGETS, target })`. `target` berisi `railwayEnvironment: 'staging'`, `serviceId`, `database`, `serverUuid`, dan `namespaceId` hasil verifikasi independen. Gunakan koneksi MySQL yang aman dan adapter R2 read-only untuk inspect; jangan menggunakan default environment backend.
2. Jalankan `prepare()`. Ini mengambil named lock engine per operation, memeriksa identity database, mengunci coordinator lalu operation/document, dan membaca inventory. Tidak ada INSERT/UPDATE/DELETE dalam prepare; transaksi dibatalkan setelah pembacaan. Jangan menjalankan prepare dengan akun database read-only yang melarang row lock tanpa meninjau kompatibilitas akses terlebih dahulu.
3. Prepare menolak semua execution, manifest, attempt, writer, dan storage IO target, bukan hanya outcome UNKNOWN. Seluruh file inventory, termasuk active file, harus berada pada project/document prefix yang benar dan lolos exact R2 GET, size, serta SHA-256. Tidak ada R2 write.
4. Simpan report dan `approvalDigest` dari prepare, tanpa credential. Report berlaku lima menit. Kirim hasil kepada owner; jika kadaluarsa, prepare ulang dan minta persetujuan terhadap digest baru.
5. **STOP sebelum apply.** Owner harus menyetujui report/digest secara eksplisit. Persetujuan implementasi bukan persetujuan recovery live.
6. Hanya setelah approval terpisah: `apply({ report, approvalDigest, confirmation: 'RECOVER_THREE_STAGING_RESERVATIONS', actorUserId, maintenanceConfirmed: true, backupConfirmed: true })`. Flag adalah attestation operator atas pemeriksaan nyata, bukan pengganti backup/maintenance verification.
7. Apply mengambil ulang lock dan seluruh evidence, memverifikasi actor Admin aktif per project, lalu membatalkan tiga reservation dalam satu transaksi. Perubahan report/evidence membatalkan apply.

Operation tidak dihapus dan status schema tetap dipertahankan. Cancellation dicatat pada `pending_metadata.reservationRecovery.state = 'CANCELLED_BEFORE_IO'`; gate menjadi OPEN, pointer operation dilepas, generation bertambah, dan Audit Trail ditambahkan. Handler API mengenali marker ini dan tidak me-resume operation yang dibatalkan.

Guard marker juga berlaku pada direct Delete engine setelah named lock diperoleh, repository operation locking, coordinator reuse/quiescence, dan internal pending-resume tool. Cancelled operation ditolak sebelum manifest, cleanup, atau notification; gate yang terbuka bukan satu-satunya pengaman.

Tidak ada perubahan document status, revision, active file, SLA, storage metadata, binding, atau physical R2 object. Repeat dengan marker yang sesuai menghasilkan `ALREADY_RECOVERED` tanpa Audit Trail ganda.

## 4. Verification

Jalankan SELECT berikut pada koneksi Staging yang telah diverifikasi, sebelum dan setelah apply; bandingkan dengan snapshot prepare. Semua query di bawah read-only.

```sql
SELECT d.id,d.document_number,d.workflow_status,d.revision_label,d.active_file_id,d.active_revision_id,
       c.gate_state,c.generation,c.delete_operation_id,o.id AS operation_id,o.status,o.pending_metadata
FROM engineering_documents d JOIN document_admission_coordinators c ON c.project_id=d.project_id AND c.document_id=d.id
JOIN document_delete_operations o ON o.project_id=d.project_id AND o.document_id=d.id
WHERE d.project_id='PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c'
AND o.id IN ('d1b06c71-ccf1-4d85-abbb-9f7f61a5d197','86135cc8-923b-451a-abb3-4a21729cba4c','012e8f62-a55a-4b2f-bbbb-f7f95e95bf0b');
SELECT o.id,(SELECT COUNT(*) FROM document_delete_executions e WHERE e.operation_id=o.id) AS executions,
       (SELECT COUNT(*) FROM document_delete_file_manifest m WHERE m.delete_operation_id=o.id) AS manifests,
       (SELECT COUNT(*) FROM document_delete_attempts a JOIN document_delete_file_manifest m ON m.id=a.manifest_id WHERE m.delete_operation_id=o.id) AS attempts
FROM document_delete_operations o WHERE o.project_id='PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c'
AND o.id IN ('d1b06c71-ccf1-4d85-abbb-9f7f61a5d197','86135cc8-923b-451a-abb3-4a21729cba4c','012e8f62-a55a-4b2f-bbbb-f7f95e95bf0b');
SELECT identity_key,resource_id,business_event,metadata,occurred_at FROM audit_trail
WHERE identity_key IN (CONCAT('reservation-recovery:',SHA2('d1b06c71-ccf1-4d85-abbb-9f7f61a5d197',256)),
CONCAT('reservation-recovery:',SHA2('86135cc8-923b-451a-abb3-4a21729cba4c',256)),CONCAT('reservation-recovery:',SHA2('012e8f62-a55a-4b2f-bbbb-f7f95e95bf0b',256)));
```

Expected: tiga gate OPEN, pointer NULL, tiga operation tetap tersedia dengan marker, nol execution/manifest/attempt, satu recovery audit per operation. Cocokkan hash snapshot business data dan inspect ulang exact R2 keys/checksums; jangan menyimpulkan integritas hanya dari tabel gate. Lakukan View/Download UAT setelah maintenance dilepas secara terkontrol.

## 5. Failure & Remaining Limits

- Sebelum COMMIT, kegagalan membatalkan seluruh mutation SQL. Tidak ada compensation R2 karena recovery tidak menulis R2.
- COMMIT acknowledgement hilang: STOP, baca kembali marker, gate, dan Audit Trail. Jangan menganggap rollback pasti berhasil atau menjalankan force retry.
- Session recovery memiliki transaction boundary eksplisit: prepare mengakhiri read dengan rollback, apply mengakhiri write dengan commit, tanpa rollback sesudah commit sukses. COMMIT outcome unknown, rollback gagal, atau named lock release gagal menyebabkan koneksi dibuang dengan mysql2 `destroy()`, bukan dikembalikan ke pool.
- Sesudah commit dan aktivitas user berjalan kembali, jangan menutup gate secara manual sebagai rollback; diperlukan investigasi dan approval baru.
- Operation yang dibatalkan tetap menggunakan unique target existing. Delete berikutnya tidak otomatis membuat operation pengganti. Dokumen eligible yang memiliki cancelled operation mendapat rejection khusus; lifecycle operation pengganti membutuhkan keputusan terpisah, bukan penghapusan history.
- Recovery menghilangkan lock reservation saja. Keterbatasan legacy Approval A physical move tanpa binding tetap di luar scope dan belum diperbaiki.
- Live MySQL syntax, server identity, namespace/checksum, actor Admin, backup, maintenance, dan UAT keenam dokumen belum dinyatakan PASS oleh synthetic tests.
- Checksum metadata legacy yang kosong/invalid menghasilkan `FILE_CHECKSUM_REQUIRED`, walaupun object R2 tersedia. Hash object saat ini saja tidak membuktikan integritas historis. Backup/export atau inventory terpercaya yang mengikat exact File ID, key, ukuran, dan SHA-256 dapat menjadi calon evidence alternatif, tetapi belum ada jalur fallback yang disetujui; STOP untuk assessment terpisah, tanpa mengisi checksum atau membuat binding secara otomatis.

## 6. Local Readiness Validation

- Local fixture mencakup checksum hilang, historical file hilang, ukuran/hash/namespace salah, concurrent API retries, direct engine retry, internal pending resume, coordinator reuse, dan larangan reservation baru pada penolakan ownership.
- Transaction fixture mencakup kegagalan Audit Trail pada target kedua, generation CAS gagal, rollback gagal, COMMIT acknowledgement hilang sebelum/sesudah commit diterapkan, serta named lock release gagal. Repeat recovery juga menolak execution/attempt yang muncul setelah cancellation.
- Post-recovery fixture menjalankan actual file access resolver dan response streaming untuk View/Download ketiga target. Actual writer admission wrapper menerima operasi edit, revision, approval A/B/C, comment, attachment, history, dan Archive/Restore setelah gate OPEN. Ini membuktikan cancellation tidak memblokir admission, bukan UAT business workflow atau hak approval setiap role.
- Legacy Approval A physical movement tanpa binding tetap belum diperbaiki. Jangan menyatakan seluruh operasi bisnis legacy sudah PASS hanya berdasarkan gate OPEN.
- Real MySQL integration: **NOT VERIFIED**. Tidak ditemukan instance MySQL test terisolasi yang terverifikasi; executable XAMPP lokal yang ditemukan adalah MariaDB 10.4.32 dan tidak digunakan sebagai pengganti MySQL atau untuk testing pada database EDMS utama.
- Live readiness tetap **PARTIAL** sampai identitas koneksi Staging, metadata/checksum semua file, report/digest fresh, actor, backup, maintenance, dan approval owner diverifikasi. Tidak ada live prepare/apply atau akses R2 dalam validasi lokal ini.
