<script lang="ts">
  import Layout from '$lib/components/Layout.svelte';
  import AuthForm from '$lib/components/auth/AuthForm.svelte';
  import SlideTransition from '$lib/components/transitions/SlideTransition.svelte';
  import { authStore } from '$lib/stores/auth.store';
  import { navigateWithTransition, showSuccessAnimation } from '$lib/utils/transitions';
  import { onMount } from 'svelte';

  let authMode: 'signin' | 'signup' = 'signin';
  let pageElement: HTMLElement;
  let isTransitioning = false;

  $: user = $authStore.data;

  // Redirect if already authenticated
  $: if (user && !isTransitioning) {
    navigateWithTransition('/dashboard', { delay: 100 });
  }

  const handleAuthSuccess = async (event: CustomEvent) => {
    const { user, mode } = event.detail;
    isTransitioning = true;

    // Show success animation
    if (pageElement) {
      const message = mode === 'google'
        ? 'Welcome to GearGrab!'
        : mode === 'signup'
          ? 'Account created successfully!'
          : 'Welcome back to GearGrab!';

      showSuccessAnimation(pageElement, message);
    }

    // Navigate to dashboard after animation
    setTimeout(async () => {
      await navigateWithTransition('/dashboard', { replaceState: true });
    }, 2500);
  };

  const handleModeChange = (event: CustomEvent) => {
    authMode = event.detail.mode;
  };

  onMount(() => {
    // Add slide-in animation to the page
    if (pageElement) {
      pageElement.classList.add('slide-in-right');
    }
  });
</script>

<Layout
  title="{authMode === 'signup' ? 'Join' : 'Sign In to'} GearGrab"
  heroTitle={authMode === 'signup' ? 'Join the GearGrab Community' : 'Welcome Back to GearGrab'}
  heroSubtitle={authMode === 'signup' ? 'Start buying and selling outdoor gear today' : 'Sign in to continue your gear journey'}
>
  <div bind:this={pageElement} class="py-12">
    <SlideTransition direction="right" duration={500}>
      <AuthForm
        mode={authMode}
        on:success={handleAuthSuccess}
        on:modeChange={handleModeChange}
      />
    </SlideTransition>
  </div>
</Layout>
