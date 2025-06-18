<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { notifications } from '$lib/stores/notifications';

  export let loading: boolean = false;
  export let text: string = 'Continue with Google';
  export let loadingText: string = 'Signing in...';
  export let className: string = '';
  export let usePopup: boolean = true; // Use popup by default

  const dispatch = createEventDispatcher<{
    success: { user: any };
    error: { error: any };
  }>();

  let isLoading = false;

  async function handleGoogleSignIn() {
    if (isLoading || loading) return;

    isLoading = true;

    try {
      console.log('🔐 Starting Google sign-in process...');
      const result = await simpleAuth.signInWithGoogle();

      if (result.success) {
        console.log('✅ Google sign-in successful');

        notifications.add({
          type: 'success',
          message: 'Successfully signed in with Google!',
          timeout: 5000
        });

        // Get the current user from simpleAuth
        const user = simpleAuth.user;
        dispatch('success', { user });
      } else {
        throw new Error(result.error || 'Google sign-in failed');
      }
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);

      let errorMessage = error.message || 'An error occurred during Google sign-in';

      // Handle domain authorization error specifically
      if (error.message?.includes('unauthorized-domain')) {
        errorMessage = 'Google sign-in is temporarily unavailable. Please use email sign-in instead.';
      }

      notifications.add({
        type: 'error',
        message: errorMessage,
        timeout: 8000
      });

      dispatch('error', { error });
    } finally {
      isLoading = false;
    }
  }

  $: buttonDisabled = isLoading || loading;
  $: buttonText = buttonDisabled ? loadingText : text;
</script>

<button
  type="button"
  class="w-full flex justify-center items-center px-4 py-3 border border-white/20 rounded-md shadow-sm bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed {className}"
  on:click={handleGoogleSignIn}
  disabled={buttonDisabled}
>
  <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
  {buttonText}
</button>
