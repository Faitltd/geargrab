<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import StripePaymentForm from '$lib/components/payments/stripe-payment-form.svelte';
  import type { Listing } from '$lib/types/firestore';

  export let listing: Listing;
  export let rentalFees: {
    days: number;
    rentalFee: number;
    serviceFee: number;
    deliveryFee: number;
    totalPrice: number;
  };
  export let paymentMetadata: Record<string, string> = {};

  const dispatch = createEventDispatcher();

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  function handlePaymentSuccess(event: CustomEvent) {
    dispatch('success', event.detail);
  }

  function handlePaymentError(event: CustomEvent) {
    dispatch('error', event.detail);
  }

  function handleBack() {
    dispatch('back');
  }
</script>

<div class="space-y-6">
  <!-- Booking Summary -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <h4 class="text-lg font-semibold text-white mb-4">Booking Summary</h4>
    <div class="space-y-2 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-300">Item:</span>
        <span class="text-white">{listing.title}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-300">Duration:</span>
        <span class="text-white">{rentalFees.days} day{rentalFees.days !== 1 ? 's' : ''}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-300">Total Amount:</span>
        <span class="text-white font-bold">{formatCurrency(rentalFees.totalPrice)}</span>
      </div>
    </div>
  </div>

  <!-- Payment Form -->
  <StripePaymentForm
    amount="{rentalFees.totalPrice}"
    currency="usd"
    metadata="{paymentMetadata}"
    on:success="{handlePaymentSuccess}"
    on:error="{handlePaymentError}"
  />

  <!-- Back Button -->
  <button
    on:click="{handleBack}"
    class="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
  >
    ← Back to Details
  </button>
</div>
