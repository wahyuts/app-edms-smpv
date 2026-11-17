const assert = require('node:assert/strict');
const test = require('node:test');
const { resolveRevisionHistoryStages } = require('../../src/utils/revisionHistoryStage');

const fixture = () => {
  const revision = { id: 'R1', documentId: 'D1', projectId: 'P1', revisionSequence: 1,
    sourceStatus: null, resultStatus: 'Process Review', createdByUserId: 1, createdAt: '2026-11-17 06:56:00.000' };
  const upload = { entryId: 'UPLOAD:R1', eventType: 'UPLOAD', revisionId: 'R1', documentId: 'D1', projectId: 'P1',
    documentStage: 'Unknown', actorUsername: 'Unknown', actorRole: 'Admin', eventTimestamp: '2026-11-16T23:56:00.000Z' };
  const approval = { ...upload, entryId: 'APPROVAL_A:C1', eventType: 'APPROVAL_A', stageActorUserId: 2,
    actorRole: 'Team Process', eventTimestamp: '2026-11-17T00:08:00.000Z' };
  const initial = { id: 'H1', projectId: 'P1', documentId: 'D1', workflowEvent: 'Upload Document', activity: 'Upload Document',
    workflowStatus: 'Process Review', revisionLabel: 'IFR-Submitted', createdByUserId: 1, createdAt: '2026-11-17 06:56:00.005' };
  const transition = { ...initial, id: 'H2', workflowEvent: 'Approval A Completed', activity: 'Approval A',
    workflowStatus: 'Project Review', revisionLabel: 'IFA-Submitted', createdByUserId: 2, createdAt: '2026-11-17 07:08:00.000' };
  return { events: [upload, approval], revisions: [revision], history: [initial, transition] };
};

test('COBS-44-shaped history resolves IFR upload then proven IFA Approval A without altering author or inputs', () => {
  const f = fixture(), before = JSON.stringify(f);
  const result = resolveRevisionHistoryStages(f);
  assert.deepEqual(result.map(e => e.documentStage), ['IFR-Submitted', 'IFA-Submitted']);
  assert.ok(result.every(e => e.actorUsername === 'Unknown' && e.revisionId === 'R1'));
  assert.equal(result[1].actorRole, 'Team Process');
  assert.equal(result[1].stageActorUserId, undefined); assert.equal(JSON.stringify(f), before);
});

test('second proven Approval A maps canonical AS-Built to public As-Built', () => {
  const f = fixture();
  f.events.push({ ...f.events[1], entryId: 'APPROVAL_A:C2', stageActorUserId: 3,
    actorRole: 'Team Project', eventTimestamp: '2026-11-17T01:00:00.000Z' });
  f.history.push({ ...f.history[1], id: 'H3', createdByUserId: 3, workflowStatus: 'Approved',
    revisionLabel: 'AS-Built', createdAt: '2026-11-17 08:00:00.000' });
  assert.deepEqual(resolveRevisionHistoryStages(f).map(e => e.documentStage), ['IFR-Submitted', 'IFA-Submitted', 'As-Built']);
});

for (const stage of ['IFR-Submitted', 'IFA-Submitted', 'As-Built', 'AS-Built']) {
  test(`valid snapshot has precedence without history: ${stage}`, () => {
    const f = fixture(); f.events = [{ ...f.events[1], documentStage: stage }]; f.history = [];
    assert.equal(resolveRevisionHistoryStages(f)[0].documentStage, stage === 'AS-Built' ? 'As-Built' : stage);
  });
}

test('invalid snapshot can resolve only through independently proven history', () => {
  const f = fixture(); f.events.forEach(e => { e.documentStage = 'invalid'; });
  assert.deepEqual(resolveRevisionHistoryStages(f).map(e => e.documentStage), ['IFR-Submitted', 'IFA-Submitted']);
});

test('repeated uploads use complete sequence/history bijection and recorded source/result states, not nearest time', () => {
  const f = fixture(); f.events = [{ ...f.events[0], documentStage: 'IFR-Submitted' }];
  for (let i = 2; i <= 3; i++) {
    f.revisions.push({ ...f.revisions[0], id: `R${i}`, revisionSequence: i, sourceStatus: 'Process Review',
      createdAt: `2026-11-17 07:0${i}:00.000` });
    f.events.push({ ...f.events[0], entryId: `UPLOAD:R${i}`, revisionId: `R${i}`, documentStage: 'Unknown' });
  }
  f.history = [f.history[0], ...f.revisions.slice(1).map((r, i) => ({ ...f.history[0], id: `U${i}`,
    activity: 'Upload Revision', workflowEvent: 'Upload Revision Completed', createdAt: r.createdAt }))];
  assert.deepEqual(resolveRevisionHistoryStages(f).map(e => e.documentStage), ['IFR-Submitted', 'IFR-Submitted', 'IFR-Submitted']);
});

const invalidCases = {
  'history missing': f => { f.history = []; },
  'actor missing': f => { f.events[1].stageActorUserId = null; },
  'role alone cannot prove stage': f => { f.history.pop(); },
  'cross-project history': f => { f.history.forEach(h => { h.projectId = 'P2'; }); },
  'cross-document history': f => { f.history.forEach(h => { h.documentId = 'D2'; }); },
  'actor mismatch': f => { f.history[1].createdByUserId = 99; },
  'duplicate history candidate': f => { f.history.push({ ...f.history[1], id: 'DUPLICATE' }); },
  'timestamp tie': f => { f.history.push({ ...f.history[1], id: 'TIE', activity: 'Edit Document' }); },
  'invalid target stage': f => { f.history[1].revisionLabel = null; },
  'invalid transition': f => { f.history[1].workflowStatus = 'Approved'; },
  'wrong previous state': f => { f.history[0].workflowStatus = 'Process Reject'; },
  'revision association mismatch': f => { f.events[1].revisionId = 'OTHER'; },
  'sequence gap': f => { f.revisions[0].revisionSequence = 2; },
  'invalid revision time': f => { f.revisions[0].createdAt = null; },
  'history predates revision': f => { f.revisions[0].createdAt = '2026-11-17 09:00:00.000'; },
  'approval occurred after next revision': f => { f.revisions.push({ ...f.revisions[0], id: 'R2', revisionSequence: 2,
    createdAt: '2026-11-17 07:00:00.000' }); },
  'initial upload stage contradicts create event': f => { f.history[0].revisionLabel = 'IFA-Submitted'; },
};
for (const [name, change] of Object.entries(invalidCases)) test(`ambiguous evidence fails closed: ${name}`, () => {
  const f = fixture(); change(f);
  assert.throws(() => resolveRevisionHistoryStages(f), { code: 'HISTORICAL_STAGE_UNVERIFIED', statusCode: 409 });
});

test('repeated Approval A cycles preserve distinct revision/actor identity and chronological transitions', () => {
  const f = fixture(); f.events[0].documentStage = 'IFR-Submitted';
  f.revisions.push({ ...f.revisions[0], id: 'R2', revisionSequence: 2, sourceStatus: 'Process Reject',
    createdAt: '2026-11-17 08:00:00.000' });
  f.history.push({ ...f.history[0], id: 'REJECT', activity: 'Approval C', workflowEvent: 'Approval C Completed',
    workflowStatus: 'Process Reject', createdAt: '2026-11-17 07:59:00.000' },
  { ...f.history[0], id: 'UPLOAD2', activity: 'Upload Revision', workflowEvent: 'Upload Revision Completed', createdAt: '2026-11-17 08:00:00.001' },
  { ...f.history[1], id: 'APPROVE2', createdAt: '2026-11-17 08:08:00.000' });
  f.events.push({ ...f.events[1], entryId: 'APPROVAL_A:C2', revisionId: 'R2', eventTimestamp: '2026-11-17T01:08:00.000Z' });
  assert.deepEqual(resolveRevisionHistoryStages(f).map(e => e.documentStage), ['IFR-Submitted', 'IFA-Submitted', 'IFA-Submitted']);
});
