const test = require('node:test');
const assert = require('node:assert/strict');
const tls = require('node:tls');
const { EventEmitter } = require('node:events');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const runner = require('../../scripts/historical-recovery-runner.cjs');

// Public bundled trust anchor only. No Railway certificate, private key or live IO.
const ca = tls.rootCertificates[0];
const env = { MYSQL_HOST: 'mysql.synthetic.example', MYSQL_TLS_SERVER_NAME: 'mysql.synthetic.example', MYSQL_TLS_MODE: 'VERIFY_IDENTITY' };
const options = () => ({ host: env.MYSQL_HOST, ssl: runner.tlsOptions(env, ca, {}) });
const peer = (host = env.MYSQL_HOST) => ({ subjectaltname: `DNS:${host}`, subject: { CN: host } });
const socket = (overrides = {}) => ({ encrypted: true, authorized: true, authorizationError: null,
  getProtocol: () => 'TLSv1.3', getPeerCertificate: () => peer(), ...overrides });

test('TLS requires explicit chain verification, identity verification and minimum TLS 1.2', () => {
  const actual = options();
  assert.equal(actual.ssl.rejectUnauthorized, true);
  assert.equal(actual.ssl.verifyIdentity, true);
  assert.equal(actual.ssl.minVersion, 'TLSv1.2');
  assert.equal(actual.ssl.ca, ca);
  assert.doesNotThrow(() => runner.assertSecureConnection({ connection: { stream: socket() } }, actual));
});
for (const mode of [undefined, 'DISABLED', 'PREFERRED', 'REQUIRED', 'false']) {
  test(`TLS mode ${mode} cannot silently fall back`, () => {
    assert.throws(() => runner.tlsOptions({ ...env, MYSQL_TLS_MODE: mode }, ca, {}), { code: 'TLS_VERIFY_IDENTITY_REQUIRED' });
  });
}
test('missing CA, invalid CA certificate and private-key material fail before network', () => {
  assert.throws(() => runner.tlsOptions(env, undefined, {}), { code: 'TLS_CA_REQUIRED' });
  for (const invalid of ['not a certificate', '-----BEGIN CERTIFICATE-----\nINVALID\n-----END CERTIFICATE-----',
    ca + '\n-----BEGIN PRIVATE KEY-----\nfixture\n-----END PRIVATE KEY-----']) {
    assert.throws(() => runner.tlsOptions(env, invalid, {}), { code: 'TLS_CA_INVALID' });
  }
});
test('explicit DNS server name is mandatory; proxy name is never assumed from certificate', () => {
  for (const name of [undefined, '', '127.0.0.1', '*.example.com', 'mysql/name', '-bad.example']) {
    assert.throws(() => runner.tlsOptions({ ...env, MYSQL_TLS_SERVER_NAME: name }, ca, {}), { code: 'TLS_SERVER_NAME_REQUIRED' });
  }
  assert.throws(() => runner.tlsOptions({ ...env, MYSQL_TLS_SERVER_NAME: 'other.example.test' }, ca, {}),
    { code: 'TLS_SERVER_NAME_MUST_MATCH_CONNECTION_HOST' });
});
test('insecure process or file overrides are rejected rather than honored', () => {
  for (const override of [{ NODE_TLS_REJECT_UNAUTHORIZED: '0' }, { MYSQL_TLS_REJECT_UNAUTHORIZED: 'false' }, { MYSQL_TLS_VERIFY_IDENTITY: 'false' }]) {
    assert.throws(() => runner.tlsOptions({ ...env, ...override }, ca, {}), { code: 'INSECURE_TLS_OVERRIDE_REJECTED' });
  }
  assert.throws(() => runner.tlsOptions(env, ca, { NODE_TLS_REJECT_UNAUTHORIZED: '0' }), { code: 'INSECURE_TLS_OVERRIDE_REJECTED' });
});
test('hostname mismatch is rejected by actual Node checkServerIdentity', () => {
  assert.throws(() => runner.assertSecureConnection({ connection: { stream: socket({ getPeerCertificate: () => peer('wrong.example.test') }) } }, options()),
    { code: 'TLS_PEER_IDENTITY_MISMATCH' });
});
test('untrusted chain/plaintext/obsolete protocol are rejected; no SQL can run', async () => {
  for (const override of [{ authorized: false, authorizationError: 'CERT_SIGNATURE_FAILURE' }, { encrypted: false }, { getProtocol: () => 'TLSv1' }]) {
    let destroyed = false;
    const c = { connection: { stream: socket(override) }, destroy: () => { destroyed = true; },
      query: () => assert.fail('SQL before verified TLS') };
    await assert.rejects(runner.connectSecure(options(), async () => c), { code: 'TLS_CONNECTION_NOT_VERIFIED' });
    assert.equal(destroyed, true);
  }
});
test('disabled TLS is refused before connection factory is called', async () => {
  for (const ssl of [undefined, false, { ...options().ssl, rejectUnauthorized: false }, { ...options().ssl, verifyIdentity: false }]) {
    await assert.rejects(runner.connectSecure({ host: env.MYSQL_HOST, ssl }, () => assert.fail('insecure connect')), { code: 'TLS_VERIFY_IDENTITY_REQUIRED' });
  }
});
test('handshake certificate errors propagate without reconnect or plaintext retry', async () => {
  let attempts = 0;
  await assert.rejects(runner.connectSecure(options(), async () => {
    attempts++; throw Object.assign(new Error('synthetic TLS failure'), { code: 'HANDSHAKE_SSL_ERROR' });
  }), { code: 'HANDSHAKE_SSL_ERROR' });
  assert.equal(attempts, 1);
});
test('runtime CA loader requires explicit absolute nonempty certificate file', async t => {
  await assert.rejects(runner.loadCa({}), { code: 'TLS_CA_ABSOLUTE_PATH_REQUIRED' });
  await assert.rejects(runner.loadCa({ MYSQL_TLS_CA_FILE: 'relative.pem' }), { code: 'TLS_CA_ABSOLUTE_PATH_REQUIRED' });
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'runner-ca-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'public-fixture.pem'); await fs.writeFile(file, ca);
  assert.equal(await runner.loadCa({ MYSQL_TLS_CA_FILE: file }), ca);
  await fs.writeFile(file, '');
  await assert.rejects(runner.loadCa({ MYSQL_TLS_CA_FILE: file }), { code: 'TLS_CA_INVALID' });
});

// Exercise the installed mysql2 TLS upgrade without opening any socket. The
// transport is mocked; Node's real hostname validator still checks synthetic SANs.
for (const mismatch of [false, true]) test(`installed mysql2 forwards strict TLS and enforces hostname (mismatch=${mismatch})`, async t => {
  const BaseConnection = require('../../node_modules/mysql2/lib/base/connection');
  const secure = new EventEmitter(); secure.getPeerCertificate = () => peer(mismatch ? 'wrong.example.test' : env.MYSQL_HOST);
  const raw = new EventEmitter();
  const fake = { config: { ...options(), debug: false }, stream: raw, packetParser: { execute() {} },
    _handleNetworkError: () => assert.fail('unexpected synthetic network error') };
  t.mock.method(tls, 'connect', (received, ready) => {
    assert.equal(received.servername, env.MYSQL_HOST);
    assert.equal(received.rejectUnauthorized, true);
    assert.equal(received.checkServerIdentity, tls.checkServerIdentity);
    assert.ok(received.secureContext);
    setImmediate(ready); return secure;
  });
  const result = await new Promise(resolve => BaseConnection.prototype.startTLS.call(fake, resolve));
  if (mismatch) assert.equal(result.code, 'ERR_TLS_CERT_ALTNAME_INVALID');
  else assert.equal(result, undefined);
});
test('installed mysql2 certificate-chain failure aborts TLS upgrade', async t => {
  const BaseConnection = require('../../node_modules/mysql2/lib/base/connection');
  const secure = new EventEmitter();
  t.mock.method(tls, 'connect', received => {
    assert.equal(received.rejectUnauthorized, true);
    setImmediate(() => secure.emit('error', Object.assign(new Error('synthetic untrusted chain'), { code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' })));
    return secure;
  });
  const result = await new Promise(resolve => BaseConnection.prototype.startTLS.call({ config: options(), stream: new EventEmitter(), packetParser: { execute() {} } }, resolve));
  assert.equal(result.code, 'UNABLE_TO_VERIFY_LEAF_SIGNATURE');
});
