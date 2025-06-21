<script lang="ts">
  // BRAND NEW Auth Manager - v3.0.0 - SOCIAL ONLY
  import { createEventDispatcher } from 'svelte';
  import SocialOnlyLoginModal from './SocialOnlyLoginModal.svelte';
  import SocialOnlySignupModal from './SocialOnlySignupModal.svelte';

  export let showLogin = false;
  export let showSignup = false;

  const dispatch = createEventDispatcher<{
    loginSuccess: { user: any };
    signupSuccess: { user: any };
    close: void;
  }>();

  // Handle login modal events
  function handleLoginClose() {
    showLogin = false;
    dispatch('close');
  }

  function handleLoginSuccess(event: CustomEvent) {
    showLogin = false;
    dispatch('loginSuccess', event.detail);
  }

  function handleLoginSwitchToSignup() {
    showLogin = false;
    showSignup = true;
  }

  // Handle signup modal events
  function handleSignupClose() {
    showSignup = false;
    dispatch('close');
  }

  function handleSignupSuccess(event: CustomEvent) {
    showSignup = false;
    dispatch('signupSuccess', event.detail);
  }

  function handleSignupSwitchToLogin() {
    showSignup = false;
    showLogin = true;
  }

  // Public methods to open modals
  export function openLogin() {
    showLogin = true;
    showSignup = false;
  }

  export function openSignup() {
    showSignup = true;
    showLogin = false;
  }

  export function closeAll() {
    showLogin = false;
    showSignup = false;
  }
</script>

<!-- Social-Only Login Modal -->
<SocialOnlyLoginModal
  bind:show="{showLogin}"
  on:close="{handleLoginClose}"
  on:success="{handleLoginSuccess}"
  on:switchToSignup="{handleLoginSwitchToSignup}"
/>

<!-- Social-Only Signup Modal -->
<SocialOnlySignupModal
  bind:show="{showSignup}"
  on:close="{handleSignupClose}"
  on:success="{handleSignupSuccess}"
  on:switchToLogin="{handleSignupSwitchToLogin}"
/>
