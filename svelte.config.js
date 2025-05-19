import { vitePreprocess } from '@sveltejs/kit';
import adapter from '@sveltejs/adapter-node';
import path from 'path';

export default {
  preprocess: vitePreprocess(),
  
  kit: {
    adapter: adapter(),
    alias: {
      '$lib': path.resolve('./src/lib'),
      '$firebase': path.resolve('./src/lib/firebase'),
      '$stores': path.resolve('./src/lib/stores'),
      '$components': path.resolve('./src/lib/components'),
      '$utils': path.resolve('./src/lib/utils'),
      '$types': path.resolve('./src/lib/types'),
      '$services': path.resolve('./src/lib/services'),
      '$constants': path.resolve('./src/lib/constants')
    }
  }
};