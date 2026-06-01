import axios from "axios";
import { authService } from "./authService";

const DEFAULT_API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:4001"
  : "https://inventory-backend-alpha-eight.vercel.app";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let hasHandledAuthExpiry = false;

const getActiveOrganisationId = () => {
  try {
    const user = localStorage.getItem("user");
    if (!user) return "";

    const parsedUser = JSON.parse(user);
    return parsedUser?.organisationId || "";
  } catch {
    return "";
  }
};

const shouldInvalidateSession = (error: any) => {
  const status = error?.response?.status;
  const message = String(
    error?.response?.data?.message || error?.response?.data?.error || "",
  ).toLowerCase();

  if (status === 401) return true;
  if (status === 403 && message.includes("token")) return true;
  if (status === 404 && message === "user not found") return true;

  return false;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const organisationId = getActiveOrganisationId();

  // For FormData, do not force JSON content type.
  // Let the browser set multipart/form-data with boundary.
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (config.headers) {
      delete (config.headers as any)["Content-Type"];
      delete (config.headers as any)["content-type"];
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (organisationId) {
    config.headers["organisationId"] = organisationId;
  }

  if (organisationId) {
    config.headers["x-organisation-id"] = organisationId;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (shouldInvalidateSession(error) && !hasHandledAuthExpiry) {
      hasHandledAuthExpiry = true;
      authService.clearSession();
      window.dispatchEvent(new CustomEvent("auth:expired"));
      window.setTimeout(() => {
        hasHandledAuthExpiry = false;
      }, 1000);
    }

    return Promise.reject(error);
  },
);

export default api;
