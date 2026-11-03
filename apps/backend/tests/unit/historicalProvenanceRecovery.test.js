const test = require('node:test');
const assert = require('node:assert/strict');
const { SCOPES, createRecovery, reportDigest } = require('../../src/services/historicalProvenanceRecovery.service');
const { digest, namespace } = require('../../src/utils/storageNamespace');
const { validateScopeArguments, assertReportLocation } = require('../../scripts/recover-historical-provenance.cjs');

const fixture = () => {
  const ns = namespace({ version: 1, provider: 'local', root: 'D:/fixture', device: '1', inode: '2', birthtime: 3 });
  const target = { environment: 'development', name: 'isolated-fixture' };
  const physical = new Map(), trace = [], flags = {};
  const t = { document_delete_operations: [], document_admission_coordinators: [], projects: [], engineering_documents: [],
    stored_files: [], stored_file_namespace_bindings: [], storage_namespaces: [{ id: ns.id, provider: 'local', descriptor: ns.encoded }],
    document_revisions: [], workflow_comments: [], workflow_attachments: [], document_writer_operations: [], document_storage_io_steps: [],
    document_delete_executions: [], document_delete_file_manifest: [], document_delete_attempts: [], audit_trail: [],
    document_history: [], comment_read_receipts: [], document_sla_evaluations: [], notifications: [] };
  for (const [index, s] of SCOPES.entries()) {
    t.document_delete_operations.push({ id: s.operationId, project_id: s.projectId, document_id: s.documentId,
      document_number_snapshot: s.documentNumber, status: 'QUIESCENCE_CONFIRMED' });
    t.document_admission_coordinators.push({ project_id: s.projectId, document_id: s.documentId, gate_state: 'CLOSED', delete_operation_id: s.operationId });
    if (!t.projects.length) t.projects.push({ id: s.projectId, project_code: s.projectCode, status: 'Active' });
    const specs = [...s.files];
    if (!specs.some((f) => f.kind === 'revision-move')) specs.push({ fileId: 'FILE-BASE', kind: 'base',
      key: `projects/${s.projectCode}/documents/${s.documentNumber}/revisions/IFR-Submitted/base.pdf` });
    const rev = specs.find((f) => f.kind !== 'attachment');
    t.engineering_documents.push({ id: s.documentId, project_id: s.projectId, document_number: s.documentNumber,
      workflow_status: s.status, lifecycle_status: 'Active', active_file_id: rev.fileId, active_revision_id: `REV-${index}` });
    const writer = { id: `WRITER-${index}`, project_id: s.projectId, document_id: s.documentId, lifecycle_state: 'SETTLED', db_outcome: 'COMMITTED',
      completion_evidence: JSON.stringify({ scopeClosed: true, unresolvedIo: 0, uncertain: false }) };
    t.document_writer_operations.push(writer);
    for (const spec of specs) {
      const checksum = digest(spec.fileId), identity = `native:${spec.fileId}`;
      const proof = { rootIdentity: 'native-root', identity, sha256: checksum, size: 7 };
      physical.set(spec.key, { exists: true, ...proof });
      t.stored_files.push({ file_id: spec.fileId, project_id: s.projectId, document_id: s.documentId,
        storage_key: spec.key, relative_path: spec.key, checksum, file_size: 7 });
      t.stored_file_namespace_bindings.push({ file_id: spec.fileId, namespace_id: ns.id, storage_key_snapshot: spec.sourceKey || spec.key,
        evidence: JSON.stringify({ source: 'UPLOAD_ADAPTER_SNAPSHOT', version: 1,
          ...(spec.kind === 'attachment' ? {} : { sha256: checksum, size: 7, localIdentity: proof }) }) });
      if (spec.kind === 'attachment') {
        t.workflow_comments.push({ id: `COMMENT-${spec.fileId}`, project_id: s.projectId, document_id: s.documentId,
          revision_id: `REV-${index}`, workflow_action: 'Approval C', created_by_official_role_snapshot: spec.role });
        t.workflow_attachments.push({ attachment_id: `ATT-${index}`, comment_id: `COMMENT-${spec.fileId}`,
          file_id: spec.fileId, project_id: s.projectId, document_id: s.documentId });
      } else {
        t.document_revisions.push({ id: `REV-${index}`, file_id: spec.fileId, project_id: s.projectId, document_id: s.documentId,
          storage_path_legacy: spec.key, revision_label: spec.kind === 'revision-move' ? 'IFA-Submitted' : 'IFR-Submitted' });
      }
      if (spec.kind === 'revision-move') t.document_storage_io_steps.push({ id: 'MOVE-1', writer_id: writer.id,
        operation_type: 'MOVE', source_key: spec.sourceKey, destination_key: spec.key, state: 'SUCCEEDED', evidence: '{"acknowledged":true}' });
    }
  }
  let db = t, staged, lock = false;
  const connection = {
    async beginTransaction() { staged = structuredClone(db); trace.push('begin'); },
    async commit() { db = staged; staged = undefined; trace.push('commit'); if (flags.commitUnknown) throw new Error('Commit ACK lost'); },
    async rollback() { staged = undefined; trace.push('rollback'); }, release() { trace.push('release'); },
    async execute(sql, args = []) {
      const s = sql.replace(/\s+/g, ' ').trim(), data = staged || db;
      const result = (v) => [structuredClone(v)];
      if (s.includes('IS_USED_LOCK(?) = CONNECTION_ID()')) return result([{ owned: lock ? 1 : 0 }]);
      if (s.includes('IS_USED_LOCK(?)')) return result([{ owner: flags.busy ? 99 : null }]);
      if (s.includes('GET_LOCK(')) { lock = !flags.busy; return result([{ acquired: lock ? 1 : 0 }]); }
      if (s.includes('RELEASE_LOCK(')) { lock = false; return result([{ released: 1 }]); }
      if (s.startsWith('UPDATE stored_file_namespace_bindings')) {
        assert.ok(staged); assert.ok(lock); trace.push('write');
        const [key, evidence, fileId, nsId, oldKey, oldEvidence] = args;
        if (flags.failFile === fileId) throw new Error('Binding write failed');
        const b = data.stored_file_namespace_bindings.find((b) => b.file_id === fileId && b.namespace_id === nsId
          && b.storage_key_snapshot === oldKey && b.evidence === oldEvidence);
        if (!b) return [{ affectedRows: 0 }];
        b.storage_key_snapshot = key; b.evidence = evidence; return [{ affectedRows: 1 }];
      }
      if (s.startsWith('INSERT INTO audit_trail')) {
        assert.ok(staged); if (flags.auditFailure) throw new Error('Audit failed');
        data.audit_trail.push({ id: args[0], identity_key: args[1], project_id: args[2], actor_user_id: args[3],
          resource_id: args[6], reference: args[7], metadata: args[8] }); return [{ affectedRows: 1 }];
      }
      assert.match(s, /^SELECT\b/, 'No other mutation is permitted');
      if (s.includes('information_schema.') || s.includes('FROM temporary_uploads')) return result([]);
      if (s.includes('FROM users u')) return result(flags.denied ? [] : [{ id: 1, full_name: 'Fixture Admin', department_name_snapshot: 'Fixture' }]);
      if (s.includes('FROM document_storage_io_steps s JOIN')) {
        return result(data.document_storage_io_steps.filter((v) => data.document_writer_operations.some((w) => w.id === v.writer_id && w.project_id === args[0] && w.document_id === args[1])));
      }
      if (s.includes('FROM document_delete_attempts a JOIN')) return result(data.document_delete_attempts);
      if (s.includes('FROM stored_file_namespace_bindings b JOIN')) {
        return result(data.stored_file_namespace_bindings.filter((b) => data.stored_files.some((f) => f.file_id === b.file_id && f.document_id === args[0])));
      }
      const table = s.match(/FROM (\w+)/)?.[1]; assert.ok(Object.hasOwn(data, table), s);
      let selected = data[table];
      const where = s.match(/WHERE (\w+)\s*(=|IN)/);
      if (where) selected = selected.filter((v) => where[2] === 'IN' ? args.includes(v[where[1]]) : v[where[1]] === args[0]);
      if (s.includes('AND id<>?')) selected = selected.filter((v) => v.id !== args[1]);
      else if (/AND (?:document_id|project_id)=\?/.test(s)) {
        const second = s.match(/AND (document_id|project_id)=\?/)[1]; selected = selected.filter((v) => v[second] === args[1]);
      }
      if (s.includes('ORDER BY')) selected = [...selected].sort((a, b) => String(a.id || a.file_id || '').localeCompare(String(b.id || b.file_id || '')));
      return result(selected);
    },
  };
  const storage = {
    async captureNamespace() { return ns; },
    async inspectOwnedExact(key) { return structuredClone(physical.get(key) || { exists: false, rootIdentity: 'native-root' }); },
    async inspectDocumentFolders(prefix) {
      const keys = [...physical.keys()].filter((k) => k.startsWith(prefix));
      return { ready: true, exists: true, rootIdentity: 'native-root', directories: [{ key: prefix.slice(0, -1), identity: `dir:${prefix}` }], objects: keys };
    },
  };
  const service = createRecovery({ storage, namespace: ns, operationIds: SCOPES.map((s) => s.operationId) });
  const dry = async () => {
    const ro = { execute(sql, args) { assert.match(sql.trim(), /^SELECT\b/i); assert.doesNotMatch(sql, /FOR UPDATE|LOCK IN SHARE MODE/i); return connection.execute(sql, args); } };
    const report = await service.dryRun(ro, target);
    report.databaseEvidence = { unchanged: true }; report.filesystemEvidence = { unchanged: true }; report.approvalDigest = reportDigest(report);
    return report;
  };
  const apply = (report, overrides = {}) => service.apply({ async getConnection() { return connection; } }, {
    report, approvalDigest: report.approvalDigest, actorUserId: '1', confirmation: 'APPLY_REVIEWED_HISTORICAL_PROVENANCE', target, ...overrides,
  });
  return { service, dry, apply, flags, trace, physical, ns, target, get db() { return db; } };
};

test('Both approved cases: read-only proposal, actual inventory validation, atomic repair and complete audit', async () => {
  const f = fixture(), before = structuredClone(f.db), physical = structuredClone(f.physical);
  const report = await f.dry();
  assert.equal(report.verdict, 'PREFLIGHT_PASS'); assert.equal(report.approvalDigest, reportDigest(report));
  assert.deepEqual(f.db, before); assert.ok(!f.trace.includes('write'));
  assert.equal(report.items[0].changes.length, 1); assert.equal(report.items[1].changes.length, 2);
  const result = await f.apply(report); assert.equal(result.length, 2); assert.equal(f.db.audit_trail.length, 2);
  for (const scope of SCOPES) for (const spec of scope.files) {
    const binding = f.db.stored_file_namespace_bindings.find((b) => b.file_id === spec.fileId);
    assert.equal(binding.storage_key_snapshot, spec.key);
    if (spec.kind === 'attachment') {
      const e = JSON.parse(binding.evidence);
      assert.equal(e.source, 'OWNER_REVIEWED_PENDING_DELETE_RECOVERY'); assert.equal(e.approvalDigest, report.approvalDigest);
      assert.equal(e.identityBasis, 'CURRENT_NATIVE_INSPECTION_NOT_UPLOAD_TIME'); assert.equal(e.actorUserId, '1');
    } else assert.equal(binding.evidence, before.stored_file_namespace_bindings.find((b) => b.file_id === spec.fileId).evidence);
  }
  for (const audit of f.db.audit_trail) {
    const metadata = JSON.parse(audit.metadata);
    assert.equal(metadata.approvalDigest, report.approvalDigest); assert.equal(audit.actor_user_id, 1);
    assert.ok(metadata.operationId); assert.ok(metadata.namespaceId); assert.ok(metadata.changes.every((c) => c.before && c.after));
    assert.ok(metadata.physical.every((p) => p.sha256 && p.localIdentity.identity));
  }
  assert.deepEqual(f.physical, physical);
  for (const key of Object.keys(before).filter((k) => !['stored_file_namespace_bindings','audit_trail'].includes(k))) assert.deepEqual(f.db[key], before[key]);
});

for (const fault of ['digest', 'scope', 'identity', 'checksum', 'missing', 'unknown', 'foreignReference', 'move', 'busy', 'gate', 'execution', 'manifest', 'attempt', 'writer', 'denied']) {
  test(`${fault} rejects apply without mutation`, async () => {
    const f = fixture(), report = await f.dry();
    if (fault === 'scope') { report.items[0].scope = { ...report.items[0].scope, documentId: 'FOREIGN' }; report.approvalDigest = reportDigest(report); }
    if (fault === 'identity') f.physical.get(SCOPES[0].files[0].key).identity = 'replaced';
    if (fault === 'checksum') f.physical.get(SCOPES[0].files[0].key).sha256 = digest('different');
    if (fault === 'missing') f.physical.delete(SCOPES[0].files[0].key);
    if (fault === 'unknown') f.physical.set('projects/SS-ALPHA-01/documents/PID-EDMS-0001/unknown.txt', { exists: true });
    if (fault === 'foreignReference') f.db.document_revisions.push({ id: 'FOREIGN', file_id: SCOPES[0].files[0].fileId, document_id: 'FOREIGN', project_id: 'FOREIGN' });
    if (fault === 'move') f.db.document_storage_io_steps[0].destination_key = 'wrong/destination.pdf';
    if (fault === 'busy') f.flags.busy = true;
    if (fault === 'gate') f.db.document_admission_coordinators[0].gate_state = 'OPEN';
    if (fault === 'execution') f.db.document_delete_executions.push({ operation_id: SCOPES[0].operationId });
    if (fault === 'manifest') f.db.document_delete_file_manifest.push({ delete_operation_id: SCOPES[0].operationId });
    if (fault === 'attempt') f.db.document_delete_attempts.push({ manifest_id: 'ATTEMPT' });
    if (fault === 'writer') f.db.document_writer_operations[0].lifecycle_state = 'RUNNING';
    if (fault === 'denied') f.flags.denied = true;
    const before = structuredClone(f.db), physical = structuredClone(f.physical);
    if (fault === 'move') {
      // The earlier document may commit: rollback is deliberately per document.
      await assert.rejects(f.apply(report), (e) => { assert.equal(e.completedDocuments.length, 1); return true; });
      assert.deepEqual(f.db.stored_file_namespace_bindings.filter((b) => SCOPES[1].files.some((s) => s.fileId === b.file_id)),
        before.stored_file_namespace_bindings.filter((b) => SCOPES[1].files.some((s) => s.fileId === b.file_id)));
    } else {
      await assert.rejects(f.apply(report, fault === 'digest' ? { approvalDigest: '0'.repeat(64) } : {}));
      assert.deepEqual(f.db, before);
    }
    assert.deepEqual(f.physical, physical);
  });
}

test('Second-document partial write failure rolls back both of its repairs, preserves first document commit', async () => {
  const f = fixture(), before = structuredClone(f.db), report = await f.dry();
  f.flags.failFile = SCOPES[1].files[1].fileId;
  await assert.rejects(f.apply(report), (e) => { assert.equal(e.completedDocuments.length, 1); return true; });
  assert.equal(f.db.audit_trail.length, 1);
  for (const spec of SCOPES[1].files) assert.deepEqual(f.db.stored_file_namespace_bindings.find((b) => b.file_id === spec.fileId), before.stored_file_namespace_bindings.find((b) => b.file_id === spec.fileId));
});
test('Audit failure rolls back binding mutation', async () => {
  const f = fixture(), before = structuredClone(f.db), report = await f.dry(); f.flags.auditFailure = true;
  await assert.rejects(f.apply(report)); assert.deepEqual(f.db, before);
});
test('Commit ACK loss stops, reports uncertain scope, never automatically retries', async () => {
  const f = fixture(), report = await f.dry(); f.flags.commitUnknown = true;
  await assert.rejects(f.apply(report), (e) => { assert.equal(e.uncertainDocument.operationId, SCOPES[0].operationId); assert.equal(e.completedDocuments.length, 0); return true; });
  assert.equal(f.trace.filter((x) => x === 'commit').length, 1); assert.equal(f.db.audit_trail.length, 1);
});
test('Repeated approved apply is safely rejected without duplicate audit or writes', async () => {
  const f = fixture(), report = await f.dry(); await f.apply(report); const before = structuredClone(f.db);
  await assert.rejects(f.apply(report), { code: 'RECOVERY_ALREADY_APPLIED' }); assert.deepEqual(f.db, before);
});
test('Missing explicit approval, changed metadata, and blocked report cannot apply', async () => {
  const f = fixture(), report = await f.dry();
  await assert.rejects(f.apply(report, { confirmation: '' }), { code: 'RECOVERY_APPROVAL_REQUIRED' });
  f.db.stored_files[0].file_size = 99; await assert.rejects(f.apply(report));
  const blocked = await f.dry(); assert.equal(blocked.verdict, 'BLOCKED');
  await assert.rejects(f.apply(blocked), { code: 'RECOVERY_APPROVAL_REQUIRED' });
});
test('CLI requires exact explicit operation/document/file lists', () => {
  const args = { 'operation-id': SCOPES.map((s) => s.operationId), 'document-id': SCOPES.map((s) => s.documentId),
    'file-id': SCOPES.flatMap((s) => s.files.map((f) => f.fileId)) };
  assert.equal(validateScopeArguments(args).length, 2);
  assert.throws(() => validateScopeArguments({ ...args, 'file-id': ['OTHER'] }));
  assert.throws(() => validateScopeArguments({ ...args, 'operation-id': ['OTHER'] }));
});

for (const fault of ['sourceExists', 'revisionIdentity', 'duplicateMove', 'foreignManifest', 'uncertainCompletion']) {
  test(`Dry-run ${fault} is blocked without database or physical mutation`, async () => {
    const f = fixture(), revision = SCOPES[1].files[1];
    if (fault === 'sourceExists') f.physical.set(revision.sourceKey, { exists: true, rootIdentity: 'native-root' });
    if (fault === 'revisionIdentity') f.physical.get(revision.key).identity = 'replacement';
    if (fault === 'duplicateMove') f.db.document_storage_io_steps.push({ ...f.db.document_storage_io_steps[0], id: 'MOVE-2' });
    if (fault === 'foreignManifest') f.db.document_delete_file_manifest.push({ delete_operation_id: 'FOREIGN', file_reference: revision.fileId,
      exact_storage_key: revision.key, ownership_evidence: '{"fileIds":[]}' });
    if (fault === 'uncertainCompletion') f.db.document_writer_operations[1].completion_evidence = '{"scopeClosed":true,"unresolvedIo":0,"uncertain":true}';
    const before = structuredClone(f.db), physical = structuredClone(f.physical), report = await f.dry();
    assert.equal(report.verdict, 'BLOCKED'); assert.equal(report.items[1].eligible, false);
    assert.deepEqual(f.db, before); assert.deepEqual(f.physical, physical);
  });
}

test('CLI rejects report output inside storage, including Windows case variants', async () => {
  const path = require('node:path');
  const root = path.resolve('fixture-storage');
  await assert.rejects(assertReportLocation(path.join(root, 'report.json'), root));
  await assert.rejects(assertReportLocation(path.join(root.toUpperCase(), 'report.json'), root));
});
