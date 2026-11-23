const assert = require('node:assert/strict');
const test = require('node:test');
const { createLoader } = require('../helpers/approvalEmailLoader');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('Actual backend flag configuration defaults OFF and resolves both flags independently', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../../src/config/env.js'), 'utf8');
  const parser = source.match(/const getBooleanEnv = [\s\S]*?\n};/)[0];
  const block = source.match(/  emergencyUpload: \{([\s\S]*?)\n  },/)[1];
  assert.match(block, /getBooleanEnv\('EMERGENCY_UPLOAD_TEAM_PROCESS_ENABLED', false\)/);
  assert.match(block, /getBooleanEnv\('EMERGENCY_UPLOAD_TEAM_PROJECT_ENABLED', false\)/);
  for (const processFlag of [undefined, 'false', 'true']) for (const projectFlag of [undefined, 'false', 'true']) {
    const flags = vm.runInNewContext(`${parser}\n({${block}})`, { process: { env: {
      EMERGENCY_UPLOAD_TEAM_PROCESS_ENABLED: processFlag, EMERGENCY_UPLOAD_TEAM_PROJECT_ENABLED: projectFlag,
    } } });
    assert.equal(flags.teamProcess, processFlag === 'true');
    assert.equal(flags.teamProject, projectFlag === 'true');
  }
});

const fixture = (options = {}) => {
  const role = options.role || 'Team Process';
  const doc = { id: 'D1', project_id: 'P1', document_number: 'SYNTHETIC-1', lifecycle_status: 'Active',
    revision_label: role === 'Team Project' ? 'AS-Built' : 'IFA-Submitted', workflow_status: role === 'Team Project' ? 'Approved' : 'Project Review',
    active_revision_id: 'R1', active_file_id: 'F1', sla_started_at: 'unchanged', ...options.document };
  const context = { id: 'WRITER-1', dbOutcome: 'NOT_STARTED' };
  const state = { comments: [], attachments: [], files: [], audits: [], events: [] };
  const trace = [];
  const admitted = [];
  const objects = new Set();
  let queue = Promise.resolve();
  let commitUnknown = options.commitUnknown;
  const mocks = new Map([
    ['config/env.js', { emergencyUpload: options.flags || { teamProcess: options.flag !== false, teamProject: options.flag !== false } }],
    ['config/logger.js', { error() {} }],
    ['services/documentAdmission.service.js', { documentWriter: fn => args => { admitted.push(args); return fn(args); }, current: () => context }],
    ['repositories/emergencyAttachment.repository.js', {
      findCommittedRequest: async id => state.comments.find(row => row.id === id) || null,
      lockContext: async () => ({ document: doc, project: { status: options.projectStatus || 'Active' },
        member: { official_role: role, full_name: options.noName ? '' : 'Authenticated Full Name', membership_status: options.membershipStatus || 'Active', user_status: 'Active' } }),
      findRequest: async (connection, id) => {
        const row = state.comments.find(r => r.id === id);
        if (!row) return null;
        const file = state.attachments.find(a => a.commentId === id);
        return { request_fingerprint: row.requestFingerprint, workflow_action: row.workflowAction, project_id: row.projectId,
          document_id: row.documentId, created_by_user_id: row.createdByUserId, attachment_id: file?.attachmentId, file_id: file?.fileId, verified_file_id: file?.fileId };
      },
      hasUnresolvedStorage: async () => options.unresolved === true,
    }],
    ['repositories/document.repository.js', {
      runInTransaction: callback => {
        const task = queue.then(async () => {
          const old = structuredClone(state);
          context.dbOutcome = 'IN_PROGRESS';
          try {
            const result = await callback({ transaction: true });
            if (commitUnknown) { commitUnknown = false; context.dbOutcome = 'UNKNOWN'; throw new Error('Commit acknowledgement lost'); }
            context.dbOutcome = 'COMMITTED'; trace.push('COMMIT'); return result;
          } catch (error) {
            if (context.dbOutcome !== 'UNKNOWN') { Object.assign(state, old); context.dbOutcome = 'ROLLED_BACK'; }
            throw error;
          }
        });
        queue = task.catch(() => {}); return task;
      },
      findDocumentRegisterById: async () => ({ id: 'D1', projectId: 'P1', projectCode: 'SYNTHETIC', documentNumber: 'SYNTHETIC-1' }),
      insertWorkflowComment: async (c, row) => { assert.equal(c.transaction, true); state.comments.push(row); trace.push('COMMENT'); },
      insertStoredFile: async (c, row) => state.files.push(row),
      completeStoredFileProvenance: async () => { trace.push('PROVENANCE'); if (options.failure === 'provenance') throw new Error('Provenance failed'); },
    }],
    ['repositories/fileAccess.repository.js', { insertWorkflowAttachment: async (c, row) => state.attachments.push(row) }],
    ['services/upload.service.js', {
      assertTemporaryUploadConsumable: async () => { trace.push('TEMP'); return { originalFileName: 'synthetic.pdf', extension: 'pdf', fileSize: 100,
        checksum: 'a'.repeat(64), mimeType: 'application/pdf', storageKey: 'temporary/synthetic', ...options.file }; },
      consumeTemporaryUploadMetadata: async () => options.consumed === false ? 0 : 1,
    }],
    ['services/storage.service.js', {
      finalize: async (from, to) => { trace.push('FINALIZE'); if (options.failure === 'finalize') throw new Error('Finalize failed'); objects.add(to); },
      delete: async key => { trace.push('COMPENSATE'); objects.delete(key); },
    }],
    ['services/audit.service.js', { recordActivity: async (row, { connection }) => { assert.equal(connection.transaction, true);
      if (options.failure === 'audit') throw new Error('Audit failed'); state.audits.push(row); } }],
    ['services/realtimeDocumentPublisher.service.js', { publishCommentCreated: row => { assert.ok(trace.includes('COMMIT')); state.events.push(row); } }],
  ]);
  const service = createLoader(mocks).load('services/emergencyAttachment.service.js');
  const args = { actorUserId: 7, documentId: 'D1', activeProject: { id: 'P1' }, payload: {
    projectId: 'P1', requestId: '12345678-1234-4234-8234-123456789abc', temporaryFileId: 'TMP-1', comment: options.comment || '',
    expectedActiveRevisionId: 'R1', expectedWorkflowStatus: doc.workflow_status, expectedSubmissionStage: doc.revision_label } };
  return { service, args, state, doc, trace, objects, admitted };
};

for (const role of ['Team Process', 'Team Project']) for (const comment of ['', 'Custom emergency message']) {
  test(`${role} emergency ${comment ? 'custom' : 'default'} is append-only with correct path and immutable document`, async () => {
    const f = fixture({ role, comment }), original = structuredClone(f.doc);
    await f.service.submit(f.args);
    assert.deepEqual(f.doc, original);
    assert.equal(f.state.comments.length, 1); assert.equal(f.state.attachments.length, 1); assert.equal(f.state.files.length, 1);
    const row = f.state.comments[0];
    assert.equal(row.revisionId, null); assert.equal(row.workflowAction, 'Emergency Workflow Attachment');
    assert.match(row.requestFingerprint, /^[0-9a-f]{64}$/);
    assert.equal(row.approvalTargetStageSnapshot, undefined); assert.equal(row.createdByNameSnapshot, 'Authenticated Full Name');
    assert.equal(row.createdByOfficialRoleSnapshot, role);
    assert.equal(row.workflowComment, comment || `This approved document just has a new attachment added by the ${role === 'Team Process' ? 'process' : 'project'} team.`);
    assert.match(f.state.files[0].storageKey, role === 'Team Process' ? /process-comments/ : /project-comments/);
    assert.ok(f.trace.indexOf('PROVENANCE') < f.trace.indexOf('COMMIT'));
    assert.equal(f.state.audits.length, 1); assert.equal(f.state.events.length, 1);
  });
}
for (const options of [{ flag: false }, { role: 'Admin' }, { role: 'Document Owner' }, { role: 'Viewer' },
  { document: { lifecycle_status: 'Archived' } }, { projectStatus: 'Closed' }, { projectStatus: 'Inactive' },
  { membershipStatus: 'Inactive' }, { document: { revision_label: 'IFR-Submitted' } },
  { role: 'Team Project', document: { workflow_status: 'Project Review' } }, { unresolved: true }, { noName: true },
  { flags: { teamProcess: false, teamProject: true } }, { role: 'Team Project', flags: { teamProcess: true, teamProject: false } }]) {
  test(`Emergency rejects eligibility/uncertain writer ${JSON.stringify(options)}`, async () => {
    const f = fixture(options); await assert.rejects(f.service.submit(f.args));
    assert.equal(f.state.comments.length, 0); assert.equal(f.objects.size, 0);
  });
}
for (const patch of [{ temporaryFileId: null }, { temporaryFileId: '' }, { requestId: 'invalid' }, { projectId: 'P2' },
  { expectedActiveRevisionId: 'changed' }, { expectedWorkflowStatus: 'changed' }, { expectedSubmissionStage: 'AS-Built' }]) {
  test(`Emergency direct request rejects ${JSON.stringify(patch)}`, async () => {
    const f = fixture(); await assert.rejects(f.service.submit({ ...f.args, payload: { ...f.args.payload, ...patch } }));
    assert.equal(f.state.comments.length, 0);
  });
}
for (const file of [{ extension: 'docx' }, { mimeType: 'text/plain' }, { fileSize: 0 }, { fileSize: 100 * 1024 * 1024 + 1 }]) {
  test(`Emergency independently rejects invalid attachment ${JSON.stringify(file)}`, async () => {
    const f = fixture({ file }); await assert.rejects(f.service.submit(f.args), { statusCode: 422 }); assert.equal(f.state.comments.length, 0);
  });
}
for (const failure of ['provenance', 'finalize', 'audit']) test(`Emergency ${failure} failure is not success`, async () => {
  const f = fixture({ failure }); await assert.rejects(f.service.submit(f.args));
  assert.equal(f.state.comments.length, 0); assert.equal(f.state.events.length, 0);
  if (failure !== 'finalize') assert.equal(f.objects.size, 0);
});
test('Concurrent/repeated request creates exactly one comment and rejects changed payload', async () => {
  const f = fixture(); const results = await Promise.all([f.service.submit(f.args), f.service.submit(f.args)]);
  assert.equal(results.filter(r => r.replayed).length, 1); assert.equal(f.state.comments.length, 1); assert.equal(f.state.events.length, 1);
  assert.equal((await f.service.submit(f.args)).replayed, true);
  await assert.rejects(f.service.submit({ ...f.args, payload: { ...f.args.payload, comment: 'different' } }), { statusCode: 409 });
  assert.equal(f.state.comments.length, 1); assert.equal(f.trace.filter(t => t === 'TEMP').length, 1);
});
test('Lost commit acknowledgement preserves file; same durable request safely replays without duplicate', async () => {
  const f = fixture({ commitUnknown: true }); await assert.rejects(f.service.submit(f.args), /acknowledgement/);
  assert.equal(f.objects.size, 1); assert.equal(f.trace.includes('COMPENSATE'), false);
  assert.equal((await f.service.submit(f.args)).replayed, true); assert.equal(f.state.comments.length, 1);
  assert.equal(f.admitted.at(-1).payload.temporaryFileId, undefined);
  assert.equal(f.admitted.at(-1).replayOnly, true);
});

for (const action of ['Approval A', 'Emergency Workflow Attachment']) test(`Generic endpoint cannot append attachment to ${action}`, async () => {
  const loader = createLoader(new Map([
    ['config/logger.js', { error() {} }],
    ['services/fileAccess.service.js', { assertProjectAccess: async () => {} }],
    ['repositories/fileAccess.repository.js', { findActiveDocumentFile: async () => ({ document: { projectId: 'P1' } }),
      findWorkflowCommentById: async () => ({ projectId: 'P1', workflowAction: action }) }],
    ['repositories/document.repository.js', { runInTransaction: () => assert.fail('No generic attachment write allowed') }],
    ['services/upload.service.js', { assertTemporaryUploadConsumable: async () => ({}) }],
    ['services/storage.service.js', {}], ['services/audit.service.js', {}],
  ]));
  await assert.rejects(loader.load('services/workflowAttachment.service.js').uploadWorkflowAttachment({
    actorUserId: 7, documentId: 'D1', payload: { commentId: 'C1', temporaryFileId: 'T1' } }), { statusCode: 403 });
});

for (const role of ['Team Process', 'Team Project']) {
  for (const options of [{ flag: false }, { projectStatus: 'Closed' }, { document: { lifecycle_status: 'Archived' } }]) {
    test(`Emergency role matrix ${role} rejects ${JSON.stringify(options)}`, async () => {
      const f = fixture({ role, ...options }); await assert.rejects(f.service.submit(f.args)); assert.equal(f.state.comments.length, 0);
    });
  }
  for (const patch of [{ temporaryFileId: null, comment: 'Comment only' }, { temporaryFileId: null, comment: '' },
    { projectId: 'OTHER' }, { expectedWorkflowStatus: 'Changed concurrently' }]) {
    test(`Emergency role matrix ${role} rejects request ${JSON.stringify(patch)}`, async () => {
      const f = fixture({ role }); await assert.rejects(f.service.submit({ ...f.args, payload: { ...f.args.payload, ...patch } }));
      assert.equal(f.state.comments.length, 0);
    });
  }
  test(`Emergency role matrix ${role} deduplicates concurrent and repeated submit`, async () => {
    const f = fixture({ role });
    const values = await Promise.all([f.service.submit(f.args), f.service.submit(f.args)]);
    assert.equal(values.filter(value => value.replayed).length, 1); assert.equal(f.state.comments.length, 1);
    assert.equal((await f.service.submit(f.args)).replayed, true);
  });
}

for (const role of ['Team Process', 'Team Project']) test(`Emergency uses existing per-user unread SQL and receipt persistence: ${role}`, async () => {
  const f = fixture({ role }); await f.service.submit(f.args);
  assert.equal(f.state.events[0].actorUserId, 7);
  assert.equal(f.state.events[0].document.projectId, 'P1');
  assert.equal(f.state.events[0].commentId, f.state.comments[0].id);
  const receipts = new Set();
  const scoped = () => f.state.comments.filter(c => c.projectId === 'P1' && c.documentId === 'D1');
  const connection = { execute: async (sql, values) => {
    assert.doesNotMatch(sql, /workflow_action\s*(?:=|IN)/i, 'Unread/read SQL must not filter out Emergency actions');
    if (sql.includes('INSERT IGNORE INTO comment_read_receipts')) {
      assert.equal(values[2], 'P1'); assert.equal(values[3], 'D1'); assert.equal(values[0], values[1]); assert.equal(values[0], values[4]);
      assert.match(sql, /workflow_comments.created_by_user_id <> \?/);
      let affectedRows = 0;
      for (const c of scoped().filter(c => c.createdByUserId !== values[0])) {
        const key = `${values[0]}:${c.id}`; if (!receipts.has(key)) { receipts.add(key); affectedRows++; }
      }
      return [{ affectedRows }];
    }
    if (sql.includes('AS unread_comment_count')) {
      assert.match(sql, /read_receipts.user_id = \?/);
      assert.match(sql, /unread_comments.created_by_user_id <> \?/);
      assert.match(sql, /read_receipts.id IS NULL/);
      assert.match(sql, /unread_comments.project_id = documents.project_id/);
      assert.equal(values[0], values[1]);
      const unread = scoped().filter(c => c.createdByUserId !== values[0] && !receipts.has(`${values[0]}:${c.id}`)).length;
      return [[{ id: 'D1', project_id: 'P1', document_number: 'SYNTHETIC-1', workflow_status: 'Approved',
        lifecycle_status: 'Active', revision_label: 'AS-Built', unread_comment_count: unread }]];
    }
    if (sql.includes('FROM workflow_comments')) {
      assert.deepEqual(Array.from(values), ['P1', 'D1']);
      return [scoped().map(c => {
        const a = f.state.attachments.find(a => a.commentId === c.id);
        return { id: c.id, project_id: c.projectId, document_id: c.documentId, workflow_action: c.workflowAction,
          workflow_comment: c.workflowComment, created_by_user_id: c.createdByUserId, created_by_name_snapshot: c.createdByNameSnapshot,
          created_by_official_role_snapshot: c.createdByOfficialRoleSnapshot, workflow_comment_created_at_utc: '2026-11-23 08:00:00.000000',
          attachment_id: a?.attachmentId, attachment_file_id: a?.fileId, attachment_original_file_name: 'synthetic.pdf' };
      })];
    }
    assert.fail('Unexpected repository query');
  } };
  const login = userId => {
    const repo = createLoader(new Map([
      ['config/database.js', { pool: connection }], ['config/logger.js', { error() {} }],
      ['services/documentAdmission.service.js', { mutate: async (scope, callback) => {
        assert.equal(scope.projectId, 'P1'); assert.equal(scope.documentId, 'D1'); return callback(connection);
      } }],
    ])).load('repositories/document.repository.js');
    return { repo, read: () => repo.findDocumentRegisterById('D1', { userId }),
      acknowledge: () => repo.markWorkflowCommentsReadForUser({ projectId: 'P1', documentId: 'D1', userId }) };
  };
  const viewer = login(9), author = login(7);
  assert.equal((await viewer.read()).unreadCommentCount, 1); assert.equal((await viewer.read()).hasUnreadComments, true);
  assert.equal((await author.read()).unreadCommentCount, 0); assert.equal(receipts.size, 0);
  const comments = await viewer.repo.listWorkflowComments({ projectId: 'P1', documentId: 'D1' });
  assert.equal(comments[0].workflowAction, 'Emergency Workflow Attachment'); assert.ok(comments[0].attachment.attachmentId);
  assert.equal(receipts.size, 0, 'Listing without acknowledgement must not mark anything read');
  assert.equal(await viewer.acknowledge(), 1); assert.equal((await viewer.read()).hasUnreadComments, false);
  assert.equal((await login(9).read()).unreadCommentCount, 0, 'New repository session reuses persisted modeled receipts');
  assert.equal(await viewer.acknowledge(), 0);
  await f.service.submit({ ...f.args, payload: { ...f.args.payload, requestId: '12345678-1234-4234-8234-123456789abd', temporaryFileId: 'TMP-2' } });
  assert.equal((await viewer.read()).unreadCommentCount, 1); assert.equal((await author.read()).unreadCommentCount, 0);
  f.state.comments.push({ id: 'NORMAL-B', projectId: 'P1', documentId: 'D1', workflowAction: 'Approval B', createdByUserId: 7 });
  f.state.comments.push({ id: 'OTHER-PROJECT', projectId: 'P2', documentId: 'D1', workflowAction: 'Approval B', createdByUserId: 7 });
  assert.equal((await viewer.read()).unreadCommentCount, 2); assert.equal(await viewer.acknowledge(), 2);
  assert.equal((await login(9).read()).hasUnreadComments, false);
});
