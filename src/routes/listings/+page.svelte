<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import GearCard from '$lib/components/gear/GearCard.svelte';
  import FilterBar from '$lib/components/gear/FilterBar.svelte';
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
  let priceRange = { min: 0, max: 1000 };
  let currentPage = 1;
  const itemsPerPage = 12;

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'camping', label: 'Camping & Hiking' },
    { value: 'sports', label: 'Sports & Recreation' },
    { value: 'photography', label: 'Photography & Video' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'tools', label: 'Tools & Equipment' },
    { value: 'automotive', label: 'Automotive' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' }
  ];

  // Initialize from URL params
  onMount(async () => {
    const urlParams = new URLSearchParams($page.url.search);
    selectedCategory = urlParams.get('category') || 'all';
    searchQuery = urlParams.get('search') || '';
    sortBy = urlParams.get('sort') || 'newest';

    await loadListings();
  });

  async function loadListings(append = false) {
    try {
      if (!append) {
        loading = true;
        error = '';
      }

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
      if (priceRange.min > 0) {
        params.set('priceMin', priceRange.min.toString());
      }
      if (priceRange.max < 1000) {
        params.set('priceMax', priceRange.max.toString());
      }

      params.set('limit', itemsPerPage.toString());
      params.set('page', currentPage.toString());

      const response = await fetch(`/api/listings?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        listings = data.listings || [];
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
  
  // Reactive updates
  $: if (selectedCategory || searchQuery) {
    loadListings();
  }
  
  function handleSearch() {
    loadListings();
  }
  
  function handleCategoryChange() {
    loadListings();
  }
  
  function handleSortChange() {
    // Sort listings locally
    if (sortBy === 'newest') {
      listings = [...listings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      listings = [...listings].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'price-low') {
      listings = [...listings].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      listings = [...listings].sort((a, b) => b.price - a.price);
    }
  }
  
  function filterByPriceRange() {
    loadListings();
  }
</script>

<svelte:head>
  <title>Browse Listings - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Browse Listings</h1>
      <p class="mt-2 text-gray-600">Find the perfect gear for your next adventure</p>
    </div>
    
    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-8" data-cy="filters-section">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <label for="search" class="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            id="search"
            type="text"
            bind:value={searchQuery}
            on:input={handleSearch}
            placeholder="Search listings..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-cy="search-input"
          />
        </div>
        
        <!-- Category Filter -->
        <div>
          <label for="category" class="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            id="category"
            bind:value={selectedCategory}
            on:change={handleCategoryChange}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-cy="category-filter"
          >
            {#each categories as category}
              <option value={category.value}>{category.label}</option>
            {/each}
          </select>
        </div>
        
        <!-- Sort -->
        <div>
          <label for="sort" class="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <select
            id="sort"
            bind:value={sortBy}
            on:change={handleSortChange}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-cy="sort-select"
          >
            {#each sortOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
        
        <!-- Price Range -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
          <div class="flex items-center space-x-2">
            <input
              type="number"
              bind:value={priceRange.min}
              placeholder="Min"
              class="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              data-cy="price-min"
            />
            <span class="text-gray-500">-</span>
            <input
              type="number"
              bind:value={priceRange.max}
              placeholder="Max"
              class="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              data-cy="price-max"
            />
            <button
              on:click={filterByPriceRange}
              class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              data-cy="price-filter-apply"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    {#if loading}
      <div class="text-center py-12" data-cy="loading-state">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading listings...</p>
      </div>
    {:else if error}
      <!-- Error State -->
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
    {:else if listings.length === 0}
      <!-- Empty State -->
      <div class="text-center py-12" data-cy="empty-state">
        <div class="text-gray-400 mb-4">
          <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No Listings Found</h3>
        <p class="text-gray-600">Try adjusting your search criteria or check back later.</p>
      </div>
    {:else}
      <!-- Listings Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-cy="listings-grid">
        {#each listings as listing (listing.id)}
          <div class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow" data-cy="listing-card">
            <!-- Image placeholder -->
            <div class="aspect-w-16 aspect-h-12 bg-gray-200 rounded-t-lg">
              <div class="flex items-center justify-center">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            
            <!-- Content -->
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 mb-2" data-cy="listing-title">{listing.title}</h3>
              <p class="text-gray-600 text-sm mb-3 line-clamp-2" data-cy="listing-description">{listing.description}</p>
              
              <div class="flex items-center justify-between">
                <span class="text-lg font-bold text-green-600" data-cy="listing-price">${listing.price}/day</span>
                <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded" data-cy="listing-category">
                  {listing.category}
                </span>
              </div>
              
              <div class="mt-3 flex items-center text-sm text-gray-500">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span data-cy="listing-location">{listing.location}</span>
              </div>
              
              <button
                class="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                data-cy="view-listing-button"
              >
                View Details
              </button>
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
