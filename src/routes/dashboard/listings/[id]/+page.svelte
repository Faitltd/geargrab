<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { showToast } from '$lib/stores/toast.store';
  
  // State
  let listing: any = null;
  let loading = true;
  let error = '';
  let bookings: any[] = [];
  let stats = {
    totalViews: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0
  };
  
  $: listingId = $page.params.id;
  
  onMount(async () => {
    await loadListing();
    await loadBookings();
    await loadStats();
  });
  
  async function loadListing() {
    try {
      loading = true;
      
      // Mock listing data since we don't have individual listing endpoint yet
      listing = {
        id: listingId,
        title: 'Professional Camera Kit',
        description: 'High-quality DSLR camera with multiple lenses, perfect for photography enthusiasts and professionals.',
        category: 'photography',
        price: 45,
        location: 'San Francisco, CA',
        condition: 'excellent',
        brand: 'Canon',
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z',
        ownerId: 'mock-user-id',
        images: []
      };
      
    } catch (err) {
      error = 'Failed to load listing';
      console.error('Error loading listing:', err);
    } finally {
      loading = false;
    }
  }
  
  async function loadBookings() {
    // Mock bookings data
    bookings = [
      {
        id: 'booking-1',
        renterName: 'John Doe',
        startDate: '2024-02-01',
        endDate: '2024-02-03',
        status: 'confirmed',
        totalAmount: 90
      },
      {
        id: 'booking-2',
        renterName: 'Jane Smith',
        startDate: '2024-02-10',
        endDate: '2024-02-12',
        status: 'pending',
        totalAmount: 90
      }
    ];
  }
  
  async function loadStats() {
    // Mock stats data
    stats = {
      totalViews: 156,
      totalBookings: 8,
      totalRevenue: 720,
      averageRating: 4.8
    };
  }
  
  async function deleteListing() {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/listings?id=${listingId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('success', 'Listing deleted successfully');
        goto('/dashboard/listings');
      } else {
        showToast('error', data.message || 'Failed to delete listing');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      showToast('error', 'Network error. Please try again.');
    }
  }
  
  async function toggleStatus() {
    const newStatus = listing.status === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch(`/api/listings?id=${listingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
        listing.status = newStatus;
        showToast('success', `Listing ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      } else {
        showToast('error', data.message || 'Failed to update listing');
      }
    } catch (error) {
      console.error('Error updating listing:', error);
      showToast('error', 'Network error. Please try again.');
    }
  }
  
  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  function getBookingStatusColor(status: string) {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<svelte:head>
  <title>{listing?.title || 'Listing'} - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if loading}
      <div class="text-center py-12" data-cy="loading-state">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading listing...</p>
      </div>
    {:else if error}
      <div class="text-center py-12" data-cy="error-state">
        <div class="text-red-500 mb-4">
          <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Listing</h3>
        <p class="text-gray-600 mb-4">{error}</p>
        <button
          on:click={() => goto('/dashboard/listings')}
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Back to Listings
        </button>
      </div>
    {:else if listing}
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center space-x-4">
          <button
            on:click={() => goto('/dashboard/listings')}
            class="p-2 text-gray-400 hover:text-gray-600"
            data-cy="back-button"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div>
            <h1 class="text-3xl font-bold text-gray-900" data-cy="listing-title">{listing.title}</h1>
            <div class="flex items-center space-x-4 mt-2">
              <span class={`text-xs px-2 py-1 rounded-full ${getStatusColor(listing.status)}`} data-cy="listing-status">
                {listing.status}
              </span>
              <span class="text-sm text-gray-500">ID: {listing.id}</span>
            </div>
          </div>
        </div>
        
        <div class="flex items-center space-x-3">
          <button
            on:click={() => goto(`/dashboard/listings/${listingId}/edit`)}
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            data-cy="edit-button"
          >
            Edit
          </button>
          
          <button
            on:click={toggleStatus}
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            data-cy="toggle-status-button"
          >
            {listing.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          
          <button
            on:click={deleteListing}
            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            data-cy="delete-button"
          >
            Delete
          </button>
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Listing Details -->
          <div class="bg-white rounded-lg shadow-sm border p-6" data-cy="listing-details">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Listing Details</h2>
            
            <!-- Image placeholder -->
            <div class="aspect-w-16 aspect-h-12 bg-gray-200 rounded-lg mb-6">
              <div class="flex items-center justify-center">
                <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700">Category</label>
                <p class="mt-1 text-sm text-gray-900" data-cy="listing-category">{listing.category}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">Daily Rate</label>
                <p class="mt-1 text-sm text-gray-900" data-cy="listing-price">${listing.price}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">Condition</label>
                <p class="mt-1 text-sm text-gray-900" data-cy="listing-condition">{listing.condition}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">Brand</label>
                <p class="mt-1 text-sm text-gray-900" data-cy="listing-brand">{listing.brand || 'Not specified'}</p>
              </div>
              
              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700">Location</label>
                <p class="mt-1 text-sm text-gray-900" data-cy="listing-location">{listing.location}</p>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <p class="text-sm text-gray-900" data-cy="listing-description">{listing.description}</p>
            </div>
          </div>
          
          <!-- Recent Bookings -->
          <div class="bg-white rounded-lg shadow-sm border p-6" data-cy="recent-bookings">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h2>
            
            {#if bookings.length === 0}
              <p class="text-gray-500 text-center py-8">No bookings yet</p>
            {:else}
              <div class="space-y-4">
                {#each bookings as booking (booking.id)}
                  <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg" data-cy="booking-item">
                    <div>
                      <p class="font-medium text-gray-900" data-cy="booking-renter">{booking.renterName}</p>
                      <p class="text-sm text-gray-500" data-cy="booking-dates">
                        {booking.startDate} - {booking.endDate}
                      </p>
                    </div>
                    
                    <div class="text-right">
                      <span class={`text-xs px-2 py-1 rounded-full ${getBookingStatusColor(booking.status)}`} data-cy="booking-status">
                        {booking.status}
                      </span>
                      <p class="text-sm font-medium text-gray-900 mt-1" data-cy="booking-amount">
                        ${booking.totalAmount}
                      </p>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
        
        <!-- Sidebar -->
        <div class="space-y-8">
          <!-- Stats -->
          <div class="bg-white rounded-lg shadow-sm border p-6" data-cy="listing-stats">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Performance</h2>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Total Views</span>
                <span class="font-medium" data-cy="stat-views">{stats.totalViews}</span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Total Bookings</span>
                <span class="font-medium" data-cy="stat-bookings">{stats.totalBookings}</span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Total Revenue</span>
                <span class="font-medium text-green-600" data-cy="stat-revenue">${stats.totalRevenue}</span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Average Rating</span>
                <span class="font-medium" data-cy="stat-rating">{stats.averageRating}/5</span>
              </div>
            </div>
          </div>
          
          <!-- Quick Actions -->
          <div class="bg-white rounded-lg shadow-sm border p-6" data-cy="quick-actions">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            
            <div class="space-y-3">
              <button
                on:click={() => goto(`/listings/${listingId}`)}
                class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg border"
                data-cy="view-public-button"
              >
                View Public Page
              </button>
              
              <button
                class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg border"
                data-cy="share-listing-button"
              >
                Share Listing
              </button>
              
              <button
                class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg border"
                data-cy="duplicate-listing-button"
              >
                Duplicate Listing
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
