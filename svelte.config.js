import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter(),

		// SvelteKit v2 configuration
		alias: {
			$components: 'src/lib/components',
			$stores: 'src/lib/stores',
			$utils: 'src/lib/utils',
			$types: 'src/lib/types'
		},

		// CSP configuration for security
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': ['self', 'unsafe-inline', 'https://js.stripe.com', 'https://apis.google.com', 'https://accounts.google.com', 'https://www.gstatic.com'],
				'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
				'font-src': ['self', 'https://fonts.gstatic.com'],
				'img-src': ['self', 'data:', 'https:', 'blob:'],
				'connect-src': ['self', 'https://api.stripe.com', 'https://*.googleapis.com', 'https://*.firebase.com', 'https://*.firebaseio.com'],
				'frame-src': ['https://js.stripe.com', 'https://hooks.stripe.com', 'https://accounts.google.com', 'https://www.google.com']
			}
		},

		// Version configuration
		version: {
			name: process.env.npm_package_version || '1.0.0'
		}
	}
};

export default config;
