-- READ ONLY. Run in the same intended environment after the reviewed migration.
SELECT DATABASE() AS active_database, VERSION() AS database_version;

SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT,
  CASE WHEN DATA_TYPE='varchar' AND CHARACTER_MAXIMUM_LENGTH=50
    AND IS_NULLABLE='YES' AND (COLUMN_DEFAULT IS NULL
      OR CAST(COLUMN_DEFAULT AS BINARY)=CAST('NULL' AS BINARY))
    THEN 'STRUCTURE MATCH' ELSE 'STRUCTURE MISMATCH' END AS column_verdict
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='engineering_documents' AND COLUMN_NAME='rev';
-- No row above means the column is missing. Immediately after migration, before
-- any new application writes, populated_rev must be 0. This is not a data backup.
SELECT COUNT(*) AS total_documents,
  SUM(CASE WHEN rev IS NULL THEN 1 ELSE 0 END) AS null_rev,
  SUM(CASE WHEN rev IS NOT NULL THEN 1 ELSE 0 END) AS populated_rev
FROM engineering_documents;
