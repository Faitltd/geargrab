// Main Firebase exports - re-export from client for consistency
export { firebaseApp as app, auth, firestore as db, storage } from './client';

// Also export the configuration and utilities
export { firebaseConfig, emulatorConfig, logFirebaseConfigStatus, validateFirebaseConfig } from './config';
