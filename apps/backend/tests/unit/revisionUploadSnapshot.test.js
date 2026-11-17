const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader } = require('../helpers/approvalEmailLoader');

const fields = ['upload_stage_snapshot', 'uploaded_by_username_snapshot', 'uploaded_by_role_snapshot'];
const fixture = () => {
  const rows = [], calls = [];
  let identity = { id: 'M1', project_id: 'P1', user_id: 7, official_role: 'Document Owner',
    username: 'synthetic-owner', status: 'Active', user_status: 'Active', project_status: 'Active' };
  const connection = { async execute(sql, args) {
    calls.push({ sql, args });
    if (sql.includes('FROM project_memberships')) {
      assert.match(sql, /project_memberships.project_id = \?/);
      assert.match(sql, /project_memberships.user_id = \?/);
      assert.match(sql, /LOWER\(TRIM\(projects.status\)\) = 'active'/);
      assert.deepEqual(Array.from(args), ['P1', 7]);
      return [identity ? [{ ...identity }] : []];
    }
    if (sql.includes('INSERT INTO document_revisions')) {
      const columns = sql.match(/document_revisions\s*\(([^)]+)\)/)[1].split(',').map(s => s.trim());
      assert.equal(columns.length, args.length);
      rows.push(Object.fromEntries(columns.map((column, i) => [column, args[i]])));
      return [{ affectedRows: 1 }];
    }
    if (sql.includes('SET revision_label = ?')) {
      assert.ok(fields.every(field => !sql.includes(field)));
      rows.find(row => row.id === args[1]).revision_label = args[0];
      return [{ affectedRows: 1 }];
    }
    throw new Error('Unexpected fixture statement');
  } };
  const pool = { async execute(sql) {
    assert.match(sql, /FROM document_revisions revisions/);
    return [rows.map(row => ({ ...row, created_by_name: identity?.username || 'Changed name',
      file_uploaded_at: '2026-11-16T00:00:00Z' }))];
  }, async getConnection() { throw new Error('Database access forbidden'); } };
  const loader = createLoader(new Map([
    ['config/database.js', { pool }], ['config/logger.js', { error() {} }],
  ]));
  return { repo: loader.load('repositories/document.repository.js'), connection, rows, calls,
    get identity() { return identity; }, set identity(value) { identity = value; } };
};
const revision = (patch = {}) => ({ id: 'R1', projectId: 'P1', documentId: 'D1', revisionLabel: 'IFR-Submitted',
  revisionSequence: 1, fileId: 'F1', storagePathLegacy: 'safe/file.pdf', isActive: true,
  sourceStatus: null, resultStatus: 'Process Review', createdByUserId: 7, ...patch });

for (const [label, snapshot] of [['IFR-Submitted', 'IFR-Submitted'], ['IFA-Submitted', 'IFA-Submitted'], ['AS-Built', 'As-Built']]) {
  test(`revision insert snapshots ${label} without altering revision label`, async () => {
    const f = fixture();
    await f.repo.insertRevision(f.connection, revision({ revisionLabel: label,
      uploadedByUsernameSnapshot: 'forged', uploadedByRoleSnapshot: 'Admin', uploadStageSnapshot: 'forged' }));
    assert.equal(f.rows[0].revision_label, label);
    assert.equal(f.rows[0].upload_stage_snapshot, snapshot);
    assert.equal(f.rows[0].uploaded_by_username_snapshot, 'synthetic-owner');
    assert.equal(f.rows[0].uploaded_by_role_snapshot, 'Document Owner');
    assert.equal(f.calls.length, 2);
  });
}

for (const change of [null, { username: null }, { username: '' }, { username: '  ' },
  { username: 'x'.repeat(256) }, { official_role: 'Unknown' }, { project_id: 'OTHER' }, { user_id: 8 }]) {
  test(`unverifiable upload identity rejected: ${JSON.stringify(change)}`, async () => {
    const f = fixture(); f.identity = change === null ? null : { ...f.identity, ...change };
    await assert.rejects(f.repo.insertRevision(f.connection, revision()), { code: 'REVISION_UPLOAD_SNAPSHOT_UNAVAILABLE' });
    assert.equal(f.rows.length, 0);
    assert.equal(f.calls.filter(call => call.sql.includes('INSERT')).length, 0);
  });
}

for (const label of ['Unknown', 'toString', '', null]) test(`invalid upload stage rejected: ${label}`, async () => {
  const f = fixture();
  await assert.rejects(f.repo.insertRevision(f.connection, revision({ revisionLabel: label })), { code: 'REVISION_UPLOAD_SNAPSHOT_UNAVAILABLE' });
  assert.equal(f.rows.length, 0);
});

test('snapshots survive username/membership changes and existing revision relabel', async () => {
  const f = fixture(); await f.repo.insertRevision(f.connection, revision());
  f.identity = { ...f.identity, username: 'renamed-user', official_role: 'Viewer' };
  await f.repo.updateRevisionLabel(f.connection, { revisionId: 'R1', revisionLabel: 'AS-Built' });
  const [row] = await f.repo.listDocumentRevisions({ projectId: 'P1', documentId: 'D1' });
  assert.equal(row.revisionLabel, 'AS-Built');
  assert.equal(row.uploadStageSnapshot, 'IFR-Submitted');
  assert.equal(row.uploadedByUsernameSnapshot, 'synthetic-owner');
  assert.equal(row.uploadedByRoleSnapshot, 'Document Owner');
});

test('legacy revision list preserves NULL snapshots rather than current identity/stage', async () => {
  const f = fixture(); f.rows.push({ id: 'OLD', file_id: 'F0', revision_label: 'AS-Built',
    upload_stage_snapshot: null, uploaded_by_username_snapshot: null, uploaded_by_role_snapshot: null });
  const [row] = await f.repo.listDocumentRevisions({ projectId: 'P1', documentId: 'D1' });
  assert.equal(row.uploadStageSnapshot, null);
  assert.equal(row.uploadedByUsernameSnapshot, null);
  assert.equal(row.uploadedByRoleSnapshot, null);
});

for (const action of ['view', 'download']) test(`legacy ${action} resolves an old file without snapshot requirements or pointer changes`, async () => {
  const legacy = { document: { id: 'D1', projectId: 'P1', activeRevisionId: 'R2', activeFileId: 'F2' },
    revision: { id: 'R1' }, storedFile: { fileId: 'F1', storageKey: 'legacy/file.pdf' } };
  const before = structuredClone(legacy);
  const loader = createLoader(new Map([
    ['config/logger.js', { error() {} }],
    ['repositories/fileAccess.repository.js', { async findRevisionDocumentFile(args) {
      assert.equal(args.revisionId, 'R1'); assert.equal(args.documentId, 'D1'); return legacy;
    } }],
    ['repositories/projectMembership.repository.js', { async findActiveMembershipByProjectAndUser(args) {
      assert.equal(args.projectId, 'P1'); assert.equal(args.userId, 7); return { officialRole: 'Viewer' };
    } }],
    ['services/storage.service.js', { async exists(key) { assert.equal(key, 'legacy/file.pdf'); return true; } }],
    ['services/audit.service.js', { async recordActivitySafely() {} }],
  ]));
  const result = await loader.load('services/fileAccess.service.js').resolveDocumentFileForAccess({
    action, documentId: 'D1', revisionId: 'R1', userId: 7, actorOfficialRole: 'Viewer' });
  assert.equal(result.storedFile.fileId, 'F1'); assert.deepEqual(legacy, before);
});

test('canonical schemas and manual migration agree; existing mutation statements do not write snapshots', () => {
  const root = path.resolve(__dirname, '../../../..');
  const migration = fs.readFileSync(path.join(root, 'database/migration/20261116_0001_revision_upload_snapshots.sql'), 'utf8');
  for (const name of ['dev', 'staging', 'prod']) {
    const schema = fs.readFileSync(path.join(root, `database/schema/schema-${name}.sql`), 'utf8');
    const table = schema.match(/CREATE TABLE document_revisions \([\s\S]*?\) ENGINE=InnoDB/)[0];
    for (const [column, length] of [[fields[0], 64], [fields[1], 255], [fields[2], 64]]) {
      assert.match(table, new RegExp(`${column} VARCHAR\\(${length}\\) NULL DEFAULT NULL`));
      assert.match(migration, new RegExp(`ADD COLUMN ${column} VARCHAR\\(${length}\\) NULL DEFAULT NULL`));
    }
    const checks = table.match(/CONSTRAINT chk_document_revisions_(?:upload_stage_snapshot|uploaded_by_role_snapshot) CHECK \([^\n]+/g);
    for (const check of checks) assert.ok(migration.replace(/\s+/g, ' ').includes(check.replace(/,$/, '')));
  }
  const sqlOnly = migration.replace(/--[^\n]*/g, '');
  assert.doesNotMatch(sqlOnly, /\b(?:UPDATE|INSERT|DELETE|DROP|USE)\b/i);
  const source = fs.readFileSync(path.join(root, 'apps/backend/src/repositories/document.repository.js'), 'utf8');
  for (const update of source.match(/UPDATE document_revisions[\s\S]*?`/g)) {
    assert.ok(fields.every(field => !update.includes(field)));
  }
});
