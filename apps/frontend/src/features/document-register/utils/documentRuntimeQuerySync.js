import { queryClient } from "@/shared/api/query-client";

const documentRuntimeQueryKeys = [
  ["documents"],
  ["dashboard"],
  ["sla-monitoring"],
  ["escalation"],
];

export const synchronizeDocumentRuntimeQueries = async ({
  refreshCurrentSurface,
} = {}) => {
  await Promise.all(
    [
      ...documentRuntimeQueryKeys.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey, refetchType: "active" }),
      ),
      Promise.resolve(refreshCurrentSurface?.()),
    ],
  );
};

export default synchronizeDocumentRuntimeQueries;
