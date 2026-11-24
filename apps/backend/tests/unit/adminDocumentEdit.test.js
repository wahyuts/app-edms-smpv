const assert = require('node:assert/strict');
const test = require('node:test');
const express = require('express');
const cookieParser = require('cookie-parser');
const { pool } = require('../../src/config/database');
const repo = require('../../src/repositories/document.repository');
const insertRevisionWithSnapshot = repo.insertRevision;
const lockApprovalBEvidenceWithSql = repo.lockApprovalBRevisionEvidence;
const insertCommentWithSql = repo.insertWorkflowComment;
const findDocumentWithSql = repo.findDocumentRegisterById;
const memberships = require('../../src/repositories/projectMembership.repository');
const projects = require('../../src/repositories/project.repository');
const documents = require('../../src/services/document.service');
const revisions = require('../../src/services/revision.service');
const uploads = require('../../src/services/upload.service');
const storage = require('../../src/services/storage.service');
const notifications = require('../../src/services/notification.service');
const sla = require('../../src/services/slaNotificationProducer.service');
const audit = require('../../src/services/audit.service');
const realtime = require('../../src/services/realtimeDocumentPublisher.service');
const workflow = require('../../src/services/workflowEngine.service');
const resolveAssigneeWithConnection = workflow.resolveCurrentAssigneeForStatus;
const auth = require('../../src/services/auth.service');
const { generateAccessToken } = require('../../src/utils/token');
const { AUTH_COOKIE_NAMES } = require('../../src/constants/auth.constants');
const { validateDocumentCreate, validateTemporaryFilePayload } = require('../../src/validators/document.validator');
const { DOCUMENT_WORKFLOW_STATUS: STATUS } = require('../../src/constants/document.constants');

const transitions = {
  'Process Comment': 'Project Review',
  'Process Reject': 'Process Review',
  'Project Comment': 'Approved',
  'Project Reject': 'Project Review',
};
const labelFor = (status) => status === STATUS.APPROVED ? 'AS-Built' : status.startsWith('Project') ? 'IFA-Submitted' : 'IFR-Submitted';

const fixture = (t, options = {}) => {
  const status = options.status || STATUS.PROCESS_REVIEW;
  let doc = {
    id: 'DOC-1', projectId: 'PRJ-1', projectCode: 'TEST-1', documentNumber: 'PFD-TEST-1',
    lifecycle: 'Active', status, revision: labelFor(status), drawing: 'PFD', documentTypeId: 'TYPE-1',
    activeRevisionId: 'REV-OLD', activeFileId: 'FILE-OLD', currentAssigneeUserId: status === STATUS.APPROVED ? null : 7,
    responsibleRole: workflow.getResponsibleRoleForStatus(status), description: 'Original', area: 'CDU', daysUntilValidation: 5,
    rev: options.rev ?? null,
    slaStartedAt: '2026-10-01T00:00:00Z', slaStoppedAt: status === STATUS.APPROVED ? '2026-10-02T00:00:00Z' : null,
  };
  const original = structuredClone(doc);
  const records = { revisions: [], files: [], history: [], comments: [] };
  const physicalFiles = new Set(['historical-file']);
  for (const method of ['execute', 'query', 'getConnection']) {
    t.mock.method(pool, method, async () => { throw new Error('Unexpected database access'); });
  }
  const role = options.role === undefined ? 'Admin' : options.role;
  t.mock.method(memberships, 'findActiveMembershipByProjectAndUser', async ({ projectId }) =>
    role && projectId === 'PRJ-1' ? { id: 'MEM-1', officialRole: role, userId: '1', projectId,
      username: Object.hasOwn(options, 'username') ? options.username : 'synthetic-uploader',
      userName: options.noFullName ? '' : 'Authoritative Full Name' } : null);
  t.mock.method(projects, 'findProjectById', async () => ({ id: 'PRJ-1', status: options.projectStatus || 'Active' }));
  t.mock.method(repo, 'findDocumentRegisterById', async () => structuredClone(doc));
  require('../helpers/documentCoordinationMock')(t, repo, () => doc);
  t.mock.method(repo, 'completeStoredFileProvenance', async () => {
    assert.ok(records.files.length);
    assert.ok(physicalFiles.has(records.files.at(-1).storageKey));
    if (options.provenanceFailure) throw new Error('provenance failed');
  });
  t.mock.method(repo, 'findDocumentTypeByDrawing', async () => ({ id: 'TYPE-1' }));
  t.mock.method(repo, 'getNextRevisionSequence', async () => 2 + records.revisions.length);
  t.mock.method(repo, 'lockDocumentForEdit', async () => ({ ...doc, ...options.lockedState }));
  t.mock.method(repo, 'lockApprovalBRevisionEvidence', async (connection, scope) => {
    assert.equal(connection.transaction, true);
    assert.deepEqual(scope, { projectId: doc.projectId, documentId: doc.id, revisionId: doc.activeRevisionId });
    const evidence = {
      revision: { id: doc.activeRevisionId, project_id: doc.projectId, document_id: doc.id,
        file_id: doc.activeFileId, revision_label: doc.revision, is_active: 1,
        file_project_id: doc.projectId, file_document_id: doc.id, file_is_active: 1 },
      decisions: [{ id: 'B-1', revision_id: doc.activeRevisionId, workflow_action: 'Approval B', created_by_user_id: 9,
        created_by_official_role_snapshot: doc.status === 'Process Comment' ? 'Team Process' : 'Team Project',
        decision_time: '2026-10-01 01:00:00.000000' }],
      history: [{ id: 'H-B', workflow_event: 'Approval B Completed', activity: 'Approval B', workflow_status: doc.status,
        revision_label: doc.revision, created_by_user_id: 9, history_time: '2026-10-01 01:00:00.000000' }],
    };
    options.changeEvidence?.(evidence);
    return evidence;
  });
  let transactionQueue = Promise.resolve();
  t.mock.method(repo, 'insertWorkflowComment', async (connection, value) => {
    assert.equal(connection.transaction, true);
    assert.ok(physicalFiles.has(records.files.at(-1).storageKey));
    if (options.commentFailure) throw new Error('response insert failed');
    records.comments.push(value);
  });
  t.mock.method(repo, 'runInTransaction', (callback) => {
    const run = async () => {
    const before = structuredClone({ doc, records });
    try {
      await callback({ transaction: true, async execute(sql, values) {
        assert.match(sql, /INSERT INTO document_revisions/);
        if (options.snapshotFailure) throw new Error('snapshot insert failed');
        assert.equal(values.length, 14);
        this.revisionSnapshot = {
          uploadStageSnapshot: values[11], uploadedByUsernameSnapshot: values[12], uploadedByRoleSnapshot: values[13],
        };
        return [{ affectedRows: 1 }];
      } });
      if (options.commitFailure) throw new Error('commit failed');
    } catch (error) {
      doc = before.doc;
      Object.assign(records, before.records);
      throw error;
    }
    };
    if (!options.serialize) return run();
    const operation = transactionQueue.then(run);
    transactionQueue = operation.catch(() => {});
    return operation;
  });
  t.mock.method(repo, 'updateDocumentWorkflowState', async (connection, values) => {
    assert.equal(connection.transaction, true);
    if (options.workflowConflict) return 0;
    Object.assign(doc, {
      status: values.workflowStatus, revision: values.revisionLabel,
      responsibleRole: values.responsibleRole, currentAssigneeUserId: values.currentAssigneeUserId,
    });
    if (values.resetSla) { doc.slaStartedAt = 'new-cycle'; doc.slaStoppedAt = values.slaStoppedAtExpression === 'UTC_TIMESTAMP(3)' ? 'finished-cycle' : null; }
    return 1;
  });
  t.mock.method(repo, 'updateDocumentMetadata', async (connection, values) => {
    assert.equal(connection.transaction, true);
    for (const field of ['area', 'description', 'drawing', 'documentTypeId', 'daysUntilValidation']) doc[field] = values[field];
    if (values.rev !== undefined) doc.rev = values.rev;
  });
  for (const method of ['deactivateDocumentRevisions', 'deactivateDocumentRevisionFiles']) {
    t.mock.method(repo, method, async (connection) => assert.equal(connection.transaction, true));
  }
  for (const [method, key] of [['insertRevision', 'revisions'], ['insertStoredFile', 'files'], ['insertDocumentHistory', 'history']]) {
    t.mock.method(repo, method, async (connection, value) => {
      assert.equal(connection.transaction, true);
      if (options.historyFailure && key === 'history') throw new Error('history failed');
      if (key === 'revisions') {
        await insertRevisionWithSnapshot(connection, value);
        value = { ...value, ...connection.revisionSnapshot };
      }
      records[key].push(value);
    });
  }
  t.mock.method(repo, 'updateDocumentActivePointers', async (connection, value) => {
    assert.equal(connection.transaction, true);
    doc.activeFileId = value.activeFileId;
    doc.activeRevisionId = value.activeRevisionId;
  });
  t.mock.method(uploads, 'assertTemporaryUploadConsumable', async ({ actorUserId, temporaryFileId }) => {
    assert.equal(actorUserId, '1'); assert.equal(temporaryFileId, 'TMP-1');
    if (options.invalidTemporary) throw Object.assign(new Error('Upload tidak valid.'), { statusCode: 422 });
    return { storageKey: 'temp-file', originalFileName: 'Original Drawing.pdf', extension: 'pdf', mimeType: 'application/pdf', fileSize: 100 };
  });
  t.mock.method(uploads, 'consumeTemporaryUploadMetadata', async () => options.consumed === undefined ? 1 : options.consumed);
  t.mock.method(uploads, 'discardTemporaryUpload', async () => {});
  t.mock.method(storage, 'finalize', async (source, destination) => {
    assert.equal(source, 'temp-file');
    if (options.storageFailure) throw new Error('storage failed');
    physicalFiles.add(destination);
  });
  t.mock.method(storage, 'delete', async (key) => physicalFiles.delete(key));
  t.mock.method(workflow, 'resolveCurrentAssigneeForStatus', async () => options.noAssignee ? null : { userId: 8 });
  t.mock.method(notifications, 'createDocumentNotificationsForOfficialRoles', async () => {});
  t.mock.method(sla, 'evaluateDocumentForSlaNotifications', async () => {});
  t.mock.method(audit, 'recordActivitySafely', async () => {});
  for (const method of ['publishDocumentUpdated', 'publishWorkflowChanged', 'publishRevisionUploaded']) {
    t.mock.method(realtime, method, () => {});
  }
  const args = {
    activeProject: { id: options.activeProjectId || 'PRJ-1' }, actorOfficialRole: 'Admin',
    actorUserId: '1', actorUserFullName: 'Admin Test', documentId: 'DOC-1',
    payload: {
      description: 'Updated', expectedWorkflowStatus: status,
      expectedActiveRevisionId: original.activeRevisionId,
      expectedCurrentAssigneeUserId: original.currentAssigneeUserId === null ? null : String(original.currentAssigneeUserId),
      ...(options.file ? { temporaryFileId: 'TMP-1' } : {}),
    },
  };
  return { args, records, original, physicalFiles, get doc() { return doc; } };
};

for (const role of ['Admin', 'Document Owner']) for (const status of ['Process Comment', 'Project Comment']) {
  for (const failure of ['commentFailure', 'noFullName', 'storageFailure', 'provenanceFailure', 'snapshotFailure', 'commitFailure']) {
    test(`Response transaction rollback: ${role}, ${status}, ${failure}`, async t => {
      const f = fixture(t, { role, status, file: true, [failure]: true });
      await assert.rejects(role === 'Admin' ? documents.updateDocument(f.args) : revisions.uploadRevision(f.args));
      assert.deepEqual(f.doc, f.original);
      for (const rows of Object.values(f.records)) assert.equal(rows.length, 0);
      assert.deepEqual([...f.physicalFiles], ['historical-file']);
      assert.equal(notifications.createDocumentNotificationsForOfficialRoles.mock.callCount(), 0);
      assert.equal(realtime.publishRevisionUploaded.mock.callCount(), 0);
    });
  }
}

for (const status of ['Process Reject', 'Project Reject', 'Approved', 'Process Review', 'Project Review']) {
  test(`No Response to Approval B for unrelated upload: ${status}`, async t => {
    const f = fixture(t, { status, file: true });
    await documents.updateDocument(f.args);
    assert.equal(f.records.comments.length, 0);
  });
}

test('Response repository persists plain text with DB operation time, no A/Emergency fields', async () => {
  const calls = [];
  await insertCommentWithSql({ execute: async (sql, params) => { calls.push({ sql, params }); } }, {
    id: 'WFC-test', projectId: 'PRJ-test', documentId: 'DOC-test', revisionId: 'REV-new',
    workflowAction: 'Response to Approval B', workflowComment: 'Plain text Approved.',
    createdByUserId: 42, createdByNameSnapshot: 'Full Name', createdByOfficialRoleSnapshot: 'Document Owner',
  });
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /UTC_TIMESTAMP\(3\)/);
  assert.doesNotMatch(calls[0].sql, /request_fingerprint|approval_target_stage_snapshot|created_by_username_snapshot/);
  assert.deepEqual(calls[0].params, ['WFC-test', 'PRJ-test', 'DOC-test', 'REV-new', 'Response to Approval B',
    'Plain text Approved.', 42, 'Full Name', 'Document Owner']);
});

for (const role of ['Admin', 'Document Owner']) for (const status of ['Process Comment', 'Project Comment']) {
  test(`Revision 2 pending B: ${role}, ${status}, snapshots, actual actor and post-commit effects`, async t => {
    const f = fixture(t, { role, status, file: true });
    const result = role === 'Admin' ? await documents.updateDocument(f.args) : await revisions.uploadRevision(f.args);
    const final = status === 'Project Comment';
    assert.equal(result.status, final ? 'Approved' : 'Project Review');
    assert.equal(result.revision, final ? 'AS-Built' : 'IFA-Submitted');
    assert.equal(result.responsibleRole, final ? 'None' : 'Team Project');
    assert.equal(result.currentAssigneeUserId, final ? null : 8);
    assert.equal(result.slaStartedAt, 'new-cycle');
    assert.equal(result.slaStoppedAt, final ? 'finished-cycle' : null);
    const row = f.records.revisions[0];
    assert.equal(row.sourceStatus, status); assert.equal(row.resultStatus, result.status);
    assert.equal(row.uploadStageSnapshot, final ? 'As-Built' : 'IFA-Submitted');
    assert.equal(row.uploadedByRoleSnapshot, role); assert.equal(row.createdByUserId, '1');
    assert.equal(row.revisionSequence, 2);
    assert.equal(f.records.history[0].activity, 'Upload Revision');
    assert.equal(f.records.history[0].workflowEvent, 'Upload Revision Completed');
    assert.equal(f.records.comments.length, 1);
    const response = f.records.comments[0];
    assert.equal(response.workflowAction, 'Response to Approval B');
    assert.equal(response.projectId, result.projectId); assert.equal(response.documentId, result.id);
    assert.equal(response.revisionId, row.id); assert.notEqual(response.revisionId, f.original.activeRevisionId);
    assert.equal(response.createdByUserId, '1'); assert.equal(response.createdByOfficialRoleSnapshot, role);
    assert.equal(response.createdByNameSnapshot, 'Authoritative Full Name');
    assert.equal(response.workflowComment, final
      ? 'The requirements necessary for this document to meet the criteria for Approval B have been fulfilled. The document has been re-uploaded, and its status has been changed to Approved.'
      : 'The requirements necessary for this document to meet the criteria for Approval B have been fulfilled. The document has been re-uploaded and immediately forwarded to the Project Team for review.');
    for (const field of ['requestFingerprint', 'approvalTargetStageSnapshot', 'attachment']) assert.equal(response[field], undefined);
    const notification = notifications.createDocumentNotificationsForOfficialRoles.mock.calls[0].arguments[0];
    assert.equal(notifications.createDocumentNotificationsForOfficialRoles.mock.callCount(), 1);
    assert.equal(notification.eventType, final ? 'Document Approved' : 'Revision Uploaded');
    assert.deepEqual(notification.officialRoles, final ? ['Admin', 'Document Owner'] : ['Team Project']);
    assert.doesNotMatch(notification.dictionaryOverride.message, /Approval A|ready for review/i);
    assert.match(notification.dictionaryOverride.message, final ? /approved after completing the Approval B revision/ : /Project Review/);
    const activity = audit.recordActivitySafely.mock.calls[0].arguments[0];
    assert.equal(activity.action, 'Upload Revision'); assert.equal(activity.actorOfficialRole, role);
    assert.equal(activity.actorUserId, '1'); assert.equal(activity.metadata.previousStatus, status);
    assert.equal(activity.metadata.nextStatus, result.status);
    assert.equal(activity.metadata.sourceSubmissionStage, f.original.revision);
    assert.equal(activity.metadata.resultSubmissionStage, result.revision);
    assert.equal(realtime.publishRevisionUploaded.mock.callCount(), 1);
    assert.equal(realtime.publishWorkflowChanged.mock.callCount(), 0);
    assert.equal(repo.lockDocumentForEdit.mock.callCount(), 1);
    assert.equal(repo.getNextRevisionSequence.mock.calls[0].arguments[1].connection.transaction, true);
    const { canAddEmergencyAttachment } = await import('../../../frontend/src/features/document-register/utils/emergencyAttachmentEligibility.js');
    const flags = { EMERGENCY_UPLOAD_TEAM_PROCESS_ENABLED: true, EMERGENCY_UPLOAD_TEAM_PROJECT_ENABLED: true };
    assert.equal(canAddEmergencyAttachment({ documentItem: result, project: { id: 'PRJ-1', status: 'Active' },
      role: final ? 'Team Project' : 'Team Process', flags }), true);
    if (final) {
      pool.execute.mock.mockImplementation(async () => [[{ id: result.id, project_id: result.projectId,
        workflow_status: 'Approved', revision_label: 'AS-Built', lifecycle_status: 'Active',
        sla_started_at: '2026-11-24T01:00:00Z', sla_stopped_at: '2026-11-24T01:00:00Z' }]]);
      const projected = await findDocumentWithSql(result.id);
      assert.equal(projected.slaStatus, 'Final As-Built'); assert.equal(projected.slaTimer.display, 'Done');
      assert.equal(require('../../src/services/escalation.service').createEscalationItem(projected), null);
    }
  });
}

for (const status of ['Process Comment', 'Project Comment']) {
  test(`Revision 2 Admin metadata-only keeps all B state and reevaluates review days: ${status}`, async t => {
    const f = fixture(t, { status }); f.args.payload.daysUntilValidation = 20;
    await documents.updateDocument(f.args);
    for (const key of ['status', 'revision', 'responsibleRole', 'currentAssigneeUserId', 'activeRevisionId', 'activeFileId', 'slaStartedAt', 'slaStoppedAt']) {
      assert.equal(f.doc[key], f.original[key], key);
    }
    assert.equal(f.records.revisions.length, 0); assert.equal(f.records.files.length, 0);
    assert.equal(f.records.comments.length, 0);
    assert.equal(repo.lockApprovalBRevisionEvidence.mock.callCount(), 0);
    assert.equal(repo.updateDocumentWorkflowState.mock.callCount(), 0);
    assert.equal(notifications.createDocumentNotificationsForOfficialRoles.mock.callCount(), 0);
    assert.equal(sla.evaluateDocumentForSlaNotifications.mock.calls[0].arguments[0].triggerSource, 'days_until_validation_update');
    assert.equal(f.records.history[0].activity, 'Edit Document');
    assert.equal(audit.recordActivitySafely.mock.calls[0].arguments[0].metadata.previousStatus, status);
    assert.equal(audit.recordActivitySafely.mock.calls[0].arguments[0].metadata.nextStatus, status);
  });
}

for (const [label, changeEvidence] of [
  ['missing revision', e => { e.revision = null; }],
  ['wrong file', e => { e.revision.file_id = 'OTHER'; }],
  ['cross-project file', e => { e.revision.file_project_id = 'OTHER'; }],
  ['inactive revision', e => { e.revision.is_active = 0; }],
  ['inactive file', e => { e.revision.file_is_active = 0; }],
  ['wrong stage', e => { e.revision.revision_label = 'AS-Built'; }],
  ['missing decision', e => { e.decisions = []; }],
  ['stale B after C', e => { e.decisions.unshift({ ...e.decisions[0], id: 'C', workflow_action: 'Approval C', decision_time: '2026-10-02 01:00:00.000000' }); }],
  ['wrong actor role', e => { e.decisions[0].created_by_official_role_snapshot = 'Admin'; }],
  ['Emergency is not approval', e => { e.decisions[0].workflow_action = 'Emergency Workflow Attachment'; }],
  ['wrong revision decision', e => { e.decisions[0].revision_id = 'OLD-REVISION'; }],
  ['ambiguous decision time', e => { e.decisions.push({ ...e.decisions[0], id: 'B2' }); }],
  ['missing history', e => { e.history = []; }],
  ['inconsistent history status', e => { e.history[0].workflow_status = 'Process Review'; }],
  ['inconsistent history actor', e => { e.history[0].created_by_user_id = 100; }],
  ['ambiguous history time', e => { e.history.push({ ...e.history[0], id: 'H2' }); }],
]) for (const status of ['Process Comment', 'Project Comment']) {
  test(`Revision 2 evidence rejects ${status}: ${label}`, async t => {
    const f = fixture(t, { status, file: true, changeEvidence });
    await assert.rejects(documents.updateDocument(f.args), { statusCode: 409, code: 'APPROVAL_B_REVISION_EVIDENCE_UNVERIFIED' });
    assert.deepEqual(f.doc, f.original); assert.equal(f.records.revisions.length, 0);
    assert.equal(storage.finalize.mock.callCount(), 0); assert.equal(repo.updateDocumentWorkflowState.mock.callCount(), 0);
    assert.equal(notifications.createDocumentNotificationsForOfficialRoles.mock.callCount(), 0);
    assert.equal(realtime.publishRevisionUploaded.mock.callCount(), 0);
  });
}

test('Revision 2 consistent pending B with NULL username snapshots and later metadata edit remains usable', async t => {
  const f = fixture(t, { status: 'Process Comment', file: true, changeEvidence: e => {
    e.decisions[0].created_by_username_snapshot = null;
    e.history[0].activity = 'Edit Document'; e.history[0].workflow_event = 'Document Updated';
    e.history[0].created_by_user_id = 'ANOTHER-METADATA-EDITOR';
  } });
  await documents.updateDocument(f.args); assert.equal(f.doc.status, 'Project Review');
});

for (const role of ['Admin', 'Document Owner']) {
  test(`Revision 2 active project isolation rejects ${role} with membership but wrong active project`, async t => {
    const f = fixture(t, { role, status: 'Process Comment', file: true, activeProjectId: 'OTHER' });
    await assert.rejects(revisions.uploadRevision(f.args), { statusCode: 403 });
    assert.equal(repo.runInTransaction.mock.callCount(), 0);
  });
}

test('Revision 2 repeated workflow cycles create sequential uploads without duplicate approval comments', async t => {
  const f = fixture(t, { status: 'Process Comment', file: true });
  await documents.updateDocument(f.args);
  Object.assign(f.doc, { status: 'Project Comment', revision: 'IFA-Submitted', responsibleRole: 'Document Owner' });
  Object.assign(f.args.payload, { expectedWorkflowStatus: 'Project Comment', expectedActiveRevisionId: f.doc.activeRevisionId,
    expectedCurrentAssigneeUserId: String(f.doc.currentAssigneeUserId) });
  await documents.updateDocument(f.args);
  assert.equal(f.doc.status, 'Approved'); assert.deepEqual(f.records.revisions.map(row => row.revisionSequence), [2, 3]);
  assert.deepEqual(f.records.revisions.map(row => row.uploadStageSnapshot), ['IFA-Submitted', 'As-Built']);
  assert.deepEqual(f.records.revisions.map(row => row.sourceStatus), ['Process Comment', 'Project Comment']);
  assert.equal(f.records.history.every(row => row.activity === 'Upload Revision'), true);
  assert.equal(f.records.revisions[0].resultStatus, 'Project Review');
  assert.equal(f.records.comments.length, 2);
  assert.deepEqual(f.records.comments.map(row => row.revisionId), f.records.revisions.map(row => row.id));
});

for (const status of ['Process Comment', 'Project Comment']) {
  test(`Revision 2 serialized concurrent/repeated uploads reject the stale request: ${status}`, async t => {
    const f = fixture(t, { status, file: true, serialize: true });
    const outcomes = await Promise.allSettled([documents.updateDocument(f.args), documents.updateDocument(f.args)]);
    assert.equal(outcomes.filter(row => row.status === 'fulfilled').length, 1);
    assert.equal(outcomes.find(row => row.status === 'rejected').reason.statusCode, 409);
    assert.equal(f.records.revisions.length, 1); assert.equal(f.records.files.length, 1);
    assert.equal(f.records.comments.length, 1);
    assert.equal(notifications.createDocumentNotificationsForOfficialRoles.mock.callCount(), 1);
    assert.equal(realtime.publishRevisionUploaded.mock.callCount(), 1);
    assert.ok(f.physicalFiles.has(f.records.files[0].storageKey));
    await assert.rejects(documents.updateDocument(f.args), { statusCode: 409 });
  });
}

test('Revision 2 evidence SQL is locked, exact-scoped and excludes non-approval comments', async () => {
  const calls = [];
  await lockApprovalBEvidenceWithSql({ execute: async (sql, args) => { calls.push({ sql, args }); return [[]]; } },
    { projectId: 'P', documentId: 'D', revisionId: 'R' });
  assert.equal(calls.length, 3);
  for (const { sql } of calls) { assert.match(sql, /FOR UPDATE/); assert.match(sql, /SELECT/); }
  assert.deepEqual(calls.map(call => call.args), [['R', 'P', 'D'], ['P', 'D', 'R'], ['P', 'D']]);
  assert.match(calls[1].sql, /workflow_action IN \('Approval A','Approval B','Approval C'\)/);
  assert.doesNotMatch(calls[1].sql, /Emergency Workflow Attachment/);
  assert.match(calls[2].sql, /ORDER BY created_at DESC,id DESC LIMIT 2 FOR UPDATE/);
});

test('Revision 2 uses transaction connection for assignee lookup and permits NULL only at final status', async t => {
  const calls = [];
  const connection = { execute: async (sql, args) => { calls.push({ sql, args }); return [[]]; } };
  await memberships.findActiveMembershipByProjectAndOfficialRole({ projectId: 'SYNTHETIC-P', officialRole: 'Team Project' }, { connection });
  assert.equal(calls.length, 1); assert.deepEqual(calls[0].args, ['SYNTHETIC-P', 'team project']);
  assert.match(calls[0].sql, /LOWER\(TRIM\(projects.status\)\) = 'active'/);
  const lookup = t.mock.method(memberships, 'findActiveMembershipByProjectAndOfficialRole', async (scope, options) => {
    assert.equal(scope.projectId, 'SYNTHETIC-P'); assert.equal(scope.officialRole, 'Team Project');
    assert.equal(options.connection, connection); return { userId: 8 };
  });
  assert.deepEqual(await resolveAssigneeWithConnection({ projectId: 'SYNTHETIC-P', status: 'Project Review' }, { connection }), { userId: 8 });
  assert.equal(await resolveAssigneeWithConnection({ projectId: 'SYNTHETIC-P', status: 'Approved' }, { connection }), null);
  assert.equal(lookup.mock.callCount(), 1);
});

test('Revision 2 ignores frontend target status', async t => {
  const f = fixture(t, { status: 'Process Comment', role: 'Document Owner', file: true });
  Object.assign(f.args.payload, { targetStatus: 'Approved', workflowStatus: 'Approved', revisionLabel: 'AS-Built' });
  await revisions.uploadRevision(f.args);
  assert.equal(f.doc.status, 'Project Review'); assert.equal(f.doc.revision, 'IFA-Submitted');
});

test('Revision 2 rejects inconsistent locked submission stage before revision writes', async t => {
  const f = fixture(t, { status: 'Process Comment', file: true, lockedState: { revision: 'AS-Built' } });
  await assert.rejects(documents.updateDocument(f.args), { statusCode: 409, code: 'APPROVAL_B_REVISION_EVIDENCE_UNVERIFIED' });
  assert.equal(f.records.revisions.length, 0); assert.equal(repo.updateDocumentWorkflowState.mock.callCount(), 0);
});

for (const file of [false, true]) {
  test(`Edit Document with real isolated SLA identity persistence, upload=${file}`, async t => {
    const f = fixture(t, { file });
    const { fixture: slaFixture, document: slaDocument } = require('../helpers/slaTransactionFixture.cjs');
    const isolated = slaFixture({ documents: [slaDocument('DOC-1', { projectId: 'PRJ-1' })] });
    f.args.payload.daysUntilValidation = 3;
    sla.evaluateDocumentForSlaNotifications.mock.mockImplementation(async ({ document: updated }) => {
      Object.assign(isolated.documents[0], updated);
      return isolated.evaluate();
    });
    const result = await documents.updateDocument(f.args);
    assert.equal(result.description, 'Updated');
    assert.equal(f.records.files.length, Number(file));
    assert.equal(f.records.revisions.length, Number(file));
    assert.equal(file ? result.activeFileId !== f.original.activeFileId : result.activeFileId === f.original.activeFileId, true);
    assert.equal(isolated.state.notifications.length, 4);
    assert.ok(isolated.state.notifications.every(row => /^sla:v1:[a-f0-9]{64}$/.test(row.identity_key)));
    assert.equal(isolated.state.evaluations.length, 1);
    assert.equal(isolated.state.audits.length, 1);
    assert.equal(isolated.events.length, 4);
    assert.equal(realtime.publishDocumentUpdated.mock.callCount() + realtime.publishRevisionUploaded.mock.callCount(), 1);
  });
}

for (const action of ['create', 'upload']) for (const options of [{ username: null }, { username: ' ' }, { snapshotFailure: true }]) {
  test(`Snapshot failure rolls back ${action}: ${JSON.stringify(options)}`, async t => {
    const f = fixture(t, { ...options, file: true });
    t.mock.method(repo, 'findDocumentByProjectAndNumber', async () => null);
    t.mock.method(memberships, 'findActiveMembershipByProjectAndOfficialRole', async () => ({ userId: 7 }));
    t.mock.method(repo, 'insertDocument', async () => {});
    const pending = action === 'create'
      ? documents.createDocument({ ...f.args, payload: { documentNumber: 'SYNTHETIC-NEW', drawing: 'PFD', area: 'TEST',
        description: 'Synthetic upload', daysUntilValidation: 5, temporaryFileId: 'TMP-1' } })
      : documents.updateDocument(f.args);
    await assert.rejects(pending, options.snapshotFailure ? /snapshot insert failed/ : { code: 'REVISION_UPLOAD_SNAPSHOT_UNAVAILABLE' });
    assert.deepEqual(f.doc, f.original);
    assert.deepEqual(f.records, { revisions: [], files: [], history: [], comments: [] });
    assert.deepEqual([...f.physicalFiles], ['historical-file']);
    assert.equal(storage.finalize.mock.callCount(), 0);
    assert.equal(realtime.publishRevisionUploaded.mock.callCount(), 0);
    assert.equal(audit.recordActivitySafely.mock.callCount(), 0);
  });
}

test('Archive and Restore preserve recorded upload snapshots and active pointers', async t => {
  const f = fixture(t, { file: true, status: STATUS.APPROVED });
  await documents.updateDocument(f.args);
  const revisionBefore = structuredClone(f.records.revisions);
  const pointers = [f.doc.activeFileId, f.doc.activeRevisionId];
  t.mock.method(repo, 'updateDocumentLifecycleStatus', async (connection, values) => { f.doc.lifecycle = values.lifecycleStatus; });
  t.mock.method(realtime, 'publishDocumentArchived', () => {});
  t.mock.method(realtime, 'publishDocumentRestored', () => {});
  await documents.archiveDocument(f.args);
  assert.equal(f.doc.lifecycle, 'Archived');
  await documents.restoreDocument(f.args);
  assert.equal(f.doc.lifecycle, 'Active');
  assert.deepEqual(f.records.revisions, revisionBefore);
  assert.deepEqual([f.doc.activeFileId, f.doc.activeRevisionId], pointers);
});

test('Upload snapshots use authoritative project membership, not forged payload or actor role', async t => {
  const f = fixture(t, { status: STATUS.PROJECT_COMMENT, file: true, role: 'Document Owner' });
  f.args.actorOfficialRole = 'Admin';
  Object.assign(f.args.payload, { uploadedByUsernameSnapshot: 'forged', uploadedByRoleSnapshot: 'Admin', uploadStageSnapshot: 'As-Built' });
  await revisions.uploadRevision(f.args);
  assert.equal(f.records.revisions[0].uploadedByRoleSnapshot, 'Document Owner');
  assert.equal(f.records.revisions[0].uploadedByUsernameSnapshot, 'synthetic-uploader');
  assert.equal(f.records.revisions[0].uploadStageSnapshot, 'As-Built');
});

for (const rev of ['A', '01', undefined, '', '   ', null]) {
  test(`Create service persists normalized REV. ${JSON.stringify(rev)} and returns it`, async (t) => {
    const f = fixture(t);
    t.mock.method(repo, 'findDocumentByProjectAndNumber', async () => null);
    t.mock.method(memberships, 'findActiveMembershipByProjectAndOfficialRole', async () => ({ userId: 7 }));
    t.mock.method(repo, 'insertDocument', async (connection, value) => {
      assert.equal(connection.transaction, true);
      Object.assign(f.doc, { id: value.id, rev: value.rev });
    });
    t.mock.method(realtime, 'publishDocumentCreated', () => {});
    const validation = validateDocumentCreate({ documentNumber: 'PFD-TEST-1', drawing: 'PFD', area: 'CDU',
      temporaryFileId: 'TMP-1', ...(rev !== undefined ? { rev } : {}) });
    assert.equal(validation.isValid, true);
    const result = await documents.createDocument({ ...f.args, payload: validation.value });
    assert.equal(result.rev, typeof rev === 'string' ? rev.trim() || null : null);
    assert.equal(repo.insertDocument.mock.calls[0].arguments[1].rev, result.rev);
    assert.equal(f.records.revisions.length, 1);
    assert.equal(f.records.revisions[0].uploadStageSnapshot, 'IFR-Submitted');
    assert.equal(f.records.revisions[0].uploadedByUsernameSnapshot, 'synthetic-uploader');
    assert.equal(f.records.revisions[0].uploadedByRoleSnapshot, 'Admin');
  });
}

for (const [initial, patch, expected] of [[null, 'A', 'A'], ['A', 'B', 'B'], ['B', null, null], ['01', undefined, '01']]) {
  test(`REV. metadata edit ${initial} -> ${patch} preserves file and workflow in Process Review`, async (t) => {
    const f = fixture(t, { rev: initial });
    f.args.payload = {
      ...(patch !== undefined ? { rev: patch } : { description: 'Updated' }),
      expectedWorkflowStatus: f.original.status,
      expectedActiveRevisionId: f.original.activeRevisionId,
      expectedCurrentAssigneeUserId: String(f.original.currentAssigneeUserId),
    };
    const result = await documents.updateDocument(f.args);
    assert.equal(result.rev, expected);
    for (const key of ['status', 'revision', 'activeRevisionId', 'activeFileId', 'slaStartedAt', 'currentAssigneeUserId']) {
      assert.equal(result[key], f.original[key]);
    }
    assert.equal(f.records.files.length, 0);
    assert.equal(f.records.revisions.length, 0);
    assert.equal(storage.finalize.mock.callCount(), 0);
    assert.equal(repo.completeStoredFileProvenance.mock.callCount(), 0);
    assert.equal(repo.updateDocumentWorkflowState.mock.callCount(), 0);
    assert.equal(sla.evaluateDocumentForSlaNotifications.mock.callCount(), 0);
  });
}

for (const [status, nextStatus] of Object.entries(transitions)) {
  test(`REV.-only Admin edit retains existing ${status} -> ${nextStatus} and SLA reset`, async (t) => {
    const f = fixture(t, { status });
    delete f.args.payload.description;
    f.args.payload.rev = 'Rev.01';
    const result = await documents.updateDocument(f.args);
    assert.equal(result.rev, 'Rev.01');
    const preserved = status.endsWith('Comment');
    assert.equal(result.status, preserved ? status : nextStatus);
    assert.equal(result.slaStartedAt, preserved ? f.original.slaStartedAt : 'new-cycle');
    assert.equal(result.currentAssigneeUserId, preserved ? f.original.currentAssigneeUserId : 8);
    assert.equal(f.records.files.length, 0);
    assert.equal(f.records.revisions.length, 0);
    assert.equal(result.activeFileId, f.original.activeFileId);
    assert.equal(repo.completeStoredFileProvenance.mock.callCount(), 0);
  });
}

for (const status of Object.values(STATUS)) {
  for (const file of [false, true]) {
    test(`Admin Edit: ${status}, file=${file}`, async (t) => {
      const f = fixture(t, { status, file });
      const result = await documents.updateDocument(f.args);
      const target = !file && status.endsWith('Comment') ? status : transitions[status] || status;
      const transition = target !== status;
      const final = transition && target === STATUS.APPROVED;
      assert.equal(result.status, target);
      assert.equal(result.description, 'Updated');
      assert.equal(f.records.revisions.length, Number(file));
      assert.equal(f.records.files.length, Number(file));
      assert.equal(f.records.history.length, 1);
      assert.equal(f.records.history[0].activity, file ? 'Upload Revision' : 'Edit Document');
      assert.equal(f.records.history[0].workflowStatus, result.status);
      assert.equal(f.records.history[0].revisionLabel, result.revision);
      assert.equal(repo.updateDocumentWorkflowState.mock.callCount(), Number(transition));
      assert.equal(workflow.resolveCurrentAssigneeForStatus.mock.callCount(), Number(transition && !final));
      assert.equal(notifications.createDocumentNotificationsForOfficialRoles.mock.callCount(), Number(transition));
      assert.equal(sla.evaluateDocumentForSlaNotifications.mock.callCount(), Number(transition));
      assert.equal(result.slaStartedAt, transition ? 'new-cycle' : f.original.slaStartedAt);
      assert.equal(result.currentAssigneeUserId, transition ? final ? null : 8 : f.original.currentAssigneeUserId);
      assert.equal(audit.recordActivitySafely.mock.callCount(), 1);
      const activity = audit.recordActivitySafely.mock.calls[0].arguments[0];
      assert.equal(activity.actorOfficialRole, 'Admin');
      assert.equal(activity.metadata.previousStatus, status);
      assert.equal(activity.metadata.nextStatus, result.status);
      assert.equal(realtime.publishDocumentUpdated.mock.callCount() + realtime.publishWorkflowChanged.mock.callCount() + realtime.publishRevisionUploaded.mock.callCount(), 1);
      assert.ok(f.physicalFiles.has('historical-file'));
      if (file) {
        assert.equal(f.records.revisions[0].uploadStageSnapshot, result.revision === 'AS-Built' ? 'As-Built' : result.revision);
        assert.equal(f.records.revisions[0].uploadedByUsernameSnapshot, 'synthetic-uploader');
        assert.equal(f.records.revisions[0].uploadedByRoleSnapshot, 'Admin');
        assert.notEqual(result.activeFileId, f.original.activeFileId);
        assert.equal(f.records.revisions[0].revisionSequence, 2);
        assert.equal(f.records.revisions[0].sourceStatus, status);
        assert.equal(f.records.revisions[0].resultStatus, result.status);
        assert.equal(f.records.files[0].originalFileName, 'Original Drawing.pdf');
        assert.ok(f.physicalFiles.has(f.records.files[0].storageKey));
      } else {
        assert.equal(result.activeFileId, f.original.activeFileId);
        assert.equal(result.activeRevisionId, f.original.activeRevisionId);
        assert.equal(result.revision, f.original.revision);
        assert.equal(repo.getNextRevisionSequence.mock.callCount(), 0);
        assert.equal(repo.deactivateDocumentRevisions.mock.callCount(), 0);
        assert.equal(storage.finalize.mock.callCount(), 0);
        assert.equal(repo.completeStoredFileProvenance.mock.callCount(), 0);
        assert.equal(uploads.assertTemporaryUploadConsumable.mock.callCount(), 0);
      }
      if (!transition) assert.equal(result.slaStoppedAt, f.original.slaStoppedAt);
      if (status === STATUS.APPROVED && file) {
        assert.match(f.records.history[0].reason, /tanpa approval ulang/);
        assert.equal(audit.recordActivitySafely.mock.calls[0].arguments[0].metadata.approvalRepeated, false);
      }
      if (transition) {
        const workflowUpdate = repo.updateDocumentWorkflowState.mock.calls[0].arguments[1];
        assert.equal(workflowUpdate.resetSla, true);
        assert.equal(workflowUpdate.slaStoppedAtExpression, final ? 'UTC_TIMESTAMP(3)' : 'NULL');
        assert.equal(workflowUpdate.responsibleRole, workflow.getResponsibleRoleForStatus(result.status));
        if (!final) assert.equal(workflow.resolveCurrentAssigneeForStatus.mock.calls[0].arguments[0].status, result.status);
        const notification = notifications.createDocumentNotificationsForOfficialRoles.mock.calls[0].arguments[0];
        assert.deepEqual(notification.officialRoles, final ? ['Admin', 'Document Owner'] : [workflow.getResponsibleRoleForStatus(result.status)]);
        assert.equal(notification.eventType, final ? 'Document Approved' : file ? 'Revision Uploaded' : 'Document Updated');
        if (final) assert.equal(result.slaStoppedAt, 'finished-cycle');
      }
    });
  }
}

test('Admin Days for Review evaluation does not reset SLA on a preserving edit', async (t) => {
  const f = fixture(t, { file: true });
  f.args.payload.daysUntilValidation = 10;
  await documents.updateDocument(f.args);
  assert.equal(f.doc.daysUntilValidation, 10);
  assert.equal(f.doc.slaStartedAt, f.original.slaStartedAt);
  assert.equal(sla.evaluateDocumentForSlaNotifications.mock.calls[0].arguments[0].triggerSource, 'days_until_validation_update');
});

for (const status of Object.keys(revisions.uploadRevisionTransitionMatrix)) {
  test(`Document Owner retains required revision and original transition: ${status}`, async (t) => {
    const f = fixture(t, { role: 'Document Owner', file: true, status });
    await revisions.uploadRevision(f.args);
    assert.equal(f.doc.status, revisions.uploadRevisionTransitionMatrix[status]);
    assert.equal(f.records.revisions.length, 1);
    assert.equal(f.doc.slaStartedAt, 'new-cycle');
    assert.equal(validateTemporaryFilePayload({ ...f.args.payload, temporaryFileId: '' }).isValid, false);
  });
}

for (const status of Object.keys(transitions)) {
  test(`Document Owner metadata edit retains its existing status: ${status}`, async (t) => {
    const f = fixture(t, { role: 'Document Owner', status });
    await documents.updateDocument(f.args);
    assert.equal(f.doc.status, status);
    assert.equal(f.records.revisions.length, 0);
    assert.equal(repo.updateDocumentWorkflowState.mock.callCount(), 0);
  });
}

for (const role of ['Team Process', 'Team Project', 'Viewer', null]) {
  test(`Service rejects ${role || 'non-member'} even when actor claims Admin`, async (t) => {
    const f = fixture(t, { role, file: true });
    await assert.rejects(documents.updateDocument(f.args), { statusCode: 403 });
    await assert.rejects(revisions.uploadRevision(f.args), { statusCode: 403 });
    assert.equal(repo.runInTransaction.mock.callCount(), 0);
  });
}

for (const options of [
  { activeProjectId: 'PRJ-OTHER' }, { projectStatus: 'Inactive' },
  { status: 'Unknown' }, { lockedState: { activeRevisionId: 'REV-NEW' } },
  { lockedState: { lifecycle: 'Archived' } },
  { status: STATUS.APPROVED, lockedState: { currentAssigneeUserId: 'unexpected' } },
  { status: STATUS.PROCESS_COMMENT, file: true, noAssignee: true },
  { status: STATUS.PROJECT_COMMENT, file: true, workflowConflict: true },
  { file: true, invalidTemporary: true },
  { file: true, storageFailure: true }, { file: true, consumed: 0 }, { file: true, commitFailure: true },
  { file: true, provenanceFailure: true },
  { status: STATUS.PROCESS_COMMENT, file: true, storageFailure: true },
  { status: STATUS.PROJECT_COMMENT, file: true, commitFailure: true },
  { status: STATUS.PROCESS_COMMENT, historyFailure: true },
  ...[STATUS.PROCESS_REJECT, STATUS.PROJECT_REJECT].flatMap((status) => [
    { status, noAssignee: true },
    { status, workflowConflict: true },
    { status, historyFailure: true },
    { status, file: true, storageFailure: true },
    { status, file: true, commitFailure: true },
    { status, commitFailure: true },
  ]),
]) {
  test(`Failed edit leaves document/history intact: ${JSON.stringify(options)}`, async (t) => {
    const f = fixture(t, options);
    await assert.rejects(documents.updateDocument(f.args));
    assert.deepEqual(f.doc, f.original);
    assert.deepEqual(f.records, { revisions: [], files: [], history: [], comments: [] });
    assert.deepEqual([...f.physicalFiles], ['historical-file']);
    assert.equal(notifications.createDocumentNotificationsForOfficialRoles.mock.callCount(), 0);
    assert.equal(audit.recordActivitySafely.mock.callCount(), 0);
  });
}

test('Direct revision endpoint uses project membership, not the claimed actor role', async (t) => {
  const f = fixture(t, { role: 'Document Owner', file: true });
  await assert.rejects(revisions.uploadRevision(f.args), { statusCode: 422 });
  await assert.rejects(revisions.editDocumentAsAdmin(f.args), { statusCode: 403 });
  await assert.rejects(documents.updateDocument(f.args), { statusCode: 403 });
});

test('Concurrent stale revision triggers conflict and discards only the temporary upload', async (t) => {
  const f = fixture(t, { file: true });
  f.args.payload.expectedActiveRevisionId = 'REV-STALE';
  await assert.rejects(documents.updateDocument(f.args), { code: 'REVISION_CONFLICT' });
  assert.equal(uploads.discardTemporaryUpload.mock.callCount(), 1);
  assert.equal(storage.delete.mock.callCount(), 0);
  assert.equal(repo.runInTransaction.mock.callCount(), 0);
});

for (const status of Object.keys(transitions)) {
  test(`HTTP API: real authentication, permissions and Admin isolation for ${status}`, async (t) => {
    const f = fixture(t, { status });
    const targetStatus = transitions[status];
    let role = 'Admin';
    let activeProjectId = 'PRJ-1';
    t.mock.method(auth, 'getAuthenticatedUser', async () => ({
      user: { id: '1', fullName: 'Admin Test' }, officialRole: role, activeProject: { id: activeProjectId },
      permissions: [{ code: role === 'Admin' || role === 'Document Owner' ? 'document-register.edit' : 'document-register.view' }],
    }));
    memberships.findActiveMembershipByProjectAndUser.mock.mockImplementation(async () => ({
      officialRole: role, projectId: 'PRJ-1', userId: '1', username: 'synthetic-uploader', userName: 'Authoritative Full Name',
    }));
    const app = express();
    app.use(express.json(), cookieParser());
    app.use('/documents', require('../../src/routes/document.routes'));
    app.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
      res.status(error.statusCode || 500).json({ message: error.message });
    });
    const server = await new Promise((resolve) => { const running = app.listen(0, '127.0.0.1', () => resolve(running)); });
    t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
    const url = `http://127.0.0.1:${server.address().port}/documents/DOC-1`;
    const request = (payload, path = '', method = 'PATCH') => fetch(url + path, {
      method, headers: { 'Content-Type': 'application/json', Cookie: `${AUTH_COOKIE_NAMES.ACCESS_TOKEN}=${generateAccessToken('1', 'test-session')}` },
      body: JSON.stringify(payload),
    });
    for (role of ['Team Process', 'Team Project', 'Viewer']) {
      assert.equal((await request({ ...f.args.payload, isAdmin: true })).status, 403);
    }
    role = 'Document Owner';
    assert.equal((await request({ ...f.args.payload, temporaryFileId: 'TMP-1', officialRole: 'Admin' })).status, 403);
    assert.equal((await request(f.args.payload, '/revisions', 'POST')).status, 422);
    role = 'Admin'; activeProjectId = 'PRJ-OTHER';
    assert.equal((await request(f.args.payload)).status, 403);
    activeProjectId = 'PRJ-1';
    const response = await request(f.args.payload);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.status, status.endsWith('Comment') ? status : targetStatus);
    assert.equal(f.records.revisions.length, 0);
    const filePayload = { ...f.args.payload, expectedWorkflowStatus: f.doc.status, expectedCurrentAssigneeUserId: f.doc.currentAssigneeUserId, temporaryFileId: 'TMP-1' };
    const uploadResponse = await request(filePayload);
    assert.equal(uploadResponse.status, 200);
    assert.equal((await uploadResponse.json()).data.status, targetStatus);
    assert.equal(f.records.revisions.length, 1);
    const revisionResponse = await request({ ...filePayload, expectedActiveRevisionId: f.doc.activeRevisionId,
      expectedWorkflowStatus: f.doc.status, expectedCurrentAssigneeUserId: f.doc.currentAssigneeUserId }, '/revisions', 'POST');
    assert.equal(revisionResponse.status, 201);
    assert.equal((await revisionResponse.json()).data.status, targetStatus);
    assert.equal(f.records.revisions.length, 2);
  });
}
