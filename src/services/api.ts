import axios from "axios";
import { authService } from "./authService";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://inventory-backend-alpha-eight.vercel.app",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const organisationId = localStorage.getItem("organisationId");

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
