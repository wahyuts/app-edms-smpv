const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const test = require('node:test');

// Pre-fix reproduction: passing assertions document unsafe existing behavior,
// not the acceptance criteria for a future commit-aware compensation fix.
const sourceRoot = path.resolve(__dirname, '../../src');
const sourceFiles = new Set([
  'repositories/document.repository.js',
  'services/document.service.js',
  'services/revision.service.js',
  'constants/document.constants.js',
  'constants/administration.constants.js',
  'constants/storage.constants.js',
  'utils/administration.js',
  'utils/storageKeyBuilder.js',
  'utils/storageMetadataCapacity.js',
  'utils/fileName.js',
]);

// Evaluate unchanged CommonJS source, but never delegate imports to runtime require.
// In particular, env/database/storage implementations and network APIs cannot load.
const isolatedLoader = (mocks) => {
  const cache = new Map();
  const loaded = [];
  const imports = [];
  const builtins = new Map([
    ['node:path', path],
    ['node:crypto', Object.freeze({ randomUUID })],
  ]);
  const load = (relativeFile) => {
    if (mocks.has(relativeFile)) return mocks.get(relativeFile);
    assert.ok(sourceFiles.has(relativeFile), `Blocked source import: ${relativeFile}`);
    if (cache.has(relativeFile)) return cache.get(relativeFile).exports;
    const filename = path.resolve(sourceRoot, relativeFile);
    const module = { exports: {} };
    cache.set(relativeFile, module);
    loaded.push(relativeFile);
    const requireIsolated = (request) => {
      imports.push(request);
      if (builtins.has(request)) return builtins.get(request);
      assert.ok(request.startsWith('.'), `Blocked external/builtin import: ${request}`);
      const resolved = path.resolve(path.dirname(filename), `${request}.js`);
      const dependency = path.relative(sourceRoot, resolved).split(path.sep).join('/');
      return load(dependency);
    };
    const script = new vm.Script(fs.readFileSync(filename, 'utf8'), { filename });
    script.runInNewContext({ module, exports: module.exports, require: requireIsolated, Date, Buffer });
    return module.exports;
  };
  return { load, loaded, imports };
};

const scenarios = [
  { id: 'A', name: 'normal commit', commit: 'success' },
  { id: 'B', name: 'pre-commit write failure', writeFailure: true },
  { id: 'C', name: 'REPRODUCED: commit applied then ACK lost', commit: 'ackLost' },
  { id: 'D', name: 'commit rejected before application', commit: 'notApplied' },
  { id: 'E1', name: 'pre-commit failure and rollback failure', writeFailure: true, rollbackFailure: true },
  { id: 'E2', name: 'REPRODUCED: ACK lost and rollback failure', commit: 'ackLost', rollbackFailure: true },
  { id: 'F1', name: 'post-commit reload failure', commit: 'success', postFailure: 'reload' },
  { id: 'F2', name: 'post-commit SLA side-effect failure', commit: 'success', postFailure: 'sla' },
];
const paths = ['initial', 'revision', 'admin-review', 'admin-comment'];

const createFixture = (kind, scenario) => {
  const trace = [];
  const errors = {
    write: Object.assign(new Error('Injected pre-commit write failure'), { code: 'TEST_WRITE' }),
    commit: Object.assign(new Error('Injected COMMIT failure'), { code: 'TEST_COMMIT' }),
    rollback: Object.assign(new Error('Injected ROLLBACK failure'), { code: 'TEST_ROLLBACK' }),
    post: Object.assign(new Error('Injected post-commit failure'), { code: 'TEST_POST' }),
  };
  const oldKey = 'projects/TEST/documents/TEST/revisions/IFR-Submitted/old.pdf';
  const tempKey = 'temporary/TEST-TEMP/input.pdf';
  const originalDocument = {
    id: 'DOC-TEST', projectId: 'PROJECT-TEST', projectCode: 'TEST', documentNumber: 'PFD-TEST',
    drawing: 'PFD', documentTypeId: 'TYPE-TEST', area: 'TEST', description: 'Before',
    daysUntilValidation: 5, lifecycle: 'Active',
    status: kind === 'admin-review' ? 'Process Review' : 'Process Comment',
    revision: 'IFR-Submitted', activeFileId: 'FILE-OLD', activeRevisionId: 'REV-OLD',
    currentAssigneeUserId: 'USER-ASSIGNEE', responsibleRole: 'Document Owner',
  };
  let committed = {
    document: kind === 'initial' ? null : structuredClone(originalDocument),
    files: kind === 'initial' ? [] : [{ fileId: 'FILE-OLD', storageKey: oldKey }],
    revisions: kind === 'initial' ? [] : [{ id: 'REV-OLD', fileId: 'FILE-OLD' }],
    history: [], temporaryAvailable: true,
  };
  const before = structuredClone(committed);
  let staged = null;
  let applied = false;
  let commitAck = 'not-called';
  const objects = new Set([tempKey, ...(kind === 'initial' ? [] : [oldKey])]);
  const deletions = [];
  const deletionStacks = [];
  let targetKey;
  let helperCalls = 0;
  const connection = {
    async beginTransaction() {
      trace.push('BEGIN');
      assert.equal(staged, null);
      staged = structuredClone(committed);
    },
    async commit() {
      trace.push('COMMIT requested');
      if (scenario.commit === 'notApplied') {
        commitAck = 'failed-before-application';
        trace.push('COMMIT not applied');
        throw errors.commit;
      }
      assert.ok(staged);
      committed = structuredClone(staged);
      staged = null;
      applied = true;
      trace.push('COMMIT applied');
      if (scenario.commit === 'ackLost') {
        commitAck = 'lost';
        trace.push('COMMIT ACK lost');
        throw errors.commit;
      }
      commitAck = 'success';
      trace.push('COMMIT ACK success');
    },
    async rollback() {
      trace.push('ROLLBACK attempted');
      if (scenario.rollbackFailure) {
        trace.push('ROLLBACK failed');
        throw errors.rollback;
      }
      // ROLLBACK never rewinds a transaction that has already committed.
      staged = null;
      trace.push(applied ? 'ROLLBACK no-op after commit' : 'ROLLBACK success');
    },
    release() { trace.push('RELEASE'); },
    execute() { throw new Error('Unexpected unmocked transaction SQL'); },
  };
  const stage = (currentConnection, label, operation) => {
    assert.equal(currentConnection, connection);
    assert.ok(staged, 'Business writes require an uncommitted transaction');
    trace.push(label);
    return operation(staged);
  };
  const sideEffect = (name) => async () => {
    trace.push(name);
    assert.equal(applied, true, `${name} must follow COMMIT application`);
    if (scenario.postFailure === 'sla' && name === 'SLA') throw errors.post;
  };
  const temporary = {
    temporaryFileId: 'TEMP-TEST', storageKey: tempKey, originalFileName: 'Drawing.pdf',
    extension: 'pdf', mimeType: 'application/pdf', fileSize: 100, checksum: 'synthetic-checksum',
  };
  const pool = {
    async getConnection() { helperCalls += 1; trace.push('GET CONNECTION'); return connection; },
    execute() { throw new Error('Unexpected unmocked pool SQL'); },
    query() { throw new Error('Unexpected unmocked pool query'); },
  };
  const mocks = new Map([
    ['config/database.js', { pool }],
    ['config/logger.js', { log() {}, error() {}, warn() {} }],
    ['repositories/project.repository.js', {
      async findProjectById() { return { id: 'PROJECT-TEST', projectCode: 'TEST', status: 'Active' }; },
    }],
    ['repositories/projectMembership.repository.js', {
      async findActiveMembershipByProjectAndUser() {
        return { officialRole: kind.startsWith('admin') ? 'Admin' : 'Document Owner', userId: 'USER-TEST' };
      },
      async findActiveMembershipByProjectAndOfficialRole() { return { userId: 'USER-NEXT' }; },
    }],
    ['services/storage.service.js', {
      async finalize(source, target) {
        trace.push('FINALIZE temporary -> permanent');
        assert.equal(source, tempKey);
        assert.ok(objects.has(source));
        assert.ok(!objects.has(target));
        targetKey = target;
        objects.add(target);
        objects.delete(source);
      },
      async delete(key) {
        trace.push('DELETE permanent target');
        assert.equal(key, targetKey);
        deletions.push(key);
        deletionStacks.push(new Error('Storage delete caller evidence').stack);
        return objects.delete(key);
      },
    }],
    ['services/upload.service.js', {
      async assertTemporaryUploadConsumable() { assert.ok(objects.has(tempKey)); return temporary; },
      async consumeTemporaryUploadMetadata(currentConnection) {
        return stage(currentConnection, 'CONSUME temporary metadata', (state) => {
          assert.equal(state.temporaryAvailable, true);
          state.temporaryAvailable = false;
          return 1;
        });
      },
      async discardTemporaryUpload() { throw new Error('Unexpected conflict cleanup in baseline scenarios'); },
    }],
    ['services/workflowEngine.service.js', {
      async resolveCurrentAssigneeForStatus() { return { userId: 'USER-NEXT' }; },
      getResponsibleRoleForStatus() { return 'Team Process'; },
    }],
    ['services/notification.service.js', {
      NOTIFICATION_EVENT_TYPE: { DOCUMENT_UPLOADED: 'Document Uploaded', REVISION_UPLOADED: 'Revision Uploaded' },
      createDocumentNotificationsForOfficialRoles: sideEffect('NOTIFICATION'),
    }],
    ['services/slaNotificationProducer.service.js', { evaluateDocumentForSlaNotifications: sideEffect('SLA') }],
    ['services/audit.service.js', { recordActivitySafely: sideEffect('AUDIT') }],
    ['services/realtimeDocumentPublisher.service.js', {
      publishDocumentCreated: sideEffect('REALTIME'), publishRevisionUploaded: sideEffect('REALTIME'),
      publishWorkflowChanged: sideEffect('REALTIME'), publishDocumentUpdated: sideEffect('REALTIME'),
    }],
  ]);
  const loader = isolatedLoader(mocks);
  const repo = loader.load('repositories/document.repository.js');
  const actualTransactionHelper = repo.runInTransaction;
  Object.assign(repo, {
    async findDocumentByProjectAndNumber() { return null; },
    async findDocumentTypeByDrawing() { return { id: 'TYPE-TEST' }; },
    async getNextRevisionSequence() { return 2; },
    async findDocumentRegisterById() {
      trace.push(applied ? 'RELOAD committed document' : 'READ existing document');
      if (applied && scenario.postFailure === 'reload') throw errors.post;
      return committed.document && structuredClone(committed.document);
    },
    async lockDocumentForEdit(currentConnection) {
      return stage(currentConnection, 'LOCK document', (state) => structuredClone(state.document));
    },
    async insertDocument(currentConnection, value) {
      stage(currentConnection, 'INSERT document', (state) => {
        state.document = { ...value, status: value.workflowStatus, lifecycle: value.lifecycleStatus };
      });
    },
    async updateDocumentWorkflowState(currentConnection, value) {
      return stage(currentConnection, 'UPDATE workflow', (state) => {
        Object.assign(state.document, {
          status: value.workflowStatus, revision: value.revisionLabel,
          currentAssigneeUserId: value.currentAssigneeUserId, responsibleRole: value.responsibleRole,
        });
        return 1;
      });
    },
    async updateDocumentMetadata(currentConnection, value) {
      stage(currentConnection, 'UPDATE metadata', (state) => Object.assign(state.document, value));
    },
    async deactivateDocumentRevisions(currentConnection) {
      stage(currentConnection, 'DEACTIVATE revisions', () => {});
    },
    async deactivateDocumentRevisionFiles(currentConnection) {
      stage(currentConnection, 'DEACTIVATE revision files', () => {});
    },
    async insertStoredFile(currentConnection, value) {
      stage(currentConnection, 'INSERT stored file', (state) => state.files.push({ ...value }));
    },
    async insertRevision(currentConnection, value) {
      stage(currentConnection, 'INSERT revision', (state) => state.revisions.push({ ...value }));
    },
    async updateDocumentActivePointers(currentConnection, value) {
      stage(currentConnection, 'UPDATE active pointers', (state) => Object.assign(state.document, value));
    },
    async insertDocumentHistory(currentConnection, value) {
      stage(currentConnection, 'INSERT history', (state) => {
        if (scenario.writeFailure) throw errors.write;
        state.history.push({ ...value });
      });
    },
  });
  assert.equal(repo.runInTransaction, actualTransactionHelper, 'Production transaction helper must not be replaced');
  const revisionService = loader.load('services/revision.service.js');
  const documentService = loader.load('services/document.service.js');
  const args = {
    activeProject: { id: 'PROJECT-TEST' }, actorUserId: 'USER-TEST', actorUserFullName: 'Synthetic Test User',
    actorOfficialRole: kind.startsWith('admin') ? 'Admin' : 'Document Owner', documentId: 'DOC-TEST',
    payload: {
      documentNumber: 'PFD-TEST', drawing: 'PFD', description: 'After', area: 'TEST', daysUntilValidation: 5,
      temporaryFileId: 'TEMP-TEST', expectedWorkflowStatus: originalDocument.status,
      expectedActiveRevisionId: originalDocument.activeRevisionId,
      expectedCurrentAssigneeUserId: originalDocument.currentAssigneeUserId,
    },
  };
  const invoke = () => kind === 'initial' ? documentService.createDocument(args)
    : kind === 'revision' ? revisionService.uploadRevision(args) : documentService.updateDocument(args);
  return {
    invoke, trace, errors, objects, deletions, deletionStacks, loader, before, oldKey, tempKey,
    get committed() { return committed; }, get staged() { return staged; },
    get applied() { return applied; }, get ack() { return commitAck; },
    get targetKey() { return targetKey; }, get helperCalls() { return helperCalls; },
  };
};

for (const kind of paths) {
  for (const scenario of scenarios) {
    test(`BASELINE ${kind} ${scenario.id}: ${scenario.name}`, async (t) => {
      const f = createFixture(kind, scenario);
      let result;
      let caught;
      try { result = await f.invoke(); } catch (error) { caught = error; }
      const commitCalled = !scenario.writeFailure;
      const committed = commitCalled && scenario.commit !== 'notApplied';
      const transactionError = scenario.writeFailure || scenario.commit !== 'success';
      const deletionExpected = transactionError && !scenario.writeFailure;
      const expectedError = scenario.rollbackFailure ? f.errors.rollback
        : scenario.writeFailure ? f.errors.write
          : scenario.commit !== 'success' ? f.errors.commit
            : scenario.postFailure ? f.errors.post : undefined;
      assert.equal(caught, expectedError, 'Check exact propagated error, not just rejection');
      assert.equal(f.helperCalls, 1);
      assert.equal(f.trace.filter((event) => event === 'BEGIN').length, 1);
      assert.equal(f.trace.filter((event) => event === 'COMMIT requested').length, Number(commitCalled));
      assert.equal(f.applied, committed);
      assert.equal(f.ack, !commitCalled ? 'not-called' : scenario.commit === 'ackLost' ? 'lost'
        : scenario.commit === 'notApplied' ? 'failed-before-application' : 'success');
      assert.equal(f.trace.filter((event) => event === 'ROLLBACK attempted').length, Number(transactionError));
      assert.equal(f.trace.filter((event) => event === 'RELEASE').length, 1);
      assert.equal(f.deletions.length, Number(deletionExpected));
      assert.equal(f.objects.has(f.tempKey), Boolean(scenario.writeFailure));
      if (kind !== 'initial') assert.ok(f.objects.has(f.oldKey), 'Historical object remains intact');
      if (committed) {
        const file = f.committed.files.find((item) => item.fileId === f.committed.document.activeFileId);
        const revision = f.committed.revisions.find((item) => item.id === f.committed.document.activeRevisionId);
        assert.ok(file && revision);
        assert.equal(revision.fileId, file.fileId);
        assert.equal(file.storageKey, f.targetKey);
        assert.equal(f.committed.history.length, 1);
        assert.equal(f.committed.temporaryAvailable, false);
        assert.equal(f.objects.has(file.storageKey), !deletionExpected);
        assert.equal(f.staged, null);
        if (!caught) assert.equal(result.activeFileId, file.fileId);
      } else {
        assert.deepEqual(f.committed, f.before, 'Committed DB must remain at original baseline');
        assert.equal(Boolean(f.staged), Boolean(scenario.rollbackFailure));
        if (f.targetKey) assert.equal(f.objects.has(f.targetKey), false);
      }
      if (scenario.writeFailure) {
        assert.equal(f.targetKey, undefined, 'This injection precedes storage finalization');
      } else {
        assert.ok(f.trace.indexOf('FINALIZE temporary -> permanent') < f.trace.indexOf('COMMIT requested'));
      }
      if (transactionError) {
        assert.ok(f.trace.indexOf('ROLLBACK attempted') > f.trace.indexOf('BEGIN'));
        assert.ok(!f.trace.includes('NOTIFICATION'));
        if (deletionExpected) {
          assert.deepEqual(f.deletions, [f.targetKey]);
          const serviceFile = kind === 'initial' ? 'document.service.js' : 'revision.service.js';
          assert.ok(f.deletionStacks[0].includes(path.join(sourceRoot, 'services', serviceFile)),
            'DELETE must originate in the unchanged production service, not transaction mocks');
          assert.ok(f.trace.indexOf('DELETE permanent target') > f.trace.indexOf('RELEASE'));
        }
      } else {
        assert.ok(f.trace.indexOf('RELOAD committed document') > f.trace.indexOf('COMMIT ACK success'));
        if (!scenario.postFailure) {
          for (const effect of ['NOTIFICATION', 'SLA', 'AUDIT', 'REALTIME']) {
            const expectedCount = effect === 'NOTIFICATION' && kind === 'admin-review' ? 0 : 1;
            assert.equal(f.trace.filter((event) => event === effect).length, expectedCount);
          }
        }
      }
      assert.ok(f.loader.loaded.includes('repositories/document.repository.js'));
      assert.ok(f.loader.loaded.includes('services/revision.service.js'));
      assert.ok(f.loader.loaded.includes('services/document.service.js'));
      assert.ok(f.loader.loaded.every((file) => sourceFiles.has(file)));
      assert.ok(!f.loader.imports.some((request) => /mysql2|aws-sdk|dotenv|server|scheduler/.test(request)));
      if (kind === 'admin-review') assert.ok(f.trace.includes('LOCK document'));
      if (kind === 'admin-comment' || kind === 'revision') assert.ok(f.trace.includes('UPDATE workflow'));
      if (scenario.commit === 'ackLost') {
        assert.ok(f.trace.indexOf('COMMIT applied') < f.trace.indexOf('COMMIT ACK lost'));
        assert.ok(f.trace.indexOf('COMMIT ACK lost') < f.trace.indexOf('ROLLBACK attempted'));
        assert.equal(f.objects.has(f.targetKey), false);
        t.diagnostic(`REPRODUCED ${kind}: DB_COMMITTED=true REFERENCED=true DELETE_ATTEMPTED=true OBJECT_REMOVED=true`);
        t.diagnostic(f.trace.join(' -> '));
      }
      if (scenario.id === 'D') {
        assert.equal(f.committed.temporaryAvailable, true);
        assert.equal(f.objects.has(f.tempKey), false, 'Rollback restored temp metadata, not physical source');
      }
      if (scenario.rollbackFailure) {
        assert.notEqual(caught, scenario.writeFailure ? f.errors.write : f.errors.commit);
        t.diagnostic(`${kind} ${scenario.id}: original error masked by TEST_ROLLBACK`);
      }
    });
  }
}

test('Isolation gate rejects runtime configuration, external clients and network modules', () => {
  const loader = isolatedLoader(new Map());
  for (const file of ['config/env.js', 'config/database.js', 'services/storage.service.js',
    'storage/drivers/r2Storage.driver.js', 'server.js', '../node_modules/mysql2/index.js',
    'node:net', 'node:http', 'node:https']) {
    assert.throws(() => loader.load(file), /Blocked source import/);
  }
  assert.deepEqual(loader.loaded, []);
});
