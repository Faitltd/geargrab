#!/usr/bin/env node

/**
 * Firebase Setup Script
 * 
 * This script creates the Firebase configuration files and helpers for the GearGrab project.
 * 
 * Usage:
 * node scripts/setup-firebase.js
 */

const fs = require('fs');
const path = require('path');

// Create Firebase configuration files
const firebaseFiles = [
  {
    path: 'src/lib/firebase/client.ts',
    content: `import { browser } from '$app/environment';
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
  
  // Connect to emulators in development
  if (import.meta.env.DEV) {
    const { connectAuthEmulator } = await import('firebase/auth');
    const { connectFirestoreEmulator } = await import('firebase/firestore');
    const { connectStorageEmulator } = await import('firebase/storage');
    
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(firestore, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
  }
}

export { firebaseApp, auth, firestore, storage };`
  },
  {
    path: 'src/lib/firebase/server.ts',
    content: `import { dev } from '$app/environment';
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

// Initialize Firebase Admin
let adminApp: App;
let adminAuth: Auth;
let adminFirestore: Firestore;
let adminStorage: Storage;

// Only initialize if not already initialized
if (getApps().length === 0) {
  // For development, use a mock configuration
  if (dev) {
    adminApp = initializeApp({
      projectId: 'demo-project'
    });
  } else {
    // For production, use environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\\n');
    
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase Admin credentials');
    }
    
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey
      }),
      storageBucket: \`\${projectId}.appspot.com\`
    });
  }
  
  adminAuth = getAuth(adminApp);
  adminFirestore = getFirestore(adminApp);
  adminStorage = getStorage(adminApp);
  
  // Configure Firestore
  adminFirestore.settings({
    ignoreUndefinedProperties: true
  });
  
  // Connect to emulators in development
  if (dev) {
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
  }
} else {
  adminApp = getApps()[0];
  adminAuth = getAuth(adminApp);
  adminFirestore = getFirestore(adminApp);
  adminStorage = getStorage(adminApp);
}

export { adminApp, adminAuth, adminFirestore, adminStorage };`
  },
  {
    path: 'src/lib/firebase/auth.ts',
    content: `import { browser } from '$app/environment';
import { auth } from './client';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type UserCredential
} from 'firebase/auth';

// Sign in with email and password
export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  if (!browser) throw new Error('Auth functions can only be called in the browser');
  return signInWithEmailAndPassword(auth, email, password);
}

// Sign up with email and password
export async function signUpWithEmail(
  email: string, 
  password: string, 
  displayName: string
): Promise<UserCredential> {
  if (!browser) throw new Error('Auth functions can only be called in the browser');
  
  // Create the user in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update the user profile with display name
  await userCredential.user.updateProfile({ displayName });
  
  return userCredential;
}

// Sign out
export async function signOut(): Promise<void> {
  if (!browser) throw new Error('Auth functions can only be called in the browser');
  return firebaseSignOut(auth);
}`
  },
  {
    path: 'src/lib/types/firestore.ts',
    content: `import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
}

export interface Listing {
  id: string;
  ownerUid: string;
  title: string;
  description: string;
  category: string;
  price: number;
  location: {
    city: string;
    state: string;
  };
  images: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Booking {
  id: string;
  listingId: string;
  ownerUid: string;
  renterUid: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  totalPrice: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}`
  },
  {
    path: 'src/lib/stores/auth.ts',
    content: `import { browser } from '$app/environment';
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

export { authStore };`
  },
  {
    path: 'firestore.rules',
    content: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Utility functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // User profiles - public read, user-only write
    match /users/{userId} {
      allow read: if true;
      allow create: if isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if false;
    }
    
    // Gear listings - public read, owner-only write
    match /listings/{listingId} {
      allow read: if true;
      allow create: if isAuthenticated() && request.resource.data.ownerUid == request.auth.uid;
      allow update: if isOwner(resource.data.ownerUid);
      allow delete: if isOwner(resource.data.ownerUid);
    }
    
    // Bookings - involved parties can read/write
    match /bookings/{bookingId} {
      allow read: if isAuthenticated() && (
        request.auth.uid == resource.data.renterUid || 
        request.auth.uid == resource.data.ownerUid
      );
      allow create: if isAuthenticated() && request.resource.data.renterUid == request.auth.uid;
      allow update: if isAuthenticated() && (
        request.auth.uid == resource.data.renterUid || 
        request.auth.uid == resource.data.ownerUid
      );
      allow delete: if false;
    }
  }
}`
  },
  {
    path: 'storage.rules',
    content: `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User profile images - public read, user-only write
    match /users/{userId}/profile/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Listing images - public read, owner-only write
    match /listings/{listingId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.uid == get(/databases/(default)/documents/listings/$(listingId)).data.ownerUid;
    }
  }
}`
  },
  {
    path: 'firebase.json',
    content: `{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}`
  },
  {
    path: 'firestore.indexes.json',
    content: `{
  "indexes": [
    {
      "collectionGroup": "listings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "renterUid", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ownerUid", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}`
  }
];

// Create files
firebaseFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file.path);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, file.content);
  console.log(`Created file: ${fullPath}`);
});

console.log('Firebase setup complete!');
console.log('Next steps:');
console.log('1. Create a .env file with your Firebase configuration');
console.log('2. Run Firebase emulators for local development: "firebase emulators:start"');
