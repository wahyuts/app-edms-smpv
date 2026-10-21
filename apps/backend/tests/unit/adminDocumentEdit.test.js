const assert = require('node:assert/strict');
const test = require('node:test');
const express = require('express');
const cookieParser = require('cookie-parser');
const { pool } = require('../../src/config/database');
const repo = require('../../src/repositories/document.repository');
const memberships = require('../../src/repositories/projectMembership.repository');
const projects = require('../../src/repositories/project.repository');
const documents = require('../../src/services/document.service');
const revisions = require('../../src/services/revision.service');
const uploads = require('../../src/services/upload.service');
const storage = require('../../src/services/storage.service');
const notifications = require('../../src/services/notification.service');
const sla = require('../../src/services/slaNotificationProducer.service');
const audit = require('../../src/services/audit.service');
const realtime = require('../../src/services/realtimeDocumentPublisher.service');
const workflow = require('../../src/services/workflowEngine.service');
const auth = require('../../src/services/auth.service');
const { generateAccessToken } = require('../../src/utils/token');
const { AUTH_COOKIE_NAMES } = require('../../src/constants/auth.constants');
const { validateTemporaryFilePayload } = require('../../src/validators/document.validator');
const { DOCUMENT_WORKFLOW_STATUS: STATUS } = require('../../src/constants/document.constants');

const transitions = {
  'Process Comment': 'Process Review',
  'Process Reject': 'Process Review',
  'Project Comment': 'Project Review',
  'Project Reject': 'Project Review',
};
const labelFor = (status) => status === STATUS.APPROVED ? 'AS-Built' : status.startsWith('Project') ? 'IFA-Submitted' : 'IFR-Submitted';

const fixture = (t, options = {}) => {
  const status = options.status || STATUS.PROCESS_REVIEW;
  let doc = {
    id: 'DOC-1', projectId: 'PRJ-1', projectCode: 'TEST-1', documentNumber: 'PFD-TEST-1',
    lifecycle: 'Active', status, revision: labelFor(status), drawing: 'PFD', documentTypeId: 'TYPE-1',
    activeRevisionId: 'REV-OLD', activeFileId: 'FILE-OLD', currentAssigneeUserId: status === STATUS.APPROVED ? null : 7,
    responsibleRole: workflow.getResponsibleRoleForStatus(status), description: 'Original', area: 'CDU', daysUntilValidation: 5,
    slaStartedAt: '2026-10-01T00:00:00Z', slaStoppedAt: status === STATUS.APPROVED ? '2026-10-02T00:00:00Z' : null,
  };
  const original = structuredClone(doc);
  const records = { revisions: [], files: [], history: [] };
  const physicalFiles = new Set(['historical-file']);
  for (const method of ['execute', 'query', 'getConnection']) {
    t.mock.method(pool, method, async () => { throw new Error('Unexpected database access'); });
  }
  const role = options.role === undefined ? 'Admin' : options.role;
  t.mock.method(memberships, 'findActiveMembershipByProjectAndUser', async ({ projectId }) =>
    role && projectId === 'PRJ-1' ? { id: 'MEM-1', officialRole: role, userId: '1', projectId } : null);
  t.mock.method(projects, 'findProjectById', async () => ({ id: 'PRJ-1', status: options.projectStatus || 'Active' }));
  t.mock.method(repo, 'findDocumentRegisterById', async () => structuredClone(doc));
  t.mock.method(repo, 'findDocumentTypeByDrawing', async () => ({ id: 'TYPE-1' }));
  t.mock.method(repo, 'getNextRevisionSequence', async () => 2);
  t.mock.method(repo, 'lockDocumentForEdit', async () => ({ ...doc, ...options.lockedState }));
  t.mock.method(repo, 'runInTransaction', async (callback) => {
    const before = structuredClone({ doc, records });
    try {
      await callback({ transaction: true });
      if (options.commitFailure) throw new Error('commit failed');
    } catch (error) {
      doc = before.doc;
      Object.assign(records, before.records);
      throw error;
    }
  });
  t.mock.method(repo, 'updateDocumentWorkflowState', async (connection, values) => {
    assert.equal(connection.transaction, true);
    if (options.workflowConflict) return 0;
    Object.assign(doc, {
      status: values.workflowStatus, revision: values.revisionLabel,
      responsibleRole: values.responsibleRole, currentAssigneeUserId: values.currentAssigneeUserId,
    });
    if (values.resetSla) { doc.slaStartedAt = 'new-cycle'; doc.slaStoppedAt = null; }
    return 1;
  });
  t.mock.method(repo, 'updateDocumentMetadata', async (connection, values) => {
    assert.equal(connection.transaction, true);
    for (const field of ['area', 'description', 'drawing', 'documentTypeId', 'daysUntilValidation']) doc[field] = values[field];
  });
  for (const method of ['deactivateDocumentRevisions', 'deactivateDocumentRevisionFiles']) {
    t.mock.method(repo, method, async (connection) => assert.equal(connection.transaction, true));
  }
  for (const [method, key] of [['insertRevision', 'revisions'], ['insertStoredFile', 'files'], ['insertDocumentHistory', 'history']]) {
    t.mock.method(repo, method, async (connection, value) => {
      assert.equal(connection.transaction, true);
      if (options.historyFailure && key === 'history') throw new Error('history failed');
      records[key].push(value);
    });
  }
  t.mock.method(repo, 'updateDocumentActivePointers', async (connection, value) => {
    assert.equal(connection.transaction, true);
    doc.activeFileId = value.activeFileId;
    doc.activeRevisionId = value.activeRevisionId;
  });
  t.mock.method(uploads, 'assertTemporaryUploadConsumable', async ({ actorUserId, temporaryFileId }) => {
    assert.equal(actorUserId, '1'); assert.equal(temporaryFileId, 'TMP-1');
    if (options.invalidTemporary) throw Object.assign(new Error('Upload tidak valid.'), { statusCode: 422 });
    return { storageKey: 'temp-file', originalFileName: 'Original Drawing.pdf', extension: 'pdf', mimeType: 'application/pdf', fileSize: 100 };
  });
  t.mock.method(uploads, 'consumeTemporaryUploadMetadata', async () => options.consumed === undefined ? 1 : options.consumed);
  t.mock.method(uploads, 'discardTemporaryUpload', async () => {});
  t.mock.method(storage, 'finalize', async (source, destination) => {
    assert.equal(source, 'temp-file');
    if (options.storageFailure) throw new Error('storage failed');
    physicalFiles.add(destination);
  });
  t.mock.method(storage, 'delete', async (key) => physicalFiles.delete(key));
  t.mock.method(workflow, 'resolveCurrentAssigneeForStatus', async () => options.noAssignee ? null : { userId: 8 });
  t.mock.method(notifications, 'createDocumentNotificationsForOfficialRoles', async () => {});
  t.mock.method(sla, 'evaluateDocumentForSlaNotifications', async () => {});
  t.mock.method(audit, 'recordActivitySafely', async () => {});
  for (const method of ['publishDocumentUpdated', 'publishWorkflowChanged', 'publishRevisionUploaded']) {
    t.mock.method(realtime, method, () => {});
  }
  const args = {
    activeProject: { id: options.activeProjectId || 'PRJ-1' }, actorOfficialRole: 'Admin',
    actorUserId: '1', actorUserFullName: 'Admin Test', documentId: 'DOC-1',
    payload: {
      description: 'Updated', expectedWorkflowStatus: status,
      expectedActiveRevisionId: original.activeRevisionId,
      expectedCurrentAssigneeUserId: original.currentAssigneeUserId === null ? null : String(original.currentAssigneeUserId),
      ...(options.file ? { temporaryFileId: 'TMP-1' } : {}),
    },
  };
  return { args, records, original, physicalFiles, get doc() { return doc; } };
};

for (const status of Object.values(STATUS)) {
  for (const file of [false, true]) {
    test(`Admin Edit: ${status}, file=${file}`, async (t) => {
      const f = fixture(t, { status, file });
      const result = await documents.updateDocument(f.args);
      const transition = Boolean(transitions[status]);
      assert.equal(result.status, transitions[status] || status);
      assert.equal(result.description, 'Updated');
      assert.equal(f.records.revisions.length, Number(file));
      assert.equal(f.records.files.length, Number(file));
      assert.equal(f.records.history.length, 1);
      assert.equal(f.records.history[0].activity, file ? 'Upload Revision' : 'Edit Document');
      assert.equal(f.records.history[0].workflowStatus, result.status);
      assert.equal(f.records.history[0].revisionLabel, result.revision);
      assert.equal(repo.updateDocumentWorkflowState.mock.callCount(), Number(transition));
      assert.equal(workflow.resolveCurrentAssigneeForStatus.mock.callCount(), Number(transition));
      assert.equal(notifications.createDocumentNotificationsForOfficialRoles.mock.callCount(), Number(transition));
      assert.equal(sla.evaluateDocumentForSlaNotifications.mock.callCount(), Number(transition));
      assert.equal(result.slaStartedAt, transition ? 'new-cycle' : f.original.slaStartedAt);
      assert.equal(result.currentAssigneeUserId, transition ? 8 : f.original.currentAssigneeUserId);
      assert.equal(audit.recordActivitySafely.mock.callCount(), 1);
      const activity = audit.recordActivitySafely.mock.calls[0].arguments[0];
      assert.equal(activity.actorOfficialRole, 'Admin');
      assert.equal(activity.metadata.previousStatus, status);
      assert.equal(activity.metadata.nextStatus, result.status);
      assert.equal(realtime.publishDocumentUpdated.mock.callCount() + realtime.publishWorkflowChanged.mock.callCount() + realtime.publishRevisionUploaded.mock.callCount(), 1);
      assert.ok(f.physicalFiles.has('historical-file'));
      if (file) {
        assert.notEqual(result.activeFileId, f.original.activeFileId);
        assert.equal(f.records.revisions[0].revisionSequence, 2);
        assert.equal(f.records.revisions[0].sourceStatus, status);
        assert.equal(f.records.revisions[0].resultStatus, result.status);
        assert.equal(f.records.files[0].originalFileName, 'Original Drawing.pdf');
        assert.ok(f.physicalFiles.has(f.records.files[0].storageKey));
      } else {
        assert.equal(result.activeFileId, f.original.activeFileId);
        assert.equal(result.activeRevisionId, f.original.activeRevisionId);
        assert.equal(result.revision, f.original.revision);
        assert.equal(repo.getNextRevisionSequence.mock.callCount(), 0);
        assert.equal(repo.deactivateDocumentRevisions.mock.callCount(), 0);
        assert.equal(storage.finalize.mock.callCount(), 0);
        assert.equal(uploads.assertTemporaryUploadConsumable.mock.callCount(), 0);
      }
      if (!transition) assert.equal(result.slaStoppedAt, f.original.slaStoppedAt);
      if (status === STATUS.APPROVED && file) {
        assert.match(f.records.history[0].reason, /tanpa approval ulang/);
        assert.equal(audit.recordActivitySafely.mock.calls[0].arguments[0].metadata.approvalRepeated, false);
      }
      if (transition) {
        const workflowUpdate = repo.updateDocumentWorkflowState.mock.calls[0].arguments[1];
        assert.equal(workflowUpdate.resetSla, true);
        assert.equal(workflowUpdate.slaStoppedAtExpression, 'NULL');
        assert.equal(workflowUpdate.responsibleRole, workflow.getResponsibleRoleForStatus(result.status));
        assert.equal(workflow.resolveCurrentAssigneeForStatus.mock.calls[0].arguments[0].status, result.status);
        const notification = notifications.createDocumentNotificationsForOfficialRoles.mock.calls[0].arguments[0];
        assert.deepEqual(notification.officialRoles, [workflow.getResponsibleRoleForStatus(result.status)]);
        assert.equal(notification.eventType, file ? 'Revision Uploaded' : 'Document Updated');
      }
    });
  }
}

test('Admin Days for Review evaluation does not reset SLA on a preserving edit', async (t) => {
  const f = fixture(t, { file: true });
  f.args.payload.daysUntilValidation = 10;
  await documents.updateDocument(f.args);
  assert.equal(f.doc.daysUntilValidation, 10);
  assert.equal(f.doc.slaStartedAt, f.original.slaStartedAt);
  assert.equal(sla.evaluateDocumentForSlaNotifications.mock.calls[0].arguments[0].triggerSource, 'days_until_validation_update');
});

for (const status of Object.keys(revisions.uploadRevisionTransitionMatrix)) {
  test(`Document Owner retains required revision and original transition: ${status}`, async (t) => {
    const f = fixture(t, { role: 'Document Owner', file: true, status });
    await revisions.uploadRevision(f.args);
    assert.equal(f.doc.status, revisions.uploadRevisionTransitionMatrix[status]);
    assert.equal(f.records.revisions.length, 1);
    assert.equal(f.doc.slaStartedAt, 'new-cycle');
    assert.equal(validateTemporaryFilePayload({ ...f.args.payload, temporaryFileId: '' }).isValid, false);
  });
}

for (const status of Object.keys(transitions)) {
  test(`Document Owner metadata edit retains its existing status: ${status}`, async (t) => {
    const f = fixture(t, { role: 'Document Owner', status });
    await documents.updateDocument(f.args);
    assert.equal(f.doc.status, status);
    assert.equal(f.records.revisions.length, 0);
    assert.equal(repo.updateDocumentWorkflowState.mock.callCount(), 0);
  });
}

for (const role of ['Team Process', 'Team Project', 'Viewer', null]) {
  test(`Service rejects ${role || 'non-member'} even when actor claims Admin`, async (t) => {
    const f = fixture(t, { role, file: true });
    await assert.rejects(documents.updateDocument(f.args), { statusCode: 403 });
    await assert.rejects(revisions.uploadRevision(f.args), { statusCode: 403 });
    assert.equal(repo.runInTransaction.mock.callCount(), 0);
  });
}

for (const options of [
  { activeProjectId: 'PRJ-OTHER' }, { projectStatus: 'Inactive' },
  { status: 'Unknown' }, { lockedState: { activeRevisionId: 'REV-NEW' } },
  { lockedState: { lifecycle: 'Archived' } },
  { status: STATUS.APPROVED, lockedState: { currentAssigneeUserId: 'unexpected' } },
  { status: STATUS.PROCESS_COMMENT, noAssignee: true },
  { status: STATUS.PROJECT_COMMENT, workflowConflict: true },
  { file: true, invalidTemporary: true },
  { file: true, storageFailure: true }, { file: true, consumed: 0 }, { file: true, commitFailure: true },
  { status: STATUS.PROCESS_COMMENT, file: true, storageFailure: true },
  { status: STATUS.PROJECT_COMMENT, file: true, commitFailure: true },
  { status: STATUS.PROCESS_COMMENT, historyFailure: true },
  ...[STATUS.PROCESS_REJECT, STATUS.PROJECT_REJECT].flatMap((status) => [
    { status, noAssignee: true },
    { status, workflowConflict: true },
    { status, historyFailure: true },
    { status, file: true, storageFailure: true },
    { status, file: true, commitFailure: true },
    { status, commitFailure: true },
  ]),
]) {
  test(`Failed edit leaves document/history intact: ${JSON.stringify(options)}`, async (t) => {
    const f = fixture(t, options);
    await assert.rejects(documents.updateDocument(f.args));
    assert.deepEqual(f.doc, f.original);
    assert.deepEqual(f.records, { revisions: [], files: [], history: [] });
    assert.deepEqual([...f.physicalFiles], ['historical-file']);
    assert.equal(notifications.createDocumentNotificationsForOfficialRoles.mock.callCount(), 0);
    assert.equal(audit.recordActivitySafely.mock.callCount(), 0);
  });
}

test('Direct revision endpoint uses project membership, not the claimed actor role', async (t) => {
  const f = fixture(t, { role: 'Document Owner', file: true });
  await assert.rejects(revisions.uploadRevision(f.args), { statusCode: 422 });
  await assert.rejects(revisions.editDocumentAsAdmin(f.args), { statusCode: 403 });
  await assert.rejects(documents.updateDocument(f.args), { statusCode: 403 });
});

test('Concurrent stale revision triggers conflict and discards only the temporary upload', async (t) => {
  const f = fixture(t, { file: true });
  f.args.payload.expectedActiveRevisionId = 'REV-STALE';
  await assert.rejects(documents.updateDocument(f.args), { code: 'REVISION_CONFLICT' });
  assert.equal(uploads.discardTemporaryUpload.mock.callCount(), 1);
  assert.equal(storage.delete.mock.callCount(), 0);
  assert.equal(repo.runInTransaction.mock.callCount(), 0);
});

for (const status of Object.keys(transitions)) {
  test(`HTTP API: real authentication, permissions and Admin isolation for ${status}`, async (t) => {
    const f = fixture(t, { status });
    const targetStatus = transitions[status];
    let role = 'Admin';
    let activeProjectId = 'PRJ-1';
    t.mock.method(auth, 'getAuthenticatedUser', async () => ({
      user: { id: '1', fullName: 'Admin Test' }, officialRole: role, activeProject: { id: activeProjectId },
      permissions: [{ code: role === 'Admin' || role === 'Document Owner' ? 'document-register.edit' : 'document-register.view' }],
    }));
    memberships.findActiveMembershipByProjectAndUser.mock.mockImplementation(async () => ({ officialRole: role }));
    const app = express();
    app.use(express.json(), cookieParser());
    app.use('/documents', require('../../src/routes/document.routes'));
    app.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
      res.status(error.statusCode || 500).json({ message: error.message });
    });
    const server = await new Promise((resolve) => { const running = app.listen(0, '127.0.0.1', () => resolve(running)); });
    t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
    const url = `http://127.0.0.1:${server.address().port}/documents/DOC-1`;
    const request = (payload, path = '', method = 'PATCH') => fetch(url + path, {
      method, headers: { 'Content-Type': 'application/json', Cookie: `${AUTH_COOKIE_NAMES.ACCESS_TOKEN}=${generateAccessToken('1', 'test-session')}` },
      body: JSON.stringify(payload),
    });
    for (role of ['Team Process', 'Team Project', 'Viewer']) {
      assert.equal((await request({ ...f.args.payload, isAdmin: true })).status, 403);
    }
    role = 'Document Owner';
    assert.equal((await request({ ...f.args.payload, temporaryFileId: 'TMP-1', officialRole: 'Admin' })).status, 403);
    assert.equal((await request(f.args.payload, '/revisions', 'POST')).status, 422);
    role = 'Admin'; activeProjectId = 'PRJ-OTHER';
    assert.equal((await request(f.args.payload)).status, 403);
    activeProjectId = 'PRJ-1';
    const response = await request(f.args.payload);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.status, targetStatus);
    assert.equal(f.records.revisions.length, 0);
    const filePayload = { ...f.args.payload, expectedWorkflowStatus: f.doc.status, expectedCurrentAssigneeUserId: f.doc.currentAssigneeUserId, temporaryFileId: 'TMP-1' };
    const uploadResponse = await request(filePayload);
    assert.equal(uploadResponse.status, 200);
    assert.equal((await uploadResponse.json()).data.status, targetStatus);
    assert.equal(f.records.revisions.length, 1);
    const revisionResponse = await request({ ...filePayload, expectedActiveRevisionId: f.doc.activeRevisionId }, '/revisions', 'POST');
    assert.equal(revisionResponse.status, 201);
    assert.equal((await revisionResponse.json()).data.status, targetStatus);
    assert.equal(f.records.revisions.length, 2);
  });
}
