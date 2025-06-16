import { auth } from '$lib/firebase/client';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { writable, type Readable } from 'svelte/store';

/**
 * Enhanced Client Authentication Service V2
 * Bulletproof authentication state management and token handling
 */

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  lastTokenRefresh: number | null;
}

class ClientAuthServiceV2 {
  private authStore = writable<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    lastTokenRefresh: null
  });

  private currentUser: User | null = null;
  private tokenCache: string | null = null;
  private tokenExpiry: number | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state listener
   */
  private initializeAuth(): void {
    console.log('🔐 Initializing client authentication service V2...');

    // Only initialize in browser environment
    if (typeof window === 'undefined' || !auth) {
      console.log('🔧 Not in browser environment - skipping Firebase auth initialization');
      this.authStore.set({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        lastTokenRefresh: null
      });
      return;
    }

    onAuthStateChanged(auth, (user) => {
      console.log('🔍 Auth state changed:', {
        authenticated: !!user,
        email: user?.email,
        uid: user?.uid,
        emailVerified: user?.emailVerified
      });

      this.currentUser = user;
      this.tokenCache = null; // Clear token cache on auth state change
      this.tokenExpiry = null;
      this.refreshPromise = null;

      this.authStore.set({
        user,
        loading: false,
        error: null,
        isAuthenticated: !!user,
        lastTokenRefresh: null
      });
    }, (error) => {
      console.error('❌ Auth state change error:', error);
      
      this.authStore.set({
        user: null,
        loading: false,
        error: error.message,
        isAuthenticated: false,
        lastTokenRefresh: null
      });
    });
  }

  /**
   * Get current authentication state
   */
  get authState(): Readable<AuthState> {
    return this.authStore;
  }

  /**
   * Get current user
   */
  get user(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  /**
   * Get fresh Firebase ID token with caching and automatic refresh
   */
  async getIdToken(forceRefresh: boolean = false): Promise<string | null> {
    if (!this.currentUser) {
      console.log('❌ Cannot get token - user not authenticated');
      return null;
    }

    // Check if we have a valid cached token
    if (!forceRefresh && this.tokenCache && this.tokenExpiry) {
      const now = Date.now();
      const timeUntilExpiry = this.tokenExpiry - now;
      
      // Use cached token if it has more than 5 minutes left
      if (timeUntilExpiry > 5 * 60 * 1000) {
        console.log('✅ Using cached token (expires in', Math.round(timeUntilExpiry / 1000 / 60), 'minutes)');
        return this.tokenCache;
      }
    }

    // If there's already a refresh in progress, wait for it
    if (this.refreshPromise) {
      console.log('⏳ Token refresh already in progress, waiting...');
      return this.refreshPromise;
    }

    // Start token refresh
    this.refreshPromise = this.refreshToken(forceRefresh);
    
    try {
      const token = await this.refreshPromise;
      this.refreshPromise = null;
      return token;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  /**
   * Refresh Firebase ID token
   */
  private async refreshToken(forceRefresh: boolean): Promise<string> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('🔄 Refreshing Firebase ID token...');
      const startTime = Date.now();
      
      const token = await this.currentUser.getIdToken(forceRefresh);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Token refreshed successfully in ${duration}ms`);

      // Cache the token (Firebase tokens are valid for 1 hour)
      this.tokenCache = token;
      this.tokenExpiry = Date.now() + (55 * 60 * 1000); // Cache for 55 minutes

      // Update auth state
      this.authStore.update(state => ({
        ...state,
        lastTokenRefresh: Date.now(),
        error: null
      }));

      return token;
    } catch (error: any) {
      console.error('❌ Token refresh failed:', error);
      
      // Clear cached token on error
      this.tokenCache = null;
      this.tokenExpiry = null;

      // Update auth state with error
      this.authStore.update(state => ({
        ...state,
        error: `Token refresh failed: ${error.message}`
      }));

      throw error;
    }
  }

  /**
   * Make authenticated API request with automatic token handling
   */
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      // Get fresh token
      const token = await this.getIdToken();
      
      if (!token) {
        throw new Error('Failed to get authentication token');
      }

      console.log('🔍 Making authenticated request to:', url);

      // Add authorization header
      const headers = new Headers(options.headers);
      headers.set('Authorization', `Bearer ${token}`);
      headers.set('Content-Type', 'application/json');

      const response = await fetch(url, {
        ...options,
        headers
      });

      // If we get a 401, try refreshing the token once
      if (response.status === 401 && !options.headers?.['X-Retry-Auth']) {
        console.log('⚠️ Got 401, trying token refresh...');
        
        const freshToken = await this.getIdToken(true); // Force refresh
        
        if (freshToken) {
          headers.set('Authorization', `Bearer ${freshToken}`);
          headers.set('X-Retry-Auth', 'true'); // Prevent infinite retry
          
          return fetch(url, {
            ...options,
            headers
          });
        }
      }

      return response;
    } catch (error: any) {
      console.error('❌ Authenticated request failed:', error);
      throw error;
    }
  }

  /**
   * Clear authentication state and caches
   */
  clearAuth(): void {
    console.log('🧹 Clearing authentication state...');
    
    this.currentUser = null;
    this.tokenCache = null;
    this.tokenExpiry = null;
    this.refreshPromise = null;

    this.authStore.set({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      lastTokenRefresh: null
    });
  }

  /**
   * Debug authentication state
   */
  debugAuth(): void {
    console.log('🔍 Authentication Debug Info:', {
      isAuthenticated: this.isAuthenticated,
      user: this.currentUser ? {
        uid: this.currentUser.uid,
        email: this.currentUser.email,
        emailVerified: this.currentUser.emailVerified
      } : null,
      tokenCached: !!this.tokenCache,
      tokenExpiry: this.tokenExpiry ? new Date(this.tokenExpiry).toISOString() : null,
      refreshInProgress: !!this.refreshPromise
    });
  }
}

// Export singleton instance
export const clientAuth = new ClientAuthServiceV2();
