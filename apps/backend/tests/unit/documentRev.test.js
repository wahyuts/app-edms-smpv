const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader } = require('../helpers/approvalEmailLoader');

const validator = createLoader().load('validators/document.validator.js');
const createPayload = { documentNumber: 'PFD-1', drawing: 'PFD', area: 'CDU', temporaryFileId: 'TMP-1' };
const revisionPayload = { temporaryFileId: 'TMP-1', expectedWorkflowStatus: 'Process Comment', expectedActiveRevisionId: 'REV-1' };

for (const [input, expected] of [['A', 'A'], ['01', '01'], ['A1', 'A1'], ['Rev.01', 'Rev.01'], ['', null], ['   ', null], [null, null]]) {
  for (const [name, validate, base] of [
    ['create', validator.validateDocumentCreate, createPayload],
    ['edit', validator.validateDocumentUpdate, {}],
    ['revision metadata', validator.validateTemporaryFilePayload, revisionPayload],
  ]) {
    test(`${name} normalizes optional REV. ${JSON.stringify(input)}`, () => {
      const result = validate({ ...base, rev: input });
      assert.equal(result.isValid, true);
      assert.equal(result.value.rev, expected);
    });
  }
}

test('omitted REV. is NULL at create and absent for partial updates', () => {
  assert.equal(validator.validateDocumentCreate(createPayload).value.rev, null);
  assert.equal(Object.hasOwn(validator.validateDocumentUpdate({ description: 'updated' }).value, 'rev'), false);
  assert.equal(Object.hasOwn(validator.validateTemporaryFilePayload(revisionPayload).value, 'rev'), false);
});

for (const rev of ['A'.repeat(51), 1, {}, []]) {
  test(`invalid REV. rejected: ${JSON.stringify(rev)}`, () => {
    for (const result of [validator.validateDocumentCreate({ ...createPayload, rev }), validator.validateDocumentUpdate({ rev }),
      validator.validateTemporaryFilePayload({ ...revisionPayload, rev })]) {
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e.field === 'rev'));
    }
  });
}

test('REV. accepts 50 characters including leading zeroes', () => {
  const rev = '01' + 'A'.repeat(48);
  assert.equal(validator.validateDocumentUpdate({ rev }).value.rev, rev);
  assert.equal(validator.validateDocumentUpdate({ rev }).isValid, true);
});

const repositoryFixture = (row = {}) => {
  const calls = [];
  const execute = async (sql, args) => { calls.push({ sql, args }); return [[row]]; };
  const repo = createLoader(new Map([
    ['config/database.js', { pool: { execute } }],
    ['config/logger.js', { error() {} }],
  ])).load('repositories/document.repository.js');
  return { repo, calls, connection: { execute } };
};

for (const rev of [null, 'A', '01']) {
  test(`register/detail serialize REV. independently: ${rev}`, async () => {
    const f = repositoryFixture({ id: 'D1', rev, revision_label: 'IFR-Submitted' });
    const result = await f.repo.findDocumentRegisterById('D1');
    assert.equal(result.rev, rev);
    assert.equal(result.revision, 'IFR-Submitted');
    assert.match(f.calls[0].sql, /documents\.rev/);
    assert.equal((await f.repo.findDocumentFoundationById('D1')).rev, rev);
  });
}

test('repository create persists REV. as an independent parameter', async () => {
  const f = repositoryFixture();
  await f.repo.insertDocument(f.connection, { id: 'D1', rev: '01', area: 'CDU' });
  const { sql, args } = f.calls[0];
  assert.match(sql, /area, rev,/);
  assert.equal((sql.match(/\?/g) || []).length, args.length);
  assert.equal(args[7], '01');
});

for (const rev of [undefined, null, 'B']) {
  test(`repository partial edit handles REV. ${rev} without workflow/storage writes`, async () => {
    const f = repositoryFixture();
    await f.repo.updateDocumentMetadata(f.connection, { documentId: 'D1', rev });
    const { sql, args } = f.calls[0];
    assert.match(sql, /rev = CASE WHEN \? THEN \? ELSE rev END/);
    assert.equal(args[1], rev !== undefined);
    assert.equal(args[2], rev ?? null);
    assert.equal((sql.match(/\?/g) || []).length, args.length);
    assert.doesNotMatch(sql, /revision_label|workflow_status|active_file_id|sla_started_at|stored_file_namespace_bindings/);
  });
}

test('single additive migration and all canonical schemas keep REV. nullable', () => {
  const root = path.resolve(__dirname, '../../../..');
  const migration = fs.readFileSync(path.join(root, 'database/migration/20261106_0001_document_rev.sql'), 'utf8').replace(/--[^\n]*/g, '');
  assert.match(migration, /ALTER TABLE engineering_documents\s+ADD COLUMN rev VARCHAR\(50\) NULL DEFAULT NULL AFTER area;/);
  assert.doesNotMatch(migration, /\b(UPDATE|DELETE|INSERT|DROP|TRUNCATE|IF NOT EXISTS)\b/i);
  for (const name of ['dev', 'staging', 'prod']) {
    assert.match(fs.readFileSync(path.join(root, `database/schema/schema-${name}.sql`), 'utf8'), /rev VARCHAR\(50\) NULL DEFAULT NULL,/);
  }
});
