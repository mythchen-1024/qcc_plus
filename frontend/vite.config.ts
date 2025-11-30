import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'

// Vite build optimizations:
// - manualChunks to split heavy deps (vendor, charts, ui) for faster first load
// - dual gzip + brotli precompression to reduce transfer size
// - modern build target & css splitting
export default defineConfig({
  plugins: [
    react(),
    // Generate .gz assets for most CDNs / proxies
    compression({
      algorithm: 'gzip',
      threshold: 1024,
      ext: '.gz',
    }),
    // Generate .br assets for capable clients
    compression({
      algorithm: 'brotliCompress',
      threshold: 1024,
      ext: '.br',
    }),
  ],
  base: '/',
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Keep core libs separate so first screen loads leaner bundles
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (
            /[\\/]node_modules[\\/]react(?:-dom)?[\\/]/.test(id) ||
            /[\\/]node_modules[\\/]react-router-dom[\\/]/.test(id)
          ) {
            return 'vendor'
          }
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'charts'
          if (
            id.includes('@dnd-kit') ||
            id.includes('react-markdown') ||
            id.includes('remark-gfm')
          ) {
            return 'ui'
          }
          // Let Rollup decide for the rest
          return undefined
        },
      },
    },
  },
})
