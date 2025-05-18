# SvelteKit Project Structure for GearGrab

```
geargrab/
├── src/
│   ├── app.html                 # Main HTML template
│   ├── app.d.ts                 # TypeScript declarations
│   ├── hooks.server.ts          # SvelteKit server hooks
│   ├── ambient.d.ts             # Global TypeScript declarations
│   ├── lib/                     # Shared library code
│   │   ├── components/          # Svelte components
│   │   │   ├── layout/          # Layout components (Navbar, Footer, etc.)
│   │   │   ├── forms/           # Form components
│   │   │   ├── display/         # Display components (GearCard, UserAvatar, etc.)
│   │   │   ├── interactive/     # Interactive components (Button, Modal, etc.)
│   │   │   └── specific/        # GearGrab-specific components
│   │   ├── firebase/            # Firebase integration
│   │   │   ├── client.ts        # Firebase client initialization
│   │   │   ├── server.ts        # Firebase admin initialization
│   │   │   ├── auth.ts          # Auth helpers
│   │   │   └── db/              # Database helpers
│   │   │       ├── listings.ts  # Listing-related database operations
│   │   │       ├── bookings.ts  # Booking-related database operations
│   │   │       └── ...          # Other collections
│   │   ├── stores/              # Svelte stores
│   │   │   ├── auth.ts          # Authentication store
│   │   │   ├── cart.ts          # Booking cart store
│   │   │   └── notifications.ts # Notifications store
│   │   ├── types/               # TypeScript type definitions
│   │   │   ├── firestore.ts     # Firestore document types
│   │   │   └── api.ts           # API types
│   │   ├── utils/               # Utility functions
│   │   │   ├── dates.ts         # Date handling utilities
│   │   │   ├── validation.ts    # Form validation
│   │   │   ├── formatting.ts    # Text/currency formatting
│   │   │   └── geolocation.ts   # Location utilities
│   │   ├── services/            # External service integrations
│   │   │   ├── maps.ts          # Maps API integration
│   │   │   └── payments.ts      # Payment processor integration
│   │   └── constants/           # Application constants
│   │       ├── categories.ts    # Gear categories
│   │       └── routes.ts        # Route definitions
│   ├── routes/                  # SvelteKit routes
│   │   ├── +page.svelte         # Homepage
│   │   ├── +layout.svelte       # Root layout
│   │   ├── +layout.server.ts    # Server-side layout logic
│   │   ├── browse/              # Browse gear pages
│   │   │   ├── +page.svelte     # Browse main page
│   │   │   ├── +page.ts         # Client-side data loading
│   │   │   └── +page.server.ts  # Server-side data loading
│   │   ├── listing/             # Listing details
│   │   │   └── [listingId]/     # Dynamic route
│   │   │       ├── +page.svelte
│   │   │       └── +page.ts
│   │   ├── dashboard/           # User dashboards
│   │   │   ├── +layout.svelte   # Dashboard layout
│   │   │   ├── owner/           # Owner dashboard
│   │   │   └── renter/          # Renter dashboard
│   │   ├── list-gear/           # List gear flow
│   │   ├── book/                # Booking flow
│   │   ├── booking/             # Booking management
│   │   ├── auth/                # Authentication pages
│   │   ├── profile/             # User profiles
│   │   ├── messages/            # In-app messaging
│   │   ├── how-it-works/        # Informational pages
│   │   ├── insurance/
│   │   ├── safety-trust/
│   │   ├── help/
│   │   └── api/                 # API routes (server)
│   │       ├── bookings/
│   │       ├── payments/
│   │       ├── claims/
│   │       └── ggverify/
├── static/                      # Static assets
│   ├── images/
│   ├── fonts/
│   └── favicon.ico
├── tests/                       # Test files
├── functions/                   # Firebase Functions
│   ├── src/
│   │   ├── index.ts             # Functions entry point
│   │   ├── bookings.ts          # Booking-related functions
│   │   ├── payments.ts          # Payment processing functions
│   │   ├── notifications.ts     # Notification functions
│   │   └── utils/               # Shared utilities
│   ├── package.json
│   └── tsconfig.json
├── firebase.json                # Firebase configuration
├── firestore.indexes.json       # Firestore indexes
├── firestore.rules              # Firestore security rules
├── storage.rules                # Storage security rules
├── .firebaserc                  # Firebase project configuration
├── svelte.config.js             # SvelteKit configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Project dependencies
└── README.md                    # Project documentation
```

## Additional Configuration Files

### svelte.config.js
```javascript
import adapter from '@sveltejs/adapter-node'; // For Cloud Run deployment
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  
  kit: {
    adapter: adapter({
      // Cloud Run compatible settings
      out: 'build',
      precompress: true,
      envPrefix: 'VITE_'
    }),
    alias: {
      $components: 'src/lib/components',
      $stores: 'src/lib/stores',
      $utils: 'src/lib/utils',
      $firebase: 'src/lib/firebase',
      $types: 'src/lib/types',
      $services: 'src/lib/services',
      $constants: 'src/lib/constants'
    }
  }
};

export default config;
```

### firebase.json
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "functions": {
    "source": "functions",
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run lint",
      "npm --prefix \"$RESOURCE_DIR\" run build"
    ]
  },
  "hosting": {
    "public": "static",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "run": {
          "serviceId": "geargrab-app",
          "region": "us-central1"
        }
      }
    ]
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "hosting": {
      "port": 5000
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true
    }
  }
}
```

### package.json
```json
{
  "name": "geargrab",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
    "lint": "eslint .",
    "emulate": "firebase emulators:start --import=./emulator-data --export-on-exit",
    "deploy": "npm run build && firebase deploy"
  },
  "devDependencies": {
    "@sveltejs/adapter-node": "^1.0.0",
    "@sveltejs/kit": "^1.0.0",
    "@typescript-eslint/eslint-plugin": "^5.45.0",
    "@typescript-eslint/parser": "^5.45.0",
    "autoprefixer": "^10.4.14",
    "eslint": "^8.28.0",
    "eslint-plugin-svelte": "^2.30.0",
    "postcss": "^8.4.24",
    "svelte": "^4.0.0",
    "svelte-check": "^3.4.3",
    "tailwindcss": "^3.3.2",
    "typescript": "^5.0.0",
    "vite": "^4.3.6"
  },
  "dependencies": {
    "firebase": "^10.1.0",
    "date-fns": "^2.30.0",
    "leaflet": "^1.9.4",
    "@stripe/stripe-js": "^1.54.1",
    "svelte-gestures": "^1.5.2",
    "svelte-french-toast": "^1.2.0"
  },
  "type": "module"
}
```