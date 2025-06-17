import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.1.2:3001',
        changeOrigin: true,
        secure: false,
      },
      '/public': {
        target: 'http://192.168.1.2:3001',
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: ['alinos-dashboard.my.id'],
    host: true 
  },
  server
})