-- MySQL canonical variant. CHECK enforcement requires MySQL 8.0.16+.
-- Current Railway version/runtime NOT VERIFIED; no remote execution authorized.
-- Execute exactly ONE engine variant on an explicitly verified target.
-- Additive DDL; implicit commit; not rerunnable; no startup/build integration.
CREATE TABLE document_admission_coordinators (
  project_id VARCHAR(64) NOT NULL,
  document_id VARCHAR(64) NOT NULL,
  gate_state VARCHAR(16) NOT NULL DEFAULT 'OPEN',
  generation BIGINT UNSIGNED NOT NULL DEFAULT 1,
  delete_operation_id VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (project_id, document_id),
  CONSTRAINT chk_document_admission_gate CHECK (gate_state IN ('OPEN', 'CLOSED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE document_delete_operations (
  id VARCHAR(64) NOT NULL,
  project_id VARCHAR(64) NOT NULL,
  document_id VARCHAR(64) NOT NULL,
  document_number_snapshot VARCHAR(255) NOT NULL,
  initiated_by_user_id BIGINT UNSIGNED NOT NULL,
  reason TEXT NULL,
  request_identity CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'QUIESCENCE_PENDING',
  pending_metadata LONGTEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_document_delete_identity (project_id, document_id, request_identity),
  UNIQUE KEY uq_document_delete_target (project_id, document_id),
  KEY idx_document_delete_pending (status, created_at),
  CONSTRAINT chk_document_delete_status CHECK (status IN ('QUIESCENCE_PENDING', 'QUIESCENCE_CONFIRMED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE document_writer_operations (
  id VARCHAR(64) NOT NULL,
  project_id VARCHAR(64) NULL,
  document_id VARCHAR(64) NULL,
  writer_type VARCHAR(64) NOT NULL,
  generation BIGINT UNSIGNED NOT NULL,
  lifecycle_state VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  db_outcome VARCHAR(16) NOT NULL DEFAULT 'NOT_STARTED',
  temporary_file_id VARCHAR(64) NULL,
  active_temporary_file_id VARCHAR(64) GENERATED ALWAYS AS
    (CASE WHEN lifecycle_state <> 'SETTLED' THEN temporary_file_id ELSE NULL END) STORED,
  completion_evidence LONGTEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_document_writer_temporary_claim (active_temporary_file_id),
  KEY idx_document_writer_target (project_id, document_id, lifecycle_state),
  CONSTRAINT chk_document_writer_lifecycle CHECK (lifecycle_state IN ('ACTIVE', 'SETTLED', 'UNRESOLVED')),
  CONSTRAINT chk_document_writer_db CHECK (db_outcome IN ('NOT_STARTED', 'IN_PROGRESS', 'COMMITTED', 'ROLLED_BACK', 'UNKNOWN')),
  CONSTRAINT chk_document_writer_scope CHECK
    ((project_id IS NOT NULL AND document_id IS NOT NULL) OR
     (project_id IS NULL AND document_id IS NULL AND temporary_file_id IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE document_storage_io_steps (
  id VARCHAR(64) NOT NULL,
  writer_id VARCHAR(64) NOT NULL,
  provider VARCHAR(16) NOT NULL,
  operation_type VARCHAR(32) NOT NULL,
  source_key TEXT NULL,
  destination_key TEXT NULL,
  state VARCHAR(16) NOT NULL,
  evidence LONGTEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_document_io_writer (writer_id, state),
  CONSTRAINT chk_document_io_state CHECK (state IN ('IN_FLIGHT', 'SUCCEEDED', 'UNKNOWN'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE document_delete_file_manifest (
  id VARCHAR(64) NOT NULL,
  delete_operation_id VARCHAR(64) NOT NULL,
  file_reference VARCHAR(64) NULL,
  provider VARCHAR(16) NOT NULL,
  exact_storage_key TEXT NOT NULL,
  storage_key_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  ownership_evidence LONGTEXT NOT NULL,
  cleanup_state VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_document_manifest_key (delete_operation_id, provider, storage_key_hash),
  CONSTRAINT chk_document_manifest_state CHECK (cleanup_state IN ('PENDING', 'DELETED', 'FAILED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- No FK to business tables: evidence must survive the Sprint B business-row deletion.
-- IO steps intentionally have no FK requiring a lock on an in-flight writer row:
-- independent evidence persistence must not wait for the business transaction's writer lock.
