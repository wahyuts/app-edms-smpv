const assert = require('node:assert/strict');
const test = require('node:test');
const { createLoader } = require('../helpers/approvalEmailLoader');
const provenance = require('../../src/repositories/storageNamespace.repository');
const { digest, namespace } = require('../../src/utils/storageNamespace');
const { buildCanonicalPhysicalFileName, buildRevisionStorageKey } = require('../../src/utils/storageKeyBuilder');
const { createRepository } = require('../../src/repositories/documentDelete.repository');
const { deriveFolderTargets } = require('../../src/utils/documentFolder');

const fixture = ({ role = 'Team Process', revision, failure = null } = {}) => {
  const ns = namespace({ version: 1, provider: 'local', root: 'D:/isolated-fixture', device: '1', inode: '2', birthtime: 3 });
  const document = { id: 'DOC-1', projectId: 'PRJ-1', projectCode: 'TEST', documentNumber: 'PFD-1', lifecycle: 'Active',
    status: role === 'Team Process' ? 'Process Review' : 'Project Review',
    revision: revision || (role === 'Team Process' ? 'IFR-Submitted' : 'IFA-Submitted'),
    activeRevisionId: 'REV-1', activeFileId: 'FILE-12345678', currentAssigneeUserId: 1 };
  const physicalFileName = buildCanonicalPhysicalFileName({ documentNumber: document.documentNumber,
    fileId: document.activeFileId, originalFileName: 'Revision.pdf', revisionLabel: document.revision, submittedAt: '2026-10-01T00:00:00Z' });
  const key = buildRevisionStorageKey({ documentNumber: document.documentNumber, projectCode: document.projectCode,
    physicalFileName, revisionLabel: document.revision });
  const file = { file_id: document.activeFileId, document_id: document.id, project_id: document.projectId,
    original_file_name: 'Revision.pdf', physical_file_name: physicalFileName, storage_key: key, relative_path: key,
    file_size: 7, checksum: digest('content'), uploaded_at: '2026-10-01T00:00:00Z' };
  const proof = { rootIdentity: 'native-root', identity: 'native-revision', sha256: file.checksum, size: 7 };
  const attachmentKey = 'projects/TEST/documents/PFD-1/attachments/process-comments/existing.pdf';
  const attachment = { ...file, file_id: 'ATTACHMENT', storage_key: attachmentKey, relative_path: attachmentKey };
  const bind = (f, p) => ({ file_id: f.file_id, namespace_id: ns.id, storage_key_snapshot: f.storage_key,
    evidence: JSON.stringify({ source: 'UPLOAD_ADAPTER_SNAPSHOT', version: 1, sha256: p.sha256, size: p.size, localIdentity: p }) });
  let committed = { document, files: [file, attachment], bindings: [bind(file, proof), bind(attachment, { ...proof, identity: 'native-attachment' })],
    revisions: [{ id: 'REV-1', file_id: file.file_id, document_id: document.id, project_id: document.projectId,
      revision_label: document.revision, storage_path_legacy: key, revision_sequence: 1 }], history: [] };
  const objects = new Map([[key, { exists: true, ...proof }], [attachmentKey, { exists: true, ...proof, identity: 'native-attachment' }]]);
  const before = structuredClone(committed), objectsBefore = structuredClone(objects), trace = [];
  let staged;
  let activeNamespace = ns;
  const connection = {
    async beginTransaction() { staged = structuredClone(committed); trace.push('begin'); },
    async commit() {
      for (const f of staged.files) {
        const b = staged.bindings.find((v) => v.file_id === f.file_id);
        assert.equal(b.storage_key_snapshot, f.storage_key);
        assert.deepEqual(JSON.parse(b.evidence).localIdentity, (({ exists, ...p }) => p)(objects.get(f.storage_key)));
      }
      committed = staged; staged = undefined; trace.push('commit');
    },
    async rollback() { staged = undefined; trace.push('rollback'); },
    release() { trace.push('release'); },
    async execute(sql, values) {
      assert.ok(staged);
      const s = sql.replace(/\s+/g, ' ').trim();
      if (s.startsWith('SELECT f.*')) {
        const f = staged.files.find((v) => v.file_id === values[0]);
        const b = staged.bindings.find((v) => v.file_id === values[0]);
        return [[{ ...f, ...b, descriptor: ns.encoded }]];
      }
      if (s.startsWith('UPDATE stored_file_namespace_bindings SET storage_key_snapshot=')) {
        if (failure === 'prepare') throw new Error('Binding preparation failed');
        const [destination, evidence, fileId, nsId, source] = values;
        const b = staged.bindings.find((v) => v.file_id === fileId);
        assert.equal(b.namespace_id, nsId); assert.equal(b.storage_key_snapshot, source);
        b.storage_key_snapshot = destination; b.evidence = evidence; trace.push('prepare'); return [{ affectedRows: 1 }];
      }
      if (s.startsWith('UPDATE stored_files')) {
        if (failure === 'metadata') throw new Error('Metadata update failed');
        const [name, storageKey, relative, fileId] = values;
        Object.assign(staged.files.find((v) => v.file_id === fileId), {
          physical_file_name: name, storage_key: storageKey, relative_path: relative });
        trace.push('metadata'); return [{ affectedRows: 1 }];
      }
      if (s.startsWith('UPDATE document_revisions SET storage_path_legacy')) {
        staged.revisions.find((v) => v.id === values[1]).storage_path_legacy = values[0]; return [{ affectedRows: 1 }];
      }
      if (s.startsWith('UPDATE stored_file_namespace_bindings SET evidence=')) {
        if (failure === 'binding') throw new Error('Provenance update failed');
        const [evidence, fileId, nsId, destination] = values;
        const b = staged.bindings.find((v) => v.file_id === fileId);
        assert.equal(b.namespace_id, nsId); assert.equal(b.storage_key_snapshot, destination);
        b.evidence = evidence; trace.push('complete'); return [{ affectedRows: 1 }];
      }
      assert.fail(`Unexpected fixture SQL: ${s}`);
    },
  };
  const storage = {
    async captureNamespace() { return activeNamespace; },
    async inspectOwnedExact(k, captured) {
      assert.equal(captured.id, ns.id); trace.push(`inspect:${k}`);
      const p = objects.get(k); assert.ok(p);
      if (k !== key && failure === 'inspection') throw new Error('Destination inspection failed');
      if (k !== key && failure === 'checksum') return { ...p, sha256: digest('wrong') };
      if (k !== key && failure === 'identity') return { ...p, identity: undefined };
      return { ...p };
    },
    async move(source, destination) {
      const compensating = staged === undefined;
      trace.push(compensating ? 'compensate' : 'move');
      if (!compensating && failure === 'move') throw new Error('Physical move failed');
      assert.ok(objects.has(source)); assert.ok(!objects.has(destination));
      objects.set(destination, objects.get(source)); objects.delete(source);
    },
  };
  const mocks = new Map([
    ['config/database.js', { pool: { async getConnection() { return connection; } } }],
    ['config/logger.js', { error() {} }],
    ['repositories/storageNamespace.repository.js', provenance],
    ['services/storage.service.js', storage],
    ['repositories/projectMembership.repository.js', {
      async findActiveMembershipByProjectAndUser() { return { officialRole: role }; },
      async findActiveMembershipByProjectAndOfficialRole() { return { userId: 2 }; },
    }],
    ['repositories/fileAccess.repository.js', { async findActiveDocumentFile() {
      const f = committed.files[0]; return { storedFile: { fileId: f.file_id, originalFileName: f.original_file_name,
        storageKey: f.storage_key, uploadedAt: f.uploaded_at } };
    } }],
  ]);
  const loader = createLoader(mocks), repo = loader.load('repositories/document.repository.js');
  repo.findDocumentRegisterById = async () => structuredClone(committed.document);
  repo.updateDocumentWorkflowState = async (c, v) => {
    assert.equal(c, connection);
    if (staged.document.status !== v.expectedState.workflowStatus) return 0;
    Object.assign(staged.document, { status: v.workflowStatus, revision: v.revisionLabel, currentAssigneeUserId: v.currentAssigneeUserId }); return 1;
  };
  repo.updateRevisionLabel = async (c, v) => { staged.revisions.find((r) => r.id === v.revisionId).revision_label = v.revisionLabel; };
  repo.insertDocumentHistory = async (c, v) => { if (failure === 'history') throw new Error('History insert failed'); staged.history.push({ ...v }); };
  const engine = loader.load('services/workflowEngine.service.js');
  const args = (action = 'Approval A') => ({ action, actorUserId: 1, actorUserFullName: 'Fixture Reviewer', document: structuredClone(committed.document),
    expectedState: { workflowStatus: committed.document.status, activeRevisionId: 'REV-1', currentAssigneeUserId: committed.document.currentAssigneeUserId } });
  return { engine, args, before, objectsBefore, objects, trace, ns, connection,
    get state() { return committed; },
    changeNamespace() { activeNamespace = namespace({ ...ns.descriptor, inode: 'different-root' }); },
    staleBinding() { committed.bindings[0].storage_key_snapshot = 'other/source.pdf'; },
    replaceSourceIdentity() { objects.get(key).identity = 'replaced-file'; },
  };
};

for (const scenario of [
  { role: 'Team Process', revision: 'IFR-Submitted', action: 'Approval A', target: 'IFA-Submitted' },
  { role: 'Team Project', revision: 'IFA-Submitted', action: 'Approval A', target: 'AS-Built' },
  { role: 'Team Process', revision: 'IFA-Submitted', action: 'Approval B', target: 'IFR-Submitted' },
  { role: 'Team Process', revision: 'IFA-Submitted', action: 'Approval C', target: 'IFR-Submitted' },
  { role: 'Team Project', revision: 'IFR-Submitted', action: 'Approval B', target: 'IFA-Submitted' },
  { role: 'Team Project', revision: 'IFR-Submitted', action: 'Approval C', target: 'IFA-Submitted' },
]) test(`${scenario.role} ${scenario.action}: ${scenario.revision} -> ${scenario.target}`, async () => {
  const f = fixture(scenario);
  const args = f.args(scenario.action);
  await f.engine.applyWorkflowTransition(args);
  const file = f.state.files[0], binding = f.state.bindings[0], proof = JSON.parse(binding.evidence);
  assert.ok(file.storage_key.includes(`/revisions/${scenario.target}/`));
  assert.equal(binding.storage_key_snapshot, file.storage_key); assert.equal(binding.namespace_id, f.ns.id);
  assert.equal(proof.localIdentity.identity, 'native-revision'); assert.equal(proof.localIdentity.rootIdentity, 'native-root');
  assert.equal(proof.sha256, f.before.files[0].checksum); assert.equal(proof.size, f.before.files[0].file_size);
  assert.equal(f.state.revisions.length, 1); assert.equal(f.state.revisions[0].id, 'REV-1');
  assert.equal(f.state.revisions[0].storage_path_legacy, file.storage_key);
  assert.equal(f.state.revisions[0].revision_label, scenario.target); assert.equal(f.state.revisions[0].revision_sequence, 1);
  assert.equal(f.state.history.length, 1); assert.equal(f.state.document.activeFileId, f.before.document.activeFileId);
  assert.deepEqual(f.state.files[1], f.before.files[1]); assert.deepEqual(f.state.bindings[1], f.before.bindings[1]);
  assert.equal(f.objects.size, f.objectsBefore.size); assert.ok(!f.objects.has(f.before.files[0].storage_key));
  assert.ok(f.trace.indexOf('prepare') < f.trace.indexOf('move'));
  assert.ok(f.trace.indexOf('move') < f.trace.indexOf('complete'));
  assert.ok(f.trace.indexOf('complete') < f.trace.indexOf('commit'));
  const state = structuredClone(f.state), traceLength = f.trace.length;
  await assert.rejects(f.engine.applyWorkflowTransition({ ...args, document: structuredClone(f.state.document) }), { code: 'WORKFLOW_CONFLICT' });
  assert.deepEqual(f.state, state); assert.equal(f.trace.length, traceLength);
});

for (const failure of ['prepare', 'metadata', 'move', 'inspection', 'binding', 'checksum', 'identity', 'history']) {
  test(`${failure} failure rolls back metadata/binding/history and compensates only acknowledged move`, async () => {
    const f = fixture({ failure });
    await assert.rejects(f.engine.applyWorkflowTransition(f.args()));
    assert.deepEqual(f.state, f.before); assert.deepEqual(f.objects, f.objectsBefore);
    assert.ok(!f.trace.includes('commit')); assert.ok(f.trace.includes('rollback'));
    assert.equal(f.trace.filter((x) => x === 'compensate').length,
      ['inspection', 'binding', 'checksum', 'identity', 'history'].includes(failure) ? 1 : 0);
  });
}

for (const change of ['changeNamespace', 'staleBinding', 'replaceSourceIdentity']) test(`${change} fails closed before physical move`, async () => {
  const f = fixture(); f[change]();
  const before = structuredClone(f.state);
  const objectsBefore = structuredClone(f.objects);
  await assert.rejects(f.engine.applyWorkflowTransition(f.args()));
  assert.deepEqual(f.state, before); assert.deepEqual(f.objects, objectsBefore);
  assert.ok(!f.trace.includes('move')); assert.ok(!f.trace.includes('commit'));
});

test('Same-stage approval performs no move or binding update', async () => {
  const f = fixture();
  await f.engine.applyWorkflowTransition(f.args('Approval B'));
  assert.deepEqual(f.state.files, f.before.files); assert.deepEqual(f.state.bindings, f.before.bindings);
  assert.deepEqual(f.objects, f.objectsBefore); assert.ok(!f.trace.includes('prepare')); assert.ok(!f.trace.includes('move'));
});

test('Permanent Delete inventory accepts moved revision evidence with unchanged safety rules', async () => {
  const f = fixture(); await f.engine.applyWorkflowTransition(f.args());
  const doc = f.state.document;
  const tables = {
    engineering_documents: [{ id: doc.id, project_id: doc.projectId, document_number: doc.documentNumber,
      active_revision_id: doc.activeRevisionId, active_file_id: doc.activeFileId }],
    document_revisions: f.state.revisions, stored_files: f.state.files,
    workflow_comments: [{ id: 'COMMENT', project_id: doc.projectId, document_id: doc.id, revision_id: 'REV-1' }],
    workflow_attachments: [{ attachment_id: 'ATTACHMENT-1', comment_id: 'COMMENT', project_id: doc.projectId,
      document_id: doc.id, file_id: 'ATTACHMENT' }],
    stored_file_namespace_bindings: f.state.bindings, storage_namespaces: [{ id: f.ns.id, descriptor: f.ns.encoded, provider: 'local' }],
    document_history: [], comment_read_receipts: [], document_sla_evaluations: [], notifications: [],
  };
  const c = { async execute(sql, values) {
    assert.match(sql.trim(), /^SELECT\b/i);
    if (sql.includes('information_schema.')) return [[]];
    if (sql.includes('FROM temporary_uploads')) return [[]];
    const table = sql.match(/FROM (\w+)/)[1];
    assert.ok(Object.hasOwn(tables, table), table);
    const column = sql.match(/WHERE (\w+)\s*(?:=|IN)/)?.[1];
    const rows = tables[table].filter((r) => !column || values.includes(r[column]));
    return [structuredClone(rows)];
  } };
  const inv = await createRepository({}).inventory(c, { project_id: doc.projectId, document_id: doc.id });
  assert.equal(inv.manifest.length, 2);
  const revision = inv.manifest.find((x) => x.fileIds.includes(doc.activeFileId));
  assert.equal(revision.key, f.state.files[0].storage_key);
  assert.deepEqual(revision.localIdentity, JSON.parse(f.state.bindings[0].evidence).localIdentity);
  assert.equal(deriveFolderTargets(inv).length, 1);
});

test('Existing storage move wrapper tracks both forward move and compensation with writer-required IO', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const vm = require('node:vm');
  const io = [], calls = [];
  const driver = { name: 'local', async move(source, destination) { calls.push([source, destination]); return { storageKey: destination }; } };
  const mocks = {
    '../config/logger': {}, '../config/storage': {}, '../constants/storage.constants': {},
    '../storage/storageDriver.factory': { createStorageDriver: () => driver },
    '../storage/storage.errors': {},
    './documentAdmission.service': { async trackIo(options, callback) { io.push(options); return callback(); } },
    '../validators/storage.validator': require('../../src/validators/storage.validator'),
  };
  const module = { exports: {} };
  new vm.Script(fs.readFileSync(path.resolve(__dirname, '../../src/services/storage.service.js'), 'utf8'))
    .runInNewContext({ module, exports: module.exports, require(key) { assert.ok(Object.hasOwn(mocks, key)); return mocks[key]; } });
  await module.exports.move('revisions/source.pdf', 'revisions/destination.pdf');
  await module.exports.move('revisions/destination.pdf', 'revisions/source.pdf');
  assert.deepEqual(calls, [['revisions/source.pdf', 'revisions/destination.pdf'], ['revisions/destination.pdf', 'revisions/source.pdf']]);
  assert.equal(io.length, 2);
  for (let i = 0; i < io.length; i += 1) {
    assert.equal(io[i].type, 'MOVE'); assert.equal(io[i].provider, 'local'); assert.equal(io[i].requiresWriter, true);
    assert.equal(io[i].sourceKey, calls[i][0]); assert.equal(io[i].destinationKey, calls[i][1]);
  }
});
