const { createRepository } = require('../repositories/documentDelete.repository');
const { sameNamespace } = require('../utils/storageNamespace');

const OWNERSHIP_REASONS = new Set(['FILE_NAMESPACE_UNVERIFIED', 'NAMESPACE_INVALID',
  'FILE_PROVENANCE_CONFLICT', 'LOCAL_IDENTITY_MISMATCH', 'LEGACY_REFERENCE_AMBIGUOUS',
  'SHARED_FILE_REFERENCE', 'SHARED_STORAGE_KEY', 'FILE_RELATION_MISSING', 'ACTIVE_FILE_MISMATCH',
  'CROSS_DOCUMENT_REFERENCE', 'CHILD_OWNERSHIP_AMBIGUOUS', 'UNREVIEWED_STORAGE_KEY']);

// Called under the coordinator lock, before a new reservation. No storage writes.
const createEligibilityPreflight = ({ repository = createRepository({}), storage } = {}) => async (connection, projectId, documentId) => {
  let inventory;
  try { inventory = await repository.inventory(connection, { project_id: projectId, document_id: documentId }); }
  catch (error) {
    if (error.pending && OWNERSHIP_REASONS.has(error.code)) return { blocked: true, reasonCode: 'DELETE_OWNERSHIP_UNVERIFIED' };
    throw error; // SQL/timeouts and unrelated failures are not historical evidence.
  }
  if (!inventory.files.length) return { blocked: true, reasonCode: 'DELETE_OWNERSHIP_UNVERIFIED' };
  if (storage) {
    const current = await storage.captureNamespace();
    if (inventory.manifest.some(entry => !sameNamespace(current, entry.namespace))) {
      return { blocked: true, reasonCode: 'DELETE_OWNERSHIP_UNVERIFIED' };
    }
  }
  for (const file of inventory.files) {
    const binding = inventory.bindings.find(value => value.file_id === file.file_id);
    let evidence;
    try { evidence = typeof binding?.evidence === 'string' ? JSON.parse(binding.evidence) : binding?.evidence; }
    catch { evidence = null; }
    if (!evidence || !/^[a-f0-9]{64}$/i.test(file.checksum || '')
      || evidence.sha256 !== file.checksum || !Number.isSafeInteger(evidence.size)
      || evidence.size < 0 || evidence.size !== Number(file.file_size)
      || (inventory.manifest.some(entry => entry.namespace.descriptor.provider === 'local'
        && entry.fileIds.includes(file.file_id)) && (!evidence.localIdentity?.rootIdentity || !evidence.localIdentity?.identity))) {
      return { blocked: true, reasonCode: 'DELETE_OWNERSHIP_UNVERIFIED' };
    }
  }
  return { blocked: false };
};

module.exports = { createEligibilityPreflight };
