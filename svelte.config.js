import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/kit/vite';
import { resolve } from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter(),
    alias: {
      $lib: resolve('./src/lib'),
      $components: resolve('./src/lib/components'),
      $stores: resolve('./src/lib/stores'),
      $utils: resolve('./src/lib/utils'),
      $firebase: resolve('./src/lib/firebase'),
      $types: resolve('./src/lib/types'),
      $services: resolve('./src/lib/services'),
      $constants: resolve('./src/lib/constants')
    }
  }
};

export default config;
