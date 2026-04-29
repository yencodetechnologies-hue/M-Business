import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 🔥 axios baseURL set pannalam (important)
import axios from "axios";
import { BASE_URL } from "./config";

axios.defaults.baseURL = BASE_URL;
axios.interceptors.request.use((config) => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    const user = JSON.parse(userStr);
    const cid = user.companyId || user.company || user._id || user.id;
    if (cid) config.headers["x-company-id"] = cid;
  }
  return config;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)