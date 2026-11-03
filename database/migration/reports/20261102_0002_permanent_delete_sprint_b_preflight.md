# Sprint B - Permanent Delete Document Preflight

Tanggal: 2026-11-02 (Asia/Bangkok).

Status: **SPRINT B BLOCKED - STORAGE OWNERSHIP AUTHORITY REVIEW REQUIRED**.

Pekerjaan berhenti pada mandatory preflight, sebelum implementasi destructive cleanup. Ini bukan hasil kegagalan migration atau pengujian cleanup. Tidak ada database atau storage provider yang diakses pada pemeriksaan ini.

## A. Preflight Audit Report

### Baseline dan Dokumen

- Working tree memiliki patch Sprint A modified/untracked; semuanya dipertahankan tanpa staging/revert.
- Ditinjau bagian relevan BUSINESS-WORKFLOW.md, ENGINEERING-FOUNDATION.md dan PRD.md dalam docs/source-of-truth, serta DATABASE-SCHEMA.md, DATABASE-DESIGN-DECISIONS.md, BACKEND-FOUNDATION.md dan STORAGE-STRATEGY.md dalam docs/architecture.
- SYSTEM-REQUIREMENTS.md, FEATURE-MAPPING.md dan AGENTS.md tidak ditemukan melalui inventory file repository; tidak dibuat dokumen pengganti. Direktori .agents tidak memiliki file.
- Aturan lama BE-013 membatasi hard delete ke technical entity; permintaan owner Sprint B diperlakukan sebagai change request terbatas, bukan izin mengubah workflow atau memperbarui Source of Truth secara diam-diam.
- Schema canonical memiliki 24 business tables. Dua engine migration Sprint A menambahkan lima technical tables. Ini inventory repository, bukan verifikasi schema database aktual.
- Unit regression dijalankan dengan isolation preload existing yang memblokir runtime database/configuration, external email dan R2. Tidak menjalankan harness database Sprint A.

### Blocker: Authority Identitas Storage Historical/Legacy

**Severity: BLOCKER untuk destructive cleanup yang harus membuktikan ownership.**

Evidence:

1. database/schema/schema-dev.sql:296-324: stored_files menyimpan file_id, project_id, document_id, storage_key dan relative_path, tetapi tidak provider, account/endpoint, bucket atau root identity.
2. Schema yang sama:326-355: document_revisions memiliki storage_path_legacy. Kolom ini merupakan compatibility reference menurut DATABASE-SCHEMA.md, bukan bukti independen kepemilikan object kedua apabila berbeda dari storage_key.
3. Migration Sprint A MariaDB:76-90: manifest mengidentifikasi provider/key/hash, tetapi belum mengikat bucket/root/namespace. IO evidence Sprint A juga tidak menyimpan namespace tersebut.
4. apps/backend/src/storage/storageDriver.factory.js:6-16 dan services/storage.service.js:10: adapter dipilih dari konfigurasi saat module diinisialisasi.
5. apps/backend/src/storage/drivers/r2Storage.driver.js:253-263: exact-key deletion memakai bucket dari konfigurasi adapter saat itu. Provider r2 dan key yang sama dapat menunjuk object berbeda setelah bucket diganti.
6. apps/backend/src/utils/storagePath.js:31-34: key local diselesaikan relatif terhadap root konfigurasi saat ini. Provider local dan key yang sama dapat menunjuk file berbeda setelah root diganti.

Kesimpulan terbatas: repository belum memberikan bukti namespace asal historical file setelah pergantian provider/root/bucket. **Tidak ditemukan atau diklaim adanya actual corrupt/shared file pada database**, karena database tidak diakses. Konfigurasi sekarang atau keberadaan object pada key tertentu bukan bukti asal historis. Kekurangan ini bukan kegagalan Sprint A: binding physical cleanup adalah pekerjaan baru Sprint B.

Menambahkan binding immutable melalui migration additive memang berada dalam scope Sprint B dan dapat menyelesaikan recovery operasi baru. Namun, additive column saja tidak mengisi authority historical/legacy secara retroaktif. Sesuai mandatory gate 3.5, authority ini tidak diasumsikan sendiri sebelum destructive engine dibuat.

### Minimum Resolution Proposal - Belum Diimplementasikan

1. Tetapkan authority untuk baseline files: apakah seluruh canonical stored_files dalam environment tertentu sudah dipastikan berada pada satu current storage namespace, atau perlu daftar mapping legacy yang diverifikasi owner/operator.
2. Persist binding immutable pada operasi/manifest: provider, namespace identity non-secret (R2 account/endpoint + bucket; local volume/root identity), exact normalized key, file IDs dan ownership evidence. Jangan menyimpan credentials.
3. Resume wajib memeriksa binding; perubahan konfigurasi tidak boleh otomatis memindahkan target deletion. Namespace mismatch tetap Pending/manual review. Fingerprint root string saja tidak membuktikan identitas volume setelah remount.
4. Legacy path yang sama setelah valid normalization adalah alias, bukan file tambahan. Path berbeda, unsupported path, missing ownership, shared reference atau orphan tetap unresolved dan menahan completion; jangan menghapus berdasarkan prefix, document number atau uploader.
5. Buat migration baru MySQL/MariaDB; jangan edit migration Sprint A. Tidak mengubah business upload/read semantics untuk menebak historical mapping.

Konfirmasi authority baseline diperlukan untuk melanjutkan. Tidak diperlukan akses Railway atau pemindahan file dalam langkah keputusan ini.

## B. Implementation Summary

Belum dibuat cleanup engine, repository discovery, finalized manifest, recovery worker atau public endpoint. Satu-satunya perubahan fase ini adalah laporan preflight ini. Tidak ada klaim bahwa Sprint B safety guarantees sudah diimplementasikan.

## C. Files Changed

| File | Change | Reason | Regression Risk |
|---|---|---|---|
| database/migration/reports/20261102_0002_permanent_delete_sprint_b_preflight.md | Added | Inventory, blocker evidence dan proposal minimal | Documentation only |

Patch Sprint A yang sudah ada tidak termasuk perubahan fase ini.

## D. Manifest Coverage Matrix

| File Source | Exact-Key Evidence | Ownership Evidence | Status/Test |
|---|---|---|---|
| Active file | engineering_documents.active_file_id -> stored_files.storage_key | Same project/document dan konsistensi active_revision_id wajib diperiksa | Source inspection only |
| Historical revisions | document_revisions.file_id -> stored_files | Same project/document, termasuk inactive revisions | Source inspection only |
| Workflow attachment | workflow_attachments.file_id -> stored_files | Attachment + comment + document/project harus konsisten | Source inspection only |
| Legacy/out-of-prefix | storage_path_legacy, relative_path, storage_key | String/prefix bukan ownership proof; jangan mengasumsikan tiga referensi berarti tiga object | BLOCKED jika authority ambigu |
| Archived document | Relasi file sama seperti dokumen Active | Lifecycle bukan lokasi storage | Source inspection only |
| Temporary file | temporary_uploads.storage_key | Tabel tidak memiliki document_id/project_id; uploader/expiry bukan ownership document | Retain kecuali evidence eksplisit terbukti |
| Shared identity/key | Seluruh active/revision/attachment references lintas dokumen/project | Wajib cek raw key, normalized alias dan physical namespace; jangan hanya file_id | Runtime test NOT EXECUTED |
| Orphan physical file | Tidak ada metadata terpercaya | Tidak dapat ditentukan dari nama file/prefix | Retain, unresolved candidate |

Validator existing menormalisasi backslash dan trim. Pemeriksaan alias local juga harus memperhitungkan filesystem identity/case dan symlink/junction. Lexical containment pada storagePath.js belum merupakan bukti realpath containment; ini requirement test/hardening cleanup baru, bukan klaim eksploitasi aktual.

## E. Database Cleanup Matrix

Urutan berikut merupakan desain berdasarkan FK canonical, belum SQL yang dieksekusi. Semua query harus exact document ID + project scope dan abort bila ditemukan cross-document references yang tidak konsisten.

| Table | Ownership Path | FK Behavior / Proposed Order | Delete/Retain Policy / Risk |
|---|---|---|---|
| engineering_documents | id + project_id | Active pointers RESTRICT; nullkan kedua pointer dalam transaksi sebelum menghapus children; document terakhir | Delete target saja; jangan mengubah document lain |
| comment_read_receipts | document_id dan indirect comment_id | RESTRICT document/comment; delete sebelum comments | Delete proven target rows; mismatch scope abort |
| workflow_attachments | document_id, comment_id, file_id | RESTRICT document/comment/file; delete sebelum comments/stored_files | Delete target; cross-document file reference melarang physical cleanup |
| workflow_comments | document_id; optional revision_id | RESTRICT document; revision FK SET NULL | Delete setelah receipts/attachments; jangan mutasi komentar dokumen lain |
| document_history | document_id | RESTRICT document | Delete document timeline; bukan audit_trail |
| document_sla_evaluations | document_id | RESTRICT document | Delete target evaluations; notified_states JSON ikut row |
| notifications | project_id + related_resource_type = Document + related_resource_id | Tidak ada FK document | Delete proven target rows saja; jangan pakai related_document_number/action_target sebagai satu-satunya predicate |
| document_revisions | document_id; file_id | RESTRICT document/file; active pointer harus dilepas dahulu | Delete seluruh target revisions setelah target comments; cross-document revision references abort |
| stored_files | document_id atau proven revision/attachment ownership | RESTRICT document | Delete hanya exclusive target metadata setelah semua FK references aman; shared metadata tetap dipertahankan, jangan otomatis reassign/detach ownership |
| audit_trail | resource_type/resource_id dan project_id; metadata JSON | Tidak ada FK ke document/children | RETAIN seluruh historical rows termasuk hidden; final audit dalam transaksi hard delete yang sama |
| temporary_uploads | Tidak memiliki direct document relation | FK hanya user | RETAIN kecuali owner operation dan exact file identity dapat dibuktikan |
| document_admission_coordinators | project_id + document_id | Technical, tanpa business FK | RETAIN closed tombstone; jangan unlock |
| document_delete_operations | project_id + document_id | Technical, tanpa business FK | RETAIN initiating Admin, original number/reason dan durable progress |
| document_writer_operations | project_id + document_id; temporary claim | Technical, tanpa business FK | RETAIN completion evidence; unresolved menahan cleanup |
| document_storage_io_steps | writer_id, source/destination keys | Technical, tanpa business FK | RETAIN IO evidence; bukan ownership authority semua legacy files |
| document_delete_file_manifest | delete_operation_id | Technical, tanpa business FK | RETAIN immutable finalized entries dan exact cleanup evidence |
| projects, project_memberships, user_project_preferences | Shared project/user scope | Bukan document-owned | RETAIN |
| users, departments, roles, permissions, role_permissions | Shared identity/catalog | Bukan document-owned | RETAIN |
| user_credentials, password_reset_tokens, refresh_sessions | User-owned | Bukan document-owned | RETAIN |
| document_types | Shared catalog | Document FK RESTRICT | RETAIN |
| system_metadata | Global configuration/version JSON | Bukan document-owned berdasarkan source yang ditinjau | RETAIN; jangan generic JSON search-and-delete |

Notification metadata existing menyimpan workflow/revision dan SLA cycle identity; authoritative document link tetap kolom related_resource_type/related_resource_id + project_id. Audit metadata boleh tetap mereferensikan document yang dihapus untuk histori. Arbitrary JSON/text matching tidak digunakan sebagai izin penghapusan.

### Audit Atomicity Design Gap - Within Sprint B Scope

Existing audit.repository.js:152-185 membuka admission.mutate untuk Document, bukan menerima transaksi cleanup caller. Memanggil API ini setelah reservation tidak membuktikan atomicity dan dapat ditolak gate. Implementasi Sprint B nantinya memerlukan insert final audit pada koneksi/transaksi cleanup yang sama, dengan deterministic unique identity_key per Delete Operation. Hindari INSERT IGNORE yang menyembunyikan error wajib. Ini kebutuhan integrasi minimal yang dapat diselesaikan dalam scope, **bukan blocker terpisah atau perubahan authorization/workflow**.

## F. Recovery Matrix

Belum diimplementasikan atau diuji. Berikut acceptance requirements setelah blocker authority terselesaikan.

| Failure Point | Required Durable Evidence | Required Resume Behavior | Test |
|---|---|---|---|
| Before manifest finalization | Reserved operation + confirmed quiescence | Tidak ada destructive IO; rebuild snapshot aman | NOT EXECUTED |
| After finalization | Immutable manifest digest + namespace binding | Baca manifest yang sama; tolak namespace mismatch | NOT EXECUTED |
| During physical delete | Durable per-file attempt, claim identity, unknown state | Unknown tetap Pending; expired lease/HEAD bukan bukti IO terminal | NOT EXECUTED |
| Partial physical cleanup | Individual acknowledged terminal states | Tidak hard delete DB sebelum seluruh safety conditions terpenuhi | NOT EXECUTED |
| Before DB transaction | All storage terminal evidence | Revalidate ownership/quiescence dan FK scope | NOT EXECUTED |
| During DB transaction | Transaction + unique final audit identity | Rollback metadata/audit bersama; gate tetap closed | NOT EXECUTED |
| After DB commit / ACK loss | Completed record + final audit committed bersama | Baca durable result; tidak mengulang external IO atau audit | NOT EXECUTED |
| Two workers | Durable exclusive destructive-step claim/fencing | Tidak melakukan external step ganda; stale worker tidak melewati fence | NOT EXECUTED |

TTL, HEAD absence atau lock release saja tidak membuktikan external request lama berhenti. Pending tanpa force-unlock tetap perilaku benar. Tidak mengklaim distributed atomicity MySQL/R2.

## G. Test Results

| Validation | Result | Evidence |
|---|---|---|
| Existing backend regression | 272 PASS, 0 FAIL, 0 skipped/cancelled | node --require ./apps/backend/tests/helpers/isolatedHttpRegression.cjs --test [seluruh 12 unit test files hasil rg] |
| Static source assertions | 4 PASS | Node inline assertions membaca schema/migration: stored_files tanpa namespace; manifest tanpa namespace; audit tanpa document-owned FK; key yang sama menghasilkan path berbeda pada dua root sintetis memakai path.win32.resolve |
| MariaDB Sprint B integration/migration | NOT EXECUTED | Preflight STOP sebelum database access |
| Local sandbox physical deletion | NOT EXECUTED | Tidak ada cleanup engine |
| Fake R2, fault injection, crash/recovery | NOT EXECUTED | Tidak ada cleanup engine |

PASS regression tidak membuktikan Permanent Delete tersedia. Suite juga mempertahankan reproduksi bug upload/COMMIT ACK loss dalam workstream HOLD; PASS test reproduksi bukan klaim bug itu diperbaiki.

## H. Migration Report

- Sprint A MySQL/MariaDB files: UNCHANGED oleh fase ini.
- Sprint B MySQL/MariaDB files: NOT CREATED; desain persistence menunggu authority review.
- Database migration, schema changes dan rollback execution: NONE.
- Tidak melakukan DROP/TRUNCATE, reset, seed, foreign-key disabling atau test database setup.
- Rollback future DDL tidak boleh membatalkan file yang sudah dihapus; memerlukan prosedur backup/manual recovery terpisah. Belum ada file yang dihapus di fase ini.

## I. Safety Confirmation

```text
Any Database Access This Phase: NONE
Main Development Database Mutation: NONE
Railway / Production / Staging: NOT ACCESSED
Live R2 / Local Document Storage: NOT ACCESSED
Frontend / Backend Application Code: UNCHANGED THIS PHASE
Sprint A Patch / Engine Migrations: PRESERVED
Public Delete Endpoint: NOT CREATED
Delete Notification: NOT CREATED
Development Reset / Seed: NOT EXECUTED
Actual Document / File Deletion: NONE
Commit / Push / Deployment: NOT PERFORMED
```

## J. Final Verdict

**SPRINT B BLOCKED** pada mandatory ownership preflight. Belum memenuhi Definition of Done dan bukan COMPLETE WITH CONDITIONS.

Keputusan yang diminta: tentukan authority namespace untuk existing files/legacy baseline. Rekomendasi: canonical files hanya dapat diproses setelah namespace binding diverifikasi; historical/legacy ambiguity tetap Pending/manual review dan tidak pernah diselesaikan melalui tebakan current environment, prefix atau Document Number. Setelah authority jelas, persistence additive, engine dan seluruh isolated destructive tests masih harus diimplementasikan serta dijalankan.

STOP sebelum destructive implementation. Tidak melanjutkan Sprint C/D/E.
