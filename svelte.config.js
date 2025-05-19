import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/kit/vite';
import { resolve } from 'path';

const alias = {
  $lib: 'src/lib',
  $components: 'src/lib/components',
  $stores: 'src/lib/stores',
  $utils: 'src/lib/utils',
  $firebase: 'src/lib/firebase',
  $types: 'src/lib/types',
  $services: 'src/lib/services',
  $constants: 'src/lib/constants'
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter(),
    alias
  }
};

export default config;