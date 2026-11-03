const assert = require('node:assert/strict');
const test = require('node:test');
const { fixture } = require('../helpers/isolatedDocumentCoordination.cjs');
const { pool } = require('../../src/config/database');
const { pool: evidencePool } = require('../../src/config/documentCoordinationDatabase');
const documents = require('../../src/repositories/document.repository');
const admission = require('../../src/services/documentAdmission.service');
const sla = require('../../src/repositories/sla.repository');
const notifications = require('../../src/repositories/notification.repository');
const audit = require('../../src/repositories/audit.repository');
const projects = require('../../src/repositories/project.repository');
const temporaryUploads = require('../../src/repositories/temporaryUpload.repository');
const uploads = require('../../src/services/upload.service');
const cleanup = require('../../src/services/temporaryUploadCleanup.service');
const storage = require('../../src/services/storage.service');
const documentService = require('../../src/services/document.service');
const memberships = require('../../src/repositories/projectMembership.repository');
const notificationService = require('../../src/services/notification.service');
const slaProducer = require('../../src/services/slaNotificationProducer.service');
const realtime = require('../../src/services/realtimeDocumentPublisher.service');

const scope = { projectId: 'P1', documentId: 'D1' };
const setup = (t, state = {}) => {
  const f = fixture(state);
  for (const target of [pool, evidencePool]) {
    t.mock.method(target, 'getConnection', f.pool.getConnection);
    t.mock.method(target, 'execute', f.pool.execute);
  }
  return f;
};
const denied = (error) => error.code === 'DOCUMENT_DELETION_IN_PROGRESS';
const reserve = (f) => f.repository.reserve({ id: 'DELETE-1', ...scope, documentNumber: 'PFD-1', userId: 1, requestIdentity: 'same' });

const mutations = [
  ['SLA', () => sla.upsertSlaEvaluation({ ...scope, evaluationId: 'SLA-1', cycleId: 'cycle', currentState: 'On Track' })],
  ['comment read receipt', () => documents.markWorkflowCommentsReadForUser({ ...scope, userId: 1 })],
  ['notification creation', () => notifications.createNotification({ id: 'N1', ...scope,
    identityKey: 'Test:P1:D1:N1', recipientUserId: 1, recipientProjectMembershipId: 'M1', eventType: 'Document Uploaded',
    title: 'Test', message: 'Test', priority: 'Normal', officialRole: 'Admin', recipientRole: 'Admin',
    relatedResourceType: 'Document', relatedResourceId: 'D1', relatedDocumentNumber: 'PFD-1', actionTarget: '/documents/D1', metadata: {} })],
  ['audit append', () => audit.insertAuditRecord({ id: 'A1', identityKey: 'Test:P1:D1:A1', projectId: 'P1',
    actorUserId: 1, actorName: 'Test Admin', department: '-', officialRole: 'Admin', action: 'View Document',
    businessEvent: 'Document Viewed', detail: 'Test', resourceType: 'Document', resourceId: 'D1', reference: 'PFD-1', metadata: {} })],
  ['notification read', () => notifications.markNotificationRead({ notificationId: 'N1', recipientUserId: 1 })],
  ['notification mark-all', () => notifications.markAllNotificationsRead({ projectId: 'P1', recipientUserId: 1 })],
  ['notification delete', () => notifications.deleteNotification({ notificationId: 'N1', recipientUserId: 1 })],
  ['notification bulk delete', () => notifications.deleteNotifications({ notificationIds: ['N1'], projectId: 'P1', recipientUserId: 1 })],
];
for (const [name, mutate] of mutations) test(`${name}: open gate writes; reservation prevents new SQL mutation`, async (t) => {
  const f = setup(t, { notificationRows: [{ id: 'N1', project_id: 'P1', related_resource_type: 'Document', related_resource_id: 'D1' }] });
  await mutate();
  const count = f.state.trace.filter((event) => event === 'OWNED MUTATION').length;
  assert.equal(count, 1);
  await reserve(f);
  await assert.rejects(mutate(), denied);
  assert.equal(f.state.trace.filter((event) => event === 'OWNED MUTATION').length, count);
});

test('admitted SQL lifecycle drains SLA/notification/audit after reservation', async (t) => {
  const f = setup(t);
  await admission.runWriter({ ...scope, type: 'EDIT_DOCUMENT' }, async () => {
    const op = await reserve(f);
    for (const [, mutate] of mutations.slice(0, 4)) await mutate();
    assert.equal((await f.repository.evaluateQuiescence(op.id)).status, 'QUIESCENCE_PENDING');
  });
  assert.equal((await f.repository.evaluateQuiescence('DELETE-1')).status, 'QUIESCENCE_CONFIRMED');
});

test('Project Close locks all target coordinators in order and aborts before any archive on conflict', async (t) => {
  const f = setup(t, { documentRows: [{ id: 'D2' }, { id: 'D1' }] });
  await reserve(f);
  await assert.rejects(projects.closeProject({ projectId: 'P1', userId: 1 }), denied);
  assert.equal(f.state.archived, undefined);
});
test('Project Close without reservation retains bulk archive and Closed result', async (t) => {
  const f = setup(t, { documentRows: [{ id: 'D2' }, { id: 'D1' }] });
  const result = await projects.closeProject({ projectId: 'P1', userId: 1 });
  assert.equal(result.autoArchivedDocumentCount, 2);
  assert.equal(result.project.status, 'Closed');
  assert.equal(f.state.archived, true);
});

test('bulk notification mutation rolls back the whole action if any selected document is reserved', async (t) => {
  const f = setup(t, { notificationRows: [
    { id: 'N2', project_id: 'P1', related_resource_type: 'Document', related_resource_id: 'D2' },
    { id: 'N1', project_id: 'P1', related_resource_type: 'Document', related_resource_id: 'D1' },
  ] });
  await reserve(f);
  await assert.rejects(notifications.markAllNotificationsRead({ projectId: 'P1', recipientUserId: 1 }), denied);
  assert.ok(!f.state.trace.includes('OWNED MUTATION'));
});

test('existing transaction helper COMMIT uncertainty leaves durable writer unresolved', async (t) => {
  const f = setup(t);
  await assert.rejects(admission.runWriter({ ...scope, type: 'UPLOAD_REVISION' }, () => documents.runInTransaction(async (c) => {
    c.failCommit = true;
  })));
  assert.equal([...f.state.writers.values()][0].db_outcome, 'UNKNOWN');
  assert.equal([...f.state.writers.values()][0].lifecycle_state, 'UNRESOLVED');
});

test('temporary consumption requires the matching admitted claim', async (t) => {
  setup(t);
  const connection = {};
  t.mock.method(temporaryUploads, 'deleteAvailableTemporaryUpload', async (c, { temporaryFileId }) => {
    assert.equal(c, connection); assert.equal(temporaryFileId, 'T1'); return 1;
  });
  await assert.rejects(uploads.consumeTemporaryUploadMetadata(connection, 'T1'), (e) => e.statusCode === 409);
  await admission.runWriter({ ...scope, type: 'UPLOAD_REVISION', temporaryFileId: 'T1' }, async () => {
    await assert.rejects(uploads.consumeTemporaryUploadMetadata(connection, 'OTHER'), (e) => e.statusCode === 409);
    assert.equal(await uploads.consumeTemporaryUploadMetadata(connection, 'T1'), 1);
  });
});

test('actual temporary cleanup respects the finalizer claim and tracks its later delete', async (t) => {
  const f = setup(t); let deletes = 0;
  const candidate = { id: 'TMP-1', temporaryFileId: 'T1', storageKey: 'temporary/T1/file' };
  t.mock.method(temporaryUploads, 'listExpiredUnconsumedTemporaryUploads', async () => [candidate]);
  t.mock.method(temporaryUploads, 'findExpiredTemporaryUploadById', async () => candidate);
  t.mock.method(temporaryUploads, 'deleteExpiredTemporaryUploadById', async () => 1);
  t.mock.method(storage, 'getActiveStorageDriver', () => ({ driver: 'r2' }));
  t.mock.method(storage, 'deleteTemporary', (sourceKey) => admission.trackIo({ provider: 'r2',
    type: 'DELETE_TEMPORARY', sourceKey }, async () => { deletes += 1; return true; }));
  let release;
  const done = new Promise((resolve) => { release = resolve; });
  let started;
  const entered = new Promise((resolve) => { started = resolve; });
  const writer = admission.runWriter({ ...scope, type: 'UPLOAD_REVISION', temporaryFileId: 'T1' }, async () => {
    started(); await done;
  });
  await entered;
  assert.equal((await cleanup.cleanupExpiredTemporaryUploads()).failed, 1);
  assert.equal(deletes, 0);
  release(); await writer;
  assert.equal((await cleanup.cleanupExpiredTemporaryUploads()).deletedObjects, 1);
  assert.equal(deletes, 1);
  assert.equal([...f.state.io.values()][0].state, 'SUCCEEDED');
});

test('temporary cleanup SQL uncertainty retains the claim after acknowledged storage delete', async (t) => {
  const f = setup(t);
  const candidate = { id: 'TMP-1', temporaryFileId: 'T1', storageKey: 'temporary/T1/file' };
  t.mock.method(temporaryUploads, 'listExpiredUnconsumedTemporaryUploads', async () => [candidate]);
  t.mock.method(temporaryUploads, 'findExpiredTemporaryUploadById', async () => candidate);
  t.mock.method(temporaryUploads, 'deleteExpiredTemporaryUploadById', async () => { throw new Error('DB connection lost'); });
  t.mock.method(storage, 'getActiveStorageDriver', () => ({ driver: 'r2' }));
  t.mock.method(storage, 'deleteTemporary', (sourceKey) => admission.trackIo({ provider: 'r2', type: 'DELETE_TEMPORARY', sourceKey }, async () => true));
  assert.equal((await cleanup.cleanupExpiredTemporaryUploads()).failed, 1);
  assert.equal([...f.state.writers.values()][0].lifecycle_state, 'UNRESOLVED');
});

test('actual Create Document retains the same writer through finalize, commit and post-commit processing', async (t) => {
  const f = setup(t); let document;
  t.mock.method(projects, 'findProjectById', async () => ({ id: 'P1', projectCode: 'TEST', status: 'Active' }));
  t.mock.method(documents, 'findDocumentByProjectAndNumber', async () => null);
  t.mock.method(documents, 'findDocumentTypeByDrawing', async () => ({ id: 'TYPE1' }));
  t.mock.method(memberships, 'findActiveMembershipByProjectAndOfficialRole', async () => ({ userId: 2 }));
  t.mock.method(uploads, 'assertTemporaryUploadConsumable', async () => ({ temporaryFileId: 'T1', storageKey: 'temporary/T1/file.pdf',
    originalFileName: 'file.pdf', extension: 'pdf', mimeType: 'application/pdf', fileSize: 100, checksum: null }));
  t.mock.method(temporaryUploads, 'deleteAvailableTemporaryUpload', async () => 1);
  t.mock.method(documents, 'insertDocument', async (connection, value) => {
    document = { ...value, status: value.workflowStatus, lifecycle: value.lifecycleStatus };
  });
  for (const method of ['insertStoredFile', 'insertRevision', 'updateDocumentActivePointers', 'insertDocumentHistory']) {
    t.mock.method(documents, method, async () => {});
  }
  t.mock.method(documents, 'completeStoredFileProvenance', async () => {
    assert.ok(admission.current().id);
    assert.notEqual(admission.current().dbOutcome, 'COMMITTED');
    assert.equal([...f.state.io.values()][0].state, 'SUCCEEDED');
  });
  t.mock.method(documents, 'findDocumentRegisterById', async () => document);
  t.mock.method(storage, 'finalize', (sourceKey, destinationKey) => admission.trackIo({
    type: 'FINALIZE', provider: 'r2', sourceKey, destinationKey,
  }, async () => {}));
  const ids = [];
  for (const [target, method] of [[notificationService, 'createDocumentNotificationsForOfficialRoles'],
    [slaProducer, 'evaluateDocumentForSlaNotifications']]) {
    t.mock.method(target, method, async () => {
      ids.push(admission.current().id);
      assert.equal(admission.current().dbOutcome, 'COMMITTED');
    });
  }
  t.mock.method(realtime, 'publishDocumentCreated', () => {});
  const created = await documentService.createDocument({ activeProject: { id: 'P1' }, actorUserId: 1,
    actorOfficialRole: 'Admin', actorUserFullName: 'Test Admin', payload: {
      documentNumber: 'PFD-TEST', drawing: 'PFD', area: 'CDU', description: 'Test', daysUntilValidation: 5, temporaryFileId: 'T1',
    } });
  const writer = [...f.state.writers.values()][0];
  assert.equal(created.status, 'Process Review');
  assert.ok(ids.every((id) => id === writer.id));
  assert.equal(writer.lifecycle_state, 'SETTLED');
  assert.equal(writer.db_outcome, 'COMMITTED');
  assert.equal([...f.state.io.values()][0].state, 'SUCCEEDED');
});

for (const action of ['archiveDocument', 'restoreDocument']) test(`actual ${action} retains lifecycle/history/audit without storage IO`, async (t) => {
  const f = setup(t);
  let document = { id: 'D1', projectId: 'P1', documentNumber: 'PFD-1', status: 'Approved', revision: 'AS-Built',
    lifecycle: action === 'archiveDocument' ? 'Active' : 'Archived' };
  t.mock.method(documents, 'findDocumentFoundationById', async () => document);
  t.mock.method(documents, 'findDocumentRegisterById', async () => document);
  t.mock.method(projects, 'findProjectById', async () => ({ id: 'P1', status: 'Active' }));
  t.mock.method(memberships, 'findActiveMembershipByProjectAndUser', async () => ({ officialRole: 'Admin' }));
  const history = [];
  t.mock.method(documents, 'updateDocumentLifecycleStatus', async (c, value) => { document = { ...document, lifecycle: value.lifecycleStatus }; });
  t.mock.method(documents, 'insertDocumentHistory', async (c, value) => history.push(value));
  t.mock.method(realtime, action === 'archiveDocument' ? 'publishDocumentArchived' : 'publishDocumentRestored', () => {});
  const result = await documentService[action]({ actorUserId: 1, documentId: 'D1', actorOfficialRole: 'Admin',
    actorUserFullName: 'Test Admin', payload: { reason: 'Test' } });
  assert.equal(result.status, 'Approved');
  assert.equal(result.lifecycle, action === 'archiveDocument' ? 'Archived' : 'Active');
  assert.equal(history.length, 1);
  assert.equal(f.state.io.size, 0);
  assert.equal([...f.state.writers.values()][0].lifecycle_state, 'SETTLED');
  assert.ok(f.state.trace.some((sql) => sql.includes('INSERT IGNORE INTO audit_trail')));
});
