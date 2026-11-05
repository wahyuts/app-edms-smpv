const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { PassThrough } = require('node:stream');
const { createHash } = require('node:crypto');
const path = require('node:path');
const ssh = require('../../scripts/historical-recovery-ssh.cjs');
const runner = require('../../scripts/historical-recovery-runner.cjs');
const key = Buffer.concat([Buffer.from([0,0,0,11]), Buffer.from('ssh-ed25519'), Buffer.from([0,0,0,32]), Buffer.alloc(32, 7)]);
const known = `ssh.railway.com ssh-ed25519 ${key.toString('base64')}\n`;
const fingerprint = 'SHA256:' + createHash('sha256').update(key).digest('base64').replace(/=+$/, '');
const uuid = n => `${n}0000000-0000-0000-0000-000000000001`;
const p = { environment: 'development', targetDigest: 'synthetic-target', database: { name: 'synthetic_dev', port: 3306 },
  r2: { accountId: 'a', endpoint: 'https://a.example.test', bucketName: 'dev' },
  ssh: { environment: 'development', mappingReviewedByOwner: true, projectId: uuid(1), environmentId: uuid(2),
    serviceId: uuid(3), serviceInstanceId: uuid(4), executable: path.resolve('ssh.exe'), identityFile: path.resolve('synthetic-key'),
    knownHostsFile: path.resolve('synthetic-known-hosts'), localPort: 13306, hostKeyFingerprint: fingerprint } };
const env = { APP_ENV: 'development', MYSQL_TRANSPORT: 'SSH_TUNNEL', MYSQL_HOST: '127.0.0.1', MYSQL_PORT: '13306',
  MYSQL_DATABASE: 'synthetic_dev', MYSQL_USER: 'synthetic', MYSQL_PASSWORD: 'synthetic', R2_ACCOUNT_ID: 'a',
  R2_ENDPOINT: p.r2.endpoint, R2_BUCKET_NAME: 'dev', R2_REGION: 'auto', R2_ACCESS_KEY_ID: 'synthetic', R2_SECRET_ACCESS_KEY: 'synthetic' };
const spec = () => ssh.specFor(p, env, known);
const files = { knownHostsFile: path.resolve('synthetic-known-hosts-copy'), configFile: path.resolve('synthetic-empty-config') };
const fake = behavior => {
  const child = new EventEmitter(); child.stderr = new PassThrough(); child.exitCode = null; child.signalCode = null;
  child.kill = () => { child.signalCode = 'SIGTERM'; setImmediate(() => child.emit('close')); return true; };
  const deps = { timeoutMs: 80, portFree: async () => {}, probePort: async () => true,
    spawn: (exe, args, options) => {
      assert.equal(exe, p.ssh.executable); assert.equal(options.shell, false); assert.equal(options.windowsHide, true);
      assert.ok(args.includes('StrictHostKeyChecking=yes')); assert.ok(args.includes('ExitOnForwardFailure=yes'));
      setImmediate(() => {
        if (behavior === 'host-key') child.stderr.write('Host key verification failed.');
        else if (behavior === 'exit') { child.exitCode = 255; child.emit('exit', 255); }
        else if (behavior !== 'timeout') child.stderr.write('Authenticated to ssh.railway.com ([synthetic]:22) using "publickey".\nLocal forwarding listening on 127.0.0.1 port 13306.\n');
      });
      return child;
    } };
  return { child, deps };
};
test('strict SSH spec binds reviewed project/environment/service instance and pinned relay key', () => {
  const s = spec(); assert.equal(s.remoteHost, '127.0.0.1'); assert.equal(s.remotePort, 3306);
  assert.equal(s.serviceInstanceId, uuid(4)); assert.match(s.transportDigest, /^[a-f0-9]{64}$/);
});
test('wrong environment, missing mapping attestation, host key mismatch and public listener config fail closed', () => {
  assert.throws(() => ssh.specFor({ ...p, environment: 'production' }, env, known), { code: 'SSH_ENVIRONMENT_MAPPING_REQUIRED' });
  assert.throws(() => ssh.specFor({ ...p, ssh: { ...p.ssh, mappingReviewedByOwner: false } }, env, known), { code: 'SSH_ENVIRONMENT_MAPPING_REQUIRED' });
  assert.throws(() => ssh.specFor({ ...p, ssh: { ...p.ssh, hostKeyFingerprint: 'SHA256:wrong' } }, env, known), { code: 'SSH_HOST_KEY_MISMATCH' });
  assert.throws(() => ssh.specFor(p, { ...env, MYSQL_HOST: '0.0.0.0' }, known), { code: 'SSH_TARGET_MISMATCH' });
});
test('SSH arguments do not inherit config/proxies, autoaccept keys or print credentials', () => {
  const args = ssh.argsFor(spec(), files.knownHostsFile, files.configFile);
  assert.ok(args.includes('127.0.0.1:13306:127.0.0.1:3306'));
  assert.ok(args.includes(`${uuid(4)}@ssh.railway.com`));
  for (const option of ['UpdateHostKeys=no','BatchMode=yes','ForwardAgent=no','ProxyCommand=none','ProxyJump=none','GatewayPorts=no']) assert.ok(args.includes(option));
  assert.ok(!args.some(value => /accept-new|StrictHostKeyChecking=no|MYSQL_PASSWORD/.test(value)));
});
test('hashed, multi-host and unreviewed known-host entries are rejected', () => {
  for (const invalid of [known + known, known.replace('ssh.railway.com', '*.railway.com'),
    known.replace('ssh.railway.com', '|1|hashed|entry'), known + '# arbitrary extra entry']) {
    assert.throws(() => ssh.specFor(p, env, invalid), { code: 'SSH_KNOWN_HOST_INVALID' });
  }
});
test('normal close removes signal handlers and only terminates the managed child once', async () => {
  const before = process.listenerCount('SIGINT'); const { deps, child } = fake(); let killed = 0;
  const kill = child.kill; child.kill = () => { killed++; return kill(); };
  const tunnel = await ssh.start(spec(), files, deps);
  assert.equal(process.listenerCount('SIGINT'), before + 1);
  await Promise.all([tunnel.close(), tunnel.close()]);
  assert.equal(killed, 1); assert.equal(process.listenerCount('SIGINT'), before);
});
test('verified managed SSH process and expected database identity are both required', async () => {
  const { deps } = fake(); const tunnel = await ssh.start(spec(), files, deps);
  let destroyed = false; const c = { query: async () => [[{ serverUuid: 'expected' }]], destroy: () => { destroyed = true; } };
  try {
    const guarded = await ssh.connect(tunnel, { host: '127.0.0.1', port: 13306 }, async () => c,
      identity => assert.equal(identity.serverUuid, 'expected'), 'SELECT identity');
    await guarded.query('SELECT read_only'); assert.equal(destroyed, false);
  } finally { await tunnel.close(); }
  assert.equal(destroyed, true);
});
for (const [behavior, code] of [['host-key','SSH_HOST_KEY_REJECTED'],['exit','SSH_TUNNEL_CLOSED'],['timeout','SSH_TUNNEL_TIMEOUT']]) {
  test(`SSH ${behavior} cannot become a verified tunnel`, async () => {
    const { deps } = fake(behavior); await assert.rejects(ssh.start(spec(), files, deps), { code });
  });
}
test('an existing local listener is never accepted as a tunnel', async () => {
  const { deps } = fake(); deps.portFree = async () => { throw Object.assign(new Error('busy'), { code: 'SSH_LOCAL_PORT_BUSY' }); };
  deps.spawn = () => assert.fail('must not launch over occupied port');
  await assert.rejects(ssh.start(spec(), files, deps), { code: 'SSH_LOCAL_PORT_BUSY' });
});
test('local listener alone without authenticated SSH is insufficient', async () => {
  const { deps } = fake('timeout'); deps.probePort = async () => assert.fail('probe before authentication');
  await assert.rejects(ssh.start(spec(), files, deps), { code: 'SSH_TUNNEL_TIMEOUT' });
});
test('disconnect invalidates in-flight results, destroys DB and blocks subsequent queries', async () => {
  const { deps, child } = fake(); const tunnel = await ssh.start(spec(), files, deps);
  let destroyed = false; let finish;
  const c = { query: async () => new Promise(resolve => { finish = resolve; }), destroy: () => { destroyed = true; } };
  const guarded = tunnel.bind(c); const pending = guarded.query('SELECT synthetic');
  child.exitCode = 255; child.emit('exit', 255); finish([[]]);
  await assert.rejects(pending, { code: 'SSH_TUNNEL_CLOSED' });
  await assert.rejects(guarded.query('SELECT synthetic'), { code: 'SSH_TUNNEL_CLOSED' });
  assert.equal(destroyed, true); await tunnel.close();
});
test('wrong database identity destroys connection without retries', async () => {
  const { deps } = fake(); const tunnel = await ssh.start(spec(), files, deps); let calls = 0; let destroyed = false;
  try {
    await assert.rejects(ssh.connect(tunnel, { host: '127.0.0.1', port: 13306 }, async () => {
      calls++; return { query: async () => [[{}]], destroy: () => { destroyed = true; } };
    }, () => { throw Object.assign(new Error('wrong'), { code: 'DATABASE_IDENTITY_MISMATCH' }); }, 'SELECT identity'), { code: 'DATABASE_IDENTITY_MISMATCH' });
    assert.equal(calls, 1); assert.equal(destroyed, true);
  } finally { await tunnel.close(); }
});
test('SSH never uses public TCP proxy and TCP proxy never downgrades TLS', async () => {
  const credential = runner.credentialsFor(env, p);
  assert.equal(credential.mysql.host, '127.0.0.1'); assert.equal(credential.mysql.ssl, undefined);
  assert.throws(() => runner.credentialsFor({ ...env, MYSQL_TRANSPORT: 'TCP_PROXY', MYSQL_HOST: 'public.example.test' }, p), { code: 'TLS_VERIFY_IDENTITY_REQUIRED' });
  const { deps } = fake(); const tunnel = await ssh.start(spec(), files, deps);
  try {
    await assert.rejects(ssh.connect(tunnel, { host: 'public.example.test', port: 13306 }, () => assert.fail('fallback attempted'), () => {}, 'SELECT identity'),
      { code: 'SSH_DATABASE_ROUTE_REQUIRED' });
  } finally { await tunnel.close(); }
});
test('tunnel process startup failure is surfaced without fallback', async () => {
  const { deps, child } = fake('timeout');
  deps.spawn = () => { setImmediate(() => child.emit('error', new Error('synthetic launch failure'))); return child; };
  await assert.rejects(ssh.start(spec(), files, deps), { code: 'SSH_PROCESS_FAILED' });
});
