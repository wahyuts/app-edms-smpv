# C2B-PLAN-01 - Provisioning Execution Plan

Status: AWAITING EXPLICIT OWNER APPROVAL. This is the C2B approval checkpoint,
not the final C2B report. No database operation has been executed for this plan.

## 1. Target and Preflight

Only `127.0.0.1:3306 / edms_sla_integration_test`, expected MariaDB 10.4.32,
XAMPP executable `D:/xampp/mysql/bin/mysqld.exe`, datadir `D:/xampp/mysql/data`,
hostname `DESKTOP-3DFA1TA`, server ID 1. These are R1 observations, not fresh verification.
Recheck listener PID/executable/my.ini and actual socket/server identity after approval.
Use explicit local configuration, not application dotenv. Keep backend/frontend OFF.

Before mutation, verify test database is absent, both proposed accounts are absent, and
the reviewed source/artifact hashes still match. If any object/account already exists,
identity differs, authentication fails, or schema has drifted: STOP; do not adopt or retry.
Metadata checks may inspect names/grants only, never development business rows or hashes.

## 2. Database and Account SQL (Administrator Only)

The following are reviewed templates, NOT instructions to execute now. `?` parameters
are bound by mysql2 (`query` for account DDL), not literal passwords or manual inputs.
Do not add IF NOT EXISTS or OR REPLACE; unexpected objects must fail closed.

```sql
CREATE DATABASE `edms_sla_integration_test`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'edms_sla_schema'@'127.0.0.1' IDENTIFIED BY ?;
CREATE USER 'edms_sla_runner'@'127.0.0.1' IDENTIFIED BY ?;
GRANT SELECT, CREATE, ALTER, INDEX, REFERENCES
  ON `edms\_sla\_integration\_test`.* TO 'edms_sla_schema'@'127.0.0.1';
GRANT SELECT ON `edms\_sla\_integration\_test`.*
  TO 'edms_sla_runner'@'127.0.0.1';
```

Escaped underscores on database-level grants prevent wildcard scope expansion;
backticks alone are not the isolation proof. Verify actual grants before any test.
Runner DML is granted only on the following explicit tables after their creation:

```sql
GRANT INSERT, UPDATE, DELETE ON `edms_sla_integration_test`.`roles` TO 'edms_sla_runner'@'127.0.0.1';
GRANT INSERT, UPDATE, DELETE ON `edms_sla_integration_test`.`users` TO 'edms_sla_runner'@'127.0.0.1';
GRANT INSERT, UPDATE, DELETE ON `edms_sla_integration_test`.`projects` TO 'edms_sla_runner'@'127.0.0.1';
GRANT INSERT, UPDATE, DELETE ON `edms_sla_integration_test`.`project_memberships` TO 'edms_sla_runner'@'127.0.0.1';
GRANT INSERT, UPDATE, DELETE ON `edms_sla_integration_test`.`engineering_documents` TO 'edms_sla_runner'@'127.0.0.1';
GRANT INSERT, UPDATE, DELETE ON `edms_sla_integration_test`.`document_sla_evaluations` TO 'edms_sla_runner'@'127.0.0.1';
GRANT INSERT, UPDATE, DELETE ON `edms_sla_integration_test`.`notifications` TO 'edms_sla_runner'@'127.0.0.1';
GRANT INSERT, UPDATE, DELETE ON `edms_sla_integration_test`.`audit_trail` TO 'edms_sla_runner'@'127.0.0.1';
GRANT INSERT, UPDATE, DELETE ON `edms_sla_integration_test`.`document_admission_coordinators` TO 'edms_sla_runner'@'127.0.0.1';
GRANT INSERT, UPDATE, DELETE ON `edms_sla_integration_test`.`edms_sla_test_ledger` TO 'edms_sla_runner'@'127.0.0.1';
```

No runner global privilege, DDL, GRANT OPTION, marker write, FILE, PROCESS or KILL authority.
Verify CURRENT_USER and SHOW GRANTS for both connections. Reject additional effective grants
or role memberships; global USAGE alone is not an effective data privilege. No development access.
After schema verification, remove setup DDL privileges and verify again:

```sql
REVOKE CREATE, ALTER, INDEX, REFERENCES ON `edms\_sla\_integration\_test`.*
  FROM 'edms_sla_schema'@'127.0.0.1';
```

Administrator credentials remain in memory, sourced only from the explicitly verified
local connection configuration. They are never passed to the integration runner.
Generate two independent 32-byte random passwords. Store only dedicated credentials,
the expected ownership nonce and artifact hashes in a new exclusive local file:
`tmp/sla-integration-c2b/credentials.json` (already gitignored). Restrict its directory/file
ACL to the current Windows user and SYSTEM before writing; no secrets in argv, logs,
SQL diagnostics or reports. If secure storage/ACL cannot be established, STOP before DDL.
Refuse to overwrite an existing credential file or reuse accounts from an earlier attempt.

## 3. Ownership and Ledger SQL (Administrator, Exact Target Connection)

Connect with database explicitly set to the verified test target; no USE statement.
Create these two test-only technical tables before schema setup. They are not application migrations.

```sql
CREATE TABLE edms_sla_test_ownership (
  owner_id VARCHAR(128) NOT NULL,
  database_name VARCHAR(64) NOT NULL,
  owner_nonce CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  schema_sha256 CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  state VARCHAR(16) NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (owner_id),
  UNIQUE KEY uq_sla_test_database (database_name),
  CONSTRAINT chk_sla_test_owner_state CHECK (state IN ('PROVISIONING','READY'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE edms_sla_test_ledger (
  run_id VARCHAR(32) NOT NULL,
  entity_table VARCHAR(64) NOT NULL,
  entity_key VARCHAR(160) NOT NULL,
  identity_columns JSON NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (run_id, entity_table, entity_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO edms_sla_test_ownership
  (owner_id,database_name,owner_nonce,schema_sha256,state,created_by,created_at)
VALUES ('app-edms-smpv:sla-c2b','edms_sla_integration_test',?,?,'PROVISIONING',CURRENT_USER(),UTC_TIMESTAMP(3));
```

The nonce is generated only during approved provisioning; it is not a caller-supplied
PASS flag. Verify the row independently against server identity, the securely retained
nonce, approved schema hash, marker definition and actual grants. The runner has SELECT
but no mutation authority on this table. Transition only after verified schema application:

```sql
UPDATE edms_sla_test_ownership SET state='READY'
WHERE owner_id='app-edms-smpv:sla-c2b' AND database_name='edms_sla_integration_test'
  AND owner_nonce=? AND schema_sha256=? AND state='PROVISIONING';
```

Require affectedRows=1. Future runtime gate must read identity/marker/grants from actual
connections, reject ambiguous evidence, and use private connection/run-scoped authority.
The C2A guard remains deny-only, unchanged. No trusted capability is issued by this plan.

## 4. Schema Application

Reviewed artifact: `sla-c2b-schema.sql`, SHA-256:
`a03200cce62313583eb13fb01ab0857d7e42fe10fb2d8a4d87f23698916de095`.
Source hashes are available with `node apps/backend/tests/helpers/slaC2bPlan.cjs --plan`.

Apply 12 unchanged canonical tables in source order: departments, roles, document_types,
users, projects, project_memberships, engineering_documents, stored_files, document_revisions,
document_sla_evaluations, notifications, audit_trail. Apply the two active-pointer FKs only
after stored_files/document_revisions exist. Then apply all five unchanged foundation
MariaDB definitions: coordinator, delete operation, writer operation, storage IO, manifest.
This is the required subset of canonical base plus migration 0001; do not replay full sources.
Total: 17 application/evidence tables plus the two test technical tables = 19 tables.

No namespace/cleanup migration 0002, workflow comments/history, credentials or HTTP tables
are needed: C2B tests the SLA producer directly, not Approval/Revision or storage workflows.
The file contains no CREATE DATABASE, USE, seed or cleanup. Extraction is restricted to
the reviewed canonical declaration format and exact active-pointer ALTER; it is not a
general SQL parser. Verify artifact hash before execution. The later executor may apply
only these pinned statements and check same-target FK dependencies, never arbitrary input SQL.

Verify SHOW CREATE TABLE and metadata: columns/types/nullability, generated expressions,
all PKs/unique indexes/FKs/CHECKs, InnoDB and unicode_ci collation, and FK enforcement.
Preserve email uniqueness, notification/audit identities, document/cycle uniqueness,
single-active revision and NOT NULL SLA baseline. Do not ALTER canonical definitions to pass tests.
DDL implicit commits: failure leaves actual partial state. STOP without DROP/recreate,
automatic repair, marker READY update, account fallback or credential replacement.

## 5. Session Policy and Fixtures

On approved setup/test connections only:
```sql
SET SESSION time_zone = '+00:00';
```
Keep actual SQL mode unchanged (including driver's IGNORE_SPACE) and assert isolation
REPEATABLE-READ. Record both session/global settings. Fail on unexpected DML/DDL warnings;
use genuine FK/CHECK/unique violations rather than relying on non-strict truncation errors.
No SET GLOBAL, global configuration changes, forced rollback, deadlocks or session KILL.
UTC test sessions do not prove production SYSTEM-timezone parity.

Create five run-owned reference role rows with the official role names, five synthetic
users (capture real insertId; NULL email and department), two active projects and ten active
memberships. Create a 500-document main dataset (batch 200) plus bounded case fixtures,
never exceeding 1000 live documents in this run. Current assignee is the Team Process user;
Viewer must not receive SLA events. Use fresh DB UTC reference and validation margins to
avoid clock-boundary flakes; no fixed browser date or weakened NOT NULL baseline.
Active file/revision pointers stay NULL. No physical files, production data or seed import.

Expected writes are confined to the runner DML tables above. Produced notification/audit/
evaluation IDs and coordinator composite IDs must be captured in an exact run ledger,
along with roles/users/project/membership/document IDs. Ledger enrollment and row ownership
must be checked transactionally; failed business writes must not become committed ledger rows.
No reference to an unowned project/document is permitted. Preserve unrelated sentinels.

## 6. Integration Matrix and Controlled Failures

- A1: 500 documents / batch 200, exact visited IDs and counts; Viewer exclusion.
- A2: VARCHAR collation ordering compared to an SQL ORDER BY oracle, not JS lexical order.
- A3: capture boundary; barrier-insert a higher owned ID; current scan excludes it, next includes it.
- A4: barrier-controlled fixture eligibility changes; bounded traversal, no arbitrary sleeps.
- A5: one scoped failure, other documents continue and commit independently.
- A6: verify traversalComplete vs evaluationComplete for success/partial/interrupted cases.
- A7: observe executed keyset queries, page limits, no OFFSET/full dataset retention, bounded results.
- B1-1: real coordinator plus notification/evaluation/mandatory Overdue audit commit together.
- B1-2/3/4: test-only adapters cause actual FK/CHECK violations at a chosen notification,
  evaluation or audit statement on the same real transaction connection. Earlier writes
  must have occurred, and must be absent from an independent read after rollback.
- B1-5/6: actual unique constraints for notifications and document/cycle, suppression compatible.
- B1-7: in-process SSE sink, empty before commit/after rollback, committed IDs only after commit.
- B1-8/9: capture acquisition/transaction/cleanup evidence, no nested connection; failed document
  cannot corrupt a second document. Empty/no unexpected active test transactions at teardown.

Observe only this runner's owned sessions/connection IDs; use session transaction state
and account-visible process metadata, not a global PROCESS grant. A client deadline alone
does not prove the server command stopped. If task/transaction settlement is unverified,
preserve fixtures and STOP rather than starting cleanup or running another mutation case.

Runtime modules are loaded through explicit test dependencies with real dedicated pools;
no dotenv, app/server, email provider or storage startup. SSE is captured, not delivered.
Failure adapters may replace only selected fixture bind values with a non-existing FK
or invalid CHECK value; preserve production SQL and original driver errors. No triggers,
schema alterations, artificial COMMIT ACK loss, or deadlock/timeout tests in C2B.
If real evidence exposes a production defect, STOP that path and request separate approval.

## 7. Cleanup, Verification, Recovery

After all tasks/transactions settle and ownership still verifies, delete only exact-ledger
notification/audit/evaluation and coordinator rows, then memberships, documents, projects,
users and run-created roles in FK-safe order (reorder child deletes as verified by metadata).
Keep project/user rows until their document references are gone. No file/revision rows are
expected; finding unexpected references or unresolved outcomes means STOP, not FK disabling.
Ledger cleanup occurs only after corresponding row removal is verified. No prefix-only
DELETE, blanket reset, DROP DATABASE/TABLE, TRUNCATE or cleanup of another run.
Keep the database, two technical tables and accounts as approved test infrastructure;
do not delete accounts or directories automatically. Verify no owned fixture rows remain,
no unexpected rows changed, no transactions/connections leaked, marker/grants intact and
global settings unchanged. Record fixture identities and per-category results without secrets.

If provisioning partially fails, STOP immediately and report created objects/accounts and
last acknowledged statement; preserve evidence/credentials. Do not auto-rollback DDL,
drop, restore, repair, recreate or adopt partial resources. Recovery needs owner decision.

## 8. Approval Requested

Approve C2B-PLAN-01, including exact target, account grants/revocation, secure credential
storage/ACL, 19-table schema/marker/ledger setup, session-only UTC setting, synthetic writes,
scoped constraint failures and exact-run cleanup above. Approval is not inferred from this file.
After approval, implement runtime guard/executor and integration runner, validate them offline,
then execute only this reviewed plan and complete this SAME C2B sprint. Material changes need
new approval. No C2C, C2D, C3, Railway/R2, outbound mail, backend startup, commit/push/deploy.
