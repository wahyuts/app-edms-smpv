const { validateStorageKey, validateProjectCode, validateDocumentCode } = require('../validators/storage.validator');
const { pending, sameNamespace } = require('./storageNamespace');

const validateDocumentPrefix = (prefix) => {
  if (typeof prefix !== 'string' || !prefix.endsWith('/')) throw pending('FOLDER_SCOPE_INVALID');
  const key = prefix.slice(0, -1);
  if (validateStorageKey(key) !== key) throw pending('FOLDER_SCOPE_INVALID');
  const parts = key.split('/');
  if (parts.length !== 4 || parts[0] !== 'projects' || parts[2] !== 'documents') throw pending('FOLDER_SCOPE_INVALID');
  validateProjectCode(parts[1]); validateDocumentCode(parts[3]);
  return key;
};

const deriveFolderTargets = (inventory) => {
  if (!inventory.manifest?.length) throw pending('FOLDER_PROVENANCE_REQUIRED');
  const result = new Map();
  for (const file of inventory.manifest) {
    const prefix = file.key.split('/').slice(0, 4).join('/') + '/';
    validateDocumentPrefix(prefix);
    if (!file.key.startsWith(prefix) || prefix.split('/')[3] !== inventory.document.document_number) throw pending('FOLDER_OWNERSHIP_AMBIGUOUS');
    const identity = JSON.stringify([file.namespace.id, prefix]);
    if (!result.has(identity)) result.set(identity, { namespace: file.namespace, prefix, fileKeys: [],
      ...(file.localIdentity ? { rootIdentity: file.localIdentity.rootIdentity } : {}) });
    const target = result.get(identity);
    if (!sameNamespace(target.namespace, file.namespace) || target.rootIdentity !== file.localIdentity?.rootIdentity) throw pending('FOLDER_OWNERSHIP_AMBIGUOUS');
    target.fileKeys.push(file.key);
  }
  return [...result.values()].sort((a, b) => JSON.stringify([a.namespace.id, a.prefix]).localeCompare(JSON.stringify([b.namespace.id, b.prefix])));
};

module.exports = { validateDocumentPrefix, deriveFolderTargets };
