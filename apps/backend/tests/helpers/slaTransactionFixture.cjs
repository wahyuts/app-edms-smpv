const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { AsyncLocalStorage } = require('node:async_hooks');

const root = path.resolve(__dirname, '../../src');
const allowed = new Set([
  'services/slaNotificationProducer.service.js', 'services/notification.service.js', 'services/audit.service.js',
  'services/notificationSuppressionPolicy.service.js', 'services/documentAdmission.service.js',
  'repositories/sla.repository.js', 'repositories/notification.repository.js', 'repositories/notificationWrite.repository.js',
  'repositories/audit.repository.js', 'repositories/projectMembership.repository.js', 'repositories/document.repository.js',
  'utils/administration.js', 'utils/slaCycle.js', 'utils/jsonMetadata.js',
  'constants/administration.constants.js', 'constants/realtime.constants.js',
]);

const now = '2026-11-08T12:00:00.000Z';
const document = (id = 'D1', patch = {}) => ({ id, projectId: 'P1', documentNumber: id,
  lifecycle: 'Active', projectStatus: 'Active', activeRevisionId: 'R1', activeFileId: 'F1', responsibleRole: 'Team Process',
  status: 'Process Review', revision: 'IFR-Submitted', slaStartedAt: '2026-11-01T12:00:00.000Z',
  daysUntilValidation: 3, currentAssigneeUserId: 7, ...patch });

// Real service/repository code, staged in-memory SQL, and actual admission.mutate().
// Only allowlisted modules load; env, mysql2, storage, network, and server startup are blocked.
const fixture = (options = {}) => {
  let committed = { notifications: [], evaluations: [], audits: [] };
  const trace = [], sqlCalls = [], events = [], logs = [], connections = [], publications = [], guards = [], backoffs = [];
  const evaluationOwners = new AsyncLocalStorage();
  let nextEvaluation = 0;
  const control = { ...options };
  const docs = options.documents || [document()];
  let acquisitions = 0, activeConnections = 0, counter = 0;
  let connectionQueue = Promise.resolve();
  const duplicate = () => Object.assign(new Error('synthetic duplicate'), { code: 'ER_DUP_ENTRY' });
  const fail = (phase, payload) => {
    const injected = control.fail?.(phase, payload);
    if (injected instanceof Error) throw injected;
    if (control.failure === phase || injected) {
      throw Object.assign(new Error(`synthetic ${phase}`), { code: 'SYNTHETIC_WRITE_FAILURE' });
    }
  };
  const execute = async (state, sql, values = [], inTransaction, connectionId = null) => {
    assert.ok(values.every(value => value !== undefined), 'mysql2 does not accept undefined bind parameters');
    const normalized = sql.replace(/\s+/g, ' ').trim();
    sqlCalls.push({ sql: normalized, values: [...values], inTransaction, connectionId });
    if (normalized.includes('AS evaluation_server_now')) {
      assert.equal(inTransaction, true);
      assert.ok(trace.includes(`gate:${values[0]}`), 'Reload must follow the coordinator guard');
      assert.doesNotMatch(normalized, /FOR UPDATE|sla_started_at IS NOT NULL/);
      assert.match(normalized, /WHERE documents\.id = \? AND documents\.project_id = \?/);
      trace.push(`reload:${values[0]}`); fail('reload');
      const current = docs.find(d => d.id === values[0] && d.projectId === values[1]);
      if (!current) return [[]];
      return [[{
        id: current.id, project_id: current.projectId, document_number: current.documentNumber,
        workflow_status: current.status, lifecycle_status: current.lifecycle, revision_label: current.revision,
        responsible_role: current.responsibleRole, current_assignee_user_id: current.currentAssigneeUserId,
        active_revision_id: current.activeRevisionId, active_file_id: current.activeFileId,
        sla_started_at: current.slaStartedAt, days_until_validation: current.daysUntilValidation,
        notification_eligible: current.lifecycle.toLowerCase() === 'active' && current.status.toLowerCase() !== 'approved'
          && current.projectStatus.trim().toLowerCase() === 'active' ? 1 : 0,
        evaluation_server_now: Object.hasOwn(control, 'dbTime') ? control.dbTime : now,
      }]];
    }
    if (normalized.includes('FROM project_memberships')) {
      fail('recipients');
      assert.match(normalized, /project_memberships\.status\)\) = 'active'/);
      assert.match(normalized, /users\.status\)\) = 'active'/);
      assert.match(normalized, /projects\.status\)\) = 'active'/);
      assert.ok(docs.some(doc => doc.projectId === values[0]));
      assert.deepEqual(Array.from(values.slice(1)), ['admin', 'document owner', 'team process', 'team project']);
      return [values.slice(1).map((role, n) => ({ id: `M${n}`, user_id: n + 1, project_id: values[0], official_role: role,
        status: 'Active', user_status: 'Active', project_status: 'Active' }))];
    }
    if (normalized.includes('FROM document_sla_evaluations')) {
      fail('evaluation-read');
      const rows = state.evaluations.filter(row => row.document_id === values[0]);
      return [normalized.includes('cycle_id = ?') ? rows.filter(row => row.cycle_id === values[1]) : rows.slice(-1)];
    }
    if (/^SELECT id FROM (notifications|audit_trail)/.test(normalized)) {
      const rows = normalized.includes('FROM notifications') ? state.notifications : state.audits;
      return [rows.filter(row => row.identity_key === values[0]).map(row => ({ id: row.id }))];
    }
    if (normalized.includes('FROM notifications') && normalized.includes('WHERE event_type')) {
      return [state.notifications.filter(row => row.event_type === values[0] && row.project_id === values[1]
        && row.recipient_user_id === values[2] && row.related_resource_id === values[3])];
    }
    if (/^INSERT (?:IGNORE )?INTO notifications/.test(normalized)) {
      assert.ok(values[1].length <= 255, 'Notification identity must fit canonical VARCHAR(255)');
      trace.push(`notification:${values[3]}`);
      fail(`recipient-${values[3]}`, values);
      if (control.collision === 'notification') throw duplicate();
      const existing = state.notifications.find(row => row.identity_key === values[1]);
      if (existing) {
        if (normalized.startsWith('INSERT IGNORE')) return [{ affectedRows: 0 }];
        throw duplicate();
      }
      state.notifications.push({ id: values[0], identity_key: values[1], project_id: values[2], recipient_user_id: values[3],
        event_type: values[5], title: values[6], message: values[7], official_role: values[9],
        related_resource_id: values[12], metadata: JSON.parse(values[15]) });
      return [{ affectedRows: 1 }];
    }
    if (normalized.startsWith('INSERT INTO document_sla_evaluations')) {
      trace.push('evaluation'); fail('evaluation-write', values);
      const existing = state.evaluations.find(row => row.document_id === values[2] && row.cycle_id === values[3]);
      if (existing) existing.current_state = values[4];
      else state.evaluations.push({ id: values[0], project_id: values[1], document_id: values[2], cycle_id: values[3],
        current_state: values[4], notified_states: values[5], updated_at: now });
      return [{ affectedRows: 1 }];
    }
    if (/^INSERT (?:IGNORE )?INTO audit_trail/.test(normalized)) {
      trace.push('audit'); fail('audit');
      if (control.collision === 'audit') throw duplicate();
      if (state.audits.some(row => row.identity_key === values[1])) {
        if (normalized.startsWith('INSERT IGNORE')) return [{ affectedRows: 0 }];
        throw duplicate();
      }
      state.audits.push({ id: values[0], identity_key: values[1], project_id: values[2], actor_name: values[4],
        action: values[7], business_event: values[8], detail: values[9], resource_type: values[10],
        resource_id: values[11], metadata: JSON.parse(values[13]) });
      return [{ affectedRows: 1 }];
    }
    throw new Error(`Unexpected synthetic SQL: ${normalized}`);
  };
  const pool = {
    async getConnection() {
      let unlock;
      if (control.serializeTransactions) {
        const previous = connectionQueue;
        connectionQueue = new Promise(resolve => { unlock = resolve; });
        await previous;
      }
      assert.equal(activeConnections, 0, 'No nested transaction or extra pool connection');
      acquisitions++;
      try { fail('acquire'); } catch (error) { unlock?.(); throw error; }
      activeConnections++;
      const history = { id: acquisitions, owner: evaluationOwners.getStore(), disposed: false,
        committed: false, rolledBack: false, notificationIds: [] };
      connections.push(history);
      let staged = null;
      let disposed = false;
      const dispose = (operation) => {
        assert.equal(disposed, false, 'Connection must not be disposed twice');
        trace.push(operation); fail(operation);
        disposed = true; history.disposed = true; history.disposition = operation;
        staged = null; activeConnections--; unlock?.();
      };
      return {
        async beginTransaction() { trace.push('begin'); staged = structuredClone(committed); fail('begin'); },
        async execute(sql, values) {
          assert.ok(staged);
          const result = await execute(staged, sql, values, true, history.id);
          history.notificationIds = staged.notifications.filter(row => !committed.notifications.some(old => old.id === row.id)).map(row => row.id);
          return result;
        },
        async query(sql, values) { assert.ok(staged); return execute(staged, sql, values, true, history.id); },
        async commit() {
          trace.push('commit-attempt'); fail('commit');
          await control.beforeCommit?.(history.id);
          committed = structuredClone(staged); staged = null;
          history.committed = true;
          if (control.failure === 'commit-ack-unknown') throw new Error('synthetic unknown COMMIT acknowledgement');
          trace.push('committed');
          await control.afterCommit?.();
        },
        async rollback() { trace.push('rollback'); fail('rollback'); staged = null; history.rolledBack = true; },
        release() { dispose('release'); },
        destroy() { dispose('destroy'); },
      };
    },
    async execute(sql, values) {
      assert.ok(control.allowPool, 'SLA transaction must not use the global pool executor');
      return execute(committed, sql, values, false);
    },
  };
  const mocks = new Map([
    ['config/database.js', { pool }],
    ['config/logger.js', { log(...args) { logs.push(args.join(' ')); }, error(...args) { logs.push(args.join(' ')); } }],
    ['services/time.service.js', { async getServerTime() { return { serverNow: now }; } }],
    ['repositories/documentCoordination.repository.js', {
      async assertGate(c, scope, token) {
        assert.equal(activeConnections, 1); trace.push(`gate:${scope.documentId}`); fail('gate');
        guards.push({ ...scope, token });
        await control.afterGate?.(scope);
      },
      async admitWriter() { trace.push('admitted'); },
      async finishWriter(value) { trace.push(`settled:${value.dbOutcome}`); },
    }],
    ['services/realtimePublisher.service.js', { publishSafely(payload) {
      if (!control.serializeTransactions) assert.equal(activeConnections, 0, 'SSE must run after transaction release');
      assert.ok(committed.notifications.some(row => row.id === payload.resourceId), 'SSE cannot reference uncommitted rows');
      const origin = connections.find(connection => connection.notificationIds.includes(payload.resourceId));
      if (origin) { assert.equal(origin.committed, true); assert.equal(origin.disposed, true); }
      publications.push({ notificationId: payload.resourceId, connectionId: origin?.id, disposed: origin?.disposed,
        committed: origin?.committed });
      trace.push('sse'); events.push(payload);
      if (control.failure === 'sse') throw new Error('synthetic SSE failure');
      return { published: true };
    } }],
  ]);
  const cache = new Map();
  const load = file => {
    if (mocks.has(file)) return mocks.get(file);
    assert.ok(allowed.has(file), `Blocked production dependency: ${file}`);
    if (cache.has(file)) return cache.get(file).exports;
    const filename = path.join(root, file), module = { exports: {} };
    cache.set(file, module);
    new vm.Script(fs.readFileSync(filename, 'utf8'), { filename }).runInNewContext({
      module, exports: module.exports, Date, Buffer,
      setTimeout(resolve, delay) {
        // Another evaluation may own a lease; only this retry's leases must be released.
        const owner = evaluationOwners.getStore();
        const held = owner ? connections.filter(connection => connection.owner === owner && !connection.disposed).length : activeConnections;
        assert.equal(held, 0, 'Retry delay must not hold its own connection/lock');
        backoffs.push({ owner, delay, held, otherActive: activeConnections });
        trace.push(`delay:${delay}`);
        control.onDelay?.(delay);
        if (control.holdDelay) Promise.resolve(control.holdDelay(delay)).then(resolve);
        else resolve();
      },
      require(name) {
        if (name === 'node:crypto') return { ...crypto, randomUUID: () => `fixture-${++counter}` };
        if (name === 'node:async_hooks') return { AsyncLocalStorage };
        assert.ok(name.startsWith('.'), `Blocked external dependency: ${name}`);
        return load(path.relative(root, path.resolve(path.dirname(filename), `${name}.js`)).split(path.sep).join('/'));
      },
    });
    return module.exports;
  };
  const documents = load('repositories/document.repository.js');
  documents.getSlaScanBoundary = async () => docs.at(-1)?.id ?? null;
  documents.listSlaScanCandidates = async ({ afterId, limit }) => docs.filter(d => afterId == null || d.id > afterId).slice(0, limit);
  documents.findSlaScanDocument = async ({ id }) => structuredClone(docs.find(d => d.id === id) || null);
  return { load, control, trace, sqlCalls, events, logs, pool, connections, publications, guards, backoffs, documents: docs,
    get state() { return committed; }, get acquisitions() { return acquisitions; },
    get activeConnections() { return activeConnections; },
    evaluate: doc => evaluationOwners.run({ id: ++nextEvaluation }, () => load('services/slaNotificationProducer.service.js').evaluateDocumentForSlaNotifications({
      document: structuredClone(doc || docs[0]), serverNow: now, triggerSource: 'fixture',
    })),
  };
};

module.exports = { fixture, document, now };
