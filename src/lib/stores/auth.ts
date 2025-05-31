import { writable } from 'svelte/store';

// Define the user type
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

// Create the auth store with proper initialization
export const authStore = writable<{
  user: User | null;
  loading: boolean;
  error: string | null;
}>({
  user: null,
  loading: false,
  error: null
});

// Initialize the store immediately to prevent undefined errors
if (typeof window !== 'undefined') {
  // Client-side initialization
  authStore.set({
    user: null,
    loading: false,
    error: null
  });
}
