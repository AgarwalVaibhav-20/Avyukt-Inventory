import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://inventory-backend-alpha-eight.vercel.app",
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

let isRedirectingAfterAuthFailure = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url || "";

    const isAuthFailure = status === 401;
    const isLoginCall =
      url.includes("/auth/login") ||
      url.includes("/auth/signup") ||
      url.includes("/auth/verify-otp") ||
      url.includes("/auth/resend-otp");

    if (isAuthFailure && !isLoginCall && !isRedirectingAfterAuthFailure) {
      isRedirectingAfterAuthFailure = true;
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("organisationId");
        localStorage.removeItem("originalToken");
      } catch {}
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
