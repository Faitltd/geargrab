<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { user, isAuthenticated } from '../../lib/stores/auth.js';
  import GearListingForm from '../../lib/components/gear/GearListingForm.svelte';

  onMount(() => {
    // Check if user is authenticated
    if (!$isAuthenticated) {
      goto('/auth/login?redirect=' + encodeURIComponent('/list-gear'));
      return;
    }
  });

  function handleSuccess(event) {
    const { gearItem } = event.detail;

    // Redirect to the new gear item page
    goto(`/gear/${gearItem.id}?success=created`);
  }
</script>

<svelte:head>
  <title>List Your Gear - GearGrab</title>
  <meta name="description" content="List your outdoor gear for rent and start earning money" />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900">List Your Gear</h1>
      <p class="mt-2 text-lg text-gray-600">
        Turn your unused outdoor gear into income by renting it to fellow adventurers
      </p>
    </div>

    <!-- Benefits Section -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Why List on GearGrab?</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="text-center">
          <div class="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900">Earn Extra Income</h3>
          <p class="text-sm text-gray-600">Make money from gear sitting in your garage</p>
        </div>

        <div class="text-center">
          <div class="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900">Secure & Protected</h3>
          <p class="text-sm text-gray-600">All rentals are insured and verified</p>
        </div>

        <div class="text-center">
          <div class="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900">Build Community</h3>
          <p class="text-sm text-gray-600">Connect with fellow outdoor enthusiasts</p>
        </div>
      </div>
    </div>

    <!-- Listing Form -->
    {#if $isAuthenticated}
      <GearListingForm on:success={handleSuccess} />
    {:else}
      <div class="bg-white rounded-lg shadow-md p-8 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        <h3 class="mt-2 text-lg font-medium text-gray-900">Sign In Required</h3>
        <p class="mt-1 text-gray-600">You need to be signed in to list your gear</p>
        <div class="mt-4">
          <button
            on:click={() => goto('/auth/login?redirect=' + encodeURIComponent('/list-gear'))}
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Sign In
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
