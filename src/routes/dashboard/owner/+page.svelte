<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  // Sample listings data - in a real app, this would come from Firebase
  let listings = [
    {
      id: '1',
      title: 'Premium 4-Person Camping Tent',
      description: 'Spacious and waterproof tent perfect for family camping trips.',
      dailyPrice: 25,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
      views: 45,
      bookings: 3,
      earnings: 150
    },
    {
      id: '2',
      title: 'Professional Hiking Backpack',
      description: '65L backpack with advanced suspension system for multi-day hikes.',
      dailyPrice: 15,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
      views: 32,
      bookings: 2,
      earnings: 90
    },
    {
      id: '3',
      title: 'Mountain Climbing Gear Set',
      description: 'Complete climbing gear including harness, helmet, and ropes.',
      dailyPrice: 40,
      status: 'pending',
      image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
      views: 18,
      bookings: 0,
      earnings: 0
    }
  ];

  let loading = false;
  let totalEarnings = 0;
  let totalBookings = 0;
  let totalViews = 0;

  onMount(() => {
    // Calculate totals
    totalEarnings = listings.reduce((sum, listing) => sum + listing.earnings, 0);
    totalBookings = listings.reduce((sum, listing) => sum + listing.bookings, 0);
    totalViews = listings.reduce((sum, listing) => sum + listing.views, 0);
  });

  function editListing(listingId: string) {
    goto(`/list-gear?edit=${listingId}`);
  }

  function viewListing(listingId: string) {
    goto(`/listing/${listingId}`);
  }

  function createNewListing() {
    goto('/list-gear');
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<svelte:head>
  <title>My Gear Listings - GearGrab</title>
</svelte:head>

<!-- Remove excessive padding - the dashboard layout already has py-8 -->
<div>
  <!-- Header Section -->
  <div class="mb-8">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-white">My Gear Listings</h1>
        <p class="text-gray-200 mt-1">Manage your outdoor gear listings and track their performance</p>
      </div>
      <div class="mt-4 sm:mt-0">
        <button
          on:click={createNewListing}
          class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          List New Gear
        </button>
      </div>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
            </svg>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-300 truncate">Total Earnings</dt>
            <dd class="text-lg font-medium text-white">${totalEarnings}</dd>
          </dl>
        </div>
      </div>
    </div>

    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-300 truncate">Total Bookings</dt>
            <dd class="text-lg font-medium text-white">{totalBookings}</dd>
          </dl>
        </div>
      </div>
    </div>

    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-300 truncate">Total Views</dt>
            <dd class="text-lg font-medium text-white">{totalViews}</dd>
          </dl>
        </div>
      </div>
    </div>

    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-300 truncate">Active Listings</dt>
            <dd class="text-lg font-medium text-white">{listings.filter(l => l.status === 'active').length}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>

  <!-- Listings Grid -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
    <div class="px-6 py-4 border-b border-white/20">
      <h2 class="text-lg font-medium text-white">Your Listings</h2>
    </div>

    {#if loading}
      <div class="flex justify-center items-center py-12">
        <svg class="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    {:else if listings.length === 0}
      <!-- Empty State -->
      <div class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-white">No listings yet</h3>
        <p class="mt-1 text-sm text-gray-300">Start earning money by listing your outdoor gear for rent!</p>
        <div class="mt-6">
          <button
            on:click={createNewListing}
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            List Your First Item
          </button>
        </div>
      </div>
    {:else}
      <!-- Listings Table -->
      <div class="overflow-hidden">
        <div class="grid grid-cols-1 gap-6 p-6">
          {#each listings as listing}
            <div class="border border-white/20 rounded-lg p-6 hover:bg-white/5 transition-all bg-white/5">
              <div class="flex items-start space-x-4">
                <!-- Image -->
                <div class="flex-shrink-0">
                  <img
                    src={listing.image}
                    alt={listing.title}
                    class="w-20 h-20 object-cover rounded-lg"
                  >
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h3 class="text-lg font-medium text-white truncate">
                        {listing.title}
                      </h3>
                      <p class="text-sm text-gray-300 mt-1 line-clamp-2">
                        {listing.description}
                      </p>
                      <div class="flex items-center mt-2 space-x-4 text-sm text-gray-300">
                        <span>${listing.dailyPrice}/day</span>
                        <span>•</span>
                        <span>{listing.views} views</span>
                        <span>•</span>
                        <span>{listing.bookings} bookings</span>
                        <span>•</span>
                        <span>${listing.earnings} earned</span>
                      </div>
                    </div>

                    <!-- Status and Actions -->
                    <div class="flex flex-col items-end space-y-2">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(listing.status)}">
                        {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                      </span>

                      <div class="flex space-x-2">
                        <button
                          on:click={() => viewListing(listing.id)}
                          class="text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          on:click={() => editListing(listing.id)}
                          class="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>