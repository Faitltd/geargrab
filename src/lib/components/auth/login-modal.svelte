<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { signInWithEmail, signInWithGoogle } from '$lib/firebase/auth';
  import { notifications } from '$lib/stores/notifications';
  import { isValidEmail } from '$lib/utils/validation';
  import Modal from '$lib/components/ui/modal.svelte';
  import FormField from '$lib/components/forms/form-field.svelte';
  import FormButton from '$lib/components/forms/form-button.svelte';
  import GoogleAuthButton from '$lib/components/auth/google-auth-button.svelte';
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
      await signInWithEmail(email, password);

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
      await signInWithGoogle();

      notifications.add({
        type: 'success',
        message: 'Successfully logged in with Google!',
        timeout: 5000
      });

      // Close modal and dispatch success
      show = false;
      dispatch('success');

    } catch (error: any) {
      console.error('Google login error:', error);
      
      let errorMessage = error.message || 'An error occurred during Google sign-in';
      
      // Handle domain authorization error specifically
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'Google sign-in is temporarily unavailable. Please use email sign-in instead.';
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

  function switchToSignup() {
    show = false;
    dispatch('switchToSignup');
  }
</script>

<Modal bind:show title="Sign In to Continue" on:close={handleClose}>
  <div class="p-6">
    <!-- Google Sign-in Option -->
    <div class="mb-6">
      <GoogleAuthButton
        on:success={handleGoogleLogin}
        on:error={(e) => errors.auth = e.detail.message}
        {loading}
      />
      
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
        label="Email Address"
        type="email"
        bind:value={email}
        error={errors.email}
        disabled={loading}
        required
        autocomplete="email"
      />

      <FormField
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
        class="w-full"
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
