const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createDeleteNotificationDispatcher } = require('../../src/services/documentDeleteNotification.service');
const { EVENT_TYPE } = require('../../src/repositories/documentDeleteNotification.repository');

module.exports = async ({ test, fixture, reserve, engine, execute, count, pool, coordination, driver, userId, run, root }) => {
  const [[actor]] = await execute('SELECT role_id FROM users WHERE id=?', [userId]);
  let serial = 0;
  const member = async (f, role = 'Viewer', { status = 'Active', userStatus = 'Active', noMembership = false } = {}) => {
    const prefix = `${run}-C${serial++}`;
    const [user] = await execute('INSERT INTO users (user_code,username,full_name,email,role_id,status) VALUES (?,?,?,NULL,?,?)',
      [prefix, prefix, 'Synthetic Sprint C Member', actor.role_id, userStatus]);
    if (!noMembership) await execute('INSERT INTO project_memberships (id,project_id,user_id,official_role,status) VALUES (?,?,?,?,?)',
      [prefix, f.projectId, user.insertId, role, status]);
    return { userId: user.insertId, membershipId: prefix };
  };
  const rows = async (id) => (await execute('SELECT * FROM notifications WHERE identity_key LIKE ? ORDER BY recipient_user_id', [`permanent-delete:${id}:%`]))[0];
  const snapshot = async (id) => JSON.parse((await execute('SELECT completion_snapshot FROM document_delete_executions WHERE operation_id=?', [id]))[0][0].completion_snapshot);
  const dispatcher = (hooks) => createDeleteNotificationDispatcher({ pool, hooks });
  const failInsert = () => { throw Object.assign(new Error('Synthetic notification failure'), { code: 'TEST_NOTIFICATION_FAILURE' }); };
  const completedPending = async (f) => {
    const id = await reserve(f); const result = await engine({ notifications: { afterInsert: failInsert } }).resume(id);
    assert.equal(result.status, 'COMPLETED'); assert.equal(result.notification.status, 'PENDING');
    return id;
  };
  const load = (file, mocks) => {
    const module = { exports: {} };
    new vm.Script(fs.readFileSync(path.join(root, 'apps/backend/src', file), 'utf8'), { filename: file })
      .runInNewContext({ module, exports: module.exports, require: (request) => {
        if (Object.hasOwn(mocks, request)) return mocks[request];
        if (request.startsWith('node:')) return require(request);
        throw new Error(`Unreviewed runtime dependency: ${request}`);
      } });
    return module.exports;
  };
  const admission = load('services/documentAdmission.service.js', {
    '../repositories/documentCoordination.repository': coordination, '../config/database': { pool },
    '../config/logger': { error() {} },
  });
  const notificationRepository = load('repositories/notification.repository.js', {
    '../config/database': { pool }, '../services/documentAdmission.service': admission,
    '../utils/jsonMetadata': require('../../src/utils/jsonMetadata'),
    './notificationWrite.repository': require('../../src/repositories/notificationWrite.repository'),
  });

  await test('C01 Completed: all five active official roles including actor/Viewer receive exactly one; inactive/nonmember/other project excluded', async () => {
    const f = await fixture(); const other = await fixture(); const expected = [String(userId)];
    for (const role of ['Document Owner','Team Process','Team Project','Viewer']) expected.push(String((await member(f, role)).userId));
    for (const options of [{ status: 'Inactive' }, { userStatus: 'Inactive' }, { noMembership: true }]) await member(f, 'Viewer', options);
    await member(other);
    const id = await reserve(f); const result = await engine().resume(id);
    assert.equal(result.status, 'COMPLETED'); assert.equal(result.notification.status, 'DELIVERED');
    const actual = await rows(id); assert.deepEqual(actual.map((r) => String(r.recipient_user_id)).sort(), expected.sort());
    assert.ok(actual.some((r) => r.recipient_role === 'Viewer'));
    assert.ok(actual.every((r) => r.project_id === f.projectId && r.event_type === EVENT_TYPE));
    assert.equal((await snapshot(id)).notificationDelivery.state, 'DELIVERED');
  });
  await test('C02 Pending unbound delete never creates success notifications', async () => {
    const f = await fixture({ unbound: true }); const id = await reserve(f);
    assert.equal((await engine().resume(id)).status, 'PENDING'); assert.equal((await rows(id)).length, 0);
    assert.equal((await dispatcher().dispatch(id)).status, 'NOT_COMPLETED');
  });
  await test('C03 Failed finalization rolls back completion/event and creates no success notification', async () => {
    const f = await fixture(); const id = await reserve(f);
    assert.equal((await engine({ beforeDatabaseCommit: () => { throw new Error('Synthetic failed finalization'); } }).resume(id)).status, 'PENDING');
    assert.equal((await rows(id)).length, 0); assert.equal(await count('engineering_documents','id',f.documentId), 1);
    assert.equal((await dispatcher().dispatch(id)).status, 'NOT_COMPLETED');
  });
  await test('C04 Unknown storage result never creates success notifications or retries uncertain delete', async () => {
    const f = await fixture(); const id = await reserve(f); let calls = 0;
    const unknown = { captureNamespace: () => driver.captureNamespace(), deleteOwnedExact: async () => {
      calls += 1; throw Object.assign(new Error('Synthetic timeout'), { code: 'ETIMEDOUT' });
    } };
    assert.equal((await engine({}, unknown).resume(id)).status, 'PENDING');
    assert.equal((await engine({}, unknown).resume(id)).reason, 'STORAGE_OUTCOME_UNRESOLVED');
    assert.equal(calls, 1); assert.equal((await rows(id)).length, 0);
  });
  await test('C05 Recovery completion produces the durable notification only after successful recovery', async () => {
    const f = await fixture(); const id = await reserve(f);
    assert.equal((await engine({ afterStorage: () => { throw new Error('Synthetic interruption'); } }).resume(id)).status, 'PENDING');
    assert.equal((await rows(id)).length, 0);
    assert.equal((await engine().resume(id)).status, 'COMPLETED'); assert.equal((await rows(id)).length, 1);
  });
  await test('C06 Repeated completion keeps one event, recipient row and final Audit', async () => {
    const f = await fixture(); const id = await reserve(f);
    for (let i = 0; i < 3; i += 1) assert.equal((await engine().resume(id)).status, 'COMPLETED');
    assert.equal((await rows(id)).length, 1); assert.equal(await count('audit_trail','identity_key',`permanent-delete:${id}`), 1);
  });
  await test('C07 Concurrent notification workers serialize receipts and cannot duplicate users', async () => {
    const f = await fixture(); await member(f); await member(f, 'Team Project'); const id = await completedPending(f);
    assert.equal((await rows(id)).length, 0);
    const results = await Promise.all([dispatcher().dispatch(id), dispatcher().dispatch(id), dispatcher().dispatch(id)]);
    assert.ok(results.every((result) => result.status === 'DELIVERED')); assert.equal((await rows(id)).length, 3);
    assert.equal((await snapshot(id)).notificationDelivery.deliveredUserIds.length, 3);
  });
  await test('C08 Partial notification failure commits first receipt and rolls back failed insert; retry fills missing users only', async () => {
    const f = await fixture(); await member(f); await member(f); let inserted = 0;
    const id = await reserve(f); const result = await engine({ notifications: { afterInsert: () => { if (++inserted === 2) failInsert(); } } }).resume(id);
    assert.equal(result.status, 'COMPLETED'); assert.equal(result.notification.status, 'PENDING');
    assert.equal((await rows(id)).length, 1); assert.equal((await snapshot(id)).notificationDelivery.deliveredUserIds.length, 1);
    assert.equal((await dispatcher().dispatch(id)).status, 'DELIVERED'); assert.equal((await rows(id)).length, 3);
  });
  await test('C09 Completion-time membership snapshot survives delivery interruption and later membership changes', async () => {
    const f = await fixture(); const original = await member(f); const id = await reserve(f);
    const result = await engine({ notifications: { afterRecipientCommit: failInsert } }).resume(id);
    assert.equal(result.status, 'COMPLETED'); const before = await snapshot(id);
    assert.equal(before.notificationDelivery.deliveredUserIds.length, 1);
    await execute("UPDATE project_memberships SET status='Inactive' WHERE id=?", [original.membershipId]);
    const late = await member(f, 'Team Process');
    await dispatcher().dispatch(id);
    assert.deepEqual((await rows(id)).map((r) => String(r.recipient_user_id)).sort(), [String(userId), String(original.userId)].sort());
    assert.ok(!(await rows(id)).some((r) => String(r.recipient_user_id) === String(late.userId)));
    assert.equal((await snapshot(id)).completedAt, before.completedAt);
  });
  await test('C10 Document number persists after hard delete; existing frontend target predicate is false without UI changes', async () => {
    const f = await fixture(); const id = await reserve(f); await engine().resume(id);
    assert.equal(await count('engineering_documents','id',f.documentId), 0);
    const [row] = await rows(id); const dto = await notificationRepository.findNotificationById(row.id);
    assert.ok(dto.message.includes(`${f.prefix}-NUMBER`)); assert.equal(dto.metadata.deletedDocumentNumber, `${f.prefix}-NUMBER`);
    assert.equal(dto.relatedResourceId, null); assert.equal(dto.relatedDocumentNumber, null); assert.equal(dto.actionTarget, null);
    for (const name of ['NotificationTable.jsx','NotificationDetailModal.jsx']) {
      const source = fs.readFileSync(path.join(root, 'apps/frontend/src/features/notification/components', name), 'utf8');
      const body = /const hasOpenableDocumentTarget = ([\s\S]*?);/.exec(source)[1];
      assert.equal(vm.runInNewContext(`(${body})`)(dto), false);
    }
    assert.doesNotMatch(JSON.stringify(dto.metadata), /storageKey|bucket|credential|namespace/);
  });
  await test('C11 Final Audit is exactly once and historical Audit survives notification failure/retry', async () => {
    const f = await fixture(); const id = await completedPending(f);
    assert.equal(await count('audit_trail','resource_id',f.documentId), 2);
    await dispatcher().dispatch(id); await engine().resume(id);
    assert.equal(await count('audit_trail','identity_key',`permanent-delete:${id}`), 1);
    assert.equal(await count('audit_trail','id',`${f.prefix}-AUDIT`), 1);
  });
  await test('C12 Existing individual read behavior works after document hard delete and rejects a different recipient', async () => {
    const f = await fixture(); const id = await reserve(f); await engine().resume(id); const [notification] = await rows(id);
    await notificationRepository.markNotificationRead({ notificationId: notification.id, recipientUserId: 0 });
    assert.equal((await notificationRepository.findNotificationById(notification.id)).read, false);
    await notificationRepository.markNotificationRead({ notificationId: notification.id, recipientUserId: userId });
    const result = await notificationRepository.findNotificationById(notification.id); assert.equal(result.read, true); assert.ok(result.readAt);
  });
  await test('C13 Existing list, summary and mark-all-read remain project/recipient scoped', async () => {
    const f = await fixture(); const other = await fixture(); const id = await reserve(f); await engine().resume(id);
    const before = await notificationRepository.getNotificationSummaryByRecipient({ projectId: f.projectId, recipientUserId: userId });
    assert.equal(before.total, 2); assert.equal(before.unread, 2);
    await notificationRepository.markAllNotificationsRead({ projectId: f.projectId, recipientUserId: userId });
    assert.equal((await notificationRepository.getNotificationSummaryByRecipient({ projectId: f.projectId, recipientUserId: userId })).unread, 0);
    assert.equal((await notificationRepository.findNotificationById(`${other.prefix}-UNRELATED`)).read, false);
    const page = await notificationRepository.listNotificationsPageByRecipient({ projectId: f.projectId, recipientUserId: userId,
      direction: 'desc', eventType: EVENT_TYPE, limit: 10, offset: 0, sortBy: 'createdAt', search: '' });
    assert.equal(page.totalItems, 1); assert.equal(page.rows[0].eventType, EVENT_TYPE);
  });
  await test('C14 User-deleted notification never resurrects on delete retry or recovery worker', async () => {
    const f = await fixture(); const id = await reserve(f); await engine().resume(id); const [notification] = await rows(id);
    assert.equal(await notificationRepository.deleteNotification({ notificationId: notification.id, recipientUserId: 0 }), 0);
    assert.equal(await notificationRepository.deleteNotification({ notificationId: notification.id, recipientUserId: userId }), 1);
    await engine().resume(id); await dispatcher().dispatch(id);
    assert.equal((await rows(id)).length, 0); assert.equal((await snapshot(id)).notificationDelivery.state, 'DELIVERED');
  });
  await test('C15 Existing bulk notification deletion cannot remove another project or another recipient row', async () => {
    const f = await fixture(); const other = await fixture(); await member(f); const id = await reserve(f); await engine().resume(id);
    const notifications = await rows(id); const own = notifications.find((item) => String(item.recipient_user_id) === String(userId));
    const foreign = notifications.find((item) => item.id !== own.id);
    assert.equal(await notificationRepository.deleteNotifications({ projectId: f.projectId, recipientUserId: userId,
      notificationIds: [own.id, foreign.id, `${other.prefix}-UNRELATED`] }), 1);
    assert.ok(await notificationRepository.findNotificationById(foreign.id)); assert.ok(await notificationRepository.findNotificationById(`${other.prefix}-UNRELATED`));
  });
  await test('C16 Deleted completion-time membership does not lose recipient or cause an invalid membership FK', async () => {
    const f = await fixture(); const original = await member(f); const id = await completedPending(f);
    await execute('DELETE FROM project_memberships WHERE id=?', [original.membershipId]);
    await dispatcher().dispatch(id); const notification = (await rows(id)).find((r) => String(r.recipient_user_id) === String(original.userId));
    assert.ok(notification); assert.equal(notification.recipient_project_membership_id, null); assert.equal(notification.recipient_role, 'Viewer');
  });
  await test('C17 Notification failure cannot demote durable completion or re-run physical cleanup', async () => {
    const f = await fixture(); const id = await completedPending(f);
    assert.equal(await count('engineering_documents','id',f.documentId), 0);
    const [[row]] = await execute('SELECT phase FROM document_delete_executions WHERE operation_id=?', [id]); assert.equal(row.phase, 'COMPLETED');
    const unsafe = { captureNamespace: () => { throw new Error('Completed operation must not touch storage'); }, deleteOwnedExact: failInsert };
    assert.equal((await engine({}, unsafe).resume(id)).status, 'COMPLETED'); assert.equal((await rows(id)).length, 1);
  });
  await test('C18 Notification integration loads no email/Resend provider and sends no production email', async () => {
    assert.ok(Object.keys(require.cache).every((filename) => !/[\\/]services[\\/](?:email\.service|approvalEmailDispatcher\.service|providers[\\/](?:resend|email)\.provider)/.test(filename)));
    const source = fs.readFileSync(path.join(root, 'apps/backend/src/services/documentDeleteNotification.service.js'), 'utf8');
    assert.doesNotMatch(source, /resend|sendEmail|email\.service/);
  });
};
