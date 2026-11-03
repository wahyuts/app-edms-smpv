import { apiClient } from "@/shared/api";

const request = async (callback) => {
  try { const { data } = await callback(); return { ...data.data, message: data.data.message || data.message }; }
  catch (error) {
    if (error.response?.data?.data?.status) return { ...error.response.data.data, message: error.response.data.data.message || error.response.data.message };
    const message = error.response?.status === 401 ? "Sesi login tidak valid. Silakan login kembali."
      : error.response?.status === 403 ? "Akses penghapusan ditolak untuk project aktif."
      : error.response?.data?.message || "Status penghapusan belum dapat dipastikan.";
    const failure = new Error(message);
    failure.status = error.response?.status;
    throw failure;
  }
};

export const PermanentDeleteService = {
  remove: ({ documentId, projectId, reason, requestKey }) => request(() => apiClient.delete(
    `/v1/documents/${encodeURIComponent(documentId)}/permanent`,
    { params: { projectId }, data: { reason }, headers: { "Idempotency-Key": requestKey } },
  )),
  status: ({ documentId, projectId, operationId }) => request(() => apiClient.get(
    `/v1/documents/${encodeURIComponent(documentId)}/permanent`, { params: { projectId, operationId } },
  )),
};
