import axios from "axios";
export const BASE_URL = "https://m-business-r2vd.onrender.com";

// Global interceptor for Multi-Tenant Architecture
axios.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem("user");
  if (savedUser) 
    try {
      const parsed = JSON.parse(savedUser);
      // Admin's companyId is their own ID. Employees use companyId.
      const companyId = parsed.role === "admin" ? parsed.id : (parsed.companyId || "");
      if (companyId) {
        config.headers["x-company-id"] = companyId;
      }
    } catch (err) {
      // ignore
    }
  }
  return config;
}, (error) => Promise.reject(error));
