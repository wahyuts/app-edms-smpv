const { deriveFolderTargets } = require('../utils/documentFolder');
const { digest, pending } = require('../utils/storageNamespace');

const createFolderPlan = async (inventory, storage) => {
  if (typeof storage?.inspectDocumentFolders !== 'function') throw pending('FOLDER_INSPECTOR_UNAVAILABLE');
  const plans = [];
  for (const target of deriveFolderTargets(inventory)) {
    const observed = await storage.inspectDocumentFolders(target.prefix, target.namespace);
    if (target.namespace.descriptor.provider === 'local' && (!target.rootIdentity || observed.rootIdentity !== target.rootIdentity)) {
      throw pending('FOLDER_ROOT_IDENTITY_MISMATCH');
    }
    const unknown = observed.objects.filter((o) => !target.fileKeys.includes(typeof o === 'string' ? o : o.key));
    if (unknown.length) throw pending('FOLDER_UNKNOWN_OBJECT');
    plans.push({ ...target, observed });
  }
  return { version: 1, state: 'PREPARED', plans, planDigest: digest(JSON.stringify(plans)) };
};

const cleanupFolderPlan = async (value, storage) => {
  if (!value || value.version !== 1 || !value.plans?.length || value.planDigest !== digest(JSON.stringify(value.plans))) {
    throw pending('FOLDER_PROVENANCE_REQUIRED');
  }
  if (typeof storage?.cleanupDocumentFolders !== 'function') throw pending('FOLDER_CLEANUP_UNAVAILABLE');
  for (const plan of value.plans) {
    const result = await storage.cleanupDocumentFolders(plan);
    if (result?.clean !== true) throw pending('FOLDER_CLEANUP_INCOMPLETE');
    const after = await storage.inspectDocumentFolders(plan.prefix, plan.namespace);
    if (after.exists || after.objects.length || (plan.rootIdentity && after.rootIdentity !== plan.rootIdentity)) {
      throw pending('FOLDER_CLEANUP_INCOMPLETE');
    }
  }
};

module.exports = { createFolderPlan, cleanupFolderPlan };
