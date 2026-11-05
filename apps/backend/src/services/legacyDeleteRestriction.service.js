const { createRepository } = require('../repositories/documentDelete.repository');

const createOwnershipPreflight = ({ repository }) => async (connection, projectId, documentId) => {
  // Initial upload history must predate retained committed CREATE admissions;
  // the target must have neither a CREATE admission nor IO for the unbound file.
  // This relies on durable journals, not date or missing binding alone. No
  // corroborating history/boundary => generic restriction, never guess legacy.
  const historical = await repository.historicalUnboundFiles(connection, projectId, documentId);
  if (!historical.length) return { blocked: false };
  if ((await repository.unsettledWriters(connection, projectId, documentId)).length) return { blocked: false };
  let inventory;
  try {
    inventory = await createRepository({}).inventory(connection,
      { project_id: projectId, document_id: documentId }, { forBinding: true });
  } catch (error) {
    // This patch is not a second ownership gate. Non-legacy validation stays in
    // the existing Delete engine with its original statuses/security checks.
    if (error.pending) return { blocked: false };
    throw error;
  }
  const missing = inventory.files.filter(f => !inventory.bindings.some(b => b.file_id === f.file_id));
  return historical.some(h => missing.some(f => f.file_id === h.file_id))
    ? { blocked: true, reasonCode: 'LEGACY_STORAGE_OWNERSHIP_UNVERIFIED' } : { blocked: false };
};

module.exports = { createOwnershipPreflight };
