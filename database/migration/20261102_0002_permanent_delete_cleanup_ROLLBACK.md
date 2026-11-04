# Sprint B - Migration and Rollback Notes

## Applicability

- Execute exactly one engine variant, once, after validated Sprint A foundation.
- MariaDB variant was applied only to verified edms_sprint_a_test on 2026-11-02.
- MySQL variant is prepared, not runtime verified. Neither variant is wired to startup/deployment.
- Main development, Railway, staging and production migration NOT AUTHORIZED by this task.
- No backfill, stored-file update, seed, reset or business table ALTER occurs in this migration.

## Runtime Compatibility

New stored-file insertion attempts namespace capture through the actual adapter. When both namespace sidecars are absent, binding is skipped: existing upload naming/workflow remain unchanged, but the resulting unbound file is ineligible for Permanent Delete. Capture failure also leaves the file unbound. A partially installed sidecar pair fails the business transaction rather than inventing evidence.

Sidecars do not prove namespace for historical files retroactively. No automatic existing-file binding/backfill API is provided. An existing file without its verified binding remains Pending until a separately reviewed, targeted binding procedure is authorized.

## Recovery and Reversal

- Back up and verify the approved environment before future non-test migration.
- DDL has implicit commits; ordinary transaction ROLLBACK does not undo table creation.
- Inspect all four table definitions and database identity after partial DDL failure. Do not rerun the migration blindly.
- Do not delete registry/binding/progress/manifest/attempt evidence while any operation is pending or unresolved.
- Registry/file binding/progress removal would invalidate cleanup evidence and make bound files unverified. No automatic DROP script is supplied.
- Physical deletion cannot be reversed by SQL rollback. Restoring database metadata alone after acknowledged physical cleanup creates missing-file references.
- Completed metadata deletion, its final Audit Trail event and completion snapshot commit in the same transaction. Historical audit is never deleted.
- Unknown or IN_FLIGHT storage attempts are never retried automatically; worker disconnect or expired time is not proof of terminal external IO.
- Local owned-file deletion deliberately remains Pending: portable Node path-based unlink cannot supply the required race-safe directory-relative primitive. Ordinary storage deletion behavior is unchanged.

## Current Validation Stop

The initial MariaDB migration and a full synthetic archived-document cleanup passed. Further database scenarios stopped on long-running test-database INSERT statements that persisted in server PROCESSLIST after the client watchdog exited. Root cause is not established. No KILL/restart/repair/reset or force-unlock was performed. Review local XAMPP state before any further mutation run. The harness now refuses a new run while other non-idle commands remain in the test database.
