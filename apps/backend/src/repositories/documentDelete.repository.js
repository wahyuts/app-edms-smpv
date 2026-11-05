const { randomUUID } = require('node:crypto');
const { digest, pending, isCancelledDelete } = require('../utils/storageNamespace');
const { validateStorageKey } = require('../validators/storage.validator');
const { captureRecipients } = require('./documentDeleteNotification.repository');

const rows = async (c, sql, values = []) => (await c.execute(sql, values))[0];
const parse = (value) => typeof value === 'string' ? JSON.parse(value) : value;
const scopeRows = (items, op) => {
  if (items.some((row) => row.document_id !== op.document_id || row.project_id !== op.project_id)) {
    throw pending('CROSS_DOCUMENT_REFERENCE');
  }
};
const placeholders = (values) => values.map(() => '?').join(',');
const byIds = (c, table, column, ids) => ids.length
  ? rows(c, `SELECT * FROM ${table} WHERE ${column} IN (${placeholders(ids)}) ORDER BY ${column}`, ids) : [];

const createRepository = ({ coordination, storage }) => {
  const lockOperation = async (c, id) => {
    const [op] = await rows(c, 'SELECT * FROM document_delete_operations WHERE id = ?', [id]);
    if (!op) throw pending('DELETE_OPERATION_NOT_FOUND');
    if (isCancelledDelete(op)) throw pending('DELETE_RESERVATION_CANCELLED');
    const gate = await coordination.lockGate(c, { projectId: op.project_id, documentId: op.document_id });
    if (gate.gate_state !== 'CLOSED' || gate.delete_operation_id !== id) throw pending('DELETE_GATE_INVALID');
    const [locked] = await rows(c, 'SELECT * FROM document_delete_operations WHERE id = ? FOR UPDATE', [id]);
    if (locked.status !== 'QUIESCENCE_CONFIRMED') throw pending('QUIESCENCE_NOT_CONFIRMED');
    const writers = await rows(c, `SELECT id FROM document_writer_operations WHERE project_id=? AND document_id=?
      AND (lifecycle_state <> 'SETTLED' OR completion_evidence IS NULL OR db_outcome NOT IN ('NOT_STARTED','COMMITTED','ROLLED_BACK'))`,
    [op.project_id, op.document_id]);
    const io = await rows(c, `SELECT s.id FROM document_storage_io_steps s JOIN document_writer_operations w ON w.id=s.writer_id
      WHERE w.project_id=? AND w.document_id=? AND s.state <> 'SUCCEEDED'`, [op.project_id, op.document_id]);
    if (writers.length || io.length) throw pending('WRITER_NOT_SETTLED');
    return locked;
  };

  const inventory = async (c, op, { forBinding = false } = {}) => {
    const dependencies = await rows(c, `SELECT TABLE_NAME, REFERENCED_TABLE_NAME FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IN
      ('engineering_documents','stored_files','document_revisions','workflow_comments','workflow_attachments','document_history','comment_read_receipts','document_sla_evaluations')`);
    const known = new Set(['engineering_documents','stored_files','document_revisions','workflow_comments',
      'workflow_attachments','document_history','comment_read_receipts','document_sla_evaluations']);
    if (dependencies.some((r) => !known.has(r.TABLE_NAME))) throw pending('UNREVIEWED_DOCUMENT_DEPENDENCY');
    const directTables = await rows(c, `SELECT TABLE_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA=DATABASE() AND COLUMN_NAME='document_id'`);
    const technical = new Set(['document_admission_coordinators','document_delete_operations','document_writer_operations']);
    if (directTables.some((r) => !known.has(r.TABLE_NAME) && !technical.has(r.TABLE_NAME))) throw pending('UNREVIEWED_DOCUMENT_DEPENDENCY');
    const temporary = await rows(c, `SELECT t.id FROM temporary_uploads t JOIN document_writer_operations w
      ON w.temporary_file_id=t.temporary_file_id WHERE w.project_id=? AND w.document_id=?`, [op.project_id, op.document_id]);
    if (temporary.length) throw pending('TEMPORARY_OWNERSHIP_UNRESOLVED');
    const [document] = await rows(c, 'SELECT * FROM engineering_documents WHERE id=? AND project_id=?', [op.document_id, op.project_id]);
    if (!document) throw pending('DOCUMENT_MISSING_WITHOUT_COMPLETION');
    const tables = {};
    for (const table of ['document_revisions','workflow_comments','workflow_attachments','document_history','comment_read_receipts','document_sla_evaluations']) {
      tables[table] = await rows(c, `SELECT * FROM ${table} WHERE document_id=? ORDER BY ${table === 'workflow_attachments' ? 'attachment_id' : 'id'}`, [op.document_id]);
      scopeRows(tables[table], op);
    }
    const revisionIds = tables.document_revisions.map((r) => r.id);
    const commentIds = tables.workflow_comments.map((r) => r.id);
    const foreignComments = await byIds(c, 'workflow_comments', 'revision_id', revisionIds);
    const foreignAttachments = await byIds(c, 'workflow_attachments', 'comment_id', commentIds);
    const foreignReceipts = await byIds(c, 'comment_read_receipts', 'comment_id', commentIds);
    for (const records of [foreignComments, foreignAttachments, foreignReceipts]) scopeRows(records, op);
    if (tables.workflow_comments.some((r) => r.revision_id && !revisionIds.includes(r.revision_id))
      || tables.workflow_attachments.some((r) => !commentIds.includes(r.comment_id))
      || tables.comment_read_receipts.some((r) => !commentIds.includes(r.comment_id))) throw pending('CHILD_OWNERSHIP_AMBIGUOUS');
    const fileIds = [...new Set([document.active_file_id, ...tables.document_revisions.map((r) => r.file_id),
      ...tables.workflow_attachments.map((r) => r.file_id)].filter(Boolean))];
    const directFiles = await rows(c, 'SELECT * FROM stored_files WHERE document_id=? ORDER BY file_id', [op.document_id]);
    for (const file of directFiles) if (!fileIds.includes(file.file_id)) fileIds.push(file.file_id);
    const files = (await byIds(c, 'stored_files', 'file_id', fileIds)).sort((a, b) => a.file_id.localeCompare(b.file_id));
    if (files.length !== fileIds.length || (document.active_revision_id && !revisionIds.includes(document.active_revision_id))) {
      throw pending('FILE_RELATION_MISSING');
    }
    if (document.active_revision_id && tables.document_revisions.find((r) => r.id === document.active_revision_id)?.file_id !== document.active_file_id) {
      throw pending('ACTIVE_FILE_MISMATCH');
    }
    if (files.some((f) => f.project_id !== op.project_id || (f.document_id && f.document_id !== op.document_id))) throw pending('SHARED_FILE_REFERENCE');
    for (const records of [await byIds(c, 'document_revisions', 'file_id', fileIds), await byIds(c, 'workflow_attachments', 'file_id', fileIds)]) {
      scopeRows(records, op);
    }
    const activeReferences = await byIds(c, 'engineering_documents', 'active_file_id', fileIds);
    const activeRevisions = await byIds(c, 'engineering_documents', 'active_revision_id', revisionIds);
    if ([...activeReferences, ...activeRevisions].some((r) => r.id !== op.document_id || r.project_id !== op.project_id)) throw pending('SHARED_FILE_REFERENCE');
    const bindings = await byIds(c, 'stored_file_namespace_bindings', 'file_id', fileIds);
    const allKeys = await rows(c, 'SELECT file_id,storage_key FROM stored_files');
    const manifest = new Map();
    for (const file of files) {
      const binding = bindings.find((r) => r.file_id === file.file_id);
      let ns; let descriptor;
      if (binding) {
        [ns] = await rows(c, 'SELECT * FROM storage_namespaces WHERE id=?', [binding.namespace_id]);
        if (!ns || digest(ns.descriptor) !== ns.id) throw pending('NAMESPACE_INVALID');
        descriptor = parse(ns.descriptor);
        if (descriptor.provider !== ns.provider) throw pending('NAMESPACE_INVALID');
      }
      const key = validateStorageKey(file.storage_key);
      for (const candidate of allKeys) {
        if (fileIds.includes(candidate.file_id)) continue;
        let alias;
        try { alias = validateStorageKey(candidate.storage_key); } catch { throw pending('UNREVIEWED_STORAGE_KEY'); }
        if (alias === key || ((!binding || ns.provider === 'local') && alias.toLowerCase() === key.toLowerCase())) throw pending('SHARED_STORAGE_KEY');
      }
      const aliases = [file.relative_path, ...tables.document_revisions.filter((r) => r.file_id === file.file_id).map((r) => r.storage_path_legacy)].filter(Boolean);
      if (aliases.some((alias) => validateStorageKey(alias) !== key)) throw pending('LEGACY_REFERENCE_AMBIGUOUS');
      if (!binding) {
        if (forBinding) continue;
        throw pending('FILE_NAMESPACE_UNVERIFIED');
      }
      if (binding.storage_key_snapshot !== file.storage_key) throw pending('FILE_NAMESPACE_UNVERIFIED');
      const bindingEvidence = parse(binding.evidence);
      const identity = JSON.stringify([ns.id, key]);
      if (!manifest.has(identity)) manifest.set(identity, { namespace: { id: ns.id, descriptor, encoded: ns.descriptor }, key, fileIds: [],
        ...(bindingEvidence.localIdentity ? { localIdentity: bindingEvidence.localIdentity } : {}) });
      if (JSON.stringify(manifest.get(identity).localIdentity) !== JSON.stringify(bindingEvidence.localIdentity)) throw pending('LOCAL_IDENTITY_MISMATCH');
      manifest.get(identity).fileIds.push(file.file_id);
    }
    const notifications = await rows(c, `SELECT * FROM notifications WHERE project_id=? AND related_resource_type='Document'
      AND related_resource_id=? ORDER BY id`, [op.project_id, op.document_id]);
    return { document, tables, files, bindings, notifications,
      manifest: [...manifest.values()].sort((a, b) => JSON.stringify([a.namespace.id, a.key]).localeCompare(JSON.stringify([b.namespace.id, b.key]))) };
  };

  const prepare = async (c, op) => {
    const existing = await rows(c, 'SELECT * FROM document_delete_executions WHERE operation_id=?', [op.id]);
    if (existing[0]) return existing[0];
    const data = await inventory(c, op);
    const [actor] = await rows(c, `SELECT u.id,u.full_name,u.department_name_snapshot FROM users u
      JOIN project_memberships m ON m.user_id=u.id AND m.project_id=?
      WHERE u.id=? AND u.status='Active' AND m.status='Active' AND m.official_role='Admin'`, [op.project_id, op.initiated_by_user_id]);
    if (!actor?.full_name) throw pending('INITIATING_ADMIN_UNVERIFIED');
    const manifest = [];
    for (const file of data.manifest) {
      const record = { id: randomUUID(), provider: file.namespace.descriptor.provider, key: file.key, evidence: JSON.stringify(file) };
      await c.execute(`INSERT INTO document_delete_file_manifest
        (id,delete_operation_id,file_reference,provider,exact_storage_key,storage_key_hash,ownership_evidence,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,UTC_TIMESTAMP(3),UTC_TIMESTAMP(3))`,
      [record.id, op.id, file.fileIds[0], record.provider, file.key, digest(file.key), record.evidence]);
      manifest.push(record);
    }
    const folderCleanup = await require('../services/documentFolderCleanup.service').createFolderPlan(data, storage);
    const snapshot = JSON.stringify({ inventory: data, actor, folderCleanup });
    const hash = digest(JSON.stringify(manifest.sort((a, b) => a.id.localeCompare(b.id))));
    await c.execute(`INSERT INTO document_delete_executions
      (operation_id,phase,inventory,manifest_digest,created_at,updated_at)
      VALUES (?,'MANIFEST_FINALIZED',?,?,UTC_TIMESTAMP(3),UTC_TIMESTAMP(3))`, [op.id, snapshot, hash]);
    return { operation_id: op.id, phase: 'MANIFEST_FINALIZED', inventory: snapshot, manifest_digest: hash };
  };

  const readManifest = async (c, execution) => {
    const manifest = await rows(c, 'SELECT * FROM document_delete_file_manifest WHERE delete_operation_id=? ORDER BY id', [execution.operation_id]);
    const canonical = manifest.map((r) => ({ id: r.id, provider: r.provider, key: r.exact_storage_key, evidence: r.ownership_evidence }));
    if (digest(JSON.stringify(canonical)) !== execution.manifest_digest) throw pending('MANIFEST_CHANGED');
    for (const entry of manifest) {
      const evidence = parse(entry.ownership_evidence);
      if (entry.storage_key_hash !== digest(entry.exact_storage_key) || entry.provider !== evidence.namespace.descriptor.provider
        || entry.file_reference !== evidence.fileIds[0]) throw pending('MANIFEST_CHANGED');
    }
    return manifest;
  };

  const finalize = async (c, op, execution, manifest) => {
    const original = parse(execution.inventory);
    if (original.folderCleanup?.state !== 'CONFIRMED'
      || original.folderCleanup.planDigest !== digest(JSON.stringify(original.folderCleanup.plans))) throw pending('FOLDER_CLEANUP_NOT_CONFIRMED');
    const latest = await inventory(c, op);
    if (JSON.stringify(latest) !== JSON.stringify(original.inventory)) throw pending('OWNERSHIP_SNAPSHOT_CHANGED');
    for (const entry of manifest) {
      const [attempt] = await rows(c, 'SELECT * FROM document_delete_attempts WHERE manifest_id=?', [entry.id]);
      if (entry.cleanup_state !== 'DELETED' || attempt?.state !== 'SUCCEEDED') throw pending('STORAGE_NOT_TERMINAL');
    }
    const notificationDelivery = await captureRecipients(c, op.project_id);
    const args = [op.document_id, op.project_id];
    await c.execute('UPDATE engineering_documents SET active_file_id=NULL,active_revision_id=NULL WHERE id=? AND project_id=?', args);
    for (const table of ['comment_read_receipts','workflow_attachments','workflow_comments','document_history','document_sla_evaluations','document_revisions']) {
      await c.execute(`DELETE FROM ${table} WHERE document_id=? AND project_id=?`, args);
    }
    await c.execute("DELETE FROM notifications WHERE related_resource_id=? AND project_id=? AND related_resource_type='Document'", args);
    const ids = latest.files.map((f) => f.file_id);
    if (ids.length) {
      await c.execute(`DELETE FROM stored_file_namespace_bindings WHERE file_id IN (${placeholders(ids)})`, ids);
      await c.execute(`DELETE FROM stored_files WHERE file_id IN (${placeholders(ids)}) AND project_id=?`, [...ids, op.project_id]);
    }
    const [deleted] = await c.execute('DELETE FROM engineering_documents WHERE id=? AND project_id=?', args);
    if (deleted.affectedRows !== 1) throw pending('DOCUMENT_DELETE_COUNT_MISMATCH');
    await c.execute(`INSERT INTO audit_trail (id,identity_key,project_id,actor_user_id,actor_name,department,official_role,
      action,business_event,detail,resource_type,resource_id,reference,metadata,occurred_at)
      VALUES (?,?,?,?,?,?,'Admin','Delete','Document Deleted','Document permanently deleted.','Document',?,?,?,UTC_TIMESTAMP(3))`,
    [randomUUID(), `permanent-delete:${op.id}`, op.project_id, op.initiated_by_user_id, original.actor.full_name,
      original.actor.department_name_snapshot, op.document_id, op.document_number_snapshot, JSON.stringify({ deleteOperationId: op.id, reason: op.reason })]);
    await c.execute(`UPDATE document_delete_executions SET phase='COMPLETED',pending_reason=NULL,
      completion_snapshot=JSON_SET(?,'$.completedAt',DATE_FORMAT(UTC_TIMESTAMP(3),'%Y-%m-%dT%H:%i:%s.%fZ')),
      updated_at=UTC_TIMESTAMP(3) WHERE operation_id=? AND phase='MANIFEST_FINALIZED'`,
    [JSON.stringify({ operationId: op.id, projectId: op.project_id, documentId: op.document_id,
      documentNumber: op.document_number_snapshot, initiatingAdmin: original.actor, reason: op.reason, notificationDelivery }), op.id]);
  };
  return { lockOperation, inventory, prepare, readManifest, finalize };
};

module.exports = { createRepository };
