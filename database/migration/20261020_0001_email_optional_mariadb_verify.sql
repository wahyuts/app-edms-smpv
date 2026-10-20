-- PHASE C1 / READ ONLY / NOT EXECUTED.
-- Run only after approval and migration, in the SAME approved local connection.
-- Writers remain paused. Session variables hold bounded byte snapshots, NOT backups.
-- No missing or truncated snapshot is allowed to produce an integrity PASS.
SELECT DATABASE() AS active_database, VERSION() AS database_version, CONNECTION_ID() AS connection_id;
SHOW CREATE TABLE edms_smpv_dev.users;
SELECT ENGINE, ROW_FORMAT, TABLE_COLLATION, CREATE_OPTIONS FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users';
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, CHARACTER_SET_NAME,
  COLLATION_NAME, EXTRA, IS_GENERATED, GENERATION_EXPRESSION, COLUMN_COMMENT
FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;
SELECT INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME, SUB_PART, INDEX_TYPE
FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;
SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'users';
SELECT * FROM information_schema.CHECK_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'users';
SELECT * FROM information_schema.KEY_COLUMN_USAGE WHERE
  (TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users')
  OR (REFERENCED_TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = 'users');
SELECT * FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE()
  AND (TABLE_NAME = 'users' OR REFERENCED_TABLE_NAME = 'users');
SELECT TRIGGER_NAME, ACTION_TIMING, EVENT_MANIPULATION, ACTION_STATEMENT
FROM information_schema.TRIGGERS WHERE EVENT_OBJECT_SCHEMA = DATABASE() AND EVENT_OBJECT_TABLE = 'users';

-- Keep the canonical expression for audit and a grammar self-check.
SET @memail_expected_expression = 'CASE         WHEN email IS NULL OR TRIM(email) = '''' THEN NULL         WHEN LOWER(TRIM(email)) COLLATE utf8mb4_bin IN (''wahyu.trisna100@gmail.com'', ''beta.int100@gmail.com'') THEN NULL         ELSE LOWER(TRIM(email))       END';
SET @memail_actual_expression = NULL;
SELECT GENERATION_EXPRESSION INTO @memail_actual_expression
FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'email_uniqueness_key';
-- Match a fixed CASE grammar, never normalize inside literals or discard grouping.
-- PCRE named subroutines allow only balanced wrappers around known expressions.
-- Keyword case/LOWER=LCASE, whitespace, and the exact email identifier are equivalent.
-- Only _utf8mb4 introducers on these ASCII literals are accepted; no other charset,
-- COLLATE replacement, branch/operator change, extra literal, or expression is allowed.
-- CHAR(92) constructs absolute anchors without sql_mode-dependent backslash escapes.
SET @memail_expression_pattern = CONCAT(
  '(?-ims)(?x)', CHAR(92), 'A[[:space:]]*(?&mcase)[[:space:]]*
  (?(DEFINE)
    (?<email> (?i:email)(?![[:alnum:]_$]) | (?i:`email`) | [(][[:space:]]*(?&email)[[:space:]]*[)] )
    (?<trim> (?i:trim)[[:space:]]*[(][[:space:]]*(?&email)[[:space:]]*[)] | [(][[:space:]]*(?&trim)[[:space:]]*[)] )
    (?<lower> (?i:lower|lcase)[[:space:]]*[(][[:space:]]*(?&trim)[[:space:]]*[)] | [(][[:space:]]*(?&lower)[[:space:]]*[)] )
    (?<nil> (?i:null)(?![[:alnum:]_$]) | [(][[:space:]]*(?&nil)[[:space:]]*[)] )
    (?<blank> (?:(?i:_utf8mb4)[[:space:]]*)?'''' | [(][[:space:]]*(?&blank)[[:space:]]*[)] )
    (?<one> (?:(?i:_utf8mb4)[[:space:]]*)?''wahyu[.]trisna100@gmail[.]com'' | [(][[:space:]]*(?&one)[[:space:]]*[)] )
    (?<two> (?:(?i:_utf8mb4)[[:space:]]*)?''beta[.]int100@gmail[.]com'' | [(][[:space:]]*(?&two)[[:space:]]*[)] )
    (?<isnull> (?&email)[[:space:]]*(?i:is)(?![[:alnum:]_$])[[:space:]]*(?i:null)(?![[:alnum:]_$]) | [(][[:space:]]*(?&isnull)[[:space:]]*[)] )
    (?<empty> (?&trim)[[:space:]]*=[[:space:]]*(?&blank) | [(][[:space:]]*(?&empty)[[:space:]]*[)] )
    (?<first> (?&isnull)[[:space:]]*(?i:or)(?![[:alnum:]_$])[[:space:]]*(?&empty) | [(][[:space:]]*(?&first)[[:space:]]*[)] )
    (?<binary> (?&lower)[[:space:]]*(?i:collate)(?![[:alnum:]_$])[[:space:]]*(?:(?i:utf8mb4_bin)(?![[:alnum:]_$])|(?i:`utf8mb4_bin`)) | [(][[:space:]]*(?&binary)[[:space:]]*[)] )
    (?<shared> (?&binary)[[:space:]]*(?i:in)(?![[:alnum:]_$])[[:space:]]*[(][[:space:]]*(?&one)[[:space:]]*,[[:space:]]*(?&two)[[:space:]]*[)] | [(][[:space:]]*(?&shared)[[:space:]]*[)] )
    (?<mcase> (?i:case)(?![[:alnum:]_$])[[:space:]]*(?i:when)(?![[:alnum:]_$])[[:space:]]*(?&first)[[:space:]]*(?i:then)(?![[:alnum:]_$])[[:space:]]*(?&nil)[[:space:]]*(?i:when)(?![[:alnum:]_$])[[:space:]]*(?&shared)[[:space:]]*(?i:then)(?![[:alnum:]_$])[[:space:]]*(?&nil)[[:space:]]*(?i:else)(?![[:alnum:]_$])[[:space:]]*(?&lower)[[:space:]]*(?i:end)(?![[:alnum:]_$]) | [(][[:space:]]*(?&mcase)[[:space:]]*[)] )
  )', CHAR(92), 'z'
);
SET @memail_expression_pass = IFNULL((
  OCTET_LENGTH(@memail_actual_expression) BETWEEN 1 AND 8192
  AND BINARY @memail_expected_expression REGEXP @memail_expression_pattern
  AND BINARY @memail_actual_expression REGEXP @memail_expression_pattern
), 0);
SET @memail_target_pass = IFNULL((DATABASE() = 'edms_smpv_dev'
  AND VERSION() LIKE '%MariaDB%' AND SUBSTRING_INDEX(VERSION(), '-', 1) = '10.4.32'
  AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users') = 13
  AND EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email' AND COLUMN_TYPE = 'varchar(255)'
    AND IS_NULLABLE = 'YES' AND IS_GENERATED = 'NEVER' AND COLLATION_NAME = 'utf8mb4_unicode_ci'
    AND EXTRA = '' AND COLUMN_COMMENT = '' AND (COLUMN_DEFAULT IS NULL OR COLUMN_DEFAULT = 'NULL'))
  AND EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_uniqueness_key' AND COLUMN_TYPE = 'varchar(255)'
    AND IS_GENERATED = 'ALWAYS' AND EXTRA IN ('STORED GENERATED', 'PERSISTENT', 'PERSISTENT GENERATED')
    AND COLLATION_NAME = 'utf8mb4_unicode_ci')
  AND @memail_expression_pass = 1
  AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND INDEX_NAME = 'uq_users_email_uniqueness_key') = 1
  AND EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND INDEX_NAME = 'uq_users_email_uniqueness_key' AND NON_UNIQUE = 0
    AND COLUMN_NAME = 'email_uniqueness_key' AND SUB_PART IS NULL AND INDEX_TYPE = 'BTREE')
  AND NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND INDEX_NAME = 'uq_users_email')
  AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_email') = 1
  AND EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_email' AND NON_UNIQUE = 1
    AND COLUMN_NAME = 'email' AND SUB_PART IS NULL AND INDEX_TYPE = 'BTREE')
  AND NOT EXISTS (SELECT 1 FROM information_schema.TRIGGERS WHERE EVENT_OBJECT_SCHEMA = DATABASE()
    AND EVENT_OBJECT_TABLE = 'users')
), 0);
SELECT CASE WHEN @memail_target_pass = 1 THEN 'STRUCTURE PASS'
  ELSE 'STOP - TARGET STRUCTURE OR EXPRESSION MISMATCH' END AS structure_verdict,
  @memail_actual_expression AS actual_generated_expression;

SELECT COUNT(*), COALESCE(SUM(OCTET_LENGTH(token)), 0) + IF(COUNT(*) = 0, 0, COUNT(*) - 1),
  COALESCE(GROUP_CONCAT(token ORDER BY BINARY token SEPARATOR '|'), '')
INTO @memail_after_users_count, @memail_after_users_bytes, @memail_after_users_snapshot
FROM (
  SELECT CONCAT_WS(':', IFNULL(HEX(id), '~'), IFNULL(HEX(user_code), '~'), IFNULL(HEX(username), '~'), IFNULL(HEX(full_name), '~'), IFNULL(HEX(email), '~'), IFNULL(HEX(department_id), '~'), IFNULL(HEX(department_name_snapshot), '~'), IFNULL(HEX(position), '~'), IFNULL(HEX(role_id), '~'), IFNULL(HEX(status), '~'), IFNULL(HEX(created_at), '~'), IFNULL(HEX(updated_at), '~')) AS token FROM edms_smpv_dev.users
) AS snapshot_rows;
SET @memail_after_users_complete = (@memail_after_users_bytes <= @@session.group_concat_max_len
  AND OCTET_LENGTH(@memail_after_users_snapshot) = @memail_after_users_bytes);

SELECT COUNT(*), COALESCE(SUM(OCTET_LENGTH(token)), 0) + IF(COUNT(*) = 0, 0, COUNT(*) - 1),
  COALESCE(GROUP_CONCAT(token ORDER BY BINARY token SEPARATOR '|'), '')
INTO @memail_after_meta_count, @memail_after_meta_bytes, @memail_after_meta_snapshot
FROM (
  SELECT CONCAT('C:', CONCAT_WS(':', IFNULL(HEX(COLUMN_NAME), '~'), IFNULL(HEX(ORDINAL_POSITION), '~'), IFNULL(HEX(COLUMN_TYPE), '~'), IFNULL(HEX(IS_NULLABLE), '~'), IFNULL(HEX(COLUMN_DEFAULT), '~'), IFNULL(HEX(CHARACTER_SET_NAME), '~'), IFNULL(HEX(COLLATION_NAME), '~'), IFNULL(HEX(EXTRA), '~'), IFNULL(HEX(COLUMN_COMMENT), '~'), IFNULL(HEX(IS_GENERATED), '~'), IFNULL(HEX(GENERATION_EXPRESSION), '~'))) AS token
  FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
    AND COLUMN_NAME NOT IN ('email', 'email_uniqueness_key')
  UNION ALL
  SELECT CONCAT('I:', CONCAT_WS(':', IFNULL(HEX(INDEX_NAME), '~'), IFNULL(HEX(NON_UNIQUE), '~'), IFNULL(HEX(SEQ_IN_INDEX), '~'), IFNULL(HEX(COLUMN_NAME), '~'), IFNULL(HEX(COLLATION), '~'), IFNULL(HEX(SUB_PART), '~'), IFNULL(HEX(INDEX_TYPE), '~'), IFNULL(HEX(INDEX_COMMENT), '~')))
  FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
    AND INDEX_NAME NOT IN ('uq_users_email', 'uq_users_email_uniqueness_key', 'idx_users_email')
  UNION ALL
  SELECT CONCAT('T:', CONCAT_WS(':', IFNULL(HEX(CONSTRAINT_NAME), '~'), IFNULL(HEX(CONSTRAINT_TYPE), '~')))
  FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
    AND CONSTRAINT_NAME NOT IN ('uq_users_email', 'uq_users_email_uniqueness_key')
  UNION ALL
  SELECT CONCAT('K:', CONCAT_WS(':', IFNULL(HEX(TABLE_SCHEMA), '~'), IFNULL(HEX(TABLE_NAME), '~'), IFNULL(HEX(CONSTRAINT_NAME), '~'), IFNULL(HEX(COLUMN_NAME), '~'), IFNULL(HEX(ORDINAL_POSITION), '~'), IFNULL(HEX(POSITION_IN_UNIQUE_CONSTRAINT), '~'), IFNULL(HEX(REFERENCED_TABLE_SCHEMA), '~'), IFNULL(HEX(REFERENCED_TABLE_NAME), '~'), IFNULL(HEX(REFERENCED_COLUMN_NAME), '~')))
  FROM information_schema.KEY_COLUMN_USAGE WHERE
    ((TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users') OR
      (REFERENCED_TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = 'users'))
    AND CONSTRAINT_NAME NOT IN ('uq_users_email', 'uq_users_email_uniqueness_key')
  UNION ALL
  SELECT CONCAT('R:', CONCAT_WS(':', IFNULL(HEX(CONSTRAINT_SCHEMA), '~'), IFNULL(HEX(TABLE_NAME), '~'), IFNULL(HEX(CONSTRAINT_NAME), '~'), IFNULL(HEX(UNIQUE_CONSTRAINT_SCHEMA), '~'), IFNULL(HEX(UNIQUE_CONSTRAINT_NAME), '~'), IFNULL(HEX(MATCH_OPTION), '~'), IFNULL(HEX(UPDATE_RULE), '~'), IFNULL(HEX(DELETE_RULE), '~'), IFNULL(HEX(REFERENCED_TABLE_NAME), '~')))
  FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND (TABLE_NAME = 'users' OR REFERENCED_TABLE_NAME = 'users')
  UNION ALL
  SELECT CONCAT('H:', CONCAT_WS(':', IFNULL(HEX(CONSTRAINT_NAME), '~'), IFNULL(HEX(CHECK_CLAUSE), '~')))
  FROM information_schema.CHECK_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
  UNION ALL
  SELECT CONCAT('B:', CONCAT_WS(':', IFNULL(HEX(ENGINE), '~'), IFNULL(HEX(ROW_FORMAT), '~'), IFNULL(HEX(TABLE_COLLATION), '~'), IFNULL(HEX(CREATE_OPTIONS), '~'), IFNULL(HEX(TABLE_COMMENT), '~')))
  FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
) AS snapshot_rows;
SET @memail_after_meta_complete = (@memail_after_meta_bytes <= @@session.group_concat_max_len
  AND OCTET_LENGTH(@memail_after_meta_snapshot) = @memail_after_meta_bytes);

SET @memail_snapshot_available = IFNULL((
  @memail_baseline_pass = 1 AND @memail_before_database = DATABASE()
  AND @memail_before_connection = CONNECTION_ID() AND @memail_before_version = VERSION()
  AND BINARY @memail_before_mode = BINARY @@sql_mode
  AND @memail_before_users_complete = 1 AND @memail_before_meta_complete = 1
  AND @memail_before_users_snapshot IS NOT NULL AND @memail_before_meta_snapshot IS NOT NULL
  AND @memail_after_users_complete = 1 AND @memail_after_meta_complete = 1
), 0);
SET @memail_data_pass = IFNULL((@memail_snapshot_available = 1
  AND @memail_before_users_count = @memail_after_users_count
  AND @memail_before_users_bytes = @memail_after_users_bytes
  AND BINARY @memail_before_users_snapshot = BINARY @memail_after_users_snapshot), 0);
SET @memail_constraints_pass = IFNULL((@memail_snapshot_available = 1
  AND @memail_before_meta_count = @memail_after_meta_count
  AND @memail_before_meta_bytes = @memail_after_meta_bytes
  AND BINARY @memail_before_meta_snapshot = BINARY @memail_after_meta_snapshot), 0);
SELECT @memail_before_users_count AS users_before, @memail_after_users_count AS users_after,
  CASE WHEN @memail_snapshot_available <> 1 THEN 'NOT VERIFIED - SNAPSHOT MISSING, TRUNCATED OR SESSION CHANGED'
    WHEN @memail_data_pass = 1 THEN 'PASS - ORIGINAL USER ROWS AND EMAIL BYTES UNCHANGED'
    ELSE 'STOP - USER DATA MISMATCH' END AS data_integrity,
  CASE WHEN @memail_snapshot_available <> 1 THEN 'NOT VERIFIED - SNAPSHOT UNAVAILABLE'
    WHEN @memail_constraints_pass = 1 THEN 'PASS - OTHER COLUMNS, INDEXES AND CONSTRAINTS UNCHANGED'
    ELSE 'STOP - OTHER SCHEMA METADATA CHANGED' END AS constraints_integrity;

-- Every diagnostic below MUST return no rows.
SELECT email_uniqueness_key, COUNT(*) AS total FROM edms_smpv_dev.users
WHERE email_uniqueness_key IS NOT NULL GROUP BY email_uniqueness_key HAVING COUNT(*) > 1;
SELECT LOWER(TRIM(email)) COLLATE utf8mb4_unicode_ci AS ordinary_email, COUNT(*) AS total
FROM edms_smpv_dev.users WHERE email IS NOT NULL AND TRIM(email) <> ''
  AND LOWER(TRIM(email)) COLLATE utf8mb4_bin NOT IN ('wahyu.trisna100@gmail.com', 'beta.int100@gmail.com')
GROUP BY LOWER(TRIM(email)) COLLATE utf8mb4_unicode_ci HAVING COUNT(*) > 1;
SELECT id, email, email_uniqueness_key FROM edms_smpv_dev.users
WHERE NOT (HEX(email_uniqueness_key) <=> HEX(CASE
        WHEN email IS NULL OR TRIM(email) = '' THEN NULL
        WHEN LOWER(TRIM(email)) COLLATE utf8mb4_bin IN ('wahyu.trisna100@gmail.com', 'beta.int100@gmail.com') THEN NULL
        ELSE LOWER(TRIM(email))
      END));
SELECT id, HEX(user_code) AS user_code_bytes, HEX(username) AS username_bytes,
  HEX(full_name) AS full_name_bytes, HEX(email) AS email_bytes
FROM edms_smpv_dev.users ORDER BY id;

SET @memail_values_pass = NOT EXISTS (SELECT 1 FROM edms_smpv_dev.users
  WHERE NOT (HEX(email_uniqueness_key) <=> HEX(CASE
        WHEN email IS NULL OR TRIM(email) = '' THEN NULL
        WHEN LOWER(TRIM(email)) COLLATE utf8mb4_bin IN ('wahyu.trisna100@gmail.com', 'beta.int100@gmail.com') THEN NULL
        ELSE LOWER(TRIM(email))
      END)));
SELECT CASE WHEN @memail_target_pass = 1 AND @memail_data_pass = 1
    AND @memail_constraints_pass = 1 AND @memail_values_pass = 1
  THEN 'VERIFICATION PASS - RUNTIME UAT STILL REQUIRED'
  ELSE 'STOP - VERIFICATION INCOMPLETE OR FAILED' END AS final_verdict;
