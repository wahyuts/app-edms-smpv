const { AsyncLocalStorage } = require('node:async_hooks');
const { randomUUID, createHash } = require('node:crypto');
const repository = require('../repositories/documentCoordination.repository');
const { pool } = require('../config/database');
const logger = require('../config/logger');

const contexts = new AsyncLocalStorage();
const current = () => contexts.getStore();
const withContinuation = async (callback) => {
  const context = current();
  if (context?.closed) throw repository.conflict();
  if (context) context.pending += 1;
  try { return await callback(); } finally { if (context) context.pending -= 1; }
};
const tokenFor = (scope) => {
  const context = current();
  if (!context) return null;
  if (context.closed) throw repository.conflict();
  if (context.projectId !== scope.projectId || context.documentId !== scope.documentId) {
    throw Object.assign(new Error('Token operasi tidak sesuai dokumen.'), { statusCode: 409, code: 'DOCUMENT_WRITER_SCOPE_MISMATCH' });
  }
  return context.id || null;
};

const runWriter = async (scope, callback) => {
  if (current()) throw new Error('Nested business writer admission is not permitted');
  const context = { ...scope, id: randomUUID(), dbOutcome: 'NOT_STARTED', uncertain: false, closed: false, pending: 0 };
  await repository.admitWriter(context);
  return contexts.run(context, async () => {
    try {
      return await callback();
    } finally {
      context.closed = true;
      if (context.pending !== 0) context.uncertain = true;
      await repository.finishWriter({ id: context.id, scope: context,
        dbOutcome: context.dbOutcome, uncertain: context.uncertain }).catch(() => {
        // The durable ACTIVE record remains a blocker. Do not rewrite the business outcome.
        logger.error('[DOCUMENT_ADMISSION] Writer completion evidence could not be persisted');
      });
    }
  });
};

const trackIo = async ({ type, sourceKey, destinationKey, provider, requiresWriter = false }, callback) => withContinuation(async () => {
  const context = current();
  if (!context) {
    if (requiresWriter) throw new Error('Document storage mutation requires writer admission');
    return callback(); // Unbound temporary cleanup does not own a business document.
  }
  if (context.closed) throw repository.conflict();
  const id = randomUUID();
  await repository.recordIo({ id, writerId: context.id, type, sourceKey, destinationKey, provider });
  if (context.closed) throw repository.conflict();
  try {
    const result = await callback();
    await repository.finishIo({ id, state: 'SUCCEEDED', evidence: { acknowledged: true } }).catch(() => {
      context.uncertain = true;
      logger.error('[DOCUMENT_ADMISSION] Storage completion evidence could not be persisted');
    });
    return result;
  } catch (error) {
    context.uncertain = true;
    await repository.finishIo({ id, state: 'UNKNOWN', evidence: { code: error.code || error.name } }).catch(() => {});
    throw error;
  }
});

const guardTransaction = async (connection) => {
  const context = current();
  if (context?.documentId) await repository.assertGate(connection, context, tokenFor(context));
};
const guardBulkDocument = (connection, scope) => repository.assertGate(connection, scope);
const noteDbOutcome = (outcome) => {
  const context = current();
  if (context) {
    if (context.dbOutcome !== 'UNKNOWN') context.dbOutcome = outcome;
    if (outcome === 'UNKNOWN') context.uncertain = true;
  }
};

// Internal evidence is kept off the original error/public response, including frozen driver errors.
const transactionEvidenceByError = new WeakMap();
const getTransactionEvidence = (error) => transactionEvidenceByError.get(error);
const mutateWithEvidence = async (scope, callback) => {
  let connection, value, primaryError;
  let failed = false;
  const evidence = {
    phase: 'BEFORE_BEGIN', phases: ['BEFORE_BEGIN'], failurePhase: null,
    outcome: 'NOT_STARTED', beginAttempted: false, beginConfirmed: false,
    commitAttempted: false, commitConfirmed: false,
    rollbackAttempted: false, rollbackConfirmed: false, rollbackFailed: false,
    connectionDisposition: 'NONE', cleanupErrors: [],
  };
  const phase = (next) => { evidence.phase = next; evidence.phases.push(next); };
  const diagnostic = (operation, error) => {
    evidence.cleanupErrors.push(Object.freeze({ operation, code: error?.code || 'UNKNOWN' }));
  };
  try {
    connection = await pool.getConnection();
    phase('BEGIN_IN_PROGRESS');
    evidence.beginAttempted = true;
    evidence.outcome = 'UNKNOWN';
    await connection.beginTransaction();
    evidence.beginConfirmed = true;
    phase('TRANSACTION_ACTIVE');
    await repository.assertGate(connection, scope, tokenFor(scope));
    value = await callback(connection);
    phase('COMMIT_IN_PROGRESS');
    evidence.commitAttempted = true;
    await connection.commit();
    evidence.commitConfirmed = true;
    evidence.outcome = 'COMMITTED';
    phase('COMMIT_CONFIRMED');
  } catch (error) {
    failed = true;
    primaryError = error;
    evidence.failurePhase = evidence.phase;
    if (connection && evidence.beginAttempted) {
      phase('ROLLBACK_IN_PROGRESS');
      evidence.rollbackAttempted = true;
      try {
        await connection.rollback();
        evidence.rollbackConfirmed = true;
        phase('ROLLBACK_CONFIRMED');
        // Even an acknowledged ROLLBACK cannot disprove a previously attempted COMMIT.
        if (!evidence.commitAttempted) evidence.outcome = 'ROLLED_BACK';
      } catch (rollbackError) {
        evidence.rollbackFailed = true;
        diagnostic('rollback', rollbackError);
      }
    }
    if (evidence.outcome === 'UNKNOWN') {
      phase('OUTCOME_UNKNOWN');
      noteDbOutcome('UNKNOWN');
    }
  } finally {
    phase('CLEANUP');
    if (connection) {
      const discard = () => {
        try {
          connection.destroy();
          evidence.connectionDisposition = 'DESTROYED';
        } catch (destroyError) {
          evidence.connectionDisposition = 'DESTROY_FAILED';
          diagnostic('destroy', destroyError);
        }
      };
      if (evidence.outcome === 'UNKNOWN') discard();
      else {
        try {
          connection.release();
          evidence.connectionDisposition = 'RELEASED';
        } catch (releaseError) {
          diagnostic('release', releaseError);
          discard();
        }
      }
    }
  }
  const transactionEvidence = Object.freeze({ ...evidence,
    phases: Object.freeze(evidence.phases), cleanupErrors: Object.freeze(evidence.cleanupErrors) });
  if (evidence.cleanupErrors.length) {
    try {
      logger.error('[DOCUMENT_ADMISSION]', 'event=transaction_cleanup_error',
        `outcome=${evidence.outcome}`, `connectionDisposition=${evidence.connectionDisposition}`,
        ...evidence.cleanupErrors.map(item => `${item.operation}Code=${item.code}`));
    } catch { /* Diagnostics must not replace the primary error or a confirmed COMMIT. */ }
  }
  if (failed) {
    if (primaryError && ['object', 'function'].includes(typeof primaryError)) {
      transactionEvidenceByError.set(primaryError, transactionEvidence);
    }
    throw primaryError;
  }
  return { value, transactionEvidence };
};

const mutate = async (scope, callback, { transactionEvidence = false } = {}) => withContinuation(async () => {
  if (transactionEvidence === true) return mutateWithEvidence(scope, callback);
  const connection = await pool.getConnection();
  let committing = false;
  try {
    await connection.beginTransaction();
    await repository.assertGate(connection, scope, tokenFor(scope));
    const result = await callback(connection);
    committing = true;
    await connection.commit();
    return result;
  } catch (error) {
    if (committing) noteDbOutcome('UNKNOWN');
    await connection.rollback().catch(() => { noteDbOutcome('UNKNOWN'); });
    throw error;
  } finally {
    connection.release();
  }
});

const mutateSelected = async (select, callback) => withContinuation(async () => {
  const connection = await pool.getConnection();
  let committing = false;
  try {
    await connection.beginTransaction();
    const rows = await select(connection);
    const scopes = new Map();
    for (const row of rows) {
      if (row.related_resource_type === 'Document' && row.project_id && row.related_resource_id) {
        scopes.set(JSON.stringify([row.project_id, row.related_resource_id]),
          { projectId: row.project_id, documentId: row.related_resource_id });
      }
    }
    const orderedScopes = [...scopes.values()].sort((left, right) => {
      if (left.projectId !== right.projectId) return left.projectId < right.projectId ? -1 : 1;
      return left.documentId < right.documentId ? -1 : left.documentId > right.documentId ? 1 : 0;
    });
    for (const scope of orderedScopes) {
      await repository.assertGate(connection, scope, tokenFor(scope));
    }
    const result = await callback(connection, rows);
    committing = true;
    await connection.commit();
    return result;
  } catch (error) {
    if (committing) noteDbOutcome('UNKNOWN');
    await connection.rollback().catch(() => { noteDbOutcome('UNKNOWN'); });
    throw error;
  } finally { connection.release(); }
});

const assertReadable = async (scope) => repository.transaction(async (connection) => {
  await repository.assertGate(connection, scope, tokenFor(scope));
});

const documentWriter = (handler, type) => async (args) => {
  // These imports are lazy to avoid a repository/service initialization cycle.
  const documents = require('../repositories/document.repository');
  const memberships = require('../repositories/projectMembership.repository');
  const document = await documents.findDocumentFoundationById(args.documentId);
  if (!document) return handler(args); // Preserve existing not-found validation.
  const membership = await memberships.findActiveMembershipByProjectAndUser({
    projectId: document.projectId, userId: args.actorUserId,
  });
  if (!membership) return handler(args); // Existing handler owns authorization errors.
  const context = current();
  if (context) {
    if (context.closed || context.type !== 'EDIT_DOCUMENT' || type !== 'ADMIN_EDIT'
      || context.delegated || context.actorUserId !== args.actorUserId || context.payload !== args.payload
      || context.documentId !== document.id || context.projectId !== document.projectId) throw repository.conflict();
    context.delegated = true;
    return handler(args);
  }
  return runWriter({ projectId: document.projectId, documentId: document.id, type,
    actorUserId: args.actorUserId, payload: args.payload,
    temporaryFileId: args.temporaryFileId || args.payload?.temporaryFileId || null }, () => handler(args));
};

const reserveDelete = async ({ activeProject, actorUserId, documentId, requestIdentity, reason }) => {
  const documents = require('../repositories/document.repository');
  const memberships = require('../repositories/projectMembership.repository');
  if (!actorUserId) throw Object.assign(new Error('Silakan login terlebih dahulu.'), { statusCode: 401 });
  const document = await documents.findDocumentFoundationById(documentId);
  if (!document) throw Object.assign(new Error('Dokumen tidak ditemukan.'), { statusCode: 404 });
  const membership = await memberships.findActiveMembershipByProjectAndUser({ projectId: document.projectId, userId: actorUserId });
  if (!membership || membership.officialRole !== 'Admin' || activeProject?.id !== document.projectId) {
    throw Object.assign(new Error('Akses ditolak.'), { statusCode: 403 });
  }
  if (typeof requestIdentity !== 'string' || !requestIdentity.trim() || requestIdentity.length > 255) {
    throw Object.assign(new Error('Identitas permintaan tidak valid.'), { statusCode: 422 });
  }
  if (reason != null && (typeof reason !== 'string' || reason.length > 1000)) {
    throw Object.assign(new Error('Alasan permintaan tidak valid.'), { statusCode: 422 });
  }
  return repository.reserve({ id: randomUUID(), projectId: document.projectId, documentId,
    documentNumber: document.documentNumber, userId: actorUserId, reason,
    requestIdentity: createHash('sha256').update(requestIdentity).digest('hex') });
};

module.exports = { current, runWriter, documentWriter, trackIo, guardTransaction, noteDbOutcome,
  mutate, getTransactionEvidence, mutateSelected, withContinuation, guardBulkDocument, assertReadable, reserveDelete,
  evaluateQuiescence: repository.evaluateQuiescence };
