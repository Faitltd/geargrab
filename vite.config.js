import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    plugins: [sveltekit()],
    resolve: {
        alias: {
            '$firebase': path.resolve('./src/lib/firebase'),
            '$stores': path.resolve('./src/lib/stores'),
            '$components': path.resolve('./src/lib/components'),
            '$utils': path.resolve('./src/lib/utils'),
            '$types': path.resolve('./src/lib/types'),
            '$services': path.resolve('./src/lib/services'),
            '$constants': path.resolve('./src/lib/constants')
        }
    }
});
