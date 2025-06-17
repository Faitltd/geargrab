<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { notifications } from '$lib/stores/notifications';
  import { isValidEmail } from '$lib/utils/validation';
  import FormContainer from '$lib/components/forms/form-container.svelte';
  import FormField from '$lib/components/forms/form-field.svelte';
  import FormButton from '$lib/components/forms/form-button.svelte';
  import GoogleAuthButton from '$lib/components/auth/google-auth-button.svelte';
  import ErrorAlert from '$lib/components/ui/error-alert.svelte';
  import { onMount } from 'svelte';

  let email = '';
  let password = '';
  let loading = false;
  let errors: Record<string, string> = {};

  // Get redirect URL from query parameters
  $: redirectTo = $page.url.searchParams.get('redirectTo') || '/';

  // Get auth state
  $: authState = simpleAuth.authState;

  // Check if user is already authenticated on mount
  onMount(async () => {
    console.log('🔐 Login page mounted, checking auth state...');

    // Force refresh auth state to get latest
    await simpleAuth.refreshAuth();

    // Small delay to ensure auth state is loaded
    setTimeout(() => {
      if ($authState.isAuthenticated && $authState.user) {
        console.log('✅ User already authenticated, redirecting to:', redirectTo);
        goto(redirectTo);
      }
    }, 500);
  });

  // Validate form
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
    }

    return isValid;
  }

  // Handle form submission
  async function handleSubmit() {
    if (!validateForm()) return;

    loading = true;
    errors = {};

    try {
      console.log('🔐 Login: Starting email/password sign-in...');
      const result = await simpleAuth.signInWithEmailPassword(email, password);

      if (result.success) {
        notifications.add({
          type: 'success',
          message: 'Successfully logged in!',
          timeout: 5000
        });

        // Wait for auth state to propagate
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log('🔐 Login: Redirecting to:', redirectTo);

        // Force navigation using multiple methods for reliability
        try {
          await goto(redirectTo);
        } catch (gotoError) {
          console.warn('🔄 goto failed, using window.location:', gotoError);
          window.location.href = redirectTo;
        }
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('🔐 Login: Email/password sign-in failed:', error);

      // Enhanced error message handling
      let errorMessage = 'An error occurred during login';

      if (error.message) {
        if (error.message.includes('invalid-login-credentials') ||
            error.message.includes('user-not-found') ||
            error.message.includes('wrong-password')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('too-many-requests')) {
          errorMessage = 'Too many failed attempts. Please try again later or reset your password.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('popup-blocked')) {
          errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
        } else {
          errorMessage = error.message;
        }
      }

      errors.auth = errorMessage;

      // Show notification for better visibility
      notifications.add({
        type: 'error',
        message: errorMessage,
        timeout: 8000
      });
    } finally {
      loading = false;
    }
  }

  // Handle Google sign-in success
  async function handleGoogleSuccess() {
    console.log('🔐 Login: Google sign-in successful, redirecting...');

    // Wait for auth state to propagate
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('🔐 Login: Redirecting to:', redirectTo);

    // Force navigation using multiple methods for reliability
    try {
      await goto(redirectTo);
    } catch (gotoError) {
      console.warn('🔄 goto failed, using window.location:', gotoError);
      window.location.href = redirectTo;
    }
  }

  // Handle Google sign-in error
  function handleGoogleError(event: CustomEvent) {
    errors.auth = event.detail.error.message || 'An error occurred during Google sign-in';
  }
</script>

<svelte:head>
  <title>Log In - GearGrab</title>
  <meta name="description" content="Log in to your GearGrab account to rent outdoor gear or list your equipment for others to enjoy." />
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
  <FormContainer title="Welcome back" maxWidth="md">
    <div class="space-y-6">
      <p class="text-center text-gray-400">
        Or
        <a href="/auth/signup" class="font-medium text-green-400 hover:text-green-300">
          create a new account
        </a>
      </p>

      <!-- Google Sign-in Option -->
      <div class="text-center">
        <p class="text-sm text-gray-300 mb-4">Quick login with Google</p>
        <GoogleAuthButton
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

      <!-- Login Form -->
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
          autocomplete="current-password"
          required
          error={errors.password}
        />

        <!-- Forgot Password Link -->
        <div class="text-right mb-6">
          <a href="/auth/reset-password" class="text-sm text-green-400 hover:text-green-300 underline">
            Forgot your password?
          </a>
        </div>

        <FormButton
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          {loading}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log in'}
        </FormButton>
      </form>
    </div>
  </FormContainer>
</div>
