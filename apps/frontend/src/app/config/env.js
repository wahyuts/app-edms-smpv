export const env = {
  EMERGENCY_UPLOAD_TEAM_PROCESS_ENABLED: import.meta.env.VITE_EMERGENCY_UPLOAD_TEAM_PROCESS_ENABLED === "true",
  EMERGENCY_UPLOAD_TEAM_PROJECT_ENABLED: import.meta.env.VITE_EMERGENCY_UPLOAD_TEAM_PROJECT_ENABLED === "true",
  APP_NAME: import.meta.env.VITE_APP_NAME,

  APP_VERSION: import.meta.env.VITE_APP_VERSION,

  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,

  APP_ENV: import.meta.env.VITE_APP_ENV,

  ENABLE_DEMO_RESET:
    String(import.meta.env.VITE_ENABLE_DEMO_RESET).toLowerCase() === "true",

  ENABLE_MOCK_EMAIL:
    String(import.meta.env.VITE_ENABLE_MOCK_EMAIL).toLowerCase() === "true",

  USE_MOCK_API:
    import.meta.env.VITE_USE_MOCK_API === "true",
};
