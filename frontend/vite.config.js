import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/analyze':  'http://localhost:8000',
      '/generate': 'http://localhost:8000',
      '/catalog':  'http://localhost:8000',   // covers /catalog/swatches/* too
      '/hangers':  'http://localhost:8000',
      '/inquiry':  'http://localhost:8000',
      '/saves':    'http://localhost:8000',
      '/status':   'http://localhost:8000',
    }
  }
})
