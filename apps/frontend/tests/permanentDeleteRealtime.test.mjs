import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import * as constants from '../src/shared/realtime/realtime.constants.js';
import * as documentConstants from '../src/features/document-register/constants/document.constants.js';
import { createRealtimeRefetchCoalescer } from '../src/features/document-register/utils/realtimeRefetchCoalescer.js';
import { beginPermanentDeleteConfirmation, waitForPermanentDeleteConfirmations } from '../src/features/document-register/utils/permanentDeleteConfirmation.js';

const base = new URL('../src/', import.meta.url);
const load = async (file, imports) => {
  const module = new SourceTextModule(await readFile(new URL(file, base), 'utf8'));
  await module.link(name => {
    assert.ok(imports[name], `Unexpected import ${name}`);
    return new SyntheticModule(Object.keys(imports[name]), function () {
      for (const [key, value] of Object.entries(imports[name])) this.setExport(key, value);
    });
  });
  await module.evaluate(); return module.namespace;
};
const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const event = (overrides = {}) => ({ type: 'document.deleted', eventId: 'DELETE:OP:U2', version: 1,
  projectId: 'P1', documentId: 'D', resourceType: 'Document', resourceId: 'D', scope: 'user-project', recipientUserId: 2, ...overrides });

const harness = async () => {
  const h = { context: { activeProject: { id: 'P1' }, activeOfficialRole: 'Admin' }, events: new Set(), recovery: new Set() };
  const store = selector => selector(h.context); store.getState = () => h.context; h.store = store;
  let slots = [], cursor = 0, pending = [];
  const changed = (a, b) => !a || !b || a.length !== b.length || a.some((x,i) => !Object.is(x,b[i]));
  h.hooks = {
    useRef: value => { const i = cursor++; slots[i] ||= { current: value }; return slots[i]; },
    useState: initial => { const i = cursor++; if (!(i in slots)) slots[i] = { value: initial };
      return [slots[i].value, next => { slots[i].value = typeof next === 'function' ? next(slots[i].value) : next; }]; },
    useEffect: (callback, deps) => { const i = cursor++; if (changed(slots[i]?.deps, deps)) {
      pending.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: callback() }; });
    } },
    useMemo: (callback, deps) => { const i = cursor++; if (changed(slots[i]?.deps, deps)) slots[i] = { deps, value: callback() }; return slots[i].value; },
    useCallback: callback => callback,
  };
  h.realtime = {
    ...constants,
    useRealtimeEvent: listener => h.hooks.useEffect(() => { h.events.add(listener); return () => h.events.delete(listener); }, [listener]),
    useRealtimeRecovery: listener => h.hooks.useEffect(() => { h.recovery.add(listener); return () => h.recovery.delete(listener); }, [listener]),
  };
  h.render = callback => { cursor = 0; const result = callback(); const effects = pending; pending = []; effects.forEach(fn => fn()); return result; };
  h.dispose = () => { slots.forEach(slot => slot?.cleanup?.()); slots = []; };
  h.emit = value => [...h.events].forEach(listener => listener(value));
  h.reconnect = projectId => [...h.recovery].forEach(listener => listener({ projectId, reason: 'reconnected' }));
  h.deleteHook = (await load('features/document-register/hooks/useRealtimePermanentDeleteSync.js', {
    react: h.hooks, '@/shared/realtime': h.realtime,
    '@/shared/stores/project-context.store': { useProjectContextStore: store },
    '../utils/realtimeRefetchCoalescer': { createRealtimeRefetchCoalescer },
    '../utils/permanentDeleteConfirmation': { waitForPermanentDeleteConfirmations },
  })).useRealtimePermanentDeleteSync;
  return h;
};

test('Delete subscriber validates project, coalesces bursts and suppresses duplicate IDs after flush', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] }); const h = await harness(); t.after(h.dispose);
  let refreshes = 0; h.render(() => h.deleteHook(() => { refreshes++; }));
  h.emit(event({ projectId: 'P2' })); h.emit(event({ type: 'notification.created' }));
  t.mock.timers.tick(500); await settle(); assert.equal(refreshes, 0);
  h.emit(event()); h.emit(event()); h.emit(event({ eventId: 'DELETE:OP2:U2' }));
  t.mock.timers.tick(500); await settle(); assert.equal(refreshes, 1);
  h.emit(event()); t.mock.timers.tick(500); await settle(); assert.equal(refreshes, 1);
});

test('Reconnect and initial project connection reconcile missed events without browser reload', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] }); const h = await harness(); t.after(h.dispose);
  let refreshes = 0; h.render(() => h.deleteHook(() => { refreshes++; }));
  h.reconnect('P2'); t.mock.timers.tick(500); await settle(); assert.equal(refreshes, 0);
  h.reconnect('P1'); h.emit(event({ type: 'connected', eventId: 'CONNECTED' }));
  t.mock.timers.tick(500); await settle(); assert.equal(refreshes, 1);
});

test('A second deletion during an in-flight refresh schedules a final reconciliation instead of dropping it', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] }); const h = await harness(); t.after(h.dispose);
  let refreshes = 0; let finish;
  h.render(() => h.deleteHook(() => {
    refreshes++;
    if (refreshes === 1) return new Promise(resolve => { finish = resolve; });
  }));
  h.emit(event()); t.mock.timers.tick(500); await settle(); assert.equal(refreshes, 1);
  h.emit(event({ eventId: 'SECOND-OPERATION' })); t.mock.timers.tick(500); await settle();
  assert.equal(refreshes, 1); finish(); await settle(); t.mock.timers.tick(500); await settle();
  assert.equal(refreshes, 2);
});

test('Unmount and stale project callbacks cancel queued reconciliation', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] }); const h = await harness();
  let refreshes = 0; h.render(() => h.deleteHook(() => { refreshes++; }));
  h.emit(event()); h.context.activeProject.id = 'P2';
  t.mock.timers.tick(500); await settle(); assert.equal(refreshes, 0);
  h.context.activeProject.id = 'P1'; h.emit(event({ eventId: 'SECOND' })); h.dispose();
  t.mock.timers.tick(500); await settle(); assert.equal(refreshes, 0);
});

test('Initiating tab waits for local Sprint A confirmation, while unrelated projects do not wait', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] }); const h = await harness(); t.after(h.dispose);
  let refreshes = 0; const finish = beginPermanentDeleteConfirmation('P1'); t.after(finish);
  h.render(() => h.deleteHook(() => { refreshes++; }));
  h.emit(event()); t.mock.timers.tick(500); await settle(); assert.equal(refreshes, 0);
  await waitForPermanentDeleteConfirmations('P2');
  finish(); await settle(); assert.equal(refreshes, 1);
});

test('Unmount while waiting for Sprint A does not refresh a departed surface', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] }); const h = await harness();
  let refreshes = 0; const finish = beginPermanentDeleteConfirmation('P1'); t.after(finish);
  h.render(() => h.deleteHook(() => { refreshes++; }));
  h.emit(event()); t.mock.timers.tick(500); await settle(); h.dispose();
  finish(); await settle(); assert.equal(refreshes, 0);
});

test('Actual TanStack caches refetch active dashboard/PFD data and mark inactive PID data stale', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] }); const h = await harness(); t.after(h.dispose);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } });
  t.after(() => client.clear());
  const pfd = ['documents', 'register', 'P1', { drawing: 'PFD', page: 2, search: 'filter' }];
  const pid = ['documents', 'register', 'P1', { drawing: 'P&ID', page: 1 }];
  const dashboard = ['dashboard', 'summary', 'P1']; const calls = [];
  const options = key => ({ queryKey: key, queryFn: async () => { calls.push(key); return { total: 0, rows: [] }; } });
  for (const key of [pfd, pid, dashboard, ['sla-monitoring'], ['escalation'], ['audit-trail']]) client.setQueryData(key, { total: 1 });
  const observers = [pfd, dashboard].map(key => new QueryObserver(client, options(key)));
  const unsubscribers = observers.map(observer => observer.subscribe(() => {})); t.after(() => unsubscribers.forEach(fn => fn()));
  const runtime = await load('features/document-register/hooks/useRealtimeDocumentRuntimeSync.js', {
    react: h.hooks, '@/shared/api/query-client': { queryClient: client }, '@/shared/realtime': h.realtime,
    '@/shared/stores/project-context.store': { useProjectContextStore: h.store },
    '../utils/realtimeRefetchCoalescer': { createRealtimeRefetchCoalescer },
    './useRealtimePermanentDeleteSync': { useRealtimePermanentDeleteSync: h.deleteHook },
  });
  h.render(runtime.useRealtimeDocumentRuntimeSync); h.emit(event());
  t.mock.timers.tick(500); await settle();
  assert.equal(client.getQueryData(pfd).total, 0); assert.equal(client.getQueryData(dashboard).total, 0);
  assert.equal(calls.length, 2); assert.equal(client.getQueryState(pid).isInvalidated, true);
  assert.equal(client.getQueryData(pid).total, 1);
  for (const key of ['sla-monitoring','escalation','audit-trail']) assert.equal(client.getQueryState([key]).isInvalidated, true);
  const pidObserver = new QueryObserver(client, options(pid)); const unsubscribe = pidObserver.subscribe(() => {}); t.after(unsubscribe);
  await settle(); assert.equal(client.getQueryData(pid).total, 0);
  assert.equal(pfd[3].page, 2); assert.equal(pfd[3].search, 'filter');
  h.emit(event()); t.mock.timers.tick(500); await settle(); assert.equal(calls.length, 3);
});

for (const surface of ['sla', 'escalation']) test(`${surface} local-state dataset refetches on Delete and reconnect, preserving filters and clamping pagination`, async t => {
  t.mock.timers.enable({ apis: ['setTimeout','setInterval'] });
  const previous = globalThis.window; globalThis.window = globalThis;
  const h = await harness(); t.after(() => { h.dispose(); globalThis.window = previous; }); let loads = 0;
  let rows = Array.from({ length: 6 }, (_, i) => ({ id: `D${i}`, documentNumber: `PFD-${i}`,
    description: 'keep', status: 'Process Review', slaStatus: 'On Track', escalationLevel: 'Level 1' }));
  const imports = {
    react: h.hooks,
    '@/features/document-register/constants/document.constants': documentConstants,
    '@/features/document-register/hooks/useRealtimePermanentDeleteSync': { useRealtimePermanentDeleteSync: h.deleteHook },
    '@/features/sla-management/hooks/useSlaRuntimeClock': { useSlaRuntimeClock: () => 0 },
    '@/features/sla-management/utils/sla-timer-display': { resolveLiveSlaTimer: row => row, resolveCurrentAssigneeRoleDisplay: () => 'Team Process' },
    '@/shared/stores/project-context.store': { useProjectContextStore: h.store },
    ...(surface === 'sla' ? { '../services/sla-monitoring.service': { SlaMonitoringService: {
      getDocuments: async () => { loads++; return rows; }, createSummary: items => ({ total: items.length }),
    } } }
      : { '../services/escalation.service': { EscalationService: { getEscalations: async () => { loads++; return rows; } } } }),
  };
  const file = surface === 'sla' ? 'features/sla-monitoring/hooks/useSlaMonitoringTable.js' : 'features/escalation-alert/hooks/useEscalationAlertTable.js';
  const module = await load(file, imports); const hook = surface === 'sla' ? module.useSlaMonitoringTable : module.useEscalationAlertTable;
  let state = h.render(hook); t.mock.timers.tick(0); await settle(); state = h.render(hook);
  state.setPageNumber(2); state = h.render(hook); assert.equal(state.pageNumber, 2);
  state.setSearchValue('keep'); state = h.render(hook); state.setPageNumber(2); state = h.render(hook);
  const before = loads; rows = rows.slice(0, 5); h.emit(event()); t.mock.timers.tick(500); await settle();
  state = h.render(hook); await settle(); state = h.render(hook);
  assert.equal(loads, before + 1); assert.equal(state.searchValue, 'keep'); assert.equal(state.pageNumber, 1);
  assert.equal(state.rows.length, 5);
  h.reconnect('P1'); t.mock.timers.tick(500); await settle(); h.render(hook); await settle();
  assert.equal(loads, before + 2);
});

test('Server-paginated register refetches a valid page after deletion without clearing drawing/search filters', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const previous = globalThis.window; globalThis.window = globalThis;
  const h = await harness(); t.after(() => { h.dispose(); globalThis.window = previous; });
  let total = 6; const keys = [];
  const module = await load('features/document-register/hooks/useDocumentRegisterTable.js', {
    react: h.hooks, '@tanstack/react-query': { useQuery: options => {
      keys.push(options.queryKey); const page = options.queryKey[3].page;
      return { data: { data: page > Math.ceil(total / 5) ? [] : [{ id: 'D', documentNumber: 'PFD-1' }],
        pagination: { page, pageSize: 5, totalItems: total, totalPages: Math.ceil(total / 5) } }, refetch: async () => {} };
    } },
    '@/shared/stores/project-context.store': { useProjectContextStore: h.store },
    '@/features/sla-management/hooks/useSlaRuntimeClock': { useSlaRuntimeClock: () => 0 },
    '@/features/sla-management/utils/sla-timer-display': { resolveLiveSlaTimer: row => row },
    '../constants/document.constants': documentConstants,
    '../services/document-api.service': { DocumentApiService: { getDocuments: async () => [] } },
  });
  const render = () => h.render(() => module.useDocumentRegisterTable({ drawingContext: 'PFD' }));
  let state = render(); t.mock.timers.tick(0); state = render();
  state.setSearchValue('keep'); state = render(); state.setPageNumber(2); state = render();
  assert.equal(state.pageNumber, 2); total = 5; state = render();
  t.mock.timers.tick(0); state = render();
  assert.equal(keys.at(-1)[3].page, 1); assert.equal(state.pageNumber, 1);
  assert.equal(state.searchValue, 'keep'); assert.equal(keys.at(-1)[3].drawing, 'PFD');
  assert.equal(state.rows.length, 1); assert.equal(state.totalItems, 5);
});

test('Existing EventSource registers document.deleted and still delivers notification events and recovery', async () => {
  const emitted = [], recovery = [], names = []; const oldSource = globalThis.EventSource;
  globalThis.EventSource = { CLOSED: 2, CONNECTING: 0 };
  try {
    const source = { close() {}, addEventListener: (name, callback) => names.push([name, callback]) };
    const module = await load('shared/realtime/realtime-client.service.js', {
      '@/app/config/env': { env: { API_BASE_URL: '/api' } }, './realtime.constants': constants,
      './realtime-event-dispatcher': { default: { dispatch: e => emitted.push(e), dispatchRecovery: e => recovery.push(e) } },
      './realtime-event-validator': { parseRealtimeEvent: raw => JSON.parse(raw) },
    });
    const client = new module.RealtimeClient({ userId: 2, projectId: 'P1', eventSourceFactory: () => source });
    client.start(); source.onopen();
    assert.equal(names.filter(([name]) => name === 'document.deleted').length, 1);
    names.find(([name]) => name === 'document.deleted')[1]({ data: JSON.stringify(event()) });
    names.find(([name]) => name === 'notification.created')[1]({ data: JSON.stringify(event({ type: 'notification.created' })) });
    names.find(([name]) => name === 'document.deleted')[1]({ data: JSON.stringify(event({ projectId: 'OTHER' })) });
    assert.deepEqual(emitted.map(e => e.type), ['document.deleted','notification.created']);
    client.reconnectAttempt = 1; source.onopen(); assert.equal(recovery.length, 1); assert.equal(recovery[0].projectId, 'P1');
    client.stop();
  } finally { globalThis.EventSource = oldSource; }
});
