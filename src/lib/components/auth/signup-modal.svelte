<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { signUpWithEmail, signInWithGoogle } from '$lib/firebase/auth';
  import { notifications } from '$lib/stores/notifications';
  import { isValidEmail } from '$lib/utils/validation';
  import Modal from '$lib/components/ui/modal.svelte';
  import FormField from '$lib/components/forms/form-field.svelte';
  import FormButton from '$lib/components/forms/form-button.svelte';
  import GoogleAuthButton from '$lib/components/auth/google-auth-button.svelte';
  import ErrorAlert from '$lib/components/ui/error-alert.svelte';

  export let show = false;

  const dispatch = createEventDispatcher();

  let email = '';
  let password = '';
  let confirmPassword = '';
  let loading = false;
  let errors: Record<string, string> = {};

  // Reset form when modal opens/closes
  $: if (show) {
    resetForm();
  }

  function resetForm() {
    email = '';
    password = '';
    confirmPassword = '';
    errors = {};
    loading = false;
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

    if (!confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return Object.keys(errors).length === 0;
  }

  async function handleSignup() {
    if (!validateForm()) return;

    loading = true;
    errors = {};

    try {
      // Extract username from email (part before @)
      const username = email.split('@')[0];
      
      await signUpWithEmail(email, password, username);

      notifications.add({
        type: 'success',
        message: 'Account created successfully! Welcome to GearGrab!',
        timeout: 5000
      });

      // Close modal and dispatch success
      show = false;
      dispatch('success');

    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        errors.auth = 'An account with this email already exists. Please sign in instead.';
      } else if (error.code === 'auth/weak-password') {
        errors.auth = 'Password is too weak. Please choose a stronger password.';
      } else {
        errors.auth = error.message || 'An error occurred during signup. Please try again.';
      }
    } finally {
      loading = false;
    }
  }

  async function handleGoogleSignup() {
    loading = true;
    errors = {};

    try {
      await signInWithGoogle();

      notifications.add({
        type: 'success',
        message: 'Successfully signed up with Google!',
        timeout: 5000
      });

      // Close modal and dispatch success
      show = false;
      dispatch('success');

    } catch (error: any) {
      console.error('Google signup error:', error);
      
      let errorMessage = error.message || 'An error occurred during Google sign-up';
      
      // Handle domain authorization error specifically
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'Google sign-up is temporarily unavailable. Please use email sign-up instead.';
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
</script>

<Modal bind:show title="Create Your Account" on:close="{handleClose}">
  <div class="p-6">
    <!-- Google Sign-up Option -->
    <div class="mb-6">
      <GoogleAuthButton
        on:success="{handleGoogleSignup}"
        on:error="{(e)" => errors.auth = e.detail.message}
        {loading}
        buttonText="Sign up with Google"
      />
      
      <div class="mt-4 relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-white/20"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-gray-900 text-gray-300">Or create account with email</span>
        </div>
      </div>
    </div>

    <!-- Signup Form -->
    <form on:submit|preventDefault="{handleSignup}" class="space-y-4">
      <FormField
        label="Email Address"
        type="email"
        bind:value="{email}"
        error="{errors.email}"
        disabled="{loading}"
        required
        autocomplete="email"
      />

      <FormField
        label="Password"
        type="password"
        bind:value="{password}"
        error="{errors.password}"
        disabled="{loading}"
        required
        autocomplete="new-password"
        placeholder="At least 6 characters"
      />

      </FormField
        label="Confirm Password"
        type="password"
        bind:value="{confirmPassword}"
        error="{errors.confirmPassword}"
        disabled="{loading}"
        required
        autocomplete="new-password"
      />

      <ErrorAlert error="{errors.auth}" />

      <FormButton
        type="submit"
        variant="primary"
        {loading}
        disabled="{loading}"
        class="w-full"
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </FormButton>
    </form>

    <!-- Login Link -->
    <div class="mt-6 text-center">
      <p class="text-sm text-gray-400">
        Already have an account?
        <button
          type="button"
          on:click="{switchToLogin}"
          class="text-green-400 hover:text-green-300 underline font-medium"
        >
          Sign in here
        </button>
      </p>
    </div>

    <!-- Terms -->
    <div class="mt-6 text-center">
      <p class="text-xs text-gray-400">
        By creating an account, you agree to our
        <a href="/terms" class="text-green-400 hover:text-green-300 underline" on:click="{handleClose}">
          Terms of Service
        </a>
        and
        <a href="/privacy" class="text-green-400 hover:text-green-300 underline" on:click="{handleClose}">
          Privacy Policy
        </a>
      </p>
    </div>

    <!-- Benefits -->
    <div class="mt-6 pt-6 border-t border-white/10">
      <h4 class="text-sm font-medium text-white mb-2">Join GearGrab to:</h4>
      <ul class="text-xs text-gray-400 space-y-1">
        <li>• Rent outdoor gear from trusted locals</li>
        <li>• List your own gear and earn money</li>
        <li>• Access exclusive deals and discounts</li>
        <li>• Track your rental history and reviews</li>
      </ul>
    </div>
  </div>
</Modal>
