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
