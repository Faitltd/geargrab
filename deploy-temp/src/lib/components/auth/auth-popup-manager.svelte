<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import LoginPopup from './login-popup.svelte';
  import SignupPopup from './signup-popup.svelte';

  export let showLogin = false;
  export let showSignup = false;

  const dispatch = createEventDispatcher<{
    loginSuccess: { user: any };
    signupSuccess: { user: any };
    close: void;
  }>();

  // Handle login popup events
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

  // Handle signup popup events
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

  // Public methods to open popups
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

<!-- Login Popup -->
<LoginPopup
  bind:show="{showLogin}"
  on:close="{handleLoginClose}"
  on:success="{handleLoginSuccess}"
  on:switchToSignup="{handleLoginSwitchToSignup}"
/>

<!-- Signup Popup -->
<SignupPopup
  bind:show="{showSignup}"
  on:close="{handleSignupClose}"
  on:success="{handleSignupSuccess}"
  on:switchToLogin="{handleSignupSwitchToLogin}"
/>
