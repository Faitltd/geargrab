import { browser } from '$app/environment';
import { auth } from '$lib/firebase/client';
import { writable } from 'svelte/store';
import type { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  error?: string;
}

const initialState: AuthState = {
  user: null,
  loading: true
};

const authState = writable<AuthState>(initialState);

if (browser && auth) {
  auth.onAuthStateChanged(
    (user) => {
      authState.set({ user, loading: false });
    },
    (error) => {
      authState.set({ user: null, loading: false, error: error.message });
    }
  );
} else {
  authState.set({ user: null, loading: false });
}

function waitForAuth(): Promise<void> {
  return new Promise((resolve) => {
    let resolved = false;

    const unsubscribe = authState.subscribe((state) => {
      if (!state.loading && !resolved) {
        resolved = true;
        unsubscribe();
        resolve();
      }
    });
  });
}

async function getIdToken(forceRefresh = false): Promise<string | null> {
  if (!browser || !auth?.currentUser) return null;
  return auth.currentUser.getIdToken(forceRefresh);
}

export const simpleAuth = {
  authState,
  waitForAuth,
  getIdToken
};
