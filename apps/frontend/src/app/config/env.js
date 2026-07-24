export const env = {
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
