const { digest, pending } = require('../utils/storageNamespace');

// No pool/config import: callers supply their existing business transaction.
const bindNewFile = async (connection, fileId, storageKey, captured) => {
  if (!captured) throw pending('NAMESPACE_INVALID');
  const [tables] = await connection.execute(`SELECT TABLE_NAME FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('storage_namespaces','stored_file_namespace_bindings')`);
  // A successful upload now requires the explicitly installed provenance schema.
  if (tables.length !== 2) throw pending('NAMESPACE_SCHEMA_INCOMPLETE');
  if (digest(captured.encoded) !== captured.id) throw pending('NAMESPACE_INVALID');
  await connection.execute(`INSERT INTO storage_namespaces (id,provider,descriptor,created_at)
    VALUES (?,?,?,UTC_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE id = id`,
  [captured.id, captured.descriptor.provider, captured.encoded]);
  const [[stored]] = await connection.execute('SELECT descriptor FROM storage_namespaces WHERE id = ?', [captured.id]);
  if (!stored || stored.descriptor !== captured.encoded) throw pending('NAMESPACE_CONFLICT');
  await connection.execute(`INSERT INTO stored_file_namespace_bindings
    (file_id,namespace_id,storage_key_snapshot,evidence,created_at) VALUES (?,?,?,?,UTC_TIMESTAMP(3))`,
  [fileId, captured.id, storageKey, JSON.stringify({ source: 'UPLOAD_ADAPTER_SNAPSHOT', version: 1 })]);
  return true;
};

const completeNewFile = async (connection, fileId, storage) => {
  const [[file]] = await connection.execute(`SELECT f.*, b.namespace_id, b.storage_key_snapshot,
    n.descriptor FROM stored_files f JOIN stored_file_namespace_bindings b ON b.file_id=f.file_id
    JOIN storage_namespaces n ON n.id=b.namespace_id WHERE f.file_id=?`, [fileId]);
  if (!file || file.storage_key !== file.storage_key_snapshot) throw pending('FILE_NAMESPACE_UNVERIFIED');
  const captured = { id: file.namespace_id, encoded: file.descriptor, descriptor: JSON.parse(file.descriptor) };
  const proof = await require('../services/fileProvenance.service').verifyFile(storage, captured, file);
  const [result] = await connection.execute(`UPDATE stored_file_namespace_bindings SET evidence=?
    WHERE file_id=? AND namespace_id=? AND storage_key_snapshot=?`,
  [JSON.stringify({ source: 'UPLOAD_ADAPTER_SNAPSHOT', version: 1, ...proof }), fileId, captured.id, file.storage_key]);
  if (result.affectedRows !== 1) throw pending('FILE_NAMESPACE_UNVERIFIED');
};

const prepareFileMove = async (connection, fileId, sourceKey, destinationKey, storage) => {
  const { validateStorageKey } = require('../validators/storage.validator');
  const { verifyFile } = require('../services/fileProvenance.service');
  if (validateStorageKey(sourceKey) !== sourceKey || validateStorageKey(destinationKey) !== destinationKey
    || sourceKey === destinationKey) throw pending('FILE_PROVENANCE_CONFLICT');
  const [[file]] = await connection.execute(`SELECT f.*, b.namespace_id, b.storage_key_snapshot, b.evidence,
    n.descriptor FROM stored_files f JOIN stored_file_namespace_bindings b ON b.file_id=f.file_id
    JOIN storage_namespaces n ON n.id=b.namespace_id WHERE f.file_id=? FOR UPDATE`, [fileId]);
  if (!file || file.storage_key !== sourceKey || file.storage_key_snapshot !== sourceKey) {
    throw pending('FILE_NAMESPACE_UNVERIFIED');
  }
  const captured = { id: file.namespace_id, encoded: file.descriptor, descriptor: JSON.parse(file.descriptor) };
  const previous = JSON.parse(file.evidence);
  const proof = await verifyFile(storage, captured, file);
  if (previous.sha256 !== proof.sha256 || previous.size !== proof.size
    || (captured.descriptor.provider === 'local' && (!previous.localIdentity
      || ['rootIdentity', 'identity', 'sha256', 'size'].some((key) => previous.localIdentity[key] !== proof.localIdentity[key])))) {
    throw pending('FILE_PROVENANCE_CONFLICT');
  }
  // Provisional destination evidence stays uncommitted until post-move completion succeeds.
  const [result] = await connection.execute(`UPDATE stored_file_namespace_bindings SET storage_key_snapshot=?,evidence=?
    WHERE file_id=? AND namespace_id=? AND storage_key_snapshot=?`,
  [destinationKey, JSON.stringify({ source: 'UPLOAD_ADAPTER_SNAPSHOT', version: 1 }), fileId, captured.id, sourceKey]);
  if (result.affectedRows !== 1) throw pending('FILE_NAMESPACE_UNVERIFIED');
};

module.exports = { bindNewFile, completeNewFile, prepareFileMove };
