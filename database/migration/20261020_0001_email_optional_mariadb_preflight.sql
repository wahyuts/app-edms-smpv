-- PHASE C1 / PREPARED ONLY / NOT EXECUTED.
-- Target ONLY: XAMPP local MariaDB 10.4.32, edms_smpv_dev.
-- Explicit approval required before running even this read-only preflight.
-- Stop on any SQL error. Do not run the complete directory or concatenate scripts.
-- Session SET/SELECT INTO below affect only connection memory, never schema/data.
-- Preserve the SAME connection, paused writers and exported results through verification.
SELECT DATABASE() AS active_database, VERSION() AS database_version,
  @@version_comment AS database_engine, @@hostname AS server_host, @@port AS server_port,
  CONNECTION_ID() AS connection_id, @@sql_mode AS sql_mode,
  @@innodb_page_size AS innodb_page_size, @@innodb_strict_mode AS innodb_strict_mode,
  @@session.group_concat_max_len AS snapshot_capacity;
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

-- All returned invalid/duplicate rows require review, not automatic repair.
SELECT COUNT(*) AS existing_users FROM edms_smpv_dev.users;
SELECT id, email, HEX(email) AS email_bytes FROM edms_smpv_dev.users
WHERE email IS NULL OR email = '' OR email REGEXP '[[:space:]]'
  OR email NOT REGEXP '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$';
SELECT LOWER(TRIM(email)) COLLATE utf8mb4_unicode_ci AS normalized_email, COUNT(*) AS total
FROM edms_smpv_dev.users
WHERE LOWER(TRIM(email)) COLLATE utf8mb4_bin NOT IN ('wahyu.trisna100@gmail.com', 'beta.int100@gmail.com')
GROUP BY LOWER(TRIM(email)) COLLATE utf8mb4_unicode_ci HAVING COUNT(*) > 1;

-- Reset this package's prior session evidence before taking fresh snapshots.
SET @memail_before_database = DATABASE(), @memail_before_connection = CONNECTION_ID(),
  @memail_before_version = VERSION(), @memail_before_mode = @@sql_mode;
SELECT COUNT(*), COALESCE(SUM(OCTET_LENGTH(token)), 0) + IF(COUNT(*) = 0, 0, COUNT(*) - 1),
  COALESCE(GROUP_CONCAT(token ORDER BY BINARY token SEPARATOR '|'), '')
INTO @memail_before_users_count, @memail_before_users_bytes, @memail_before_users_snapshot
FROM (
  SELECT CONCAT_WS(':', IFNULL(HEX(id), '~'), IFNULL(HEX(user_code), '~'), IFNULL(HEX(username), '~'), IFNULL(HEX(full_name), '~'), IFNULL(HEX(email), '~'), IFNULL(HEX(department_id), '~'), IFNULL(HEX(department_name_snapshot), '~'), IFNULL(HEX(position), '~'), IFNULL(HEX(role_id), '~'), IFNULL(HEX(status), '~'), IFNULL(HEX(created_at), '~'), IFNULL(HEX(updated_at), '~')) AS token FROM edms_smpv_dev.users
) AS snapshot_rows;
SET @memail_before_users_complete = (@memail_before_users_bytes <= @@session.group_concat_max_len
  AND OCTET_LENGTH(@memail_before_users_snapshot) = @memail_before_users_bytes);

SELECT COUNT(*), COALESCE(SUM(OCTET_LENGTH(token)), 0) + IF(COUNT(*) = 0, 0, COUNT(*) - 1),
  COALESCE(GROUP_CONCAT(token ORDER BY BINARY token SEPARATOR '|'), '')
INTO @memail_before_meta_count, @memail_before_meta_bytes, @memail_before_meta_snapshot
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
SET @memail_before_meta_complete = (@memail_before_meta_bytes <= @@session.group_concat_max_len
  AND OCTET_LENGTH(@memail_before_meta_snapshot) = @memail_before_meta_bytes);

SET @memail_baseline_pass = IFNULL((
  DATABASE() = 'edms_smpv_dev'
  AND VERSION() LIKE '%MariaDB%'
  AND SUBSTRING_INDEX(VERSION(), '-', 1) = '10.4.32'
  AND @@innodb_page_size >= 8192
  AND @@innodb_strict_mode = 1
  AND (@@sql_mode LIKE '%STRICT_TRANS_TABLES%' OR @@sql_mode LIKE '%STRICT_ALL_TABLES%')
  AND @@sql_mode NOT LIKE '%ORACLE%' AND @@sql_mode NOT LIKE '%EMPTY_STRING_IS_NULL%'
  AND @@sql_mode NOT LIKE '%NO_FIELD_OPTIONS%' AND @@sql_mode NOT LIKE '%NO_KEY_OPTIONS%'
  AND @@sql_mode NOT LIKE '%NO_TABLE_OPTIONS%'
  AND EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND ENGINE = 'InnoDB' AND ROW_FORMAT IN ('Dynamic', 'Compressed')
    AND TABLE_COLLATION = 'utf8mb4_unicode_ci' AND CREATE_OPTIONS NOT LIKE '%partitioned%')
  AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users') = 12
  AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND COLUMN_NAME IN
      ('id','user_code','username','full_name','email','department_id','department_name_snapshot',
       'position','role_id','status','created_at','updated_at')) = 12
  AND EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email' AND DATA_TYPE = 'varchar'
    AND CHARACTER_MAXIMUM_LENGTH = 255 AND IS_NULLABLE = 'NO' AND IS_GENERATED = 'NEVER'
    AND CHARACTER_SET_NAME = 'utf8mb4' AND COLLATION_NAME = 'utf8mb4_unicode_ci'
    AND EXTRA = '' AND COLUMN_DEFAULT IS NULL AND COLUMN_COMMENT = '')
  AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND INDEX_NAME = 'uq_users_email') = 1
  AND EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND INDEX_NAME = 'uq_users_email' AND NON_UNIQUE = 0
    AND COLUMN_NAME = 'email' AND SUB_PART IS NULL AND INDEX_TYPE = 'BTREE')
  AND NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND NON_UNIQUE = 0 AND COLUMN_NAME = 'email' AND INDEX_NAME <> 'uq_users_email')
  AND NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_uniqueness_key')
  AND NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND INDEX_NAME IN ('uq_users_email_uniqueness_key', 'idx_users_email'))
  AND NOT EXISTS (SELECT 1 FROM information_schema.TRIGGERS WHERE EVENT_OBJECT_SCHEMA = DATABASE()
    AND EVENT_OBJECT_TABLE = 'users')
  AND NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE
    (REFERENCED_TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = 'users' AND REFERENCED_COLUMN_NAME = 'email')
    OR (TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email' AND REFERENCED_TABLE_NAME IS NOT NULL))
  AND NOT EXISTS (SELECT 1 FROM information_schema.CHECK_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND CHECK_CLAUSE REGEXP '(^|[^[:alnum:]_])email([^[:alnum:]_]|$)')
  AND NOT EXISTS (SELECT 1 FROM edms_smpv_dev.users WHERE email IS NULL OR email = ''
    OR email REGEXP '[[:space:]]'
    OR email NOT REGEXP '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')
  AND NOT EXISTS (SELECT 1 FROM edms_smpv_dev.users
    WHERE LOWER(TRIM(email)) COLLATE utf8mb4_bin NOT IN ('wahyu.trisna100@gmail.com', 'beta.int100@gmail.com')
    GROUP BY LOWER(TRIM(email)) COLLATE utf8mb4_unicode_ci HAVING COUNT(*) > 1)
  AND @memail_before_users_complete = 1 AND @memail_before_meta_complete = 1
), 0);
SELECT CASE WHEN @memail_baseline_pass = 1 THEN 'BASELINE PASS'
  ELSE 'STOP — BASELINE INCOMPATIBLE' END AS verdict,
  @memail_before_users_complete AS user_snapshot_complete,
  @memail_before_meta_complete AS metadata_snapshot_complete,
  @memail_before_users_bytes AS user_snapshot_required_bytes,
  @memail_before_meta_bytes AS metadata_snapshot_required_bytes;
-- Export byte-level user evidence separately; session snapshots are NOT backups.
SELECT id, HEX(user_code) AS user_code_bytes, HEX(username) AS username_bytes,
  HEX(full_name) AS full_name_bytes, HEX(email) AS email_bytes
FROM edms_smpv_dev.users ORDER BY id;
-- A PASS is only a baseline assessment. Migration still needs separate approval/backup.
