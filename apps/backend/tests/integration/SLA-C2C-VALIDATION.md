# SLA Concurrency and Retry Validation - C2C

## Status

2026-11-08: OFFLINE VALIDATION PASS - REAL DATABASE INTEGRATION PENDING.
C2B remains PAUSED / ENVIRONMENT BLOCKED by owner decision, not failed or cancelled.
Its implementation, test evidence, partial database and accounts are preserved.
No C2B provisioning, XAMPP access/repair/restart, database connection, or SQL execution
was performed during C2C. No production source, UI, workflow, or configuration changed.

## Audit and Changes

- Existing transaction suite: 89 PASS before changes. It already covers stale-state,
  suppression, rollback, bounded retry, ambiguous COMMIT and post-commit publication.
- Extracted its existing VM/staged-SQL fixture into `../helpers/slaTransactionFixture.cjs`
  for reuse, retaining actual producer, repository and admission code under an import allowlist.
- Added 21 C2C offline tests in `../unit/slaConcurrencyRetry.test.js` and nine explicit
  real-database TODO cases. No driver, dotenv, network, storage or server startup is loaded.
- Added deterministic gate/COMMIT/backoff barriers, connection ownership and publication
  evidence. No real sleeps, SQL locks, engine-generated errors or database transactions.
- Corrected test-only queue release on acquisition failure. Corrected the fixture's global
  retry-delay assertion to check the retry owner's leases, not unrelated evaluations' leases.
  Initial combined run: 107 PASS / 3 FAIL (two overly global fixture assertions and one
  missing Buffer in the test sandbox). All three harness issues were corrected; no production
  defect was established and no production patch was made.

## Executed Results

| Validation | Result | Evidence / Limitation |
| --- | --- | --- |
| New C2C offline cases | 21 PASS, 0 FAIL | Barriers and injected 1213/1205-shaped errors |
| Existing transaction suite | 89 PASS, 0 FAIL | All original assertions retained |
| Combined offline regression | 418 PASS, 0 FAIL | Includes the above 110, not additional to them |
| Real database cases | 9 PENDING / TODO | Not executed; not PASS |
| Helper/new test syntax checks | PASS | `node --check` |

Regression covers SLA coverage/transactions/scheduler lifecycle, Approval email/attachment
fixtures, revision provenance, REV., delete notification/restriction and admission tests.
There are 427 reported tests: 418 passing plus nine TODO; no failures, skips or cancellations.

Offline evidence covers eight overlapping same-document callers with one notification set;
hidden staged rows and no SSE while COMMIT is held; queued stale Review after simulated
Approval; a retry loser observing another evaluator's committed suppression state; fresh
eligibility after backoff; bounded exhaustion isolated from another document; no retry on
uncertain rollback; independent AsyncLocalStorage writer tokens and wrong-project rejection;
single-connection scope ownership; and UNKNOWN COMMIT never becoming inferred success/SSE replay.
Successful publication is tied to its originating fixture connection after commit and disposal.

## Remaining Real Database Tests

All nine cases are explicitly TODO in the executable test file:

1. Coordinator row-lock serialization on independent SQL connections.
2. Approval/Revision versus evaluator visibility under actual REPEATABLE READ.
3. Engine-generated deadlock 1213, rollback evidence and fresh bounded retry.
4. Engine-generated lock timeout 1205, partial effects and full application rollback.
5. Notification/evaluation unique constraints under concurrent database writes.
6. Unrelated document/project progress with actual pool and lock isolation.
7. Lost COMMIT acknowledgement checked against independent durable reads.
8. Publication timing after actual COMMIT/release and independent row visibility.
9. Connection/transaction settlement after exhaustion or uncertain cleanup.

The fixture serializes transactions globally using a JavaScript queue, not actual per-document
coordinator locks. It cannot prove InnoDB locking, isolation, constraint enforcement, durable
rollback/COMMIT, mysql2 cleanup or cross-process behavior. Injected codes are not real database
deadlocks/timeouts. SSE is an in-process sink, not browser delivery. UNKNOWN with suppressed
later evaluation intentionally does not establish event replay/reconciliation guarantees.

## Run Offline

```powershell
node --test apps/backend/tests/unit/slaConcurrencyRetry.test.js apps/backend/tests/unit/slaNotificationTransaction.test.js
```

This command performs no database operation. Real integration needs separate owner authorization
and a verified healthy environment. Do not resume the partial C2B executor or mutate its resources
based on this offline result. No commit, push, deployment or further sprint was performed.
