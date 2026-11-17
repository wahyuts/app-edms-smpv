# Phase B5 - Controlled Local Legacy Stage Recovery

## A. Environment Verification

- Date: 16 November 2026, UTC+7.
- Target: `127.0.0.1:3306 / edms_smpv_dev`, `10.4.32-MariaDB`, hostname `DESKTOP-3DFA1TA`.
- Datadir: `D:\xampp\mysql\data\`; XAMPP executable `d:\xampp\mysql\bin\mysqld.exe`, PID 11916.
- Backend/nodemon absent; backend port 4000 not listening; port 3306 owned by the verified XAMPP process.
- No other client sessions or active InnoDB transactions at pre-execution checks; event scheduler OFF. MariaDB was not stopped.
- Schema matches Phase B4: three nullable snapshot columns and both exact CHECK definitions present; session CHECK enforcement enabled. No triggers exist.
- All 49 revisions initially had NULL stage, username, and role snapshots.

## B. Backup Result

### Existing B3 Backup

- Path: `D:\Project\Back Up Database app-edms-smpv Xampp\edms_smpv_dev_pre_revision_snapshot_migration_20261116_190134.sql`.
- SHA-256 reverified: `85acd1d9d6165bd3c135efa110a84fb7e1469ab11acc10f58401c514c1c390da`.
- B3 report confirms successful completion, full 33-table coverage and 2,169 data rows. This backup predates the snapshot schema migration.

### New Pre-Backfill Full Backup

- Path: `D:\Project\Back Up Database app-edms-smpv Xampp\edms_smpv_dev_pre_legacy_stage_backfill_20261116_193353.sql`.
- Created: `2026-11-16 19:33:53 UTC+7`; size: **2,444,519 bytes**.
- SHA-256: `80a7d491cbc30da78210f9763824ce78973f91cc8e28f6f18ffd288c6c72ab0b`.
- Utility: local XAMPP `D:\xampp\mysql\bin\mysqldump.exe`; exit 0; stderr 0 bytes. Existing backups were not overwritten.
- Single-transaction full dump of the target database only; all tables InnoDB. Options included routines, triggers, events, hex-blob, complete inserts and no extended inserts.
- Completion footer and database marker present; 33/33 CREATE TABLE definitions; per-table INSERT row counts match all 2,169 source rows. New snapshot columns are included.
- Views/triggers/routines/events: 0/0/0/0. Their export options were enabled.
- Backup hashes independently reread and unchanged after backfill. No SQL dump was restored or executed.
- **Actual restore test: NOT PERFORMED.** File integrity and coverage do not prove a successful restore.

## C. Mapping and Evidence Revalidation

- Mapping SHA-256: `c71b8c54271cf6234be3b975ae29db5df4133d62216e1c0353d59368505231ab`, matches Phase B2 and remains unchanged.
- Exactly 38 unique revision IDs: 28 IFR-Submitted and 10 IFA-Submitted; all 11 AMBIGUOUS inventory rows excluded.
- Classification revalidated: 15 VERIFIED_DIRECT; 16 initial VERIFIED_CORRELATED; 7 other VERIFIED_CORRELATED.
- Recomputed all 38 fingerprints using the original deterministic SHA-256 of JSON `{revision, history, audit}`, with the same explicit field ordering and numeric representation as B2: **38/38 match**. Driver BIGINT strings were losslessly converted to safe integers to reproduce the original representation; no values were truncated or inferred.
- Fresh original revision/file/document projection (49 rows), history (117 rows), and relevant audit dataset (122 rows) match the B2 evidence datasets.
- Every target rechecked for exact revision/project/document/file identity, sequence, uploader, file ownership, referenced evidence and recorded stage.
- Direct evidence requires one exact revision-referenced upload audit, matching project/uploader/sequence and explicit upload stage. Initial correlations require unique sequence-1 revision and initial upload history/audit. Other correlations require one-to-one upload history and revision keys.
- Mutable revision labels, current workflow state and timestamp proximity were not used as stage proof. No physical storage calls were made.

## D. Transaction Result

- Execution: **COMMIT**, one explicit transaction, **38 rows updated**, one affected row per guarded UPDATE, no warnings or transaction errors.
- Start: `2026-11-16 19:35:11.670 UTC+7`; end: `19:35:11.821 UTC+7`.
- All revision rows locked before writes. Parameterized UPDATEs set only `document_revisions.upload_stage_snapshot`, with binary exact identity guards for revision/project/document/file, matching sequence/uploader, and NULL guards for all three snapshots.
- Inside the transaction: all 38 values matched mapping; all 11 exclusions remained NULL; username/role remained NULL; all non-target data fingerprints matched before COMMIT.
- No retries, skipped targets, replacement rows, schema changes, trigger effects, or additional UPDATE columns.
- A preliminary read-only evidence query initially used incorrect document-column names and returned ER_BAD_FIELD_ERROR. It was corrected against canonical definitions before any write. Other preliminary assertion differences concerned driver numeric types and JavaScript object prototypes; serialized values and all evidence fingerprints subsequently matched. These were not bypassed evidence mismatches.

## E. Post-Backfill Validation

Independent read-only connection after COMMIT (connection ID 92): **PASS**.

| Check | Result |
| --- | ---: |
| Total revisions | 49 |
| IFR-Submitted snapshots | 28 |
| IFA-Submitted snapshots | 10 |
| As-Built snapshots | 0 |
| NULL stage snapshots / excluded ambiguous revisions | 11 |
| NULL username snapshots | 49 |
| NULL role snapshots | 49 |
| Unexpected target value differences | 0 |

- Compared all original/non-target columns across 33 tables and 2,169 rows using sorted row serialization SHA-256 and exact counts. Only the authorized stage column was excluded from non-target hashes; its 49 values were individually checked against the allowlist instead.
- Original revision metadata, file references, Active File pointers, REV., revision_label, workflow, SLA, Approval, Archive, Audit Trail, Notification and every other table's data remain unchanged.
- Non-target revision fingerprint before/after: `134b97452adb42238db6cd7a64d54fd574c51d081cfa8c62478050f23609a8d4`.
- SHOW CREATE TABLE definitions for all 33 tables unchanged. No active transaction remained at final observation. All own database connections closed.

## F. Remaining Risks

- Both backups have integrity/coverage evidence, but no restore test was performed.
- Legacy username and role remain unknown: all 49 snapshots intentionally NULL. Eleven stages remain unknown; no speculative backfill.
- Existing approximately seven-hour revision/file timestamp difference was not corrected or used to infer stage.
- Application runtime UAT and Phase C were not run. Observed writer quiescence is not a permanent database fence; keep rollout coordination separate.
- Railway migration/recovery remains pending and was not accessed. R2/storage was not accessed. No source/frontend change, seed, deployment, commit or push occurred.

## G. Final Decision

**LOCAL LEGACY RECOVERY COMPLETE**

STOP - awaiting owner review before Phase C.
