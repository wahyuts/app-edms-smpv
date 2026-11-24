# Response to Approval B Migration Execution Guide

Status: LOCAL MARIADB MIGRATION VERIFIED under separate explicit owner authorization.
MySQL/Railway migration remains outside this local execution approval. No deployment
has been performed. Every other environment still needs its own approval and safety gates.

## Local Execution Result

- Target: 127.0.0.1:3306 / edms_smpv_dev, XAMPP MariaDB 10.4.32.
- Known tablespace/redo LSN mismatch was explicitly accepted by owner; it was not repaired.
- SQL backup retained, readable/completed with SHA-256 verified. Restore was not required
  and is not claimed tested. Evidence is access-restricted outside the repository.
- Actual baseline lacked exact MariaDB spellings for approval_target_stage (145 bytes)
  and emergency_request (303 bytes): redundant grouping parentheses are omitted by the
  server. Three missing baseline/unchanged-expanded HEX entries were added, not normalized.
- Expanded CHECK metadata was captured on a newly owned disposable schema; 16 native
  positive/negative inserts passed. Its one missing expanded Emergency HEX entry was
  added consistently to all three MariaDB guards. The disposable schema was removed and
  its absence verified. No dummy comment was inserted into the application database.
- Fresh preflight: baseline 4/4, BASELINE_MATCH_OWNER_APPROVAL_REQUIRED. One guarded
  ALTER executed successfully, replacing only the two approved CHECKs. Postflight:
  expanded 4/4 and POSTFLIGHT_METADATA_MATCH; CHECK/FK enforcement remains enabled.
- Before/after snapshots of 33 application tables matched in row counts, complete
  per-row serialized content hashes, columns, indexes and FKs. All 88 workflow comments
  and their action distribution are unchanged. Only two workflow_comments CHECKs differ;
  all other table DDL/checks remain identical. MySQL script SHA-256 hashes are unchanged.
- Audit evidence: D:/EDMS-Database-Backup/2026-11-24T16-22-59-647Z-response-b-172145b5/.
  See verification.json, backup-verification.json, constraint-fixture-results.json,
  migration-attempt.json, migration-success.json and saved preflight/postflight outputs.
- Schema migration is ready for Final Local UAT. This is not browser-UAT PASS, proof of
  globally healthy InnoDB, or permission to rerun the migration. Existing response rows
  must never be deleted/relabelled to force rollback.

## Files and Change

All files use the prefix `20261124_0001_response_to_approval_b_` in this directory.
Choose exactly one engine, `mariadb` (10.4.32) or `mysql` (9.7.4).

1. `<engine>_preflight_readonly.sql`
2. `<engine>.sql` (only after separate execution approval)
3. `<engine>_postflight_readonly.sql`

Only two named CHECKs on workflow_comments are replaced in one ALTER TABLE.
The action CHECK adds Response to Approval B to A/B/C/Emergency. The request CHECK
adds a distinct response branch requiring NULL fingerprint and NULL Approval A target.
All previous branches remain. MariaDB retains Emergency revision_id IS NULL; MySQL
omits that predicate, as in the corrected Emergency migration, because its revision
FK has ON DELETE SET NULL (Error 3823). The backend enforces revision ownership.
Canonical dev uses MariaDB; staging/prod use MySQL for these two constraints.
The previous canonical staging/prod Emergency CHECK still contained the MariaDB
predicate; this directly related discrepancy is aligned with the corrected MySQL
migration here. No historical migration or foreign key is changed.

## Local MariaDB

1. Stop frontend/backend and all background/document writers. Independently verify
   local target, process identity and writer quiescence; do not start/restart anything
   automatically. Preserve the existing XAMPP environment and testing artifacts.
2. Obtain a verified full same-environment backup, including a documented restore plan,
   or separately approved disposable integration environment. Save current DDL and
   a content-preservation baseline, not merely counts.
3. Configure only the target assignment described below, then run the complete MariaDB
   preflight in one session. Verify RS01 identity and context status, then all result sets.
   Missing/extra columns or table, disabled enforcement, or wrong engine must STOP.
4. Save all result sets. RS08 must say BASELINE_MATCH_OWNER_APPROVAL_REQUIRED.
   Confirm all other CHECKs, FKs, indexes, column attributes and counts against saved
   baseline. Unknown CHECK representation, drift, partial or already-applied state:
   STOP, inspect clause/HEX, do not force execution or rerun.
5. Obtain explicit execution approval. Run MariaDB migration as SCRIPT, stopping on
   FIRST error, exactly once. Never run the MySQL variant on MariaDB.
6. Run matching postflight. Require POSTFLIGHT_METADATA_MATCH and compare saved
   DDL (only the two expected CHECK changes), indexes, FK rules, counts/distribution
   and independently saved content evidence. Metadata match is not a runtime insert test.
7. Only after review, start compatible application and perform authorized Local UAT.

## Railway Development MySQL

Use the mysql file set, not the mariadb files. Configure the independently verified
Development schema in the single assignment below. Do not assume a schema named railway
identifies Development. Compare RS01 host/port/version/account with trusted connection
configuration and saved owner evidence before interpreting schema results. Save all
preflight result sets; obtain explicit execution approval before migration. After migration,
run matching postflight and compare DDL and all RS06c rows exactly. No live execution or
permission to access Railway is implied by this guide.

## Railway Production MySQL

Require successful Local UAT first; MariaDB success does not prove MySQL compatibility.
Review MySQL guard with raw metadata, secure verified same-environment backup, approved
maintenance/write-quiescence plan and explicit environment/execution authorization.
Do not infer Development or Production from DATABASE() or an idle user session.
Use the same preflight -> review/approval -> one migration -> postflight sequence, with
MySQL files only. Do not disable strict mode/FKs/CHECK enforcement. Coordinate GitHub
monorepo auto-deployment: no push/deploy until schema compatibility, maintenance and
release sequencing have been approved. Expanded constraints are compatible with the
old application; new application requires the expanded constraints before qualifying uploads.

## Target Configuration and Clients

Each of the six scripts has exactly one operator setting, after the mandatory stale-state
reset. Change only this assignment before each complete execution:

```sql
SET @rb_target = '__SET_TARGET_SCHEMA__';
```

Replace the placeholder with the schema verified for that connection. Local example ONLY:
`SET @rb_target = 'edms_smpv_dev';`. Use the same verified target for preflight, migration
and postflight; a new HTTP request/session must execute its own complete script. Do not
run only the tail, reuse a previous guard, substitute DATABASE(), or remove resets.
Only 1-64 ASCII letters/digits/underscores are supported. Empty/placeholder/system-schema,
punctuation, quotes, backticks, whitespace, non-ASCII or missing targets are rejected.
REGEXP uses explicit utf8mb4 text with utf8mb4_bin collation, not a binary-character-set
argument rejected by newer MySQL ICU regex. A separate forbidden-character test rejects
trailing newlines even if a regex engine treats dollar as an end-of-line anchor.
The validated target is backtick-quoted with defensive escaping; all application reads,
SHOW and ALTER use it. All metadata filters use @rb_target, not client current database.
An existing, structurally identical but unintended environment cannot be identified from
schema alone: manual connection identity verification remains mandatory.

The pre/postflight files are read-only against persistent state but now use session SET,
PREPARE, EXECUTE and DEALLOCATE for qualified read queries. They change no global settings,
constraints or SQL mode. Error guards suppress application-table access when prerequisites
are missing. Each file must use one uninterrupted session with auto-reconnect disabled.

| Client | Planned execution procedure | Runtime validation |
|---|---|---|
| phpMyAdmin 5.2.1 | Select verified connection, open SQL tab, paste/configure/run the entire file once; retain every result. Do not run individual statements via separate requests. Pre/postflight currently have 49 statements, below the source's 50-query display-path threshold. | NOT VERIFIED |
| DBeaver (local/Railway) | Open SQL editor bound to the verified connection, configure target once, Execute SQL Script, stop on first error, no reconnect/parallel statements. Retain all result tabs and full CSV exports. | NOT VERIFIED |
| MariaDB CLI | Connect to the verified MariaDB server, execute the configured complete file with the normal client in batch mode; never use --force. Let the client prompt securely for authentication. | VERIFIED on local MariaDB 10.4.32 for preflight/migration/postflight |
| MySQL CLI | Same procedure with the verified MySQL server and mysql variant; preserve the existing secure transport configuration, never use --force. | NOT VERIFIED |

If a client hides/truncates a result, changes connection mid-file, or cannot retain the
session, STOP; use the one-session DBeaver/CLI procedure instead. Do not infer compatibility
from static tests. SQL tab UI navigation may still change DATABASE() to information_schema;
this is diagnostic only and no longer selects the target of reads or ALTER.

## CHECK Evidence and Fail-Closed Validation

Owner exports check cons.csv and tabel 1 3.csv agree after decoding metadata quote escaping.
The new migration-specific fixture retains the exact clause HEX and SHOW CREATE expressions.
No production normalization is performed: the three scripts per engine share the identical
finite byte-exact guard template. Existing accepted representations are retained.

| Constraint suffix (prefix chk_workflow_comments_) | Expected baseline | Actual Railway representation and correction |
|---|---|---|
| workflow_action | A/B/C/Emergency IN list | Existing accepted 135-byte clause; no new representation needed. |
| approval_target_stage | NULL or Approval A with IFA-Submitted/AS-Built | 185 bytes; parentheses around individual predicates, utf8mb4 introducers and escaped quotes. Add exactly this verified HEX in baseline and expanded phases because the constraint is unchanged. |
| created_by_official_role | NULL or the five official roles | 207 bytes; predicate parentheses plus introducers/escaped quotes. Add exactly this verified HEX in both phases; constraint unchanged. |
| emergency_request | Existing Emergency branch OR A/B/C fingerprint NULL | 335 bytes; predicate parentheses plus introducers/escaped quotes. Add exactly this verified HEX to baseline only. MySQL still excludes revision_id; no business predicate changes. |

These three missing representations explain the reported baseline 1/4 match. Offline
tests compare the supplied DDL expressions with canonical expressions over NULL, valid
and invalid action/stage/role/fingerprint combinations. Only whole known HEX values are
accepted; modified lists/operators, unexpected CHECKs or unfamiliar parentheses/spellings
still STOP. The supplied 63-row count/distribution is historical evidence, not a guard.
MySQL expanded CHECK runtime metadata remains unverified in this local execution.
MariaDB baseline and expanded native metadata are now retained in migration test fixtures
response-approval-b-mariadb-checks.json and response-approval-b-mariadb-expanded-checks.json.
No future server-rendered HEX is invented. Existing expanded spellings remain supported,
but a new spelling may yield STOP_UNVERIFIED_CHECK_REPRESENTATION even if DDL is correct.
In that case keep writers stopped, export RS03/RS07, and obtain a targeted evidence review;
do not rerun migration or relax validation. Disposable runtime validation was authorized
for this local execution only; other environment testing still requires its own authorization.

Preflight expected status: BASELINE_MATCH_OWNER_APPROVAL_REQUIRED, not permission to alter.
ALREADY_APPLIED_DO_NOT_RERUN, invalid target/engine, schema/data drift, partial state or
unverified spelling means STOP. Postflight requires POSTFLIGHT_METADATA_MATCH plus manual
identity/backup/quiescence and exact baseline comparison; no RELEASE_READY is produced.

## Guard Failure and Data Preservation

Every full execution clears stale session state before target configuration. Migration
initializes @rb_ddl to a read-only STOP query, then the guarded SELECT alone may replace
it with a single qualified ALTER. Assignment, preparation or guard-execution failure leaves
the STOP default. Preparing the same statement name first deallocates any old statement,
including when the new preparation fails; continuing after an error cannot reuse the old
ALTER through that name. The DDL variable is consumed/reset before EXECUTE. No cross-session
guard transfer or out-of-order/tail execution is supported. Stop-on-error remains mandatory.

Both guards verify all 13 required columns, five explicit canonical indexes (six indexed
column positions), four exact FKs and their referential actions, all four enforced CHECKs,
and existing-row compatibility. Other engine-generated indexes remain visible in RS05
for before/after comparison. Only the two approved CHECKs are replaced.

RS06c returns id and row_content_hex for every comment in binary ID order, encoding all
13 canonical fields with NULLs and full timestamp precision. Export complete values without
UI truncation before and after, then compare both ID sets and every row_content_hex exactly.
Compare full RS02-RS05 schema evidence too, allowing only the two approved CHECK changes.
Counts/distribution alone are insufficient. This checks comment contents, not physical file
bytes or other tables. Protect exports containing comments/actor identities. Any discrepancy
requires STOP and separately approved investigation, never automatic restore/cleanup.

## Safety and Recovery

DDL implicitly commits and can lock/copy the table. A single ALTER minimizes intermediate
states but is not a transactional rollback guarantee, especially on MariaDB 10.4 after
crash/failure. Guard accepts only finite, exact semantic spellings encoded as HEX;
unrecognized metadata stays STOP, never normalized loosely. Preflight cannot prove
backup validity, writer quiescence or physical content preservation.
Postflight reports schema/data metadata evidence, not universal RELEASE_READY.
If execution fails, keep writers stopped; inspect actual schema read-only, retain logs,
and obtain a separately approved recovery plan. No automatic retry/DROP/recreate/repair.
Prefer application rollback while retaining expanded CHECKs. Removing response action
would fail once response rows exist; never delete/relabel those rows to force rollback.
Backup restoration needs separate approval and can lose data created since the backup.
The pre-existing COMMIT-unknown storage cleanup issue remains DEFERRED.

## Local UAT After Separate Approval

- IFR B upload by Owner and Admin: one exact response, Project Review/IFA-Submitted.
- IFA B upload by Owner and Admin: one exact response, Approved/AS-Built; only final
  Approved bold. Verify actual full-name/role, operation time and new revision reference.
- Retry/concurrent request: one revision/response. Authorized isolated failure injection:
  failed response/storage/provenance/transaction must not leave a committed response/revision.
- Another user gets unread !; author does not. Viewer read acknowledgment persists
  through refresh/relogin; next comment reactivates unread. Cross-browser revision SSE
  refreshes register/dashboard without duplicate events or notifications.
- Metadata-only Comment edit: no response or SLA reset. Reject upload: no response.
  A/B/C initial decisions and Emergency retain existing behavior/attachments/flags.
- Revision History retains UPLOAD and actual Approval A events only; file access/pointers,
  workflow, notifications, Audit Trail, final SLA/assignee and Revision 1 UI remain unchanged.
