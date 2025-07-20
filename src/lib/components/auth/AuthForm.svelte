<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { authStore } from '$lib/stores/auth.store';

  const dispatch = createEventDispatcher<{
    success: { user: any; mode: string };
  }>();

  // State
  let localError = '';
  let successMessage = '';
  let isSubmitting = false;

  const handleGoogleSignIn = async () => {
    localError = '';
    successMessage = '';
    isSubmitting = true;

    try {
      await authStore.signInWithGoogle();

      if ($authStore.data) {
        successMessage = 'Welcome to GearGrab!';

        // Dispatch success event for parent to handle transition
        setTimeout(() => {
          dispatch('success', { user: $authStore.data, mode: 'google' });
        }, 1000);
      }

    } catch (error: any) {
      localError = error.message || 'Failed to sign in with Google';
    } finally {
      isSubmitting = false;
    }
  };
</script>

<div class="w-full max-w-md mx-auto">
  <div class="bg-white rounded-lg shadow-lg p-8">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        Welcome to GearGrab
      </h1>
      <p class="text-gray-600">
        Sign in to start renting and sharing outdoor gear
      </p>
    </div>

    <!-- Success Message -->
    {#if successMessage}
      <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span class="text-green-700">{successMessage}</span>
        </div>
      </div>
    {/if}

    <!-- Error Messages -->
    {#if localError}
      <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span class="text-red-700">{localError}</span>
          </div>
          <button on:click={() => localError = ''} class="text-red-500 hover:text-red-700">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    {/if}

    <!-- Google Sign In Button -->
    <button
      type="button"
      data-cy="google-signin-button"
      on:click={handleGoogleSignIn}
      disabled={isSubmitting}
      class="w-full bg-white border-2 border-gray-300 text-gray-700 font-medium py-4 px-6 rounded-lg hover:border-primary-500 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-3"
    >
      {#if isSubmitting}
        <LoadingSpinner />
        <span>Signing in...</span>
      {:else}
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>Continue with Google</span>
      {/if}
    </button>

    <!-- Info Text -->
    <div class="mt-6 text-center">
      <p class="text-sm text-gray-500">
        By continuing, you agree to our
        <a href="/terms" class="text-primary-600 hover:text-primary-700 underline">Terms of Service</a>
        and
        <a href="/privacy" class="text-primary-600 hover:text-primary-700 underline">Privacy Policy</a>
      </p>
    </div>
  </div>
</div>

