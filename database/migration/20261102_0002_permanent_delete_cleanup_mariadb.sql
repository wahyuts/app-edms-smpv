-- Sprint B additive sidecars. MariaDB 10.4.32. Execute once on an approved target only.
-- No backfill, seed, business-row update or change to validated Sprint A DDL.
CREATE TABLE storage_namespaces (
  id CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  provider VARCHAR(16) NOT NULL,
  descriptor LONGTEXT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT chk_storage_namespace_provider CHECK (provider IN ('local','r2'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stored_file_namespace_bindings (
  file_id VARCHAR(64) NOT NULL,
  namespace_id CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  storage_key_snapshot VARCHAR(255) NOT NULL,
  evidence LONGTEXT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (file_id),
  KEY idx_file_namespace (namespace_id),
  CONSTRAINT fk_binding_namespace FOREIGN KEY (namespace_id) REFERENCES storage_namespaces(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE document_delete_executions (
  operation_id VARCHAR(64) NOT NULL,
  phase VARCHAR(32) NOT NULL,
  inventory LONGTEXT NOT NULL,
  manifest_digest CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  completion_snapshot LONGTEXT NULL,
  pending_reason VARCHAR(128) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (operation_id),
  CONSTRAINT chk_delete_execution_phase CHECK (phase IN ('MANIFEST_FINALIZED','COMPLETED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE document_delete_attempts (
  manifest_id VARCHAR(64) NOT NULL,
  attempt_id VARCHAR(64) NOT NULL,
  attempt_count INT UNSIGNED NOT NULL,
  state VARCHAR(16) NOT NULL,
  error_code VARCHAR(128) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (manifest_id),
  UNIQUE KEY uq_delete_attempt_id (attempt_id),
  CONSTRAINT chk_delete_attempt_state CHECK (state IN ('IN_FLIGHT','SUCCEEDED','UNKNOWN','REJECTED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
