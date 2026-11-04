const uncertain = (operationId) => ({
  status: "UNKNOWN",
  operationId,
  message: "Status penghapusan belum dapat dipastikan.",
});

const waitForStatus = (milliseconds, signal) => new Promise((resolve) => {
  if (signal.aborted) { resolve(); return; }
  const finish = () => {
    clearTimeout(timer);
    signal.removeEventListener("abort", finish);
    resolve();
  };
  const timer = setTimeout(finish, milliseconds);
  signal.addEventListener("abort", finish, { once: true });
});

// Reconcile only through GET. A lost DELETE response must never start a new Delete.
export const reconcilePermanentDelete = async ({
  status, documentId, projectId, operationId, signal, isCurrent,
}, { now = Date.now, wait = waitForStatus } = {}) => {
  const deadline = now() + 60000;
  let knownOperationId = operationId;
  for (let attempt = 0; attempt < 15; attempt += 1) {
    if (signal.aborted || !isCurrent()) return null;
    if (now() >= deadline) break;
    try {
      const response = await status({
        documentId, projectId, operationId: knownOperationId, signal,
        timeout: Math.min(5000, deadline - now()),
      });
      if (signal.aborted || !isCurrent()) return null;
      if ((response.operationId && knownOperationId && response.operationId !== knownOperationId)
        || (response.projectId && response.projectId !== projectId)
        || (response.documentId && response.documentId !== documentId)) return uncertain(knownOperationId);
      knownOperationId ||= response.operationId;
      if (response.status === "CONFLICT" && response.reasonCode === "LEGACY_STORAGE_OWNERSHIP_UNVERIFIED") return response;
      if (["COMPLETED", "FAILED"].includes(response.status)) return response;
    } catch (error) {
      if (signal.aborted || !isCurrent()) return null;
      if ([401, 403, 422].includes(error.status)) throw error;
      // 404 can precede reservation visibility after a lost initial response.
      // Network errors and pending/unknown/conflict states are not success/failure.
    }
    if (attempt < 14 && now() < deadline) await wait(Math.min(2000, deadline - now()), signal);
  }
  return signal.aborted || !isCurrent() ? null : uncertain(knownOperationId);
};
