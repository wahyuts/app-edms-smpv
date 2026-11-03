import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import { transformWithOxc } from 'vite';
import { reconcilePermanentDelete } from '../src/features/document-register/utils/permanentDeleteReconciliation.js';

const base = new URL('../src/features/document-register/', import.meta.url);
const source = await readFile(new URL('components/PermanentDeleteAction.jsx', base), 'utf8');
const code = (await transformWithOxc(source, 'permanent.jsx', { jsx: { runtime: 'automatic' } })).code;
const load = async (code, imports) => {
  const module = new SourceTextModule(code);
  await module.link((name) => {
    assert.ok(imports[name], name);
    return new SyntheticModule(Object.keys(imports[name]), function () { for (const [key, value] of Object.entries(imports[name])) this.setExport(key, value); });
  });
  await module.evaluate(); return module.namespace;
};
const createHarness = async ({ role = 'Admin', status = 'Process Review', lifecycle = 'Active' } = {}) => {
  const h = { context: { activeProject: { id: 'P1' }, activeMembership: { officialRole: role } }, calls: [], toasts: [], invalidations: [], refreshed: 0,
    clock: 0, response: async () => ({ status: 'COMPLETED', message: 'done' }), statusResponse: async () => ({ status: 'COMPLETED', message: 'done' }) };
  let states = []; let cursor = 0; let initialized = false; let effects = []; let cleanup = []; let key;
  const jsx = (type, props, key) => ({ type, props, key });
  const store = (selector) => selector(h.context); store.getState = () => h.context;
  const hooks = {
    createElement: (type, props, ...children) => jsx(type, { ...props, ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}) }, props?.key),
    useState: (initial) => { const slot = cursor++; if (!(slot in states)) states[slot] = initial;
      return [states[slot], (value) => { states[slot] = typeof value === 'function' ? value(states[slot]) : value; }]; },
    useRef: (initial) => { const slot = cursor++; if (!(slot in states)) states[slot] = { current: initial }; return states[slot]; },
    useCallback: (callback) => callback,
    useEffect: (callback) => { if (!initialized) effects.push(callback); }, useId: () => 'test-delete-title',
  };
  const module = await load(code, {
    react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
    'lucide-react': { Loader2: 'Loader2', RefreshCw: 'RefreshCw', Trash2: 'Trash2' }, './DocumentActionModal': { default: 'Modal' },
    '@/shared/stores/project-context.store': { useProjectContextStore: store }, '@/shared/components/toast': { useToast: () => ({ showToast: (toast) => h.toasts.push(toast) }) },
    '@/shared/api/query-client': { queryClient: { invalidateQueries: async ({ queryKey }) => h.invalidations.push(queryKey[0]) } },
    '../utils/documentRuntimeQuerySync': { synchronizeDocumentRuntimeQueries: async ({ refreshCurrentSurface }) => {
      h.invalidations.push('documents','dashboard','sla-monitoring','escalation'); await refreshCurrentSurface();
    } },
    '../utils/permanentDeleteReconciliation': { reconcilePermanentDelete: (args) => reconcilePermanentDelete(args, {
      now: () => h.clock, wait: async (milliseconds) => { h.clock += milliseconds; },
    }) },
    '../services/permanent-delete.service': { PermanentDeleteService: {
      remove: async (args) => { h.calls.push({ method: 'DELETE', ...args }); return h.response(args); },
      status: async (args) => { h.calls.push({ method: 'GET', ...args }); return h.statusResponse(args); },
    } },
  });
  const dispose = () => { cleanup.forEach((fn) => fn?.()); cleanup = []; states = []; initialized = false; effects = []; };
  h.render = () => {
    const element = module.PermanentDeleteAction({ documentItem: { id: 'D1', projectId: 'P1', documentNumber: 'PFD-EDMS-123', status, lifecycle },
      disabled: false, onRunAction: (fn) => fn(), onComplete: async () => { h.refreshed += 1; } });
    if (!element) { dispose(); key = null; h.tree = null; h.modal = null; h.button = null; return; }
    if (key !== element.key) { dispose(); key = element.key; }
    cursor = 0; h.tree = element.type(element.props);
    if (!initialized) { initialized = true; cleanup = effects.map((fn) => fn()); effects = []; }
    h.button = h.tree.props.children[0]; h.modal = h.tree.props.children[1] || null;
  };
  h.open = () => { h.button.props.onClick(); h.render(); };
  h.inspectModal = () => { const previous = initialized; initialized = true; const element = module.DeleteDocumentModal(h.modal.props); initialized = previous; return element; };
  h.render(); return h;
};

for (const role of ['Document Owner','Team Process','Team Project','Viewer',null]) test(`Trash hidden for ${role}`, async () => {
  const h = await createHarness({ role }); assert.equal(h.tree, null); assert.equal(h.calls.length, 0);
});
for (const status of ['Process Review','Process Comment','Project Review','Project Comment','Approved','Archived']) test(`Admin Trash visible for ${status}`, async () => {
  const h = await createHarness({ status }); assert.equal(h.button.props['aria-label'], 'Delete Document');
});
test('Trash opens approved modal only; selected number/status and warning text match mockup', async () => {
  const h = await createHarness(); h.open(); assert.equal(h.calls.length, 0);
  assert.equal(h.modal.props.documentItem.documentNumber, 'PFD-EDMS-123');
  assert.equal(h.modal.props.documentItem.status, 'Process Review');
  const modal = h.inspectModal(); assert.equal(modal.props.title, 'Delete Document');
  const text = JSON.stringify(modal);
  for (const expected of ['DOCUMENT NUMBER','CURRENT STATUS','PERMANENTLY','Deleted documents:',
    'Related document and attachments will be removed','Delete activity can be seen in Audit Trail',
    'Cannot be viewed again','Cannot be downloaded','Cannot be restored','Add delete reason...','REASON (OPTIONAL)']) assert.ok(text.includes(expected), expected);
});
test('Cancel and X close without API, reservation or cache mutation', async () => {
  const h = await createHarness(); h.open(); h.modal.props.onCancel(); h.render(); assert.equal(h.modal, null);
  h.open(); h.inspectModal().props.onClose(); h.render(); assert.equal(h.modal, null);
  assert.equal(h.calls.length, 0); assert.equal(h.invalidations.length, 0);
});
test('Delete confirms once, trims optional reason and refreshes all relevant caches only after Completed', async () => {
  const h = await createHarness(); h.open(); h.modal.props.onReasonChange('  duplicate  '); h.render();
  await h.modal.props.onConfirm(); h.render(); assert.equal(h.calls.length, 1); assert.equal(h.calls[0].reason, 'duplicate');
  assert.ok(h.calls[0].requestKey); assert.equal(h.modal, null); assert.equal(h.refreshed, 1);
  assert.deepEqual(h.invalidations.sort(), ['documents','dashboard','sla-monitoring','escalation','notifications','audit-trail'].sort());
  assert.equal(h.toasts[0].variant, 'success');
});
test('Empty reason is valid; double submission and cancel during processing are blocked', async () => {
  const h = await createHarness(); let done; h.response = () => new Promise((resolve) => { done = resolve; }); h.open();
  const pending = h.modal.props.onConfirm(); await h.modal.props.onConfirm(); h.modal.props.onCancel(); h.render();
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].reason, ''); assert.ok(h.modal); assert.equal(h.modal.props.busy, true);
  done({ status: 'COMPLETED' }); await pending;
});
for (const status of ['PENDING','UNKNOWN','FAILED','CONFLICT']) test(`${status} never shows success, removes a row or refreshes caches optimistically`, async () => {
  const h = await createHarness(); h.response = h.statusResponse = async () => ({ status, operationId: 'OP', message: 'Status operasi' }); h.open();
  await h.modal.props.onConfirm(); h.render(); assert.ok(h.modal); assert.equal(h.modal.props.result.status, status === 'FAILED' ? 'FAILED' : 'UNKNOWN');
  assert.equal(h.toasts.length, 0); assert.equal(h.refreshed, 0); assert.equal(h.invalidations.length, 0);
  if (status !== 'FAILED') { await h.modal.props.onConfirm(); assert.equal(h.calls.filter(c => c.method === 'DELETE').length, 1); }
});
test('Pending reconciliation never repeats DELETE; exhausted polling retains manual GET fallback', async () => {
  const h = await createHarness(); h.response = h.statusResponse = async () => ({ status: 'PENDING', operationId: 'OP' }); h.open();
  const staleConfirm = h.modal.props.onConfirm;
  await staleConfirm(); await staleConfirm(); h.render(); await h.modal.props.onConfirm(); h.render();
  assert.equal(h.calls.filter(c => c.method === 'DELETE').length, 1);
  assert.equal(h.calls.filter(c => c.method === 'GET').length, 15);
  assert.equal(h.modal.props.result.status, 'UNKNOWN'); assert.equal(h.modal.props.busy, false);
  h.statusResponse = async () => ({ status: 'COMPLETED', operationId: 'OP' });
  await h.modal.props.onRefresh(); assert.equal(h.calls.at(-1).method, 'GET'); assert.equal(h.calls.at(-1).operationId, 'OP');
  assert.equal(h.toasts.length, 1);
});
test('Project switch/role change clears selection and ignores late responses; stale callbacks cannot submit', async () => {
  const h = await createHarness(); let done; h.response = () => new Promise((resolve) => { done = resolve; }); h.open();
  const staleConfirm = h.modal.props.onConfirm; const pending = staleConfirm();
  h.context = { activeProject: { id: 'P2' }, activeMembership: { officialRole: 'Viewer' } }; h.render(); assert.equal(h.tree, null);
  done({ status: 'COMPLETED' }); await pending; await staleConfirm();
  assert.equal(h.calls.length, 1); assert.equal(h.toasts.length, 0); assert.equal(h.invalidations.length, 0);
  h.context = { activeProject: { id: 'P2' }, activeMembership: { officialRole: 'Admin' } }; h.render(); assert.equal(h.modal, null);
});
test('Network failure automatically reconciles completion without manual refresh', async () => {
  const h = await createHarness(); h.response = async () => { throw new Error('Koneksi terputus.'); }; h.open();
  await h.modal.props.onConfirm(); h.render(); assert.equal(h.modal, null);
  assert.equal(h.calls[1].method, 'GET'); assert.equal(h.toasts.length, 1); assert.equal(h.refreshed, 1);
});

test('Delayed completion pins operation identity and runs success flow exactly once', async () => {
  const h = await createHarness(); let count = 0;
  h.response = async () => ({ status: 'PENDING', operationId: 'OP' });
  h.statusResponse = async () => ({ status: ++count === 3 ? 'COMPLETED' : 'UNKNOWN', operationId: 'OP' });
  h.open(); const staleConfirm = h.modal.props.onConfirm;
  await staleConfirm(); await staleConfirm(); h.render();
  assert.equal(h.modal, null); assert.equal(count, 3);
  assert.equal(h.calls.filter(c => c.method === 'DELETE').length, 1);
  assert.ok(h.calls.slice(1).every(c => c.operationId === 'OP' && c.timeout <= 5000));
  assert.equal(h.toasts.length, 1); assert.equal(h.refreshed, 1);
  assert.deepEqual(h.invalidations.sort(), ['documents','dashboard','sla-monitoring','escalation','notifications','audit-trail'].sort());
});

for (const code of ['ECONNABORTED', 'ERR_CANCELED']) test(`${code} reconciles through GET, never another DELETE`, async () => {
  const h = await createHarness();
  h.response = async () => { throw Object.assign(new Error('Status penghapusan belum dapat dipastikan.'), { code }); };
  h.open(); await h.modal.props.onConfirm(); h.render();
  assert.equal(h.modal, null); assert.equal(h.calls.length, 2);
  assert.equal(h.calls[1].method, 'GET'); assert.equal(h.toasts.length, 1);
});

test('Unmount/project change aborts an active reconciliation GET and ignores late completion', async () => {
  const h = await createHarness(); let resolveStatus;
  h.response = async () => ({ status: 'PENDING', operationId: 'OP' });
  h.statusResponse = () => new Promise(resolve => { resolveStatus = resolve; });
  h.open(); const pending = h.modal.props.onConfirm();
  while (!resolveStatus) await Promise.resolve();
  const signal = h.calls[1].signal;
  h.context = { activeProject: { id: 'P2' }, activeMembership: { officialRole: 'Viewer' } }; h.render();
  assert.equal(signal.aborted, true);
  resolveStatus({ status: 'COMPLETED', operationId: 'OP' }); await pending;
  assert.equal(h.calls.length, 2); assert.equal(h.toasts.length, 0); assert.equal(h.refreshed, 0);
});

test('Final failure discovered by polling never follows success flow', async () => {
  const h = await createHarness(); h.response = async () => ({ status: 'PENDING', operationId: 'OP' });
  h.statusResponse = async () => ({ status: 'FAILED', operationId: 'OP', message: 'Penyimpanan belum berhasil.' });
  h.open(); await h.modal.props.onConfirm(); h.render();
  assert.equal(h.modal.props.result.status, 'FAILED'); assert.equal(h.calls.length, 2);
  assert.equal(h.toasts.length, 0); assert.equal(h.invalidations.length, 0);
});

test('Lost response discovers the existing operation after transient 404 and pins its ID', async () => {
  const calls = []; const controller = new AbortController(); let clock = 0;
  const response = await reconcilePermanentDelete({ documentId: 'D1', projectId: 'P1',
    signal: controller.signal, isCurrent: () => true, status: async args => {
      calls.push(args);
      if (calls.length === 1) throw Object.assign(new Error('Not visible yet'), { status: 404 });
      return { status: calls.length === 3 ? 'COMPLETED' : 'PENDING', operationId: 'OP' };
    } }, { now: () => clock, wait: async ms => { clock += ms; } });
  assert.equal(response.status, 'COMPLETED'); assert.equal(calls.length, 3);
  assert.equal(calls[0].operationId, undefined); assert.equal(calls[2].operationId, 'OP');
});

test('Polling deadline bounds slow GETs and returns Unknown rather than leaving busy/pending state', async () => {
  let clock = 0; let calls = 0;
  const response = await reconcilePermanentDelete({ documentId: 'D1', projectId: 'P1', operationId: 'OP',
    signal: new AbortController().signal, isCurrent: () => true, status: async args => {
      calls++; clock += args.timeout;
      throw new Error('Timeout');
    } }, { now: () => clock, wait: async ms => { clock += ms; } });
  assert.equal(response.status, 'UNKNOWN'); assert.equal(response.operationId, 'OP');
  assert.ok(calls < 15); assert.equal(clock, 60000);
});

for (const changed of [{ operationId: 'OTHER' }, { projectId: 'P2' }, { documentId: 'D2' }]) {
  test(`Mismatched operation scope cannot confirm completion: ${JSON.stringify(changed)}`, async () => {
    const response = await reconcilePermanentDelete({ documentId: 'D1', projectId: 'P1', operationId: 'OP',
      signal: new AbortController().signal, isCurrent: () => true,
      status: async () => ({ status: 'COMPLETED', operationId: 'OP', ...changed }) });
    assert.equal(response.status, 'UNKNOWN');
  });
}

for (const status of [401, 403, 422]) test(`Polling stops on authorization/validation error ${status}`, async () => {
  let calls = 0;
  await assert.rejects(reconcilePermanentDelete({ documentId: 'D1', projectId: 'P1',
    signal: new AbortController().signal, isCurrent: () => true,
    status: async () => { calls++; throw Object.assign(new Error('Ditolak'), { status }); } }), error => error.status === status);
  assert.equal(calls, 1);
});

test('Real polling wait is canceled promptly on unmount without another status request', async () => {
  const controller = new AbortController(); let calls = 0;
  const pending = reconcilePermanentDelete({ documentId: 'D1', projectId: 'P1',
    signal: controller.signal, isCurrent: () => true,
    status: async () => { calls++; return { status: 'PENDING' }; } });
  await Promise.resolve(); controller.abort();
  assert.equal(await pending, null); assert.equal(calls, 1);
});
test('Stale rows from a previous project never expose Trash under the new project Admin role', async () => {
  const h = await createHarness(); h.context.activeProject = { id: 'P2' }; h.render();
  assert.equal(h.tree, null); assert.equal(h.calls.length, 0);
});
test('Actual shared action group is used by Register and SLA; old action buttons are preserved', async () => {
  const group = await readFile(new URL('components/DocumentActionGroup.jsx', base), 'utf8');
  assert.match(group, /!isDashboard && !isReadOnlyActionMode && projectRoleName === OFFICIAL_ROLE.ADMIN/);
  assert.match(group, /<PermanentDeleteAction/);
  for (const name of ['View Document','Edit Document','Download Document','View Comments','Archive Document','Restore Document','ApprovalConfirmationModal']) assert.ok(group.includes(name));
  const sla = await readFile(new URL('../src/features/sla-monitoring/components/SlaMonitoringTable.jsx', import.meta.url), 'utf8');
  assert.match(sla, /<DocumentActionGroup/);
  const register = await readFile(new URL('pages/DocumentRegisterPage.jsx', base), 'utf8');
  assert.ok(register.includes('DRAWING_CONTEXT.PFD') && register.includes('DRAWING_CONTEXT.PID'));
});
test('API adapter sends DELETE only on remove and GET only on status, with scoped params/idempotency header', async () => {
  const calls = []; const module = await load(await readFile(new URL('services/permanent-delete.service.js', base), 'utf8'), {
    '@/shared/api': { apiClient: {
      delete: async (...args) => { calls.push(['DELETE', ...args]); return { data: { data: { status: 'COMPLETED' }, message: 'Done' } }; },
      get: async (...args) => { calls.push(['GET', ...args]); return { data: { data: { status: 'PENDING' }, message: 'Pending' } }; },
    } },
  });
  await module.PermanentDeleteService.remove({ documentId: 'D1', projectId: 'P1', reason: '', requestKey: 'same-key' });
  const signal = new AbortController().signal;
  await module.PermanentDeleteService.status({ documentId: 'D1', projectId: 'P1', operationId: 'OP', signal, timeout: 5000 });
  assert.equal(calls[0][2].headers['Idempotency-Key'], 'same-key'); assert.equal(calls[0][2].params.projectId, 'P1');
  assert.equal(calls[1][0], 'GET'); assert.equal(calls[1][2].params.operationId, 'OP');
  assert.equal(calls[1][2].signal, signal); assert.equal(calls[1][2].timeout, 5000);
});
test('Authentication/authorization errors are presented in Bahasa Indonesia without changing shared auth', async () => {
  for (const status of [401,403]) {
    const module = await load(await readFile(new URL('services/permanent-delete.service.js', base), 'utf8'), {
      '@/shared/api': { apiClient: { delete: async () => { throw { response: { status, data: { message: 'Unauthenticated or Forbidden' } } }; } } },
    });
    await assert.rejects(module.PermanentDeleteService.remove({ documentId: 'D', projectId: 'P', requestKey: 'same-key' }),
      (error) => error.status === status && /login|ditolak/.test(error.message));
  }
});
