<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { BookingStatus, getStatusDisplay } from '$lib/types/booking-status';
  import { notifications } from '$lib/stores/notifications';
  import { firestore } from '$lib/firebase/client';
  import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

  // Real listings data from Firebase
  let listings = [];

  let loading = false;
  let totalEarnings = 0;
  let totalBookings = 0;
  let totalViews = 0;

  // Pending bookings functionality
  let pendingBookings: any[] = [];
  let bookingsLoading = false;
  let bookingsError = '';

  $: authState = simpleAuth.authState;

  // Load user's listings from Firebase
  async function loadUserListings() {
    if (!$authState.isAuthenticated || !$authState.user || !firestore) {
      console.log('User not authenticated or firestore not available, cannot load listings');
      return;
    }

    try {
      loading = true;
      console.log('Loading listings for user:', $authState.user.uid);

      const listingsQuery = query(
        collection(firestore, 'listings'),
        where('ownerUid', '==', $authState.user.uid)
      );

      const querySnapshot = await getDocs(listingsQuery);

      listings = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          dailyPrice: data.dailyPrice,
          status: data.status || 'active',
          image: data.images?.[0] || "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
          views: 0, // TODO: Implement view tracking
          bookings: 0, // TODO: Implement booking counting
          earnings: 0, // TODO: Calculate from bookings
          category: data.category,
          condition: data.condition,
          location: data.location,
          isActive: data.isActive,
          createdAt: data.createdAt
        };
      });

      console.log(`Loaded ${listings.length} listings:`, listings);

      // Calculate totals (placeholder values for now)
      totalEarnings = listings.reduce((sum, listing) => sum + (listing.earnings || 0), 0);
      totalBookings = listings.reduce((sum, listing) => sum + (listing.bookings || 0), 0);
      totalViews = listings.reduce((sum, listing) => sum + (listing.views || 0), 0);

    } catch (error) {
      console.error('Error loading listings:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to load your listings. Please try again.'
      });
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    // Load user's listings first
    await loadUserListings();

    // Load pending bookings if authenticated
    if ($authState.isAuthenticated) {
      await loadPendingBookings();
    }
  });

  async function loadPendingBookings() {
    try {
      bookingsLoading = true;
      bookingsError = '';
      const response = await fetch("/api/bookings?role=owner&status=pending_owner_approval");

      if (!response.ok) {
        // Check if it's an authentication error
        if (response.status === 401) {
          bookingsError = 'Please log in to view your bookings';
          return;
        }

        // For other errors, check if it's a server error vs no data
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 500 && errorData.error?.includes('No matching documents')) {
          // This means no bookings found, not an error
          pendingBookings = [];
          return;
        }

        throw new Error(errorData.error || 'Failed to load bookings');
      }

      const data = await response.json();
      pendingBookings = data.bookings || [];
    } catch (err: any) {
      // Only show error if it's not a "no bookings" situation
      if (!err.message?.includes('No matching documents')) {
        bookingsError = err.message || 'Failed to load pending bookings';
        console.error('Error loading pending bookings:', err);
      } else {
        // No bookings found - this is normal, not an error
        pendingBookings = [];
      }
    } finally {
      bookingsLoading = false;
    }
  }

  async function handleBookingAction(bookingId: string, action: 'approve' | 'deny', reason?: string) {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, reason })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process booking');
      }

      const result = await response.json();

      notifications.add({
        type: 'success',
        message: result.message || `Booking ${action}d successfully`,
        timeout: 5000
      });

      // Reload pending bookings
      await loadPendingBookings();
    } catch (err: any) {
      notifications.add({
        type: 'error',
        message: err.message || `Failed to ${action} booking`,
        timeout: 5000
      });
    }
  }

  function editListing(listingId: string) {
    goto(`/edit-listing/${listingId}`);
  }

  function viewListing(listingId: string) {
    console.log('Navigating to listing detail for ID:', listingId);
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

  function formatDate(timestamp: any): string {
    if (!timestamp) return 'N/A';

    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
          on:click="{createNewListing}"
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

  <!-- Pending Booking Requests -->
  {#if $authState.isAuthenticated}
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 mb-8">
      <div class="px-6 py-4 border-b border-white/20">
        <h2 class="text-lg font-medium text-white flex items-center">
          Pending Booking Requests
          {#if pendingBookings.length > 0}
            <span class="bg-yellow-500 text-yellow-900 text-sm font-medium px-2 py-1 rounded-full ml-2">
              {pendingBookings.length}
            </span>
          {/if}
        </h2>
      </div>

      {#if bookingsLoading}
        <div class="flex justify-center items-center py-8">
          <div class="animate-spin h-6 w-6 border-4 border-green-500 border-t-transparent rounded-full mr-3"></div>
          <span class="text-white">Loading pending bookings...</span>
        </div>
      {:else if bookingsError}
        <div class="p-6">
          <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <div class="flex items-center mb-2">
              <svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <p class="text-red-200 font-medium">Unable to load booking requests</p>
            </div>
            <p class="text-red-300 text-sm mb-3">{bookingsError}</p>
            <button
              on:click="{loadPendingBookings}"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      {:else if pendingBookings.length === 0}
        <div class="text-center py-8">
          <div class="text-gray-400 text-4xl mb-3">📋</div>
          <p class="text-gray-300">No pending booking requests</p>
          <p class="text-gray-400 text-sm mt-1">New booking requests will appear here for your approval</p>
        </div>
      {:else}
        <div class="p-6 space-y-4">
          {#each pendingBookings as booking}
            <div class="bg-white/5 rounded-lg border border-white/10 p-4">
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

                <!-- Booking Info -->
                <div class="lg:col-span-2">
                  <div class="flex items-start justify-between mb-3">
                    <div>
                      <h3 class="text-white font-medium">
                        Booking #{booking.id.slice(-6)}
                      </h3>
                      <p class="text-gray-300 text-sm">
                        {booking.contactInfo?.firstName} {booking.contactInfo?.lastName}
                      </p>
                    </div>
                    <span class="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs">
                      {getStatusDisplay(booking.status)}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="text-gray-300">Dates:</span>
                      <span class="text-white ml-2">{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</span>
                    </div>
                    <div>
                      <span class="text-gray-300">Delivery:</span>
                      <span class="text-white ml-2">{booking.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}</span>
                    </div>
                  </div>
                </div>

                <!-- Payment & Actions -->
                <div class="lg:col-span-1">
                  <div class="bg-white/5 rounded p-3 mb-3">
                    <div class="text-sm space-y-1">
                      <div class="flex justify-between">
                        <span class="text-green-300">✅ Paid:</span>
                        <span class="text-green-300">{formatCurrency(booking.totalPrice)}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-blue-300">⏳ After approval:</span>
                        <span class="text-blue-300">{formatCurrency(booking.priceBreakdown?.laterFees || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <button
                      on:click={() => handleBookingAction(booking.id, 'approve')}
                      class="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
                    >
                      ✅ Approve
                    </button>

                    <button
                      on:click={() => handleBookingAction(booking.id, 'deny', 'Owner declined the booking request')}
                      class="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
                    >
                      ❌ Decline
                    </button>
                  </div>
                </div>

              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

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
            on:click="{createNewListing}"
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
              <!-- Mobile-First Layout with Guaranteed Button Visibility -->
              <div class="space-y-4">
                <!-- Top Row: Image, Title, Status, Actions -->
                <div class="flex items-start gap-4">
                  <!-- Image -->
                  <div class="flex-shrink-0">
                    <img
                      src="{listing.image}"
                      alt="{listing.title}"
                      class="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg" />
                  </div>

                  <!-- Title and Status -->
                  <div class="flex-1 min-w-0 space-y-2">
                    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <h3 class="text-base sm:text-lg font-medium text-white break-words leading-tight">
                        {listing.title}
                      </h3>
                      <div class="flex-shrink-0">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(listing.status)}">
                          {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Actions - Always Visible on Right -->
                  <div class="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                    <button
                      on:click={() => viewListing(listing.id)}
                      class="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      View
                    </button>
                    <button
                      on:click={() => editListing(listing.id)}
                      class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <!-- Description -->
                <div class="ml-20 sm:ml-24">
                  <p class="text-sm text-gray-300 line-clamp-2">
                    {listing.description}
                  </p>
                </div>

                <!-- Stats Row -->
                <div class="ml-20 sm:ml-24">
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-300">
                    <span>${listing.dailyPrice}/day</span>
                    <span class="hidden sm:inline">•</span>
                    <span>{listing.views} views</span>
                    <span class="hidden sm:inline">•</span>
                    <span>{listing.bookings} bookings</span>
                    <span class="hidden sm:inline">•</span>
                    <span>${listing.earnings} earned</span>
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