import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ocdc-api': {
        target: 'http://10.66.101.184:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ocdc-api/, ''),
      },
    },
  },
})
