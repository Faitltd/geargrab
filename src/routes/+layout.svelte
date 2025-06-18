<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import '../app.css';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { BookingContextManager } from '$lib/utils/booking-context';
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

  // Handle Google auth redirects on app initialization
  onMount(async () => {
    console.log('🔄 Layout: Checking for Google auth redirect result...');

    try {
      const redirectResult = await simpleAuth.handleRedirectResult();

      if (redirectResult.success && redirectResult.user) {
        console.log('✅ Layout: Google auth redirect successful:', redirectResult.user.email);

        // Check if we have a booking context to restore
        if (BookingContextManager.isReturningFromAuth()) {
          console.log('🔄 Layout: Returning from auth, restoring booking context...');

          // Mark auth as completed
          BookingContextManager.markAuthCompleted();

          // Get the return URL
          const returnUrl = BookingContextManager.getReturnUrl();

          // Navigate back to the booking page
          if (returnUrl && returnUrl !== window.location.href) {
            console.log('🔄 Layout: Navigating back to booking:', returnUrl);
            goto(returnUrl);
          }
        }
      } else if (redirectResult.error) {
        console.error('❌ Layout: Google auth redirect failed:', redirectResult.error);
      }
    } catch (error) {
      console.error('❌ Layout: Error handling redirect result:', error);
    }
  });

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