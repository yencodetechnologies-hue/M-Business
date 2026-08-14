import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './components/mobile.css'
import App from './App.jsx'

// Axios BASE_URL + x-company-id interceptor live in config.js
import "./config";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
