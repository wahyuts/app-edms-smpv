const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createLoader } = require('../helpers/approvalEmailLoader');

const sourceRoot = path.resolve(__dirname, '../../src');
const plain = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const raw = (patch = {}) => ({
  id: 'R1', project_id: 'P1', document_id: 'D1', file_id: 'F1',
  revision_label: 'AS-Built', revision_sequence: 1, is_active: 0,
  created_at: '2026-11-16 14:00:00.000', created_by_user_id: 7,
  created_by_name: 'Current Full Name', original_file_name: 'original.pdf',
  file_uploaded_at: '2026-11-16 07:00:00.000',
  revision_upload_timestamp_utc: '2026-11-16 07:00:00.000000',
  file_is_active: 0, file_size: 1024, file_extension: 'pdf', mime_type: 'application/pdf',
  upload_stage_snapshot: 'IFR-Submitted', uploaded_by_username_snapshot: 'original-user',
  uploaded_by_role_snapshot: 'Document Owner', ...patch,
});

// Real repository/mapper and service; only IO and unrelated services are replaced.
const fixture = (options = {}) => {
  const calls = [];
  const rows = options.rows ?? [raw()];
  const document = { id: 'D1', projectId: 'P1', activeRevisionId: 'R2', activeFileId: 'F2',
    status: 'Approved', lifecycle: 'Archived', ...options.document };
  const pool = { async execute(sql, args) {
    if (sql.includes('FROM document_history')) {
      calls.push({ sql, args: Array.from(args) });
      assert.deepEqual(Array.from(args), ['P1', 'D1']);
      return [options.history ?? []];
    }
    if (sql.includes('FROM workflow_comments comments')) {
      assert.match(sql, /INNER JOIN document_revisions revisions ON revisions.id = comments.revision_id/);
      assert.match(sql, /revisions.document_id = comments.document_id AND revisions.project_id = comments.project_id/);
      assert.match(sql, /comments.project_id = \? AND comments.document_id = \? AND comments.workflow_action = 'Approval A'/);
      assert.doesNotMatch(sql, /\b(?:INSERT|UPDATE|DELETE)\b/);
      calls.push({ sql, args: Array.from(args) });
      return [(options.events ?? []).filter(e => e.project_id === args[0] && e.document_id === args[1] &&
        e.workflow_action === 'Approval A' && rows.some(r => r.id === e.revision_id &&
          r.project_id === e.project_id && r.document_id === e.document_id))];
    }
    assert.match(sql, /FROM document_revisions revisions/);
    assert.match(sql, /WHERE revisions.project_id = \?\s+AND revisions.document_id = \?/);
    assert.match(sql, /DATE_FORMAT\(stored_files.uploaded_at, '%Y-%m-%d %H:%i:%s.%f'\) AS revision_upload_timestamp_utc/);
    assert.match(sql, /ORDER BY stored_files.uploaded_at DESC, revisions.revision_sequence DESC, revisions.id DESC/);
    assert.doesNotMatch(sql, /\b(?:INSERT|UPDATE|DELETE|LIMIT|OFFSET)\b/);
    calls.push({ sql, args: Array.from(args) });
    const filtered = rows.filter(r => r.project_id === args[0] && r.document_id === args[1] &&
      (args.length === 2 || r.upload_stage_snapshot === args[2]));
    return [[...filtered].sort((a, b) =>
      String(b.file_uploaded_at ?? '').localeCompare(String(a.file_uploaded_at ?? '')) ||
      b.revision_sequence - a.revision_sequence || b.id.localeCompare(a.id))];
  } };
  const mocks = new Map([
    ['config/database.js', { pool }], ['config/logger.js', { error() {} }],
    ['services/documentAdmission.service.js', {
      documentWriter: handler => handler,
      async assertReadable(args) {
        assert.deepEqual(plain(args), { projectId: document.projectId, documentId: document.id });
        if (options.blocked) throw Object.assign(new Error('Delete pending'), { statusCode: 409 });
      },
    }],
    ['repositories/projectMembership.repository.js', {
      async findActiveMembershipByProjectAndUser({ projectId, userId }) {
        if (options.denied || projectId !== 'P1' || userId !== 7) return null;
        return { officialRole: options.role ?? 'Viewer', username: 'renamed-user' };
      },
    }],
    ['repositories/project.repository.js', {}],
  ]);
  for (const name of ['storage', 'upload', 'notification', 'realtimeDocumentPublisher',
    'slaNotificationProducer', 'audit', 'revision']) mocks.set(`services/${name}.service.js`, {});
  const loader = createLoader(mocks);
  const repository = loader.load('repositories/document.repository.js');
  repository.findDocumentRegisterById = async (id) => id === document.id && !options.missing ? document : null;
  mocks.set('repositories/document.repository.js', repository);
  const module = { exports: {} };
  new vm.Script(fs.readFileSync(path.join(sourceRoot, 'services/document.service.js'), 'utf8'))
    .runInNewContext({ module, exports: module.exports, require(request) {
      assert.ok(request.startsWith('.'));
      const target = path.posix.normalize(path.posix.join('services', `${request}.js`));
      return mocks.has(target) ? mocks.get(target) : loader.load(target);
    } });
  return { service: module.exports, repository, calls, document, rows };
};

test('listing preserves existing fields and adds authoritative historical metadata', async () => {
  const f = fixture();
  const [legacyShape] = await f.repository.listDocumentRevisions({ projectId: 'P1', documentId: 'D1' });
  const [item] = await f.service.listDocumentRevisions({ documentId: 'D1', userId: 7 });
  for (const key of Object.keys(legacyShape)) assert.deepEqual(plain(item[key]), plain(legacyShape[key]));
  assert.equal(item.uploadStage, 'IFR-Submitted');
  assert.equal(item.revisionLabel, 'AS-Built');
  assert.equal(item.uploadedByUsername, 'original-user');
  assert.equal(item.uploadedByRole, 'Document Owner');
  assert.equal(item.originalFileName, 'original.pdf');
  assert.equal(item.uploadTimestamp, '2026-11-16T07:00:00.000Z');
  assert.equal(item.uploadedAt, '2026-11-16 14:00:00.000');
  assert.equal(item.uploader, 'Current Full Name');
  assert.equal(item.viewUrl, '/api/v1/documents/D1/revisions/R1/view');
  assert.equal(item.downloadUrl, '/api/v1/documents/D1/revisions/R1/download');
  assert.equal(item.isCurrentFile, false);
  const added = Object.keys(item).filter(k => !(k in legacyShape));
  assert.deepEqual(added.sort(), ['originalFileName', 'uploadStage', 'uploadedByUsername',
    'uploadedByRole', 'isCurrentFile', 'downloadUrl', 'viewUrl'].sort());
  assert.ok(added.every(k => !/storage|namespace|credential|checksum|physical|relative/i.test(k)));
});

for (const stage of ['IFR-Submitted', 'IFA-Submitted', 'As-Built']) {
  test(`stage filter ${stage} is scoped, parameterized and excludes Unknown`, async () => {
    const rows = ['IFR-Submitted', 'IFA-Submitted', 'As-Built', null].map((value, i) =>
      raw({ id: `R${i}`, upload_stage_snapshot: value }));
    rows.push(raw({ id: 'FOREIGN', project_id: 'P2', upload_stage_snapshot: stage }));
    const f = fixture({ rows });
    const items = await f.service.listDocumentRevisions({ documentId: 'D1', userId: 7, query: { stage } });
    assert.equal(items.length, 1);
    assert.equal(items[0].uploadStage, stage);
    assert.deepEqual(f.calls[0].args, ['P1', 'D1', stage]);
    assert.match(f.calls[0].sql, /AND revisions.upload_stage_snapshot = \?/);
  });
}

for (const query of [undefined, {}, { stage: 'All' }]) {
  test(`All/default includes legacy Unknown: ${JSON.stringify(query)}`, async () => {
    const f = fixture({ rows: [raw(), raw({ id: 'OLD', upload_stage_snapshot: null,
      uploaded_by_username_snapshot: null, uploaded_by_role_snapshot: null })] });
    const items = await f.service.listDocumentRevisions({ documentId: 'D1', userId: 7, query });
    assert.equal(items.length, 2);
    const legacy = items.find(r => r.id === 'OLD');
    for (const field of ['uploadStage', 'uploadedByUsername', 'uploadedByRole']) assert.equal(legacy[field], 'Unknown');
    for (const field of ['uploadStageSnapshot', 'uploadedByUsernameSnapshot', 'uploadedByRoleSnapshot']) assert.equal(legacy[field], null);
    assert.deepEqual(f.calls[0].args, ['P1', 'D1']);
  });
}

test('sorting is upload chronology first, then sequence and unique revision id', async () => {
  const f = fixture({ rows: [
    raw({ id: 'OLD', revision_sequence: 99, file_uploaded_at: '2026-01-01 00:00:00.000' }),
    raw({ id: 'R1', revision_sequence: 1 }), raw({ id: 'R2', revision_sequence: 2 }),
    raw({ id: 'R3', revision_sequence: 2 }),
    raw({ id: 'MISSING', revision_sequence: 100, file_uploaded_at: null }),
  ] });
  const items = await f.service.listDocumentRevisions({ documentId: 'D1', userId: 7 });
  assert.deepEqual(Array.from(items, r => r.id), ['R3', 'R2', 'R1', 'OLD', 'MISSING']);
});

for (const patch of [
  { id: 'R2', file_id: 'F2', is_active: 0, expected: true },
  { id: 'R2', file_id: 'OTHER', is_active: 1, expected: false },
  { id: 'OLD', file_id: 'F2', is_active: 1, expected: false },
]) test(`Current File uses both authoritative pointers: ${JSON.stringify(patch)}`, async () => {
  const f = fixture({ rows: [raw(patch)] });
  const [item] = await f.service.listDocumentRevisions({ documentId: 'D1', userId: 7 });
  assert.equal(item.isCurrentFile, patch.expected);
  assert.equal(item.isActive, Boolean(patch.is_active));
});

for (const value of [null, undefined, 'invalid']) test(`missing/invalid upload time does not fall back to revision time: ${value}`, async () => {
  const f = fixture({ rows: [raw({ revision_upload_timestamp_utc: value })] });
  const [item] = await f.service.listDocumentRevisions({ documentId: 'D1', userId: 7 });
  assert.equal(item.uploadTimestamp, null);
});

for (const role of ['Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer']) {
  test(`authorized ${role} can read archived revision history without mutation`, async () => {
    const f = fixture({ role }); const before = JSON.stringify(f.rows);
    assert.equal((await f.service.listDocumentRevisions({ documentId: 'D1', userId: 7 })).length, 1);
    assert.equal(JSON.stringify(f.rows), before);
  });
}

for (const options of [{ denied: true }, { document: { projectId: 'P2' } }]) {
  test(`membership/project isolation rejects before list query: ${JSON.stringify(options)}`, async () => {
    const f = fixture(options);
    await assert.rejects(f.service.listDocumentRevisions({ documentId: 'D1', userId: 7 }), { statusCode: 403 });
    assert.equal(f.calls.length, 0);
  });
}
for (const id of [undefined, '', 'MISSING']) test(`missing/invalid document id: ${id}`, async () => {
  const f = fixture();
  await assert.rejects(f.service.listDocumentRevisions({ documentId: id, userId: 7 }), { statusCode: 404 });
  assert.equal(f.calls.length, 0);
});
for (const stage of ['', 'Unknown', 'AS-Built', 'invalid', ['IFR-Submitted'], { value: 'IFA-Submitted' }]) {
  test(`invalid stage rejects without querying revisions: ${JSON.stringify(stage)}`, async () => {
    const f = fixture();
    await assert.rejects(f.service.listDocumentRevisions({ documentId: 'D1', userId: 7, query: { stage } }), { statusCode: 422 });
    assert.equal(f.calls.length, 0);
  });
}
test('empty history and existing delete readability guard are preserved', async () => {
  assert.equal((await fixture({ rows: [] }).service.listDocumentRevisions({ documentId: 'D1', userId: 7 })).length, 0);
  const blocked = fixture({ blocked: true });
  await assert.rejects(blocked.service.listDocumentRevisions({ documentId: 'D1', userId: 7 }), { statusCode: 409 });
  assert.equal(blocked.calls.length, 0);
});

test('controller preserves success envelope and forwards additive filter', async () => {
  const f = fixture();
  const loader = createLoader(new Map([
    ['services/document.service.js', f.service],
    ...['revision', 'approval', 'fileAccess', 'workflowAttachment'].map(name => [`services/${name}.service.js`, {}]),
  ]));
  const controller = loader.load('controllers/document.controller.js');
  let result;
  const res = { status(code) { assert.equal(code, 200); return this; }, json(body) { result = body; return this; } };
  await controller.listDocumentRevisions({ params: { documentId: 'D1' }, user: { id: 7 }, query: { stage: 'All' } }, res,
    error => { throw error; });
  assert.equal(result.success, true);
  assert.equal(result.message, 'Revision History Berhasil Dimuat');
  assert.equal(result.data.length, 1);
});

const approvalEvent = (patch = {}) => ({
  id: 'WFC1', project_id: 'P1', document_id: 'D1', revision_id: 'R1', workflow_action: 'Approval A',
  created_by_user_id: 7, created_by_username_snapshot: 'approval-user', created_by_official_role_snapshot: 'Team Process',
  approval_target_stage_snapshot: 'IFA-Submitted', event_timestamp_utc: '2026-11-17 01:00:00.123000', ...patch,
});
const eventList = (f, query = {}) => f.service.listDocumentRevisions({ documentId: 'D1', userId: 7,
  query: { historyMode: 'events', ...query } });

test('events opt-in leaves default response identical, without querying new columns', async () => {
  const f = fixture({ events: [approvalEvent()] });
  const before = plain(await f.service.listDocumentRevisions({ documentId: 'D1', userId: 7 }));
  await eventList(f);
  const after = plain(await f.service.listDocumentRevisions({ documentId: 'D1', userId: 7 }));
  assert.deepEqual(before, after);
  assert.equal(f.calls.filter(c => c.sql.includes('workflow_comments')).length, 1);
  assert.equal(before[0].entryId, undefined);
});

test('combined entries keep unique event identity separate from revision and upload metadata', async () => {
  const f = fixture({ document: { activeRevisionId: 'R1', activeFileId: 'F1' }, events: [approvalEvent(),
    approvalEvent({ id: 'WFC2', event_timestamp_utc: '2026-11-17 02:00:00.000000',
      created_by_username_snapshot: 'project-user', created_by_official_role_snapshot: 'Team Project',
      approval_target_stage_snapshot: 'AS-Built' })] });
  const items = await eventList(f);
  assert.deepEqual(Array.from(items, e => e.entryId), ['APPROVAL_A:WFC2', 'APPROVAL_A:WFC1', 'UPLOAD:R1']);
  assert.equal(new Set(items.map(e => e.entryId)).size, 3);
  assert.ok(items.every(e => e.id === 'R1' && e.revisionId === 'R1'));
  assert.deepEqual(Array.from(items, e => e.documentStage), ['As-Built', 'IFA-Submitted', 'IFR-Submitted']);
  assert.deepEqual(Array.from(items, e => e.eventType), ['APPROVAL_A', 'APPROVAL_A', 'UPLOAD']);
  assert.equal(items[0].actorUsername, 'project-user'); assert.equal(items[0].actorRole, 'Team Project');
  assert.equal(items[1].actorUsername, 'approval-user'); assert.equal(items[1].actorRole, 'Team Process');
  assert.equal(items[2].actorUsername, 'original-user');
  assert.equal(items[0].eventTimestamp, '2026-11-17T02:00:00.000Z');
  assert.equal(items[1].eventTimestamp, '2026-11-17T01:00:00.123Z');
  for (const e of items) {
    assert.equal(e.uploadStage, 'IFR-Submitted'); assert.equal(e.uploadTimestamp, '2026-11-16T07:00:00.000Z');
    assert.equal(e.uploadedByUsername, 'original-user');
    assert.equal(e.viewUrl, '/api/v1/documents/D1/revisions/R1/view');
    assert.equal(e.downloadUrl, '/api/v1/documents/D1/revisions/R1/download');
  }
  assert.deepEqual(Array.from(items, e => e.isCurrentFile), [true, false, false]);
});

for (const stage of ['All', 'IFR-Submitted', 'IFA-Submitted', 'As-Built']) test(`events filter ${stage} never promotes an older event`, async () => {
  const f = fixture({ document: { activeRevisionId: 'R1', activeFileId: 'F1' }, events: [approvalEvent()] });
  const items = await eventList(f, { stage });
  assert.ok(items.every(e => stage === 'All' || e.documentStage === stage));
  assert.equal(items.filter(e => e.isCurrentFile).length, ['All', 'IFA-Submitted'].includes(stage) ? 1 : 0);
  assert.equal(f.calls[0].args.length, 2);
  if (stage === 'As-Built') assert.equal(items.length, 0);
});

test('inactive newer events never become Current File; ties are stable with Approval A before upload', async () => {
  const f = fixture({ document: { activeRevisionId: 'R1', activeFileId: 'F1' }, rows: [raw(), raw({ id: 'R2', file_id: 'F2' })],
    events: [approvalEvent({ id: 'A', event_timestamp_utc: '2026-11-16 07:00:00.000000' }),
      approvalEvent({ id: 'Z', event_timestamp_utc: '2026-11-16 07:00:00.000000' }),
      approvalEvent({ id: 'INACTIVE', revision_id: 'R2', event_timestamp_utc: '2026-12-01 00:00:00.000000' })] });
  const items = await eventList(f);
  assert.equal(items[0].entryId, 'APPROVAL_A:INACTIVE'); assert.equal(items[0].isCurrentFile, false);
  assert.deepEqual(Array.from(items.filter(e => e.isCurrentFile), e => e.entryId), ['APPROVAL_A:Z']);
  assert.deepEqual(plain(await eventList(f)), plain(items));
});

test('missing historical approval stage fails closed without guessing from mutable label or membership', async () => {
  const f = fixture({ events: [approvalEvent({ created_by_username_snapshot: null,
    created_by_official_role_snapshot: null, approval_target_stage_snapshot: null })] });
  await assert.rejects(eventList(f), { code: 'HISTORICAL_STAGE_UNVERIFIED', statusCode: 409 });
});

test('Unknown approval actor remains unchanged when stage is verifiable', async () => {
  const f = fixture({ events: [approvalEvent({ created_by_username_snapshot: null,
    created_by_official_role_snapshot: null })] });
  const [event] = await eventList(f);
  for (const field of ['actorUsername', 'actorRole']) assert.equal(event[field], 'Unknown');
  assert.equal(event.eventTimestamp, '2026-11-17T01:00:00.123Z');
  assert.equal((await eventList(f, { stage: 'IFA-Submitted' })).length, 1);
});

test('Approval B/C, cross-project and orphan comments do not create events', async () => {
  const f = fixture({ events: [approvalEvent({ id: 'B', workflow_action: 'Approval B' }),
    approvalEvent({ id: 'C', workflow_action: 'Approval C' }), approvalEvent({ id: 'FOREIGN', project_id: 'P2' }),
    approvalEvent({ id: 'ORPHAN', revision_id: 'missing' }), approvalEvent({ id: 'NULL', revision_id: null })] });
  const items = await eventList(f);
  assert.equal(items.length, 1); assert.equal(items[0].eventType, 'UPLOAD');
});

for (const historyMode of ['', 'default', 'EVENTS', null, ['events'], { value: 'events' }]) {
  test(`invalid historyMode rejects with controlled 422: ${JSON.stringify(historyMode)}`, async () => {
    const f = fixture();
    await assert.rejects(f.service.listDocumentRevisions({ documentId: 'D1', userId: 7, query: { historyMode } }),
      error => error.statusCode === 422 && error.errors[0].field === 'historyMode');
    assert.equal(f.calls.length, 0);
  });
}
for (const role of ['Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer']) {
  test(`events preserves read-only archived access for ${role}`, async () => {
    const f = fixture({ role, events: [approvalEvent()] }); const before = JSON.stringify(f.rows);
    assert.equal((await eventList(f)).length, 2); assert.equal(JSON.stringify(f.rows), before);
  });
}
for (const options of [{ denied: true }, { blocked: true }, { document: { projectId: 'P2' } }]) {
  test(`events enforces membership and admission: ${JSON.stringify(options)}`, async () => {
    const f = fixture(options); await assert.rejects(eventList(f)); assert.equal(f.calls.length, 0);
  });
}
test('empty events, NULL time and missing active pointers are safe', async () => {
  assert.equal((await eventList(fixture({ rows: [] }))).length, 0);
  const f = fixture({ document: { activeRevisionId: null, activeFileId: null },
    events: [approvalEvent({ event_timestamp_utc: null })] });
  const items = await eventList(f); assert.equal(items[0].eventType, 'UPLOAD');
  assert.equal(items[1].eventTimestamp, null); assert.ok(items.every(e => !e.isCurrentFile));
});
test('events propagates history read errors rather than fabricating upload-only success', async () => {
  const f = fixture(); f.repository.listApprovalRevisionEvents = async () => { throw new Error('Synthetic history query failure'); };
  await assert.rejects(eventList(f), /Synthetic history query failure/);
});

test('read-time historical stages preserve default upload fields, Current File, filters and revision-based URLs', async () => {
  const f = fixture({ document: { activeRevisionId: 'R1', activeFileId: 'F1' },
    rows: [raw({ source_status: null, result_status: 'Process Review', upload_stage_snapshot: null })],
    events: [approvalEvent({ created_by_username_snapshot: null, approval_target_stage_snapshot: null })],
    history: [
      { id: 'H1', project_id: 'P1', document_id: 'D1', workflow_event: 'Upload Document', activity: 'Upload Document',
        workflow_status: 'Process Review', revision_label: 'IFR-Submitted', created_by_user_id: 7, created_at: '2026-11-16 14:00:00.001' },
      { id: 'H2', project_id: 'P1', document_id: 'D1', workflow_event: 'Approval A Completed', activity: 'Approval A',
        workflow_status: 'Project Review', revision_label: 'IFA-Submitted', created_by_user_id: 7, created_at: '2026-11-17 08:00:00.000' },
    ] });
  const before = JSON.stringify(f.rows);
  const events = await eventList(f);
  assert.deepEqual(Array.from(events, e => e.documentStage), ['IFA-Submitted', 'IFR-Submitted']);
  assert.deepEqual(Array.from(events, e => e.isCurrentFile), [true, false]);
  assert.equal(events[0].actorUsername, 'Unknown'); assert.equal(events[0].actorRole, 'Team Process');
  assert.ok(events.every(e => e.stageActorUserId === undefined && e.revisionId === 'R1' && e.uploadStage === 'Unknown'));
  assert.equal(events[0].downloadUrl, '/api/v1/documents/D1/revisions/R1/download');
  assert.equal(events[0].viewUrl, '/api/v1/documents/D1/revisions/R1/view');
  for (const stage of ['All', 'IFR-Submitted', 'IFA-Submitted', 'As-Built']) {
    assert.deepEqual(plain(await eventList(f, { stage })), plain(events.filter(e => stage === 'All' || e.documentStage === stage)));
  }
  assert.equal((await f.service.listDocumentRevisions({ documentId: 'D1', userId: 7 }))[0].uploadStage, 'Unknown');
  assert.equal(JSON.stringify(f.rows), before);
});
