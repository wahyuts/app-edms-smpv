import { useAuthStore } from "@/features/auth/stores/auth.store";

const isAuthEndpoint = (url = "", endpoint) => {
  return String(url).includes(`/auth/${endpoint}`);
};

const setupInterceptors = (axiosInstance) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const statusCode = error.response?.status;
      const requestUrl = originalRequest?.url ?? "";

      if (
        statusCode !== 401 ||
        !originalRequest ||
        originalRequest._retry ||
        originalRequest._skipAuthRefresh ||
        isAuthEndpoint(requestUrl, "change-password") ||
        isAuthEndpoint(requestUrl, "login") ||
        isAuthEndpoint(requestUrl, "refresh") ||
        isAuthEndpoint(requestUrl, "logout")
      ) {
        if (statusCode === 401 && isAuthEndpoint(requestUrl, "refresh")) {
          useAuthStore.getState().clearAuth();
        }

        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        await axiosInstance.post("/v1/auth/refresh", undefined, {
          _skipAuthRefresh: true,
        });

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();

        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.assign("/login");
        }

        return Promise.reject(refreshError);
      }
    }
  );
};

export default setupInterceptors;
