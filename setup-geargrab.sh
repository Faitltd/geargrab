#!/bin/bash

# GearGrab Setup Script
# This script automates the setup of the GearGrab application

echo "🚀 Setting up GearGrab application..."

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p src/lib/{components/{layout,forms,display,interactive,specific},firebase/{db},stores,types,utils,services,constants}
mkdir -p src/routes/{browse,listing,dashboard/{owner,renter},list-gear,book,booking,auth/{login,signup},profile,messages,how-it-works,api/{bookings,listings,auth}}
mkdir -p static/{images,fonts}
mkdir -p functions/src/utils

# Create essential configuration files
echo "⚙️ Creating configuration files..."

# package.json
cat > package.json << 'EOL'
{
  "name": "geargrab",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch"
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
  "dependencies": {
    "firebase": "^9.22.0",
    "firebase-admin": "^11.8.0",
    "date-fns": "^2.30.0"
  }
}
EOL

# svelte.config.js
cat > svelte.config.js << 'EOL'
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  
  kit: {
    adapter: adapter(),
    alias: {
      $lib: './src/lib',
      $components: './src/lib/components',
      $stores: './src/lib/stores',
      $utils: './src/lib/utils',
      $firebase: './src/lib/firebase',
      $types: './src/lib/types',
      $services: './src/lib/services',
      $constants: './src/lib/constants'
    }
  }
};

export default config;
EOL

# vite.config.js
cat > vite.config.js << 'EOL'
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5173,
    strictPort: false,
  }
});
EOL

# tailwind.config.js
cat > tailwind.config.js << 'EOL'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
EOL

# postcss.config.js
cat > postcss.config.js << 'EOL'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOL

# tsconfig.json
cat > tsconfig.json << 'EOL'
{
	"extends": "./.svelte-kit/tsconfig.json",
	"compilerOptions": {
		"allowJs": true,
		"checkJs": true,
		"esModuleInterop": true,
		"forceConsistentCasingInFileNames": true,
		"resolveJsonModule": true,
		"skipLibCheck": true,
		"sourceMap": true,
		"strict": true,
		"paths": {
			"$lib": ["./src/lib"],
			"$lib/*": ["./src/lib/*"],
			"$components": ["./src/lib/components"],
			"$components/*": ["./src/lib/components/*"],
			"$stores": ["./src/lib/stores"],
			"$stores/*": ["./src/lib/stores/*"],
			"$utils": ["./src/lib/utils"],
			"$utils/*": ["./src/lib/utils/*"],
			"$firebase": ["./src/lib/firebase"],
			"$firebase/*": ["./src/lib/firebase/*"],
			"$types": ["./src/lib/types"],
			"$types/*": ["./src/lib/types/*"],
			"$services": ["./src/lib/services"],
			"$services/*": ["./src/lib/services/*"],
			"$constants": ["./src/lib/constants"],
			"$constants/*": ["./src/lib/constants/*"]
		}
	}
}
EOL

# Create essential app files
echo "📄 Creating essential app files..."

# src/app.html
cat > src/app.html << 'EOL'
<!DOCTYPE html>
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
</html>
EOL

# src/app.css
cat > src/app.css << 'EOL'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
html {
  scroll-behavior: smooth;
}

body {
  @apply text-gray-800 bg-gray-50;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  @apply font-semibold;
}

h1 {
  @apply text-3xl md:text-4xl;
}

h2 {
  @apply text-2xl md:text-3xl;
}

h3 {
  @apply text-xl md:text-2xl;
}

/* Form elements */
.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.btn {
  @apply inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply bg-green-600 text-white hover:bg-green-700 focus:ring-green-500;
}

.btn-secondary {
  @apply bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-green-500;
}
EOL

# src/app.d.ts
cat > src/app.d.ts << 'EOL'
// See https://kit.svelte.dev/docs/types#app
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

export {};
EOL

# Create layout and homepage
echo "🏠 Creating layout and homepage..."

# src/routes/+layout.svelte
cat > src/routes/+layout.svelte << 'EOL'
<script lang="ts">
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

<!-- Add Footer component here -->
EOL

# src/routes/+page.svelte
cat > src/routes/+page.svelte << 'EOL'
<script lang="ts">
  // Home page
</script>

<svelte:head>
  <title>GearGrab - Rent Outdoor Gear from Local Owners</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-6">Welcome to GearGrab</h1>
  
  <p>This is the homepage of GearGrab, a peer-to-peer marketplace for outdoor gear rentals.</p>
  
  <div class="mt-8">
    <a href="/browse" class="btn btn-primary">Browse Gear</a>
  </div>
</div>
EOL

# Create Firebase setup
echo "🔥 Setting up Firebase integration..."

# src/lib/firebase/client.ts
cat > src/lib/firebase/client.ts << 'EOL'
import { browser } from '$app/environment';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-ABCDEF123'
};

// Initialize Firebase for the browser
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

if (browser) {
  // Initialize Firebase
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  // Initialize Firebase services
  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);
}

export { firebaseApp, auth, firestore, storage };
EOL

# Create auth store
cat > src/lib/stores/auth.ts << 'EOL'
import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { auth } from '$lib/firebase/client';
import { onAuthStateChanged, type User } from 'firebase/auth';

// Create a writable store for the auth state
const authStore = writable<{
  user: User | null;
  loading: boolean;
  error: Error | null;
}>({
  user: null,
  loading: true,
  error: null
});

// Initialize auth state listener
if (browser) {
  // Listen for auth state changes
  const unsubscribeAuth = onAuthStateChanged(
    auth,
    (user) => {
      authStore.update((state) => ({
        ...state,
        user,
        loading: false
      }));
    },
    (error) => {
      authStore.update((state) => ({
        ...state,
        error,
        loading: false
      }));
    }
  );
}

export { authStore };
EOL

# Create a basic component
echo "🧩 Creating basic components..."

# src/lib/components/layout/Navbar.svelte
cat > src/lib/components/layout/Navbar.svelte << 'EOL'
<script lang="ts">
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth';
  
  let isMenuOpen = false;
  
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }
</script>

<nav class="bg-white shadow">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <div class="flex">
        <div class="flex-shrink-0 flex items-center">
          <a href="/" class="text-green-600 font-bold text-xl">GearGrab</a>
        </div>
        <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
          <a href="/" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
            Home
          </a>
          <a href="/browse" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
            Browse
          </a>
          <a href="/list-gear" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
            List Gear
          </a>
        </div>
      </div>
      <div class="hidden sm:ml-6 sm:flex sm:items-center">
        {#if $authStore.user}
          <a href="/dashboard" class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
            Dashboard
          </a>
          <button class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
            Sign Out
          </button>
        {:else}
          <a href="/auth/login" class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
            Log In
          </a>
          <a href="/auth/signup" class="bg-green-600 text-white hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium ml-2">
            Sign Up
          </a>
        {/if}
      </div>
      <div class="-mr-2 flex items-center sm:hidden">
        <button 
          type="button" 
          class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500" 
          aria-expanded="false"
          on:click={toggleMenu}
        >
          <span class="sr-only">Open main menu</span>
          <svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>

  {#if isMenuOpen}
    <div class="sm:hidden">
      <div class="pt-2 pb-3 space-y-1">
        <a href="/" class="bg-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700">
          Home
        </a>
        <a href="/browse" class="bg-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700">
          Browse
        </a>
        <a href="/list-gear" class="bg-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700">
          List Gear
        </a>
      </div>
      <div class="pt-4 pb-3 border-t border-gray-200">
        {#if $authStore.user}
          <div class="flex items-center px-4">
            <div class="flex-shrink-0">
              <span class="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-500">
                <span class="text-xl font-medium leading-none text-white">
                  {$authStore.user.displayName?.[0] || $authStore.user.email?.[0] || 'U'}
                </span>
              </span>
            </div>
            <div class="ml-3">
              <div class="text-base font-medium text-gray-800">{$authStore.user.displayName || $authStore.user.email}</div>
            </div>
          </div>
          <div class="mt-3 space-y-1">
            <a href="/dashboard" class="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
              Dashboard
            </a>
            <button class="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
              Sign out
            </button>
          </div>
        {:else}
          <div class="mt-3 space-y-1">
            <a href="/auth/login" class="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
              Log In
            </a>
            <a href="/auth/signup" class="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
              Sign Up
            </a>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</nav>
EOL

# Update layout to use Navbar
cat > src/routes/+layout.svelte << 'EOL'
<script lang="ts">
  import '../app.css';
  import Navbar from '$lib/components/layout/Navbar.svelte';
</script>

<Navbar />

<main class="min-h-screen">
  <slot />
</main>

<footer class="bg-gray-800 text-white py-8">
  <div class="container mx-auto px-4">
    <p class="text-center">&copy; {new Date().getFullYear()} GearGrab. All rights reserved.</p>
  </div>
</footer>
EOL

# Create a basic browse page
echo "🔍 Creating browse page..."

cat > src/routes/browse/+page.svelte << 'EOL'
<script lang="ts">
  // Sample data - in a real app, this would come from Firebase
  const listings = [
    {
      id: '1',
      title: 'Camping Tent (4-Person)',
      description: 'Spacious 4-person tent, perfect for family camping trips.',
      price: 35,
      image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      location: 'Denver, CO'
    },
    {
      id: '2',
      title: 'Mountain Bike',
      description: 'High-quality mountain bike for trail riding.',
      price: 45,
      image: 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      location: 'Boulder, CO'
    },
    {
      id: '3',
      title: 'Kayak',
      description: 'Stable and comfortable kayak for lake adventures.',
      price: 50,
      image: 'https://images.unsplash.com/photo-1604537466158-719b1972feb8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80',
      location: 'Fort Collins, CO'
    }
  ];
</script>

<svelte:head>
  <title>Browse Gear - GearGrab</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-6">Browse Gear</h1>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each listings as listing}
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <img src={listing.image} alt={listing.title} class="w-full h-48 object-cover" />
        <div class="p-4">
          <h2 class="text-xl font-semibold mb-2">{listing.title}</h2>
          <p class="text-gray-600 mb-4">{listing.description}</p>
          <div class="flex justify-between items-center">
            <span class="text-green-600 font-bold">${listing.price}/day</span>
            <span class="text-gray-500">{listing.location}</span>
          </div>
          <a href="/listing/{listing.id}" class="btn btn-primary w-full mt-4">View Details</a>
        </div>
      </div>
    {/each}
  </div>
</div>
EOL

echo "✅ GearGrab setup complete!"
echo "To start the development server, run:"
echo "npm install"
echo "npm run dev"
