-- READ ONLY / NOT EXECUTED. Run in preflight connection with writes still paused.
SELECT DATABASE() AS active_database, VERSION() AS database_version;
SHOW CREATE TABLE users;
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLLATION_NAME, EXTRA, GENERATION_EXPRESSION
FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
  AND COLUMN_NAME IN ('email', 'email_uniqueness_key');
SELECT INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME, SUB_PART
FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
  AND INDEX_NAME IN ('uq_users_email', 'uq_users_email_uniqueness_key', 'idx_users_email');

SELECT CASE WHEN
  EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email' AND IS_NULLABLE = 'YES'
    AND COLUMN_TYPE = 'varchar(255)' AND COLLATION_NAME = 'utf8mb4_unicode_ci')
  AND EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_uniqueness_key' AND EXTRA = 'STORED GENERATED'
    AND COLUMN_TYPE = 'varchar(255)' AND COLLATION_NAME = 'utf8mb4_unicode_ci')
  AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND INDEX_NAME = 'uq_users_email_uniqueness_key') = 1
  AND EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND INDEX_NAME = 'uq_users_email_uniqueness_key'
    AND NON_UNIQUE = 0 AND COLUMN_NAME = 'email_uniqueness_key' AND SUB_PART IS NULL)
  AND NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND INDEX_NAME = 'uq_users_email')
  AND EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_email' AND NON_UNIQUE = 1 AND COLUMN_NAME = 'email' AND SUB_PART IS NULL)
  THEN 'STRUCTURE PASS - inspect generation expression against migration' ELSE 'STOP - structure mismatch' END AS structure_check;

SELECT COUNT(*) AS users_after, @email_before_count AS users_before,
  CASE WHEN @email_before_snapshot IS NULL OR @email_before_database IS NULL
    THEN 'NOT VERIFIED - compare exported preflight snapshot'
    WHEN @email_before_database = DATABASE() AND COUNT(*) = @email_before_count
      AND JSON_CONTAINS(@email_before_snapshot, COALESCE(JSON_OBJECTAGG(CAST(id AS CHAR), HEX(email)), JSON_OBJECT()))
      AND JSON_CONTAINS(COALESCE(JSON_OBJECTAGG(CAST(id AS CHAR), HEX(email)), JSON_OBJECT()), @email_before_snapshot)
    THEN 'PASS - identical user ids and email bytes' ELSE 'STOP - user/email data differs' END AS data_preservation
FROM users;

-- Must return no rows.
SELECT email_uniqueness_key, COUNT(*) AS total FROM users
WHERE email_uniqueness_key IS NOT NULL GROUP BY email_uniqueness_key HAVING COUNT(*) > 1;
SELECT id FROM users WHERE NOT (email_uniqueness_key <=> CASE
  WHEN email IS NULL OR TRIM(email) = '' THEN NULL
  WHEN LOWER(TRIM(email)) COLLATE utf8mb4_bin IN ('wahyu.trisna100@gmail.com', 'beta.int100@gmail.com') THEN NULL
  ELSE LOWER(TRIM(email)) END);
