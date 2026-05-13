import axios from "axios";

const DEFAULT_API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:4000"
  : "https://inventory-backend-alpha-eight.vercel.app";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const organisationId = localStorage.getItem("organisationId");

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

export default api;
