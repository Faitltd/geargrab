<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { notifications } from '$lib/stores/notifications';
  import Modal from '$lib/components/ui/modal.svelte';
  import SocialLoginButtons from './SocialLoginButtons.svelte';

  export let show = false;

  const dispatch = createEventDispatcher();

  function handleSocialLoginSuccess() {
    notifications.add({
      type: 'success',
      message: 'Account created successfully!',
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

  function switchToLogin() {
    show = false;
    dispatch('switchToLogin');
  }
</script>

<Modal bind:show title="Create Your Account" on:close="{handleClose}">
  <div class="p-6">
    <div class="text-center mb-6">
      <p class="text-gray-300 text-sm">
        Sign up with your preferred method - it's fast and secure
      </p>
    </div>

    <!-- Social Login Buttons -->
    <SocialLoginButtons on:success={handleSocialLoginSuccess} />

    <!-- Login Link -->
    <div class="mt-6 text-center">
      <p class="text-sm text-gray-400">
        Already have an account?
        <button
          type="button"
          on:click={switchToLogin}
          class="text-green-400 hover:text-green-300 underline font-medium"
        >
          Sign in here
        </button>
      </p>
    </div>
  </div>
</Modal>
