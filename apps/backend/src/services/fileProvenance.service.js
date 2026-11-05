const { digest, sameNamespace, pending } = require('../utils/storageNamespace');
const { validateStorageKey } = require('../validators/storage.validator');

const assertNamespace = (value) => {
  if (!value || !value.descriptor || JSON.stringify(value.descriptor) !== value.encoded
    || digest(value.encoded) !== value.id || value.descriptor.version !== 1
    || !['local', 'r2'].includes(value.descriptor.provider)) throw pending('NAMESPACE_INVALID');
};

const verifyFile = async (storage, captured, file) => {
  assertNamespace(captured);
  if (validateStorageKey(file.storage_key) !== file.storage_key) throw pending('FILE_PROVENANCE_CONFLICT');
  if (!/^[a-f0-9]{64}$/i.test(file.checksum || '')) throw pending('FILE_CHECKSUM_REQUIRED');
  if (!sameNamespace(await storage.captureNamespace(), captured)) throw pending('NAMESPACE_MISMATCH');
  const observed = await storage.inspectOwnedExact(file.storage_key, captured);
  if (!observed.exists) throw pending('FILE_MISSING');
  if (observed.size !== Number(file.file_size) || observed.sha256 !== file.checksum.toLowerCase()) {
    throw pending('FILE_CONTENT_MISMATCH');
  }
  if (captured.descriptor.provider === 'local' && (!observed.rootIdentity || !observed.identity)) {
    throw pending('LOCAL_IDENTITY_REQUIRED');
  }
  return { sha256: observed.sha256, size: observed.size,
    ...(captured.descriptor.provider === 'local' ? { localIdentity: Object.fromEntries(
      ['rootIdentity', 'identity', 'sha256', 'size'].map((key) => [key, observed[key]])
    ) } : {}) };
};

module.exports = { assertNamespace, verifyFile };
