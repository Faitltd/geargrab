/**
 * Global TypeScript declarations for the GearGrab application
 * This file contains ambient type declarations that are available throughout the app
 */

declare global {
  namespace App {
    // Error interface for custom error handling
    interface Error {
      code?: string;
      details?: string;
    }

    // Locals interface for server-side data
    interface Locals {
      user?: {
        uid: string;
        email: string;
        displayName?: string;
        photoURL?: string;
        emailVerified: boolean;
        isAdmin?: boolean;
      };
      session?: {
        id: string;
        expiresAt: Date;
      };
    }

    // PageData interface for page-specific data
    interface PageData {
      user?: App.Locals['user'];
      session?: App.Locals['session'];
    }

    // Platform interface for deployment-specific data
    interface Platform {
      env?: {
        FIREBASE_PROJECT_ID?: string;
        STRIPE_PUBLISHABLE_KEY?: string;
        GOOGLE_MAPS_API_KEY?: string;
      };
    }
  }

  // Global environment variables
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      VITE_FIREBASE_API_KEY: string;
      VITE_FIREBASE_AUTH_DOMAIN: string;
      VITE_FIREBASE_PROJECT_ID: string;
      VITE_FIREBASE_STORAGE_BUCKET: string;
      VITE_FIREBASE_MESSAGING_SENDER_ID: string;
      VITE_FIREBASE_APP_ID: string;
      VITE_STRIPE_PUBLISHABLE_KEY: string;
      VITE_GOOGLE_MAPS_API_KEY: string;
      FIREBASE_ADMIN_PRIVATE_KEY: string;
      FIREBASE_ADMIN_CLIENT_EMAIL: string;
      STRIPE_SECRET_KEY: string;
      TWILIO_ACCOUNT_SID: string;
      TWILIO_AUTH_TOKEN: string;
      TWILIO_PHONE_NUMBER: string;
    }
  }

  // Firebase types
  interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  }

  // Stripe types
  interface StripeConfig {
    publishableKey: string;
    secretKey?: string;
  }

  // Custom window properties
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    stripe?: any;
    google?: any;
  }

  // Custom events
  interface CustomEventMap {
    'auth:login': CustomEvent<{ user: App.Locals['user'] }>;
    'auth:logout': CustomEvent<void>;
    'booking:created': CustomEvent<{ bookingId: string }>;
    'payment:success': CustomEvent<{ paymentIntentId: string; amount: number }>;
    'payment:failed': CustomEvent<{ error: string }>;
    'listing:created': CustomEvent<{ listingId: string }>;
    'listing:updated': CustomEvent<{ listingId: string }>;
    'message:received': CustomEvent<{ messageId: string; fromUserId: string }>;
  }

  // Extend HTMLElement to include custom events
  interface HTMLElement {
    addEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: HTMLElement, ev: CustomEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions
    ): void;
    
    removeEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: HTMLElement, ev: CustomEventMap[K]) => any,
      options?: boolean | EventListenerOptions
    ): void;
  }
}

// Vite environment variables
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_ENVIRONMENT: 'development' | 'staging' | 'production';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};
