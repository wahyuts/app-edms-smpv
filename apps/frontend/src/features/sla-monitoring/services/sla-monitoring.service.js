import {
  SLA_STATUS,
} from "@/features/document-register/constants/document.constants";
import { DocumentService } from "@/features/document-register/services/document.service";
import { mapDocumentRecord } from "@/features/document-register/services/document-api.service";
import { SlaEngineService } from "@/features/sla-management/services/sla-engine.service";
import { apiClient } from "@/shared/api";

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const evaluateDocument = (document, now) => SlaEngineService.evaluate(
  document,
  now ?? new Date(),
);

const getDocuments = async ({ documents, now } = {}) => {
  if (documents) {
    return cloneValue(documents.map((documentItem) =>
      evaluateDocument(documentItem, now),
    ));
  }

  try {
    const response = await apiClient.get("/v1/sla");
    return (response.data?.data?.data ?? []).map(mapDocumentRecord);
  } catch (error) {
    if (!documents) throw error;
  }

  const sourceDocuments = await DocumentService.getDocuments();
  return cloneValue(sourceDocuments.map((documentItem) =>
    evaluateDocument(documentItem, now),
  ));
};

const createSummary = (documents) => {
  const summary = {
    [SLA_STATUS.ON_TRACK]: 0,
    [SLA_STATUS.AT_RISK]: 0,
    [SLA_STATUS.OVERDUE]: 0,
    [SLA_STATUS.FINAL_AS_BUILT]: 0,
  };

  documents.forEach((documentItem) => {
    if (summary[documentItem.slaStatus] !== undefined) {
      summary[documentItem.slaStatus] += 1;
    }
  });

  return summary;
};

export const SlaMonitoringService = {
  createSummary,
  evaluateDocument,
  getDocuments,
};

export default SlaMonitoringService;
