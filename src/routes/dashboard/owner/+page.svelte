<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { getUserListings, updateListingStatus, deleteListing } from '$lib/services/listings.service';
  import { getUserReviewStats } from '$lib/services/reviews.service';
  import OwnerListingCard from '$lib/components/dashboard/OwnerListingCard.svelte';
  import DashboardLayout from '$lib/components/dashboard/DashboardLayout.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { showToast } from '$lib/stores/toast.store';
  import type { ListingData, ReviewStats, ListingStatus } from '$lib/types';

  // State
  let listings: ListingData[] = [];
  let reviewStats: ReviewStats | null = null;
  let isLoading = true;
  let error = '';
  let isDeleting = false;

  // Filters
  let statusFilter: 'all' | 'active' | 'inactive' | 'sold' | 'rented' = 'all';
  let typeFilter: 'all' | 'sale' | 'rent' = 'all';
  let sortBy: 'newest' | 'oldest' | 'title' | 'price' = 'newest';

  // Reactive statements
  $: user = $authStore.data;
  $: isAuthenticated = !!user;

  onMount(async () => {
    // Check authentication
    if (!isAuthenticated) {
      showToast('error', 'Please sign in to access your dashboard');
      goto('/auth/signin');
      return;
    }

    await loadOwnerData();
  });

  const loadOwnerData = async () => {
    if (!user) return;

    isLoading = true;
    error = '';

    try {
      // Load user's listings
      listings = await getUserListings(user.uid);

      // Load user's review stats
      reviewStats = await getUserReviewStats(user.uid);

    } catch (err: any) {
      console.error('Error loading owner data:', err);
      error = err.message || 'Failed to load dashboard data';
    } finally {
      isLoading = false;
    }
  };

  const handleEditListing = (event: CustomEvent) => {
    const { listingId } = event.detail;
    goto(`/listings/edit/${listingId}`);
  };

  const handleDeleteListing = async (event: CustomEvent) => {
    const { listingId, listingTitle } = event.detail;

    if (!confirm(`Are you sure you want to delete "${listingTitle}"? This action cannot be undone.`)) {
      return;
    }

    isDeleting = true;

    try {
      await deleteListing(listingId);
      
      // Remove from local state
      listings = listings.filter(listing => listing.id !== listingId);
      
      showToast('success', 'Listing deleted successfully');
    } catch (error: any) {
      console.error('Error deleting listing:', error);
      showToast('error', error.message || 'Failed to delete listing');
    } finally {
      isDeleting = false;
    }
  };

  const handleViewListing = (event: CustomEvent) => {
    const { listingId } = event.detail;
    goto(`/gear/${listingId}`);
  };

  const handleDuplicateListing = (event: CustomEvent) => {
    const { listingId } = event.detail;
    goto(`/listings/new?duplicate=${listingId}`);
  };

  const handleStatusChange = async (listingId: string, status: ListingStatus) => {
    try {
      await updateListingStatus(listingId, status);

      // Update local state
      listings = listings.map(listing =>
        listing.id === listingId
          ? { ...listing, status }
          : listing
      );

      showToast('success', `Listing ${status === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Error updating listing status:', error);
      showToast('error', error.message || 'Failed to update listing status');
    }
  };

  const createNewListing = () => {
    goto('/listings/new');
  };

  // Computed values
  $: filteredListings = listings.filter(listing => {
    // Status filter
    if (statusFilter !== 'all' && listing.status !== statusFilter) {
      return false;
    }

    // Type filter
    if (typeFilter !== 'all' && listing.listingType !== typeFilter) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt?.toDate?.() || b.createdAt).getTime() - 
               new Date(a.createdAt?.toDate?.() || a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt?.toDate?.() || a.createdAt).getTime() - 
               new Date(b.createdAt?.toDate?.() || b.createdAt).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'price':
        const aPrice = parseFloat(a.price || a.rentalPrice || '0');
        const bPrice = parseFloat(b.price || b.rentalPrice || '0');
        return bPrice - aPrice;
      default:
        return 0;
    }
  });

  $: activeListings = listings.filter(l => l.status === 'active').length;
  $: inactiveListings = listings.filter(l => l.status === 'inactive').length;
  $: soldListings = listings.filter(l => l.status === 'sold').length;
  $: rentedListings = listings.filter(l => l.status === 'rented').length;
  $: totalViews = listings.reduce((sum, listing) => sum + (listing.views || 0), 0);
  $: averageRating = reviewStats?.averageRating || 0;
  $: totalReviews = reviewStats?.totalReviews || 0;
</script>

<svelte:head>
  <title>Owner Dashboard - GearGrab</title>
  <meta name="description" content="Manage your gear listings and track performance" />
</svelte:head>

<DashboardLayout
  title="My Listings"
  description="Manage your gear listings and track performance"
>
  <div slot="header-actions">
    <button
      on:click={createNewListing}
      class="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      <span>New Listing</span>
    </button>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Content starts here -->

    {#if isLoading}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" color="primary" text="Loading your dashboard..." />
      </div>
      
    {:else if error}
      <!-- Error State -->
      <div class="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h2 class="text-xl font-semibold text-red-900 mb-2">Error Loading Dashboard</h2>
        <p class="text-red-700 mb-4">{error}</p>
        <button
          on:click={loadOwnerData}
          class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
      
    {:else}
      <!-- Dashboard Content -->
      <div class="space-y-8">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Active Listings -->
          <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-green-100">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-neutral-600">Active Listings</p>
                <p class="text-2xl font-bold text-neutral-900">{activeListings}</p>
              </div>
            </div>
          </div>

          <!-- Total Views -->
          <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-blue-100">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-neutral-600">Total Views</p>
                <p class="text-2xl font-bold text-neutral-900">{totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <!-- Average Rating -->
          <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-yellow-100">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-neutral-600">Average Rating</p>
                <p class="text-2xl font-bold text-neutral-900">
                  {averageRating > 0 ? averageRating.toFixed(1) : '—'}
                  {#if totalReviews > 0}
                    <span class="text-sm text-neutral-500 font-normal">({totalReviews})</span>
                  {/if}
                </p>
              </div>
            </div>
          </div>

          <!-- Completed Sales -->
          <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-purple-100">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-neutral-600">Completed</p>
                <p class="text-2xl font-bold text-neutral-900">{soldListings + rentedListings}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters and Controls -->
        <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div class="flex flex-wrap items-center gap-4">
              <!-- Status Filter -->
              <div>
                <label for="status-filter" class="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                <select
                  id="status-filter"
                  bind:value={statusFilter}
                  class="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                </select>
              </div>

              <!-- Type Filter -->
              <div>
                <label for="type-filter" class="block text-sm font-medium text-neutral-700 mb-1">Type</label>
                <select
                  id="type-filter"
                  bind:value={typeFilter}
                  class="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>

              <!-- Sort By -->
              <div>
                <label for="sort-filter" class="block text-sm font-medium text-neutral-700 mb-1">Sort By</label>
                <select
                  id="sort-filter"
                  bind:value={sortBy}
                  class="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title A-Z</option>
                  <option value="price">Price High-Low</option>
                </select>
              </div>
            </div>

            <div class="text-sm text-neutral-600">
              Showing {filteredListings.length} of {listings.length} listings
            </div>
          </div>
        </div>

        <!-- Listings Grid -->
        {#if filteredListings.length === 0}
          <!-- Empty State -->
          <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
            <svg class="w-16 h-16 text-neutral-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 class="text-xl font-semibold text-neutral-900 mb-2">
              {listings.length === 0 ? 'No listings yet' : 'No listings match your filters'}
            </h3>
            <p class="text-neutral-600 mb-6">
              {listings.length === 0 
                ? 'Start by creating your first gear listing to reach potential buyers and renters.'
                : 'Try adjusting your filters to see more listings.'
              }
            </p>
            {#if listings.length === 0}
              <button
                on:click={createNewListing}
                class="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Create Your First Listing
              </button>
            {/if}
          </div>
        {:else}
          <!-- Listings Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each filteredListings as listing (listing.id)}
              <OwnerListingCard
                {listing}
                disabled={isDeleting}
                on:edit={handleEditListing}
                on:delete={handleDeleteListing}
                on:view={handleViewListing}
                on:duplicate={handleDuplicateListing}
                on:statusChange={(e) => handleStatusChange(listing.id, e.detail.status)}
              />
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</DashboardLayout>
