const auditRepository = require('../repositories/audit.repository');
const documentRepository = require('../repositories/document.repository');
const escalationService = require('./escalation.service');
const slaService = require('./sla.service');
const { normalizeText } = require('../utils/administration');

const workflowStatuses = Object.freeze({
  APPROVED: 'Approved',
  PROCESS_COMMENT: 'Process Comment',
  PROCESS_REJECT: 'Process Reject',
  PROCESS_REVIEW: 'Process Review',
  PROJECT_COMMENT: 'Project Comment',
  PROJECT_REJECT: 'Project Reject',
  PROJECT_REVIEW: 'Project Review',
});

const countByStatus = (documents, status) => documents.filter((document) => document.status === status).length;

const createKpiSummary = (documents) => {
  const processComment = countByStatus(documents, workflowStatuses.PROCESS_COMMENT);
  const processReject = countByStatus(documents, workflowStatuses.PROCESS_REJECT);
  const projectComment = countByStatus(documents, workflowStatuses.PROJECT_COMMENT);
  const projectReject = countByStatus(documents, workflowStatuses.PROJECT_REJECT);
  const approved = countByStatus(documents, workflowStatuses.APPROVED);

  return {
    approved,
    archived: documents.filter((document) => document.lifecycle === 'Archived').length,
    finalAsBuilt: approved,
    processComment,
    processCommentReject: processComment + processReject,
    processReject,
    processReview: countByStatus(documents, workflowStatuses.PROCESS_REVIEW),
    projectComment,
    projectCommentReject: projectComment + projectReject,
    projectReject,
    projectReview: countByStatus(documents, workflowStatuses.PROJECT_REVIEW),
    totalDocuments: documents.length,
  };
};

const createCurrentAssigneeSummary = (documents) => documents.reduce((summary, document) => {
  const assigneeKey = document.currentAssignee || document.responsibleRole || 'Unassigned';

  summary[assigneeKey] = (summary[assigneeKey] || 0) + 1;
  return summary;
}, {});

const resolveProjectId = async ({ activeProject, query = {}, userId }) => {
  return slaService.resolveProjectId({
    activeProject,
    queryProjectId: normalizeText(query.projectId),
    userId,
  });
};

const getDashboardSummary = async ({ activeProject, query = {}, userId }) => {
  const projectId = await resolveProjectId({ activeProject, query, userId });
  const [
    currentAssigneeSummary,
    kpiSummary,
    slaDocuments,
  ] = await Promise.all([
    documentRepository.getDashboardCurrentAssigneeSummaryByProject(projectId),
    documentRepository.getDashboardKpiSummaryByProject(projectId),
    documentRepository.listDashboardSlaCandidateDocumentsByProject(projectId),
  ]);
  const escalations = slaDocuments.map(escalationService.createEscalationItem).filter(Boolean);

  return {
    currentAssigneeSummary,
    escalationSummary: escalationService.createSummary(escalations),
    kpiSummary,
    slaSummary: slaService.createSummary(slaDocuments),
  };
};

const getDashboardStatistics = async ({ activeProject, query = {}, userId }) => {
  const projectId = await resolveProjectId({ activeProject, query, userId });

  return documentRepository.getDashboardStatisticsByProject(projectId);
};

const getRecentActivities = async ({ activeProject, query = {}, userId }) => {
  const projectId = await resolveProjectId({ activeProject, query, userId });
  const limit = Math.min(20, Math.max(1, Number.parseInt(query.limit || query.pageSize, 10) || 10));
  const records = await auditRepository.listRecentAuditRecordsByProject({
    limit,
    projectId,
  });

  return {
    data: records,
  };
};

module.exports = {
  createCurrentAssigneeSummary,
  createKpiSummary,
  getDashboardSummary,
  getDashboardStatistics,
  getRecentActivities,
};
