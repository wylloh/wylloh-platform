import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  
  // Build configuration matching current nginx setup
  build: {
    outDir: 'build',  // Keep same output directory for Docker
    sourcemap: false,  // Match current CRA build:cicd setting
    minify: 'terser'
  },
  
  // Development server
  server: {
    port: 3000,
    host: true
  },
  
  // Define global variables for Web3 compatibility
  define: {
    global: 'globalThis',
  }
}) 