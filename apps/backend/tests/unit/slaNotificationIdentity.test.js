const assert = require('node:assert/strict');
const test = require('node:test');
const { createHash } = require('node:crypto');
const { fixture, document, now } = require('../helpers/slaTransactionFixture.cjs');

const legacyKey = row => [row.event_type, row.project_id, row.related_resource_id,
  row.recipient_user_id, row.metadata.notificationIdentityBasis].join(':');
const longDocument = patch => document(`DOC-PID-${'d'.repeat(40)}`, {
  projectId: `PRJ-${'p'.repeat(40)}`, ...patch,
});

for (const state of ['At Risk', 'Overdue']) for (const previous of [false, true]) {
  test(`bounded SLA identity: ${state}, previous evaluation=${previous}`, async () => {
    const doc = longDocument({ daysUntilValidation: state === 'At Risk' ? 7 : 3 });
    const f = fixture({ documents: [doc] });
    if (previous) f.state.evaluations.push({ id: 'E0', document_id: doc.id, project_id: doc.projectId,
      cycle_id: `${doc.projectId}:${doc.id}:${doc.slaStartedAt}`, current_state: 'On Track',
      updated_at: now, notified_states: {} });
    assert.equal((await f.evaluate()).createdCount, 4);
    for (const row of f.state.notifications) {
      assert.ok(legacyKey(row).length > 255);
      assert.equal(row.identity_key.length, 71);
      assert.match(row.identity_key, /^sla:v1:[a-f0-9]{64}$/);
      assert.equal(row.identity_key, `sla:v1:${createHash('sha256').update(legacyKey(row)).digest('hex')}`);
      assert.equal(row.metadata.cycleId, `${doc.projectId}:${doc.id}:${doc.slaStartedAt}`);
    }
    assert.equal(new Set(f.state.notifications.map(row => row.identity_key)).size, 4);
    f.events.length = 0;
    assert.equal((await f.evaluate()).result, 'same_state_suppressed');
    assert.equal(f.state.notifications.length, 4);
    assert.equal(f.events.length, 0);
  });
}

test('canonical maximum-length identifiers fit notification keys', async () => {
  const f = fixture({ documents: [document('d'.repeat(64), { projectId: 'p'.repeat(64), daysUntilValidation: 7 })] });
  await f.evaluate();
  assert.ok(f.state.notifications.every(row => row.identity_key.length === 71));
});

for (const format of ['complete-key-no-metadata', 'complete-key', 'truncated-key-full-metadata']) {
  test(`legacy compatibility without evaluation evidence: ${format}`, async () => {
    const f = fixture({ documents: [format === 'complete-key-no-metadata' ? document() : longDocument()] });
    await f.evaluate();
    for (const row of f.state.notifications) {
      row.identity_key = legacyKey(row);
      if (format === 'truncated-key-full-metadata') row.identity_key = row.identity_key.slice(0, 255);
      if (format === 'complete-key-no-metadata') delete row.metadata.notificationIdentityBasis;
    }
    const keys = f.state.notifications.map(row => row.identity_key);
    f.state.evaluations.length = 0;
    f.events.length = 0;
    const result = await f.evaluate();
    assert.equal(result.createdCount, 0);
    assert.equal(result.duplicateCount, 4);
    assert.deepEqual(f.state.notifications.map(row => row.identity_key), keys);
    assert.equal(f.events.length, 0);
    assert.equal(f.state.evaluations.length, 1);
  });
}

test('legacy cycle-only keys without metadata still use existing optional cycle deduplication', async () => {
  const f = fixture();
  await f.evaluate();
  const cycleId = f.state.evaluations[0].cycle_id;
  for (const row of f.state.notifications) {
    row.identity_key = [row.event_type, row.project_id, row.related_resource_id, row.recipient_user_id, cycleId].join(':');
    row.metadata = {};
  }
  const service = f.load('services/notification.service.js');
  const buffer = [];
  const result = await f.load('repositories/sla.repository.js').runInTransaction({ projectId: 'P1', documentId: 'D1' }, connection =>
    service.createSlaStateNotifications({ document: document(), cycleId,
      eventType: service.NOTIFICATION_EVENT_TYPE.SLA_OVERDUE }, { connection, postCommitNotifications: buffer }));
  assert.equal(result.createdCount, 0);
  assert.equal(buffer.length, 0);
  assert.equal(f.state.notifications.length, 4);
});

test('different project, document, recipient, event and transition remain distinct', async () => {
  const f = fixture();
  const service = f.load('services/notification.service.js');
  const keys = [];
  for (const [projectId, id, eventType, identityBasis] of [
    ['P1', 'D1', 'SLA Overdue', 'transition-1'],
    ['P2', 'D1', 'SLA Overdue', 'transition-1'],
    ['P1', 'D2', 'SLA Overdue', 'transition-1'],
    ['P1', 'D1', 'SLA At Risk', 'transition-1'],
    ['P1', 'D1', 'SLA Overdue', 'transition-2'],
  ]) {
    const doc = document(id, { projectId });
    f.documents.push(doc);
    const buffer = [];
    const before = f.state.notifications.length;
    await f.load('repositories/sla.repository.js').runInTransaction({ projectId, documentId: id }, connection =>
      service.createSlaStateNotifications({ document: doc, eventType, identityBasis,
        cycleId: `${projectId}:${id}:${doc.slaStartedAt}`, skipCycleDuplicateCheck: true },
      { connection, postCommitNotifications: buffer }));
    keys.push(...f.state.notifications.slice(before).map(row => row.identity_key));
  }
  assert.equal(keys.length, 20);
  assert.equal(new Set(keys).size, 20);
});

test('legacy transition does not suppress a later legitimate transition in the same cycle', async () => {
  const f = fixture();
  await f.evaluate();
  for (const row of f.state.notifications) row.identity_key = legacyKey(row);
  f.documents[0].daysUntilValidation = 8;
  await f.evaluate(); // On Track.
  f.documents[0].daysUntilValidation = 3;
  assert.equal((await f.evaluate()).createdCount, 4);
  assert.equal(f.state.notifications.length, 8);
  assert.equal(f.state.notifications.filter(row => row.identity_key.startsWith('sla:v1:')).length, 4);
});
