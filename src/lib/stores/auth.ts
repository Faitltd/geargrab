import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Define the user type
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

// Create the auth store
export const authStore = writable<{
  user: User | null;
  loading: boolean;
  error: string | null;
}>({
  user: null,
  loading: true,
  error: null
});

// Initialize Firebase auth listener only in browser
if (browser) {
  // Use setTimeout to avoid any potential circular dependency issues
  setTimeout(async () => {
    try {
      const { auth } = await import('$lib/firebase/client');
      const { onAuthStateChanged } = await import('firebase/auth');

      onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || ''
          };

          authStore.set({
            user,
            loading: false,
            error: null
          });

          console.log('User signed in:', user.email);
        } else {
          authStore.set({
            user: null,
            loading: false,
            error: null
          });

          console.log('User signed out');
        }
      });
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      authStore.set({
        user: null,
        loading: false,
        error: 'Failed to initialize authentication'
      });
    }
  }, 0);
}

// Export alias for backward compatibility
export const userStore = authStore;
