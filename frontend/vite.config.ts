import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',     // Accept connections from Docker host
    port: 5173,
    watch: {
      usePolling: true,  // Required for hot-reload on Windows Docker volumes
    },
  },
})
