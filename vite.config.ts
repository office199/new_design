import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
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