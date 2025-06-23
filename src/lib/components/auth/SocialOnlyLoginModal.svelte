<script>
  import { createEventDispatcher } from 'svelte';
  import { simpleAuth } from '$lib/auth/simple-auth';

  export let show = false;

  const dispatch = createEventDispatcher();

  let loading = false;
  let error = '';

  async function handleSocialAuth(provider) {
    loading = true;
    error = '';

    try {
      console.log(`🚀 Starting login with ${provider}...`);

      let result;
      switch (provider) {
        case 'google':
          result = await simpleAuth.signInWithGoogle();
          break;
        case 'github':
          result = await simpleAuth.signInWithGitHub();
          break;
        case 'apple':
          result = await simpleAuth.signInWithApple();
          break;
        default:
          throw new Error(`Provider ${provider} not yet configured.`);
      }

      if (result.success) {
        console.log('✅ Login successful');
        dispatch('success');
        show = false;
      } else {
        error = result.error || 'Login failed. Please try again.';
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      error = err.message || 'An unexpected error occurred. Please try again.';
    } finally {
      loading = false;
    }
  }

  function handleClose() {
    if (!loading) {
      show = false;
      dispatch('close');
    }
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }
</script>

{#if show}
  <!-- Modal Backdrop -->
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === 'Escape' && handleClose()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="login-modal-title"
  >
    <!-- Modal Content -->
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
      <!-- Close Button -->
      <button
        on:click={handleClose}
        disabled={loading}
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        aria-label="Close modal"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Header -->
      <div class="text-center mb-8">
        <h2 id="login-modal-title" class="text-2xl font-bold text-gray-900 mb-2">
          Sign in to continue
        </h2>
        <p class="text-gray-600">
          Please sign in to complete your booking
        </p>
      </div>

      <!-- Error Message -->
      {#if error}
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm text-red-700">{error}</span>
          </div>
        </div>
      {/if}

      <!-- Social Login Buttons -->
      <div class="space-y-4">
        <!-- Google Auth -->
        <button
          on:click={() => handleSocialAuth('google')}
          disabled={loading}
          class="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl border border-gray-200"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <!-- Apple Auth -->
        <button
          on:click={() => handleSocialAuth('apple')}
          disabled={loading}
          class="w-full flex items-center justify-center gap-3 bg-black hover:bg-gray-900 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          {loading ? 'Signing in...' : 'Continue with Apple'}
        </button>

        <!-- GitHub Auth -->
        <button
          on:click={() => handleSocialAuth('github')}
          disabled={loading}
          class="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          {loading ? 'Signing in...' : 'Continue with GitHub'}
        </button>
      </div>

      <!-- Footer -->
      <div class="mt-8 text-center">
        <p class="text-xs text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  </div>
{/if}
