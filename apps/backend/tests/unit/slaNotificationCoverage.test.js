const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.resolve(__dirname, '../../src');
// Every dependency is explicit: database/env/network modules cannot be loaded.
const load = (file, dependencies = {}, globals = {}) => {
  const module = { exports: {} };
  new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file }).runInNewContext({
    module, exports: module.exports, Date, Buffer,
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Blocked dependency: ${name}`);
      return dependencies[name];
    },
    ...globals,
  });
  return module.exports;
};
const logger = { log() {}, error() {} };
const now = '2026-11-08T12:00:00.000Z';
const row = (id, project = 'P1') => ({
  id, project_id: project, project_status: 'Active', lifecycle_status: 'Active',
  workflow_status: 'Process Review', revision_label: 'IFR-Submitted',
  active_revision_id: `R-${id}`, active_file_id: `F-${id}`, responsible_role: 'Team Process',
  document_number: id, sla_started_at: '2026-11-01T12:00:00.000Z',
  days_until_validation: 3, current_assignee_user_id: 1,
});
const idAt = (n) => `D${String(n).padStart(6, '0')}`;
const eligible = (r) => r.lifecycle_status === 'Active' && r.workflow_status !== 'Approved'
  && r.sla_started_at != null && r.project_status.trim().toLowerCase() === 'active';

const fixture = (count = 0) => {
  const rows = Array.from({ length: count }, (_, n) => row(idAt(n + 1), `P${n % 3}`));
  const calls = [], evaluated = [], writes = [], sent = [], audits = [], logs = [];
  const hooks = {};
  let fetches = 0;
  const pool = { async execute(sql, args = []) {
    calls.push({ sql, args: [...args] });
    assert.doesNotMatch(sql, /\b(?:INSERT|UPDATE|DELETE|ALTER|OFFSET)\b/i);
    if (sql.includes('AS evaluation_server_now')) {
      assert.match(sql, /UTC_TIMESTAMP\(3\)/);
      assert.doesNotMatch(sql, /sla_started_at IS NOT NULL/);
      return [rows.filter(r => r.id === args[0] && r.project_id === args[1]).map(r => ({
        ...r,
        notification_eligible: r.lifecycle_status === 'Active' && r.workflow_status !== 'Approved'
          && r.project_status.trim().toLowerCase() === 'active' ? 1 : 0,
        evaluation_server_now: Object.hasOwn(hooks, 'serverNow') ? hooks.serverNow : now,
      }))];
    }
    assert.match(sql, /documents\.lifecycle_status = 'Active'/);
    assert.match(sql, /documents\.workflow_status <> 'Approved'/);
    assert.match(sql, /documents\.sla_started_at IS NOT NULL/);
    assert.match(sql, /LOWER\(TRIM\(projects\.status\)\) = 'active'/);
    if (sql.includes('MAX(documents.id)')) {
      const ids = rows.filter(eligible).map(r => r.id).sort();
      return [[{ high_water_id: ids.at(-1) ?? null }]];
    }
    if (sql.includes('ORDER BY documents.id ASC')) {
      fetches += 1;
      await hooks.beforeFetch?.(fetches, args);
      const [highWaterId] = args;
      const afterId = args.length === 3 ? args[1] : null;
      const limit = args.at(-1);
      const selected = rows.filter(r => eligible(r) && r.id <= highWaterId && (afterId == null || r.id > afterId))
        .sort((a, b) => a.id.localeCompare(b.id)).slice(0, limit)
        .map(r => ({ id: r.id, project_id: r.project_id }));
      await hooks.afterFetch?.(fetches, selected);
      return [selected];
    }
    assert.match(sql, /documents\.id = \? AND documents\.project_id = \?/);
    await hooks.beforeDetail?.(args[0]);
    return [rows.filter(r => r.id === args[0] && r.project_id === args[1] && eligible(r))];
  } };
  const repository = load('repositories/document.repository.js', {
    '../config/database': { pool }, '../config/logger': logger, '../services/documentAdmission.service': {},
  });
  const notification = {
    NOTIFICATION_EVENT_TYPE: { SLA_OVERDUE: 'SLA_OVERDUE', SLA_AT_RISK: 'SLA_AT_RISK' },
    async createSlaStateNotifications(payload) {
      sent.push(payload);
      return { attemptedRecipientCount: 1, createdCount: 1 };
    },
  };
  const policy = load('services/notificationSuppressionPolicy.service.js', { './notification.service': notification });
  const cycle = load('utils/slaCycle.js');
  const producer = load('services/slaNotificationProducer.service.js', {
    '../repositories/document.repository': repository,
    '../repositories/sla.repository': {
      async runInTransaction(scope, callback, options) {
        await hooks.afterLock?.(scope);
        const value = await callback(pool);
        return options?.transactionEvidence
          ? { value, transactionEvidence: { commitConfirmed: true, outcome: 'COMMITTED' } } : value;
      },
      async findLatestSlaEvaluationByDocument({ documentId }) {
        evaluated.push(documentId);
        await hooks.evaluate?.(documentId);
        return hooks.previous?.(documentId) ?? null;
      },
      async findSlaEvaluationByCycle() { return null; },
      async upsertSlaEvaluation(payload) { writes.push(payload); },
    },
    './notification.service': notification,
    './notificationSuppressionPolicy.service': policy,
    './audit.service': { async recordActivity(payload) { audits.push(payload); } },
    './time.service': { async getServerTime() {
      await hooks.clock?.();
      return { serverNow: Object.hasOwn(hooks, 'serverNow') ? hooks.serverNow : now };
    } },
    '../config/logger': { log(...args) { logs.push(args.join(' ')); }, error(...args) { logs.push(args.join(' ')); } },
    '../utils/administration': { createEntityId: () => 'synthetic' }, '../utils/slaCycle': cycle,
  });
  return { producer, repository, rows, calls, hooks, evaluated, writes, sent, audits, logs };
};

for (const count of [0, 1, 50, 199, 200, 201, 500, 1200, 5000]) {
  test(`full scan covers ${count} eligible candidates across projects`, async () => {
    const f = fixture(count);
    const result = await f.producer.runScheduledEvaluation();
    assert.equal(result.processedCount, count);
    assert.equal(result.succeededCount, count);
    assert.equal(result.createdCount, count);
    assert.equal(result.failedCount, 0);
    assert.equal(result.batchCount, Math.ceil(count / 200));
    assert.equal(result.traversalComplete, true);
    assert.equal(result.evaluationComplete, true);
    assert.deepEqual(f.evaluated, f.rows.map(r => r.id));
    assert.equal(new Set(f.evaluated).size, count);
    assert.ok(result.results.length <= 200);
    assert.equal(result.resultsTruncated, count > 200);
    const queries = f.calls.filter(c => c.sql.includes('ORDER BY documents.id ASC'));
    for (let n = 1; n < queries.length; n++) {
      assert.equal(queries[n].args[1], idAt(Math.min(n * 200, count)));
    }
    if (count >= 3) assert.equal(new Set(f.sent.map(p => p.document.projectId)).size, 3);
  });
}

test('candidate query is narrow, parameterized, unique by PK join, and collation-consistent', async () => {
  const f = fixture(3);
  await f.repository.listSlaScanCandidates({ afterId: 'D000001', highWaterId: 'D000003', limit: 2 });
  const { sql, args } = f.calls[0];
  assert.match(sql, /SELECT documents\.id, documents\.project_id\s+FROM/);
  assert.match(sql, /INNER JOIN projects ON projects\.id = documents\.project_id/);
  assert.equal((sql.match(/JOIN/g) || []).length, 1);
  assert.doesNotMatch(sql, /stored_files|workflow_comments|users|BINARY|COLLATE|OFFSET/);
  assert.match(sql, /documents\.id <= \?/);
  assert.match(sql, /documents\.id > \?/);
  assert.match(sql, /ORDER BY documents\.id ASC\s+LIMIT \?/);
  assert.deepEqual(args, ['D000003', 'D000001', 2]);
  const schema = fs.readFileSync(path.resolve(root, '../../../database/schema/schema-dev.sql'), 'utf8');
  const documents = schema.slice(schema.indexOf('CREATE TABLE engineering_documents'), schema.indexOf('CREATE TABLE stored_files'));
  assert.match(documents, /PRIMARY KEY \(id\)/);
  assert.match(documents, /COLLATE=utf8mb4_unicode_ci/);
  assert.match(schema.slice(schema.indexOf('CREATE TABLE projects')), /PRIMARY KEY \(id\)/);
});

for (const [input, expected] of [[undefined, 200], [0, 200], [-1, 1], [1001, 1000], ['5', 5]]) {
  test(`existing batch safety bound: ${input}`, async () => {
    const f = fixture(1);
    await f.repository.listSlaScanCandidates({ highWaterId: 'D000001', limit: input });
    assert.equal(f.calls[0].args.at(-1), expected);
  });
}

test('empty boundary performs no candidate fetch or clock read', async () => {
  const f = fixture();
  assert.equal((await f.producer.runScheduledEvaluation()).highWaterId, null);
  assert.equal(f.calls.length, 1);
});

test('all original eligibility conditions remain enforced globally', async () => {
  const f = fixture(6);
  f.rows[0].workflow_status = 'Approved';
  f.rows[1].lifecycle_status = 'Archived';
  f.rows[2].sla_started_at = null;
  f.rows[3].project_status = 'Inactive';
  f.rows[4].project_status = ' Active ';
  const result = await f.producer.runScheduledEvaluation();
  assert.equal(result.processedCount, 2);
  assert.deepEqual(f.evaluated, [idAt(5), idAt(6)]);
});

for (const scenario of ['above boundary', 'below cursor', 'newly eligible behind cursor']) {
  test(`${scenario}: deferred until fresh scan`, async () => {
    const f = fixture(4);
    if (scenario === 'newly eligible behind cursor') {
      f.rows.push({ ...row('D000000'), lifecycle_status: 'Archived' });
    }
    f.hooks.beforeFetch = (n) => {
      if (n !== 2) return;
      if (scenario === 'above boundary') f.rows.push(row('D999999'));
      else if (scenario === 'below cursor') f.rows.push(row('D000000'));
      else f.rows.at(-1).lifecycle_status = 'Active';
    };
    const first = await f.producer.runScheduledEvaluation({ batchSize: 2 });
    assert.equal(first.processedCount, 4);
    assert.equal(first.highWaterId, idAt(4));
    f.hooks.beforeFetch = null;
    assert.equal((await f.producer.runScheduledEvaluation({ batchSize: 2 })).processedCount, 5);
  });
}

for (const change of ['Approved', 'Archived', 'Inactive']) {
  test(`${change} after selection is skipped by current detail read`, async () => {
    const f = fixture(3);
    f.hooks.afterFetch = (n) => {
      if (n !== 1) return;
      if (change === 'Approved') f.rows[0].workflow_status = change;
      if (change === 'Archived') f.rows[0].lifecycle_status = change;
      if (change === 'Inactive') f.rows[0].project_status = change;
    };
    const result = await f.producer.runScheduledEvaluation();
    assert.equal(result.processedCount, 3);
    assert.equal(result.skippedCount, 1);
    assert.equal(result.succeededCount, 2);
    assert.equal(result.evaluationComplete, true);
    assert.ok(!f.evaluated.includes(idAt(1)));
  });
}

const assertOutcomeCounts = (summary, { processed, failed, skipped, succeeded }) => {
  assert.equal(summary.processedCount, processed);
  assert.equal(summary.failedCount, failed);
  assert.equal(summary.skippedCount, skipped);
  assert.equal(summary.succeededCount, succeeded);
  assert.equal(summary.processedCount, summary.failedCount + summary.skippedCount + summary.succeededCount);
};

test('legitimate not_eligible remains skipped with evaluation complete', async () => {
  const f = fixture(1);
  f.hooks.afterLock = () => { f.rows[0].workflow_status = 'Approved'; };
  const result = await f.producer.runScheduledEvaluation();
  assertOutcomeCounts(result, { processed: 1, failed: 0, skipped: 1, succeeded: 0 });
  assert.equal(result.results[0].result, 'not_eligible');
  assert.equal(result.traversalComplete, true);
  assert.equal(result.evaluationComplete, true);
  assert.equal(f.sent.length, 0);
});

for (const serverNow of ['not-a-date', null, undefined, '', new Date(NaN)]) {
  test(`invalid evaluation time ${String(serverNow)} makes evaluation incomplete`, async () => {
    const f = fixture(2);
    f.hooks.serverNow = serverNow;
    const result = await f.producer.runScheduledEvaluation({ batchSize: 1 });
    assertOutcomeCounts(result, { processed: 2, failed: 2, skipped: 0, succeeded: 0 });
    assert.equal(result.results[0].result, 'missing_sla_baseline');
    assert.equal(result.traversalComplete, true);
    assert.equal(result.evaluationComplete, false);
    assert.equal(result.lastCursorId, idAt(2));
    assert.equal(f.sent.length, 0);
    assert.equal(f.writes.length, 0);
  });
}

for (const slaStartedAt of [null, undefined, '', 'not-a-date', new Date(NaN)]) {
  test(`missing/invalid evaluator baseline ${String(slaStartedAt)} is failed, not skipped`, async () => {
    const f = fixture(2);
    f.hooks.afterLock = ({ documentId }) => {
      f.rows.find(r => r.id === documentId).sla_started_at = slaStartedAt;
    };
    const result = await f.producer.runScheduledEvaluation({ batchSize: 1 });
    assertOutcomeCounts(result, { processed: 2, failed: 2, skipped: 0, succeeded: 0 });
    assert.equal(result.results[0].result, 'missing_sla_baseline');
    assert.equal(result.traversalComplete, true);
    assert.equal(result.evaluationComplete, false);
    assert.equal(result.lastCursorId, idAt(2));
    assert.equal(f.sent.length, 0);
    assert.equal(f.writes.length, 0);
  });
}

test('successful scheduled evaluation has consistent completed counters', async () => {
  const f = fixture(2);
  const result = await f.producer.runScheduledEvaluation();
  assertOutcomeCounts(result, { processed: 2, failed: 0, skipped: 0, succeeded: 2 });
  assert.equal(result.traversalComplete, true);
  assert.equal(result.evaluationComplete, true);
});

test('mixed skip, invalid baseline, exception, creation and suppression traverse all candidates', async () => {
  const f = fixture(5);
  f.hooks.afterLock = ({ documentId }) => {
    if (documentId === idAt(1)) f.rows[0].workflow_status = 'Approved';
    if (documentId === idAt(2)) f.rows[1].sla_started_at = null;
    if (documentId === idAt(5)) f.rows[4].sla_started_at = now;
  };
  f.hooks.evaluate = id => { if (id === idAt(3)) throw new Error('synthetic'); };
  const result = await f.producer.runScheduledEvaluation({ batchSize: 2 });
  assertOutcomeCounts(result, { processed: 5, failed: 2, skipped: 1, succeeded: 2 });
  assert.equal(result.traversalComplete, true);
  assert.equal(result.evaluationComplete, false);
  assert.equal(result.lastCursorId, idAt(5));
  assert.equal(result.batchCount, 3);
  assert.deepEqual(f.evaluated, [idAt(3), idAt(4), idAt(5)]);
  assert.equal(result.createdCount, 1);
  assert.equal(f.sent.length, 1);
  assert.equal(f.writes.length, 2);
});

test('baseline mutation does not affect cursor and current baseline is evaluated', async () => {
  const f = fixture(3);
  f.hooks.afterFetch = () => { f.rows[0].sla_started_at = now; };
  const result = await f.producer.runScheduledEvaluation({ batchSize: 1 });
  assert.equal(result.processedCount, 3);
  assert.deepEqual(f.evaluated, [idAt(1), idAt(2), idAt(3)]);
  assert.equal(f.writes[0].currentState, 'On Track');
  assert.ok(f.writes[0].cycleId.endsWith(now));
});

test('one evaluation failure does not block suffix or cursor advancement', async () => {
  const f = fixture(500);
  f.hooks.evaluate = (id) => { if (id === idAt(200)) throw new Error('synthetic'); };
  const result = await f.producer.runScheduledEvaluation();
  assert.equal(result.processedCount, 500);
  assert.equal(result.failedCount, 1);
  assert.equal(result.succeededCount, 499);
  assert.equal(result.lastCursorId, idAt(500));
  assert.equal(result.traversalComplete, true);
  assert.equal(result.evaluationComplete, false);
});

test('failed fetch reports incomplete scan and retains last completed cursor', async () => {
  const f = fixture(500);
  f.hooks.beforeFetch = (n) => { if (n === 2) throw new Error('synthetic query failure'); };
  const result = await f.producer.runScheduledEvaluation();
  assert.equal(result.processedCount, 200);
  assert.equal(result.lastCursorId, idAt(200));
  assert.equal(result.batchCount, 1);
  assert.equal(result.traversalComplete, false);
  assert.equal(result.evaluationComplete, false);
  assert.ok(result.error);
  assert.ok(f.logs.some(s => s.includes('event=finished') && s.includes('traversalComplete=false')));
});

test('boundary query failure never reports completed traversal', async () => {
  const f = fixture(1);
  f.repository.getSlaScanBoundary = async () => { throw new Error('synthetic'); };
  const result = await f.producer.runScheduledEvaluation();
  assert.equal(result.traversalComplete, false);
  assert.equal(result.evaluationComplete, false);
  assert.equal(result.processedCount, 0);
});

test('detail query failure is isolated to its candidate', async () => {
  const f = fixture(3);
  f.hooks.beforeDetail = id => { if (id === idAt(2)) throw new Error('synthetic'); };
  const result = await f.producer.runScheduledEvaluation({ batchSize: 1 });
  assert.equal(result.processedCount, 3);
  assert.equal(result.failedCount, 1);
  assert.equal(result.lastCursorId, idAt(3));
  assert.equal(result.traversalComplete, true);
  assert.equal(result.evaluationComplete, false);
});

test('clock failure reports incomplete traversal without advancing cursor', async () => {
  const f = fixture(1);
  f.hooks.clock = () => { throw new Error('synthetic'); };
  const result = await f.producer.runScheduledEvaluation();
  assert.equal(result.processedCount, 0);
  assert.equal(result.lastCursorId, null);
  assert.equal(result.traversalComplete, false);
  assert.equal(result.evaluationComplete, false);
});

test('new eligible ID ahead of cursor inside boundary can join the current scan', async () => {
  const f = fixture(3);
  f.hooks.beforeFetch = n => { if (n === 2) f.rows.push(row('D000001a')); };
  const result = await f.producer.runScheduledEvaluation({ batchSize: 1 });
  assert.equal(result.highWaterId, idAt(3));
  assert.equal(result.processedCount, 4);
  assert.deepEqual(f.evaluated, [idAt(1), 'D000001a', idAt(2), idAt(3)]);
});

test('project deactivation before the next fetch removes remaining project candidates', async () => {
  const f = fixture(6);
  f.hooks.beforeFetch = n => {
    if (n === 2) f.rows.filter(r => r.project_id === 'P1').forEach(r => { r.project_status = 'Inactive'; });
  };
  const result = await f.producer.runScheduledEvaluation({ batchSize: 2 });
  assert.equal(result.processedCount, 5);
  assert.equal(result.traversalComplete, true);
  assert.ok(!f.evaluated.includes(idAt(5)));
});

test('B2B: post-lock reload rejects Approved state instead of notifying from old detail', async () => {
  const f = fixture(1);
  f.hooks.afterLock = () => { f.rows[0].workflow_status = 'Approved'; };
  const result = await f.producer.runScheduledEvaluation();
  assert.equal(result.createdCount, 0);
  assert.equal(result.skippedCount, 1);
  assert.equal(result.traversalComplete, true);
  assert.equal(result.evaluationComplete, true);
  assert.equal(f.sent.length, 0);
  assert.equal(f.writes.length, 0);
  assert.equal(f.evaluated.length, 0);
});

test('B2B: candidate scope survives pre-lock detail filtering so missing baseline is failed', async () => {
  const f = fixture(1);
  f.hooks.afterFetch = () => { f.rows[0].sla_started_at = null; };
  const result = await f.producer.runScheduledEvaluation();
  assertOutcomeCounts(result, { processed: 1, failed: 1, skipped: 0, succeeded: 0 });
  assert.equal(result.results[0].result, 'missing_sla_baseline');
  assert.equal(result.lastCursorId, idAt(1));
  assert.equal(result.traversalComplete, true);
  assert.equal(result.evaluationComplete, false);
  assert.equal(f.sent.length, 0);
});

test('existing evaluator thresholds, suppression, identity, and audit payload remain in use', async () => {
  const f = fixture(4);
  f.rows[0].sla_started_at = now;
  f.rows[1].sla_started_at = '2026-11-05T12:00:00.000Z';
  f.hooks.previous = id => id === idAt(4) ? { current_state: 'Overdue', cycle_id: 'old', updated_at: now } : null;
  const result = await f.producer.runScheduledEvaluation();
  assert.equal(result.createdCount, 2);
  assert.equal(f.sent[0].eventType, 'SLA_AT_RISK');
  assert.equal(f.sent[1].eventType, 'SLA_OVERDUE');
  assert.equal(f.sent[0].skipCycleDuplicateCheck, true);
  assert.match(f.sent[0].identityBasis, /^sla-state-transition:None:At Risk:initial:/);
  assert.equal(f.writes.length, 4);
  assert.equal(f.audits.length, 1);
  assert.equal(result.results[0].result, 'on_track_no_need_action');
  assert.equal(result.results[3].result, 'same_state_suppressed');
});

test('bulk evaluator public contract remains a full array for supplied documents', async () => {
  const f = fixture(2);
  const docs = await Promise.all(f.rows.map(r => f.repository.findSlaScanDocument({ id: r.id, projectId: r.project_id })));
  const results = await f.producer.evaluateDocumentsForSlaNotifications({ documents: docs });
  assert.equal(results.length, 2);
  assert.equal(results[0].result, 'created');
});

for (const [event, target] of [['SLA_AT_RISK', '/sla-monitoring'], ['SLA_OVERDUE', '/escalation-alert']]) {
  test(`current notification service preserves recipients, payload and SSE: ${event}`, async () => {
    const f = fixture(1);
    const document = await f.repository.findSlaScanDocument({ id: idAt(1), projectId: 'P0' });
    const writes = [], events = [];
    let recipientQuery;
    const realtime = load('constants/realtime.constants.js');
    const service = load('services/notification.service.js', {
      'node:crypto': require('node:crypto'),
      '../repositories/notification.repository': {
        async listSlaNotificationsByBusinessKey() { return []; },
        async createNotification(value) { writes.push(value); return 1; },
      },
      '../repositories/projectMembership.repository': { async listActiveMembershipsByProjectAndOfficialRoles(args) {
        recipientQuery = args;
        return args.officialRoles.map((officialRole, n) => ({ id: `M${n}`, userId: n + 1, officialRole }));
      } },
      '../config/logger': logger, './audit.service': {},
      './realtimePublisher.service': { publishSafely(value) { events.push(value); } },
      '../constants/realtime.constants': realtime,
      '../utils/administration': { createEntityId: () => `N${writes.length}` },
    });
    const result = await service.createSlaStateNotifications({ document, cycleId: 'cycle', identityBasis: 'basis',
      eventType: service.NOTIFICATION_EVENT_TYPE[event], skipCycleDuplicateCheck: true });
    assert.deepEqual(Array.from(recipientQuery.officialRoles), ['Admin', 'Document Owner', 'Team Process', 'Team Project']);
    assert.equal(recipientQuery.projectId, 'P0');
    assert.equal(result.createdCount, 4);
    assert.equal(events.length, 4);
    for (const notification of writes) {
      assert.equal(notification.actionTarget, target);
      assert.equal(notification.relatedDocumentNumber, document.documentNumber);
      assert.equal(notification.metadata.revision, document.revision);
      assert.equal(notification.metadata.workflowStatus, document.status);
      assert.equal(notification.identityKey,
        `sla:v1:${require('node:crypto').createHash('sha256')
          .update(`${service.NOTIFICATION_EVENT_TYPE[event]}:P0:${document.id}:${notification.recipientUserId}:basis`).digest('hex')}`);
      assert.equal(notification.metadata.notificationIdentityBasis, 'basis');
      assert.notEqual(notification.recipientRole, 'Viewer');
    }
    for (const eventPayload of events) {
      assert.equal(eventPayload.projectId, 'P0');
      assert.equal(eventPayload.documentId, document.id);
    }
  });
}

const schedulerFixture = ({ enabled = true, run } = {}) => {
  const timers = [], cleared = [], logs = [];
  const timer = (type, callback, ms) => {
    const handle = { type, callback, ms, unref() { return handle; } };
    timers.push(handle);
    return handle;
  };
  const scheduler = load('services/slaNotificationScheduler.service.js', {
    '../config/env': { slaNotificationScheduler: { batchSize: 200, intervalMs: 900000, enabled } },
    '../config/logger': { log(...args) { logs.push(args.join(' ')); }, error(...args) { logs.push(args.join(' ')); } },
    './slaNotificationProducer.service': { runScheduledEvaluation: run || (async () => ({})) },
  }, {
    setTimeout: (cb, ms) => timer('timeout', cb, ms), setInterval: (cb, ms) => timer('interval', cb, ms),
    clearTimeout: h => cleared.push(h), clearInterval: h => cleared.push(h),
  });
  return { scheduler, timers, cleared, logs };
};

test('scheduler interval/startup/enable configuration and stop behavior are preserved', () => {
  const f = schedulerFixture();
  f.scheduler.start(); f.scheduler.start();
  assert.deepEqual(f.timers.map(t => [t.type, t.ms]), [['timeout', 5000], ['interval', 900000]]);
  f.scheduler.stop();
  assert.equal(f.cleared.length, 2);
  const disabled = schedulerFixture({ enabled: false });
  disabled.scheduler.start();
  assert.equal(disabled.timers.length, 0);
  const envSource = fs.readFileSync(path.join(root, 'config/env.js'), 'utf8');
  assert.match(envSource, /getPositiveIntegerEnv\('SLA_NOTIFICATION_BATCH_SIZE', 200\)/);
  assert.match(envSource, /getPositiveIntegerEnv\('SLA_NOTIFICATION_SCHEDULER_INTERVAL_MS', 15 \* 60 \* 1000\)/);
});

test('process-local guard holds through full scan including subsequent interval ticks', async () => {
  let finish, calls = 0;
  const f = schedulerFixture({ run: async args => {
    calls++;
    assert.equal(args.batchSize, 200);
    await new Promise(resolve => { finish = resolve; });
    return { processedCount: 500, createdCount: 0, failedCount: 0, traversalComplete: true, evaluationComplete: true };
  } });
  f.scheduler.start();
  const first = f.scheduler.runOnce();
  const skipped = await f.scheduler.runOnce();
  assert.equal(skipped.skipped, 'already_running');
  f.timers.find(t => t.type === 'interval').callback();
  assert.equal(calls, 1);
  finish();
  assert.equal((await first).processedCount, 500);
  assert.ok(f.logs.some(s => s.includes('event=completed')));
});

test('scheduler does not log incomplete evaluation as completed', async () => {
  const f = schedulerFixture({ run: async () => ({ processedCount: 500, failedCount: 1,
    createdCount: 0, traversalComplete: true, evaluationComplete: false }) });
  await f.scheduler.runOnce();
  assert.ok(f.logs.some(s => s.includes('event=incomplete')));
  assert.ok(!f.logs.some(s => s.includes('event=completed')));
});

test('guard resets after a producer error', async () => {
  let calls = 0;
  const f = schedulerFixture({ run: async () => { calls++; throw new Error('synthetic'); } });
  assert.ok((await f.scheduler.runOnce()).error);
  await f.scheduler.runOnce();
  assert.equal(calls, 2);
});
