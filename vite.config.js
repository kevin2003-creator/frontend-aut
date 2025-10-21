import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    port: 4173,
    strictPort: true,
    host: true, // 👈 importante para Railway
    allowedHosts: ['lexion-daossystem-pro.up.railway.app'],
  },
})
