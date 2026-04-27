import axios from "axios";
export const BASE_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:5000"
  : "https://m-business-r2vd.onrender.com";

// Global interceptor for Multi-Tenant Architecture
axios.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      // Admins and Subadmins use their own ID. Employees use companyId.
      const companyId = (parsed.role === "admin" || parsed.role === "subadmin") ? (parsed.id || parsed._id) : (parsed.companyId || "");
      if (companyId) {
        config.headers["x-company-id"] = companyId;
      }
    } catch (err) {
      // ignore
    }
  }
  return config;
}, (error) => Promise.reject(error));
