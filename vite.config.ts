import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/v1': {
        target: process.env.VITE_API_TARGET || 'https://fastapi.hindustanijyotish.com',
        changeOrigin: true,
        secure: true,
        // Optional: log proxy activity to your terminal for debugging
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('[proxy]', req.method, req.url, '→', proxyReq.path)
          })
          proxy.on('error', (err) => {
            console.log('[proxy error]', err)
          })
        },
      },
    },
  },
})