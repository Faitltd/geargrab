<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$stores/auth';
  import { getUserBookings } from '$firebase/db/bookings';
  import { getListings } from '$firebase/db/listings';
  import { formatCurrency } from '$utils/formatting';
  import { formatDate } from '$utils/dates';
  import { timestampToDate } from '$utils/dates';
  
  // Dashboard data
  let loading = true;
  let activeBookings: any[] = [];
  let activeListings: any[] = [];
  let recentActivity: any[] = [];
  
  // Load dashboard data
  onMount(async () => {
    if (!$authStore.isLoggedIn) return;
    
    try {
      // Get active bookings (as renter)
      const { bookings: renterBookings } = await getUserBookings(
        $authStore.authUser!.uid,
        'renter',
        ['pending', 'confirmed', 'active']
      );
      
      // Get active listings
      const { listings } = await getListings({
        ownerUid: $authStore.authUser!.uid,
        status: 'active'
      });
      
      // Get bookings for owner's listings
      const { bookings: ownerBookings } = await getUserBookings(
        $authStore.authUser!.uid,
        'owner',
        ['pending', 'confirmed', 'active']
      );
      
      // Set data
      activeBookings = renterBookings;
      activeListings = listings;
      
      // Combine recent activity
      const activity = [
        ...renterBookings.map(booking => ({
          type: 'booking',
          role: 'renter',
          item: booking,
          date: booking.createdAt
        })),
        ...ownerBookings.map(booking => ({
          type: 'booking',
          role: 'owner',
          item: booking,
          date: booking.createdAt
        }))
      ];
      
      // Sort by date (newest first) and limit to 5
      recentActivity = activity
        .sort((a, b) => b.date.seconds - a.date.seconds)
        .slice(0, 5);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      loading = false;
    }
  });
  
  // Navigate to listing
  function goToListing(listingId: string) {
    goto(`/listing/${listingId}`);
  }
  
  // Navigate to booking
  function goToBooking(bookingId: string) {
    goto(`/booking/${bookingId}`);
  }
  
  // Navigate to create listing
  function goToCreateListing() {
    goto('/list-gear');
  }
</script>

<div class="space-y-6">
  {#if loading}
    <div class="flex justify-center items-center h-64">
      <svg class="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  {:else}
    <!-- Dashboard Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Active Bookings Card -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-medium">Active Bookings</h2>
        </div>
        <div class="card-body">
          <div class="text-3xl font-bold text-green-600">{activeBookings.length}</div>
          <p class="text-gray-500">Gear you're currently renting</p>
        </div>
        <div class="card-footer">
          <a href="/dashboard/renter" class="text-green-600 hover:text-green-700 font-medium">View all bookings</a>
        </div>
      </div>
      
      <!-- Active Listings Card -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-medium">Active Listings</h2>
        </div>
        <div class="card-body">
          <div class="text-3xl font-bold text-green-600">{activeListings.length}</div>
          <p class="text-gray-500">Gear you're currently renting out</p>
        </div>
        <div class="card-footer">
          <a href="/dashboard/owner" class="text-green-600 hover:text-green-700 font-medium">View all listings</a>
        </div>
      </div>
      
      <!-- Verification Status Card -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-medium">Verification Status</h2>
        </div>
        <div class="card-body">
          {#if $authStore.firestoreUser?.isVerified}
            <div class="flex items-center text-green-600">
              <svg class="h-6 w-6 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span class="font-medium">Verified</span>
            </div>
            <p class="text-gray-500 mt-2">Your account is fully verified</p>
          {:else}
            <div class="flex items-center text-yellow-600">
              <svg class="h-6 w-6 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span class="font-medium">Not Verified</span>
            </div>
            <p class="text-gray-500 mt-2">Complete verification to unlock all features</p>
          {/if}
        </div>
        <div class="card-footer">
          {#if !$authStore.firestoreUser?.isVerified}
            <a href="/verify" class="text-green-600 hover:text-green-700 font-medium">Complete verification</a>
          {:else}
            <span class="text-gray-500">All set!</span>
          {/if}
        </div>
      </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-medium">Recent Activity</h2>
      </div>
      <div class="card-body p-0">
        {#if recentActivity.length === 0}
          <div class="p-6 text-center text-gray-500">
            <p>No recent activity</p>
          </div>
        {:else}
          <ul class="divide-y divide-gray-200">
            {#each recentActivity as activity}
              <li class="p-4 hover:bg-gray-50 cursor-pointer" on:click={() => {
                if (activity.type === 'booking') {
                  goToBooking(activity.item.id);
                } else if (activity.type === 'listing') {
                  goToListing(activity.item.id);
                }
              }}>
                <div class="flex items-center justify-between">
                  <div>
                    {#if activity.type === 'booking'}
                      <p class="font-medium">
                        {#if activity.role === 'renter'}
                          You booked: {activity.item.listingTitle}
                        {:else}
                          New booking: {activity.item.listingTitle}
                        {/if}
                      </p>
                      <p class="text-sm text-gray-500">
                        {formatDate(timestampToDate(activity.item.startDate))} - {formatDate(timestampToDate(activity.item.endDate))}
                      </p>
                    {/if}
                  </div>
                  <div class="text-sm text-gray-500">
                    {formatDate(timestampToDate(activity.date))}
                  </div>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
    
    <!-- Quick Actions -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-medium">Quick Actions</h2>
      </div>
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            class="btn btn-primary"
            on:click={goToCreateListing}
          >
            List New Gear
          </button>
          <a href="/browse" class="btn btn-secondary text-center">
            Browse Gear
          </a>
          <a href="/messages" class="btn btn-secondary text-center">
            View Messages
          </a>
        </div>
      </div>
    </div>
    
    <!-- Recent Bookings -->
    {#if activeBookings.length > 0}
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-medium">Your Active Bookings</h2>
        </div>
        <div class="card-body p-0">
          <ul class="divide-y divide-gray-200">
            {#each activeBookings.slice(0, 3) as booking}
              <li class="p-4 hover:bg-gray-50 cursor-pointer" on:click={() => goToBooking(booking.id)}>
                <div class="flex items-center space-x-4">
                  <div class="flex-shrink-0 h-16 w-16 bg-gray-200 rounded-md overflow-hidden">
                    <img src={booking.listingImage} alt={booking.listingTitle} class="h-full w-full object-cover" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium truncate">{booking.listingTitle}</p>
                    <p class="text-sm text-gray-500">
                      {formatDate(timestampToDate(booking.startDate))} - {formatDate(timestampToDate(booking.endDate))}
                    </p>
                    <div class="mt-1">
                      <span class="badge {
                        booking.status === 'pending' ? 'badge-yellow' : 
                        booking.status === 'confirmed' ? 'badge-blue' : 
                        booking.status === 'active' ? 'badge-green' : 'badge-gray'
                      }">
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div class="flex-shrink-0 text-right">
                    <p class="font-bold text-green-600">{formatCurrency(booking.totalPrice)}</p>
                    <p class="text-sm text-gray-500">Total</p>
                  </div>
                </div>
              </li>
            {/each}
          </ul>
        </div>
        {#if activeBookings.length > 3}
          <div class="card-footer">
            <a href="/dashboard/renter" class="text-green-600 hover:text-green-700 font-medium">View all bookings</a>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- Recent Listings -->
    {#if activeListings.length > 0}
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-medium">Your Active Listings</h2>
        </div>
        <div class="card-body p-0">
          <ul class="divide-y divide-gray-200">
            {#each activeListings.slice(0, 3) as listing}
              <li class="p-4 hover:bg-gray-50 cursor-pointer" on:click={() => goToListing(listing.id)}>
                <div class="flex items-center space-x-4">
                  <div class="flex-shrink-0 h-16 w-16 bg-gray-200 rounded-md overflow-hidden">
                    <img src={listing.images[0]} alt={listing.title} class="h-full w-full object-cover" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium truncate">{listing.title}</p>
                    <p class="text-sm text-gray-500">
                      {listing.category} • {listing.condition}
                    </p>
                    <div class="mt-1">
                      <span class="badge badge-green">Active</span>
                    </div>
                  </div>
                  <div class="flex-shrink-0 text-right">
                    <p class="font-bold text-green-600">{formatCurrency(listing.dailyPrice)}/day</p>
                  </div>
                </div>
              </li>
            {/each}
          </ul>
        </div>
        {#if activeListings.length > 3}
          <div class="card-footer">
            <a href="/dashboard/owner" class="text-green-600 hover:text-green-700 font-medium">View all listings</a>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>
