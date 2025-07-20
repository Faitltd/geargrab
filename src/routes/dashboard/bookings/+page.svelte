<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import type { Booking } from '$lib/types/bookings';
  import { formatBookingStatus, getBookingStatusColor } from '$lib/types/bookings';

  // State
  let loading = true;
  let error = '';
  let bookings: Booking[] = [];
  let activeTab: 'all' | 'renter' | 'owner' = 'all';

  $: user = $authStore.data;
  $: filteredBookings = filterBookings(bookings, activeTab);

  onMount(async () => {
    if (!user) {
      goto('/auth/signin');
      return;
    }

    await loadBookings();
  });

  async function loadBookings() {
    try {
      loading = true;
      error = '';

      const response = await fetch('/api/bookings');
      const result = await response.json();

      if (!result.success) {
        error = result.error?.message || 'Failed to load bookings';
        return;
      }

      bookings = result.data.bookings.map((booking: any) => ({
        ...booking,
        startDate: new Date(booking.startDate),
        endDate: new Date(booking.endDate),
        createdAt: new Date(booking.createdAt),
        updatedAt: new Date(booking.updatedAt)
      }));

    } catch (err: any) {
      error = err.message || 'Failed to load bookings';
      console.error('Error loading bookings:', err);
    } finally {
      loading = false;
    }
  }

  function filterBookings(allBookings: Booking[], tab: string): Booking[] {
    if (!user) return [];

    switch (tab) {
      case 'renter':
        return allBookings.filter(booking => booking.renterId === user.uid);
      case 'owner':
        return allBookings.filter(booking => booking.ownerId === user.uid);
      default:
        return allBookings;
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatDateRange(startDate: Date, endDate: Date): string {
    const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  }

  function viewBooking(bookingId: string) {
    goto(`/bookings/${bookingId}`);
  }

  function getTabCounts() {
    if (!user) return { all: 0, renter: 0, owner: 0 };

    return {
      all: bookings.length,
      renter: bookings.filter(b => b.renterId === user.uid).length,
      owner: bookings.filter(b => b.ownerId === user.uid).length
    };
  }

  $: tabCounts = getTabCounts();
</script>

<svelte:head>
  <title>My Bookings - GearGrab</title>
  <meta name="description" content="Manage your rental bookings and requests" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
      <p class="text-gray-600">Manage your rental bookings and requests</p>
    </div>

    {#if loading}
      <div class="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    {:else if error}
      <div class="mb-6">
        <ErrorBanner message={error} />
      </div>
    {:else}
      <!-- Tabs -->
      <div class="mb-6">
        <nav class="flex space-x-8" aria-label="Tabs">
          <button
            on:click={() => activeTab = 'all'}
            class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'all' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          >
            All Bookings
            {#if tabCounts.all > 0}
              <span class="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                {tabCounts.all}
              </span>
            {/if}
          </button>
          
          <button
            on:click={() => activeTab = 'renter'}
            class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'renter' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          >
            My Rentals
            {#if tabCounts.renter > 0}
              <span class="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                {tabCounts.renter}
              </span>
            {/if}
          </button>
          
          <button
            on:click={() => activeTab = 'owner'}
            class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'owner' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          >
            My Listings
            {#if tabCounts.owner > 0}
              <span class="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                {tabCounts.owner}
              </span>
            {/if}
          </button>
        </nav>
      </div>

      <!-- Bookings List -->
      {#if filteredBookings.length === 0}
        <div class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
          <p class="mt-1 text-sm text-gray-500">
            {activeTab === 'renter' 
              ? "You haven't made any rental requests yet."
              : activeTab === 'owner'
              ? "You haven't received any booking requests yet."
              : "You don't have any bookings yet."
            }
          </p>
          <div class="mt-6">
            <a
              href="/listings/browse"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Browse Listings
            </a>
          </div>
        </div>
      {:else}
        <div class="bg-white shadow overflow-hidden sm:rounded-md">
          <ul class="divide-y divide-gray-200">
            {#each filteredBookings as booking}
              <li>
                <button
                  on:click={() => viewBooking(booking.id)}
                  class="w-full text-left block hover:bg-gray-50 px-4 py-4 sm:px-6 transition-colors"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                      <!-- Listing Image -->
                      <div class="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {#if booking.listing?.images && booking.listing.images.length > 0}
                          <img
                            src={booking.listing.images[0]}
                            alt={booking.listing?.title}
                            class="w-full h-full object-cover"
                          />
                        {:else}
                          <div class="w-full h-full flex items-center justify-center">
                            <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        {/if}
                      </div>

                      <!-- Booking Details -->
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                          <p class="text-sm font-medium text-gray-900 truncate">
                            {booking.listing?.title || 'Unknown Item'}
                          </p>
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getBookingStatusColor(booking.status)}">
                            {formatBookingStatus(booking.status)}
                          </span>
                        </div>
                        
                        <div class="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatDateRange(booking.startDate, booking.endDate)}</span>
                          <span>•</span>
                          <span>{booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>{formatCurrency(booking.pricing.total)}</span>
                        </div>

                        <div class="mt-1 text-sm text-gray-500">
                          {booking.renterId === user?.uid 
                            ? `Renting from ${booking.owner?.name}`
                            : `Rental request from ${booking.renter?.name}`
                          }
                        </div>
                      </div>
                    </div>

                    <!-- Arrow -->
                    <div class="flex-shrink-0">
                      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    {/if}
  </div>
</div>
