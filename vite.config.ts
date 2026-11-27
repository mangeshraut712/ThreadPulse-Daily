import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'path'
import type { Plugin } from 'vite'
import { precacheManifestSource } from './public/sw-scope.js'

const PROJECT_ROOT = path.resolve(__dirname)

function precacheManifestPlugin(): Plugin {
  let source = 'export const BUILT_ASSETS = [];\n'
  return {
    name: 'threadpulse-precache-manifest',
    apply: 'build',
    generateBundle(_options, bundle) {
      source = precacheManifestSource(Object.keys(bundle))
      this.emitFile({
        type: 'asset',
        fileName: 'precache-manifest.js',
        source,
      })
    },
    // public/precache-manifest.js is an empty dev stub. Write the built list
    // again after Vite copies public/, so the stub cannot replace it.
    closeBundle() {
      fs.writeFileSync(path.join(PROJECT_ROOT, 'dist', 'precache-manifest.js'), source)
    },
  }
}

export default defineConfig({
  // Vite copies public/sw.js and manifest.json unchanged; index.html registers the worker.
  plugins: [react(), precacheManifestPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(PROJECT_ROOT, 'src'),
      '@/components': path.resolve(PROJECT_ROOT, 'src/components'),
      '@/hooks': path.resolve(PROJECT_ROOT, 'src/hooks'),
      '@/utils': path.resolve(PROJECT_ROOT, 'src/utils'),
      '@/types': path.resolve(PROJECT_ROOT, 'src/types'),
      '@/wasm': path.resolve(PROJECT_ROOT, 'packages/wasm/pkg'),
      '@/gamemaker': path.resolve(PROJECT_ROOT, 'packages/gamemaker/dist')
    }
  },
  optimizeDeps: {
    exclude: ['@devvit/public-api']
  },
  server: {
    port: 4173,
    host: true
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['zustand']
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    }
  }
})
