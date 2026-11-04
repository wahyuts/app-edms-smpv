const assert = require('node:assert/strict');
const test = require('node:test');
const { fixture, deferred } = require('../helpers/isolatedDocumentCoordination.cjs');

const scope = { projectId: 'P1', documentId: 'D1', type: 'UPLOAD_REVISION' };
const reservation = (f, identity = 'request-1', documentId = 'D1', projectId = 'P1') => f.service.reserveDelete({
  activeProject: { id: projectId }, actorUserId: 1, documentId, requestIdentity: identity,
});
const conflict = (error) => error.statusCode === 409 && error.code === 'DOCUMENT_DELETION_IN_PROGRESS';

test('cancelled operation cannot be reserved again or reconfirmed, while new normal writers remain admitted', async () => {
  const f = fixture(); const op = await reservation(f);
  Object.assign(f.state.operations.get(op.id), { pending_metadata: JSON.stringify({ reservationRecovery: { state: 'CANCELLED_BEFORE_IO' } }) });
  Object.assign(f.state.gates.get('P1:D1'), { gate_state: 'OPEN', delete_operation_id: null, generation: 2 });
  await assert.rejects(reservation(f), error => error.code === 'DELETE_RESERVATION_CANCELLED');
  await assert.rejects(f.repository.evaluateQuiescence(op.id), error => error.code === 'DELETE_RESERVATION_CANCELLED');
  await f.service.assertReadable(scope);
  for (const type of ['EDIT_DOCUMENT','UPLOAD_REVISION','APPROVAL','WORKFLOW_ATTACHMENT','COMMENT_READ','ARCHIVE_DOCUMENT','RESTORE_DOCUMENT','SLA']) {
    await f.service.runWriter({ ...scope, type }, async () => {
      await f.service.mutate(scope, c => c.execute('TEST MUTATION'));
      f.service.noteDbOutcome('COMMITTED');
    });
  }
  assert.equal(f.state.operations.size, 1); assert.equal(f.state.gates.get('P1:D1').gate_state, 'OPEN');
});

test('permanent storage facade cannot bypass writer admission', async () => {
  const f = fixture(); let calls = 0;
  f.driver.copy = async () => { calls += 1; };
  await assert.rejects(f.storage.copy('source', 'target'), /requires writer admission/);
  assert.equal(calls, 0);
  assert.equal(f.state.io.size, 0);
});

test('admitted writer drains SQL, IO and post-commit processing while new admission/read is rejected', async () => {
  const f = fixture(); const started = deferred(); const proceed = deferred();
  const writer = f.service.runWriter(scope, async () => {
    started.resolve(); await proceed.promise;
    await f.storage.finalize('temporary/T/input.pdf', 'projects/P/documents/D/file.pdf');
    await f.service.mutate(scope, (c) => c.execute('TEST MUTATION'));
    f.service.noteDbOutcome('COMMITTED');
    await f.service.assertReadable(scope);
  });
  await started.promise;
  const operation = await reservation(f);
  assert.equal((await f.service.evaluateQuiescence(operation.id)).status, 'QUIESCENCE_PENDING');
  await assert.rejects(f.service.runWriter(scope, async () => {}), conflict);
  await assert.rejects(f.service.assertReadable(scope), conflict);
  proceed.resolve(); await writer;
  assert.equal((await f.service.evaluateQuiescence(operation.id)).status, 'QUIESCENCE_CONFIRMED');
  assert.ok(f.state.trace.includes('MUTATION'));
});

for (const first of ['writer', 'reservation']) test(`atomic simultaneous admission ordering: ${first} first`, async () => {
  const f = fixture(); const end = deferred(); const entered = deferred();
  if (first === 'writer') {
    const writer = f.service.runWriter(scope, async () => { entered.resolve(); await end.promise; });
    await entered.promise;
    const operation = await reservation(f);
    assert.equal((await f.service.evaluateQuiescence(operation.id)).status, 'QUIESCENCE_PENDING');
    end.resolve(); await writer;
  } else {
    await reservation(f);
    await assert.rejects(f.service.runWriter(scope, async () => assert.fail('must not run')), conflict);
  }
});

test('concurrent Admin requests create one operation; same identity is idempotent', async () => {
  const f = fixture();
  const results = await Promise.all([reservation(f), reservation(f)]);
  assert.equal(results[0].id, results[1].id);
  assert.equal(f.state.operations.size, 1);
  await assert.rejects(reservation(f, 'different-request'), conflict);
});

for (const role of ['Document Owner', 'Team Process', 'Team Project', 'Viewer', null]) {
  test(`reservation rejects role ${role}`, async () => {
    const f = fixture({ role });
    await assert.rejects(reservation(f), (error) => error.statusCode === 403);
    assert.equal(f.state.operations.size, 0);
  });
}
test('reservation rejects unauthenticated and cross-project requests', async () => {
  const f = fixture();
  await assert.rejects(f.service.reserveDelete({ documentId: 'D1' }), (e) => e.statusCode === 401);
  await assert.rejects(reservation(f, 'req', 'D1', 'P2'), (e) => e.statusCode === 403);
});

test('intent is durable with exact keys before adapter invocation, including compensation', async () => {
  const f = fixture();
  f.driver.move = async (source, destination) => {
    assert.ok([...f.state.io.values()].some((io) => io.source_key === source && io.destination_key === destination && io.state === 'IN_FLIGHT'));
  };
  await f.service.runWriter(scope, async () => {
    await f.storage.move('legacy/outside-prefix.pdf', 'projects/P/new.pdf');
    await f.storage.move('projects/P/new.pdf', 'legacy/outside-prefix.pdf');
  });
  assert.equal(f.state.io.size, 2);
  assert.equal([...f.state.writers.values()][0].lifecycle_state, 'SETTLED');
});

for (const kind of ['R2 timeout', 'MySQL disconnect', 'DB rollback', 'local partial failure']) {
  test(`${kind} does not prove storage settled; late completion cannot release reservation`, async () => {
    const f = fixture({ provider: kind === 'local partial failure' ? 'local' : 'r2' });
    let lateObject = false;
    f.driver.copy = async () => { throw Object.assign(new Error(kind), { code: 'UNKNOWN_OUTCOME' }); };
    await assert.rejects(f.service.runWriter(scope, async () => {
      try { await f.storage.copy('legacy/source', 'legacy/destination'); }
      finally { f.service.noteDbOutcome(kind === 'DB rollback' ? 'ROLLED_BACK' : 'UNKNOWN'); }
    }));
    lateObject = true; // Provider may complete after the rejected RPC/rollback.
    const operation = await reservation(f);
    assert.equal((await f.service.evaluateQuiescence(operation.id)).status, 'QUIESCENCE_PENDING');
    assert.equal([...f.state.io.values()][0].state, 'UNKNOWN');
    assert.ok(lateObject);
    assert.ok(!f.state.trace.some((sql) => /HEAD|LIST/.test(sql)));
  });
}

test('intent persistence failure prevents IO; completion failure leaves unresolved evidence', async () => {
  const f = fixture({ failRecordIo: true }); let calls = 0;
  f.driver.copy = async () => { calls += 1; };
  await assert.rejects(f.service.runWriter(scope, () => f.storage.copy('source', 'target')));
  assert.equal(calls, 0);
  const g = fixture({ failFinishIo: true });
  await g.service.runWriter(scope, () => g.storage.copy('source', 'target'));
  assert.equal([...g.state.writers.values()][0].lifecycle_state, 'UNRESOLVED');
});

test('suppressed compensation failure still leaves the durable writer unresolved', async () => {
  const f = fixture();
  f.driver.delete = async () => { throw new Error('Unknown compensation outcome'); };
  await f.service.runWriter(scope, async () => {
    await f.storage.copy('temporary/source', 'projects/target');
    f.service.noteDbOutcome('ROLLED_BACK');
    await f.storage.delete('projects/target').catch(() => {});
  });
  assert.equal([...f.state.writers.values()][0].lifecycle_state, 'UNRESOLVED');
  assert.equal([...f.state.io.values()].filter((io) => io.state === 'UNKNOWN').length, 1);
  const operation = await reservation(f);
  assert.equal((await f.service.evaluateQuiescence(operation.id)).status, 'QUIESCENCE_PENDING');
});

test('writer completion persistence failure and process restart preserve pending state', async () => {
  const f = fixture({ failFinishWriter: true });
  await f.service.runWriter(scope, () => f.storage.copy('source', 'target'));
  const operation = await reservation(f);
  const restarted = fixture(f.state);
  assert.equal((await restarted.service.evaluateQuiescence(operation.id)).status, 'QUIESCENCE_PENDING');
  assert.equal([...f.state.writers.values()][0].lifecycle_state, 'ACTIVE');
});

test('crash with in-flight IO remains pending after a new service instance is loaded', async () => {
  const f = fixture();
  await f.repository.admitWriter({ ...scope, id: 'crashed-writer' });
  await f.repository.recordIo({ id: 'in-flight', writerId: 'crashed-writer', provider: 'r2', type: 'COPY', sourceKey: 'source', destinationKey: 'target' });
  const operation = await reservation(f);
  assert.equal((await fixture(f.state).service.evaluateQuiescence(operation.id)).status, 'QUIESCENCE_PENDING');
});

test('SQL COMMIT acknowledgement loss prevents writer settlement', async () => {
  const f = fixture();
  await assert.rejects(f.service.runWriter(scope, () => f.service.mutate(scope, async (c) => {
    c.failCommit = true; await c.execute('TEST MUTATION');
  })));
  assert.equal([...f.state.writers.values()][0].db_outcome, 'UNKNOWN');
  assert.equal([...f.state.writers.values()][0].lifecycle_state, 'UNRESOLVED');
});

test('closed lifecycle token cannot initiate delayed SQL or storage work', async () => {
  const f = fixture(); const delayed = deferred(); let continuation;
  await f.service.runWriter(scope, async () => {
    continuation = delayed.promise.then(async () => {
      await assert.rejects(f.storage.copy('source', 'target'), conflict);
      await assert.rejects(f.service.mutate(scope, (c) => c.execute('TEST MUTATION')), conflict);
    });
  });
  const operation = await reservation(f);
  assert.equal((await f.service.evaluateQuiescence(operation.id)).status, 'QUIESCENCE_CONFIRMED');
  delayed.resolve(); await continuation;
  assert.equal(f.state.io.size, 0);
});

test('temporary cleanup cannot claim a source while finalizer is active', async () => {
  const f = fixture(); const started = deferred(); const end = deferred();
  const writer = f.service.runWriter({ ...scope, temporaryFileId: 'T1' }, async () => { started.resolve(); await end.promise; });
  await started.promise;
  await assert.rejects(f.service.runWriter({ type: 'TEMPORARY_CLEANUP', temporaryFileId: 'T1' }, async () => assert.fail()),
    (e) => e.code === 'TEMPORARY_UPLOAD_IN_USE' && e.statusCode === 409);
  end.resolve(); await writer;
  await f.service.runWriter({ type: 'TEMPORARY_CLEANUP', temporaryFileId: 'T1' }, async () => {});
});

test('other documents and projects remain operational', async () => {
  const f = fixture(); await reservation(f);
  await f.service.runWriter({ ...scope, documentId: 'D2' }, () => f.storage.copy('source', 'D2'));
  await f.service.runWriter({ ...scope, projectId: 'P2' }, () => f.storage.copy('source', 'P2'));
  await f.service.assertReadable({ projectId: 'P1', documentId: 'D2' });
});

for (const type of ['UPLOAD_REVISION', 'APPROVAL', 'WORKFLOW_ATTACHMENT', 'EDIT_DOCUMENT']) {
  test(`existing writer entry wrapper ${type} rejects after reservation`, async () => {
    const f = fixture(); await reservation(f);
    const wrapped = f.service.documentWriter(async () => assert.fail('business action must not run'), type);
    await assert.rejects(wrapped({ documentId: 'D1', actorUserId: 1, payload: {} }), conflict);
  });
}

test('Approval attachment claims the top-level temporaryFileId before its handler runs', async () => {
  const f = fixture();
  const wrapped = f.service.documentWriter(async () => {
    assert.equal([...f.state.writers.values()][0].temporary_file_id, 'TOP-LEVEL-TEMP');
  }, 'APPROVAL');
  await wrapped({ documentId: 'D1', actorUserId: 1, temporaryFileId: 'TOP-LEVEL-TEMP' });
});

test('Admin edit delegation is single-use and cannot initiate a second business operation', async () => {
  const f = fixture(); let calls = 0;
  const delegate = f.service.documentWriter(async () => { calls += 1; }, 'ADMIN_EDIT');
  const root = f.service.documentWriter(async (args) => {
    await assert.rejects(delegate({ ...args, payload: { another: 'operation' } }), conflict);
    await delegate(args);
    await assert.rejects(delegate(args), conflict);
  }, 'EDIT_DOCUMENT');
  await root({ documentId: 'D1', actorUserId: 1, payload: {} });
  assert.equal(calls, 1);
});

test('unawaited storage continuation keeps durable writer unresolved even after the IO later succeeds', async () => {
  const f = fixture(); const started = deferred(); const end = deferred(); let io;
  f.driver.copy = async () => { started.resolve(); await end.promise; };
  await f.service.runWriter(scope, async () => {
    io = f.storage.copy('source', 'destination');
    await started.promise;
  });
  assert.equal([...f.state.writers.values()][0].lifecycle_state, 'UNRESOLVED');
  end.resolve(); await io;
  const operation = await reservation(f);
  assert.equal((await f.service.evaluateQuiescence(operation.id)).status, 'QUIESCENCE_PENDING');
});

test('unawaited SQL continuation is not treated as durable completion evidence', async () => {
  const f = fixture(); const started = deferred(); const end = deferred(); let sql;
  const writer = f.service.runWriter(scope, async () => {
    sql = f.service.mutate(scope, async (c) => {
      started.resolve(); await end.promise;
      await c.execute('TEST MUTATION');
    });
    await started.promise;
  });
  await started.promise;
  await new Promise(setImmediate);
  end.resolve(); await sql; await writer;
  assert.equal([...f.state.writers.values()][0].lifecycle_state, 'UNRESOLVED');
});

test('quiescence confirmation is monotonic and records immutable completion evidence', async () => {
  const f = fixture(); const operation = await reservation(f);
  const first = await f.service.evaluateQuiescence(operation.id);
  const second = await f.service.evaluateQuiescence(operation.id);
  assert.equal(first.status, 'QUIESCENCE_CONFIRMED');
  assert.equal(second.status, 'QUIESCENCE_CONFIRMED');
  assert.equal(JSON.stringify(first.evidence), JSON.stringify(second.evidence));
  await assert.rejects(f.service.runWriter(scope, async () => {}), conflict);
});

test('one occupied business connection does not starve independent storage evidence persistence', { timeout: 3000 }, async () => {
  const f = fixture({ businessLimit: 1, evidenceLimit: 1 });
  const started = deferred(); const proceed = deferred();
  const writer = f.service.runWriter(scope, async () => {
    const c = await f.pool.getConnection();
    try {
      await c.beginTransaction();
      await f.service.guardTransaction(c);
      started.resolve(); await proceed.promise;
      await f.storage.copy('source', 'destination');
      await c.commit();
    } finally { c.release(); }
  });
  await started.promise;
  // This request originates outside the admitted writer's async context.
  const queued = f.service.runWriter({ ...scope, documentId: 'D2' }, async () => {});
  proceed.resolve(); await Promise.all([writer, queued]);
  assert.equal(f.evidencePool.stats.maxActive, 1);
  assert.equal(f.pool.stats.maxActive, 1);
});

for (const status of ['Process Review', 'Process Comment', 'Process Reject', 'Project Review', 'Project Comment', 'Project Reject', 'Approved', 'Archived']) {
  test(`reservation has no workflow/SLA restriction: ${status}`, async () => {
    const f = fixture();
    const original = f.documents.findDocumentFoundationById;
    f.documents.findDocumentFoundationById = async (id) => ({ ...await original(id),
      status: status === 'Archived' ? 'Approved' : status,
      lifecycle: status === 'Archived' ? 'Archived' : 'Active', slaStartedAt: null });
    assert.equal((await reservation(f)).status, 'QUIESCENCE_PENDING');
    assert.equal(f.state.io.size, 0);
  });
}
