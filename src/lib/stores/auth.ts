import { browser } from '$app/environment';
import { derived } from 'svelte/store';
import { auth } from '$lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';

// Define the user type
type User = {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
} | null;

// Create the auth store
function createAuthStore() {
  const { subscribe, set, update } = writable<{
    user: User;
    loading: boolean;
    error: string | null;
  }>({
    user: null,
    loading: true,
    error: null
  });

  return {
    subscribe,
    setUser: (user: User) => update(state => ({ ...state, user, loading: false })),
    setLoading: (loading: boolean) => update(state => ({ ...state, loading })),
    setError: (error: string | null) => update(state => ({ ...state, error, loading: false })),
    signOut: () => update(state => ({ ...state, user: null, error: null }))
  };
}

export const authStore = createAuthStore();

// Create a derived store that just contains the user with additional properties
const userStore = derived(authStore, ($authStore) => ({
  authUser: $authStore.user,
  isLoggedIn: !!$authStore.user,
  loading: $authStore.loading,
  error: $authStore.error
}));

// Initialize auth state listener
if (browser) {
  // Listen for auth state changes
  const unsubscribeAuth = onAuthStateChanged(
    auth,
    (user) => {
      authStore.setUser(user);
    },
    (error) => {
      authStore.setError(error.message);
    }
  );
}

export { authStore, userStore };