import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],

	// Modern build configuration
	build: {
		target: 'esnext',
		minify: 'esbuild',
		sourcemap: true
	},

	// Development server configuration
	server: {
		port: 5173,
		host: true,
		fs: {
			allow: ['..']
		}
	},

	// Optimizations
	optimizeDeps: {
		include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'stripe']
	},

	// Environment variables
	define: {
		global: 'globalThis'
	},

	// CSS configuration
	css: {
		postcss: './postcss.config.js'
	},

	// Test configuration
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		setupFiles: ['src/lib/test/setup.ts']
	}
});
