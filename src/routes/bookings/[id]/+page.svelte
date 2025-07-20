<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { showToast } from '$lib/stores/toast.store';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import BookingTimeline from '$lib/components/booking/BookingTimeline.svelte';
  import BookingActions from '$lib/components/booking/BookingActions.svelte';
  import type { Booking } from '$lib/types/bookings';
  import { formatBookingStatus, getBookingStatusColor } from '$lib/types/bookings';

  // State
  let loading = true;
  let error = '';
  let booking: Booking | null = null;
  let isOwner = false;
  let isRenter = false;

  $: bookingId = $page.params.id;
  $: user = $authStore.data;

  onMount(async () => {
    if (!user) {
      goto('/auth/signin');
      return;
    }

    await loadBooking();
  });

  async function loadBooking() {
    try {
      loading = true;
      error = '';

      const response = await fetch(`/api/bookings/${bookingId}`);
      const result = await response.json();

      if (!result.success) {
        error = result.error?.message || 'Failed to load booking';
        return;
      }

      booking = result.data;
      
      // Convert date strings back to Date objects
      booking.startDate = new Date(booking.startDate);
      booking.endDate = new Date(booking.endDate);
      booking.createdAt = new Date(booking.createdAt);
      booking.updatedAt = new Date(booking.updatedAt);
      
      if (booking.confirmedAt) booking.confirmedAt = new Date(booking.confirmedAt);
      if (booking.cancelledAt) booking.cancelledAt = new Date(booking.cancelledAt);
      if (booking.completedAt) booking.completedAt = new Date(booking.completedAt);

      // Convert timeline timestamps
      booking.timeline = booking.timeline.map(event => ({
        ...event,
        timestamp: new Date(event.timestamp)
      }));

      // Determine user role
      isOwner = booking.ownerId === user?.uid;
      isRenter = booking.renterId === user?.uid;

    } catch (err: any) {
      error = err.message || 'Failed to load booking';
      console.error('Error loading booking:', err);
    } finally {
      loading = false;
    }
  }

  async function handleStatusUpdate(newStatus: string, message?: string) {
    if (!booking) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, message })
      });

      const result = await response.json();

      if (!result.success) {
        showToast('error', result.error?.message || 'Failed to update booking');
        return;
      }

      showToast('success', 'Booking updated successfully');
      
      // Reload the booking to get updated data
      await loadBooking();

    } catch (err: any) {
      console.error('Error updating booking:', err);
      showToast('error', 'Failed to update booking');
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatDateTime(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
</script>

<svelte:head>
  <title>Booking Details - GearGrab</title>
  <meta name="description" content="View and manage your booking details" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  {#if loading}
    <div class="flex justify-center items-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  {:else if error}
    <div class="max-w-4xl mx-auto px-4 py-8">
      <ErrorBanner message={error} />
      <div class="text-center mt-6">
        <button
          on:click={() => goto('/dashboard')}
          class="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  {:else if booking}
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <button
          on:click={() => goto('/dashboard')}
          class="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to dashboard
        </button>

        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Booking Details</h1>
            <p class="text-gray-600">
              {isOwner ? 'Rental request from' : 'Your booking with'} 
              {isOwner ? booking.renter?.name : booking.owner?.name}
            </p>
          </div>
          
          <div class="text-right">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {getBookingStatusColor(booking.status)}">
              {formatBookingStatus(booking.status)}
            </span>
            <p class="text-sm text-gray-500 mt-1">
              Created {formatDateTime(booking.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Main Details -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Listing Info -->
          {#if booking.listing}
            <div class="bg-white rounded-lg shadow-md p-6">
              <h2 class="text-xl font-semibold text-gray-900 mb-4">Item Details</h2>
              
              <div class="flex space-x-4">
                <div class="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {#if booking.listing.images && booking.listing.images.length > 0}
                    <img
                      src={booking.listing.images[0]}
                      alt={booking.listing.title}
                      class="w-full h-full object-cover"
                    />
                  {:else}
                    <div class="w-full h-full flex items-center justify-center">
                      <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  {/if}
                </div>

                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900 mb-1">{booking.listing.title}</h3>
                  <p class="text-sm text-gray-600 mb-2 capitalize">{booking.listing.category}</p>
                  <a
                    href="/listings/{booking.listingId}"
                    class="text-primary-500 hover:text-primary-600 text-sm font-medium"
                  >
                    View full listing →
                  </a>
                </div>
              </div>
            </div>
          {/if}

          <!-- Rental Details -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Rental Details</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="font-medium text-gray-900 mb-2">Dates</h3>
                <div class="space-y-1 text-sm text-gray-600">
                  <p><span class="font-medium">Check-in:</span> {formatDate(booking.startDate)}</p>
                  <p><span class="font-medium">Check-out:</span> {formatDate(booking.endDate)}</p>
                  <p><span class="font-medium">Duration:</span> {booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}</p>
                </div>
              </div>

              <div>
                <h3 class="font-medium text-gray-900 mb-2">Pickup & Delivery</h3>
                <div class="space-y-1 text-sm text-gray-600">
                  <p><span class="font-medium">Method:</span> 
                    {booking.pickupMethod === 'pickup' ? 'Pickup' : 
                     booking.pickupMethod === 'delivery' ? 'Delivery' : 'Meet up'}
                  </p>
                  {#if booking.pickupLocation}
                    <p><span class="font-medium">Location:</span> {booking.pickupLocation}</p>
                  {/if}
                  {#if booking.deliveryAddress}
                    <p><span class="font-medium">Address:</span> {booking.deliveryAddress}</p>
                  {/if}
                </div>
              </div>
            </div>

            {#if booking.message}
              <div class="mt-6">
                <h3 class="font-medium text-gray-900 mb-2">Message from {isOwner ? 'renter' : 'you'}</h3>
                <p class="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{booking.message}</p>
              </div>
            {/if}
          </div>

          <!-- Contact Info -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              Contact {isOwner ? 'Renter' : 'Owner'}
            </h2>
            
            {#if isOwner && booking.renter}
              <div class="flex items-center space-x-3">
                {#if booking.renter.photoURL}
                  <img
                    src={booking.renter.photoURL}
                    alt={booking.renter.name}
                    class="w-12 h-12 rounded-full object-cover"
                  />
                {:else}
                  <div class="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                {/if}
                
                <div>
                  <p class="font-medium text-gray-900">{booking.renter.name}</p>
                  <p class="text-sm text-gray-600">{booking.renter.email}</p>
                  {#if booking.renter.phone}
                    <p class="text-sm text-gray-600">{booking.renter.phone}</p>
                  {/if}
                </div>
              </div>
            {:else if isRenter && booking.owner}
              <div class="flex items-center space-x-3">
                {#if booking.owner.photoURL}
                  <img
                    src={booking.owner.photoURL}
                    alt={booking.owner.name}
                    class="w-12 h-12 rounded-full object-cover"
                  />
                {:else}
                  <div class="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                {/if}
                
                <div>
                  <p class="font-medium text-gray-900">{booking.owner.name}</p>
                  <p class="text-sm text-gray-600">{booking.owner.email}</p>
                  {#if booking.owner.phone}
                    <p class="text-sm text-gray-600">{booking.owner.phone}</p>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- Right Column: Actions & Timeline -->
        <div class="space-y-6">
          <!-- Pricing Summary -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Price Summary</h2>
            
            <div class="space-y-3">
              {#each booking.pricing.breakdown as item}
                <div class="flex items-center justify-between">
                  <span class="text-gray-700">{item.label}</span>
                  <span class="font-medium {item.type === 'discount' ? 'text-green-600' : 'text-gray-900'}">
                    {item.type === 'discount' ? '-' : ''}{formatCurrency(item.amount)}
                  </span>
                </div>
              {/each}
            </div>

            <div class="border-t border-gray-200 mt-4 pt-4">
              <div class="flex items-center justify-between">
                <span class="text-lg font-semibold text-gray-900">Total</span>
                <span class="text-xl font-bold text-primary-600">{formatCurrency(booking.pricing.total)}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <BookingActions
            {booking}
            {isOwner}
            {isRenter}
            on:statusUpdate={(e) => handleStatusUpdate(e.detail.status, e.detail.message)}
          />

          <!-- Timeline -->
          <BookingTimeline timeline={booking.timeline} />
        </div>
      </div>
    </div>
  {/if}
</div>
