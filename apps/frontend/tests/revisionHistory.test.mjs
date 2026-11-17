import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import { transformWithOxc } from 'vite';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import * as constants from '../src/features/document-register/constants/document.constants.js';
import * as uploadConstants from '../src/features/document-register/constants/upload.constants.js';
import { formatCommentDateTime } from '../src/features/document-register/utils/documentDateTime.js';

const base = new URL('../src/features/document-register/', import.meta.url);
const jsx = (type, props, key) => ({ type, props, key });
const load = async (file, imports, globals = {}) => {
  const source = await readFile(new URL(file, base), 'utf8');
  const code = file.endsWith('.jsx') ? (await transformWithOxc(source, 'fixture.jsx', { jsx: { runtime: 'automatic' } })).code : source;
  const context = (await import('node:vm')).createContext({ Blob, AbortController, Date, ...globals });
  const module = new SourceTextModule(code, { context });
  await module.link(name => {
    assert.ok(imports[name], `Unexpected import: ${name}`);
    return new SyntheticModule(Object.keys(imports[name]), function () {
      for (const [key, value] of Object.entries(imports[name])) this.setExport(key, value);
    }, { context });
  });
  await module.evaluate(); return module.namespace;
};
const nodes = node => !node ? [] : Array.isArray(node) ? node.flatMap(nodes)
  : typeof node === 'object' ? typeof node.type === 'function' ? nodes(node.type(node.props))
    : [node, ...nodes(node.props?.children)] : [];
const text = node => !node ? '' : Array.isArray(node) ? node.map(text).join(' ')
  : typeof node === 'object' ? typeof node.type === 'function' ? text(node.type(node.props)) : text(node.props?.children) : String(node);
const revision = (patch = {}) => {
  const row = { id: 'R1', documentId: 'D1', projectId: 'P1', originalFileName: 'original.pdf',
  uploadStage: 'IFR-Submitted', uploadTimestamp: '2026-11-16T07:35:00.000Z', uploadedByUsername: 'historical-user',
  uploadedByRole: 'Document Owner', isCurrentFile: false, file: { fileId: 'F1', extension: 'pdf' }, ...patch };
  return { entryId: `UPLOAD:${row.id}`, eventType: 'UPLOAD', revisionId: row.id,
    documentStage: row.uploadStage, eventTimestamp: row.uploadTimestamp,
    actorUsername: row.uploadedByUsername, actorRole: row.uploadedByRole, ...row };
};
const api = async (get, files = {}) => (await load('services/document-api.service.js', {
  '@/shared/api': { apiClient: { get } }, './file.service': { FileService: files },
})).DocumentApiService;

const approvalEvent = (patch = {}) => revision({ entryId: 'APPROVAL_A:C1', eventType: 'APPROVAL_A',
  documentStage: 'IFA-Submitted', eventTimestamp: '2026-11-17T08:00:00.000Z',
  actorUsername: 'process-reviewer', actorRole: 'Team Process', ...patch });

test('events mode is opt-in, preserves legacy upload fields and backend event order without revision deduplication', async () => {
  const rows = [approvalEvent({ entryId: 'APPROVAL_A:C2', documentStage: 'As-Built', actorRole: 'Team Project', isCurrentFile: true }), approvalEvent(), revision()];
  const calls = [];
  const service = await api(async (...args) => { calls.push(args); return { data: { data: rows } }; });
  const events = await service.getDocumentRevisions('D1', { historyMode: 'events', stage: 'All' });
  assert.deepEqual({ ...calls[0][1].params }, { historyMode: 'events', stage: 'All' });
  assert.deepEqual(Array.from(events, e => e.entryId), rows.map(e => e.entryId));
  assert.deepEqual(Array.from(events, e => e.revisionId), ['R1', 'R1', 'R1']);
  assert.equal(events.filter(e => e.isCurrentFile).length, 1);
  assert.equal(events[0].uploadStage, 'IFR-Submitted'); assert.equal(events[0].uploadTimestamp, rows[0].uploadTimestamp);
  await service.getDocumentRevisions('D1'); assert.equal(calls[1][1], undefined);
});

test('event metadata uses safe Unknown fallbacks and public As-Built without inferring upload metadata', async () => {
  const service = await api(async () => ({ data: { data: [approvalEvent({ documentStage: 'AS-Built', actorUsername: ' ', actorRole: null, eventTimestamp: null })] } }));
  const [event] = await service.getDocumentRevisions('D1', { historyMode: 'events' });
  assert.equal(event.documentStage, 'As-Built'); assert.equal(event.actorUsername, 'Unknown');
  assert.equal(event.actorRole, 'Unknown'); assert.equal(event.eventTimestamp, null);
  assert.equal(event.uploadedByUsername, 'historical-user');
});

for (const patch of [null, { eventType: 'OTHER' }, { entryId: '' }, { revisionId: null }, { documentId: 'OTHER' }, { isCurrentFile: undefined }]) {
  test(`invalid event identity fails closed: ${JSON.stringify(patch)}`, async () => {
    const service = await api(async () => ({ data: { data: [patch === null ? null : revision(patch)] } }));
    await assert.rejects(service.getDocumentRevisions('D1', { historyMode: 'events' }), /tidak valid/);
  });
}
for (const payload of [{}, [revision(), revision()]]) test(`invalid events envelope or duplicate entry IDs rejected: ${Array.isArray(payload)}`, async () => {
  const service = await api(async () => ({ data: { data: payload } }));
  await assert.rejects(service.getDocumentRevisions('D1', { historyMode: 'events' }), /tidak valid/);
});
for (const status of [401, 403, 404, 422]) test(`event list HTTP ${status} preserves error status`, async () => {
  const service = await api(async () => { throw { response: { status, data: { message: 'History unavailable' } } }; });
  await assert.rejects(service.getDocumentRevisions('D1', { historyMode: 'events' }), e => e.status === status && e.message === 'History unavailable');
});

for (const eventType of ['UPLOAD', 'APPROVAL_A']) for (const action of ['view', 'download']) {
  test(`${eventType} ${action} uses revisionId, never entryId or legacy id`, async () => {
    let url, filename;
    const service = await api(async path => { url = path; return { data: new Blob(['%PDF-1.7'], { type: 'application/pdf' }), headers: {} }; }, {
      createPreviewFromBlob: args => { filename = args.documentItem.fileMetadata.originalFileName; return {}; },
      downloadBlobResponse: args => { filename = args.documentItem.fileMetadata.originalFileName; },
    });
    await service[action === 'view' ? 'getRevisionPreview' : 'downloadRevisionFile']({ documentId: 'D1',
      revision: revision({ id: 'LEGACY-ID', revisionId: 'ACTUAL-REVISION', entryId: `${eventType}:EVENT`, eventType }) });
    assert.equal(url, `/v1/documents/D1/revisions/ACTUAL-REVISION/${action}`); assert.equal(filename, 'original.pdf');
  });
}
test('file requests reject event without revisionId and retain legacy upload-only file support', async () => {
  let calls = 0;
  const service = await api(async () => { calls++; return { data: new Blob(['pdf']), headers: {} }; }, { downloadBlobResponse() {} });
  await assert.rejects(service.downloadRevisionFile({ documentId: 'D1', revision: revision({ revisionId: undefined }) }), /Identitas/);
  assert.equal(calls, 0);
  await service.downloadRevisionFile({ documentId: 'D1', revision: { id: 'R1', documentId: 'D1', originalFileName: 'old.pdf' } });
  assert.equal(calls, 1);
});

test('revision list options are additive, legacy fields and snapshot fields survive normalization', async () => {
  const calls = [], row = revision({ uploadedAt: 'legacy-time', revisionLabel: 'AS-Built' });
  const service = await api(async (...args) => { calls.push(args); return { data: { data: [row] } }; });
  const [legacy] = await service.getDocumentRevisions('D1');
  assert.equal(calls[0][0], '/v1/documents/D1/revisions'); assert.equal(calls[0][1], undefined);
  assert.equal(legacy.uploadedAt, 'legacy-time'); assert.equal(legacy.uploadStage, 'IFR-Submitted');
  const controller = new AbortController();
  await service.getDocumentRevisions('D1', { stage: 'IFA-Submitted', signal: controller.signal });
  assert.equal(calls[1][1].params.stage, 'IFA-Submitted'); assert.equal(calls[1][1].signal, controller.signal);
});

for (const action of ['view', 'download']) test(`historical ${action} uses revision route, original filename and authenticated API client`, async () => {
  const calls = [], blobs = [];
  const service = await api(async (url, config) => {
    calls.push({ url, config }); return { data: new Blob(['%PDF-1.7'], { type: 'application/pdf' }), headers: { 'content-disposition': 'attachment; filename="original.pdf"' } };
  }, { createPreviewFromBlob: args => { blobs.push(args); return { file: args.blob }; }, downloadBlobResponse: args => blobs.push(args) });
  const args = { documentId: 'D1', revision: revision(), signal: new AbortController().signal };
  await service[action === 'view' ? 'getRevisionPreview' : 'downloadRevisionFile'](args);
  assert.equal(calls[0].url, `/v1/documents/D1/revisions/R1/${action}`);
  assert.equal(calls[0].config.responseType, 'blob'); assert.equal(calls[0].config.signal, args.signal);
  assert.equal(blobs[0].documentItem.fileMetadata.originalFileName, 'original.pdf');
  assert.ok(!('activeFileId' in blobs[0].documentItem));
});

test('revision identity mismatch cannot issue a file request', async () => {
  const service = await api(() => { throw new Error('Must not request'); });
  await assert.rejects(service.getRevisionPreview({ documentId: 'OTHER', revision: revision() }));
});
for (const blob of [new Blob([]), new Blob(['{}'], { type: 'application/json' }), new Blob(['invalid'], { type: 'application/pdf' })]) {
  test(`empty/non-file/corrupt PDF preview rejected: ${blob.type || 'empty'}`, async () => {
    const service = await api(async () => ({ data: blob, headers: {} }), { createPreviewFromBlob() { throw new Error('Invalid preview accepted'); } });
    await assert.rejects(service.getRevisionPreview({ documentId: 'D1', revision: revision() }), /kosong|tidak valid/);
  });
}
for (const status of [401, 403, 404, 500]) test(`blob HTTP ${status} preserves status and safe API error mapping`, async () => {
  const service = await api(async () => { throw { response: { status, data: new Blob([JSON.stringify({ message: 'File unavailable' })]) } }; });
  await assert.rejects(service.getRevisionPreview({ documentId: 'D1', revision: revision() }), e => e.status === status && e.message === 'File unavailable');
});
test('aborted download never hands a blob to the download helper', async () => {
  const c = new AbortController(); let downloads = 0;
  const service = await api(async () => { c.abort(); return { data: new Blob(['%PDF-1.7']), headers: {} }; }, { downloadBlobResponse() { downloads++; } });
  await service.downloadRevisionFile({ documentId: 'D1', revision: revision(), signal: c.signal });
  assert.equal(downloads, 0);
});

const hookConfig = async (props, result = {}, service = {}) => {
  let config;
  const hook = (await load('hooks/useDocumentRevisionHistory.js', {
    '@tanstack/react-query': { useQuery(value) { config = value; return result; } },
    '../services/document-api.service': { DocumentApiService: service },
  })).useDocumentRevisionHistory;
  return { value: hook(props), get config() { return config; } };
};
const context = { open: true, canView: true, userId: 7, projectId: 'P1', documentId: 'D1', stage: 'All' };
test('history hook makes one events request per query with backend stage filter and cancellation signal', async () => {
  for (const stage of ['All', 'IFR-Submitted', 'IFA-Submitted', 'As-Built']) {
    const calls = [], signal = new AbortController().signal;
    const h = await hookConfig({ ...context, stage }, {}, { getDocumentRevisions(...args) { calls.push(args); return []; } });
    await h.config.queryFn({ signal });
    assert.equal(calls.length, 1); assert.equal(calls[0][0], 'D1');
    assert.deepEqual({ ...calls[0][1] }, { historyMode: 'events', stage, signal });
  }
});
test('query isolates all identity dimensions, refreshes on reopen and has no polling/placeholder', async () => {
  const h = await hookConfig(context, { data: [revision()] });
  assert.deepEqual(Array.from(h.config.queryKey), ['documents', 'revision-history', 7, 'P1', 'D1', 'events', 'All']);
  assert.equal(h.config.staleTime, 0); assert.equal(h.config.refetchOnMount, 'always');
  assert.equal(h.config.placeholderData, undefined); assert.equal(h.config.refetchInterval, undefined);
  for (const patch of [{ userId: 8 }, { projectId: 'P2' }, { documentId: 'D2' }, { stage: 'IFA-Submitted' }]) {
    assert.notDeepEqual(Array.from((await hookConfig({ ...context, ...patch })).config.queryKey), Array.from(h.config.queryKey));
  }
});
for (const patch of [{ open: false }, { canView: false }, { userId: null }, { projectId: null }, { documentId: null }]) {
  test(`query is disabled and cached data hidden for ${JSON.stringify(patch)}`, async () => {
    const h = await hookConfig({ ...context, ...patch }, { data: [revision()] });
    assert.equal(h.config.enabled, false); assert.equal(h.value.revisions.length, 0);
  });
}
test('query hides stale cached data on access failure', async () => {
  const h = await hookConfig(context, { data: [revision()], isError: true });
  assert.equal(h.value.revisions.length, 0);
});
test('actual TanStack observer aborts consumed signal on modal unmount', async () => {
  let signal;
  const h = await hookConfig(context, {}, { getDocumentRevisions(id, options) {
    signal = options.signal; return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('Aborted'))));
  } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const observer = new QueryObserver(client, h.config);
  const unsubscribe = observer.subscribe(() => {});
  assert.equal(signal.aborted, false); unsubscribe(); assert.equal(signal.aborted, true); client.clear();
});

const modalHarness = async (queryPatch = {}, apiPatch = {}, propPatch = {}) => {
  let slots = [], cursor = 0, pending = [];
  const changed = (a, b) => !a || a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));
  const h = { closed: 0, returnedFocus: 0, revoked: [], timers: [], events: new Map(), queryCalls: [],
    query: { revisions: [revision()], isPending: false, isFetching: false, isError: false, refetch() { h.retries++; }, ...queryPatch }, retries: 0 };
  const hooks = {
    useState(value) { const i = cursor++; slots[i] ??= { value }; return [slots[i].value, next => { slots[i].value = typeof next === 'function' ? next(slots[i].value) : next; }]; },
    useRef(value) { const i = cursor++; slots[i] ??= { current: value }; return slots[i]; },
    useId() { const i = cursor++; slots[i] ??= 'revision-title'; return slots[i]; },
    useCallback(callback, deps) { const i = cursor++; if (!slots[i] || changed(slots[i].deps, deps)) slots[i] = { deps, value: callback }; return slots[i].value; },
    useEffect(callback, deps) { const i = cursor++; if (!slots[i] || changed(slots[i].deps, deps)) pending.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: callback() }; }); },
  };
  const control = () => ({ disabled: false, focus() { h.doc.activeElement = this; }, getClientRects() { return [1]; } });
  h.first = control(); h.last = control();
  h.dialog = { setAttribute() {}, querySelector(selector) { return selector === 'h2' ? {} : h.last; },
    querySelectorAll() { return [h.first, h.last]; }, focus() { h.doc.activeElement = this; },
    addEventListener(name, fn) { h.events.set(name, fn); }, removeEventListener(name) { h.events.delete(name); } };
  h.doc = { activeElement: null };
  h.window = { setTimeout(fn) { h.timers.push(fn); return h.timers.length; }, URL: { createObjectURL() { return 'blob:child'; }, revokeObjectURL(url) { h.revoked.push(url); } } };
  h.body = { closest() { return h.dialog; }, parentElement: { scrollTop: 12 } };
  const component = (await load('components/DocumentRevisionHistoryModal.jsx', {
    react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
    'lucide-react': Object.fromEntries(['ArrowLeft', 'CalendarClock', 'CircleHelp', 'Download', 'Eye', 'FileCheck', 'FileText', 'GitBranch', 'Loader2', 'RefreshCw', 'UserRound'].map(n => [n, n])),
    '@/shared/components/form/SelectDropdown': { default: 'SelectDropdown' },
    '../hooks/useDocumentRevisionHistory': { useDocumentRevisionHistory(args) { h.queryCalls.push(args); return h.query; } },
    '../services/document-api.service': { DocumentApiService: apiPatch },
    './DocumentActionModal': { default: 'Modal' }, '../utils/documentDateTime': { formatCommentDateTime },
    './PreviewCanvas': { default: 'PreviewCanvas' }, './SpreadsheetPreview': { default: 'SpreadsheetPreview' },
  }, { window: h.window, document: h.doc })).DocumentRevisionHistoryModal;
  h.props = { ...context, canDownload: true, onClose() { h.closed++; }, onReturnFocus() { h.returnedFocus++; }, ...propPatch };
  h.render = () => { cursor = 0; const tree = component(h.props); nodes(tree).find(n => n.props?.ref)?.props.ref &&
    (nodes(tree).find(n => n.props?.ref).props.ref.current = h.body); const effects = pending; pending = []; effects.forEach(fn => fn()); return tree; };
  h.dispose = () => { slots.forEach(slot => slot?.cleanup?.()); h.timers.forEach(fn => fn()); };
  return h;
};

test('list shows document number once above the stage filter, outside revision cards', async () => {
  const documentItem = { id: 'D1', projectId: 'P1', documentNumber: 'PID-CONTEXT-01', description: 'Current document description' };
  const h = await modalHarness({ revisions: [revision(), approvalEvent()] }, {}, { documentItem });
  const tree = h.render(), content = text(tree);
  assert.equal(content.split(documentItem.documentNumber).length - 1, 1);
  assert.ok(content.indexOf('PID-CONTEXT-01') < content.indexOf('Stage at Upload'));
  const cards = nodes(tree).filter(n => n.type === 'article');
  assert.equal(cards.length, 2);
  assert.ok(cards.every(card => !text(card).includes(documentItem.documentNumber)));
  assert.equal(h.queryCalls.length, 1);
  h.dispose();
});

test('preview stacks current document identity before revision metadata and retains PDF and controls', async () => {
  const description = 'Long description with complete metadata. '.repeat(30);
  const h = await modalHarness({}, {
    getRevisionPreview: async () => ({ file: new Blob(['pdf']), viewerType: 'pdf', metadata: {} }),
  }, { documentItem: { id: 'D1', projectId: 'P1', documentNumber: 'PID-CONTEXT-02', description } });
  nodes(h.render()).find(n => n.props?.title === 'View').props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  const tree = h.render(), aside = nodes(tree).find(n => n.type === 'aside');
  assert.deepEqual(nodes(aside).filter(n => n.type === 'dt').map(n => text(n).trim()), [
    'Document Number', 'Description', 'Original File Name', 'Stage at Upload', 'Upload Date & Time', 'Uploaded By', 'File Indicator',
  ]);
  assert.match(text(aside), /PID-CONTEXT-02/);
  const summary = nodes(aside).find(n => n.type === 'summary');
  assert.equal(summary.props.title, description);
  assert.equal(text(summary), description);
  assert.ok(nodes(summary).some(n => n.props?.className?.includes('group-open:line-clamp-none')));
  assert.ok(nodes(aside).some(n => n.type === 'details'));
  assert.equal(nodes(aside).find(n => n.type === 'dl').props.className.includes('sm:grid-cols-3'), false);
  assert.ok(nodes(aside).some(n => n.type === 'button' && /Download/.test(text(n))));
  assert.equal(nodes(tree).find(n => n.type === 'iframe').props.src, 'blob:child');
  nodes(tree.props.footer).find(n => n.type === 'button' && text(n).includes('Back')).props.onClick();
  assert.equal(nodes(h.render()).some(n => n.type === 'aside'), false);
  assert.match(text(h.render()), /PID-CONTEXT-02/);
  nodes(h.render().props.footer).find(n => n.props?.['data-revision-close']).props.onClick();
  assert.equal(h.closed, 1);
  h.dispose();
});

test('document metadata changes with context and mismatched identity is never displayed', async () => {
  const h = await modalHarness({}, {}, { documentItem: { id: 'D1', projectId: 'P1', documentNumber: 'FIRST-DOCUMENT', description: 'First description' } });
  assert.match(text(h.render()), /FIRST-DOCUMENT/);
  h.props.documentId = 'D2';
  assert.doesNotMatch(text(h.render()), /FIRST-DOCUMENT/);
  h.props.documentItem = { id: 'D2', projectId: 'P1', documentNumber: 'SECOND-DOCUMENT', description: 'Second description' };
  assert.match(text(h.render()), /SECOND-DOCUMENT/);
  h.props.projectId = 'P2';
  assert.doesNotMatch(text(h.render()), /FIRST-DOCUMENT|SECOND-DOCUMENT/);
  h.dispose();
});

test('preview missing description uses display-only hyphen without inferring metadata from filename', async () => {
  const documentItem = { id: 'D1', projectId: 'P1', documentNumber: 'PID-CONTEXT-03', description: '   ' };
  const h = await modalHarness({}, { getRevisionPreview: async () => ({ file: new Blob(['pdf']), viewerType: 'pdf', metadata: {} }) }, { documentItem });
  nodes(h.render()).find(n => n.props?.title === 'View').props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  const aside = nodes(h.render()).find(n => n.type === 'aside');
  const fields = nodes(aside).filter(n => n.type === 'dd');
  assert.equal(text(fields[0]), 'PID-CONTEXT-03');
  assert.equal(text(fields[1]), '-');
  assert.equal(documentItem.description, '   ');
  h.dispose();
});

for (const count of [0, 1, 2]) test(`upload with ${count} Approval A events retains distinct keys and backend Current File`, async () => {
  const events = [revision(), ...Array.from({ length: count }, (_, i) => approvalEvent({ entryId: `APPROVAL_A:C${i}`, isCurrentFile: i === count - 1 }))];
  const h = await modalHarness({ revisions: events });
  const tree = h.render(), articles = nodes(tree).filter(n => n.type === 'article');
  assert.equal(articles.length, count + 1);
  assert.deepEqual(articles.map(n => n.key), events.map(e => e.entryId));
  assert.equal(new Set(articles.map(n => n.key)).size, count + 1);
  assert.equal(articles.filter(n => /Current File/.test(text(n))).length, count ? 1 : 0);
  h.dispose();
});

test('mixed revisions display event actor, stage and timestamp rather than mutable legacy fields', async () => {
  const rows = [approvalEvent({ id: 'R2', revisionId: 'R2', entryId: 'APPROVAL_A:C2', actorRole: 'Team Project', documentStage: 'As-Built' }), revision(), approvalEvent()];
  const h = await modalHarness({ revisions: rows });
  const articles = nodes(h.render()).filter(n => n.type === 'article');
  assert.deepEqual(articles.map(n => n.key), rows.map(e => e.entryId));
  assert.match(text(articles[0]), /Approval A\s+process-reviewer\s+\(\s*Team Project\s*\)/);
  assert.match(text(articles[0]), /As-Built/); assert.match(text(articles[0]), /17 Nov 2026, 15:00/);
  assert.doesNotMatch(text(articles[0]), /IFR-Submitted|historical-user|16 Nov/);
  assert.match(text(articles[1]), /historical-user\s+\(\s*Document Owner\s*\)/);
  assert.doesNotMatch(text(articles[1]), /Approval A/); h.dispose();
});

test('missing historical event metadata shows Unknown and invalid timestamp shows hyphen', async () => {
  const service = await api(async () => ({ data: { data: [approvalEvent({ documentStage: null, actorUsername: null, actorRole: null, eventTimestamp: 'invalid' })] } }));
  const h = await modalHarness({ revisions: await service.getDocumentRevisions('D1', { historyMode: 'events' }) });
  const tree = h.render(); assert.match(text(tree), /Unknown/);
  assert.ok(nodes(tree).some(n => n.props?.title === 'Historical upload stage could not be verified.'));
  assert.ok(nodes(tree).some(n => n.type === 'dd' && text(n) === '-'));
  assert.doesNotMatch(text(tree), /Invalid Date|historical-user|Document Owner/); h.dispose();
});

test('selected approval event survives query refresh without switching to shared-revision upload', async () => {
  const h = await modalHarness({ revisions: [revision(), approvalEvent()] }, {
    getRevisionPreview: async () => ({ file: new Blob(['pdf']), viewerType: 'pdf', metadata: {} }),
  });
  nodes(h.render()).filter(n => n.props?.title === 'View')[1].props.onClick(); await new Promise(r => setImmediate(r));
  h.query.revisions = [revision({ isCurrentFile: true }), approvalEvent({ actorUsername: 'snapshot-actor', isCurrentFile: false })];
  const tree = h.render(); assert.match(text(tree), /Approval A\s+snapshot-actor/);
  assert.match(text(tree), /Previous File/); assert.doesNotMatch(text(tree), /Current File|historical-user/); h.dispose();
});

test('download spinner belongs only to selected entryId even when events share revisionId', async () => {
  let finish;
  const h = await modalHarness({ revisions: [revision(), approvalEvent()] }, {
    downloadRevisionFile: () => new Promise(resolve => { finish = resolve; }),
  });
  const pending = nodes(h.render()).filter(n => n.props?.title === 'Download')[1].props.onClick();
  const buttons = nodes(h.render()).filter(n => n.props?.title === 'Download');
  assert.equal(nodes(buttons[0]).some(n => n.type === 'Loader2'), false);
  assert.equal(nodes(buttons[1]).some(n => n.type === 'Loader2'), true);
  assert.ok(buttons.every(n => n.props.disabled)); finish(); await pending;
  assert.ok(nodes(h.render()).filter(n => n.props?.title === 'Download').every(n => !n.props.disabled)); h.dispose();
});

test('project switch aborts event preview and download without reusing old context', async () => {
  let previewSignal, downloadSignal, finish;
  const h = await modalHarness({}, {
    getRevisionPreview: args => { previewSignal = args.signal; return new Promise(() => {}); },
    downloadRevisionFile: args => { downloadSignal = args.signal; return new Promise(resolve => { finish = resolve; }); },
  });
  const tree = h.render();
  nodes(tree).find(n => n.props?.title === 'Download').props.onClick();
  nodes(tree).find(n => n.props?.title === 'View').props.onClick();
  h.props.projectId = 'P2'; h.render();
  assert.equal(previewSignal.aborted, true); assert.equal(downloadSignal.aborted, true);
  assert.equal(h.queryCalls.at(-1).projectId, 'P2'); finish(); h.dispose();
});

test('modal renders only snapshot metadata, neutral Unknown tooltip and backend order', async () => {
  const h = await modalHarness({ revisions: [revision({ id: 'SECOND', uploadStage: 'Unknown', uploadedByUsername: 'Unknown', uploadedByRole: 'Admin' }), revision({ id: 'FIRST', isCurrentFile: true })] });
  const tree = h.render(), content = text(tree);
  assert.match(content, /Unknown/); assert.doesNotMatch(content, /Unknown\s+\(\s*Admin\s*\)/); assert.match(content, /16 Nov 2026, 14:35/);
  assert.match(content, /Current File/); assert.match(content, /Previous File/); assert.doesNotMatch(content, /REV\./);
  assert.ok(nodes(tree).some(n => n.props?.title === 'Historical upload stage could not be verified.'));
  assert.deepEqual(nodes(tree).filter(n => n.type === 'article').map(n => n.props.children[0].props.revision.id), ['SECOND', 'FIRST']);
  assert.equal(tree.props.title, 'Document Revision History'); assert.equal(tree.props.manageBodyScroll, false); assert.equal(tree.props.layer, 9100);
  const select = nodes(tree).find(n => n.type === 'SelectDropdown');
  assert.deepEqual(nodes(select).filter(n => n.type === 'option').map(n => n.props.value), ['All', 'IFR-Submitted', 'IFA-Submitted', 'As-Built']);
  select.props.onChange({ target: { value: 'IFA-Submitted' } }); h.render(); assert.equal(h.queryCalls.at(-1).stage, 'IFA-Submitted'); h.dispose();
});
const uploaderField = tree => nodes(tree).find(n => n.type === 'div' &&
  n.props.children?.[0]?.type === 'dt' && text(n.props.children[0]).trim() === 'Uploaded By').props.children[1];
const normalizedText = node => text(node).replace(/\s+/g, ' ').trim().replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
const uploaderTooltip = 'Informasi Pengunggah\n\nIdentitas pengguna tidak dapat diverifikasi dari data historis yang tersedia.';
const unknownUploadTooltip = 'Informasi Pengunggah\n\nIdentitas pengguna yang mengunggah file ini tidak dapat diverifikasi dari riwayat yang tersedia. Admin dan Document Owner merupakan role yang memiliki izin untuk mengunggah dokumen. Label ini bukan identitas atau role aktual pengunggah yang telah terverifikasi.';

for (const { name, row, expected, tooltip = false } of [
  { name: 'unknown upload does not require historical cutoff evidence', row: revision({ actorUsername: 'Unknown', actorRole: 'Unknown' }), expected: 'Admin / Document Owner', tooltip: true },
  { name: 'old timestamp and NULL snapshots are not proof of pre-feature origin', row: revision({ actorUsername: 'Unknown', actorRole: 'Unknown',
    eventTimestamp: '2020-01-01T00:00:00.000Z', uploadedByUsernameSnapshot: null, uploadedByRoleSnapshot: null }), expected: 'Admin / Document Owner', tooltip: true },
  { name: 'unknown Team Process approver', row: approvalEvent({ actorUsername: 'Unknown' }), expected: 'Approval A (Team Process)' },
  { name: 'unknown Team Project approver', row: approvalEvent({ actorUsername: 'Unknown', actorRole: 'Team Project' }), expected: 'Approval A (Team Project)' },
  { name: 'verified approver', row: approvalEvent({ actorUsername: 'Herlina' }), expected: 'Approval A Herlina (Team Process)' },
  { name: 'verified uploader', row: revision({ actorUsername: 'deny', actorRole: 'Admin' }), expected: 'deny (Admin)' },
  { name: 'unknown upload actor with known role does not claim an actual identity', row: revision({ actorUsername: 'Unknown', actorRole: 'Admin' }), expected: 'Admin / Document Owner', tooltip: true },
  { name: 'other unknown approval pattern', row: approvalEvent({ actorUsername: 'Unknown', actorRole: 'Unknown' }), expected: 'Unknown', tooltip: true },
  { name: 'non-upload unknown actor with other role stays neutral', row: approvalEvent({ actorUsername: 'Unknown', actorRole: 'Admin' }), expected: 'Unknown', tooltip: true },
  { name: 'Unknown substring is a valid username', row: approvalEvent({ actorUsername: 'Unknown-reviewer' }), expected: 'Approval A Unknown-reviewer (Team Process)' },
  { name: 'valid actor is not erased because role is Unknown', row: revision({ actorUsername: 'real-user', actorRole: 'Unknown' }), expected: 'real-user (Unknown)' },
  { name: 'missing upload actor metadata is equivalent to Unknown', row: revision({ actorUsername: null, actorRole: null }), expected: 'Admin / Document Owner', tooltip: true },
  { name: 'blank upload actor metadata is equivalent to Unknown', row: revision({ actorUsername: '   ', actorRole: null }), expected: 'Admin / Document Owner', tooltip: true },
  { name: 'undefined upload actor metadata is equivalent to Unknown', row: revision({ actorUsername: undefined, actorRole: undefined }), expected: 'Admin / Document Owner', tooltip: true },
  { name: 'valid upload actor containing Unknown is preserved', row: revision({ actorUsername: 'Unknown-uploader', actorRole: 'Document Owner' }), expected: 'Unknown-uploader (Document Owner)' },
  { name: 'missing event type never activates Rule A', row: revision({ eventType: undefined, actorUsername: 'Unknown', actorRole: 'Unknown' }), expected: 'Unknown', tooltip: true },
]) {
  test(`Uploaded By presentation: ${name}`, async () => {
    const before = JSON.stringify(row);
    const h = await modalHarness({ revisions: [Object.freeze(row)] });
    const tree = h.render(), field = uploaderField(tree);
    assert.equal(normalizedText(field), expected);
    const expectedTooltip = expected === 'Admin / Document Owner' ? unknownUploadTooltip : uploaderTooltip;
    const help = nodes(field).find(n => n.props?.title === expectedTooltip);
    assert.equal(Boolean(help), tooltip);
    if (tooltip) {
      assert.equal(help.props.tabIndex, 0); assert.equal(help.props['aria-label'], expectedTooltip);
      assert.ok(nodes(help).some(n => n.type === 'CircleHelp' && n.props['aria-hidden'] === 'true'));
      assert.ok(nodes(field).some(n => /text-\[#FDE68A\]/.test(n.props?.className || '')));
      assert.doesNotMatch(help.props.title, /sebelum fitur|sudah ada sebelum/);
    }
    if (expected !== 'Admin / Document Owner') assert.doesNotMatch(text(field), /Admin \/ Document Owner/);
    assert.equal(field.props.className, 'mt-1 break-words text-sm font-semibold text-[#F8FAFC] [overflow-wrap:anywhere]');
    assert.equal(JSON.stringify(row), before); h.dispose();
  });
}

for (const row of [approvalEvent({ actorUsername: 'Unknown', isCurrentFile: true, documentStage: 'IFA-Submitted' }),
  revision({ actorUsername: 'Unknown', actorRole: 'Unknown', isCurrentFile: true })]) {
test(`Uploaded By ${row.eventType} uses the same presentation in list and preview without changing event/file metadata`, async () => {
  const expected = row.eventType === 'UPLOAD' ? 'Admin / Document Owner' : 'Approval A (Team Process)';
  const before = JSON.stringify(row);
  const h = await modalHarness({ revisions: [row] }, {
    getRevisionPreview: async ({ revision: selected }) => {
      assert.equal(selected, row);
      return { file: new Blob(['pdf']), viewerType: 'pdf', metadata: {} };
    },
  });
  let tree = h.render(); assert.equal(normalizedText(uploaderField(tree)), expected);
  nodes(tree).find(n => n.props?.title === 'View').props.onClick(); await new Promise(r => setImmediate(r));
  tree = h.render(); assert.equal(normalizedText(uploaderField(tree)), expected);
  assert.ok(text(tree).includes(row.documentStage)); assert.match(text(tree), /Current File/);
  assert.equal(JSON.stringify(row), before); h.dispose();
});
}

const totalFileCount = tree => {
  const counter = nodes(tree.props.footer).find(n => n.type === 'span' && text(n).includes('Total File:'));
  assert.ok(counter); assert.equal(counter.props.className, 'mr-auto self-center text-sm text-[#94A3B8]');
  assert.equal(counter.props.children[0], 'Total File: ');
  assert.equal(typeof counter.props.children[1], 'number');
  return counter.props.children[1];
};
const countedEvents = [
  ...Array.from({ length: 5 }, (_, i) => revision({ entryId: `UPLOAD:I${i}` })),
  ...Array.from({ length: 4 }, (_, i) => approvalEvent({ entryId: `APPROVAL_A:F${i}` })),
  ...Array.from({ length: 3 }, (_, i) => approvalEvent({ entryId: `APPROVAL_A:B${i}`, documentStage: 'As-Built', actorRole: 'Team Project' })),
];
for (const [stage, count] of [['All', 12], ['IFR-Submitted', 5], ['IFA-Submitted', 4], ['As-Built', 3]]) {
  test(`Total File matches backend-filtered cards for ${stage}`, async () => {
    const h = await modalHarness({ revisions: countedEvents });
    let tree = h.render(); assert.equal(totalFileCount(tree), 12);
    nodes(tree).find(n => n.type === 'SelectDropdown').props.onChange({ target: { value: stage } });
    h.query.isFetching = true; tree = h.render();
    assert.equal(totalFileCount(tree), 0); assert.equal(nodes(tree).filter(n => n.type === 'article').length, 0);
    h.query.revisions = countedEvents.filter(e => stage === 'All' || e.documentStage === stage);
    h.query.isFetching = false; tree = h.render();
    assert.equal(h.queryCalls.at(-1).stage, stage); assert.equal(totalFileCount(tree), count);
    assert.equal(totalFileCount(tree), nodes(tree).filter(n => n.type === 'article').length); h.dispose();
  });
}
for (const state of [{ revisions: [] }, { isPending: true }, { isFetching: true }, { isError: true }]) {
  test(`Total File is zero when cards are hidden or empty: ${JSON.stringify(state)}`, async () => {
    const h = await modalHarness(state); const tree = h.render();
    assert.equal(totalFileCount(tree), 0); assert.equal(nodes(tree).filter(n => n.type === 'article').length, 0); h.dispose();
  });
}
test('Total File counts upload and Approval A sharing one revision separately and preserves the Close control', async () => {
  const h = await modalHarness({ revisions: [revision(), approvalEvent()] }); const tree = h.render();
  assert.equal(totalFileCount(tree), 2); assert.equal(nodes(tree).filter(n => n.type === 'article').length, 2);
  const footerNodes = nodes(tree.props.footer), counter = footerNodes.find(n => n.type === 'span' && text(n).includes('Total File:'));
  const close = footerNodes.find(n => n.type === 'button' && text(n) === 'Close');
  assert.ok(footerNodes.indexOf(counter) < footerNodes.indexOf(close));
  assert.equal(close.props.className, 'inline-flex h-9 items-center justify-center rounded-md bg-[#0F7BFF] px-4 text-sm font-semibold text-white hover:bg-[#0B63CC]');
  assert.equal(close.props.type, 'button'); close.props.onClick(); assert.equal(h.closed, 1); h.dispose();
});
test('Total File remains derived from filtered history when entering preview and returning to the list', async () => {
  const h = await modalHarness({ revisions: [revision(), approvalEvent()] }, {
    getRevisionPreview: async () => ({ file: new Blob(['pdf']), viewerType: 'pdf', metadata: {} }),
  });
  nodes(h.render()).find(n => n.props?.title === 'View').props.onClick(); await new Promise(r => setImmediate(r));
  let tree = h.render(); assert.equal(totalFileCount(tree), 2);
  nodes(tree.props.footer).find(n => n.type === 'button' && text(n).includes('Back')).props.onClick();
  tree = h.render(); assert.equal(totalFileCount(tree), nodes(tree).filter(n => n.type === 'article').length); h.dispose();
});

test('child Escape/Tab/focus return and listener cleanup stay local', async () => {
  const h = await modalHarness(); h.render(); const keyboard = h.events.get('keydown');
  let prevented = 0, stopped = 0;
  keyboard({ key: 'Escape', preventDefault() { prevented++; }, stopPropagation() { stopped++; } });
  assert.equal(h.closed, 1); assert.equal(stopped, 1);
  h.doc.activeElement = h.last; keyboard({ key: 'Tab', preventDefault() { prevented++; } }); assert.equal(h.doc.activeElement, h.first);
  h.doc.activeElement = h.first; keyboard({ key: 'Tab', shiftKey: true, preventDefault() {} }); assert.equal(h.doc.activeElement, h.last);
  h.dispose(); assert.equal(h.events.size, 0); assert.equal(h.returnedFocus, 1); assert.ok(prevented > 0);
});
for (const query of [{ isPending: true }, { isFetching: true }, { isError: true, error: { status: 403 } }, { revisions: [] }]) {
  test(`list state: ${JSON.stringify(query)}`, async () => {
    const h = await modalHarness(query); const tree = h.render();
    assert.equal(nodes(tree).filter(n => n.type === 'article').length, 0);
    if (query.isError) { nodes(tree).find(n => n.type === 'button' && text(n).includes('Retry')).props.onClick(); assert.equal(h.retries, 1); }
    h.dispose();
  });
}
for (const role of ['Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer']) {
  test(`read permissions expose the same read-only history controls for ${role}`, async () => {
    const h = await modalHarness(); const tree = h.render();
    assert.ok(nodes(tree).some(n => n.props?.title === 'View')); assert.ok(nodes(tree).some(n => n.props?.title === 'Download'));
    assert.doesNotMatch(text(tree), /Approve|Reject|Upload Revision/); h.dispose();
  });
}
test('missing permissions do not expose file actions', async () => {
  const h = await modalHarness({}, {}, { canView: false, canDownload: false }); const tree = h.render();
  assert.equal(nodes(tree).filter(n => ['View', 'Download'].includes(n.props?.title)).length, 0); h.dispose();
});
test('child preview does not revoke parent resources and Back/unmount release its own URL', async () => {
  const h = await modalHarness({}, { getRevisionPreview: async () => ({ file: new Blob(['%PDF-1.7']), viewerType: 'pdf', metadata: { fileExtension: 'pdf' } }) });
  nodes(h.render()).find(n => n.props?.title === 'View').props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  const preview = h.render(); assert.equal(nodes(preview).find(n => n.type === 'iframe').props.src, 'blob:child');
  assert.equal(h.revoked.length, 0);
  nodes(preview.props.footer).find(n => text(n).includes('Back') && n.type === 'button').props.onClick();
  h.render(); assert.deepEqual(h.revoked, ['blob:child']); h.dispose(); assert.ok(!h.revoked.includes('blob:parent'));
});
test('late preview after unmount is aborted and cannot create an object URL', async () => {
  let resolve, signal;
  const h = await modalHarness({}, { getRevisionPreview: args => { signal = args.signal; return new Promise(r => { resolve = r; }); } });
  nodes(h.render()).find(n => n.props?.title === 'View').props.onClick(); h.dispose(); assert.equal(signal.aborted, true);
  resolve({ file: new Blob(['pdf']), viewerType: 'pdf' }); await new Promise(r => setImmediate(r));
  assert.equal(h.revoked.length, 0);
});
test('preview failure presents retry without changing parent state', async () => {
  const h = await modalHarness({}, { getRevisionPreview: async () => { throw { status: 404 }; } });
  nodes(h.render()).find(n => n.props?.title === 'View').props.onClick(); await new Promise(r => setImmediate(r));
  const tree = h.render(); assert.match(text(tree), /tidak ditemukan/); assert.ok(nodes(tree).some(n => n.type === 'button' && text(n).includes('Retry'))); h.dispose();
});
test('existing register actions and workflow timeline mapping are unchanged', async () => {
  const source = await readFile(new URL('components/DocumentActionGroup.jsx', base), 'utf8');
  const old = execFileSync('git', ['show', 'HEAD:apps/frontend/src/features/document-register/components/DocumentActionGroup.jsx'], { encoding: 'utf8' });
  const history = s => {
    const start = s.indexOf('      const revisionTimeline =');
    return s.slice(start, s.indexOf('\n      }));', start) + 11).replaceAll('\r\n', '\n');
  };
  assert.equal(history(source), history(old));
  assert.match(source, /DocumentApiService\.getDocumentRevisions\(historyContext\.documentId\)/);
  const table = await readFile(new URL('components/DocumentRegisterTable.jsx', base), 'utf8');
  assert.equal(table.replaceAll('\r\n', '\n'), execFileSync('git', ['show', 'HEAD:apps/frontend/src/features/document-register/components/DocumentRegisterTable.jsx'], { encoding: 'utf8' }).replaceAll('\r\n', '\n'));
  assert.match(source, /revisionHistoryContext\.projectId === activeProjectId/);
  assert.match(source, /hasProjectPermission\(DOCUMENT_REGISTER_PERMISSION\.VIEW\)/);
});

const parentHarness = async () => {
  const effects = [], document = { body: { style: { overflow: 'auto' } } };
  const module = await load('components/DocumentActionModal.jsx', {
    react: { useEffect(fn) { effects.push(fn); }, useState: value => [value, () => {}] },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
    'react-dom': { createPortal: children => ({ type: 'Portal', props: { children } }) },
    'lucide-react': Object.fromEntries(['Download', 'Eye', 'FileText', 'FileUp', 'History', 'Loader2', 'Paperclip', 'Trash2', 'X'].map(n => [n, n])),
    '../constants/document.constants': constants, '../constants/upload.constants': uploadConstants,
    '../services/file.service': { FileService: {}, FILE_VALIDATION_CONFIG: {} },
    '../services/workflow-attachment.service': { WorkflowAttachmentService: {}, WORKFLOW_ATTACHMENT_VALIDATION_CONFIG: {} },
    '../utils/documentDateTime': { formatCommentDateTime },
    './PreviewCanvas': { default: 'PreviewCanvas' }, './SpreadsheetPreview': { default: 'SpreadsheetPreview' },
  }, { document });
  return { module, effects, document };
};
test('View Document optional trigger, existing content, preview and buttons stay intact', async () => {
  const h = await parentHarness();
  const props = { documentItem: { id: 'D1', documentNumber: 'Test', fileMetadata: { originalFileName: 'active.pdf', fileExtension: 'pdf' } },
    documentFile: { objectUrl: 'blob:parent' }, onClose() {}, onDownload() {} };
  const old = h.module.ViewDocumentModal(props), added = h.module.ViewDocumentModal({ ...props, onRevisionHistory() {}, isRevisionHistoryOpen: true });
  assert.equal(JSON.stringify(old.props.children), JSON.stringify(added.props.children));
  assert.equal(nodes(old.props.footer).filter(n => n.props?.title === 'Document Revision History').length, 0);
  assert.equal(nodes(added.props.footer).filter(n => n.props?.title === 'Document Revision History').length, 1);
  assert.equal(added.props.isInert, true); assert.equal(old.props.isInert, false);
  assert.equal(nodes(added).find(n => n.type === 'iframe').props.src, 'blob:parent');
  assert.equal(nodes(added.props.footer).filter(n => n.type === 'button').at(-1).props.children, 'Close');
  const history = h.module.HistoryModal({ documentItem: props.documentItem, onClose() {}, timeline: [] });
  assert.equal(history.props.title, 'Revision History'); assert.equal(history.props.onRevisionHistory, undefined);
});

test('Revision History navigation button matches existing View trigger and sits immediately before unchanged Close', async () => {
  const h = await parentHarness(); let opened = 0, closed = 0;
  const props = { documentItem: { id: 'D1', documentNumber: 'Doc 1' }, timeline: [], onClose() { closed++; } };
  const original = h.module.HistoryModal(props);
  const added = h.module.HistoryModal({ ...props, onRevisionHistory() { opened++; } });
  assert.equal(JSON.stringify(original.props.children), JSON.stringify(added.props.children));
  assert.equal(added.props.title, original.props.title);
  assert.equal(added.props.size, original.props.size);
  const buttons = nodes(added.props.footer).filter(n => n.type === 'button');
  assert.equal(buttons.length, 2); assert.equal(buttons[0].props.title, 'Document Revision History');
  assert.equal(text(buttons[1]), 'Close');
  const view = h.module.ViewDocumentModal({ documentItem: {}, documentFile: {}, onRevisionHistory() {} });
  const reference = nodes(view.props.footer).find(n => n.props?.title === 'Document Revision History');
  assert.equal(buttons[0].props.className, reference.props.className);
  assert.equal(JSON.stringify(buttons[0].props.children), JSON.stringify(reference.props.children));
  assert.equal(buttons[1].props.className, nodes(original.props.footer).find(n => n.type === 'button').props.className);
  buttons[0].props.onClick(); buttons[1].props.onClick(); assert.equal(opened, 1); assert.equal(closed, 1);
});

const navigationHarness = async () => {
  let slots = [], cursor = 0, pending = [], timerId = 0;
  const h = { userId: 7, canView: true, context: { activeProject: { id: 'P1' }, activeMembership: { officialRole: 'Admin' } },
    apiCalls: [], toasts: [], timers: new Map(), historyResponse: [{ id: 'H1', activity: 'Approval A' }] };
  const changed = (a, b) => !a || a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));
  const hooks = {
    useState(value) { const i = cursor++; if (!slots[i]) slots[i] = { value }; return [slots[i].value, next => { slots[i].value = typeof next === 'function' ? next(slots[i].value) : next; }]; },
    useRef(value) { const i = cursor++; if (!slots[i]) slots[i] = { current: value }; return slots[i]; },
    useCallback(value, deps) { const i = cursor++; if (!slots[i] || changed(slots[i].deps, deps)) slots[i] = { deps, value }; return slots[i].value; },
    useEffect(value, deps) { const i = cursor++; if (!slots[i] || changed(slots[i].deps, deps)) pending.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: value() }; }); },
  };
  const store = selector => selector(h.context); store.getState = () => h.context;
  const modals = Object.fromEntries(['ApprovalCommentModal', 'ApprovalConfirmationModal', 'ArchiveConfirmationModal',
    'CommentViewerModal', 'EditDocumentModal', 'HistoryModal', 'ViewDocumentModal', 'WorkflowAttachmentViewerModal'].map(n => [n, n]));
  const module = await load('components/DocumentActionGroup.jsx', {
    react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
    'lucide-react': Object.fromEntries(['Clock3', 'Download', 'Eye', 'Loader2', 'Pencil', 'MessageSquare', 'Archive', 'RotateCcw'].map(n => [n, n])),
    '@/features/auth/services/auth.service': { AuthService: { getCurrentUser: () => ({ id: h.userId }) } },
    '@/shared/components/toast': { useToast: () => ({ showToast: toast => h.toasts.push(toast) }) },
    '@/shared/api/query-client': { queryClient: { invalidateQueries: async () => {} } },
    '@/shared/hooks/usePermission': { usePermission: () => ({ hasProjectPermission: code => code !== constants.DOCUMENT_REGISTER_PERMISSION.VIEW || h.canView }) },
    '@/shared/realtime': { useRealtimeEvent() {}, useRealtimeRecovery() {} },
    '@/shared/stores/project-context.store': { useProjectContextStore: store },
    '../constants/document.constants': constants,
    '../services/document-api.service': { DocumentApiService: {
      async getDocumentHistory(id) { h.apiCalls.push({ action: 'history', id }); return h.historyResponse; },
      async getDocumentRevisions(id, options) { h.apiCalls.push({ action: 'revisions', id, options }); return []; },
      async getDocumentById(id) { h.apiCalls.push({ action: 'detail', id }); return { ...h.props.documentItem }; },
      async getDocumentPreview() { return { file: new Blob(['pdf']), viewerType: 'pdf' }; },
    } },
    '../utils/commentRealtimeSync': { COMMENT_VIEWER_UPDATED_NOTICE: '', isCommentActorSelfEvent: () => false, isCommentViewerRealtimeEvent: () => false },
    '../utils/documentActionVisibility': { getDocumentActionVisibility: () => ({ topActions: [constants.ACTION_CODE.VIEW], workflowActions: [], showHistory: true }) },
    '../utils/documentRuntimeQuerySync': { synchronizeDocumentRuntimeQueries: async () => {} },
    '../utils/realtimeRefetchCoalescer': { createRealtimeRefetchCoalescer: () => ({ cancel() {}, schedule() {} }) },
    './PermanentDeleteAction': { PermanentDeleteAction: 'PermanentDeleteAction' },
    './DocumentRevisionHistoryModal': { DocumentRevisionHistoryModal: 'DocumentRevisionHistoryModal' },
    '../utils/workflowRealtimeSync': { isActorSelfEvent: () => false, isRelevantWorkflowDetailEvent: () => false,
      shouldCloseWorkflowActionModal: () => false, shouldRefreshWorkflowDocumentViewer: () => false, WORKFLOW_DETAIL_STALE_NOTICE: '' },
    './DocumentActionModal': modals,
  }, { window: { setTimeout(fn) { h.timers.set(++timerId, fn); return timerId; }, clearTimeout(id) { h.timers.delete(id); },
    URL: { createObjectURL: () => 'blob:view', revokeObjectURL() {} } } });
  h.props = { documentItem: { id: 'D1', projectId: 'P1', documentNumber: 'Doc 1', status: 'Process Review' }, onWorkflowComplete() {} };
  h.render = () => { cursor = 0; h.tree = module.DocumentActionGroup(h.props); const effects = pending; pending = []; effects.forEach(fn => fn()); return h.tree; };
  h.find = name => nodes(h.tree).find(n => n.type === name);
  h.open = async () => { await nodes(h.tree).find(n => n.props?.title === 'View History').props.onClick(); h.render(); };
  h.dispose = () => slots.forEach(slot => slot?.cleanup?.());
  h.render(); for (const fn of h.timers.values()) fn(); h.timers.clear(); h.render();
  return h;
};

test('Revision History swaps atomically to standalone Document Revision History for the captured document/project', async () => {
  const h = await navigationHarness(); await h.open();
  const history = h.find('HistoryModal'); assert.equal(history.props.documentItem.id, 'D1');
  assert.equal(history.props.timeline.length, 1);
  history.props.onRevisionHistory(); h.render();
  assert.equal(h.find('HistoryModal'), undefined); assert.equal(h.find('ViewDocumentModal'), undefined);
  const destination = h.find('DocumentRevisionHistoryModal'); assert.ok(destination);
  assert.equal(destination.props.documentItem, history.props.documentItem);
  assert.equal(destination.props.documentId, 'D1'); assert.equal(destination.props.projectId, 'P1');
  assert.equal(destination.props.userId, 7); assert.equal(destination.props.manageBodyScroll, true);
  assert.equal(destination.props.onReturnFocus, undefined);
  assert.equal(h.apiCalls.length, 2); assert.ok(h.apiCalls.every(c => c.id === 'D1' && c.options === undefined));
  destination.props.onClose(); h.render(); assert.equal(h.find('DocumentRevisionHistoryModal'), undefined);
  await h.open(); assert.ok(h.find('HistoryModal')); h.find('HistoryModal').props.onClose(); h.render();
  assert.equal(h.find('HistoryModal'), undefined); h.dispose();
});

for (const change of ['document', 'project', 'user', 'permission']) {
  test(`Revision History rejects stale navigation after ${change} changes`, async () => {
    const h = await navigationHarness(); await h.open(); const oldHistory = h.find('HistoryModal');
    if (change === 'document') h.props.documentItem = { ...h.props.documentItem, id: 'D2', documentNumber: 'Doc 2' };
    if (change === 'project') h.context.activeProject = { id: 'P2' };
    if (change === 'user') h.userId = 8;
    if (change === 'permission') h.canView = false;
    h.render(); assert.equal(h.find('HistoryModal').props.documentItem.id, 'D1');
    oldHistory.props.onRevisionHistory(); h.render();
    assert.equal(h.find('DocumentRevisionHistoryModal'), undefined); assert.equal(h.toasts.at(-1).variant, 'error');
    assert.equal(h.apiCalls.length, 2); h.dispose();
  });
}

test('Revision History does not open a late history response for a different row', async () => {
  const h = await navigationHarness(); let finish;
  h.historyResponse = new Promise(resolve => { finish = resolve; });
  const opening = nodes(h.tree).find(n => n.props?.title === 'View History').props.onClick();
  h.props.documentItem = { ...h.props.documentItem, id: 'D2' }; h.render();
  finish([]); await opening; h.render();
  assert.equal(h.find('HistoryModal'), undefined); assert.equal(h.find('DocumentRevisionHistoryModal'), undefined);
  assert.equal(h.toasts.at(-1).variant, 'error'); h.dispose();
});

test('existing View Document entry remains nested and does not take over parent scroll ownership', async () => {
  const h = await navigationHarness();
  await nodes(h.tree).find(n => n.type === 'button' && n.props?.title === 'View Document').props.onClick(); h.render();
  h.find('ViewDocumentModal').props.onRevisionHistory(); h.render();
  assert.ok(h.find('ViewDocumentModal')); assert.equal(h.find('ViewDocumentModal').props.isRevisionHistoryOpen, true);
  const child = h.find('DocumentRevisionHistoryModal'); assert.equal(child.props.manageBodyScroll, false);
  child.props.onClose(); h.render(); assert.ok(h.find('ViewDocumentModal'));
  assert.equal(h.find('DocumentRevisionHistoryModal'), undefined); h.dispose();
});

test('standalone history closes its visible context when Active Project changes', async () => {
  const h = await navigationHarness(); await h.open(); h.find('HistoryModal').props.onRevisionHistory(); h.render();
  assert.ok(h.find('DocumentRevisionHistoryModal'));
  h.context.activeProject = { id: 'P2' }; h.render();
  assert.equal(h.find('DocumentRevisionHistoryModal'), undefined); assert.equal(h.find('HistoryModal'), undefined); h.dispose();
});

test('standalone history starts at All on each mount and owns exactly one body scroll lock', async () => {
  const h = await modalHarness({}, {}, { manageBodyScroll: true });
  let tree = h.render(); assert.equal(tree.props.manageBodyScroll, true);
  assert.equal(nodes(tree).find(n => n.type === 'SelectDropdown').props.value, 'All');
  nodes(tree).find(n => n.type === 'SelectDropdown').props.onChange({ target: { value: 'IFA-Submitted' } });
  h.render(); h.dispose();
  const reopened = await modalHarness({}, {}, { manageBodyScroll: true }); tree = reopened.render();
  assert.equal(nodes(tree).find(n => n.type === 'SelectDropdown').props.value, 'All'); reopened.dispose();
  const shell = await parentHarness(); shell.module.HistoryModal({ documentItem: {}, onClose() {} });
  shell.module.default({ title: 'Revision History' }); const releaseSource = shell.effects.pop()();
  assert.equal(shell.document.body.style.overflow, 'hidden'); releaseSource();
  shell.module.default({ title: 'Document Revision History', manageBodyScroll: true });
  const releaseDestination = shell.effects.pop()(); assert.equal(shell.document.body.style.overflow, 'hidden');
  releaseDestination(); assert.equal(shell.document.body.style.overflow, 'auto');
});
test('parent alone owns scroll lock; child layer/inert do not change existing shell dimensions', async () => {
  const h = await parentHarness(); const parent = h.module.default({ title: 'View', children: 'Parent' });
  const releaseParent = h.effects.shift()(); assert.equal(h.document.body.style.overflow, 'hidden');
  const child = h.module.default({ title: 'Child', children: 'Child', manageBodyScroll: false, layer: 9100 });
  assert.equal(h.effects.shift()(), undefined); assert.equal(h.document.body.style.overflow, 'hidden');
  const parentRoot = parent.props.children, childRoot = child.props.children;
  assert.equal(parentRoot.props.style, undefined); assert.equal(childRoot.props.style.zIndex, 9100);
  assert.equal(parentRoot.props.className, childRoot.props.className);
  assert.equal(nodes(parent).find(n => n.type === 'section').props.className, nodes(child).find(n => n.type === 'section').props.className);
  releaseParent(); assert.equal(h.document.body.style.overflow, 'auto');
});
test('query refresh updates selected current-file indicator without reopening a preview', async () => {
  const h = await modalHarness({}, { getRevisionPreview: async () => ({ file: new Blob(['pdf']), viewerType: 'pdf', metadata: {} }) });
  nodes(h.render()).find(n => n.props?.title === 'View').props.onClick(); await new Promise(r => setImmediate(r));
  h.query.revisions = [revision({ isCurrentFile: true })]; assert.match(text(h.render()), /Current File/); h.dispose();
});
test('access failure while preview is open hides stale metadata and revokes its URL', async () => {
  const h = await modalHarness({}, { getRevisionPreview: async () => ({ file: new Blob(['pdf']), viewerType: 'pdf', metadata: {} }) });
  nodes(h.render()).find(n => n.props?.title === 'View').props.onClick(); await new Promise(r => setImmediate(r)); h.render();
  h.query.isError = true; h.query.error = { status: 403 }; h.query.revisions = [];
  const tree = h.render(); assert.match(text(tree), /Akses revisi ditolak/); assert.equal(nodes(tree).filter(n => n.type === 'iframe').length, 0);
  assert.deepEqual(h.revoked, ['blob:child']); h.dispose();
});
test('closing during download aborts it; duplicate clicks do not start another download', async () => {
  let calls = 0, signal, finish;
  const h = await modalHarness({}, { downloadRevisionFile(args) { calls++; signal = args.signal; return new Promise(r => { finish = r; }); } });
  const button = nodes(h.render()).find(n => n.props?.title === 'Download'); button.props.onClick(); button.props.onClick();
  assert.equal(calls, 1); h.dispose(); assert.equal(signal.aborted, true); finish(); await new Promise(r => setImmediate(r));
});

test('refined trigger keeps its icon and responsive behavior; amber titles are scoped to the requested heading', async () => {
  const h = await parentHarness();
  const view = h.module.ViewDocumentModal({ documentItem: {}, documentFile: {}, onRevisionHistory() {} });
  const trigger = nodes(view.props.footer).find(n => n.props?.title === 'Document Revision History');
  assert.equal(trigger.props['aria-label'], 'Document Revision History');
  const icon = nodes(trigger).find(n => n.type === 'History');
  assert.equal(icon.props.className, 'h-4 w-4 shrink-0');
  const label = nodes(trigger).find(n => n.type === 'span');
  assert.equal(text(label), 'Document Revision History');
  assert.equal(label.props.className, 'hidden text-[#FDE68A] sm:inline');
  const ordinary = h.module.default({ title: 'View Document' });
  const refined = h.module.default({ title: 'Document Revision History', titleClassName: 'text-[#FDE68A]' });
  assert.equal(nodes(ordinary).find(n => n.type === 'h2').props.className, 'text-lg font-bold');
  assert.equal(nodes(refined).find(n => n.type === 'h2').props.className, 'text-lg font-bold text-[#FDE68A]');
  assert.equal(nodes(ordinary).find(n => n.type === 'header').props.className, nodes(refined).find(n => n.type === 'header').props.className);
});

for (const previewMode of [false, true]) test(`shared metadata icons/colors in ${previewMode ? 'preview' : 'list'} preserve Previous File`, async () => {
  const mapping = { 'Original File Name': 'FileText', 'Stage at Upload': 'GitBranch',
    'Upload Date & Time': 'CalendarClock', 'Uploaded By': 'UserRound', 'File Indicator': 'FileCheck' };
  const h = await modalHarness({ revisions: [revision({ isCurrentFile: true })] }, {
    getRevisionPreview: async () => ({ file: new Blob(['pdf']), viewerType: 'pdf', metadata: {} }),
  });
  let tree = h.render();
  if (previewMode) {
    nodes(tree).find(n => n.props?.title === 'View').props.onClick();
    await new Promise(r => setImmediate(r)); tree = h.render();
  }
  assert.equal(tree.props.titleClassName, 'text-[#FDE68A]');
  const revisionLabels = nodes(tree).filter(n => n.type === 'dt' && Object.hasOwn(mapping, text(n).trim()));
  for (const label of revisionLabels) {
    const name = text(label).trim(), icon = nodes(label).find(n => n.type === mapping[name]);
    assert.ok(icon, `Missing icon for ${name}`); assert.equal(String(icon.props['aria-hidden']), 'true');
    assert.equal(icon.props.className, 'h-3 w-3 shrink-0');
  }
  assert.equal(revisionLabels.length, 5);
  const current = nodes(tree).find(n => n.type === 'span' && text(n) === 'Current File Active');
  const register = await readFile(new URL('components/DocumentRegisterTable.jsx', base), 'utf8');
  const approvedColors = register.match(/\[DOCUMENT_STATUS.APPROVED\]:\s*"([^"]+)"/)[1];
  const badgeBase = register.match(/const StatusBadge[\s\S]*?"(inline-flex[^"]+)"/)[1];
  assert.equal(current.props.className, `${badgeBase} ${approvedColors}`);
  h.query.revisions = [revision({ isCurrentFile: false })]; tree = h.render();
  const previous = nodes(tree).find(n => n.type === 'dd' && text(n) === 'Previous File');
  assert.match(previous.props.className, /text-\[#F8FAFC\]/); assert.doesNotMatch(previous.props.className, /86EFAC/);
  h.dispose();
});

test('Current File Active badge follows only backend current flag, not event position or shared revision identity', async () => {
  const h = await modalHarness({ revisions: [revision(), approvalEvent({ isCurrentFile: true })] });
  let articles = nodes(h.render()).filter(n => n.type === 'article');
  assert.equal(nodes(articles[0]).filter(n => n.type === 'span' && text(n) === 'Current File Active').length, 0);
  assert.match(text(articles[0]), /Previous File/);
  assert.equal(nodes(articles[1]).filter(n => n.type === 'span' && text(n) === 'Current File Active').length, 1);
  h.query.revisions = [revision(), approvalEvent()];
  articles = nodes(h.render()).filter(n => n.type === 'article');
  assert.ok(articles.every(n => text(n).includes('Previous File') && !text(n).includes('Current File Active')));
  h.dispose();
});
