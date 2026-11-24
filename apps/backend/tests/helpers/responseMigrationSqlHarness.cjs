const assert = require('node:assert/strict');

// Offline interpreter for the package's scalar session/prepare control flow only.
// Metadata facts are injected, not SQL-engine integration evidence.
const statements = source => {
  const result = []; let start = 0, quoted = false, comment = false, clean = '';
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (comment) { if (c === '\n') { comment = false; clean += '\n'; } continue; }
    if (!quoted && c === '-' && source[i + 1] === '-') { comment = true; i++; continue; }
    clean += c;
    if (c === "'") {
      if (quoted && source[i + 1] === "'") { clean += source[++i]; continue; }
      quoted = !quoted;
    }
    if (!quoted && c === ';') { result.push(clean.slice(start, -1).trim()); start = clean.length; }
  }
  assert.equal(quoted, false, 'Unterminated SQL literal');
  assert.equal(clean.slice(start).trim(), '', 'Missing terminator');
  return result.filter(Boolean);
};

const scalar = (source, vars) => {
  const tokens = []; let offset = 0;
  const token = /\s*('(?:''|[^'])*'|@[a-z_]+|[a-z_]+|\d+|<>|=|[(),])/iy;
  while (offset < source.length && source.slice(offset).trim()) {
    token.lastIndex = offset; const match = token.exec(source);
    assert.ok(match, `Unsupported scalar SQL: ${source.slice(offset, offset + 60)}`);
    tokens.push(match[1]); offset = token.lastIndex;
  }
  let i = 0;
  const take = word => tokens[i]?.toUpperCase() === word && (++i > 0);
  const need = word => assert.ok(take(word), `Expected ${word}, got ${tokens[i]}`);
  const atom = () => {
    if (take('(')) { const v = or(); need(')'); return v; }
    const t = tokens[i++]; assert.ok(t);
    if (t.startsWith("'")) return t.slice(1, -1).replaceAll("''", "'");
    if (/^\d+$/.test(t)) return Number(t);
    if (t.toUpperCase() === 'NULL') return null;
    if (['IF', 'CONCAT', 'REPLACE'].includes(t.toUpperCase())) {
      need('('); const args = [or()]; while (take(',')) args.push(or()); need(')');
      if (t.toUpperCase() === 'IF') return args[0] ? args[1] : args[2];
      if (args.some(v => v == null)) return null;
      if (t.toUpperCase() === 'CONCAT') return args.join('');
      return String(args[0]).split(args[1]).join(args[2]);
    }
    return vars[t] ?? null;
  };
  const compare = () => { const a = atom(); if (take('=')) { const b = atom(); return a == null || b == null ? null : a === b; }
    if (take('<>')) { const b = atom(); return a == null || b == null ? null : a !== b; } return a; };
  const and = () => { let a = compare(); while (take('AND')) { const b = compare(); a = Boolean(a && b); } return a; };
  const or = () => { let a = and(); while (take('OR')) { const b = and(); a = Boolean(a || b); } return a; };
  const result = or(); assert.equal(i, tokens.length); return result;
};

const template = source => {
  const statement = statements(source).find(s => s.startsWith('SET @rb_guard_template = '));
  assert.ok(statement); return scalar(statement.slice('SET @rb_guard_template = '.length), {});
};
const ddl = source => {
  const statement = statements(source).find(s => s.startsWith('SET @rb_sql = IF(@rb_ready = 1, REPLACE(CONCAT('));
  const payload = scalar(statement.slice('SET @rb_sql = '.length), {
    '@rb_ready': 1, '@rb_guard_template': template(source), '@rb_ident': '`fixture`',
  });
  const tail = payload.slice(payload.lastIndexOf('\nSELECT IF(') + '\nSELECT '.length);
  return scalar(tail.slice(0, tail.indexOf(' INTO @rb_ddl')), {
    common_ok: 1, baseline_matches: 4, expanded_matches: 0, '@rb_ident': '`fixture`',
  });
};

const migrate = (source, options = {}) => {
  const vars = { '@rb_ready': options.ready === false ? 0 : 1, '@rb_ident': '`target_test`',
    '@rb_context_status': 'STOP_CONTEXT', '@rb_ddl': 'ALTER TABLE `old_schema`.`workflow_comments` STALE' };
  const prepared = new Map([['rb_read', 'STALE'], ['rb_migration', vars['@rb_ddl']]]);
  const mutations = [], errors = [];
  const sqls = statements(source.slice(source.indexOf('SET @rb_ddl =', source.indexOf('-- Fresh safe default'))));
  for (const sql of sqls) {
    try {
      if (sql.startsWith('SET ')) {
        const [, name, expression] = sql.match(/^SET (@\w+) = ([\s\S]*)$/);
        if (options.assignmentFailure && name === '@rb_sql' && expression.startsWith('IF')) throw Error('Injected assignment failure');
        vars[name] = scalar(expression, vars); continue;
      }
      if (sql.startsWith('PREPARE ')) {
        const [, name, variable] = sql.match(/^PREPARE (\w+) FROM (@\w+)$/);
        prepared.delete(name);
        if ((options.prepareFailure && name === 'rb_read') || (options.prepareDdlFailure && name === 'rb_migration') || vars[variable] == null) throw Error('Injected prepare failure');
        prepared.set(name, vars[variable]); continue;
      }
      if (sql.startsWith('DEALLOCATE PREPARE ')) { prepared.delete(sql.split(' ').at(-1)); continue; }
      assert.match(sql, /^EXECUTE /);
      const name = sql.split(' ')[1]; const payload = prepared.get(name); assert.ok(payload, 'No prepared statement');
      if (payload.startsWith('WITH ')) {
        if (options.guardFailure) throw Error('Injected guard execution failure');
        assert.ok(payload.includes('FROM `target_test`.`workflow_comments`'));
        const common = payload.match(/SELECT \*, \(([\s\S]*?)\) AS common_ok/)[1];
        const facts = { '@rb_ready': vars['@rb_ready'], engine_ok:1, table_ok:1, columns_ok:4,
          anchor_columns_ok:9, index_columns_ok:6, check_count:4, fk_matches:4, fk_column_count:4,
          incompatible_fk_count:0, incompatible_rows:0, ...options.facts };
        const tail = payload.slice(payload.lastIndexOf('\nSELECT IF(') + '\nSELECT '.length);
        vars['@rb_ddl'] = scalar(tail.slice(0, tail.indexOf(' INTO @rb_ddl')), {
          ...vars, common_ok: Number(Boolean(scalar(common, facts))), baseline_matches:4, expanded_matches:0, ...options.matches,
        });
      } else if (payload.startsWith('ALTER TABLE ')) {
        assert.match(payload, /^ALTER TABLE `target_test`\.`workflow_comments`/);
        mutations.push(payload);
      } else assert.match(payload, /^SELECT /);
    } catch (e) { errors.push(e.message); /* Deliberately continue, as an unsafe client could. */ }
  }
  return { mutations, errors, vars, prepared };
};

const context = (source, target, fixture = {}) => {
  const pattern = source.match(/COLLATE utf8mb4_bin REGEXP '([^']+)'/)[1];
  const forbidden = source.match(/COLLATE utf8mb4_bin NOT REGEXP '([^']+)'/)[1];
  const excluded = source.match(/LOWER\(@rb_target\) NOT IN \(([^)]+)\)/)[1].match(/'([^']+)'/g).map(s => s.slice(1,-1));
  const schemaValid = typeof target === 'string' && [...target].length >= 1 && [...target].length <= 64
    && Buffer.byteLength(target, 'utf8') === target.length && new RegExp(pattern).test(target) && !new RegExp(forbidden).test(target)
    && !excluded.includes(target.toLowerCase());
  const exists = schemaValid && (fixture.schemas || ['target_test']).includes(target);
  const mysql = source.includes("SET @rb_engine_ok = (VERSION() = '9.7.4'");
  const engineOk = mysql ? fixture.version === '9.7.4' : /^10\.4\.32-MariaDB/.test(fixture.version || '');
  const ready = exists && engineOk && fixture.table !== false && fixture.columns !== false && fixture.checks !== false;
  return { schemaValid, exists, engineOk, ready, target, ident: exists ? '`' + target.replaceAll('`','``') + '`' : null };
};

module.exports = { statements, scalar, template, ddl, migrate, context };
