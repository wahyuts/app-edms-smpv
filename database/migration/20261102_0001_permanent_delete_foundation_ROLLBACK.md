# Permanent Delete Foundation - Sprint A

## Applicability

- Original preparation is retained as a comment-only legacy archive, not an executable migration.
- Canonical files are `20261102_0001_permanent_delete_foundation_mysql.sql` and `20261102_0001_permanent_delete_foundation_mariadb.sql`. Execute exactly one verified engine variant, never the entire directory.
- The MariaDB variant was executed only in the isolated XAMPP test database during the subsequent database validation phase. Main development and online databases were not migrated.
- Target syntax: MySQL 8.0.16+ (current Railway runtime version unverified) and verified XAMPP MariaDB 10.4.32. MySQL runtime validation remains a gap; see the separate database concurrency report.
- Five technical tables; no changes to business tables, workflow, permission mappings or canonical baseline schema.
- Application code requires these tables. Apply the reviewed additive migration before starting the updated backend. Do not deploy a mixed fleet of old and new writers.
- No public reservation endpoint, manifest population, cleanup worker or actual Delete is included.

## Writer and Lock Boundary

Lock coordinator rows in sorted project/document order before business rows. Existing admitted writers retain their generation and may drain only while the owning operation is QUIESCENCE_PENDING. Settlement and quiescence use the same coordinator lock. No reopening, lease expiry or automatic UNKNOWN reconciliation is provided.

Storage evidence uses a separate bounded pool so an IO acknowledgement can be persisted while a business connection is occupied. Both pools use the same configured database. SQL-only statements use a coordinator lock in their own transaction; multi-stage document actions retain one durable lifecycle token through post-commit processing.

Runtime inserts for all four populated technical tables explicitly use UTC_TIMESTAMP(3) for created_at/updated_at. This was verified under a non-UTC database session; CURRENT_TIMESTAMP defaults alone must not be treated as a UTC guarantee. Future manifest writers must follow the same rule.

Archive/Restore also retain a SQL lifecycle record through their post-commit document Audit Trail append. This does not create storage IO records. Single-statement SQL writers do not need a durable writer row. Document audit inserts use the same gate without changing historical audit records or their retention.

Coordinator creation uses a duplicate-key UPDATE to acquire an exclusive lock directly, avoiding an INSERT IGNORE shared-lock upgrade. Quiescence resolves immutable operation identity before opening its locking transaction, then reads completion evidence after the gate lock. CONFIRMED is monotonic within Sprint A. A detached SQL/storage continuation leaves its parent unresolved; a closed context cannot start a new mutation. Existing approval email dispatch only reads document data and sends email; it is not a document-owned SQL/storage writer.

An IO record describes one awaited adapter invocation, including the SDK's internal retries and the adapter's COPY/HEAD/source cleanup or reverse move. Its exact source/destination are recorded before invocation. Any exception or missing acknowledgement remains unresolved, even if a later HEAD succeeds. There is no claim of wire-level attempt reconciliation.

## Rollback

Stop application writers and inspect all five tables before any rollback. A backup and explicit owner approval are required for database rollback. Do not drop technical evidence while any reservation, ACTIVE/UNRESOLVED writer, or IO step exists. Never reopen a gate to make rollback convenient.

If no operations have ever been recorded, an operator may review removal of the five empty technical tables after the backend has been rolled back. No automatic DROP script is supplied. DDL is not undone by transaction ROLLBACK.

If operations exist, retain tables and use compatible code. Reverting to a backend that ignores gates is unsafe. Sprint B must define terminal operation states, evidence retention and recovery before enabling actual deletion. The unique target operation constraint deliberately prevents a second reservation lifecycle in Sprint A.

## Read and Maintenance Limits

New direct document requests are guarded. Streams admitted before reservation are not cancelled; already delivered bytes cannot be revoked. List/dashboard queries remain available and do not acquire project-wide locks.

Development Reset is a development-only destructive maintenance utility. It must be executed exclusively with all application writers stopped and no unresolved storage operations. Concurrent execution with normal application activity is unsupported. Maintenance coordination is outside Sprint A scope.

Standalone storage-smoke is also an explicit maintenance tool, not Delete recovery. Never use reset/seed to repair coordination state. No runtime coupling to Development Reset has been added.
