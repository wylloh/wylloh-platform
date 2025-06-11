import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Enable polyfills for our Web3/IPFS dependencies
      include: ['buffer', 'process', 'crypto', 'stream', 'util', 'url', 'os'],
      globals: { Buffer: true, global: true, process: true }
    })
  ],
  
  // Environment variable prefix (REACT_APP_ → VITE_)
  envPrefix: 'VITE_',
  
  // Build configuration matching current nginx setup
  build: {
    outDir: 'build',  // Keep same output directory for Docker
    sourcemap: false,  // Match current CRA build:cicd setting
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          web3: ['ethers', '@web3-react/core'],
          ipfs: ['helia', '@helia/unixfs'],
          ui: ['@mui/material', '@mui/icons-material']
        }
      }
    }
  },
  
  // Development server
  server: {
    port: 3000,
    host: true,
    open: true
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': '/src',
      'process': 'process',
      'buffer': 'buffer'
    }
  },
  
  // Define global variables for Web3 compatibility
  define: {
    global: 'globalThis',
  }
}) 