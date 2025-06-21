<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { notifications } from '$lib/stores/notifications';
  // import Modal from '$lib/components/ui/modal.svelte'; // Temporarily disabled for deployment
  import SocialLoginButtons from './SocialLoginButtons.svelte';

  export let show = false;
  export let redirectAfterLogin = true;

  const dispatch = createEventDispatcher();

  function handleSocialLoginSuccess() {
    notifications.add({
      type: 'success',
      message: 'Successfully logged in!',
      timeout: 5000
    });

    // Close modal and dispatch success
    show = false;
    dispatch('success');
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

{#if show}
  <!-- Simple modal backdrop -->
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" on:click={handleClose}>
    <!-- Modal content -->
    <div class="bg-gray-800 rounded-lg shadow-xl max-w-md w-full" on:click|stopPropagation>
      <!-- Modal header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-700">
        <h2 class="text-xl font-semibold text-white">Sign In to Continue</h2>
        <button type="button" class="text-gray-400 hover:text-gray-300" on:click={handleClose}>
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal body -->
      <div class="p-6">
        <div class="text-center mb-6">
          <p class="text-gray-300 text-sm">
            Choose your preferred sign-in method for fast, secure access
          </p>
        </div>

        <!-- Social Login Buttons -->
        <SocialLoginButtons on:success={handleSocialLoginSuccess} />

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
      </div>
    </div>
  </div>
{/if}
