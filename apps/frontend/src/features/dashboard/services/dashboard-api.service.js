import { apiClient } from "@/shared/api";

const unwrapData = (response) => response.data?.data ?? {};

const getSummary = async () => unwrapData(await apiClient.get("/v1/dashboard/summary"));

const getRecentActivities = async ({ limit = 6 } = {}) => {
  const response = await apiClient.get("/v1/dashboard/recent-activities", {
    params: { limit },
  });

  return response.data?.data?.data ?? [];
};

export const DashboardApiService = {
  getRecentActivities,
  getSummary,
};

export default DashboardApiService;
