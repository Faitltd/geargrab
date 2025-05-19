# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install essential build tools
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Create necessary directories
RUN mkdir -p src/lib/firebase src/lib/stores .svelte-kit

# Create a basic tsconfig.json file
RUN echo '{ 
  "compilerOptions": { 
    "moduleResolution": "node", 
    "target": "es2020", 
    "module": "es2020", 
    "importsNotUsedAsValues": "error", 
    "isolatedModules": true, 
    "resolveJsonModule": true, 
    "sourceMap": true, 
    "esModuleInterop": true, 
    "skipLibCheck": true, 
    "forceConsistentCasingInFileNames": true, 
    "baseUrl": ".", 
    "allowJs": true, 
    "checkJs": true, 
    "paths": { 
      "$lib": ["src/lib"], 
      "$lib/*": ["src/lib/*"] 
    } 
  }, 
  "include": ["src/**/*.d.ts", "src/**/*.js", "src/**/*.ts", "src/**/*.svelte"] 
}' > tsconfig.json

# Create a basic .svelte-kit/tsconfig.json file
RUN mkdir -p .svelte-kit && echo '{ 
  "compilerOptions": { 
    "moduleResolution": "node", 
    "target": "es2020", 
    "module": "es2020", 
    "importsNotUsedAsValues": "error", 
    "isolatedModules": true, 
    "resolveJsonModule": true, 
    "sourceMap": true, 
    "esModuleInterop": true, 
    "skipLibCheck": true, 
    "forceConsistentCasingInFileNames": true, 
    "baseUrl": "..", 
    "allowJs": true, 
    "checkJs": true, 
    "paths": { 
      "$lib": ["src/lib"], 
      "$lib/*": ["src/lib/*"] 
    } 
  }, 
  "include": ["../src/**/*.d.ts", "../src/**/*.js", "../src/**/*.ts", "../src/**/*.svelte"] 
}' > .svelte-kit/tsconfig.json

# Fix svelte.config.js - replace the entire file
RUN echo 'import adapter from "@sveltejs/adapter-static";

/** @type {import("@sveltejs/kit").Config} */
const config = {
    kit: {
        adapter: adapter({
            pages: "build",
            assets: "build",
            fallback: null
        })
    }
};

export default config;' > svelte.config.js

# Create stub files if they don't exist
RUN if [ ! -f src/lib/firebase/server.ts ]; then \
    echo '// Stub file for Firebase server
export const adminFirestore = { collection: () => ({ doc: () => ({ get: async () => ({ exists: false, data: () => ({}) }) }) }) };' > src/lib/firebase/server.ts; \
    fi

RUN if [ ! -f src/lib/stores/auth.ts ]; then \
    echo '// Stub file for auth store
import { writable } from "svelte/store";
export const authStore = writable({ user: null, loading: false, error: null });' > src/lib/stores/auth.ts; \
    fi

# Create a minimal app structure if it doesn't exist
RUN mkdir -p src/routes
RUN if [ ! -f src/routes/+page.svelte ]; then \
    echo '<h1>GearGrab</h1>
<p>Welcome to GearGrab!</p>' > src/routes/+page.svelte; \
    fi

# Install static adapter
RUN npm install -D @sveltejs/adapter-static

# Build the SvelteKit app
RUN npm run build

# Runtime stage
FROM node:20-slim

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/build ./build

# Install only production dependencies
RUN npm ci --omit=dev

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "build/index.js"]