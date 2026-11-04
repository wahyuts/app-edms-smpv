const fs = require('node:fs/promises');
const path = require('node:path');
const net = require('node:net');
const { createHash } = require('node:crypto');
const { spawn } = require('node:child_process');
const { digest } = require('../src/utils/storageNamespace');

const fail = code => { throw Object.assign(new Error(code), { code }); };
const need = (condition, code) => { if (!condition) fail(code); };
const uuid = value => /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value || '');
const specFor = (p, env, knownHosts) => {
  const s = p.ssh;
  need(s && s.environment === p.environment && s.mappingReviewedByOwner === true
    && ['projectId','environmentId','serviceId','serviceInstanceId'].every(k => uuid(s[k])), 'SSH_ENVIRONMENT_MAPPING_REQUIRED');
  need(env.MYSQL_TRANSPORT === 'SSH_TUNNEL' && env.APP_ENV === p.environment
    && env.MYSQL_DATABASE === p.database.name && env.MYSQL_HOST === '127.0.0.1'
    && Number(env.MYSQL_PORT) === s.localPort, 'SSH_TARGET_MISMATCH');
  need(Number.isInteger(s.localPort) && s.localPort >= 1024 && s.localPort <= 65535
    && s.localPort !== p.database.port, 'SSH_LOCAL_PORT_INVALID');
  for (const key of ['executable','identityFile','knownHostsFile']) need(typeof s[key] === 'string'
    && path.isAbsolute(s[key]) && !/[\r\n\0]/.test(s[key]), 'SSH_ABSOLUTE_PATH_REQUIRED');
  need(['ssh.exe','ssh'].includes(path.basename(s.executable).toLowerCase()), 'SSH_EXECUTABLE_REQUIRED');
  // A dedicated, single, unhashed relay host entry is deliberately required.
  const parts = knownHosts.trim().split(/\s+/);
  need(parts.length === 3 && parts[0] === 'ssh.railway.com'
    && ['ssh-ed25519','ecdsa-sha2-nistp256','ssh-rsa'].includes(parts[1])
    && /^[A-Za-z0-9+/]+={0,2}$/.test(parts[2]), 'SSH_KNOWN_HOST_INVALID');
  const key = Buffer.from(parts[2], 'base64');
  need(key.length >= 32 && key.toString('base64').replace(/=+$/, '') === parts[2].replace(/=+$/, ''), 'SSH_KNOWN_HOST_INVALID');
  const fingerprint = 'SHA256:' + createHash('sha256').update(key).digest('base64').replace(/=+$/, '');
  need(fingerprint === s.hostKeyFingerprint, 'SSH_HOST_KEY_MISMATCH');
  const value = { environment: p.environment, targetDigest: p.targetDigest, ...s, relay: 'ssh.railway.com',
    remoteHost: '127.0.0.1', remotePort: p.database.port, knownHosts: knownHosts.trim() + '\n' };
  return { ...value, transportDigest: digest(JSON.stringify(value)) };
};
const argsFor = (s, knownHostsFile, configFile) => {
  const keyType = s.knownHosts.trim().split(/\s+/)[1];
  const policy = ['StrictHostKeyChecking=yes', `UserKnownHostsFile="${knownHostsFile.replace(/\\/g, '/')}"`,
    `GlobalKnownHostsFile=${process.platform === 'win32' ? 'NUL' : '/dev/null'}`, 'UpdateHostKeys=no',
    'VerifyHostKeyDNS=no', 'BatchMode=yes', 'IdentitiesOnly=yes', 'PreferredAuthentications=publickey',
    'PasswordAuthentication=no', 'KbdInteractiveAuthentication=no', 'ForwardAgent=no', 'AddKeysToAgent=no',
    'ExitOnForwardFailure=yes', 'ServerAliveInterval=5', 'ServerAliveCountMax=2', 'ConnectionAttempts=1',
    'ConnectTimeout=10', 'ControlMaster=no', 'ControlPath=none', 'ProxyCommand=none', 'ProxyJump=none',
    'GatewayPorts=no', 'PermitLocalCommand=no',
    `HostKeyAlgorithms=${keyType === 'ssh-rsa' ? 'rsa-sha2-512,rsa-sha2-256' : keyType}`];
  return ['-F', configFile, '-N', '-T', '-v', '-p', '22', '-i', s.identityFile,
    ...policy.flatMap(x => ['-o', x]), '-L', `127.0.0.1:${s.localPort}:127.0.0.1:${s.remotePort}`,
    `${s.serviceInstanceId}@ssh.railway.com`];
};
const portFree = port => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once('error', () => reject(Object.assign(new Error('SSH_LOCAL_PORT_BUSY'), { code: 'SSH_LOCAL_PORT_BUSY' })));
  server.listen({ host: '127.0.0.1', port, exclusive: true }, () => server.close(resolve));
});
const probePort = port => new Promise(resolve => {
  const socket = net.connect({ host: '127.0.0.1', port });
  const done = value => { socket.destroy(); resolve(value); };
  socket.setTimeout(300, () => done(false)); socket.once('error', () => done(false)); socket.once('connect', () => done(true));
});
const start = async (s, files, deps = {}) => {
  const launch = deps.spawn || spawn;
  await (deps.portFree || portFree)(s.localPort);
  const child = launch(s.executable, argsFor(s, files.knownHostsFile, files.configFile), {
    shell: false, windowsHide: true, stdio: ['ignore','ignore','pipe'],
    env: { ...Object.fromEntries(Object.entries(process.env).filter(([key]) =>
      /^(PATH|SYSTEMROOT|WINDIR|USERPROFILE|HOME|LOCALAPPDATA|TEMP|TMP|SSH_AUTH_SOCK|SSH_AGENT_PID)$/i.test(key))), LC_ALL: 'C', LANG: 'C' },
  });
  let active = true; let ready = false; let failure = 'SSH_TUNNEL_CLOSED'; let buffer = '';
  let authenticated = false; let listening = false;
  const connections = new Set();
  const invalidate = code => {
    active = false; failure = code;
    for (const c of connections) c.destroy();
  };
  child.on('error', () => invalidate('SSH_PROCESS_FAILED'));
  child.on('exit', () => invalidate('SSH_TUNNEL_CLOSED'));
  child.on('close', () => invalidate('SSH_TUNNEL_CLOSED'));
  child.stderr.on('data', chunk => {
    buffer = (buffer + chunk.toString('utf8')).slice(-16384);
    if (/REMOTE HOST IDENTIFICATION HAS CHANGED|Host key verification failed/i.test(buffer)) invalidate('SSH_HOST_KEY_REJECTED');
    if (/Authenticated to ssh\.railway\.com .*using "publickey"/.test(buffer)) authenticated = true;
    if (buffer.includes(`Local forwarding listening on 127.0.0.1 port ${s.localPort}.`)) listening = true;
    if (/bind .*Address already in use|Could not request local forwarding|Permission denied/i.test(buffer)) invalidate('SSH_FORWARD_FAILED');
  });
  const assertAlive = () => need(active && ready && child.exitCode === null && child.signalCode === null, failure);
  let closing;
  const onInterrupt = () => { void close().then(() => process.exit(130), () => process.exit(1)); };
  const onTerminate = () => { void close().then(() => process.exit(143), () => process.exit(1)); };
  const close = () => {
    if (closing) return closing;
    closing = (async () => {
      process.removeListener('SIGINT', onInterrupt); process.removeListener('SIGTERM', onTerminate);
      invalidate('SSH_TUNNEL_CLOSED');
      if (child.exitCode === null && child.signalCode === null) {
        await new Promise(resolve => {
          const timer = setTimeout(resolve, 2000);
          child.once('close', () => { clearTimeout(timer); resolve(); });
          child.kill(); // Only this runner's own SSH child, never an external process.
        });
        need(child.exitCode !== null || child.signalCode !== null, 'SSH_CLEANUP_NOT_CONFIRMED');
      }
    })();
    return closing;
  };
  process.once('SIGINT', onInterrupt); process.once('SIGTERM', onTerminate);
  try {
    const deadline = Date.now() + (deps.timeoutMs ?? 15000);
    while (Date.now() < deadline) {
      need(active && child.exitCode === null && child.signalCode === null, failure);
      if (authenticated && listening && await (deps.probePort || probePort)(s.localPort)) {
        ready = true; assertAlive();
        return { assertAlive, close, spec: s, bind: c => {
          assertAlive(); connections.add(c);
          return new Proxy(c, { get(target, key) {
            const value = target[key];
            if (typeof value !== 'function') return value;
            if (['destroy','end'].includes(key)) return value.bind(target);
            return async (...args) => { assertAlive(); const result = await value.apply(target, args); assertAlive(); return result; };
          } });
        } };
      }
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    fail('SSH_TUNNEL_TIMEOUT');
  } catch (error) { await close(); throw error; }
};
const open = async (p, env, base) => {
  need(p.ssh && p.ssh.environment === p.environment, 'SSH_ENVIRONMENT_MAPPING_REQUIRED');
  const knownHosts = await fs.readFile(p.ssh.knownHostsFile, 'utf8');
  const s = specFor(p, env, knownHosts);
  const directory = await fs.mkdtemp(path.join(base, 'ssh-session-'));
  const files = { knownHostsFile: path.join(directory, 'known_hosts'), configFile: path.join(directory, 'empty_config') };
  await fs.writeFile(files.knownHostsFile, s.knownHosts, { flag: 'wx', mode: 0o600 });
  await fs.writeFile(files.configFile, '', { flag: 'wx', mode: 0o600 });
  return start(s, files);
};
const connect = async (tunnel, options, createConnection, validateIdentity, identitySql) => {
  tunnel.assertAlive();
  need(options.host === '127.0.0.1' && options.port === tunnel.spec.localPort && !options.ssl && !options.stream
    && !options.socketPath, 'SSH_DATABASE_ROUTE_REQUIRED');
  let c;
  try {
    c = await createConnection(options); tunnel.assertAlive();
    const guarded = tunnel.bind(c);
    const [[identity]] = await guarded.query(identitySql);
    validateIdentity(identity);
    return guarded;
  } catch (error) { c?.destroy(); throw error; }
};
module.exports = { specFor, argsFor, start, open, connect };
