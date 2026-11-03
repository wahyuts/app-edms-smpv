const assert = require('node:assert/strict');
const test = require('node:test');
const { createLoader } = require('../helpers/approvalEmailLoader');
const provenance = require('../../src/repositories/storageNamespace.repository');
const { digest, namespace } = require('../../src/utils/storageNamespace');

// Actual approval, workflow, transaction and provenance code; all external I/O is replaced.
const fixture = ({ role = 'Team Process', failure = null } = {}) => {
  const ns = namespace({ version: 1, provider: 'local', root: 'D:/fixture-only', device: '1', inode: '2', birthtime: 3 });
  const objects = new Map();
  const temporary = new Map();
  const trace = [];
  const sideEffects = [];
  let committed = {
    document: { id: 'DOC-1', projectId: 'PRJ-1', projectCode: 'TEST', documentNumber: 'PFD-1', lifecycle: 'Active',
      status: role === 'Team Process' ? 'Process Review' : 'Project Review',
      revision: role === 'Team Process' ? 'IFR-Submitted' : 'IFA-Submitted',
      activeRevisionId: 'REV-1', activeFileId: 'ORIGINAL-FILE', currentAssigneeUserId: 9 },
    files: [], bindings: [], attachments: [], comments: [], history: [],
  };
  const before = structuredClone(committed);
  let staged;
  const connection = {
    async beginTransaction() { assert.equal(staged, undefined); staged = structuredClone(committed); trace.push('begin'); },
    async commit() {
      assert.ok(staged);
      for (const file of staged.files) {
        const evidence = JSON.parse(staged.bindings.find((b) => b.file_id === file.file_id).evidence);
        assert.equal(evidence.localIdentity.identity, objects.get(file.storage_key).identity);
      }
      committed = staged; staged = undefined; trace.push('commit');
    },
    async rollback() { staged = undefined; trace.push('rollback'); },
    release() { trace.push('release'); },
    async execute(sql, values) {
      assert.ok(staged, 'Provenance SQL must use the open business transaction');
      const normalized = sql.replace(/\s+/g, ' ').trim();
      if (normalized.startsWith('INSERT INTO stored_files')) {
        const [file_id, project_id, document_id, original_file_name, physical_file_name, file_extension,
          mime_type, file_size, storage_key, relative_path, file_category, checksum] = values;
        staged.files.push({ file_id, project_id, document_id, original_file_name, physical_file_name,
          file_extension, mime_type, file_size, storage_key, relative_path, file_category, checksum });
        trace.push('file'); return [{ affectedRows: 1 }];
      }
      if (normalized.startsWith('SELECT TABLE_NAME')) return [[{}, {}]];
      if (normalized.startsWith('INSERT INTO storage_namespaces')) {
        assert.equal(values[0], ns.id); assert.equal(values[2], ns.encoded); return [{ affectedRows: 1 }];
      }
      if (normalized.startsWith('SELECT descriptor')) return [[{ descriptor: ns.encoded }]];
      if (normalized.startsWith('INSERT INTO stored_file_namespace_bindings')) {
        const [file_id, namespace_id, storage_key_snapshot, evidence] = values;
        staged.bindings.push({ file_id, namespace_id, storage_key_snapshot, evidence });
        trace.push('provisional'); return [{ affectedRows: 1 }];
      }
      if (normalized.startsWith('SELECT f.*')) {
        const file = staged.files.find((f) => f.file_id === values[0]);
        const binding = staged.bindings.find((b) => b.file_id === values[0]);
        assert.ok(file); assert.ok(binding);
        return [[{ ...file, ...binding, descriptor: ns.encoded }]];
      }
      if (normalized.startsWith('UPDATE stored_file_namespace_bindings SET evidence=')) {
        if (failure === 'binding') throw new Error('Binding write failed');
        const [evidence, fileId, namespaceId, key] = values;
        const binding = staged.bindings.find((b) => b.file_id === fileId);
        assert.equal(binding.namespace_id, namespaceId); assert.equal(binding.storage_key_snapshot, key);
        binding.evidence = evidence; trace.push('provenance'); return [{ affectedRows: 1 }];
      }
      assert.fail(`Unexpected SQL: ${normalized}`);
    },
  };
  const storage = {
    async captureNamespace() {
      return failure === 'namespace' && trace.includes('finalize')
        ? namespace({ ...ns.descriptor, inode: 'other-root' }) : ns;
    },
    async finalize(source, key) {
      assert.ok(staged); trace.push('finalize');
      if (failure === 'finalize') throw new Error('Finalize failed');
      const metadata = [...temporary.values()].find((f) => f.storageKey === source);
      assert.ok(metadata);
      objects.set(key, { exists: true, rootIdentity: 'native-root', identity: `native:${key}`,
        sha256: metadata.checksum, size: metadata.fileSize });
    },
    async inspectOwnedExact(key, captured) {
      assert.ok(staged); assert.equal(captured.id, ns.id); trace.push('inspect');
      const object = objects.get(key); assert.ok(object);
      if (failure === 'inspection') throw new Error('Inspection failed');
      if (failure === 'checksum') return { ...object, sha256: digest('wrong content') };
      if (failure === 'identity') return { ...object, identity: undefined };
      return { ...object };
    },
    async delete(key) {
      assert.equal(staged, undefined, 'Compensation must follow transaction rollback');
      trace.push('compensate'); objects.delete(key);
    },
  };
  const notify = async () => { assert.equal(staged, undefined); sideEffects.push('notification'); };
  const mocks = new Map([
    ['config/database.js', { pool: { async getConnection() { return connection; } } }],
    ['config/logger.js', { error() {}, log() {} }],
    ['repositories/storageNamespace.repository.js', provenance],
    ['repositories/fileAccess.repository.js', {
      async findActiveDocumentFile() { return null; },
      async insertWorkflowAttachment(c, record) {
        assert.equal(c, connection); assert.ok(staged); staged.attachments.push({ ...record });
      },
    }],
    ['repositories/projectMembership.repository.js', {
      async findActiveMembershipByProjectAndUser({ projectId, userId }) {
        assert.equal(projectId, 'PRJ-1'); assert.equal(userId, 1); return { officialRole: role };
      },
      async findActiveMembershipByProjectAndOfficialRole() { return { userId: 2 }; },
    }],
    ['services/storage.service.js', storage],
    ['services/upload.service.js', {
      async assertTemporaryUploadConsumable({ temporaryFileId }) { return temporary.get(temporaryFileId); },
      async consumeTemporaryUploadMetadata(c) { assert.equal(c, connection); assert.ok(staged); trace.push('consume'); return 1; },
    }],
    ['services/notification.service.js', { NOTIFICATION_EVENT_TYPE: {
      APPROVAL_A_COMPLETED: 'A', APPROVAL_B_COMPLETED: 'B', APPROVAL_C_COMPLETED: 'C', DOCUMENT_APPROVED: 'Approved',
    }, createDocumentNotificationsForOfficialRoles: notify }],
    ['services/slaNotificationProducer.service.js', { evaluateDocumentForSlaNotifications: notify }],
    ['services/audit.service.js', { recordActivitySafely: notify }],
    ['services/realtimeDocumentPublisher.service.js', { publishCommentCreated() { sideEffects.push('realtime'); }, publishWorkflowChanged() {} }],
    ['services/approvalEmailDispatcher.service.js', { async dispatch() { assert.equal(staged, undefined); sideEffects.push('email'); } }],
  ]);
  const loader = createLoader(mocks);
  const repo = loader.load('repositories/document.repository.js');
  repo.findDocumentRegisterById = async () => structuredClone(committed.document);
  repo.updateDocumentWorkflowState = async (c, value) => {
    assert.equal(c, connection); assert.ok(staged);
    if (staged.document.status !== value.expectedState.workflowStatus) return 0;
    Object.assign(staged.document, { status: value.workflowStatus, revision: value.revisionLabel,
      currentAssigneeUserId: value.currentAssigneeUserId }); return 1;
  };
  repo.updateRevisionLabel = async () => {};
  repo.insertDocumentHistory = async (c, value) => { assert.equal(c, connection); staged.history.push({ ...value }); };
  repo.insertWorkflowComment = async (c, value) => { assert.equal(c, connection); staged.comments.push({ ...value }); };
  const service = loader.load('services/approval.service.js');
  const args = (type, token) => {
    if (token) temporary.set(token, { storageKey: `temporary/${token}`, originalFileName: `${token}.pdf`,
      extension: 'pdf', mimeType: 'application/pdf', fileSize: 7, checksum: digest(token) });
    return { actorUserId: 1, actorUserFullName: 'Fixture Reviewer', actorOfficialRole: role, documentId: 'DOC-1',
      type, comment: 'Fixture manual comment', temporaryFileId: token || null,
      expectedState: { workflowStatus: committed.document.status, activeRevisionId: 'REV-1', currentAssigneeUserId: '9' } };
  };
  return { service, args, before, objects, trace, sideEffects, ns,
    get state() { return committed; },
    setFailure(value) { failure = value; },
    startNewReview() { Object.assign(committed.document, before.document); },
  };
};

const settle = () => new Promise((resolve) => setImmediate(resolve));
for (const role of ['Team Process', 'Team Project']) for (const type of ['approveWithComment', 'reject']) {
  test(`${role} ${type}: completes exact attachment provenance before commit`, async () => {
    const f = fixture({ role });
    const result = await f.service.processApproval(f.args(type, 'attachment'));
    await settle();
    assert.equal(result.status, `${role === 'Team Process' ? 'Process' : 'Project'} ${type === 'reject' ? 'Reject' : 'Comment'}`);
    assert.equal(f.state.files.length, 1); assert.equal(f.state.bindings.length, 1);
    const file = f.state.files[0], binding = f.state.bindings[0], evidence = JSON.parse(binding.evidence);
    assert.equal(result.workflowComment.attachment.fileId, file.file_id);
    assert.equal(f.state.attachments[0].fileId, file.file_id);
    assert.equal(binding.file_id, file.file_id); assert.equal(binding.namespace_id, f.ns.id);
    assert.equal(binding.storage_key_snapshot, file.storage_key);
    assert.ok(file.storage_key.includes(`/attachments/${role === 'Team Process' ? 'process' : 'project'}-comments/`));
    assert.deepEqual(evidence.localIdentity, { rootIdentity: 'native-root', identity: `native:${file.storage_key}`,
      sha256: file.checksum, size: file.file_size });
    assert.equal(evidence.sha256, file.checksum); assert.equal(evidence.size, file.file_size);
    assert.ok(f.trace.indexOf('finalize') < f.trace.indexOf('inspect'));
    assert.ok(f.trace.indexOf('inspect') < f.trace.indexOf('provenance'));
    assert.ok(f.trace.indexOf('provenance') < f.trace.indexOf('commit'));
    assert.ok(!f.trace.includes('rollback')); assert.ok(!f.trace.includes('compensate'));
    assert.equal(f.state.document.activeFileId, f.before.document.activeFileId);
    assert.equal(f.state.comments.length, 1); assert.equal(f.state.history.length, 1);
    assert.ok(f.sideEffects.includes('email')); assert.ok(f.sideEffects.includes('realtime'));
  });
  test(`${role} ${type}: no attachment retains existing behavior`, async () => {
    const f = fixture({ role });
    const result = await f.service.processApproval(f.args(type));
    assert.equal(result.workflowComment.attachment, null);
    assert.equal(f.state.files.length, 0); assert.equal(f.state.bindings.length, 0);
    assert.ok(f.trace.includes('commit')); assert.ok(!f.trace.includes('inspect'));
    assert.ok(!f.trace.includes('finalize')); assert.ok(!f.trace.includes('provenance'));
  });
  for (const failure of ['inspection', 'binding', 'finalize', 'checksum', 'identity', 'namespace']) {
    test(`${role} ${type}: ${failure} failure rolls back without partial approval`, async () => {
      const f = fixture({ role, failure });
      const rejection = { inspection: /Inspection failed/, binding: /Binding write failed/, finalize: /Finalize failed/,
        checksum: { code: 'FILE_CONTENT_MISMATCH' }, identity: { code: 'LOCAL_IDENTITY_REQUIRED' },
        namespace: { code: 'NAMESPACE_MISMATCH' } }[failure];
      await assert.rejects(f.service.processApproval(f.args(type, 'attachment')), rejection);
      await settle();
      assert.deepEqual(f.state, f.before); assert.equal(f.objects.size, 0);
      assert.equal(f.sideEffects.length, 0); assert.ok(f.trace.includes('rollback'));
      assert.ok(!f.trace.includes('commit')); assert.ok(f.trace.includes('release'));
      assert.equal(f.trace.filter((x) => x === 'compensate').length, failure === 'finalize' ? 0 : 1);
    });
  }
}

test('Multiple approval attachments retain distinct file/key/identity proof across valid review cycles', async () => {
  const f = fixture();
  await f.service.processApproval(f.args('approveWithComment', 'first'));
  const firstBinding = structuredClone(f.state.bindings[0]);
  f.startNewReview();
  await f.service.processApproval(f.args('reject', 'second'));
  assert.equal(f.state.files.length, 2); assert.equal(f.state.attachments.length, 2);
  assert.equal(f.objects.size, 2); assert.deepEqual(f.state.bindings[0], firstBinding);
  assert.notEqual(f.state.files[0].file_id, f.state.files[1].file_id);
  assert.notEqual(f.state.files[0].storage_key, f.state.files[1].storage_key);
  const identities = f.state.bindings.map((b) => JSON.parse(b.evidence).localIdentity.identity);
  assert.equal(new Set(identities).size, 2);
});

for (const failure of ['inspection', 'binding', 'finalize']) {
  test(`Second attachment ${failure} failure preserves previously committed attachment and proof`, async () => {
    const f = fixture();
    await f.service.processApproval(f.args('approveWithComment', 'first'));
    await settle();
    f.startNewReview();
    const beforeSecond = structuredClone(f.state);
    const objectsBefore = structuredClone(f.objects);
    const effectsBefore = [...f.sideEffects];
    f.setFailure(failure);
    await assert.rejects(f.service.processApproval(f.args('reject', 'second')));
    await settle();
    assert.deepEqual(f.state, beforeSecond);
    assert.deepEqual(f.objects, objectsBefore);
    assert.deepEqual(f.sideEffects, effectsBefore);
  });
}
