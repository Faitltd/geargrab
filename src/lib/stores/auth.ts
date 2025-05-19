import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { auth } from '$lib/firebase/client';
import { onAuthStateChanged, type User } from 'firebase/auth';

// Create auth store
export const user = writable<User | null>(null);
export const isLoggedIn = writable<boolean>(false);
export const isLoading = writable<boolean>(true);

// Initialize auth state
export function initAuth() {
  if (browser) {
    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        user.set(user);
        isLoggedIn.set(user !== null);
        isLoading.set(false);
      },
      (error) => {
        console.error('Authentication error:', error);
        isLoading.set(false);
      }
    );
  }
}
