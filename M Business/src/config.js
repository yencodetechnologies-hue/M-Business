import axios from "axios";
export const BASE_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:5000"
  : (window.location.protocol === "https:")
    ? ""
    : `http://${window.location.hostname}:5000`;
export const FRONTEND_URL = window.location.origin;

// Global interceptor for Multi-Tenant Architecture
axios.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      // Prioritize companyId if available (admins/subadmins have their own ID as companyId if they are the owner)
      const companyId = parsed.companyId || (parsed.role === "admin" ? (parsed.id || parsed._id) : "");
      if (companyId) {
        config.headers["x-company-id"] = companyId;
      }
    } catch (err) {
      // ignore
    }
  }
  return config;
}, (error) => Promise.reject(error));
