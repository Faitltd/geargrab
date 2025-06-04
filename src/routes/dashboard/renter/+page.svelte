<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { chatService } from '$lib/services/chat';
  import { authStore } from '$lib/stores/auth';
  import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
  import { firestore } from '$lib/firebase/client';

  let bookings = [];
  let loading = true;

  onMount(async () => {
    await loadUserBookings();
  });

  async function loadUserBookings() {
    try {
      if (!$authStore.user) return;

      loading = true;

      // Get user's bookings from Firestore
      const bookingsRef = collection(firestore, 'bookings');
      const q = query(
        bookingsRef,
        where('renterUid', '==', $authStore.user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      bookings = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.listingTitle || 'Gear Rental',
          status: data.status || 'pending',
          startDate: data.startDate ? new Date(data.startDate.toDate()).toLocaleDateString() : 'TBD',
          endDate: data.endDate ? new Date(data.endDate.toDate()).toLocaleDateString() : 'TBD',
          totalPrice: data.totalPrice || 0,
          image: data.listingImage || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          confirmationNumber: data.confirmationNumber || doc.id.slice(-6).toUpperCase(),
          owner: data.ownerEmail?.split('@')[0] || 'Owner',
          ownerId: data.ownerUid,
          listingId: data.listingId,
          deliveryMethod: data.deliveryMethod || 'pickup',
          createdAt: data.createdAt
        };
      });

    } catch (error) {
      console.error('Error loading user bookings:', error);
      bookings = [];
    } finally {
      loading = false;
    }
  }

  // Function to handle messaging the owner
  async function messageOwner(booking: any) {
    if (!$authStore.user) {
      alert('Please sign in to send messages');
      return;
    }

    try {
      // Create or find existing conversation
      const conversationId = await chatService.getOrCreateConversation(
        $authStore.user.uid,
        booking.ownerId,
        booking.id, // bookingId
        booking.listingId,
        booking.title
      );

      // Navigate to messages page with the conversation
      goto(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Unable to start conversation. Please try again.');
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'confirmed': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }
</script>

<svelte:head>
  <title>My Bookings - GearGrab</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">My Bookings</h1>
        <p class="text-gray-300 mt-1">Track your current and past rentals</p>
      </div>
      <div class="flex items-center space-x-4">
        <div class="text-right">
          <div class="text-2xl font-bold text-white">{bookings.length}</div>
          <div class="text-sm text-gray-300">Total Bookings</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-300 truncate">Active Rentals</dt>
            <dd class="text-lg font-medium text-white">{bookings.filter(b => b.status === 'active').length}</dd>
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
            <dt class="text-sm font-medium text-gray-300 truncate">Upcoming</dt>
            <dd class="text-lg font-medium text-white">{bookings.filter(b => b.status === 'confirmed').length}</dd>
          </dl>
        </div>
      </div>
    </div>

    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
            </svg>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-300 truncate">Total Spent</dt>
            <dd class="text-lg font-medium text-white">${bookings.reduce((sum, b) => sum + b.totalPrice, 0)}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>

  <!-- Bookings List -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
    <div class="px-6 py-4 border-b border-white/20">
      <h2 class="text-lg font-medium text-white">Your Bookings</h2>
    </div>
    <div class="p-6">
      {#if loading}
        <div class="flex justify-center items-center py-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
            <p class="text-white">Loading your bookings...</p>
          </div>
        </div>
      {:else if bookings.length === 0}
        <div class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-300">No bookings yet</h3>
          <p class="mt-1 text-sm text-gray-400">Get started by browsing available gear.</p>
          <div class="mt-6">
            <a href="/browse" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              Browse Gear
            </a>
          </div>
        </div>
      {:else}
        <div class="space-y-4">
          {#each bookings as booking}
            <div class="border border-white/20 rounded-lg p-6 hover:bg-white/5 transition-all bg-white/5">
              <div class="flex items-start space-x-4">
                <div class="flex-shrink-0 h-20 w-20 bg-gray-200 rounded-lg overflow-hidden">
                  <img src={booking.image} alt={booking.title} class="h-full w-full object-cover" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="text-lg font-medium text-white">{booking.title}</p>
                      <p class="text-sm text-gray-300 mt-1">Hosted by {booking.owner}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-lg font-bold text-green-400">${booking.totalPrice}</p>
                      <p class="text-sm text-gray-300">Total</p>
                    </div>
                  </div>

                  <div class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p class="text-gray-400">Dates</p>
                      <p class="text-white">{booking.startDate} to {booking.endDate}</p>
                    </div>
                    <div>
                      <p class="text-gray-400">Confirmation</p>
                      <p class="text-white font-mono">{booking.confirmationNumber}</p>
                    </div>
                    <div>
                      <p class="text-gray-400">Delivery</p>
                      <p class="text-white">{booking.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}</p>
                    </div>
                  </div>

                  <div class="mt-4 flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium {getStatusColor(booking.status)} text-white">
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                      {#if booking.status === 'pending'}
                        <span class="text-xs text-yellow-300">Awaiting owner approval</span>
                      {:else if booking.status === 'confirmed'}
                        <span class="text-xs text-green-300">Ready for pickup</span>
                      {/if}
                    </div>
                    <div class="flex space-x-2">
                      <button
                        class="text-blue-400 hover:text-blue-300 text-sm font-medium inline-flex items-center space-x-1 bg-blue-500/20 hover:bg-blue-500/30 px-3 py-1 rounded-lg transition-all"
                        on:click={() => goto(`/listing/${booking.listingId}`)}
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        <span>View Details</span>
                      </button>
                      <button
                        class="text-green-400 hover:text-green-300 text-sm font-medium inline-flex items-center space-x-1 bg-green-500/20 hover:bg-green-500/30 px-3 py-1 rounded-lg transition-all"
                        on:click={() => messageOwner(booking)}
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <span>Message Owner</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
