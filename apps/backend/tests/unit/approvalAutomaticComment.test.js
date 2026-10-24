const assert = require('node:assert/strict');
const test = require('node:test');
const express = require('express');
const cookieParser = require('cookie-parser');
const { pool } = require('../../src/config/database');
const repo = require('../../src/repositories/document.repository');
const fileRepo = require('../../src/repositories/fileAccess.repository');
const memberships = require('../../src/repositories/projectMembership.repository');
const approval = require('../../src/services/approval.service');
const notifications = require('../../src/services/notification.service');
const audit = require('../../src/services/audit.service');
const sla = require('../../src/services/slaNotificationProducer.service');
const realtime = require('../../src/services/realtimeDocumentPublisher.service');
const storage = require('../../src/services/storage.service');
const uploads = require('../../src/services/upload.service');
const auth = require('../../src/services/auth.service');
const { generateAccessToken } = require('../../src/utils/token');
const { AUTH_COOKIE_NAMES } = require('../../src/constants/auth.constants');

const messages = {
  'Team Process': 'This document has been approved by Team Process and can continue to the next workflow by Team Project',
  'Team Project': 'This document has been fully approved by Team Project.',
};
const fixture = (t, { role = 'Team Process', status, failInsert = false, noMembership = false } = {}) => {
  let doc = { id: 'DOC-1', projectId: 'PRJ-1', projectCode: 'TEST', documentNumber: 'PFD-1', lifecycle: 'Active',
    status: status || (role === 'Team Project' ? 'Project Review' : 'Process Review'),
    revision: 'IFR-Submitted', activeRevisionId: 'REV-1', activeFileId: 'FILE-1', currentAssigneeUserId: 9, updatedAt: 'before' };
  let records = { comments: [], history: [] };
  let queue = Promise.resolve();
  const attempts = [];
  for (const method of ['execute', 'query', 'getConnection']) t.mock.method(pool, method, async () => { throw new Error('Live database access prohibited'); });
  t.mock.method(repo, 'findDocumentRegisterById', async () => structuredClone(doc));
  t.mock.method(memberships, 'findActiveMembershipByProjectAndUser', async ({ projectId, userId }) => {
    assert.equal(userId, 1); assert.equal(projectId, 'PRJ-1');
    return noMembership ? null : { officialRole: role, userName: 'Authenticated Full Name', userId: 1, projectId };
  });
  t.mock.method(memberships, 'findActiveMembershipByProjectAndOfficialRole', async () => ({ userId: 2 }));
  t.mock.method(fileRepo, 'findActiveDocumentFile', async () => null);
  t.mock.method(fileRepo, 'insertWorkflowAttachment', async () => {});
  t.mock.method(repo, 'runInTransaction', (callback) => {
    const run = queue.then(async () => {
      const previous = structuredClone({ doc, records });
      try { return await callback({ transaction: true }); }
      catch (error) { doc = previous.doc; records = previous.records; throw error; }
    });
    queue = run.catch(() => {});
    return run;
  });
  t.mock.method(repo, 'updateDocumentWorkflowState', async (connection, values) => {
    assert.equal(connection.transaction, true);
    if (doc.status !== values.expectedState.workflowStatus || doc.activeRevisionId !== values.expectedState.activeRevisionId ||
      String(doc.currentAssigneeUserId) !== String(values.expectedState.currentAssigneeUserId) || doc.lifecycle !== 'Active') return 0;
    doc.status = values.workflowStatus; doc.revision = values.revisionLabel;
    doc.responsibleRole = values.responsibleRole; doc.currentAssigneeUserId = values.currentAssigneeUserId;
    doc.updatedAt = '2026-10-24T05:00:00.000Z';
    return 1;
  });
  t.mock.method(repo, 'updateRevisionLabel', async () => {});
  t.mock.method(repo, 'insertDocumentHistory', async (connection, value) => records.history.push(value));
  t.mock.method(repo, 'insertStoredFile', async () => {});
  t.mock.method(repo, 'insertWorkflowComment', async (connection, value) => {
    assert.equal(connection.transaction, true);
    assert.notEqual(doc.status, 'Process Review');
    attempts.push(value);
    if (failInsert) throw new Error('Comment INSERT failed');
    records.comments.push({ ...value, createdAt: '2026-10-24T05:00:00.123Z' });
  });
  t.mock.method(uploads, 'assertTemporaryUploadConsumable', async () => ({ originalFileName: 'Attachment.pdf', extension: 'pdf', storageKey: 'temporary/file', fileSize: 100, mimeType: 'application/pdf' }));
  t.mock.method(uploads, 'consumeTemporaryUploadMetadata', async () => 1);
  t.mock.method(storage, 'finalize', async () => {});
  t.mock.method(notifications, 'createDocumentNotificationsForOfficialRoles', async () => {});
  t.mock.method(audit, 'recordActivitySafely', async () => {});
  t.mock.method(sla, 'evaluateDocumentForSlaNotifications', async () => {});
  t.mock.method(realtime, 'publishCommentCreated', () => {});
  t.mock.method(realtime, 'publishWorkflowChanged', () => {});
  const original = structuredClone(doc);
  const args = { actorUserId: 1, actorUserFullName: 'Authenticated Full Name', actorOfficialRole: role, documentId: doc.id, type: 'approve',
    expectedState: { workflowStatus: doc.status, activeRevisionId: doc.activeRevisionId, currentAssigneeUserId: '9' } };
  return { args, original, attempts, get doc() { return doc; }, get records() { return records; },
    startNewReviewCycle() { doc = { ...original, activeRevisionId: 'REV-2' }; } };
};

for (const role of Object.keys(messages)) {
  test(`Approval A automatic comment, identity and retry protection: ${role}`, async (t) => {
    const f = fixture(t, { role });
    // Actor 1 differs from assignee 9: existing role-based authorization must remain unchanged.
    f.args.actorOfficialRole = role === 'Team Process' ? 'Team Project' : 'Team Process';
    const result = await approval.processApproval(f.args);
    assert.equal(result.status, role === 'Team Process' ? 'Project Review' : 'Approved');
    assert.equal(result.workflowComment, undefined); // Existing A response stays compatible.
    assert.equal(f.records.comments.length, 1);
    const comment = f.records.comments[0];
    assert.equal(comment.workflowAction, 'Approval A'); assert.equal(comment.workflowComment, messages[role]);
    assert.equal(comment.createdByNameSnapshot, 'Authenticated Full Name');
    assert.equal(comment.createdByOfficialRoleSnapshot, role);
    assert.equal(comment.createdByUserId, 1); assert.equal(comment.projectId, 'PRJ-1');
    assert.equal(comment.revisionId, 'REV-1');
    const notification = notifications.createDocumentNotificationsForOfficialRoles.mock.calls[0].arguments[0];
    assert.equal(notification.identityBasis, 'REV-1');
    assert.deepEqual(notification.officialRoles, role === 'Team Process' ? ['Team Project'] : ['Admin', 'Document Owner']);
    assert.equal(notifications.createDocumentNotificationsForOfficialRoles.mock.callCount(), 1);
    const activities = audit.recordActivitySafely.mock.calls.map((call) => call.arguments[0]);
    assert.equal(activities[0].identityKey, 'Approval A:PRJ-1:DOC-1:2026-10-24T05:00:00.000Z');
    assert.equal(activities.length, role === 'Team Process' ? 1 : 2);
    if (role === 'Team Project') assert.equal(activities[1].identityKey, 'Document Approved:PRJ-1:DOC-1:REV-1');
    assert.equal(realtime.publishCommentCreated.mock.callCount(), 1);
    await assert.rejects(approval.processApproval(f.args), { code: 'WORKFLOW_CONFLICT' });
    assert.equal(f.records.comments.length, 1);
    f.startNewReviewCycle();
    await approval.processApproval({ ...f.args, expectedState: { ...f.args.expectedState, activeRevisionId: 'REV-2' } });
    assert.equal(f.records.comments.length, 2);
    assert.notEqual(f.records.comments[0].id, f.records.comments[1].id);
  });
  test(`Concurrent Approval A inserts exactly one comment: ${role}`, async (t) => {
    const f = fixture(t, { role });
    const results = await Promise.allSettled([approval.processApproval(f.args), approval.processApproval(f.args)]);
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal(results.filter((result) => result.status === 'rejected' && result.reason.code === 'WORKFLOW_CONFLICT').length, 1);
    assert.equal(f.records.comments.length, 1); assert.equal(f.records.history.length, 1);
  });
  test(`Comment insert failure rolls back Approval A: ${role}`, async (t) => {
    const f = fixture(t, { role, failInsert: true });
    await assert.rejects(approval.processApproval(f.args), /INSERT failed/);
    assert.deepEqual(f.doc, f.original); assert.equal(f.records.comments.length, 0); assert.equal(f.records.history.length, 0);
    assert.equal(notifications.createDocumentNotificationsForOfficialRoles.mock.callCount(), 0);
    assert.equal(audit.recordActivitySafely.mock.callCount(), 0);
    assert.equal(realtime.publishCommentCreated.mock.callCount(), 0);
  });
}

for (const actorUserFullName of ['', '  ', null]) test(`Missing full name fails without partial approval: ${actorUserFullName}`, async (t) => {
  const f = fixture(t);
  await assert.rejects(approval.processApproval({ ...f.args, actorUserFullName }), { statusCode: 422 });
  assert.deepEqual(f.doc, f.original); assert.equal(f.records.comments.length, 0);
});

for (const role of ['Admin', 'Document Owner', 'Viewer', 'Team Project']) for (const type of ['approve', 'approveWithComment', 'reject']) test(`Wrong reviewer role is denied: ${role}, ${type}`, async (t) => {
  const f = fixture(t, { role, status: 'Process Review' });
  await assert.rejects(approval.processApproval({ ...f.args, type, comment: 'Manual B/C comment' }), { statusCode: 403 });
  assert.equal(f.records.comments.length, 0); assert.equal(repo.runInTransaction.mock.callCount(), 0);
});

test('Workflow comment INSERT retains database UTC time and existing read-receipt semantics', async (t) => {
  let capturedSql;
  let capturedParams;
  await repo.insertWorkflowComment({ execute: async (sql, params) => { capturedSql = sql; capturedParams = params; } }, {
    id: 'WFC-1', projectId: 'PRJ-1', documentId: 'DOC-1', revisionId: 'REV-1', workflowAction: 'Approval A',
    workflowComment: messages['Team Process'], createdByUserId: 1, createdByNameSnapshot: 'Full Name', createdByOfficialRoleSnapshot: 'Team Process',
  });
  assert.match(capturedSql, /UTC_TIMESTAMP\(3\)/);
  assert.equal(capturedParams[4], 'Approval A');
  assert.equal(capturedParams[7], 'Full Name');
  t.mock.method(pool, 'execute', async (sql, params) => {
    assert.match(sql, /INSERT IGNORE INTO comment_read_receipts/);
    assert.match(sql, /created_by_user_id <> \?/);
    assert.doesNotMatch(sql, /workflow_action/);
    assert.deepEqual(params, [2, 2, 'PRJ-1', 'DOC-1', 2]);
    return [{ affectedRows: 1 }];
  });
  assert.equal(await repo.markWorkflowCommentsReadForUser({ projectId: 'PRJ-1', documentId: 'DOC-1', userId: 2 }), 1);
});

test('Missing document-project membership rejects Approval A', async (t) => {
  const f = fixture(t, { noMembership: true });
  await assert.rejects(approval.processApproval(f.args), { statusCode: 403 });
  assert.equal(f.records.comments.length, 0);
});

test('Invalid workflow and stale state never insert a comment', async (t) => {
  const f = fixture(t, { status: 'Process Comment' });
  await assert.rejects(approval.processApproval(f.args), { statusCode: 422 });
  await assert.rejects(approval.processApproval({ ...f.args, expectedState: { ...f.args.expectedState, activeRevisionId: 'STALE' } }), { code: 'WORKFLOW_CONFLICT' });
  assert.equal(f.records.comments.length, 0);
});

for (const type of ['approveWithComment', 'reject']) for (const attachment of [false, true]) {
  test(`Approval B/C retains manual comment, attachment and identity: ${type}, attachment=${attachment}`, async (t) => {
    const f = fixture(t);
    const result = await approval.processApproval({ ...f.args, type, comment: 'Manual reviewer comment', temporaryFileId: attachment ? 'TMP-1' : null });
    const action = type === 'reject' ? 'Approval C' : 'Approval B';
    assert.equal(f.records.comments.length, 1);
    assert.equal(f.records.comments[0].workflowAction, action);
    assert.equal(f.records.comments[0].workflowComment, 'Manual reviewer comment');
    assert.equal(Boolean(result.workflowComment.attachment), attachment);
    assert.equal(fileRepo.insertWorkflowAttachment.mock.callCount(), Number(attachment));
    assert.equal(notifications.createDocumentNotificationsForOfficialRoles.mock.calls[0].arguments[0].identityBasis, result.workflowComment.id);
    assert.equal(audit.recordActivitySafely.mock.calls[0].arguments[0].identityKey, `${action}:PRJ-1:DOC-1:${result.workflowComment.id}`);
  });
}

test('Approval A keeps attachment prohibition', async (t) => {
  const f = fixture(t);
  await assert.rejects(approval.processApproval({ ...f.args, temporaryFileId: 'TMP-1' }), { statusCode: 422 });
  assert.equal(f.records.comments.length, 0);
});

test('HTTP Approval A ignores forged body identity; existing comments endpoint returns persistent snapshots', async (t) => {
  const f = fixture(t);
  t.mock.method(auth, 'getAuthenticatedUser', async () => ({ user: { id: 1, fullName: 'Authenticated Full Name', username: 'not-the-full-name' },
    officialRole: 'Team Process', permissions: [{ code: 'approval.a' }, { code: 'document-register.view' }] }));
  pool.execute.mock.mockImplementation(async (sql) => {
    assert.match(sql, /FROM workflow_comments/);
    return [f.records.comments.map((value) => ({ id: value.id, project_id: value.projectId, document_id: value.documentId, revision_id: value.revisionId,
      workflow_action: value.workflowAction, workflow_comment: value.workflowComment, created_by_user_id: value.createdByUserId,
      created_by_name_snapshot: value.createdByNameSnapshot, created_by_official_role_snapshot: value.createdByOfficialRoleSnapshot,
      workflow_comment_created_at_utc: '2026-10-24 05:00:00.123000' }))];
  });
  const app = express(); app.use(express.json(), cookieParser());
  app.use('/documents', require('../../src/routes/document.routes'));
  app.use((error, req, res, next) => res.status(error.statusCode || 500).json({ code: error.code }));
  const server = await new Promise((resolve) => { const running = app.listen(0, '127.0.0.1', () => resolve(running)); });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/documents/DOC-1`;
  const headers = { 'Content-Type': 'application/json', Cookie: `${AUTH_COOKIE_NAMES.ACCESS_TOKEN}=${generateAccessToken(1, 'test-session')}` };
  const response = await fetch(url + '/approve', { method: 'POST', headers, body: JSON.stringify({
    expectedActiveRevisionId: 'REV-1', expectedCurrentAssigneeUserId: '9', expectedWorkflowStatus: 'Process Review',
    fullName: 'Forged Name', officialRole: 'Admin', title: 'Fake title', comment: 'Fake automatic message',
  }) });
  assert.equal(response.status, 200);
  const commentsResponse = await fetch(url + '/comments', { headers });
  assert.equal(commentsResponse.status, 200);
  const body = await commentsResponse.json();
  assert.equal(body.data[0].workflowComment, messages['Team Process']);
  assert.equal(body.data[0].createdBy, 'Authenticated Full Name');
  assert.equal(body.data[0].createdByOfficialRole, 'Team Process');
  assert.equal(body.data[0].createdDate, '2026-10-24T05:00:00.123Z');
});
