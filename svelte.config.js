import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // adapter-node for Node.js deployment
    adapter: adapter({
      out: 'build'
    })
  },

  compilerOptions: {
    // Use standard Svelte syntax for compatibility
    runes: false,
  }
};

export default config;
