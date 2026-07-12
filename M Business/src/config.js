import axios from "axios";
export const BASE_URL = import.meta.env.VITE_API_URL ||
  ((window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5008"
    : (window.location.hostname.includes("vercel.app") || window.location.hostname.includes("mbusiness.cloud"))
      ? "" // Use relative URLs on production so vercel.json proxy works
      : `http://${window.location.hostname}:5008`);
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;


