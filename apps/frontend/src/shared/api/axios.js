import axios from "axios";

import { env } from "@/app/config/env";

import setupInterceptors from "./interceptors";

const axiosInstance = axios.create({
  baseURL: env.API_BASE_URL,

  timeout: 30000,

  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
  },
});

setupInterceptors(axiosInstance);

export default axiosInstance;
