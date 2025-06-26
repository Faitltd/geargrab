import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5173,
    strictPort: false,
  },
  optimizeDeps: {
    include: ['@stripe/stripe-js']
  },
  build: {
    rollupOptions: {
      output: {
        // Optimize for caching with content-based hashes
        chunkFileNames: '_app/immutable/chunks/[name]-[hash].js',
        entryFileNames: '_app/immutable/entry/[name]-[hash].js',
        assetFileNames: '_app/immutable/assets/[name]-[hash].[ext]'
      }
    },
    // Enable minification and tree-shaking
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    }
  }
});
