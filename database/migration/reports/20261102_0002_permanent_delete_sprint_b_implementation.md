# Sprint B - Resume Implementation and Isolated Validation

Tanggal: 2026-11-02 (Asia/Bangkok).

## A. Status

**SPRINT B BLOCKED.** Implementasi additive tersedia, tetapi Definition of Done belum terpenuhi. Tidak siap untuk deployment/activation.

Owner clarification menggantikan asumsi awal bahwa storage EDMS Railway Volume lama perlu direkonsiliasi. ReBuild local memakai filesystem; deployed development/production menggunakan R2 terpisah menurut owner. Tidak ada migration file Railway Volume yang dibuat. Laporan preflight sebelumnya dipertahankan sebagai historical record, bukan verdict implementasi terakhir.

Blocker saat ini berbeda: isolated MariaDB validation tidak dapat diselesaikan karena request INSERT pada test database tetap RUNNING setelah client watchdog berhenti. Root cause belum terbukti; tidak diklaim sebagai corruption, server bug tertentu atau keberhasilan recovery. Local destructive cleanup juga belum tersedia dengan primitive race-safe; secara eksplisit ditahan Pending.

## B. Implementation Summary

- Namespace identity SHA-256 dari descriptor non-secret. R2: account, endpoint, bucket. Local: real root, device, inode, birthtime. Tidak menyertakan key/secret; rotasi credential tidak mengubah identity. Local fingerprint bukan jaminan anti-remount adversarial.
- Empat sidecar baru: storage_namespaces, stored_file_namespace_bindings, document_delete_executions, document_delete_attempts. Tidak ALTER business tables atau migration Sprint A.
- insertStoredFile existing menangkap namespace dari adapter yang sedang digunakan, kemudian mencatat binding pada koneksi transaksi caller. Berlaku untuk Create Document, Revision/Admin replacement, dan Workflow Attachment karena menggunakan entry point metadata yang sama.
- Bila kedua namespace sidecar belum dimigrasikan, binding dilewati dan file tetap unverified untuk Permanent Delete; upload existing tidak bergantung pada migration yang belum diotorisasi. Capture failure juga meninggalkan file unbound. Partial sidecar installation ditolak. Tidak ada blanket backfill atau mutasi historical file metadata.
- Internal engine dibuat melalui dependency injection. Tidak ada import/init dari app, route, controller, scheduler atau startup. Caller harus memakai reservation Admin Sprint A yang sudah valid. Tidak ada endpoint atau notification baru.
- Inventory menggunakan exact document/project identity, active pointers, revisions, attachments, direct stored files, receipts, history, SLA dan document-targeted notifications. Foreign references dan unknown document-owned schema dependencies menahan cleanup. Temporary metadata yang masih terkait writer target juga menahan cleanup, bukan dihapus berdasarkan uploader.
- Manifest durable dibuat dalam transaksi setelah closed gate dan quiescence dikonfirmasi ulang. Evidence mencakup namespace/file IDs/exact key; digest immutable divalidasi ulang pada resume. Duplicate namespace/key dideduplicasi. Path legacy yang berbeda tanpa proof ditahan Pending. Out-of-prefix canonical metadata tetap dapat diproses.
- Claim worker menggunakan database connection-owned GET_LOCK, bukan lease timer. Sebelum destructive steps dan commit, ownership koneksi diperiksa. Durable IN_FLIGHT dicatat sebelum provider IO. Putus koneksi/unknown tidak mengizinkan worker berikutnya mengulang external delete.
- R2 deletion menggunakan existing SDK adapter dengan exact key dan bucket dari bound descriptor setelah namespace match. SDK ACK adalah terminal acknowledgement untuk exact-key delete, termasuk absent object. Tidak memakai HEAD absence untuk menyelesaikan unknown attempt.
- REJECTED hanya untuk pre-IO namespace/path/local-capability failures dari adapter sendiri; dapat dicoba ulang setelah kondisi diperbaiki. Provider timeout/failure atau crash setelah IO menjadi UNKNOWN/IN_FLIGHT dan tidak otomatis diretry. Tidak ada force-unlock atau TTL completion.
- DB cleanup, final audit dan COMPLETED execution record berada pada transaksi yang sama. Audit final memakai unique identity_key permanent-delete:{operationId}; tidak INSERT IGNORE. Historical audit tetap tersimpan. Completion snapshot menyimpan project/document identity, original number, initiating Admin, reason dan server UTC completedAt.
- Status completion authoritative ada pada sidecar document_delete_executions; Sprint A operation tetap QUIESCENCE_CONFIRMED dan admission tombstone CLOSED. Tidak mengubah CHECK/status foundation yang sudah divalidasi.

### Local Cleanup Limitation

deleteOwnedExact local memeriksa namespace, traversal dan symlink/junction, lalu menolak dengan LOCAL_SAFE_DELETE_UNAVAILABLE. Portable Node path-based unlink tidak menyediakan directory-handle-relative deletion dengan race-safety yang dipersyaratkan. lstat/realpath bukan perlindungan cukup terhadap concurrent parent replacement. Tidak melakukan unlink setelah pemeriksaan yang race-prone dan tidak mendelegasikan ke normal compensation delete.

Ini **bukan implementasi physical local deletion yang berhasil**. Pending adalah safety behavior yang diizinkan owner, tetapi local deletion capability dan UAT sukses tetap gap. Existing normal local upload/download/delete semantics tidak diubah.

## C. Files Changed This Phase

| File/Area | Change | Reason | Regression Risk |
|---|---|---|---|
| apps/backend/src/utils/storageNamespace.js | Added | Non-secret identity, digest, equality, Pending error | Low; pure helper |
| apps/backend/src/repositories/storageNamespace.repository.js | Added | Transaction-scoped new file binding; migration readiness | Medium; adds metadata queries on upload |
| apps/backend/src/repositories/document.repository.js | Updated insertStoredFile only in this phase | Central new-file binding | Medium; normal entry-point test PASS |
| apps/backend/src/storage/drivers/localStorage.driver.js | Added namespace/cautious owned-delete methods | Root identity, explicit race-safe capability refusal | Low for existing methods; owned delete unavailable |
| apps/backend/src/storage/drivers/r2Storage.driver.js | Added namespace/exact owned-delete methods | Pinned namespace; reuse SDK abstraction | Existing methods unchanged; live R2 untested |
| apps/backend/src/services/storage.service.js | Added captureNamespace/deleteOwnedExact | Existing facade integration | Capture failure leaves file unbound |
| apps/backend/src/repositories/documentDelete.repository.js | Added | Inventory, ownership, immutable manifest, transaction cleanup | High; complete real DB validation pending |
| apps/backend/src/services/documentDelete.service.js | Added, not runtime wired | Claim, durable attempts, recovery, completion | High; recovery matrix incompletely validated |
| apps/backend/tests/helpers/deleteStorageDrivers.cjs | Added | VM actual drivers with fake SDK; no live provider | Test-only |
| apps/backend/tests/unit/documentDelete.test.js | Added 10 cases | Namespace, drivers, local fail-closed, binding, migrations | Test-only |
| apps/backend/tests/integration/sprintBDatabaseValidation.cjs | Added 17 scenarios | Verified test DB, synthetic fixtures and fault injection | Explicit execution flag; no auto discovery execution |
| database/migration/20261102_0002_permanent_delete_cleanup_mysql.sql | Added | MySQL additive sidecars | Prepared only |
| database/migration/20261102_0002_permanent_delete_cleanup_mariadb.sql | Added | MariaDB additive sidecars | Applied once on isolated test DB only |
| database/migration/20261102_0002_permanent_delete_cleanup_ROLLBACK.md | Added | Applicability, no auto rollback, evidence retention | Documentation |
| database/migration/reports/20261102_0002_sprint_b_database_results.json | Generated | Latest incomplete real DB run | Synthetic test evidence only |
| database/migration/reports/20261102_0002_sprint_b_database_diagnostic.json | Added | Exact read-only stalled-query observations | No credentials |
| This report | Added | Final A-J evidence and remaining work | Documentation |

Existing Sprint A working tree changes remain preserved. No canonical schema, seed, frontend, routes/controllers, Development Reset or environment file was edited.

## D. Namespace Coverage

| Storage Environment | Identity | Binding | Test |
|---|---|---|---|
| Local sandbox | real root/device/inode/birthtime | Actual driver capture; sidecar design | Unit PASS; physical deletion intentionally refused |
| R2 development | Synthetic account/endpoint/development bucket | Actual adapter descriptor + sidecar | Unit PASS; synthetic full cleanup real DB PASS before final hardening |
| R2 production | Different synthetic bucket | Namespace inequality, mismatch refuses IO | Unit PASS; real DB namespace-mismatch scenario NOT REACHED |
| Credential rotation | Excluded from descriptor | Same identity | Unit PASS |
| Existing file without binding | No fabricated identity | Pending; no manifest/cleanup | Real DB PASS |
| Actual deployed R2 | Not accessed | Actual configuration/ownership not attested | NOT VERIFIED |

## E. Manifest Coverage

| File Source | Ownership Evidence | Namespace Verified | Test |
|---|---|---|---|
| Active revision | Active file/revision + document/project | Fixture binding to actual fake SDK adapter | Real DB PASS |
| Historical revision | Revision.file_id + same document/project | Bound fixture | Real DB PASS |
| Workflow attachment | Attachment/comment/file/document scope | Bound fixture | Real DB PASS |
| Out-of-prefix canonical key | Exact stored-file metadata, not prefix/number | Bound fixture | Real DB PASS |
| Direct stored file without revision child | stored_files.document_id + project | Bound fixture | Real DB PASS |
| Different legacy alias | No independent proof | Must remain Pending | Implemented; real DB NOT REACHED |
| Shared file/normalized alias | Global candidate keys + all known cross-document references | Cleanup blocked | Implemented; real DB NOT COMPLETED |
| Finalized manifest tamper | Immutable evidence digest + file/hash/provider consistency | Must reject before IO | Implemented; real DB NOT REACHED |

## F. Database Cleanup Matrix

All delete predicates use target IDs/project or verified target file IDs. Admission remains CLOSED; no foreign-key disabling.

| Table | Delete/Retain | Ownership Path | Test |
|---|---|---|---|
| engineering_documents | Delete last; clear active pointers inside transaction first | id + project | Real DB PASS |
| comment_read_receipts | Delete before comment | document/project plus comment relation checked | Real DB PASS |
| workflow_attachments | Delete before comment/file | document/project/comment/file | Real DB PASS |
| workflow_comments | Delete before revisions | document/project/revision | Real DB PASS |
| document_history | Delete | document/project | Real DB PASS |
| document_sla_evaluations | Delete | document/project | Real DB PASS |
| document_revisions | Delete before stored files | document/project/file | Real DB PASS |
| stored_files + file bindings | Delete exclusive target only | Verified file IDs, project and references | Real DB PASS |
| notifications | Delete target only; unrelated retained | Document resource type + ID + project | Real DB PASS |
| audit_trail historical | RETAIN including hidden | No document FK/cascade | Real DB historical row PASS; hidden variant not separately tested |
| audit_trail final | INSERT once in cleanup transaction | Operation-specific unique identity | Real DB repeat-resume PASS |
| projects/users/memberships/roles/shared catalogs | RETAIN | Not document-owned | Other fixture document/project remained; full baseline matrix unfinished |
| temporary_uploads | RETAIN/Pending on target writer ambiguity | No guessed uploader ownership | Implemented; isolated real DB test pending |
| Sprint A journals, manifest; Sprint B execution/attempts/namespaces | RETAIN | Recovery/audit evidence | Full cleanup retained durable completion |

## G. Recovery Matrix

| Failure Point | Durable State | Recovery Behavior | Test |
|---|---|---|---|
| Before manifest | Reservation/quiescence evidence | Rebuild only before external IO | Implemented; real DB NOT REACHED |
| After finalized manifest | MANIFEST_FINALIZED + digest | Reuse same immutable manifest | Implemented; real DB NOT REACHED |
| After attempt persisted | IN_FLIGHT | Pending; do not infer IO never started | Implemented; real DB NOT REACHED |
| Partial provider timeout | Per-file SUCCEEDED/UNKNOWN | Keep metadata/gate; never retry unknown automatically | Unit timeout propagation PASS; real DB NOT REACHED |
| After provider ACK before persistence | UNKNOWN or IN_FLIGHT | Keep Pending, no absence-based completion | Implemented; real DB NOT REACHED |
| Before DB commit failure | Transaction rollback | Audit/metadata rollback together; storage evidence retained | Implemented; real DB NOT REACHED |
| After DB commit response loss | COMPLETED + unique audit in same commit | Read durable completion, no duplicate IO/audit | Normal repeat-resume PASS; fault injection NOT REACHED |
| Concurrent recovery workers | Connection-owned advisory claim + durable attempt | Loser Pending; lost claim never licenses unknown retry | Implemented; real DB NOT REACHED |
| Local unsafe primitive | REJECTED before unlink | Pending; files/DB intact | Actual adapter unit PASS |

Named lock alone is not considered evidence of external IO completion. No force-unlock, lease expiry completion, retry of unknown IO or generic upload/COMMIT recovery is provided.

## H. Validation Results

### Executed

- Backend regression: **282 PASS, 0 FAIL, 0 skipped/cancelled**, including existing 272 plus 10 new unit cases. Command: node --require ./apps/backend/tests/helpers/isolatedHttpRegression.cjs --test [13 unit test files from rg]. Existing assertions were not weakened.
- Syntax checks: **40 modified/untracked JS/CJS files PASS**, including preserved Sprint A patches.
- git diff --check PASS (line-ending normalization warnings only).
- MySQL/MariaDB Sprint B logical DDL equivalence: unit PASS; four additive tables, no business ALTER/backfill.
- Actual Local sandbox: namespace identity, traversal refusal, parent junction/symlink escape refusal and no-unlink behavior PASS.
- Actual R2 driver with fake SDK: pinned exact bucket/key, wrong namespace refusal, credential independence, absent-object delete ACK and timeout propagation PASS. No live R2 call.
- Verified target before migration: XAMPP mysqld PID 21968 at D:/xampp/mysql/bin/mysqld.exe, my.ini basedir/datadir/port matched; server 10.4.32-MariaDB, local hostname DESKTOP-3DFA1TA, 127.0.0.1:3306, datadir D:/xampp/mysql/data/, autocommit=1.
- Test DB ownership marker READY and canonical schema/Sprint A migration hashes matched. Migration Sprint B was applied once to edms_sprint_a_test, on the initial run. Later runs found the four existing tables and did not rerun DDL.
- Last MariaDB run completed **3 scenarios PASS**: sidecar migration/FK check; complete synthetic archived-document deletion with four physical fake-R2 files and all owned rows, historical audit retention/final audit once/other-document protection/repeated resume; unbound-file refusal with no manifest.

### Failure and Stop

Initial harness fixture incorrectly used file attributes on workflow_attachments; corrected to canonical relation-only columns. A test safety guard also initially rejected valid writes by synthetic manifest UUID; corrected to allow only manifest IDs created by this run. Neither correction weakened business assertions or changed existing schema.

Subsequent runs showed statements remaining in PROCESSLIST after client watchdog exits. Last diagnostic, filtered to edms_sprint_a_test only, observed connection IDs 46, 48, 53, 56, 59 as Update/RUNNING for 178-461 seconds; no transaction wait start, rows_locked=0 and rows_modified=0. These are observations, **not proof of root cause or absence of eventual effects**. See diagnostic JSON. Client exit is not proof that the database statement has stopped.

Further DB mutation was stopped. No server restart, KILL, repair, reset or forced cleanup was attempted. The harness now refuses a new mutation run when other non-idle test-DB commands exist. Old requests must be reviewed before another run; do not blindly retry migration/INSERTs.

The 17-scenario MariaDB suite is **INCOMPLETE**, not 17 PASS. Fourteen scenarios were not completed on the final run. Full pre-existing test-fixture row preservation check was not reached. Final static hardening added unknown direct document_id dependency detection, temporary-reference ambiguity refusal, and explicit UTC completion snapshot; these final DB paths were not rerun after the stop and remain runtime unverified.

### Migration Scope

- MariaDB Sprint B migration: EXECUTED ON ISOLATED TEST DB ONLY.
- MySQL migration: PREPARED, NOT EXECUTED/RUNTIME VERIFIED.
- Canonical business schema and Sprint A migration files: UNCHANGED.
- SQL mode/timezone changes: session timezone/lock timeout only for test clients, no GLOBAL modification.
- No ordinary transaction rollback is claimed to reverse DDL or already deleted physical objects.

## I. Safety Confirmation

```text
Main edms_smpv_dev / edms_db: NOT CONNECTED TO OR MUTATED
Railway / Production / Staging: NOT ACCESSED
R2 Live: NOT ACCESSED
Existing Real Document Files: NOT ACCESSED OR DELETED
Isolated Test DB: Additive migration and synthetic fixtures only
Synthetic Target Documents / Fake R2 Objects: Actual test cleanup executed
Previous Sprint A Test Fixtures: No intentional mutation; full checksum validation incomplete
Synthetic Survivors / Temporary Sandboxes: Retained, no bulk cleanup/reset
Frontend / Canonical Schema / Seed / Environment Files: UNCHANGED
Public Delete Endpoint / Runtime Cleanup Worker / Delete Notification: NOT CREATED
Development Reset / HOLD Workstreams: UNCHANGED
Commit / Push / Deployment: NOT PERFORMED
```

## J. Remaining Risks and Next Decision

1. **Critical validation blocker:** owner-reviewed resolution of long-running local test-DB commands, then full MariaDB/fault/concurrent-worker matrix. Do not claim cleanup safety fully proven from three scenarios or unit tests.
2. **Local limitation:** race-safe physical unlink is unavailable with the current portable primitive; local Delete remains Pending. Enabling a platform-specific safe capability requires separate reviewed implementation, not an lstat-then-unlink shortcut.
3. **Existing file limitation:** no blanket binding or targeted backfill API is implemented. Existing unbound files intentionally remain Pending. A separately reviewed evidence-driven binding procedure is needed for real historical-file deletion.
4. **Sprint C dependencies:** notification integration and any public/UI activation are not implemented. Completion data exists only for validated completed operations; no notification sent.
5. **Production gaps:** MySQL runtime, real R2 behavior, operational namespace attestation, deployment migration and recovery under actual connection loss are unverified. Root cause of the local stall is unestablished.
6. **HOLD:** general upload/COMMIT ACK-loss compensation remains unchanged. Baseline reproduction tests PASS does not mean that separate bug was fixed.

Owner decision is needed before local server/session recovery. This report does not authorize a restart, KILL, repair or destructive reset. After the environment is reviewed, rerun only the isolated harness; do not rerun migration on main databases or continue Sprint C/D/E.
