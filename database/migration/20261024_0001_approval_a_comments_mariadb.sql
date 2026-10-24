-- PREPARED ONLY - NOT EXECUTED
-- Approval A automatic workflow comment: approved CHECK-only exception.
-- Target: MariaDB 10.4.32 local; not MySQL. Actual engine/version MUST be verified before execution.
-- Explicit environment approval, verified backup/restore readiness and writer maintenance required.
-- Run 20261024_0001_approval_a_comments_preflight.sql on the SAME connection first.
-- STOP if database identity, baseline CHECK B/C, schema or snapshots differ/incomplete.
-- Verify CHECK enforcement is enabled; do not disable any constraint checks.
-- Single ALTER, no IF EXISTS: not rerunnable after successful migration.
-- DDL may implicitly commit; ordinary ROLLBACK cannot undo it.
-- No startup/build/deployment integration. Execute only in a separately approved Phase C.
ALTER TABLE workflow_comments
  DROP CONSTRAINT chk_workflow_comments_workflow_action,
  ADD CONSTRAINT chk_workflow_comments_workflow_action
    CHECK (workflow_action IN ('Approval A', 'Approval B', 'Approval C'));
-- Run 20261024_0001_approval_a_comments_verify.sql on the SAME connection, before releasing writers.
