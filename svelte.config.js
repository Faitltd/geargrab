import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Using Node adapter for Cloud Run deployment
		adapter: adapter({
			out: 'build'
		}),

		// SvelteKit v2 configuration
		alias: {
			$components: 'src/lib/components',
			$stores: 'src/lib/stores',
			$utils: 'src/lib/utils',
			$types: 'src/lib/types'
		},

		// CSP completely disabled to fix image loading issues
		// csp: {
		// 	mode: 'nonce',
		// 	directives: {
		// 		'img-src': ['*', 'data:', 'blob:', 'https:', 'http:']
		// 	}
		// },

		// Version configuration
		version: {
			name: process.env.npm_package_version || '1.0.0'
		}
	}
};

export default config;
