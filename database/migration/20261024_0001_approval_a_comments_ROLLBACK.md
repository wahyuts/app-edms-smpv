# Approval A Workflow Comments - Migration Preparation

Status: **PREPARED ONLY - NOT EXECUTED**

## Compatibility and Execution Gates

- MySQL package: MySQL 8.0.16+ with enforced CHECK constraints; verify actual 8.x/9.x runtime and test the single ALTER before production.
- MariaDB package: local MariaDB 10.4.32; verify actual runtime and enabled `check_constraint_checks`. Other versions require review.
- MySQL uses `DROP CHECK`; MariaDB uses `DROP CONSTRAINT`. Do not interchange files.
- Syntax references: [MySQL CHECK](https://dev.mysql.com/doc/refman/8.0/en/create-table-check-constraints.html), [MySQL ALTER](https://dev.mysql.com/doc/refman/8.0/en/alter-table.html), [MariaDB ALTER](https://mariadb.com/docs/server/reference/sql-statements/data-definition/alter/alter-table).
- Actual environment versions are NOT verified by preparation. No SQL in this package has been executed.
- Apply separately: Local -> Railway Development -> Staging -> Production. Obtain approval and complete verification/UAT at each environment before proceeding.
- Stop approval writers, verify target identity and prepare a logical backup with schema/data and recovery readiness. A checksum alone does not prove restore success.
- Run `20261024_0001_approval_a_comments_preflight.sql`; review SHOW CREATE, indexes, CHECK B/C and other constraints, invalid_rows=0 and complete snapshots. Preserve the same connection for migration/verification.
- Snapshots use sorted SHA-256 row fingerprints without exposing comment contents. Metadata fingerprints cover columns, indexes, foreign keys/rules and constraints except the one approved CHECK. Snapshots are not backups.
- Truncation or lost connection means STOP; do not silently increase limits. Review any connection-local limit adjustment and rerun preflight before migration.
- Execute ONLY the engine-specific migration after separate Phase C approval. Then run `20261024_0001_approval_a_comments_verify.sql`, manually confirm target expression/enforcement and unchanged data/structure before releasing writers.
- The verification intentionally does not claim semantic equivalence of an arbitrary CHECK expression. Inspect exact A/B/C membership and enforcement; isolated runtime tests must accept A/B/C and reject invalid actions.
- DDL causes implicit commit and may scan/lock/rebuild the table. Do not promise zero downtime or crash-safe atomic DDL on an untested engine. Do not retry a failed ALTER without inspecting the resulting schema.
- Migration files are not connected to startup, build or deployment scripts. Canonical schema edits do not migrate any existing database.
- Migrate the database before enabling the new backend; otherwise Approval A comment INSERT can fail and roll back approval.
- Store backups and any detailed evidence outside version control. Never include credentials or comment/user contents in reports.

## Rollback Before Any Approval A Comment Exists

1. Stop new approval writers and roll back the application code as appropriate.
2. Obtain separate rollback approval; verify the target and an up-to-date recovery backup.
3. Read-only check all rows satisfy B/C and no Approval A rows exist.
4. Prepare a reviewed engine-specific single ALTER restoring only the named B/C CHECK.
5. Verify data and all unrelated structure remain unchanged. Ordinary transaction ROLLBACK is not a DDL recovery strategy.

## Rollback After Approval A Comments Exist

Do NOT restore the old B/C CHECK, delete comments, relabel A as B/C, or change historical authors.
Prefer rolling back application code while retaining the A/B/C CHECK and every existing comment.
Any data remediation or full backup restore requires a separate owner decision and reconciliation plan; restoring a backup may discard later valid transactions.

## Phase C Validation Pending

Run the real migration and read-only verification only after approval. Test both reviewer roles, rollback on failed comment INSERT, retry/concurrency, B/C attachments, author snapshots, comment read receipts, sorting and unchanged notification/audit identity. No database-backed test is claimed PASS in Phase B.
