import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Base path for GitHub Pages
const basePath = process.env.VITE_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/forth/' : '/')

// Plugin to transform manifest.json and HTML with base path
const pwaBasePathPlugin = () => {
  return {
    name: 'pwa-base-path',
    transformIndexHtml(html: string) {
      // Replace absolute paths with base path
      return html
        .replace(/href="\/manifest\.json"/g, `href="${basePath}manifest.json"`)
        .replace(/href="\/icon\.svg"/g, `href="${basePath}icon.svg"`)
        // Note: Cache-busting removed - use version in manifest name instead
    },
    writeBundle() {
      // Transform manifest.json
      const manifestPath = join(process.cwd(), 'dist', 'manifest.json')
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
        
        // Update start_url and icon paths with base path
        manifest.id = basePath === '/' ? '/' : basePath
        manifest.start_url = basePath === '/' ? '/' : basePath
        manifest.scope = basePath === '/' ? '/' : basePath
        manifest.icons = manifest.icons.map((icon: any) => ({
          ...icon,
          src: basePath === '/' ? icon.src : icon.src.replace(/^\//, basePath),
          // Fix purpose field - can't be "any maskable", must be "any" or "maskable"
          purpose: icon.purpose === 'any maskable' ? 'any' : icon.purpose
        }))
        
        // Ensure all icon paths are absolute and include base path
        manifest.icons.forEach((icon: any) => {
          if (!icon.src.startsWith('http') && !icon.src.startsWith(basePath)) {
            icon.src = basePath === '/' ? icon.src : basePath + icon.src.replace(/^\//, '')
          }
        })
        
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
      } catch (error) {
        console.warn('Could not transform manifest.json:', error)
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), pwaBasePathPlugin()],
  // Base path for GitHub Pages
  // For project pages: '/repository-name/'
  // For user/organization pages or custom domain: '/'
  base: basePath,
})
