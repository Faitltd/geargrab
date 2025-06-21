/**
 * Universal Authentication Guard Hook
 * Provides consistent authentication checking across all protected routes
 */

import { goto } from '$app/navigation';
import { simpleAuth } from '$lib/auth/simple-auth';
import { browser } from '$app/environment';

export interface AuthGuardOptions {
  redirectTo?: string;
  maxAttempts?: number;
  retryDelay?: number;
  requireAuth?: boolean;
  onAuthSuccess?: () => void;
  onAuthFailure?: () => void;
}

export interface AuthGuardState {
  isAuthenticated: boolean;
  isLoading: boolean;
  checkComplete: boolean;
  user: any;
  error: string | null;
}

/**
 * Universal authentication guard that can be used in any component
 */
export function createAuthGuard(options: AuthGuardOptions = {}) {
  const {
    redirectTo,
    maxAttempts = 10,
    retryDelay = 300,
    requireAuth = true,
    onAuthSuccess,
    onAuthFailure
  } = options;

  let authCheckAttempts = 0;
  let authCheckComplete = false;
  let hasRedirected = false;

  // Get current auth state
  const authState = simpleAuth.authState;

  /**
   * Check authentication with retry logic
   */
  async function checkAuthWithRetry(): Promise<AuthGuardState> {
    if (!browser) {
      return {
        isAuthenticated: false,
        isLoading: true,
        checkComplete: false,
        user: null,
        error: null
      };
    }

    authCheckAttempts++;
    console.log(`🔐 Auth Guard: Check attempt ${authCheckAttempts}/${maxAttempts}:`, {
      loading: authState.loading,
      hasUser: !!authState.user,
      isAuthenticated: authState.isAuthenticated
    });

    // Force refresh auth state on first attempt
    if (authCheckAttempts === 1) {
      await simpleAuth.refreshAuth();
    }

    // If still loading and haven't exceeded max attempts, wait and retry
    if (authState.loading && authCheckAttempts < maxAttempts) {
      setTimeout(checkAuthWithRetry, retryDelay);
      return {
        isAuthenticated: false,
        isLoading: true,
        checkComplete: false,
        user: null,
        error: null
      };
    }

    // Check if user is authenticated
    const isAuthenticated = !!(authState.user && authState.isAuthenticated);

    if (isAuthenticated) {
      console.log('✅ Auth Guard: User authenticated:', authState.user?.email);
      authCheckComplete = true;
      onAuthSuccess?.();
      
      return {
        isAuthenticated: true,
        isLoading: false,
        checkComplete: true,
        user: authState.user,
        error: null
      };
    }

    // If authentication is required and user is not authenticated
    if (requireAuth && !hasRedirected) {
      console.log('❌ Auth Guard: User not authenticated, redirecting to login');
      hasRedirected = true;
      
      const currentPath = window.location.pathname + window.location.search;
      const loginUrl = redirectTo || `/auth/login?redirectTo=${encodeURIComponent(currentPath)}`;
      
      onAuthFailure?.();
      
      try {
        await goto(loginUrl);
      } catch (gotoError) {
        console.warn('🔄 Auth Guard: goto failed, using window.location:', gotoError);
        window.location.href = loginUrl;
      }
    }

    return {
      isAuthenticated: false,
      isLoading: false,
      checkComplete: true,
      user: null,
      error: requireAuth ? 'Authentication required' : null
    };
  }

  /**
   * Initialize the auth guard
   */
  async function initialize(): Promise<AuthGuardState> {
    console.log('🔐 Auth Guard: Initializing...');
    return await checkAuthWithRetry();
  }

  /**
   * Force a re-check of authentication
   */
  async function recheck(): Promise<AuthGuardState> {
    authCheckAttempts = 0;
    authCheckComplete = false;
    hasRedirected = false;
    return await checkAuthWithRetry();
  }

  /**
   * Check if user has specific permissions
   */
  function hasPermission(permission: string): boolean {
    if (!authState.user) return false;
    
    // Add your permission checking logic here
    // For now, just check if user is authenticated
    return authState.isAuthenticated;
  }

  /**
   * Get current authentication status
   */
  function getStatus(): AuthGuardState {
    return {
      isAuthenticated: !!(authState.user && authState.isAuthenticated),
      isLoading: authState.loading,
      checkComplete: authCheckComplete,
      user: authState.user,
      error: null
    };
  }

  return {
    initialize,
    recheck,
    hasPermission,
    getStatus,
    authState
  };
}

/**
 * Quick authentication check for simple use cases
 */
export async function requireAuth(redirectTo?: string): Promise<boolean> {
  const guard = createAuthGuard({ redirectTo });
  const result = await guard.initialize();
  return result.isAuthenticated;
}

/**
 * Check if user is authenticated without redirecting
 */
export function isAuthenticated(): boolean {
  const authState = simpleAuth.authState;
  return !!(authState.user && authState.isAuthenticated);
}

/**
 * Get current user if authenticated
 */
export function getCurrentUser() {
  const authState = simpleAuth.authState;
  return authState.isAuthenticated ? authState.user : null;
}
