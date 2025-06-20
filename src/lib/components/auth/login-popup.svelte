<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { notifications } from '$lib/stores/notifications';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import SocialLoginButtons from './SocialLoginButtons.svelte';

  export let show = false;

  const dispatch = createEventDispatcher<{
    close: void;
    success: { user: any };
    switchToSignup: void;
  }>();

  let loading = false;
  let error = '';

  // Get redirect URL from query params
  $: redirectTo = $page.url.searchParams.get('redirectTo') || '/';

  async function handleSocialLoginSuccess() {
    console.log('✅ Login popup: Social sign-in successful');

    notifications.add({
      type: 'success',
      message: 'Successfully signed in!',
      timeout: 3000
    });

    // Force refresh auth state to ensure UI updates
    setTimeout(() => {
      simpleAuth.refreshAuth();
    }, 500);

    // Close modal and dispatch success
    show = false;
    dispatch('success', { user: null }); // User will be available in auth state

    // Navigate to redirect URL
    await goto(redirectTo);
  }

  function handleClose() {
    show = false;
    dispatch('close');
  }

  function switchToSignup() {
    show = false;
    dispatch('switchToSignup');
  }

  // Handle escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  // Reset state when modal opens/closes
  $: if (show) {
    error = '';
    loading = false;
  }
</script>

<svelte:window on:keydown="{handleKeydown}" />

{#if show}
  <!-- Modal backdrop -->
  <div 
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    on:click="{handleClose}"
    role="dialog"
    aria-modal="true"
    aria-labelledby="login-title"
  >
    <!-- Modal content -->
    <div 
      class="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl w-full max-w-md p-8 relative"
      on:click|stopPropagation
    >
      <!-- Close button -->
      <button
        on:click="{handleClose}"
        class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        aria-label="Close login modal"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Header -->
      <div class="text-center mb-8">
        <h2 id="login-title" class="text-2xl font-bold text-white mb-2">Welcome Back</h2>
        <p class="text-gray-300">Sign in to your GearGrab account</p>
      </div>

      <!-- Error display -->
      {#if error}
        <div class="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p class="text-sm text-red-400">{error}</p>
        </div>
      {/if}

      <!-- Social Login Buttons -->
      <SocialLoginButtons
        on:success={handleSocialLoginSuccess}
      />

      <!-- Footer -->
      <div class="mt-6 text-center">
        <p class="text-gray-400 text-sm">
          Don't have an account?
          <button
            on:click="{switchToSignup}"
            class="text-green-400 hover:text-green-300 font-medium transition-colors"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  </div>
{/if}
