const assert = require('node:assert/strict');
const test = require('node:test');
const { createLoader } = require('../helpers/approvalEmailLoader');

const settle = () => new Promise((resolve) => setImmediate(resolve));
const fixture = (options = {}) => {
  const role = options.role || 'Team Process';
  let committed = {
    document: { id: 'DOC-1', projectId: 'PRJ-1', projectCode: '0001', projectName: 'Actual Project',
      documentNumber: 'PFD-1', lifecycle: 'Active', status: role === 'Team Project' ? 'Project Review' : 'Process Review',
      activeRevisionId: 'REV-1', activeFileId: 'FILE-1', revision: 'IFR-Submitted', currentAssigneeUserId: 9 },
    comments: [], history: [],
  };
  const before = structuredClone(committed);
  let staged;
  let applied = false;
  let tail = Promise.resolve();
  const trace = [];
  const sent = [];
  const logs = [];
  const rollbackError = new Error('Transaction failed');
  const pool = {
    async getConnection() {
      const previous = tail;
      let unlock;
      tail = new Promise((resolve) => { unlock = resolve; });
      await previous;
      return {
        async beginTransaction() { trace.push('BEGIN'); staged = structuredClone(committed); },
        async commit() {
          trace.push('COMMIT');
          if (options.commitFailure) throw rollbackError;
          committed = structuredClone(staged); staged = null; applied = true;
          if (options.commitUnknown) throw rollbackError;
          trace.push('COMMIT ACK');
        },
        async rollback() { trace.push('ROLLBACK'); staged = null; },
        release() { trace.push('RELEASE'); unlock(); },
      };
    },
    async execute(sql, values) {
      if (sql.includes('FROM workflow_comments')) {
        trace.push('READ event');
        assert.equal(applied, true);
        const event = committed.comments.find((item) => item.id === values[0]);
        assert.ok(event);
        return [[{ workflow_action: event.workflowAction, approval_timestamp_utc: '2026-10-28 03:40:00.123000' }]];
      }
      if (sql.includes('SELECT DISTINCT users.id')) {
        assert.deepEqual(Array.from(values), ['PRJ-1']);
        return [[{ user_id: 2, email: 'admin@example.test' }, { user_id: 3, email: 'owner@example.test' }]];
      }
      throw new Error('Unexpected SQL in isolated fixture');
    },
  };
  const mocks = new Map([
    ['config/database.js', { pool }],
    ['config/logger.js', { log: (...args) => logs.push(args), error: (...args) => logs.push(args) }],
    ['repositories/fileAccess.repository.js', {
      async findActiveDocumentFile() { return null; }, async insertWorkflowAttachment() { trace.push('ATTACHMENT'); },
    }],
    ['services/storage.service.js', { async finalize() { trace.push('FINALIZE'); }, async delete() { assert.fail('No storage compensation expected'); } }],
    ['services/upload.service.js', {
      async assertTemporaryUploadConsumable() { return { storageKey: 'temporary/test', originalFileName: 'Attachment.pdf', extension: 'pdf', mimeType: 'application/pdf', fileSize: 100 }; },
      async consumeTemporaryUploadMetadata() { trace.push('CONSUME'); return 1; }, async discardTemporaryUpload() {},
    }],
    ['services/notification.service.js', {
      NOTIFICATION_EVENT_TYPE: { APPROVAL_A_COMPLETED: 'Approval A Completed', APPROVAL_B_COMPLETED: 'Approval B Completed', APPROVAL_C_COMPLETED: 'Approval C Completed', DOCUMENT_APPROVED: 'Document Approved' },
      async createDocumentNotificationsForOfficialRoles() { trace.push('NOTIFICATION'); if (options.postFailure === 'notification') throw new Error('Notification failed'); },
    }],
    ['services/slaNotificationProducer.service.js', { async evaluateDocumentForSlaNotifications() { trace.push('SLA'); if (options.postFailure === 'sla') throw new Error('SLA failed'); } }],
    ['services/audit.service.js', { async recordActivitySafely() { trace.push('AUDIT'); } }],
    ['services/realtimeDocumentPublisher.service.js', { publishCommentCreated() { trace.push('REALTIME COMMENT'); }, publishWorkflowChanged() { trace.push('REALTIME WORKFLOW'); } }],
    ['services/email.service.js', { async sendApprovalNotification(value) {
      assert.equal(applied, true); trace.push('EMAIL'); sent.push(value);
      if (options.emailFailure) throw new Error('Provider failed');
      return options.heldProvider || { success: true };
    } }],
    ['services/document.service.js', {}], ['services/fileAccess.service.js', {}],
    ['services/revision.service.js', {}], ['services/workflowAttachment.service.js', {}],
  ]);
  const loader = createLoader(mocks);
  const repo = loader.load('repositories/document.repository.js');
  const membership = loader.load('repositories/projectMembership.repository.js');
  membership.findActiveMembershipByProjectAndUser = async () => options.denied ? null : { officialRole: role, userId: 1 };
  membership.findActiveMembershipByProjectAndOfficialRole = async () => ({ userId: 2 });
  repo.findDocumentRegisterById = async () => {
    if (applied && options.postFailure === 'reload') throw new Error('Reload failed');
    return structuredClone(committed.document);
  };
  repo.updateDocumentWorkflowState = async (connection, value) => {
    assert.ok(staged);
    if (staged.document.status !== value.expectedState.workflowStatus || staged.document.activeRevisionId !== value.expectedState.activeRevisionId) return 0;
    Object.assign(staged.document, { status: value.workflowStatus, revision: value.revisionLabel,
      currentAssigneeUserId: value.currentAssigneeUserId, updatedAt: '2026-10-28T03:40:00Z' });
    trace.push('UPDATE workflow'); return 1;
  };
  repo.updateRevisionLabel = async () => {};
  repo.insertDocumentHistory = async (connection, value) => { staged.history.push({ ...value }); trace.push('HISTORY'); };
  repo.insertWorkflowComment = async (connection, value) => {
    if (options.writeFailure) throw new Error('Comment insert failed');
    staged.comments.push({ ...value }); trace.push('COMMENT');
  };
  repo.insertStoredFile = async () => { trace.push('STORED ATTACHMENT'); };
  const service = loader.load('services/approval.service.js');
  if (options.dispatchThrows) loader.load('services/approvalEmailDispatcher.service.js').dispatch = () => { throw new Error('Dispatch failed'); };
  const args = { actorUserId: 1, actorUserFullName: 'Real Personal Name Must Not Be Emailed', actorOfficialRole: role === 'Team Process' ? 'Team Project' : 'Team Process',
    documentId: 'DOC-1', type: options.type || 'approve', comment: options.comment || '',
    expectedState: { workflowStatus: before.document.status, activeRevisionId: 'REV-1', currentAssigneeUserId: '9' } };
  return { loader, service, args, before, trace, sent, logs, get state() { return committed; },
    controller: () => loader.load('controllers/document.controller.js') };
};

for (const role of ['Team Process', 'Team Project']) for (const type of ['approve', 'approveWithComment', 'reject']) {
  test(`Actual approval path commits then emails: ${role} ${type}`, async () => {
    const f = fixture({ role, type, comment: type === 'approveWithComment' ? 'Required manual comment' : '' });
    const result = await f.service.processApproval(f.args);
    await settle();
    const status = type === 'approve' ? role === 'Team Process' ? 'Project Review' : 'Approved'
      : `${role === 'Team Process' ? 'Process' : 'Project'} ${type === 'reject' ? 'Reject' : 'Comment'}`;
    assert.equal(result.status, status);
    assert.equal(f.state.comments.length, 1); assert.equal(f.state.history.length, 1);
    assert.equal(f.sent.length, 2);
    for (const email of f.sent) {
      assert.ok(email.subject.endsWith(`By ${role}`));
      assert.ok(email.text.includes('28 Oktober 2026, 10:40 WIB'));
      assert.ok(!email.text.includes('Real Personal Name'));
      assert.ok(email.requestId.startsWith(`${f.state.comments[0].id}:`));
      assert.equal(email.text.includes('Comment:'), type === 'approveWithComment');
    }
    assert.ok(f.trace.indexOf('COMMIT ACK') < f.trace.indexOf('READ event'));
    assert.ok(f.trace.indexOf('COMMIT ACK') < f.trace.indexOf('EMAIL'));
    assert.equal(f.trace.filter((item) => item === 'SLA').length, 1);
    assert.equal(f.trace.filter((item) => item === 'NOTIFICATION').length, 1);
    assert.equal(f.trace.filter((item) => item === 'REALTIME WORKFLOW').length, 1);
    assert.equal(f.state.document.activeFileId, 'FILE-1');
  });
}
for (const options of [{ denied: true }, { writeFailure: true }, { commitFailure: true }, { commitUnknown: true }]) {
  test(`No email without confirmed COMMIT: ${JSON.stringify(options)}`, async () => {
    const f = fixture(options);
    await assert.rejects(f.service.processApproval(f.args));
    await settle();
    assert.equal(f.sent.length, 0); assert.ok(!f.trace.includes('READ event'));
    if (!options.commitUnknown) assert.deepEqual(f.state, f.before);
    else assert.equal(f.state.comments.length, 1);
  });
}
for (const postFailure of ['reload', 'notification', 'sla']) {
  test(`Dispatch independent of post-commit ${postFailure} failure`, async () => {
    const f = fixture({ postFailure });
    await assert.rejects(f.service.processApproval(f.args));
    await settle();
    assert.equal(f.state.comments.length, 1); assert.equal(f.sent.length, 2);
  });
}
for (const options of [{ emailFailure: true }, { dispatchThrows: true }]) {
  test(`Email/dispatch failure never fails committed approval: ${JSON.stringify(options)}`, async () => {
    const f = fixture(options);
    assert.equal((await f.service.processApproval(f.args)).status, 'Project Review');
    await settle();
    assert.equal(f.state.comments.length, 1); assert.equal(f.state.history.length, 1);
    assert.ok(!f.trace.includes('ROLLBACK'));
  });
}
test('HTTP controller response resolves while provider send remains pending', async () => {
  let resolveProvider;
  const heldProvider = new Promise((resolve) => { resolveProvider = resolve; });
  const f = fixture({ heldProvider });
  let responseBody;
  const response = { status(value) { assert.equal(value, 200); return this; }, json(value) { responseBody = value; return this; } };
  await f.controller().approveDocument({ body: {
    expectedWorkflowStatus: 'Process Review', expectedActiveRevisionId: 'REV-1', expectedCurrentAssigneeUserId: '9',
  }, params: { documentId: 'DOC-1' }, user: { id: 1, fullName: 'Authenticated Name' }, officialRole: 'Team Process' }, response, (error) => { throw error; });
  assert.equal(responseBody.success, true); assert.equal(responseBody.data.status, 'Project Review');
  await settle();
  assert.equal(f.sent.length, 2);
  resolveProvider({ success: true });
  await settle();
});
test('Validation failure (including required B comment) does not enter approval transaction', async () => {
  const f = fixture();
  for (const method of ['approveDocumentWithComment', 'approveDocument']) {
    let code;
    const body = method === 'approveDocumentWithComment' ? {
      expectedWorkflowStatus: 'Process Review', expectedActiveRevisionId: 'REV-1', expectedCurrentAssigneeUserId: '9',
    } : {};
    await f.controller()[method]({ body, params: { documentId: 'DOC-1' } }, {
      status(value) { code = value; return this; }, json() {},
    }, (error) => { throw error; });
    assert.equal(code, 422);
  }
  await settle();
  assert.equal(f.sent.length, 0); assert.ok(!f.trace.includes('BEGIN'));
});
test('Concurrent approvals dispatch only the winning committed event', async () => {
  const f = fixture();
  const results = await Promise.allSettled([f.service.processApproval(f.args), f.service.processApproval(f.args)]);
  await settle();
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
  assert.equal(f.state.comments.length, 1); assert.equal(f.sent.length, 2);
});
test('Approval B/C attachment processing remains in the existing transaction', async () => {
  for (const type of ['approveWithComment', 'reject']) {
    const f = fixture({ type, comment: 'Manual attachment comment' });
    const result = await f.service.processApproval({ ...f.args, temporaryFileId: 'TMP-1' });
    await settle();
    assert.ok(result.workflowComment.attachment);
    assert.ok(f.trace.indexOf('FINALIZE') < f.trace.indexOf('COMMIT ACK'));
    assert.equal(f.sent.length, 2);
    assert.ok(f.sent[0].text.includes('Comment: Manual attachment comment'));
  }
});
