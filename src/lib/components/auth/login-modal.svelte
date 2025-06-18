<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { notifications } from '$lib/stores/notifications';
  import { isValidEmail } from '$lib/utils/validation';
  import Modal from '$lib/components/ui/modal.svelte';
  import FormField from '$lib/components/forms/form-field.svelte';
  import FormButton from '$lib/components/forms/form-button.svelte';
  import ErrorAlert from '$lib/components/ui/error-alert.svelte';

  export let show = false;
  export let redirectAfterLogin = true;

  const dispatch = createEventDispatcher();

  let email = '';
  let password = '';
  let loading = false;
  let errors: Record<string, string> = {};
  let showSignup = false;

  // Reset form when modal opens/closes
  $: if (show) {
    resetForm();
  }

  function resetForm() {
    email = '';
    password = '';
    errors = {};
    loading = false;
    showSignup = false;
  }

  function validateForm(): boolean {
    errors = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    return Object.keys(errors).length === 0;
  }

  async function handleLogin() {
    if (!validateForm()) return;

    loading = true;
    errors = {};

    try {
      const result = await simpleAuth.signInWithEmailPassword(email, password);

      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }

      notifications.add({
        type: 'success',
        message: 'Successfully logged in!',
        timeout: 5000
      });

      // Close modal and dispatch success
      show = false;
      dispatch('success');

    } catch (error: any) {
      console.error('Login error:', error);

      // Handle specific Firebase auth errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errors.auth = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        errors.auth = 'Too many failed login attempts. Please try again later or reset your password.';
      } else {
        errors.auth = error.message || 'An error occurred during login';
      }
    } finally {
      loading = false;
    }
  }

  async function handleGoogleLogin() {
    loading = true;
    errors = {};

    try {
      const result = await simpleAuth.signInWithGoogle();

      if (result.success) {
        // For redirect-based Google auth, we don't get immediate success
        // The redirect will handle the success case
        console.log('🔄 Google sign-in redirect initiated...');

        // Close modal since redirect is happening
        show = false;

        // Note: Success will be handled by the redirect result handler in the layout
      } else {
        throw new Error(result.error || 'Google sign-in failed');
      }

    } catch (error: any) {
      console.error('Google login error:', error);

      let errorMessage = error.message || 'An error occurred during Google sign-in';

      // Handle domain authorization error specifically
      if (error.message?.includes('unauthorized-domain')) {
        errorMessage = 'Google sign-in is temporarily unavailable. Please use email sign-in instead.';
      }

      errors.auth = errorMessage;
      loading = false; // Only set loading false on error, redirect will handle success
    }
  }

  function handleClose() {
    show = false;
    dispatch('close');
  }

  function switchToSignup() {
    show = false;
    dispatch('switchToSignup');
  }
</script>

<Modal bind:show title="Sign In to Continue" on:close={handleClose}>
  <div class="p-6">
    <!-- Google Sign-in Option -->
    <div class="mb-6">
      <button
        type="button"
        class="w-full flex justify-center items-center px-4 py-3 border border-white/20 rounded-md shadow-sm bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        on:click={handleGoogleLogin}
        disabled={loading}
      >
        <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {loading ? 'Signing in...' : 'Continue with Google'}
      </button>

      <div class="mt-4 relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-white/20"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-gray-900 text-gray-300">Or continue with email</span>
        </div>
      </div>
    </div>

    <!-- Login Form -->
    <form on:submit|preventDefault={handleLogin} class="space-y-4">
      <FormField
        id="email"
        label="Email Address"
        type="email"
        bind:value={email}
        error={errors.email}
        disabled={loading}
        required
        autocomplete="email"
      />

      <FormField
        id="password"
        label="Password"
        type="password"
        bind:value={password}
        error={errors.password}
        disabled={loading}
        required
        autocomplete="current-password"
      />

      <ErrorAlert error={errors.auth} />

      <FormButton
        type="submit"
        variant="primary"
        {loading}
        disabled={loading}
        fullWidth={true}
      >
        {loading ? 'Signing In...' : 'Sign In'}
      </FormButton>
    </form>

    <!-- Sign Up Link -->
    <div class="mt-6 text-center">
      <p class="text-sm text-gray-400">
        Don't have an account?
        <button
          type="button"
          on:click={switchToSignup}
          class="text-green-400 hover:text-green-300 underline font-medium"
        >
          Sign up here
        </button>
      </p>
    </div>

    <!-- Forgot Password -->
    <div class="mt-4 text-center">
      <a
        href="/auth/reset-password"
        class="text-sm text-gray-400 hover:text-gray-300 underline"
        on:click={handleClose}
      >
        Forgot your password?
      </a>
    </div>

    <!-- Benefits -->
    <div class="mt-6 pt-6 border-t border-white/10">
      <h4 class="text-sm font-medium text-white mb-2">Why sign in?</h4>
      <ul class="text-xs text-gray-400 space-y-1">
        <li>• Secure rental agreements and accountability</li>
        <li>• Track your rental history and returns</li>
        <li>• Receive important updates about your rentals</li>
        <li>• Access customer support for your orders</li>
      </ul>
    </div>
  </div>
</Modal>
