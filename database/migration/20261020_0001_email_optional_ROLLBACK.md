# Optional Email and Selective Uniqueness

Status: LOCAL PREPARATION ONLY / DATABASE MIGRATION NOT EXECUTED

Date: 2026-10-20

## Execution Plan

1. Obtain explicit execution approval for the intended environment. Order: Development, Staging, Production, with runtime UAT and approval between environments.
2. Verify target database identity manually, MySQL version, backup restore readiness, strict SQL mode, InnoDB row format, page size (at least 8192 bytes) and preflight results. This package targets MySQL 8.x/9.x, not an unverified MariaDB runtime.
3. Pause user/profile writes. Run `20261020_0001_email_optional_preflight.sql`, export results securely and require BASELINE PASS. Inspect SHOW CREATE TABLE for attributes/dependencies beyond the baseline checks. Any mismatch requires review; do not improvise DDL.
4. Keep the same database session open. The preflight snapshot stores user ids and exact email bytes in session memory only. For large datasets export/compare the snapshot externally instead; missing session variables must not be treated as PASS.
5. After explicit approval, run `20261020_0001_email_optional_mysql.sql` once. It changes only users, without updating existing email values or system_metadata. A single ALTER retains database uniqueness throughout index replacement; MySQL 8+ InnoDB atomic DDL does not mean a user transaction can roll it back. Adding STORED columns can rebuild/lock the table.
6. Run `20261020_0001_email_optional_verify.sql` before resuming writes. Require unchanged user ids/count/email bytes, expected expression, nullable email, full unique key and lookup index, no old unique key, and no duplicate ordinary keys.
7. Deploy compatible backend/frontend only after migration verification. Exercise NULL, both exact shared emails, mixed case, whitespace and concurrent ordinary-email writes in the approved environment. Do not run prepared code against unmigrated databases for user/profile mutations.

## Uniqueness Design

`email_uniqueness_key` is STORED and indexed uniquely. NULL/blank and exactly two shared emails map to NULL; ordinary values map to LOWER(TRIM(email)). The key retains utf8mb4_unicode_ci, preserving existing ordinary-email collation semantics. Shared-email comparison uses utf8mb4_bin after lowercasing so accent lookalikes do not acquire an unintended exception. The full 255-character utf8mb4 key needs up to 1020 bytes, within the 3072-byte InnoDB limit for the approved row formats. `idx_users_email` preserves email lookup support. Services query the unique key for ordinary-email conflicts; password recovery continues querying Username.

## Rollback Preconditions

- Separate approval, verified backup and maintenance window are mandatory. Stop application writes first.
- Restore old application code only together with a compatible schema; the prepared repositories depend on email_uniqueness_key.
- Old schema cannot accept any NULL email or repeated shared email. Check all rows using the original email collation, not only ordinary emails.
- If any NULL or duplicate email exists, automatic rollback is unsafe. Prefer a forward fix. Any manual email assignment requires the account owner's/business approval; never delete users or silently replace addresses.
- If data satisfies the old rules, a DBA may prepare a reviewed reverse ALTER that restores NOT NULL and uq_users_email before removing the new key/lookup/generated column. No executable reverse SQL is included.
- A full backup restore can discard later changes and affect related data; plan recovery and reconciliation explicitly. DDL implicit commit means ordinary ROLLBACK is not a recovery procedure.

## Validation Status

No database was accessed or migrated during preparation. SQL execution, engine-specific migration validation and concurrent insert tests remain NOT RUN - PENDING MIGRATION VALIDATION. Preflight is an inspection gate, not an execution permission or an automatic migration runner.

References: [MySQL generated-column indexes](https://dev.mysql.com/doc/refman/8.0/en/create-table-secondary-indexes.html), [ALTER generated columns](https://dev.mysql.com/doc/refman/9.7/en/alter-table-generated-columns.html).
