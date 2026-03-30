import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 🔥 axios baseURL set pannalam (important)
import axios from "axios";
import { BASE_URL } from "./config";

axios.defaults.baseURL = BASE_URL;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)