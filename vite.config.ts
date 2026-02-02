import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages
  // For project pages: '/repository-name/'
  // For user/organization pages or custom domain: '/'
  base: process.env.VITE_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/forth/' : '/'),
})
