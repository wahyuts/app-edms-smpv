const assert = require('node:assert/strict');
const test = require('node:test');
const { createLoader } = require('../helpers/approvalEmailLoader');

const settle = () => new Promise((resolve) => setImmediate(resolve));
const receipt = (overrides = {}) => ({
  approvalEventId: 'WFC-TEST', projectId: 'PRJ-TEST', documentId: 'DOC-TEST', actorUserId: 1,
  projectCode: '0001', projectName: 'Project Name Only In Body', documentNumber: 'PFD-EDMS-1234',
  approvalCode: 'A', approverRole: 'Team Process', approvalTimestamp: '2026-10-28T03:40:00.123Z',
  ...overrides,
});
const template = createLoader().load('services/templates/approvalEmail.template.js');
const descriptions = { A: 'Approved', B: 'Approved with Comment', C: 'Not Approved' };

for (const role of ['Team Process', 'Team Project']) for (const code of ['A', 'B', 'C']) {
  test(`Template exact subject, body and event date: ${role} ${code}`, () => {
    const email = template.buildApprovalEmail(receipt({ approverRole: role, approvalCode: code, approvalComment: 'User comment' }));
    assert.equal(email.subject, `PROJECT CODE 0001 \u2014 PFD-EDMS-1234 \u2014 ${code} (${descriptions[code]}) By ${role}`);
    assert.ok(!email.subject.includes('Project Name Only In Body'));
    assert.ok(email.text.includes('Project Name: Project Name Only In Body'));
    assert.ok(email.text.includes(`Approved By: ${role}`));
    assert.ok(email.text.includes('28 Oktober 2026, 10:40 WIB'));
    assert.equal(email.text.includes('Comment: User comment'), code !== 'A');
    assert.ok(email.html.includes('Approval Notification'));
  });
}
test('Template escapes HTML and removes header controls without changing source values', () => {
  const event = receipt({ documentNumber: 'PFD\r\nBcc:evil\u0000', projectName: '<script>"&\'</script>',
    approvalCode: 'B', approvalComment: '<img src=x onerror=alert(1)>\nsecond line' });
  const email = template.buildApprovalEmail(event);
  assert.ok(!/[\r\n\u0000]/.test(email.subject));
  assert.ok(!email.html.includes('<script>'));
  assert.ok(!email.html.includes('<img'));
  assert.ok(email.html.includes('&lt;img'));
  assert.ok(email.html.includes('&quot;&amp;&#39;'));
  assert.ok(email.text.includes(event.approvalComment));
  assert.equal(event.documentNumber, 'PFD\r\nBcc:evil\u0000');
});
test('Template C omits absent comment and never substitutes system reason', () => {
  const email = template.buildApprovalEmail(receipt({ approvalCode: 'C', approvalComment: '  ' }));
  assert.ok(!email.text.includes('Comment:'));
  assert.ok(!email.html.includes('Comment:'));
  assert.ok(!email.text.includes('Document is not approved'));
});
for (const overrides of [{ approvalCode: 'B', approvalComment: '' }, { projectCode: '' }, { projectName: null },
  { documentNumber: null }, { approverRole: 'Admin' }, { approvalCode: 'X' },
  { approvalTimestamp: 'not-a-dateZ' }, { approvalTimestamp: '2026-10-28 03:40:00' }]) {
  test(`Template rejects missing/invalid identity: ${JSON.stringify(overrides)}`, () => {
    assert.throws(() => template.buildApprovalEmail(receipt(overrides)));
  });
}
test('Template explicit Jakarta conversion crosses UTC day boundary', () => {
  assert.ok(template.buildApprovalEmail(receipt({ approvalTimestamp: '2026-10-27T18:00:00Z' })).text.includes('28 Oktober 2026, 01:00 WIB'));
});

const dispatcherFixture = ({ recipients = [], send, missingEvent = false, eventAction = 'Approval A', failQuery = false } = {}) => {
  const sent = [];
  const logs = [];
  const projects = [];
  const mocks = new Map([
    ['config/logger.js', { log: (...args) => logs.push(args), error: (...args) => logs.push(args) }],
    ['repositories/document.repository.js', { async findApprovalEmailEvent(value) {
      assert.equal(value.approvalEventId, 'WFC-TEST');
      if (failQuery) throw new Error('Sensitive database failure');
      return missingEvent ? null : { workflowAction: eventAction, approvalTimestamp: receipt().approvalTimestamp };
    } }],
    ['repositories/projectMembership.repository.js', { async listApprovalEmailRecipients(projectId) { projects.push(projectId); return recipients; } }],
    ['services/email.service.js', { async sendApprovalNotification(email) {
      sent.push(email);
      return send ? send(email) : { success: true };
    } }],
  ]);
  const loader = createLoader(mocks);
  return { dispatcher: loader.load('services/approvalEmailDispatcher.service.js'), sent, logs, projects };
};
test('Dispatcher dedups users, keeps shared mailboxes per user, skips invalid emails and isolates failures', async () => {
  const f = dispatcherFixture({ recipients: [
    { userId: 1, email: ' SHARED@EXAMPLE.COM ' }, { userId: 1, email: 'duplicate@example.com' },
    { userId: 2, email: 'shared@example.com' }, { userId: 3, email: null },
    { userId: 4, email: '' }, { userId: 5, email: '  ' }, { userId: 6, email: 'invalid' },
    { userId: 7, email: 'bad\u0000@example.com' }, { userId: 8, email: 'good@example.com' },
  ], send: async (email) => {
    if (email.requestId.endsWith(':1')) throw new Error('Provider secret must never be logged');
    return { success: true };
  } });
  assert.equal(f.dispatcher.dispatch(receipt()), undefined);
  await settle();
  assert.deepEqual(f.projects, ['PRJ-TEST']);
  assert.deepEqual(f.sent.map((email) => email.to), ['shared@example.com', 'shared@example.com', 'good@example.com']);
  assert.deepEqual(f.sent.map((email) => email.requestId), ['WFC-TEST:1', 'WFC-TEST:2', 'WFC-TEST:8']);
  assert.ok(!JSON.stringify(f.logs).includes('Provider secret'));
  assert.ok(!JSON.stringify(f.logs).includes('shared@example.com'));
  assert.equal(f.logs.filter((entry) => entry[1].result === 'provider_accepted').length, 2);
});
for (const options of [{}, { missingEvent: true }, { eventAction: 'Approval B' }, { failQuery: true }]) {
  test(`Dispatcher safely skips no-recipient/missing/mismatched/unavailable event: ${JSON.stringify(options)}`, async () => {
    const f = dispatcherFixture(options);
    f.dispatcher.dispatch(receipt());
    await settle();
    assert.equal(f.sent.length, 0);
  });
}
test('Dispatcher catches template errors and unsuccessful provider result', async () => {
  const f = dispatcherFixture({ recipients: [{ userId: 1, email: 'valid@example.com' }], send: async () => ({ success: false }) });
  f.dispatcher.dispatch(receipt({ projectName: null }));
  await settle();
  assert.equal(f.sent.length, 0);
  f.dispatcher.dispatch(receipt());
  await settle();
  assert.equal(f.sent.length, 1);
  assert.ok(f.logs.some((entry) => entry[1].result === 'provider_failed_or_unknown'));
});
test('Dispatcher does not wait for one recipient or prevent sending to another', async () => {
  let resolveSend;
  const held = new Promise((resolve) => { resolveSend = resolve; });
  const f = dispatcherFixture({ recipients: [{ userId: 1, email: 'one@example.com' }, { userId: 2, email: 'two@example.com' }],
    send: (email) => email.requestId.endsWith(':1') ? held : { success: true } });
  f.dispatcher.dispatch(receipt());
  await settle();
  assert.equal(f.sent.length, 2);
  resolveSend({ success: true });
  await settle();
});

test('Recipient query enforces project and active Admin/Owner scope without global roles', async () => {
  let calls = 0;
  const loader = createLoader(new Map([['config/database.js', { pool: { async execute(sql, values) {
    calls += 1;
    assert.deepEqual(Array.from(values), ['PRJ-TEST']);
    assert.match(sql, /project_memberships\.project_id = \?/);
    assert.match(sql, /SELECT DISTINCT users.id AS user_id, users.email/);
    assert.match(sql, /IN \('admin', 'document owner'\)/);
    for (const table of ['project_memberships', 'users', 'projects']) assert.ok(sql.includes(`LOWER(TRIM(${table}.status)) = 'active'`));
    assert.doesNotMatch(sql, /role_id|position|LIMIT 1/);
    return [[{ user_id: 1, email: 'admin@example.com' }, { user_id: 2, email: 'owner@example.com' }]];
  } } }]]));
  const result = await loader.load('repositories/projectMembership.repository.js').listApprovalEmailRecipients('PRJ-TEST');
  assert.equal(result.length, 2); assert.equal(calls, 1);
});
test('Approval event query binds event/project/document/actor and preserves explicit UTC', async () => {
  const loader = createLoader(new Map([
    ['config/logger.js', {}], ['config/database.js', { pool: { async execute(sql, values) {
      assert.match(sql, /FROM workflow_comments/);
      assert.match(sql, /id = \? AND project_id = \? AND document_id = \? AND created_by_user_id = \?/);
      assert.deepEqual(Array.from(values), ['WFC-TEST', 'PRJ-TEST', 'DOC-TEST', 1]);
      return [[{ workflow_action: 'Approval A', approval_timestamp_utc: '2026-10-28 03:40:00.123000' }]];
    } } }],
  ]));
  assert.equal((await loader.load('repositories/document.repository.js').findApprovalEmailEvent(receipt())).approvalTimestamp, receipt().approvalTimestamp);
});

const providerFixture = (send, provider = 'resend') => {
  const calls = [];
  const env = { appEnv: 'development', email: { provider, useResend: provider === 'resend', enableDevEmailOutbox: true,
    resendApiKey: 'synthetic-not-live', from: 'EDMS <test@example.test>', frontendResetPasswordUrl: 'https://example.test/reset-password' } };
  const loader = createLoader(new Map([
    ['config/env.js', env], ['config/logger.js', { log() {}, error() {} }],
  ]), new Map([['resend', { Resend: class {
    constructor() { this.emails = { send: async (value) => { calls.push(value); return send(value); } }; }
  } }]]));
  return { loader, calls, service: loader.load('services/email.service.js') };
};
test('Resend accepts only valid SDK acceptance and keeps Forgot Password template contract', async () => {
  const f = providerFixture(async () => ({ data: { id: 'provider-id' }, error: null }));
  const result = await f.service.sendPasswordReset({ to: 'user@example.test', username: 'User', resetToken: 'synthetic-token', expiresIn: '15m', expiresAt: new Date(), requestId: 'RESET-1' });
  assert.equal(result.success, true); assert.equal(result.messageId, 'provider-id');
  assert.equal(f.calls.length, 1); assert.equal(f.calls[0].subject, 'Reset Your EDMS Password');
  assert.ok(f.calls[0].text.includes('https://example.test/reset-password?token=synthetic-token'));
  assert.equal(f.calls[0].from, 'EDMS <test@example.test>');
});
for (const response of [{ data: null, error: { name: 'validation_error' } }, null, {}, { data: {} },
  { data: { id: 'provider-id' } }, { data: { id: '' }, error: null }]) {
  test(`Resend rejects returned error/invalid acceptance without retry: ${JSON.stringify(response)}`, async () => {
    const f = providerFixture(async () => response);
    await assert.rejects(f.service.sendApprovalNotification({ to: 'user@example.test', subject: 'Test', text: 'Test', html: '<p>Test</p>' }), /Email delivery failed/);
    assert.equal(f.calls.length, 1);
  });
}
test('Resend thrown/network-unknown failure is not retried', async () => {
  const f = providerFixture(async () => { throw new Error('Network timeout'); });
  await assert.rejects(f.service.sendPasswordReset({ to: 'user@example.test', username: 'User', resetToken: 'synthetic', expiresIn: '15m' }), /Email delivery failed/);
  assert.equal(f.calls.length, 1);
});
test('Dummy provider records approval and existing password recovery in development outbox', async () => {
  const f = providerFixture(() => assert.fail('Real provider must not run'), 'dummy');
  const result = await f.service.sendApprovalNotification({ to: 'admin@example.test', ...template.buildApprovalEmail(receipt()), requestId: 'WFC-TEST:1' });
  assert.equal(result.provider, 'dummy');
  await f.service.sendPasswordReset({ to: 'user@example.test', username: 'User', resetToken: 'synthetic', expiresIn: '15m', requestId: 'RESET-1' });
  const outbox = f.loader.load('services/devEmailOutbox.service.js').getEmails();
  assert.equal(outbox.length, 2);
  assert.equal(outbox[1].requestId, 'WFC-TEST:1');
  assert.equal(outbox[1].to, 'admin@example.test');
  assert.equal(outbox[0].subject, 'Reset Your EDMS Password');
});

