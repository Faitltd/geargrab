<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { showToast } from '$lib/stores/toast.store';
  
  // State
  let listings: any[] = [];
  let loading = true;
  let error = '';
  let selectedTab = 'active';
  
  const tabs = [
    { id: 'active', label: 'Active', count: 0 },
    { id: 'draft', label: 'Drafts', count: 0 },
    { id: 'inactive', label: 'Inactive', count: 0 }
  ];
  
  onMount(async () => {
    await loadListings();
  });
  
  async function loadListings() {
    try {
      loading = true;
      
      // In a real app, this would filter by user's listings
      const response = await fetch('/api/listings');
      const data = await response.json();
      
      if (data.success) {
        listings = data.listings || [];
        updateTabCounts();
      } else {
        error = 'Failed to load listings';
      }
    } catch (err) {
      error = 'Network error loading listings';
      console.error('Error loading listings:', err);
    } finally {
      loading = false;
    }
  }
  
  function updateTabCounts() {
    tabs[0].count = listings.filter(l => l.status === 'active').length;
    tabs[1].count = listings.filter(l => l.status === 'draft').length;
    tabs[2].count = listings.filter(l => l.status === 'inactive').length;
  }
  
  function getFilteredListings() {
    return listings.filter(listing => {
      if (selectedTab === 'active') return listing.status === 'active';
      if (selectedTab === 'draft') return listing.status === 'draft';
      if (selectedTab === 'inactive') return listing.status === 'inactive';
      return true;
    });
  }
  
  async function deleteListing(listingId: string) {
    if (!confirm('Are you sure you want to delete this listing?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/listings?id=${listingId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        listings = listings.filter(l => l.id !== listingId);
        updateTabCounts();
        showToast('success', 'Listing deleted successfully');
      } else {
        showToast('error', data.message || 'Failed to delete listing');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      showToast('error', 'Network error. Please try again.');
    }
  }
  
  async function toggleListingStatus(listingId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
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
        const listingIndex = listings.findIndex(l => l.id === listingId);
        if (listingIndex !== -1) {
          listings[listingIndex].status = newStatus;
          listings = [...listings]; // Trigger reactivity
          updateTabCounts();
        }
        showToast('success', `Listing ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      } else {
        showToast('error', data.message || 'Failed to update listing');
      }
    } catch (error) {
      console.error('Error updating listing:', error);
      showToast('error', 'Network error. Please try again.');
    }
  }
  
  $: filteredListings = getFilteredListings();
</script>

<svelte:head>
  <title>My Listings - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">My Listings</h1>
        <p class="mt-2 text-gray-600">Manage your gear listings</p>
      </div>
      
      <button
        on:click={() => goto('/dashboard/listings/new')}
        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
        data-cy="create-listing-button"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Create Listing</span>
      </button>
    </div>
    
    <!-- Tabs -->
    <div class="bg-white rounded-lg shadow-sm border mb-8">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8 px-6" data-cy="listing-tabs">
          {#each tabs as tab}
            <button
              on:click={() => selectedTab = tab.id}
              class="py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap"
              class:border-blue-500={selectedTab === tab.id}
              class:text-blue-600={selectedTab === tab.id}
              class:border-transparent={selectedTab !== tab.id}
              class:text-gray-500={selectedTab !== tab.id}
              data-cy={`tab-${tab.id}`}
            >
              {tab.label}
              {#if tab.count > 0}
                <span class="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-900">
                  {tab.count}
                </span>
              {/if}
            </button>
          {/each}
        </nav>
      </div>
    </div>
    
    <!-- Content -->
    {#if loading}
      <div class="text-center py-12" data-cy="loading-state">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading listings...</p>
      </div>
    {:else if error}
      <div class="text-center py-12" data-cy="error-state">
        <div class="text-red-500 mb-4">
          <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Listings</h3>
        <p class="text-gray-600 mb-4">{error}</p>
        <button
          on:click={loadListings}
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    {:else if filteredListings.length === 0}
      <div class="text-center py-12" data-cy="empty-state">
        <div class="text-gray-400 mb-4">
          <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No {selectedTab} listings</h3>
        <p class="text-gray-600 mb-4">
          {#if selectedTab === 'active'}
            You don't have any active listings yet.
          {:else if selectedTab === 'draft'}
            You don't have any draft listings.
          {:else}
            You don't have any inactive listings.
          {/if}
        </p>
        {#if selectedTab === 'active'}
          <button
            on:click={() => goto('/dashboard/listings/new')}
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Create Your First Listing
          </button>
        {/if}
      </div>
    {:else}
      <!-- Listings Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-cy="listings-grid">
        {#each filteredListings as listing (listing.id)}
          <div class="bg-white rounded-lg shadow-sm border" data-cy="listing-card">
            <!-- Image placeholder -->
            <div class="aspect-w-16 aspect-h-12 bg-gray-200 rounded-t-lg">
              <div class="flex items-center justify-center">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            
            <!-- Content -->
            <div class="p-4">
              <div class="flex items-start justify-between mb-2">
                <h3 class="font-semibold text-gray-900" data-cy="listing-title">{listing.title}</h3>
                <span 
                  class="text-xs px-2 py-1 rounded-full"
                  class:bg-green-100={listing.status === 'active'}
                  class:text-green-800={listing.status === 'active'}
                  class:bg-yellow-100={listing.status === 'draft'}
                  class:text-yellow-800={listing.status === 'draft'}
                  class:bg-gray-100={listing.status === 'inactive'}
                  class:text-gray-800={listing.status === 'inactive'}
                  data-cy="listing-status"
                >
                  {listing.status}
                </span>
              </div>
              
              <p class="text-gray-600 text-sm mb-3 line-clamp-2">{listing.description}</p>
              
              <div class="flex items-center justify-between mb-4">
                <span class="text-lg font-bold text-green-600">${listing.price}/day</span>
                <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {listing.category}
                </span>
              </div>
              
              <!-- Actions -->
              <div class="flex items-center space-x-2">
                <button
                  on:click={() => goto(`/dashboard/listings/${listing.id}`)}
                  class="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  data-cy="view-listing-button"
                >
                  View
                </button>
                
                <button
                  on:click={() => goto(`/dashboard/listings/${listing.id}/edit`)}
                  class="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                  data-cy="edit-listing-button"
                >
                  Edit
                </button>
                
                <button
                  on:click={() => toggleListingStatus(listing.id, listing.status)}
                  class="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                  data-cy="toggle-status-button"
                >
                  {listing.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                
                <button
                  on:click={() => deleteListing(listing.id)}
                  class="px-3 py-2 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                  data-cy="delete-listing-button"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
