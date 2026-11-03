const test = require('node:test');
const assert = require('node:assert/strict');
const { captureRecipients, notificationFor, deliverRecipient } = require('../../src/repositories/documentDeleteNotification.repository');
const { insertNotification } = require('../../src/repositories/notificationWrite.repository');
const { createDeleteNotificationDispatcher } = require('../../src/services/documentDeleteNotification.service');
const snapshot = { operationId: 'OP-SYNTHETIC', projectId: 'PROJECT-SYNTHETIC', documentNumber: 'PFD-SYNTHETIC',
  initiatingAdmin: { id: 1 }, completedAt: '2026-11-02T10:00:00.000000Z' };
const recipient = { userId: 2, membershipId: 'MEMBER-SYNTHETIC', officialRole: 'Viewer' };

test('Delete recipient snapshot deduplicates users and retains canonical membership-scoped roles', async () => {
  const result = await captureRecipients({ execute: async (sql, args) => {
    assert.match(sql, /m.status='Active' AND u.status='Active'/); assert.match(sql, /LOCK IN SHARE MODE/);
    assert.deepEqual(args, [snapshot.projectId]);
    return [[{ id: 'A', user_id: 2, official_role: 'viewer' }, { id: 'B', user_id: 2, official_role: 'Viewer' }]];
  } }, snapshot.projectId);
  assert.equal(result.recipients.length, 1); assert.equal(result.recipients[0].officialRole, 'Viewer');
  assert.deepEqual(result.deliveredUserIds, []); assert.equal(result.state, 'PENDING');
});

test('Delete notification snapshots document number without a live-document navigation target or sensitive metadata', () => {
  const row = notificationFor(snapshot, recipient, recipient.membershipId);
  assert.ok(row.message.includes(snapshot.documentNumber));
  assert.equal(row.metadata.deletedDocumentNumber, snapshot.documentNumber);
  assert.equal(row.actionTarget, null); assert.equal(row.relatedDocumentNumber, null); assert.equal(row.relatedResourceId, null);
  assert.notEqual(row.relatedResourceType, 'Document');
  assert.equal(row.identityKey, `permanent-delete:${snapshot.operationId}:${recipient.userId}`);
  assert.equal(row.id, notificationFor(snapshot, recipient, null).id);
  assert.doesNotMatch(JSON.stringify(row), /storageKey|bucket|credential|namespace/);
});

test('Shared notification insert preserves legacy IGNORE behavior and exposes strict transactional insert for Delete', async () => {
  const calls = []; const c = { execute: async (sql, args) => { calls.push({ sql, args }); return [{ affectedRows: 1 }]; } };
  const row = notificationFor(snapshot, recipient, null);
  await insertNotification(c, row); await insertNotification(c, row, { strict: true });
  assert.match(calls[0].sql, /INSERT IGNORE INTO/); assert.match(calls[1].sql, /INSERT INTO/);
  assert.doesNotMatch(calls[1].sql, /IGNORE/); assert.deepEqual(calls[0].args, calls[1].args);
});

for (const phase of ['MANIFEST_FINALIZED', null]) test(`Dispatcher never inserts before durable Completed: ${phase}`, async () => {
  let writes = 0;
  const c = { beginTransaction: async () => {}, rollback: async () => {}, release() {}, execute: async (sql) => {
    if (!sql.startsWith('SELECT phase')) writes += 1;
    return [phase ? [{ phase, completion_snapshot: null }] : []];
  } };
  const result = await createDeleteNotificationDispatcher({ pool: { getConnection: async () => c } }).dispatch('OP');
  assert.equal(result.status, 'NOT_COMPLETED'); assert.equal(writes, 0);
});

test('Legacy completion does not fabricate historical recipients from current membership', async () => {
  const c = { beginTransaction: async () => {}, rollback: async () => {}, release() {}, execute: async (sql) => {
    assert.match(sql, /^SELECT phase/); return [[{ phase: 'COMPLETED', completion_snapshot: JSON.stringify(snapshot) }]];
  } };
  assert.equal((await createDeleteNotificationDispatcher({ pool: { getConnection: async () => c } }).dispatch('OP')).status, 'LEGACY_NOT_PREPARED');
});

test('Strict duplicate reconciliation accepts semantic JSON metadata but rejects a different logical notification', async () => {
  const expected = notificationFor(snapshot, recipient, recipient.membershipId); let conflict = false;
  const c = { execute: async (sql) => {
    if (sql.startsWith('SELECT id')) return [[{ id: recipient.membershipId }]];
    if (/INSERT INTO notifications/.test(sql)) throw Object.assign(new Error('Duplicate'), { code: 'ER_DUP_ENTRY' });
    assert.match(sql, /WHERE identity_key=/);
    return [[{ id: expected.id, project_id: expected.projectId, recipient_user_id: recipient.userId, event_type: expected.eventType,
      title: expected.title, priority: expected.priority, official_role: recipient.officialRole, recipient_role: recipient.officialRole,
      related_resource_type: expected.relatedResourceType, related_document_number: null,
      message: conflict ? 'Other event' : expected.message, related_resource_id: null, action_target: null,
      metadata: Object.fromEntries(Object.entries(expected.metadata).reverse()) }]];
  } };
  assert.equal((await deliverRecipient(c, snapshot, recipient)).id, expected.id);
  conflict = true; await assert.rejects(deliverRecipient(c, snapshot, recipient), { code: 'DELETE_NOTIFICATION_IDENTITY_CONFLICT' });
});

test('Invalid dispatch identity never acquires a database connection', async () => {
  const d = createDeleteNotificationDispatcher({ pool: { getConnection: () => { throw new Error('Must not acquire'); } } });
  await assert.rejects(d.dispatch(''), { code: 'DELETE_OPERATION_INVALID' });
});
