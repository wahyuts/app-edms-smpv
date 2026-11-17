const { createHttpError } = require('./administration');

const normalizeHistoryStage = value => {
  const stage = value === 'AS-Built' ? 'As-Built' : value;
  return ['IFR-Submitted', 'IFA-Submitted', 'As-Built'].includes(stage) ? stage : null;
};

// Revision/history DATETIMEs share the database clock. Compare their recorded
// order only; never match by nearest timestamp or compare them to UTC comments.
const orderTime = value => {
  if (typeof value === 'string' && /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d(?:\.\d+)?$/.test(value)) {
    return Date.parse(`${value.replace(' ', 'T')}Z`);
  }
  return value == null ? NaN : new Date(value).getTime();
};

const resolveRevisionHistoryStages = ({ events, revisions, history = [] }) => {
  const fail = event => {
    throw createHttpError('Tahap historis dokumen belum dapat diverifikasi.', 409,
      [{ field: 'documentStage', message: 'Bukti transisi historis tidak lengkap atau ambigu.' }],
      { code: 'HISTORICAL_STAGE_UNVERIFIED', data: { entryId: event.entryId } });
  };
  const sameActor = (left, right) => left != null && right != null && String(left) === String(right);
  const clean = (event, stage) => {
    const { stageActorUserId, ...publicEvent } = event;
    void stageActorUserId;
    return { ...publicEvent, documentStage: stage };
  };

  return events.map(event => {
    const snapshot = normalizeHistoryStage(event.documentStage);
    if (snapshot) return clean(event, snapshot);

    const scoped = row => row.projectId === event.projectId && row.documentId === event.documentId;
    const sequence = revisions.filter(scoped).slice().sort((a, b) => a.revisionSequence - b.revisionSequence);
    const revision = sequence.find(row => row.id === event.revisionId);
    const timeline = history.filter(scoped).slice().sort((a, b) => orderTime(a.createdAt) - orderTime(b.createdAt));
    if (!revision || !timeline.length || sequence.some((row, i) =>
      row.revisionSequence !== i + 1 || !Number.isFinite(orderTime(row.createdAt)) ||
      (i > 0 && orderTime(sequence[i - 1].createdAt) >= orderTime(row.createdAt))) ||
      timeline.some(row => !Number.isFinite(orderTime(row.createdAt)))) fail(event);

    let matching;
    let candidates;
    if (event.eventType === 'UPLOAD') {
      const initial = revision.revisionSequence === 1;
      matching = sequence.filter(row => (row.revisionSequence === 1) === initial &&
        sameActor(row.createdByUserId, revision.createdByUserId) && row.resultStatus === revision.resultStatus);
      candidates = timeline.filter(row => sameActor(row.createdByUserId, revision.createdByUserId) &&
        row.activity === (initial ? 'Upload Document' : 'Upload Revision') &&
        row.workflowEvent === (initial ? 'Upload Document' : 'Upload Revision Completed') &&
        row.workflowStatus === revision.resultStatus);
    } else if (event.eventType === 'APPROVAL_A') {
      matching = events.filter(row => scoped(row) && row.eventType === 'APPROVAL_A' &&
        sameActor(row.stageActorUserId, event.stageActorUserId))
        .slice().sort((a, b) => orderTime(a.eventTimestamp) - orderTime(b.eventTimestamp));
      if (matching.some((row, i) => !Number.isFinite(orderTime(row.eventTimestamp)) ||
        (i > 0 && orderTime(matching[i - 1].eventTimestamp) >= orderTime(row.eventTimestamp)))) fail(event);
      candidates = timeline.filter(row => row.workflowEvent === 'Approval A Completed' &&
        row.activity === 'Approval A' && sameActor(row.createdByUserId, event.stageActorUserId));
    } else fail(event);

    const index = event.eventType === 'UPLOAD' ? matching.indexOf(revision) : matching.indexOf(event);
    const target = candidates[index];
    if (index < 0 || matching.length !== candidates.length || !target) fail(event);
    const targetTime = orderTime(target.createdAt);
    const stage = normalizeHistoryStage(target.revisionLabel);
    const revisionIndex = sequence.indexOf(revision);
    const nextRevision = sequence[revisionIndex + 1];
    const previous = timeline[timeline.indexOf(target) - 1];
    // A complete actor-scoped bijection plus revision sequence, recorded source /
    // result state and active-revision window must all agree. Ties fail closed.
    if (!stage || timeline.filter(row => orderTime(row.createdAt) === targetTime).length !== 1 ||
      targetTime < orderTime(revision.createdAt) ||
      (nextRevision && targetTime >= orderTime(nextRevision.createdAt))) fail(event);

    if (event.eventType === 'UPLOAD') {
      if (revision.revisionSequence === 1) {
        if (revision.sourceStatus != null || revision.resultStatus !== 'Process Review' || stage !== 'IFR-Submitted') fail(event);
      } else if (previous?.workflowStatus !== revision.sourceStatus) fail(event);
    } else {
      const processTransition = previous?.workflowStatus === 'Process Review' &&
        target.workflowStatus === 'Project Review' && stage === 'IFA-Submitted';
      const projectTransition = previous?.workflowStatus === 'Project Review' &&
        target.workflowStatus === 'Approved' && stage === 'As-Built';
      if (!processTransition && !projectTransition) fail(event);
    }
    return clean(event, stage);
  });
};

module.exports = { normalizeHistoryStage, resolveRevisionHistoryStages };
