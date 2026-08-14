import axios from "axios";
export const BASE_URL = import.meta.env.VITE_API_URL ||
  ((window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5008"
    : (window.location.hostname.includes("vercel.app") || window.location.hostname.includes("mbusiness.cloud"))
      ? "" // Use relative URLs on production so vercel.json proxy works
      : `http://${window.location.hostname}:5008`);
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

export function getCompanyId(user) {
  if (!user) {
    try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch { return ""; }
  }
  return String(user?.companyId || user?._id || user?.id || user?.userId || user?.company || "").trim();
}

export function normalizeSessionUser(userData) {
  if (!userData || typeof userData !== "object") return userData;
  const id = String(userData._id || userData.id || userData.userId || "").trim();
  const companyId = String(userData.companyId || userData.company || id).trim();
  return {
    ...userData,
    _id: id || userData._id,
    id: id || userData.id,
    companyId,
    role: (userData.role || "").toLowerCase().trim(),
  };
}

axios.defaults.baseURL = BASE_URL;
axios.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const cid = getCompanyId(user);
    if (cid && !config.headers["x-company-id"] && !config.headers["X-Company-Id"]) {
      config.headers["x-company-id"] = cid;
    }
    if (user?.name && !config.headers["x-user-name"]) config.headers["x-user-name"] = user.name;
    if (user?.role && !config.headers["x-user-role"]) config.headers["x-user-role"] = user.role;
  } catch { /* ignore malformed session */ }
  return config;
});
