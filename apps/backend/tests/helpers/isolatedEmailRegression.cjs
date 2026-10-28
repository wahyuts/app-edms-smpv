const Module = require('node:module');
const path = require('node:path');
const net = require('node:net');

// Preload only for explicitly selected regression tests. No runtime .env,
// real database/storage/provider, socket connections, or HTTP test servers.
const root = path.resolve(__dirname, '../../src');
const forbidden = () => { throw new Error('External I/O prohibited in isolated email regression'); };
const env = {
  appEnv: 'development', appName: 'Isolated Test', appVersion: 'test', bcryptRounds: 4,
  passwordResetExpiresIn: '15m',
  jwt: { secret: 'synthetic-isolated-test-secret-not-a-runtime-credential', expiresIn: '15m', refreshTokenExpiresIn: '7d' },
  cookie: { secure: false, sameSite: 'lax' },
  email: { provider: 'dummy', useResend: false, enableDevEmailOutbox: false,
    from: 'EDMS <test@example.test>', frontendResetPasswordUrl: 'https://example.test/reset-password' },
  upload: { maxFileSizeBytes: 25 * 1024 * 1024, temporaryTtlHours: 24 },
  developmentReset: { enabled: false },
};
const stubs = new Map([
  [path.join(root, 'config/env.js'), env],
  [path.join(root, 'config/database.js'), { pool: { execute: forbidden, query: forbidden, getConnection: forbidden, end: async () => {} } }],
  [path.join(root, 'services/storage.service.js'), {
    finalize: forbidden, delete: forbidden, move: forbidden, exists: forbidden, getStream: forbidden,
  }],
  [path.join(root, 'services/approvalEmailDispatcher.service.js'), { dispatch() {} }],
]);
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'dotenv' || request.startsWith('mysql2') || request.startsWith('@aws-sdk/')) return forbidden();
  if (request === 'resend') return { Resend: class { constructor() { forbidden(); } } };
  const filename = Module._resolveFilename(request, parent, isMain);
  if (stubs.has(filename)) return stubs.get(filename);
  return originalLoad.call(this, request, parent, isMain);
};
net.Socket.prototype.connect = forbidden;
net.Server.prototype.listen = forbidden;
globalThis.fetch = forbidden;
