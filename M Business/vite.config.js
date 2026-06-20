import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // HTTP
          'axios': ['axios'],

          // PDF / canvas heavy libs
          'pdf-libs': ['jspdf', 'html2pdf.js', 'html2canvas'],

          // QR / image libs
          'media-libs': ['qrcode.react', 'html5-qrcode', 'react-easy-crop'],

          // OCR (very heavy — tesseract.js is ~1MB alone)
          'ocr': ['tesseract.js'],

          // Toast notifications
          'toast': ['react-toastify'],
        }
      }
    }
  }
})