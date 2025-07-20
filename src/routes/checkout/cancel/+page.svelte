<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let listingId: string | null = null;

  onMount(() => {
    // Get listing ID from URL parameters
    listingId = $page.url.searchParams.get('listing_id');
  });

  const goToListing = () => {
    if (listingId) {
      goto(`/listings/${listingId}`);
    } else {
      goto('/');
    }
  };

  const goHome = () => {
    goto('/');
  };

  const goToSearch = () => {
    goto('/search');
  };
</script>

<svelte:head>
  <title>Checkout Cancelled - GearGrab</title>
  <meta name="description" content="Your checkout was cancelled" />
</svelte:head>

<div class="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
  <div class="max-w-md w-full">
    <div class="bg-white rounded-2xl shadow-lg p-8 text-center">
      <!-- Cancel Icon -->
      <div class="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg class="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h1 class="text-3xl font-bold text-neutral-900 mb-4">
        Checkout Cancelled
      </h1>
      
      <p class="text-neutral-600 mb-8">
        Your checkout was cancelled. No payment has been processed. You can try again anytime or continue browsing our gear.
      </p>
      
      <!-- Action Buttons -->
      <div class="space-y-3">
        {#if listingId}
          <button
            on:click={goToListing}
            class="w-full bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Return to Item
          </button>
        {/if}
        
        <button
          on:click={goToSearch}
          class="w-full bg-neutral-200 text-neutral-700 px-6 py-3 rounded-lg font-medium hover:bg-neutral-300 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
        >
          Browse More Gear
        </button>
        
        <button
          on:click={goHome}
          class="w-full text-primary-500 px-6 py-3 rounded-lg font-medium hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Go Home
        </button>
      </div>
      
      <!-- Help Section -->
      <div class="mt-8 pt-6 border-t border-neutral-200">
        <p class="text-sm text-neutral-500 mb-2">
          Need help with your purchase?
        </p>
        <a 
          href="/support" 
          class="text-sm text-primary-500 hover:text-primary-600 font-medium"
        >
          Contact Support
        </a>
      </div>
    </div>
  </div>
</div>

<style>
  /* Additional styles if needed */
</style>
