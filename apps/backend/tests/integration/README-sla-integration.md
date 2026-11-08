# SLA Integration Preparation - C2A

## Status

Offline preparation only. No database driver, pool, live credential reader, SQL executor,
fixture writer, or cleanup executor is imported or provided by the entrypoint.
Do not run the legacy Permanent Delete integration scripts for this workstream.

```powershell
node apps/backend/tests/integration/slaIntegrationPreparation.cjs --dry-run
node --test apps/backend/tests/unit/slaIntegrationPreparation.test.js
```

Importing the helper/entrypoint performs no file reads, connections, or SQL. The explicit
dry run reads only the three schema/migration sources and emits inventory/hashes/counts.
All other CLI modes are rejected. No npm integration execution script is added.

## Audit Baseline

- `isolatedMariaDb.cjs` provides useful identity/ownership/deadline patterns but pins
  MariaDB 10.4.32, port 13317, a private datadir, and Permanent Delete database names.
- `sprintBDatabaseValidation.cjs` invokes `main()` when imported. Its flags can enable
  real SQL, schema creation, storage fixtures and cleanup; its wrapper lacks `destroy()`.
- `sprintCNotificationValidation.cjs` imports that runner after changing process argv.
- None of those runners is imported or modified here. The pure SLA helper is separate.
- Application `config/env.js` loads dotenv. No production module is imported here.
- Installed mysql2 PromisePoolConnection forwards synchronous `destroy()` to its raw
  pool connection. The wrapper preserves this contract, not a manufactured DB outcome.

## Target and Authority

Proposed target: `127.0.0.1:3306 / edms_sla_integration_test`, MariaDB 10.4.32.
These are pinned offline expectations, NOT a statement that the target exists, was
verified, or has been authorized. A version difference requires review, not fallback.
No credentials belong in this configuration. Never read the application's `.env`.

Offline validation checks exact intent, database, host, port, expected engine/version,
and rejects extra fields. `APP_ENV=test`, a filename, or a database name grants nothing.
`assertMutationAuthorized()` ALWAYS denies in C2A, even if every caller JSON field says PASS.
Its missing-check diagnostics are not proof that any supplied check was verified.

Future runtime verifier (NOT IMPLEMENTED; requires new approval):
1. Approve separate read-only inspection and connection configuration.
2. Read actual database/connection ID, server hostname/port/datadir/server ID and version;
   compare with independently approved XAMPP identity, never a caller marker alone.
3. Verify schema engine, SQL mode, isolation, timezone, CHECK/FK/index metadata and grants.
4. Verify a database-resident ownership marker created by approved provisioning, bound
   to database identity and reviewed source hashes. Reject foreign/unowned databases.
5. Issue a private, connection-scoped, short-lived capability for one approved operation;
   never accept serialized caller evidence as that capability. Recheck on each acquisition.
6. Provisioning an absent database is a separate admin operation: it cannot reuse an
   application-mutation gate that presumes an already-owned schema. No admin grant is implied.

## Schema Dependency Inventory

1. `database/schema/schema-dev.sql`: 24 base tables including projects, users, memberships,
   documents, files/revisions/history, evaluations, notifications and audit.
2. `20261102_0001_permanent_delete_foundation_mariadb.sql`: five evidence/coordinator
   tables. SLA needs the coordinator; admitted workflow continuations also use writer/IO evidence.
3. `20261102_0002_permanent_delete_cleanup_mariadb.sql`: four namespace/delete sidecars.
   File-bearing Approval/Revision scenarios require namespace/provenance dependencies.

Inventory discovery is NOT an SQL parser. No executable DDL is extracted or generated.
Canonical `CREATE DATABASE` and `USE edms_smpv_dev` make direct schema application unsafe.
Every schema batch is blocked, including apparently harmless batches. Before later schema
execution, separately review a target-free artifact and hashes; do not introduce a naive
semicolon splitter or blindly replace database names. Provisioning stays separate.
Preserve all FKs, unique keys, CHECKs and `sla_started_at NOT NULL`. Do not insert into
generated columns or replay additive migrations already represented in the base schema.

## Fixtures and Cleanup

The pure plan uses a caller-supplied run ID, five official roles, synthetic user keys,
two projects, ten memberships and 500 proposed documents. Viewer is a negative recipient case.
User keys are NOT database numeric IDs: future execution must capture actual insert IDs
and record exactly which rows it created. Do not import real users, backups or seed-demo.

Create reference roles -> users -> projects -> memberships -> documents with NULL active
pointers -> optional stored files/revisions -> active pointers -> workflow/history/evaluation.
Credential/permission/session fixtures are additional prerequisites for HTTP authentication.
The baseline is reserved for a future verified DB UTC reference, not the browser clock.
Use local synthetic storage only for workflow scenarios; no production files or live R2.

Future cleanup requires new approval plus settled tasks and an exact per-run ownership ledger.
Remove owned notification/audit/evaluation/comment/attachment/history rows first; clear owned
active pointers before removing owned revisions, bindings/files, documents, memberships,
projects and users. Credentials/sessions and evidence rows require their own dependency order.
Remove reference rows only if created by this run and no longer referenced. No prefix-only
DELETE, DROP, TRUNCATE, reset, FK disabling, or cleanup of unknown outcomes. Preserve unresolved
writer/IO evidence and STOP for review. No cleanup SQL is provided in C2A.

The wrapper only decorates an explicitly supplied, already-owned connection; it cannot
connect, authorize a target, create a pool, or verify a server. It forwards driver promises
and original errors unchanged, has no automatic rollback/retry, and blocks reuse after disposal.
Use fake connections for C2A contract tests. A real connection requires the future runtime gate.

## MariaDB / MySQL Boundary

MariaDB preparation does not prove Railway MySQL compatibility. Actual engine/version,
collation behavior, SQL mode/isolation, query plans, timeout/deadlock victim selection,
session timezone/date parsing and connection disposal remain UNVERIFIED. The base uses STORED;
the selected foundation variant uses MariaDB PERSISTENT. Never silently substitute the MySQL
variant. Later tests must match application mysql2 date handling (do not copy dateStrings:true
from the old helper), observe fresh DB time, and verify rollback/COMMIT/disposal with real evidence.
SLA SQL's basic queries/upsert/JSON usage have only been inspected statically, not executed.
Ambiguous COMMIT needs transport fault injection and independent evidence, not a mock throw.
Process shutdown and cross-process concurrency still need separately approved integration tests.

## Separate Owner Approvals Required

- Manual XAMPP startup.
- Read-only connection/identity/schema/grants inspection.
- Dedicated test database/user provisioning and exact privileges.
- Reviewed target-free schema/migration application.
- Synthetic fixture insertion and exact-ledger cleanup.
- Controlled lock/deadlock/timeout tests.
- Connection interruption and COMMIT transport fault injection.

Approval of one item implies none of the others. C2A does not proceed to C2B.
