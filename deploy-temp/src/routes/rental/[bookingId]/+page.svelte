<!--
  Rental Management Page
  Comprehensive page for managing rental handoffs with photo documentation
-->
<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { goto } from '$app/navigation';
  import VideoBackground from '$lib/components/layout/video-background.svelte';
  import RentalHandoff from '$lib/components/rental/rental-handoff.svelte';
  import type { Booking } from '$lib/types/firestore';
  
  // Get booking ID from URL
  $: bookingId = $page.params.bookingId;

  // Get auth state from simpleAuth
  $: authState = simpleAuth.authState;

  // State
  let booking: Booking | null = null;
  let loading = true;
  let error: string | null = null;
  let userRole: 'owner' | 'renter' | null = null;
  let handoffStatus: any = null;
  
  // Reactive values
  $: canAccessPreRental = booking && ['confirmed', 'active', 'completed', 'disputed'].includes(booking.status);
  $: canAccessPostRental = booking && ['active', 'completed', 'disputed'].includes(booking.status);
  $: showPreRental = canAccessPreRental && !handoffStatus?.preRental?.completed;
  $: showPostRental = canAccessPostRental && handoffStatus?.preRental?.completed;
  
  onMount(() => {
    loadBookingData();
  });

  // Track if we've already redirected to avoid loops
  let hasRedirected = false;

  // Reactive authentication check - wait for loading to complete
  $: {
    if (!$authState.loading && !hasRedirected) {
      if (!$authState.user) {
        console.log('❌ User not authenticated, redirecting to login');
        hasRedirected = true;
        goto('/auth/login?redirectTo=' + encodeURIComponent($page.url.pathname));
      } else {
        console.log('✅ User authenticated:', $authState.user.email);
      }
    }
  }
  
  async function loadBookingData() {
    if (!bookingId) {
      error = 'Invalid booking ID';
      loading = false;
      return;
    }
    
    try {
      // Load booking data
      const bookingResponse = await fetch(`/api/bookings/${bookingId}`);
      if (!bookingResponse.ok) {
        throw new Error('Failed to load booking');
      }
      
      const bookingData = await bookingResponse.json();
      booking = bookingData.booking;
      
      // Determine user role
      if (booking.ownerUid === $authState.user?.uid) {
        userRole = 'owner';
      } else if (booking.renterUid === $authState.user?.uid) {
        userRole = 'renter';
      } else {
        throw new Error('Unauthorized access to booking');
      }
      
      // Load handoff status
      const statusResponse = await fetch(`/api/bookings/${bookingId}/confirm-handoff`);
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        handoffStatus = statusData.handoffStatus;
      }
      
    } catch (err) {
      console.error('Error loading booking:', err);
      error = err.message || 'Failed to load booking data';
    } finally {
      loading = false;
    }
  }
  
  function handleHandoffConfirmed(event: CustomEvent) {
    const { phase, userRole: confirmedRole, reportId } = event.detail;

    // Refresh data to get updated status
    loadBookingData();

    // Show success message
    const phaseLabel = phase === 'pickup' ? 'Pickup' : 'Return';
    alert(`${phaseLabel} condition report confirmed successfully!`);

    console.log('Condition report confirmed:', { phase, userRole: confirmedRole, reportId });
  }
  
  function getBookingStatusBadge(status: string) {
    const badges = {
      pending: { class: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', text: 'Pending' },
      confirmed: { class: 'bg-blue-500/20 text-blue-300 border-blue-500/30', text: 'Confirmed' },
      active: { class: 'bg-green-500/20 text-green-300 border-green-500/30', text: 'Active' },
      completed: { class: 'bg-gray-500/20 text-gray-300 border-gray-500/30', text: 'Completed' },
      cancelled: { class: 'bg-red-500/20 text-red-300 border-red-500/30', text: 'Cancelled' },
      disputed: { class: 'bg-orange-500/20 text-orange-300 border-orange-500/30', text: 'Disputed' }
    };
    return badges[status] || badges.pending;
  }
  
  function formatDate(timestamp: any): string {
    if (!timestamp) return '';
    
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString();
  }
  
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
</script>

<svelte:head>
  <title>Rental Management - GearGrab</title>
  <meta name="description" content="Manage your rental with photo documentation for insurance" />
</svelte:head>

<!-- Background -->
<VideoBackground
  videoSrc="/1877846-hd_1920_1080_30fps.mp4"
  imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
  overlayOpacity="{0.4}"
/>

<!-- Content -->
<div class="relative z-10 min-h-screen py-8">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    
    {#if loading}
      <div class="flex items-center justify-center min-h-96">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p class="text-white">Loading rental details...</p>
        </div>
      </div>
      
    {:else if error}
      <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
        <h2 class="text-xl font-bold text-red-300 mb-2">Error</h2>
        <p class="text-red-200">{error}</p>
        <button
          on:click={() => goto('/dashboard')}
          class="mt-4 bg-red-600/80 hover:bg-red-600/90 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
      
    {:else if booking && userRole}
      <!-- Booking Header -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold text-white mb-2">{booking.listingTitle}</h1>
            <p class="text-gray-300">
              {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
            </p>
          </div>
          <div class="text-right">
            {#if booking.status}
              {@const badge = getBookingStatusBadge(booking.status)}
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border {badge.class}">
                {badge.text}
              </span>
            {/if}
            <p class="text-gray-300 text-sm mt-1">
              You are the {userRole}
            </p>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span class="text-gray-400">Total Price:</span>
            <span class="text-white font-medium ml-2">{formatCurrency(booking.totalPrice)}</span>
          </div>
          <div>
            <span class="text-gray-400">Security Deposit:</span>
            <span class="text-white font-medium ml-2">{formatCurrency(booking.securityDeposit)}</span>
          </div>
          <div>
            <span class="text-gray-400">Delivery:</span>
            <span class="text-white font-medium ml-2 capitalize">{booking.deliveryMethod}</span>
          </div>
        </div>
      </div>

      <!-- Rental Process Steps -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
        <h2 class="text-lg font-semibold text-white mb-4">📋 Rental Process</h2>
        
        <div class="space-y-4">
          <!-- Step 1: Pre-Rental -->
          <div class="flex items-center space-x-4">
            <div class="flex-shrink-0">
              {#if handoffStatus?.preRental?.completed}
                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              {:else if canAccessPreRental}
                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span class="text-white font-bold">1</span>
                </div>
              {:else}
                <div class="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                  <span class="text-white font-bold">1</span>
                </div>
              {/if}
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-white">Pre-Rental Documentation</h3>
              <p class="text-sm text-gray-300">
                {#if handoffStatus?.preRental?.completed}
                  ✓ Both parties have documented the gear condition
                {:else if canAccessPreRental}
                  Document gear condition before handoff
                {:else}
                  Waiting for booking confirmation
                {/if}
              </p>
            </div>
          </div>

          <!-- Step 2: Rental Period -->
          <div class="flex items-center space-x-4">
            <div class="flex-shrink-0">
              {#if booking.status === 'completed'}
                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              {:else if booking.status === 'active'}
                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span class="text-white font-bold">2</span>
                </div>
              {:else}
                <div class="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                  <span class="text-white font-bold">2</span>
                </div>
              {/if}
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-white">Rental Period</h3>
              <p class="text-sm text-gray-300">
                {#if booking.status === 'completed'}
                  ✓ Rental completed successfully
                {:else if booking.status === 'active'}
                  Rental is currently active
                {:else}
                  Rental period will begin after pre-rental documentation
                {/if}
              </p>
            </div>
          </div>

          <!-- Step 3: Post-Rental -->
          <div class="flex items-center space-x-4">
            <div class="flex-shrink-0">
              {#if handoffStatus?.postRental?.completed}
                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              {:else if canAccessPostRental}
                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span class="text-white font-bold">3</span>
                </div>
              {:else}
                <div class="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                  <span class="text-white font-bold">3</span>
                </div>
              {/if}
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-white">Post-Rental Documentation</h3>
              <p class="text-sm text-gray-300">
                {#if handoffStatus?.postRental?.completed}
                  ✓ Return documentation completed
                {:else if canAccessPostRental}
                  Document gear condition upon return
                {:else}
                  Available after rental period begins
                {/if}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pickup Handoff -->
      {#if showPreRental}
        <div class="mb-8">
          <RentalHandoff
            {booking}
            phase="pickup"
            {userRole}
            on:confirmed="{handleHandoffConfirmed}"
            on:refresh="{loadBookingData}"
          />
        </div>
      {/if}

      <!-- Return Handoff -->
      {#if showPostRental}
        <div class="mb-8">
          <RentalHandoff
            {booking}
            phase="return"
            {userRole}
            on:confirmed="{handleHandoffConfirmed}"
            on:refresh="{loadBookingData}"
          />
        </div>
      {/if}

      <!-- Completed Documentation View -->
      {#if handoffStatus?.preRental?.completed && handoffStatus?.postRental?.completed}
        <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
          <h2 class="text-xl font-bold text-green-300 mb-2">✓ Rental Documentation Complete</h2>
          <p class="text-green-200 mb-4">
            All photo documentation has been completed for this rental.
          </p>
          <div class="space-x-4">
            <RentalHandoff
              {booking}
              phase="pickup"
              {userRole}
              readonly="{true}"
            />
            <RentalHandoff
              {booking}
              phase="return"
              {userRole}
              readonly="{true}"
            />
          </div>
        </div>
      {/if}

      <!-- Navigation -->
      <div class="flex justify-center mt-8">
        <button
          on:click={() => goto('/dashboard')}
          class="bg-gray-600/80 hover:bg-gray-600/90 text-white px-6 py-2 rounded-lg backdrop-blur-sm border border-gray-500/50 transition-all duration-200"
        >
          Return to Dashboard
        </button>
      </div>
    {/if}
  </div>
</div>
