<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { verifyPaymentSession } from '$lib/services/stripe.service';
  import { showToast } from '$lib/stores/toast.store';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';

  // State
  let loading = true;
  let error = '';
  let paymentData: any = null;
  let bookingId = '';
  let isRental = true;
  let rentalData: any = null;
  let redirecting = false;

  $: sessionId = $page.url.searchParams.get('session_id');
  $: user = $authStore.data;

  onMount(async () => {
    if (!sessionId) {
      error = 'No payment session found';
      loading = false;
      return;
    }

    if (!user) {
      goto('/auth/signin');
      return;
    }

    await verifyPayment();
  });

  async function verifyPayment() {
    try {
      loading = true;
      error = '';

      const result = await verifyPaymentSession(sessionId!);

      if (!result.success) {
        error = result.error || 'Failed to verify payment';
        return;
      }

      paymentData = result;
      bookingId = result.bookingId || '';

      // Show success message
      if (result.paymentStatus === 'completed') {
        showToast('success', 'Payment successful! Your booking is confirmed.');
      } else {
        showToast('info', 'Payment is being processed. You will receive confirmation shortly.');
      }

    } catch (err: any) {
      error = err.message || 'Failed to verify payment';
      console.error('Error verifying payment:', err);
    } finally {
      loading = false;
    }
  }

  const fetchCheckoutSessionData = async () => {
    if (!sessionId || !db) return;

    try {
      const sessionDoc = await getDoc(doc(db, 'checkout_sessions', sessionId));

      if (sessionDoc.exists()) {
        const sessionData = sessionDoc.data();
        isRental = sessionData.mode === 'rental';

        if (isRental && sessionData.bookingData) {
          rentalData = {
            listingId: sessionData.listingId,
            ownerId: sessionData.ownerId,
            rentalId: sessionData.rentalId, // This will be set by the webhook
            bookingData: JSON.parse(sessionData.bookingData)
          };
        }
      }
    } catch (err) {
      console.error('Error fetching checkout session:', err);
      // Don't show error to user, just proceed without rental data
    }
  };

  const redirectToVerification = () => {
    if (!rentalData) return;

    redirecting = true;

    // Use the rental ID from the session data, or fall back to session ID
    const rentalId = rentalData.rentalId || sessionId;
    const verificationUrl = `/verification/before?rentalId=${rentalId}&listingId=${rentalData.listingId}&ownerId=${rentalData.ownerId}`;
    goto(verificationUrl);
  };

  const goToBookings = () => {
    goto('/dashboard/bookings');
  };

  const goToPurchases = () => {
    goto('/dashboard/purchases');
  };

  const goHome = () => {
    goto('/');
  };
</script>

<svelte:head>
  <title>Payment Successful - GearGrab</title>
  <meta name="description" content="Your payment has been processed successfully" />
</svelte:head>

<div class="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
  <div class="max-w-md w-full">
    {#if loading}
      <!-- Loading State -->
      <div class="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p class="text-neutral-600">Processing your payment...</p>
      </div>
    
    {:else if error}
      <!-- Error State -->
      <div class="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1 class="text-2xl font-bold text-neutral-900 mb-4">
          Payment Error
        </h1>
        
        <p class="text-neutral-600 mb-6">
          {error}
        </p>
        
        <button
          on:click={goHome}
          class="w-full bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Return Home
        </button>
      </div>
    
    {:else}
      <!-- Success State -->
      <div class="bg-white rounded-2xl shadow-lg p-8 text-center">
        <!-- Success Icon -->
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 class="text-3xl font-bold text-neutral-900 mb-4">
          Payment Successful!
        </h1>

        <p class="text-neutral-600 mb-8">
          {#if paymentData?.paymentStatus === 'completed'}
            Your booking has been confirmed and payment processed successfully.
          {:else}
            Your payment is being processed. You'll receive confirmation shortly.
          {/if}
        </p>

        <!-- Rental verification notice -->
        {#if isRental && rentalData}
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div class="flex items-start space-x-3">
              <svg class="w-6 h-6 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-blue-900 mb-2">
                  Next Step: Condition Verification
                </h3>
                <p class="text-blue-800 mb-4">
                  Before picking up your rental, you'll need to document the gear's condition with photos. This protects both you and the owner.
                </p>

                {#if redirecting}
                  <div class="flex items-center space-x-2 text-blue-700">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span class="text-sm">Redirecting to verification...</span>
                  </div>
                {:else}
                  <div class="flex items-center space-x-4">
                    <button
                      on:click={redirectToVerification}
                      class="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                    >
                      Start Verification Now
                    </button>
                    <span class="text-sm text-blue-600">
                      Auto-redirecting in 3 seconds...
                    </span>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Session ID for reference -->
        {#if sessionId}
          <div class="bg-neutral-50 rounded-lg p-4 mb-6">
            <p class="text-sm text-neutral-500 mb-1">Transaction ID</p>
            <p class="text-sm font-mono text-neutral-700 break-all">{sessionId}</p>
          </div>
        {/if}
        
        <!-- Action Buttons -->
        <div class="space-y-3">
          <button
            on:click={goToBookings}
            class="w-full bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            View My Bookings
          </button>
          
          <button
            on:click={goToPurchases}
            class="w-full bg-neutral-200 text-neutral-700 px-6 py-3 rounded-lg font-medium hover:bg-neutral-300 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
          >
            View My Purchases
          </button>
          
          <button
            on:click={goHome}
            class="w-full text-primary-500 px-6 py-3 rounded-lg font-medium hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Additional styles if needed */
</style>
