import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy backend requests in development
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Proxy GPM WMS for dev
      '/gpm-wms': {
        target: 'https://gpm1.gesdisc.eosdis.nasa.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gpm-wms/, '/data/GPM_L3/GPM_3IMERGHHL.06/2026/081'),
      }
    }
  }
})
