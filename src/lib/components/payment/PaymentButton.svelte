<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { checkoutAndRedirect, getStripeEnvironment } from '$lib/services/stripe.service';
  import { showToast } from '$lib/stores/toast.store';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import type { BookingPricing } from '$lib/types/bookings';

  export let bookingId: string;
  export let listingId: string;
  export let pricing: BookingPricing;
  export let bookingData: {
    startDate: string;
    endDate: string;
    totalDays: number;
    pickupMethod: 'pickup' | 'delivery' | 'meetup';
    insurance: boolean;
  };
  export let disabled = false;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let variant: 'primary' | 'secondary' | 'success' = 'primary';

  const dispatch = createEventDispatcher<{
    paymentStarted: void;
    paymentError: { error: string };
  }>();

  let processing = false;

  // Size configurations
  const sizeConfig = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Variant configurations
  const variantConfig = {
    primary: 'bg-primary-500 hover:bg-primary-600 focus:ring-primary-500',
    secondary: 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-500',
    success: 'bg-green-500 hover:bg-green-600 focus:ring-green-500'
  };

  $: buttonClasses = `
    ${sizeConfig[size]}
    ${variantConfig[variant]}
    text-white font-semibold rounded-lg
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-200
    flex items-center justify-center space-x-2
  `.trim();

  $: isTestMode = getStripeEnvironment() === 'test';

  async function handlePayment() {
    if (processing || disabled) return;

    try {
      processing = true;
      dispatch('paymentStarted');

      const checkoutRequest = {
        bookingId,
        listingId,
        mode: 'rental' as const,
        pricing,
        bookingData
      };

      await checkoutAndRedirect(checkoutRequest);

    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.message || 'Failed to process payment';
      
      showToast('error', errorMessage);
      dispatch('paymentError', { error: errorMessage });
    } finally {
      processing = false;
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
</script>

<div class="space-y-2">
  <button
    on:click={handlePayment}
    disabled={disabled || processing}
    class={buttonClasses}
  >
    {#if processing}
      <LoadingSpinner size="sm" color="white" />
      <span>Processing...</span>
    {:else}
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
      <span>Pay {formatCurrency(pricing.total)}</span>
    {/if}
  </button>

  <!-- Test mode indicator -->
  {#if isTestMode}
    <div class="flex items-center justify-center space-x-1 text-xs text-yellow-600">
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <span>Test Mode</span>
    </div>
  {/if}

  <!-- Payment security info -->
  <div class="flex items-center justify-center space-x-2 text-xs text-gray-500">
    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
    <span>Secured by Stripe</span>
  </div>
</div>

<!-- Test card info for development -->
{#if isTestMode}
  <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
    <h4 class="text-sm font-medium text-yellow-800 mb-2">Test Mode - Use Test Cards</h4>
    <div class="text-xs text-yellow-700 space-y-1">
      <p><strong>Success:</strong> 4242 4242 4242 4242</p>
      <p><strong>Decline:</strong> 4000 0000 0000 0002</p>
      <p><strong>Exp:</strong> Any future date, <strong>CVC:</strong> Any 3 digits</p>
    </div>
  </div>
{/if}
