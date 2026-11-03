-- Railway Development / Permanent Delete: READ-ONLY PREFLIGHT.
-- Run section 01 first in DBeaver. Continue ONLY on verified Oracle MySQL
-- 8.0.16+ with DATABASE() = railway and the owner-confirmed Development connection.
-- A database name/hostname alone does not establish the deployment environment.
-- Then execute the remaining script (Alt+X); retain ALL result sets.
-- SELECT / SHOW / INFORMATION_SCHEMA only. No business data is read.
-- Baselines: 20261102_0001_permanent_delete_foundation_mysql.sql and
--            20261102_0002_permanent_delete_cleanup_mysql.sql.
-- APPLIED means current structure matches, NOT proof of migration history,
-- upload provenance, historical-file binding, backup, runtime UAT or deploy readiness.
-- Metadata is not a transactional snapshot: run without concurrent DDL and rerun
-- if another administrator changes schema during inspection.
-- No automatic migration/retry is authorized by this script.

-- 01: Stop before section 03 if engine/version/target cannot be established.
SELECT '01_connection_identity' AS inspection,
       DATABASE() AS active_database, VERSION() AS server_version,
       @@version_comment AS version_comment, @@hostname AS server_hostname,
       @@port AS server_port, CONNECTION_ID() AS connection_id,
       CURRENT_USER() AS privilege_identity, CURRENT_ROLE() AS active_roles,
       @@sql_mode AS sql_mode,
       CASE WHEN DATABASE() <> 'railway' OR DATABASE() IS NULL THEN 'STOP - WRONG SCHEMA'
            WHEN VERSION() LIKE '%MariaDB%' OR @@version_comment NOT LIKE '%MySQL%'
              THEN 'UNVERIFIED - ORACLE MYSQL REQUIRED'
            WHEN CAST(SUBSTRING_INDEX(VERSION(), '.', 1) AS UNSIGNED) > 8
              OR (CAST(SUBSTRING_INDEX(VERSION(), '.', 1) AS UNSIGNED) = 8
                AND (CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(VERSION(), '.', 2), '.', -1) AS UNSIGNED) > 0
                  OR CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(VERSION(), '.', 3), '.', -1) AS UNSIGNED) >= 16))
              THEN 'PASS - CONFIRM DEVELOPMENT CONNECTION MANUALLY'
            ELSE 'STOP - MYSQL 8.0.16+ REQUIRED' END AS prerequisite;

-- 02: Direct grants are checked below. Role-only grants are conservatively
-- UNVERIFIED; inspect this output manually, not by broadening privileges here.
SHOW GRANTS;

-- 03: One result set: SUMMARY first, followed by every object comparison.
-- Expected definitions are explicit, rather than inferred from existing tables.
WITH RECURSIVE
definitions AS (
  SELECT '0001' AS migration_id, 'document_admission_coordinators' AS table_name,
    CAST('{"columns":[
      {"n":"project_id","t":"varchar(64)"},{"n":"document_id","t":"varchar(64)"},
      {"n":"gate_state","t":"varchar(16)","d":"OPEN"},
      {"n":"generation","t":"bigint unsigned","d":"1"},
      {"n":"delete_operation_id","t":"varchar(64)","nullable":"YES"},
      {"n":"created_at","t":"datetime(3)","d":"CURRENT_TIMESTAMP(3)"},
      {"n":"updated_at","t":"datetime(3)","d":"CURRENT_TIMESTAMP(3)"}],
      "indexes":[{"n":"PRIMARY","unique":0,"parts":["project_id","document_id"]}],
      "checks":[{"n":"chk_document_admission_gate","e":"gate_state IN (''OPEN'',''CLOSED'')"}]}' AS JSON) AS spec
  UNION ALL SELECT '0001','document_delete_operations', CAST('{"columns":[
      {"n":"id","t":"varchar(64)"},{"n":"project_id","t":"varchar(64)"},
      {"n":"document_id","t":"varchar(64)"},{"n":"document_number_snapshot","t":"varchar(255)"},
      {"n":"initiated_by_user_id","t":"bigint unsigned"},{"n":"reason","t":"text","nullable":"YES"},
      {"n":"request_identity","t":"char(64)","ascii":1},
      {"n":"status","t":"varchar(32)","d":"QUIESCENCE_PENDING"},
      {"n":"pending_metadata","t":"longtext","nullable":"YES"},
      {"n":"created_at","t":"datetime(3)","d":"CURRENT_TIMESTAMP(3)"},
      {"n":"updated_at","t":"datetime(3)","d":"CURRENT_TIMESTAMP(3)"}],
      "indexes":[{"n":"PRIMARY","unique":0,"parts":["id"]},
      {"n":"uq_document_delete_identity","unique":0,"parts":["project_id","document_id","request_identity"]},
      {"n":"uq_document_delete_target","unique":0,"parts":["project_id","document_id"]},
      {"n":"idx_document_delete_pending","unique":1,"parts":["status","created_at"]}],
      "checks":[{"n":"chk_document_delete_status","e":"status IN (''QUIESCENCE_PENDING'',''QUIESCENCE_CONFIRMED'')"}]}' AS JSON)
  UNION ALL SELECT '0001','document_writer_operations', CAST('{"columns":[
      {"n":"id","t":"varchar(64)"},{"n":"project_id","t":"varchar(64)","nullable":"YES"},
      {"n":"document_id","t":"varchar(64)","nullable":"YES"},{"n":"writer_type","t":"varchar(64)"},
      {"n":"generation","t":"bigint unsigned"},{"n":"lifecycle_state","t":"varchar(16)","d":"ACTIVE"},
      {"n":"db_outcome","t":"varchar(16)","d":"NOT_STARTED"},
      {"n":"temporary_file_id","t":"varchar(64)","nullable":"YES"},
      {"n":"active_temporary_file_id","t":"varchar(64)","nullable":"YES","generated":1},
      {"n":"completion_evidence","t":"longtext","nullable":"YES"},
      {"n":"created_at","t":"datetime(3)","d":"CURRENT_TIMESTAMP(3)"},
      {"n":"updated_at","t":"datetime(3)","d":"CURRENT_TIMESTAMP(3)"}],
      "indexes":[{"n":"PRIMARY","unique":0,"parts":["id"]},
      {"n":"uq_document_writer_temporary_claim","unique":0,"parts":["active_temporary_file_id"]},
      {"n":"idx_document_writer_target","unique":1,"parts":["project_id","document_id","lifecycle_state"]}],
      "checks":[{"n":"chk_document_writer_lifecycle","e":"lifecycle_state IN (''ACTIVE'',''SETTLED'',''UNRESOLVED'')"},
      {"n":"chk_document_writer_db","e":"db_outcome IN (''NOT_STARTED'',''IN_PROGRESS'',''COMMITTED'',''ROLLED_BACK'',''UNKNOWN'')"},
      {"n":"chk_document_writer_scope","e":"(project_id IS NOT NULL AND document_id IS NOT NULL) OR (project_id IS NULL AND document_id IS NULL AND temporary_file_id IS NOT NULL)",
      "alternate":"(((project_id IS NOT NULL) AND (document_id IS NOT NULL)) OR ((project_id IS NULL) AND (document_id IS NULL) AND (temporary_file_id IS NOT NULL)))"}]}' AS JSON)
  UNION ALL SELECT '0001','document_storage_io_steps', CAST('{"columns":[
      {"n":"id","t":"varchar(64)"},{"n":"writer_id","t":"varchar(64)"},
      {"n":"provider","t":"varchar(16)"},{"n":"operation_type","t":"varchar(32)"},
      {"n":"source_key","t":"text","nullable":"YES"},{"n":"destination_key","t":"text","nullable":"YES"},
      {"n":"state","t":"varchar(16)"},{"n":"evidence","t":"longtext","nullable":"YES"},
      {"n":"created_at","t":"datetime(3)","d":"CURRENT_TIMESTAMP(3)"},
      {"n":"updated_at","t":"datetime(3)","d":"CURRENT_TIMESTAMP(3)"}],
      "indexes":[{"n":"PRIMARY","unique":0,"parts":["id"]},
      {"n":"idx_document_io_writer","unique":1,"parts":["writer_id","state"]}],
      "checks":[{"n":"chk_document_io_state","e":"state IN (''IN_FLIGHT'',''SUCCEEDED'',''UNKNOWN'')"}]}' AS JSON)
  UNION ALL SELECT '0001','document_delete_file_manifest', CAST('{"columns":[
      {"n":"id","t":"varchar(64)"},{"n":"delete_operation_id","t":"varchar(64)"},
      {"n":"file_reference","t":"varchar(64)","nullable":"YES"},{"n":"provider","t":"varchar(16)"},
      {"n":"exact_storage_key","t":"text"},{"n":"storage_key_hash","t":"char(64)","ascii":1},
      {"n":"ownership_evidence","t":"longtext"},{"n":"cleanup_state","t":"varchar(16)","d":"PENDING"},
      {"n":"created_at","t":"datetime(3)","d":"CURRENT_TIMESTAMP(3)"},
      {"n":"updated_at","t":"datetime(3)","d":"CURRENT_TIMESTAMP(3)"}],
      "indexes":[{"n":"PRIMARY","unique":0,"parts":["id"]},
      {"n":"uq_document_manifest_key","unique":0,"parts":["delete_operation_id","provider","storage_key_hash"]}],
      "checks":[{"n":"chk_document_manifest_state","e":"cleanup_state IN (''PENDING'',''DELETED'',''FAILED'')"}]}' AS JSON)
  UNION ALL SELECT '0002','storage_namespaces', CAST('{"columns":[
      {"n":"id","t":"char(64)","ascii":1},{"n":"provider","t":"varchar(16)"},
      {"n":"descriptor","t":"longtext"},{"n":"created_at","t":"datetime(3)"}],
      "indexes":[{"n":"PRIMARY","unique":0,"parts":["id"]}],
      "checks":[{"n":"chk_storage_namespace_provider","e":"provider IN (''local'',''r2'')"}]}' AS JSON)
  UNION ALL SELECT '0002','stored_file_namespace_bindings', CAST('{"columns":[
      {"n":"file_id","t":"varchar(64)"},{"n":"namespace_id","t":"char(64)","ascii":1},
      {"n":"storage_key_snapshot","t":"varchar(255)"},{"n":"evidence","t":"longtext"},
      {"n":"created_at","t":"datetime(3)"}],
      "indexes":[{"n":"PRIMARY","unique":0,"parts":["file_id"]},
      {"n":"idx_file_namespace","unique":1,"parts":["namespace_id"]}],"checks":[]}' AS JSON)
  UNION ALL SELECT '0002','document_delete_executions', CAST('{"columns":[
      {"n":"operation_id","t":"varchar(64)"},{"n":"phase","t":"varchar(32)"},
      {"n":"inventory","t":"longtext"},{"n":"manifest_digest","t":"char(64)","ascii":1},
      {"n":"completion_snapshot","t":"longtext","nullable":"YES"},
      {"n":"pending_reason","t":"varchar(128)","nullable":"YES"},
      {"n":"created_at","t":"datetime(3)"},{"n":"updated_at","t":"datetime(3)"}],
      "indexes":[{"n":"PRIMARY","unique":0,"parts":["operation_id"]}],
      "checks":[{"n":"chk_delete_execution_phase","e":"phase IN (''MANIFEST_FINALIZED'',''COMPLETED'')"}]}' AS JSON)
  UNION ALL SELECT '0002','document_delete_attempts', CAST('{"columns":[
      {"n":"manifest_id","t":"varchar(64)"},{"n":"attempt_id","t":"varchar(64)"},
      {"n":"attempt_count","t":"int unsigned"},{"n":"state","t":"varchar(16)"},
      {"n":"error_code","t":"varchar(128)","nullable":"YES"},
      {"n":"created_at","t":"datetime(3)"},{"n":"updated_at","t":"datetime(3)"}],
      "indexes":[{"n":"PRIMARY","unique":0,"parts":["manifest_id"]},
      {"n":"uq_delete_attempt_id","unique":0,"parts":["attempt_id"]}],
      "checks":[{"n":"chk_delete_attempt_state","e":"state IN (''IN_FLIGHT'',''SUCCEEDED'',''UNKNOWN'',''REJECTED'')"}]}' AS JSON)
),
expected_columns AS (
  SELECT d.migration_id,d.table_name,j.* FROM definitions d
  JOIN JSON_TABLE(d.spec,'$.columns[*]' COLUMNS (
    position FOR ORDINALITY,n VARCHAR(64) PATH '$.n',t VARCHAR(64) PATH '$.t',
    nullable VARCHAR(3) PATH '$.nullable' DEFAULT '"NO"' ON EMPTY,
    def VARCHAR(64) PATH '$.d' NULL ON EMPTY,
    ascii_column INT PATH '$.ascii' DEFAULT '0' ON EMPTY,
    generated_column INT PATH '$.generated' DEFAULT '0' ON EMPTY)) j ON TRUE
),
expected_index_parts AS (
  SELECT d.migration_id,d.table_name,j.* FROM definitions d
  JOIN JSON_TABLE(d.spec,'$.indexes[*]' COLUMNS (
    n VARCHAR(64) PATH '$.n',non_unique INT PATH '$.unique',
    NESTED PATH '$.parts[*]' COLUMNS (seq FOR ORDINALITY,col VARCHAR(64) PATH '$'))) j ON TRUE
),
expected_checks AS (
  SELECT d.migration_id,d.table_name,j.* FROM definitions d
  JOIN JSON_TABLE(d.spec,'$.checks[*]' COLUMNS (
    n VARCHAR(64) PATH '$.n',expr VARCHAR(2000) PATH '$.e',
    alternate VARCHAR(2000) PATH '$.alternate' NULL ON EMPTY)) j ON TRUE
),
expected_fk AS (
  SELECT '0002' migration_id,'stored_file_namespace_bindings' table_name,
    'fk_binding_namespace' n,'namespace_id' col,'storage_namespaces' ref_table,'id' ref_col
),
privileges AS (
  SELECT PRIVILEGE_TYPE FROM information_schema.USER_PRIVILEGES
  WHERE GRANTEE=CONCAT(CHAR(39),SUBSTRING_INDEX(CURRENT_USER(),'@',1),CHAR(39),'@',
    CHAR(39),SUBSTRING_INDEX(CURRENT_USER(),'@',-1),CHAR(39))
  UNION ALL
  SELECT PRIVILEGE_TYPE FROM information_schema.SCHEMA_PRIVILEGES
  WHERE TABLE_SCHEMA=DATABASE() AND GRANTEE=CONCAT(CHAR(39),
    SUBSTRING_INDEX(CURRENT_USER(),'@',1),CHAR(39),'@',CHAR(39),
    SUBSTRING_INDEX(CURRENT_USER(),'@',-1),CHAR(39))
),
visibility AS (
  SELECT EXISTS(SELECT 1 FROM privileges WHERE PRIVILEGE_TYPE='SELECT') table_visibility,
    EXISTS(SELECT 1 FROM privileges WHERE PRIVILEGE_TYPE='TRIGGER') trigger_visibility
),
actual_tables AS (
  SELECT t.* FROM information_schema.TABLES t JOIN definitions d USING(table_name)
  WHERE t.TABLE_SCHEMA=DATABASE()
),
actual_columns AS (
  SELECT c.* FROM information_schema.COLUMNS c JOIN definitions d USING(table_name)
  WHERE c.TABLE_SCHEMA=DATABASE()
),
actual_indexes AS (
  SELECT s.* FROM information_schema.STATISTICS s JOIN definitions d USING(table_name)
  WHERE s.TABLE_SCHEMA=DATABASE()
),
actual_constraints AS (
  SELECT tc.*,cc.CHECK_CLAUSE FROM information_schema.TABLE_CONSTRAINTS tc
  JOIN definitions d USING(table_name)
  LEFT JOIN information_schema.CHECK_CONSTRAINTS cc
    ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME
  WHERE tc.TABLE_SCHEMA=DATABASE()
),
-- Normalize whitespace OUTSIDE string literals only. Preserve literal case/content,
-- charset introducers, collations, operators and parentheses. Recognize backticks
-- only around the exact identifiers used by these expressions. Unrecognized spelling
-- stays UNVERIFIED, never accepted by deleting arbitrary punctuation or keywords.
expression_inputs AS (
  SELECT CONCAT('CHECK:',e.table_name,':',e.n) k,'expected' variant,e.expr raw_expr
    FROM expected_checks e
  UNION ALL SELECT CONCAT('CHECK:',e.table_name,':',e.n),'alternate',e.alternate
    FROM expected_checks e WHERE e.alternate IS NOT NULL
  UNION ALL SELECT CONCAT('CHECK:',e.table_name,':',e.n),'actual',a.CHECK_CLAUSE
    FROM expected_checks e JOIN actual_constraints a
      ON a.TABLE_NAME=e.table_name AND a.CONSTRAINT_NAME=e.n AND a.CONSTRAINT_TYPE='CHECK'
  UNION ALL SELECT 'GENERATED','expected',
    'CASE WHEN lifecycle_state <> ''SETTLED'' THEN temporary_file_id ELSE NULL END'
  UNION ALL SELECT 'GENERATED','alternate',
    'CASE WHEN (lifecycle_state <> ''SETTLED'') THEN temporary_file_id ELSE NULL END'
  UNION ALL SELECT 'GENERATED','actual',GENERATION_EXPRESSION FROM actual_columns
    WHERE TABLE_NAME='document_writer_operations' AND COLUMN_NAME='active_temporary_file_id'
),
expression_prepared AS (
  SELECT k,variant,
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
      raw_expr,'`gate_state`','gate_state'),'`status`','status'),
      '`lifecycle_state`','lifecycle_state'),'`db_outcome`','db_outcome'),
      '`project_id`','project_id'),'`document_id`','document_id'),
      '`temporary_file_id`','temporary_file_id'),'`state`','state'),
      '`cleanup_state`','cleanup_state'),'`provider`','provider') expr
  FROM expression_inputs
),
expression_scan (k,variant,expr,pos,in_literal,normalized) AS (
  SELECT k,variant,REPLACE(expr,'`phase`','phase'),1,0,CAST('' AS CHAR(4000))
    FROM expression_prepared WHERE expr IS NOT NULL AND CHAR_LENGTH(expr)<=2000
  UNION ALL
  SELECT k,variant,expr,pos+1,
    IF(SUBSTRING(expr,pos,1)=CHAR(39),1-in_literal,in_literal),
    CONCAT(normalized,CASE
      WHEN in_literal=0 AND REGEXP_LIKE(SUBSTRING(expr,pos,1),'[[:space:]]') THEN ''
      WHEN in_literal=0 THEN LOWER(SUBSTRING(expr,pos,1))
      ELSE SUBSTRING(expr,pos,1) END)
  FROM expression_scan WHERE pos<=CHAR_LENGTH(expr) AND pos<900
),
expressions AS (
  SELECT k,variant,normalized FROM expression_scan
    WHERE pos=CHAR_LENGTH(expr)+1 AND in_literal=0
),
-- MySQL may emit _utf8mb4 on the ASCII literals below. Accept only explicit
-- utf8mb4 introducers on known literals, through an expected alternate rendering.
-- No stripping of actual charset markers, collations or literal whitespace.
allowed_expressions AS (
  SELECT k,normalized FROM expressions WHERE variant<>'actual'
  UNION ALL SELECT k,CONCAT('(',normalized,')') FROM expressions WHERE variant<>'actual'
),
-- Construct the introducer variant character by character; only opening quotes
-- receive a prefix. This avoids altering closing quotes or contents of literals.
introduced (k,variant,expr,pos,in_literal,normalized) AS (
  SELECT k,variant,normalized,1,0,CAST('' AS CHAR(4000)) FROM expressions WHERE variant<>'actual'
  UNION ALL
  SELECT k,variant,expr,pos+1,
    IF(SUBSTRING(expr,pos,1)=CHAR(39),1-in_literal,in_literal),
    CONCAT(normalized,IF(in_literal=0 AND SUBSTRING(expr,pos,1)=CHAR(39),'_utf8mb4',''),SUBSTRING(expr,pos,1))
  FROM introduced WHERE pos<=CHAR_LENGTH(expr) AND pos<900
),
all_allowed_expressions AS (
  SELECT k,normalized FROM allowed_expressions
  UNION ALL SELECT k,normalized FROM introduced WHERE pos=CHAR_LENGTH(expr)+1 AND in_literal=0
  UNION ALL SELECT k,CONCAT('(',normalized,')') FROM introduced
    WHERE pos=CHAR_LENGTH(expr)+1 AND in_literal=0
),
results AS (
  SELECT d.migration_id,d.table_name,'TABLE' object_type,d.table_name object_name,
    CASE WHEN a.TABLE_NAME IS NULL THEN 'MISSING'
      WHEN NOT(a.TABLE_TYPE<=>'BASE TABLE') OR NOT(LOWER(a.ENGINE)<=>'innodb')
        OR NOT(a.TABLE_COLLATION<=>'utf8mb4_unicode_ci') THEN 'MISMATCH' ELSE 'MATCH' END result,
    'BASE TABLE / InnoDB / utf8mb4_unicode_ci' expected,
    CONCAT_WS(' / ',a.TABLE_TYPE,a.ENGINE,a.TABLE_COLLATION) actual
  FROM definitions d LEFT JOIN actual_tables a ON a.TABLE_NAME=d.table_name
  UNION ALL
  SELECT e.migration_id,e.table_name,'COLUMN',e.n,
    CASE WHEN a.COLUMN_NAME IS NULL THEN 'MISSING'
      WHEN NOT (REGEXP_REPLACE(LOWER(a.COLUMN_TYPE),'^(bigint|int)[(][0-9]+[)]','$1') <=> e.t) OR a.IS_NULLABLE<>e.nullable
        OR a.ORDINAL_POSITION<>e.position
        OR NOT (CAST(IF(e.t='datetime(3)',LOWER(a.COLUMN_DEFAULT),a.COLUMN_DEFAULT) AS BINARY)
          <=> CAST(IF(e.t='datetime(3)',LOWER(e.def),e.def) AS BINARY))
        OR NOT (a.CHARACTER_SET_NAME <=> IF(e.t REGEXP '^(varchar|char|text|longtext)',IF(e.ascii_column=1,'ascii','utf8mb4'),NULL))
        OR NOT (a.COLLATION_NAME <=> IF(e.t REGEXP '^(varchar|char|text|longtext)',IF(e.ascii_column=1,'ascii_bin','utf8mb4_unicode_ci'),NULL))
        OR UPPER(TRIM(REPLACE(a.EXTRA,'DEFAULT_GENERATED','')))<>IF(e.generated_column=1,'STORED GENERATED','')
        OR (e.generated_column=0 AND COALESCE(a.GENERATION_EXPRESSION,'')<>'')
      THEN 'MISMATCH' ELSE 'MATCH' END,
    CONCAT(e.t,' / ',e.nullable,' / default=',COALESCE(e.def,'<NULL>'),
      ' / ordinal=',e.position,' / generated=',e.generated_column),
    CONCAT_WS(' / ',a.COLUMN_TYPE,a.IS_NULLABLE,CONCAT('default=',COALESCE(a.COLUMN_DEFAULT,'<NULL>')),
      CONCAT('ordinal=',a.ORDINAL_POSITION),a.CHARACTER_SET_NAME,a.COLLATION_NAME,a.EXTRA)
  FROM expected_columns e LEFT JOIN actual_columns a ON a.TABLE_NAME=e.table_name AND a.COLUMN_NAME=e.n
  UNION ALL
  SELECT d.migration_id,a.TABLE_NAME,'EXTRA COLUMN',a.COLUMN_NAME,'MISMATCH','<absent>',a.COLUMN_TYPE
  FROM actual_columns a JOIN definitions d ON d.table_name=a.TABLE_NAME
  LEFT JOIN expected_columns e ON e.table_name=a.TABLE_NAME AND e.n=a.COLUMN_NAME WHERE e.n IS NULL
  UNION ALL
  SELECT e.migration_id,e.table_name,'INDEX PART',CONCAT(e.n,':',e.seq),
    CASE WHEN a.INDEX_NAME IS NULL THEN 'MISSING'
      WHEN a.NON_UNIQUE<>e.non_unique OR NOT(a.COLUMN_NAME<=>e.col)
        OR a.SUB_PART IS NOT NULL OR a.INDEX_TYPE<>'BTREE'
        OR a.COLLATION<>'A' OR a.IS_VISIBLE<>'YES' OR a.EXPRESSION IS NOT NULL
      THEN 'MISMATCH' ELSE 'MATCH' END,
    CONCAT(e.col,' / non_unique=',e.non_unique,' / full ASC BTREE visible'),
    CONCAT_WS(' / ',a.COLUMN_NAME,CONCAT('non_unique=',a.NON_UNIQUE),
      CONCAT('prefix=',COALESCE(a.SUB_PART,'<NULL>')),a.INDEX_TYPE,a.COLLATION,a.IS_VISIBLE,a.EXPRESSION)
  FROM expected_index_parts e LEFT JOIN actual_indexes a ON a.TABLE_NAME=e.table_name
    AND a.INDEX_NAME=e.n AND a.SEQ_IN_INDEX=e.seq
  UNION ALL
  SELECT d.migration_id,a.TABLE_NAME,'EXTRA INDEX PART',CONCAT(a.INDEX_NAME,':',a.SEQ_IN_INDEX),
    'MISMATCH','<absent>',a.COLUMN_NAME
  FROM actual_indexes a JOIN definitions d ON d.table_name=a.TABLE_NAME
  LEFT JOIN expected_index_parts e ON e.table_name=a.TABLE_NAME AND e.n=a.INDEX_NAME AND e.seq=a.SEQ_IN_INDEX
  WHERE e.n IS NULL
  UNION ALL
  SELECT e.migration_id,e.table_name,'CHECK',e.n,
    CASE WHEN a.CONSTRAINT_NAME IS NULL THEN 'MISSING'
      WHEN a.CONSTRAINT_TYPE<>'CHECK' OR a.ENFORCED<>'YES' THEN 'MISMATCH'
      WHEN a.CHECK_CLAUSE IS NULL THEN 'UNVERIFIED'
      WHEN EXISTS(SELECT 1 FROM expressions x JOIN all_allowed_expressions y ON y.k=x.k
        AND CAST(y.normalized AS BINARY)=CAST(x.normalized AS BINARY)
        WHERE x.variant='actual' AND x.k=CONCAT('CHECK:',e.table_name,':',e.n)) THEN 'MATCH'
      ELSE 'UNVERIFIED' END,e.expr,a.CHECK_CLAUSE
  FROM expected_checks e LEFT JOIN actual_constraints a
    ON a.TABLE_NAME=e.table_name AND a.CONSTRAINT_NAME=e.n
  UNION ALL
  SELECT '0001','document_writer_operations','GENERATED EXPRESSION','active_temporary_file_id',
    CASE WHEN NOT EXISTS(SELECT 1 FROM actual_columns WHERE TABLE_NAME='document_writer_operations'
      AND COLUMN_NAME='active_temporary_file_id') THEN 'MISSING'
      WHEN EXISTS(SELECT 1 FROM expressions x JOIN all_allowed_expressions y ON y.k=x.k
        AND CAST(y.normalized AS BINARY)=CAST(x.normalized AS BINARY)
        WHERE x.k='GENERATED' AND x.variant='actual') THEN 'MATCH' ELSE 'UNVERIFIED' END,
    'CASE WHEN lifecycle_state <> ''SETTLED'' THEN temporary_file_id ELSE NULL END',
    (SELECT GENERATION_EXPRESSION FROM actual_columns WHERE TABLE_NAME='document_writer_operations'
      AND COLUMN_NAME='active_temporary_file_id')
  UNION ALL
  SELECT e.migration_id,e.table_name,'FOREIGN KEY',e.n,
    CASE WHEN a.CONSTRAINT_NAME IS NULL THEN 'MISSING'
      WHEN a.CONSTRAINT_TYPE<>'FOREIGN KEY' OR k.ORDINAL_POSITION<>1 OR k.COLUMN_NAME<>e.col
        OR k.REFERENCED_TABLE_SCHEMA<>DATABASE() OR k.REFERENCED_TABLE_NAME<>e.ref_table
        OR k.REFERENCED_COLUMN_NAME<>e.ref_col OR k.POSITION_IN_UNIQUE_CONSTRAINT<>1
        OR r.DELETE_RULE<>'RESTRICT' OR r.UPDATE_RULE NOT IN ('RESTRICT','NO ACTION')
        OR r.MATCH_OPTION<>'NONE'
        OR (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE z
          WHERE z.CONSTRAINT_SCHEMA=DATABASE() AND z.TABLE_NAME=e.table_name AND z.CONSTRAINT_NAME=e.n)<>1
        THEN 'MISMATCH'
      WHEN k.COLUMN_NAME IS NULL OR r.CONSTRAINT_NAME IS NULL THEN 'UNVERIFIED' ELSE 'MATCH' END,
    'namespace_id -> current_schema.storage_namespaces(id); DELETE RESTRICT; UPDATE NO ACTION/RESTRICT',
    CONCAT_WS(' / ',k.COLUMN_NAME,k.REFERENCED_TABLE_SCHEMA,k.REFERENCED_TABLE_NAME,
      k.REFERENCED_COLUMN_NAME,r.DELETE_RULE,r.UPDATE_RULE,r.MATCH_OPTION)
  FROM expected_fk e LEFT JOIN actual_constraints a ON a.TABLE_NAME=e.table_name AND a.CONSTRAINT_NAME=e.n
  LEFT JOIN information_schema.KEY_COLUMN_USAGE k ON k.CONSTRAINT_SCHEMA=DATABASE()
    AND k.TABLE_NAME=e.table_name AND k.CONSTRAINT_NAME=e.n AND k.ORDINAL_POSITION=1
  LEFT JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA=DATABASE()
    AND r.TABLE_NAME=e.table_name AND r.CONSTRAINT_NAME=e.n
  UNION ALL
  SELECT d.migration_id,a.TABLE_NAME,'EXTRA CONSTRAINT',a.CONSTRAINT_NAME,'MISMATCH','<absent>',a.CONSTRAINT_TYPE
  FROM actual_constraints a JOIN definitions d ON d.table_name=a.TABLE_NAME
  WHERE NOT (a.CONSTRAINT_TYPE='PRIMARY KEY' AND a.CONSTRAINT_NAME='PRIMARY')
    AND NOT (a.CONSTRAINT_TYPE='UNIQUE' AND EXISTS(SELECT 1 FROM expected_index_parts e
      WHERE e.table_name=a.TABLE_NAME AND e.n=a.CONSTRAINT_NAME AND e.non_unique=0))
    AND NOT EXISTS(SELECT 1 FROM expected_checks e WHERE e.table_name=a.TABLE_NAME AND e.n=a.CONSTRAINT_NAME)
    AND NOT EXISTS(SELECT 1 FROM expected_fk e WHERE e.table_name=a.TABLE_NAME AND e.n=a.CONSTRAINT_NAME)
  UNION ALL
  SELECT d.migration_id,d.table_name,'TRIGGER VISIBILITY','triggers',
    IF(v.trigger_visibility=1,'MATCH','UNVERIFIED'),'Schema/global TRIGGER metadata visibility',
    IF(v.trigger_visibility=1,'Direct privilege available','Role/table-level grants not automatically proven')
  FROM definitions d JOIN actual_tables a ON a.TABLE_NAME=d.table_name CROSS JOIN visibility v
  UNION ALL
  SELECT d.migration_id,t.EVENT_OBJECT_TABLE,'EXTRA TRIGGER',t.TRIGGER_NAME,'MISMATCH','<absent>',t.ACTION_STATEMENT
  FROM information_schema.TRIGGERS t JOIN definitions d ON d.table_name=t.EVENT_OBJECT_TABLE
  WHERE t.TRIGGER_SCHEMA=DATABASE()
  UNION ALL
  SELECT d.migration_id,d.table_name,'CONSTRAINT NAME COLLISION',a.CONSTRAINT_NAME,
    'MISMATCH','Constraint belongs to target table',a.TABLE_NAME
  FROM definitions d
  JOIN information_schema.TABLE_CONSTRAINTS a ON a.CONSTRAINT_SCHEMA=DATABASE() AND a.TABLE_NAME<>d.table_name
  WHERE EXISTS(SELECT 1 FROM expected_checks e WHERE e.table_name=d.table_name AND e.n=a.CONSTRAINT_NAME)
    OR EXISTS(SELECT 1 FROM expected_fk e WHERE e.table_name=d.table_name AND e.n=a.CONSTRAINT_NAME)
),
migration_groups AS (
  SELECT 'ALL' migration_id UNION ALL SELECT '0001' UNION ALL SELECT '0002'
),
summary AS (
  SELECT g.migration_id,'*' table_name,'SUMMARY' object_type,g.migration_id object_name,
    CASE WHEN DATABASE() IS NULL OR DATABASE()<>'railway'
        OR VERSION() LIKE '%MariaDB%' OR @@version_comment NOT LIKE '%MySQL%'
        OR CAST(SUBSTRING_INDEX(VERSION(),'.',1) AS UNSIGNED)<8
        OR (CAST(SUBSTRING_INDEX(VERSION(),'.',1) AS UNSIGNED)=8
          AND CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(VERSION(),'.',2),'.',-1) AS UNSIGNED)=0
          AND CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(VERSION(),'.',3),'.',-1) AS UNSIGNED)<16)
        OR v.table_visibility<>1 THEN 'UNVERIFIED'
      WHEN SUM(r.result='MISMATCH')>0 THEN 'STRUCTURE MISMATCH'
      WHEN SUM(r.object_type='TABLE' AND r.result='MATCH')=0
        AND SUM(r.object_type='TABLE' AND r.result='MISSING')=SUM(r.object_type='TABLE') THEN 'NOT APPLIED'
      WHEN SUM(r.result='UNVERIFIED')>0 THEN 'UNVERIFIED'
      WHEN SUM(r.result='MISSING')>0 THEN 'PARTIALLY APPLIED'
      ELSE 'APPLIED / STRUCTURE MATCH' END result,
    'Exact migration baseline; schema metadata only' expected,
    CONCAT('tables=',SUM(r.object_type='TABLE' AND r.result='MATCH'),'/',SUM(r.object_type='TABLE'),
      '; missing=',SUM(r.result='MISSING'),'; mismatches=',SUM(r.result='MISMATCH'),
      '; unverified=',SUM(r.result='UNVERIFIED'),'; schema_select_visibility=',v.table_visibility) actual
  FROM migration_groups g JOIN results r ON g.migration_id='ALL' OR g.migration_id=r.migration_id
  CROSS JOIN visibility v GROUP BY g.migration_id,v.table_visibility
)
SELECT migration_id,table_name,object_type,object_name,result,expected,actual FROM summary
UNION ALL
SELECT migration_id,table_name,object_type,object_name,result,expected,actual FROM results
ORDER BY object_type='SUMMARY' DESC,migration_id,table_name,object_type,object_name;

-- 04: Constraint-name collisions elsewhere in the schema can block CREATE TABLE
-- even when a target table is absent. Any returned row requires owner review.
SELECT '04_constraint_name_collision' AS inspection,tc.TABLE_NAME,tc.CONSTRAINT_NAME,tc.CONSTRAINT_TYPE,
       'STRUCTURE MISMATCH - NAME EXISTS ON ANOTHER TABLE' AS result
FROM information_schema.TABLE_CONSTRAINTS tc
JOIN JSON_TABLE('[
  ["document_admission_coordinators","chk_document_admission_gate"],
  ["document_delete_operations","chk_document_delete_status"],
  ["document_writer_operations","chk_document_writer_lifecycle"],
  ["document_writer_operations","chk_document_writer_db"],
  ["document_writer_operations","chk_document_writer_scope"],
  ["document_storage_io_steps","chk_document_io_state"],
  ["document_delete_file_manifest","chk_document_manifest_state"],
  ["storage_namespaces","chk_storage_namespace_provider"],
  ["stored_file_namespace_bindings","fk_binding_namespace"],
  ["document_delete_executions","chk_delete_execution_phase"],
  ["document_delete_attempts","chk_delete_attempt_state"]
]', '$[*]' COLUMNS (expected_table VARCHAR(64) PATH '$[0]',n VARCHAR(64) PATH '$[1]')) e
  ON e.n=tc.CONSTRAINT_NAME
WHERE tc.CONSTRAINT_SCHEMA=DATABASE() AND tc.TABLE_NAME<>e.expected_table;

-- 05: Incoming FKs are not created by these migrations. Review any returned rows;
-- a matching owned-table definition does not prove absence of outside dependencies.
SELECT '05_external_incoming_foreign_keys' AS inspection,k.TABLE_SCHEMA,k.TABLE_NAME,
       k.CONSTRAINT_NAME,k.COLUMN_NAME,k.REFERENCED_TABLE_NAME,k.REFERENCED_COLUMN_NAME,
       r.DELETE_RULE,r.UPDATE_RULE,'UNVERIFIED - REVIEW EXTERNAL DEPENDENCY' AS result
FROM information_schema.KEY_COLUMN_USAGE k
LEFT JOIN information_schema.REFERENTIAL_CONSTRAINTS r
  ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME AND r.TABLE_NAME=k.TABLE_NAME
WHERE k.REFERENCED_TABLE_SCHEMA=DATABASE()
  AND k.REFERENCED_TABLE_NAME IN ('document_admission_coordinators','document_delete_operations',
    'document_writer_operations','document_storage_io_steps','document_delete_file_manifest',
    'storage_namespaces','stored_file_namespace_bindings','document_delete_executions','document_delete_attempts')
  AND NOT (k.TABLE_SCHEMA=DATABASE() AND k.TABLE_NAME='stored_file_namespace_bindings'
    AND k.CONSTRAINT_NAME='fk_binding_namespace');

-- 06: Discover tracking candidates, without assuming table names or reading rows.
SELECT '06_tracking_candidates' AS inspection,TABLE_NAME,TABLE_TYPE,
       'UNVERIFIED - TABLE NAME IS NOT EXECUTION EVIDENCE' AS result
FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()
  AND (TABLE_NAME LIKE '%migration%' OR TABLE_NAME LIKE '%schema%version%' OR TABLE_NAME='system_metadata')
ORDER BY TABLE_NAME;

-- 07: Final interpretation. Section 03 is NOT a migration execution instruction.
SELECT '07_limits' AS inspection,
  'UNVERIFIED' AS runtime_and_history,
  'Review identity, grants, ALL/0001/0002 summaries, every non-MATCH row, collisions and external dependencies. Empty metadata is not proof without visibility. Expression variants outside the strict allowlist require manual comparison. No backup, data integrity, runtime, R2 access, historical binding or deployment verification was performed.' AS details;
