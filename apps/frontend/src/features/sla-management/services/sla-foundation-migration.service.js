import {
  DocumentPersistenceRepository,
  DocumentRepository,
  MetadataRepository,
} from "@/features/document-register/repositories/document.repository";

import { SlaEngineService } from "./sla-engine.service";

const SLA_MIGRATION_KEY = "slaFoundationMigrationVersion";
const SLA_MIGRATION_VERSION = 1;

const initialize = async () => {
  const migrationMetadata = await MetadataRepository.getById(SLA_MIGRATION_KEY);

  if (migrationMetadata?.value === SLA_MIGRATION_VERSION) {
    return { migrated: false, version: SLA_MIGRATION_VERSION };
  }

  const documents = await DocumentRepository.getAll();
  const migratedDocuments = documents.map((document) => ({
    ...document,
    ...SlaEngineService.getInitialPersistenceFields(document),
  }));

  await DocumentPersistenceRepository.runSlaFoundationMigration({
    documents: migratedDocuments,
    metadata: { key: SLA_MIGRATION_KEY, value: SLA_MIGRATION_VERSION },
  });

  return { migrated: true, version: SLA_MIGRATION_VERSION };
};

export const SlaFoundationMigrationService = { initialize };

export default SlaFoundationMigrationService;
