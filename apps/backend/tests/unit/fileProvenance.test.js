const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { namespace, r2Namespace, digest } = require('../../src/utils/storageNamespace');
const { verifyFile } = require('../../src/services/fileProvenance.service');
const { completeNewFile, bindNewFile } = require('../../src/repositories/storageNamespace.repository');
const { createReconciler, reportDigest } = require('../../src/services/legacyFileReconciliation.service');
const { loadDrivers } = require('../helpers/deleteStorageDrivers.cjs');

const captured = namespace({ version: 1, provider: 'local', root: 'D:/synthetic', device: '1', inode: '2', birthtime: 3 });
const file = { file_id: 'FILE-TEST', project_id: 'PROJECT', document_id: 'DOCUMENT', storage_key: 'files/own.pdf',
  file_size: 7, checksum: digest('fixture') };
const observed = { exists: true, size: 7, sha256: file.checksum, rootIdentity: 'root', identity: 'file' };
const storage = (patch = {}) => ({ captureNamespace: async () => captured, inspectOwnedExact: async () => observed, ...patch });

test('final-file verification retains native identity, checksum and size', async () => {
  const proof = await verifyFile(storage(), captured, file);
  assert.deepEqual(proof.localIdentity, { rootIdentity: 'root', identity: 'file', sha256: file.checksum, size: 7 });
});
for (const [name, patch, code] of [
  ['missing', { exists: false }, 'FILE_MISSING'],
  ['checksum mismatch', { ...observed, sha256: digest('other') }, 'FILE_CONTENT_MISMATCH'],
  ['size mismatch', { ...observed, size: 8 }, 'FILE_CONTENT_MISMATCH'],
  ['native identity missing', { ...observed, identity: null }, 'LOCAL_IDENTITY_REQUIRED'],
]) test(`final-file verification rejects ${name}`, async () => {
  await assert.rejects(verifyFile(storage({ inspectOwnedExact: async () => patch }), captured, file), { code });
});
test('namespace mismatch performs no object inspection', async () => {
  let reads = 0;
  await assert.rejects(verifyFile(storage({ captureNamespace: async () => namespace({ ...captured.descriptor, inode: 'other' }),
    inspectOwnedExact: async () => { reads++; } }), captured, file), { code: 'NAMESPACE_MISMATCH' });
  assert.equal(reads, 0);
});
test('missing checksum and namespace capture failure are not successful provenance', async () => {
  await assert.rejects(verifyFile(storage(), captured, { ...file, checksum: null }), { code: 'FILE_CHECKSUM_REQUIRED' });
  await assert.rejects(bindNewFile({}, 'F', 'file.pdf', null), { code: 'NAMESPACE_INVALID' });
  await assert.rejects(verifyFile(storage({ captureNamespace: async () => { throw new Error('capture failed'); } }), captured, file), /capture failed/);
});
test('runtime storage facade propagates namespace capture failure instead of returning null', async () => {
  const f = require('../helpers/isolatedDocumentCoordination.cjs').fixture();
  f.driver.captureNamespace = async () => { throw new Error('capture failed'); };
  await assert.rejects(f.storage.captureNamespace(), /capture failed/);
});
test('actual R2 inspector streams object bytes and verifies explicit descriptor without live provider', async () => {
  const requests = [];
  const driver = loadDrivers({ root: path.resolve('tmp'), send: async (command) => {
    requests.push(command); return { Body: [Buffer.from('fix'), Buffer.from('ture')] };
  } }).r2({ accountId: 'synthetic', endpoint: 'https://synthetic.r2.cloudflarestorage.com', bucketName: 'development' });
  const ns = await driver.captureNamespace();
  const proof = await verifyFile(driver, ns, file);
  assert.equal(proof.sha256, file.checksum); assert.equal(proof.localIdentity, undefined);
  assert.equal(requests[0].input.Bucket, 'development'); assert.equal(requests[0].input.Key, file.storage_key);
});
test('completion persists inspected final identity in the caller transaction only', async () => {
  const calls = [];
  const c = { execute: async (sql, args) => {
    calls.push({ sql, args });
    if (sql.startsWith('SELECT')) return [[{ ...file, namespace_id: captured.id, storage_key_snapshot: file.storage_key, descriptor: captured.encoded }]];
    return [{ affectedRows: 1 }];
  } };
  await completeNewFile(c, file.file_id, storage());
  assert.equal(calls.length, 2);
  assert.equal(JSON.parse(calls[1].args[0]).localIdentity.identity, 'file');
  assert.equal(JSON.parse(calls[1].args[0]).source, 'UPLOAD_ADAPTER_SNAPSHOT');
});
test('failed final inspection writes no completed evidence', async () => {
  let writes = 0;
  const c = { execute: async (sql) => {
    if (sql.startsWith('SELECT')) return [[{ ...file, namespace_id: captured.id, storage_key_snapshot: file.storage_key, descriptor: captured.encoded }]];
    writes++; return [{ affectedRows: 1 }];
  } };
  await assert.rejects(completeNewFile(c, file.file_id, storage({ inspectOwnedExact: async () => ({ exists: false }) })), { code: 'FILE_MISSING' });
  assert.equal(writes, 0);
});

const fixture = (options = {}) => {
  const inventory = { document: { id: 'DOCUMENT', document_number: 'PFD-TEST' }, tables: {}, files: [file], bindings: [] };
  const state = { bindings: [], audits: [], gate: 'OPEN', active: false, io: false, operation: false,
    admin: true, manifest: false, manifestReads: 0, failAudit: false, commits: 0, rollbacks: 0 };
  const repo = { inventory: async () => {
    if (options.inventoryFailure) throw Object.assign(new Error('blocked'), { code: options.inventoryFailure });
    return { ...inventory, bindings: state.bindings };
  } };
  const entries = options.namespaces || [{ namespace: captured, storage: options.storage || storage() }];
  let before; let committed = false;
  const c = {
    beginTransaction: async () => { committed = false; before = structuredClone({ bindings: state.bindings, audits: state.audits }); },
    commit: async () => { committed = true; state.commits++; options.onCommit?.(); },
    rollback: async () => { if (!committed) Object.assign(state, before); state.rollbacks++; }, release() { options.onRelease?.(); },
    execute: async (sql, args) => {
      if (sql.includes('FROM document_writer_operations')) return [state.active ? [{ id: 'writer' }] : []];
      if (sql.includes('FROM document_storage_io_steps')) return [state.io ? [{ id: 'io' }] : []];
      if (sql.includes('FROM document_delete_operations')) return [state.operation ? [{ id: 'delete' }] : []];
      if (sql.includes('FROM document_delete_file_manifest')) {
        assert.equal(sql, 'SELECT file_reference AS file_id, ownership_evidence AS evidence FROM document_delete_file_manifest');
        for (const engine of ['mariadb', 'mysql']) {
          const ddl = await fs.readFile(path.resolve(__dirname,
            `../../../../database/migration/20261102_0001_permanent_delete_foundation_${engine}.sql`), 'utf8');
          const body = ddl.split('CREATE TABLE document_delete_file_manifest (')[1].split(') ENGINE=')[0];
          assert.match(body, /^\s*file_reference\s+VARCHAR\(64\)/m);
          assert.match(body, /^\s*ownership_evidence\s+LONGTEXT/m);
          assert.doesNotMatch(body, /^\s*(file_id|evidence)\s+/m);
        }
        state.manifestReads++;
        return [state.manifest ? [{ file_id: 'OTHER_ALIAS', evidence: JSON.stringify({ fileIds: [file.file_id] }) }] : []];
      }
      if (sql.includes('FROM users')) return [state.admin ? [{ id: 1, full_name: 'Full Name', department_name_snapshot: 'Test' }] : []];
      if (sql.startsWith('SELECT TABLE_NAME')) return [[{}, {}]];
      if (sql.startsWith('SELECT descriptor')) return [[{ descriptor: captured.encoded }]];
      if (sql.startsWith('INSERT INTO storage_namespaces')) return [{ affectedRows: 1 }];
      if (sql.startsWith('INSERT INTO stored_file_namespace_bindings')) {
        state.bindings.push({ file_id: args[0], namespace_id: args[1], storage_key_snapshot: args[2], evidence: args[3] });
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('UPDATE stored_file_namespace_bindings')) {
        const binding = state.bindings.find((b) => b.file_id === args[1]);
        binding.evidence = args[0]; return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('INSERT INTO audit_trail')) {
        if (state.failAudit) throw new Error('audit failure');
        state.audits.push(args); return [{ affectedRows: 1 }];
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
  const service = createReconciler({ repository: repo, namespaces: entries,
    coordination: options.coordination || { lockGate: async () => ({ gate_state: state.gate }) } });
  const target = { database: 'synthetic' };
  const dryRun = async () => {
    const report = await service.dryRun({ execute: async (sql) => { assert.match(sql, /^SELECT/); return [[file]]; } }, target);
    report.databaseEvidence = { unchanged: true };
    report.approvalDigest = reportDigest(report);
    return report;
  };
  const apply = (report, patch = {}) => service.apply({ getConnection: async () => c }, {
    report, approvalDigest: report.approvalDigest, actorUserId: 1, confirmation: 'APPLY_REVIEWED_FILE_BINDINGS', target, ...patch,
  });
  return { service, state, inventory, dryRun, apply };
};

test('legacy dry-run verifies unbound file and issues no writes', async () => {
  const f = fixture(); const report = await f.dryRun();
  assert.equal(report.summary.VERIFIED, 1); assert.equal(report.summary.eligibleForApply, 1);
  assert.equal(f.state.bindings.length, 0); assert.equal(f.state.commits, 0);
});
test('apply manifest projection uses actual MariaDB/MySQL migration columns and explicit consumer aliases', async () => {
  const f = fixture(); const report = await f.dryRun();
  await f.apply(report);
  assert.equal(f.state.manifestReads, 1);
});
for (const [code, expected] of [['FILE_MISSING', 'MISSING'], ['FILE_CONTENT_MISMATCH', 'BLOCKED'],
  ['SHARED_STORAGE_KEY', 'AMBIGUOUS'], ['CROSS_DOCUMENT_REFERENCE', 'AMBIGUOUS'], ['LEGACY_REFERENCE_AMBIGUOUS', 'AMBIGUOUS']]) {
  test(`legacy classifies ${code} as ${expected}`, async () => {
    const f = fixture({ inventoryFailure: code }); const report = await f.dryRun();
    assert.equal(report.files[0].status, expected); assert.equal(report.summary.eligibleForApply, 0);
  });
}
test('matching content in two explicit namespaces is ambiguous, not first-match binding', async () => {
  const second = namespace({ ...captured.descriptor, inode: 'other' });
  const f = fixture({ namespaces: [{ namespace: captured, storage: storage() },
    { namespace: second, storage: storage({ captureNamespace: async () => second }) }] });
  assert.equal((await f.dryRun()).files[0].status, 'AMBIGUOUS');
});
test('inaccessible additional candidate blocks otherwise matching namespace', async () => {
  const second = r2Namespace({ accountId: 'synthetic', endpoint: 'https://synthetic.r2.cloudflarestorage.com', bucketName: 'other' });
  const f = fixture({ namespaces: [{ namespace: captured, storage: storage() }, { namespace: second,
    storage: { captureNamespace: async () => second, inspectOwnedExact: async () => { throw Object.assign(new Error('denied'), { code: 'ACCESS_DENIED' }); } } }] });
  assert.equal((await f.dryRun()).files[0].status, 'BLOCKED');
});
test('apply binds atomically with audit, rerun is no-op, and dry-run detects already bound', async () => {
  const f = fixture(); const report = await f.dryRun();
  assert.equal((await f.apply(report))[0].status, 'BOUND');
  assert.equal(f.state.bindings.length, 1); assert.equal(f.state.audits.length, 1);
  assert.equal((await f.apply(report))[0].status, 'ALREADY_BOUND');
  assert.equal(f.state.audits.length, 1);
  assert.equal((await f.dryRun()).summary.alreadyBound, 1);
});
for (const [field, value, code] of [['gate', 'CLOSED', 'DOCUMENT_DELETION_IN_PROGRESS'],
  ['active', true, 'WRITER_NOT_SETTLED'], ['io', true, 'WRITER_NOT_SETTLED'],
  ['operation', true, 'DELETE_OPERATION_EXISTS'], ['manifest', true, 'MANIFEST_ALREADY_FINALIZED'],
  ['admin', false, 'BINDING_ADMIN_REQUIRED']]) {
  test(`apply rejects concurrent/unauthorized condition ${field}`, async () => {
    const f = fixture(); const report = await f.dryRun(); f.state[field] = value;
    await assert.rejects(f.apply(report), { code }); assert.equal(f.state.bindings.length, 0);
  });
}
test('evidence changed since dry-run prevents apply', async () => {
  const f = fixture(); const report = await f.dryRun(); f.inventory.document.updated_at = 'changed';
  await assert.rejects(f.apply(report), { code: 'RECONCILIATION_EVIDENCE_CHANGED' });
  assert.equal(f.state.bindings.length, 0);
});
test('conflicting existing binding is not overwritten', async () => {
  const f = fixture(); const report = await f.dryRun();
  f.state.bindings.push({ file_id: file.file_id, namespace_id: captured.id, storage_key_snapshot: file.storage_key,
    evidence: JSON.stringify({ source: 'OWNER_REVIEWED_STORAGE_INVENTORY', sha256: digest('other'), size: 7 }) });
  await assert.rejects(f.apply(report), { code: 'FILE_PROVENANCE_CONFLICT' });
});
test('audit failure rolls back binding and retry safely resumes', async () => {
  const f = fixture(); const report = await f.dryRun(); f.state.failAudit = true;
  await assert.rejects(f.apply(report), /audit failure/); assert.equal(f.state.bindings.length, 0);
  f.state.failAudit = false; assert.equal((await f.apply(report))[0].status, 'BOUND');
});
test('reconciliation commit ACK loss is reported uncertain and resume does not duplicate binding/audit', async () => {
  let first = true;
  const f = fixture({ onCommit: () => { if (first) { first = false; throw new Error('commit ACK lost'); } } });
  const report = await f.dryRun();
  await assert.rejects(f.apply(report), (error) => error.message === 'commit ACK lost' && error.uncertainDocument.documentId === 'DOCUMENT');
  assert.equal(f.state.bindings.length, 1); assert.equal(f.state.audits.length, 1);
  assert.equal((await f.apply(report))[0].status, 'ALREADY_BOUND');
  assert.equal(f.state.audits.length, 1);
});
test('reconciliation holds the shared gate through storage inspection and commit, fencing new admission and Delete', async () => {
  const { deferred } = require('../helpers/isolatedDocumentCoordination.cjs');
  const inspected = deferred(); const unblock = deferred();
  let locked = false; let release; let duringApply = false; let competingEntered = false;
  const coordination = { lockGate: async () => {
    if (locked) await new Promise((resolve) => { release = resolve; });
    locked = true; return { gate_state: 'OPEN' };
  } };
  const f = fixture({ coordination, onCommit: () => { locked = false; release?.(); },
    storage: storage({ inspectOwnedExact: async () => {
      if (duringApply) { inspected.resolve(); await unblock.promise; }
      return observed;
    } }) });
  const report = await f.dryRun(); duringApply = true;
  const applying = f.apply(report); await inspected.promise;
  const competing = coordination.lockGate().then(() => { competingEntered = true; });
  await Promise.resolve(); assert.equal(competingEntered, false);
  unblock.resolve(); await applying; await competing;
  assert.equal(competingEntered, true); assert.equal(f.state.bindings.length, 1);
});
test('approval mismatch, edited report and missing snapshot evidence never acquire connection', async () => {
  const f = fixture(); const report = await f.dryRun();
  await assert.rejects(f.apply(report, { confirmation: 'no' }), { code: 'RECONCILIATION_APPROVAL_REQUIRED' });
  const edited = structuredClone(report); edited.files[0].storageKey = 'other.pdf';
  await assert.rejects(f.apply(edited), { code: 'RECONCILIATION_APPROVAL_REQUIRED' });
  report.databaseEvidence.unchanged = false; report.approvalDigest = reportDigest(report);
  await assert.rejects(f.apply(report), { code: 'RECONCILIATION_APPROVAL_REQUIRED' });
  assert.equal(f.state.commits, 0);
});

test('native inspector verifies Windows extended-length paths without changing file content', { skip: process.platform !== 'win32' }, async () => {
  const root = await fs.mkdtemp(path.resolve(__dirname, '../../../../tmp/provenance-long-'));
  const directory = path.join(root, 'nested'); await fs.mkdir(directory);
  const name = 'a'.repeat(220) + '.pdf'; const target = path.join(directory, name);
  await fs.writeFile(target, 'fixture');
  try {
    assert.ok(target.length > 260);
    const driver = loadDrivers({ root }).local; const ns = await driver.captureNamespace();
    const proof = await verifyFile(driver, ns, { ...file, storage_key: `nested/${name}` });
    assert.ok(proof.localIdentity.identity); assert.equal(await fs.readFile(target, 'utf8'), 'fixture');
  } finally { await fs.unlink(target); await fs.rmdir(directory); await fs.rmdir(root); }
});
