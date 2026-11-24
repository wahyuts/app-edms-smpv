const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader } = require('../helpers/approvalEmailLoader');
const root = path.resolve(__dirname, '../../../..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const prefix = 'database/migration/20261124_0001_response_to_approval_b_';

// Parse only the reviewed boolean CHECK grammar; reject all other tokens/operators.
const parse = input => {
  const tokens = input.match(/'(?:''|[^'])*'|[a-z_]+|[0-9]+|[(),=]/gi);
  assert.equal(tokens.join(''), input.replace(/\s+(?=(?:[^']*'[^']*')*[^']*$)/g, ''));
  let i = 0;
  const take = word => tokens[i]?.toUpperCase() === word && (++i > 0);
  const need = word => assert.ok(take(word), `Expected ${word}, got ${tokens[i]}`);
  const atom = () => {
    if (take('(')) { const e = or(); need(')'); return e; }
    const token = tokens[i++];
    if (token.toUpperCase() === 'CHAR_LENGTH') { need('('); const arg = atom(); need(')'); return row => arg(row)?.length ?? null; }
    if (token.startsWith("'")) return () => token.slice(1, -1).replaceAll("''", "'");
    if (/^\d+$/.test(token)) return () => Number(token);
    return row => row[token] ?? null;
  };
  const predicate = () => {
    const left = atom();
    if (take('IS')) { const not = take('NOT'); need('NULL'); return row => (left(row) === null) !== Boolean(not); }
    if (take('IN')) { need('('); const list = [atom()]; while (take(',')) list.push(atom()); need(')');
      return row => left(row) === null ? null : list.some(value => value(row) === left(row)); }
    if (take('=')) { const right = atom(); return row => left(row) === null || right(row) === null ? null : left(row) === right(row); }
    return left;
  };
  const and = () => { let left = predicate(); while (take('AND')) { const a = left, b = predicate();
    left = row => a(row) === false || b(row) === false ? false : a(row) === null || b(row) === null ? null : true; } return left; };
  const or = () => { let left = and(); while (take('OR')) { const a = left, b = and();
    left = row => a(row) === true || b(row) === true ? true : a(row) === null || b(row) === null ? null : false; } return left; };
  const result = or(); assert.equal(i, tokens.length); return result;
};

const harness = require('../helpers/responseMigrationSqlHarness.cjs');
const evidence = JSON.parse(read('apps/backend/tests/fixtures/response-approval-b-railway-checks.json'));
const BT = String.fromCharCode(96);

for (const engine of ['mariadb', 'mysql']) {
  const migration = read(prefix + engine + '.sql');
  const pre = read(prefix + engine + '_preflight_readonly.sql');
  const post = read(prefix + engine + '_postflight_readonly.sql');
  const guard = harness.template(migration);
  const actualDdl = harness.ddl(migration);
  const action = actualDdl.match(/workflow_action CHECK \((.*?)\),\n/)[1];
  const emergency = actualDdl.slice(actualDdl.indexOf('emergency_request CHECK (') + 'emergency_request CHECK ('.length, -1);
  const validAction = parse(action), validRequest = parse(emergency);
  test(engine + ': identifier and target-context controls remain fixed across client database switches', () => {
    const version = engine === 'mysql' ? '9.7.4' : '10.4.32-MariaDB';
    assert.equal(harness.context(migration, 'target_test', { version }).ready, true);
    for (const target of [null, '', '__SET_TARGET_SCHEMA__', 'mysql', 'information_schema', 'sys', 'performance_schema',
      'other_schema', 'target.test', 'target test', 'x\n', "x';SELECT 1;--", 'x`', 'x'.repeat(65), '\u00e9']) {
      const state = harness.context(migration, target, { version });
      assert.equal(state.ready, false, String(target));
    }
    assert.equal(harness.context(migration, 'target_test', { version:'8.0.0' }).ready, false);
    assert.equal(harness.context(migration, 'target_test', { version, table:false }).ready, false);
    for (const source of [pre, post]) {
      const state = harness.context(source, 'target_test', { version });
      for (const clientSchema of ['target_test', 'information_schema', 'unrelated_schema']) {
        const vars = { '@rb_target':state.target, '@rb_ident':state.ident, '@rb_ready':1,
          '@rb_guard_template':harness.template(source), '@rb_context_status':'STOP' };
        for (const s of harness.statements(source).filter(s => s.startsWith('SET @rb_sql = IF(@rb_ready'))) {
          const query = harness.scalar(s.slice('SET @rb_sql = '.length), vars);
          assert.doesNotMatch(query, /DATABASE\(\)/, clientSchema);
          if (/SHOW CREATE TABLE|COUNT\(\*\) AS comment_count|row_content_hex|^WITH /.test(query))
            assert.ok(query.includes('`target_test`.`workflow_comments`'), clientSchema);
        }
      }
    }
  });
  test(engine + ': identical explicit-target guard, indexes, columns, CHECK/FK/data validation in all three files', () => {
    assert.equal(guard, harness.template(pre)); assert.equal(guard, harness.template(post));
    assert.doesNotMatch(guard, /DATABASE\(\)/);
    assert.match(guard, /FROM __RB_TABLE__/);
    assert.match(guard, /anchor_columns_ok = 9 AND index_columns_ok = 6/);
    assert.match(guard, /incompatible_fk_count = 0 AND incompatible_rows = 0/);
    assert.match(guard, /check_count = 4/);
    for (const source of [pre, post, migration]) {
      const top = harness.statements(source);
      assert.match(top[0], /@rb_target = NULL/);
      const configuredTargets=[...source.matchAll(/^SET @rb_target = '([^']+)';$/gm)];
      assert.equal(configuredTargets.length,1,'Exactly one editable operator target assignment');
      assert.match(configuredTargets[0][1],/^[A-Za-z0-9_]+$/);
      assert.doesNotMatch(source.replace(configuredTargets[0][0],'').replace(/--[^\n]*/g, ''), /\bUSE\s+|edms_smpv_dev|edms_db|SET\s+(?:GLOBAL|SESSION)/i);
      assert.match(source, /BINARY SCHEMA_NAME = BINARY @rb_target/);
      assert.doesNotMatch(source, /BINARY @rb_target (?:NOT )?REGEXP/);
      assert.ok(source.includes("REPLACE(@rb_target,'" + BT + "','" + BT + BT + "')"));
      assert.doesNotMatch(source.replace(/--[^\n]*/g, ''), /FROM workflow_comments|ALTER TABLE workflow_comments|SHOW CREATE TABLE workflow_comments/);
      assert.equal((source.match(/DATABASE\(\) AS client_selected_schema/g) || []).length, 1);
    }
    for (const source of [pre, post]) {
      const code = source.replace(/--[^\n]*/g, '');
      assert.doesNotMatch(code, /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|CALL|INTO OUTFILE|INTO DUMPFILE|SLEEP|BENCHMARK)\b/i);
      for (const statement of harness.statements(source)) assert.match(statement, /^(?:SET |SELECT |PREPARE |EXECUTE |DEALLOCATE PREPARE )/);
      assert.match(source, /STOP_UNVERIFIED_CHECK_REPRESENTATION/);
      assert.match(source, /row_content_hex/);
    }
    assert.equal((actualDdl.match(/ALTER TABLE/g) || []).length, 1);
    assert.equal((actualDdl.match(/DROP (?:CHECK|CONSTRAINT) chk_/g) || []).length, 2);
    assert.equal((actualDdl.match(/ADD CONSTRAINT chk_/g) || []).length, 2);
    assert.doesNotMatch(actualDdl, /ADD COLUMN|ADD INDEX|DROP TABLE|INSERT INTO|DELETE FROM/);
  });
  test(engine + ': original branches, canonical expanded definitions and NULL semantics are preserved', () => {
    const oldDdl = read('database/migration/20261123_0001_emergency_workflow_attachment_' + engine + '.sql')
      .match(/ADD CONSTRAINT chk_workflow_comments_emergency_request CHECK \(([\s\S]*?)\)',\r?\n 'SELECT/)[1].replaceAll("''", "'");
    const oldRequest = parse(oldDdl);
    for (const workflow_action of ['Approval A','Approval B','Approval C','Emergency Workflow Attachment','invalid',null])
      for (const request_fingerprint of [null,'', 'x'.repeat(63),'x'.repeat(64),'x'.repeat(65)])
        for (const approval_target_stage_snapshot of [null,'IFA-Submitted','AS-Built'])
          for (const revision_id of [null,'R']) {
            const row = { workflow_action, request_fingerprint, approval_target_stage_snapshot, revision_id };
            assert.equal(validRequest(row), oldRequest(row), JSON.stringify(row));
          }
    for (const workflow_action of ['Approval A','Approval B','Approval C','Emergency Workflow Attachment','Response to Approval B'])
      assert.equal(validAction({ workflow_action }), true);
    assert.equal(validAction({ workflow_action:'Response to Approval A' }), false);
    assert.equal(validRequest({ workflow_action:'Response to Approval B' }), true);
    for (const patch of [{ request_fingerprint:'x'.repeat(64) }, { approval_target_stage_snapshot:'AS-Built' }])
      assert.equal(validRequest({ workflow_action:'Response to Approval B', ...patch }), false);
    if (engine === 'mysql') assert.doesNotMatch(emergency, /revision_id/);
    else assert.match(emergency, /revision_id IS NULL/);
    for (const env of engine === 'mysql' ? ['staging','prod'] : ['dev']) {
      const schema = read('database/schema/schema-' + env + '.sql');
      assert.ok(schema.includes('workflow_action CHECK (' + action + ')'));
      assert.ok(schema.includes('emergency_request CHECK (' + emergency + ')'));
    }
  });
  test(engine + ': finite exact allowlist rejects modified operators, actions, predicates and unknown spelling', () => {
    const hexes = [...guard.matchAll(/SELECT 'chk_workflow_comments_[^']+', '(?:BASELINE|EXPANDED)', '([0-9A-F]+)'/g)].map(m => m[1]);
    assert.ok(hexes.length > 20);
    for (const hex of hexes) {
      const clause = Buffer.from(hex, 'hex').toString('utf8');
      for (const invalid of [clause + ' OR 1=1', clause.replace('Approval B','Approval X'), clause.replace('IS NULL','IS NOT NULL')])
        if (invalid !== clause) assert.ok(!hexes.includes(Buffer.from(invalid).toString('hex').toUpperCase()));
    }
  });
  for (const [name, options] of [
    ['baseline',{}], ['already applied',{ matches:{ baseline_matches:2, expanded_matches:4 } }],
    ['unknown CHECK',{ matches:{ baseline_matches:1 } }], ['missing CHECK',{ facts:{check_count:3} }],
    ['unexpected CHECK',{ facts:{check_count:5} }], ['partial migration',{ matches:{baseline_matches:2,expanded_matches:2} }],
    ['disabled CHECK',{matches:{baseline_matches:0,expanded_matches:0}}], ['wrong engine',{ready:false}],
    ['missing/invalid target',{ready:false}], ['missing target table',{facts:{table_ok:0}}],
    ['wrong schema with no compatible table',{ready:false}], ['incompatible FK',{facts:{incompatible_fk_count:1}}],
    ['missing FK',{facts:{fk_matches:3}}], ['incompatible rows',{facts:{incompatible_rows:1}}],
    ['wrong column default/type',{facts:{columns_ok:3}}], ['missing snapshot',{facts:{anchor_columns_ok:8}}],
    ['missing/changed index',{facts:{index_columns_ok:5}}],
    ['guard SQL fails',{guardFailure:true}], ['guard preparation fails',{prepareFailure:true}],
    ['DDL preparation fails without reusing old prepared ALTER',{prepareDdlFailure:true}],
    ['guard SQL assignment fails',{assignmentFailure:true}],
  ]) test(engine + ': actual session/prepare control flow, client continues after errors: ' + name, () => {
    const result = harness.migrate(migration, options);
    assert.equal(result.mutations.length, name === 'baseline' ? 1 : 0);
    assert.equal(result.prepared.size, 0);
    assert.ok(!result.vars['@rb_ddl'].includes('ALTER TABLE'), 'DDL permission is consumed/reset');
    if (name === 'baseline') assert.ok(result.mutations[0].startsWith('ALTER TABLE ' + BT + 'target_test' + BT + '.' + BT + 'workflow_comments' + BT));
  });
}

test('Owner Railway HEX evidence identifies three baseline misses; DDL and metadata agree', () => {
  const guard = harness.template(read(prefix + 'mysql_preflight_readonly.sql'));
  for (const row of evidence.checks) {
    assert.equal(row.enforced, 'YES');
    const decoded = Buffer.from(row.clauseHex, 'hex').toString('utf8');
    assert.equal(decoded.replaceAll("\\'", "'"), row.showCreateClause, 'HEX must agree with exported DDL');
    assert.ok(guard.includes("SELECT '" + row.constraintName + "', 'BASELINE', '" + row.clauseHex + "'"));
    // Test-only decoding of the supplied finite fixtures; production uses exact HEX, no normalization.
    const canonical = row.showCreateClause.split(BT).join('').replaceAll('_utf8mb4', '');
    const fromDdl = parse(canonical);
    const baselineClause = guard.match(new RegExp("SELECT '" + row.constraintName + "', 'BASELINE', '([0-9A-F]+)'"))[1];
    const expected = parse(Buffer.from(baselineClause,'hex').toString('utf8'));
    for (const workflow_action of ['Approval A','Approval B','Approval C','Emergency Workflow Attachment','Response to Approval B','invalid',null])
      for (const request_fingerprint of [null,'x','x'.repeat(64)])
        for (const approval_target_stage_snapshot of [null,'IFA-Submitted','AS-Built','As-Built','invalid'])
          for (const created_by_official_role_snapshot of [null,'Admin','Document Owner','Team Process','Team Project','Viewer','invalid']) {
            const input = { workflow_action, request_fingerprint, approval_target_stage_snapshot, created_by_official_role_snapshot };
            assert.equal(fromDdl(input), expected(input), row.constraintName + JSON.stringify(input));
          }
  }
});

test('Actual Railway expanded HEX agrees with approved CHECK semantics, including three OR branches', () => {
  const fixture=JSON.parse(read('apps/backend/tests/fixtures/response-approval-b-railway-expanded-checks.json'));
  const schema=read('database/schema/schema-prod.sql');
  for(const c of fixture.checks){
    assert.equal(Buffer.from(c.clauseHex,'hex').toString('utf8'),c.clause);
    const decoded=c.clause.replaceAll("\\'","'").split(BT).join('').replaceAll('_utf8mb4','');
    const line=schema.split('\n').find(l=>l.includes('CONSTRAINT '+c.constraintName+' CHECK ('));
    assert.ok(line);
    const expectedClause=line.slice(line.indexOf(' CHECK (')+8).replace(/,?\r?$/,'').slice(0,-1);
    const actual=parse(decoded), expected=parse(expectedClause);
    for(const workflow_action of [null,'Approval A','Approval B','Approval C','Emergency Workflow Attachment','Response to Approval B','INVALID'])
      for(const request_fingerprint of [null,'','x'.repeat(63),'x'.repeat(64),'x'.repeat(65)])
        for(const approval_target_stage_snapshot of [null,'IFA-Submitted','AS-Built','As-Built','INVALID'])
          for(const created_by_official_role_snapshot of [null,'Admin','Document Owner','Team Process','Team Project','Viewer','INVALID']){
            const row={workflow_action,request_fingerprint,approval_target_stage_snapshot,created_by_official_role_snapshot};
            assert.equal(actual(row),expected(row),c.constraintName+JSON.stringify(row));
          }
    if(c.constraintName==='chk_workflow_comments_emergency_request'){
      assert.equal(c.clauseHex.length/2,480); assert.doesNotMatch(decoded,/revision_id/);
      assert.equal(actual({workflow_action:'Response to Approval B'}),true);
      assert.equal(actual({workflow_action:'Response to Approval B',request_fingerprint:'x'.repeat(64)}),false);
      assert.equal(actual({workflow_action:'Response to Approval B',approval_target_stage_snapshot:'IFA-Submitted'}),false);
    }
  }
});

test('Railway expanded fixture yields 4/4 and successful actual postflight projection offline', () => {
  const fixture=JSON.parse(read('apps/backend/tests/fixtures/response-approval-b-railway-expanded-checks.json'));
  const guard=harness.template(read(prefix+'mysql_postflight_readonly.sql'));
  const matches=(phase,rows)=>new Set(rows.filter(c=>guard.includes("SELECT '"+c.constraintName+"', '"+phase+"', '"+c.clauseHex+"'")).map(c=>c.constraintName)).size;
  const validate=(rows,changes={})=>{
    const source=read(prefix+'mysql_postflight_readonly.sql');
    const assignment=harness.statements(source).find(s=>s.startsWith('SET @rb_sql = IF(@rb_ready = 1, REPLACE(CONCAT('));
    const vars={'@rb_ready':1,'@rb_guard_template':guard,'@rb_ident':BT+'fixture'+BT,'@rb_context_status':'STOP_CONTEXT',
      common_ok:1,baseline_matches:matches('BASELINE',rows),expanded_matches:matches('EXPANDED',rows),...changes};
    const query=harness.scalar(assignment.slice('SET @rb_sql = '.length),vars);
    if(!query.startsWith('WITH '))return harness.scalar(query.match(/^SELECT (.+) AS status$/)[1],vars);
    const body=query.slice(query.lastIndexOf('\nSELECT *, CASE')+'\nSELECT *, CASE'.length,query.lastIndexOf(' END AS status'));
    for(const when of body.matchAll(/WHEN ([^\n]+?) THEN ([^\n]+)/g))
      if(harness.scalar(when[1],vars))return harness.scalar(when[2],vars);
    return harness.scalar(body.match(/ELSE ([^\n]+)/)[1],vars);
  };
  assert.equal(matches('BASELINE',fixture.checks),2); assert.equal(matches('EXPANDED',fixture.checks),4);
  assert.equal(validate(fixture.checks),'POSTFLIGHT_METADATA_MATCH');
  const changed=fixture.checks.map(c=>c.constraintName==='chk_workflow_comments_emergency_request'
    ? {...c,clauseHex:Buffer.from(c.clause.replace('Response to Approval B','Response to Approval X')).toString('hex').toUpperCase()}:c);
  assert.equal(matches('EXPANDED',changed),3);
  assert.equal(validate(changed),'STOP_UNVERIFIED_CHECK_REPRESENTATION');
  assert.equal(validate(fixture.checks,{common_ok:0}),'STOP_STRUCTURE_OR_DATA_MISMATCH');
  assert.equal(validate(fixture.checks,{'@rb_ready':0}),'STOP_CONTEXT');
  assert.equal(harness.migrate(read(prefix+'mysql.sql'),{matches:{baseline_matches:2,expanded_matches:4}}).mutations.length,0);
});

test('Actual MariaDB baseline representations match canonical boolean semantics without changing guards', () => {
  const local=JSON.parse(read('apps/backend/tests/fixtures/response-approval-b-mariadb-checks.json'));
  const guard=harness.template(read(prefix+'mariadb.sql'));
  for(const c of local.checks){
    assert.equal(Buffer.from(c.clauseHex,'hex').toString('utf8'),c.clause);
    assert.ok(guard.includes("SELECT '"+c.constraintName+"', 'BASELINE', '"+c.clauseHex+"'"));
    const expectedHex=guard.match(new RegExp("SELECT '"+c.constraintName+"', 'BASELINE', '([0-9A-F]+)'"))[1];
    const actual=parse(c.clause.split(BT).join('')),expected=parse(Buffer.from(expectedHex,'hex').toString('utf8'));
    for(const workflow_action of ['Approval A','Approval B','Approval C','Emergency Workflow Attachment','Response to Approval B','INVALID',null])
      for(const request_fingerprint of [null,'short','x'.repeat(64)])
        for(const approval_target_stage_snapshot of [null,'IFA-Submitted','AS-Built','INVALID'])
          for(const revision_id of [null,'R'])
            for(const created_by_official_role_snapshot of [null,'Admin','Document Owner','Team Process','Team Project','Viewer','INVALID']){
              const row={workflow_action,request_fingerprint,approval_target_stage_snapshot,revision_id,created_by_official_role_snapshot};
              assert.equal(actual(row),expected(row),c.constraintName);
            }
  }
});

test('Native MariaDB expanded representations match approved DDL and remain distinct from the baseline', () => {
  const local=JSON.parse(read('apps/backend/tests/fixtures/response-approval-b-mariadb-expanded-checks.json'));
  const guard=harness.template(read(prefix+'mariadb.sql'));
  const schema=read('database/schema/schema-dev.sql');
  for(const c of local.checks){
    assert.equal(Buffer.from(c.clauseHex,'hex').toString('utf8'),c.clause);
    assert.ok(guard.includes("SELECT '"+c.constraintName+"', 'EXPANDED', '"+c.clauseHex+"'"));
    const line=schema.split('\n').find(l=>l.includes('CONSTRAINT '+c.constraintName+' CHECK ('));
    const definition=line.slice(line.indexOf(' CHECK (')+8).replace(/,?\r?$/,'').slice(0,-1);
    const actual=parse(c.clause.split(BT).join('')),expected=parse(definition);
    for(const workflow_action of ['Approval A','Approval B','Approval C','Emergency Workflow Attachment','Response to Approval B','INVALID',null])
      for(const request_fingerprint of [null,'short','x'.repeat(64)])
        for(const approval_target_stage_snapshot of [null,'IFA-Submitted','AS-Built','INVALID'])
          for(const revision_id of [null,'R'])
            for(const created_by_official_role_snapshot of [null,'Admin','Document Owner','Team Process','Team Project','Viewer','INVALID']){
              const row={workflow_action,request_fingerprint,approval_target_stage_snapshot,revision_id,created_by_official_role_snapshot};
              assert.equal(actual(row),expected(row),c.constraintName);
            }
    if(['chk_workflow_comments_workflow_action','chk_workflow_comments_emergency_request'].includes(c.constraintName))
      assert.ok(!guard.includes("SELECT '"+c.constraintName+"', 'BASELINE', '"+c.clauseHex+"'"));
  }
});

test('Response reuses actual unread aggregation, receipt persistence, self-read exclusion and comment mapping', async () => {
  const comments = [{ id: 'RESPONSE-1', project_id: 'P', document_id: 'D', created_by_user_id: 7,
    workflow_action: 'Response to Approval B', workflow_comment: 'Response plain text',
    created_by_name_snapshot: 'Full Name', created_by_official_role_snapshot: 'Admin' }];
  const receipts = new Set();
  const connection = { execute: async (sql, values) => {
    assert.doesNotMatch(sql, /workflow_action\s*(?:=|IN)/i);
    if (sql.includes('INSERT IGNORE INTO comment_read_receipts')) {
      assert.deepEqual(Array.from(values), [9,9,'P','D',9]);
      assert.match(sql, /created_by_user_id <> \?/); let affectedRows = 0;
      for (const c of comments) if (c.created_by_user_id !== 9 && !receipts.has(c.id)) { receipts.add(c.id); affectedRows++; }
      return [{ affectedRows }];
    }
    if (sql.includes('AS unread_comment_count')) {
      assert.match(sql, /unread_comments.project_id = documents.project_id/);
      assert.match(sql, /read_receipts.id IS NULL/);
      assert.match(sql, /unread_comments.created_by_user_id <> \?/);
      const unread = comments.filter(c => c.created_by_user_id !== values[0] && !receipts.has(c.id)).length;
      return [[{ id:'D', project_id:'P', unread_comment_count:unread }]];
    }
    assert.deepEqual(Array.from(values), ['P','D']);
    return [comments];
  } };
  const login = () => createLoader(new Map([
    ['config/database.js', { pool: connection }], ['config/logger.js', { error() {} }],
    ['services/documentAdmission.service.js', { mutate: async (scope, cb) => {
      assert.equal(scope.projectId, 'P'); assert.equal(scope.documentId, 'D'); return cb(connection);
    } }],
  ])).load('repositories/document.repository.js');
  const repo = login();
  assert.equal((await repo.findDocumentRegisterById('D', { userId:9 })).unreadCommentCount, 1);
  assert.equal((await repo.findDocumentRegisterById('D', { userId:7 })).unreadCommentCount, 0);
  const list = await repo.listWorkflowComments({ projectId:'P', documentId:'D' });
  assert.equal(list[0].workflowAction, 'Response to Approval B'); assert.equal(list[0].attachment, null);
  assert.equal(receipts.size, 0);
  assert.equal(await repo.markWorkflowCommentsReadForUser({ projectId:'P', documentId:'D', userId:9 }), 1);
  assert.equal((await login().findDocumentRegisterById('D', { userId:9 })).unreadCommentCount, 0);
  comments.push({ ...comments[0], id:'RESPONSE-2' });
  assert.equal((await repo.findDocumentRegisterById('D', { userId:9 })).unreadCommentCount, 1);
});
