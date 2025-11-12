import { writable } from 'svelte/store';

// Global authentication modal state
export const authModalStore = writable({
  show: false,
  mode: 'login', // 'login' or 'signup'
  redirectTo: null,
  context: null, // What action triggered the auth requirement
  message: null // Custom message to show in modal
});

// Helper functions to control the auth modal
export const authModal = {
  // Show login modal
  showLogin: (options = {}) => {
    authModalStore.set({
      show: true,
      mode: 'login',
      redirectTo: options.redirectTo || null,
      context: options.context || null,
      message: options.message || null
    });
  },

  // Show signup modal
  showSignup: (options = {}) => {
    authModalStore.set({
      show: true,
      mode: 'signup',
      redirectTo: options.redirectTo || null,
      context: options.context || null,
      message: options.message || null
    });
  },

  // Hide modal
  hide: () => {
    authModalStore.update(state => ({
      ...state,
      show: false
    }));
  },

  // Switch between login and signup
  switchMode: (mode) => {
    authModalStore.update(state => ({
      ...state,
      mode
    }));
  },

  // Require authentication for an action
  requireAuth: (options = {}) => {
    const {
      context = 'general',
      message = 'Please sign in to continue',
      redirectTo = null,
      preferSignup = false
    } = options;

    authModalStore.set({
      show: true,
      mode: preferSignup ? 'signup' : 'login',
      redirectTo,
      context,
      message
    });
  }
};

// Context-specific auth requirements
export const authContexts = {
  LIST_GEAR: {
    context: 'list-gear',
    message: 'Sign in to start listing your gear and earning money!',
    preferSignup: true
  },
  RENT_GEAR: {
    context: 'rent-gear',
    message: 'Sign in to rent this gear and start your adventure!',
    preferSignup: true
  },
  CONTACT_OWNER: {
    context: 'contact-owner',
    message: 'Sign in to contact the gear owner',
    preferSignup: false
  },
  DASHBOARD: {
    context: 'dashboard',
    message: 'Sign in to access your dashboard',
    preferSignup: false
  },
  PROFILE: {
    context: 'profile',
    message: 'Sign in to view and edit your profile',
    preferSignup: false
  }
};
