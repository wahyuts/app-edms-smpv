const auditRepository = require('../repositories/audit.repository');
const projectMembershipRepository = require('../repositories/projectMembership.repository');
const { buildPagination, createEntityId, createHttpError, normalizeText, parseListQuery } = require('../utils/administration');

const auditDictionary = Object.freeze({
  'Approval A': { businessEvent: 'Approval A Completed', detail: 'Approval A completed.' },
  'Approval B': { businessEvent: 'Approval B Completed', detail: 'Approval B completed with comment.' },
  'Approval C': { businessEvent: 'Approval C Completed', detail: 'Approval C completed.' },
  'Document Archived': { businessEvent: 'Document Archived', detail: 'Document archived.' },
  'Document Approved': { businessEvent: 'Document Approved', detail: 'Document reached Approved status.' },
  'Document Downloaded': { businessEvent: 'Document Downloaded', detail: 'Document downloaded.' },
  'Document Restored': { businessEvent: 'Document Restored', detail: 'Document restored.' },
  'Document Updated': { businessEvent: 'Document Updated', detail: 'Document updated.' },
  'Document Viewed': { businessEvent: 'Document Viewed', detail: 'Document viewed.' },
  'Download Document': { businessEvent: 'Document Downloaded', detail: 'Document downloaded.' },
  'Edit Document': { businessEvent: 'Document Updated', detail: 'Document updated.' },
  'Escalation Created': { businessEvent: 'Escalation Created', detail: 'Document entered Escalation Alert.' },
  'Notification Read': { businessEvent: 'Notification Read', detail: 'Notification marked as read.' },
  'Upload Document': { businessEvent: 'Document Uploaded', detail: 'Document uploaded.' },
  'Upload Revision': { businessEvent: 'Revision Uploaded', detail: 'Revision uploaded.' },
  'View Document': { businessEvent: 'Document Viewed', detail: 'Document viewed.' },
  'Workflow Attachment': { businessEvent: 'Workflow Attachment Uploaded', detail: 'Workflow attachment uploaded.' },
});

const resolveProjectId = async ({ activeProject, queryProjectId, userId }) => {
  const projectId = queryProjectId || activeProject?.id || null;
  if (!projectId) throw createHttpError('Project Aktif Wajib Dipilih', 422);

  const membership = await projectMembershipRepository.findActiveMembershipByProjectAndUser({
    projectId,
    userId,
  });
  if (!membership) throw createHttpError('User Tidak Memiliki Akses Project', 403);

  return projectId;
};

const recordActivity = async ({
  action,
  actorOfficialRole,
  actorUserFullName,
  actorUserId,
  identityKey,
  metadata = {},
  projectId,
  reference = null,
  resourceId = null,
  resourceType = 'Document',
}) => {
  const dictionary = auditDictionary[action] || {
    businessEvent: action,
    detail: `${action}.`,
  };
  const key = identityKey || [
    action,
    actorUserId || 'system',
    resourceType,
    resourceId || '-',
    projectId || '-',
    metadata.identityBasis || new Date().toISOString(),
  ].join(':');

  await auditRepository.insertAuditRecord({
    id: createEntityId('AUD'),
    identityKey: key,
    projectId,
    actorUserId,
    actorName: actorUserFullName || 'System',
    department: metadata.department || '-',
    officialRole: actorOfficialRole || metadata.officialRole || null,
    action,
    businessEvent: dictionary.businessEvent,
    detail: dictionary.detail,
    resourceType,
    resourceId,
    reference,
    metadata,
  });
};

const parseDateOrNull = (value) => {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return null;

  const parsedDate = new Date(normalizedValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const recordActivitySafely = async (payload) => {
  try {
    await recordActivity(payload);
    return { created: true };
  } catch (error) {
    return { created: false, error };
  }
};

const listAuditRecords = async ({ activeProject, query = {}, userId }) => {
  const projectId = await resolveProjectId({
    activeProject,
    queryProjectId: normalizeText(query.projectId),
    userId,
  });
  const listQuery = parseListQuery(query, {
    allowedSortBy: ['action', 'actorName', 'createdAt', 'officialRole', 'resourceType'],
    defaultSortBy: 'createdAt',
  });
  const result = await auditRepository.listAuditRecordsPage({
    action: normalizeText(query.action),
    actorName: normalizeText(query.actorName),
    direction: listQuery.direction,
    fromDate: parseDateOrNull(query.fromDate),
    limit: listQuery.limit,
    officialRole: normalizeText(query.officialRole),
    offset: listQuery.offset,
    projectId,
    resourceType: normalizeText(query.resourceType),
    search: listQuery.search.toLowerCase(),
    sortBy: listQuery.sortBy,
    toDate: parseDateOrNull(query.toDate),
  });

  return {
    data: result.rows,
    pagination: buildPagination({
      page: listQuery.page,
      pageSize: listQuery.pageSize,
      totalItems: result.totalItems,
    }),
  };
};

const getAuditSummary = async ({ activeProject, query = {}, userId }) => {
  const projectId = await resolveProjectId({
    activeProject,
    queryProjectId: normalizeText(query.projectId),
    userId,
  });
  return auditRepository.getAuditSummaryByProject(projectId);
};

const getAuditFilterOptions = async ({ activeProject, query = {}, userId }) => {
  const projectId = await resolveProjectId({
    activeProject,
    queryProjectId: normalizeText(query.projectId),
    userId,
  });
  return auditRepository.getAuditFilterOptionsByProject(projectId);
};

const hideAuditRecord = async ({ auditId, actorOfficialRole, actorUserId }) => {
  if (actorOfficialRole !== 'Admin') {
    throw createHttpError('Only Admin can hide Audit Trail', 403);
  }
  const auditRecord = await auditRepository.findAuditRecordById(auditId);

  if (!auditRecord) {
    throw createHttpError('Audit Trail Tidak Ditemukan', 404);
  }

  const membership = await projectMembershipRepository.findActiveMembershipByProjectAndUser({
    projectId: auditRecord.projectId,
    userId: actorUserId,
  });

  if (!membership || membership.officialRole !== 'Admin') {
    throw createHttpError('User Tidak Memiliki Akses Project', 403);
  }

  return {
    deletedCount: await auditRepository.hideAuditRecord({
      auditId,
      hiddenByUserId: actorUserId,
    }),
    deletedIds: [auditId],
  };
};

module.exports = {
  getAuditFilterOptions,
  getAuditSummary,
  hideAuditRecord,
  listAuditRecords,
  recordActivity,
  recordActivitySafely,
};
