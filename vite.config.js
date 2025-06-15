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
        // Add timestamp to chunk filenames to prevent caching
        chunkFileNames: 'assets/js/[name]-[hash]-' + Date.now() + '.js',
        entryFileNames: 'assets/js/[name]-[hash]-' + Date.now() + '.js',
        assetFileNames: 'assets/[ext]/[name]-[hash]-' + Date.now() + '.[ext]',
      }
    }
  }
});
