const coordination = require('../../src/repositories/documentCoordination.repository');
const { pool: evidencePool } = require('../../src/config/documentCoordinationDatabase');
const { pool } = require('../../src/config/database');

// Business regression fixtures replace coordination only; dedicated admission tests
// exercise the real coordinator/service with fully isolated persistence doubles.
module.exports = (t, documents, getDocument) => {
  // Upload provenance has its own storage/transaction fault-injection tests.
  t.mock.method(documents, 'completeStoredFileProvenance', async () => {});
  for (const method of ['execute', 'query', 'getConnection']) {
    t.mock.method(evidencePool, method, async () => { throw new Error('Live evidence database access prohibited'); });
  }
  t.mock.method(documents, 'findDocumentFoundationById', async () => structuredClone(getDocument()));
  t.mock.method(coordination, 'admitWriter', async (writer) => writer.id);
  t.mock.method(coordination, 'finishWriter', async () => true);
  t.mock.method(coordination, 'assertGate', async () => ({ gate_state: 'OPEN', generation: 1 }));
  t.mock.method(coordination, 'transaction', async (callback) => callback({}));
  t.mock.method(pool, 'getConnection', async () => ({
    beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {},
    execute: (...args) => pool.execute(...args),
  }));
};
