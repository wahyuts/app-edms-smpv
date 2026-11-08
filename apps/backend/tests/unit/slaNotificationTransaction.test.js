const assert = require('node:assert/strict');
const test = require('node:test');
const { fixture, document, now } = require('../helpers/slaTransactionFixture.cjs');

test('one transaction commits all recipients, evaluation and mandatory audit before SSE', async () => {
  const f = fixture();
  const result = await f.evaluate();
  assert.equal(result.createdCount, 4);
  assert.equal(f.acquisitions, 1);
  assert.equal(f.state.notifications.length, 4);
  assert.equal(f.state.evaluations.length, 1);
  assert.equal(f.state.audits.length, 1);
  assert.equal(f.events.length, 4);
  assert.deepEqual(f.trace.slice(0, 2), ['begin', 'gate:D1']);
  assert.ok(f.trace.indexOf('audit') < f.trace.indexOf('committed'));
  assert.ok(f.trace.indexOf('committed') < f.trace.indexOf('sse'));
  assert.ok(!f.trace.includes('rollback'));
  assert.ok(f.sqlCalls.every(c => c.inTransaction));
  assert.ok(f.sqlCalls.filter(c => c.sql.startsWith('INSERT')).every(c => !c.sql.startsWith('INSERT IGNORE')));
  assert.deepEqual(f.state.notifications.map(n => n.official_role), ['Admin', 'Document Owner', 'Team Process', 'Team Project']);
  assert.equal(f.state.audits[0].business_event, 'Escalation Created');
});

for (const failure of ['gate', 'evaluation-read', 'recipients', 'recipient-1', 'recipient-2', 'evaluation-write', 'audit', 'commit']) {
  test(`${failure} failure rolls back all staged rows with no SSE`, async () => {
    const f = fixture({ failure });
    await assert.rejects(f.evaluate(), /synthetic/);
    assert.equal(f.acquisitions, 1);
    assert.equal(f.trace.filter(v => v === 'rollback').length, 1);
    // A failed COMMIT is now explicitly ambiguous and must discard, never pool-release.
    assert.equal(f.trace.filter(v => v === 'release').length, failure === 'commit' ? 0 : 1);
    assert.equal(f.trace.filter(v => v === 'destroy').length, failure === 'commit' ? 1 : 0);
    assert.equal(f.trace.includes('committed'), false);
    assert.deepEqual(f.state, { notifications: [], evaluations: [], audits: [] });
    assert.equal(f.events.length, 0);
    assert.ok(!f.logs.some(s => s.includes('result=created')));
    assert.ok(!f.logs.some(s => s.includes('[NOTIFICATION]') && s.includes('created=')));
  });
}

test('post-commit SSE failure never rolls back or changes committed createdCount', async () => {
  const f = fixture({ failure: 'sse' });
  const result = await f.evaluate();
  assert.equal(result.createdCount, 4);
  assert.equal(f.state.notifications.length, 4);
  assert.equal(f.state.evaluations.length, 1);
  assert.equal(f.state.audits.length, 1);
  assert.equal(f.events.length, 4);
  assert.ok(!f.trace.includes('rollback'));
  assert.ok(f.logs.some(s => s.includes('post_commit_sse_failed')));
});

test('defensive post-commit publisher exception cannot masquerade as DB failure', async () => {
  const f = fixture();
  f.load('services/notification.service.js').publishNotificationCreatedSafely = () => { throw new Error('synthetic'); };
  assert.equal((await f.evaluate()).createdCount, 4);
  assert.equal(f.state.notifications.length, 4);
  assert.ok(!f.trace.includes('rollback'));
  assert.ok(f.logs.some(s => s.includes('post_commit_sse_failed')));
});

test('duplicates preserve identity, count only new rows, and emit no duplicate SSE', async () => {
  const f = fixture();
  await f.evaluate();
  const identities = f.state.notifications.map(n => n.identity_key);
  f.state.evaluations.length = 0; // Isolated retry fixture: same identity basis as the first evaluation.
  f.events.length = 0;
  const result = await f.evaluate();
  assert.equal(result.createdCount, 0);
  assert.equal(result.duplicateCount, 4);
  assert.deepEqual(f.state.notifications.map(n => n.identity_key), identities);
  assert.equal(f.state.audits.length, 1);
  assert.equal(f.state.evaluations.length, 1);
  assert.equal(f.events.length, 0);
  assert.ok(f.sqlCalls.some(c => c.sql.startsWith('SELECT id FROM notifications')));
  assert.ok(f.sqlCalls.some(c => c.sql.startsWith('SELECT id FROM audit_trail')));
});

test('mixed duplicate/new recipients count and publish only newly committed notifications', async () => {
  const f = fixture();
  await f.evaluate();
  f.state.evaluations.length = 0;
  f.state.notifications.splice(1);
  f.events.length = 0;
  const result = await f.evaluate();
  assert.equal(result.createdCount, 3);
  assert.equal(result.duplicateCount, 1);
  assert.equal(f.state.notifications.length, 4);
  assert.equal(f.events.length, 3);
});

test('optional cycle duplicate lookup uses the same connection without changing suppression', async () => {
  const f = fixture();
  await f.evaluate();
  const notifications = f.load('services/notification.service.js');
  const postCommitNotifications = [];
  const result = await f.load('repositories/sla.repository.js').runInTransaction({ documentId: 'D1', projectId: 'P1' }, connection =>
    notifications.createSlaStateNotifications({ document: document(), cycleId: f.state.evaluations[0].cycle_id,
      eventType: notifications.NOTIFICATION_EVENT_TYPE.SLA_OVERDUE,
    }, { connection, postCommitNotifications }));
  assert.equal(result.createdCount, 0);
  assert.equal(postCommitNotifications.length, 0);
  assert.equal(f.state.notifications.length, 4);
  assert.ok(f.sqlCalls.filter(c => c.sql.includes('WHERE event_type')).every(c => c.inTransaction));
});

for (const collision of ['notification', 'audit']) {
  test(`${collision} duplicate error without matching business identity is not swallowed`, async () => {
    const f = fixture({ collision });
    await assert.rejects(f.evaluate(), { code: 'ER_DUP_ENTRY' });
    assert.deepEqual(f.state, { notifications: [], evaluations: [], audits: [] });
    assert.equal(f.events.length, 0);
  });
}

for (const [patch, outcome, notifications, audits] of [
  [{ slaStartedAt: '2026-11-05T12:00:00.000Z' }, 'created', 4, 0],
  [{ slaStartedAt: now }, 'on_track_no_need_action', 0, 0],
  [{ currentAssigneeUserId: null }, 'missing_current_assignee', 0, 0],
]) {
  test(`existing SLA outcome ${outcome} remains transactional and unchanged`, async () => {
    const f = fixture({ documents: [document('D1', patch)] });
    const result = await f.evaluate();
    assert.equal(result.result, outcome);
    assert.equal(result.createdCount, notifications);
    assert.equal(f.state.notifications.length, notifications);
    assert.equal(f.state.audits.length, audits);
    assert.equal(f.state.evaluations.length, 1);
    assert.equal(f.acquisitions, 1);
  });
}

test('same-state suppression preserves existing identity policy without recipient writes', async () => {
  const f = fixture();
  await f.evaluate();
  f.events.length = 0;
  const result = await f.evaluate();
  assert.equal(result.result, 'same_state_suppressed');
  assert.equal(result.createdCount, 0);
  assert.equal(f.state.notifications.length, 4);
  assert.equal(f.state.evaluations.length, 1);
  assert.equal(f.state.audits.length, 1);
  assert.equal(f.events.length, 0);
});

test('ineligible and missing-baseline results use post-lock state without mandatory writes', async () => {
  const f = fixture();
  f.documents[0].status = 'Approved';
  assert.equal((await f.evaluate()).result, 'not_eligible');
  Object.assign(f.documents[0], { status: 'Process Review', slaStartedAt: null });
  assert.equal((await f.evaluate()).result, 'missing_sla_baseline');
  assert.equal(f.acquisitions, 2);
  assert.deepEqual(f.state, { notifications: [], evaluations: [], audits: [] });
});

test('scheduled scan isolates transaction failure, continues suffix, and counts committed rows only', async () => {
  const f = fixture({ documents: [document('D1'), document('D2')],
    fail: (phase, values) => phase === 'recipient-2' && values[12] === 'D1' });
  const result = await f.load('services/slaNotificationProducer.service.js').runScheduledEvaluation({ batchSize: 1 });
  assert.equal(result.processedCount, 2);
  assert.equal(result.failedCount, 1);
  assert.equal(result.succeededCount, 1);
  assert.equal(result.skippedCount, 0);
  assert.equal(result.createdCount, 4);
  assert.equal(result.traversalComplete, true);
  assert.equal(result.evaluationComplete, false);
  assert.equal(result.lastCursorId, 'D2');
  assert.equal(f.state.notifications.length, 4);
  assert.ok(f.state.notifications.every(n => n.related_resource_id === 'D2'));
  assert.equal(f.state.evaluations.length, 1);
  assert.equal(f.state.audits.length, 1);
  assert.equal(f.events.length, 4);
});

test('existing admitted Approval/Revision continuation does not nest writer admission', async () => {
  const f = fixture();
  const admission = f.load('services/documentAdmission.service.js');
  const result = await admission.runWriter({ documentId: 'D1', projectId: 'P1', type: 'APPROVAL' }, () => f.evaluate());
  assert.equal(result.createdCount, 4);
  assert.equal(f.trace.filter(v => v === 'admitted').length, 1);
  assert.equal(f.acquisitions, 1);
});

test('legacy audit safe wrapper remains safe while strict transactional path propagates errors', async () => {
  const f = fixture({ allowPool: true, failure: 'audit' });
  const audit = f.load('services/audit.service.js');
  const payload = { action: 'Escalation Created', actorUserId: null, resourceType: 'Escalation', resourceId: 'D1', projectId: 'P1' };
  const safe = await audit.recordActivitySafely(payload);
  assert.equal(safe.created, false);
  assert.ok(safe.error);
  await assert.rejects(audit.recordActivity(payload), /synthetic audit/);
  f.control.failure = null;
  assert.equal((await audit.recordActivitySafely(payload)).created, true);
  assert.ok(f.sqlCalls.some(c => c.sql.startsWith('INSERT IGNORE INTO audit_trail')));
});

test('transactional audit preserves dictionary, actor mapping and metadata sanitization', async () => {
  const f = fixture();
  await f.load('repositories/sla.repository.js').runInTransaction({ documentId: 'D1', projectId: 'P1' }, connection =>
    f.load('services/audit.service.js').recordActivity({ action: 'Escalation Created', actorUserId: null, projectId: 'P1', resourceId: 'D1',
      resourceType: 'Escalation', metadata: { password: 'redacted', nested: { token: 'redacted', safe: 'keep' } },
    }, { connection }));
  const record = f.state.audits[0];
  assert.equal(record.actor_name, 'System');
  assert.equal(record.detail, 'Document entered Escalation Alert.');
  assert.deepEqual(record.metadata, { nested: { safe: 'keep' } });
});

test('standalone repositories preserve admission and INSERT IGNORE behavior for existing callers', async () => {
  const f = fixture();
  await f.load('repositories/notification.repository.js').createNotification({ id: 'N1', identityKey: 'legacy', projectId: 'P1',
    recipientUserId: 1, recipientProjectMembershipId: 'M1', eventType: 'Legacy', title: 'Legacy', message: 'Legacy',
    priority: 'High', officialRole: 'Admin', recipientRole: 'Admin', relatedDocumentNumber: 'D1', actionTarget: '/sla-monitoring',
    relatedResourceId: 'D1', relatedResourceType: 'Document', metadata: {} });
  assert.equal(f.acquisitions, 1);
  assert.ok(f.sqlCalls.some(c => c.sql.startsWith('INSERT IGNORE INTO notifications')));
  await f.load('repositories/sla.repository.js').upsertSlaEvaluation({ documentId: 'D1', projectId: 'P1',
    cycleId: 'legacy-cycle', currentState: 'On Track', evaluationId: 'E1' });
  assert.equal(f.acquisitions, 2);
  assert.equal(f.state.evaluations.length, 1);
});

test('transactional service rejects missing post-commit buffer before writes', async () => {
  const f = fixture();
  const notifications = f.load('services/notification.service.js');
  await assert.rejects(notifications.createSlaStateNotifications({ document: document(),
    eventType: notifications.NOTIFICATION_EVENT_TYPE.SLA_OVERDUE }, { connection: {} }), /post-commit event buffer/);
  assert.equal(f.sqlCalls.length, 0);
});

test('bulk evaluator keeps result array and per-document failure isolation', async () => {
  const f = fixture({ documents: [document('D1'), document('D2')],
    fail: (phase, values) => phase === 'recipient-2' && values[12] === 'D1' });
  const result = await f.load('services/slaNotificationProducer.service.js').evaluateDocumentsForSlaNotifications({
    documents: [document('D1'), document('D2')],
  });
  assert.equal(result.length, 2);
  assert.equal(result[0].result, 'failed');
  assert.equal(result[1].createdCount, 4);
  assert.equal(f.state.notifications.length, 4);
});

test('unknown COMMIT acknowledgement emits no SSE and is not proof of rollback (B2 dependency)', async () => {
  const f = fixture({ failure: 'commit-ack-unknown' });
  await assert.rejects(f.evaluate(), /unknown COMMIT/);
  assert.equal(f.state.notifications.length, 4); // Server commit may have succeeded despite the lost ACK.
  assert.equal(f.events.length, 0);
  assert.ok(f.trace.includes('rollback')); // This attempt cannot undo an already committed transaction.
});

test('B2B: Approval committed before coordinator grant prevents an old Overdue notification', async () => {
  const f = fixture();
  const stale = document();
  f.control.afterGate = () => { f.documents[0].status = 'Approved'; };
  const result = await f.evaluate(stale);
  assert.equal(result.result, 'not_eligible');
  assert.equal(result.createdCount, 0);
  assert.equal(f.acquisitions, 1);
  assert.deepEqual(f.state, { notifications: [], evaluations: [], audits: [] });
  assert.equal(f.events.length, 0);
  assert.ok(f.trace.indexOf('gate:D1') < f.trace.indexOf('reload:D1'));
});

test('B2B: revision baseline reset is recalculated and persisted using the new cycle', async () => {
  const f = fixture();
  f.control.afterGate = () => { Object.assign(f.documents[0], {
    slaStartedAt: now, activeRevisionId: 'R2', activeFileId: 'F2', revision: 'IFA-Submitted',
  }); };
  const result = await f.evaluate(document());
  assert.equal(result.result, 'on_track_no_need_action');
  assert.equal(result.slaStatus, 'On Track');
  assert.equal(result.createdCount, 0);
  assert.equal(f.state.evaluations.length, 1);
  assert.equal(f.state.evaluations[0].cycle_id, `P1:D1:${now}`);
  assert.equal(f.state.notifications.length, 0);
  assert.equal(f.state.audits.length, 0);
});

test('B2B: updated validation days use the existing formula on the authoritative row', async () => {
  const f = fixture();
  f.control.afterGate = () => { f.documents[0].daysUntilValidation = 10; };
  const result = await f.evaluate(document());
  assert.equal(result.result, 'on_track_no_need_action');
  assert.equal(result.createdCount, 0);
  assert.equal(f.state.notifications.length, 0);
  assert.equal(f.state.evaluations[0].current_state, 'On Track');
});

test('B2B: revision change alone is not automatically skipped or assigned a fabricated cycle', async () => {
  const f = fixture();
  f.control.afterGate = () => { Object.assign(f.documents[0], { activeRevisionId: 'R2', revision: 'IFA-Submitted' }); };
  const result = await f.evaluate(document());
  assert.equal(result.createdCount, 4);
  assert.equal(f.state.evaluations[0].cycle_id, 'P1:D1:2026-11-01T12:00:00.000Z');
  assert.ok(f.state.notifications.every(n => n.metadata.revision === 'IFA-Submitted'));
});

test('B2B: Project Review metadata and current revision replace old Process Review snapshot', async () => {
  const f = fixture();
  const baseline = '2026-11-02T12:00:00.000Z';
  f.control.afterGate = () => { Object.assign(f.documents[0], {
    status: 'Project Review', currentAssigneeUserId: 8, responsibleRole: 'Team Project',
    activeRevisionId: 'R2', activeFileId: 'F2', revision: 'IFA-Submitted', slaStartedAt: baseline,
  }); };
  const result = await f.evaluate(document());
  assert.equal(result.createdCount, 4);
  assert.equal(f.state.evaluations[0].cycle_id, `P1:D1:${baseline}`);
  assert.ok(f.state.notifications.every(n => n.metadata.workflowStatus === 'Project Review'
    && n.metadata.revision === 'IFA-Submitted' && n.metadata.cycleId === `P1:D1:${baseline}`));
});

test('B2B: authoritative pointer, lifecycle and assignee mapping uses the guarded connection', async () => {
  const f = fixture({ documents: [document('D1', { activeRevisionId: 'R2', activeFileId: 'F2',
    currentAssigneeUserId: 8, status: 'Project Review', responsibleRole: 'Team Project' })] });
  const snapshot = await f.load('repositories/sla.repository.js').runInTransaction({ documentId: 'D1', projectId: 'P1' }, connection =>
    f.load('repositories/document.repository.js').findSlaEvaluationSnapshot(connection, { documentId: 'D1', projectId: 'P1' }));
  assert.equal(snapshot.document.activeRevisionId, 'R2');
  assert.equal(snapshot.document.activeFileId, 'F2');
  assert.equal(snapshot.document.currentAssigneeUserId, 8);
  assert.equal(snapshot.document.status, 'Project Review');
  assert.equal(snapshot.document.lifecycle, 'Active');
  assert.equal(snapshot.document.responsibleRole, 'Team Project');
  assert.equal(snapshot.serverNow, now);
  assert.equal(snapshot.eligible, true);
});

for (const [field, value] of [['lifecycle', 'Archived'], ['projectStatus', 'Inactive'], ['projectStatus', 'Closed']]) {
  test(`B2B: post-lock ${field}=${value} is skipped without persistence`, async () => {
    const f = fixture();
    f.control.afterGate = () => { f.documents[0][field] = value; };
    const result = await f.evaluate(document());
    assert.equal(result.result, 'not_eligible');
    assert.equal(result.createdCount, 0);
    assert.deepEqual(f.state, { notifications: [], evaluations: [], audits: [] });
    assert.equal(f.events.length, 0);
  });
}

for (const baseline of [null, '', 'invalid', new Date(NaN)]) {
  test(`B2B: post-lock invalid baseline ${String(baseline)} is a failed scan evaluation`, async () => {
    const f = fixture();
    f.control.afterGate = () => { f.documents[0].slaStartedAt = baseline; };
    const result = await f.load('services/slaNotificationProducer.service.js').runScheduledEvaluation();
    assert.equal(result.results[0].result, 'missing_sla_baseline');
    assert.equal(result.failedCount, 1);
    assert.equal(result.skippedCount, 0);
    assert.equal(result.succeededCount, 0);
    assert.equal(result.processedCount, 1);
    assert.equal(result.traversalComplete, true);
    assert.equal(result.evaluationComplete, false);
    assert.deepEqual(f.state, { notifications: [], evaluations: [], audits: [] });
  });
}

test('B2B: document removed before post-lock read follows missing-document skip', async () => {
  const f = fixture();
  f.control.afterGate = () => { f.documents.length = 0; };
  const result = await f.evaluate(document());
  assert.equal(result.result, 'not_eligible');
  assert.equal(result.createdCount, 0);
  assert.deepEqual(f.state, { notifications: [], evaluations: [], audits: [] });
  assert.equal(f.events.length, 0);
});

test('B2B: scope cannot reload a document owned by another project', async () => {
  const f = fixture();
  const result = await f.evaluate(document('D1', { projectId: 'P2' }));
  assert.equal(result.result, 'not_eligible');
  assert.equal(f.state.notifications.length, 0);
  assert.deepEqual(f.sqlCalls.find(c => c.sql.includes('evaluation_server_now')).values, ['D1', 'P2']);
});

test('B2B: cleared authoritative assignee applies existing suppression, not the old assignee', async () => {
  const f = fixture();
  f.control.afterGate = () => { f.documents[0].currentAssigneeUserId = null; };
  const result = await f.evaluate(document());
  assert.equal(result.result, 'missing_current_assignee');
  assert.equal(result.createdCount, 0);
  assert.equal(f.state.notifications.length, 0);
  assert.equal(f.state.evaluations.length, 1);
});

test('B2B: a stale Approved or invalid-baseline argument cannot override valid post-lock state', async () => {
  for (const stale of [document('D1', { status: 'Approved' }), document('D1', { slaStartedAt: null })]) {
    const f = fixture();
    const result = await f.evaluate(stale);
    assert.equal(result.createdCount, 4);
    assert.equal(result.slaStatus, 'Overdue');
  }
});

test('B2B: clock and baseline from the post-lock SELECT override stale caller time', async () => {
  const f = fixture();
  const postLockTime = '2026-11-08T12:01:00.000Z';
  f.control.afterGate = () => {
    f.documents[0].slaStartedAt = '2026-11-05T12:00:00.000Z';
    f.control.dbTime = postLockTime;
  };
  const result = await f.load('services/slaNotificationProducer.service.js').evaluateDocumentForSlaNotifications({
    document: document(), serverNow: '2026-11-08T11:59:00.000Z',
  });
  assert.equal(result.slaStatus, 'At Risk');
  assert.equal(result.createdCount, 4);
  assert.ok(f.state.notifications.every(n => n.metadata.slaTimer.calculatedAt === postLockTime));
});

for (const dbTime of [null, 'invalid']) {
  test(`B2B: invalid post-lock DB time ${dbTime} cannot fall back to caller time`, async () => {
    const f = fixture({ dbTime });
    const result = await f.evaluate();
    assert.equal(result.result, 'missing_sla_baseline');
    assert.equal(result.createdCount, 0);
    assert.deepEqual(f.state, { notifications: [], evaluations: [], audits: [] });
  });
}

test('B2B: reload query failure rolls back and publishes no SSE', async () => {
  const f = fixture({ failure: 'reload' });
  await assert.rejects(f.evaluate(), /synthetic reload/);
  assert.ok(f.trace.includes('rollback'));
  assert.deepEqual(f.state, { notifications: [], evaluations: [], audits: [] });
  assert.equal(f.events.length, 0);
});

test('B2B: second evaluator waits in serialized fixture and reloads changed state', async () => {
  const f = fixture({ serializeTransactions: true });
  const stale = document();
  let entered, release;
  const firstEntered = new Promise(resolve => { entered = resolve; });
  const proceed = new Promise(resolve => { release = resolve; });
  let guards = 0;
  f.control.afterGate = async () => {
    guards++;
    if (guards === 1) {
      f.documents[0].slaStartedAt = '2026-11-05T12:00:00.000Z';
      entered();
      await proceed;
    } else f.documents[0].status = 'Approved';
  };
  const first = f.evaluate(stale);
  await firstEntered;
  const second = f.evaluate(stale);
  release();
  const [a, b] = await Promise.all([first, second]);
  assert.equal(a.slaStatus, 'At Risk');
  assert.equal(a.createdCount, 4);
  assert.equal(b.result, 'not_eligible');
  assert.equal(b.createdCount, 0);
  assert.equal(f.trace.filter(v => v === 'reload:D1').length, 2);
  assert.equal(f.acquisitions, 2);
  assert.equal(f.state.notifications.length, 4);
  assert.ok(f.state.notifications.every(n => n.event_type === 'SLA At Risk'));
  assert.equal(stale.status, 'Process Review');
  assert.equal(stale.slaStartedAt, '2026-11-01T12:00:00.000Z');
});

test('B2B: two serialized evaluators reuse the committed evaluation for same-state suppression', async () => {
  const f = fixture({ serializeTransactions: true });
  const stale = document();
  const [a, b] = await Promise.all([f.evaluate(stale), f.evaluate(stale)]);
  assert.equal(a.createdCount, 4);
  assert.equal(b.createdCount, 0);
  assert.equal(b.result, 'same_state_suppressed');
  assert.equal(f.state.notifications.length, 4);
  assert.equal(f.state.evaluations.length, 1);
  assert.equal(f.state.audits.length, 1);
  assert.equal(f.events.length, 4);
});

const scope = { projectId: 'P1', documentId: 'D1' };
const transientError = (code = 'ER_LOCK_DEADLOCK', errno = 1213) => Object.assign(
  new Error('synthetic transient'), { code, errno, sqlState: '40001' });
const optIn = (f, callback = async () => 'value') =>
  f.load('services/documentAdmission.service.js').mutate(scope, callback, { transactionEvidence: true });
const evidenceFor = (f, error) => f.load('services/documentAdmission.service.js').getTransactionEvidence(error);
const rejected = async (operation) => {
  let caught;
  await assert.rejects(operation, error => { caught = error; return true; });
  return caught;
};

test('B2C: default and explicit opt-out preserve raw return value and original error', async () => {
  for (const options of [undefined, { transactionEvidence: false }]) {
    const f = fixture();
    const admission = f.load('services/documentAdmission.service.js');
    const value = { unchanged: true };
    assert.equal(await admission.mutate(scope, async () => value, options), value);
    const original = transientError();
    const error = await rejected(() => admission.mutate(scope, async () => { throw original; }, options));
    assert.equal(error, original);
    assert.equal(evidenceFor(f, error), undefined);
    assert.equal(f.trace.filter(v => v === 'release').length, 2);
    assert.equal(f.trace.includes('destroy'), false);
  }
});

test('B2C: non-opt-in rollback/COMMIT/release error handling remains unchanged', async () => {
  for (const failure of ['rollback', 'commit', 'release']) {
    const f = fixture({ failure });
    const original = new Error('primary');
    const error = await rejected(() => f.load('services/documentAdmission.service.js').mutate(scope, async () => {
      if (failure === 'rollback') throw original;
      return 'value';
    }));
    if (failure === 'rollback') assert.equal(error, original);
    else assert.match(error.message, new RegExp(failure));
    assert.equal(evidenceFor(f, error), undefined);
    assert.equal(f.trace.filter(v => v === 'release').length, 1);
    assert.equal(f.trace.includes('destroy'), false);
  }
});

test('B2C: opt-in confirmed COMMIT returns value plus immutable phase evidence', async () => {
  const f = fixture();
  const value = { unchanged: true };
  const result = await optIn(f, async () => value);
  assert.equal(result.value, value);
  const e = result.transactionEvidence;
  assert.equal(e.outcome, 'COMMITTED');
  assert.equal(e.commitConfirmed, true);
  assert.equal(e.beginConfirmed, true);
  assert.equal(e.rollbackAttempted, false);
  assert.equal(e.connectionDisposition, 'RELEASED');
  assert.deepEqual(Array.from(e.phases), ['BEFORE_BEGIN', 'BEGIN_IN_PROGRESS', 'TRANSACTION_ACTIVE',
    'COMMIT_IN_PROGRESS', 'COMMIT_CONFIRMED', 'CLEANUP']);
  assert.ok(Object.isFrozen(e) && Object.isFrozen(e.phases) && Object.isFrozen(e.cleanupErrors));
  assert.equal(f.activeConnections, 0);
});

test('B2C: acquisition failure has BEFORE_BEGIN / NOT_STARTED evidence without cleanup calls', async () => {
  const f = fixture({ failure: 'acquire' });
  const error = await rejected(() => optIn(f));
  const e = evidenceFor(f, error);
  assert.equal(e.failurePhase, 'BEFORE_BEGIN');
  assert.equal(e.outcome, 'NOT_STARTED');
  assert.equal(e.beginAttempted, false);
  assert.equal(e.connectionDisposition, 'NONE');
  assert.deepEqual(f.trace, []);
});

for (const failure of ['begin', 'gate']) {
  test(`B2C: ${failure} failure records acknowledged rollback before release`, async () => {
    const f = fixture({ failure });
    const error = await rejected(() => optIn(f));
    const e = evidenceFor(f, error);
    assert.equal(e.failurePhase, failure === 'begin' ? 'BEGIN_IN_PROGRESS' : 'TRANSACTION_ACTIVE');
    assert.equal(e.beginConfirmed, failure !== 'begin');
    assert.equal(e.commitAttempted, false);
    assert.equal(e.rollbackAttempted, true);
    assert.equal(e.rollbackConfirmed, true);
    assert.equal(e.outcome, 'ROLLED_BACK');
    assert.equal(e.connectionDisposition, 'RELEASED');
    assert.equal(f.activeConnections, 0);
  });
}

test('B2C: rollback failure preserves frozen primary error and destroys unknown connection', async () => {
  const f = fixture({ failure: 'rollback' });
  const primary = Object.freeze(transientError());
  const stack = primary.stack;
  const error = await rejected(() => optIn(f, async () => { throw primary; }));
  assert.equal(error, primary);
  assert.equal(error.stack, stack);
  assert.equal(error.code, 'ER_LOCK_DEADLOCK');
  assert.equal(error.errno, 1213);
  assert.equal(error.sqlState, '40001');
  const e = evidenceFor(f, error);
  assert.equal(e.outcome, 'UNKNOWN');
  assert.equal(e.rollbackConfirmed, false);
  assert.equal(e.rollbackFailed, true);
  assert.equal(e.cleanupErrors[0].operation, 'rollback');
  assert.equal(e.connectionDisposition, 'DESTROYED');
  assert.equal(f.trace.filter(v => v === 'destroy').length, 1);
  assert.equal(f.trace.includes('release'), false);
  assert.equal(f.activeConnections, 0);
});

test('B2C: BEGIN uncertainty plus failed rollback is discarded, not claimed NOT_STARTED', async () => {
  const f = fixture({ fail: phase => ['begin', 'rollback'].includes(phase) });
  const error = await rejected(() => optIn(f));
  const e = evidenceFor(f, error);
  assert.equal(e.failurePhase, 'BEGIN_IN_PROGRESS');
  assert.equal(e.outcome, 'UNKNOWN');
  assert.equal(e.connectionDisposition, 'DESTROYED');
  assert.equal(f.trace.includes('release'), false);
});

for (const failure of ['commit', 'commit-ack-unknown']) {
  test(`B2C: ${failure} remains UNKNOWN despite acknowledged rollback and disposal`, async () => {
    const f = fixture({ failure });
    const error = await rejected(() => optIn(f));
    const e = evidenceFor(f, error);
    assert.equal(e.failurePhase, 'COMMIT_IN_PROGRESS');
    assert.equal(e.commitAttempted, true);
    assert.equal(e.commitConfirmed, false);
    assert.equal(e.rollbackConfirmed, true);
    assert.equal(e.outcome, 'UNKNOWN');
    assert.equal(e.connectionDisposition, 'DESTROYED');
    assert.equal(f.trace.filter(v => v === 'destroy').length, 1);
    assert.equal(f.trace.includes('release'), false);
  });
}

test('B2C: release error cannot replace confirmed COMMIT; fallback destroy occurs once', async () => {
  const f = fixture({ failure: 'release' });
  const result = await f.evaluate();
  assert.equal(result.createdCount, 4);
  assert.equal(f.events.length, 4);
  assert.equal(f.acquisitions, 1);
  assert.equal(f.trace.filter(v => v === 'release').length, 1);
  assert.equal(f.trace.filter(v => v === 'destroy').length, 1);
  assert.equal(f.trace.includes('rollback'), false);
  assert.ok(f.logs.some(log => log.includes('outcome=COMMITTED') && log.includes('releaseCode=')));
});

test('B2C: cleanup failure preserves primary error and records failed disposal without double cleanup', async () => {
  const f = fixture({ fail: phase => ['release', 'destroy'].includes(phase) });
  const primary = transientError();
  const error = await rejected(() => optIn(f, async () => { throw primary; }));
  assert.equal(error, primary);
  const e = evidenceFor(f, error);
  assert.equal(e.outcome, 'ROLLED_BACK');
  assert.equal(e.connectionDisposition, 'DESTROY_FAILED');
  assert.deepEqual(Array.from(e.cleanupErrors, item => item.operation), ['release', 'destroy']);
  assert.equal(f.trace.filter(v => v === 'release').length, 1);
  assert.equal(f.trace.filter(v => v === 'destroy').length, 1);
});

for (const [code, errno] of [['ER_LOCK_DEADLOCK', 1213], ['ER_LOCK_WAIT_TIMEOUT', 1205], [undefined, 1213]]) {
  test(`B2C: ${code || errno} with confirmed rollback retries fresh and counts only final commit`, async () => {
    let faults = 0;
    const f = fixture({ fail: phase => {
      if (phase === 'audit' && faults++ === 0) {
        const error = transientError(code, errno);
        if (code === undefined) delete error.code;
        return error;
      }
    } });
    const result = await f.evaluate();
    assert.equal(result.createdCount, 4);
    assert.equal(f.acquisitions, 2);
    assert.equal(f.trace.filter(v => v === 'begin').length, 2);
    assert.equal(f.trace.filter(v => v === 'gate:D1').length, 2);
    assert.equal(f.trace.filter(v => v === 'reload:D1').length, 2);
    assert.equal(f.trace.filter(v => v === 'committed').length, 1);
    assert.equal(f.trace.filter(v => v === 'rollback').length, 1);
    assert.equal(f.trace.filter(v => v === 'release').length, 2);
    assert.equal(f.state.notifications.length, 4);
    assert.equal(f.state.evaluations.length, 1);
    assert.equal(f.state.audits.length, 1);
    assert.equal(f.events.length, 4, 'Failed attempt buffer must never publish');
    assert.ok(f.events.every(event => f.state.notifications.some(row => row.id === event.resourceId)));
    assert.ok(f.trace.indexOf('release') < f.trace.indexOf('delay:25'));
    assert.equal(f.activeConnections, 0);
  });
}

test('B2C: two transient failures then success use exactly three attempts and bounded backoff', async () => {
  let faults = 0;
  const f = fixture({ fail: phase => phase === 'audit' && faults++ < 2 ? transientError() : false });
  assert.equal((await f.evaluate()).createdCount, 4);
  assert.equal(f.acquisitions, 3);
  assert.deepEqual(f.trace.filter(v => v.startsWith('delay:')), ['delay:25', 'delay:50']);
  assert.equal(f.events.length, 4);
  assert.equal(f.state.notifications.length, 4);
});

test('B2C: retry exhaustion fails once, continues next document, and preserves scan accounting', async () => {
  const f = fixture({ documents: [document('D1'), document('D2')], fail: (phase, values) =>
    phase === 'recipient-2' && values[12] === 'D1' ? transientError() : false });
  const result = await f.load('services/slaNotificationProducer.service.js').runScheduledEvaluation();
  assert.equal(f.acquisitions, 4);
  assert.equal(result.processedCount, 2);
  assert.equal(result.failedCount, 1);
  assert.equal(result.succeededCount, 1);
  assert.equal(result.skippedCount, 0);
  assert.equal(result.createdCount, 4);
  assert.equal(result.traversalComplete, true);
  assert.equal(result.evaluationComplete, false);
  assert.equal(f.trace.filter(v => v === 'rollback').length, 3);
  assert.equal(f.trace.filter(v => v === 'reload:D1').length, 3);
  assert.equal(f.state.notifications.length, 4);
  assert.ok(f.state.notifications.every(n => n.related_resource_id === 'D2'));
  assert.equal(f.events.length, 4);
});

test('B2C: fresh post-lock state/time/cycle and suppression replace the failed attempt decision', async () => {
  let faults = 0;
  const f = fixture({ fail: phase => phase === 'audit' && faults++ === 0 ? transientError() : false });
  f.control.onDelay = () => {
    Object.assign(f.documents[0], { slaStartedAt: '2026-11-05T12:01:00.000Z', status: 'Project Review',
      revision: 'IFA-Submitted', responsibleRole: 'Team Project', activeRevisionId: 'R2', activeFileId: 'F2' });
    f.control.dbTime = '2026-11-08T12:01:00.000Z';
  };
  const result = await f.evaluate();
  assert.equal(result.slaStatus, 'At Risk');
  assert.equal(result.createdCount, 4);
  assert.equal(f.state.audits.length, 0, 'Failed Overdue audit must not persist');
  assert.ok(f.state.notifications.every(row => row.event_type === 'SLA At Risk'
    && row.metadata.workflowStatus === 'Project Review'
    && row.metadata.slaTimer.calculatedAt === f.control.dbTime));
  assert.equal(f.state.evaluations[0].current_state, 'At Risk');
  assert.equal(f.trace.filter(v => v === 'reload:D1').length, 2);
});

test('B2C: document becomes ineligible during backoff and is skipped on fresh evaluation', async () => {
  let faults = 0;
  const f = fixture({ fail: phase => phase === 'audit' && faults++ === 0 ? transientError() : false });
  f.control.onDelay = () => { f.documents[0].status = 'Approved'; };
  const result = await f.load('services/slaNotificationProducer.service.js').runScheduledEvaluation();
  assert.equal(result.processedCount, 1);
  assert.equal(result.skippedCount, 1);
  assert.equal(result.failedCount, 0);
  assert.equal(result.succeededCount, 0);
  assert.equal(result.evaluationComplete, true);
  assert.equal(result.createdCount, 0);
  assert.equal(f.acquisitions, 2);
  assert.equal(f.events.length, 0);
  assert.deepEqual(f.state, { notifications: [], evaluations: [], audits: [] });
});

for (const [code, errno] of [['ER_PARSE_ERROR', 1064], ['ER_DUP_ENTRY', 1062], ['ECONNRESET', undefined],
  ['DOCUMENT_DELETION_IN_PROGRESS', undefined]]) {
  test(`B2C: ${code} never enters generic retry even after confirmed rollback`, async () => {
    const primary = Object.assign(new Error('primary'), { code, errno });
    const f = fixture({ fail: phase => phase === 'gate' ? primary : false });
    assert.equal(await rejected(() => f.evaluate()), primary);
    assert.equal(f.acquisitions, 1);
    assert.equal(f.trace.some(v => v.startsWith('delay:')), false);
    assert.equal(f.events.length, 0);
  });
}

for (const failure of ['rollback', 'destroy']) {
  test(`B2C: ${failure} uncertainty forbids retry of otherwise transient error`, async () => {
    const primary = transientError();
    const f = fixture({ fail: phase => {
      if (phase === 'gate') return primary;
      return failure === 'rollback' ? phase === 'rollback' : ['release', 'destroy'].includes(phase);
    } });
    assert.equal(await rejected(() => f.evaluate()), primary);
    assert.equal(f.acquisitions, 1);
    assert.equal(f.trace.some(v => v.startsWith('delay:')), false);
    assert.equal(f.events.length, 0);
    const e = evidenceFor(f, primary);
    assert.equal(e.connectionDisposition, failure === 'rollback' ? 'DESTROYED' : 'DESTROY_FAILED');
  });
}

test('B2C: COMMIT error carrying a transient code is still ambiguous and never retried', async () => {
  const primary = transientError();
  const f = fixture({ fail: phase => phase === 'commit' ? primary : false });
  assert.equal(await rejected(() => f.evaluate()), primary);
  assert.equal(evidenceFor(f, primary).outcome, 'UNKNOWN');
  assert.equal(f.acquisitions, 1);
  assert.equal(f.events.length, 0);
  assert.equal(f.trace.some(v => v.startsWith('delay:')), false);
});

test('B2C: lost ACK may commit rows but scan reports zero confirmed creations and incomplete evaluation', async () => {
  const f = fixture({ failure: 'commit-ack-unknown' });
  const result = await f.load('services/slaNotificationProducer.service.js').runScheduledEvaluation();
  assert.equal(result.createdCount, 0);
  assert.equal(result.failedCount, 1);
  assert.equal(result.succeededCount, 0);
  assert.equal(result.traversalComplete, true);
  assert.equal(result.evaluationComplete, false);
  assert.equal(f.state.notifications.length, 4);
  assert.equal(f.state.evaluations.length, 1);
  assert.equal(f.state.audits.length, 1);
  assert.equal(f.events.length, 0);
  assert.equal(f.acquisitions, 1);
  assert.ok(f.logs.some(log => log.includes('event=transaction_outcome_unknown')
    && log.includes('documentId=D1') && log.includes('cycleId=') && log.includes('outcome=UNKNOWN')));
  assert.ok(f.sqlCalls.every(call => call.inTransaction), 'No speculative pool reconciliation');
});

test('B2C: missing evidence fails closed even for a transient error; diagnostic logs omit SQL/secrets', async () => {
  const f = fixture();
  const primary = Object.assign(transientError(), { message: 'password=secret-value', sql: 'secret-SQL' });
  f.load('repositories/sla.repository.js').runInTransaction = async () => { throw primary; };
  assert.equal(await rejected(() => f.evaluate()), primary);
  assert.equal(f.trace.some(v => v.startsWith('delay:')), false);
  assert.ok(f.logs.some(log => log.includes('outcome=UNVERIFIED') && log.includes('retry=false')));
  assert.ok(f.logs.every(log => !/secret-value|secret-SQL/.test(log)));
});

test('B2C: confirmed COMMIT survives both release and destroy failure with cleanup diagnostics', async () => {
  const f = fixture({ fail: phase => ['release', 'destroy'].includes(phase) });
  const result = await optIn(f);
  assert.equal(result.value, 'value');
  assert.equal(result.transactionEvidence.outcome, 'COMMITTED');
  assert.equal(result.transactionEvidence.commitConfirmed, true);
  assert.equal(result.transactionEvidence.connectionDisposition, 'DESTROY_FAILED');
  assert.equal(result.transactionEvidence.cleanupErrors.length, 2);
  assert.equal(f.trace.includes('rollback'), false);
  assert.equal(f.trace.filter(v => v === 'destroy').length, 1);
});

for (const failure of ['acquire', 'begin']) {
  test(`B2C: transient ${failure} is retried only with known NOT_STARTED or acknowledged rollback`, async () => {
    let faults = 0;
    const f = fixture({ fail: phase => phase === failure && faults++ === 0 ? transientError() : false });
    assert.equal((await f.evaluate()).createdCount, 4);
    assert.equal(f.acquisitions, 2);
    assert.equal(f.trace.filter(v => v === 'delay:25').length, 1);
    assert.equal(f.trace.filter(v => v === 'rollback').length, failure === 'begin' ? 1 : 0);
    assert.equal(f.events.length, 4);
  });
}

test('B2C: transient BEGIN failure with unconfirmed rollback cannot retry', async () => {
  const f = fixture({ fail: phase => phase === 'begin' ? transientError() : phase === 'rollback' });
  const error = await rejected(() => f.evaluate());
  assert.equal(evidenceFor(f, error).outcome, 'UNKNOWN');
  assert.equal(f.acquisitions, 1);
  assert.equal(f.trace.includes('destroy'), true);
  assert.equal(f.trace.some(v => v.startsWith('delay:')), false);
});

test('B2C: acknowledged rollback plus successful discard after release error permits bounded retry', async () => {
  let faults = 0;
  const f = fixture({ fail: phase => {
    if (phase === 'audit' && faults++ === 0) return transientError();
    return phase === 'release';
  } });
  assert.equal((await f.evaluate()).createdCount, 4);
  assert.equal(f.acquisitions, 2);
  assert.equal(f.trace.filter(v => v === 'destroy').length, 2);
  assert.equal(f.trace.filter(v => v === 'delay:25').length, 1);
  assert.equal(f.events.length, 4);
  assert.equal(f.activeConnections, 0);
});

test('B2C: existing notification identity without evaluation/audit is not proof of ambiguous attempt success', async () => {
  const f = fixture();
  await f.evaluate();
  f.state.evaluations.length = 0;
  f.state.audits.length = 0;
  f.events.length = 0;
  f.control.failure = 'commit';
  const error = await rejected(() => f.evaluate());
  assert.equal(evidenceFor(f, error).outcome, 'UNKNOWN');
  assert.equal(f.state.notifications.length, 4);
  assert.equal(f.state.evaluations.length, 0);
  assert.equal(f.state.audits.length, 0);
  assert.equal(f.events.length, 0);
  assert.equal(f.acquisitions, 2);
  assert.ok(f.sqlCalls.every(call => call.inTransaction));
});

test('B2C: transient-coded SSE failure after confirmed COMMIT cannot trigger DB retry', async () => {
  const f = fixture();
  f.load('services/notification.service.js').publishNotificationCreatedSafely = () => { throw transientError(); };
  const result = await f.evaluate();
  assert.equal(result.createdCount, 4);
  assert.equal(f.acquisitions, 1);
  assert.equal(f.state.notifications.length, 4);
  assert.equal(f.trace.some(v => v.startsWith('delay:')), false);
  assert.equal(f.trace.includes('rollback'), false);
});

test('B2C: diagnostic logger failure cannot replace the original transaction/cleanup error', async () => {
  const primary = transientError();
  const f = fixture({ failure: 'rollback', fail: phase => phase === 'gate' ? primary : false });
  f.load('config/logger.js').error = () => { throw new Error('synthetic diagnostic failure'); };
  assert.equal(await rejected(() => f.evaluate()), primary);
  assert.equal(evidenceFor(f, primary).outcome, 'UNKNOWN');
  assert.equal(evidenceFor(f, primary).connectionDisposition, 'DESTROYED');
  assert.equal(f.acquisitions, 1);
});

test('B2C: failure before a retry reload does not log a cycle cached from the previous attempt', async () => {
  const primary = new Error('invalid gate');
  let faults = 0;
  const f = fixture({ fail: phase => {
    if (phase === 'audit') { faults++; return transientError(); }
    if (phase === 'gate' && faults) return primary;
  } });
  assert.equal(await rejected(() => f.evaluate()), primary);
  const diagnostic = f.logs.find(log => log.includes('attempt=2'));
  assert.ok(diagnostic.includes('cycleId=-'));
  assert.equal(f.acquisitions, 2);
  assert.equal(f.events.length, 0);
});
