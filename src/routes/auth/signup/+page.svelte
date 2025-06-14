<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { notifications } from '$lib/stores/notifications';
  import { isValidEmail, isValidPassword } from '$lib/utils/validation';
  import { signUpWithEmail } from '$lib/firebase/auth';
  import FormContainer from '$lib/components/forms/form-container.svelte';
  import FormField from '$lib/components/forms/form-field.svelte';
  import FormButton from '$lib/components/forms/form-button.svelte';
  import GoogleAuthButton from '$lib/components/auth/google-auth-button.svelte';
  import ErrorAlert from '$lib/components/ui/error-alert.svelte';

  // Simplified form data
  let email = '';
  let password = '';
  let confirmPassword = '';
  let agreeTerms = false;
  let loading = false;
  let errors: Record<string, string> = {};
  
  // Get redirect URL from query parameters
  $: redirectTo = $page.url.searchParams.get('redirectTo') || '/';

  // Simple validation
  function validateForm() {
    errors = {};
    let isValid = true;

    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!isValidEmail(email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (!isValidPassword(password)) {
      errors.password = 'Password must be at least 8 characters with 1 uppercase letter, 1 lowercase letter, and 1 number';
      isValid = false;
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    if (!agreeTerms) {
      errors.agreeTerms = 'You must agree to the terms and conditions';
      isValid = false;
    }

    return isValid;
  }
  
  // Handle form submission
  async function handleSubmit() {
    if (!validateForm()) return;

    loading = true;
    errors = {};

    try {
      await signUpWithEmail(email, password, email.split('@')[0]);

      notifications.success('Account created successfully! Welcome to GearGrab!');

      // Wait for auth state to propagate
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to redirect URL
      await goto(redirectTo);
    } catch (error: any) {
      console.error('Signup error:', error);
      errors.auth = error.message || 'An error occurred during signup. Please try again.';

      notifications.add({
        type: 'error',
        message: errors.auth,
        timeout: 8000
      });
    } finally {
      loading = false;
    }
  }

  // Handle Google sign-up success
  async function handleGoogleSuccess() {
    // Wait for auth state to propagate
    await new Promise(resolve => setTimeout(resolve, 500));

    // Navigate to redirect URL
    await goto(redirectTo);
  }

  // Handle Google sign-up error
  function handleGoogleError(event: CustomEvent) {
    errors.auth = event.detail.error.message || 'An error occurred during Google sign-up';
  }
</script>

<svelte:head>
  <title>Sign Up - GearGrab</title>
</svelte:head>

<!-- Full Page Background -->
<div class="fixed inset-0 z-0">
  <div class="absolute inset-0">
    <img
      src="/pexels-bianca-gasparoto-834990-1752951.jpg"
      alt="Mountain landscape"
      class="w-full h-full object-cover"
    >
  </div>
  <div class="absolute inset-0 bg-black opacity-40"></div>
</div>

<!-- Page Content -->
<div class="relative z-30 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-32">
  <FormContainer title="Create your GearGrab account" maxWidth="md">
    <div class="space-y-6">
      <p class="text-center text-gray-400">
        Or
        <a href="/auth/login" class="font-medium text-green-400 hover:text-green-300">
          sign in to your existing account
        </a>
      </p>

      <!-- Google Sign-up Option -->
      <div class="text-center">
        <p class="text-sm text-gray-300 mb-4">Quick signup with Google</p>
        <GoogleAuthButton
          text="Continue with Google"
          loadingText="Signing up..."
          on:success={handleGoogleSuccess}
          on:error={handleGoogleError}
          {loading}
        />
        <div class="mt-4 relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-white/20"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-transparent text-gray-300">Or continue with email</span>
          </div>
        </div>
      </div>

      <ErrorAlert error={errors.auth} />

      <!-- Registration Form -->
      <form on:submit|preventDefault={handleSubmit}>
        <FormField
          id="email-address"
          label="Email Address"
          type="email"
          bind:value={email}
          placeholder="Email address"
          autocomplete="email"
          required
          error={errors.email}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          bind:value={password}
          placeholder="Password"
          autocomplete="new-password"
          required
          error={errors.password}
        />

        <FormField
          id="confirm-password"
          label="Confirm Password"
          type="password"
          bind:value={confirmPassword}
          placeholder="Confirm password"
          autocomplete="new-password"
          required
          error={errors.confirmPassword}
        />

        <!-- Terms Agreement -->
        <div class="flex items-start mb-6">
          <input
            id="agree-terms"
            name="agreeTerms"
            type="checkbox"
            class="h-4 w-4 text-green-600 focus:ring-green-500 border-white/20 bg-white/10 rounded mt-1"
            bind:checked={agreeTerms}
          />
          <label for="agree-terms" class="ml-3 block text-sm text-gray-300">
            I agree to the
            <a href="/terms" class="text-green-400 hover:text-green-300 underline" target="_blank">Terms of Service</a>
            and
            <a href="/privacy" class="text-green-400 hover:text-green-300 underline" target="_blank">Privacy Policy</a>
          </label>
        </div>
        {#if errors.agreeTerms}
          <p class="text-sm text-red-300 mb-6">{errors.agreeTerms}</p>
        {/if}

        <FormButton
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          {loading}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </FormButton>
      </form>
    </div>
  </FormContainer>
</div>
