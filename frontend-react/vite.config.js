import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Explicit string for network access
    port: 5175,
    watch: {
      usePolling: true,
    },
  },
})
