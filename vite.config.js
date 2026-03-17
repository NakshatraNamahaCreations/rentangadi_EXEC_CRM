import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000, // change to your desired port
  },
  optimizeDeps: {
    include: ['file-saver', 'xlsx']
  }

})
