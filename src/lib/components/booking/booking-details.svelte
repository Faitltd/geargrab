<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Listing } from '$lib/types/firestore';

  export let listing: Listing;
  export let startDate: Date | string;
  export let endDate: Date | string;
  export let deliveryMethod: 'pickup' | 'delivery' = 'pickup';
  export let rentalFees: {
    days: number;
    rentalFee: number;
    serviceFee: number;
    deliveryFee: number;
    totalPrice: number;
  };
  export let dateValidation: { valid: boolean; error?: string };
  export let canProceed: boolean = false;
  export let processing: boolean = false;

  const dispatch = createEventDispatcher();

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function handleProceed() {
    dispatch('proceed');
  }

  function handleCancel() {
    dispatch('cancel');
  }
</script>

<div class="space-y-6">
  <!-- Listing Summary -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <div class="flex items-start space-x-4">
      {#if listing.images[0]}
        <img 
          src={listing.images[0]} 
          alt={listing.title}
          class="w-20 h-20 object-cover rounded-lg"
        />
      {/if}
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-white mb-2">{listing.title}</h3>
        <p class="text-gray-300 text-sm mb-2">{listing.description}</p>
        <p class="text-green-400 font-medium">{formatCurrency(listing.dailyPrice)}/day</p>
      </div>
    </div>
  </div>

  <!-- Rental Details -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <h4 class="text-lg font-semibold text-white mb-4">Rental Details</h4>
    <div class="space-y-3">
      <div class="flex justify-between">
        <span class="text-gray-300">Pickup Date:</span>
        <span class="text-white">{formatDate(startDate)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-300">Return Date:</span>
        <span class="text-white">{formatDate(endDate)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-300">Duration:</span>
        <span class="text-white">{rentalFees.days} day{rentalFees.days !== 1 ? 's' : ''}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-300">Transfer Method:</span>
        <span class="text-white capitalize">{deliveryMethod}</span>
      </div>
    </div>
  </div>

  <!-- Price Breakdown -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <h4 class="text-lg font-semibold text-white mb-4">Price Breakdown</h4>
    <div class="space-y-2">
      <div class="flex justify-between">
        <span class="text-gray-300">Rental Fee ({rentalFees.days} days):</span>
        <span class="text-white">{formatCurrency(rentalFees.rentalFee)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-300">Service Fee:</span>
        <span class="text-white">{formatCurrency(rentalFees.serviceFee)}</span>
      </div>
      {#if rentalFees.deliveryFee > 0}
        <div class="flex justify-between">
          <span class="text-gray-300">Delivery Fee:</span>
          <span class="text-white">{formatCurrency(rentalFees.deliveryFee)}</span>
        </div>
      {/if}
      <div class="border-t border-white/20 pt-2 mt-2">
        <div class="flex justify-between">
          <span class="text-white font-semibold">Total:</span>
          <span class="text-white font-bold text-xl">{formatCurrency(rentalFees.totalPrice)}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Date Validation -->
  {#if !dateValidation.valid}
    <div class="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
      <p class="text-yellow-200 text-sm">{dateValidation.error}</p>
    </div>
  {/if}

  <!-- Action Buttons -->
  <div class="flex space-x-4">
    <button
      on:click={handleCancel}
      class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
    >
      Cancel
    </button>
    
    <button
      on:click={handleProceed}
      disabled={!canProceed || processing}
      class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
    >
      {#if processing}
        <div class="flex items-center justify-center">
          <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
          Creating Booking...
        </div>
      {:else}
        Proceed to Payment
      {/if}
    </button>
  </div>
</div>
