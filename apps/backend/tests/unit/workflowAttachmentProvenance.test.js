const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { digest, namespace } = require('../../src/utils/storageNamespace');
const { bindNewFile, completeNewFile } = require('../../src/repositories/storageNamespace.repository');

for (const failure of [null, 'inspection', 'binding', 'capture']) test(`actual attachment upload provenance: ${failure || 'success'}`, async () => {
  const ns = namespace({ version: 1, provider: 'local', root: 'D:/synthetic', device: '1', inode: '2', birthtime: 3 });
  const state = { file: null, binding: null, attachment: false }; const trace = []; const objects = new Set();
  const storage = {
    captureNamespace: async () => { if (failure === 'capture') throw new Error('capture failed'); return ns; },
    finalize: async (source, key) => { objects.add(key); trace.push('finalize'); },
    delete: async (key) => { objects.delete(key); trace.push('compensate'); },
    inspectOwnedExact: async (key) => {
      trace.push('inspect'); assert.ok(objects.has(key));
      if (failure === 'inspection') throw new Error('inspection failed');
      return { exists: true, sha256: digest('fixture'), size: 7, identity: 'native-file', rootIdentity: 'native-root' };
    },
  };
  const connection = { execute: async (sql, args) => {
    if (sql.startsWith('SELECT TABLE_NAME')) return [[{}, {}]];
    if (sql.startsWith('SELECT descriptor')) return [[{ descriptor: ns.encoded }]];
    if (sql.startsWith('INSERT INTO storage_namespaces')) return [{ affectedRows: 1 }];
    if (sql.startsWith('INSERT INTO stored_file_namespace_bindings')) {
      state.binding = { namespace_id: args[1], storage_key_snapshot: args[2], evidence: args[3] };
      return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('SELECT f.')) return [[{ ...state.file, ...state.binding, descriptor: ns.encoded }]];
    if (sql.startsWith('UPDATE stored_file_namespace_bindings')) {
      if (failure === 'binding') throw new Error('binding failed');
      state.binding.evidence = args[0]; trace.push('complete'); return [{ affectedRows: 1 }];
    }
    throw new Error('Unexpected SQL');
  } };
  const documents = {
    runInTransaction: async (callback) => {
      const before = structuredClone(state);
      try { await callback(connection); trace.push('commit'); }
      catch (error) { Object.assign(state, before); trace.push('rollback'); throw error; }
    },
    insertStoredFile: async (c, value) => {
      state.file = { file_id: value.fileId, storage_key: value.storageKey, file_size: value.fileSize, checksum: value.checksum };
      await bindNewFile(c, value.fileId, value.storageKey, await storage.captureNamespace());
    },
    completeStoredFileProvenance: (c, id) => completeNewFile(c, id, storage),
  };
  const mocks = {
    '../config/logger': { error() {} }, '../repositories/document.repository': documents,
    '../repositories/fileAccess.repository': {
      findActiveDocumentFile: async () => ({ document: { documentId: 'DOCUMENT', projectId: 'PROJECT', projectCode: 'TEST',
        documentNumber: 'PFD-TEST', workflowStatus: 'Process Comment' } }),
      findWorkflowCommentById: async () => ({ projectId: 'PROJECT' }),
      insertWorkflowAttachment: async () => { state.attachment = true; },
      findWorkflowAttachmentById: async () => ({ attachmentId: 'ATTACHMENT' }),
    },
    './audit.service': { recordActivitySafely: async () => { trace.push('audit'); } },
    './storage.service': storage, './fileAccess.service': { assertProjectAccess: async () => {} },
    './upload.service': { assertTemporaryUploadConsumable: async () => ({ originalFileName: 'fixture.pdf', extension: 'pdf',
      mimeType: 'application/pdf', fileSize: 7, checksum: digest('fixture'), storageKey: 'temporary/test.pdf' }),
    consumeTemporaryUploadMetadata: async () => 1 },
    './documentAdmission.service': { documentWriter: (handler) => handler },
  };
  const safe = {
    '../constants/document.constants': require('../../src/constants/document.constants'),
    '../utils/administration': require('../../src/utils/administration'),
    '../utils/storageKeyBuilder': require('../../src/utils/storageKeyBuilder'),
    '../utils/storageMetadataCapacity': require('../../src/utils/storageMetadataCapacity'),
  };
  const module = { exports: {} };
  new vm.Script(fs.readFileSync(path.resolve(__dirname, '../../src/services/workflowAttachment.service.js'), 'utf8'))
    .runInNewContext({ module, exports: module.exports, require: (key) => {
      assert.ok(Object.hasOwn(mocks, key) || Object.hasOwn(safe, key), key); return mocks[key] || safe[key];
    } });
  const invoke = () => module.exports.uploadWorkflowAttachment({ actorUserId: 1, documentId: 'DOCUMENT', payload: { commentId: 'COMMENT', temporaryFileId: 'TEMP' } });
  if (failure) {
    await assert.rejects(invoke(), new RegExp(`${failure} failed`));
    assert.equal(state.file, null); assert.equal(state.binding, null); assert.equal(state.attachment, false);
    assert.equal(objects.size, 0); assert.ok(!trace.includes('commit')); assert.ok(!trace.includes('audit'));
    assert.equal(trace.includes('compensate'), failure !== 'capture');
  } else {
    await invoke(); assert.equal(JSON.parse(state.binding.evidence).localIdentity.identity, 'native-file');
    assert.ok(trace.indexOf('finalize') < trace.indexOf('inspect'));
    assert.ok(trace.indexOf('complete') < trace.indexOf('commit'));
    assert.ok(trace.indexOf('audit') > trace.indexOf('commit'));
  }
});
