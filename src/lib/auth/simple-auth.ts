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

  async refreshAuth(): Promise<void> {
    console.log('🔄 Simple Auth: Refreshing auth state...');

    try {
      const { auth } = await import('$lib/firebase/client');

      if (!auth) {
        console.log('❌ Firebase auth not available');
        return;
      }

      // Wait for auth to be ready and get current user
      await auth.authStateReady();
      const currentUser = auth.currentUser;

      if (currentUser) {
        // Force refresh the token to ensure it's valid
        try {
          await currentUser.getIdToken(true);
          console.log('✅ Simple Auth: Refresh successful for:', currentUser.email);

          this.currentUser = currentUser;
          this.authStore.set({
            user: currentUser,
            loading: false,
            isAuthenticated: true
          });
        } catch (tokenError) {
          console.error('❌ Token refresh failed:', tokenError);
          // Token refresh failed, user might be logged out
          this.currentUser = null;
          this.authStore.set({
            user: null,
            loading: false,
            isAuthenticated: false
          });
        }
      } else {
        console.log('❌ Simple Auth: No current user found during refresh');
        this.currentUser = null;
        this.authStore.set({
          user: null,
          loading: false,
          isAuthenticated: false
        });
      }
    } catch (error: any) {
      console.error('❌ Simple Auth: Refresh error:', error);
      this.currentUser = null;
      this.authStore.set({
        user: null,
        loading: false,
        isAuthenticated: false
      });
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
      console.log('🔄 Simple Auth: Starting Google sign-in with popup...');

      // Pre-load Firebase modules for faster execution
      const [{ auth }, { GoogleAuthProvider, signInWithPopup }] = await Promise.all([
        import('$lib/firebase/client'),
        import('firebase/auth')
      ]);

      if (!auth) {
        throw new Error('Firebase auth not available');
      }

      // Optimize provider configuration for speed
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      // Set custom parameters for faster authentication
      provider.setCustomParameters({
        prompt: 'select_account', // Allow account selection for faster re-auth
        include_granted_scopes: 'true' // Include previously granted scopes
      });

      // Use popup for fastest authentication with optimized settings
      const result = await signInWithPopup(auth, provider);

      console.log('✅ Simple Auth: Google sign-in successful:', result.user.email);

      // Update auth state immediately
      this.currentUser = result.user;
      this.authStore.set({
        user: result.user,
        loading: false,
        isAuthenticated: true
      });

      return { success: true };
    } catch (error: any) {
      console.error('❌ Simple Auth: Google sign-in failed:', error);

      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      return { success: false, error: errorMessage };
    }
  }

  async signInWithApple(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Simple Auth: Starting Apple sign-in...');

      // Pre-load Firebase modules for faster execution
      const [{ auth }, { OAuthProvider, signInWithPopup }] = await Promise.all([
        import('$lib/firebase/client'),
        import('firebase/auth')
      ]);

      if (!auth) {
        throw new Error('Firebase auth not available');
      }

      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');

      // Set custom parameters for Apple Sign-In
      provider.setCustomParameters({
        locale: 'en_US'
      });

      const result = await signInWithPopup(auth, provider);

      console.log('✅ Simple Auth: Apple sign-in successful:', result.user.email);

      this.currentUser = result.user;
      this.authStore.set({
        user: result.user,
        loading: false,
        isAuthenticated: true
      });

      return { success: true };
    } catch (error: any) {
      console.error('❌ Simple Auth: Apple sign-in failed:', error);

      let errorMessage = error.message;
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      }

      return { success: false, error: errorMessage };
    }
  }

  async signInWithFacebook(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Simple Auth: Starting Facebook sign-in...');

      // Pre-load Firebase modules for faster execution
      const [{ auth }, { FacebookAuthProvider, signInWithPopup }] = await Promise.all([
        import('$lib/firebase/client'),
        import('firebase/auth')
      ]);

      if (!auth) {
        throw new Error('Firebase auth not available');
      }

      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      provider.addScope('public_profile');

      // Set custom parameters for Facebook
      provider.setCustomParameters({
        display: 'popup'
      });

      const result = await signInWithPopup(auth, provider);

      console.log('✅ Simple Auth: Facebook sign-in successful:', result.user.email);

      this.currentUser = result.user;
      this.authStore.set({
        user: result.user,
        loading: false,
        isAuthenticated: true
      });

      return { success: true };
    } catch (error: any) {
      console.error('❌ Simple Auth: Facebook sign-in failed:', error);

      let errorMessage = error.message;
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with this email using a different sign-in method.';
      }

      return { success: false, error: errorMessage };
    }
  }

  async signInWithGitHub(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Simple Auth: Starting GitHub sign-in...');

      // Pre-load Firebase modules for faster execution
      const [{ auth }, { GithubAuthProvider, signInWithPopup }] = await Promise.all([
        import('$lib/firebase/client'),
        import('firebase/auth')
      ]);

      if (!auth) {
        throw new Error('Firebase auth not available');
      }

      const provider = new GithubAuthProvider();
      provider.addScope('user:email');
      provider.addScope('read:user');

      const result = await signInWithPopup(auth, provider);

      console.log('✅ Simple Auth: GitHub sign-in successful:', result.user.email);

      this.currentUser = result.user;
      this.authStore.set({
        user: result.user,
        loading: false,
        isAuthenticated: true
      });

      return { success: true };
    } catch (error: any) {
      console.error('❌ Simple Auth: GitHub sign-in failed:', error);

      let errorMessage = error.message;
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with this email using a different sign-in method.';
      }

      return { success: false, error: errorMessage };
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

  // Handle auth subdomain return with token
  async handleAuthSubdomainReturn(authData: any): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Simple Auth: Processing auth subdomain return...');

      const { auth } = await import('$lib/firebase/client');
      const { signInWithCustomToken } = await import('firebase/auth');

      if (!auth) {
        throw new Error('Firebase auth not available');
      }

      // If we have an ID token, use it to sign in
      if (authData.idToken) {
        await signInWithCustomToken(auth, authData.idToken);
        console.log('✅ Simple Auth: Successfully signed in with token');
        return { success: true };
      } else {
        // Fallback: manually set the auth state (less secure but works)
        console.log('⚠️ Simple Auth: No token available, setting manual auth state');
        this.currentUser = authData as any;
        this.authStore.set({
          user: authData as any,
          loading: false,
          isAuthenticated: true
        });
        return { success: true };
      }
    } catch (error: any) {
      console.error('❌ Simple Auth: Auth subdomain return failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Email authentication removed - using social logins only for better security and speed

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
