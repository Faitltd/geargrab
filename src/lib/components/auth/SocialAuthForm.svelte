<script lang="ts">
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import SuccessBanner from '$lib/components/SuccessBanner.svelte';
  import { authStore, signInWithGoogle } from '$lib/stores/auth.store';

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
      disabled={loading !== 'idle' || isSubmitting}
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

    <!-- Future social providers can be added here -->
    <!-- 
    <button class="w-full bg-neutral-900 text-white font-medium py-4 px-6 rounded-lg hover:bg-neutral-800 transition-colors duration-200 flex items-center justify-center space-x-3">
      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
      <span class="text-lg">Continue with GitHub</span>
    </button>
    -->
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
