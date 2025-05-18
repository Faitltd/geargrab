#!/usr/bin/env node

/**
 * Project Setup Script
 * 
 * This script creates the basic directory structure and essential files for the GearGrab project.
 * 
 * Usage:
 * node scripts/setup-project.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create directory structure
const directories = [
  'src/lib/components/layout',
  'src/lib/components/forms',
  'src/lib/components/display',
  'src/lib/components/interactive',
  'src/lib/components/specific',
  'src/lib/firebase/db',
  'src/lib/stores',
  'src/lib/types',
  'src/lib/utils',
  'src/lib/services',
  'src/lib/constants',
  'src/routes/browse',
  'src/routes/listing',
  'src/routes/dashboard/owner',
  'src/routes/dashboard/renter',
  'src/routes/list-gear',
  'src/routes/book',
  'src/routes/booking',
  'src/routes/auth/login',
  'src/routes/auth/signup',
  'src/routes/profile',
  'src/routes/messages',
  'src/routes/how-it-works',
  'src/routes/api/bookings',
  'src/routes/api/listings',
  'src/routes/api/auth',
  'static/images',
  'static/fonts',
  'functions/src/utils'
];

// Create directories
directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${fullPath}`);
  }
});

// Create essential files
const essentialFiles = [
  {
    path: 'src/app.html',
    content: `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.ico" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>GearGrab - Rent Outdoor Gear from Local Owners</title>
		<meta name="description" content="GearGrab is a peer-to-peer marketplace for renting outdoor gear. Find camping, hiking, skiing, and other outdoor equipment from local owners." />
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>`
  },
  {
    path: 'src/app.css',
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
html {
  scroll-behavior: smooth;
}

body {
  @apply text-gray-800 bg-gray-50;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}`
  },
  {
    path: 'src/app.d.ts',
    content: `// See https://kit.svelte.dev/docs/types#app
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
      user: any;
      userId: string | null;
    }
		// interface PageData {}
		// interface Platform {}
	}
}

export {};`
  },
  {
    path: 'src/routes/+layout.svelte',
    content: `<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  
  // Import components when they're created
  // import Navbar from '$lib/components/layout/Navbar.svelte';
  // import Footer from '$lib/components/layout/Footer.svelte';
</script>

<!-- Add Navbar component here -->

<main class="min-h-screen">
  <slot />
</main>

<!-- Add Footer component here -->`
  },
  {
    path: 'src/routes/+page.svelte',
    content: `<script lang="ts">
  // Home page
</script>

<svelte:head>
  <title>GearGrab - Rent Outdoor Gear from Local Owners</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-6">Welcome to GearGrab</h1>
  
  <p>This is the homepage of GearGrab, a peer-to-peer marketplace for outdoor gear rentals.</p>
</div>`
  },
  {
    path: 'tailwind.config.js',
    content: `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};`
  },
  {
    path: 'postcss.config.js',
    content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`
  },
  {
    path: 'package.json',
    content: `{
  "name": "geargrab",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
    "generate:component": "node scripts/generate-component.js"
  },
  "devDependencies": {
    "@sveltejs/adapter-auto": "^2.0.0",
    "@sveltejs/kit": "^1.20.4",
    "@tailwindcss/forms": "^0.5.3",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24",
    "svelte": "^4.0.5",
    "svelte-check": "^3.4.3",
    "tailwindcss": "^3.3.2",
    "tslib": "^2.4.1",
    "typescript": "^5.0.0",
    "vite": "^4.4.2"
  },
  "type": "module",
  "dependencies": {
    "firebase": "^9.22.0"
  }
}`
  }
];

// Create files
essentialFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file.path);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, file.content);
  console.log(`Created file: ${fullPath}`);
});

console.log('Project structure setup complete!');
console.log('Next steps:');
console.log('1. Run "npm install" to install dependencies');
console.log('2. Run "npm run dev" to start the development server');
console.log('3. Use "npm run generate:component" to create new components');
