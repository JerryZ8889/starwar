import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // 允许局域网访问，方便在手机上测试触控
    port: 5175,
  },
})
