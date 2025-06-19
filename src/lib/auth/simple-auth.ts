import { writable } from 'svelte/store';
import type { User } from 'firebase/auth';

interface SimpleAuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

class SimpleAuthService {
  private authStore = writable<SimpleAuthState>({
    user: null,
    loading: true,
    isAuthenticated: false
  });

  private currentUser: User | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      console.log('🔐 Simple Auth: Initializing in browser...');
      setTimeout(() => this.initFirebase(), 100);
    } else {
      console.log('🔐 Simple Auth: Server-side, setting not loading');
      this.authStore.set({
        user: null,
        loading: false,
        isAuthenticated: false
      });
    }
  }

  private async initFirebase() {
    try {
      console.log('🔄 Simple Auth: Loading Firebase...');

      const { auth } = await import('$lib/firebase/client');
      const { onAuthStateChanged } = await import('firebase/auth');

      if (!auth) {
        console.error('❌ Simple Auth: Firebase auth not available');
        this.authStore.set({
          user: null,
          loading: false,
          isAuthenticated: false
        });
        return;
      }

      console.log('✅ Simple Auth: Firebase loaded, setting up listener...');

      onAuthStateChanged(auth, (user) => {
        console.log('🔥 Simple Auth: State changed:', user ? user.email : 'null');

        this.currentUser = user;
        this.authStore.set({
          user,
          loading: false,
          isAuthenticated: !!user
        });
      });

    } catch (error: any) {
      console.error('❌ Simple Auth: Firebase init error:', error);
      this.authStore.set({
        user: null,
        loading: false,
        isAuthenticated: false
      });
    }
  }

  get authState() {
    return this.authStore;
  }

  get user() {
    return this.currentUser;
  }

  get isAuthenticated() {
    return !!this.currentUser;
  }

  async getIdToken(forceRefresh: boolean = false): Promise<string | null> {
    if (!this.currentUser) {
      console.log('❌ Cannot get token - user not authenticated');
      return null;
    }

    try {
      console.log('🔄 Getting Firebase ID token...');
      const token = await this.currentUser.getIdToken(forceRefresh);
      console.log('✅ Token retrieved successfully');
      return token;
    } catch (error: any) {
      console.error('❌ Token retrieval failed:', error);
      return null;
    }
  }

  async refreshAuth() {
    try {
      const { auth } = await import('$lib/firebase/client');

      if (auth?.currentUser) {
        console.log('✅ Simple Auth: Refresh found user:', auth.currentUser.email);
        this.currentUser = auth.currentUser;
        this.authStore.set({
          user: auth.currentUser,
          loading: false,
          isAuthenticated: true
        });
      } else {
        console.log('❌ Simple Auth: Refresh found no user');
        this.currentUser = null;
        this.authStore.set({
          user: null,
          loading: false,
          isAuthenticated: false
        });
      }
    } catch (error: any) {
      console.error('❌ Simple Auth: Refresh error:', error);
    }
  }

  async waitForAuthReady(timeoutMs: number = 5000): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const checkAuth = () => {
        if (!this.authStore) {
          resolve(false);
          return;
        }

        let currentState: SimpleAuthState;
        this.authStore.subscribe(state => {
          currentState = state;
        })();

        // If not loading and we have a definitive state, we're ready
        if (!currentState.loading) {
          console.log('✅ Auth ready:', currentState.isAuthenticated ? 'authenticated' : 'not authenticated');
          resolve(true);
          return;
        }

        // If we've exceeded timeout, give up
        if (Date.now() - startTime > timeoutMs) {
          console.warn('⚠️ Auth ready timeout exceeded');
          resolve(false);
          return;
        }

        // Check again in 100ms
        setTimeout(checkAuth, 100);
      };

      checkAuth();
    });
  }

  async waitForAuth(timeoutMs: number = 5000): Promise<void> {
    const isReady = await this.waitForAuthReady(timeoutMs);
    if (!isReady) {
      throw new Error('Authentication timeout - please refresh the page and try again');
    }
  }

  async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Simple Auth: Starting Google sign-in with redirect...');

      const { auth } = await import('$lib/firebase/client');
      const { GoogleAuthProvider, signInWithRedirect } = await import('firebase/auth');

      if (!auth) {
        throw new Error('Firebase auth not available');
      }

      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      // Use redirect instead of popup to avoid browser blocking
      await signInWithRedirect(auth, provider);

      // Note: signInWithRedirect doesn't return a result immediately
      // The result will be handled by getRedirectResult in the app initialization
      console.log('🔄 Simple Auth: Google redirect initiated...');

      return { success: true };
    } catch (error: any) {
      console.error('❌ Simple Auth: Google sign-in failed:', error);
      return { success: false, error: error.message };
    }
  }

  async handleRedirectResult(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      console.log('🔄 Simple Auth: Checking for redirect result...');

      const { auth } = await import('$lib/firebase/client');
      const { getRedirectResult } = await import('firebase/auth');

      if (!auth) {
        return { success: false, error: 'Firebase auth not available' };
      }

      const result = await getRedirectResult(auth);

      if (result && result.user) {
        console.log('✅ Simple Auth: Google redirect sign-in successful:', result.user.email);

        // Update our auth state
        this.currentUser = result.user;
        this.authStore.set({
          user: result.user,
          loading: false,
          isAuthenticated: true
        });

        return { success: true, user: result.user };
      } else {
        console.log('🔄 Simple Auth: No redirect result found');
        return { success: true }; // No redirect result is not an error
      }
    } catch (error: any) {
      console.error('❌ Simple Auth: Redirect result handling failed:', error);
      return { success: false, error: error.message };
    }
  }

  async signInWithEmailPassword(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Simple Auth: Starting email/password sign-in...');

      const { auth } = await import('$lib/firebase/client');
      const { signInWithEmailAndPassword } = await import('firebase/auth');

      if (!auth) {
        throw new Error('Firebase auth not available');
      }

      const result = await signInWithEmailAndPassword(auth, email, password);

      console.log('✅ Simple Auth: Email sign-in successful:', result.user.email);

      // Immediately update our auth state
      this.currentUser = result.user;
      this.authStore.set({
        user: result.user,
        loading: false,
        isAuthenticated: true
      });

      // Wait a moment for state to propagate
      await new Promise(resolve => setTimeout(resolve, 100));

      return { success: true };
    } catch (error: any) {
      console.error('❌ Simple Auth: Email sign-in failed:', error);
      return { success: false, error: error.message };
    }
  }

  async createUserWithEmailPassword(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Simple Auth: Creating user with email/password...');

      const { auth } = await import('$lib/firebase/client');
      const { createUserWithEmailAndPassword } = await import('firebase/auth');

      if (!auth) {
        throw new Error('Firebase auth not available');
      }

      const result = await createUserWithEmailAndPassword(auth, email, password);

      console.log('✅ Simple Auth: User creation successful:', result.user.email);

      return { success: true };
    } catch (error: any) {
      console.error('❌ Simple Auth: User creation failed:', error);
      return { success: false, error: error.message };
    }
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Simple Auth: Signing out...');

      const { auth } = await import('$lib/firebase/client');
      const { signOut } = await import('firebase/auth');

      if (!auth) {
        throw new Error('Firebase auth not available');
      }

      await signOut(auth);

      console.log('✅ Simple Auth: Sign-out successful');

      return { success: true };
    } catch (error: any) {
      console.error('❌ Simple Auth: Sign-out failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export const simpleAuth = new SimpleAuthService();
