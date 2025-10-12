import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['soothing-friendship-production.up.railway.app'], // 👈 Agrega tu dominio aquí
    port: 4173, // opcional, puedes mantenerlo
  },
})
