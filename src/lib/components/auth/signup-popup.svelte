<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  // Using simple auth service instead of direct Firebase imports
  import { notifications } from '$lib/stores/notifications';
  import { isValidEmail } from '$lib/utils/validation';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { simpleAuth } from '$lib/auth/simple-auth';

  export let show = false;

  const dispatch = createEventDispatcher<{
    close: void;
    success: { user: any };
    switchToLogin: void;
  }>();

  let email = '';
  let password = '';
  let confirmPassword = '';
  let displayName = '';
  let loading = false;
  let errors: Record<string, string> = {};

  // Get redirect URL from query params
  $: redirectTo = $page.url.searchParams.get('redirectTo') || '/';

  function validateForm() {
    errors = {};

    if (!displayName.trim()) {
      errors.displayName = 'Name is required';
    }

    if (!email) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return Object.keys(errors).length === 0;
  }

  async function handleEmailSignup() {
    if (!validateForm()) return;

    loading = true;
    errors = {};

    try {
      const result = await simpleAuth.createUserWithEmailPassword(email, password);

      if (result.success) {
        notifications.add({
          type: 'success',
          message: 'Account created successfully! Welcome to GearGrab!',
          timeout: 5000
        });

        // Force refresh auth state to ensure UI updates
        setTimeout(() => {
          simpleAuth.refreshAuth();
        }, 500);

        // Close modal and dispatch success
        show = false;
        dispatch('success', { user: null }); // User will be available in auth state

        // Navigate to redirect URL
        await goto(redirectTo);
      } else {
        throw new Error(result.error || 'Account creation failed');
      }
    } catch (error: any) {
      console.error('Signup error:', error);

      // Handle specific Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        errors.auth = 'An account with this email already exists. Please sign in instead.';
      } else if (error.code === 'auth/weak-password') {
        errors.auth = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errors.auth = 'Please enter a valid email address.';
      } else {
        errors.auth = error.message || 'An error occurred during signup';
      }
    } finally {
      loading = false;
    }
  }

  async function handleGoogleSignup() {
    loading = true;
    errors = {};

    try {
      const result = await simpleAuth.signInWithGoogle();

      if (result.success) {
        notifications.add({
          type: 'success',
          message: 'Successfully signed up with Google!',
          timeout: 5000
        });

        // Force refresh auth state to ensure UI updates
        setTimeout(() => {
          simpleAuth.refreshAuth();
        }, 500);

        // Close modal and dispatch success
        show = false;
        dispatch('success', { user: null }); // User will be available in auth state

        // Navigate to redirect URL
        await goto(redirectTo);
      } else {
        throw new Error(result.error || 'Google signup failed');
      }
    } catch (error: any) {
      console.error('Google signup error:', error);
      
      let errorMessage = error.message || 'An error occurred during Google sign-up';
      
      // Handle domain authorization error specifically
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'Google sign-up is temporarily unavailable. Please use email sign-up instead.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked by your browser. Please allow popups for this site and try again.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-up was cancelled. Please try again.';
      }
      
      errors.auth = errorMessage;
    } finally {
      loading = false;
    }
  }

  function handleClose() {
    show = false;
    dispatch('close');
  }

  function switchToLogin() {
    show = false;
    dispatch('switchToLogin');
  }

  // Handle escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  // Reset form when modal opens/closes
  $: if (show) {
    email = '';
    password = '';
    confirmPassword = '';
    displayName = '';
    errors = {};
    loading = false;
  }
</script>

<svelte:window on:keydown="{handleKeydown}" />

{#if show}
  <!-- Modal backdrop -->
  <div 
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    on:click="{handleClose}"
    role="dialog"
    aria-modal="true"
    aria-labelledby="signup-title"
  >
    <!-- Modal content -->
    <div 
      class="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl w-full max-w-md p-8 relative max-h-[90vh] overflow-y-auto"
      on:click|stopPropagation
    >
      <!-- Close button -->
      <button
        on:click="{handleClose}"
        class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        aria-label="Close signup modal"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Header -->
      <div class="text-center mb-8">
        <h2 id="signup-title" class="text-2xl font-bold text-white mb-2">Create Account</h2>
        <p class="text-gray-300">Join GearGrab and start your adventure</p>
      </div>

      <!-- Google Sign-up -->
      <div class="mb-6">
        <button
          type="button"
          class="w-full flex justify-center items-center px-4 py-3 border border-white/20 rounded-lg shadow-sm bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          on:click="{handleGoogleSignup}"
          disabled="{loading}"
        >
          <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Creating account...' : 'Sign up with Google'}
        </button>
        
        <div class="mt-4 relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-white/20"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-gray-900 text-gray-300">Or create account with email</span>
          </div>
        </div>
      </div>

      <!-- Email form -->
      <form on:submit|preventDefault="{handleEmailSignup}" class="space-y-4">
        <!-- Name field -->
        <div>
          <label for="displayName" class="block text-sm font-medium text-gray-300 mb-2">
            Full name
          </label>
          <input
            id="displayName"
            type="text"
            bind:value="{displayName}"
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            placeholder="Enter your full name"
            disabled="{loading}"
            required
          />
          {#if errors.displayName}
            <p class="mt-1 text-sm text-red-400">{errors.displayName}</p>
          {/if}
        </div>

        <!-- Email field -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
            Email address
          </label>
          <input
            id="email"
            type="email"
            bind:value="{email}"
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            placeholder="Enter your email"
            disabled="{loading}"
            required
          />
          {#if errors.email}
            <p class="mt-1 text-sm text-red-400">{errors.email}</p>
          {/if}
        </div>

        <!-- Password field -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            bind:value="{password}"
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            placeholder="Create a password"
            disabled="{loading}"
            required
          />
          {#if errors.password}
            <p class="mt-1 text-sm text-red-400">{errors.password}</p>
          {/if}
        </div>

        <!-- Confirm password field -->
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-2">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            bind:value="{confirmPassword}"
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            placeholder="Confirm your password"
            disabled="{loading}"
            required
          />
          {#if errors.confirmPassword}
            <p class="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
          {/if}
        </div>

        <!-- Auth error -->
        {#if errors.auth}
          <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p class="text-sm text-red-400">{errors.auth}</p>
          </div>
        {/if}

        <!-- Submit button -->
        <button
          type="submit"
          class="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          disabled="{loading}"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <!-- Footer -->
      <div class="mt-6 text-center">
        <p class="text-gray-400 text-sm">
          Already have an account?
          <button
            on:click="{switchToLogin}"
            class="text-green-400 hover:text-green-300 font-medium transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  </div>
{/if}
