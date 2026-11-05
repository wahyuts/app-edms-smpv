const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const asyncHooks = require('node:async_hooks');

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

const fixture = (state = {}) => {
  Object.assign(state, { gates: state.gates || new Map(), writers: state.writers || new Map(),
    io: state.io || new Map(), operations: state.operations || new Map(), trace: state.trace || [] });
  const locks = new Map();
  const acquire = async (connection, key) => {
    if (connection.locks.has(key)) return;
    const previous = locks.get(key) || Promise.resolve();
    const next = deferred();
    locks.set(key, previous.then(() => next.promise));
    await previous;
    connection.locks.set(key, next.resolve);
  };
  const release = (connection) => {
    for (const done of connection.locks.values()) done();
    connection.locks.clear();
  };
  const copy = (rows) => [structuredClone(rows)];
  const connection = () => ({
    locks: new Map(),
    async beginTransaction() {},
    async commit() { release(this); if (this.failCommit) throw new Error('COMMIT ACK lost'); },
    async rollback() { release(this); },
    release() { release(this); },
    async execute(raw, p = []) {
      const sql = raw.replace(/\s+/g, ' ').trim();
      state.trace.push(sql);
      if (sql.startsWith('INSERT INTO document_admission_coordinators')) {
        const key = `${p[0]}:${p[1]}`;
        await acquire(this, key);
        if (!state.gates.has(key)) state.gates.set(key, { project_id: p[0], document_id: p[1], gate_state: 'OPEN', generation: 1 });
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('SELECT * FROM document_admission_coordinators')) {
        await acquire(this, `${p[0]}:${p[1]}`);
        return copy([state.gates.get(`${p[0]}:${p[1]}`)]);
      }
      if (sql.startsWith('SELECT lifecycle_state, generation')) {
        const writer = state.writers.get(p[0]);
        return copy(writer && writer.project_id === p[1] && writer.document_id === p[2] ? [writer] : []);
      }
      if (sql.startsWith('INSERT INTO document_writer_operations')) {
        if (p[5]) {
          await acquire(this, `temp:${p[5]}`);
          if ([...state.writers.values()].some((w) => w.temporary_file_id === p[5] && w.lifecycle_state !== 'SETTLED')) {
            throw Object.assign(new Error('Temporary file already claimed'), { code: 'ER_DUP_ENTRY' });
          }
        }
        state.writers.set(p[0], { id: p[0], project_id: p[1], document_id: p[2], writer_type: p[3],
          generation: p[4], temporary_file_id: p[5], lifecycle_state: 'ACTIVE', db_outcome: 'NOT_STARTED' });
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('SELECT lifecycle_state FROM document_writer_operations') || sql.startsWith('SELECT id FROM document_writer_operations WHERE id =')) {
        await acquire(this, `writer:${p[0]}`);
        return copy(state.writers.has(p[0]) ? [state.writers.get(p[0])] : []);
      }
      if (sql.startsWith('INSERT INTO document_storage_io_steps')) {
        if (state.failRecordIo) throw new Error('Intent persistence failed');
        state.io.set(p[0], { id: p[0], writer_id: p[1], provider: p[2], operation_type: p[3],
          source_key: p[4], destination_key: p[5], state: 'IN_FLIGHT' });
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('UPDATE document_storage_io_steps')) {
        if (state.failFinishIo) throw new Error('IO completion persistence failed');
        Object.assign(state.io.get(p[2]), { state: p[0], evidence: p[1] });
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('SELECT id FROM document_storage_io_steps')) {
        return copy([...state.io.values()].filter((io) => io.writer_id === p[0] && io.state !== 'SUCCEEDED'));
      }
      if (sql.startsWith('UPDATE document_writer_operations')) {
        if (state.failFinishWriter) throw new Error('Writer completion persistence failed');
        Object.assign(state.writers.get(p[3]), { lifecycle_state: p[0], db_outcome: p[1], completion_evidence: p[2] });
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('SELECT * FROM document_delete_operations WHERE project_id')) {
        return copy([...state.operations.values()].filter((o) => o.project_id === p[0] && o.document_id === p[1] && o.request_identity === p[2]));
      }
      if (sql.startsWith('INSERT INTO document_delete_operations')) {
        assert.ok(![...state.operations.values()].some((o) => o.project_id === p[1] && o.document_id === p[2]));
        state.operations.set(p[0], { id: p[0], project_id: p[1], document_id: p[2], document_number_snapshot: p[3],
          initiated_by_user_id: p[4], reason: p[5], request_identity: p[6], status: 'QUIESCENCE_PENDING' });
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('UPDATE document_admission_coordinators')) {
        Object.assign(state.gates.get(`${p[1]}:${p[2]}`), { gate_state: 'CLOSED', delete_operation_id: p[0] });
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('SELECT * FROM document_delete_operations WHERE id') || sql.startsWith('SELECT status FROM document_delete_operations')) {
        return copy(state.operations.has(p[0]) ? [state.operations.get(p[0])] : []);
      }
      if (sql.startsWith('SELECT id FROM document_writer_operations WHERE project_id')) {
        return copy([...state.writers.values()].filter((w) => w.project_id === p[0] && w.document_id === p[1]
          && (w.lifecycle_state !== 'SETTLED' || !w.completion_evidence
            || !['NOT_STARTED', 'COMMITTED', 'ROLLED_BACK'].includes(w.db_outcome))));
      }
      if (sql.startsWith('SELECT s.id FROM document_storage_io_steps')) {
        return copy([...state.io.values()].filter((io) => {
          const writer = state.writers.get(io.writer_id);
          return writer.project_id === p[0] && writer.document_id === p[1] && io.state !== 'SUCCEEDED';
        }));
      }
      if (sql.startsWith('UPDATE document_delete_operations')) {
        Object.assign(state.operations.get(p[2]), { status: p[0], pending_metadata: p[1] });
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('SELECT * FROM notifications')) return copy(state.notificationRows || []);
      if (sql.startsWith('SELECT id FROM engineering_documents')) return copy(state.documentRows || []);
      if (sql.startsWith('UPDATE engineering_documents')) {
        state.archived = true;
        return [{ affectedRows: (state.documentRows || []).length }];
      }
      if (sql.startsWith('UPDATE projects') || sql.startsWith('UPDATE user_project_preferences')) return [{ affectedRows: 1 }];
      if (sql.includes('FROM projects') && sql.startsWith('SELECT')) return copy([{ id: 'P1', status: 'Closed' }]);
      if (/^(INSERT INTO document_sla_evaluations|INSERT IGNORE INTO (notifications|audit_trail|comment_read_receipts)|UPDATE notifications|DELETE FROM notifications)/.test(sql)) {
        state.trace.push('OWNED MUTATION');
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('TEST MUTATION')) { state.trace.push('MUTATION'); return [{ affectedRows: 1 }]; }
      throw new Error(`Unimplemented isolated SQL: ${sql}`);
    },
  });
  const createPool = (limit = Infinity) => {
    let active = 0; const waiting = [];
    const stats = { maxActive: 0 };
    const getConnection = async () => {
      if (active >= limit) {
        const waiter = deferred(); waiting.push(waiter); await waiter.promise;
      } else active += 1;
      stats.maxActive = Math.max(stats.maxActive, active);
      const c = connection(); const close = c.release.bind(c); let released = false;
      c.release = () => {
        close();
        if (!released) {
          released = true;
          if (waiting.length) waiting.shift().resolve(); else active -= 1;
        }
      };
      return c;
    };
    return { getConnection, stats, execute: async (...args) => {
      const c = await getConnection();
      try { return await c.execute(...args); } finally { c.release(); }
    } };
  };
  const pool = createPool(state.businessLimit);
  const evidencePool = createPool(state.evidenceLimit);
  const root = path.resolve(__dirname, '../../src');
  const cache = new Map();
  const documents = { findDocumentFoundationById: async (id) => state.missing ? null : ({ id, projectId: state.documentProject || 'P1', documentNumber: 'PFD-1' }) };
  const memberships = { findActiveMembershipByProjectAndUser: async ({ userId }) => userId && state.role !== null
    ? { officialRole: state.role || 'Admin' } : null };
  const driver = { name: state.provider || 'r2', finalize: async () => {}, move: async () => {},
    copy: async () => {}, delete: async () => {}, deleteTemporary: async () => {}, exists: async () => true };
  const mocks = new Map([
    ['config/database.js', { pool }], ['config/documentCoordinationDatabase.js', { pool: evidencePool }],
    ['config/logger.js', { error() {}, log() {} }], ['config/storage.js', {}],
    ['repositories/document.repository.js', documents], ['repositories/projectMembership.repository.js', memberships],
    ['storage/storageDriver.factory.js', { createStorageDriver: () => driver }],
    ['storage/storage.errors.js', { normalizeStorageError: (error) => error }],
    ['constants/storage.constants.js', { STORAGE_DIRECTORIES: {} }],
    ['validators/storage.validator.js', { validateStorageKey: (key) => key }],
  ]);
  const allowed = new Set(['services/documentAdmission.service.js', 'repositories/documentCoordination.repository.js',
    'repositories/documentGate.repository.js', 'services/storage.service.js', 'utils/storageNamespace.js']);
  const load = (file) => {
    if (mocks.has(file)) return mocks.get(file);
    assert.ok(allowed.has(file), `Blocked runtime module: ${file}`);
    if (cache.has(file)) return cache.get(file).exports;
    const filename = path.join(root, file);
    const module = { exports: {} }; cache.set(file, module);
    const requireIsolated = (request) => {
      if (request === 'node:crypto') return crypto;
      if (request === 'node:async_hooks') return asyncHooks;
      assert.ok(request.startsWith('.'), `Blocked runtime dependency: ${request}`);
      return load(path.relative(root, path.resolve(path.dirname(filename), `${request}.js`)).split(path.sep).join('/'));
    };
    new vm.Script(fs.readFileSync(filename, 'utf8'), { filename }).runInNewContext({
      module, exports: module.exports, require: requireIsolated, Date, Buffer,
    });
    return module.exports;
  };
  return { state, pool, evidencePool, driver, load, documents, memberships,
    service: load('services/documentAdmission.service.js'), repository: load('repositories/documentCoordination.repository.js'),
    storage: load('services/storage.service.js') };
};

module.exports = { fixture, deferred };
