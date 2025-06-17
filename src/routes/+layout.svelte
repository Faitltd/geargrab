<script lang="ts">
  import '../app.css';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import Navbar from '$lib/components/layout/navbar.svelte';
  import Footer from '$lib/components/layout/footer.svelte';
  import PageTransition from '$lib/components/layout/page-transition.svelte';
  import ToastNotifications from '$lib/components/ui/toast-notifications.svelte';

  // Use the simple auth system for testing
  $: authState = simpleAuth.authState;

  // Debug: Log auth state changes
  $: {
    console.log('🔍 Layout: Simple Auth state changed:', {
      isAuthenticated: $authState.isAuthenticated,
      user: $authState.user?.email || 'null',
      loading: $authState.loading
    });
  }


</script>

<!-- Skip navigation link for accessibility -->
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-green-600 text-white px-4 py-2 rounded-md z-50 transition-all"
>
  Skip to main content
</a>

<Navbar />

<PageTransition>
  <main id="main-content" class="relative pt-16 content-container" tabindex="-1">
    <slot />
  </main>
</PageTransition>

<Footer />

<!-- Toast Notifications -->
<ToastNotifications />