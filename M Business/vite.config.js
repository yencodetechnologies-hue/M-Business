import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'axios': ['axios'],
          'pdf-libs': ['jspdf', 'html2pdf.js', 'html2canvas'],
          'media-libs': ['qrcode.react', 'html5-qrcode', 'react-easy-crop'],
          'toast': ['react-toastify'],
        }
      }
    }
  }
})
