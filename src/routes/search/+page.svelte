<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { searchService, GEAR_CATEGORIES, GEAR_FEATURES, type SearchFilters, type SearchResult } from '$lib/services/search';

  let searchQuery = '';
  let results: SearchResult[] = [];
  let loading = false;
  let showFilters = false;
  let totalCount = 0;
  let hasMore = false;

  // Filters
  let filters: SearchFilters = {
    query: '',
    category: '',
    priceRange: { min: 0, max: 500, period: 'day' },
    location: { radius: 25 },
    verifiedOwners: false,
    instantBook: false,
    minRating: 0,
    sortBy: 'relevance'
  };

  onMount(() => {
    // Get search query from URL params
    const urlQuery = $page.url.searchParams.get('q');
    if (urlQuery) {
      searchQuery = urlQuery;
      filters.query = urlQuery;
      performSearch();
    }
  });

  async function performSearch() {
    loading = true;
    try {
      filters.query = searchQuery;
      const searchResults = await searchService.search(filters);
      results = searchResults.results;
      totalCount = searchResults.totalCount;
      hasMore = searchResults.hasMore;
      
      // Update URL
      const url = new URL(window.location.href);
      if (searchQuery) {
        url.searchParams.set('q', searchQuery);
      } else {
        url.searchParams.delete('q');
      }
      goto(url.pathname + url.search, { replaceState: true });
      
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      loading = false;
    }
  }

  function handleSearchSubmit() {
    performSearch();
  }

  function clearFilters() {
    filters = {
      query: searchQuery,
      sortBy: 'relevance'
    };
    performSearch();
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatDistance(distance?: number) {
    if (!distance) return '';
    return distance < 1 ? `${(distance * 5280).toFixed(0)} ft` : `${distance.toFixed(1)} mi`;
  }

  function getRatingStars(rating: number) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));
  }
</script>

<svelte:head>
  <title>Search Gear - GearGrab</title>
</svelte:head>

<!-- Full Page Background -->
<div class="fixed inset-0 z-0">
  <div class="absolute inset-0">
    <img
      src="/pexels-bianca-gasparoto-834990-1752951.jpg"
      alt="Mountain landscape"
      class="w-full h-full object-cover"
    >
  </div>
  <div class="absolute inset-0 bg-black opacity-40"></div>
</div>

<!-- Page Content -->
<div class="relative z-10 min-h-screen py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <!-- Search Header -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        <!-- Search Bar -->
        <div class="flex-1 max-w-2xl">
          <form on:submit|preventDefault={handleSearchSubmit} class="flex">
            <input
              type="text"
              bind:value={searchQuery}
              placeholder="Search for camping gear, hiking equipment, bikes..."
              class="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-r-lg transition-colors"
              disabled={loading}
            >
              {#if loading}
                <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {:else}
                🔍
              {/if}
            </button>
          </form>
        </div>

        <!-- Filter Toggle -->
        <button
          class="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors flex items-center space-x-2"
          on:click={() => showFilters = !showFilters}
        >
          <span>Filters</span>
          <svg class="w-4 h-4 transform {showFilters ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </div>

      <!-- Results Summary -->
      {#if !loading && results.length > 0}
        <div class="mt-4 text-gray-300">
          Found {totalCount} results {searchQuery ? `for "${searchQuery}"` : ''}
        </div>
      {/if}
    </div>

    <!-- Filters Panel -->
    {#if showFilters}
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <!-- Category Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              bind:value={filters.category}
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Categories</option>
              {#each Object.entries(GEAR_CATEGORIES) as [key, category]}
                <option value={key}>{category.icon} {category.name}</option>
              {/each}
            </select>
          </div>

          <!-- Price Range -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Price Range ({filters.priceRange?.period || 'day'})
            </label>
            <div class="space-y-2">
              <div class="flex space-x-2">
                <input
                  type="number"
                  bind:value={filters.priceRange.min}
                  placeholder="Min"
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="number"
                  bind:value={filters.priceRange.max}
                  placeholder="Max"
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <select
                bind:value={filters.priceRange.period}
                class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="day">Per Day</option>
                <option value="week">Per Week</option>
                <option value="month">Per Month</option>
              </select>
            </div>
          </div>

          <!-- Rating Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Minimum Rating</label>
            <select
              bind:value={filters.minRating}
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value={0}>Any Rating</option>
              <option value={3}>3+ Stars</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
            </select>
          </div>

          <!-- Sort By -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
            <select
              bind:value={filters.sortBy}
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="relevance">Relevance</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="distance">Nearest First</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

        <!-- Additional Filters -->
        <div class="mt-6 pt-6 border-t border-white/20">
          <div class="flex flex-wrap gap-4">
            <label class="flex items-center">
              <input
                type="checkbox"
                bind:checked={filters.verifiedOwners}
                class="mr-2 rounded text-green-600 focus:ring-green-500"
              />
              <span class="text-white">Verified Owners Only</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                bind:checked={filters.instantBook}
                class="mr-2 rounded text-green-600 focus:ring-green-500"
              />
              <span class="text-white">Instant Book</span>
            </label>
          </div>
        </div>

        <!-- Filter Actions -->
        <div class="mt-6 flex space-x-4">
          <button
            class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            on:click={performSearch}
          >
            Apply Filters
          </button>
          <button
            class="px-6 py-2 text-gray-300 hover:text-white transition-colors"
            on:click={clearFilters}
          >
            Clear All
          </button>
        </div>
      </div>
    {/if}

    <!-- Search Results -->
    <div class="space-y-6">
      {#if loading}
        <div class="text-center py-12">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8">
            <div class="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
            <p class="text-white mt-4">Searching for gear...</p>
          </div>
        </div>
      {:else if results.length === 0}
        <div class="text-center py-12">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 class="mt-2 text-lg font-medium text-white">No gear found</h3>
            <p class="mt-1 text-gray-300">Try adjusting your search or filters</p>
          </div>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each results as item}
            <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden hover:bg-white/15 transition-all group">
              <!-- Image -->
              <div class="relative h-48 overflow-hidden">
                <img
                  src={item.images[0]}
                  alt={item.title}
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {#if item.isPromoted}
                  <div class="absolute top-2 left-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                    FEATURED
                  </div>
                {/if}
                {#if item.availability.instantBook}
                  <div class="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                    INSTANT BOOK
                  </div>
                {/if}
              </div>

              <!-- Content -->
              <div class="p-4">
                <div class="flex items-start justify-between mb-2">
                  <h3 class="text-lg font-semibold text-white line-clamp-2">{item.title}</h3>
                  <div class="text-right ml-2">
                    <div class="text-lg font-bold text-white">{formatCurrency(item.dailyPrice)}</div>
                    <div class="text-xs text-gray-300">per day</div>
                  </div>
                </div>

                <!-- Rating and Reviews -->
                <div class="flex items-center space-x-2 mb-2">
                  <span class="text-yellow-400 text-sm">{getRatingStars(item.rating)}</span>
                  <span class="text-sm text-gray-300">{item.rating}</span>
                  <span class="text-sm text-gray-400">({item.reviewCount} reviews)</span>
                </div>

                <!-- Location and Distance -->
                <div class="flex items-center text-sm text-gray-300 mb-3">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span>{item.location.city}, {item.location.state}</span>
                  {#if item.distance}
                    <span class="ml-2">• {formatDistance(item.distance)} away</span>
                  {/if}
                </div>

                <!-- Owner Info -->
                <div class="flex items-center space-x-2 mb-3">
                  <img
                    src={item.owner.avatar}
                    alt={item.owner.name}
                    class="w-6 h-6 rounded-full"
                  />
                  <span class="text-sm text-gray-300">{item.owner.name}</span>
                  {#if item.owner.isVerified}
                    <span class="text-green-400 text-xs">✓ Verified</span>
                  {/if}
                </div>

                <!-- Features -->
                <div class="flex flex-wrap gap-1 mb-3">
                  {#each item.features.slice(0, 3) as feature}
                    <span class="bg-white/10 text-xs text-gray-300 px-2 py-1 rounded">
                      {feature}
                    </span>
                  {/each}
                  {#if item.features.length > 3}
                    <span class="text-xs text-gray-400">+{item.features.length - 3} more</span>
                  {/if}
                </div>

                <!-- Action Button -->
                <button class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  View Details
                </button>
              </div>
            </div>
          {/each}
        </div>

        <!-- Load More -->
        {#if hasMore}
          <div class="text-center">
            <button class="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-6 rounded-lg transition-colors">
              Load More Results
            </button>
          </div>
        {/if}
      {/if}
    </div>

  </div>
</div>
