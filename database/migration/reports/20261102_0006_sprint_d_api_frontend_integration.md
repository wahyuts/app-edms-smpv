# Sprint D - Permanent Delete API & Frontend Integration

Tanggal: 2 November 2026. Scope: authenticated API, Trash action, approved Delete modal, dan frontend integration. Sprint E tidak dijalankan.

## A. Implementation

### Backend API

Mengikuti route prefix dokumen existing, bukan membuat hierarchy project routes baru:

```text
DELETE /api/v1/documents/:documentId/permanent?projectId=:projectId
Idempotency-Key: <8-128 alphanumeric/underscore/hyphen characters>
Body: { "reason": "Optional reason" }

GET /api/v1/documents/:documentId/permanent?projectId=:projectId&operationId=:operationId
```

`operationId` pada GET boleh dihilangkan untuk menemukan operasi tunggal milik dokumen/project, misalnya sesudah response DELETE hilang. GET tidak menjalankan recovery, mutation Delete, atau storage IO.

- Existing authenticate middleware memverifikasi session cookie. Service memeriksa ulang active project context, user aktif, project aktif, membership aktif, dan `project_memberships.official_role = Admin` dari database. Global `users.role_id`, body role, atau visibilitas tombol bukan dasar authorization.
- Dokumen wajib milik project target. Admin dapat menghapus seluruh workflow status, termasuk Approved dan Archived. Tidak mengubah role definition/permission seed atau menambah status restriction.
- Existing coordination reservation, quiescence evaluation, cleanup engine, final Audit, dan Sprint C notification integration digunakan kembali. Tidak membuat Delete engine atau job infrastructure baru.
- Idempotency key di-hash sebelum disimpan. Satu target tetap satu durable operation. Same-identity retry melanjutkan operasi yang sama; identity lain mendapat Conflict ketika operasi belum selesai. Completed operation dapat dibaca/diulang sesudah record dokumen hilang tanpa double cleanup/Audit/notification.
- Reason opsional, trimmed, maksimal 1000 karakter setelah trim; kosong menjadi null. Reason pertama tersimpan pada durable operation dan retained final Audit metadata, bukan workflow comment. Retry tidak mengganti reason operasi yang sudah reserved.
- Completed hanya berasal dari execution phase `COMPLETED`. Flag response `success` hanya true untuk Completed, termasuk ketika Pending/Unknown dikembalikan dengan HTTP 202. Pending/incomplete provenance bukan success. Durable uncertain writer/storage attempt memberi Unknown; known interrupted final database phase dengan semua storage attempts succeeded memberi Failed, bukan Completed. Conflict/Already Processing, 401/403/404/422, dan unavailable/unknown error dibedakan.
- Public DTO hanya operation/project/document identity, snapshot Document Number, status, timestamp completion bila tersedia, dan safe message. SQL/provider stack, storage key, namespace, bucket, credential, serta inventory tidak dikirim.
- Unknown operation tidak dilanjutkan secara destruktif oleh repeated DELETE. Explicit retry atas Pending/known Failed menggunakan identity yang sama dan tetap melewati durable engine checks. Tidak ada retry otomatis frontend.

### Frontend and Modal

- `PermanentDeleteAction` ditambahkan ke action area `DocumentActionGroup` yang sudah dipakai PFD, P&ID, dan SLA Monitoring. Dashboard dan read-only action mode tidak memperoleh Trash. Action View/Edit/Download/Comment/History/Archive/Restore/A/B/C tidak dipindahkan atau diganti.
- Admin visibility berasal dari active membership store dan diperbarui saat role/project berubah. Stale row yang project ID-nya berbeda tidak menampilkan Trash. Keyed state menghapus stale selection; response lama tidak memunculkan toast atau melakukan refresh pada project baru.
- Trash hanya membuka modal, tanpa Delete API. Cancel/X tidak mengirim request. Confirm Delete memakai synchronous ref guard untuk mencegah double submission, global action lock existing, serta tombol/loading disabled selama request.
- Modal memakai `DocumentActionModal` existing (foundation Archive) tanpa mengubah implementasi Archive. Header/title/X, dua info cards, warning text, optional reason textarea, divider/footer, Cancel, dan red Trash/Delete button mengikuti struktur referensi `JANGAN LUPA.png`.
- Document Number dan Current Status berasal dari selected row, bukan nilai mockup hardcoded. Wording warning dan placeholder dipertahankan sesuai prompt.
- Focus trap, dialog attributes, focus return, busy focus target, dan Escape guard ditambahkan hanya untuk modal Delete. Escape tidak menutup modal ketika request sedang diproses.
- Pending/Unknown/Failed/Conflict tetap menampilkan modal/status tanpa optimistic row removal atau success toast. Refresh icon hanya melakukan authorized GET. Unknown dan Conflict tidak menawarkan repeated destructive submission; Pending/known Failed explicit confirmation menggunakan key yang sama.
- Setelah Completed: modal ditutup, success toast Bahasa Indonesia ditampilkan, existing runtime query synchronization menginvalidation Document Register, Dashboard/recent activities, SLA, dan Escalation; notification dan Audit queries juga di-invalidate. Tidak menghapus unrelated cached data. Cache refresh failure tidak mengubah acknowledged Delete menjadi destructive retry.
- Error 401/403 pada flow baru ditampilkan dalam Bahasa Indonesia tanpa mengubah shared authentication behavior.

### Files

| Area | File | Perubahan |
| --- | --- | --- |
| Backend | src/repositories/permanentDeleteApi.repository.js | Scoped authorization, document/operation/status reads |
| Backend | src/services/permanentDeleteApi.service.js | Authorization, reason/idempotency validation, existing engine orchestration, safe status DTO |
| Backend | src/controllers/permanentDelete.controller.js | Response/status mapping dan sanitized errors |
| Backend | src/routes/permanentDelete.routes.js | Authenticated route factory dan runtime adapter wiring |
| Backend | src/app.js | Mount pada prefix existing `/api/v1/documents` |
| Frontend | src/features/document-register/components/PermanentDeleteAction.jsx | Trash, keyed scoped state, approved modal, loading/status/focus/cache handling |
| Frontend | src/features/document-register/components/DocumentActionGroup.jsx | Import dan append Admin Trash; existing actions dipertahankan |
| Frontend | src/features/document-register/services/permanent-delete.service.js | Axios DELETE/GET contract, idempotency header, safe error/status mapping |
| Tests | backend/tests/unit/permanentDeleteApi.test.js | Sebelas unit tests baru |
| Tests | backend/tests/integration/sprintDApiScenarios.cjs dan sprintDApiValidation.cjs | Sembilan belas real HTTP + isolated MariaDB scenarios |
| Tests | backend/tests/integration/sprintA/BDatabaseValidation.cjs, finalizeSprintBInstance.cjs | Report fase baru, exact run-owned operation ID tracking, final integrity verification |
| Tests | frontend/tests/permanentDelete.test.mjs | Dua puluh enam component/API/scoped-state tests baru |
| Test fixture | frontend/tests/fixtures/permanent-delete/* dan tests/servePermanentDeleteFixture.mjs | Synthetic-only UI preview, mocked API/auth/toast, tanpa real backend |

Path backend/frontend pada tabel relatif terhadap `apps/backend` / `apps/frontend`. Tidak ada migration, canonical schema, role seed, environment, workflow, SLA rule, upload revision, atau Archive implementation changes. Dirty changes Sprint A/B/C yang sudah ada dipertahankan, tidak direvert.

## B. Validation

Semua database mutation tests menggunakan MariaDB 10.4.32 terisolasi `127.0.0.1:13317`, server ID 13317, datadir `tmp/mariadb-sprint-b-20261102/data`, database `edms_sprint_b_isolated`, synthetic fixtures, fake R2 dan test-owned local sandbox. HTTP tests memakai real Express routes/controller/service/engine serta existing authenticate middleware dengan signed synthetic JWT dan resolver terisolasi; bukan production login/session UAT.

| Validation | Result | Evidence |
| --- | --- | --- |
| Backend unit | 321 PASS, 0 FAIL, 1 SKIP; 322 total | Seluruh unit tests dengan isolated preload; sebelas tambahan API tests PASS |
| Sprint A regression | 18 PASS | 20261102_0006_sprint_a_isolated_results.json |
| Sprint B regression | 30 PASS | 20261102_0006_sprint_b_isolated_results.json |
| Sprint C regression | 18 PASS | 20261102_0006_sprint_c_isolated_results.json mencakup 30 B + 18 C = 48 PASS |
| Sprint D API | 19 PASS | 20261102_0006_sprint_d_isolated_results.json mencakup 30 B + 18 C + 19 D = 67 PASS |
| Frontend tests | 46 PASS, 0 FAIL | 20 existing + 26 Permanent Delete tests; node --experimental-vm-modules --test |
| Frontend lint | PASS | npm.cmd run lint --workspace=apps/frontend |
| Frontend production build | PASS | npm.cmd run build --workspace=apps/frontend |
| Syntax | 63 JS/CJS files PASS | node --check pada modified/untracked JavaScript/CJS; JSX melalui lint/build |
| Diff whitespace | PASS | git diff --check |
| Final database/backup/shutdown verification | PASS | 20261102_0006_isolated_final_verification.json |
| Browser screenshot/visual interaction check | NOT RUN | Computer Use berhenti karena tidak dapat memastikan current Chrome URL untuk policy enforcement |

Satu backend SKIP berasal dari symlink privilege test Sprint B yang sudah diketahui, bukan Sprint D. Build memberi warning bundle chunk di atas 500 kB; build tetap berhasil, dan tidak dilakukan unrelated bundle refactor.

API matrix D01-D19 semuanya PASS: Admin, empat non-Admin roles meski legacy global role Admin, missing/invalid authentication, cross/stale project, Approved, Archived, omitted/empty/supplied reason, retained reason Audit, accurate Completed/Pending/Unknown/Failed, concurrent requests, idempotency setelah hard deletion, exactly-once Audit/notifications, unrelated document preservation, authorized read-only status, Not Found, dan sanitized internal error.

Frontend tests memverifikasi Admin/non-Admin visibility, seluruh status, shared PFD/P&ID/SLA integration points, Trash-open tanpa API, selected metadata/warning content, Cancel/X, optional/trimmed reason, confirmed single request, double-submit/busy cancel guard, Completed cache refresh, non-success statuses tanpa optimistic deletion, same-key explicit retry, GET-only status refresh, project/role switch, stale-row guard, lost-response lookup, preserved action controls, dan Bahasa Indonesia untuk auth errors. Ini component/service/source integration tests, bukan klaim browser end-to-end atau pixel-comparison.

Saat development, test harness frontend perlu menyediakan React `createElement` yang dihasilkan OXC; ini diperbaiki tanpa mengubah production behavior. Satu run regresi C bertumpang tindih dengan harness B dan gagal pada unrelated-baseline snapshot assertion karena fixture B memang sedang diselesaikan. Evidence disimpan di `20261102_0006_sprint_c_overlap_results.json`; seluruh regression matrix akhir dijalankan ulang secara serial dan PASS. Assertion baseline tidak dihapus atau dilemahkan.

## C. UI Confirmation

- Struktur modal, text, two-card hierarchy, warna/token, textarea, dan footer diverifikasi dari source serta component tests terhadap mockup dan foundation Archive existing.
- Source `DocumentActionModal.jsx`/Archive, global CSS, table columns/layout, sidebar, Dashboard UI, SLA filters/pagination, dan existing action markup tidak diubah. Shared action group hanya mendapat import dan append Trash.
- **Tidak mengklaim pixel-perfect atau browser visual PASS.** Computer Use menghentikan akses Windows Chrome sebelum navigasi karena current URL tidak dapat diverifikasi dengan aman. Tidak mencoba CDP/automation lain untuk melewati guard tersebut.
- Visual/browser interaction dan final live Manual UAT tetap untuk Sprint E setelah persetujuan owner, bukan dilakukan terhadap real documents pada fase ini.
- Synthetic preview server: `http://127.0.0.1:5179/`. Semua Delete/GET pada preview memakai fake adapter, tanpa SQL/backend nyata. Source launcher: `node apps/frontend/tests/servePermanentDeleteFixture.mjs`. Ini bukan URL backend production dan bukan bukti browser visual yang belum dijalankan.

## D. Safety

- Tidak menjalankan SQL atau migration terhadap main XAMPP databases `edms_smpv_dev` / `edms_db`.
- Tidak menghapus dokumen, attachment, atau real storage files; tidak mengakses live R2/Railway untuk deletion.
- Tidak mengaktifkan Resend atau mengirim production email. Sprint C no-email assertions dipertahankan.
- Tidak melakukan bulk namespace binding atau menebak historical root/bucket. Existing unverified-file limitation tetap menghasilkan Pending/blocked state yang aman.
- Tidak mengubah original SQL backup. Final checksum tetap sama. Tiga restore databases masing-masing tetap 24 tabel / 1.231 baris dengan per-table counts tidak berubah; synthetic account tidak dapat membaca database restore.
- Tidak restart/repair original XAMPP. Hanya instance test yang dijalankan dan kemudian dihentikan normal setelah identity/PID/datadir verification dan memastikan active command lain nol.
- Tidak menjalankan ulang backend utama yang dapat memicu background writers. Route activation ada di source dan memerlukan restart backend normal oleh owner pada environment yang disetujui.
- Tidak commit, push, deploy, atau menjalankan Sprint E. Test fixtures/datadir tetap dipertahankan, tidak direset.

## E. Verdict

**SPRINT D COMPLETE** - API/frontend implementation dan automated validation selesai.

Browser visual check tetap **NOT RUN**, bukan PASS; final owner visual approval/live Manual UAT belum diberikan dan berada pada Sprint E. Report ini tidak mengklaim Manual UAT sudah selesai atau memberikan izin deletion pada data nyata.

STOP setelah Sprint D. Tidak melanjutkan Sprint E atau deployment secara otomatis.
