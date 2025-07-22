// Refactored authentication store with improved patterns

import { BaseStore } from './base.store';
import { browser } from '$app/environment';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type UserCredential
} from 'firebase/auth';
import { auth, getFirebaseErrorMessage } from '$lib/firebase';
import { setSessionCookie, clearSessionCookie, handleAuthRedirect } from '$lib/utils/auth-session';
import { showToast } from './toast.store';
import { getUserProfile, createUserProfile, isProfileComplete } from '$lib/services/users.service';
import type { AuthState, LoginCredentials, SignUpCredentials } from '$lib/types';

class AuthStore extends BaseStore<User> {
  constructor() {
    super(null);
    
    // Initialize auth state listener
    if (browser && auth) {
      this.initializeAuthListener();
    }
  }

  /**
   * Initialize Firebase auth state listener
   */
  private initializeAuthListener(): void {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.setData(user);
      } else {
        this.setData(null);
      }
    });
  }

  /**
   * Sign in with email and password
   */
  async signIn(credentials: LoginCredentials): Promise<UserCredential | null> {
    try {
      this.setLoading('loading');
      this.clearError();

      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // Set session cookie
      const idToken = await userCredential.user.getIdToken();
      await setSessionCookie(idToken);

      this.setData(userCredential.user);
      showToast('success', `Welcome back, ${userCredential.user.email}!`);

      // Handle redirect after successful login
      setTimeout(() => {
        handleAuthRedirect();
      }, 1000);

      return userCredential;
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      this.setError(errorMessage);
      showToast('error', errorMessage);
      return null;
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(credentials: SignUpCredentials): Promise<UserCredential | null> {
    try {
      this.setLoading('loading');
      this.clearError();

      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }

      if (credentials.password !== credentials.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // Set session cookie
      const idToken = await userCredential.user.getIdToken();
      await setSessionCookie(idToken);

      this.setData(userCredential.user);
      showToast('success', `Welcome to GearGrab, ${userCredential.user.email}!`);

      return userCredential;
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      this.setError(errorMessage);
      showToast('error', errorMessage);
      return null;
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<UserCredential | null> {
    try {
      this.setLoading('loading');
      this.clearError();

      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }

      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      // Set custom parameters to reduce popup issues
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const userCredential = await signInWithPopup(auth, provider);

      // Set session cookie
      const idToken = await userCredential.user.getIdToken();
      await setSessionCookie(idToken);

      this.setData(userCredential.user);

      // Handle user profile creation and onboarding
      await this.handleUserOnboarding(userCredential.user);

      return userCredential;
    } catch (error: any) {
      // Ignore common popup/message channel errors that don't affect functionality
      if (error.code === 'auth/popup-closed-by-user' ||
          error.code === 'auth/cancelled-popup-request' ||
          error.message?.includes('message channel closed')) {
        this.setLoading('idle');
        return null;
      }

      const errorMessage = getFirebaseErrorMessage(error);
      this.setError(errorMessage);
      showToast('error', errorMessage);
      return null;
    } finally {
      this.setLoading('idle');
    }
  }

  /**
   * Sign in with Facebook
   */
  async signInWithFacebook(): Promise<UserCredential | null> {
    try {
      this.setLoading('loading');
      this.clearError();

      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }

      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      provider.addScope('public_profile');

      // Set custom parameters
      provider.setCustomParameters({
        display: 'popup'
      });

      const userCredential = await signInWithPopup(auth, provider);
      this.setData(userCredential.user);

      // Handle user profile creation and onboarding
      await this.handleUserOnboarding(userCredential.user);

      return userCredential;
    } catch (error: any) {
      // Ignore common popup/message channel errors that don't affect functionality
      if (error.code === 'auth/popup-closed-by-user' ||
          error.code === 'auth/cancelled-popup-request' ||
          error.message?.includes('message channel closed')) {
        this.setLoading('idle');
        return null;
      }

      const errorMessage = getFirebaseErrorMessage(error);
      this.setError(errorMessage);
      showToast('error', errorMessage);
      return null;
    } finally {
      this.setLoading('idle');
    }
  }

  /**
   * Sign in with Apple
   */
  async signInWithApple(): Promise<UserCredential | null> {
    try {
      this.setLoading('loading');
      this.clearError();

      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }

      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');

      // Set custom parameters
      provider.setCustomParameters({
        locale: 'en'
      });

      const userCredential = await signInWithPopup(auth, provider);
      this.setData(userCredential.user);

      // Handle user profile creation and onboarding
      await this.handleUserOnboarding(userCredential.user);

      return userCredential;
    } catch (error: any) {
      // Ignore common popup/message channel errors that don't affect functionality
      if (error.code === 'auth/popup-closed-by-user' ||
          error.code === 'auth/cancelled-popup-request' ||
          error.message?.includes('message channel closed')) {
        this.setLoading('idle');
        return null;
      }

      const errorMessage = getFirebaseErrorMessage(error);
      this.setError(errorMessage);
      showToast('error', errorMessage);
      return null;
    } finally {
      this.setLoading('idle');
    }
  }

  /**
   * Handle user onboarding after successful authentication
   */
  private async handleUserOnboarding(user: User): Promise<void> {
    try {
      // Check if user profile exists in Firestore
      let userProfile = await getUserProfile(user.uid);

      if (!userProfile) {
        // Create new user profile
        userProfile = await createUserProfile(user);
        showToast('success', `Welcome to GearGrab, ${user.displayName || user.email}!`);

        // Redirect to onboarding
        if (browser) {
          window.location.href = '/onboarding';
        }
      } else if (!isProfileComplete(userProfile)) {
        // Profile exists but incomplete
        showToast('info', 'Please complete your profile to get started');

        // Redirect to onboarding
        if (browser) {
          window.location.href = '/onboarding';
        }
      } else {
        // Profile is complete
        showToast('success', `Welcome back, ${userProfile.displayName || user.email}!`);

        // Redirect to dashboard or intended page
        if (browser) {
          const redirectUrl = sessionStorage.getItem('auth_redirect') || '/dashboard';
          sessionStorage.removeItem('auth_redirect');
          window.location.href = redirectUrl;
        }
      }
    } catch (error) {
      console.error('Error handling user onboarding:', error);
      // If there's an error, still show success but redirect to onboarding
      showToast('success', `Welcome to GearGrab, ${user.displayName || user.email}!`);

      if (browser) {
        window.location.href = '/onboarding';
      }
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      this.setLoading('loading');

      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }

      await firebaseSignOut(auth);
      await clearSessionCookie();
      
      this.setData(null);
      showToast('info', 'You have been signed out');
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      this.setError(errorMessage);
      showToast('error', errorMessage);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.getCurrentData();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getCurrentData() !== null;
  }

  /**
   * Get user ID
   */
  getUserId(): string | null {
    const user = this.getCurrentUser();
    return user?.uid || null;
  }

  /**
   * Get user email
   */
  getUserEmail(): string | null {
    const user = this.getCurrentUser();
    return user?.email || null;
  }

  /**
   * Check if user email is verified
   */
  isEmailVerified(): boolean {
    const user = this.getCurrentUser();
    return user?.emailVerified || false;
  }

  /**
   * Refresh user data from Firebase Auth
   */
  async refreshUser(): Promise<void> {
    try {
      const user = this.getCurrentUser();
      if (!user) return;

      // Reload user data from Firebase
      await user.reload();

      // Update the store with fresh user data
      this.setData(user);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }

  /**
   * Refresh user token
   */
  async refreshToken(): Promise<string | null> {
    try {
      const user = this.getCurrentUser();
      if (!user) return null;

      const token = await user.getIdToken(true);
      await setSessionCookie(token);
      return token;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  /**
   * Wait for auth to be ready
   */
  async waitForAuth(): Promise<User | null> {
    return new Promise((resolve) => {
      if (!browser || !auth) {
        resolve(null);
        return;
      }

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }
}

// Export singleton instance
export const authStore = new AuthStore();

// Export convenience methods
export const signIn = authStore.signIn.bind(authStore);
export const signUp = authStore.signUp.bind(authStore);
export const signInWithGoogle = authStore.signInWithGoogle.bind(authStore);
export const signInWithFacebook = authStore.signInWithFacebook.bind(authStore);
export const signInWithApple = authStore.signInWithApple.bind(authStore);
export const signOut = authStore.signOut.bind(authStore);
export const getCurrentUser = authStore.getCurrentUser.bind(authStore);
export const isAuthenticated = authStore.isAuthenticated.bind(authStore);
export const getUserId = authStore.getUserId.bind(authStore);
export const getUserEmail = authStore.getUserEmail.bind(authStore);
export const isEmailVerified = authStore.isEmailVerified.bind(authStore);
export const refreshUser = authStore.refreshUser.bind(authStore);
export const refreshToken = authStore.refreshToken.bind(authStore);
export const waitForAuth = authStore.waitForAuth.bind(authStore);
