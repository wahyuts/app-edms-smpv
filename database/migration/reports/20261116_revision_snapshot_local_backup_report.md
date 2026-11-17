# Phase B3 - Local Migration Preparation and Database Backup

## Result

READY FOR LOCAL MIGRATION REVIEW. Backup file integrity verified; restore test NOT PERFORMED.
No schema migration, legacy backfill, database DML, storage access, deployment, commit or push was performed.

## Target Verification

- Database: edms_smpv_dev, TCP 127.0.0.1:3306.
- Server: 10.4.32-MariaDB, hostname DESKTOP-3DFA1TA.
- XAMPP executable: D:/xampp/mysql/bin/mysqld.exe, PID 11916.
- Data directory: D:/xampp/mysql/data/.
- Effective backend target was checked privately; no credentials are included here.

## Writer Quiescence

- No listener on backend port 4000 and no EDMS backend/nodemon process found.
- Frontend Vite remained running; the backend API and its internal schedulers were not running.
- Immediately before dump: no other client sessions, no active InnoDB transactions, event_scheduler OFF.
- Database events: 0. MariaDB itself remained running; no unrelated process was terminated.
- Initial gate correctly rejected the audit's own open read-only connection. It was closed before repeating the same gate; no dump existed from that attempt and no safety option was relaxed.
- Final checks again found no other client sessions. All audit connections were closed.
- This is observed quiescence, not a permanent database write fence. Keep writers stopped and recheck before migration.

## Full Backup

- File: `D:\Project\Back Up Database app-edms-smpv Xampp\edms_smpv_dev_pre_revision_snapshot_migration_20261116_190134.sql`
- Local timestamp: 2026-11-16 19:01:34, Asia/Bangkok (UTC+7).
- Size: 2,438,962 bytes.
- SHA-256: `85acd1d9d6165bd3c135efa110a84fb7e1469ab11acc10f58401c514c1c390da`
- Utility: D:/xampp/mysql/bin/mysqldump.exe.
- Utility version: Ver 10.19 Distrib 10.4.32-MariaDB, for Win64 (AMD64).
- Only edms_smpv_dev was selected. Destination was newly created if needed; the output file was opened exclusively, never replacing an existing backup.
- Consistency: single-transaction, quick, skip-lock-tables; all 33 application tables use InnoDB.
- Coverage options included routines, triggers, events, hex-blob and complete-insert. Extended inserts were disabled to verify per-table row counts without replaying SQL. No tablespaces or unrelated databases were exported.
- No password was supplied in arguments or diagnostics; no authentication configuration file was written.

## Integrity Verification

| Check | Actual result |
| --- | --- |
| Utility exit code / stderr | 0 / 0 bytes |
| Expected / dumped base tables | 33 / 33 |
| Populated tables / INSERT-covered tables | 31 / 31 |
| Total INSERT rows | 2,169 |
| Per-table source count versus dump INSERT count | All match |
| Missing schema tables | 0 |
| Views / triggers / routines / events | 0 / 0 / 0 / 0 |
| Selected database marker | Present |
| Dump completion footer | Present |
| Independently reopened file size and SHA-256 | Match |
| Actual restore test | NOT PERFORMED; no test database authorized |

The file is nonempty, has complete schema/data coverage and a valid completion footer. These checks are not proof that a restore has successfully run. No dump SQL was executed or restored. The backup contains sensitive application data and must remain protected outside version control.

## Final Migration Readiness

- Existing migration: database/migration/20261116_0001_revision_upload_snapshots.sql, unchanged.
- Migration SHA-256: `aff3bb3ee84e42515bd25291f82012ae7a6596e9e98cf096f014b863f8be48bd`.
- Three snapshot columns: absent. Two snapshot CHECK constraints: absent, including database-wide name collision check.
- No snapshot partial migration detected; baseline matches the reviewed target structure.
- Final MariaDB read-only preflight: 12 SELECT statements completed. State: NOT APPLIED.
- Revision count before/after backup: 49 / 49; file metadata count: 64.
- Broken revision/file ownership links: 0. Exact row counts for all 33 tables were unchanged on final reread.
- Migration is an additive ALTER with nullable defaults, no existing-row DML/backfill and no changes to active pointers, REV. or revision_label. The SQL design is compatible with MariaDB 10.4.32 as assessed in B1, but execution remains untested and unauthorized.
- Recovery mapping: 38 rows, unique revision IDs, verified classifications and valid stage values.
- Mapping SHA-256, unchanged from B2: `c71b8c54271cf6234be3b975ae29db5df4133d62216e1c0353d59368505231ab`.
- The mapping was not executed; no recovery SQL was generated.

## Remaining Risks and Owner Gate

- No real restore test was performed; recoverability is not claimed as runtime PASS.
- MariaDB 10.4 DDL is not covered by later 10.6 atomic-DDL improvements. DDL implicitly commits and may wait on metadata locks or rebuild the table. A failed or interrupted execution must be inspected, not retried blindly.
- No schema change is authorized in B3. Before B4, obtain explicit owner approval, recheck target, writer quiescence and checksums, and preserve the backup.
- Apply the reviewed schema migration before using new upload code. Legacy stage recovery remains a separately controlled action; ambiguous rows must remain Unknown.
- Railway, R2, application storage, frontend, canonical schema and application source files were not accessed for modification.

STOP - awaiting explicit owner approval for Phase B4.
