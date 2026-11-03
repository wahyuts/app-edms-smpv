# Sprint E - Local Permanent Delete CORS Hotfix

Scope: direct local development diagnosis dan targeted CORS fix. Tidak memakai database/instance terisolasi, fake database, atau live R2/Railway.

## 1. Root Cause

**CONFIRMED pada backend lokal aktif.** Axios Permanent Delete mengirim `Content-Type: application/json`, `Idempotency-Key`, dan `withCredentials: true`. Backend sudah mengizinkan origin `http://localhost:5173`, credentials, dan method DELETE, tetapi `allowedHeaders` belum mengizinkan `Idempotency-Key`.

Sebelum patch, request OPTIONS aktual ke port 4000 dengan `Access-Control-Request-Method: DELETE` dan `Access-Control-Request-Headers: content-type,idempotency-key` menghasilkan:

```text
HTTP 204
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With
```

HTTP 204 sendiri tidak menjamin browser mengizinkan actual request: requested header harus diizinkan juga. Header yang hilang ini menjelaskan kegagalan CORS sebelum browser mengirim DELETE, sehingga DELETE tidak muncul di request logger backend.

Middleware CORS juga ditempatkan sebelum request logger; preflight yang ditangani langsung oleh middleware dapat selesai sebelum logger terpasang. Tidak perlu mengubah route, authorization, error handler, Axios credentials, atau logging untuk memperbaiki penyebab ini.

## 2. Main Database Inspection

Target yang benar-benar diperiksa:

```text
Host       : 127.0.0.1
Port       : 3306
Database   : edms_smpv_dev
Version    : 10.4.32-MariaDB
Datadir    : D:\xampp\mysql\data\
```

Sembilan tabel Sprint A/B tersedia dan menggunakan InnoDB. Hasil pada validation window:

| Table | Rows |
| --- | --- |
| document_admission_coordinators | 14 |
| document_delete_operations | 0 |
| document_writer_operations | 0 |
| document_storage_io_steps | 0 |
| document_delete_file_manifest | 0 |
| storage_namespaces | 0 |
| stored_file_namespace_bindings | 0 |
| document_delete_executions | 0 |
| document_delete_attempts | 0 |

Pada pemeriksaan awal jumlah coordinator adalah 11; pada validation window menjadi 14 ketika aplikasi lokal tetap berjalan. Probe HTTP diuji dengan snapshot before/after dalam window tersendiri: seluruh 16 tabel yang diperiksa identik, termasuk seluruh coordinator rows. Tidak menyatakan seluruh aktivitas aplikasi di luar window tersebut berhenti atau berasal dari probe.

- Engineering documents: 18, stored files: 47, revisions: 38, workflow comments: 31, attachments: 9, Audit Trail: 291, notifications: 288.
- Tidak ada Delete operation identity/request hash yang dapat dikorelasikan, karena tabel operasi masih kosong.
- Tidak ada execution, manifest, storage attempt, atau final `Document Deleted` Audit.
- Tidak ada bukti durable engine state `UNKNOWN`; Unknown pada modal harus dibedakan dari unknown storage/database outcome yang benar-benar tersimpan.
- Tidak membuat, mengubah, menghapus, atau me-reset operasi existing secara manual.

## 3. Owner-Designated Dummy

Kode dari owner berhasil dicocokkan secara read-only:

```text
Project code : SS-ALPHA-01
Project ID   : PRJ-008dce88-7d3e-4160-9238-95c20df2fb10
Document no. : PFD-EDMS-0009
Document ID  : DOC-PFD-96a3e19c-6393-4aa9-af53-4929a515ee8a
Status       : Process Comment / Active
```

Project aktif dan memiliki user 1 dengan active Admin membership serta active user status. Gate dokumen `OPEN`, `delete_operation_id = NULL`. Audit dokumen berisi Upload/Approval B/View, bukan final Delete.

Dokumen mempunyai dua Revision File dan satu Workflow Attachment, seluruhnya terkait project/document yang sama pada metadata yang dibaca. **Ketiga file belum mempunyai namespace binding.** Ini prasyarat storage provenance terpisah dari CORS: authenticated Delete diperkirakan akan tertahan Pending melalui mekanisme existing, bukan otomatis mencapai Completed. Tidak menjalankan binding atau backfill sebagai bagian hotfix ini.

Walaupun owner menunjuk dummy, tidak menjalankan authenticated DELETE: akses browser otomatis tidak tersedia dan tidak tersedia authenticated caller session untuk pengujian CLI. Tidak mengambil cookie/credential atau memalsukan sesi Admin. Tidak membuat fixture pengganti. Tidak menghapus dummy maupun dokumen UAT yang sebelumnya Unknown.

## 4. Files Changed

| File | Change |
| --- | --- |
| apps/backend/src/config/cors.js | Satu penambahan `Idempotency-Key` pada allowedHeaders; origin/method/credentials tetap |
| apps/backend/tests/integration/permanentDeleteCorsLocalValidation.cjs | Opt-in validation memakai live backend dan main database; SELECT-only DB inspection dan negative-auth HTTP probes |
| database/migration/reports/20261102_0007_permanent_delete_cors_hotfix.md | Evidence, batas validasi, dan next steps |

Tidak mengubah frontend, visual modal, Delete engine, idempotency rules, workflow, SLA, Archive, RBAC, error mapping, schema, atau environment/provider configuration.

## 5. Validation

Perintah yang benar-benar dijalankan:

```text
node apps/backend/tests/integration/permanentDeleteCorsLocalValidation.cjs --execute-local-read-only
```

Script mengunci target ke main XAMPP sesuai prompt dan tidak mengimpor app/server atau menyalakan scheduler. Semua query database SELECT. Sebelum probe DELETE, script memverifikasi bahwa ID `__cors_auth_probe__` tidak ada; request tidak membawa cookie/token dan wajib ditolak 401 sebelum business operation. Ini bukan end-to-end deletion dan bukan retry dokumen Unknown.

| Validation | Result |
| --- | --- |
| Live OPTIONS with actual Axios requested headers | PASS: 204, exact allowed origin, credentials true, DELETE allowed, idempotency-key allowed |
| Live DELETE negative-auth response | PASS: 401 dan CORS headers benar; non-existent probe ID, tanpa cookie |
| Live GET status negative-auth response | PASS: 401 dan CORS headers benar |
| Unlisted origin | PASS: tidak diberi Access-Control-Allow-Origin |
| Before/after main database snapshots | PASS: row count dan SHA-256 serialized rows pada 16 tabel identik |
| Syntax checks pada dua file JS/CJS | PASS |
| git diff --check | PASS |
| Authenticated GET/status and role authorization through real session | NOT RUN |
| Authenticated DELETE of owner dummy | NOT RUN |
| Chrome/browser CORS and modal visual validation | NOT VERIFIED: browser access host unavailable |

Snapshot dibandingkan dalam memory dan hanya aggregate/count ditampilkan, bukan dump data personal/storage metadata. Tidak melakukan database mutation testing, migration, login/session creation, destructive retry, atau fake-DB substitution.

Setelah patch, backend aktif sudah mengembalikan:

```text
Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With,Idempotency-Key
```

Tidak melakukan manual backend/XAMPP restart; perubahan header telah terlihat pada running backend. HTTP checks tidak menggantikan klaim browser PASS: client Node tidak menegakkan CORS seperti Chrome, sehingga validator memeriksa header contract secara eksplisit dan browser tetap NOT VERIFIED.

Pending/Unknown/Failed mapping tidak diubah: source controller tetap hanya memberi `success: true` untuk `COMPLETED`, dan frontend tetap tidak menampilkan success/optimistic deletion untuk status lain. Runtime authenticated mapping belum diuji pada fase ini.

## 6. Previous Request and Next Manual UAT

Kesimpulan yang dapat dibuktikan: preflight sebelum patch tidak mengizinkan header idempotency, dan tidak ada durable Delete operation/attempt/Audit pada database saat inspeksi. Tidak ada operation ID atau request hash existing yang boleh dihapus/reset/retry oleh Codex.

Langkah aman berikutnya:

1. Gunakan frontend `http://localhost:5173`, origin lokal yang diizinkan, dan existing Admin login yang sah. Jangan menggunakan synthetic preview sebagai actual UAT.
2. Periksa ulang Network/Console dari browser owner. Refresh status melalui GET diperbolehkan; jangan langsung mengulang Delete pada dokumen Unknown sebelumnya. Tidak perlu menonaktifkan CORS, mengubah credentials, atau memakai wildcard origin.
3. Untuk UAT owner-designated dummy, perhatikan tiga file unbound di atas. Bila ingin menguji Completed, provenance/binding per-file harus direview dan disetujui melalui mekanisme Sprint B; tidak boleh ditebak dari current environment atau di-backfill massal.
4. Authenticated E2E deletion masih memerlukan sesi/caller yang sah dan target dummy yang benar-benar boleh dihapus serta bukan dokumen Unknown sebelumnya. Tidak meminta owner membagikan password/cookie untuk laporan ini.

**Status: CORS ROOT CAUSE CONFIRMED; TARGETED HOTFIX VERIFIED ON LIVE LOCAL HTTP.**

Full authenticated deletion dan browser validation belum diklaim PASS. STOP setelah hotfix; tidak membuka pekerjaan binding/recovery atau pekerjaan lain tanpa instruksi owner.
