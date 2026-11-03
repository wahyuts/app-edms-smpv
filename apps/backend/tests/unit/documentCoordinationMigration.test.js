const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const directory = path.resolve(__dirname, '../../../../database/migration');
const prefix = '20261102_0001_permanent_delete_foundation';

test('engine-specific foundation migrations have equivalent complete logical DDL', () => {
  const mysql = fs.readFileSync(path.join(directory, `${prefix}_mysql.sql`), 'utf8');
  const maria = fs.readFileSync(path.join(directory, `${prefix}_mariadb.sql`), 'utf8');
  const ddl = (value) => value.slice(value.indexOf('CREATE TABLE')).replace(/\r\n/g, '\n');
  assert.equal(ddl(mysql), ddl(maria).replace(/\bPERSISTENT\b/g, 'STORED'));
  assert.equal((ddl(mysql).match(/CREATE TABLE /g) || []).length, 5);
  assert.doesNotMatch(ddl(mysql), /\b(?:ALTER|DROP|TRUNCATE|USE)\b/);
  assert.match(ddl(mysql), /uq_document_writer_temporary_claim/);
  assert.match(ddl(mysql), /uq_document_delete_identity/);
  assert.match(ddl(mysql), /uq_document_manifest_key/);
});

test('original preparation is retained as a non-executable legacy archive', () => {
  const archive = fs.readFileSync(path.join(directory, `${prefix}.sql`), 'utf8');
  assert.match(archive, /LEGACY PREPARATION ARCHIVE - NON-EXECUTABLE/);
  assert.ok(archive.split(/\r?\n/).every((line) => !line.trim() || line.startsWith('--')));
});

test('all four technical insert paths persist UTC explicitly rather than session defaults', () => {
  const source = ['documentCoordination.repository.js', 'documentGate.repository.js'].map((file) =>
    fs.readFileSync(path.resolve(__dirname, '../../src/repositories', file), 'utf8')).join('\n');
  for (const table of ['document_admission_coordinators', 'document_writer_operations', 'document_storage_io_steps', 'document_delete_operations']) {
    const insert = source.slice(source.indexOf(`INSERT INTO ${table}`)).split('`')[0];
    assert.match(insert, /created_at, updated_at/);
    assert.match(insert, /UTC_TIMESTAMP\(3\), UTC_TIMESTAMP\(3\)/);
  }
});
