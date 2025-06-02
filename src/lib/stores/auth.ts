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

// Auth state will be initialized in the root layout

// Export alias for backward compatibility
export const userStore = authStore;
