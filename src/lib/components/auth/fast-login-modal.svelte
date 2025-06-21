<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { notifications } from '$lib/stores/notifications';
  import Modal from '$lib/components/ui/Modal.svelte';
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

<Modal bind:show title="Sign In to Continue" on:close="{handleClose}">
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
</Modal>
