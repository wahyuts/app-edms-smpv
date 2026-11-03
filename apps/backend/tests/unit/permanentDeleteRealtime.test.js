const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const { randomUUID } = require('node:crypto');
const constants = require('../../src/constants/realtime.constants');
const publisher = require('../../src/services/realtimePublisher.service');
const registry = require('../../src/services/realtimeConnectionRegistry.service');
const eventBus = require('../../src/services/realtimeEventBus.service');
const { createRepository } = require('../../src/repositories/permanentDeleteApi.repository');

const loadPublisher = (publishSafely) => {
  const module = { exports: {} };
  runInNewContext(readFileSync(require.resolve('../../src/services/realtimeDocumentPublisher.service'), 'utf8'), {
    module, require: (name) => {
      if (name === '../constants/realtime.constants') return constants;
      if (name === './realtimePublisher.service') return { publishSafely };
      throw new Error(`Unexpected import ${name}`);
    },
  });
  return module.exports;
};
const args = { actorUserId: 1, document: { id: 'D', projectId: 'P' }, operationId: 'OP', recipientUserIds: [1, 2, 2, 3] };

test('Completion event is minimal, stable and scoped to recipient plus project; repeated calls are suppressed', () => {
  const events = []; const p = loadPublisher((event) => { events.push(publisher.buildRealtimeEvent(event)); return { published: true }; });
  p.publishDocumentDeleted(args); p.publishDocumentDeleted(args);
  assert.equal(events.length, 3);
  for (const event of events) {
    assert.equal(event.type, 'document.deleted'); assert.equal(event.scope, 'user-project');
    assert.equal(event.projectId, 'P'); assert.equal(event.documentId, 'D');
    assert.equal(event.correlationId, 'OP');
    assert.equal(event.eventId, `RT-DELETE:P:OP:${event.recipientUserId}`);
    assert.doesNotMatch(JSON.stringify(event), /storageKey|bucket|credential|namespace|documentNumber/);
  }
});

test('Separate operations remain distinct; incomplete event identity is not published', () => {
  const events = []; const p = loadPublisher(event => { events.push(event); return { published: true }; });
  p.publishDocumentDeleted({ ...args, operationId: null }); p.publishDocumentDeleted({ ...args, document: {} });
  assert.equal(events.length, 0);
  p.publishDocumentDeleted(args); p.publishDocumentDeleted({ ...args, operationId: 'OP2' });
  assert.equal(events.length, 6);
});

test('Failed publication can be retried with the same event ID, without repeating successful recipients', () => {
  const events = []; let fail = true;
  const p = loadPublisher(event => {
    events.push(event); return { published: !(event.recipientUserId === 2 && fail) };
  });
  p.publishDocumentDeleted(args); fail = false; p.publishDocumentDeleted(args);
  assert.equal(events.length, 4); assert.equal(events.at(-1).recipientUserId, 2);
  assert.equal(events[1].eventId, events.at(-1).eventId);
});

test('Recipient query uses current active project/user/membership, no role restriction or historical snapshot', async () => {
  const repository = createRepository({ pool: { execute: async (sql, params) => {
    assert.match(sql, /^SELECT DISTINCT m.user_id/); assert.match(sql, /m.project_id=\?/);
    assert.match(sql, /m.status='Active' AND u.status='Active' AND p.status='Active'/);
    assert.doesNotMatch(sql, /official_role|notificationDelivery/); assert.deepEqual(params, ['P']);
    return [[{ user_id: 1 }, { user_id: 2 }]];
  } } });
  assert.deepEqual(await repository.realtimeRecipients('P'), [1, 2]);
});

test('Existing SSE delivers to all authorized same-project devices, never another project, inactive recipient or session-only connection', (t) => {
  const suffix = randomUUID(); const connections = []; const writes = new Map();
  const add = (userId, projectId, label) => {
    const id = `${suffix}:${label}`; connections.push(id); writes.set(label, []);
    registry.register({ connectionId: id, projectId, userId, response: { write: message => writes.get(label).push(message) } });
  };
  t.after(() => connections.forEach(id => registry.unregister(id)));
  const off = eventBus.subscribe(event => registry.deliver(event)); t.after(off);
  for (let userId = 1; userId <= 5; userId++) add(userId, suffix, `role-${userId}`);
  add(2, suffix, 'second-device'); add(2, `${suffix}-other`, 'other-project');
  add(99, suffix, 'not-authorized'); add(3, null, 'no-project');
  const p = loadPublisher(publisher.publishSafely);
  p.publishDocumentDeleted({ ...args, document: { id: 'D', projectId: suffix }, recipientUserIds: [1,2,3,4,5] });
  for (let id = 1; id <= 5; id++) assert.equal(writes.get(`role-${id}`).length, 1);
  assert.equal(writes.get('second-device').length, 1);
  for (const label of ['other-project','not-authorized','no-project']) assert.equal(writes.get(label).length, 0);
  p.publishDocumentDeleted({ ...args, document: { id: 'D', projectId: suffix }, recipientUserIds: [1,2,3,4,5] });
  assert.equal(writes.get('second-device').length, 1);
  // Existing notification event still uses the same bus and recipient delivery.
  publisher.publishSafely({ type: 'notification.created', scope: 'user-project', projectId: suffix,
    recipientUserId: 2, resourceType: 'Notification', resourceId: 'N', reason: 'test' });
  assert.equal(writes.get('role-2').length, 2); assert.equal(writes.get('second-device').length, 2);
  assert.equal(writes.get('role-3').length, 1);
});
