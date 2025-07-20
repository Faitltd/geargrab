<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import type { ListingData } from '$lib/types';
  
  // State
  let listings: ListingData[] = [];
  let loading = true;
  let error = '';
  let hasMore = false;
  let total = 0;
  
  // Filters
  let selectedCategory = 'all';
  let searchQuery = '';
  let sortBy = 'newest';
  let priceMin = '';
  let priceMax = '';
  
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'camping', label: 'Camping & Hiking' },
    { value: 'sports', label: 'Sports & Recreation' },
    { value: 'photography', label: 'Photography & Video' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'tools', label: 'Tools & Equipment' }
  ];
  
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
  ];
  
  onMount(async () => {
    if (browser) {
      const urlParams = new URLSearchParams(window.location.search);
      selectedCategory = urlParams.get('category') || 'all';
      searchQuery = urlParams.get('search') || '';
      sortBy = urlParams.get('sort') || 'newest';
      
      await loadListings();
    }
  });
  
  async function loadListings() {
    try {
      loading = true;
      error = '';
      
      const params = new URLSearchParams();
      
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }
      if (sortBy) {
        params.set('sortBy', sortBy);
      }
      if (priceMin) {
        params.set('priceMin', priceMin);
      }
      if (priceMax) {
        params.set('priceMax', priceMax);
      }
      
      params.set('limit', '12');
      
      const response = await fetch(`/api/listings?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        listings = data.listings || [];
        total = data.total || 0;
        hasMore = data.hasMore || false;
      } else {
        error = data.error?.message || 'Failed to load listings';
      }
    } catch (err) {
      error = 'Network error loading listings';
      console.error('Error loading listings:', err);
    } finally {
      loading = false;
    }
  }
  
  function handleSearch() {
    loadListings();
    updateURL();
  }
  
  function handleFilterChange() {
    loadListings();
    updateURL();
  }
  
  function clearFilters() {
    selectedCategory = 'all';
    searchQuery = '';
    sortBy = 'newest';
    priceMin = '';
    priceMax = '';
    loadListings();
    updateURL();
  }
  
  function updateURL() {
    if (!browser) return;
    
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    
    const newUrl = `/listings/browse${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }
  
  function viewListing(listing: ListingData) {
    goto(`/listings/${listing.id}`);
  }
  
  function formatPrice(listing: ListingData): string {
    if (listing.pricing?.rentalPrice?.daily) {
      return `$${listing.pricing.rentalPrice.daily}/day`;
    }
    if (listing.pricing?.salePrice) {
      return `$${listing.pricing.salePrice}`;
    }
    return 'Price on request';
  }
</script>

<svelte:head>
  <title>Browse Gear - GearGrab</title>
  <meta name="description" content="Browse and rent outdoor gear from trusted locals. Find camping, sports, photography equipment and more." />
</svelte:head>

<Header />

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <div class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Browse Gear</h1>
          <p class="mt-2 text-gray-600">
            {total > 0 ? `${total} items available` : 'Discover amazing gear from your community'}
          </p>
        </div>
        
        <!-- Search Bar -->
        <div class="mt-4 lg:mt-0 lg:ml-6">
          <div class="flex">
            <input
              type="text"
              bind:value={searchQuery}
              placeholder="Search for gear..."
              class="block w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              on:keydown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              on:click={handleSearch}
              class="px-6 py-2 bg-primary-500 text-white rounded-r-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="bg-white border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Category Filter -->
        <div>
          <select
            bind:value={selectedCategory}
            on:change={handleFilterChange}
            class="block px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {#each categories as category}
              <option value={category.value}>{category.label}</option>
            {/each}
          </select>
        </div>

        <!-- Sort Filter -->
        <div>
          <select
            bind:value={sortBy}
            on:change={handleFilterChange}
            class="block px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {#each sortOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>

        <!-- Price Range -->
        <div class="flex items-center gap-2">
          <input
            type="number"
            bind:value={priceMin}
            placeholder="Min $"
            class="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            on:change={handleFilterChange}
          />
          <span class="text-gray-500">-</span>
          <input
            type="number"
            bind:value={priceMax}
            placeholder="Max $"
            class="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            on:change={handleFilterChange}
          />
        </div>

        <!-- Clear Filters -->
        <button
          on:click={clearFilters}
          class="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Clear Filters
        </button>
      </div>
    </div>
  </div>

  <!-- Content -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if loading}
      <div class="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    {:else if error}
      <ErrorBanner message={error} />
    {:else if listings.length === 0}
      <div class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No gear found</h3>
        <p class="text-gray-600 mb-4">Try adjusting your search or filters to find what you're looking for.</p>
        <button
          on:click={clearFilters}
          class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          Clear Filters
        </button>
      </div>
    {:else}
      <!-- Listings Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {#each listings as listing}
          <div
            class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            on:click={() => viewListing(listing)}
            on:keydown={(e) => e.key === 'Enter' && viewListing(listing)}
            role="button"
            tabindex="0"
          >
            <!-- Image -->
            <div class="aspect-video bg-gray-200 overflow-hidden">
              {#if listing.images && listing.images.length > 0}
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  class="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
              {:else}
                <div class="w-full h-full flex items-center justify-center bg-gray-200">
                  <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              {/if}
            </div>

            <!-- Content -->
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 mb-1 line-clamp-2">{listing.title}</h3>
              <p class="text-sm text-gray-600 mb-2 line-clamp-2">{listing.description}</p>
              
              <div class="flex items-center justify-between">
                <span class="text-lg font-bold text-primary-600">
                  {formatPrice(listing)}
                </span>
                
                {#if listing.location?.address?.city}
                  <span class="text-sm text-gray-500">
                    {listing.location.address.city}
                  </span>
                {/if}
              </div>
              
              {#if listing.tags && listing.tags.length > 0}
                <div class="mt-2 flex flex-wrap gap-1">
                  {#each listing.tags.slice(0, 3) as tag}
                    <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {tag}
                    </span>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<Footer />

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-clamp: 2;
  }
</style>
