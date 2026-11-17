# Phase B4 - Local Revision Snapshot Migration

## Result

**LOCAL MIGRATION COMPLETE** - 16 November 2026.

| Check | Result | Evidence |
| --- | --- | --- |
| Safety gate | PASS | Exact target, writers stopped, backup and migration hashes matched; new objects absent |
| Migration execution | PASS | One execution; no SQL error; warning count 0 |
| Schema validation | PASS | Three nullable columns and two exact CHECK definitions added |
| Data integrity | PASS | Original data hashes/counts identical across all 33 tables, 2,169 rows |

## Target and Safety Gates

- Connection: `127.0.0.1:3306 / edms_smpv_dev`.
- Server: `10.4.32-MariaDB`, hostname `DESKTOP-3DFA1TA`.
- Data directory: `D:\xampp\mysql\data\`.
- XAMPP process: PID `11916`, executable `d:\xampp\mysql\bin\mysqld.exe`, configuration `d:\xampp\mysql\bin\my.ini`.
- Backend/nodemon process absent; backend port 4000 not listening.
- Other client sessions: 0; active InnoDB transactions: 0 before and after execution.
- Event scheduler: OFF; session CHECK enforcement: enabled.
- Session SQL mode unchanged: `IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION`.
- Three snapshot columns and both new constraint names were absent before execution.
- Pre-execution schema and original data captured in memory using SELECT/SHOW only. Original data was rechecked immediately before execution.

## Backup and Migration

- Backup: `D:\Project\Back Up Database app-edms-smpv Xampp\edms_smpv_dev_pre_revision_snapshot_migration_20261116_190134.sql`.
- Backup SHA-256 reverified before and after migration: `85acd1d9d6165bd3c135efa110a84fb7e1469ab11acc10f58401c514c1c390da`.
- Backup preparation evidence: `20261116_revision_snapshot_local_backup_report.md`. Restore test was not performed.
- Migration: `database/migration/20261116_0001_revision_upload_snapshots.sql`.
- Migration SHA-256: `aff3bb3ee84e42515bd25291f82012ae7a6596e9e98cf096f014b863f8be48bd`, unchanged from the reviewed Phase B3 artifact.
- Execution: exactly once, on the verified dedicated connection (ID 56).
- Start: `2026-11-16 19:11:11.291 UTC+7` (`12:11:11.291Z`).
- End: `2026-11-16 19:11:11.410 UTC+7` (`12:11:11.410Z`).
- SQL result: SUCCESS, 0 warnings. Driver reported 49 affected rows during ALTER; this is not a legacy backfill. Original row values were independently compared afterward.

## Schema Validation

| Column | Actual definition | Result |
| --- | --- | --- |
| upload_stage_snapshot | VARCHAR(64) NULL DEFAULT NULL | PASS |
| uploaded_by_username_snapshot | VARCHAR(255) NULL DEFAULT NULL | PASS |
| uploaded_by_role_snapshot | VARCHAR(64) NULL DEFAULT NULL | PASS |

All three use `utf8mb4_unicode_ci`, consistent with the existing table.

- `chk_document_revisions_upload_stage_snapshot`: NULL or exactly the listed values `IFR-Submitted`, `IFA-Submitted`, `As-Built`; stored CHECK expression matches the migration.
- `chk_document_revisions_uploaded_by_role_snapshot`: NULL or exactly the listed values `Admin`, `Document Owner`, `Team Process`, `Team Project`, `Viewer`; stored CHECK expression matches the migration.
- All 13 original revision columns retain their definitions. Primary/unique keys, indexes, foreign keys, and four original revision CHECK constraints are unchanged.
- Schema-wide original column/index/FK/constraint metadata is unchanged, excluding only the three approved columns and two approved CHECK constraints.
- SHOW CREATE TABLE definitions for the other 32 tables are identical before/after.

## Data Integrity

- Revisions: **49 before / 49 after**; stored files: **64 before / 64 after**.
- All original columns of every table were read explicitly before/after. Sorted row serializations were compared by SHA-256 with row counts; all 33 tables match, including 2,169 original rows.
- Original revision data fingerprint before/after: `14d57ce55a5954d5ec41e5eba23faa08a7e6bab3cb6fc30dc10bbacbbf87817c`.
- Existing file references, active file pointers, revision_label, REV., workflow, SLA, Approval, Archive, and other original application data are unchanged by this comparison.
- All 49 existing revisions have NULL in all three new snapshot columns. No legacy backfill occurred.
- Recovery mapping CSV unchanged: SHA-256 `c71b8c54271cf6234be3b975ae29db5df4133d62216e1c0353d59368505231ab`.
- No SQL error, unexpected schema change, or unexpected data difference was observed. Dedicated connection closed after verification.

## Limits and Next Gate

- Validation was read-only after migration. No test inserts or invalid-value writes were performed; CHECK definitions/enforcement settings were inspected, not fault-tested with DML.
- Legacy historical metadata intentionally remains NULL. No inference or recovery mapping was applied.
- Application upload/runtime UAT and Phase B5 were not executed. This report is not a backup or a restore-test result.
- Railway, storage/R2, application source, frontend, canonical schema, and migration files were not changed. No seed, restore, deployment, commit, or push occurred.
- Stop here pending owner review before Phase B5.
