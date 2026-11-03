const assert = require('node:assert/strict');
const test = require('node:test');
const express = require('express');
const cookieParser = require('cookie-parser');
const { fixture } = require('../helpers/isolatedDocumentCoordination.cjs');
const { pool } = require('../../src/config/database');
const { pool: evidencePool } = require('../../src/config/documentCoordinationDatabase');
const documents = require('../../src/repositories/document.repository');
const memberships = require('../../src/repositories/projectMembership.repository');
const files = require('../../src/repositories/fileAccess.repository');
const auth = require('../../src/services/auth.service');
const admission = require('../../src/services/documentAdmission.service');
const { generateAccessToken } = require('../../src/utils/token');
const { AUTH_COOKIE_NAMES } = require('../../src/constants/auth.constants');
const { DOCUMENT_PERMISSION } = require('../../src/constants/document.constants');

test('HTTP real document routes enforce 401/403/409, nested guards and other-document isolation', async (t) => {
  const f = fixture();
  for (const target of [pool, evidencePool]) {
    t.mock.method(target, 'getConnection', f.pool.getConnection);
    t.mock.method(target, 'execute', f.pool.execute);
  }
  let allowed = true; let member = true;
  const document = (id) => ({ id, projectId: 'P1', documentNumber: id, lifecycle: 'Active', status: 'Process Review',
    activeRevisionId: 'R1', activeFileId: 'F1' });
  t.mock.method(documents, 'findDocumentFoundationById', async (id) => document(id));
  t.mock.method(documents, 'findDocumentRegisterById', async (id) => document(id));
  t.mock.method(memberships, 'findActiveMembershipByProjectAndUser', async () => member ? { officialRole: 'Admin' } : null);
  t.mock.method(auth, 'getAuthenticatedUser', async () => ({ user: { id: 1, fullName: 'Test Admin' },
    officialRole: 'Admin', activeProject: { id: 'P1' },
    permissions: allowed ? Object.values(DOCUMENT_PERMISSION).map((code) => ({ code })) : [],
  }));
  const documentFile = ({ documentId }) => ({ document: document(documentId), revision: { id: 'R1' },
    storedFile: { fileId: 'F1', storageKey: 'legacy/file.pdf' } });
  t.mock.method(files, 'findActiveDocumentFile', async (documentId) => documentFile({ documentId }));
  t.mock.method(files, 'findRevisionDocumentFile', async (args) => documentFile(args));
  t.mock.method(files, 'findWorkflowAttachmentById', async ({ documentId }) => ({ projectId: 'P1', documentId,
    storedFile: { storageKey: 'legacy/attachment.pdf' } }));

  const app = express(); app.use(express.json(), cookieParser());
  app.use('/api/v1/documents', require('../../src/routes/document.routes'));
  app.use(require('../../src/middlewares/errorHandler'));
  const server = await new Promise((resolve) => {
    const running = app.listen(0, '127.0.0.1', () => resolve(running));
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/v1/documents`;
  const headers = { 'Content-Type': 'application/json', Cookie: `${AUTH_COOKIE_NAMES.ACCESS_TOKEN}=${generateAccessToken(1, 'test-session')}` };
  assert.equal((await fetch(`${base}/D1`)).status, 401);
  allowed = false;
  assert.equal((await fetch(`${base}/D1`, { headers })).status, 403);
  allowed = true; member = false;
  assert.equal((await fetch(`${base}/D1`, { headers })).status, 403);
  member = true;
  await assert.rejects(admission.reserveDelete({ activeProject: { id: 'P2' }, actorUserId: 1,
    documentId: 'D1', requestIdentity: 'cross-project' }), (error) => error.statusCode === 403);
  await admission.reserveDelete({ activeProject: { id: 'P1' }, actorUserId: 1, documentId: 'D1', requestIdentity: 'http-test' });

  const expected = { expectedWorkflowStatus: 'Process Review', expectedActiveRevisionId: 'R1' };
  const cases = [
    ['GET', ''], ['GET', '/history'], ['GET', '/comments'], ['GET', '/revisions'],
    ['GET', '/view'], ['GET', '/download'], ['GET', '/revisions/R1/view'], ['GET', '/revisions/R1/download'],
    ['GET', '/workflow-attachments/A1/download'], ['PATCH', '/comments/read', {}],
    ['PATCH', '', { description: 'Updated', ...expected }], ['PATCH', '/archive', { reason: 'Test' }],
    ['PATCH', '/restore', {}], ['POST', '/approve', expected],
    ['POST', '/approve-with-comment', { ...expected, comment: 'Test' }], ['POST', '/reject', { ...expected, comment: 'Test' }],
    ['POST', '/revisions', { ...expected, temporaryFileId: 'T1' }],
    ['POST', '/workflow-attachments', { commentId: 'C1', temporaryFileId: 'T1' }],
  ];
  for (const [method, suffix, body] of cases) {
    const response = await fetch(`${base}/D1${suffix}`, { method, headers,
      ...(body ? { body: JSON.stringify(body) } : {}) });
    const payload = await response.json();
    assert.equal(response.status, 409, `${method} ${suffix}: ${JSON.stringify(payload)}`);
    assert.equal(payload.success, false);
    assert.equal(payload.code, 'DOCUMENT_DELETION_IN_PROGRESS');
    assert.equal(payload.message, 'This document is currently being permanently deleted by an Admin. No further actions are allowed.');
  }
  assert.equal((await fetch(`${base}/D2`, { headers })).status, 200);
  assert.ok(!f.state.trace.includes('OWNED MUTATION'));
});
