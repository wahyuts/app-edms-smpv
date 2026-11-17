import { useQuery } from "@tanstack/react-query";
import { DocumentApiService } from "../services/document-api.service";

export const useDocumentRevisionHistory = ({ open, canView, userId, projectId, documentId, stage }) => {
  const enabled = Boolean(open && canView && userId && projectId && documentId);
  const query = useQuery({
    queryKey: ["documents", "revision-history", userId, projectId, documentId, "events", stage],
    queryFn: ({ signal }) => DocumentApiService.getDocumentRevisions(documentId, { historyMode: "events", stage, signal }),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
  // The modal unmounts on close/context change; consuming the Query signal aborts its request.
  return { ...query, revisions: enabled && !query.isError ? query.data ?? [] : [] };
};
