<script lang="ts">
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import SuccessBanner from '$lib/components/SuccessBanner.svelte';
  import { authStore, signInWithGoogle, signInWithFacebook, signInWithApple } from '$lib/stores/auth.store';

  let localError = '';
  let successMessage = '';
  let isSubmitting = false;

  $: ({ loading, error } = $authStore);

  const handleGoogleSignIn = async () => {
    localError = '';
    successMessage = '';
    isSubmitting = true;

    try {
      const result = await signInWithGoogle();

      if (result) {
        successMessage = 'Signing you in...';
        // Auth store will handle redirect to onboarding or dashboard
        // No need to dispatch success event since redirect happens automatically
      }

    } catch (error: any) {
      localError = error.message || 'Failed to sign in with Google';
      isSubmitting = false;
    }
    // Note: Don't set isSubmitting = false on success since we're redirecting
  };

  const handleFacebookSignIn = async () => {
    localError = '';
    successMessage = '';
    isSubmitting = true;

    try {
      const result = await signInWithFacebook();

      if (result) {
        successMessage = 'Signing you in...';
        // Auth store will handle redirect to onboarding or dashboard
      }

    } catch (error: any) {
      localError = error.message || 'Failed to sign in with Facebook';
      isSubmitting = false;
    }
  };

  const handleAppleSignIn = async () => {
    localError = '';
    successMessage = '';
    isSubmitting = true;

    try {
      const result = await signInWithApple();

      if (result) {
        successMessage = 'Signing you in...';
        // Auth store will handle redirect to onboarding or dashboard
      }

    } catch (error: any) {
      localError = error.message || 'Failed to sign in with Apple';
      isSubmitting = false;
    }
  };
</script>

<div class="w-full max-w-md mx-auto">
  <!-- Header -->
  <div class="text-center mb-8">
    <h1 class="text-3xl font-bold text-neutral-900 mb-2">
      Welcome to GearGrab
    </h1>
    <p class="text-neutral-600">
      Sign in to start renting amazing gear from your community
    </p>
  </div>

  <!-- Error Display -->
  {#if localError || error}
    <div class="mb-6">
      <ErrorBanner message={localError || error || 'An error occurred'} />
    </div>
  {/if}

  <!-- Success Display -->
  {#if successMessage}
    <div class="mb-6">
      <SuccessBanner message={successMessage} />
    </div>
  {/if}

  <!-- Social Sign-in -->
  <div class="space-y-4">
    <!-- Google Sign-in Button -->
    <button
      type="button"
      data-cy="google-signin-button"
      on:click={handleGoogleSignIn}
      disabled={loading === 'loading' || isSubmitting}
      class="w-full bg-white border-2 border-neutral-300 text-neutral-700 font-medium py-4 px-6 rounded-lg hover:border-primary-500 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-3"
    >
      {#if isSubmitting}
        <LoadingSpinner size="sm" color="primary" />
        <span>Signing in...</span>
      {:else}
        <svg class="w-6 h-6" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span class="text-lg">Continue with Google</span>
      {/if}
    </button>

    <!-- Facebook Sign-in Button -->
    <button
      type="button"
      data-cy="facebook-signin-button"
      on:click={handleFacebookSignIn}
      disabled={loading === 'loading' || isSubmitting}
      class="w-full bg-[#1877F2] text-white font-medium py-4 px-6 rounded-lg hover:bg-[#166FE5] focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-3"
    >
      {#if isSubmitting}
        <LoadingSpinner size="sm" color="white" />
        <span>Signing in...</span>
      {:else}
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        <span class="text-lg">Continue with Facebook</span>
      {/if}
    </button>

    <!-- Apple Sign-in Button -->
    <button
      type="button"
      data-cy="apple-signin-button"
      on:click={handleAppleSignIn}
      disabled={loading === 'loading' || isSubmitting}
      class="w-full bg-black text-white font-medium py-4 px-6 rounded-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-3"
    >
      {#if isSubmitting}
        <LoadingSpinner size="sm" color="white" />
        <span>Signing in...</span>
      {:else}
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
        </svg>
        <span class="text-lg">Continue with Apple</span>
      {/if}
    </button>
  </div>

  <!-- Terms and Privacy -->
  <div class="mt-8 text-center">
    <p class="text-sm text-neutral-500">
      By signing in, you agree to our 
      <a href="/legal/terms" target="_blank" class="text-primary-500 hover:text-accent-500 underline">
        Terms of Service
      </a>
      and 
      <a href="/legal/privacy" target="_blank" class="text-primary-500 hover:text-accent-500 underline">
        Privacy Policy
      </a>
    </p>
  </div>

  <!-- Features -->
  <div class="mt-12 space-y-4">
    <h3 class="text-lg font-semibold text-neutral-900 text-center">Why GearGrab?</h3>
    <div class="grid grid-cols-1 gap-4 text-sm text-neutral-600">
      <div class="flex items-center space-x-3">
        <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
        <span>Rent high-quality gear from trusted locals</span>
      </div>
      <div class="flex items-center space-x-3">
        <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
        <span>Save money compared to buying new</span>
      </div>
      <div class="flex items-center space-x-3">
        <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
        <span>Try before you buy expensive equipment</span>
      </div>
      <div class="flex items-center space-x-3">
        <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
        <span>Secure payments and verified users</span>
      </div>
    </div>
  </div>
</div>
